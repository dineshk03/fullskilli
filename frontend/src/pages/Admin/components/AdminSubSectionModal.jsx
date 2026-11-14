import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { RxCross2 } from "react-icons/rx";
import { useSelector } from "react-redux";
import Upload from "../../../components/core/Dashboard/AddCourse/Upload";
import DocumentUpload from "../../../components/core/Dashboard/AddCourse/DocumentUpload";
export default function AdminSubSectionModal({
  modalData,
  setModalData,
  add = false,
  view = false,
  edit = false,
  onUpdate
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: {
      errors
    },
    getValues
  } = useForm();
  const [loading] = useState(false);
  useSelector(state => state.auth);
  useEffect(() => {
    if (view || edit) {
      console.log("🎬 AdminSubSectionModal Debug:", {
        mode: view ? 'view' : 'edit',
        modalData: modalData,
        subSectionId: modalData?._id,
        videoUrl: modalData?.videoUrl,
        title: modalData?.title
      });
      setValue("lectureTitle", modalData.title);
      setValue("lectureDesc", modalData.description);
      setValue("lectureVideo", modalData.videoUrl);
      setValue("lecturePdf", modalData.pdfUrl);
      setValue("lecturePpt", modalData.pptUrl);
    }
  }, [edit, modalData, setValue, view]);

  // detect whether form is updated or not
  const isFormUpdated = () => {
    const currentValues = getValues();

    // Check if title or description changed
    const titleChanged = currentValues.lectureTitle !== modalData.title;
    const descChanged = currentValues.lectureDesc !== modalData.description;
    const quizChanged = currentValues.quiz !== (modalData.quiz?._id || "");

    // Check if video changed - compare File object vs URL string
    const videoChanged = currentValues.lectureVideo instanceof File || currentValues.lectureVideo && typeof currentValues.lectureVideo === 'string' && currentValues.lectureVideo !== modalData.videoUrl;

    // Check if PDF changed
    const pdfChanged = currentValues.lecturePdf instanceof File || currentValues.lecturePdf && typeof currentValues.lecturePdf === 'string' && currentValues.lecturePdf !== modalData.pdfUrl;

    // Check if PPT changed
    const pptChanged = currentValues.lecturePpt instanceof File || currentValues.lecturePpt && typeof currentValues.lecturePpt === 'string' && currentValues.lecturePpt !== modalData.pptUrl;
    return titleChanged || descChanged || videoChanged || pdfChanged || pptChanged || quizChanged;
  };

  // handle the editing of subsection - only update local state, not database
  const handleEditSubsection = () => {
    const currentValues = getValues();

    // Validate that at least one content file is provided
    const hasVideo = currentValues.lectureVideo && (currentValues.lectureVideo instanceof File || typeof currentValues.lectureVideo === 'string' && currentValues.lectureVideo.trim() !== '');
    const hasPdf = currentValues.lecturePdf && (currentValues.lecturePdf instanceof File || typeof currentValues.lecturePdf === 'string' && currentValues.lecturePdf.trim() !== '');
    const hasPpt = currentValues.lecturePpt && (currentValues.lecturePpt instanceof File || typeof currentValues.lecturePpt === 'string' && currentValues.lecturePpt.trim() !== '');
    if (!hasVideo && !hasPdf && !hasPpt) {
      toast.error("At least one content file is required (Video, PDF, or PowerPoint)");
      return;
    }

    // Create updated subsection object for local state
    const updatedSubSection = {
      ...modalData,
      title: currentValues.lectureTitle,
      description: currentValues.lectureDesc,
      quiz: currentValues.quiz ? {
        _id: currentValues.quiz
      } : null,
      // Handle video URL - support both File objects and direct upload URLs
      videoUrl: currentValues.lectureVideo instanceof File ? URL.createObjectURL(currentValues.lectureVideo) : typeof currentValues.lectureVideo === 'string' ? currentValues.lectureVideo : modalData.videoUrl,
      // Store the video file or URL for batch save
      videoFile: currentValues.lectureVideo instanceof File ? currentValues.lectureVideo : null,
      videoUrlDirect: typeof currentValues.lectureVideo === 'string' ? currentValues.lectureVideo : null,
      // Handle PDF
      pdfUrl: currentValues.lecturePdf instanceof File ? URL.createObjectURL(currentValues.lecturePdf) : typeof currentValues.lecturePdf === 'string' ? currentValues.lecturePdf : modalData.pdfUrl,
      pdfFile: currentValues.lecturePdf instanceof File ? currentValues.lecturePdf : null,
      pdfUrlDirect: typeof currentValues.lecturePdf === 'string' ? currentValues.lecturePdf : null,
      // Handle PPT
      pptUrl: currentValues.lecturePpt instanceof File ? URL.createObjectURL(currentValues.lecturePpt) : typeof currentValues.lecturePpt === 'string' ? currentValues.lecturePpt : modalData.pptUrl,
      pptFile: currentValues.lecturePpt instanceof File ? currentValues.lecturePpt : null,
      pptUrlDirect: typeof currentValues.lecturePpt === 'string' ? currentValues.lecturePpt : null,
      // Mark as modified for batch save
      isModified: true
    };

    // Update local state through parent component
    onUpdate(updatedSubSection);
    setModalData(null);
    toast.success("Lecture updated (unsaved)");
  };
  const onSubmit = async data => {
    if (view) return;
    if (edit) {
      if (!isFormUpdated()) {
        toast.error("No changes made to the form");
      } else {
        handleEditSubsection();
      }
      return;
    }

    // Validate that at least one content file is provided
    const hasVideo = data.lectureVideo && (data.lectureVideo instanceof File || typeof data.lectureVideo === 'string' && data.lectureVideo.trim() !== '');
    const hasPdf = data.lecturePdf && (data.lecturePdf instanceof File || typeof data.lecturePdf === 'string' && data.lecturePdf.trim() !== '');
    const hasPpt = data.lecturePpt && (data.lecturePpt instanceof File || typeof data.lecturePpt === 'string' && data.lecturePpt.trim() !== '');
    if (!hasVideo && !hasPdf && !hasPpt) {
      toast.error("At least one content file is required (Video, PDF, or PowerPoint)");
      return;
    }

    // Debug the form data first
    console.log("AdminSubSectionModal - Form data received:", {
      lectureTitle: data.lectureTitle,
      lectureDesc: data.lectureDesc,
      lectureVideo: data.lectureVideo,
      lectureVideoType: typeof data.lectureVideo,
      lectureVideoIsFile: data.lectureVideo instanceof File,
      lectureVideoIsString: typeof data.lectureVideo === 'string',
      lectureVideoValue: data.lectureVideo
    });

    // For new lectures, only update local state (don't save to database)
    const newSubSection = {
      title: data.lectureTitle,
      description: data.lectureDesc,
      quiz: data.quiz ? {
        _id: data.quiz
      } : null,
      // Handle video URL - support both File objects and direct upload URLs
      videoUrl: data.lectureVideo instanceof File ? URL.createObjectURL(data.lectureVideo) : typeof data.lectureVideo === 'string' ? data.lectureVideo : null,
      // Store the video file or URL for batch save
      videoFile: data.lectureVideo instanceof File ? data.lectureVideo : null,
      videoUrlDirect: typeof data.lectureVideo === 'string' ? data.lectureVideo : null,
      // Handle PDF
      pdfUrl: data.lecturePdf instanceof File ? URL.createObjectURL(data.lecturePdf) : typeof data.lecturePdf === 'string' ? data.lecturePdf : null,
      pdfFile: data.lecturePdf instanceof File ? data.lecturePdf : null,
      pdfUrlDirect: typeof data.lecturePdf === 'string' ? data.lecturePdf : null,
      // Handle PPT
      pptUrl: data.lecturePpt instanceof File ? URL.createObjectURL(data.lecturePpt) : typeof data.lecturePpt === 'string' ? data.lecturePpt : null,
      pptFile: data.lecturePpt instanceof File ? data.lecturePpt : null,
      pptUrlDirect: typeof data.lecturePpt === 'string' ? data.lecturePpt : null,
      isNew: true
    };

    // Debug logging
    console.log("AdminSubSectionModal - Creating new subsection:", {
      title: newSubSection.title,
      description: newSubSection.description,
      hasVideoFile: !!newSubSection.videoFile,
      hasVideoUrlDirect: !!newSubSection.videoUrlDirect,
      videoUrlDirect: newSubSection.videoUrlDirect,
      originalVideoData: data.lectureVideo,
      videoType: typeof data.lectureVideo,
      videoFileName: newSubSection.videoFile ? newSubSection.videoFile.name : 'No file',
      videoFileSize: newSubSection.videoFile ? (newSubSection.videoFile.size / (1024 * 1024)).toFixed(2) + 'MB' : 'No file'
    });
    onUpdate(newSubSection);
    setModalData(null);
  };
  return <div className="fixed inset-0 z-[1000] !mt-0 grid h-screen w-screen place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
      <div className="my-10 w-11/12 max-w-[700px] rounded-lg border border-richblack-400 bg-richblack-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between rounded-t-lg bg-richblack-700 p-5">
          <p className="text-xl font-semibold text-richblack-5">
            {view && "Viewing"} {add && "Adding"} {edit && "Editing"} Lecture
          </p>
          <button onClick={() => !loading ? setModalData(null) : {}}>
            <RxCross2 className="text-2xl text-richblack-5" />
          </button>
        </div>
        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-8 py-10">
          {/* Lecture Video Upload */}
          <Upload name="lectureVideo" label="Lecture Video" register={register} setValue={setValue} errors={errors} video={true} viewData={view ? modalData.videoUrl : null} editData={edit ? modalData.videoUrl : null} subSectionId={(edit || view) && modalData?._id ? modalData._id : null} />

          {/* Lecture PDF Upload */}
          <DocumentUpload name="lecturePdf" label="Lecture PDF" register={register} setValue={setValue} errors={errors} documentType="pdf" viewData={view ? modalData.pdfUrl : null} editData={edit ? modalData.pdfUrl : null} />

          {/* Lecture PowerPoint Upload */}
          <DocumentUpload name="lecturePpt" label="Lecture PowerPoint" register={register} setValue={setValue} errors={errors} documentType="ppt" viewData={view ? modalData.pptUrl : null} editData={edit ? modalData.pptUrl : null} />
          {/* Lecture Title */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-5" htmlFor="lectureTitle">
              Lecture Title {!view && <sup className="text-pink-200">*</sup>}
            </label>
            <input disabled={view || loading} id="lectureTitle" placeholder="Enter Lecture Title" {...register("lectureTitle", {
            required: true
          })} className="form-style w-full" />
            {errors.lectureTitle && <span className="ml-2 text-xs tracking-wide text-pink-200">
                Lecture title is required
              </span>}
          </div>
          
          {/* Lecture Description */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-5" htmlFor="lectureDesc">
              Lecture Description{" "}
              {!view && <sup className="text-pink-200">*</sup>}
            </label>
            <textarea disabled={view || loading} id="lectureDesc" placeholder="Enter Lecture Description" {...register("lectureDesc", {
            required: true
          })} className="form-style resize-x-none min-h-[130px] w-full" />
            {errors.lectureDesc && <span className="ml-2 text-xs tracking-wide text-pink-200">
                Lecture Description is required
              </span>}
          </div>


          {!view && <div className="flex justify-end">
              <button type="submit" disabled={loading} className={`rounded-md bg-yellow-50 px-6 py-3 text-center text-[13px] font-bold text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.18)] 
                ${loading ? "cursor-not-allowed opacity-50" : "hover:shadow-none hover:scale-95"} transition-all duration-200`}>
                {loading ? "Loading.." : edit ? "Save Changes" : "Save"}
              </button>
            </div>}
        </form>
      </div>
    </div>;
}
AdminSubSectionModal.propTypes = {
  "modalData": PropTypes.shape({
    "_id": PropTypes.string,
    "videoUrl": PropTypes.string,
    "title": PropTypes.node,
    "description": PropTypes.string,
    "pdfUrl": PropTypes.string,
    "pptUrl": PropTypes.string,
    "quiz": PropTypes.shape({
      "_id": PropTypes.string
    })
  }),
  "setModalData": PropTypes.func,
  "add": PropTypes.func,
  "view": PropTypes.bool,
  "edit": PropTypes.bool,
  "onUpdate": PropTypes.func
};
