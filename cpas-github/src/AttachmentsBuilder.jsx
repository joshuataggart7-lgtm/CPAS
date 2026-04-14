// CPAS Attachments Builder
// Generates Section J contract attachments
// Batch 4: QASP, CDRL, Payment Milestones, Subk Plan, Key Personnel,
//          OCI, Section 508, CMR, WD Cover Sheet, NDA/SSN, PPQ, Travel

import React, { useState } from "react";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const C = {
  bg: "#f5f7fa", bg2: "#ffffff", bg3: "#eef1f6",
  border: "#dde3ef", blue: "#1a3a6e", text: "#1a2332",
  muted: "#6b7a99", dim: "#8896b0", green: "#0f6e56",
  yellow: "#854f0b", red: "#a32d2d",
};
const inp = { background:"#fff", border:`1px solid ${C.border}`, color:C.text,
  padding:"8px 12px", borderRadius:8, fontSize:12, width:"100%",
  boxSizing:"border-box", fontFamily:FONT, outline:"none" };
const ta = { ...inp, resize:"vertical", minHeight:60, lineHeight:1.6 };
const sel = { ...inp };
const lbl = (t,req) => (
  <div style={{fontSize:10,color:req?C.yellow:C.muted,fontWeight:"600",
    letterSpacing:"0.5px",textTransform:"uppercase",marginBottom:4,marginTop:10,fontFamily:FONT}}>
    {t}{req?" *":""}
  </div>
);

// ── Attachment catalog ────────────────────────────────────────────
const ATTACHMENTS = [
  { id:"QASP",    label:"Quality Assurance Surveillance Plan (QASP)",      icon:"📋", cat:"Performance" },
  { id:"CDRL",    label:"Contract Data Requirements List (CDRL/DRL)",       icon:"📄", cat:"Deliverables" },
  { id:"MILESTONES", label:"Payment Milestones Schedule",                   icon:"💰", cat:"Deliverables" },
  { id:"SUBK",    label:"Small Business Subcontracting Plan",               icon:"🏢", cat:"Small Business" },
  { id:"KEYPERSONNEL", label:"Key Personnel Requirements",                  icon:"👤", cat:"Personnel" },
  { id:"OCI",     label:"OCI Mitigation Plan",                              icon:"⚖️", cat:"Compliance" },
  { id:"508",     label:"Section 508 Accessibility Requirements",           icon:"♿", cat:"Compliance" },
  { id:"CMR",     label:"Contractor Manpower Reporting (CMR)",              icon:"📊", cat:"Reporting" },
  { id:"WD",      label:"Wage Determination Cover Sheet",                   icon:"💵", cat:"Labor" },
  { id:"NDA",     label:"Non-Disclosure Agreement (Source Selection)",      icon:"🔒", cat:"Compliance" },
  { id:"PPQ",     label:"Past Performance Questionnaire (PPQ)",             icon:"⭐", cat:"Evaluation" },
  { id:"TRAVEL",  label:"Travel Cost Policy",                               icon:"✈️", cat:"Cost" },
  { id:"SECURITY", label:"Security Requirements Attachment",                icon:"🛡️", cat:"Compliance" },
  { id:"GFP",     label:"Government-Furnished Property/Equipment List",     icon:"🔧", cat:"Property" },
];

// ── Generators ────────────────────────────────────────────────────

function genQASP(p, i) {
  const title = i?.reqTitle || p.title || "[CONTRACT TITLE]";
  const coName = i?.coName || p.coName || "[CO NAME]";
  const corName = i?.techRepName || p.corName || "[COR NAME]";
  const center = i?.center || p.center || "[NASA CENTER]";
  return `ATTACHMENT [J-X] — QUALITY ASSURANCE SURVEILLANCE PLAN (QASP)
${"=".repeat(70)}

Contract Title:       ${title}
Contract Number:      ${p.contractNumber || "[CONTRACT NUMBER]"}
Contractor:           ${p.contractorName || "[CONTRACTOR NAME]"}
Contracting Officer:  ${coName}
COR:                  ${corName}
Center:               ${center}
Effective Date:       [DATE]

${"─".repeat(70)}

1. PURPOSE AND SCOPE

This Quality Assurance Surveillance Plan (QASP) establishes the Government's approach for surveillance of contractor performance under this contract. The QASP is a living document that may be revised by the Contracting Officer as needed. The COR is responsible for implementing this QASP.

The objective of quality assurance surveillance is to ensure that the Government receives the quality of services called for in the contract, and that the Government pays only for the acceptable level of services received.

2. ROLES AND RESPONSIBILITIES

2.1 Contracting Officer (CO)
The CO is the only individual authorized to modify the terms of the contract. The CO shall:
- Review and approve this QASP and any revisions
- Review COR surveillance reports and take corrective action as warranted
- Issue cure notices, show cause notices, or terminate for default/convenience as appropriate
- Administer contract modifications and approve invoices

2.2 Contracting Officer's Representative (COR)
The COR is designated in writing by the CO and has limited authority. The COR shall:
- Conduct surveillance per this QASP
- Document contractor performance (acceptable/unacceptable)
- Notify the CO immediately of any performance deficiency
- Review and recommend approval/rejection of invoices
- Maintain a COR file documenting all surveillance activities

The COR is NOT authorized to direct changes, modify contract terms, authorize work beyond scope, or make commitments that bind the Government.

2.3 Contractor
The contractor is responsible for establishing and maintaining quality control sufficient to meet contract requirements. The contractor shall:
- Perform all work per the Statement of Work (SOW/PWS)
- Notify the COR promptly of any issues that may affect performance
- Respond to Government concerns within [X] business days

3. SURVEILLANCE METHODS

The following surveillance methods will be used, as appropriate:

  Method                    Description
  ─────────────────────     ──────────────────────────────────────────
  Random Sampling           Periodic unannounced inspection of work product
  100% Inspection           All deliverables inspected before acceptance
  Customer Feedback         Input from end users and mission stakeholders
  Periodic Review           Scheduled review meetings with contractor
  Document Review           Review of reports, logs, and deliverable documentation
  Direct Observation        On-site observation of work performance

4. PERFORMANCE STANDARDS AND SURVEILLANCE SCHEDULE

${p.qaspItems?.length ? p.qaspItems.map((item, i) =>
`4.${i+1} ${item.task || `Task ${i+1}`}
  Performance Standard: ${item.standard || "[DEFINE ACCEPTABLE PERFORMANCE LEVEL]"}
  Surveillance Method:  ${item.method || "Periodic Review / 100% Inspection"}
  Frequency:            ${item.frequency || "Monthly"}
  Acceptable Quality Level (AQL): ${item.aql || "[DEFINE AQL — e.g., ≥95% on-time delivery]"}
  Consequence of Deficiency: ${item.consequence || "Written notice; cure notice if not corrected within [X] days"}
`).join("\n") :
`4.1 [PRIMARY TASK — from SOW]
  Performance Standard: [DESCRIBE ACCEPTABLE PERFORMANCE]
  Surveillance Method:  Periodic Review / 100% Inspection
  Frequency:            Monthly
  AQL:                  [e.g., ≥95% on-time; zero critical defects]
  Consequence:          Written notice; CO notified; cure notice if uncorrected

4.2 [SECONDARY TASK — from SOW]
  Performance Standard: [DESCRIBE ACCEPTABLE PERFORMANCE]
  Surveillance Method:  Random Sampling
  Frequency:            Quarterly
  AQL:                  [DEFINE]
  Consequence:          Written notice to contractor

[NOTE TO CO: Add one row per major task/deliverable in the SOW. AQLs should be measurable and tied to contract requirements.]`}

5. INVOICE REVIEW

The COR shall review each invoice against actual services rendered before recommending approval. The COR shall:
- Verify services were actually performed
- Confirm period covered matches the invoice
- Check that rates and amounts are correct per contract
- Document any discrepancies and notify the CO
- Recommend approval or rejection within [X] business days of receipt

6. PERFORMANCE ASSESSMENT REPORTING

6.1 Monthly Surveillance Reports
The COR shall prepare a monthly surveillance report documenting:
- Tasks/deliverables reviewed during the period
- Surveillance method used
- Acceptability determination (Acceptable / Unacceptable)
- Any deficiencies identified and contractor corrective actions

6.2 CPARS
The CO shall submit a past performance evaluation in the Contractor Performance Assessment Reporting System (CPARS) per FAR 42.1502 and NFS 1842.1502. Evaluations are due annually and at contract completion. The COR shall provide input to the CO for CPARS.

6.3 Deficiency Reporting
When a deficiency is identified:
  (1) COR documents the deficiency in writing
  (2) COR provides written notice to contractor
  (3) Contractor responds within [X] business days with corrective action plan
  (4) COR monitors corrective action and reports to CO
  (5) If not corrected, CO may issue cure notice (FAR 49.607) or show cause notice

7. DOCUMENT RETENTION
All surveillance records, reports, and correspondence shall be maintained in the contract file in accordance with FAR 4.802 and NASA NPR 1441.1.

${"─".repeat(70)}
Approved:

Contracting Officer: ___________________________  Date: ___________
Printed Name: ${coName}

COR Acknowledgment: ___________________________  Date: ___________
Printed Name: ${corName}`;
}

function genCDRL(p, i) {
  const title = i?.reqTitle || p.title || "[CONTRACT TITLE]";
  return `ATTACHMENT [J-X] — CONTRACT DATA REQUIREMENTS LIST (CDRL / DATA REQUIREMENTS LIST)
${"=".repeat(70)}

Contract Title:    ${title}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Contractor:        ${p.contractorName || "[CONTRACTOR NAME]"}
Date:              [DATE]

AUTHORITY: FAR 52.227-16 (Additional Data Requirements, if applicable); Contract Section C (SOW)

${"─".repeat(70)}

INSTRUCTIONS: This list identifies all data items to be delivered under this contract.
"DI Number" refers to the applicable Data Item Description (DID) if using standard DIDs.
All data shall be delivered in the format and media specified.

${"─".repeat(70)}

Item  DI/Ref    Data Item Title                    Freq      Due Date      Format       Copies  Distribution
────  ────────  ─────────────────────────────────  ────────  ────────────  ───────────  ──────  ─────────────
0001  [DI-REF]  Monthly Progress Report             Monthly   15th of mo.   Electronic  1       COR + CO
0002  [DI-REF]  Quarterly Technical Status Report   Qtrly     30 days EoQ   Electronic  1       COR + CO
0003  [DI-REF]  Final Report / Completion Report    Once      30 days EoP   Electronic  2       COR + CO
0004  [DI-REF]  [DATA ITEM TITLE]                   [FREQ]    [DATE]        [FORMAT]    [#]     [DIST]
0005  [DI-REF]  [DATA ITEM TITLE]                   [FREQ]    [DATE]        [FORMAT]    [#]     [DIST]

[NOTE TO CO: Add one row per data item required by the SOW. If data rights apply, reference the Data Rights Attachment. For R&D contracts, consider referencing applicable DIDs from the DoD DID library or NASA-specific data requirements.]

${"─".repeat(70)}

DELIVERY INSTRUCTIONS:
All deliverables shall be submitted electronically to:
  COR: ${i?.techRepName || p.corName || "[COR NAME]"} — [COR EMAIL]
  CO:  ${i?.coName || p.coName || "[CO NAME]"} — [CO EMAIL]

Unless otherwise specified, electronic files shall be submitted in [PDF / MS Word / specified format].
All reports shall be marked with the contract number and CDRL item number.

DATA RIGHTS:
All data delivered under this contract shall be subject to the rights provisions in
Section I and the Data Rights Attachment (if included as Attachment [J-X]).
Unmarked data shall be treated as having unlimited rights per FAR 52.227-14.`;
}

function genMilestones(p, i) {
  const title = i?.reqTitle || p.title || "[CONTRACT TITLE]";
  const value = parseFloat(i?.value || p.value || 0);
  return `ATTACHMENT [J-X] — PAYMENT MILESTONES SCHEDULE
${"=".repeat(70)}

Contract Title:    ${title}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Contractor:        ${p.contractorName || "[CONTRACTOR NAME]"}
Total Value:       $${value.toLocaleString()}
Contract Type:     ${i?.contractType || p.contractType || "[CONTRACT TYPE]"}
Date:              [DATE]

AUTHORITY: FAR 32.1 (Financing); FAR 52.232-32 (Performance-Based Payments) if applicable

${"─".repeat(70)}

PAYMENT BASIS: ${p.paymentType === "MILESTONE" ? "Milestone-Based (payment upon acceptance of deliverable)" : p.paymentType === "PERIODIC" ? "Periodic (monthly/quarterly billing)" : "Milestone-Based (payment upon Government acceptance of each milestone)"}

${p.milestones?.length ? `MILESTONE SCHEDULE:

Milestone  Description                          % Complete  Value         Acceptance Criteria          Due Date
─────────  ───────────────────────────────────  ──────────  ────────────  ───────────────────────────  ─────────────
${p.milestones.map((m, idx) => `${String(idx+1).padEnd(9)}  ${(m.desc||"[DESCRIPTION]").padEnd(35)}  ${(m.pct||"").toString().padEnd(10)}  $${(parseFloat(m.value||0)).toLocaleString().padEnd(12)}  ${(m.acceptance||"[ACCEPTANCE CRITERIA]").padEnd(27)}  ${m.dueDate||"[DATE]"}`).join("\n")}` :
`MILESTONE SCHEDULE:

Milestone  Description                          % Complete  Value         Acceptance Criteria          Due Date
─────────  ───────────────────────────────────  ──────────  ────────────  ───────────────────────────  ─────────────
1          Contract Award / Kickoff Meeting      10%         $[AMOUNT]     Kickoff meeting held         Award + 30d
2          [INTERIM MILESTONE — e.g., PDR]       25%         $[AMOUNT]     [ACCEPTANCE CRITERIA]        [DATE]
3          [INTERIM MILESTONE — e.g., CDR]       50%         $[AMOUNT]     [ACCEPTANCE CRITERIA]        [DATE]
4          [INTERIM MILESTONE — e.g., Delivery]  75%         $[AMOUNT]     [ACCEPTANCE CRITERIA]        [DATE]
5          Final Acceptance / Completion         100%        $[AMOUNT]     Written acceptance by CO     [PoP End]
                                                             ────────────
                                                   TOTAL:    $${value.toLocaleString()}

[NOTE TO CO: Customize milestones per SOW deliverable schedule. Milestone values should sum to total contract value. Each milestone must have clear, objectively verifiable acceptance criteria to avoid disputes.]`}

${"─".repeat(70)}

PAYMENT PROCEDURES:
1. Contractor submits invoice to payment system ([IPP / IPPS-A]) referencing milestone number
2. COR verifies milestone completion and recommends acceptance within [X] business days
3. CO approves invoice within [X] business days of COR recommendation
4. Payment processed within 30 days of invoice approval per Prompt Payment Act (31 U.S.C. § 3903)

DISPUTES: In the event of a dispute regarding milestone completion, the Disputes clause (FAR 52.233-1) applies.`;
}

function genSubk(p, i) {
  const value = parseFloat(i?.value || p.value || 0);
  return `ATTACHMENT [J-X] — SMALL BUSINESS SUBCONTRACTING PLAN
${"=".repeat(70)}

AUTHORITY: FAR 52.219-9; FAR 19.704; 15 U.S.C. § 637(d)

Note: This plan is REQUIRED for contracts over $900,000 awarded to other than small business concerns, unless a commercial subcontracting plan is approved.

${"─".repeat(70)}

CONTRACTOR:           ${p.contractorName || "[CONTRACTOR NAME]"}
CONTRACT TITLE:       ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
CONTRACT NUMBER:      ${p.contractNumber || "[CONTRACT NUMBER]"}
CONTRACT VALUE:       $${value.toLocaleString()}
PERIOD OF PLAN:       [CONTRACT START DATE] through [CONTRACT END DATE]
NAICS:                ${i?.naics || p.naics || "[NAICS]"}
DATE SUBMITTED:       [DATE]

${"─".repeat(70)}

SECTION 1 — GOALS

The Contractor agrees to the following subcontracting goals, expressed as a percentage
of total estimated subcontracting dollars:

  Business Category                    Goal (%)   Estimated $ Amount
  ──────────────────────────────────   ────────   ──────────────────
  Small Business (SB)                  [  ]%      $[AMOUNT]
  Small Disadvantaged Business (SDB)   [  ]%      $[AMOUNT]
  Women-Owned Small Business (WOSB)    [  ]%      $[AMOUNT]
  HUBZone Small Business               [  ]%      $[AMOUNT]
  Service-Disabled Veteran-Owned SB    [  ]%      $[AMOUNT]
  Veteran-Owned Small Business (VOSB)  [  ]%      $[AMOUNT]

[NOTE TO CO: Goals should be expressed as percentages of total subcontracting dollars, not total contract value. Negotiate goals with contractor before award. Goals must be consistent with the CO's determination of what is practicable.]

SECTION 2 — DESCRIPTION OF SUBCONTRACTING OPPORTUNITIES

[CONTRACTOR TO COMPLETE: Describe the principal types of supplies and services to be subcontracted, and the types of small business concerns expected to be used.]

SECTION 3 — METHOD FOR IDENTIFYING SMALL BUSINESS CONCERNS

The Contractor will use the following methods to identify and develop small business subcontractors:
- SAM.gov / Dynamic Small Business Search (DSBS)
- NASA Small Business Industry Day events
- [OTHER METHODS]

SECTION 4 — ADMINISTRATIVE SUPPORT

The following individual is responsible for administering this plan:
  Name:   [NAME]
  Title:  [TITLE]
  Phone:  [PHONE]
  Email:  [EMAIL]

SECTION 5 — FLOW-DOWN TO SUBCONTRACTORS

The Contractor agrees to include FAR 52.219-8 (Utilization of Small Business Concerns) in all subcontracts that offer further subcontracting opportunities.

SECTION 6 — REPORTING

The Contractor shall submit Individual Subcontracting Reports (ISR) and Summary Subcontracting Reports (SSR) via the Electronic Subcontracting Reporting System (eSRS) at www.esrs.gov per FAR 52.219-9 and NFS 1852.219-75.

SECTION 7 — GOOD FAITH EFFORT

The Contractor agrees to make a good faith effort to comply with this plan and to cooperate in any studies or surveys regarding subcontracting. Failure to comply in good faith may result in liquidated damages per FAR 52.219-16.

${"─".repeat(70)}

CERTIFICATION

I certify that this plan was submitted in good faith and that the information provided is accurate and complete.

Contractor Signature: ___________________________ Date: ___________
Printed Name/Title:   ___________________________
CO Acceptance:        ___________________________ Date: ___________`;
}

function genKeyPersonnel(p, i) {
  return `ATTACHMENT [J-X] — KEY PERSONNEL REQUIREMENTS
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}

AUTHORITY: FAR 52.237-6 (Continuity of Services) — if applicable; Contract Section H

${"─".repeat(70)}

1. KEY PERSONNEL DESIGNATION

The following positions are designated as Key Personnel under this contract.
Key Personnel are considered essential to successful contract performance.
The Contractor shall not substitute or remove Key Personnel without prior
written approval from the Contracting Officer.

  Position              Name (at award)         Min. Qualifications
  ──────────────────    ─────────────────────   ─────────────────────────────────────
  Program Manager       [NAME AT AWARD]         [MINIMUM QUALIFICATIONS — e.g., 10 yrs exp, PMP]
  [KEY POSITION 2]      [NAME AT AWARD]         [MINIMUM QUALIFICATIONS]
  [KEY POSITION 3]      [NAME AT AWARD]         [MINIMUM QUALIFICATIONS]

[NOTE TO CO: Limit Key Personnel designations to positions that are truly essential. Over-designation creates unnecessary administrative burden. Coordinate with the COR on required qualifications.]

2. SUBSTITUTION PROCEDURES

If the Contractor proposes to substitute a Key Personnel member, the Contractor shall:
  (a) Notify the CO and COR in writing at least [30] calendar days before the proposed substitution
  (b) Submit a resume for the proposed replacement demonstrating equivalent qualifications
  (c) Obtain prior written approval from the CO before effecting the substitution

In cases of emergency substitution (e.g., death, disability, immediate resignation):
  (a) Notify the CO and COR within [5] business days
  (b) Submit a resume for a qualified replacement within [15] business days
  (c) Obtain CO approval before the replacement begins work under this contract

3. QUALIFICATIONS REQUIREMENTS

For each Key Personnel position, the Contractor shall maintain:
  - Applicable licenses and certifications as specified
  - Minimum experience levels as specified in the SOW
  - Security clearance/access credentials required for this contract

4. CONSEQUENCES OF UNAUTHORIZED SUBSTITUTION

Unauthorized substitution of Key Personnel without CO approval may constitute a
material breach of contract and may result in:
  - Issuance of a cure notice per FAR 49.607
  - Withholding of payment for work performed by unauthorized personnel
  - Termination for default in cases of repeated violations`;
}

function genOCI(p, i) {
  return `ATTACHMENT [J-X] — ORGANIZATIONAL CONFLICT OF INTEREST (OCI) MITIGATION PLAN
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Contractor:        ${p.contractorName || "[CONTRACTOR NAME]"}
Date:              [DATE]

AUTHORITY: FAR Subpart 9.5; FAR 9.504; FAR 9.506

${"─".repeat(70)}

1. PURPOSE

This Organizational Conflict of Interest (OCI) Mitigation Plan is submitted in accordance
with FAR Subpart 9.5 to identify and mitigate any actual or potential OCI arising from
performance of this contract.

2. OCI ASSESSMENT

${p.ociType ? `The Contractor has identified the following potential OCI:

Type:        ${p.ociType}
Description: ${p.ociDescription || "[DESCRIBE THE POTENTIAL OCI]"}
` : `After thorough review, the Contractor [has/has not] identified the following
potential OCI concerns:

  [ ] Biased Ground Rules — Contractor drafted specifications or work statements
      used as the basis for this acquisition
  [ ] Unequal Access to Information — Contractor has access to non-public
      Government information that may provide competitive advantage
  [ ] Impaired Objectivity — Contractor's work may require it to evaluate its own
      products, services, or performance

[NOTE TO CO: If no OCI exists, Contractor should affirmatively represent "no OCI identified" with supporting basis. If OCI exists, describe and mitigate.]`}

3. MITIGATION MEASURES

The Contractor proposes the following measures to eliminate or mitigate the identified OCI:

  ${p.ociMitigation || `[ ] Organizational separation (firewall) between affected and unaffected business units
  [ ] Personnel exclusion — specific individuals excluded from this contract
  [ ] Limitations on future contracting for related work
  [ ] Disclosure and consent from the Government
  [ ] Other: [DESCRIBE]`}

4. MONITORING AND REPORTING

The Contractor shall:
  (a) Monitor for new OCI throughout contract performance
  (b) Immediately notify the CO in writing if a new OCI arises
  (c) Propose additional mitigation measures as needed

5. CONTRACTOR CERTIFICATION

I certify that the information provided in this OCI Mitigation Plan is accurate and
complete, and that the proposed mitigation measures are sufficient to neutralize or
avoid the identified OCI.

Contractor Representative: ___________________________ Date: ___________
Printed Name/Title:        ___________________________

CO Review/Acceptance:      ___________________________ Date: ___________
[NOTE TO CO: CO must document OCI determination in the contract file per FAR 9.506.]`;
}

function gen508(p, i) {
  return `ATTACHMENT [J-X] — SECTION 508 ACCESSIBILITY REQUIREMENTS
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Date:              [DATE]

AUTHORITY: Section 508 of the Rehabilitation Act (29 U.S.C. § 794d);
           FAR 39.2; FAR 52.239-2 (when applicable);
           Access Board ICT Standards (36 CFR Part 1194)

${"─".repeat(70)}

1. APPLICABILITY

This attachment applies to all Electronic and Information Technology (EIT) / Information
and Communication Technology (ICT) developed, procured, maintained, or used under this
contract that will be used by Federal employees or members of the public.

2. STANDARDS

All ICT deliverables shall conform to the Revised 508 Standards (36 CFR Part 1194),
which incorporate the Web Content Accessibility Guidelines (WCAG) 2.0 Level AA as the
baseline standard. Applicable technical standards include:

  - Web-based content: WCAG 2.0 Level AA
  - Software: Chapter 5 of Revised 508 Standards
  - Hardware: Chapter 4 of Revised 508 Standards
  - Documentation and support content: Chapter 6
  - Authoring tools: Chapter 5

3. CONTRACTOR REQUIREMENTS

The Contractor shall:
  (a) Design, develop, and deliver all ICT in conformance with the 508 Standards
  (b) Provide an Accessibility Conformance Report (ACR) based on the Voluntary
      Product Accessibility Template (VPAT) for all ICT deliverables
  (c) Identify any exceptions, limitations, or areas of non-conformance
  (d) Remediate non-conforming ICT within [X] days of Government identification

4. EXCEPTIONS

The following exceptions may apply (CO must document basis):
  [ ] Undue burden (FAR 39.204) — documented agency determination required
  [ ] Fundamental alteration — documented determination required
  [ ] Non-public facing internal use only

5. TESTING AND CERTIFICATION

Prior to delivery, the Contractor shall test ICT deliverables for 508 conformance
using industry-standard automated and manual testing methods. The Contractor shall
submit test results with each deliverable.

[NOTE TO CO: For IT contracts, include FAR 39.2 provisions and reference NASA's 508
program coordinator. Contact NASA HQ IT Accessibility Program for additional guidance.]`;
}

function genCMR(p, i) {
  const center = i?.center || p.center || "[NASA CENTER]";
  return `ATTACHMENT [J-X] — CONTRACTOR MANPOWER REPORTING (CMR)
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Contractor:        ${p.contractorName || "[CONTRACTOR NAME]"}
Center:            ${center}
Date:              [DATE]

AUTHORITY: OMB Circular A-76; OFPP Policy Letter 11-01;
           NASA NPR 2810.1; NASA Contractor Manpower Reporting guidance

${"─".repeat(70)}

1. REQUIREMENT

The Contractor shall report ALL contractor labor hours (including subcontractor hours)
expended in performance of this contract to the NASA Contractor Manpower Reporting
Application (CMRA) or successor system annually.

This requirement applies to all service contracts as defined in OFPP Policy Letter 11-01,
regardless of dollar value, contract type, or place of performance.

2. REPORTING SCHEDULE

The Contractor shall submit the annual CMR report no later than [October 31] of each
year covering the Government fiscal year (October 1 through September 30).

For the base year: Report due [FIRST OCTOBER 31 AFTER PERFORMANCE BEGINS]

3. REQUIRED DATA ELEMENTS

For each reporting period, the Contractor shall report:
  - Contract number (PIID)
  - Direct labor hours by labor category
  - Indirect labor hours (if applicable)
  - Subcontractor labor hours by tier
  - Place(s) of performance
  - Function/mission area supported
  - Fully-burdened labor rates (if required by CO)

4. SYSTEM ACCESS

Reports shall be submitted via: [NASA CMRA SYSTEM URL]
The CO will provide system access instructions following contract award.

5. COMPLIANCE

Failure to submit timely and accurate CMR reports may result in:
  - Withholding of final payment pending report submission
  - Adverse past performance assessment
  - Notification to the requiring activity

[NOTE TO CO: CMR is required on all service contracts per OFPP Policy Letter 11-01.
Coordinate with the center workforce management office for local reporting requirements.]`;
}

function genWD(p, i) {
  const placeOfPerf = p.placeOfPerf || i?.center || "[PLACE OF PERFORMANCE]";
  return `ATTACHMENT [J-X] — WAGE DETERMINATION COVER SHEET
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Place of Performance: ${placeOfPerf}
Date Incorporated: [DATE]

AUTHORITY: Service Contract Labor Standards (41 U.S.C. §§ 6701-6707);
           FAR 22.1006(a); FAR 52.222-41

${"─".repeat(70)}

WAGE DETERMINATION INFORMATION:

  WD Number:          [WD NUMBER — from SAM.gov/WDOL]
  Revision Number:    [REVISION NUMBER]
  Date of WD:         [DATE — must be current at time of solicitation and award]
  Applicable Area:    ${placeOfPerf}
  WD Type:            [ ] Standard   [ ] CBA-Based   [ ] Conformed

  Source: SAM.gov Wage Determinations Online (WDOL)
          https://sam.gov/wage-determinations

${"─".repeat(70)}

INCORPORATION STATEMENT:

The Wage Determination identified above is hereby incorporated into this contract
as Attachment [J-X] pursuant to FAR 52.222-41 (Service Contract Labor Standards).
The Contractor shall pay all service employees performing work under this contract
not less than the wages and fringe benefits set forth in the applicable Wage Determination.

CONFORMANCE PROCEDURES: If the Contractor employs service employees in job classes
not listed in the WD, the Contractor must submit a conformance request per FAR 22.1019.

UPDATE PROCEDURE: If the contract extends beyond one year, the CO shall incorporate
an updated WD at each option exercise or contract extension in accordance with FAR 22.1007.

${"─".repeat(70)}

⚠ ACTION REQUIRED — CO CHECKLIST:
  [ ] Obtain current WD from SAM.gov/WDOL at time of solicitation release
  [ ] Re-verify WD currency immediately before contract award
  [ ] Update WD at each option exercise
  [ ] File copy of WD in contract file
  [ ] Reference WD number in Section J list and Section I (52.222-41 fill-in)

[NOTE: The actual Wage Determination document from DOL/SAM.gov must be attached
after this cover sheet. CPAS cannot generate WD text — obtain from SAM.gov.]`;
}

function genNDA(p, i) {
  return `ATTACHMENT [J-X] — NON-DISCLOSURE AGREEMENT (SOURCE SELECTION SENSITIVE)
${"=".repeat(70)}

Acquisition Title:  ${i?.reqTitle || p.title || "[ACQUISITION TITLE]"}
Solicitation No.:   ${p.solNumber || "[SOLICITATION NUMBER]"}
Center:             ${i?.center || p.center || "[NASA CENTER]"}
Date:               [DATE]

AUTHORITY: FAR 3.104 (Procurement Integrity); FAR 15.306(e)

${"─".repeat(70)}

AGREEMENT

This Non-Disclosure Agreement (NDA) is entered into between the United States Government,
acting through the National Aeronautics and Space Administration (NASA), and the individual
identified below, in connection with the source selection for the above-referenced acquisition.

By signing below, the individual agrees to the following:

1. PROTECTED INFORMATION
I understand that I may have access to Source Selection Sensitive (SSS) information,
including but not limited to: offeror proposals, price/cost data, technical information,
past performance data, evaluation records, and source selection board deliberations.

2. NON-DISCLOSURE OBLIGATION
I agree not to disclose any Source Selection Sensitive information to any person not
officially involved in and authorized to participate in this source selection. This
obligation continues after my participation in the source selection ends.

3. PROCUREMENT INTEGRITY
I understand and will comply with the Procurement Integrity Act (41 U.S.C. § 2101 et seq.)
and FAR 3.104. I will not:
  - Disclose contractor bid or proposal information or source selection information
  - Solicit or receive information from offerors that would give them an unfair advantage
  - Accept any gift, gratuity, or benefit related to this procurement

4. CONFLICT OF INTEREST
I certify that to the best of my knowledge I have no financial interest in any offeror
that could create an actual or apparent conflict of interest, and I will immediately
notify the Source Selection Authority if I become aware of any such conflict.

5. PENALTY FOR VIOLATION
I understand that violation of the Procurement Integrity Act may result in criminal
penalties (up to 5 years imprisonment and fines), civil penalties, and administrative
actions including removal from Federal service.

${"─".repeat(70)}

ACKNOWLEDGMENT

Name (print):   ___________________________
Title:          ___________________________
Organization:   ___________________________
Signature:      ___________________________   Date: ___________

Witness:        ___________________________   Date: ___________

[NOTE TO CO: Obtain signed NDA from all source selection personnel (SSA, SSAC/SSEB members,
advisors, and anyone with access to proposals) before providing access to offeror information.
Retain in source selection file.]`;
}

function genPPQ(p, i) {
  return `ATTACHMENT [J-X] — PAST PERFORMANCE QUESTIONNAIRE (PPQ)
${"=".repeat(70)}

Acquisition Title:  ${i?.reqTitle || p.title || "[ACQUISITION TITLE]"}
Solicitation No.:   ${p.solNumber || "[SOLICITATION NUMBER]"}
Center:             ${i?.center || p.center || "[NASA CENTER]"}

INSTRUCTIONS TO OFFERORS: Submit this questionnaire to your references. References
should return completed questionnaires directly to [CO EMAIL] by [DATE].

INSTRUCTIONS TO REFERENCES: Please complete all sections. Your response will be
used to evaluate this offeror's past performance. Responses are Source Selection
Sensitive and will be protected from disclosure.

${"─".repeat(70)}

SECTION A — CONTRACT INFORMATION (Completed by Offeror)

  Offeror Name:         ___________________________
  Contract Number:      ___________________________
  Contract Title:       ___________________________
  Contract Value:       $___________________________
  Period of Performance: ____________ to ____________
  Contract Type:        [ ] FFP  [ ] CPFF  [ ] T&M  [ ] IDIQ  [ ] Other: ___
  Place of Performance: ___________________________
  Customer Organization: ___________________________

${"─".repeat(70)}

SECTION B — REFERENCE INFORMATION (Completed by Reference)

  Reference Name:       ___________________________
  Title:                ___________________________
  Organization:         ___________________________
  Phone:                ___________________________
  Email:                ___________________________
  Relationship:         [ ] CO  [ ] COR  [ ] Program Manager  [ ] Other: ___

${"─".repeat(70)}

SECTION C — PERFORMANCE RATINGS

Please rate the contractor's performance using the following scale:
  E = Exceptional  |  VG = Very Good  |  S = Satisfactory  |  M = Marginal  |  U = Unsatisfactory  |  N/A

  Performance Area                              Rating    Comments
  ─────────────────────────────────────────     ──────    ──────────────────────────────────────
  Quality of work / deliverables                [    ]    ___________________________________
  Schedule / on-time delivery                   [    ]    ___________________________________
  Cost control / within budget                  [    ]    ___________________________________
  Technical capability                          [    ]    ___________________________________
  Management / key personnel                    [    ]    ___________________________________
  Customer service / responsiveness             [    ]    ___________________________________
  Problem identification and resolution         [    ]    ___________________________________
  Compliance with contract terms                [    ]    ___________________________________
  Small business utilization (if applicable)    [    ]    ___________________________________

${"─".repeat(70)}

SECTION D — NARRATIVE ASSESSMENT

1. Describe the nature of the work performed and its relevance to the current requirement:
   ________________________________________________________________________________
   ________________________________________________________________________________

2. What were the contractor's most significant accomplishments?
   ________________________________________________________________________________

3. Were there any significant problems? If so, how were they resolved?
   ________________________________________________________________________________

4. Would you award another contract to this contractor for similar work?
   [ ] Yes, without reservation    [ ] Yes, with reservations    [ ] No
   If No or with reservations, please explain: _______________________________________

5. Overall Performance Rating: [ ] E  [ ] VG  [ ] S  [ ] M  [ ] U

${"─".repeat(70)}

Reference Signature: ___________________________  Date: ___________
[Questionnaire is Source Selection Sensitive — return directly to CO, not to offeror]`;
}

function genTravel(p, i) {
  return `ATTACHMENT [J-X] — TRAVEL COST POLICY
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Date:              [DATE]

AUTHORITY: FAR 31.205-46 (Travel Costs); JTR (Joint Travel Regulations);
           Federal Travel Regulation (FTR, 41 CFR Chapters 300-304)

${"─".repeat(70)}

1. APPLICABILITY

This attachment governs all travel costs incurred by the Contractor and subcontractors
in performance of this contract. Travel costs must be allowable, allocable, and reasonable
per FAR 31.205-46.

2. PRIOR APPROVAL

All travel under this contract requires prior written approval from the COR, except for
travel that is specifically authorized in the contract SOW. The Contractor shall submit
travel requests including:
  - Purpose of travel
  - Destination(s)
  - Estimated costs
  - Duration
  - Personnel traveling

3. ALLOWABLE TRAVEL COSTS

Allowable travel costs include:
  (a) Transportation: Actual cost, coach/economy class air travel required unless
      business class is authorized in writing by the CO (per FAR 31.205-46(b))
  (b) Lodging: Actual cost not to exceed applicable GSA per diem rates
  (c) Meals and Incidentals (M&IE): GSA M&IE per diem rates for destination
  (d) Ground transportation: Actual reasonable cost; rental cars must use Government rate
  (e) Miscellaneous: Actual cost of baggage fees, parking, tolls

  Per Diem Rates: https://www.gsa.gov/travel/plan-book/per-diem-rates

4. UNALLOWABLE TRAVEL COSTS

The following costs are NOT allowable per FAR 31.205-46:
  - First class or business class airfare (unless specifically authorized)
  - Costs for spouse/family travel
  - Costs exceeding applicable per diem rates (unless justified and approved)
  - Alcoholic beverages
  - Personal entertainment
  - Travel costs for work not related to this contract

5. DOCUMENTATION REQUIREMENTS

The Contractor shall maintain and provide documentation for all travel costs, including:
  - Original receipts for all lodging and transportation
  - Per diem calculations by day
  - Boarding passes or itineraries
  - Prior approval documentation
  - Justification for any costs exceeding per diem

6. TRAVEL ESTIMATES IN PROPOSALS/TASK ORDERS

Travel estimates shall be based on current GSA per diem rates. The CO reserves the right
to question travel costs that exceed applicable rates without documented justification.

[NOTE TO CO: Include this attachment for contracts where travel is anticipated.
Verify that the SOW specifically identifies travel requirements and authority.]`;
}

function genSecurity(p, i) {
  return `ATTACHMENT [J-X] — SECURITY REQUIREMENTS
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Center:            ${i?.center || p.center || "[NASA CENTER]"}
Date:              [DATE]

AUTHORITY: NASA NPD 1600.2; NPR 1620.3; NPR 2810.1; FAR 52.204-2;
           Homeland Security Presidential Directive 12 (HSPD-12)

${"─".repeat(70)}

1. PERSONNEL SECURITY

1.1 Background Investigation
All contractor personnel requiring access to NASA facilities or IT systems shall
obtain and maintain the appropriate background investigation:

  [ ] National Agency Check with Inquiries (NACI) — for facility access
  [ ] Moderate Risk Background Investigation (MBI) — for IT systems
  [ ] High Risk Background Investigation (BI) — for sensitive IT systems
  [ ] Security Clearance Required: [ ] Secret  [ ] Top Secret  [ ] TS/SCI

1.2 Identity Verification / PIV
Per FAR 52.204-9 and HSPD-12, all contractor personnel requiring routine physical
access to NASA facilities shall obtain a NASA Personal Identity Verification (PIV)
credential. The Contractor shall coordinate PIV issuance with:
  [CENTER SECURITY OFFICE CONTACT]

2. FACILITY ACCESS

2.1 Access Procedures
Contractor personnel shall comply with all NASA center access procedures including:
  - Check-in at security office upon first visit
  - Escort requirements for areas requiring special access
  - Vehicle registration procedures
  - Visitor control procedures

2.2 Restricted Areas
The following areas require special authorization: [IDENTIFY RESTRICTED AREAS]

3. INFORMATION TECHNOLOGY SECURITY

3.1 NASA IT Systems
Contractor personnel accessing NASA IT systems shall comply with:
  - NASA NPR 2810.1 (Security of Information Technology)
  - IT Security training requirements
  - Authority to Operate (ATO) requirements for contractor-owned systems

3.2 Controlled Unclassified Information (CUI)
If performance involves CUI, the Contractor shall comply with:
  - NIST SP 800-171 (Protecting CUI in Nonfederal Systems)
  - NASA CUI policy
  - Incident reporting requirements (72-hour notification)

4. REPORTING REQUIREMENTS

The Contractor shall immediately report to the CO and center security office:
  - Security incidents or suspected breaches
  - Arrests or adverse actions against cleared personnel
  - Foreign travel by personnel with access to classified/sensitive information

[NOTE TO CO: Tailor this attachment to the specific security requirements of the
acquisition. Coordinate with the center security office and IT security before
finalizing. If classified work is involved, a DD Form 254 is required.]`;
}

function genGFP(p, i) {
  return `ATTACHMENT [J-X] — GOVERNMENT-FURNISHED PROPERTY / EQUIPMENT LIST
${"=".repeat(70)}

Contract Title:    ${i?.reqTitle || p.title || "[CONTRACT TITLE]"}
Contract Number:   ${p.contractNumber || "[CONTRACT NUMBER]"}
Contractor:        ${p.contractorName || "[CONTRACTOR NAME]"}
Date:              [DATE]

AUTHORITY: FAR 52.245-1 (Government Property); NFS 1852.245-70 (Dated Material)

${"─".repeat(70)}

INSTRUCTIONS: This list identifies all Government-Furnished Property (GFP) and
Government-Furnished Equipment (GFE) to be provided to the Contractor for performance
of this contract. The Contractor is responsible for the proper use, maintenance,
and return of all GFP/GFE per FAR 52.245-1.

${"─".repeat(70)}

ITEM  DESCRIPTION                    QUANTITY  NSN / PART NO.    EST. VALUE    DELIVERY DATE  CONDITION
────  ─────────────────────────────  ────────  ────────────────  ────────────  ─────────────  ─────────
0001  [GFP ITEM 1]                   [QTY]     [NSN/PART]        $[VALUE]      [DATE]         [COND]
0002  [GFP ITEM 2]                   [QTY]     [NSN/PART]        $[VALUE]      [DATE]         [COND]
0003  [GFP ITEM 3 — Government-      [QTY]     [NSN/PART]        $[VALUE]      [DATE]         [COND]
      Furnished Computer Software]

[NOTE TO CO: List all GFP/GFE by item. Include: scientific instruments, datasets,
facilities, vehicles, software licenses, and any other Government property.
If GFP includes software, also reference 1852.227-88 in Section I.]

${"─".repeat(70)}

GFP RESPONSIBILITIES

The Contractor shall:
  (a) Use GFP only for performance of this contract
  (b) Maintain and protect GFP in good condition, normal wear excepted
  (c) Report damaged, lost, or destroyed GFP to the CO within [X] days
  (d) Return all GFP upon contract completion, expiration, or termination
  (e) Maintain property records per FAR 52.245-1(f)

GOVERNMENT RESPONSIBILITIES:
  (a) Deliver GFP to Contractor in serviceable condition
  (b) Replace or repair GFP that becomes unserviceable through no fault of Contractor

If no GFP is provided: "No Government-Furnished Property will be provided under this contract."`;
}

// ── Attachment param fields ───────────────────────────────────────
const PARAM_FIELDS = {
  QASP: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
    { key:"corName", label:"COR Name" },
    { key:"coName", label:"CO Name" },
    { key:"center", label:"Center" },
  ],
  CDRL: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
    { key:"corName", label:"COR Name" },
    { key:"coName", label:"CO Name" },
  ],
  MILESTONES: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
    { key:"contractType", label:"Contract Type" },
    { key:"value", label:"Contract Value ($)", type:"number" },
    { key:"paymentType", label:"Payment Type", type:"select",
      options:[["MILESTONE","Milestone-Based"],["PERIODIC","Periodic Billing"],["MIXED","Mixed"]] },
  ],
  SUBK: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
    { key:"value", label:"Contract Value ($)", type:"number" },
    { key:"naics", label:"NAICS Code" },
  ],
  KEYPERSONNEL: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
  ],
  OCI: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
    { key:"ociType", label:"OCI Type (if any)", type:"select",
      options:[["","None identified"],["BIASED","Biased Ground Rules"],["UNEQUAL","Unequal Access to Information"],["IMPAIRED","Impaired Objectivity"]] },
  ],
  "508": [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
  ],
  CMR: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
    { key:"center", label:"Center" },
  ],
  WD: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"placeOfPerf", label:"Place of Performance" },
  ],
  NDA: [
    { key:"solNumber", label:"Solicitation Number" },
    { key:"center", label:"Center" },
  ],
  PPQ: [
    { key:"solNumber", label:"Solicitation Number" },
    { key:"center", label:"Center" },
  ],
  TRAVEL: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
  ],
  SECURITY: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
    { key:"center", label:"Center" },
  ],
  GFP: [
    { key:"contractNumber", label:"Contract Number" },
    { key:"contractorName", label:"Contractor Name" },
  ],
};

const GENERATORS = {
  QASP: genQASP, CDRL: genCDRL, MILESTONES: genMilestones,
  SUBK: genSubk, KEYPERSONNEL: genKeyPersonnel, OCI: genOCI,
  "508": gen508, CMR: genCMR, WD: genWD, NDA: genNDA,
  PPQ: genPPQ, TRAVEL: genTravel, SECURITY: genSecurity, GFP: genGFP,
};

// ── Main Component ────────────────────────────────────────────────
export default function AttachmentsBuilder({ existingIntake, onSaveToAcquisition, onClose }) {
  const [selected, setSelected] = useState(null);
  const [params, setParams] = useState({});
  const [generated, setGenerated] = useState({});
  const [activeAttachment, setActiveAttachment] = useState(null);
  const [copyMsg, setCopyMsg] = useState("");

  const set = (k, v) => setParams(p => ({ ...p, [k]: v }));

  // Pre-fill from intake
  const getParam = (key) => {
    if (params[key] !== undefined) return params[key];
    const map = {
      coName: existingIntake?.coName,
      corName: existingIntake?.techRepName,
      center: existingIntake?.center,
      value: existingIntake?.value,
      contractType: existingIntake?.contractType,
      naics: existingIntake?.naics,
      title: existingIntake?.reqTitle,
    };
    return map[key] || "";
  };

  function generate(id) {
    const p = { ...params };
    // Fill from intake where not explicitly set
    Object.keys(PARAM_FIELDS[id] || {}).forEach(k => {
      if (!p[k]) p[k] = getParam(k);
    });
    const fn = GENERATORS[id];
    if (fn) {
      const text = fn(p, existingIntake);
      setGenerated(g => ({ ...g, [id]: text }));
      setActiveAttachment(id);
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg("Copied!"); setTimeout(() => setCopyMsg(""), 2000);
    });
  }

  async function exportWord(attachmentId, text) {
    setCopyMsg("Generating Word doc...");
    try {
      const label = ATTACHMENTS.find(a => a.id === attachmentId)?.label || attachmentId;
      const res = await fetch("/.netlify/functions/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          docType: label,
          intake: existingIntake,
          filename: label.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40) + ".docx",
        }),
      });
      const data = await res.json();
      if (data.docx) {
        const bytes = atob(data.docx);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = data.filename || (attachmentId + ".docx");
        a.click(); URL.revokeObjectURL(url);
        setCopyMsg("Word doc downloaded!");
      } else {
        setCopyMsg("Export failed — copy text instead");
      }
    } catch(e) {
      setCopyMsg("Export failed — copy text instead");
    }
    setTimeout(() => setCopyMsg(""), 3000);
  }

  function saveAll() {
    if (!onSaveToAcquisition || Object.keys(generated).length === 0) return;
    onSaveToAcquisition(generated);
  }

  const cats = [...new Set(ATTACHMENTS.map(a => a.cat))];

  return (
    <div style={{ fontFamily: FONT, background: C.bg, minHeight: "100%", display: "flex", height: "100%" }}>

      {/* Left sidebar — attachment picker */}
      <div style={{ width: 240, background: C.bg2, borderRight: `1px solid ${C.border}`,
        padding: "16px 12px", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ fontSize: 11, fontWeight: "600", color: C.text, marginBottom: 12 }}>
          Select Attachment
        </div>
        {cats.map(cat => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
              {cat}
            </div>
            {ATTACHMENTS.filter(a => a.cat === cat).map(a => (
              <button key={a.id} onClick={() => setSelected(a.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, width: "100%",
                  padding: "7px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 2,
                  background: selected === a.id ? C.blue : generated[a.id] ? "#e1f5ee" : "transparent",
                  border: `1px solid ${selected === a.id ? C.blue : generated[a.id] ? "#9fe1cb" : "transparent"}`,
                  color: selected === a.id ? "#fff" : generated[a.id] ? C.green : C.text,
                  fontSize: 11, textAlign: "left", fontFamily: FONT }}>
                <span style={{ fontSize: 14 }}>{a.icon}</span>
                <span style={{ lineHeight: 1.3 }}>{a.label}</span>
                {generated[a.id] && selected !== a.id && (
                  <span style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        ))}

        {Object.keys(generated).length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>
              {Object.keys(generated).length} attachment{Object.keys(generated).length !== 1 ? "s" : ""} generated
            </div>
            {onSaveToAcquisition && (
              <button onClick={saveAll}
                style={{ width: "100%", background: C.green, border: "none", color: "#fff",
                  padding: "8px", borderRadius: 7, cursor: "pointer", fontSize: 11,
                  fontWeight: "500", fontFamily: FONT }}>
                Save All to Acquisition
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`,
          padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", fontSize: 14, color: C.text }}>Attachments Builder</div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {existingIntake?.reqTitle || "Standalone"} — select an attachment from the left
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

        {/* Content area */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>

          {!selected ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📎</div>
              <div style={{ fontSize: 14, fontWeight: "500", marginBottom: 6, color: C.text }}>
                Select an attachment from the left panel
              </div>
              <div style={{ fontSize: 12 }}>
                Fill in parameters and generate — each attachment drafts instantly.
                {existingIntake && " Contract data from your open acquisition is pre-filled."}
              </div>
            </div>
          ) : (
            <div>
              {/* Attachment header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{ATTACHMENTS.find(a => a.id === selected)?.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                    {ATTACHMENTS.find(a => a.id === selected)?.label}
                  </div>
                </div>
                {generated[selected] && (
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button onClick={() => exportWord(selected, generated[selected])}
                      style={{ background: C.blue, border: "none", color: "#fff",
                        padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                        fontSize: 11, fontFamily: FONT }}>
                      Export Word
                    </button>
                    <button onClick={() => copyText(generated[selected])}
                      style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                        padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                        fontSize: 11, fontFamily: FONT }}>
                      Copy Text
                    </button>
                    {onSaveToAcquisition && (
                      <button onClick={() => onSaveToAcquisition({ [selected]: generated[selected] })}
                        style={{ background: C.green, border: "none", color: "#fff",
                          padding: "6px 14px", borderRadius: 7, cursor: "pointer",
                          fontSize: 11, fontFamily: FONT }}>
                        Save to Acquisition
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: generated[selected] ? "320px 1fr" : "1fr", gap: 16 }}>

                {/* Params panel */}
                <div style={{ background: C.bg2, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "16px", height: "fit-content" }}>
                  <div style={{ fontSize: 11, fontWeight: "600", color: C.blue,
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                    Parameters
                  </div>

                  {(PARAM_FIELDS[selected] || []).map(f => (
                    <div key={f.key}>
                      {lbl(f.label)}
                      {f.type === "select" ? (
                        <select style={sel} value={params[f.key] ?? getParam(f.key)}
                          onChange={e => set(f.key, e.target.value)}>
                          {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea style={ta} value={params[f.key] ?? getParam(f.key)}
                          onChange={e => set(f.key, e.target.value)} />
                      ) : (
                        <input type={f.type || "text"} style={inp}
                          value={params[f.key] !== undefined ? params[f.key] : (getParam(f.key) || "")}
                          onChange={e => set(f.key, e.target.value)} />
                      )}
                    </div>
                  ))}

                  <button onClick={() => generate(selected)}
                    style={{ width: "100%", background: C.blue, border: "none", color: "#fff",
                      padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 12,
                      fontWeight: "500", fontFamily: FONT, marginTop: 16 }}>
                    {generated[selected] ? "Regenerate" : "Generate Draft"}
                  </button>
                </div>

                {/* Generated output */}
                {generated[selected] && (
                  <div>
                    <div style={{ background: "#fff8e6", border: "1px solid #f5c542",
                      borderRadius: 8, padding: "8px 14px", marginBottom: 12,
                      fontSize: 11, color: "#7a4a00" }}>
                      Draft only — complete all bracketed placeholders before use.
                      CO review required before including in solicitation or contract.
                    </div>
                    <pre style={{ background: C.bg2, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: "16px 20px", fontSize: 11, color: C.text,
                      whiteSpace: "pre-wrap", lineHeight: 1.8,
                      fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                      maxHeight: 560, overflow: "auto" }}>
                      {generated[selected]}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
