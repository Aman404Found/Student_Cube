/**
 * Sends an OTP email to the user using Brevo Transactional Email API via HTTP POST.
 * Fallbacks to console logging if BREVO_API_KEY or BREVO_SENDER_EMAIL is missing.
 *
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time passcode
 * @param {string} purpose - Purpose of OTP (e.g., 'Registration', 'Password Reset')
 * @returns {Promise<boolean>} Success status
 */
export const sendOTP = async (email, otp, purpose = "Verification") => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
  const senderName = process.env.BREVO_SENDER_NAME || 'StudentCube Auth';

  const subject = `Your StudentCube ${purpose} OTP`;
  const text = `Your OTP for ${purpose} is: ${otp}. It will expire in 10 minutes. Please do not share this with anyone.`;

  if (!apiKey || !senderEmail) {
    if (!apiKey) console.warn("⚠️ BREVO_API_KEY is missing in .env.");
    if (!senderEmail) console.warn("⚠️ BREVO_SENDER_EMAIL / EMAIL_USER is missing in .env.");
    console.log(`\n========================================`);
    console.log(`📧 MOCK EMAIL TO: ${email}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${text}`);
    console.log(`========================================\n`);
    return true;
  }

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; color: #18181b;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 3px solid #18181b; box-shadow: 6px 6px 0px #18181b; padding: 32px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 28px; font-weight: 800; color: #18181b; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">StudentCube</h1>
          <p style="font-size: 13px; font-weight: 600; color: #71717a; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Campus Marketplace</p>
        </div>
        <div style="border-top: 2px solid #e4e4e7; margin-bottom: 24px;"></div>
        <h2 style="font-size: 18px; font-weight: 700; color: #18181b; margin-bottom: 12px;">${purpose} Code</h2>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin-bottom: 24px;">
          Use the One-Time Password (OTP) below to complete your ${purpose.toLowerCase()}. This passcode will expire in <strong>10 minutes</strong>.
        </p>
        <div style="background-color: #f4f4f5; border: 2px dashed #18181b; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin-bottom: 0;">
          If you did not request this OTP, please ignore this email or contact support. Never share your OTP with anyone.
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: email }],
        subject,
        htmlContent: html,
        textContent: text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Brevo API Error:", data);
      return false;
    }

    console.log(`✅ Email sent successfully via Brevo to ${email} (Message ID: ${data?.messageId || 'OK'})`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email via Brevo:", error?.message || error);
    return false;
  }
};



