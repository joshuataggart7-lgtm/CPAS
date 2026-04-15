// CPAS Regulatory Knowledge Base
// Tabs: Search | Seed (admin)
// Search: full-text search over NFS/NFS-CG/PCD/PIC/PN via Netlify function
// Seed: one-time admin tool to load chunks into Supabase

import React, { useState, useCallback } from "react";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
const C = {
  bg:"#f5f7fa", bg2:"#ffffff", bg3:"#eef1f6",
  border:"#dde3ef", blue:"#1a3a6e", text:"#1a2332",
  muted:"#6b7a99", green:"#0f6e56", yellow:"#854f0b",
};
const inp = { background:"#fff", border:`1px solid ${C.border}`, color:C.text,
  padding:"9px 12px", borderRadius:8, fontSize:13, width:"100%",
  boxSizing:"border-box", fontFamily:FONT, outline:"none" };

const DOC_TYPE_COLORS = {
  NFS:     { bg:"#dbeafe", text:"#1e40af" },
  NFS_CG:  { bg:"#ede9fe", text:"#5b21b6" },
  RFO_FAR: { bg:"#d1fae5", text:"#065f46" },
  FAR_SAG: { bg:"#cffafe", text:"#164e63" },
  PCD:     { bg:"#dcfce7", text:"#166534" },
  PIC:     { bg:"#fef9c3", text:"#854d0e" },
  PN:      { bg:"#ffe4e6", text:"#9f1239" },
  TEMPLATE:{ bg:"#f3e8ff", text:"#6b21a8" },
  GUIDE:   { bg:"#fff7ed", text:"#9a3412" },
  FORM:    { bg:"#f0fdf4", text:"#15803d" },
};

const BATCH_SIZE = 50;
const SEED_TOKEN = "cpas-seed-2026";

export default function RegulatorySearch({ onClose }) {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  const [expanded, setExpanded] = useState(null);

  // Seed state
  const [seedStatus, setSeedStatus] = useState("idle"); // idle | loading | seeding | done | error
  const [seedProgress, setSeedProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [seedMsg, setSeedMsg] = useState("");
  const [clearFirst, setClearFirst] = useState(true);

  async function doSearch(q) {
    if (!q.trim()) return;
    setSearching(true);
    setSearchMsg("Searching...");
    setResults([]);
    try {
      const body = {
        query: q.trim(),
        limit: 10,
        doc_types: filterType ? [filterType] : null,
      };
      const res = await fetch("/.netlify/functions/regulatory-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.results?.length) {
        setResults(data.results);
        setSearchMsg(`${data.count} result${data.count !== 1 ? "s" : ""} found`);
      } else {
        setResults([]);
        setSearchMsg("No results found. Try different keywords or check that the knowledge base is seeded.");
      }
    } catch(e) {
      setSearchMsg("Search error: " + e.message);
    }
    setSearching(false);
  }

  async function runSeed() {
    setSeedStatus("seeding");
    setSeedMsg("Connecting to Google Drive...");
    setSeedProgress({ done: 0, total: 0, errors: 0 });

    const callChunker = async (body) => {
      const res = await fetch("/.netlify/functions/drive-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SEED_TOKEN}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
      }
      return res.json();
    };

    try {
      // Step 1 — list all top-level subfolders
      const listData = await callChunker({ list_only: true });
      if (listData.error) {
        setSeedStatus("error");
        setSeedMsg("Failed: " + listData.error + (listData.hint ? " — " + listData.hint : ""));
        return;
      }

      const subfolders = listData.subfolders || [];
      const total = subfolders.length || 1;
      setSeedMsg(`Found ${total} folder${total !== 1 ? "s" : ""} to process. Starting...`);
      setSeedProgress({ done: 0, total, errors: 0 });

      // Step 2 — process each subfolder individually
      let totalChunks = 0;
      let totalFiles = 0;
      let errCount = 0;

      if (subfolders.length === 0) {
        // No subfolders — process root directly
        const data = await callChunker({ clear_first: clearFirst });
        totalChunks = data.chunks_inserted || 0;
        totalFiles = data.files_processed || 0;
        errCount = data.errors || 0;
      } else {
        for (let i = 0; i < subfolders.length; i++) {
          const sf = subfolders[i];
          setSeedMsg(`Processing folder ${i + 1}/${subfolders.length}: ${sf.name}...`);
          setSeedProgress({ done: i, total, errors: errCount });
          try {
            const data = await callChunker({
              subfolder_id: sf.id,
              clear_first: clearFirst && i === 0,
            });
            totalChunks += data.chunks_inserted || 0;
            totalFiles += data.files_processed || 0;
            errCount += data.errors || 0;
          } catch(e) {
            errCount++;
            console.error(`Error processing ${sf.name}:`, e.message);
          }
          setSeedProgress({ done: i + 1, total, errors: errCount });
          // Brief pause between folders
          await new Promise(r => setTimeout(r, 300));
        }
      }

      setSeedStatus(errCount === 0 ? "done" : "done");
      setSeedMsg(
        `✓ Complete — ${totalChunks.toLocaleString()} chunks indexed from ${totalFiles} files` +
        (errCount > 0 ? ` (${errCount} folder errors — check Netlify function logs)` : ".")
      );

    } catch(e) {
      setSeedStatus("error");
      setSeedMsg("Error: " + e.message);
    }

    if (errors === 0) {
      setSeedStatus("done");
      setSeedMsg(`✓ Complete — ${done.toLocaleString()} regulatory chunks loaded into knowledge base.`);
    } else {
      setSeedStatus(errors < total / 2 ? "done" : "error");
      setSeedMsg(`Finished with ${errors} errors. ${done.toLocaleString()} chunks inserted successfully.`);
    }
  }

  const pct = seedProgress.total > 0 ? Math.round(seedProgress.done / seedProgress.total * 100) : 0;

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)}
      style={{ padding:"7px 18px", borderRadius:20, fontSize:12, cursor:"pointer",
        fontFamily:FONT, border:`1px solid ${tab===id ? C.blue : C.border}`,
        background:tab===id ? C.blue : C.bg2,
        color:tab===id ? "#fff" : C.muted,
        fontWeight:tab===id ? "500" : "400" }}>
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily:FONT, background:C.bg, minHeight:"100%", padding:"20px 24px" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20,
        borderBottom:`1px solid ${C.border}`, paddingBottom:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:"600", color:C.text }}>Regulatory Knowledge Base</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
            NFS 2026 · NFS Companion Guide · All Active PCDs · PICs · PNs
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted,
              padding:"6px 12px", borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:FONT }}>
            Close
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {tabBtn("search", "🔍 Search")}
        {tabBtn("seed", "⚙️ Seed / Admin")}
      </div>

      {/* SEARCH TAB */}
      {tab === "search" && (
        <div>
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <input style={inp} value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch(query)}
                placeholder="Search clause numbers, section citations, topics... e.g. 1805.303, sole source, SBIR data rights" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ ...inp, width:120 }}>
              <option value="">All types</option>
              <option value="NFS">NFS</option>
              <option value="NFS_CG">NFS CG</option>
              <option value="RFO_FAR">RFO FAR</option>
              <option value="FAR_SAG">FAR SAG</option>
              <option value="PCD">PCD</option>
              <option value="PIC">PIC</option>
              <option value="PN">PN</option>
              <option value="TEMPLATE">Template</option>
              <option value="GUIDE">Guide</option>
              <option value="FORM">Form</option>
            </select>
            <button onClick={() => doSearch(query)} disabled={searching || !query.trim()}
              style={{ background:C.blue, border:"none", color:"#fff", padding:"9px 20px",
                borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:"500", fontFamily:FONT,
                opacity: searching || !query.trim() ? 0.6 : 1 }}>
              {searching ? "..." : "Search"}
            </button>
          </div>

          {/* Quick search chips */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            {["1805.303","1806.302","1812.301","1827.409","1842.270","52.219-9","1852.216-80","PCD 25-16","PCD 26-02","sole source","JOFOC","subcontracting plan","QASP","price negotiation","source selection","data rights","SBIR"].map(q => (
              <button key={q} onClick={() => { setQuery(q); doSearch(q); }}
                style={{ padding:"3px 10px", borderRadius:20, fontSize:10, cursor:"pointer",
                  background:C.bg3, border:`1px solid ${C.border}`, color:C.muted,
                  fontFamily:FONT }}>
                {q}
              </button>
            ))}
          </div>

          {searchMsg && (
            <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>{searchMsg}</div>
          )}

          {results.map((r, i) => {
            const colors = DOC_TYPE_COLORS[r.doc_type] || { bg:"#f3f4f6", text:"#374151" };
            const isOpen = expanded === i;
            return (
              <div key={r.id || i} style={{ background:C.bg2, border:`1px solid ${C.border}`,
                borderRadius:10, marginBottom:10, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", cursor:"pointer",
                  borderBottom: isOpen ? `1px solid ${C.border}` : "none" }}
                  onClick={() => setExpanded(isOpen ? null : i)}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <span style={{ background:colors.bg, color:colors.text,
                      padding:"2px 8px", borderRadius:12, fontSize:9, fontWeight:"600",
                      textTransform:"uppercase", letterSpacing:"0.5px", flexShrink:0 }}>
                      {r.doc_type}
                    </span>
                    {r.section && (
                      <span style={{ fontSize:11, fontWeight:"600", color:C.blue,
                        fontFamily:"monospace" }}>
                        {r.section}
                      </span>
                    )}
                    <span style={{ fontSize:11, color:C.muted, flexShrink:0, marginLeft:"auto" }}>
                      {r.source}
                    </span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:"500", color:C.text, marginBottom:3 }}>
                    {r.title?.length > 100 ? r.title.slice(0,100)+"..." : r.title}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>
                    {r.content?.slice(0,160)}...
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding:"14px 16px", background:C.bg3 }}>
                    <pre style={{ fontSize:11, color:C.text, whiteSpace:"pre-wrap",
                      lineHeight:1.7, fontFamily:"ui-monospace,'Cascadia Code',monospace",
                      margin:0, maxHeight:400, overflow:"auto" }}>
                      {r.content}
                    </pre>
                    {r.keywords && (
                      <div style={{ fontSize:10, color:C.muted, marginTop:8 }}>
                        Citations: {r.keywords}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!searching && results.length === 0 && query && !searchMsg.includes("result") && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
              <div style={{ fontSize:24, marginBottom:8 }}>🔍</div>
              <div style={{ fontSize:13 }}>Search the regulatory knowledge base above.</div>
              <div style={{ fontSize:11, marginTop:4 }}>
                Try clause numbers (1852.215-84), section citations (1805.303), or topic keywords.
              </div>
            </div>
          )}

          {!query && results.length === 0 && (
            <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10,
              padding:"20px 24px" }}>
              <div style={{ fontSize:12, fontWeight:"500", color:C.text, marginBottom:10 }}>
                What's in the knowledge base
              </div>
              {[
                ["NFS 2026 Edition", "NFS", "Full NASA FAR Supplement current through PCD 26-03A"],
                ["NFS Companion Guide", "NFS_CG", "Interim companion guide with procedural guidance"],
                ["RFO FAR (Mar 16 2026)", "RFO_FAR", "Revolutionary FAR Overhaul deviated text"],
                ["FAR Strategic Acq. Guide", "FAR_SAG", "Non-statutory FAR content guidance"],
                ["PCDs — all active", "PCD", "Procurement Class Deviations 25-03 through 26-03A"],
                ["PICs — all active", "PIC", "Procurement Information Circulars"],
                ["PNs — all active", "PN", "Procurement Notices 22-14 through 25-01"],
                ["OP Templates (111)", "TEMPLATE", "All agency-wide procurement templates"],
                ["Procurement Guides", "GUIDE", "Source selection, pricing, market research, AI guardrails"],
                ["SF / DD / NASA Forms", "FORM", "Standard forms and DD forms"],
              ].map(([name, count, desc]) => (
                <div key={name} style={{ display:"flex", gap:12, padding:"8px 0",
                  borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ minWidth:160, fontSize:12, fontWeight:"500", color:C.blue }}>{name}</div>
                  <div style={{ minWidth:80, fontSize:11, color:C.green, fontWeight:"500" }}>{count}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{desc}</div>
                </div>
              ))}
              <div style={{ fontSize:11, color:C.muted, marginTop:10, lineHeight:1.5 }}>
                If search returns no results, use the Seed / Admin tab to load the knowledge base.
                This only needs to be done once.
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEED TAB */}
      {tab === "seed" && (
        <div style={{ maxWidth:600 }}>
          <div style={{ background:"#fff8e6", border:"1px solid #f5c542", borderRadius:8,
            padding:"10px 14px", marginBottom:16, fontSize:11, color:"#7a4a00", lineHeight:1.5 }}>
            <strong>Admin function.</strong> Seeds the Supabase knowledge base with 2,770 regulatory
            chunks from the NFS, NFS Companion Guide, all active PCDs, PICs, and PNs.
            This only needs to be done once — or after major regulatory updates.
          </div>

          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10,
            padding:"20px" }}>
            <div style={{ fontSize:13, fontWeight:"500", color:C.text, marginBottom:12 }}>
              Seed Regulatory Knowledge Base
            </div>

            <div style={{ fontSize:11, color:C.muted, marginBottom:16, lineHeight:1.6 }}>
              Reads all files from the CPAS Regulatory Library Google Drive folder, extracts text
              by file type (PDF, Word, Excel, PowerPoint), chunks everything, and inserts into
              Supabase. Requires <strong>GOOGLE_SERVICE_ACCOUNT_EMAIL</strong> and
              <strong>GOOGLE_PRIVATE_KEY</strong> environment variables in Netlify.
              Run this once — or whenever the Drive library is updated.<br/><br/>
              First time only — create the Supabase table with this SQL:
              <pre style={{ background:C.bg3, border:`1px solid ${C.border}`, borderRadius:6,
                padding:"10px 12px", marginTop:8, fontSize:10, whiteSpace:"pre-wrap",
                fontFamily:"ui-monospace,monospace", color:C.text }}>
{`CREATE TABLE IF NOT EXISTS cpas_regulatory_docs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  section TEXT,
  title TEXT,
  content TEXT NOT NULL,
  keywords TEXT,
  search_vec TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(source,'') || ' ' || coalesce(section,'') || ' ' ||
      coalesce(title,'') || ' ' || coalesce(keywords,'') || ' ' ||
      coalesce(content,'')
    )
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reg_search_idx
  ON cpas_regulatory_docs USING GIN(search_vec);
CREATE INDEX IF NOT EXISTS reg_section_idx
  ON cpas_regulatory_docs (section);
GRANT SELECT, INSERT, DELETE ON cpas_regulatory_docs TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE cpas_regulatory_docs_id_seq TO anon, authenticated;`}
              </pre>
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:8,
              fontSize:12, color:C.text, cursor:"pointer", marginBottom:16 }}>
              <input type="checkbox" checked={clearFirst}
                onChange={e => setClearFirst(e.target.checked)} />
              Clear existing records before seeding (re-seed)
            </label>

            {seedStatus === "idle" && (
              <button onClick={runSeed}
                style={{ background:C.blue, border:"none", color:"#fff", padding:"11px 24px",
                  borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:"500", fontFamily:FONT }}>
                Index from Google Drive
              </button>
            )}

            {(seedStatus === "loading" || seedStatus === "seeding") && (
              <div>
                <div style={{ background:C.bg3, borderRadius:8, height:8, marginBottom:8,
                  overflow:"hidden" }}>
                  <div style={{ background:C.blue, height:"100%", width:`${pct}%`,
                    transition:"width 0.3s ease", borderRadius:8 }} />
                </div>
                <div style={{ fontSize:12, color:C.muted }}>{seedMsg}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
                  {seedProgress.done.toLocaleString()} / {seedProgress.total.toLocaleString()} chunks
                  {pct > 0 && ` (${pct}%)`}
                </div>
              </div>
            )}

            {seedStatus === "done" && (
              <div>
                <div style={{ background:"#e1f5ee", border:"1px solid #9fe1cb", borderRadius:8,
                  padding:"10px 14px", fontSize:12, color:C.green, marginBottom:12 }}>
                  {seedMsg}
                </div>
                <button onClick={() => { setSeedStatus("idle"); setSeedMsg(""); setSeedProgress({done:0,total:0,errors:0}); }}
                  style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted,
                    padding:"8px 16px", borderRadius:7, cursor:"pointer", fontSize:11, fontFamily:FONT }}>
                  Reset
                </button>
              </div>
            )}

            {seedStatus === "error" && (
              <div>
                <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8,
                  padding:"10px 14px", fontSize:12, color:"#b91c1c", marginBottom:12 }}>
                  {seedMsg}
                </div>
                <button onClick={() => { setSeedStatus("idle"); setSeedMsg(""); }}
                  style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted,
                    padding:"8px 16px", borderRadius:7, cursor:"pointer", fontSize:11, fontFamily:FONT }}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
