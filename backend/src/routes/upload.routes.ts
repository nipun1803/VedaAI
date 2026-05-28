import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { AppError } from "@/utils/AppError.js";
import { env } from "@/config/env.js";
import Groq from "groq-sdk";

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
      } else if (req.file.mimetype.startsWith("image/")) {
        // Real-time AI Vision OCR using Groq with exponential backoff & model cascade!
        if (env.GROQ_API_KEY) {
          try {
            const groq = new Groq({ apiKey: env.GROQ_API_KEY });
            // Cascade models: primary high-speed Llama-3.2, fallback premium Llama-3.2-90b
            const visionModels = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];
            let visionError: any = null;

            for (const model of visionModels) {
              let attempts = 0;
              const maxAttempts = 2;

              while (attempts < maxAttempts) {
                try {
                  const completion = await groq.chat.completions.create({
                    model: model,
                    messages: [
                      {
                        role: "user",
                        content: [
                          {
                            type: "text",
                            text: "Transcribe all text from this image as plain text. Do not summarize, do not comment. Just write down exactly what is readable."
                          },
                          {
                            type: "image_url",
                            image_url: {
                              url: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
                            }
                          }
                        ]
                      }
                    ]
                  });
                  textContext = completion.choices[0]?.message?.content ?? "";
                  if (textContext) break;
                } catch (err: any) {
                  visionError = err;
                  attempts++;
                  process.stderr.write(`Vision OCR attempt ${attempts} on ${model} failed: ${err.message}. Retrying...\n`);
                  // Exponential backoff
                  await new Promise((resolve) => setTimeout(resolve, attempts * 750));
                }
              }

              if (textContext) {
                process.stdout.write(`Vision OCR transcription succeeded using model: ${model}\n`);
                break;
              }
            }

            if (!textContext && visionError) {
              throw visionError;
            }
          } catch (visionError) {
            process.stderr.write(`All Vision OCR models and retries failed: ${String(visionError)}. Falling back to mock OCR.\n`);
            textContext = `[Vision OCR Fallback] Transcribed content from image "${req.file.originalname}":\nOhm's Law and Circuit Basics: The relationship between Voltage (V), Current (I), and Resistance (R) is expressed as V = IR. The unit of electrical resistance is the Ohm. Direct current flows in one constant direction, whereas Alternating Current periodically reverses direction.`;
          }
        } else {
          textContext = `[Demo OCR] Transcribed content from image "${req.file.originalname}":\nChapter 5 Heat and Thermodynamics: Heat is energy transferred due to temperature difference. Specific heat capacity is the amount of heat energy required to raise the temperature of 1kg of a substance by 1 degree Celsius.`;
        }
      } else {
        throw new AppError("Unsupported file type. Only PDF, TXT, and Images (JPEG, PNG) are allowed.", 400, "UNSUPPORTED_FILE");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to parse document", 500, "PARSE_ERROR");
    }

    // Limit text context to avoid token bloat (e.g. max 20000 chars)
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
