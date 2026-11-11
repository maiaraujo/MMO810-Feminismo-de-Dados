/* TAMANHO DA SALA */
const ROOM_SIZE = 50;
/* ESPAÇO ENTRE OS BONECOS*/
const ROOM_SPACING = ROOM_SIZE <= 50 ? 1.45 : 1;

const genderColors = { F: '#7B3294', M: '#F18E04' };
const chalkC = { F: '#7B3294', M: '#F18E04' }; // verde mais claro para ter contraste na lousa

/* Mulheres na Unicamp – app.js */
const $ = (s, r = document) => r.querySelector(s);
// 'Não Declarado' -> 'naodeclarado', 'F' -> 'f': identifica a categoria para o CSS de alto contraste trocar as cores
const slug = k => String(k).normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase();
const fmt = n => n.toLocaleString('pt-BR');
const pct1 = v => (v * 100).toFixed(1).replace('.', ',') + '%';
let DATA;

/* ---------- utilidades ---------- */
// Distribui ROOM_SIZE pessoas pelas categorias (maior resto)
function toHundred(obj) {
  const tot = Object.values(obj).reduce((a, b) => a + b, 0);
  const rows = Object.entries(obj).map(([k, v]) => ({ k, raw: v / tot * ROOM_SIZE }));
  rows.forEach(r => { r.n = Math.floor(r.raw); r.rem = r.raw - r.n; });
  let left = ROOM_SIZE - rows.reduce((a, r) => a + r.n, 0);
  rows.slice().sort((a, b) => b.rem - a.rem).forEach(r => { if (left-- > 0) r.n++; });
  return rows.flatMap(r => Array(r.n).fill(r.k));
}

/* ---------- sala isométrica (SVG) ----------
   theme: 'cor' | 'giz'.  items: array de 100 categorias; colors: {categoria: cor} */
// luminância relativa (WCAG) de uma cor #rrggbb
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => { const v = parseInt(h.slice(i, i + 2), 16) / 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
/* símbolo dentro da cabeça (forma + cor, nunca só cor): 'c' = bolinha, 't' = triângulo, 's' = quadrado.
   Cada gráfico decide se usa: basta passar o mapa `marks` para room()/people2d()/legend(). Hoje só "Alunos - Gênero". */
const genderMarks = { F: 'c', M: 't' };
const ink = col => /^#[0-9a-f]{6}$/i.test(col) && lum(col) > .25 ? '#2b1a00' : '#fff';   // símbolo claro em cor escura, escuro em cor clara
const sym = (marks, k, x, y, r, c) => {
  const m = marks && marks[k], p = v => v.toFixed(2);
  if (m === 'c') return `<circle class="sym" cx="${p(x)}" cy="${p(y)}" r="${p(r * .42)}" fill="${c}"/>`;
  if (m === 's') return `<rect class="sym" x="${p(x - r * .39)}" y="${p(y - r * .39)}" width="${p(r * .78)}" height="${p(r * .78)}" fill="${c}"/>`;
  if (m === 't') { const q = r * .62; return `<polygon class="sym" points="${p(x)},${p(y - q)} ${p(x + q * .866)},${p(y + q * .5)} ${p(x - q * .866)},${p(y + q * .5)}" fill="${c}"/>`; }
  return '';
};
function room(items, colors, theme = 'cor', uid = 'r', chairs = true, big = false, marks = null) {
  /* Sala isométrica flat: paredes, chão, lousa, um espaço livre diante da lousa (área do professor)
     e 10x10 carteiras. Mesa na MESMA cor das paredes, para não chamar mais atenção que as pessoas. */
  const N = 10, ROWS = Math.ceil(items.length / N), GAP = 2.4, SP = ROOM_SPACING, NR = GAP + ROWS * SP, NC = N * SP;          // GAP = profundidade (em carteiras) livre entre a lousa e a 1ª fileira
  const tw = 52, th = 30, H = 130, PAD = 12, ox = NR * tw / 2 + PAD, oy = H + PAD;
  const VW = Math.ceil((NR + NC) * tw / 2 + 2 * PAD), VH = Math.ceil(H + (NR + NC) * th / 2 + 2 * PAD);
  const P = (r, c, z = 0) => [ox + (c - r) * tw / 2, oy + (c + r) * th / 2 - z];
  const pts = a => a.map(p => p.map(v => +v.toFixed(2)).join(',')).join(' ');
  const line = '#b9bfd6', sw = 1.2;
  const floor = '#eceefa', wallL = '#dfe3f3', wallR = '#e8ebf7';
  const chairC = '#cdd2e8';                           // mesa e cadeira: MESMA cor
  const deskTop = chairC, deskSide = chairC;
  const T = P(0, 0), L = P(NR, 0), R = P(0, NC), B = P(NR, NC);   // N = colunas; NR = profundidade (espaço do professor + fileiras)
  let s = `<svg class="room-svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Sala com ${items.length} alunos">`;
  s += `<polygon class="wall-l" points="${pts([T, L, P(NR, 0, H), P(0, 0, H)])}" fill="${wallL}" stroke="${line}" stroke-width="${sw}"/>`;
  s += `<polygon class="wall-r" points="${pts([T, R, P(0, NC, H), P(0, 0, H)])}" fill="${wallR}" stroke="${line}" stroke-width="${sw}"/>`;
  s += `<polygon class="floor" points="${pts([L, B, R, T])}" fill="${floor}" stroke="${line}" stroke-width="${sw}"/>`;
  // lousa na parede do fundo
  s += `<polygon points="${pts([P(0, NC * .25, 100), P(0, NC * .75, 100), P(0, NC * .75, 50), P(0, NC * .25, 50)])}" fill="#fff" stroke="#9aa3c4" stroke-width="${sw + 1}"/>`;
  // slot para ilustrações futuras (parede esquerda)
  s += `<g id="${uid}-slot" data-slot="parede-esquerda"></g>`;
  const box = (cls, r0, r1, c0, c1, z0, z1, fill) =>
    `<g class="${cls}"><polygon points="${pts([P(r1, c0, z1), P(r1, c1, z1), P(r1, c1, z0), P(r1, c0, z0)])}" fill="${fill}" stroke="${line}" stroke-width=".8"/>` +
    `<polygon points="${pts([P(r0, c1, z1), P(r1, c1, z1), P(r1, c1, z0), P(r0, c1, z0)])}" fill="${fill}" stroke="${line}" stroke-width=".8"/>` +
    `<polygon points="${pts([P(r0, c0, z1), P(r0, c1, z1), P(r1, c1, z1), P(r1, c0, z1)])}" fill="${fill}" stroke="${line}" stroke-width=".8"/></g>`;
  // carteiras + pessoas, de trás (perto da lousa) para frente
  const order = items.map((_, i) => i).sort((a, b) => (Math.floor(a / N) + a % N) - (Math.floor(b / N) + b % N));
  order.forEach(i => {
    const half = (SP - 1) / 2, r = GAP + Math.floor(i / N) * SP + half, c = (i % N) * SP + half, col = colors[items[i]] || '#999';
    const [x, y] = P(r + .7, c + .5);                // a pessoa senta logo atrás da própria mesa
    const Lm = /^#[0-9a-f]{6}$/i.test(col) ? lum(col) : 1, lv = Lm < .1 ? ' lo' : Lm < .22 ? ' mid' : '';
    const hr = 7.2, top = y - 36, cy = top - hr - 1;
    // mesa: tampo fino, na frente da pessoa (entre ela e a lousa)
    const r0 = r + .05, r1 = r + .45, c0 = c + .06, c1 = c + .94, z0 = 18, z1 = 23;
    s += `<g class="desk">
      <polygon class="desk-side" points="${pts([P(r1, c0, z1), P(r1, c1, z1), P(r1, c1, z0), P(r1, c0, z0)])}" fill="${deskSide}" stroke="${line}" stroke-width=".8"/>
      <polygon class="desk-side" points="${pts([P(r0, c1, z1), P(r1, c1, z1), P(r1, c1, z0), P(r0, c1, z0)])}" fill="${deskSide}" stroke="${line}" stroke-width=".8"/>
      <polygon class="desk-top" points="${pts([P(r0, c0, z1), P(r0, c1, z1), P(r1, c1, z1), P(r1, c0, z1)])}" fill="${deskTop}" stroke="${line}" stroke-width=".8"/></g>`;
    // cadeira: assento (atrás da mesa, sob a pessoa) e encosto (entre a pessoa e quem olha)
    s += box('seat-part', r + .5, r + .9, c + .2, c + .8, 12, 16, chairC);
    s += `<g class="chair-pop${lv}" data-k="${slug(items[i])}" style="--i:${i};--c:${col}">
      <path d="${body(x - 8, x + 8, top, y - 16, 5.5, 1.5)}" fill="${col}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/>
      <circle cx="${x.toFixed(2)}" cy="${cy.toFixed(2)}" r="${hr}" fill="${col}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/>${sym(marks, items[i], x, cy, hr, ink(col))}</g>`;
    // encosto: UMA face plana (sem extrusão), do nosso lado, nas costas do aluno
    s += `<g class="seat-part"><polygon points="${pts([P(r + .95, c + .18, 33), P(r + .95, c + .82, 33), P(r + .95, c + .82, 15), P(r + .95, c + .18, 15)])}" fill="${chairC}" stroke="${line}" stroke-width=".8" stroke-linejoin="round"/></g>`;
  });
  return s + '</svg>';
}

/* ---------- grade 2D (docentes): UM boneco por docente real, sem escala para 100 ----------
   A grade se ajusta ao total: poucos docentes = bonecos grandes; muitos = bonecos menores e preenchidos. */
const expand = obj => Object.entries(obj).flatMap(([k, v]) => Array(v).fill(k));
// tronco: topo arredondado (rt) e base mais reta (rb; 0 = totalmente reta)
const body = (x0, x1, top, bot, rt, rb = 0) => {
  const p = v => v.toFixed(2), A = (r, x, y) => r ? `A${p(r)},${p(r)} 0 0 1 ${p(x)},${p(y)}` : '';
  return `M${p(x0 + rb)},${p(bot)}` + (rb ? `A${p(rb)},${p(rb)} 0 0 1 ${p(x0)},${p(bot - rb)}` : `L${p(x0)},${p(bot)}`) +
    `V${p(top + rt)}${A(rt, x0 + rt, top)}H${p(x1 - rt)}${A(rt, x1, top + rt)}V${p(bot - rb)}` +
    (rb ? `A${p(rb)},${p(rb)} 0 0 1 ${p(x1 - rb)},${p(bot)}` : '') + 'Z';
};
const torso = (x, y, k) => body(x - 10.6 * k, x + 10.6 * k, y - 6 * k, y + 8 * k, 6 * k, 0);   // ombros largos
function people2d(items, colors, uid = 'p', marks = null) {
  const N = items.length, W = 480, H = 480;
  const cols = Math.max(1, Math.ceil(Math.sqrt(N * W / H))), rows = Math.ceil(N / cols);
  const cell = Math.min(W / cols, H / rows, 62), k = cell / 50, ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2;
  const sw = Math.max(.7, 1.8 * k).toFixed(2), f = v => (v * k).toFixed(2);
  // textura de giz: bordas levemente irregulares (displacement) + falhas de pigmento (ruído como máscara de alfa)
  const defs = `<defs><filter id="${uid}-giz" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="3" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="${(3.5 * Math.max(k, .35)).toFixed(2)}" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -.55" result="grain"/>
    <feComposite in="d" in2="grain" operator="in"/></filter></defs>`;
  let s = `<svg class="room-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${fmt(N)} docentes, um boneco para cada">${defs}<g filter="url(#${uid}-giz)">`;
  items.forEach((cat, i) => {
    const x = ox + (i % cols) * cell + cell / 2, y = oy + Math.floor(i / cols) * cell + cell / 2, col = colors[cat] || '#999';
    const L = /^#[0-9a-f]{6}$/i.test(col) ? lum(col) : 1, lv = L < .1 ? ' lo' : L < .22 ? ' mid' : ''; // cores escuras ganham contorno via CSS
    const st = `fill="${col}" style="stroke:#fff;stroke-width:${sw}px"`; // linha branca em todos
    s += `<g class="chair-pop${lv}" data-k="${slug(cat)}" style="--i:${Math.round(i * 100 / N)};--c:${col}">
      <circle cx="${x.toFixed(2)}" cy="${(y - 15.8 * k).toFixed(2)}" r="${f(8.8)}" ${st}/>
      <path d="${torso(x, y, k)}" ${st}/>${sym(marks, cat, x, y - 15.8 * k, 8.8 * k, ink(col))}</g>`;
  });
  return s + '</g></svg>';
}

const legend = (colors, extra = {}, corner = false, marks = null) => `<div class="legend${corner ? ' legend-corner' + (Object.keys(colors).length > 3 ? ' many' : '') : ''}">${Object.entries(colors).map(([k, c]) =>
  `<span><i data-k="${slug(k)}" style="background:${c};--ink:${ink(c)}">${marks && marks[k] ? `<b class="${marks[k]}"></b>` : ''}</i>${extra[k] ?? k}</span>`).join('')}</div>`;

const chev = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
/* ---------- slider genérico (Bootstrap carousel + abas com título) ---------- */
function slider(el, id, slides, timeline = false) {
  const tabs = slides.map((s, i) => timeline
    ? `<button type="button" class="${i ? '' : 'active'}" data-bs-target="#${id}" data-bs-slide-to="${i}" aria-label="${s.label} (${s.year})"><span class="dot"></span><span class="tl-year">${s.year}</span><span class="tl-label">${s.label}</span></button>`
    : `<button type="button" class="${i ? '' : 'active'}" data-bs-target="#${id}" data-bs-slide-to="${i}">${s.tab}</button>`).join('');
  const items = slides.map((s, i) => `<div class="carousel-item ${i ? '' : 'active'}">${s.html}</div>`).join('');
  el.innerHTML = `<div class="slider-tabs${timeline ? ' timeline' : ''}" ${timeline ? 'role="group" aria-label="Linha do tempo"' : ''}>${tabs}</div>
   <div id="${id}" class="carousel slide" data-bs-ride="false" data-bs-interval="false">
     <div class="carousel-inner">${items}</div>
     <button class="carousel-control-prev" data-bs-target="#${id}" data-bs-slide="prev" aria-label="Anterior"><span class="carousel-control-prev-icon"></span></button>
     <button class="carousel-control-next" data-bs-target="#${id}" data-bs-slide="next" aria-label="Próximo"><span class="carousel-control-next-icon"></span></button>
   </div>
   <div class="slider-bar" role="group" aria-label="Navegar entre os slides">
     <button type="button" class="sb-btn" data-bs-target="#${id}" data-bs-slide="prev" aria-label="Slide anterior">${chev('M15 5l-7 7 7 7')}<span>Anterior</span></button>
     <span class="sb-count" aria-live="polite"><b>1</b> / ${slides.length}</span>
     <button type="button" class="sb-btn" data-bs-target="#${id}" data-bs-slide="next" aria-label="Próximo slide"><span>Próximo</span>${chev('M9 5l7 7-7 7')}</button>
   </div>`;
  const c = $('#' + id, el), cnt = $('.sb-count b', el);
  const mark = to => el.querySelectorAll('.slider-tabs button').forEach((b, i) => {
    if (cnt) cnt.textContent = to + 1;
    b.classList.toggle('active', i === to);
    b.classList.toggle('done', timeline && i <= to);
  });
  c.addEventListener('slide.bs.carousel', e => { mark(e.to); el.classList.add('used'); }); // 'used' desliga a pulsação de aviso
  mark(0);
}

/* caixinhas de texto: `txt` pode ser string ou lista. A 1ª caixa leva o número grande (big + legenda cap);
   as demais (.sub) ficam empilhadas embaixo, sem animação, para leitura confortável. */
const note = (txt, big, cap) => `<div class="notes" role="group" aria-label="Informações sobre este recorte">${[].concat(txt).map((t, i) =>
  `<div class="note-box${i ? ' sub' : ''}">${i === 0 && big ? `<div class="big">${big}${cap ? `<span class="big-cap">${cap}</span>` : ''}</div>` : ''}<p class="mb-0">${t}</p></div>`).join('')}</div>`;
/* rótulo dos botões: "Computação (IC)" – mesmo nome usado nos gráficos de barras */
const unitTab = u => u === 'UNICAMP' ? 'Unicamp' : `${DATA.unidades[u].nome} (${u})`;
const genderLegend = { F: 'Feminino', M: 'Masculino' };

/* ---------- barras (alunos e docentes) ----------
   rows: [{s, nome, F, tot, p}] ; o grupo (cuidado/lógica) vem de DATA.unidades */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function buildBars(sectionId, cfg, rows, split = 'unidade') {
  const root = document.getElementById(sectionId), RH = 30;
  // 'unidade': grupo definido em DATA.unidades; 'propria': maioria feminina (>= 50%) dos próprios dados do gráfico
  const gOrder = r => split === 'nenhum' ? 0 : (split === 'propria' ? r.p >= .5 : DATA.unidades[r.s].grupo === 'cuidado') ? 0 : 1;
  rows.sort((a, b) => gOrder(a) - gOrder(b) || b.p - a.p);
  const gap = p => (5 + (1 - p) * 11).toFixed(1); // textura de linhas a 45°: distância entre linhas (px); mais mulheres = linhas mais próximas
  const [fr, fg, fb] = hex(genderColors.F), [mr, mg, mb] = hex(genderColors.M);
  const col = p => { // laranja (poucas mulheres) -> verde (muitas mulheres)
    const t = Math.min(1, Math.max(0, (p - .15) / .72));
    const m = (a, b) => Math.round(a + (b - a) * t);
    return `rgb(${m(mr, fr)},${m(mg, fg)},${m(mb, fb)})`;
  };
  if (split === 'nenhum') { // sem setas: só ordena pela % de mulheres
    $('.arrow-col', root).hidden = true;
    $('.bars-grid', root).style.gridTemplateColumns = 'minmax(0,1fr)';
  } else {
    const nC = rows.filter(r => gOrder(r) === 0).length, nL = rows.length - nC;
    const care = $('.arrow-care', root), logic = $('.arrow-logic', root);
    care.querySelector('span').textContent = cfg.caixa_cuidado;
    logic.querySelector('span').textContent = cfg.caixa_logica;
    Object.assign(care.style, { top: '0px', height: nC * RH - 6 + 'px' });
    Object.assign(logic.style, { top: nC * RH + 6 + 'px', height: nL * RH - 6 + 'px' });
  }
  $('.ticks', root).innerHTML = [0, 20, 40, 60, 80, 100].map(t => `<span style="left:${t / 1.2}%">${t}</span>`).join('');
  $('.bars-rows', root).innerHTML = rows.map((r, i) => `
    <div class="bar-row${r.p >= .5 ? ' up' : ''}" style="--d:${i * 70}ms">
      <div class="bar-label">${r.s} (${r.nome})</div>
      <div class="bar-track"><span class="mid"></span>
        <div class="bar-fill" style="--w:${r.p * 100 / 1.2}%;--c:${col(r.p)};--s:${gap(r.p)}px;transition-delay:${i * 70}ms"></div>
        <span class="bar-val" style="left:calc(${r.p * 100 / 1.2}% + 8px);--d:${i * 70}ms">${r.p >= .5 ? '▲' : '▼'} ${pct1(r.p)} (${fmt(r.F)} de ${fmt(r.tot)})</span>
      </div></div>`).join('');
}

/* pág. 1: alunas por instituto */
function buildBarsAlunos() {
  const cfg = DATA.paginas.barras, ano = String(cfg.ano);
  buildBars('barras', cfg, Object.entries(DATA.dados.alunos_genero).map(([s, y]) => {
    const a = y[ano], tot = a.F + a.M;
    return { s, nome: DATA.unidades[s].nome, F: a.F, tot, p: a.F / tot };
  }));
}

/* pág. 4: docentes mulheres por instituto (carreira MS, total de regimes) */
function buildBarsDocentes() {
  const cfg = DATA.paginas['barras-prof'], ano = String(cfg.ano);
  buildBars('barras-prof', cfg, Object.entries(DATA.dados.docentes_genero).map(([s, y]) => {
    const d = y[ano].TOTAL, tot = d.F + d.M;
    return { s, nome: DATA.unidades[s].nome, F: d.F, tot, p: d.F / tot };
  }), 'nenhum');
}
/* ---------- pág. 2: gênero por instituto (alunos) ---------- */
function buildGenero() {
  const cfg = DATA.paginas.genero, ano = String(cfg.ano);
  slider($('#sliderGenero'), 'carGenero', cfg.slides.map(sl => {
    const a = DATA.dados.alunos_genero[sl.unidade][ano], tot = a.F + a.M;
    return { tab: unitTab(sl.unidade), html: `<div class="slide-grid">
      <div class="room-box has-corner">${legend(genderColors, genderLegend, true, genderMarks)}${room(toHundred({ F: a.F, M: a.M }), genderColors, 'cor', 'g' + sl.unidade, true, false, genderMarks)}
        <p class="room-cap">Se o ${sl.unidade} tivesse ${ROOM_SIZE} alunos (${fmt(a.F)} F | ${fmt(a.M)} M)</p></div>
      ${note(sl.nota, pct1(a.F / tot), 'de mulheres entre os alunos')}</div>` };
  }));
}

/* ---------- pág. 3: raça/cor ---------- */
function buildRaca() {
  const cfg = DATA.paginas.raca, cores = DATA.cores_raca;
  slider($('#sliderRaca'), 'carRaca', cfg.slides.map((sl, i) => {
    const d = DATA.dados.alunos_raca_unicamp[sl.ano];
    return { label: sl.rotulo, year: sl.ano, html: `<div class="slide-grid">
      <div class="room-box has-corner">${legend(cores, {}, true)}${room(toHundred(d), cores, 'cor', 'ra' + i)}
        <p class="room-cap">Se a Unicamp tivesse ${ROOM_SIZE} alunos em ${sl.ano}</p></div>
      ${note(sl.nota, pct1(d.Preta + d.Parda), 'de pretos e pardos entre os alunos')}</div>` };
  }), true);
}

/* ---------- pág. 4: lousa (somente docentes) ---------- */
function buildLousa() {
  const cfg = DATA.paginas.lousa, ano = String(cfg.ano);
  slider($('#sliderLousa'), 'carLousa', cfg.slides.map(sl => {
    const d = DATA.dados.docentes_genero[sl.unidade][ano].TOTAL;
    return { tab: unitTab(sl.unidade), html: `
      <div class="room-box board-wide">
        <div>
          ${people2d(expand({ F: d.F, M: d.M }), chalkC, 'ld' + sl.unidade)}
          <p class="room-cap">${sl.unidade}: ${fmt(d.F + d.M)} docentes, um boneco para cada</p>
          ${legend(chalkC, { F: `Feminino (${fmt(d.F)})`, M: `Masculino (${fmt(d.M)})` })}
        </div>
        ${note(sl.nota, pct1(d.F / (d.F + d.M)), 'de mulheres entre os docentes – ' + sl.unidade)}
      </div>` };
  }));
}

/* ---------- pág. 6: lousa – raça/cor dos docentes ---------- */
function buildRacaDocentes() {
  const cfg = DATA.paginas['raca-prof'], ano = String(cfg.ano), cores = DATA.cores_raca;
  slider($('#sliderRacaProf'), 'carRacaProf', cfg.slides.map((sl, i) => {
    const d = DATA.dados.docentes_raca[sl.unidade][ano], tot = Object.values(d).reduce((a, b) => a + b, 0);
    const quem = sl.unidade === 'UNICAMP' ? 'a Unicamp' : 'o ' + sl.unidade;
    // destaque: categoria(s) do número grande (padrão: pretos e pardos). rotulo: linha pequena acima do nome na aba
    const grp = sl.destaque || ['Preta', 'Parda'], big = grp.reduce((a, k) => a + (d[k] || 0), 0) / tot;
    return { tab: (sl.rotulo ? `<span class="kick">${sl.rotulo}</span>` : '') + unitTab(sl.unidade), html: `
      <div class="room-box board-wide">
        <div>
          ${people2d(expand(d), cores, 'rp' + i)}
          <p class="room-cap">${sl.unidade === 'UNICAMP' ? 'Unicamp' : sl.unidade}: ${fmt(tot)} docentes em ${ano}, um boneco para cada</p>
          ${legend(cores, Object.fromEntries(Object.keys(cores).map(c => [c, `${c} (${fmt(d[c] || 0)})`])))}
        </div>
        ${note(sl.nota, pct1(big), sl.destaque_rotulo || 'de pretos e pardos entre os docentes')}
      </div>` };
  }));
}

/* ---------- página única: scroll suave (CSS), anima ao entrar na tela, destaca o menu ---------- */
function setupScroll() {
  const links = [...document.querySelectorAll('#globalNav .nav-link')];
  const menu = window.bootstrap ? bootstrap.Collapse.getOrCreateInstance('#menu', { toggle: false }) : { hide() {} };
  links.forEach(a => a.addEventListener('click', () => { if (innerWidth < 1400) menu.hide(); }));
  const secs = [...document.querySelectorAll('.page')];
  // animações tocam só na 1ª vez em que a seção aparece (nunca removemos 'in'/'play')
  const anim = new IntersectionObserver((es, obs) => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    const bw = e.target.querySelector('.bars-wrap'); if (bw) bw.classList.add('play');
    // só o slide visível anima; os demais já ficam prontos, então trocar de slide não repete a animação
    e.target.querySelectorAll('.carousel-item:not(.active) .chair-pop').forEach(g => g.classList.add('popped'));
    obs.unobserve(e.target);
  }), { threshold: .25 });
  // cada boneco, depois de animar, fica fixo: trocar de slide do carrossel não repete a animação
  document.addEventListener('animationend', e => { if (e.target.classList?.contains('chair-pop')) e.target.classList.add('popped'); });
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => { anim.observe(s); spy.observe(s); });
}

/* ---------- páginas de abertura: fundo fixo (CSS) + texto que sobe em parallax ----------
   O texto anda um pouco mais rápido que a rolagem e aparece/some suavemente.
   Em alto contraste ou com prefers-reduced-motion, fica parado e sem efeito. */
function setupHero() {
  const heroes = [...document.querySelectorAll('.hero')];
  if (!heroes.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let queued = false;
  const update = () => {
    queued = false;
    const off = root.classList.contains('hc') || reduce.matches, vh = innerHeight;
    heroes.forEach(h => {
      const inner = h.querySelector('.hero-inner');
      if (off) { inner.style.transform = ''; inner.style.opacity = ''; return; }
      const r = h.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const mid = r.top + r.height / 2 - vh / 2; // >0: a seção ainda está abaixo do centro da tela
      inner.style.transform = `translate3d(0,${(mid * .35).toFixed(1)}px,0)`;
      inner.style.opacity = Math.max(0, Math.min(1, 1.35 - Math.abs(mid) / (vh * .55))).toFixed(2);
    });
  };
  const req = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  new MutationObserver(req).observe(root, { attributes: true, attributeFilter: ['class'] });
  update();
}

/* ---------- tema: claro | escuro | alto contraste (lembra a escolha) ----------
   Sem escolha salva: segue prefers-contrast / prefers-color-scheme do sistema. */
function setupTheme() {
  const root = document.documentElement, btns = [...document.querySelectorAll('.theme-btn')];
  let saved = null; try { saved = localStorage.getItem('theme'); } catch (e) {}
  const sys = () => matchMedia('(prefers-contrast: more)').matches ? 'hc' : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let cur = ['light', 'dark', 'hc'].includes(saved) ? saved : sys();
  let prev = cur === 'hc' ? 'light' : cur; // para onde volta ao desligar o alto contraste
  const apply = t => {
    cur = t; if (t !== 'hc') prev = t;
    root.classList.toggle('hc', t === 'hc'); root.classList.toggle('dark', t === 'dark');
    btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === t));
    try { localStorage.setItem('theme', t); } catch (e) {}
  };
  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.theme === 'hc' && cur === 'hc' ? prev : b.dataset.theme)));
  apply(cur);
}
setupTheme();

fetch('data/data.json').then(r => r.json()).then(j => {
  DATA = j;
  document.querySelectorAll('[data-title]').forEach(h => h.textContent = DATA.paginas[h.closest('section').id].titulo);
  document.querySelectorAll('[data-sub]').forEach(p => { const t = DATA.paginas[p.closest('section').id].sub; if (t) { p.textContent = t; p.hidden = false; } });
  buildBarsAlunos(); buildGenero(); buildRaca(); buildBarsDocentes(); buildLousa(); buildRacaDocentes();
  setupScroll(); setupHero();
}).catch(e => document.querySelector('main').innerHTML = `<div class="alert alert-danger">Não foi possível carregar data/data.json (abra por um servidor, não por file://). ${e}</div>`);