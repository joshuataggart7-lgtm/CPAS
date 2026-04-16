// ─────────────────────────────────────────────────────────────────────────────
// CPAS Regulatory Authority Constants
// Single source of truth for all FAR/NFS/NFS CG citations used in CPAS.
// Update this file when regulations change — do not scatter citations.
//
// Baseline: RFO FAR (Mar 16, 2026) | NFS (Apr 6, 2026) | NFS CG (Apr 6, 2026)
// FAC 2025-06 thresholds in effect.
// ─────────────────────────────────────────────────────────────────────────────

// ── Dollar Thresholds (FAC 2025-06) ─────────────────────────────────────────
export const THRESHOLDS = {
  MICRO_PURCHASE:        15000,     // FAC 2025-06 MPT
  SAT:                   350000,    // FAC 2025-06 SAT
  SB_SUBCONTRACTING:     900000,    // FAC 2025-06 — 52.219-9 threshold
  TINA:                  2500000,   // FAC 2025-06 — certified cost/pricing data
  COMMERCIAL_SIMPLIFIED: 9000000,   // FAR 13.5 commercial simplified threshold
};

// ── JOFOC / Competition ──────────────────────────────────────────────────────
export const JOFOC = {
  // RFO FAR replaces old Part 6 numbering throughout
  STATUTORY_AUTHORITY:   "RFO FAR 6.103",          // 7 statutory exceptions
  UNIQUE_SOURCE:         "RFO FAR 6.103-1",         // formerly FAR 6.302-1
  URGENCY:               "RFO FAR 6.103-2",         // formerly FAR 6.302-2
  INDUSTRIAL_MOBILIZE:   "RFO FAR 6.103-3",         // formerly FAR 6.302-3
  INTL_AGREEMENT:        "RFO FAR 6.103-4",         // formerly FAR 6.302-4
  AUTHORIZED_BY_STATUTE: "RFO FAR 6.103-5",         // formerly FAR 6.302-5 (8a)
  NATIONAL_SECURITY:     "RFO FAR 6.103-6",         // formerly FAR 6.302-6
  ELEMENTS_REQUIRED:     "RFO FAR 6.104-1",         // 11 required elements
  APPROVAL_CHAIN:        "RFO FAR 6.104-2",         // tiered approval authority
  // Approval thresholds (RFO FAR 6.104-2)
  APPROVAL_CO_MAX:       900000,    // ≤$900K — CO self-certifies
  APPROVAL_CA_MAX:       20000000,  // >$900K–$20M — Competition Advocate (not delegable)
  APPROVAL_HCA_MAX:      150000000, // >$20M–$150M — HCA
  // >$150M = SPE
  // Post-award SAM posting (RFO FAR 6.301 — pre-award requirement REMOVED by RFO)
  SAM_POSTING:           "RFO FAR 6.301",
  SAM_DAYS_AFTER_AWARD:  14,        // post within 14 days after award
  SAM_URGENCY_DAYS:      30,        // 30 days for urgency authority (6.103-2)
  SAM_MIN_AVAILABILITY:  30,        // must remain publicly available ≥30 days
};

// ── ANOSCA / NPA (NFS 1805.302 + NFS CG 1805.32) ────────────────────────────
// NOTE: Old NFS 1805.303, 1805.303-71, 1805.303-72 are SUPERSEDED and do not exist.
export const ANOSCA = {
  HQ_ANNOUNCEMENT_AUTH:  "NFS 1805.302",            // $7M+ = HQ public announcement
  NPA_WORKFLOW_AUTH:     "NFS CG 1805.32",           // NPA template + ANOSCA application
  SUPPLEMENTAL_AUTH:     "PIC 26-01",
  HQ_ANNOUNCEMENT_MIN:   7000000,   // $7M–$30M → NPA template (HQ public announcement)
  ANOSCA_MIN:            30000000,  // $30M+ → ANOSCA application
  OPTION_EXERCISE_MIN:   30000000,  // NFS CG 1805.32
  NPA_FORM:              "NASA Notification of Contract Action (NPA)",
};

// ── NEAR / Contract Files ────────────────────────────────────────────────────
// NOTE: NFS Part 1804 is RESERVED in NFS 2026. All NEAR/file requirements in NFS CG.
export const NEAR = {
  POLICY:                "NFS CG 1804.110",          // NEAR mandatory Oct 1, 2024+
  APPLICABILITY:         "NFS CG 1804.111",          // thresholds and scope
  SUBMISSION:            "NFS CG 1804.112",          // submission procedures
  CONTRACT_FILES:        "NFS CG 1804.12",           // official contract file requirements
  FORMAT_STRUCTURE:      "NFS CG 1804.13",           // NEAR folder structure
  FPDS_REPORTING:        "NFS CG 1804.31",           // CAR within 3 business days
  EFFECTIVE_DATE:        "October 1, 2024",          // NEAR mandatory start date
};

// ── COR ──────────────────────────────────────────────────────────────────────
// NOTE: NFS 1801.602-2 is SUPERSEDED. Current authority is NFS 1801.404.
export const COR = {
  AUTHORITY:             "NFS 1801.404",             // COR designation
  CG_PROCEDURES:         "NFS CG 1801.4",            // detailed procedures
  APPOINTMENT_FORM:      "NF 1634",                  // required appointment form
  CG_APPENDIX:           "NFS CG Appendix A",        // template list including NF 1634
  FAC_COR_REQUIRED:      true,
};

// ── PSM / Acquisition Planning ───────────────────────────────────────────────
export const PSM = {
  GENERAL:               "NFS CG 1807.12",           // general procedures
  MEETING:               "NFS CG 1807.13",           // PSM meeting procedures
  SECTIONS_19:           "NFS CG 1807.14",           // 19-section structure
  APPROVAL_AUTH:         "NFS CG 1807.11",           // approval thresholds
  // Approval thresholds (NFS CG 1807.11)
  APPROVAL_CENTER_MAX:   10000000,  // <$10M — center procedures
  APPROVAL_HCA_MAX:      1000000000, // <$1B — HCA (delegable to one level above CO ≤$50M)
  APPROVAL_SPE_MAX:      2000000000, // <$2B — SPE
  // ≥$2B or human spaceflight = CAO
};

// ── Fair Opportunity (Task Orders) ───────────────────────────────────────────
// NOTE: Old FAR 16.505(b)(2) renumbered to RFO FAR 16.507-6(b) in RFO FAR.
export const FAIR_OPPORTUNITY = {
  GENERAL:               "RFO FAR 16.507-6",
  EXCEPTIONS:            "RFO FAR 16.507-6(b)",      // formerly FAR 16.505(b)(2)
  EXCEPTION_SOLE:        "RFO FAR 16.507-6(b)(1)(i)",
  EXCEPTION_URGENCY:     "RFO FAR 16.507-6(b)(1)(ii)",
  EXCEPTION_FOLLOW_ON:   "RFO FAR 16.507-6(b)(1)(iii)",
  EXCEPTION_BEST_INT:    "RFO FAR 16.507-6(b)(1)(iv)",
};

// ── Market Research ──────────────────────────────────────────────────────────
export const MARKET_RESEARCH = {
  AUTHORITY:             "FAR 10.001",
  NFS_PROCEDURES:        "NFS CG 1810.11",
  FORM:                  "NF 1787A",
};

// ── Small Business ───────────────────────────────────────────────────────────
export const SMALL_BUSINESS = {
  RULE_OF_TWO:           "FAR 19.502-2",
  COORDINATION:          "NFS 1819.201",
  FORM:                  "NF 1787",
  SUBK_PLAN:             "FAR 19.704 / 52.219-9",
  SUBK_THRESHOLD:        THRESHOLDS.SB_SUBCONTRACTING,
};

// ── Safety Advisory (Required on all generation prompts) ────────────────────
// Per Grok audit requirement — must appear in every AI generation prompt.
export const AI_SAFETY_ADVISORY =
  "ADVISORY: This output is draft support only. The CO is the decision-maker and must review, edit, and take responsibility for all final documents. Do not present generated text as final legal authority. Cite only the current RFO FAR (Mar 2026), NFS (Apr 2026), and NFS Companion Guide (Apr 2026). If referencing a superseded cite, mark it explicitly as '[superseded — do not use]'.";
