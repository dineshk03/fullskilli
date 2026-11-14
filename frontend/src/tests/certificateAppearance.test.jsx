import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import QRCode from 'qrcode';
import CustomCertificate from '../components/core/Certificate/CustomCertificate';
import CertificateDesign from '../components/core/Certificate/CertificateDesign';
import { certificateAppearance, certificatePresets } from '../components/core/Certificate/certificateAppearance';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('renders the SA Engg reference layout with centered heading, academy name, course dates and college details', () => {
  const { container } = render(<CustomCertificate certificateData={{ design: 'collaboration', studentName: 'BHAGYA SREE S', courseName: 'Full Stack Development (Server Side / Back End)', designData: { ...certificateAppearance, ...certificatePresets.saEngg, academyName: 'Beeja Academy', collegeName: 'S.A. Engineering College', department: 'Artificial Intelligence & Data Science', academicYear: '2023–2024', startDate: '12/03/2024', endDate: '20/03/2024' } }} />);
  expect(container.querySelector('[data-certificate-layout="sa-engg"]')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'CERTIFICATE OF COMPLETION' })).toBeTruthy();
  expect(screen.getByText('BHAGYA SREE S')).toBeTruthy();
  expect(screen.getByText('12/03/2024')).toBeTruthy();
  expect(screen.getByText('20/03/2024')).toBeTruthy();
  expect(screen.getByText('Beeja Academy')).toBeTruthy();
  expect(screen.getByText('In collaboration with')).toBeTruthy();
  expect(screen.getAllByText('S.A. Engineering College').length).toBeGreaterThan(0);
  expect(container.querySelector('[data-certificate-text="recipientDetails"]')?.textContent).toContain('Artificial Intelligence & Data Science, S.A. Engineering College');
  expect(screen.getByRole('heading', { name: 'CERTIFICATE OF COMPLETION' }).parentElement.style.width).toBe('100%');
});

it('customizes the gaps and position of the SA Engg certificate heading', () => {
  const { container } = render(<CustomCertificate certificateData={{ design: 'collaboration', designData: { ...certificateAppearance, ...certificatePresets.saEngg, collegeSpaceAfter: 36, headingSpaceAfter: 24, headingOffsetX: 18, headingOffsetY: -10 } }} />);
  expect(container.querySelector('[data-certificate-layout="sa-engg"]')?.dataset.certificateCollegeHeadingGap).toBe('36');
  expect(container.querySelector('[data-certificate-layout="sa-engg"]')?.dataset.certificateHeadingBodyGap).toBe('24');
  const heading = container.querySelector('[data-certificate-text="heading"]');
  expect(heading?.style.left).toBe('18px');
  expect(heading?.style.top).toBe('-10px');
});
it('renders the Ramnad college layout with underlined recipient and completion details', () => {
  const { container } = render(<CertificateDesign certificateData={{ design: 'collaboration', studentName: 'ABINAYA. A', courseName: 'Full Stack Web Development', designData: { ...certificateAppearance, ...certificatePresets.ramnad, academyName: 'Beeja Academy', collegeName: 'Shri Krishnaswamy College for Women', department: 'Bachelor of Computer Applications', hours: 40, academicYear: '2023–2024', showQr: false } }} />);
  expect(container.querySelector('[data-certificate-layout="ramnad"]')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'CERTIFICATE OF COMPLETION' })).toBeTruthy();
  expect(container.querySelector('[data-recipient-underline]')).toBeTruthy();
  expect(screen.getByText('40')).toBeTruthy();
  expect(screen.getByText('Principal')).toBeTruthy();
});
it('encodes the public verification route with a white scan margin and clickable link', async () => {
  const generate = vi.spyOn(QRCode, 'toDataURL').mockResolvedValue('data:image/png;base64,test');
  render(<CustomCertificate certificateData={{ certificateId: 'BA-26SQ0838', studentName: 'Deepak', courseName: 'Full Stack Development', designData: certificateAppearance }} />);
  await screen.findByRole('img', { name: 'Certificate verification QR code' });
  const expected = `${window.location.origin}/verify-certificate/BA-26SQ0838`;
  expect(generate).toHaveBeenCalledWith(expected, expect.objectContaining({ margin: 4, width: 300, errorCorrectionLevel: 'M' }));
  expect(screen.getByRole('link', { name: 'Verify this certificate' }).getAttribute('href')).toBe(expected);
});
it('uses saved custom appearance even when an older record is missing its version marker', () => {
  render(<CertificateDesign certificateData={{ studentName: 'Student', courseName: 'Development', design: 'collaboration', designData: { layout: 'modern', title: 'CUSTOM COMPLETION', showQr: false } }} />);
  expect(screen.getByLabelText('Customized certificate')).toBeTruthy();
  expect(screen.getByText('CUSTOM COMPLETION')).toBeTruthy();
  expect(screen.queryByLabelText('Collaboration certificate')).toBeNull();
});
it('renders custom wording, branding, colors and optional elements', () => {
  const { container } = render(<CustomCertificate certificateData={{ studentName: 'Ada Lovelace', courseName: 'Web Development', completionDate: '2026-10-27', designData: { ...certificateAppearance, title: 'CERTIFICATE OF EXCELLENCE', academyName: 'Learning Academy', accentColor: '#137d91', bodyText: 'Awarded for completing {course} at {academy}.', showQr: false, showSeal: false } }} />);
  expect(screen.getByText('CERTIFICATE OF EXCELLENCE')).toBeTruthy();
  expect(screen.getByText('Awarded for completing Web Development at Learning Academy.')).toBeTruthy();
  expect(screen.getByText('Ada Lovelace').style.color).toBe('rgb(19, 125, 145)');
  expect(container.textContent).not.toContain('Scan to verify');
  expect(screen.queryByText('EXCELLENCE', { exact: true })).toBeNull();
});

it('renders saved text sizes and explicit bold overrides in the college certificate', () => {
  render(<CustomCertificate certificateData={{ studentName: 'Typography Student', courseName: 'Development', designData: { ...certificateAppearance, ...certificatePresets.ramnad, collegeName: 'Test College', headingTextSize: 32, headingTextBold: false, collegeTextSize: 22, recipientTextSize: 28, bodyTextBold: false, showQr: false } }} />);
  const heading = screen.getByRole('heading', { name: 'CERTIFICATE OF COMPLETION' });
  expect(heading.style.fontSize).toBe('32px');
  expect(heading.style.fontWeight).toBe('400');
  expect(screen.getAllByText('Test College', { exact: true })[0].style.fontSize).toBe('22px');
  expect(screen.getByText('Typography Student').style.fontSize).toBe('28px');
  expect(screen.getByText('Development').style.fontWeight).toBe('400');
});


it('keeps paragraph space unchanged when signature dimensions increase', () => {
  for (const layout of ['ramnad', 'formal']) {
    const base = { ...certificateAppearance, ...certificatePresets[layout], directorSignatureUrl: 'https://example.com/sign.png', showQr: false };
    const { container, rerender, unmount } = render(<CustomCertificate certificateData={{ designData: base }} />);
    const grid = container.querySelector('article > div:last-child');
    const rows = grid.style.gridTemplateRows;
    rerender(<CustomCertificate certificateData={{ designData: { ...base, directorSignatureWidth: 260, directorSignatureHeight: 100, directorNameTextSize: 24 } }} />);
    expect(container.querySelector('article > div:last-child').style.gridTemplateRows).toBe(rows);
    unmount();
  }
});

it('anchors resized signature images above the line without changing signatory text flow', () => {
  for (const layout of ['ramnad', 'formal']) {
    const designData = { ...certificateAppearance, ...certificatePresets[layout], directorName: 'Trainer', directorSignatureUrl: 'https://example.com/sign.png', directorNameTextSize: 18, directorTitleTextSize: 12, directorOrganizationTextSize: 10, showQr: false };
    const { container, rerender, unmount } = render(<CustomCertificate certificateData={{ design: 'collaboration', designData }} />);
    const image = container.querySelector('[data-certificate-signature="director"]');
    const reservedHeight = image.parentElement.style.height;
    const textStyles = ['Name', 'Title', 'Organization'].map(part => container.querySelector(`[data-certificate-text="director${part}"]`).style.cssText);
    rerender(<CustomCertificate certificateData={{ design: 'collaboration', designData: { ...designData, directorSignatureHeight: 100, directorSignatureWidth: 280 } }} />);
    expect(image.parentElement.style.height).toBe(reservedHeight);
    expect(image.style.position).toBe('absolute');
    expect(image.style.bottom).toBe('0px');
    expect(['Name', 'Title', 'Organization'].map(part => container.querySelector(`[data-certificate-text="director${part}"]`).style.cssText)).toEqual(textStyles);
    unmount();
  }
});

it('renders independently customized signatory organizations', () => {
  render(<CustomCertificate certificateData={{ design: 'collaboration', designData: { ...certificateAppearance, ...certificatePresets.ramnad, collegeName: 'Partner College', academyName: 'Main Academy', principalOrganization: 'College Training Department', directorOrganization: 'Industry Training Division', showQr: false } }} />);
  expect(screen.getByText('College Training Department')).toBeTruthy();
  expect(screen.getByText('Industry Training Division')).toBeTruthy();
  expect(screen.getAllByText('Partner College', { exact: true }).length).toBeGreaterThan(0);
});

it('renders the purple workshop preset with editable text and signatures', () => {
  const { container } = render(<CustomCertificate certificateData={{ studentName: 'ARSHAD PM', courseName: 'BUILD YOUR OWN ROBOT (OFFLINE WORKSHOP)', completionDate: '2023-02-12', designData: { ...certificateAppearance, ...certificatePresets.workshop, directorName: 'Director Name', directorOrganization: 'Beeja Academy', brandTagline: 'Professional Mentoring', showCompletionDate: true, showQr: false } }} />);
  expect(container.querySelector('[data-certificate-layout="workshop"]')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'CERTIFICATE' })).toBeTruthy();
  expect(screen.getByText('ARSHAD PM')).toBeTruthy();
  expect(screen.getByText('12/02/2023')).toBeTruthy();
  expect(container.querySelector('[data-certificate-text="directorOrganization"]').textContent).toBe('Beeja Academy');
  expect(screen.queryByText('Professional Mentoring')).toBeNull();
});
it('hides the workshop completion date by default', () => {
  render(<CustomCertificate certificateData={{ studentName: 'Student', courseName: 'Robotics', completionDate: '2026-10-28', designData: { ...certificateAppearance, ...certificatePresets.workshop, showQr: false } }} />);
  expect(screen.queryByText('28/10/2026')).toBeNull();
});
it('applies adjustable workshop watermark density and visibility', () => {
  const { container } = render(<CustomCertificate certificateData={{ studentName: 'Student', courseName: 'Robotics', designData: { ...certificateAppearance, ...certificatePresets.workshop, watermarkOpacity: 0.12, watermarkSpacing: 135, showQr: false } }} />);
  const pattern = container.querySelector('pattern');
  const watermark = container.querySelector('[data-certificate-watermark="horizontal-text"]');
  expect(Number(pattern.getAttribute('width'))).toBeGreaterThan(48);
  expect(Number(pattern.getAttribute('height'))).toBeCloseTo(8 * 135 / 62);
  expect(pattern.getAttribute('patternTransform')).toBeNull();
  expect(pattern.querySelectorAll('text')).toHaveLength(1);
  expect(pattern.querySelector('text').getAttribute('font-size')).toBe('5.5');
  expect(pattern.querySelector('text').getAttribute('font-weight')).toBe('500');
  expect(watermark.getAttribute('opacity')).toBe('0.12');
});
it('adds a separately positioned second Beeja watermark without removing the existing watermark', () => {
  for (const layout of Object.keys(certificatePresets)) {
    const { container, unmount } = render(<CustomCertificate certificateData={{ studentName: 'Student', courseName: 'Course', designData: { ...certificateAppearance, ...certificatePresets[layout], showWatermark: true, showSecondWatermark: true, secondWatermarkX: 120, secondWatermarkY: 140, secondWatermarkWidth: 210, secondWatermarkHeight: 190, secondWatermarkOpacity: 0.11, showQr: false } }} />);
    const second = container.querySelector('[data-certificate-second-watermark]');
    expect(second).toBeTruthy();
    expect(second.style.left).toBe('120px');
    expect(second.style.top).toBe('140px');
    expect(second.style.width).toBe('210px');
    expect(second.style.opacity).toBe('0.11');
    if (layout === 'workshop') expect(container.querySelector('rect[width="1000"]')).toBeTruthy();
    unmount();
  }
});

it('omits hidden logos from every editable certificate layout', () => {
  for (const layout of Object.keys(certificatePresets)) {
    const { container, unmount } = render(<CustomCertificate certificateData={{ design: 'collaboration', designData: { ...certificateAppearance, ...certificatePresets[layout], showAcademyLogo: false, showCollegeLogo: false, collegeLogoUrl: 'https://example.com/logo.png', showQr: false } }} />);
    expect(container.querySelector('[data-certificate-logo]')).toBeNull();
    unmount();
  }
});

for (const layout of ['formal', 'modern', 'minimal', 'ramnad', 'workshop']) {
  it(`renders an optional third logo at top center in ${layout}`, () => {
    const certificateData = { design: 'classic', designData: { ...certificateAppearance, ...certificatePresets[layout], showQr: false, thirdLogoUrl: 'https://example.com/third.png', thirdLogoWidth: 140 } };
    const { container, rerender } = render(<CustomCertificate certificateData={certificateData} />);
    const logo = container.querySelector('[data-certificate-logo="third"]');
    expect(logo.getAttribute('src')).toBe('https://example.com/third.png');
    expect(logo.style.left).toBe('430px');
    expect(logo.style.top).toBe('22px');
    rerender(<CustomCertificate certificateData={{ ...certificateData, designData: { ...certificateData.designData, showThirdLogo: false } }} />);
    expect(container.querySelector('[data-certificate-logo="third"]')).toBeNull();
  });
}

for (const layout of ['formal', 'modern', 'minimal', 'ramnad', 'workshop']) {
  it(`reserves header space for any centered logo in ${layout}`, () => {
    const designData = { ...certificateAppearance, ...certificatePresets[layout], showQr: false, academyLogoX: 425, academyLogoY: 22, academyLogoWidth: 150, academyLogoHeight: 94 };
    const { container, rerender } = render(<CustomCertificate certificateData={{ designData }} />);
    const header = container.querySelector('[data-layout-slot="header"]');
    if (layout === 'workshop') {
      expect(header.style.top).toBe('128px');
      const message = container.querySelector('[data-layout-slot="completion-message"]');
      expect(parseFloat(message.style.top) + parseFloat(message.style.height)).toBeLessThan(520);
    } else {
      expect(header.parentElement.style.paddingTop).toBe('128px');
    }
    rerender(<CustomCertificate certificateData={{ designData: { ...designData, showAcademyLogo: false } }} />);
    if (layout === 'workshop') expect(header.style.top).toBe('20px');
    else expect(header.parentElement.style.paddingTop).toBe(layout === 'ramnad' ? '52px' : '40px');
  });
}

it('applies background and global spacing with individual text overrides across layouts', () => {
  for (const layout of ['formal', 'modern', 'minimal', 'ramnad', 'workshop']) {
    const { container, unmount } = render(<CustomCertificate certificateData={{ designData: { ...certificateAppearance, ...certificatePresets[layout], backgroundColor: '#e0f2ff', lineHeight: 1.7, bodyLineHeight: 2.1, showQr: false } }} />);
    expect(container.querySelector('article').style.background).toBe('rgb(224, 242, 255)');
    expect(container.querySelector('[data-certificate-text="heading"]').style.lineHeight).toBe('1.7');
    expect(container.querySelector('[data-certificate-text="body"]').style.lineHeight).toBe('2.1');
    unmount();
  }
});

it('uses one consistent gap between the workshop heading, subtitle and introduction', () => {
  const { container } = render(<CustomCertificate certificateData={{ designData: { ...certificateAppearance, ...certificatePresets.workshop, showQr: false } }} />);
  const heading = container.querySelector('[data-certificate-text="heading"]');
  const subtitle = container.querySelector('[data-certificate-text="subtitle"]');
  const introduction = container.querySelector('[data-certificate-text="introduction"]');
  expect(heading.parentElement).toBe(subtitle.parentElement);
  expect(subtitle.parentElement).toBe(introduction.parentElement);
  expect(heading.parentElement.style.gap).toBe('12px');
  for (const line of [heading, subtitle, introduction]) {
    expect(line.style.margin).toBe('0px');
    expect(line.style.lineHeight).toBe('1');
  }
});
