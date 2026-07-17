import { Router } from 'express';
import { parseVideoId, fetchTranscript, fetchComments, searchVideos } from '../services/youtube.js';
import { fetchRedditThread } from '../services/reddit.js';
import { searchUkNews } from '../services/news.js';
import { parseCommentCsv } from '../services/csv.js';

const router = Router();

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

// one video per call so the UI can show per-link progress
router.post(
  '/youtube',
  wrap(async (req, res) => {
    const { url, withComments = true, maxComments } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });
    const videoId = parseVideoId(url);
    const video = await fetchTranscript(videoId);
    let comments = { comments: [], commentCount: 0, capped: false };
    let commentsError = null;
    if (withComments) {
      try {
        comments = await fetchComments(videoId, maxComments ? { maxComments } : {});
      } catch (e) {
        commentsError = e.message;
      }
    }
    res.json({ ...video, ...comments, commentsError, sourceUrl: url });
  })
);

router.get(
  '/youtube-search',
  wrap(async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });
    res.json({ query: q, items: await searchVideos(q) });
  })
);

router.post(
  '/reddit',
  wrap(async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });
    res.json(await fetchRedditThread(url));
  })
);

// comment CSV exports (YouTube or Reddit) — parsed into the comment pool so
// they count toward the 100%-coverage analysis
router.post(
  '/csv',
  wrap(async (req, res) => {
    const { content, filename } = req.body;
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'content (the CSV file text) is required' });
    }
    const parsed = parseCommentCsv(content, filename || 'comments.csv');
    res.json({ ...parsed, commentCount: parsed.comments.length });
  })
);

router.get(
  '/news',
  wrap(async (req, res) => {
    const { q, days } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });
    res.json({ query: q, items: await searchUkNews(q, days ? { days: Number(days) } : {}) });
  })
);

export default router;
