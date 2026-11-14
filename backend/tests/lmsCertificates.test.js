const test = require('node:test');
const assert = require('node:assert/strict');
const { completionPercentage, createLmsCertificate } = require('../controllers/lmsCertificates');
const User = require('../models/user');
const Course = require('../models/course');
const CourseProgress = require('../models/courseProgress');

test('completion includes videos, documents and quizzes and never treats no progress as complete', () => {
  const course = { courseContent: [{ subSection: [{ _id: 'a', videoUrl: 'video', quiz: 'quiz' }, { _id: 'b', pdfUrl: 'document' }] }] };
  assert.equal(completionPercentage(course, null), 0);
  assert.equal(completionPercentage(course, { completedVideos: ['a'], completedQuizzes: [] }), 66.67);
  assert.equal(completionPercentage(course, { completedVideos: ['a'], completedQuizzes: ['a'] }), 100);
  assert.equal(completionPercentage({}, {}), 0);
});
test('admin generation rejects invalid student/course IDs', async () => {
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await createLmsCertificate({ body: { studentId: 'invalid', courseId: 'invalid' } }, res);
  assert.equal(res.code, 400);
});
test('admin generation rechecks student progress and blocks incomplete courses', async () => {
  const originals = [User.findById, Course.findById, CourseProgress.findOne];
  const studentId = '507f1f77bcf86cd799439011', courseId = '507f1f77bcf86cd799439012';
  User.findById = async id => { assert.equal(id, studentId); return { courses: [courseId] }; };
  Course.findById = () => ({ populate: async () => ({ courseType: 'Free', certificateEnabled: true }) });
  CourseProgress.findOne = () => ({ populate: async () => null });
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  try {
    await createLmsCertificate({ body: { studentId, courseId }, user: { id: 'admin' } }, res);
    assert.equal(res.code, 400);
    assert.match(res.body.message, /progress not found/);
  } finally { [User.findById, Course.findById, CourseProgress.findOne] = originals; }
});

test('saved LMS design is validated and supplied to generation without changing the student course', async () => {
  const Template = require('../models/certificateTemplate');
  const original = Template.findOne;
  const originalUser = User.findById, originalCourse = Course.findById, originalProgress = CourseProgress.findOne;
  const studentId = '507f1f77bcf86cd799439011', courseId = '507f1f77bcf86cd799439012';
  Template.findOne = () => ({ lean: async () => ({ design: 'classic', designData: { layoutVersion: 2, layout: 'ramnad', title: 'CUSTOM LMS', bodyText: 'Completed {course}', directorSignatureWidth: 220 } }) });
  User.findById = async () => ({ courses: [courseId] });
  Course.findById = () => ({ populate: async () => ({ courseType: 'Free', certificateEnabled: true }) });
  CourseProgress.findOne = () => ({ populate: async () => null });
  const req = { body: { studentId, courseId, designChoice: 'saved' }, user: { id: 'admin' } };
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  try {
    await createLmsCertificate(req, res);
    assert.equal(req.adminCertificateDesign.designData.title, 'CUSTOM LMS');
    assert.equal(req.adminCertificateDesign.designData.directorSignatureWidth, 220);
    assert.equal(req.body.courseId, courseId);
    assert.equal(res.code, 400); // Saved designs still require course completion.
  } finally { Template.findOne = original; User.findById = originalUser; Course.findById = originalCourse; CourseProgress.findOne = originalProgress; }
});

test('saving an LMS template uses its own key', async () => {
  const Template = require('../models/certificateTemplate');
  const { saveCertificateTemplate, getCertificateTemplate } = require('../controllers/certificateTemplate');
  const originalSave = Template.findOneAndUpdate, originalFind = Template.findOne;
  let savedKey, readKey;
  Template.findOneAndUpdate = query => { savedKey = query.key; return { lean: async () => ({ key: query.key }) }; };
  Template.findOne = query => { readKey = query.key; return { lean: async () => ({ key: query.key }) }; };
  const res = { json(body) { this.body = body; return this; }, status() { return this; } };
  try {
    await saveCertificateTemplate({ body: { scope: 'lms', design: 'classic', designData: {} }, user: { id: 'admin' } }, res);
    assert.equal(savedKey, 'lms');
    await getCertificateTemplate({ query: { scope: 'lms' } }, res);
    assert.equal(readKey, 'lms');
    await getCertificateTemplate({ query: {} }, res);
    assert.equal(readKey, 'collaboration');
  } finally { Template.findOneAndUpdate = originalSave; Template.findOne = originalFind; }
});
