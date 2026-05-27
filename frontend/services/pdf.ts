import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { GeneratedPaper } from "@/types/assignment";

const margin = 54;
const pageWidth = 595.28;
const pageHeight = 841.89;

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: PDFFont,
  lineGap = 5
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });

  if (current) lines.push(current);

  lines.forEach((line, index) => {
    page.drawText(line, { x, y: y - index * (size + lineGap), size, font, color: rgb(0.1, 0.1, 0.1) });
  });

  return y - lines.length * (size + lineGap);
}

export async function exportPaperAsPdf(paper: GeneratedPaper) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawHeader = () => {
    page.drawText(paper.schoolName, { x: margin, y, size: 17, font: bold, color: rgb(0.08, 0.08, 0.08) });
    y -= 28;
    page.drawText(`Subject: ${paper.subject}`, { x: margin, y, size: 11, font: regular });
    page.drawText(`Class: ${paper.grade}`, { x: margin + 170, y, size: 11, font: regular });
    page.drawText(`Maximum Marks: ${paper.maximumMarks}`, { x: margin + 340, y, size: 11, font: regular });
    y -= 26;
    page.drawText(`Time Allowed: ${paper.timeAllowed}`, { x: margin, y, size: 11, font: regular });
    y -= 32;
    page.drawText("Name: __________________________", { x: margin, y, size: 10, font: regular });
    page.drawText("Roll Number: ______________", { x: margin + 255, y, size: 10, font: regular });
    y -= 18;
    page.drawText("Class/Section: ______________", { x: margin, y, size: 10, font: regular });
    y -= 30;
  };

  const ensureSpace = (space = 70) => {
    if (y < margin + space) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  drawHeader();

  paper.sections.forEach((section) => {
    ensureSpace(90);
    page.drawText(section.name, { x: margin, y, size: 13, font: bold, color: rgb(0.08, 0.08, 0.08) });
    y -= 19;
    y = drawWrappedText(page, section.instruction, margin, y, pageWidth - margin * 2, 9, regular, 3) - 6;

    section.questions.forEach((question, index) => {
      ensureSpace(70);
      const questionLine = `${index + 1}. [${question.difficulty.toUpperCase()}] ${question.question} [${question.marks} Marks]`;
      y = drawWrappedText(page, questionLine, margin, y, pageWidth - margin * 2, 10, regular, 4) - 4;
      if (question.options?.length) {
        y = drawWrappedText(page, `Options: ${question.options.join(" | ")}`, margin + 16, y, pageWidth - margin * 2 - 16, 9, regular, 3) - 4;
      }
    });

    y -= 10;
  });

  ensureSpace(120);
  page.drawText("Answer Key", { x: margin, y, size: 13, font: bold });
  y -= 18;
  paper.answerKey.forEach((answer) => {
    ensureSpace(40);
    y = drawWrappedText(page, answer, margin, y, pageWidth - margin * 2, 9, regular, 3) - 2;
  });

  const bytes = await pdfDoc.save();
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${paper.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-question-paper.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
