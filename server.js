require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const contactRoute = require('./contact');
const githubRoute  = require('./github');
const adminRoute   = require('./admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve the frontend — looks for index.html in the same folder
app.use(express.static(__dirname));

const generalLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: 'Too many requests.' } });
const contactLimiter = rateLimit({ windowMs: 60*60*1000, max: 5, message: { error: 'Too many contact submissions. Try again in an hour.' } });
app.use('/api/', generalLimiter);
app.use('/api/contact', contactLimiter);

app.use('/api/contact', contactRoute);
app.use('/api/github',  githubRoute);
app.use('/api/admin',   adminRoute);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Server error.' }); });

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Open this in your browser ↑\n`);
});
