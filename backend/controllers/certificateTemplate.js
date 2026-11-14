const CertificateTemplate = require('../models/certificateTemplate');
const { validateAppearance } = require('../utils/certificateAppearance');

function validateTemplatePayload(body = {}) {
  const design = body.design || 'collaboration';
  if (!['classic', 'collaboration'].includes(design)) throw new Error('Invalid certificate design');
  const raw = body.designData || {};
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid certificate template settings');
  const text = (value, maximum, label) => {
    if (value === undefined) return '';
    if (typeof value !== 'string' || value.trim().length > maximum) throw new Error(`${label} must contain at most ${maximum} characters`);
    return value.trim();
  };
  const designData = { layoutVersion: 2, ...validateAppearance(raw) };
  for (const field of ['collegeName', 'department', 'academicYear']) designData[field] = text(raw[field], 180, field);
  designData.collegeDetails = text(raw.collegeDetails, 300, 'College details');
  if (raw.collegeLogoUrl !== undefined) {
    if (typeof raw.collegeLogoUrl !== 'string' || (raw.collegeLogoUrl && !/^https:\/\//i.test(raw.collegeLogoUrl)) || raw.collegeLogoUrl.length > 2000) throw new Error('collegeLogoUrl must be an uploaded image');
    designData.collegeLogoUrl = raw.collegeLogoUrl;
  }
  if (raw.hours !== undefined && raw.hours !== '') {
    const hours = Number(raw.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 10000) throw new Error('Hours must be between 1 and 10000');
    designData.hours = hours;
  }
  return { courseName: text(body.courseName, 160, 'Course title'), categoryName: text(body.categoryName, 120, 'Category'), design, designData };
}

async function getCertificateTemplate(req, res) {
  try {
    const template = await CertificateTemplate.findOne({ key: req.query.scope === 'lms' ? 'lms' : 'collaboration' }).lean();
    return res.json({ success: true, data: template });
  } catch (error) {
    console.error('Could not load certificate template:', error);
    return res.status(500).json({ success: false, message: 'Could not load certificate template' });
  }
}

async function saveCertificateTemplate(req, res) {
  let validated;
  try {
    validated = validateTemplatePayload(req.body);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  try {
    const template = await CertificateTemplate.findOneAndUpdate(
      { key: req.body.scope === 'lms' ? 'lms' : 'collaboration' },
      { $set: { courseName: validated.courseName, categoryName: validated.categoryName, design: validated.design, designData: validated.designData, updatedBy: req.user.id } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return res.json({ success: true, data: template });
  } catch (error) {
    console.error('Could not save certificate template:', error);
    return res.status(500).json({ success: false, message: 'Could not save certificate template' });
  }
}

module.exports = { getCertificateTemplate, saveCertificateTemplate, validateTemplatePayload };
