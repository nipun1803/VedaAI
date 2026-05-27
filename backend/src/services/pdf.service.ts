import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { GeneratedPaperModel, type GeneratedPaperDocument } from "@/models/GeneratedPaper.model.js";
import { AppError } from "@/utils/AppError.js";

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 54;

interface PdfRenderingContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  y: number;
}

export async function generatePdfForPaper(paper: GeneratedPaperDocument) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const ctx: PdfRenderingContext = {
    pdfDoc,
    page: pdfDoc.addPage([pageWidth, pageHeight]),
    y: pageHeight - margin
  };

  const ensureSpace = (space: number) => {
    if (ctx.y < margin + space) {
      ctx.page = ctx.pdfDoc.addPage([pageWidth, pageHeight]);
      ctx.y = pageHeight - margin;
    }
  };

  ctx.page.drawText(paper.schoolName, { x: margin, y: ctx.y, size: 17, font: bold, color: rgb(0.08, 0.08, 0.08) });
  ctx.y -= 28;
  ctx.page.drawText(`Subject: ${paper.subject}`, { x: margin, y: ctx.y, size: 11, font: regular });
  ctx.page.drawText(`Class: ${paper.grade}`, { x: margin + 170, y: ctx.y, size: 11, font: regular });
  ctx.page.drawText(`Maximum Marks: ${paper.maximumMarks}`, { x: margin + 340, y: ctx.y, size: 11, font: regular });
  ctx.y -= 26;
  ctx.page.drawText(`Time Allowed: ${paper.timeAllowed}`, { x: margin, y: ctx.y, size: 11, font: regular });
  ctx.y -= 32;
  ctx.page.drawText("Name: __________________________", { x: margin, y: ctx.y, size: 10, font: regular });
  ctx.page.drawText("Roll Number: ______________", { x: margin + 255, y: ctx.y, size: 10, font: regular });
  ctx.y -= 18;
  ctx.page.drawText("Class/Section: ______________", { x: margin, y: ctx.y, size: 10, font: regular });
  ctx.y -= 30;

  paper.sections.forEach((section) => {
    ensureSpace(90);
    ctx.page.drawText(section.name, { x: margin, y: ctx.y, size: 13, font: bold });
    ctx.y -= 19;
    drawWrappedText(ctx, section.instruction, margin, pageWidth - margin * 2, 9, regular, 3);
    ctx.y -= 6;

    section.questions.forEach((question, index) => {
      ensureSpace(70);
      drawWrappedText(
        ctx,
        `${index + 1}. [${question.difficulty.toUpperCase()}] ${question.question} [${question.marks} Marks]`,
        margin,
        pageWidth - margin * 2,
        10,
        regular,
        4
      );
      ctx.y -= 4;

      if (question.options?.length) {
        drawWrappedText(
          ctx,
          `Options: ${question.options.join(" | ")}`,
          margin + 16,
          pageWidth - margin * 2 - 16,
          9,
          regular,
          3
        );
        ctx.y -= 4;
      }
    });

    ctx.y -= 10;
  });

  ensureSpace(110);
  ctx.page.drawText("Answer Key", { x: margin, y: ctx.y, size: 13, font: bold });
  ctx.y -= 18;
  paper.answerKey.forEach((answer) => {
    ensureSpace(34);
    drawWrappedText(ctx, answer, margin, pageWidth - margin * 2, 9, regular, 3);
    ctx.y -= 2;
  });

  return Buffer.from(await pdfDoc.save());
}

export async function savePdfToPaper(paperId: string) {
  const paper = await GeneratedPaperModel.findById(paperId);
  if (!paper) {
    throw new AppError("Generated paper not found", 404, "PAPER_NOT_FOUND");
  }

  const pdfBuffer = await generatePdfForPaper(paper);
  const pdfFileName = `${paper.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-question-paper.pdf`;

  paper.pdfBuffer = pdfBuffer;
  paper.pdfFileName = pdfFileName;
  await paper.save();

  return paper;
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

