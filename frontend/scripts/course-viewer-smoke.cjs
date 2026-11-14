const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack));
    const origin = process.env.VIEWER_URL || 'https://lms.skilli.jobs';
    const courseId = '6ae44a9f2aa817a847e9596c';
    const sectionId = '6ae44bdf2aa817a847e95a80';
    const subSectionId = '6ae44be32aa817a847e95a89';
    const user = { _id: 'test-student', firstName: 'Test', lastName: 'Student', email: 'test@example.com', accountType: 'Student', createdVia: 'php_website', active: true };
    await page.addInitScript(({ user }) => {
      const encode = value => btoa(JSON.stringify(value));
      localStorage.setItem('token', `${encode({ alg: 'HS256' })}.${encode({ id: user._id, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`);
      localStorage.setItem('user', JSON.stringify(user));
    }, { user });
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (['fetch', 'xhr'].includes(request.resourceType())) {
        const data = url.pathname.toLowerCase().includes('fullcourse') ? {
          courseDetails: { _id: courseId, courseName: 'Viewer test course', instructor: user, courseContent: [{ _id: sectionId, sectionName: 'First section', subSection: [{ _id: subSectionId, title: 'Test lecture', description: 'Lecture description', videoUrl: '' }] }] },
          completedVideos: [], completedQuizzes: [], passedQuizzes: []
        } : [];
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, user, settings: {}, categories: [] }) });
      }
      if (url.origin === origin) return route.continue();
      return route.abort();
    });
    await page.goto(`${origin}/view-course/${courseId}/section/${sectionId}/sub-section/${subSectionId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const text = await page.locator('body').innerText();
    const rendered = text.includes('Test lecture') && page.url().includes('/view-course/');
    console.log(JSON.stringify({ errors, rendered, url: page.url(), text: text.slice(0, 2000) }, null, 2));
    if (errors.length || !rendered) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
