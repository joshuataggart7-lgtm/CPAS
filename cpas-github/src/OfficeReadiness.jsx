import { useState } from "react";

// ─────────────────────────────────────────────────────────────────
// OFFICE READINESS CONSOLE
// Practical "what good looks like" guide for HQ review readiness
// Not a grading engine — office support and clear expectations
// ─────────────────────────────────────────────────────────────────

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const C = {
  navy:"#0B3D91", blue:"#1a5aaa", light:"#f0f4ff",
  green:"#2db87a", greenBg:"#f0faf5",
  yellow:"#92400e", yellowBg:"#fffbeb",
  red:"#dc2626", redBg:"#fef2f2",
  border:"#dde3ef", muted:"#8896b0", text:"#1a2332",
  bg:"#fff", bg2:"#f8f9fc",
};

// ── Readiness item data ──────────────────────────────────────────
const SECTIONS = [
  {
    id: "file_org",
    label: "File Organization & NEAR Compliance",
    icon: "🗂️",
    tier: "CO",
    items: [
      {
        id: "ro-1",
        expectation: "All contract actions issued on or after Oct 1, 2024 are stored in NEAR with correct file element folder structure",
        why: "NEAR is the mandatory contract filing repository per NFS CG 1804.110. Missing NEAR entries are a primary HQ review finding.",
        substantiation: "NEAR record for each contract with file elements populated per NFS CG 1804.13",
        citation: "NFS CG 1804.110; NFS CG 1804.12",
        fileLocation: "NEAR — all file elements",
        astro: "Quiet check: NEAR milestone entry is required at the earliest stages of acquisition planning, not just at award.",
      },
      {
        id: "ro-2",
        expectation: "PALT milestones are entered and current for all actions above the SAT",
        why: "PALT data feeds monthly Baseline Performance Reviews and is visible to NASA leadership. Stale or missing milestones reflect poorly on the office.",
        substantiation: "NEAR milestone entries with actual dates updated through award",
        citation: "NFS CG 1804.112",
        fileLocation: "NEAR milestone module",
        astro: "PALT is tracked from initial solicitation to award date. Delays without escalation are flagged in BPR.",
      },
      {
        id: "ro-3",
        expectation: "Contract files contain no unexplained gaps — every required document is present or its absence is documented",
        why: "Reviewers look for completeness. A missing document with no notation is worse than a documented waiver or N/A determination.",
        substantiation: "Complete file per NFS CG 1804.13 folder structure; any N/A items noted",
        citation: "NFS CG 1804.12; NFS CG 1804.13",
        fileLocation: "NEAR file element folders",
        astro: "If a required document doesn't apply, a brief written note explaining why is stronger than silence.",
      },
    ],
  },
  {
    id: "acq_planning",
    label: "Acquisition Planning Documentation",
    icon: "📋",
    tier: "CO",
    items: [
      {
        id: "ro-4",
        expectation: "PSM Executive Presentation is on file, approved at the correct level, with signed minutes",
        why: "PSM is the foundational acquisition strategy document. Reviewers verify the approved strategy matches what was actually executed.",
        substantiation: "Approved PSM charts, signed minutes, approval signatures per NFS CG 1807.11 threshold",
        citation: "NFS CG 1807.11; NFS CG 1807.13",
        fileLocation: "NEAR FE: Acquisition Plan/PSM",
        astro: "PSM minutes must be approved before releasing a Draft RFP or Final RFP. Sequencing matters.",
      },
      {
        id: "ro-5",
        expectation: "IGCE is signed by the requiring official (not the CO), with documented basis of estimate",
        why: "A CO-prepared IGCE without documented basis is a common audit finding. The requiring office certifies the technical estimate; the CO uses it for price reasonableness.",
        substantiation: "Signed IGCE with basis of estimate (historical data, market rates, parametric estimates)",
        citation: "NFS CG 1807; NFS CG 1807.14",
        fileLocation: "NEAR FE: IGCE",
        astro: "If the CO prepared the IGCE due to requiring office limitations, document the circumstances and have it reviewed by a second CO.",
      },
      {
        id: "ro-6",
        expectation: "Market research is documented, current, and clearly supports the acquisition strategy",
        why: "Reviewers verify the strategy (competition, contract type, commercial determination) flows logically from the market research findings.",
        substantiation: "NF 1787A or equivalent memo; SAM.gov/FPDS searches; industry engagement notes",
        citation: "FAR 10.001; NFS CG 1810.12",
        fileLocation: "NEAR FE: Market Research",
        astro: "Market research that supports a sole source determination needs to actively demonstrate you looked for alternatives — not just confirm one source exists.",
      },
    ],
  },
  {
    id: "competition",
    label: "Competition & Small Business",
    icon: "⚖️",
    tier: "CO",
    items: [
      {
        id: "ro-7",
        expectation: "JOFOC/J&A contains all required elements, is approved at the correct authority level, and matches the actual contract",
        why: "J&A approval chain is a top HQ review focus. An approved J&A for $10M that results in a $15M award requires re-approval.",
        substantiation: "Approved J&A with all 11 elements per RFO FAR 6.104-1; approval signatures per RFO FAR 6.104-2",
        citation: "RFO FAR 6.104-1; RFO FAR 6.104-2; NFS CG 1806.16",
        fileLocation: "NEAR FE: J&A / Justification",
        astro: "If the value increases before award, the J&A must be re-approved. A revised J&A is not optional.",
      },
      {
        id: "ro-8",
        expectation: "NF 1787 Small Business Coordination Package is complete, OSBP-concurred, and on file for all acquisitions >$2M not set aside",
        why: "Incomplete or missing NF 1787 coordination is one of the most common pre-award deficiency findings in NASA procurement reviews.",
        substantiation: "Signed NF 1787, NF 1787A, and OSBP SBS concurrence memo",
        citation: "NFS CG 1819.11; NFS CG 1810.12",
        fileLocation: "NEAR FE: Small Business Coordination",
        astro: "OSBP coordination must happen before award, not after. Retroactive coordination is not accepted.",
      },
      {
        id: "ro-9",
        expectation: "Subcontracting plan is negotiated, incorporated, and has documented goals for all socioeconomic categories",
        why: "Large business contractors above $900K must have a subcontracting plan. Missing or incomplete plans create contract file deficiencies.",
        substantiation: "Signed subcontracting plan with separate goals for SB, SDB, WOSB, HUBZone, VOSB, SDVOSB",
        citation: "FAR 19.109; FAR 52.219-9; NFS CG 1819.13",
        fileLocation: "NEAR FE: Subcontracting Plan",
        astro: "Goals are percentages of total subcontract dollars. Individual subcontracting reports (ISRs) must be submitted to SPR within 45 days of each reporting period.",
      },
    ],
  },
  {
    id: "price_cost",
    label: "Price & Cost Documentation",
    icon: "💲",
    tier: "CO",
    items: [
      {
        id: "ro-10",
        expectation: "PNM documents the basis for price/cost reasonableness with sufficient narrative for an independent reader to follow the CO's reasoning",
        why: "The PNM is the primary document reviewers use to assess whether the CO exercised sound judgment on price. Thin narratives draw follow-up questions.",
        substantiation: "PNM with: contractor proposal summary, Government objective, negotiation highlights, reasonableness determination, and CO signature",
        citation: "FAR 15.406-3; NFS CG 1815.49",
        fileLocation: "NEAR FE: PNM (FE 82)",
        astro: "A PNM that just says 'price is fair and reasonable based on competition' without analysis won't survive an HQ review for a sole source award.",
      },
      {
        id: "ro-11",
        expectation: "TINA compliance determination is documented — certified cost or pricing data obtained or exception documented",
        why: "Failure to obtain required certified data, or failure to document an exception, is a reportable deficiency and can expose the Government to defective pricing claims.",
        substantiation: "Certificate of Current Cost or Pricing Data (if applicable) or written exception determination",
        citation: "FAR 15.403-1; FAR 15.403-2; FAR 15.403-3 ($2.5M threshold per FAC 2025-06)",
        fileLocation: "NEAR FE: Certified Cost or Pricing Data",
        astro: "FAC 2025-06 raised the TINA threshold to $2.5M. Actions below $2.5M generally qualify for the adequate price competition exception if truly competitive.",
      },
    ],
  },
  {
    id: "award_reporting",
    label: "Award & Reporting",
    icon: "🏆",
    tier: "CO",
    items: [
      {
        id: "ro-12",
        expectation: "FPDS-NG CAR is complete, accurate, and submitted within 3 business days of award",
        why: "FPDS data feeds congressional reporting, GAO reviews, and NASA's own portfolio analytics. Errors or late submissions are tracked at the SPE level.",
        substantiation: "Completed and published CAR in FPDS-NG; unpublished CARs are not considered complete",
        citation: "FAR 4.604; NFS CG 1804.31",
        fileLocation: "FPDS-NG (external); NEAR FE: CAR",
        astro: "Check that the CAR reflects the actual award value, contract type, competition type, NAICS, PSC, and small business status. These fields are frequently wrong.",
      },
      {
        id: "ro-13",
        expectation: "HQ public announcement submitted for actions ≥$7M; ANOSCA submitted via NPA template for actions ≥$30M",
        why: "Late or missing HQ notifications are tracked and reported. The $7M and $30M thresholds are firm.",
        substantiation: "NPA template submission confirmation; ANOSCA application entry for ≥$30M",
        citation: "NFS 1805.302; NFS CG 1805.32; PIC 26-01",
        fileLocation: "NEAR FE: HQ Notifications; ANOSCA application",
        astro: "ANOSCA isn't just for awards — pre-award activities (synopses, draft RFPs) that commit the Government to a $30M+ action also require submission per PIC 26-01.",
      },
      {
        id: "ro-14",
        expectation: "SAM.gov award notice posted for all contract actions >$25,000 within required timeframe",
        why: "Award notice requirements apply broadly and late postings generate GAO and IG inquiries. Subcontracting opportunity notices are separately required.",
        substantiation: "SAM.gov posting confirmation; posting date documented in contract file",
        citation: "FAR 5.301",
        fileLocation: "SAM.gov (external); NEAR FE: Synopses",
        astro: "The award notice is a separate requirement from the pre-award synopsis. Both must be posted.",
      },
    ],
  },
  {
    id: "post_award",
    label: "Post-Award Administration",
    icon: "📊",
    tier: "OFFICE",
    items: [
      {
        id: "ro-15",
        expectation: "COR is appointed via NF 1634 before award, with FAC-COR certification current and appropriate to contract complexity",
        why: "COR appointment is a statutory requirement. A COR performing duties without a current NF 1634 on file creates unauthorized commitment risk.",
        substantiation: "Executed NF 1634; FAC-COR certificate; copies distributed to COR, contractor, and contract admin office",
        citation: "NFS CG 1801.42; FAR 1.404",
        fileLocation: "NEAR FE: COR Delegation",
        astro: "Level III FAC-COR is required for the most complex, mission-critical contracts. The CO must justify the level selection on the NF 1634.",
      },
      {
        id: "ro-16",
        expectation: "CPARS past performance evaluations are current, submitted on schedule, and include substantive narrative",
        why: "Late or missing CPARS is one of the top recurring findings in NASA procurement reviews. It directly affects contractors' ability to compete on future contracts.",
        substantiation: "CPARS entries within 120 days of performance period end (interim); final evaluation at completion",
        citation: "FAR 42.1102; NFS CG 1842.111",
        fileLocation: "CPARS (external); NFS CG 1842.111",
        astro: "Interim evaluations are required for contracts with periods longer than one year, within 120 days of each anniversary. Not just at completion.",
      },
      {
        id: "ro-17",
        expectation: "NF 533 reports are being submitted and reviewed monthly or quarterly per contract requirements",
        why: "NF 533 is the primary cost/schedule reporting tool for cost-type contracts. Missing or unreviewed NF 533s indicate inadequate contract surveillance.",
        substantiation: "NF 533 submissions in NEAR; COR review documentation",
        citation: "NFS CG 1842.7; NFS CG Appendix A",
        fileLocation: "NEAR FE: NF 533 Reports",
        astro: "The COR must review and sign off on NF 533s, not just file them. Unreviewed reports suggest the office isn't actively monitoring cost performance.",
      },
    ],
  },
  {
    id: "hq_readiness",
    label: "HQ Review Readiness",
    icon: "🎯",
    tier: "HQ",
    items: [
      {
        id: "ro-18",
        expectation: "Every contract file has a clear, logical story: requirement → market research → strategy → solicitation → evaluation → award",
        why: "HQ reviewers look for a coherent narrative. A file where the strategy doesn't match the award, or the market research doesn't support the competition approach, will generate findings regardless of technical compliance.",
        substantiation: "File review against the acquisition lifecycle; PSM → J&A → solicitation → PNM → award alignment check",
        citation: "FAR 1.102; NFS CG 1807",
        fileLocation: "Complete contract file",
        astro: "If you can't explain why each decision was made using the documents in the file, the file isn't ready for review.",
      },
      {
        id: "ro-19",
        expectation: "The office has a current, reconciled contract portfolio — no phantom contracts, outdated values, or unexercised options past their exercise dates",
        why: "Portfolio accuracy is a Branch Chief and HCA responsibility. Stale data creates compliance risk and undermines leadership reporting.",
        substantiation: "FPDS-NG reconciliation; NEAR milestone currency; expired option review",
        citation: "FAR 4.604; NFS CG 1804.31",
        fileLocation: "FPDS-NG; NEAR; branch tracking system",
        astro: "Options that pass their exercise date without action or documentation are a recurring review finding. Calendar them early.",
      },
      {
        id: "ro-20",
        expectation: "Data call responses for $10M+ acquisitions (acquisition directive assessments) are accurate, documented, and can be substantiated from the contract file",
        why: "HQ data calls are increasingly cross-referenced against FPDS and NEAR data. Responses that can't be supported by the file create credibility problems.",
        substantiation: "Data call responses with file references; FFP feasibility, simplification, and incentive structure assessments",
        citation: "NASA Acquisition Directive; NFS CG 1807.14",
        fileLocation: "Contract file; branch data call tracker",
        astro: "CPAS captures the data that answers most acquisition directive questions at intake — contract type, competition strategy, simplification rationale. Less manual work if the file is current.",
      },
    ],
  },
];

const TIER_LABELS = { CO:"CO-Level", OFFICE:"Office-Level", HQ:"HQ Review" };
const TIER_COLORS = {
  CO:    { bg:"#dbeafe", text:"#1e40af" },
  OFFICE:{ bg:"#ede9fe", text:"#5b21b6" },
  HQ:    { bg:"#fce7f3", text:"#9d174d" },
};
const STATUS_OPTIONS = ["not_started","in_progress","ready","na"];
const STATUS_LABELS  = { not_started:"Not Started", in_progress:"In Progress", ready:"Ready", na:"N/A" };
const STATUS_COLORS  = {
  not_started:{ bg:"#f1f5f9", text:"#64748b" },
  in_progress:{ bg:"#fef3c7", text:"#92400e" },
  ready:      { bg:"#dcfce7", text:"#166534" },
  na:         { bg:"#f1f5f9", text:"#94a3b8" },
};

export default function OfficeReadiness({ onClose }) {
  const STORAGE_KEY = "cpas_office_readiness";

  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY + "_notes") || "{}"); }
    catch { return {}; }
  });
  const [activeSection, setActiveSection] = useState("file_org");
  const [expandedItem, setExpandedItem] = useState(null);
  const [filterTier, setFilterTier] = useState("");

  function setStatus(id, val) {
    const next = { ...statuses, [id]: val };
    setStatuses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function setNote(id, val) {
    const next = { ...notes, [id]: val };
    setNotes(next);
    localStorage.setItem(STORAGE_KEY + "_notes", JSON.stringify(next));
  }

  const allItems = SECTIONS.flatMap(s => s.items);
  const readyCount = allItems.filter(i => statuses[i.id] === "ready" || statuses[i.id] === "na").length;
  const totalCount = allItems.length;
  const pct = Math.round((readyCount / totalCount) * 100);

  const visibleSections = filterTier
    ? SECTIONS.filter(s => s.tier === filterTier)
    : SECTIONS;

  const activeS = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,20,40,0.5)",
      zIndex:900, display:"flex", alignItems:"flex-start", justifyContent:"center",
      paddingTop:32, overflow:"auto" }}>
      <div style={{ background:C.bg, borderRadius:12, width:"min(1020px,96vw)",
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 20px 60px rgba(11,61,145,0.2)", fontFamily:FONT }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid "+C.border,
          background:"linear-gradient(135deg,#f0f4ff,#fff)", borderRadius:"12px 12px 0 0",
          display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ background:C.navy, color:"#fff", borderRadius:6,
                padding:"4px 10px", fontSize:10, fontWeight:600, letterSpacing:"1px" }}>
                OFFICE READINESS CONSOLE
              </div>
              <div style={{ fontSize:11, color:C.muted }}>
                What good looks like — not a compliance score
              </div>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:6 }}>
              Practical guide for HQ review preparation and file review readiness
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:700, color: pct===100 ? C.green : C.navy }}>
                {pct}%
              </div>
              <div style={{ fontSize:10, color:C.muted }}>{readyCount}/{totalCount} items</div>
              <div style={{ marginTop:4, width:80, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:pct+"%", height:"100%", background:pct===100?C.green:C.navy, borderRadius:2, transition:"width 0.3s" }}/>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none",
              fontSize:20, cursor:"pointer", color:C.muted }}>×</button>
          </div>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* Section sidebar */}
          <div style={{ width:210, borderRight:"1px solid "+C.border, padding:"10px 0",
            overflowY:"auto", flexShrink:0, background:C.bg2 }}>

            {/* Tier filter */}
            <div style={{ padding:"0 12px 10px", borderBottom:"1px solid "+C.border, marginBottom:8 }}>
              <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.7px", marginBottom:6 }}>FILTER BY TIER</div>
              {["","CO","OFFICE","HQ"].map(t => (
                <button key={t} onClick={() => setFilterTier(t)} style={{
                  display:"block", width:"100%", padding:"5px 8px", marginBottom:2,
                  background: filterTier===t ? C.light : "none",
                  border:"none", borderRadius:5, cursor:"pointer", textAlign:"left",
                  fontSize:11, color: filterTier===t ? C.navy : C.muted,
                  fontWeight: filterTier===t ? 600 : 400,
                }}>
                  {t === "" ? "All Areas" : TIER_LABELS[t]}
                </button>
              ))}
            </div>

            {visibleSections.map(sec => {
              const secItems = sec.items;
              const secReady = secItems.filter(i => statuses[i.id]==="ready"||statuses[i.id]==="na").length;
              const secPct = Math.round((secReady/secItems.length)*100);
              const isActive = activeSection === sec.id;
              return (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                  display:"block", width:"100%", padding:"9px 12px",
                  background: isActive ? C.light : "none",
                  border:"none", borderLeft:"3px solid "+(isActive?C.navy:"transparent"),
                  cursor:"pointer", textAlign:"left",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:11, fontWeight:isActive?600:400,
                      color:isActive?C.navy:C.text, lineHeight:1.3 }}>
                      {sec.icon} {sec.label}
                    </div>
                    <div style={{ fontSize:10, color:secPct===100?C.green:C.muted, fontWeight:500, marginLeft:4 }}>
                      {secPct===100 ? "✓" : secReady+"/"+secItems.length}
                    </div>
                  </div>
                  <div style={{ marginTop:4, height:2, background:C.border, borderRadius:1, overflow:"hidden" }}>
                    <div style={{ width:secPct+"%", height:"100%",
                      background:secPct===100?C.green:C.navy, transition:"width 0.3s" }}/>
                  </div>
                  <div style={{ marginTop:3 }}>
                    <span style={{ fontSize:9, padding:"1px 5px", borderRadius:8,
                      background:TIER_COLORS[sec.tier].bg, color:TIER_COLORS[sec.tier].text }}>
                      {TIER_LABELS[sec.tier]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Items area */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>
              {activeS.icon} {activeS.label}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:16 }}>
              {activeS.items.filter(i=>statuses[i.id]==="ready"||statuses[i.id]==="na").length} of {activeS.items.length} items ready
            </div>

            {activeS.items.map(item => {
              const st = statuses[item.id] || "not_started";
              const stc = STATUS_COLORS[st];
              const isExpanded = expandedItem === item.id;
              return (
                <div key={item.id} style={{
                  marginBottom:10, borderRadius:8, border:"1px solid "+C.border,
                  background: st==="ready" ? C.greenBg : C.bg,
                  overflow:"hidden",
                }}>
                  {/* Item header */}
                  <div style={{ padding:"12px 14px", display:"flex", alignItems:"flex-start", gap:12,
                    cursor:"pointer" }} onClick={() => setExpandedItem(isExpanded ? null : item.id)}>

                    {/* Status selector */}
                    <select value={st}
                      onChange={e => { e.stopPropagation(); setStatus(item.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize:11, padding:"3px 6px", borderRadius:6,
                        border:"1px solid "+C.border, background:stc.bg, color:stc.text,
                        fontFamily:FONT, flexShrink:0, cursor:"pointer" }}>
                      {STATUS_OPTIONS.map(o => (
                        <option key={o} value={o}>{STATUS_LABELS[o]}</option>
                      ))}
                    </select>

                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color: st==="ready"?"#2a7a55":C.text,
                        fontWeight:500, lineHeight:1.4 }}>
                        {item.expectation}
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:5, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, padding:"2px 7px", borderRadius:10,
                          background:"#e8f0fe", color:C.blue }}>{item.citation}</span>
                        <span style={{ fontSize:10, color:C.muted }}>{item.fileLocation}</span>
                      </div>
                    </div>

                    <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ borderTop:"1px solid "+C.border, padding:"14px 14px 14px 14px",
                      background:"#fafbfd" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                        <div>
                          <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.6px",
                            textTransform:"uppercase", marginBottom:4 }}>Why It Matters</div>
                          <div style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{item.why}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.6px",
                            textTransform:"uppercase", marginBottom:4 }}>Required Substantiation</div>
                          <div style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{item.substantiation}</div>
                        </div>
                      </div>

                      {/* Astro tip */}
                      <div style={{ background:"#FFFDE7", border:"1px solid #f0d080",
                        borderRadius:6, padding:"8px 12px", marginBottom:12,
                        fontSize:11, color:"#5a4000", fontFamily:"Tahoma, sans-serif" }}>
                        🚀 <em>{item.astro}</em>
                      </div>

                      {/* Notes field */}
                      <div>
                        <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.6px",
                          textTransform:"uppercase", marginBottom:4 }}>Notes / File Location</div>
                        <textarea
                          value={notes[item.id] || ""}
                          onChange={e => setNote(item.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          placeholder="Add notes, file paths, or action items..."
                          style={{ width:"100%", padding:"8px 10px", borderRadius:6,
                            border:"1px solid "+C.border, fontSize:12, fontFamily:FONT,
                            resize:"vertical", minHeight:60, background:"#fff",
                            color:C.text, boxSizing:"border-box" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 20px", borderTop:"1px solid "+C.border,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:C.bg2, borderRadius:"0 0 12px 12px", fontSize:11, color:C.muted }}>
          <span>Status and notes persist for this browser. Advisory only — not a compliance scoring system.</span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => {
              if (window.confirm("Reset all Office Readiness statuses and notes?")) {
                setStatuses({}); setNotes({});
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(STORAGE_KEY + "_notes");
              }
            }} style={{ padding:"5px 12px", borderRadius:6, fontSize:11, cursor:"pointer",
              background:"none", border:"1px solid "+C.border, color:C.muted, fontFamily:FONT }}>
              Reset
            </button>
            <button onClick={onClose} style={{ padding:"5px 14px", borderRadius:6, fontSize:11,
              cursor:"pointer", background:C.navy, color:"#fff", border:"none", fontFamily:FONT }}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
