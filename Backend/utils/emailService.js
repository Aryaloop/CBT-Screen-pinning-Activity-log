// File: utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Konfigurasi Transporter (Tukang Pos)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL, // Email Gmail kamu
    pass: process.env.SMTP_PASSWORD // App Password (16 digit)
  }
});

// Fungsi Kirim Email
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"Sistem Ujian Sekolah" <${process.env.SMTP_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log('✅ Email terkirim: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Gagal kirim email:', error);
    return false;
  }
};