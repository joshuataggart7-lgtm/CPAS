// CPAS Standalone Clause Matrix & Solicitation Drafting Tool
// Operates independently of the intake wizard
// Outputs: (1) Clause recommendation list with justifications
//          (2) Full UCF solicitation draft in appropriate format

import React, { useState, useCallback } from "react";
import { prescribeClauses, buildSectionI, UCF_SECTIONS } from "./clauseEngine.js";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const C = {
  bg: "#f5f7fa", bg2: "#ffffff", bg3: "#eef1f6",
  border: "#dde3ef", blue: "#1a3a6e", text: "#1a2332",
  muted: "#6b7a99", dim: "#8896b0", green: "#0f6e56",
  yellow: "#854f0b", red: "#a32d2d",
};
const inp = {
  background: "#fff", border: `1px solid ${C.border}`, color: C.text,
  padding: "8px 12px", borderRadius: 8, fontSize: 12,
  width: "100%", boxSizing: "border-box", fontFamily: FONT, outline: "none",
};
const sel = { ...inp };

const STATUS_COLORS = {
  REQUIRED:    { bg: "#e1f5ee", text: "#0f6e56", border: "#9fe1cb", label: "Required" },
  CONDITIONAL: { bg: "#e6f1fb", text: "#185fa5", border: "#b5d4f4", label: "Recommended" },
  OPTIONAL:    { bg: "#fff8e6", text: "#854f0b", border: "#f5c542", label: "Consider" },
};

const lbl = (t, req) => (
  <div style={{ fontSize: 10, color: req ? C.yellow : C.muted, fontWeight: "600",
    letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4,
    marginTop: 10, fontFamily: FONT }}>
    {t}{req ? " *" : ""}
  </div>
);

// ── Solicitation type → document format ───────────────────────────
const SOL_TYPES = [
  { id: "RFP_COMMERCIAL",   label: "RFP — Commercial (FAR Part 12)",      form: "SF-1449",  far: "FAR 12.6 / 13.5" },
  { id: "RFP_NEGOTIATED",   label: "RFP — Negotiated (FAR Part 15)",       form: "UCF Standalone", far: "FAR Part 15" },
  { id: "RFQ_SIMPLIFIED",   label: "RFQ — Simplified Acquisition",         form: "SF-1449 / OF-347", far: "FAR 13" },
  { id: "IDIQ",             label: "IDIQ Contract",                         form: "UCF Standalone", far: "FAR 16.504" },
  { id: "BPA",              label: "BPA — Blanket Purchase Agreement",      form: "FAR 13.303", far: "FAR 13.303" },
  { id: "TASK_ORDER",       label: "Task/Delivery Order",                   form: "SF-1449 / OF-347", far: "FAR 16.5" },
];

// ── UCF section content generators ───────────────────────────────
function buildUCFSections(params, prescribed, apiKey) {
  const { value, contractType, isCommercial, center, reqType } = params;
  const v = parseFloat(value) || 0;

  return {
    A: `SECTION A — SOLICITATION/CONTRACT FORM\n\nForm: ${getFormType(params)}\nSolicitation Number: [SOLICITATION NUMBER]\nDate Issued: [DATE]\nIssued By: ${center || "NASA Ames Research Center"}\nContracting Officer: [CO NAME], ${center || "NASA ARC"}\n\nThis is a ${isCommercial === "YES" ? "commercial item" : "non-commercial"} acquisition conducted under ${getAuthority(params)}.`,

    B: buildSectionB(params),
    C: `SECTION C — DESCRIPTION/SPECIFICATIONS/STATEMENT OF WORK\n\n[INSERT SOW/PWS/SOO — Generated separately via CPAS SOW Builder or attach as Attachment 1]\n\nNOTE TO CO: Use the CPAS SOW Builder or provide the Government's Statement of Work as an attachment to this solicitation. The SOW should describe the work in terms of required results, not the method of performance.`,

    D: `SECTION D — PACKAGING AND MARKING\n\n${isCommercial === "YES" ? "D.1 PACKAGING AND MARKING\nThe Contractor shall package and mark all deliverables in accordance with best commercial practices.\n\nFor data deliverables, the Contractor shall apply distribution markings as specified in Section H and in accordance with the applicable data rights provisions." : "D.1 PACKAGING\nThe Contractor shall package all items in accordance with best commercial practice to ensure safe delivery.\n\nD.2 MARKING\nAll deliverable items shall be marked with the contract number, CLIN number, and the name and address of the Contracting Officer."}`,

    E: buildSectionE(params),
    F: buildSectionF(params),
    G: buildSectionG(params),
    H: buildSectionH(params),
    I: buildSectionI(prescribed),
    J: buildSectionJ(params),
    K: buildSectionK(params),
    L: buildSectionL(params),
    M: buildSectionM(params),
  };
}

function getFormType(p) {
  if (p.solType === "BPA") return "FAR 13.303 BPA";
  if (p.isCommercial === "YES") return "SF-1449";
  if (p.solType === "RFQ_SIMPLIFIED" || p.solType === "TASK_ORDER") return "SF-1449 / OF-347";
  return "Uniform Contract Format (UCF) — Standalone";
}

function isSoleSource(p) {
  return ["SOLE_SOURCE","8A","8(a)"].some(s =>
    (p.competitionStrategy || "").toUpperCase().includes(s.toUpperCase())
  );
}

function getAuthority(p) {
  if (p.isCommercial === "YES" && parseFloat(p.value) <= 7500000) return "FAR Part 12 and FAR Part 13";
  if (p.isCommercial === "YES") return "FAR Part 12";
  if (parseFloat(p.value) <= 350000) return "FAR Part 13";
  return "FAR Part 15";
}

function buildSectionB(p) {
  const v = parseFloat(p.value) || 0;
  const isIDIQ = p.contractType === "IDIQ" || p.solType === "IDIQ";

  let text = "SECTION B — SUPPLIES OR SERVICES AND PRICES/COSTS\n\n";
  text += "B.1 CONTRACT LINE ITEM NUMBERS (CLINs)\n\n";

  if (isIDIQ) {
    text += `CLIN 0001 — Base Services (Ordering Period)\n`;
    text += `    Item: [DESCRIPTION OF SERVICES]\n`;
    text += `    Type: Indefinite Quantity\n`;
    text += `    Estimated Quantity: As ordered\n`;
    text += `    Unit Price: [PER UNIT RATE] — See pricing schedule\n`;
    text += `    Minimum Order: $[MINIMUM GUARANTEE]\n`;
    text += `    Maximum Order: $${v.toLocaleString()}\n\n`;
    text += `CLIN 0002 — Option (if applicable)\n`;
    text += `    [OPTION DESCRIPTION]\n\n`;
    text += `B.2 IDIQ ORDERING\nOrders shall be placed in accordance with FAR 52.216-22 (Indefinite Quantity) and the ordering procedures in Section H. The minimum guaranteed amount of $[MINIMUM] shall be obligated at time of award.\n\n`;
  } else {
    text += `CLIN 0001 — [PRIMARY SERVICE/SUPPLY DESCRIPTION]\n`;
    text += `    Quantity: 1\n`;
    text += `    Unit: Lot / Job / Each\n`;
    text += `    Unit Price: $${v.toLocaleString()}\n`;
    text += `    Amount: $${v.toLocaleString()}\n\n`;
    if (p.hasOptions) {
      text += `CLIN 1001 — Option Year 1 — [DESCRIPTION]\n`;
      text += `    Unit Price: $[TBD]\n`;
      text += `    Amount: $[TBD]\n\n`;
    }
    text += `TOTAL CONTRACT VALUE: $${v.toLocaleString()}\n`;
    if (p.hasOptions) text += `TOTAL POTENTIAL VALUE (Base + Options): $[TBD]\n`;
  }

  text += `\nB.3 CONTRACT TYPE\nThis is a ${p.contractType || "FFP"} contract. ${p.contractType === "CPFF" ? "The estimated cost is $[ESTIMATED COST]. The fixed fee is $[FIXED FEE] ([FEE %]% of estimated cost)." : ""}`;
  return text;
}

function buildSectionE(p) {
  const commercial = p.isCommercial === "YES";
  let text = "SECTION E — INSPECTION AND ACCEPTANCE\n\n";
  text += `E.1 INSPECTION\n${commercial ? "Inspection and acceptance of all items under this contract shall be performed at destination by the Contracting Officer's Representative (COR) in accordance with FAR 52.212-4 (Commercial Items)." : "The Government shall inspect and accept all deliverables and services at the place of delivery. The Contracting Officer's Representative (COR) is designated as the authorized representative for inspection and acceptance."}\n\n`;
  text += `E.2 ACCEPTANCE\nAcceptance shall be accomplished by the COR within [NUMBER] calendar days of receipt of deliverable. If the COR does not accept or reject within the specified timeframe, the deliverable shall be deemed accepted.\n\n`;
  text += `E.3 FINAL ACCEPTANCE\nFinal acceptance of all work shall be accomplished by written notification from the Contracting Officer.`;
  return text;
}

function buildSectionF(p) {
  let text = "SECTION F — DELIVERIES OR PERFORMANCE\n\n";
  text += `F.1 PERIOD OF PERFORMANCE\nThe period of performance for this contract is [START DATE] through [END DATE]`;
  if (p.hasOptions) text += `, with [NUMBER] option period(s) of [DURATION] each`;
  text += `.\n\nF.2 PLACE OF PERFORMANCE\n[PLACE OF PERFORMANCE — e.g., NASA Ames Research Center, Moffett Field, CA 94035, and/or Contractor's facility]\n\n`;
  text += `F.3 DELIVERABLE SCHEDULE\nThe Contractor shall deliver all items and services in accordance with the schedule in Section C (SOW) and as follows:\n\n`;
  text += `    Deliverable                         Due Date            CDRL Ref\n`;
  text += `    --------------------------------   -----------------   --------\n`;
  text += `    [DELIVERABLE 1]                     [DATE/SCHEDULE]     [REF]\n`;
  text += `    [DELIVERABLE 2]                     [DATE/SCHEDULE]     [REF]\n`;
  text += `    Final Report                         [END DATE]         [REF]\n`;
  return text;
}

function buildSectionG(p) {
  let text = "SECTION G — CONTRACT ADMINISTRATION DATA\n\n";
  text += `G.1 CONTRACTING OFFICER\nThe Contracting Officer (CO) for this contract is:\n    Name: [CO NAME]\n    Organization: ${p.center || "NASA Ames Research Center, Office of Procurement"}\n    Email: [CO EMAIL]\n    Phone: [CO PHONE]\n\nOnly the Contracting Officer has authority to make changes to this contract.\n\n`;
  text += `G.2 CONTRACTING OFFICER'S REPRESENTATIVE (COR)\nThe Contracting Officer's Representative (COR) is:\n    Name: [COR NAME]\n    Organization: [COR ORG]\n    Email: [COR EMAIL]\n    Phone: [COR PHONE]\n\nThe COR is authorized to: (1) inspect and accept deliverables; (2) interpret technical requirements; (3) monitor contractor performance. The COR is NOT authorized to direct changes, modify terms, or authorize additional work without written approval from the CO.\n\n`;
  text += `G.3 PAYMENT OFFICE\nPayment requests shall be submitted to:\n    ${p.center || "NASA Ames Research Center"}\n    [PAYMENT OFFICE ADDRESS]\n    Invoice submission: [IPPS-A / IPP / PAYMENTS.GOV]\n\n`;
  text += `G.4 ACCOUNTING AND APPROPRIATION DATA\n    Fund Citation: [INSERT ACCOUNTING CODE]\n    ACRN: [INSERT ACRN]\n    PR Number: [INSERT PR NUMBER]`;
  return text;
}

function buildSectionH(p) {
  let text = "SECTION H — SPECIAL CONTRACT REQUIREMENTS\n\n";
  text += `H.1 CONTRACTOR PERSONNEL\nAll key personnel identified in the Contractor's proposal are considered essential to the work being performed. The Contractor shall not make substitutions without prior written approval from the Contracting Officer.\n\n`;
  if (p.reqType === "IT" || p.hasIT) {
    text += `H.2 INFORMATION TECHNOLOGY SECURITY\nThe Contractor shall comply with NASA NPR 2810.1 (Security of Information Technology) and the IT Security requirements specified in the attached Security Plan. All IT systems and software used under this contract that access NASA information systems must receive an Authority to Operate (ATO) or Authority to Connect (ATC) prior to use.\n\n`;
  }
  text += `H.${p.reqType === "IT" ? "3" : "2"} ORGANIZATIONAL CONFLICT OF INTEREST\nThe Contractor warrants that, to the best of its knowledge, there are no facts that would create an actual or potential OCI as defined in FAR Subpart 9.5. The Contractor shall immediately notify the CO if any OCI arises during performance.\n\n`;
  text += `H.${p.reqType === "IT" ? "4" : "3"} PLACE OF PERFORMANCE — SPECIAL REQUIREMENTS\n[INSERT ANY CENTER-SPECIFIC REQUIREMENTS — e.g., badging, escort requirements, parking, facility access]\n\n`;
  text += `[NOTE TO CO: Add NASA/center-specific Section H clauses per NFS 1852 and center SOPs. Common additions: 1852.223-70 (Safety), 1852.228-75 (Aircraft), center security requirements, visitor control procedures.]`;
  return text;
}

function buildSectionJ(p) {
  let text = "SECTION J — LIST OF ATTACHMENTS\n\n";
  const attachments = [
    "Attachment 1 — Statement of Work (SOW) / Performance Work Statement (PWS)",
    "Attachment 2 — Wage Determination No. [WD NUMBER], [DATE] (if SCA applies)",
    "Attachment 3 — Data Requirements List / CDRLs (if applicable)",
    "Attachment 4 — Government-Furnished Property/Equipment List (if applicable)",
    "Attachment 5 — Quality Assurance Surveillance Plan (QASP) (services contracts)",
    "Attachment 6 — Small Business Subcontracting Plan (if value ≥ $900,000)",
    "Attachment 7 — DD Form 254 (Contract Security Classification Specification) (if classified)",
  ];
  attachments.forEach((a, i) => { text += `${a}\n`; });
  text += `\n[NOTE TO CO: Remove attachments that do not apply. Ensure all referenced attachments are included before solicitation release. Wage Determination must be current from SAM.gov/WDOL at time of solicitation issue and award.]`;
  return text;
}

function buildSectionK(p) {
  let text = "SECTION K — REPRESENTATIONS, CERTIFICATIONS, AND OTHER STATEMENTS OF OFFERORS\n\n";
  if (p.isCommercial === "YES") {
    text += `K.1 For commercial item acquisitions, offerors complete representations and certifications in SAM.gov prior to submission. The offeror's SAM.gov registration shall be current and active at time of offer submission and at time of award.\n\n`;
    text += `K.2 By submission of an offer, the offeror represents that all representations and certifications in its SAM.gov registration are current, accurate, and complete as of the date of submission.\n\n`;
    text += `[NOTE: Per RFO FAR Part 12 / PCD 25-23A, FAR 52.212-3 (Offeror Reps and Certs) is not included in this solicitation. Reps/certs are captured via SAM.gov.]`;
  } else {
    text += `K.1 The following provisions require offeror completion:\n\n`;
    text += `    52.203-18  Prohibition on Contracting with Entities that Require Certain Internal Confidentiality Agreements — Representation\n`;
    text += `    52.204-3   Taxpayer Identification\n`;
    text += `    52.204-8   Annual Representations and Certifications (SAM.gov)\n`;
    text += `    52.209-5   Certification Regarding Responsibility Matters\n`;
    text += `    52.219-1   Small Business Program Representations\n`;
    text += `    [ADDITIONAL REPS AS APPLICABLE]`;
  }
  return text;
}

function buildSectionL(p) {
  const commercial = p.isCommercial === "YES";
  const soleSource = isSoleSource(p);
  let text = "SECTION L — INSTRUCTIONS, CONDITIONS, AND NOTICES TO OFFERORS\n\n";

  if (soleSource) {
    text += `NOTE: This is a sole source acquisition. Sections L and M (competitive proposal instructions and evaluation factors) are not applicable. The Government will negotiate directly with the intended contractor in accordance with RFO FAR ${p.competitionStrategy?.includes("8") ? "6.103-5 / 19.811" : "6.103-1"} [formerly FAR ${p.competitionStrategy?.includes("8") ? "6.302-5" : "6.302-1"}].\n\n`;
    text += `L.1 REQUEST FOR PROPOSAL / QUOTE\nThe Government requests the following information from the prospective contractor:\n\n`;
    text += `    (1) Technical approach and capability statement\n`;
    text += `    (2) Price/cost proposal with supporting rationale\n`;
    text += `    (3) Past performance on similar work\n`;
    if (parseFloat(p.value) >= 900000) {
      text += `    (4) Small Business Subcontracting Plan (if other than small business)\n`;
    }
    text += `\nSubmit to: [CO EMAIL] by [DATE].\n\n`;
    text += `[NOTE TO CO: For sole source acquisitions, tailor this section to your specific negotiation requirements. Remove standard competitive proposal format instructions.]`;
    return text;
  }

  if (commercial) {
    text += `NOTE: For commercial acquisitions under FAR Part 12, this section is replaced by FAR 52.212-1 (Instructions to Offerors — Commercial). The following supplemental instructions apply in addition to that provision.\n\n`;
  }
  text += `L.1 PROPOSAL SUBMISSION\nProposals shall be submitted electronically to [CO EMAIL] no later than [DATE AND TIME, TIME ZONE]. Late proposals will not be accepted except as provided under FAR 52.215-1.\n\n`;
  text += `L.2 PROPOSAL FORMAT\nProposals shall be organized into the following volumes:\n\n`;
  text += `    Volume I — Technical Approach (Page limit: [X] pages)\n`;
  text += `    Volume II — Past Performance ([X] references, [X] pages each)\n`;
  text += `    Volume III — Price/Cost (No page limit)\n`;
  if (parseFloat(p.value) >= 900000) {
    text += `    Volume IV — Small Business Subcontracting Plan (if other than small business)\n`;
  }
  text += `\nL.3 QUESTIONS\nAll questions regarding this solicitation shall be submitted in writing to [CO EMAIL] no later than [DATE]. Questions and answers will be posted as an amendment to this solicitation.\n\n`;
  text += `[NOTE TO CO: Customize page limits, proposal volumes, and submission requirements per center template and acquisition complexity.]`;
  return text;
}

function buildSectionM(p) {
  const soleSource = isSoleSource(p);
  let text = "SECTION M — EVALUATION FACTORS FOR AWARD\n\n";

  if (soleSource) {
    text += `NOTE: This is a sole source acquisition. Competitive evaluation factors are not applicable.\n\n`;
    text += `M.1 BASIS FOR AWARD\nThis contract will be awarded to [CONTRACTOR NAME] on a sole source basis under RFO FAR ${p.competitionStrategy?.includes("8") ? "6.103-5 [formerly FAR 6.302-5] (authorized or required by statute — 8(a))" : "6.103-1 [formerly FAR 6.302-1] (only one responsible source)"} following determination of fair and reasonable pricing through negotiation in accordance with FAR Part 15.\n\n`;
    text += `M.2 PRICE REASONABLENESS\nThe Contracting Officer will determine price reasonableness through ${
      p.isCommercial === "YES"
        ? "price analysis per FAR 15.404-1 (commercial items are exempt from TINA per FAR 15.403-1(b)(3) regardless of value)"
        : parseFloat(p.value) >= 2500000
          ? "certified cost or pricing data per FAR 15.403-4 (TINA threshold: $2.5M)"
          : "price analysis techniques per FAR 15.404-1, including comparison to prior prices, market data, and independent Government estimate"
    }.\n\n`;
    text += `[NOTE TO CO: Document price reasonableness determination in the Price Negotiation Memorandum (PNM). J&A or Limited Source Justification must be approved before award.]`;
    return text;
  }

  const v = parseFloat(p.value) || 0;
  const isLPTA = p.contractType === "FFP" && v < 2000000;

  if (isLPTA) {
    text += `M.1 BASIS FOR AWARD\nAward will be made to the offeror whose proposal represents the Lowest Price Technically Acceptable (LPTA) offer.\n\n`;
    text += `M.2 EVALUATION FACTORS\n\nFactor 1 — Technical Acceptability (Acceptable/Unacceptable)\n    The offeror's technical approach will be evaluated to determine whether it meets the minimum requirements in Section C.\n\nFactor 2 — Past Performance (Acceptable/Unacceptable/Unknown)\n    Relevance and quality of the offeror's past performance.\n\nFactor 3 — Price\n    Evaluated for reasonableness. Lowest price among technically acceptable proposals receives award.`;
  } else {
    text += `M.1 BASIS FOR AWARD\nAward will be made to the offeror whose proposal represents Best Value to the Government, considering the factors below in descending order of importance.\n\n`;
    text += `M.2 EVALUATION FACTORS\n\nFactor 1 — Technical Approach (Most Important)\n    The Government will evaluate the offeror's understanding of the requirement, technical approach, and feasibility.\n\nFactor 2 — Past Performance\n    Relevance, recency (within [X] years), and quality of past performance on similar work.\n\nFactor 3 — Price/Cost\n    Evaluated for reasonableness. ${p.isCommercial === "YES" ? "Commercial items exempt from TINA per FAR 15.403-1(b)(3)." : v >= 2500000 ? "Certified cost or pricing data may be required per FAR 15.403-4 (TINA threshold: $2.5M)." : ""}\n\nM.3 RELATIVE IMPORTANCE\nTechnical Approach and Past Performance, when combined, are [EQUAL TO / MORE IMPORTANT THAN] Price.\n\n[NOTE TO CO: Customize per acquisition complexity. Confirm methodology with supervisor before release.]`;
  }
  return text;
}


// ── Main Component ────────────────────────────────────────────────
export default function StandaloneClauseMatrix({ existingIntake, onSaveToAcquisition, onClose }) {
  const [params, setParams] = useState({
    solType: "RFP_COMMERCIAL",
    value: existingIntake?.value || "",
    contractType: existingIntake?.contractType || "FFP",
    isCommercial: existingIntake?.isCommercial || "YES",
    competitionStrategy: existingIntake?.competitionStrategy || "FULL_OPEN",
    setAside: existingIntake?.setAside || "NONE",
    reqType: existingIntake?.reqType || "SERVICES",
    center: existingIntake?.center || "",
    pop: existingIntake?.pop || "1 year",
    hasOptions: true,
    hasIT: false,
    isSCA: false,
    hasSubcontracting: false,
    solNumber: "",
    description: existingIntake?.reqTitle || "",
    coName: existingIntake?.coName || "",
    corName: existingIntake?.techRepName || "",
    fundCite: "",
    naics: existingIntake?.naics || "",
    psc: existingIntake?.psc || "",
  });

  const [output, setOutput] = useState(null); // "clauses" | "solicitation" | "both"
  const [activeTab, setActiveTab] = useState("params");
  const [ucfSection, setUcfSection] = useState("B");
  const [generated, setGenerated] = useState(null);
  const [copyMsg, setCopyMsg] = useState("");

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }));

  function generate(type) {
    const prescribed = prescribeClauses(params);
    const ucf = buildUCFSections(params, prescribed);
    setGenerated({ prescribed, ucf, type });
    setOutput(type);
    setActiveTab(type === "clauses" ? "clauses" : "solicitation");
  }

  function copySection(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 2000);
    });
  }

  function copyAll() {
    if (!generated) return;
    const allText = UCF_SECTIONS.map(s =>
      `${"=".repeat(60)}\n${generated.ucf[s.id]}\n`
    ).join("\n\n");
    navigator.clipboard.writeText(allText).then(() => {
      setCopyMsg("Full solicitation copied!");
      setTimeout(() => setCopyMsg(""), 3000);
    });
  }

  const tabBtn = (id, label) => (
    <button key={id} onClick={() => setActiveTab(id)}
      style={{ padding: "7px 16px", borderRadius: 20, fontSize: 11, cursor: "pointer",
        fontFamily: FONT, border: `1px solid ${activeTab === id ? C.blue : C.border}`,
        background: activeTab === id ? C.blue : C.bg2,
        color: activeTab === id ? "#fff" : C.muted,
        fontWeight: activeTab === id ? "500" : "400" }}>
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100%", padding: "20px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
        borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: "600", color: C.text }}>Clause Matrix & Solicitation Drafting</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            Standalone tool — operates independently or saves to an open acquisition
          </div>
        </div>
        {copyMsg && <span style={{ fontSize: 12, color: C.green, fontWeight: "500" }}>✓ {copyMsg}</span>}
        {onClose && (
          <button onClick={onClose}
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted,
              padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
            Close
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabBtn("params", "Acquisition Parameters")}
        {generated && tabBtn("clauses", `Clause List (${(generated.prescribed.required.length + generated.prescribed.conditional.length)})`)}
        {generated && tabBtn("solicitation", "Solicitation Draft")}
      </div>

      {/* PARAMETERS TAB */}
      {activeTab === "params" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: C.blue, textTransform: "uppercase",
              letterSpacing: "0.8px", marginBottom: 14, borderBottom: `2px solid ${C.border}`, paddingBottom: 8 }}>
              Solicitation Basics
            </div>

            {lbl("Solicitation Type", true)}
            <select style={sel} value={params.solType} onChange={e => set("solType", e.target.value)}>
              {SOL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

            {lbl("Description / Title")}
            <input style={inp} value={params.description}
              onChange={e => set("description", e.target.value)}
              placeholder="e.g., Commercial Aviation Services — Airborne Science Support" />

            {lbl("Solicitation Number")}
            <input style={inp} value={params.solNumber}
              onChange={e => set("solNumber", e.target.value)}
              placeholder="e.g., 80ARC026R0001" />

            {lbl("NASA Center", true)}
            <select style={sel} value={params.center} onChange={e => set("center", e.target.value)}>
              <option value="">Select center...</option>
              {["Ames (ARC)","Armstrong (AFRC)","Glenn (GRC)","Goddard (GSFC)",
                "Johnson (JSC)","Kennedy (KSC)","Langley (LaRC)","Marshall (MSFC)",
                "Stennis (SSC)","JPL","HQ"].map(c => <option key={c}>{c}</option>)}
            </select>

            {lbl("Contracting Officer")}
            <input style={inp} value={params.coName}
              onChange={e => set("coName", e.target.value)}
              placeholder="CO Name" />

            {lbl("Fund Cite / Accounting Code")}
            <input style={inp} value={params.fundCite}
              onChange={e => set("fundCite", e.target.value)}
              placeholder="Accounting string" />
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: C.blue, textTransform: "uppercase",
              letterSpacing: "0.8px", marginBottom: 14, borderBottom: `2px solid ${C.border}`, paddingBottom: 8 }}>
              Contract Parameters
            </div>

            {lbl("Estimated Value", true)}
            <input type="number" style={inp} value={params.value}
              onChange={e => set("value", e.target.value)}
              placeholder="e.g., 12000000" />

            {lbl("Contract Type", true)}
            <select style={sel} value={params.contractType} onChange={e => set("contractType", e.target.value)}>
              {["FFP","CPFF","CPAF","CPIF","T&M","Labor Hour","IDIQ","BPA"].map(t => <option key={t}>{t}</option>)}
            </select>

            {lbl("Commercial Item?", true)}
            <select style={sel} value={params.isCommercial} onChange={e => set("isCommercial", e.target.value)}>
              <option value="YES">Yes — Commercial Item/Service (FAR Part 12)</option>
              <option value="NO">No — Non-Commercial</option>
              <option value="TBD">TBD — Not yet determined</option>
            </select>

            {lbl("Competition Strategy", true)}
            <select style={sel} value={params.competitionStrategy}
              onChange={e => set("competitionStrategy", e.target.value)}>
              <option value="FULL_OPEN">Full and Open Competition</option>
              <option value="SOLE_SOURCE">Sole Source</option>
              <option value="8A">8(a) Sole Source</option>
              <option value="SDVOSB">SDVOSB Set-Aside</option>
              <option value="WOSB">WOSB Set-Aside</option>
              <option value="HUBZONE">HUBZone Set-Aside</option>
              <option value="SB">Small Business Set-Aside</option>
              <option value="TOTAL_SB">Total Small Business Set-Aside</option>
            </select>

            {lbl("Requirement Type")}
            <select style={sel} value={params.reqType} onChange={e => set("reqType", e.target.value)}>
              {[["SERVICES","Professional Services"],["SUPPLIES","Products/Hardware"],
                ["IT","IT/Software"],["RD","Research & Development"],
                ["CONSTRUCTION","Construction"],["AE","A&E Services"]].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>

            {lbl("Period of Performance")}
            <select style={sel} value={params.pop} onChange={e => set("pop", e.target.value)}>
              {[["6 months","6 months"],["1 year","1 year"],["2 years","2 years"],
                ["3 years","3 years"],["5 years","5 years"],
                ["5 year base no options","5 year base, no options"],
                ["IDIQ 5 year","IDIQ 5-year ordering period"]].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>

            {/* Checkboxes */}
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["hasOptions", "Includes option years"],
                ["isSCA", "Service Contract Act applies"],
                ["hasIT", "IT/cybersecurity requirements"],
                ["hasSubcontracting", "Subcontracting plan required"],
              ].map(([k, label]) => (
                <label key={k} style={{ display: "flex", gap: 8, alignItems: "center",
                  fontSize: 12, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!params[k]}
                    onChange={e => set(k, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Generate buttons */}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => generate("clauses")}
              disabled={!params.value || !params.center}
              style={{ flex: 1, background: params.value && params.center ? C.blue : C.bg3,
                border: "none", color: params.value && params.center ? "#fff" : C.dim,
                padding: "12px 20px", borderRadius: 8, cursor: params.value && params.center ? "pointer" : "default",
                fontSize: 13, fontWeight: "500", fontFamily: FONT }}>
              Generate Clause Recommendation List
            </button>
            <button onClick={() => generate("solicitation")}
              disabled={!params.value || !params.center}
              style={{ flex: 1, background: params.value && params.center ? C.green : C.bg3,
                border: "none", color: params.value && params.center ? "#fff" : C.dim,
                padding: "12px 20px", borderRadius: 8, cursor: params.value && params.center ? "pointer" : "default",
                fontSize: 13, fontWeight: "500", fontFamily: FONT }}>
              Generate Full Solicitation Draft
            </button>
            <button onClick={() => generate("both")}
              disabled={!params.value || !params.center}
              style={{ flex: 1, background: params.value && params.center ? "#5a3a9e" : C.bg3,
                border: "none", color: params.value && params.center ? "#fff" : C.dim,
                padding: "12px 20px", borderRadius: 8, cursor: params.value && params.center ? "pointer" : "default",
                fontSize: 13, fontWeight: "500", fontFamily: FONT }}>
              Generate Both
            </button>
          </div>

          {(!params.value || !params.center) && (
            <div style={{ gridColumn: "1 / -1", fontSize: 11, color: C.yellow,
              background: "#fff8e6", border: "1px solid #f5c542", borderRadius: 8, padding: "8px 14px" }}>
              Enter Estimated Value and NASA Center to generate output.
            </div>
          )}
        </div>
      )}

      {/* CLAUSE LIST TAB */}
      {activeTab === "clauses" && generated && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: C.text, fontWeight: "500" }}>
              Clause Recommendation — {params.description || "Acquisition"} — ${parseFloat(params.value || 0).toLocaleString()}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {onSaveToAcquisition && (
                <button onClick={() => onSaveToAcquisition(generated.prescribed)}
                  style={{ background: C.green, border: "none", color: "#fff",
                    padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                  Save to Acquisition
                </button>
              )}
              <button onClick={() => copySection(formatClauseListText(generated.prescribed, params))}
                style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                  padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                Copy All
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ background: "#fff8e6", border: "1px solid #f5c542", borderRadius: 8,
            padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#7a4a00", lineHeight: 1.6 }}>
            <strong>CO Review Required.</strong> This clause list is generated by CPAS as a starting point for the CO's independent determination. The CO is responsible for verifying applicability, consulting current FAR/NFS, and making all final prescribing decisions. This output does not constitute legal advice.
          </div>

          {[
            { key: "required", label: "Required", color: STATUS_COLORS.REQUIRED },
            { key: "conditional", label: "Recommended / Conditional", color: STATUS_COLORS.CONDITIONAL },
            { key: "optional", label: "Consider / Optional", color: STATUS_COLORS.OPTIONAL },
          ].map(({ key, label, color }) => {
            const clauses = generated.prescribed[key];
            if (!clauses?.length) return null;
            return (
              <div key={key} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}`,
                    padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: "500" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>{clauses.length} clause{clauses.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {clauses.map((c, i) => (
                    <div key={c.num} style={{ padding: "12px 16px",
                      borderBottom: i < clauses.length - 1 ? `1px solid ${C.border}` : "none",
                      background: i % 2 === 0 ? C.bg2 : C.bg3 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ minWidth: 90, fontSize: 11, fontWeight: "600", color: C.blue,
                          fontFamily: "monospace" }}>
                          {c.num}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: "500", color: C.text, marginBottom: 3 }}>
                            {c.title}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: c.note ? 5 : 0 }}>
                            Prescription: {c.farRef || "See FAR/NFS"}
                          </div>
                          {c.note && (
                            <div style={{ fontSize: 10, color: "#5a4a00", background: "#fffdf0",
                              border: "1px solid #f5e88a", borderRadius: 4, padding: "4px 8px",
                              marginTop: 4, lineHeight: 1.5 }}>
                              {c.note.length > 200 ? c.note.slice(0, 200) + "..." : c.note}
                            </div>
                          )}
                          {c.alternates?.length > 0 && (
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                              Alternates: {c.alternates.join(" | ")}
                            </div>
                          )}
                          {c.fillIns?.length > 0 && (
                            <div style={{ fontSize: 10, color: "#185fa5", marginTop: 4 }}>
                              Fill-ins required: {c.fillIns.map(f => f.label).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SOLICITATION DRAFT TAB */}
      {activeTab === "solicitation" && generated && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: C.text, fontWeight: "500" }}>
              {SOL_TYPES.find(t => t.id === params.solType)?.form} — {params.description || "Acquisition Draft"}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyAll}
                style={{ background: C.blue, border: "none", color: "#fff",
                  padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                Copy Full Solicitation
              </button>
              {onSaveToAcquisition && (
                <button onClick={() => onSaveToAcquisition(null, generated.ucf)}
                  style={{ background: C.green, border: "none", color: "#fff",
                    padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                  Save to Acquisition
                </button>
              )}
            </div>
          </div>

          <div style={{ background: "#fff8e6", border: "1px solid #f5c542", borderRadius: 8,
            padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#7a4a00", lineHeight: 1.6 }}>
            <strong>Draft Only — CO Review Required.</strong> This solicitation is a CPAS-generated starting point. The CO must review all sections, reconcile against center-specific templates, verify clause prescriptions, obtain required approvals, and complete all bracketed placeholders before release. Section I clauses have been prescribe by the CPAS clause engine and must be independently verified.
          </div>

          {/* Section navigation */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {UCF_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setUcfSection(s.id)}
                style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                  fontFamily: FONT, border: `1px solid ${ucfSection === s.id ? C.blue : C.border}`,
                  background: ucfSection === s.id ? C.blue : C.bg2,
                  color: ucfSection === s.id ? "#fff" : C.muted,
                  fontWeight: ucfSection === s.id ? "500" : "400" }}>
                {s.id}
              </button>
            ))}
          </div>

          {/* Section content */}
          {UCF_SECTIONS.filter(s => s.id === ucfSection).map(s => (
            <div key={s.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
                    Section {s.id} — {s.title}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.note}</div>
                </div>
                <button onClick={() => copySection(generated.ucf[s.id])}
                  style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                    padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                  Copy Section
                </button>
              </div>
              <pre style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "16px 20px", fontSize: 11, color: C.text, whiteSpace: "pre-wrap",
                lineHeight: 1.7, fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                maxHeight: 500, overflow: "auto" }}>
                {generated.ucf[s.id]}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatClauseListText(prescribed, params) {
  const lines = [
    `CPAS CLAUSE RECOMMENDATION LIST`,
    `Acquisition: ${params.description || "Untitled"}`,
    `Value: $${parseFloat(params.value || 0).toLocaleString()}`,
    `Contract Type: ${params.contractType} | Commercial: ${params.isCommercial} | Center: ${params.center}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    `${"=".repeat(70)}`,
    `CO CERTIFICATION REQUIRED: This list is a starting point only. The CO is responsible for all prescribing decisions.`,
    `${"=".repeat(70)}`,
    "",
    "REQUIRED CLAUSES:",
    ...prescribed.required.map(c => `  ${c.num}  ${c.title}\n    Prescription: ${c.farRef || "See FAR/NFS"}\n    ${c.note ? "Note: " + c.note.slice(0, 120) : ""}`),
    "",
    "RECOMMENDED / CONDITIONAL:",
    ...prescribed.conditional.map(c => `  ${c.num}  ${c.title}\n    Prescription: ${c.farRef || "See FAR/NFS"}`),
    "",
    "CONSIDER / OPTIONAL:",
    ...prescribed.optional.map(c => `  ${c.num}  ${c.title}\n    Prescription: ${c.farRef || "See FAR/NFS"}`),
  ];
  return lines.join("\n");
}
