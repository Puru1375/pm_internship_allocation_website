const axios = require('axios');

// Distance calculation remains local (Math is faster in Node)
const calculateDistanceScore = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  if (distance < 20) return 30; // 30 Points for close proximity
  if (distance < 100) return 20;
  return 10;
};

exports.calculateMatchScore = async (student, job) => {
  let totalScore = 0;

  // 1. SAFELY Get Arrays (Fixes the "reading 'join' of null" error)
  // If database returns null, we default to empty array []
  const studentSkills = student.skills || [];
  const jobRequirements = job.requirements || [];
  const jobDescription = job.description || "";
  const studentCourse = student.course || "";

  // 2. NLP Semantic Matching
  try {
    const studentText = `${studentSkills.join(', ')}. ${studentCourse}.`;
    const jobText = `${jobRequirements.join(', ')}. ${jobDescription}.`;

    // 3. Fix Networking (Fixes "ENOTFOUND ai-engine")
    // If running inside Docker, use 'http://ai-engine:8000'
    // If running locally (npm run dev), use 'http://localhost:8000'
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const aiResponse = await axios.post(`${aiServiceUrl}/calculate-score`, {
      student_text: studentText,
      job_text: jobText
    });

    const nlpScore = aiResponse.data.score; 
    totalScore += (nlpScore * 0.5); 

  } catch (error) {
    // Don't crash the server if AI fails
    console.error("⚠️ AI Engine skipped:", error.message);
    
    // Fallback: Simple string matching
    const matches = jobRequirements.filter(req => 
      studentSkills.some(s => s.toLowerCase().includes(req.toLowerCase()))
    );
    if (jobRequirements.length > 0) {
      totalScore += ((matches.length / jobRequirements.length) * 25);
    } else {
      totalScore += 25;
    }
  }

  // 4. Location Score
  if(job.type === 'Remote' || job.type === 'remote') {
    totalScore += 30;
  } else {
    // Ensure coordinates exist before calculating
    if (student.latitude && student.longitude && job.latitude && job.longitude) {
      totalScore += calculateDistanceScore(student.latitude, student.longitude, job.latitude, job.longitude);
    }
  }

  // 5. Academic Score
  if (student.cgpa && job.min_cgpa && student.cgpa >= job.min_cgpa) {
    totalScore += 20;
  }

  return Math.floor(totalScore);
};