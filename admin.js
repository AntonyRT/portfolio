const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/content.json');

// ─── Auth Middleware ─────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readContent() {
  if (!fs.existsSync(DATA_FILE)) return getDefaultContent();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeContent(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getDefaultContent() {
  return {
    hero: {
      badge: "Available for Internships & Graduate Roles",
      headline1: "Antony",
      headline2: "Rajan",
      subtitle: "Software Engineering Student · RMIT University",
      description: "Building scalable systems, full-stack apps, and AI-driven solutions. Passionate about clean code, cloud architecture, and solving real-world problems."
    },
    about: {
      bio: [
        "I'm a Software Engineering student at RMIT University (graduating March 2027), based in Melbourne, with hands-on experience across full-stack development, cloud computing, AI/ML, and software testing.",
        "I love building things that work — clean APIs, intuitive UIs, systems that scale.",
        "Outside of engineering, I work in retail — which has sharpened my communication, customer empathy, and ability to work under pressure."
      ],
      stats: [
        { number: "8+", label: "Projects Built" },
        { number: "5+", label: "Languages" },
        { number: "2027", label: "Graduating" },
        { number: "3", label: "Minors" }
      ]
    },
    projects: [
      { id: "eventhub", title: "EventHub", stack: ["Java","Spring Boot","MySQL"], color: "linear-gradient(135deg,#1a0000,#3d0000)", desc: "Full-stack event management platform for university clubs.", points: ["Built 8+ RESTful APIs","Containerised with Docker","Agile Scrum team of 4"] },
      { id: "tutor", title: "TutorConnect", stack: ["React","Node.js","JavaScript"], color: "linear-gradient(135deg,#001a0d,#003d1a)", desc: "Tutor hiring web app with authentication and dashboards.", points: ["MVC architecture","Multi-role approval workflow","Form validation"] },
      { id: "maze", title: "Maze Solver", stack: ["Python","A*","BFS","DFS"], color: "linear-gradient(135deg,#00001a,#00003d)", desc: "Auto-generated 2D/3D mazes with pathfinding algorithms.", points: ["A*, BFS, DFS implemented","Real-time visualisation","10+ maze configs tested"] }
    ],
    skills: [
      { label: "Languages", tags: ["Java","Python","JavaScript","SQL","C++","HTML / CSS"] },
      { label: "Frameworks", tags: ["Spring Boot","React","Node.js","Maven","JUnit","Selenium","Cucumber"] },
      { label: "Tools & Cloud", tags: ["Docker","AWS","MySQL","GitHub","CI/CD","Kali Linux"] },
      { label: "Practices", tags: ["Agile / Scrum","RESTful APIs","Full-Stack Dev","Software Testing","AI / ML","DSA"] }
    ],
    contact: {
      email: "itsantonyrajan@gmail.com",
      phone: "+61 411 809 726",
      linkedin: "https://linkedin.com/in/antony-rajan-3b9844219",
      github: "https://github.com/antonyrajan"
    },
    meta: { lastUpdated: new Date().toISOString() }
  };
}

// ─── Public: GET content ─────────────────────────────────────────────────────
router.get('/content', (req, res) => {
  res.json({ success: true, content: readContent() });
});

// ─── Admin: POST login ───────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid password.' });
  }
  res.json({ success: true, token: process.env.ADMIN_TOKEN });
});

// ─── Admin: PUT update content sections ──────────────────────────────────────
router.put('/content', requireAdmin, (req, res) => {
  const { section, data } = req.body;
  const allowed = ['hero','about','projects','skills','contact'];
  if (!section || !allowed.includes(section)) {
    return res.status(400).json({ error: `Section must be one of: ${allowed.join(', ')}` });
  }
  const content = readContent();
  content[section] = data;
  content.meta = { lastUpdated: new Date().toISOString() };
  writeContent(content);
  res.json({ success: true, message: `Section "${section}" updated.`, content });
});

// ─── Admin: GET dashboard stats ──────────────────────────────────────────────
router.get('/stats', requireAdmin, (req, res) => {
  const content = readContent();
  res.json({
    success: true,
    stats: {
      projectCount: content.projects?.length || 0,
      skillCount: content.skills?.reduce((a,s) => a + s.tags.length, 0) || 0,
      lastUpdated: content.meta?.lastUpdated || 'Never',
    }
  });
});

module.exports = router;
