import type { MetadataRoute } from 'next';

// 아이들의 글이 있는 서가는 검색 엔진과 AI 수집기가 가져가지 못하게 한다. 소개 화면만 연다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'CCBot', 'Google-Extended', 'PerplexityBot', 'Bytespider'], disallow: '/' },
      { userAgent: '*', allow: ['/$', '/about', '/classes', '/seeds', '/contact', '/privacy'], disallow: ['/jungle', '/write', '/path', '/family', '/book', '/teacher', '/admin', '/api'] },
    ],
  };
}
