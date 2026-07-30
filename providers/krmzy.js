/**
 * Nuvio Provider Script - Krmzy Arabic
 * Domain: https://krmzi.org
 */

const BASE_URL = 'https://krmzi.org';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Referer': `${BASE_URL}/`,
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
};

async function getStreams(item) {
  const streams = [];
  
  try {
    // 1. البحث عن عنوان الفيلم/المسلسل في الموقع
    const searchQuery = encodeURIComponent(item.title || item.name);
    const searchUrl = `${BASE_URL}/?s=${searchQuery}`;
    
    const searchResponse = await fetch(searchUrl, { headers: DEFAULT_HEADERS });
    if (!searchResponse.ok) return [];
    
    const searchHtml = await searchResponse.text();

    // 2. استخراج رابط صفحة العرض الأولى من نتائج البحث
    const linkRegex = /<a[^>]+href="(https?:\/\/[^"]*(?:post|movie|watch|video|series|film)[^"]*)"[^>]*>/gi;
    const match = linkRegex.exec(searchHtml);
    
    if (!match || !match[1]) return [];
    const pageUrl = match[1];

    // 3. جلب صفحة المشاهدة
    const pageResponse = await fetch(pageUrl, { headers: DEFAULT_HEADERS });
    if (!pageResponse.ok) return [];
    
    const pageHtml = await pageResponse.text();

    // 4. استخراج روابط المشاهدة والسيرفرات من داخل iframes
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
    let iframeMatch;
    let counter = 1;

    while ((iframeMatch = iframeRegex.exec(pageHtml)) !== null) {
      let streamUrl = iframeMatch[1];
      
      // تصحيح الروابط النسبية
      if (streamUrl.startsWith('//')) {
        streamUrl = 'https:' + streamUrl;
      } else if (streamUrl.startsWith('/')) {
        streamUrl = BASE_URL + streamUrl;
      }

      // إستبعاد الإعلانات السريعة
      if (streamUrl.includes('facebook') || streamUrl.includes('google') || streamUrl.includes('twitter')) {
        continue;
      }

      streams.push({
        name: `Krmzy Server ${counter}`,
        title: `${item.title || 'Movie'} - 1080p`,
        url: streamUrl,
        quality: "1080p",
        headers: DEFAULT_HEADERS
      });

      counter++;
    }

    return streams;

  } catch (error) {
    console.error("Krmzy Provider Error:", error);
    return [];
  }
}
