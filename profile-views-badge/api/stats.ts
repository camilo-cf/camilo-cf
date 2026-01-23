import { Redis } from '@upstash/redis';

export const config = { runtime: 'edge' };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Public stats endpoint (no authentication)
 */
export default async function handler(req: Request) {
  try {
    const totalViews = await redis.get<number>('total-views') || 0;

    const stats = {
      total_views: totalViews,
      privacy_mode: true,
      bot_filtering: process.env.BOT_FILTERING !== 'false',
      dedup_window_hours: parseInt(process.env.DEDUP_WINDOW_HOURS || '24'),
      last_updated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(stats, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
