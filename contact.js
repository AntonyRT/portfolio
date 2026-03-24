const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Simple input sanitiser
function sanitise(str) {
  return String(str).replace(/[<>]/g, '').trim().slice(0, 1000);
}

function validateContact({ name, email, subject, message }) {
  const errors = [];
  if (!name || name.length < 2)        errors.push('Name must be at least 2 characters.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email required.');
  if (!subject || subject.length < 3)  errors.push('Subject is required.');
  if (!message || message.length < 10) errors.push('Message must be at least 10 characters.');
  return errors;
}

router.post('/', async (req, res) => {
  const data = {
    name:    sanitise(req.body.name    || ''),
    email:   sanitise(req.body.email   || ''),
    subject: sanitise(req.body.subject || ''),
    message: sanitise(req.body.message || ''),
  };

  const errors = validateContact(data);
  if (errors.length) return res.status(400).json({ success: false, errors });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,  // Gmail App Password
      }
    });

    // Email to Antony
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: data.email,
      subject: `[Portfolio] ${data.subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border-top:4px solid #E50914;">
          <h2 style="color:#E50914;margin-bottom:24px;">New Portfolio Message</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;color:#888;width:100px;">From</td><td style="padding:10px 0;color:#e5e5e5;font-weight:bold;">${data.name}</td></tr>
            <tr><td style="padding:10px 0;color:#888;">Email</td><td style="padding:10px 0;color:#E50914;">${data.email}</td></tr>
            <tr><td style="padding:10px 0;color:#888;">Subject</td><td style="padding:10px 0;color:#e5e5e5;">${data.subject}</td></tr>
          </table>
          <div style="background:#141414;padding:24px;margin-top:24px;border-left:3px solid #E50914;">
            <p style="color:#aaa;line-height:1.8;margin:0;">${data.message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color:#555;font-size:12px;margin-top:24px;">Sent from your portfolio contact form</p>
        </div>
      `
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"Antony Rajan" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: `Thanks for reaching out, ${data.name}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:40px;border-top:4px solid #E50914;">
          <h2 style="color:#E50914;">Hey ${data.name}!</h2>
          <p style="color:#aaa;line-height:1.8;">Thanks for getting in touch. I've received your message and will get back to you as soon as possible — usually within 24–48 hours.</p>
          <div style="background:#141414;padding:24px;margin:24px 0;border-left:3px solid #E50914;">
            <p style="color:#888;font-size:12px;margin:0 0 8px;">Your message:</p>
            <p style="color:#aaa;margin:0;">${data.message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="color:#aaa;">Cheers,<br><strong style="color:#e5e5e5;">Antony Rajan</strong><br><span style="color:#555;font-size:12px;">Software Engineering Student · RMIT Melbourne</span></p>
        </div>
      `
    });

    res.json({ success: true, message: 'Message sent! Check your inbox for a confirmation.' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send email. Please try again later.' });
  }
});

module.exports = router;
