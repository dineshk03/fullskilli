const mongoose = require('mongoose');
const User = require('../models/user');
const Course = require('../models/course');
const CourseProgress = require('../models/courseProgress');
const Certificate = require('../models/certificate');
const CertificateTemplate = require('../models/certificateTemplate');
const { validateTemplatePayload } = require('./certificateTemplate');
const { generateCertificate } = require('./certificate');

function completionPercentage(course, progress) {
  if (!progress) return 0;
  const videos = new Set((progress.completedVideos || []).map(String));
  const quizzes = new Set((progress.completedQuizzes || []).map(String));
  let total = 0, completed = 0;
  for (const section of course.courseContent || []) for (const item of section.subSection || []) {
    const id = String(item._id);
    if (item.videoUrl || item.pdfUrl || item.pptUrl) {
      total++;
      if (item.videoUrl ? videos.has(id) : !item.quiz || quizzes.has(id)) completed++;
    }
    if (item.quiz) { total++; if (quizzes.has(id)) completed++; }
  }
  return total ? Math.round(completed / total * 10000) / 100 : 0;
}

async function listLmsEnrollments(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 25;
    const search = String(req.query.search || '').trim().slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pipeline = [
      { $match: { accountType: 'Student' } },
      { $project: { firstName: 1, lastName: 1, email: 1, courses: 1 } },
      { $unwind: '$courses' },
      { $lookup: { from: Course.collection.name, localField: 'courses', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $project: { studentId: '$_id', studentName: { $concat: ['$firstName', ' ', '$lastName'] }, email: 1, courseId: '$course._id', courseName: '$course.courseName', certificateEnabled: '$course.certificateEnabled' } },
    ];
    if (search) pipeline.push({ $match: { $or: ['studentName', 'email', 'courseName'].map(key => ({ [key]: { $regex: search, $options: 'i' } })) } });
    pipeline.push({ $sort: { studentName: 1, studentId: 1, courseId: 1 } }, { $facet: { rows: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: 'total' }] } });
    const [result] = await User.aggregate(pipeline);
    const rows = result.rows;
    const pairs = rows.map(row => ({ userId: row.studentId, courseId: row.courseId }));
    const [courses, progress, certificates] = rows.length ? await Promise.all([
      Course.find({ _id: { $in: rows.map(row => row.courseId) } }).select('courseContent').populate({ path: 'courseContent', populate: { path: 'subSection', select: 'videoUrl pdfUrl pptUrl quiz' } }).lean(),
      CourseProgress.find({ $or: rows.map(row => ({ userId: row.studentId, courseID: row.courseId })) }).lean(),
      Certificate.find({ $or: pairs, source: { $ne: 'manual' } }).lean(),
    ]) : [[], [], []];
    const data = rows.map(row => {
      const course = courses.find(item => String(item._id) === String(row.courseId));
      const record = progress.find(item => String(item.userId) === String(row.studentId) && String(item.courseID) === String(row.courseId));
      const certificate = certificates.find(item => String(item.userId) === String(row.studentId) && String(item.courseId) === String(row.courseId));
      const completion = completionPercentage(course || {}, record);
      return { ...row, completion, eligible: row.certificateEnabled !== false && completion === 100, certificate: certificate || null };
    });
    const total = result.count[0]?.total || 0;
    return res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Could not list LMS enrollments:', error);
    return res.status(500).json({ success: false, message: 'Could not load enrolled students' });
  }
}

async function createLmsCertificate(req, res) {
  if (!mongoose.isValidObjectId(req.body.studentId) || !mongoose.isValidObjectId(req.body.courseId)) return res.status(400).json({ success: false, message: 'Select a valid student and course' });
  if (req.body.designChoice !== undefined && !['standard', 'saved'].includes(req.body.designChoice)) return res.status(400).json({ success: false, message: 'Choose a valid certificate design' });
  if (req.body.designChoice === 'saved') {
    try {
      const template = await CertificateTemplate.findOne({ key: 'lms' }).lean();
      if (!template) return res.status(400).json({ success: false, message: 'Save a custom certificate design first' });
      const validated = validateTemplatePayload(template);
      req.adminCertificateDesign = { design: validated.design, designData: validated.designData };
    } catch (error) { return res.status(400).json({ success: false, message: 'Could not load saved certificate design' }); }
  }
  // This handler is mounted behind auth + isAdmin. The standard generator
  // rechecks enrollment, certificate availability and full course completion.
  req.adminCertificateStudentId = req.body.studentId;
  return generateCertificate(req, res);
}
module.exports = { listLmsEnrollments, createLmsCertificate, completionPercentage };
