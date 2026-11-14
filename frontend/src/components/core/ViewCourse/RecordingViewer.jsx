import PropTypes from "prop-types";
import { useState } from 'react';
import { FaPlay, FaDownload, FaEye, FaCalendar, FaClock, FaLock, FaUnlock, FaTrash, FaCog } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
const RecordingViewer = ({
  recordings,
  isInstructor = false,
  onRecordingUpdate
}) => {
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  useState({});
  const [loading, setLoading] = useState(false);

  // Format file size
  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Handle recording view
  const handleRecordingView = async recording => {
    try {
      const token = localStorage.getItem('token');

      // Record the view for analytics
      await fetch(`/api/v1/zoom-recording/recording/${recording.databaseId}/view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          watchDuration: 0 // Will be updated periodically
        })
      });

      // Open recording in new tab
      window.open(recording.playUrl, '_blank');
      setSelectedRecording(recording);
    } catch (error) {
      console.error('Error recording view:', error);
      toast.error('Failed to record view');
    }
  };

  // Handle recording download
  const handleRecordingDownload = async recording => {
    try {
      localStorage.getItem('token'); // Check if download is allowed
      if (!recording.downloadEnabled) {
        toast.error('Download not enabled for this recording');
        return;
      }

      // Open download URL in new tab
      window.open(recording.downloadUrl, '_blank');
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Failed to download recording');
    }
  };

  // Update recording settings
  const handleSettingsUpdate = async (recordingId, settings) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/zoom-recording/recording/${recordingId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareSettings: settings
        })
      });
      if (response.ok) {
        toast.success('Recording settings updated');
        if (onRecordingUpdate) {
          onRecordingUpdate();
        }
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update recording settings');
    } finally {
      setLoading(false);
      setShowSettings(false);
    }
  };

  // Delete recording
  const handleRecordingDelete = async recordingId => {
    if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/zoom-recording/recording/${recordingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        toast.success('Recording deleted successfully');
        if (onRecordingUpdate) {
          onRecordingUpdate();
        }
      } else {
        throw new Error('Failed to delete recording');
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    } finally {
      setLoading(false);
    }
  };

  // Get recording type icon
  const getRecordingTypeIcon = type => {
    switch (type) {
      case 'shared_screen_with_speaker_view':
        return '📹';
      case 'speaker_view':
        return '👤';
      case 'gallery_view':
        return '👥';
      case 'shared_screen':
        return '🖥️';
      case 'audio_only':
        return '🎵';
      default:
        return '📹';
    }
  };
  if (!recordings || recordings.length === 0) {
    return <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
        <div className="text-gray-400 mb-4">
          <FaPlay className="text-4xl mx-auto mb-2" />
          <p>No recordings available</p>
        </div>
        <p className="text-gray-500 text-sm">
          Recordings will appear here once meetings are completed and processed.
        </p>
      </div>;
  }
  return <div className="space-y-6">
      {/* Recording Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Total Recordings</p>
              <p className="text-2xl font-bold">{recordings.length}</p>
            </div>
            <FaPlay className="text-blue-300 text-xl" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">Total Views</p>
              <p className="text-2xl font-bold">
                {recordings.reduce((sum, r) => sum + (r.viewingStats?.totalViews || 0), 0)}
              </p>
            </div>
            <FaEye className="text-green-300 text-xl" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Total Duration</p>
              <p className="text-lg font-bold">
                {formatDuration(recordings.reduce((sum, r) => sum + (r.duration || 0), 0))}
              </p>
            </div>
            <FaClock className="text-purple-300 text-xl" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-sm">Storage Used</p>
              <p className="text-lg font-bold">
                {formatFileSize(recordings.reduce((sum, r) => sum + (r.fileSize || 0), 0))}
              </p>
            </div>
            <FaDownload className="text-orange-300 text-xl" />
          </div>
        </div>
      </div>

      {/* Recording List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center">
            <FaPlay className="mr-3 text-blue-400" />
            Meeting Recordings
          </h3>
        </div>
        
        <div className="divide-y divide-white/5">
          {recordings.map((recording, index) => <div key={index} className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{getRecordingTypeIcon(recording.recordingType)}</span>
                    <div>
                      <h4 className="text-white font-semibold text-lg">{recording.topic}</h4>
                      <p className="text-gray-400 text-sm">
                        {new Date(recording.startTime).toLocaleDateString()} • 
                        {new Date(recording.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-400 mb-3">
                    <div className="flex items-center">
                      <FaClock className="mr-2" />
                      {formatDuration(recording.duration)}
                    </div>
                    <div className="flex items-center">
                      <FaDownload className="mr-2" />
                      {formatFileSize(recording.fileSize)}
                    </div>
                    <div className="flex items-center">
                      <FaEye className="mr-2" />
                      {recording.viewingStats?.totalViews || 0} views
                    </div>
                    {recording.password && <div className="flex items-center">
                        <FaLock className="mr-2" />
                        Password protected
                      </div>}
                  </div>

                  {/* Share Settings */}
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${recording.shareSettings?.allowStudents ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {recording.shareSettings?.allowStudents ? <><FaUnlock className="mr-1" /> Students can view</> : <><FaLock className="mr-1" /> Students blocked</>}
                    </span>
                    
                    {recording.shareSettings?.requirePassword && <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400">
                        <FaLock className="mr-1" /> Password required
                      </span>}
                    
                    {recording.shareSettings?.expiryDate && <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400">
                        <FaCalendar className="mr-1" /> Expires {new Date(recording.shareSettings.expiryDate).toLocaleDateString()}
                      </span>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => handleRecordingView(recording)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" title="Play recording">
                    <FaPlay />
                  </button>
                  
                  {recording.downloadEnabled && <button onClick={() => handleRecordingDownload(recording)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" title="Download recording">
                      <FaDownload />
                    </button>}
                  
                  {isInstructor && <>
                      <button onClick={() => {
                  setSelectedRecording(recording);
                  setShowSettings(true);
                }} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors" title="Settings">
                        <FaCog />
                      </button>
                      
                      <button onClick={() => handleRecordingDelete(recording.databaseId)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" title="Delete recording">
                        <FaTrash />
                      </button>
                    </>}
                </div>
              </div>
            </div>)}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && selectedRecording && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Recording Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-white">
                  <input type="checkbox" checked={selectedRecording.shareSettings?.allowStudents} onChange={e => {
                setSelectedRecording({
                  ...selectedRecording,
                  shareSettings: {
                    ...selectedRecording.shareSettings,
                    allowStudents: e.target.checked
                  }
                });
              }} className="mr-2" />
                  Allow students to view
                </label>
              </div>
              
              <div>
                <label className="flex items-center text-white">
                  <input type="checkbox" checked={selectedRecording.shareSettings?.requirePassword} onChange={e => {
                setSelectedRecording({
                  ...selectedRecording,
                  shareSettings: {
                    ...selectedRecording.shareSettings,
                    requirePassword: e.target.checked
                  }
                });
              }} className="mr-2" />
                  Require password
                </label>
              </div>
              
              <div>
                <label className="flex items-center text-white">
                  <input type="checkbox" checked={selectedRecording.shareSettings?.downloadEnabled} onChange={e => {
                setSelectedRecording({
                  ...selectedRecording,
                  shareSettings: {
                    ...selectedRecording.shareSettings,
                    downloadEnabled: e.target.checked
                  }
                });
              }} className="mr-2" />
                  Enable download
                </label>
              </div>
              
              <div>
                <label className="block text-white mb-2">Expiry Date (optional)</label>
                <input type="date" value={selectedRecording.shareSettings?.expiryDate ? new Date(selectedRecording.shareSettings.expiryDate).toISOString().split('T')[0] : ''} onChange={e => {
              setSelectedRecording({
                ...selectedRecording,
                shareSettings: {
                  ...selectedRecording.shareSettings,
                  expiryDate: e.target.value ? new Date(e.target.value) : null
                }
              });
            }} className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white" />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleSettingsUpdate(selectedRecording.databaseId, selectedRecording.shareSettings)} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
export default RecordingViewer;
RecordingViewer.propTypes = {
  "recordings": PropTypes.array,
  "courseId": PropTypes.string,
  "isInstructor": PropTypes.bool,
  "onRecordingUpdate": PropTypes.func
};
