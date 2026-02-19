const moment = require('moment');

class Helpers {
  formatDate(date, format = 'MMM YYYY') {
    return date ? moment(date).format(format) : '';
  }

  formatDateRange(startDate, endDate, format = 'MMM YYYY') {
    const start = this.formatDate(startDate, format);
    const end = endDate ? this.formatDate(endDate, format) : 'Present';
    return `${start} - ${end}`;
  }

  sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9_\-\.]/gi, '_').toLowerCase();
  }

  generateFilename(internName, templateName) {
    const name = this.sanitizeFilename(internName || 'resume');
    const template = this.sanitizeFilename(templateName || 'default');
    const timestamp = Date.now();
    return `${name}_${template}_${timestamp}.pdf`;
  }

  parseExperience(experience) {
    if (typeof experience === 'string') {
      try {
        return JSON.parse(experience);
      } catch {
        return [];
      }
    }
    return Array.isArray(experience) ? experience : [];
  }

  parseProjects(projects) {
    if (typeof projects === 'string') {
      try {
        return JSON.parse(projects);
      } catch {
        return [];
      }
    }
    return Array.isArray(projects) ? projects : [];
  }

  parseSkills(skills) {
    if (typeof skills === 'string') {
      try {
        return JSON.parse(skills);
      } catch {
        return skills.split(',').map(s => s.trim());
      }
    }
    return Array.isArray(skills) ? skills : [];
  }

  categorizeSkills(skills) {
    const technical = [];
    const soft = [];
    
    const softSkillKeywords = [
      'communication', 'leadership', 'teamwork', 'problem-solving',
      'time management', 'adaptability', 'creativity', 'critical thinking'
    ];

    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const isSoft = softSkillKeywords.some(keyword => 
        skillLower.includes(keyword)
      );
      
      if (isSoft) {
        soft.push(skill);
      } else {
        technical.push(skill);
      }
    });

    return { technical, soft };
  }

  generateProfileSummary(internData) {
    const { name, education_level, course, skills, experience } = internData;
    const skillCount = Array.isArray(skills) ? skills.length : 0;
    const expYears = Array.isArray(experience) ? experience.length : 0;

    return `${education_level || 'Student'} ${course ? 'in ' + course : ''} with ${skillCount}+ technical skills${expYears > 0 ? ` and ${expYears} internship experience` : ''}. Passionate about technology and eager to contribute to innovative projects.`;
  }
}

module.exports = new Helpers();