"use strict";

/* ==========================================================================
   CONFIGURAÇÃO — único sítio a editar por cliente (preços, módulos, cores).
   ========================================================================== */
const CONFIG = {
  // Preços em euros, IVA incluído (preçário Bica a Bica). Total = tipo de agenda + extras escolhidos.
  // O ano e o mês de início não mexem no preço: são sempre 12 meses.
  years: [2027, 2028],
  nameMax: 18,
  // Tipos de agenda (preço base). "includes": os módulos que já vêm no preço (não se escolhem nem se pagam à parte).
  // A agenda é uma pasta A5 transparente de 6 argolas; a cor e o padrão da capa não têm custo.
  types: {
    agenda:  { label: "Agenda semanal", price: 29.9, includes: ["mensal", "semanal", "notas"] },
    diaria:  { label: "Agenda diária",  price: 40,   includes: ["mensal", "diario", "notas"] },
    recarga: { label: "Só recarga (folhas, sem pasta)", price: 24.9, includes: ["mensal", "semanal", "notas"] },
  },
  cover: { engravePrice: 3 },
  months: [
    ["Jan", "janeiro"], ["Fev", "fevereiro"], ["Mar", "março"], ["Abr", "abril"],
    ["Mai", "maio"], ["Jun", "junho"], ["Jul", "julho"], ["Ago", "agosto"],
    ["Set", "setembro"], ["Out", "outubro"], ["Nov", "novembro"], ["Dez", "dezembro"],
  ],
  colors: [
    // "pattern": estampa desenhada sobre a cor. "spine" e "text" afinam a lombada e a cor do nome gravado.
    { id: "florida", label: "Florida", hex: "#2F4A3C", pattern: "flowers" },
    { id: "azulejo", label: "Azulejo", hex: "#FBF8F1", pattern: "azulejo", spine: "#3E5F8A", text: "#3E5F8A" },
    { id: "azul",    label: "Azul",    hex: "#3E5F8A" },
    { id: "salva",   label: "Salva",   hex: "#A9B79C" },
    { id: "caqui",   label: "Caqui",   hex: "#C9B99A" },
    { id: "cafe",    label: "Café",    hex: "#4A3426" },
    { id: "po",      label: "Pó",      hex: "#ABBBC7" },
  ],
  modules: [
    // Os quatro primeiros vêm com o tipo de agenda (ver "types"). "extra": módulo opcional, com preço.
    { id: "mensal",   label: "Vista mensal",      tab: "mês", color: "#3E5F8A", desc: "Um mês em duas páginas, para ver o quadro geral." },
    { id: "semanal",  label: "Semanal",           tab: "sem", color: "#C9B99A", desc: "Sete dias por dupla de páginas, com espaço para escrever." },
    { id: "diario",   label: "Diário",            tab: "dia", color: "#4A3426", desc: "Uma página por dia, com marcações." },
    { id: "notas",    label: "Notas pontilhadas", tab: "not", color: "#A9B79C", desc: "Folhas pontilhadas livres para listas, esboços e ideias." },
    { id: "habitos",  label: "Tracker de hábitos", tab: "háb", extra: true, price: 2,   color: "#ABBBC7", desc: "Grelha mensal para marcar o que repetes todos os dias." },
    { id: "financas", label: "Finanças",          tab: "fin", extra: true, price: 2,   color: "#2F4A3C", desc: "Registo de despesas e orçamento mês a mês." },
    { id: "leituras", label: "Leituras",          tab: "lei", extra: true, price: 1.5, color: "#7F6048", desc: "Lista do que lês, com espaço para notas." },
  ],
  finishes: [
    { id: "separadores", label: "Separadores de cartolina", price: 2, desc: "Um por módulo e por mês." },
    { id: "caneta",      label: "Suporte de caneta",        price: 2, desc: "Passador na pasta para guardares a tua caneta.", coverOnly: true },
    { id: "bolsa",       label: "Bolsa transparente com fecho", price: 2, desc: "Para guardar papéis soltos e cartões." },
    { id: "stickers",    label: "Folha de stickers",        price: 3, desc: "Chávenas, corações, laços e etiquetas como \"to-do\" e \"compras\"." },
  ],
  // Conjuntos (sobre a agenda semanal): só os extras, porque os módulos base já vêm no preço.
  sets: [
    { id: "essencial", label: "Essencial", modules: [], finishes: [] },
    { id: "organizada", label: "Organizada", modules: [], finishes: ["separadores"] },
    { id: "completa", label: "Completa", modules: ["habitos", "financas"], finishes: ["separadores", "caneta"] },
  ],
  // Desenhos à mão da cliente. "needs": onde se aplica (a capa ou um módulo). "aspect" = largura / altura da área.
  drawings: [
    { id: "capa",    label: "Desenho na capa",            price: 4, aspect: 250 / 446, needs: "cover",   help: "Desenha na capa. A etiqueta do ano fica ao centro, por cima do desenho." },
    { id: "semanal", label: "Desenho no topo do semanal", price: 2, aspect: 148 / 40,  needs: "semanal", help: "Este desenho repete-se no cimo de todas as páginas do semanal." },
  ],
  // Alojamento de imagens grátis (Cloudinary, upload sem assinatura): o email do pedido leva o link do desenho.
  // Sem estes dois valores o desenho não é enviado; a cliente descarrega-o no fim do pedido.
  upload: { cloudName: "", uploadPreset: "" },
  // Pedidos por email via Web3Forms (web3forms.com). Cola aqui a "Access Key" do cliente.
  // Com a chave vazia o envio é só simulado (útil para demos).
  orders: { accessKey: "5d6722e8-49a0-4b9b-988f-6f8cf4d0568d", subject: "Novo pedido bica a bica" },
  base: { mode: "agenda", color: "florida", name: "", year: 2027, start: 0, modules: [], finishes: [], drawings: { capa: null, semanal: null } },
};

/* ==========================================================================
   Utilitários
   ========================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => `${n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00a0€`;
const priceText = (n) => (n ? money(n) : "incluído");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const byId = (list, id) => list.find((x) => x.id === id);
const clone = (o) => JSON.parse(JSON.stringify(o));

const INK = "#2F4A3C", PAPER = "#F4EDE1";
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex) => {
  const [r, g, b] = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const onColor = (hex) => (ratio(hex, INK) >= ratio(hex, PAPER) ? INK : PAPER);
const mix = (hex, to, t) => "#" + rgb(hex).map((v, i) => Math.round(v + (to[i] - v) * t).toString(16).padStart(2, "0")).join("");
const isDark = (hex) => lum(hex) < 0.12;

/* ==========================================================================
   Estado, preço e persistência
   ========================================================================== */
const STORE_KEY = "bicabica-builder-v1";
let state = load();

/** Valida um desenho guardado (pontos entre 0 e 1) para não confiar no que vem do localStorage. */
function cleanDrawing(x) {
  if (!x || !Array.isArray(x.strokes)) return null;
  const n = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const strokes = x.strokes.slice(0, 400).map((s) => ({
    c: s && /^#[0-9a-f]{6}$/i.test(s.c) ? s.c : INK,
    w: s && Number.isFinite(s.w) ? n(s.w, 0.002, 0.08) : 0.016,
    p: s && Array.isArray(s.p)
      ? s.p.slice(0, 3000).filter((q) => Array.isArray(q) && q.length === 2 && q.every(Number.isFinite)).map(([a, b]) => [n(a, 0, 1), n(b, 0, 1)])
      : [],
  })).filter((s) => s.p.length > 0);
  return strokes.length ? { strokes } : null;
}

function sanitize(p) {
  const d = clone(CONFIG.base);
  if (!p || typeof p !== "object") return d;
  const ids = (list, arr) => (Array.isArray(arr) ? list.filter((x) => arr.includes(x.id)).map((x) => x.id) : []);
  return {
    mode: CONFIG.types[p.mode] ? p.mode : d.mode,
    color: byId(CONFIG.colors, p.color) ? p.color : d.color,
    name: typeof p.name === "string" ? p.name.slice(0, CONFIG.nameMax) : "",
    year: CONFIG.years.includes(p.year) ? p.year : d.year,
    start: Number.isInteger(p.start) && p.start >= 0 && p.start < 12 ? p.start : 0,
    modules: ids(CONFIG.modules.filter((m) => m.extra), p.modules),
    finishes: ids(CONFIG.finishes, p.finishes),
    drawings: Object.fromEntries(CONFIG.drawings.map((x) => [x.id, cleanDrawing(p.drawings && p.drawings[x.id])])),
  };
}
function load() {
  try { return sanitize(JSON.parse(localStorage.getItem(STORE_KEY))); }
  catch { return clone(CONFIG.base); }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* sem storage: segue sem guardar */ }
}

const isRefill = (s) => s.mode === "recarga";
const typeOf = (s) => CONFIG.types[s.mode];
/** Todos os módulos do pedido: os que o tipo de agenda já inclui + os extras escolhidos. */
const modulesOf = (s) => CONFIG.modules.filter((m) => typeOf(s).includes.includes(m.id) || s.modules.includes(m.id)).map((m) => m.id);

/**
 * Linhas de preço e total para um estado: tipo de agenda + extras. Os módulos incluídos aparecem a 0 (para a produção).
 * Em recarga não há capa, nome nem suporte de caneta. O total soma-se em cêntimos para evitar erros de arredondamento.
 */
function quote(s) {
  const type = typeOf(s);
  const lines = [{ label: isRefill(s) ? type.label : `${type.label} · ${byId(CONFIG.colors, s.color).label}`, price: type.price }];
  if (!isRefill(s) && s.name.trim()) lines.push({ label: `Nome gravado: ${s.name.trim()}`, price: CONFIG.cover.engravePrice });
  CONFIG.modules.filter((m) => modulesOf(s).includes(m.id)).forEach((m) => lines.push({ label: m.label, price: m.extra ? m.price : 0 }));
  CONFIG.finishes
    .filter((f) => s.finishes.includes(f.id) && !(isRefill(s) && f.coverOnly))
    .forEach((f) => lines.push({ label: f.label, price: f.price }));
  activeDrawings(s).filter((d) => d.price).forEach((d) => lines.push({ label: d.label, price: d.price }));
  return { lines, total: lines.reduce((t, l) => t + Math.round(l.price * 100), 0) / 100 };
}

/* Desenhos: só contam se o sítio onde se aplicam existir (capa fora da recarga; topo só com o módulo escolhido). */
const drawingOf = (s, id) => (s.drawings && s.drawings[id]) || null;
const drawingAvailable = (s, d) => (d.needs === "cover" ? !isRefill(s) : modulesOf(s).includes(d.needs));
const activeDrawings = (s) => CONFIG.drawings.filter((d) => drawingAvailable(s, d) && drawingOf(s, d.id));

function period(s) {
  const end = (s.start + 11) % 12;
  const endYear = s.year + (s.start > 0 ? 1 : 0);
  return `${CONFIG.months[s.start][0]} ${s.year} a ${CONFIG.months[end][0]} ${endYear}`;
}

/* ==========================================================================
   Componente da agenda (SVG), usado no hero e no construtor
   ========================================================================== */
let agendaSeq = 0;
function createAgenda(host) {
  const uid = ++agendaSeq;
  const tabs = CONFIG.modules.map((m) =>
    `<g class="tab" data-id="${m.id}"><rect x="380" y="0" width="60" height="40" rx="9" fill="${m.color}"/>` +
    `<text x="414" y="27" text-anchor="middle" fill="${onColor(m.color)}">${m.tab}</text></g>`).join("");
  const rings = Array.from({ length: 6 }, (_, i) => {
    const y = 40 + (454 * (i + 0.5)) / 6;
    return `<rect class="ring" x="46" y="${y - 9}" width="46" height="18" rx="9"/>` +
           `<rect class="ring-hi" x="48" y="${y - 10.5}" width="42" height="18" rx="9"/>`;
  }).join("");
  // Estampa florida (capa "Florida"): flores de 5 pétalas em padrão repetido.
  const flower = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">` +
    [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-5" rx="3" ry="5" transform="rotate(${a})"/>`).join("") +
    `<circle r="2.2" fill="#C9B99A"/></g>`;
  const pattern = `<pattern id="flor${uid}" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">` +
    `<g fill="#F4EDE1">${flower(12, 12, 1)}${flower(35, 34, 0.8)}<circle cx="35" cy="10" r="1.6"/><circle cx="10" cy="36" r="1.6"/><circle cx="23" cy="24" r="1.2"/></g></pattern>`;

  // Estampa "Azulejo": grelha de losangos em traços interrompidos, pontos nos cruzamentos e flor de 4 pétalas.
  const AZ = "#3E5F8A", AZ_LIGHT = mix(AZ, [255, 255, 255], 0.22), AZ_DARK = mix(AZ, [0, 0, 0], 0.18);
  const AZ_STEP = 30 * Math.SQRT2, AZ_DASH = 27;  // distância entre cruzamentos e comprimento do traço
  const azLines = [-120, -60, 0, 60, 120].map((c) => `<line x1="-60" y1="${-60 - c}" x2="180" y2="${180 - c}"/>`)
    .concat([0, 60, 120, 180, 240].map((c) => `<line x1="-60" y1="${c + 60}" x2="180" y2="${c - 180}"/>`)).join("");
  const azPetal = `<path d="M0-3C6-6 8-14 0-17C-8-14-6-6 0-3Z"/>`;
  const azFlower = ([x, y]) => `<g transform="translate(${x} ${y})" fill="${AZ_DARK}">` +
    [0, 90, 180, 270].map((a) => `<g transform="rotate(${a})">${azPetal}</g>`).join("") + `<circle r="2.4" fill="${AZ_LIGHT}"/></g>`;
  const azDots = [[60, 0], [60, 120], [0, 60], [120, 60], [60, 60], [30, 30], [90, 30], [30, 90], [90, 90]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join("");
  const tiles = `<pattern id="azul${uid}" width="120" height="120" patternUnits="userSpaceOnUse">` +
    `<g stroke="${AZ}" stroke-width="2.4" stroke-linecap="round" fill="none" stroke-dasharray="${AZ_DASH} ${(AZ_STEP - AZ_DASH).toFixed(2)}" stroke-dashoffset="${(AZ_DASH + (AZ_STEP - AZ_DASH) / 2).toFixed(2)}">${azLines}</g>` +
    `<g fill="${AZ_LIGHT}">${azDots}</g>${[[0, 0], [120, 0], [0, 120], [120, 120]].map(azFlower).join("")}</pattern>`;

  host.innerHTML = `
    <svg class="agenda" viewBox="0 0 460 540" focusable="false">
      <defs>${pattern}${tiles}</defs>
      <rect class="pocket" x="338" y="458" width="76" height="64" rx="8"/>
      ${tabs}
      <g class="stickers" transform="rotate(-3 238 52)">
        <rect x="146" y="10" width="184" height="90" rx="8"/>
        <use href="#heart" x="158" y="13" width="20" height="20"/><use href="#cup" x="190" y="13" width="22" height="22"/>
        <use href="#sparkle" x="226" y="14" width="18" height="18"/><use href="#leaf" x="258" y="12" width="22" height="22"/>
        <rect class="stk" x="290" y="15" width="30" height="16" rx="8"/>
      </g>
      <rect class="pages" x="72" y="48" width="316" height="438" rx="4"/>
      <path class="pages-edge" d="M383 54V480M386 58V476"/>
      <rect class="cover" x="62" y="40" width="318" height="454" rx="10"/>
      <rect class="flowers" x="62" y="40" width="318" height="454" rx="10" fill="url(#flor${uid})"/>
      <rect class="tiles" x="62" y="40" width="318" height="454" rx="10" fill="url(#azul${uid})"/>
      <g class="art" transform="translate(100 44)"></g>
      <path class="spine" d="M72 40H96V494H72A10 10 0 0 1 62 484V50A10 10 0 0 1 72 40Z"/>
      <path class="crease" d="M96 41V493"/>
      <g class="plaque">
        <rect x="148" y="196" width="168" height="108" rx="12"/><rect x="156" y="204" width="152" height="92" rx="7"/>
        <text x="232" y="258" text-anchor="middle">${CONFIG.base.year}</text>
        <use href="#heart" x="219" y="266" width="26" height="26"/>
      </g>
      <text class="refill-label" x="226" y="278" text-anchor="middle">a tua capa</text>
      <g class="pen">
        <rect class="pen-body" x="350" y="78" width="16" height="262" rx="8"/>
        <path class="pen-tip" d="M350 330h16l-8 22z"/>
        <rect class="pen-clip" x="364" y="92" width="4" height="60" rx="2"/>
        <rect class="strap" x="343" y="168" width="30" height="12" rx="6"/>
        <rect class="strap" x="343" y="262" width="30" height="12" rx="6"/>
      </g>
      <text class="name" x="226" y="458" text-anchor="middle"></text>
      ${rings}
    </svg>`;

  const svg = $("svg", host);
  const nameEl = $(".name", svg);
  const artEl = $(".art", svg);
  const tabEls = Object.fromEntries($$(".tab", svg).map((g) => [g.dataset.id, g]));

  return {
    update(s) {
      const refill = isRefill(s);
      const c = byId(CONFIG.colors, s.color);
      const cover = c.hex;
      const dark = isDark(cover);
      const vars = {
        "--cover": cover,
        "--spine": c.spine || (dark ? mix(cover, [255, 255, 255], 0.1) : mix(cover, [0, 0, 0], 0.2)),
        "--band": dark ? "#EADFC7" : mix(cover, [0, 0, 0], 0.4),
        "--on-cover": c.text || onColor(cover),
      };
      Object.entries(vars).forEach(([k, v]) => svg.style.setProperty(k, v));
      svg.classList.toggle("is-refill", refill);
      $(".flowers", svg).classList.toggle("on", c.pattern === "flowers");
      $(".tiles", svg).classList.toggle("on", c.pattern === "azulejo");
      $(".plaque text", svg).textContent = s.year;
      const art = drawingOf(s, "capa");
      artEl.innerHTML = art ? strokesToSVG(art.strokes, 250, 446) : "";

      const name = s.name.trim();
      nameEl.textContent = name;
      nameEl.style.fontSize = name.length > 15 ? "22px" : name.length > 12 ? "25px" : "28px";
      // Nomes muito largos (ex.: muitos "W") são comprimidos para não passarem das argolas/caneta.
      nameEl.removeAttribute("textLength");
      if (name && nameEl.getComputedTextLength() > 236) {
        nameEl.setAttribute("textLength", 236);
        nameEl.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }

      let k = 0;
      CONFIG.modules.forEach((m) => {
        const on = modulesOf(s).includes(m.id);
        const g = tabEls[m.id];
        g.style.transform = `translate(${on ? 0 : -60}px, ${60 + k * 46}px)`;
        g.style.opacity = on ? 1 : 0;
        if (on) k++;
      });
      $(".pen", svg).classList.toggle("on", !refill && s.finishes.includes("caneta"));
      $(".pocket", svg).classList.toggle("on", s.finishes.includes("bolsa"));
      $(".stickers", svg).classList.toggle("on", s.finishes.includes("stickers"));
    },
  };
}

/* ==========================================================================
   Pedido: texto para produção e envio
   ========================================================================== */
function buildOrderText(s, c, links = {}) {
  const q = quote(s);
  const arts = activeDrawings(s);
  const refill = isRefill(s);
  const color = byId(CONFIG.colors, s.color);
  const rows = q.lines.map((l) => `  ${l.label.padEnd(36, ".")} ${priceText(l.price)}`);
  return [
    `PEDIDO BICA A BICA · ${new Date().toLocaleString("pt-PT")}`,
    "=".repeat(48),
    `TIPO:   ${typeOf(s).label}${refill ? " (A5, 6 argolas)" : " (pasta A5 transparente, 6 argolas)"}`,
    ...(refill ? [] : [`CAPA:   ${color.label} (${color.hex})`, `NOME:   ${s.name.trim() || "(sem gravação)"}`]),
    `INÍCIO: ${CONFIG.months[s.start][1]} de ${s.year} (12 meses: ${period(s)})`,
    "",
    "ITENS",
    ...rows,
    `  ${"TOTAL".padEnd(36, ".")} ${money(q.total)}`,
    ...(arts.length
      ? ["", "DESENHOS FEITOS PELA CLIENTE (PNG com fundo transparente, prontos a imprimir)",
         ...arts.map((d) => `  ${d.label}: ${links[d.id] || "sem link (pedir o ficheiro à cliente por email)"}`),
         ...(arts.some((d) => d.id === "capa") ? ["  Capa: o desenho ocupa a área da capa à direita da lombada; a etiqueta do ano fica ao centro, por cima."] : [])]
      : []),
    "",
    "CLIENTE",
    `  Nome:       ${c.nome}`,
    `  Email:      ${c.email}`,
    `  Telemóvel:  ${c.telemovel}`,
    `  Entrega:    ${c.entrega || "(a combinar com a cliente)"}`,
    `  Notas:      ${c.notas || "-"}`,
    "",
    "ACEITES pela cliente: Termos e condições, Política de privacidade e ausência de livre resolução (14 dias) em produtos personalizados.",
    "PAGAMENTO: MB Way ou numerário. Entrega em mão. Contactar a cliente para combinar o pagamento e a entrega.",
  ].join("\n");
}

/**
 * ÚNICO ponto de envio do pedido. Com CONFIG.orders.accessKey preenchida, manda o texto do pedido
 * por email através do Web3Forms; sem chave, simula. Lança erro se o envio falhar.
 */
async function submitOrder(order) {
  const { accessKey, subject } = CONFIG.orders;
  if (!accessKey) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    console.info("[Bica a Bica demo] Sem Access Key: pedido simulado.\n" + order.text);
    return;
  }
  const c = order.customer;
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `${subject} · ${c.nome}`,
      from_name: "bica a bica",
      name: c.nome,
      email: c.email,
      phone: c.telemovel,
      message: order.text,
      botcheck: order.botcheck,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || "Falha no envio");
}

/* ==========================================================================
   Desenho à mão: capa e topo das páginas do diário e do semanal
   Os traços guardam-se em vetor (pontos entre 0 e 1), por isso escalam sem perder qualidade.
   ========================================================================== */
const PEN_COLORS = [["Creme", "#F4EDE1"], ["Verde", "#2F4A3C"], ["Azulejo", "#3E5F8A"], ["Caqui", "#C9B99A"], ["Café", "#4A3426"], ["Rosa", "#F6B3C6"]];
const PEN_WIDTHS = [["Fino", 0.008], ["Médio", 0.016], ["Grosso", 0.034]];

/** Traços em elementos <path> de SVG, numa área de W x H unidades. */
function strokesToSVG(strokes, W, H) {
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` + strokes.map((s) => {
    const pts = s.p.map(([x, y]) => `${(x * W).toFixed(1)} ${(y * H).toFixed(1)}`);
    const d = pts.length === 1 ? `M${pts[0]}l.01 0` : "M" + pts.join("L");
    return `<path d="${d}" stroke="${s.c}" stroke-width="${(s.w * W).toFixed(2)}"/>`;
  }).join("") + "</g>";
}

/** Pinta os traços num canvas 2D (ecrã e exportação para PNG usam o mesmo código). */
function paintStrokes(ctx, strokes, W, H) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  strokes.forEach((s) => {
    ctx.strokeStyle = s.c;
    ctx.lineWidth = s.w * W;
    ctx.beginPath();
    s.p.forEach(([x, y], i) => (i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)));
    if (s.p.length === 1) ctx.lineTo(s.p[0][0] * W + 0.01, s.p[0][1] * H);
    ctx.stroke();
  });
}

/** PNG com fundo transparente, a 1500 px de largura (≈ 250 ppp numa página A5). */
function drawingToPNG(d, strokes) {
  const W = 1500, H = Math.round(W / d.aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  paintStrokes(c.getContext("2d"), strokes, W, H);
  return c.toDataURL("image/png");
}

/** Envia o PNG para o Cloudinary (grátis) e devolve o link. Devolve null se não estiver configurado. */
async function uploadDrawing(dataUrl) {
  const { cloudName, uploadPreset } = CONFIG.upload;
  if (!cloudName || !uploadPreset) return null;
  const body = new FormData();
  body.append("file", dataUrl);
  body.append("upload_preset", uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) throw new Error("Falha ao enviar o desenho");
  return data.secure_url;
}

const dlg = $("#dlg-draw");
const canvas = $("#draw-canvas");
const g2d = canvas.getContext("2d");
const pen = { slot: null, strokes: [], tool: "pen", color: PEN_COLORS[1][1], width: PEN_WIDTHS[1][1], cur: null, erasing: false };

function redrawCanvas() {
  g2d.clearRect(0, 0, canvas.width, canvas.height);
  paintStrokes(g2d, pen.strokes, canvas.width, canvas.height);
}
function sizeCanvas() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  redrawCanvas();
}
const canvasPoint = (e) => {
  const r = canvas.getBoundingClientRect();
  const n = (v) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
  return [n((e.clientX - r.left) / r.width), n((e.clientY - r.top) / r.height)];
};
/** Borracha: apaga os traços que passam perto do ponto (raio de 14 px). */
function eraseAt([x, y]) {
  const r = canvas.getBoundingClientRect();
  const before = pen.strokes.length;
  pen.strokes = pen.strokes.filter((s) => !s.p.some(([a, b]) => Math.hypot((a - x) * r.width, (b - y) * r.height) < 14));
  if (pen.strokes.length !== before) redrawCanvas();
}

function openDraw(id) {
  const d = byId(CONFIG.drawings, id);
  const cover = d.needs === "cover";
  const bg = cover ? byId(CONFIG.colors, state.color).hex : "#FFFFFF";
  pen.slot = id;
  pen.strokes = clone((drawingOf(state, id) || { strokes: [] }).strokes);
  pen.cur = null;
  const stage = $("#draw-stage");
  stage.style.setProperty("--aspect", d.aspect);
  stage.style.setProperty("--stage-bg", bg);
  stage.style.setProperty("--guide", onColor(bg));
  stage.dataset.kind = cover ? "cover" : "page";
  $("#dlg-draw-t").textContent = d.label;
  $("#draw-help").textContent = d.help;
  // cor inicial legível sobre o fundo
  const first = onColor(bg) === PAPER ? PEN_COLORS[0][1] : PEN_COLORS[1][1];
  pen.color = first;
  pen.tool = "pen";
  $$('#dlg-draw input[name="tool"]').forEach((i) => (i.checked = i.value === "pen"));
  $$('#dlg-draw input[name="pcolor"]').forEach((i) => (i.checked = i.value === first));
  dlg.showModal();
  requestAnimationFrame(sizeCanvas);
}

function buildPenControls() {
  $("#pen-colors").insertAdjacentHTML("beforeend", PEN_COLORS.map(([name, hex], i) => `
    <label class="pcolor" title="${name}"><input type="radio" name="pcolor" value="${hex}"${i === 1 ? " checked" : ""} aria-label="${name}"><span style="--c:${hex}"></span></label>`).join(""));
  $("#pen-widths").insertAdjacentHTML("beforeend", PEN_WIDTHS.map(([name, w], i) => `
    <label class="chip"><input type="radio" name="pwidth" value="${w}"${i === 1 ? " checked" : ""}><span>${name}</span></label>`).join(""));
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.button > 0) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  const p = canvasPoint(e);
  if (pen.tool === "eraser") {
    pen.erasing = true;
    eraseAt(p);
  } else {
    pen.cur = { c: pen.color, w: pen.width, p: [p] };
    pen.strokes.push(pen.cur);
    redrawCanvas();
  }
});
canvas.addEventListener("pointermove", (e) => {
  if (!pen.cur && !pen.erasing) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  const r = canvas.getBoundingClientRect();
  for (const ev of list.length ? list : [e]) {
    const p = canvasPoint(ev);
    if (pen.erasing) { eraseAt(p); continue; }
    const last = pen.cur.p[pen.cur.p.length - 1];
    if (Math.hypot((p[0] - last[0]) * r.width, (p[1] - last[1]) * r.height) >= 1.5) pen.cur.p.push(p);
  }
  if (pen.cur) redrawCanvas();
});
["pointerup", "pointercancel"].forEach((t) => canvas.addEventListener(t, () => { pen.cur = null; pen.erasing = false; }));
window.addEventListener("resize", () => { if (dlg.open) sizeCanvas(); });

dlg.addEventListener("change", (e) => {
  const { name, value } = e.target;
  if (name === "tool") pen.tool = value;
  if (name === "pcolor") { pen.color = value; pen.tool = "pen"; $$('#dlg-draw input[name="tool"]').forEach((i) => (i.checked = i.value === "pen")); }
  if (name === "pwidth") pen.width = Number(value);
});
$("#draw-undo").addEventListener("click", () => { pen.strokes.pop(); redrawCanvas(); });
$("#draw-clear").addEventListener("click", () => { pen.strokes = []; redrawCanvas(); });
$("#draw-cancel").addEventListener("click", () => dlg.close());
$("#draw-save").addEventListener("click", () => {
  const slot = pen.slot;
  const strokes = pen.strokes.filter((s) => s.p.length);
  dlg.close();
  set({ drawings: { ...state.drawings, [slot]: strokes.length ? { strokes } : null } });
  const back = $(`[data-draw="${slot}"]`);
  if (back) back.focus();
});

/** Lista "Desenha à mão" no construtor: só mostra o que se aplica ao pedido atual. */
function renderDraws() {
  const rows = CONFIG.drawings.filter((d) => drawingAvailable(state, d));
  $("#step-draw").hidden = rows.length === 0;
  $("#draws").innerHTML = rows.map((d) => {
    const dr = drawingOf(state, d.id);
    const cover = d.needs === "cover";
    const W = cover ? 250 : 148, H = Math.round(W / d.aspect);
    const bg = cover ? byId(CONFIG.colors, state.color).hex : "#FFFFFF";
    const thumb = dr
      ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.label)}: guardado"><rect width="${W}" height="${H}" fill="${bg}"/>${strokesToSVG(dr.strokes, W, H)}</svg>`
      : `<svg class="draw__empty" viewBox="0 0 24 24" aria-hidden="true"><use href="#pencil"/></svg>`;
    return `
      <li class="draw${cover ? " draw--cover" : ""}" data-id="${d.id}">
        <div class="draw__thumb">${thumb}</div>
        <div class="draw__text"><strong>${d.label}</strong><span class="opt__desc">${d.help}</span></div>
        <div class="draw__btns">
          <span class="opt__price">${d.price ? "+" + money(d.price) : "incluído"}</span>
          <button type="button" class="btn btn--line" data-draw="${d.id}">${dr ? "Refazer" : "Desenhar"}<span class="sr"> ${esc(d.label.toLowerCase())}</span></button>
          ${dr ? `<button type="button" class="link" data-draw-clear="${d.id}">Apagar<span class="sr"> ${esc(d.label.toLowerCase())}</span></button>` : ""}
        </div>
      </li>`;
  }).join("");
}

/* ==========================================================================
   Interface
   ========================================================================== */
const els = {
  grid: $("#builder"),
  panels: { steps: $("#panel-steps"), order: $("#panel-order"), done: $("#panel-done") },
};
const previewAgenda = createAgenda($("#agenda-preview"));
const heroAgenda = createAgenda($("#agenda-hero"));

function buildControls() {
  $("#colors").innerHTML = CONFIG.colors.map((c) => `
    <label class="swatch"><input type="radio" name="color" value="${c.id}">
      <span class="swatch__dot${c.pattern ? " swatch__dot--" + c.pattern : ""}" style="--c:${c.hex}"></span><span class="swatch__name">${c.label}</span></label>`).join("");
  $("#years").innerHTML = CONFIG.years.map((y) => `
    <label class="month"><input type="radio" name="year" value="${y}"><span>${y}</span></label>`).join("");
  $("#months").innerHTML = CONFIG.months.map((m, i) => `
    <label class="month"><input type="radio" name="start" value="${i}"><span>${m[0]}</span></label>`).join("");
  const opt = (kind, x) => `
    <button type="button" class="opt" data-kind="${kind}" data-id="${x.id}" aria-pressed="false" style="--tab:${x.color || "transparent"}">
      ${x.color ? '<span class="opt__tab" aria-hidden="true"></span>' : ""}
      <span class="opt__text"><span class="opt__name">${x.label}</span><span class="opt__desc">${x.desc}</span></span>
      <span class="opt__price">+${money(x.price)}</span>
    </button>`;
  $("#modules").innerHTML = CONFIG.modules.filter((m) => m.extra).map((m) => opt("module", m)).join("");
  $("#finishes").innerHTML = CONFIG.finishes.map((f) => opt("finish", f)).join("");
  $("#engrave").maxLength = CONFIG.nameMax;

  $("#sets").innerHTML = CONFIG.sets.map((set) => {
    const setState = { ...clone(CONFIG.base), modules: set.modules, finishes: set.finishes };
    const mods = CONFIG.modules.filter((m) => modulesOf(setState).includes(m.id));
    const fins = CONFIG.finishes.filter((f) => set.finishes.includes(f.id));
    const total = quote(setState).total;
    return `
      <article class="set sheet">
        <h3>${set.label}</h3>
        <ul class="set__list">
          ${mods.map((m) => `<li><span class="set__tab" style="--tab:${m.color}" aria-hidden="true"></span>${m.label}</li>`).join("")}
          ${fins.map((f) => `<li><span class="set__tab set__tab--fin" aria-hidden="true"></span>${f.label}</li>`).join("")}
        </ul>
        <p class="set__price"><strong>${money(total)}</strong><span>com pasta</span></p>
        <button type="button" class="btn btn--ink btn--block" data-set="${set.id}" aria-label="Escolher o conjunto ${set.label}">Escolher</button>
      </article>`;
  }).join("");
}

/** Lista dos módulos que já vêm no preço, conforme o tipo de agenda escolhido. */
function renderIncluded() {
  const inc = typeOf(state).includes;
  $("#included").innerHTML = CONFIG.modules.filter((m) => inc.includes(m.id)).map((m) =>
    `<li class="incl__item"><span class="set__tab" style="--tab:${m.color}" aria-hidden="true"></span><span><strong>${m.label}</strong> <span class="opt__desc">${m.desc}</span></span></li>`).join("");
}

function render() {
  const refill = isRefill(state);
  const q = quote(state);
  const color = byId(CONFIG.colors, state.color);

  $$(".mode__btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
  $("#step-cover").hidden = refill;
  $$('input[name="color"]').forEach((i) => (i.checked = i.value === state.color));
  $$('input[name="year"]').forEach((i) => (i.checked = Number(i.value) === state.year));
  $$('input[name="start"]').forEach((i) => (i.checked = Number(i.value) === state.start));
  if ($("#engrave").value !== state.name) $("#engrave").value = state.name;
  $$(".opt").forEach((b) => {
    const list = b.dataset.kind === "module" ? state.modules : state.finishes;
    b.setAttribute("aria-pressed", String(list.includes(b.dataset.id)));
    const f = byId(CONFIG.finishes, b.dataset.id);
    b.hidden = Boolean(refill && b.dataset.kind === "finish" && f.coverOnly);
  });

  renderIncluded();
  renderDraws();
  previewAgenda.update(state);
  $("#preview-spec").textContent = `${refill ? "Recarga" : color.label} · A5 · 6 argolas`;
  $("#preview-period").textContent = `12 meses · ${period(state)}`;
  const linesHTML = q.lines.map((l) => `<li><span>${esc(l.label)}</span><span>${priceText(l.price)}</span></li>`).join("");
  $("#summary-lines").innerHTML = linesHTML;
  $("#order-lines").innerHTML = linesHTML;
  ["#preview-total", "#summary-total", "#order-total"].forEach((s) => ($(s).textContent = money(q.total)));
}

function set(patch) {
  Object.assign(state, patch);
  save();
  render();
}

function showPanel(name, focus = false) {
  Object.entries(els.panels).forEach(([k, el]) => (el.hidden = k !== name));
  els.grid.classList.toggle("is-ordering", name !== "steps");
  if (focus) $(`#h-${name}`).focus({ preventScroll: true });
}
function goBuilder() {
  $("#construir").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
}

function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/* ---------- Eventos do construtor ---------- */
els.grid.addEventListener("click", (e) => {
  const opt = e.target.closest(".opt");
  const mode = e.target.closest(".mode__btn");
  const open = e.target.closest("[data-draw]");
  const wipe = e.target.closest("[data-draw-clear]");
  if (open) {
    openDraw(open.dataset.draw);
  } else if (wipe) {
    const id = wipe.dataset.drawClear;
    set({ drawings: { ...state.drawings, [id]: null } });
    const back = $(`[data-draw="${id}"]`);
    if (back) back.focus();
  } else if (opt) {
    const key = opt.dataset.kind === "module" ? "modules" : "finishes";
    set({ [key]: toggle(state[key], opt.dataset.id) });
  } else if (mode) {
    set({ mode: mode.dataset.mode });
  }
});
els.grid.addEventListener("change", (e) => {
  if (e.target.name === "color") set({ color: e.target.value });
  if (e.target.name === "start") set({ start: Number(e.target.value) });
  if (e.target.name === "year") set({ year: Number(e.target.value) });
});
$("#engrave").addEventListener("input", (e) => set({ name: e.target.value }));

$("#btn-continue").addEventListener("click", () => {
  showPanel("order", true);
  goBuilder();
});
$("#btn-back").addEventListener("click", () => showPanel("steps", false));
$("#btn-new").addEventListener("click", () => { showPanel("steps"); goBuilder(); });

/* ---------- Atalhos fora do construtor ---------- */
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-action], [data-set]");
  if (!a) return;
  if (a.dataset.action === "base") set(clone(CONFIG.base));
  else if (a.dataset.action === "recarga") set({ mode: "recarga" });
  else if (a.dataset.set) {
    const s = byId(CONFIG.sets, a.dataset.set);
    set({ mode: "agenda", modules: [...s.modules], finishes: [...s.finishes] });
  }
  showPanel("steps");
  goBuilder();
});

/** Na confirmação: ligações para a cliente guardar os desenhos (e no-los enviar, se o link automático não estiver ligado). */
function showDownloads(files) {
  const box = $("#done-draws");
  const items = CONFIG.drawings.filter((d) => files[d.id]);
  box.hidden = items.length === 0;
  $("#done-draws-list").innerHTML = items.map((d) =>
    `<li><a class="btn btn--line" href="${files[d.id]}" download="bica-a-bica-${d.id}.png">Descarregar: ${d.label.toLowerCase()}</a></li>`).join("");
}

/* ---------- Formulário ---------- */
const FIELDS = {
  nome: { empty: "Indica o teu nome." },
  email: { empty: "Indica o teu email.", ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), bad: "Isto não parece um email. Exemplo: nome@dominio.pt" },
  telemovel: {
    empty: "Indica o teu telemóvel.",
    ok: (v) => /^[29]\d{8}$/.test(v.replace(/[\s.-]/g, "").replace(/^(\+|00)?351/, "")),
    bad: "Indica um telemóvel com 9 dígitos, por exemplo 912 345 678.",
  },
  aceito: { empty: "Para enviares o pedido tens de aceitar os termos e condições." },
};

function fieldError(name, value) {
  const f = FIELDS[name];
  if (!value) return f.empty;
  return f.ok && !f.ok(value) ? f.bad : "";
}
function setError(name, msg) {
  const input = $(`#f-${name}`);
  $(`#e-${name}`).textContent = msg;
  if (msg) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

const form = $("#order-form");
form.addEventListener("input", (e) => {
  const name = e.target.name;
  const value = e.target.type === "checkbox" ? (e.target.checked ? "sim" : "") : e.target.value.trim();
  if (FIELDS[name] && e.target.hasAttribute("aria-invalid")) setError(name, fieldError(name, value));
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((k) => (data[k] = String(data[k]).trim()));
  data.aceito = $("#f-aceito").checked ? "sim" : "";
  const errors = Object.keys(FIELDS).filter((n) => { const m = fieldError(n, data[n]); setError(n, m); return m; });

  const summary = $("#form-errors");
  summary.hidden = errors.length === 0;
  if (errors.length) {
    summary.textContent = errors.length === 1 ? "Falta corrigir 1 campo." : `Faltam corrigir ${errors.length} campos.`;
    $(`#f-${errors[0]}`).focus();
    return;
  }

  const send = $("#btn-send");
  send.disabled = true;
  send.textContent = "A enviar…";
  $("#form-status").textContent = "";
  try {
    // Desenhos: PNG para imprimir; se o alojamento estiver configurado, o email leva o link (se falhar, o pedido segue na mesma).
    const files = {}, links = {};
    await Promise.all(activeDrawings(state).map(async (d) => {
      files[d.id] = drawingToPNG(d, drawingOf(state, d.id).strokes);
      links[d.id] = await uploadDrawing(files[d.id]).catch(() => null);
    }));
    const order = { customer: data, text: buildOrderText(state, data, links), botcheck: $("#f-botcheck").checked };
    await submitOrder(order);
    $("#order-text").textContent = order.text;
    showDownloads(files);
    showPanel("done", true);
  } catch {
    $("#form-status").textContent = "Não foi possível enviar o pedido. Tenta outra vez dentro de instantes.";
  } finally {
    send.disabled = false;
    send.textContent = "Enviar pedido";
  }
});

/* ---------- Nav e valores ligados à configuração ---------- */
const toggleBtn = $(".nav__toggle");
const navLinks = $("#nav-links");
toggleBtn.addEventListener("click", () => {
  const open = toggleBtn.getAttribute("aria-expanded") !== "true";
  toggleBtn.setAttribute("aria-expanded", String(open));
  navLinks.classList.toggle("is-open", open);
});
navLinks.addEventListener("click", () => { toggleBtn.setAttribute("aria-expanded", "false"); navLinks.classList.remove("is-open"); });

function fillConfigValues() {
  const refillBase = quote({ ...clone(CONFIG.base), mode: "recarga" }).total;
  $$('[data-price="base"]').forEach((n) => (n.textContent = money(quote(CONFIG.base).total)));
  $$('[data-price="refill-base"]').forEach((n) => (n.textContent = money(refillBase)));
  $$('[data-price="engrave"]').forEach((n) => (n.textContent = money(CONFIG.cover.engravePrice)));
  $$("[data-year]").forEach((n) => (n.textContent = CONFIG.base.year));
  $$("[data-year-next]").forEach((n) => (n.textContent = CONFIG.base.year + 1));
}

/* ---------- Hero: a agenda monta-se sozinha; as cores deixam experimentar ---------- */
function startHero() {
  const frames = [
    { mode: "agenda", color: "florida", name: "",      modules: [] },
    { mode: "agenda", color: "azulejo", name: "Marta", modules: ["habitos"] },
    { mode: "diaria", color: "caqui",   name: "",      modules: ["financas"] },
    { mode: "agenda", color: "salva",   name: "Inês",  modules: ["leituras"] },
    { mode: "agenda", color: "cafe",    name: "",      modules: ["habitos", "financas", "leituras"] },
  ];
  let view = { ...clone(CONFIG.base), ...frames[0] };
  const box = $("#hero-swatches");
  box.innerHTML = CONFIG.colors.map((c) => `<button type="button" class="dot${c.pattern ? " dot--" + c.pattern : ""}" data-color="${c.id}" aria-label="Capa ${c.label}" aria-pressed="false" style="--c:${c.hex}"></button>`).join("");
  const show = (patch) => {
    view = { ...view, ...patch };
    heroAgenda.update(view);
    $$(".dot", box).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.color === view.color)));
  };

  let i = 0, timer = null;
  box.addEventListener("click", (e) => {
    const b = e.target.closest(".dot");
    if (!b) return;
    clearInterval(timer);
    show({ color: b.dataset.color });
  });
  show(frames[0]);
  if (!reduceMotion()) timer = setInterval(() => { i = (i + 1) % frames.length; show(frames[i]); }, 2600);
}

buildControls();
buildPenControls();
fillConfigValues();
render();
startHero();
// As fontes chegam depois: voltar a medir o nome gravado.
document.fonts?.ready.then(render);
