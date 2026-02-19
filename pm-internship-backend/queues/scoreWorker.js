const useRedis = process.env.USE_REDIS === 'true';
let scoreWorker = null;

if (useRedis) {
  try {
    const { Worker } = require('bullmq');
    const { calculateMatchScore } = require('../utils/scoringEngine');
    const pool = require('../config/db');

    const connection = {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: () => null // fail fast if redis is down
    };

    scoreWorker = new Worker('scoreQueue', async (job) => {
      const { applicationId, internId, jobId } = job.data;
      console.log(`⚙️ Processing AI Score for App ID: ${applicationId}...`);

      try {
        const internRes = await pool.query('SELECT * FROM intern_profiles WHERE id = $1', [internId]);
        const jobRes = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);

        if (internRes.rows.length === 0 || jobRes.rows.length === 0) {
          throw new Error('Intern or Job profile not found');
        }

        const intern = internRes.rows[0];
        const jobData = jobRes.rows[0];

        const aiScore = await calculateMatchScore(intern, jobData);

        await pool.query(
          'UPDATE applications SET ai_score = $1, status = $2 WHERE id = $3',
          [aiScore, 'Pending', applicationId]
        );

        const userRes = await pool.query('SELECT user_id FROM company_profiles WHERE id = $1', [jobData.company_id]);
        if (userRes.rows.length > 0) {
          await pool.query(
            'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
            [userRes.rows[0].user_id, `New Applicant Processed: ${intern.name} (Score: ${aiScore}%)`, 'info']
          );
        }

        console.log(`✅ Score Calculated: ${aiScore}%`);
      } catch (err) {
        console.error('❌ Worker Error:', err.message);
        try {
          await pool.query('UPDATE applications SET status = $1 WHERE id = $2', ['Error', job.data.applicationId]);
        } catch (dbErr) {
          console.error('Failed to update application status:', dbErr.message);
        }
      }
    }, { connection });

    scoreWorker.on('error', () => {
      // suppress redis connection noise in dev
    });

    console.log('✅ Score Worker initialized successfully');
  } catch (err) {
    console.warn('⚠️  Score Worker disabled - Redis unavailable:', err.message);
  }
} else {
  console.log('ℹ️  Score Worker disabled (set USE_REDIS=true to enable)');
}