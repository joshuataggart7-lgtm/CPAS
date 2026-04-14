// CPAS SF Forms Builder
// Covers: SF-1449, SF-26, SF-33, SF-18, SF-1442, SF-1447, OF-347, OF-336
// Each form: block definitions, pre-population from intake, editable fields, Word export

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

const lbl = (text, required = false) => (
  <div style={{ fontSize: 9, color: required ? C.yellow : C.muted, letterSpacing: 1, marginBottom: 3, marginTop: 6 }}>
    {text}{required ? " *" : ""}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// FORM REGISTRY — all supported SF/OF forms
// ═══════════════════════════════════════════════════════════════════

export const SF_FORMS = [
  {
    id: "SF1449",
    title: "SF-1449",
    subtitle: "Solicitation/Contract/Order for Commercial Products and Services",
    farRef: "FAR 12.204, 13.307",
    uses: "Commercial acquisitions — solicitation and award. Most common form for FAR Part 12 and 13.5 actions.",
    color: C.blue,
  },
  {
    id: "SF26",
    title: "SF-26",
    subtitle: "Award/Contract",
    farRef: "FAR 53.214(b)",
    uses: "Non-commercial negotiated contract awards (FAR Part 15). Used when SF-1449 is not appropriate.",
    color: C.green,
  },
  {
    id: "SF33",
    title: "SF-33",
    subtitle: "Solicitation, Offer, and Award",
    farRef: "FAR 53.214(c)",
    uses: "FAR Part 14 sealed bids and FAR Part 15 negotiated acquisitions. Combined solicitation and award form.",
    color: C.yellow,
  },
  {
    id: "SF18",
    title: "SF-18",
    subtitle: "Request For Quotations (RFQ)",
    farRef: "FAR 13.307(b)",
    uses: "Simplified acquisitions under SAT. Used for oral or written quotations. Not a contract — award via SF-1449 or OF-347.",
    color: "#f07050",
  },
  {
    id: "SF1442",
    title: "SF-1442",
    subtitle: "Solicitation, Offer, and Award (Construction)",
    farRef: "FAR 36.701(a)",
    uses: "Construction, alteration, or repair contracts. Required for construction actions unless using simplified procedures.",
    color: "#a07040",
  },
  {
    id: "SF1447",
    title: "SF-1447",
    subtitle: "Solicitation/Contract",
    farRef: "FAR 53.212(a)",
    uses: "Streamlined commercial and non-commercial solicitations/awards when SF-1449 and SF-33 are not prescribed.",
    color: C.purple,
  },
  {
    id: "OF347",
    title: "OF-347",
    subtitle: "Order for Supplies or Services",
    farRef: "FAR 13.307(d)",
    uses: "Simplified acquisition orders for supplies or services. Used for purchases under SAT, BPA calls, and task orders.",
    color: "#4ac8aa",
  },
  {
    id: "OF336",
    title: "OF-336",
    subtitle: "Continuation Sheet",
    farRef: "FAR 53.213(f)",
    uses: "Continuation pages for any SF form when additional space is needed for CLINs, clauses, or other content.",
    color: C.dim,
  },
];

// ═══════════════════════════════════════════════════════════════════
// BLOCK DEFINITIONS PER FORM
// ═══════════════════════════════════════════════════════════════════

function getBlocks(formId, intake, clins) {
  const v = parseFloat(intake?.value) || 0;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

  switch (formId) {

    case "SF1449": return [
      { id: "1",  label: "Req. No.",                    value: intake?.prNumber || "", span: 1 },
      { id: "2",  label: "Contract No.",                value: intake?.contractNumber || "", span: 1 },
      { id: "3",  label: "Award/Effective Date",        value: "", span: 1 },
      { id: "4",  label: "Order No.",                   value: "", span: 1 },
      { id: "5",  label: "Solicitation No.",            value: intake?.solNumber || "", span: 1 },
      { id: "6",  label: "Solicitation Issue Date",     value: "", span: 1 },
      { id: "7",  label: "CO Name (for info)",          value: intake?.coName || "", span: 1 },
      { id: "8",  label: "CO Phone",                    value: "", span: 1 },
      { id: "9",  label: "Set-Aside (100%)",            value: ["TOTAL_SB","8A","HUBZONE","SDVOSB","WOSB"].includes(intake?.competitionStrategy) ? "X" : "", span: 1 },
      { id: "10", label: "Set-Aside %",                 value: "", span: 1 },
      { id: "11", label: "FOB Point",                   value: "Destination", span: 1 },
      { id: "12", label: "Discount Terms",              value: "Net 30", span: 1 },
      { id: "13", label: "DPAS Rating",                 value: "", span: 1 },
      { id: "14", label: "Method of Solicitation",      value: v <= 250000 ? "RFQ" : "RFP", span: 1 },
      { id: "15", label: "Deliver To",                  value: intake?.center || "NASA Ames Research Center", span: 2 },
      { id: "16", label: "FAR Authority",               value: intake?.isCommercial === "YES" ? "FAR 12.6 / 13.5" : "FAR Part 15", span: 2 },
      { id: "17", label: "Accounting / Appropriation Data", value: intake?.fundCite || "", span: 4 },
      { id: "17a", label: "NAICS Code",                 value: intake?.naics || "", span: 1 },
      { id: "17b", label: "Size Standard",              value: "", span: 1 },
      { id: "18", label: "Payment Terms / EFT",         value: "EFT via SAM.gov (52.232-33)", span: 2 },
      { id: "19", label: "Schedule — Total Award Amount", value: "$" + v.toLocaleString(), span: 2 },
      { id: "20", label: "Table of Contents Attached",  value: "X", span: 1 },
      { id: "30", label: "Contractor Name",             value: "", span: 2 },
      { id: "31", label: "Facility Code",               value: "", span: 1 },
      { id: "32", label: "Business Size",               value: "", span: 1 },
      { id: "33", label: "TIN",                         value: "", span: 1 },
      { id: "34", label: "Entity Type",                 value: "", span: 1 },
      { id: "35", label: "Street Address",              value: "", span: 2 },
      { id: "36", label: "City / State / ZIP",          value: "", span: 2 },
      { id: "37", label: "Offer accepted (ref date)",   value: "", span: 2 },
      { id: "38", label: "CO Signature",                value: intake?.coName || "", span: 1 },
      { id: "39", label: "CO Name (print)",             value: intake?.coName || "", span: 1 },
      { id: "40", label: "CO Title",                    value: "Contracting Officer", span: 1 },
      { id: "41", label: "Date Signed (CO)",            value: "", span: 1 },
    ];

    case "SF26": return [
      { id: "1",  label: "Award/Contract No.",          value: intake?.contractNumber || "", span: 1 },
      { id: "2",  label: "Effective Date",              value: "", span: 1 },
      { id: "3",  label: "Solicitation No.",            value: intake?.solNumber || "", span: 1 },
      { id: "4",  label: "Solicitation Date",           value: "", span: 1 },
      { id: "5",  label: "Requisition/Purchase Request No.", value: intake?.prNumber || "", span: 2 },
      { id: "6",  label: "Priority Rating (DPAS)",      value: "", span: 1 },
      { id: "7",  label: "Issued By (Code)",            value: intake?.center || "NASA ARC", span: 1 },
      { id: "8",  label: "This Contract Is A Rated Order Under DPAS", value: "", span: 2 },
      { id: "9",  label: "Discount for Prompt Payment", value: "Net 30", span: 1 },
      { id: "10", label: "Submit Invoices To",          value: "NASA Shared Services Center (NSSC)", span: 1 },
      { id: "11", label: "Ship To / Mark For",          value: intake?.center || "", span: 2 },
      { id: "12", label: "Accounting and Appropriation Data", value: intake?.fundCite || "", span: 4 },
      { id: "13", label: "Contract / Order Total ($)",  value: "$" + v.toLocaleString(), span: 2 },
      { id: "14", label: "Contractor Name and Address", value: "", span: 2 },
      { id: "15", label: "Facility Code",               value: "", span: 1 },
      { id: "16", label: "Business Type",               value: "", span: 1 },
      { id: "17", label: "Contractor TIN",              value: "", span: 1 },
      { id: "18", label: "UEI",                         value: "", span: 1 },
      { id: "19", label: "Contractor Signature",        value: "", span: 1 },
      { id: "20", label: "Name of Contractor Signer",   value: "", span: 1 },
      { id: "21", label: "Title of Signer",             value: "", span: 1 },
      { id: "22", label: "Date Signed (Contractor)",    value: "", span: 1 },
      { id: "23", label: "CO Name",                     value: intake?.coName || "", span: 1 },
      { id: "24", label: "CO Signature",                value: intake?.coName || "", span: 1 },
      { id: "25", label: "Date Signed (CO)",            value: "", span: 1 },
    ];

    case "SF33": return [
      { id: "1",  label: "Solicitation No.",            value: intake?.solNumber || "", span: 2 },
      { id: "2",  label: "Type of Solicitation",        value: v <= 250000 ? "RFQ" : "RFP", span: 1 },
      { id: "3",  label: "Date Issued",                 value: "", span: 1 },
      { id: "4",  label: "Requisition/Purchase Request No.", value: intake?.prNumber || "", span: 2 },
      { id: "5",  label: "Certified For National Defense", value: "", span: 1 },
      { id: "6",  label: "Issued By (Code)",            value: intake?.center || "NASA ARC", span: 1 },
      { id: "7",  label: "Address Offer To",            value: intake?.coEmail || "", span: 1 },
      { id: "8",  label: "Offers due date/time",        value: "", span: 2 },
      { id: "9",  label: "Sealed Offers / F.O.B. Destination", value: "Destination", span: 1 },
      { id: "10", label: "For Information Call: Name",  value: intake?.coName || "", span: 1 },
      { id: "11", label: "For Information Call: Phone", value: "", span: 1 },
      { id: "12", label: "Discount For Prompt Payment", value: "Net 30", span: 1 },
      { id: "13", label: "Accounting and Appropriation Data", value: intake?.fundCite || "", span: 4 },
      { id: "14", label: "Ship To / Mark For",          value: intake?.center || "", span: 2 },
      { id: "15", label: "Payment Will Be Made By",     value: "NASA NSSC", span: 1 },
      { id: "16", label: "Authority for Using Other Than Full and Open Competition", value: intake?.competitionStrategy === "SOLE_SOURCE" ? "FAR 6.302" : "", span: 2 },
      { id: "17", label: "Table of Contents (check)",   value: "X", span: 1 },
      // Offer blocks
      { id: "18", label: "Offeror Name and Address",    value: "", span: 2 },
      { id: "19", label: "UEI",                         value: "", span: 1 },
      { id: "20", label: "Offeror TIN",                 value: "", span: 1 },
      { id: "21", label: "Remittance Address",          value: "", span: 2 },
      { id: "22", label: "Offer Acknowledgment Date",   value: "", span: 1 },
      // Award blocks
      { id: "27", label: "Award of Contract — Accept Offer Dated", value: "", span: 2 },
      { id: "28", label: "Accounting and Appropriation Data (Award)", value: intake?.fundCite || "", span: 2 },
      { id: "29", label: "Award Amount",                value: "$" + v.toLocaleString(), span: 1 },
      { id: "30", label: "CO Signature",                value: intake?.coName || "", span: 1 },
      { id: "31", label: "Name of CO (type/print)",     value: intake?.coName || "", span: 1 },
      { id: "32", label: "Date Signed",                 value: "", span: 1 },
    ];

    case "SF18": return [
      { id: "1",  label: "Request for Quotation No.",   value: intake?.solNumber || ("RFQ-" + (intake?.prNumber || "")), span: 2 },
      { id: "2",  label: "Date Issued",                 value: "", span: 1 },
      { id: "3",  label: "Page",                        value: "1 of", span: 1 },
      { id: "4",  label: "Requisition No.",             value: intake?.prNumber || "", span: 2 },
      { id: "5",  label: "Rating (DPAS)",               value: "", span: 1 },
      { id: "6",  label: "Issued By",                   value: intake?.center || "NASA ARC", span: 2 },
      { id: "7",  label: "Address Quotation To",        value: "", span: 2 },
      { id: "8",  label: "Delivery Required By",        value: "", span: 1 },
      { id: "9",  label: "Delivery FOB",                value: "Destination", span: 1 },
      { id: "10", label: "Quotation Due Date / Time",   value: "", span: 2 },
      { id: "11", label: "Discount Terms",              value: "Net 30", span: 1 },
      { id: "12", label: "Delivery Will Be Made To",    value: intake?.center || "", span: 2 },
      { id: "13", label: "Authority for Purchase",      value: intake?.isCommercial === "YES" ? "FAR 13.5 / Part 12" : "FAR Part 13", span: 2 },
      { id: "14", label: "THIS IS NOT AN ORDER",        value: "This is a Request for Quotations only. The Government is not committed to pay for any costs incurred in the preparation of this quotation.", span: 4 },
      // Vendor quote section
      { id: "15", label: "Name and Address of Quoter",  value: "", span: 2 },
      { id: "16", label: "Signature of Person Authorized to Quote", value: "", span: 1 },
      { id: "17", label: "Date of Quotation",           value: "", span: 1 },
      { id: "18", label: "Name (Type or Print)",        value: "", span: 1 },
      { id: "19", label: "Title",                       value: "", span: 1 },
      { id: "20", label: "Phone",                       value: "", span: 1 },
    ];

    case "SF1442": return [
      { id: "1",  label: "Solicitation No.",            value: intake?.solNumber || "", span: 2 },
      { id: "2",  label: "Type of Solicitation",        value: "IFB / RFP", span: 1 },
      { id: "3",  label: "Date Issued",                 value: "", span: 1 },
      { id: "4",  label: "Contract No.",                value: intake?.contractNumber || "", span: 1 },
      { id: "5",  label: "Requisition/PR No.",          value: intake?.prNumber || "", span: 1 },
      { id: "6",  label: "Project No.",                 value: "", span: 1 },
      { id: "7",  label: "Issued By",                   value: intake?.center || "NASA ARC", span: 2 },
      { id: "8",  label: "Address Offer To",            value: intake?.coEmail || "", span: 2 },
      { id: "9",  label: "Sealed Offers Due",           value: "", span: 2 },
      { id: "10", label: "For Information Call",        value: (intake?.coName || "") + " | " + (intake?.coEmail || ""), span: 2 },
      { id: "11", label: "Table of Contents",           value: "X", span: 1 },
      { id: "12", label: "Description of Work",         value: intake?.reqTitle || "", span: 4 },
      { id: "13", label: "Place of Performance",        value: intake?.center || "", span: 2 },
      { id: "14", label: "Accept Alternate Offers?",    value: "", span: 1 },
      { id: "15", label: "Accounting Data",             value: intake?.fundCite || "", span: 4 },
      // Award section
      { id: "20", label: "Award Amount",                value: "$" + v.toLocaleString(), span: 1 },
      { id: "21", label: "Accounting and Appropriation", value: intake?.fundCite || "", span: 2 },
      { id: "22", label: "CO Signature",                value: intake?.coName || "", span: 1 },
      { id: "23", label: "Name of CO",                  value: intake?.coName || "", span: 1 },
      { id: "24", label: "Date Signed",                 value: "", span: 1 },
    ];

    case "SF1447": return [
      { id: "1",  label: "Contract/Solicitation No.",   value: intake?.contractNumber || intake?.solNumber || "", span: 2 },
      { id: "2",  label: "Effective Date",              value: "", span: 1 },
      { id: "3",  label: "Solicitation Type",           value: v <= 250000 ? "RFQ" : "RFP", span: 1 },
      { id: "4",  label: "Requisition No.",             value: intake?.prNumber || "", span: 2 },
      { id: "5",  label: "Issued By",                   value: intake?.center || "NASA ARC", span: 2 },
      { id: "6",  label: "Administered By",             value: intake?.center || "NASA ARC", span: 2 },
      { id: "7",  label: "Name and Address of Contractor", value: "", span: 2 },
      { id: "8",  label: "UEI",                         value: "", span: 1 },
      { id: "9",  label: "Facility Code",               value: "", span: 1 },
      { id: "10", label: "Business Type",               value: "", span: 1 },
      { id: "11", label: "TIN",                         value: "", span: 1 },
      { id: "12", label: "Accounting Data",             value: intake?.fundCite || "", span: 4 },
      { id: "13", label: "Total Contract Amount",       value: "$" + v.toLocaleString(), span: 2 },
      { id: "14", label: "FAR Authority",               value: "FAR Part 12/13", span: 2 },
      { id: "15", label: "CO Signature",                value: intake?.coName || "", span: 1 },
      { id: "16", label: "CO Name",                     value: intake?.coName || "", span: 1 },
      { id: "17", label: "Date Signed",                 value: "", span: 1 },
    ];

    case "OF347": return [
      { id: "1",  label: "Order No.",                   value: intake?.contractNumber || "", span: 1 },
      { id: "2",  label: "Date of Order",               value: today, span: 1 },
      { id: "3",  label: "Req. No.",                    value: intake?.prNumber || "", span: 1 },
      { id: "4",  label: "Req. Date",                   value: "", span: 1 },
      { id: "5",  label: "Priority Rating (DPAS)",      value: "", span: 1 },
      { id: "6",  label: "Issuing Office Name/Address", value: intake?.center || "NASA ARC", span: 2 },
      { id: "7",  label: "To (Vendor Name/Address)",    value: "", span: 2 },
      { id: "8",  label: "Delivery FOB",                value: "Destination", span: 1 },
      { id: "9",  label: "Discount Terms",              value: "Net 30", span: 1 },
      { id: "10", label: "Deliver To",                  value: intake?.center || "", span: 2 },
      { id: "11", label: "Ship Via",                    value: "Best way", span: 1 },
      { id: "12", label: "If Quantity Accepted by Govt Differs...", value: "Contact CO", span: 2 },
      { id: "13", label: "Accounting and Appropriation Data", value: intake?.fundCite || "", span: 4 },
      { id: "14", label: "NAICS",                       value: intake?.naics || "", span: 1 },
      { id: "15", label: "BPA No. (if applicable)",     value: "", span: 1 },
      { id: "17", label: "Total Amount",                value: "$" + v.toLocaleString(), span: 1 },
      { id: "18", label: "CO Signature",                value: intake?.coName || "", span: 1 },
      { id: "19", label: "CO Name (print)",             value: intake?.coName || "", span: 1 },
      { id: "20", label: "Title",                       value: "Contracting Officer", span: 1 },
      { id: "21", label: "Date",                        value: "", span: 1 },
    ];

    case "OF336": return [
      { id: "1",  label: "Continuation of (Form / Block No.)", value: "", span: 2 },
      { id: "2",  label: "Page No.",                    value: "", span: 1 },
      { id: "3",  label: "Solicitation/Contract/Order No.", value: intake?.contractNumber || intake?.solNumber || "", span: 2 },
      { id: "4",  label: "Content (CLINs, clauses, terms, or other continuation)", value: "", span: 4, multiline: true },
    ];

    default: return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION B CLIN BUILDER (embedded in SF form)
// ═══════════════════════════════════════════════════════════════════

export function ClinBuilder({ intake, onChange }) {
  const [clins, setClins] = useState([
    { id: "0001", title: "", type: "FFP", unit: "LOT", qty: "1", unitPrice: "", description: "", isOption: false, optionYear: null },
  ]);

  const totalBase = clins.filter(c => !c.isOption).reduce((s,c) => s + (parseFloat(c.unitPrice)||0) * (parseFloat(c.qty)||0), 0);
  const totalOptions = clins.filter(c => c.isOption).reduce((s,c) => s + (parseFloat(c.unitPrice)||0) * (parseFloat(c.qty)||0), 0);

  function addClin(isOption = false, optYear = null) {
    const last = clins[clins.length - 1];
    const nextNum = String(parseInt(last?.id || "0") + 1).padStart(4, "0");
    // Option CLINs: 1001, 1002... 2001, 2002... per option year
    let id = nextNum;
    if (isOption && optYear !== null) {
      const base = (optYear + 1) * 1000;
      const existing = clins.filter(c => c.isOption && c.optionYear === optYear).length;
      id = String(base + existing + 1).padStart(4, "0");
    }
    setClins(c => {
      const updated = [...c, { id, title: "", type: "FFP", unit: "LOT", qty: "1", unitPrice: "", description: "", isOption, optionYear: optYear }];
      onChange && onChange(updated);
      return updated;
    });
  }

  function updateClin(idx, field, value) {
    setClins(c => {
      const updated = c.map((cl, i) => i === idx ? { ...cl, [field]: value } : cl);
      onChange && onChange(updated);
      return updated;
    });
  }

  function removeClin(idx) {
    setClins(c => {
      const updated = c.filter((_, i) => i !== idx);
      onChange && onChange(updated);
      return updated;
    });
  }

  const optionYears = [...new Set(clins.filter(c => c.isOption && c.optionYear !== null).map(c => c.optionYear))].sort();

  return (
    <div style={{ fontFamily: "FONT_COMP" }}>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>SECTION B — CLINS / PRICING</div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px" }}>
          <div style={{ fontSize: 9, color: C.muted }}>BASE TOTAL</div>
          <div style={{ fontSize: 13, color: C.blue, fontWeight: "bold" }}>${totalBase.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        {totalOptions > 0 && (
          <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px" }}>
            <div style={{ fontSize: 9, color: C.muted }}>OPTIONS TOTAL</div>
            <div style={{ fontSize: 13, color: C.yellow, fontWeight: "bold" }}>${totalOptions.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
        )}
        <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 12px" }}>
          <div style={{ fontSize: 9, color: C.muted }}>TOTAL W/ OPTIONS</div>
          <div style={{ fontSize: 13, color: C.green, fontWeight: "bold" }}>${(totalBase + totalOptions).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* CLIN table */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 60px 60px 110px 70px 28px", gap: 0,
                      background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: "5px 8px" }}>
          {["CLIN","TITLE / DESCRIPTION","TYPE","UNIT","QTY","UNIT PRICE","TOTAL",""].map(h => (
            <div key={h} style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {clins.map((cl, i) => {
          const total = (parseFloat(cl.unitPrice)||0) * (parseFloat(cl.qty)||0);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 60px 60px 110px 70px 28px",
                                   gap: 0, padding: "4px 8px", borderBottom: `1px solid ${C.border}`,
                                   background: cl.isOption ? "#0a0a1a" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input value={cl.id} onChange={e => updateClin(i,"id",e.target.value)}
                  style={{ ...inp, width: 50, padding: "3px 4px", fontSize: 10 }} />
              </div>
              <div>
                <input value={cl.title} onChange={e => updateClin(i,"title",e.target.value)}
                  placeholder="CLIN title..." style={{ ...inp, padding: "3px 6px", fontSize: 10 }} />
                <input value={cl.description} onChange={e => updateClin(i,"description",e.target.value)}
                  placeholder="Description (optional)" style={{ ...inp, padding: "2px 6px", fontSize: 9, marginTop: 2, color: C.dim }} />
              </div>
              <select value={cl.type} onChange={e => updateClin(i,"type",e.target.value)}
                style={{ ...inp, padding: "3px 4px", fontSize: 10 }}>
                {["FFP","T&M","LH","CPFF","COST","NSP","TBD"].map(t => <option key={t}>{t}</option>)}
              </select>
              <input value={cl.unit} onChange={e => updateClin(i,"unit",e.target.value)}
                style={{ ...inp, padding: "3px 4px", fontSize: 10 }} />
              <input value={cl.qty} onChange={e => updateClin(i,"qty",e.target.value)} type="number"
                style={{ ...inp, padding: "3px 4px", fontSize: 10 }} />
              <input value={cl.unitPrice} onChange={e => updateClin(i,"unitPrice",e.target.value)}
                placeholder="0.00" style={{ ...inp, padding: "3px 4px", fontSize: 10 }} />
              <div style={{ fontSize: 10, color: total > 0 ? C.text : C.dim, display: "flex", alignItems: "center", paddingLeft: 4 }}>
                {total > 0 ? "$" + total.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : "—"}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button onClick={() => removeClin(i)}
                  style={{ background: "none", border: "none", color: "#4a2a2a", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add buttons */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={() => addClin(false)}
          style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.blue,
                   padding: "5px 12px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
          + BASE CLIN
        </button>
        {[1,2,3,4,5].map(yr => (
          <button key={yr} onClick={() => addClin(true, yr)}
            style={{ background: "#0a0a1a", border: `1px solid #2a2a5a`, color: C.dim,
                     padding: "5px 12px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
            + OPT YEAR {yr}
          </button>
        ))}
      </div>

      {/* Section B text preview */}
      <details style={{ marginTop: 12 }}>
        <summary style={{ fontSize: 10, color: C.muted, cursor: "pointer", userSelect: "none" }}>
          SECTION B TEXT PREVIEW
        </summary>
        <pre style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 3, padding: 10,
                      fontSize: 9, color: C.dim, marginTop: 6, overflow: "auto", maxHeight: 200, whiteSpace: "pre-wrap" }}>
          {buildSectionBText(clins, intake)}
        </pre>
      </details>
    </div>
  );
}

function buildSectionBText(clins, intake) {
  let text = "SECTION B — SUPPLIES OR SERVICES AND PRICES\n\n";
  const base = clins.filter(c => !c.isOption);
  const optYears = [...new Set(clins.filter(c => c.isOption).map(c => c.optionYear))].sort();

  if (base.length) {
    text += "BASE PERIOD\n";
    base.forEach(c => {
      const total = (parseFloat(c.unitPrice)||0)*(parseFloat(c.qty)||0);
      text += `CLIN ${c.id}  ${c.title}\n`;
      if (c.description) text += `           ${c.description}\n`;
      text += `           Type: ${c.type} | Unit: ${c.unit} | Qty: ${c.qty}`;
      if (c.unitPrice) text += ` | Unit Price: $${parseFloat(c.unitPrice).toLocaleString("en-US",{minimumFractionDigits:2})}`;
      if (total > 0) text += ` | Total: $${total.toLocaleString("en-US",{minimumFractionDigits:2})}`;
      text += "\n\n";
    });
  }

  optYears.forEach(yr => {
    const optClins = clins.filter(c => c.isOption && c.optionYear === yr);
    text += `OPTION YEAR ${yr}\n`;
    optClins.forEach(c => {
      const total = (parseFloat(c.unitPrice)||0)*(parseFloat(c.qty)||0);
      text += `CLIN ${c.id}  ${c.title}\n`;
      if (c.description) text += `           ${c.description}\n`;
      text += `           Type: ${c.type} | Unit: ${c.unit} | Qty: ${c.qty}`;
      if (c.unitPrice) text += ` | Unit Price: $${parseFloat(c.unitPrice).toLocaleString("en-US",{minimumFractionDigits:2})}`;
      if (total > 0) text += ` | Total: $${total.toLocaleString("en-US",{minimumFractionDigits:2})}`;
      text += "\n\n";
    });
  });

  return text;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SF FORM BUILDER COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function SFFormBuilder({ intake, initialForm }) {
  const [selectedForm, setSelectedForm] = useState(initialForm || "SF1449");
  const [fieldValues, setFieldValues] = useState({});
  const [clins, setClins] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [showClinBuilder, setShowClinBuilder] = useState(false);

  const form = SF_FORMS.find(f => f.id === selectedForm);
  const blocks = useMemo(() => getBlocks(selectedForm, intake, clins), [selectedForm, intake, clins]);

  // Merge defaults with user edits
  const merged = useMemo(() => {
    const m = {};
    blocks.forEach(b => { m[b.id] = fieldValues[b.id] !== undefined ? fieldValues[b.id] : b.value; });
    return m;
  }, [blocks, fieldValues]);

  function setField(id, value) {
    setFieldValues(v => ({ ...v, [id]: value }));
  }

  async function exportWord() {
    setExporting(true);
    try {
      const err = await exportFormWord(selectedForm, form, blocks, merged, clins, intake);
      if (err) alert(err);
    } catch(e) { alert("Export failed: " + e.message); }
    setExporting(false);
  }

  return (
    <div style={{ fontFamily: "FONT_COMP", color: C.text, background: C.bg }}>

      {/* Form selector */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, overflow: "auto" }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8 }}>SELECT FORM</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {SF_FORMS.map(f => (
            <button key={f.id} onClick={() => setSelectedForm(f.id)}
              style={{ padding: "5px 12px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: "bold",
                       background: selectedForm === f.id ? "#0a2a4a" : C.bg3,
                       border: `1px solid ${selectedForm === f.id ? f.color : C.border}`,
                       color: selectedForm === f.id ? f.color : C.dim }}>
              {f.title}
            </button>
          ))}
        </div>
        {form && (
          <div style={{ marginTop: 8, fontSize: 10, color: C.dim }}>
            <span style={{ color: form.color, fontWeight: "bold" }}>{form.subtitle}</span>
            {" — "}{form.uses}
          </div>
        )}
      </div>

      {/* CLIN builder toggle */}
      {["SF1449","SF26","SF33","OF347","SF1447"].includes(selectedForm) && (
        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setShowClinBuilder(!showClinBuilder)}
            style={{ background: showClinBuilder ? "#0a2a4a" : C.bg3,
                     border: `1px solid ${showClinBuilder ? C.blue : C.border}`,
                     color: showClinBuilder ? C.blue : C.muted,
                     padding: "5px 14px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
            {showClinBuilder ? "▲ HIDE CLIN BUILDER" : "▼ SECTION B — CLIN BUILDER"}
          </button>
        </div>
      )}
      {showClinBuilder && (
        <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
          <ClinBuilder intake={intake} onChange={setClins} />
        </div>
      )}

      {/* Form blocks */}
      <div style={{ padding: 16, overflow: "auto", maxHeight: "55vh" }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10 }}>
          {form?.title} BLOCKS — {blocks.length} FIELDS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {blocks.map(b => (
            <div key={b.id}
              style={{ gridColumn: b.span >= 4 ? "1 / -1" : b.span >= 2 ? "1 / -1" : "span 1",
                       background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 4, padding: "7px 10px" }}>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>
                Block {b.id} — {b.label}
              </div>
              {b.multiline ? (
                <textarea value={merged[b.id] || ""}
                  onChange={e => setField(b.id, e.target.value)}
                  style={{ ...inp, minHeight: 80, resize: "vertical" }} />
              ) : (
                <input value={merged[b.id] || ""}
                  onChange={e => setField(b.id, e.target.value)}
                  style={inp} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <button onClick={exportWord} disabled={exporting}
          style={{ background: "#0a1a3a", border: `1px solid ${C.blue}`, color: C.blue,
                   padding: "8px 18px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>
          {exporting ? "EXPORTING..." : `EXPORT ${form?.title} (.docx)`}
        </button>
        <button onClick={() => {
          const text = buildFormText(selectedForm, form, blocks, merged, clins, intake);
          navigator.clipboard.writeText(text);
        }}
          style={{ background: C.bg3, border: `1px solid ${C.border}`, color: C.muted,
                   padding: "8px 14px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
          COPY TEXT
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WORD EXPORT
// ═══════════════════════════════════════════════════════════════════

async function exportFormWord(formId, form, blocks, merged, clins, intake) {
  try {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      AlignmentType, WidthType, BorderStyle, convertInchesToTwip, HeadingLevel,
    } = await import("docx");

    const title   = intake?.reqTitle || "NASA Requirement";
    const center  = intake?.center   || "NASA Ames Research Center";
    const date    = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

    const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
    const cellBorder = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

    const header = [
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: "NATIONAL AERONAUTICS AND SPACE ADMINISTRATION", bold: true, size: 22, font: "Times New Roman" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: center, size: 22, font: "Times New Roman" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: form?.title + " — " + form?.subtitle, bold: true, size: 24, font: "Times New Roman" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 300 },
        children: [new TextRun({ text: title + "  |  " + date, size: 20, italics: true, font: "Times New Roman" })],
      }),
    ];

    // Build block table
    const blockRows = blocks.map(b => new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          children: [new Paragraph({
            children: [new TextRun({ text: `Block ${b.id}  ${b.label}`, bold: true, size: 18, font: "Times New Roman" })],
            spacing: { after: 0 },
          })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: cellBorder,
          children: [new Paragraph({
            children: [new TextRun({ text: merged[b.id] || "", size: 20, font: "Times New Roman" })],
            spacing: { after: 0 },
          })],
        }),
      ],
    }));

    const blockTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorder,
              children: [new Paragraph({ children: [new TextRun({ text: "Block / Field", bold: true, size: 20, font: "Times New Roman" })] })],
            }),
            new TableCell({
              borders: cellBorder,
              children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true, size: 20, font: "Times New Roman" })] })],
            }),
          ],
        }),
        ...blockRows,
      ],
    });

    // CLIN table if applicable
    const clinSection = clins.length > 0 ? [
      new Paragraph({ text: "", spacing: { before: 300, after: 100 } }),
      new Paragraph({
        children: [new TextRun({ text: "SECTION B — CLINS / PRICING", bold: true, size: 22, font: "Times New Roman" })],
        spacing: { after: 100 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: ["CLIN","Title","Type","Qty","Unit Price","Total"].map(h =>
            new TableCell({ borders: cellBorder, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font:"Times New Roman" })] })] })
          )}),
          ...clins.map(c => {
            const total = (parseFloat(c.unitPrice)||0)*(parseFloat(c.qty)||0);
            return new TableRow({ children: [
              c.id, c.title, c.type, c.qty,
              c.unitPrice ? "$"+parseFloat(c.unitPrice).toLocaleString("en-US",{minimumFractionDigits:2}) : "",
              total > 0 ? "$"+total.toLocaleString("en-US",{minimumFractionDigits:2}) : "",
            ].map(val => new TableCell({ borders: cellBorder, children: [new Paragraph({ children: [new TextRun({ text: val||"", size: 18, font:"Times New Roman" })] })] })) });
          }),
        ],
      }),
    ] : [];

    // CO signature
    const sigBlock = [
      new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: "_".repeat(40), size: 22, font: "Times New Roman" })], spacing: { before: 300, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: intake?.coName || "[Contracting Officer]", size: 22, font: "Times New Roman" })], spacing: { after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: "Contracting Officer", size: 22, font: "Times New Roman" })], spacing: { after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: "Date: _________________", size: 22, font: "Times New Roman" })], spacing: { after: 0 } }),
    ];

    const doc = new Document({
      styles: { default: { document: { run: { font: "Times New Roman", size: 22 } } } },
      sections: [{
        properties: { page: { margin: {
          top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25),
        }}},
        children: [...header, blockTable, ...clinSection, ...sigBlock],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = formId + "_" + (intake?.reqTitle||"doc").replace(/[^a-zA-Z0-9 ]/g,"").replace(/ /g,"_").slice(0,25) + ".docx";
    a.click();
    URL.revokeObjectURL(url);
    return null;
  } catch(e) {
    return "Export failed: " + e.message;
  }
}

function buildFormText(formId, form, blocks, merged, clins, intake) {
  let text = `${form?.title} — ${form?.subtitle}\n${"═".repeat(70)}\n\n`;
  blocks.forEach(b => {
    if (merged[b.id]) text += `Block ${b.id}  ${b.label}:\n  ${merged[b.id]}\n\n`;
  });
  if (clins.length) {
    text += "\nSECTION B — CLINs\n" + buildSectionBText(clins, intake);
  }
  return text;
}
