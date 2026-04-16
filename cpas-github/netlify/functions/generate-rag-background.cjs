// CPAS RAG Background Function — minimal version, no KB fetch
const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const cors = { "Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type" };

async function writeJob(jobId, data) {
  try {
    await fetch(SB_URL+"/rest/v1/cpas_jobs", {
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Prefer":"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify({job_id:jobId,updated_at:new Date().toISOString(),...data}),
    });
  } catch(e) { console.error("writeJob error:",e.message); }
}

exports.handler = async function(event) {
  if (event.httpMethod==="OPTIONS") return {statusCode:200,headers:cors,body:""};
  if (event.httpMethod!=="POST") return {statusCode:405,headers:cors,body:"Method Not Allowed"};

  let jobId = "cpas_"+Date.now();
  try {
    const body = JSON.parse(event.body||"{}");
    jobId = body.jobId||jobId;
    const { docType, prompt, systemPrompt } = body;

    if (!prompt) { await writeJob(jobId,{status:"error",error_msg:"no prompt"}); return {statusCode:202,headers:cors,body:""}; }
    if (!ANTHROPIC_KEY) { await writeJob(jobId,{status:"error",error_msg:"ANTHROPIC_API_KEY not set"}); return {statusCode:202,headers:cors,body:""}; }

    await writeJob(jobId,{status:"generating"});
    console.log("Job",jobId,"calling Claude for",docType);

    const sysPrompt = systemPrompt||"You are an expert NASA Contracting Officer assistant. Generate professional procurement documents compliant with FAR and NFS. Use bracketed placeholders like [Contract No.], [Date] for identifiers the CO must fill in.";

    const aiRes = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:6000,system:sysPrompt,messages:[{role:"user",content:prompt}]}),
    });

    const data = await aiRes.json();
    console.log("Job",jobId,"Claude responded, error:",data.error?.message||"none");

    if (data.error) { await writeJob(jobId,{status:"error",error_msg:data.error.message}); return {statusCode:202,headers:cors,body:""}; }

    const text = data.content?.[0]?.text||"Generation failed.";
    await writeJob(jobId,{status:"done",result_text:text,chunks_used:0});
    console.log("Job",jobId,"done, length:",text.length);

  } catch(err) {
    console.error("Job",jobId,"error:",err.message);
    try { await writeJob(jobId,{status:"error",error_msg:err.message}); } catch(e) {}
  }

  return {statusCode:202,headers:cors,body:""};
};
