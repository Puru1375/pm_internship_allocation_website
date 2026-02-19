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
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.7; }
    .container { max-width: 750px; margin: 0 auto; padding: 40px; }
    
    .header { margin-bottom: 40px; }
    .header h1 { font-size: 38px; font-weight: 300; margin-bottom: 5px; letter-spacing: -0.5px; }
    .header .tagline { font-size: 14px; color: #666; margin-bottom: 15px; }
    .header .contact { font-size: 12px; color: #888; }
    .header .contact span { margin-right: 15px; }
    
    .section { margin-bottom: 35px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; 
                     letter-spacing: 2px; color: #999; margin-bottom: 12px; }
    
    .summary { font-size: 13px; color: #444; line-height: 1.9; }
    
    .skills-simple { font-size: 13px; color: #555; line-height: 2; }
    
    .item { margin-bottom: 18px; }
    .item-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px; }
    .item-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
    .item-date { font-size: 11px; color: #999; }
    .item-subtitle { font-size: 13px; color: #666; margin-bottom: 5px; }
    .item-description { font-size: 12px; color: #555; line-height: 1.8; }
    
    ul { margin-left: 18px; margin-top: 5px; list-style: none; }
    li { font-size: 12px; color: #555; margin-bottom: 2px; position: relative; padding-left: 12px; }
    li:before { content: '•'; position: absolute; left: 0; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.personalInfo.name}</h1>
      <div class="tagline">${data.education.course || 'Professional'}</div>
      <div class="contact">
        ${data.personalInfo.email ? `<span>${data.personalInfo.email}</span>` : ''}
        ${data.personalInfo.phone ? `<span>${data.personalInfo.phone}</span>` : ''}
        ${data.personalInfo.city ? `<span>${data.personalInfo.city}</span>` : ''}
      </div>
    </div>

    ${data.profileSummary ? `
    <div class="section">
      <div class="section-title">About</div>
      <div class="summary">${data.profileSummary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      <div class="item">
        <div class="item-row">
          <div class="item-title">${data.education.college || ''}</div>
          <div class="item-date">${data.education.graduationYear || ''}</div>
        </div>
        <div class="item-subtitle">${data.education.level || ''} ${data.education.course ? '- ' + data.education.course : ''}</div>
        ${data.education.cgpa ? `<div class="item-description">CGPA: ${data.education.cgpa}/10</div>` : ''}
      </div>
    </div>

    ${(data.skills.technical.length > 0 || data.skills.soft.length > 0) ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-simple">
        ${data.skills.technical.length > 0 ? `<div>Technical: ${data.skills.technical.join(', ')}</div>` : ''}
        ${data.skills.soft.length > 0 ? `<div>Soft Skills: ${data.skills.soft.join(', ')}</div>` : ''}
      </div>
    </div>
    ` : ''}

    ${data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">Experience</div>
      ${data.experience.map(exp => `
        <div class="item">
          <div class="item-row">
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
      <div class="section-title">Projects</div>
      ${data.projects.map(project => `
        <div class="item">
          <div class="item-row">
            <div class="item-title">${project.name || project.title}</div>
            <div class="item-date">${project.date ? helpers.formatDate(project.date) : ''}</div>
          </div>
          ${project.technologies ? `<div class="item-subtitle">${Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}</div>` : ''}
          ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
};
