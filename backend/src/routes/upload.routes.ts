import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { AppError } from "@/utils/AppError.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400, "NO_FILE");
    }

    let textContext = "";

    try {
      if (req.file.mimetype === "application/pdf") {
        const parser = new PDFParse({ data: req.file.buffer });
        const data = await parser.getText();
        textContext = data.text;
      } else if (req.file.mimetype === "text/plain") {
        textContext = req.file.buffer.toString("utf-8");
      } else {
        throw new AppError("Unsupported file type. Only PDF and TXT are allowed.", 400, "UNSUPPORTED_FILE");
      }
    } catch (error) {
      throw new AppError("Failed to parse document", 500, "PARSE_ERROR");
    }

    // Limit text context to avoid token bloat (e.g. max 15000 chars)
    if (textContext.length > 20000) {
      textContext = textContext.substring(0, 20000) + "... [truncated]";
    }

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        textContext
      }
    });
  })
);

export const uploadRoutes = router;
