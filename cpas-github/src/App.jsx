;

function buildRoadmap(intake) {
  const { value, isCommercial, competitionStrategy, reqType, isRecompete, center } = intake;
  const lane = getAcqLane(value, isCommercial, competitionStrategy);
  const isTaskOrder = lane === "TASK_ORDER";
  const needsAcqPlan = value > 10000000;
  const needsMBP = value >= 50000000;
  const needsJOFOC = competitionStrategy === "SOLE_SOURCE";
  const needsSBA = value > 150000;
  const needsDCAA = !["YES","TBD"].includes(isCommercial) && value > 750000;
  const needsLegal = value > 5000000 || needsJOFOC;
  const isMicro = lane === "MICROPURCHASE";

  const phases = [];

  phases.push({ id:"P1", title:"Package Validation",
    steps:[
      { id:"P1S1", title:"Purchase Requisition in CF/SAP", type:"CHECK", nfs:"NFS 1804.7301(a)" },
      { id:"P1S2", title:"NF 1707 - Special Approvals & Affirmations", type:"CHECK", nfs:"NFS 1804.7301(a)" },
      { id:"P1S3", title:"Statement of Work / PWS", reviewType:"SOW", type:"CHECK", nfs:"NFS 1807.105(b)(7)" },
      { id:"P1S4", title:"IGCE", reviewType:"IGCE", type:"GENERATE", packages:[{key:"IGCE",label:"IGCE Document",docType:"IGCE"}], nfs:"NFS 1807.105(a)(3)" },
      { id:"P1S5", title:"Funds Availability Certification", type:"CHECK", nfs:"NFS 1804.7301(b)" },
      ...(reqType === "SERVICES" ? [{ id:"P1S6", title:"Inherently Governmental Determination", type:"CHECK", nfs:"NFS 1807.503(e)" }] : []),
      ...(reqType === "IT" ? [{ id:"P1S7", title:"IPv6 & ELMT Coordination (NF 1707 S2.II/2.III)", type:"CHECK", nfs:"NFS 1811.002(g)" }] : []),
      { id:"P1S8", title:"COR Nomination", type:"CHECK", nfs:"NFS 1801.602-2" },
    ]
  });

  // ── TASK ORDER LANE ─────────────────────────────────────────────
  if (isTaskOrder) {
    phases.push({ id:"P2", title:"Vehicle Identification & Fair Opportunity",
      steps:[
        { id:"P2S1", title:"Identify Applicable Contract Vehicle", type:"DECISION", nfs:"FAR 16.505",
          decisionOptions:[
            { label:"GWAC (SEWP, NITAAC, Alliant)", sub:"GSA or NIH-managed multi-award IDIQ." },
            { label:"Agency IDIQ (Multiple Award)", sub:"NASA or other agency IDIQ vehicle." },
            { label:"Single-Award IDIQ", sub:"Order against sole contractor vehicle." },
            { label:"GSA Schedule (FAR 8.4)", sub:"FSS schedule order." },
          ]},
        { id:"P2S2", title:"Confirm Ordering Period is Active", type:"CHECK", nfs:"FAR 16.505(a)(1)" },
        { id:"P2S3", title:"NAICS Code & Size Standard", type:"FORM", formType:"NAICS" },
        { id:"P2S4", title:"Fair Opportunity Decision", type:"DECISION", nfs:"FAR 16.505(b)",
          decisionOptions:[
            { label:"Full Fair Opportunity - RFQ to all awardees", sub:"FAR 16.505(b)(1) - Standard approach." },
            { label:"Exception: Only One Capable", sub:"FAR 16.505(b)(2)(i)(A) - Document why." },
            { label:"Exception: Unusual Urgency", sub:"FAR 16.505(b)(2)(i)(B) - Time does not permit." },
            { label:"Exception: Logical Follow-On", sub:"FAR 16.505(b)(2)(i)(C) - Continuation of prior order." },
            { label:"Exception: Best Interest of Government", sub:"FAR 16.505(b)(2)(i)(D) - HCA approval req." },
          ]},
        { id:"P2S5", title:"Draft Fair Opportunity Exception D&F (if applicable)", type:"GENERATE",
          docType:"JOFOC", packages:[{key:"FO_EXCEPTION",label:"Fair Opportunity Exception D&F",docType:"JOFOC"}],
          condition: "fairOpportunityException" },
      ]
    });

    phases.push({ id:"P3", title:"Solicitation & Award",
      steps:[
        { id:"P3S1", title:"Draft Task Order RFQ / SOO", type:"GENERATE",
          packages:[{key:"SOL_OVERVIEW",label:"Task Order Solicitation",docType:"SOL_OVERVIEW"}] },
        { id:"P3S2", title:"Section B - CLINs & Pricing", type:"GENERATE",
          packages:[{key:"SOL_OVERVIEW",label:"CLIN Structure",docType:"SOL_OVERVIEW"}] },
        { id:"P3S3", title:"Section H/I - Special Requirements & Clauses", type:"GENERATE",
          packages:[{key:"CLAUSE_MATRIX",label:"Clause Matrix",docType:"CLAUSE_MATRIX"}] },
        { id:"P3S4", title:"Issue RFQ via Vehicle Portal / SAM", type:"CHECK", nfs:"FAR 16.505(b)(1)(iv)" },
        { id:"P3S5", title:"Evaluate Quotes & Document Best Value", type:"CHECK", nfs:"FAR 16.505(b)(1)" },
        { id:"P3S6", title:"Price Reasonableness Determination", type:"GENERATE",
          packages:[{key:"PNM",label:"Price Negotiation Memo",docType:"PNM"}] },
        { id:"P3S7", title:"Award Task Order", type:"GENERATE",
          packages:[{key:"AWARD_DOC",label:"Award Document",docType:"AWARD_DOC"}] },
      ]
    });

    phases.push({ id:"P4", title:"Post-Award",
      steps:[
        { id:"P4S1", title:"COR Appointment Letter", type:"GENERATE",
          packages:[{key:"COR_LETTER",label:"COR Letter",docType:"COR_LETTER"}] },
        { id:"P4S2", title:"Kickoff Meeting Agenda", type:"GENERATE",
          packages:[{key:"KICKOFF",label:"Kickoff Agenda",docType:"KICKOFF"}] },
        { id:"P4S3", title:"QASP", type:"GENERATE",
          packages:[{key:"QASP",label:"QASP",docType:"QASP"}] },
        { id:"P4S4", title:"SAM.gov Post-Award Synopsis", type:"GENERATE",
          packages:[{key:"POST_AWARD_SYN",label:"Post-Award Synopsis",docType:"POST_AWARD_SYN"}] },
      ]
    });

    return { phases, lane, totalSteps: phases.reduce((a,p)=>a+p.steps.length,0) };
  }

  if (!isMicro) {

    const stratSteps = [
      { id:"P2S1", title:"Confirm Acquisition Lane", type:"DECISION", nfs:"FAR Parts 12/13/15",
        decisionOptions:[
          { label:"Confirm: "+(getLaneLabel(lane)), sub:"Proceed with system-recommended lane." },
          { label:"Override - Change Lane", sub:"Document rationale for deviation from recommended approach." },
        ] },
      { id:"P2S2", title:"NAICS Code & Size Standard", type:"FORM", formType:"NAICS" },
      { id:"P2S3", title:"PSC Code", type:"FORM", formType:"PSC" },
      { id:"P2S4", title:"Competition Strategy Decision", type:"DECISION",
        decisionOptions:[
          { label:"Full and Open Competition", sub:"FAR 6.1 - All responsible sources may submit." },
          { label:"Total Small Business Set-Aside", sub:"FAR 19.502-2 - Reasonable expectation of 2+ SB off." },
          { label:"Sole Source J&A", sub:"FAR 6.302 - One of 7 statutory exceptions required." },
          { label:"Order off Existing Vehicle", sub:"FAR 8/16 - Pre-competed vehicle (GWAC, IDIQ) used." },
        ] },
    ];
    if (needsJOFOC) stratSteps.push(
      { id:"P2S5", title:"Draft JOFOC / J&A", reviewType:"JOFOC", type:"GENERATE", docType:"JOFOC", rcpoDocKey:"JOFOC" }
    );
    if (needsAcqPlan) stratSteps.push(
      { id:"P2S6", title:"Procurement Strategy Meeting (PSM)", type:"GENERATE", docType:"ACQ_PLAN", rcpoDocKey:"ACQ_PLAN" }
    );
    if (needsMBP) stratSteps.push(
      { id:"P2S7", title:"Master Buy Plan Submission", type:"CHECK", nfs:"NFS 1807.7101" }
    );
    phases.push({ id:"P2", title:"Acquisition Strategy",
      steps: stratSteps });

    const coordSteps = [];
    if (needsSBA) coordSteps.push({
      id:"P3S1", title:"Small Business Coordination - NF 1787 Package", type:"COORDINATE", coord:"SBA", rcpoDocKey:"SOLICITATION",
      packages:[
        { key:"NF1787", label:"NF 1787 - Small Business Coordination Record", docType:"NF1787" },
        { key:"NF1787A", label:"NF 1787A - Market Research Report", docType:"NF1787A" },
        { key:"SBA_EMAIL", label:"Coordination Email to SBA PCR", docType:"COORD_EMAIL_SBA" },
      ]
    });
    if (needsDCAA) coordSteps.push({
      id:"P3S2", title:"DCAA Coordination", type:"COORDINATE", coord:"DCAA",
      packages:[
        { key:"DCAA_EMAIL", label:"DCAA Coordination Email", docType:"COORD_EMAIL_DCAA" },
      ]
    });
    if (needsLegal) coordSteps.push({
      id:"P3S3", title:"Office of General Counsel Review", type:"COORDINATE", coord:"LEGAL",
      packages:[
        { key:"LEGAL_EMAIL", label:"OGC Review Request Email", docType:"COORD_EMAIL_LEGAL" },
      ]
    });
    coordSteps.push({
      id:"P3S4", title:"Competition Advocate / Center Small Business Director", type:"COORDINATE", coord:"CA",
      packages:[
        { key:"CA_EMAIL", label:"Competition Advocate Coordination Email", docType:"COORD_EMAIL_CA" },
      ]
    });
    if (coordSteps.length > 0) {
      phases.push({ id:"P3", title:"Coordination",
        steps: coordSteps });
    }

    phases.push({ id:"P4", title:"Market Research",
      steps:[
        { id:"P4S1", title:"Commercial Item Determination", type:"DECISION", nfs:"FAR Part 2 / Part 12",
          decisionOptions:[
            { label:"Commercial Product", sub:"Customarily used by general public, available in m." },
            { label:"Commercial Service", sub:"Offered and sold competitively in substantial quan." },
            { label:"Non-Developmental Item (NDI)", sub:"Developed exclusively at private expense." },
            { label:"Not Commercial", sub:"Government-unique, no commercial equivalent." },
          ] },
        { id:"P4S2", title:"Sources Sought / RFI (if applicable)", type:"GENERATE", docType:"SOURCES_SOUGHT" },
        { id:"P4S3", title:"Market Research Report", type:"GENERATE", docType:"MARKET_RESEARCH" },
      ]
    });

    phases.push({ id:"P5", title:"Solicitation",
      steps:[
        { id:"P5S1", title:"Draft Solicitation Document", reviewType:"CLAUSES", type:"GENERATE", docType:"SOL_OVERVIEW", rcpoDocKey:"SOLICITATION" },
        { id:"P5S2", title:"Clause Matrix - Auto-Prescribe Clauses", type:"GENERATE", docType:"CLAUSE_MATRIX" },
        { id:"P5S3", title:"SAM.gov Synopsis", type:"GENERATE", docType:"SAM_SYNOPSIS" },
        ...(lane === "FAR_15" ? [
          { id:"P5S4", title:"Section L - Instructions to Offerors", type:"GENERATE", docType:"SECTION_L" },
          { id:"P5S5", title:"Section M - Evaluation Criteria", type:"GENERATE", docType:"SECTION_M" },
        ] : []),
      ]
    });

    phases.push({ id:"P6", title:"Evaluation & Award",
      steps:[
        { id:"P6S1", title:"Proposal / Quote Receipt & Log", type:"CHECK" },
        ...(lane === "FAR_15" ? [{ id:"P6S2", title:"Technical Evaluation", type:"CHECK" }] : []),
        { id:"P6S3", title:"Price/Cost Analysis & PNM", type:"GENERATE", docType:"PNM", rcpoDocKey:"PNM" },
        { id:"P6S4", title:"Responsibility Determination", type:"GENERATE", docType:"RESPONSIBILITY" },
        { id:"P6S5", title:"Award Document", type:"GENERATE", docType:"AWARD_DOC", rcpoDocKey:"CONTRACT_AWARD" },
        { id:"P6S6", title:"ANOSCA / Public Announcement", type:"GENERATE", docType:"ANOSCA" },
      ]
    });

    phases.push({ id:"P7", title:"Post-Award",
      steps:[
        { id:"P7S1", title:"COR Appointment Letter", type:"GENERATE", docType:"COR_LETTER" },
        { id:"P7S2", title:"Post-Award Kickoff Meeting", type:"GENERATE", docType:"KICKOFF" },
        ...(reqType === "SERVICES" ? [{ id:"P7S3", title:"QASP Implementation", type:"GENERATE", docType:"QASP" }] : []),
        { id:"P7S4", title:"FPDS-NG Contract Action Report", type:"CHECK", nfs:"FAR 4.6" },
        { id:"P7S5", title:"SAM.gov Award Notice", type:"GENERATE", packages:[{key:"POST_AWARD_SYN",label:"SAM.gov Post-Award Synopsis",docType:"POST_AWARD_SYN"}], type:"CHECK" },
        { id:"P7S6", title:"CPARS Performance Evaluation", type:"CHECK" },
        { id:"P7S7", title:"Contract Closeout", type:"GENERATE", docType:"CLOSEOUT" },
      ]
    });
  }

  return { lane, phases, intake };
}

async function callAI(prompt, systemPrompt) {
  let apiKey = localStorage.getItem("cpas_api_key");
  if (!apiKey) {
    apiKey = window.prompt("Enter your Anthropic API key (sk-ant-...). Saved in browser:");
    if (!apiKey) return "No API key provided.";
    localStorage.setItem("cpas_api_key", apiKey.trim());
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key": apiKey.trim(),
        "anthropic-version":"2023-06-01",
        "anthropic-dangerous-direct-browser-access":"true"
      },
      body: JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens:1500,
        system: systemPrompt || "You are an expert NASA Contracting Officer assistant. Generate professional, complete procurement documents compliant with FAR and NFS.",
        messages:[{role:"user",content:prompt}]
      })
    });
    const data = await res.json();
    if (data.error) {
      if (data.error.type === "authentication_error") {
        localStorage.removeItem("cpas_api_key");
        return "Invalid API key - cleared. Click Generate again to re-enter.";
      }
      return "API Error: "+data.error.message;
    }
    return data.content?.[0]?.text || "Generation failed.";
  } catch(e) { return "Error: "+(e.message); }
}



async function downloadAsWord(docType, text, intake) {
  try {
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel,
      AlignmentType, convertInchesToTwip, PageBreak, TabStopType, TabStopLeader
    } = await import("docx");

    const title   = intake?.reqTitle  || "NASA Requirement";
    const center  = intake?.center    || "NASA Ames Research Center (ARC)";
    const value   = parseFloat(intake?.value) || 0;
    const co      = intake?.coName     || intake?.co || "[Contracting Officer Name]";
    const coEmail  = intake?.coEmail    || "";
    const program = title;
    const date    = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

    // ── Helpers ───────────────────────────────────────────────────────────
    const blank = (space=120) => new Paragraph({ text:"", spacing:{after:space} });

    const centeredBold = (text, sz=24, spaceAfter=120) => new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: spaceAfter },
      children: [new TextRun({ text, bold:true, size:sz, font:"Times New Roman" })],
    });

    const centeredNormal = (text, sz=22, spaceAfter=80) => new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: spaceAfter },
      children: [new TextRun({ text, size:sz, font:"Times New Roman" })],
    });

    const bodyPara = (text, bold=false, sz=22, spaceAfter=120) => new Paragraph({
      spacing: { after: spaceAfter },
      children: [new TextRun({ text: text||"", bold, size:sz, font:"Times New Roman" })],
    });

    const sectionHead = (text) => new Paragraph({
      spacing: { before:240, after:80 },
      children: [new TextRun({ text, bold:true, size:22, font:"Times New Roman" })],
    });

    const sigUnderline = () => new Paragraph({
      spacing: { before:360, after:0 },
      children: [new TextRun({ text:"_".repeat(45), size:22, font:"Times New Roman" })],
    });

    const sigLabel = (name, role, extra) => [
      sigUnderline(),
      new Paragraph({ spacing:{after:0}, children:[new TextRun({text: name, size:22, font:"Times New Roman"})] }),
      new Paragraph({ spacing:{after: extra?0:160}, children:[new TextRun({text: role, size:22, font:"Times New Roman"})] }),
      ...(extra ? [new Paragraph({ spacing:{after:160}, children:[new TextRun({text: extra, size:20, italics:true, font:"Times New Roman"})] })] : []),
    ];

    const label = (text) => new Paragraph({
      spacing:{before:200, after:0},
      children:[new TextRun({text, bold:true, size:22, font:"Times New Roman"})],
    });

    // ── NASA Standard Header ──────────────────────────────────────────────
    const nasaHeader = () => [
      centeredBold("NATIONAL AERONAUTICS AND SPACE ADMINISTRATION", 24, 60),
      centeredBold(center, 22, 60),
      ...(docType === "JOFOC" ? [
        centeredBold("JUSTIFICATION FOR OTHER THAN FULL AND OPEN COMPETITION (JOFOC)", 22, 60),
      ] : [
        centeredBold(docType, 22, 60),
      ]),
      centeredNormal("For " + title, 22, 60),
      centeredNormal(date, 22, 200),
      blank(),
    ];

    // ── Parse AI text into Word paragraphs ────────────────────────────────
    // Detect numbered JOFOC sections: "1. FAR 6.104..." or "1. Identification..."
    const parseBody = (raw) => {
      const lines = (raw||"").split("\n");
      const result = [];
      for (const line of lines) {
        const t = line.trim();
        if (!t) { result.push(blank(80)); continue; }
        // Numbered section header: starts with digit(s) + period + space
        const secMatch = t.match(/^(\d{1,2})\.\s+(FAR .+|[A-Z].{5,})/);
        if (secMatch) {
          result.push(sectionHead(t));
          continue;
        }
        // ALL-CAPS label lines (e.g. "APPROVED:", "CONCURRENCES:")
        if (/^[A-Z\s:]{6,}$/.test(t)) {
          result.push(bodyPara(t, true));
          continue;
        }
        result.push(bodyPara(t));
      }
      return result;
    };

    // ── Signature pages by dollar value ───────────────────────────────────
    const pageBreak = () => new Paragraph({ children:[new PageBreak()] });

    const sigPageHeader = (threshold, suffix) => [
      pageBreak(),
      blank(80),
      centeredBold(program, 22, 60),
      centeredBold("JUSTIFICATION FOR OTHER THAN FULL AND OPEN COMPETITION", 22, 60),
      ...(suffix ? [centeredBold(suffix, 22, 60)] : []),
      centeredBold("SIGNATURE PAGE", 22, 60),
      bodyPara(threshold, false, 20, 160),
      blank(80),
    ];

    const techRepBlock = () => [
      bodyPara("Technical Representative: I certify that the facts presented in this justification are accurate and complete."),
      ...sigLabel("(Insert Name)", "Technical Representative"),
    ];

    const coBlock = () => [
      blank(80),
      bodyPara("Contracting Officer: I hereby certify that the above justification is complete and accurate to the best of my knowledge and belief."),
      ...sigLabel(co, "Contracting Officer"),
    ];

    const buildJofocSigPages = () => {
      const pages = [];

      // Page 1: ≤$900K
      pages.push(...sigPageHeader(
        "Use the following signature authority for proposed actions less than or equal to $900K:", null
      ));
      pages.push(...techRepBlock());
      pages.push(...coBlock());

      // Page 2: >$900K–$20M
      pages.push(...sigPageHeader(
        "Use the following signature authority for proposed actions over $900K, but not exceeding $20M:", null
      ));
      pages.push(...techRepBlock());
      pages.push(...coBlock());
      pages.push(blank(80));
      pages.push(label("APPROVED:"));
      pages.push(...sigLabel("(Insert Name)", "Competition Advocate, " + center,
        "Refer to the Procurement Ombudsman/Competition Advocate Points of Contact Listing"));

      // Page 3: >$20M–$150M
      pages.push(...sigPageHeader(
        "Use the following signature authority for proposed actions over $20M, but not exceeding $150M:", null
      ));
      pages.push(...techRepBlock());
      pages.push(...coBlock());
      pages.push(blank(80));
      pages.push(label("CONCURRENCES:"));
      pages.push(...sigLabel("(Insert Name)", "Competition Advocate, " + center,
        "Refer to the Procurement Ombudsman/Competition Advocate Points of Contact Listing"));
      pages.push(...sigLabel("(Insert Name)", "Procurement Officer [include for NOJMO, ESDMD, and SOMD actions]"));
      pages.push(...sigLabel("(Insert Name)", "Office of the General Counsel at Headquarters [for NOJMO, ESDMD, SOMD actions requiring HCA approval]"));
      pages.push(blank(80));
      pages.push(label("APPROVAL:"));
      pages.push(...sigLabel("(Insert Name)", "Head of Contracting Activity, " + center,
        "Refer to NFS 1802.101 definition of \"head of contracting activity\""));

      // Page 4: >$150M
      pages.push(...sigPageHeader(
        "Use the following signature authority for proposed actions exceeding $150M and all class justifications (regardless of dollar value):", null
      ));
      pages.push(...techRepBlock());
      pages.push(...coBlock());
      pages.push(blank(80));
      pages.push(label("CONCURRENCES:"));
      pages.push(...sigLabel("(Insert Name)", "Competition Advocate, " + center,
        "Refer to the Procurement Ombudsman/Competition Advocate Points of Contact Listing"));
      pages.push(...sigLabel("(Insert Name)", "Procurement Officer [include for NOJMO, ESDMD, and SOMD actions]"));
      pages.push(...sigLabel("(Insert Name)", "Head of Contracting Activity, " + center,
        "Refer to NFS 1802.101 definition of \"head of contracting activity\""));
      pages.push(pageBreak());
      pages.push(...sigLabel("(Insert Name)", "Office of the General Counsel at Headquarters"));
      pages.push(...sigLabel("(Insert Name)", "Agency Competition Advocate",
        "(The Deputy Assistant Administrator for Procurement is the Agency Competition Advocate)"));
      pages.push(blank(80));
      pages.push(label("APPROVAL:"));
      pages.push(...sigLabel("(Insert Name)", "Senior Procurement Executive"));

      return pages;
    };

    const buildGenericSigPage = () => [
      pageBreak(),
      blank(80),
      centeredBold(program, 22, 60),
      centeredBold(docType + " — SIGNATURE PAGE", 22, 120),
      blank(80),
      bodyPara("I certify that this document is complete and accurate to the best of my knowledge and belief."),
      ...techRepBlock(),
      ...coBlock(),
      blank(80),
      label("APPROVED:"),
      ...sigLabel("(Insert Name)", "Supervisor / Branch Chief"),
    ];

    // ── Assemble doc ──────────────────────────────────────────────────────
    const sigPages = docType === "JOFOC" ? buildJofocSigPages() : buildGenericSigPage();

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font:"Times New Roman", size:22 } },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left:   convertInchesToTwip(1.25),
              right:  convertInchesToTwip(1.25),
            },
          },
        },
        children: [
          ...nasaHeader(),
          ...parseBody(text),
          ...sigPages,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docType + "_" + title.replace(/[^a-zA-Z0-9 ]/g,"").replace(/ /g,"_").slice(0,30) + ".docx";
    a.click();
    URL.revokeObjectURL(url);
    return null;
  } catch(e) {
    return "Word export failed: " + e.message;
  }
}


async function generateDoc(docType, intake, roadmap) {

  const lane = getLaneLabel(roadmap.lane);
  const ctx = "\nACQUISITION PARAMETERS:\n- Title: "+(intake.reqTitle || "NASA Requirement")+"\n- Center: "+(intake.center || "NASA")+"\n- Value: $"+((intake.value||0).toLocaleString())+"\n- Type: "+(intake.reqType)+"\n- Commercial: "+(intake.isCommercial)+"\n- Lane: "+(lane)+"\n- Competition: "+(intake.competitionStrategy)+"\n- Contract Type: "+(intake.contractType)+"\n- NAICS: "+(intake.naics || "541330")+"\n- PSC: "+(intake.psc || "R499")+"\n- Period of Performance: "+(intake.pop || "Base year + 4 option years")+"\n- Recompete: "+(intake.isRecompete);

  const t = intake?.reqTitle||"this requirement";
  const v = "$"+((intake?.value||0).toLocaleString());
  const c = intake?.center||"NASA";
  const n = intake?.naics||"541330";
  const ct = intake?.contractType||"FFP";
  const cs = intake?.competitionStrategy||"Full and Open";
  const pop = intake?.pop||"Base + 4 options";
  const comm = intake?.isCommercial;


    const GENERATE_PROMPTS = {
    JOFOC:"Write a NASA JOFOC per FAR 6.303 for: \""+(t)+"\", "+(c)+", "+(v)+", NAICS "+(n)+". Include all 11 required FAR 6.303-2 elements labeled exactly: 1.IDENTIFICATION OF AGENCY AND CONTRACTING ACTIVITY 2.NATURE OF ACTION 3.DESCRIPTION OF SUPPLIES OR SERVICES 4.IDENTIFICATION OF STATUTORY AUTHORITY (cite FAR 6.302-X) 5.DEMONSTRATION THAT AUTHORITY APPLIES (specific technical facts, not conclusions) 6.EFFORTS TO OBTAIN COMPETITION 7.ANTICIPATED COST WILL BE FAIR AND REASONABLE 8.MARKET RESEARCH CONDUCTED 9.OTHER FACTS SUPPORTING USE 10.SOURCES THAT EXPRESSED INTEREST 11.ACTIONS TO REMOVE FUTURE BARRIERS. End with CO certification block and tiered approval signature block (<$900K=CO, $900K-$20M=Competition Advocate, $20M-$150M=HCA, >$150M=SPE). Mark SOURCE SELECTION SENSITIVE.",
    ACQ_PLAN:"Write a NASA Procurement Strategy Meeting (PSM) per FAR 7.1 and NFS 1807.1 for: \""+(t)+"\", "+(c)+", "+(v)+", "+(ct)+", "+(cs)+". NOTE: PSM is used in lieu of Written Acquisition Plan (HQ guidance 03/2026). Include these 16 sections labeled exactly: EXECUTIVE SUMMARY; 1.ASM OUTCOME; 2.DESCRIPTION OF EFFORT; 3.HISTORY/FOLLOW-ON; 4.ESTIMATED VALUE (with IGCE status); 5.CONTRACT TYPE (with FAR 16.103(d) rationale); 6.PERIOD OF PERFORMANCE; 7.PLACE OF PERFORMANCE; 8.COMPETITION TYPE; 9.MARKET RESEARCH SUMMARY (table by business size); 10.SMALL BUSINESS (Rule of Two analysis); 11.RISKS (10 risk areas: Technical/Schedule/Cost/Funding/Safety/Security/IT Security/Environmental/Export Control/OCI each with Impact/Likelihood); 12.SOURCE SELECTION (evaluation factors and weights); 13.REQUIRED D&Fs (list all); 14.ACQUISITION SCHEDULE; 15.AI CONSIDERATIONS (OMB M-25-22/PIC 25-03A); 16.PARTICIPANTS. Mark SOURCE SELECTION SENSITIVE.",
    NF1787:"Generate a completed NF 1787 Small Business Coordination Record for: \""+(t)+"\", "+(c)+", "+(v)+", NAICS "+(n)+".",
    NF1787A:"Generate a completed NF 1787A Market Research Report for: \""+(t)+"\", "+(c)+", "+(v)+", NAICS "+(n)+".",
    COORD_EMAIL_SBA:"Draft SBA PCR coordination email for: \""+(t)+"\", "+(c)+", "+(v)+", NAICS "+(n)+", strategy: "+(cs)+".",
    COORD_EMAIL_DCAA:"Draft DCAA coordination email for: \""+(t)+"\", "+(c)+", "+(v)+", "+(ct)+".",
    COORD_EMAIL_LEGAL:"Draft OGC review request for: \""+(t)+"\", "+(c)+", "+(v)+".",
    COORD_EMAIL_CA:"Draft Competition Advocate coordination memo for: \""+(t)+"\", "+(c)+", "+(v)+", strategy: "+(cs)+".",
    MARKET_RESEARCH:"Write a complete Market Research Report per FAR Part 10 for: \""+(t)+"\", "+(c)+", "+(v)+", NAICS "+(n)+".",
    SOURCES_SOUGHT:"Write a complete SAM.gov Sources Sought notice for: \""+(t)+"\", "+(c)+", NAICS "+(n)+".",
    SAM_SYNOPSIS:"Write a complete SAM.gov synopsis per FAR 5.207 for: \""+(t)+"\", "+(c)+", "+(v)+", NAICS "+(n)+", set-aside: "+(cs)+".",
    SOL_OVERVIEW:"Write Section B (CLINs 0001 through option 1004, pricing structure for "+(ct)+") and Section C (requirement overview, deliverables table, PoP) for: \""+(t)+"\", "+(c)+", "+(v)+".",
    CLAUSE_MATRIX:"Generate a clause matrix for: \""+(t)+"\", "+(c)+", "+(v)+", "+(ct)+", commercial:"+(comm)+". For each clause: number, title, Required/Conditional, FAR/NFS/RFO basis, fill-in needed, one-sentence rationale. Group by: FAR 52.212-x (commercial), FAR 52.2xx (standard), NFS 1852.2xx.",
    SECTION_L:"Write Section L - Instructions to Offerors for a FAR Part 15 RFP for: \""+(t)+"\", "+(c)+", "+(v)+".",
    SECTION_M:"Write Section M - Evaluation Factors for: \""+(t)+"\", "+(c)+", "+(v)+".",
    PNM:"Write a NASA Price Negotiation Memorandum (PNM) per FAR 15.406-3 for: \""+(t)+"\", "+(c)+", "+(v)+", "+(ct)+". Structure: HEADER (contract no., contractor, date, CO name); 1.INTRODUCTION (purpose, action type, certified cost data required Y/N, contractor systems status); 2.NEGOTIATION SUMMARY TABLE (columns: Element|Gov Objective|Contractor Proposal|Maximum Gov Position|Negotiated - rows for Labor/ODCs/Travel/G&A/Fee/TOTAL); 3.KEY NEGOTIATION HIGHLIGHTS (a.Labor hours/rates basis b.ODCs rationale c.G&A/OH rates source d.Fee/profit weighted guidelines); 4.PRICE REASONABLENESS DETERMINATION; 5.NEGOTIATION NARRATIVE. End with CO signature block. File references: NEAR FE 82 (PNM), FE 81 (PPM/NF634), FE 83 (Certified Cost Data if applicable).",
    RESPONSIBILITY:"Write an Affirmative Responsibility Determination per FAR 9.105-2 for: \""+(t)+"\", "+(c)+".",
    COR_LETTER:"Write a NASA COR Appointment Letter per NFS 1801.602-2 for: \""+(t)+"\", "+(c)+". Structure: NASA MEMORANDUM header; TO/FROM/SUBJECT block; 1.APPOINTMENT (effective dates); 2.SCOPE OF AUTHORITY (what COR may do: monitor performance, accept/reject deliverables, approve travel/overtime per contract, review invoices, maintain COR file, prepare CPARS); 3.LIMITATIONS (what COR may NOT do: direct contract changes, authorize out-of-scope work, make commitments, grant deviations); 4.REQUIRED QUALIFICATIONS (FAC-COR level I/II/III, NASA COR training per NPR 5101.10, COI certification); 5.REPORTING REQUIREMENTS; 6.ACCEPTANCE BLOCK (dual signature: CO and COR with FAC-COR certification level and expiration date).",
    KICKOFF:"Write a post-award kickoff agenda and contractor notification letter for: \""+(t)+"\", "+(c)+".",
    QASP:"Write a NASA QASP per NFS 1846.408 for: \""+(t)+"\", "+(c)+". Structure: HEADER (contract title, center, COR, CO); 1.PURPOSE; 2.ROLES (CO has overall responsibility, COR is primary surveillance authority, Contractor maintains quality control); 3.PERFORMANCE REQUIREMENTS SUMMARY TABLE (columns: Performance Objective|Standard|AQL|Surveillance Method|Frequency - include rows for deliverables, responsiveness, NF 533 reports, CPARS); 4.SURVEILLANCE METHODS (100% inspection for critical items, periodic surveillance, random sampling, customer feedback, document review); 5.DOCUMENTATION (COR file requirements, 5-day documentation rule); 6.AI SURVEILLANCE (OMB M-25-22/PIC 25-03A - identify covered AI use cases if applicable); 7.PERFORMANCE RATINGS (Exceptional/Very Good/Satisfactory/Marginal/Unsatisfactory per FAR 42.1503); 8.REMEDIES (verbal counseling, written notification, Cure Notice per FAR 49.607, Show Cause, termination).",
    AWARD_DOC:"Write award document cover and key SF-1449/SF-26 blocks for: \""+(t)+"\", "+(c)+", "+(v)+", "+(ct)+".",
    IGCE:"Write a complete Independent Government Cost Estimate (IGCE) for: \""+(t)+"\", "+(c)+", "+(v)+", "+(ct)+". Include: labor categories with hours and rates, materials/ODCs/travel, G&A/overhead, fee, option year escalation at 3-4%/yr, basis of estimate explanation, total by CLIN, and CO certification block. Mark: SOURCE SELECTION SENSITIVE.",
    ANOSCA:"Write an Administrator's Notification of Significant Contract Action (ANOSCA) for: \""+(t)+"\", "+(c)+", "+(v)+", "+(ct)+". Include: contract number, contractor name, description of work, period of performance, place of performance, type of competition, set-aside status, and public announcement language per NFS 1805.303.",
    POST_AWARD_SYN:"Write a SAM.gov post-award synopsis per FAR 5.301 for: \""+(t)+"\", "+(c)+", "+(v)+", NAICS "+(n)+". Include: contract number, award date, contractor name and address, description of work, period of performance, place of performance, competition used, set-aside type if applicable, and CO contact information.",
    FO_EXCEPTION:"Write a Fair Opportunity Exception Determination & Findings per FAR 16.505(b)(2) for task order: \""+(t)+"\", "+(c)+", "+(v)+". Identify which of the 4 exceptions applies and document the specific facts supporting it. Include CO certification and applicable approval authority.",
        CLOSEOUT:"Write a contract closeout checklist per FAR 4.804 for: \""+(t)+"\", "+(c)+", "+(v)+". Three columns: Required Action / Responsible Party / Date.",
  }

  return await callAI(GENERATE_PROMPTS[docType] || "Generate a professional "+(docType)+" document for this NASA acquisition.\n"+(ctx));
}

// Applies to: Ames (ARC), Glenn (GRC), Armstrong (AFRC), Langley (LaRC)
const RCPO_CENTERS = ["Ames (ARC)","Glenn (GRC)","Langley (LaRC)"];

const RCPO_CHAINS = {

  JOFOC: (value) => {
    const base = [
      { role:"Branch Lead", action:"R" },
      { role:"Policy Reviewer", action:"R" },
      { role:"Branch Chief", action:"R" },
      { role:"Office of General Counsel", action:"R" },
      { role:"Center Competition Advocate", action: value <= 750000 ? "A" : "C" },
    ];
    if (value > 750000) base.push({ role:"RCPO XO", action:"Awareness" });
    if (value > 750000) base.push({ role:"Procurement Officer", action:"C" });
    if (value > 750000) base.push({ role:"Head of Contracting Activity (HCA)", action:"A" });
    if (value > 15000000) base.push({ role:"Agency Competition Advocate", action:"C" });
    if (value > 15000000) base.push({ role:"Asst. Administrator for Procurement", action:"A" });
    if (value > 100000000) base.push({ role:"NASA Administrator", action:"A" });
    return base;
  },

  ACQ_PLAN: (value) => {
    const base = [
      { role:"CO/CS", action:"CE" },
      { role:"Requisitioner/Initiator", action:"CE" },
      { role:"Branch Lead", action:"R" },
      { role:"Small Business Specialist", action:"R" },
      { role:"SEB Advisor", action:"R" },
      { role:"Program Office Director", action:"R" },
      { role:"Source Selection Authority (SSA)", action:"R" },
    ];
    if (value <= 50000000) base.push({ role:"Branch Chief", action:"A" });
    if (value > 10000000) base.push({ role:"Office of General Counsel", action:"R" });
    if (value > 10000000) base.push({ role:"CoCO", action:"R" });
    if (value > 50000000) base.push({ role:"EPO", action:"R" });
    if (value > 50000000) base.push({ role:"Head of Contracting Activity", action:"A" });
    if (value > 50000000) base.push({ role:"AA for Procurement (HQ)", action:"A" });
    return base;
  },

  SOLICITATION: (value) => {
    const base = [
      { role:"CO/CS", action:"R" },
      { role:"Small Business Specialist", action:"R" },
      { role:"Branch Lead", action: value <= 5000000 ? "A" : "R" },
    ];
    if (value > 5000000) {
      base.push({ role:"Policy Reviewer", action:"R" });
      base.push({ role:"SEB Chair", action:"R" });
      base.push({ role:"Office of General Counsel", action:"R" });
      base.push({ role:"Branch Chief", action: value <= 25000000 ? "A" : "R" });
    }
    if (value > 25000000) {
      base.push({ role:"Office of General Counsel", action:"R" });
      base.push({ role:"CoCO", action:"A" });
      base.push({ role:"RCPO XO", action:"Awareness" });
      base.push({ role:"Procurement Officer", action:"R" });
      base.push({ role:"NASA Headquarters", action:"A" });
    }
    return base;
  },

  CONTRACT_AWARD: (value) => {
    if (value < 1000000) return [
      { role:"Branch Lead", action:"A" }
    ];
    const base = [
      { role:"CO/CS", action: value <= 5000000 ? "CE" : "R" },
      { role:"SEB Coordinator", action:"R" },
      { role:"Small Business Specialist", action:"R" },
      { role:"Branch Lead", action:"R" },
      { role:"Policy Reviewer", action:"R" },
      { role:"Office of General Counsel", action:"R" },
      { role:"Branch Chief", action: value <= 25000000 ? "A" : "R" },
    ];
    if (value > 25000000) {
      base.push({ role:"Office of General Counsel", action:"R" });
      base.push({ role:"CoCO", action:"A" });
    }
    return base;
  },

  PNM: (value) => [
    { role:"CO/CS", action:"A" },
    { role:"Branch Chief", action:"A" },
  ],

  ANOSCA: () => [
    { role:"Requisitioner", action:"CE" },
    { role:"CO/CS", action:"CE" },
    { role:"Branch Lead", action:"R" },
    { role:"Branch Chief", action:"R" },
    { role:"CoCO", action:"A" },
  ],

};
import React, { useState, useEffect } from "react";
import ClauseMatrixUI from "./ClauseMatrixUI.jsx";

// * SET THIS to your deployed API URL (see DEPLOY.md)
// Local dev:  "http://localhost:8080"
// EC2/Docker: "http://YOUR_SERVER_IP:8080"
// Lambda:     "https://xxxxx.execute-api.us-east-1.amazonaws.com/Prod"
const PDF_API_URL = "http://localhost:8080";

const NASA_CENTERS = ["Ames (ARC)","Armstrong (AFRC)","Glenn (GRC)","Goddard (GSFC)","Johnson (JSC)",
  "Kennedy (KSC)","Langley (LaRC)","Marshall (MSFC)","Stennis (SSC)","JPL","HQ"];
const CONTRACT_TYPES = ["FFP","FFP with Award Fee","T&M","Labor Hour","CPFF","CPAF","IDIQ","BPA","Order off Existing Vehicle"];
const NAICS_COMMON = [
  {code:"481211",title:"Nonscheduled Air Transportation",size:"1500 employees"},
  {code:"481212",title:"Nonscheduled Air Transportation (rotary wing)",size:"1500 employees"},
  {code:"336411",title:"Aircraft Manufacturing",size:"1250 employees"},
  {code:"336412",title:"Aircraft Engine/Engine Parts Mfg",size:"1250 employees"},
  {code:"336413",title:"Other Aircraft Parts/Auxiliary Equipment",size:"1250 employees"},
  {code:"336414",title:"Guided Missile/Space Vehicle Mfg",size:"1250 employees"},
  {code:"336415",title:"Guided Missile/Space Vehicle Propulsion",size:"1250 employees"},
  {code:"541330",title:"Engineering Services",size:"$25.5M"},
  {code:"541511",title:"Custom Computer Programming Services",size:"$34M"},
  {code:"541512",title:"Computer Systems Design Services",size:"$34M"},
  {code:"541513",title:"Computer Facilities Management Services",size:"$34M"},
  {code:"541519",title:"Other Computer Related Services",size:"$34M"},
  {code:"541611",title:"Administrative Management Consulting",size:"$24.5M"},
  {code:"541614",title:"Process/Logistics Consulting Services",size:"$24.5M"},
  {code:"541690",title:"Other Scientific/Technical Consulting",size:"$19M"},
  {code:"541710",title:"Physical/Engineering/Life Science R&D",size:"$25.5M"},
  {code:"541715",title:"R&D in Physical/Engineering Sciences",size:"$25.5M"},
  {code:"541720",title:"Social Science/Humanities R&D",size:"$25.5M"},
  {code:"541990",title:"Other Professional/Scientific Services",size:"$19M"},
  {code:"488190",title:"Other Support Activities for Air Transport",size:"$40M"},
  {code:"488510",title:"Freight Transportation Arrangement",size:"$20M"},
  {code:"517410",title:"Satellite Telecommunications",size:"$40M"},
  {code:"518210",title:"Data Processing/Hosting Services",size:"$40M"},
  {code:"519130",title:"Internet Publishing/Web Search Portals",size:"$40M"},
  {code:"561110",title:"Office Administrative Services",size:"$12.5M"},
  {code:"561210",title:"Facilities Support Services",size:"$47M"},
  {code:"561320",title:"Temporary Staffing Services",size:"$30M"},
  {code:"561499",title:"All Other Business Support Services",size:"$20M"},
  {code:"561612",title:"Security Guards/Patrol Services",size:"$25M"},
  {code:"562910",title:"Remediation Services",size:"$25M"},
  {code:"611430",title:"Professional/Management Development Training",size:"$12.5M"},
  {code:"711510",title:"Independent Artists/Writers/Performers",size:"$12.5M"},
  {code:"811219",title:"Other Electronic Equipment Repair",size:"$25M"},
  {code:"811310",title:"Commercial/Industrial Machinery Repair",size:"$10M"},
  {code:"236220",title:"Commercial/Institutional Building Construction",size:"$45M"},
  {code:"237310",title:"Highway/Street/Bridge Construction",size:"$45M"},
  {code:"238910",title:"Site Preparation Contractors",size:"$19M"},
  {code:"334111",title:"Electronic Computer Manufacturing",size:"1250 employees"},
  {code:"334118",title:"Computer Terminal/Other Hardware Mfg",size:"1250 employees"},
  {code:"334511",title:"Search/Detection/Navigation Instruments Mfg",size:"1250 employees"},
  {code:"334516",title:"Analytical Laboratory Instrument Mfg",size:"1250 employees"},
  {code:"423430",title:"Computer/Peripheral Equipment Wholesale",size:"$35M"},
  {code:"532411",title:"Commercial Air/Rail/Water Transport Equipment Rental",size:"$40M"},
  {code:"532490",title:"Other Commercial/Industrial Machinery Rental",size:"$40M"},
];
const PSC_COMMON = [
  {code:"R499",title:"Other Professional Services"},
  {code:"R408",title:"Program Management/Support Services"},
  {code:"R410",title:"Program Evaluation/Review/Development"},
  {code:"R413",title:"Logistics Support Services"},
  {code:"R425",title:"Engineering and Technical Services"},
  {code:"R426",title:"Testing/Analysis Support"},
  {code:"R431",title:"Technical Assistance"},
  {code:"R497",title:"Personal Services Contracts"},
  {code:"D302",title:"IT Systems Development Services"},
  {code:"D307",title:"IT Systems Analysis Services"},
  {code:"D308",title:"Programming Services"},
  {code:"D310",title:"IT Systems Operations"},
  {code:"D399",title:"Other IT Services"},
  {code:"AC12",title:"R&D - Space"},
  {code:"AC13",title:"R&D - Aeronautics"},
  {code:"AC21",title:"R&D - Physics"},
  {code:"AC22",title:"R&D - Chemistry"},
  {code:"AC23",title:"R&D - Mathematics/Computer Science"},
  {code:"AC61",title:"R&D - Systems Engineering"},
  {code:"AC99",title:"R&D - Other"},
  {code:"J065",title:"Maintenance/Repair of Aircraft"},
  {code:"J066",title:"Maintenance/Repair of Space Vehicles"},
  {code:"J015",title:"Maintenance of Aircraft Ground Support Equipment"},
  {code:"V231",title:"Air Charter Services"},
  {code:"V119",title:"Transportation - Air (Common Carrier)"},
  {code:"W061",title:"Lease/Rental of Aircraft"},
  {code:"W066",title:"Lease/Rental of Space Vehicles"},
  {code:"N065",title:"Installation of Aircraft Components"},
  {code:"C219",title:"Architect/Engineering - General"},
  {code:"C220",title:"Architect/Engineering - Construction"},
  {code:"Y1AA",title:"Construction - Office Buildings"},
  {code:"Z1AA",title:"Maintenance/Repair - Office Buildings"},
  {code:"Z2AA",title:"Alteration/Repair - Other Buildings"},
  {code:"S201",title:"Custodial/Janitorial Services"},
  {code:"S206",title:"Guard Services"},
  {code:"S216",title:"Facilities Operations Support"},
  {code:"H999",title:"Other Quality Control/Testing"},
  {code:"T001",title:"Photographic/Mapping/Printing"},
  {code:"U099",title:"Education/Training"},
];

function getAcqLane(value, isCommercial, competitionStrategy) {
  if (competitionStrategy === "EXISTING_VEHICLE") return "TASK_ORDER";
  const comm = isCommercial === true || isCommercial === "YES" || isCommercial === "TBD";
  if (value <= 10000) return "MICROPURCHASE";
  if (value <= 250000) return "SIMPLIFIED";
  if (comm && value <= 7500000) return "FAR_13_5";
  if (comm) return "FAR_12";
  if (value <= 2000000) return "FAR_13_NONCOMMERCIAL";
  return "FAR_15";
}
function getLaneLabel(lane) {
  return {
    MICROPURCHASE:"Micro-Purchase (FAR Part 13)",
    SIMPLIFIED:"Simplified Acquisition (FAR Part 13)",
    FAR_13_5:"Simplified Acquisition <=$7.5M Commercial (FAR 13.5)",
    FAR_12:"Commercial Item Acquisition (FAR Part 12)",
    FAR_13_NONCOMMERCIAL:"Simplified Non-Commercial (FAR Part 13)",
    FAR_15:"Negotiated Procurement (FAR Part 15)",
    TASK_ORDER:"Task/Delivery Order (FAR 16.505)",
  }[lane] || "TBD";
}


function ReviewChain({ docKey, value, center }) {
  const isRCPO = RCPO_CENTERS.includes(center);
  if (!isRCPO || !RCPO_CHAINS[docKey]) return null;
  const chain = RCPO_CHAINS[docKey](value);
  const actionColors = { A:"#3aaa66", R:"#4a9eff", C:"#ffaa30", CE:"#aa4aff", Awareness:"#7a9ab8" };
  const actionLabels = { A:"APPROVAL", R:"REVIEW", C:"CONCURRENCE", CE:"CERTIFICATION", Awareness:"AWARENESS" };
  return (
    <div style={{ marginBottom:"20px" }}>
      <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"2px",marginBottom:"10px"}}>
        RCPO-WI-5001 REVIEW CHAIN - SEQUENTIAL ORDER v
      </div>
      <div style={{ fontSize:"10px", color:"#4a7aaa", marginBottom:"12px", fontStyle:"italic" }}>
        Applies to: Ames, Glenn, Langley, Armstrong. Route in NEAR via "Start New File Element Review."
      </div>
      {chain.map((item, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"10px",marginBottom:"6px"}}>
          <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"#0a2040", border:"1px solid "+actionColors[item.action]||"#4a7aaa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:actionColors[item.action]||"#4a7aaa", flexShrink:0, marginTop:"2px" }}>
            {i+1}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:"12px", color:"#c8d8f0", fontWeight:"600" }}>{item.role}</span>
              <span style={{ background: "#0a2040", border:"1px solid "+actionColors[item.action]||"#4a7aaa", color:actionColors[item.action]||"#4a7aaa", padding:"1px 7px", fontSize:"9px", letterSpacing:"1px", borderRadius:"2px" }}>
                {actionLabels[item.action]||item.action}
              </span>
            </div>
            {item.note && <div style={{ fontSize:"10px", color:"#4a7aaa", marginTop:"2px" }}>{item.note}</div>}
          </div>
        </div>
      ))}
      <div style={{ fontSize:"10px", color:"#4a7aaa", marginTop:"10px", padding:"8px", background:"#040d1a", border:"1px solid #1a3a6e", borderRadius:"3px" }}>
        Standard review: 3 business days. Urgent (NF1930 + Branch Chief approval): 24-hour turnaround. CoCO may waive reviews for urgent actions.
      </div>
    </div>
  );
}

async function downloadFilledPDF(endpoint, formData, filename) {
  try {
    const res = await fetch((PDF_API_URL)+(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error("API returned "+(res.status));
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Unknown API error");

    const bytes = Uint8Array.from(atob(json.pdf_base64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = json.filename || filename;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function DownloadPDFButton({ endpoint, buildPayload, filename, label }) {
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleClick() {
    setStatus("loading"); setErrMsg("");
    const payload = buildPayload();
    const result = await downloadFilledPDF(endpoint, payload, filename);
    if (result.ok) {
      setStatus("idle");
    } else {
      setStatus("error");
      setErrMsg(result.error);
    }
  }

  const isLocal = PDF_API_URL.includes("localhost") || PDF_API_URL.includes("127.0.0.1");

  return (
    <div style={{ flex:1 }}>
      <button
        style={{ background: status === "error" ? "#3a0a0a" : "#0d3a8a", border:"1px solid "+status === "error" ? "#cc4a88" : "#4a9eff", color: status === "error" ? "#cc4a88" : "#7ec8ff", padding:"10px", cursor:"pointer", borderRadius:"3px", fontSize:"11px", letterSpacing:"1px", width:"100%", opacity: status === "loading" ? 0.6 : 1 }}
        onClick={handleClick}
        disabled={status === "loading"}
      >
        {status === "loading" ? "... GENERATING PDF..." : status === "error" ? "X API ERROR - RETRY" : label}
      </button>
      {status === "error" && (
        <div style={{ fontSize:"10px", color:"#cc4a88", marginTop:"4px", lineHeight:1.5 }}>
          {errMsg}
          {isLocal && <span> - Start API: python api/app.py</span>}
        </div>
      )}
      {isLocal && status === "idle" && (
        <div style={{ fontSize:"9px", color:"#2a5a8a", marginTop:"3px" }}>
          Requires API running at {PDF_API_URL}
        </div>
      )}

    </div>
  );
}

function NF1787Form({ intake, onSave, savedData }) {
  const [saved, setSaved] = React.useState(false);
  const fields = [
    { label:"Acquisition Title", val: intake?.reqTitle || "" },
    { label:"Center", val: intake?.center || "" },
    { label:"Estimated Value", val: intake?.value ? "$" + intake.value.toLocaleString() : "" },
    { label:"NAICS Code", val: intake?.naics || "" },
    { label:"Contract Type", val: intake?.contractType || "" },
    { label:"Competition Strategy", val: intake?.competitionStrategy || "" },
  ];
  return (
    <div style={{ padding:"16px" }}>
      <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"2px",marginBottom:"12px"}}>NF 1787 - SMALL BUSINESS COORDINATION RECORD</div>
      <div style={{ background:"#0a1a3a", border:"1px solid #1a5aaa", borderRadius:"3px", padding:"12px 14px",marginBottom:"12px"}}>
        <div style={{ fontSize:"10px", color:"#4a9eff",marginBottom:"8px"}}>Acquisition Context</div>
        {fields.map((f,i) => f.val ? (
          <div key={i} style={{ display:"flex", gap:"12px", padding:"4px 0", borderBottom:"1px solid #061428" }}>
            <div style={{ fontSize:"10px", color:"#4a7aaa", minWidth:"140px" }}>{f.label}</div>
            <div style={{ fontSize:"10px", color:"#c8d8f0" }}>{f.val}</div>
          </div>
        ) : null)}
      </div>
      <div style={{ fontSize:"11px", color:"#c8d8f0", lineHeight:1.7,marginBottom:"14px"}}>
        Complete the NF 1787 using the fillable PDF form. The form captures small business coordination findings, SBA PCR contact, and set-aside determination.
      </div>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
        <a href="https://www.nasa.gov/sites/default/files/atoms/files/nf1787.pdf" target="_blank" rel="noopener noreferrer"
          style={{ fontSize:"10px", padding:"8px 14px", borderRadius:"3px", background:"#0a1a3a", border:"1px solid #1a5aaa", color:"#4a9eff", textDecoration:"none", letterSpacing:"1px" }}>
          DOWNLOAD NF 1787 PDF
        </a>
        <button onClick={() => { onSave && onSave({completed:true}); setSaved(true); }}
          style={{ fontSize:"10px", padding:"8px 14px", cursor:"pointer", borderRadius:"3px", background:"#041a0e", border:"1px solid #3aaa66", color:"#3aaa66", letterSpacing:"1px" }}>
          {saved ? "v SAVED" : "MARK COMPLETE"}
        </button>
      </div>
    </div>
  );
}

function NF1787AForm({ intake, onSave, savedData }) {
  const [saved, setSaved] = React.useState(false);
  const fields = [
    { label:"Acquisition Title", val: intake?.reqTitle || "" },
    { label:"Center", val: intake?.center || "" },
    { label:"Estimated Value", val: intake?.value ? "$" + intake.value.toLocaleString() : "" },
    { label:"NAICS Code", val: intake?.naics || "" },
    { label:"Contract Type", val: intake?.contractType || "" },
  ];
  return (
    <div style={{ padding:"16px" }}>
      <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"2px",marginBottom:"12px"}}>NF 1787A - MARKET RESEARCH REPORT</div>
      <div style={{ background:"#0a1a3a", border:"1px solid #1a5aaa", borderRadius:"3px", padding:"12px 14px",marginBottom:"12px"}}>
        <div style={{ fontSize:"10px", color:"#4a9eff",marginBottom:"8px"}}>Acquisition Context</div>
        {fields.map((f,i) => f.val ? (
          <div key={i} style={{ display:"flex", gap:"12px", padding:"4px 0", borderBottom:"1px solid #061428" }}>
            <div style={{ fontSize:"10px", color:"#4a7aaa", minWidth:"140px" }}>{f.label}</div>
            <div style={{ fontSize:"10px", color:"#c8d8f0" }}>{f.val}</div>
          </div>
        ) : null)}
      </div>
      <div style={{ fontSize:"11px", color:"#c8d8f0", lineHeight:1.7,marginBottom:"14px"}}>
        Complete the NF 1787A to document your market research sources, findings, and commercial item determination. Required per NFS 1810.002 for acquisitions above the SAT.
      </div>
      <div style={{ background:"#08182e", border:"1px solid #1a3a6e", borderRadius:"3px", padding:"10px 14px", marginBottom:"14px", fontSize:"10px", color:"#c8d8f0" }}>
        <div style={{ color:"#4a9eff", marginBottom:"6px", fontSize:"9px", letterSpacing:"1px" }}>MARKET RESEARCH SOURCES TO DOCUMENT</div>
        {["SAM.gov (required)","GSA Advantage / eBuy","USASpending.gov prior contracts","Industry sources / RFI responses","NASA SEWP / other GWACs","GSA Federal Supply Schedule","Internet / commercial sources"].map((s,i) => (
          <div key={i} style={{ padding:"3px 0", borderBottom:"1px solid #061428" }}>v {s}</div>
        ))}
      </div>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
        <a href="https://www.nasa.gov/sites/default/files/atoms/files/nf1787a.pdf" target="_blank" rel="noopener noreferrer"
          style={{ fontSize:"10px", padding:"8px 14px", borderRadius:"3px", background:"#0a1a3a", border:"1px solid #1a5aaa", color:"#4a9eff", textDecoration:"none", letterSpacing:"1px" }}>
          DOWNLOAD NF 1787A PDF
        </a>
        <button onClick={() => { onSave && onSave({completed:true}); setSaved(true); }}
          style={{ fontSize:"10px", padding:"8px 14px", cursor:"pointer", borderRadius:"3px", background:"#041a0e", border:"1px solid #3aaa66", color:"#3aaa66", letterSpacing:"1px" }}>
          {saved ? "v SAVED" : "MARK COMPLETE"}
        </button>
      </div>
    </div>
  );
}


// Per-step quick-check items shown in the CHECK workspace
const STEP_CHECKS = {
  P1S1: ["PR number recorded?", "PR signed by authorized official?", "Correct fund cite on PR?"],
  P1S2: ["NF 1707 Section 2 complete?", "Special approvals obtained?", "NF 1707 signed by CO?"],
  P1S3: ["SOW/PWS technically adequate?", "Performance standards defined?", "Deliverables and schedule included?"],
  P1S5: ["Funds certified by budget official?", "Correct object class code?", "No Anti-Deficiency Act risk?"],
  P1S8: ["COR has relevant technical background?", "COR training current (CLC 106)?", "COR nomination letter signed?"],
  P2S1: ["Lane selection matches value and commercial status?", "Deviation documented if overriding?"],
  P2S4: ["Competition strategy consistent with market research?", "Set-aside analysis documented?", "Rule of Two satisfied?"],
  P2S5: ["All 11 FAR 6.303-2 elements present?", "JOFOC approved at correct level?", "Redaction plan for SAM posting?"],
  P2S6: ["PSM participants documented?", "PSM minutes signed?", "PSM covers all required FAR 7.105 topics?"],
  P7S4: ["FPDS within 3 business days of award?", "Correct contract action code?", "DUNS/UEI and NAICS correct in FPDS?"],
  // Task Order lane
  P2S1: ["Vehicle is active and within ordering period?", "NASA has authority to use this vehicle?", "Vehicle scope covers this requirement?"],
  P2S2: ["Ordering period end date confirmed in FPDS or vehicle document?", "Option periods exercised if needed?"],
  P2S4: ["Fair opportunity exceptions require specific written justification?", "Rule of Two checked for SB set-aside?", "Exceptions at >$5.5M require higher approval?"],
  P3S4: ["RFQ issued to all awardees (or exception documented)?", "Minimum response time provided?", "RFQ includes evaluation criteria and basis for award?"],
  P3S5: ["Written evaluation of all quotes on file?", "Best value determination documented?", "Price/cost reasonableness determination complete?"],
  P4S1: ["COR appointment letter signed before work begins?", "COR responsibilities documented?", "COR training current?"],
};

const CHECKLIST = {
  P1:[
    {id:11,  q:"Approved Purchase Requisition in CF/SAP?",                           app:"All actions obligating funding"},
    {id:12,  q:"Requisition includes complete SOW/PWS or SOO?",                      app:"All actions"},
    {id:14,  q:"Approved SOW/PWS attached and technically adequate?",                app:"All actions"},
    {id:15,  q:"QASP or written determination that no QASP is required?",            app:"All new contracts for services"},
    {id:19,  q:"Complete, signed, dated IGCE prepared by requiring office?",         app:"All new actions above SAT"},
    {id:20,  q:"IGCE methodology documented (rates, hours, basis)?",                 app:"All new actions above SAT"},
    {id:21,  q:"Funds availability certification signed by authorized official?",    app:"All actions obligating funding"},
    {id:22,  q:"Inherently governmental function determination documented?",         app:"All new contracts for services"},
    {id:23,  q:"COR nomination package submitted (NF 1801 or equivalent)?",         app:"All service contracts"},
    {id:24,  q:"NF 1707 Special Approvals and Affirmations completed?",              app:"All actions per NFS 1804.7301"},
    {id:25,  q:"IPv6 and ELMT coordination completed (IT only)?",                    app:"IT acquisitions only"},
    {id:26,  q:"D&F for use of other than commercial items (if applicable)?",        app:"Non-commercial above SAT"},
  ],
  P2:[
    {id:30,  q:"Acquisition plan approved at required level?",                       app:"All new contracts meeting thresholds"},
    {id:31,  q:"PSM conducted and minutes on file?",                                 app:"Actions >= $10M"},
    {id:32,  q:"Competition strategy decision documented with FAR basis?",           app:"All actions above SAT"},
    {id:33,  q:"Approved JOFOC/J&A with all required FAR 6.303-2 elements?",        app:"Above SAT – other than full and open competition"},
    {id:34,  q:"JOFOC approved at correct dollar-threshold authority level?",        app:"Actions using JOFOC"},
    {id:35,  q:"Redacted JOFOC posted to SAM.gov within required timeframe?",        app:"JOFOC actions above SAT"},
    {id:36,  q:"Completed and signed Limited Source Justification?",                 app:"Actions using FAR Part 13 limited source"},
    {id:37,  q:"Master Buy Plan submitted and approved (if >= $50M)?",               app:"Actions >= $50M"},
    {id:38,  q:"Appropriate authority approvals per NASA MDA 5013.01?",              app:"All actions per authority matrix"},
    {id:39,  q:"Small business program review completed (NF 1787)?",                 app:"All new contracts above SAT"},
    {id:40,  q:"Rule of Two analysis documented for small business consideration?",  app:"All actions above micro-purchase"},
  ],
  P3:[
    {id:50,  q:"Signed and fully coordinated NF 1787 Small Business Coordination?",  app:"All new contracts meeting thresholds"},
    {id:51,  q:"NF 1787A Market Research Report on file?",                            app:"All new awards per FAR 10.001"},
    {id:52,  q:"Market research within 18 months of solicitation?",                  app:"All new awards per FAR 10.001"},
    {id:53,  q:"Sources Sought notice posted and responses documented?",              app:"Competitive actions above SAT"},
    {id:54,  q:"SAM.gov pre-solicitation synopsis posted (FAR 5.203)?",              app:"Actions meeting FAR 5.101 threshold"},
    {id:55,  q:"Synopsis meets minimum 15-day public notice requirement?",           app:"FAR 5.203 actions"},
    {id:56,  q:"Industry Day or Small Business Conference documented?",               app:"New competitive contracts with industry exchanges"},
    {id:57,  q:"Policy Compliance Review (PCR) completed per PS-OWI-05?",           app:"All actions per PS-OWI-05"},
    {id:58,  q:"SBA PCR coordination complete (if SBSA/8(a))?",                     app:"Set-aside and 8(a) actions"},
    {id:59,  q:"DCAA coordination complete for cost-type contracts?",                app:"Cost-type contracts above $750K"},
    {id:60,  q:"OGC legal review on file (if > $5M or JOFOC)?",                     app:"Actions > $5M or using JOFOC"},
  ],
  P4:[
    {id:70,  q:"Solicitation conforms to applicable FAR/NFS requirements?",          app:"All competitive solicitations"},
    {id:71,  q:"Correct contract type clauses included (FAR 52.2xx)?",               app:"All solicitations"},
    {id:72,  q:"Section L instructions clear and tied to Section M factors?",        app:"FAR Part 15 solicitations"},
    {id:73,  q:"Section M evaluation factors and weights documented?",               app:"FAR Part 15 solicitations"},
    {id:74,  q:"CLIN structure complete with unit prices and options?",               app:"All solicitations"},
    {id:75,  q:"Wage Determination incorporated (if SCA applies)?",                  app:"Service contracts > $2,500 covered by SCA"},
    {id:76,  q:"Solicitation posted to SAM.gov with correct NAICS/PSC?",             app:"All competitive solicitations"},
    {id:77,  q:"Amendment issued for any changes after release?",                    app:"When changes made post-release"},
    {id:78,  q:"Contractor reps and certs required and current in SAM?",             app:"All solicitations"},
  ],
  P5:[
    {id:2,   q:"All documents filed under correct NEAR File Element Tab?",           app:"All actions"},
    {id:3,   q:"Duplicate and unnecessary drafts removed from file?",                app:"All actions"},
    {id:13,  q:"Final version of SOW/PWS in file?",                                  app:"All actions"},
    {id:54,  q:"Responsibility / non-responsibility determination documented?",      app:"All new awards above SAT"},
    {id:66,  q:"Personal services determination documented?",                        app:"All new contracts for services"},
    {id:67,  q:"Waivers or deviations from standard clauses documented?",            app:"When waiver or deviation approved"},
    {id:68,  q:"Section 508 compliance determination on file?",                      app:"IT acquisitions"},
    {id:69,  q:"SAM.gov debarment check performed and documented?",                  app:"All new awards"},
  ],
  P6:[
    {id:99,  q:"All proposals, revisions, and attachments received and logged?",     app:"All actions requiring proposals"},
    {id:100, q:"CBPI/SSI documents properly marked and controlled?",                 app:"New competitive contracts"},
    {id:101, q:"Proposals marked with date and time of receipt?",                    app:"New competitive contracts"},
    {id:104, q:"SAM exclusion check dated after proposal receipt?",                  app:"All actions requiring proposals"},
    {id:105, q:"Contractor reps and certs retrieved from SAM.gov?",                  app:"All actions unless FAR 4.1102 exception"},
    {id:112, q:"Complete, signed, dated technical evaluation in file?",              app:"All actions requiring technical input"},
    {id:113, q:"Price analysis or cost analysis documented?",                        app:"All actions above SAT"},
    {id:114, q:"PNM documents price negotiation and fair/reasonable basis?",         app:"All negotiated actions above SAT"},
    {id:115, q:"Best value tradeoff decision documented (if other than LPTA)?",      app:"FAR Part 15 best value competitions"},
    {id:116, q:"Source selection decision document signed by SSA?",                  app:"FAR Part 15 competitive actions"},
    {id:117, q:"Pre-negotiation position memorandum (if cost-type > $750K)?",       app:"Cost-type contracts requiring audit"},
  ],
  P7:[
    {id:7,   q:"All documents uploaded to NEAR in correct file elements?",           app:"All actions"},
    {id:34,  q:"Redacted JOFOC approved and posted to SAM.gov?",                     app:"JOFOC actions above SAT"},
    {id:168, q:"Signed copy of award/agreement in file?",                            app:"All actions"},
    {id:171, q:"Effective Date and PoP start on or after Signature Date?",           app:"All actions except approved Advance Agreement"},
    {id:172, q:"FPDS-NG Contract Action Report submitted within 3 days?",            app:"All actions"},
    {id:173, q:"ANOSCA submitted to NASA HQ (if required)?",                         app:"Significant contract actions per NFS 1804.71"},
    {id:179, q:"CAR approved within 3 business days and uploaded to NEAR?",          app:"All actions"},
    {id:180, q:"Award Notification Letters issued (competitive actions)?",            app:"New competitive contracts"},
    {id:185, q:"SAM.gov award synopsis posted within required timeframe?",           app:"All new contracts above FAR Part 5 threshold"},
    {id:186, q:"COR Appointment Letter signed and filed?",                           app:"All contracts with a COR"},
    {id:187, q:"Kickoff meeting held and agenda/minutes on file?",                   app:"All new contracts"},
    {id:188, q:"QASP finalized and provided to COR and contractor?",                 app:"All new service contracts"},
    {id:196, q:"COR acceptance/rejection reports on file?",                          app:"Contracts with a COR"},
    {id:197, q:"Contractor performance entered in CPARS?",                           app:"Contracts meeting CPARS thresholds"},
  ],
};

// Source: AWPT-SDR, AWPT-EA, AWPT-CAC, AWPT-Other | Extracted 2026
const TEMPLATES = {
  "P1S3": [  // SOW/PWS step
    {uid:58, name:"DRFP Cover Letter", cat:"AWPT-SDR"},
  ],
  "P1S4": [  // IGCE step - no specific template but Total Compensation Plan tools apply for services
    {uid:73, name:"Total Compensation Plan Analysis Tool 5 Years", cat:"AWPT-EA"},
    {uid:73, name:"Total Compensation Plan Analysis Tool 10 Years", cat:"AWPT-EA"},
    {uid:73, name:"Instructions for the Evaluation of Total Compensation Plans", cat:"AWPT-EA"},
  ],
  "P1S6": [  // Inherently Governmental
    {uid:20, name:"Procurement Strategy Meeting Template", cat:"AWPT-SDR"},
    {uid:20, name:"Written Acquisition Plan Template", cat:"AWPT-SDR"},
  ],
  "P2S5": [  // JOFOC/J&A step
    {uid:22, name:"JOFOC Template", cat:"AWPT-SDR"},
    {uid:22, name:"JOFOC 8(a) >$30M", cat:"AWPT-SDR"},
    {uid:23, name:"Limited Sources Justification (LSJ) GSA FSS", cat:"AWPT-SDR"},
    {uid:49, name:"UCA-Letter Contract Justification", cat:"AWPT-SDR"},
  ],
  "P2S6": [  // Acquisition Plan step
    {uid:20, name:"Written Acquisition Plan Template", cat:"AWPT-SDR"},
    {uid:20, name:"Procurement Strategy Meeting Template", cat:"AWPT-SDR"},
    {uid:20, name:"Addendum to Approved PSM/Acquisition Plans", cat:"AWPT-SDR"},
    {uid:2,  name:"Requirements Development Team Letters", cat:"AWPT-SDR"},
  ],
  "P3S1": [  // Small Business Coordination - NF 1787
    {uid:56, name:"QASP Template - Performance-Based Services", cat:"AWPT-SDR"},
  ],
  "P3S3": [  // OGC Review
    {uid:51, name:"OCI Limitation of Future Contracting Memo", cat:"AWPT-SDR"},
    {uid:51, name:"OCI Determination Memo and Checklist", cat:"AWPT-SDR"},
  ],
  "P3S4": [  // Competition Advocate
    {uid:34, name:"D&F for Consolidation of Requirements", cat:"AWPT-SDR"},
    {uid:34, name:"D&F for Bundled Requirements", cat:"AWPT-SDR"},
  ],
  "P4S1": [  // Commercial Item Determination
    {uid:9,  name:"Non-Commercial Item Solicitation Request", cat:"AWPT-SDR"},
  ],
  "P4S3": [  // Market Research Report
    {uid:20, name:"ASM Not Conducted Memo", cat:"AWPT-SDR"},
  ],
  "P5S1": [  // Draft Solicitation
    {uid:58, name:"DRFP Cover Letter", cat:"AWPT-SDR"},
    {uid:65, name:"RFP Template - Non-Competitive", cat:"AWPT-SDR"},
    {uid:65, name:"RFP Template - Existing Contracts", cat:"AWPT-SDR"},
    {uid:59, name:"Blackout Notice", cat:"AWPT-SDR"},
    {uid:65, name:"Electronic Document Posting Checklist", cat:"AWPT-SDR"},
  ],
  "P5S2": [  // Clause Matrix
    {uid:27, name:"FAR and NFS Deviation Request", cat:"AWPT-SDR"},
    {uid:27, name:"FAR Period of Performance-Ordering Period Deviation", cat:"AWPT-SDR"},
  ],
  "P5S3": [  // SAM.gov Synopsis
    {uid:10, name:"SAM.gov/GPE Templates", cat:"AWPT-SDR"},
  ],
  "P5S4": [  // Section L - Instructions
    {uid:44, name:"Source Selection Authority Appointment", cat:"AWPT-SDR"},
    {uid:45, name:"SEB Membership Appointment Memo", cat:"AWPT-SDR"},
    {uid:46, name:"Source Eval Team Membership Memo", cat:"AWPT-SDR"},
    {uid:56, name:"QASP Template - Performance-Based Services", cat:"AWPT-SDR"},
    {uid:81, name:"PPM Template", cat:"AWPT-EA"},
  ],
  "P6S3": [  // PNM/Price Analysis
    {uid:82, name:"PNM Template", cat:"AWPT-EA"},
    {uid:16, name:"Precontract Costs Approval Memo", cat:"AWPT-EA"},
  ],
  "P6S4": [  // Responsibility Determination
    {uid:68, name:"D&F Responsibility/Nonresponsibility", cat:"AWPT-EA"},
    {uid:34, name:"D&F Authority to Exclude a Source", cat:"AWPT-SDR"},
    {uid:48, name:"OCI Limitation of Future Contracting Memo", cat:"AWPT-SDR"},
  ],
  "P6S5": [  // Award Document
    {uid:55, name:"Final RFP Cover Letter", cat:"AWPT-SDR"},
    {uid:102, name:"Post-Award Notification - Successful Offeror", cat:"AWPT-EA"},
    {uid:102, name:"Post-Award Notification - Unsuccessful Offeror", cat:"AWPT-EA"},
    {uid:101, name:"Set-Aside Pre-Award Apparent Success Notification", cat:"AWPT-EA"},
    {uid:106, name:"NASA Notification of Procurement Action", cat:"AWPT-EA"},
  ],
  "P7S1": [  // COR Appointment
    {uid:114, name:"COR Appointment Recommendation", cat:"AWPT-EA"},
    {uid:114, name:"COR/Alt COR Cancellation Memo", cat:"AWPT-EA"},
    {uid:132, name:"FDO Appointment", cat:"AWPT-EA"},
    {uid:132, name:"PEB Appointment", cat:"AWPT-EA"},
  ],
  "P7S2": [  // Post-Award Kickoff
    {uid:115, name:"Postaward Conference Report", cat:"AWPT-CAC"},
  ],
  "P7S3": [  // QASP Implementation
    {uid:56, name:"QASP Template - Performance-Based Services", cat:"AWPT-SDR"},
    {uid:126, name:"CPARS Input Template", cat:"AWPT-CAC"},
    {uid:133, name:"NASA Voucher Review Checklist", cat:"AWPT-CAC"},
  ],
  "P7S6": [  // CPARS
    {uid:126, name:"CPARS Input Template", cat:"AWPT-CAC"},
  ],
  "P7S7": [  // Contract Closeout
    {uid:134, name:"Closeout Transfer Checklist", cat:"AWPT-CAC"},
    {uid:127, name:"BPA Annual Review", cat:"AWPT-CAC"},
  ],
};

const NEAR_MAP = {
  JOFOC:           {fe:22, cat:"Acquisition Planning",    folder:"JOFOC"},
  ACQ_PLAN:        {fe:20, cat:"Acquisition Planning",    folder:"Acquisition Plan/PSM"},
  NF1787:          {fe:7,  cat:"Acquisition Planning",    folder:"Set-Aside/Small Business Coordination"},
  NF1787A:         {fe:9,  cat:"Acquisition Planning",    folder:"Market Research Analysis"},
  COORD_EMAIL_SBA: {fe:7,  cat:"Acquisition Planning",    folder:"Set-Aside/Small Business Coordination"},
  COORD_EMAIL_DCAA:{fe:71, cat:"Evaluation",              folder:"Audits (DCAA, DCMA, EPO)"},
  COORD_EMAIL_LEGAL:{fe:63,cat:"Solicitation Development",folder:"General Correspondence (up to RFP Release)"},
  COORD_EMAIL_CA:  {fe:20, cat:"Acquisition Planning",    folder:"Acquisition Plan/PSM"},
  MARKET_RESEARCH: {fe:9,  cat:"Acquisition Planning",    folder:"Market Research Analysis"},
  SOURCES_SOUGHT:  {fe:10, cat:"Acquisition Planning",    folder:"RFI/Sources Sought Synopsis/Responses"},
  SAM_SYNOPSIS:    {fe:40, cat:"Acquisition Planning",    folder:"Pre-Solicitation Synopsis/Notice"},
  SOL_OVERVIEW:    {fe:65, cat:"Solicitation Development",folder:"Final RFP/Solicitation & Amendments"},
  CLAUSE_MATRIX:   {fe:65, cat:"Solicitation Development",folder:"Final RFP/Solicitation & Amendments"},
  SECTION_L:       {fe:65, cat:"Solicitation Development",folder:"Final RFP/Solicitation & Amendments"},
  SECTION_M:       {fe:65, cat:"Solicitation Development",folder:"Final RFP/Solicitation & Amendments"},
  PNM:             {fe:82, cat:"Evaluation",              folder:"Price Negotiation Memorandum"},
  RESPONSIBILITY:  {fe:68, cat:"Evaluation",              folder:"Responsibility Determination"},
  COR_LETTER:      {fe:114,cat:"Award and Administration",folder:"COR Delegation(s)"},
  KICKOFF:         {fe:115,cat:"Award and Administration",folder:"Post Award Conference Report"},
  QASP:            {fe:130,cat:"Award and Administration",folder:"Government QASP & Reports"},
  AWARD_DOC:       {fe:110,cat:"Award and Administration",folder:"Contract (Base Award)"},
  CLOSEOUT:        {fe:134,cat:"Close-Out",               folder:"Closeout Documentation"},
  IGCE:            {fe:13, cat:"Acquisition Planning",    folder:"Independent Government Cost Estimate (IGCE)"},
  ANOSCA:          {fe:106,cat:"Award and Administration",folder:"ANOSCA and/or Public Announcement"},
  POST_AWARD_SYN:  {fe:108,cat:"Award and Administration",folder:"Post-award Synopsis"},
};

const DRIVE_TEMPLATES = {
  "Procurement Strategy Meeting Template":{id:"1zsIdwTXtBpTh5QQWLxn5RhUGoYcnZKEshFP5Pfwt2f8",label:"PSM Template (USE THIS - not Written Acq Plan)"},
  "PSM Signature Page":{id:"1ZBpkGiDGQSA1JQAjfnOEptbiWLml7FzFtu-rTp-vQ_g",label:"PSM Signature Page"},
  "PSM Addendum":{id:"1SDvq9S4NW3TaIUaR6WHNfGZp0J0xhebRVvNuyMREX3o",label:"PSM Addendum"},
  "Written Acquisition Plan Template":{id:"1ucFb1QQkzpRc31D9yhifcG5qxUwW4CBXFtfSPd5Nd8o",label:"Written Acq Plan (DEPRECATED 03/2026 - use PSM)"},
  "JOFOC":{id:"1bPEFFb1ptfPwdHeaaxTkgkpoqLRbW2mk1D8RqPKRSR4",label:"JOFOC"},
  "JOFOC 8a over $30M":{id:"1GCTiyGxFuvbcoqSVDvTfzPn9bZE30avS6hWNVY0PGyM",label:"JOFOC 8(a) >$30M"},
  "LSJ GSA FSS":{id:"1uNoXAW2RwsmzJPz0EZ5vf_Rb1bf14NHD7Hpf5Vs_bAY",label:"LSJ - GSA FSS"},
  "UCA Letter Contract Justification":{id:"1U4-9hr2KRG48J5zXJUsy4R-bNdV-wt-ARhh8_lLIIkU",label:"UCA/Letter Contract J&A"},
  "Price Negotiation Memorandum (PNM)":{id:"1GzbG0MiwuKi15k80AUQuX3eLzeYlZSuiwyNEg3Qa9KY",label:"PNM"},
  "Prenegotiation Position Memorandum (PPM)":{id:"1TWZ8rFAC3gdmPp3zHwzGgmPTtI0UgZax-9KHXwZvF44",label:"PPM"},
  "QASP Template":{id:"1YOkIfARa7gUZRaGv9ksAwhfSfg8tR_QAvBx_ffhXfvQ",label:"QASP Template"},
  "COR Recommendation":{id:"1DFT-ZekyaNGcGw_H--ZHfwo8zvw5-OP-BolSt5UezaI",label:"COR Recommendation Letter"},
  "COR Cancellation Memo":{id:"1p6xJVuF9gfjet6iKewKI9qtSrYbVfaoF_bsShW20vXw",label:"COR Cancellation Memo"},
  "RFP Non-Competitive New Awards":{id:"1gxOfFey6RU6Fmn-jBaYUlsGlH0ivOqLbIEp5AC2Vzb0",label:"RFP - Non-Competitive"},
  "RFP Existing Contracts":{id:"1-H1Z3QJDCiZ_44faiD65JdR-1UQ5FVy0F0tlv_p9LTY",label:"RFP - Existing Contracts"},
  "DRFP Cover Letter":{id:"1JTSH2C3uSJwxDb3yjx_Z8NzQFpLOaTltb0VKMklAf34",label:"DRFP Cover Letter"},
  "Final RFP Cover Letter":{id:"1YBMGuyOgbwQ-c8qtf5UG7GUfjbXmdPy2rbZ3dNDq3rg",label:"Final RFP Cover Letter"},
  "Postaward Conference Report":{id:"1vEeUhFcSu1n9PE0ZE5N5E6MK37_igxoLN_Yw2tMPt4o",label:"Post-Award Conference Report"},
  "Postaward Notification Successful":{id:"1CCEIhO8burbmhNtDjjr2NdhSEN41GncZtD5yj9z2kaE",label:"Award Notification - Successful Offeror"},
  "Postaward Notification Unsuccessful":{id:"1o6Ep2GZerlenF9zCfHb9sz__SzD6oFsbrvcAqWzKKvw",label:"Award Notification - Unsuccessful Offeror"},
  "Source Selection Authority Appointment":{id:"1krcn_WgbbuVgPbHor4QPUXNT78Cu2aHhCICDkpyzJoY",label:"Source Selection Authority Appointment"},
  "SEB Membership Appointment Memo":{id:"1qo2A_rUSaTD1FBxoxHLaNxcUg4kpq6cJK-hPBZJmj1M",label:"SEB Membership Appointment"},
  "SET Membership Appointment Memo":{id:"1MEmDPEc8jE44QBLFFnnKg-W07M8J6-PquuMJ1QShqGY",label:"SET Membership Appointment"},
  "Set-Aside Pre-Award Notification":{id:"1sAfD6FO8umGsGjTDcoWKK74hOmEEx3YppyJLJu3sBA4",label:"Set-Aside Pre-Award Notice"},
  "OCI Determination Memo":{id:"1KMo2W6xKwnsIupcO-jPZYIHezdX3hzXtqtz45626l54",label:"OCI Determination Memo"},
  "OCI Limitation of Future Contracting":{id:"1G6Cz9KIBro7lOyCJ7KVdJMLXjJ-hON6tJHk6pD_JBDU",label:"OCI Limitation of Future Contracting"},
  "Option Justification":{id:"1RKIKO338MDnHdZfEcWyFyT1jDxLQ8J23gUPXNQqBO8s",label:"Option Justification"},
  "Option Exercise Determination":{id:"1_Acmz4P5ifxLY5ajmEspzu9DSJOhiTWwXSVEVcYvPJU",label:"Option Exercise Determination"},
  "Option Exercise Contractor Notification":{id:"1Slb99poaCTgIXm7_An8fsgxq8kk7Gkoy80H2QPkMTaQ",label:"Option - Contractor Notification"},
  "Determination Responsibility Nonresponsibility":{id:"1eU2--ToyfSgXQb4M2wz6cLBgzoGWj3kxUrKccwPGEqM",label:"Responsibility/Nonresponsibility D&F"},
  "D&F Single Award IDIQ Over $150M":{id:"1BpgXHlVr7PcpNeaQN3X00qXLT7Jk9YWYrrfCsZBIktk",label:"Single Award IDIQ D&F (>$150M)"},
  "D&F POP Over 5 Years":{id:"1g9vazCMIy9k22LhDLI_S9zRZsU-l6z4Wnx_Wbw8F-jE",label:"POP >5 Years D&F"},
  "D&F Commercial T&M or LH":{id:"11rIN3cs9pSZ0PoGU5Q5j8cqbmDjFwBkawsxc-IRGk-o",label:"Commercial T&M/LH D&F"},
  "D&F Noncommercial T&M or LH":{id:"1Rm3_JHsxYwTCRaA2R6scEowh_HEWhABPNej03HCjgdQ",label:"Noncommercial T&M/LH D&F"},
  "D&F GSA T&M or LH Order":{id:"1QPLcVURVpCHrh3N8DC8sy4AIvcYLkI8N7J28UI7ABhM",label:"GSA T&M/LH Order D&F"},
  "D&F CPAF Contract":{id:"1-hCdj_EgYbrZsr-468yUpqijbnmuZepn6GzUU8P7iVk",label:"CPAF D&F"},
  "D&F CPIF Contract":{id:"1FbZ2yi6yLLxyCoIFJfhs7sY45F5vP5uFEkwAwUB0yNU",label:"CPIF D&F"},
  "D&F Consolidation":{id:"1MP2N_0DjsBeZoAZWcia5RjkPS19w-1lYlC1wdTi8-Q4",label:"Consolidation D&F"},
  "D&F Bundling":{id:"1S2VdPlRL7jkUDsxSwHxpMqopYNb9-OEAh2tyPHXgFZs",label:"Bundling D&F"},
  "D&F Economy Act":{id:"1bpCbkXTnB5-_FU8ofLE6qrsGu9cBJLNKJhkTWDRLnAY",label:"Economy Act D&F"},
  "D&F Exclude Source":{id:"1DcPBXs8vvLVKg_djbbjVNYy-YgRjAMGl-G8c3QGMATA",label:"Authority to Exclude Source D&F"},
  "Fair Opportunity Exception Brand Name":{id:"1gNl8lhSmCoO2FIMnZUCEIlRxqEIUsMwI3RlV2qPuC3E",label:"Fair Opportunity Exception/Brand Name"},
  "Subcontracting Plan Waiver":{id:"1QIzNL5oUDYpE0DNLNIzKUtpqB5vtDUYOU5EQ7kQe-IA",label:"Subcontracting Plan Waiver"},
  "Determination ASM Not Conducted":{id:"1M8bgwLtydo5Xr9ID_Jqa1iUhMH25s2V_bUKzUdFu1bY",label:"ASM Not Conducted Memo"},
  "FAR NFS Deviation Request":{id:"1C8dhshmidwnaTjGt_6u1kVJ4ie2n4YrGhEq7BQrP7SQ",label:"FAR/NFS Deviation Request"},
  "NASA Technical Evaluation Report":{id:"1-HmU5RarXWxML3ILZRbITAbxq0BY7So9MLAf9m9m9Zs",label:"Technical Evaluation Report"},
  "NASA Notification of Procurement Action":{id:"1jGHTmE8P2L8s5_oaf6YizVm3GHTZKNWnhwgKFV5iilo",label:"ANOSCA/Notification of Procurement Action"},
  "CPARS Input":{id:"1Ful9WqBXCWOszpZtnrcbtL3GjvZXybknlgmhAlJ-hbs",label:"CPARS Input Template"},
  "BPA Annual Review":{id:"1KOWRWlm3bm90ZRmJobT8SYXEe0haSibXx61E_FKVDos",label:"BPA Annual Review"},
  "FDO Appointment":{id:"1AgLjcbQGPNBfZdES8UKUZVh4KWwQsDV7gk9d84xxv_M",label:"FDO Appointment"},
  "PEB Appointment":{id:"1n_SHikoVs9lxD-JAtrUI2-4CxFI5N7R6d6YQK8OlqAI",label:"PEB Appointment"},
  "Requirements Development Team Letters":{id:"1q3I57rB9tpxvojsqGKFSGS11DwNl5W-houfXztlU7io",label:"RDT Request & Appointment Letters"},
  "Data Requirements Description (DRD)":{id:"1UrJh-wPRAqKD0BXwmoTf6J05oov-c-HHKNY6BQIjKPg",label:"DRD Template"},
  "Ratification of Unauthorized Commitments":{id:"1GZaX9LjuZyclsVT2d7HRymOxLiMPfmFj2FUseOxtZZU",label:"Ratification"},
  "Buy American Act Nonavailability D&F":{id:"1xQChU_6u3d_BOdS-SBAedkHiQw6IJIDBGwVHMEpmFn8",label:"Buy American Act D&F"},
  "Electronic Document Posting Checklist":{id:"1vU7uUUDLg5QUSZKZzjne9Ohzg65OZ-MA2bxifZUO70Y",label:"Electronic Document Posting Checklist"},
  "GPE Templates SAM.gov":{id:"1Md8a2B8APNqBRPFbFYbJAMDtIhOetRqYF_gFxPk-HZ8",label:"GPE/SAM.gov Templates"},
};
const WIZARD_STEPS = [
  { key:"reqTitle", q:"What is the name of this requirement?",
    sub:"Enter a short descriptive title (e.g., 'Flight Sof.", type:"text" },
  { key:"value", q:"What is the estimated contract value?",
    sub:"Use your IGCE as the basis. Include all base perio.", type:"select",
    options:[
      {label:"<= $10,000 (Micro-Purchase)",value:10000},
      {label:"$10K - $250K (Simplified Acquisition)",value:250000},
      {label:"$250K - $1M",value:1000000},
      {label:"$1M - $5M",value:5000000},
      {label:"$5M - $25M",value:25000000},
      {label:"$25M - $50M",value:50000000},
      {label:"$50M+",value:75000000},
    ]},
  { key:"reqType", q:"What type of requirement is this?",
    sub:"Select the primary nature of the work.", type:"select",
    options:[
      {label:"Services",value:"SERVICES"},{label:"Supplies / Products",value:"SUPPLIES"},
      {label:"IT / Software",value:"IT"},{label:"Construction / Facilities",value:"CONSTRUCTION"},
      {label:"R&D / Research",value:"RD"},{label:"A&E / Engineering Support",value:"AE"},
    ]},
  { key:"isCommercial", q:"Is this a commercial item or service?",
    sub:"Commercial items are customarily sold in the comme.", type:"select",
    options:[
      {label:"Yes - commercial product or service",value:"YES"},
      {label:"No - non-commercial / Government-unique",value:"NO"},
      {label:"Need to Determine (system will help)",value:"TBD"},
    ]},
  { key:"competitionStrategy", q:"What is the competition strategy?",
    sub:"This drives J&A requirements and SAM.gov posting o.", type:"select",
    options:[
      {label:"Full and Open Competition",value:"FULL_OPEN"},
      {label:"Small Business Set-Aside (Total)",value:"SET_ASIDE"},
      {label:"HUBZone Set-Aside",value:"SET_ASIDE_HUB"},
      {label:"SDVOSB Set-Aside",value:"SET_ASIDE_SDV"},
      {label:"Sole Source - Only Responsible Source",value:"SOLE_SOURCE"},
      {label:"Sole Source - Unusual Urgency",value:"SOLE_SOURCE"},
      {label:"Order off Existing Vehicle (GWAC/IDIQ)",value:"EXISTING_VEHICLE"},
      {label:"Still Determining",value:"FULL_OPEN"},
    ]},
  { key:"contractType", q:"What contract type is planned?",
    sub:"FFP is preferred for well-defined requirements. Se.", type:"select",
    options: CONTRACT_TYPES.map(c=>({label:c,value:c})) },
  { key:"center", q:"Which NASA Center?",
    sub:"Select the contracting office responsible for this.", type:"select",
    options: NASA_CENTERS.map(c=>({label:c,value:c})) },
  { key:"isRecompete", q:"Is this a recompete of an existing contract?",
    sub:"Helps flag incumbent considerations, transition pl.", type:"select",
    options:[
      {label:"No - new requirement",value:"NO"},
      {label:"Yes - recompete of existing contract",value:"YES"},
      {label:"Yes - follow-on sole source bridge",value:"BRIDGE"},
    ]},
  { key:"naics", q:"What is the NAICS code?",
    sub:"6-digit code. Common NASA codes: 541715 (R&D), 541330 (Engineering), 336414 (Aircraft).", type:"text" },
  { key:"psc", q:"What is the PSC / FSC code?",
    sub:"4-character code (e.g. R499, AC13, 1560). Leave blank if unknown.", type:"text" },
  { key:"pop", q:"What is the period of performance?",
    sub:"E.g. 'Base year + 4 option years', '12 months', 'Through September 30, 2027'.", type:"text" },
  { key:"coName", q:"Contracting Officer name?",
    sub:"Your name as it will appear on documents and signature pages.", type:"text" },
  { key:"coEmail", q:"Contracting Officer email?",
    sub:"Used for workflow routing and document review notifications.", type:"text" },
  { key:"techRepEmail", q:"Technical Representative (COR/COTR) email?",
    sub:"The Tech Rep who will certify the facts in acquisition documents.", type:"text" },
];

const C = {
  bg:"#040d1a", bg2:"#061020", bg3:"#08182e",
  border:"#1a3a6e", border2:"#1a5aaa",
  blue:"#4a9eff", blue2:"#7ec8ff",
  muted:"#4a7aaa", text:"#c8d8f0", dim:"#7a9ab8",
  green:"#3aaa66", yellow:"#ffaa30", pink:"#cc4a88", purple:"#aa4aff",
};
const S = {
  app:{ fontFamily:"IBM Plex Mono,monospace", background:C.bg, minHeight:"100vh", color:C.text },
  hdr:{ background:"linear-gradient(135deg,"+(C.bg)+" 0%,#071428 50%,#0a1f3d 100%)", borderBottom:"1px solid "+(C.border), padding:"14px 24px", display:"flex", alignItems:"center", gap:"12px", position:"sticky", top:0, zIndex:100 },
  logo:{ fontSize:"20px", fontWeight:"700", color:C.blue, letterSpacing:"3px" },
  badge:{ background:C.bg3, border:"1px solid "+C.border2, color:C.blue, padding:"3px 10px", fontSize:"10px", letterSpacing:"2px", borderRadius:"2px" },
  main:{ maxWidth:"1060px", margin:"0 auto", padding:"24px" },

  wWrap:{ maxWidth:"680px", margin:"0 auto", paddingTop:"40px" },
  wCard:{ background:C.bg2, border:"1px solid "+C.border, borderRadius:"4px", padding:"40px" },
  wQ:{ fontSize:"20px", fontWeight:"600", color:C.blue2, marginBottom:"6px", lineHeight:1.3 },
  wSub:{ fontSize:"12px", color:C.muted, marginBottom:"28px", lineHeight:1.6 },
  wGrid:{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"8px" },
  wOpt:(sel)=>({ background:sel?"#0d3060":C.bg3, border:sel?"1px solid "+(C.blue):"1px solid "+(C.border), color:sel?C.blue2:C.dim, padding:"12px 16px", cursor:"pointer", borderRadius:"3px", fontSize:"12px", textAlign:"left", transition:"all .15s" }),
  wNext:{ background:"#0d5aaa", color:"#fff", border:"none", padding:"12px 28px", fontSize:"12px", letterSpacing:"1px", cursor:"pointer", borderRadius:"2px", marginTop:"20px" },
  wProg:{ display:"flex", gap:"4px",marginBottom:"28px"},
  wDot:(a,d)=>({ width:a?"22px":"7px", height:"4px", background:d?C.blue:a?C.blue2:C.border, borderRadius:"2px", transition:"all .3s" }),
  wInput:{ background:C.bg3, border:"1px solid "+C.border, color:C.text, padding:"10px 14px", fontSize:"13px", borderRadius:"3px", width:"100%", boxSizing:"border-box", fontFamily:"IBM Plex Mono,monospace" },

  sumBar:{ background:C.bg2, border:"1px solid "+C.border, borderRadius:"4px", padding:"14px 18px", display:"flex", gap:"20px", flexWrap:"wrap", marginBottom:"20px", fontSize:"11px" },
  sumItem:{ display:"flex", flexDirection:"column", gap:"2px" },
  sumLabel:{ color:C.muted, fontSize:"10px", letterSpacing:"1px" },
  sumVal:{ color:C.text, fontWeight:"600" },
  laneTag:{ display:"inline-block", background:"#0d3060", border:"1px solid "+C.blue, color:C.blue2, padding:"4px 12px", fontSize:"11px", letterSpacing:"1px", borderRadius:"2px",marginBottom:"20px"},
  phCard:(open,done)=>({ background:done?"#040d1a":open?"#061a30":C.bg, border:done?"1px solid #1a4a2e":open?"1px solid "+(C.blue):"1px solid "+(C.border), borderRadius:"4px", overflow:"hidden", marginBottom:"10px", transition:"all .2s" }),
  phHdr:(open,done)=>({ padding:"15px 20px", display:"flex", alignItems:"center", gap:"10px", background:open?"#071428":"transparent", cursor:"pointer" }),
  phTitle:{ flex:1, fontWeight:"600", fontSize:"13px", letterSpacing:"1px" },
  phStatus:(done)=>({ fontSize:"10px", color:done?C.green:C.muted, letterSpacing:"1px" }),

  stepRow:(done)=>({ display:"flex", alignItems:"flex-start", gap:"10px", padding:"12px 14px", background:done?"#041a0e":C.bg, border:done?"1px solid #1a5a2e":"1px solid #1a3060", borderRadius:"3px", cursor:"pointer", transition:"all .15s",marginBottom:"6px"}),
  stepChk:(done)=>({ width:"18px", height:"18px", border:done?"1px solid "+(C.green):"1px solid "+(C.muted), borderRadius:"2px", background:done?C.green:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", marginTop:"1px" }),
  stepTitle:{ fontWeight:"600", fontSize:"12px", color:C.text },
  stepNfs:{ fontSize:"10px", color:C.muted, letterSpacing:"1px", marginTop:"2px" },
  typeTag:(t)=>{ const m={CHECK:[C.bg3,C.blue],DECISION:["#2a2010",C.yellow],GENERATE:["#1a3a1a",C.green],COORDINATE:["#3a1a2a",C.pink],FORM:["#2a1a3a",C.purple]}; const [bg,fg]=m[t]||[C.bg3,C.muted]; return{background:bg,color:fg,padding:"2px 7px",fontSize:"9px",letterSpacing:"1px",borderRadius:"2px",flexShrink:0}; },
  hint:{ fontSize:"10px", color:C.green, letterSpacing:"1px" },

  panel:{ position:"fixed", top:0, right:0, bottom:0, width:"580px", background:C.bg, borderLeft:"1px solid "+(C.border), display:"flex", flexDirection:"column", zIndex:200, animation:"slideIn .2s ease" },
  panelHdr:{ padding:"18px 22px", borderBottom:"1px solid "+(C.border), display:"flex", alignItems:"center", gap:"10px", background:C.bg2, flexShrink:0 },
  panelTitle:{ flex:1, fontWeight:"600", fontSize:"13px", color:C.blue2 },
  closeBtn:{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:"20px", padding:"0 4px", lineHeight:1 },
  panelBody:{ flex:1, overflow:"auto", padding:"22px" },
  panelSection:{ marginBottom:"20px" },
  panelLabel:{ fontSize:"10px", color:C.muted, letterSpacing:"2px",marginBottom:"8px"},secHdr:{fontSize:"10px",color:"#4a9eff",letterSpacing:"2px",marginBottom:"8px",borderBottom:"1px solid #1a3a6e",paddingBottom:"4px",marginTop:"18px"},secHdr2:{fontSize:"10px",color:"#4a9eff",letterSpacing:"2px",marginBottom:"8px",borderBottom:"1px solid #1a3a6e",paddingBottom:"4px"},grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},
  panelText:{ fontSize:"12px", color:C.dim, lineHeight:1.8 },
  doneBox:{ background:"#041a0e", border:"1px solid " + C.green, borderRadius:"3px", padding:"12px 16px", fontSize:"12px", color:C.green,marginBottom:"16px"},
  nfsBox:{ background:C.bg3, border:"1px solid "+C.border, borderRadius:"3px", padding:"10px 14px", fontSize:"11px", color:C.muted, fontStyle:"italic",marginBottom:"16px"},
  decOpt:(sel)=>({ background:sel?"#0d3060":C.bg3, border:sel?"1px solid "+(C.blue):"1px solid "+(C.border), color:sel?C.blue2:C.dim, padding:"12px 16px", cursor:"pointer", borderRadius:"3px", fontSize:"12px", textAlign:"left", marginBottom:"8px", width:"100%", display:"block" }),
  decSub:{ fontSize:"10px", color:C.muted, marginTop:"3px" },
  textarea:{ background:C.bg3, border:"1px solid "+C.border, color:C.text, padding:"10px 14px", fontSize:"12px", borderRadius:"3px", width:"100%", minHeight:"80px", fontFamily:"IBM Plex Mono,monospace", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 },
  primaryBtn:{ background:"linear-gradient(90deg,#0d5aaa,#0d3a8a)", border:"1px solid "+C.blue, color:"#fff", padding:"11px 20px", cursor:"pointer", borderRadius:"3px", fontSize:"12px", letterSpacing:"1px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%" },
  completeBtn:{ background:"#0a3a1a", border:"1px solid "+C.green, color:C.green, padding:"11px 20px", cursor:"pointer", borderRadius:"3px", fontSize:"12px", letterSpacing:"1px", width:"100%", textAlign:"center" },
  docTabs:{ display:"flex", gap:"6px", marginBottom:"14px", flexWrap:"wrap" },
  docTab:(sel)=>({ background:sel?"#0d3060":C.bg3, border:sel?"1px solid "+(C.blue):"1px solid "+(C.border), color:sel?C.blue2:C.dim, padding:"6px 12px", cursor:"pointer", borderRadius:"3px", fontSize:"10px", letterSpacing:"1px" }),
  docContent:{ background:C.bg3, border:"1px solid "+C.border, borderRadius:"3px", padding:"16px", fontSize:"11px", lineHeight:1.9, color:C.dim, whiteSpace:"pre-wrap", maxHeight:"360px", overflow:"auto" },
  copyBtn:{ background:C.bg3, border:"1px solid "+C.border2, color:C.blue, padding:"6px 14px", cursor:"pointer", borderRadius:"2px", fontSize:"10px", letterSpacing:"1px", marginTop:"8px" },
  startOver:{ background:"none", border:"1px solid "+C.border, color:C.muted, padding:"5px 12px", fontSize:"10px", letterSpacing:"1px", cursor:"pointer", borderRadius:"2px" },
  prgBar:{ width:"110px", height:"4px", background:C.border, borderRadius:"2px" },
  prgFill:(pct)=>({ width:(pct)+"%", height:"100%", background:C.blue, borderRadius:"2px", transition:"width .3s" }),
  grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},
};

function StepWorkspace({ step, intake, roadmap, onClose, onComplete, isDone }) {
  const [decision, setDecision] = useState(null);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [docContent, setDocContent] = useState({});
  const [loading, setLoading] = useState({});
  const [copied, setCopied] = useState(false);
  const [naicsIdx, setNaicsIdx] = useState(0);
  const [pscIdx, setPscIdx] = useState(0);
  const [formData, setFormData] = useState({});
  const [formSaved, setFormSaved] = useState({});

  const typeLabel = { CHECK:"CHECKLIST", DECISION:"DECISION POINT", GENERATE:"DOCUMENT GENERATOR", COORDINATE:"COORDINATION PACKAGE", FORM:"FORM" };
  const typeColor = { CHECK:C.blue, DECISION:C.yellow, GENERATE:C.green, COORDINATE:C.pink, FORM:C.purple };

  async function genDoc(docType, tabKey) {
    setLoading(l=>({...l,[tabKey]:true}));
    const content = await generateDoc(docType, intake, roadmap);
    setDocContent(d=>({...d,[tabKey]:content}));
    setLoading(l=>({...l,[tabKey]:false}));
    try {
      const sk="cpas_docs_"+(intake?.reqTitle||"x");
      const ex=JSON.parse(localStorage.getItem(sk)||"[]");
      const pkg=(step.packages||[]).find(p=>p.key===tabKey)||{};
      const entry={docType:pkg.docType||tabKey,label:pkg.label||tabKey,content,ts:Date.now()};
      localStorage.setItem(sk,JSON.stringify([...ex.filter(d=>d.docType!==entry.docType),entry]));
    } catch(e){}
  }

  function copyDoc(key) {
    navigator.clipboard.writeText(docContent[key]||"");
    setCopied(key);
    setTimeout(()=>setCopied(false),2000);
  }

  function markDone() {
    onComplete(step.id);
    onClose();
  }

  const packages = step.packages || (step.docType ? [{ key:"main", label:step.title, docType:step.docType }] : []);
  const curPkg = packages[activeTab];

  return (
    <div style={S.panel}>
      <div style={S.panelHdr}>
        <div style={{ fontSize:"14px" }}>
          {{ CHECK:"v", DECISION:"!", GENERATE:"", COORDINATE:"", FORM:"" }[step.type]}
        </div>
        <div>
          <div style={S.panelTitle}>{step.title}</div>
          <div style={{ fontSize:"9px", color:typeColor[step.type], letterSpacing:"2px" }}>{typeLabel[step.type]}</div>
        </div>
        <button style={S.closeBtn} onClick={onClose}>x</button>
      </div>

      <div style={S.panelBody}>
        {/* NFS Reference */}
        {step.nfs && <div style={S.nfsBox}>? {step.nfs}</div>}

        {/* Done banner */}
        {isDone && <div style={S.doneBox}>v STEP COMPLETE - Review or reopen if needed.</div>}

        {/* RCPO REVIEW CHAIN */}
        {step.rcpoDocKey && <ReviewChain docKey={step.rcpoDocKey} value={intake?.value||0} center={intake?.center||""} />}

        {/* WHAT THIS MEANS */}
        <div style={S.panelSection}>
          <div style={S.panelLabel}>WHAT THIS STEP REQUIRES</div>
          <div style={S.panelText}>{step.detail}</div>
        </div>

        {/* GUIDANCE */}
        {step.guidance && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>HOW TO COMPLETE IT</div>
            <div style={S.panelText}>{step.guidance}</div>
          </div>
        )}

        {/* DONE WHEN */}
        {step.doneWhen && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>DONE WHEN</div>
            <div style={{ ...S.panelText, color:C.green }}>{step.doneWhen}</div>
          </div>
        )}

        {/* -- CHECK TYPE -- */}
        {step.type === "CHECK" && (
          <div style={S.panelSection}>
            {(STEP_CHECKS[step.id]||[]).length > 0 && (
              <div style={{marginBottom:12}}>
                <div style={S.panelLabel}>QUICK CHECKS</div>
                {(STEP_CHECKS[step.id]||[]).map((item,qi) => {
                  const ck = (formData[step.id+"_qc_"+qi]);
                  return (
                    <div key={qi} onClick={()=>setFormData(d=>({...d,[step.id+"_qc_"+qi]:!ck}))}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",
                              background:ck?"#041a0e":"#080f1e",border:"1px solid "+(ck?"#1a6a3a":"#1a2a4a"),
                              borderRadius:3,cursor:"pointer",marginBottom:4}}>
                      <div style={{width:14,height:14,border:"1px solid "+(ck?"#3aaa66":"#2a4a6a"),
                                   borderRadius:2,background:ck?"#3aaa66":"transparent",flexShrink:0,
                                   display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>
                        {ck?"v":""}
                      </div>
                      <span style={{fontSize:11,color:ck?"#4aba6a":"#8ab0d0"}}>{item}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={S.panelLabel}>NOTES / FILE REFERENCE</div>
            <textarea
              style={S.textarea}
              placeholder="Document what you found, file location, compliance basis..."
              value={notes}
              onChange={e=>setNotes(e.target.value)}
            />
            <button style={{...S.completeBtn, marginTop:"12px"}} onClick={markDone}>
              {isDone ? "v MARKED COMPLETE - CLICK TO REOPEN" : "v MARK STEP COMPLETE"}
            </button>
          </div>
        )}

        {/* -- DECISION TYPE -- */}
        {step.type === "DECISION" && step.decisionOptions && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>SELECT YOUR DETERMINATION</div>
            {step.decisionOptions.map((o,i)=>(
              <button key={i} style={S.decOpt(decision===i)} onClick={()=>setDecision(i)}>
                <div>{o.label}</div>
                {o.sub && <div style={S.decSub}>{o.sub}</div>}
              </button>
            ))}
            <div style={{...S.panelLabel, marginTop:"14px"}}>DOCUMENT YOUR RATIONALE</div>
            <textarea style={S.textarea} placeholder="Document the basis for this decision - r..." value={notes} onChange={e=>setNotes(e.target.value)} />
            <button
              style={{...S.completeBtn, marginTop:"12px", opacity:decision===null?.5:1}}
              onClick={()=>{ if(decision!==null) markDone(); }}
            >
              {isDone ? "v DECISION RECORDED" : "v RECORD DECISION & MARK COMPLETE"}
            </button>
          </div>
        )}

        {/* -- DECISION WITH NO OPTIONS -- */}
        {step.type === "DECISION" && !step.decisionOptions && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>DOCUMENT YOUR DETERMINATION</div>
            <textarea style={S.textarea} placeholder="Record your determination, regulatory ba..." value={notes} onChange={e=>setNotes(e.target.value)} />
            <button style={{...S.completeBtn, marginTop:"12px"}} onClick={markDone}>v RECORD &amp; MARK COMPLETE</button>
          </div>
        )}

        {/* -- CLAUSE MATRIX ENGINE -- */}
        {step.type === "GENERATE" && step.docType === "CLAUSE_MATRIX" && (
          <div style={{marginBottom:12}}>
            <ClauseMatrixUI intake={intake} onSectionIGenerated={(text) => {
              const sk = "cpas_docs_" + (intake?.reqTitle||"x");
              try {
                const ex = JSON.parse(localStorage.getItem(sk)||"[]");
                const entry = { docType:"SECTION_I", label:"Section I - Contract Clauses", content:text, ts:Date.now() };
                localStorage.setItem(sk, JSON.stringify([...ex.filter(d=>d.docType!=="SECTION_I"), entry]));
              } catch(e) {}
              alert("Section I saved to NEAR package.");
            }} />
          </div>
        )}

        {/* -- FORM TYPE - NAICS -- */}
        {step.type === "FORM" && step.formType === "NAICS" && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>NAICS CODE</div>
            <input placeholder="Search by code or keyword..." value={naicsSearch}
              onChange={e=>setNaicsSearch(e.target.value)}
              style={{ background:"#08182e", border:"1px solid #1a3a6e", color:"#c8d8f0", padding:"7px 10px", borderRadius:"3px", fontSize:"11px", width:"100%", marginBottom:"8px", fontFamily:"IBM Plex Mono,monospace" }} />
            <div style={{ maxHeight:"200px", overflowY:"auto",marginBottom:"10px"}}>
              {NAICS_COMMON.filter(n => !naicsSearch || n.code.includes(naicsSearch) || n.title.toLowerCase().includes(naicsSearch.toLowerCase())).map((n,i) => {
                const ri = NAICS_COMMON.indexOf(n);
                return <button key={ri} style={{ ...S.decOpt(naicsIdx===ri && !naicsCustom), width:"100%", textAlign:"left",marginBottom:"3px"}} onClick={()=>{setNaicsIdx(ri);setNaicsCustom("");}}>
                  <span style={{ color:C.blue2, marginRight:"8px", fontWeight:700 }}>{n.code}</span>
                  <span style={{ fontSize:"10px" }}>{n.title}</span>
                  {n.size && <span style={{ float:"right", fontSize:"9px", color:C.muted }}>{n.size}</span>}
                </button>;
              })}
            </div>
            <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>OR ENTER ANY CODE MANUALLY</div>
            <input placeholder="e.g. 481211" value={naicsCustom} onChange={e=>setNaicsCustom(e.target.value)}
              style={{ background:"#08182e", border:"1px solid " + (naicsCustom?"#4a9eff":"#1a3a6e"), color:"#c8d8f0", padding:"7px 10px", borderRadius:"3px", fontSize:"11px", width:"100%", marginBottom:"8px", fontFamily:"IBM Plex Mono,monospace" }} />
            <div style={{ fontSize:"10px", color:C.muted,marginBottom:"4px"}}>
              <span style={{ color:C.blue2, fontWeight:700 }}>Selected: </span>
              {naicsCustom ? naicsCustom + " (manual entry)" : (NAICS_COMMON[naicsIdx]?.code + " - " + NAICS_COMMON[naicsIdx]?.title)}
            </div>
            {!naicsCustom && NAICS_COMMON[naicsIdx]?.size && <div style={{ fontSize:"10px", color:C.muted,marginBottom:"8px"}}>Size standard: {NAICS_COMMON[naicsIdx].size}</div>}
            <div style={{ fontSize:"9px", color:"#2a4a6a",marginBottom:"10px"}}>Verify at sba.gov/size-standards if using a manual code</div>
            <button style={{...S.completeBtn}} onClick={markDone}>v CONFIRM NAICS &amp; MARK COMPLETE</button>
          </div>
        )}

        {step.type === "FORM" && step.formType === "PSC" && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>PSC CODE</div>
            <input placeholder="Search by code or description..." value={pscSearch}
              onChange={e=>setPscSearch(e.target.value)}
              style={{ background:"#08182e", border:"1px solid #1a3a6e", color:"#c8d8f0", padding:"7px 10px", borderRadius:"3px", fontSize:"11px", width:"100%", marginBottom:"8px", fontFamily:"IBM Plex Mono,monospace" }} />
            <div style={{ maxHeight:"200px", overflowY:"auto",marginBottom:"10px"}}>
              {PSC_COMMON.filter(p => !pscSearch || p.code.toLowerCase().includes(pscSearch.toLowerCase()) || p.title.toLowerCase().includes(pscSearch.toLowerCase())).map((p,i) => {
                const ri = PSC_COMMON.indexOf(p);
                return <button key={ri} style={{ ...S.decOpt(pscIdx===ri && !pscCustom), width:"100%", textAlign:"left",marginBottom:"3px"}} onClick={()=>{setPscIdx(ri);setPscCustom("");}}>
                  <span style={{ color:C.blue2, marginRight:"8px", fontWeight:700 }}>{p.code}</span>
                  <span style={{ fontSize:"10px" }}>{p.title}</span>
                </button>;
              })}
            </div>
            <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>OR ENTER ANY CODE MANUALLY</div>
            <input placeholder="e.g. V231" value={pscCustom} onChange={e=>setPscCustom(e.target.value)}
              style={{ background:"#08182e", border:"1px solid " + (pscCustom?"#4a9eff":"#1a3a6e"), color:"#c8d8f0", padding:"7px 10px", borderRadius:"3px", fontSize:"11px", width:"100%", marginBottom:"8px", fontFamily:"IBM Plex Mono,monospace" }} />
            <div style={{ fontSize:"10px", color:C.muted,marginBottom:"12px"}}>
              <span style={{ color:C.blue2, fontWeight:700 }}>Selected: </span>
              {pscCustom ? pscCustom + " (manual entry)" : (PSC_COMMON[pscIdx]?.code + " - " + PSC_COMMON[pscIdx]?.title)}
            </div>
            <button style={{...S.completeBtn}} onClick={markDone}>v CONFIRM PSC &amp; MARK COMPLETE</button>
          </div>
        )}

        {/* -- GENERATE TYPE -- */}
        {(step.type === "GENERATE" || (step.type === "FORM" && !step.formType)) && packages.length > 0 && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>GENERATED DOCUMENTS</div>
            {packages.length > 1 && (
              <div style={S.docTabs}>
                {packages.map((p,i)=>(
                  <button key={i} style={S.docTab(activeTab===i)} onClick={()=>setActiveTab(i)}>{p.label}</button>
                ))}
              </div>
            )}
            {curPkg && (
              <>
                {!docContent[curPkg.key] ? (
                  <button style={S.primaryBtn} onClick={()=>genDoc(curPkg.docType, curPkg.key)} disabled={loading[curPkg.key]}>
                    {loading[curPkg.key] ? "... GENERATING..." : "* GENERATE "+(curPkg.label.toUpperCase())}
                  </button>
                ) : (
                  <>
                    <div style={S.docContent}>{docContent[curPkg.key]}</div>
                    <div style={{ display:"flex", gap:"8px", marginTop:"8px", flexWrap:"wrap" }}>
                      <button style={S.copyBtn} onClick={()=>copyDoc(curPkg.key)}>
                        {copied===curPkg.key ? "v COPIED" : " COPY"}
                      </button>
                      <button style={{ ...S.copyBtn, background:"#0a1a3a", border:"1px solid #2a6aaa", color:"#4a9eff" }}
                        onClick={async()=>{ const err=await downloadAsWord(curPkg.docType||step.docType||"DOC",docContent[curPkg.key],intake); if(err)alert(err); }}>
                        WORD
                      </button>
                      {docContent[curPkg.key] && <SubmitButton docType={curPkg.docType||step.docType||"DOC"} content={docContent[curPkg.key]} intake={intake} />}
                      {docContent[curPkg.key] && <DocQualityBtn docType={curPkg.docType||step.docType||"DOC"} content={docContent[curPkg.key]} />}
                      <button style={S.copyBtn} onClick={()=>genDoc(curPkg.docType, curPkg.key)}>
                        {loading[curPkg.key] ? "..." : "<-> REGENERATE"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            <button style={{...S.completeBtn, marginTop:"16px"}} onClick={markDone}>
              {isDone ? "v MARKED COMPLETE" : "v MARK STEP COMPLETE"}
            </button>
          </div>
        )}

        {/* -- COORDINATE TYPE -- */}
        {step.type === "COORDINATE" && (
          <div style={S.panelSection}>
            <div style={S.panelLabel}>COORDINATION PACKAGE</div>
            <div style={{ ...S.panelText, color:C.pink,marginBottom:"14px"}}>
              ! This step generates the full coordination package - forms AND email. Generate all documents before marking complete.
            </div>
            {packages.length > 1 && (
              <div style={S.docTabs}>
                {packages.map((p,i)=>(
                  <button key={i} style={S.docTab(activeTab===i)} onClick={()=>setActiveTab(i)}>{p.label}</button>
                ))}
              </div>
            )}
            {curPkg && (
              <>
                {curPkg.formType === "NF1787" ? (
                  <>
                    <NF1787Form intake={intake} savedData={formData[curPkg.key]}
                      onSave={(d)=>{ setFormData(fd=>({...fd,[curPkg.key]:d})); setFormSaved(fs=>({...fs,[curPkg.key]:true})); }} />
                    {formSaved[curPkg.key] && <div style={{ marginTop:"8px", fontSize:"10px", color:"#3aaa66" }}>v Form data saved. Mark step complete when PCR response is received.</div>}
                  </>
                ) : curPkg.formType === "NF1787A" ? (
                  <>
                    <NF1787AForm intake={intake} savedData={formData[curPkg.key]}
                      onSave={(d)=>{ setFormData(fd=>({...fd,[curPkg.key]:d})); setFormSaved(fs=>({...fs,[curPkg.key]:true})); }} />
                    {formSaved[curPkg.key] && <div style={{ marginTop:"8px", fontSize:"10px", color:"#3aaa66" }}>v Form data saved.</div>}
                  </>
                ) : !docContent[curPkg.key] ? (
                  <button style={S.primaryBtn} onClick={()=>genDoc(curPkg.docType, curPkg.key)} disabled={loading[curPkg.key]}>
                    {loading[curPkg.key] ? "... GENERATING..." : "* GENERATE: "+(curPkg.label)}
                  </button>
                ) : (
                  <>
                    <div style={S.docContent}>{docContent[curPkg.key]}</div>
                    <div style={{ display:"flex", gap:"8px", marginTop:"8px", flexWrap:"wrap" }}>
                      <button style={S.copyBtn} onClick={()=>copyDoc(curPkg.key)}>
                        {copied===curPkg.key ? "v COPIED" : " COPY"}
                      </button>
                      <button style={{ ...S.copyBtn, background:"#0a1a3a", border:"1px solid #2a6aaa", color:"#4a9eff" }}
                        onClick={async()=>{ const err=await downloadAsWord(curPkg.docType||step.docType||"DOC",docContent[curPkg.key],intake); if(err)alert(err); }}>
                        WORD
                      </button>
                      {docContent[curPkg.key] && <SubmitButton docType={curPkg.docType||step.docType||"DOC"} content={docContent[curPkg.key]} intake={intake} />}
                      {docContent[curPkg.key] && <DocQualityBtn docType={curPkg.docType||step.docType||"DOC"} content={docContent[curPkg.key]} />}
                      <button style={S.copyBtn} onClick={()=>genDoc(curPkg.docType, curPkg.key)}>
                        {loading[curPkg.key] ? "..." : "<-> REGENERATE"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            <div style={{...S.panelLabel, marginTop:"16px"}}>COORDINATION NOTES / PCR RESPONSE</div>
            <textarea style={S.textarea} placeholder="Document SBA PCR response, concurrence d..." value={notes} onChange={e=>setNotes(e.target.value)} />
            <button style={{...S.completeBtn, marginTop:"12px"}} onClick={markDone}>
              {isDone ? "v COORDINATION COMPLETE" : "v MARK COORDINATION COMPLETE"}
            </button>
          </div>
        )}
      {/* TEMPLATE PANEL */}
      {step && <TemplatePanel stepId={step.id} />}
      {/* PHASE COMPLIANCE GATE */}
      {step && step.id && (
        <div style={{ padding:"0 24px 8px" }}>
          <ComplianceChecklist phaseId={"P" + step.id.charAt(1)} acquisitionId={step.id.charAt(1)} />
        </div>
      )}
      {/* CONTEXTUAL DOC REVIEW */}
      {step.reviewType && (
        <div style={{ padding:"20px 24px 0", borderTop:"1px solid #1a3a6e", marginTop:"8px" }}>
          <div style={{ fontSize:"10px", color:"#4a9eff", letterSpacing:"2px",marginBottom:"10px"}}>DRAFT DOCUMENT REVIEW</div>
          <DocumentReview intake={intake} initialDocType={step.reviewType} />
        </div>
      )}
      </div>
    </div>
  );
}

function IntakeWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(window.__cpas_prefill || {});
  const [selIdx, setSelIdx] = useState(0);
  useEffect(() => {
    function onPrefill() {
      if (window.__cpas_prefill) { setAnswers(window.__cpas_prefill); delete window.__cpas_prefill; }
    }
    window.addEventListener("cpas_prefill", onPrefill);
    return () => window.removeEventListener("cpas_prefill", onPrefill);
  }, []);
  const cur = WIZARD_STEPS[step];
  const isLast = step === WIZARD_STEPS.length - 1;

  // Pre-populate textVal and selIdx from prefilled answers when step changes
  const prefillText = cur.type === "text" ? (answers[cur.key] || "") : "";
  const prefillIdx = (() => {
    if (cur.type === "text" || !answers[cur.key]) return selIdx;
    const val = answers[cur.key];
    // Exact match first
    const exact = cur.options?.findIndex(o => o.value === val) ?? -1;
    if (exact >= 0) return exact;
    // Numeric bracket match - find lowest option value >= prefill (ceiling)
    if (typeof val === "number") {
      const opts = cur.options || [];
      for (let i = 0; i < opts.length; i++) {
        if (typeof opts[i].value === "number" && opts[i].value >= val) return i;
      }
      return opts.length - 1; // use last option if value exceeds all
    }
    return 0;
  })();
  const effectiveSelIdx = answers[cur.key] && cur.type !== "text" ? prefillIdx : selIdx;
  const [textVal, setTextVal] = useState(prefillText);

  // Sync textVal when step changes and there's a prefill
  useEffect(() => {
    if (cur.type === "text" && answers[cur.key]) {
      setTextVal(answers[cur.key]);
    } else {
      setTextVal("");
    }
    if (cur.type !== "text" && answers[cur.key]) {
      const idx = cur.options?.findIndex(o => o.value === answers[cur.key]) ?? -1;
      if (idx >= 0) setSelIdx(idx);
      else setSelIdx(0);
    } else {
      setSelIdx(0);
    }
  }, [step]);

  function next() {
    const chosen = cur.type === "text" ? textVal : cur.options[effectiveSelIdx].value;
    const ans = { ...answers, [cur.key]: chosen };
    setAnswers(ans);
    setSelIdx(0); setTextVal("");
    if (isLast) onComplete({ ...ans, naics: ans.naics||"541330", psc: ans.psc||"R499", pop: ans.pop||"Base year + 4 option years" });
    else setStep(s=>s+1);
  }

  return (
    <div style={S.wWrap}>
      <div style={{ marginBottom:"8px", color:C.muted, fontSize:"10px", letterSpacing:"2px" }}>
        ACQUISITION INTAKE - STEP {step+1} OF {WIZARD_STEPS.length}
      </div>
      <div style={S.wProg}>{WIZARD_STEPS.map((_,i)=><div key={i} style={S.wDot(i===step,i<step)} />)}</div>
      <div style={S.wCard}>
        <div style={S.wQ}>{cur.q}</div>
        <div style={S.wSub}>{cur.sub}</div>
        {cur.type === "text" ? (
          <input style={S.wInput} placeholder="Enter requirement title..." value={textVal}
            onChange={e=>setTextVal(e.target.value)} autoFocus
            onKeyDown={e=>e.key==="Enter"&&textVal&&next()} />
        ) : (
          <div style={S.wGrid}>
            {cur.options.map((o,i)=>(
              <button key={i} style={S.wOpt(effectiveSelIdx===i)} onClick={()=>{setSelIdx(i);}}>{o.label}</button>
            ))}
          </div>
        )}
        <button style={S.wNext} onClick={next} disabled={cur.type==="text"&&!textVal&&!answers[cur.key]}>
          {isLast ? "BUILD MY ACQUISITION ROADMAP ->" : "NEXT ->"}
        </button>
      </div>
    </div>
  );
}

function PhaseCard({ phase, completedSteps, onStepClick, onToggle }) {
  const [open, setOpen] = useState(phase.id === "P1");
  const done = phase.steps.every(s=>completedSteps.has(s.id));
  const started = phase.steps.some(s=>completedSteps.has(s.id));
  const doneCount = phase.steps.filter(s=>completedSteps.has(s.id)).length;

  return (
    <div style={S.phCard(open,done)}>
      <div style={S.phHdr(open,done)} onClick={()=>setOpen(o=>!o)}>
        <span style={{ fontSize:"18px" }}>{phase.icon}</span>
        <span style={S.phTitle}>{phase.id} - {phase.title.toUpperCase()}</span>
        <span style={{ fontSize:"11px", color:C.muted, marginRight:"8px" }}>{doneCount}/{phase.steps.length}</span>
        <span style={S.phStatus(done)}>{done?"v COMPLETE":started?"IN PROGRESS":"NOT STARTED"}</span>
        <span style={{ color:C.muted, fontSize:"11px", marginLeft:"8px" }}>{open?"^":"v"}</span>
      </div>
      {open && (
        <div style={{ padding:"4px 16px 16px" }}>
          <div style={{ fontSize:"11px", color:C.muted, marginBottom:"12px", paddingLeft:"2px" }}>{phase.description}</div>
          {phase.steps.map(step=>{
            const isDone = completedSteps.has(step.id);
            const tLabel = { CHECK:"CHECK", DECISION:"DECIDE", GENERATE:"GENERATE", COORDINATE:"COORD PKG", FORM:"FORM" };
            return (
              <div key={step.id} style={S.stepRow(isDone)} onClick={()=>onStepClick(step)}>
                <div style={S.stepChk(isDone)} onClick={e=>{e.stopPropagation();onToggle(step.id);}}>
                  {isDone&&"v"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                    <span style={S.stepTitle}>{step.title}</span>
                    <span style={S.typeTag(step.type)}>{tLabel[step.type]||step.type}</span>
                    <span style={S.hint}>^ OPEN WORKSPACE</span>
                  </div>
                  {step.nfs && <div style={S.stepNfs}>{step.nfs}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ComplianceChecklist phaseId={phase.id} acquisitionId={phase.id} />
    </div>
  );
}

const JSON_SCHEMA = `{"docType":"","overallRating":"PASS|MINOR ISSUES|MAJOR ISSUES|FAIL","summary":"2-3 sentence summary","strengths":["item"],"issues":[{"severity":"CRITICAL|MAJOR|MINOR","location":"section/element","issue":"description","recommendation":"fix"}],"missingElements":["item"],"complianceNotes":"FAR/NFS notes","readyToProced":true}`;

const REVIEW_PROMPTS = {
  SOW: (ctx) => `You are a senior NASA Contracting Officer conducting a pre-award SOW/PWS review. Context: ${ctx}.

Evaluate for: (1) Clear, measurable performance standards; (2) Defined deliverables with due dates; (3) No brand names without justification; (4) No personal services language; (5) Adequate security requirements (CNSI/CUI); (6) Section 508 compliance requirements; (7) Inherently governmental function concerns; (8) Labor category and hour definitions (if services); (9) Data rights and IP provisions; (10) Acceptance criteria.

Return ONLY valid JSON matching this schema: ${JSON_SCHEMA}`,

  JOFOC: (ctx) => `You are a senior NASA Contracting Officer reviewing a JOFOC/J&A for compliance with FAR 6.303-2. Context: ${ctx}.

Verify all 11 required elements: (1) Identification of agency and contracting activity; (2) Nature of action; (3) Description of supplies/services; (4) Identification of statutory authority (FAR 6.302-X); (5) Demonstration that authority applies with specific facts; (6) Efforts to obtain competition; (7) Anticipated cost is fair and reasonable; (8) Market research conducted; (9) Other supporting facts; (10) Sources that expressed interest; (11) Actions to remove future barriers. Also check: correct approval threshold authority, SOURCE SELECTION SENSITIVE marking, redaction plan for SAM posting.

Return ONLY valid JSON matching this schema: ${JSON_SCHEMA}`,

  IGCE: (ctx) => `You are a senior NASA Contracting Officer reviewing an Independent Government Cost Estimate (IGCE). Context: ${ctx}.

Evaluate: (1) Methodology documented (analogous, parametric, or engineering build-up); (2) Labor categories and rates tied to wage determination or market data; (3) Hours are realistic and defensible; (4) ODC/material costs supported; (5) Escalation rates applied correctly for option years; (6) Total matches PR/requisition amount; (7) Government-furnished items excluded; (8) Source of rates cited; (9) Signed and dated by requiring official; (10) Marked For Official Use Only.

Return ONLY valid JSON matching this schema: ${JSON_SCHEMA}`,

  CLAUSES: (ctx) => `You are a senior NASA Contracting Officer reviewing a solicitation clause matrix or Sections I/K/L/M for FAR/NFS compliance. Context: ${ctx}.

Check: (1) All required FAR 52.2xx clauses present per contract type; (2) Required NFS 1852.xxx clauses included; (3) No clauses included without legal basis; (4) Clause dates are current (not expired); (5) Fill-ins completed correctly; (6) Section L instructions align with Section M factors; (7) Section M weights add to 100% (if weighted); (8) Correct commercial/non-commercial clause set.

Return ONLY valid JSON matching this schema: ${JSON_SCHEMA}`,

  PNM: (ctx) => `You are a senior NASA Contracting Officer reviewing a Price Negotiation Memorandum (PNM) for FAR 15.406-3 compliance. Context: ${ctx}.

Verify: (1) Price objective documented pre-negotiation; (2) Contractor's initial and final positions documented; (3) Basis for determining price fair and reasonable (comparison, IGCE, market data); (4) Significant deviations explained; (5) Profit/fee analysis for cost-type; (6) Any unusual contract financing explained; (7) CO signature and date.

Return ONLY valid JSON matching this schema: ${JSON_SCHEMA}`,

  MARKET_RESEARCH: (ctx) => `You are a senior NASA Contracting Officer reviewing a Market Research Report for FAR Part 10 compliance. Context: ${ctx}.

Evaluate: (1) Dated within 18 months of solicitation; (2) Sources consulted documented (SAM.gov, industry, GSA, etc.); (3) Commercial item determination supported; (4) Small business capability assessed; (5) Existing contract vehicles considered; (6) Price/cost data gathered; (7) Recommended acquisition approach; (8) Signed by CO or designated official.

Return ONLY valid JSON matching this schema: ${JSON_SCHEMA}`,
};

function TemplatePanel({ stepId }) {
  const items = TEMPLATES[stepId] || [];
  if (!items.length) return null;

  function getLink(name) {
    // Find matching Drive template by name fuzzy match
    const keys = Object.keys(DRIVE_TEMPLATES);
    const exact = keys.find(k => k === name);
    if (exact) return DRIVE_TEMPLATES[exact];
    const partial = keys.find(k => k.includes(name.split(" ")[0]) || name.includes(k.split(" ")[0]));
    if (partial) return DRIVE_TEMPLATES[partial];
    return null;
  }

  return (
    <div style={{ marginTop:"12px", border:"1px solid #0d3a6e", borderRadius:"4px", overflow:"hidden" }}>
      <div style={{ padding:"7px 12px", background:"#04111f", fontSize:"9px", color:"#4a7aaa", letterSpacing:"2px" }}>
        AGENCY-WIDE TEMPLATES FOR THIS STEP ({items.length})
      </div>
      <div style={{ padding:"8px 12px" }}>
        {items.map((t,i) => {
          const driveEntry = getLink(t.name);
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"5px 0", borderBottom:"1px solid #061428" }}>
              <span style={{ fontSize:"9px", color:"#2a4a6a", minWidth:"28px" }}>FE {t.uid}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"10px", color:"#c8d8f0" }}>{t.name}</div>
                {driveEntry && <div style={{ fontSize:"9px", color:"#4a7aaa", fontStyle:"italic" }}>{driveEntry.label}</div>}
              </div>
              {driveEntry ? (
                <a href={"https://docs.google.com/document/d/" + driveEntry.id + "/edit"}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:"9px", padding:"3px 8px", borderRadius:"2px", background:"#0a1a3a", border:"1px solid #1a5aaa", color:"#4a9eff", letterSpacing:"1px", textDecoration:"none", whiteSpace:"nowrap" }}>
                  OPEN
                </a>
              ) : (
                <span style={{ fontSize:"9px", color:"#2a4a6a", padding:"3px 8px" }}>NEAR</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding:"6px 12px", background:"#04111f", fontSize:"9px", color:"#2a4a6a" }}>
        OPEN links go directly to the NASA HQ template in Google Drive
      </div>
    </div>
  );
}


// ── NEAR Package Cover Sheet ──────────────────────────────────────
function NearCoverSheet({ intake, docs, roadmap }) {
  async function generate() {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      AlignmentType, WidthType, BorderStyle, convertInchesToTwip, HeadingLevel
    } = await import("docx");

    const date = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
    const noBorder = { top:{style:BorderStyle.NONE,size:0}, bottom:{style:BorderStyle.NONE,size:0}, left:{style:BorderStyle.NONE,size:0}, right:{style:BorderStyle.NONE,size:0} };

    const row = (label, value) => new TableRow({ children:[
      new TableCell({ width:{size:35,type:WidthType.PERCENTAGE}, borders: noBorder, children:[
        new Paragraph({ children:[new TextRun({text:label,bold:true,size:22,font:"Times New Roman"})] })
      ]}),
      new TableCell({ width:{size:65,type:WidthType.PERCENTAGE}, borders: noBorder, children:[
        new Paragraph({ children:[new TextRun({text: String(value||""),size:22,font:"Times New Roman"})] })
      ]}),
    ]});

    const docRows = docs.map((d,i) => new TableRow({ children:[
      new TableCell({ borders: noBorder, children:[new Paragraph({children:[new TextRun({text:String(i+1)+".",size:20,font:"Times New Roman"})]})] }),
      new TableCell({ borders: noBorder, children:[new Paragraph({children:[new TextRun({text:d.label||d.docType,size:20,font:"Times New Roman"})]})] }),
      new TableCell({ borders: noBorder, children:[new Paragraph({children:[new TextRun({text:d.folder||"",size:20,font:"Times New Roman"})]})] }),
      new TableCell({ borders: noBorder, children:[new Paragraph({children:[new TextRun({text:new Date(d.ts||Date.now()).toLocaleDateString(),size:20,font:"Times New Roman"})]})] }),
    ]}));

    const doc = new Document({ sections:[{ properties:{ page:{ margin:{ top:convertInchesToTwip(1), bottom:convertInchesToTwip(1), left:convertInchesToTwip(1.25), right:convertInchesToTwip(1.25) }}},
      children:[
        new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:60}, children:[new TextRun({text:"NATIONAL AERONAUTICS AND SPACE ADMINISTRATION",bold:true,size:24,font:"Times New Roman"})] }),
        new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:60}, children:[new TextRun({text:intake?.center||"NASA Ames Research Center",bold:true,size:22,font:"Times New Roman"})] }),
        new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:300}, children:[new TextRun({text:"ACQUISITION FILE COVER SHEET",bold:true,size:26,font:"Times New Roman",allCaps:true})] }),

        new Table({ width:{size:100,type:WidthType.PERCENTAGE}, borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.NONE}}, rows:[
          row("Requirement Title:", intake?.reqTitle||""),
          row("Estimated Value:", "$"+((intake?.value||0).toLocaleString())),
          row("Contract Type:", intake?.contractType||""),
          row("NAICS Code:", intake?.naics||""),
          row("PSC Code:", intake?.psc||""),
          row("Period of Performance:", intake?.pop||""),
          row("Competition Strategy:", intake?.competitionStrategy||""),
          row("Contracting Officer:", intake?.coName||""),
          row("CO Email:", intake?.coEmail||""),
          row("Date Prepared:", date),
          row("Documents in Package:", String(docs.length)),
        ]}),

        new Paragraph({text:"",spacing:{before:300,after:100}}),
        new Paragraph({ children:[new TextRun({text:"DOCUMENT INDEX",bold:true,size:22,font:"Times New Roman",allCaps:true})], spacing:{after:100} }),

        new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows:[
          new TableRow({ children:[
            new TableCell({ children:[new Paragraph({children:[new TextRun({text:"#",bold:true,size:20,font:"Times New Roman"})]})] }),
            new TableCell({ children:[new Paragraph({children:[new TextRun({text:"Document",bold:true,size:20,font:"Times New Roman"})]})] }),
            new TableCell({ children:[new Paragraph({children:[new TextRun({text:"NEAR Folder",bold:true,size:20,font:"Times New Roman"})]})] }),
            new TableCell({ children:[new Paragraph({children:[new TextRun({text:"Generated",bold:true,size:20,font:"Times New Roman"})]})] }),
          ]}),
          ...docRows,
        ]}),

        new Paragraph({text:"",spacing:{before:400,after:0}}),
        new Paragraph({ children:[new TextRun({text:"_".repeat(40),size:22,font:"Times New Roman"})], spacing:{before:300,after:0} }),
        new Paragraph({ children:[new TextRun({text:intake?.coName||"[Contracting Officer]",size:22,font:"Times New Roman"})], spacing:{after:0} }),
        new Paragraph({ children:[new TextRun({text:"Contracting Officer",size:22,font:"Times New Roman"})], spacing:{after:0} }),
        new Paragraph({ children:[new TextRun({text:date,size:22,font:"Times New Roman"})], spacing:{after:0} }),
      ]
    }]});

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "CoverSheet_" + (intake?.reqTitle||"Package").replace(/[^a-zA-Z0-9]/g,"_").slice(0,30) + ".docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={generate}
      style={{background:"#0a2a1a",border:"1px solid #1a6a3a",color:"#4aba6a",
              padding:"7px 16px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:"bold"}}>
      ↓ COVER SHEET (.docx)
    </button>
  );
}


function NEARPackage({ intake, roadmap }) {
  const [docs, setDocs] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("cpas_docs_"+(intake?.reqTitle||"x"))||"[]"); } catch(e) { return []; }
  });
  if (!intake) return <div style={{ padding:"40px", textAlign:"center", color:"#4a7aaa", fontSize:"12px" }}>Complete the intake wizard first.</div>;
  const cats = ["Acquisition Planning","Solicitation Development","Evaluation","Award and Administration","Close-Out"];
  const grouped = {};
  cats.forEach(c => grouped[c]=[]);
  docs.forEach(d => { const m=NEAR_MAP[d.docType]; if(m){ if(!grouped[m.cat]) grouped[m.cat]=[]; grouped[m.cat].push({...d,...m}); }});
  const expected = [
    {docType:"IGCE",label:"IGCE"},
    {docType:"MARKET_RESEARCH",label:"Market Research Report"},
    {docType:"NF1787",label:"NF 1787 Small Business Coordination"},
    {docType:"NF1787A",label:"NF 1787A Market Research Report"},
    {docType:"ACQ_PLAN",label:"Procurement Strategy Meeting (PSM)"},
    {docType:"SOURCES_SOUGHT",label:"Sources Sought / RFI"},
    {docType:"SAM_SYNOPSIS",label:"SAM.gov Pre-Sol Synopsis"},
    {docType:"JOFOC",label:"JOFOC/J&A"},
    {docType:"SOL_OVERVIEW",label:"Solicitation Sections B/C"},
    {docType:"SECTION_L",label:"Section L - Instructions"},
    {docType:"SECTION_M",label:"Section M - Evaluation"},
    {docType:"CLAUSE_MATRIX",label:"Clause Matrix"},
    {docType:"PNM",label:"Price Negotiation Memo"},
    {docType:"RESPONSIBILITY",label:"Responsibility Determination"},
    {docType:"AWARD_DOC",label:"Award Document"},
    {docType:"ANOSCA",label:"ANOSCA"},
    {docType:"COR_LETTER",label:"COR Appointment Letter"},
    {docType:"QASP",label:"QASP"},
    {docType:"POST_AWARD_SYN",label:"SAM.gov Post-Award Synopsis"},
    {docType:"CLOSEOUT",label:"Closeout Documentation"},
  ];
  const genTypes = new Set(docs.map(d=>d.docType));
  const genCount = expected.filter(e=>genTypes.has(e.docType)).length;
  const pct = Math.round(genCount/expected.length*100);
  const CAT_C = {"Acquisition Planning":"4a9eff","Solicitation Development":"f4c542","Evaluation":"e87c3e","Award and Administration":"3aaa66","Close-Out":"aa6644"};
  async function dl(doc) {
    const err = await downloadAsWord(doc.docType, doc.content || doc.label, intake);
    if (err) {
      // fallback to txt
      const b = new Blob([doc.content||doc.label],{type:"text/plain"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "FE"+(doc.fe)+"_"+(doc.docType)+"_"+((intake.reqTitle||"doc").replace(/[^a-z0-9]/gi,"_"))+".txt";
      a.click();
    }
  }

  async function dlAll() {
    for (const doc of docs) {
      await dl(doc);
      await new Promise(r => setTimeout(r, 400)); // brief pause between downloads
    }
  }
  return (
    <div style={{ padding:"20px", maxWidth:"860px", margin:"0 auto" }}>
      <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"2px",marginBottom:"4px"}}>NEAR FILING PACKAGE</div>
      <div style={{ fontSize:"18px", color:"#c8d8f0", fontWeight:700,marginBottom:"4px"}}>{intake.reqTitle}</div>
      <div style={{ fontSize:"11px", color:"#4a7aaa",marginBottom:"10px"}}>${(intake.value||0).toLocaleString()} | {intake.center} | {intake.contractType}</div>
      <div style={{ background:"#08182e", border:"1px solid #1a3a6e", borderRadius:"4px", padding:"12px 16px",marginBottom:"20px"}}>
        <div style={{ display:"flex", justifyContent:"space-between",marginBottom:"6px"}}>
          <span style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px" }}>DOCUMENTS FILED TO NEAR</span>
          <span style={{ fontSize:"11px", color:"#c8d8f0" }}>{genCount}/{expected.length}</span>
        </div>
        <div style={{ height:"5px", background:"#0a1a3a", borderRadius:"3px",marginBottom:"10px"}}>
          <div style={{ width:(pct)+"%", height:"100%", background:"#3aaa66", borderRadius:"3px" }}/>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
          {expected.map(e => { const done=genTypes.has(e.docType); const m=NEAR_MAP[e.docType]||{};
            return <div key={e.docType} style={{ fontSize:"9px", padding:"2px 6px", borderRadius:"2px", background:done?"#041a0e":"transparent", border:"1px solid "+(done?"#3aaa66":"#1a3a6e"), color:done?"#3aaa66":"#2a4a6a" }}>
              {done?"v ":""}{e.label}{m.fe?" FE"+(m.fe):""}
            </div>;
          })}
        </div>
      </div>

      {docs.length > 0 && (
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={dlAll}
            style={{background:"#0a1a3a",border:"1px solid #2a6aaa",color:"#4a9eff",
                    padding:"7px 16px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:"bold"}}>
            ↓ DOWNLOAD ALL (.docx)
          </button>
          <NearCoverSheet intake={intake} docs={docs} roadmap={roadmap} />
        </div>
      )}

      {docs.length===0 ? (
        <div style={{ padding:"32px", textAlign:"center", border:"1px dashed #1a3a6e", borderRadius:"4px", color:"#4a7aaa", fontSize:"11px" }}>
          No documents yet. Generate documents from the roadmap - each auto-files to the correct NEAR folder above.
        </div>
      ) : cats.map(cat => {
        const cd=grouped[cat]||[]; if(!cd.length) return null;
        const col=CAT_C[cat]||"4a7aaa";
        return <div key={cat} style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:"#"+(col), letterSpacing:"2px", marginBottom:"8px", paddingBottom:"4px", borderBottom:"1px solid #"+(col)+"44" }}>{cat.toUpperCase()} ({cd.length})</div>
          {cd.map((doc,i) => <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px", marginBottom:"4px", background:"#08182e", border:"1px solid #1a3a6e", borderRadius:"3px" }}>
            <span style={{ fontSize:"9px", color:"#"+(col), border:"1px solid #"+col, padding:"2px 5px", borderRadius:"2px", whiteSpace:"nowrap" }}>FE {doc.fe}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"10px", color:"#c8d8f0", fontWeight:600 }}>{doc.folder}</div>
              <div style={{ fontSize:"9px", color:"#4a7aaa" }}>{doc.label||doc.docType}</div>
            </div>
            <button onClick={()=>dl(doc)} style={{ fontSize:"9px", padding:"3px 9px", cursor:"pointer", borderRadius:"2px", background:"#0a1a3a", border:"1px solid #1a5aaa", color:"#4a9eff", letterSpacing:"1px" }}>DL</button>
          </div>)}
        </div>;
      })}
      <div style={{ fontSize:"9px", color:"#2a4a6a", marginTop:"12px", fontStyle:"italic" }}>Documents saved locally. Generate from roadmap steps - each auto-files to the correct NEAR folder.</div>
    </div>
  );
}

function ComplianceChecklist({ phaseId, acquisitionId }) {
  const key = "cpas_chk_"+(acquisitionId||"def")+"_"+(phaseId);
  const [answers, setAnswers] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(key)||"{}"); } catch(e) { return {}; }
  });
  const [open, setOpen] = React.useState(false);
  const items = CHECKLIST[phaseId] || [];
  if (!items.length) return null;
  function ans(id, val) {
    const next = { ...answers, [id]: answers[id]===val ? null : val };
    setAnswers(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch(e) {}
  }
  const done = items.filter(i => answers[i.id]).length;
  const nos = items.filter(i => answers[i.id]==="N").length;
  const pct = Math.round(done/items.length*100);
  const allOk = done===items.length && nos===0;
  const AC = { Y:"3aaa66", N:"cc3333", NA:"4a7aaa" };
  const BG = { Y:"041a0e", N:"1a0404", NA:"040d1a" };
  return (
    <div style={{ marginTop:"12px", border:"1px solid "+(allOk?"#3aaa66":nos>0?"#cc3333":"#1a3a6e"), borderRadius:"4px" }}>
      <div style={{ padding:"8px 12px", display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", background:"#060f20" }}
        onClick={() => setOpen(!open)}>
        <span style={{ fontSize:"9px", letterSpacing:"2px", color: allOk?"#3aaa66":nos>0?"#cc3333":"#4a7aaa" }}>
          {phaseId} COMPLIANCE - {done}/{items.length}{nos>0?" ("+(nos)+" NO)":""}
        </span>
        <div style={{ flex:1, height:"3px", background:"#0a1a3a", borderRadius:"2px" }}>
          <div style={{ width:(pct)+"%", height:"100%", background:nos>0?"#cc3333":allOk?"#3aaa66":"#4a9eff", borderRadius:"2px" }}/>
        </div>
        <span style={{ fontSize:"10px", color:"#4a7aaa" }}>{open?"v":">"}</span>
      </div>
      {open && (
        <div style={{ padding:"10px 12px", borderTop:"1px solid #1a3a6e" }}>
          {nos>0 && <div style={{ fontSize:"10px", color:"#cc3333", marginBottom:"8px", padding:"5px 8px", border:"1px solid #cc3333", borderRadius:"3px" }}>! {nos} NO answer(s) - document rationale before proceeding</div>}
          {items.map(item => {
            const a = answers[item.id];
            return (
              <div key={item.id} style={{ marginBottom:"6px", padding:"7px 9px", background:a?"#"+BG[a]:"#040d1a", border:"1px solid "+(a?"#"+(AC[a]||"#0d2a4a"):"#1a3a6e"), borderRadius:"3px" }}>
                <div style={{ fontSize:"10px", color:"#c8d8f0", lineHeight:1.5,marginBottom:"5px"}}>
                  <span style={{ color:"#2a4a6a", marginRight:"5px", fontSize:"9px" }}>#{item.id}</span>{item.q}
                  {item.app && <span style={{ color:"#2a4a6a", fontSize:"9px", marginLeft:"5px" }}>({item.app})</span>}
                </div>
                <div style={{ display:"flex", gap:"5px" }}>
                  {[["Y","YES"],["N","NO"],["NA","N/A"]].map(([v,l]) => (
                    <button key={v} onClick={() => ans(item.id, v)}
                      style={{ fontSize:"9px", padding:"2px 8px", cursor:"pointer", borderRadius:"2px", letterSpacing:"1px",
                        background:a===v?"#"+AC[v]+"22":"transparent",
                        border:"1px solid "+(a===v?"#"+(AC[v]||"#1a3a6e"):"#1a3a6e"),
                        color:a===v?"#"+AC[v]:"#4a7aaa" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RouteAdvisor({ onUseRecommendation }) {
  const [mode, setMode] = React.useState("QUICK");
  const [desc, setDesc] = React.useState("");
  const [dollars, setDollars] = React.useState("");
  const [pop, setPop] = React.useState("");
  const [incumbent, setIncumbent] = React.useState("");
  const [urgency, setUrgency] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");
  const [sbGoal, setSbGoal] = React.useState("");
  const [fileText, setFileText] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  const QUICK_PROMPT = (desc, amt) => "You are a senior NASA CO advisor. Recommend the simplest legal acquisition approach for this requirement. Always prefer FAR 13.5/Part 12 over Part 15. Only recommend Part 15 or T&M when legally required. Be concise.\n\nRequirement: "+(desc)+"\nValue: $"+(amt)+"\nPeriod of Performance: "+(pop||"not specified")+"\nIncumbent: "+(incumbent||"unknown")+"\nUrgency: "+(urgency||"not specified")+"\nExisting Vehicle: "+(vehicle||"unknown")+"\n\nReturn ONLY this JSON (no other text, keep all strings under 60 words):\n{\"primary\":{\"approach\":\"\",\"contractType\":\"\",\"farAuthority\":\"\",\"commercialDetermination\":\"COMMERCIAL\",\"commercialRationale\":\"\",\"adminBurden\":\"LOW\",\"adminBurdenExplain\":\"\",\"timelineWeeks\":0,\"timelineExplain\":\"\",\"whyThisPath\":\"\",\"pros\":[\"\",\"\"],\"cons\":[\"\"],\"keyDocs\":[\"\",\"\"],\"nextSteps\":[\"\",\"\",\"\"]},\"alternative\":{\"approach\":\"\",\"contractType\":\"\",\"farAuthority\":\"\",\"adminBurden\":\"MEDIUM\",\"timelineWeeks\":0,\"whyConsider\":\"\",\"pros\":[\"\"],\"cons\":[\"\"]},\"whyNotFAR15\":\"\",\"whyNotTM\":\"\",\"redFlags\":[\"\"],\"intakeSuggestions\":{\"value\":"+(amt)+",\"reqType\":\"SERVICES\",\"isCommercial\":\"YES\",\"competitionStrategy\":\"FULL_OPEN\",\"contractType\":\"FFP\"}}";

  const FULL_PROMPT = (text) => "You are a senior NASA CO advisor. Analyze this package and recommend the simplest legal acquisition approach. Prefer FAR 13.5/Part 12 over Part 15. Be concise.\n\nPackage: "+(text.slice(0,6000))+"\n\nReturn ONLY this JSON (no other text, keep all strings under 60 words):\n{\"primary\":{\"approach\":\"\",\"contractType\":\"\",\"farAuthority\":\"\",\"commercialDetermination\":\"COMMERCIAL\",\"commercialRationale\":\"\",\"adminBurden\":\"LOW\",\"adminBurdenExplain\":\"\",\"timelineWeeks\":0,\"timelineExplain\":\"\",\"whyThisPath\":\"\",\"pros\":[\"\",\"\"],\"cons\":[\"\"],\"keyDocs\":[\"\",\"\"],\"nextSteps\":[\"\",\"\",\"\"]},\"alternative\":{\"approach\":\"\",\"contractType\":\"\",\"farAuthority\":\"\",\"adminBurden\":\"MEDIUM\",\"timelineWeeks\":0,\"whyConsider\":\"\",\"pros\":[\"\"],\"cons\":[\"\"]},\"whyNotFAR15\":\"\",\"whyNotTM\":\"\",\"redFlags\":[\"\"],\"extractedData\":{\"title\":\"\",\"estimatedValue\":0,\"reqType\":\"SERVICES\",\"naics\":\"\",\"psc\":\"\",\"isCommercial\":\"YES\"},\"intakeSuggestions\":{\"value\":0,\"reqType\":\"SERVICES\",\"isCommercial\":\"YES\",\"competitionStrategy\":\"FULL_OPEN\",\"contractType\":\"FFP\"}}";

  async function handleFileUpload(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    setError("");
    try {
      if (f.name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const buf = await f.arrayBuffer();
        const r = await mammoth.extractRawText({ arrayBuffer: buf });
        setFileText(r.value);
      } else {
        setFileText(await f.text());
      }
    } catch(e) { setError("Could not read file: " + e.message); }
  }

  async function runAdvisor() {
    setLoading(true); setResult(null); setError("");
    try {
      const reqContext = [
        "Requirement: " + desc,
        "Value: $" + dollars,
        "Period: " + (pop || "not specified"),
        "Incumbent: " + (incumbent || "unknown"),
        "Urgency: " + (urgency || "not specified"),
        "Vehicle: " + (vehicle || "unknown"),
        "Small Business: " + (sbGoal || "unknown"),
      ].join("\n");

      const fullText = mode === "QUICK" ? reqContext : ("Package:\n" + fileText.slice(0, 5000));

      const sysPrompt = "You are a senior NASA Contracting Officer. Recommend the LEAST burdensome acquisition approach that is legally defensible. Preference: FAR 13.5 simplified commercial first, then FAR Part 12, then FAR Part 15 only as last resort. For IDIQs use FAR 16.504 multiple award. Always check Rule of Two for small business. Respond ONLY with the labeled lines below, nothing else.";

      const userMsg = fullText + "\n\nRespond with ONLY these labeled lines (no intro, no explanation, just the labels and values):\nAPPROACH: value\nCONTRACT_TYPE: FFP or CPFF or TM or IDIQ or BPA or ORDER\nFAR_BASIS: FAR citation\nCOMMERCIAL: YES or NO\nCOMMERCIAL_WHY: reason under FAR 2.101\nBURDEN: LOW or MEDIUM or HIGH\nBURDEN_WHY: what makes it this level\nWEEKS: number\nWHY_BEST: why this is the right approach\nPROS: item1 | item2 | item3\nCONS: item1 | item2\nDOCS: doc1 | doc2 | doc3\nSTEPS: step1 | step2 | step3\nALT_APPROACH: alternative name\nALT_FAR: FAR citation\nALT_WEEKS: number\nALT_WHY: when to use instead\nNOT_15: why FAR Part 15 not needed\nNOT_TM: why TM or cost-plus not needed\nFLAGS: concern1 | concern2\nINTAKE_TYPE: SERVICES or SUPPLIES or IT or CONSTRUCTION or RD\nINTAKE_COMMERCIAL: YES or NO or TBD\nINTAKE_COMPETITION: FULL_OPEN or SET_ASIDE or SOLE_SOURCE or EXISTING_VEHICLE\nINTAKE_CONTRACT: FFP or CPFF or TM or IDIQ or BPA or ORDER";

      const apiKey = localStorage.getItem("cpas_api_key") || "";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: sysPrompt,
          messages: [{ role: "user", content: userMsg }]
        })
      });

      const respData = await resp.json();
      if (!resp.ok) {
        throw new Error(respData?.error?.message || "API error " + resp.status);
      }

      const raw = respData?.content?.[0]?.text || "";
      if (!raw || raw.trim().length < 20) {
        const stopReason = respData?.stop_reason || "unknown";
        const usage = respData?.usage ? JSON.stringify(respData.usage) : "no usage";
        throw new Error("Empty response (stop: " + stopReason + ", usage: " + usage + ")");
      }

      function gf(label) {
        const rx = new RegExp("(?:^|\n)" + label + ":\s*(.+)", "i");
        const m = raw.match(rx);
        return m ? m[1].trim() : "";
      }
      function gl(label) {
        const v = gf(label);
        return v ? v.split("|").map(s => s.trim()).filter(Boolean) : [];
      }

      const parsed = {
        primary: {
          approach:             gf("APPROACH"),
          contractType:         gf("CONTRACT_TYPE"),
          farAuthority:         gf("FAR_BASIS"),
          commercialDetermination: gf("COMMERCIAL") === "YES" ? "COMMERCIAL" : gf("COMMERCIAL") === "NO" ? "NON-COMMERCIAL" : "TBD",
          commercialRationale:  gf("COMMERCIAL_WHY"),
          adminBurden:          gf("BURDEN"),
          adminBurdenExplain:   gf("BURDEN_WHY"),
          timelineWeeks:        parseInt(gf("WEEKS")) || 0,
          timelineExplain:      "",
          whyThisPath:          gf("WHY_BEST"),
          pros:                 gl("PROS"),
          cons:                 gl("CONS"),
          keyDocs:              gl("DOCS"),
          nextSteps:            gl("STEPS"),
        },
        alternative: {
          approach:     gf("ALT_APPROACH"),
          contractType: gf("INTAKE_CONTRACT"),
          farAuthority: gf("ALT_FAR"),
          adminBurden:  "MEDIUM",
          timelineWeeks: parseInt(gf("ALT_WEEKS")) || 0,
          whyConsider:  gf("ALT_WHY"),
          pros: [], cons: [],
        },
        whyNotFAR15: gf("NOT_15"),
        whyNotTM:    gf("NOT_TM"),
        redFlags:    gl("FLAGS"),
        intakeSuggestions: {
          value:               parseFloat(dollars) || 0,
          reqType:             gf("INTAKE_TYPE") || "SERVICES",
          isCommercial:        gf("INTAKE_COMMERCIAL") || "TBD",
          competitionStrategy: gf("INTAKE_COMPETITION") || "FULL_OPEN",
          contractType:        gf("INTAKE_CONTRACT") || "FFP",
        }
      };

      if (!parsed.primary.approach) {
        throw new Error("Could not parse response. Raw: " + raw.slice(0, 200));
      }
      setResult(parsed);
    } catch(e) {
      setError("Analysis failed: " + e.message);
    }
    setLoading(false);
  }

  const CT_LABEL = { FFP:"Firm Fixed Price", CPFF:"Cost Plus Fixed Fee", CPAF:"Cost Plus Award Fee", CPIF:"Cost Plus Incentive Fee", "T&M":"Time & Materials", IDIQ:"IDIQ", BPA:"BPA", GSA_SCHEDULE:"GSA Schedule", ORDER:"Task/Delivery Order" };
  const inp = { background:"#08182e", border:"1px solid #1a3a6e", color:"#c8d8f0", padding:"8px 10px", borderRadius:"3px", fontSize:"11px", width:"100%", fontFamily:"IBM Plex Mono,monospace", outline:"none" };
  const btn = (active) => ({ padding:"8px 16px", cursor:"pointer", borderRadius:"3px", fontSize:"10px", letterSpacing:"1px", border:"1px solid "+(active?"#4a9eff":"#1a3a6e"), background:active?"#0d3a8a":"transparent", color:active?"#7ec8ff":"#4a7aaa" });

  return (
    <div style={{ padding:"24px", maxWidth:"820px", margin:"0 auto" }}>
      <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"2px",marginBottom:"4px"}}>ROUTE ADVISOR</div>
      <div style={{ fontSize:"20px", color:"#c8d8f0", fontWeight:700,marginBottom:"4px"}}>Acquisition Approach Advisor</div>
      <div style={{ fontSize:"11px", color:"#4a7aaa",marginBottom:"20px"}}>Get a recommended acquisition strategy with pros, cons, and alternatives - before you commit to a path.</div>

      <div style={{ display:"flex", gap:"8px",marginBottom:"20px"}}>
        <button style={btn(mode==="QUICK")} onClick={()=>{setMode("QUICK");setResult(null);}}>QUICK MODE - just a description + dollar amount</button>
        <button style={btn(mode==="FULL")} onClick={()=>{setMode("FULL");setResult(null);}}>FULL PACKAGE - upload NF 1707, PR, SOW, IGCE</button>
      </div>

      {mode === "QUICK" ? (
        <div>
          <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>DESCRIBE THE REQUIREMENT</div>
          <div style={{ fontSize:"10px", color:"#2a4a6a", marginBottom:"6px", fontStyle:"italic" }}>Be specific - what is the work, who performs it, any technical details, what makes it unique.</div>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)}
            placeholder="e.g. Multiple award IDIQ for aircraft services covering passenger transport and science missions, 5-year ordering period, minimum guarantee on first task order."
            style={{ ...inp, height:"90px", resize:"vertical",marginBottom:"12px"}} />
          <div style={S.grid2}>
            <div>
              <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>ESTIMATED TOTAL VALUE</div>
              <input value={dollars} onChange={e=>setDollars(e.target.value)} placeholder="e.g. 5000000" style={{ ...inp,marginBottom:"10px"}} />
            </div>
            <div>
              <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>PERIOD OF PERFORMANCE</div>
              <select value={pop} onChange={e=>setPop(e.target.value)} style={{ ...inp,marginBottom:"10px"}}>
                <option value="">-- Select --</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1 year base only">1 year base only</option>
                <option value="Base + 1 option year">Base + 1 option</option>
                <option value="Base + 2 option years">Base + 2 options</option>
                <option value="Base + 3 option years">Base + 3 options</option>
                <option value="Base + 4 option years (5 yr total)">Base + 4 options (5 yr total)</option>
                <option value="5 year base, no options">5 year base, no options</option>
                <option value="IDIQ ordering period 5 years">IDIQ 5-year ordering period</option>
                <option value="IDIQ ordering period 10 years">IDIQ 10-year ordering period</option>
                <option value="Other / not yet determined">Other / TBD</option>
              </select>
            </div>
          </div>
          <div style={S.grid2}>
            <div>
              <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>INCUMBENT CONTRACT?</div>
              <select value={incumbent} onChange={e=>setIncumbent(e.target.value)} style={{ ...inp,marginBottom:"10px"}}>
                <option value="">-- Select --</option>
                <option value="Yes, expiring within 90 days">Yes, expiring within 90 days</option>
                <option value="Yes, expiring in 6 months">Yes, expiring in 6 months</option>
                <option value="Yes, more than 6 months remaining">Yes, over 6 months remaining</option>
                <option value="No incumbent - new requirement">No incumbent</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>URGENCY / NEED DATE</div>
              <select value={urgency} onChange={e=>setUrgency(e.target.value)} style={{ ...inp,marginBottom:"10px"}}>
                <option value="">-- Select --</option>
                <option value="Critical - need award within 60 days">Critical - 60 days</option>
                <option value="Urgent - need award within 3 months">Urgent - 3 months</option>
                <option value="Standard - need award within 6 months">Standard - 6 months</option>
                <option value="Flexible - 6-12 months acceptable">Flexible - 6-12 months</option>
                <option value="No hard deadline">No hard deadline</option>
              </select>
            </div>
          </div>
          <div style={S.grid2}>
            <div>
              <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>EXISTING CONTRACT VEHICLE?</div>
              <select value={vehicle} onChange={e=>setVehicle(e.target.value)} style={{ ...inp,marginBottom:"10px"}}>
                <option value="">-- Select --</option>
                <option value="Yes - GSA schedule covers this requirement">Yes - GSA schedule</option>
                <option value="Yes - existing GWAC or IDIQ covers this">Yes - existing GWAC/IDIQ</option>
                <option value="Possibly - need to research">Possibly - need to research</option>
                <option value="No existing vehicle available">No existing vehicle</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>SMALL BUSINESS GOAL</div>
              <select value={sbGoal} onChange={e=>setSbGoal(e.target.value)} style={{ ...inp,marginBottom:"10px"}}>
                <option value="">-- Select --</option>
                <option value="Total small business set-aside likely">Total SB set-aside likely</option>
                <option value="Partial set-aside under consideration">Partial set-aside possible</option>
                <option value="Large business - Rule of Two not met">Large business - Rule of Two not met</option>
                <option value="8(a) sole source being considered">8(a) sole source</option>
                <option value="Full and open with SB subcontracting plan">Full and open with SB plan</option>
                <option value="Unknown - need market research">Unknown - need market research</option>
              </select>
            </div>
          </div>
        </div>) : (
        <div style={{ marginBottom:"16px" }}>
          <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>UPLOAD PACKAGE DOCUMENTS (.docx, .txt, .pdf text)</div>
          <label style={{ display:"block", border:"2px dashed #1a3a6e", borderRadius:"4px", padding:"20px", textAlign:"center", cursor:"pointer", color:"#4a7aaa", fontSize:"11px" }}>
            {fileText ? <span style={{ color:"#3aaa66" }}>v {fileName} - ready ({fileText.length.toLocaleString()} chars extracted)</span>
              : <span>Click to upload NF 1707, SOW, IGCE, or any package document<br/><span style={{ fontSize:"9px", color:"#2a4a6a" }}>Multiple documents: combine into one .txt file or upload the most complete one</span></span>}
            <input type="file" accept=".docx,.txt,.pdf,.md" style={{ display:"none" }} onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {error && <div style={{ color:"#cc3333", fontSize:"11px", marginBottom:"12px", padding:"8px", border:"1px solid #cc3333", borderRadius:"3px" }}>{error}</div>}

      <button onClick={runAdvisor} disabled={loading || (mode==="QUICK"?(!desc||!dollars):(!fileText))}
        style={{ background:loading?"#0a1a3a":"#0d3a8a", border:"1px solid #4a9eff", color:"#7ec8ff", padding:"11px 24px", cursor:loading?"not-allowed":"pointer", borderRadius:"3px", fontSize:"11px", letterSpacing:"1px", opacity:loading?0.6:1,marginBottom:"24px"}}>
        {loading ? "... ANALYZING REQUIREMENT" : "ANALYZE & RECOMMEND"}
      </button>

      {result && result.primary && (
          <div>
            <div style={{ background:"#041a0e", border:"1px solid #3aaa66", borderRadius:"4px", padding:"16px 20px", marginBottom:"12px" }}>
              <div style={{ fontSize:"9px", color:"#3aaa66", letterSpacing:"2px", marginBottom:"8px" }}>PRIMARY RECOMMENDATION</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px", flexWrap:"wrap", gap:"8px" }}>
                <div>
                  <div style={{ fontSize:"16px", color:"#c8d8f0", fontWeight:700 }}>{result.primary.approach}</div>
                  <div style={{ fontSize:"12px", color:"#3aaa66", marginTop:"2px" }}>{CT_LABEL[result.primary.contractType]||result.primary.contractType} | {result.primary.farAuthority}</div>
                </div>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {[["adminBurden","burden",{"LOW":"#3aaa66","MEDIUM":"#cc9933","HIGH":"#cc3333"}],["commercialDetermination","commercial",{"COMMERCIAL":"#3aaa66","NON-COMMERCIAL":"#cc3333"}]].map(([field,suffix,colors])=>{
                    const val=result.primary[field]||"";
                    const col=colors[val]||"#4a7aaa";
                    return <div key={suffix} style={{ padding:"3px 9px", borderRadius:"3px", fontSize:"9px", letterSpacing:"1px", background:col+"22", border:"1px solid "+col, color:col }}>{val}</div>;
                  })}
                  <div style={{ padding:"3px 9px", borderRadius:"3px", fontSize:"9px", letterSpacing:"1px", background:"#04111f", border:"1px solid #4a9eff", color:"#4a9eff" }}>~{result.primary.timelineWeeks}wks</div>
                </div>
              </div>
              <div style={{ fontSize:"11px", color:"#c8d8f0", lineHeight:1.7, padding:"10px 12px", background:"#040d1a", borderRadius:"3px", marginBottom:"10px" }}>{result.primary.whyThisPath}</div>
              <div style={S.grid2}>
                <div style={{ background:"#040d1a", borderRadius:"3px", padding:"9px 11px" }}>
                  <div style={{ fontSize:"9px", color:"#4a9eff", letterSpacing:"1px", marginBottom:"4px" }}>LEGAL AUTHORITY</div>
                  <div style={{ fontSize:"10px", color:"#c8d8f0", lineHeight:1.5 }}>{result.primary.farAuthority}</div>
                </div>
                <div style={{ background:"#040d1a", borderRadius:"3px", padding:"9px 11px" }}>
                  <div style={{ fontSize:"9px", color:"#4a9eff", letterSpacing:"1px", marginBottom:"4px" }}>COMMERCIAL BASIS</div>
                  <div style={{ fontSize:"10px", color:"#c8d8f0", lineHeight:1.5 }}>{result.primary.commercialRationale}</div>
                </div>
              </div>
              <div style={{ ...S.grid2, marginTop:"8px" }}>
                <div style={{ background:"#040d1a", borderRadius:"3px", padding:"9px 11px" }}>
                  <div style={{ fontSize:"9px", color:"#4a7aaa", letterSpacing:"1px", marginBottom:"4px" }}>ADMIN BURDEN</div>
                  <div style={{ fontSize:"10px", color:"#c8d8f0", lineHeight:1.5 }}>{result.primary.adminBurdenExplain}</div>
                </div>
                <div style={{ background:"#040d1a", borderRadius:"3px", padding:"9px 11px" }}>
                  <div style={{ fontSize:"9px", color:"#4a7aaa", letterSpacing:"1px", marginBottom:"4px" }}>TIMELINE</div>
                  <div style={{ fontSize:"10px", color:"#c8d8f0", lineHeight:1.5 }}>{result.primary.timelineExplain}</div>
                </div>
              </div>
              <div style={{ ...S.grid2, marginTop:"8px" }}>
                <div>
                  <div style={{ fontSize:"9px", color:"#3aaa66", letterSpacing:"1px", marginBottom:"6px" }}>ADVANTAGES</div>
                  {result.primary.pros?.map((p,i)=><div key={i} style={{ fontSize:"10px", color:"#c8d8f0", padding:"3px 0", borderBottom:"1px solid #0a1a3a" }}>+ {p}</div>)}
                </div>
                <div>
                  <div style={{ fontSize:"9px", color:"#cc7733", letterSpacing:"1px", marginBottom:"6px" }}>TRADEOFFS</div>
                  {result.primary.cons?.map((c,i)=><div key={i} style={{ fontSize:"10px", color:"#c8d8f0", padding:"3px 0", borderBottom:"1px solid #0a1a3a" }}>- {c}</div>)}
                </div>
              </div>
              {result.primary.keyDocs?.length>0 && <div style={{ marginTop:"8px" }}>
                <div style={{ fontSize:"9px", color:"#4a7aaa", letterSpacing:"1px", marginBottom:"5px" }}>REQUIRED DOCUMENTS</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                  {result.primary.keyDocs.map((d,i)=><span key={i} style={{ fontSize:"9px", padding:"2px 7px", border:"1px solid #1a3a6e", borderRadius:"2px", color:"#7ec8ff" }}>{d}</span>)}
                </div>
              </div>}
              <div style={{ marginTop:"10px" }}>
                <div style={{ fontSize:"9px", color:"#4a7aaa", letterSpacing:"1px", marginBottom:"5px" }}>NEXT STEPS</div>
                {result.primary.nextSteps?.map((s,i)=><div key={i} style={{ fontSize:"10px", color:"#c8d8f0", padding:"3px 0" }}>{i+1}. {s}</div>)}
              </div>
              <button onClick={()=>onUseRecommendation&&onUseRecommendation(result.intakeSuggestions||{},result.extractedData||{})}
                style={{ marginTop:"12px", background:"#3aaa66", border:"none", color:"#fff", padding:"10px 20px", cursor:"pointer", borderRadius:"3px", fontSize:"11px", fontWeight:700, letterSpacing:"1px" }}>
                USE THIS APPROACH - START ACQUISITION
              </button>
            </div>

            {(result.whyNotFAR15||result.whyNotTM) && (
              <div style={{ background:"#08182e", border:"1px solid #1a3a6e", borderRadius:"4px", padding:"12px 14px", marginBottom:"12px" }}>
                <div style={{ fontSize:"9px", color:"#4a7aaa", letterSpacing:"2px", marginBottom:"8px" }}>WHY NOT THE MORE COMPLEX APPROACHES</div>
                {result.whyNotFAR15 && <div style={{ marginBottom:"6px" }}><span style={{ fontSize:"9px", color:"#cc7733", letterSpacing:"1px" }}>FAR PART 15: </span><span style={{ fontSize:"10px", color:"#c8d8f0" }}>{result.whyNotFAR15}</span></div>}
                {result.whyNotTM && <div><span style={{ fontSize:"9px", color:"#cc7733", letterSpacing:"1px" }}>T&M/COST-PLUS: </span><span style={{ fontSize:"10px", color:"#c8d8f0" }}>{result.whyNotTM}</span></div>}
              </div>
            )}

            {result.alternative?.approach && (
              <div style={{ background:"#08182e", border:"1px solid #1a3a6e", borderRadius:"4px", padding:"12px 14px", marginBottom:"12px" }}>
                <div style={{ fontSize:"9px", color:"#4a7aaa", letterSpacing:"2px", marginBottom:"6px" }}>NEXT BEST ALTERNATIVE</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px", flexWrap:"wrap", gap:"5px" }}>
                  <div>
                    <div style={{ fontSize:"13px", color:"#c8d8f0", fontWeight:600 }}>{result.alternative.approach}</div>
                    <div style={{ fontSize:"10px", color:"#4a7aaa" }}>{result.alternative.farAuthority} | ~{result.alternative.timelineWeeks}wks | {result.alternative.adminBurden} burden</div>
                  </div>
                </div>
                <div style={{ fontSize:"10px", color:"#c8d8f0", fontStyle:"italic", marginBottom:"6px" }}>{result.alternative.whyConsider}</div>
                <div style={S.grid2}>
                  <div>{result.alternative.pros?.map((p,i)=><div key={i} style={{ fontSize:"9px", color:"#3aaa66", padding:"2px 0" }}>+ {p}</div>)}</div>
                  <div>{result.alternative.cons?.map((c,i)=><div key={i} style={{ fontSize:"9px", color:"#cc7733", padding:"2px 0" }}>- {c}</div>)}</div>
                </div>
              </div>
            )}

            {result.redFlags?.length>0 && (
              <div style={{ background:"#1a0a04", border:"1px solid #cc7733", borderRadius:"4px", padding:"12px 14px" }}>
                <div style={{ fontSize:"9px", color:"#cc7733", letterSpacing:"2px", marginBottom:"6px" }}>! VERIFY BEFORE PROCEEDING</div>
                {result.redFlags.map((f,i)=><div key={i} style={{ fontSize:"10px", color:"#c8d8f0", padding:"3px 0" }}>{i+1}. {f}</div>)}
              </div>
            )}
          </div>
        )}
    </div>
  );
}

function DocumentReview({ intake, initialDocType }) {
  const [docType, setDocType] = useState(initialDocType || "SOW");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);

  const ctx = intake
    ? "Requirement: "+(intake.reqTitle||"Unknown")+" | Center: "+(intake.center||"NASA")+" | Value: $"+((intake.value||0).toLocaleString())+" | Type: "+(intake.reqType||"Unknown")+" | Lane: "+(intake.contractType||"Unknown")
    : "No acquisition context loaded - review independently";

  async function extractText(f) {
    setExtracting(true); setError(""); setText("");
    try {
      const name = f.name.toLowerCase();
      if (name.endsWith(".txt") || name.endsWith(".md")) {
        const t = await f.text();
        setText(t); setExtracting(false); return t;
      }
      if (name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const buf = await f.arrayBuffer();
        const r = await mammoth.extractRawText({ arrayBuffer: buf });
        setText(r.value); setExtracting(false); return r.value;
      }
      if (name.endsWith(".pdf")) {
        // Send as base64 to API
        const buf = await f.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let b64 = "";
        for (let i = 0; i < bytes.length; i += 32768) {
          b64 += String.fromCharCode(...bytes.subarray(i, i + 32768));
        }
        const b64str = btoa(b64);
        setText("__PDF__:" + b64str);
        setExtracting(false);
        return "__PDF__:" + b64str;
      }
      setError("Unsupported file type. Upload .docx, .pdf, or .txt");
      setExtracting(false); return null;
    } catch(e) {
      setError("Failed to read file: " + e.message);
      setExtracting(false); return null;
    }
  }

  async function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setResult(null); setError("");
    await extractText(f);
  }

  async function runReview() {
    if (!text) { setError("Upload a document first."); return; }
    setLoading(true); setResult(null); setError("");
    try {
      const promptFn = REVIEW_PROMPTS[docType];
      const systemPrompt = promptFn(ctx);
      let messages;
      if (text.startsWith("__PDF__:")) {
        const b64 = text.slice(8);
        messages = [{ role: "user", content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
          { type: "text", text: "Review this document per your instructions." }
        ]}];
      } else {
        messages = [{ role: "user", content: "Review this document:\n\n" + text.slice(0, 60000) }];
      }
      const apiKey = localStorage.getItem("cpas_api_key") || "";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, system: systemPrompt, messages })
      });
      let data;
      try { data = await res.json(); } catch(je) { throw new Error("API error " + res.status); }
      if (!res.ok) throw new Error(data?.error?.message || "API error " + res.status);
      const raw = data.content?.[0]?.text || "";
      const clean = (()=>{ let s=raw.trim(); if(s.startsWith("\u0060\u0060\u0060json")) s=s.slice(7); if(s.startsWith("\u0060\u0060\u0060")) s=s.slice(3); if(s.endsWith("\u0060\u0060\u0060")) s=s.slice(0,-3); return s.trim(); })()
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch(e) {
      setError("Review failed: " + e.message);
    }
    setLoading(false);
  }

  const DOC_TYPES = [
    { key:"SOW", label:"SOW / PWS / SOO" },
    { key:"JOFOC", label:"JOFOC / J&A" },
    { key:"IGCE", label:"IGCE" },
    { key:"CLAUSES", label:"Solicitation / Clauses" },
  ];

  const SEV_COLOR = { CRITICAL:"#cc3333", MAJOR:"#cc7733", MINOR:"#ccaa33", INFO:"#4a9eff" };
  const RATING_COLOR = { ACCEPTABLE:"#3aaa66", NEEDS_WORK:"#ccaa33", MAJOR_ISSUES:"#cc3333" };

  const inp = { background:"#08182e", border:"1px solid #1a3a6e", color:"#c8d8f0", padding:"8px 10px", borderRadius:"3px", fontSize:"11px", width:"100%", fontFamily:"IBM Plex Mono,monospace" };

  return (
    <div style={{ padding:"20px", maxWidth:"800px", margin:"0 auto" }}>
      <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"2px",marginBottom:"4px"}}>DOCUMENT REVIEW</div>
      <div style={{ fontSize:"18px", color:"#c8d8f0", fontWeight:700,marginBottom:"4px"}}>AI-Powered Acquisition Document Review</div>
      <div style={{ fontSize:"11px", color:"#4a7aaa",marginBottom:"20px"}}>FAR/NFS compliance check, completeness review, and issue flagging</div>

      {intake && (
        <div style={{ background:"#08182e", border:"1px solid #1a3a6e", borderRadius:"4px", padding:"10px 14px", marginBottom:"16px", fontSize:"10px", color:"#4a7aaa" }}>
          CONTEXT: {ctx}
        </div>
      )}

      <div style={{ marginBottom:"14px" }}>
        <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>DOCUMENT TYPE</div>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
          {DOC_TYPES.map(dt => (
            <button key={dt.key}
              style={{ background: docType===dt.key ? "#0d3a8a":"#08182e", border:"1px solid "+(docType===dt.key?"#4a9eff":"#1a3a6e"), color: docType===dt.key?"#7ec8ff":"#4a7aaa", padding:"6px 12px", cursor:"pointer", borderRadius:"3px", fontSize:"11px", letterSpacing:"1px" }}
              onClick={() => { setDocType(dt.key); setResult(null); }}>
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:"14px" }}>
        <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"1px",marginBottom:"6px"}}>UPLOAD DOCUMENT</div>
        <label style={{ display:"block", border:"2px dashed #1a3a6e", borderRadius:"4px", padding:"20px", textAlign:"center", cursor:"pointer", color:"#4a7aaa", fontSize:"11px" }}>
          {file ? (
            <span style={{ color:"#3aaa66" }}>v {file.name} ({(file.size/1024).toFixed(0)}KB) - {extracting?"Extracting text...":"Ready"}</span>
          ) : (
            <span>Click to upload .docx, .pdf, or .txt</span>
          )}
          <input type="file" accept=".docx,.pdf,.txt,.md" style={{ display:"none" }} onChange={handleFileChange} />
        </label>
      </div>

      {error && <div style={{ color:"#cc3333", fontSize:"11px", marginBottom:"12px", padding:"8px", border:"1px solid #cc3333", borderRadius:"3px" }}>{error}</div>}

      <button
        style={{ background: loading?"#0a1a3a":"#0d3a8a", border:"1px solid #4a9eff", color:"#7ec8ff", padding:"10px 20px", cursor: loading||!text||extracting?"not-allowed":"pointer", borderRadius:"3px", fontSize:"11px", letterSpacing:"1px", opacity: loading||!text||extracting?0.6:1,marginBottom:"20px"}}
        onClick={runReview}
        disabled={loading || !text || extracting}>
        {loading ? "... REVIEWING DOCUMENT" : "REVIEW DOCUMENT"}
      </button>

      {result && (
        <div style={{ animation:"slideIn .3s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px",marginBottom:"16px"}}>
            <div style={{ fontSize:"12px", letterSpacing:"2px", color:RATING_COLOR[result.overallRating]||"#c8d8f0", border:"1px solid "+RATING_COLOR[result.overallRating]||"#1a3a6e", padding:"4px 10px", borderRadius:"3px" }}>
              {result.overallRating?.replace("_"," ")}
            </div>
            <div style={{ fontSize:"11px", color:"#4a7aaa" }}>{result.docType}</div>
          </div>

          <div style={{ fontSize:"11px", color:"#c8d8f0", lineHeight:1.7, marginBottom:"16px", padding:"12px", background:"#08182e", border:"1px solid #1a3a6e", borderRadius:"4px" }}>
            {result.summary}
          </div>

          {result.findings?.length > 0 && (
            <div>
              <div style={{ fontSize:"10px", color:"#4a7aaa", letterSpacing:"2px",marginBottom:"10px"}}>
                FINDINGS ({result.findings.length}) -- {result.findings.filter(f=>f.severity==="CRITICAL").length} CRITICAL / {result.findings.filter(f=>f.severity==="MAJOR").length} MAJOR
              </div>
              {result.findings.map((f, i) => (
                <div key={i} style={{ marginBottom:"10px", border:"1px solid "+SEV_COLOR[f.severity]||"#1a3a6e"+"22", borderLeft:"3px solid "+(SEV_COLOR[f.severity]||"#1a3a6e"), borderRadius:"3px", padding:"10px 12px", background:"#08182e" }}>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center",marginBottom:"6px"}}>
                    <span style={{ fontSize:"9px", color:SEV_COLOR[f.severity], letterSpacing:"1px", border:"1px solid "+SEV_COLOR[f.severity], padding:"2px 6px", borderRadius:"2px" }}>{f.severity}</span>
                    <span style={{ fontSize:"10px", color:"#4a9eff", letterSpacing:"1px" }}>{f.category}</span>
                  </div>
                  <div style={{ fontSize:"11px", color:"#c8d8f0", marginBottom:"6px", lineHeight:1.6 }}>{f.issue}</div>
                  <div style={{ fontSize:"10px", color:"#3aaa66", lineHeight:1.5 }}>
                    <span style={{ color:"#2a7a4a" }}>RECOMMENDATION: </span>{f.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// WORKFLOW SYSTEM
// ═══════════════════════════════════════════════════════════════════

const WF_API = "/.netlify/functions/workflow";

async function wfFetch(path, method="GET", body=null) {
  const opts = { method, headers:{"Content-Type":"application/json"} };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(WF_API + path, opts);
  return r.json();
}

// Status badge colors
const STATUS_COLOR = {
  in_review: "#2a6aaa",
  approved:  "#1a7a3a",
  returned:  "#a04010",
  pending:   "#555",
};
const STATUS_LABEL = {
  in_review: "IN REVIEW",
  approved:  "APPROVED",
  returned:  "RETURNED",
  pending:   "PENDING",
};



// ── Doc Quality Check Button ──────────────────────────────────────
// Runs AI review of generated doc against required elements
function DocQualityBtn({ docType, content }) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const DOC_CRITERIA = {
    JOFOC: ["All 11 FAR 6.303-2 elements present","Statutory authority cited (FAR 6.302-X)","Specific facts demonstrating authority applies","Market research documented","Anticipated cost fair and reasonable","Efforts to obtain competition described","Sources that expressed interest listed","Actions to remove future barriers included","Signature block appropriate for dollar threshold"],
    ACQ_PLAN: ["FAR 7.105 required elements covered","Contract type justified","Competition strategy documented","Milestones and schedule included","Small business strategy addressed","Market research summarized","Funding identified"],
    PNM: ["FAR 15.406-3 elements present","Proposed vs. negotiated positions documented","Basis for fair and reasonable determination","Profit/fee analysis if applicable","Contracting officer signature block"],
    MARKET_RESEARCH: ["FAR Part 10 methodology described","Sources researched identified","Commercial availability assessed","Industry standards reviewed","Conclusions and recommendation included"],
    SOURCES_SOUGHT: ["Requirement description adequate","Capabilities sought defined","Response instructions provided","Government not committed to award stated","NAICS and size standard listed"],
  };

  async function runCheck() {
    setChecking(true); setResult(null);
    const criteria = DOC_CRITERIA[docType] || ["Document is complete","All required sections present","Regulatory citations accurate","Factual basis adequate"];
    const apiKey = localStorage.getItem("cpas_api_key") || "";
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{ role: "user", content:
            "Review this " + docType + " document for quality and completeness. " +
            "Check each criterion and respond ONLY with a JSON array, no other text:\n" +
            JSON.stringify(criteria.map(c => ({ criterion: c, pass: false, note: "" }))) +
            "\n\nFor each item set pass:true/false and note:one short sentence.\n\nDocument:\n" + content.slice(0, 4000)
          }]
        })
      });
      const data = await resp.json();
      const raw = data?.content?.[0]?.text || "[]";
      const cleaned = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch(e) {
      setResult([{ criterion: "Error", pass: false, note: e.message }]);
    }
    setChecking(false);
  }

  const passCount = result ? result.filter(r=>r.pass).length : 0;
  const total = result ? result.length : 0;

  return (
    <>
      <button
        style={{background:"#1a1a3a",border:"1px solid #3a3a8a",color:"#8a8aff",
                padding:"5px 14px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:"bold"}}
        onClick={()=>{ setOpen(true); if(!result) runCheck(); }}>
        QC CHECK
      </button>
      {open && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#0a1a3a",border:"1px solid #2a4a7a",borderRadius:8,width:500,maxWidth:"95vw",maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #1a2a4a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{color:"#8a8aff",fontWeight:"bold",fontSize:12}}>QC CHECK — {docType}</span>
                {result && <span style={{color: passCount===total?"#4aba6a":"#f0a050", fontSize:11, marginLeft:10}}>{passCount}/{total} passed</span>}
              </div>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:"#4a6a8a",fontSize:18,cursor:"pointer"}}>×</button>
            </div>
            <div style={{flex:1,overflow:"auto",padding:16}}>
              {checking && <div style={{color:"#4a6a8a",textAlign:"center",padding:30}}>Analyzing document...</div>}
              {result && result.map((r,i) => (
                <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid #0d1f3c"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,marginTop:2,
                                background:r.pass?"#1a7a3a":"#7a2a0a",
                                display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>
                    {r.pass?"✓":"✗"}
                  </div>
                  <div>
                    <div style={{color:r.pass?"#4aba6a":"#f07050",fontSize:11,fontWeight:"bold"}}>{r.criterion}</div>
                    {r.note && <div style={{color:"#8ab0d0",fontSize:10,marginTop:2}}>{r.note}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:"12px 16px",borderTop:"1px solid #1a2a4a",display:"flex",gap:8}}>
              <button onClick={runCheck} disabled={checking}
                style={{background:"#1a1a3a",border:"1px solid #3a3a8a",color:"#8a8aff",
                        padding:"7px 14px",borderRadius:4,cursor:"pointer",fontSize:11}}>
                {checking ? "CHECKING..." : "RE-CHECK"}
              </button>
              <button onClick={()=>setOpen(false)}
                style={{background:"#0d1f3c",border:"1px solid #1a2a4a",color:"#6a8ab0",
                        padding:"7px 14px",borderRadius:4,cursor:"pointer",fontSize:11}}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ── Inline Submit Button (used in StepWorkspace) ──────────────────
function SubmitButton({ docType, content, intake }) {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  if (submitted) return (
    <div style={{background:"#0a3a1a",border:"1px solid #1a7a3a",borderRadius:4,
                 padding:"5px 12px",fontSize:10,color:"#4aba6a",display:"inline-block"}}>
      ✓ SUBMITTED #{submitted.slice(-6).toUpperCase()}
    </div>
  );

  return (
    <>
      <button style={{background:"#0a2a1a",border:"1px solid #1a6a3a",color:"#4aba6a",
                      padding:"5px 14px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:"bold"}}
        onClick={()=>setShowModal(true)}>
        SUBMIT
      </button>
      {showModal && (
        <SubmitModal docType={docType} content={content} intake={intake}
          onClose={()=>setShowModal(false)}
          onSubmitted={(id)=>{ setSubmitted(id); setShowModal(false); }} />
      )}
    </>
  );
}


// ── Submit Modal ──────────────────────────────────────────────────
function SubmitModal({ docType, content, intake, onClose, onSubmitted }) {
  const [roles, setRoles] = useState({ co: intake?.coEmail||"", techRep: intake?.techRepEmail||"", ca:"", hca:"", supervisor:"" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const value = parseFloat(intake?.value)||0;
  const needsCA  = (docType==="JOFOC"||docType==="ACQ_PLAN") && value > 900000;
  const needsHCA = (docType==="JOFOC"||docType==="ACQ_PLAN") && value > 20000000;

  async function submit() {
    if (!roles.co) { setErr("CO email is required."); return; }
    if (!roles.techRep) { setErr("Tech Rep email is required."); return; }
    setSubmitting(true); setErr("");
    const res = await wfFetch("/submit","POST",{
      docType, content, intake,
      title: intake?.reqTitle,
      value: intake?.value,
      center: intake?.center,
      submittedBy: roles.co || intake?.coEmail || "",
      roles,
    });
    setSubmitting(false);
    if (res.ok) { onSubmitted(res.id); }
    else { setErr(res.error || "Submission failed."); }
  }

  const inp = (ph, key) => (
    <input placeholder={ph} value={roles[key]||""}
      onChange={e=>setRoles(r=>({...r,[key]:e.target.value}))}
      style={{width:"100%",background:"#0d1f3c",border:"1px solid #2a4a7a",color:"#c8d8f0",
              padding:"7px 10px",borderRadius:4,fontSize:12,boxSizing:"border-box",marginBottom:8}} />
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#0a1a3a",border:"1px solid #2a4a7a",borderRadius:8,padding:28,width:420,maxWidth:"95vw"}}>
        <div style={{color:"#4a9eff",fontWeight:"bold",fontSize:14,marginBottom:4}}>SUBMIT FOR REVIEW</div>
        <div style={{color:"#6a8ab0",fontSize:11,marginBottom:20}}>{docType} — {intake?.reqTitle}</div>

        <div style={{color:"#8ab0d0",fontSize:11,marginBottom:4}}>CONTRACTING OFFICER EMAIL *</div>
        {inp("co@nasa.gov","co")}
        <div style={{color:"#8ab0d0",fontSize:11,marginBottom:4}}>TECH REP EMAIL *</div>
        {inp("techrep@nasa.gov","techRep")}
        {needsCA && (<>
          <div style={{color:"#8ab0d0",fontSize:11,marginBottom:4}}>COMPETITION ADVOCATE EMAIL</div>
          {inp("ca@nasa.gov","ca")}
        </>)}
        {needsHCA && (<>
          <div style={{color:"#8ab0d0",fontSize:11,marginBottom:4}}>HEAD OF CONTRACTING ACTIVITY EMAIL</div>
          {inp("hca@nasa.gov","hca")}
        </>)}
        {docType!=="JOFOC" && docType!=="ACQ_PLAN" && (<>
          <div style={{color:"#8ab0d0",fontSize:11,marginBottom:4}}>BRANCH CHIEF / SUPERVISOR EMAIL</div>
          {inp("supervisor@nasa.gov","supervisor")}
        </>)}

        {err && <div style={{color:"#f07050",fontSize:11,marginBottom:8}}>{err}</div>}

        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={submit} disabled={submitting}
            style={{flex:1,background:"#1a4a8a",border:"1px solid #2a6aaa",color:"#4a9eff",
                    padding:"9px",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:"bold"}}>
            {submitting ? "SUBMITTING..." : "SUBMIT"}
          </button>
          <button onClick={onClose}
            style={{flex:1,background:"#0d1f3c",border:"1px solid #2a4a7a",color:"#6a8ab0",
                    padding:"9px",borderRadius:4,cursor:"pointer",fontSize:12}}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Chain Visual ─────────────────────────────────────────
function ChainView({ chain, currentStep }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6,margin:"12px 0"}}>
      {chain.map((step,i) => {
        const isCurrent = i === currentStep && step.status === "pending";
        const color = step.status==="approved" ? "#1a7a3a"
                    : step.status==="returned"  ? "#a04010"
                    : isCurrent                 ? "#2a6aaa"
                    : "#333";
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{background:color,border:"1px solid "+color,borderRadius:4,
                         padding:"4px 10px",fontSize:10,color:"#fff",whiteSpace:"nowrap"}}>
              {step.role}
              {step.status==="approved" && " ✓"}
              {step.status==="returned" && " ✗"}
              {isCurrent && " ◀"}
            </div>
            {i < chain.length-1 && <div style={{color:"#444",fontSize:10}}>→</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Reviewer Dashboard ────────────────────────────────────────────
function ReviewerDashboard({ onClose }) {
  const [email, setEmail] = useState(() => localStorage.getItem("cpas_reviewer_email")||"");
  const [emailInput, setEmailInput] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // {id, type:"approve"|"return"}
  const [comments, setComments] = useState("");
  const [acting, setActing] = useState(false);

  async function loadSubs(em) {
    setLoading(true);
    const data = await wfFetch("/list?email="+encodeURIComponent(em));
    setSubmissions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function login() {
    if (!emailInput.includes("@")) return;
    localStorage.setItem("cpas_reviewer_email", emailInput);
    setEmail(emailInput);
    loadSubs(emailInput);
  }

  useEffect(()=>{ if(email) loadSubs(email); },[email]);

  async function doAction() {
    setActing(true);
    await wfFetch("/action/"+action.id,"POST",{ action:action.type, email, comments });
    setAction(null); setComments(""); setActing(false);
    setSelected(null);
    loadSubs(email);
  }

  const row = (sub) => {
    const myStep = sub.chain[sub.currentStep];
    const isMyTurn = myStep?.email === email && myStep?.status === "pending";
    return (
      <div key={sub.id} onClick={()=>setSelected(sub===selected?null:sub)}
        style={{background: selected===sub?"#0d2040":"#080f1e",border:"1px solid "+(isMyTurn?"#2a6aaa":"#1a2a4a"),
                borderRadius:6,padding:"12px 14px",marginBottom:8,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <span style={{color:"#4a9eff",fontSize:11,fontWeight:"bold"}}>{sub.docType}</span>
            <span style={{color:"#6a8ab0",fontSize:10,marginLeft:8}}>{sub.center}</span>
            {isMyTurn && <span style={{background:"#1a4a8a",color:"#4a9eff",fontSize:9,padding:"1px 6px",borderRadius:10,marginLeft:8}}>YOUR TURN</span>}
          </div>
          <span style={{background:STATUS_COLOR[sub.status]+"33",color:STATUS_COLOR[sub.status],
                        fontSize:9,padding:"2px 8px",borderRadius:10,border:"1px solid "+STATUS_COLOR[sub.status]}}>
            {STATUS_LABEL[sub.status]}
          </span>
        </div>
        <div style={{color:"#c8d8f0",fontSize:12,marginTop:4}}>{sub.title}</div>
        <div style={{color:"#4a6a8a",fontSize:10,marginTop:2}}>
          ${(sub.value||0).toLocaleString()} · Submitted {new Date(sub.submittedAt).toLocaleDateString()}
        </div>

        {selected===sub && (
          <div style={{marginTop:12,borderTop:"1px solid #1a2a4a",paddingTop:12}}>
            <ChainView chain={sub.chain} currentStep={sub.currentStep} />

            {sub.history?.length > 0 && (
              <div style={{marginTop:8}}>
                <div style={{color:"#6a8ab0",fontSize:10,marginBottom:4}}>HISTORY</div>
                {sub.history.map((h,i)=>(
                  <div key={i} style={{color:"#4a6a8a",fontSize:10,marginBottom:2}}>
                    {new Date(h.at).toLocaleString()} — <span style={{color:"#8ab0d0"}}>{h.action.toUpperCase()}</span> by {h.role||h.by}
                    {h.comments && <span style={{color:"#a08060"}}> — "{h.comments}"</span>}
                  </div>
                ))}
              </div>
            )}

            {isMyTurn && sub.status==="in_review" && (
              <div style={{marginTop:12,display:"flex",gap:8}}>
                <button onClick={e=>{e.stopPropagation();setAction({id:sub.id,type:"approve"});}}
                  style={{background:"#0a3a1a",border:"1px solid #1a7a3a",color:"#4aba6a",
                          padding:"7px 16px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:"bold"}}>
                  ✓ APPROVE
                </button>
                <button onClick={e=>{e.stopPropagation();setAction({id:sub.id,type:"return"});}}
                  style={{background:"#3a1a0a",border:"1px solid #a04010",color:"#f07050",
                          padding:"7px 16px",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:"bold"}}>
                  ✗ RETURN
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#0a1a3a",border:"1px solid #2a4a7a",borderRadius:8,width:560,maxWidth:"95vw",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid #1a2a4a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#4a9eff",fontWeight:"bold",fontSize:13}}>REVIEW DASHBOARD</div>
            {email && <div style={{color:"#6a8ab0",fontSize:10,marginTop:2}}>{email}</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {email && <button onClick={()=>{setEmail("");localStorage.removeItem("cpas_reviewer_email");}}
              style={{background:"none",border:"1px solid #1a2a4a",color:"#6a8ab0",padding:"4px 10px",borderRadius:4,cursor:"pointer",fontSize:10}}>
              SWITCH USER
            </button>}
            <button onClick={onClose}
              style={{background:"none",border:"none",color:"#4a6a8a",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
        </div>

        {/* Login or list */}
        <div style={{flex:1,overflow:"auto",padding:20}}>
          {!email ? (
            <div>
              <div style={{color:"#8ab0d0",fontSize:12,marginBottom:12}}>Enter your NASA email to see pending reviews and submissions.</div>
              <input placeholder="your.name@nasa.gov" value={emailInput}
                onChange={e=>setEmailInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&login()}
                style={{width:"100%",background:"#0d1f3c",border:"1px solid #2a4a7a",color:"#c8d8f0",
                        padding:"9px 12px",borderRadius:4,fontSize:12,boxSizing:"border-box",marginBottom:10}} />
              <button onClick={login}
                style={{width:"100%",background:"#1a4a8a",border:"1px solid #2a6aaa",color:"#4a9eff",
                        padding:"9px",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:"bold"}}>
                VIEW MY QUEUE
              </button>
            </div>
          ) : loading ? (
            <div style={{color:"#4a6a8a",textAlign:"center",padding:40}}>Loading...</div>
          ) : submissions.length === 0 ? (
            <div style={{color:"#4a6a8a",textAlign:"center",padding:40}}>No documents in your queue.</div>
          ) : (
            submissions.map(row)
          )}
        </div>

        {/* Action modal */}
        {action && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8}}>
            <div style={{background:"#0a1a3a",border:"1px solid #2a4a7a",borderRadius:8,padding:24,width:360}}>
              <div style={{color: action.type==="approve"?"#4aba6a":"#f07050",fontWeight:"bold",fontSize:13,marginBottom:12}}>
                {action.type==="approve" ? "APPROVE DOCUMENT" : "RETURN DOCUMENT"}
              </div>
              <textarea placeholder={action.type==="return" ? "Reason for return (required)" : "Comments (optional)"}
                value={comments} onChange={e=>setComments(e.target.value)} rows={4}
                style={{width:"100%",background:"#0d1f3c",border:"1px solid #2a4a7a",color:"#c8d8f0",
                        padding:"8px",borderRadius:4,fontSize:12,boxSizing:"border-box",resize:"vertical",marginBottom:12}} />
              <div style={{display:"flex",gap:8}}>
                <button onClick={doAction} disabled={acting||(action.type==="return"&&!comments.trim())}
                  style={{flex:1,background:action.type==="approve"?"#0a3a1a":"#3a1a0a",
                          border:"1px solid "+(action.type==="approve"?"#1a7a3a":"#a04010"),
                          color:action.type==="approve"?"#4aba6a":"#f07050",
                          padding:"9px",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:"bold",
                          opacity:(acting||(action.type==="return"&&!comments.trim()))?0.5:1}}>
                  {acting ? "..." : action.type==="approve" ? "CONFIRM APPROVE" : "CONFIRM RETURN"}
                </button>
                <button onClick={()=>{setAction(null);setComments("");}}
                  style={{flex:1,background:"#0d1f3c",border:"1px solid #2a4a7a",color:"#6a8ab0",
                          padding:"9px",borderRadius:4,cursor:"pointer",fontSize:12}}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function CPAS() {
  const [screen, setScreen] = useState("INTAKE");
  const [intake, setIntake] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [activeStep, setActiveStep] = useState(null);
  const [showReviewer, setShowReviewer] = useState(false);

  useEffect(()=>{
    try {
      const s = localStorage.getItem("cpas_v5_state");
      if (s) {
        const { intake:i, cs } = JSON.parse(s);
        if (i) { setIntake(i); setRoadmap(buildRoadmap(i)); setCompletedSteps(new Set(cs||[])); setScreen("ROADMAP"); }
      }
    } catch(e){}
  },[]);

  function save(ni, nc) {
    try { localStorage.setItem("cpas_v5_state", JSON.stringify({ intake:ni||intake, cs:Array.from(nc||completedSteps) })); } catch(e){}
  }

  function onIntakeComplete(data) {
    const rm = buildRoadmap(data);
    setIntake(data); setRoadmap(rm); setScreen("ROADMAP"); save(data, new Set());
  }

  function onUseRecommendation(suggestions, extracted) {
    const prefill = {
      reqTitle: extracted.title || "",
      value: suggestions.value || 0,
      reqType: suggestions.reqType || "SERVICES",
      isCommercial: suggestions.isCommercial || "TBD",
      competitionStrategy: suggestions.competitionStrategy || "FULL_OPEN",
      contractType: suggestions.contractType || "FFP",
      naics: extracted.naics || "",
      psc: extracted.psc || "",
      center: intake?.center || "",
      isRecompete: "NO",
    };
    setScreen("INTAKE");
    setTimeout(() => {
      window.__cpas_prefill = prefill;
      window.dispatchEvent(new Event("cpas_prefill"));
    }, 100);
  }

  function toggleStep(id) {
    const next = new Set(completedSteps);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompletedSteps(next); save(null, next);
  }

  function completeStep(id) {
    const next = new Set(completedSteps);
    next.add(id); setCompletedSteps(next); save(null, next);
  }

  function startOver() {
    localStorage.removeItem("cpas_v5_state");
    setIntake(null); setRoadmap(null); setCompletedSteps(new Set()); setActiveStep(null); setScreen("INTAKE");
  }

  const totalSteps = roadmap?.phases.reduce((a,p)=>a+p.steps.length,0)||0;
  const doneCount = completedSteps.size;
  const pct = totalSteps ? Math.round(doneCount/totalSteps*100) : 0;

  return (
    <>
    <div style={S.app}>
      <style>{"\n        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700');\n        @keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}\n        button:hover{opacity:.85;} *{box-sizing:border-box;}\n        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#040d1a} ::-webkit-scrollbar-thumb{background:#1a3a6e;border-radius:3px}\n      "}</style>

      {/* HEADER */}
      <div style={S.hdr}>
        <div style={S.logo}>CPAS</div>
        <div style={S.badge}>v5 . GUIDED</div>
        <div style={{ flex:1 }}/>
        <button style={{...S.startOver}} onClick={()=>setScreen(screen==="ROUTE"?"INTAKE":"ROUTE")}>
          {screen==="ROUTE" ? "< BACK" : "ROUTE ADVISOR"}</button>
        <button style={{...S.startOver}} onClick={()=>setScreen(screen==="REVIEW"?"INTAKE":"REVIEW")}>
          {screen==="REVIEW" ? "< BACK" : "DOC REVIEW"}</button>
        <button style={{...S.startOver}} onClick={()=>setScreen(screen==="NEAR"?"INTAKE":"NEAR")}>
          {screen==="NEAR" ? "< BACK" : "NEAR FILING"}
        </button>
        <button style={{...S.startOver, background:"#0a2a1a", borderColor:"#1a6a3a", color:"#4aba6a"}}
          onClick={()=>setShowReviewer(true)}>
          REVIEW QUEUE
        </button>
        {screen==="ROADMAP" && <>
          <div style={{ fontSize:"10px", color:C.muted, letterSpacing:"1px" }}>{pct}% . {doneCount}/{totalSteps} STEPS</div>
          <div style={{...S.prgBar, marginLeft:"10px"}}><div style={S.prgFill(pct)}/></div>
          <button style={{...S.startOver, marginLeft:"8px"}} onClick={()=>setScreen("REVIEW")}>DOC REVIEW</button>
          <button style={{...S.startOver, marginLeft:"8px"}} onClick={startOver}>NEW ACQUISITION</button>
        </>}
      </div>

      {screen === "INTAKE" && <div style={S.main}><IntakeWizard onComplete={onIntakeComplete}/></div>}

      {screen === "ROADMAP" && roadmap && (
        <div style={{ ...S.main, paddingRight: activeStep ? "604px" : "24px" }}>
          <div style={S.sumBar}>
            <div style={S.sumItem}><span style={S.sumLabel}>REQUIREMENT</span><span style={S.sumVal}>{intake.reqTitle}</span></div>
            <div style={S.sumItem}><span style={S.sumLabel}>VALUE</span><span style={S.sumVal}>${(intake.value||0).toLocaleString()}</span></div>
            <div style={S.sumItem}><span style={S.sumLabel}>CENTER</span><span style={S.sumVal}>{intake.center}</span></div>
            <div style={S.sumItem}><span style={S.sumLabel}>CONTRACT TYPE</span><span style={S.sumVal}>{intake.contractType}</span></div>
            <div style={S.sumItem}><span style={S.sumLabel}>COMPETITION</span><span style={S.sumVal}>{intake.competitionStrategy?.replace(/_/g," ")}</span></div>
          </div>
          <div style={S.laneTag}>! {getLaneLabel(roadmap.lane)}</div>
          <div style={{ fontSize:"10px", color:C.muted, letterSpacing:"1px",marginBottom:"16px"}}>
            CLICK ANY STEP TO OPEN WORKSPACE - {roadmap.phases.length} PHASES . {totalSteps} STEPS
          </div>
          {roadmap.phases.map(phase=>(
            <PhaseCard key={phase.id} phase={phase} completedSteps={completedSteps}
              onStepClick={setActiveStep} onToggle={toggleStep} />
          ))}
          {pct===100 && (
            <div style={{ marginTop:"20px", padding:"24px", background:"#041a0e", border:"1px solid "+C.green, borderRadius:"4px", textAlign:"center" }}>
              <div style={{ fontSize:"22px",marginBottom:"6px"}}>?</div>
              <div style={{ color:C.green, fontWeight:"700", letterSpacing:"2px" }}>ACQUISITION COMPLETE</div>
              <div style={{ color:C.dim, fontSize:"11px", marginTop:"6px" }}>All {totalSteps} steps completed for {intake.reqTitle}.</div>
            </div>
          )}
        </div>
      )}

      {activeStep && (
        <StepWorkspace
          step={activeStep}
          intake={intake}
          roadmap={roadmap}
          isDone={completedSteps.has(activeStep.id)}
          onClose={()=>setActiveStep(null)}
          onComplete={completeStep}
        />
      )}

      {screen === "ROUTE" && (
        <div style={S.main}>
          <RouteAdvisor onUseRecommendation={onUseRecommendation} />
        </div>
      )}

      {screen === "REVIEW" && (
        <div style={S.main}>
          <DocumentReview intake={intake} />
        </div>
      )}

      {screen === "NEAR" && (
        <div style={S.main}>
          <NEARPackage intake={intake} roadmap={roadmap} />
        </div>
      )}
    </div>
    {showReviewer && <ReviewerDashboard onClose={()=>setShowReviewer(false)} />}
    </>
  );
}
export default CPAS;
