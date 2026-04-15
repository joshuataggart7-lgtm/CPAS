// CPAS Drive Chunker
// Reads files from Google Drive CPAS Regulatory Library folder,
// extracts text by file type, chunks, and inserts into Supabase
// POST { folder_id, clear_first, doc_types } — protected by SEED_TOKEN

const https = require("https");
const { Buffer } = require("buffer");

const SB_URL = process.env.SUPABASE_URL || "https://ylzdfcyiyznazvvbqdam.supabase.co";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_adMOxPm4Sd5fcUXRf9qKdw_VpwR382c";
const SEED_TOKEN = process.env.SEED_TOKEN || "cpas-seed-2026";
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const SA_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

const ROOT_FOLDER_ID = "12b4b7NpJOtGdIenoW-4H5oErY11zAsma";

const CHUNK_SIZE = 2000;
const BATCH_SIZE = 50;

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Google OAuth2 — service account JWT ──────────────────────────
async function getAccessToken() {
  if (!SA_EMAIL || !SA_KEY) throw new Error("Google service account credentials not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Sign with RSA-SHA256 using the private key
  const crypto = require("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(SA_KEY, "base64url");
  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get access token: " + JSON.stringify(data));
  return data.access_token;
}

// ── Drive API helpers ─────────────────────────────────────────────
async function listFiles(folderId, token, pageToken = null) {
  let url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false` +
    `&fields=files(id,name,mimeType,size),nextPageToken&pageSize=100`;
  if (pageToken) url += `&pageToken=${pageToken}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

async function getAllFiles(folderId, token) {
  const files = [];
  let pageToken = null;
  do {
    const data = await listFiles(folderId, token, pageToken);
    if (data.files) files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return files;
}

async function downloadFile(fileId, token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.arrayBuffer();
}

async function exportGoogleDoc(fileId, token) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.text();
}

// ── Text extraction by file type ──────────────────────────────────
async function extractText(file, token) {
  const { id, name, mimeType } = file;

  try {
    // Google Docs — export as plain text
    if (mimeType === "application/vnd.google-apps.document") {
      return await exportGoogleDoc(id, token);
    }

    // Google Sheets — export as CSV
    if (mimeType === "application/vnd.google-apps.spreadsheet") {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.text();
    }

    // Download binary files
    const buffer = await downloadFile(id, token);
    const bytes = Buffer.from(buffer);

    // PDF — extract text from plain-text PDFs (NASA's are text-based)
    if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
      const text = bytes.toString("utf8", 0, Math.min(bytes.length, 500000));
      // Check if this is a true binary PDF (not a text-based one)
      if (text.startsWith("%PDF") && text.includes("stream")) {
        // Binary PDF — skip, can't extract without pdf parsing library
        return null;
      }
      // Clean up any non-printable characters
      return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
                 .replace(/\s{3,}/g, "\n\n")
                 .trim();
    }

    // Word docs — use mammoth
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        || name.endsWith(".docx")) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer: bytes });
      return result.value || "";
    }

    // Excel — convert to text representation
    if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        || name.endsWith(".xlsx")) {
      // Basic text extraction — read shared strings XML
      const text = bytes.toString("utf8", 0, Math.min(bytes.length, 200000));
      const strings = [...text.matchAll(/<t[^>]*>([^<]+)<\/t>/g)].map(m => m[1]);
      return strings.join(" | ").substring(0, 8000);
    }

    // PowerPoint
    if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        || name.endsWith(".pptx")) {
      const text = bytes.toString("utf8", 0, Math.min(bytes.length, 200000));
      const strings = [...text.matchAll(/<a:t>([^<]+)<\/a:t>/g)].map(m => m[1]);
      return strings.join("\n").substring(0, 8000);
    }

    // Plain text
    if (mimeType === "text/plain" || name.endsWith(".txt") || name.endsWith(".md")) {
      return bytes.toString("utf8").substring(0, 50000);
    }

    return null; // skip unsupported types

  } catch (e) {
    console.error(`Extract error for ${name}:`, e.message);
    return null;
  }
}

// ── Determine doc_type and source from folder path ────────────────
function classifyFile(name, folderPath) {
  const p = folderPath.toLowerCase();
  if (p.includes("01-nfs") && !p.includes("cg")) return { doc_type: "NFS", source: "NFS 2026 Edition" };
  if (p.includes("02-nfs-cg")) return { doc_type: "NFS_CG", source: "NFS Companion Guide" };
  if (p.includes("03-rfo-far")) return { doc_type: "RFO_FAR", source: "RFO FAR 2026-03-16" };
  if (p.includes("04-far-sag")) return { doc_type: "FAR_SAG", source: "FAR Strategic Acquisition Guide" };
  if (p.includes("05-pcd")) return { doc_type: "PCD", source: name.replace(/\.[^.]+$/, "") };
  if (p.includes("06-pic")) return { doc_type: "PIC", source: name.replace(/\.[^.]+$/, "") };
  if (p.includes("07-pn")) return { doc_type: "PN", source: name.replace(/\.[^.]+$/, "") };
  if (p.includes("01-pre-award")) return { doc_type: "TEMPLATE", source: "Template: " + cleanName(name) };
  if (p.includes("02-solicitation")) return { doc_type: "TEMPLATE", source: "Template: " + cleanName(name) };
  if (p.includes("03-evaluation")) return { doc_type: "TEMPLATE", source: "Template: " + cleanName(name) };
  if (p.includes("04-award")) return { doc_type: "TEMPLATE", source: "Template: " + cleanName(name) };
  if (p.includes("05-post-award")) return { doc_type: "TEMPLATE", source: "Template: " + cleanName(name) };
  if (p.includes("06-admin")) return { doc_type: "TEMPLATE", source: "Template: " + cleanName(name) };
  if (p.includes("07-forms")) return { doc_type: "TEMPLATE", source: "Template: " + cleanName(name) };
  if (p.includes("01-source-selection")) return { doc_type: "GUIDE", source: "Guide: " + cleanName(name) };
  if (p.includes("02-procurement-procedures")) return { doc_type: "GUIDE", source: "Guide: " + cleanName(name) };
  if (p.includes("03-ai-acquisitions")) return { doc_type: "GUIDE", source: "Guide: " + cleanName(name) };
  if (p.includes("08-sf-forms")) return { doc_type: "FORM", source: "Form: " + cleanName(name) };
  if (p.includes("09-dd-forms")) return { doc_type: "FORM", source: "Form: " + cleanName(name) };
  if (p.includes("10-nasa-forms")) return { doc_type: "FORM", source: "Form: " + cleanName(name) };
  return { doc_type: "OTHER", source: name.replace(/\.[^.]+$/, "") };
}

function cleanName(name) {
  return name.replace(/^TEMPLATE-|^GUIDE-|^SF-|^DD-|^NF-/i, "")
             .replace(/\.[^.]+$/, "")
             .replace(/-/g, " ")
             .trim();
}

// ── Extract keywords (clause numbers, citations) ──────────────────
function extractKeywords(text) {
  const kw = new Set();
  const patterns = [
    /\b1852\.\d{3}(?:-\d+)?/g,
    /\b52\.\d{3}(?:-\d+)?/g,
    /\b18\d{2}\.\d{3}(?:-\d+)?/g,
    /\bFAR\s+\d{1,2}\.\d{3}(?:-\d+)?/g,
    /\bNFS\s+18\d{2}\.\d{3}/g,
    /\bP(?:CD|IC|N)\s*\d{2}-\d{2}[a-zA-Z]?/g,
    /\bFAC\s+\d{4}-\d{2}/g,
  ];
  for (const p of patterns) {
    for (const m of text.matchAll(p)) kw.add(m[0].trim());
  }
  return [...kw].slice(0, 60).join(" ");
}

// ── Chunk a text document ─────────────────────────────────────────
function chunkText(text, source, doc_type, fileName) {
  const chunks = [];
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
                    .replace(/\n{4,}/g, "\n\n\n").trim();

  // For regulatory docs try to split on section numbers
  if (["NFS","RFO_FAR","FAR_SAG"].includes(doc_type)) {
    const parts = clean.split(/(?=\n(?:1[0-9]{3,4}\.|\bFAR\s+\d{1,2}\.))/);
    for (const part of parts) {
      if (part.trim().length < 80) continue;
      const firstLine = part.trim().split("\n")[0].trim();
      const secMatch = firstLine.match(/^(1[0-9]{3,4}\.\d[\d.-]*)/);
      chunks.push({
        source, doc_type,
        section: secMatch ? secMatch[1] : "",
        title: firstLine.substring(0, 120),
        content: part.trim().substring(0, CHUNK_SIZE),
        keywords: extractKeywords(part),
      });
    }
    if (chunks.length > 0) return chunks;
  }

  // Default: paragraph-based chunking
  if (clean.length <= CHUNK_SIZE) {
    chunks.push({
      source, doc_type,
      section: "",
      title: fileName.replace(/\.[^.]+$/, "").replace(/-/g, " ").substring(0, 100),
      content: clean,
      keywords: extractKeywords(clean),
    });
  } else {
    const paragraphs = clean.split(/\n{2,}/);
    let current = "";
    let partNum = 1;
    for (const para of paragraphs) {
      if (current.length + para.length > CHUNK_SIZE && current.trim()) {
        chunks.push({
          source, doc_type,
          section: `Part ${partNum}`,
          title: `${fileName.replace(/\.[^.]+$/, "")} (Part ${partNum})`,
          content: current.trim().substring(0, CHUNK_SIZE),
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
        content: current.trim().substring(0, CHUNK_SIZE),
        keywords: extractKeywords(current),
      });
    }
  }
  return chunks;
}

function sanitize(str) {
  if (!str) return "";
  // Remove null bytes and other characters that break PostgreSQL
  return str.replace(/\0/g, "")
            .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, " ")
            .trim()
            .substring(0, 4000);
}

// ── Supabase insert ───────────────────────────────────────────────
async function insertBatch(chunks, clearFirst = false) {
  // Use service role key if available for seeding (bypasses RLS)
  const insertKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_KEY;

  const headers = {
    "Content-Type": "application/json",
    "apikey": insertKey,
    "Authorization": `Bearer ${insertKey}`,
    "Prefer": "return=minimal",
  };

  if (clearFirst) {
    await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs?id=gt.0`, {
      method: "DELETE", headers
    });
  }

  const res = await fetch(`${SB_URL}/rest/v1/cpas_regulatory_docs`, {
    method: "POST",
    headers,
    body: JSON.stringify(chunks.map(c => ({
      ...c,
      source:   sanitize(c.source),
      section:  sanitize(c.section),
      title:    sanitize(c.title),
      content:  sanitize(c.content),
      keywords: sanitize(c.keywords),
    }))),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    let err;
    if (contentType.includes("json")) {
      const json = await res.json();
      err = JSON.stringify(json);
    } else {
      err = await res.text();
    }
    throw new Error(`Supabase insert failed (${res.status}): ${err.substring(0, 300)}`);
  }
  return chunks.length;
}

// ── Recursive folder walker ───────────────────────────────────────
async function walkFolder(folderId, token, path = "", results = []) {
  const files = await getAllFiles(folderId, token);
  for (const file of files) {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      await walkFolder(file.id, token, `${path}/${file.name}`, results);
    } else {
      results.push({ ...file, folderPath: path });
    }
  }
  return results;
}

// ── Main handler ──────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  if (!auth.includes(SEED_TOKEN)) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const clearFirst = body.clear_first === true;
    const folderId = body.folder_id || ROOT_FOLDER_ID;

    // Get Drive access token
    let token;
    try {
      token = await getAccessToken();
    } catch(e) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({
        error: "Google auth failed: " + e.message,
        hint: "Check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY env vars"
      })};
    }

    // Support single-subfolder mode for chunked processing
    // body.subfolder_id = process one specific folder only
    // body.list_only = just return folder list without processing
    const subFolderId = body.subfolder_id || null;
    const listOnly = body.list_only === true;

    // If listing only — return all subfolders so UI can call one at a time
    if (listOnly) {
      const topLevel = await getAllFiles(folderId, token);
      const subfolders = topLevel.filter(f =>
        f.mimeType === "application/vnd.google-apps.folder"
      );
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({ subfolders, total: subfolders.length }),
      };
    }

    // Walk only the requested subfolder, or root if none specified
    const targetId = subFolderId || folderId;
    const allFiles = await walkFolder(targetId, token, "");

    // Process each file
    let totalChunks = 0;
    let processed = 0;
    let skipped = 0;
    let errors = [];
    let batch = [];
    const clearOnFirst = clearFirst && !subFolderId; // only clear on first subfolder
    let firstBatch = true;

    for (const file of allFiles) {
      if (file.name.startsWith(".") || file.name.startsWith("~$")) {
        skipped++; continue;
      }

      const text = await extractText(file, token);
      if (!text || text.trim().length < 50) {
        skipped++; continue;
      }

      const { doc_type, source } = classifyFile(file.name, file.folderPath);
      const chunks = chunkText(text, source, doc_type, file.name);
      batch.push(...chunks);
      processed++;

      if (batch.length >= BATCH_SIZE) {
        try {
          await insertBatch(batch, clearOnFirst && firstBatch);
          totalChunks += batch.length;
          firstBatch = false;
          batch = [];
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 200));
        } catch(e) {
          errors.push(e.message);
          batch = [];
        }
      }
    }

    if (batch.length > 0) {
      try {
        await insertBatch(batch, clearOnFirst && firstBatch);
        totalChunks += batch.length;
      } catch(e) {
        errors.push(e.message);
      }
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        success: true,
        files_processed: processed,
        files_skipped: skipped,
        chunks_inserted: totalChunks,
        errors: errors.length,
        error_details: errors.slice(0, 5),
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: err.message, stack: err.stack?.substring(0, 500) })
    };
  }
};
