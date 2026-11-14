import PropTypes from "prop-types";
import { useState, useEffect, useRef, useCallback } from "react";
import { FiVideo, FiClock, FiUsers, FiExternalLink, FiCalendar, FiLock, FiAlertCircle, FiBarChart2, FiDownload, FiShare2 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { apiConnector } from "../../../services/apiConnector";
import { zoomEndpoints } from "../../../services/apis";
const {
  GET_ZOOM_MEETING_API,
  TRACK_ENGAGEMENT_API
} = zoomEndpoints;
export default function EnhancedZoomMeetingViewer({
  subSectionId
}) {
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeUntilMeeting, setTimeUntilMeeting] = useState("");
  useState(false);
  const [showEngagement, setShowEngagement] = useState(false);
  useState(null);
  const [reactions, setReactions] = useState([]);
  const {
    token
  } = useSelector(state => state.auth);
  const {
    user
  } = useSelector(state => state.profile);
  const engagementTrackerRef = useRef(null);

  // Fetch meeting details
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiConnector("GET", GET_ZOOM_MEETING_API.replace(":subSectionId", subSectionId), null, {
          Authorization: `Bearer ${token}`
        });
        if (response.data.success) {
          setMeetingData(response.data.data);
        } else {
          setError("No Zoom meeting scheduled for this lecture");
        }
      } catch (error) {
        console.error("Error fetching meeting details:", error);
        if (error.response?.status === 404) {
          setMeetingData(null);
        } else if (error.response?.status === 500) {
          setError("Meeting service temporarily unavailable");
        } else {
          setError(error.response?.data?.message || "Failed to load meeting details");
        }
      } finally {
        setLoading(false);
      }
    };
    if (subSectionId && token) {
      fetchMeetingDetails();
    }
  }, [subSectionId, token]);

  // Engagement tracking

  // Track engagement event
  const trackEvent = useCallback(async (eventType, details = {}) => {
    if (!meetingData?.meeting?.id) return;
    try {
      await apiConnector("POST", TRACK_ENGAGEMENT_API, {
        meetingId: meetingData.meeting.id,
        subSectionId,
        event: eventType,
        details
      }, {
        Authorization: `Bearer ${token}`
      });
    } catch (error) {
      console.error("Error tracking engagement:", error);
    }
  }, [meetingData?.meeting?.id, subSectionId, token]);

  // Update engagement metrics
  const updateEngagement = useCallback(async metrics => {
    if (!meetingData?.meeting?.id) return;
    try {
      await apiConnector("PATCH", TRACK_ENGAGEMENT_API, {
        meetingId: meetingData.meeting.id,
        subSectionId,
        metrics
      }, {
        Authorization: `Bearer ${token}`
      });
    } catch (error) {
      console.error("Error updating engagement:", error);
    }
  }, [meetingData?.meeting?.id, subSectionId, token]);

  // Handle reactions
  useEffect(() => {
    if (!meetingData?.meeting?.id) return;
    const trackEngagement = () => {
      // Track page visibility
      if (document.hidden) {
        trackEvent('tab_switch');
      }

      // Track active time
      if (!document.hidden) {
        updateEngagement({
          activeTime: 1
        });
      }
    };

    // Start engagement tracking
    engagementTrackerRef.current = setInterval(trackEngagement, 1000);

    // Track page visibility changes
    document.addEventListener('visibilitychange', trackEngagement);
    return () => {
      if (engagementTrackerRef.current) {
        clearInterval(engagementTrackerRef.current);
      }
      document.removeEventListener('visibilitychange', trackEngagement);
    };
  }, [meetingData, trackEvent, updateEngagement]);

  // Update countdown timer
  useEffect(() => {
    if (!meetingData?.meeting?.startTime) return;
    const updateTimer = () => {
      const now = new Date().getTime();
      const meetingTime = new Date(meetingData.meeting.startTime).getTime();
      const difference = meetingTime - now;
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(difference % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
        const minutes = Math.floor(difference % (1000 * 60 * 60) / (1000 * 60));
        const seconds = Math.floor(difference % (1000 * 60) / 1000);
        if (days > 0) {
          setTimeUntilMeeting(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeUntilMeeting(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeUntilMeeting(`${minutes}m ${seconds}s`);
        } else {
          setTimeUntilMeeting(`${seconds}s`);
        }
      } else if (difference > -3600000) {
        setTimeUntilMeeting("Meeting in progress");
      } else {
        setTimeUntilMeeting("Meeting ended");
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [meetingData]);
  const sendReaction = reactionType => {
    const reaction = {
      id: Date.now(),
      type: reactionType,
      user: user.firstName,
      timestamp: new Date()
    };
    setReactions(prev => [...prev, reaction]);
    trackEvent('reaction', {
      type: reactionType
    });

    // Remove reaction after animation
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
    toast.success(`${reactionType} reaction sent!`);
  };
  const handleJoinMeeting = () => {
    if (meetingData?.meeting?.joinUrl) {
      trackEvent('joined');
      window.open(meetingData.meeting.joinUrl, '_blank', 'noopener,noreferrer');
      toast.success("Opening Zoom meeting...");
    } else {
      toast.error("Meeting link not available");
    }
  };
  const handleStartMeeting = () => {
    if (meetingData?.meeting?.startUrl) {
      trackEvent('joined');
      window.open(meetingData.meeting.startUrl, '_blank', 'noopener,noreferrer');
      toast.success("Starting Zoom meeting...");
    } else {
      toast.error("Start link not available");
    }
  };
  const formatDateTime = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };
  const getMeetingStatus = () => {
    if (!meetingData?.meeting?.startTime) return 'scheduled';
    const now = new Date().getTime();
    const meetingTime = new Date(meetingData.meeting.startTime).getTime();
    const endTime = meetingTime + meetingData.meeting.duration * 60 * 1000;
    if (now < meetingTime - 600000) return 'upcoming';
    if (now < meetingTime) return 'starting-soon';
    if (now < endTime) return 'in-progress';
    return 'ended';
  };
  const getStatusColor = status => {
    switch (status) {
      case 'upcoming':
        return 'from-blue-500 to-cyan-500';
      case 'starting-soon':
        return 'from-yellow-500 to-orange-500';
      case 'in-progress':
        return 'from-green-500 to-emerald-500';
      case 'ended':
        return 'from-gray-500 to-slate-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };
  const getStatusText = status => {
    switch (status) {
      case 'upcoming':
        return 'Scheduled';
      case 'starting-soon':
        return 'Starting Soon';
      case 'in-progress':
        return 'Live Now';
      case 'ended':
        return 'Ended';
      default:
        return 'Scheduled';
    }
  };
  if (loading) {
    return <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-600/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="p-8 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white font-medium">Loading meeting details...</p>
                    </div>
                </div>
            </div>;
  }
  if (error) {
    return <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-600/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FiAlertCircle className="text-white text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Meeting Unavailable</h3>
                    <p className="text-slate-300">{error}</p>
                </div>
            </div>;
  }
  if (!meetingData || !meetingData.meeting || !meetingData.meeting.id || !meetingData.meeting.topic) {
    return <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-600/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FiVideo className="text-white text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Live Session Scheduled</h3>
                    <p className="text-slate-300 mb-4">No Zoom meeting has been scheduled for this lecture.</p>
                    <p className="text-slate-400 text-sm">Check back later or contact your instructor for live session updates.</p>
                </div>
            </div>;
  }
  const meeting = meetingData.meeting;
  const userRole = meetingData.userRole;
  const status = getMeetingStatus();
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);
  return <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-600/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Floating Reactions */}
            <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-50 overflow-hidden">
                {reactions.map(reaction => <div key={reaction.id} className="absolute animate-float-up" style={{
        left: `${Math.random() * 80 + 10}%`,
        bottom: '10%',
        fontSize: '2rem',
        animation: 'floatUp 3s ease-out forwards'
      }}>
                        {reaction.type === 'thumbs-up' && '👍'}
                        {reaction.type === 'heart' && '❤️'}
                        {reaction.type === 'star' && '⭐'}
                        {reaction.type === 'clap' && '👏'}
                        {reaction.type === 'smile' && '😊'}
                    </div>)}
            </div>

            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 px-6 py-4 border-b border-slate-600/50 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className={`w-14 h-14 bg-gradient-to-r ${statusColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                                <FiVideo className="text-white text-2xl" />
                            </div>
                            {status === 'in-progress' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-800 animate-pulse"></div>}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Live Zoom Session
                            </h3>
                            <p className="text-sm text-slate-400">Interactive online lecture</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 bg-gradient-to-r ${statusColor}/20 text-white rounded-full text-sm font-medium border border-current/30`}>
                            {statusText}
                        </div>
                        {status === 'in-progress' && <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30 animate-pulse">
                                🔴 LIVE
                            </div>}
                    </div>
                </div>
            </div>

            {/* Meeting Details */}
            <div className="p-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Meeting Info */}
                        <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
                            <h4 className="text-2xl font-bold text-white mb-4">{meeting.topic}</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <FiCalendar className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Scheduled Time</p>
                                        <p className="font-medium text-white">{formatDateTime(meeting.startTime)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-slate-300">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                        <FiClock className="text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Duration</p>
                                        <p className="font-medium text-white">{meeting.duration} minutes</p>
                                    </div>
                                </div>
                            </div>

                            {meeting.agenda && <div className="mb-6">
                                    <h5 className="text-lg font-semibold text-white mb-2">Meeting Agenda</h5>
                                    <p className="text-slate-300 bg-slate-800/50 rounded-xl p-4">{meeting.agenda}</p>
                                </div>}

                            {/* Countdown Timer */}
                            {timeUntilMeeting && status !== 'ended' && <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20">
                                    <div className="text-center">
                                        <p className="text-sm text-slate-400 mb-1">
                                            {status === 'in-progress' ? 'Meeting Status' : 'Time Until Meeting'}
                                        </p>
                                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                            {timeUntilMeeting}
                                        </p>
                                    </div>
                                </div>}
                        </div>

                        {/* Meeting Access */}
                        <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-600/10 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                    <FiUsers className="text-white text-xl" />
                                </div>
                                <div>
                                    <h5 className="text-lg font-semibold text-white">Meeting Access</h5>
                                    <p className="text-sm text-slate-400">Join the live session</p>
                                </div>
                            </div>

                            {meeting.password && <div className="mb-4 p-4 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FiLock className="text-yellow-400" />
                                        <span className="text-sm font-medium text-slate-300">Meeting Password</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <code className="bg-slate-700 px-3 py-2 rounded-lg text-white font-mono text-lg">
                                            {meeting.password}
                                        </code>
                                        <button onClick={() => {
                  navigator.clipboard.writeText(meeting.password);
                  toast.success("Password copied to clipboard!");
                }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                                            Copy
                                        </button>
                                    </div>
                                </div>}

                            <div className="flex flex-col sm:flex-row gap-3">
                                {userRole === 'instructor' && meeting.startUrl && <button onClick={handleStartMeeting} className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                                        <FiVideo className="text-xl group-hover:scale-110 transition-transform" />
                                        <span>Start Meeting (Host)</span>
                                        <FiExternalLink className="text-sm group-hover:rotate-12 transition-transform" />
                                    </button>}

                                <button onClick={handleJoinMeeting} disabled={status === 'ended'} className={`group flex items-center justify-center gap-3 px-6 py-4 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform ${status === 'ended' ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'}`}>
                                    <FiUsers className="text-xl group-hover:scale-110 transition-transform" />
                                    <span>{status === 'ended' ? 'Meeting Ended' : 'Join Meeting'}</span>
                                    {status !== 'ended' && <FiExternalLink className="text-sm group-hover:rotate-12 transition-transform" />}
                                </button>
                            </div>
                        </div>

                        {/* Quick Reactions */}
                        {status === 'in-progress' && <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
                                <h5 className="text-lg font-semibold text-white mb-4">Quick Reactions</h5>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => sendReaction('thumbs-up')} className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-white rounded-lg transition-all duration-300 hover:scale-110 transform">
                                        👍 Thumbs Up
                                    </button>
                                    <button onClick={() => sendReaction('heart')} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-white rounded-lg transition-all duration-300 hover:scale-110 transform">
                                        ❤️ Love It
                                    </button>
                                    <button onClick={() => sendReaction('star')} className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-white rounded-lg transition-all duration-300 hover:scale-110 transform">
                                        ⭐ Star
                                    </button>
                                    <button onClick={() => sendReaction('clap')} className="px-4 py-2 bg-green-600/20 hover:bg-green-600/40 text-white rounded-lg transition-all duration-300 hover:scale-110 transform">
                                        👏 Applause
                                    </button>
                                    <button onClick={() => sendReaction('smile')} className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-white rounded-lg transition-all duration-300 hover:scale-110 transform">
                                        😊 Smile
                                    </button>
                                </div>
                            </div>}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Meeting Instructions */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 border border-blue-500/20 backdrop-blur-sm">
                            <h6 className="text-sm font-semibold text-white mb-3">📋 Meeting Instructions</h6>
                            <div className="space-y-2 text-sm text-slate-300">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Join 5 minutes early</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Mute microphone on entry</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Use headphones for better audio</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span>Have stable internet connection</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20">
                            <h6 className="text-sm font-semibold text-white mb-3">⚡ Quick Actions</h6>
                            <div className="space-y-2">
                                <button onClick={() => setShowEngagement(!showEngagement)} className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-white rounded-lg transition-all">
                                    <FiBarChart2 />
                                    <span className="text-sm">View Engagement</span>
                                </button>
                                <button onClick={() => {
                const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${new Date(meeting.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(new Date(meeting.startTime).getTime() + meeting.duration * 60000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${meeting.topic}
DESCRIPTION:${meeting.agenda || 'Zoom Meeting'}
LOCATION:${meeting.joinUrl}
END:VEVENT
END:VCALENDAR`;
                const blob = new Blob([icsContent], {
                  type: 'text/calendar'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'meeting.ics';
                a.click();
                toast.success("Calendar invite downloaded!");
              }} className="w-full flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/40 text-white rounded-lg transition-all">
                                    <FiDownload />
                                    <span className="text-sm">Add to Calendar</span>
                                </button>
                                <button onClick={() => {
                navigator.clipboard.writeText(meeting.joinUrl);
                toast.success("Meeting link copied!");
              }} className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-white rounded-lg transition-all">
                                    <FiShare2 />
                                    <span className="text-sm">Share Link</span>
                                </button>
                            </div>
                        </div>

                        {/* Live Stats (if meeting is in progress) */}
                        {status === 'in-progress' && <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-4 border border-green-500/20">
                                <h6 className="text-sm font-semibold text-white mb-3">📊 Live Stats</h6>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Status</span>
                                        <span className="text-sm font-medium text-green-400">● Active</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Your Time</span>
                                        <span className="text-sm font-medium text-white">
                                            {Math.floor((Date.now() - new Date(meeting.startTime).getTime()) / 60000)} min
                                        </span>
                                    </div>
                                </div>
                            </div>}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
        </div>;
}
EnhancedZoomMeetingViewer.propTypes = {
  "subSectionId": PropTypes.string,
  "lectureTitle": PropTypes.string
};
