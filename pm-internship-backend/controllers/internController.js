const pool = require('../config/db');
const getCoordinates = require('../utils/geocoder'); 

// @desc    Get current intern profile
// @route   GET /api/intern/profile
exports.getInternProfile = async (req, res) => {
  try {
    // req.user.id comes from auth middleware (we will add next)
    const profile = await pool.query(
      'SELECT * FROM intern_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profile.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update intern profile
// @route   PUT /api/intern/profile
exports.updateInternProfile = async (req, res) => {
  const {
    name, phone, dob, gender, address, city, state, pincode,
    education_level, college_name, course, graduation_year, cgpa,
    skills, experience, projects, preferred_locations, share_locations,
    resume_data, category, disability_status, preferred_districts
  } = req.body;

  try {

    const { lat, lon } = await getCoordinates(address, city, state, pincode);

    // Calculate comprehensive completion score
    let score = 0;
    
    // Basic info (25 points)
    if (name) score += 5;
    if (phone) score += 5;
    if (dob) score += 5;
    if (gender) score += 5;
    if (category) score += 5;
    
    // Address info (15 points)
    if (address) score += 5;
    if (city) score += 5;
    if (state && pincode) score += 5;
    
    // Education (25 points)
    if (education_level) score += 5;
    if (college_name) score += 5;
    if (course) score += 5;
    if (graduation_year) score += 5;
    if (cgpa) score += 5;
    
    // Skills & Experience (20 points)
    if (skills && Array.isArray(skills) && skills.length > 0) score += 10;
    if (experience && Array.isArray(experience) && experience.length > 0) score += 10;
    
    // Projects (10 points)
    if (projects && Array.isArray(projects) && projects.length > 0) score += 10;
    
    // Preferences (5 points)
    if (preferred_locations && Array.isArray(preferred_locations) && preferred_locations.length > 0) score += 5;
    
    console.log('📊 Profile completion score calculated:', score, 'from fields:', { name: !!name, phone: !!phone, dob: !!dob, college_name: !!college_name, course: !!course, skills: skills?.length || 0, experience: experience?.length || 0 });

    // Convert disability_status string to boolean
    let disabilityBool = false;
    if (disability_status === 'PWD' || disability_status === true) {
      disabilityBool = true;
    }

    // Convert preferred_districts string to array
    let districtsArray = [];
    if (typeof preferred_districts === 'string' && preferred_districts.trim()) {
      districtsArray = preferred_districts.split(',').map(d => d.trim()).filter(d => d.length > 0);
    } else if (Array.isArray(preferred_districts)) {
      districtsArray = preferred_districts;
    }

    const updateQuery = `
      UPDATE intern_profiles 
      SET name=$1, phone=$2, dob=$3, gender=$4, address=$5, city=$6, state=$7, pincode=$8,
          education_level=$9, college_name=$10, course=$11, graduation_year=$12, cgpa=$13,
          skills=$14, experience=$15, projects=$16, preferred_locations=$17, 
          share_locations=$18, resume_data=$19, profile_completion=$20,
          category=$21, disability_status=$22, preferred_districts=$23,
          latitude=$24, longitude=$25
      WHERE user_id=$26
      RETURNING *;
    `;

    const updatedProfile = await pool.query(updateQuery, [
      name, phone, dob, gender, address, city, state, pincode,
      education_level, college_name, course, graduation_year, cgpa,
      skills, JSON.stringify(experience), JSON.stringify(projects), preferred_locations,
      share_locations, JSON.stringify(resume_data), score,
      category, disabilityBool, districtsArray,
      lat, lon, // New Coords
      req.user.id
    ]);

    console.log('✅ Profile updated. New completion score:', updatedProfile.rows[0].profile_completion);
    
    res.json({ success: true, profile: updatedProfile.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    // 1. Find the intern_id associated with the logged-in user_id
    const intern = await pool.query(
      'SELECT id FROM intern_profiles WHERE user_id = $1', 
      [req.user.id]
    );

    if (intern.rows.length === 0) {
      return res.status(404).json({ message: 'Intern profile not found' });
    }

    // 2. Fetch applications with Job Title and Company Name
    const applications = await pool.query(`
      SELECT 
        a.id, 
        a.status, 
        a.applied_at, 
        a.ai_score,
        j.title as role, 
        j.type,
        c.company_name as company
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN company_profiles c ON j.company_id = c.id
      WHERE a.intern_id = $1
      ORDER BY a.applied_at DESC
    `, [intern.rows[0].id]);

    // 3. Format the data to match frontend expectations
    const formattedApps = applications.rows.map(app => ({
      id: app.id,
      company: app.company,
      role: app.role,
      appliedDate: new Date(app.applied_at).toLocaleDateString(), // Format date
      status: app.status,
      logo: "bg-blue-600" // Placeholder for color logic
    }));

    res.json(formattedApps);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};