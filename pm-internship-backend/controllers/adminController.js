const pool = require('../config/db');
const { sendEmail } = require('../utils/emailService');

// @desc    Get Dashboard Stats
// @route   GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const interns = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['intern']);
    const companies = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['company']);
    const activeJobs = await pool.query('SELECT COUNT(*) FROM jobs WHERE status = $1', ['Active']);

    res.json({
      interns: parseInt(interns.rows[0].count),
      companies: parseInt(companies.rows[0].count),
      activeJobs: parseInt(activeJobs.rows[0].count)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Pending Companies
// @route   GET /api/admin/verify/companies


// @desc    Verify Company
// @route   PUT /api/admin/verify/company/:id
exports.verifyCompany = async (req, res) => {
  const { status } = req.body; // Expecting 'Verified' or 'Rejected'
  const companyId = req.params.id;

  try {
    // Get company details with user email
    const companyData = await pool.query(
      `SELECT c.*, u.email 
       FROM company_profiles c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = $1`,
      [companyId]
    );

    if (companyData.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const company = companyData.rows[0];

    // Update verification status
    const updatedCompany = await pool.query(
      `UPDATE company_profiles 
       SET verification_status = $1,
           verified_by = $2, 
           verified_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, req.user.id, companyId]
    );

    // Send email notification
    try {
      if (status === 'Verified') {
        const approvalEmailContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Company Verification Approved</p>
            </div>
            
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px;">
                Dear <strong>${company.company_name}</strong>,
              </p>
              
              <p style="margin: 0 0 25px 0; color: #334155; font-size: 15px; line-height: 1.6;">
                We are pleased to inform you that your company profile has been <strong>verified and approved</strong> by our admin team.
              </p>
              
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #047857; font-size: 16px; font-weight: bold;">✅ What's Next</h3>
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  <li style="margin: 8px 0;">Log in to your company account</li>
                  <li style="margin: 8px 0;">Complete your company profile</li>
                  <li style="margin: 8px 0;">Post internship opportunities</li>
                  <li style="margin: 8px 0;">Review applications from students</li>
                </ul>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 12px;">
                Thank you for choosing SkillBridge!<br>
                Best regards,<br>
                <strong>SkillBridge Admin Team</strong>
              </p>
            </div>
          </div>
        `;
        
        await sendEmail(
          company.email,
          "🎉 Company Verification Approved - SkillBridge",
          approvalEmailContent
        );
        console.log(`✅ Approval email sent to: ${company.email}`);
      } else if (status === 'Rejected') {
        const rejectionEmailContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Application Status Update</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Verification Status</p>
            </div>
            
            <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px;">
                Dear <strong>${company.company_name}</strong>,
              </p>
              
              <p style="margin: 0 0 25px 0; color: #334155; font-size: 15px; line-height: 1.6;">
                Thank you for your interest in SkillBridge. After careful review, we regret to inform you that your company verification could not be approved at this time.
              </p>
              
              <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #b91c1c; font-size: 16px; font-weight: bold;">📌 What You Can Do</h3>
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  <li style="margin: 8px 0;">Review your company information for accuracy</li>
                  <li style="margin: 8px 0;">Contact our support team for more details</li>
                  <li style="margin: 8px 0;">Reapply with updated information if applicable</li>
                </ul>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #334155; font-size: 15px; line-height: 1.6;">
                If you have any questions, please contact our support team.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 12px;">
                Best regards,<br>
                <strong>SkillBridge Admin Team</strong>
              </p>
            </div>
          </div>
        `;
        
        await sendEmail(
          company.email,
          "Company Verification Update - SkillBridge",
          rejectionEmailContent
        );
        console.log(`✅ Rejection email sent to: ${company.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the verification if email fails
    }

    res.json({ success: true, message: `Company marked as ${status}`, company: updatedCompany.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Join with Users table to get email if needed
    const company = await pool.query(`
      SELECT c.*, u.email 
      FROM company_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (company.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.rejectCompany = async (req, res) => {
  const { reason } = req.body;
  const companyId = req.params.id;

  try {
    await pool.query(
      `UPDATE company_profiles 
       SET verification_status = 'Rejected', 
           rejection_reason = $1, 
           verified_by = $2, 
           verified_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [reason, req.user.id, companyId]
    );

    res.json({ success: true, message: 'Company rejected successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.banIntern = async (req, res) => {
  const { reason } = req.body;
  const internId = req.params.id;

  try {
    await pool.query(
      `UPDATE intern_profiles 
       SET verification_status = 'Banned', 
           ban_reason = $1
       WHERE id = $2`,
      [reason, internId]
    );

    res.json({ success: true, message: 'Intern banned successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getInternById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch profile and join with users to get email
    const intern = await pool.query(`
      SELECT i.*, u.email 
      FROM intern_profiles i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
    `, [id]);

    if (intern.rows.length === 0) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    res.json(intern.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.verifyIntern = async (req, res) => {
  const { status } = req.body; // Expecting 'Verified'
  const internId = req.params.id;

  try {
    const updatedIntern = await pool.query(
      `UPDATE intern_profiles 
       SET verification_status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, internId]
    );

    if (updatedIntern.rows.length === 0) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    res.json({ success: true, message: `Intern documents marked as ${status}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.confirmAllocation = async (req, res) => {
  const applicationId = req.params.id;

  try {
    const updatedApp = await pool.query(
      `UPDATE applications 
       SET status = 'Auto-Allocated' 
       WHERE id = $1 
       RETURNING *`,
      [applicationId]
    );

    if (updatedApp.rows.length === 0) {
      return res.status(404).json({ message: 'Application match not found' });
    }

    res.json({ success: true, message: 'Allocation confirmed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.getAllocationMatches = async (req, res) => {
  try {
    // Fetch applications with score > 80 that are not yet confirmed
    const matches = await pool.query(`
      SELECT 
        a.id, 
        i.name as intern, 
        c.company_name as company, 
        j.title as role, 
        a.ai_score as score, 
        a.status,
        i.id as intern_id,
        c.id as company_id,
        j.id as job_id
      FROM applications a
      JOIN intern_profiles i ON a.intern_id = i.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles c ON j.company_id = c.id
      WHERE a.ai_score > 80 
      ORDER BY a.ai_score DESC
    `);

    res.json(matches.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPendingCompanies = async (req, res) => {
  try {
    const companies = await pool.query(
      `SELECT 
        id, 
        company_name as name, 
        company_type as type, 
        CASE WHEN verification_status = 'Verified' THEN true ELSE false END as verified,
        verification_status,
        created_at 
       FROM company_profiles 
       ORDER BY 
         CASE WHEN verification_status != 'Verified' THEN 0 ELSE 1 END,
         created_at DESC`
    );

    // Format date for frontend
    const formatted = companies.rows.map(c => ({
      ...c,
      date: new Date(c.created_at).toLocaleDateString()
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPendingInterns = async (req, res) => {
  try {
    // Select specific fields for the table view - return ALL interns, not just pending
    const interns = await pool.query(
      `SELECT id, name, email, college_name as college, course, verification_status
       FROM intern_profiles 
       ORDER BY 
         CASE WHEN verification_status = 'pending' THEN 0 
              WHEN verification_status = 'Active' THEN 1 
              ELSE 2 END,
         created_at DESC`
    );

    res.json(interns.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCompletedInternships = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id as app_id, i.id as intern_id, j.id as job_id, c.id as company_id,
             i.name, c.company_name, j.title, j.end_date
      FROM applications a
      JOIN intern_profiles i ON a.intern_id = i.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles c ON j.company_id = c.id
      LEFT JOIN certificates cert ON cert.intern_id = i.id AND cert.job_id = j.id
      WHERE a.status = 'Completed' AND cert.id IS NULL
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};