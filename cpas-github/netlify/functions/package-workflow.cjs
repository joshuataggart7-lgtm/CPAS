// CPAS Package Workflow Function
// Storage: Supabase (PostgreSQL)   Email: Resend

const BASE_URL = process.env.CPAS_BASE_URL || "https://cpas-ames.netlify.app";
const FROM     = process.env.RESEND_FROM_EMAIL || "CPAS <onboarding@resend.dev>";
const SB_URL   = process.env.SUPABASE_URL;
const SB_KEY   = process.env.SUPABASE_ANON_KEY;

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Prefer": options.prefer !== undefined ? options.prefer : "return=representation",
      ...(options.extraHeaders || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) { console.error("Supabase error:", res.status, text); throw new Error(`Supabase ${res.status}: ${text}`); }
  try { return text ? JSON.parse(text) : null; } catch(e) { return text; }
}

async function dbInsert(table, data) {
  return sbFetch(table, { method: "POST", body: JSON.stringify(data) });
}

async function dbUpdate(table, id, data) {
  return sbFetch(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

async function dbSelect(table, qs = "") {
  return sbFetch(`${table}${qs ? "?" + qs : ""}`, { method: "GET", prefer: "" });
}

async function dbOne(table, id) {
  const rows = await sbFetch(`${table}?id=eq.${id}`, { method: "GET", prefer: "" });
  return Array.isArray(rows) ? rows[0] : null;
}

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to || !to.includes("@")) return;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: [to], subject, html: wrapEmail(html) }),
    });
    const d = await r.json();
    if (!r.ok) console.error("Resend error:", JSON.stringify(d));
    else console.log("Email sent to", to);
  } catch (e) { console.error("sendEmail:", e.message); }
}

function wrapEmail(body) {
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
  <p style="margin:0;font-size:12px;color:#888">CPAS &nbsp;·&nbsp; <a href="${BASE_URL}" style="color:#4a9eff">cpas-ames.netlify.app</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function daysWaiting(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

exports.handler = async (event) => {
  const hdrs = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: hdrs, body: "" };

  const path   = event.path.replace("/.netlify/functions/package-workflow", "").replace("/package-workflow", "");
  const method = event.httpMethod;
  const qs     = event.queryStringParameters || {};

  if (!SB_URL || !SB_KEY) {
    console.error("SUPABASE_URL or SUPABASE_ANON_KEY not configured");
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: "Database not configured" }) };
  }

  try {

    // POST /submit
    if (method === "POST" && path === "/submit") {
      const pkg = JSON.parse(event.body || "{}");
      const branchChiefEmail = process.env.BRANCH_CHIEF_EMAIL || "";

      const record = {
        status:             "PENDING",
        cor_name:           pkg.reqName   || "",
        cor_email:          pkg.reqEmail  || "",
        req_title:          pkg.reqtitle  || "",
        value:              parseFloat(pkg.valueEstimate) || 0,
        center:             pkg.reqCenter || "",
        urgency:            pkg.urgency   || "NORMAL",
        branch_chief_email: branchChiefEmail,
        package_data:       pkg,
      };

      const rows  = await dbInsert("cpas_packages", record);
      const saved = Array.isArray(rows) ? rows[0] : rows;
      const id    = saved?.id;

      if (id) {
        await dbInsert("cpas_assignment_log", {
          package_id: id, action: "SUBMITTED", action_by: record.cor_email,
          notes: `Submitted by ${record.cor_name}`,
        });
      }

      if (branchChiefEmail) {
        const uc = record.urgency === "URGENT" ? "#cc3333" : record.urgency === "MODERATE" ? "#cc8800" : "#3aaa66";
        await sendEmail(branchChiefEmail, `[CPAS] New Acquisition Package — ${record.req_title}`,
          `<h2 style="color:#0a1a3a;margin-top:0">New Acquisition Package Pending Review</h2>
           <table style="width:100%;border-collapse:collapse">
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:140px">Requirement</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold">${record.req_title}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Value</td><td style="padding:8px 0;border-bottom:1px solid #eee">$${record.value.toLocaleString()}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Center</td><td style="padding:8px 0;border-bottom:1px solid #eee">${record.center}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Submitted By</td><td style="padding:8px 0;border-bottom:1px solid #eee">${record.cor_name} (${record.cor_email})</td></tr>
             <tr><td style="padding:8px 0;color:#666">Urgency</td><td style="padding:8px 0"><span style="color:${uc};font-weight:bold">${record.urgency}</span></td></tr>
           </table>
           <p style="margin-top:20px">
             <a href="${BASE_URL}?bc=1" style="background:#0a1a3a;color:#4a9eff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">REVIEW IN CPAS →</a>
           </p>`
        );
      }

      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true, id }) };
    }

    // GET /list
    if (method === "GET" && path === "/list") {
      let filters;
      if (qs.role === "BC") {
        filters = "status=in.(PENDING,ASSIGNED,REJECTED)&order=submitted_at.asc";
      } else if (qs.role === "CO" && qs.email) {
        filters = `assigned_to_email=eq.${encodeURIComponent(qs.email)}&status=eq.ASSIGNED&order=assigned_at.desc`;
      } else {
        filters = "order=submitted_at.desc";
      }
      const rows = await dbSelect("cpas_packages", filters);
      const out  = (rows || []).map(r => ({ ...r, daysWaiting: daysWaiting(r.submitted_at) }));
      return { statusCode: 200, headers: hdrs, body: JSON.stringify(out) };
    }

    // GET /package/:id
    if (method === "GET" && path.startsWith("/package/")) {
      const id = path.replace("/package/", "");
      const r  = await dbOne("cpas_packages", id);
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };
      r.daysWaiting = daysWaiting(r.submitted_at);
      return { statusCode: 200, headers: hdrs, body: JSON.stringify(r) };
    }

    // POST /approve/:id
    if (method === "POST" && path.startsWith("/approve/")) {
      const id = path.replace("/approve/", "");
      const { approvedBy, assignedToName, assignedToEmail } = JSON.parse(event.body || "{}");
      const now = new Date().toISOString();
      const r   = await dbOne("cpas_packages", id);
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };

      await dbUpdate("cpas_packages", id, {
        status: "ASSIGNED", approved_at: now, approved_by: approvedBy || "",
        assigned_to_name: assignedToName || "", assigned_to_email: assignedToEmail || "", assigned_at: now,
      });
      await dbInsert("cpas_assignment_log", {
        package_id: id, action: "APPROVED_AND_ASSIGNED", action_by: approvedBy || "",
        notes: `Assigned to ${assignedToName || assignedToEmail}`,
      });

      if (assignedToEmail) {
        await sendEmail(assignedToEmail, `[CPAS] Acquisition Assigned to You — ${r.req_title}`,
          `<h2 style="color:#0a1a3a;margin-top:0">Acquisition Package Assigned</h2>
           <p>Assigned to you by <strong>${approvedBy}</strong>.</p>
           <table style="width:100%;border-collapse:collapse">
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:140px">Requirement</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold">${r.req_title}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Value</td><td style="padding:8px 0;border-bottom:1px solid #eee">$${(r.value||0).toLocaleString()}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Center</td><td style="padding:8px 0;border-bottom:1px solid #eee">${r.center}</td></tr>
             <tr><td style="padding:8px 0;color:#666">Submitted By</td><td style="padding:8px 0">${r.cor_name}</td></tr>
           </table>
           <p style="margin-top:20px">
             <a href="${BASE_URL}?pkg=${id}" style="background:#3aaa66;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;font-size:14px">START ACQUISITION →</a>
           </p>
           <p style="color:#888;font-size:12px">This link pre-fills the intake wizard. No re-entry required.</p>`
        );
      }
      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
    }

    // POST /reject/:id
    if (method === "POST" && path.startsWith("/reject/")) {
      const id = path.replace("/reject/", "");
      const { rejectedBy, reason } = JSON.parse(event.body || "{}");
      const now = new Date().toISOString();
      const r   = await dbOne("cpas_packages", id);
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };

      await dbUpdate("cpas_packages", id, {
        status: "REJECTED", rejected_at: now, rejected_by: rejectedBy || "", rejection_reason: reason || "",
      });
      await dbInsert("cpas_assignment_log", {
        package_id: id, action: "REJECTED", action_by: rejectedBy || "", notes: reason || "",
      });

      if (r.cor_email) {
        await sendEmail(r.cor_email, `[CPAS] Package Returned — ${r.req_title}`,
          `<h2 style="color:#0a1a3a;margin-top:0">Acquisition Package Returned</h2>
           <p>Returned by <strong>${rejectedBy}</strong>:</p>
           <div style="background:#fff3f3;border-left:4px solid #cc3333;padding:12px 16px;margin:16px 0">${reason || "No reason provided."}</div>
           <p><strong>Requirement:</strong> ${r.req_title}</p>
           <p><a href="${BASE_URL}" style="background:#0a1a3a;color:#4a9eff;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">OPEN CPAS PORTAL →</a></p>`
        );
      }
      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
    }

    // POST /reassign/:id
    if (method === "POST" && path.startsWith("/reassign/")) {
      const id = path.replace("/reassign/", "");
      const { reassignedBy, assignedToName, assignedToEmail } = JSON.parse(event.body || "{}");
      const now = new Date().toISOString();
      const r   = await dbOne("cpas_packages", id);
      if (!r) return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Not found" }) };

      const prevCO = r.assigned_to_name || r.assigned_to_email || "previous CO";

      await dbUpdate("cpas_packages", id, {
        status: "ASSIGNED",
        assigned_to_name:  assignedToName || "",
        assigned_to_email: assignedToEmail || "",
        assigned_at: now,
        approved_by: reassignedBy || "",
      });
      await dbInsert("cpas_assignment_log", {
        package_id: id, action: "REASSIGNED", action_by: reassignedBy || "",
        notes: `Reassigned from ${prevCO} to ${assignedToName || assignedToEmail}`,
      });

      if (assignedToEmail) {
        await sendEmail(assignedToEmail, `[CPAS] Acquisition Reassigned to You — ${r.req_title}`,
          `<h2 style="color:#0a1a3a;margin-top:0">Acquisition Package Reassigned</h2>
           <p>This acquisition has been reassigned to you by <strong>${reassignedBy}</strong>.</p>
           <table style="width:100%;border-collapse:collapse">
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:140px">Requirement</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:bold">${r.req_title}</td></tr>
             <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Value</td><td style="padding:8px 0;border-bottom:1px solid #eee">$${(r.value||0).toLocaleString()}</td></tr>
             <tr><td style="padding:8px 0;color:#666">Submitted By</td><td style="padding:8px 0">${r.cor_name}</td></tr>
           </table>
           <p style="margin-top:20px">
             <a href="${BASE_URL}?pkg=${id}" style="background:#3aaa66;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block;font-size:14px">START ACQUISITION →</a>
           </p>`
        );
      }
      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
    }

    // POST /start/:id
    if (method === "POST" && path.startsWith("/start/")) {
      const id = path.replace("/start/", "");
      await dbUpdate("cpas_packages", id, { status: "IN_PROGRESS", started_at: new Date().toISOString() });
      await dbInsert("cpas_assignment_log", { package_id: id, action: "STARTED", action_by: "CO", notes: "CO started acquisition" });
      return { statusCode: 200, headers: hdrs, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 404, headers: hdrs, body: JSON.stringify({ error: "Unknown route" }) };

  } catch (e) {
    console.error("package-workflow error:", e.message);
    return { statusCode: 500, headers: hdrs, body: JSON.stringify({ error: e.message }) };
  }
};
