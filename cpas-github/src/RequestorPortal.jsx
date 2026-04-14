// CPAS Requestor Portal
// Simplified acquisition package builder for technical requestors, CORs, and program offices
// No FAR knowledge required — plain-English guided workflow
// Output: SOW draft, IGCE, pre-market research, NF-1707 upload slot, PR number
// Submits to Branch Chief queue for CO assignment

import React, { useState, useMemo } from "react";

const C = {
  bg: "#040d1a", bg2: "#061020", bg3: "#08182e",
  border: "#1a3a6e", blue: "#4a9eff", text: "#c8d8f0",
  muted: "#4a7aaa", dim: "#7a9ab8", green: "#3aaa66",
  yellow: "#f4c542", red: "#e87c3e", purple: "#c07aff",
  teal: "#4ac8aa",
};

const inp = {
  background: "#08182e", border: "1px solid #1a3a6e", color: "#c8d8f0",
  padding: "9px 12px", borderRadius: 4, fontSize: 12,
  width: "100%", boxSizing: "border-box",
  fontFamily: "system-ui, -apple-system, sans-serif",
};
const ta = { ...inp, resize: "vertical", lineHeight: 1.6 };

// ── Step progress bar ─────────────────────────────────────────────
function StepBar({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: i < steps.length - 1 ? 0 : 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < current ? C.green : i === current ? C.blue : C.bg3,
              border: `2px solid ${i < current ? C.green : i === current ? C.blue : C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: "bold",
              color: i <= current ? "#fff" : C.dim,
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 9, color: i === current ? C.blue : i < current ? C.green : C.dim, marginTop: 4, textAlign: "center", maxWidth: 72, lineHeight: 1.2 }}>
              {s}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? C.green : C.border, marginBottom: 20, marginLeft: 2, marginRight: 2 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────
function QCard({ q, sub, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", color: C.text, marginBottom: sub ? 4 : 8 }}>{q}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>{sub}</div>}
      {children}
    </div>
  );
}

function Lbl({ t, req }) {
  return <div style={{ fontSize: 10, color: req ? C.yellow : C.muted, marginBottom: 4, marginTop: 10 }}>{t}{req ? " *" : ""}</div>;
}

// ── Main Requestor Portal ─────────────────────────────────────────
export default function RequestorPortal({ onSubmit, onBack }) {
  const STEPS = ["Your Info", "Requirement", "SOW Builder", "IGCE", "Market Research", "Documents", "Review & Submit"];
  const DRAFT_KEY = "cpas_portal_draft";
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pkg, setPkg] = useState(() => {
    // Restore draft if available
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft);
    } catch(e) {}
    return {
    // Step 0 — Requester info
    reqName:      "",
    reqTitle:     "",
    reqEmail:     "",
    reqPhone:     "",
    reqCenter:    "",
    reqOrg:       "",
    branchChief:  "",
    branchChiefEmail: "",
    isCOR:        false,
    corTraining:  "",

    // Step 1 — Requirement basics
    reqtitle:     "",
    reqType:      "SERVICES",
    valueEstimate:"",
    valueConfidence:"ROUGH",
    urgency:      "NORMAL",
    urgencyJust:  "",
    popStart:     "",
    popMonths:    "12",
    hasOptions:   true,
    optionYears:  "4",
    placeOfPerf:  "",
    isRemote:     false,
    priorContract:"",
    priorContractNum:"",
    programCode:  "",
    fundCite:     "",
    prNumber:     "",
    missionImpact:"",

    // Step 2 — SOW builder
    sowBackground:"",
    sowObjective: "",
    tasks:        [
      { id: 1, title: "Program Management", desc: "", deliverable: "Monthly status report", frequency: "Monthly" },
    ],
    keyDeliverables: "",
    performanceStds: "",
    specialReqs:  "",
    placeOfWork:  "Primarily on-site at NASA facility",
    dataRights:   "Government gets unlimited rights to all data",
    securityLevel:"Public Trust",
    governmentFurnished: "",

    // Step 3 — IGCE
    igceMethod:   "RATES",
    igceMode:     "LABOR",
    laborCats:    [
      { id: 1, title: "Program Manager", level: "Senior", hours: "", rate: "", basis: "GSA/market rate" },
      { id: 2, title: "Technical Lead",  level: "Senior", hours: "", rate: "", basis: "GSA/market rate" },
      { id: 3, title: "Engineer/Analyst",level: "Mid",    hours: "", rate: "", basis: "GSA/market rate" },
    ],
    catalogClins: [
      { id: 1,  title: "Aircraft Hourly — King Air B200 (CONUS)",    unit: "Hour",   rate: "855.93",  qty: "", basis: "CLIN 0001 catalog rate Jan 2026" },
      { id: 2,  title: "Aircraft Daily — King Air B200 (CONUS)",     unit: "Day",    rate: "822.97",  qty: "", basis: "CLIN 0001 catalog rate Jan 2026" },
      { id: 3,  title: "Aircraft Hourly — King Air A-90 (CONUS)",    unit: "Hour",   rate: "501.61",  qty: "", basis: "CLIN 0001 catalog rate Jan 2026" },
      { id: 4,  title: "Aircraft Daily — King Air A-90 (CONUS)",     unit: "Day",    rate: "421.27",  qty: "", basis: "CLIN 0001 catalog rate Jan 2026" },
      { id: 5,  title: "Crew Hourly — B200/A-90 (CONUS)",            unit: "Hour",   rate: "94.76",   qty: "", basis: "CLIN 0001 catalog rate Jan 2026" },
      { id: 6,  title: "Crew Hourly — B200/A-90 (OCONUS)",           unit: "Hour",   rate: "142.14",  qty: "", basis: "CLIN 0001 catalog rate Jan 2026" },
      { id: 7,  title: "FTR/Mechanic Hourly — B200/A-90 (CONUS)",    unit: "Hour",   rate: "107.12",  qty: "", basis: "CLIN 0001 catalog rate Jan 2026" },
      { id: 8,  title: "Fuel — B200/A-90",                           unit: "Gallon", rate: "",        qty: "", basis: "TBD per task order" },
      { id: 9,  title: "Per Diem / Travel",                          unit: "Job",    rate: "",        qty: "", basis: "TBD per task order" },
      { id: 10, title: "Shop Fees",                                   unit: "Job",    rate: "",        qty: "", basis: "TBD per task order" },
    ],
    odcTravel:    "",
    odcMaterials: "",
    odcOther:     "",
    igceNotes:    "",

    // Step 4 — Market Research
    mrBackground:     "",
    knownVendors:     "",
    priorContracts:   "",
    existingVehicles: "",
    commercialAvail:  "UNKNOWN",
    smallBizPotential:"UNKNOWN",
    priceDataSources: "",
    mrNotes:          "",

    // Step 5 — Documents
    nf1707Uploaded: false,
    nf1707Notes:    "",
    sowAttachment:  null,
    additionalDocs: "",
  };
  });

  // Auto-save draft on every change
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(pkg)); } catch(e) {}
  }, [pkg]);

  const set = (k, v) => setPkg(p => ({ ...p, [k]: v }));

  // ── Computed totals ─────────────────────────────────────────────
  const igceTotal = useMemo(() => {
    const odc = (parseFloat(pkg.odcTravel) || 0) + (parseFloat(pkg.odcMaterials) || 0) + (parseFloat(pkg.odcOther) || 0);
    if (pkg.igceMode === "CATALOG") {
      const catalog = (pkg.catalogClins || []).reduce((s, cl) =>
        s + (parseFloat(cl.qty) || 0) * (parseFloat(cl.rate) || 0), 0);
      return catalog + odc;
    }
    const labor = pkg.laborCats.reduce((s, lc) => s + (parseFloat(lc.hours) || 0) * (parseFloat(lc.rate) || 0), 0);
    return labor + odc;
  }, [pkg.laborCats, pkg.catalogClins, pkg.igceMode, pkg.odcTravel, pkg.odcMaterials, pkg.odcOther]);

  // ── Generated SOW text ──────────────────────────────────────────
  const sowText = useMemo(() => buildSOW(pkg), [pkg]);

  function updateTask(id, field, val) {
    setPkg(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, [field]: val } : t) }));
  }
  function addTask() {
    setPkg(p => ({ ...p, tasks: [...p.tasks, { id: Date.now(), title: "", desc: "", deliverable: "", frequency: "As needed" }] }));
  }
  function removeTask(id) {
    setPkg(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));
  }
  function updateLC(id, field, val) {
    setPkg(p => ({ ...p, laborCats: p.laborCats.map(lc => lc.id === id ? { ...lc, [field]: val } : lc) }));
  }
  function addLC() {
    setPkg(p => ({ ...p, laborCats: [...p.laborCats, { id: Date.now(), title: "", level: "Mid", hours: "", rate: "", basis: "" }] }));
  }
  function updateCatalogClin(id, field, val) {
    setPkg(p => ({ ...p, catalogClins: (p.catalogClins || []).map(cl => cl.id === id ? { ...cl, [field]: val } : cl) }));
  }
  function addCatalogClin() {
    setPkg(p => ({ ...p, catalogClins: [...(p.catalogClins || []), { id: Date.now(), title: "", unit: "", rate: "", qty: "", basis: "" }] }));
  }

  function handleSubmit() {
    setSubmitting(true);
    const payload = { ...pkg, sowText, igceTotal, submittedAt: new Date().toISOString() };
    // Submit to backend (real cross-device handoff)
    fetch("/.netlify/functions/package-workflow/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        // Also save to localStorage for same-browser fallback
        try {
          const existing = JSON.parse(localStorage.getItem("cpas_pending_packages") || "[]");
          const newPkg = { id: data.id || ("PKG-" + Date.now()), submittedAt: new Date().toISOString(), status: "PENDING", ...payload };
          localStorage.setItem("cpas_pending_packages", JSON.stringify([...existing, newPkg]));
        } catch(e) {}
      }
    })
    .catch(() => {
      // Backend unavailable — fall back to localStorage only
      try {
        const existing = JSON.parse(localStorage.getItem("cpas_pending_packages") || "[]");
        const newPkg = { id: "PKG-" + Date.now(), submittedAt: new Date().toISOString(), status: "PENDING", ...payload };
        localStorage.setItem("cpas_pending_packages", JSON.stringify([...existing, newPkg]));
      } catch(e) {}
    })
    .finally(() => {
      localStorage.removeItem(DRAFT_KEY); // clear draft on successful submit
      setSubmitting(false);
      setSubmitted(true);
      onSubmit && onSubmit(payload);
    });
  }

  // ── Navigation ──────────────────────────────────────────────────
  const canAdvance = [
    pkg.reqName && pkg.reqEmail && pkg.reqCenter,
    pkg.reqtitle && pkg.valueEstimate && pkg.popMonths,
    pkg.sowObjective && pkg.tasks.some(t => t.title),
    true,
    true,
    true,
    true,
  ][step];

  if (submitted) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: C.green, marginBottom: 8 }}>Package Submitted</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
            Your acquisition package for <strong style={{ color: C.text }}>{pkg.reqtitle}</strong> has been submitted to <strong style={{ color: C.text }}>{pkg.branchChief || "your Branch Chief"}</strong> for CO assignment.
          </div>
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>PACKAGE SUMMARY</div>
            <div style={{ fontSize: 12, color: C.text }}>Requirement: {pkg.reqtitle}</div>
            <div style={{ fontSize: 12, color: C.text }}>Est. Value: ${parseFloat(pkg.valueEstimate || 0).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: C.text }}>PoP: {pkg.popMonths} months{pkg.hasOptions ? ` + ${pkg.optionYears} option years` : ""}</div>
            <div style={{ fontSize: 12, color: C.text }}>SOW: {pkg.sowObjective ? "✓ Drafted" : "—"}</div>
            <div style={{ fontSize: 12, color: C.text }}>IGCE: {igceTotal > 0 ? `✓ $${igceTotal.toLocaleString("en-US",{minimumFractionDigits:0})} estimated` : "—"}</div>
            <div style={{ fontSize: 12, color: C.text }}>Market Research: ✓ Pre-assessment complete</div>
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            The assigned Contracting Officer will contact you when work begins. 
            Questions? Contact your Branch Chief or email {pkg.branchChiefEmail || "your procurement office"}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#0a1a3a", borderBottom: `1px solid ${C.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 2 }}>NATIONAL AERONAUTICS AND SPACE ADMINISTRATION</div>
          <div style={{ fontSize: 15, fontWeight: "bold", color: C.blue }}>CPAS — Acquisition Request Portal</div>
          <div style={{ fontSize: 10, color: C.dim }}>For technical requestors, CORs, and program offices</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {(() => {
            try { if (localStorage.getItem(DRAFT_KEY)) return (
              <button onClick={()=>{ if(window.confirm("Clear your saved draft and start over?")){ localStorage.removeItem(DRAFT_KEY); window.location.reload(); }}}
                style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted, padding:"5px 12px", borderRadius:4, cursor:"pointer", fontSize:10 }}>
                🗑 Clear Draft
              </button>
            ); } catch(e) {} return null;
          })()}
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "5px 12px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
              ← CO View
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 24px" }}>
        <StepBar steps={STEPS} current={step} />

        {/* ── STEP 0: Your Info ──────────────────────────────── */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Tell us about yourself</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              This information helps route your package to the right Contracting Officer and ensures you get contacted when work begins.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Lbl t="Your Full Name" req />
                <input style={inp} value={pkg.reqName} onChange={e => set("reqName", e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <Lbl t="Your Job Title" />
                <input style={inp} value={pkg.reqTitle} onChange={e => set("reqTitle", e.target.value)} placeholder="Program Manager / COR / Engineer" />
              </div>
              <div>
                <Lbl t="NASA Email" req />
                <input style={inp} value={pkg.reqEmail} onChange={e => set("reqEmail", e.target.value)} placeholder="jane.smith@nasa.gov" />
              </div>
              <div>
                <Lbl t="Phone" />
                <input style={inp} value={pkg.reqPhone} onChange={e => set("reqPhone", e.target.value)} placeholder="(650) 604-XXXX" />
              </div>
              <div>
                <Lbl t="NASA Center" req />
                <select style={inp} value={pkg.reqCenter} onChange={e => set("reqCenter", e.target.value)}>
                  <option value="">Select your center...</option>
                  {["Ames (ARC)","Armstrong (AFRC)","Glenn (GRC)","Goddard (GSFC)","Johnson (JSC)","Kennedy (KSC)","Langley (LaRC)","Marshall (MSFC)","Stennis (SSC)","JPL","HQ"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Lbl t="Organization / Division" />
                <input style={inp} value={pkg.reqOrg} onChange={e => set("reqOrg", e.target.value)} placeholder="e.g., Flight Operations Division" />
              </div>
              <div>
                <Lbl t="Branch Chief Name" />
                <input style={inp} value={pkg.branchChief} onChange={e => set("branchChief", e.target.value)} placeholder="Branch Chief who will receive this package" />
              </div>
              <div>
                <Lbl t="Branch Chief Email" />
                <input style={inp} value={pkg.branchChiefEmail} onChange={e => set("branchChiefEmail", e.target.value)} placeholder="branchief@nasa.gov" />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <div onClick={() => set("isCOR", !pkg.isCOR)}
                style={{ width: 16, height: 16, border: `2px solid ${pkg.isCOR ? C.green : C.border}`, borderRadius: 3,
                         background: pkg.isCOR ? C.green : "transparent", cursor: "pointer", flexShrink: 0,
                         display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>
                {pkg.isCOR ? "✓" : ""}
              </div>
              <span style={{ fontSize: 12, color: C.dim }}>I am the designated or prospective COR for this contract</span>
            </div>
            {pkg.isCOR && (
              <div style={{ marginTop: 10 }}>
                <Lbl t="COR Training Level (FAC-COR Level I, II, or III)" />
                <input style={inp} value={pkg.corTraining} onChange={e => set("corTraining", e.target.value)} placeholder="e.g., FAC-COR Level II, expires 12/2027" />
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Requirement ────────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Tell us about the requirement</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Don't worry about FAR terminology — just describe what you need. Your Contracting Officer will handle the regulatory details.
            </div>

            <QCard q="What do you need the contractor to do?" sub="Give it a short descriptive name (e.g., 'Flight Software Support Services', 'High-Altitude Balloon Operations')">
              <input style={inp} value={pkg.reqtitle} onChange={e => set("reqtitle", e.target.value)} placeholder="Requirement title..." />
            </QCard>

            <QCard q="What kind of work is this?" sub="Select the closest match — this helps us classify the acquisition correctly">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[["SERVICES","Professional Services","Engineering, IT support, operations, analysis"],
                  ["SUPPLIES","Products / Hardware","Equipment, parts, materials, software licenses"],
                  ["IT","IT / Software","Custom software, cloud services, cybersecurity"],
                  ["RD","Research & Development","Studies, experiments, technology development"],
                  ["CONSTRUCTION","Construction","Facility work, renovation, installation"],
                  ["AE","A&E Services","Architecture, engineering design services"]].map(([val, label, sub]) => (
                  <div key={val} onClick={() => set("reqType", val)}
                    style={{ background: pkg.reqType === val ? "#0a2a4a" : C.bg3,
                             border: `2px solid ${pkg.reqType === val ? C.blue : C.border}`,
                             borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>
                    <div style={{ fontSize: 11, fontWeight: "bold", color: pkg.reqType === val ? C.blue : C.text }}>{label}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </QCard>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <QCard q="Estimated cost?" sub="Your best guess is fine — this helps us assign the right CO and plan the acquisition strategy">
                <input style={inp} value={pkg.valueEstimate} onChange={e => set("valueEstimate", e.target.value)} placeholder="e.g., 500000" type="number" />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {[["ROUGH","Rough estimate"],["MODERATE","Reasonably sure"],["CONFIDENT","Have IGCE"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => set("valueConfidence", val)}
                      style={{ flex: 1, padding: "5px 4px", borderRadius: 3, cursor: "pointer", fontSize: 9,
                               background: pkg.valueConfidence === val ? "#0a2a4a" : C.bg3,
                               border: `1px solid ${pkg.valueConfidence === val ? C.blue : C.border}`,
                               color: pkg.valueConfidence === val ? C.blue : C.dim }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </QCard>

              <QCard q="How long do you need the contractor?" sub="Base period — we'll add options later if needed">
                <select style={inp} value={pkg.popMonths} onChange={e => set("popMonths", e.target.value)}>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">1 year</option>
                  <option value="18">18 months</option>
                  <option value="24">2 years</option>
                  <option value="36">3 years</option>
                  <option value="48">4 years</option>
                  <option value="60">5 years</option>
                  <option value="60">5 year base, no options</option>
                  <option value="120">10-year IDIQ ordering period</option>
                  <option value="0">Other / TBD</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div onClick={() => set("hasOptions", !pkg.hasOptions)}
                    style={{ width: 14, height: 14, border: `2px solid ${pkg.hasOptions ? C.green : C.border}`, borderRadius: 3,
                             background: pkg.hasOptions ? C.green : "transparent", cursor: "pointer", flexShrink: 0,
                             display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
                    {pkg.hasOptions ? "✓" : ""}
                  </div>
                  <span style={{ fontSize: 11, color: C.dim }}>Include option years</span>
                  {pkg.hasOptions && (
                    <select style={{ ...inp, width: 80 }} value={pkg.optionYears} onChange={e => set("optionYears", e.target.value)}>
                      {["1","2","3","4","5"].map(n => <option key={n} value={n}>{n} option {n==="1"?"year":"years"}</option>)}
                    </select>
                  )}
                </div>
              </QCard>
            </div>

            <QCard q="Where will the work be performed?">
              <input style={inp} value={pkg.placeOfPerf} onChange={e => set("placeOfPerf", e.target.value)} placeholder="e.g., NASA Ames Research Center, Moffett Field, CA" />
            </QCard>

            <QCard q="Is this urgent?" sub="Does this have a hard deadline that could affect the normal acquisition timeline (typically 4-6 months)?">
              <div style={{ display: "flex", gap: 8 }}>
                {[["NORMAL","Normal — no deadline pressure"],["MODERATE","Moderate — needed within 6 months"],["URGENT","Urgent — needed ASAP"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => set("urgency", val)}
                    style={{ flex: 1, padding: "8px", borderRadius: 4, cursor: "pointer", fontSize: 11,
                             background: pkg.urgency === val ? (val === "URGENT" ? "#1a0404" : "#0a2a4a") : C.bg3,
                             border: `1px solid ${pkg.urgency === val ? (val === "URGENT" ? C.red : C.blue) : C.border}`,
                             color: pkg.urgency === val ? (val === "URGENT" ? C.red : C.blue) : C.dim }}>
                    {lbl}
                  </button>
                ))}
              </div>
              {pkg.urgency === "URGENT" && (
                <textarea style={{ ...ta, marginTop: 8 }} rows={2} value={pkg.urgencyJust}
                  onChange={e => set("urgencyJust", e.target.value)}
                  placeholder="Briefly describe why this is urgent and what happens if it's delayed..." />
              )}
            </QCard>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <QCard q="PR Number (if available)">
                <input style={inp} value={pkg.prNumber} onChange={e => set("prNumber", e.target.value)} placeholder="e.g., 4200924091" />
              </QCard>
              <QCard q="Fund Cite / Accounting Code (if available)">
                <input style={inp} value={pkg.fundCite} onChange={e => set("fundCite", e.target.value)} placeholder="Accounting string / ACRN" />
              </QCard>
            </div>

            <QCard q="Is there a prior contract for this same work?" sub="Helps us understand incumbency and transition requirements">
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {[["YES","Yes"],["NO","No"],["UNKNOWN","Not sure"]].map(([val, lbl]) => (
                  <button key={val} onClick={() => set("priorContract", val)}
                    style={{ flex: 1, padding: "7px", borderRadius: 4, cursor: "pointer", fontSize: 11,
                             background: pkg.priorContract === val ? "#0a2a4a" : C.bg3,
                             border: `1px solid ${pkg.priorContract === val ? C.blue : C.border}`,
                             color: pkg.priorContract === val ? C.blue : C.dim }}>
                    {lbl}
                  </button>
                ))}
              </div>
              {pkg.priorContract === "YES" && (
                <input style={inp} value={pkg.priorContractNum} onChange={e => set("priorContractNum", e.target.value)} placeholder="Prior contract number (if known)" />
              )}
            </QCard>

            <QCard q="How critical is this to NASA's mission?" sub="Helps prioritize workload — be specific">
              <textarea style={ta} rows={2} value={pkg.missionImpact} onChange={e => set("missionImpact", e.target.value)}
                placeholder="e.g., Required to support CASSC aircraft operations for FY2027 research mission. Delay would ground research fleet." />
            </QCard>
          </div>
        )}

        {/* ── STEP 2: SOW Builder ────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Build your Statement of Work</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Answer these questions in plain language — we'll draft the formal SOW/PWS for your Contracting Officer to review and finalize.
              You don't need to use legal or FAR terminology.
            </div>

            <QCard q="Background — What is the context for this requirement?" sub="Why does NASA need this? What program or mission does it support?">
              <textarea style={ta} rows={3} value={pkg.sowBackground} onChange={e => set("sowBackground", e.target.value)}
                placeholder="e.g., NASA Ames Research Center operates a fleet of research aircraft supporting atmospheric science missions. The current support services contract expires September 30, 2026." />
            </QCard>

            <QCard q="Objective — What does success look like?" sub="Describe the end result you want the contractor to achieve, not how they should do it" >
              <textarea style={ta} rows={3} value={pkg.sowObjective} onChange={e => set("sowObjective", e.target.value)}
                placeholder="e.g., Maintain aircraft in mission-ready status with ≥95% availability. Provide technical personnel qualified to FAA standards for all aircraft types in the fleet." />
            </QCard>

            <div style={{ fontSize: 13, fontWeight: "bold", color: C.text, marginBottom: 8, marginTop: 20 }}>Work Tasks</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>List the main categories of work. You can add as many as you need.</div>

            {pkg.tasks.map((task, i) => (
              <div key={task.id} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: C.blue, fontWeight: "bold" }}>Task {i + 1}</span>
                  {pkg.tasks.length > 1 && (
                    <button onClick={() => removeTask(task.id)} style={{ background: "none", border: "none", color: "#4a2a2a", cursor: "pointer", fontSize: 14 }}>×</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <Lbl t="Task Name" req />
                    <input style={inp} value={task.title} onChange={e => updateTask(task.id, "title", e.target.value)} placeholder="e.g., Aircraft Maintenance" />
                  </div>
                  <div>
                    <Lbl t="Deliverable" />
                    <input style={inp} value={task.deliverable} onChange={e => updateTask(task.id, "deliverable", e.target.value)} placeholder="e.g., Monthly maintenance report" />
                  </div>
                </div>
                <Lbl t="What does this task involve?" />
                <textarea style={{ ...ta, minHeight: 45 }} rows={2} value={task.desc} onChange={e => updateTask(task.id, "desc", e.target.value)}
                  placeholder="Describe what the contractor will do for this task..." />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                  <div>
                    <Lbl t="Frequency / Schedule" />
                    <input style={inp} value={task.frequency} onChange={e => updateTask(task.id, "frequency", e.target.value)} placeholder="e.g., Ongoing, Monthly, As requested" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addTask}
              style={{ width: "100%", background: C.bg3, border: `1px dashed ${C.border}`, color: C.muted,
                       padding: "8px", borderRadius: 4, cursor: "pointer", fontSize: 11, marginBottom: 20 }}>
              + Add Another Task
            </button>

            <QCard q="What are the most important performance standards?" sub="What should we measure the contractor on? E.g., response times, availability, quality metrics">
              <textarea style={ta} rows={2} value={pkg.performanceStds} onChange={e => set("performanceStds", e.target.value)}
                placeholder="e.g., Aircraft availability ≥95%; maintenance records updated within 24 hours; all personnel maintain required certifications" />
            </QCard>

            <QCard q="Will the Government provide anything to the contractor?" sub="Equipment, facilities, data, access badges, software, etc.">
              <textarea style={ta} rows={2} value={pkg.governmentFurnished} onChange={e => set("governmentFurnished", e.target.value)}
                placeholder="e.g., NASA will provide hangar access, aircraft maintenance stands, and GSE equipment. Contractor provides own tools and consumables." />
            </QCard>

            <QCard q="Any special requirements?" sub="Security clearances needed? Unique certifications? Environmental constraints? On-site requirements?">
              <textarea style={ta} rows={2} value={pkg.specialReqs} onChange={e => set("specialReqs", e.target.value)}
                placeholder="e.g., All personnel must obtain Public Trust background investigation. FAA certifications required for specific aircraft types." />
            </QCard>

            {/* SOW Preview */}
            <details style={{ marginTop: 16 }}>
              <summary style={{ fontSize: 11, color: C.blue, cursor: "pointer", userSelect: "none", padding: "8px 0" }}>
                📄 Preview generated SOW draft (click to expand)
              </summary>
              <pre style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: 14,
                            fontSize: 9.5, color: C.dim, marginTop: 8, overflow: "auto", maxHeight: 300,
                            whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {sowText}
              </pre>
            </details>
          </div>
        )}

        {/* ── STEP 3: IGCE ──────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Independent Government Cost Estimate</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.6 }}>
              Your IGCE helps the CO verify that your budget estimate is realistic and well-documented.
              Use your best estimates — your CO will review and may refine these.
            </div>
            <div style={{ background: "#0a2a1a", border: "1px solid #1a6a3a", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontSize: 11, color: "#4aba6a" }}>
              💡 <strong>Tip:</strong> GSA rates, prior contract prices, and vendor quotes are all valid bases for your estimates. For catalog-priced IDIQ contracts (aircraft rates, IT unit prices, etc.) your CO will build a full catalog rate IGCE — enter your best estimate here. Document where your rates come from.
            </div>

            {igceTotal > 0 && (
              <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 16px", marginBottom: 16, display: "flex", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.muted }}>BASE YEAR ESTIMATE</div>
                  <div style={{ fontSize: 18, color: C.green, fontWeight: "bold" }}>
                    ${igceTotal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </div>
                </div>
                {pkg.hasOptions && (
                  <div>
                    <div style={{ fontSize: 9, color: C.muted }}>TOTAL W/ {pkg.optionYears} OPTIONS (~3% esc.)</div>
                    <div style={{ fontSize: 18, color: C.yellow, fontWeight: "bold" }}>
                      ${Math.round(igceTotal * (1 + parseInt(pkg.optionYears || 0) * 0.03 + parseInt(pkg.optionYears || 0)) ).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: "bold", color: C.text, marginBottom: 8 }}>Labor Categories</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
              <div style={{display:"flex",gap:12,marginBottom:12,alignItems:"center"}}>
                <span style={{fontSize:11,color:"#8a9ab0"}}>IGCE Mode:</span>
                <button onClick={()=>set("igceMode","LABOR")}
                  style={{padding:"3px 10px",fontSize:10,borderRadius:3,cursor:"pointer",
                    background:pkg.igceMode!=="CATALOG"?"#2a4a7f":"none",
                    border:"1px solid #2a4a7f",color:pkg.igceMode!=="CATALOG"?"#fff":"#8a9ab0"}}>
                  Labor Hours
                </button>
                <button onClick={()=>set("igceMode","CATALOG")}
                  style={{padding:"3px 10px",fontSize:10,borderRadius:3,cursor:"pointer",
                    background:pkg.igceMode==="CATALOG"?"#2a4a7f":"none",
                    border:"1px solid #2a4a7f",color:pkg.igceMode==="CATALOG"?"#fff":"#8a9ab0"}}>
                  Catalog / Rate Card (IDIQ)
                </button>
              </div>

              {pkg.igceMode === "CATALOG" ? (
                <div>
                  <div style={{fontSize:11,color:"#8a9ab0",marginBottom:10}}>
                    Pre-loaded with current catalog rates (CLIN 0001, Jan 2026). Enter your estimated quantity per year for each line item you plan to use. Leave blank for items that don't apply.
                  </div>
                  {/* Catalog table header */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 70px 100px 70px 90px 28px",gap:6,padding:"6px 8px",background:"#04111f",borderRadius:"4px 4px 0 0",border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:9,color:C.muted}}>CLIN / DESCRIPTION</div>
                    <div style={{fontSize:9,color:C.muted}}>UNIT</div>
                    <div style={{fontSize:9,color:C.muted}}>RATE ($)</div>
                    <div style={{fontSize:9,color:C.muted}}>QTY/YR</div>
                    <div style={{fontSize:9,color:C.muted}}>TOTAL</div>
                    <div/>
                  </div>
                  {(pkg.catalogClins||[]).map((cl,i) => {
                    const total = (parseFloat(cl.qty)||0) * (parseFloat(cl.rate)||0);
                    return (
                      <div key={cl.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 100px 70px 90px 28px",gap:6,padding:"5px 8px",background:i%2===0?C.bg3:C.bg2,border:`1px solid ${C.border}`,borderTop:"none"}}>
                        <input value={cl.title} onChange={e=>updateCatalogClin(cl.id,"title",e.target.value)} style={inp} placeholder="CLIN description" />
                        <input value={cl.unit}  onChange={e=>updateCatalogClin(cl.id,"unit",e.target.value)}  style={inp} placeholder="Hour" />
                        <input value={cl.rate}  onChange={e=>updateCatalogClin(cl.id,"rate",e.target.value)}  style={inp} placeholder="0.00" type="number" />
                        <input value={cl.qty}   onChange={e=>updateCatalogClin(cl.id,"qty",e.target.value)}   style={inp} placeholder="qty" type="number" />
                        <div style={{fontSize:11,color:total>0?C.green:C.dim,display:"flex",alignItems:"center"}}>
                          {total>0 ? "$"+total.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}) : "—"}
                        </div>
                        <button onClick={()=>setPkg(p=>({...p,catalogClins:p.catalogClins.filter(c=>c.id!==cl.id)}))}
                          style={{background:"none",border:"none",color:"#4a2a2a",cursor:"pointer",fontSize:16}}>×</button>
                      </div>
                    );
                  })}
                  <button onClick={addCatalogClin}
                    style={{width:"100%",background:C.bg3,border:`1px dashed ${C.border}`,color:C.muted,padding:"7px",borderRadius:"0 0 4px 4px",cursor:"pointer",fontSize:11,marginBottom:16}}>
                    + Add Catalog Line Item
                  </button>
                  <div style={{fontSize:10,color:C.muted,marginBottom:8}}>
                    Basis note: <span style={{color:C.dim}}>Rates from contract CLIN 0001 catalog (Jan 31 2026 – Jan 30 2027). CONUS rates shown. OCONUS rates available. ODCs (fuel, per diem, shop fees) TBD per task order.</span>
                  </div>
                </div>
              ) : (
                <span style={{fontSize:11,color:"#8a9ab0"}}>Estimate the types of people needed and how many hours per year. Your CO will help refine this.</span>
              )}
            </div>

            {pkg.igceMode !== "CATALOG" && (<>
            {pkg.laborCats.map((lc, i) => (
              <div key={lc.id} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 28px", gap: 8, alignItems: "end" }}>
                  <div>
                    <Lbl t="Role / Job Title" />
                    <input style={inp} value={lc.title} onChange={e => updateLC(lc.id, "title", e.target.value)} placeholder="e.g., Aircraft Mechanic" />
                  </div>
                  <div>
                    <Lbl t="Level" />
                    <select style={inp} value={lc.level} onChange={e => updateLC(lc.id, "level", e.target.value)}>
                      {["Junior","Mid","Senior","Principal","SME"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <Lbl t="Hours / Year" />
                    <input style={inp} value={lc.hours} onChange={e => updateLC(lc.id, "hours", e.target.value)} placeholder="2080" type="number" />
                  </div>
                  <div>
                    <Lbl t="Rate / Hour ($)" />
                    <input style={inp} value={lc.rate} onChange={e => updateLC(lc.id, "rate", e.target.value)} placeholder="0.00" type="number" />
                  </div>
                  <button onClick={() => setPkg(p => ({ ...p, laborCats: p.laborCats.filter(l => l.id !== lc.id) }))}
                    style={{ background: "none", border: "none", color: "#4a2a2a", cursor: "pointer", fontSize: 16, marginTop: 20 }}>×</button>
                </div>
                <Lbl t="Where does this rate come from?" />
                <input style={inp} value={lc.basis} onChange={e => updateLC(lc.id, "basis", e.target.value)}
                  placeholder="e.g., GSA schedule rates, prior contract, BLS wage data, industry standard" />
              </div>
            ))}
            <button onClick={addLC}
              style={{ width: "100%", background: C.bg3, border: `1px dashed ${C.border}`, color: C.muted,
                       padding: "7px", borderRadius: 4, cursor: "pointer", fontSize: 11, marginBottom: 20 }}>
              + Add Labor Category
            </button>
            </>)}

            <div style={{ fontSize: 13, fontWeight: "bold", color: C.text, marginBottom: 8 }}>Other Costs</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <Lbl t="Travel ($)" />
                <input style={inp} value={pkg.odcTravel} onChange={e => set("odcTravel", e.target.value)} placeholder="Annual travel estimate" type="number" />
              </div>
              <div>
                <Lbl t="Materials / Supplies ($)" />
                <input style={inp} value={pkg.odcMaterials} onChange={e => set("odcMaterials", e.target.value)} placeholder="Annual materials estimate" type="number" />
              </div>
              <div>
                <Lbl t="Other Direct Costs ($)" />
                <input style={inp} value={pkg.odcOther} onChange={e => set("odcOther", e.target.value)} placeholder="Subcontracts, equipment, etc." type="number" />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Lbl t="IGCE Notes / Assumptions" />
              <textarea style={ta} rows={2} value={pkg.igceNotes} onChange={e => set("igceNotes", e.target.value)}
                placeholder="Any assumptions behind your estimates, known limitations, or factors that could change the cost..." />
            </div>
          </div>
        )}

        {/* ── STEP 4: Market Research ────────────────────────── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Pre-Market Research Assessment</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Your knowledge of the market is valuable. Share what you know — your CO will conduct formal market research using this as a starting point.
            </div>

            <QCard q="What do you know about the market for this requirement?" sub="Industry context, number of potential vendors, typical pricing, market maturity">
              <textarea style={ta} rows={3} value={pkg.mrBackground} onChange={e => set("mrBackground", e.target.value)}
                placeholder="e.g., There are approximately 8-10 companies that provide aircraft maintenance services at this level. Most are small businesses with A&P mechanics." />
            </QCard>

            <QCard q="Do you know of specific companies that could do this work?" sub="Names, websites, prior contacts — even rough leads help. This is not a commitment to use them.">
              <textarea style={ta} rows={2} value={pkg.knownVendors} onChange={e => set("knownVendors", e.target.value)}
                placeholder="e.g., Company A (current contractor), Company B (provided quote in 2023), Company C (known in industry)" />
            </QCard>

            <QCard q="Is this commercially available?" sub="Can you buy something similar from a commercial catalog or vendor?">
              <div style={{ display: "flex", gap: 8 }}>
                {[["YES","Yes — commercially available"],["PARTIAL","Partially — some commercial elements"],["NO","No — Government-unique requirement"],["UNKNOWN","Not sure"]].map(([val,lbl]) => (
                  <button key={val} onClick={() => set("commercialAvail", val)}
                    style={{ flex: 1, padding: "7px 4px", borderRadius: 4, cursor: "pointer", fontSize: 10,
                             background: pkg.commercialAvail === val ? "#0a2a4a" : C.bg3,
                             border: `1px solid ${pkg.commercialAvail === val ? C.blue : C.border}`,
                             color: pkg.commercialAvail === val ? C.blue : C.dim }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </QCard>

            <QCard q="Small business potential?" sub="Do you know of small businesses that could do this work?">
              <div style={{ display: "flex", gap: 8 }}>
                {[["YES","Yes — small businesses can do this"],["MAYBE","Maybe — depends on requirements"],["NO","No — large business likely needed"],["UNKNOWN","Not sure"]].map(([val,lbl]) => (
                  <button key={val} onClick={() => set("smallBizPotential", val)}
                    style={{ flex: 1, padding: "7px 4px", borderRadius: 4, cursor: "pointer", fontSize: 10,
                             background: pkg.smallBizPotential === val ? "#0a2a4a" : C.bg3,
                             border: `1px solid ${pkg.smallBizPotential === val ? C.blue : C.border}`,
                             color: pkg.smallBizPotential === val ? C.blue : C.dim }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </QCard>

            <QCard q="Do you know of any existing contract vehicles that could be used?" sub="NASA GWACs, GSA schedules, agency IDIQs, BPAs — any pre-competed vehicle">
              <textarea style={ta} rows={2} value={pkg.existingVehicles} onChange={e => set("existingVehicles", e.target.value)}
                placeholder="e.g., SEWP V, CIO-SP3, 8(a) STARS III, or none known" />
            </QCard>

            <QCard q="Any price data you're aware of?" sub="Prior quotes, catalog prices, published rates, prior contract values">
              <textarea style={ta} rows={2} value={pkg.priceDataSources} onChange={e => set("priceDataSources", e.target.value)}
                placeholder="e.g., Prior contract 80ARC022C0001 was $1.2M/year for similar scope. Company A quoted $850K in 2023." />
            </QCard>

            <QCard q="Anything else your CO should know about the market?">
              <textarea style={ta} rows={2} value={pkg.mrNotes} onChange={e => set("mrNotes", e.target.value)}
                placeholder="Industry trends, unique constraints, known incumbency issues, anything else relevant..." />
            </QCard>
          </div>
        )}

        {/* ── STEP 5: Documents ─────────────────────────────── */}
        {step === 5 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Supporting Documents</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Attach your NF-1707 and any other documents that support your request.
            </div>

            {/* NF-1707 */}
            <div style={{ background: C.bg3, border: `2px solid ${pkg.nf1707Uploaded ? "#1a6a3a" : C.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "bold", color: C.text }}>NF-1707 — Special Approvals & Affirmations</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Required for all procurement requests. Must be signed by an authorized official. Template available in the NASA Virtual Procurement Office (VPO).</div>
                </div>
                {pkg.nf1707Uploaded ? (
                  <span style={{ background: "#041a0e", border: "1px solid #1a6a3a", color: C.green, fontSize: 10, padding: "3px 10px", borderRadius: 10 }}>✓ UPLOADED</span>
                ) : (
                  <span style={{ background: "#1a1a04", border: "1px solid #4a4a1a", color: C.yellow, fontSize: 10, padding: "3px 10px", borderRadius: 10 }}>REQUIRED</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ background: "#0a2a4a", border: `1px solid ${C.blue}`, color: C.blue,
                                padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
                  📎 Upload NF-1707
                  <input type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }}
                    onChange={e => { if (e.target.files[0]) set("nf1707Uploaded", true); }} />
                </label>
                <span style={{ fontSize: 10, color: C.muted }}>PDF or Word accepted</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <Lbl t="NF-1707 Notes (optional)" />
                <textarea style={{ ...ta, minHeight: 44 }} rows={2} value={pkg.nf1707Notes}
                  onChange={e => set("nf1707Notes", e.target.value)}
                  placeholder="e.g., Section 2.III IT coordination not required — no IT systems involved" />
              </div>
            </div>

            {/* Additional docs */}
            <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Additional Supporting Documents (Optional)</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                Examples: approved budget document, safety plan, existing SOW you want to base this on, prior contract, technical specifications
              </div>
              <label style={{ display: "block", border: "2px dashed #1a3a6e", borderRadius: 6, padding: "20px",
                              textAlign: "center", cursor: "pointer", color: C.muted, fontSize: 11 }}>
                📎 Click to upload additional documents
                <input type="file" multiple accept=".pdf,.docx,.doc,.xlsx,.txt" style={{ display: "none" }} />
              </label>
              <Lbl t="Describe any additional documents attached" />
              <textarea style={ta} rows={2} value={pkg.additionalDocs} onChange={e => set("additionalDocs", e.target.value)}
                placeholder="e.g., Attached: FY2025 approved budget page ($1.5M allocated), prior SOW from contract 80ARC022C0001 for reference" />
            </div>
          </div>
        )}

        {/* ── STEP 6: Review & Submit ────────────────────────── */}
        {step === 6 && (
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>Review & Submit</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              Review your package below. Your Branch Chief will receive this for CO assignment.
            </div>

            {/* Summary cards */}
            {[
              { label: "Requestor", items: [`${(pkg.reqName||"").split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ")} · ${pkg.reqTitle || ""}`, `${pkg.reqEmail}`, `${pkg.reqCenter} · ${pkg.reqOrg}`] },
              { label: "Requirement", items: [`${pkg.reqtitle}`, `Est. $${parseFloat(pkg.valueEstimate||0).toLocaleString()} · ${pkg.popMonths} months${pkg.hasOptions ? ` + ${pkg.optionYears} options` : ""}`, `${pkg.placeOfPerf || "Place of performance not specified"}`, `Urgency: ${pkg.urgency}`] },
              { label: "SOW", items: [`${pkg.tasks.filter(t=>t.title).length} work tasks defined`, `Objective: ${pkg.sowObjective ? pkg.sowObjective.slice(0,80)+"..." : "Not completed"}`, `Gov-Furnished: ${pkg.governmentFurnished ? "Yes" : "None specified"}`] },
              { label: "IGCE", items: [`Base year estimate: $${igceTotal.toLocaleString()}`, `${pkg.igceMode === "CATALOG" ? `Catalog line items: ${pkg.catalogClins.filter(c=>c.title).length}` : `Labor categories: ${pkg.laborCats.filter(l=>l.title).length}`}`, `Confidence: ${pkg.valueConfidence}`] },
              { label: "Market Research", items: [`Commercial: ${pkg.commercialAvail}`, `Small business potential: ${pkg.smallBizPotential}`, `Known vendors: ${pkg.knownVendors ? "Yes" : "None identified"}`] },
              { label: "Documents", items: [`NF-1707: ${pkg.nf1707Uploaded ? "✓ Uploaded" : "⚠ Not yet uploaded"}`, `PR Number: ${pkg.prNumber || "Not provided"}`, `Fund Cite: ${pkg.fundCite || "Not provided"}`] },
            ].map(section => (
              <div key={section.label} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginBottom: 6, letterSpacing: 1 }}>{section.label.toUpperCase()}</div>
                {section.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: item.includes("⚠") ? C.yellow : C.dim, marginBottom: 3 }}>{item}</div>
                ))}
              </div>
            ))}

            {/* Routing info */}
            <div style={{ background: "#0a2a1a", border: "1px solid #1a6a3a", borderRadius: 6, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: "bold", color: C.green, marginBottom: 6 }}>SUBMISSION ROUTING</div>
              <div style={{ fontSize: 11, color: C.dim }}>
                This package will be routed to your Branch Chief for CO assignment. Submitted by{" "}
                <strong style={{ color: C.text }}>{pkg.branchChief || "[Branch Chief not specified]"}</strong>
                {pkg.branchChiefEmail && ` (${pkg.branchChiefEmail})`}
                {" "}for CO assignment.
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
                You will be notified when a Contracting Officer has been assigned and work begins.
              </div>
            </div>

            {!pkg.nf1707Uploaded && (
              <div style={{ background: "#1a1a04", border: "1px solid #4a4a1a", borderRadius: 6, padding: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: C.yellow }}>⚠ NF-1707 not yet uploaded. Your CO will follow up — you can still submit and provide it separately.</span>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: "100%", background: submitting ? "#061020" : "#1a4a8a",
                       border: "1px solid #2a6aaa", color: submitting ? C.muted : C.blue,
                       padding: "14px", borderRadius: 6, cursor: submitting ? "default" : "pointer",
                       fontSize: 14, fontWeight: "bold", marginTop: 4 }}>
              {submitting ? "SUBMITTING..." : "SUBMIT ACQUISITION PACKAGE →"}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, background: C.bg3, border: `1px solid ${C.border}`, color: C.muted,
                       padding: "11px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance}
              style={{ flex: 3, background: canAdvance ? "#1a4a8a" : C.bg3,
                       border: `1px solid ${canAdvance ? C.blue : C.border}`,
                       color: canAdvance ? C.blue : C.dim,
                       padding: "11px", borderRadius: 6,
                       cursor: canAdvance ? "pointer" : "default", fontSize: 12, fontWeight: "bold" }}>
              Continue →
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: C.dim }}>
          Questions? Contact your procurement office or email your Branch Chief.
          <br />Your progress is saved automatically.
        </div>
      </div>
    </div>
  );
}

// ── SOW Generator ─────────────────────────────────────────────────
function buildSOW(pkg) {
  if (!pkg.sowObjective && !pkg.sowBackground) return "[Complete the SOW Builder fields above to generate a draft SOW]";

  const center = pkg.reqCenter || "[CENTER]";
  const title  = pkg.reqtitle  || "[REQUIREMENT TITLE]";
  const co     = (pkg.reqName||"").split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ") || "[REQUESTOR]";
  const popStart = pkg.popStart ? new Date(pkg.popStart+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[START DATE]";

  let t = `STATEMENT OF WORK / PERFORMANCE WORK STATEMENT\n${"═".repeat(60)}\n\n`;
  t += `${title}\n${center}\n\n`;

  t += `1.  BACKGROUND\n\n`;
  t += `${pkg.sowBackground || `${center} requires contractor support for ${title}.`}\n\n`;

  t += `2.  SCOPE AND OBJECTIVE\n\n`;
  t += `${pkg.sowObjective || `The contractor shall provide professional services in support of ${title} at ${center}.`}\n\n`;

  t += `3.  TASKS\n\n`;
  pkg.tasks.filter(t => t.title).forEach((task, i) => {
    t += `3.${i+1}  ${task.title.toUpperCase()}\n\n`;
    if (task.desc) t += `${task.desc}\n\n`;
    if (task.deliverable) t += `Deliverable: ${task.deliverable} (${task.frequency || "as required"})\n\n`;
  });

  t += `4.  PERIOD OF PERFORMANCE\n\n`;
  t += `Base Period: ${popStart} through [END DATE] (${pkg.popMonths} months)\n`;
  if (pkg.hasOptions) t += `Options: ${pkg.optionYears} option year(s) of 12 months each\n`;
  t += `\n`;

  t += `5.  PLACE OF PERFORMANCE\n\n`;
  t += `${pkg.placeOfPerf || center}\n`;
  if (pkg.isRemote) t += `Remote/telework authorized in accordance with NASA policy.\n`;
  t += `\n`;

  if (pkg.performanceStds) {
    t += `6.  PERFORMANCE STANDARDS\n\n${pkg.performanceStds}\n\n`;
  }

  if (pkg.governmentFurnished) {
    t += `7.  GOVERNMENT-FURNISHED PROPERTY AND INFORMATION\n\n${pkg.governmentFurnished}\n\n`;
  }

  if (pkg.specialReqs) {
    t += `8.  SPECIAL REQUIREMENTS\n\n${pkg.specialReqs}\n\n`;
  }

  t += `9.  SECURITY\n\nSecurity Level: ${pkg.securityLevel || "Public Trust"}\n`;
  t += `All contractor personnel requiring access to NASA facilities shall obtain required background investigation clearance prior to commencement of work.\n\n`;

  t += `10. DATA RIGHTS\n\n${pkg.dataRights || "The Government shall have unlimited rights to all data, deliverables, and work products produced under this contract."}\n`;

  return t;
}
