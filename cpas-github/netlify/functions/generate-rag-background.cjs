// CPAS RAG Background Function (CJS format)
// Netlify background functions run up to 15 minutes
// Named with -background suffix per Netlify convention

const { getStore } = require("@netlify/blobs");

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const DOC_TERMS = {
  JOFOC:          ["Competition Requirements", "other than full and open", "1806.3"],
  ACQ_PLAN:       ["1807.14", "procurement strategy meeting"],
  PNM:            ["price negotiation", "15.406"],
  ANOSCA:         ["1805.302", "ANOSCA", "public announcement"],
  RESPONSIBILITY: ["9.105", "responsibility determination"],
  MARKET_RESEARCH:["market research", "10.001"],
  SOURCES_SOUGHT: ["sources sought", "5.207"],
  QASP:           ["quality assurance", "1846.408"],
  IGCE:           ["independent government cost estimate", "IGCE"],
  COR_LETTER:     ["1801.602", "contracting officer representative"],
  CLAUSE_MATRIX:  ["1812.301", "52.212"],
  FO_EXCEPTION:   ["fair opportunity", "16.505"],
  CLOSEOUT:       ["4.804", "closeout"],
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

  const fetches = terms.slice(0, 2).map(term => {
    const like = `%${term.replace(/[%_]/g,"")}%`;
    const url = `${base}?select=id,source,doc_type,section,content`
      + `&or=(section.ilike.${encodeURIComponent(like)},keywords.ilike.${encodeURIComponent(like)})`
      + `&doc_type=in.(${typeFilter})&limit=3`;
    return fetch(url, {headers:h}).then(r=>r.ok?r.json():[]).catch(()=>[]);
  });

  const results = await Promise.all(fetches);
  for (const rows of results) for (const r of rows) if (!seen.has(r.id)) seen.set(r.id, r);
  const PRI = {RFO_FAR:6,NFS:5,NFS_CG:4,PIC:3,PN:3,PCD:2};
  return [...seen.values()].sort((a,b)=>(PRI[b.doc_type]||0)-(PRI[a.doc_type]||0)).slice(0,5);
}

exports.handler = async (event) => {
  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  if (!ANTHROPIC_KEY) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };

  // jobId comes from the client — Netlify background functions return empty body
  // so client generates the ID and passes it in the request
  let jobId, store;
  try {
    const { jobId: clientJobId, docType, prompt, systemPrompt } = JSON.parse(event.body || "{}");
    jobId = clientJobId || ("cpas_" + Date.now());
    store = getStore({ name: "cpas-jobs", consistency: "strong" });

    if (!prompt) {
      await store.setJSON(jobId, { status: "error", error: "prompt required" });
      return { statusCode: 202, headers: cors, body: "" };
    }

    // Write initial status immediately
    await store.setJSON(jobId, { status: "fetching_kb", created: Date.now() });

    // KB fetch
    const chunks = await getKBChunks(docType);
    const sources = [...new Set(chunks.map(c => `${c.doc_type}: ${c.source}${c.section ? " §" + c.section : ""}`))];

    // Build augmented prompt
    let regContext = "";
    if (chunks.length) {
      const sections = chunks.map(c => {
        const ref = [c.doc_type, c.source, c.section].filter(Boolean).join(" > ");
        return `[${ref}]\n${(c.content || "").substring(0, 400)}`;
      }).join("\n---\n");
      regContext = "\n\n=== CURRENT NASA REGULATORY TEXT (RFO FAR Mar 2026 / NFS Apr 2026) ===\n"
        + sections
        + "\n=== END - Use ONLY these citations. Override training knowledge. ===\n";
    }

    await store.setJSON(jobId, { status: "generating", sources_used: sources, created: Date.now() });

    const sysPrompt = (systemPrompt || "You are an expert NASA Contracting Officer assistant. Generate professional, complete procurement documents compliant with FAR and NFS. Use bracketed placeholders like [Contract No.], [Date] for identifiers the CO must fill in.")
      + (chunks.length ? " CRITICAL: Current regulatory text is provided. Base ALL citations on that text only." : "");

    // Call Claude
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
        messages: [{ role: "user", content: prompt + regContext }],
      }),
    });

    const data = await res.json();
    if (data.error) {
      await store.setJSON(jobId, { status: "error", error: data.error.message });
      // Netlify background functions ignore return value — client polls for result
  return { statusCode: 202, headers: cors, body: "" };
    }

    const text = data.content?.[0]?.text || "Generation failed.";
    await store.setJSON(jobId, { status: "done", text, sources_used: sources, chunks_used: chunks.length, completed: Date.now() });

  } catch (err) {
    try {
      const store = getStore({ name: "cpas-jobs", consistency: "strong" });
      await store.setJSON(jobId, { status: "error", error: err.message });
    } catch(e) {}
  }

  // Netlify background functions ignore return value — client polls for result
  return { statusCode: 202, headers: cors, body: "" };
};
