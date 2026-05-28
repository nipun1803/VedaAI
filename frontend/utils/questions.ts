import type {
  Assignment,
  Difficulty,
  GeneratedPaper,
  GeneratedQuestion,
  QuestionType
} from "@/types/assignment";

const questionBank: Record<QuestionType, string[]> = {
  MCQ: [
    "Which of the following best defines the core principle of {topic} in the context of {subject}?",
    "Identify the correct statement regarding {topic} from the study of {subject}.",
    "What is the most accurate practical application of {topic}?",
    "Which observation or evidence supports the theoretical framework of {topic}?"
  ],
  "Short Answer": [
    "Define {topic} and explain its fundamental importance to {subject}.",
    "Describe one key mechanism through which {topic} operates.",
    "Provide a real-world example illustrating the impact of {topic}.",
    "Briefly distinguish between {topic} and other adjacent concepts in {subject}."
  ],
  "Long Answer": [
    "Explain the concept of {topic} in detail. Discuss its background, mechanisms, and real-life relevance to {subject}.",
    "Discuss the process and applications of {topic}. Support your answer with suitable examples and diagrams where applicable.",
    "Critically evaluate the significance of {topic} within the modern study of {subject}.",
    "Analyze how {topic} connects theoretical concepts with daily life observations."
  ],
  "True/False": [
    "The process of {topic} remains identical under all circumstances and environments.",
    "A comprehensive understanding of {topic} requires both theoretical formulas and empirical evidence.",
    "Theoretical principles of {topic} are directly applicable to solving everyday problems.",
    "The primary objective of analyzing {topic} is to examine its effects on related systems."
  ]
};

function pickDifficulty(index: number, total: number, assignment: Assignment): Difficulty {
  const ratio = ((index + 1) / Math.max(total, 1)) * 100;
  const { easy, medium } = assignment.difficultyDistribution;
  if (ratio <= easy) return "easy";
  if (ratio <= easy + medium) return "medium";
  return "hard";
}

function sectionName(index: number) {
  return `Section ${String.fromCharCode(65 + index)}`;
}

function instructionFor(type: QuestionType, marks: number) {
  if (type === "MCQ") return `Choose the correct option. Each question carries ${marks} mark(s).`;
  if (type === "True/False") return `Write True or False. Each question carries ${marks} mark(s).`;
  if (type === "Long Answer") return `Answer in detail. Each question carries ${marks} mark(s).`;
  return `Attempt all questions. Each question carries ${marks} mark(s).`;
}

function extractTopics(assignment: Assignment): string[] {
  const topicsList: string[] = [];

  // 1. If a file context (OCR transcript) exists, dynamically parse it to extract tailored topics!
  if (assignment.fileContext && assignment.fileContext.trim().length > 10) {
    const text = assignment.fileContext;
    
    // Extract key sentences or long phrases that contain main ideas
    const lines = text
      .split(/[.?!;\n]/)
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 15 &&
          s.length < 80 &&
          !s.includes("[Vision OCR") &&
          !s.includes("[Document OCR") &&
          !s.includes("[Demo OCR")
      );

    if (lines.length > 0) {
      lines.slice(0, 10).forEach((line) => {
        // Clean up sentences to make them suitable as topics
        const cleaned = line.replace(/^(Ohm's Law|Chapter \d+|Heat|Thermodynamics|Ocr|Demo):?/gi, "").trim();
        if (cleaned.length > 10) {
          topicsList.push(cleaned);
        }
      });
    }

    // Extract proper nouns or capitalized key terms
    const capitalizedWords = text.match(/[A-Z][a-z]{3,}/g);
    if (capitalizedWords && capitalizedWords.length > 0) {
      const uniqueWords = Array.from(new Set(capitalizedWords)).filter(
        (w) =>
          w !== "Vision" &&
          w !== "Fallback" &&
          w !== "Document" &&
          w !== "Demo" &&
          w !== "Transcribed" &&
          w !== "Ocr"
      );
      uniqueWords.slice(0, 8).forEach((w) => {
        topicsList.push(w);
      });
    }
  }

  // 2. Extract keywords directly from the assignment title
  if (assignment.title && assignment.title.trim().length > 3) {
    const titleWords = assignment.title
      .replace(/^(quiz on|test on|assignment on|chapter \d+:?|quiz|test|exam|exam paper):?/gi, "")
      .trim();
    if (titleWords.length > 3) {
      topicsList.push(titleWords);
    }
  }

  // 3. Fallback to smart subject-based default topics
  const subject = (assignment.subject || "").toLowerCase();
  if (subject.includes("sci") || subject.includes("phys") || subject.includes("chem") || subject.includes("bio")) {
    topicsList.push(
      "experimental observation",
      "scientific methodology",
      "empirical analysis",
      "data interpretation",
      "hypothesis formulation",
      "variables isolation"
    );
  } else if (subject.includes("math") || subject.includes("alg") || subject.includes("geom") || subject.includes("stat")) {
    topicsList.push(
      "algebraic equations",
      "geometric proofs",
      "statistical distributions",
      "arithmetic computation",
      "logical variables",
      "ratio calculations"
    );
  } else if (subject.includes("hist") || subject.includes("social") || subject.includes("civic") || subject.includes("geo")) {
    topicsList.push(
      "historical chronology",
      "primary resource verification",
      "socio-economic outcomes",
      "geographical mapping",
      "governance frameworks",
      "cultural transformation"
    );
  } else {
    topicsList.push(
      "foundational principles",
      "critical examinations",
      "thematic structures",
      "applied methodology",
      "theoretical models",
      "conceptual logic"
    );
  }

  // Filter unique, non-empty topics
  const unique = Array.from(new Set(topicsList.map((t) => t.trim()))).filter((t) => t.length > 0);
  return unique.length > 0 ? unique : ["conceptual analysis"];
}

function buildQuestion(
  assignment: Assignment,
  type: QuestionType,
  index: number,
  globalIndex: number,
  total: number,
  marks: number,
  extractedTopics: string[]
): GeneratedQuestion {
  const topic = extractedTopics[(globalIndex + index) % extractedTopics.length];
  const base =
    questionBank[type][(globalIndex + index) % questionBank[type].length]
      .replace("{subject}", assignment.subject)
      .replace("{topic}", topic);

  let options: string[] | undefined = undefined;
  let answer = "";

  if (type === "MCQ") {
    options = [
      `A clear, direct observation of ${topic}`,
      `An incorrect, random assumption regarding ${topic}`,
      `An unrelated aspect of standard ${assignment.subject}`,
      "None of the provided options are chemically or logically sound"
    ];
    answer = `A clear, direct observation of ${topic}`;
  } else if (type === "True/False") {
    answer = globalIndex % 2 === 0 ? "True" : "False";
  } else {
    answer = `The correct answer must describe ${topic} thoroughly, emphasizing its core processes, applications, and relationship to ${assignment.subject}.`;
  }

  return {
    id: `q-${assignment.id}-${globalIndex}`,
    question: base,
    difficulty: pickDifficulty(globalIndex, total, assignment),
    marks,
    type,
    options,
    answer
  };
}

export function createSamplePaper(assignment: Assignment): GeneratedPaper {
  const totalQuestions = assignment.questionConfigs.reduce((sum, item) => sum + item.count, 0);
  const extractedTopics = extractTopics(assignment);
  let runningIndex = 0;

  const sections = assignment.questionConfigs.map((config, sectionIndex) => {
    const questions = Array.from({ length: config.count }, (_, localIndex) => {
      runningIndex += 1;
      return buildQuestion(
        assignment,
        config.type,
        localIndex,
        runningIndex,
        totalQuestions,
        config.marks,
        extractedTopics
      );
    });

    return {
      id: `section-${assignment.id}-${sectionIndex}`,
      name: sectionName(sectionIndex),
      instruction: instructionFor(config.type, config.marks),
      questions
    };
  });

  const maximumMarks = sections.reduce(
    (total, section) =>
      total + section.questions.reduce((sectionTotal, question) => sectionTotal + question.marks, 0),
    0
  );

  return {
    id: `paper-${assignment.id}`,
    assignmentId: assignment.id,
    title: assignment.title,
    schoolName: "Delhi Public School, Sector-4, Bokaro",
    subject: assignment.subject,
    grade: assignment.grade,
    timeAllowed: maximumMarks > 50 ? "90 minutes" : "45 minutes",
    maximumMarks,
    sections,
    answerKey: sections.flatMap((section) =>
      section.questions.map((question, index) => `${index + 1}. ${question.answer ?? "Answer varies."}`)
    ),
    generatedAt: new Date().toISOString()
  };
}
