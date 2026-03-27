// CPAS UCF Sections D, E, F
// Section D — Packaging and Marking
// Section E — Inspection and Acceptance
// Section F — Deliveries or Performance

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

function TwoPane({ left, right, onCopy, onSave, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 480 }}>
        <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "68vh" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>{label}</div>
          {left}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <button onClick={() => { navigator.clipboard.writeText(right); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: copied ? C.green : C.blue, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              {copied ? "✓ COPIED" : "COPY"}
            </button>
            <button onClick={() => onSave && onSave(right)}
              style={{ background: "#0a2a1a", border: "1px solid #1a6a3a", color: C.green, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              SAVE TO PACKAGE
            </button>
          </div>
          <pre style={{ flex: 1, padding: 16, fontSize: 10, color: C.dim, overflow: "auto", maxHeight: "60vh", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
            {right}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION D — PACKAGING AND MARKING
// ═══════════════════════════════════════════════════════════════════

export function SectionDBuilder({ intake, onGenerated }) {
  const [d, setD] = useState({
    isCommercial:     intake?.isCommercial === "YES",
    reqType:          intake?.reqType || "SERVICES",
    packagingStd:     "COMMERCIAL",  // COMMERCIAL, MILITARY, GOVERNMENT
    markingReqs:      "standard",    // standard, classified, itar, custom
    contractNumber:   intake?.contractNumber || "",
    deliverTo:        intake?.center || "NASA Ames Research Center",
    specialMarking:   "",
    hazmat:           false,
    hazmatDetails:    "",
    dataPackaging:    true,
    dataFormat:       "Electronic — PDF and editable source (MS Word/Excel) via email or secure portal",
    preservationReqs: "",
    customD:          "",
  });
  const set = (k, v) => setD(dd => ({ ...dd, [k]: v }));

  const text = useMemo(() => buildSectionD(d, intake), [d, intake]);

  const left = (
    <>
      {lbl("Requirement Type")}
      <select style={inp} value={d.reqType} onChange={e => set("reqType", e.target.value)}>
        <option value="SERVICES">Services (no physical delivery)</option>
        <option value="SUPPLIES">Supplies / Hardware</option>
        <option value="IT">IT / Software</option>
        <option value="RD">R&D</option>
        <option value="CONSTRUCTION">Construction</option>
      </select>

      {lbl("Packaging Standard")}
      <select style={inp} value={d.packagingStd} onChange={e => set("packagingStd", e.target.value)}>
        <option value="COMMERCIAL">Commercial packaging (FAR 52.211-11)</option>
        <option value="BEST">Best commercial practice</option>
        <option value="MILITARY">Military standard (MIL-STD-2073)</option>
        <option value="NONE">No special packaging required (services)</option>
      </select>

      {lbl("Marking Requirements")}
      <select style={inp} value={d.markingReqs} onChange={e => set("markingReqs", e.target.value)}>
        <option value="standard">Standard — Contract number and deliverable title</option>
        <option value="sensitive">Sensitive But Unclassified (SBU)</option>
        <option value="cui">Controlled Unclassified Information (CUI)</option>
        <option value="itar">ITAR Export Controlled</option>
        <option value="classified">Classified — per DD-254</option>
        <option value="custom">Custom (specify below)</option>
      </select>

      {d.markingReqs === "custom" && (<>
        {lbl("Custom Marking Requirements")}
        <textarea style={ta} value={d.specialMarking} onChange={e => set("specialMarking", e.target.value)} rows={2} />
      </>)}

      {lbl("Contract Number (for marking)")}
      <input style={inp} value={d.contractNumber} onChange={e => set("contractNumber", e.target.value)} placeholder="e.g., 80ARC024C0001" />

      {lbl("Deliver / Ship To")}
      <input style={inp} value={d.deliverTo} onChange={e => set("deliverTo", e.target.value)} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div onClick={() => set("hazmat", !d.hazmat)}
          style={{ width: 13, height: 13, border: `1px solid ${d.hazmat ? C.red : "#2a4a6a"}`, borderRadius: 2,
                   background: d.hazmat ? C.red : "transparent", cursor: "pointer", flexShrink: 0,
                   display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>
          {d.hazmat ? "✓" : ""}
        </div>
        <span style={{ fontSize: 10, color: C.dim }}>Hazardous materials involved</span>
      </div>
      {d.hazmat && (<>
        {lbl("Hazmat Details")}
        <textarea style={ta} value={d.hazmatDetails} onChange={e => set("hazmatDetails", e.target.value)} rows={2}
          placeholder="Describe hazardous materials and special handling requirements..." />
      </>)}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div onClick={() => set("dataPackaging", !d.dataPackaging)}
          style={{ width: 13, height: 13, border: `1px solid ${d.dataPackaging ? C.green : "#2a4a6a"}`, borderRadius: 2,
                   background: d.dataPackaging ? C.green : "transparent", cursor: "pointer", flexShrink: 0,
                   display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>
          {d.dataPackaging ? "✓" : ""}
        </div>
        <span style={{ fontSize: 10, color: C.dim }}>Data / deliverable packaging requirements</span>
      </div>
      {d.dataPackaging && (<>
        {lbl("Data/Document Delivery Format")}
        <textarea style={ta} value={d.dataFormat} onChange={e => set("dataFormat", e.target.value)} rows={2} />
      </>)}

      {lbl("Preservation / Special Handling")}
      <textarea style={ta} value={d.preservationReqs} onChange={e => set("preservationReqs", e.target.value)} rows={2}
        placeholder="Temperature, humidity, or other special handling requirements (if any)" />

      {lbl("Additional Requirements")}
      <textarea style={ta} value={d.customD} onChange={e => set("customD", e.target.value)} rows={2} placeholder="Additional packaging/marking language..." />
    </>
  );

  return <TwoPane left={left} right={text} label="SECTION D — PACKAGING AND MARKING" onSave={onGenerated} />;
}

function buildSectionD(d, intake) {
  let idx = 1;
  const sec = (title, body) => { const s = `D.${idx}  ${title}\n\n${body}\n\n`; idx++; return s; };
  let t = `SECTION D — PACKAGING AND MARKING\n${"═".repeat(70)}\n\n`;

  if (d.reqType === "SERVICES") {
    t += sec("PACKAGING AND MARKING",
      `This is a services contract. There are no packaging requirements for the services themselves.\n\n` +
      `All written deliverables, reports, and data items shall be packaged and marked as specified in Section F.`
    );
  } else {
    const stdMap = {
      COMMERCIAL: "Preservation, packaging, packing, and marking shall be in accordance with best commercial practice.",
      BEST:       "Preservation, packaging, packing, and marking shall be in accordance with best commercial practice adequate to protect the items during shipment.",
      MILITARY:   "Preservation, packaging, packing, and marking shall be in accordance with MIL-STD-2073.",
      NONE:       "No special packaging requirements apply to this contract.",
    };
    t += sec("PACKAGING", stdMap[d.packagingStd] || stdMap.COMMERCIAL);
  }

  const markingMap = {
    standard:   `All packages and containers shall be marked with:\n     (1) Contract Number: ${d.contractNumber || "[CONTRACT NUMBER]"}\n     (2) Deliverable title and CLIN number\n     (3) Contractor name and address\n     (4) Deliver to: ${d.deliverTo}`,
    sensitive:  `All documents and deliverables containing Sensitive But Unclassified (SBU) information shall be marked "SENSITIVE BUT UNCLASSIFIED" on the cover and each page containing sensitive information.`,
    cui:        `All deliverables containing Controlled Unclassified Information (CUI) shall be marked in accordance with 32 CFR Part 2002 and the CUI Registry. Marking shall include the CUI designation, category, and applicable handling caveats.`,
    itar:       `All deliverables involving export-controlled technology shall be marked "ITAR CONTROLLED — Export of this document to foreign persons or foreign countries requires authorization from the U.S. Department of State." See NFS 1852.225-70.`,
    classified:  `Classified material shall be marked, safeguarded, and transmitted in accordance with the applicable DD-254 and applicable security regulations.`,
    custom:     d.specialMarking || "[Custom marking requirements]",
  };
  t += sec("MARKING", markingMap[d.markingReqs] || markingMap.standard);

  if (d.dataPackaging && d.dataFormat) {
    t += sec("DATA AND DOCUMENT PACKAGING",
      `All data items, reports, and documents delivered under this contract shall be submitted in the following format:\n\n     ${d.dataFormat}\n\n` +
      `Each deliverable shall clearly identify the contract number, CLIN, deliverable title, and submission date on the cover page or header.`
    );
  }

  if (d.hazmat && d.hazmatDetails) {
    t += sec("HAZARDOUS MATERIALS",
      `${d.hazmatDetails}\n\n` +
      `Hazardous materials shall be packaged, marked, and transported in accordance with 49 CFR and applicable DOT regulations.`
    );
  }

  if (d.preservationReqs) {
    t += sec("PRESERVATION AND SPECIAL HANDLING", d.preservationReqs);
  }

  if (d.customD) t += sec("ADDITIONAL REQUIREMENTS", d.customD);
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION E — INSPECTION AND ACCEPTANCE
// ═══════════════════════════════════════════════════════════════════

export function SectionEBuilder({ intake, onGenerated }) {
  const [e, setE] = useState({
    isCommercial:    intake?.isCommercial === "YES",
    reqType:         intake?.reqType || "SERVICES",
    inspectionPoint: "DESTINATION",   // DESTINATION, ORIGIN, BOTH
    acceptancePoint: "DESTINATION",
    inspectionBy:    "COR",           // COR, CO, DCAA, THIRD_PARTY
    acceptanceBy:    "CO",
    corName:         "",
    inspectionStds:  "",
    deliverableList: "",
    rejectionProc:   "standard",
    testReqs:        false,
    testDetails:     "",
    finalAcceptance: "Written acceptance by the Contracting Officer or designated COR within 30 days of delivery.",
    warrantyPeriod:  "",
    customE:         "",
  });
  const set = (k, v) => setE(ee => ({ ...ee, [k]: v }));
  const text = useMemo(() => buildSectionE(e, intake), [e, intake]);

  const left = (
    <>
      {lbl("Inspection Point")}
      <select style={inp} value={e.inspectionPoint} onChange={ev => set("inspectionPoint", ev.target.value)}>
        <option value="DESTINATION">Destination (Government inspects at delivery point)</option>
        <option value="ORIGIN">Origin (Government inspects at contractor's facility)</option>
        <option value="BOTH">Both origin and destination</option>
      </select>

      {lbl("Acceptance Point")}
      <select style={inp} value={e.acceptancePoint} onChange={ev => set("acceptancePoint", ev.target.value)}>
        <option value="DESTINATION">Destination</option>
        <option value="ORIGIN">Origin</option>
      </select>

      {lbl("Inspection By")}
      <select style={inp} value={e.inspectionBy} onChange={ev => set("inspectionBy", ev.target.value)}>
        <option value="COR">COR (Contracting Officer Representative)</option>
        <option value="CO">Contracting Officer</option>
        <option value="TECH">Technical Representative</option>
        <option value="DCAA">DCAA (cost-type contracts)</option>
        <option value="THIRD_PARTY">Third-party inspector</option>
      </select>

      {lbl("Acceptance By")}
      <select style={inp} value={e.acceptanceBy} onChange={ev => set("acceptanceBy", ev.target.value)}>
        <option value="CO">Contracting Officer</option>
        <option value="COR">COR (delegated by CO)</option>
      </select>

      {lbl("COR Name")}
      <input style={inp} value={e.corName} onChange={ev => set("corName", ev.target.value)} placeholder="COR name for inspection/acceptance" />

      {lbl("Inspection Standards / Criteria")}
      <textarea style={ta} value={e.inspectionStds} onChange={ev => set("inspectionStds", ev.target.value)} rows={3}
        placeholder="Describe the criteria by which deliverables will be inspected and evaluated..." />

      {lbl("Key Deliverables Subject to Inspection")}
      <textarea style={ta} value={e.deliverableList} onChange={ev => set("deliverableList", ev.target.value)} rows={3}
        placeholder="List deliverables or reference CDRLs/Section F..." />

      {lbl("Rejection Procedure")}
      <select style={inp} value={e.rejectionProc} onChange={ev => set("rejectionProc", ev.target.value)}>
        <option value="standard">Standard — written notice, contractor corrects within 30 days</option>
        <option value="strict">Strict — written notice, contractor corrects within 15 days or default</option>
        <option value="custom">Custom (specify in additional requirements)</option>
      </select>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
        <div onClick={() => set("testReqs", !e.testReqs)}
          style={{ width:13, height:13, border:`1px solid ${e.testReqs ? C.blue : "#2a4a6a"}`, borderRadius:2,
                   background: e.testReqs ? C.blue : "transparent", cursor:"pointer", flexShrink:0,
                   display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>
          {e.testReqs ? "✓" : ""}
        </div>
        <span style={{ fontSize:10, color:C.dim }}>Testing / demonstration requirements</span>
      </div>
      {e.testReqs && (<>
        {lbl("Testing Requirements")}
        <textarea style={ta} value={e.testDetails} onChange={ev => set("testDetails", ev.target.value)} rows={2}
          placeholder="Describe testing, demonstration, or acceptance testing requirements..." />
      </>)}

      {lbl("Final Acceptance Statement")}
      <textarea style={ta} value={e.finalAcceptance} onChange={ev => set("finalAcceptance", ev.target.value)} rows={2} />

      {lbl("Warranty Period (if applicable)")}
      <input style={inp} value={e.warrantyPeriod} onChange={ev => set("warrantyPeriod", ev.target.value)}
        placeholder="e.g., 12 months after final acceptance (leave blank if N/A)" />

      {lbl("Additional Requirements")}
      <textarea style={ta} value={e.customE} onChange={ev => set("customE", ev.target.value)} rows={2} placeholder="Additional inspection/acceptance language..." />
    </>
  );

  return <TwoPane left={left} right={text} label="SECTION E — INSPECTION AND ACCEPTANCE" onSave={onGenerated} />;
}

function buildSectionE(e, intake) {
  let idx = 1;
  const sec = (title, body) => { const s = `E.${idx}  ${title}\n\n${body}\n\n`; idx++; return s; };
  let t = `SECTION E — INSPECTION AND ACCEPTANCE\n${"═".repeat(70)}\n\n`;

  const inspectMap = { COR:"Contracting Officer Representative (COR)", CO:"Contracting Officer", TECH:"Technical Representative", DCAA:"Defense Contract Audit Agency (DCAA)", THIRD_PARTY:"designated third-party inspector" };
  const acceptMap  = { CO:"Contracting Officer", COR:"Contracting Officer Representative (COR) as delegated by the CO" };

  t += sec("INSPECTION",
    `(a) Inspection Point: ${e.inspectionPoint === "DESTINATION" ? "Destination" : e.inspectionPoint === "ORIGIN" ? "Origin" : "Origin and Destination"}\n\n` +
    `(b) The Government reserves the right to inspect all work, deliverables, and services ` +
    `performed under this contract. Inspection will be performed by the ${inspectMap[e.inspectionBy] || "COR"}` +
    (e.corName ? `, ${e.corName}` : "") + `.\n\n` +
    (e.inspectionStds ? `(c) Inspection Standards:\n${e.inspectionStds}` : `(c) Deliverables will be inspected for conformance with the Statement of Work, contract specifications, and applicable standards.`)
  );

  t += sec("ACCEPTANCE",
    `(a) Acceptance Point: ${e.acceptancePoint}\n\n` +
    `(b) Acceptance Authority: ${acceptMap[e.acceptanceBy] || "Contracting Officer"}\n\n` +
    `(c) ${e.finalAcceptance}\n\n` +
    `(d) Acceptance by the Government does not relieve the contractor of responsibility for ` +
    `latent defects, fraud, or gross mistakes amounting to fraud.`
  );

  if (e.deliverableList) {
    t += sec("DELIVERABLES SUBJECT TO INSPECTION AND ACCEPTANCE",
      `The following deliverables are subject to Government inspection and acceptance:\n\n${e.deliverableList}`
    );
  }

  const rejMap = {
    standard: "In the event of rejection, the Government will provide written notice specifying the deficiencies. The contractor shall correct all deficiencies and resubmit within 30 calendar days at no additional cost to the Government.",
    strict:   "In the event of rejection, the Government will provide written notice specifying the deficiencies. The contractor shall correct all deficiencies and resubmit within 15 calendar days. Failure to correct within the specified timeframe may constitute grounds for default under FAR 52.249-8.",
    custom:   "[See additional requirements]",
  };
  t += sec("REJECTION AND CORRECTION", rejMap[e.rejectionProc]);

  if (e.testReqs && e.testDetails) {
    t += sec("TESTING AND DEMONSTRATION REQUIREMENTS", e.testDetails);
  }

  if (e.warrantyPeriod) {
    t += sec("WARRANTY",
      `The contractor warrants that all deliverables will conform to contract requirements for ` +
      `a period of ${e.warrantyPeriod}. During the warranty period, the contractor shall ` +
      `correct any defects or nonconformances at no additional cost to the Government.`
    );
  }

  if (e.customE) t += sec("ADDITIONAL REQUIREMENTS", e.customE);

  // FAR clause references
  t += `${"─".repeat(40)}\n`;
  t += `Applicable clauses:\n`;
  if (intake?.isCommercial === "YES") {
    t += `  FAR 52.212-4(a) — Inspection/Acceptance (Commercial)\n`;
  } else if (e.reqType === "SERVICES") {
    t += `  FAR 52.246-4 — Inspection of Services—Fixed-Price\n`;
  } else {
    t += `  FAR 52.246-2 — Inspection of Supplies—Fixed-Price\n`;
  }
  t += `  NFS 1852.246-70 — Mission Critical Space Systems — Inspection (if applicable)\n`;

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION F — DELIVERIES OR PERFORMANCE
// ═══════════════════════════════════════════════════════════════════

const DELIVERABLE_TYPES = [
  { id: "report",    label: "Written Report / Study" },
  { id: "plan",      label: "Plan / Schedule" },
  { id: "briefing",  label: "Briefing / Presentation" },
  { id: "software",  label: "Software / Code" },
  { id: "data",      label: "Data / Database" },
  { id: "hardware",  label: "Hardware / Equipment" },
  { id: "service",   label: "Ongoing Service (recurring)" },
  { id: "meeting",   label: "Meeting / Status Review" },
  { id: "cdrl",      label: "CDRL Item" },
  { id: "custom",    label: "Custom" },
];

export function SectionFBuilder({ intake, onGenerated }) {
  const [f, setF] = useState({
    popStart:        "",
    popEnd:          "",
    popNote:         intake?.pop || "",
    placeOfPerf:     intake?.center || "NASA Ames Research Center, Moffett Field, CA 94035",
    remoteWork:      false,
    remotePercent:   "0",
    deliverables:    [
      { id: 1, type: "report", title: "Monthly Status Report", clin: "", due: "10th of each month", format: "Electronic — PDF via email", qty: "12", notes: "" },
      { id: 2, type: "report", title: "Final Report", clin: "", due: "30 days after contract completion", format: "Electronic — PDF and Word", qty: "1", notes: "" },
    ],
    optionExercise:  "Options shall be exercised by written unilateral modification. The Government is not obligated to exercise any option.",
    stopWork:        true,
    customF:         "",
  });

  const set = (k, v) => setF(ff => ({ ...ff, [k]: v }));

  function addDeliverable() {
    setF(ff => ({
      ...ff,
      deliverables: [...ff.deliverables, {
        id: Date.now(), type: "report", title: "", clin: "", due: "", format: "Electronic — PDF", qty: "1", notes: "",
      }],
    }));
  }

  function updateDel(id, key, val) {
    setF(ff => ({ ...ff, deliverables: ff.deliverables.map(d => d.id === id ? { ...d, [key]: val } : d) }));
  }

  function removeDel(id) {
    setF(ff => ({ ...ff, deliverables: ff.deliverables.filter(d => d.id !== id) }));
  }

  const text = useMemo(() => buildSectionF(f, intake), [f, intake]);

  const left = (
    <>
      <div style={{ fontSize:10, color:C.blue, marginBottom:4 }}>PERIOD OF PERFORMANCE</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <div>
          {lbl("Start Date")}
          <input style={inp} type="date" value={f.popStart} onChange={e => set("popStart", e.target.value)} />
        </div>
        <div>
          {lbl("End Date")}
          <input style={inp} type="date" value={f.popEnd} onChange={e => set("popEnd", e.target.value)} />
        </div>
      </div>
      {lbl("PoP Note (e.g., Base + 4 options)")}
      <input style={inp} value={f.popNote} onChange={e => set("popNote", e.target.value)} />

      <div style={{ fontSize:10, color:C.blue, marginBottom:4, marginTop:12 }}>PLACE OF PERFORMANCE</div>
      {lbl("Primary Place of Performance")}
      <textarea style={ta} value={f.placeOfPerf} onChange={e => set("placeOfPerf", e.target.value)} rows={2} />
      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
        <div onClick={() => set("remoteWork", !f.remoteWork)}
          style={{ width:13, height:13, border:`1px solid ${f.remoteWork ? C.green : "#2a4a6a"}`, borderRadius:2,
                   background: f.remoteWork ? C.green : "transparent", cursor:"pointer", flexShrink:0,
                   display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>
          {f.remoteWork ? "✓" : ""}
        </div>
        <span style={{ fontSize:10, color:C.dim }}>Remote / telework authorized</span>
      </div>
      {f.remoteWork && (<>
        {lbl("Remote Work Percentage")}
        <input style={inp} value={f.remotePercent} onChange={e => set("remotePercent", e.target.value)} placeholder="e.g., Up to 50%" />
      </>)}

      <div style={{ fontSize:10, color:C.green, marginBottom:4, marginTop:14 }}>DELIVERABLES</div>
      {f.deliverables.map((del, i) => (
        <div key={del.id} style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:4, padding:"8px 10px", marginBottom:6 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <span style={{ fontSize:10, color:C.blue, fontWeight:"bold" }}>#{i+1}</span>
            <button onClick={() => removeDel(del.id)} style={{ background:"none", border:"none", color:"#4a2a2a", cursor:"pointer", fontSize:13 }}>×</button>
          </div>
          <select value={del.type} onChange={e => updateDel(del.id,"type",e.target.value)} style={{ ...inp, marginBottom:4 }}>
            {DELIVERABLE_TYPES.map(dt => <option key={dt.id} value={dt.id}>{dt.label}</option>)}
          </select>
          <input value={del.title} onChange={e => updateDel(del.id,"title",e.target.value)}
            placeholder="Deliverable title *" style={{ ...inp, marginBottom:4 }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
            <input value={del.clin} onChange={e => updateDel(del.id,"clin",e.target.value)}
              placeholder="CLIN (e.g., 0001)" style={{ ...inp, marginBottom:4 }} />
            <input value={del.qty} onChange={e => updateDel(del.id,"qty",e.target.value)}
              placeholder="Qty" style={{ ...inp, marginBottom:4 }} />
          </div>
          <input value={del.due} onChange={e => updateDel(del.id,"due",e.target.value)}
            placeholder="Due date / schedule *" style={{ ...inp, marginBottom:4 }} />
          <input value={del.format} onChange={e => updateDel(del.id,"format",e.target.value)}
            placeholder="Delivery format / medium" style={{ ...inp, marginBottom:4 }} />
          <input value={del.notes} onChange={e => updateDel(del.id,"notes",e.target.value)}
            placeholder="Notes (optional)" style={{ ...inp }} />
        </div>
      ))}
      <button onClick={addDeliverable}
        style={{ width:"100%", background:C.bg3, border:`1px dashed ${C.border}`, color:C.muted,
                 padding:"6px", borderRadius:3, cursor:"pointer", fontSize:10, marginBottom:8 }}>
        + ADD DELIVERABLE
      </button>

      {lbl("Option Exercise Language")}
      <textarea style={ta} value={f.optionExercise} onChange={e => set("optionExercise", e.target.value)} rows={2} />

      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
        <div onClick={() => set("stopWork", !f.stopWork)}
          style={{ width:13, height:13, border:`1px solid ${f.stopWork ? C.yellow : "#2a4a6a"}`, borderRadius:2,
                   background: f.stopWork ? C.yellow : "transparent", cursor:"pointer", flexShrink:0,
                   display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>
          {f.stopWork ? "✓" : ""}
        </div>
        <span style={{ fontSize:10, color:C.dim }}>Include stop-work order provision</span>
      </div>

      {lbl("Additional Requirements")}
      <textarea style={ta} value={f.customF} onChange={e => set("customF", e.target.value)} rows={2} placeholder="Additional delivery/performance language..." />
    </>
  );

  return <TwoPane left={left} right={text} label="SECTION F — DELIVERIES OR PERFORMANCE" onSave={onGenerated} />;
}

function buildSectionF(f, intake) {
  let idx = 1;
  const sec = (title, body) => { const s = `F.${idx}  ${title}\n\n${body}\n\n`; idx++; return s; };
  let t = `SECTION F — DELIVERIES OR PERFORMANCE\n${"═".repeat(70)}\n\n`;

  // PoP
  const popStart = f.popStart ? new Date(f.popStart+"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[START DATE]";
  const popEnd   = f.popEnd   ? new Date(f.popEnd  +"T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}) : "[END DATE]";
  t += sec("PERIOD OF PERFORMANCE",
    `Base Period: ${popStart} through ${popEnd}` +
    (f.popNote ? `\n\n${f.popNote}` : "") +
    `\n\nTime is of the essence in the performance of this contract. The contractor shall begin ` +
    `performance on the effective date of the contract and shall complete all work within the ` +
    `stated period of performance.`
  );

  // Place of performance
  t += sec("PLACE OF PERFORMANCE",
    `Primary: ${f.placeOfPerf}\n\n` +
    (f.remoteWork
      ? `Remote/Telework: Authorized up to ${f.remotePercent || "a percentage to be determined"} of the time, ` +
        `subject to COR approval and NASA telework policies.`
      : `All work shall be performed at the place(s) of performance stated above unless otherwise approved in writing by the Contracting Officer.`)
  );

  // Deliverables table
  if (f.deliverables.length > 0) {
    let delivText = `The contractor shall deliver the following items in accordance with the schedule below:\n\n`;
    delivText += `${"─".repeat(70)}\n`;
    delivText += `  #  DELIVERABLE                         CLIN   QTY   DUE DATE / SCHEDULE\n`;
    delivText += `${"─".repeat(70)}\n`;
    f.deliverables.forEach((d, i) => {
      if (!d.title) return;
      delivText += `  ${String(i+1).padEnd(2)} ${d.title.slice(0,34).padEnd(35)} ${(d.clin||"—").padEnd(6)} ${(d.qty||"1").padEnd(5)} ${d.due || "[TBD]"}\n`;
      if (d.format) delivText += `     Format: ${d.format}\n`;
      if (d.notes)  delivText += `     Notes:  ${d.notes}\n`;
    });
    delivText += `${"─".repeat(70)}\n`;
    t += sec("DELIVERABLES AND DELIVERY SCHEDULE", delivText);
  }

  if (f.optionExercise) {
    t += sec("OPTION PERIODS", f.optionExercise);
  }

  if (f.stopWork) {
    t += sec("STOP-WORK ORDER",
      `The Contracting Officer may, at any time, by written order to the contractor, require ` +
      `the contractor to stop all, or any part, of the work called for by this contract for ` +
      `a period of up to 90 days after the order is delivered to the contractor, and for any ` +
      `further period to which the parties may agree. See FAR 52.242-15, Stop-Work Order.`
    );
  }

  if (f.customF) t += sec("ADDITIONAL REQUIREMENTS", f.customF);
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// COMBINED UCF BUILDER — tabs for D, E, F
// ═══════════════════════════════════════════════════════════════════

export default function UCFBuilder({ intake, onSectionSaved }) {
  const [activeSection, setActiveSection] = useState("D");

  function save(section, text) {
    const sk = "cpas_docs_" + (intake?.reqTitle || "x");
    try {
      const ex = JSON.parse(localStorage.getItem(sk) || "[]");
      const docType = "SECTION_" + section;
      const label = `Section ${section} — ${ {D:"Packaging & Marking", E:"Inspection & Acceptance", F:"Deliveries & Performance"}[section] }`;
      localStorage.setItem(sk, JSON.stringify([...ex.filter(d => d.docType !== docType), { docType, label, content: text, ts: Date.now() }]));
    } catch(e) {}
    onSectionSaved && onSectionSaved(section, text);
    alert(`Section ${section} saved to NEAR package.`);
  }

  const tabs = [
    { id: "D", label: "Section D", sub: "Packaging & Marking",        color: C.yellow },
    { id: "E", label: "Section E", sub: "Inspection & Acceptance",    color: C.green  },
    { id: "F", label: "Section F", sub: "Deliveries & Performance",   color: C.blue   },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text, background: C.bg }}>
      <div style={{ display: "flex", gap: 2, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            style={{ padding: "6px 16px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: "bold",
                     background: activeSection === tab.id ? "#0a2a4a" : C.bg3,
                     border: `1px solid ${activeSection === tab.id ? tab.color : C.border}`,
                     color: activeSection === tab.id ? tab.color : C.dim }}>
            {tab.label} — {tab.sub}
          </button>
        ))}
      </div>
      {activeSection === "D" && <SectionDBuilder intake={intake} onGenerated={t => save("D", t)} />}
      {activeSection === "E" && <SectionEBuilder intake={intake} onGenerated={t => save("E", t)} />}
      {activeSection === "F" && <SectionFBuilder intake={intake} onGenerated={t => save("F", t)} />}
    </div>
  );
}
