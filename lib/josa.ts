// 받침에 따라 조사를 고른다. 아이의 가명 뒤에 붙는 '이/가', '은/는'.
const hasFinal = (w: string) => { const c = w.trim().slice(-1); return c >= '가' && c <= '힣' && (c.charCodeAt(0) - 0xac00) % 28 !== 0; };
export const iga = (w: string) => w + (hasFinal(w) ? '이' : '가');
export const eunneun = (w: string) => w + (hasFinal(w) ? '은' : '는');
