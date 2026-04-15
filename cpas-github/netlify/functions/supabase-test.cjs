// Quick diagnostic — tests Supabase connection and table access
exports.handler = async (event) => {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
  const SB_ANON = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
  const SB_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const results = {};

  // Test 1 — anon key read
  try {
    const r = await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs?limit=1`, {
      headers: { "apikey": SB_ANON, "Authorization": `Bearer ${SB_ANON}` }
    });
    results.anon_read = { status: r.status, ok: r.ok, body: (await r.text()).substring(0, 200) };
  } catch(e) { results.anon_read = { error: e.message }; }

  // Test 2 — service role key read (if set)
  if (SB_SVC) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs?limit=1`, {
        headers: { "apikey": SB_SVC, "Authorization": `Bearer ${SB_SVC}` }
      });
      results.svc_read = { status: r.status, ok: r.ok, body: (await r.text()).substring(0, 200) };
    } catch(e) { results.svc_read = { error: e.message }; }
  } else {
    results.svc_read = "SUPABASE_SERVICE_ROLE_KEY not set";
  }

  // Test 3 — service role insert one test chunk
  if (SB_SVC) {
    try {
      const testChunk = {
        source: "TEST", doc_type: "TEST", section: "test",
        title: "Test chunk", content: "This is a test chunk for diagnostics.",
        keywords: ""
      };
      const r = await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SB_SVC,
          "Authorization": `Bearer ${SB_SVC}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify([testChunk])
      });
      results.svc_insert = { status: r.status, ok: r.ok, body: (await r.text()).substring(0, 300) };
    } catch(e) { results.svc_insert = { error: e.message }; }
  }

  // Test 4 — check env vars are present
  results.env_check = {
    SUPABASE_URL: SB_URL ? "set" : "MISSING",
    SUPABASE_ANON_KEY: SB_ANON ? "set" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: SB_SVC ? "set" : "MISSING",
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "set" : "MISSING",
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? "set" : "MISSING",
  };

  return { statusCode: 200, headers: cors, body: JSON.stringify(results, null, 2) };
};
