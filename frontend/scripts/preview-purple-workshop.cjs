const { chromium } = require('@playwright/test');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({ channel: 'chrome', headless: true });
 const page = await browser.newPage({ viewport: { width: 1100, height: 780 } });
 try {
 await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
 await page.evaluate(async () => {
  const React = await import('/node_modules/.vite/deps/react.js');
  const client = await import('/node_modules/.vite/deps/react-dom_client.js');
  const createRoot = client.createRoot || client.default.createRoot;
  const { default: Certificate } = await import('/src/components/core/Certificate/CustomCertificate.jsx');
  const { certificateAppearance, certificatePresets } = await import('/src/components/core/Certificate/certificateAppearance.js');
  document.body.innerHTML = '<div id="preview" style="position:absolute;inset:0;background:white"></div>';
  createRoot(document.getElementById('preview')).render((React.createElement || React.default.createElement)(Certificate, { certificateData: { studentName: 'ARSHAD PM', courseName: 'BUILD YOUR OWN ROBOT (OFFLINE WORKSHOP)', completionDate: '2023-02-12', designData: { ...certificateAppearance, ...certificatePresets.workshop, principalName: 'Mr. VISHAL JEGADESAN', principalTitle: 'TECHNICAL TRAINER', principalOrganization: ' ', directorName: 'Mr. VAMSI KRISHNA RAMESH', directorTitle: 'DIRECTOR', directorOrganization: 'BEEJA ACADEMY', showQr: false } } }));
 });
 await page.locator('[data-certificate-layout="workshop"]').waitFor();
 await page.evaluate(() => document.fonts.ready);
 await page.locator('[data-certificate-layout="workshop"]').screenshot({ path: path.resolve(__dirname, '../../certificate-preview/purple-workshop.png') });
 const download = page.waitForEvent('download');
 await page.evaluate(async () => {
  const { exportCertificatesPdf } = await import('/src/utils/certificatePdf.js');
  await exportCertificatesPdf([document.querySelector('[data-certificate-layout="workshop"]')], 'purple-workshop.pdf', false, null, { scale: 1.5 });
 });
 await (await download).saveAs(path.resolve(__dirname, '../../certificate-preview/purple-workshop.pdf'));
 console.log('Saved purple workshop preview and PDF');
 } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode=1; });

