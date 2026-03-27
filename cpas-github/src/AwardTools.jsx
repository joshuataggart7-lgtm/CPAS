// CPAS Price Analysis & Award Tools
// - Structured PNM (FAR 15.406-3)
// - Price Analysis Worksheet (FAR 15.404-1)
// - Option Exercise Workflow
// - FPDS-NG Required Fields Checklist

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
const sectionHead = (t, color = C.blue) => (
  <div style={{ fontSize: 10, color, fontWeight: "bold", marginTop: 14, marginBottom: 4, letterSpacing: 1 }}>{t}</div>
);

// ═══════════════════════════════════════════════════════════════════
// PRICE ANALYSIS WORKSHEET (FAR 15.404-1)
// ═══════════════════════════════════════════════════════════════════

const PRICE_ANALYSIS_METHODS = [
  { id: "COMP_PRICE",    label: "Comparison of competitive prices received (FAR 15.404-1(b)(2)(i))" },
  { id: "PRIOR",         label: "Comparison with prior prices paid for same/similar items (FAR 15.404-1(b)(2)(ii))" },
  { id: "CATALOG",       label: "Comparison with published price lists or catalog prices (FAR 15.404-1(b)(2)(iii))" },
  { id: "PARAMETRIC",    label: "Parametric estimates / cost estimating relationships (FAR 15.404-1(b)(2)(iv))" },
  { id: "IGE",           label: "Comparison to independent government cost estimate (FAR 15.404-1(b)(2)(v))" },
  { id: "MARKET",        label: "Commercial market research (FAR 15.404-1(b)(2)(vi))" },
  { id: "VALUE_ANALYSIS",label: "Value analysis (FAR 15.404-1(b)(2)(vii))" },
];

const COST_ANALYSIS_METHODS = [
  { id: "AUDIT",      label: "DCAA audit of proposed costs" },
  { id: "CO_REVIEW",  label: "CO/ACO technical/cost analysis" },
  { id: "FIELD_PRICE",label: "Field pricing support" },
  { id: "PRENEGOTIATION", label: "Pre-negotiation objective established" },
];

export function PriceAnalysisWorksheet({ intake, onGenerated }) {
  const [p, setP] = useState({
    contractorName:   "",
    solNumber:        intake?.solNumber || "",
    reqTitle:         intake?.reqTitle  || "",
    isCommercial:     intake?.isCommercial === "YES",
    isCostType:       ["CPFF","CPAF","CPIF"].includes(intake?.contractType),
    proposedPrice:    "",
    negotiatedPrice:  "",
    igeAmount:        "",
    priorContractNum: "",
    priorPrice:       "",
    priorDate:        "",
    catalogPrice:     "",
    catalogSource:    "",
    selectedMethods:  ["IGE"],
    costAnalysisMethods: [],
    technicalAnalysis: "",
    profitFee:        "",
    profitBasis:      "",
    fairReasonableDetermination: "",
    priceReductionAmount: "",
    priceReductionBasis:  "",
    marketConditions: "",
    coName:           intake?.coName   || "",
    coDate:           "",
  });
  const set = (k, v) => setP(pp => ({ ...pp, [k]: v }));
  const toggle = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const proposed = parseFloat(p.proposedPrice?.replace(/[$,]/g,"")) || 0;
  const negotiated = parseFloat(p.negotiatedPrice?.replace(/[$,]/g,"")) || 0;
  const savings = proposed - negotiated;
  const savingsPct = proposed > 0 ? ((savings / proposed) * 100).toFixed(1) : "0.0";

  const text = useMemo(() => buildPriceAnalysisText(p, intake), [p, intake]);

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", minHeight: 520 }}>
        <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "72vh" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>PRICE ANALYSIS WORKSHEET — FAR 15.404-1</div>

          {sectionHead("ACQUISITION INFORMATION")}
          {lbl("Contractor/Offeror Name", true)}
          <input style={inp} value={p.contractorName} onChange={e => set("contractorName", e.target.value)} />
          {lbl("Solicitation/Contract No.")}
          <input style={inp} value={p.solNumber} onChange={e => set("solNumber", e.target.value)} />
          {lbl("Requirement Title")}
          <input style={inp} value={p.reqTitle} onChange={e => set("reqTitle", e.target.value)} />

          {sectionHead("PRICE DATA")}
          {lbl("Proposed/Offered Price ($)", true)}
          <input style={inp} value={p.proposedPrice} onChange={e => set("proposedPrice", e.target.value)} placeholder="e.g., 1,250,000" />
          {lbl("Negotiated/Award Price ($)")}
          <input style={inp} value={p.negotiatedPrice} onChange={e => set("negotiatedPrice", e.target.value)} placeholder="e.g., 1,175,000" />
          {lbl("IGCE Amount ($)")}
          <input style={inp} value={p.igeAmount} onChange={e => set("igeAmount", e.target.value)} />

          {savings > 0 && (
            <div style={{ background: "#041a0e", border: "1px solid #1a6a3a", borderRadius: 3, padding: "8px 10px", marginTop: 6 }}>
              <div style={{ fontSize: 9, color: C.muted }}>PRICE REDUCTION</div>
              <div style={{ fontSize: 13, color: C.green, fontWeight: "bold" }}>
                ${savings.toLocaleString("en-US",{minimumFractionDigits:2})} ({savingsPct}%)
              </div>
            </div>
          )}

          {sectionHead("PRICE ANALYSIS METHOD(S) USED")}
          <div style={{ fontSize: 9, color: C.dim, marginBottom: 6 }}>Select all that apply (FAR 15.404-1(b))</div>
          {PRICE_ANALYSIS_METHODS.map(m => (
            <div key={m.id} onClick={() => set("selectedMethods", toggle(p.selectedMethods, m.id))}
              style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"4px 6px", cursor:"pointer",
                       background: p.selectedMethods.includes(m.id) ? "#041a0e" : "transparent",
                       border: `1px solid ${p.selectedMethods.includes(m.id) ? "#1a4a2a" : "transparent"}`,
                       borderRadius:3, marginBottom:3 }}>
              <div style={{ width:12, height:12, border:`1px solid ${p.selectedMethods.includes(m.id)?C.green:"#2a4a6a"}`,
                             borderRadius:2, background:p.selectedMethods.includes(m.id)?C.green:"transparent",
                             flexShrink:0, marginTop:2, display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff" }}>
                {p.selectedMethods.includes(m.id)?"✓":""}
              </div>
              <span style={{ fontSize:9, color:p.selectedMethods.includes(m.id)?C.text:C.dim, lineHeight:1.4 }}>{m.label}</span>
            </div>
          ))}

          {p.selectedMethods.includes("PRIOR") && (<>
            {lbl("Prior Contract Number")}
            <input style={inp} value={p.priorContractNum} onChange={e=>set("priorContractNum",e.target.value)} placeholder="Prior contract PIID" />
            {lbl("Prior Price")}
            <input style={inp} value={p.priorPrice} onChange={e=>set("priorPrice",e.target.value)} />
            {lbl("Prior Contract Date")}
            <input style={inp} value={p.priorDate} onChange={e=>set("priorDate",e.target.value)} placeholder="e.g., March 2024" />
          </>)}

          {p.selectedMethods.includes("CATALOG") && (<>
            {lbl("Catalog/Published Price")}
            <input style={inp} value={p.catalogPrice} onChange={e=>set("catalogPrice",e.target.value)} />
            {lbl("Catalog Source")}
            <input style={inp} value={p.catalogSource} onChange={e=>set("catalogSource",e.target.value)} placeholder="e.g., GSA Advantage, vendor catalog" />
          </>)}

          {p.isCostType && (<>
            {sectionHead("COST ANALYSIS (COST-TYPE CONTRACTS)")}
            {COST_ANALYSIS_METHODS.map(m => (
              <div key={m.id} onClick={() => set("costAnalysisMethods", toggle(p.costAnalysisMethods, m.id))}
                style={{ display:"flex", gap:8, alignItems:"center", padding:"4px 6px", cursor:"pointer", marginBottom:3,
                         background: p.costAnalysisMethods.includes(m.id) ? "#041a0e" : "transparent",
                         border:`1px solid ${p.costAnalysisMethods.includes(m.id)?"#1a4a2a":"transparent"}`, borderRadius:3 }}>
                <div style={{ width:12,height:12,border:`1px solid ${p.costAnalysisMethods.includes(m.id)?C.green:"#2a4a6a"}`,
                               borderRadius:2,background:p.costAnalysisMethods.includes(m.id)?C.green:"transparent",
                               flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff" }}>
                  {p.costAnalysisMethods.includes(m.id)?"✓":""}
                </div>
                <span style={{ fontSize:9, color:C.dim }}>{m.label}</span>
              </div>
            ))}
          </>)}

          {sectionHead("ANALYSIS NARRATIVE")}
          {lbl("Technical Analysis Summary")}
          <textarea style={ta} value={p.technicalAnalysis} rows={3} onChange={e=>set("technicalAnalysis",e.target.value)}
            placeholder="Summarize technical evaluation findings, labor mix assessment, rates review..." />
          {lbl("Profit/Fee Analysis")}
          <textarea style={ta} value={p.profitFee} rows={2} onChange={e=>set("profitFee",e.target.value)}
            placeholder="e.g., 8% fee negotiated (FAR 15.404-4(c) weighted guidelines applied)" />
          {lbl("Price Reduction Basis (if any)")}
          <textarea style={ta} value={p.priceReductionBasis} rows={2} onChange={e=>set("priceReductionBasis",e.target.value)}
            placeholder="Explain basis for any price reduction from proposed..." />
          {lbl("Market Conditions / Other Factors")}
          <textarea style={ta} value={p.marketConditions} rows={2} onChange={e=>set("marketConditions",e.target.value)} />

          {sectionHead("DETERMINATION")}
          {lbl("Fair and Reasonable Determination", true)}
          <textarea style={ta} value={p.fairReasonableDetermination} rows={3} onChange={e=>set("fairReasonableDetermination",e.target.value)}
            placeholder="Based on the analysis above, I determine the price of $[X] to be fair and reasonable because..." />
          {lbl("Contracting Officer")}
          <input style={inp} value={p.coName} onChange={e=>set("coName",e.target.value)} />
          {lbl("Date")}
          <input style={inp} type="date" value={p.coDate} onChange={e=>set("coDate",e.target.value)} />
        </div>

        <div style={{ display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={() => navigator.clipboard.writeText(text)}
              style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
              COPY
            </button>
            <button onClick={() => onGenerated && onGenerated(text, "PRICE_ANALYSIS")}
              style={{ background:"#0a2a1a", border:"1px solid #1a6a3a", color:C.green, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
              SAVE TO PACKAGE
            </button>
            {proposed > 0 && negotiated > 0 && (
              <span style={{ fontSize:10, color: savings > 0 ? C.green : C.yellow, marginLeft:8 }}>
                {savings > 0 ? `↓ $${savings.toLocaleString("en-US",{minimumFractionDigits:0})} saved (${savingsPct}%)` : "No reduction"}
              </span>
            )}
          </div>
          <pre style={{ flex:1, padding:16, fontSize:10, color:C.dim, overflow:"auto", maxHeight:"64vh", whiteSpace:"pre-wrap", lineHeight:1.6, margin:0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildPriceAnalysisText(p, intake) {
  const proposed   = parseFloat(p.proposedPrice?.replace(/[$,]/g,""))  || 0;
  const negotiated = parseFloat(p.negotiatedPrice?.replace(/[$,]/g,"")) || 0;
  const savings    = proposed - negotiated;
  const date       = p.coDate ? new Date(p.coDate+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[DATE]";

  let t = `PRICE ANALYSIS AND PRICE NEGOTIATION MEMORANDUM\n`;
  t += `FAR 15.406-3 / FAR 15.404-1\n`;
  t += `${"═".repeat(70)}\n\n`;

  t += `Requirement:       ${p.reqTitle || intake?.reqTitle || "[REQUIREMENT]"}\n`;
  t += `Solicitation No.:  ${p.solNumber || "[SOL NUMBER]"}\n`;
  t += `Contractor:        ${p.contractorName || "[CONTRACTOR NAME]"}\n`;
  t += `CO:                ${p.coName || intake?.coName || "[CO NAME]"}\n`;
  t += `Date:              ${date}\n\n`;

  t += `${"─".repeat(70)}\n`;
  t += `1.  PRICE SUMMARY\n\n`;
  if (proposed)   t += `    Proposed/Offered Price:   $${proposed.toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
  if (p.igeAmount) t += `    IGCE:                     $${parseFloat(p.igeAmount.replace(/[$,]/g,"")||0).toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
  if (negotiated) t += `    Negotiated/Award Price:   $${negotiated.toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
  if (savings > 0) t += `    Price Reduction:          $${savings.toLocaleString("en-US",{minimumFractionDigits:2})} (${((savings/proposed)*100).toFixed(1)}%)\n`;
  t += `\n`;

  t += `${"─".repeat(70)}\n`;
  t += `2.  PRICE ANALYSIS METHOD(S) — FAR 15.404-1(b)\n\n`;
  const methodNames = {
    COMP_PRICE: "Comparison of competitive prices received",
    PRIOR:      "Comparison with prior prices paid",
    CATALOG:    "Comparison with published catalog/price list",
    PARAMETRIC: "Parametric estimates",
    IGE:        "Comparison to Independent Government Cost Estimate (IGCE)",
    MARKET:     "Commercial market research",
    VALUE_ANALYSIS: "Value analysis",
  };
  p.selectedMethods.forEach(m => {
    t += `    ✓ ${methodNames[m] || m}\n`;
  });
  t += `\n`;

  if (p.selectedMethods.includes("PRIOR") && p.priorContractNum) {
    t += `    Prior Contract Data:\n`;
    t += `    Contract No.: ${p.priorContractNum} | Date: ${p.priorDate || "N/A"} | Price: ${p.priorPrice || "N/A"}\n\n`;
  }

  if (p.selectedMethods.includes("CATALOG") && p.catalogSource) {
    t += `    Catalog/Published Price: ${p.catalogPrice || "N/A"} — Source: ${p.catalogSource}\n\n`;
  }

  if (p.isCostType && p.costAnalysisMethods.length > 0) {
    t += `${"─".repeat(70)}\n`;
    t += `3.  COST ANALYSIS — FAR 15.404-1(c)\n\n`;
    const costNames = {
      AUDIT:          "DCAA audit of proposed costs",
      CO_REVIEW:      "CO/ACO technical and cost analysis",
      FIELD_PRICE:    "Field pricing support",
      PRENEGOTIATION: "Pre-negotiation objective established",
    };
    p.costAnalysisMethods.forEach(m => {
      t += `    ✓ ${costNames[m] || m}\n`;
    });
    t += `\n`;
  }

  const nextSec = p.isCostType ? 4 : 3;

  if (p.technicalAnalysis) {
    t += `${"─".repeat(70)}\n`;
    t += `${nextSec}.  TECHNICAL ANALYSIS\n\n    ${p.technicalAnalysis.replace(/\n/g,"\n    ")}\n\n`;
  }

  if (p.profitFee) {
    t += `${"─".repeat(70)}\n`;
    t += `${nextSec+1}.  PROFIT/FEE ANALYSIS — FAR 15.404-4\n\n    ${p.profitFee.replace(/\n/g,"\n    ")}\n\n`;
  }

  if (p.priceReductionBasis) {
    t += `${"─".repeat(70)}\n`;
    t += `${nextSec+2}.  PRICE NEGOTIATION / REDUCTION\n\n    ${p.priceReductionBasis.replace(/\n/g,"\n    ")}\n\n`;
  }

  if (p.marketConditions) {
    t += `${"─".repeat(70)}\n`;
    t += `${nextSec+3}.  MARKET CONDITIONS AND OTHER FACTORS\n\n    ${p.marketConditions.replace(/\n/g,"\n    ")}\n\n`;
  }

  t += `${"─".repeat(70)}\n`;
  t += `${nextSec+4}.  FAIR AND REASONABLE DETERMINATION — FAR 15.406-3\n\n`;
  t += `    ${p.fairReasonableDetermination || `Based on the price analysis conducted above, I determine the ${negotiated ? "negotiated price of $" + negotiated.toLocaleString("en-US",{minimumFractionDigits:2}) : "proposed price"} to be fair and reasonable.`}\n\n`;

  t += `${"─".repeat(70)}\n\n`;
  t += `${"_".repeat(40)}\n`;
  t += `${p.coName || "[Contracting Officer]"}\n`;
  t += `Contracting Officer\n`;
  t += `Date: ${date}\n`;

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// OPTION EXERCISE WORKFLOW
// ═══════════════════════════════════════════════════════════════════

export function OptionExerciseWorkflow({ intake, onGenerated }) {
  const [step, setStep] = useState(0);
  const [opt, setOpt] = useState({
    piid:            intake?.contractNumber || "",
    modNumber:       "",
    contractorName:  "",
    optionYear:      "1",
    optionClin:      "",
    optionClinTitle: "",
    currentPopEnd:   "",
    newPopStart:     "",
    newPopEnd:       "",
    optionAmount:    "",
    fundCite:        intake?.fundCite || "",
    noticeDate:      "",
    noticeDays:      "60",
    priceReason:     "PRIOR",    // PRIOR, IGE, COMPETITION, MARKET
    priceJustification: "",
    requirementsChanged: false,
    changesDesc:     "",
    governmentInterest: true,
    interestReason:  "Contractor performance has been satisfactory and exercising this option is in the best interest of the Government.",
    coName:          intake?.coName || "",
  });
  const set = (k, v) => setOpt(o => ({ ...o, [k]: v }));

  const optText = useMemo(() => buildOptionExerciseText(opt, intake), [opt, intake]);

  const steps = [
    { id: "BASICS",  label: "Contract Info" },
    { id: "OPTION",  label: "Option Details" },
    { id: "PRICE",   label: "Price & Funds" },
    { id: "D&F",     label: "Determination" },
    { id: "REVIEW",  label: "SF-30 / D&F" },
  ];

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text }}>
      <div style={{ display:"flex", gap:2, padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
        {steps.map((s,i) => (
          <div key={s.id} onClick={() => setStep(i)} style={{
            flex:1, padding:"6px 8px", borderRadius:3, textAlign:"center", cursor:"pointer", fontSize:10,
            background: step===i ? "#0a2a4a" : i<step ? "#041a0e" : C.bg3,
            border:`1px solid ${step===i ? C.blue : i<step ? C.green : C.border}`,
            color: step===i ? C.blue : i<step ? C.green : C.dim,
          }}>
            {i<step?"✓ ":""}{s.label}
          </div>
        ))}
      </div>

      <div style={{ padding:16, overflow:"auto", maxHeight:"60vh" }}>

        {step === 0 && (
          <div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:12 }}>CONTRACT INFORMATION</div>
            {lbl("Contract PIID", true)}
            <input style={inp} value={opt.piid} onChange={e=>set("piid",e.target.value)} placeholder="e.g., 80ARC024C0001" />
            {lbl("Modification Number (for this option exercise)")}
            <input style={inp} value={opt.modNumber} onChange={e=>set("modNumber",e.target.value)} placeholder="e.g., P00003" />
            {lbl("Contractor Name")}
            <input style={inp} value={opt.contractorName} onChange={e=>set("contractorName",e.target.value)} />
            {lbl("Written Notice Date (required per 52.217-9)")}
            <input style={inp} type="date" value={opt.noticeDate} onChange={e=>set("noticeDate",e.target.value)} />
            {lbl("Notice Days Required by Contract")}
            <input style={inp} value={opt.noticeDays} onChange={e=>set("noticeDays",e.target.value)} placeholder="60" />
            <button onClick={()=>setStep(1)} style={{ width:"100%", marginTop:12, background:"#0a2a4a", border:`1px solid ${C.blue}`, color:C.blue, padding:"8px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>NEXT →</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:12 }}>OPTION DETAILS</div>
            {lbl("Option Year Being Exercised")}
            <select style={inp} value={opt.optionYear} onChange={e=>set("optionYear",e.target.value)}>
              {["1","2","3","4","5"].map(y => <option key={y} value={y}>Option Year {y}</option>)}
            </select>
            {lbl("Option CLIN(s)")}
            <input style={inp} value={opt.optionClin} onChange={e=>set("optionClin",e.target.value)} placeholder="e.g., CLINs 1001-1004" />
            {lbl("Option CLIN Title/Description")}
            <input style={inp} value={opt.optionClinTitle} onChange={e=>set("optionClinTitle",e.target.value)} placeholder="e.g., IT Support Services — Option Year 1" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                {lbl("Current PoP End Date")}
                <input style={inp} type="date" value={opt.currentPopEnd} onChange={e=>set("currentPopEnd",e.target.value)} />
              </div>
              <div>
                {lbl("New PoP Start Date")}
                <input style={inp} type="date" value={opt.newPopStart} onChange={e=>set("newPopStart",e.target.value)} />
              </div>
            </div>
            {lbl("New PoP End Date")}
            <input style={inp} type="date" value={opt.newPopEnd} onChange={e=>set("newPopEnd",e.target.value)} />
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
              <div onClick={()=>set("requirementsChanged",!opt.requirementsChanged)}
                style={{ width:13,height:13,border:`1px solid ${opt.requirementsChanged?C.yellow:"#2a4a6a"}`,borderRadius:2,
                         background:opt.requirementsChanged?C.yellow:"transparent",cursor:"pointer",flexShrink:0,
                         display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#000" }}>
                {opt.requirementsChanged?"✓":""}
              </div>
              <span style={{ fontSize:10, color:C.dim }}>Requirements have changed since base award</span>
            </div>
            {opt.requirementsChanged && (<>
              {lbl("Description of Changes")}
              <textarea style={ta} value={opt.changesDesc} rows={2} onChange={e=>set("changesDesc",e.target.value)} />
            </>)}
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={()=>setStep(0)} style={{ flex:1, background:C.bg3, border:`1px solid ${C.border}`, color:C.muted, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11 }}>← BACK</button>
              <button onClick={()=>setStep(2)} style={{ flex:2, background:"#0a2a4a", border:`1px solid ${C.blue}`, color:C.blue, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>NEXT →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:12 }}>PRICE AND FUNDING</div>
            {lbl("Option Price / Amount ($)", true)}
            <input style={inp} value={opt.optionAmount} onChange={e=>set("optionAmount",e.target.value)} placeholder="e.g., 487,500" />
            {lbl("Accounting / Fund Cite")}
            <input style={inp} value={opt.fundCite} onChange={e=>set("fundCite",e.target.value)} />
            {lbl("Price Reasonableness Basis")}
            <select style={inp} value={opt.priceReason} onChange={e=>set("priceReason",e.target.value)}>
              <option value="PRIOR">Option price established at time of original award (FAR 17.207(f))</option>
              <option value="IGE">Comparison to updated IGCE</option>
              <option value="COMPETITION">Competition at time of original award</option>
              <option value="MARKET">Current market research</option>
              <option value="AUDIT">DCAA cost analysis</option>
            </select>
            {lbl("Price Reasonableness Justification")}
            <textarea style={ta} value={opt.priceJustification} rows={3} onChange={e=>set("priceJustification",e.target.value)}
              placeholder="State why the option price is fair and reasonable..." />
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, background:C.bg3, border:`1px solid ${C.border}`, color:C.muted, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11 }}>← BACK</button>
              <button onClick={()=>setStep(3)} style={{ flex:2, background:"#0a2a4a", border:`1px solid ${C.blue}`, color:C.blue, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>NEXT →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:12 }}>D&F — GOVERNMENT INTEREST DETERMINATION (FAR 17.207)</div>
            <div style={{ background:"#08182e", border:"1px solid #1a3a6e", borderRadius:4, padding:"10px 12px", marginBottom:10, fontSize:10, color:C.dim }}>
              FAR 17.207 requires the CO to determine that exercising the option is in the Government's best interest before exercise.
            </div>
            {lbl("Government Interest Determination")}
            <textarea style={ta} value={opt.interestReason} rows={4} onChange={e=>set("interestReason",e.target.value)} />
            {lbl("Contracting Officer")}
            <input style={inp} value={opt.coName} onChange={e=>set("coName",e.target.value)} />
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={()=>setStep(2)} style={{ flex:1, background:C.bg3, border:`1px solid ${C.border}`, color:C.muted, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11 }}>← BACK</button>
              <button onClick={()=>setStep(4)} style={{ flex:2, background:"#0a2a4a", border:`1px solid ${C.blue}`, color:C.blue, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>PREVIEW →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:8 }}>OPTION EXERCISE DOCUMENT</div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <button onClick={() => navigator.clipboard.writeText(optText)}
                style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>COPY</button>
              <button onClick={() => onGenerated && onGenerated(optText, "OPTION_EXERCISE_OY" + opt.optionYear)}
                style={{ background:"#0a2a1a", border:"1px solid #1a6a3a", color:C.green, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>SAVE TO PACKAGE</button>
              <button onClick={()=>setStep(3)} style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.muted, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>← BACK</button>
            </div>
            <pre style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:4, padding:14, fontSize:10, color:C.dim, overflow:"auto", maxHeight:"50vh", whiteSpace:"pre-wrap", lineHeight:1.6 }}>
              {optText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function buildOptionExerciseText(opt, intake) {
  const fmt = d => d ? new Date(d+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[DATE]";
  const v = parseFloat(opt.optionAmount?.replace(/[$,]/g,"")) || 0;

  let t = `OPTION EXERCISE — DETERMINATION AND FINDINGS\n`;
  t += `SF-30 Amendment/Modification of Contract\n`;
  t += `${"═".repeat(70)}\n\n`;
  t += `Contract No.:     ${opt.piid || "[PIID]"}\n`;
  t += `Mod No.:          ${opt.modNumber || "[MOD NUMBER]"}\n`;
  t += `Contractor:       ${opt.contractorName || "[CONTRACTOR]"}\n`;
  t += `Option:           Option Year ${opt.optionYear}`;
  if (opt.optionClin) t += ` (${opt.optionClin})`;
  t += `\n`;
  if (opt.optionClinTitle) t += `                  ${opt.optionClinTitle}\n`;
  t += `Option Amount:    $${v.toLocaleString("en-US",{minimumFractionDigits:2})}\n\n`;

  t += `PERIOD OF PERFORMANCE\n${"─".repeat(40)}\n`;
  t += `Previous End Date: ${fmt(opt.currentPopEnd)}\n`;
  t += `New Start Date:    ${fmt(opt.newPopStart)}\n`;
  t += `New End Date:      ${fmt(opt.newPopEnd)}\n\n`;

  t += `WRITTEN NOTICE\n${"─".repeat(40)}\n`;
  t += `Written notice of intent to exercise this option was provided on ${fmt(opt.noticeDate)}, `;
  t += `within the ${opt.noticeDays || 60}-day notice period required by FAR 52.217-9.\n\n`;

  t += `PRICE REASONABLENESS — FAR 17.207(f)\n${"─".repeat(40)}\n`;
  const priceReasonLabels = {
    PRIOR:       "The option price was established at the time of the original award and is therefore fair and reasonable per FAR 17.207(f).",
    IGE:         "Price is fair and reasonable based on comparison with updated Independent Government Cost Estimate (IGCE).",
    COMPETITION: "Price is fair and reasonable based on competition at time of original award.",
    MARKET:      "Price is fair and reasonable based on current market research.",
    AUDIT:       "Price is fair and reasonable based on DCAA cost analysis.",
  };
  t += `${priceReasonLabels[opt.priceReason] || ""}`;
  if (opt.priceJustification) t += `\n\n${opt.priceJustification}`;
  t += `\n\n`;

  if (opt.requirementsChanged && opt.changesDesc) {
    t += `SCOPE CONSIDERATIONS\n${"─".repeat(40)}\n`;
    t += `Note: The following changes to requirements have occurred since base award:\n${opt.changesDesc}\n\n`;
    t += `These changes are within the general scope of the contract and do not require a new procurement.\n\n`;
  }

  t += `DETERMINATION — FAR 17.207\n${"─".repeat(40)}\n`;
  t += `The Contracting Officer has determined the following:\n\n`;
  t += `(1) Funds are available for this option.\n`;
  t += `(2) The requirement covered by the option is still valid.\n`;
  t += `(3) Exercising the option aligns with the need of the requiring activity.\n`;
  t += `(4) ${opt.interestReason}\n\n`;
  t += `(5) The option was synopsized when the contract was originally awarded, or a synopsis exemption applies.\n\n`;

  t += `FUNDING\n${"─".repeat(40)}\n`;
  t += `Option Amount: $${v.toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
  if (opt.fundCite) t += `Fund Cite: ${opt.fundCite}\n`;
  t += `\n`;

  t += `All other terms and conditions remain unchanged.\n\n`;
  t += `${"─".repeat(70)}\n\n`;
  t += `${"_".repeat(40)}\n`;
  t += `${opt.coName || intake?.coName || "[Contracting Officer]"}\n`;
  t += `Contracting Officer\n`;
  t += `Date: ________________\n`;

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// FPDS-NG REQUIRED FIELDS CHECKLIST
// ═══════════════════════════════════════════════════════════════════

const FPDS_FIELDS = [
  { id:"piid",       label:"Contract/Order PIID",              hint:"Format: agency code + fiscal year + instrument type + sequence", required:true },
  { id:"date",       label:"Award Date",                        hint:"Date CO signed the contract", required:true },
  { id:"effDate",    label:"Effective Date",                    hint:"Date contractor may begin work (often same as award date)", required:true },
  { id:"popStart",   label:"Period of Performance Start",       hint:"", required:true },
  { id:"popEnd",     label:"Period of Performance End",         hint:"Include base and option periods separately", required:true },
  { id:"amount",     label:"Total Obligated Amount",           hint:"Amount obligated on this action", required:true },
  { id:"ceiling",    label:"Ultimate Contract Ceiling",         hint:"Max value including all options", required:false },
  { id:"contractor", label:"Contractor Name",                   hint:"Legal name as registered in SAM.gov", required:true },
  { id:"uei",        label:"Contractor UEI",                    hint:"Unique Entity Identifier (replaced DUNS)", required:true },
  { id:"address",    label:"Contractor Address",                hint:"Physical address from SAM.gov", required:true },
  { id:"naics",      label:"NAICS Code",                        hint:"6-digit NAICS code for principal purpose", required:true },
  { id:"psc",        label:"PSC / FSC Code",                    hint:"4-character product/service code", required:true },
  { id:"placePerf",  label:"Place of Performance",             hint:"City, state, ZIP, country", required:true },
  { id:"contractType",label:"Contract Type",                   hint:"FFP, CPFF, T&M, IDIQ, BPA, etc.", required:true },
  { id:"typeAction", label:"Type of Contract Action",          hint:"New award, order, modification, IDV", required:true },
  { id:"competition",label:"Extent of Competition",            hint:"Full and open, set-aside, sole source, etc.", required:true },
  { id:"setAside",   label:"Type of Set-Aside",                hint:"If set-aside, specify SDVOSB, 8(a), HUBZone, etc.", required:false },
  { id:"solProcedure",label:"Solicitation Procedures",          hint:"Sealed bid, negotiated, simplified, etc.", required:true },
  { id:"evalCriteria",label:"Evaluated Preference",            hint:"None, HUBZone price preference, labor surplus, etc.", required:false },
  { id:"solNumber",  label:"Solicitation/Reference Number",     hint:"RFP or RFQ number", required:false },
  { id:"numberOfOffers",label:"Number of Offers Received",     hint:"Count of responsive offers/quotes", required:true },
  { id:"commercialItem",label:"Commercial Item Acquisition",    hint:"Yes/No per FAR Part 12", required:true },
  { id:"claimantProgram",label:"Claimant Program Code",        hint:"NASA-specific program code", required:false },
  { id:"systemEquipment",label:"System Equipment Code",        hint:"NASA-specific equipment code", required:false },
  { id:"inherentlyGov",label:"Inherently Governmental Functions", hint:"Yes/No — services contract only", required:false },
  { id:"seaTransport",label:"Sea Transportation",               hint:"Yes/No — applies if supplies shipped by sea", required:false },
  { id:"wageRate",   label:"Wage Rate Type",                    hint:"SCA, Davis-Bacon, or N/A", required:false },
  { id:"undefinitized",label:"Undefinitized Action",            hint:"Yes/No — UCA flag", required:false },
  { id:"multiyear",  label:"Multi-Year Contract",               hint:"Yes/No per FAR 17.1", required:false },
  { id:"performanceBased",label:"Performance-Based Service",    hint:"Yes/No — services contract only", required:false },
  { id:"coName",     label:"Contracting Officer Name",         hint:"CO who executed the action", required:true },
  { id:"officeCode", label:"Contracting Office ID",            hint:"NASA ARC procurement office code", required:true },
];

export function FPDSChecklist({ intake, onComplete }) {
  const [values, setValues] = useState(() => {
    const defaults = {};
    FPDS_FIELDS.forEach(f => { defaults[f.id] = ""; });
    // Pre-fill from intake
    return {
      ...defaults,
      naics:        intake?.naics        || "",
      psc:          intake?.psc          || "",
      amount:       intake?.value ? "$" + parseFloat(intake.value).toLocaleString("en-US",{minimumFractionDigits:2}) : "",
      contractType: intake?.contractType || "",
      coName:       intake?.coName       || "",
      commercialItem: intake?.isCommercial === "YES" ? "Yes" : intake?.isCommercial === "NO" ? "No" : "",
      competition:  intake?.competitionStrategy === "FULL_OPEN" ? "Full and Open Competition" :
                    intake?.competitionStrategy === "SOLE_SOURCE" ? "Not Available for Competition (Sole Source)" :
                    intake?.competitionStrategy?.includes("SET_ASIDE") ? "Set Aside" : "",
      placePerf:    intake?.center || "",
    };
  });

  const set = (k, v) => setValues(vv => ({ ...vv, [k]: v }));
  const requiredFields = FPDS_FIELDS.filter(f => f.required);
  const completedRequired = requiredFields.filter(f => values[f.id]?.trim()).length;
  const pct = Math.round((completedRequired / requiredFields.length) * 100);
  const allRequired = completedRequired === requiredFields.length;

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text, padding:16 }}>
      <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:8 }}>FPDS-NG REQUIRED FIELDS — FAR 4.603</div>

      {/* Progress */}
      <div style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:4, padding:"10px 14px", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:10, color:C.muted }}>REQUIRED FIELDS COMPLETE</span>
          <span style={{ fontSize:11, color: allRequired ? C.green : C.yellow, fontWeight:"bold" }}>
            {completedRequired} / {requiredFields.length}
          </span>
        </div>
        <div style={{ height:5, background:"#0a1a3a", borderRadius:3 }}>
          <div style={{ width:`${pct}%`, height:"100%", background: allRequired ? C.green : C.yellow, borderRadius:3, transition:"width .3s" }} />
        </div>
        {allRequired && (
          <div style={{ fontSize:10, color:C.green, marginTop:6 }}>✓ All required fields complete — ready to submit to FPDS</div>
        )}
      </div>

      {/* Fields */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxHeight:"56vh", overflow:"auto" }}>
        {FPDS_FIELDS.map(f => (
          <div key={f.id} style={{ background:C.bg3, border:`1px solid ${f.required && !values[f.id] ? "#4a2a0a" : C.border}`, borderRadius:4, padding:"8px 10px" }}>
            <div style={{ fontSize:9, color: f.required ? C.yellow : C.muted, marginBottom:2 }}>
              {f.required ? "* " : ""}{f.label}
            </div>
            {f.hint && <div style={{ fontSize:8, color:"#3a5a7a", marginBottom:3 }}>{f.hint}</div>}
            <input value={values[f.id]} onChange={e=>set(f.id,e.target.value)}
              style={{ ...inp, padding:"4px 7px", fontSize:10,
                border:`1px solid ${f.required && !values[f.id] ? "#4a3a0a" : "#1a3a6e"}` }} />
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <button onClick={() => {
          const lines = FPDS_FIELDS.filter(f=>values[f.id]).map(f=>`${f.label}: ${values[f.id]}`).join("\n");
          navigator.clipboard.writeText(lines);
        }}
          style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"7px 16px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
          COPY FIELD VALUES
        </button>
        <button onClick={() => onComplete && onComplete(values)}
          style={{ background: allRequired ? "#0a2a1a" : C.bg3, border:`1px solid ${allRequired ? C.green : C.border}`,
                   color: allRequired ? C.green : C.muted, padding:"7px 16px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>
          {allRequired ? "✓ MARK FPDS COMPLETE" : `COMPLETE REQUIRED FIELDS (${requiredFields.length - completedRequired} remaining)`}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMBINED AWARD TOOLS COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AwardTools({ intake, onSaved }) {
  const [tab, setTab] = useState("PNM");

  function save(text, docType) {
    const sk = "cpas_docs_" + (intake?.reqTitle || "x");
    try {
      const ex = JSON.parse(localStorage.getItem(sk) || "[]");
      localStorage.setItem(sk, JSON.stringify([
        ...ex.filter(d => d.docType !== docType),
        { docType, label: docType.replace(/_/g," "), content: text, ts: Date.now() }
      ]));
    } catch(e) {}
    onSaved && onSaved(docType);
    alert(`${docType.replace(/_/g," ")} saved to NEAR package.`);
  }

  const tabs = [
    { id:"PNM",     label:"Price Analysis / PNM",    color:C.blue   },
    { id:"OPTION",  label:"Option Exercise",          color:C.green  },
    { id:"FPDS",    label:"FPDS-NG Checklist",        color:C.yellow },
  ];

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text, background:C.bg }}>
      <div style={{ display:"flex", gap:2, padding:"10px 14px", borderBottom:`1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"6px 16px", borderRadius:3, cursor:"pointer", fontSize:10, fontWeight:"bold",
                     background: tab===t.id ? "#0a2a4a" : C.bg3,
                     border:`1px solid ${tab===t.id ? t.color : C.border}`,
                     color: tab===t.id ? t.color : C.dim }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "PNM"    && <PriceAnalysisWorksheet intake={intake} onGenerated={(text, dt) => save(text, dt || "PNM")} />}
      {tab === "OPTION" && <OptionExerciseWorkflow intake={intake} onGenerated={(text, dt) => save(text, dt || "OPTION_EXERCISE")} />}
      {tab === "FPDS"   && <FPDSChecklist intake={intake} onComplete={(vals) => { alert("FPDS fields recorded."); }} />}
    </div>
  );
}
