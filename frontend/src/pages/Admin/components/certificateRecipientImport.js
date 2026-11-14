export function parseCertificateRecipients(rows) {
  if (!rows.length) throw new Error('The file is empty');
  const header = rows[0].map(value => String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' '));
  const aliases = { name: ['name', 'full name', 'student name', 'participant name', 'recipient name'], first: ['first name', 'firstname'], last: ['last name', 'lastname'], studentYear: ['year', 'year of study', 'student year', 'class year', 'class'], department: ['department', 'dept', 'department name'], collegeName: ['college', 'college name', 'institution', 'institution name'], courseName: ['course', 'course name', 'program', 'program name', 'course title'], startDate: ['start date', 'course start date', 'from date'], endDate: ['end date', 'course end date', 'to date', 'completion date'], hours: ['hours', 'course hours', 'duration', 'duration hours'], academicYear: ['academic year', 'academic session'] };
  const columns = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, header.findIndex(value => names.includes(value))]));
  const hasDetails = ['studentYear', 'department', 'collegeName', 'courseName', 'startDate', 'endDate', 'hours', 'academicYear'].some(key => columns[key] >= 0);
  const hasHeader = columns.name >= 0 || columns.first >= 0;
  if (hasDetails && !hasHeader) throw new Error('Add a Student Name column to your spreadsheet');
  const recipients = rows.slice(hasHeader ? 1 : 0).flatMap((row, index) => {
    if (!row.some(value => String(value ?? '').trim())) return [];
    const cell = key => columns[key] >= 0 ? String(row[columns[key]] ?? '').trim() : '';
    const dateCell = key => {
      if (columns[key] < 0) return '';
      const value = row[columns[key]];
      if (typeof value === 'number' && Number.isFinite(value)) {
        const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
      }
      return String(value ?? '').trim();
    };
    const name = (columns.name >= 0 ? cell('name') : columns.first >= 0 ? `${cell('first')} ${cell('last')}` : String(row[0] ?? '')).trim().replace(/\s+/g, ' ');
    const number = index + (hasHeader ? 2 : 1);
    if (!name || name.length > 120) throw new Error(`Row ${number}: enter a name of 1 to 120 characters`);
    const recipient = { name, studentYear: cell('studentYear'), department: cell('department'), collegeName: cell('collegeName'), courseName: cell('courseName'), startDate: dateCell('startDate'), endDate: dateCell('endDate'), hours: cell('hours'), academicYear: cell('academicYear') };
    if ([recipient.studentYear, recipient.department, recipient.collegeName, recipient.academicYear, recipient.startDate, recipient.endDate].some(value => value.length > 180) || recipient.courseName.length > 160) throw new Error(`Row ${number}: a certificate detail is too long`);
    if (recipient.hours && (!Number.isFinite(Number(recipient.hours)) || Number(recipient.hours) <= 0 || Number(recipient.hours) > 10000)) throw new Error(`Row ${number}: hours must be between 1 and 10,000`);
    return [recipient];
  });
  if (!recipients.length) throw new Error('No names were found in the file');
  return { recipients, hasDetails };
}
