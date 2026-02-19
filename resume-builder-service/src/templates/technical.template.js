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
    body { font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
           background: #0d1117; color: #c9d1d9; line-height: 1.6; }
    .container { max-width: 950px; margin: 0 auto; padding: 45px; }
    
    .header { margin-bottom: 35px; padding: 25px; background: #161b22; 
              border-left: 4px solid #58a6ff; border-radius: 6px; }
    .header h1 { color: #58a6ff; font-size: 32px; margin-bottom: 8px; font-weight: 700; }
    .tagline { color: #8b949e; font-size: 14px; margin-bottom: 12px; font-style: italic; }
    .contact { color: #8b949e; font-size: 13px; margin-top: 12px; }
    .contact span { margin-right: 20px; display: inline-block; }
    
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { color: #58a6ff; font-size: 17px; margin-bottom: 15px; 
                     font-weight: 700; letter-spacing: 0.5px; }
    .section-title::before { content: '// '; color: #6e7681; }
    
    .code-block { background: #161b22; padding: 18px; border-radius: 8px; 
                  font-size: 13px; margin-bottom: 12px; border: 1px solid #30363d; 
                  line-height: 1.8; }
    .code-block-title { color: #7ee787; font-weight: 600; margin-bottom: 6px; font-size: 15px; }
    .code-block-subtitle { color: #ffa657; margin-bottom: 8px; font-size: 13px; }
    .code-block-date { color: #8b949e; font-size: 12px; margin-bottom: 10px; }
    .code-block-description { color: #c9d1d9; font-size: 13px; line-height: 1.7; }
    
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .skill-tag { background: #161b22; padding: 10px 14px; border-radius: 6px; 
                 text-align: center; color: #58a6ff; font-size: 12px; 
                 border: 1px solid #30363d; font-weight: 600; }
    
    ul { margin-left: 20px; margin-top: 8px; list-style-type: '> '; }
    li { color: #c9d1d9; font-size: 13px; margin-bottom: 5px; padding-left: 8px; }
    
    .comment { color: #8b949e; font-style: italic; }
    
    @media print {
      body { background: white; color: #000; }
      .container { padding: 25px; }
      .header, .code-block { background: #f6f8fa; border-color: #d0d7de; }
      .section-title, .header h1, .skill-tag { color: #0969da; }
      .code-block-title { color: #1a7f37; }
      .code-block-subtitle { color: #953800; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.personalInfo.name}</h1>
      <div class="tagline">${data.education.course || data.education.level || 'Software Developer'}</div>
      <div class="contact">
        ${data.personalInfo.email ? `<span>${data.personalInfo.email}</span>` : ''}
        ${data.personalInfo.phone ? `<span>${data.personalInfo.phone}</span>` : ''}
        ${data.personalInfo.city ? `<span>${data.personalInfo.city}, ${data.personalInfo.state || ''}</span>` : ''}
      </div>
    </div>

    ${data.profileSummary ? `
    <div class="section">
      <div class="section-title">ABOUT</div>
      <div class="code-block">
        <div class="code-block-description">${data.profileSummary}</div>
      </div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">EDUCATION</div>
      <div class="code-block">
        <div class="code-block-title">${data.education.institution}</div>
        <div class="code-block-subtitle">${data.education.course} - ${data.education.level}</div>
        ${data.education.graduationYear ? `<div class="code-block-date">Graduation: ${data.education.graduationYear}</div>` : ''}
        ${data.education.cgpa ? `<div class="code-block-description">CGPA: ${data.education.cgpa}</div>` : ''}
      </div>
    </div>

    ${data.skills && data.skills.all && data.skills.all.length > 0 ? `
    <div class="section">
      <div class="section-title">TECH STACK</div>
      <div class="skills-grid">
        ${data.skills.all.map(skill => `<div class="skill-tag">${skill}</div>`).join('')}
      </div>
    </div>` : ''}

    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">EXPERIENCE</div>
      ${data.experience.map(exp => `
        <div class="code-block">
          <div class="code-block-title">${exp.position || 'Position'}</div>
          <div class="code-block-subtitle">${exp.company || 'Company'}</div>
          ${exp.startDate ? `<div class="code-block-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>` : ''}
          ${exp.description ? `<div class="code-block-description">${exp.description}</div>` : ''}
          ${exp.responsibilities && exp.responsibilities.length > 0 ? `
            <ul>
              ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
            </ul>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    ${data.projects && data.projects.length > 0 ? `
    <div class="section">
      <div class="section-title">PROJECTS</div>
      ${data.projects.map(proj => `
        <div class="code-block">
          <div class="code-block-title">${proj.name || 'Project'}</div>
          ${proj.technologies ? `<div class="code-block-subtitle">Stack: ${proj.technologies}</div>` : ''}
          ${proj.duration ? `<div class="code-block-date">${proj.duration}</div>` : ''}
          ${proj.description ? `<div class="code-block-description">${proj.description}</div>` : ''}
          ${proj.features && proj.features.length > 0 ? `
            <ul>
              ${proj.features.map(feat => `<li>${feat}</li>`).join('')}
            </ul>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">CERTIFICATIONS</div>
      ${data.certifications.map(cert => `
        <div class="code-block">
          <div class="code-block-title">${cert.name || 'Certification'}</div>
          ${cert.issuer ? `<div class="code-block-subtitle">${cert.issuer}</div>` : ''}
          ${cert.date ? `<div class="code-block-date">${cert.date}</div>` : ''}
        </div>
      `).join('')}
    </div>` : ''}
  </div>
</body>
</html>
`;
};
