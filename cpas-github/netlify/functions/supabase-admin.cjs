// CPAS Supabase Admin — cleanup and maintenance operations
// POST { action: "delete_doc_type", doc_type: "OTHER" }
// POST { action: "count_by_type" }
// POST { action: "dedup" } — removes exact content duplicates keeping lowest id

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const SEED_TOKEN = process.env.SEED_TOKEN || "cpas-seed-2026";

const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization" };

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  if (!auth.includes(SEED_TOKEN)) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };

  try {
    const { action, doc_type } = JSON.parse(event.body || "{}");
    const h = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
    const base = `${SB_URL}/rest/v1/cpas_regulatory_docs`;

    if (action === "count_by_type") {
      const res = await fetch(`${base}?select=doc_type,id`, { headers: h });
      const data = await res.json();
      const counts = {};
      for (const r of data) counts[r.doc_type] = (counts[r.doc_type] || 0) + 1;
      return { statusCode: 200, headers: cors, body: JSON.stringify({ counts, total: data.length }) };
    }

    if (action === "delete_doc_type" && doc_type) {
      const res = await fetch(`${base}?doc_type=eq.${encodeURIComponent(doc_type)}`, { method: "DELETE", headers: h });
      return { statusCode: 200, headers: cors, body: JSON.stringify({ deleted: doc_type, ok: res.ok, status: res.status }) };
    }

    if (action === "dedup") {
      // Dedup by content prefix — fetch in batches to handle large tables
      const res = await fetch(`${base}?select=id,source,content&order=id.asc&limit=20000`, { headers: h });
      const data = await res.json();
      const seen = new Map();
      const toDelete = [];
      for (const r of data) {
        // Normalize source name (remove dashes, spaces, special chars) for comparison
        const normalizedSource = (r.source || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().substring(0, 40);
        const contentKey = normalizedSource + "|" + (r.content || "").substring(0, 100);
        if (seen.has(contentKey)) toDelete.push(r.id);
        else seen.set(contentKey, r.id);
      }
      // Delete duplicates in batches of 50 max for safety
      let deleted = 0;
      for (let i = 0; i < toDelete.length; i += 50) {
        const batch = toDelete.slice(i, i + 50);
        const ids = batch.join(",");
        await fetch(`${base}?id=in.(${ids})`, { method: "DELETE", headers: h });
        deleted += batch.length;
      }
      return { statusCode: 200, headers: cors, body: JSON.stringify({ duplicates_removed: deleted, total_checked: data.length }) };
    }

    if (action === "count_by_source" && doc_type) {
      const res = await fetch(`${base}?select=source,id&doc_type=eq.${encodeURIComponent(doc_type)}&limit=10000`, { headers: h });
      const data = await res.json();
      const counts = {};
      for (const r of data) counts[r.source] = (counts[r.source] || 0) + 1;
      return { statusCode: 200, headers: cors, body: JSON.stringify({ counts, doc_type, total: data.length }) };
    }

    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Unknown action" }) };

  } catch(err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
