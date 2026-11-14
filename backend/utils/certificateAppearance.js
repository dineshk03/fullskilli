const textFields = ['tagline', 'date', 'academy', 'collaboration', 'college', 'details', 'heading', 'subtitle', 'stars', 'introduction', 'recipient', 'recipientLine', 'recipientDetails', 'body', 'bodyLine1', 'bodyLine2', 'bodyLine3', 'bodyLine4', 'principalName', 'principalTitle', 'principalOrganization', 'directorName', 'directorTitle', 'directorOrganization', 'footer', 'verification'];
const appearanceSchema = {
  lineHeight: Number, layoutVersion: Number, layout: String, accentColor: String, textColor: String, backgroundColor: String, headingOffsetX: Number, headingOffsetY: Number,
  principalOrganization: String, directorOrganization: String,
  brandTagline: String, dateLabel: String,
  title: String, subtitle: String, introduction: String, bodyText: String, footerText: String, startDate: String, endDate: String,
  font: String, borderStyle: String, watermarkOpacity: Number, watermarkSpacing: Number, secondWatermarkOpacity: Number, secondWatermarkX: Number, secondWatermarkY: Number, secondWatermarkWidth: Number, secondWatermarkHeight: Number, showThirdLogo: Boolean, thirdLogoUrl: String, showAcademyLogo: Boolean, showCollegeLogo: Boolean, showCollaboration: Boolean, showDepartment: Boolean, showRecipientCollege: Boolean, linkAchievementLines: Boolean, useDefaultAcademyLogo: Boolean, showCompletionDate: Boolean, showWatermark: Boolean, showSecondWatermark: Boolean, showQr: Boolean, qrSize: Number, showSeal: Boolean, nameSize: Number,
};
for (const key of textFields) { appearanceSchema[`${key}TextSize`] = Number; appearanceSchema[`${key}TextBold`] = Boolean; appearanceSchema[`${key}LetterSpacing`] = Number; appearanceSchema[`${key}TextAlign`] = String; appearanceSchema[`${key}LineHeight`] = Number; appearanceSchema[`${key}SpaceAfter`] = Number; appearanceSchema[`${key}OffsetX`] = Number; appearanceSchema[`${key}OffsetY`] = Number; }
for (const role of ['principal', 'director']) for (const dimension of ['Width', 'Height']) appearanceSchema[`${role}Signature${dimension}`] = Number;
for (const role of ['academy', 'college', 'third']) for (const dimension of ['X', 'Y', 'Width', 'Height']) appearanceSchema[`${role}Logo${dimension}`] = Number;
function validateAppearance(raw = {}) {
  const result = {};
  for (const field of textFields) for (const [axis, min, max] of [['X', -400, 400], ['Y', -250, 250]]) {
    const key = `${field}Offset${axis}`;
    if (raw[key] === undefined) continue;
    if (!Number.isInteger(raw[key]) || raw[key] < min || raw[key] > max) throw new Error(`${key} must be between ${min} and ${max}`);
    result[key] = raw[key];
  }
  // Accept coordinates saved by the first draggable-heading release; the
  // renderer clamps them to its newer collision-safe visual boundaries.
  for (const [key, min, max] of [['headingOffsetX', -300, 300], ['headingOffsetY', -120, 120]]) {
    if (raw[key] === undefined) continue;
    if (!Number.isInteger(raw[key]) || raw[key] < min || raw[key] > max) throw new Error(`${key} must be between ${min} and ${max}`);
    result[key] = raw[key];
  }
  for (const field of textFields) {
    const key = `${field}SpaceAfter`;
    if (raw[key] === undefined) continue;
    if (!Number.isInteger(raw[key]) || raw[key] < 0 || raw[key] > 80) throw new Error(`${key} must be between 0 and 80`);
    result[key] = raw[key];
  }
  for (const key of ['lineHeight' , ...textFields.map(field => `${field}LineHeight`)]) {
    if (raw[key] === undefined) continue;
    if (!Number.isFinite(raw[key]) || raw[key] < 0.8 || raw[key] > 3) throw new Error(`${key} must be between 0.8 and 3`);
    result[key] = raw[key];
  }
  if (raw.watermarkOpacity !== undefined) {
    if (!Number.isFinite(raw.watermarkOpacity) || raw.watermarkOpacity < 0.05 || raw.watermarkOpacity > 0.5) throw new Error('Watermark visibility must be between 5% and 50%');
    result.watermarkOpacity = raw.watermarkOpacity;
  }
  if (raw.watermarkSpacing !== undefined) {
    if (!Number.isInteger(raw.watermarkSpacing) || raw.watermarkSpacing < 55 || raw.watermarkSpacing > 180) throw new Error('Watermark spacing must be between 55 and 180');
    result.watermarkSpacing = raw.watermarkSpacing;
  }
  if (raw.secondWatermarkOpacity !== undefined) {
    if (!Number.isFinite(raw.secondWatermarkOpacity) || raw.secondWatermarkOpacity < 0.02 || raw.secondWatermarkOpacity > 0.35) throw new Error('Second watermark visibility must be between 2% and 35%');
    result.secondWatermarkOpacity = raw.secondWatermarkOpacity;
  }
  for (const [key, min, max] of [['secondWatermarkX', 0, 980], ['secondWatermarkY', 0, 680], ['secondWatermarkWidth', 20, 500], ['secondWatermarkHeight', 20, 400]]) {
    if (raw[key] === undefined) continue;
    if (!Number.isInteger(raw[key]) || raw[key] < min || raw[key] > max) throw new Error(`${key} must be between ${min} and ${max}`);
    result[key] = raw[key];
  }
  for (const role of ['academy', 'college', 'third']) for (const [dimension, min, max] of [['X', 0, 980], ['Y', 0, 680], ['Width', 20, 400], ['Height', 20, 250]]) {
    const key = `${role}Logo${dimension}`;
    if (raw[key] === undefined) continue;
    if (!Number.isInteger(raw[key]) || raw[key] < min || raw[key] > max) throw new Error(`${key} must be between ${min} and ${max}`);
    result[key] = raw[key];
  }
  for (const role of ['principal', 'director']) for (const dimension of ['Width', 'Height']) {
    const key = `${role}Signature${dimension}`;
    if (raw[key] === undefined) continue;
    const max = dimension === 'Width' ? 300 : 100;
    if (!Number.isInteger(raw[key]) || raw[key] < 10 || raw[key] > max) throw new Error(`${key} must be between 10 and ${max}`);
    result[key] = raw[key];
  }
  for (const key of textFields) {
    const size = `${key}TextSize`, bold = `${key}TextBold`, spacing = `${key}LetterSpacing`, align = `${key}TextAlign`;
    if (raw[size] !== undefined) {
      if (!Number.isInteger(raw[size]) || raw[size] < 6 || raw[size] > 72) throw new Error(`${size} must be between 6 and 72`);
      result[size] = raw[size];
    }
    if (raw[bold] !== undefined) {
      if (typeof raw[bold] !== 'boolean') throw new Error(`Invalid ${bold}`);
      result[bold] = raw[bold];
    }
    if (raw[spacing] !== undefined) {
      if (!Number.isFinite(raw[spacing]) || raw[spacing] < -2 || raw[spacing] > 20) throw new Error(`${spacing} must be between -2 and 20`);
      result[spacing] = raw[spacing];
    }
    if (raw[align] !== undefined) {
      if (!['left', 'center', 'right', 'justify'].includes(raw[align])) throw new Error(`Invalid ${align}`);
      result[align] = raw[align];
    }
  }
  for (const key of ['department', 'academicYear', 'startDate', 'endDate']) {
    if (raw[key] === undefined) continue;
    if (typeof raw[key] !== 'string' || raw[key].trim().length > 180) throw new Error(`Invalid ${key} (maximum 180 characters)`);
    result[key] = raw[key].trim();
  }
  if (raw.hours !== undefined && raw.hours !== '') {
    const hours = Number(raw.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 10000) throw new Error('Hours must be between 1 and 10000');
    result.hours = hours;
  }
  if (raw.layoutVersion !== undefined) {
    if (raw.layoutVersion !== 2) throw new Error('Invalid certificate layout version');
    result.layoutVersion = 2;
  }
  for (const key of ['accentColor', 'textColor', 'backgroundColor']) {
    if (raw[key] === undefined) continue;
    if (typeof raw[key] !== 'string' || !/^#[a-f\d]{6}$/i.test(raw[key])) throw new Error(`Invalid ${key}`);
    result[key] = raw[key];
  }
  for (const [key, allowed] of Object.entries({ layout: ['formal', 'modern', 'minimal', 'ramnad', 'saEngg', 'workshop'], font: ['serif', 'sans'], borderStyle: ['double', 'single', 'none'] })) {
    if (raw[key] === undefined) continue;
    if (!allowed.includes(raw[key])) throw new Error(`Invalid ${key}`);
    result[key] = raw[key];
  }
  for (const [key, max] of Object.entries({ brandTagline: 80, dateLabel: 80, title: 60, subtitle: 80, introduction: 120, bodyText: 600, footerText: 180, academyName: 180, collegeName: 180, studentYear: 180, directorName: 180, directorTitle: 180, principalName: 180, principalTitle: 180, principalOrganization: 180, directorOrganization: 180 })) {
    if (raw[key] === undefined) continue;
    if (typeof raw[key] !== 'string' || raw[key].length > max || (['title', 'bodyText'].includes(key) && !raw[key].trim())) throw new Error(`${key} must contain ${['title', 'bodyText'].includes(key) ? '1' : '0'} to ${max} characters`);
    result[key] = raw[key].trim();
  }
  for (const key of ['showWatermark', 'showSecondWatermark', 'showQr', 'showSeal', 'showCompletionDate', 'useDefaultAcademyLogo', 'showAcademyLogo', 'showCollegeLogo', 'showCollaboration', 'showDepartment', 'showRecipientCollege', 'linkAchievementLines', 'showThirdLogo']) {
    if (raw[key] === undefined) continue;
    if (typeof raw[key] !== 'boolean') throw new Error(`Invalid ${key}`);
    result[key] = raw[key];
  }
  if (raw.nameSize !== undefined) {
    if (!Number.isInteger(raw.nameSize) || raw.nameSize < 20 || raw.nameSize > 56) throw new Error('Name size must be between 20 and 56');
    result.nameSize = raw.nameSize;
  }
  if (raw.qrSize !== undefined) {
    if (!Number.isInteger(raw.qrSize) || raw.qrSize < 32 || raw.qrSize > 120) throw new Error('QR code size must be between 32 and 120 pixels');
    result.qrSize = raw.qrSize;
  }
  for (const key of ['thirdLogoUrl', 'academyLogoUrl', 'directorSignatureUrl', 'principalSignatureUrl']) {
    if (raw[key] === undefined) continue;
    if (typeof raw[key] !== 'string' || (raw[key] && !/^https:\/\//i.test(raw[key])) || raw[key].length > 2000) throw new Error(`${key} must be an uploaded image`);
    result[key] = raw[key];
  }
  return result;
}
module.exports = { appearanceSchema, validateAppearance };
