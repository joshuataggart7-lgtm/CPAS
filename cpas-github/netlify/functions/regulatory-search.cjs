// CPAS Regulatory Search — v3
// Three-strategy search: exact citation match → keyword match → full text
// Regulatory docs always rank above templates for citation queries

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

const REGULATORY = ["NFS","NFS_CG","PCD","PIC","PN","RFO_FAR","FAR_SAG"];

function rankResults(results, query) {
  const q = query.toLowerCase();
  return results.sort((a, b) => {
    // Score each result
    const scoreA = score(a, q);
    const scoreB = score(b, q);
    return scoreB - scoreA;
  });
}

function score(r, q) {
  let s = 0;
  // Regulatory docs get base boost
  if (REGULATORY.includes(r.doc_type)) s += 10;
  // Exact section match is highest priority
  if (r.section?.toLowerCase() === q) s += 50;
  // Section starts with query
  if (r.section?.toLowerCase().startsWith(q)) s += 30;
  // Section contains query
  if (r.section?.toLowerCase().includes(q)) s += 20;
  // Keywords contain query
  if (r.keywords?.toLowerCase().includes(q)) s += 15;
  // Title contains query
  if (r.title?.toLowerCase().includes(q)) s += 10;
  // NFS and NFS_CG get extra boost for NFS citations
  if ((r.doc_type === "NFS" || r.doc_type === "NFS_CG") && q.match(/^18\d{2}/)) s += 15;
  // RFO_FAR gets boost for FAR part queries
  if (r.doc_type === "RFO_FAR" && q.match(/^(far|part|\d{1,2}\.\d)/i)) s += 15;
  return s;
}

async function sbFetch(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
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
    const typeFilter = doc_types?.length ? `&doc_type=in.(${doc_types.join(",")})` : "";
    const q = (query || section || "").trim();
    const fetchLimit = limit * 5;
    const base = `${SB_URL}/rest/v1/cpas_regulatory_docs?select=id,source,doc_type,section,title,content,keywords`;

    let allResults = [];
    const seen = new Set();

    const add = (rows) => {
      for (const r of (rows || [])) {
        const key = r.content?.substring(0, 60) || String(r.id);
        if (!seen.has(key)) { seen.add(key); allResults.push(r); }
      }
    };

    // ── Strategy 1: Exact + partial section match (best for citations) ──
    const likeQ = `%${q.replace(/[%_]/g, "")}%`;
    add(await sbFetch(
      `${base}&or=(section.ilike.${encodeURIComponent(likeQ)},keywords.ilike.${encodeURIComponent(likeQ)})${typeFilter}&limit=${fetchLimit}`, h
    ));

    // ── Strategy 2: Title match ──────────────────────────────────────────
    add(await sbFetch(
      `${base}&title=ilike.${encodeURIComponent(likeQ)}${typeFilter}&limit=${fetchLimit}`, h
    ));

    // ── Strategy 3: Full text search (for natural language queries) ──────
    const words = q.replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      // Try each significant word separately for better recall
      for (const word of words.slice(0, 3)) {
        const wordLike = `%${word}%`;
        add(await sbFetch(
          `${base}&or=(keywords.ilike.${encodeURIComponent(wordLike)},title.ilike.${encodeURIComponent(wordLike)},section.ilike.${encodeURIComponent(wordLike)})${typeFilter}&limit=${Math.ceil(fetchLimit/words.length)}`, h
        ));
      }

      // Also try content search
      add(await sbFetch(
        `${base}&content=ilike.${encodeURIComponent(`%${words.slice(0,2).join("%")}%`)}${typeFilter}&limit=${limit}`, h
      ));
    }

    // ── Rank and return ──────────────────────────────────────────────────
    const ranked = rankResults(allResults, q.toLowerCase());
    const trimmed = ranked.slice(0, limit).map(r => ({
      id: r.id,
      source: r.source,
      doc_type: r.doc_type,
      section: r.section,
      title: r.title,
      content: r.content?.substring(0, 1200) || "",
      keywords: r.keywords,
    }));

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ results: trimmed, count: trimmed.length, query: q }),
    };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
