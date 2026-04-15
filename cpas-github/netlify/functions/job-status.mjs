// CPAS Job Status Poller
// GET /api/job-status?id={jobId}
// Returns job state: pending | fetching_kb | generating | done | error

import { getStore } from "@netlify/blobs";

export default async (req) => {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: cors });

  const url = new URL(req.url);
  const jobId = url.searchParams.get("id");

  if (!jobId) {
    return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: cors });
  }

  try {
    const store = getStore("cpas-jobs");
    const job = await store.get(jobId, { type: "json" });

    if (!job) {
      return new Response(JSON.stringify({ status: "not_found" }), { status: 404, headers: cors });
    }

    // Clean up completed/error jobs older than 1 hour
    if ((job.status === "done" || job.status === "error") && job.completed) {
      if (Date.now() - job.completed > 3600000) {
        await store.delete(jobId);
      }
    }

    return new Response(JSON.stringify(job), { status: 200, headers: cors });

  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
};

export const config = { path: "/api/job-status" };
