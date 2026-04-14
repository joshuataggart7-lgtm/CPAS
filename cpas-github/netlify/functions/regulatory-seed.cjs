// CPAS Regulatory Seed Function
// Called by the admin seeder UI to insert chunks into Supabase
// POST { chunks: [...], clear_first: false }
// Protected by simple token check

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const SEED_TOKEN = process.env.SEED_TOKEN || "cpas-seed-2026";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  // Token check
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  if (!auth.includes(SEED_TOKEN)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const { chunks, clear_first } = JSON.parse(event.body || "{}");

    const headers = {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    };

    // Optional: clear all docs first (for re-seed)
    if (clear_first) {
      await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs?id=gt.0`, {
        method: "DELETE", headers
      });
    }

    if (!chunks?.length) {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ inserted: 0 }) };
    }

    // Insert batch
    const res = await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs`, {
      method: "POST",
      headers,
      body: JSON.stringify(chunks),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err }) };
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ inserted: chunks.length }),
    };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
