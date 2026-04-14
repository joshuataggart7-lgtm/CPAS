// CPAS Package Workflow Function
// Handles portal package submissions, branch chief review, CO assignment
// Storage: Netlify Blobs   Email: Resend

const { getStore } = require("@netlify/blobs");
const STORE = "cpas-packages";

const BASE_URL = process.env.CPAS_BASE_URL || "https://cpas-ames.netlify.app";
const FROM     = process.env.RESEND_FROM_EMAIL || "CPAS <onboarding@resend.dev>";

// ── Email ────────────────────────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to || !to.includes("@")) return;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: [to], subject, html: wrap(html) }),
    });
    const d = await r.json();
    if (!r.ok) console.error("Resend error:", JSON.stringify(d));
  } catch (e) { console.error("sendEmail:", e.message); }
}

function wrap(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
<tr><td style="background:#0a1a3a;padding:20px 28px">
  <div style="color:#4a9eff;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px">Contracting Process Automation System</div>
  <div style="color:#fff;font-size:18px;font-weight:bold">CPAS</div>
  <div style="color:#4a6a8a;font-size:11px;margin-top:2px">NASA Ames Research Center</div>
</td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="background:#f4f6f8;padding:14px 28px;border-top:1px solid #e0e4e8">
  <p style="margin:0;font-size:12px;color:#888">
    CPAS — Contracting Process Automation System &nbsp;·&nbsp;
    <a href="${BASE_URL}" style="color:#4a9eff">cpas-ames.netlify.app</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

// ── Days waiting ─────────────────────────────────────────────────────────────
function daysWaiting(isoDate) {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

// ── Handler ──────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const hdrs = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: hdrs, body: "" };

  const store  = getStore({ name: STORE, consistency: "strong" });
  const path   = event.path.replace("/.netlify/functions/package-workflow", "").replace("/package-workflow", "");
  const method = event.httpMethod;
  const qs     = event.queryStringParameters || {};

  try {

    // ── POST /submit ─────────────────────────────────────────────────────────
    // Called by RequestorPortal on submit
    if (method === "POST" && path === "/submit") {
      const pkg = JSON.parse(event.body || "{}");
      const id  = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const now = new Date().toISOString();

      const branchChiefEmail = process.env.BRANCH_CHIEF_EMAIL || pkg.branchChiefEmail || "";

      const record = {
        id,
        status: "PENDING",
        submittedAt: now,
        corName:    pkg.reqName  || "",
        corEmail:   pkg.reqEmail || "",
        reqTitle:   pkg.reqtitle || "",
        value:      parseFloat(pkg.valueEstimate) || 0,
        center:     pkg.reqCenter || "",
        urgency:    pkg.urgency || "NORMAL",
        branchChiefEmail,
        assignedToName:  "",
        assignedToEmail: "",
        assignedAt:      null,
        approvedAt:      null,
        approvedBy:      "",
        rejectedAt:      null,
        rejectionReason: "",
        packageData: pkg,
      };

      await store.setJSON(id, record);

      // Email Branch Chief
      if (branchChiefEmail) {
        const days = 0;
        const urgencyColor = pkg.urgency === "URGENT" ? "#cc3333" : pkg.urgency === "MODERATE" ? "#cc8800" : "#3aaa66";
        await sendEmail(
          branchChiefEmail,
          `[CPAS] New Acquisition Package — ${record.reqTitle}`,
          `<h2 style="color:#0a1a3a;margin-top:0">New Acquisition Package Pending Review</h2>
           <table style="width:100%;border-collapse:collapse">
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:140px">Requirement</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold">${record.reqTitle}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Estimated Value</td><td style="padding:8px 0;border-bottom:1px solid #eee">$${record.value.toLocaleString()}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Center</td><td style="padding:8px 0;border-bottom:1px solid #eee">${record.center}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Submitted By</td><td style="padding:8px 0;border-bottom:1px solid #eee">${record.corName} (${record.corEmail})</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Urgency</td><td style="padding:8px 0;border-bottom:1px solid #eee"><span style="color:${urgencyColor};font-weight:bold">${record.urgency}</span></td></tr>
             <tr><td style="padding:8px 0;color:#666">Days Waiting</td><td style="padding:8px 0;font-weight:bold">0</td></tr>
           </table>
           <p style="margin-top:20px">
             <a href="${BASE_URL}?bc=1" style="background:#0a1a3a;color:#4a9eff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">
               REVIEW IN CPAS →
             </a>
           </p>
           <p style="color:#888;font-size:12px">Open CPAS, click TOOLS → Branch Chief Queue, and enter your email to see all pending packages.</p>`
        );
      }

      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true, id }) };
    }

    // ── GET /list?role=BC or /list?role=CO&email=x ───────────────────────────
    if (method === "GET" && path === "/list") {
      const { blobs } = await store.list();
      const records = [];
      for (const b of blobs) {
        const r = await store.get(b.key, { type: "json" });
        if (!r) continue;
        // Attach computed days waiting
        r.daysWaiting = daysWaiting(r.submittedAt);
        if (qs.role === "BC") {
          // Branch chief sees everything not yet IN_PROGRESS or COMPLETE
          if (!["IN_PROGRESS","COMPLETE"].includes(r.status)) records.push(r);
        } else if (qs.role === "CO" && qs.email) {
          // CO sees packages assigned to them
          if (r.assignedToEmail === qs.email && r.status === "ASSIGNED") records.push(r);
        } else {
          records.push(r);
        }
      }
      records.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)); // oldest first
      return { statusCode: 200, headers: hdrs, body: JSON.stringify(records) };
    }

    // ── GET /package/:id ─────────────────────────────────────────────────────
    if (method === "GET" && path.startsWith("/package/")) {
      const id = path.replace("/package/", "");
      const r  = await store.get(id, { type: "json" });
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };
      r.daysWaiting = daysWaiting(r.submittedAt);
      return { statusCode: 200, headers: hdrs, body: JSON.stringify(r) };
    }

    // ── POST /approve/:id ────────────────────────────────────────────────────
    // Body: { approvedBy, assignedToName, assignedToEmail }
    if (method === "POST" && path.startsWith("/approve/")) {
      const id = path.replace("/approve/", "");
      const r  = await store.get(id, { type: "json" });
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };

      const { approvedBy, assignedToName, assignedToEmail } = JSON.parse(event.body || "{}");
      const now = new Date().toISOString();

      r.status          = "ASSIGNED";
      r.approvedAt      = now;
      r.approvedBy      = approvedBy || "";
      r.assignedToName  = assignedToName || "";
      r.assignedToEmail = assignedToEmail || "";
      r.assignedAt      = now;

      await store.setJSON(id, r);

      // Email CO with deep link
      if (assignedToEmail) {
        await sendEmail(
          assignedToEmail,
          `[CPAS] Acquisition Assigned to You — ${r.reqTitle}`,
          `<h2 style="color:#0a1a3a;margin-top:0">Acquisition Package Assigned</h2>
           <p>A new acquisition has been assigned to you by <strong>${approvedBy}</strong>.</p>
           <table style="width:100%;border-collapse:collapse">
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:140px">Requirement</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold">${r.reqTitle}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Estimated Value</td><td style="padding:8px 0;border-bottom:1px solid #eee">$${r.value.toLocaleString()}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Center</td><td style="padding:8px 0;border-bottom:1px solid #eee">${r.center}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Submitted By</td><td style="padding:8px 0;border-bottom:1px solid #eee">${r.corName}</td></tr>
             <tr><td style="padding:8px 0;color:#666">Urgency</td><td style="padding:8px 0">${r.urgency}</td></tr>
           </table>
           <p style="margin-top:20px">Click the button below to open CPAS with this package pre-loaded and ready to go:</p>
           <p>
             <a href="${BASE_URL}?pkg=${id}" style="background:#3aaa66;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;font-size:14px">
               START ACQUISITION →
             </a>
           </p>
           <p style="color:#888;font-size:12px">This link pre-fills the intake wizard with the package data submitted by ${r.corName}. No re-entry required.</p>`
        );
      }

      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
    }

    // ── POST /reject/:id ─────────────────────────────────────────────────────
    // Body: { rejectedBy, reason }
    if (method === "POST" && path.startsWith("/reject/")) {
      const id = path.replace("/reject/", "");
      const r  = await store.get(id, { type: "json" });
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };

      const { rejectedBy, reason } = JSON.parse(event.body || "{}");
      const now = new Date().toISOString();

      r.status          = "REJECTED";
      r.rejectedAt      = now;
      r.rejectedBy      = rejectedBy || "";
      r.rejectionReason = reason || "";

      await store.setJSON(id, r);

      // Email COR
      if (r.corEmail) {
        await sendEmail(
          r.corEmail,
          `[CPAS] Package Returned — ${r.reqTitle}`,
          `<h2 style="color:#0a1a3a;margin-top:0">Acquisition Package Returned</h2>
           <p>Your acquisition package has been returned by <strong>${rejectedBy}</strong> for the following reason:</p>
           <div style="background:#fff3f3;border-left:4px solid #cc3333;padding:12px 16px;margin:16px 0;color:#333">
             ${reason || "No reason provided."}
           </div>
           <p><strong>Requirement:</strong> ${r.reqTitle}</p>
           <p>Please address the comments above and resubmit through the CPAS Requestor Portal.</p>
           <p>
             <a href="${BASE_URL}" style="background:#0a1a3a;color:#4a9eff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">
               OPEN CPAS PORTAL →
             </a>
           </p>`
        );
      }

      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
    }

    // ── POST /start/:id ──────────────────────────────────────────────────────
    // CO marks acquisition as started
    if (method === "POST" && path.startsWith("/start/")) {
      const id = path.replace("/start/", "");
      const r  = await store.get(id, { type: "json" });
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };
      r.status = "IN_PROGRESS";
      r.startedAt = new Date().toISOString();
      await store.setJSON(id, r);
      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Unknown route" }) };

  } catch (e) {
    console.error("package-workflow error:", e);
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
