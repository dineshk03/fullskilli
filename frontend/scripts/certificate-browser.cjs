const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const jsQR = require('jsqr');
const QRCode = require('qrcode');

const origin = process.env.SMOKE_URL || 'http://127.0.0.1:4173';
const user = { _id: '507f1f77bcf86cd799439011', firstName: 'Academy', lastName: 'Admin', email: 'admin@example.com', accountType: 'Admin', image: `${origin}/beejalogo.png`, active: true };
const token = `${Buffer.from('{}').toString('base64')}.${Buffer.from(JSON.stringify({ id: user._id, accountType: 'Admin', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64')}.test-only`;
const records = ['Aarav Sharma', 'Priya Nair', 'Arjun Patel', 'Ananya Rao', 'Rohan Mehta', 'Meera Iyer'].map((name, index) => ({ certificateId: `BA-26AC000${index + 1}`, studentName: name,
  courseName: ['Full Stack Web Development', 'UI/UX Design Fundamentals', 'Data Analytics with Python'][index % 3], categoryName: index % 2 ? 'Design & creative' : 'Technology',
  issuedDate: '2026-10-27T08:00:00Z', completionDate: '2026-10-25', design: index % 3 === 1 ? 'collaboration' : 'classic', batchId: 'test-batch' }));

(async () => {
  const assetColors = ['#0055ff', '#00aa44', '#ee2233', '#aa22ee'];
  const assetUrls = assetColors.map((_, index) => `https://certificate-storage.example.com/certificate-assets/test-${index}.png`);
  const assetBuffers = await Promise.all(assetColors.map(color => QRCode.toBuffer('test asset', { width: 100, color: { dark: color, light: color } })));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: process.env.CERTIFICATE_THEME || 'dark' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (assetUrls.includes(url.href)) return route.fulfill({ status: 200, contentType: 'image/png', body: assetBuffers[assetUrls.indexOf(url.href)] });
    if (url.pathname.includes('/certificate/asset-image')) {
      const index = assetUrls.indexOf(url.searchParams.get('url'));
      if (index >= 0) return route.fulfill({ status: 200, contentType: 'image/png', body: assetBuffers[index], headers: { 'access-control-allow-origin': '*' } });
    }
    if (url.origin === origin && !url.pathname.startsWith('/api') && !url.pathname.includes('/socket.io')) return route.continue();
    if (!['xhr', 'fetch'].includes(request.resourceType())) return route.abort();
    let response = { success: true, data: [] };
    if (url.pathname.includes('getUserDetails')) response.data = user;
    if (url.pathname.includes('site-settings')) response.data = {};
    if (url.pathname.includes('notification')) response = { success: true, data: {}, counts: {}, notifications: [], unreadCount: 0 };
    if (url.pathname.includes('/certificate/admin/template')) response.data = null;
    if (url.pathname.includes('/certificate/admin/manual')) {
      if (request.method() === 'POST') {
        const input = request.postDataJSON();
        if (input.designData?.layoutVersion !== 2) errors.push('Issuing dropped the customized design version');
        const created = input.names.map((studentName, index) => ({ ...records[0], ...input, studentName, certificateId: `BA-26NEW000${index}`, batchId: 'new-test-batch' }));
        records.unshift(...created);
        response.data = created;
      } else response = { success: true, data: records, total: records.length, pages: 1 };
    }
    if (url.pathname.includes('/certificate/admin/batch/')) response.data = records.filter(record => record.batchId === url.pathname.split('/').pop());
    if (url.pathname.includes('/certificate/verify/')) response.data = records.find(record => record.certificateId === decodeURIComponent(url.pathname.split('/').pop()));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
  });
  const folder = path.resolve(__dirname, '../../certificate-preview');
  fs.mkdirSync(folder, { recursive: true });
  try {
    await page.goto(`${origin}/admin?tab=certificates`, { waitUntil: 'networkidle' });
    if (process.argv.includes('--spacing-only') || process.argv.includes('--bulk-parity')) {
      records.unshift({ ...records[0], certificateId: 'BA-26SPACE01', studentName: 'RECIPIENT FULL NAME', design: 'collaboration', designData: {
        layoutVersion: 2, layout: 'ramnad', title: 'CERTIFICATE OF COURSE COMPLETION', subtitle: '', introduction: 'This is to certify that Mr./Ms.',
        accentColor: '#59b5e3', textColor: '#282264', backgroundColor: '#ffffff', nameSize: 24, font: 'sans', borderStyle: 'double',
        academyName: 'Beeja Innovative Ventures', collegeName: 'Mohamed Sathak College Of Arts & Science', department: 'Bachelor of Science in Information Technology', hours: 36, academicYear: '2025-2026',
        collegeDetails: '(Affiliated to University of Madras)\nAccredited by NAAC with B+ Grade & 2(f) status under UGC Act\nManaged by Krishnaswamy Educational Trust (Regd)',
        bodyText: 'has successfully completed the Value Added Course on {course}\nconducted for {hours} hours during the academic year {year}.', showQr: true, showSeal: false,
        collegeLogoUrl: `${origin}/beejalogo.png`, principalName: 'College signatory', principalTitle: 'Director', directorName: 'Academy signatory', directorTitle: 'Lead Trainer',
      }, courseName: 'PROMPT ENGINEERING' });
      await page.reload({ waitUntil: 'networkidle' });
      await page.getByRole('button', { name: "Preview RECIPIENT FULL NAME's certificate" }).click();
      await page.getByRole('dialog').locator('img[alt="Certificate verification QR code"]').first().waitFor();
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); for (const animation of document.getAnimations()) if (Number.isFinite(animation.effect.getComputedTiming().endTime)) animation.finish(); });
      const paper = page.getByRole('dialog').getByLabel('Customized certificate').first();
      const positions = await paper.evaluate(article => {
        const intro = article.querySelector('[data-layout-slot="recipient-name"] span').getBoundingClientRect();
        const department = article.querySelector('[data-layout-slot="department"] p').getBoundingClientRect();
        const message = article.querySelector('[data-layout-slot="completion-message"] p').getBoundingClientRect();
        return { departmentIndent: department.left - intro.left, messageIndent: message.left - intro.left, departmentLines: department.height / (19 * 1.5) / (article.getBoundingClientRect().width / 1000) };
      });
      await paper.screenshot({ path: path.join(folder, 'spacing-corrected.png') });
      if (Math.abs(positions.departmentIndent) > 1 || Math.abs(positions.messageIndent) > 1 || positions.departmentLines > 1.1) throw new Error(`Spacing regression: ${JSON.stringify(positions)}`);
      if (process.argv.includes('--bulk-parity')) {
        const snapshot = article => {
          const bounds = article.getBoundingClientRect(), scale = bounds.width / 1000;
          return ['h1', '[data-layout-slot="recipient-name-text"]', '[data-layout-slot="recipient-name-text"] strong', '[data-layout-slot="department"] p', '[data-layout-slot="completion-message"] p', '[data-layout-slot="heading"] > div > div:last-child'].map(selector => {
            const element = article.querySelector(selector), box = element.getBoundingClientRect(), style = getComputedStyle(element);
            return { selector, x: (box.left - bounds.left) / scale, y: (box.top - bounds.top) / scale, width: box.width / scale, height: box.height / scale, font: style.font, boxSizing: style.boxSizing };
          });
        };
        const single = await paper.evaluate(snapshot);
        await page.getByRole('button', { name: 'Close certificate preview' }).click();
        await page.getByRole('checkbox', { name: 'Select RECIPIENT FULL NAME', exact: true }).check();
        await page.getByLabel('PDF quality').selectOption('standard');
        const download = page.waitForEvent('download', { timeout: 120000 });
        await page.getByRole('button', { name: 'Download (1)', exact: true }).click();
        const bulkPaper = page.locator('#certificate-pdf-stage article').first();
        await bulkPaper.waitFor({ state: 'attached' });
        const bulk = await bulkPaper.evaluate(snapshot);
        const differences = single.filter((item, index) => ['x','y','width','height'].some(key => Math.abs(item[key] - bulk[index][key]) > .5) || item.font !== bulk[index].font || item.boxSizing !== bulk[index].boxSizing);
        if (differences.length) throw new Error(`Single/bulk layout differs: ${JSON.stringify({ single, bulk })}`);
        const target = path.join(folder, 'bulk-parity.pdf');
        await (await download).saveAs(target);
        const bytes = fs.readFileSync(target), start = bytes.indexOf(Buffer.from([0xff,0xd8,0xff])), end = bytes.indexOf(Buffer.from([0xff,0xd9]), start);
        if (start >= 0 && end > start) fs.writeFileSync(path.join(folder, 'bulk-parity-page.jpg'), bytes.subarray(start,end+2));
        console.log(JSON.stringify({ mockedIntegrations: true, singleAndBulkMatch: true, comparedRegions: bulk.length, positions, errors }));
        return;
      }
      console.log(JSON.stringify({ mockedIntegrations: true, spacingChecked: positions, errors }));
      return;
    }
    // Older builds initially open analytics; use the sidebar while developing.
    if (!await page.getByRole('region', { name: 'Certificate library' }).count()) await page.getByRole('button', { name: 'Certificates', exact: true }).click();
    await page.getByText('Aarav Sharma', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(folder, 'library-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: "Preview Aarav Sharma's certificate" }).click();
    await page.getByRole('button', { name: 'Customize & issue new' }).click();
    await page.getByRole('textbox', { name: 'Course or program title', exact: true }).fill('Full Stack Web Development');
    for (const [name, file] of [['Classic elegance', 'formal-design.png'], ['Minimal studio', 'minimal-design.png'], ['Modern edge', 'modern-design.png']]) {
      await page.getByRole('button', { name: new RegExp(name) }).click();
      await page.getByRole('button', { name: 'Expand certificate preview' }).click();
      await page.getByRole('dialog').waitFor();
      await page.screenshot({ path: path.join(folder, file) });
      await page.getByRole('button', { name: 'Close certificate preview' }).click();
    }
    await page.screenshot({ path: path.join(folder, 'create-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('textbox', { name: /Recipient names/ }).fill('Nisha Desai\nSanjay Rao\nKavya Menon');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('heading', { name: 'Review & issue' }).waitFor();
    await page.screenshot({ path: path.join(folder, 'review-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: 'Issue 3 certificates' }).click();
    await page.getByText('Your certificates are ready', { exact: true }).waitFor();
    const batchDownload = page.waitForEvent('download', { timeout: 120000 });
    await page.getByRole('button', { name: 'Download latest batch', exact: true }).click();
    await (await batchDownload).saveAs(path.join(folder, 'latest-batch.pdf'));
    const batchPdfText = fs.readFileSync(path.join(folder, 'latest-batch.pdf')).toString('latin1');
    const highResolutionPages = [...batchPdfText.matchAll(/\/Width 3500\s+\/Height 2450/g)].length;
    if (highResolutionPages < 3) errors.push('Bulk PDF did not preserve 300 DPI page images');
    await page.getByRole('button', { name: "Preview Nisha Desai's certificate" }).click();
    await page.getByRole('dialog', { name: 'Nisha Desai' }).waitFor();
    if (!await page.getByRole('dialog').getByLabel('Customized certificate').count()) errors.push('Issued preview reverted to the legacy design');
    const qrImage = page.getByRole('dialog').locator('img[alt="Certificate verification QR code"]').first();
    await qrImage.waitFor();
    const qrPixels = await qrImage.evaluate(async img => {
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      return { width: canvas.width, height: canvas.height, pixels: [...context.getImageData(0, 0, canvas.width, canvas.height).data] };
    });
    const decodedQr = jsQR(new Uint8ClampedArray(qrPixels.pixels), qrPixels.width, qrPixels.height)?.data;
    const expectedQr = `${origin}/verify-certificate/BA-26NEW0000`;
    if (decodedQr !== expectedQr) errors.push(`QR decoded to ${decodedQr || 'nothing'} instead of the certificate verification URL`);
    await page.screenshot({ path: path.join(folder, 'preview-desktop.png') });
    const singleDownload = page.waitForEvent('download', { timeout: 120000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Download PDF', exact: true }).click();
    await (await singleDownload).saveAs(path.join(folder, 'single-certificate.pdf'));
    await page.getByRole('button', { name: 'Close certificate preview' }).waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('[aria-label="Close certificate preview"]').disabled);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(folder, 'library-mobile.png'), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) errors.push('The mobile page has horizontal overflow');
    await page.getByRole('navigation', { name: 'Certificate workspace' }).getByRole('button', { name: 'Create certificate' }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(folder, 'create-mobile.png'), fullPage: true });
    await page.goto(expectedQr, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Certificate Verified Successfully' }).waitFor();
    await page.getByRole('button', { name: 'View Certificate', exact: true }).click();
    await page.getByLabel('Customized certificate').waitFor();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errors.push('QR verification certificate overflows the mobile screen');
    await page.screenshot({ path: path.join(folder, 'qr-verification-mobile.png'), fullPage: true });

    // Stress the same layout with long organization, recipient and signature text.
    records.unshift({ ...records[0], certificateId: 'BA-26LONG01', studentName: 'A recipient with a very long full name '.repeat(3).slice(0, 120), design: 'collaboration',
      designData: { ...records[0].designData, layout: 'ramnad', title: 'CERTIFICATE OF COMPLETION', subtitle: '', introduction: 'This is to certify that Mr./Ms.', accentColor: '#59b5e3', textColor: '#282264', nameSize: 24, academyName: 'Beeja Academy', collegeName: 'Shri Krishnaswamy College for Women', department: 'Bachelor of Computer Applications', hours: 40, academicYear: '2023–2024', collegeDetails: '(Affiliated to University of Madras)\nAccredited by NAAC · Managed by Krishnaswamy Educational Trust',
        academyLogoUrl: assetUrls[0], collegeLogoUrl: assetUrls[1], principalName: 'College representative with a long name '.repeat(3), principalTitle: 'Director of Learning and Academic Development', directorName: 'Academy representative with a long name '.repeat(3), directorTitle: 'Lead Trainer and Program Coordinator',
        principalSignatureUrl: assetUrls[2], directorSignatureUrl: assetUrls[3], bodyText: 'Successfully completed {course}. '.repeat(16), footerText: 'Recognizing dedication and celebrating achievement. '.repeat(3) } });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${origin}/admin?tab=certificates`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: `Preview ${records[0].studentName}'s certificate` }).click();
    await page.getByRole('dialog').getByRole('img', { name: 'Certificate verification QR code' }).first().waitFor();
    const overlaps = await page.getByRole('dialog').getByLabel('Customized certificate').first().evaluate(article => [...article.querySelectorAll('[data-layout-slot]')].filter(frame => {
      const a = frame.getBoundingClientRect(), b = frame.firstElementChild.getBoundingClientRect();
      return b.top < a.top - 1 || b.bottom > a.bottom + 1 || b.left < a.left - 1 || b.right > a.right + 1;
    }).map(frame => frame.dataset.layoutSlot));
    if (overlaps.length) errors.push(`Certificate content escapes its reserved area: ${overlaps.join(', ')}`);
    await page.screenshot({ path: path.join(folder, 'alignment-long-content.png') });
    const brandedDownload = page.waitForEvent('download', { timeout: 60000 });
    await page.getByRole('dialog').getByLabel('PDF quality').selectOption('standard');
    await page.getByRole('dialog').getByRole('button', { name: 'Download PDF', exact: true }).click();
    const brandedFile = path.join(folder, 'branded-certificate.pdf');
    await (await brandedDownload).saveAs(brandedFile);
    const pdfBytes = fs.readFileSync(brandedFile);
    const jpegStart = pdfBytes.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
    const jpegEnd = pdfBytes.indexOf(Buffer.from([0xff, 0xd9]), jpegStart);
    if (jpegStart < 0 || jpegEnd < 0) throw new Error('Could not inspect the downloaded PDF page');
    const jpeg = pdfBytes.subarray(jpegStart, jpegEnd + 2);
    fs.writeFileSync(path.join(folder, 'downloaded-certificate-page.jpg'), jpeg);
    const imageCheck = await page.evaluate(async base64 => {
      const image = new Image(); image.src = `data:image/jpeg;base64,${base64}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const counts = [0, 0, 0, 0];
      for (let p = 0; p < pixels.length; p += 4) {
        const [r, g, b] = pixels.subarray(p, p + 3);
        if (b > 180 && r < 70 && g < 140) counts[0]++;
        if (g > 120 && r < 70 && b < 140) counts[1]++;
        if (r > 160 && g < 100 && b < 100) counts[2]++;
        if (r > 110 && b > 170 && g < 100) counts[3]++;
      }
      const article = document.querySelector('[role="dialog"] [aria-label="Customized certificate"]');
      const bounds = article.getBoundingClientRect();
      const qr = article.querySelector('img[alt="Certificate verification QR code"]').getBoundingClientRect();
      const x = Math.round((qr.left - bounds.left) / bounds.width * image.width);
      const y = Math.round((qr.top - bounds.top) / bounds.height * image.height);
      const width = Math.round(qr.width / bounds.width * image.width);
      const height = Math.round(qr.height / bounds.height * image.height);
      return { counts, width: image.width, height: image.height, qr: { pixels: [...context.getImageData(x, y, width, height).data], width, height } };
    }, jpeg.toString('base64'));
    if (imageCheck.counts.some(count => count < 300)) errors.push(`The downloaded PDF is missing a logo/signature: ${imageCheck.counts}`);
    const pdfQr = jsQR(new Uint8ClampedArray(imageCheck.qr.pixels), imageCheck.qr.width, imageCheck.qr.height)?.data;
    delete imageCheck.qr;
    imageCheck.qrDecodedUrl = pdfQr;
    if (pdfQr !== `${origin}/verify-certificate/BA-26LONG01`) errors.push('The QR code inside the downloaded PDF could not be decoded');
    records[0] = { ...records[0], studentName: 'ABINAYA. A', designData: { ...records[0].designData, showSeal: false, principalName: '', principalTitle: 'Principal', directorName: '', directorTitle: 'Director', bodyText: 'has successfully completed the Value Added Course on {course}\nconducted for {hours} hours during the academic year {year}.', footerText: '' } };
    await page.goto(`${origin}/admin?tab=certificates`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: "Preview ABINAYA. A's certificate" }).click();
    await page.getByRole('dialog').locator('img[alt="Certificate verification QR code"]').first().waitFor();
    await page.screenshot({ path: path.join(folder, 'ramnad-design.png') });
    const ramnadDownload = page.waitForEvent('download', { timeout: 60000 });
    await page.getByRole('dialog').getByRole('button', { name: 'Download PDF', exact: true }).click();
    await (await ramnadDownload).saveAs(path.join(folder, 'ramnad-certificate.pdf'));
    const bulkNames = ['Short recipient', 'A moderately long recipient name', 'A recipient with a substantially longer full name for checking the underline'];
    const template = records[0];
    records.unshift(...bulkNames.map((studentName, index) => ({ ...template, studentName, certificateId: `BA-26ALIGN${index}`, batchId: 'alignment-bulk', designData: { ...template.designData, department: 'Bachelor of Science in Information Technology', collegeName: 'Mohamed Sathak College Of Arts & Science' } })));
    await page.goto(`${origin}/admin?tab=certificates`, { waitUntil: 'networkidle' });
    for (const name of bulkNames) await page.getByRole('checkbox', { name: `Select ${name}`, exact: true }).check();
    const alignmentDownload = page.waitForEvent('download', { timeout: 60000 });
    await page.getByRole('button', { name: 'Download (3)', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('#certificate-pdf-stage [data-layout-slot="recipient-name-text"]').length === 3);
    const bulkNamePositions = await page.evaluate(() => [...document.querySelectorAll('#certificate-pdf-stage [data-layout-slot="recipient-name-text"]')].map(frame => {
      const paper = frame.closest('article').getBoundingClientRect(), underline = frame.getBoundingClientRect(), name = frame.firstElementChild.getBoundingClientRect();
      return { underline: underline.bottom - paper.top, centerOffset: Math.abs((name.left + name.right - underline.left - underline.right) / 2) };
    }));
    if (Math.max(...bulkNamePositions.map(position => position.underline)) - Math.min(...bulkNamePositions.map(position => position.underline)) > 1 || bulkNamePositions.some(position => position.centerOffset > 1)) errors.push('Bulk recipient names or underlines are not consistently aligned');
    const alignmentFile = path.join(folder, 'ramnad-bulk-quality.pdf');
    await (await alignmentDownload).saveAs(alignmentFile);
    const alignmentImageCount = [...fs.readFileSync(alignmentFile).toString('latin1').matchAll(/\/Width 3500\s+\/Height 2450/g)].length;
    if (alignmentImageCount < 3) errors.push('Ramnad bulk pages are below print resolution');
    const pdfs = ['latest-batch.pdf', 'single-certificate.pdf'].map(file => ({ file, bytes: fs.statSync(path.join(folder, file)).size }));
    if (pdfs.some(pdf => pdf.bytes < 20000)) errors.push('A certificate PDF was unexpectedly small');
    const result = { mockedIntegrations: true, issuedInTestOnly: 3, desktopAndMobile: true, highResolutionBulkPages: highResolutionPages, ramnadHighResolutionPages: alignmentImageCount, bulkNamePositions, qrDecodedUrl: decodedQr, verificationPageChecked: true, longContentAlignmentChecked: true, downloadedPdfImageCheck: imageCheck, pdfs, errors };
    fs.writeFileSync(path.join(folder, 'results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    if (errors.length) process.exitCode = 1;
  } catch (error) {
    await page.screenshot({ path: path.join(folder, 'browser-failure.png') }).catch(() => {});
    console.error('Visible status:', await page.getByRole('status').allTextContents().catch(() => []));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
