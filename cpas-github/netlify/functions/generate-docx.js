const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber, TabStopType, TabStopPosition
} = require('docx');

// Parse markdown-ish text into docx paragraphs
function parseDocument(text, intake) {
  const lines = text.split('\n');
  const children = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines but add spacing
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1F4E79', space: 4 } },
        spacing: { before: 120, after: 120 }
      }));
      i++;
      continue;
    }

    // H1: # Title  or  # TITLE
    if (line.startsWith('# ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: line.slice(2).trim(), bold: true, font: 'Arial', size: 32, color: '1F4E79' })],
        spacing: { before: 360, after: 120 }
      }));
      i++;
      continue;
    }

    // H2: ## Title
    if (line.startsWith('## ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: line.slice(3).trim(), bold: true, font: 'Arial', size: 26, color: '2E75B6' })],
        spacing: { before: 240, after: 80 }
      }));
      i++;
      continue;
    }

    // H3: ### Title
    if (line.startsWith('### ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: line.slice(4).trim(), bold: true, font: 'Arial', size: 24, color: '2E75B6' })],
        spacing: { before: 200, after: 60 }
      }));
      i++;
      continue;
    }

    // Table detection: starts with |
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!lines[i].trim().match(/^\|[-| ]+\|$/)) { // skip separator rows
          tableLines.push(lines[i]);
        }
        i++;
      }

      if (tableLines.length > 0) {
        const rows = tableLines.map((tl, rowIdx) => {
          const cells = tl.split('|').filter((_, ci) => ci > 0 && ci < tl.split('|').length - 1);
          const isHeader = rowIdx === 0;
          return new TableRow({
            tableHeader: isHeader,
            children: cells.map(cell => new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
              },
              shading: isHeader ? { fill: 'D6E4F0', type: ShadingType.CLEAR } : { fill: 'FFFFFF', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({
                children: [new TextRun({ text: cell.trim(), bold: isHeader, font: 'Arial', size: 20 })]
              })]
            }))
          });
        });

        const colCount = tableLines[0].split('|').filter((_, ci, arr) => ci > 0 && ci < arr.length - 1).length;
        const colWidth = Math.floor(9360 / colCount);
        children.push(new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: Array(colCount).fill(colWidth),
          rows
        }));
        children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      }
      continue;
    }

    // Bullet: starts with - or *
    if (line.match(/^[\s]*[-*] /)) {
      const indent = line.search(/[-*]/);
      const level = Math.min(Math.floor(indent / 2), 2);
      const text = line.replace(/^[\s]*[-*] /, '');
      children.push(new Paragraph({
        numbering: { reference: 'bullets', level },
        children: parseInline(text),
        spacing: { before: 40, after: 40 }
      }));
      i++;
      continue;
    }

    // Numbered list: starts with digit.
    if (line.match(/^[\s]*\d+\. /)) {
      const text = line.replace(/^[\s]*\d+\. /, '');
      children.push(new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        children: parseInline(text),
        spacing: { before: 40, after: 40 }
      }));
      i++;
      continue;
    }

    // Bold label line: **Label:** value
    if (line.trim().startsWith('**') && line.includes('**')) {
      children.push(new Paragraph({
        children: parseInline(line),
        spacing: { before: 80, after: 40 }
      }));
      i++;
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      children.push(new Paragraph({
        children: parseInline(line),
        spacing: { before: 60, after: 60 }
      }));
    }
    i++;
  }

  return children;
}

// Parse inline markdown (bold, italic) into TextRun array
function parseInline(text) {
  const runs = [];
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: 'Arial', size: 22 }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true, font: 'Arial', size: 22 }));
    } else if (part) {
      runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: text, font: 'Arial', size: 22 })];
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const { text, docType, intake, filename } = JSON.parse(event.body);

    const centerName = intake?.center || 'NASA';
    const reqTitle = intake?.reqTitle || 'Requirement';
    const value = intake?.value ? '$' + intake.value.toLocaleString() : 'TBD';
    const naics = intake?.naics || '541330';

    // Build document
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'bullets',
            levels: [
              { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: 'Arial', size: 22 } } },
              { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 1080, hanging: 360 } }, run: { font: 'Arial', size: 22 } } },
              { level: 2, format: LevelFormat.BULLET, text: '\u25AA', alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 1440, hanging: 360 } }, run: { font: 'Arial', size: 22 } } }
            ]
          },
          {
            reference: 'numbers',
            levels: [
              { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: 'Arial', size: 22 } } }
            ]
          }
        ]
      },
      styles: {
        default: {
          document: { run: { font: 'Arial', size: 22 } }
        },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 32, bold: true, font: 'Arial', color: '1F4E79' },
            paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 26, bold: true, font: 'Arial', color: '2E75B6' },
            paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
          { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 24, bold: true, font: 'Arial', color: '2E75B6' },
            paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 2 } }
        ]
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1F4E79', space: 4 } },
                spacing: { after: 120 },
                tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
                children: [
                  new TextRun({ text: 'NASA ' + centerName, font: 'Arial', size: 18, color: '1F4E79', bold: true }),
                  new TextRun({ text: '\t', font: 'Arial', size: 18 }),
                  new TextRun({ text: 'SOURCE SELECTION SENSITIVE', font: 'Arial', size: 18, color: 'CC0000', bold: true })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: '1F4E79', space: 4 } },
                spacing: { before: 120 },
                tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
                children: [
                  new TextRun({ text: reqTitle.substring(0, 60), font: 'Arial', size: 18, color: '666666' }),
                  new TextRun({ text: '\tPage ', font: 'Arial', size: 18, color: '666666' }),
                  new PageNumber({ font: 'Arial', size: 18, color: '666666' })
                ]
              })
            ]
          })
        },
        children: [
          // Cover block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 120 },
            children: [new TextRun({ text: 'NATIONAL AERONAUTICS AND SPACE ADMINISTRATION', font: 'Arial', size: 20, bold: true, color: '1F4E79' })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [new TextRun({ text: centerName, font: 'Arial', size: 20, color: '1F4E79' })]
          }),
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '1F4E79', space: 4 } },
            spacing: { before: 0, after: 240 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 80 },
            children: [new TextRun({ text: docType, font: 'Arial', size: 36, bold: true, color: '1F4E79' })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: reqTitle, font: 'Arial', size: 26, color: '333333' })]
          }),
          // Metadata table
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3120, 6240],
            rows: [
              ['Estimated Value', value],
              ['NAICS Code', naics],
              ['Contract Type', intake?.contractType || 'FFP'],
              ['Competition', intake?.competitionStrategy || 'TBD'],
              ['Period of Performance', intake?.pop || 'TBD'],
              ['Date Prepared', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]
            ].map(([label, val], idx) => new TableRow({
              children: [
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
                  shading: { fill: 'D6E4F0', type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: 'Arial', size: 20 })] })]
                }),
                new TableCell({
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
                  shading: { fill: idx % 2 === 0 ? 'FFFFFF' : 'F5F9FF', type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  width: { size: 6240, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: String(val), font: 'Arial', size: 20 })] })]
                })
              ]
            }))
          }),
          new Paragraph({ text: '', spacing: { after: 480 } }),
          // Document content
          ...parseDocument(text, intake)
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = buffer.toString('base64');

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ docx: base64, filename: filename || 'cpas-document.docx' })
    };

  } catch (err) {
    console.error('generate-docx error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message, stack: err.stack?.substring(0, 500) })
    };
  }
};
