import { BASE_URL as SERVER_URL } from '../../../config/api';
import PropTypes from "prop-types";
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaUsers, FaUserPlus, FaUserMinus, FaClock, FaSignal } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
const RealTimeAttendance = ({
  meetingId,
  isInstructor = false
}) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    enrolledStudents: 0,
    currentlyInMeeting: 0,
    completedParticipants: 0,
    averageDuration: 0,
    recentJoins: []
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  // WebSocket connection

  const handleAttendanceUpdate = useCallback(data => {
    const {
      action,
      participant
    } = data;
    setAttendanceData(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(p => p.participantEmail === participant.email);
      if (action === 'participant_joined') {
        if (existingIndex === -1) {
          updated.push({
            participantName: participant.name,
            participantEmail: participant.email,
            userId: participant.userId,
            joinTime: participant.joinTime,
            status: 'joined',
            duration: 0
          });
        }
      } else if (action === 'participant_left') {
        if (existingIndex !== -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: 'completed',
            leaveTime: participant.leaveTime,
            duration: participant.duration
          };
        }
      }
      return updated;
    });

    // Show notification for instructors
    if (isInstructor) {
      if (action === 'participant_joined') {
        toast.success(`${participant.name} joined the meeting`);
      } else if (action === 'participant_left') {
        toast(`${participant.name} left the meeting`);
      }
    }
  }, [isInstructor]);
  const handleWebSocketMessage = useCallback(data => {
    setLastUpdate(new Date());
    switch (data.type) {
      case 'connection':
        console.log('✅ WebSocket connection confirmed');
        break;
      case 'attendance_data':
        setAttendanceData(data.data || []);
        calculateStats(data.data || []);
        break;
      case 'attendance_update':
        handleAttendanceUpdate(data);
        break;
      case 'meeting_status':
        handleMeetingStatus(data);
        break;
      case 'admin_notification':
        if (isInstructor) {
          handleAdminNotification(data);
        }
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [handleAttendanceUpdate, isInstructor]);
  const connectWebSocket = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = new URL(SERVER_URL || window.location.origin);
      endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
      endpoint.searchParams.set('token', token);
      const wsUrl = endpoint.toString();
      ws.current = new WebSocket(wsUrl);
      ws.current.onopen = () => {
        setConnectionStatus('connected');
        console.log('🔌 Connected to attendance WebSocket');

        // Subscribe to meeting updates
        ws.current.send(JSON.stringify({
          type: 'subscribe_meeting',
          meetingId: meetingId
        }));

        // Request current attendance data
        ws.current.send(JSON.stringify({
          type: 'get_attendance_data',
          meetingId: meetingId
        }));
      };
      ws.current.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
      ws.current.onclose = () => {
        setConnectionStatus('disconnected');
        console.log('🔌 WebSocket connection closed');

        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          setConnectionStatus('reconnecting');
          connectWebSocket();
        }, 3000);
      };
      ws.current.onerror = error => {
        setConnectionStatus('error');
        console.error('❌ WebSocket error:', error);
        toast.error('Connection error. Reconnecting...');
      };
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [handleWebSocketMessage, meetingId]);
  useEffect(() => {
    if (!meetingId) return;
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, meetingId]);
  const disconnectWebSocket = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };
  const handleMeetingStatus = data => {
    console.log('📊 Meeting status updated:', data.status);
    // You can handle meeting status changes here
  };
  const handleAdminNotification = data => {
    const {
      action,
      participantName,
      meetingTitle
    } = data;
    if (action === 'participant_joined') {
      toast.success(`${participantName} joined ${meetingTitle}`);
    } else if (action === 'participant_left') {
      toast(`${participantName} left ${meetingTitle}`);
    }
  };
  const calculateStats = data => {
    const totalParticipants = data.length;
    const enrolledStudents = data.filter(p => p.userId).length;
    const currentlyInMeeting = data.filter(p => p.status === 'joined').length;
    const completedParticipants = data.filter(p => p.status === 'completed').length;
    const averageDuration = data.reduce((sum, p) => sum + (p.duration || 0), 0) / totalParticipants || 0;
    const recentJoins = data.filter(p => p.joinTime && new Date(p.joinTime) > new Date(Date.now() - 5 * 60 * 1000)).map(p => ({
      name: p.participantName,
      email: p.participantEmail,
      joinTime: p.joinTime,
      isStudent: !!p.userId
    }));
    setStats({
      totalParticipants,
      enrolledStudents,
      currentlyInMeeting,
      completedParticipants,
      averageDuration,
      recentJoins
    });
  };
  const formatDuration = minutes => {
    if (!minutes) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'reconnecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };
  return <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <FaUsers className="mr-3 text-blue-400" />
          Real-Time Attendance
        </h3>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${getConnectionColor()}`}>
            <FaSignal className="mr-2" />
            <span className="text-sm font-medium">{getConnectionText()}</span>
          </div>
          
          {lastUpdate && <div className="text-gray-400 text-sm">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Total</p>
              <p className="text-2xl font-bold">{stats.totalParticipants}</p>
            </div>
            <FaUsers className="text-blue-300 text-xl" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">In Meeting</p>
              <p className="text-2xl font-bold">{stats.currentlyInMeeting}</p>
            </div>
            <FaUserPlus className="text-green-300 text-xl" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Students</p>
              <p className="text-2xl font-bold">{stats.enrolledStudents}</p>
            </div>
            <FaUsers className="text-purple-300 text-xl" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-sm">Completed</p>
              <p className="text-2xl font-bold">{stats.completedParticipants}</p>
            </div>
            <FaUserMinus className="text-orange-300 text-xl" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-200 text-sm">Avg Duration</p>
              <p className="text-lg font-bold">{formatDuration(stats.averageDuration)}</p>
            </div>
            <FaClock className="text-cyan-300 text-xl" />
          </div>
        </div>
      </div>

      {/* Recent Joins */}
      {stats.recentJoins.length > 0 && <div className="bg-white/5 rounded-xl p-4 mb-6">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <FaUserPlus className="mr-2 text-green-400" />
            Recent Joins (Last 5 minutes)
          </h4>
          <div className="space-y-2">
            {stats.recentJoins.map((join, index) => <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${join.isStudent ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-gray-300">{join.name}</span>
                  {join.isStudent && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      Student
                    </span>}
                </div>
                <span className="text-gray-500">
                  {new Date(join.joinTime).toLocaleTimeString()}
                </span>
              </div>)}
          </div>
        </div>}

      {/* Participant List */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h4 className="text-white font-semibold">All Participants</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {attendanceData.length === 0 ? <div className="p-8 text-center text-gray-400">
              No participants yet
            </div> : <div className="divide-y divide-white/5">
              {attendanceData.map((participant, index) => <div key={index} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${participant.status === 'joined' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <div>
                      <p className="text-white font-medium">{participant.participantName}</p>
                      <p className="text-gray-400 text-sm">{participant.participantEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${participant.status === 'joined' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {participant.status === 'joined' ? 'In Meeting' : 'Left'}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {formatDuration(participant.duration || 0)}
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>
      </div>
    </div>;
};
export default RealTimeAttendance;
RealTimeAttendance.propTypes = {
  "meetingId": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "isInstructor": PropTypes.bool
};
