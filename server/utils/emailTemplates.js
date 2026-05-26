function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>InsurVault</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:48px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(145deg,#0f0528 0%,#1e0e50 60%,#2d1270 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
      <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
        <span style="color:#a78bfa;">Insur</span>Vault
      </p>
      <p style="margin:6px 0 0;font-size:12px;color:#7c6ea8;font-weight:500;letter-spacing:0.5px;">SECURE INSURANCE MANAGEMENT</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#ffffff;padding:40px;border-left:1px solid #e8edf3;border-right:1px solid #e8edf3;">
      ${content}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f8fafc;border:1px solid #e8edf3;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        This email was sent by <strong>InsurVault</strong>. Do not share any codes or links with anyone.<br/>
        If you did not request this, you can safely ignore this email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function otpEmailHtml({ name, otp }) {
  const digits = otp.split('').map(d =>
    `<span style="display:inline-block;width:44px;height:52px;line-height:52px;text-align:center;font-size:26px;font-weight:800;color:#1e0e50;background:#f1f5f9;border:2px solid #e2e8f0;border-radius:10px;margin:0 4px;font-family:monospace;">${d}</span>`
  ).join('');

  return baseLayout(`
    <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:#0f172a;">Password Reset Code</p>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
      Hi <strong>${name}</strong>, we received a request to reset your InsurVault password.
      Use the code below — it expires in <strong>15 minutes</strong>.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">One-Time Verification Code</p>
      <div style="display:inline-block;">${digits}</div>
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Valid for 15 minutes &nbsp;·&nbsp; Single use only</p>
    </div>

    <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
        <strong>Security notice:</strong> InsurVault will never ask you to share this code over the phone or chat.
      </p>
    </div>

    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
      If you did not request a password reset, your account is safe — no action is needed.
    </p>
  `);
}

function welcomeEmailHtml({ name, resetUrl }) {
  return baseLayout(`
    <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:#0f172a;">Welcome to InsurVault 👋</p>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
      Hi <strong>${name}</strong>, your InsurVault account has been created by your administrator.
      To get started, set your password by clicking the button below.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" target="_blank"
        style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#5724c7 0%,#3b13a0 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(87,36,199,0.35);">
        Set My Password &rarr;
      </a>
    </div>

    <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.7;">
      This link expires in <strong>48 hours</strong>. If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 28px;font-size:12px;color:#6366f1;word-break:break-all;background:#f5f3ff;padding:12px 16px;border-radius:8px;border:1px solid #e0e7ff;">
      ${resetUrl}
    </p>

    <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#374151;">Password requirements:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#64748b;line-height:2;">
        <li>At least 8 characters</li>
        <li>At least one number (0–9)</li>
        <li>At least one special character (!@#$%...)</li>
      </ul>
    </div>
  `);
}

module.exports = { otpEmailHtml, welcomeEmailHtml };
