// CPAS Workflow Function
// Handles: create submission, get submissions, approve/return, get single doc
// Storage: Netlify Blobs (shared across all users)

const { getStore } = require("@netlify/blobs");

const STORE_NAME = "cpas-workflow";

// Build approval chain based on doc type and dollar value
function buildChain(docType, value, roles) {
  const v = parseFloat(value) || 0;
  const chain = [];

  // Tech Rep always first
  chain.push({
    role: "Tech Rep",
    email: roles?.techRep || "",
    status: "pending",
    timestamp: null,
    comments: "",
  });

  // CO always second
  chain.push({
    role: "Contracting Officer",
    email: roles?.co || "",
    status: "pending",
    timestamp: null,
    comments: "",
  });

  if (docType === "JOFOC" || docType === "ACQ_PLAN") {
    if (v > 900000) {
      chain.push({
        role: "Competition Advocate",
        email: roles?.ca || "",
        status: "pending",
        timestamp: null,
        comments: "",
      });
    }
    if (v > 20000000) {
      chain.push({
        role: "Head of Contracting Activity",
        email: roles?.hca || "",
        status: "pending",
        timestamp: null,
        comments: "",
      });
    }
    if (v > 150000000) {
      chain.push({
        role: "Senior Procurement Executive",
        email: roles?.spe || "",
        status: "pending",
        timestamp: null,
        comments: "",
      });
    }
  } else {
    // All other docs: CO + Branch Chief
    chain.push({
      role: "Branch Chief",
      email: roles?.supervisor || "",
      status: "pending",
      timestamp: null,
      comments: "",
    });
  }

  return chain;
}

// Send email notification via Resend (free tier)
async function sendNotification(to, subject, body) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return; // skip if not configured

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "CPAS <noreply@cpas-ames.netlify.app>",
        to: [to],
        subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0a1a3a;padding:16px;color:white">
            <strong>CPAS — Contracting Process Automation System</strong><br>
            <small>NASA Ames Research Center</small>
          </div>
          <div style="padding:24px;border:1px solid #ddd">
            ${body}
          </div>
          <div style="padding:12px;background:#f5f5f5;font-size:12px;color:#666">
            Log in at <a href="https://cpas-ames.netlify.app">cpas-ames.netlify.app</a> to review.
          </div>
        </div>`,
      }),
    });
  } catch (e) {
    console.error("Email error:", e.message);
  }
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const path = event.path.replace("/.netlify/functions/workflow", "").replace("/workflow", "");
  const method = event.httpMethod;

  try {
    // ── POST /submit ─────────────────────────────────────────────────────
    if (method === "POST" && path === "/submit") {
      const body = JSON.parse(event.body || "{}");
      const { docType, title, value, center, content, intake, submittedBy, roles } = body;

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const chain = buildChain(docType, value, roles);
      const now = new Date().toISOString();

      const submission = {
        id,
        docType,
        title: title || intake?.reqTitle || "Untitled",
        value: parseFloat(value) || 0,
        center: center || intake?.center || "NASA ARC",
        content,
        intake,
        status: "in_review",
        chain,
        currentStep: 0,
        submittedBy: submittedBy || "",
        submittedAt: now,
        updatedAt: now,
        history: [
          { action: "submitted", by: submittedBy, at: now, comments: "" },
        ],
      };

      await store.setJSON(id, submission);

      // Notify first reviewer
      const first = chain[0];
      if (first?.email) {
        await sendNotification(
          first.email,
          `[CPAS] Action Required: ${docType} — ${submission.title}`,
          `<p>You have a document pending your review in CPAS.</p>
           <p><strong>Document:</strong> ${docType}<br>
           <strong>Requirement:</strong> ${submission.title}<br>
           <strong>Value:</strong> $${submission.value.toLocaleString()}<br>
           <strong>Submitted by:</strong> ${submittedBy}</p>
           <p>Please log in to CPAS to review and approve or return the document.</p>`
        );
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id }) };
    }

    // ── GET /list?role=CO&email=x@y.z ───────────────────────────────────
    if (method === "GET" && path === "/list") {
      const { role, email, all } = event.queryStringParameters || {};
      const { blobs } = await store.list();
      const submissions = [];

      for (const b of blobs) {
        const sub = await store.get(b.key, { type: "json" });
        if (!sub) continue;

        if (all === "true") {
          submissions.push(sub);
        } else if (email) {
          // Show docs where this person has a pending step OR is submitter
          const myStep = sub.chain.find(s => s.email === email && s.status === "pending");
          const isMyTurn = myStep && sub.chain.indexOf(myStep) === sub.currentStep;
          const isMine = sub.submittedBy === email;
          if (isMyTurn || isMine) submissions.push(sub);
        }
      }

      submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return { statusCode: 200, headers, body: JSON.stringify(submissions) };
    }

    // ── GET /doc/:id ─────────────────────────────────────────────────────
    if (method === "GET" && path.startsWith("/doc/")) {
      const id = path.replace("/doc/", "");
      const sub = await store.get(id, { type: "json" });
      if (!sub) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
      return { statusCode: 200, headers, body: JSON.stringify(sub) };
    }

    // ── POST /action/:id ─────────────────────────────────────────────────
    if (method === "POST" && path.startsWith("/action/")) {
      const id = path.replace("/action/", "");
      const sub = await store.get(id, { type: "json" });
      if (!sub) return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };

      const { action, email, comments } = JSON.parse(event.body || "{}");
      // action: "approve" | "return"
      const now = new Date().toISOString();
      const step = sub.chain[sub.currentStep];

      if (!step || step.email !== email) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "Not your turn or wrong email" }) };
      }

      step.status = action === "approve" ? "approved" : "returned";
      step.timestamp = now;
      step.comments = comments || "";

      sub.history.push({ action, by: email, role: step.role, at: now, comments: comments || "" });
      sub.updatedAt = now;

      if (action === "return") {
        sub.status = "returned";
        // Notify submitter
        await sendNotification(
          sub.submittedBy,
          `[CPAS] Returned: ${sub.docType} — ${sub.title}`,
          `<p>Your document has been returned by <strong>${step.role}</strong>.</p>
           <p><strong>Document:</strong> ${sub.docType}<br>
           <strong>Requirement:</strong> ${sub.title}</p>
           ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ""}
           <p>Log in to CPAS to revise and resubmit.</p>`
        );
      } else {
        // Advance chain
        sub.currentStep += 1;
        if (sub.currentStep >= sub.chain.length) {
          sub.status = "approved";
          // Notify submitter of full approval
          await sendNotification(
            sub.submittedBy,
            `[CPAS] Approved: ${sub.docType} — ${sub.title}`,
            `<p>Your document has been fully approved.</p>
             <p><strong>Document:</strong> ${sub.docType}<br>
             <strong>Requirement:</strong> ${sub.title}<br>
             <strong>Value:</strong> $${sub.value.toLocaleString()}</p>`
          );
        } else {
          // Notify next reviewer
          const next = sub.chain[sub.currentStep];
          if (next?.email) {
            await sendNotification(
              next.email,
              `[CPAS] Action Required: ${sub.docType} — ${sub.title}`,
              `<p>You have a document pending your review in CPAS.</p>
               <p><strong>Document:</strong> ${sub.docType}<br>
               <strong>Requirement:</strong> ${sub.title}<br>
               <strong>Value:</strong> $${sub.value.toLocaleString()}<br>
               <strong>Previously approved by:</strong> ${step.role}</p>
               <p>Please log in to CPAS to review.</p>`
            );
          }
        }
      }

      await store.setJSON(id, sub);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, status: sub.status }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Unknown route" }) };

  } catch (e) {
    console.error("Workflow error:", e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
