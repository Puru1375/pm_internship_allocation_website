const templateService = require('../services/template.service');

class TemplateController {

  // Get all available templates
  async getAllTemplates(req, res, next) {
    try {
      const templates = templateService.getAllTemplates();
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single template info
  async getTemplateById(req, res, next) {
    try {
      const { templateId } = req.params;
      const template = templateService.getTemplate(parseInt(templateId));

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: parseInt(templateId),
          name: template.name
        }
      });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new TemplateController();
