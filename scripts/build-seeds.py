# 학생용 전권 HTML과 씨앗데이터_v3.json에서 사이트의 씨앗 데이터를 만든다.
# 사용: python3 scripts/build-seeds.py <학생용_전권.html> <씨앗데이터_v3.json>
import json, re, sys
from bs4 import BeautifulSoup

html_path, json_path = sys.argv[1], sys.argv[2]
soup = BeautifulSoup(open(html_path, encoding='utf-8').read(), 'html.parser')
raw = json.load(open(json_path, encoding='utf-8'))
T = lambda el: re.sub(r'\s+', ' ', el.get_text(' ', strip=True)).strip() if el else ''

pages = soup.select('section.page')
seeds, cur = [], None
for p in pages:
    h1 = p.find('h1')
    if h1 and p.find(string=re.compile('번째 씨앗')) and p.find(string=re.compile('오늘의 사물')):
        cur = {'pages': [p]}; seeds.append(cur); continue
    if cur is not None: cur['pages'].append(p)
assert len(seeds) == 23, len(seeds)

def batchim(word):
    c = word[-1]
    return '가' <= c <= '힣' and (ord(c) - 0xAC00) % 28 != 0

out = []
for idx, s in enumerate(seeds, 1):
    r = raw[str(idx)]
    cover = s['pages'][0]
    caution = T(cover.select_one('.box.tint p'))
    by = {}
    for p in s['pages'][1:]:
        tag = p.select_one('.runhead .tag')
        by.setdefault(T(tag), []).append(p)
    def page(key):
        for k, v in by.items():
            if key in k: return v[0]
        raise KeyError(f'{idx} {key} {list(by)}')
    story = [T(x) for x in page('이야기 씨앗').select('.box p')]
    sense_pg = page('감각 상상')
    sense = [re.sub(r'^[①②③④]\s*', '', T(q)) for q in sense_pg.select('p.q') if re.match(r'^[①②③④]', T(q))]
    carry = T(sense_pg.select('.carry')[-1])
    labels = [x.strip() for x in re.findall(r'□\s*[①②③④]\s*([^□]+)', carry)]
    head_pg = page('표제어')
    examples = []
    for el in head_pg.find_all(string=re.compile('·')):
        t = el.strip()
        if t.count('·') >= 2 and len(t) < 120: examples = [x.strip() for x in t.split('·')]; break
    obj = r['사물']
    josa = '은' if batchim(obj) else '는'; josa2 = '이' if batchim(obj) else '가'
    guide = re.sub(r'“[^”]*은/는 ~다” 또는 “[^”]*이/가 ~다”', f'“{obj}{josa} ~다” 또는 “{obj}{josa2} ~다”', r['표제어안내'])
    jungle_pg = page('여섯 · 정글')
    jtitle = T(jungle_pg.select_one('.step h2'))
    jex = ''
    for el in jungle_pg.find_all(string=re.compile('예시')):
        par = el.find_parent(['p', 'div'])
        if par: jex = re.sub(r'^예시\s*·\s*[^—]*—\s*', '', T(par)); break
    plan_pg = page('위에서 내려다보기')
    svg = plan_pg.find('svg')
    center = T(svg.find('rect').find_next('text'))
    ring = [T(t) for t in svg.find_all('text', recursive=False)][1:]
    g = svg.find('g')
    side = [(t.get('text-anchor') == 'end', T(t)) for t in g.find_all('text')] if g else []
    plan = {'center': center, 'rings': ring, 'left': [t for e, t in side if not e], 'right': [t for e, t in side if e]}
    nong_pg = page('아홉 · 논글')
    issues = [T(li) for li in nong_pg.select('ul.check li')]
    prop_pg = page('열 · 명제')
    pex = re.findall(r'“([^”]+)”', T(prop_pg.select_one('.box.tint')))
    other_pg = page('열하나')
    seats = []
    for tr in other_pg.select('table tr'):
        tds = tr.find_all('td')
        if len(tds) >= 2: seats.append({'seat': T(tds[0]), 'who': T(tds[1])})
    # 교사 전용: 교사가 볼 것, 정글설정의 예시답안, 도식 설명
    setting, answers = {}, []
    for x in r['정글설정']:
        m = re.match(r'^(공간 설정|인물 설정|주동 인물|반동 인물|행위 설정|구성)(.*)$', x)
        if m: setting[m.group(1)] = m.group(2).strip()
        elif len(x) > 60 and not x.startswith('감각 상상') and not x.startswith('내가 써 보는'): answers.append(x)
    out.append({
        'n': idx, 'title': r['제목'], 'era': r['연대'], 'object': obj, 'caution': caution,
        'story': story, 'sense': sense, 'senseLabels': labels, 'headwordGuide': guide,
        'headwordExamples': examples, 'jungleTitle': jtitle, 'jungleExample': jex,
        'plan': plan, 'issues': issues, 'propositionExamples': pex, 'seats': seats,
        'topic': r['주제설정'],
        'teacher': {'note': r['교사가볼것'], 'diagram': r['도식'], 'setting': setting, 'answers': answers},
    })

json.dump(out, open('data/seeds.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for s in out:
    print(s['n'], s['object'], len(s['story']), len(s['sense']), len(s['senseLabels']), len(s['headwordExamples']), len(s['issues']), len(s['propositionExamples']), len(s['seats']), len(s['plan']['rings']), len(s['plan']['left']), len(s['plan']['right']), bool(s['jungleExample']), len(s['teacher']['answers']))
