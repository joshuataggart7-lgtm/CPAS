// CPAS My Acquisitions — CO workspace showing all active acquisitions
// Replaces single-acquisition localStorage model with Supabase-backed multi-acquisition

import React, { useState, useEffect } from "react";

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
  background: "#fff", border: `1px solid ${C.border}`, color: C.text,
  padding: "9px 12px", borderRadius: 8, fontSize: 13,
  width: "100%", boxSizing: "border-box", fontFamily: FONT, outline: "none",
};

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Prefer": opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const STATUS_COLORS = {
  "Draft":       { bg: "#eef1f6", text: "#6b7a99", border: "#dde3ef" },
  "In Progress": { bg: "#e6f1fb", text: "#185fa5", border: "#b5d4f4" },
  "Awarded":     { bg: "#e1f5ee", text: "#0f6e56", border: "#9fe1cb" },
  "On Hold":     { bg: "#fff8e6", text: "#854f0b", border: "#f5c542" },
  "Cancelled":   { bg: "#fff0f0", text: "#a32d2d", border: "#f5a0a0" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["Draft"];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: "500", fontFamily: FONT }}>
      {status}
    </span>
  );
}

function ProgressBar({ completed, total }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const color = pct === 100 ? C.green : pct > 50 ? "#185fa5" : C.blue;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: C.bg3, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color,
          borderRadius: 3, transition: "width 0.3s ease" }} />
      </div>
      <span style={{ fontSize: 10, color: C.muted, minWidth: 30 }}>{pct}%</span>
    </div>
  );
}

export default function MyAcquisitions({ onOpen, onNew }) {
  const [email, setEmail] = useState(() => localStorage.getItem("cpas_co_email") || "");
  const [emailInput, setEmailInput] = useState("");
  const [acquisitions, setAcquisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("Active");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (email) load(email);
  }, [email]);

  async function load(em) {
    setLoading(true);
    setError("");
    try {
      const rows = await sbFetch(
        `cpas_acquisitions?co_email=eq.${encodeURIComponent(em.toLowerCase())}&order=updated_at.desc`
      );
      setAcquisitions(Array.isArray(rows) ? rows : []);
    } catch(e) {
      setError("Could not load acquisitions. Check your connection.");
    }
    setLoading(false);
  }

  async function deleteAcq(id) {
    if (!window.confirm("Delete this acquisition? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await sbFetch(`cpas_acquisitions?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
      setAcquisitions(a => a.filter(r => r.id !== id));
    } catch(e) {
      alert("Delete failed: " + e.message);
    }
    setDeleting(null);
  }

  function login() {
    const em = emailInput.trim().toLowerCase();
    if (!em.includes("@")) return;
    localStorage.setItem("cpas_co_email", em);
    setEmail(em);
  }

  const filtered = acquisitions.filter(a => {
    if (filter === "Active" && (a.status === "Awarded" || a.status === "Cancelled")) return false;
    if (filter === "Awarded" && a.status !== "Awarded") return false;
    if (filter === "All") {}
    if (search) {
      const q = search.toLowerCase();
      return (a.title || "").toLowerCase().includes(q) ||
             (a.contract_type || "").toLowerCase().includes(q) ||
             (a.naics || "").includes(q);
    }
    return true;
  });

  const stats = {
    total: acquisitions.length,
    active: acquisitions.filter(a => a.status === "In Progress").length,
    draft: acquisitions.filter(a => a.status === "Draft").length,
    awarded: acquisitions.filter(a => a.status === "Awarded").length,
  };

  // Email login screen
  if (!email) {
    return (
      <div style={{ fontFamily: FONT, display: "flex", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", padding: 24 }}>
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "40px 48px", maxWidth: 420, width: "100%",
          boxShadow: "0 4px 24px rgba(26,58,110,0.08)" }}>
          <div style={{ fontSize: 22, fontWeight: "600", color: C.text, marginBottom: 6 }}>
            My Acquisitions
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
            Enter your NASA email to see your acquisition workspace.
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: "500",
            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            NASA Email
          </div>
          <input
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="firstname.lastname@nasa.gov"
            style={{ ...inp, marginBottom: 12 }}
            autoFocus
          />
          <button onClick={login} disabled={!emailInput.includes("@")}
            style={{ width: "100%", background: C.blue, border: "none", color: "#fff",
              padding: "11px", borderRadius: 8, cursor: "pointer", fontSize: 13,
              fontWeight: "500", fontFamily: FONT,
              opacity: !emailInput.includes("@") ? 0.5 : 1 }}>
            View My Acquisitions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, padding: "24px", maxWidth: 1080, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "600", color: C.text }}>My Acquisitions</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{email}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setEmail(""); setEmailInput(""); localStorage.removeItem("cpas_co_email"); }}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted,
              padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
            Switch User
          </button>
          <button onClick={onNew}
            style={{ background: C.blue, border: "none", color: "#fff",
              padding: "8px 20px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: "500", fontFamily: FONT }}>
            + New Acquisition
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total", val: stats.total, color: C.blue },
          { label: "In Progress", val: stats.active, color: "#185fa5" },
          { label: "Draft", val: stats.draft, color: C.muted },
          { label: "Awarded", val: stats.awarded, color: C.green },
        ].map((s, i) => (
          <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "10px 20px", minWidth: 100,
            boxShadow: "0 1px 3px rgba(26,58,110,0.05)" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase",
              letterSpacing: "0.8px", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: "600", color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters and search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search acquisitions..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, width: 260, flex: "none" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["Active", "All", "Awarded"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11,
                cursor: "pointer", fontFamily: FONT,
                border: `1px solid ${filter === f ? C.blue : C.border}`,
                background: filter === f ? C.blue : C.bg2,
                color: filter === f ? "#fff" : C.muted,
                fontWeight: filter === f ? "500" : "400" }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => load(email)}
          style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted,
            padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            fontSize: 11, fontFamily: FONT, marginLeft: "auto" }}>
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #f5a0a0", borderRadius: 8,
          padding: "10px 14px", marginBottom: 16, color: C.red, fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 13 }}>
          Loading acquisitions...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, border: `1px dashed ${C.border}`,
          borderRadius: 12, color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
            {acquisitions.length === 0 ? "No acquisitions yet" : "No acquisitions match your filters"}
          </div>
          <div style={{ fontSize: 12 }}>
            {acquisitions.length === 0
              ? "Click + New Acquisition to start your first one."
              : "Try changing your filter or search."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(acq => {
            const steps = acq.completed_steps || [];
            const completedCount = Array.isArray(steps) ? steps.length : 0;
            // Estimate total steps from roadmap structure (~30 typical)
            const totalSteps = 30;
            const updatedDate = acq.updated_at
              ? new Date(acq.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—";
            const value = acq.value
              ? `$${parseFloat(acq.value).toLocaleString()}`
              : "—";

            return (
              <div key={acq.id}
                style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12,
                  padding: "16px 20px", boxShadow: "0 1px 4px rgba(26,58,110,0.05)",
                  cursor: "pointer", transition: "box-shadow 0.15s ease" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 3px 12px rgba(26,58,110,0.10)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(26,58,110,0.05)"}
              >
                <div style={{ display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <StatusBadge status={acq.status} />
                      {acq.contract_type && (
                        <span style={{ fontSize: 11, color: C.muted,
                          background: C.bg3, padding: "2px 8px", borderRadius: 20 }}>
                          {acq.contract_type}
                        </span>
                      )}
                      {acq.naics && (
                        <span style={{ fontSize: 11, color: C.muted }}>
                          NAICS {acq.naics}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 4 }}>
                      {acq.title || "Untitled Acquisition"}
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.muted }}>
                      <span>Value: {value}</span>
                      <span>Updated: {updatedDate}</span>
                      {acq.center && <span>{acq.center}</span>}
                    </div>
                  </div>

                  {/* Progress and actions */}
                  <div style={{ display: "flex", flexDirection: "column",
                    alignItems: "flex-end", gap: 10, minWidth: 180 }}>
                    <div style={{ width: "100%" }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>
                        {completedCount} steps completed
                      </div>
                      <ProgressBar completed={completedCount} total={totalSteps} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={e => { e.stopPropagation(); onOpen(acq); }}
                        style={{ background: C.blue, border: "none", color: "#fff",
                          padding: "7px 16px", borderRadius: 7, cursor: "pointer",
                          fontSize: 12, fontWeight: "500", fontFamily: FONT }}>
                        Open →
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteAcq(acq.id); }}
                        disabled={deleting === acq.id}
                        style={{ background: "none", border: `1px solid ${C.border}`,
                          color: C.muted, padding: "7px 10px", borderRadius: 7,
                          cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                        {deleting === acq.id ? "..." : "✕"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
