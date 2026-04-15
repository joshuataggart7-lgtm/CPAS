// CPAS RAG Document Generator
// Retrieves relevant regulatory chunks from Supabase KB, then generates
// document with Claude grounded in current FAR/NFS text
// POST { docType, intake, query_terms }

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Regulatory search terms by document type
const DOC_QUERY_TERMS = {
  JOFOC:       ["6.302", "6.103", "6.104", "sole source", "other than full and open", "JOFOC", "justification", "1806.3"],
  ACQ_PLAN:    ["acquisition plan", "1807.14", "procurement strategy", "PSM", "1807.11"],
  PNM:         ["15.406-3", "price negotiation", "cost analysis", "price reasonableness"],
  ANOSCA:      ["1805.303", "1805.302", "ANOSCA", "public announcement", "NPA", "PCD 25-16"],
  RESPONSIBILITY: ["9.105", "responsibility determination", "financial capability", "past performance"],
  MARKET_RESEARCH: ["10.001", "market research", "sources sought", "industry survey"],
  SOURCES_SOUGHT: ["5.207", "sources sought", "synopsis", "market research"],
  QASP:        ["1846.408", "quality assurance", "surveillance", "performance standards"],
  IGCE:        ["independent government cost estimate", "IGCE", "basis of estimate"],
  COR_LETTER:  ["1801.602", "COR", "contracting officer representative", "FAC-COR"],
  CLAUSE_MATRIX: ["52.212", "1812.301", "clause", "commercial items", "prescription"],
  FO_EXCEPTION: ["16.505", "fair opportunity", "task order", "exception"],
  CLOSEOUT:    ["4.804", "closeout", "final payment", "completion"],
};

// Priority doc types for each document — what regulatory sources matter most
const DOC_PRIORITY_TYPES = {
  JOFOC:       "RFO_FAR,NFS,NFS_CG,PCD,PIC",
  ACQ_PLAN:    "NFS,NFS_CG,RFO_FAR,PCD",
  PNM:         "RFO_FAR,NFS,NFS_CG",
  ANOSCA:      "NFS,NFS_CG,PIC,PCD",
  RESPONSIBILITY: "RFO_FAR,NFS",
  MARKET_RESEARCH: "RFO_FAR,NFS,NFS_CG",
  SOURCES_SOUGHT: "RFO_FAR,NFS",
  QASP:        "NFS,NFS_CG,RFO_FAR",
  IGCE:        "NFS,NFS_CG,RFO_FAR",
  COR_LETTER:  "NFS,NFS_CG",
  CLAUSE_MATRIX: "NFS,RFO_FAR,NFS_CG,PCD",
  FO_EXCEPTION: "RFO_FAR,NFS",
  CLOSEOUT:    "RFO_FAR,NFS",
};

async function fetchKBChunks(terms, docTypes, limit = 8) {
  const headers = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
  const base = `${SB_URL}/rest/v1/cpas_regulatory_docs`;
  const typeFilter = docTypes ? `&doc_type=in.(${docTypes})` : "";
  const chunks = new Map();

  for (const term of terms.slice(0, 4)) {
    const like = `%${term.replace(/[%_]/g, "")}%`;
    const url = `${base}?select=id,source,doc_type,section,title,content`
      + `&or=(section.ilike.${encodeURIComponent(like)},keywords.ilike.${encodeURIComponent(like)},content.ilike.${encodeURIComponent(like)})`
      + typeFilter
      + `&limit=${Math.ceil(limit / terms.slice(0,4).length) + 2}`;

    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        for (const r of data) {
          if (!chunks.has(r.id)) chunks.set(r.id, r);
        }
      }
    } catch(e) { /* continue */ }
  }

  // Sort by doc type priority and return top N
  const PRIORITY = { RFO_FAR: 6, NFS: 5, NFS_CG: 4, PIC: 3, PN: 3, PCD: 2 };
  return [...chunks.values()]
    .sort((a, b) => (PRIORITY[b.doc_type] || 0) - (PRIORITY[a.doc_type] || 0))
    .slice(0, limit);
}

function buildRegulatoryContext(chunks) {
  if (!chunks.length) return "";
  const sections = chunks.map(c => {
    const ref = [c.doc_type, c.source, c.section].filter(Boolean).join(" › ");
    return `[${ref}]\n${c.content.substring(0, 800)}`;
  });
  return `\n\n═══════════════════════════════════════\nCURRENT REGULATORY TEXT FROM NASA KB\n(Base ALL citations and requirements on this text)\n═══════════════════════════════════════\n${sections.join("\n\n---\n")}\n═══════════════════════════════════════\n\nIMPORTANT: Use only the regulatory citations shown above. Do not cite section numbers not present in the provided text. Where the KB text conflicts with training knowledge, the KB text takes precedence as it reflects current NASA policy.\n`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  if (!ANTHROPIC_KEY) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }) };
  }

  try {
    const { docType, prompt, systemPrompt, intake } = JSON.parse(event.body || "{}");

    if (!prompt) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "prompt required" }) };

    // Step 1 — Fetch relevant regulatory chunks
    const terms = DOC_QUERY_TERMS[docType] || [docType?.toLowerCase() || "acquisition"];
    const docTypes = DOC_PRIORITY_TYPES[docType] || "RFO_FAR,NFS,NFS_CG,PCD";
    const chunks = await fetchKBChunks(terms, docTypes);

    // Step 2 — Build regulatory context block
    const regContext = buildRegulatoryContext(chunks);

    // Step 3 — Inject regulatory context into the prompt
    const augmentedPrompt = prompt + regContext;

    const baseSystem = systemPrompt || "You are an expert NASA Contracting Officer assistant. Generate professional, complete procurement documents compliant with FAR and NFS. CRITICAL: Always use bracketed placeholders like [Contract No.], [Date], [Insert Name] for any specific document numbers, dates, names, or identifiers that must be filled in by the CO — never fabricate specific numbers, dates, or identifiers.";
    const ragSystem = baseSystem + "\n\nCRITICAL REGULATORY GROUNDING: The prompt includes current regulatory text extracted from NASA's live procurement knowledge base. This text reflects the most current version of the FAR (RFO FAR March 2026), NFS (April 2026), and active PCDs. You MUST base all citations, requirements, thresholds, and procedures on this provided text. Do not rely on training knowledge for specific section numbers, thresholds, or clause prescriptions — use only what is in the provided regulatory context.";

    // Step 4 — Call Claude with augmented prompt
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 6000,
        system: ragSystem,
        messages: [{ role: "user", content: augmentedPrompt }],
      }),
    });

    const data = await res.json();
    if (data.error) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: data.error.message }) };
    }

    const text = data.content?.[0]?.text || "Generation failed.";

    // Return generated text + sources used for transparency
    const sources = chunks.map(c => `${c.doc_type}: ${c.source}${c.section ? " §" + c.section : ""}`);
    const uniqueSources = [...new Set(sources)];

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        text,
        sources_used: uniqueSources,
        chunks_used: chunks.length,
      }),
    };

  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
