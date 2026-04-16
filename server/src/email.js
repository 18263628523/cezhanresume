import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 发送邮箱验证码
 * @param {string} to 目标邮箱
 * @param {string} code 6位验证码
 */
export async function sendVerifyCode(to, code) {
  const mailOptions = {
    from: `"策展简历" <${process.env.EMAIL_USER}>`,
    to,
    subject: '验证您的电子邮箱 - 策展简历',
    text: `您的验证码为 ${code}，有效期 5 分钟。`,
    html: `
      <div style="font-family:'Noto Sans SC',sans-serif;max-width:480px;margin:0 auto;padding:40px 32px;background:#f9fafb;border-radius:16px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827">邮箱验证</h2>
        <p style="margin:0 0 24px;color:#6b7280;font-size:14px">感谢注册策展简历，您的验证码为：</p>
        <div style="background:#fff;border:2px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center;font-size:40px;font-weight:700;letter-spacing:12px;color:#111827;font-variant-numeric:tabular-nums">
          ${code}
        </div>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">
          验证码有效期为 <strong>5 分钟</strong>。<br/>
          如非本人操作，请忽略此邮件。
        </p>
      </div>
    `,
  };
  const info = await transporter.sendMail(mailOptions);
  console.log(`[email] sent to ${to}`, info.messageId);
  return info;
}
