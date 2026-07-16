import { getSettings } from '../store.js';

// Reddit now blocks unauthenticated JSON requests (403). With a free "script" app
// (client id + secret, set on the Settings screen) we go through OAuth; without
// one we still try the public endpoint and fail with a friendly message telling
// the user to paste the thread content manually.

const UA = 'windows:keeth-script-studio:v0.1 (local research tool)';

let cachedToken = null; // { token, expiresAt }

async function getOAuthToken() {
  const { redditClientId, redditClientSecret } = getSettings();
  if (!redditClientId || !redditClientSecret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${redditClientId}:${redditClientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Reddit OAuth failed (${res.status}) — check the Reddit app credentials in Settings`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

function flattenComments(children, out, depth = 0) {
  for (const child of children ?? []) {
    if (child.kind !== 't1') continue;
    const d = child.data;
    if (d.body && d.body !== '[removed]' && d.body !== '[deleted]') {
      out.push({ author: d.author, text: d.body, score: d.score ?? 0, depth });
    }
    if (d.replies?.data?.children) flattenComments(d.replies.data.children, out, depth + 1);
  }
}

export async function fetchRedditThread(url) {
  const clean = url.trim().split('?')[0].replace(/\/+$/, '');
  const m = clean.match(/^https?:\/\/(?:www\.|old\.)?reddit\.com(\/r\/[^/]+\/comments\/[\w]+(?:\/[^/]*)?)/);
  if (!m) throw new Error(`Not a reddit.com thread link: ${url}`);
  const threadPath = m[1];

  const token = await getOAuthToken();
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const headers = { 'User-Agent': UA };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${threadPath}.json?limit=500&sort=top&raw_json=1`, { headers });
  if (res.status === 403 && !token) {
    throw new Error(
      'Reddit blocked the request. Either add Reddit app credentials in Settings, or copy the thread text and paste it into the "Anything else" box.'
    );
  }
  if (!res.ok) throw new Error(`Reddit responded ${res.status} for ${clean}`);
  const data = await res.json();

  const post = data?.[0]?.data?.children?.[0]?.data ?? {};
  const comments = [];
  flattenComments(data?.[1]?.data?.children, comments);

  return {
    url: clean,
    title: post.title ?? '',
    subreddit: post.subreddit_name_prefixed ?? '',
    selftext: post.selftext ?? '',
    score: post.score ?? 0,
    comments,
    commentCount: comments.length,
  };
}
