// Template service - maps template IDs to template generators
class TemplateService {
  constructor() {
    // Import all template generators
    this.templates = {
      1: require('../templates/modern.template.js'),
      2: require('../templates/classic.template.js'),
      3: require('../templates/creative.template.js'),
      4: require('../templates/minimalist.template.js'),
      5: require('../templates/elegant.template.js'),
      6: require('../templates/technical.template.js'),
      7: require('../templates/executive.template.js'),
      8: require('../templates/academic.template.js'),
      9: require('../templates/colorful.template.js'),
      10: require('../templates/professional.template.js'),
    };
  }

  /**
   * Generate HTML for a resume using a specific template
   * @param {number} templateId - The template ID
   * @param {object} data - Resume data object
   * @returns {string} - HTML string
   */
  generateHTML(templateId, data) {
    const template = this.templates[templateId];
    
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    // Template is a function that takes data and returns HTML
    if (typeof template === 'function') {
      return template(data);
    } else {
      throw new Error(`Template ${templateId} is not a valid generator function`);
    }
  }

  /**
   * List all available template IDs
   */
  getTemplateIds() {
    return Object.keys(this.templates).map(Number);
  }
}

module.exports = new TemplateService();
