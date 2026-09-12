const express = require('express');
const https = require('https');

const router = express.Router();

// Helper: timeout wrapper
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('RequestTimeout')), ms)),
  ]);
}

// Helper: simple HTTPS GET
function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data || '{}');
            resolve(json);
          } catch (e) {
            resolve({});
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

// Helper: HTTPS POST (Jooble requires POST)
function httpsPostJson(url, bodyObj) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(bodyObj || {});
    const { hostname, pathname } = new URL(url);

    const options = {
      hostname,
      path: pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'JobilioHR-Server/1.0',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          resolve(json);
        } catch (e) {
          resolve({});
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

// GET /api/external-jobs?query=...&location=...&limit=...
router.get('/', async (req, res) => {
  try {
    const query = (req.query.query || 'developer').toString();
    const location = (req.query.location || '').toString();
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 500);

    const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY || 'b1b9235b-fabd-419d-afff-8ce0ecc425ec';

    // Build requests
    const remotiveUrl = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=50`;

    const joobleUrl = `https://jooble.org/api/${JOOBLE_API_KEY}`;
    const joobleBody = {
      keywords: query,
      location: location,
      page: 1,
      size: 50, // Get 50 from each source for more variety
    };

    // Run in parallel
    // Adzuna (needs app_id and app_key)
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '011c348d';
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || process.env.ADZUNA_API_KEY || '795ae2f34206e562eea831e1fcc180d2';
    const adzunaCountry = (req.query.country || 'in').toString().toLowerCase();
    const adzunaEnabled = !!(ADZUNA_APP_ID && ADZUNA_APP_KEY);
    const adzunaUrl = adzunaEnabled
      ? `https://api.adzuna.com/v1/api/jobs/${adzunaCountry}/search/1?app_id=${encodeURIComponent(ADZUNA_APP_ID)}&app_key=${encodeURIComponent(ADZUNA_APP_KEY)}&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}&results_per_page=50`
      : null;

    console.log('Fetching external jobs with params:', { query, location, limit, joobleBody, remotiveUrl, adzunaUrl: adzunaUrl ? 'enabled' : 'disabled' });

    const [remotiveResp, joobleResp, adzunaResp] = await Promise.all([
      withTimeout(httpsGetJson(remotiveUrl)).catch((e) => {
        console.error('Remotive fetch failed:', e.message);
        return {};
      }),
      withTimeout(httpsPostJson(joobleUrl, joobleBody)).catch((e) => {
        console.error('Jooble fetch failed:', e.message);
        return {};
      }),
      adzunaUrl
        ? withTimeout(httpsGetJson(adzunaUrl)).catch((e) => {
            console.error('Adzuna fetch failed:', e.message);
            return {};
          })
        : Promise.resolve({}),
    ]);

    console.log('API Responses received:', {
      remotive: remotiveResp?.jobs?.length || 0,
      jooble: joobleResp?.jobs?.length || 0,
      adzuna: adzunaResp?.results?.length || 0
    });

    // Helper: convert various possible field shapes into a safe string
    const safeString = (value) => {
      if (!value && value !== 0) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) return value.map(v => safeString(v)).filter(Boolean).join(', ');
      if (typeof value === 'object') {
        // common nested shapes: { display_name }, { name }, { area, display_name }
        return value.display_name || value.name || value.title || value.area || JSON.stringify(value);
      }
      return String(value);
    };

    // Normalize each source and extract a consistent `applyUrl` where possible.
    const remotiveJobs = Array.isArray(remotiveResp?.jobs)
      ? remotiveResp.jobs.slice(0, 50).map(j => {
          const applyUrl = j.url || j.job_url || j.apply_url || j.link || j.applyUrl || null;
          return {
            source: 'remotive',
            id: j.id || j.job_id || safeString(j.id),
            title: safeString(j.title || j.job_title || j.name),
            company: safeString(j.company_name || j.company || j.organization),
            location: safeString(j.candidate_required_location || j.location || j.area),
            description: safeString(j.description || j.summary || j.intro || ''),
            applyUrl: safeString(applyUrl),
            raw: j, // keep raw if you need later (not rendered directly)
          };
        })
      : [];

    const joobleJobs = Array.isArray(joobleResp?.jobs)
      ? joobleResp.jobs.slice(0, 50).map(j => {
          const applyUrl = j.applyUrl || j.apply_url || j.url || j.link || j.vacancyUrl || null;
          return {
            source: 'jooble',
            id: j.id || j.id || safeString(j.id),
            title: safeString(j.title || j.position || j.name),
            company: safeString(j.company || j.employer || j.company_name),
            location: safeString(j.location || j.city || j.area),
            description: safeString(j.snippet || j.description || j.summary || ''),
            applyUrl: safeString(applyUrl),
            raw: j,
          };
        })
      : [];

    const adzunaJobs = Array.isArray(adzunaResp?.results)
      ? adzunaResp.results.slice(0, 50).map(j => {
          const applyUrl = j.redirect_url || j.redirectUrl || j.url || j.apply_url || null;
          return {
            source: 'adzuna',
            id: j.id || j.job_id || safeString(j.id),
            title: safeString(j.title || j.label || j.display_name),
            company: safeString(j.company || j.created_by || j.employer),
            location: safeString(j.location?.display_name || j.location || j.area),
            description: safeString(j.description || j.snippet || ''),
            applyUrl: safeString(applyUrl),
            raw: j,
          };
        })
      : [];

    // Merge and keep items that have some link-like field (applyUrl or common url fields)
    const allJobs = [...remotiveJobs, ...joobleJobs, ...adzunaJobs].filter(j => {
      // Accept only if applyUrl exists (string) or fallback to raw link fields
      const link = j.applyUrl || j.raw?.url || j.raw?.link || j.raw?.job_url || j.raw?.redirect_url || j.raw?.vacancyUrl || '';
      const linkStr = safeString(link);
      if (linkStr) {
        j.applyUrl = j.applyUrl || linkStr;
        return true;
      }
      return false;
    });

    // Randomize order and limit by requested `limit`
    const shuffled = allJobs.sort(() => Math.random() - 0.5);
    const merged = shuffled.slice(0, Math.max(0, Math.min(limit, shuffled.length)));

    console.log('Final external jobs result:', {
      remotiveJobs: remotiveJobs.length,
      joobleJobs: joobleJobs.length,
      adzunaJobs: adzunaJobs.length,
      allJobsBeforeFilter: allJobs.length,
      shuffledJobs: shuffled.length,
      finalMerged: merged.length
    });

    // Always soft-return success to avoid frontend network error UX
    res.json({ success: true, count: merged.length, jobs: merged });
  } catch (err) {
    console.error('External jobs error:', err);
    // Soft-fail with empty result to prevent frontend error state
    res.json({ success: true, count: 0, jobs: [] });
  }
});

module.exports = router;


