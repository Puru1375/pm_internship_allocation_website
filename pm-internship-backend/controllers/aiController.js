// @desc    Generate AI Resume
// @route   POST /api/ai/generate-resume
exports.generateResumeAI = async (req, res) => {
  const { education, skills, experience } = req.body;

  try {
    // 1. Simulate AI Processing Delay (2.5 seconds)
    // In future, replace this with: const response = await openai.createCompletion(...)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 2. Generate Logic (Mocking intelligent response based on input)
    // This mimics what an AI would return
    const summary = `Results-driven ${education || 'professional'} with a strong foundation in technology. 
    Proven ability to apply ${skills ? skills.split(',')[0] : 'core skills'} in real-world scenarios. 
    Passionate about leveraging innovation to solve complex problems.`;

    const enhancedSkills = skills 
      ? skills.split(',').map(s => s.trim()).concat(["Problem Solving", "Agile Methodology"])
      : ["Communication", "Leadership", "Technical Analysis"];

    // 3. Send Response
    res.json({
      summary: summary,
      enhancedSkills: enhancedSkills,
      atsScore: Math.floor(Math.random() * (95 - 75 + 1) + 75) // Random score between 75-95
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'AI Service Error' });
  }
};