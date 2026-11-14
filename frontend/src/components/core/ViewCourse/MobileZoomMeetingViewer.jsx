import PropTypes from "prop-types";
import { useState, useEffect } from 'react';
import { FaMobileAlt, FaTabletAlt, FaLaptop, FaPlay, FaUsers, FaClock, FaVideo, FaCalendar, FaBell, FaWifi, FaSignal, FaBatteryFull } from 'react-icons/fa';
const MobileZoomMeetingViewer = ({
  meeting,
  isInstructor = false,
  onJoinMeeting
}) => {
  useState('checking');
  const [deviceType, setDeviceType] = useState('desktop');
  const [networkQuality, setNetworkQuality] = useState('good');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [countdown, setCountdown] = useState('');
  const [showMobileTips, setShowMobileTips] = useState(false);

  // Detect device type
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        setDeviceType('mobile');
      } else if (width <= 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Check network quality
  useEffect(() => {
    const checkNetworkQuality = async () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const quality = connection.effectiveType || '4g';
        setNetworkQuality(quality);
      }
    };
    checkNetworkQuality();
    const interval = setInterval(checkNetworkQuality, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check battery level
  useEffect(() => {
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }
    };
    checkBattery();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!meeting?.startTime) return;
    const updateCountdown = () => {
      const now = new Date();
      const meetingTime = new Date(meeting.startTime);
      const diff = meetingTime - now;
      if (diff <= 0) {
        setCountdown('Started');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
      const seconds = Math.floor(diff % (1000 * 60) / 1000);
      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [meeting?.startTime]);

  // Get device icon
  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <FaMobileAlt />;
      case 'tablet':
        return <FaTabletAlt />;
      default:
        return <FaLaptop />;
    }
  };

  // Get network quality color
  const getNetworkQualityColor = () => {
    switch (networkQuality) {
      case 'slow-2g':
      case '2g':
        return 'text-red-500';
      case '3g':
        return 'text-yellow-500';
      case '4g':
      default:
        return 'text-green-500';
    }
  };

  // Get battery color
  const getBatteryColor = () => {
    if (batteryLevel < 20) return 'text-red-500';
    if (batteryLevel < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Mobile optimization tips
  const mobileTips = ['Use Wi-Fi instead of cellular data for better quality', 'Close other apps to save battery and improve performance', 'Use headphones with microphone for better audio', 'Find a quiet, well-lit location', 'Enable "Do Not Disturb" to avoid interruptions', 'Charge your device before the meeting', 'Use landscape orientation for better video quality'];
  if (deviceType === 'desktop') {
    return <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="text-center text-gray-400">
          <FaLaptop className="text-4xl mx-auto mb-4" />
          <p>This mobile-optimized view is best experienced on mobile or tablet devices.</p>
        </div>
      </div>;
  }
  return <div className="space-y-4">
      {/* Device Status Bar */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-white font-medium">{getDeviceIcon()}</span>
            <span className="text-white capitalize">{deviceType} View</span>
          </div>
          <button onClick={() => setShowMobileTips(!showMobileTips)} className="text-blue-400 hover:text-blue-300 transition-colors">
            <FaBell />
          </button>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <FaWifi className={`mx-auto mb-1 ${getNetworkQualityColor()}`} />
            <p className="text-xs text-gray-400">Network</p>
            <p className="text-xs text-white capitalize">{networkQuality}</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-2">
            <FaSignal className="mx-auto mb-1 text-green-400" />
            <p className="text-xs text-gray-400">Signal</p>
            <p className="text-xs text-white">Good</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-2">
            <FaBatteryFull className={`mx-auto mb-1 ${getBatteryColor()}`} />
            <p className="text-xs text-gray-400">Battery</p>
            <p className="text-xs text-white">{batteryLevel}%</p>
          </div>
        </div>
      </div>

      {/* Mobile Tips */}
      {showMobileTips && <div className="bg-blue-600/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <FaMobileAlt className="mr-2" />
            Mobile Meeting Tips
          </h4>
          <ul className="space-y-2">
            {mobileTips.map((tip, index) => <li key={index} className="text-blue-200 text-sm flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                {tip}
              </li>)}
          </ul>
        </div>}

      {/* Meeting Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{meeting?.topic || 'Meeting'}</h3>
          <div className="flex items-center justify-center space-x-4 text-gray-400">
            <div className="flex items-center">
              <FaCalendar className="mr-2" />
              <span className="text-sm">
                {meeting?.startTime ? new Date(meeting.startTime).toLocaleDateString() : 'TBD'}
              </span>
            </div>
            <div className="flex items-center">
              <FaClock className="mr-2" />
              <span className="text-sm">{meeting?.duration || 60} min</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 mb-6">
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1">Starts in</p>
            <p className="text-2xl font-bold text-white">{countdown}</p>
          </div>
        </div>

        {/* Meeting Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <FaUsers className="text-blue-400 mx-auto mb-2" />
            <p className="text-white text-lg font-semibold">
              {meeting?.totalParticipants || 0}
            </p>
            <p className="text-gray-400 text-xs">Participants</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <FaVideo className="text-green-400 mx-auto mb-2" />
            <p className="text-white text-lg font-semibold">HD</p>
            <p className="text-gray-400 text-xs">Video Quality</p>
          </div>
        </div>

        {/* Join Button */}
        <button onClick={() => onJoinMeeting(meeting)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
          <FaPlay />
          <span>{isInstructor ? 'Start Meeting' : 'Join Meeting'}</span>
        </button>

        {/* Meeting Info */}
        {meeting?.password && <div className="mt-4 bg-white/5 rounded-lg p-3">
            <p className="text-gray-400 text-sm mb-1">Meeting Password:</p>
            <p className="text-white font-mono">{meeting.password}</p>
          </div>}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-white hover:bg-white/20 transition-colors">
          <FaCalendar className="mx-auto mb-2" />
          <p className="text-sm">Add to Calendar</p>
        </button>
        
        <button className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-white hover:bg-white/20 transition-colors">
          <FaBell className="mx-auto mb-2" />
          <p className="text-sm">Set Reminder</p>
        </button>
      </div>
    </div>;
};
export default MobileZoomMeetingViewer;
MobileZoomMeetingViewer.propTypes = {
  "meeting": PropTypes.shape({
    "startTime": PropTypes.string,
    "topic": PropTypes.string,
    "duration": PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    "totalParticipants": PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    "password": PropTypes.string
  }),
  "isInstructor": PropTypes.bool,
  "onJoinMeeting": PropTypes.func
};
