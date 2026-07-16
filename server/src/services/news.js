import Parser from 'rss-parser';

const parser = new Parser();

// UK edition of Google News; freshness window keeps results relevant to "latest news"
export async function searchUkNews(query, { days = 45, max = 25 } = {}) {
  const q = encodeURIComponent(`${query} when:${days}d`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`;
  const feed = await parser.parseURL(url);
  return (feed.items ?? []).slice(0, max).map((item) => ({
    title: item.title ?? '',
    link: item.link ?? '',
    source: item.source?.title ?? item.creator ?? '',
    published: item.pubDate ?? '',
    snippet: (item.contentSnippet ?? '').slice(0, 500),
  }));
}
