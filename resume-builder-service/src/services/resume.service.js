const db = require('../utils/db');
const helpers = require('../utils/helpers');

class ResumeService {
  
  // Fetch Intern Data for Resume
  async getInternData(internId) {
    const query = `
      SELECT 
        ip.*,
        u.email as user_email
      FROM intern_profiles ip
      LEFT JOIN users u ON ip.user_id = u.id
      WHERE ip.id = $1
    `;
    
    const result = await db.query(query, [internId]);
    
    if (result.rows.length === 0) {
      throw new Error('Intern not found');
    }

    const internData = result.rows[0];

    // Parse JSON fields
    return {
      ...internData,
      skills: helpers.parseSkills(internData.skills),
      experience: helpers.parseExperience(internData.experience),
      projects: helpers.parseProjects(internData.projects)
    };
  }

  // Format Resume Data for Templates
  async formatResumeData(internId, customData = {}) {
    const internData = await this.getInternData(internId);
    
    // Categorize skills
    const { technical: technicalSkills, soft: softSkills } = 
      helpers.categorizeSkills(internData.skills);

    // Generate or use custom profile summary
    const profileSummary = customData.profileSummary || 
      helpers.generateProfileSummary(internData);

    return {
      // Personal Information
      personalInfo: {
        name: customData.name || internData.name,
        email: customData.email || internData.email || internData.user_email,
        phone: customData.phone || internData.phone,
        address: customData.address || internData.address,
        city: customData.city || internData.city,
        state: customData.state || internData.state,
        pincode: customData.pincode || internData.pincode
      },

      // Profile Summary
      profileSummary: profileSummary,

      // Education
      education: {
        level: customData.education_level || internData.education_level,
        college: customData.college_name || internData.college_name,
        course: customData.course || internData.course,
        graduationYear: customData.graduation_year || internData.graduation_year,
        cgpa: customData.cgpa || internData.cgpa
      },

      // Skills
      skills: {
        technical: customData.technicalSkills || technicalSkills,
        soft: customData.softSkills || softSkills,
        all: customData.skills || internData.skills
      },

      // Experience
      experience: customData.experience || internData.experience || [],

      // Projects
      projects: customData.projects || internData.projects || [],

      // Additional
      preferredLocations: internData.preferred_locations || []
    };
  }

  // Save Resume Draft
  async saveDraft(internId, templateId, resumeData) {
    const query = `
      INSERT INTO resume_drafts (intern_id, template_id, resume_data, last_modified)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (intern_id, template_id) 
      DO UPDATE SET 
        resume_data = $3,
        last_modified = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [
      internId, 
      templateId, 
      JSON.stringify(resumeData)
    ]);
    
    return result.rows[0];
  }

  // Get Resume Draft
  async getDraft(internId, templateId) {
    const query = `
      SELECT * FROM resume_drafts
      WHERE intern_id = $1 AND template_id = $2
    `;
    
    const result = await db.query(query, [internId, templateId]);
    return result.rows[0];
  }

  // Track Download
  async trackDownload(internId, templateId, filename) {
    const query = `
      INSERT INTO resume_downloads (intern_id, template_id, filename)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [internId, templateId, filename]);
    return result.rows[0];
  }

  // Get Download History
  async getDownloadHistory(internId) {
    const query = `
      SELECT 
        rd.*,
        rt.name as template_name
      FROM resume_downloads rd
      LEFT JOIN resume_templates rt ON rd.template_id = rt.id
      WHERE rd.intern_id = $1
      ORDER BY rd.downloaded_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [internId]);
    return result.rows;
  }

  // Get All Templates
  async getTemplates() {
    const query = `
      SELECT * FROM resume_templates
      WHERE is_active = TRUE
      ORDER BY id
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  // Get Template by ID
  async getTemplateById(templateId) {
    const query = `
      SELECT * FROM resume_templates
      WHERE id = $1 AND is_active = TRUE
    `;
    
    const result = await db.query(query, [templateId]);
    return result.rows[0];
  }
}

module.exports = new ResumeService();