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
    body { font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; background: #fff5f5; color: #333; line-height: 1.6; }
    .container { max-width: 850px; margin: 0 auto; padding: 45px; background: white; }
    
    .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); 
              color: #fff; padding: 35px; border-radius: 12px; margin-bottom: 35px; 
              box-shadow: 0 8px 20px rgba(255,107,107,0.3); }
    .header h1 { font-size: 36px; margin-bottom: 8px; letter-spacing: 1px; font-weight: 700; }
    .tagline { font-size: 15px; opacity: 0.95; margin-bottom: 12px; font-weight: 300; font-style: italic; }
    .contact { font-size: 13px; margin-top: 12px; opacity: 0.9; }
    .contact span { margin-right: 20px; display: inline-block; }
    
    .section { margin-bottom: 32px; page-break-inside: avoid; }
    .section-title { color: #ff6b6b; font-weight: 700; font-size: 19px; 
                     border-bottom: 3px solid #ff6b6b; padding-bottom: 8px; 
                     margin-bottom: 18px; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .card { background: #fff; padding: 22px; border-radius: 10px; margin-bottom: 16px; 
            border-left: 4px solid #ff6b6b; box-shadow: 0 4px 12px rgba(0,0,0,.06); }
    .card-title { font-weight: 600; font-size: 16px; color: #333; margin-bottom: 6px; }
    .card-subtitle { color: #666; font-size: 14px; font-style: italic; margin-bottom: 8px; }
    .card-date { color: #999; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
    .card-description { color: #555; font-size: 13px; line-height: 1.8; }
    
    .skill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .skill { background: linear-gradient(135deg, #ffe3e3 0%, #ffd4d4 100%); 
             padding: 10px 14px; border-radius: 25px; font-size: 13px; 
             text-align: center; color: #ff6b6b; font-weight: 500; 
             border: 1px solid #ffcaca; transition: all 0.3s; }
    
    ul { margin-left: 20px; margin-top: 8px; }
    li { margin-bottom: 6px; color: #555; font-size: 13px; line-height: 1.7; }
    
    @media print {
      body { background: white; }
      .container { padding: 25px; }
      .header { margin: -25px -25px 25px -25px; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.personalInfo.name}</h1>
      <div class="tagline">${data.education.course || data.education.level || 'Creative Professional'}</div>
      <div class="contact">
        ${data.personalInfo.email ? `<span>✉ ${data.personalInfo.email}</span>` : ''}
        ${data.personalInfo.phone ? `<span>☏ ${data.personalInfo.phone}</span>` : ''}
        ${data.personalInfo.city ? `<span>⌂ ${data.personalInfo.city}, ${data.personalInfo.state || ''}</span>` : ''}
      </div>
    </div>

    ${data.profileSummary ? `
    <div class="section">
      <div class="section-title">About Me</div>
      <div class="card">
        <div class="card-description">${data.profileSummary}</div>
      </div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      <div class="card">
        <div class="card-title">${data.education.institution}</div>
        <div class="card-subtitle">${data.education.course} - ${data.education.level}</div>
        ${data.education.graduationYear ? `<div class="card-date">Class of ${data.education.graduationYear}</div>` : ''}
        ${data.education.cgpa ? `<div class="card-description">CGPA: ${data.education.cgpa}</div>` : ''}
      </div>
    </div>

    ${data.skills && data.skills.all && data.skills.all.length > 0 ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skill-grid">
        ${data.skills.all.map(skill => `<div class="skill">${skill}</div>`).join('')}
      </div>
    </div>` : ''}

    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">Experience</div>
      ${data.experience.map(exp => `
        <div class="card">
          <div class="card-title">${exp.position || 'Position'}</div>
          <div class="card-subtitle">${exp.company || 'Company'}</div>
          ${exp.startDate ? `<div class="card-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>` : ''}
          ${exp.description ? `<div class="card-description">${exp.description}</div>` : ''}
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
        <div class="card">
          <div class="card-title">${proj.name || 'Project'}</div>
          ${proj.technologies ? `<div class="card-subtitle">Technologies: ${proj.technologies}</div>` : ''}
          ${proj.duration ? `<div class="card-date">${proj.duration}</div>` : ''}
          ${proj.description ? `<div class="card-description">${proj.description}</div>` : ''}
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
        <div class="card">
          <div class="card-title">${cert.name || 'Certification'}</div>
          ${cert.issuer ? `<div class="card-subtitle">${cert.issuer}</div>` : ''}
          ${cert.date ? `<div class="card-date">${cert.date}</div>` : ''}
        </div>
      `).join('')}
    </div>` : ''}
  </div>
</body>
</html>
`;
};
