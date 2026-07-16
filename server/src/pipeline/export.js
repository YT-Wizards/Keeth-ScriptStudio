import { Document, Packer, Paragraph, TextRun } from 'docx';

export function toTxt(script) {
  return script.replace(/\r?\n/g, '\r\n');
}

export async function toDocx(title, script) {
  const paragraphs = script
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        new Paragraph({
          children: [new TextRun({ text: p.replace(/\s*\n\s*/g, ' '), size: 24 })],
          spacing: { after: 240 },
        })
    );

  const doc = new Document({
    sections: [{ children: paragraphs }],
    title,
  });
  return Packer.toBuffer(doc);
}
