const courseAssignmentTemplate = ({
    name = 'there',
    courses = [],
    dashboardUrl,
    title,
    subtitle,
}) => {
    const safeDashboardUrl = dashboardUrl || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard/enrolled-courses` : 'http://lms.skilli.jobs/dashboard/enrolled-courses');

    const safeCourses = Array.isArray(courses) ? courses.filter(Boolean) : [];
    const courseItems = safeCourses
        .map(
            (courseName) => `
            <div class="course-card">
              <div class="course-icon">📘</div>
              <div class="course-body">
                <div class="course-title">${courseName}</div>
                <div class="course-subtitle">Available now in your learning dashboard</div>
              </div>
              <div class="course-badge">NEW</div>
            </div>
        `
        )
        .join('');

    const courseCountLabel = safeCourses.length === 1 ? '1 course' : `${safeCourses.length} courses`;

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title || 'New Courses Assigned'}</title>
    <style>
      body { margin:0; padding:0; background:#070a22; font-family: Arial, sans-serif; }
      .wrap { width:100%; padding:26px 12px; }
      .container { max-width:680px; margin:0 auto; background:#ffffff; border-radius:22px; overflow:hidden; box-shadow: 0 26px 80px rgba(0,0,0,0.40); }

      .hero { padding:42px 24px; text-align:center; color:#ffffff;
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 35%, #ec4899 70%, #f59e0b 100%);
      }
      .hero img { max-width:150px; height:auto; margin-bottom:14px; filter: brightness(0) invert(1); }
      .hero h1 { margin:0; font-size:30px; font-weight:900; letter-spacing:0.2px; }
      .hero p { margin:12px 0 0; font-size:14px; opacity:0.92; }

      .content { padding:26px 22px 14px; background: linear-gradient(180deg, #eef2ff 0%, #fdf2f8 55%, #fff7ed 100%); }
      .card { background:#ffffff; border:1px solid rgba(15,23,42,0.08); border-radius:18px; padding:18px; margin-bottom:14px; }
      .headline { font-size:16px; font-weight:900; color:#111827; margin-bottom:10px; }
      .text { font-size:13px; color:#334155; line-height:1.7; }

      .stats { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
      .stat-pill { display:inline-flex; align-items:center; gap:8px; padding:10px 12px; border-radius:999px;
        background: rgba(37,99,235,0.10); border:1px solid rgba(37,99,235,0.18); color:#0f172a; font-size:12px; font-weight:800;
      }

      .course-card { display:flex; align-items:flex-start; gap:12px; padding:14px 14px; border-radius:16px;
        background:#ffffff; border:1px solid rgba(15,23,42,0.08); margin-top:12px;
        box-shadow: 0 12px 26px rgba(15,23,42,0.06);
      }
      .course-icon { width:42px; height:42px; border-radius:14px; display:flex; align-items:center; justify-content:center;
        background: linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(124,58,237,0.16) 40%, rgba(236,72,153,0.16) 100%);
        font-size:18px;
      }
      .course-body { flex:1; }
      .course-title { font-size:14px; font-weight:900; color:#0f172a; }
      .course-subtitle { margin-top:4px; font-size:12px; color:#64748b; line-height:1.5; }
      .course-badge { font-size:11px; font-weight:900; letter-spacing:0.08em; padding:7px 10px; border-radius:999px;
        color:#ffffff; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
        box-shadow: 0 12px 26px rgba(16,185,129,0.28);
      }

      .cta { text-align:center; padding:10px 0 18px; }
      .cta a { display:inline-block; padding:14px 24px; border-radius:16px; text-decoration:none; font-weight:900; color:#ffffff;
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%);
        box-shadow: 0 18px 48px rgba(124,58,237,0.38);
      }

      .checklist { margin:10px 0 0; padding-left:18px; color:#0f172a; font-size:13px; line-height:1.9; }

      .footer { padding:18px 20px; text-align:center; background:#0f172a; color:rgba(226,232,240,0.78); font-size:12px; }
      .footer a { color:#fde68a; text-decoration:none; font-weight:800; }

      @media (max-width: 600px) {
        .hero { padding:34px 18px; }
        .hero h1 { font-size:26px; }
        .content { padding:20px 16px 10px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="container">
        <div class="hero">
          <img src="cid:beeja-logo" alt="Beeja Academy" />
          <h1>${title || '📚 New Courses Assigned'}</h1>
          <p>${subtitle || `We’ve added ${courseCountLabel} to your learning dashboard.`}</p>
        </div>

        <div class="content">
          <div class="card">
            <div class="headline">👋 Hello ${name}</div>
            <div class="text">
              Your learning plan just got upgraded. Below are the course(s) assigned to you. Tap the button to start learning.
            </div>
            <div class="stats">
              <div class="stat-pill">✨ ${courseCountLabel}</div>
              <div class="stat-pill">✅ Ready to start</div>
              <div class="stat-pill">🚀 Open dashboard</div>
            </div>
          </div>

          <div class="card">
            <div class="headline">📌 Assigned course(s)</div>
            ${courseItems || '<div class="text">No new courses were included in this assignment.</div>'}
          </div>

          <div class="card">
            <div class="headline">✅ Next steps</div>
            <ul class="checklist">
              <li>Open your dashboard</li>
              <li>Review the newly assigned course(s)</li>
              <li>Start the first module and track progress</li>
            </ul>
          </div>

          <div class="cta">
            <a href="${safeDashboardUrl}" target="_blank" rel="noopener">Go to My Dashboard</a>
          </div>
        </div>

        <div class="footer">
          <div>💬 Need help? Contact <a href="mailto:info@beejaacademy.com">info@beejaacademy.com</a></div>
          <div style="margin-top:6px;">© ${new Date().getFullYear()} Beeja Academy. All rights reserved.</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

module.exports = courseAssignmentTemplate;
