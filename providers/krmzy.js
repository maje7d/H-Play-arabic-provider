const BASE_URL = 'https://krmzi.net'; // تم تحديث النطاق إلى .net

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': `${BASE_URL}/`
};

/**
 * جلب اسم المادة المرئية من TMDB باستخدام الـ tmdbId
 */
async function getMediaTitle(tmdbId, mediaType) {
  try {
    // يمكن استخدام مفتاح TMDB مجاني أو خارجي لجلب العنوان
    const type = mediaType === 'series' || mediaType === 'tv' ? 'tv' : 'movie';
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=15d2850027b7744312013263e12089b3&language=ar-SA`);
    const data = await res.json();
    return data.title || data.name || data.original_title || data.original_name;
  } catch (e) {
    return null;
  }
}

/**
 * الدالة الرئيسية المتوافقة مع واجهة Nuvio Provider
 */
async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    // 1. الحصول على عنوان البحث من TMDB
    const title = await getMediaTitle(tmdbId, mediaType);
    if (!title) return [];

    // صياغة الاستعلام (إضافة رقم الموسم والحلقة في حال كان مسلسلاً)
    let searchQuery = title;
    if (mediaType === 'series' || mediaType === 'tv') {
      if (season && episode) {
        searchQuery += ` الموسم ${season} الحلقة ${episode}`;
      }
    }

    // 2. البحث في موقع Krmzy
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(searchUrl, { headers: HEADERS });
    const html = await res.text();

    // 3. استخراج رابط الصفحة الأولى من نتائج البحث
    const linkMatch = html.match(/href="(https?:\/\/[^"]*(?:post|movie|watch|video|series)[^"]*)"/i);
    if (!linkMatch) return [];

    // 4. جلب صفحة العرض واستخراج مشغلات Iframe
    const pageRes = await fetch(linkMatch[1], { headers: HEADERS });
    const pageHtml = await pageRes.text();

    const streams = [];
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
    let match;
    let serverIndex = 1;

    while ((match = iframeRegex.exec(pageHtml)) !== null) {
      let src = match[1];
      if (src.startsWith('//')) src = 'https:' + src;

      streams.push({
        name: "Krmzy",
        title: `سيرفر ${serverIndex++}`,
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

// التصدير الصحيح للتوافق مع Nuvio Provider Interface
if (typeof module !== 'undefined') {
  module.exports = { getStreams };
}
