const Course = require('../models/course');
const User = require('../models/user');
const Category = require('../models/category');
const Section = require('../models/section');
const SubSection = require('../models/subSection');
const CourseProgress = require('../models/courseProgress');
const RatingAndReview = require('../models/ratingAndReview');
const {
  uploadImageToS3,
  deleteFileFromS3
} = require('../utils/s3Uploader');
const {
  convertSecondsToDuration
} = require("../utils/secToDuration");
const {
  cleanupCourseFiles
} = require('../utils/fileCleanup');
const mongoose = require('mongoose');

// Import notification helpers
const {
  createNewCourseCreationNotification,
  createCourseModificationNotification,
  createCourseStatusChangeNotification,
  createNewCourseAnnouncementToAll
} = require('./notification');

// Helper function to calculate average rating
const calculateAverageRating = async courseId => {
  try {
    const result = await RatingAndReview.aggregate([{
      $match: {
        course: new mongoose.Types.ObjectId(courseId)
      }
    }, {
      $group: {
        _id: null,
        averageRating: {
          $avg: "$rating"
        },
        totalRatings: {
          $sum: 1
        }
      }
    }]);
    if (result.length > 0) {
      return {
        averageRating: result[0].averageRating,
        totalRatings: result[0].totalRatings
      };
    }
    return {
      averageRating: 0,
      totalRatings: 0
    };
  } catch (error) {
    return {
      averageRating: 0,
      totalRatings: 0
    };
  }
};

// ================ create new course ================
exports.createCourse = async (req, res) => {
  try {
    // extract data
    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      category,
      instructions: _instructions,
      status,
      tag: _tag,
      thumbnailImageUrl,
      certificateEnabled
    } = req.body;

    // Handle tag and instructions - they can be either JSON strings or arrays
    let tag = _tag;
    let instructions = _instructions;
    // Normalize certificateEnabled to boolean
    let normalizedCertificateEnabled = true;
    if (typeof certificateEnabled === 'string') {
      normalizedCertificateEnabled = certificateEnabled === 'true' || certificateEnabled === 'on';
    } else if (typeof certificateEnabled === 'boolean') {
      normalizedCertificateEnabled = certificateEnabled;
    }

    // Handle tag parsing
    if (_tag) {
      try {
        if (typeof _tag === 'string') {
          tag = JSON.parse(_tag);
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tag format'
        });
      }
    } else {
      tag = [];
    }

    // Handle instructions parsing
    if (_instructions) {
      try {
        if (typeof _instructions === 'string') {
          instructions = JSON.parse(_instructions);
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid instructions format'
        });
      }
    } else {
      instructions = [];
    }

    // get thumbnail of course
    const thumbnail = req.file;

    // validation
    if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail && !thumbnailImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided (courseName, courseDescription, whatYouWillLearn, price, category, thumbnail)'
      });
    }
    if (!Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one instruction is required'
      });
    }
    if (!Array.isArray(tag) || tag.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one tag is required'
      });
    }
    if (!status || status === undefined) {
      status = "Draft";
    }

    // check current user is instructor or not
    const instructorId = req.user.id;

    // check given category is valid or not
    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(401).json({
        success: false,
        message: 'Category Details not found'
      });
    }

    // Handle thumbnail upload
    let thumbnailDetails;
    if (thumbnailImageUrl) {
      // Use direct upload URL

      thumbnailDetails = {
        secure_url: thumbnailImageUrl,
        public_id: thumbnailImageUrl.split('/').pop(),
        resource_type: 'image'
      };
    } else if (thumbnail) {
      // Upload via server (fallback)
      thumbnailDetails = await uploadImageToS3(thumbnail, 'courses');
      if (!thumbnailDetails || !thumbnailDetails.secure_url) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload thumbnail image'
        });
      }
    }

    // create new course - entry in DB
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorId,
      whatYouWillLearn,
      price,
      category: categoryDetails._id,
      tag,
      status,
      instructions,
      thumbnail: thumbnailDetails.secure_url,
      createdAt: Date.now(),
      courseType: 'Paid',
      // Default to Paid for new courses
      adminSetFree: false,
      originalPrice: price,
      certificateEnabled: normalizedCertificateEnabled
    });

    // add course id to instructor courses list
    await User.findByIdAndUpdate(instructorId, {
      $push: {
        courses: newCourse._id
      }
    }, {
      new: true
    });

    // Add the new course to the Categories
    await Category.findByIdAndUpdate({
      _id: category
    }, {
      $push: {
        courses: newCourse._id
      }
    }, {
      new: true
    });

    // Always create notification for admins about new course creation
    await createNewCourseCreationNotification(newCourse._id, instructorId);

    // Create notification for all students and instructors only if course is published
    if (status === "Published") {
      await createNewCourseAnnouncementToAll(newCourse._id, instructorId);
    } else {}

    // return response
    res.status(200).json({
      success: true,
      data: newCourse,
      message: 'New Course created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error while creating new course'
    });
  }
};

// ================ show all courses ================
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find({ status: 'Published' }, {
      courseName: true,
      courseDescription: true,
      price: true,
      thumbnail: true,
      instructor: true,
      ratingAndReviews: true,
      studentsEnrolled: true,
      courseType: true,
      originalPrice: true,
      adminSetFree: true,
      status: true,
      createdAt: true,
      courseContent: true,
      category: true
    }).populate({
      path: 'instructor',
      select: 'firstName lastName email image'
    }).populate({
      path: 'category',
      select: 'name description'
    }).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        select: "timeDuration"
      }
    }).exec();

    // Add average rating and total duration to each course
    const coursesWithRatingAndDuration = await Promise.all(allCourses.map(async course => {
      const ratingData = await calculateAverageRating(course._id);

      // Calculate total duration
      let totalDurationInSeconds = 0;
      if (course.courseContent) {
        course.courseContent.forEach(content => {
          if (content.subSection) {
            content.subSection.forEach(subSection => {
              const timeDurationInSeconds = parseFloat(subSection.timeDuration);
              if (!isNaN(timeDurationInSeconds) && timeDurationInSeconds > 0) {
                totalDurationInSeconds += timeDurationInSeconds;
              }
            });
          }
        });
      }
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds);
      return {
        ...course.toObject(),
        averageRating: ratingData.averageRating,
        totalRatings: ratingData.totalRatings,
        totalDuration: totalDuration
      };
    }));
    return res.status(200).json({
      success: true,
      data: coursesWithRatingAndDuration,
      message: 'Data for all courses fetched successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error while fetching data of all courses'
    });
  }
};

// ================ Get Course Details ================
exports.getCourseDetails = async (req, res) => {
  try {
    // get course ID
    const {
      courseId
    } = req.body;

    // find course details
    const courseDetails = await Course.findOne({
      _id: courseId
    }).populate({
      path: "instructor",
      select: "firstName lastName image additionalDetails",
      populate: {
        path: "additionalDetails", select: "about"
      }
    }).populate("category").populate("ratingAndReviews").populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        select: "title timeDuration section"
      }
    }).exec();

    //validation
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with ${courseId}`
      });
    }

    if (courseDetails.status !== 'Published') return res.status(404).json({ success: false, message: 'Course not found' });

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    // console.log('courseDetails -> ', courseDetails)
    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach(content => {
      content.subSection.forEach(subSection => {
        const timeDurationInSeconds = parseFloat(subSection.timeDuration);
        if (!isNaN(timeDurationInSeconds) && timeDurationInSeconds > 0) {
          totalDurationInSeconds += timeDurationInSeconds;
        }
      });
    });
    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    // Calculate average rating
    const ratingData = await calculateAverageRating(courseId);

    //return response
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        averageRating: ratingData.averageRating,
        totalRatings: ratingData.totalRatings
      },
      message: 'Fetched course data successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error while fetching course details'
    });
  }
};

// ================ Get Full Course Details ================
exports.getFullCourseDetails = async (req, res) => {
  try {
    const {
      courseId
    } = req.body;
    const userId = req.user.id;
    const userAccountType = req.user.accountType;
    // Find the course first
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access permissions based on user type
    if (userAccountType === 'Admin') {} else if (userAccountType === 'Instructor' && course.instructor.toString() === userId) {} else if (userAccountType === 'Instructor') {
      return res.status(403).json({
        success: false,
        message: 'Course access denied'
      });
    } else if (userAccountType === 'Student') {
      // For students, check if they are enrolled in the course
      const user = await User.findById(userId).select('courses');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      const isEnrolled = user.courses.some(c => c.toString() === courseId);
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this course'
        });
      }

      // Check if course access is active (order status validation)
      const isFree = course.courseType === 'Free' || course.adminSetFree;
      if (!isFree) {
        const Order = require('../models/order');

        // Check if there's an inactive order (explicitly suspended by admin)
        const inactiveOrder = await Order.findOne({
          user: userId,
          course: courseId,
          status: false
        });
        if (inactiveOrder) {
          return res.status(403).json({
            success: false,
            message: 'This course has been deactivated by the admin. Please contact the administrator for further information.',
            isDeactivated: true
          });
        }

        // Check for an active order
        const activeOrder = await Order.findOne({
          user: userId,
          course: courseId,
          status: true
        });

        // If no order exists at all, the course was admin-assigned — allow access
        const anyOrder = await Order.findOne({
          user: userId,
          course: courseId
        });
        if (!activeOrder && anyOrder) {
          // There is an order but it's not active — block access
          return res.status(403).json({
            success: false,
            message: 'You do not have an active enrollment for this course'
          });
        }

        // No order at all = admin-assigned course, grant access
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this course'
      });
    }
    const courseDetails = await Course.findOne({
      _id: courseId
    }).populate({
      path: "instructor",
      select: "firstName lastName image additionalDetails",
      populate: {
        path: "additionalDetails", select: "about"
      }
    }).populate("category").populate("ratingAndReviews").populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        populate: {
          path: "quiz",
          select: userAccountType === 'Student' ? '-questions.correctAnswer -questions.correctAnswers -questions.answers -questions.keywords -questions.solutionCode -questions.testCases' : undefined,
          // Only populate published quizzes for students
          match: userAccountType === 'Student' ? {
            status: 'Published'
          } : {}
        }
      }
    }).exec();
    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId
    });

    //   console.log("courseProgressCount : ", courseProgressCount)

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: `Could not find course with id: ${courseId}`
      });
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    //   count total time duration of course
    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach(content => {
      content.subSection.forEach(subSection => {
        const timeDurationInSeconds = parseFloat(subSection.timeDuration);
        if (!isNaN(timeDurationInSeconds) && timeDurationInSeconds > 0) {
          totalDurationInSeconds += timeDurationInSeconds;
        }
      });
    });
    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    // Calculate average rating
    const ratingData = await calculateAverageRating(courseId);
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos ? courseProgressCount?.completedVideos : [],
        completedQuizzes: courseProgressCount?.completedQuizzes ? courseProgressCount?.completedQuizzes : [],
        passedQuizzes: courseProgressCount?.passedQuizzes ? courseProgressCount?.passedQuizzes : [],
        averageRating: ratingData.averageRating,
        totalRatings: ratingData.totalRatings
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ================ Edit Course Details ================
exports.editCourse = async (req, res) => {
  try {
    const {
      courseId
    } = req.body;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }
    const updates = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    // Check if user is instructor and owns the course, or is admin
    if (req.user.accountType !== 'Admin' && (req.user.accountType !== 'Instructor' || course.instructor.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to edit this course"
      });
    }

    // Handle Thumbnail Image Update
    if (req.file) {
      try {
        // Check if file was already uploaded to S3 by multer-s3
        if (req.file.location) {
          // File already uploaded to S3 by multer-s3

          course.thumbnail = req.file.location;
        } else {
          // Fallback: upload using helper function (for backward compatibility)

          const thumbnailImage = await uploadImageToS3(req.file, 'courses');
          if (!thumbnailImage || !thumbnailImage.secure_url) {
            throw new Error("Failed to upload thumbnail image");
          }
          course.thumbnail = thumbnailImage.secure_url;
        }
      } catch (error) {
        console.error("Thumbnail upload error:", error);
        return res.status(500).json({
          success: false,
          message: "Error processing thumbnail image",
          error: error.message
        });
      }
    }

    // Handle JSON fields and other updates
    const updateData = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === "tag" || key === "instructions") {
        try {
          updateData[key] = typeof value === 'string' ? JSON.parse(value) : value;
          // Validate array fields
          if (!Array.isArray(updateData[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${key} format. Expected an array`
            });
          }
        } catch (e) {
          console.error(`Error parsing ${key}:`, e);
          return res.status(400).json({
            success: false,
            message: `Invalid ${key} format`
          });
        }
      } else if (key === 'instructorId') {
        // Handle instructorId field name (frontend sends instructorId, backend expects instructor)

        updateData['instructor'] = value;
      } else if (key !== 'courseId' && key !== 'thumbnailImage') {
        updateData[key] = value;
      }
    }

    // Update course fields

    Object.assign(course, updateData);
    // updatedAt
    course.updatedAt = Date.now();

    //   save data

    await course.save();
    const updatedCourse = await Course.findOne({
      _id: courseId
    }).populate({
      path: "instructor",
      select: "firstName lastName image additionalDetails",
      populate: {
        path: "additionalDetails", select: "about"
      }
    }).populate("category").populate("ratingAndReviews").populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        populate: {
          path: "quiz"
        }
      }
    }).exec();

    // Create notification for course modification
    const modificationType = updates.status ? 'status' : 'content';
    if (updates.status && updates.status !== course.status) {
      // If status changed, notify instructor
      await createCourseStatusChangeNotification(course.instructor, courseId, course.status, updates.status);

      // If course is being published for the first time, notify all users
      if (updates.status === "Published" && course.status === "Draft") {
        await createNewCourseAnnouncementToAll(courseId, course.instructor);
      }
    }

    // Notify admins about course modification
    await createCourseModificationNotification(courseId, req.user.id, modificationType);

    // success response
    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while updating course",
      error: error.message
    });
  }
};

// ================ Get a list of Course for a given Instructor ================
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id;
    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId
    }).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        select: "title timeDuration"
      }
    }).sort({
      createdAt: -1
    });
    // Calculate total duration for each course
    const coursesWithDuration = instructorCourses.map(course => {
      let totalDurationInSeconds = 0;
      course.courseContent.forEach(content => {
        content.subSection.forEach(subSection => {
          const timeDurationInSeconds = parseFloat(subSection.timeDuration);
          if (!isNaN(timeDurationInSeconds) && timeDurationInSeconds > 0) {
            totalDurationInSeconds += timeDurationInSeconds;
          }
        });
      });
      return {
        ...course.toObject(),
        totalDuration: convertSecondsToDuration(totalDurationInSeconds)
      };
    });

    // Return the instructor's courses with duration
    res.status(200).json({
      success: true,
      data: coursesWithDuration,
      message: 'Courses made by Instructor fetched successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message
    });
  }
};

// ================ Delete the Course ================
exports.deleteCourse = async (req, res) => {
  try {
    const {
      courseId
    } = req.body;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    // Check if user is instructor and owns the course, or is admin
    if (req.user.accountType !== 'Admin' && (req.user.accountType !== 'Instructor' || course.instructor.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this course"
      });
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentsEnrolled;
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: {
          courses: courseId
        }
      });
    }

    // Delete course thumbnail from S3
    if (course?.thumbnail) {
      await deleteFileFromS3(course.thumbnail);
    }

    // Delete course reviews
    await RatingAndReview.deleteMany({
      course: courseId
    });

    // Delete course progress records
    await CourseProgress.deleteMany({
      courseID: courseId
    });

    // Delete course certificates
    const Certificate = require('../models/certificate');
    await Certificate.deleteMany({
      courseId: courseId
    });

    // Get all sections and subsections
    const Quiz = require('../models/quiz');
    const courseSections = course.courseContent;
    const allSubSectionIds = [];

    // Get all subsection IDs from all sections
    for (const sectionId of courseSections) {
      const section = await Section.findById(sectionId);
      if (section) {
        allSubSectionIds.push(...section.subSection);
      }
    }

    // Get all subsections data for cleanup
    const allSubSections = await SubSection.find({
      _id: {
        $in: allSubSectionIds
      }
    });

    // Delete all associated data in parallel
    await Promise.all([
    // Delete all quizzes for this course's subsections
    Quiz.deleteMany({
      subSection: {
        $in: allSubSectionIds
      }
    }),
    // Delete all subsections and their videos
    ...allSubSectionIds.map(async subSectionId => {
      const subSection = await SubSection.findById(subSectionId);
      if (subSection?.videoUrl) {
        await deleteFileFromS3(subSection.videoUrl);
      }
      await SubSection.findByIdAndDelete(subSectionId);
    }),
    // Delete all sections
    ...courseSections.map(sectionId => Section.findByIdAndDelete(sectionId))]);

    // Clean up local files
    await cleanupCourseFiles(courseId, allSubSections);

    // Delete the course
    await Course.findByIdAndDelete(courseId);
    return res.status(200).json({
      success: true,
      message: "Course and associated files deleted successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error while Deleting course",
      error: error.message
    });
  }
};
