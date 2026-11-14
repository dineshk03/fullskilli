import { expect, it } from 'vitest';
import { parseCertificateRecipients } from '../pages/Admin/components/certificateRecipientImport';
it('imports per-recipient certificate details by column header', () => {
  const result = parseCertificateRecipients([['Course','Student Name','Academic Year','Hours','Department','College Name','Start Date','End Date'], ['Web Development','Ada','2026-2027',40,'BCA','Example College',45292,45322], ['Python','Grace','2025-2026',36,'BSc','Other College','2026-01-10','2026-02-10']]);
  expect(result.hasDetails).toBe(true);
  expect(result.recipients[0]).toMatchObject({ collegeName: 'Example College', startDate: '2024-01-01', endDate: '2024-01-31' });
  expect(result.recipients[1]).toEqual({ name: 'Grace', studentYear: '', courseName: 'Python', academicYear: '2025-2026', hours: '36', department: 'BSc', collegeName: 'Other College', startDate: '2026-01-10', endDate: '2026-02-10' });
});
it('preserves name-only imports and reports invalid spreadsheet rows', () => {
  expect(parseCertificateRecipients([['Ada'],['Grace']]).recipients.map(row => row.name)).toEqual(['Ada','Grace']);
  expect(() => parseCertificateRecipients([['Student Name','Hours'],['Ada','wrong']])).toThrow('Row 2');
  expect(() => parseCertificateRecipients([['Student Name','Hours'],['',40]])).toThrow('Row 2');
});
