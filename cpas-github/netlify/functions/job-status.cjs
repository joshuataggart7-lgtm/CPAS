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
    const store = getStore("cpas-jobs");
    const job = await store.get(jobId, { type: "json" });
    if (!job) return { statusCode: 200, headers: cors, body: JSON.stringify({ status: "pending" }) };
    return { statusCode: 200, headers: cors, body: JSON.stringify(job) };
  } catch (err) {
    // If Blobs fails return pending so client keeps polling
    console.error("job-status error:", err.message);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ status: "pending", debug: err.message }) };
  }
};
