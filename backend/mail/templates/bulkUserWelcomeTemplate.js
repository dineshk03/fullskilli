const bulkUserWelcomeTemplate = (options = {}) => {
    const {
        firstName = '',
        lastName = '',
        email = '',
        temporaryPassword = '',
        loginUrl,
        accountType,
        batchName,
        groupName,
        contactNumber,
        hasTemporaryPassword = Boolean(temporaryPassword),
        context = {},
    } = options;

    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'there';
    const safeLoginUrl = loginUrl || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://lms.skilli.jobs/login');

    const groups = Array.isArray(context?.groups) ? context.groups.filter(Boolean) : [];
    const metaRows = [
        accountType ? { icon: '🎓', label: 'Account Type', value: accountType } : null,
        batchName ? { icon: '📌', label: 'Batch', value: batchName } : null,
        groupName ? { icon: '🧩', label: 'Group', value: groupName } : null,
        contactNumber ? { icon: '📞', label: 'Contact Number', value: contactNumber } : null,
    ].filter(Boolean);

    const credentialRows = [
        { label: 'Email', value: email || '—' },
        hasTemporaryPassword && temporaryPassword ? { label: 'Temporary Password', value: temporaryPassword } : null,
    ].filter(Boolean);

    const metaMarkup = metaRows.length
        ? `
        <div class="card">
          <div class="card-title">✨ Your details</div>
          ${metaRows
            .map(
              (row) => `
            <div class="row">
              <div class="row-label">${row.icon} ${row.label}</div>
              <div class="row-value"><span class="pill">${row.value}</span></div>
            </div>`
            )
            .join('')}
        </div>`
        : '';

    const groupsMarkup = groups.length
        ? `
        <div class="card">
          <div class="card-title">👥 Groups</div>
          <ul class="list">
            ${groups.map((g) => `<li>${g}</li>`).join('')}
          </ul>
        </div>`
        : '';

    const credentialsMarkup = credentialRows
        .map(
            (row) => `
          <div class="row">
            <div class="row-label">${row.label === 'Email' ? '📧' : '🔑'} ${row.label}</div>
            <div class="row-value mono"><span class="chip">${row.value}</span></div>
          </div>`
        )
        .join('');

    const passwordNote = hasTemporaryPassword
        ? ''
        : `
          <div class="note">
            Your administrator will share your password separately. Use the login button below once you receive it.
          </div>`;

    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to Beeja Academy</title>
    <style>
      body { margin:0; padding:0; background:#070a22; font-family: Arial, sans-serif; }
      .wrap { width:100%; padding:26px 12px; }
      .container { max-width:650px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow: 0 24px 70px rgba(0,0,0,0.38); }
      .header { padding:40px 24px; text-align:center; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 40%, #ec4899 75%, #f59e0b 100%); color:#ffffff; }
      .header img { max-width:140px; height:auto; margin-bottom:14px; filter: brightness(0) invert(1); }
      .header h1 { margin:0; font-size:30px; font-weight:800; letter-spacing:0.2px; }
      .header p { margin:12px 0 0; font-size:14px; opacity:0.92; }
      .content { padding:26px 22px 8px; background: linear-gradient(180deg, #eef2ff 0%, #fdf2f8 55%, #fff7ed 100%); }
      .card { background:#ffffff; border:1px solid rgba(15,23,42,0.08); border-radius:16px; padding:18px; margin-bottom:14px; }
      .card-title { font-size:14px; font-weight:800; color:#111827; margin-bottom:12px; }
      .row { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:10px 12px; border-radius:12px; background:#f8fafc; border:1px solid rgba(15,23,42,0.06); margin-top:10px; }
      .row-label { font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#475569; }
      .row-value { font-size:13px; font-weight:800; color:#0f172a; text-align:right; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .chip { display:inline-block; padding:7px 10px; border-radius:10px; background: rgba(37,99,235,0.08); border:1px solid rgba(37,99,235,0.18); }
      .pill { display:inline-block; padding:6px 10px; border-radius:999px; background: rgba(236,72,153,0.10); border:1px solid rgba(236,72,153,0.22); }
      .note { margin-top:12px; padding:12px; border-radius:12px; background: linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(236,72,153,0.10) 100%); border:1px solid rgba(245,158,11,0.25); color:#7c2d12; font-size:13px; }
      .list { margin:0; padding-left:18px; color:#0f172a; font-size:13px; line-height:1.8; }
      .cta { text-align:center; padding:8px 0 22px; }
      .cta a { display:inline-block; padding:14px 22px; border-radius:14px; text-decoration:none; font-weight:800; color:#ffffff; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%); box-shadow: 0 16px 40px rgba(124,58,237,0.35); }
      .footer { padding:18px 20px; text-align:center; background:#0f172a; color:rgba(226,232,240,0.78); font-size:12px; }
      .footer a { color:#fde68a; text-decoration:none; font-weight:700; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="container">
        <div class="header">
          <img src="cid:beeja-logo" alt="Beeja Academy" />
          <h1>🎉 Welcome to Beeja Academy!</h1>
          <p>Your gateway to innovative learning and professional development</p>
        </div>

        <div class="content">
          <div class="card">
            <div class="card-title">👋 Hello ${displayName}</div>
            <div style="font-size:13px; color:#334155; line-height:1.7;">
              Your account has been created by the administrator. Use the details below to access the platform.
            </div>
          </div>

          <div class="card">
            <div class="card-title">🔐 Login credentials</div>
            ${credentialsMarkup}
            ${passwordNote}
          </div>

          ${metaMarkup}
          ${groupsMarkup}

          <div class="card">
            <div class="card-title">✅ First login checklist</div>
            <ul class="list">
              <li>🚀 Sign in using your Beeja Academy email${hasTemporaryPassword ? ' and temporary password' : ''}</li>
              <li>🛡️ Go to Settings and change your password</li>
              <li>🧑‍💼 Complete your profile</li>
            </ul>
          </div>

          <div class="cta">
            <a href="${safeLoginUrl}" target="_blank" rel="noopener">Login to your account</a>
          </div>
        </div>

        <div class="footer">
          <div>💬 Need help? Contact <a href="mailto:info@beejaacademy.com">info@beejaacademy.com</a></div>
          <div style="margin-top:6px;">© ${year} Beeja Academy. All rights reserved.</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

module.exports = bulkUserWelcomeTemplate;
