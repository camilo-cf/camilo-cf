# Self-Hosted Profile Views Badge

Privacy-preserving, bot-filtering profile views counter that generates an SVG badge.

## Features

- ✅ **Privacy-First**: Only stores hashed IP prefixes, auto-deleted after 24h
- ✅ **Bot Filtering**: Filters common bots and crawlers
- ✅ **No Third-Party Tracking**: Fully self-hosted
- ✅ **Real-Time**: Updates on every legitimate view
- ✅ **Deduplication**: Counts each visitor once per 24 hours
- ✅ **No Repo Noise**: Serverless, no commits needed

## Architecture Options

### Option 1: Vercel Edge Function + Upstash Redis (Recommended)
- **Pros**: Free tier, global edge network, zero cold starts, easy deployment
- **Cons**: Requires Upstash account
- **Setup Time**: ~15 minutes
- **Cost**: Free for most personal profiles

### Option 2: Cloudflare Workers + KV
- **Pros**: Free tier, ultra-fast, global edge network
- **Cons**: KV has eventual consistency
- **Setup Time**: ~20 minutes
- **Cost**: Free for most personal profiles

### Option 3: AWS Lambda + DynamoDB
- **Pros**: More control, enterprise-ready
- **Cons**: More complex setup, potential costs
- **Setup Time**: ~45 minutes
- **Cost**: Free tier, then pay-per-use

## Quick Start (Vercel + Upstash)

### Prerequisites
- Vercel account (free)
- Upstash account (free)
- GitHub account

### Step 1: Create Upstash Redis Database
1. Go to https://console.upstash.com/
2. Create new database (free tier)
3. Select closest region
4. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Step 2: Deploy to Vercel
```bash
# Clone this implementation
cd profile-views-badge

# Install dependencies
npm install

# Deploy to Vercel
vercel --prod

# Add environment variables in Vercel dashboard:
# UPSTASH_REDIS_REST_URL=your_url
# UPSTASH_REDIS_REST_TOKEN=your_token
# INITIAL_COUNT=125  # Optional: start from current komarev count
```

### Step 3: Update README
Replace your komarev badge with:
```markdown
<img src="https://your-deployment.vercel.app/api/badge" alt="Profile views" />
```

## Configuration

### Environment Variables
```bash
# Required
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional
INITIAL_COUNT=0                    # Starting count
DEDUP_WINDOW_HOURS=24              # Hours to deduplicate IPs
BOT_FILTERING=true                 # Enable bot filtering
BADGE_COLOR=00C7B7                 # Badge color (hex)
BADGE_LABEL=PROFILE+VIEWS          # Badge label
```

### Bot Filtering
By default, filters:
- Common bot User-Agents (Googlebot, Bingbot, etc.)
- Missing or suspicious User-Agents
- Known crawler patterns
- curl/wget/python-requests

You can customize filtering in `api/badge.ts`.

## Privacy & Data Storage

### What We Store
- **Hashed IP prefix** (first 3 octets only, SHA-256 hashed)
- **Timestamp** of last view
- **Total count**

### What We DON'T Store
- ❌ Full IP addresses
- ❌ User-Agent strings
- ❌ Referrer information
- ❌ Any personally identifiable information

### Data Retention
- IP hashes: 24 hours (auto-deleted)
- Total count: Permanent (just a number)

## Monitoring & Analytics

### View Current Count
```bash
curl "https://your-deployment.vercel.app/api/stats"
```

### Reset Counter (if needed)
```bash
# Add an admin endpoint with authentication
curl -X POST "https://your-deployment.vercel.app/api/admin/reset" \
  -H "Authorization: Bearer YOUR_SECRET"
```

## Testing

### Local Development
```bash
# Install dependencies
npm install

# Set up .env.local
cp .env.example .env.local
# Edit .env.local with your Upstash credentials

# Run development server
npm run dev

# Test the endpoint
curl "http://localhost:3000/api/badge"
```

### Test Bot Filtering
```bash
# Should increment (browser UA)
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "http://localhost:3000/api/badge"

# Should NOT increment (bot UA)
curl -A "Googlebot/2.1" "http://localhost:3000/api/badge"

# Should NOT increment (missing UA)
curl "http://localhost:3000/api/badge"
```

## Deployment Alternatives

### Cloudflare Workers
See `cloudflare-workers/` directory for implementation.

### AWS Lambda
See `aws-lambda/` directory for implementation.

## Migration from Komarev

1. **Get current count** from komarev badge
2. **Set `INITIAL_COUNT`** environment variable
3. **Deploy** self-hosted badge
4. **Test** with different user agents
5. **Update README** with new badge URL
6. **Monitor** for 1 week to ensure accuracy
7. **Remove** old komarev badge

## Troubleshooting

### Badge shows 0 views
- Check Upstash credentials are set correctly
- Check `INITIAL_COUNT` environment variable
- Check Upstash database is accessible

### Badge not incrementing
- Check bot filtering rules
- Verify you're testing from different IPs
- Check Upstash rate limits

### Slow badge loading
- Check Upstash region (should be close to Vercel region)
- Check Vercel deployment logs
- Consider caching badge SVG for 1-5 minutes

## Performance

- **Response Time**: ~50-150ms (global edge)
- **Uptime**: 99.9%+ (Vercel + Upstash SLA)
- **Rate Limits**: 10,000 requests/day (Upstash free tier)

## Cost Estimate

For a typical personal GitHub profile:
- **Vercel**: Free (within limits)
- **Upstash**: Free (within limits)
- **Total**: $0/month

For high-traffic profiles (>10K views/day):
- **Vercel**: Free - $20/month
- **Upstash**: $10-30/month
- **Total**: $10-50/month

## Contributing

PRs welcome for:
- Better bot detection algorithms
- Additional deployment platforms
- Performance optimizations
- Privacy enhancements

## License

MIT - Feel free to use and modify for your own profile!

## Support

- Open an issue for bugs
- Discussions for questions
- PRs for improvements

---

**Comparison to Komarev:**

| Feature | Komarev | Self-Hosted |
|---------|---------|-------------|
| Privacy | ❌ Third-party | ✅ Self-hosted |
| Bot Filtering | ⚠️ Unknown | ✅ Customizable |
| Control | ❌ None | ✅ Full |
| Maintenance | ✅ Zero | ⚠️ Low |
| Cost | ✅ Free | ✅ Free* |
| Caching | ⚠️ Unknown | ✅ Configurable |
| Single Point of Failure | ❌ Yes | ✅ No (multi-region) |

\* Free for most use cases, scales with traffic
