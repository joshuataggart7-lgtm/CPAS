// CPAS Regulatory Search
// Full-text + citation search over NFS, NFS CG, PCDs, PICs, PNs, templates, guides, forms
// GET  ?q=1805.303&limit=8&type=NFS
// POST { query, limit, doc_types, section }

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

const REGULATORY = ["NFS","NFS_CG","PCD","PIC","PN","RFO_FAR","FAR_SAG"];

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };

  try {
    let query, limit, doc_types, section;

    if (event.httpMethod === "GET") {
      const p = event.queryStringParameters || {};
      query = p.q || "";
      limit = parseInt(p.limit) || 8;
      doc_types = p.type ? p.type.split(",") : null;
      section = p.section || null;
    } else {
      const body = JSON.parse(event.body || "{}");
      query = body.query || "";
      limit = body.limit || 8;
      doc_types = body.doc_types || null;
      section = body.section || null;
    }

    if (!query && !section) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "query or section required" }) };
    }

    const headers = {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    };

    const fetchLimit = limit * 4;
    const typeFilter = doc_types?.length ? `&doc_type=in.(${doc_types.join(",")})` : "";
    let results = [];
    const seen = new Set(); // content dedup key

    const addResults = (data) => {
      for (const r of (data || [])) {
        const key = r.content?.substring(0, 80) || String(r.id);
        if (!seen.has(key)) {
          seen.add(key);
          results.push(r);
        }
      }
    };

    const q = (query || "").trim();
    const isCitation = /^\d{4}\.|^\d{2}\.\d{3}|^P(?:CD|IC|N)\s*\d|^NFS\s+\d|^FAR\s+\d|^18\d{2}/i.test(q);

    // ── 1. Exact section lookup ────────────────────────────────────
    if (section || isCitation) {
      const searchTerm = section || q;
      const like = `%${searchTerm.replace(/[%_]/g, "")}%`;
      const url = `${SB_URL}/rest/v1/cpas_regulatory_docs`
        + `?select=id,source,doc_type,section,title,content,keywords`
        + `&or=(section.ilike.${encodeURIComponent(like)},keywords.ilike.${encodeURIComponent(like)},title.ilike.${encodeURIComponent(like)})`
        + typeFilter
        + `&limit=${fetchLimit}&order=doc_type.asc`;
      const res = await fetch(url, { headers });
      if (res.ok) addResults(await res.json());
    }

    // ── 2. Full-text search ────────────────────────────────────────
    if (q) {
      const words = q.replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 1);
      if (words.length > 0) {
        const tsQuery = words.map(w => w + ":*").join(" & ");
        const url = `${SB_URL}/rest/v1/cpas_regulatory_docs`
          + `?select=id,source,doc_type,section,title,content,keywords`
          + `&search_vec=plfts.${encodeURIComponent(tsQuery)}`
          + typeFilter
          + `&limit=${fetchLimit}&order=id.asc`;
        const res = await fetch(url, { headers });
        if (res.ok) addResults(await res.json());
      }
    }

    // ── 3. Broad ILIKE fallback if still no results ────────────────
    if (results.length === 0 && q) {
      const like = `%${q.replace(/[%_]/g, "")}%`;
      const url = `${SB_URL}/rest/v1/cpas_regulatory_docs`
        + `?select=id,source,doc_type,section,title,content,keywords`
        + `&or=(title.ilike.${encodeURIComponent(like)},content.ilike.${encodeURIComponent(like)})`
        + typeFilter
        + `&limit=${fetchLimit}`;
      const res = await fetch(url, { headers });
      if (res.ok) addResults(await res.json());
    }

    // ── 4. Re-rank: regulatory first for citation queries ──────────
    if (isCitation && results.length > 0) {
      results.sort((a, b) => {
        const aExact = a.section === q ? -3 : 0;
        const bExact = b.section === q ? -3 : 0;
        const aReg = REGULATORY.includes(a.doc_type) ? -1 : 0;
        const bReg = REGULATORY.includes(b.doc_type) ? -1 : 0;
        return (aExact + aReg) - (bExact + bReg);
      });
    }

    // ── 5. Trim and return ─────────────────────────────────────────
    const trimmed = results.slice(0, limit).map(r => ({
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
