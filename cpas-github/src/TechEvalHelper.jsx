// CPAS Technical Evaluation Helper
// Structured tool for Tech Reps / Technical Evaluation Boards (TEB)
// Walks evaluators through each Section M factor
// Documents ratings, narrative, flags missing justification
// Produces signed Technical Evaluation document for source selection file

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

// ── Rating scales ─────────────────────────────────────────────────
const ADJECTIVAL_RATINGS = [
  { id: "EXCEPTIONAL",    label: "Exceptional",     color: "#3aaa66", bg: "#041a0e",
    def: "Exceeds specified performance or capability in a way beneficial to the Government. Very high likelihood of success. No weaknesses." },
  { id: "VERY_GOOD",      label: "Very Good",       color: "#4a9eff", bg: "#041020",
    def: "Exceeds specified performance in some areas, unlikely to cause significant problems. Low risk. Minor weaknesses easily corrected." },
  { id: "SATISFACTORY",   label: "Satisfactory",    color: "#f4c542", bg: "#1a1a04",
    def: "Meets specified performance. Reasonable likelihood of success. Some weaknesses but correctable." },
  { id: "MARGINAL",       label: "Marginal",        color: "#e87c3e", bg: "#1a0a04",
    def: "Does not clearly meet some requirements. Significant weaknesses. Low likelihood of success without major correction." },
  { id: "UNACCEPTABLE",   label: "Unacceptable",    color: "#ff4a4a", bg: "#1a0404",
    def: "Does not meet requirements. Significant deficiencies unlikely to be corrected. No reasonable likelihood of success." },
];

const CONFIDENCE_RATINGS = [
  { id: "HIGH",     label: "High Confidence",    color: "#3aaa66" },
  { id: "MODERATE", label: "Moderate Confidence", color: "#f4c542" },
  { id: "LOW",      label: "Low Confidence",      color: "#e87c3e" },
  { id: "UNKNOWN",  label: "Unknown Risk",        color: "#7a9ab8" },
];

const LPTA_RATINGS = [
  { id: "ACCEPTABLE",   label: "Acceptable",   color: "#3aaa66", bg: "#041a0e" },
  { id: "UNACCEPTABLE", label: "Unacceptable", color: "#ff4a4a", bg: "#1a0404" },
];

// ── Helper: Rating badge ──────────────────────────────────────────
function RatingBadge({ rating, scale = "ADJECTIVAL", size = "small" }) {
  const scales = scale === "ADJECTIVAL" ? ADJECTIVAL_RATINGS : scale === "CONFIDENCE" ? CONFIDENCE_RATINGS : LPTA_RATINGS;
  const r = scales.find(r => r.id === rating);
  if (!r) return null;
  return (
    <span style={{ background: r.bg || C.bg3, border: `1px solid ${r.color}`, color: r.color,
                   fontSize: size === "small" ? 9 : 11, padding: size === "small" ? "2px 8px" : "3px 12px",
                   borderRadius: 10, fontWeight: "bold" }}>
      {r.label}
    </span>
  );
}

// ── Strength / Weakness entry ─────────────────────────────────────
function SWEntry({ items, onAdd, onRemove, onUpdate, type }) {
  const color = type === "strength" ? C.green : type === "weakness" ? C.red : C.yellow;
  const label = type === "strength" ? "Strength" : type === "weakness" ? "Weakness" : "Deficiency";
  const placeholder = type === "strength"
    ? "Describe a specific aspect that exceeds requirements or provides clear benefit to the Government..."
    : type === "weakness"
    ? "Describe a flaw that increases risk or fails to meet requirements..."
    : "Describe a material failure to meet a requirement...";

  return (
    <div>
      {items.map((item, i) => (
        <div key={item.id} style={{ background: C.bg3, border: `1px solid ${color}22`, borderRadius: 4, padding: "8px 10px", marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color, fontWeight: "bold" }}>{label} #{i + 1}</span>
            <button onClick={() => onRemove(item.id)}
              style={{ background: "none", border: "none", color: "#3a2a2a", cursor: "pointer", fontSize: 13 }}>×</button>
          </div>
          <textarea value={item.text} onChange={e => onUpdate(item.id, e.target.value)}
            placeholder={placeholder}
            style={{ ...ta, minHeight: 44, border: `1px solid ${color}44` }} rows={2} />
        </div>
      ))}
      <button onClick={onAdd}
        style={{ width: "100%", background: "transparent", border: `1px dashed ${color}66`,
                 color: color + "99", padding: "5px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
        + Add {label}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function TechEvalHelper({ intake, onGenerated }) {
  const [meta, setMeta] = useState({
    contractTitle:    intake?.reqTitle  || "",
    solNumber:        intake?.solNumber || "",
    offerorName:      "",
    evalType:         "ADJECTIVAL",   // ADJECTIVAL, LPTA
    isLPTA:           intake?.evalMethod === "LPTA",
    evaluatorName:    "",
    evaluatorTitle:   "",
    evaluatorOrg:     "",
    coName:           intake?.coName   || "",
    evalDate:         "",
    priceProposed:    "",
    volumeReviewed:   "Technical Volume",
    proposalDate:     "",
    overallRating:    "",
    overallNarrative: "",
    priceEvalNotes:   "",
    pastPerfRating:   "",
    pastPerfNarrative:"",
    recommendation:   "",
    conflicts:        "",
    hasConflict:      false,
  });

  const [factors, setFactors] = useState([
    { id: 1, name: "Technical Approach",       weight: "", rating: "", narrative: "", strengths: [], weaknesses: [], deficiencies: [], risks: [] },
    { id: 2, name: "Management Approach",      weight: "", rating: "", narrative: "", strengths: [], weaknesses: [], deficiencies: [], risks: [] },
    { id: 3, name: "Staffing / Key Personnel", weight: "", rating: "", narrative: "", strengths: [], weaknesses: [], deficiencies: [], risks: [] },
  ]);

  const setMeta_ = (k, v) => setMeta(m => ({ ...m, [k]: v }));

  function addFactor() {
    setFactors(f => [...f, {
      id: Date.now(), name: "", weight: "", rating: "",
      narrative: "", strengths: [], weaknesses: [], deficiencies: [], risks: [],
    }]);
  }

  function updateFactor(id, field, val) {
    setFactors(f => f.map(x => x.id === id ? { ...x, [field]: val } : x));
  }

  function addSW(factorId, type) {
    setFactors(f => f.map(x => x.id === factorId ? {
      ...x, [type]: [...x[type], { id: Date.now(), text: "" }]
    } : x));
  }

  function removeSW(factorId, type, itemId) {
    setFactors(f => f.map(x => x.id === factorId ? {
      ...x, [type]: x[type].filter(s => s.id !== itemId)
    } : x));
  }

  function updateSW(factorId, type, itemId, val) {
    setFactors(f => f.map(x => x.id === factorId ? {
      ...x, [type]: x[type].map(s => s.id === itemId ? { ...s, text: val } : s)
    } : x));
  }

  // Completeness checks
  const ratingScale = meta.isLPTA ? LPTA_RATINGS : ADJECTIVAL_RATINGS;

  const factorIssues = useMemo(() => {
    const issues = [];
    factors.forEach(f => {
      if (!f.name) issues.push(`Factor #${f.id}: missing name`);
      if (!f.rating) issues.push(`"${f.name || "Unnamed factor"}": no rating assigned`);
      if (!f.narrative || f.narrative.length < 50)
        issues.push(`"${f.name || "Unnamed factor"}": narrative too short (need ≥50 chars)`);
      if (f.rating === "EXCEPTIONAL" && f.strengths.length === 0)
        issues.push(`"${f.name}": Exceptional rating requires documented strengths`);
      if ((f.rating === "MARGINAL" || f.rating === "UNACCEPTABLE") && f.weaknesses.length === 0 && f.deficiencies.length === 0)
        issues.push(`"${f.name}": ${f.rating} rating requires documented weaknesses/deficiencies`);
    });
    if (!meta.evaluatorName) issues.push("Evaluator name required");
    if (!meta.overallRating) issues.push("Overall rating required");
    return issues;
  }, [factors, meta]);

  const text = useMemo(() => buildEvalText(meta, factors), [meta, factors]);

  const [activeFactorId, setActiveFactorId] = useState(factors[0]?.id);
  const activeFactor = factors.find(f => f.id === activeFactorId);

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text, background: C.bg }}>

      {/* Top bar */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.bg2 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 4 }}>TECHNICAL EVALUATION HELPER — SOURCE SELECTION SENSITIVE</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            {lbl("Contract / Requirement Title")}
            <input style={inp} value={meta.contractTitle} onChange={e => setMeta_("contractTitle", e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            {lbl("Solicitation No.")}
            <input style={inp} value={meta.solNumber} onChange={e => setMeta_("solNumber", e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            {lbl("Offeror / Company Name")}
            <input style={inp} value={meta.offerorName} onChange={e => setMeta_("offerorName", e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            {lbl("Evaluation Method")}
            <select style={inp} value={meta.isLPTA ? "LPTA" : "ADJECTIVAL"} onChange={e => setMeta_("isLPTA", e.target.value === "LPTA")}>
              <option value="ADJECTIVAL">Adjectival (Best Value)</option>
              <option value="LPTA">LPTA (Accept/Unaccept)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            {lbl("Evaluation Date")}
            <input style={inp} type="date" value={meta.evalDate} onChange={e => setMeta_("evalDate", e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 360px", height: "calc(100vh - 140px)", overflow: "hidden" }}>

        {/* Left — Factor list */}
        <div style={{ borderRight: `1px solid ${C.border}`, overflow: "auto", padding: 12 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>EVALUATION FACTORS</div>

          {factors.map((f, i) => {
            const r = ratingScale.find(r => r.id === f.rating);
            const hasIssues = !f.rating || !f.narrative || f.narrative.length < 50;
            return (
              <div key={f.id} onClick={() => setActiveFactorId(f.id)}
                style={{ background: activeFactorId === f.id ? "#0a2a4a" : C.bg3,
                         border: `1px solid ${activeFactorId === f.id ? C.blue : hasIssues ? "#3a2a0a" : C.border}`,
                         borderRadius: 4, padding: "8px 10px", marginBottom: 6, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 10, color: activeFactorId === f.id ? C.blue : C.text, fontWeight: "bold", flex: 1 }}>
                    {f.name || `Factor ${i + 1}`}
                  </div>
                  {hasIssues && <span style={{ fontSize: 8, color: C.yellow }}>⚠</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  {f.rating ? <RatingBadge rating={f.rating} scale={meta.isLPTA ? "LPTA" : "ADJECTIVAL"} /> : <span style={{ fontSize: 9, color: C.dim }}>Not rated</span>}
                  {f.weight && <span style={{ fontSize: 9, color: C.muted }}>{f.weight}%</span>}
                </div>
              </div>
            );
          })}

          <button onClick={addFactor}
            style={{ width: "100%", background: "transparent", border: `1px dashed ${C.border}`, color: C.muted,
                     padding: "6px", borderRadius: 3, cursor: "pointer", fontSize: 10, marginBottom: 12 }}>
            + Add Factor
          </button>

          {/* Past Performance */}
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 6, marginTop: 4 }}>PAST PERFORMANCE</div>
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", marginBottom: 12 }}>
            {lbl("PP Confidence Rating")}
            <select style={{ ...inp, fontSize: 10 }} value={meta.pastPerfRating} onChange={e => setMeta_("pastPerfRating", e.target.value)}>
              <option value="">Select...</option>
              {CONFIDENCE_RATINGS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {/* Overall */}
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 6 }}>OVERALL</div>
          <div style={{ background: C.bg3, border: `1px solid ${meta.overallRating ? C.blue : "#3a2a0a"}`, borderRadius: 4, padding: "8px 10px", marginBottom: 12 }}>
            {lbl("Overall Technical Rating", true)}
            <select style={{ ...inp, fontSize: 10 }} value={meta.overallRating} onChange={e => setMeta_("overallRating", e.target.value)}>
              <option value="">Select...</option>
              {ratingScale.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {/* Issues */}
          {factorIssues.length > 0 && (
            <div style={{ background: "#1a1a04", border: "1px solid #4a4a14", borderRadius: 4, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: C.yellow, marginBottom: 4 }}>⚠ INCOMPLETE ({factorIssues.length})</div>
              {factorIssues.map((issue, i) => (
                <div key={i} style={{ fontSize: 8.5, color: "#8a8a40", marginBottom: 2 }}>• {issue}</div>
              ))}
            </div>
          )}
        </div>

        {/* Center — Active factor editor */}
        <div style={{ overflow: "auto", padding: 16 }}>
          {activeFactor ? (
            <>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>FACTOR EVALUATION</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 8, marginBottom: 14 }}>
                <div>
                  {lbl("Factor Name", true)}
                  <input style={inp} value={activeFactor.name}
                    onChange={e => updateFactor(activeFactor.id, "name", e.target.value)}
                    placeholder="e.g., Technical Approach" />
                </div>
                <div>
                  {lbl("Evaluation Sub-area (optional)")}
                  <input style={inp} value={activeFactor.subarea || ""}
                    onChange={e => updateFactor(activeFactor.id, "subarea", e.target.value)}
                    placeholder="e.g., Staffing Plan sub-factor" />
                </div>
                <div>
                  {lbl("Weight (%)")}
                  <input style={inp} value={activeFactor.weight}
                    onChange={e => updateFactor(activeFactor.id, "weight", e.target.value)} placeholder="0" type="number" />
                </div>
              </div>

              {/* Rating selector */}
              <div style={{ marginBottom: 14 }}>
                {lbl("Rating", true)}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ratingScale.map(r => (
                    <button key={r.id} onClick={() => updateFactor(activeFactor.id, "rating", r.id)}
                      style={{ padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: "bold",
                               background: activeFactor.rating === r.id ? r.bg || "#0a2a4a" : C.bg3,
                               border: `1px solid ${activeFactor.rating === r.id ? r.color : C.border}`,
                               color: activeFactor.rating === r.id ? r.color : C.dim }}>
                      {r.label}
                    </button>
                  ))}
                </div>
                {activeFactor.rating && (
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 5, fontStyle: "italic" }}>
                    {ADJECTIVAL_RATINGS.concat(LPTA_RATINGS).find(r => r.id === activeFactor.rating)?.def}
                  </div>
                )}
              </div>

              {/* Narrative */}
              <div style={{ marginBottom: 14 }}>
                {lbl("Evaluation Narrative", true)}
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 4 }}>
                  Document specific aspects of the proposal that support this rating. Reference the proposal section, page, or exhibit.
                  Minimum ~50 words. Avoid conclusory statements — be specific.
                </div>
                <textarea style={{ ...ta, minHeight: 100 }} rows={5}
                  value={activeFactor.narrative}
                  onChange={e => updateFactor(activeFactor.id, "narrative", e.target.value)}
                  placeholder={`Describe what the offeror proposed for ${activeFactor.name || "this factor"} and why it warrants the assigned rating. Reference specific sections: e.g., "The offeror's Technical Volume, Section 3.2 (p. 12) describes..."`} />
                <div style={{ fontSize: 9, color: activeFactor.narrative?.length < 50 ? C.yellow : C.muted, marginTop: 3, textAlign: "right" }}>
                  {activeFactor.narrative?.length || 0} characters {activeFactor.narrative?.length < 50 ? "(need more detail)" : "✓"}
                </div>
              </div>

              {/* Strengths */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.green, fontWeight: "bold", marginBottom: 6 }}>
                  STRENGTHS ({activeFactor.strengths.length})
                  <span style={{ fontSize: 9, color: C.dim, fontWeight: "normal", marginLeft: 8 }}>
                    {["EXCEPTIONAL","VERY_GOOD"].includes(activeFactor.rating) ? "Required for this rating" : "Optional but recommended"}
                  </span>
                </div>
                <SWEntry
                  items={activeFactor.strengths}
                  type="strength"
                  onAdd={() => addSW(activeFactor.id, "strengths")}
                  onRemove={id => removeSW(activeFactor.id, "strengths", id)}
                  onUpdate={(id, val) => updateSW(activeFactor.id, "strengths", id, val)}
                />
              </div>

              {/* Weaknesses */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: C.red, fontWeight: "bold", marginBottom: 6 }}>
                  WEAKNESSES ({activeFactor.weaknesses.length})
                  <span style={{ fontSize: 9, color: C.dim, fontWeight: "normal", marginLeft: 8 }}>
                    {["MARGINAL","SATISFACTORY"].includes(activeFactor.rating) ? "Expected for this rating" : "Document if applicable"}
                  </span>
                </div>
                <SWEntry
                  items={activeFactor.weaknesses}
                  type="weakness"
                  onAdd={() => addSW(activeFactor.id, "weaknesses")}
                  onRemove={id => removeSW(activeFactor.id, "weaknesses", id)}
                  onUpdate={(id, val) => updateSW(activeFactor.id, "weaknesses", id, val)}
                />
              </div>

              {/* Deficiencies */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#ff6a6a", fontWeight: "bold", marginBottom: 6 }}>
                  DEFICIENCIES ({activeFactor.deficiencies.length})
                  <span style={{ fontSize: 9, color: C.dim, fontWeight: "normal", marginLeft: 8 }}>
                    {activeFactor.rating === "UNACCEPTABLE" ? "Required for Unacceptable rating" : "Material failures to meet requirements"}
                  </span>
                </div>
                <SWEntry
                  items={activeFactor.deficiencies}
                  type="deficiency"
                  onAdd={() => addSW(activeFactor.id, "deficiencies")}
                  onRemove={id => removeSW(activeFactor.id, "deficiencies", id)}
                  onUpdate={(id, val) => updateSW(activeFactor.id, "deficiencies", id, val)}
                />
              </div>

              {/* Delete factor */}
              {factors.length > 1 && (
                <button onClick={() => { setFactors(f => f.filter(x => x.id !== activeFactor.id)); setActiveFactorId(factors[0]?.id); }}
                  style={{ background: "#1a0404", border: "1px solid #4a1a1a", color: "#aa4a4a", padding: "5px 14px",
                           borderRadius: 3, cursor: "pointer", fontSize: 10, marginTop: 8 }}>
                  Remove This Factor
                </button>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 40, color: C.dim, fontSize: 12 }}>Select a factor to evaluate</div>
          )}
        </div>

        {/* Right — Summary + evaluator info + output */}
        <div style={{ borderLeft: `1px solid ${C.border}`, overflow: "auto", padding: 12 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>EVALUATOR & SUMMARY</div>

          {lbl("Evaluator Name", true)}
          <input style={inp} value={meta.evaluatorName} onChange={e => setMeta_("evaluatorName", e.target.value)} placeholder="Full name" />
          {lbl("Evaluator Title")}
          <input style={inp} value={meta.evaluatorTitle} onChange={e => setMeta_("evaluatorTitle", e.target.value)} placeholder="e.g., COR / Technical Advisor" />
          {lbl("Organization")}
          <input style={inp} value={meta.evaluatorOrg} onChange={e => setMeta_("evaluatorOrg", e.target.value)} placeholder="Division / Branch" />

          {lbl("Proposed Price / Cost")}
          <input style={inp} value={meta.priceProposed} onChange={e => setMeta_("priceProposed", e.target.value)} placeholder="e.g., $1,245,000" />

          {lbl("Overall Narrative / Summary")}
          <textarea style={ta} rows={4} value={meta.overallNarrative} onChange={e => setMeta_("overallNarrative", e.target.value)}
            placeholder="Summarize the overall technical merit of this proposal. Address how the proposed approach meets or fails to meet the Government's requirements." />

          {meta.pastPerfRating && (<>
            {lbl("Past Performance Narrative")}
            <textarea style={ta} rows={3} value={meta.pastPerfNarrative} onChange={e => setMeta_("pastPerfNarrative", e.target.value)}
              placeholder="Summarize past performance evaluation findings..." />
          </>)}

          {lbl("Price Evaluation Notes")}
          <textarea style={ta} rows={2} value={meta.priceEvalNotes} onChange={e => setMeta_("priceEvalNotes", e.target.value)}
            placeholder="Price realism analysis, reasonableness notes, comparison to IGCE..." />

          {lbl("Award Recommendation")}
          <textarea style={ta} rows={2} value={meta.recommendation} onChange={e => setMeta_("recommendation", e.target.value)}
            placeholder="e.g., Award / Do not award. Basis for recommendation..." />

          {/* Conflict of interest */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <div onClick={() => setMeta_("hasConflict", !meta.hasConflict)}
              style={{ width: 13, height: 13, border: `1px solid ${meta.hasConflict ? C.red : "#2a4a6a"}`, borderRadius: 2,
                       background: meta.hasConflict ? C.red : "transparent", cursor: "pointer", flexShrink: 0,
                       display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff" }}>
              {meta.hasConflict ? "✓" : ""}
            </div>
            <span style={{ fontSize: 9, color: C.dim }}>I have a potential OCI / conflict of interest</span>
          </div>
          {meta.hasConflict && (
            <textarea style={{ ...ta, marginTop: 6 }} rows={2} value={meta.conflicts}
              onChange={e => setMeta_("conflicts", e.target.value)}
              placeholder="Describe the nature of the potential conflict. The CO must be notified immediately." />
          )}

          {/* Factor summary */}
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", marginTop: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>FACTOR SUMMARY</div>
            {factors.map(f => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: C.dim, flex: 1 }}>{f.name || "Unnamed"}</span>
                {f.rating ? <RatingBadge rating={f.rating} scale={meta.isLPTA ? "LPTA" : "ADJECTIVAL"} /> : <span style={{ fontSize: 8, color: "#3a2a0a" }}>—</span>}
              </div>
            ))}
            {meta.pastPerfRating && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: C.dim }}>Past Performance</span>
                <RatingBadge rating={meta.pastPerfRating} scale="CONFIDENCE" />
              </div>
            )}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: C.text, fontWeight: "bold" }}>OVERALL</span>
              {meta.overallRating ? <RatingBadge rating={meta.overallRating} scale={meta.isLPTA ? "LPTA" : "ADJECTIVAL"} size="normal" /> : <span style={{ fontSize: 9, color: "#3a2a0a" }}>Not set</span>}
            </div>
          </div>

          {/* Actions */}
          <button onClick={() => navigator.clipboard.writeText(text)}
            style={{ width: "100%", background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                     padding: "7px", borderRadius: 3, cursor: "pointer", fontSize: 11, marginBottom: 6 }}>
            COPY EVALUATION TEXT
          </button>
          <button onClick={() => onGenerated && onGenerated(text, meta.offerorName)}
            style={{ width: "100%", background: factorIssues.length === 0 ? "#0a2a1a" : C.bg3,
                     border: `1px solid ${factorIssues.length === 0 ? C.green : C.border}`,
                     color: factorIssues.length === 0 ? C.green : C.dim,
                     padding: "7px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
            {factorIssues.length === 0 ? "✓ SAVE TO SOURCE SELECTION FILE" : `SAVE (${factorIssues.length} issues remaining)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Text generator ────────────────────────────────────────────────
function buildEvalText(meta, factors) {
  const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[DATE]";
  const rScale = meta.isLPTA ? LPTA_RATINGS : ADJECTIVAL_RATINGS;

  let t = `TECHNICAL EVALUATION\nSOURCE SELECTION SENSITIVE — DO NOT RELEASE OUTSIDE GOVERNMENT\n${"═".repeat(70)}\n\n`;
  t += `Requirement:      ${meta.contractTitle || "[REQUIREMENT]"}\n`;
  t += `Solicitation No.: ${meta.solNumber    || "[SOL NUMBER]"}\n`;
  t += `Offeror:          ${meta.offerorName  || "[OFFEROR]"}\n`;
  t += `Evaluation Type:  ${meta.isLPTA ? "LPTA (Acceptable/Unacceptable)" : "Best Value — Adjectival Ratings"}\n`;
  t += `Evaluator:        ${meta.evaluatorName || "[EVALUATOR]"}${meta.evaluatorTitle ? ", " + meta.evaluatorTitle : ""}\n`;
  if (meta.evaluatorOrg)  t += `Organization:     ${meta.evaluatorOrg}\n`;
  if (meta.priceProposed) t += `Proposed Price:   ${meta.priceProposed}\n`;
  t += `Date:             ${fmtDate(meta.evalDate)}\n\n`;

  t += `${"─".repeat(70)}\n`;
  t += `FACTOR-BY-FACTOR EVALUATION\n\n`;

  factors.forEach((f, i) => {
    const r = rScale.find(r => r.id === f.rating);
    t += `${"─".repeat(40)}\n`;
    t += `Factor ${i+1}: ${f.name || "[FACTOR NAME]"}`;
    if (f.weight) t += ` (Weight: ${f.weight}%)`;
    t += `\nRating: ${r?.label || "[NOT RATED]"}\n\n`;

    if (f.narrative) t += `Evaluation Narrative:\n${f.narrative}\n\n`;

    if (f.strengths.length > 0) {
      t += `Strengths:\n`;
      f.strengths.forEach((s, i) => { if (s.text) t += `  ${i+1}. ${s.text}\n`; });
      t += `\n`;
    }
    if (f.weaknesses.length > 0) {
      t += `Weaknesses:\n`;
      f.weaknesses.forEach((w, i) => { if (w.text) t += `  ${i+1}. ${w.text}\n`; });
      t += `\n`;
    }
    if (f.deficiencies.length > 0) {
      t += `Deficiencies:\n`;
      f.deficiencies.forEach((d, i) => { if (d.text) t += `  ${i+1}. ${d.text}\n`; });
      t += `\n`;
    }
  });

  if (meta.pastPerfRating) {
    const ppR = CONFIDENCE_RATINGS.find(r => r.id === meta.pastPerfRating);
    t += `${"─".repeat(40)}\nPast Performance\nConfidence Rating: ${ppR?.label || meta.pastPerfRating}\n`;
    if (meta.pastPerfNarrative) t += `\n${meta.pastPerfNarrative}\n`;
    t += `\n`;
  }

  t += `${"─".repeat(70)}\nOVERALL TECHNICAL EVALUATION\n\n`;
  const ovR = rScale.find(r => r.id === meta.overallRating);
  t += `Overall Rating: ${ovR?.label || "[NOT SET]"}\n\n`;
  if (meta.overallNarrative) t += `${meta.overallNarrative}\n\n`;

  if (meta.priceEvalNotes) {
    t += `${"─".repeat(40)}\nPRICE EVALUATION\n\n${meta.priceEvalNotes}\n\n`;
  }

  if (meta.recommendation) {
    t += `${"─".repeat(40)}\nRECOMMENDATION\n\n${meta.recommendation}\n\n`;
  }

  t += `${"─".repeat(70)}\n`;
  t += `CONFLICT OF INTEREST CERTIFICATION\n\n`;
  if (meta.hasConflict) {
    t += `POTENTIAL CONFLICT IDENTIFIED: ${meta.conflicts || "[Description required]"}\n\n`;
    t += `NOTE: This evaluator has identified a potential OCI. The Contracting Officer must be notified before this evaluation is used in source selection.\n\n`;
  } else {
    t += `I certify that I have no known actual or potential OCI with respect to this offeror or proposal.\n\n`;
  }

  t += `${"_".repeat(40)}\n`;
  t += `${meta.evaluatorName || "[Evaluator Name]"}\n`;
  if (meta.evaluatorTitle) t += `${meta.evaluatorTitle}\n`;
  if (meta.evaluatorOrg)   t += `${meta.evaluatorOrg}\n`;
  t += `Date: ${fmtDate(meta.evalDate)}\n\n`;
  t += `SOURCE SELECTION SENSITIVE — FOR OFFICIAL USE ONLY\n`;

  return t;
}
