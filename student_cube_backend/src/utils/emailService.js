import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ SMTP credentials missing. OTPs will only be logged to console.");
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

export const sendOTP = async (email, otp, purpose = "Verification") => {
  const subject = `Your StudentCube ${purpose} OTP`;
  const text = `Your OTP for ${purpose} is: ${otp}. It will expire in 10 minutes. Please do not share this with anyone.`;
  
  if (!transporter) {
    console.log(`\n========================================`);
    console.log(`📧 MOCK EMAIL TO: ${email}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${text}`);
    console.log(`========================================\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"StudentCube Auth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
