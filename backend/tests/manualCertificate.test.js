const test = require('node:test');
const assert = require('node:assert/strict');
const Certificate = require('../models/certificate');
const CertificateTemplate = require('../models/certificateTemplate');
const CertificateAsset = require('../models/certificateAsset');
const { validateIssuePayload, issueManualCertificates, listManualCertificates, getManualCertificateBatch } = require('../controllers/manualCertificate');
const { verifyCertificate } = require('../controllers/certificate');
const { saveCertificateTemplate, validateTemplatePayload } = require('../controllers/certificateTemplate');
const { generateCertificateId, reserveCertificateId } = require('../utils/certificateId');
const { getCertificateAssetImage } = require('../controllers/certificateAsset');

test('recipient rows retain separate year, course, college, dates, department, hours and academic year', () => {
  const input = validateIssuePayload({ courseName: 'Shared course', designData: { department: 'Shared department', hours: 40, academicYear: '2026-2027' }, recipients: [
    { name: 'Ada', studentYear: 'III Year', courseName: 'Web Development', collegeName: 'Example College', department: 'BCA', startDate: '2026-01-10', endDate: '2026-02-10', hours: 36, academicYear: '2025-2026' },
    { name: 'Grace', courseName: 'Python', department: 'BSc', hours: '', academicYear: '' },
  ] });
  assert.deepEqual(input.names, ['Ada','Grace']);
  assert.equal(input.recipients[0].courseName, 'Web Development');
  assert.equal(input.recipients[0].designData.studentYear, 'III Year');
  assert.equal(input.recipients[0].designData.hours, 36);
  assert.equal(input.recipients[1].courseName, 'Python');
  assert.equal(input.recipients[1].designData.department, 'BSc');
  assert.equal(input.recipients[0].designData.collegeName, 'Example College');
  assert.equal(input.recipients[0].designData.startDate, '2026-01-10');
  assert.equal(input.recipients[0].designData.endDate, '2026-02-10');
  assert.equal(input.recipients[1].designData.hours, 40);
  assert.equal(input.recipients[1].designData.academicYear, '2026-2027');
  assert.throws(() => validateIssuePayload({ courseName: 'Course', recipients: [{ name: 'Ada' }, { name: 'Grace', hours: -1 }] }), /Recipient 2/);
});

test('unfinished Ramnad templates save without requiring issued-certificate fields', () => {
  const draft = validateTemplatePayload({ design: 'collaboration', designData: { layout: 'ramnad', layoutVersion: 2, nameSize: 24, academyName: 'Beeja Academy', collegeName: '', hours: '', academyLogoUrl: '', directorSignatureUrl: '' } });
  assert.equal(draft.courseName, '');
  assert.equal(draft.designData.layout, 'ramnad');
  assert.equal(draft.designData.hours, undefined);
  assert.throws(() => validateIssuePayload({ ...draft, names: ['Student'] }), /required/);
  assert.throws(() => validateTemplatePayload({ designData: { layout: 'unknown' } }), /layout/);
  assert.throws(() => validateTemplatePayload({ designData: { collegeLogoUrl: 'javascript:alert(1)' } }), /collegeLogoUrl/);
});

test('certificate export reads archived image bytes without fetching arbitrary URLs', async () => {
  const original = CertificateAsset.findOne;
  let requested;
  const bytes = Buffer.from([1, 2, 3]);
  CertificateAsset.findOne = query => { requested = query; return { select: async () => ({ data: bytes, mimeType: 'image/png' }) }; };
  const response = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, set() {}, type(mime) { this.mime = mime; return this; }, send(body) { this.body = body; return this; } };
  try {
    await getCertificateAssetImage({ query: { url: 'https://storage.example.com/logo.png' } }, response);
    assert.deepEqual(requested, { url: 'https://storage.example.com/logo.png' });
    assert.equal(response.mime, 'image/png');
    assert.deepEqual(response.body, bytes);
    await getCertificateAssetImage({ query: { url: 'file:///etc/passwd' } }, response);
    assert.equal(response.statusCode, 400);
  } finally { CertificateAsset.findOne = original; }
});

test('classic certificates preserve customized appearance and reject invalid styles', () => {
  const payload = { names: ['Ada'], courseName: 'Development', designData: { layoutVersion: 2, title: 'CERTIFICATE OF COMPLETION', accentColor: '#137d91', layout: 'modern', showQr: false, nameSize: 42, directorName: 'Academy Director' } };
  assert.deepEqual(validateIssuePayload(payload).designData, payload.designData);
  assert.throws(() => validateIssuePayload({ ...payload, designData: { accentColor: 'url(https://example.com)' } }), /accentColor/);
  assert.throws(() => validateIssuePayload({ ...payload, designData: { nameSize: 500 } }), /Name size/);
  assert.throws(() => validateIssuePayload({ ...payload, designData: { academyLogoUrl: 'javascript:alert(1)' } }), /uploaded image/);
});
test('Ramnad appearance is validated and retained in issued certificate data', () => {
  const input = validateIssuePayload({ names: ['Student'], courseName: 'Development', designData: { layoutVersion: 2, layout: 'ramnad', nameSize: 24, title: 'CERTIFICATE OF COMPLETION' } });
  assert.equal(input.designData.layout, 'ramnad');
  assert.equal(new Certificate({ designData: input.designData }).toObject().designData.layout, 'ramnad');
});

test('certificate and template database schemas retain the custom renderer version', async () => {
  const designData = { layoutVersion: 2, layout: 'modern', title: 'CUSTOM COMPLETION', accentColor: '#137d91', bodyText: 'Completed {course}', nameSize: 42, showQr: false };
  const certificate = new Certificate({ source: 'manual', certificateId: 'BA-26STYLE01', studentName: 'Student', courseName: 'Development', design: 'collaboration', designData });
  const template = new CertificateTemplate({ key: 'collaboration', design: 'collaboration', designData });
  await certificate.validate();
  await template.validate();
  assert.deepEqual(certificate.toObject().designData, designData);
  assert.deepEqual(template.toObject().designData, designData);
});

test('certificate IDs use the existing BA-year-letters-digits format', () => {
  assert.match(generateCertificateId(new Date('2026-09-21')), /^BA-26[A-Z]{2}\d{4}$/);
});

test('certificate ID reservation skips IDs that already exist', async () => {
  const reserved = new Set();
  let checks = 0;
  const fakeModel = { exists: async () => checks++ === 0 };
  const id = await reserveCertificateId(fakeModel, reserved);
  assert.match(id, /^BA-\d{2}[A-Z]{2}\d{4}$/);
  assert.equal(reserved.has(id), true);
});

test('manual certificate payload accepts one or many names with a shared title', () => {
  const input = validateIssuePayload({
    names: ['  Ada   Lovelace  ', 'Grace Hopper'],
    courseName: '  Web Development  ',
    completionDate: '2026-09-21',
  });
  assert.deepEqual(input.names, ['Ada Lovelace', 'Grace Hopper']);
  assert.equal(input.courseName, 'Web Development');
  assert.equal(input.categoryName, 'General');
  assert.equal(input.completionDate.toISOString().slice(0, 10), '2026-09-21');
});

test('manual certificate payload rejects empty names and oversized batches', () => {
  assert.throws(() => validateIssuePayload({ names: [''], courseName: 'Course' }), /Each name/);
  assert.throws(() => validateIssuePayload({ names: Array(101).fill('Student'), courseName: 'Course' }), /between 1 and 100/);
  assert.throws(() => validateIssuePayload({ names: ['Student'], courseName: '' }), /title/);
});

test('collaboration design validates and snapshots academy, college and image fields', () => {
  const designData = {
    academyName: 'Beeja Academy', collegeName: 'Sample College', department: 'Computer Applications',
    hours: 40, academicYear: '2026–2027', academyLogoUrl: 'https://example.com/academy.png',
    collegeLogoUrl: 'https://example.com/college.png', principalSignatureUrl: 'https://example.com/principal.png',
    directorSignatureUrl: 'https://example.com/director.png',
    principalName: 'A. Principal', principalTitle: 'Principal', directorName: 'B. Director', directorTitle: 'Director',
  };
  const input = validateIssuePayload({ names: ['Student'], courseName: 'Full Stack', design: 'collaboration', designData });
  assert.equal(input.design, 'collaboration');
  assert.equal(input.designData.hours, 40);
  assert.equal(input.designData.collegeName, 'Sample College');
  const withoutCollege = validateIssuePayload({ names: ['Student'], courseName: 'Full Stack', design: 'collaboration', designData: { ...designData, collegeName: '', collegeLogoUrl: '' } });
  assert.equal(withoutCollege.designData.collegeName, '');
  assert.equal(withoutCollege.designData.collegeLogoUrl, '');
});

test('admin can save reusable collaboration details and image URLs', async () => {
  const original = CertificateTemplate.findOneAndUpdate;
  let saved;
  CertificateTemplate.findOneAndUpdate = (query, update) => {
    saved = { ...query, ...update.$set };
    return { lean: async () => saved };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await saveCertificateTemplate({ user: { id: '507f1f77bcf86cd799439011' }, body: {
      courseName: 'Full Stack',
      designData: {
        academyName: 'Beeja Academy', collegeName: 'Sample College', department: 'Computer Applications',
        hours: 40, academicYear: '2026–2027', academyLogoUrl: 'https://example.com/academy.png',
        collegeLogoUrl: 'https://example.com/college.png', principalSignatureUrl: 'https://example.com/principal.png',
        directorSignatureUrl: 'https://example.com/director.png',
        principalName: 'A. Principal', principalTitle: 'Principal', directorName: 'B. Director', directorTitle: 'Director',
      },
    } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(saved.key, 'collaboration');
    assert.equal(saved.designData.collegeName, 'Sample College');
    assert.equal(saved.designData.directorSignatureUrl, 'https://example.com/director.png');
  } finally {
    CertificateTemplate.findOneAndUpdate = original;
  }
});

test('uploaded certificate image records retain their binary data in MongoDB', async () => {
  const asset = new CertificateAsset({
    key: 'certificate-assets/example.png', url: 'https://example.com/example.png',
    mimeType: 'image/png', originalName: 'logo.png', size: 3,
    data: Buffer.from([1, 2, 3]), uploadedBy: '507f1f77bcf86cd799439011',
  });
  await asset.validate();
  assert.deepEqual(Buffer.from(asset.data), Buffer.from([1, 2, 3]));
});

test('manual records validate without a linked course, user, or email', async () => {
  const certificate = new Certificate({
    source: 'manual',
    certificateId: 'BA-26MTEST',
    studentName: 'Ada Lovelace',
    courseName: 'Web Development',
  });
  await certificate.validate();
});

test('bulk issuing creates distinct verifiable records for each name', async () => {
  const originalInsertMany = Certificate.insertMany;
  const originalExists = Certificate.exists;
  let saved;
  Certificate.insertMany = async records => { saved = records; return records; };
  Certificate.exists = async () => false;
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await issueManualCertificates({
      user: { id: '507f1f77bcf86cd799439011' },
      body: { names: ['Ada Lovelace', 'Grace Hopper'], courseName: 'Web Development', recipients: [{ name: 'Ada Lovelace', department: 'BCA', hours: 40, academicYear: '2026-2027' }, { name: 'Grace Hopper', courseName: 'Python', department: 'BSc', hours: 36, academicYear: '2025-2026' }] },
    }, response);
    assert.equal(response.statusCode, 201);
    assert.equal(saved.length, 2);
    assert.notEqual(saved[0].certificateId, saved[1].certificateId);
    assert.match(saved[0].certificateId, /^BA-\d{2}[A-Z]{2}\d{4}$/);
    assert.equal(saved[0].batchId, saved[1].batchId);
    assert.equal(saved[0].source, 'manual');
    assert.equal(saved[0].designData.layoutVersion, 2);
    assert.equal(saved[0].courseName, 'Web Development');
    assert.equal(saved[1].courseName, 'Python');
    assert.equal(saved[1].designData.department, 'BSc');
    assert.equal(saved[1].designData.hours, 36);
    assert.equal(saved[1].designData.academicYear, '2025-2026');
  } finally {
    Certificate.insertMany = originalInsertMany;
    Certificate.exists = originalExists;
  }
});

test('public verification returns a manually issued certificate', async () => {
  const originalFindOne = Certificate.findOne;
  const manualRecord = { source: 'manual', certificateId: 'BA-26MTEST', studentName: 'Ada Lovelace' };
  Certificate.findOne = () => ({
    select() { return this; },
    populate() { return this; },
    lean() { return Promise.resolve(manualRecord); },
    then(resolve) { return Promise.resolve(manualRecord).then(resolve); },
  });
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await verifyCertificate({ params: { certificateId: manualRecord.certificateId } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.data.studentName, 'Ada Lovelace');
  } finally {
    Certificate.findOne = originalFindOne;
  }
});

test('issued certificate listing applies search, design, date and sort on the server', async () => {
  const originalFind = Certificate.find;
  const originalCount = Certificate.countDocuments;
  let query;
  let sorting;
  Certificate.find = value => {
    query = value;
    return {
      sort(value) { sorting = value; return this; },
      skip() { return this; },
      limit() { return this; },
      lean: async () => [],
    };
  };
  Certificate.countDocuments = async () => 0;
  const response = { json(body) { this.body = body; return this; } };
  try {
    await listManualCertificates({ query: { search: 'Ada.*', design: 'collaboration', from: '2026-09-01', to: '2026-09-30', sort: 'name' } }, response);
    assert.equal(response.body.success, true);
    assert.equal(query.design, 'collaboration');
    assert.equal(query.$or[0].studentName.$regex, 'Ada\\.\\*');
    assert.equal(query.issuedDate.$gte.toISOString().slice(0, 10), '2026-09-01');
    assert.equal(query.issuedDate.$lte.toISOString().slice(0, 10), '2026-09-30');
    assert.equal(sorting.studentName, 1);
  } finally {
    Certificate.find = originalFind;
    Certificate.countDocuments = originalCount;
  }
});

test('admin batch download retrieves every certificate in the issued batch', async () => {
  const originalFind = Certificate.find;
  const batchId = '550e8400-e29b-41d4-a716-446655440000';
  let query;
  Certificate.find = value => {
    query = value;
    return { sort() { return this; }, limit() { return this; }, lean: async () => [
      { certificateId: 'BA-26AA0001', batchId }, { certificateId: 'BA-26AA0002', batchId },
    ] };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await getManualCertificateBatch({ params: { batchId } }, response);
    assert.equal(query.batchId, batchId);
    assert.equal(response.body.data.length, 2);
  } finally {
    Certificate.find = originalFind;
  }
});


test('formatting and signature sizes survive template, single and bulk model serialization', () => {
  const formatting = { watermarkOpacity: 0.18, watermarkSpacing: 120, headingLetterSpacing: 4.5, showSecondWatermark: true, secondWatermarkOpacity: 0.11, secondWatermarkX: 120, secondWatermarkY: 140, secondWatermarkWidth: 210, secondWatermarkHeight: 190, showAcademyLogo: false, showCollegeLogo: false, academyLogoWidth: 180, academyLogoHeight: 94, academyLogoX: 28, academyLogoY: 22, collegeLogoWidth: 120, collegeLogoX: 800, principalOrganization: 'College Training Department', directorOrganization: 'Industry Division', headingTextSize: 30, headingTextBold: false, bodyTextSize: 19, bodyTextBold: true, principalNameTextSize: 15, principalTitleTextBold: true, directorOrganizationTextSize: 12, directorSignatureWidth: 220, directorSignatureHeight: 65, principalSignatureWidth: 180, principalSignatureHeight: 50 };
  const designData = { layoutVersion: 2, layout: 'ramnad', title: 'COMPLETION', ...formatting };
  const template = validateTemplatePayload({ design: 'classic', designData });
  const savedTemplate = new CertificateTemplate({ ...template }).toObject();
  for (const [key, value] of Object.entries(formatting)) assert.equal(savedTemplate.designData[key], value, `template ${key}`);
  for (const recipients of [undefined, [{ name: 'Ada', department: 'BCA' }, { name: 'Grace', department: 'BSc' }]]) {
    const validated = validateIssuePayload({ design: 'classic', names: ['Ada'], courseName: 'Development', designData, ...(recipients ? { recipients } : {}) });
    for (const input of validated.recipients || [validated]) {
      const stored = new Certificate({ ...input, studentName: input.names[0], certificateId: 'BA-TEST', source: 'manual' }).toObject();
      for (const [key, value] of Object.entries(formatting)) assert.equal(stored.designData[key], value, `certificate ${key}`);
    }
  }
});

test('LMS library includes legacy course certificates and keeps manual queries separate', async () => {
  const originalFind = Certificate.find, originalCount = Certificate.countDocuments;
  const queries = [];
  Certificate.find = query => { queries.push(query); return { sort() { return this; }, skip() { return this; }, limit() { return this; }, lean: async () => [] }; };
  Certificate.countDocuments = async () => 0;
  const res = { json(body) { this.body = body; return this; } };
  try {
    await listManualCertificates({ query: { source: 'course' } }, res);
    assert.deepEqual(queries[0].source, { $ne: 'manual' });
    await listManualCertificates({ query: {} }, res);
    assert.equal(queries[1].source, 'manual');
  } finally { Certificate.find = originalFind; Certificate.countDocuments = originalCount; }
});

test('purple workshop design and its tagline persist in template and certificate schemas', () => {
  const designData = { layoutVersion: 2, layout: 'workshop', title: 'CERTIFICATE', brandTagline: 'Professional Mentoring', dateLabel: 'CONDUCTED ON' };
  const input = validateIssuePayload({ names: ['Ada'], courseName: 'Robotics', designData });
  assert.equal(new Certificate({ designData: input.designData }).toObject().designData.layout, 'workshop');
  const template = validateTemplatePayload({ design: 'classic', designData });
  assert.equal(new CertificateTemplate(template).toObject().designData.brandTagline, 'Professional Mentoring');
});

test('third logo settings persist in templates and issued certificates', () => {
  const designData = { thirdLogoUrl: 'https://example.com/third.png', showThirdLogo: true, thirdLogoX: 440, thirdLogoY: 22, thirdLogoWidth: 120, thirdLogoHeight: 60 };
  for (const result of [validateTemplatePayload({ designData }), validateIssuePayload({ names: ['Ada'], courseName: 'Course', designData })]) {
    for (const [key, value] of Object.entries(designData)) assert.equal(result.designData[key], value);
  }
  const stored = new Certificate({ designData });
  assert.equal(stored.designData.thirdLogoUrl, designData.thirdLogoUrl);
  assert.equal(new CertificateTemplate({ designData }).designData.thirdLogoWidth, 120);
  assert.throws(() => validateTemplatePayload({ designData: { thirdLogoUrl: 'javascript:alert(1)' } }), /thirdLogoUrl/);
  assert.throws(() => validateTemplatePayload({ designData: { thirdLogoWidth: 500 } }), /thirdLogoWidth/);
});

test('background and global and individual line spacing persist and validate', () => {
  const designData = { backgroundColor: '#e0f2ff', headingSpaceAfter: 18, subtitleSpaceAfter: 14, lineHeight: 1.5, bodyLineHeight: 2.2, headingLineHeight: 1.1 };
  for (const result of [validateTemplatePayload({ designData }), validateIssuePayload({ names: ['Ada'], courseName: 'Course', designData })]) {
    for (const [key, value] of Object.entries(designData)) assert.equal(result.designData[key], value);
  }
  assert.equal(new Certificate({ designData }).designData.bodyLineHeight, 2.2);
  assert.equal(new CertificateTemplate({ designData }).designData.lineHeight, 1.5);
  assert.throws(() => validateTemplatePayload({ designData: { bodyLineHeight: 5 } }), /bodyLineHeight/);
  assert.throws(() => validateTemplatePayload({ designData: { lineHeight: '1.5' } }), /lineHeight/);
});
