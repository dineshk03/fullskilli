export const certificateNames = text => text.split(/\r?\n/).map(name => name.trim().replace(/\s+/g, ' ')).filter(Boolean);
export const uniqueCertificateNames = names => {
  const seen = new Set();
  return names.filter(name => {
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
export const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const displayDate = value => {
  if (!value) return 'Not available';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
export function certificateDraftErrors(draft) {
  const errors = {};
  if (draft.designData?.layoutVersion === 2) {
    if (!draft.designData.title?.trim()) errors.title = 'Enter a certificate heading.';
    if (!draft.designData.bodyText?.trim()) errors.bodyText = 'Enter an achievement message.';
  }
  if (!draft.courseName.trim()) errors.courseName = 'Enter a course or program title.';
  if (!draft.completionDate || Number.isNaN(new Date(draft.completionDate).getTime())) errors.completionDate = 'Choose a valid completion date.';
  const names = certificateNames(draft.nameText);
  if (draft.recipientRows?.some(row => !row.name?.trim() || row.name.trim().length > 120 || (row.hours !== undefined && row.hours !== '' && (!Number.isFinite(Number(row.hours)) || Number(row.hours) <= 0 || Number(row.hours) > 10000)))) errors.nameText = 'Check recipient names and hours in the imported rows.';
  if (!names.length) errors.nameText = 'Add at least one recipient.';
  else if (names.length > 100) errors.nameText = 'A batch can contain up to 100 recipients.';
  else if (names.some(name => name.length > 120)) errors.nameText = 'Each name must be 120 characters or fewer.';
  if (draft.design === 'collaboration') {
    for (const key of ['academyName', 'academicYear', 'principalName', 'principalTitle', 'directorName', 'directorTitle']) {
      if (!String(draft.designData[key] || '').trim()) errors[key] = 'This field is required for a collaboration certificate.';
    }
    const hours = Number(draft.designData.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 10000) errors.hours = 'Enter course hours between 1 and 10,000.';
    for (const key of ['academyLogoUrl', 'principalSignatureUrl', 'directorSignatureUrl']) {
      if ((key === 'academyLogoUrl' && draft.designData.showAcademyLogo === false) || (key === 'collegeLogoUrl' && draft.designData.showCollegeLogo === false)) continue;
      if (!draft.designData[key] && !(key === 'academyLogoUrl' && draft.designData.useDefaultAcademyLogo)) errors[key] = 'Upload this image before continuing.';
    }
  }
  return errors;
}
