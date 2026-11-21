"use strict";

/* ==========================================================================
   CONFIGURAÇÃO — único sítio a editar por cliente (preços, módulos, cores).
   ========================================================================== */
const CONFIG = {
  year: 2027,
  nameMax: 18,
  cover: { price: 24, engravePrice: 4 },
  months: [
    ["Jan", "janeiro"], ["Fev", "fevereiro"], ["Mar", "março"], ["Abr", "abril"],
    ["Mai", "maio"], ["Jun", "junho"], ["Jul", "julho"], ["Ago", "agosto"],
    ["Set", "setembro"], ["Out", "outubro"], ["Nov", "novembro"], ["Dez", "dezembro"],
  ],
  colors: [
    { id: "tinta",   label: "Tinta",   hex: "#1B1B1F" },
    { id: "tomate",  label: "Tomate",  hex: "#E2482B" },
    { id: "cobalto", label: "Cobalto", hex: "#2342C4" },
    { id: "salvia",  label: "Sálvia",  hex: "#93A88E" },
    { id: "areia",   label: "Areia",   hex: "#D8C8A6" },
    { id: "lilas",   label: "Lilás",   hex: "#B9A8DB" },
  ],
  modules: [
    { id: "mensal",   label: "Vista mensal",     tab: "MÊS", price: 6,  color: "#E2482B", desc: "Um mês em duas páginas, para ver o quadro geral." },
    { id: "semanal",  label: "Semanal",          tab: "SEM", price: 9,  color: "#F2B134", desc: "Sete dias por dupla de páginas, com espaço para escrever." },
    { id: "diario",   label: "Diário",           tab: "DIA", price: 14, color: "#2342C4", desc: "Uma página por dia, para quem escreve muito." },
    { id: "notas",    label: "Notas pontilhadas", tab: "NOT", price: 4,  color: "#93A88E", desc: "Folhas pontilhadas livres para listas, esboços e ideias." },
    { id: "habitos",  label: "Tracker de hábitos", tab: "HÁB", price: 4, color: "#B9A8DB", desc: "Grelha mensal para marcar o que repetes todos os dias." },
    { id: "financas", label: "Finanças",         tab: "FIN", price: 4,  color: "#1B1B1F", desc: "Registo de despesas e orçamento mês a mês." },
    { id: "leituras", label: "Leituras",         tab: "LEI", price: 3,  color: "#D8C8A6", desc: "Lista do que lês, com espaço para notas." },
  ],
  finishes: [
    { id: "separadores", label: "Separadores impressos", price: 3, desc: "Folhas de separação com o nome de cada módulo." },
    { id: "elastico",    label: "Elástico de fecho",     price: 2, desc: "Mantém a agenda fechada na mala.", coverOnly: true },
    { id: "bolsa",       label: "Bolsa transparente",    price: 3, desc: "Para guardar papéis soltos e cartões." },
  ],
  sets: [
    { id: "essencial", label: "Essencial", modules: ["mensal", "notas"], finishes: [] },
    { id: "organizada", label: "Organizada", modules: ["mensal", "semanal", "notas"], finishes: ["separadores"] },
    { id: "completa", label: "Completa", modules: ["mensal", "semanal", "habitos", "financas", "notas"], finishes: ["separadores", "elastico"] },
  ],
  base: { mode: "agenda", color: "tinta", name: "", start: 0, modules: ["mensal", "semanal", "notas"], finishes: [] },
};

/* ==========================================================================
   Utilitários
   ========================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => `${n} €`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const byId = (list, id) => list.find((x) => x.id === id);
const clone = (o) => JSON.parse(JSON.stringify(o));

const INK = "#141416", PAPER = "#F3F3F0";
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
const STORE_KEY = "argo-builder-v1";
let state = load();

function sanitize(p) {
  const d = clone(CONFIG.base);
  if (!p || typeof p !== "object") return d;
  const ids = (list, arr) => (Array.isArray(arr) ? list.filter((x) => arr.includes(x.id)).map((x) => x.id) : []);
  return {
    mode: p.mode === "recarga" ? "recarga" : "agenda",
    color: byId(CONFIG.colors, p.color) ? p.color : d.color,
    name: typeof p.name === "string" ? p.name.slice(0, CONFIG.nameMax) : "",
    start: Number.isInteger(p.start) && p.start >= 0 && p.start < 12 ? p.start : 0,
    modules: ids(CONFIG.modules, p.modules),
    finishes: ids(CONFIG.finishes, p.finishes),
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

/** Linhas de preço e total para um estado. Em recarga não há capa, nome nem elástico. */
function quote(s) {
  const lines = [];
  if (!isRefill(s)) {
    lines.push({ label: `Capa dura · ${byId(CONFIG.colors, s.color).label}`, price: CONFIG.cover.price });
    if (s.name.trim()) lines.push({ label: `Nome gravado: ${s.name.trim()}`, price: CONFIG.cover.engravePrice });
  }
  CONFIG.modules.filter((m) => s.modules.includes(m.id)).forEach((m) => lines.push({ label: m.label, price: m.price }));
  CONFIG.finishes
    .filter((f) => s.finishes.includes(f.id) && !(isRefill(s) && f.coverOnly))
    .forEach((f) => lines.push({ label: f.label, price: f.price }));
  return { lines, total: lines.reduce((t, l) => t + l.price, 0) };
}

function period(s) {
  const end = (s.start + 11) % 12;
  const endYear = CONFIG.year + (s.start > 0 ? 1 : 0);
  return `${CONFIG.months[s.start][0]} ${CONFIG.year} a ${CONFIG.months[end][0]} ${endYear}`;
}

/* ==========================================================================
   Componente da agenda (SVG), usado no hero e no construtor
   ========================================================================== */
function createAgenda(host) {
  const tabs = CONFIG.modules.map((m) =>
    `<g class="tab" data-id="${m.id}"><rect x="380" y="0" width="60" height="40" rx="9" fill="${m.color}"/>` +
    `<text x="414" y="25" text-anchor="middle" fill="${onColor(m.color)}">${m.tab}</text></g>`).join("");
  const rings = Array.from({ length: 6 }, (_, i) => {
    const y = 40 + (454 * (i + 0.5)) / 6;
    return `<rect class="ring" x="46" y="${y - 9}" width="46" height="18" rx="9"/>` +
           `<rect class="ring-hi" x="48" y="${y - 10.5}" width="42" height="18" rx="9"/>`;
  }).join("");
  const yy = String(CONFIG.year).slice(-2);

  host.innerHTML = `
    <svg class="agenda" viewBox="0 0 460 540" focusable="false">
      <rect class="pocket" x="338" y="458" width="76" height="64" rx="8"/>
      ${tabs}
      <rect class="pages" x="72" y="48" width="316" height="438" rx="4"/>
      <path class="pages-edge" d="M383 54V480M386 58V476"/>
      <rect class="cover" x="62" y="40" width="318" height="454" rx="10"/>
      <path class="spine" d="M72 40H96V494H72A10 10 0 0 1 62 484V50A10 10 0 0 1 72 40Z"/>
      <path class="crease" d="M96 41V493"/>
      <text class="num-hi" x="232" y="305" text-anchor="middle">${yy}</text>
      <text class="num" x="232" y="305" text-anchor="middle">${yy}</text>
      <text class="refill-label" x="226" y="278" text-anchor="middle">a tua capa</text>
      <rect class="elastic" x="358" y="34" width="12" height="466" rx="3"/>
      <text class="name" x="226" y="458" text-anchor="middle"></text>
      ${rings}
    </svg>`;

  const svg = $("svg", host);
  const nameEl = $(".name", svg);
  const tabEls = Object.fromEntries($$(".tab", svg).map((g) => [g.dataset.id, g]));

  return {
    update(s) {
      const refill = isRefill(s);
      const cover = byId(CONFIG.colors, s.color).hex;
      const dark = isDark(cover);
      const vars = {
        "--cover": cover,
        "--spine": dark ? mix(cover, [255, 255, 255], 0.1) : mix(cover, [0, 0, 0], 0.2),
        "--band": dark ? mix(cover, [255, 255, 255], 0.4) : mix(cover, [0, 0, 0], 0.4),
        "--on-cover": onColor(cover),
        "--num": dark ? "rgba(255,255,255,.14)" : "rgba(20,20,22,.16)",
        "--num-hi": dark ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.5)",
      };
      Object.entries(vars).forEach(([k, v]) => svg.style.setProperty(k, v));
      svg.classList.toggle("is-refill", refill);

      const name = s.name.trim().toLocaleUpperCase("pt-PT");
      nameEl.textContent = name;
      nameEl.style.fontSize = name.length > 15 ? "13px" : name.length > 12 ? "15px" : "17px";
      // Nomes muito largos (ex.: muitos "W") são comprimidos para não passarem das argolas/elástico.
      nameEl.removeAttribute("textLength");
      if (name && nameEl.getComputedTextLength() > 236) {
        nameEl.setAttribute("textLength", 236);
        nameEl.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }

      let k = 0;
      CONFIG.modules.forEach((m) => {
        const on = s.modules.includes(m.id);
        const g = tabEls[m.id];
        g.style.transform = `translate(${on ? 0 : -60}px, ${60 + k * 46}px)`;
        g.style.opacity = on ? 1 : 0;
        if (on) k++;
      });
      $(".elastic", svg).classList.toggle("on", !refill && s.finishes.includes("elastico"));
      $(".pocket", svg).classList.toggle("on", s.finishes.includes("bolsa"));
    },
  };
}

/* ==========================================================================
   Pedido: texto para produção e envio
   ========================================================================== */
function buildOrderText(s, c) {
  const q = quote(s);
  const refill = isRefill(s);
  const color = byId(CONFIG.colors, s.color);
  const rows = q.lines.map((l) => `  ${l.label.padEnd(36, ".")} ${money(l.price)}`);
  return [
    `PEDIDO ARGO · ${new Date().toLocaleString("pt-PT")}`,
    "=".repeat(48),
    refill ? "TIPO:   Só recarga (miolo A5 para 6 argolas, sem capa)" : "TIPO:   Agenda completa (capa dura A5, 6 argolas)",
    ...(refill ? [] : [`CAPA:   ${color.label} (${color.hex})`, `NOME:   ${s.name.trim() ? s.name.trim().toLocaleUpperCase("pt-PT") : "(sem gravação)"}`]),
    `INÍCIO: ${CONFIG.months[s.start][1]} de ${CONFIG.year} (12 meses: ${period(s)})`,
    "",
    "ITENS",
    ...rows,
    `  ${"TOTAL".padEnd(36, ".")} ${money(q.total)}`,
    "",
    "CLIENTE",
    `  Nome:       ${c.nome}`,
    `  Email:      ${c.email}`,
    `  Telemóvel:  ${c.telemovel}`,
    `  Morada:     ${c.morada}`,
    `  Cód. postal: ${c.codpostal}  ${c.localidade}`,
    `  Notas:      ${c.notas || "-"}`,
    "",
    "PAGAMENTO: MB Way ou transferência. Enviar dados por email; iniciar produção só quando o pagamento entrar.",
  ].join("\n");
}

/**
 * ÚNICO ponto a ligar a um serviço de formulários (Formspree, Getform, Web3Forms...).
 * Por agora o envio é simulado. Para ligar, troca o corpo por algo como:
 *
 *   const res = await fetch("https://formspree.io/f/O_TEU_ID", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", Accept: "application/json" },
 *     body: JSON.stringify({ name: order.customer.nome, email: order.customer.email, message: order.text }),
 *   });
 *   if (!res.ok) throw new Error("Falha no envio");
 */
async function submitOrder(order) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  console.info("[ARGO demo] Pedido simulado:\n" + order.text);
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
      <span class="swatch__dot" style="--c:${c.hex}"></span><span class="swatch__name">${c.label}</span></label>`).join("");
  $("#months").innerHTML = CONFIG.months.map((m, i) => `
    <label class="month"><input type="radio" name="start" value="${i}"><span>${m[0]}</span></label>`).join("");
  const opt = (kind, x) => `
    <button type="button" class="opt" data-kind="${kind}" data-id="${x.id}" aria-pressed="false" style="--tab:${x.color || "transparent"}">
      ${x.color ? '<span class="opt__tab" aria-hidden="true"></span>' : ""}
      <span class="opt__text"><span class="opt__name">${x.label}</span><span class="opt__desc">${x.desc}</span></span>
      <span class="opt__price">${money(x.price)}</span>
    </button>`;
  $("#modules").innerHTML = CONFIG.modules.map((m) => opt("module", m)).join("");
  $("#finishes").innerHTML = CONFIG.finishes.map((f) => opt("finish", f)).join("");
  $("#engrave").maxLength = CONFIG.nameMax;

  $("#sets").innerHTML = CONFIG.sets.map((set) => {
    const mods = CONFIG.modules.filter((m) => set.modules.includes(m.id));
    const fins = CONFIG.finishes.filter((f) => set.finishes.includes(f.id));
    const total = quote({ ...clone(CONFIG.base), modules: set.modules, finishes: set.finishes }).total;
    return `
      <article class="set sheet">
        <h3>${set.label}</h3>
        <ul class="set__list">
          ${mods.map((m) => `<li><span class="set__tab" style="--tab:${m.color}" aria-hidden="true"></span>${m.label}</li>`).join("")}
          ${fins.map((f) => `<li><span class="set__tab set__tab--fin" aria-hidden="true"></span>${f.label}</li>`).join("")}
        </ul>
        <p class="set__price"><strong>${money(total)}</strong><span>com capa dura</span></p>
        <button type="button" class="btn btn--ink btn--block" data-set="${set.id}" aria-label="Escolher o conjunto ${set.label}">Escolher</button>
      </article>`;
  }).join("");
}

function render() {
  const refill = isRefill(state);
  const q = quote(state);
  const color = byId(CONFIG.colors, state.color);

  $$(".mode__btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
  $("#step-cover").hidden = refill;
  $$('input[name="color"]').forEach((i) => (i.checked = i.value === state.color));
  $$('input[name="start"]').forEach((i) => (i.checked = Number(i.value) === state.start));
  if ($("#engrave").value !== state.name) $("#engrave").value = state.name;
  $$(".opt").forEach((b) => {
    const list = b.dataset.kind === "module" ? state.modules : state.finishes;
    b.setAttribute("aria-pressed", String(list.includes(b.dataset.id)));
    const f = byId(CONFIG.finishes, b.dataset.id);
    b.hidden = Boolean(refill && b.dataset.kind === "finish" && f.coverOnly);
  });

  previewAgenda.update(state);
  $("#preview-spec").textContent = `${refill ? "Recarga" : color.label} · A5 · 6 argolas`;
  $("#preview-period").textContent = `12 meses · ${period(state)}`;
  const linesHTML = q.lines.map((l) => `<li><span>${esc(l.label)}</span><span>${money(l.price)}</span></li>`).join("")
    || '<li class="lines__empty">Ainda sem módulos.</li>';
  $("#summary-lines").innerHTML = linesHTML;
  $("#order-lines").innerHTML = linesHTML;
  ["#preview-total", "#summary-total", "#order-total"].forEach((s) => ($(s).textContent = money(q.total)));

  const none = state.modules.length === 0;
  $("#btn-continue").disabled = none;
  $("#continue-hint").hidden = !none;
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
  if (opt) {
    const key = opt.dataset.kind === "module" ? "modules" : "finishes";
    set({ [key]: toggle(state[key], opt.dataset.id) });
  } else if (mode) {
    set({ mode: mode.dataset.mode });
  }
});
els.grid.addEventListener("change", (e) => {
  if (e.target.name === "color") set({ color: e.target.value });
  if (e.target.name === "start") set({ start: Number(e.target.value) });
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

/* ---------- Formulário ---------- */
const FIELDS = {
  nome: { empty: "Indica o teu nome." },
  email: { empty: "Indica o teu email.", ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), bad: "Isto não parece um email. Exemplo: nome@dominio.pt" },
  telemovel: {
    empty: "Indica o teu telemóvel.",
    ok: (v) => /^[29]\d{8}$/.test(v.replace(/[\s.-]/g, "").replace(/^(\+|00)?351/, "")),
    bad: "Indica um telemóvel com 9 dígitos, por exemplo 912 345 678.",
  },
  morada: { empty: "Indica a morada (rua e número)." },
  codpostal: { empty: "Indica o código postal.", ok: (v) => /^\d{4}-\d{3}$/.test(v), bad: "Usa o formato 0000-000." },
  localidade: { empty: "Indica a localidade." },
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
  if (FIELDS[name] && e.target.hasAttribute("aria-invalid")) setError(name, fieldError(name, e.target.value.trim()));
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((k) => (data[k] = String(data[k]).trim()));
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
    const order = { customer: data, text: buildOrderText(state, data) };
    await submitOrder(order);
    $("#order-text").textContent = order.text;
    showPanel("done", true);
  } catch {
    $("#form-status").textContent = "Não foi possível enviar o pedido. Tenta outra vez dentro de instantes.";
  } finally {
    send.disabled = false;
    send.textContent = "Enviar pedido";
  }
});

/* ---------- Nav, diálogos e valores ligados à configuração ---------- */
const toggleBtn = $(".nav__toggle");
const navLinks = $("#nav-links");
toggleBtn.addEventListener("click", () => {
  const open = toggleBtn.getAttribute("aria-expanded") !== "true";
  toggleBtn.setAttribute("aria-expanded", String(open));
  navLinks.classList.toggle("is-open", open);
});
navLinks.addEventListener("click", () => { toggleBtn.setAttribute("aria-expanded", "false"); navLinks.classList.remove("is-open"); });

$$("[data-dialog]").forEach((b) => b.addEventListener("click", () => $(`#${b.dataset.dialog}`).showModal()));

function fillConfigValues() {
  const refillBase = quote({ ...clone(CONFIG.base), mode: "recarga" }).total;
  $$('[data-price="base"]').forEach((n) => (n.textContent = money(quote(CONFIG.base).total)));
  $$('[data-price="refill-base"]').forEach((n) => (n.textContent = money(refillBase)));
  $$('[data-price="engrave"]').forEach((n) => (n.textContent = money(CONFIG.cover.engravePrice)));
  $$("[data-year]").forEach((n) => (n.textContent = CONFIG.year));
  $$("[data-year-next]").forEach((n) => (n.textContent = CONFIG.year + 1));
}

/* ---------- Hero: a agenda monta-se sozinha; as cores deixam experimentar ---------- */
function startHero() {
  const frames = [
    { color: "tinta",   name: "",        modules: ["mensal", "semanal", "notas"] },
    { color: "tomate",  name: "Marta",   modules: ["mensal", "semanal", "notas", "habitos"] },
    { color: "cobalto", name: "",        modules: ["mensal", "diario", "financas", "notas"] },
    { color: "salvia",  name: "Atelier", modules: ["mensal", "semanal", "leituras"] },
    { color: "lilas",   name: "",        modules: CONFIG.modules.map((m) => m.id) },
  ];
  let view = { ...clone(CONFIG.base), ...frames[0] };
  const box = $("#hero-swatches");
  box.innerHTML = CONFIG.colors.map((c) => `<button type="button" class="dot" data-color="${c.id}" aria-label="Capa ${c.label}" aria-pressed="false" style="--c:${c.hex}"></button>`).join("");
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
fillConfigValues();
render();
startHero();
// As fontes chegam depois: voltar a medir o nome gravado.
document.fonts?.ready.then(render);
