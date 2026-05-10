export async function sendPasswordResetEmail(toEmail, resetLink) {
  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:50%;padding:16px;margin-bottom:16px;">
                <span style="font-size:36px;">🔐</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">Kandahar Mobile Registration System</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">د کندهار د موبایل د ثبت سیستم</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <!-- English Section -->
              <div style="margin-bottom:32px;">
                <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700;">Password Reset Request</h2>
                <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.7;">We received a request to reset your password. Click the button below to set a new password. This link will expire in <strong>15 minutes</strong>.</p>
                <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                  <tr>
                    <td style="border-radius:8px;background:linear-gradient(135deg,#0f3460,#1a1a2e);">
                      <a href="${resetLink}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">Reset My Password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#888;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin:6px 0 0;word-break:break-all;"><a href="${resetLink}" style="color:#0f3460;font-size:13px;">${resetLink}</a></p>
              </div>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #eee;margin:0 0 32px;" />

              <!-- Pashto Section -->
              <div dir="rtl" style="text-align:right;">
                <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:700;">د پاسورډ بدلولو غوښتنه</h2>
                <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.9;">موږ ستاسو د پاسورډ بدلولو غوښتنه ترلاسه کړه. لاندې تڼۍ کلیک کړئ ترڅو نوی پاسورډ وټاکئ. دا لینک د <strong>۱۵ دقیقو</strong> لپاره معتبر دی.</p>
                <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;margin-right:0;">
                  <tr>
                    <td style="border-radius:8px;background:linear-gradient(135deg,#0f3460,#1a1a2e);">
                      <a href="${resetLink}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">زما پاسورډ بدل کړه</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#888;font-size:13px;">که تڼۍ کار ونه کړه، دا لینک کاپي کړئ او براوزر کې یې پیسټ کړئ:</p>
                <p style="margin:6px 0 0;word-break:break-all;"><a href="${resetLink}" style="color:#0f3460;font-size:13px;">${resetLink}</a></p>
              </div>

              <!-- Warning Box -->
              <div style="margin-top:32px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                  ⚠️ <strong>English:</strong> If you did not request a password reset, please ignore this email. Your account remains secure.<br/>
                  <span dir="rtl" style="display:block;margin-top:6px;">⚠️ <strong>پښتو:</strong> که تاسو دا غوښتنه نه وه کړې، دا بریښنالیک له پامه غورځوئ. ستاسو حساب خوندي دی.</span>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#aaa;font-size:12px;line-height:1.8;">
                Kandahar Mobile Registration System &nbsp;|&nbsp; د کندهار د موبایل د ثبت سیستم<br/>
                This is an automated email. Please do not reply.<br/>
                <span dir="rtl">دا یو اتوماتیک بریښنالیک دی. مهرباني وکړئ ځواب مه ورکوئ.</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.SERVICE_ID,
      template_id: process.env.TEMPLATE_ID,
      user_id: process.env.PUBLIC_KEY,
      accessToken: process.env.PRIVATE_KEY,
      template_params: {
        to_email: toEmail,
        reset_link: resetLink,
        html_content: html,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS error: ${text}`);
  }
}
