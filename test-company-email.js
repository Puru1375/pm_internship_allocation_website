const pool = require('./pm-internship-backend/config/db');
const { sendEmail } = require('./pm-internship-backend/utils/emailService');

async function testCompanyProfileEmail() {
  console.log('\n🧪 Testing Company Profile Update Email Notification...\n');
  
  try {
    // 1. Check admin users in database
    console.log('📋 Step 1: Checking admin users in database...');
    const adminUsersResult = await pool.query(
      'SELECT id, email, role FROM users WHERE role = $1',
      ['admin']
    );
    
    if (adminUsersResult.rows.length === 0) {
      console.error('❌ No admin users found in database!');
      console.log('\n💡 To fix this, run:');
      console.log("UPDATE users SET email = 'viyomjagtap2@gmail.com' WHERE role = 'admin';");
      process.exit(1);
    }
    
    console.log(`✅ Found ${adminUsersResult.rows.length} admin user(s):`);
    adminUsersResult.rows.forEach(admin => {
      console.log(`   - ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}`);
    });
    
    // 2. Test email content
    console.log('\n📧 Step 2: Preparing test email...');
    const testCompanyName = 'Test Company Ltd.';
    const testCompanyEmail = 'testcompany@example.com';
    const testTimestamp = new Date().toLocaleString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    const adminEmailContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8fafc;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📝 Company Profile Updated</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.95;">Admin Notification - TEST</p>
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 40px 30px;">
          <p style="margin: 0 0 25px 0; color: #334155; font-size: 15px; line-height: 1.8;">
            Hello Admin,
          </p>

          <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px; line-height: 1.8;">
            A company has updated their profile on the SkillBridge platform. Please review the details below:
          </p>

          <!-- Company Details Box -->
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 8px; padding: 25px; margin: 30px 0;">
            <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 16px; font-weight: bold;">🏢 Company Details</h3>
            
            <div style="margin-bottom: 15px;">
              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Company Name</p>
              <p style="margin: 0; color: #3b82f6; font-size: 16px; font-weight: bold;">${testCompanyName}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Company Email</p>
              <p style="margin: 0; color: #3b82f6; font-size: 15px;">${testCompanyEmail}</p>
            </div>

            <div style="margin-bottom: 0;">
              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Update Timestamp</p>
              <p style="margin: 0; color: #3b82f6; font-size: 15px; font-weight: 500;">${testTimestamp}</p>
            </div>
          </div>

          <!-- Action Required -->
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 25px 0;">
            <h4 style="margin: 0 0 12px 0; color: #0c4a6e; font-size: 14px; font-weight: bold;">📌 Action Required</h4>
            <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.8;">
              Please review the company's updated profile to ensure all information is accurate and compliant with platform guidelines. 
              You can access the full profile details in the admin dashboard.
            </p>
          </div>

          <p style="margin: 20px 0 0 0; color: #334155; font-size: 15px; line-height: 1.8;">
            Best regards,<br>
            <strong>SkillBridge Admin System</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 25px 30px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
            © 2025 SkillBridge. All rights reserved.<br>
            This is an automated admin notification - TEST EMAIL.
          </p>
        </div>

      </div>
    `;
    
    // 3. Send test emails to all admin users
    console.log('\n📤 Step 3: Sending test emails to admin users...\n');
    let emailsSent = 0;
    let emailsFailed = 0;
    
    for (const adminUser of adminUsersResult.rows) {
      try {
        console.log(`   Sending to: ${adminUser.email}...`);
        await sendEmail(
          adminUser.email, 
          `[TEST] Company Profile Update: ${testCompanyName}`, 
          adminEmailContent
        );
        emailsSent++;
        console.log(`   ✅ Email sent successfully to: ${adminUser.email}`);
      } catch (emailErr) {
        emailsFailed++;
        console.error(`   ❌ Failed to send to ${adminUser.email}: ${emailErr.message}`);
      }
    }
    
    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Admin Users: ${adminUsersResult.rows.length}`);
    console.log(`Emails Sent Successfully: ${emailsSent}`);
    console.log(`Emails Failed: ${emailsFailed}`);
    console.log('='.repeat(60));
    
    if (emailsSent > 0) {
      console.log('\n✅ SUCCESS! Check your inbox at:');
      adminUsersResult.rows.forEach(admin => {
        console.log(`   📧 ${admin.email}`);
      });
      console.log('\n💡 Note: Email may take a few seconds to arrive. Check spam folder if not received.');
    } else {
      console.log('\n❌ No emails were sent successfully. Check the error messages above.');
    }
    
  } catch (err) {
    console.error('\n❌ Test failed with error:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the test
testCompanyProfileEmail();
