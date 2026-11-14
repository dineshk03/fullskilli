const WebSocket = require('ws');
const { authenticateToken } = require('../utils/authenticateToken');
const { canAccessMeeting } = require('../utils/courseAuthorization');
const { initializeNotificationSystem } = require('../services/notificationService');

// WebSocket server configuration
const createWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    verifyClient: (info) => {
      // Basic verification - you can add more sophisticated checks
      return true;
    }
  });

  console.log('🔌 WebSocket server initialized');

  // Store connected clients by role and meeting
  const clients = new Map();
  const meetingSubscriptions = new Map();

  // Handle new connections
  wss.on('connection', (ws, req) => {
    console.log('🔗 New WebSocket connection established');
    
    let userId = null;
    let userRole = null;
    let isAuthenticated = false;
    let authToken = null;

    // Handle authentication
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'authenticate':
            // Verify JWT token
            try {
              const decoded = await authenticateToken(data.token);
              if (userId && userId !== decoded.id) return ws.close();
              authToken = data.token;
              userId = decoded.id;
              userRole = decoded.accountType;
              isAuthenticated = true;
              
              // Store client info
              clients.set(ws, {
                userId,
                userRole,
                email: decoded.email,
                firstName: decoded.firstName,
                connectedAt: new Date()
              });
              
              ws.send(JSON.stringify({
                type: 'authenticated',
                success: true,
                message: 'Authentication successful'
              }));
              
              console.log(`✅ User authenticated: ${decoded.email} (${userRole})`);
              
            } catch (authError) {
              console.error('❌ Authentication failed:', authError.message);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Authentication failed'
              }));
              ws.close();
            }
            break;
            
          case 'subscribe_meeting':
            if (!isAuthenticated) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Authentication required'
              }));
              return;
            }
            
            const meetingId = data.meetingId;
            if (!await canAccessMeeting({ id: userId, accountType: userRole }, meetingId)) {
              return ws.send(JSON.stringify({ type: 'error', message: 'Meeting access denied' }));
            }
            if (!meetingSubscriptions.has(meetingId)) {
              meetingSubscriptions.set(meetingId, new Set());
            }
            meetingSubscriptions.get(meetingId).add(ws);
            
            ws.send(JSON.stringify({
              type: 'subscribed',
              meetingId,
              message: `Subscribed to meeting ${meetingId}`
            }));
            
            console.log(`📝 User ${userId} subscribed to meeting ${meetingId}`);
            break;
            
          case 'unsubscribe_meeting':
            if (!isAuthenticated) return;
            
            const unsubMeetingId = data.meetingId;
            if (meetingSubscriptions.has(unsubMeetingId)) {
              meetingSubscriptions.get(unsubMeetingId).delete(ws);
              if (meetingSubscriptions.get(unsubMeetingId).size === 0) {
                meetingSubscriptions.delete(unsubMeetingId);
              }
            }
            
            ws.send(JSON.stringify({
              type: 'unsubscribed',
              meetingId: unsubMeetingId,
              message: `Unsubscribed from meeting ${unsubMeetingId}`
            }));
            break;
            
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
            
          default:
            console.log(`📨 Unknown message type: ${data.type}`);
        }
        
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    // Handle disconnections
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      
      // Remove client from all subscriptions
      for (const [meetingId, subscribers] of meetingSubscriptions.entries()) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          meetingSubscriptions.delete(meetingId);
        }
      }
      
      // Remove client
      clients.delete(ws);
      
      if (userId) {
        console.log(`👋 User ${userId} disconnected`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'WebSocket connection established. Please authenticate.',
      timestamp: new Date().toISOString()
    }));
  });

  // Broadcast functions
  const broadcastToMeeting = (meetingId, message) => {
    const subscribers = meetingSubscriptions.get(meetingId);
    if (subscribers) {
      const messageData = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        meetingId
      });
      
      subscribers.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageData);
        }
      });
      
      console.log(`📢 Broadcasted to ${subscribers.size} subscribers for meeting ${meetingId}`);
    }
  };

  const broadcastToRole = (role, message) => {
    clients.forEach((clientInfo, client) => {
      if (clientInfo.userRole === role && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  const broadcastToAll = (message) => {
    clients.forEach((clientInfo, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  };

  // Get connection statistics
  const getStats = () => {
    const stats = {
      totalConnections: clients.size,
      meetingSubscriptions: meetingSubscriptions.size,
      connectionsByRole: {},
      activeMeetings: Array.from(meetingSubscriptions.keys())
    };
    
    clients.forEach(client => {
      const role = client.userRole || 'unknown';
      stats.connectionsByRole[role] = (stats.connectionsByRole[role] || 0) + 1;
    });
    
    return stats;
  };

  // Expose functions for external use
  global.wsBroadcast = {
    toMeeting: broadcastToMeeting,
    toRole: broadcastToRole,
    toAll: broadcastToAll,
    getStats
  };

  // Periodic cleanup
  setInterval(() => {
    // Remove dead connections
    for (const [client, clientInfo] of clients.entries()) {
      if (client.readyState !== WebSocket.OPEN) {
        clients.delete(client);
        
        // Remove from subscriptions
        for (const [meetingId, subscribers] of meetingSubscriptions.entries()) {
          subscribers.delete(client);
          if (subscribers.size === 0) {
            meetingSubscriptions.delete(meetingId);
          }
        }
      }
    }
    
    const stats = getStats();
    console.log(`🧹 WebSocket cleanup - Stats:`, stats);
  }, 30000); // Every 30 seconds

  return wss;
};

// Initialize notification system
const initializeServices = () => {
  try {
    // Initialize email notification system
    initializeNotificationSystem();
    console.log('📧 Notification system initialized');
    
    // Add any other service initializations here
    
  } catch (error) {
    console.error('❌ Error initializing services:', error);
  }
};

module.exports = {
  createWebSocketServer,
  initializeServices
};
