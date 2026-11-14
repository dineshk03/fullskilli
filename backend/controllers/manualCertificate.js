const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Certificate = require('../models/certificate');
const College = require('../models/college');
const { reserveCertificateId } = require('../utils/certificateId');

const MAX_BATCH_SIZE = 100;
const { validateAppearance } = require('../utils/certificateAppearance');

function validateIssuePayload(body = {}) {
  if (body.recipients !== undefined) {
    if (!Array.isArray(body.recipients) || !body.recipients.length || body.recipients.length > MAX_BATCH_SIZE) throw new Error('Provide between 1 and 100 recipients');
    const recipients = body.recipients.map((recipient, index) => {
      try {
        if (!recipient || typeof recipient !== 'object' || Array.isArray(recipient)) throw new Error('Invalid recipient');
        const overrides = {};
        for (const key of ['studentYear', 'department', 'collegeName', 'startDate', 'endDate', 'academicYear']) {
          if (recipient[key] !== undefined && typeof recipient[key] !== 'string') throw new Error(`Invalid ${key}`);
          if (recipient[key]?.trim()) overrides[key] = recipient[key].trim();
        }
        if (recipient.hours !== undefined && recipient.hours !== '') overrides.hours = recipient.hours;
        if (recipient.courseName !== undefined && typeof recipient.courseName !== 'string') throw new Error('Invalid course name');
        return validateIssuePayload({ ...body, recipients: undefined, names: [recipient.name], courseName: recipient.courseName?.trim() || body.courseName, designData: { ...body.designData, ...overrides } });
      } catch (error) { throw new Error(`Recipient ${index + 1}: ${error.message}`); }
    });
    return { ...recipients[0], names: recipients.map(recipient => recipient.names[0]), recipients };
  }
  const names = body.names;
  const courseName = typeof body.courseName === 'string' ? body.courseName.trim() : '';
  const categoryName = typeof body.categoryName === 'string' ? body.categoryName.trim() : 'General';
  const completionDate = body.completionDate ? new Date(body.completionDate) : new Date();
  const design = body.design || 'classic';
  if (!['classic', 'collaboration'].includes(design)) throw new Error('Invalid certificate design');
  let designData = { layoutVersion: 2, ...validateAppearance(body.designData) };
  if (design === 'collaboration') {
    const raw = body.designData || {};
    const requiredText = ['academyName', 'academicYear', 'principalName', 'principalTitle', 'directorName', 'directorTitle'];
    const requiredImages = ['academyLogoUrl', 'principalSignatureUrl', 'directorSignatureUrl'];
    for (const key of requiredText) {
      if (typeof raw[key] !== 'string' || !raw[key].trim() || raw[key].trim().length > 180) throw new Error(`${key} is required (maximum 180 characters)`);
    }
    for (const key of requiredImages) {
      if ((key === 'academyLogoUrl' && raw.showAcademyLogo === false) || (key === 'collegeLogoUrl' && raw.showCollegeLogo === false)) continue;
      if (key === 'academyLogoUrl' && raw.useDefaultAcademyLogo === true && !raw[key]) continue;
      if (typeof raw[key] !== 'string' || !/^https:\/\//i.test(raw[key]) || raw[key].length > 2000) throw new Error(`${key} must be an uploaded image`);
    }
    if (raw.department !== undefined && (typeof raw.department !== 'string' || raw.department.trim().length > 180)) throw new Error('department must contain at most 180 characters');
    if (raw.collegeName !== undefined && (typeof raw.collegeName !== 'string' || raw.collegeName.trim().length > 180)) throw new Error('collegeName must contain at most 180 characters');
    if (raw.collegeLogoUrl && (typeof raw.collegeLogoUrl !== 'string' || !/^https:\/\//i.test(raw.collegeLogoUrl) || raw.collegeLogoUrl.length > 2000)) throw new Error('collegeLogoUrl must be an uploaded image');
    const hours = Number(raw.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 10000) throw new Error('Hours must be between 1 and 10000');
    const collegeDetails = typeof raw.collegeDetails === 'string' ? raw.collegeDetails.trim() : '';
    if (collegeDetails.length > 300) throw new Error('College details must contain at most 300 characters');
    designData = { ...designData, ...Object.fromEntries([...requiredText, ...requiredImages, 'department', 'collegeName', 'collegeLogoUrl'].map(key => [key, (raw[key] || '').trim()])) };
    designData.hours = hours;
    designData.collegeDetails = collegeDetails;
  }

  if (!Array.isArray(names) || names.length === 0 || names.length > MAX_BATCH_SIZE) {
    throw new Error(`Provide between 1 and ${MAX_BATCH_SIZE} names`);
  }
  const cleanNames = names.map(name => typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '');
  if (cleanNames.some(name => !name || name.length > 120)) {
    throw new Error('Each name must contain 1 to 120 characters');
  }
  if (!courseName || courseName.length > 160) {
    throw new Error('Certificate course or program title must contain 1 to 160 characters');
  }
  if (categoryName.length > 120) {
    throw new Error('Category must contain at most 120 characters');
  }
  if (Number.isNaN(completionDate.getTime())) {
    throw new Error('Completion date is invalid');
  }
  const collegeId = typeof body.collegeId === 'string' ? body.collegeId.trim() : '';
  return { names: cleanNames, courseName, categoryName: categoryName || 'General', completionDate, design, designData, collegeId };
}

async function issueManualCertificates(req, res) {
  let input;
  try {
    input = validateIssuePayload(req.body);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  try {
    let college = null;
    if (input.collegeId && !mongoose.isValidObjectId(input.collegeId)) return res.status(400).json({ success: false, message: 'Invalid college selection' });
    if (input.collegeId) college = await College.findById(input.collegeId).lean();
    if (!college && input.designData.collegeName) college = await College.findOne({ normalizedName: String(input.designData.collegeName).trim().replace(/\s+/g, ' ').toLocaleLowerCase() }).lean();
    const batchId = crypto.randomUUID();
    const now = new Date();
    const reserved = new Set();
    const ids = [];
    for (let index = 0; index < input.names.length; index += 1) {
      ids.push(await reserveCertificateId(Certificate, reserved));
    }
    const certificates = input.names.map((studentName, index) => ({
      source: 'manual',
      design: input.design,
      designData: input.recipients?.[index].designData || input.designData,
      batchId,
      issuedBy: req.user.id,
      ...(college ? { collegeId: college._id } : {}),
      certificateId: ids[index],
      studentName,
      courseName: input.recipients?.[index].courseName || input.courseName,
      categoryName: input.categoryName,
      completionDate: input.completionDate,
      issuedDate: now,
    }));
    const created = await Certificate.insertMany(certificates);
    return res.status(201).json({ success: true, data: created, batchId });
  } catch (error) {
    console.error('Error issuing certificates:', error);
    return res.status(500).json({ success: false, message: 'Could not issue certificates' });
  }
}

async function listManualCertificates(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    // Older LMS certificates predate the source field.
    const query = { source: req.query.source === 'course' ? { $ne: 'manual' } : 'manual' };
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : '';
    if (req.query.collegeId) {
      if (!mongoose.isValidObjectId(req.query.collegeId)) return res.status(400).json({ success: false, message: 'Invalid college folder' });
      query.collegeId = req.query.collegeId;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = ['studentName', 'courseName', 'certificateId'].map(field => ({ [field]: { $regex: escaped, $options: 'i' } }));
    }
    if (req.query.design === 'collaboration') query.design = 'collaboration';
    if (req.query.design === 'classic') query.$and = [{ $or: [{ design: 'classic' }, { design: { $exists: false } }] }];
    const from = typeof req.query.from === 'string' ? new Date(`${req.query.from}T00:00:00.000Z`) : null;
    const to = typeof req.query.to === 'string' ? new Date(`${req.query.to}T23:59:59.999Z`) : null;
    if (from && !Number.isNaN(from.getTime())) query.issuedDate = { ...query.issuedDate, $gte: from };
    if (to && !Number.isNaN(to.getTime())) query.issuedDate = { ...query.issuedDate, $lte: to };
    const sorts = {
      newest: { issuedDate: -1, _id: -1 }, oldest: { issuedDate: 1, _id: 1 },
      name: { studentName: 1, _id: -1 }, course: { courseName: 1, _id: -1 },
    };
    const sort = sorts[req.query.sort] || sorts.newest;
    const [certificates, total] = await Promise.all([
      Certificate.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Certificate.countDocuments(query),
    ]);
    return res.json({ success: true, data: certificates, page, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error listing certificates:', error);
    return res.status(500).json({ success: false, message: 'Could not load certificates' });
  }
}

async function getManualCertificateBatch(req, res) {
  const { batchId } = req.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId)) {
    return res.status(400).json({ success: false, message: 'Invalid certificate batch ID' });
  }
  try {
    const certificates = await Certificate.find({ source: 'manual', batchId }).sort({ _id: 1 }).limit(MAX_BATCH_SIZE).lean();
    if (!certificates.length) return res.status(404).json({ success: false, message: 'Certificate batch not found' });
    return res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error loading certificate batch:', error);
    return res.status(500).json({ success: false, message: 'Could not load certificate batch' });
  }
}

async function setCertificateStatus(req, res) {
  const certificateId = String(req.params.certificateId || '').trim().toUpperCase();
  if (!/^BA-[A-Z0-9-]{6,32}$/.test(certificateId) || typeof req.body?.isActive !== 'boolean') return res.status(400).json({ success: false, message: 'A valid certificate ID and status are required' });
  try {
    const isActive = req.body.isActive;
    const certificate = await Certificate.findOne({ certificateId });
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });
    certificate.isActive = isActive;
    if (isActive) {
      certificate.disabledAt = undefined;
      certificate.disabledBy = undefined;
    } else {
      certificate.disabledAt = new Date();
      certificate.disabledBy = req.user.id;
    }
    await certificate.save();
    return res.json({ success: true, message: isActive ? 'Certificate enabled' : 'Certificate disabled', data: certificate.toObject() });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    return res.status(500).json({ success: false, message: 'Could not update certificate status' });
  }
}

async function deleteCertificate(req, res) {
  const certificateId = String(req.params.certificateId || '').trim().toUpperCase();
  if (!/^BA-[A-Z0-9-]{6,32}$/.test(certificateId)) return res.status(400).json({ success: false, message: 'Invalid certificate ID' });
  try {
    const certificate = await Certificate.findOneAndDelete({ certificateId }).lean();
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });
    return res.json({ success: true, message: 'Certificate permanently deleted' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return res.status(500).json({ success: false, message: 'Could not delete certificate' });
  }
}

function validateCertificateIds(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > MAX_BATCH_SIZE) throw new Error(`Provide between 1 and ${MAX_BATCH_SIZE} certificate IDs`);
  const normalized = [...new Set(ids.map(id => String(id || '').trim().toUpperCase()))];
  if (normalized.some(id => !/^BA-[A-Z0-9-]{6,32}$/.test(id))) throw new Error('One or more certificate IDs are invalid');
  return normalized;
}

async function bulkSetCertificateStatus(req, res) {
  let certificateIds;
  try {
    certificateIds = validateCertificateIds(req.body?.certificateIds);
    if (typeof req.body?.isActive !== 'boolean') throw new Error('A certificate status is required');
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
  try {
    const isActive = req.body.isActive;
    const update = isActive ? { $set: { isActive: true }, $unset: { disabledAt: 1, disabledBy: 1 } } : { $set: { isActive: false, disabledAt: new Date(), disabledBy: req.user.id } };
    const result = await Certificate.updateMany({ certificateId: { $in: certificateIds } }, update, { runValidators: true });
    return res.json({ success: true, message: `${result.modifiedCount} certificate${result.modifiedCount === 1 ? '' : 's'} ${isActive ? 'enabled' : 'disabled'}`, data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (error) {
    console.error('Error updating certificate statuses:', error);
    return res.status(500).json({ success: false, message: 'Could not update certificates' });
  }
}

async function bulkDeleteCertificates(req, res) {
  let certificateIds;
  try { certificateIds = validateCertificateIds(req.body?.certificateIds); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
  try {
    const result = await Certificate.deleteMany({ certificateId: { $in: certificateIds } });
    return res.json({ success: true, message: `${result.deletedCount} certificate${result.deletedCount === 1 ? '' : 's'} permanently deleted`, data: { deletedCount: result.deletedCount } });
  } catch (error) {
    console.error('Error deleting certificates:', error);
    return res.status(500).json({ success: false, message: 'Could not delete certificates' });
  }
}

module.exports = { validateIssuePayload, issueManualCertificates, listManualCertificates, getManualCertificateBatch, setCertificateStatus, deleteCertificate, bulkSetCertificateStatus, bulkDeleteCertificates, validateCertificateIds };
