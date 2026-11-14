const EnrollmentLock = require('../models/enrollmentLock');
const Coupon = require('../models/coupon');
const Checkout = require('../models/checkout');
const {
  checkoutPricing,
  allocatePrices,
  money
} = require('../utils/checkoutPricing');
const User = require("../models/user");
const Course = require("../models/course");
const Order = require("../models/order");
const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail
} = require("../mail/templates/courseEnrollmentEmail");
const {
  courseEnrollmentWithInvoice
} = require("../mail/templates/courseEnrollmentWithInvoice");
const {
  generateInvoiceHTML
} = require("../utils/generateInvoicePDF");
const {
  generateInvoicePDFBuffer
} = require("../utils/generateInvoicePDFBuffer");
const {
  instance
} = require("../config/razorpay");
const crypto = require("crypto");
const { canUsePlan, planRequest, getPlans } = require('../services/planService');

exports.getPurchasedPlans = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const pid = String(user?.pid || '').trim();
    if (!pid) return res.json({ success: true, linked: false, plans: [] });
    const data = await getPlans(pid);
    return res.json({ success: true, linked: true, plans: data.plans || [] });
  } catch (error) {
    if (error.response?.status === 404) return res.json({ success: true, linked: true, plans: [] });
    return res.status(502).json({ success: false, message: 'Unable to check your Skilli plan. Please try again.' });
  }
};
const validatePlanActivationForCourses = async ({
  pid,
  activationCode,
  coursesRequested
}) => {
  if (!pid) {
    throw new Error("PID is required for plan activation");
  }
  if (!activationCode) {
    throw new Error("Activation code is required");
  }
  if (!Number.isFinite(coursesRequested) || coursesRequested <= 0) {
    throw new Error("Invalid courses requested");
  }
  const data = await getPlans(pid);
  const plans = Array.isArray(data.plans) ? data.plans : [];
  if (String(data.PID || "") !== String(pid)) {
    throw new Error("Activation code does not belong to this user");
  }
  const matchingActivePlan = plans.find(plan => {
    const codeMatches = String(plan?.activation_code || "") === String(activationCode);
    return codeMatches && canUsePlan(plan, coursesRequested);
  });
  if (!matchingActivePlan) {
    throw new Error("Invalid/expired activation code or insufficient course usage");
  }
  const usedCourses = Number(matchingActivePlan?.courses?.used || 0);
  const totalCourses = Number(matchingActivePlan?.courses?.total || 0);
  const remainingCourses = Number(matchingActivePlan?.courses?.remaining || 0);
  return {
    pid: String(data.PID),
    userID: data.userID,
    planName: matchingActivePlan.plan_name || "UNKNOWN",
    verificationId: matchingActivePlan.activation_code,
    usedCourses,
    totalCourses,
    remainingCourses
  };
};
const updatePlanUsage = async ({
  pid,
  coursesUsage,
  activationCode
}) => {
  return planRequest('plan-usage-update', {
    pid,
    courses_usage: coursesUsage,
    coupon_code: activationCode
  });
};
exports.capturePayment = async (req, res) => {
  try {
    const {
      coursesId,
      couponCode,
      discountAmount,
      activationCode,
      pid: requestPid
    } = req.body;
    const userId = req.user.id;

    // Validate coursesId
    if (!Array.isArray(coursesId) || coursesId.length === 0 || new Set(coursesId).size !== coursesId.length || coursesId.some(id => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid course IDs"
      });
    }

    // Check if user already enrolled in any of these courses

    const user = await User.findById(userId).populate('additionalDetails');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const pid = String(user.pid || "").trim();
    const alreadyEnrolledCourses = coursesId.filter(courseId => user.courses.includes(courseId));
    if (alreadyEnrolledCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in one or more of these courses"
      });
    }

    // Get course details

    const courses = await Course.find({
      _id: {
        $in: coursesId
      }
    });
    if (!courses || courses.length !== coursesId.length) {
      return res.status(404).json({
        success: false,
        message: "Courses not found"
      });
    }
    if (activationCode) {
      try {
        const planInfo = await validatePlanActivationForCourses({
          pid,
          activationCode,
          coursesRequested: coursesId.length
        });
        return res.status(200).json({
          success: true,
          message: "Plan activation validated - proceed directly",
          isFree: true,
          isPlanEnrollment: true,
          plan: {
            userID: planInfo.userID,
            pid: planInfo.pid,
            planName: planInfo.planName,
            verificationId: planInfo.verificationId,
            courses: {
              used: planInfo.usedCourses,
              remaining: planInfo.remainingCourses,
              total: planInfo.totalCourses
            }
          }
        });
      } catch (planError) {
        return res.status(403).json({
          success: false,
          message: planError.message || "Plan activation failed"
        });
      }
    }

    // Calculate total amount
    const pricing = await checkoutPricing(courses, couponCode, userId);
    const totalOriginalPrice = pricing.total;
    const totalDiscountAmount = pricing.discount;
    const finalAmount = pricing.amount;
    // If final amount is 0 (free course or 100% discount), skip Razorpay
    if (finalAmount === 0) {
      return res.status(200).json({
        success: true,
        message: "Free enrollment - proceed directly",
        isFree: true,
        couponApplied: !!couponCode
      });
    }

    // Check if Razorpay is configured
    if (!instance) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway not configured. Please contact administrator.",
        error: "RAZORPAY_NOT_CONFIGURED"
      });
    }
    // Create Razorpay order
    // Receipt must be max 40 characters
    const receiptId = `rcpt_${Date.now().toString().slice(-10)}`;
    const options = {
      amount: finalAmount * 100,
      // Razorpay expects amount in paise
      currency: "INR",
      receipt: receiptId,
      notes: {
        userId: userId,
        coursesId: coursesId.join(','),
        couponCode: couponCode || 'none',
        discountAmount: totalDiscountAmount
      }
    };
    const order = await instance.orders.create(options);
    if (!order) {
      return res.status(500).json({
        success: false,
        message: "Could not create Razorpay order"
      });
    }
    await Checkout.create({
      gatewayOrderId: order.id,
      user: userId,
      courses: coursesId,
      items: courses.map(course => ({ course: course._id, price: course.adminSetFree || course.courseType === 'Free' ? 0 : course.price })),
      amount: Math.round(finalAmount * 100),
      discount: totalDiscountAmount,
      couponCode: couponCode || ''
    });

    // Log coupon usage if provided
    if (couponCode) {}
    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      orderId: order.id,
      amount: finalAmount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY,
      userDetails: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        contact: user.additionalDetails?.contactNumber || ''
      },
      couponApplied: !!couponCode
    });
  } catch (error) {
    console.error("❌ Error in capturePayment:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: "Could not process payment",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
exports.verifyPayment = async (req, res) => {
  let lock = null;
  let processingCheckout = null;
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      coursesId,
      couponCode,
      discountAmount,
      activationCode,
      pid: requestPid
    } = req.body;
    const userId = req.user.id;
    if (!Array.isArray(coursesId) || coursesId.length === 0 || new Set(coursesId).size !== coursesId.length || coursesId.some(id => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid course IDs provided"
      });
    }

    // Find user and validate
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const pid = String(user.pid || "").trim();

    // Validate courses exist
    const courses = await Course.find({
      _id: {
        $in: coursesId
      }
    });
    if (courses.length !== coursesId.length) {
      throw new Error("One or more courses not found");
    }
    let planInfo = null;
    const isPlanEnrollment = !!activationCode;
    if (isPlanEnrollment) {
      planInfo = await validatePlanActivationForCourses({
        pid,
        activationCode,
        coursesRequested: coursesId.length
      });
    }

    // Paid checkouts use the price and discount agreed at order creation.
    const savedCheckout = razorpay_order_id ? await Checkout.findOne({
      gatewayOrderId: razorpay_order_id,
      user: userId
    }) : null;
    if (razorpay_order_id && !savedCheckout) return res.status(400).json({
      success: false,
      message: 'Checkout not found'
    });
    const pricing = savedCheckout ? {
      total: savedCheckout.amount / 100 + savedCheckout.discount,
      discount: savedCheckout.discount,
      amount: savedCheckout.amount / 100
    } : await checkoutPricing(courses, isPlanEnrollment ? null : couponCode, userId);
    const totalOriginalPrice = pricing.total;
    let totalDiscountAmount = isPlanEnrollment ? totalOriginalPrice : pricing.discount;
    let finalAmount = isPlanEnrollment ? 0 : pricing.amount;
    let checkout = null;

    // If payment was made (not free), verify Razorpay signature
    if ((finalAmount > 0 || razorpay_order_id) && !isPlanEnrollment) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification details missing"
        });
      }

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET).update(body.toString()).digest("hex");
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed - Invalid signature"
        });
      }
      if (!instance) throw new Error('Payment gateway unavailable');
      const [payment, gatewayOrder] = await Promise.all([instance.payments.fetch(razorpay_payment_id), instance.orders.fetch(razorpay_order_id)]);
      checkout = await Checkout.findOne({
        gatewayOrderId: razorpay_order_id,
        user: userId
      });
      if (!checkout || checkout.courses.map(String).sort().join(',') !== [...coursesId].sort().join(',') || payment.order_id !== razorpay_order_id || payment.status !== 'captured' || payment.currency !== 'INR' || Number(payment.amount) !== checkout.amount || Number(gatewayOrder.amount) !== checkout.amount) {
        return res.status(400).json({
          success: false,
          message: 'Payment does not match checkout'
        });
      }
      if (checkout.status === 'completed') return res.status(200).json({
        success: true,
        message: 'Enrollment already completed'
      });
      const claimed = await Checkout.findOneAndUpdate({
        _id: checkout._id,
        status: 'pending'
      }, {
        $set: {
          status: 'processing',
          paymentId: razorpay_payment_id
        }
      }, {
        new: true
      });
      if (!claimed) return res.status(409).json({
        success: false,
        message: 'Payment is already processing or requires review'
      });
      totalDiscountAmount = checkout.discount;
      finalAmount = money(checkout.amount / 100);
      processingCheckout = checkout;
    }
    if (!checkout) {
      const localId = 'local_' + crypto.createHash('sha256').update(userId + ':' + [...coursesId].sort().join(',')).digest('hex');
      checkout = await Checkout.findOneAndUpdate({ gatewayOrderId: localId }, { $setOnInsert: {
        gatewayOrderId: localId, user: userId, courses: coursesId,
        items: courses.map(course => ({ course: course._id, price: course.adminSetFree || course.courseType === 'Free' ? 0 : course.price })),
        amount: 0, discount: totalDiscountAmount, couponCode: couponCode || '', status: 'pending'
      } }, { upsert: true, new: true });
      if (checkout.status === 'completed') return res.status(200).json({ success: true, message: 'Enrollment already completed' });
      const claim = await Checkout.findOneAndUpdate({ _id: checkout._id, status: 'pending' }, { $set: { status: 'processing' } }, { new: true });
      if (!claim) return res.status(409).json({ success: false, message: 'Enrollment is processing or requires review' });
      processingCheckout = checkout;
    }
    try {
      lock = await EnrollmentLock.create({
        user: userId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
    } catch (error) {
      if (error.code === 11000) throw new Error('Another enrollment is processing. Please retry shortly.');
      throw error;
    }
    const freshUser = await User.findById(userId);
    if (coursesId.some(id => freshUser.courses.some(enrolled => String(enrolled) === id))) throw new Error('Already enrolled in one or more courses');
    if (isPlanEnrollment) {
      // Re-read usage under the user lock; a prior request may have consumed it.
      planInfo = await validatePlanActivationForCourses({ pid, activationCode, coursesRequested: coursesId.length });
    }
    const couponForUsage = pricing.coupon || (savedCheckout?.couponCode && !savedCheckout.couponCode.startsWith('BUNDLE_DISCOUNT_')
      ? await Coupon.findOne({ code: savedCheckout.couponCode.toUpperCase() }) : null);
    if (couponForUsage) {
      const coupon = couponForUsage;
      const usedByUser = coupon.userUsage.find(item => String(item.user) === userId)?.usedCount || 0;
      if ((coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) || (coupon.perUserLimit > 0 && usedByUser >= coupon.perUserLimit)) throw new Error('Coupon limit reached; please contact support for payment reconciliation');
      const usageIndex = coupon.userUsage.findIndex(item => String(item.user) === userId);
      const update = {
        $inc: {
          usedCount: 1,
          'analytics.successfulUses': 1
        },
        $set: {
          lastUsed: new Date()
        }
      };
      if (usageIndex >= 0) update.$inc['userUsage.' + usageIndex + '.usedCount'] = 1;else update.$push = {
        userUsage: {
          user: userId,
          usedCount: 1
        }
      };
      const used = await Coupon.findOneAndUpdate({
        _id: coupon._id,
        usedCount: coupon.usedCount,
        isActive: true,
        expiryDate: {
          $gt: new Date()
        }
      }, update, {
        new: true
      });
      if (!used) throw new Error('Coupon availability changed. Please retry checkout.');
    }

    // Create order records for each course
    const pricedCourses = checkout?.items?.length ? courses.map(course => ({ ...course.toObject(),
      price: checkout.items.find(item => String(item.course) === String(course._id)).price,
      adminSetFree: false, courseType: 'Paid' })) : courses;
    const allocations = allocatePrices(pricedCourses, totalDiscountAmount);
    const orderPromises = courses.map((course, index) => {
      // Calculate proportional discount for each course if multiple courses
      const { originalPrice: courseOriginalPrice, discountAmount: courseDiscountAmount, amount: courseFinalAmount } = allocations[index];
      const orderData = {
        user: userId,
        course: course._id,
        amount: courseFinalAmount,
        originalPrice: courseOriginalPrice,
        discountAmount: courseDiscountAmount,
        status: true,
        paymentMethod: isPlanEnrollment ? 'plan_activation' : finalAmount > 0 ? 'razorpay' : 'free',
        transactionId: isPlanEnrollment ? `PLAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : razorpay_payment_id || `FREE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseDate: new Date()
      };

      // Add coupon information if coupon code was provided (even if discount is 0)
      const appliedCouponCode = savedCheckout ? savedCheckout.couponCode : couponCode;
      if (appliedCouponCode) {
        orderData.couponUsed = {
          code: appliedCouponCode,
          discountType: totalDiscountAmount > 0 ? 'flat' : 'percentage',
          discountValue: courseDiscountAmount,
          discountAmount: courseDiscountAmount
        };
      } else {}
      return Order.create(orderData);
    });
    const orders = await Promise.all(orderPromises);
    if (isPlanEnrollment && planInfo) {
      const updatedCoursesUsage = planInfo.usedCourses + coursesId.length;
      await updatePlanUsage({
        pid: planInfo.pid,
        coursesUsage: updatedCoursesUsage,
        activationCode: planInfo.verificationId
      });
    }

    // Add courses to user's enrolled courses using $addToSet to avoid duplicates
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        courses: {
          $each: coursesId
        }
      }
    }, {
      new: true
    });

    // Update course student counts
    await Course.updateMany({
      _id: {
        $in: coursesId
      }
    }, {
      $addToSet: {
        studentsEnrolled: userId
      }
    });
    await require('../services/enrollmentEmailWorker').enqueueEnrollmentEmails(orders);
    if (checkout) await Checkout.updateOne({
      _id: checkout._id
    }, {
      $set: {
        status: 'completed'
      }
    });

    // Log payment details

    if (lock) {
      await EnrollmentLock.deleteOne({
        _id: lock._id
      });
      lock = null;
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and courses enrolled successfully",
      couponApplied: !!couponCode,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planEnrollment: isPlanEnrollment,
      activationCode: isPlanEnrollment ? activationCode : undefined
    });
  } catch (error) {
    if (processingCheckout) await Checkout.updateOne({
      _id: processingCheckout._id,
      status: 'processing'
    }, {
      $set: {
        status: 'review'
      }
    }).catch(() => {});
    if (lock) await EnrollmentLock.deleteOne({
      _id: lock._id
    }).catch(() => {});
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Could not complete enrollment"
    });
  }
};
exports.getPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all orders for the user and populate course and user details
    const orders = await Order.find({
      user: userId,
      status: true
    }).populate({
      path: 'course',
      model: 'Course',
      select: 'courseName description thumbnail instructor',
      populate: {
        path: 'instructor',
        model: 'User',
        select: 'firstName lastName email'
      }
    }).populate({
      path: 'user',
      model: 'User',
      select: 'firstName lastName email additionalDetails',
      populate: {
        path: 'additionalDetails',
        model: 'Profile',
        select: 'contactNumber'
      }
    }).sort({
      purchaseDate: -1
    });
    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No purchase history found"
      });
    }

    // Transform the orders data to include all necessary details for invoices
    const purchaseHistory = orders.map(order => ({
      _id: order._id,
      invoiceNumber: order.invoiceNumber,
      courseName: order.course?.courseName || 'N/A',
      courseDescription: order.course?.description || '',
      thumbnail: order.course?.thumbnail || '',
      price: order.amount || 0,
      originalPrice: order.originalPrice || order.amount || 0,
      discountAmount: order.discountAmount || 0,
      purchaseDate: order.purchaseDate,
      status: "Completed",
      // Order details for invoice
      transactionId: order.transactionId,
      paymentMethod: order.paymentMethod,
      // Coupon information
      couponUsed: order.couponUsed || null,
      // Course and user details for invoice
      course: order.course,
      user: order.user
    }));
    return res.status(200).json({
      success: true,
      data: purchaseHistory
    });
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase history",
      error: error.message
    });
  }
};

// Admin: Get all payment reports with filters
exports.getPaymentReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      paymentMethod,
      courseId,
      userId,
      page = 1,
      limit = 50,
      sortBy = 'purchaseDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {
      status: true
    };

    // Date range filter
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) {
        filter.purchaseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.purchaseDate.$lte = new Date(endDate);
      }
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    // Course filter
    if (courseId) {
      filter.course = courseId;
    }

    // User filter
    if (userId) {
      filter.user = userId;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1
    };

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);

    // Fetch orders with populated data
    const orders = await Order.find(filter).populate({
      path: 'course',
      model: 'Course',
      select: 'courseName description thumbnail category instructor price',
      populate: [{
        path: 'instructor',
        model: 'User',
        select: 'firstName lastName email'
      }, {
        path: 'category',
        model: 'Category',
        select: 'name'
      }]
    }).populate({
      path: 'user',
      model: 'User',
      select: 'firstName lastName email accountType additionalDetails',
      populate: {
        path: 'additionalDetails',
        model: 'Profile',
        select: 'contactNumber'
      }
    }).sort(sortOptions).skip(skip).limit(parseInt(limit));

    // Calculate summary statistics
    const allOrders = await Order.find(filter);
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const totalOriginalRevenue = allOrders.reduce((sum, order) => sum + (order.originalPrice || order.amount || 0), 0);
    const totalDiscounts = allOrders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);

    // Payment method breakdown
    const paymentMethodStats = await Order.aggregate([{
      $match: filter
    }, {
      $group: {
        _id: '$paymentMethod',
        count: {
          $sum: 1
        },
        revenue: {
          $sum: '$amount'
        }
      }
    }]);

    // Coupon usage stats
    const couponStats = await Order.aggregate([{
      $match: {
        ...filter,
        'couponUsed.code': {
          $exists: true,
          $ne: null
        }
      }
    }, {
      $group: {
        _id: '$couponUsed.code',
        count: {
          $sum: 1
        },
        totalDiscount: {
          $sum: '$discountAmount'
        }
      }
    }, {
      $sort: {
        count: -1
      }
    }, {
      $limit: 10
    }]);

    // Transform orders data
    const paymentReports = orders.map(order => ({
      _id: order._id,
      transactionId: order.transactionId,
      purchaseDate: order.purchaseDate,
      amount: order.amount,
      originalPrice: order.originalPrice || order.amount,
      discountAmount: order.discountAmount || 0,
      paymentMethod: order.paymentMethod,
      status: order.status ? 'Completed' : 'Failed',
      // User details
      user: {
        _id: order.user?._id,
        name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
        email: order.user?.email,
        contactNumber: order.user?.additionalDetails?.contactNumber
      },
      // Course details
      course: {
        _id: order.course?._id,
        name: order.course?.courseName,
        category: order.course?.category?.name,
        instructor: order.course?.instructor ? `${order.course.instructor.firstName} ${order.course.instructor.lastName}` : 'N/A',
        thumbnail: order.course?.thumbnail
      },
      // Coupon details
      coupon: order.couponUsed?.code ? {
        code: order.couponUsed.code,
        discountType: order.couponUsed.discountType,
        discountValue: order.couponUsed.discountValue,
        discountAmount: order.couponUsed.discountAmount
      } : null
    }));
    return res.status(200).json({
      success: true,
      data: {
        orders: paymentReports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          limit: parseInt(limit)
        },
        summary: {
          totalRevenue,
          totalOriginalRevenue,
          totalDiscounts,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          paymentMethodStats,
          topCoupons: couponStats
        }
      }
    });
  } catch (error) {
    console.error("Error fetching payment reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment reports",
      error: error.message
    });
  }
};

// Admin: Export payment reports as CSV
exports.exportPaymentReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      paymentMethod,
      courseId
    } = req.query;

    // Build filter query
    const filter = {
      status: true
    };
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }
    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }
    if (courseId) {
      filter.course = courseId;
    }

    // Fetch all orders matching filter
    const orders = await Order.find(filter).populate('course', 'courseName').populate('user', 'firstName lastName email').sort({
      purchaseDate: -1
    });

    // Generate CSV content
    const csvHeaders = ['Transaction ID', 'Date', 'Student Name', 'Student Email', 'Course Name', 'Original Price', 'Discount', 'Final Amount', 'Payment Method', 'Coupon Code', 'Status'].join(',');
    const csvRows = orders.map(order => [order.transactionId, new Date(order.purchaseDate).toLocaleDateString(), `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(), order.user?.email || '', order.course?.courseName || 'N/A', order.originalPrice || order.amount, order.discountAmount || 0, order.amount, order.paymentMethod, order.couponUsed?.code || 'None', order.status ? 'Completed' : 'Failed'].map(field => `"${field}"`).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payment-reports-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting payment reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export payment reports",
      error: error.message
    });
  }
};
