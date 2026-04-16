import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// ASTRO — CPAS Procurement Mission Support Assistant
// Quiet, technically sharp, mission-support oriented.
// Context-aware tips keyed to current CPAS screen/module.
// ─────────────────────────────────────────────────────────────

const TIPS = {
  INTAKE: [
    { id:"intake-1", text:"Mission support note: estimated value controls approval thresholds, ANOSCA triggers, subcontracting plan requirements, and J&A approval chain. A rough estimate here creates rework downstream." },
    { id:"intake-2", text:"NAICS selection drives size standards and set-aside eligibility. Pick the code that best describes the principal purpose of the acquisition, not just a close match." },
    { id:"intake-3", text:"Sole source? You'll need a JOFOC approved before solicitation. Approval level is determined by value — the roadmap will flag the right chain." },
    { id:"intake-4", text:"Quiet check: contract type selection affects risk allocation, payment structure, and clause prescriptions throughout. If you're uncertain between FFP and cost-type, the Acquisition Coach can help." },
  ],
  ROADMAP: [
    { id:"road-1", text:"Each roadmap step includes a FAR/NFS citation. The roadmap is advisory — your CO judgment governs. Steps can be completed out of order when your acquisition warrants it." },
    { id:"road-2", text:"Two separate HQ notification requirements: $7M or above requires HQ public announcement via NPA template (NFS 1805.302 / NFS CG 1805.32). $30M or above requires the ANOSCA application. They are not the same process — both thresholds must be tracked independently." },
    { id:"road-3", text:"Worth confirming: the PSM approval level at your estimated value. NFS CG 1807.11 governs thresholds — confirm your center's actual delegation before routing." },
    { id:"road-4", text:"Holding orbit while you work through the phases. Click any step to expand it and access document generation, checklists, and citations." },
  ],
  JOFOC: [
    { id:"jofoc-1", text:"Before you proceed: verify the J&A approval chain. At $12M, approval rests with the Competition Advocate per FAR 6.304(a)(2). Confirm this matches your center's current delegation." },
    { id:"jofoc-2", text:"Section 5 (demonstration that authority applies) receives the most scrutiny in any HQ review. Specific, factual, contractor-agnostic language holds up better than broad characterizations." },
    { id:"jofoc-3", text:"File note: the JOFOC must be approved before solicitation — not concurrent with it. Routing takes time. Build that into your acquisition timeline." },
  ],
  ACQ_PLAN: [
    { id:"psm-1", text:"PSM Section 6 (Risk): Safety risk for flight operations should be rated High with substantive mitigation. A Low rating will draw HQ questions." },
    { id:"psm-2", text:"Section 9 (Small Business): Rule of Two analysis must be documented even when the result is that the requirement can't be set aside. The analysis itself is required, not just the outcome." },
    { id:"psm-3", text:"Worth confirming: PSM approval at your estimated value. HCA or one level above CO, per NFS CG 1807.11. Confirm center delegation before routing." },
  ],
  IGCE: [
    { id:"igce-1", text:"IGCE should be based on market research — not the contractor's prior pricing alone. GSA Advantage, SAM.gov, and comparable awards in FPDS-NG are all valid sources." },
    { id:"igce-2", text:"For IDIQ contracts, the IGCE should address both the minimum guaranteed amount and the maximum ceiling. Both figures appear in the solicitation." },
    { id:"igce-3", text:"Quiet check: the IGCE is signed by the requiring official, not the CO. If the CO prepared it, document the basis carefully — it's a common review finding." },
  ],
  CLAUSE_MATRIX: [
    { id:"clause-1", text:"Clause prescriptions reflect current FAC 2025-06 thresholds and active PCDs through 26-03A. Verify any clause flagged TRANSITIONAL — those reflect unresolved tension between RFO FAR and codified FAR." },
    { id:"clause-2", text:"File note: 1852.215-84 (Ombudsman) is required in all competitive NASA solicitations. It's easy to overlook during manual edits." },
    { id:"clause-3", text:"RFO FAR deleted several legacy clauses. If you're modifying an older contract, some clauses need removal rather than update. The matrix flags these." },
  ],
  ANOSCA: [
    { id:"anosca-1", text:"Public announcement threshold is $7M or more per PIC 26-01. ANOSCA submission threshold is $30M or more. Two separate requirements, two separate triggers." },
    { id:"anosca-2", text:"ANOSCA submissions go through the Procurement Officer before HQ. Build routing time into your schedule — HQ review can take weeks for complex actions." },
  ],
  NEAR: [
    { id:"near-1", text:"NEAR file structure maps to NFS contract file requirements. FE numbers in the generated documents correspond to the correct NEAR folder locations." },
    { id:"near-2", text:"File note: required documents that are not yet in NEAR should be flagged as pending before the contract file is considered complete for review purposes." },
  ],
  ATTACHMENTS: [
    { id:"attach-1", text:"Attachments builder generates the standard package structure. Section H provisions for contractor-owned aircraft and ITAR controls are included when triggered by acquisition parameters." },
    { id:"attach-2", text:"Quiet check: Section J (list of attachments) must be complete and accurate before solicitation. Missing attachments are a common pre-award deficiency finding." },
  ],
  REVIEW: [
    { id:"review-1", text:"Document review checks structure and completeness — not legal sufficiency. Legal review is a separate step and should be coordinated through your center Counsel." },
    { id:"review-2", text:"Steady inputs make better outputs. The reviewer will flag inconsistencies between sections — a value in Section 2 that doesn't match Section 7, for example." },
  ],
  ROUTE: [
    { id:"route-1", text:"The Acquisition Coach recommends a strategy based on your inputs. It's advisory. Your CO judgment and knowledge of program circumstances governs the final approach." },
    { id:"route-2", text:"Mission support note: the Coach considers commercial vs. non-commercial determination, dollar thresholds, competition strategy, and contract type in building its recommendation." },
  ],
  SEARCH: [
    { id:"search-1", text:"Regulatory search draws from the CPAS knowledge base: RFO FAR (March 2026), NFS (April 2026), active PCDs, PICs, and PNs. Results are ranked by regulatory priority." },
    { id:"search-2", text:"Search by section number (e.g., '1805.302'), topic (e.g., 'ANOSCA'), or document type (e.g., 'PCD 25-10'). The system searches section headings and content." },
  ],
  general: [
    { id:"gen-1", text:"CPAS generates draft documents. Every output is a starting point for your review and professional judgment — not a final product." },
    { id:"gen-2", text:"Quiet check: acquisition parameters set at intake drive everything downstream. If something looks off in a generated document, the answer is usually back in the intake fields." },
    { id:"gen-3", text:"Mission support standing by. Click any section in the header to navigate. Click me to cycle tips for the current module." },
  ],
};

// ─── Resolve Astro context from App.jsx screen/modal state ───
export function resolveAstroContext({ screen, showClauseMatrix, showAttachments, showRegSearch, showTechEval, activeStep }) {
  if (showClauseMatrix) return "CLAUSE_MATRIX";
  if (showAttachments) return "ATTACHMENTS";
  if (showRegSearch) return "SEARCH";
  if (activeStep?.docType === "JOFOC") return "JOFOC";
  if (activeStep?.docType === "ACQ_PLAN") return "ACQ_PLAN";
  if (activeStep?.docType === "IGCE") return "IGCE";
  if (activeStep?.docType === "ANOSCA") return "ANOSCA";
  if (screen === "ROADMAP") return "ROADMAP";
  if (screen === "NEAR") return "NEAR";
  if (screen === "REVIEW") return "REVIEW";
  if (screen === "ROUTE") return "ROUTE";
  if (screen === "INTAKE") return "INTAKE";
  return "general";
}

// ─── Astronaut SVG ────────────────────────────────────────────
function AstroSVG({ mood, onClick }) {
  const uid = useRef("av" + Math.random().toString(36).slice(2, 7)).current;
  return (
    <svg width="84" height="104" viewBox="0 0 84 104" onClick={onClick}
      style={{ cursor:"pointer", filter:"drop-shadow(0 4px 12px rgba(11,61,145,0.5))", display:"block" }}>
      <defs>
        <radialGradient id={uid+"halo"} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={uid+"visor"} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a237e"/>
          <stop offset="45%" stopColor="#0B3D91"/>
          <stop offset="100%" stopColor="#4FC3F7">
            <animate attributeName="stopColor" values="#4FC3F7;#81D4FA;#29B6F6;#4FC3F7" dur="4s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>
        <linearGradient id={uid+"suit"} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0F4FF"/>
          <stop offset="100%" stopColor="#D8E2F0"/>
        </linearGradient>
        <filter id={uid+"glow"}>
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Subtle halo */}
      <ellipse cx="42" cy="85" rx="30" ry="8" fill={`url(#${uid}halo)`}/>

      {/* Jetpacks */}
      <rect x="22" y="50" width="7" height="18" rx="3" fill="#8B9DB5"/>
      <rect x="55" y="50" width="7" height="18" rx="3" fill="#8B9DB5"/>
      {/* Jetpack highlights */}
      <rect x="23" y="51" width="2" height="6" rx="1" fill="rgba(255,255,255,0.3)"/>
      <rect x="56" y="51" width="2" height="6" rx="1" fill="rgba(255,255,255,0.3)"/>
      {/* Flames */}
      <ellipse cx="25.5" cy="70" rx="2.5" ry="4" fill="#FF6B35" opacity="0.9">
        <animate attributeName="ry" values="4;7;3;6;4" dur="0.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.6;0.9;0.5;0.9" dur="0.7s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="58.5" cy="70" rx="2.5" ry="4" fill="#FF6B35" opacity="0.9">
        <animate attributeName="ry" values="4;6;4;7;4" dur="0.7s" repeatCount="indefinite" begin="0.15s"/>
        <animate attributeName="opacity" values="0.9;0.5;0.9;0.6;0.9" dur="0.7s" repeatCount="indefinite" begin="0.15s"/>
      </ellipse>
      {/* Flame glow */}
      <ellipse cx="25.5" cy="72" rx="3" ry="3" fill="#FFD54F" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.7s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="58.5" cy="72" rx="3" ry="3" fill="#FFD54F" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.7s" repeatCount="indefinite" begin="0.15s"/>
      </ellipse>

      {/* Body */}
      <ellipse cx="42" cy="62" rx="18" ry="20" fill={`url(#${uid}suit)`} stroke="#BDC8DC" strokeWidth="1"/>
      {/* Body shading */}
      <ellipse cx="36" cy="56" rx="6" ry="8" fill="rgba(255,255,255,0.2)"/>

      {/* NASA badge on chest */}
      <ellipse cx="42" cy="56" rx="10" ry="6.5" fill="#0B3D91" stroke="#1a5aaa" strokeWidth="0.5"/>
      <text x="42" y="59" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold"
        fontFamily="Arial, sans-serif" letterSpacing="0.5">NASA</text>

      {/* Left arm */}
      <g style={{ transformOrigin:"20px 54px" }}>
        <ellipse cx="20" cy="60" rx="6" ry="9" fill={`url(#${uid}suit)`} stroke="#BDC8DC" strokeWidth="1"/>
        <circle cx="18" cy="70" r="5" fill="#C8D4E8" stroke="#9AAFC8" strokeWidth="0.5"/>
        {mood === "wave" && (
          <animateTransform attributeName="transform" type="rotate"
            values="0 20 54;-25 20 54;5 20 54;-25 20 54;0 20 54"
            dur="1.2s" repeatCount="2"/>
        )}
        {mood === "thumbsup" && (
          <animateTransform attributeName="transform" type="rotate"
            values="0 20 54;-30 20 54;0 20 54"
            dur="0.6s" repeatCount="3"/>
        )}
      </g>

      {/* Right arm */}
      <g style={{ transformOrigin:"64px 54px" }}>
        <ellipse cx="64" cy="60" rx="6" ry="9" fill={`url(#${uid}suit)`} stroke="#BDC8DC" strokeWidth="1"/>
        <circle cx="66" cy="70" r="5" fill="#C8D4E8" stroke="#9AAFC8" strokeWidth="0.5"/>
        {mood === "thumbsup" && (
          <animateTransform attributeName="transform" type="rotate"
            values="0 64 54;20 64 54;0 64 54"
            dur="0.6s" repeatCount="3"/>
        )}
      </g>

      {/* Legs */}
      <rect x="33" y="78" width="7" height="13" rx="3.5" fill={`url(#${uid}suit)`} stroke="#BDC8DC" strokeWidth="1"/>
      <rect x="44" y="78" width="7" height="13" rx="3.5" fill={`url(#${uid}suit)`} stroke="#BDC8DC" strokeWidth="1"/>
      {/* Boots */}
      <ellipse cx="36.5" cy="93" rx="6.5" ry="4" fill="#6B7F99" stroke="#5A6E88" strokeWidth="0.5"/>
      <ellipse cx="47.5" cy="93" rx="6.5" ry="4" fill="#6B7F99" stroke="#5A6E88" strokeWidth="0.5"/>

      {/* Helmet */}
      <circle cx="42" cy="28" r="21" fill={`url(#${uid}suit)`} stroke="#BDC8DC" strokeWidth="1.5"/>
      {/* Helmet ring */}
      <ellipse cx="42" cy="46" rx="13" ry="3.5" fill="#C8D4E8" stroke="#9AAFC8" strokeWidth="0.5"/>

      {/* Visor */}
      <ellipse cx="42" cy="28" rx="15" ry="14" fill={`url(#${uid}visor)`} stroke="#4a6080" strokeWidth="0.8"/>
      {/* Visor frame */}
      <ellipse cx="42" cy="28" rx="15" ry="14" fill="none" stroke="rgba(79,195,247,0.3)" strokeWidth="1.5"/>

      {/* Visor shine */}
      <ellipse cx="35" cy="22" rx="5" ry="2.5" fill="rgba(255,255,255,0.25)" transform="rotate(-20 35 22)">
        <animate attributeName="opacity" values="0.25;0.45;0.25" dur="5s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="50" cy="34" rx="2" ry="1" fill="rgba(255,255,255,0.12)">
        <animate attributeName="opacity" values="0.12;0.22;0.12" dur="5s" repeatCount="indefinite" begin="2.5s"/>
      </ellipse>

      {/* Antenna */}
      <line x1="42" y1="7" x2="42" y2="1.5" stroke="#8B9DB5" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="42" cy="1" r="2.5" fill="#FC3D21" filter={`url(#${uid}glow)`}>
        <animate attributeName="fill" values="#FC3D21;#FF6B35;#FC3D21" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="r" values="2.5;3.2;2.5" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

// ─── Speech Bubble ────────────────────────────────────────────
function AstroBubble({ tip, onClose, onDismiss }) {
  return (
    <div style={{
      position:"absolute",
      bottom:"114px",
      right:"0",
      width:"290px",
      background:"#FFFDE7",
      border:"2px solid #333",
      borderRadius:"5px",
      padding:"14px 16px 12px",
      boxShadow:"4px 4px 0 #333, inset 0 0 0 1px #E8E0A8",
      fontFamily:"Tahoma, 'MS Sans Serif', Geneva, sans-serif",
      fontSize:"12px",
      lineHeight:"1.6",
      color:"#2a2a2a",
      zIndex:1001,
      animation:"astroPop 0.2s ease-out",
    }}>
      <style>{`
        @keyframes astroPop {
          0% { transform: scale(0.85) translateY(8px); opacity: 0; }
          60% { transform: scale(1.02); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Tail */}
      <div style={{ position:"absolute", bottom:"-13px", right:"28px",
        width:0, height:0,
        borderLeft:"10px solid transparent", borderRight:"10px solid transparent",
        borderTop:"13px solid #333" }}/>
      <div style={{ position:"absolute", bottom:"-9px", right:"30px",
        width:0, height:0,
        borderLeft:"8px solid transparent", borderRight:"8px solid transparent",
        borderTop:"10px solid #FFFDE7" }}/>

      {/* Close */}
      <button onClick={onClose} style={{
        position:"absolute", top:"5px", right:"7px",
        background:"none", border:"none", fontSize:"15px",
        cursor:"pointer", color:"#888", padding:"2px 5px", lineHeight:1,
        fontFamily:"Tahoma, sans-serif",
      }}>×</button>

      <p style={{ margin:"0 16px 10px 0", fontSize:"12px" }}>{tip.text}</p>

      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderTop:"1px solid #E0D98A", paddingTop:"8px",
      }}>
        <label style={{
          fontSize:"10px", color:"#777", cursor:"pointer",
          display:"flex", alignItems:"center", gap:"5px",
        }}>
          <input type="checkbox" onChange={onDismiss}
            style={{ margin:0, cursor:"pointer", accentColor:"#0B3D91" }}/>
          Don't show this tip again
        </label>
        <span style={{ fontSize:"9px", color:"#aaa", letterSpacing:"0.5px" }}>
          ASTRO
        </span>
      </div>
    </div>
  );
}

// ─── Main Astro Component ─────────────────────────────────────
export default function AstroAssistant({ context = "general", onComplete, triggerAward = false }) {
  const [enabled, setEnabled] = useState(() => {
    const v = localStorage.getItem("cpas_astro_enabled");
    return v === null ? true : v === "true";
  });
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("cpas_astro_dismissed") || "[]")); }
    catch { return new Set(); }
  });
  const [showBubble, setShowBubble] = useState(true);
  const [tipIdx, setTipIdx] = useState(0);
  const [mood, setMood] = useState("idle");
  const [floatY, setFloatY] = useState(0);
  const [showToggle, setShowToggle] = useState(false);
  const rafRef = useRef(null);
  const prevContext = useRef(context);

  // Floating animation
  useEffect(() => {
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      setFloatY(Math.sin((ts - start) / 1100) * 5);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Wave when context changes
  useEffect(() => {
    if (context !== prevContext.current) {
      prevContext.current = context;
      setTipIdx(0);
      setShowBubble(true);
      setMood("wave");
      const t = setTimeout(() => setMood("idle"), 2000);
      return () => clearTimeout(t);
    }
  }, [context]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("cpas_astro_enabled", String(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem("cpas_astro_dismissed", JSON.stringify([...dismissed]));
  }, [dismissed]);

  // Award easter egg — triggered by parent when P6S5 completes
  useEffect(() => {
    if (!triggerAward) return;
    setMood("thumbsup");
    setTip({
      id: "award-complete",
      text: "Contract awarded. File secured. Good work, CO. Mission support standing by for the next one.",
    });
    // Pulse antenna 3 times then return to idle
    const t = setTimeout(() => { setMood("idle"); }, 5000);
    return () => clearTimeout(t);
  }, [triggerAward]);

  // Get tips for current context, minus dismissed
  const allTips = [...(TIPS[context] || []), ...TIPS.general].filter(t => !dismissed.has(t.id));
  const tip = allTips[tipIdx % Math.max(allTips.length, 1)];

  function handleClick() {
    if (!showBubble && tip) {
      setShowBubble(true);
      setTipIdx(i => i + 1);
      setMood("wave");
      setTimeout(() => setMood("idle"), 1200);
    } else {
      setShowBubble(false);
    }
  }

  function handleDismiss() {
    if (tip) setDismissed(prev => new Set([...prev, tip.id]));
    setShowBubble(false);
  }

  if (!enabled) {
    return (
      <div style={{ position:"fixed", bottom:20, right:20, zIndex:1000 }}>
        <button onClick={() => setEnabled(true)} style={{
          background:"rgba(11,61,145,0.08)", border:"1px solid rgba(11,61,145,0.2)",
          borderRadius:"50%", width:36, height:36, cursor:"pointer",
          fontSize:16, color:"#0B3D91", display:"flex", alignItems:"center",
          justifyContent:"center",
        }} title="Show Astro">🚀</button>
      </div>
    );
  }

  return (
    <div style={{
      position:"fixed", bottom:16, right:20, zIndex:1000,
      transform:`translateY(${floatY}px)`,
      transition:"transform 0.05s linear",
    }}>
      {/* Tip bubble */}
      {showBubble && tip && (
        <AstroBubble
          tip={tip}
          onClose={() => setShowBubble(false)}
          onDismiss={handleDismiss}
        />
      )}

      {/* Toggle menu — appears on right-click / long-press */}
      {showToggle && (
        <div style={{
          position:"absolute", bottom:"110px", right:0,
          background:"#fff", border:"1px solid #ddd", borderRadius:6,
          boxShadow:"0 4px 16px rgba(0,0,0,0.1)", padding:"6px 0",
          minWidth:"160px", fontSize:12, zIndex:1002,
        }}>
          <button onClick={() => { setEnabled(false); setShowToggle(false); }} style={{
            display:"block", width:"100%", padding:"7px 14px",
            background:"none", border:"none", cursor:"pointer",
            textAlign:"left", color:"#444", fontFamily:"inherit",
          }}>Hide Astro</button>
          <button onClick={() => {
            setDismissed(new Set());
            setTipIdx(0);
            setShowBubble(true);
            setShowToggle(false);
          }} style={{
            display:"block", width:"100%", padding:"7px 14px",
            background:"none", border:"none", cursor:"pointer",
            textAlign:"left", color:"#444", fontFamily:"inherit",
          }}>Reset dismissed tips</button>
        </div>
      )}

      {/* Astro character */}
      <div
        onClick={handleClick}
        onContextMenu={e => { e.preventDefault(); setShowToggle(v => !v); }}
        style={{ position:"relative" }}
      >
        {/* Subtle glow ring */}
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%, -50%)",
          width:90, height:90, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(79,195,247,0.12) 0%, transparent 70%)",
          pointerEvents:"none",
        }}/>
        <AstroSVG mood={mood} onClick={() => {}}/>
      </div>

      {/* Label */}
      <div style={{
        textAlign:"center", fontSize:"9px", color:"#6b7a99",
        letterSpacing:"1.5px", marginTop:2, fontFamily:"monospace",
        userSelect:"none",
      }}>ASTRO</div>
    </div>
  );
}
