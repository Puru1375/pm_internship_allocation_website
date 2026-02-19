const resumeService = require('../services/resume.service');
const pdfService = require('../services/pdf.service');
const templateService = require('../services/template.service');
const helpers = require('../utils/helpers');

class ResumeController {

  async getResumeData(req, res, next) {
    try {
      const { internId } = req.params;
      // No auth check - frontend handles auth before calling
      const data = await resumeService.formatResumeData(internId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async previewResume(req, res, next) {
    try {
      const { internId, templateId } = req.params;
      // No auth check - frontend handles auth before calling
      const resumeData = await resumeService.formatResumeData(internId, req.body);
      const html = templateService.generateHTML(+templateId, resumeData);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }

  async downloadResume(req, res, next) {
    try {
      const { internId, templateId } = req.params;
      // No auth check - frontend handles auth before calling
      
      console.log(`[downloadResume] Generating resume for intern ${internId}, template ${templateId}`);
      
      const resumeData = await resumeService.formatResumeData(internId, req.body);
      console.log(`[downloadResume] Resume data fetched:`, resumeData);
      
      const html = templateService.generateHTML(+templateId, resumeData);
      console.log(`[downloadResume] HTML generated, length: ${html.length}`);
      
      const template = await resumeService.getTemplateById(templateId);
      const filename = helpers.generateFilename(
        resumeData.personalInfo.name,
        template?.name
      );

      console.log(`[downloadResume] Generating PDF with filename: ${filename}`);
      const pdf = await pdfService.generatePDF(html, filename);

      await resumeService.trackDownload(internId, templateId, filename);

      res.json({
        success: true,
        message: 'Resume generated',
        data: {
          filename: pdf.filename,
          url: pdf.url,
          downloadUrl: `/api/resumes/download/${pdf.filename}`
        }
      });
    } catch (error) {
      console.error('[downloadResume] Error:', error);
      next(error);
    }
  }

  async servePDF(req, res, next) {
    try {
      const path = require('path');
      const config = require('../config/config');

      const filePath = path.join(config.storage.resumePath, req.params.filename);
      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }

  async saveDraft(req, res, next) {
    try {
      const { internId, templateId } = req.params;

      const draft = await resumeService.saveDraft(
        internId,
        templateId,
        req.body
      );

      res.json({ success: true, data: draft });
    } catch (error) {
      next(error);
    }
  }

  async getDraft(req, res, next) {
    try {
      const { internId, templateId } = req.params;

      const draft = await resumeService.getDraft(internId, templateId);
      res.json({ success: true, data: draft });
    } catch (error) {
      next(error);
    }
  }

  async getDownloadHistory(req, res, next) {
    try {
      const { internId } = req.params;

      const history = await resumeService.getDownloadHistory(internId);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req, res, next) {
    try {
      const templates = await resumeService.getTemplates();
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  async getTemplatePreview(req, res, next) {
    try {
      const { templateId } = req.params;

      const html = templateService.generateHTML(+templateId, {
        personalInfo: { name: 'John Doe', email: 'john@example.com', city: 'Mumbai' },
        profileSummary: 'Sample resume preview',
        education: {},
        skills: { technical: ['JS', 'Node'], soft: ['Communication'], all: [] },
        experience: [],
        projects: []
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResumeController();
