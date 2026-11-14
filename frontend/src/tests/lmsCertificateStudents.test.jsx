import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import LmsCertificateStudents from '../pages/Admin/components/LmsCertificateStudents';
import { getLmsEnrollments, createLmsCertificate, getCertificateTemplate, saveCertificateTemplate } from '../services/operations/certificateAPI';
vi.mock('../services/operations/certificateAPI', () => ({ getLmsEnrollments: vi.fn(), createLmsCertificate: vi.fn(), getCertificateTemplate: vi.fn().mockResolvedValue(null), saveCertificateTemplate: vi.fn(), uploadCertificateAsset: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('lists enrollments, restricts incomplete courses and creates a certificate for an eligible student', async () => {
  const eligible = { studentId: 'student-1', courseId: 'course-1', studentName: 'Ada', email: 'ada@example.com', courseName: 'Development', completion: 100, eligible: true };
  getLmsEnrollments.mockResolvedValue({ data: [eligible, { ...eligible, studentId: 'student-2', studentName: 'Grace', completion: 50, eligible: false }], pages: 1 });
  const certificate = { certificateId: 'BA-TEST', studentName: 'Ada' };
  createLmsCertificate.mockResolvedValue(certificate);
  const onPreview = vi.fn(), onIssued = vi.fn();
  render(<LmsCertificateStudents token="admin-token" onPreview={onPreview} onIssued={onIssued} onDownload={vi.fn()} />);
  const ada = (await screen.findByText('Ada')).closest('tr');
  const grace = screen.getByText('Grace').closest('tr');
  expect(within(grace).getByRole('button', { name: 'Create certificate' }).disabled).toBe(true);
  fireEvent.click(within(ada).getByRole('button', { name: 'Create certificate' }));
  await waitFor(() => expect(onPreview).toHaveBeenCalledWith(certificate));
  expect(createLmsCertificate).toHaveBeenCalledWith('student-1', 'course-1', 'admin-token', 'standard');
  expect(onIssued).toHaveBeenCalledOnce();
  expect(within(ada).getByRole('button', { name: 'Download PDF' })).toBeTruthy();
});

it('previews a saved design and sends that choice when creating an LMS certificate', async () => {
  getCertificateTemplate.mockResolvedValue({ design: 'classic', designData: { layoutVersion: 2, title: 'CUSTOM LMS AWARD', bodyText: 'Completed {course}', showQr: false } });
  getLmsEnrollments.mockResolvedValue({ data: [{ studentId: 'student-1', courseId: 'course-1', studentName: 'Ada', courseName: 'Development', completion: 100, eligible: true }], pages: 1 });
  createLmsCertificate.mockResolvedValue({ certificateId: 'BA-CUSTOM' });
  render(<LmsCertificateStudents token="admin-token" onPreview={vi.fn()} onIssued={vi.fn()} onDownload={vi.fn()} />);
  await screen.findByText('Ada');
  fireEvent.change(screen.getByLabelText('LMS certificate design'), { target: { value: 'saved' } });
  expect(screen.getByText('CUSTOM LMS AWARD')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Create certificate' }));
  await waitFor(() => expect(createLmsCertificate).toHaveBeenCalledWith('student-1', 'course-1', 'admin-token', 'saved'));
});

it('edits and saves the LMS design in place without opening the manual composer', async () => {
  getCertificateTemplate.mockResolvedValue(null);
  getLmsEnrollments.mockResolvedValue({ data: [], pages: 1 });
  saveCertificateTemplate.mockImplementation(async payload => payload);
  render(<LmsCertificateStudents token="admin-token" onPreview={vi.fn()} onIssued={vi.fn()} onDownload={vi.fn()} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Edit LMS design' }).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Edit LMS design' }));
  const editor = screen.getByRole('region', { name: 'LMS certificate design editor' });
  fireEvent.change(within(editor).getByLabelText('Certificate heading'), { target: { value: 'LMS ACHIEVEMENT' } });
  fireEvent.click(within(editor).getByRole('button', { name: 'Save LMS design' }));
  await waitFor(() => expect(saveCertificateTemplate).toHaveBeenCalledWith(expect.objectContaining({ scope: 'lms', designData: expect.objectContaining({ title: 'LMS ACHIEVEMENT' }) }), 'admin-token'));
  await waitFor(() => expect(screen.queryByRole('region', { name: 'LMS certificate design editor' })).toBeNull());
  expect(screen.getByRole('region', { name: 'LMS enrolled students' })).toBeTruthy();
  expect(screen.getByLabelText('LMS certificate design').value).toBe('saved');
  expect(getCertificateTemplate).toHaveBeenCalledWith('admin-token', 'lms');
});
