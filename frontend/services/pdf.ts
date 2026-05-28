import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { GeneratedPaper } from "@/types/assignment";

const margin = 54;
const pageWidth = 595.28;
const pageHeight = 841.89;

interface PdfRenderingContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
}

// Prevents standard PDF fonts from throwing "WinAnsiEncoding cannot encode character" on AI smart quotes & math symbols
function sanitizeTextForPdf(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return "";
  const str = String(text);
  return str
    .replace(/[\u201c\u201d]/g, '"') // smart double quotes
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u2013\u2014]/g, "-") // en-dash and em-dash
    .replace(/\u2212/g, "-")         // minus sign
    .replace(/\u00b0/g, " degrees ") // degree symbol
    .replace(/[\u2026]/g, "...")     // ellipsis
    .replace(/[^\x00-\x7F\u00A0-\u00FF]/g, "?"); // replace any non-WinAnsi character with ?
}

function drawWrappedText(
  ctx: PdfRenderingContext,
  text: string,
  x: number,
  maxWidth: number,
  size: number,
  font: PDFFont,
  lineGap = 5
) {
  const sanitizedText = sanitizeTextForPdf(text);
  const words = sanitizedText.split(" ");
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

  lines.forEach((line) => {
    const lineHeight = size + lineGap;
    if (ctx.y < margin + lineHeight) {
      ctx.page = ctx.pdfDoc.addPage([pageWidth, pageHeight]);
      ctx.y = pageHeight - margin;
    }

    ctx.page.drawText(line, {
      x,
      y: ctx.y,
      size,
      font,
      color: rgb(0.1, 0.1, 0.1)
    });

    ctx.y -= lineHeight;
  });
}

export async function exportPaperAsPdf(paper: GeneratedPaper) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ctx: PdfRenderingContext = {
    pdfDoc,
    page: pdfDoc.addPage([pageWidth, pageHeight]),
    y: pageHeight - margin
  };

  const drawHeader = () => {
    ctx.page.drawText(sanitizeTextForPdf(paper.schoolName), { x: margin, y: ctx.y, size: 16, font: bold, color: rgb(0.08, 0.08, 0.08) });
    ctx.y -= 26;
    ctx.page.drawText(sanitizeTextForPdf(`Subject: ${paper.subject}`), { x: margin, y: ctx.y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) });
    ctx.page.drawText(sanitizeTextForPdf(`Class: ${paper.grade}`), { x: margin + 170, y: ctx.y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) });
    ctx.page.drawText(sanitizeTextForPdf(`Maximum Marks: ${paper.maximumMarks}`), { x: margin + 340, y: ctx.y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) });
    ctx.y -= 20;
    ctx.page.drawText(sanitizeTextForPdf(`Time Allowed: ${paper.timeAllowed}`), { x: margin, y: ctx.y, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) });
    ctx.y -= 26;
    
    // Draw names/roll numbers entry boxes
    ctx.page.drawText("Name: __________________________", { x: margin, y: ctx.y, size: 9, font: regular, color: rgb(0.4, 0.4, 0.4) });
    ctx.page.drawText("Roll Number: ______________", { x: margin + 250, y: ctx.y, size: 9, font: regular, color: rgb(0.4, 0.4, 0.4) });
    ctx.y -= 16;
    ctx.page.drawText("Class/Section: ______________", { x: margin, y: ctx.y, size: 9, font: regular, color: rgb(0.4, 0.4, 0.4) });
    ctx.y -= 22;

    // Draw header horizontal line
    ctx.page.drawLine({
      start: { x: margin, y: ctx.y },
      end: { x: pageWidth - margin, y: ctx.y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85)
    });
    ctx.y -= 20;
  };

  const ensureSpace = (space: number) => {
    if (ctx.y < margin + space) {
      ctx.page = ctx.pdfDoc.addPage([pageWidth, pageHeight]);
      ctx.y = pageHeight - margin;
    }
  };

  // Draw initial header
  drawHeader();

  // Print sections & questions
  paper.sections.forEach((section) => {
    ensureSpace(60);
    ctx.page.drawText(sanitizeTextForPdf(section.name), { x: margin, y: ctx.y, size: 12, font: bold, color: rgb(0.08, 0.08, 0.08) });
    ctx.y -= 16;
    
    drawWrappedText(ctx, section.instruction, margin, pageWidth - margin * 2, 9, regular, 3);
    ctx.y -= 8;

    section.questions.forEach((question, index) => {
      ensureSpace(50);
      
      const diffLabel = question.difficulty ? `[${question.difficulty.toUpperCase()}] ` : "";
      const questionText = `${index + 1}. ${diffLabel}${question.question} [${question.marks} Marks]`;
      drawWrappedText(ctx, questionText, margin, pageWidth - margin * 2, 9.5, regular, 4);
      ctx.y -= 4;

      if (question.options?.length) {
        ensureSpace(30);
        // MCQ Indented blocks
        const optionsText = `Options: ${question.options.join("   |   ")}`;
        drawWrappedText(ctx, optionsText, margin + 18, pageWidth - margin * 2 - 18, 8.5, regular, 3);
        ctx.y -= 4;
      }
    });

    ctx.y -= 12;
  });

  // Print Answer Key
  ensureSpace(90);
  ctx.y -= 10;
  ctx.page.drawLine({
    start: { x: margin, y: ctx.y },
    end: { x: pageWidth - margin, y: ctx.y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85)
  });
  ctx.y -= 20;

  ctx.page.drawText("Answer Key (For Teacher Reference)", { x: margin, y: ctx.y, size: 12, font: bold, color: rgb(0.08, 0.08, 0.08) });
  ctx.y -= 18;

  paper.answerKey.forEach((answer) => {
    ensureSpace(30);
    drawWrappedText(ctx, answer, margin, pageWidth - margin * 2, 9, regular, 3);
    ctx.y -= 2;
  });

  // Global Footer & Page Numbering across all generated pages
  const pages = pdfDoc.getPages();
  pages.forEach((p, index) => {
    // Horizontal divider
    p.drawLine({
      start: { x: margin, y: margin - 10 },
      end: { x: pageWidth - margin, y: margin - 10 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9)
    });
    
    // Left side notice
    p.drawText("Generated by VedaAI Assessment Creator", {
      x: margin,
      y: margin - 22,
      size: 7.5,
      font: regular,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Right side page number
    p.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: pageWidth - margin - 50,
      y: margin - 22,
      size: 7.5,
      font: regular,
      color: rgb(0.5, 0.5, 0.5)
    });
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as any], { type: "application/pdf" });
  
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${paper.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-question-paper.pdf`;
  anchor.click();
  
  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
