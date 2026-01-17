const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Email configuration
const emailConfig = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_APP_PASSWORD || "your-app-password", // Use App Password, not regular password
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Generate random password
function generateRandomPassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
}

// Email template for new volunteer
function createWelcomeEmailTemplate(volunteerData, password) {
  return {
    subject: "Selamat Datang di GSJS Tunjungan Plaza - Akun Anda Telah Dibuat",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3f8cff, #8c5eff); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #3f8cff; margin: 20px 0; }
          .button { display: inline-block; background: #3f8cff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Selamat Datang!</h1>
            <p>Akun Semi Volunteer Anda telah berhasil dibuat</p>
          </div>
          
          <div class="content">
            <h2>Halo ${volunteerData.nama}!</h2>
            <p>Selamat bergabung dengan tim <strong>GSJS Tunjungan Plaza</strong> sebagai <strong>${volunteerData.role}</strong> di divisi <strong>${volunteerData.divisi}</strong>.</p>
            
            <div class="credentials">
              <h3>📧 Informasi Login Anda:</h3>
              <p><strong>Email:</strong> ${volunteerData.email}</p>
              <p><strong>Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${password}</code></p>
              <p><strong>Posisi:</strong> ${volunteerData.posisi}</p>
            </div>
            
            <div class="warning">
              <h4>⚠️ Penting untuk Keamanan:</h4>
              <ul>
                <li>Segera login dan ubah password Anda</li>
                <li>Jangan bagikan password ini kepada siapa pun</li>
                <li>Simpan informasi login ini di tempat yang aman</li>
              </ul>
            </div>
            
            <p>Anda dapat login ke sistem menggunakan kredensial di atas. Setelah login pertama kali, kami sangat menyarankan untuk mengganti password Anda dengan yang lebih mudah diingat.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" class="button">
                🚀 Login Sekarang
              </a>
            </div>
            
            <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan, jangan ragu untuk menghubungi tim IT atau administrator sistem.</p>
            
            <p>Terima kasih telah bergabung dengan kami!</p>
          </div>
          
          <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem GSJS Tunjungan Plaza</p>
            <p>© ${new Date().getFullYear()} GSJS Tunjungan Plaza. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Selamat Datang di GSJS Tunjungan Plaza!
      
      Halo ${volunteerData.nama},
      
      Akun Semi Volunteer Anda telah berhasil dibuat dengan detail berikut:
      
      Email: ${volunteerData.email}
      Password: ${password}
      Role: ${volunteerData.role}
      Divisi: ${volunteerData.divisi}
      Posisi: ${volunteerData.posisi}
      
      PENTING: Segera login dan ubah password Anda untuk keamanan.
      
      Terima kasih telah bergabung dengan tim kami!
      
      GSJS Tunjungan Plaza
    `,
  };
}

// Send welcome email to new volunteer
async function sendWelcomeEmail(volunteerData, password) {
  try {
    const emailTemplate = createWelcomeEmailTemplate(volunteerData, password);

    const mailOptions = {
      from: {
        name: "GSJS Tunjungan Plaza",
        address: process.env.EMAIL_USER || "your-email@gmail.com",
      },
      to: volunteerData.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };

    console.log(`📧 Sending welcome email to: ${volunteerData.email}`);
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: "Email berhasil dikirim",
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return {
      success: false,
      error: error.message,
      message: "Gagal mengirim email",
    };
  }
}

// Test email connection
async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email server connection verified");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
}

module.exports = {
  generateRandomPassword,
  sendWelcomeEmail,
  testEmailConnection,
};
