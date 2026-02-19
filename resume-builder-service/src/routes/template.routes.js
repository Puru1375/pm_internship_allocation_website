const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');

// Get all templates
router.get('/', templateController.getAllTemplates);

// Get template by ID
router.get('/:templateId', templateController.getTemplateById);

module.exports = router;
