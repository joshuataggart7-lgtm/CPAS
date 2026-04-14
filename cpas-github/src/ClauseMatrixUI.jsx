// CPAS Clause Matrix UI
// Interactive clause prescriber — uses clauseEngine.js
// Renders required/conditional/optional tables with fill-ins and Section I export

import React, { useState, useMemo } from "react";
import { prescribeClauses, buildSectionI, UCF_SECTIONS, buildSF1449Fields, buildSF30Fields } from "./clauseEngine.js";

const FONT_COMP = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const C = {
  bg: "#f5f7fa", bg2: "#ffffff", bg3: "#eef1f6",
  border: "#dde3ef", blue: "#1a3a6e", text: "#1a2332",
  muted: "#6b7a99", dim: "#8896b0", green: "#0f6e56",
  yellow: "#854f0b", red: "#a32d2d", purple: "#5a3a9e",
  teal: "#0f6e56",
};

const STATUS_COLOR = {
  REQUIRED:    { bg: "#e8f7f0", border: "#1a6a3a", text: "#0f6e56", badge: "#0a3a1a" },
  CONDITIONAL: { bg: "#1a1a04", border: "#6a6a1a", text: "#c8c84a", badge: "#3a3a0a" },
  OPTIONAL:    { bg: "#0a0a1a", border: "#2a2a5a", text: "#8a8aff", badge: "#1a1a3a" },
};

// ── Additional params that aren't in main intake ──────────────────
const EXTRA_PARAMS = [
  { key: "isSCA",                label: "Service Contract Act applies?",         type: "bool" },
  { key: "hasSubcontracting",    label: "Contractor will subcontract?",           type: "bool" },
  { key: "hasGovProperty",       label: "Government-furnished property?",         type: "bool" },
  { key: "hasIT",                label: "Contractor accesses NASA IT systems?",   type: "bool" },
  { key: "hasITAR",              label: "ITAR / export-controlled technology?",   type: "bool" },
  { key: "hasAircraft",          label: "Aircraft operations in performance?",    type: "bool" },
  { key: "hasISS",               label: "ISS-related activities?",               type: "bool" },
  { key: "hasLaunchVehicle",     label: "Launch vehicle activities?",            type: "bool" },
  { key: "performsOnFederalFacility", label: "On-site at NASA facility?",        type: "bool" },
  { key: "isSmallBusiness",      label: "Prime is a small business?",            type: "bool" },
  { key: "hasClassifiedWork",    label: "Classified work involved?",             type: "bool" },
  { key: "hasSensitiveInfo",     label: "Access to sensitive information?",      type: "bool" },
  { key: "isRD",                 label: "R&D / research contract?",              type: "bool" },
];

export default function ClauseMatrixUI({ intake, onSectionIGenerated }) {
  const [extraParams, setExtraParams] = useState({
    isSCA: false, hasSubcontracting: true, hasGovProperty: false,
    hasIT: intake?.reqType === "IT", hasITAR: false, hasAircraft: false,
    hasISS: false, hasLaunchVehicle: false, performsOnFederalFacility: true,
    isSmallBusiness: false, hasClassifiedWork: false, hasSensitiveInfo: false,
    isRD: intake?.reqType === "RD",
  });
  const [fillInValues, setFillInValues] = useState({});
  const [conditionalIncludes, setConditionalIncludes] = useState({});
  const [activeTab, setActiveTab] = useState("MATRIX");
  const [expandedClause, setExpandedClause] = useState(null);
  const [search, setSearch] = useState("");

  const params = useMemo(() => ({
    ...intake,
    ...extraParams,
    setAside: intake?.competitionStrategy || "FULL_OPEN",
    hasOptions: true,
  }), [intake, extraParams]);

  const prescribed = useMemo(() => prescribeClauses(params), [params]);

  const sectionIText = useMemo(() => {
    const mergedFillIns = {};
    for (const [num, vals] of Object.entries(fillInValues)) {
      mergedFillIns[num] = vals;
    }
    for (const [num, inc] of Object.entries(conditionalIncludes)) {
      if (!mergedFillIns[num]) mergedFillIns[num] = {};
      mergedFillIns[num].include = inc;
    }
    return buildSectionI(prescribed, mergedFillIns);
  }, [prescribed, fillInValues, conditionalIncludes]);

  const sf1449 = useMemo(() => buildSF1449Fields(intake), [intake]);

  function setFillIn(clauseNum, fieldId, value) {
    setFillInValues(v => ({
      ...v,
      [clauseNum]: { ...(v[clauseNum] || {}), [fieldId]: value },
    }));
  }

  function toggleConditional(num) {
    setConditionalIncludes(c => ({ ...c, [num]: !c[num] }));
  }

  // ── Filter ────────────────────────────────────────────────────
  function filterClauses(list) {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(c =>
      c.num.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.farRef || "").toLowerCase().includes(q)
    );
  }

  // ── Clause Row ────────────────────────────────────────────────
  function ClauseRow({ clause, status, showInclude }) {
    const sc = STATUS_COLOR[status] || STATUS_COLOR.REQUIRED;
    const isExpanded = expandedClause === clause.num;
    const hasFillIns = clause.fillIns?.length > 0;
    const isIncluded = conditionalIncludes[clause.num] !== false && (status === "REQUIRED" || conditionalIncludes[clause.num]);

    return (
      <div style={{ borderBottom: `1px solid ${C.border}`, background: isExpanded ? sc.bg : "transparent" }}>
        <div
          onClick={() => setExpandedClause(isExpanded ? null : clause.num)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer" }}
        >
          {/* Include toggle for conditional */}
          {showInclude && (
            <div
              onClick={e => { e.stopPropagation(); toggleConditional(clause.num); }}
              style={{ width: 16, height: 16, border: `1px solid ${isIncluded ? C.green : "#8896b0"}`,
                       borderRadius: 3, background: isIncluded ? C.green : "transparent",
                       flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                       fontSize: 10, color: "#fff" }}
            >
              {isIncluded ? "✓" : ""}
            </div>
          )}

          {/* Clause number */}
          <span style={{ fontSize: 11, color: sc.text, fontWeight: "bold", minWidth: 90, flexShrink: 0 }}>
            {clause.num}
          </span>

          {/* Title */}
          <span style={{ fontSize: 11, color: isExpanded ? C.text : C.dim, flex: 1, lineHeight: 1.3 }}>
            {clause.title}
          </span>

          {/* FAR ref */}
          <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap", marginLeft: 4 }}>
            {clause.farRef}
          </span>

          {/* Fill-in indicator */}
          {hasFillIns && (
            <span style={{ fontSize: 9, background: "#1a1a3a", border: "1px solid #3a3a8a",
                           color: "#8a8aff", padding: "1px 5px", borderRadius: 3, marginLeft: 4 }}>
              FILL-IN
            </span>
          )}

          <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>{isExpanded ? "▲" : "▼"}</span>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div style={{ padding: "8px 12px 14px 36px", background: sc.bg }}>
            {clause.note && (
              <div style={{ fontSize: 10, color: "#4a5a78", marginBottom: 10, lineHeight: 1.4 }}>
                📌 {clause.note}
              </div>
            )}
            {clause.alternates?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>ALTERNATES AVAILABLE</div>
                {clause.alternates.map((a, i) => (
                  <div key={i} style={{ fontSize: 10, color: C.dim, marginBottom: 2 }}>• {a}</div>
                ))}
              </div>
            )}
            {hasFillIns && (
              <div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>FILL-IN VALUES</div>
                {clause.fillIns.map(fi => (
                  <div key={fi.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>{fi.label}</div>
                    <input
                      value={fillInValues[clause.num]?.[fi.id] || ""}
                      onChange={e => setFillIn(clause.num, fi.id, e.target.value)}
                      placeholder={fi.placeholder}
                      style={{ width: "100%", background: "#f0f4f8", border: `1px solid ${C.border}`,
                               color: C.text, padding: "6px 9px", borderRadius: 3, fontSize: 11,
                               boxSizing: "border-box" }}
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Sub-clauses for 52.212-5 */}
            {clause.subClauses && (
              <div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 6 }}>
                  REQUIRED SUB-CLAUSES (check all that apply)
                </div>
                {clause.subClauses.filter(sc => sc.req(params)).map(sc => (
                  <div key={sc.sub} style={{ fontSize: 10, color: C.dim, marginBottom: 3 }}>
                    <span style={{ color: C.green, marginRight: 6 }}>✓</span>
                    {sc.sub} — {sc.clause} {sc.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Tab content ───────────────────────────────────────────────
  const tabBtn = (id, label, count) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{ padding: "7px 14px", cursor: "pointer", borderRadius: 3, fontSize: 10, letterSpacing: 1,
               background: activeTab === id ? "#eef3fc" : "transparent",
               border: activeTab === id ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
               color: activeTab === id ? C.blue : C.muted, fontWeight: "bold" }}
    >
      {label}{count !== undefined ? ` (${count})` : ""}
    </button>
  );

  const { required, conditional, optional } = prescribed;

  // ── Main render ───────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "FONT_COMP", fontSize: 12 }}>

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, marginBottom: 4 }}>CLAUSE MATRIX ENGINE</div>
        <div style={{ fontSize: 16, fontWeight: "bold", color: C.text, marginBottom: 2 }}>
          {intake?.reqTitle || "Untitled Requirement"}
        </div>
        <div style={{ fontSize: 10, color: C.dim }}>
          {intake?.center} · ${(parseFloat(intake?.value)||0).toLocaleString()} · {intake?.contractType} · {intake?.isCommercial === "YES" ? "Commercial" : "Non-Commercial"}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ background: STATUS_COLOR.REQUIRED.badge, color: STATUS_COLOR.REQUIRED.text, fontSize: 10, padding: "2px 10px", borderRadius: 10 }}>
            {required.length} REQUIRED
          </span>
          <span style={{ background: STATUS_COLOR.CONDITIONAL.badge, color: STATUS_COLOR.CONDITIONAL.text, fontSize: 10, padding: "2px 10px", borderRadius: 10 }}>
            {conditional.length} CONDITIONAL
          </span>
          <span style={{ background: STATUS_COLOR.OPTIONAL.badge, color: STATUS_COLOR.OPTIONAL.text, fontSize: 10, padding: "2px 10px", borderRadius: 10 }}>
            {optional.length} OPTIONAL
          </span>
        </div>
      </div>

      {/* Extra params panel */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.bg2 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>CONTRACT CHARACTERISTICS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXTRA_PARAMS.map(ep => (
            <div
              key={ep.key}
              onClick={() => setExtraParams(p => ({ ...p, [ep.key]: !p[ep.key] }))}
              style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                       background: extraParams[ep.key] ? "#e8f7f0" : C.bg3,
                       border: `1px solid ${extraParams[ep.key] ? "#1a6a3a" : C.border}`,
                       borderRadius: 4, padding: "4px 9px" }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 2, flexShrink: 0,
                             background: extraParams[ep.key] ? C.green : "transparent",
                             border: `1px solid ${extraParams[ep.key] ? C.green : "#8896b0"}`,
                             display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
                {extraParams[ep.key] ? "✓" : ""}
              </div>
              <span style={{ fontSize: 10, color: extraParams[ep.key] ? C.green : C.dim }}>{ep.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {tabBtn("MATRIX", "CLAUSE MATRIX")}
        {tabBtn("SECTION_I", "SECTION I")}
        {tabBtn("SF1449", "SF-1449 BLOCKS")}
        {tabBtn("UCF", "UCF A–M")}
        <div style={{ flex: 1 }} />
        <input
          placeholder="Search clauses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.text,
                   padding: "5px 10px", borderRadius: 3, fontSize: 11, width: 180 }}
        />
      </div>

      {/* Tab: Clause Matrix */}
      {activeTab === "MATRIX" && (
        <div style={{ overflow: "auto", maxHeight: "60vh" }}>
          {/* Required */}
          <div style={{ padding: "8px 20px 4px", background: "#e8f7f0", fontSize: 9, color: C.green, letterSpacing: 2 }}>
            REQUIRED — {filterClauses(required).length} CLAUSES
          </div>
          {filterClauses(required).map(c => (
            <ClauseRow key={c.num} clause={c} status="REQUIRED" showInclude={false} />
          ))}

          {/* Conditional */}
          <div style={{ padding: "8px 20px 4px", background: "#1a1a04", fontSize: 9, color: "#c8c84a", letterSpacing: 2, marginTop: 2 }}>
            CONDITIONAL — {filterClauses(conditional).length} CLAUSES — CLICK ☐ TO INCLUDE IN SECTION I
          </div>
          {filterClauses(conditional).map(c => (
            <ClauseRow key={c.num} clause={c} status="CONDITIONAL" showInclude={true} />
          ))}

          {/* Optional */}
          {optional.length > 0 && (
            <>
              <div style={{ padding: "8px 20px 4px", background: "#0a0a1a", fontSize: 9, color: "#8a8aff", letterSpacing: 2, marginTop: 2 }}>
                OPTIONAL — {filterClauses(optional).length} CLAUSES
              </div>
              {filterClauses(optional).map(c => (
                <ClauseRow key={c.num} clause={c} status="OPTIONAL" showInclude={true} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab: Section I */}
      {activeTab === "SECTION_I" && (
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sectionIText);
              }}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                       padding: "7px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}
            >
              COPY SECTION I
            </button>
            <button
              onClick={() => onSectionIGenerated && onSectionIGenerated(sectionIText)}
              style={{ background: "#e8f7f0", border: "1px solid #1a6a3a", color: "#0f6e56",
                       padding: "7px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}
            >
              SAVE TO NEAR PACKAGE
            </button>
          </div>
          <pre style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4,
                        padding: 16, fontSize: 10, color: C.dim, overflow: "auto",
                        maxHeight: "55vh", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {sectionIText}
          </pre>
        </div>
      )}

      {/* Tab: SF-1449 */}
      {activeTab === "SF1449" && (
        <div style={{ padding: 20, overflow: "auto", maxHeight: "60vh" }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>
            SF-1449 BLOCK PRE-POPULATION — Commercial Acquisition
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(sf1449).map(([block, field]) => (
              <div key={block} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>
                  {block.replace("block", "Block ")} — {field.label}
                </div>
                <input
                  value={field.value}
                  onChange={e => {/* would update sf1449 state */}}
                  placeholder={field.value ? "" : "Enter value..."}
                  style={{ width: "100%", background: "#ffffff", border: `1px solid ${C.border}`,
                           color: C.text, padding: "5px 8px", borderRadius: 2, fontSize: 11,
                           boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: UCF Sections */}
      {activeTab === "UCF" && (
        <div style={{ padding: 20, overflow: "auto", maxHeight: "60vh" }}>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, marginBottom: 12 }}>
            UNIFORM CONTRACT FORMAT — SECTIONS A THROUGH M
          </div>
          {UCF_SECTIONS.map(sec => (
            <div key={sec.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 32, height: 32, background: "#eef3fc", border: `1px solid ${C.blue}`,
                             borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                             fontSize: 14, fontWeight: "bold", color: C.blue, flexShrink: 0 }}>
                {sec.id}
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.text, fontWeight: "bold" }}>Section {sec.id} — {sec.title}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{sec.note}</div>
                {sec.id === "I" && (
                  <div style={{ fontSize: 10, color: C.green, marginTop: 3 }}>
                    ✓ {required.length} required · {conditional.filter(c => conditionalIncludes[c.num]).length} conditional included
                    {" — "}
                    <span style={{ cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => setActiveTab("SECTION_I")}>
                      View Section I →
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
