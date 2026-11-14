const College = require('../models/college');
const Certificate = require('../models/certificate');

const normalize = name => String(name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

async function backfillLegacyCertificates() {
  const names = await Certificate.distinct('designData.collegeName', { collegeId: { $exists: false }, 'designData.collegeName': { $type: 'string', $ne: '' } });
  for (const rawName of names) {
    const name = String(rawName).trim().replace(/\s+/g, ' ');
    if (!name) continue;
    const normalizedName = normalize(name);
    const college = await College.findOneAndUpdate({ normalizedName }, { $setOnInsert: { name, normalizedName, createdBy: null } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await Certificate.updateMany({ collegeId: { $exists: false }, 'designData.collegeName': rawName }, { $set: { collegeId: college._id } });
  }
}

exports.listColleges = async (req, res) => {
  try {
    await backfillLegacyCertificates();
    const search = String(req.query.search || '').trim().slice(0, 120);
    const query = search ? { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {};
    const colleges = await College.aggregate([{ $match: query }, { $lookup: { from: 'certificates', localField: '_id', foreignField: 'collegeId', as: 'certificates' } }, { $project: { name: 1, details: 1, createdAt: 1, certificateCount: { $size: '$certificates' }, lastIssuedAt: { $max: '$certificates.issuedDate' } } }, { $sort: { name: 1 } }]);
    return res.json({ success: true, data: colleges });
  } catch (error) { console.error('Could not list colleges:', error); return res.status(500).json({ success: false, message: 'Could not load college folders' }); }
};

exports.createCollege = async (req, res) => {
  const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ');
  const details = String(req.body?.details || '').trim();
  if (!name || name.length > 180 || details.length > 300) return res.status(400).json({ success: false, message: 'Provide a college name and valid details' });
  try {
    const normalizedName = normalize(name);
    const existing = await College.findOne({ normalizedName }).lean();
    if (existing) return res.status(409).json({ success: false, message: 'This college already exists', data: existing });
    const college = await College.create({ name, normalizedName, details, createdBy: req.user.id });
    return res.status(201).json({ success: true, data: college });
  } catch (error) { if (error?.code === 11000) return res.status(409).json({ success: false, message: 'This college already exists' }); console.error('Could not create college:', error); return res.status(500).json({ success: false, message: 'Could not create college' }); }
};
