/**
 * Nuvio Provider Template
 * Compatible with Nuvio App
 */

// 1. إعدادات الهيدرز لتجاوز الحظر و Cloudflare
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
  'Connection': 'keep-alive'
};

// 2. قائمة بالنطاقات المحتملة للموقع
const BASE_DOMAINS = [
  'https://krmzy.net',
  'https://krmzy.org',
  'https://krmzy.tv'
];

// دالة التحقق من النطاق الشغال
async function getActiveDomain() {
  for (const domain of BASE_DOMAINS) {
    try {
      const res = await fetch(domain, { method: 'HEAD', headers: DEFAULT_HEADERS });
      if (res.ok) return domain;
    } catch (e) {
      continue;
    }
  }
  return BASE_DOMAINS[0]; // النطاق الافتراضي
}

// 3. الدالة الرئيسية التي يستدعيها Nuvio للجلب
async function getStreams(item) {
  const streams = [];
  const domain = await getActiveDomain();
  const searchTitle = encodeURIComponent(item.title);

  try {
    // أ) إجراء البحث في الموقع
    const searchUrl = `${domain}/?s=${searchTitle}`;
    const searchRes = await fetch(searchUrl, { 
      headers: { ...DEFAULT_HEADERS, 'Referer': domain } 
    });
    const searchHtml = await searchRes.text();

    // ب) استخراج رابط أول نتيجة من صفحة البحث (Regex)
    const linkMatch = searchHtml.match(/href="(https?:\/\/[^\"]*(?:post|movie|watch|video|series)[^\"]*)"/i);
    if (!linkMatch) return [];

    const targetPageUrl = linkMatch[1];

    // ج) جلب صفحة المشاهدة
    const pageRes = await fetch(targetPageUrl, { 
      headers: { ...DEFAULT_HEADERS, 'Referer': searchUrl } 
    });
    const pageHtml = await pageRes.text();

    // د) استخراج مشغلات الفيديو والـ iFrames
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = iframeRegex.exec(pageHtml)) !== null) {
      let srcUrl = match[1];

      // تصحيح الروابط النسبية
      if (srcUrl.startsWith('//')) {
        srcUrl = 'https:' + srcUrl;
      }

      // تصفية الروابط المستخرجة لتجنب الإعلانات
      if (srcUrl.includes('player') || srcUrl.includes('embed') || srcUrl.includes('v=')) {
        streams.push({
          name: "سيرفر عربي (Krmzy)",
          title: `${item.title} - 1080p / 720p`,
          url: srcUrl,
          quality: "1080p",
          headers: {
            'Referer': targetPageUrl,
            'User-Agent': DEFAULT_HEADERS['User-Agent']
          }
        });
      }
    }

    return streams;

  } catch (error) {
    console.error("Nuvio Provider Error:", error);
    return [];
  }
}
