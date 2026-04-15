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
      const tsQuery = query.trim()
        .replace(/[^\w\s\.\-]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w + ":*")
        .join(" & ");

      // Fetch more than needed so we can dedupe and re-rank
      const fetchLimit = limit * 4;

      let url = `${SB_URL}/rest/v1/cpas_regulatory_docs`;
      url += `?select=id,source,doc_type,section,title,content,keywords`;
      url += `&search_vec=fts.${encodeURIComponent(tsQuery)}`;

      if (doc_types?.length) {
        url += `&doc_type=in.(${doc_types.join(",")})`;
      }
      url += `&limit=${fetchLimit}&order=id.asc`;

      const res = await fetch(url, { headers });

      if (res.ok) {
        const data = await res.json();

        // Dedupe by content prefix (catches duplicate inserts with different IDs)
        const contentSeen = new Set(results.map(r => r.content?.substring(0, 100)));
        const idsSeen = new Set(results.map(r => r.id));
        for (const r of data) {
          const contentKey = r.content?.substring(0, 100) || r.id;
          if (!idsSeen.has(r.id) && !contentSeen.has(contentKey)) {
            results.push(r);
            idsSeen.add(r.id);
            contentSeen.add(contentKey);
          }
        }

        // Re-rank: boost regulatory docs (NFS/PCD/RFO) when query looks like a citation
        const looksLikeCitation = /^\d{4}\.|^\d{2}\.\d{3}|^PCD|^NFS|^FAR/i.test(query.trim());
        if (looksLikeCitation) {
          const REGULATORY = ["NFS","NFS_CG","PCD","PIC","PN","RFO_FAR","FAR_SAG"];
          results.sort((a, b) => {
            const aReg = REGULATORY.includes(a.doc_type) ? 0 : 1;
            const bReg = REGULATORY.includes(b.doc_type) ? 0 : 1;
            // Exact section match gets top priority
            const aExact = a.section === query.trim() ? -1 : 0;
            const bExact = b.section === query.trim() ? -1 : 0;
            return (aExact + aReg) - (bExact + bReg);
          });
        }

      } else {
        // Fallback: ILIKE search
        const likeQuery = `%${query.replace(/[%_]/g, '')}%`;
        const fallbackUrl = `${SB_URL}/rest/v1/cpas_regulatory_docs`
          + `?select=id,source,doc_type,section,title,content,keywords`
          + `&or=(title.ilike.${encodeURIComponent(likeQuery)},section.ilike.${encodeURIComponent(likeQuery)},keywords.ilike.${encodeURIComponent(likeQuery)})`
          + `&limit=${fetchLimit}`;
        const fallRes = await fetch(fallbackUrl, { headers });
        if (fallRes.ok) {
          const fallData = await fallRes.json();
          const contentSeen = new Set(results.map(r => r.content?.substring(0, 100)));
          const idsSeen = new Set(results.map(r => r.id));
          for (const r of fallData) {
            const contentKey = r.content?.substring(0, 100) || r.id;
            if (!idsSeen.has(r.id) && !contentSeen.has(contentKey)) {
              results.push(r);
              idsSeen.add(r.id);
              contentSeen.add(contentKey);
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
