// CPAS Acquisition Tools — Segment 3
// Section H (Special Contract Requirements) builder
// Section G (Contract Administration Data) builder
// BPA Call Workflow — dedicated lane with call order generator
// ANOSCA auto-trigger logic and form pre-population

import React, { useState, useMemo } from "react";

const FONT_AT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const C = {
  bg: "#f5f7fa", bg2: "#ffffff", bg3: "#eef1f6",
  border: "#dde3ef", blue: "#1a3a6e", text: "#1a2332",
  muted: "#6b7a99", dim: "#8896b0", green: "#0f6e56",
  yellow: "#854f0b", red: "#a32d2d", purple: "#5a3a9e",
};

const inp = {
  background: "#ffffff", border: "1px solid #dde3ef", color: "#1a2332",
  padding: "7px 10px", borderRadius: 6, fontSize: 12,
  width: "100%", boxSizing: "border-box",
  fontFamily: FONT_AT,
};
const ta = { ...inp, resize: "vertical", minHeight: 60, lineHeight: 1.5 };
const lbl = (t, req) => (
  <div style={{ fontSize: 9, color: req ? C.yellow : C.muted, letterSpacing: 1, marginBottom: 3, marginTop: 7 }}>
    {t}{req ? " *" : ""}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// SECTION G BUILDER — Contract Administration Data
// ═══════════════════════════════════════════════════════════════════

export function SectionGBuilder({ intake, onGenerated }) {
  const [data, setData] = useState({
    coName:          intake?.coName       || "",
    coEmail:         intake?.coEmail      || "",
    coPhone:         "",
    coAddress:       intake?.center       || "NASA Ames Research Center\n Moffett Field, CA 94035",
    corName:         "",
    corEmail:        intake?.techRepEmail || "",
    corPhone:        "",
    acoName:         "",
    acoOffice:       "",
    paymentOffice:   "NASA Shared Services Center (NSSC)\nFinancial Management Division\nStennis Space Center, MS 39529",
    invoiceAddress:  "Submit invoices electronically via IPP (Invoice Processing Platform) at www.ipp.gov",
    invoiceDeadline: "30",
    fundCite:        intake?.fundCite     || "",
    prNumber:        intake?.prNumber     || "",
    contractNumber:  intake?.contractNumber || "",
    deliveryAddress: intake?.center       || "",
    acceptancePoint: "Destination — COR",
    reportingReqs:   "Monthly status reports due the 10th of each month.\nFinal report due 30 days after contract completion.",
    keyPersonnel:    "",
    invoiceInstructions: "Invoices shall reference the contract number, CLIN, and period covered. Submit to NSSC via IPP.",
  });
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const text = useMemo(() => buildSectionGText(data, intake), [data, intake]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", minHeight: 500 }}>
        <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "70vh" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>SECTION G — CONTRACT ADMINISTRATION</div>

          <div style={{ fontSize: 10, color: C.blue, marginBottom: 4, marginTop: 8 }}>CONTRACTING OFFICER</div>
          {lbl("Name", true)}<input style={inp} value={data.coName} onChange={e => set("coName",e.target.value)} placeholder="CO Full Name" />
          {lbl("Email", true)}<input style={inp} value={data.coEmail} onChange={e => set("coEmail",e.target.value)} placeholder="co@nasa.gov" />
          {lbl("Phone")}<input style={inp} value={data.coPhone} onChange={e => set("coPhone",e.target.value)} placeholder="(650) 604-XXXX" />
          {lbl("Office Address")}<textarea style={ta} value={data.coAddress} rows={3} onChange={e => set("coAddress",e.target.value)} />

          <div style={{ fontSize: 10, color: C.green, marginBottom: 4, marginTop: 12 }}>CONTRACTING OFFICER REPRESENTATIVE (COR)</div>
          {lbl("COR Name", true)}<input style={inp} value={data.corName} onChange={e => set("corName",e.target.value)} placeholder="COR Full Name" />
          {lbl("COR Email")}<input style={inp} value={data.corEmail} onChange={e => set("corEmail",e.target.value)} placeholder="cor@nasa.gov" />
          {lbl("COR Phone")}<input style={inp} value={data.corPhone} onChange={e => set("corPhone",e.target.value)} placeholder="(650) 604-XXXX" />

          <div style={{ fontSize: 10, color: C.yellow, marginBottom: 4, marginTop: 12 }}>ADMINISTRATIVE CO (ACO) — if different</div>
          {lbl("ACO Name")}<input style={inp} value={data.acoName} onChange={e => set("acoName",e.target.value)} placeholder="ACO Name (if applicable)" />
          {lbl("ACO Office")}<input style={inp} value={data.acoOffice} onChange={e => set("acoOffice",e.target.value)} placeholder="DCMA or other office" />

          <div style={{ fontSize: 10, color: C.purple, marginBottom: 4, marginTop: 12 }}>PAYMENT</div>
          {lbl("Payment Office")}<textarea style={ta} value={data.paymentOffice} rows={3} onChange={e => set("paymentOffice",e.target.value)} />
          {lbl("Invoice Submission Instructions")}<textarea style={ta} value={data.invoiceAddress} rows={2} onChange={e => set("invoiceAddress",e.target.value)} />
          {lbl("Payment Due (days after invoice)")}<input style={inp} value={data.invoiceDeadline} onChange={e => set("invoiceDeadline",e.target.value)} placeholder="30" />
          {lbl("Invoice Instructions")}<textarea style={ta} value={data.invoiceInstructions} rows={3} onChange={e => set("invoiceInstructions",e.target.value)} />

          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, marginTop: 12 }}>ADMINISTRATIVE DATA</div>
          {lbl("Accounting / Fund Cite")}<input style={inp} value={data.fundCite} onChange={e => set("fundCite",e.target.value)} placeholder="Fund cite / ACRN" />
          {lbl("PR Number")}<input style={inp} value={data.prNumber} onChange={e => set("prNumber",e.target.value)} />
          {lbl("Delivery/Place of Performance")}<textarea style={ta} value={data.deliveryAddress} rows={2} onChange={e => set("deliveryAddress",e.target.value)} />
          {lbl("Acceptance Point")}<input style={inp} value={data.acceptancePoint} onChange={e => set("acceptancePoint",e.target.value)} />

          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, marginTop: 12 }}>REPORTING REQUIREMENTS</div>
          {lbl("Progress / Status Reporting")}<textarea style={ta} value={data.reportingReqs} rows={3} onChange={e => set("reportingReqs",e.target.value)} />
          {lbl("Key Personnel (names and roles)")}<textarea style={ta} value={data.keyPersonnel} rows={3} onChange={e => set("keyPersonnel",e.target.value)} placeholder="e.g., Program Manager: [Name], Lead Engineer: [Name]" />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: copied ? C.green : C.blue, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              {copied ? "✓ COPIED" : "COPY SECTION G"}
            </button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background: "#e8f7f0", border: "1px solid #1a6a3a", color: C.green, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              SAVE TO PACKAGE
            </button>
          </div>
          <pre style={{ flex: 1, padding: 16, fontSize: 10, color: C.dim, overflow: "auto", maxHeight: "62vh", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildSectionGText(data, intake) {
  let t = `SECTION G — CONTRACT ADMINISTRATION DATA\n${"═".repeat(70)}\n\n`;
  t += `G.1  CONTRACTING OFFICER\n\n`;
  t += `     Name:    ${data.coName || "[CO NAME]"}\n`;
  t += `     Email:   ${data.coEmail || "[CO EMAIL]"}\n`;
  if (data.coPhone) t += `     Phone:   ${data.coPhone}\n`;
  t += `     Address: ${data.coAddress}\n\n`;
  t += `     The Contracting Officer is the only individual authorized to change the terms `;
  t += `and conditions of this contract. Technical direction may be provided by the COR within `;
  t += `the limits of NFS 1852.242-70.\n\n`;

  t += `G.2  CONTRACTING OFFICER REPRESENTATIVE (COR)\n\n`;
  t += `     Name:    ${data.corName || "[COR NAME]"}\n`;
  if (data.corEmail) t += `     Email:   ${data.corEmail}\n`;
  if (data.corPhone) t += `     Phone:   ${data.corPhone}\n`;
  t += `\n     The COR is authorized to provide technical direction within the scope of the contract `;
  t += `and to inspect and accept deliverables. The COR is NOT authorized to change the price, `;
  t += `period of performance, or other terms and conditions of the contract.\n\n`;

  if (data.acoName) {
    t += `G.3  ADMINISTRATIVE CONTRACTING OFFICER (ACO)\n\n`;
    t += `     Name:   ${data.acoName}\n`;
    if (data.acoOffice) t += `     Office: ${data.acoOffice}\n`;
    t += `\n`;
  }

  t += `G.${data.acoName ? 4 : 3}  PAYMENT AND INVOICING\n\n`;
  t += `     Payment Office: ${data.paymentOffice}\n\n`;
  t += `     Invoice Submission: ${data.invoiceAddress}\n\n`;
  t += `     Payment Terms: Net ${data.invoiceDeadline || 30} days from receipt of proper invoice.\n\n`;
  t += `     ${data.invoiceInstructions}\n\n`;

  t += `G.${data.acoName ? 5 : 4}  ACCOUNTING DATA\n\n`;
  if (data.fundCite) t += `     Appropriation/Fund Cite: ${data.fundCite}\n`;
  if (data.prNumber) t += `     Requisition Number: ${data.prNumber}\n`;
  t += `\n`;

  t += `G.${data.acoName ? 6 : 5}  PLACE OF PERFORMANCE AND DELIVERY\n\n`;
  t += `     ${data.deliveryAddress}\n\n`;
  t += `     Acceptance Point: ${data.acceptancePoint}\n\n`;

  if (data.reportingReqs) {
    t += `G.${data.acoName ? 7 : 6}  REPORTING REQUIREMENTS\n\n`;
    t += `     ${data.reportingReqs.replace(/\n/g, "\n     ")}\n\n`;
  }

  if (data.keyPersonnel) {
    t += `G.${data.acoName ? 8 : 7}  KEY PERSONNEL\n\n`;
    t += `     ${data.keyPersonnel.replace(/\n/g, "\n     ")}\n\n`;
    t += `     Substitution of key personnel requires prior written approval of the Contracting Officer.\n\n`;
  }

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION H BUILDER — Special Contract Requirements
// ═══════════════════════════════════════════════════════════════════

const H_PROVISIONS = [
  { id: "security",    label: "Security Requirements",              default: true  },
  { id: "piv",         label: "Personal Identity Verification (PIV)", default: true },
  { id: "keyPersonnel",label: "Key Personnel",                      default: true  },
  { id: "oral",        label: "Oral Presentation Requirements",     default: false },
  { id: "nda",         label: "Non-Disclosure / Proprietary Data",  default: false },
  { id: "conflict",    label: "Organizational Conflict of Interest (OCI)", default: false },
  { id: "subApproval", label: "Subcontractor Approval",             default: false },
  { id: "govFurnished",label: "Government-Furnished Equipment/Facilities", default: false },
  { id: "travel",      label: "Travel Requirements",                default: false },
  { id: "508",         label: "Section 508 Accessibility",          default: false },
  { id: "itar",        label: "Export Control / ITAR",              default: false },
  { id: "cpars",       label: "Contractor Performance Assessment (CPARS)", default: true },
  { id: "transition",  label: "Phase-In / Transition Requirements", default: false },
  { id: "safety",      label: "Safety and Health Plan",             default: false },
  { id: "publicAffairs",label: "Public Affairs / Media",            default: false },
  { id: "cyber",       label: "Cybersecurity / FISMA Requirements", default: false },
];

export function SectionHBuilder({ intake, onGenerated }) {
  const [active, setActive] = useState(
    Object.fromEntries(H_PROVISIONS.map(p => [p.id, p.default]))
  );
  const [details, setDetails] = useState({
    securityLevel:     "Public Trust (Moderate Risk)",
    securityTimeline:  "45",
    keyPersonnelList:  "Program Manager, Lead Systems Engineer",
    keyPersonnelSub:   "Contractor shall submit written request for substitution 30 days in advance.",
    gfeList:           "",
    travelBudget:      "",
    travelApproval:    "Advance written approval of the COR is required for all travel.",
    ociMitigation:     "",
    transitionDays:    "60",
    safetyPlanDue:     "30 days after award",
    cyberStandard:     "NIST SP 800-171 / CMMC Level 2",
    oralPresentationDetails: "Offerors selected for oral presentations will be notified in writing. Presentations shall not exceed 2 hours.",
    custom:            "",
  });
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setDetails(d => ({ ...d, [k]: v }));
  const text = useMemo(() => buildSectionHText(active, details, intake), [active, details, intake]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", minHeight: 500 }}>
        <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "70vh" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>SECTION H — SPECIAL REQUIREMENTS</div>

          {/* Toggle provisions */}
          <div style={{ marginBottom: 12 }}>
            {H_PROVISIONS.map(p => (
              <div key={p.id} onClick={() => setActive(a => ({ ...a, [p.id]: !a[p.id] }))}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", cursor: "pointer",
                         background: active[p.id] ? "#e8f7f0" : "transparent",
                         border: `1px solid ${active[p.id] ? "#9fe1cb" : "transparent"}`,
                         borderRadius: 3, marginBottom: 3 }}>
                <div style={{ width: 13, height: 13, border: `1px solid ${active[p.id] ? C.green : "#8896b0"}`,
                               borderRadius: 2, background: active[p.id] ? C.green : "transparent",
                               flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                               fontSize: 9, color: "#fff" }}>{active[p.id] ? "✓" : ""}</div>
                <span style={{ fontSize: 10, color: active[p.id] ? C.text : C.dim }}>{p.label}</span>
              </div>
            ))}
          </div>

          {/* Detail fields for active provisions */}
          {active.security && (<>
            <div style={{ fontSize: 10, color: C.blue, marginTop: 10 }}>SECURITY DETAILS</div>
            {lbl("Security Level Required")}
            <select value={details.securityLevel} onChange={e => set("securityLevel",e.target.value)} style={inp}>
              <option>Public Trust (Low Risk)</option>
              <option>Public Trust (Moderate Risk)</option>
              <option>National Security Clearance — Secret</option>
              <option>National Security Clearance — Top Secret</option>
              <option>Top Secret / SCI</option>
              <option>No security clearance required</option>
            </select>
            {lbl("Background Investigation Timeline (days)")}
            <input style={inp} value={details.securityTimeline} onChange={e => set("securityTimeline",e.target.value)} placeholder="45" />
          </>)}

          {active.keyPersonnel && (<>
            <div style={{ fontSize: 10, color: C.green, marginTop: 10 }}>KEY PERSONNEL</div>
            {lbl("Key Personnel Positions (comma separated)")}
            <textarea style={ta} value={details.keyPersonnelList} rows={2} onChange={e => set("keyPersonnelList",e.target.value)} />
            {lbl("Substitution Requirements")}
            <textarea style={ta} value={details.keyPersonnelSub} rows={2} onChange={e => set("keyPersonnelSub",e.target.value)} />
          </>)}

          {active.govFurnished && (<>
            <div style={{ fontSize: 10, color: C.yellow, marginTop: 10 }}>GOVERNMENT-FURNISHED ITEMS</div>
            {lbl("List of GFE/GFF")}
            <textarea style={ta} value={details.gfeList} rows={3} onChange={e => set("gfeList",e.target.value)} placeholder="Describe equipment, facilities, or data to be furnished by the Government." />
          </>)}

          {active.travel && (<>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 10 }}>TRAVEL</div>
            {lbl("Travel Budget / Not-to-Exceed")}
            <input style={inp} value={details.travelBudget} onChange={e => set("travelBudget",e.target.value)} placeholder="e.g., $25,000 NTE" />
            {lbl("Approval Requirements")}
            <textarea style={ta} value={details.travelApproval} rows={2} onChange={e => set("travelApproval",e.target.value)} />
          </>)}

          {active.conflict && (<>
            <div style={{ fontSize: 10, color: C.red, marginTop: 10 }}>OCI</div>
            {lbl("OCI Mitigation Plan Requirements")}
            <textarea style={ta} value={details.ociMitigation} rows={3} onChange={e => set("ociMitigation",e.target.value)} placeholder="Describe OCI concerns and mitigation plan requirements." />
          </>)}

          {active.transition && (<>
            <div style={{ fontSize: 10, color: C.purple, marginTop: 10 }}>TRANSITION</div>
            {lbl("Phase-In Period (days)")}
            <input style={inp} value={details.transitionDays} onChange={e => set("transitionDays",e.target.value)} placeholder="60" />
          </>)}

          {active.safety && (<>
            <div style={{ fontSize: 10, color: C.yellow, marginTop: 10 }}>SAFETY</div>
            {lbl("Safety Plan Due After Award")}
            <input style={inp} value={details.safetyPlanDue} onChange={e => set("safetyPlanDue",e.target.value)} />
          </>)}

          {active.cyber && (<>
            <div style={{ fontSize: 10, color: C.blue, marginTop: 10 }}>CYBERSECURITY</div>
            {lbl("Cybersecurity Standard")}
            <input style={inp} value={details.cyberStandard} onChange={e => set("cyberStandard",e.target.value)} />
          </>)}

          {active.oral && (<>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 10 }}>ORAL PRESENTATIONS</div>
            {lbl("Oral Presentation Instructions")}
            <textarea style={ta} value={details.oralPresentationDetails} rows={3} onChange={e => set("oralPresentationDetails",e.target.value)} />
          </>)}

          <div style={{ fontSize: 10, color: C.muted, marginTop: 12 }}>ADDITIONAL CUSTOM REQUIREMENTS</div>
          {lbl("Custom Section H Language")}
          <textarea style={ta} value={details.custom} rows={4} onChange={e => set("custom",e.target.value)} placeholder="Add any additional special contract requirements..." />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: copied ? C.green : C.blue, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              {copied ? "✓ COPIED" : "COPY SECTION H"}
            </button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background: "#e8f7f0", border: "1px solid #1a6a3a", color: C.green, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              SAVE TO PACKAGE
            </button>
          </div>
          <pre style={{ flex: 1, padding: 16, fontSize: 10, color: C.dim, overflow: "auto", maxHeight: "62vh", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildSectionHText(active, details, intake) {
  let idx = 1;
  const sec = (title, content) => {
    const s = `H.${idx}  ${title}\n\n${content}\n\n`;
    idx++;
    return s;
  };

  let t = `SECTION H — SPECIAL CONTRACT REQUIREMENTS\n${"═".repeat(70)}\n\n`;

  if (active.security) {
    t += sec("SECURITY REQUIREMENTS",
      `(a) Security Clearance Level: ${details.securityLevel}\n\n` +
      `(b) All contractor personnel requiring access to NASA facilities or systems must receive ` +
      `a favorable background investigation determination prior to commencing work.\n\n` +
      `(c) The contractor shall initiate background investigation requests within ` +
      `${details.securityTimeline || 45} calendar days of contract award. Personnel without ` +
      `completed investigations shall not perform work requiring access to controlled areas or systems.\n\n` +
      `(d) The contractor shall immediately notify the COR and CO of any contractor personnel ` +
      `who are no longer employed or who have been denied access.`
    );
  }

  if (active.piv) {
    t += sec("PERSONAL IDENTITY VERIFICATION (PIV)",
      `Contractor personnel who require routine physical access to federally-controlled facilities ` +
      `or logical access to NASA information systems shall obtain and maintain a valid NASA PIV card ` +
      `in accordance with FAR 52.204-9 and HSPD-12. The contractor shall return all PIV cards within ` +
      `5 business days upon contract completion or personnel departure.`
    );
  }

  if (active.keyPersonnel) {
    t += sec("KEY PERSONNEL",
      `(a) The following positions are designated as key personnel for this contract:\n` +
      `     ${(details.keyPersonnelList || "Program Manager").split(",").map(p => `• ${p.trim()}`).join("\n     ")}\n\n` +
      `(b) ${details.keyPersonnelSub || "Substitution of key personnel requires prior written approval of the Contracting Officer."}\n\n` +
      `(c) The contractor shall not remove, replace, or reassign key personnel without prior ` +
      `written approval of the Contracting Officer. Unapproved substitutions may be grounds for ` +
      `termination for default.`
    );
  }

  if (active.conflict) {
    t += sec("ORGANIZATIONAL CONFLICT OF INTEREST (OCI)",
      `(a) The contractor warrants that, to the best of its knowledge, there are no relevant facts ` +
      `or circumstances which could give rise to an OCI as defined in FAR Subpart 9.5.\n\n` +
      `(b) The contractor shall immediately disclose any potential OCI to the Contracting Officer.\n\n` +
      `${details.ociMitigation ? `(c) OCI Mitigation Plan Requirements:\n${details.ociMitigation}` : ""}`
    );
  }

  if (active.subApproval) {
    t += sec("SUBCONTRACTOR CONSENT",
      `Prior written consent of the Contracting Officer is required before the contractor may ` +
      `award any subcontract. The contractor shall submit a subcontracting plan and obtain CO ` +
      `approval in accordance with FAR 44.2 before executing any subcontract exceeding $250,000.`
    );
  }

  if (active.govFurnished) {
    t += sec("GOVERNMENT-FURNISHED EQUIPMENT AND FACILITIES (GFE/GFF)",
      `(a) The Government will provide the following to the contractor:\n${details.gfeList || "     [List GFE/GFF items]"}\n\n` +
      `(b) GFE/GFF is provided for use under this contract only. The contractor is responsible ` +
      `for the care, use, and safekeeping of all GFE in accordance with FAR 52.245-1.`
    );
  }

  if (active.travel) {
    t += sec("TRAVEL",
      `(a) Travel ${details.travelBudget ? `not-to-exceed ${details.travelBudget}` : "may be required"} under this contract.\n\n` +
      `(b) ${details.travelApproval}\n\n` +
      `(c) All travel shall be in accordance with the Federal Travel Regulation (FTR) and the ` +
      `Joint Travel Regulations (JTR). Travel costs shall be invoiced at actual cost with documentation.`
    );
  }

  if (active.nda) {
    t += sec("PROPRIETARY DATA AND NON-DISCLOSURE",
      `The contractor shall protect all Government and third-party proprietary information ` +
      `encountered in performance of this contract. The contractor shall execute non-disclosure ` +
      `agreements as required and shall not disclose any proprietary information to unauthorized parties.`
    );
  }

  if (active["508"]) {
    t += sec("SECTION 508 — ELECTRONIC AND INFORMATION TECHNOLOGY ACCESSIBILITY",
      `All electronic and information technology (EIT) developed, procured, or maintained under ` +
      `this contract shall comply with Section 508 of the Rehabilitation Act (29 U.S.C. § 794d) ` +
      `and the Architectural and Transportation Barriers Compliance Board's EIT Accessibility ` +
      `Standards (36 CFR Part 1194). The contractor shall provide a Section 508 compliance ` +
      `report with all EIT deliverables.`
    );
  }

  if (active.itar) {
    t += sec("EXPORT CONTROL AND INTERNATIONAL TRAFFIC IN ARMS REGULATIONS (ITAR)",
      `(a) Performance of this contract may involve export-controlled technology subject to the ` +
      `International Traffic in Arms Regulations (ITAR, 22 CFR Parts 120-130) or the Export ` +
      `Administration Regulations (EAR, 15 CFR Parts 730-774).\n\n` +
      `(b) The contractor shall comply with all applicable export control laws and regulations. ` +
      `The contractor shall obtain all required export licenses prior to performing any ` +
      `export-controlled activities under this contract.\n\n` +
      `(c) See NFS 1852.225-70, Export Licenses.`
    );
  }

  if (active.cpars) {
    t += sec("CONTRACTOR PERFORMANCE ASSESSMENT REPORTING SYSTEM (CPARS)",
      `Contractor performance under this contract will be evaluated using CPARS ` +
      `(www.cpars.gov) in accordance with FAR 42.15 and NFS 1842.1502. ` +
      `Performance evaluations will be conducted no less than annually and at contract completion. ` +
      `The contractor will have 60 days to review and comment on each evaluation.`
    );
  }

  if (active.transition) {
    t += sec("PHASE-IN AND TRANSITION REQUIREMENTS",
      `(a) A phase-in/transition period of ${details.transitionDays || 60} calendar days is provided ` +
      `at the beginning of the contract.\n\n` +
      `(b) The contractor shall submit a Transition Plan within 15 days of contract award ` +
      `covering personnel onboarding, knowledge transfer, and continuity of operations.\n\n` +
      `(c) Upon contract completion, the contractor shall cooperate fully with any successor ` +
      `contractor and shall not disrupt ongoing operations during phase-out.`
    );
  }

  if (active.safety) {
    t += sec("SAFETY AND HEALTH PLAN",
      `The contractor shall submit a Safety and Health Plan within ${details.safetyPlanDue || "30 days after award"}. ` +
      `The plan shall comply with NFS 1852.223-73 and shall address hazard identification, ` +
      `mishap reporting procedures, and emergency response protocols. ` +
      `See also NFS 1852.223-70, Safety and Health Measures and Mishap Reporting.`
    );
  }

  if (active.publicAffairs) {
    t += sec("PUBLIC AFFAIRS AND MEDIA",
      `The contractor shall not release any information pertaining to this contract to the ` +
      `public, media, or any third party without prior written approval of the NASA Public ` +
      `Affairs Office and the Contracting Officer. This includes press releases, social media, ` +
      `papers, presentations, and any other public communications related to contract work.`
    );
  }

  if (active.cyber) {
    t += sec("CYBERSECURITY REQUIREMENTS",
      `(a) The contractor shall comply with ${details.cyberStandard || "NIST SP 800-171"} for all ` +
      `contractor information systems that process, store, or transmit Controlled Unclassified ` +
      `Information (CUI) in support of this contract.\n\n` +
      `(b) The contractor shall provide a System Security Plan (SSP) within 60 days of award ` +
      `and shall immediately report any cybersecurity incidents to the CO and NASA CISO.\n\n` +
      `(c) See NFS 1852.204-76, Security Requirements for Unclassified Information Technology Resources.`
    );
  }

  if (active.oral) {
    t += sec("ORAL PRESENTATIONS", details.oralPresentationDetails);
  }

  if (details.custom) {
    t += sec("ADDITIONAL REQUIREMENTS", details.custom);
  }

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// BPA CALL WORKFLOW
// ═══════════════════════════════════════════════════════════════════

export function BPACallWorkflow({ intake, onGenerated }) {
  const [step, setStep] = useState(0);
  const [bpa, setBpa] = useState({
    bpaNumber:       "",
    bpaHolder:       "",
    bpaScope:        "",
    bpaExpiration:   "",
    remainingBalance:"",
    prNumber:        intake?.prNumber || "",
    callNumber:      "",
    reqTitle:        intake?.reqTitle || "",
    value:           intake?.value    || "",
    pop:             intake?.pop      || "",
    fundCite:        intake?.fundCite || "",
    deliverable:     "",
    placeOfPerf:     intake?.center   || "",
    callRationale:   "This BPA call is within the scope of the BPA and is the most efficient means of fulfilling this requirement.",
    priceCompetition:"Quotes obtained from BPA holder per ordering procedures. Price is fair and reasonable based on: ",
    priceMethod:     "CATALOG",
    coName:          intake?.coName   || "",
    corName:         "",
    urgency:         false,
    urgencyJustification: "",
  });

  const set = (k, v) => setBpa(d => ({ ...d, [k]: v }));

  const callText = useMemo(() => buildBPACallText(bpa), [bpa]);

  const steps = [
    { id: "BPA",    label: "BPA Info" },
    { id: "CALL",   label: "Call Details" },
    { id: "PRICE",  label: "Price / Funding" },
    { id: "REVIEW", label: "Review & Export" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.text }}>
      {/* Steps */}
      <div style={{ display: "flex", gap: 2, padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
        {steps.map((s, i) => (
          <div key={s.id} onClick={() => setStep(i)} style={{
            flex: 1, padding: "6px 10px", borderRadius: 3, textAlign: "center", cursor: "pointer", fontSize: 10,
            background: step === i ? "#eef3fc" : i < step ? "#e8f7f0" : C.bg3,
            border: `1px solid ${step === i ? C.blue : i < step ? C.green : C.border}`,
            color: step === i ? C.blue : i < step ? C.green : C.dim,
          }}>
            {i < step ? "✓ " : ""}{s.label}
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* Step 0 — BPA Info */}
        {step === 0 && (
          <div style={{ maxHeight: "58vh", overflow: "auto" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>BLANKET PURCHASE AGREEMENT DETAILS</div>
            {lbl("BPA Number", true)}
            <input style={inp} value={bpa.bpaNumber} onChange={e => set("bpaNumber",e.target.value)} placeholder="e.g., 80ARC024A0001" />
            {lbl("BPA Holder (Contractor Name)", true)}
            <input style={inp} value={bpa.bpaHolder} onChange={e => set("bpaHolder",e.target.value)} />
            {lbl("BPA Scope / Purpose")}
            <textarea style={ta} value={bpa.bpaScope} rows={2} onChange={e => set("bpaScope",e.target.value)}
              placeholder="e.g., IT support services for NASA ARC" />
            {lbl("BPA Expiration Date")}
            <input style={inp} type="date" value={bpa.bpaExpiration} onChange={e => set("bpaExpiration",e.target.value)} />
            {lbl("Remaining BPA Balance")}
            <input style={inp} value={bpa.remainingBalance} onChange={e => set("remainingBalance",e.target.value)} placeholder="e.g., $450,000" />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <div onClick={() => set("urgency", !bpa.urgency)}
                style={{ width: 14, height: 14, border: `1px solid ${bpa.urgency ? C.red : "#8896b0"}`,
                         borderRadius: 2, background: bpa.urgency ? C.red : "transparent",
                         cursor: "pointer", flexShrink: 0, display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff" }}>
                {bpa.urgency ? "✓" : ""}
              </div>
              <span style={{ fontSize: 10, color: C.dim }}>Urgent / compelling urgency (FAR 13.106-1(b)(1))</span>
            </div>
            {bpa.urgency && (<>
              {lbl("Urgency Justification")}
              <textarea style={ta} value={bpa.urgencyJustification} rows={2} onChange={e => set("urgencyJustification",e.target.value)}
                placeholder="Explain why competition cannot be obtained and urgency exists..." />
            </>)}
            <button onClick={() => setStep(1)}
              style={{ width:"100%", marginTop:12, background:"#eef3fc", border:`1px solid ${C.blue}`, color:C.blue,
                       padding:"8px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>
              NEXT →
            </button>
          </div>
        )}

        {/* Step 1 — Call Details */}
        {step === 1 && (
          <div style={{ maxHeight: "58vh", overflow: "auto" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>BPA CALL ORDER DETAILS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                {lbl("Call Number", true)}
                <input style={inp} value={bpa.callNumber} onChange={e => set("callNumber",e.target.value)} placeholder="e.g., 0001" />
              </div>
              <div>
                {lbl("PR Number")}
                <input style={inp} value={bpa.prNumber} onChange={e => set("prNumber",e.target.value)} />
              </div>
            </div>
            {lbl("Requirement Title", true)}
            <input style={inp} value={bpa.reqTitle} onChange={e => set("reqTitle",e.target.value)} />
            {lbl("Description / Deliverable")}
            <textarea style={ta} value={bpa.deliverable} rows={3} onChange={e => set("deliverable",e.target.value)}
              placeholder="Describe what is being ordered under this call..." />
            {lbl("Period of Performance")}
            <input style={inp} value={bpa.pop} onChange={e => set("pop",e.target.value)} placeholder="e.g., 10/01/2026 – 09/30/2027" />
            {lbl("Place of Performance")}
            <input style={inp} value={bpa.placeOfPerf} onChange={e => set("placeOfPerf",e.target.value)} />
            {lbl("COR Name")}
            <input style={inp} value={bpa.corName} onChange={e => set("corName",e.target.value)} />
            {lbl("Call Rationale")}
            <textarea style={ta} value={bpa.callRationale} rows={2} onChange={e => set("callRationale",e.target.value)} />
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={()=>setStep(0)} style={{ flex:1, background:C.bg3, border:`1px solid ${C.border}`, color:C.muted, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11 }}>← BACK</button>
              <button onClick={()=>setStep(2)} style={{ flex:2, background:"#eef3fc", border:`1px solid ${C.blue}`, color:C.blue, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>NEXT →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Price / Funding */}
        {step === 2 && (
          <div style={{ maxHeight: "58vh", overflow: "auto" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>PRICE AND FUNDING</div>
            {lbl("Call Value ($)", true)}
            <input style={inp} value={bpa.value} onChange={e => set("value",e.target.value)} placeholder="e.g., 50000" />
            {lbl("Accounting / Fund Cite")}
            <input style={inp} value={bpa.fundCite} onChange={e => set("fundCite",e.target.value)} />
            {lbl("Price Reasonableness Method")}
            <select value={bpa.priceMethod} onChange={e => set("priceMethod",e.target.value)} style={inp}>
              <option value="CATALOG">Catalog / Published Price List</option>
              <option value="MARKET">Market Research / Price Comparison</option>
              <option value="PRIOR">Prior Purchases (same or similar)</option>
              <option value="COMPETE">Competition Among BPA Holders</option>
              <option value="IGCE">Comparison to IGCE</option>
              <option value="SOLE">Sole Source — Only Responsible Vendor</option>
            </select>
            {lbl("Price Reasonableness Determination")}
            <textarea style={ta} value={bpa.priceCompetition} rows={3} onChange={e => set("priceCompetition",e.target.value)} />
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, background:C.bg3, border:`1px solid ${C.border}`, color:C.muted, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11 }}>← BACK</button>
              <button onClick={()=>setStep(3)} style={{ flex:2, background:"#eef3fc", border:`1px solid ${C.blue}`, color:C.blue, padding:"7px", borderRadius:3, cursor:"pointer", fontSize:11, fontWeight:"bold" }}>PREVIEW →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>BPA CALL ORDER DOCUMENT</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => { navigator.clipboard.writeText(callText); }}
                style={{ background: C.bg3, border:`1px solid ${C.border}`, color:C.blue, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
                COPY
              </button>
              <button onClick={() => onGenerated && onGenerated(callText, "BPA_CALL_" + bpa.callNumber)}
                style={{ background:"#e8f7f0", border:"1px solid #1a6a3a", color:C.green, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
                SAVE TO PACKAGE
              </button>
              <button onClick={()=>setStep(2)}
                style={{ background:C.bg3, border:`1px solid ${C.border}`, color:C.muted, padding:"6px 14px", borderRadius:3, cursor:"pointer", fontSize:11 }}>
                ← BACK
              </button>
            </div>
            <pre style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:4, padding:14, fontSize:10, color:C.dim, overflow:"auto", maxHeight:"52vh", whiteSpace:"pre-wrap", lineHeight:1.6 }}>
              {callText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function buildBPACallText(bpa) {
  const v = parseFloat(bpa.value) || 0;
  const expDate = bpa.bpaExpiration
    ? new Date(bpa.bpaExpiration + "T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})
    : "[EXPIRATION DATE]";

  let t = `BPA CALL ORDER\n${"═".repeat(70)}\n\n`;
  t += `BPA Number:          ${bpa.bpaNumber || "[BPA NUMBER]"}\n`;
  t += `Call Number:         ${bpa.callNumber || "[CALL NUMBER]"}\n`;
  t += `BPA Holder:          ${bpa.bpaHolder || "[CONTRACTOR NAME]"}\n`;
  t += `Call Value:          $${v.toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
  t += `PR Number:           ${bpa.prNumber || "[PR NUMBER]"}\n`;
  t += `BPA Expiration:      ${expDate}\n`;
  if (bpa.remainingBalance) t += `BPA Remaining:       ${bpa.remainingBalance}\n`;
  t += `\n`;

  t += `REQUIREMENT\n${"─".repeat(40)}\n`;
  t += `Title: ${bpa.reqTitle || "[REQUIREMENT TITLE]"}\n\n`;
  if (bpa.deliverable) t += `${bpa.deliverable}\n\n`;
  t += `Period of Performance: ${bpa.pop || "[POP]"}\n`;
  t += `Place of Performance:  ${bpa.placeOfPerf}\n\n`;

  t += `ORDERING AUTHORITY\n${"─".repeat(40)}\n`;
  t += `This call is placed against BPA No. ${bpa.bpaNumber || "[BPA NUMBER]"} in accordance with `;
  t += `FAR 13.303-5. ${bpa.callRationale}\n\n`;

  if (bpa.urgency) {
    t += `URGENCY JUSTIFICATION (FAR 13.106-1(b)(1))\n${"─".repeat(40)}\n`;
    t += `${bpa.urgencyJustification}\n\n`;
  }

  t += `PRICE REASONABLENESS\n${"─".repeat(40)}\n`;
  const priceMethodLabels = {
    CATALOG: "Catalog/Published Price List",
    MARKET: "Market Research/Price Comparison",
    PRIOR: "Prior Purchases (same or similar item)",
    COMPETE: "Competition Among BPA Holders",
    IGCE: "Comparison to Independent Government Cost Estimate",
    SOLE: "Sole Source — Only Responsible Vendor",
  };
  t += `Method: ${priceMethodLabels[bpa.priceMethod] || bpa.priceMethod}\n`;
  t += `${bpa.priceCompetition}\n\n`;

  t += `FUNDING\n${"─".repeat(40)}\n`;
  t += `Total Call Amount: $${v.toLocaleString("en-US",{minimumFractionDigits:2})}\n`;
  if (bpa.fundCite) t += `Accounting Data: ${bpa.fundCite}\n`;
  t += `\n`;

  t += `ADMINISTRATION\n${"─".repeat(40)}\n`;
  t += `Contracting Officer: ${bpa.coName || "[CO NAME]"}\n`;
  if (bpa.corName) t += `COR: ${bpa.corName}\n`;
  t += `\nAll terms and conditions of BPA No. ${bpa.bpaNumber || "[BPA NUMBER]"} apply to this call.\n\n`;

  t += `${"─".repeat(70)}\n\n`;
  t += `${"_".repeat(40)}\n`;
  t += `${bpa.coName || "[Contracting Officer]"}\n`;
  t += `Contracting Officer\n`;
  t += `Date: ________________\n`;

  return t;
}

// ═══════════════════════════════════════════════════════════════════
// ANOSCA AUTO-TRIGGER LOGIC
// ═══════════════════════════════════════════════════════════════════

// ANOSCA / NPA thresholds — Authority: NFS 1805.302 + NFS CG 1805.32
// NFS Part 1806 is RESERVED; old NFS 1805.303 numbering is superseded.
// NFS 1805.302: $7M+ = NASA HQ public announcement required
// NFS CG 1805.32: $7M–$30M = NPA template (ANOSCA/public announcement/pre-award/award notices)
//                $30M+ = ANOSCA application
// Submission form: "NASA Notification of Contract Action" (NPA)
const ANOSCA_THRESHOLDS = {
  hqAnnouncement:      7000000,   // NFS 1805.302 — HQ public announcement $7M+
  anosca:              30000000,  // NFS CG 1805.32 — ANOSCA application $30M+
  optionExercise:      30000000,  // NFS CG 1805.32 — option exercise $30M+
  // Legacy fields kept for backward compatibility
  competitiveAward:    7000000,
  soleSource:          7000000,
  modIncrease:         7000000,
  indefiniteDelivery:  7000000,
};

export function checkANOSCARequired(intake, modData = null) {
  const v      = parseFloat(intake?.value) || 0;
  const isSole = intake?.competitionStrategy === "SOLE_SOURCE";
  const isIdiq = intake?.contractType === "IDIQ";

  const reasons = [];

  if (modData) {
    // Modification check
    const newTotal = parseFloat(modData.newObligated?.replace(/[$,]/g,"")) || 0;
    if (!isSole && newTotal >= ANOSCA_THRESHOLDS.modIncrease) {
      reasons.push(`Modification increases competitive contract value to $${(newTotal/1e6).toFixed(0)}M (threshold: $${ANOSCA_THRESHOLDS.modIncrease/1e6}M)`);
    }
    if (isSole && newTotal >= ANOSCA_THRESHOLDS.soleSourceMod) {
      reasons.push(`Modification increases sole source contract value to $${(newTotal/1e6).toFixed(0)}M (threshold: $${ANOSCA_THRESHOLDS.soleSourceMod/1e6}M)`);
    }
  } else {
    // New award check
    if (!isSole && v >= ANOSCA_THRESHOLDS.competitiveAward) {
      reasons.push(`Competitive award value $${(v/1e6).toFixed(0)}M meets/exceeds $${ANOSCA_THRESHOLDS.competitiveAward/1e6}M threshold`);
    }
    if (isSole && v >= ANOSCA_THRESHOLDS.soleSource) {
      reasons.push(`Sole source award value $${(v/1e6).toFixed(0)}M meets/exceeds $${ANOSCA_THRESHOLDS.soleSource/1e6}M threshold`);
    }
    if (isIdiq && v >= ANOSCA_THRESHOLDS.indefiniteDelivery) {
      reasons.push(`IDIQ max value $${(v/1e6).toFixed(0)}M meets/exceeds $${ANOSCA_THRESHOLDS.indefiniteDelivery/1e6}M threshold`);
    }
  }

  const level = (reasons.length > 0 && v >= ANOSCA_THRESHOLDS.anosca)
    ? "ANOSCA"
    : (reasons.length > 0 ? "HQ_ANNOUNCEMENT" : "NONE");

  return {
    required: reasons.length > 0,
    level,   // "HQ_ANNOUNCEMENT" ($7M–$30M) | "ANOSCA" ($30M+) | "NONE"
    reasons,
    threshold: isSole ? ANOSCA_THRESHOLDS.soleSource : ANOSCA_THRESHOLDS.competitiveAward,
  };
}

export function ANOSCABadge({ intake }) {
  const check = useMemo(() => checkANOSCARequired(intake), [intake]);
  if (!check.required) return null;

  return (
    <div style={{
      background: "#fff8e6", border: "1px solid #f5c542", borderRadius: 8,
      padding: "10px 14px", marginBottom: 12,
      fontFamily: FONT_AT,
    }}>
      <div style={{ fontSize: 11, color: "#7a4a00", fontWeight: "600", marginBottom: 4 }}>
        ⚠ {check.level === "ANOSCA" ? "ANOSCA Application Required ($30M+)" : "NASA HQ Public Announcement Required ($7M–$30M)"} — NFS 1805.302 / NFS CG 1805.32 / PIC 26-01
      </div>
      {check.reasons.map((r, i) => (
        <div key={i} style={{ fontSize: 11, color: "#7a4a00" }}>• {r}</div>
      ))}
      <div style={{ fontSize: 10, color: "#8896b0", marginTop: 4 }}>
        {check.level === "ANOSCA"
          ? "Submit ANOSCA application for actions $30M or greater. Authority: NFS CG 1805.32 / PIC 26-01."
          : "Complete NPA template for HQ public announcement ($7M–$30M). Authority: NFS 1805.302 / NFS CG 1805.32 / PIC 26-01."}
      </div>
    </div>
  );
}
