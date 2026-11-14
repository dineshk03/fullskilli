import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiChevronRight, FiMenu, FiArrowLeft, FiMessageCircle, FiStar } from "react-icons/fi";
import CourseReviewModal from "../components/core/ViewCourse/CourseReviewModal";
import VideoDetailsSidebar from "../components/core/ViewCourse/VideoDetailsSidebar";
import { getFullDetailsOfCourse } from "../services/operations/courseDetailsAPI";
import { setCompletedLectures, setCourseSectionData, setEntireCourseData, setTotalNoOfLectures, setCompletedQuizzes, setPassedQuizzes } from "../slices/viewCourseSlice";
import { setCourseViewSidebar } from "../slices/sidebarSlice";
export default function ViewCourse() {
  const {
    courseId
  } = useParams();
  const {
    token
  } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [reviewModal, setReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoized function to calculate total lectures
  const calculateTotalLectures = useCallback(courseContent => {
    return courseContent?.reduce((total, section) => total + section.subSection.length, 0) || 0;
  }, []);

  // Memoized function to reset course state
  const resetCourseState = useCallback(() => {
    dispatch(setCourseSectionData([]));
    dispatch(setEntireCourseData({}));
    dispatch(setCompletedLectures([]));
    dispatch(setCompletedQuizzes([]));
    dispatch(setPassedQuizzes([]));
    dispatch(setTotalNoOfLectures(0));
  }, [dispatch]);

  // Get current course data from Redux store
  const currentCourseData = useSelector(state => state.viewCourse.courseEntireData);

  // If we already have the same course in store, don't show spinner on mount
  useEffect(() => {
    if (currentCourseData?._id === courseId) {
      setLoading(false);
    }
  }, [currentCourseData?._id, courseId]);

  // Memoized course data fetching
  const fetchCourseDetails = useCallback(async () => {
    if (!courseId || !token) {
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches if we already have the data
    if (currentCourseData?._id === courseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const courseData = await getFullDetailsOfCourse(courseId, token);
      if (courseData?.courseDetails) {
        // Check if course is deleted/deactivated or order is inactive
        if (courseData.courseDetails.isDeactivated || courseData.courseDetails.isOrderInactive) {
          console.error("Course access is restricted");
          resetCourseState();
          navigate('/dashboard/enrolled-courses');
          return;
        }
        const totalLectures = calculateTotalLectures(courseData.courseDetails.courseContent);

        // Batch dispatch to reduce re-renders
        dispatch(dispatch => {
          dispatch(setCourseSectionData(courseData.courseDetails.courseContent));
          dispatch(setEntireCourseData(courseData.courseDetails));
          dispatch(setCompletedLectures(courseData.completedVideos || []));
          dispatch(setCompletedQuizzes(courseData.completedQuizzes || []));
          dispatch(setPassedQuizzes(courseData.passedQuizzes || []));
          dispatch(setTotalNoOfLectures(totalLectures));
        });
      } else {
        console.error("Course data not found or invalid response");
        resetCourseState();
        navigate('/dashboard/enrolled-courses');
        toast.error("Unable to access this course");
      }
    } catch (error) {
      console.error("Error fetching course details:", error);
      resetCourseState();
      navigate('/dashboard/enrolled-courses');
      toast.error(error?.response?.data?.message || "Error loading course");
    } finally {
      setLoading(false);
    }
  }, [courseId, token, navigate, dispatch, calculateTotalLectures, resetCourseState, currentCourseData]);
  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  // Memoized sidebar handling for small devices
  const {
    courseViewSidebar
  } = useSelector(state => state.sidebar);
  const [screenSize, setScreenSize] = useState(window.innerWidth);
  const [sidebarPreferenceLocked, setSidebarPreferenceLocked] = useState(false);

  // Restore sidebar preference for this session/course
  useEffect(() => {
    if (!courseId) return;
    const raw = sessionStorage.getItem(`viewCourseSidebar:${courseId}`);
    if (raw === 'open') {
      dispatch(setCourseViewSidebar(true));
      setSidebarPreferenceLocked(true);
    }
    if (raw === 'closed') {
      dispatch(setCourseViewSidebar(false));
      setSidebarPreferenceLocked(true);
    }
  }, [courseId, dispatch]);

  // Optimized resize handler with RAF for better performance
  useEffect(() => {
    let rafId;
    let lastWidth = window.innerWidth;
    const handleScreenSize = () => {
      rafId = requestAnimationFrame(() => {
        const currentWidth = window.innerWidth;
        // Only update if width actually changed
        if (currentWidth !== lastWidth) {
          lastWidth = currentWidth;
          setScreenSize(currentWidth);
        }
      });
    };
    window.addEventListener('resize', handleScreenSize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleScreenSize);
    };
  }, []);

  // Memoized sidebar visibility update
  const updateSidebarVisibility = useCallback(() => {
    if (sidebarPreferenceLocked) return;
    dispatch(setCourseViewSidebar(screenSize > 640));
  }, [screenSize, dispatch, sidebarPreferenceLocked]);
  useEffect(() => {
    updateSidebarVisibility();
  }, [updateSidebarVisibility]);
  const toggleSidebar = useCallback(() => {
    const next = !courseViewSidebar;
    dispatch(setCourseViewSidebar(next));
    setSidebarPreferenceLocked(true);
    if (courseId) {
      sessionStorage.setItem(`viewCourseSidebar:${courseId}`, next ? 'open' : 'closed');
    }

    // Pause video when hiding sidebar
    if (!next) {
      const videoElement = document.querySelector('.video-react video');
      if (videoElement && !videoElement.paused) {
        videoElement.pause();
      }
      // Also try to pause through the player API if available
      const playerContainer = document.querySelector('.video-react');
      if (playerContainer && playerContainer.player) {
        playerContainer.player.pause();
      }
    }
  }, [courseViewSidebar, dispatch, courseId]);

  // Memoized components
  const SidebarComponent = useMemo(() => {
    if (courseViewSidebar) {
      return <div className="w-[320px]">
          <VideoDetailsSidebar setReviewModal={setReviewModal} />
        </div>;
    }

    // Collapsed rail when sidebar is hidden
    return <div className="w-14 sm:w-16 bg-richblack-800 border-r border-richblack-700 flex flex-col items-center py-3 gap-3">
        <button type="button" onClick={toggleSidebar} aria-label="Show sidebar" title="Show sidebar" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-richblack-700 border border-richblack-600 text-richblack-25 flex items-center justify-center hover:bg-richblack-600">
          <FiChevronRight />
        </button>

        <div className="w-full flex flex-col items-center gap-3 mt-2">
          <button type="button" onClick={() => navigate('/dashboard/enrolled-courses')} aria-label="Back" title="Back" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-richblack-700/40 hover:bg-richblack-700 text-richblack-25 flex items-center justify-center">
            <FiArrowLeft />
          </button>

          <button type="button" onClick={() => setReviewModal(true)} aria-label="Add review" title="Add review" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-richblack-700/40 hover:bg-richblack-700 text-richblack-25 flex items-center justify-center">
            <FiStar />
          </button>

          <button type="button" onClick={toggleSidebar} aria-label="Show sidebar menu" title="Show sidebar menu" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-richblack-700/40 hover:bg-richblack-700 text-richblack-25 flex items-center justify-center">
            <FiMenu />
          </button>

          <button type="button" onClick={toggleSidebar} aria-label="Chat" title="Chat" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-richblack-700/40 hover:bg-richblack-700 text-richblack-25 flex items-center justify-center">
            <FiMessageCircle />
          </button>
        </div>
      </div>;
  }, [courseViewSidebar, setReviewModal, toggleSidebar, navigate]);
  const MainContent = useMemo(() => <div className="h-[calc(100vh-3.5rem)] flex-1 overflow-auto mt-14">
      <div className="mx-6">
        <Outlet />
      </div>
    </div>, []);
  const ReviewModalComponent = useMemo(() => reviewModal && <CourseReviewModal setReviewModal={setReviewModal} />, [reviewModal, setReviewModal]);

  // Loading state with optimized animation
  if (loading) {
    return <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-50 will-change-transform"></div>
      </div>;
  }
  return <>
      <div className="relative flex min-h-[calc(100vh-3.5rem)]">
        {SidebarComponent}
        {MainContent}
      </div>
      {ReviewModalComponent}
    </>;
}
