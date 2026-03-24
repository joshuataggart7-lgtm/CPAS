const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, WidthType, ShadingType, LevelFormat, Header, Footer,
  TabStopType, Table, TableRow, TableCell } = require("docx");

function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map(p => p.startsWith("**") && p.endsWith("**")
    ? new TextRun({ text: p.slice(2,-2), bold: true, font:"Arial", size:22 })
    : new TextRun({ text: p, font:"Arial", size:22 })
  ).filter(r => r._P?.children?.[0]?.text !== "" || true);
}

function parseContent(text) {
  const children = [];
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim() === "---") continue;
    if (line.startsWith("# ")) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{before:300,after:100},
        children:[new TextRun({text:line.slice(2).trim(),bold:true,font:"Arial",size:28,color:"1F4E79"})] }));
    } else if (line.startsWith("## ")) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{before:200,after:80},
        children:[new TextRun({text:line.slice(3).trim(),bold:true,font:"Arial",size:24,color:"2E75B6"})] }));
    } else if (line.startsWith("### ")) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing:{before:160,after:60},
        children:[new TextRun({text:line.slice(4).trim(),bold:true,font:"Arial",size:22,color:"2E75B6"})] }));
    } else if (line.trim().startsWith("| ")) {
      // Skip table lines - render as plain text
      children.push(new Paragraph({ spacing:{before:40,after:40},
        children:[new TextRun({text:line.replace(/\|/g," | ").trim(),font:"Courier New",size:18,color:"333333"})] }));
    } else if (line.match(/^\s*[-*] /)) {
      children.push(new Paragraph({ numbering:{reference:"bullets",level:0}, spacing:{before:40,after:40},
        children: parseInline(line.replace(/^\s*[-*] /,"")) }));
    } else if (line.trim()) {
      children.push(new Paragraph({ spacing:{before:60,after:60}, children: parseInline(line) }));
    }
  }
  return children;
}

exports.handler = async (event) => {
  const cors = { "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" };
  if (event.httpMethod === "OPTIONS") return { statusCode:200, headers:cors, body:"" };
  if (event.httpMethod !== "POST") return { statusCode:405, headers:cors, body:"Method Not Allowed" };

  try {
    const { text, docType, intake, filename } = JSON.parse(event.body);
    const center = intake?.center || "NASA";
    const title = intake?.reqTitle || "Requirement";
    const value = intake?.value ? "$"+Number(intake.value).toLocaleString() : "TBD";

    const doc = new Document({
      numbering: { config: [{
        reference:"bullets",
        levels:[{level:0,format:LevelFormat.BULLET,text:"\u2022",alignment:AlignmentType.LEFT,
          style:{paragraph:{indent:{left:720,hanging:360}},run:{font:"Arial",size:22}}}]
      }]},
      styles: {
        default:{ document:{ run:{ font:"Arial", size:22 } } },
        paragraphStyles:[
          {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,
            run:{size:28,bold:true,font:"Arial",color:"1F4E79"},
            paragraph:{spacing:{before:300,after:100},outlineLevel:0}},
          {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,
            run:{size:24,bold:true,font:"Arial",color:"2E75B6"},
            paragraph:{spacing:{before:200,after:80},outlineLevel:1}},
          {id:"Heading3",name:"Heading 3",basedOn:"Normal",next:"Normal",quickFormat:true,
            run:{size:22,bold:true,font:"Arial",color:"2E75B6"},
            paragraph:{spacing:{before:160,after:60},outlineLevel:2}}
        ]
      },
      sections:[{
        properties:{ page:{ size:{width:12240,height:15840}, margin:{top:1440,right:1440,bottom:1440,left:1440} } },
        headers:{ default: new Header({ children:[
          new Paragraph({ border:{bottom:{style:BorderStyle.SINGLE,size:6,color:"1F4E79",space:4}},
            spacing:{after:120},
            children:[
              new TextRun({text:"NASA "+center+" — ACQUISITION DOCUMENT",font:"Arial",size:18,color:"1F4E79",bold:true}),
              new TextRun({text:"    SOURCE SELECTION SENSITIVE",font:"Arial",size:18,color:"CC0000",bold:true})
            ]})
        ]})},
        children:[
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:480,after:80},
            children:[new TextRun({text:"NATIONAL AERONAUTICS AND SPACE ADMINISTRATION",font:"Arial",size:20,bold:true,color:"1F4E79"})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:80},
            children:[new TextRun({text:center,font:"Arial",size:20,color:"1F4E79"})]}),
          new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:12,color:"1F4E79",space:4}},spacing:{before:0,after:240}}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:240,after:80},
            children:[new TextRun({text:docType,font:"Arial",size:36,bold:true,color:"1F4E79"})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:120},
            children:[new TextRun({text:title,font:"Arial",size:26,color:"333333"})]}),
          new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:240},
            children:[new TextRun({text:"Estimated Value: "+value+" | NAICS: "+(intake?.naics||"TBD")+" | Contract Type: "+(intake?.contractType||"FFP"),font:"Arial",size:20,color:"666666"})]}),
          new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:6,color:"CCCCCC",space:4}},spacing:{before:0,after:360}}),
          ...parseContent(text)
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const safeTitle = (title).replace(/[^a-zA-Z0-9]/g,"_").substring(0,30);
    const outFilename = filename || (docType.replace(/[^a-zA-Z0-9]/g,"_")+"_"+safeTitle+".docx");

    return {
      statusCode:200,
      headers:{ ...cors, "Content-Type":"application/json" },
      body: JSON.stringify({ docx: buffer.toString("base64"), filename: outFilename })
    };
  } catch(err) {
    return { statusCode:500, headers:cors, body: JSON.stringify({ error: err.message }) };
  }
};
