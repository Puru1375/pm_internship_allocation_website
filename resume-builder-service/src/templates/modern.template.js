const helpers = require('../utils/helpers');

module.exports = (data) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - ${data.personalInfo.name || 'Resume'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.6; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; padding: 40px; margin: -40px -40px 30px -40px; border-radius: 0; }
    .header h1 { font-size: 36px; margin-bottom: 8px; font-weight: 700; }
    .header .tagline { font-size: 16px; opacity: 0.9; margin-bottom: 15px; font-weight: 300; }
    .header .contact { font-size: 14px; margin-top: 15px; }
    .header .contact span { margin-right: 20px; display: inline-block; }
    
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { color: #667eea; font-size: 20px; font-weight: bold; 
                     border-bottom: 3px solid #667eea; padding-bottom: 8px; 
                     margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
    
    .summary { font-size: 14px; color: #555; line-height: 1.8; text-align: justify; }
    
    .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .skill-item { background: #f0f4ff; padding: 10px 14px; border-radius: 6px; 
                  font-size: 13px; text-align: center; font-weight: 500; color: #667eea;
                  border: 1px solid #e0e7ff; }
    
    .experience-item, .project-item, .education-item { margin-bottom: 20px; page-break-inside: avoid; }
    .item-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: flex-start; }
    .item-title { font-weight: bold; color: #333; font-size: 16px; flex: 1; }
    .item-date { color: #667eea; font-size: 13px; font-weight: 600; white-space: nowrap; margin-left: 15px; }
    .item-subtitle { color: #666; font-size: 14px; margin-bottom: 8px; font-weight: 500; }
    .item-description { font-size: 13px; color: #555; line-height: 1.7; margin-top: 6px; }
    
    ul { margin-left: 20px; margin-top: 8px; }
    li { font-size: 13px; color: #555; margin-bottom: 5px; line-height: 1.6; }
    
    @media print {
      .container { padding: 20px; }
      .header { margin: -20px -20px 20px -20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.personalInfo.name}</h1>
      <div class="tagline">${data.education.course || data.education.level || 'Professional'}</div>
      <div class="contact">
        ${data.personalInfo.email ? `<span>✉ ${data.personalInfo.email}</span>` : ''}
        ${data.personalInfo.phone ? `<span>📱 ${data.personalInfo.phone}</span>` : ''}
        ${data.personalInfo.city ? `<span>📍 ${data.personalInfo.city}, ${data.personalInfo.state}</span>` : ''}
      </div>
    </div>

    ${data.profileSummary ? `
    <div class="section">
      <div class="section-title">PROFILE SUMMARY</div>
      <div class="summary">${data.profileSummary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">EDUCATION</div>
      <div class="education-item">
        <div class="item-header">
          <div class="item-title">${data.education.level || 'Bachelor\'s Degree'}</div>
          <div class="item-date">${data.education.graduationYear || ''}</div>
        </div>
        <div class="item-subtitle">${data.education.college || ''}</div>
        ${data.education.course ? `<div class="item-description">Course: ${data.education.course}</div>` : ''}
        ${data.education.cgpa ? `<div class="item-description">CGPA: ${data.education.cgpa}/10</div>` : ''}
      </div>
    </div>

    ${data.skills.technical.length > 0 ? `
    <div class="section">
      <div class="section-title">TECHNICAL SKILLS</div>
      <div class="skills-grid">
        ${data.skills.technical.map(skill => `
          <div class="skill-item">${skill}</div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${data.skills.soft.length > 0 ? `
    <div class="section">
      <div class="section-title">SOFT SKILLS</div>
      <div class="skills-grid">
        ${data.skills.soft.map(skill => `
          <div class="skill-item">${skill}</div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">EXPERIENCE</div>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="item-header">
            <div class="item-title">${exp.position || exp.title}</div>
            <div class="item-date">${helpers.formatDateRange(exp.startDate || exp.start_date, exp.endDate || exp.end_date)}</div>
          </div>
          <div class="item-subtitle">${exp.company}</div>
          ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
          ${exp.responsibilities && exp.responsibilities.length > 0 ? `
            <ul>
              ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${data.projects.length > 0 ? `
    <div class="section">
      <div class="section-title">PROJECTS</div>
      ${data.projects.map(project => `
        <div class="project-item">
          <div class="item-header">
            <div class="item-title">${project.name || project.title}</div>
            <div class="item-date">${project.date ? helpers.formatDate(project.date) : ''}</div>
          </div>
          ${project.technologies ? `<div class="item-subtitle">Technologies: ${Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}</div>` : ''}
          ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
          ${project.link ? `<div class="item-description">Link: ${project.link}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
};