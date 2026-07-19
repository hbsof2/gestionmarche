async function sendEmail({ to, subject, text, attachments = [] }) {
  // TODO: configure nodemailer or Resend/SendGrid
  console.log(`[email] To: ${to} | Subject: ${subject}`);
}

module.exports = { sendEmail };
