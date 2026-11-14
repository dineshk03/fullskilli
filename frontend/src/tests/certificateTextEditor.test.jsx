import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import CertificateTextEditor from '../pages/Admin/components/CertificateTextEditor';
import { certificateAppearance, certificatePresets } from '../components/core/Certificate/certificateAppearance';

afterEach(cleanup);
it('selects text in place, applies formatting and resets only that text', () => {
  function Editor() {
    const [data, setData] = useState({ ...certificateAppearance, ...certificatePresets.ramnad, showQr: false, bodyTextSize: 18 });
    return <CertificateTextEditor certificateData={{ studentName: 'Ada', designData: data }} onChange={setData} />;
  }
  render(<Editor />);
  expect(screen.queryByLabelText('Selected text size')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }));
  fireEvent.change(screen.getByLabelText('Selected text size'), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText('Selected text letter spacing'), { target: { value: '4.5' } });
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.fontSize).toBe('30px');
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.letterSpacing).toBe('4.5px');
  fireEvent.change(screen.getByLabelText('Selected text line spacing'), { target: { value: '1.8' } });
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.lineHeight).toBe('1.8');
  fireEvent.change(screen.getByLabelText('Selected text space after'), { target: { value: '18' } });
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.marginBottom).toBe('18px');
  fireEvent.click(screen.getByLabelText('Bold selected text'));
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.fontWeight).toBe('400');
  fireEvent.click(screen.getByRole('button', { name: 'Reset text style' }));
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.fontSize).toBe('25px');
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.letterSpacing).toBe('1.8px');
  expect(screen.getByRole('button', { name: 'Format: CERTIFICATE OF COMPLETION' }).style.lineHeight).toBe('1.25');
  expect(screen.getByRole('button', { name: /Format: has successfully completed/ }).style.fontSize).toBe('18px');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Format: Ada' }), { key: 'Enter' });
  expect(screen.getByLabelText('Selected text size').value).toBe('24');
  const recipient = screen.getByRole('button', { name: 'Format: Ada' });
  fireEvent.keyDown(recipient, { key: 'ArrowRight' });
  expect(screen.getByRole('button', { name: 'Format: Ada' }).style.left).toBe('1px');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Format: Ada' }), { key: 'ArrowDown', shiftKey: true });
  expect(screen.getByRole('button', { name: 'Format: Ada' }).style.top).toBe('10px');
});

it('resizes a signature independently and switches to its text formatting', () => {
  function Editor() {
    const [data, setData] = useState({ ...certificateAppearance, ...certificatePresets.ramnad, directorName: 'Trainer', directorSignatureUrl: 'https://example.com/sign.png', showQr: false });
    return <CertificateTextEditor certificateData={{ studentName: 'Ada', designData: data }} onChange={setData} />;
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole('button', { name: 'Resize academy signature' }));
  fireEvent.change(screen.getByLabelText('Signature width'), { target: { value: '220' } });
  fireEvent.change(screen.getByLabelText('Signature height'), { target: { value: '65' } });
  const image = screen.getByRole('button', { name: 'Resize academy signature' });
  expect(image.style.width).toBe('220px');
  expect(image.style.height).toBe('65px');
  fireEvent.click(screen.getByRole('button', { name: 'Name', exact: true }));
  fireEvent.change(screen.getByLabelText('Selected text size'), { target: { value: '20' } });
  expect(screen.getByRole('button', { name: 'Format: Trainer' }).style.fontSize).toBe('20px');
  expect(image.style.width).toBe('220px');
});

it('edits logo size and corner independently from text', () => {
  function Editor() {
    const [data, setData] = useState({ ...certificateAppearance, ...certificatePresets.workshop, showQr: false });
    return <CertificateTextEditor certificateData={{ studentName: 'Ada', designData: data }} onChange={setData} />;
  }
  render(<Editor />);
  fireEvent.click(screen.getByRole('button', { name: 'Resize or move academy logo' }));
  fireEvent.change(screen.getByLabelText('academy logo width'), { target: { value: '180' } });
  fireEvent.change(screen.getByLabelText('academy logo corner'), { target: { value: 'top-right' } });
  const logo = screen.getByRole('button', { name: 'Resize or move academy logo' });
  expect(logo.style.width).toBe('180px');
  expect(logo.style.left).toBe('792px');
  expect(logo.style.top).toBe('22px');
  expect(screen.getByRole('button', { name: 'Format: Ada' }).style.fontSize).toBe('46px');
});

it('selects and moves blue stars decoration and recipient line in Ramnad certificate', () => {
  function Editor() {
    const [data, setData] = useState({ ...certificateAppearance, ...certificatePresets.ramnad, showQr: false });
    return <CertificateTextEditor certificateData={{ studentName: 'Ada Lovelace', designData: data }} onChange={setData} />;
  }
  render(<Editor />);
  const stars = screen.getByRole('button', { name: 'Format or move stars' });
  expect(stars).toBeTruthy();
  fireEvent.click(stars);
  expect(screen.getByText('Blue stars decoration')).toBeTruthy();
  fireEvent.keyDown(stars, { key: 'ArrowRight' });
  expect(stars.style.left).toBe('1px');
  fireEvent.keyDown(stars, { key: 'ArrowDown', shiftKey: true });
  expect(stars.style.top).toBe('10px');

  const line = screen.getByRole('button', { name: 'Recipient name line' });
  expect(line).toBeTruthy();
  fireEvent.keyDown(line, { key: 'ArrowDown' });
  expect(line.style.top).toBe('1px');
});
