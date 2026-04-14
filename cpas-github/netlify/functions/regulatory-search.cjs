// CPAS Regulatory Search
// Full-text search over NFS, NFS CG, PCDs, PICs, PNs stored in Supabase
// GET  ?q=1805.303&limit=5&type=NFS
// POST { query, limit, doc_types, section }

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    let results = [];

    // If exact section lookup requested, do that first
    if (section) {
      const secRes = await fetch(
        `${SB_URL}/rest/v1/cpas_regulatory_docs?section=eq.${encodeURIComponent(section)}&select=id,source,doc_type,section,title,content,keywords&limit=5`,
        { headers }
      );
      if (secRes.ok) {
        const secData = await secRes.json();
        results = secData;
      }
    }

    // Full-text search if query provided
    if (query && query.trim()) {
      // Sanitize query for tsquery — replace spaces with & and remove special chars
      const tsQuery = query.trim()
        .replace(/[^\w\s\.\-]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w + ":*")  // prefix matching
        .join(" & ");

      let url = `${SB_URL}/rest/v1/cpas_regulatory_docs`;
      url += `?select=id,source,doc_type,section,title,content,keywords`;
      url += `&search_vec=fts.${encodeURIComponent(tsQuery)}`;

      if (doc_types?.length) {
        url += `&doc_type=in.(${doc_types.join(",")})`;
      }
      url += `&limit=${limit}&order=id.asc`;

      const res = await fetch(url, { headers });

      if (res.ok) {
        const data = await res.json();
        // Merge with section results, dedupe by id
        const ids = new Set(results.map(r => r.id));
        for (const r of data) {
          if (!ids.has(r.id)) { results.push(r); ids.add(r.id); }
        }
      } else {
        // Fallback: ILIKE search if full-text fails (table may not have tsvector yet)
        const likeQuery = `%${query.replace(/[%_]/g, '')}%`;
        const fallbackUrl = `${SB_URL}/rest/v1/cpas_regulatory_docs`
          + `?select=id,source,doc_type,section,title,content,keywords`
          + `&or=(title.ilike.${encodeURIComponent(likeQuery)},section.ilike.${encodeURIComponent(likeQuery)},keywords.ilike.${encodeURIComponent(likeQuery)})`
          + `&limit=${limit}`;
        const fallRes = await fetch(fallbackUrl, { headers });
        if (fallRes.ok) {
          const fallData = await fallRes.json();
          const ids = new Set(results.map(r => r.id));
          for (const r of fallData) {
            if (!ids.has(r.id)) { results.push(r); ids.add(r.id); }
          }
        }
      }
    }

    // Trim content for response size
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
      body: JSON.stringify({ results: trimmed, count: trimmed.length, query }),
    };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
