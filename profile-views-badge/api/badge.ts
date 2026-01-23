import { Redis } from '@upstash/redis';

// Edge runtime for global performance
export const config = { runtime: 'edge' };

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configuration
const INITIAL_COUNT = parseInt(process.env.INITIAL_COUNT || '0');
const DEDUP_WINDOW = parseInt(process.env.DEDUP_WINDOW_HOURS || '24') * 3600;
const BOT_FILTERING = process.env.BOT_FILTERING !== 'false';
const BADGE_COLOR = process.env.BADGE_COLOR || '00C7B7';
const BADGE_LABEL = process.env.BADGE_LABEL || 'PROFILE+VIEWS';

/**
 * Main handler for badge requests
 */
export default async function handler(req: Request) {
  try {
    // Extract request metadata
    const ua = req.headers.get('user-agent') || '';
    const forwarded = req.headers.get('x-forwarded-for') || '';
    const realIP = req.headers.get('x-real-ip') || '';
    const ip = forwarded.split(',')[0].trim() || realIP || 'unknown';

    // Bot detection
    const isBot = BOT_FILTERING && isLikelyBot(ua, ip);

    // Privacy-preserving IP hash (only first 3 octets)
    const ipHash = await hashIPPrefix(ip);

    // Check if this IP has been seen recently
    const dedupKey = `ip:${ipHash}`;
    const alreadyCounted = await redis.get(dedupKey);

    // Increment count if not a bot and not recently seen
    if (!isBot && !alreadyCounted) {
      // Set deduplication flag
      await redis.set(dedupKey, '1', { ex: DEDUP_WINDOW });

      // Increment total count
      const count = await redis.incr('total-views');

      // Initialize if first time
      if (count === 1 && INITIAL_COUNT > 0) {
        await redis.set('total-views', INITIAL_COUNT.toString());
      }
    }

    // Get current count
    let totalCount = await redis.get<number>('total-views');
    if (totalCount === null) {
      totalCount = INITIAL_COUNT;
      await redis.set('total-views', INITIAL_COUNT.toString());
    }

    // Generate and return SVG badge
    const svg = generateBadgeSVG(totalCount, BADGE_LABEL.replace(/\+/g, ' '), BADGE_COLOR);

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('Badge error:', error);

    // Return error badge
    const errorSVG = generateBadgeSVG(0, 'ERROR', 'FF0000');
    return new Response(errorSVG, {
      status: 500,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}

/**
 * Detect if request is likely from a bot
 */
function isLikelyBot(ua: string, ip: string): boolean {
  if (!ua) return true; // No UA = likely bot/automation

  const botPatterns = [
    /bot|crawler|spider|scrapy/i,
    /curl|wget|python-requests|java|go-http-client/i,
    /headless|phantom|selenium|puppeteer/i,
    /slurp|baidu|yandex|duckduck/i,
  ];

  return botPatterns.some(pattern => pattern.test(ua));
}

/**
 * Hash IP prefix for privacy
 * Only uses first 3 octets to preserve some anonymity
 */
async function hashIPPrefix(ip: string): Promise<string> {
  if (ip === 'unknown' || !ip) {
    return 'unknown';
  }

  // Extract first 3 octets for IPv4, first 4 segments for IPv6
  let prefix: string;
  if (ip.includes(':')) {
    // IPv6
    prefix = ip.split(':').slice(0, 4).join(':');
  } else {
    // IPv4
    prefix = ip.split('.').slice(0, 3).join('.');
  }

  // Hash the prefix
  const encoder = new TextEncoder();
  const data = encoder.encode(prefix + process.env.HASH_SALT || 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex.slice(0, 16); // Use first 16 chars
}

/**
 * Generate SVG badge
 */
function generateBadgeSVG(count: number, label: string, color: string): string {
  // Calculate widths based on text length
  const labelWidth = Math.max(label.length * 6.5 + 20, 100);
  const countStr = count.toString();
  const countWidth = Math.max(countStr.length * 7 + 20, 40);
  const totalWidth = labelWidth + countWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="${label}: ${count}">
  <title>${label}: ${count}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="28" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="28" fill="#555"/>
    <rect x="${labelWidth}" width="${countWidth}" height="28" fill="#${color}"/>
    <rect width="${totalWidth}" height="28" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="100">
    <text transform="scale(.1)" x="${(labelWidth / 2) * 10}" y="175" textLength="${(labelWidth - 20) * 10}" lengthAdjust="spacing">${label}</text>
    <text transform="scale(.1)" x="${(labelWidth + countWidth / 2) * 10}" y="175" font-weight="bold" textLength="${(countWidth - 20) * 10}" lengthAdjust="spacing">${countStr}</text>
  </g>
</svg>`;
}
