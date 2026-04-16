// CPAS Job Status Poller
// GET /.netlify/functions/job-status?id={jobId}

const { getStore } = require("@netlify/blobs");

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
    const store = getStore({ name: "cpas-jobs", consistency: "strong" });
    const job = await store.get(jobId, { type: "json" });

    if (!job) return { statusCode: 404, headers: cors, body: JSON.stringify({ status: "not_found" }) };

    // Clean up old completed jobs
    if ((job.status === "done" || job.status === "error") && job.completed) {
      if (Date.now() - job.completed > 3600000) {
        await store.delete(jobId).catch(() => {});
      }
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify(job) };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
