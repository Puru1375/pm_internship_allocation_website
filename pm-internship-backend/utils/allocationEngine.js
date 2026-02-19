const pool = require('../config/db');

// Main Allocation Function
const runAllocationAlgorithm = async () => {
  console.log('🔄 Running Allocation Engine...');

  try {
    // 1. Fetch all ACTIVE Jobs that have openings
    const jobsResult = await pool.query(`
      SELECT id, title, company_id, openings, quota_reserved 
      FROM jobs 
      WHERE status = 'Active' AND openings > 0
    `);
    const jobs = jobsResult.rows;

    for (const job of jobs) {
      console.log(`Analyzing Job: ${job.title} (Openings: ${job.openings})`);

      // 2. Fetch all PENDING applications for this job, sorted by AI Score
      const appsResult = await pool.query(`
        SELECT a.id, a.intern_id, a.ai_score, i.category 
        FROM applications a
        JOIN intern_profiles i ON a.intern_id = i.id
        WHERE a.job_id = $1 AND a.status = 'Pending'
        ORDER BY a.ai_score DESC
      `, [job.id]);
      
      const applicants = appsResult.rows;
      if (applicants.length === 0) continue;

      let slotsFilled = 0;
      let selectedInterns = [];

      // 3. Quota Logic (e.g., {"SC": 1})
      // First, try to fill reserved slots
      if (job.quota_reserved && typeof job.quota_reserved === 'object') {
        for (const [category, count] of Object.entries(job.quota_reserved)) {
          const reservedApps = applicants.filter(app => app.category === category);
          
          // Take top N from this category
          const toSelect = reservedApps.slice(0, count);
          
          toSelect.forEach(app => {
            selectedInterns.push(app.id);
            slotsFilled++;
            // Remove from main list so we don't select twice
            const idx = applicants.findIndex(a => a.id === app.id);
            if (idx > -1) applicants.splice(idx, 1); 
          });
        }
      }

      // 4. Merit Logic (Fill remaining slots with best scores regardless of category)
      const remainingSlots = job.openings - slotsFilled;
      if (remainingSlots > 0) {
        const meritApps = applicants.slice(0, remainingSlots);
        meritApps.forEach(app => selectedInterns.push(app.id));
      }

      // 5. Update Database
      if (selectedInterns.length > 0) {
        // Mark selected as 'Shortlisted'
        await pool.query(`
          UPDATE applications 
          SET status = 'Shortlisted' 
          WHERE id = ANY($1::int[])
        `, [selectedInterns]);

        // Optional: Send Notifications here
        
        console.log(`✅ Job ${job.id}: Auto-Shortlisted ${selectedInterns.length} candidates.`);
      }
    }
    console.log('✨ Allocation Cycle Complete.');

  } catch (err) {
    console.error('Allocation Error:', err.message);
  }
};

module.exports = runAllocationAlgorithm;