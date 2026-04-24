const nodemailer = require('nodemailer');

// Create a transporter using Gmail SMTP
// Note: Requires an App Password if 2FA is enabled on the Gmail account.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send a status update email to the citizen
 * @param {string} to - Recipient email
 * @param {object} complaint - The complaint object
 * @param {string} newStatus - The updated status
 */
const sendStatusUpdateEmail = async (to, complaint, newStatus) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[Mailer] Email not sent: GMAIL_USER or GMAIL_APP_PASSWORD not configured.');
    return;
  }

  // Basic regex check to ensure the reporterContact is actually an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.log(`[Mailer] Contact '${to}' is not a valid email. Skipping email notification.`);
    return;
  }

  const mailOptions = {
    from: `"CivicPulse" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: `CivicPulse: Your complaint status has been updated to ${newStatus}`,
    html: `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1f2937; padding: 20px; text-align: center;">
          <h2 style="color: #3b82f6; margin: 0;">CivicPulse Update</h2>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hello,</p>
          <p style="font-size: 16px; color: #374151;">
            The status of your complaint <strong>"${complaint.title}"</strong> 
            (ID: ${complaint.complaintCode || complaint._id}) has been updated.
          </p>
          <div style="background-color: #fff; border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 15px;"><strong>New Status:</strong> <span style="color: #10b981;">${newStatus}</span></p>
            ${complaint.resolution ? `<p style="margin: 10px 0 0 0; font-size: 15px;"><strong>Resolution Note:</strong> ${complaint.resolution}</p>` : ''}
          </div>
          <p style="font-size: 16px; color: #374151;">
            You can track your complaint at any time using your Complaint ID on the <a href="http://localhost:5173/track" style="color: #3b82f6; text-decoration: none;">CivicPulse portal</a>.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Thank you for helping us improve our city!
            <br/>— The CivicPulse Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Status update email sent to ${to}`);
  } catch (error) {
    console.error('[Mailer] Error sending email:', error);
  }
};

module.exports = {
  sendStatusUpdateEmail,
};
