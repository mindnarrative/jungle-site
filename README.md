# 이야기 정글

정서를 담은 글짓기(정글) · 논리를 담은 글짓기(논글). 아이가 역사의 한 장면을 안에서 한 번(정글), 밖에서 한 번(논글) 쓰고, 그 글이 다른 아이에게 읽히는 서가.

- Next.js 15 (App Router) · React 19 · TypeScript
- 저장소: Upstash Redis(Vercel KV). 환경 변수가 없으면 `.data/store.json` 파일에 저장(로컬 개발용)

## 배포 (Vercel)

1. Vercel → Add New → Project → `mindnarrative/jungle-site` 가져오기
2. Storage 탭 → Upstash Redis 연결(환경 변수 `KV_REST_API_URL`, `KV_REST_API_TOKEN`이 자동으로 들어감)
3. Settings → Environment Variables

| 이름 | 필수 | 설명 |
|---|---|---|
| `SESSION_SECRET` | 필수 | 32자 이상 임의 문자열(로그인 쿠키 서명) |
| `ADMIN_PASSWORD` | 필수 | 8자 이상. 본사 로그인 비밀번호 |
| `JUNGLE_HQ_URL` | 선택 | 성향분석기(jungle_hq) 서버 주소 |
| `JUNGLE_HQ_KEY` | 선택 | 분석 서버의 가맹 키(`X-Franchise-Key`) |

4. Redeploy

## 계정 만드는 순서

회원가입은 없습니다.

1. `/login`에서 아이디 `admin`, 비밀번호 `ADMIN_PASSWORD`로 본사 로그인
2. `/admin`에서 교사 계정과 반을 만듦
3. 교사가 `/teacher` → 반 → 학생 계정(실명·가명·학년)과 보호자 계정을 만듦. 보호자 서면 동의를 받으면 ‘동의’ 기록
4. 학생은 `/write`에서 씨앗을 열어 11지면을 씀. 종이에 쓴 글은 교사가 ‘대신 넣기’로 옮김

## 서가 규칙

- 추천은 글을 끝까지 읽은 학생만, 한 글에 한 번, 자기 글에는 못 함
- 높이 = Σ 0.5^(추천 후 지난 날 / 7). 아이에게는 숫자 대신 칸(윗칸·가운데·아랫칸·새로 들어온 글)만 보임
- 같은 씨앗의 남의 글은 자기 정글 초고를 낸 뒤에 열림
- 서가에 오르는 조건: 보호자 동의 + 미션 1·2 통과 + 정글 초고. 올라간 글은 그때의 사본

## 씨앗 데이터 다시 만들기

```
python3 scripts/build-seeds.py <세계사정글_서양사편_학생용_전권.html> <씨앗데이터_v3.json>
```

`data/seeds.json`이 새로 써집니다. 교사용 필드(`teacher`)는 교사·본사에게만 보입니다.

## 남은 일

- 장면의 ‘다섯 반응’ 이름: v3 원본에 없어 비워 둠
- 21~23번 씨앗의 한국사 장면은 이후 한국사편으로 옮길 예정
- 연작 소설은 가명 처리 뒤에 넣기
- 이용약관·개인정보처리방침 법률 검토
