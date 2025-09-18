const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Email transporter oluştur - DÜZELTME
const transporter = nodemailer.createTransport({  // createTransporter değil, createTransport
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Contact form endpoint
router.post('/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // 1. Send to your email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'sengozyusuf91@gmail.com',
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <h2>New Contact Form Message</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>This message was sent from your portfolio website.</em></p>
      `
    };

    // 2. Send auto-reply
    const autoReplyOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Message Received - Yusuf Şengöz',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">Yusuf Şengöz</h1>
            <p style="color: #7f8c8d; margin: 5px 0;">Full Stack Developer</p>
          </div>
          
          <h2 style="color: #34495e;">Dear ${firstName},</h2>
          
          <p>Thank you for reaching out through my portfolio website. I have received your message and appreciate you taking the time to contact me.</p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Message:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-radius: 4px; margin: 10px 0;">${message}</p>
          </div>
          
          <p>I will review your message carefully and respond to you <strong>as soon as possible</strong>. I typically respond within 24 hours during business days.</p>
          
          <p>If your inquiry is urgent, please don't hesitate to reach out to me directly.</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Best regards,</h3>
            <p style="margin: 0;"><strong>Yusuf Şengöz</strong><br>
            Full Stack Developer<br>
            <a href="mailto:sengozyusuf91@gmail.com" style="color: #3498db;">sengozyusuf91@gmail.com</a></p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #bdc3c7;">
          <p style="font-size: 12px; color: #95a5a6; text-align: center;">
            This is an automated response. Please do not reply to this email.
          </p>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(mailOptions),
      transporter.sendMail(autoReplyOptions)
    ]);
    
    res.json({
      success: true,
      message: 'Your message has been sent successfully! I will respond as soon as possible.'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again later.'
    });
  }
});

module.exports = router;
