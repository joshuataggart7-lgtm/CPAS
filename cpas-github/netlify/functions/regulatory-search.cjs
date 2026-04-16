// CPAS Regulatory Search — v5
// Acronym expansion: "jofoc" → searches "justification other than full open competition" in FAR/NFS
// Regulatory docs always surface above templates. Templates appear last as drafting aids.

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Procurement acronym expansion map ──────────────────────────────────────
// Each entry: [regulatory search terms, section hints for citation boost]
const ACRONYMS = {
  "jofoc":    { terms: ["justification other than full open competition","6.303","6.104","sole source justification"], sections: ["6.303","6.104","1806"] },
  "j&a":      { terms: ["justification approval other than full","6.303","6.104"], sections: ["6.303","6.104"] },
  "ja":       { terms: ["justification approval other than full","6.303","6.104"], sections: ["6.303","6.104"] },
  "igce":     { terms: ["independent government cost estimate","price estimate cost estimate"], sections: ["1807","36.203"] },
  "psm":      { terms: ["procurement strategy meeting acquisition plan","1807.14"], sections: ["1807","1807.14"] },
  "anosca":   { terms: ["administrator notification significant contract action","1805.302","1805.32","public announcement"], sections: ["1805.302","1805.32","1849.21"] },
  "cor":      { terms: ["contracting officer representative technical representative","1801.602"], sections: ["1801.602","42.202"] },
  "cotr":     { terms: ["contracting officer technical representative","1801.602"], sections: ["1801.602"] },
  "tina":     { terms: ["truth negotiations act certified cost data","15.403","2.101"], sections: ["15.403","2.101"] },
  "fac":      { terms: ["federal acquisition circular"], sections: [] },
  "pcd":      { terms: ["procurement class deviation"], sections: [] },
  "pic":      { terms: ["procurement information circular"], sections: [] },
  "cpars":    { terms: ["contractor performance assessment reporting","42.1502","past performance evaluation"], sections: ["42.1502","42.1503"] },
  "sat":      { terms: ["simplified acquisition threshold","2.101","13.003"], sections: ["2.101","13.003"] },
  "mpt":      { terms: ["micro-purchase threshold micro purchase","2.101","13.201"], sections: ["2.101","13.201"] },
  "idiq":     { terms: ["indefinite delivery indefinite quantity","16.504","16.505"], sections: ["16.504","16.505"] },
  "ffp":      { terms: ["firm fixed price contract type","16.202"], sections: ["16.202","1816.2"] },
  "t&m":      { terms: ["time and materials contract type","16.601"], sections: ["16.601"] },
  "tm":       { terms: ["time and materials contract type","16.601"], sections: ["16.601"] },
  "cpff":     { terms: ["cost plus fixed fee contract","16.306"], sections: ["16.306"] },
  "near":     { terms: ["NASA electronic acquisition record contract file","1804","4.802"], sections: ["1804","4.802"] },
  "rfo":      { terms: ["revolutionary FAR overhaul"], sections: [] },
  "sow":      { terms: ["statement of work performance work statement","11.101"], sections: ["11.101"] },
  "pws":      { terms: ["performance work statement","11.101"], sections: ["11.101"] },
  "soo":      { terms: ["statement of objectives","11.101"], sections: ["11.101"] },
  "qasp":     { terms: ["quality assurance surveillance plan service contract","46.401","1846"], sections: ["46.401","1846"] },
  "pnm":      { terms: ["price negotiation memorandum fair and reasonable","15.406","1815"], sections: ["15.406","1815"] },
  "oci":      { terms: ["organizational conflict of interest","9.5","9.501"], sections: ["9.5","9.501"] },
  "sca":      { terms: ["service contract act labor standards","22.1003"], sections: ["22.1003"] },
  "dcaa":     { terms: ["defense contract audit agency audit cost accounting","42.101"], sections: ["42.101","15.404"] },
  "fpds":     { terms: ["federal procurement data system contract action report","4.604","4.6"], sections: ["4.604","4.6"] },
  "bpa":      { terms: ["blanket purchase agreement simplified acquisition","13.303"], sections: ["13.303"] },
  "lpta":     { terms: ["lowest price technically acceptable tradeoff","15.101"], sections: ["15.101"] },
  "evms":     { terms: ["earned value management system","34.201","1834"], sections: ["34.201","1834"] },
  "evm":      { terms: ["earned value management system","34.201","1834"], sections: ["34.201","1834"] },
  "sti":      { terms: ["scientific technical information research development","35.011","1852.235"], sections: ["35.011","1852.235"] },
  "tina":     { terms: ["truth in negotiations certified cost data","15.403"], sections: ["15.403"] },
  "sbp":      { terms: ["small business subcontracting plan","19.704","52.219-9"], sections: ["19.704","52.219-9"] },
  "sba":      { terms: ["small business concern administration set-aside","19.102"], sections: ["19.102","1819"] },
  "npa":      { terms: ["NASA notification contract action procurement announcement","1805.32","NPA template"], sections: ["1805.302","1805.32"] },
  "ncms":     { terms: ["NASA contract management system purchase requisition"], sections: ["1804"] },
  "pcr":      { terms: ["policy compliance review procurement"], sections: [] },
  "jaz":      { terms: ["branch workload acquisition"], sections: [] },
  "clin":     { terms: ["contract line item number structure","4.1002"], sections: ["4.1002"] },
  "nda":      { terms: ["non-disclosure agreement proprietary information"], sections: [] },
  "pop":      { terms: ["period of performance contract duration"], sections: [] },
  "pr":       { terms: ["purchase requisition procurement request","1804.11","NCMS"], sections: ["1804.11","1804.12"] },
  "co":       { terms: ["contracting officer warrant authority","1.602"], sections: ["1.602","1801.602"] },
  "hca":      { terms: ["head contracting activity authority","2.101"], sections: ["2.101","1802"] },
  "spe":      { terms: ["senior procurement executive authority","2.101"], sections: ["2.101"] },
  "sse":      { terms: ["sole source exception unique source","6.103","6.104"], sections: ["6.103","6.104"] },
  "sole source": { terms: ["sole source other than full open competition 6.103","6.103-1","other than full and open"], sections: ["6.103","6.104","6.301"] },
  "small business": { terms: ["small business set-aside rule of two 19.502","1819"], sections: ["19.502","1819"] },
  "market research": { terms: ["market research commercial availability 10.001","1810"], sections: ["10.001","1810"] },
  "past performance": { terms: ["past performance evaluation cpars 42.1502","15.305"], sections: ["42.1502","15.305"] },
};

// Doc priority — regulatory always outranks templates
const DOC_PRIORITY = {
  RFO_FAR: 60,
  NFS:     55,
  NFS_CG:  50,
  PIC:     45,
  PN:      40,
  PCD:     38,
  FAR:     30,
  FAR_SAG: 20,
  GUIDE:   10,
  TEMPLATE: 5,  // Always last — they are drafting aids, not guidance
  FORM:     3,
};

const REGULATORY_TYPES = ["RFO_FAR","NFS","NFS_CG","PIC","PN","PCD","FAR","FAR_SAG"];

function score(r, q, isExpanded) {
  let s = DOC_PRIORITY[r.doc_type] || 0;
  const ql = q.toLowerCase();
  const section  = (r.section  || "").toLowerCase();
  const keywords = (r.keywords || "").toLowerCase();
  const title    = (r.title    || "").toLowerCase();
  const content  = (r.content  || "").toLowerCase();

  // Section match — highest signal for citation searches
  if (section === ql)           s += 60;
  if (section.startsWith(ql))   s += 40;
  if (section.includes(ql))     s += 25;

  // Keywords
  if (keywords.includes(ql))    s += 20;

  // Title match — scaled down so template names don't win on acronyms
  if (title === ql)             s += 8;
  if (title.startsWith(ql))     s += 5;
  if (title.includes(ql))       s += 2;

  // Regulatory content match — substantive text is more valuable
  if (content.includes(ql) && REGULATORY_TYPES.includes(r.doc_type)) s += 18;
  if (content.includes(ql) && !REGULATORY_TYPES.includes(r.doc_type)) s += 4;

  // Expanded acronym results: regulatory gets a bonus, templates do not
  if (isExpanded && REGULATORY_TYPES.includes(r.doc_type)) s += 25;

  // Document-type-specific citation boosts
  if ((r.doc_type === "NFS" || r.doc_type === "NFS_CG") && ql.match(/^18\d{2}/)) s += 25;
  if (r.doc_type === "RFO_FAR" && ql.match(/^(far|rfo|\d{1,2}\.\d|part\s*\d)/i)) s += 25;
  if (r.doc_type === "PCD" && ql.match(/^pcd/i)) s += 25;
  if (r.doc_type === "PIC" && ql.match(/^pic/i)) s += 25;
  if (r.doc_type === "PN"  && ql.match(/^pn/i))  s += 25;

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
      query = p.q || ""; limit = parseInt(p.limit) || 10;
      doc_types = p.type ? p.type.split(",") : null;
      section = p.section || null;
    } else {
      const b = JSON.parse(event.body || "{}");
      query = b.query || ""; limit = b.limit || 10;
      doc_types = b.doc_types || null;
      section = b.section || null;
    }

    if (!query && !section) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "query required" }) };
    }

    const h = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
    const q = (query || section || "").trim();
    const ql = q.toLowerCase();
    const typeFilter = doc_types?.length ? `&doc_type=in.(${doc_types.join(",")})` : "";
    const base = `${SB_URL}/rest/v1/cpas_regulatory_docs?select=id,source,doc_type,section,title,content,keywords`;
    const L = limit * 5;

    // ── Acronym expansion check ────────────────────────────────────────
    const expansion = ACRONYMS[ql] || null;
    const expandedTerms = expansion?.terms || [];

    // Dedup by row ID + content prefix
    const byId = new Map();
    const contentSeen = new Set();
    const add = (rows, isExpanded = false) => {
      for (const r of rows) {
        const contentKey = (r.content || "").substring(0, 120).trim();
        if (!byId.has(r.id) && !contentSeen.has(contentKey)) {
          byId.set(r.id, { ...r, _isExpanded: isExpanded });
          if (contentKey) contentSeen.add(contentKey);
        }
      }
    };

    const enc = (s) => encodeURIComponent(s);
    const like = (s) => `%${s.replace(/[%_]/g, "")}%`;

    // ── 1. Direct query: section + keywords ───────────────────────────
    add(await sbFetch(`${base}&or=(section.ilike.${enc(like(q))},keywords.ilike.${enc(like(q))})${typeFilter}&limit=${L}`, h));

    // ── 2. Direct query: title match ──────────────────────────────────
    add(await sbFetch(`${base}&title=ilike.${enc(like(q))}${typeFilter}&limit=${L}`, h));

    // ── 3. Direct query: content match ────────────────────────────────
    add(await sbFetch(`${base}&content=ilike.${enc(like(q))}${typeFilter}&limit=${L}`, h));

    // ── 4. Source name match (e.g. "PCD 25-16") ───────────────────────
    add(await sbFetch(`${base}&source=ilike.${enc(like(q))}${typeFilter}&limit=${limit * 2}`, h));

    // ── 5. ACRONYM EXPANSION — only regulatory types, parallel searches ─
    // This is what fixes "jofoc" returning templates instead of FAR 6.303
    if (expandedTerms.length > 0) {
      const regFilter = `&doc_type=in.(RFO_FAR,NFS,NFS_CG,PIC,PN,PCD,FAR,FAR_SAG)`;
      for (const term of expandedTerms.slice(0, 4)) {
        const tl = term.toLowerCase();
        // Content match on expanded term in regulatory docs only
        add(await sbFetch(`${base}&content=ilike.${enc(like(tl))}${regFilter}&limit=${L}`, h), true);
        // Section match on expanded term
        add(await sbFetch(`${base}&section=ilike.${enc(like(tl))}${regFilter}&limit=${limit * 2}`, h), true);
      }
      // Section hint searches (e.g. "6.303" for JOFOC)
      for (const hint of (expansion.sections || []).slice(0, 3)) {
        add(await sbFetch(`${base}&section=ilike.${enc(like(hint))}${regFilter}&limit=${limit * 2}`, h), true);
      }
    }

    // ── Rank + source diversity ───────────────────────────────────────
    const scored = [...byId.values()]
      .map(r => ({ ...r, _score: score(r, q, r._isExpanded) }))
      .sort((a, b) => b._score - a._score);

    // Cap per source — regulatory gets 3 chunks, templates get 1 max
    const sourceCounts = {};
    const diverse = [];
    for (const r of scored) {
      const sourceKey = (r.source || "").substring(0, 60);
      const maxPerSource = REGULATORY_TYPES.includes(r.doc_type) ? 3 : 1;
      sourceCounts[sourceKey] = (sourceCounts[sourceKey] || 0);
      if (sourceCounts[sourceKey] < maxPerSource) {
        diverse.push(r);
        sourceCounts[sourceKey]++;
      }
      if (diverse.length >= limit * 2) break;
    }

    // Enforce: templates always come after all regulatory results
    const regulatory = diverse.filter(r => REGULATORY_TYPES.includes(r.doc_type));
    const nonRegulatory = diverse.filter(r => !REGULATORY_TYPES.includes(r.doc_type));
    const ordered = [...regulatory, ...nonRegulatory].slice(0, limit);

    const ranked = ordered.map(({ _score, _isExpanded, ...r }) => ({
      ...r,
      content: r.content?.substring(0, 1200) || "",
    }));

    // Include expansion info so the UI can show "Showing results for: justification other than full open competition"
    const responseBody = {
      results: ranked,
      count: ranked.length,
      query: q,
      expanded: expansion ? expandedTerms[0] : null,
    };

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify(responseBody),
    };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
