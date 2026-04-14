// CPAS Data Rights Attachment Generator
// Walks the CO through the NFS 1827 / FAR 27 data rights decision tree
// Outputs: (1) Section J Data Rights Attachment draft
//          (2) Clause prescription recommendation integrated into clause matrix

import React, { useState } from "react";

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
const ta = { ...inp, resize: "vertical", minHeight: 60, lineHeight: 1.6 };
const sel = { ...inp };

const lbl = (t, req) => (
  <div style={{ fontSize: 10, color: req ? C.yellow : C.muted, fontWeight: "600",
    letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4,
    marginTop: 12, fontFamily: FONT }}>
    {t}{req ? " *" : ""}
  </div>
);

const sect = (title, sub) => (
  <div style={{ marginBottom: 16, marginTop: 24 }}>
    <div style={{ fontSize: 12, fontWeight: "600", color: C.blue,
      borderBottom: `2px solid ${C.border}`, paddingBottom: 6, marginBottom: sub ? 4 : 0 }}>
      {title}
    </div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const card = {
  background: C.bg2, border: `1px solid ${C.border}`,
  borderRadius: 10, padding: "16px 20px", marginBottom: 12,
  boxShadow: "0 1px 3px rgba(26,58,110,0.05)",
};

// ── Decision logic ────────────────────────────────────────────────
function deriveClausePrescription(d) {
  const clauses = [];
  const notes = [];

  // Base data rights clause
  if (d.isSBIR) {
    clauses.push({ num: "52.227-20", title: "Rights in Data—SBIR and STTR Programs (DEVIATION JAN 2026)", required: true,
      note: "PCD 26-02: Required for all SBIR/STTR Phase I, II, III. 20-year protection period. Supersedes 1852.227-19 and 1852.227-86." });
  } else if (d.isCommercial === "YES") {
    clauses.push({ num: "52.227-19", title: "Commercial Computer Software—Restricted Rights", required: false,
      note: "Applies only when commercial computer software is delivered. NOTE: PCD 26-02 renders NFS 1852.227-19 obsolete for SBIR — verify applicability for non-SBIR commercial software." });
    notes.push("Commercial acquisitions: FAR 27.405-3 — for commercial software use license terms negotiated with contractor. 52.227-14 not typically used for commercial items per FAR 27.405-3.");
  } else {
    // Non-commercial
    clauses.push({ num: "52.227-14", title: "Rights in Data—General (FAR base)", required: true, note: "Always include the FAR base clause." });
    clauses.push({ num: "1852.227-14", title: "Rights in Data—General (NFS modification)", required: true,
      note: "NFS 1827.409(b)(1): MUST modify 52.227-14 with 1852.227-14 for all NASA contracts." });

    // Determine alternate
    if (d.contractorType === "UNIVERSITY" && parseFloat(d.value || 0) <= 500000 && d.workType === "BASIC_APPLIED_RESEARCH") {
      clauses.push({ num: "52.227-14 Alt IV", title: "Rights in Data—General, Alternate IV", required: false,
        note: "PN 22-15 / NFS 1827.404-3: Consult center patent/IP counsel. Alt IV may be appropriate for basic/applied research contracts ≤$500K with universities in lieu of paragraph (c)(1)." });
    } else if (d.limitedRightsData === "YES") {
      clauses.push({ num: "52.227-14 Alt II", title: "Rights in Data—General, Alternate II (Limited Rights)", required: false,
        note: "NFS 1827.409(b)(3): CO must review disclosure purposes in FAR 27.404-2(c)(1)(i)-(v) with center IP counsel and insert applicable purposes in paragraph (g)(3). Requires procurement officer approval + center IP counsel concurrence." });
      clauses.push({ num: "52.227-15", title: "Representation of Limited Rights Data and Restricted Computer Software", required: true,
        note: "Required when limited rights data or restricted computer software may be delivered." });
    } else if (d.restrictedSoftware === "YES") {
      clauses.push({ num: "52.227-14 Alt III", title: "Rights in Data—General, Alternate III (Computer Software Copyright)", required: false,
        note: "NFS 1827.409(b)(1): Alt III allows contractor to assert copyright to computer software. CO must approve — see NFS 1827.404-4(b)." });
    }

    // Additional Data Requirements for R&D
    if (["RD","EXPERIMENTAL","DEVELOPMENTAL","DEMONSTRATION"].includes(d.workType)) {
      const isSmallUniExempt = d.contractorType === "UNIVERSITY" && parseFloat(d.value || 0) <= 500000;
      clauses.push({ num: "52.227-16", title: "Additional Data Requirements", required: !isSmallUniExempt,
        note: `NFS 1827.409(d): Required for all R&D/experimental/developmental/demonstration work.${isSmallUniExempt ? " Exception: basic/applied research at university ≤$500K — CO may omit with center IP counsel concurrence." : ""}`
      });
    }
  }

  // Patent rights
  if (["RD","EXPERIMENTAL","DEVELOPMENTAL"].includes(d.workType)) {
    if (d.contractorType === "SMALL_BUSINESS" || d.contractorType === "NONPROFIT" || d.contractorType === "UNIVERSITY") {
      clauses.push({ num: "52.227-11", title: "Patent Rights—Ownership by the Contractor (FAR base)", required: true,
        note: "For small business, nonprofit, or university R&D. Contractor retains title. Modified by 1852.227-11." });
      clauses.push({ num: "1852.227-11", title: "Patent Rights—Ownership by Contractor (NFS modification)", required: true,
        note: "NFS 1827.303(b)(1): MUST modify 52.227-11 with 1852.227-11 for NASA contracts." });
      clauses.push({ num: "1852.227-84", title: "Patent Rights Clauses (Solicitation Provision)", required: true,
        note: "NFS 1827.303(a)(1): Insert in R&D solicitations when eventual awardee may be small business or nonprofit — allows offeror to represent status for patent rights clause selection." });
    } else {
      clauses.push({ num: "1852.227-70", title: "New Technology—Other than a Small Business Firm or Nonprofit Organization", required: true,
        note: "NFS 1827.303(a)(1): For R&D contracts with large business. Government receives title to subject inventions. Contracts >$2.5M: CO may require New Technology Reporting Plan (NFS 1827.305-271)." });
    }
  }

  // GFCS clause
  if (d.govFurnishedSoftware === "YES") {
    clauses.push({ num: "1852.227-88", title: "Government-Furnished Computer Software and Related Technical Data", required: false,
      note: "NFS 1827.409(j): Include when Government-furnished computer software will be provided. Optional — CO discretion." });
  }

  // Center local clause warning
  notes.push("⚠ CENTER LOCAL CLAUSES: NASA HQ directed elimination of center-specific data rights clauses. CPAS prescribes NFS 1852.227 and FAR 52.227 series only. Do not include center-specific data rights clauses that conflict with or supplement these provisions without HQ authorization. This applies to all NASA centers.");

  return { clauses, notes };
}

// ── Attachment document generator ────────────────────────────────
function buildAttachmentText(d, prescription) {
  const contractInfo = d.contractNumber || "[CONTRACT NUMBER]";
  const contractor = d.contractorName || "[CONTRACTOR NAME]";
  const description = d.description || "[CONTRACT DESCRIPTION]";

  let text = `ATTACHMENT [J-X] — DATA RIGHTS, PATENT RIGHTS, AND INTELLECTUAL PROPERTY SCHEDULE\n`;
  text += `${"=".repeat(70)}\n\n`;
  text += `Contract Number:    ${contractInfo}\n`;
  text += `Contractor:         ${contractor}\n`;
  text += `Description:        ${description}\n`;
  text += `Contracting Officer: ${d.coName || "[CO NAME]"}\n`;
  text += `Date:               [DATE]\n\n`;

  text += `AUTHORITY: NFS Part 1827, FAR Part 27, 51 U.S.C. §§ 20135-20138\n`;
  if (d.isSBIR) text += `SBIR/STTR AUTHORITY: 15 U.S.C. § 638; SBA SBIR/STTR Policy Directive (84 FR 12794)\n`;
  text += `\n${"─".repeat(70)}\n\n`;

  text += `SECTION 1 — SCOPE OF DATA RIGHTS PROVISIONS\n\n`;
  text += `This attachment establishes the intellectual property rights framework governing data, `;
  text += `software, inventions, and other intellectual property arising from or related to `;
  text += `performance under this contract. The provisions below supplement the contract clauses `;
  text += `in Section I and govern in the event of any inconsistency with other contract terms.\n\n`;

  text += `SECTION 2 — CATEGORIES OF DATA UNDER THIS CONTRACT\n\n`;
  text += `2.1 Data to be Generated\n`;
  if (d.dataGenerated) {
    text += `${d.dataGenerated}\n\n`;
  } else {
    text += `[DESCRIBE: types of technical data, computer software, reports, deliverables, and other data items that will be generated under this contract — reference CDRL/DRL if applicable]\n\n`;
  }

  text += `2.2 Government Rights in Generated Data\n`;
  if (d.isSBIR) {
    text += `SBIR/STTR DATA RIGHTS: The Government's rights to use, disclose, reproduce, prepare `;
    text += `derivative works, distribute copies, and perform or display publicly are restricted `;
    text += `during the SBIR/STTR Data Rights Protection Period of 20 years from the date the `;
    text += `data was first generated or developed in performance of this contract. After the `;
    text += `protection period, the Government shall have unlimited rights.\n\n`;
  } else if (d.rightsCategory === "UNLIMITED") {
    text += `UNLIMITED RIGHTS: The Government shall have unlimited rights to all data first `;
    text += `produced in the performance of this contract, including the right to use, duplicate, `;
    text += `release, or disclose data in whole or in part, in any manner, and for any purpose `;
    text += `without restriction.\n\n`;
  } else if (d.rightsCategory === "LIMITED") {
    text += `LIMITED RIGHTS DATA: The following data items are limited rights data subject to `;
    text += `the restrictions in FAR 52.227-14 Alternate II (as modified by 1852.227-14):\n`;
    text += `${d.limitedRightsItems || "[LIST SPECIFIC DATA ITEMS WITH LIMITED RIGHTS]"}\n\n`;
    text += `Limited rights restrictions apply for a period of [X] years from the date of `;
    text += `delivery. The Government may use limited rights data for [INSERT DISCLOSURE PURPOSES `;
    text += `FROM FAR 27.404-2(c)(1)(i)-(v) as approved by procurement officer and center IP counsel].\n\n`;
  } else if (d.rightsCategory === "MIXED") {
    text += `MIXED RIGHTS: Some data generated under this contract will be subject to unlimited `;
    text += `rights and some will be subject to limited rights or restricted rights as set forth below:\n`;
    text += `${d.mixedRightsDescription || "[SPECIFY WHICH DATA ITEMS HAVE WHICH RIGHTS CATEGORIES]"}\n\n`;
  }

  text += `SECTION 3 — CONTRACTOR BACKGROUND IP AND PRE-EXISTING IP ASSERTIONS\n\n`;
  text += `3.1 Pre-Existing Intellectual Property\n`;
  if (d.preExistingIP === "YES" && d.preExistingIPDescription) {
    text += `The Contractor asserts that the following pre-existing intellectual property will be `;
    text += `incorporated into or used in performance of this contract:\n\n`;
    text += `${d.preExistingIPDescription}\n\n`;
    text += `The Government's rights in such pre-existing IP are limited to the rights granted `;
    text += `in the applicable license terms or as negotiated. The Government shall have, at `;
    text += `minimum, a license to use such IP for Government purposes.\n\n`;
  } else if (d.preExistingIP === "NO") {
    text += `The Contractor represents that no pre-existing intellectual property will be `;
    text += `incorporated into deliverables under this contract without prior written approval `;
    text += `from the Contracting Officer.\n\n`;
  } else {
    text += `[IDENTIFY ANY PRE-EXISTING IP THE CONTRACTOR WILL INCORPORATE OR WHETHER NONE EXISTS]\n\n`;
  }

  text += `3.2 Third-Party IP\n`;
  text += `${d.thirdPartyIP || "[IDENTIFY ANY THIRD-PARTY IP THAT WILL BE USED OR INCORPORATED, OR STATE 'NONE ANTICIPATED']"}\n\n`;

  if (["RD","EXPERIMENTAL","DEVELOPMENTAL"].includes(d.workType)) {
    text += `SECTION 4 — INVENTIONS AND PATENT RIGHTS\n\n`;
    if (d.contractorType === "SMALL_BUSINESS" || d.contractorType === "NONPROFIT" || d.contractorType === "UNIVERSITY") {
      text += `4.1 Title to Subject Inventions\n`;
      text += `The Contractor retains title to subject inventions made in the performance of `;
      text += `this contract in accordance with FAR 52.227-11 (as modified by NFS 1852.227-11). `;
      text += `The Government retains a nonexclusive, nontransferable, irrevocable, paid-up `;
      text += `license for any subject invention throughout the world.\n\n`;
      text += `4.2 Reporting Requirements\n`;
      text += `The Contractor shall report each subject invention to the Contracting Officer `;
      text += `within two months after the inventor first discloses the invention in writing `;
      text += `to contractor personnel responsible for patent matters.\n\n`;
    } else {
      text += `4.1 Title to Subject Inventions\n`;
      text += `All rights to subject inventions made in the performance of this contract shall `;
      text += `vest in the Government in accordance with NFS 1852.227-70 (New Technology—Other `;
      text += `than a Small Business Firm or Nonprofit Organization).\n\n`;
      text += `4.2 New Technology Reporting\n`;
      text += `The Contractor shall report all reportable items (whether or not patentable) to `;
      text += `the Contracting Officer in accordance with NFS 1852.227-70. `;
      if (parseFloat(d.value || 0) > 2500000) {
        text += `Given the contract value exceeds $2.5M, the Contracting Officer may require `;
        text += `the Contractor to submit a New Technology Reporting Plan per NFS 1827.305-271.\n\n`;
      } else {
        text += `\n\n`;
      }
    }
  }

  if (d.isSBIR) {
    text += `SECTION 5 — SBIR/STTR DATA RIGHTS NOTICE\n\n`;
    text += `This contract is a Small Business Innovation Research (SBIR) / Small Business `;
    text += `Technology Transfer (STTR) ${d.sbirPhase || "Phase [I/II/III]"} contract awarded `;
    text += `under 15 U.S.C. § 638. The SBIR/STTR data rights protection period is 20 years `;
    text += `from the date data is first generated under this contract, or such longer period `;
    text += `as may be negotiated by the parties pursuant to FAR 52.227-20(d).\n\n`;
    text += `SBIR/STTR Rights Notice: The Contractor shall mark all SBIR/STTR data with the `;
    text += `SBIR/STTR Rights Notice set forth in FAR 52.227-20. Data so marked may not be `;
    text += `disclosed outside the Government (including contractors operating under a Government `;
    text += `contract) without the Contractor's permission during the protection period, except `;
    text += `as permitted by FAR 52.227-20.\n\n`;
  }

  text += `SECTION ${d.isSBIR ? "6" : ["RD","EXPERIMENTAL","DEVELOPMENTAL"].includes(d.workType) ? "5" : "4"} — MARKING REQUIREMENTS\n\n`;
  text += `The Contractor shall mark all data delivered under this contract with the appropriate `;
  text += `legends as required by FAR 52.227-14 (or applicable clause). Unmarked data shall be `;
  text += `treated as having unlimited rights. The Government may challenge improper markings `;
  text += `in accordance with FAR 27.404-5 / NFS 1827.404-5.\n\n`;

  text += `SECTION ${d.isSBIR ? "7" : ["RD","EXPERIMENTAL","DEVELOPMENTAL"].includes(d.workType) ? "6" : "5"} — CENTER LOCAL CLAUSE COMPLIANCE\n\n`;
  text += `This contract incorporates the NFS 1852.227 series and FAR 52.227 series as the `;
  text += `governing data rights framework in accordance with NASA Headquarters policy. `;
  text += `Center-specific data rights clauses that are inconsistent with or supplemental to `;
  text += `this framework are not incorporated in this contract. All data rights matters `;
  text += `shall be governed by the NFS and FAR provisions in Section I.\n\n`;

  text += `${"─".repeat(70)}\n`;
  text += `CONTRACTING OFFICER CERTIFICATION\n\n`;
  text += `I certify that the data rights provisions in this contract are consistent with `;
  text += `NFS Part 1827, FAR Part 27, and applicable PCDs, and that I have consulted with `;
  text += `center patent/intellectual property counsel as required.\n\n`;
  text += `CO Signature: ___________________________  Date: ___________\n`;
  text += `Printed Name: ${d.coName || "___________________________"}\n\n`;
  text += `[NOTE TO CO: This attachment must be reviewed and approved by center patent/IP `;
  text += `counsel before contract award for contracts involving R&D, SBIR/STTR, `;
  text += `or where limited rights assertions are made by the contractor.]\n`;

  return text;
}

// ── Main Component ────────────────────────────────────────────────
export default function DataRightsAttachment({ existingIntake, onSaveToAcquisition, onClose }) {
  const [d, setD] = useState({
    contractNumber: existingIntake?.contractNumber || "",
    contractorName: "",
    contractorType: "",
    description: existingIntake?.reqTitle || "",
    coName: existingIntake?.coName || "",
    value: existingIntake?.value || "",
    workType: existingIntake?.reqType === "RD" ? "RD" : "",
    isCommercial: existingIntake?.isCommercial || "NO",
    isSBIR: false,
    sbirPhase: "",
    rightsCategory: "UNLIMITED",
    limitedRightsItems: "",
    mixedRightsDescription: "",
    preExistingIP: "",
    preExistingIPDescription: "",
    thirdPartyIP: "",
    limitedRightsData: "NO",
    restrictedSoftware: "NO",
    govFurnishedSoftware: "NO",
    dataGenerated: "",
  });

  const [generated, setGenerated] = useState(null);
  const [activeTab, setActiveTab] = useState("form");
  const [copyMsg, setCopyMsg] = useState("");

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  function generate() {
    const prescription = deriveClausePrescription(d);
    const attachment = buildAttachmentText(d, prescription);
    setGenerated({ prescription, attachment });
    setActiveTab("attachment");
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg("Copied!"); setTimeout(() => setCopyMsg(""), 2000);
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
          <div style={{ fontSize: 15, fontWeight: "600", color: C.text }}>Data Rights Attachment Generator</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            NFS 1827 / FAR 27 — Generates Section J attachment and clause prescription
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

      {/* Policy notice */}
      <div style={{ background: "#e6f1fb", border: "1px solid #b5d4f4", borderRadius: 8,
        padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#185fa5", lineHeight: 1.6 }}>
        <strong>NASA Policy:</strong> This tool prescribes NFS 1852.227 and FAR 52.227 clauses only.
        Center-specific data rights clauses (including any remaining ARC local clauses) are not
        incorporated — consistent with NASA HQ directive to eliminate local deviations. All centers
        shall follow NFS and FAR guidance.
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabBtn("form", "Decision Tree")}
        {generated && tabBtn("clauses", `Clause Prescription (${generated.prescription.clauses.length})`)}
        {generated && tabBtn("attachment", "Section J Attachment Draft")}
      </div>

      {/* FORM TAB */}
      {activeTab === "form" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <div style={card}>
            {sect("Contract Basics")}
            {lbl("Contract / Acquisition Title")}
            <input style={inp} value={d.description} onChange={e => set("description", e.target.value)} placeholder="e.g., Commercial Aviation Services — Airborne Science Support" />
            {lbl("Contract Number (if known)")}
            <input style={inp} value={d.contractNumber} onChange={e => set("contractNumber", e.target.value)} placeholder="e.g., 80ARC025DA006" />
            {lbl("Estimated Value")}
            <input type="number" style={inp} value={d.value} onChange={e => set("value", e.target.value)} placeholder="e.g., 12000000" />
            {lbl("Contracting Officer")}
            <input style={inp} value={d.coName} onChange={e => set("coName", e.target.value)} />
            {lbl("Contractor Name")}
            <input style={inp} value={d.contractorName} onChange={e => set("contractorName", e.target.value)} placeholder="e.g., Dynamic Aviation Group" />
          </div>

          <div style={card}>
            {sect("Contractor & Work Type", "These determine which patent and data rights clauses apply")}
            {lbl("Contractor Type", true)}
            <select style={sel} value={d.contractorType} onChange={e => set("contractorType", e.target.value)}>
              <option value="">Select...</option>
              <option value="LARGE_BUSINESS">Large Business</option>
              <option value="SMALL_BUSINESS">Small Business</option>
              <option value="NONPROFIT">Nonprofit Organization</option>
              <option value="UNIVERSITY">University / College</option>
              <option value="GOVERNMENT">Government Entity / IAA</option>
            </select>

            {lbl("Type of Work", true)}
            <select style={sel} value={d.workType} onChange={e => set("workType", e.target.value)}>
              <option value="">Select...</option>
              <option value="SERVICES">Services (non-R&D)</option>
              <option value="SUPPLIES">Supplies / Hardware</option>
              <option value="IT">Information Technology / Software</option>
              <option value="RD">Research & Development</option>
              <option value="EXPERIMENTAL">Experimental / Developmental</option>
              <option value="BASIC_APPLIED_RESEARCH">Basic or Applied Research</option>
              <option value="DEMONSTRATION">Demonstration</option>
              <option value="CONSTRUCTION">Construction / A&E</option>
            </select>

            {lbl("Commercial Item/Service?")}
            <select style={sel} value={d.isCommercial} onChange={e => set("isCommercial", e.target.value)}>
              <option value="NO">No — Non-commercial</option>
              <option value="YES">Yes — Commercial item or service</option>
            </select>

            {lbl("SBIR or STTR Contract?")}
            <select style={sel} value={d.isSBIR ? "YES" : "NO"} onChange={e => set("isSBIR", e.target.value === "YES")}>
              <option value="NO">No</option>
              <option value="YES">Yes — SBIR / STTR</option>
            </select>
            {d.isSBIR && (
              <>
                {lbl("SBIR/STTR Phase")}
                <select style={sel} value={d.sbirPhase} onChange={e => set("sbirPhase", e.target.value)}>
                  <option value="">Select phase...</option>
                  <option value="Phase I">Phase I</option>
                  <option value="Phase II">Phase II</option>
                  <option value="Phase III">Phase III</option>
                </select>
              </>
            )}
          </div>

          <div style={card}>
            {sect("Rights Categories", "What rights will the Government acquire in data generated under this contract?")}

            {!d.isSBIR && (
              <>
                {lbl("Government Rights in Generated Data", true)}
                <select style={sel} value={d.rightsCategory} onChange={e => set("rightsCategory", e.target.value)}>
                  <option value="UNLIMITED">Unlimited Rights (standard)</option>
                  <option value="LIMITED">Limited Rights Data (contractor retains some rights)</option>
                  <option value="RESTRICTED">Restricted Computer Software</option>
                  <option value="MIXED">Mixed — some unlimited, some limited</option>
                </select>

                {d.rightsCategory === "LIMITED" && (
                  <>
                    {lbl("Data Items with Limited Rights")}
                    <textarea style={ta} value={d.limitedRightsItems}
                      onChange={e => set("limitedRightsItems", e.target.value)}
                      placeholder="List specific data items or categories that will have limited rights..." />
                    {lbl("Limited Rights Data Assertion")}
                    <select style={sel} value={d.limitedRightsData} onChange={e => set("limitedRightsData", e.target.value)}>
                      <option value="YES">Yes — contractor will assert limited rights</option>
                      <option value="NO">No</option>
                    </select>
                  </>
                )}

                {d.rightsCategory === "MIXED" && (
                  <>
                    {lbl("Describe Mixed Rights")}
                    <textarea style={ta} value={d.mixedRightsDescription}
                      onChange={e => set("mixedRightsDescription", e.target.value)}
                      placeholder="Describe which data items have which rights categories..." />
                  </>
                )}

                {lbl("Restricted Computer Software?")}
                <select style={sel} value={d.restrictedSoftware} onChange={e => set("restrictedSoftware", e.target.value)}>
                  <option value="NO">No</option>
                  <option value="YES">Yes — contractor will deliver restricted computer software</option>
                </select>
              </>
            )}

            {lbl("Government-Furnished Computer Software (GFCS)?")}
            <select style={sel} value={d.govFurnishedSoftware} onChange={e => set("govFurnishedSoftware", e.target.value)}>
              <option value="NO">No</option>
              <option value="YES">Yes — Government will provide software to contractor</option>
            </select>
          </div>

          <div style={card}>
            {sect("IP Assertions & Data Description")}
            {lbl("Data to Be Generated Under This Contract")}
            <textarea style={ta} value={d.dataGenerated}
              onChange={e => set("dataGenerated", e.target.value)}
              placeholder="Describe types of data, software, reports, and deliverables that will be generated — e.g., flight data recordings, atmospheric measurement datasets, software algorithms, technical reports..." />

            {lbl("Pre-Existing Contractor IP Involved?")}
            <select style={sel} value={d.preExistingIP} onChange={e => set("preExistingIP", e.target.value)}>
              <option value="">Select...</option>
              <option value="NO">No pre-existing IP will be incorporated</option>
              <option value="YES">Yes — contractor is bringing pre-existing IP</option>
              <option value="UNKNOWN">Unknown — to be determined during negotiation</option>
            </select>
            {d.preExistingIP === "YES" && (
              <>
                {lbl("Describe Pre-Existing IP")}
                <textarea style={ta} value={d.preExistingIPDescription}
                  onChange={e => set("preExistingIPDescription", e.target.value)}
                  placeholder="Describe the pre-existing IP, including any patents, software, trade secrets, or proprietary processes..." />
              </>
            )}

            {lbl("Third-Party IP")}
            <textarea style={{ ...ta, minHeight: 44 }} value={d.thirdPartyIP}
              onChange={e => set("thirdPartyIP", e.target.value)}
              placeholder="Identify any third-party licensed IP that will be incorporated, or 'None anticipated'" />
          </div>

          {/* Generate button */}
          <div style={{ gridColumn: "1 / -1" }}>
            <button onClick={generate}
              disabled={!d.contractorType || !d.workType}
              style={{ width: "100%", background: d.contractorType && d.workType ? C.blue : C.bg3,
                border: "none", color: d.contractorType && d.workType ? "#fff" : C.dim,
                padding: "13px", borderRadius: 8, cursor: d.contractorType && d.workType ? "pointer" : "default",
                fontSize: 13, fontWeight: "500", fontFamily: FONT }}>
              Generate Data Rights Attachment & Clause Prescription
            </button>
            {(!d.contractorType || !d.workType) && (
              <div style={{ fontSize: 11, color: C.yellow, textAlign: "center", marginTop: 6 }}>
                Select Contractor Type and Work Type to generate output.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLAUSE PRESCRIPTION TAB */}
      {activeTab === "clauses" && generated && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: "500", color: C.text }}>
              Data Rights Clause Prescription — {d.description || "Acquisition"}
            </div>
            <button onClick={() => copy(generated.prescription.clauses.map(c =>
              `${c.num}  ${c.title}\n  ${c.required ? "REQUIRED" : "CONDITIONAL"}\n  ${c.note}`
            ).join("\n\n"))}
              style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
              Copy All
            </button>
          </div>

          <div style={{ background: "#fff8e6", border: "1px solid #f5c542", borderRadius: 8,
            padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#7a4a00", lineHeight: 1.6 }}>
            <strong>CO Action Required:</strong> These prescriptions are based on the parameters entered.
            The CO must consult with center patent/intellectual property counsel before finalizing data
            rights provisions for all R&D, SBIR/STTR, and limited rights situations.
          </div>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            {generated.prescription.clauses.map((c, i) => (
              <div key={i} style={{ padding: "14px 18px",
                borderBottom: i < generated.prescription.clauses.length - 1 ? `1px solid ${C.border}` : "none",
                background: i % 2 === 0 ? C.bg2 : C.bg3 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ background: c.required ? "#e1f5ee" : "#e6f1fb",
                    color: c.required ? C.green : "#185fa5",
                    border: `1px solid ${c.required ? "#9fe1cb" : "#b5d4f4"}`,
                    padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: "500",
                    flexShrink: 0, marginTop: 2 }}>
                    {c.required ? "Required" : "Conditional"}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: "600", color: C.blue, fontFamily: "monospace", marginBottom: 2 }}>
                      {c.num}
                    </div>
                    <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 10, color: "#7a4a00", background: "#fffdf0",
                      border: "1px solid #f5e88a", borderRadius: 4, padding: "4px 8px", lineHeight: 1.5 }}>
                      {c.note}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {generated.prescription.notes.map((n, i) => (
            <div key={i} style={{ background: i === generated.prescription.notes.length - 1 ? "#fff8e6" : C.bg3,
              border: `1px solid ${i === generated.prescription.notes.length - 1 ? "#f5c542" : C.border}`,
              borderRadius: 8, padding: "10px 14px", marginTop: 10,
              fontSize: 11, color: i === generated.prescription.notes.length - 1 ? "#7a4a00" : C.muted,
              lineHeight: 1.6 }}>
              {n}
            </div>
          ))}
        </div>
      )}

      {/* ATTACHMENT TAB */}
      {activeTab === "attachment" && generated && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: "500", color: C.text }}>
              Section J Attachment Draft — Data Rights
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => copy(generated.attachment)}
                style={{ background: C.blue, border: "none", color: "#fff",
                  padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                Copy Attachment
              </button>
              {onSaveToAcquisition && (
                <button onClick={() => onSaveToAcquisition(generated)}
                  style={{ background: C.green, border: "none", color: "#fff",
                    padding: "7px 14px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: FONT }}>
                  Save to Acquisition
                </button>
              )}
            </div>
          </div>

          <div style={{ background: "#fff8e6", border: "1px solid #f5c542", borderRadius: 8,
            padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#7a4a00", lineHeight: 1.6 }}>
            <strong>Draft Only.</strong> Complete all bracketed placeholders. Review with center patent/IP counsel before including in solicitation or contract. This attachment supplements Section I clauses — do not include clauses here that are already in Section I.
          </div>

          <pre style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "20px", fontSize: 11, color: C.text, whiteSpace: "pre-wrap",
            lineHeight: 1.8, fontFamily: "ui-monospace, 'Cascadia Code', monospace",
            maxHeight: 600, overflow: "auto" }}>
            {generated.attachment}
          </pre>
        </div>
      )}
    </div>
  );
}
