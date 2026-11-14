import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { markLectureAsComplete } from "../../../services/operations/courseDetailsAPI";
import { updateCompletedLectures } from "../../../slices/viewCourseSlice";
import { setCourseViewSidebar } from "../../../slices/sidebarSlice";
import { ACCOUNT_TYPE } from "../../../utils/constants";
import DocumentViewer from "./DocumentViewer";
import ZoomMeetingViewer from './EnhancedZoomMeetingViewer';
import RealTimeAttendance from './RealTimeAttendance';
import RecordingViewer from './RecordingViewer';
import { HiMenuAlt1 } from 'react-icons/hi';
import { FiChevronDown, FiChevronUp, FiEye, FiEyeOff, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

// Video player imports
import { Player, BigPlayButton, ControlBar, VolumeMenuButton, PlaybackRateMenuButton, ReplayControl, ForwardControl } from 'video-react';
import 'video-react/dist/video-react.css';
const VideoDetails = () => {
  const {
    courseId,
    sectionId,
    subSectionId
  } = useParams();
  const navigate = useNavigate();
  useLocation();
  const playerRef = useRef(null);
  const dispatch = useDispatch();
  const {
    token
  } = useSelector(state => state.auth);
  const {
    user
  } = useSelector(state => state.auth);
  const {
    courseSectionData,
    courseEntireData,
    completedLectures
  } = useSelector(state => state.viewCourse);
  const {
    courseViewSidebar
  } = useSelector(state => state.sidebar);
  const [videoData, setVideoData] = useState(null);
  const [, setPreviewSource] = useState("");
  const [, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingVideo] = useState(false);
  const [videoAvailable] = useState(true);
  const [playbackSpeed] = useState(1);
  const progressStorageKey = useMemo(() => {
    if (!courseId || !subSectionId) return null;
    return `video-progress:${courseId}:${subSectionId}`;
  }, [courseId, subSectionId]);

  // Interactive UI state - all collapsed by default
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [isActionsVisible, setIsActionsVisible] = useState(true);
  const [isZoomExpanded, setIsZoomExpanded] = useState(false);

  // Direct calculation instead of useMemo to avoid React hook issues
  const hasDocuments = !!(videoData?.pdfUrl || videoData?.pptUrl || videoData?.pptPdfUrl);
  !!videoData?.zoomMeeting;
  !!videoData?.videoUrl;
  const allCollapsed = !isVideoExpanded && !isDocumentsExpanded && !isZoomExpanded;

  // Check if documents are available for this lecture
  const shouldShowDocumentsDirectly = hasDocuments;

  // Load video data on component mount
  useEffect(() => {
    const getVideoData = () => {
      if (!courseSectionData?.length) return;
      const currentSectionIndx = courseSectionData.findIndex(data => data._id === sectionId);
      if (currentSectionIndx === -1) return;
      const currentSubSectionIndx = courseSectionData[currentSectionIndx].subSection.findIndex(data => data._id === subSectionId);
      if (currentSubSectionIndx === -1) return;
      const currentSubSectionDetails = courseSectionData[currentSectionIndx].subSection[currentSubSectionIndx];
      setVideoData(currentSubSectionDetails);
      setPreviewSource(courseEntireData?.thumbnail);
    };
    getVideoData();
  }, [courseSectionData, courseEntireData, sectionId, subSectionId]);
  useCallback(() => {
    if (allCollapsed) {
      setIsVideoExpanded(true);
      setIsDocumentsExpanded(true);
      setIsZoomExpanded(true);
    } else {
      setIsVideoExpanded(false);
      setIsDocumentsExpanded(false);
      setIsZoomExpanded(false);
    }
  }, [allCollapsed]); // Listen for collapse all event from sidebar
  useEffect(() => {
    const handleToggleAllPanels = event => {
      const {
        collapse
      } = event.detail;
      setIsVideoExpanded(!collapse);
      setIsDocumentsExpanded(!collapse);
      setIsZoomExpanded(!collapse);
    };
    window.addEventListener('toggleAllPanels', handleToggleAllPanels);
    return () => window.removeEventListener('toggleAllPanels', handleToggleAllPanels);
  }, []);

  // Apply playback speed to player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const rate = Number(playbackSpeed) || 1;
    if (player.actions?.changeRate) {
      player.actions.changeRate(rate);
    }
  }, [playbackSpeed]);

  // Pause video when collapsing the video section
  useEffect(() => {
    if (isVideoExpanded) return;
    const player = playerRef.current;
    if (!player) return;
    if (player.actions?.pause) {
      player.actions.pause();
    }
  }, [isVideoExpanded]);

  // Resume playback + persist progress
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !progressStorageKey) return;
    let hasSeeked = false;
    const trySeekFromStorage = () => {
      if (hasSeeked) return;
      const raw = localStorage.getItem(progressStorageKey);
      if (!raw) {
        hasSeeked = true;
        return;
      }
      const saved = Number(raw);
      if (!Number.isFinite(saved) || saved <= 0) {
        hasSeeked = true;
        return;
      }
      const seekTo = Math.max(0, saved);
      if (typeof player.seek === 'function') {
        player.seek(seekTo);
        hasSeeked = true;
        return;
      }
      if (player.actions?.seek) {
        player.actions.seek(seekTo);
        hasSeeked = true;
      }
    };
    const handleStateChange = state => {
      // Seek once when duration becomes known
      if (!hasSeeked && state?.duration && state.duration > 0) {
        trySeekFromStorage();
      }

      // Persist progress periodically
      const currentTime = Number(state?.currentTime);
      const duration = Number(state?.duration);
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;

      // If almost ended, clear saved progress
      if (duration - currentTime < 3) {
        localStorage.removeItem(progressStorageKey);
        return;
      }

      // Save every ~2 seconds
      if (Math.floor(currentTime) % 2 === 0) {
        localStorage.setItem(progressStorageKey, String(currentTime));
      }
    };

    // video-react provides subscribeToStateChange
    if (typeof player.subscribeToStateChange === 'function') {
      player.subscribeToStateChange(handleStateChange);
    } else {
      // Best-effort fallback
      trySeekFromStorage();
    }
    return () => {};
  }, [progressStorageKey, videoData?.videoUrl]);
  const handleLectureCompletion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await markLectureAsComplete({
        courseId: courseId,
        subsectionId: subSectionId
      }, token);
      if (res) {
        dispatch(updateCompletedLectures(subSectionId));
      }
    } catch (error) {
      console.error("Error marking lecture as complete:", error);
    }
    setLoading(false);
  }, [courseId, subSectionId, token, dispatch]);
  if (courseViewSidebar && window.innerWidth <= 640) return null;

  // Show loading state if no data yet
  if (!courseSectionData?.length) {
    return <div className="text-white max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-richblack-300">Loading course content...</p>
          </div>
        </div>

        {/* Documents Section - Interactive Expandable */}
        {hasDocuments && <div className="bg-richblack-900 rounded-xl overflow-hidden border border-richblack-700 shadow-lg">
            {/* Documents Header with Controls */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/30 to-richblack-800 border-b border-richblack-600">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
                <h3 className="text-lg font-semibold text-richblack-5">📚 Course Materials</h3>
                <span className="px-3 py-1 bg-green-900/40 text-green-400 text-sm rounded-full border border-green-500/30">Available</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsDocumentsExpanded(!isDocumentsExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105" title={isDocumentsExpanded ? "Hide Documents" : "Show Documents"}>
                  {isDocumentsExpanded ? <FiEyeOff className="text-richblack-300 text-lg" /> : <FiEye className="text-richblack-300 text-lg" />}
                </button>
                <button onClick={() => setIsDocumentsExpanded(!isDocumentsExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105">
                  {isDocumentsExpanded ? <FiChevronUp className="text-richblack-300 text-lg" /> : <FiChevronDown className="text-richblack-300 text-lg" />}
                </button>
              </div>
            </div>

            {/* Documents Content - Collapsible */}
            <div className={`transition-all duration-500 ease-in-out ${isDocumentsExpanded ? 'max-h-screen opacity-100 transform translate-y-0' : 'max-h-0 opacity-0 transform -translate-y-4 overflow-hidden'}`}>
              <DocumentViewer pdfUrl={videoData?.pdfUrl} pptUrl={videoData?.pptUrl} pptPdfUrl={videoData?.pptPdfUrl} lectureTitle={videoData?.title} />
            </div>
          </div>}
      </div>;
  }
  return <div className="text-white max-w-7xl mx-auto p-4">
      <div className="sm:hidden text-white absolute left-7 top-3 cursor-pointer" onClick={() => dispatch(setCourseViewSidebar(!courseViewSidebar))}>
        {!courseViewSidebar && <HiMenuAlt1 size={33} />}
      </div>

      {/* Interactive Content Layout */}
      <div className="space-y-4">

        {/* Video Section - Expandable/Collapsible */}
        {(videoData?.videoUrl || checkingVideo || !videoAvailable) && <div className="bg-richblack-900 rounded-xl overflow-hidden border border-richblack-700 shadow-lg">
            {/* Video Header with Controls */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/30 to-richblack-800 border-b border-richblack-600">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
                <h3 className="text-lg font-semibold text-richblack-5">🎥 Video Lecture</h3>
                {videoData?.videoUrl && <span className="px-3 py-1 bg-blue-900/40 text-blue-400 text-sm rounded-full border border-blue-500/30">Available</span>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsVideoExpanded(!isVideoExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105" title={isVideoExpanded ? "Minimize Video" : "Expand Video"}>
                  {isVideoExpanded ? <FiMinimize2 className="text-richblack-300 text-lg" /> : <FiMaximize2 className="text-richblack-300 text-lg" />}
                </button>
                <button onClick={() => setIsVideoExpanded(!isVideoExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105">
                  {isVideoExpanded ? <FiChevronUp className="text-richblack-300 text-lg" /> : <FiChevronDown className="text-richblack-300 text-lg" />}
                </button>
              </div>
            </div>

            {/* Video Content - Collapsible */}
            <div className={`transition-all duration-500 ease-in-out ${isVideoExpanded ? 'max-h-screen opacity-100 transform translate-y-0' : 'max-h-0 opacity-0 transform -translate-y-4 overflow-hidden'}`}>
              <div className="p-4">
                {!videoData?.videoUrl ? <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-richblack-800 to-richblack-900 rounded-lg">
                    <div className="text-center">
                      <div className="text-5xl mb-4">📹</div>
                      <p className="text-richblack-200 text-lg mb-2">No video available for this lecture</p>
                      <p className="text-richblack-400 text-sm">Check the course materials section for documents.</p>
                    </div>
                  </div> : <div className="rounded-lg overflow-hidden shadow-2xl">
                    <Player ref={playerRef} aspectRatio="16:9" playsInline autoPlay src={videoData.videoUrl} onEnded={() => {
                setVideoEnded(true);
                if (progressStorageKey) {
                  localStorage.removeItem(progressStorageKey);
                }
                handleLectureCompletion();
              }}>
                      <BigPlayButton position="center" />
                      <ControlBar>
                        <ReplayControl seconds={10} order={1.1} />
                        <ForwardControl seconds={10} order={1.2} />
                        <VolumeMenuButton vertical />
                        <PlaybackRateMenuButton rates={[0.5, 0.75, 1, 1.25, 1.5, 2]} />
                      </ControlBar>
                    </Player>
                  </div>}
              </div>
            </div>
          </div>}

        {/* Lecture Info & Actions - Interactive Panel */}
        <div className="bg-richblack-900 rounded-xl overflow-hidden border border-richblack-700 shadow-lg">
          {/* Info Header with Controls */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/30 to-richblack-800 border-b border-richblack-600">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg"></div>
              <h3 className="text-lg font-semibold text-richblack-5">ℹ️ Lecture Information</h3>
              {completedLectures.includes(subSectionId) && <span className="px-3 py-1 bg-green-900/40 text-green-400 text-sm rounded-full border border-green-500/30">✓ Completed</span>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsActionsVisible(!isActionsVisible)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105" title={isActionsVisible ? "Hide Actions" : "Show Actions"}>
                {isActionsVisible ? <FiEyeOff className="text-richblack-300 text-lg" /> : <FiEye className="text-richblack-300 text-lg" />}
              </button>
              <button onClick={() => setIsInfoExpanded(!isInfoExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105">
                {isInfoExpanded ? <FiChevronUp className="text-richblack-300 text-lg" /> : <FiChevronDown className="text-richblack-300 text-lg" />}
              </button>
            </div>
          </div>

          {/* Info Content - Collapsible */}
          <div className={`transition-all duration-500 ease-in-out ${isInfoExpanded ? 'max-h-screen opacity-100 transform translate-y-0' : 'max-h-0 opacity-0 transform -translate-y-4 overflow-hidden'}`}>
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-3 text-richblack-5 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {videoData?.title || "Lecture Title"}
              </h1>
              <p className="text-richblack-300 text-sm leading-relaxed mb-6">
                {videoData?.description || "Lecture description will appear here."}
              </p>

              {/* Action Buttons - Toggleable */}
              {isActionsVisible && <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-richblack-700">
                  {/* Quiz Button */}
                  {shouldShowDocumentsDirectly && videoData?.quiz && <button onClick={() => navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${subSectionId}/quiz`)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg">
                      <span>📝</span>
                      <span className="font-medium">Take Quiz</span>
                    </button>}

                  {/* Mark Complete Button */}
                  {shouldShowDocumentsDirectly && !videoData?.quiz && !completedLectures.includes(subSectionId) && <button onClick={handleLectureCompletion} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50">
                      <span>✅</span>
                      <span className="font-medium">{loading ? "Loading..." : "Mark Complete"}</span>
                    </button>}
                </div>}
            </div>
          </div>
        </div>

        {/* Course Materials Section - Interactive Expandable */}
        {hasDocuments && <div className="bg-richblack-900 rounded-xl overflow-hidden border border-richblack-700 shadow-lg">
            {/* Documents Header with Controls */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-900/30 to-richblack-800 border-b border-richblack-600">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg"></div>
                <h3 className="text-lg font-semibold text-richblack-5">📚 Course Materials</h3>
                <span className="px-3 py-1 bg-orange-900/40 text-orange-400 text-sm rounded-full border border-orange-500/30">Available</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsDocumentsExpanded(!isDocumentsExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105" title={isDocumentsExpanded ? "Hide Documents" : "Show Documents"}>
                  {isDocumentsExpanded ? <FiEyeOff className="text-richblack-300 text-lg" /> : <FiEye className="text-richblack-300 text-lg" />}
                </button>
                <button onClick={() => setIsDocumentsExpanded(!isDocumentsExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105">
                  {isDocumentsExpanded ? <FiChevronUp className="text-richblack-300 text-lg" /> : <FiChevronDown className="text-richblack-300 text-lg" />}
                </button>
              </div>
            </div>

            {/* Documents Content - Collapsible */}
            <div className={`transition-all duration-500 ease-in-out ${isDocumentsExpanded ? 'max-h-screen opacity-100 transform translate-y-0' : 'max-h-0 opacity-0 transform -translate-y-4 overflow-hidden'}`}>
              <div className="p-4">
                <DocumentViewer pdfUrl={videoData?.pdfUrl} pptUrl={videoData?.pptUrl} pptPdfUrl={videoData?.pptPdfUrl} />
              </div>
            </div>
          </div>}

        {/* Zoom Meeting - Interactive Panel */}
        <div className="bg-richblack-900 rounded-xl overflow-hidden border border-richblack-700 shadow-lg">
          {/* Zoom Header with Controls */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-900/30 to-richblack-800 border-b border-richblack-600">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
              <h3 className="text-lg font-semibold text-richblack-5">🎯 Live Session</h3>
              <span className="px-3 py-1 bg-green-900/40 text-green-400 text-sm rounded-full border border-green-500/30">Available</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsZoomExpanded(!isZoomExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105" title={isZoomExpanded ? "Collapse Zoom" : "Expand Zoom"}>
                {isZoomExpanded ? <FiMinimize2 className="text-richblack-300 text-lg" /> : <FiMaximize2 className="text-richblack-300 text-lg" />}
              </button>
              <button onClick={() => setIsZoomExpanded(!isZoomExpanded)} className="p-2 hover:bg-richblack-600 rounded-lg transition-all duration-200 hover:scale-105">
                {isZoomExpanded ? <FiChevronUp className="text-richblack-300 text-lg" /> : <FiChevronDown className="text-richblack-300 text-lg" />}
              </button>
            </div>
          </div>

          {/* Zoom Content - Collapsible */}
          <div className={`transition-all duration-500 ease-in-out ${isZoomExpanded ? 'max-h-screen opacity-100 transform translate-y-0' : 'max-h-0 opacity-0 transform -translate-y-4 overflow-hidden'}`}>
            <ZoomMeetingViewer subSectionId={subSectionId} lectureTitle={videoData?.title} />

            {/* Real-time Attendance Component - Only for Instructors and Admins */}
            {(user?.accountType === ACCOUNT_TYPE.INSTRUCTOR || user?.accountType === ACCOUNT_TYPE.ADMIN) && <div className="mt-6">
                <RealTimeAttendance meetingId={videoData?.zoomMeeting?.meetingId} courseId={courseId} isInstructor={user?.accountType === ACCOUNT_TYPE.INSTRUCTOR} />
              </div>}

            {/* Recording Viewer Component - Available for all users */}
            <div className="mt-6">
              <RecordingViewer courseId={courseId} isInstructor={user?.accountType === ACCOUNT_TYPE.INSTRUCTOR} />
            </div>
          </div>
        </div>


        {/* Always show lecture info if we have videoData */}
        {!videoData && <div className="bg-richblack-900 rounded-xl p-12 text-center border border-richblack-700 shadow-lg">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-richblack-5 mb-4">Loading Lecture Content...</h3>
            <p className="text-richblack-300">Please wait while we load the lecture data.</p>
          </div>}

        {/* No Content Placeholder */}
        {videoData && !videoData?.videoUrl && !hasDocuments && <div className="bg-richblack-900 rounded-xl p-12 text-center border border-richblack-700 shadow-lg">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-richblack-5 mb-4">No Content Available</h3>
            <p className="text-richblack-300">This lecture doesn&apos;t have video or document content yet.</p>
          </div>}
      </div>
    </div>;
};
export default VideoDetails;
