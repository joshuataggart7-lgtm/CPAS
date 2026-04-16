const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };

  const jobId = event.queryStringParameters?.id;
  if (!jobId) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "id required" }) };

  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/cpas_jobs?job_id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`,
      { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
    );
    const rows = await res.json();
    if (!rows?.length) return { statusCode: 200, headers: cors, body: JSON.stringify({ status: "pending" }) };

    const job = rows[0];
    let sources = job.sources_used;
    try { if (typeof sources === "string") sources = JSON.parse(sources); } catch(e) {}

    return { statusCode: 200, headers: cors, body: JSON.stringify({
      status: job.status,
      text: job.result_text,
      sources_used: sources,
      chunks_used: job.chunks_used,
      error: job.error_msg,
    })};
  } catch (err) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ status: "pending" }) };
  }
};
