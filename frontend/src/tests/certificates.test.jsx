import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ManualCertificates from '../pages/Admin/components/ManualCertificates';
import CertificateModal from '../components/core/Certificate/CertificateModal';
import { certificateDraftErrors, certificateNames, uniqueCertificateNames } from '../pages/Admin/components/certificateWorkspaceUtils';
import { getManualCertificates, getCertificateTemplate, issueManualCertificates, saveCertificateTemplate, getLmsEnrollments } from '../services/operations/certificateAPI';

vi.mock('react-redux', () => ({ useSelector: selector => selector({ auth: { token: 'admin-test-token' } }) }));
vi.mock('../services/operations/certificateAPI', () => ({
  getLmsEnrollments: vi.fn(), createLmsCertificate: vi.fn(), getManualCertificates: vi.fn(), getCertificateTemplate: vi.fn(), issueManualCertificates: vi.fn(),
  uploadCertificateAsset: vi.fn(), saveCertificateTemplate: vi.fn(), getCertificateBatch: vi.fn()
}));
vi.mock('../utils/certificatePdf', () => ({ exportCertificatesPdf: vi.fn() }));
vi.mock('../components/core/Certificate/CertificateDesign', () => ({ default: () => <div>Certificate artwork</div> }));

const ada = { certificateId: 'BA-26AA0001', studentName: 'Ada Lovelace', courseName: 'Web Development', design: 'classic', issuedDate: '2026-10-27T08:00:00Z', batchId: 'batch-1' };
const grace = { ...ada, certificateId: 'BA-26AA0002', studentName: 'Grace Hopper' };
beforeEach(() => {
  getLmsEnrollments.mockReset().mockResolvedValue({ data: [], pages: 1 });
  getCertificateTemplate.mockReset().mockResolvedValue(null);
  getManualCertificates.mockReset().mockResolvedValue({ data: [ada], total: 1, pages: 1 });
  issueManualCertificates.mockReset().mockResolvedValue([ada, grace]);
  saveCertificateTemplate.mockReset().mockResolvedValue({});
});
afterEach(cleanup);

describe('admin certificate workspace', () => {
  it('selects Ramnad design and opens its college branding fields', async () => {
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Certificate workspace' })).getByRole('button', { name: 'Create certificate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ramnad design' }));
    expect(screen.getByRole('button', { name: 'College collaboration' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('Certificate heading').value).toBe('CERTIFICATE OF COMPLETION');
    expect(screen.getByLabelText('College name')).toBeTruthy();
  });
  it('opens an issued certificate in the custom designer without changing its stored record', async () => {
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(screen.getByRole('button', { name: "Preview Ada Lovelace's certificate" }));
    fireEvent.click(screen.getByRole('button', { name: 'Customize & issue new' }));
    expect(screen.getByLabelText('Course or program title').value).toBe('Web Development');
    fireEvent.click(screen.getByRole('button', { name: 'Modern edge' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('textbox', { name: /Recipient names/ }).value).toBe('Ada Lovelace');
    expect(issueManualCertificates).not.toHaveBeenCalled();
  });
  it('saves a customized classic template with its selected design', async () => {
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Certificate workspace' })).getByRole('button', { name: 'Create certificate' }));
    fireEvent.change(screen.getByLabelText('Course or program title'), { target: { value: 'Development' } });
    fireEvent.click(screen.getByRole('button', { name: 'Modern edge' }));
    fireEvent.change(screen.getByLabelText('Certificate heading'), { target: { value: 'CERTIFICATE OF EXCELLENCE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save certificate template' }));
    await waitFor(() => expect(saveCertificateTemplate).toHaveBeenCalledWith(expect.objectContaining({ design: 'classic', designData: expect.objectContaining({ layoutVersion: 2, layout: 'modern', title: 'CERTIFICATE OF EXCELLENCE' }) }), 'admin-test-token'));
  });
  it('opens the library first and keeps selections when moving between pages', async () => {
    getManualCertificates.mockImplementation(async (token, page) => ({ data: page === 1 ? [ada] : [grace], total: 26, pages: 2 }));
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    expect(screen.queryByLabelText('Course or program title')).toBeNull();
    fireEvent.click(screen.getByLabelText('Select Ada Lovelace'));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Grace Hopper');
    expect(screen.getByText('1 selected')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Select all certificates on this page'));
    expect(screen.getByText('2 selected')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Select all certificates on this page'));
    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('guides the administrator through validation, recipients, review and issuing', async () => {
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Certificate workspace' })).getByRole('button', { name: 'Create certificate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Course or program title')).toBeTruthy();
    expect(issueManualCertificates).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Course or program title'), { target: { value: 'Web Development' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert').textContent).toContain('Add at least one recipient');
    fireEvent.change(screen.getByLabelText(/Recipient names/), { target: { value: ' Ada   Lovelace\nGrace Hopper\nada lovelace' } });
    expect(screen.getByText(/1 repeated name found/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove repeats' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Review & issue' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Issue 2 certificates' }));
    await waitFor(() => expect(issueManualCertificates).toHaveBeenCalledWith(expect.objectContaining({ names: ['Ada Lovelace', 'Grace Hopper'], courseName: 'Web Development', design: 'classic' }), 'admin-test-token'));
    await screen.findByText('Your certificates are ready');
    expect(screen.getByRole('region', { name: 'Certificate library' })).toBeTruthy();
    expect(screen.getByText('2 selected')).toBeTruthy();
  });

  it('shows a useful empty state and lets filters reset', async () => {
    getManualCertificates.mockResolvedValue({ data: [], total: 0, pages: 0 });
    render(<ManualCertificates />);
    await screen.findByText('Every achievement starts here');
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.change(screen.getByLabelText('Certificate design'), { target: { value: 'collaboration' } });
    await screen.findByText('No certificates found');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search & filters' }));
    await screen.findByText('Every achievement starts here');
    expect(screen.getByLabelText('Certificate design').value).toBe('');
  });

  it('imports a CSV list into the editable recipient field', async () => {
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Certificate workspace' })).getByRole('button', { name: 'Create certificate' }));
    fireEvent.change(screen.getByLabelText('Course or program title'), { target: { value: 'Web Development' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Upload a list' }));
    const bytes = new TextEncoder().encode('Name\nAda Lovelace\nGrace Hopper');
    const file = new File([bytes], 'recipients.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer });
    fireEvent.change(screen.getByLabelText('Upload recipient list'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByLabelText(/Recipient names/).value).toBe('Ada Lovelace\nGrace Hopper'));
    expect(screen.getByText('recipients.csv')).toBeTruthy();
  });
  it('imports, edits, reviews and issues separate spreadsheet details per recipient', async () => {
    getCertificateTemplate.mockResolvedValue({ courseName: 'Old entered course', designData: { department: 'Old department', hours: 99, academicYear: '2000-2001' } });
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Certificate workspace' })).getByRole('button', { name: 'Create certificate' }));
    const bytes = new TextEncoder().encode('Student Name,Department,Course,Hours,Academic Year\nAda Lovelace,BCA,Web Development,40,2026-2027\nGrace Hopper,BSc,Python,36,2025-2026');
    const file = new File([bytes], 'certificate-details.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer });
    fireEvent.change(screen.getByLabelText('Import certificate spreadsheet'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByLabelText('Course or program title').value).toBe('Web Development'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Department for recipient 2').value).toBe('BSc');
    fireEvent.change(screen.getByLabelText('Hours for recipient 2'), { target: { value: '44' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/BSc.*Python.*44 hours.*2025-2026/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Issue 2 certificates' }));
    await waitFor(() => expect(issueManualCertificates).toHaveBeenCalledWith(expect.objectContaining({ courseName: 'Web Development', designData: expect.objectContaining({ department: 'BCA', hours: '40', academicYear: '2026-2027' }), recipients: expect.arrayContaining([expect.objectContaining({ name: 'Grace Hopper', department: 'BSc', courseName: 'Python', hours: '44', academicYear: '2025-2026' })]) }), 'admin-test-token'));
  });

  it('reuses saved collaboration branding and includes it when issuing', async () => {
    saveCertificateTemplate.mockRejectedValue({ response: { status: 400, data: { message: 'Invalid template' } } });
    const designData = { academyName: 'Beeja Academy', collegeName: 'Partner College', department: 'Computer Science', hours: 40, academicYear: '2026–2027',
      principalName: 'Principal Name', principalTitle: 'Principal', directorName: 'Director Name', directorTitle: 'Director',
      academyLogoUrl: 'https://example.com/academy.png', collegeLogoUrl: 'https://example.com/college.png', principalSignatureUrl: 'https://example.com/principal.png', directorSignatureUrl: 'https://example.com/director.png' };
    getCertificateTemplate.mockResolvedValue({ courseName: 'Collaboration program', designData });
    issueManualCertificates.mockResolvedValue([{ ...ada, design: 'collaboration', designData }]);
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Certificate workspace' })).getByRole('button', { name: 'Create certificate' }));
    fireEvent.click(screen.getByRole('button', { name: 'College collaboration', exact: true }));
    expect(screen.getByLabelText('College name').value).toBe('Partner College');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText(/Recipient names/), { target: { value: 'Ada Lovelace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Issue 1 certificate' }));
    await waitFor(() => expect(issueManualCertificates).toHaveBeenCalledWith(expect.objectContaining({ design: 'collaboration', designData: expect.objectContaining(designData) }), 'admin-test-token'));
    expect(saveCertificateTemplate).not.toHaveBeenCalled();
  });

  it('keeps secondary record actions in an accessible menu', async () => {
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    fireEvent.click(screen.getByRole('button', { name: 'More actions for Ada Lovelace' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Print certificate' })).toBeTruthy();
    expect(within(menu).getByRole('menuitem', { name: 'Open verification page' }).getAttribute('href')).toBe('/verify-certificate/BA-26AA0001');
  });

  it('makes a failed list request retryable', async () => {
    getManualCertificates.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue({ data: [ada], total: 1, pages: 1 });
    render(<ManualCertificates />);
    expect((await screen.findByRole('alert')).textContent).toContain('could not load');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
  });

  it('opens an accessible preview and returns focus after closing with Escape', async () => {
    render(<ManualCertificates />);
    await screen.findByText('Ada Lovelace');
    const trigger = screen.getByRole('button', { name: "Preview Ada Lovelace's certificate" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Ada Lovelace' });
    expect(within(dialog).getByRole('button', { name: 'Download PDF' })).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('does not issue collaboration certificates without branding and signatories', () => {
    const errors = certificateDraftErrors({ courseName: 'Course', nameText: 'Student', completionDate: '2026-10-27', design: 'collaboration', designData: {} });
    expect(errors.collegeName).toBeTruthy();
    expect(errors.principalSignatureUrl).toBeTruthy();
    expect(errors.hours).toBeTruthy();
    expect(certificateNames(' Ada   Lovelace\n\nGrace Hopper ')).toEqual(['Ada Lovelace', 'Grace Hopper']);
    expect(uniqueCertificateNames(['Ada Lovelace', 'ada lovelace'])).toEqual(['Ada Lovelace']);
  });
});

it('certificate preview can also be closed using its labelled close button', () => {
  const close = vi.fn();
  render(<CertificateModal certificateData={ada} onClose={close} />);
  fireEvent.click(screen.getByRole('button', { name: 'Close certificate preview' }));
  expect(close).toHaveBeenCalledTimes(1);
});

it('loads LMS certificates separately and clears manual selections on tab switch', async () => {
  getManualCertificates.mockImplementation(async (token, page, filters) => ({ data: filters.source === 'course' ? [{ ...grace, source: 'course', batchId: undefined }] : [ada], total: 1, pages: 1 }));
  render(<ManualCertificates />);
  await screen.findByText('Ada Lovelace');
  fireEvent.click(screen.getByLabelText('Select Ada Lovelace'));
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Certificate workspace' })).getByRole('button', { name: 'LMS certificates' }));
  await screen.findByText('Grace Hopper');
  expect(screen.queryByText('Ada Lovelace')).toBeNull();
  expect(screen.queryByText('1 selected')).toBeNull();
  expect(getManualCertificates).toHaveBeenLastCalledWith('admin-test-token', 1, expect.objectContaining({ source: 'course' }));
  fireEvent.click(screen.getByRole('button', { name: "Preview Grace Hopper's certificate" }));
  expect(screen.queryByRole('button', { name: 'Customize & issue new' })).toBeNull();
});
