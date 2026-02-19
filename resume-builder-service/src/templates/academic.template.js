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
    body { font-family: 'Times New Roman', Times, serif; color: #222; line-height: 1.7; }
    .container { max-width: 850px; margin: 0 auto; padding: 60px; }
    
    .header { margin-bottom: 40px; text-align: center; border-bottom: 2px solid #000; 
              padding-bottom: 20px; }
    .header h1 { font-size: 32px; color: #000; margin-bottom: 8px; letter-spacing: 1px; font-weight: 700; }
    .tagline { font-size: 14px; color: #444; font-style: italic; margin-bottom: 12px; }
    .contact { font-size: 13px; color: #555; margin-top: 12px; }
    .contact span { margin: 0 15px; display: inline-block; }
    
    .section { margin-bottom: 32px; page-break-inside: avoid; }
    .section-title { font-weight: 700; font-size: 17px; color: #000; 
                     margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; 
                     border-bottom: 1px solid #333; padding-bottom: 5px; }
    
    .item { margin-bottom: 18px; }
    .item-title { font-weight: 700; font-size: 15px; color: #000; margin-bottom: 4px; }
    .item-subtitle { font-style: italic; color: #444; font-size: 14px; margin-bottom: 6px; }
    .item-date { color: #666; font-size: 12px; margin-bottom: 8px; }
    .item-description { font-size: 13px; color: #333; line-height: 1.8; text-align: justify; }
    
    .research-item { margin-bottom: 20px; padding-left: 20px; border-left: 2px solid #666; }
    
    ul { margin-left: 25px; margin-top: 6px; }
    li { font-size: 13px; color: #333; margin-bottom: 4px; line-height: 1.7; }
    
    .publications { font-size: 13px; line-height: 1.8; }
    .publication-entry { margin-bottom: 12px; text-indent: -20px; padding-left: 20px; }
    
    @media print {
      .container { padding: 40px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.personalInfo.name}</h1>
      <div class="tagline">${data.education.course || data.education.level || 'Academic'}</div>
      <div class="contact">
        ${data.personalInfo.email ? `<span>${data.personalInfo.email}</span>` : ''}
        ${data.personalInfo.phone ? `<span>${data.personalInfo.phone}</span>` : ''}
        ${data.personalInfo.city ? `<span>${data.personalInfo.city}, ${data.personalInfo.state || ''}</span>` : ''}
      </div>
    </div>

    ${data.profileSummary ? `
    <div class="section">
      <div class="section-title">Research Interests</div>
      <div class="item-description">${data.profileSummary}</div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      <div class="item">
        <div class="item-title">${data.education.institution}</div>
        <div class="item-subtitle">${data.education.course} - ${data.education.level}</div>
        ${data.education.graduationYear ? `<div class="item-date">Expected Graduation: ${data.education.graduationYear}</div>` : ''}
        ${data.education.cgpa ? `<div class="item-description">CGPA: ${data.education.cgpa}</div>` : ''}
      </div>
    </div>

    ${data.projects && data.projects.length > 0 ? `
    <div class="section">
      <div class="section-title">Research & Projects</div>
      ${data.projects.map(proj => `
        <div class="research-item">
          <div class="item-title">${proj.name || 'Research Project'}</div>
          ${proj.technologies ? `<div class="item-subtitle">Methodologies: ${proj.technologies}</div>` : ''}
          ${proj.duration ? `<div class="item-date">${proj.duration}</div>` : ''}
          ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
          ${proj.features && proj.features.length > 0 ? `
            <ul>
              ${proj.features.map(feat => `<li>${feat}</li>`).join('')}
            </ul>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    ${data.skills && data.skills.all && data.skills.all.length > 0 ? `
    <div class="section">
      <div class="section-title">Technical Skills</div>
      <div class="item-description">${data.skills.all.join(' • ')}</div>
    </div>` : ''}

    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <div class="section-title">Academic Experience</div>
      ${data.experience.map(exp => `
        <div class="item">
          <div class="item-title">${exp.position || 'Position'}</div>
          <div class="item-subtitle">${exp.company || 'Institution'}</div>
          ${exp.startDate ? `<div class="item-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>` : ''}
          ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
          ${exp.responsibilities && exp.responsibilities.length > 0 ? `
            <ul>
              ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
            </ul>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications & Awards</div>
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
