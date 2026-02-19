const pool = require('../config/db');
const getCoordinates = require('../utils/geocoder');
const { calculateMatchScore } = require('../utils/scoringEngine');
const jwt = require('jsonwebtoken');

let scoreQueue = null;
try {
  if (process.env.USE_REDIS === 'true') {
    const { Queue } = require('bullmq');
    const connection = {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379')
    };
    scoreQueue = new Queue('scoreQueue', { connection });
    console.log('✅ BullMQ queue enabled');
  } else {
    console.log('ℹ️  BullMQ disabled (set USE_REDIS=true to enable)');
  }
} catch (err) {
  console.warn('⚠️  BullMQ unavailable:', err.message);
}

// Best-effort helper: tries to read the user id from a bearer token, but never throws
const getUserIdFromAuthHeader = (req) => {
  const auth = req.headers?.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (err) {
    console.warn('Auth header parse skipped:', err.message);
    return null;
  }
};

// @desc    Post a new job (Company Only)
// @route   POST /api/jobs
exports.postJob = async (req, res) => {
  const { 
    title, type, location, stipend, description, 
    responsibilities, requirements, domain, duration, openings,
    quota_reserved, min_cgpa, required_skills_weight,deadline,start_date, end_date
  } = req.body;

  try {
    const company = await pool.query('SELECT id FROM company_profiles WHERE user_id = $1', [req.user.id]);
    if (company.rows.length === 0) return res.status(404).json({ message: 'Company profile not found' });

    // 1. Calculate Coordinates
    const { lat, lon } = await getCoordinates(location, location, '', '');

    // 2. Helper function to ensure input is always a valid Array
    const toArray = (input) => {
      if (Array.isArray(input)) return input; // Already an array
      if (typeof input === 'string') {
        // If it's a comma-separated string (e.g. "React, Node"), split it
        return input.split(',').map(item => item.trim()).filter(i => i.length > 0);
      }
      return []; // Default to empty array if null/undefined
    };

    // Clean the arrays
    const responsibilitiesArr = toArray(responsibilities);
    const requirementsArr = toArray(requirements);

    // Process quota_reserved: ensure it's a valid object
    let quotaReservedObj = null;
    if (quota_reserved && typeof quota_reserved === 'object') {
      quotaReservedObj = quota_reserved;
    }

    // Validate total reserved doesn't exceed openings
    if (quotaReservedObj) {
      const totalReserved = Object.values(quotaReservedObj).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      if (totalReserved > parseInt(openings)) {
        return res.status(400).json({ message: `Total reserved (${totalReserved}) cannot exceed total openings (${openings})` });
      }
    }

    const newJob = await pool.query(
      `INSERT INTO jobs (
          company_id, title, type, location, stipend, description, 
          responsibilities, requirements, domain, duration, openings,
          quota_reserved, min_cgpa, required_skills_weight,
          latitude, longitude,deadline,start_date, end_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
       RETURNING *`,
      [
        company.rows[0].id, 
        title, 
        type, 
        location, 
        stipend, 
        description, 
        responsibilitiesArr, // Pass JS Array directly (NO JSON.stringify)
        requirementsArr,     // Pass JS Array directly (NO JSON.stringify)
        domain, 
        duration, 
        parseInt(openings) || 1,
        quotaReservedObj || null,  // Pass as object (Postgres handles JSON serialization)
        parseFloat(min_cgpa) || 0, 
        required_skills_weight || null,
        lat, 
        lon,
        deadline || null,
        start_date || null, // $18
        end_date || null
      ]
    );

    res.status(201).json({ success: true, job: newJob.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all active jobs (For Interns)
// @route   GET /api/jobs
exports.getJobs = async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req);

    // Lookup intern_id for the logged-in user (if any). If not found, we still return jobs.
    let internId = null;
    if (userId) {
      const intern = await pool.query('SELECT id FROM intern_profiles WHERE user_id = $1', [userId]);
      internId = intern.rows[0]?.id || null;
    }

    // Join with company_profiles to get company name and tag if the current intern has applied
    const jobs = await pool.query(`
      SELECT 
        j.*, 
        c.company_name,
        CASE 
          WHEN $1::int IS NULL THEN false
          ELSE EXISTS(
            SELECT 1 FROM applications a 
            WHERE a.job_id = j.id AND a.intern_id = $1::int
          )
        END AS "hasApplied"
      FROM jobs j 
      JOIN company_profiles c ON j.company_id = c.id 
      WHERE j.status = 'Active'
      ORDER BY j.created_at DESC
    `, [internId]);

    res.json(jobs.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Apply for a job (Intern Only)
// @route   POST /api/jobs/:id/apply
exports.applyForJob = async (req, res) => {
  const jobId = req.params.id;

  try {
    // 1. Fetch Student Profile with new fields (skills, lat, lon, cgpa)
    const intern = await pool.query(
      'SELECT id, name, user_id, skills, latitude, longitude, cgpa FROM intern_profiles WHERE user_id = $1', 
      [req.user.id]
    );
    if (intern.rows.length === 0) return res.status(404).json({ message: 'Intern profile not found' });

    const internId = parseInt(intern.rows[0].id);
    const jobIdInt = parseInt(jobId);

    // 2. Check if already applied
    const existing = await pool.query('SELECT * FROM applications WHERE job_id = $1 AND intern_id = $2', [jobIdInt, internId]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Already applied' });

    // 3. Fetch Job Details (requirements, lat, lon, min_cgpa, type)
    const jobData = await pool.query(
      'SELECT requirements, latitude, longitude, min_cgpa, type, title, company_id FROM jobs WHERE id = $1', 
      [jobIdInt]
    );
    if (jobData.rows.length === 0) return res.status(404).json({ message: 'Job not found' });

    const job = jobData.rows[0];
    const student = intern.rows[0];

    // 4. Calculate Real AI Score using our Engine
    const aiScore = await calculateMatchScore(student, job);
    console.log('AI Score calculated:', aiScore);

    // 5. Insert Application with calculated score
    const insertResult = await pool.query(
      'INSERT INTO applications (job_id, intern_id, ai_score) VALUES ($1, $2, $3) RETURNING id',
      [jobIdInt, internId, Math.round(aiScore)]
    );
    console.log('Application inserted:', insertResult.rows[0]);

    // Add to queue if Redis is available
    if (scoreQueue) {
      try {
        await scoreQueue.add('calculateScore', {
          applicationId: insertResult.rows[0].id,
          internId: internId,
          jobId: jobIdInt
        });
      } catch (queueErr) {
        console.warn('⚠️  Failed to add job to queue:', queueErr.message);
      }
    }

    // 6. Notify Company (Keep existing logic)
    const companyUser = await pool.query('SELECT user_id FROM company_profiles WHERE id = $1', [job.company_id]);
    if (companyUser.rows.length > 0) {
      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
        [companyUser.rows[0].user_id, `New Applicant: ${student.name} applied for ${job.title} (AI Score: ${Math.round(aiScore)}%)`, 'info']
      );
    }


    res.status(201).json({ success: true, message: 'Application submitted', score: Math.round(aiScore) });

  } catch (err) {
    console.error('Apply Job Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
};

// @desc    Get applicants for a company's jobs
// @route   GET /api/company/applicants
exports.getCompanyApplicants = async (req, res) => {
  try {
    const company = await pool.query('SELECT id FROM company_profiles WHERE user_id = $1', [req.user.id]);
    
    if (company.rows.length === 0) return res.status(404).json({ message: 'Company not found' });

    const applicants = await pool.query(`
      SELECT a.id, i.name, j.title as role, a.status, a.ai_score as score
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN intern_profiles i ON a.intern_id = i.id
      WHERE j.company_id = $1
      ORDER BY a.ai_score DESC
    `, [company.rows[0].id]);

    res.json(applicants.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update application status
// @route   PUT /api/company/application/:id/status
exports.updateApplicationStatus = async (req, res) => {
  const { status } = req.body; 
  const applicationId = req.params.id;

  try {
    // 1. Get Application Details (to find out who the intern is)
    // We need the intern's user_id to send the notification
    const appDetails = await pool.query(`
      SELECT a.id, a.intern_id, i.user_id, j.title, c.company_name
      FROM applications a
      JOIN intern_profiles i ON a.intern_id = i.id
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles c ON j.company_id = c.id
      WHERE a.id = $1
    `, [applicationId]);

    if (appDetails.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { user_id, title, company_name } = appDetails.rows[0];

    // 2. Update Status
    await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, applicationId]);

    // 3. Create Notification for the Intern
    const message = `Your application for ${title} at ${company_name} has been marked as: ${status}`;
    
    // Determine notification type based on status
    let type = 'info';
    if (status === 'Shortlisted' || status === 'Hired') type = 'success';
    if (status === 'Rejected') type = 'warning';

    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [user_id, message, type]
    );

    res.json({ success: true, message: `Status updated & notification sent` });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if ID is a number to prevent crashes
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const userId = getUserIdFromAuthHeader(req);
    let internId = null;
    if (userId) {
      const intern = await pool.query('SELECT id FROM intern_profiles WHERE user_id = $1', [userId]);
      internId = intern.rows[0]?.id || null;
    }

    // UPDATED QUERY: Removed c.logo_url
    const job = await pool.query(`
      SELECT j.*, c.company_name, c.website_url,
        CASE 
          WHEN $2::int IS NULL THEN false
          ELSE EXISTS(
            SELECT 1 FROM applications a 
            WHERE a.job_id = j.id AND a.intern_id = $2::int
          )
        END AS "hasApplied"
      FROM jobs j 
      JOIN company_profiles c ON j.company_id = c.id 
      WHERE j.id = $1
    `, [id, internId]);

    if (job.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCompanyPostings = async (req, res) => {
  try {
    // 1. Get company_id associated with the logged-in user
    const company = await pool.query(
      'SELECT id FROM company_profiles WHERE user_id = $1', 
      [req.user.id]
    );
    
    if (company.rows.length === 0) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    // 2. Fetch jobs with applicant count
    // We use LEFT JOIN so we still get jobs even if they have 0 applicants
    const postings = await pool.query(`
      SELECT 
        j.*,
        COUNT(a.id) as applicants
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.company_id = $1
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [company.rows[0].id]);

    // 3. Format result (Postgres COUNT returns string, convert to number)
    const formattedPostings = postings.rows.map(job => ({
      ...job,
      applicants: parseInt(job.applicants),
      posted: new Date(job.created_at).toLocaleDateString() // Simple date format
    }));

    res.json(formattedPostings);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.deleteJob = async (req, res) => {
  const jobId = req.params.id;

  try {
    // 1. Security Check: Verify the logged-in company owns this job
    // We join 'jobs' with 'company_profiles' and check against 'req.user.id'
    const jobCheck = await pool.query(`
      SELECT j.id 
      FROM jobs j
      JOIN company_profiles c ON j.company_id = c.id
      WHERE j.id = $1 AND c.user_id = $2
    `, [jobId, req.user.id]);

    if (jobCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    // 2. Perform Delete
    // Note: If you set up foreign keys with ON DELETE CASCADE in SQL,
    // applications for this job will also be deleted automatically.
    await pool.query('DELETE FROM jobs WHERE id = $1', [jobId]);

    res.json({ success: true, message: 'Job deleted successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateJob = async (req, res) => {
  const jobId = req.params.id;
  const { title, type, location, stipend, description, responsibilities, requirements, domain, duration, status, openings } = req.body;

  try {
    // ... (security check remains the same) ...
    const jobCheck = await pool.query(`SELECT j.id FROM jobs j JOIN company_profiles c ON j.company_id = c.id WHERE j.id = $1 AND c.user_id = $2`, [jobId, req.user.id]);
    if (jobCheck.rows.length === 0) return res.status(403).json({ message: 'Not authorized' });

    // 2. Add openings to UPDATE query
    const updateQuery = `
      UPDATE jobs 
      SET title = COALESCE($1, title),
          type = COALESCE($2, type),
          location = COALESCE($3, location),
          stipend = COALESCE($4, stipend),
          description = COALESCE($5, description),
          responsibilities = COALESCE($6, responsibilities),
          requirements = COALESCE($7, requirements),
          domain = COALESCE($8, domain),
          duration = COALESCE($9, duration),
          status = COALESCE($10, status),
          openings = COALESCE($11, openings)
      WHERE id = $12
      RETURNING *;
    `;

    const updatedJob = await pool.query(updateQuery, [
      title, type, location, stipend, description, 
      responsibilities, requirements, domain, duration, status, 
      openings, // $11
      jobId     // $12
    ]);

    res.json({ success: true, job: updatedJob.rows[0], message: 'Job updated successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


exports.getRecommendedJobs = async (req, res) => {
  try {
    // 1. Get Intern Profile (Needed for skills & location)
    const internResult = await pool.query(
      'SELECT * FROM intern_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (internResult.rows.length === 0) {
      return res.status(404).json({ message: 'Create a profile to get recommendations' });
    }
    const intern = internResult.rows[0];

    // 2. Get All Active Jobs (Joined with Company Name)
    const jobsResult = await pool.query(`
      SELECT j.*, c.company_name 
      FROM jobs j 
      JOIN company_profiles c ON j.company_id = c.id 
      WHERE j.status = 'Active'
    `);
    const allJobs = jobsResult.rows;

    // 3. Run AI Scoring Engine on ALL jobs (await scores to avoid Promise math)
    const scoredJobs = await Promise.all(allJobs.map(async (job) => {
      const score = await calculateMatchScore(intern, job);
      return { ...job, matchScore: Math.round(score) };
    }));

    // 4. Sort by Score (High to Low) and take Top 10
    const topMatches = scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    res.json(topMatches);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};