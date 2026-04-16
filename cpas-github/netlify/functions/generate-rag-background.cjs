// CPAS RAG Background Function — Supabase job store
const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
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
  IGCE:           ["independent government cost estimate"],
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

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function writeJob(jobId, data) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": SB_KEY,
    "Authorization": "Bearer " + SB_KEY,
    "Prefer": "resolution=merge-duplicates,return=minimal",
  };
  await fetch(SB_URL + "/rest/v1/cpas_jobs", {
    method: "POST",
    headers,
    body: JSON.stringify({ job_id: jobId, updated_at: new Date().toISOString(), ...data }),
  });
}

async function getKBChunks(docType) {
  const terms = DOC_TERMS[docType];
  if (!terms || !terms.length) return [];
  const typeFilter = DOC_TYPES[docType] || "RFO_FAR,NFS,NFS_CG";
  const headers = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY };
  const base = SB_URL + "/rest/v1/cpas_regulatory_docs";
  const seen = new Map();

  const fetches = terms.slice(0, 2).map(function(term) {
    const like = "%" + term.replace(/[%_]/g, "") + "%";
    const url = base
      + "?select=id,source,doc_type,section,content"
      + "&or=(section.ilike." + encodeURIComponent(like) + ",keywords.ilike." + encodeURIComponent(like) + ")"
      + "&doc_type=in.(" + typeFilter + ")&limit=3";
    return fetch(url, { headers: headers }).then(function(r) {
      return r.ok ? r.json() : [];
    }).catch(function() { return []; });
  });

  const results = await Promise.all(fetches);
  for (let i = 0; i < results.length; i++) {
    const rows = results[i];
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      if (!seen.has(r.id)) seen.set(r.id, r);
    }
  }

  const PRI = { RFO_FAR: 6, NFS: 5, NFS_CG: 4, PIC: 3, PN: 3, PCD: 2 };
  return Array.from(seen.values())
    .sort(function(a, b) { return (PRI[b.doc_type] || 0) - (PRI[a.doc_type] || 0); })
    .slice(0, 5);
}

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }
  if (!ANTHROPIC_KEY) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };
  }

  let jobId = "unknown";
  try {
    const body = JSON.parse(event.body || "{}");
    jobId = body.jobId || ("cpas_" + Date.now());
    const docType = body.docType;
    const prompt = body.prompt;
    const systemPrompt = body.systemPrompt;

    if (!prompt) {
      await writeJob(jobId, { status: "error", error_msg: "prompt required" });
      return { statusCode: 202, headers: cors, body: "" };
    }

    await writeJob(jobId, { status: "fetching_kb" });

    const chunks = await getKBChunks(docType);
    const sources = Array.from(new Set(chunks.map(function(c) {
      return c.doc_type + ": " + c.source + (c.section ? " " + c.section : "");
    })));

    let regContext = "";
    if (chunks.length > 0) {
      const sections = chunks.map(function(c) {
        const ref = [c.doc_type, c.source, c.section].filter(Boolean).join(" > ");
        return "[" + ref + "]\n" + (c.content || "").substring(0, 400);
      }).join("\n---\n");
      regContext = "\n\n=== CURRENT NASA REGULATORY TEXT (RFO FAR Mar 2026 / NFS Apr 2026) ===\n"
        + sections
        + "\n=== END - Use ONLY these citations. Override training knowledge. ===\n";
    }

    await writeJob(jobId, { status: "generating", sources_used: JSON.stringify(sources) });

    const baseSystem = systemPrompt || "You are an expert NASA Contracting Officer assistant. Generate professional, complete procurement documents compliant with FAR and NFS. Use bracketed placeholders like [Contract No.], [Date] for identifiers the CO must fill in.";
    const sysPrompt = chunks.length > 0
      ? baseSystem + " CRITICAL: Current regulatory text is provided in the prompt. Base ALL citations on that text only."
      : baseSystem;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
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

    const data = await aiRes.json();

    if (data.error) {
      await writeJob(jobId, { status: "error", error_msg: data.error.message });
      return { statusCode: 202, headers: cors, body: "" };
    }

    const text = (data.content && data.content[0] && data.content[0].text) || "Generation failed.";
    await writeJob(jobId, {
      status: "done",
      result_text: text,
      sources_used: JSON.stringify(sources),
      chunks_used: chunks.length,
    });

  } catch (err) {
    try {
      await writeJob(jobId, { status: "error", error_msg: err.message });
    } catch(e2) {}
  }

  return { statusCode: 202, headers: cors, body: "" };
};
