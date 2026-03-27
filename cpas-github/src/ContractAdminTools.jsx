// CPAS Contract Administration Tools
// - Structured Closeout Checklist (FAR 4.804)
// - CPARS Structured Input Template
// - Post-Award Debrief Generator (FAR 15.506)
// - Pre-Negotiation Objectives Memo (FAR 15.406-1)
// - Contract Administration Dashboard

import React, { useState, useMemo, useEffect } from "react";

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

// ═══════════════════════════════════════════════════════════════════
// CLOSEOUT CHECKLIST (FAR 4.804)
// ═══════════════════════════════════════════════════════════════════

const CLOSEOUT_ITEMS = [
  // Administrative
  { id: "co1",  cat: "Administrative",       responsible: "CO",         item: "Verify all work has been completed and accepted per contract terms" },
  { id: "co2",  cat: "Administrative",       responsible: "CO",         item: "Confirm final contract modification (if needed) executed" },
  { id: "co3",  cat: "Administrative",       responsible: "CO/COR",     item: "Verify all contract deliverables received and accepted in writing" },
  { id: "co4",  cat: "Administrative",       responsible: "CO",         item: "Confirm expiration of appeal period (6 years from final payment, or 3 years if no disputes)" },
  { id: "co5",  cat: "Administrative",       responsible: "CO",         item: "Issue final modification if required (deobligate excess funds, update PoP, etc.)" },
  // Financial
  { id: "fi1",  cat: "Financial",            responsible: "CO/Finance",  item: "All invoices received, reviewed, and final invoice paid" },
  { id: "fi2",  cat: "Financial",            responsible: "CO/Finance",  item: "Final voucher accepted and paid (cost-type contracts)" },
  { id: "fi3",  cat: "Financial",            responsible: "Finance",     item: "Excess funds deobligated — unliquidated obligations (ULOs) cleared" },
  { id: "fi4",  cat: "Financial",            responsible: "Finance",     item: "Final audit completed and any cost disallowances resolved (cost-type)" },
  { id: "fi5",  cat: "Financial",            responsible: "CO",          item: "Contractor final payment confirmed (no pending invoices)" },
  // Subcontracting
  { id: "sb1",  cat: "Small Business",       responsible: "CO",          item: "Final subcontracting report (SF-294 or eSRS) submitted and accepted" },
  { id: "sb2",  cat: "Small Business",       responsible: "CO",          item: "Contractor compliance with small business subcontracting plan verified" },
  // Patent/Data
  { id: "pd1",  cat: "Patents & Data",       responsible: "CO/Legal",    item: "Final patent report received (if required — R&D contracts)" },
  { id: "pd2",  cat: "Patents & Data",       responsible: "CO/Legal",    item: "Technical data and computer software deliverables confirmed per contract rights" },
  { id: "pd3",  cat: "Patents & Data",       responsible: "CO",          item: "Property disposition confirmed — all GFP/GFE returned or dispositioned" },
  // Government Property
  { id: "gp1",  cat: "Government Property",  responsible: "COR/CO",      item: "All Government-furnished property (GFP) returned, transferred, or disposed" },
  { id: "gp2",  cat: "Government Property",  responsible: "COR",         item: "Property closure report accepted by property administrator" },
  // Personnel/Security
  { id: "ps1",  cat: "Personnel/Security",   responsible: "CO/Security", item: "All contractor personnel PIV cards returned" },
  { id: "ps2",  cat: "Personnel/Security",   responsible: "Security",    item: "All contractor security badges and facility access terminated" },
  { id: "ps3",  cat: "Personnel/Security",   responsible: "IT",          item: "Contractor IT system access deprovisioned" },
  { id: "ps4",  cat: "Personnel/Security",   responsible: "IT",          item: "Contractor equipment (laptops, tokens) returned and inventoried" },
  // Reporting
  { id: "rp1",  cat: "Reporting & Records",  responsible: "CO",          item: "FPDS-NG contract action report updated (closeout action reported)" },
  { id: "rp2",  cat: "Reporting & Records",  responsible: "CO",          item: "CPARS final performance evaluation submitted and contractor response period elapsed" },
  { id: "rp3",  cat: "Reporting & Records",  responsible: "CO",          item: "All contract documents uploaded to NEAR in correct file elements" },
  { id: "rp4",  cat: "Reporting & Records",  responsible: "CO",          item: "Contract file review completed per NFS file elements checklist" },
  { id: "rp5",  cat: "Reporting & Records",  responsible: "CO",          item: "Closeout documents retained per FAR 4.805 record retention requirements" },
  // Disputes
  { id: "di1",  cat: "Disputes/Claims",      responsible: "CO/Legal",    item: "No pending claims or disputes (or all have been resolved)" },
  { id: "di2",  cat: "Disputes/Claims",      responsible: "CO/Legal",    item: "Statute of limitations verified — no outstanding liability" },
];

export function CloseoutChecklist({ intake, onGenerated }) {
  const [checked, setChecked]   = useState({});
  const [dates, setDates]       = useState({});
  const [notes, setNotes]       = useState({});
  const [contractNum, setContractNum] = useState(intake?.contractNumber || "");
  const [contractor, setContractor]   = useState("");
  const [coName, setCoName]           = useState(intake?.coName || "");
  const [closeoutDate, setCloseoutDate] = useState("");

  const cats = [...new Set(CLOSEOUT_ITEMS.map(i => i.cat))];
  const completed = CLOSEOUT_ITEMS.filter(i => checked[i.id]).length;
  const pct = Math.round((completed / CLOSEOUT_ITEMS.length) * 100);
  const allDone = completed === CLOSEOUT_ITEMS.length;

  function generateDoc() {
    const date = closeoutDate ? new Date(closeoutDate+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[DATE]";
    let t = `CONTRACT CLOSEOUT CHECKLIST\nFAR 4.804\n${"═".repeat(70)}\n\n`;
    t += `Contract No.:  ${contractNum || "[CONTRACT NUMBER]"}\n`;
    t += `Contractor:    ${contractor  || "[CONTRACTOR NAME]"}\n`;
    t += `Requirement:   ${intake?.reqTitle || "[REQUIREMENT]"}\n`;
    t += `Value:         $${(parseFloat(intake?.value)||0).toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
    t += `CO:            ${coName}\n`;
    t += `Closeout Date: ${date}\n\n`;
    t += `Progress: ${completed}/${CLOSEOUT_ITEMS.length} items complete (${pct}%)\n\n`;

    cats.forEach(cat => {
      const items = CLOSEOUT_ITEMS.filter(i => i.cat === cat);
      t += `${"─".repeat(70)}\n${cat.toUpperCase()}\n${"─".repeat(70)}\n\n`;
      items.forEach(item => {
        const done = checked[item.id];
        t += `${done ? "[✓]" : "[ ]"} ${item.item}\n`;
        t += `     Responsible: ${item.responsible}`;
        if (dates[item.id]) t += `  |  Date: ${dates[item.id]}`;
        t += `\n`;
        if (notes[item.id]) t += `     Notes: ${notes[item.id]}\n`;
        t += `\n`;
      });
    });

    t += `${"═".repeat(70)}\n\n`;
    if (allDone) {
      t += `All closeout actions are complete. This contract is officially closed.\n\n`;
    } else {
      t += `OUTSTANDING ITEMS (${CLOSEOUT_ITEMS.length - completed}):\n`;
      CLOSEOUT_ITEMS.filter(i => !checked[i.id]).forEach(i => {
        t += `  • ${i.item} [${i.responsible}]\n`;
      });
      t += `\n`;
    }

    t += `${"_".repeat(40)}\n${coName || "[CO NAME]"}\nContracting Officer\nDate: ________________\n`;
    return t;
  }

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text, padding:16, overflow:"auto", maxHeight:"72vh" }}>
      <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:10 }}>CLOSEOUT CHECKLIST — FAR 4.804</div>

      {/* Header */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
        <div>
          {lbl("Contract No.")}
          <input style={inp} value={contractNum} onChange={e=>setContractNum(e.target.value)} />
        </div>
        <div>
          {lbl("Contractor")}
          <input style={inp} value={contractor} onChange={e=>setContractor(e.target.value)} />
        </div>
        <div>
          {lbl("CO Name")}
          <input style={inp} value={coName} onChange={e=>setCoName(e.target.value)} />
        </div>
        <div>
          {lbl("Closeout Date")}
          <input style={inp} type="date" value={closeoutDate} onChange={e=>setCloseoutDate(e.target.value)} />
        </div>
      </div>

      {/* Progress */}
      <div style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:4, padding:"10px 14px", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:10, color:C.muted }}>CLOSEOUT PROGRESS</span>
          <span style={{ fontSize:11, color: allDone ? C.green : C.yellow, fontWeight:"bold" }}>{completed} / {CLOSEOUT_ITEMS.length}</span>
        </div>
        <div style={{ height:5, background:"#0a1a3a", borderRadius:3 }}>
          <div style={{ width:`${pct}%`, height:"100%", background: allDone ? C.green : C.yellow, borderRadius:3, transition:"width .3s" }} />
        </div>
        {allDone && <div style={{ fontSize:10, color:C.green, marginTop:5 }}>✓ All closeout actions complete</div>}
      </div>

      {/* Items by category */}
      {cats.map(cat => {
        const items = CLOSEOUT_ITEMS.filter(i => i.cat === cat);
        const catDone = items.filter(i => checked[i.id]).length;
        return (
          <div key={cat} style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.blue, fontWeight:"bold", marginBottom:6, display:"flex", justifyContent:"space-between" }}>
              <span>{cat.toUpperCase()}</span>
              <span style={{ color: catDone===items.length ? C.green : C.muted, fontWeight:"normal", fontSize:9 }}>
                {catDone}/{items.length}
              </span>
            </div>
            {items.map(item => (
              <div key={item.id} style={{ background: checked[item.id] ? "#041a0e" : C.bg3,
                border:`1px solid ${checked[item.id] ? "#1a4a2a" : C.border}`,
                borderRadius:4, padding:"8px 10px", marginBottom:4 }}>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div onClick={() => setChecked(c => ({...c,[item.id]:!c[item.id]}))}
                    style={{ width:16, height:16, border:`1px solid ${checked[item.id]?C.green:"#2a4a6a"}`,
                             borderRadius:3, background:checked[item.id]?C.green:"transparent",
                             flexShrink:0, cursor:"pointer", marginTop:1,
                             display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff" }}>
                    {checked[item.id]?"✓":""}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:checked[item.id]?C.green:C.text, lineHeight:1.4 }}>{item.item}</div>
                    <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>Responsible: {item.responsible}</div>
                    {checked[item.id] && (
                      <div style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:6, marginTop:6 }}>
                        <input type="date" value={dates[item.id]||""} onChange={e=>setDates(d=>({...d,[item.id]:e.target.value}))}
                          style={{ ...inp, padding:"3px 6px", fontSize:10 }} placeholder="Date completed" />
                        <input value={notes[item.id]||""} onChange={e=>setNotes(n=>({...n,[item.id]:e.target.value}))}
                          style={{ ...inp, padding:"3px 6px", fontSize:10 }} placeholder="Notes (optional)" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <button onClick={() => { const t = generateDoc(); navigator.clipboard.writeText(t); }}
          style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"7px 16px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
          COPY CHECKLIST
        </button>
        <button onClick={() => { const t = generateDoc(); onGenerated && onGenerated(t); }}
          style={{ background: allDone ? "#0a2a1a" : C.bg3, border:`1px solid ${allDone ? C.green : C.border}`,
                   color: allDone ? C.green : C.muted, padding:"7px 16px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>
          {allDone ? "✓ SAVE COMPLETE CLOSEOUT" : "SAVE IN-PROGRESS CHECKLIST"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CPARS STRUCTURED INPUT
// ═══════════════════════════════════════════════════════════════════

const CPARS_RATINGS = [
  { value:"EX", label:"Exceptional",   color:"#3aaa66", desc:"Performance meets contractual requirements and exceeds many to the Government's benefit." },
  { value:"VG", label:"Very Good",     color:"#4a9eff", desc:"Performance meets contractual requirements and exceeds some to the Government's benefit." },
  { value:"S",  label:"Satisfactory",  color:"#8ab0d0", desc:"Performance meets contractual requirements." },
  { value:"M",  label:"Marginal",      color:"#f4c542", desc:"Performance does not meet some contractual requirements. CO has taken action." },
  { value:"U",  label:"Unsatisfactory",color:"#e87c3e", desc:"Performance does not meet contractual requirements and recovery is not likely." },
  { value:"NA", label:"Not Applicable",color:"#4a5a6a", desc:"Not applicable to this contract." },
];

const CPARS_AREAS = [
  { id:"tech",    label:"Technical/Quality",          required:true,  hint:"Quality of the product or service delivered. Adherence to requirements." },
  { id:"schedule",label:"Schedule/Timeliness",        required:true,  hint:"Ability to meet contract milestones and delivery dates." },
  { id:"cost",    label:"Cost Control",               required:false, hint:"For cost-type contracts. Accuracy of cost estimates and cost management." },
  { id:"mgmt",    label:"Management/Business Relations", required:true, hint:"Effectiveness of management, subcontractor management, flexibility, and business relations." },
  { id:"sb",      label:"Small Business Utilization", required:false, hint:"Compliance with small business subcontracting plan goals." },
  { id:"regualt", label:"Regulatory Compliance",      required:false, hint:"Compliance with regulatory requirements (labor, safety, environmental, etc.)." },
  { id:"overall", label:"Overall Assessment",         required:true,  hint:"Overall rating considering all areas of performance." },
];

export function CPARSInput({ intake, onGenerated }) {
  const [c, setC] = useState({
    contractNum:    intake?.contractNumber || "",
    contractor:     "",
    uei:            "",
    popStart:       "",
    popEnd:         "",
    value:          intake?.value || "",
    coName:         intake?.coName || "",
    assessorName:   "",
    assessorTitle:  "",
    assessmentDate: "",
    assessmentType: "INTERIM",  // INTERIM, FINAL
    isSCA:          false,
    isSmallBusiness:false,
    ratings:        {},
    narratives:     {},
    positives:      "",
    concerns:       "",
    remediation:    "",
    recommendation: "",
  });

  const set = (k, v) => setC(cc => ({ ...cc, [k]: v }));
  const setRating = (area, val) => setC(cc => ({ ...cc, ratings: { ...cc.ratings, [area]: val } }));
  const setNarrative = (area, val) => setC(cc => ({ ...cc, narratives: { ...cc.narratives, [area]: val } }));

  const overallRating = c.ratings["overall"];
  const ratingObj = CPARS_RATINGS.find(r => r.value === overallRating);

  const text = useMemo(() => buildCPARSText(c, intake), [c, intake]);

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text }}>
      <div style={{ display:"grid", gridTemplateColumns:"380px 1fr", minHeight:520 }}>
        <div style={{ padding:16, borderRight:`1px solid ${C.border}`, overflow:"auto", maxHeight:"72vh" }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:10 }}>CPARS STRUCTURED INPUT</div>

          {/* Header */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            <div>
              {lbl("Contract Number", true)}
              <input style={inp} value={c.contractNum} onChange={e=>set("contractNum",e.target.value)} />
            </div>
            <div>
              {lbl("Assessment Type")}
              <select style={inp} value={c.assessmentType} onChange={e=>set("assessmentType",e.target.value)}>
                <option value="INTERIM">Interim</option>
                <option value="FINAL">Final</option>
                <option value="AWARD_FEE">Award Fee</option>
              </select>
            </div>
          </div>
          {lbl("Contractor Name", true)}
          <input style={inp} value={c.contractor} onChange={e=>set("contractor",e.target.value)} />
          {lbl("UEI")}
          <input style={inp} value={c.uei} onChange={e=>set("uei",e.target.value)} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            <div>
              {lbl("PoP Start")}
              <input style={inp} type="date" value={c.popStart} onChange={e=>set("popStart",e.target.value)} />
            </div>
            <div>
              {lbl("PoP End")}
              <input style={inp} type="date" value={c.popEnd} onChange={e=>set("popEnd",e.target.value)} />
            </div>
          </div>
          {lbl("Contract Value")}
          <input style={inp} value={c.value} onChange={e=>set("value",e.target.value)} />
          {lbl("Assessing Official")}
          <input style={inp} value={c.assessorName} onChange={e=>set("assessorName",e.target.value)} placeholder="Name of assessing official (COR or CO)" />
          {lbl("Assessing Official Title")}
          <input style={inp} value={c.assessorTitle} onChange={e=>set("assessorTitle",e.target.value)} placeholder="e.g., COR, Contracting Officer" />
          {lbl("Assessment Date")}
          <input style={inp} type="date" value={c.assessmentDate} onChange={e=>set("assessmentDate",e.target.value)} />

          {/* Performance areas */}
          <div style={{ fontSize:10, color:C.blue, fontWeight:"bold", marginTop:14, marginBottom:6 }}>PERFORMANCE AREA RATINGS</div>
          {CPARS_AREAS.map(area => (
            <div key={area.id} style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:4, padding:"10px 10px", marginBottom:6 }}>
              <div style={{ fontSize:10, color:C.text, fontWeight:"bold", marginBottom:2 }}>
                {area.label} {area.required && <span style={{ color:C.yellow }}>*</span>}
              </div>
              <div style={{ fontSize:9, color:C.muted, marginBottom:6 }}>{area.hint}</div>
              {/* Rating selector */}
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                {CPARS_RATINGS.map(r => (
                  <button key={r.value} onClick={() => setRating(area.id, r.value)}
                    style={{ padding:"3px 8px", borderRadius:3, cursor:"pointer", fontSize:9, fontWeight:"bold",
                             background: c.ratings[area.id]===r.value ? r.color+"33" : "transparent",
                             border:`1px solid ${c.ratings[area.id]===r.value ? r.color : "#2a4a6a"}`,
                             color: c.ratings[area.id]===r.value ? r.color : C.dim }}>
                    {r.value} — {r.label}
                  </button>
                ))}
              </div>
              {c.ratings[area.id] && c.ratings[area.id] !== "NA" && (
                <textarea value={c.narratives[area.id]||""} onChange={e=>setNarrative(area.id,e.target.value)}
                  placeholder={`Narrative for ${area.label}...`}
                  style={{ ...ta, minHeight:50, fontSize:10 }} rows={2} />
              )}
            </div>
          ))}

          {lbl("Notable Strengths / Positive Performance")}
          <textarea style={ta} value={c.positives} rows={3} onChange={e=>set("positives",e.target.value)}
            placeholder="Describe specific examples of exceptional or very good performance..." />
          {lbl("Areas of Concern / Weaknesses")}
          <textarea style={ta} value={c.concerns} rows={3} onChange={e=>set("concerns",e.target.value)}
            placeholder="Describe any performance concerns, deficiencies, or areas requiring improvement..." />
          {lbl("Government Actions / Remediation Taken")}
          <textarea style={ta} value={c.remediation} rows={2} onChange={e=>set("remediation",e.target.value)}
            placeholder="Describe any corrective actions taken, cure notices, show cause letters, etc." />
          {lbl("Recommendation for Future Work")}
          <select style={inp} value={c.recommendation} onChange={e=>set("recommendation",e.target.value)}>
            <option value="">— Select —</option>
            <option value="HIGHLY_RECOMMEND">Highly recommend for future Government contracts</option>
            <option value="RECOMMEND">Recommend for future Government contracts</option>
            <option value="NEUTRAL">Neutral — performance met basic requirements</option>
            <option value="CAUTION">Use with caution — performance concerns noted</option>
            <option value="NOT_RECOMMEND">Do not recommend for future Government contracts</option>
          </select>
        </div>

        {/* Preview */}
        <div style={{ display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center" }}>
            {overallRating && (
              <div style={{ background:ratingObj?.color+"22", border:`1px solid ${ratingObj?.color}`,
                             borderRadius:4, padding:"4px 12px", fontSize:11, fontWeight:"bold", color:ratingObj?.color }}>
                OVERALL: {ratingObj?.label}
              </div>
            )}
            <button onClick={() => navigator.clipboard.writeText(text)}
              style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
              COPY
            </button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background:"#0a2a1a", border:"1px solid #1a6a3a", color:C.green, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
              SAVE TO PACKAGE
            </button>
          </div>
          <pre style={{ flex:1, padding:16, fontSize:10, color:C.dim, overflow:"auto", maxHeight:"64vh", whiteSpace:"pre-wrap", lineHeight:1.6, margin:0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildCPARSText(c, intake) {
  const fmt = d => d ? new Date(d+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[DATE]";
  const ratingLabels = Object.fromEntries(CPARS_RATINGS.map(r=>[r.value, r.label]));

  let t = `CONTRACTOR PERFORMANCE ASSESSMENT REPORT (CPARS)\n`;
  t += `${c.assessmentType === "FINAL" ? "FINAL" : c.assessmentType === "AWARD_FEE" ? "AWARD FEE" : "INTERIM"} ASSESSMENT\n`;
  t += `${"═".repeat(70)}\n\n`;
  t += `Contract No.:     ${c.contractNum || "[CONTRACT NUMBER]"}\n`;
  t += `Contractor:       ${c.contractor  || "[CONTRACTOR NAME]"}\n`;
  if (c.uei) t += `UEI:              ${c.uei}\n`;
  t += `Period Assessed:  ${fmt(c.popStart)} – ${fmt(c.popEnd)}\n`;
  if (c.value) t += `Contract Value:   $${parseFloat(String(c.value).replace(/[$,]/g,"")||0).toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
  t += `Assessing Official: ${c.assessorName || "[NAME]"}, ${c.assessorTitle || "[TITLE]"}\n`;
  t += `Assessment Date:  ${fmt(c.assessmentDate)}\n\n`;

  t += `${"─".repeat(70)}\nPERFORMANCE RATINGS\n${"─".repeat(70)}\n\n`;
  CPARS_AREAS.forEach(area => {
    const rating = c.ratings[area.id];
    if (!rating) return;
    t += `${area.label}:\n`;
    t += `  Rating: ${ratingLabels[rating] || rating} (${rating})\n`;
    if (c.narratives[area.id]) t += `  ${c.narratives[area.id].replace(/\n/g,"\n  ")}\n`;
    t += `\n`;
  });

  if (c.positives) {
    t += `${"─".repeat(70)}\nNOTABLE STRENGTHS\n${"─".repeat(70)}\n\n${c.positives}\n\n`;
  }

  if (c.concerns) {
    t += `${"─".repeat(70)}\nAREAS OF CONCERN\n${"─".repeat(70)}\n\n${c.concerns}\n\n`;
  }

  if (c.remediation) {
    t += `${"─".repeat(70)}\nGOVERNMENT ACTIONS\n${"─".repeat(70)}\n\n${c.remediation}\n\n`;
  }

  if (c.recommendation) {
    const recLabels = {
      HIGHLY_RECOMMEND: "Highly recommend for future Government contracts",
      RECOMMEND:        "Recommend for future Government contracts",
      NEUTRAL:          "Neutral — performance met basic requirements",
      CAUTION:          "Use with caution — performance concerns noted",
      NOT_RECOMMEND:    "Do not recommend for future Government contracts",
    };
    t += `${"─".repeat(70)}\nRECOMMENDATION FOR FUTURE WORK\n${"─".repeat(70)}\n\n${recLabels[c.recommendation]}\n\n`;
  }

  t += `${"─".repeat(70)}\n\n`;
  t += `NOTE: This assessment will be entered into CPARS at www.cpars.gov. `;
  t += `The contractor has 60 days to review and submit comments.\n\n`;
  t += `${"_".repeat(40)}\n${c.assessorName || "[ASSESSING OFFICIAL]"}\n${c.assessorTitle || ""}\nDate: ________________\n`;

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// POST-AWARD DEBRIEF GENERATOR (FAR 15.506)
// ═══════════════════════════════════════════════════════════════════

export function DebriefGenerator({ intake, onGenerated }) {
  const [d, setD] = useState({
    reqTitle:        intake?.reqTitle || "",
    solNumber:       intake?.solNumber || "",
    contractNum:     intake?.contractNumber || "",
    awardee:         "",
    awardAmount:     intake?.value ? "$" + parseFloat(intake.value).toLocaleString("en-US",{minimumFractionDigits:2}) : "",
    offerorName:     "",
    offerorScore:    "",
    offerorPrice:    "",
    awardeeScore:    "",
    evaluationFactors: "Technical Approach, Management Approach, Past Performance, Price",
    techRationale:   "",
    mgmtRationale:   "",
    pastPerfRating:  "",
    priceAnalysis:   "",
    deficiencies:    "",
    weaknesses:      "",
    debriefDate:     "",
    debriefMethod:   "WRITTEN",  // WRITTEN, ORAL
    coName:          intake?.coName || "",
    requestDeadline: "3 business days after notification of exclusion or award",
    debriefDeadline: "5 days after request received",
  });
  const set = (k, v) => setD(dd => ({ ...dd, [k]: v }));
  const text = useMemo(() => buildDebriefText(d, intake), [d, intake]);

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text }}>
      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", minHeight:480 }}>
        <div style={{ padding:16, borderRight:`1px solid ${C.border}`, overflow:"auto", maxHeight:"70vh" }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:10 }}>POST-AWARD DEBRIEF — FAR 15.506</div>

          {lbl("Requirement Title")}
          <input style={inp} value={d.reqTitle} onChange={e=>set("reqTitle",e.target.value)} />
          {lbl("Solicitation Number")}
          <input style={inp} value={d.solNumber} onChange={e=>set("solNumber",e.target.value)} />
          {lbl("Unsuccessful Offeror Name", true)}
          <input style={inp} value={d.offerorName} onChange={e=>set("offerorName",e.target.value)} />
          {lbl("Award Made To")}
          <input style={inp} value={d.awardee} onChange={e=>set("awardee",e.target.value)} />
          {lbl("Award Amount")}
          <input style={inp} value={d.awardAmount} onChange={e=>set("awardAmount",e.target.value)} />

          {lbl("Debrief Method")}
          <select style={inp} value={d.debriefMethod} onChange={e=>set("debriefMethod",e.target.value)}>
            <option value="WRITTEN">Written debrief</option>
            <option value="ORAL">Oral debrief</option>
            <option value="BOTH">Both oral and written</option>
          </select>
          {lbl("Debrief Date")}
          <input style={inp} type="date" value={d.debriefDate} onChange={e=>set("debriefDate",e.target.value)} />

          {lbl("Evaluation Factors Used")}
          <textarea style={ta} value={d.evaluationFactors} rows={2} onChange={e=>set("evaluationFactors",e.target.value)} />

          {lbl("Offeror's Ratings (if scored)")}
          <input style={inp} value={d.offerorScore} onChange={e=>set("offerorScore",e.target.value)} placeholder="e.g., Technical: Good, Mgmt: Acceptable, PP: Satisfactory" />
          {lbl("Offeror's Evaluated Price")}
          <input style={inp} value={d.offerorPrice} onChange={e=>set("offerorPrice",e.target.value)} />
          {lbl("Awardee's Ratings (non-source-selection sensitive only)")}
          <input style={inp} value={d.awardeeScore} onChange={e=>set("awardeeScore",e.target.value)} placeholder="e.g., Technical: Outstanding, PP: Exceptional" />

          {lbl("Technical Evaluation Rationale")}
          <textarea style={ta} value={d.techRationale} rows={3} onChange={e=>set("techRationale",e.target.value)}
            placeholder="Explain technical ratings and key discriminators..." />
          {lbl("Past Performance Evaluation")}
          <input style={inp} value={d.pastPerfRating} onChange={e=>set("pastPerfRating",e.target.value)} placeholder="e.g., Satisfactory Confidence" />
          {lbl("Price/Cost Evaluation Summary")}
          <textarea style={ta} value={d.priceAnalysis} rows={2} onChange={e=>set("priceAnalysis",e.target.value)} />
          {lbl("Significant Weaknesses")}
          <textarea style={ta} value={d.weaknesses} rows={2} onChange={e=>set("weaknesses",e.target.value)}
            placeholder="Areas where the proposal had weaknesses per FAR 15.506(d)(2)..." />
          {lbl("Deficiencies")}
          <textarea style={ta} value={d.deficiencies} rows={2} onChange={e=>set("deficiencies",e.target.value)}
            placeholder="Any deficiencies in the proposal per FAR 15.506(d)(2)..." />
          {lbl("Contracting Officer")}
          <input style={inp} value={d.coName} onChange={e=>set("coName",e.target.value)} />
        </div>

        <div style={{ display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8 }}>
            <button onClick={() => navigator.clipboard.writeText(text)}
              style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>COPY</button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background:"#0a2a1a", border:"1px solid #1a6a3a", color:C.green, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>SAVE TO PACKAGE</button>
          </div>
          <pre style={{ flex:1, padding:16, fontSize:10, color:C.dim, overflow:"auto", maxHeight:"62vh", whiteSpace:"pre-wrap", lineHeight:1.6, margin:0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildDebriefText(d, intake) {
  const fmt = dt => dt ? new Date(dt+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[DATE]";

  let t = `POST-AWARD DEBRIEF NOTIFICATION\n`;
  t += `FAR 15.506\n`;
  t += `${"═".repeat(70)}\n\n`;
  t += `TO:      ${d.offerorName || "[OFFEROR NAME]"}\n`;
  t += `FROM:    ${d.coName || "[CO NAME]"}, Contracting Officer\n`;
  t += `DATE:    ${fmt(d.debriefDate)}\n`;
  t += `SUBJECT: Post-Award Debrief — ${d.solNumber || "[SOLICITATION NUMBER]"}\n\n`;

  t += `${"─".repeat(70)}\n1.  AWARD INFORMATION\n${"─".repeat(70)}\n\n`;
  t += `Solicitation:    ${d.solNumber  || "[SOL NUMBER]"}\n`;
  t += `Requirement:     ${d.reqTitle   || intake?.reqTitle || "[REQUIREMENT]"}\n`;
  t += `Award Made To:   ${d.awardee    || "[AWARDEE]"}\n`;
  t += `Award Amount:    ${d.awardAmount || "[AMOUNT]"}\n\n`;

  t += `${"─".repeat(70)}\n2.  EVALUATION FACTORS\n${"─".repeat(70)}\n\n`;
  t += `The following evaluation factors were used:\n${d.evaluationFactors}\n\n`;

  t += `${"─".repeat(70)}\n3.  YOUR PROPOSAL EVALUATION\n${"─".repeat(70)}\n\n`;
  if (d.offerorScore) t += `Overall Ratings:   ${d.offerorScore}\n`;
  if (d.offerorPrice) t += `Evaluated Price:   ${d.offerorPrice}\n`;
  t += `\n`;
  if (d.techRationale) t += `Technical Evaluation:\n${d.techRationale}\n\n`;
  if (d.pastPerfRating) t += `Past Performance:  ${d.pastPerfRating}\n\n`;
  if (d.priceAnalysis)  t += `Price Evaluation:\n${d.priceAnalysis}\n\n`;

  if (d.weaknesses) {
    t += `${"─".repeat(70)}\n4.  SIGNIFICANT WEAKNESSES — FAR 15.506(d)(2)\n${"─".repeat(70)}\n\n${d.weaknesses}\n\n`;
  }
  if (d.deficiencies) {
    t += `${"─".repeat(70)}\n5.  DEFICIENCIES — FAR 15.506(d)(2)\n${"─".repeat(70)}\n\n${d.deficiencies}\n\n`;
  }

  t += `${"─".repeat(70)}\n${d.weaknesses||d.deficiencies?"6":"4"}.  AWARD COMPARISON — FAR 15.506(d)(3)-(4)\n${"─".replace("─","─").repeat(70)}\n\n`;
  if (d.awardeeScore) t += `Awardee's overall ratings: ${d.awardeeScore}\n`;
  t += `Basis for award: The awardee's proposal provided the best value to the Government `;
  t += `considering all evaluation factors. Specific source selection information protected `;
  t += `under FAR 15.506(e) and the Procurement Integrity Act is not releasable.\n\n`;

  t += `${"─".repeat(70)}\n${d.weaknesses||d.deficiencies?"7":"5"}.  PROTEST RIGHTS\n${"─".repeat(70)}\n\n`;
  t += `You may protest this award to the Government Accountability Office (GAO) or the `;
  t += `U.S. Court of Federal Claims. A protest to GAO must be filed within 10 days after `;
  t += `this debrief. See 4 C.F.R. Part 21 for GAO protest procedures.\n\n`;

  t += `${"─".repeat(70)}\n\n`;
  t += `${"_".repeat(40)}\n${d.coName || "[Contracting Officer]"}\nContracting Officer\nDate: ${fmt(d.debriefDate)}\n`;

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// PRE-NEGOTIATION OBJECTIVES MEMO (FAR 15.406-1)
// ═══════════════════════════════════════════════════════════════════

export function PreNegotiationMemo({ intake, onGenerated }) {
  const [p, setP] = useState({
    reqTitle:       intake?.reqTitle || "",
    contractNum:    intake?.contractNumber || "",
    contractor:     "",
    proposedAmount: "",
    proposedLaborHours: "",
    proposedRate:   "",
    govObjectiveAmount: "",
    govObjectiveLaborHours: "",
    govObjectiveRate: "",
    igeAmount:      "",
    priorPriceRef:  "",
    technicalAnalysis: "",
    laborAnalysis:  "",
    overheadAnalysis: "",
    profitObjective: "",
    profitBasis:    "",
    negotiationStrategy: "",
    tradeableItems: "",
    fallbackPosition: "",
    coName:         intake?.coName || "",
    date:           "",
  });
  const set = (k, v) => setP(pp => ({ ...pp, [k]: v }));

  const proposed = parseFloat(p.proposedAmount?.replace(/[$,]/g,"")) || 0;
  const govObj   = parseFloat(p.govObjectiveAmount?.replace(/[$,]/g,"")) || 0;
  const variance = proposed > 0 && govObj > 0 ? ((proposed - govObj) / proposed * 100).toFixed(1) : null;

  const text = useMemo(() => buildPreNegText(p, intake), [p, intake]);

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text }}>
      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", minHeight:480 }}>
        <div style={{ padding:16, borderRight:`1px solid ${C.border}`, overflow:"auto", maxHeight:"70vh" }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:10 }}>PRE-NEGOTIATION OBJECTIVES — FAR 15.406-1</div>

          {lbl("Requirement")}
          <input style={inp} value={p.reqTitle} onChange={e=>set("reqTitle",e.target.value)} />
          {lbl("Contractor")}
          <input style={inp} value={p.contractor} onChange={e=>set("contractor",e.target.value)} />

          <div style={{ fontSize:10, color:C.blue, marginTop:10, marginBottom:4, fontWeight:"bold" }}>PROPOSED VS GOVERNMENT OBJECTIVE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            <div>
              {lbl("Contractor Proposed ($)")}
              <input style={inp} value={p.proposedAmount} onChange={e=>set("proposedAmount",e.target.value)} />
            </div>
            <div>
              {lbl("Gov't Objective ($)")}
              <input style={inp} value={p.govObjectiveAmount} onChange={e=>set("govObjectiveAmount",e.target.value)} />
            </div>
            <div>
              {lbl("Proposed Labor Hours")}
              <input style={inp} value={p.proposedLaborHours} onChange={e=>set("proposedLaborHours",e.target.value)} />
            </div>
            <div>
              {lbl("Objective Labor Hours")}
              <input style={inp} value={p.govObjectiveLaborHours} onChange={e=>set("govObjectiveLaborHours",e.target.value)} />
            </div>
          </div>

          {variance !== null && (
            <div style={{ background:"#0a1a3a", border:`1px solid ${C.border}`, borderRadius:3, padding:"7px 10px", marginTop:4 }}>
              <span style={{ fontSize:10, color:C.muted }}>Negotiation Target: </span>
              <span style={{ fontSize:11, color:C.blue, fontWeight:"bold" }}>
                ${(proposed - govObj).toLocaleString("en-US",{minimumFractionDigits:0})} reduction ({variance}%)
              </span>
            </div>
          )}

          {lbl("IGCE / Independent Estimate")}
          <input style={inp} value={p.igeAmount} onChange={e=>set("igeAmount",e.target.value)} />
          {lbl("Prior Price Reference")}
          <input style={inp} value={p.priorPriceRef} onChange={e=>set("priorPriceRef",e.target.value)} placeholder="Prior contract / date / price" />

          {lbl("Technical Analysis Basis")}
          <textarea style={ta} value={p.technicalAnalysis} rows={3} onChange={e=>set("technicalAnalysis",e.target.value)}
            placeholder="Basis for challenging proposed technical approach, hours, or methodology..." />
          {lbl("Labor / Rate Analysis")}
          <textarea style={ta} value={p.laborAnalysis} rows={2} onChange={e=>set("laborAnalysis",e.target.value)}
            placeholder="Proposed rates vs market, escalation factors, mix analysis..." />
          {lbl("Overhead / G&A Analysis")}
          <textarea style={ta} value={p.overheadAnalysis} rows={2} onChange={e=>set("overheadAnalysis",e.target.value)} />
          {lbl("Profit Objective & Basis")}
          <input style={inp} value={p.profitObjective} onChange={e=>set("profitObjective",e.target.value)} placeholder="e.g., 8% — weighted guidelines per FAR 15.404-4" />
          {lbl("Negotiation Strategy")}
          <textarea style={ta} value={p.negotiationStrategy} rows={2} onChange={e=>set("negotiationStrategy",e.target.value)}
            placeholder="Describe planned approach: start, objective, tradeable items..." />
          {lbl("Tradeable Items (areas of flexibility)")}
          <textarea style={ta} value={p.tradeableItems} rows={2} onChange={e=>set("tradeableItems",e.target.value)} />
          {lbl("Fallback Position")}
          <input style={inp} value={p.fallbackPosition} onChange={e=>set("fallbackPosition",e.target.value)} placeholder="Maximum acceptable price" />
          {lbl("Contracting Officer")}
          <input style={inp} value={p.coName} onChange={e=>set("coName",e.target.value)} />
          {lbl("Date")}
          <input style={inp} type="date" value={p.date} onChange={e=>set("date",e.target.value)} />
        </div>

        <div style={{ display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8 }}>
            <button onClick={() => navigator.clipboard.writeText(text)}
              style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>COPY</button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background:"#0a2a1a", border:"1px solid #1a6a3a", color:C.green, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>SAVE TO PACKAGE</button>
          </div>
          <pre style={{ flex:1, padding:16, fontSize:10, color:C.dim, overflow:"auto", maxHeight:"62vh", whiteSpace:"pre-wrap", lineHeight:1.6, margin:0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildPreNegText(p, intake) {
  const fmt = d => d ? new Date(d+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[DATE]";
  const fmtAmt = s => { const n = parseFloat(String(s).replace(/[$,]/g,"")); return isNaN(n) ? s : "$"+n.toLocaleString("en-US",{minimumFractionDigits:2}); };

  let t = `PRE-NEGOTIATION OBJECTIVES MEMORANDUM\nFAR 15.406-1\n${"═".repeat(70)}\n\n`;
  t += `Requirement:  ${p.reqTitle || intake?.reqTitle || "[REQUIREMENT]"}\n`;
  t += `Contractor:   ${p.contractor || "[CONTRACTOR]"}\n`;
  t += `CO:           ${p.coName || "[CO NAME]"}\n`;
  t += `Date:         ${fmt(p.date)}\n\n`;

  t += `${"─".repeat(70)}\n1.  PROPOSED vs GOVERNMENT OBJECTIVES\n${"─".repeat(70)}\n\n`;
  t += `                         CONTRACTOR        GOVERNMENT\n`;
  t += `                         PROPOSED          OBJECTIVE\n`;
  t += `${"─".repeat(50)}\n`;
  t += `Total Cost/Price:  ${(fmtAmt(p.proposedAmount)||"TBD").padEnd(18)} ${fmtAmt(p.govObjectiveAmount)||"TBD"}\n`;
  if (p.proposedLaborHours||p.govObjectiveLaborHours)
    t += `Labor Hours:       ${(p.proposedLaborHours||"TBD").padEnd(18)} ${p.govObjectiveLaborHours||"TBD"}\n`;
  if (p.profitObjective) t += `Profit/Fee:        ${" ".padEnd(18)} ${p.profitObjective}\n`;
  t += `\n`;
  if (p.igeAmount) t += `IGCE: ${fmtAmt(p.igeAmount)}\n`;
  if (p.priorPriceRef) t += `Prior Price Reference: ${p.priorPriceRef}\n`;
  t += `\n`;

  if (p.technicalAnalysis) {
    t += `${"─".repeat(70)}\n2.  TECHNICAL ANALYSIS\n${"─".repeat(70)}\n\n${p.technicalAnalysis}\n\n`;
  }
  if (p.laborAnalysis) {
    t += `${"─".repeat(70)}\n3.  LABOR AND RATES ANALYSIS\n${"─".repeat(70)}\n\n${p.laborAnalysis}\n\n`;
  }
  if (p.overheadAnalysis) {
    t += `${"─".repeat(70)}\n4.  OVERHEAD / G&A ANALYSIS\n${"─".repeat(70)}\n\n${p.overheadAnalysis}\n\n`;
  }

  t += `${"─".repeat(70)}\n5.  NEGOTIATION STRATEGY\n${"─".repeat(70)}\n\n`;
  if (p.negotiationStrategy) t += `${p.negotiationStrategy}\n\n`;
  if (p.tradeableItems) t += `Tradeable Items:\n${p.tradeableItems}\n\n`;
  if (p.fallbackPosition) t += `Fallback / Walk-Away: ${fmtAmt(p.fallbackPosition)}\n\n`;

  t += `${"─".repeat(70)}\n\n`;
  t += `${"_".repeat(40)}\n${p.coName || "[CO NAME]"}\nContracting Officer\nDate: ${fmt(p.date)}\n`;
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// COMBINED CONTRACT ADMIN TOOLS
// ═══════════════════════════════════════════════════════════════════

export default function ContractAdminTools({ intake, onSaved }) {
  const [tab, setTab] = useState("CLOSEOUT");

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
    { id:"CLOSEOUT",   label:"Closeout Checklist",     color:C.red    },
    { id:"CPARS",      label:"CPARS Input",            color:C.green  },
    { id:"DEBRIEF",    label:"Debrief Letter",         color:C.purple },
    { id:"PRENEGOT",   label:"Pre-Neg Objectives",     color:C.blue   },
  ];

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", color:C.text, background:C.bg }}>
      <div style={{ display:"flex", gap:2, padding:"10px 14px", borderBottom:`1px solid ${C.border}`, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:10, fontWeight:"bold",
                     background: tab===t.id ? "#0a2a4a" : C.bg3,
                     border:`1px solid ${tab===t.id ? t.color : C.border}`,
                     color: tab===t.id ? t.color : C.dim }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "CLOSEOUT" && <CloseoutChecklist intake={intake} onGenerated={t => save(t,"CLOSEOUT")} />}
      {tab === "CPARS"    && <CPARSInput intake={intake} onGenerated={t => save(t,"CPARS_ASSESSMENT")} />}
      {tab === "DEBRIEF"  && <DebriefGenerator intake={intake} onGenerated={t => save(t,"DEBRIEF")} />}
      {tab === "PRENEGOT" && <PreNegotiationMemo intake={intake} onGenerated={t => save(t,"PRE_NEG_MEMO")} />}
    </div>
  );
}
