const dns = require('dns');
const util = require('util');
const { Resend } = require('resend');

const resolveMx = util.promisify(dns.resolveMx);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_EMAIL || 'noreply@resend.dev';

const sendEmailWithAttachment = async (toEmail, subject, htmlContent, filename, fileBuffer) => {
  try {
    console.log(`📧 Sending email with attachment to: ${toEmail}`);
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject,
      html: htmlContent,
      attachments: [
        {
          filename,
          content: fileBuffer.toString('base64')
        }
      ]
    });

    console.log("📨 Email with attachment sent to:", toEmail);
    return true;
  } catch (error) {
    console.error("❌ Email Error:", error);
    throw new Error("Failed to send email. Please try again later.");
  }
};

const checkEmailDomain = async (email) => {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  const domain = email.split('@')[1];
  
  try {
    const addresses = await resolveMx(domain);
    if (addresses && addresses.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    // DNS lookup failed, but email format is valid
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'mail.com', 'protonmail.com', 'student.du.ac.in', 'gmail.co.in'];
    if (commonDomains.includes(domain.toLowerCase())) {
      console.log(`✅ Domain '${domain}' is in common domains list, allowing email`);
      return true;
    }
    console.warn(`⚠️ DNS lookup failed for domain '${domain}', but proceeding with send`);
    return true;
  }
};

const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Validate the Domain
    const isValidDomain = await checkEmailDomain(to);
    
    if (!isValidDomain) {
      console.error(`❌ Domain Validation Failed: ${to}`);
      throw new Error(`Invalid Email Domain. Please check if '${to.split('@')[1]}' is correct.`);
    }

    console.log(`📧 Sending email to: ${to}`);
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: htmlContent
    });
    
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Email Delivery Failed:", error.message);
    throw new Error("Failed to send email. The address might be invalid.");
  }
};

module.exports = { sendEmailWithAttachment, sendEmail };