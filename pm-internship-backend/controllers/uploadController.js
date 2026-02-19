const pool = require('../config/db');
const { extractSkillsFromPdf } = require('../utils/resumeParser');

// @desc    Upload Resume (Intern)
// @route   POST /api/upload/resume
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const localFilePath = req.file.path; // e.g. uploads/resume-123.pdf
    
    // 1. Run the Parsing Logic
    console.log("📄 Parsing Resume for Skills...");
    const extractedSkills = await extractSkillsFromPdf(localFilePath);
    console.log("✅ Found:", extractedSkills);

    // Construct URL
    const publicUrl = `http://localhost:5000/${localFilePath.replace(/\\/g, "/")}`;

    // 2. Update Database
    // We append new skills to existing ones, avoiding duplicates
    await pool.query(
      `UPDATE intern_profiles 
       SET 
         resume_data = jsonb_set(COALESCE(resume_data, '{}'), '{url}', $1),
         -- If extracted skills exist, merge them. Postgres '||' concatenates arrays.
         skills = (
            SELECT ARRAY(
                SELECT DISTINCT UNNEST(COALESCE(skills, ARRAY[]::text[]) || $3::text[])
            )
         )
       WHERE user_id = $2`,
      [`"${publicUrl}"`, req.user.id, extractedSkills]
    );

    res.json({ 
      success: true, 
      filePath: publicUrl, 
      extractedSkills,
      message: `Resume uploaded! We auto-detected ${extractedSkills.length} skills.` 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Upload Verification Doc (Company)
// @route   POST /api/upload/docs
exports.uploadCompanyDocs = async (req, res) => {
  try {
    // req.files contains the uploaded files keyed by field name
    const files = req.files;
    const userId = req.user.id;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Helper to get URL
    const getUrl = (fileArray) => fileArray ? `http://localhost:5000/${fileArray[0].path.replace(/\\/g, "/")}` : null;

    const hrUrl = getUrl(files['hr_sign']);
    const ceoUrl = getUrl(files['ceo_sign']);
    const regUrl = getUrl(files['registration_doc']);

    // Dynamic SQL update based on what was uploaded
    // We use COALESCE to keep existing value if new file isn't uploaded
    await pool.query(`
      UPDATE company_profiles 
      SET 
        doc_hr_sign = COALESCE($1, doc_hr_sign),
        doc_ceo_sign = COALESCE($2, doc_ceo_sign),
        doc_registration = COALESCE($3, doc_registration),
        verification_status = 'Pending' -- Reset status to pending on new upload
      WHERE user_id = $4
    `, [hrUrl, ceoUrl, regUrl, userId]);

    res.json({ success: true, message: 'Documents uploaded successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};