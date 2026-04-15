// CPAS Regulatory Search — v4
// Deduped by Supabase row ID, ranked by relevance score
// Regulatory sources always surface above templates for citation queries

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

const REGULATORY = ["FAR","NFS","NFS_CG","PCD","PIC","PN","RFO_FAR","FAR_SAG"];

// Priority order per NASA regulatory hierarchy:
// RFO FAR (Mar 2026) > NFS (Apr 2026) > NFS_CG > PIC > PN > PCD > TEMPLATE > FAR (codified) > FAR_SAG > GUIDE > FORM
const DOC_PRIORITY = {
  RFO_FAR:  50,  // RFO FAR March 2026 — highest authority
  NFS:      45,  // NFS April 2026
  NFS_CG:   40,  // NFS Companion Guide
  PIC:      35,  // Procurement Information Circulars
  PN:       30,  // Procurement Notices
  PCD:      25,  // Procurement Class Deviations
  TEMPLATE: 20,  // Agency-wide templates
  FAR:      15,  // Codified FAR (pre-RFO — lower since RFO supersedes)
  FAR_SAG:  10,  // FAR Strategic Acquisition Guide
  GUIDE:     8,  // Procurement guides
  FORM:      5,  // Forms
};

function score(r, q) {
  let s = 0;
  const ql = q.toLowerCase();
  const section = (r.section || "").toLowerCase();
  const keywords = (r.keywords || "").toLowerCase();
  const title = (r.title || "").toLowerCase();
  const content = (r.content || "").toLowerCase();
  const REGULATORY = ["RFO_FAR","NFS","NFS_CG","PIC","PN","PCD"];

  // Doc type base priority — regulatory always outranks templates
  s += DOC_PRIORITY[r.doc_type] || 0;

  // Section match bonuses
  if (section === ql)           s += 50;
  if (section.startsWith(ql))   s += 30;
  if (section.includes(ql))     s += 20;

  // Keywords contain query
  if (keywords.includes(ql))    s += 15;

  // Title match — reduced weight so templates don't dominate on name matches
  if (title === ql)             s += 10;
  if (title.startsWith(ql))     s += 6;
  if (title.includes(ql))       s += 3;

  // Regulatory content match gets extra boost — substantive text over fill-in-the-blank
  if (content.includes(ql) && REGULATORY.includes(r.doc_type)) s += 12;

  // Citation-specific boosts
  if ((r.doc_type === "NFS" || r.doc_type === "NFS_CG") && ql.match(/^18\d{2}/)) s += 20;
  if (r.doc_type === "RFO_FAR" && ql.match(/^(far|\d{1,2}\.\d|part\s*\d)/i)) s += 20;
  if ((r.doc_type === "FAR" || r.doc_type === "FAR_SAG") && ql.match(/^(far|\d{1,2}\.\d)/i)) s += 10;
  if (r.doc_type === "PCD" && ql.match(/^pcd/i)) s += 20;
  if (r.doc_type === "PIC" && ql.match(/^pic/i)) s += 20;
  if (r.doc_type === "PN" && ql.match(/^pn/i)) s += 20;

  return s;
}

async function sbFetch(url, h) {
  try {
    const res = await fetch(url, { headers: h });
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d) ? d : [];
  } catch(e) { return []; }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };

  try {
    let query, limit, doc_types, section;
    if (event.httpMethod === "GET") {
      const p = event.queryStringParameters || {};
      query = p.q || ""; limit = parseInt(p.limit) || 8;
      doc_types = p.type ? p.type.split(",") : null;
      section = p.section || null;
    } else {
      const b = JSON.parse(event.body || "{}");
      query = b.query || ""; limit = b.limit || 8;
      doc_types = b.doc_types || null;
      section = b.section || null;
    }

    if (!query && !section) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "query required" }) };
    }

    const h = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
    const q = (query || section || "").trim();
    const typeFilter = doc_types?.length ? `&doc_type=in.(${doc_types.join(",")})` : "";
    const base = `${SB_URL}/rest/v1/cpas_regulatory_docs?select=id,source,doc_type,section,title,content,keywords`;
    const L = limit * 4;

    // Deduplicate by both row ID AND content prefix (catches DB-level duplicates)
    const byId = new Map();
    const contentSeen = new Set();
    const add = (rows) => {
      for (const r of rows) {
        const contentKey = (r.content || "").substring(0, 120).trim();
        if (!byId.has(r.id) && !contentSeen.has(contentKey)) {
          byId.set(r.id, r);
          if (contentKey) contentSeen.add(contentKey);
        }
      }
    };

    const enc = (s) => encodeURIComponent(s);
    const like = (s) => `%${s.replace(/[%_]/g, "")}%`;

    // ── 1. Section + keywords exact-ish match (citations, clause numbers) ──
    add(await sbFetch(`${base}&or=(section.ilike.${enc(like(q))},keywords.ilike.${enc(like(q))})${typeFilter}&limit=${L}`, h));

    // ── 2. Title match ───────────────────────────────────────────────────
    add(await sbFetch(`${base}&title=ilike.${enc(like(q))}${typeFilter}&limit=${L}`, h));

    // ── 3. Content match (natural language — JOFOC, sole source, etc.) ──
    // Single content search with the full query — avoids word-by-word duplication
    add(await sbFetch(`${base}&content=ilike.${enc(like(q))}${typeFilter}&limit=${L}`, h));

    // ── 4. Source name match (e.g. searching "PCD 25-16" directly) ──────
    add(await sbFetch(`${base}&source=ilike.${enc(like(q))}${typeFilter}&limit=${limit * 2}`, h));

    // ── Rank, apply source diversity, return top N ───────────────────────
    const scored = [...byId.values()]
      .map(r => ({ ...r, _score: score(r, q) }))
      .sort((a, b) => b._score - a._score);

    // Max chunks per source — prevents one template flooding all 10 results
    const REGULATORY_TYPES = ["RFO_FAR","NFS","NFS_CG","PIC","PN","PCD"];
    const sourceCounts = {};
    const diverse = [];
    for (const r of scored) {
      const sourceKey = (r.source || "").substring(0, 60);
      const maxPerSource = REGULATORY_TYPES.includes(r.doc_type) ? 3 : 2;
      sourceCounts[sourceKey] = (sourceCounts[sourceKey] || 0);
      if (sourceCounts[sourceKey] < maxPerSource) {
        diverse.push(r);
        sourceCounts[sourceKey]++;
      }
      if (diverse.length >= limit * 2) break; // collect extra then trim
    }

    const ranked = diverse.slice(0, limit).map(({ _score, ...r }) => ({
      ...r,
      content: r.content?.substring(0, 1200) || "",
    }));

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ results: ranked, count: ranked.length, query: q }),
    };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
