const nodemailer = require("nodemailer");
const fs = require("fs");

async function sendBackupEmail(filePath, filename, toEmail) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fileSize = fs.statSync(filePath).size;
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  await transporter.sendMail({
    from: `"منصة تسيير الصفقات" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `نسخة احتياطية - منصة تسيير الصفقات - ${dateStr}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #1A5276;">منصة تسيير الصفقات</h2>
        <h3>نسخة احتياطية لقاعدة البيانات</h3>
        <p>تم إنشاء نسخة احتياطية جديدة بنجاح.</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">اسم الملف</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${filename}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">تاريخ الإنشاء</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${dateStr} - ${timeStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">حجم الملف</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${fileSizeMB} MB</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #666;">
          الملف مرفق بهذه الرسالة. يرجى الاحتفاظ به في مكان آمن.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: filename,
        path: filePath,
        contentType: "application/sql",
      },
    ],
  });
}

module.exports = sendBackupEmail;
