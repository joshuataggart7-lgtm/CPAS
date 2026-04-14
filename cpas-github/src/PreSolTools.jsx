// CPAS Pre-Solicitation Tools
// - IGCE Structured Cost Buildup Worksheet (FAR 15.404-1 / NFS 1807.105)
// - Market Research Report (FAR Part 10)

import React, { useState, useMemo } from "react";

const FONT_COMP = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const C = {
  bg: "#f5f7fa", bg2: "#ffffff", bg3: "#eef1f6",
  border: "#dde3ef", blue: "#1a3a6e", text: "#1a2332",
  muted: "#6b7a99", dim: "#8896b0", green: "#0f6e56",
  yellow: "#854f0b", red: "#a32d2d", purple: "#5a3a9e",
  teal: "#0f6e56",
};
const inp = {
  background: "#ffffff", border: "1px solid #dde3ef", color: "#1a2332",
  padding: "8px 12px", borderRadius: 7, fontSize: 12,
  width: "100%", boxSizing: "border-box",
  fontFamily: FONT_COMP, outline: "none",
};
const ta = { ...inp, resize: "vertical", minHeight: 55, lineHeight: 1.5 };
const lbl = (t, req) => (
  <div style={{ fontSize: 9, color: req ? C.yellow : C.muted, letterSpacing: 1, marginBottom: 3, marginTop: 7 }}>
    {t}{req ? " *" : ""}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// IGCE WORKSHEET
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_LABOR_CATS = [
  { id: 1, title: "Program Manager",           level: "Senior",  rate: "", hours: "", hoursPerYear: "2080" },
  { id: 2, title: "Systems Engineer",           level: "Senior",  rate: "", hours: "", hoursPerYear: "2080" },
  { id: 3, title: "Software Engineer",          level: "Mid",     rate: "", hours: "", hoursPerYear: "2080" },
  { id: 4, title: "Administrative Support",     level: "Junior",  rate: "", hours: "", hoursPerYear: "2080" },
];
const DEFAULT_CATALOG_CLINS = [
  // King Air B200 — CONUS rates (CLIN 0001, Jan 31 2026 – Jan 30 2027)
  { id: 1,  title: "Aircraft Hourly — King Air B200 (CONUS)",    unit: "Hour",   rate: "855.93",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 2,  title: "Aircraft Daily — King Air B200 (CONUS)",     unit: "Day",    rate: "822.97",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 3,  title: "Aircraft Hourly — King Air B200 (OCONUS)",   unit: "Hour",   rate: "1024.85",  qty: "", basis: "Contract CLIN 0001 catalog rate" },
  // King Air A-90 — CONUS/OCONUS same rate
  { id: 4,  title: "Aircraft Hourly — King Air A-90 (CONUS)",    unit: "Hour",   rate: "501.61",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 5,  title: "Aircraft Daily — King Air A-90 (CONUS)",     unit: "Day",    rate: "421.27",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  // Gulfstream IV
  { id: 6,  title: "Aircraft Hourly — Gulfstream IV (CONUS)",    unit: "Hour",   rate: "5883.36",  qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 7,  title: "Aircraft Daily — Gulfstream IV (CONUS)",     unit: "Day",    rate: "12607.20", qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 8,  title: "Aircraft Hourly — Gulfstream IV (OCONUS)",   unit: "Hour",   rate: "6645.56",  qty: "", basis: "Contract CLIN 0001 catalog rate" },
  // Crew — same for B200 and A-90
  { id: 9,  title: "Crew Hourly — B200/A-90 (CONUS)",            unit: "Hour",   rate: "94.76",    qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 10, title: "Crew Hourly — B200/A-90 (OCONUS)",           unit: "Hour",   rate: "142.14",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 11, title: "Crew Hourly — Gulfstream IV (CONUS)",        unit: "Hour",   rate: "162.74",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 12, title: "Crew Hourly — Gulfstream IV (OCONUS)",       unit: "Hour",   rate: "224.54",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  // FTR / Mechanic
  { id: 13, title: "FTR/Mechanic Hourly — B200/A-90 (CONUS)",   unit: "Hour",   rate: "107.12",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 14, title: "FTR/Mechanic Hourly — B200/A-90 (OCONUS)",  unit: "Hour",   rate: "139.05",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 15, title: "FTR/Mechanic Hourly — Gulfstream IV (CONUS)",unit: "Hour",  rate: "122.57",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  { id: 16, title: "FTR/Mechanic Hourly — Gulfstream IV (OCONUS)",unit: "Hour", rate: "169.95",   qty: "", basis: "Contract CLIN 0001 catalog rate" },
  // ODC Line Items — TBD per task order
  { id: 17, title: "Fuel — B200/A-90",                           unit: "Gallon", rate: "",         qty: "", basis: "TBD per task order" },
  { id: 18, title: "Per Diem / Travel",                          unit: "Job",    rate: "",         qty: "", basis: "TBD per task order" },
  { id: 19, title: "Shop Fees",                                  unit: "Job",    rate: "",         qty: "", basis: "TBD per task order" },
  { id: 20, title: "Engineering / Fabrication / FAA",            unit: "Job",    rate: "",         qty: "", basis: "TBD per task order" },
];

const OVERHEAD_METHODS = [
  { id: "LOADED",   label: "Fully loaded rates (burden included in rate)" },
  { id: "SEPARATE", label: "Separate overhead, G&A, and fringe rates" },
  { id: "WRAP",     label: "Wrap rate applied to direct labor" },
];

const ESCALATION_RATES = [
  { id: "0",   label: "0% (fixed price, no escalation)" },
  { id: "3",   label: "3% per year (typical services)" },
  { id: "4",   label: "4% per year (labor-intensive)" },
  { id: "5",   label: "5% per year (R&D / technical)" },
  { id: "CPI", label: "CPI-based (reference BLS index)" },
  { id: "CUSTOM", label: "Custom rate" },
];

export function IGCEWorksheet({ intake, onGenerated }) {
  const [meta, setMeta] = useState({
    reqTitle:       intake?.reqTitle  || "",
    center:         intake?.center    || "",
    preparedBy:     intake?.coName    || "",
    prepDate:       "",
    basisOfEstimate:"Derived from historical contract data, published labor rates (BLS/GSA), and market research.",
    contractType:   intake?.contractType || "FFP",
    pop:            intake?.pop || "Base year + 4 option years",
    igceMode:       intake?.contractType === "IDIQ" ? "CATALOG" : "LABOR",  // LABOR or CATALOG
    naics:          intake?.naics || "",
    overheadMethod: "LOADED",
    escalationRate: "3",
    customEscalation: "",
    includeProfit:  true,
    profitRate:     "8",
    assumptions:    "1. Rates based on current market data.\n2. All labor performed in CONUS.\n3. No classified work involved.",
    limitations:    "This estimate is based on available information and is subject to change as requirements are refined.",
  });

  const [periods, setPeriods] = useState([
    { id: 1, label: "Base Year",     months: 12, active: true  },
    { id: 2, label: "Option Year 1", months: 12, active: true  },
    { id: 3, label: "Option Year 2", months: 12, active: true  },
    { id: 4, label: "Option Year 3", months: 12, active: true  },
    { id: 5, label: "Option Year 4", months: 12, active: true  },
  ]);

  const [catalogClins, setCatalogClins] = useState(DEFAULT_CATALOG_CLINS.map(c => ({
    ...c, periodQtys: {}
  })));
  const [laborCats, setLaborCats] = useState(DEFAULT_LABOR_CATS.map(lc => ({
    ...lc,
    periodHours: Object.fromEntries(periods.map(p => [p.id, ""])),
  })));

  const [odcs, setOdcs] = useState([
    { id: 1, category: "Travel",           amount: "", basis: "Estimated travel per PWS Section X" },
    { id: 2, category: "Materials/Supplies",amount: "", basis: "" },
    { id: 3, category: "Subcontracts",     amount: "", basis: "" },
    { id: 4, category: "Other Direct Costs",amount:"", basis: "" },
  ]);

  const setMetaField = (k, v) => setMeta(m => ({ ...m, [k]: v }));

  function addLaborCat() {
    setLaborCats(lc => [...lc, {
      id: Date.now(), title: "", level: "Mid", rate: "", hoursPerYear: "2080",
      periodHours: Object.fromEntries(periods.map(p => [p.id, ""])),
    }]);
  }

  function updateLC(id, field, val) {
    setLaborCats(lc => lc.map(l => l.id === id ? { ...l, [field]: val } : l));
  }

  function updateLCPeriod(lcId, periodId, val) {
    setLaborCats(lc => lc.map(l => l.id === lcId ? {
      ...l, periodHours: { ...l.periodHours, [periodId]: val }
    } : l));
  }

  function removeLC(id) { setLaborCats(lc => lc.filter(l => l.id !== id)); }

  function updateODC(id, field, val) {
    setOdcs(o => o.map(odc => odc.id === id ? { ...odc, [field]: val } : odc));
  }

  function addODC() {
    setOdcs(o => [...o, { id: Date.now(), category: "", amount: "", basis: "" }]);
  }

  // Calculations
  const escRate = meta.escalationRate === "CUSTOM"
    ? parseFloat(meta.customEscalation) / 100 || 0
    : parseFloat(meta.escalationRate) / 100 || 0;

  const activePeriods = periods.filter(p => p.active);

  const periodTotals = useMemo(() => {
    return activePeriods.map((period, pidx) => {
      const esc = Math.pow(1 + escRate, pidx);
      const labor = laborCats.reduce((sum, lc) => {
        const rate = parseFloat(lc.rate) || 0;
        const hrs  = parseFloat(lc.periodHours?.[period.id]) || 0;
        return sum + rate * hrs * esc;
      }, 0);
      const odc = odcs.reduce((sum, odc) => sum + (parseFloat(odc.amount) || 0), 0);
      const subtotal = labor + odc;
      const profit = meta.includeProfit ? subtotal * (parseFloat(meta.profitRate) / 100 || 0) : 0;
      return { period, labor, odc, subtotal, profit, total: subtotal + profit, esc };
    });
  }, [activePeriods, laborCats, odcs, escRate, meta.includeProfit, meta.profitRate]);

  const grandTotal = periodTotals.reduce((s, p) => s + p.total, 0);
  const totalLabor = periodTotals.reduce((s, p) => s + p.labor, 0);
  const totalODC   = periodTotals.reduce((s, p) => s + p.odc, 0);

  const text = useMemo(() => buildIGCEText(meta, laborCats, odcs, activePeriods, periodTotals, grandTotal, escRate), 
    [meta, laborCats, odcs, activePeriods, periodTotals, grandTotal, escRate]);

  const fmt = n => n > 0 ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  return (
    <div style={{ fontFamily: "FONT_COMP", color: C.text, background: C.bg }}>

      {/* Top metadata bar */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          {lbl("Requirement Title")}
          <input style={inp} value={meta.reqTitle} onChange={e => setMetaField("reqTitle", e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          {lbl("Center")}
          <input style={inp} value={meta.center} onChange={e => setMetaField("center", e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          {lbl("Contract Type")}
          <select style={inp} value={meta.contractType} onChange={e => setMetaField("contractType", e.target.value)}>
            {["FFP","T&M","Labor Hour","CPFF","CPAF","IDIQ"].map(ct => <option key={ct}>{ct}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          {lbl("Escalation Rate")}
          <select style={inp} value={meta.escalationRate} onChange={e => setMetaField("escalationRate", e.target.value)}>
            {ESCALATION_RATES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        {meta.escalationRate === "CUSTOM" && (
          <div style={{ flex: 1, minWidth: 80 }}>
            {lbl("Custom Rate %")}
            <input style={inp} value={meta.customEscalation} onChange={e => setMetaField("customEscalation", e.target.value)} placeholder="e.g., 3.5" />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <div onClick={() => setMetaField("includeProfit", !meta.includeProfit)}
            style={{ width: 13, height: 13, border: `1px solid ${meta.includeProfit ? C.green : "#8896b0"}`, borderRadius: 2,
                     background: meta.includeProfit ? C.green : "transparent", cursor: "pointer", flexShrink: 0,
                     display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
            {meta.includeProfit ? "✓" : ""}
          </div>
          <span style={{ fontSize: 10, color: C.dim }}>Fee/Profit</span>
          {meta.includeProfit && (
            <input style={{ ...inp, width: 60 }} value={meta.profitRate}
              onChange={e => setMetaField("profitRate", e.target.value)} placeholder="8%" />
          )}
          <span style={{ fontSize: 9, color: C.dim }}>%</span>
        </div>
      </div>

      {/* Grand total banner */}
      <div style={{ background: "#e8f7f0", borderBottom: `1px solid #1a6a3a`, padding: "10px 16px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 9, color: C.muted }}>GRAND TOTAL IGCE</div>
          <div style={{ fontSize: 20, color: C.green, fontWeight: "bold" }}>{fmt(grandTotal)}</div>
        </div>
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            {["LABOR","CATALOG"].map(mode => (
              <button key={mode} onClick={() => setMetaField("igceMode", mode)}
                style={{ padding:"4px 12px", borderRadius:3, cursor:"pointer", fontSize:10, fontWeight:"bold",
                         background: meta.igceMode === mode ? (mode==="CATALOG"?"#eef3fc":"#e8f7f0") : "#eef1f6",
                         border: `1px solid ${meta.igceMode === mode ? (mode==="CATALOG"?"#1a3a6e":"#0f6e56") : "#1a3a6e"}`,
                         color: meta.igceMode === mode ? (mode==="CATALOG"?"#1a3a6e":"#0f6e56") : "#6b7a99" }}>
                {mode === "LABOR" ? "Standard Labor-Hour" : "Catalog / Rate Card (IDIQ)"}
              </button>
            ))}
            {meta.igceMode === "CATALOG" && (
              <span style={{fontSize:9,color:"#6b7a99",alignSelf:"center"}}>
                For pre-priced IDIQ/catalog contracts — enter unit rates and estimated quantities per period
              </span>
            )}
          </div>
          <div style={{ fontSize: 9, color: C.muted }}>TOTAL {meta.igceMode === "CATALOG" ? "CATALOG" : "LABOR"}</div>
          <div style={{ fontSize: 14, color: C.blue }}>{fmt(totalLabor)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: C.muted }}>TOTAL ODC</div>
          <div style={{ fontSize: 14, color: C.yellow }}>{fmt(totalODC)}</div>
        </div>
        {meta.includeProfit && (
          <div>
            <div style={{ fontSize: 9, color: C.muted }}>TOTAL FEE ({meta.profitRate}%)</div>
            <div style={{ fontSize: 14, color: C.purple }}>{fmt(periodTotals.reduce((s,p)=>s+p.profit,0))}</div>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => onGenerated && onGenerated(text)}
          style={{ background: "#e8f7f0", border: "1px solid #1a6a3a", color: C.green, padding: "6px 16px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: "bold", alignSelf: "center" }}>
          SAVE TO PACKAGE
        </button>
        <button onClick={() => navigator.clipboard.writeText(text)}
          style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue, padding: "6px 16px", borderRadius: 3, cursor: "pointer", fontSize: 11, alignSelf: "center" }}>
          COPY TEXT
        </button>
      </div>

      <div style={{ overflow: "auto", maxHeight: "62vh" }}>

        {/* Period selector */}
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: C.muted, marginRight: 4 }}>PERIODS:</span>
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriods(pp => pp.map(pp2 => pp2.id === p.id ? { ...pp2, active: !pp2.active } : pp2))}
              style={{ padding: "3px 10px", borderRadius: 3, cursor: "pointer", fontSize: 10,
                       background: p.active ? "#eef3fc" : C.bg3,
                       border: `1px solid ${p.active ? C.blue : C.border}`,
                       color: p.active ? C.blue : C.dim }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Labor / Catalog Table — mode-switched */}
        {meta.igceMode === "CATALOG" ? (
          <div style={{ padding: "12px 16px 0" }}>
            <div style={{ fontSize: 9, color: C.accent, letterSpacing: 2, marginBottom: 8 }}>CATALOG CLINs — RATE CARD</div>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 8 }}>Enter the pre-priced unit rate and estimated quantity per period for each catalog line item.</div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: `220px 110px 90px ${activePeriods.map(() => "80px").join(" ")} 80px 28px`, background: C.bg2, padding: "6px 8px", gap: 4 }}>
                <div style={{ fontSize: 9, color: C.muted }}>CLIN / DESCRIPTION</div>
                <div style={{ fontSize: 9, color: C.muted }}>UNIT</div>
                <div style={{ fontSize: 9, color: C.muted }}>RATE ($)</div>
                {activePeriods.map(p => <div key={p.id} style={{ fontSize: 9, color: C.muted }}>{p.label.replace("Option Year","OY")}</div>)}
                <div style={{ fontSize: 9, color: C.muted }}>TOTAL</div>
                <div/>
              </div>
              {catalogClins.map((cl, i) => {
                const rate = parseFloat(cl.rate) || 0;
                const rowTotal = activePeriods.reduce((sum, period, pidx) => {
                  const qty = parseFloat(cl.periodQtys?.[period.id]) || 0;
                  const esc = Math.pow(1 + escRate, pidx);
                  return sum + rate * qty * esc;
                }, 0);
                return (
                  <div key={cl.id} style={{ display: "grid", gridTemplateColumns: `220px 110px 90px ${activePeriods.map(() => "80px").join(" ")} 80px 28px`, padding: "4px 8px", gap: 4, borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.bg2 }}>
                    <input value={cl.title} onChange={e => setCatalogClins(cs => cs.map(c => c.id===cl.id ? {...c, title: e.target.value} : c))}
                      placeholder="CLIN description" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                    <input value={cl.unit} onChange={e => setCatalogClins(cs => cs.map(c => c.id===cl.id ? {...c, unit: e.target.value} : c))}
                      placeholder="e.g. Flight Hour" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                    <input value={cl.rate} onChange={e => setCatalogClins(cs => cs.map(c => c.id===cl.id ? {...c, rate: e.target.value} : c))}
                      placeholder="0.00" type="number" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                    {activePeriods.map((period, pidx) => {
                      const esc = Math.pow(1 + escRate, pidx);
                      const escalatedRate = rate * esc;
                      return (
                        <div key={period.id} style={{ position: "relative" }}>
                          <input value={cl.periodQtys?.[period.id] || ""}
                            onChange={e => setCatalogClins(cs => cs.map(c => c.id===cl.id ? {...c, periodQtys: {...(c.periodQtys||{}), [period.id]: e.target.value}} : c))}
                            placeholder="qty" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                          {pidx > 0 && rate > 0 && (
                            <div style={{ fontSize: 8, color: "#6b7a99", position: "absolute", bottom: -10, left: 4 }}>
                              @${escalatedRate.toFixed(0)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: rowTotal > 0 ? C.text : C.dim }}>{rowTotal > 0 ? fmt(rowTotal) : "—"}</span>
                    </div>
                    <button onClick={() => setCatalogClins(cs => cs.filter(c => c.id !== cl.id))}
                      style={{ background: "none", border: "none", color: "#3a2a2a", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                );
              })}
              {/* Catalog subtotal */}
              <div style={{ display: "grid", gridTemplateColumns: `220px 110px 90px ${activePeriods.map(() => "80px").join(" ")} 80px 28px`, padding: "6px 8px", gap: 4, background: "#041a2e", borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.accent, fontWeight: "bold", gridColumn: "1 / span 3" }}>CATALOG SUBTOTAL</div>
                {activePeriods.map((period, pidx) => {
                  const esc = Math.pow(1 + escRate, pidx);
                  const periodTotal = catalogClins.reduce((sum, cl) => {
                    const qty = parseFloat(cl.periodQtys?.[period.id]) || 0;
                    const rate = parseFloat(cl.rate) || 0;
                    return sum + rate * qty * esc;
                  }, 0);
                  return <div key={period.id} style={{ fontSize: 10, color: C.accent, fontWeight: "bold" }}>{periodTotal > 0 ? fmt(periodTotal) : "—"}</div>;
                })}
                <div style={{ fontSize: 10, color: C.accent, fontWeight: "bold" }}>
                  {fmt(catalogClins.reduce((sum, cl) => {
                    return sum + activePeriods.reduce((s2, period, pidx) => {
                      const qty = parseFloat(cl.periodQtys?.[period.id]) || 0;
                      const rate = parseFloat(cl.rate) || 0;
                      return s2 + rate * qty * Math.pow(1 + escRate, pidx);
                    }, 0);
                  }, 0))}
                </div>
              </div>
            </div>
            <button onClick={() => setCatalogClins(cs => [...cs, { id: Date.now(), title: "", unit: "", rate: "", periodQtys: {}, basis: "" }])}
              style={{ marginTop: 6, background: C.bg3, border: `1px dashed ${C.border}`, color: C.muted, padding: "5px 14px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
              + ADD CATALOG CLIN
            </button>
          </div>
        ) : (
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ fontSize: 9, color: C.blue, letterSpacing: 2, marginBottom: 8 }}>DIRECT LABOR</div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid",
                          gridTemplateColumns: `180px 80px 90px ${activePeriods.map(() => "90px").join(" ")} 110px`,
                          background: C.bg2, padding: "6px 8px", gap: 4 }}>
              <div style={{ fontSize: 9, color: C.muted }}>LABOR CATEGORY</div>
              <div style={{ fontSize: 9, color: C.muted }}>LEVEL</div>
              <div style={{ fontSize: 9, color: C.muted }}>RATE/HR ($)</div>
              {activePeriods.map(p => (
                <div key={p.id} style={{ fontSize: 9, color: C.muted }}>{p.label.replace("Option Year ", "OY").replace("Base Year", "Base")} HRS</div>
              ))}
              <div style={{ fontSize: 9, color: C.muted }}>TOTAL</div>
            </div>

            {/* Rows */}
            {laborCats.map((lc, i) => {
              const rate = parseFloat(lc.rate) || 0;
              const rowTotal = activePeriods.reduce((sum, period, pidx) => {
                const hrs = parseFloat(lc.periodHours?.[period.id]) || 0;
                const esc = Math.pow(1 + escRate, pidx);
                return sum + rate * hrs * esc;
              }, 0);
              return (
                <div key={lc.id} style={{ display: "grid",
                                           gridTemplateColumns: `180px 80px 90px ${activePeriods.map(() => "90px").join(" ")} 110px`,
                                           padding: "4px 8px", gap: 4,
                                           borderTop: `1px solid ${C.border}`,
                                           background: i % 2 === 0 ? "transparent" : C.bg2 }}>
                  <input value={lc.title} onChange={e => updateLC(lc.id,"title",e.target.value)}
                    placeholder="Labor category title" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                  <select value={lc.level} onChange={e => updateLC(lc.id,"level",e.target.value)}
                    style={{ ...inp, padding: "3px 4px", fontSize: 10 }}>
                    {["Junior","Mid","Senior","Principal","SME"].map(l => <option key={l}>{l}</option>)}
                  </select>
                  <input value={lc.rate} onChange={e => updateLC(lc.id,"rate",e.target.value)}
                    placeholder="0.00" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                  {activePeriods.map((period, pidx) => {
                    const esc = Math.pow(1 + escRate, pidx);
                    const escalatedRate = rate * esc;
                    return (
                      <div key={period.id} style={{ position: "relative" }}>
                        <input value={lc.periodHours?.[period.id] || ""}
                          onChange={e => updateLCPeriod(lc.id, period.id, e.target.value)}
                          placeholder="hrs" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                        {pidx > 0 && rate > 0 && (
                          <div style={{ fontSize: 8, color: "#6b7a99", position: "absolute", bottom: -12, left: 4 }}>
                            @${escalatedRate.toFixed(0)}/hr
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: rowTotal > 0 ? C.text : C.dim }}>
                      {rowTotal > 0 ? fmt(rowTotal) : "—"}
                    </span>
                    <button onClick={() => removeLC(lc.id)}
                      style={{ background: "none", border: "none", color: "#3a2a2a", cursor: "pointer", fontSize: 13, marginLeft: "auto" }}>×</button>
                  </div>
                </div>
              );
            })}

            {/* Labor subtotals */}
            <div style={{ display: "grid",
                          gridTemplateColumns: `180px 80px 90px ${activePeriods.map(() => "90px").join(" ")} 110px`,
                          padding: "6px 8px", gap: 4, background: "#e8f7f0", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.green, fontWeight: "bold", gridColumn: "1 / span 3" }}>LABOR SUBTOTAL</div>
              {periodTotals.map(pt => (
                <div key={pt.period.id} style={{ fontSize: 10, color: C.green, fontWeight: "bold" }}>{fmt(pt.labor)}</div>
              ))}
              <div style={{ fontSize: 10, color: C.green, fontWeight: "bold" }}>{fmt(totalLabor)}</div>
            </div>
          </div>

          <button onClick={addLaborCat}
            style={{ marginTop: 6, background: C.bg3, border: `1px dashed ${C.border}`, color: C.muted,
                     padding: "5px 14px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
            + ADD LABOR CATEGORY
          </button>
        </div>
        )}

        {/* ODC Table */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 9, color: C.yellow, letterSpacing: 2, marginBottom: 8 }}>OTHER DIRECT COSTS (ODC)</div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px", background: C.bg2, padding: "6px 8px", gap: 8 }}>
              <div style={{ fontSize: 9, color: C.muted }}>CATEGORY</div>
              <div style={{ fontSize: 9, color: C.muted }}>BASIS OF ESTIMATE</div>
              <div style={{ fontSize: 9, color: C.muted }}>AMOUNT ($)</div>
            </div>
            {odcs.map((odc, i) => (
              <div key={odc.id} style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px", padding: "4px 8px", gap: 8,
                                          borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? "transparent" : C.bg2 }}>
                <input value={odc.category} onChange={e => updateODC(odc.id,"category",e.target.value)}
                  placeholder="ODC category" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                <input value={odc.basis} onChange={e => updateODC(odc.id,"basis",e.target.value)}
                  placeholder="Basis of estimate" style={{ ...inp, padding: "3px 5px", fontSize: 10 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input value={odc.amount} onChange={e => updateODC(odc.id,"amount",e.target.value)}
                    placeholder="0.00" style={{ ...inp, padding: "3px 5px", fontSize: 10, flex: 1 }} />
                  <button onClick={() => setOdcs(o => o.filter(oo => oo.id !== odc.id))}
                    style={{ background: "none", border: "none", color: "#3a2a2a", cursor: "pointer", fontSize: 13 }}>×</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addODC}
            style={{ marginTop: 6, background: C.bg3, border: `1px dashed ${C.border}`, color: C.muted,
                     padding: "5px 14px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
            + ADD ODC LINE
          </button>
        </div>

        {/* Period summary table */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>PERIOD SUMMARY</div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${periodTotals.length + 1}, 1fr)`, background: C.bg2, padding: "6px 8px", gap: 4 }}>
              <div style={{ fontSize: 9, color: C.muted }}>COST ELEMENT</div>
              {periodTotals.map(pt => <div key={pt.period.id} style={{ fontSize: 9, color: C.muted }}>{pt.period.label.replace("Option Year ","OY")}</div>)}
              <div style={{ fontSize: 9, color: C.muted }}>TOTAL</div>
            </div>
            {[
              { label: "Labor",    key: "labor",    color: C.blue   },
              { label: "ODC",      key: "odc",      color: C.yellow },
              { label: "Subtotal", key: "subtotal", color: C.text   },
              ...(meta.includeProfit ? [{ label: `Fee (${meta.profitRate}%)`, key: "profit", color: C.purple }] : []),
              { label: "TOTAL",    key: "total",    color: C.green  },
            ].map(row => (
              <div key={row.key} style={{ display: "grid", gridTemplateColumns: `160px repeat(${periodTotals.length + 1}, 1fr)`,
                                          padding: "5px 8px", gap: 4, borderTop: `1px solid ${C.border}`,
                                          background: row.key === "total" ? "#e8f7f0" : "transparent",
                                          fontWeight: row.key === "total" ? "bold" : "normal" }}>
                <div style={{ fontSize: 10, color: row.color }}>{row.label}</div>
                {periodTotals.map(pt => (
                  <div key={pt.period.id} style={{ fontSize: 10, color: row.color }}>{fmt(pt[row.key])}</div>
                ))}
                <div style={{ fontSize: 10, color: row.color }}>
                  {fmt(periodTotals.reduce((s, pt) => s + pt[row.key], 0))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assumptions/BOE */}
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            {lbl("Basis of Estimate")}
            <textarea style={ta} rows={3} value={meta.basisOfEstimate} onChange={e => setMetaField("basisOfEstimate", e.target.value)} />
          </div>
          <div>
            {lbl("Assumptions")}
            <textarea style={ta} rows={3} value={meta.assumptions} onChange={e => setMetaField("assumptions", e.target.value)} />
          </div>
          <div>
            {lbl("Limitations / Caveats")}
            <textarea style={ta} rows={2} value={meta.limitations} onChange={e => setMetaField("limitations", e.target.value)} />
          </div>
          <div>
            {lbl("Prepared By")}
            <input style={inp} value={meta.preparedBy} onChange={e => setMetaField("preparedBy", e.target.value)} />
            {lbl("Date")}
            <input style={inp} type="date" value={meta.prepDate} onChange={e => setMetaField("prepDate", e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildIGCEText(meta, laborCats, odcs, activePeriods, periodTotals, grandTotal, escRate) {
  const fmt = n => n > 0 ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }) : "[DATE]";

  let t = `INDEPENDENT GOVERNMENT COST ESTIMATE (IGCE)\n`;
  t += `FAR 15.404-1 / NFS 1807.105\n${"═".repeat(70)}\n\n`;
  t += `Requirement:    ${meta.reqTitle || "[REQUIREMENT]"}\n`;
  t += `Center:         ${meta.center || "[CENTER]"}\n`;
  t += `Contract Type:  ${meta.contractType}\n`;
  t += `PoP:            ${meta.pop}\n`;
  if (meta.naics) t += `NAICS:          ${meta.naics}\n`;
  t += `Prepared By:    ${meta.preparedBy || "[PREPARER]"}\n`;
  t += `Date:           ${fmtDate(meta.prepDate)}\n\n`;

  t += `${"─".repeat(70)}\n`;
  t += `BASIS OF ESTIMATE\n\n${meta.basisOfEstimate}\n\n`;
  t += `Escalation Rate: ${meta.escalationRate === "CUSTOM" ? meta.customEscalation + "% (custom)" : meta.escalationRate + (meta.escalationRate === "CPI" ? " (CPI-based)" : "% per year")}\n\n`;

  t += `${"─".repeat(70)}\n`;
  t += `DIRECT LABOR\n\n`;
  t += `${"Category".padEnd(30)} ${"Level".padEnd(10)} ${"Rate/Hr".padEnd(12)}`;
  activePeriods.forEach(p => { t += `${p.label.replace("Option Year ","OY").replace("Base Year","Base").padEnd(14)}`; });
  t += `${"Total".padEnd(14)}\n`;
  t += `${"─".repeat(30 + 10 + 12 + activePeriods.length * 14 + 14)}\n`;

  laborCats.forEach(lc => {
    if (!lc.title) return;
    const rate = parseFloat(lc.rate) || 0;
    let rowTotal = 0;
    t += `${lc.title.slice(0,28).padEnd(30)} ${lc.level.padEnd(10)} ${"$"+rate.toFixed(2).padStart(10)} `;
    activePeriods.forEach((period, pidx) => {
      const hrs = parseFloat(lc.periodHours?.[period.id]) || 0;
      const esc = Math.pow(1 + escRate, pidx);
      const amt = rate * hrs * esc;
      rowTotal += amt;
      t += `${(hrs > 0 ? hrs + "hrs/" + fmt(amt) : "—").padEnd(14)}`;
    });
    t += `${fmt(rowTotal)}\n`;
  });
  t += `\n`;
  t += `${"Labor Subtotal".padEnd(52)} ${fmt(periodTotals.reduce((s,p)=>s+p.labor,0))}\n\n`;

  t += `${"─".repeat(70)}\n`;
  t += `OTHER DIRECT COSTS (ODC)\n\n`;
  odcs.forEach(odc => {
    if (!odc.category) return;
    const amt = parseFloat(odc.amount) || 0;
    t += `${odc.category.padEnd(30)} ${fmt(amt).padStart(14)}`;
    if (odc.basis) t += `   (${odc.basis})`;
    t += `\n`;
  });
  t += `${"ODC Subtotal".padEnd(44)} ${fmt(periodTotals.reduce((s,p)=>s+p.odc,0))}\n\n`;

  t += `${"─".repeat(70)}\n`;
  t += `COST SUMMARY BY PERIOD\n\n`;
  t += `${"Period".padEnd(20)} ${"Labor".padEnd(16)} ${"ODC".padEnd(16)} ${"Subtotal".padEnd(16)}`;
  if (meta.includeProfit) t += `${"Fee".padEnd(16)}`;
  t += `TOTAL\n${"─".repeat(70)}\n`;
  periodTotals.forEach(pt => {
    t += `${pt.period.label.padEnd(20)} ${fmt(pt.labor).padEnd(16)} ${fmt(pt.odc).padEnd(16)} ${fmt(pt.subtotal).padEnd(16)}`;
    if (meta.includeProfit) t += `${fmt(pt.profit).padEnd(16)}`;
    t += `${fmt(pt.total)}\n`;
  });
  t += `${"─".repeat(70)}\n`;
  t += `GRAND TOTAL IGCE:  ${fmt(grandTotal)}\n\n`;

  t += `${"─".repeat(70)}\n`;
  t += `ASSUMPTIONS\n\n${meta.assumptions}\n\n`;
  t += `LIMITATIONS\n\n${meta.limitations}\n\n`;

  t += `${"─".repeat(70)}\n\n`;
  t += `${"_".repeat(40)}\n`;
  t += `${meta.preparedBy || "[Prepared By]"}\n`;
  t += `Date: ${fmtDate(meta.prepDate)}\n`;
  t += `\nThis IGCE is FOR OFFICIAL USE ONLY and is SOURCE SELECTION SENSITIVE.\n`;
  t += `Not to be released outside the Government without CO approval.\n`;
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// MARKET RESEARCH REPORT — FAR PART 10
// ═══════════════════════════════════════════════════════════════════

const MR_METHODS = [
  { id: "internet",   label: "Internet / online research (vendor websites, GSA Advantage, SAM.gov)" },
  { id: "rfi",        label: "Request for Information (RFI) / Sources Sought issued on SAM.gov" },
  { id: "prior",      label: "Review of prior contract files and pricing data" },
  { id: "industry",   label: "Industry day / one-on-one meetings with potential vendors" },
  { id: "gsa",        label: "GSA Schedule / GWAC pricing research (GSA Advantage, eBuy)" },
  { id: "cpars",      label: "Review of CPARS past performance records" },
  { id: "market_survey",label:"Market survey / questionnaire distributed to vendors" },
  { id: "trade",      label: "Trade publications, journals, and professional associations" },
  { id: "other_agency",label:"Coordination with other Government agencies for similar acquisitions" },
];

export function MarketResearchReport({ intake, onGenerated }) {
  const [r, setR] = useState({
    reqTitle:          intake?.reqTitle  || "",
    center:            intake?.center    || "",
    naics:             intake?.naics     || "",
    psc:               intake?.psc       || "",
    value:             intake?.value     || "",
    pop:               intake?.pop       || "",
    preparedBy:        intake?.coName    || "",
    prepDate:          "",
    dateRange:         "",
    objective:         "To determine whether commercial items or non-developmental items are available to satisfy the Government's requirement, and to identify potential sources.",
    methodsUsed:       ["internet", "rfi", "prior"],
    rfiNumber:         "",
    rfiResponses:      "",
    rfiDate:           "",
    commercialAvail:   "YES",    // YES, PARTIAL, NO
    commercialBasis:   "",
    sources:           [
      { id: 1, name: "", size: "Large", capability: "", pricing: "", notes: "" },
      { id: 2, name: "", size: "Small", capability: "", pricing: "", notes: "" },
    ],
    ruleOfTwo:         "YES",    // YES, NO, UNABLE
    ruleOfTwoBasis:    "",
    setAsideRec:       "FULL_OPEN",
    setAsideRationale: "",
    priceRange:        "",
    priceBasis:        "",
    standardsFound:    "",
    industryPractice:  "",
    sustainabilityConsiderations: "",
    conclusion:        "",
    recommendations:   "",
  });
  const set = (k, v) => setR(rr => ({ ...rr, [k]: v }));
  const toggleMethod = (id) => set("methodsUsed", r.methodsUsed.includes(id) ? r.methodsUsed.filter(m => m !== id) : [...r.methodsUsed, id]);

  function updateSource(id, field, val) {
    setR(rr => ({ ...rr, sources: rr.sources.map(s => s.id === id ? { ...s, [field]: val } : s) }));
  }
  function addSource() {
    setR(rr => ({ ...rr, sources: [...rr.sources, { id: Date.now(), name: "", size: "Small", capability: "", pricing: "", notes: "" }] }));
  }

  const text = useMemo(() => buildMRText(r, intake), [r, intake]);

  return (
    <div style={{ fontFamily: "FONT_COMP", color: C.text }}>
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", minHeight: 520 }}>
        <div style={{ padding: 16, borderRight: `1px solid ${C.border}`, overflow: "auto", maxHeight: "72vh" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>MARKET RESEARCH REPORT — FAR PART 10</div>

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginBottom: 4 }}>REQUIREMENT</div>
          {lbl("Title", true)}
          <input style={inp} value={r.reqTitle} onChange={e => set("reqTitle", e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div>{lbl("NAICS")} <input style={inp} value={r.naics} onChange={e => set("naics", e.target.value)} /></div>
            <div>{lbl("PSC")}   <input style={inp} value={r.psc}   onChange={e => set("psc",   e.target.value)} /></div>
          </div>
          {lbl("Estimated Value")}
          <input style={inp} value={r.value} onChange={e => set("value", e.target.value)} placeholder="e.g., $2,500,000" />
          {lbl("Period of Performance")}
          <input style={inp} value={r.pop} onChange={e => set("pop", e.target.value)} />
          {lbl("Research Date Range")}
          <input style={inp} value={r.dateRange} onChange={e => set("dateRange", e.target.value)} placeholder="e.g., January – March 2026" />

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>RESEARCH OBJECTIVE</div>
          <textarea style={ta} rows={2} value={r.objective} onChange={e => set("objective", e.target.value)} />

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>METHODS USED (FAR 10.002(b))</div>
          {MR_METHODS.map(m => (
            <div key={m.id} onClick={() => toggleMethod(m.id)}
              style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 6px", cursor: "pointer",
                       background: r.methodsUsed.includes(m.id) ? "#e8f7f0" : "transparent",
                       border: `1px solid ${r.methodsUsed.includes(m.id) ? "#1a4a2a" : "transparent"}`,
                       borderRadius: 3, marginBottom: 3 }}>
              <div style={{ width: 12, height: 12, border: `1px solid ${r.methodsUsed.includes(m.id) ? C.green : "#8896b0"}`,
                             borderRadius: 2, background: r.methodsUsed.includes(m.id) ? C.green : "transparent",
                             flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff" }}>
                {r.methodsUsed.includes(m.id) ? "✓" : ""}
              </div>
              <span style={{ fontSize: 9, color: r.methodsUsed.includes(m.id) ? C.text : C.dim, lineHeight: 1.4 }}>{m.label}</span>
            </div>
          ))}

          {r.methodsUsed.includes("rfi") && (<>
            <div style={{ fontSize: 10, color: C.green, fontWeight: "bold", marginTop: 10, marginBottom: 4 }}>RFI / SOURCES SOUGHT DETAILS</div>
            {lbl("RFI/SS Notice Number")}
            <input style={inp} value={r.rfiNumber} onChange={e => set("rfiNumber", e.target.value)} />
            {lbl("Issue Date")}
            <input style={inp} value={r.rfiDate} onChange={e => set("rfiDate", e.target.value)} placeholder="e.g., January 15, 2026" />
            {lbl("Number and Type of Responses")}
            <textarea style={ta} rows={2} value={r.rfiResponses} onChange={e => set("rfiResponses", e.target.value)}
              placeholder="e.g., 12 responses received: 8 large, 4 small business" />
          </>)}

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>SOURCES IDENTIFIED</div>
          {r.sources.map((s, i) => (
            <div key={s.id} style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 3, padding: "8px 10px", marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: C.muted }}>SOURCE #{i+1}</span>
                <button onClick={() => setR(rr => ({ ...rr, sources: rr.sources.filter(ss => ss.id !== s.id) }))}
                  style={{ background: "none", border: "none", color: "#3a2a2a", cursor: "pointer", fontSize: 13 }}>×</button>
              </div>
              <input value={s.name} onChange={e => updateSource(s.id, "name", e.target.value)}
                placeholder="Company name" style={{ ...inp, marginBottom: 4 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <select value={s.size} onChange={e => updateSource(s.id, "size", e.target.value)} style={{ ...inp }}>
                  {["Large","Small","SDB","8(a)","HUBZone","SDVOSB","WOSB","VOSB"].map(sz => <option key={sz}>{sz}</option>)}
                </select>
                <input value={s.pricing} onChange={e => updateSource(s.id, "pricing", e.target.value)}
                  placeholder="Pricing indication" style={inp} />
              </div>
              <input value={s.capability} onChange={e => updateSource(s.id, "capability", e.target.value)}
                placeholder="Capability summary" style={{ ...inp, marginTop: 4 }} />
            </div>
          ))}
          <button onClick={addSource}
            style={{ width: "100%", background: C.bg3, border: `1px dashed ${C.border}`, color: C.muted,
                     padding: "5px", borderRadius: 3, cursor: "pointer", fontSize: 10, marginBottom: 8 }}>
            + ADD SOURCE
          </button>

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 10, marginBottom: 4 }}>COMMERCIAL AVAILABILITY (FAR 10.002(b)(2)(i))</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[["YES","Commercial available"], ["PARTIAL","Partially commercial"], ["NO","Non-commercial"]].map(([val, lbl2]) => (
              <button key={val} onClick={() => set("commercialAvail", val)}
                style={{ flex: 1, padding: "5px 4px", borderRadius: 3, cursor: "pointer", fontSize: 9,
                         background: r.commercialAvail === val ? "#eef3fc" : C.bg3,
                         border: `1px solid ${r.commercialAvail === val ? C.blue : C.border}`,
                         color: r.commercialAvail === val ? C.blue : C.dim }}>
                {lbl2}
              </button>
            ))}
          </div>
          {lbl("Commercial Determination Basis")}
          <textarea style={ta} rows={2} value={r.commercialBasis} onChange={e => set("commercialBasis", e.target.value)}
            placeholder="Explain basis for commercial/non-commercial determination per FAR 2.101..." />

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>RULE OF TWO (FAR 19.502-2)</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {[["YES","Reasonable expectation of 2+ SB offers"], ["NO","Rule of Two not met"], ["UNABLE","Unable to determine"]].map(([val, lbl2]) => (
              <button key={val} onClick={() => set("ruleOfTwo", val)}
                style={{ flex: 1, padding: "5px 4px", borderRadius: 3, cursor: "pointer", fontSize: 9,
                         background: r.ruleOfTwo === val ? "#eef3fc" : C.bg3,
                         border: `1px solid ${r.ruleOfTwo === val ? C.blue : C.border}`,
                         color: r.ruleOfTwo === val ? C.blue : C.dim }}>
                {lbl2}
              </button>
            ))}
          </div>
          {lbl("Rule of Two Analysis Basis")}
          <textarea style={ta} rows={2} value={r.ruleOfTwoBasis} onChange={e => set("ruleOfTwoBasis", e.target.value)} />

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>SET-ASIDE RECOMMENDATION</div>
          <select style={inp} value={r.setAsideRec} onChange={e => set("setAsideRec", e.target.value)}>
            <option value="TOTAL_SB">Total Small Business Set-Aside</option>
            <option value="PARTIAL_SB">Partial Small Business Set-Aside</option>
            <option value="8A">8(a) Direct Award</option>
            <option value="HUBZONE">HUBZone Set-Aside</option>
            <option value="SDVOSB">SDVOSB Set-Aside</option>
            <option value="WOSB">WOSB Set-Aside</option>
            <option value="FULL_OPEN">Full and Open Competition</option>
            <option value="SOLE_SOURCE">Sole Source</option>
          </select>
          {lbl("Rationale")}
          <textarea style={ta} rows={2} value={r.setAsideRationale} onChange={e => set("setAsideRationale", e.target.value)} />

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>PRICING AND STANDARDS</div>
          {lbl("Price Range Identified")}
          <input style={inp} value={r.priceRange} onChange={e => set("priceRange", e.target.value)} placeholder="e.g., $1.2M – $1.8M based on..." />
          {lbl("Price Basis")}
          <textarea style={ta} rows={2} value={r.priceBasis} onChange={e => set("priceBasis", e.target.value)} />
          {lbl("Industry Standards / Specifications Found")}
          <textarea style={ta} rows={2} value={r.standardsFound} onChange={e => set("standardsFound", e.target.value)} />
          {lbl("Customary Commercial Practices")}
          <textarea style={ta} rows={2} value={r.industryPractice} onChange={e => set("industryPractice", e.target.value)} />

          <div style={{ fontSize: 10, color: C.blue, fontWeight: "bold", marginTop: 14, marginBottom: 4 }}>CONCLUSIONS & RECOMMENDATIONS</div>
          <textarea style={ta} rows={3} value={r.conclusion} onChange={e => set("conclusion", e.target.value)}
            placeholder="Summarize findings and overall market conditions..." />
          {lbl("Recommendations to CO")}
          <textarea style={ta} rows={3} value={r.recommendations} onChange={e => set("recommendations", e.target.value)}
            placeholder="Recommend acquisition strategy, contract type, set-aside, etc." />

          {lbl("Prepared By")}
          <input style={inp} value={r.preparedBy} onChange={e => set("preparedBy", e.target.value)} />
          {lbl("Date")}
          <input style={inp} type="date" value={r.prepDate} onChange={e => set("prepDate", e.target.value)} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
            <button onClick={() => navigator.clipboard.writeText(text)}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              COPY
            </button>
            <button onClick={() => onGenerated && onGenerated(text)}
              style={{ background: "#e8f7f0", border: "1px solid #1a6a3a", color: C.green, padding: "6px 14px", borderRadius: 3, cursor: "pointer", fontSize: 11 }}>
              SAVE TO PACKAGE
            </button>
          </div>
          <pre style={{ flex: 1, padding: 16, fontSize: 10, color: C.dim, overflow: "auto", maxHeight: "64vh", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function buildMRText(r, intake) {
  const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "[DATE]";
  const setAsideLabels = {
    TOTAL_SB:"Total Small Business Set-Aside", PARTIAL_SB:"Partial Small Business Set-Aside",
    "8A":"8(a) Direct Award", HUBZONE:"HUBZone Set-Aside", SDVOSB:"SDVOSB Set-Aside",
    WOSB:"WOSB Set-Aside", FULL_OPEN:"Full and Open Competition", SOLE_SOURCE:"Sole Source",
  };

  let t = `MARKET RESEARCH REPORT\nFAR Part 10 / FAR 10.002\n${"═".repeat(70)}\n\n`;
  t += `Requirement:  ${r.reqTitle || intake?.reqTitle || "[REQUIREMENT]"}\n`;
  t += `Center:       ${r.center || intake?.center || "[CENTER]"}\n`;
  if (r.naics)       t += `NAICS Code:   ${r.naics}\n`;
  if (r.psc)         t += `PSC Code:     ${r.psc}\n`;
  if (r.value)       t += `Est. Value:   ${r.value}\n`;
  if (r.pop)         t += `PoP:          ${r.pop}\n`;
  t += `Date Range:   ${r.dateRange || "[RESEARCH DATE RANGE]"}\n`;
  t += `Prepared By:  ${r.preparedBy || "[PREPARER]"}\n`;
  t += `Date:         ${fmtDate(r.prepDate)}\n\n`;

  t += `${"─".repeat(70)}\n1.  OBJECTIVE\n\n${r.objective}\n\n`;

  t += `${"─".repeat(70)}\n2.  RESEARCH METHODS (FAR 10.002(b))\n\n`;
  const methodLabels = Object.fromEntries(MR_METHODS.map(m => [m.id, m.label]));
  r.methodsUsed.forEach(m => { t += `    ✓ ${methodLabels[m] || m}\n`; });
  t += `\n`;

  if (r.methodsUsed.includes("rfi") && r.rfiNumber) {
    t += `    RFI/Sources Sought No.: ${r.rfiNumber}\n`;
    if (r.rfiDate) t += `    Issue Date: ${r.rfiDate}\n`;
    if (r.rfiResponses) t += `    Responses: ${r.rfiResponses}\n`;
    t += `\n`;
  }

  t += `${"─".repeat(70)}\n3.  SOURCES IDENTIFIED\n\n`;
  if (r.sources.filter(s => s.name).length === 0) {
    t += `    No specific sources identified to date.\n\n`;
  } else {
    t += `${"Company".padEnd(35)} ${"Size".padEnd(12)} ${"Capability/Pricing"}\n${"─".repeat(70)}\n`;
    r.sources.filter(s => s.name).forEach(s => {
      t += `${s.name.padEnd(35)} ${s.size.padEnd(12)} ${s.capability || ""}\n`;
      if (s.pricing) t += `${"".padEnd(47)} Pricing: ${s.pricing}\n`;
    });
    t += `\n`;
  }

  t += `${"─".repeat(70)}\n4.  COMMERCIAL ITEM DETERMINATION (FAR 10.002(b)(2)(i))\n\n`;
  const commMap = { YES: "Commercial items/services ARE available to meet the Government's requirement.", PARTIAL: "Commercial items/services PARTIALLY meet the Government's requirement.", NO: "Commercial items/services are NOT available to meet the Government's requirement." };
  t += `    ${commMap[r.commercialAvail]}\n\n`;
  if (r.commercialBasis) t += `    Basis: ${r.commercialBasis}\n\n`;

  t += `${"─".repeat(70)}\n5.  SMALL BUSINESS / RULE OF TWO (FAR 19.502-2)\n\n`;
  const ruleMap = { YES: "There IS a reasonable expectation of receiving offers from at least two responsible small business concerns.", NO: "There is NOT a reasonable expectation of receiving offers from at least two responsible small business concerns.", UNABLE: "Unable to determine whether the Rule of Two is met at this time." };
  t += `    ${ruleMap[r.ruleOfTwo]}\n\n`;
  if (r.ruleOfTwoBasis) t += `    Basis: ${r.ruleOfTwoBasis}\n\n`;

  t += `${"─".repeat(70)}\n6.  SET-ASIDE RECOMMENDATION\n\n`;
  t += `    Recommended Strategy: ${setAsideLabels[r.setAsideRec] || r.setAsideRec}\n`;
  if (r.setAsideRationale) t += `\n    Rationale: ${r.setAsideRationale}\n`;
  t += `\n`;

  if (r.priceRange || r.priceBasis) {
    t += `${"─".repeat(70)}\n7.  PRICING\n\n`;
    if (r.priceRange) t += `    Price Range: ${r.priceRange}\n`;
    if (r.priceBasis) t += `    Basis: ${r.priceBasis}\n`;
    t += `\n`;
  }

  if (r.standardsFound || r.industryPractice) {
    t += `${"─".repeat(70)}\n8.  INDUSTRY STANDARDS AND PRACTICES\n\n`;
    if (r.standardsFound)   t += `    Standards: ${r.standardsFound}\n\n`;
    if (r.industryPractice) t += `    Customary Practices: ${r.industryPractice}\n\n`;
  }

  t += `${"─".repeat(70)}\n9.  CONCLUSIONS\n\n${r.conclusion || "[Summary of market conditions and research findings]"}\n\n`;

  t += `${"─".repeat(70)}\n10. RECOMMENDATIONS\n\n${r.recommendations || "[Recommendations to the Contracting Officer]"}\n\n`;

  t += `${"─".repeat(70)}\n\n${"_".repeat(40)}\n${r.preparedBy || "[Prepared By]"}\nDate: ${fmtDate(r.prepDate)}\n`;
  return t;
}

// ═══════════════════════════════════════════════════════════════════
// COMBINED PRE-SOLICITATION TOOLS
// ═══════════════════════════════════════════════════════════════════

export default function PreSolTools({ intake, onSaved }) {
  const [tab, setTab] = useState("IGCE");

  function save(text, docType) {
    const sk = "cpas_docs_" + (intake?.reqTitle || "x");
    try {
      const ex = JSON.parse(localStorage.getItem(sk) || "[]");
      localStorage.setItem(sk, JSON.stringify([
        ...ex.filter(d => d.docType !== docType),
        { docType, label: { IGCE: "IGCE", MARKET_RESEARCH: "Market Research Report" }[docType] || docType, content: text, ts: Date.now() }
      ]));
    } catch(e) {}
    onSaved && onSaved(docType);
    alert(`${docType.replace(/_/g," ")} saved to NEAR package.`);
  }

  const tabs = [
    { id: "IGCE",            label: "IGCE Worksheet",        color: C.green  },
    { id: "MARKET_RESEARCH", label: "Market Research Report", color: C.blue  },
  ];

  return (
    <div style={{ fontFamily: "FONT_COMP", color: C.text, background: C.bg }}>
      <div style={{ display: "flex", gap: 2, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "6px 18px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: "bold",
                     background: tab === t.id ? "#eef3fc" : C.bg3,
                     border: `1px solid ${tab === t.id ? t.color : C.border}`,
                     color: tab === t.id ? t.color : C.dim }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "IGCE"            && <IGCEWorksheet     intake={intake} onGenerated={t => save(t, "IGCE")}           />}
      {tab === "MARKET_RESEARCH" && <MarketResearchReport intake={intake} onGenerated={t => save(t, "MARKET_RESEARCH")} />}
    </div>
  );
}
