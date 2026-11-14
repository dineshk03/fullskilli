const WebSocket = require('ws');
const { authenticateToken } = require('../utils/authenticateToken');
const { canAccessMeeting } = require('../utils/courseAuthorization');
const User = require('../models/user');
const ZoomAttendance = require('../models/zoomAttendance');

// WebSocket server for real-time attendance tracking
class AttendanceWebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId -> WebSocket connection
    this.meetingSubscribers = new Map(); // Map of meetingId -> Set of user IDs
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    console.log('🔌 Attendance WebSocket server initialized');
  }

  async handleConnection(ws, request) {
    try {
      // Extract token from query parameters or headers
      const token = this.extractToken(request);
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = await authenticateToken(token);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        ws.close(1008, 'Invalid user');
        return;
      }

      // Store client connection
      this.clients.set(user._id.toString(), ws);
      ws.userId = user._id.toString();
      ws.userRole = user.accountType;
      ws.authToken = token;

      console.log(`👤 User connected: ${user.firstName} ${user.lastName} (${user.accountType})`);

      // Handle messages from client
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        userId: user._id,
        role: user.accountType,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  extractToken(request) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    return url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');
  }

  async handleMessage(ws, message) {
    try {
      const currentUser = await authenticateToken(ws.authToken);
      ws.userRole = currentUser.accountType;
      const data = JSON.parse(message);
      if (data.meetingId && !await canAccessMeeting(currentUser, data.meetingId)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Meeting access denied' }));
        return;
      }
      if (['attendance_update', 'meeting_status'].includes(data.type) && !['Admin', 'Instructor'].includes(ws.userRole)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Instructor access required' }));
        return;
      }
      
      switch (data.type) {
        case 'subscribe_meeting':
          this.subscribeToMeeting(ws.userId, data.meetingId);
          break;
        case 'unsubscribe_meeting':
          this.unsubscribeFromMeeting(ws.userId, data.meetingId);
          break;
        case 'attendance_update':
          this.broadcastAttendanceUpdate(data.meetingId, data.attendanceData);
          break;
        case 'meeting_status':
          this.broadcastMeetingStatus(data.meetingId, data.status);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  }

  handleDisconnection(ws) {
    const userId = ws.userId;
    
    // Remove client from all meeting subscriptions
    this.meetingSubscribers.forEach((subscribers, meetingId) => {
      if (subscribers.has(userId)) {
        subscribers.delete(userId);
      }
    });

    // Remove client connection
    this.clients.delete(userId);
    
    console.log(`👋 User disconnected: ${userId}`);
  }

  subscribeToMeeting(userId, meetingId) {
    if (!this.meetingSubscribers.has(meetingId)) {
      this.meetingSubscribers.set(meetingId, new Set());
    }
    this.meetingSubscribers.get(meetingId).add(userId);
    
    console.log(`📊 User ${userId} subscribed to meeting ${meetingId}`);
    
    // Send current attendance data to subscriber
    this.sendCurrentAttendanceData(userId, meetingId);
  }

  unsubscribeFromMeeting(userId, meetingId) {
    if (this.meetingSubscribers.has(meetingId)) {
      this.meetingSubscribers.get(meetingId).delete(userId);
    }
    
    console.log(`📊 User ${userId} unsubscribed from meeting ${meetingId}`);
  }

  async sendCurrentAttendanceData(userId, meetingId) {
    try {
      const attendanceRecords = await ZoomAttendance.find({ 
        meetingId 
      }).populate('userId', 'firstName lastName email')
        .sort({ joinTime: -1 });

      const ws = this.clients.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'attendance_data',
          meetingId,
          data: attendanceRecords,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Error sending current attendance data:', error);
    }
  }

  broadcastAttendanceUpdate(meetingId, attendanceData) {
    const subscribers = this.meetingSubscribers.get(meetingId);
    
    if (subscribers) {
      const message = JSON.stringify({
        type: 'attendance_update',
        meetingId,
        data: attendanceData,
        timestamp: new Date().toISOString()
      });

      subscribers.forEach(userId => {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  broadcastMeetingStatus(meetingId, status) {
    const subscribers = this.meetingSubscribers.get(meetingId);
    
    if (subscribers) {
      const message = JSON.stringify({
        type: 'meeting_status',
        meetingId,
        status,
        timestamp: new Date().toISOString()
      });

      subscribers.forEach(userId => {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  // Notify all admin users about new attendance
  async notifyAdmins(meetingId, action, data) {
    try {
      const admins = await User.find({ accountType: 'Admin' });
      
      admins.forEach(admin => {
        const ws = this.clients.get(admin._id.toString());
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'admin_notification',
            action,
            meetingId,
            data,
            timestamp: new Date().toISOString()
          }));
        }
      });
    } catch (error) {
      console.error('❌ Error notifying admins:', error);
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.clients.size,
      meetingSubscriptions: Object.fromEntries(
        Array.from(this.meetingSubscribers.entries()).map(([meetingId, subscribers]) => [
          meetingId,
          subscribers.size
        ])
      )
    };
  }
}

module.exports = AttendanceWebSocketServer;
