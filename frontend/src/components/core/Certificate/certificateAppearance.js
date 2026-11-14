export const certificateAppearance = {
  layoutVersion: 2, layout: 'formal', accentColor: '#b58a35', textColor: '#182b42', backgroundColor: '#fffdf7',
  title: 'CERTIFICATE', subtitle: 'OF ACHIEVEMENT', introduction: 'This certificate is proudly presented to',
  bodyText: 'For successfully completing {course}. Your dedication, effort and commitment to learning are recognized with distinction.',
  footerText: 'Recognizing dedication. Celebrating achievement.', font: 'serif', borderStyle: 'double',
  showWatermark: false, showQr: true, qrSize: 72, showSeal: true, linkAchievementLines: false, nameSize: 46,
};
export const certificateBranding = {
  academyName: 'Beeja Academy', collegeName: '', showCollaboration: true, showDepartment: true, showRecipientCollege: true, studentYear: '', department: '', hours: '', academicYear: '', collegeDetails: '',
  academyLogoUrl: '', collegeLogoUrl: '', thirdLogoUrl: '', principalSignatureUrl: '', directorSignatureUrl: '',
  principalOrganization: '', directorOrganization: '',
  principalName: '', principalTitle: 'Principal', directorName: '', directorTitle: 'Director',
};
export const certificatePresets = {
  workshop: { layout: 'workshop', accentColor: '#963394', textColor: '#171b20', backgroundColor: '#ffffff', font: 'sans', borderStyle: 'none', title: 'CERTIFICATE', subtitle: 'OF COMPLETION', introduction: 'PRESENTED TO', bodyText: 'FOR SUCCESSFULLY COMPLETING THE\n{course}', footerText: '', brandTagline: '', dateLabel: '', showCompletionDate: false, showWatermark: true, watermarkOpacity: 0.18, watermarkSpacing: 62, showSeal: false, nameSize: 46 },
  ramnad: { layout: 'ramnad', accentColor: '#59b5e3', textColor: '#282264', backgroundColor: '#ffffff', font: 'sans', borderStyle: 'double', title: 'CERTIFICATE OF COMPLETION', subtitle: '', introduction: 'This is to certify that Mr./Ms.', bodyText: 'has successfully completed the Value Added Course on {course}\nconducted for {hours} hours during the academic year {year}.', footerText: '', showSeal: false, nameSize: 24 },
  saEngg: { layout: 'saEngg', accentColor: '#55b5e6', textColor: '#2d286b', backgroundColor: '#ffffff', font: 'sans', borderStyle: 'double', title: 'CERTIFICATE OF COMPLETION', subtitle: '', introduction: 'This is to certify that Mr./Ms.', bodyText: 'has successfully completed the Value Added Course on {course}\nconducted from {startDate} to {endDate} during the academic year {year}.', footerText: '', showSeal: false, showQr: false, nameSize: 24, collegeSpaceAfter: 12, headingSpaceAfter: 12, principalTitle: 'GM - Programs', directorTitle: 'Director' },
  formal: { layout: 'formal', accentColor: '#b58a35', textColor: '#182b42', backgroundColor: '#fffdf7', font: 'serif', borderStyle: 'double' },
  modern: { layout: 'modern', accentColor: '#137d91', textColor: '#15354b', backgroundColor: '#ffffff', font: 'sans', borderStyle: 'single' },
  minimal: { layout: 'minimal', accentColor: '#6b56a5', textColor: '#282438', backgroundColor: '#ffffff', font: 'serif', borderStyle: 'none' },
};
export const certificatePresetLabels = { workshop: 'Purple workshop', formal: 'Classic elegance', modern: 'Modern edge', minimal: 'Minimal studio', ramnad: 'Ramnad design', saEngg: 'SA Engg' };

// Optional overrides preserve each layout's original typography until edited.
export const certificateTextFields = [
  ['academy', 'Issuing organization', 25, true], ['collaboration', 'Collaboration label', 12, true],
  ['college', 'College name', 25, true], ['details', 'College details', 11, false],
  ['heading', 'Certificate heading', 25, true], ['subtitle', 'Certificate subtitle', 12, false],
  ['stars', 'Blue stars / decoration', 12, false],
  ['introduction', 'Recipient introduction', 19, false], ['recipient', 'Recipient name', 24, true],
  ['recipientLine', 'Recipient name line', 19, false], ['studentYear', 'Year / class', 16, false],
  ['recipientDetails', 'Department and college line', 19, false], ['body', 'Achievement message', 19, false], ['bodyLine1', 'Achievement line 1', 19, false], ['bodyLine2', 'Achievement line 2', 19, false], ['bodyLine3', 'Achievement line 3', 19, false], ['bodyLine4', 'Achievement line 4', 19, false],
  ['principalName', 'Second signatory name', 12, true], ['principalTitle', 'Second signatory title', 10, false],
  ['principalOrganization', 'Second signatory organization', 10, true],
  ['directorName', 'Academy signatory name', 12, true], ['directorTitle', 'Academy signatory title', 10, false],
  ['directorOrganization', 'Academy signatory organization', 10, true], ['footer', 'Footer and certificate ID', 9, false],
  ['verification', 'Verification label', 10, false],
];

// Keep certificate typography predictable in the editor, browser preview and
// raster/PDF exports. Individual saved overrides still take precedence.
export const certificateLineHeights = {
  academy: 1.2, collaboration: 1.3, college: 1.2, details: 1.4,
  heading: 1.2, subtitle: 1.3, introduction: 1.4, recipient: 1.15,
  recipientDetails: 1.45, body: 1.55,
  principalName: 1.25, principalTitle: 1.3, principalOrganization: 1.3,
  directorName: 1.25, directorTitle: 1.3, directorOrganization: 1.3,
  footer: 1.4, verification: 1.35,
};

const layoutLineHeights = {
  workshop: {
    heading: 1, subtitle: 1, introduction: 1, recipient: 1.2, body: 1.5,
    principalName: 1.2, principalTitle: 1.2, principalOrganization: 1.2,
    directorName: 1.2, directorTitle: 1.2, directorOrganization: 1.2,
  },
  ramnad: { heading: 1.25, subtitle: 1.4, recipient: 1, department: 1.5, body: 1.55 },
  saEngg: { heading: 1.2, recipient: 1.15, recipientDetails: 1.45, body: 1.55 },
};

export function certificateTextStyle(data, key) {
  const style = {};
  const offsetX = data[`${key}OffsetX`];
  const offsetY = data[`${key}OffsetY`];
  if (Number.isFinite(offsetX) || Number.isFinite(offsetY)) {
    style.position = 'relative';
    style.left = Number.isFinite(offsetX) ? offsetX : 0;
    style.top = Number.isFinite(offsetY) ? offsetY : 0;
    style.zIndex = 4;
  }
  if (Number.isInteger(data[`${key}TextSize`])) style.fontSize = data[`${key}TextSize`];
  if (typeof data[`${key}TextBold`] === 'boolean') style.fontWeight = data[`${key}TextBold`] ? 700 : 400;
  if (Number.isFinite(data[`${key}LetterSpacing`])) style.letterSpacing = data[`${key}LetterSpacing`];
  if (['left', 'center', 'right', 'justify'].includes(data[`${key}TextAlign`])) style.textAlign = data[`${key}TextAlign`];
  const lineHeight = data[`${key}LineHeight`] ?? data.lineHeight ?? layoutLineHeights[data.layout]?.[key] ?? certificateLineHeights[key];
  if (Number.isFinite(lineHeight)) style.lineHeight = lineHeight;
  if (Number.isInteger(data[`${key}SpaceAfter`])) style.marginBottom = data[`${key}SpaceAfter`];
  return style;
}
