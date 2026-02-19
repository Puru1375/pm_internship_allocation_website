const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class PDFService {
  
  async generatePDF(htmlContent, filename) {
    let browser;
    
    try {
      console.log(`[PDFService] Generating PDF: ${filename}`);
      console.log(`[PDFService] HTML content length: ${htmlContent.length}`);
      
      // Launch browser
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      };

      if (config.pdf.chromiumPath) {
        launchOptions.executablePath = config.pdf.chromiumPath;
      }

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Ensure storage directory exists
      await fs.mkdir(config.storage.resumePath, { recursive: true });

      // Generate PDF path
      const pdfPath = path.join(config.storage.resumePath, filename);

      // Generate PDF
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      await browser.close();

      console.log(`[PDFService] PDF generated successfully: ${pdfPath}`);

      return {
        path: pdfPath,
        filename: filename,
        url: `/resumes/${filename}`
      };

    } catch (error) {
      console.error('[PDFService] Error generating PDF:', error);
      if (browser) await browser.close();
      throw error;
    }
  }

  async deletePDF(filename) {
    try {
      const filePath = path.join(config.storage.resumePath, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }
  }

  async cleanupOldPDFs(daysOld = 7) {
    try {
      const files = await fs.readdir(config.storage.resumePath);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(config.storage.resumePath, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filePath);
          console.log(`Deleted old resume: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up PDFs:', error);
    }
  }
}

module.exports = new PDFService();