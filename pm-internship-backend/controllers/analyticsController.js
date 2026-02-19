const pool = require('../config/db');

// @desc    Get Fairness & Skill Analytics
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    // 1. Social Category Breakdown (For Pie Chart)
    // Counts how many students of each category have been 'Shortlisted' or 'Hired'
    const categoryStats = await pool.query(`
      SELECT i.category, COUNT(a.id) as count
      FROM applications a
      JOIN intern_profiles i ON a.intern_id = i.id
      WHERE a.status IN ('Shortlisted', 'Hired', 'Auto-Allocated')
      GROUP BY i.category
    `);

    // 2. Skill Demand (For Bar Chart)
    // This is tricky: We need to unnest the text arrays to count frequency
    // (Assuming requirements is stored as JSON text array or Postgres Array)
    const skillStats = await pool.query(`
      SELECT unnest(requirements) as skill, COUNT(*) as count
      FROM jobs
      WHERE status = 'Active'
      GROUP BY skill
      ORDER BY count DESC
      LIMIT 5
    `);

    // 3. Placement Overview (Donut Chart)
    const placementStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Pending') as pending,
        COUNT(*) FILTER (WHERE status = 'Shortlisted') as shortlisted,
        COUNT(*) FILTER (WHERE status = 'Hired' OR status = 'Auto-Allocated') as placed,
        COUNT(*) as total
      FROM applications
    `);

    res.json({
      categoryBreakdown: categoryStats.rows,
      topSkills: skillStats.rows,
      placements: placementStats.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};