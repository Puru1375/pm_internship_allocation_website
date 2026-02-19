const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const { sendEmailWithAttachment, sendEmail } = require('../utils/emailService');

// @desc    Get current company profile
// @route   GET /api/company/profile
exports.getCompanyProfile = async (req, res) => {
  try {
    // req.user.id comes from the 'protect' middleware
    const profile = await pool.query(
      'SELECT * FROM company_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profile.rows.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    // Return the first (and only) row
    res.json(profile.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update company profile
// @route   PUT /api/company/profile
exports.updateCompanyProfile = async (req, res) => {
  const {
    company_name, company_type, description, website_url,
    address, city, state, pincode, gst_number, pan_number, document_urls
  } = req.body;

  try {
    // 1. Calculate Profile Completion Score Logic
    let score = 20; // Base score for registering
    if (company_name) score += 10;
    if (website_url) score += 10;
    if (description && description.length > 50) score += 20;
    if (address && city && state && pincode) score += 20;
    if (gst_number && pan_number) score += 20; // Verification details carry weight

    // Cap score at 100
    if (score > 100) score = 100;

    // 2. Prepare SQL Query
    const updateQuery = `
      UPDATE company_profiles
      SET company_name=$1, company_type=$2, description=$3, website_url=$4,
          address=$5, city=$6, state=$7, pincode=$8, gst_number=$9, pan_number=$10,
          document_urls=$11, profile_completion=$12, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=$13
      RETURNING *;
    `;

    // Ensure document_urls is an array (Postgres requirement)
    const docs = Array.isArray(document_urls) ? document_urls : [];

    // 3. Execute Query
    const updatedProfile = await pool.query(updateQuery, [
      company_name, company_type, description, website_url,
      address, city, state, pincode, gst_number, pan_number,
      docs, score, req.user.id
    ]);

    if (updatedProfile.rows.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    // 4. Fetch company email and user details for notifications
    try {
      const userResult = await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [req.user.id]
      );

      const companyEmail = userResult.rows.length > 0 ? userResult.rows[0].email : null;
      const updatedCompanyName = updatedProfile.rows[0].company_name || company_name || 'Unknown Company';
      const updateTimestamp = new Date().toLocaleString('en-IN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      // 5. Send email to all admin users (non-blocking)
      if (companyEmail) {
        setImmediate(async () => {
          try {
            // Fetch all admin user emails
            const adminUsersResult = await pool.query(
              'SELECT email FROM users WHERE role = $1',
              ['admin']
            );

            if (adminUsersResult.rows.length === 0) {
              console.log('⚠️ No admin users found to send email notification');
              return;
            }

            const adminEmailContent = `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8fafc;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📝 Company Profile Updated</h1>
                  <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.95;">Admin Notification</p>
                </div>

                <!-- Main Content -->
                <div style="background-color: white; padding: 40px 30px;">
                  <p style="margin: 0 0 25px 0; color: #334155; font-size: 15px; line-height: 1.8;">
                    Hello Admin,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.8;">
                    A company has updated their profile on the SkillBridge platform. Please review the details below:
                  </p>

                  <!-- Company Details Box -->
                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 8px; padding: 25px; margin: 30px 0;">
                    <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 16px; font-weight: bold;">🏢 Company Details</h3>
                    
                    <div style="margin-bottom: 15px;">
                      <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Company Name</p>
                      <p style="margin: 0; color: #3b82f6; font-size: 16px; font-weight: bold;">${updatedCompanyName}</p>
                    </div>

                    <div style="margin-bottom: 15px;">
                      <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Company Email</p>
                      <p style="margin: 0; color: #3b82f6; font-size: 15px;">${companyEmail}</p>
                    </div>

                    <div style="margin-bottom: 0;">
                      <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Update Timestamp</p>
                      <p style="margin: 0; color: #3b82f6; font-size: 15px; font-weight: 500;">${updateTimestamp}</p>
                    </div>
                  </div>

                  <!-- Action Required -->
                  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 25px 0;">
                    <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 14px; font-weight: bold;">📌 Action Required</h4>
                    <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.8;">
                      Please review the company's updated profile to ensure all information is accurate and compliant with platform guidelines. 
                      You can access the full profile details in the admin dashboard.
                    </p>
                  </div>

                  <p style="margin: 20px 0 0 0; color: #334155; font-size: 15px; line-height: 1.8;">
                    Best regards,<br>
                    <strong>SkillBridge Admin System</strong>
                  </p>
                </div>

                <!-- Footer -->
                <div style="background-color: #f1f5f9; padding: 25px 30px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                    © 2025 SkillBridge. All rights reserved.<br>
                    This is an automated admin notification.
                  </p>
                </div>

              </div>
            `;

            // Send email to each admin user
            let emailsSent = 0;
            for (const adminUser of adminUsersResult.rows) {
              try {
                await sendEmail(adminUser.email, `Company Profile Update: ${updatedCompanyName}`, adminEmailContent);
                emailsSent++;
                console.log(`✅ Admin notification email sent to: ${adminUser.email}`);
              } catch (individualEmailErr) {
                console.error(`⚠️ Failed to send email to ${adminUser.email}: ${individualEmailErr.message}`);
              }
            }
            
            console.log(`✅ Total admin notification emails sent: ${emailsSent}/${adminUsersResult.rows.length}`);
          } catch (emailErr) {
            console.error(`⚠️ Failed to send admin notification emails: ${emailErr.message}`);
            // Don't fail the request, just log the error
          }
        });
      }

      // 6. Fetch all admin users and create notification entries (non-blocking)
      setImmediate(async () => {
        try {
          const adminUsersResult = await pool.query(
            'SELECT id FROM users WHERE role = $1',
            ['admin']
          );

          if (adminUsersResult.rows.length > 0) {
            const adminIds = adminUsersResult.rows.map(row => row.id);
            const notificationMessage = `Company "${updatedCompanyName}" has updated their profile.`;

            // Insert notification for each admin user
            for (const adminId of adminIds) {
              await pool.query(
                `INSERT INTO notifications (user_id, type, message, created_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                [adminId, 'info', notificationMessage]
              );
            }

            console.log(`✅ Created ${adminIds.length} notification(s) for admin users`);
          }
        } catch (notifErr) {
          console.error(`⚠️ Failed to create admin notifications: ${notifErr.message}`);
          // Don't fail the request, just log the error
        }
      });

    } catch (notificationErr) {
      console.error(`⚠️ Error processing notifications: ${notificationErr.message}`);
      // Don't fail the request if notifications fail
    }

    res.json({ success: true, profile: updatedProfile.rows[0], message: 'Profile updated successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getApplicantById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    // We join Applications -> Intern Profiles -> Jobs to ensure this applicant applied to THIS company's job
    const applicant = await pool.query(`
      SELECT 
        i.*, -- Get all intern profile details
        a.status as application_status,
        a.ai_score,
        a.applied_at,
        j.title as applied_for_role
      FROM applications a
      JOIN intern_profiles i ON a.intern_id = i.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles c ON j.company_id = c.id
      WHERE a.id = $1 AND c.user_id = $2
    `, [applicationId, req.user.id]);

    if (applicant.rows.length === 0) {
      return res.status(404).json({ message: 'Applicant not found or unauthorized' });
    }

    res.json(applicant.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.generateOfferLetter = async (req, res) => {
  const { applicationId } = req.params;

  try {
    // 1. Fetch details (Company, Student, Job)
    const result = await pool.query(`
      SELECT 
        a.id, c.company_name, c.address as comp_addr, c.user_id as comp_user,
        i.name as intern_name, i.address as intern_addr,
        j.title as job_title, j.stipend, j.duration
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles c ON j.company_id = c.id
      JOIN intern_profiles i ON a.intern_id = i.id
      WHERE a.id = $1
    `, [applicationId]);

    if (result.rows.length === 0) return res.status(404).send('Application not found');
    const data = result.rows[0];

    // Security Check: Ensure logged-in company owns this offer
    if (data.comp_user !== req.user.id) {
      return res.status(403).send('Unauthorized');
    }

    // 2. Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Offer-Letter-${data.intern_name}.pdf`);
    doc.pipe(res);

    // 3. Design PDF
    doc.fontSize(20).text(data.company_name, { align: 'center' });
    doc.fontSize(10).text(data.comp_addr || 'Corporate Office', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text(`To,`);
    doc.text(data.intern_name);
    doc.text(data.intern_addr || 'India');
    doc.moveDown(2);

    doc.fontSize(16).text(`Subject: Internship Offer Letter`, { underline: true, align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Dear ${data.intern_name},`, { align: 'left' });
    doc.moveDown();
    doc.text(`We are pleased to offer you the position of ${data.job_title} at ${data.company_name}.`);
    doc.moveDown();
    doc.text(`This internship is for a duration of ${data.duration}, starting immediately.`);
    doc.text(`You will receive a stipend of ${data.stipend} per month.`);
    doc.moveDown(2);
    
    doc.text(`We were impressed by your AI Match Score and your background skills. We look forward to having you on our team.`);
    doc.moveDown(4);

    doc.text('Sincerely,');
    doc.moveDown();
    doc.text('Hiring Manager');
    doc.text(data.company_name);

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
};

exports.sendOfferLetter = async (req, res) => {
  const { applicationId } = req.params;

  try {
    // 1. Fetch details (including student email)
    const result = await pool.query(`
      SELECT 
        a.id, c.company_name, c.address as comp_addr, c.user_id as comp_user,
        i.name as intern_name, i.email as intern_email, i.address as intern_addr,
        j.title as job_title, j.stipend, j.duration, j.start_date, j.end_date
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles c ON j.company_id = c.id
      JOIN intern_profiles i ON a.intern_id = i.id
      WHERE a.id = $1
    `, [applicationId]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Application not found' });
    const data = result.rows[0];

    // Security Check
    if (data.comp_user !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    // 2. Generate PDF in Memory (Buffer)
    const doc = new PDFDocument();
    let buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);

        // 3. Send Email with improved HTML template
        const emailSent = await sendEmailWithAttachment(
            data.intern_email, 
            `🎉 Congratulations! Internship Offer from ${data.company_name}`,
            `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8fafc;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎓 Congratulations!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">You've Received an Internship Offer</p>
              </div>

              <!-- Main Content -->
              <div style="background-color: white; padding: 40px 30px;">
                
                <p style="margin: 0 0 25px 0; color: #334155; font-size: 16px; line-height: 1.8;">
                  Dear <strong>${data.intern_name}</strong>,
                </p>

                <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.8;">
                  We are delighted to offer you the position of <strong style="color: #10b981; font-size: 16px;">${data.job_title}</strong> at <strong>${data.company_name}</strong>. Your profile impressed us, and we believe you're an excellent fit for our team!
                </p>

                <!-- Offer Details Box -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 25px; margin: 30px 0;">
                  <h3 style="margin: 0 0 20px 0; color: #059669; font-size: 16px; font-weight: bold;">📋 Internship Details</h3>
                  
                  <div style="margin-bottom: 15px;">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;">${data.job_title}</p>
                  </div>

                  <div style="margin-bottom: 15px;">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Stipend</p>
                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;">₹${data.stipend}/month</p>
                  </div>

                  <div style="margin-bottom: 15px;">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Duration</p>
                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;">${data.duration}</p>
                  </div>

                  ${data.start_date ? `
                  <div style="margin-bottom: 15px;">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Start Date</p>
                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;">${new Date(data.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  ` : ''}

                  ${data.end_date ? `
                  <div style="margin-bottom: 0;">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">End Date</p>
                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;">${new Date(data.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  ` : ''}
                </div>

                <!-- Next Steps -->
                <div style="background-color: #eff6ff; border-left: 4px solid #0284c7; padding: 20px; border-radius: 4px; margin: 25px 0;">
                  <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 14px; font-weight: bold;">📌 Next Steps</h4>
                  <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
                    <li>Review your official offer letter (attached)</li>
                    <li>Sign and return the acceptance form</li>
                    <li>Complete the onboarding process</li>
                    <li>Prepare for your first day!</li>
                  </ol>
                </div>

                <!-- Document Note -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin: 25px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.8;">
                    <strong>📎 Important:</strong> Please find your official internship offer letter attached to this email. Please review it carefully and get back to us with your acceptance.
                  </p>
                </div>

                <p style="margin: 25px 0 0 0; color: #334155; font-size: 15px; line-height: 1.8;">
                  We're excited to have you on board and look forward to working with you!
                </p>

                <p style="margin: 20px 0 0 0; color: #334155; font-size: 15px; line-height: 1.8;">
                  Best regards,<br>
                  <strong>${data.company_name}</strong><br>
                  <span style="font-size: 13px; color: #64748b;">Hiring Team</span>
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f1f5f9; padding: 25px 30px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                  <strong>Questions?</strong> Reply to this email or contact us for more information.
                </p>
                <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                  © 2025 ${data.company_name}. All rights reserved.<br>
                  This is an official communication from ${data.company_name}.
                </p>
              </div>

            </div>
            `,
            `Offer-Letter-${data.intern_name}.pdf`,
            pdfData
        );

        if(emailSent) {
            // Update Status
            await pool.query("UPDATE applications SET status = 'Offer Sent' WHERE id = $1", [applicationId]);
            res.json({ success: true, message: 'Offer Letter sent to candidate via Email!' });
        } else {
            res.status(500).json({ message: 'Failed to send email' });
        }
    });

    // --- PDF Design (Same as before) ---
    doc.fontSize(20).text(data.company_name, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Dear ${data.intern_name},`);
    doc.text(`We are pleased to offer you the position of ${data.job_title}.`);
    doc.moveDown();
    doc.text(`Stipend: ${data.stipend}`);
    doc.text(`Duration: ${data.duration}`);
    if (data.start_date) {
      doc.text(`Start Date: ${new Date(data.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    }
    if (data.end_date) {
      doc.text(`End Date: ${new Date(data.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    }
    doc.end(); // Triggers the 'end' event above

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.sendConfirmationEmail = async (req, res) => {
  const { applicationId } = req.params;

  try {
    // Fetch Application + Job Details
    const result = await pool.query(`
      SELECT a.id, i.name, i.email, j.title, j.start_date, j.deadline, c.company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN intern_profiles i ON a.intern_id = i.id
      JOIN company_profiles c ON j.company_id = c.id
      WHERE a.id = $1
    `, [applicationId]);

    const data = result.rows[0];

    // Check Deadline Logic
    if (new Date() < new Date(data.deadline)) {
        return res.status(400).json({ message: "Cannot send confirmation before application deadline ends." });
    }

    // Send Email
    const emailContent = `
      <h3>Congratulations ${data.name}!</h3>
      <p>We are thrilled to confirm your internship for the position of <b>${data.title}</b> at <b>${data.company_name}</b>.</p>
      <p><b>Start Date:</b> ${new Date(data.start_date).toDateString()}</p>
      <p>Please report to the office (or online portal) at 9:00 AM.</p>
      <br/><p>Best Regards,<br/>HR Team</p>
    `;

    await sendEmail(data.email, "Internship Confirmation & Onboarding", emailContent);

    // Update Status
    await pool.query("UPDATE applications SET status = 'Confirmation Sent' WHERE id = $1", [applicationId]);

    res.json({ success: true, message: "Confirmation email sent successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};