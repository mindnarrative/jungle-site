/** @type {import('next').NextConfig} */
const noIndex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, noai, noimageai' }];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    // 아이들의 글이 보이는 화면과 모든 API는 검색 엔진·AI 수집기가 저장하지 못하게 한다.
    return ['/jungle/:path*', '/jungle', '/write/:path*', '/path', '/family/:path*', '/book/:path*', '/teacher/:path*', '/admin', '/login']
      .map((source) => ({ source, headers: noIndex }))
      .concat([{ source: '/api/:path*', headers: [...noIndex, { key: 'Cache-Control', value: 'no-store' }] }]);
  },
};

export default nextConfig;
