import PropTypes from "prop-types";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import IconBtn from './../../common/IconBtn';
import { setCourseViewSidebar } from "../../../slices/sidebarSlice";
import ChatButton from '../Chat/ChatButton';
import { BsChevronDown } from "react-icons/bs";
import { IoIosArrowBack } from "react-icons/io";
import { FaLock } from "react-icons/fa";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { RiQuestionAnswerLine } from "react-icons/ri";
import { FiChevronLeft, FiChevronRight, FiChevronUp } from "react-icons/fi";
import { IoMdClose } from 'react-icons/io';
import { HiMenuAlt1 } from 'react-icons/hi';
export default function VideoDetailsSidebar({
  setReviewModal
}) {
  const [activeStatus, setActiveStatus] = useState(""); // store curr section id
  const [videoBarActive, setVideoBarActive] = useState(""); // store curr SubSection Id
  const [sectionAccess, setSectionAccess] = useState({}); // store section access status
  const [allCollapsed, setAllCollapsed] = useState(true); // Start with all collapsed
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    courseId,
    sectionId,
    subSectionId
  } = useParams();
  const {
    token
  } = useSelector(state => state.auth);
  const {
    courseSectionData,
    courseEntireData,
    totalNoOfLectures,
    completedLectures,
    completedQuizzes,
    passedQuizzes
  } = useSelector(state => state.viewCourse);

  // Check if current lecture has content
  const currentLecture = useMemo(() => {
    if (!courseSectionData?.length) return null;
    const sectionIdx = courseSectionData.findIndex(sec => sec._id === sectionId);
    if (sectionIdx === -1) return null;
    const subSectionIdx = courseSectionData[sectionIdx].subSection.findIndex(sub => sub._id === subSectionId);
    if (subSectionIdx === -1) return null;
    return courseSectionData[sectionIdx].subSection[subSectionIdx];
  }, [courseSectionData, sectionId, subSectionId]);
  const hasContent = !!(currentLecture?.videoUrl || currentLecture?.pdfUrl || currentLecture?.pptUrl || currentLecture?.pptPdfUrl || currentLecture?.zoomMeeting);
  const toggleAllPanels = () => {
    const next = !allCollapsed;
    setAllCollapsed(next);
    // Dispatch custom event to VideoDetails to collapse/expand all panels
    window.dispatchEvent(new CustomEvent('toggleAllPanels', {
      detail: {
        collapse: next
      }
    }));
  };

  // Listen for state updates from VideoDetails
  useEffect(() => {
    const handleUpdateState = event => {
      const {
        collapsed
      } = event.detail;
      setAllCollapsed(collapsed);
    };
    window.addEventListener('updateSidebarCollapseState', handleUpdateState);
    return () => window.removeEventListener('updateSidebarCollapseState', handleUpdateState);
  }, []);

  // Update allCollapsed state based on actual panel states
  useEffect(() => {
    const videoExpanded = document.querySelector('.video-react')?.closest('[style*="max-h-screen"]') !== null;
    const documentsExpanded = document.querySelector('[class*="DocumentViewer"]')?.closest('[style*="max-h-screen"]') !== null;
    const zoomExpanded = document.querySelector('[class*="ZoomMeetingViewer"]')?.closest('[style*="max-h-screen"]') !== null;
    const allExpanded = videoExpanded || documentsExpanded || zoomExpanded;
    setAllCollapsed(!allExpanded);
  }, []);

  // Debug completion state
  console.log('🔍 VideoDetailsSidebar Debug:', {
    completedLectures,
    completedQuizzes,
    passedQuizzes,
    totalNoOfLectures
  });
  const {
    courseViewSidebar
  } = useSelector(state => state.sidebar);

  // set which section - subSection is selected 
  useEffect(() => {
    (() => {
      if (!courseSectionData.length) return;
      const currentSectionIndx = courseSectionData.findIndex(data => data._id === sectionId);
      const currentSubSectionIndx = courseSectionData?.[currentSectionIndx]?.subSection.findIndex(data => data._id === subSectionId);
      const activeSubSectionId = courseSectionData[currentSectionIndx]?.subSection?.[currentSubSectionIndx]?._id;
      setActiveStatus(courseSectionData?.[currentSectionIndx]?._id);
      setVideoBarActive(activeSubSectionId);
    })();
  }, [courseSectionData, courseEntireData, location.pathname, sectionId, subSectionId]);

  // Check section access for all sections with optimized logic
  useEffect(() => {
    const checkAllSectionAccess = async () => {
      if (!courseSectionData.length || !courseEntireData?._id || !token) return;
      const accessStatus = {};

      // First section is always accessible
      if (courseSectionData.length > 0) {
        accessStatus[courseSectionData[0]._id] = true;
      }

      // For subsequent sections, check if previous section is completed
      for (let i = 1; i < courseSectionData.length; i++) {
        const currentSection = courseSectionData[i];
        const previousSection = courseSectionData[i - 1];

        // Check if all subsections in previous section are completed
        const previousSectionCompleted = previousSection.subSection.every(subSec => {
          // For lectures with video
          if (subSec.videoUrl) {
            const videoCompleted = completedLectures.includes(subSec._id);
            const quizCompleted = subSec.quiz ? completedQuizzes.includes(subSec._id) : true;
            return videoCompleted && quizCompleted;
          }
          // For document-only lectures (PDF/PPT but no video)
          const hasDocuments = subSec.pdfUrl || subSec.pptUrl;
          if (hasDocuments && !subSec.videoUrl) {
            if (subSec.quiz) {
              return completedQuizzes.includes(subSec._id);
            }
            return completedLectures.includes(subSec._id);
          }
          // For quiz-only content
          if (subSec.quiz && !subSec.videoUrl && !hasDocuments) {
            return completedQuizzes.includes(subSec._id);
          }
          return true; // If no content, consider it completed
        });

        // Use client-side check as primary source of truth
        accessStatus[currentSection._id] = previousSectionCompleted;
      }
      setSectionAccess(accessStatus);
    };
    checkAllSectionAccess();
  }, [courseSectionData, courseEntireData, completedLectures, completedQuizzes, token]);
  return <>
      <div className="flex h-[calc(100vh-3.5rem)] w-[320px] max-w-[350px] flex-col border-r-[1px] border-r-richblack-700 bg-richblack-800">
        <div className="mx-5 flex flex-col items-start justify-between gap-2 gap-y-4 border-b border-richblack-600 py-5 text-lg font-bold text-richblack-25">
          <div className="flex w-full items-center justify-between ">

            {/* open - close side bar icons */}
            <div className="sm:hidden text-white cursor-pointer " onClick={() => dispatch(setCourseViewSidebar(!courseViewSidebar))}>
              {courseViewSidebar ? <IoMdClose size={33} /> : <HiMenuAlt1 size={33} />}
            </div>

            {/* go back dashboard */}
            <button onClick={() => {
            navigate(`/dashboard/enrolled-courses`);
          }} className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-richblack-100 p-1 text-richblack-700 hover:scale-90" title="back">
              <IoIosArrowBack size={30} />
            </button>

            {/* collapse sidebar (desktop + mobile) */}
            <button type="button" onClick={() => {
            // Pause video before hiding sidebar
            const videoElement = document.querySelector('.video-react video');
            if (videoElement && !videoElement.paused) {
              videoElement.pause();
            }
            const playerContainer = document.querySelector('.video-react');
            if (playerContainer && playerContainer.player) {
              playerContainer.player.pause();
            }
            dispatch(setCourseViewSidebar(false));
            if (courseId) {
              sessionStorage.setItem(`viewCourseSidebar:${courseId}`, 'closed');
            }
          }} className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-richblack-700/40 p-1 text-richblack-25 hover:bg-richblack-700" title="Hide sidebar" aria-label="Hide sidebar">
              <FiChevronLeft size={22} />
            </button>

            {/* collapse/expand all panels */}
            {hasContent && <button type="button" onClick={toggleAllPanels} className={`flex h-[35px] w-[35px] items-center justify-center rounded-full p-1 hover:bg-richblack-700 transition-colors ${allCollapsed ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-richblack-700/40 text-richblack-25'}`} title={allCollapsed ? 'Expand all panels' : 'Collapse all panels'} aria-label={allCollapsed ? 'Expand all panels' : 'Collapse all panels'}>
                {allCollapsed ? <FiChevronRight size={22} /> : <FiChevronUp size={22} />}
              </button>}

            {/* add review button */}
            <IconBtn text="Add Review"
          // customClasses="ml-auto"
          onClick={() => setReviewModal(true)} />
          </div>

          {/* course Name - total No Of Lectures*/}
          <div className="flex flex-col">
            <p>{courseEntireData?.courseName}</p>
            <p className="text-sm font-semibold text-richblack-500">
              {(() => {
              // Calculate completed lectures dynamically
              let completed = 0;
              courseSectionData.forEach(section => {
                section.subSection.forEach(subSec => {
                  // For lectures with video
                  if (subSec.videoUrl) {
                    if (completedLectures.includes(subSec._id)) completed++;
                  }
                  // For document-only lectures
                  else if (subSec.pdfUrl || subSec.pptUrl) {
                    if (subSec.quiz) {
                      if (completedQuizzes.includes(subSec._id)) completed++;
                    } else {
                      if (completedLectures.includes(subSec._id)) completed++;
                    }
                  }
                  // For quiz-only content
                  else if (subSec.quiz) {
                    if (passedQuizzes.includes(subSec._id)) completed++;
                  }
                });
              });
              return completed;
            })()} / {totalNoOfLectures}
            </p>
          </div>

          {/* Chat with Instructor Button */}
          <div className="mt-3">
            <ChatButton courseId={courseEntireData?._id} courseName={courseEntireData?.courseName} instructorName={courseEntireData?.instructor ? `${courseEntireData.instructor.firstName} ${courseEntireData.instructor.lastName}` : 'Instructor'} />
          </div>
        </div>


        {/* render all section -subSection */}
        <div className="h-[calc(100vh - 5rem)] overflow-y-auto">
          {courseSectionData.map((section, index) => <div className="mt-2 cursor-pointer text-sm text-richblack-5" onClick={() => setActiveStatus(section?._id)} key={index}>
              {/* Section */}
              <div className="flex justify-between bg-richblack-700 px-5 py-4">
                <div className="w-[70%] font-semibold flex items-center gap-2">
                  {section?.sectionName}
                  {index > 0 && !sectionAccess[section._id] && <div className="relative group">
                      <FaLock size={12} className="text-yellow-50" />
                      <div className="absolute left-0 -top-8 hidden group-hover:block bg-richblack-900 text-xs text-yellow-50 p-2 rounded-md whitespace-nowrap">
                        Complete Section {index} to unlock
                      </div>
                    </div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-medium">
                    {section.subSection.filter(subSec => {
                  // For lectures with video
                  if (subSec.videoUrl) {
                    return completedLectures.includes(subSec._id);
                  }
                  // For document-only lectures (PDF/PPT but no video)
                  const hasDocuments = subSec.pdfUrl || subSec.pptUrl;
                  if (hasDocuments && !subSec.videoUrl) {
                    // If has quiz, check quiz completion
                    if (subSec.quiz) {
                      return completedQuizzes.includes(subSec._id);
                    }
                    // If no quiz, check if marked as completed
                    return completedLectures.includes(subSec._id);
                  }
                  // For quiz-only content
                  if (subSec.quiz && !subSec.videoUrl && !hasDocuments) {
                    return passedQuizzes.includes(subSec._id);
                  }
                  return false;
                }).length}/{section?.subSection.length} Completed
                  </span>
                  <span className={`${activeStatus === section?._id ? "rotate-0 transition-all duration-500" : "rotate-180"} `}>
                    <BsChevronDown />
                  </span>
                </div>
              </div>

              {/* Sub Sections */}
              {activeStatus === section?._id && <div className="transition-[height] duration-500 ease-in-out">
                  {section.subSection.map(topic => {
              // Check if this section should be locked using the sectionAccess state
              let isLocked = false;
              if (index > 0) {
                // Use the sectionAccess state if available, otherwise fall back to client-side check
                if (Object.prototype.hasOwnProperty.call(sectionAccess, section._id)) {
                  isLocked = !sectionAccess[section._id];
                } else {
                  // Fallback: check if previous section is completed
                  const previousSection = courseSectionData[index - 1];
                  const previousSectionCompleted = previousSection.subSection.every(subSec => {
                    // For lectures with video
                    if (subSec.videoUrl) {
                      const videoCompleted = completedLectures.includes(subSec._id);
                      const quizCompleted = subSec.quiz ? completedQuizzes.includes(subSec._id) : true;
                      return videoCompleted && quizCompleted;
                    }
                    // For document-only lectures (PDF/PPT but no video)
                    const hasDocuments = subSec.pdfUrl || subSec.pptUrl;
                    if (hasDocuments && !subSec.videoUrl) {
                      if (subSec.quiz) {
                        return completedQuizzes.includes(subSec._id);
                      }
                      return completedLectures.includes(subSec._id);
                    }
                    // For quiz-only content
                    if (subSec.quiz && !subSec.videoUrl && !hasDocuments) {
                      return completedQuizzes.includes(subSec._id);
                    }
                    return true; // If no content, consider it completed
                  });
                  isLocked = !previousSectionCompleted;
                }
              }
              return <div className="flex flex-col" key={`topic-${topic._id}`}>
                        <div className={`flex gap-3 px-5 py-2 ${isLocked ? "opacity-50 cursor-not-allowed" : videoBarActive === topic._id ? "bg-yellow-200 font-semibold text-richblack-800" : "hover:bg-richblack-900 cursor-pointer"}`} onClick={() => {
                  if (isLocked) {
                    return; // Don't navigate if locked
                  }
                  navigate(`/view-course/${courseEntireData?._id}/section/${section?._id}/sub-section/${topic?._id}`);
                  setVideoBarActive(topic._id);
                  courseViewSidebar && window.innerWidth <= 640 ? dispatch(setCourseViewSidebar(false)) : null;
                }}>
                          <input type="checkbox" checked={(() => {
                    // For lectures with video
                    if (topic.videoUrl) {
                      return completedLectures.includes(topic._id);
                    }
                    // For document-only lectures
                    const hasDocuments = topic.pdfUrl || topic.pptUrl;
                    if (hasDocuments && !topic.videoUrl) {
                      // If has quiz, check quiz completion
                      if (topic.quiz) {
                        return completedQuizzes.includes(topic._id);
                      }
                      // If no quiz, check lecture completion
                      return completedLectures.includes(topic._id);
                    }
                    // For quiz-only content
                    if (topic.quiz && !topic.videoUrl && !hasDocuments) {
                      return completedQuizzes.includes(topic._id);
                    }
                    return false;
                  })()} onChange={() => {}} disabled={isLocked} />
                          <span className="flex items-center gap-2 flex-1">
                            {isLocked && <div className="relative group">
                                <FaLock size={12} className="text-yellow-50" />
                                <div className="absolute left-0 -top-12 hidden group-hover:block bg-richblack-900 text-xs text-yellow-50 p-2 rounded-md whitespace-nowrap">
                                  Complete previous section to unlock
                                </div>
                              </div>}
                            {topic.title}
                            {topic.quiz && <div className="relative group ml-auto">
                                <RiQuestionAnswerLine size={16} className={`${completedLectures.includes(topic?._id) ? 'text-yellow-50' : 'text-richblack-400'}`} />
                                <div className="absolute right-0 -top-8 hidden group-hover:block bg-richblack-900 text-xs text-yellow-50 p-2 rounded-md whitespace-nowrap">
                                  Quiz available
                                </div>
                              </div>}
                          </span>
                        </div>
                        
                        {/* Quiz Button - Show based on quiz status */}
                        {topic.quiz && <button onClick={() => {
                  // Only allow navigation if quiz is not passed
                  if (!passedQuizzes.includes(topic._id)) {
                    navigate(`/view-course/${courseEntireData?._id}/section/${section?._id}/sub-section/${topic?._id}/quiz`);
                  }
                }} className={`ml-11 mr-5 mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${passedQuizzes.includes(topic._id) ? 'bg-green-700 text-white cursor-default opacity-80' : completedQuizzes.includes(topic._id) ? 'bg-yellow-700 text-white hover:bg-yellow-600' : completedLectures.includes(topic._id) || !topic.videoUrl && (topic.pdfUrl || topic.pptUrl) ? 'bg-richblack-700 text-yellow-50 hover:bg-richblack-600' : 'bg-richblack-700 text-richblack-300 cursor-not-allowed opacity-50'}`} disabled={passedQuizzes.includes(topic._id) || !completedLectures.includes(topic._id) && topic.videoUrl}>
                            <HiOutlineClipboardCheck size={16} />
                            {passedQuizzes.includes(topic._id) ? '✓ Quiz Passed' : completedQuizzes.includes(topic._id) ? 'Retake Quiz' : 'Take Quiz'}
                          </button>}
                      </div>;
            })}
                </div>}
            </div>)}
        </div>
      </div>
    </>;
}
VideoDetailsSidebar.propTypes = {
  "setReviewModal": PropTypes.func
};
