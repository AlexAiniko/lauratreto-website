// Social Feed Aggregator for Laura Treto Coaching
// Netlify Function: fetches top posts from Instagram and Facebook,
// scores by engagement, returns the top 9 as JSON.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/social-feed
//
// Required env vars (set in Netlify UI):
//   META_PAGE_TOKEN - Permanent Meta page token for IG/FB API

const META_PAGE_TOKEN = process.env.META_PAGE_TOKEN;

// Instagram Business Account ID and Facebook Page ID
const IG_ACCOUNT_ID = '17841403861596917';
const FB_PAGE_ID = '599537857146045';
const API_VERSION = 'v19.0';

// Standard response headers
const RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, s-maxage=3600, max-age=1800',
  'Access-Control-Allow-Origin': '*'
};

/**
 * Fetch Instagram posts, score by engagement, and normalize.
 * Returns an array of { id, imageUrl, permalink, source, caption, _score }.
 */
async function fetchInstagramPosts(token) {
  const fields = [
    'id', 'caption', 'media_type', 'media_url',
    'thumbnail_url', 'permalink', 'timestamp',
    'like_count', 'comments_count'
  ].join(',');

  const url =
    `https://graph.facebook.com/${API_VERSION}/${IG_ACCOUNT_ID}/media` +
    `?fields=${fields}&limit=25&access_token=${token}`;

  const res = await fetch(url);

  if (!res.ok) {
    const errText = await res.text();
    console.error('Instagram API error:', res.status, errText);
    throw new Error(`Instagram API returned ${res.status}`);
  }

  const data = await res.json();
  const posts = [];

  for (const item of (data.data || [])) {
    // Pick the right image URL based on media type
    let imageUrl = null;
    if (item.media_type === 'VIDEO') {
      imageUrl = item.thumbnail_url;
    } else {
      // IMAGE or CAROUSEL_ALBUM: use media_url (cover image for carousels)
      imageUrl = item.media_url;
    }

    // Skip items with no usable image
    if (!imageUrl) continue;

    const likes = item.like_count || 0;
    const comments = item.comments_count || 0;
    const score = likes + (comments * 3);

    const caption = item.caption || '';

    posts.push({
      id: item.id,
      imageUrl,
      permalink: item.permalink,
      source: 'instagram',
      caption: caption.length > 100 ? caption.slice(0, 100) : caption,
      _score: score
    });
  }

  return posts;
}

/**
 * Fetch Facebook Page posts, score by engagement, and normalize.
 * Returns an array of { id, imageUrl, permalink, source, caption, _score }.
 */
async function fetchFacebookPosts(token) {
  const fields = [
    'id', 'message', 'full_picture', 'permalink_url',
    'created_time', 'likes.summary(true)',
    'comments.summary(true)', 'shares'
  ].join(',');

  const url =
    `https://graph.facebook.com/${API_VERSION}/${FB_PAGE_ID}/posts` +
    `?fields=${fields}&limit=25&access_token=${token}`;

  const res = await fetch(url);

  if (!res.ok) {
    const errText = await res.text();
    console.error('Facebook API error:', res.status, errText);
    throw new Error(`Facebook API returned ${res.status}`);
  }

  const data = await res.json();
  const posts = [];

  for (const item of (data.data || [])) {
    // Skip text-only posts (no image)
    if (!item.full_picture) continue;

    const likes = item.likes?.summary?.total_count || 0;
    const comments = item.comments?.summary?.total_count || 0;
    const shares = item.shares?.count || 0;
    const score = likes + (comments * 3) + (shares * 5);

    const message = item.message || '';

    posts.push({
      id: item.id,
      imageUrl: item.full_picture,
      permalink: item.permalink_url,
      source: 'facebook',
      caption: message.length > 100 ? message.slice(0, 100) : message,
      _score: score
    });
  }

  return posts;
}

exports.handler = async (event) => {
  // Health check for OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify({ status: 'ok' })
    };
  }

  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Verify token is configured
  if (!META_PAGE_TOKEN) {
    console.error('META_PAGE_TOKEN env var is not set');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Configuration error' })
    };
  }

  // Fetch from both platforms in parallel. If one fails, the other still returns.
  const [igResult, fbResult] = await Promise.allSettled([
    fetchInstagramPosts(META_PAGE_TOKEN),
    fetchFacebookPosts(META_PAGE_TOKEN)
  ]);

  const igPosts = igResult.status === 'fulfilled' ? igResult.value : [];
  const fbPosts = fbResult.status === 'fulfilled' ? fbResult.value : [];

  // Log failures for debugging
  if (igResult.status === 'rejected') {
    console.error('Instagram fetch failed:', igResult.reason);
  }
  if (fbResult.status === 'rejected') {
    console.error('Facebook fetch failed:', fbResult.reason);
  }

  // If both platforms failed, return 502
  if (igResult.status === 'rejected' && fbResult.status === 'rejected') {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unable to fetch social posts' })
    };
  }

  // Combine, sort by score descending, take top 9
  const allPosts = [...igPosts, ...fbPosts];
  allPosts.sort((a, b) => b._score - a._score);
  const topPosts = allPosts.slice(0, 9);

  // Strip internal score before returning
  const cleanPosts = topPosts.map(({ _score, ...post }) => post);

  return {
    statusCode: 200,
    headers: RESPONSE_HEADERS,
    body: JSON.stringify({
      posts: cleanPosts,
      fetchedAt: new Date().toISOString()
    })
  };
};
