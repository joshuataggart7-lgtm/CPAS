// CPAS Solicitation Tools
// Segment 2: Section L, Section M, SF-30 Modification Workflow, Section I Word Export
//
// Exports:
//   SectionLBuilder    — structured Section L instructions builder
//   SectionMBuilder    — structured Section M evaluation factors builder
//   ModWorkflow        — SF-30 modification mini-intake + form pre-pop
//   exportSectionIWord — Word export for Section I clause text

import React, { useState, useMemo } from "react";

const C = {
  bg: "#040d1a", bg2: "#061020", bg3: "#08182e",
  border: "#1a3a6e", blue: "#4a9eff", text: "#c8d8f0",
  muted: "#4a7aaa", dim: "#7a9ab8",
  green: "#3aaa66", yellow: "#f4c542", red: "#e87c3e",
};

const inp = {
  background: "#08182e", border: "1px solid #1a3a6e", color: "#c8d8f0",
  padding: "7px 10px", borderRadius: 3, fontSize: 11,
  width: "100%", boxSizing: "border-box", marginBottom: 8,
  fontFamily: "'IBM Plex Mono', monospace",
};

const textarea = {
  ...inp, resize: "vertical", minHeight: 60, lineHeight: 1.5,
};

const label = (text) => (
  <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 4, marginTop: 8 }}>{text}</div>
);

// ═══════════════════════════════════════════════════════════════════
// SECTION L BUILDER
// ═══════════════════════════════════════════════════════════════════

const PROPOSAL_VOLUMES = [
  { id: "tech",    label: "Volume I — Technical",           default: true  },
  { id: "mgmt",    label: "Volume II — Management",         default: true  },
  { id: "past",    label: "Volume III — Past Performance",  default: true  },
  { id: "price",   label: "Volume IV — Price/Cost",         default: true  },
  { id: "small",   label: "Volume V — Small Business Plan", default: false },
  { id: "oral",    label: "Oral Presentations",             default: false },
];

const FORMAT_DEFAULTS = {
  font:        "Times New Roman or Arial, 12-point minimum",
  margins:     "1-inch minimum on all sides",
  paperSize:   "8.5 x 11 inches",
  fileFormat:  "PDF (preferred) or Microsoft Word",
};

export function SectionLBuilder({ intake, onGenerated }) {
  const [volumes, setVolumes] = useState(
    Object.fromEntries(PROPOSAL_VOLUMES.map(v => [v.id, v.default]))
  );
  const [pageLimits, setPageLimits] = useState({
    tech: "50", mgmt: "30", past: "20", price: "No limit", small: "20", oral: "",
  });
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("2:00 PM Eastern");
  const [deliveryMethod, setDeliveryMethod] = useState("Electronic via email or portal");
  const [questions, setQuestions] = useState("14");
  const [questionsEmail, setQuestionsEmail] = useState(intake?.coEmail || "");
  const [techContent, setTechContent] = useState(
    "Describe your technical approach, methodology, and understanding of the requirement. Address each PWS/SOW task area."
  );
  const [mgmtContent, setMgmtContent] = useState(
    "Describe your management approach, organizational structure, key personnel qualifications, and transition plan."
  );
  const [pastContent, setPastContent] = useState(
    "Provide three (3) relevant contracts performed within the past five (5) years of similar scope, complexity, and dollar value."
  );
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [copied, setCopied] = useState(false);

  const activeVolumes = PROPOSAL_VOLUMES.filter(v => volumes[v.id]);

  const text = useMemo(() => buildSectionLText({
    intake, activeVolumes, pageLimits, dueDate, dueTime,
    deliveryMethod, questions, questionsEmail,
    techContent, mgmtContent, pastContent, specialInstructions,
  }), [intake, activeVolumes, pageLimits, dueDate, dueTime,
       deliveryMethod, questions, questionsEmail,
       techContent, mgmtContent, pastContent, specialInstructions]);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 0, minHeight: 500 }}>

        {/* Left — controls */}
        <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "70vh" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>SECTION L PARAMETERS</div>

          {label("PROPOSAL DUE DATE")}
          <input style={inp} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />

          {label("DUE TIME")}
          <input style={inp} value={dueTime} onChange={e => setDueTime(e.target.value)} placeholder="2:00 PM Eastern" />

          {label("DELIVERY METHOD")}
          <input style={inp} value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} />

          {label("QUESTIONS DUE (DAYS AFTER RELEASE)")}
          <input style={inp} value={questions} onChange={e => setQuestions(e.target.value)} placeholder="14" />

          {label("QUESTIONS EMAIL")}
          <input style={inp} value={questionsEmail} onChange={e => setQuestionsEmail(e.target.value)} placeholder="co@nasa.gov" />

          {label("PROPOSAL VOLUMES")}
          {PROPOSAL_VOLUMES.map(v => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div onClick={() => setVolumes(vv => ({ ...vv, [v.id]: !vv[v.id] }))}
                style={{ width: 14, height: 14, border: `1px solid ${volumes[v.id] ? C.green : "#2a4a6a"}`,
                         borderRadius: 2, background: volumes[v.id] ? C.green : "transparent",
                         flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center",
                         justifyContent: "center", fontSize: 9, color: "#fff" }}>
                {volumes[v.id] ? "✓" : ""}
              </div>
              <span style={{ fontSize: 10, color: volumes[v.id] ? C.text : C.dim, flex: 1 }}>{v.label}</span>
              {volumes[v.id] && (
                <input value={pageLimits[v.id] || ""}
                  onChange={e => setPageLimits(p => ({ ...p, [v.id]: e.target.value }))}
                  placeholder="pages" style={{ ...inp, width: 70, marginBottom: 0, padding: "4px 6px" }} />
              )}
            </div>
          ))}

          {volumes.tech && (<>
            {label("TECHNICAL VOLUME INSTRUCTIONS")}
            <textarea style={textarea} value={techContent} onChange={e => setTechContent(e.target.value)} rows={4} />
          </>)}

          {volumes.mgmt && (<>
            {label("MANAGEMENT VOLUME INSTRUCTIONS")}
            <textarea style={textarea} value={mgmtContent} onChange={e => setMgmtContent(e.target.value)} rows={4} />
          </>)}

          {volumes.past && (<>
            {label("PAST PERFORMANCE INSTRUCTIONS")}
            <textarea style={textarea} value={pastContent} onChange={e => setPastContent(e.target.value)} rows={3} />
          </>)}

          {label("SPECIAL INSTRUCTIONS (OPTIONAL)")}
          <textarea style={textarea} value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="Oral presentation details, proprietary markings policy, etc." rows={3} />
        </div>

        {/* Right — preview */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <button onClick={copy}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: copied ? C.green : C.blue,
                       padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              {copied ? "✓ COPIED" : "COPY SECTION L"}
            </button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background: "#0a2a1a", border: "1px solid #1a6a3a", color: C.green,
                       padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              SAVE TO PACKAGE
            </button>
          </div>
          <pre style={{ flex: 1, padding: 16, fontSize: 10, color: C.dim, overflow: "auto",
                        maxHeight: "62vh", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildSectionLText({ intake, activeVolumes, pageLimits, dueDate, dueTime,
  deliveryMethod, questions, questionsEmail, techContent, mgmtContent, pastContent, specialInstructions }) {

  const t = intake?.reqTitle || "this requirement";
  const c = intake?.center || "NASA";
  const formattedDate = dueDate
    ? new Date(dueDate + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "[DATE]";

  let text = `SECTION L — INSTRUCTIONS, CONDITIONS, AND NOTICES TO OFFERORS\n`;
  text += `${"═".repeat(70)}\n\n`;
  text += `Solicitation: [SOLICITATION NUMBER]\n`;
  text += `Requirement: ${t}\n`;
  text += `Issuing Office: ${c}\n\n`;

  text += `L.1  GENERAL INSTRUCTIONS\n\n`;
  text += `(a) This is a competitive acquisition conducted in accordance with FAR Part 15. `;
  text += `Offerors are required to submit proposals in accordance with these instructions.\n\n`;
  text += `(b) PROPOSAL DUE DATE AND TIME\n\n`;
  text += `     Proposals must be received no later than:\n`;
  text += `     Date: ${formattedDate}\n`;
  text += `     Time: ${dueTime}\n\n`;
  text += `     Delivery Method: ${deliveryMethod}\n\n`;
  text += `(c) QUESTIONS\n\n`;
  text += `     Questions regarding this solicitation must be submitted in writing within ${questions} calendar days `;
  text += `of solicitation release to:\n`;
  text += `     Email: ${questionsEmail || "[CO EMAIL]"}\n\n`;
  text += `     Subject line: "[SOLICITATION NUMBER] — Question"\n\n`;
  text += `     Questions and answers will be issued as an amendment to all offerors.\n\n`;

  text += `L.2  PROPOSAL FORMAT REQUIREMENTS\n\n`;
  text += `(a) General Format:\n`;
  text += `     Font: ${FORMAT_DEFAULTS.font}\n`;
  text += `     Margins: ${FORMAT_DEFAULTS.margins}\n`;
  text += `     Paper size: ${FORMAT_DEFAULTS.paperSize}\n`;
  text += `     File format: ${FORMAT_DEFAULTS.fileFormat}\n\n`;
  text += `(b) Proposal Volumes:\n\n`;

  activeVolumes.forEach((v, i) => {
    const limit = pageLimits[v.id];
    text += `     ${v.label}`;
    if (limit) text += ` — Page Limit: ${limit} pages`;
    text += `\n`;
  });
  text += `\n`;
  text += `     Pages in excess of stated limits will not be evaluated.\n\n`;

  if (activeVolumes.find(v => v.id === "tech")) {
    text += `L.3  VOLUME I — TECHNICAL PROPOSAL\n\n`;
    text += `${techContent}\n\n`;
    text += `     (1) The technical proposal shall not contain any pricing or cost information.\n`;
    text += `     (2) Offerors shall address each task/deliverable in the Statement of Work.\n`;
    text += `     (3) Assumptions, if any, shall be clearly identified and explained.\n\n`;
  }

  if (activeVolumes.find(v => v.id === "mgmt")) {
    text += `L.4  VOLUME II — MANAGEMENT PROPOSAL\n\n`;
    text += `${mgmtContent}\n\n`;
    text += `     Key Personnel: Identify all key personnel proposed for this contract. `;
    text += `Include resumes (not counted against page limit) demonstrating relevant experience.\n\n`;
  }

  if (activeVolumes.find(v => v.id === "past")) {
    text += `L.5  VOLUME III — PAST PERFORMANCE\n\n`;
    text += `${pastContent}\n\n`;
    text += `     For each reference provide:\n`;
    text += `     (1) Contract number and title\n`;
    text += `     (2) Customer name, address, contracting officer name and phone\n`;
    text += `     (3) Contract value and period of performance\n`;
    text += `     (4) Description of relevance to this requirement\n`;
    text += `     (5) Performance ratings received (if available)\n\n`;
    text += `     NOTE: The Government reserves the right to use performance information from `;
    text += `sources other than those identified by the offeror, including CPARS.\n\n`;
  }

  if (activeVolumes.find(v => v.id === "price")) {
    text += `L.6  VOLUME IV — PRICE/COST PROPOSAL\n\n`;
    text += `(a) Offerors shall submit pricing for all CLINs identified in Section B.\n\n`;
    text += `(b) Price proposals shall include:\n`;
    text += `     (1) Fully burdened labor rates by labor category\n`;
    text += `     (2) Hours by labor category for each CLIN/task\n`;
    text += `     (3) ODC and subcontract costs itemized\n`;
    text += `     (4) Fee/profit as applicable\n\n`;
    text += `(c) Pricing must be provided for base year and all option periods.\n\n`;
    text += `(d) The Government will evaluate price for reasonableness. `;
    text += `Price is not scored but must be fair and reasonable for award.\n\n`;
  }

  if (activeVolumes.find(v => v.id === "small")) {
    text += `L.7  VOLUME V — SMALL BUSINESS SUBCONTRACTING PLAN\n\n`;
    text += `Large business offerors must submit a Small Business Subcontracting Plan `;
    text += `in accordance with FAR 52.219-9. The plan shall include goals for utilization of `;
    text += `small, small disadvantaged, women-owned small, HUBZone small, service-disabled `;
    text += `veteran-owned small, and historically black college and university businesses.\n\n`;
  }

  if (specialInstructions) {
    text += `L.8  SPECIAL INSTRUCTIONS\n\n`;
    text += `${specialInstructions}\n\n`;
  }

  text += `L.${activeVolumes.length + 3}  LATE PROPOSALS\n\n`;
  text += `Late proposals will be handled in accordance with FAR 52.215-1. `;
  text += `It is the offeror's responsibility to ensure timely receipt of proposals.\n\n`;

  text += `L.${activeVolumes.length + 4}  ACKNOWLEDGMENT OF AMENDMENTS\n\n`;
  text += `Offerors must acknowledge all amendments issued to this solicitation. `;
  text += `Failure to acknowledge amendments may render an offer non-responsive.\n`;

  return text;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION M BUILDER
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_FACTORS = [
  { id: "tech",  label: "Technical Approach",    weight: 30, method: "RATED",  desc: "The Government will evaluate the offeror's understanding of the requirement and the soundness of the proposed technical approach, methodology, and feasibility." },
  { id: "mgmt",  label: "Management Approach",   weight: 20, method: "RATED",  desc: "The Government will evaluate the offeror's management plan, organizational structure, key personnel qualifications, and ability to manage the effort." },
  { id: "past",  label: "Past Performance",      weight: 20, method: "RATED",  desc: "The Government will evaluate the relevance and quality of the offeror's recent and relevant past performance on contracts of similar scope and complexity." },
  { id: "sb",    label: "Small Business Utilization", weight: 10, method: "RATED", desc: "The Government will evaluate the extent to which small business concerns are proposed as subcontractors." },
  { id: "price", label: "Price/Cost",            weight: 20, method: "PRICE",  desc: "Price will be evaluated for reasonableness. The Government will perform a price analysis in accordance with FAR 15.404-1." },
];

const RATING_SCALES = {
  RATED: ["Outstanding", "Good", "Acceptable", "Marginal", "Unacceptable"],
  ADJ:   ["Substantial Confidence", "Satisfactory Confidence", "Limited Confidence", "No Confidence", "Unknown"],
  PASS:  ["Pass", "Fail"],
};

export function SectionMBuilder({ intake, onGenerated }) {
  const [factors, setFactors] = useState(DEFAULT_FACTORS);
  const [awardMethod, setAwardMethod] = useState("TRADEOFF"); // TRADEOFF or LPTA
  const [ratingScale, setRatingScale] = useState("RATED");
  const [pastPerfScale, setPastPerfScale] = useState("ADJ");
  const [editingId, setEditingId] = useState(null);
  const [copied, setCopied] = useState(false);

  const totalWeight = factors.reduce((s, f) => s + (parseInt(f.weight) || 0), 0);

  function updateFactor(id, field, value) {
    setFactors(ff => ff.map(f => f.id === id ? { ...f, [field]: value } : f));
  }

  function addFactor() {
    const id = "f" + Date.now();
    setFactors(ff => [...ff, { id, label: "New Factor", weight: 10, method: "RATED", desc: "" }]);
    setEditingId(id);
  }

  function removeFactor(id) {
    setFactors(ff => ff.filter(f => f.id !== id));
  }

  function moveUp(id) {
    setFactors(ff => {
      const i = ff.findIndex(f => f.id === id);
      if (i === 0) return ff;
      const n = [...ff];
      [n[i-1], n[i]] = [n[i], n[i-1]];
      return n;
    });
  }

  const text = useMemo(() => buildSectionMText({ intake, factors, awardMethod, ratingScale, pastPerfScale }),
    [intake, factors, awardMethod, ratingScale, pastPerfScale]);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 0, minHeight: 500 }}>

        {/* Left — controls */}
        <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "70vh" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>SECTION M PARAMETERS</div>

          {label("AWARD METHOD")}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[["TRADEOFF", "Best Value Tradeoff"], ["LPTA", "Lowest Price Technically Acceptable"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setAwardMethod(val)}
                style={{ flex: 1, padding: "7px", borderRadius: 3, cursor: "pointer", fontSize: 10,
                         background: awardMethod === val ? "#0a2a4a" : C.bg3,
                         border: `1px solid ${awardMethod === val ? C.blue : C.border}`,
                         color: awardMethod === val ? C.blue : C.dim }}>
                {lbl}
              </button>
            ))}
          </div>

          {label("TECHNICAL/MANAGEMENT RATING SCALE")}
          <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
            {Object.keys(RATING_SCALES).map(s => (
              <button key={s} onClick={() => setRatingScale(s)}
                style={{ padding: "5px 10px", borderRadius: 3, cursor: "pointer", fontSize: 10,
                         background: ratingScale === s ? "#0a2a4a" : C.bg3,
                         border: `1px solid ${ratingScale === s ? C.blue : C.border}`,
                         color: ratingScale === s ? C.blue : C.dim }}>
                {s}
              </button>
            ))}
          </div>

          {label("PAST PERFORMANCE RATING SCALE")}
          <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
            {Object.keys(RATING_SCALES).map(s => (
              <button key={s} onClick={() => setPastPerfScale(s)}
                style={{ padding: "5px 10px", borderRadius: 3, cursor: "pointer", fontSize: 10,
                         background: pastPerfScale === s ? "#0a2a4a" : C.bg3,
                         border: `1px solid ${pastPerfScale === s ? C.blue : C.border}`,
                         color: pastPerfScale === s ? C.blue : C.dim }}>
                {s}
              </button>
            ))}
          </div>

          {label("EVALUATION FACTORS")}
          <div style={{ fontSize: 9, color: totalWeight === 100 ? C.green : C.red, marginBottom: 6 }}>
            Total weight: {totalWeight}% {totalWeight !== 100 ? "⚠ must equal 100%" : "✓"}
          </div>

          {factors.map((f, i) => (
            <div key={f.id} style={{ background: C.bg3, border: `1px solid ${editingId === f.id ? C.blue : C.border}`,
                                      borderRadius: 4, marginBottom: 6, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", cursor: "pointer" }}
                onClick={() => setEditingId(editingId === f.id ? null : f.id)}>
                <span style={{ fontSize: 10, color: C.blue, minWidth: 16 }}>{i+1}.</span>
                <span style={{ fontSize: 11, color: C.text, flex: 1 }}>{f.label}</span>
                <span style={{ fontSize: 10, color: C.yellow }}>{f.weight}%</span>
                <span style={{ fontSize: 9, color: C.muted, marginLeft: 4 }}>{f.method}</span>
                <span style={{ fontSize: 10, color: C.muted }}>▾</span>
              </div>
              {editingId === f.id && (
                <div style={{ padding: "0 10px 10px", borderTop: `1px solid ${C.border}` }}>
                  {label("FACTOR TITLE")}
                  <input style={inp} value={f.label} onChange={e => updateFactor(f.id, "label", e.target.value)} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      {label("WEIGHT %")}
                      <input style={inp} type="number" value={f.weight}
                        onChange={e => updateFactor(f.id, "weight", parseInt(e.target.value)||0)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      {label("METHOD")}
                      <select value={f.method} onChange={e => updateFactor(f.id, "method", e.target.value)}
                        style={{ ...inp, marginBottom: 0 }}>
                        <option value="RATED">Rated</option>
                        <option value="PASS">Pass/Fail</option>
                        <option value="PRICE">Price</option>
                        <option value="ADJ">Confidence</option>
                      </select>
                    </div>
                  </div>
                  {label("EVALUATION DESCRIPTION")}
                  <textarea style={textarea} value={f.desc} rows={3}
                    onChange={e => updateFactor(f.id, "desc", e.target.value)} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => moveUp(f.id)}
                      style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.muted,
                               padding: "5px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>↑ MOVE UP</button>
                    <button onClick={() => removeFactor(f.id)}
                      style={{ flex: 1, background: "#1a0a0a", border: "1px solid #4a1a1a", color: "#f07050",
                               padding: "5px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>REMOVE</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={addFactor}
            style={{ width: "100%", background: C.bg3, border: `1px dashed ${C.border}`, color: C.muted,
                     padding: "7px", borderRadius: 3, cursor: "pointer", fontSize: 10, marginTop: 4 }}>
            + ADD FACTOR
          </button>
        </div>

        {/* Right — preview */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <button onClick={copy}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: copied ? C.green : C.blue,
                       padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              {copied ? "✓ COPIED" : "COPY SECTION M"}
            </button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background: "#0a2a1a", border: "1px solid #1a6a3a", color: C.green,
                       padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              SAVE TO PACKAGE
            </button>
          </div>
          <pre style={{ flex: 1, padding: 16, fontSize: 10, color: C.dim, overflow: "auto",
                        maxHeight: "62vh", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildSectionMText({ intake, factors, awardMethod, ratingScale, pastPerfScale }) {
  const t = intake?.reqTitle || "this requirement";

  let text = `SECTION M — EVALUATION FACTORS FOR AWARD\n`;
  text += `${"═".repeat(70)}\n\n`;

  text += `M.1  BASIS FOR AWARD\n\n`;
  if (awardMethod === "TRADEOFF") {
    text += `Award will be made to the responsible offeror whose proposal represents the best value `;
    text += `to the Government, considering the evaluation factors set forth below. The Government `;
    text += `intends to award without discussions; however, the Government reserves the right to `;
    text += `conduct discussions if determined to be in the Government's best interest.\n\n`;
    text += `Non-price factors, when combined, are ${getRelativeImportance(factors)} price.\n\n`;
  } else {
    text += `Award will be made to the lowest priced, technically acceptable offer. The Government `;
    text += `will evaluate technical acceptability on a Pass/Fail basis. Among technically acceptable `;
    text += `offerors, award will be made to the offeror with the lowest evaluated price.\n\n`;
  }

  text += `M.2  EVALUATION FACTORS AND WEIGHTS\n\n`;
  factors.forEach((f, i) => {
    text += `     ${String.fromCharCode(97+i)}. ${f.label} — ${f.weight}%\n`;
  });
  text += `\n`;

  text += `M.3  EVALUATION CRITERIA\n\n`;
  factors.forEach((f, i) => {
    text += `M.3${String.fromCharCode(97+i).toUpperCase()}  ${f.label.toUpperCase()}\n\n`;
    text += `${f.desc}\n\n`;

    const scale = f.id === "past" ? RATING_SCALES[pastPerfScale]
                : f.method === "PRICE" ? null
                : f.method === "PASS" ? RATING_SCALES.PASS
                : RATING_SCALES[ratingScale];

    if (scale) {
      text += `     Rating scale:\n`;
      scale.forEach(r => {
        text += `     • ${r}\n`;
      });
      text += `\n`;
    }
  });

  if (awardMethod === "TRADEOFF") {
    text += `M.4  TRADEOFF PROCESS\n\n`;
    text += `The Source Selection Authority (SSA) will perform a best value tradeoff considering all `;
    text += `evaluation factors. A proposal with higher non-price ratings may be selected over a `;
    text += `lower-priced proposal if the Government determines the difference in non-price factors `;
    text += `is worth the price premium. The Government is not required to make award to the lowest `;
    text += `priced offeror or the highest technically rated offeror.\n\n`;
  }

  text += `M.5  PAST PERFORMANCE EVALUATION\n\n`;
  text += `Past performance will be evaluated based on the relevance and quality of the offeror's `;
  text += `recent (within the past five years) performance on contracts of similar scope, complexity, `;
  text += `and dollar value. The Government will assess relevance (Very Relevant, Relevant, Somewhat `;
  text += `Relevant, Not Relevant) and combine it with quality ratings from CPARS and references.\n\n`;
  text += `An offeror with no relevant past performance will receive a rating of "Unknown Confidence" `;
  text += `(neutral) and will not be evaluated favorably or unfavorably.\n\n`;

  text += `M.6  RESPONSIBILITY DETERMINATION\n\n`;
  text += `Prior to award, the Contracting Officer will make an affirmative determination of `;
  text += `responsibility for the apparent successful offeror in accordance with FAR Subpart 9.1.\n`;

  return text;
}

function getRelativeImportance(factors) {
  const priceWeight = factors.find(f => f.method === "PRICE")?.weight || 0;
  const nonPriceWeight = factors.filter(f => f.method !== "PRICE").reduce((s,f) => s + (f.weight||0), 0);
  if (nonPriceWeight > priceWeight * 2) return "significantly more important than";
  if (nonPriceWeight > priceWeight) return "more important than";
  if (nonPriceWeight === priceWeight) return "equal in importance to";
  return "less important than";
}

// ═══════════════════════════════════════════════════════════════════
// SF-30 MODIFICATION WORKFLOW
// ═══════════════════════════════════════════════════════════════════

const MOD_AUTHORITIES = [
  { value: "FAR 43.103(b)(1)", label: "Administrative Mod — No consideration required", bilateral: false },
  { value: "FAR 43.103(a)", label: "Bilateral — Supplemental Agreement (mutual agreement)", bilateral: true },
  { value: "FAR 52.243-1", label: "Changes Clause — Unilateral change order (within scope)", bilateral: false },
  { value: "FAR 43.103(b)(2)", label: "Unilateral — Definitization of a letter contract", bilateral: false },
  { value: "FAR 17.208(f)", label: "Option Exercise — 52.217-8 Services extension", bilateral: false },
  { value: "FAR 17.208(g)", label: "Option Exercise — 52.217-9 Term extension", bilateral: false },
  { value: "FAR 32.706-1", label: "Funding Mod — Incrementally funded contract", bilateral: false },
  { value: "FAR 52.249-2", label: "Termination for Convenience — Partial or complete", bilateral: true },
  { value: "FAR 52.249-8", label: "Termination for Default", bilateral: false },
  { value: "FAR 36.702", label: "Construction — Changed conditions", bilateral: true },
  { value: "FAR 8.406-6", label: "Task/Delivery Order Mod", bilateral: false },
  { value: "OTHER", label: "Other — specify in description", bilateral: null },
];

const MOD_TYPES = [
  { value: "ADMIN", label: "Administrative Mod", desc: "Correct errors, update POC/addresses, no price/scope change" },
  { value: "FUNDING", label: "Funding Modification", desc: "Add, deobligate, or realign funding" },
  { value: "OPTION", label: "Exercise Option", desc: "Exercise a contract option period or CLIN" },
  { value: "SCOPE", label: "Scope/Work Change", desc: "Add, delete, or modify work/deliverables" },
  { value: "PRICE", label: "Price Adjustment", desc: "Price-only modification, no scope change" },
  { value: "EXTEND", label: "PoP Extension", desc: "Extend the period of performance" },
  { value: "TERMINATE", label: "Termination", desc: "Partial or complete T4C or T4D" },
  { value: "NOVATION", label: "Novation/Name Change", desc: "Contractor legal name or assignment change" },
];

export function ModWorkflow({ intake, onGenerated }) {
  const [step, setStep] = useState(0);
  const [modData, setModData] = useState({
    piid: "", modNumber: "", effectiveDate: "",
    modType: "", authority: "", bilateral: false,
    description: "", fundingChange: "", newObligated: "",
    newPoP: "", priceAdjustment: "", optionClin: "",
    definitizationRequired: false, definitizationDeadline: "",
    rationale: "", legalReview: false, isUCA: false,
  });

  function set(key, value) {
    setModData(d => ({ ...d, [key]: value }));
  }

  const selectedAuth = MOD_AUTHORITIES.find(a => a.value === modData.authority);
  const selectedType = MOD_TYPES.find(t => t.value === modData.modType);

  const sf30 = buildSF30Preview(intake, modData);
  const modDoc = buildModDocument(intake, modData);

  const steps = [
    { id: "TYPE",     label: "Mod Type" },
    { id: "AUTHORITY", label: "Authority" },
    { id: "DETAILS",  label: "Details" },
    { id: "REVIEW",   label: "SF-30 Preview" },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text }}>
      {/* Step progress */}
      <div style={{ display: "flex", gap: 2, padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
        {steps.map((s, i) => (
          <div key={s.id} onClick={() => i < step || modData.modType ? setStep(i) : null}
            style={{ flex: 1, padding: "6px 10px", borderRadius: 3, textAlign: "center", cursor: "pointer",
                     background: step === i ? "#0a2a4a" : i < step ? "#041a0e" : C.bg3,
                     border: `1px solid ${step === i ? C.blue : i < step ? "#1a6a3a" : C.border}`,
                     color: step === i ? C.blue : i < step ? C.green : C.dim, fontSize: 10 }}>
            {i < step ? "✓ " : ""}{s.label}
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* Step 0 — Mod Type */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>SELECT MODIFICATION TYPE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {MOD_TYPES.map(mt => (
                <div key={mt.value} onClick={() => { set("modType", mt.value); setStep(1); }}
                  style={{ background: modData.modType === mt.value ? "#0a2a4a" : C.bg3,
                           border: `1px solid ${modData.modType === mt.value ? C.blue : C.border}`,
                           borderRadius: 4, padding: "10px 12px", cursor: "pointer" }}>
                  <div style={{ fontSize: 11, color: modData.modType === mt.value ? C.blue : C.text, fontWeight: "bold" }}>
                    {mt.label}
                  </div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{mt.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Authority */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>SELECT MODIFICATION AUTHORITY</div>
            {MOD_AUTHORITIES.map(auth => (
              <div key={auth.value} onClick={() => { set("authority", auth.value); set("bilateral", auth.bilateral); }}
                style={{ background: modData.authority === auth.value ? "#0a2a4a" : C.bg3,
                         border: `1px solid ${modData.authority === auth.value ? C.blue : C.border}`,
                         borderRadius: 4, padding: "9px 12px", marginBottom: 5, cursor: "pointer",
                         display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%",
                               background: modData.authority === auth.value ? C.blue : "transparent",
                               border: `2px solid ${modData.authority === auth.value ? C.blue : "#2a4a6a"}`,
                               flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: modData.authority === auth.value ? C.blue : C.text }}>
                    {auth.value !== "OTHER" ? auth.value + " — " : ""}{auth.label}
                  </div>
                  {auth.bilateral !== null && (
                    <div style={{ fontSize: 9, color: auth.bilateral ? C.yellow : C.green, marginTop: 2 }}>
                      {auth.bilateral ? "⚠ BILATERAL — requires contractor signature" : "✓ UNILATERAL — CO signature only"}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setStep(0)}
                style={{ flex: 1, background: C.bg3, border: `1px solid ${C.border}`, color: C.muted,
                         padding: "8px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>← BACK</button>
              <button onClick={() => modData.authority && setStep(2)}
                style={{ flex: 2, background: modData.authority ? "#0a2a4a" : C.bg3,
                         border: `1px solid ${modData.authority ? C.blue : C.border}`,
                         color: modData.authority ? C.blue : C.dim,
                         padding: "8px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
                NEXT →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div style={{ maxHeight: "60vh", overflow: "auto" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>MODIFICATION DETAILS</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                {label("CONTRACT PIID")}
                <input style={inp} value={modData.piid} onChange={e => set("piid", e.target.value)}
                  placeholder="e.g., 80ARC024C0001" />
              </div>
              <div>
                {label("MOD NUMBER")}
                <input style={inp} value={modData.modNumber} onChange={e => set("modNumber", e.target.value)}
                  placeholder="e.g., P00001" />
              </div>
            </div>

            {label("EFFECTIVE DATE")}
            <input style={inp} type="date" value={modData.effectiveDate} onChange={e => set("effectiveDate", e.target.value)} />

            {label("DESCRIPTION OF MODIFICATION (SF-30 Block 14)")}
            <textarea style={{ ...textarea, minHeight: 100 }} value={modData.description}
              onChange={e => set("description", e.target.value)}
              placeholder="The purpose of this modification is to..." />

            {(modData.modType === "FUNDING" || modData.modType === "PRICE") && (<>
              {label("FUNDING / PRICE CHANGE (+/-)")}
              <input style={inp} value={modData.fundingChange} onChange={e => set("fundingChange", e.target.value)}
                placeholder="e.g., +$50,000.00" />
              {label("NEW TOTAL OBLIGATED AMOUNT")}
              <input style={inp} value={modData.newObligated} onChange={e => set("newObligated", e.target.value)}
                placeholder="e.g., $450,000.00" />
              {label("ACCOUNTING / APPROPRIATION DATA")}
              <input style={inp} value={modData.fundCite || intake?.fundCite || ""}
                onChange={e => set("fundCite", e.target.value)} placeholder="Fund cite / ACRN" />
            </>)}

            {modData.modType === "OPTION" && (<>
              {label("OPTION CLIN BEING EXERCISED")}
              <input style={inp} value={modData.optionClin} onChange={e => set("optionClin", e.target.value)}
                placeholder="e.g., CLIN 1001 — Option Year 1" />
            </>)}

            {(modData.modType === "EXTEND" || modData.modType === "OPTION") && (<>
              {label("NEW PERIOD OF PERFORMANCE END DATE")}
              <input style={inp} type="date" value={modData.newPoP} onChange={e => set("newPoP", e.target.value)} />
            </>)}

            {modData.modType === "SCOPE" && (<>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div onClick={() => set("isUCA", !modData.isUCA)}
                  style={{ width: 14, height: 14, border: `1px solid ${modData.isUCA ? C.yellow : "#2a4a6a"}`,
                           borderRadius: 2, background: modData.isUCA ? C.yellow : "transparent",
                           cursor: "pointer", flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: C.dim }}>Undefinitized Contract Action (UCA) — definitization required within 180 days</span>
              </div>
              {modData.isUCA && (<>
                {label("DEFINITIZATION DEADLINE")}
                <input style={inp} type="date" value={modData.definitizationDeadline}
                  onChange={e => set("definitizationDeadline", e.target.value)} />
              </>)}
            </>)}

            {label("RATIONALE / CONTRACTING OFFICER DETERMINATION")}
            <textarea style={textarea} value={modData.rationale}
              onChange={e => set("rationale", e.target.value)}
              placeholder="Document the basis for this modification..." rows={3} />

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div onClick={() => set("legalReview", !modData.legalReview)}
                style={{ width: 14, height: 14, border: `1px solid ${modData.legalReview ? C.green : "#2a4a6a"}`,
                         borderRadius: 2, background: modData.legalReview ? C.green : "transparent",
                         cursor: "pointer", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: C.dim }}>Legal review obtained (required if scope change &gt; $5M)</span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(1)}
                style={{ flex: 1, background: C.bg3, border: `1px solid ${C.border}`, color: C.muted,
                         padding: "8px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>← BACK</button>
              <button onClick={() => setStep(3)}
                style={{ flex: 2, background: "#0a2a4a", border: `1px solid ${C.blue}`, color: C.blue,
                         padding: "8px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
                PREVIEW SF-30 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — SF-30 Preview */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>
              SF-30 AMENDMENT / MODIFICATION OF CONTRACT
            </div>

            {/* SF-30 block grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 12 }}>
              {Object.entries(sf30).map(([block, field]) => (
                <div key={block} style={{ background: C.bg3, border: `1px solid ${C.border}`,
                                           borderRadius: 3, padding: "6px 8px" }}>
                  <div style={{ fontSize: 9, color: C.muted }}>{block.replace("block","Block ")} — {field.label}</div>
                  <div style={{ fontSize: 11, color: field.value ? C.text : "#2a4a6a", marginTop: 2 }}>
                    {field.value || "—"}
                  </div>
                </div>
              ))}
            </div>

            {selectedAuth?.bilateral && (
              <div style={{ background: "#1a1a04", border: "1px solid #4a4a1a", borderRadius: 4,
                             padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.yellow, fontWeight: "bold" }}>⚠ BILATERAL MODIFICATION</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>
                  This modification requires contractor concurrence. The contractor must sign Block 18
                  before the CO signs Block 22. Do not issue a unilateral modification for this action type.
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep(2)}
                style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.muted,
                         padding: "7px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>← BACK</button>
              <button onClick={() => { navigator.clipboard.writeText(modDoc); }}
                style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                         padding: "7px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
                COPY MOD DOCUMENT
              </button>
              <button onClick={() => onGenerated && onGenerated(modDoc, "MOD_" + (modData.modNumber || "P00001"))}
                style={{ background: "#0a2a1a", border: "1px solid #1a6a3a", color: C.green,
                         padding: "7px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
                SAVE TO PACKAGE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildSF30Preview(intake, modData) {
  return {
    block1:  { label: "Contract/Order ID (PIID)",         value: modData.piid || "" },
    block2:  { label: "Mod Number",                        value: modData.modNumber || "" },
    block3:  { label: "Effective Date",                    value: modData.effectiveDate || "" },
    block6:  { label: "Issued By",                         value: intake?.center || "NASA ARC" },
    block7:  { label: "Administered By",                   value: intake?.center || "NASA ARC" },
    block13: { label: "Modification Authority",            value: modData.authority || "" },
    block13b:{ label: "Bilateral / Unilateral",            value: modData.bilateral ? "Bilateral" : "Unilateral" },
    block14: { label: "Description of Mod",                value: (modData.description || "").slice(0,80) + (modData.description?.length > 80 ? "..." : "") },
    block15: { label: "Total Amount Before Mod",           value: modData.prevTotal || "" },
    block16: { label: "Amount of This Mod",                value: modData.fundingChange || "$0.00" },
    block17: { label: "New Total Contract Amount",         value: modData.newObligated || "" },
    block22: { label: "Contracting Officer",               value: intake?.coName || "" },
  };
}

function buildModDocument(intake, modData) {
  const auth = MOD_AUTHORITIES.find(a => a.value === modData.authority);
  const type = MOD_TYPES.find(t => t.value === modData.modType);
  const date = modData.effectiveDate
    ? new Date(modData.effectiveDate + "T12:00:00").toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })
    : "[EFFECTIVE DATE]";

  let text = `SF-30 — AMENDMENT OF SOLICITATION / MODIFICATION OF CONTRACT\n`;
  text += `${"═".repeat(70)}\n\n`;
  text += `Block 1.  Contract/Order PIID:  ${modData.piid || "[PIID]"}\n`;
  text += `Block 2.  Mod Number:           ${modData.modNumber || "[MOD NUMBER]"}\n`;
  text += `Block 3.  Effective Date:       ${date}\n`;
  text += `Block 6.  Issued By:            ${intake?.center || "NASA ARC"}\n`;
  text += `Block 7.  Administered By:      ${intake?.center || "NASA ARC"}\n`;
  text += `Block 8.  Contractor:           [CONTRACTOR NAME AND ADDRESS]\n`;
  text += `Block 9.  Code (UEI):           [UEI]\n\n`;
  text += `Block 13. Authority for Modification: ${auth?.value || modData.authority || "[AUTHORITY]"}\n`;
  text += `          ${auth?.label || ""}\n`;
  text += `          ${modData.bilateral ? "BILATERAL — Requires contractor signature" : "UNILATERAL — CO signature only"}\n\n`;
  text += `Block 14. Description of Amendment/Modification:\n\n`;
  text += `The purpose of Modification No. ${modData.modNumber || "[MOD NUMBER]"} to Contract No. `;
  text += `${modData.piid || "[PIID]"} is as follows:\n\n`;
  text += `${modData.description || "[DESCRIPTION OF MODIFICATION]"}\n\n`;

  if (modData.fundingChange || modData.newObligated) {
    text += `FUNDING:\n`;
    text += `  Amount of this modification: ${modData.fundingChange || "$0.00"}\n`;
    text += `  New total obligated amount:  ${modData.newObligated || "[NEW TOTAL]"}\n\n`;
  }

  if (modData.newPoP) {
    const newEnd = new Date(modData.newPoP + "T12:00:00").toLocaleDateString("en-US",{ year:"numeric",month:"long",day:"numeric"});
    text += `PERIOD OF PERFORMANCE:\n`;
    text += `  New period of performance end date: ${newEnd}\n\n`;
  }

  if (modData.isUCA && modData.definitizationDeadline) {
    const defDate = new Date(modData.definitizationDeadline + "T12:00:00").toLocaleDateString("en-US",{ year:"numeric",month:"long",day:"numeric"});
    text += `UNDEFINITIZED CONTRACT ACTION:\n`;
    text += `  This action is undefinitized. Definitization is required no later than ${defDate} `;
    text += `per FAR 43.103(b)(3).\n\n`;
  }

  if (modData.rationale) {
    text += `CONTRACTING OFFICER DETERMINATION:\n`;
    text += `${modData.rationale}\n\n`;
  }

  text += `All other terms and conditions remain unchanged.\n\n`;
  text += `${"─".repeat(70)}\n\n`;

  if (modData.bilateral) {
    text += `CONTRACTOR:\n\n`;
    text += `_".repeat(40)}\n`;
    text += `Authorized Contractor Representative\n`;
    text += `Date: ________________\n\n`;
  }

  text += `CONTRACTING OFFICER:\n\n`;
  text += `${"_".repeat(40)}\n`;
  text += `${intake?.coName || "[CONTRACTING OFFICER NAME]"}\n`;
  text += `Contracting Officer\n`;
  text += `${intake?.center || "NASA"}\n`;
  text += `Date: ________________\n`;

  return text;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION I WORD EXPORT
// ═══════════════════════════════════════════════════════════════════

export async function exportSectionIWord(sectionIText, intake) {
  try {
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel,
      AlignmentType, convertInchesToTwip, PageBreak,
      Table, TableRow, TableCell, WidthType, BorderStyle,
    } = await import("docx");

    const title   = intake?.reqTitle || "NASA Requirement";
    const center  = intake?.center   || "NASA Ames Research Center";
    const date    = new Date().toLocaleDateString("en-US",{ year:"numeric", month:"long", day:"numeric" });

    const noBorder = {
      top:    { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left:   { style: BorderStyle.NONE, size: 0 },
      right:  { style: BorderStyle.NONE, size: 0 },
    };

    // Parse Section I text into Word paragraphs
    const bodyParas = sectionIText.split("\n").map(line => {
      const t = line.trimEnd();
      if (!t) return new Paragraph({ text: "", spacing: { after: 60 } });
      // Section headers (all caps lines)
      if (/^[A-Z\s\-\/]+$/.test(t) && t.length > 6 && !t.includes("─")) {
        return new Paragraph({
          children: [new TextRun({ text: t, bold: true, size: 22, font: "Times New Roman" })],
          spacing: { before: 200, after: 80 },
        });
      }
      // Clause number lines (start with 52. or 1852.)
      if (/^(52|1852)\./.test(t.trimStart())) {
        return new Paragraph({
          children: [new TextRun({ text: t, bold: true, size: 22, font: "Times New Roman" })],
          spacing: { before: 120, after: 40 },
        });
      }
      // Divider lines
      if (/^─+$/.test(t)) {
        return new Paragraph({
          children: [new TextRun({ text: "─".repeat(60), size: 18, font: "Times New Roman", color: "888888" })],
          spacing: { after: 60 },
        });
      }
      // Fill-in lines (indented)
      if (t.startsWith("  ")) {
        return new Paragraph({
          children: [new TextRun({ text: t, size: 20, font: "Times New Roman", italics: t.includes("[") })],
          spacing: { after: 40 },
          indent: { left: 360 },
        });
      }
      return new Paragraph({
        children: [new TextRun({ text: t, size: 22, font: "Times New Roman" })],
        spacing: { after: 80 },
      });
    });

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: "Times New Roman", size: 22 } },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left:   convertInchesToTwip(1.25),
              right:  convertInchesToTwip(1.25),
            },
          },
        },
        children: [
          // Header
          new Paragraph({
            children: [new TextRun({ text: "NATIONAL AERONAUTICS AND SPACE ADMINISTRATION", bold: true, size: 24, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: center, bold: true, size: 22, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "SOLICITATION/CONTRACT", bold: true, size: 22, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: title, size: 22, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: date, size: 20, italics: true, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          // Body
          ...bodyParas,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SectionI_" + title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "_").slice(0, 30) + ".docx";
    a.click();
    URL.revokeObjectURL(url);
    return null;
  } catch(e) {
    return "Section I Word export failed: " + e.message;
  }
}
