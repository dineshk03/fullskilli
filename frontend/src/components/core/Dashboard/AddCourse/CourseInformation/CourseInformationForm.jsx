import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { MdNavigateNext } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { editCourseDetails, fetchCourseCategories, addCourseDetails } from "../../../../../services/operations/courseDetailsAPI";
import { getAllInstructors, createCourseAsAdmin } from "../../../../../services/operations/adminAPI";
import { setCourse, setStep } from "../../../../../slices/courseSlice";
import { COURSE_STATUS } from "../../../../../utils/constants";
import IconBtn from "../../../../common/IconBtn";
import Upload from "../Upload";
import ChipInput from "./ChipInput";
import RequirementsField from "./RequirementField";
export default function CourseInformationForm() {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: {
      errors
    }
  } = useForm();
  const dispatch = useDispatch();
  const {
    token
  } = useSelector(state => state.auth);
  const {
    user
  } = useSelector(state => state.profile);
  const {
    course,
    editCourse
  } = useSelector(state => state.course);
  const [loading, setLoading] = useState(false);
  const [courseCategories, setCourseCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  useEffect(() => {
    const getCategories = async () => {
      setLoading(true);
      const categories = await fetchCourseCategories();
      if (categories.length > 0) {
        // console.log("categories", categories)
        setCourseCategories(categories);
      }
      setLoading(false);
    };
    const getInstructors = async () => {
      if (user?.accountType === 'Admin') {
        setLoading(true);
        const instructorsData = await getAllInstructors(token);
        if (instructorsData) {
          setInstructors(instructorsData);
        }
        setLoading(false);
      }
    };
    // if form is in edit mode 
    // It will add value in input field
    if (editCourse) {
      // console.log("editCourse ", editCourse)
      setValue("courseTitle", course.courseName);
      setValue("courseShortDesc", course.courseDescription);
      setValue("coursePrice", course.price);
      setValue("courseTags", course.tag);
      setValue("courseBenefits", course.whatYouWillLearn);
      setValue("courseCategory", course.category);
      setValue("courseRequirements", course.instructions);
      setValue("courseImage", course.thumbnail);
      setValue("certificateEnabled", course.certificateEnabled !== false);
      if (user?.accountType === 'Admin' && course.instructor) {
        setValue("instructorId", course.instructor._id);
      }
    }
    getCategories();
    getInstructors();
  }, [course.category, course.certificateEnabled, course.courseDescription, course.courseName, course.instructions, course.instructor, course.price, course.tag, course.thumbnail, course.whatYouWillLearn, editCourse, setValue, token, user?.accountType]);
  const isFormUpdated = () => {
    const currentValues = getValues();
    // console.log("changes after editing form values:", currentValues)
    if (currentValues.courseTitle !== course.courseName || currentValues.courseShortDesc !== course.courseDescription || currentValues.coursePrice !== course.price || currentValues.courseTags.toString() !== course.tag.toString() || currentValues.courseBenefits !== course.whatYouWillLearn || currentValues.courseCategory._id !== course.category._id || currentValues.courseRequirements.toString() !== course.instructions.toString() || currentValues.courseImage !== course.thumbnail || typeof currentValues.certificateEnabled !== 'undefined' && currentValues.certificateEnabled !== (course.certificateEnabled !== false)) {
      return true;
    }
    return false;
  };

  //   handle next button click
  const onSubmit = async data => {
    // console.log(data)

    if (editCourse) {
      // const currentValues = getValues()
      // console.log("changes after editing form values:", currentValues)
      // console.log("now course:", course)
      // console.log("Has Form Changed:", isFormUpdated())
      if (isFormUpdated()) {
        const currentValues = getValues();
        const formData = new FormData();
        // console.log('data -> ',data)
        formData.append("courseId", course._id);
        if (currentValues.courseTitle !== course.courseName) {
          formData.append("courseName", data.courseTitle);
        }
        if (currentValues.courseShortDesc !== course.courseDescription) {
          formData.append("courseDescription", data.courseShortDesc);
        }
        if (currentValues.coursePrice !== course.price) {
          formData.append("price", data.coursePrice);
        }
        if (currentValues.courseTags.toString() !== course.tag.toString()) {
          formData.append("tag", JSON.stringify(data.courseTags));
          // formData.append("tag", data.courseTags)
        }
        if (currentValues.courseBenefits !== course.whatYouWillLearn) {
          formData.append("whatYouWillLearn", data.courseBenefits);
        }
        if (currentValues.courseCategory._id !== course.category._id) {
          formData.append("category", data.courseCategory);
        }
        if (currentValues.courseRequirements.toString() !== course.instructions.toString()) {
          formData.append("instructions", JSON.stringify(data.courseRequirements));
        }
        if (currentValues.courseImage !== course.thumbnail && currentValues.courseImage instanceof File) {
          formData.append("thumbnailImage", currentValues.courseImage);
        }
        if (typeof currentValues.certificateEnabled !== 'undefined' && currentValues.certificateEnabled !== (course.certificateEnabled !== false)) {
          formData.append("certificateEnabled", currentValues.certificateEnabled);
        }

        // send data to backend
        setLoading(true);
        const result = await editCourseDetails(formData, token);
        setLoading(false);
        if (result) {
          toast.success("Course updated successfully");
          dispatch(setStep(2));
          dispatch(setCourse(result));
        }
      } else {
        toast.error("No changes made to the form");
      }
      return;
    }

    // user has visited first time to step 1 
    try {
      // Validate required fields first (thumbnail is now optional)
      if (!data.courseTitle || !data.courseShortDesc || !data.coursePrice || !data.courseCategory || user?.accountType === 'Admin' && !data.instructorId) {
        throw new Error("Please fill all required fields");
      }
      const formData = new FormData();
      formData.append("courseName", data.courseTitle);
      formData.append("courseDescription", data.courseShortDesc);
      formData.append("price", data.coursePrice);
      formData.append("tag", JSON.stringify(data.courseTags || []));
      formData.append("whatYouWillLearn", data.courseBenefits);
      formData.append("category", data.courseCategory);
      formData.append("status", COURSE_STATUS.DRAFT);
      formData.append("instructions", JSON.stringify(data.courseRequirements || []));

      // Certificate enabled flag (default true if not set)
      formData.append("certificateEnabled", typeof data.certificateEnabled === 'boolean' ? data.certificateEnabled : true);

      // Only append thumbnail if it exists and is a File object
      if (data.courseImage && data.courseImage instanceof File) {
        formData.append("thumbnailImage", data.courseImage);
      }

      // Add instructor ID for admin course creation
      if (user?.accountType === 'Admin' && data.instructorId) {
        formData.append("instructorId", data.instructorId);
      }

      // Debug: Log FormData contents
      console.log("FormData contents being sent:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      }
      setLoading(true);
      let result;

      // Debug logs to verify user and token
      console.log('Current user:', {
        accountType: user?.accountType,
        id: user?.id,
        token: token ? 'Token exists' : 'No token'
      });

      // Use different API based on user type
      if (user?.accountType === 'Admin') {
        console.log('Creating course as admin');
        result = await createCourseAsAdmin(formData, token);
      } else {
        console.log('Creating course as instructor');
        result = await addCourseDetails(formData, token);
      }
      if (result) {
        toast.success("Course created successfully");
        // Continue to next step for both admin and instructor
        dispatch(setStep(2));
        dispatch(setCourse(result));
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6 ">
      {/* Course Title */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseTitle">
          Course Title <sup className="text-pink-200">*</sup>
        </label>
        <input id="courseTitle" placeholder="Enter Course Title" {...register("courseTitle", {
        required: true
      })} className="form-style w-full" />
        {errors.courseTitle && <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course title is required
          </span>}
      </div>

      {/* Course Short Description */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseShortDesc">
          Course Short Description <sup className="text-pink-200">*</sup>
        </label>
        <textarea id="courseShortDesc" placeholder="Enter Description" {...register("courseShortDesc", {
        required: true
      })} className="form-style resize-x-none min-h-[130px] w-full ] " />
        {errors.courseShortDesc && <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Description is required
          </span>}
      </div>

      {/* Course Price */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="coursePrice">
          Course Price <sup className="text-pink-200">*</sup>
        </label>
        <div className="relative">
          <input id="coursePrice" placeholder="Enter Course Price" {...register("coursePrice", {
          required: true,
          valueAsNumber: true,
          pattern: {
            value: /^(0|[1-9]\d*)(\.\d+)?$/
          }
        })} className="form-style w-full !pl-12" />
          <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 inline-block -translate-y-1/2 text-2xl text-richblack-400" />
        </div>
        {errors.coursePrice && <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Price is required
          </span>}
      </div>

      {/* Course Category */}
      <div className="flex flex-col space-y-2 ">
        <label className="text-sm text-richblack-5" htmlFor="courseCategory">
          Course Category <sup className="text-pink-200">*</sup>
        </label>
        <select {...register("courseCategory", {
        required: true
      })} defaultValue="" id="courseCategory" className="form-style w-full cursor-pointer">
          <option value="" disabled>
            Choose a Category
          </option>
          {!loading && courseCategories?.map((category, indx) => <option key={indx} value={category?._id}>
                {category?.name}
              </option>)}
        </select>
        {errors.courseCategory && <span className="ml-2 text-xs tracking-wide text-pink-200">
            Course Category is required
          </span>}
      </div>

      {/* Course Tags */}
      <ChipInput label="Tags" name="courseTags" placeholder="Enter Tags and press Enter or Comma" register={register} errors={errors} setValue={setValue} />

      {/* Course Thumbnail Image */}
      <Upload name="courseImage" label="Course Thumbnail (Optional)" register={register} setValue={setValue} errors={errors} editData={editCourse ? course?.thumbnail : null} />

      {/* Benefits of the course */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="courseBenefits">
          Benefits of the course <sup className="text-pink-200">*</sup>
        </label>
        <textarea id="courseBenefits" placeholder="Enter benefits of the course" {...register("courseBenefits", {
        required: true
      })} className="form-style resize-x-none min-h-[130px] w-full" />
        {errors.courseBenefits && <span className="ml-2 text-xs tracking-wide text-pink-200">
            Benefits of the course is required
          </span>}
      </div>

      {/* Requirements/Instructions */}
      <RequirementsField name="courseRequirements" label="Requirements/Instructions" register={register} setValue={setValue} errors={errors} />

      {/* Certificate Enabled Toggle */}
      <div className="flex items-center gap-2">
        <input id="certificateEnabled" type="checkbox" {...register("certificateEnabled")} className="h-4 w-4" defaultChecked />
        <label htmlFor="certificateEnabled" className="text-sm text-richblack-5">
          Enable certificate for this course
        </label>
      </div>

      {/* Instructor Selection - Only for Admin */}
      {user?.accountType === 'Admin' && <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="instructorId">
            Select Instructor <sup className="text-pink-200">*</sup>
          </label>
          <select id="instructorId" defaultValue="" {...register("instructorId", {
        required: user?.accountType === 'Admin'
      })} className="form-style w-full">
            <option value="" disabled>
              Choose an Instructor
            </option>
            {instructors?.map(instructor => <option key={instructor._id} value={instructor._id}>
                {instructor.firstName} {instructor.lastName}
              </option>)}
          </select>
          {errors.instructorId && <span className="ml-2 text-xs tracking-wide text-pink-200">
              Instructor selection is required
            </span>}
        </div>}

      {/* Next Button */}
      <div className="flex justify-end gap-x-2">
        {editCourse && <button onClick={() => dispatch(setStep(2))} disabled={loading} className={`flex cursor-pointer items-center gap-x-2 rounded-md py-[8px] px-[20px] font-semibold
              text-richblack-900 bg-richblack-300 hover:bg-richblack-900 hover:text-richblack-300 duration-300`}>
            Continue Wihout Saving
          </button>}
        <IconBtn disabled={loading} text={!editCourse ? "Next" : "Save Changes"} type="submit">
          <MdNavigateNext />
        </IconBtn>
      </div>
    </form>;
}
