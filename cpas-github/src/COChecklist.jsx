import { useState, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────
// CO CHECKLIST — Batch 7
// Context-sensitive, persistent, citation-linked
// ─────────────────────────────────────────────────────────────

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const PHASES = [
  { id:"P1", label:"Package Preparation",   icon:"📋" },
  { id:"P2", label:"Competition & Planning", icon:"⚖️" },
  { id:"P3", label:"Pre-Solicitation",       icon:"📢" },
  { id:"P4", label:"Solicitation",           icon:"📨" },
  { id:"P5", label:"Pre-Award Review",       icon:"🔍" },
  { id:"P6", label:"Evaluation & Selection", icon:"✅" },
  { id:"P7", label:"Award & Post-Award",     icon:"🏆" },
];

// Full checklist — each item has: id, phase, text, citation, applicability, note
const ALL_ITEMS = [
  // P1 — Package Preparation
  { id:"c11",  phase:"P1", text:"Approved purchase requisition in NCMS/SAP", citation:"NFS 1804.7301(a); PCD 25-21", app:"All actions obligating funding" },
  { id:"c12",  phase:"P1", text:"Requisition includes complete SOW/PWS or SOO", citation:"FAR 11.101; NFS CG 1811", app:"All actions" },
  { id:"c14",  phase:"P1", text:"Approved SOW/PWS attached and technically adequate", citation:"FAR 11.101", app:"All actions" },
  { id:"c15",  phase:"P1", text:"QASP or written determination that QASP is not required", citation:"NFS 1846.408; FAR 46.4", app:"All new contracts for services" },
  { id:"c19",  phase:"P1", text:"Complete, signed, dated IGCE prepared by requiring office", citation:"NFS 1807; NFS CG 1807", app:"All new actions above SAT ($350K)", trigger:"value>350000" },
  { id:"c20",  phase:"P1", text:"IGCE methodology documented (rates, hours, basis of estimate)", citation:"NFS 1807", app:"All new actions above SAT", trigger:"value>350000" },
  { id:"c21",  phase:"P1", text:"Funds availability certification signed by authorized official", citation:"FAR 32.702", app:"All actions obligating funding" },
  { id:"c22",  phase:"P1", text:"Inherently governmental function determination documented", citation:"FAR 7.503; NFS CG 1807.51", app:"All new contracts for services" },
  { id:"c23",  phase:"P1", text:"COR nomination package submitted using NF 1634 (Recommendation for Appointment of COR template)", citation:"NFS CG 1801.42; NFS CG Appendix A", app:"All contracts requiring a COR" },
  { id:"c24",  phase:"P1", text:"NF 1707 Special Approvals and Affirmations completed and uploaded to NCMS", citation:"NFS 1804.7301; NFS CG 1804", app:"All new contract actions per PCD 25-21" },
  { id:"c25",  phase:"P1", text:"OCIO Authorization obtained (CITR or ORCA) and documented in NF 1707", citation:"NFS CG 1839.11; NFS CG 1839.12; NFS CG 1839.13", app:"All acquisitions regardless of NAICS code or dollar value" },
  { id:"c26",  phase:"P1", text:"D&F for use of other than commercial items documented (if applicable)", citation:"FAR 12.101; NFS 1812.101", app:"Non-commercial above SAT", trigger:"noncommercial" },

  // P2 — Competition & Planning
  { id:"c30",  phase:"P2", text:"Acquisition plan approved at required level", citation:"NFS CG 1807.11; NFS 1807", app:"All new contracts meeting thresholds" },
  { id:"c31",  phase:"P2", text:"PSM Executive Presentation prepared and approved at required level", citation:"NFS CG 1807.11; NFS CG 1807.14", app:"Actions ≥$10M", trigger:"value>=10000000" },
  { id:"c32",  phase:"P2", text:"Competition strategy decision documented with FAR/RFO FAR basis", citation:"RFO FAR 6.1; FAR 6.101", app:"All actions above SAT" },
  { id:"c33",  phase:"P2", text:"JOFOC/J&A contains all 11 required elements per RFO FAR 6.104-1", citation:"RFO FAR 6.104-1; FAR 6.303-2; PCD 25-10", app:"Sole source above SAT", trigger:"solesource" },
  { id:"c34",  phase:"P2", text:"JOFOC approved at correct dollar-threshold authority level", citation:"RFO FAR 6.104-2; NFS 1806.304", app:"All JOFOC actions", trigger:"solesource" },
  { id:"c35",  phase:"P2", text:"Redacted JOFOC posted to SAM.gov within 14 days after award (RFO eliminated pre-award posting requirement)", citation:"RFO FAR 6.301; RFO FAR 6.104-1", app:"JOFOC actions above SAT", trigger:"solesource" },
  { id:"c37",  phase:"P2", text:"HQ Procurement Analyst input obtained on acquisition strategy (required for ≥$50M)", citation:"NFS CG 1807.12(b)", app:"Actions ≥$50M", trigger:"value>=50000000" },
  { id:"c38",  phase:"P2", text:"Appropriate authority approvals per center delegation matrix", citation:"NFS CG 1801; NASA MDA 5013.01", app:"All actions per authority matrix" },
  { id:"c39",  phase:"P2", text:"NF 1787 Small Business Coordination Package submitted to OSBP Small Business Specialist", citation:"NFS CG 1819.11", app:"Acquisitions >$2M not set aside for small business", trigger:"value>2000000" },
  { id:"c40",  phase:"P2", text:"Rule of Two analysis documented — set aside or documented rationale for non-set-aside", citation:"FAR 19.104-1; NFS CG 1819.11", app:"All new actions above MPT ($15K)" },

  // P3 — Pre-Solicitation
  { id:"c50",  phase:"P3", text:"Signed and fully coordinated NF 1787 Small Business Coordination Package on file", citation:"NFS CG 1819.11", app:"Acquisitions >$2M not set aside for small business", trigger:"value>2000000" },
  { id:"c51",  phase:"P3", text:"NF 1787A Market Research Report completed and on file", citation:"NFS CG 1810.12", app:"Required for acquisitions >$2M; optional but recommended below $2M", trigger:"value>2000000" },
  { id:"c52",  phase:"P3", text:"Market research is current, documented, and appropriate to the acquisition's size and complexity", citation:"FAR 10.001(b); NFS CG 1810.12", app:"All new awards above SAT" },
  { id:"c53",  phase:"P3", text:"Sources Sought notice posted and responses documented (mandatory for ≥$50M per NFS CG 1805.11)", citation:"FAR 10.001; NFS CG 1805.11", app:"Competitive actions above SAT", trigger:"competitive" },
  { id:"c54",  phase:"P3", text:"SAM.gov pre-solicitation synopsis posted", citation:"FAR 5.201; FAR 5.203", app:"Actions meeting FAR 5.101 threshold" },
  { id:"c55",  phase:"P3", text:"Synopsis meets minimum 15-day public notice requirement", citation:"FAR 5.203", app:"FAR 5.203 actions" },
  { id:"c57",  phase:"P3", text:"Policy Compliance Review (PCR) completed per center procedures", citation:"Center-specific; NFS CG 1801", app:"All actions per center PCR procedures" },
  { id:"c59",  phase:"P3", text:"DCAA coordination complete", citation:"FAR 42.101", app:"Cost-type contracts above $750K", trigger:"costtype" },
  { id:"c60",  phase:"P3", text:"OGC legal review coordination completed and documented per center procedures", citation:"NFS CG 1801; HQ CAM Appendix B", app:"As required by center procedures and HQ CAM approval thresholds" },
  { id:"c61",  phase:"P3", text:"HQ Public Announcement prepared and submitted", citation:"NFS 1805.302; NFS CG 1805.31", app:"Actions ≥$7M", trigger:"value>=7000000" },
  { id:"c62",  phase:"P3", text:"ANOSCA submitted via NPA template to HQ Procurement Analyst", citation:"NFS CG 1805.32; PIC 26-01", app:"Actions ≥$30M", trigger:"value>=30000000" },
  { id:"c63",  phase:"P3", text:"DRFP Cover Letter prepared and PSM minutes approved before Draft RFP release", citation:"NFS CG 1807.13(d); NFS CG 1815.1", app:"All actions requiring a Draft RFP", trigger:"competitive" },

  // P4 — Solicitation
  { id:"c70",  phase:"P4", text:"Solicitation conforms to applicable FAR/NFS/RFO FAR requirements", citation:"RFO FAR Part 1; NFS Part 1812", app:"All competitive solicitations" },
  { id:"c71",  phase:"P4", text:"Correct contract type clauses included per clause matrix", citation:"NFS 1812.301; PCD 25-23; FAC 2025-06", app:"All solicitations" },
  { id:"c72",  phase:"P4", text:"Section L instructions clear and tied to Section M evaluation factors", citation:"FAR 15.203", app:"FAR Part 15 solicitations" },
  { id:"c73",  phase:"P4", text:"Section M evaluation factors and relative weights documented", citation:"FAR 15.304", app:"FAR Part 15 solicitations" },
  { id:"c74",  phase:"P4", text:"CLIN structure complete with unit prices and option CLINs", citation:"FAR 16.505; DFARS 204.71", app:"All solicitations" },
  { id:"c75",  phase:"P4", text:"Wage Determination incorporated (if SCA applies)", citation:"FAR 22.1002; NFS 1822", app:"Service contracts covered by SCA" },
  { id:"c76",  phase:"P4", text:"Solicitation posted to SAM.gov with correct NAICS/PSC codes", citation:"FAR 5.102; FAR 4.601", app:"All competitive solicitations" },
  { id:"c78",  phase:"P4", text:"Contractor reps and certs required and current in SAM.gov", citation:"FAR 4.1201; FAR 52.204-8", app:"All solicitations" },

  // P5 — Pre-Award Review
  { id:"c54b", phase:"P5", text:"Responsibility/non-responsibility determination documented", citation:"FAR 9.105-1; NFS 1809.105", app:"All new awards above SAT" },
  { id:"c66",  phase:"P5", text:"Personal services determination documented", citation:"FAR 37.104; NFS CG 1837", app:"All new contracts for services" },
  { id:"c67",  phase:"P5", text:"Waivers or deviations from standard clauses documented", citation:"FAR 1.403; NFS 1801.403", app:"When waiver or deviation approved" },
  { id:"c68",  phase:"P5", text:"ICT accessibility compliance determination on file (Accessibility Conformance Report or exception documented)", citation:"FAR 39.104-2; NFS CG 1839.14", app:"All acquisitions of ICT supplies or services" },
  { id:"c69",  phase:"P5", text:"SAM.gov exclusion/debarment check performed and documented", citation:"FAR 9.405; FAR 52.209-6", app:"All new awards" },
  { id:"c80",  phase:"P5", text:"All NEAR file elements organized per NFS contract file requirements", citation:"NFS CG 1804.13; PCD 25-21", app:"All actions" },

  // P6 — Evaluation & Selection
  { id:"c99",  phase:"P6", text:"All proposals, revisions, and attachments received and logged", citation:"FAR 15.208", app:"All actions requiring proposals" },
  { id:"c100", phase:"P6", text:"Proprietary/source selection information properly marked and controlled", citation:"FAR 3.104; FAR 15.207", app:"Competitive contracts" },
  { id:"c104", phase:"P6", text:"SAM exclusion check performed and dated after proposal receipt", citation:"FAR 9.405", app:"All actions requiring proposals" },
  { id:"c112", phase:"P6", text:"Complete, signed, dated technical evaluation report in file", citation:"FAR 15.305", app:"All actions requiring technical input" },
  { id:"c113", phase:"P6", text:"Price analysis or cost analysis documented", citation:"FAR 15.404-1", app:"All actions above SAT" },
  { id:"c114", phase:"P6", text:"PNM documents price negotiation and fair/reasonable determination", citation:"FAR 15.406-3; NFS CG 1815", app:"All negotiated actions above SAT" },
  { id:"c115", phase:"P6", text:"Best value tradeoff decision documented", citation:"FAR 15.101-1", app:"FAR Part 15 best value competitions" },
  { id:"c116", phase:"P6", text:"Source selection decision document signed by SSA", citation:"FAR 15.308", app:"FAR Part 15 competitive actions" },

  // P7 — Award & Post-Award
  { id:"c168", phase:"P7", text:"Signed copy of award/agreement in contract file", citation:"FAR 4.803", app:"All actions" },
  { id:"c171", phase:"P7", text:"Effective date and PoP start on or after signature date", citation:"FAR 4.102", app:"All actions except approved advance agreements" },
  { id:"c172", phase:"P7", text:"FPDS-NG Contract Action Report submitted within 3 business days after award", citation:"FAR 4.301(f)(2)(ii)", app:"All actions" },
  { id:"c173", phase:"P7", text:"NASA Notification of Procurement Action (NPA) submitted to HQ (actions ≥$7M)", citation:"NFS 1805.302; NFS CG 1805.32; PIC 26-01", app:"Actions ≥$7M", trigger:"value>=7000000" },
  { id:"c174", phase:"P7", text:"NEAR filing complete with all required file elements", citation:"NFS CG 1804.13; PCD 25-21", app:"All actions" },
  { id:"c179", phase:"P7", text:"Contract Action Report (CAR) approved within 3 business days and uploaded", citation:"NFS 1804.7301; PCD 25-21", app:"All actions" },
  { id:"c185", phase:"P7", text:"SAM.gov award notice posted per FAR 5.301 (>$25K if WTO GPA/FTA or likely subcontracting)", citation:"FAR 5.301; FAR 5.302", app:"Contract actions meeting FAR 5.301 threshold" },
  { id:"c186", phase:"P7", text:"NF 1634 COR Delegation signed, filed, and copies distributed to COR, contractor, and contract admin office", citation:"NFS CG 1801.42(h); NFS CG Appendix A", app:"All contracts requiring a COR" },
  { id:"c187", phase:"P7", text:"Postaward conference held and Postaward Conference Report completed (required for contracts >$10M; good practice for all)", citation:"NFS CG 1842.32; NFS CG Appendix A", app:"Required: contracts >$10M, or at/near NASA installation, or complex management. Recommended: all new contracts" },
  { id:"c188", phase:"P7", text:"QASP finalized and provided to COR and contractor", citation:"NFS 1846.408", app:"All new service contracts" },
  { id:"c189", phase:"P7", text:"Supply Chain Visibility (SCV) Reporting DRD incorporated and COR delegated SCV duties on NF 1634", citation:"NFS CG 1846.701", app:"Contracts/orders ≥$20M (including options) for products/services under NPR 7120.5 programs", trigger:"value>=20000000" },
  { id:"c197", phase:"P7", text:"Contractor performance evaluation entered in CPARS (required above SAT per FAR 42.1102)", citation:"FAR 42.1102; FAR 42.1103", app:"Contracts exceeding SAT ($350K)" },
];

// Determine which items apply given intake parameters
function getApplicableItems(intake) {
  const value = intake?.value || 0;
  const isSole = intake?.competitionStrategy === "SOLE_SOURCE";
  const isCommercial = intake?.isCommercial === "YES";
  const contractType = intake?.contractType || "";
  const isCostType = ["CPFF","CPAF","CPIF","CP_NO_FEE","T&M","LH"].includes(contractType);
  const isCompetitive = !isSole;

  return ALL_ITEMS.filter(item => {
    const t = item.trigger;
    if (!t) return true;
    if (t === "solesource" && !isSole) return false;
    if (t === "competitive" && !isCompetitive) return false;
    if (t === "noncommercial" && isCommercial) return false;
    if (t === "costtype" && !isCostType) return false;
    if (t === "it") return false; // show only when IT is flagged — default hide
    if (t.startsWith("value>") && !t.includes("=")) {
      const threshold = parseInt(t.replace("value>",""));
      if (value <= threshold) return false;
    }
    if (t.startsWith("value>=")) {
      const threshold = parseInt(t.replace("value>=",""));
      if (value < threshold) return false;
    }
    if (t.includes("|")) {
      const parts = t.split("|");
      const anyMatch = parts.some(p => {
        if (p === "solesource") return isSole;
        if (p.startsWith("value>")) return value > parseInt(p.replace("value>",""));
        return false;
      });
      if (!anyMatch) return false;
    }
    if (t.includes("&")) {
      const parts = t.split("&");
      const allMatch = parts.every(p => {
        if (p === "competitive") return isCompetitive;
        if (p.startsWith("value>")) return value > parseInt(p.replace("value>",""));
        return true;
      });
      if (!allMatch) return false;
    }
    return true;
  });
}

export default function COChecklist({ intake, onClose }) {
  const storageKey = `cpas_checklist_${intake?.reqTitle || "default"}`;

  const [checked, setChecked] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")); }
    catch { return new Set(); }
  });
  const [activePhase, setActivePhase] = useState("P1");
  const [filterMode, setFilterMode] = useState("all"); // all | incomplete | complete

  const items = useMemo(() => getApplicableItems(intake), [intake]);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...checked]));
  }, [checked, storageKey]);

  function toggle(id) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const phaseItems = (phaseId) => items.filter(i => i.phase === phaseId);

  const phaseProgress = (phaseId) => {
    const pi = phaseItems(phaseId);
    const done = pi.filter(i => checked.has(i.id)).length;
    return { done, total: pi.length, pct: pi.length ? Math.round((done / pi.length) * 100) : 0 };
  };

  const overall = {
    done: items.filter(i => checked.has(i.id)).length,
    total: items.length,
  };
  const overallPct = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;

  const visibleItems = phaseItems(activePhase).filter(item => {
    if (filterMode === "complete") return checked.has(item.id);
    if (filterMode === "incomplete") return !checked.has(item.id);
    return true;
  });

  const C = {
    navy: "#0B3D91", blue: "#1a5aaa", light: "#f0f4ff",
    green: "#2db87a", greenBg: "#f0faf5",
    border: "#dde3ef", muted: "#8896b0", text: "#1a2332",
    bg: "#fff", bg2: "#f8f9fc",
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(10,20,40,0.5)",
      zIndex:900, display:"flex", alignItems:"flex-start", justifyContent:"center",
      paddingTop:40, overflow:"auto",
    }}>
      <div style={{
        background:C.bg, borderRadius:12, width:"min(960px, 96vw)",
        maxHeight:"88vh", display:"flex", flexDirection:"column",
        boxShadow:"0 20px 60px rgba(11,61,145,0.2)",
        fontFamily:FONT,
      }}>
        {/* Header */}
        <div style={{
          padding:"20px 24px 16px", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          background:"linear-gradient(135deg, #f0f4ff 0%, #fff 100%)",
          borderRadius:"12px 12px 0 0",
        }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{
                background:C.navy, color:"#fff", borderRadius:6,
                padding:"4px 10px", fontSize:10, fontWeight:600, letterSpacing:"1px",
              }}>CO CHECKLIST</div>
              <div style={{ fontSize:12, color:C.muted }}>Batch 7 — Context-Sensitive</div>
            </div>
            {intake?.reqTitle && (
              <div style={{ fontSize:13, color:C.text, fontWeight:500, marginTop:6 }}>
                {intake.reqTitle}
              </div>
            )}
            {intake?.value && (
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                ${(intake.value/1000000).toFixed(1)}M · {intake.contractType} · {intake.competitionStrategy?.replace("_"," ")} · {intake.center}
              </div>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* Overall progress */}
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:700, color: overallPct === 100 ? C.green : C.navy }}>
                {overallPct}%
              </div>
              <div style={{ fontSize:10, color:C.muted }}>{overall.done} / {overall.total} items</div>
              <div style={{ marginTop:4, width:80, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:`${overallPct}%`, height:"100%", background: overallPct === 100 ? C.green : C.navy, borderRadius:2, transition:"width 0.3s" }}/>
              </div>
            </div>
            <button onClick={onClose} style={{
              background:"none", border:"none", fontSize:20,
              cursor:"pointer", color:C.muted, padding:"4px 8px",
            }}>×</button>
          </div>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {/* Phase sidebar */}
          <div style={{
            width:200, borderRight:`1px solid ${C.border}`, padding:"12px 0",
            overflowY:"auto", flexShrink:0, background:C.bg2,
          }}>
            {PHASES.map(ph => {
              const { done, total, pct } = phaseProgress(ph.id);
              const isActive = activePhase === ph.id;
              return (
                <button key={ph.id} onClick={() => setActivePhase(ph.id)} style={{
                  display:"block", width:"100%", padding:"10px 14px",
                  background: isActive ? C.light : "none",
                  border:"none", borderLeft:`3px solid ${isActive ? C.navy : "transparent"}`,
                  cursor:"pointer", textAlign:"left",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:11, fontWeight: isActive ? 600 : 400, color: isActive ? C.navy : C.text }}>
                      {ph.icon} {ph.label}
                    </div>
                    <div style={{ fontSize:10, color: pct === 100 ? C.green : C.muted, fontWeight:500 }}>
                      {pct === 100 ? "✓" : `${done}/${total}`}
                    </div>
                  </div>
                  {/* Phase mini progress bar */}
                  <div style={{ marginTop:4, height:2, background:C.border, borderRadius:1, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background: pct === 100 ? C.green : C.navy, transition:"width 0.3s" }}/>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Checklist items */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
            {/* Phase header + filter */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>
                  {PHASES.find(p => p.id === activePhase)?.icon} {PHASES.find(p => p.id === activePhase)?.label}
                </div>
                <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                  {phaseProgress(activePhase).done} of {phaseProgress(activePhase).total} items complete
                </div>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {["all","incomplete","complete"].map(f => (
                  <button key={f} onClick={() => setFilterMode(f)} style={{
                    padding:"4px 10px", borderRadius:5, fontSize:11, cursor:"pointer",
                    background: filterMode === f ? C.navy : C.bg2,
                    color: filterMode === f ? "#fff" : C.muted,
                    border: `1px solid ${filterMode === f ? C.navy : C.border}`,
                    fontFamily: FONT,
                  }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>

            {visibleItems.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted, fontSize:13 }}>
                {filterMode === "complete" ? "No completed items in this phase yet." : filterMode === "incomplete" ? "All items in this phase are complete. ✓" : "No applicable items for this acquisition type."}
              </div>
            )}

            {visibleItems.map(item => {
              const isDone = checked.has(item.id);
              return (
                <div key={item.id} onClick={() => toggle(item.id)} style={{
                  display:"flex", gap:12, alignItems:"flex-start",
                  padding:"12px 14px", marginBottom:6, borderRadius:8, cursor:"pointer",
                  background: isDone ? C.greenBg : C.bg2,
                  border: `1px solid ${isDone ? "#b8e8d0" : C.border}`,
                  transition:"all 0.15s",
                }}
                  onMouseEnter={e => { if (!isDone) e.currentTarget.style.background = C.light; e.currentTarget.style.borderColor = C.blue; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isDone ? C.greenBg : C.bg2; e.currentTarget.style.borderColor = isDone ? "#b8e8d0" : C.border; }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1,
                    border: `2px solid ${isDone ? C.green : C.muted}`,
                    background: isDone ? C.green : "#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.15s",
                  }}>
                    {isDone && <span style={{ color:"#fff", fontSize:11, lineHeight:1 }}>✓</span>}
                  </div>

                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color: isDone ? "#2a7a55" : C.text, fontWeight: isDone ? 400 : 500, textDecoration: isDone ? "line-through" : "none", lineHeight:1.4 }}>
                      {item.text}
                    </div>
                    <div style={{ display:"flex", gap:10, marginTop:5, flexWrap:"wrap" }}>
                      <span style={{
                        fontSize:10, color: isDone ? "#4a9a75" : C.blue,
                        background: isDone ? "#d4f0e4" : "#e8f0fe",
                        padding:"2px 7px", borderRadius:10, letterSpacing:"0.2px",
                      }}>{item.citation}</span>
                      <span style={{ fontSize:10, color:C.muted }}>{item.app}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Phase complete banner */}
            {phaseProgress(activePhase).pct === 100 && phaseItems(activePhase).length > 0 && (
              <div style={{
                marginTop:16, padding:"12px 16px", borderRadius:8,
                background:"linear-gradient(135deg, #d4f0e4, #e8f8f0)",
                border:"1px solid #b8e8d0", textAlign:"center",
                fontSize:13, color:"#2a7a55", fontWeight:500,
              }}>
                ✓ All {PHASES.find(p => p.id === activePhase)?.label} items complete
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:"12px 20px", borderTop:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:C.bg2, borderRadius:"0 0 12px 12px",
        }}>
          <div style={{ fontSize:11, color:C.muted }}>
            Click any item to mark complete. State persists for this acquisition. Advisory only — CO judgment governs.
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => {
              if (window.confirm("Reset all checklist items for this acquisition?")) {
                setChecked(new Set());
              }
            }} style={{
              padding:"6px 14px", borderRadius:6, fontSize:12, cursor:"pointer",
              background:"none", border:`1px solid ${C.border}`, color:C.muted,
              fontFamily:FONT,
            }}>Reset</button>
            <button onClick={onClose} style={{
              padding:"6px 16px", borderRadius:6, fontSize:12, cursor:"pointer",
              background:C.navy, color:"#fff", border:"none",
              fontFamily:FONT,
            }}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
