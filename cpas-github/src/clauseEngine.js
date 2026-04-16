// ═══════════════════════════════════════════════════════════════════
// CPAS CLAUSE ENGINE
// Deterministic FAR/NFS clause prescriber
// Given contract parameters → outputs required/conditional/optional clauses
// with fill-in values and alternates
// ═══════════════════════════════════════════════════════════════════

// ── Prescription rule helpers ─────────────────────────────────────
// Each clause has a `req` function: (params) => "REQUIRED" | "CONDITIONAL" | "OPTIONAL" | null
// null = does not apply

const V = {
  SAT:      350000,  // FAC 2025-06
  MICRO:    15000,   // FAC 2025-06
  SB_TEST:  150000,
  TINA:     2500000, // FAC 2025-06
  CAS:      2000000,
  AUDIT:    750000,
  COST_ACC: 750000,
};

// ── Master clause library ─────────────────────────────────────────
// Format: { num, title, req(p), alternates[], fillIns[], note, farRef }
// p = { value, isCommercial, contractType, setAside, reqType,
//       isConstruction, isRD, center, isRCPO, pop, isRecompete,
//       hasOptions, isCostType, isTM, isFFP, isMac, isIdiq, isBpa,
//       isServicesContract, isSCA, hasSubcontracting }

export const CLAUSE_LIBRARY = [

  // ════════════════════════════════════════════════════════════════
  // COMMERCIAL ITEM CLAUSES (FAR 52.212-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.212-1",
    title: "Instructions to Offerors—Commercial Products and Commercial Services",
    farRef: "FAR 12.301(b)(1)",
    req: (p) => p.isCommercial === "YES" ? "REQUIRED" : null,
    alternates: [],
    fillIns: [],
    note: "Used in lieu of Section L for commercial acquisitions. Addenda may be added.",
  },
  {
    num: "52.212-2",
    title: "Evaluation—Commercial Products and Commercial Services",
    farRef: "FAR 12.301(c)",
    req: (p) => p.isCommercial === "YES" && p.value > 350000 ? "REQUIRED" : null, // SAT updated to $350K per FAC 2025-06
    alternates: [],
    fillIns: [
      { id: "eval_factors", label: "Evaluation factors (paragraph (a))", placeholder: "Technical capability, past performance, price" },
    ],
    note: "Fill in evaluation factors in paragraph (a). If LPTA, state accordingly.",
  },
  {
    num: "52.212-3",
    title: "Offeror Representations and Certifications—Commercial Products and Commercial Services",
    farRef: "FAR 12.301(b)(2)",
    req: (p) => p.isCommercial === "YES" ? "CONDITIONAL" : null,
    alternates: ["Alt I — when agency has issued class deviation for SAM.gov reps"],
    fillIns: [],
    note: "TRANSITIONAL — RFO FAR Part 12 (PCD 25-23A) DELETES this clause; the RFO removes it because offeror reps/certs are fully captured in SAM.gov. Codified FAR (48 CFR) still retains it. NASA COs following the RFO per active PCDs should NOT include this clause — offerors complete reps/certs in SAM.gov. CO must verify current NASA guidance before including.",
  },
  {
    num: "52.212-4",
    title: "Contract Terms and Conditions—Commercial Products and Commercial Services",
    farRef: "FAR 12.301(b)(3)",
    req: (p) => p.isCommercial === "YES" ? "REQUIRED" : null,
    alternates: ["Alt I — Time-and-Material/Labor-Hour contracts"],
    fillIns: [],
    note: "Use Alt I for T&M/LH commercial contracts. Addenda for agency-specific terms.",
  },
  {
    num: "52.212-5",
    title: "Contract Terms and Conditions Required to Implement Statutes or Executive Orders—Commercial Products and Commercial Services",
    farRef: "FAR 12.301(b)(4)",
    req: (p) => p.isCommercial === "YES" ? "REQUIRED" : null,
    alternates: ["Alt I — DoD only", "Alt II — contracts with foreign sources"],
    fillIns: [
      { id: "applicable_clauses", label: "Check applicable clauses within 52.212-5", placeholder: "Check all that apply based on value, type, set-aside" },
    ],
    note: "TRANSITIONAL — RFO FAR Part 12 (PCD 25-23A) significantly restructures 52.212-5. Under the RFO, the sub-clauses listed below no longer flow through this wrapper clause — they are prescribed as standalone clauses directly in the contract. Codified FAR still uses the checklist-within-52.212-5 structure. CO must verify which structure applies based on current NASA guidance. If following RFO: include the applicable sub-clauses directly rather than checking them inside this provision.",
    subClauses: [
      { sub: "(b)(1)", clause: "52.203-6", title: "Restrictions on Subcontractor Sales", req: (p) => p.value > V.SAT },
      { sub: "(b)(2)", clause: "52.203-13", title: "Contractor Code of Business Ethics", req: (p) => p.value >= 6000000 && p.pop >= 120 },
      { sub: "(b)(3)", clause: "52.203-15", title: "Whistleblower Protections under ARRA", req: (p) => false },
      { sub: "(b)(4)", clause: "52.204-10", title: "Reporting Executive Compensation", req: (p) => p.value >= 30000 },
      { sub: "(b)(5)", clause: "52.204-14", title: "Service Contract Reporting Requirements", req: (p) => p.isServicesContract && p.value >= 500000 },
      { sub: "(b)(8)", clause: "52.209-6", title: "Protecting Gov Interest – Debarred Subcontractors", req: (p) => p.value > V.SAT },
      { sub: "(b)(9)", clause: "52.209-9", title: "Updates of Publicly Available Info re Responsibility Matters", req: (p) => p.value >= 600000 },
      { sub: "(b)(11)", clause: "52.219-3", title: "Notice of HUBZone Set-Aside", req: (p) => p.setAside === "HUBZONE" },
      { sub: "(b)(12)", clause: "52.219-4", title: "Notice of Price Evaluation Preference for HUBZone", req: (p) => p.setAside === "HUBZONE_PREF" },
      { sub: "(b)(14)", clause: "52.219-8", title: "Utilization of Small Business Concerns", req: (p) => p.value > V.SAT },
      { sub: "(b)(15)", clause: "52.219-9", title: "Small Business Subcontracting Plan", req: (p) => p.value >= 900000 && !p.isSmallBusiness },
      { sub: "(b)(17)", clause: "52.219-14", title: "Limitations on Subcontracting", req: (p) => ["SET_ASIDE","WOSB","SDVOSB","8A"].includes(p.setAside) },
      { sub: "(b)(19)", clause: "52.219-28", title: "Post-Award Small Business Program Rerepresentation", req: (p) => p.value > V.SAT },
      { sub: "(b)(22)", clause: "52.222-3", title: "Convict Labor", req: (p) => true },
      { sub: "(b)(23)", clause: "52.222-19", title: "Child Labor", req: (p) => true },
      { sub: "(b)(24)", clause: "52.222-21", title: "Prohibition on Segregated Facilities", req: (p) => p.value >= 10000 },
      { sub: "(b)(25)", clause: "52.222-26", title: "Equal Opportunity", req: (p) => p.value >= 10000 },
      { sub: "(b)(26)", clause: "52.222-35", title: "Equal Opportunity for Veterans", req: (p) => p.value >= 150000 },
      { sub: "(b)(27)", clause: "52.222-36", title: "Equal Opportunity for Workers with Disabilities", req: (p) => p.value >= 15000 },
      { sub: "(b)(28)", clause: "52.222-37", title: "Employment Reports on Veterans", req: (p) => p.value >= 150000 },
      { sub: "(b)(29)", clause: "52.222-40", title: "Notification of Employee Rights (NLRA)", req: (p) => p.value >= 10000 },
      { sub: "(b)(30)", clause: "52.222-41", title: "Service Contract Labor Standards (SCA)", req: (p) => p.isSCA },
      { sub: "(b)(33)", clause: "52.222-50", title: "Combating Trafficking in Persons", req: (p) => true },
      { sub: "(b)(34)", clause: "52.222-55", title: "Minimum Wages for Contractor Workers (EO 14026)", req: (p) => p.isSCA || p.isTM },
      { sub: "(b)(36)", clause: "52.223-18", title: "Encouraging Contractor Policy to Ban Text Messaging While Driving", req: (p) => true },
      { sub: "(b)(37)", clause: "52.225-1", title: "Buy American—Supplies", req: (p) => p.reqType === "SUPPLIES" },
      { sub: "(b)(39)", clause: "52.225-3", title: "Buy American—Free Trade Agreements", req: (p) => p.reqType === "SUPPLIES" && p.value > V.SAT },
      { sub: "(b)(43)", clause: "52.225-13", title: "Restrictions on Certain Foreign Purchases", req: (p) => true },
      { sub: "(b)(44)", clause: "52.225-26", title: "Contractors Performing Private Security Functions", req: (p) => false },
      { sub: "(b)(46)", clause: "52.232-33", title: "Payment by Electronic Funds Transfer—SAM", req: (p) => true },
      { sub: "(b)(48)", clause: "52.239-1", title: "Privacy or Security Safeguards", req: (p) => p.reqType === "IT" },
      { sub: "(b)(50)", clause: "52.247-64", title: "Preference for Privately Owned U.S.-Flag Commercial Vessels", req: (p) => p.reqType === "SUPPLIES" },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // 8(a) COMPETITION NOTIFICATION
  // NOTE: FAR 52.206-1 and old FAR 6.305 NO LONGER EXIST in the current FAR.
  // Current prescription: FAR 19.108-10(d) → 52.219-18
  // NASA prescription:    NFS 1819.108-70(d) → 1852.219-18 (in lieu of / with FAR clause)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.219-18",
    title: "Notification of Competition Limited to Eligible 8(a) Participants",
    farRef: "FAR 19.108-10(d)",
    req: (p) => p.setAside === "8A" ? "REQUIRED" : null,
    fillIns: [
      { id: "sba_contractor", label: "SBA contractor name", placeholder: "Insert name of SBA contractor" },
      { id: "contracting_agency", label: "Contracting agency name", placeholder: "Insert name of contracting agency" },
    ],
    note: "Use for competitive 8(a) acquisitions under FAR 19.107-8. For NASA contracts, use 1852.219-18 per NFS 1819.108-70(d). Old clause 52.206-1 / FAR 6.305 are SUPERSEDED and do not exist in the current FAR.",
  },
  {
    num: "1852.219-18",
    title: "Notification of Competition Limited to Eligible 8(a) Concerns (NASA)",
    farRef: "NFS 1819.108-70(d)",
    req: (p) => p.setAside === "8A" ? "REQUIRED" : null,
    fillIns: [],
    note: "NASA-specific 8(a) competition notification. Prescribed by NFS 1819.108-70(d) in lieu of or with FAR 52.219-18. Use Alternate I when competition is limited to specific SBA districts (FAR 19.108-4(b)). Use Alternate II when SBA has waived the nonmanufacturer rule (FAR 19.108-10(d)).",
  },

  // ════════════════════════════════════════════════════════════════
  // ETHICS / INTEGRITY (FAR 52.203-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.203-3",
    title: "Gratuities",
    farRef: "FAR 3.202",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.203-5",
    title: "Covenant Against Contingent Fees",
    farRef: "FAR 3.404",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.203-6",
    title: "Restrictions on Subcontractor Sales to the Government",
    farRef: "FAR 3.503-2",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    alternates: ["Alt I — for commercial products"],
    fillIns: [],
  },
  {
    num: "52.203-7",
    title: "Anti-Kickback Procedures",
    farRef: "FAR 3.502-3",
    req: (p) => p.value > V.SAT && p.hasSubcontracting ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.203-12",
    title: "Limitation on Payments to Influence Certain Federal Transactions",
    farRef: "FAR 3.808",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.203-13",
    title: "Contractor Code of Business Ethics and Conduct",
    farRef: "FAR 3.1004(a)",
    req: (p) => p.value >= 6000000 && p.pop >= 120 ? "REQUIRED" : null,
    fillIns: [],
    note: "Applies to contracts over $6M with PoP > 120 days.",
  },
  {
    num: "52.203-17",
    title: "Contractor Employee Whistleblower Rights",
    farRef: "FAR 3.901",
    req: (p) => p.value > V.SAT ? "REQUIRED" : "OPTIONAL",
    fillIns: [],
  },
  {
    num: "52.203-19",
    title: "Prohibition on Requiring Certain Internal Confidentiality Agreements",
    farRef: "FAR 3.909-3",
    req: (p) => "REQUIRED",
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // ADMINISTRATIVE / SAM / UEI (FAR 52.204-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.204-7",
    title: "System for Award Management",
    farRef: "FAR 4.1105(a)(1)",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.204-9",
    title: "Personal Identity Verification of Contractor Personnel",
    farRef: "FAR 4.1303",
    req: (p) => p.isServicesContract ? "REQUIRED" : "CONDITIONAL",
    fillIns: [
      { id: "piv_offices", label: "Contracting office(s) requiring PIV", placeholder: "NASA Ames Research Center" },
    ],
    note: "Required when contractor personnel require routine physical access to federally-controlled facilities.",
  },
  {
    num: "52.204-10",
    title: "Reporting Executive Compensation and First-Tier Subcontract Awards",
    farRef: "FAR 4.1403(a)",
    req: (p) => p.value >= 30000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.204-13",
    title: "System for Award Management Maintenance",
    farRef: "FAR 4.1105(a)(2)",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.204-14",
    title: "Service Contract Reporting Requirements",
    farRef: "FAR 4.1705(a)",
    req: (p) => p.isServicesContract && p.value >= 500000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.204-18",
    title: "Commercial and Government Entity Code Maintenance",
    farRef: "FAR 4.1804(b)",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.204-19",
    title: "Incorporation by Reference of Representations and Certifications",
    farRef: "FAR 4.1202(b)",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.204-21",
    title: "Basic Safeguarding of Covered Contractor Information Systems",
    farRef: "FAR 4.1903",
    req: (p) => p.reqType === "IT" || p.hasIT ? "REQUIRED" : "CONDITIONAL",
    fillIns: [],
    note: "Required when contractor may have federal contract information on its information systems.",
  },
  {
    num: "52.204-23",
    title: "Prohibition on Contracting for Hardware, Software, and Services Developed or Provided by Kaspersky Lab",
    farRef: "FAR 4.2004",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.204-24",
    title: "Representation Regarding Certain Telecommunications and Video Surveillance Services",
    farRef: "FAR 4.2105(a)",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.204-25",
    title: "Prohibition on Contracting for Certain Telecommunications and Video Surveillance Services or Equipment",
    farRef: "FAR 4.2105(b)",
    req: (p) => "REQUIRED",
    fillIns: [],
    note: "Covers Huawei, ZTE, Hytera, Hikvision, Dahua equipment/services.",
  },
  {
    num: "52.204-27",
    title: "Prohibition on a ByteDance Covered Application (TikTok)",
    farRef: "FAR 4.2203",
    req: (p) => "REQUIRED",
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // SMALL BUSINESS (FAR 52.219-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.219-1",
    title: "Small Business Program Representations",
    farRef: "FAR 19.309(a)(1)",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    alternates: ["Alt I — acquisitions by DOD, NASA, Coast Guard"],
    fillIns: [],
  },
  {
    num: "52.219-6",
    title: "Notice of Total Small Business Set-Aside",
    farRef: "FAR 19.508(d)(1)",
    req: (p) => p.setAside === "TOTAL_SB" ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.219-8",
    title: "Utilization of Small Business Concerns",
    farRef: "FAR 19.708(a)",
    req: (p) => p.value > V.SAT && !["TOTAL_SB","8A","HUBZONE","SDVOSB","WOSB"].includes(p.setAside) ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.219-9",
    title: "Small Business Subcontracting Plan",
    farRef: "FAR 19.708(b)",
    req: (p) => p.value >= 900000 && !p.isSmallBusiness && p.hasSubcontracting ? "REQUIRED" : p.value >= 900000 && !p.isSmallBusiness ? "CONDITIONAL" : null,
    alternates: ["Alt I — DoD only", "Alt II — commercial plan", "Alt III — revised plan"],
    fillIns: [
      { id: "sb_plan_goals", label: "SB subcontracting goals (%)", placeholder: "e.g., SB: 23%, SDB: 5%, WOSB: 5%, HUBZone: 3%, SDVOSB: 3%" },
    ],
    note: "Not required if contractor is a small business. Requires negotiated subcontracting plan.",
  },
  {
    num: "52.219-14",
    title: "Limitations on Subcontracting",
    farRef: "FAR 19.508(e)",
    req: (p) => ["TOTAL_SB","WOSB","SDVOSB","8A","HUBZONE"].includes(p.setAside) ? "REQUIRED" : null,
    fillIns: [],
    note: "Limits how much work can be subcontracted away from the prime on set-aside contracts.",
  },
  {
    num: "52.219-28",
    title: "Post-Award Small Business Program Rerepresentation",
    farRef: "FAR 19.309(c)(1)",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.219-33",
    title: "Nonmanufacturer Rule",
    farRef: "FAR 19.102(f)(5)",
    req: (p) => p.reqType === "SUPPLIES" && ["TOTAL_SB","8A"].includes(p.setAside) ? "REQUIRED" : null,
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // LABOR (FAR 52.222-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.222-1",
    title: "Notice to the Government of Labor Disputes",
    farRef: "FAR 22.103-5(a)",
    req: (p) => p.value > V.SAT && p.isServicesContract ? "CONDITIONAL" : null,
    fillIns: [],
  },
  {
    num: "52.222-3",
    title: "Convict Labor",
    farRef: "FAR 22.202",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.222-21",
    title: "Prohibition on Segregated Facilities",
    farRef: "FAR 22.810(a)(1)",
    req: (p) => p.value >= 10000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-26",
    title: "Equal Opportunity",
    farRef: "FAR 22.810(e)",
    req: (p) => p.value >= 10000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-35",
    title: "Equal Opportunity for Veterans",
    farRef: "FAR 22.1310(a)(1)",
    req: (p) => p.value >= 150000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-36",
    title: "Equal Opportunity for Workers with Disabilities",
    farRef: "FAR 22.1408(a)",
    req: (p) => p.value >= 15000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-37",
    title: "Employment Reports on Veterans",
    farRef: "FAR 22.1310(b)",
    req: (p) => p.value >= 150000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-40",
    title: "Notification of Employee Rights Under the National Labor Relations Act",
    farRef: "FAR 22.1605",
    req: (p) => p.value >= 10000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-41",
    title: "Service Contract Labor Standards",
    farRef: "FAR 22.1006(a)",
    req: (p) => p.isSCA ? "REQUIRED" : null,
    fillIns: [
      { id: "wage_determination", label: "Wage Determination number(s)", placeholder: "e.g., 2015-4281 Rev 19" },
    ],
    note: "SCA applies to service contracts over $2,500 where service employees perform the work. Attach applicable Wage Determination.",
  },
  {
    num: "52.222-42",
    title: "Statement of Equivalent Rates for Federal Hires",
    farRef: "FAR 22.1006(b)",
    req: (p) => p.isSCA ? "REQUIRED" : null,
    fillIns: [
      { id: "equiv_rates", label: "Employee class / monetary wage / fringe benefits", placeholder: "e.g., Administrative Assistant GS-6, $XX.XX/hr" },
    ],
  },
  {
    num: "52.222-43",
    title: "Fair Labor Standards Act and Service Contract Labor Standards—Price Adjustment (Multiple Year and Option Contracts)",
    farRef: "FAR 22.1006(c)",
    req: (p) => p.isSCA && p.hasOptions ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-50",
    title: "Combating Trafficking in Persons",
    farRef: "FAR 22.1705(a)(1)",
    req: (p) => "REQUIRED",
    fillIns: [],
    alternates: ["Alt I — contracts performed outside US with value > $500K"],
  },
  {
    num: "52.222-54",
    title: "Employment Eligibility Verification (E-Verify)",
    farRef: "FAR 22.1803",
    req: (p) => p.value > V.SAT && p.pop >= 120 && p.isServicesContract ? "REQUIRED" : null,
    fillIns: [],
    note: "Required for service/construction contracts > SAT with PoP > 120 days.",
  },
  {
    num: "52.222-55",
    title: "Minimum Wages for Contractor Workers Under Executive Order 14026",
    farRef: "FAR 22.1904",
    req: (p) => (p.isSCA || p.isTM) ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.222-62",
    title: "Paid Sick Leave Under Executive Order 13706",
    farRef: "FAR 22.2109",
    req: (p) => p.isSCA ? "REQUIRED" : null,
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // ENVIRONMENT (FAR 52.223-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.223-5",
    title: "Pollution Prevention and Right-to-Know Information",
    farRef: "FAR 23.1005",
    req: (p) => p.isConstruction || p.performsOnFederalFacility ? "REQUIRED" : "CONDITIONAL",
    fillIns: [],
  },
  {
    num: "52.223-18",
    title: "Encouraging Contractor Policies to Ban Text Messaging While Driving",
    farRef: "FAR 23.1101",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.223-22",
    title: "Public Disclosure of Greenhouse Gas Emissions and Reduction Goals",
    farRef: "FAR 23.804",
    req: (p) => p.value >= 7500000 && p.isServicesContract ? "REQUIRED" : null,
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // PAYMENTS (FAR 52.232-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.232-1",
    title: "Payments",
    farRef: "FAR 32.111(a)(1)",
    req: (p) => p.isFFP && !p.isCommercial ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.232-8",
    title: "Discounts for Prompt Payment",
    farRef: "FAR 32.111(b)(1)",
    req: (p) => p.value > V.SAT ? "CONDITIONAL" : null,
    fillIns: [
      { id: "discount_terms", label: "Prompt payment discount terms", placeholder: "e.g., 2% 10 days, net 30" },
    ],
  },
  {
    num: "52.232-17",
    title: "Interest",
    farRef: "FAR 32.617",
    req: (p) => p.value > V.MICRO ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.232-18",
    title: "Availability of Funds",
    farRef: "FAR 32.706-1",
    req: (p) => p.hasOptions || p.pop > 12 ? "CONDITIONAL" : null,
    fillIns: [],
    note: "Use when contract performance is contingent on availability of funds in future fiscal years.",
  },
  {
    num: "52.232-19",
    title: "Availability of Funds for the Next Fiscal Year",
    farRef: "FAR 32.706-1(b)",
    req: (p) => p.hasOptions ? "CONDITIONAL" : null,
    fillIns: [],
  },
  {
    num: "52.232-25",
    title: "Prompt Payment",
    farRef: "FAR 32.908(c)",
    req: (p) => !p.isCommercial ? "REQUIRED" : null,
    alternates: ["Alt I — fast payment procedure"],
    fillIns: [],
  },
  {
    num: "52.232-33",
    title: "Payment by Electronic Funds Transfer—System for Award Management",
    farRef: "FAR 32.1110(a)(1)",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.232-39",
    title: "Unenforceability of Unauthorized Obligations",
    farRef: "FAR 32.706-3",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.232-40",
    title: "Providing Accelerated Payments to Small Business Subcontractors",
    farRef: "FAR 32.009-2",
    req: (p) => p.hasSubcontracting && !p.isSmallBusiness ? "REQUIRED" : null,
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // CONTRACT TERMS — GENERAL (52.233, 52.236, 52.243, 52.249, etc.)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.233-1",
    title: "Disputes",
    farRef: "FAR 33.215",
    req: (p) => "REQUIRED",
    alternates: ["Alt I — when contractor certification required"],
    fillIns: [],
  },
  {
    num: "52.233-3",
    title: "Protest After Award",
    farRef: "FAR 33.106(b)",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    fillIns: [],
    alternates: ["Alt I — when urgency exception applies"],
  },
  {
    num: "52.233-4",
    title: "Applicable Law for Breach of Contract Claim",
    farRef: "FAR 33.103(d)(4)",
    req: (p) => "REQUIRED",
    fillIns: [],
  },
  {
    num: "52.242-13",
    title: "Bankruptcy",
    farRef: "FAR 42.903",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.243-1",
    title: "Changes—Fixed-Price",
    farRef: "FAR 43.205(a)(1)",
    req: (p) => p.isFFP && !p.isCommercial ? "REQUIRED" : null,
    alternates: ["Alt I — supplies", "Alt II — services", "Alt III — T&M or LH", "Alt IV — research & development", "Alt V — architect-engineer"],
    fillIns: [],
  },
  {
    num: "52.243-3",
    title: "Changes—Time-and-Material or Labor Hours",
    farRef: "FAR 43.205(c)",
    req: (p) => p.isTM && !p.isCommercial ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.244-6",
    title: "Subcontracts for Commercial Products and Commercial Services",
    farRef: "FAR 44.403",
    req: (p) => p.value > V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.245-1",
    title: "Government Property",
    farRef: "FAR 45.107(a)",
    req: (p) => p.hasGovProperty ? "REQUIRED" : "CONDITIONAL",
    alternates: ["Alt I — when cost-reimbursement", "Alt II — when contractor acquires property"],
    fillIns: [],
  },
  {
    num: "52.246-4",
    title: "Inspection of Services—Fixed-Price",
    farRef: "FAR 46.304",
    req: (p) => p.isFFP && p.isServicesContract && !p.isCommercial ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.246-25",
    title: "Limitation of Liability—Services",
    farRef: "FAR 46.805",
    req: (p) => p.isServicesContract && p.value > V.SAT && !p.isCommercial ? "CONDITIONAL" : null,
    fillIns: [],
  },
  {
    num: "52.249-1",
    title: "Termination for Convenience of the Government (Fixed-Price) (Short Form)",
    farRef: "FAR 49.502(a)(1)",
    req: (p) => p.isFFP && p.value <= V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.249-2",
    title: "Termination for Convenience of the Government (Fixed-Price)",
    farRef: "FAR 49.502(a)(2)",
    req: (p) => p.isFFP && p.value > V.SAT ? "REQUIRED" : null,
    alternates: ["Alt I — for research and development"],
    fillIns: [],
  },
  {
    num: "52.249-4",
    title: "Termination for Convenience of the Government (Services) (Short Form)",
    farRef: "FAR 49.502(c)",
    req: (p) => p.isServicesContract && p.value <= V.SAT ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.249-8",
    title: "Default (Fixed-Price Supply and Service)",
    farRef: "FAR 49.504(a)(1)",
    req: (p) => p.isFFP && !p.isCommercial ? "REQUIRED" : null,
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // COST/ACCOUNTING (FAR 52.215-x, 52.230-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.215-2",
    title: "Audit and Records—Negotiation",
    farRef: "FAR 15.209(b)(1)",
    req: (p) => p.isCostType || (p.value >= V.TINA && !p.isCommercial) ? "REQUIRED" : null,
    fillIns: [],
    note: "Required on cost-type contracts and when TINA applies.",
  },
  {
    num: "52.215-10",
    title: "Price Reduction for Defective Certified Cost or Pricing Data",
    farRef: "FAR 15.408(b)(1)",
    req: (p) => p.value >= V.TINA && !p.isCommercial ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.215-12",
    title: "Subcontractor Certified Cost or Pricing Data",
    farRef: "FAR 15.408(d)(1)",
    req: (p) => p.value >= V.TINA && !p.isCommercial ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "52.230-2",
    title: "Cost Accounting Standards",
    farRef: "FAR 30.201-4(a)(1)",
    req: (p) => p.isCostType && p.value >= V.CAS ? "REQUIRED" : null,
    fillIns: [],
    note: "CAS applies to negotiated contracts > $2M except commercial items and small businesses.",
  },

  // ════════════════════════════════════════════════════════════════
  // IT / CYBERSECURITY (52.239-x)
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.239-1",
    title: "Privacy or Security Safeguards",
    farRef: "FAR 39.106",
    req: (p) => p.reqType === "IT" ? "REQUIRED" : null,
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // NASA / NFS CLAUSES (1852.2xx)
  // ════════════════════════════════════════════════════════════════
  {
    num: "1852.203-70",
    title: "Display of Inspector General Hotline Posters",
    farRef: "NFS 1803.1003",
    req: (p) => p.value >= 1000000 ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "1852.204-75",
    title: "Security Classification Requirements",
    farRef: "NFS 1804.404-70",
    req: (p) => p.hasClassifiedWork ? "REQUIRED" : null,
    fillIns: [
      { id: "classification_level", label: "Classification level", placeholder: "Confidential / Secret / Top Secret" },
    ],
  },
  {
    num: "1852.204-76",
    title: "Security Requirements for Unclassified IT Resources",
    farRef: "NFS 1839.107-70(a)",
    req: (p) => p.reqType === "IT" || p.hasIT ? "REQUIRED" : "CONDITIONAL",
    fillIns: [],
    note: "Required whenever contractor will access or operate NASA IT systems.",
  },
  {
    num: "1852.209-71",
    title: "Limitation of Future Contracting",
    farRef: "NFS 1809.507-2",
    req: (p) => p.isRD || p.isAE ? "CONDITIONAL" : null,
    fillIns: [
      { id: "future_limitations", label: "Describe limitations on future contracting", placeholder: "e.g., Contractor may not compete on Phase II of this program." },
    ],
  },
  {
    num: "1852.215-84",
    title: "Ombudsman",
    farRef: "NFS 1815.7003",
    req: (p) => "REQUIRED",
    fillIns: [],
    note: "Required in ALL NASA solicitations (including draft) and contracts per NFS 1815.7003 (confirmed current). No dollar threshold.",
  },
  {
    num: "1852.216-80",
    title: "Task Order Procedures",
    farRef: "NFS 1816.505-70 / PCD 25-53A",
    req: (p) => p.isIdiq && !p.isFFRDC ? "REQUIRED" : null,
    alternates: [
      "Alt I — cost-type, FP price redetermination, or FPI (without 533M)",
      "Alt II — fixed-price task orders"
    ],
    fillIns: [
      { id: "task_order_proc", label: "Task order issuance procedures", placeholder: "Describe ordering procedures, competition method, and minimum ordering threshold" }
    ],
    note: "Required in ALL IDIQ task order contracts except FFRDC per NFS 1816.505-70 / PCD 25-53A. Alt I for cost/redetermination/FPI; Alt II for fixed-price.",
  },
  {
    num: "1852.219-11",
    title: "Special 8(a) Contract Conditions",
    farRef: "NFS 1819.811-3(a) / NFS 1819.108-73(a)",
    req: (p) => p.setAside === "8A" ? "REQUIRED" : null,
    fillIns: [
      { id: "sba_district", label: "SBA district office", placeholder: "e.g., San Francisco District Office" },
    ],
    note: "Required in all 8(a) contracts. Per NFS 1819.811-3(a) and NFS 1812.205-70 per PCD 25-23A / PCD 26-03A.",
  },
  {
    num: "1852.219-73",
    title: "Small Business Subcontracting Plan",
    farRef: "NFS 1819.109-70(a) / NFS 1812.205-70(F)",
    req: (p) => false, // PROVISION — IFB/sealed-bid only; not applicable to negotiated acquisitions
    fillIns: [
      { id: "days_to_submit", label: "Calendar days to submit plan after CO request", placeholder: "e.g., 10" },
    ],
    note: "SOLICITATION PROVISION — applies only in sealed bid (IFB) acquisitions that include FAR 52.219-9 with Alternate I. NOT applicable to negotiated (RFP) acquisitions. Authorized for commercial acquisitions per NFS 1812.205-70(F) per PCD 25-23A. Not required for this acquisition type.",
  },
  {
    num: "1852.219-75",
    title: "Individual Subcontracting Reports",
    farRef: "NFS 1819.708-70(b)",
    req: (p) => p.value >= 900000 && !p.isSmallBusiness ? "REQUIRED" : null,
    fillIns: [],
    note: "Required with FAR 52.219-9 except for contracts covered by approved commercial subcontracting plan. Per NFS 1819.708-70(b) (confirmed current).",
  },
  // NOTE: 1852.219-74 (Use of Rural Area Small Businesses) — DELETED. Was previously RESERVED; removed per PCD 26-03A.
  // NOTE: 1852.219-76 — removed; replaced by 1852.219-11 (Special 8(a) Contract Conditions) per PCD 26-03A.
  {
    num: "1852.226-71",
    title: "Safety and Health Measures and Mishap Reporting",
    farRef: "NFS 1826.7001 / PCD 26-03A",
    req: (p) => p.performsOnFederalFacility ? "REQUIRED" : "CONDITIONAL",
    fillIns: [],
    note: "Formerly 1852.223-70. Renumbered and relocated from NFS Part 1823 to NFS Part 1826 per PCD 26-03A (April 2026). Required for all on-site work at NASA facilities.",
  },
  // NOTE: 1852.223-71 (Frequency Authorization) OBSOLETE — renumbered to 1852.239-70 per PCD 26-03A. See 1852.239-70 below.
  {
    num: "1852.226-74",
    title: "Safety and Health (Short Form)",
    farRef: "NFS 1823.7001(d) / PCD 26-03A",
    req: (p) => p.value <= V.SAT && p.performsOnFederalFacility ? "CONDITIONAL" : null,
    fillIns: [],
    note: "Formerly 1852.223-72. Renumbered per PCD 26-03A (April 2026). Use this number for all new actions.",
  },
  {
    num: "1852.226-72",
    title: "Safety and Health Plan",
    farRef: "NFS 1823.7001(c) / PCD 26-03A",
    req: (p) => p.isConstruction || (p.performsOnFederalFacility && p.value >= 500000) ? "REQUIRED" : null,
    fillIns: [],
    note: "Formerly 1852.223-73. Renumbered per PCD 26-03A (April 2026). Use this number for all new actions.",
  },
  {
    num: "1852.225-70",
    title: "Export Licenses",
    farRef: "NFS 1825.1103-70",
    req: (p) => p.hasITAR || p.isRD ? "REQUIRED" : "CONDITIONAL",
    fillIns: [],
    note: "Required when performance may involve export-controlled technology (ITAR/EAR).",
  },
  {
    num: "1852.227-11",
    title: "Patent Rights—Ownership by the Contractor (Short Form)",
    farRef: "NFS 1827.303(b)(1)(i)",
    req: (p) => p.isRD && p.isSmallBusiness ? "REQUIRED" : p.isRD && p.value <= 500000 ? "REQUIRED" : null,
    fillIns: [],
    note: "Use for small business or nonprofit R&D contractors. Contractor retains title with Government license.",
  },
  {
    num: "1852.227-14",
    title: "Rights in Data—General (as modified by NFS)",
    farRef: "NFS 1827.409(b)(1)",
    req: (p) => p.isCommercial !== "YES" && (p.isRD || p.isServicesContract || p.hasIT) ? "REQUIRED" : null,
    alternates: [
      "Alt I — limits Government right to obtain, reproduce, distribute or publish data",
      "Alt II — permits contractor to use limited rights data for stated purposes (consult center IP counsel)",
      "Alt III — contractor retains copyright for computer software",
      "Alt IV — basic/applied research performed solely by university/college (consult center IP counsel per PN 22-15)",
      "Alt V — SBIR/STTR data rights (superseded by 52.227-20 deviation per PCD 26-02)",
    ],
    fillIns: [
      { id: "data_rights_alt", label: "Alternate(s) to include (if any)", placeholder: "e.g., Alt II for limited rights data" },
      { id: "disclosure_purposes", label: "Disclosure purposes per FAR 27.404-2(c)(1) (Alt II only)", placeholder: "Insert applicable purposes or 'none'" },
    ],
    note: "NFS 1827.409(b)(1): When 52.227-14 is included it SHALL be modified as set forth at 1852.227-14. For basic/applied research at universities, consult center patent/IP counsel re Alt IV per PN 22-15.",
  },
  {
    num: "52.227-16",
    title: "Additional Data Requirements",
    farRef: "NFS 1827.409(d) / FAR 27.406-2",
    req: (p) => p.isRD && !(p.isUniversity && p.value <= 500000) ? "REQUIRED" : null,
    fillIns: [],
    note: "NFS 1827.409(d): Required in all R&D/experimental/developmental/demonstration contracts EXCEPT basic/applied research at universities/colleges when value ≤ $500K. CO may omit with center IP counsel concurrence.",
  },
  {
    num: "52.227-20",
    title: "Rights in Data—SBIR and STTR Programs (DEVIATION JAN 2026)",
    farRef: "NFS 1827.409(h) / PCD 26-02",
    req: (p) => p.isSBIR ? "REQUIRED" : null,
    fillIns: [],
    note: "PCD 26-02: Required in ALL SBIR/STTR Phase I, II, and III contracts. This clause SUPERSEDES 1852.227-19 (Commercial Computer Software—Restricted Rights) and 1852.227-86 (Commercial Computer Software License), both rendered obsolete by PCD 26-02. SBIR/STTR data rights protection period is 20 years; may be extended by negotiation.",
  },
  {
    num: "1852.227-70",
    title: "New Technology—Other than a Small Business Firm or Nonprofit Organization",
    farRef: "NFS 1827.303(a)(1)",
    req: (p) => p.isRD && !p.isSmallBusiness ? "REQUIRED" : null,
    fillIns: [],
    note: "For R&D contracts with other than small business or nonprofit. Government receives title to subject inventions with contractor license. For contracts >$2.5M, CO may require New Technology Reporting Plan per NFS 1827.305-271.",
  },
  {
    num: "1852.227-84",
    title: "Patent Rights Clauses (Solicitation Provision)",
    farRef: "NFS 1827.303(a)(1)",
    req: (p) => p.isRD ? "REQUIRED" : null,
    fillIns: [],
    note: "Solicitation provision (not a contract clause). Insert in R&D solicitations performed in the US when eventual awardee may be a small business or nonprofit — allows offeror to represent its status for patent rights clause selection.",
  },
  {
    num: "1852.227-88",
    title: "Government-Furnished Computer Software and Related Technical Data",
    farRef: "NFS 1827.409(j)",
    req: (p) => p.hasIT && p.hasGovProperty ? "CONDITIONAL" : null,
    fillIns: [],
    note: "Include when Government-furnished computer software (GFCS) will be provided to contractor for performance. Optional — CO discretion per NFS 1827.409(j).",
  },
  {
    num: "52.227-14",
    title: "Rights in Data—General (FAR base clause)",
    farRef: "FAR 27.409(b)",
    req: (p) => p.isCommercial !== "YES" && (p.isRD || p.isServicesContract || p.hasIT) ? "REQUIRED" : null,
    fillIns: [],
    note: "FAR base clause — ALWAYS include alongside 1852.227-14 modification. The NFS modifies but does not replace this clause.",
  },
  {
    num: "52.227-11",
    title: "Patent Rights—Ownership by the Contractor (FAR base clause)",
    farRef: "FAR 27.303(b)",
    req: (p) => p.isRD && p.isSmallBusiness ? "REQUIRED" : null,
    fillIns: [],
    note: "FAR base clause for small business/nonprofit R&D. Modified by 1852.227-11. Include both.",
  },
  {
    num: "1852.228-71",
    title: "Aircraft Flight Risks",
    farRef: "NFS 1828.370(a)",
    req: (p) => p.hasAircraft ? "REQUIRED" : null,
    fillIns: [],
    note: "Required when contractor will fly aircraft in performance of the contract.",
  },
  {
    num: "1852.228-76",
    title: "Cross-Waiver of Liability for International Space Station Activities",
    farRef: "NFS 1828.371",
    req: (p) => p.hasISS ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "1852.228-78",
    title: "Cross-Waiver of Liability for NASA Experimental Programs",
    farRef: "NFS 1828.371",
    req: (p) => p.hasLaunchVehicle ? "CONDITIONAL" : null,
    fillIns: [],
  },
  {
    num: "1852.231-70",
    title: "Precontract Costs",
    farRef: "NFS 1831.205-70",
    req: (p) => p.isCostType ? "CONDITIONAL" : null,
    fillIns: [
      { id: "precontract_date", label: "Precontract cost effective date", placeholder: "e.g., March 1, 2026" },
      { id: "precontract_ceiling", label: "Precontract cost ceiling ($)", placeholder: "e.g., $50,000" },
    ],
  },
  {
    num: "1852.237-70",
    title: "Emergency Evacuation Procedures",
    farRef: "NFS 1837.110-70(a)",
    req: (p) => p.performsOnFederalFacility ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "1852.237-72",
    title: "Access to Sensitive Information",
    farRef: "NFS 1837.203-70",
    req: (p) => p.hasSensitiveInfo ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "1852.239-70",
    title: "Security Controls for Unclassified Information Systems",
    farRef: "NFS 1839.107-70(b)",
    req: (p) => p.reqType === "IT" ? "REQUIRED" : "CONDITIONAL",
    fillIns: [],
  },
  {
    num: "1852.226-73",
    title: "Major Breach of Safety or Security",
    farRef: "NFS 1826.7001(e) / PCD 26-03A",
    section: "H",
    req: (p) => p.value >= 500000 ? "REQUIRED" : "OPTIONAL",
    alternates: [
      "Alt I — contracts with educational/nonprofit with 52.249-5 termination clause",
      "Alt I — commercial contracts containing 52.212-4",
    ],
    fillIns: [],
    note: "Required in all solicitations and contracts ≥$500K unless waived above CO level with PM and safety/security official concurrence. Authorized for commercial acquisitions per NFS 1812.205-70(L). Use Alt I for commercial contracts (with 52.212-4) or educational/nonprofit contracts (with 52.249-5). Per NFS 1826.7001(e) / PCD 26-03A.",
  },
  {
    num: "1852.237-73",
    title: "Release of Sensitive Information",
    farRef: "NFS 1837.203-71",
    section: "H",
    req: (p) => p.hasSensitiveInfo ? "REQUIRED" : "CONDITIONAL",
    fillIns: [],
    note: "Companion to 1852.237-72. Required when contractor may release sensitive information obtained during performance. Authorized for commercial acquisitions per NFS 1812.205-70(R). Insert both 72 and 73 when contractor will access or release sensitive Government information.",
  },
  {
    num: "1852.246-72",
    title: "Material Inspection and Receiving Report",
    farRef: "NFS 1846.670 / PCD 25-26",
    section: "H",
    req: (p) => {
      // Required for contracts with separate and distinct deliverables, even if not separately priced
      // Not required for: simplified acquisition, negotiated subsistence, scientific/technical reports
      if (p.lane === "SIMPLIFIED" || p.lane === "MICROPURCHASE") return null;
      if (p.isServicesContract && !p.hasDeliverables) return null;
      return "CONDITIONAL";
    },
    fillIns: [
      { id: "dd250_copies", label: "Number of DD Form 250 copies and distribution instructions", placeholder: "e.g., 2 copies — 1 to CO, 1 to COR" },
    ],
    note: "Required when there will be separate and distinct deliverables, even if not separately priced. Not required for simplified acquisition contracts, negotiated subsistence contracts, or contracts where the deliverable is a scientific or technical report. Authorized for commercial acquisitions per NFS 1812.205-70(S). Per NFS 1846.670.",
  },
  {
    num: "1852.246-74",
    title: "Counterfeit Electronic Part Detection and Avoidance",
    farRef: "NFS 1846.7003",
    section: "H",
    req: (p) => (p.reqType === "SUPPLIES" || p.hasElectronicParts) ? "REQUIRED" : null,
    fillIns: [],
    note: "Required for acquisitions of electronic parts or end items containing electronic parts where quality standards are necessary. Per NFS 1846.7003. Authorized for commercial acquisitions per NFS 1812.205-70(T).",
  },
  {
    num: "1852.242-70",
    title: "Technical Direction",
    farRef: "NFS 1842.270",
    req: (p) => "REQUIRED",
    fillIns: [
      { id: "cor_name", label: "COR / Technical Direction official name", placeholder: "Enter COR name" },
    ],
    note: "Required in all contracts. Authorizes and limits technical direction by COR.",
  },
  {
    num: "1852.242-72",
    title: "Denied Access to NASA Facilities",
    farRef: "NFS 1842.7001",
    req: (p) => p.performsOnFederalFacility ? "REQUIRED" : null,
    fillIns: [],
  },
  {
    num: "1852.233-70",
    title: "Disputes",
    farRef: "NFS 1833.107-70",
    section: "H",
    req: (p) => "REQUIRED",
    note: "Required in ALL NASA solicitations per NFS 1833.107-70. Class deviation — inserts NASA-specific disputes language. No dollar threshold.",
  },
  {
    num: "1852.234-1",
    title: "Notice of Earned Value Management System",
    farRef: "NFS 1834.203-70 / PCD 25-05A",
    section: "H",
    req: (p) => {
      const isDevContract = (p.isCostType || p.contractType === "FPIF") && p.value >= 50000000 && p.pop >= 18 && p.hasDevelopmentWork;
      if (isDevContract) return "REQUIRED";
      return null;
    },
    note: "Required in solicitations for cost-type or FPIF contracts ≥$50M, ≥18 months POP, with development work scope. Per NFS 1834.21 / NFS 1834.203-70. Companion: include 1852.234-2 for contracts ≥$100M.",
  },
  {
    num: "1852.234-2",
    title: "Earned Value Management System",
    farRef: "NFS 1834.203-70 / PCD 25-05A",
    section: "H",
    req: (p) => {
      const isEVMRequired = (p.isCostType || p.contractType === "FPIF") && p.value >= 100000000 && p.pop >= 18 && p.hasDevelopmentWork;
      if (isEVMRequired) return "REQUIRED";
      const isEVMOptional = (p.isCostType || p.contractType === "FPIF") && p.value >= 50000000 && p.pop >= 18 && p.hasDevelopmentWork;
      if (isEVMOptional) return "CONDITIONAL";
      return null;
    },
    note: "REQUIRED at ≥$100M (cost/FPIF, ≥18 months POP, development work scope) — contractor EVMS must be CFA-accepted EIA-748 compliant. CONDITIONAL at $50M-$99.9M — use with Alternate I per NFS 1834.203-70. Exception: SMD Class D below $150M lifecycle cost.",
  },
  {
    num: "1852.235-70",
    title: "NASA STI Compliance and Distribution Services",
    farRef: "NFS 1835.101-70(a)",
    section: "H",
    req: (p) => p.reqType === "R&D" ? "REQUIRED" : null,
    note: "Required in all R&D contracts, interagency agreements, and cost-reimbursement supply contracts involving R&D work. Per NFS 1835.101-70(a).",
  },
  {
    num: "1852.245-70",
    title: "Dated Material",
    farRef: "NFS 1845.107-70(a)",
    req: (p) => p.hasGovProperty ? "CONDITIONAL" : null,
    fillIns: [],
  },

  // ════════════════════════════════════════════════════════════════
  // OPTION CLAUSES
  // ════════════════════════════════════════════════════════════════
  {
    num: "52.217-8",
    title: "Option to Extend Services",
    farRef: "FAR 17.208(f)",
    req: (p) => p.hasOptions && p.isServicesContract ? "REQUIRED" : null,
    fillIns: [
      { id: "option_period", label: "Option extension period (days)", placeholder: "e.g., 6 months" },
    ],
    note: "Use when there is a need to extend services for a short period. Complements 52.217-9.",
  },
  {
    num: "52.217-9",
    title: "Option to Extend the Term of the Contract",
    farRef: "FAR 17.208(g)",
    req: (p) => p.hasOptions ? "REQUIRED" : null,
    fillIns: [
      { id: "option_notice", label: "Days CO must give written notice before exercising option", placeholder: "e.g., 60" },
      { id: "option_total_period", label: "Total contract period including options", placeholder: "e.g., 5 years" },
    ],
  },
];

// ── Main prescription function ────────────────────────────────────
export function prescribeClauses(params) {
  // Normalize params
  const p = {
    value:                  parseFloat(params.value) || 0,
    isCommercial:           params.isCommercial || "TBD",
    contractType:           params.contractType || "FFP",
    setAside:               params.setAside || params.competitionStrategy || "FULL_OPEN",
    reqType:                params.reqType || "SERVICES",
    pop:                    parsePOP(params.pop),  // in days
    hasOptions:             params.hasOptions !== false,
    center:                 params.center || "",
    isRCPO:                 ["Ames (ARC)","Glenn (GRC)","Langley (LaRC)","Armstrong (AFRC)"].includes(params.center),
    isSBIR:                 params.isSBIR === true,
    isSmallBusiness:        params.isSmallBusiness === true || params.setAside?.includes("SB") || params.setAside?.includes("8A") || params.setAside?.includes("SDVOSB") || params.setAside?.includes("WOSB") || params.setAside?.includes("HUBZONE"),
    isUniversity:           params.isUniversity === true,
    isConstruction:         params.reqType === "CONSTRUCTION",
    isRD:                   params.reqType === "RD",
    isAE:                   params.reqType === "AE",
    isServicesContract:     ["SERVICES","IT","AE","RD"].includes(params.reqType),
    isFFP:                  ["FFP","FFP with Award Fee"].includes(params.contractType),
    isTM:                   ["T&M","Labor Hour"].includes(params.contractType),
    isCostType:             ["CPFF","CPAF","CPIF"].includes(params.contractType),
    isIdiq:                 params.contractType === "IDIQ",
    isBpa:                  params.contractType === "BPA",
    // SCA: auto-detect for non-commercial service contracts >$2,500 in typical service NAICS
    // CO can always override with explicit isSCA flag
    isSCA: params.isSCA === true || (
      ["SERVICES","AE"].includes(params.reqType) &&
      parseFloat(params.value) > 2500 &&
      params.isCommercial !== "YES" &&
      ["561","562","488","493","531","532","541","621","622","623","624",
       "711","712","713","721","722","811","812","813"].some(
        prefix => (params.naics || "").startsWith(prefix)
      )
    ),
    hasSubcontracting:      parseFloat(params.value) >= 900000,
    hasGovProperty:         params.hasGovProperty === true,
    hasIT:                  params.reqType === "IT" || params.hasIT === true,
    hasITAR:                params.hasITAR === true,
    hasAircraft:            params.hasAircraft === true,
    hasISS:                 params.hasISS === true,
    hasLaunchVehicle:       params.hasLaunchVehicle === true,
    hasRadioFreq:           params.hasRadioFreq === true,
    hasClassifiedWork:      params.hasClassifiedWork === false,
    hasSensitiveInfo:       params.hasSensitiveInfo === true,
    performsOnFederalFacility: params.performsOnFederalFacility !== false, // default true for NASA
    hasRD:                  params.reqType === "RD",
  };

  const required = [];
  const conditional = [];
  const optional = [];
  const notApplicable = [];

  for (const clause of CLAUSE_LIBRARY) {
    const result = clause.req(p);
    const entry = {
      ...clause,
      status: result,
      fillInValues: {},
    };
    if (result === "REQUIRED")     required.push(entry);
    else if (result === "CONDITIONAL") conditional.push(entry);
    else if (result === "OPTIONAL")    optional.push(entry);
    else                               notApplicable.push(entry);
  }

  return { required, conditional, optional, notApplicable, params: p };
}

function parsePOP(pop) {
  if (!pop) return 365;
  if (typeof pop === "number") return pop;
  const s = String(pop).toLowerCase();
  if (s.includes("5 year") || s.includes("base + 4")) return 365 * 5;
  if (s.includes("3 year")) return 365 * 3;
  if (s.includes("2 year")) return 365 * 2;
  if (s.includes("12 month") || s.includes("1 year")) return 365;
  if (s.includes("6 month")) return 180;
  const days = parseInt(s);
  if (!isNaN(days)) return days;
  return 365;
}

// ── Section I builder ─────────────────────────────────────────────
// Takes prescribed clauses and builds formatted Section I text
export function buildSectionI(prescribed, fillInValues = {}) {
  const { required, conditional } = prescribed;
  const activeClauses = [
    ...required,
    ...conditional.filter(c => fillInValues[c.num]?.include === true),
  ].sort((a, b) => a.num.localeCompare(b.num));

  let text = "SECTION I — CONTRACT CLAUSES\n\n";
  text += "The following clauses are incorporated by reference (FAR 52.252-2) ";
  text += "or in full text where required.\n\n";

  // Group: FAR 52.2xx, NFS 1852.2xx
  const farClauses = activeClauses.filter(c => c.num.startsWith("52."));
  const nfsClauses = activeClauses.filter(c => c.num.startsWith("1852."));

  if (farClauses.length) {
    text += "FEDERAL ACQUISITION REGULATION (FAR) CLAUSES\n";
    text += "─".repeat(60) + "\n\n";
    for (const c of farClauses) {
      text += `${c.num}  ${c.title}\n`;
      text += `  [${c.farRef}]\n`;
      if (c.fillIns?.length) {
        for (const fi of c.fillIns) {
          const val = fillInValues[c.num]?.[fi.id] || `[${fi.label}]`;
          text += `  Fill-in (${fi.label}): ${val}\n`;
        }
      }
      if (c.note) text += `  Note: ${c.note}\n`;
      text += "\n";
    }
  }

  if (nfsClauses.length) {
    text += "\nNASA FAR SUPPLEMENT (NFS) CLAUSES\n";
    text += "─".repeat(60) + "\n\n";
    for (const c of nfsClauses) {
      text += `${c.num}  ${c.title}\n`;
      text += `  [${c.farRef}]\n`;
      if (c.fillIns?.length) {
        for (const fi of c.fillIns) {
          const val = fillInValues[c.num]?.[fi.id] || `[${fi.label}]`;
          text += `  Fill-in (${fi.label}): ${val}\n`;
        }
      }
      if (c.note) text += `  Note: ${c.note}\n`;
      text += "\n";
    }
  }

  return text;
}

// ── UCF Section structure ─────────────────────────────────────────
export const UCF_SECTIONS = [
  { id: "A", title: "Solicitation/Contract Form",         note: "SF-1449, SF-26, or SF-33 as applicable" },
  { id: "B", title: "Supplies or Services and Prices",    note: "CLINs, unit prices, option CLINs" },
  { id: "C", title: "Description/Specs/Statement of Work",note: "SOW, PWS, or SOO" },
  { id: "D", title: "Packaging and Marking",              note: "Shipping, labeling, preservation requirements" },
  { id: "E", title: "Inspection and Acceptance",          note: "COR acceptance, inspection location, standards" },
  { id: "F", title: "Deliveries or Performance",          note: "PoP, delivery schedule, place of performance" },
  { id: "G", title: "Contract Administration Data",       note: "CO, COR, ACO, payment office info" },
  { id: "H", title: "Special Contract Requirements",      note: "Agency-unique terms, security, key personnel" },
  { id: "I", title: "Contract Clauses",                   note: "All required FAR/NFS clauses (this engine)" },
  { id: "J", title: "List of Attachments",                note: "SOW, wage determinations, reps/certs, DD254" },
  { id: "K", title: "Representations, Certifications, and Other Statements", note: "52.203-11, 52.209-5, 52.219-1 reps" },
  { id: "L", title: "Instructions, Conditions, and Notices to Offerors",     note: "Proposal instructions, page limits, format" },
  { id: "M", title: "Evaluation Factors for Award",       note: "Factors, subfactors, weights, methodology" },
];

// ── SF form field maps ────────────────────────────────────────────
export function buildSF1449Fields(intake) {
  const v = parseFloat(intake?.value) || 0;
  return {
    block1:  { label: "Requisition Number",              value: intake?.prNumber || "" },
    block2:  { label: "Contract Number",                 value: intake?.contractNumber || "" },
    block3:  { label: "Award/Effective Date",            value: "" },
    block4:  { label: "Order Number",                    value: "" },
    block5:  { label: "Solicitation Number",             value: intake?.solNumber || "" },
    block6:  { label: "Solicitation Issue Date",         value: "" },
    block7:  { label: "For Solicitation Info Call (Name)", value: intake?.coName || "" },
    block8:  { label: "For Solicitation Info Call (Phone)", value: "" },
    block9:  { label: "Marked If Set-Aside (100%)",      value: intake?.setAside !== "FULL_OPEN" ? "X" : "" },
    block10: { label: "Small Business Set-Aside %",      value: "" },
    block11: { label: "Delivery For FOB Destination",    value: "X" },
    block12: { label: "Discount Terms",                  value: "" },
    block13: { label: "Rated Order (DPAS)",               value: "" },
    block14: { label: "Method of Solicitation (IFB/RFP/RFQ)", value: "RFQ" },
    block15: { label: "Deliver To",                      value: intake?.center || "NASA Ames Research Center" },
    block16: { label: "Authority (FAR 13.5 or Part 12)", value: intake?.isCommercial === "YES" ? "FAR 12.6 / 13.5" : "FAR Part 15" },
    block17: { label: "Accounting and Appropriation Data", value: intake?.fundCite || "" },
    block18: { label: "DUNS / UEI Number",               value: "" },
    block19: { label: "Schedule (Total Award Amount)",   value: "$" + v.toLocaleString() },
    block20: { label: "Table of Contents (check)",       value: "X" },
    // Contractor section
    block30: { label: "Name of Contractor",              value: "" },
    block31: { label: "Facility Code",                   value: "" },
    block32: { label: "Business Size",                   value: "" },
    block33: { label: "Taxpayer Identification Number",  value: "" },
    block34: { label: "Contractor is (entity type)",     value: "" },
    block35: { label: "Street Address",                  value: "" },
    block36: { label: "City/State/Zip",                  value: "" },
    block37: { label: "Award of Contract (Ref offer dated)", value: "" },
    block38: { label: "Signature of Contracting Officer", value: intake?.coName || "" },
    block39: { label: "Name of Contracting Officer (print)", value: intake?.coName || "" },
    block40: { label: "Contracting Officer Title",       value: "Contracting Officer" },
    block41: { label: "Date Signed",                     value: "" },
  };
}

export function buildSF30Fields(intake, modData) {
  return {
    block1:  { label: "Contract/Order ID (PIID)",        value: modData?.piid || "" },
    block2:  { label: "Amendment/Modification Number",   value: modData?.modNumber || "" },
    block3:  { label: "Effective Date",                  value: modData?.effectiveDate || "" },
    block4:  { label: "Requisition/Purchase Req Number", value: "" },
    block5:  { label: "Project Number",                  value: "" },
    block6:  { label: "Issued By",                       value: intake?.center || "NASA ARC" },
    block7:  { label: "Administered By",                 value: intake?.center || "NASA ARC" },
    block8:  { label: "Contractor Name and Address",     value: "" },
    block9:  { label: "Code (DUNS/UEI)",                 value: "" },
    block10: { label: "Facility Code",                   value: "" },
    block11: { label: "Ship-To/Mark-For",                value: "" },
    block12: { label: "Accounting Data",                 value: intake?.fundCite || "" },
    block13: { label: "Mod Authority (checkboxes)",      value: modData?.authority || "FAR 43.103(b) — Administrative modification" },
    block14: { label: "Description of Amendment/Mod",   value: modData?.description || "" },
    block15: { label: "Total Amount of Contract Prior To Modification", value: "" },
    block16: { label: "Amount of Modification (+/-)",   value: modData?.modAmount || "$0.00" },
    block17: { label: "Revised Total Amount of Contract", value: "" },
    block18: { label: "Contractor Signature",            value: "" },
    block19: { label: "Contractor Name",                 value: "" },
    block20: { label: "Date Signed (Contractor)",        value: "" },
    block21: { label: "Name of CO (print)",              value: intake?.coName || "" },
    block22: { label: "Signature of CO",                 value: intake?.coName || "" },
    block23: { label: "Date Signed (CO)",                value: "" },
  };
}
