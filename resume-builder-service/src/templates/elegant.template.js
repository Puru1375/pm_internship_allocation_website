const helpers = require('../utils/helpers');

module.exports = (data) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - ${data.personalInfo.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', 'Garamond', serif; color: #34495e; line-height: 1.7; background: #f9f9f9; }
    .container { max-width: 800px; margin: 0 auto; padding: 55px; background: white; box-shadow: 0 0 25px rgba(0,0,0,0.08); }
    
    .header { text-align: center; margin-bottom: 45px; padding-bottom: 25px; 
              border-bottom: 1px solid #e0e0e0; }
    .header h1 { font-size: 38px; color: #2c3e50; margin-bottom: 8px; letter-spacing: 2px; font-weight: 400; }
    .tagline { font-size: 15px; color: #7f8c8d; font-style: italic; margin-bottom: 15px; }
    .contact { font-size: 13px; color: #7f8c8d; margin-top: 15px; }
    .contact span { margin: 0 12px; display: inline-block; }
    
    .section { margin-bottom: 35px; page-break-inside: avoid; }
    .section-title { font-size: 18px; text-transform: uppercase; letter-spacing: 3px; 
                     margin-bottom: 18px; padding-bottom: 8px; color: #2c3e50; 
                     border-bottom: 2px solid #bdc3c7; font-weight: 600; }
    
    .summary { font-size: 14px; color: #555; text-align: justify; line-height: 1.9; font-style: italic; }
    
    .item { margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px dotted #ddd; }
    .item:last-child { border-bottom: none; }
    .item-title { font-weight: 600; font-size: 16px; color: #2c3e50; margin-bottom: 5px; }
    .item-subtitle { color: #7f8c8d; font-size: 14px; font-style: italic; margin-bottom: 6px; }
    .item-date { color: #95a5a6; font-size: 12px; margin-bottom: 10px; font-weight: 600; }
    .item-description { font-size: 13px; color: #555; line-height: 1.8; margin-top: 8px; }
    
    .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .skill-item { background: #ecf0f1; padding: 10px; text-align: center; 
                  font-size: 13px; color: #34495e; border-radius: 4px; font-weight: 500; }
    
    ul { margin-left: 20px; margin-top: 8px; }
    li { font-size: 13px; color: #555; margin-bottom: 5px; line-height: 1.7; }
    
    @media print {
      body { background: white; }
      .container { padding: 30px; box-shadow: none; }
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
        ${data.personalInfo.city ? `<span>${data.personalInfo.city}, ${data.personalInfo.state || ''}</span>` : ''}
      </div>
    </div>

    ${data.profileSummary ? `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${data.profileSummary}</div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      <div class="item">
        <div class="item-title">${data.education.institution}</div>
        <div class="item-subtitle">${data.education.course} - ${data.education.level}</div>
        ${data.education.graduationYear ? `<div class="item-date">Class of ${data.education.graduationYear}</div>` : ''}
        ${data.education.cgpa ? `<div class="item-description">CGPA: ${data.education.cgpa}</div>` : ''}
      </div>
    </div>

    ${data.skills && data.skills.all && data.skills.all.length > 0 ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-grid">
        ${data.skills.all.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
      </div>
    </div>` : ''}

    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">Experience</div>
      ${data.experience.map(exp => `
        <div class="item">
          <div class="item-title">${exp.position || 'Position'}</div>
          <div class="item-subtitle">${exp.company || 'Company'}</div>
          ${exp.startDate ? `<div class="item-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>` : ''}
          ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
          ${exp.responsibilities && exp.responsibilities.length > 0 ? `
            <ul>
              ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
            </ul>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    ${data.projects && data.projects.length > 0 ? `
    <div class="section">
      <div class="section-title">Projects</div>
      ${data.projects.map(proj => `
        <div class="item">
          <div class="item-title">${proj.name || 'Project'}</div>
          ${proj.technologies ? `<div class="item-subtitle">Technologies: ${proj.technologies}</div>` : ''}
          ${proj.duration ? `<div class="item-date">${proj.duration}</div>` : ''}
          ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
          ${proj.features && proj.features.length > 0 ? `
            <ul>
              ${proj.features.map(feat => `<li>${feat}</li>`).join('')}
            </ul>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      ${data.certifications.map(cert => `
        <div class="item">
          <div class="item-title">${cert.name || 'Certification'}</div>
          ${cert.issuer ? `<div class="item-subtitle">${cert.issuer}</div>` : ''}
          ${cert.date ? `<div class="item-date">${cert.date}</div>` : ''}
        </div>
      `).join('')}
    </div>` : ''}
  </div>
</body>
</html>
`;
};
