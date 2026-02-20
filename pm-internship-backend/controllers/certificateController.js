const pool = require('../config/db');
const crypto = require('crypto');
const PDFDocument = require('pdfkit'); 
const QRCode = require('qrcode');
// const { sendEmailWithAttachment } = require('../utils/emailService');  // ✅ COMMENTED OUT - Email service disabled



// =========================
// GET CERTIFICATES
// =========================
exports.getCertificates = async (req, res) => {
  try {
    let query = `
      SELECT 
        c.id, 
        c.certificate_hash, 
        c.pdf_url, 
        c.issued_at, 
        c.is_valid,
        i.name as intern_name, 
        comp.company_name, 
        j.title as internship_title
      FROM certificates c
      JOIN intern_profiles i ON c.intern_id = i.id
      JOIN company_profiles comp ON c.company_id = comp.id
      JOIN jobs j ON c.job_id = j.id
    `;

    const values = [];

    if (req.user.role === 'intern') {
      const intern = await pool.query('SELECT id FROM intern_profiles WHERE user_id = $1', [req.user.id]);
      if (intern.rows.length > 0) {
        query += ` WHERE c.intern_id = $1`;
        values.push(intern.rows[0].id);
      } else return res.json([]);
    } 
    else if (req.user.role === 'company') {
      const company = await pool.query('SELECT id FROM company_profiles WHERE user_id = $1', [req.user.id]);
      if (company.rows.length > 0) {
        query += ` WHERE c.company_id = $1`;
        values.push(company.rows[0].id);
      } else return res.json([]);
    }

    query += ` ORDER BY c.issued_at DESC`;

    const certificates = await pool.query(query, values);
    res.json(certificates.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


// =========================
// GET CERTIFICATE BY ID
// =========================
exports.getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await pool.query(`
      SELECT 
        c.*,
        i.name as intern_name, 
        comp.company_name, 
        j.title as internship_title,
        j.id as internship_id
      FROM certificates c
      JOIN intern_profiles i ON c.intern_id = i.id
      JOIN company_profiles comp ON c.company_id = comp.id
      JOIN jobs j ON c.job_id = j.id
      WHERE c.id = $1
    `, [id]);

    if (certificate.rows.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


// =========================
// REVALIDATE CERTIFICATE
// =========================
exports.revalidateCertificate = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedCert = await pool.query(
      `UPDATE certificates 
       SET is_valid = TRUE 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (updatedCert.rows.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate revalidated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


// =========================
// REVOKE CERTIFICATE
// =========================
exports.revokeCertificate = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedCert = await pool.query(
      `UPDATE certificates 
       SET is_valid = FALSE 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (updatedCert.rows.length === 0) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate revoked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


// =========================
// ISSUE CERTIFICATE
// =========================
exports.issueCertificate = async (req, res) => {
  const { internId, internshipId, companyId } = req.body;

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const rawData = `${internId}-${internshipId}-${companyId}-${Date.now()}`;
    const certificateHash = crypto.createHash("sha256").update(rawData).digest("hex");

    const pdfUrl = `http://localhost:5000/api/certificates/download/${certificateHash}`;

    const newCert = await pool.query(
      `INSERT INTO certificates (intern_id, company_id, job_id, certificate_hash, pdf_url, is_valid)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [internId, companyId, internshipId, certificateHash, pdfUrl]
    );

    return res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      certificate: newCert.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
};


// =========================
// DOWNLOAD CERTIFICATE (with secure digital signature)
// =========================
exports.downloadCertificate = async (req, res) => {
  try {
    const { hash } = req.params;

    const query = `
      SELECT 
        c.id AS certificate_id,
        c.intern_id,
        c.company_id,
        c.job_id,
        c.certificate_hash,
        c.issued_at,
        c.is_valid,
        i.name AS intern_name,
        comp.company_name,
        j.title AS job_title
      FROM certificates c
      JOIN intern_profiles i ON c.intern_id = i.id
      JOIN company_profiles comp ON c.company_id = comp.id
      JOIN jobs j ON c.job_id = j.id
      WHERE c.certificate_hash = $1
    `;

    const result = await pool.query(query, [hash]);
    if (result.rows.length === 0) {
      return res.status(404).send("Certificate not found.");
    }

    const cert = result.rows[0];

    const signatureInput = [
      cert.certificate_id,
      cert.intern_id,
      cert.company_id,
      cert.job_id,
      cert.certificate_hash,
      cert.issued_at.toISOString(),
      cert.intern_name,
      cert.company_name,
      cert.job_title
    ].join("|");

    const digitalSignature = crypto.createHash("sha256").update(signatureInput).digest("hex");

    const doc = new PDFDocument({ 
      layout: "landscape", 
      size: "A4",
      margin: 0,
      bufferPages: true
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=certificate-${cert.intern_name}.pdf`);

    doc.pipe(res);

    // Background gradient and border
    const bg = doc.linearGradient(0, 0, doc.page.width, doc.page.height);
    bg.stop(0, '#eef2ff');
    bg.stop(1, '#dbeafe');
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(bg);

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(2).stroke('#0A3E91');

    // Title (y: 50)
    doc.fontSize(32).fillColor("black").text("CERTIFICATE OF COMPLETION", 40, 50, { 
      align: "center", 
      underline: true,
      width: doc.page.width - 80,
      lineBreak: false
    });
    
    // Body text (y: 110)
    doc.fontSize(18).fillColor("black").text("This is to certify that", 40, 110, { 
      align: "center",
      width: doc.page.width - 80,
      lineBreak: false
    });
    
    // Intern name (y: 145)
    doc.fontSize(36).fillColor("#0A3E91").text(cert.intern_name, 40, 145, { 
      align: "center",
      width: doc.page.width - 80,
      lineBreak: false
    });

    // Description (y: 195)
    doc.fontSize(14).fillColor("black").text("has successfully completed the internship for", 40, 195, { 
      align: "center",
      width: doc.page.width - 80,
      lineBreak: false
    });
    
    // Job title (y: 225)
    doc.fontSize(24).fillColor("black").text(cert.job_title, 40, 225, { 
      align: "center",
      width: doc.page.width - 80,
      lineBreak: false
    });
    doc.fontSize(18).fillColor("black").text(`at ${cert.company_name}`, 40, 260, { 
      align: "center",
      width: doc.page.width - 80,
      lineBreak: false
    });

    // Issue details (y: 300)
    doc.fontSize(11).fillColor("black").text(`Issued on: ${new Date(cert.issued_at).toLocaleDateString()}`, 40, 300, { 
      align: "center",
      width: doc.page.width - 80,
      lineBreak: false
    });
    doc.fontSize(9).fillColor("gray").text(`Certificate ID: ${cert.certificate_hash.substring(0, 32)}...`, 40, 318, { 
      align: "center",
      width: doc.page.width - 80,
      lineBreak: false
    });

    // Signature Section (y: 370)
    const signatureY = 370;
    const centerX = doc.page.width / 2;

  
    doc.fontSize(11).fillColor("black").text("PM Internship Authority", centerX - 75, signatureY + 20, { 
      width: 150, 
      align: "center",
      lineBreak: false
    });
    doc.fontSize(9).fillColor("gray").text("Authorized Signatory", centerX - 75, signatureY + 35, { 
      width: 150, 
      align: "center",
      lineBreak: false
    });



// 4. Generate QR Code (contains secure verification link)
const verifyURL = `http://localhost:5000/api/certificates/verify/${cert.certificate_hash}`;
const qrDataURL = await QRCode.toDataURL(verifyURL);

// Draw QR Code on PDF (center)
const qrSize = 100;
const qrX = (doc.page.width - qrSize) / 2;
const qrY = 420;

doc.image(qrDataURL, qrX, qrY, {
  fit: [qrSize, qrSize],
});

doc.fontSize(8).fillColor("gray")
  .text("Scan to verify", qrX - 20, qrY + qrSize + 5, {
    width: qrSize + 40,
    align: "center",
    lineBreak: false
  });

    doc.end();

  } catch (err) {
    console.error("Certificate generation error:", err);
    res.status(500).send("Error generating certificate.");
  }
};
// =========================
// VERIFY CERTIFICATE (QR SCAN)
// =========================
exports.verifyCertificate = async (req, res) => {
  try {
    const { hash } = req.params;

    const query = `
      SELECT 
        c.*, 
        i.name AS intern_name, 
        comp.company_name, 
        j.title AS job_title
      FROM certificates c
      JOIN intern_profiles i ON c.intern_id = i.id
      JOIN company_profiles comp ON c.company_id = comp.id
      JOIN jobs j ON c.job_id = j.id
      WHERE c.certificate_hash = $1
    `;

    const result = await pool.query(query, [hash]);
    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, message: "Certificate not found" });
    }

    const cert = result.rows[0];

    // Rebuild signature
    const signatureInput = [
      cert.id,
      cert.intern_id,
      cert.company_id,
      cert.job_id,
      cert.certificate_hash,
      cert.issued_at.toISOString(),
      cert.intern_name,
      cert.company_name,
      cert.job_title
    ].join("|");

    const digitalSignature = crypto.createHash("sha256").update(signatureInput).digest("hex");

    return res.json({
      valid: cert.is_valid,
      intern: cert.intern_name,
      company: cert.company_name,
      job: cert.job_title,
      issued: cert.issued_at,
      signature: digitalSignature
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ valid: false, message: "Server Error" });
  }
};

exports.sendCertificateEmail = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    // 1. Get Certificate Details
    const certResult = await pool.query(`
      SELECT c.*, i.name as intern_name, i.email as intern_email, j.title as job_title, comp.company_name
      FROM certificates c
      JOIN intern_profiles i ON c.intern_id = i.id
      JOIN jobs j ON c.job_id = j.id
      JOIN company_profiles comp ON c.company_id = comp.id
      WHERE c.id = $1
    `, [id]);

    if (certResult.rows.length === 0) return res.status(404).json({ message: 'Certificate not found' });
    const cert = certResult.rows[0];

    // 2. Generate PDF Buffer (Re-generating is safer than fetching from URL usually)
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);

        // 3. Send Email (COMMENTED OUT - Email service disabled)
        // const emailSent = await sendEmailWithAttachment(
        //     cert.intern_email,
        //     `Certificate of Completion - ${cert.job_title}`,
        //     `Dear ${cert.intern_name},\n\nCongratulations on successfully completing your internship at ${cert.company_name}.\n\nPlease find your Certificate of Completion attached.\n\nBest Wishes,\nSkillBridge Team`,
        //     `Certificate-${cert.intern_name}.pdf`,
        //     pdfData
        // );

        const emailSent = true;  // Assume success when email disabled
        console.log(`📧 [EMAIL DISABLED] Would send certificate to: ${cert.intern_email}`);

        if(emailSent) res.json({ success: true, message: 'Certificate generated successfully' });
        else res.status(500).json({ message: 'Failed to generate certificate' });
    });

    // --- PDF Content (Same logic as downloadCertificate, with QR verify link) ---
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    doc.fontSize(30).text('CERTIFICATE OF COMPLETION', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(20).text('This is to certify that', { align: 'center' });
    doc.moveDown();
    doc.fontSize(35).fillColor('#1A4C8F').text(cert.intern_name, { align: 'center' });
    doc.fillColor('black');
    doc.moveDown();
    doc.fontSize(15).text('Has successfully completed the internship program for', { align: 'center' });
    doc.moveDown();
    doc.fontSize(25).text(cert.job_title, { align: 'center' });
    doc.fontSize(20).text(`at ${cert.company_name}`, { align: 'center' });

    // QR code pointing to verification endpoint
    const verifyURL = `http://localhost:5000/api/certificates/verify/${cert.certificate_hash}`;
    const qrDataURL = await QRCode.toDataURL(verifyURL);
    const qrSize = 120;
    const qrX = (doc.page.width - qrSize) / 2;
    const qrY = doc.y + 30;
    doc.image(qrDataURL, qrX, qrY, { fit: [qrSize, qrSize] });
    doc.moveDown();
    doc.fontSize(10).fillColor('gray').text('Scan to verify', qrX - 10, qrY + qrSize + 5, {
      width: qrSize + 20,
      align: 'center',
      lineBreak: false
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};