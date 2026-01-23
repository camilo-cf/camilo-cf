# Profile Views Badge - Experiment Results

## Experiment Date: 2026-01-23

## Current Implementation
- **Service**: komarev.com/ghpvc
- **Badge URL**: `https://komarev.com/ghpvc/?username=camilo-cf&color=00C7B7&style=for-the-badge&label=PROFILE+VIEWS`
- **Location**: README.md line 15

---

## Experiment 1: Header Inspection

### Command
```bash
curl -I "https://komarev.com/ghpvc/?username=camilo-cf&style=for-the-badge"
```

### Results
```
HTTP/2 200
server: nginx/1.22.0
date: Fri, 23 Jan 2026 11:38:52 GMT
content-type: image/svg+xml
x-powered-by: PHP/8.2.16
cache-control: max-age=0, no-cache, no-store, must-revalidate
x-frame-options: SAMEORIGIN
x-xss-protection: 1; mode=block
x-content-type-options: nosniff
```

### Key Findings
1. **No Caching**: `cache-control: max-age=0, no-cache, no-store, must-revalidate`
   - Every request should hit the komarev server directly
   - No CDN or browser caching intended
   - However, GitHub's image proxy may still cache despite these headers

2. **Technology Stack**: PHP 8.2.16 on nginx/1.22.0

3. **Security Headers**: SAMEORIGIN, XSS protection, nosniff

### Hypothesis Testing
- ❌ **Hypothesis 2 (Caching causes lag)**: Partially disproven. The service itself disables caching, but GitHub's camo proxy may still introduce caching.

---

## Experiment 2: User-Agent Testing

### Current Count
**125 views** (as of 2026-01-23 11:38 GMT)

### Test Matrix
| Test # | User-Agent | Count | Increment? |
|--------|------------|-------|------------|
| 1 | curl/default | 125 | - |
| 2 | Chrome Browser | 125 | No |
| 3 | Googlebot | 125 | No |
| 4 | Bingbot | 125 | No |

### Commands Executed
```bash
# Test 1: Default curl
curl -s "https://komarev.com/ghpvc/?username=camilo-cf&style=for-the-badge"

# Test 2: Browser UA
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "..."

# Test 3: Googlebot
curl -s -A "Googlebot/2.1 (+http://www.google.com/bot.html)" "..."

# Test 4: Bingbot
curl -s -A "Bingbot/2.0 (+http://www.bing.com/bingbot.htm)" "..."
```

### Key Findings
1. **No increments detected** from the same IP address across different User-Agents
2. **Possible deduplication mechanisms**:
   - IP-based tracking (most likely)
   - Session/cookie tracking
   - Time-window based deduplication (e.g., only count once per IP per hour/day)

3. **Cannot confirm bot filtering** from this test alone
   - Need to test from different IP addresses
   - Need to monitor over time from multiple locations

### Hypothesis Testing
- ⚠️ **Hypothesis 1 (Bot overcounting)**: Inconclusive. Cannot determine if bots are filtered without testing from different IPs.
- ✅ **Some deduplication exists**: The service doesn't increment on every request from the same source.

---

## Experiment 3: GitHub Image Proxy Testing

### Status: PENDING
Need to:
1. Check if GitHub uses camo proxy for this badge
2. Test actual badge rendering on GitHub vs direct access
3. Monitor if counts differ between direct access and GitHub-rendered views

### Planned Commands
```bash
# Check GitHub's camo proxy behavior
curl -I "https://github.com/camilo-cf"
# Look for camo.githubusercontent.com references

# Compare direct vs proxied
# Direct: curl komarev.com
# Via GitHub: Access actual profile page and inspect network requests
```

---

## Experiment 4: CountAPI Pilot (READY TO DEPLOY)

### Implementation Plan

#### Step 1: Create CountAPI Endpoint
```bash
# Create a new counter
curl "https://api.countapi.xyz/create?namespace=camilo-cf&key=profile-views&value=125"
# Start at current komarev count for fair comparison

# Get current count
curl "https://api.countapi.xyz/get/camilo-cf/profile-views"

# Hit counter (for badge)
curl "https://api.countapi.xyz/hit/camilo-cf/profile-views"
```

#### Step 2: Create Badge URL
Use shields.io to create a badge that fetches from CountAPI:
```
https://img.shields.io/badge/dynamic/json?color=00C7B7&label=PROFILE+VIEWS&query=value&url=https%3A%2F%2Fapi.countapi.xyz%2Fhit%2Fcamilo-cf%2Fprofile-views&style=for-the-badge
```

Or use CountAPI's built-in badge:
```
https://count.ly/v1/badge?namespace=camilo-cf&key=profile-views&style=for-the-badge
```

#### Step 3: A/B Test Setup
Add both badges to README temporarily:
```markdown
<!-- Current komarev -->
<img src="https://komarev.com/ghpvc/?username=camilo-cf&color=00C7B7&style=for-the-badge&label=PROFILE+VIEWS" alt="Profile views" />

<!-- Test: CountAPI -->
<img src="[CountAPI badge URL]" alt="Profile views (CountAPI test)" />
```

Run for 7-14 days, compare counts.

---

## Experiment 5: Self-Hosted Serverless Counter

### Proposed Architecture

#### Option A: Vercel Edge Function + Upstash Redis
```typescript
// api/badge/views.ts
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

export const config = { runtime: 'edge' };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export default async function handler(req: NextRequest) {
  // Bot detection
  const ua = req.headers.get('user-agent') || '';
  const isBot = /bot|crawler|spider|scrapy/i.test(ua);

  // Get client IP (hashed for privacy)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  const ipHash = ip ? await hashIP(ip) : 'unknown';

  // Deduplication: only count once per IP per 24h
  const key = `view:${ipHash}`;
  const exists = await redis.get(key);

  if (!exists && !isBot) {
    await redis.set(key, '1', { ex: 86400 }); // 24h TTL
    await redis.incr('total-views');
  }

  const count = await redis.get('total-views') || 125;

  // Return SVG badge
  return new Response(generateSVG(count), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
    },
  });
}

async function hashIP(ip: string): Promise<string> {
  // Use only first 3 octets for privacy
  const partial = ip.split('.').slice(0, 3).join('.');
  const encoder = new TextEncoder();
  const data = encoder.encode(partial);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 16);
}

function generateSVG(count: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="28">
    <title>Profile Views: ${count}</title>
    <g shape-rendering="crispEdges">
      <rect width="130" height="28" fill="#555"/>
      <rect x="130" width="50" height="28" fill="#00C7B7"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana" font-size="10">
      <text x="65" y="17.5">PROFILE VIEWS</text>
      <text x="155" y="17.5" font-weight="bold">${count}</text>
    </g>
  </svg>`;
}
```

#### Option B: AWS Lambda + DynamoDB
Similar logic, deployed to AWS Lambda with DynamoDB for storage.

#### Option C: Cloudflare Workers + KV
Lightweight edge computing with Cloudflare KV for storage.

### Privacy Features
- ✅ Only store hashed/partial IP addresses
- ✅ 24-hour TTL on IP hashes (auto-delete)
- ✅ No logging of raw IPs
- ✅ No third-party tracking
- ✅ User-Agent based bot filtering

### Bot Filtering Strategy
```typescript
function isLikelyBot(ua: string, ip: string): boolean {
  // Known bot patterns
  if (/bot|crawler|spider|scrapy|curl|wget|python|java/i.test(ua)) {
    return true;
  }

  // Missing or suspicious UA
  if (!ua || ua.length < 10) {
    return true;
  }

  // Known crawler IP ranges (AWS, GCP, Azure, etc.)
  // Could integrate with ip2location or similar service

  return false;
}
```

---

## Experiment 6: GitHub Actions Counter

### Implementation Approach

#### Workflow File: `.github/workflows/profile-views.yml`
```yaml
name: Update Profile Views

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  update-views:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Get current views
        id: views
        run: |
          # Fetch from external API or calculate
          # For demo, increment a file-based counter
          if [ -f .github/views-count.txt ]; then
            COUNT=$(cat .github/views-count.txt)
          else
            COUNT=125
          fi
          echo "count=$COUNT" >> $GITHUB_OUTPUT

      - name: Update README
        run: |
          COUNT=${{ steps.views.outputs.count }}
          sed -i "s/PROFILE VIEWS: [0-9]\\+/PROFILE VIEWS: $COUNT/" README.md

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add README.md
          git diff --quiet && git diff --staged --quiet || git commit -m "Update profile views count [skip ci]"
          git push
```

### Pros
- ✅ Complete privacy (no third-party)
- ✅ Full control
- ✅ Accurate (based on GitHub API or custom tracking)

### Cons
- ❌ Creates commit noise (even with `[skip ci]`)
- ❌ Limited to scheduled updates (not real-time)
- ❌ May hit GitHub API rate limits
- ❌ Doesn't track actual README views (would need GitHub Analytics API)

---

## Summary of Findings

### Confirmed
1. ✅ Komarev sets no-cache headers (but GitHub proxy may still cache)
2. ✅ Some form of deduplication exists (IP-based most likely)
3. ✅ Badge generates on-demand (PHP backend)

### Needs Further Testing
1. ⚠️ Bot filtering effectiveness (need multi-IP testing)
2. ⚠️ GitHub image proxy caching behavior
3. ⚠️ Accuracy of counts (bot traffic vs human traffic)
4. ⚠️ Privacy implications (what data does komarev store?)

### Recommended Next Steps
1. **Short-term (Week 1-2)**:
   - ✅ Deploy CountAPI pilot alongside komarev
   - 📊 Compare counts over 7-14 days
   - 🔍 Monitor both badges for discrepancies

2. **Mid-term (Week 3-4)**:
   - 🚀 Deploy self-hosted serverless counter (Vercel + Upstash recommended)
   - 🧪 A/B test: komarev vs CountAPI vs self-hosted
   - 📈 Collect metrics on accuracy, latency, bot filtering

3. **Long-term (Month 2+)**:
   - 📊 Analyze data and choose best solution
   - 🎯 Implement chosen solution
   - 📝 Document methodology in README
   - 🗑️ Remove test badges

---

## Decision Criteria

| Criterion | Weight | Komarev | CountAPI | Self-Hosted | GitHub Actions |
|-----------|--------|---------|----------|-------------|----------------|
| **Privacy** | High | ❌ Low | ⚠️ Medium | ✅ High | ✅ High |
| **Accuracy** | High | ⚠️ Unknown | ⚠️ Unknown | ✅ High | ⚠️ Medium |
| **Maintenance** | Medium | ✅ Zero | ✅ Low | ⚠️ Medium | ❌ High |
| **Real-time** | Low | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Control** | High | ❌ None | ⚠️ Low | ✅ Full | ✅ Full |
| **Repo Noise** | Medium | ✅ None | ✅ None | ✅ None | ❌ High |

### Preliminary Recommendation
**Self-hosted serverless counter** (Vercel + Upstash) offers the best balance:
- ✅ Privacy-preserving (hashed IPs, no third-party tracking)
- ✅ Accurate (custom bot filtering)
- ✅ Low maintenance (serverless)
- ✅ Real-time updates
- ✅ Full control
- ✅ No repo commit noise

**Estimated effort**: 4-6 hours initial setup, <1 hour/month maintenance.

---

## Resources & References

### CountAPI
- API Docs: https://countapi.xyz/
- No account needed, simple REST API
- Public counters (consider privacy implications)

### Upstash Redis
- Edge-compatible Redis
- Free tier: 10K commands/day
- Perfect for this use case

### Vercel Edge Functions
- Free tier: 100GB-hrs/month
- Global edge network
- Zero cold starts

### Alternative Services
- GoatCounter (privacy-focused analytics)
- Plausible (privacy-focused, but requires hosting)
- Simple Analytics (paid)

---

## Appendix: Raw Test Data

### Test Session 2026-01-23
```
Time: 11:38-11:40 GMT
Initial Count: 125
Source IP: [redacted]
Tests Run: 4 (default curl, browser, googlebot, bingbot)
Result: No increment detected
```

---

**Next Update**: After CountAPI pilot (7-14 days)
