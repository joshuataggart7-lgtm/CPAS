// CPAS Compliance & Closeout Tools
// - Responsibility Determination (FAR 9.1 / FAR 9.105-2)
// - Contract Closeout Checklist (FAR 4.804)
// - D&F Templates: T&M, Options >5yr, Non-Commercial, Bundling, Consolidation

import React, { useState, useMemo } from "react";

const C = {
  bg: "#040d1a", bg2: "#061020", bg3: "#08182e",
  border: "#1a3a6e", blue: "#4a9eff", text: "#c8d8f0",
  muted: "#4a7aaa", dim: "#7a9ab8", green: "#3aaa66",
  yellow: "#f4c542", red: "#e87c3e", purple: "#c07aff",
};
const inp = {
  background: "#08182e", border: "1px solid #1a3a6e", color: "#c8d8f0",
  padding: "6px 9px", borderRadius: 3, fontSize: 11,
  width: "100%", boxSizing: "border-box",
  fontFamily: "'IBM Plex Mono', monospace",
};
const ta = { ...inp, resize: "vertical", minHeight: 55, lineHeight: 1.5 };
const lbl = (t, req) => (
  <div style={{ fontSize: 9, color: req ? C.yellow : C.muted, letterSpacing: 1, marginBottom: 3, marginTop: 7 }}>
    {t}{req ? " *" : ""}
  </div>
);
const secHead = (t, color = C.blue) => (
  <div style={{ fontSize: 10, color, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>{t}</div>
);

function TwoPane({ leftContent, text, panelLabel, onSave }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", minHeight: 480, fontFamily: "'IBM Plex Mono', monospace", color: C.text }}>
      <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "70vh" }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>{panelLabel}</div>
        {leftContent}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
          <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: C.bg3, border: `1px solid ${C.border}`, color: copied ? C.green : C.blue, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
            {copied ? "✓ COPIED" : "COPY"}
          </button>
          <button onClick={() => onSave && onSave(text)}
            style={{ background: "#0a2a1a", border: "1px solid #1a6a3a", color: C.green, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
            SAVE TO PACKAGE
          </button>
        </div>
        <pre style={{ flex: 1, padding: 16, fontSize: 10, color: C.dim, overflow: "auto", maxHeight: "62vh", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
          {text}
        </pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RESPONSIBILITY DETERMINATION — FAR 9.1 / FAR 9.105-2
// ═══════════════════════════════════════════════════════════════════

const RESPONSIBILITY_STANDARDS = [
  { id: "financial",    label: "Adequate financial resources",               farRef: "FAR 9.104-1(a)" },
  { id: "performance",  label: "Ability to comply with PoP",                 farRef: "FAR 9.104-1(b)" },
  { id: "record",       label: "Satisfactory performance record",            farRef: "FAR 9.104-1(c)" },
  { id: "integrity",    label: "Satisfactory record of integrity and ethics", farRef: "FAR 9.104-1(d)" },
  { id: "organization", label: "Necessary organization, experience, accounting, technical skills", farRef: "FAR 9.104-1(e)" },
  { id: "equipment",    label: "Necessary production, construction, or technical equipment", farRef: "FAR 9.104-1(f)" },
  { id: "other",        label: "Qualified and eligible to receive award under applicable laws/regs", farRef: "FAR 9.104-1(g)" },
];

export function ResponsibilityDetermination({ intake, onGenerated }) {
  const [r, setR] = useState({
    contractorName:   "",
    contractorAddress:"",
    uei:              "",
    solNumber:        intake?.solNumber || "",
    reqTitle:         intake?.reqTitle  || "",
    value:            intake?.value     || "",
    findings:         Object.fromEntries(RESPONSIBILITY_STANDARDS.map(s => [s.id, { status: "SATISFACTORY", notes: "" }])),
    samCheck:         true,
    samDate:          "",
    samResult:        "No active exclusions found",
    cparsCheck:       false,
    cparsFindings:    "",
    presAwardSurvey:  false,
    surveyDate:       "",
    surveyResults:    "",
    isSmallBusiness:  false,
    sbaCertified:     false,
    nonresponsible:   false,
    nonresponsibleBasis: "",
    coName:           intake?.coName || "",
    coDate:           "",
  });
  const set = (k, v) => setR(rr => ({ ...rr, [k]: v }));
  const setFinding = (id, field, val) => setR(rr => ({ ...rr, findings: { ...rr.findings, [id]: { ...rr.findings[id], [field]: val } } }));

  const allSatisfactory = RESPONSIBILITY_STANDARDS.every(s => r.findings[s.id]?.status === "SATISFACTORY");
  const text = useMemo(() => buildResponsibilityText(r, intake), [r, intake]);

  const leftContent = (
    <>
      {secHead("CONTRACTOR INFORMATION")}
      {lbl("Contractor Name", true)}
      <input style={inp} value={r.contractorName} onChange={e => set("contractorName", e.target.value)} />
      {lbl("Contractor Address")}
      <input style={inp} value={r.contractorAddress} onChange={e => set("contractorAddress", e.target.value)} />
      {lbl("UEI")}
      <input style={inp} value={r.uei} onChange={e => set("uei", e.target.value)} />
      {lbl("Requirement")}
      <input style={inp} value={r.reqTitle} onChange={e => set("reqTitle", e.target.value)} />

      {secHead("SAM.GOV EXCLUSION CHECK")}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div onClick={() => set("samCheck", !r.samCheck)}
          style={{ width: 13, height: 13, border: `1px solid ${r.samCheck ? C.green : "#2a4a6a"}`, borderRadius: 2,
                   background: r.samCheck ? C.green : "transparent", cursor: "pointer", flexShrink: 0,
                   display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
          {r.samCheck ? "✓" : ""}
        </div>
        <span style={{ fontSize: 10, color: C.dim }}>SAM.gov exclusion check performed</span>
      </div>
      {r.samCheck && (<>
        {lbl("Date of Check")}
        <input style={inp} type="date" value={r.samDate} onChange={e => set("samDate", e.target.value)} />
        {lbl("Result")}
        <input style={inp} value={r.samResult} onChange={e => set("samResult", e.target.value)} />
      </>)}

      {secHead("CPARS / PAST PERFORMANCE")}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div onClick={() => set("cparsCheck", !r.cparsCheck)}
          style={{ width: 13, height: 13, border: `1px solid ${r.cparsCheck ? C.blue : "#2a4a6a"}`, borderRadius: 2,
                   background: r.cparsCheck ? C.blue : "transparent", cursor: "pointer", flexShrink: 0,
                   display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
          {r.cparsCheck ? "✓" : ""}
        </div>
        <span style={{ fontSize: 10, color: C.dim }}>CPARS performance record reviewed</span>
      </div>
      {r.cparsCheck && (<>
        {lbl("CPARS Findings")}
        <textarea style={ta} rows={2} value={r.cparsFindings} onChange={e => set("cparsFindings", e.target.value)}
          placeholder="Describe ratings and any performance concerns..." />
      </>)}

      {secHead("PRE-AWARD SURVEY")}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div onClick={() => set("presAwardSurvey", !r.presAwardSurvey)}
          style={{ width: 13, height: 13, border: `1px solid ${r.presAwardSurvey ? C.yellow : "#2a4a6a"}`, borderRadius: 2,
                   background: r.presAwardSurvey ? C.yellow : "transparent", cursor: "pointer", flexShrink: 0,
                   display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#000" }}>
          {r.presAwardSurvey ? "✓" : ""}
        </div>
        <span style={{ fontSize: 10, color: C.dim }}>Pre-award survey conducted</span>
      </div>
      {r.presAwardSurvey && (<>
        {lbl("Survey Date")}
        <input style={inp} type="date" value={r.surveyDate} onChange={e => set("surveyDate", e.target.value)} />
        {lbl("Survey Results")}
        <textarea style={ta} rows={2} value={r.surveyResults} onChange={e => set("surveyResults", e.target.value)} />
      </>)}

      {secHead("FAR 9.104-1 STANDARDS")}
      <div style={{ fontSize: 9, color: C.dim, marginBottom: 6 }}>Assess each standard — click to toggle status</div>
      {RESPONSIBILITY_STANDARDS.map(s => (
        <div key={s.id} style={{ background: C.bg3, border: `1px solid ${r.findings[s.id]?.status === "SATISFACTORY" ? "#1a4a2a" : r.findings[s.id]?.status === "UNSATISFACTORY" ? "#4a1a1a" : C.border}`, borderRadius: 3, padding: "7px 9px", marginBottom: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: C.text, flex: 1, lineHeight: 1.3 }}>{s.label}</span>
            <span style={{ fontSize: 8, color: C.muted, marginLeft: 6, whiteSpace: "nowrap" }}>{s.farRef}</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {["SATISFACTORY","UNSATISFACTORY","N/A"].map(status => (
              <button key={status} onClick={() => setFinding(s.id, "status", status)}
                style={{ flex: 1, padding: "3px 4px", borderRadius: 2, cursor: "pointer", fontSize: 9, fontWeight: "bold",
                         background: r.findings[s.id]?.status === status ? (status === "SATISFACTORY" ? "#041a0e" : status === "UNSATISFACTORY" ? "#1a0404" : "#0a0a1a") : "transparent",
                         border: `1px solid ${r.findings[s.id]?.status === status ? (status === "SATISFACTORY" ? C.green : status === "UNSATISFACTORY" ? C.red : "#4a4a8a") : "#1a3a6e"}`,
                         color: r.findings[s.id]?.status === status ? (status === "SATISFACTORY" ? C.green : status === "UNSATISFACTORY" ? C.red : "#8a8aff") : C.dim }}>
                {status === "SATISFACTORY" ? "✓ SAT" : status === "UNSATISFACTORY" ? "✗ UNSAT" : "N/A"}
              </button>
            ))}
          </div>
          {r.findings[s.id]?.status !== "N/A" && (
            <input value={r.findings[s.id]?.notes || ""} onChange={e => setFinding(s.id, "notes", e.target.value)}
              placeholder="Supporting notes (optional)..."
              style={{ ...inp, padding: "3px 7px", fontSize: 9 }} />
          )}
        </div>
      ))}

      {secHead("DETERMINATION")}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={() => set("nonresponsible", false)}
          style={{ flex: 1, padding: "7px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: "bold",
                   background: !r.nonresponsible ? "#041a0e" : C.bg3,
                   border: `1px solid ${!r.nonresponsible ? C.green : C.border}`,
                   color: !r.nonresponsible ? C.green : C.dim }}>
          ✓ AFFIRMATIVE (RESPONSIBLE)
        </button>
        <button onClick={() => set("nonresponsible", true)}
          style={{ flex: 1, padding: "7px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: "bold",
                   background: r.nonresponsible ? "#1a0404" : C.bg3,
                   border: `1px solid ${r.nonresponsible ? C.red : C.border}`,
                   color: r.nonresponsible ? C.red : C.dim }}>
          ✗ NON-RESPONSIBILITY
        </button>
      </div>
      {r.nonresponsible && (<>
        <div style={{ background: "#1a0404", border: "1px solid #4a1a1a", borderRadius: 4, padding: "8px 10px", marginBottom: 8, fontSize: 10, color: "#f07070" }}>
          ⚠ Non-responsibility determination for small businesses requires SBA referral per FAR 19.602-1 before award to another contractor.
        </div>
        {lbl("Basis for Non-Responsibility Determination")}
        <textarea style={ta} rows={3} value={r.nonresponsibleBasis} onChange={e => set("nonresponsibleBasis", e.target.value)}
          placeholder="Cite specific FAR 9.104-1 standard(s) not met and supporting facts..." />
      </>)}

      {lbl("Contracting Officer")}
      <input style={inp} value={r.coName} onChange={e => set("coName", e.target.value)} />
      {lbl("Date")}
      <input style={inp} type="date" value={r.coDate} onChange={e => set("coDate", e.target.value)} />
    </>
  );

  return <TwoPane leftContent={leftContent} text={text} panelLabel="RESPONSIBILITY DETERMINATION — FAR 9.105-2" onSave={onGenerated} />;
}

function buildResponsibilityText(r, intake) {
  const fmt = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[DATE]";
  let t = `AFFIRMATIVE RESPONSIBILITY DETERMINATION\n`;
  t += `FAR 9.105-2\n`;
  t += `${"═".repeat(70)}\n\n`;
  t += `Contractor:       ${r.contractorName || "[CONTRACTOR NAME]"}\n`;
  if (r.contractorAddress) t += `Address:          ${r.contractorAddress}\n`;
  if (r.uei)               t += `UEI:              ${r.uei}\n`;
  t += `Requirement:      ${r.reqTitle || intake?.reqTitle || "[REQUIREMENT]"}\n`;
  if (r.solNumber)         t += `Solicitation No.: ${r.solNumber}\n`;
  t += `\n`;

  t += `${"─".repeat(70)}\n`;
  t += `1.  SAM.GOV EXCLUSION CHECK\n\n`;
  if (r.samCheck) {
    t += `    Date checked: ${fmt(r.samDate)}\n`;
    t += `    Result: ${r.samResult}\n\n`;
  } else {
    t += `    SAM.gov exclusion check not yet performed.\n\n`;
  }

  if (r.cparsCheck) {
    t += `${"─".repeat(70)}\n`;
    t += `2.  PAST PERFORMANCE REVIEW (CPARS)\n\n`;
    t += `    ${r.cparsFindings || "No CPARS records found."}\n\n`;
  }

  if (r.presAwardSurvey) {
    t += `${"─".repeat(70)}\n`;
    t += `3.  PRE-AWARD SURVEY\n\n`;
    t += `    Survey Date: ${fmt(r.surveyDate)}\n`;
    t += `    Results: ${r.surveyResults}\n\n`;
  }

  t += `${"─".repeat(70)}\n`;
  t += `${r.cparsCheck || r.presAwardSurvey ? "4" : "2"}.  STANDARDS OF RESPONSIBILITY — FAR 9.104-1\n\n`;
  RESPONSIBILITY_STANDARDS.forEach(s => {
    const finding = r.findings[s.id];
    const statusIcon = finding?.status === "SATISFACTORY" ? "✓" : finding?.status === "UNSATISFACTORY" ? "✗" : "—";
    const statusLabel = finding?.status || "SATISFACTORY";
    t += `    ${statusIcon} ${s.label}\n`;
    t += `      [${statusLabel}]${finding?.notes ? " — " + finding.notes : ""}\n`;
    t += `      (${s.farRef})\n\n`;
  });

  t += `${"─".repeat(70)}\n`;
  const secNum = (r.cparsCheck || r.presAwardSurvey ? "5" : "3");
  if (!r.nonresponsible) {
    t += `${secNum}.  DETERMINATION\n\n`;
    t += `    Based on the foregoing analysis, I determine that ${r.contractorName || "[CONTRACTOR NAME]"} `;
    t += `IS a responsible prospective contractor pursuant to FAR 9.104-1 and is therefore `;
    t += `eligible for award.\n\n`;
  } else {
    t += `${secNum}.  NON-RESPONSIBILITY DETERMINATION\n\n`;
    t += `    Based on the foregoing analysis, I determine that ${r.contractorName || "[CONTRACTOR NAME]"} `;
    t += `IS NOT a responsible prospective contractor for the following reasons:\n\n`;
    t += `    ${r.nonresponsibleBasis || "[BASIS FOR NON-RESPONSIBILITY]"}\n\n`;
    t += `    NOTE: If the prospective contractor is a small business, this determination `;
    t += `must be referred to the SBA in accordance with FAR 19.602-1 prior to award to another contractor.\n\n`;
  }

  t += `${"─".repeat(70)}\n\n`;
  t += `${"_".repeat(40)}\n`;
  t += `${r.coName || "[Contracting Officer]"}\n`;
  t += `Contracting Officer\n`;
  t += `Date: ${fmt(r.coDate)}\n`;
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// CONTRACT CLOSEOUT CHECKLIST — FAR 4.804
// ═══════════════════════════════════════════════════════════════════

const CLOSEOUT_ITEMS = [
  // Physical completion
  { id: "completion",     phase: "COMPLETION",    label: "Contracting Officer received written notice that work is physically complete", farRef: "FAR 4.804-1(a)(1)", required: true },
  { id: "deliverables",   phase: "COMPLETION",    label: "All deliverables received, inspected, and accepted in writing", farRef: "FAR 4.804-1", required: true },
  { id: "final_invoice",  phase: "COMPLETION",    label: "Final invoice submitted and paid by contractor", farRef: "FAR 4.804-1(a)(3)", required: true },
  { id: "pat_reports",    phase: "COMPLETION",    label: "All patent and royalty reports received (R&D contracts)", farRef: "FAR 27.303", required: false },

  // Financial
  { id: "audit",          phase: "FINANCIAL",     label: "Audit cleared or settlement of indirect rates completed (cost-type)", farRef: "FAR 4.804-5(a)(9)", required: false },
  { id: "settlement",     phase: "FINANCIAL",     label: "Any termination settlement agreement executed", farRef: "FAR 49.109-1", required: false },
  { id: "deobligation",   phase: "FINANCIAL",     label: "Excess funds deobligated and returned to program office", farRef: "FAR 4.804-5(a)", required: true },
  { id: "final_price",    phase: "FINANCIAL",     label: "Final price established (fixed-price or redeterminable)", farRef: "FAR 4.804-5(a)(2)", required: true },
  { id: "interim_voucher",phase: "FINANCIAL",     label: "All interim vouchers audited and approved (cost-type)", farRef: "FAR 42.705", required: false },
  { id: "quick_closeout", phase: "FINANCIAL",     label: "Quick-closeout procedure used if applicable (FAR 42.708)", farRef: "FAR 42.708", required: false },

  // Property
  { id: "gfe_returned",   phase: "PROPERTY",      label: "All Government-furnished property accounted for and returned/disposed", farRef: "FAR 45.6", required: false },
  { id: "property_survey",phase: "PROPERTY",      label: "Property survey or final inventory completed", farRef: "FAR 45.605", required: false },
  { id: "classified",     phase: "PROPERTY",      label: "All classified material returned or destroyed per security reqs", farRef: "FAR 4.804-5", required: false },

  // Contractor performance
  { id: "cpars",          phase: "PERFORMANCE",   label: "CPARS evaluation submitted (all contracts meeting CPARS thresholds)", farRef: "FAR 42.1502", required: true },
  { id: "subcontract_perf",phase:"PERFORMANCE",   label: "Subcontractor performance evaluations submitted (if applicable)", farRef: "FAR 42.1502", required: false },
  { id: "key_personnel",  phase: "PERFORMANCE",   label: "COR letter revoked/closed out with copy filed", farRef: "NFS 1801.602-2", required: true },

  // File documentation
  { id: "fpds",           phase: "FILING",        label: "FPDS-NG Contract Action Report updated for closeout", farRef: "FAR 4.604", required: true },
  { id: "near_complete",  phase: "FILING",        label: "All documents uploaded to NEAR in correct file elements", farRef: "NFS 1804.804", required: true },
  { id: "sam_synopsis",   phase: "FILING",        label: "SAM.gov closeout synopsis posted (if required)", farRef: "FAR 5.301", required: false },
  { id: "dd254",          phase: "FILING",        label: "DD-254 closed out (classified contracts)", farRef: "FAR 4.403", required: false },
  { id: "contractor_release",phase:"FILING",      label: "Contractor release of claims obtained (if applicable)", farRef: "FAR 4.804-5(a)(7)", required: false },

  // Timeliness
  { id: "timeliness",     phase: "TIMELINESS",    label: "Closeout completed within required timeframe (4 months SAP, 20 months fixed-price, 36 months cost-type)", farRef: "FAR 4.804-1(a)", required: true },
  { id: "co_cert",        phase: "TIMELINESS",    label: "Contracting Officer certification of contract completion", farRef: "FAR 4.804-5(a)(14)", required: true },
];

const CLOSEOUT_PHASES = ["COMPLETION", "FINANCIAL", "PROPERTY", "PERFORMANCE", "FILING", "TIMELINESS"];
const PHASE_LABELS = {
  COMPLETION:  "Physical Completion",
  FINANCIAL:   "Financial Settlement",
  PROPERTY:    "Government Property",
  PERFORMANCE: "Contractor Performance",
  FILING:      "File Completion",
  TIMELINESS:  "Certification",
};

export function ContractCloseout({ intake, onGenerated }) {
  const [c, setC] = useState({
    contractNumber:  intake?.contractNumber || "",
    contractorName:  "",
    reqTitle:        intake?.reqTitle || "",
    value:           intake?.value || "",
    contractType:    intake?.contractType || "FFP",
    completionDate:  "",
    checks:          Object.fromEntries(CLOSEOUT_ITEMS.map(i => [i.id, { done: false, date: "", notes: "", responsible: "" }])),
    coName:          intake?.coName || "",
    coDate:          "",
  });
  const set = (k, v) => setC(cc => ({ ...cc, [k]: v }));
  const setCheck = (id, field, val) => setC(cc => ({ ...cc, checks: { ...cc.checks, [id]: { ...cc.checks[id], [field]: val } } }));

  const required = CLOSEOUT_ITEMS.filter(i => i.required);
  const completedRequired = required.filter(i => c.checks[i.id]?.done).length;
  const totalDone = CLOSEOUT_ITEMS.filter(i => c.checks[i.id]?.done).length;
  const allRequiredDone = completedRequired === required.length;
  const pct = Math.round((completedRequired / required.length) * 100);

  const text = useMemo(() => buildCloseoutText(c, intake), [c, intake]);

  const leftContent = (
    <>
      {lbl("Contract Number")}
      <input style={inp} value={c.contractNumber} onChange={e => set("contractNumber", e.target.value)} />
      {lbl("Contractor")}
      <input style={inp} value={c.contractorName} onChange={e => set("contractorName", e.target.value)} />
      {lbl("Requirement")}
      <input style={inp} value={c.reqTitle} onChange={e => set("reqTitle", e.target.value)} />
      {lbl("Contract Type")}
      <select style={inp} value={c.contractType} onChange={e => set("contractType", e.target.value)}>
        {["FFP","T&M","Labor Hour","CPFF","CPAF","CPIF","IDIQ","BPA"].map(ct => <option key={ct}>{ct}</option>)}
      </select>
      {lbl("Physical Completion Date")}
      <input style={inp} type="date" value={c.completionDate} onChange={e => set("completionDate", e.target.value)} />

      {/* Progress */}
      <div style={{ background: "#041a0e", border: `1px solid ${allRequiredDone ? "#1a6a3a" : "#1a3a6e"}`, borderRadius: 4, padding: "8px 10px", marginTop: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: C.muted }}>REQUIRED ITEMS</span>
          <span style={{ fontSize: 11, color: allRequiredDone ? C.green : C.yellow, fontWeight: "bold" }}>{completedRequired}/{required.length}</span>
        </div>
        <div style={{ height: 4, background: "#0a1a3a", borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: allRequiredDone ? C.green : C.yellow, borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>{totalDone} / {CLOSEOUT_ITEMS.length} total items complete</div>
      </div>

      {/* Checklist by phase */}
      {CLOSEOUT_PHASES.map(phase => {
        const items = CLOSEOUT_ITEMS.filter(i => i.phase === phase);
        return (
          <div key={phase} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: C.blue, letterSpacing: 2, marginBottom: 5, marginTop: 8 }}>{PHASE_LABELS[phase]}</div>
            {items.map(item => (
              <div key={item.id} style={{ background: c.checks[item.id]?.done ? "#041a0e" : C.bg3,
                                           border: `1px solid ${c.checks[item.id]?.done ? "#1a4a2a" : item.required ? "#2a2a1a" : C.border}`,
                                           borderRadius: 3, padding: "6px 8px", marginBottom: 4 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div onClick={() => setCheck(item.id, "done", !c.checks[item.id]?.done)}
                    style={{ width: 14, height: 14, border: `1px solid ${c.checks[item.id]?.done ? C.green : item.required ? C.yellow : "#2a4a6a"}`,
                             borderRadius: 2, background: c.checks[item.id]?.done ? C.green : "transparent",
                             cursor: "pointer", flexShrink: 0, marginTop: 1,
                             display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
                    {c.checks[item.id]?.done ? "✓" : ""}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: c.checks[item.id]?.done ? C.green : C.text, lineHeight: 1.3 }}>
                      {item.required ? "* " : ""}{item.label}
                    </div>
                    <div style={{ fontSize: 8, color: C.muted, marginTop: 1 }}>{item.farRef}</div>
                    {c.checks[item.id]?.done && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <input type="date" value={c.checks[item.id]?.date || ""}
                          onChange={e => setCheck(item.id, "date", e.target.value)}
                          style={{ ...inp, width: 130, padding: "2px 5px", fontSize: 9 }} />
                        <input value={c.checks[item.id]?.notes || ""}
                          onChange={e => setCheck(item.id, "notes", e.target.value)}
                          placeholder="Notes..." style={{ ...inp, flex: 1, padding: "2px 5px", fontSize: 9 }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {lbl("Contracting Officer")}
      <input style={inp} value={c.coName} onChange={e => set("coName", e.target.value)} />
      {lbl("Closeout Certification Date")}
      <input style={inp} type="date" value={c.coDate} onChange={e => set("coDate", e.target.value)} />
    </>
  );

  return <TwoPane leftContent={leftContent} text={text} panelLabel="CONTRACT CLOSEOUT CHECKLIST — FAR 4.804" onSave={onGenerated} />;
}

function buildCloseoutText(c, intake) {
  const fmt = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[DATE]";
  let t = `CONTRACT CLOSEOUT CHECKLIST\nFAR 4.804 / NFS 1804.804\n${"═".repeat(70)}\n\n`;
  t += `Contract No.:  ${c.contractNumber || "[CONTRACT NUMBER]"}\n`;
  t += `Contractor:    ${c.contractorName || "[CONTRACTOR]"}\n`;
  t += `Requirement:   ${c.reqTitle || intake?.reqTitle || "[REQUIREMENT]"}\n`;
  t += `Contract Type: ${c.contractType || "FFP"}\n`;
  if (c.completionDate) t += `Completion:    ${fmt(c.completionDate)}\n`;
  t += `\n`;

  CLOSEOUT_PHASES.forEach(phase => {
    const items = CLOSEOUT_ITEMS.filter(i => i.phase === phase);
    t += `${"─".repeat(70)}\n`;
    t += `${PHASE_LABELS[phase].toUpperCase()}\n\n`;
    items.forEach(item => {
      const check = c.checks[item.id];
      const status = check?.done ? "✓ COMPLETE" : item.required ? "☐ REQUIRED" : "☐ N/A OR PENDING";
      t += `  ${status.padEnd(18)} ${item.label}\n`;
      t += `  ${"".padEnd(18)} ${item.farRef}\n`;
      if (check?.done && check.date) t += `  ${"".padEnd(18)} Date: ${fmt(check.date)}\n`;
      if (check?.notes) t += `  ${"".padEnd(18)} Notes: ${check.notes}\n`;
      t += `\n`;
    });
  });

  t += `${"─".repeat(70)}\n`;
  t += `CO CERTIFICATION\n\n`;
  t += `I certify that all required closeout actions have been completed for Contract No. `;
  t += `${c.contractNumber || "[CONTRACT NUMBER]"}.\n\n`;
  t += `${"_".repeat(40)}\n`;
  t += `${c.coName || "[Contracting Officer]"}\n`;
  t += `Contracting Officer\n`;
  t += `Date: ${fmt(c.coDate)}\n`;
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// D&F TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const DF_TYPES = [
  { id: "TM",           label: "T&M / Labor-Hour",            farRef: "FAR 16.601(d)",    color: C.yellow  },
  { id: "OPTIONS_5YR",  label: "Options Over 5 Years",        farRef: "FAR 17.204(e)",    color: C.blue    },
  { id: "NONCOMMERCIAL",label: "Other Than Commercial Items", farRef: "FAR 11.703",       color: C.purple  },
  { id: "BUNDLING",     label: "Contract Bundling",           farRef: "FAR 7.107-2",      color: C.red     },
  { id: "CONSOLIDATION",label: "Consolidation of Requirements",farRef:"FAR 7.107-4",      color: "#f07050" },
  { id: "URGENCY",      label: "Unusual Urgency (Other than Full & Open)", farRef: "FAR 6.302-2", color: C.green },
];

export function DFTemplates({ intake, onGenerated }) {
  const [selectedDF, setSelectedDF] = useState("TM");
  const [fields, setFields] = useState({
    reqTitle:      intake?.reqTitle  || "",
    center:        intake?.center    || "",
    value:         intake?.value     || "",
    contractType:  intake?.contractType || "",
    coName:        intake?.coName    || "",
    coDate:        "",
    // T&M specific
    tmRationale:   "",
    tmSurveillance:"COR will monitor contractor hours and rates on a monthly basis via labor reports and site visits.",
    tmCeiling:     "",
    // Options >5yr
    optionYears:   "5",
    optionRationale:"",
    // Non-commercial
    commercialReason:"",
    // Bundling/Consolidation
    bundlingBenefits:"",
    sbImpact:      "",
    sbMitigation:  "",
    // Urgency
    urgencyFacts:  "",
    urgencyTimeline:"",
  });
  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const dfType = DF_TYPES.find(d => d.id === selectedDF);
  const text = useMemo(() => buildDFText(selectedDF, fields, intake), [selectedDF, fields, intake]);

  const specificFields = () => {
    switch (selectedDF) {
      case "TM": return (<>
        {secHead("T&M DETERMINATION — FAR 16.601(d)", C.yellow)}
        <div style={{ background: "#1a1a04", border: "1px solid #4a4a1a", borderRadius: 4, padding: "8px 10px", marginBottom: 8, fontSize: 10, color: "#c8c84a" }}>
          CO must determine: (1) no other contract type is suitable, (2) ceiling price is negotiated, (3) adequate Government surveillance.
        </div>
        {lbl("Rationale — Why No Other Contract Type Is Suitable", true)}
        <textarea style={ta} rows={3} value={fields.tmRationale} onChange={e => set("tmRationale", e.target.value)}
          placeholder="Explain why the requirement is not well-defined enough for FFP, or why cost uncertainty prevents other types..." />
        {lbl("Government Surveillance Plan")}
        <textarea style={ta} rows={2} value={fields.tmSurveillance} onChange={e => set("tmSurveillance", e.target.value)} />
        {lbl("Negotiated Ceiling Price")}
        <input style={inp} value={fields.tmCeiling} onChange={e => set("tmCeiling", e.target.value)} placeholder="e.g., $500,000 NTE" />
      </>);

      case "OPTIONS_5YR": return (<>
        {secHead("OPTIONS OVER 5 YEARS — FAR 17.204(e)", C.blue)}
        {lbl("Total Option Period (years)")}
        <input style={inp} value={fields.optionYears} onChange={e => set("optionYears", e.target.value)} placeholder="e.g., 7" />
        {lbl("Rationale for Option Period Exceeding 5 Years", true)}
        <textarea style={ta} rows={4} value={fields.optionRationale} onChange={e => set("optionRationale", e.target.value)}
          placeholder="Explain why longer period is in Government's best interest (continuity of services, transition costs, mission requirements)..." />
      </>);

      case "NONCOMMERCIAL": return (<>
        {secHead("OTHER THAN COMMERCIAL ITEMS — FAR 11.703", C.purple)}
        {lbl("Basis for Non-Commercial Determination", true)}
        <textarea style={ta} rows={4} value={fields.commercialReason} onChange={e => set("commercialReason", e.target.value)}
          placeholder="Explain why item/service does not meet FAR 2.101 commercial item definition, or why commercial items do not meet the Government's needs..." />
      </>);

      case "BUNDLING": return (<>
        {secHead("CONTRACT BUNDLING — FAR 7.107-2", C.red)}
        <div style={{ background: "#1a0404", border: "1px solid #4a1a1a", borderRadius: 4, padding: "8px 10px", marginBottom: 8, fontSize: 10, color: "#f07070" }}>
          Bundling requires benefits substantially exceeding alternatives and is subject to SBA review for actions ≥$2M.
        </div>
        {lbl("Measurable Benefits of Bundling", true)}
        <textarea style={ta} rows={3} value={fields.bundlingBenefits} onChange={e => set("bundlingBenefits", e.target.value)}
          placeholder="Quantify cost savings, quality improvements, reduction in contract administration (must substantially exceed costs of bundling)..." />
        {lbl("Impact on Small Business")}
        <textarea style={ta} rows={2} value={fields.sbImpact} onChange={e => set("sbImpact", e.target.value)} />
        {lbl("Small Business Mitigation Measures")}
        <textarea style={ta} rows={2} value={fields.sbMitigation} onChange={e => set("sbMitigation", e.target.value)}
          placeholder="Describe set-aside components, subcontracting opportunities, etc." />
      </>);

      case "CONSOLIDATION": return (<>
        {secHead("CONSOLIDATION — FAR 7.107-4", "#f07050")}
        {lbl("Benefits of Consolidation", true)}
        <textarea style={ta} rows={3} value={fields.bundlingBenefits} onChange={e => set("bundlingBenefits", e.target.value)}
          placeholder="Benefits must be substantial and must not unduly restrict small business participation..." />
        {lbl("Impact on Small Business")}
        <textarea style={ta} rows={2} value={fields.sbImpact} onChange={e => set("sbImpact", e.target.value)} />
      </>);

      case "URGENCY": return (<>
        {secHead("UNUSUAL URGENCY — FAR 6.302-2", C.green)}
        <div style={{ background: "#041a0e", border: "1px solid #1a4a2a", borderRadius: 4, padding: "8px 10px", marginBottom: 8, fontSize: 10, color: "#4aba6a" }}>
          FAR 6.302-2: Unusual and compelling urgency — delay would seriously injure the Government. Must compete to extent practicable.
        </div>
        {lbl("Facts Supporting Urgency", true)}
        <textarea style={ta} rows={4} value={fields.urgencyFacts} onChange={e => set("urgencyFacts", e.target.value)}
          placeholder="Describe specific circumstances creating urgency — what would happen if normal competition were used..." />
        {lbl("Acquisition Timeline / Why Normal Competition Cannot Be Used")}
        <textarea style={ta} rows={3} value={fields.urgencyTimeline} onChange={e => set("urgencyTimeline", e.target.value)}
          placeholder="State the time available, when the need arises, and how normal procurement timeline exceeds that..." />
      </>);

      default: return null;
    }
  };

  const leftContent = (
    <>
      {/* D&F type selector */}
      <div style={{ marginBottom: 10 }}>
        {DF_TYPES.map(df => (
          <button key={df.id} onClick={() => setSelectedDF(df.id)}
            style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 4, padding: "7px 10px", borderRadius: 3, cursor: "pointer", fontSize: 10,
                     background: selectedDF === df.id ? "#0a2a4a" : C.bg3,
                     border: `1px solid ${selectedDF === df.id ? df.color : C.border}`,
                     color: selectedDF === df.id ? df.color : C.dim }}>
            <span style={{ fontWeight: "bold" }}>{df.label}</span>
            <span style={{ fontSize: 9, color: C.muted, marginLeft: 8 }}>{df.farRef}</span>
          </button>
        ))}
      </div>

      {secHead("COMMON FIELDS")}
      {lbl("Requirement Title")}
      <input style={inp} value={fields.reqTitle} onChange={e => set("reqTitle", e.target.value)} />
      {lbl("Center")}
      <input style={inp} value={fields.center} onChange={e => set("center", e.target.value)} />
      {lbl("Estimated Value")}
      <input style={inp} value={fields.value} onChange={e => set("value", e.target.value)} placeholder="e.g., $2,500,000" />

      {specificFields()}

      {lbl("Contracting Officer")}
      <input style={inp} value={fields.coName} onChange={e => set("coName", e.target.value)} />
      {lbl("Date")}
      <input style={inp} type="date" value={fields.coDate} onChange={e => set("coDate", e.target.value)} />
    </>
  );

  return <TwoPane leftContent={leftContent} text={text} panelLabel={`D&F — ${dfType?.label} (${dfType?.farRef})`} onSave={onGenerated} />;
}

function buildDFText(type, f, intake) {
  const fmt = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[DATE]";
  const v = f.value || (intake?.value ? "$" + parseFloat(intake.value).toLocaleString() : "[VALUE]");
  const t2 = f.reqTitle || intake?.reqTitle || "[REQUIREMENT]";
  const c = f.center || intake?.center || "[CENTER]";

  const header = (title, farRef) =>
    `DETERMINATION AND FINDINGS\n${title}\n${farRef}\n${"═".repeat(70)}\n\n` +
    `Requirement: ${t2}\nCenter:      ${c}\nValue:       ${v}\n\n`;

  switch (type) {
    case "TM":
      return header("TIME-AND-MATERIAL / LABOR-HOUR CONTRACT", "FAR 16.601(d)") +
        `FINDINGS\n\n` +
        `1.  The Government is unable to accurately estimate the extent or duration of work ` +
        `or anticipate costs with reasonable certainty. The requirement involves ${t2} ` +
        `for which the level of effort and specific tasks cannot be precisely defined in advance.\n\n` +
        `2.  Rationale for T&M/LH type:\n\n${f.tmRationale || "[RATIONALE]"}\n\n` +
        `3.  The following surveillance will be performed to ensure efficient performance:\n\n${f.tmSurveillance}\n\n` +
        `DETERMINATION\n\nBased on the foregoing, I determine that:\n\n` +
        `(a) No other contract type is suitable;\n` +
        `(b) The contract includes a ceiling price of ${f.tmCeiling || "[CEILING PRICE]"} that the contractor shall not exceed; and\n` +
        `(c) Adequate Government surveillance will be imposed per FAR 16.601(d)(2).\n\n` +
        `${"─".repeat(70)}\n\n${"_".repeat(40)}\n${f.coName || "[CO]"}\nContracting Officer\nDate: ${fmt(f.coDate)}\n`;

    case "OPTIONS_5YR":
      return header("OPTIONS EXCEEDING 5 YEARS", "FAR 17.204(e)") +
        `FINDINGS\n\n` +
        `The proposed contract will include option periods totaling ${f.optionYears || "[X]"} years, ` +
        `exceeding the 5-year limitation in FAR 17.204(e). The following justification supports ` +
        `a longer period:\n\n${f.optionRationale || "[RATIONALE]"}\n\n` +
        `DETERMINATION\n\nI determine that a contract period including options exceeding 5 years is in ` +
        `the Government's best interest for the reasons stated above, and is consistent with FAR 17.204(e).\n\n` +
        `${"─".repeat(70)}\n\n${"_".repeat(40)}\n${f.coName || "[CO]"}\nContracting Officer\nDate: ${fmt(f.coDate)}\n`;

    case "NONCOMMERCIAL":
      return header("USE OF OTHER THAN COMMERCIAL ITEMS", "FAR 11.703") +
        `FINDINGS\n\n` +
        `The contracting officer has reviewed the requirement for ${t2} and has determined ` +
        `that the items or services do not meet the definition of commercial items under FAR 2.101 ` +
        `for the following reasons:\n\n${f.commercialReason || "[BASIS FOR NON-COMMERCIAL DETERMINATION]"}\n\n` +
        `DETERMINATION\n\nI determine that the use of other than commercial items procedures is justified ` +
        `for this acquisition per FAR 11.703.\n\n` +
        `${"─".repeat(70)}\n\n${"_".repeat(40)}\n${f.coName || "[CO]"}\nContracting Officer\nDate: ${fmt(f.coDate)}\n`;

    case "BUNDLING":
      return header("CONTRACT BUNDLING", "FAR 7.107-2") +
        `FINDINGS\n\n` +
        `1.  This acquisition consolidates requirements previously fulfilled by two or more ` +
        `separate contracts into a single contract that may be unsuitable for award to a small ` +
        `business concern.\n\n` +
        `2.  The following measurable benefits are expected to substantially exceed the ` +
        `benefits that would be derived from awarding separate contracts:\n\n${f.bundlingBenefits || "[BENEFITS]"}\n\n` +
        `3.  Impact on small business:\n${f.sbImpact || "Assessed — see mitigation measures below."}\n\n` +
        `4.  Mitigation measures:\n${f.sbMitigation || "[MITIGATION MEASURES]"}\n\n` +
        `DETERMINATION\n\nI determine that the benefits of bundling substantially exceed the benefits ` +
        `of awarding separate contracts, and that the bundling is justified per FAR 7.107-2.\n\n` +
        `${"─".repeat(70)}\n\n${"_".repeat(40)}\n${f.coName || "[CO]"}\nContracting Officer\nDate: ${fmt(f.coDate)}\n`;

    case "CONSOLIDATION":
      return header("CONSOLIDATION OF CONTRACT REQUIREMENTS", "FAR 7.107-4") +
        `FINDINGS\n\n` +
        `This acquisition consolidates requirements previously performed under separate contracts. ` +
        `The following benefits support consolidation:\n\n${f.bundlingBenefits || "[BENEFITS]"}\n\n` +
        `Impact on small business:\n${f.sbImpact || "Assessed."}\n\n` +
        `DETERMINATION\n\nI determine that the consolidation of requirements is necessary and justified ` +
        `per FAR 7.107-4 and does not unduly restrict small business participation.\n\n` +
        `${"─".repeat(70)}\n\n${"_".repeat(40)}\n${f.coName || "[CO]"}\nContracting Officer\nDate: ${fmt(f.coDate)}\n`;

    case "URGENCY":
      return header("UNUSUAL AND COMPELLING URGENCY", "FAR 6.302-2(b)") +
        `AUTHORITY: 10 U.S.C. 3204(a)(2) / 41 U.S.C. 3304(a)(2)\n\n` +
        `FINDINGS\n\n` +
        `1.  The following facts and circumstances create an unusual and compelling urgency:\n\n${f.urgencyFacts || "[URGENCY FACTS]"}\n\n` +
        `2.  Delay in award would seriously injure the Government because:\n\n${f.urgencyTimeline || "[TIMELINE ANALYSIS]"}\n\n` +
        `3.  The Government's need for the supplies or services is so urgent that permitting ` +
        `the Government to solicit and evaluate competitive proposals would seriously injure ` +
        `the Government.\n\n` +
        `4.  The Government will solicit offers from as many potential sources as is practicable.\n\n` +
        `DETERMINATION\n\nBased on the above findings, I determine that compelling and unusual urgency ` +
        `exists for this acquisition and that the Government would be seriously injured if competition ` +
        `were required per FAR 6.302-2.\n\n` +
        `${"─".repeat(70)}\n\n${"_".repeat(40)}\n${f.coName || "[CO]"}\nContracting Officer\nDate: ${fmt(f.coDate)}\n`;

    default: return "";
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMBINED COMPLIANCE TOOLS COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ComplianceTools({ intake, onSaved }) {
  const [tab, setTab] = useState("RESPONSIBILITY");

  function save(text, docType) {
    const sk = "cpas_docs_" + (intake?.reqTitle || "x");
    try {
      const ex = JSON.parse(localStorage.getItem(sk) || "[]");
      localStorage.setItem(sk, JSON.stringify([
        ...ex.filter(d => d.docType !== docType),
        { docType, label: docType.replace(/_/g, " "), content: text, ts: Date.now() }
      ]));
    } catch(e) {}
    onSaved && onSaved(docType);
    alert(`${docType.replace(/_/g, " ")} saved to NEAR package.`);
  }

  const tabs = [
    { id: "RESPONSIBILITY", label: "Responsibility Det.",  color: C.green  },
    { id: "CLOSEOUT",       label: "Closeout Checklist",  color: C.blue   },
    { id: "DF",             label: "D&F Templates",       color: C.yellow },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text, background: C.bg }}>
      <div style={{ display: "flex", gap: 2, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "6px 16px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: "bold",
                     background: tab === t.id ? "#0a2a4a" : C.bg3,
                     border: `1px solid ${tab === t.id ? t.color : C.border}`,
                     color: tab === t.id ? t.color : C.dim }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "RESPONSIBILITY" && <ResponsibilityDetermination intake={intake} onGenerated={t => save(t, "RESPONSIBILITY")} />}
      {tab === "CLOSEOUT"       && <ContractCloseout intake={intake} onGenerated={t => save(t, "CLOSEOUT")} />}
      {tab === "DF"             && <DFTemplates intake={intake} onGenerated={t => save(t, "DF_" + new Date().getTime())} />}
    </div>
  );
}
