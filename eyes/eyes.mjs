// Eyes: procura nos sites da concorrência cada produto da lista (eyes/produtos.json) pela descrição,
// escolhe o anúncio mais parecido e grava os preços em precos.json (lido pela aba "Preços concorrentes").
// Uso: node eyes/eyes.mjs            (Node 18+, sem dependências)
//      node eyes/eyes.mjs "SORV KIBON 1.5L"   (testa uma descrição e mostra os candidatos)
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("precos.json", ROOT);
const UA = "Mozilla/5.0 (compatible; SolareEyes/1.0)";

/* ---------- texto ---------- */
// abreviações usadas nas descrições do cadastro
const ABBR = {
  sorv: "sorvete", sorvet: "sorvete", choc: "chocolate", choco: "chocolate", lte: "leite", cong: "congelado", congel: "congelado",
  trad: "tradicional", baun: "baunilha", mor: "morango", moran: "morango", framb: "framboesa", nest: "nestle", salg: "salgado",
  pt: "pote", iog: "iogurte", frut: "frutas", ver: "vermelhas", verm: "vermelhas", prot: "proteico", veg: "vegano",
  diaman: "diamante", truf: "trufado", trufad: "trufado", nap: "napolitano", napoli: "napolitano", napolitana: "napolitano",
  cl: "classico", class: "classico", acuc: "acucar", cook: "cookies", cookie: "cookies", c: "com", eskibom: "eskibon",
  pistac: "pistacchio", jerrys: "jerry", vanila: "baunilha", lafrutta: "la frutta", lb: "la basque", nobreli: "nobrelli",
  soupratico: "pratico", demarchi: "de marchi"
};
// grafias diferentes do mesmo termo (só para comparar, não para buscar)
const CANON = {
  pistacchio: "pistache", pistachio: "pistache", baccio: "bacio", vanilla: "baunilha", morangos: "morango", chocolates: "chocolate",
  mirtilos: "mirtilo", blueberry: "mirtilo", bombons: "bombom", bombomzim: "bombom", jerry: "jerry", litros: "litro", napolitana: "napolitano"
};
const STOP = new Set(["de", "da", "do", "das", "dos", "com", "e", "em", "sabor", "o", "a", "the", "and", "para", "sem", "pack", "un", "und", "unidade", "unidades"]);
const LOW = new Set(["sorvete", "gelato", "pote", "tradicional", "congelado", "massa", "original", "classico", "embalagem", "multipack", "litros", "litro"]);
// marcas próprias: o concorrente não vende, então vale o produto equivalente
const OWN = new Set(["qa", "qualita", "tq", "taeq", "pa"]);

const deaccent = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
function sizeOf(s) {
  // "1 5L" e "1,5 L" = 1,5 litro; devolve { v, u } com u em "ml" ou "g"
  const t = deaccent(s).toLowerCase().replace(/(\d)\s+(\d)\s*(l|lt|lts|litros?)\b/g, "$1.$2$3").replace(/(\d),(\d)/g, "$1.$2");
  const re = /(\d+(?:\.\d+)?)\s*(ml|l|lt|lts|litros?|kg|kgs|g|gr|grs|gramas?)\b/g;
  let m, best = null;
  while ((m = re.exec(t))) {
    const n = parseFloat(m[1]), u = m[2];
    const v = /^(l|lt|lts|litro|litros)$/.test(u) ? { v: n * 1000, u: "ml" } : u === "ml" ? { v: n, u: "ml" } : /^kg/.test(u) ? { v: n * 1000, u: "g" } : { v: n, u: "g" };
    if (v.v > 0) best = v;
  }
  return best;
}
const stem = w => w.length > 5 && w.endsWith("s") ? w.slice(0, -1) : w;
function tokens(s, forSearch) {
  const t = deaccent(s).toLowerCase()
    .replace(/(\d)\s+(\d)\s*(l|lt|lts|litros?)\b/g, " ").replace(/\d+(?:[.,]\d+)?\s*(ml|l|lt|lts|litros?|kg|kgs|g|gr|grs|gramas?)\b/g, " ")
    .replace(/\b(sem|zero)( adicao de)? acucar(es)?\b/g, "zero").replace(/c\//g, "com ").replace(/([a-z])-([a-z])/g, "$1$2").replace(/[^a-z0-9]+/g, " ");
  const out = [];
  for (let w of t.split(" ")) {
    if (!w || /^\d+$/.test(w)) continue;
    w = ABBR[w] || w;
    for (let p of w.split(" ")) {
      if (!p || STOP.has(p)) continue;
      if (!forSearch) p = stem(CANON[p] || p);
      if (!out.includes(p)) out.push(p);
    }
  }
  return out;
}
const weight = t => OWN.has(t) ? 0 : LOW.has(t) ? 0.35 : t.length <= 2 ? 0.3 : 1;
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function tokMatch(q, c) {
  if (q === c) return 1;
  if ((q.length >= 3 && c.startsWith(q)) || (c.length >= 4 && q.startsWith(c))) return 0.9;
  if (q.length >= 5 && c.length >= 5 && lev(q, c) <= 1) return 0.85;
  return 0;
}
// sabores/versões: se o anúncio tem um que a descrição não tem, é outro produto da mesma linha
const FLAV = new Set(("chocolate morango napolitano creme floco baunilha pistache coco limao maracuja manga uva amanteigado floresta negra " +
  "integral light zero diet cookie brownie caramelo avela banana guarana iogurte menta framboesa amora cereja abacaxi tapioca milho " +
  "trufado duo ninho chocoleite mirtilo fruta vermelha amarela branco amargo ruby cioccolato doce queijo tablito sundae petit grand mini").split(" "));
const FROZEN = /congelad|sorvete|gelad|acai|frozen|picole/i;
function score(qDesc, cName, brand, cat) {
  const qt = tokens(qDesc), ct = tokens(cName);
  if (!ct.length) return 0;
  let W = 0, got = 0; const used = new Set();
  for (const q of qt) {
    const w = weight(q); if (!w) continue; W += w;
    let best = 0, bi = -1;
    ct.forEach((c, i) => { const m = tokMatch(q, c); if (m > best) { best = m; bi = i; } });
    if (best) { got += w * best; used.add(bi); }
  }
  const recall = W ? got / W : 0;
  const prec = used.size / ct.length;
  let s = 0.82 * recall + 0.18 * prec;
  // marca diferente (quando o produto não é marca própria): "Flocos Kibon" não é "Flocos Nestlé"
  const bt = tokens(brand || "").filter(t => t.length >= 3 && weight(t));
  if (bt.length && !qt.some(q => OWN.has(q))) {
    const hit = bt.some(b => qt.some(q => tokMatch(q, b) >= 0.85 || (b.length >= 4 && q.includes(b))));
    s += hit ? 0.03 : -0.22;
  }
  const a = sizeOf(qDesc), b = sizeOf(cName);
  if (a && b) {
    const r = Math.min(a.v, b.v) / Math.max(a.v, b.v);
    // g × ml não se comparam direto (sorvete de 490 ml pesa uns 380 g)
    if (a.u !== b.u) s -= r >= 0.6 ? 0.02 : 0.4;
    else if (r >= 0.97) s += 0.12; else if (r >= 0.85) s -= 0.05; else if (r >= 0.6) s -= 0.3; else s -= 0.45;
  } else if (a || b) s -= 0.04;
  let fp = 0;
  for (const c of ct) if (FLAV.has(c) && !qt.some(q => tokMatch(q, c) >= 0.85)) fp += 0.1;
  for (const q of qt) if (FLAV.has(q) && !ct.some(c => tokMatch(q, c) >= 0.85)) fp += 0.08;
  s -= Math.min(0.3, fp);
  // a lista é de congelados: licor, aveia, café... de outra seção da loja não serve
  if (cat && !FROZEN.test(deaccent(cat))) s -= 0.25;
  return s;
}
function queriesFor(desc) {
  const t = tokens(desc, true).filter(x => !OWN.has(x));
  const strong = t.filter(x => weight(x) === 1);
  const cat = t.find(x => ["sorvete", "gelato", "acai", "waffle", "picole"].includes(x)) || "";
  const qs = [t.join(" "), [...new Set([cat, ...strong])].filter(Boolean).slice(0, 4).join(" "), strong.slice(0, 3).join(" ")];
  return [...new Set(qs.map(q => q.trim()).filter(q => q.length >= 3))];
}

/* ---------- rede ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, opt = {}, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opt, headers: { "User-Agent": UA, Accept: "application/json", ...(opt.headers || {}) }, signal: AbortSignal.timeout(25000) });
      if (r.status === 429 || r.status >= 500) throw new Error("HTTP " + r.status);
      if (!r.ok && r.status !== 206) throw Object.assign(new Error("HTTP " + r.status), { fatal: true });
      return await r.json();
    } catch (e) {
      if (e.fatal || i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

/* ---------- lojas ---------- */
// Mambo e Carrefour: VTEX intelligent search (o domínio vtexcommercestable do Carrefour não passa pelo captcha do site)
function vtex(host, site) {
  return async q => {
    const u = `https://${host}/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(q)}&count=12&locale=pt-BR&hideUnavailableItems=true`;
    const d = await get(u);
    const out = [];
    for (const p of d.products || []) {
      const it = (p.items || [])[0]; if (!it) continue;
      const s = (it.sellers || []).find(x => x.sellerDefault) || (it.sellers || [])[0]; if (!s) continue;
      const o = s.commertialOffer || {};
      if (!(o.Price > 0)) continue;
      out.push({ nome: p.productName, marca: p.brand || "", preco: o.Price, de: o.ListPrice > o.Price ? o.ListPrice : null,
        cat: (p.categories || [])[0] || "", url: site + (p.link || `/${p.linkText}/p`), img: ((it.images || [])[0] || {}).imageUrl || "", ean: it.ean || "", disp: (o.AvailableQuantity || 0) > 0 });
    }
    return out;
  };
}
// St Marche: Shopify Storefront API, com o token público que o próprio site usa
const SHOP = { host: "totvs-supermercados-st-marche-bp.myshopify.com", token: "07779258819b4b9d63736f6f67f751a1" };
async function stmarche(q) {
  const query = `query($q:String!){search(query:$q,first:12,types:PRODUCT,unavailableProducts:LAST){nodes{...on Product{title vendor handle availableForSale featuredImage{url} collections(first:4){nodes{title}} variants(first:1){nodes{price{amount} compareAtPrice{amount} barcode}}}}}}`;
  const d = await get(`https://${SHOP.host}/api/2024-10/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": SHOP.token },
    body: JSON.stringify({ query, variables: { q } })
  });
  if (d.errors) throw new Error(d.errors.map(e => e.message).join("; "));
  return (d.data.search.nodes || []).map(p => {
    const v = ((p.variants || {}).nodes || [])[0] || {}, pr = +((v.price || {}).amount || 0), de = +((v.compareAtPrice || {}).amount || 0);
    return { nome: p.title, marca: p.vendor || "", cat: ((p.collections || {}).nodes || []).map(c => c.title).join("/"), preco: pr, de: de > pr ? de : null, url: `https://marche.com.br/products/${p.handle}`,
      img: (p.featuredImage || {}).url || "", ean: v.barcode || "", disp: !!p.availableForSale };
  }).filter(x => x.preco > 0);
}
const STORES = {
  mambo: { nome: "Mambo", site: "https://www.mambo.com.br", search: vtex("www.mambo.com.br", "https://www.mambo.com.br") },
  stmarche: { nome: "St Marche", site: "https://marche.com.br", search: stmarche },
  carrefour: { nome: "Carrefour", site: "https://mercado.carrefour.com.br", search: vtex("carrefourbrfood.vtexcommercestable.com.br", "https://mercado.carrefour.com.br") }
};

const MIN = 0.6;  // abaixo disso o anúncio não é considerado o mesmo produto
async function lookup(store, desc) {
  const seen = new Map();
  for (const q of queriesFor(desc)) {
    let res = [];
    try { res = await store.search(q); } catch (e) { if (!seen.size) throw e; }
    for (const c of res) if (!seen.has(c.url)) {
      const raw = score(desc, c.nome, c.marca, c.cat) - (c.disp ? 0 : 0.05);
      seen.set(c.url, { ...c, raw, score: +Math.max(0, Math.min(1, raw)).toFixed(3) });
    }
    const top = Math.max(0, ...[...seen.values()].map(c => c.score));
    if (top >= 0.9) break;
    await sleep(120);
  }
  const cands = [...seen.values()].sort((a, b) => b.raw - a.raw).slice(0, 5);
  return { best: cands[0] && cands[0].score >= MIN ? cands[0] : null, cands };
}

async function pool(items, n, fn) {
  let i = 0; const run = async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } };
  await Promise.all(Array.from({ length: n }, run));
}

/* ---------- execução ---------- */
const arg = process.argv.slice(2).join(" ").trim();
if (arg) {
  console.log("buscas:", queriesFor(arg), "tamanho:", sizeOf(arg));
  for (const [k, st] of Object.entries(STORES)) {
    const r = await lookup(st, arg);
    console.log(`\n${st.nome}:`); r.cands.forEach(c => console.log(`  ${c.score.toFixed(2)}  R$ ${c.preco.toFixed(2)}${c.de ? ` (de ${c.de.toFixed(2)})` : ""}  ${c.nome}`));
  }
  process.exit(0);
}

const list = JSON.parse(readFileSync(new URL("eyes/produtos.json", ROOT), "utf8")).produtos;
const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
const oldBy = new Map((old && old.itens || []).map(x => [x.desc.toUpperCase(), x]));
const now = new Date().toISOString();
const itens = list.map(desc => ({ desc, lojas: {} }));
const erros = {};
const t0 = Date.now();
await Promise.all(Object.entries(STORES).map(([k, st]) => pool(itens, 2, async it => {
  try {
    const { best, cands } = await lookup(st, it.desc);
    const prev = ((oldBy.get(it.desc.toUpperCase()) || {}).lojas || {})[k];
    const slim = c => ({ nome: c.nome, preco: c.preco, de: c.de, url: c.url, score: c.score, disp: c.disp });
    const r = best ? { ...slim(best), ean: best.ean } : null;
    if (r && prev && prev.url === r.url) {
      if (prev.preco !== r.preco) { r.ant = prev.preco; r.antEm = old.geradoEm; }
      else if (prev.ant != null) { r.ant = prev.ant; r.antEm = prev.antEm; }
    }
    it.lojas[k] = r ? { ...r, cands: cands.slice(0, 3).map(slim) } : { nada: true, cands: cands.slice(0, 3).map(slim) };
  } catch (e) {
    (erros[k] = erros[k] || []).push(`${it.desc}: ${e.message}`);
    const prev = ((oldBy.get(it.desc.toUpperCase()) || {}).lojas || {})[k];
    if (prev) it.lojas[k] = { ...prev, velho: true };
  }
})));
const out = {
  geradoEm: now, fonte: "Eyes", segundos: Math.round((Date.now() - t0) / 1000),
  lojas: Object.fromEntries(Object.entries(STORES).map(([k, s]) => [k, { nome: s.nome, site: s.site }])),
  itens, erros
};
writeFileSync(OUT, JSON.stringify(out));
const found = k => itens.filter(i => i.lojas[k] && !i.lojas[k].nada && !i.lojas[k].velho).length;
console.log(`precos.json: ${itens.length} produtos em ${out.segundos}s ·`, Object.keys(STORES).map(k => `${STORES[k].nome} ${found(k)}`).join(" · "),
  Object.keys(erros).length ? "· erros: " + Object.entries(erros).map(([k, v]) => `${k} ${v.length}`).join(", ") : "");
