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
    body { font-family: 'Georgia', serif; color: #2c3e50; line-height: 1.7; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; padding: 50px; }
    
    .header { text-align: center; border-bottom: 3px double #2c3e50; 
              padding-bottom: 25px; margin-bottom: 35px; }
    .header h1 { font-size: 34px; color: #2c3e50; margin-bottom: 8px; letter-spacing: 2px; 
                 font-weight: 400; text-transform: uppercase; }
    .header .tagline { font-size: 15px; color: #666; font-style: italic; margin-bottom: 12px; }
    .header .contact { font-size: 13px; color: #555; margin-top: 12px; }
    .header .contact span { margin: 0 15px; display: inline-block; }
    
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { font-size: 18px; font-weight: bold; color: #2c3e50; 
                     text-transform: uppercase; letter-spacing: 2px; 
                     margin-bottom: 18px; border-bottom: 2px solid #ddd; 
                     padding-bottom: 8px; }
    
    .summary { font-size: 14px; color: #444; text-align: justify; line-height: 1.9; 
               font-style: italic; }
    
    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
    .skill-category { margin-bottom: 15px; }
    .skill-category-title { font-weight: bold; color: #2c3e50; margin-bottom: 8px; 
                           font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .skill-list { font-size: 13px; color: #555; line-height: 1.8; }
    
    .timeline-item { margin-bottom: 22px; padding-left: 25px; border-left: 3px solid #2c3e50; }
    .item-header { margin-bottom: 8px; }
    .item-title { font-weight: bold; font-size: 16px; color: #2c3e50; }
    .item-organization { font-style: italic; color: #666; font-size: 14px; margin-top: 4px; }
    .item-date { color: #888; font-size: 12px; margin-top: 4px; font-weight: 600; }
    .item-description { font-size: 13px; color: #555; margin-top: 10px; line-height: 1.8; }
    
    ul { margin-left: 20px; margin-top: 8px; }
    li { font-size: 13px; color: #555; margin-bottom: 5px; line-height: 1.7; }
    
    @media print {
      .container { padding: 30px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.personalInfo.name}</h1>
      <div class="tagline">${data.education.course || data.education.level || 'Professional'}</div>
      <div class="contact">
        ${data.personalInfo.email ? `<span>${data.personalInfo.email}</span>` : ''}
        ${data.personalInfo.phone ? `<span>${data.personalInfo.phone}</span>` : ''}
        ${data.personalInfo.city ? `<span>${data.personalInfo.city}, ${data.personalInfo.state}</span>` : ''}
      </div>
    </div>

    ${data.profileSummary ? `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${data.profileSummary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      <div class="timeline-item">
        <div class="item-header">
          <div class="item-title">${data.education.level || 'Bachelor\'s Degree'}</div>
          <div class="item-organization">${data.education.college || ''}</div>
          <div class="item-date">${data.education.graduationYear || ''}</div>
        </div>
        ${data.education.course ? `<div class="item-description">Specialization: ${data.education.course}</div>` : ''}
        ${data.education.cgpa ? `<div class="item-description">CGPA: ${data.education.cgpa}/10</div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Skills</div>
      <div class="two-column">
        ${data.skills.technical.length > 0 ? `
        <div class="skill-category">
          <div class="skill-category-title">Technical Skills</div>
          <div class="skill-list">${data.skills.technical.join(' • ')}</div>
        </div>
        ` : ''}
        ${data.skills.soft.length > 0 ? `
        <div class="skill-category">
          <div class="skill-category-title">Soft Skills</div>
          <div class="skill-list">${data.skills.soft.join(' • ')}</div>
        </div>
        ` : ''}
      </div>
    </div>

    ${data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">Professional Experience</div>
      ${data.experience.map(exp => `
        <div class="timeline-item">
          <div class="item-header">
            <div class="item-title">${exp.position || exp.title}</div>
            <div class="item-organization">${exp.company}</div>
            <div class="item-date">${helpers.formatDateRange(exp.startDate || exp.start_date, exp.endDate || exp.end_date)}</div>
          </div>
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
        <div class="timeline-item">
          <div class="item-header">
            <div class="item-title">${project.name || project.title}</div>
            <div class="item-date">${project.date ? helpers.formatDate(project.date) : ''}</div>
          </div>
          ${project.technologies ? `<div class="item-description">Technologies: ${Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}</div>` : ''}
          ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
};
