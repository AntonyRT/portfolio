const express = require('express');
const axios = require('axios');
const router = express.Router();

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'antonyrajan';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache = { data: null, timestamp: 0 };

async function fetchFromGitHub(url) {
  const headers = { 'User-Agent': 'portfolio-backend' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  const response = await axios.get(url, { headers, timeout: 8000 });
  return response.data;
}

// GET /api/github/repos — fetch pinned/top repos
router.get('/repos', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
      return res.json({ success: true, source: 'cache', repos: cache.data });
    }

    const repos = await fetchFromGitHub(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20&type=public`
    );

    const filtered = repos
      .filter(r => !r.fork && r.description)
      .sort((a, b) => (b.stargazers_count + b.watchers_count) - (a.stargazers_count + a.watchers_count))
      .slice(0, 8)
      .map(r => ({
        id:          r.id,
        name:        r.name,
        description: r.description,
        url:         r.html_url,
        homepage:    r.homepage,
        language:    r.language,
        stars:       r.stargazers_count,
        forks:       r.forks_count,
        topics:      r.topics || [],
        updatedAt:   r.updated_at,
        createdAt:   r.created_at,
      }));

    cache = { data: filtered, timestamp: now };
    res.json({ success: true, source: 'github', repos: filtered });
  } catch (err) {
    console.error('GitHub API error:', err.message);
    if (cache.data) return res.json({ success: true, source: 'stale-cache', repos: cache.data });
    res.status(502).json({ success: false, error: 'Could not fetch GitHub repos.' });
  }
});

// GET /api/github/profile — fetch profile stats
router.get('/profile', async (req, res) => {
  try {
    const profile = await fetchFromGitHub(`https://api.github.com/users/${GITHUB_USERNAME}`);
    res.json({
      success: true,
      profile: {
        login:      profile.login,
        name:       profile.name,
        bio:        profile.bio,
        avatar:     profile.avatar_url,
        repos:      profile.public_repos,
        followers:  profile.followers,
        following:  profile.following,
        url:        profile.html_url,
        location:   profile.location,
        createdAt:  profile.created_at,
      }
    });
  } catch (err) {
    res.status(502).json({ success: false, error: 'Could not fetch GitHub profile.' });
  }
});

module.exports = router;
