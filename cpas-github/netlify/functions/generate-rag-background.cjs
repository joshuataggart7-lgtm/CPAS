// CPAS RAG Background Function
// Netlify background functions: handler must complete within 15 minutes
// Named with -background suffix automatically gets 15min timeout on Pro plan

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const cors = { "Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type" };

const DOC_TERMS = {
  JOFOC:["Competition Requirements","other than full and open","1806"],
  ACQ_PLAN:["1807.14","procurement strategy"],
  PNM:["price negotiation","15.406"],
  ANOSCA:["1805.302","ANOSCA"],
  RESPONSIBILITY:["9.105","responsibility"],
  MARKET_RESEARCH:["market research","10.001"],
  SOURCES_SOUGHT:["sources sought","5.207"],
  QASP:["quality assurance","1846.408"],
  IGCE:["government cost estimate"],
  COR_LETTER:["1801.602","COR"],
  CLAUSE_MATRIX:["1812.301","52.212"],
  FO_EXCEPTION:["fair opportunity","16.505"],
  CLOSEOUT:["4.804","closeout"],
};

const DOC_TYPES = {
  JOFOC:"RFO_FAR,NFS,NFS_CG,PCD",
  ACQ_PLAN:"NFS,NFS_CG,RFO_FAR,PCD",
  PNM:"RFO_FAR,NFS,NFS_CG",
  ANOSCA:"NFS,NFS_CG,PIC,PCD",
  RESPONSIBILITY:"RFO_FAR,NFS",
  MARKET_RESEARCH:"RFO_FAR,NFS,NFS_CG",
  SOURCES_SOUGHT:"RFO_FAR,NFS",
  QASP:"NFS,NFS_CG,RFO_FAR",
  IGCE:"NFS,NFS_CG",
  COR_LETTER:"NFS,NFS_CG",
  CLAUSE_MATRIX:"NFS,RFO_FAR,PCD",
  FO_EXCEPTION:"RFO_FAR,NFS",
  CLOSEOUT:"RFO_FAR,NFS",
};

async function sbFetch(path, opts) {
  const h = { "apikey":SB_KEY, "Authorization":"Bearer "+SB_KEY, "Content-Type":"application/json" };
  return fetch(SB_URL+path, { headers:h, ...opts });
}

async function writeJob(jobId, data) {
  try {
    await sbFetch("/rest/v1/cpas_jobs", {
      method:"POST",
      headers:{ "Content-Type":"application/json","apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Prefer":"resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ job_id:jobId, updated_at:new Date().toISOString(), ...data }),
    });
  } catch(e) { console.error("writeJob failed:", e.message); }
}

async function getKBChunks(docType) {
  const terms = (DOC_TERMS[docType]||[]).slice(0,2);
  const typeFilter = DOC_TYPES[docType]||"RFO_FAR,NFS,NFS_CG";
  if (!terms.length) return [];

  const seen = new Map();
  for (const term of terms) {
    try {
      const like = "%"+term.replace(/[%_]/g,"").substring(0,30)+"%";
      const url = "/rest/v1/cpas_regulatory_docs?select=id,source,doc_type,section,content"
        +"&or=(section.ilike."+encodeURIComponent(like)+",keywords.ilike."+encodeURIComponent(like)+")"
        +"&doc_type=in.("+typeFilter+")&limit=3";
      const r = await sbFetch(url, {});
      if (r.ok) {
        const rows = await r.json();
        rows.forEach(row => { if (!seen.has(row.id)) seen.set(row.id, row); });
      }
    } catch(e) { console.error("KB fetch error:", e.message); }
  }

  const PRI = {RFO_FAR:6,NFS:5,NFS_CG:4,PIC:3,PN:3,PCD:2};
  return [...seen.values()].sort((a,b)=>(PRI[b.doc_type]||0)-(PRI[a.doc_type]||0)).slice(0,5);
}

exports.handler = async function(event) {
  if (event.httpMethod==="OPTIONS") return {statusCode:200,headers:cors,body:""};
  if (event.httpMethod!=="POST") return {statusCode:405,headers:cors,body:"Method Not Allowed"};

  let jobId = "cpas_"+Date.now();
  try {
    const body = JSON.parse(event.body||"{}");
    jobId = body.jobId || jobId;
    const { docType, prompt, systemPrompt } = body;

    if (!prompt) {
      await writeJob(jobId, {status:"error",error_msg:"no prompt"});
      return {statusCode:202,headers:cors,body:""};
    }

    if (!ANTHROPIC_KEY) {
      await writeJob(jobId, {status:"error",error_msg:"ANTHROPIC_API_KEY not configured"});
      return {statusCode:202,headers:cors,body:""};
    }

    // Step 1 — write initial status
    await writeJob(jobId, {status:"fetching_kb"});
    console.log("Job", jobId, "fetching KB for docType:", docType);

    // Step 2 — KB fetch (sequential to avoid timeout issues)
    const chunks = await getKBChunks(docType);
    const sources = [...new Set(chunks.map(c=>c.doc_type+": "+c.source+(c.section?" §"+c.section:"")))];
    console.log("Job", jobId, "KB done, chunks:", chunks.length);

    // Step 3 — build augmented prompt
    let regContext = "";
    if (chunks.length) {
      const sections = chunks.map(c=>"["+[c.doc_type,c.source,c.section].filter(Boolean).join(" > ")+"]\n"+(c.content||"").substring(0,350)).join("\n---\n");
      regContext = "\n\n=== CURRENT NASA REGULATORY TEXT ===\n"+sections+"\n=== END - Base citations only on above text ===\n";
    }

    // Step 4 — update status to generating
    await writeJob(jobId, {status:"generating", sources_used:JSON.stringify(sources)});
    console.log("Job", jobId, "calling Claude...");

    // Step 5 — call Claude
    const sysPrompt = (systemPrompt||"You are an expert NASA Contracting Officer assistant. Generate professional procurement documents compliant with FAR and NFS. Use bracketed placeholders for specific numbers/dates.")
      + (chunks.length?" CRITICAL: Use ONLY the regulatory citations provided in the prompt.":"");

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:6000,system:sysPrompt,messages:[{role:"user",content:prompt+regContext}]}),
    });

    const data = await aiRes.json();
    console.log("Job", jobId, "Claude done, error:", data.error?.message||"none");

    if (data.error) {
      await writeJob(jobId, {status:"error",error_msg:data.error.message});
      return {statusCode:202,headers:cors,body:""};
    }

    const text = data.content?.[0]?.text||"Generation failed.";
    await writeJob(jobId, {status:"done",result_text:text,sources_used:JSON.stringify(sources),chunks_used:chunks.length});
    console.log("Job", jobId, "complete, text length:", text.length);

  } catch(err) {
    console.error("Job", jobId, "fatal error:", err.message);
    try { await writeJob(jobId, {status:"error",error_msg:err.message}); } catch(e) {}
  }

  return {statusCode:202,headers:cors,body:""};
};
