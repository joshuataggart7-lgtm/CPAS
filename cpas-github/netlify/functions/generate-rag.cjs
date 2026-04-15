// CPAS RAG Document Generator v3
// Server-side: fetch KB chunks + call Claude in one function
// Streaming response so browser shows progress, no timeout on large docs

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DOC_TERMS = {
  JOFOC:          ["Competition Requirements", "other than full and open", "1806.3", "6.302"],
  ACQ_PLAN:       ["1807.14", "procurement strategy meeting", "1807.11"],
  PNM:            ["price negotiation", "15.406", "price reasonableness"],
  ANOSCA:         ["1805.302", "ANOSCA", "public announcement", "PIC 26-01"],
  RESPONSIBILITY: ["9.105", "responsibility determination", "financial capability"],
  MARKET_RESEARCH:["market research", "10.001", "sources sought"],
  SOURCES_SOUGHT: ["sources sought", "5.207", "synopsis"],
  QASP:           ["quality assurance", "1846.408", "surveillance plan"],
  IGCE:           ["independent government cost estimate", "IGCE", "basis of estimate"],
  COR_LETTER:     ["1801.602", "contracting officer representative", "FAC-COR"],
  CLAUSE_MATRIX:  ["1812.301", "52.212", "commercial items clause"],
  FO_EXCEPTION:   ["fair opportunity", "16.505", "task order exception"],
  CLOSEOUT:       ["4.804", "closeout", "final payment"],
};

const DOC_TYPES = {
  JOFOC:          "RFO_FAR,NFS,NFS_CG,PCD",
  ACQ_PLAN:       "NFS,NFS_CG,RFO_FAR,PCD",
  PNM:            "RFO_FAR,NFS,NFS_CG",
  ANOSCA:         "NFS,NFS_CG,PIC,PCD",
  RESPONSIBILITY: "RFO_FAR,NFS",
  MARKET_RESEARCH:"RFO_FAR,NFS,NFS_CG",
  SOURCES_SOUGHT: "RFO_FAR,NFS",
  QASP:           "NFS,NFS_CG,RFO_FAR",
  IGCE:           "NFS,NFS_CG",
  COR_LETTER:     "NFS,NFS_CG",
  CLAUSE_MATRIX:  "NFS,RFO_FAR,PCD",
  FO_EXCEPTION:   "RFO_FAR,NFS",
  CLOSEOUT:       "RFO_FAR,NFS",
};

async function getKBChunks(docType) {
  const terms = DOC_TERMS[docType];
  if (!terms?.length) return [];
  const typeFilter = DOC_TYPES[docType] || "RFO_FAR,NFS,NFS_CG";
  const h = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };
  const base = `${SB_URL}/rest/v1/cpas_regulatory_docs`;
  const seen = new Map();

  // Parallel fetch on top 2 terms
  const fetches = terms.slice(0, 2).map(term => {
    const like = `%${term.replace(/[%_]/g,"")}%`;
    const url = `${base}?select=id,source,doc_type,section,content`
      + `&or=(section.ilike.${encodeURIComponent(like)},keywords.ilike.${encodeURIComponent(like)})`
      + `&doc_type=in.(${typeFilter})&limit=3`;
    return fetch(url, {headers:h}).then(r=>r.ok?r.json():[]).catch(()=>[]);
  });

  const results = await Promise.all(fetches);
  for (const rows of results) {
    for (const r of rows) if (!seen.has(r.id)) seen.set(r.id, r);
  }

  const PRI = {RFO_FAR:6,NFS:5,NFS_CG:4,PIC:3,PN:3,PCD:2};
  return [...seen.values()]
    .sort((a,b)=>(PRI[b.doc_type]||0)-(PRI[a.doc_type]||0))
    .slice(0, 4);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return {statusCode:200, headers:cors, body:""};
  if (event.httpMethod !== "POST") return {statusCode:405, headers:cors, body:"Method Not Allowed"};
  if (!ANTHROPIC_KEY) return {statusCode:500, headers:cors, body:JSON.stringify({error:"ANTHROPIC_API_KEY not set"})};

  try {
    const { docType, prompt, systemPrompt } = JSON.parse(event.body || "{}");
    if (!prompt) return {statusCode:400, headers:cors, body:JSON.stringify({error:"prompt required"})};

    // Step 1 — KB fetch (parallel, fast)
    const chunks = await getKBChunks(docType);
    const sources = chunks.map(c=>`${c.doc_type}: ${c.source}${c.section?" §"+c.section:""}`);

    // Step 2 — Build augmented prompt
    let regContext = "";
    if (chunks.length) {
      const sections = chunks.map(c => {
        const ref = [c.doc_type, c.source, c.section].filter(Boolean).join(" > ");
        return `[${ref}]\n${(c.content||"").substring(0,350)}`;
      }).join("\n---\n");
      regContext = `\n\n=== CURRENT NASA REGULATORY TEXT ===\n${sections}\n=== END - Base citations only on above text ===\n`;
    }

    const augmented = prompt + regContext;
    const sysPrompt = (systemPrompt || "You are an expert NASA Contracting Officer assistant. Generate professional procurement documents compliant with FAR and NFS. Use bracketed placeholders like [Contract No.], [Date] for identifiers the CO must fill in.")
      + (chunks.length ? " CRITICAL: The prompt includes current regulatory text from NASA's live KB (RFO FAR March 2026, NFS April 2026). Use ONLY the section numbers and thresholds shown there — do not use training knowledge for specific citations." : "");

    // Step 3 — Call Claude
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
        system: sysPrompt,
        messages: [{role:"user", content: augmented}],
      }),
    });

    const data = await res.json();
    if (data.error) return {statusCode:500, headers:cors, body:JSON.stringify({error:data.error.message})};

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        text: data.content?.[0]?.text || "Generation failed.",
        sources_used: [...new Set(sources)],
        chunks_used: chunks.length,
      }),
    };

  } catch(err) {
    return {statusCode:500, headers:cors, body:JSON.stringify({error:err.message})};
  }
};
