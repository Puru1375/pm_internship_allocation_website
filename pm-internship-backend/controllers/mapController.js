const pool = require('../config/db');

// @desc    Get all locations for Map
// @route   GET /api/admin/map-data
exports.getMapData = async (req, res) => {
  try {
    // 1. Get Intern Locations
    const interns = await pool.query(`
      SELECT id, name, latitude, longitude, city, 'intern' as type 
      FROM intern_profiles 
      WHERE latitude IS NOT NULL
    `);

    // 2. Get Job Locations
    const jobs = await pool.query(`
      SELECT j.id, j.title, c.company_name, j.latitude, j.longitude, j.location as city, 'job' as type 
      FROM jobs j
      JOIN company_profiles c ON j.company_id = c.id
      WHERE j.latitude IS NOT NULL AND j.status = 'Active'
    `);

    res.json([...interns.rows, ...jobs.rows]);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};