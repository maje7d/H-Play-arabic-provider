const BASE_URL = 'https://krmzi.org';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': `${BASE_URL}/`
};

async function searchAndGetStreams(query) {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    const linkMatch = html.match(/href="(https?:\/\/[^"]*(?:post|movie|watch|video|series)[^"]*)"/i);
    if (!linkMatch) return [];

    const pageRes = await fetch(linkMatch[1], { headers: HEADERS });
    const pageHtml = await pageRes.text();

    const streams = [];
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = iframeRegex.exec(pageHtml)) !== null) {
      let src = match[1];
      if (src.startsWith('//')) src = 'https:' + src;

      streams.push({
        name: "Krmzy",
        title: "Server 1080p",
        url: src,
        quality: "1080p",
        headers: HEADERS
      });
    }

    return streams;
  } catch (e) {
    return [];
  }
}

// التوافق مع محرك Nuvio
if (typeof module !== 'undefined') {
  module.exports = { searchAndGetStreams };
}
