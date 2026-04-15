// CPAS Document Upload Chunker
// Accepts base64-encoded Word/PDF files, extracts text, chunks, inserts into Supabase
// POST { files: [{ name, data, mimeType }], doc_type, clear_source }

const { Buffer } = require("buffer");

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const SEED_TOKEN = process.env.SEED_TOKEN || "cpas-seed-2026";
const CHUNK_SIZE = 2000;

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sanitize(str) {
  if (!str) return "";
  return str.replace(/\0/g, "")
            .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, " ")
            .trim()
            .substring(0, CHUNK_SIZE);
}

function extractKeywords(text) {
  const kw = new Set();
  const patterns = [
    /\b1852\.\d{3}(?:-\d+)?/g,
    /\b52\.\d{3}(?:-\d+)?/g,
    /\b18\d{2}\.\d{3}(?:-\d+)?/g,
    /\bFAR\s+\d{1,2}\.\d{3}(?:-\d+)?/g,
    /\bP(?:CD|IC|N)\s*\d{2}-\d{2}[a-zA-Z]?/g,
    /\bFAC\s+\d{4}-\d{2}/g,
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p)) kw.add(m[0].trim());
  }
  return [...kw].slice(0, 60).join(" ");
}

function chunkText(text, source, doc_type, fileName) {
  const chunks = [];
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
                    .replace(/\n{4,}/g, "\n\n\n").trim();
  if (!clean || clean.length < 80) return chunks;

  // For FAR/RFO docs split on part/section headers
  const isRegulatory = ["RFO_FAR","FAR_SAG","NFS","NFS_CG"].includes(doc_type);
  if (isRegulatory) {
    const parts = clean.split(/(?=\n(?:PART\s+\d+|Subpart\s+\d+|\d{1,2}\.\d{3}|\bFAR\s+\d{1,2}\.\d{3}))/i);
    for (const part of parts) {
      if (part.trim().length < 80) continue;
      const firstLine = part.trim().split("\n")[0].trim();
      const secMatch = firstLine.match(/^(\d{1,2}\.\d{3}(?:-\d+)?|PART\s+\d+|Subpart\s+[\d.]+)/i);
      chunks.push({
        source, doc_type,
        section: secMatch ? secMatch[1] : "",
        title: firstLine.substring(0, 120),
        content: sanitize(part.trim()),
        keywords: extractKeywords(part),
      });
    }
    if (chunks.length > 0) return chunks;
  }

  // Default paragraph chunking
  if (clean.length <= CHUNK_SIZE) {
    return [{
      source, doc_type, section: "",
      title: fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").substring(0, 100),
      content: sanitize(clean),
      keywords: extractKeywords(clean),
    }];
  }

  const paragraphs = clean.split(/\n{2,}/);
  let current = "", partNum = 1;
  for (const para of paragraphs) {
    if (current.length + para.length > CHUNK_SIZE && current.trim()) {
      chunks.push({
        source, doc_type,
        section: `Part ${partNum}`,
        title: `${fileName.replace(/\.[^.]+$/, "")} (Part ${partNum})`,
        content: sanitize(current.trim()),
        keywords: extractKeywords(current),
      });
      partNum++;
      current = para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }
  if (current.trim()) {
    chunks.push({
      source, doc_type,
      section: `Part ${partNum}`,
      title: `${fileName.replace(/\.[^.]+$/, "")} (Part ${partNum})`,
      content: sanitize(current.trim()),
      keywords: extractKeywords(current),
    });
  }
  return chunks;
}

async function insertChunks(chunks) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
    "Prefer": "return=minimal",
  };
  const res = await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs`, {
    method: "POST",
    headers,
    body: JSON.stringify(chunks),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert failed (${res.status}): ${err.substring(0, 200)}`);
  }
  return chunks.length;
}

async function deleteBySource(source) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": SB_KEY,
    "Authorization": `Bearer ${SB_KEY}`,
  };
  await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs?source=eq.${encodeURIComponent(source)}`, {
    method: "DELETE", headers
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  if (!auth.includes(SEED_TOKEN)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { files, doc_type = "RFO_FAR", clear_source = false } = body;

    if (!files?.length) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "No files provided" }) };
    }

    let totalChunks = 0;
    let processed = 0;
    let errors = [];

    for (const file of files) {
      try {
        const { name, data, mimeType } = file;
        const bytes = Buffer.from(data, "base64");
        let text = "";

        // Word docs — use mammoth
        if (name.endsWith(".docx") || mimeType?.includes("wordprocessingml.document")) {
          const mammoth = require("mammoth");
          const result = await mammoth.extractRawText({ buffer: bytes });
          text = result.value || "";
        }
        // Excel — extract cell text from shared strings XML inside the zip
        else if (name.endsWith(".xlsx") || name.endsWith(".xls") || mimeType?.includes("spreadsheetml") || mimeType?.includes("ms-excel")) {
          const raw = bytes.toString("utf8", 0, Math.min(bytes.length, 500000));
          // Extract shared strings (where cell text lives in xlsx)
          const siMatches = [...raw.matchAll(/<si>.*?<\/si>/gs)];
          const strings = siMatches.map(m => {
            const tMatches = [...m[0].matchAll(/<t[^>]*>([^<]*)<\/t>/g)];
            return tMatches.map(t => t[1]).join(" ");
          }).filter(s => s.trim().length > 0);
          // Also grab any direct cell values
          const vMatches = [...raw.matchAll(/<v>([^<]+)<\/v>/g)].map(m => m[1]);
          text = [...strings, ...vMatches].join(" | ").substring(0, 50000);
        }
        // PowerPoint — extract text from slide XML inside the zip
        else if (name.endsWith(".pptx") || mimeType?.includes("presentationml")) {
          const raw = bytes.toString("utf8", 0, Math.min(bytes.length, 500000));
          // Extract all text runs from slide XML
          const tMatches = [...raw.matchAll(/<a:t>([^<]+)<\/a:t>/g)].map(m => m[1]);
          // Extract slide titles separately
          const titleMatches = [...raw.matchAll(/<p:sp>.*?<p:ph[^>]*type="title"[^>]*\/>.*?<a:t>([^<]+)<\/a:t>/gs)].map(m => m[1]);
          text = [...titleMatches.map(t => `SLIDE: ${t}`), ...tMatches].join("\n").substring(0, 50000);
        }
        // PDF — text-based extraction
        else if (name.endsWith(".pdf") || mimeType?.includes("pdf")) {
          text = bytes.toString("utf8", 0, Math.min(bytes.length, 800000));
          if (text.startsWith("%PDF") && text.substring(0, 2000).includes("stream")) {
            const matches = [...text.matchAll(/BT\s*(.*?)\s*ET/gs)].map(m => m[1]);
            if (matches.length > 0) {
              text = matches.join("\n").replace(/\(([^)]+)\)/g, "$1").replace(/[^\x20-\x7E\n]/g, " ");
            } else {
              errors.push(`${name}: binary PDF — convert to Word for better extraction`);
              continue;
            }
          }
          text = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s{3,}/g, "\n\n");
        }
        // Plain text / markdown / csv
        else if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
          text = bytes.toString("utf8").substring(0, 50000);
        }
        // Unsupported
        else {
          errors.push(`${name}: unsupported file type — use .docx, .xlsx, .pptx, .pdf, or .txt`);
          continue;
        }

        if (!text || text.trim().length < 100) {
          errors.push(`${name}: insufficient text extracted`);
          continue;
        }

        // Derive source name from filename
        const baseName = name.replace(/\.[^.]+$/, "");
        let source = baseName;
        if (doc_type === "PCD") source = baseName.toUpperCase().replace(/^PCD[-_]?/i, "PCD ").replace(/[-_]/g, "-");
        else if (doc_type === "PIC") source = baseName.toUpperCase().replace(/^PIC[-_]?/i, "PIC ").replace(/[-_]/g, "-");
        else if (doc_type === "PN")  source = baseName.toUpperCase().replace(/^PN[-_]?/i, "PN ").replace(/[-_]/g, "-");
        else if (doc_type === "RFO_FAR") source = baseName.replace(/^RFO[-_]FAR[-_]?/i, "RFO FAR ").replace(/[-_]/g, " ").trim();
        else if (doc_type === "FAR_SAG") source = baseName.replace(/^FAR[-_]SAG[-_]?/i, "FAR SAG ").replace(/[-_]/g, " ").trim();
        else if (doc_type === "NFS") source = "NFS 2026 Edition";
        else if (doc_type === "NFS_CG") source = "NFS Companion Guide";
        else source = baseName.replace(/[-_]/g, " ").trim();

        // Clear existing chunks for this source if requested
        if (clear_source) await deleteBySource(source);

        const chunks = chunkText(text, source, doc_type, name);
        if (chunks.length === 0) {
          errors.push(`${name}: no chunks produced`);
          continue;
        }

        // Insert in batches of 50
        for (let i = 0; i < chunks.length; i += 50) {
          await insertChunks(chunks.slice(i, i + 50));
        }

        totalChunks += chunks.length;
        processed++;

      } catch(e) {
        errors.push(`${file.name}: ${e.message.substring(0, 100)}`);
      }
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        success: true,
        files_processed: processed,
        chunks_inserted: totalChunks,
        errors: errors.length,
        error_details: errors,
      }),
    };

  } catch(err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
