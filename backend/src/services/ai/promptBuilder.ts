import type { AssignmentDocument } from "@/models/Assignment.model.js";

// Basic sanitizer to avoid simple prompt injection overrides
function sanitizeInstructions(text: string) {
  return text.replace(/(ignore previous|forget previous|system prompt|new instruction|act as)/gi, "[redacted]");
}

export function buildQuestionPaperPrompt(assignment: AssignmentDocument) {
  const totalQuestions = assignment.questionConfigs.reduce((sum, config) => sum + config.count, 0);
  const totalMarks = assignment.questionConfigs.reduce((sum, config) => sum + config.count * config.marks, 0);

  const safeInstructions = sanitizeInstructions(assignment.instructions || "None");
  let fileContextSnippet = "";
  
  if (assignment.fileContext && assignment.fileContext.trim().length > 0) {
    const cappedContext = assignment.fileContext.length > 4000
      ? assignment.fileContext.substring(0, 4000) + "\n... [truncated to fit model token limits] ..."
      : assignment.fileContext;
    fileContextSnippet = `\nReference Material for Context:\n\"\"\"\n${sanitizeInstructions(cappedContext)}\n\"\"\"\n`;
  }

  return `You are VedaAI, an expert school assessment designer.

Create a question paper as strict JSON only. Do not include markdown fences, commentary, or prose outside JSON.

Assignment:
- Title: ${assignment.title}
- Subject: ${assignment.subject}
- Class / Grade: ${assignment.grade}
- Due date: ${assignment.dueDate.toISOString()}
- Optional file reference: ${assignment.fileName ?? "None"}
- Additional teacher instructions: ${safeInstructions}
${fileContextSnippet}
Question configuration:
${assignment.questionConfigs
  .map((config) => `- ${config.type}: ${config.count} questions, ${config.marks} marks each`)
  .join("\n")}

Difficulty distribution:
- Easy: ${assignment.difficultyDistribution.easy}%
- Medium: ${assignment.difficultyDistribution.medium}%
- Hard: ${assignment.difficultyDistribution.hard}%

Totals expected:
- Total questions: ${totalQuestions}
- Total marks: ${totalMarks}

Return JSON in this exact shape:
{
  "title": "Assessment title",
  "sections": [
    {
      "name": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "question": "Question text",
          "difficulty": "easy | medium | hard",
          "marks": 5,
          "type": "MCQ | Short Answer | Long Answer | True/False",
          "options": ["A", "B", "C", "D"],
          "answer": "Concise expected answer"
        }
      ]
    }
  ]
}

Rules:
- Use only valid JSON.
- Include every configured question type.
- Marks must match the configured marks per question.
- Use age-appropriate language for ${assignment.grade}.
- Avoid duplicated questions.
- MCQ questions must include four options and an answer.
- True/False questions must include answer as "True" or "False".
- Preserve the requested difficulty balance as closely as possible.`;
}

