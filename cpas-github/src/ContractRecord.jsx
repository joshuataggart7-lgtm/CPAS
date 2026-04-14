// CPAS Contract Record — Post-Award Lifecycle Management
// Connects to Supabase cpas_contract_records, cpas_contract_mods, cpas_rea_claims

import React, { useState, useEffect, useCallback } from "react";

const SB_URL = "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const C = {
  bg: "#f5f7fa", bg2: "#ffffff", bg3: "#eef1f6",
  border: "#dde3ef", blue: "#1a3a6e", text: "#1a2332",
  muted: "#6b7a99", dim: "#8896b0", green: "#0f6e56",
  yellow: "#854f0b", red: "#a32d2d",
};

const inp = {
  background: "#fff", border: "1px solid #dde3ef", color: "#1a2332",
  padding: "8px 12px", borderRadius: 7, fontSize: 12,
  width: "100%", boxSizing: "border-box", fontFamily: FONT, outline: "none",
};
const ta = { ...inp, resize: "vertical", minHeight: 60, lineHeight: 1.5 };
const sel = { ...inp };

const STATUSES = ["Pre-Award", "Post-Award", "Closeout", "Cancelled", "Transferred"];
const PRIORITIES = ["High", "Medium", "Low"];
const CONTRACT_TYPES = ["FFP", "CPFF", "CPAF", "CP No Fee", "T&M", "LH", "HYBRID", "IDIQ (Single Award)", "IDIQ (Multiple Award)", "TBD"];
const COMPETITION = ["Sole Source", "Competitive", "IDIQ (Single Award)", "IDIQ (Multiple Award)", "TBD"];
const SUPPORT_CODES = ["PX", "RE", "RS", "RD", "R", "SG", "SGE", "STT", "HQ", "JA", "S", "T", "TS", "TBD"];
const DIRECTORATES = ["S", "R", "P", "T", "D", "HQ", "TBD"];
const MOD_TYPES = ["Admin", "Funding", "Scope", "NCE", "Option Exercise", "Deobligation", "Clause Update", "Stop Work", "Other"];
const MOD_STATUSES = ["Planned", "In Progress", "Awaiting Signature", "Complete", "Cancelled"];

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Prefer": opts.prefer !== undefined ? opts.prefer : "return=representation",
      ...(opts.extraHeaders || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DB error ${res.status}: ${text}`);
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

const lbl = (t, req) => (
  <div style={{ fontSize: 10, color: req ? C.yellow : C.muted, fontWeight: "600",
    letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3, marginTop: 10, fontFamily: FONT }}>
    {t}{req ? " *" : ""}
  </div>
);

const sect = (title) => (
  <div style={{ fontSize: 10, color: C.blue, fontWeight: "600", letterSpacing: "0.8px",
    textTransform: "uppercase", borderBottom: `2px solid ${C.border}`, paddingBottom: 6,
    marginTop: 20, marginBottom: 12, fontFamily: FONT }}>
    {title}
  </div>
);

const card = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10,
  padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 3px rgba(26,58,110,0.05)" };

// ── Status badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    "Pre-Award": { bg: "#e6f1fb", text: "#185fa5", border: "#b5d4f4" },
    "Post-Award": { bg: "#e1f5ee", text: "#0f6e56", border: "#9fe1cb" },
    "Closeout": { bg: "#fff8e6", text: "#854f0b", border: "#f5c542" },
    "Cancelled": { bg: "#fff0f0", text: "#a32d2d", border: "#f5a0a0" },
    "Transferred": { bg: "#eef1f6", text: "#6b7a99", border: "#dde3ef" },
  };
  const c = colors[status] || colors["Pre-Award"];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: "500", fontFamily: FONT }}>
      {status}
    </span>
  );
}

// ── Contract List ──────────────────────────────────────────────────
function ContractList({ onSelect, onNew }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    sbFetch("cpas_contract_records?order=updated_at.desc")
      .then(r => setRecords(Array.isArray(r) ? r : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    if (filter !== "All" && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.contract_number || "").toLowerCase().includes(q) ||
             (r.contractor_name || "").toLowerCase().includes(q) ||
             (r.description || "").toLowerCase().includes(q) ||
             (r.co_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalValue = records.filter(r => r.status === "Post-Award")
    .reduce((s, r) => s + (parseFloat(r.current_value) || 0), 0);
  const expiring90 = records.filter(r => {
    if (!r.pop_end || r.status !== "Post-Award") return false;
    const days = Math.floor((new Date(r.pop_end) - Date.now()) / 86400000);
    return days >= 0 && days <= 90;
  });

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Stats strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Total Contracts", val: records.length, color: C.blue },
          { label: "Post-Award", val: records.filter(r => r.status === "Post-Award").length, color: C.green },
          { label: "Pre-Award", val: records.filter(r => r.status === "Pre-Award").length, color: "#185fa5" },
          { label: "Active Value", val: `$${(totalValue / 1000000).toFixed(1)}M`, color: C.yellow },
          { label: "Expiring ≤90d", val: expiring90.length, color: expiring90.length > 0 ? C.red : C.muted },
        ].map((s, i) => (
          <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "10px 16px", minWidth: 110, boxShadow: "0 1px 3px rgba(26,58,110,0.05)" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 20, color: s.color, fontWeight: "600" }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Expiring alert */}
      {expiring90.length > 0 && (
        <div style={{ background: "#fff8e6", border: "1px solid #f5c542", borderRadius: 8,
          padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#7a4a00" }}>
          ⚠ {expiring90.length} contract{expiring90.length > 1 ? "s" : ""} expiring within 90 days —{" "}
          {expiring90.map(r => r.contract_number || "TBD").join(", ")}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="Search contracts, contractors, COs..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, width: 280, flex: "none" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["All", ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                fontFamily: FONT, border: `1px solid ${filter === s ? C.blue : C.border}`,
                background: filter === s ? C.blue : C.bg2,
                color: filter === s ? "#fff" : C.muted, fontWeight: filter === s ? "500" : "400" }}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={onNew}
          style={{ marginLeft: "auto", background: C.blue, color: "#fff", border: "none",
            padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 12,
            fontWeight: "500", fontFamily: FONT }}>
          + New Contract Record
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>Loading contract records...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: C.muted, textAlign: "center", padding: 40, border: `1px dashed ${C.border}`, borderRadius: 8 }}>
          {records.length === 0 ? "No contract records yet. Click + New Contract Record to add your first." : "No records match your filters."}
        </div>
      ) : (
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                {["Status","Contract #","Contractor","Description","CO","POP End","Value","Actions"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10,
                    color: C.muted, fontWeight: "600", letterSpacing: "0.5px",
                    textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const daysLeft = r.pop_end ? Math.floor((new Date(r.pop_end) - Date.now()) / 86400000) : null;
                return (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`,
                    background: i % 2 === 0 ? C.bg2 : C.bg3 }}>
                    <td style={{ padding: "8px 12px" }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: "8px 12px", color: C.blue, fontWeight: "500" }}>
                      {r.contract_number || "—"}
                    </td>
                    <td style={{ padding: "8px 12px", color: C.text, maxWidth: 180 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.contractor_name || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "8px 12px", color: C.muted, maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.description || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "8px 12px", color: C.text }}>{r.co_name || "—"}</td>
                    <td style={{ padding: "8px 12px" }}>
                      {r.pop_end ? (
                        <span style={{ color: daysLeft !== null && daysLeft <= 30 ? C.red :
                          daysLeft !== null && daysLeft <= 90 ? C.yellow : C.text }}>
                          {new Date(r.pop_end).toLocaleDateString()}
                          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 90 &&
                            <span style={{ fontSize: 10, marginLeft: 4 }}>({daysLeft}d)</span>}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", color: C.text, fontWeight: "500" }}>
                      {r.current_value ? `$${parseFloat(r.current_value).toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <button onClick={() => onSelect(r)}
                        style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                          padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                          fontSize: 11, fontFamily: FONT }}>
                        Open →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Contract Form ──────────────────────────────────────────────────
function ContractForm({ record, intake, onSaved, onBack }) {
  const isNew = !record?.id;
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("contract");
  const [mods, setMods] = useState([]);
  const [reas, setReas] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  // Pre-populate from CPAS intake when creating new record
  const initFromIntake = (i) => i ? {
    co_name: i.coName || "",
    co_email: i.coEmail || "",
    cor_name: i.techRepName || "",
    cor_email: i.techRepEmail || "",
    center: i.center || "",
    contract_type: i.contractType || "",
    competition: i.competitionStrategy?.replace(/_/g, " ") || "",
    description: i.reqTitle || "",
    naics: i.naics || "",
    psc: i.psc || "",
    current_value: i.value || "",
    potential_value: i.value || "",
    is_commercial: i.isCommercial === "YES",
    pop_start: "",
    pop_end: "",
    status: "Pre-Award",
  } : {};

  const [form, setForm] = useState(() => ({
    // defaults
    status: "Pre-Award", priority: "", contract_number: "", rfp_nra_number: "",
    pr_number: "", center: "", branch: "", co_name: "", co_email: "",
    cs_name: "", cor_name: "", cor_email: "", tm_alt_cor: "",
    contractor_name: "", contractor_poc: "", contractor_poc_email: "", contractor_poc_phone: "",
    contract_type: "", competition: "", description: "", naics: "", psc: "",
    support_code: "", directorate: "", primary_funding: "",
    current_value: "", potential_value: "", current_funding: "", fund_thru_date: "",
    pop_start: "", pop_end: "", current_period: "",
    over_10m: false, is_nra: false, is_commercial: false, small_business_set_aside: "",
    closeout_submitted: false, closeout_date: "", impact_statement: "",
    pending_actions: "", award_file_link: "",
    // apply from existing record or intake
    ...(record || initFromIntake(intake)),
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Load mods and REAs for existing records
  useEffect(() => {
    if (!record?.id) return;
    sbFetch(`cpas_contract_mods?contract_id=eq.${record.id}&order=created_at.asc`)
      .then(r => setMods(Array.isArray(r) ? r : [])).catch(console.error);
    sbFetch(`cpas_rea_claims?contract_id=eq.${record.id}&order=created_at.asc`)
      .then(r => setReas(Array.isArray(r) ? r : [])).catch(console.error);
  }, [record?.id]);

  async function save() {
    setSaving(true);
    try {
      const nullDate = (v) => v && v.trim() !== "" ? v : null;
      const payload = {
        ...form,
        current_value: form.current_value ? parseFloat(form.current_value) : null,
        potential_value: form.potential_value ? parseFloat(form.potential_value) : null,
        current_funding: form.current_funding ? parseFloat(form.current_funding) : null,
        over_10m: parseFloat(form.current_value || 0) >= 10000000 || form.over_10m,
        intake_data: intake || null,
        updated_at: new Date().toISOString(),
        // Null out empty date strings — Postgres rejects ""
        fund_thru_date: nullDate(form.fund_thru_date),
        pop_start: nullDate(form.pop_start),
        pop_end: nullDate(form.pop_end),
        closeout_date: nullDate(form.closeout_date),
      };
      if (isNew) {
        await sbFetch("cpas_contract_records", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await sbFetch(`cpas_contract_records?id=eq.${record.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setSuccessMsg(isNew ? "Contract record created." : "Changes saved.");
      setTimeout(() => setSuccessMsg(""), 3000);
      onSaved?.();
    } catch (e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  }

  async function addMod(mod) {
    try {
      const clean = { ...mod,
        mod_value: mod.mod_value ? parseFloat(mod.mod_value) : null,
        target_date: mod.target_date || null,
        completed_date: mod.completed_date || null,
        contract_id: record?.id,
        contract_number: form.contract_number,
      };
      await sbFetch("cpas_contract_mods", { method: "POST", body: JSON.stringify(clean) });
      const updated = await sbFetch(`cpas_contract_mods?contract_id=eq.${record.id}&order=created_at.asc`);
      setMods(Array.isArray(updated) ? updated : []);
    } catch (e) { alert("Failed: " + e.message); }
  }

  async function addREA(rea) {
    try {
      const clean = { ...rea,
        requested_amount: rea.requested_amount ? parseFloat(rea.requested_amount) : null,
        questioned_amount: rea.questioned_amount ? parseFloat(rea.questioned_amount) : null,
        disposition_amount: rea.disposition_amount ? parseFloat(rea.disposition_amount) : null,
        date_received: rea.date_received || null,
        pricing_notified: rea.pricing_notified || null,
        disposition_date: rea.disposition_date || null,
        contract_id: record?.id,
        contract_number: form.contract_number,
      };
      await sbFetch("cpas_rea_claims", { method: "POST", body: JSON.stringify(clean) });
      const updated = await sbFetch(`cpas_rea_claims?contract_id=eq.${record.id}&order=created_at.asc`);
      setReas(Array.isArray(updated) ? updated : []);
    } catch (e) { alert("Failed: " + e.message); }
  }

  const tabStyle = (id) => ({
    padding: "7px 16px", border: `1px solid ${tab === id ? C.blue : C.border}`,
    background: tab === id ? C.blue : C.bg2, color: tab === id ? "#fff" : C.muted,
    borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: tab === id ? "500" : "400",
    fontFamily: FONT,
  });

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={onBack}
          style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted,
            padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
          ← All Contracts
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600", color: C.text, fontSize: 14 }}>
            {form.contract_number || "New Contract Record"}
          </div>
          {form.contractor_name && <div style={{ color: C.muted, fontSize: 11 }}>{form.contractor_name}</div>}
        </div>
        {!isNew && <StatusBadge status={form.status} />}
        {successMsg && (
          <span style={{ color: C.green, fontSize: 12, fontWeight: "500" }}>✓ {successMsg}</span>
        )}
        <button onClick={save} disabled={saving}
          style={{ background: C.blue, color: "#fff", border: "none", padding: "8px 20px",
            borderRadius: 8, cursor: saving ? "default" : "pointer", fontSize: 12,
            fontWeight: "500", opacity: saving ? 0.7 : 1, fontFamily: FONT }}>
          {saving ? "Saving..." : isNew ? "Create Record" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          ["contract", "Contract Details"],
          ["financial", "Financial"],
          ["mods", `Modifications${mods.length > 0 ? ` (${mods.length})` : ""}`],
          ["reas", `REAs & Claims${reas.length > 0 ? ` (${reas.length})` : ""}`],
          ["admin", "Administration"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={tabStyle(id)}>{label}</button>
        ))}
      </div>

      {/* CONTRACT DETAILS TAB */}
      {tab === "contract" && (
        <div>
          <div style={card}>
            {sect("Status & Identity")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                {lbl("Status", true)}
                <select value={form.status} onChange={e => set("status", e.target.value)} style={sel}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                {lbl("Priority")}
                <select value={form.priority} onChange={e => set("priority", e.target.value)} style={sel}>
                  <option value="">—</option>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                {lbl("Branch")}
                <input value={form.branch} onChange={e => set("branch", e.target.value)} style={inp} placeholder="e.g. JAZ" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                {lbl("Contract Number")}
                <input value={form.contract_number} onChange={e => set("contract_number", e.target.value)} style={inp} placeholder="e.g. 80ARC025DA006" />
              </div>
              <div>
                {lbl("RFP / NRA Number")}
                <input value={form.rfp_nra_number} onChange={e => set("rfp_nra_number", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("PR Number")}
                <input value={form.pr_number} onChange={e => set("pr_number", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("Center")}
                <input value={form.center} onChange={e => set("center", e.target.value)} style={inp} placeholder="e.g. Ames (ARC)" />
              </div>
            </div>
          </div>

          <div style={card}>
            {sect("People")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                {lbl("Assigned CO/CS")}
                <input value={form.co_name} onChange={e => set("co_name", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("CO Email")}
                <input value={form.co_email} onChange={e => set("co_email", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("COR")}
                <input value={form.cor_name} onChange={e => set("cor_name", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("COR Email")}
                <input value={form.cor_email} onChange={e => set("cor_email", e.target.value)} style={inp} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                {lbl("TM / Alt COR")}
                <input value={form.tm_alt_cor} onChange={e => set("tm_alt_cor", e.target.value)} style={inp} />
              </div>
            </div>
          </div>

          <div style={card}>
            {sect("Contractor")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                {lbl("Contractor Name")}
                <input value={form.contractor_name} onChange={e => set("contractor_name", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("Contractor POC")}
                <input value={form.contractor_poc} onChange={e => set("contractor_poc", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("POC Email")}
                <input value={form.contractor_poc_email} onChange={e => set("contractor_poc_email", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("POC Phone")}
                <input value={form.contractor_poc_phone} onChange={e => set("contractor_poc_phone", e.target.value)} style={inp} />
              </div>
            </div>
          </div>

          <div style={card}>
            {sect("Contract Details")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                {lbl("Contract Type")}
                <select value={form.contract_type} onChange={e => set("contract_type", e.target.value)} style={sel}>
                  <option value="">—</option>
                  {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                {lbl("Competition")}
                <select value={form.competition} onChange={e => set("competition", e.target.value)} style={sel}>
                  <option value="">—</option>
                  {COMPETITION.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                {lbl("Support Code")}
                <select value={form.support_code} onChange={e => set("support_code", e.target.value)} style={sel}>
                  <option value="">—</option>
                  {SUPPORT_CODES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                {lbl("Directorate")}
                <select value={form.directorate} onChange={e => set("directorate", e.target.value)} style={sel}>
                  <option value="">—</option>
                  {DIRECTORATES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                {lbl("Primary Funding")}
                <input value={form.primary_funding} onChange={e => set("primary_funding", e.target.value)} style={inp} placeholder="e.g. SMD, STMD" />
              </div>
              <div>
                {lbl("NAICS")}
                <input value={form.naics} onChange={e => set("naics", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("PSC")}
                <input value={form.psc} onChange={e => set("psc", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("SB Set-Aside")}
                <input value={form.small_business_set_aside} onChange={e => set("small_business_set_aside", e.target.value)} style={inp} placeholder="e.g. None, 8(a), SDVOSB" />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              {lbl("Description")}
              <textarea value={form.description} onChange={e => set("description", e.target.value)} style={ta} />
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
              {[
                ["over_10m", "Over $10M (Admin Data Call)"],
                ["is_nra", "NRA"],
                ["is_commercial", "Commercial Item"],
              ].map(([k, label]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            {sect("Period of Performance")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                {lbl("POP Start")}
                <input type="date" value={form.pop_start || ""} onChange={e => set("pop_start", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("POP End")}
                <input type="date" value={form.pop_end || ""} onChange={e => set("pop_end", e.target.value)} style={inp} />
              </div>
              <div>
                {lbl("Current Period")}
                <input value={form.current_period} onChange={e => set("current_period", e.target.value)} style={inp} placeholder="e.g. Option Period 1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FINANCIAL TAB */}
      {tab === "financial" && (
        <div style={card}>
          {sect("Financial Summary")}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              {lbl("Current Value")}
              <input type="number" value={form.current_value} onChange={e => set("current_value", e.target.value)} style={inp} placeholder="0" />
            </div>
            <div>
              {lbl("Potential Value (Base + Options)")}
              <input type="number" value={form.potential_value} onChange={e => set("potential_value", e.target.value)} style={inp} placeholder="0" />
            </div>
            <div>
              {lbl("Current Funding / Obligated")}
              <input type="number" value={form.current_funding} onChange={e => set("current_funding", e.target.value)} style={inp} placeholder="0" />
            </div>
            <div>
              {lbl("Fund-Thru Date")}
              <input type="date" value={form.fund_thru_date || ""} onChange={e => set("fund_thru_date", e.target.value)} style={inp} />
            </div>
          </div>

          {/* Funding health indicator */}
          {form.current_value && form.current_funding && (
            <div style={{ marginTop: 16, background: C.bg3, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Funding Utilization</div>
              <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, (parseFloat(form.current_funding) / parseFloat(form.current_value)) * 100).toFixed(0)}%`,
                  height: "100%", background: C.green, borderRadius: 4,
                }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                ${parseFloat(form.current_funding).toLocaleString()} of ${parseFloat(form.current_value).toLocaleString()} obligated
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODIFICATIONS TAB */}
      {tab === "mods" && (
        <div>
          {isNew && (
            <div style={{ ...card, background: "#fff8e6", border: "1px solid #f5c542" }}>
              <div style={{ color: "#7a4a00", fontSize: 12 }}>Save the contract record first before adding modifications.</div>
            </div>
          )}
          {!isNew && <ModsPanel mods={mods} onAdd={addMod} contractNumber={form.contract_number} />}
        </div>
      )}

      {/* REAs & CLAIMS TAB */}
      {tab === "reas" && (
        <div>
          {isNew && (
            <div style={{ ...card, background: "#fff8e6", border: "1px solid #f5c542" }}>
              <div style={{ color: "#7a4a00", fontSize: 12 }}>Save the contract record first before adding REAs or claims.</div>
            </div>
          )}
          {!isNew && <REAsPanel reas={reas} onAdd={addREA} contractNumber={form.contract_number} />}
        </div>
      )}

      {/* ADMINISTRATION TAB */}
      {tab === "admin" && (
        <div style={card}>
          {sect("Administration Notes")}
          <div>
            {lbl("Impact Statement")}
            <textarea value={form.impact_statement} onChange={e => set("impact_statement", e.target.value)}
              style={{ ...ta, minHeight: 80 }} placeholder="Justification to continue award, mission impact, termination consequences..." />
          </div>
          <div>
            {lbl("Pending Actions / Status Notes")}
            <textarea value={form.pending_actions} onChange={e => set("pending_actions", e.target.value)}
              style={{ ...ta, minHeight: 60 }} placeholder="e.g. Awaiting CO signature on Mod P00011..." />
          </div>
          <div>
            {lbl("Award File Link (NEAR / SharePoint)")}
            <input value={form.award_file_link} onChange={e => set("award_file_link", e.target.value)}
              style={inp} placeholder="https://near.hq.nasa.gov/..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            <div>
              {lbl("Closeout Submitted?")}
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", paddingTop: 8 }}>
                <input type="checkbox" checked={!!form.closeout_submitted} onChange={e => set("closeout_submitted", e.target.checked)} />
                Yes — closeout package submitted
              </label>
            </div>
            <div>
              {lbl("Closeout Date")}
              <input type="date" value={form.closeout_date || ""} onChange={e => set("closeout_date", e.target.value)} style={inp} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mods Panel ─────────────────────────────────────────────────────
function ModsPanel({ mods, onAdd, contractNumber }) {
  const [showForm, setShowForm] = useState(false);
  const [newMod, setNewMod] = useState({ mod_number: "", mod_type: "", mod_status: "Planned",
    description: "", mod_value: "", target_date: "", completed_date: "", fpds_updated: false, notes: "" });
  const set = (k, v) => setNewMod(m => ({ ...m, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: "600", color: C.text, fontSize: 13 }}>Modification Log</div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: C.blue, color: "#fff", border: "none", padding: "6px 14px",
            borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
          + Add Mod
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, background: "#f0f5ff", border: "1px solid #b5d4f4" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>{lbl("Mod Number")}<input value={newMod.mod_number} onChange={e => set("mod_number", e.target.value)} style={inp} placeholder="P00001" /></div>
            <div>{lbl("Type")}<select value={newMod.mod_type} onChange={e => set("mod_type", e.target.value)} style={sel}>
              <option value="">—</option>{MOD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select></div>
            <div>{lbl("Status")}<select value={newMod.mod_status} onChange={e => set("mod_status", e.target.value)} style={sel}>
              {MOD_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select></div>
            <div>{lbl("Mod Value")}<input type="number" value={newMod.mod_value} onChange={e => set("mod_value", e.target.value)} style={inp} /></div>
            <div>{lbl("Target Date")}<input type="date" value={newMod.target_date} onChange={e => set("target_date", e.target.value)} style={inp} /></div>
            <div>{lbl("Completed Date")}<input type="date" value={newMod.completed_date} onChange={e => set("completed_date", e.target.value)} style={inp} /></div>
          </div>
          <div style={{ marginTop: 6 }}>{lbl("Description")}<textarea value={newMod.description} onChange={e => set("description", e.target.value)} style={ta} /></div>
          <div style={{ marginTop: 6 }}>{lbl("Notes")}<input value={newMod.notes} onChange={e => set("notes", e.target.value)} style={inp} /></div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, marginTop: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={newMod.fpds_updated} onChange={e => set("fpds_updated", e.target.checked)} />
            FPDS Updated
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { onAdd(newMod); setShowForm(false); setNewMod({ mod_number:"",mod_type:"",mod_status:"Planned",description:"",mod_value:"",target_date:"",completed_date:"",fpds_updated:false,notes:"" }); }}
              style={{ background: C.blue, color: "#fff", border: "none", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
              Save Mod
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mods.length === 0 ? (
        <div style={{ color: C.muted, padding: "20px 0", fontSize: 12 }}>No modifications recorded yet.</div>
      ) : (
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                {["Mod #", "Type", "Status", "Value", "Target", "FPDS", "Description"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 10,
                    color: C.muted, fontWeight: "600", letterSpacing: "0.5px",
                    textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mods.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg2 : C.bg3 }}>
                  <td style={{ padding: "7px 10px", fontWeight: "500", color: C.blue }}>{m.mod_number}</td>
                  <td style={{ padding: "7px 10px", color: C.text }}>{m.mod_type}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ background: m.mod_status === "Complete" ? "#e1f5ee" : "#fff8e6",
                      color: m.mod_status === "Complete" ? C.green : C.yellow,
                      padding: "2px 8px", borderRadius: 20, fontSize: 10 }}>
                      {m.mod_status}
                    </span>
                  </td>
                  <td style={{ padding: "7px 10px", color: C.text }}>
                    {m.mod_value ? `$${parseFloat(m.mod_value).toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "7px 10px", color: C.muted }}>
                    {m.target_date ? new Date(m.target_date).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ color: m.fpds_updated ? C.green : C.red, fontSize: 11 }}>
                      {m.fpds_updated ? "✓" : "✗"}
                    </span>
                  </td>
                  <td style={{ padding: "7px 10px", color: C.muted, maxWidth: 200 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.description || m.notes || "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── REAs & Claims Panel ────────────────────────────────────────────
function REAsPanel({ reas, onAdd, contractNumber }) {
  const [showForm, setShowForm] = useState(false);
  const [newREA, setNewREA] = useState({ mod_number: "", claim_type: "REA", date_received: "",
    description: "", pricing_support: false, requested_amount: "",
    questioned_amount: "", disposition_status: "Pending", disposition_date: "", disposition_amount: "" });
  const set = (k, v) => setNewREA(r => ({ ...r, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: "600", color: C.text, fontSize: 13 }}>REAs & Claims</div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: C.blue, color: "#fff", border: "none", padding: "6px 14px",
            borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
          + Add REA / Claim
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, background: "#fff0f0", border: "1px solid #f5a0a0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>{lbl("Type")}<select value={newREA.claim_type} onChange={e => set("claim_type", e.target.value)} style={sel}>
              <option>REA</option><option>Claim</option>
            </select></div>
            <div>{lbl("Mod Number")}<input value={newREA.mod_number} onChange={e => set("mod_number", e.target.value)} style={inp} /></div>
            <div>{lbl("Date Received")}<input type="date" value={newREA.date_received} onChange={e => set("date_received", e.target.value)} style={inp} /></div>
            <div>{lbl("Requested Amount")}<input type="number" value={newREA.requested_amount} onChange={e => set("requested_amount", e.target.value)} style={inp} /></div>
            <div>{lbl("Questioned Amount")}<input type="number" value={newREA.questioned_amount} onChange={e => set("questioned_amount", e.target.value)} style={inp} /></div>
            <div>{lbl("Disposition")}<select value={newREA.disposition_status} onChange={e => set("disposition_status", e.target.value)} style={sel}>
              {["Pending","Under Review","Awarded","Denied","Settled"].map(s => <option key={s}>{s}</option>)}
            </select></div>
          </div>
          <div style={{ marginTop: 6 }}>{lbl("Description")}<textarea value={newREA.description} onChange={e => set("description", e.target.value)} style={ta} /></div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, marginTop: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={newREA.pricing_support} onChange={e => set("pricing_support", e.target.checked)} />
            Pricing Support Requested
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { onAdd(newREA); setShowForm(false); }}
              style={{ background: C.red, color: "#fff", border: "none", padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
              Save REA / Claim
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {reas.length === 0 ? (
        <div style={{ color: C.muted, padding: "20px 0", fontSize: 12 }}>No REAs or claims on record.</div>
      ) : (
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.bg3 }}>
                {["Type","Mod #","Date","Requested","Questioned","Disposition"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 10,
                    color: C.muted, fontWeight: "600", letterSpacing: "0.5px",
                    textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reas.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.bg2 : C.bg3 }}>
                  <td style={{ padding: "7px 10px", color: C.red, fontWeight: "500" }}>{r.claim_type}</td>
                  <td style={{ padding: "7px 10px", color: C.muted }}>{r.mod_number || "—"}</td>
                  <td style={{ padding: "7px 10px", color: C.muted }}>
                    {r.date_received ? new Date(r.date_received).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "7px 10px", color: C.text }}>
                    {r.requested_amount ? `$${parseFloat(r.requested_amount).toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "7px 10px", color: C.text }}>
                    {r.questioned_amount ? `$${parseFloat(r.questioned_amount).toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ fontSize: 11, color: r.disposition_status === "Awarded" ? C.green :
                      r.disposition_status === "Denied" ? C.red : C.yellow }}>
                      {r.disposition_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────
export default function ContractRecord({ intake, onClose }) {
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => setRefreshKey(k => k + 1);

  return (
    <div style={{ fontFamily: FONT, padding: "20px 24px", background: C.bg, minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: "600", color: C.text }}>Contract Records</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            Post-award lifecycle tracking — connected to Supabase
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.border}`,
              color: C.muted, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
              fontSize: 12, fontFamily: FONT }}>
            Close
          </button>
        )}
      </div>

      {(selected || creating) ? (
        <ContractForm
          key={selected?.id || "new"}
          record={creating ? null : selected}
          intake={intake}
          onSaved={handleSaved}
          onBack={() => { setSelected(null); setCreating(false); }}
        />
      ) : (
        <ContractList
          key={refreshKey}
          onSelect={r => { setSelected(r); setCreating(false); }}
          onNew={() => { setSelected(null); setCreating(true); }}
        />
      )}
    </div>
  );
}
