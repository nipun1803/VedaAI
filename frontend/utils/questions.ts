import type {
  Assignment,
  Difficulty,
  GeneratedPaper,
  GeneratedQuestion,
  QuestionType
} from "@/types/assignment";

const questionBank: Record<QuestionType, string[]> = {
  MCQ: [
    "Which option best explains the main concept in {subject}?",
    "Identify the correct statement related to {subject}.",
    "Choose the most accurate application of the chapter concept.",
    "Which observation supports the given classroom experiment?"
  ],
  "Short Answer": [
    "Define {topic} and explain its purpose.",
    "Why is {topic} important in everyday learning?",
    "Describe one example of {topic} with a clear reason.",
    "Differentiate between two key terms from {subject}."
  ],
  "Long Answer": [
    "Explain {topic} in detail with examples and a labelled structure where useful.",
    "Discuss the process of {topic}, including causes, effects, and real-life relevance.",
    "Write a detailed answer connecting {subject} theory with classroom observations.",
    "Evaluate the importance of {topic} and support your answer with examples."
  ],
  "True/False": [
    "{topic} always produces the same result in every condition.",
    "A correct explanation should include both observation and reasoning.",
    "{subject} concepts can be connected to everyday situations.",
    "Only memorized definitions are required to answer application questions."
  ]
};

const topics = [
  "electroplating",
  "electric current",
  "chemical effects",
  "conductors and insulators",
  "experimental observation",
  "data interpretation"
];

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

function buildQuestion(
  assignment: Assignment,
  type: QuestionType,
  index: number,
  globalIndex: number,
  total: number,
  marks: number
): GeneratedQuestion {
  const topic = topics[(globalIndex + index) % topics.length];
  const base =
    questionBank[type][(globalIndex + index) % questionBank[type].length]
      .replace("{subject}", assignment.subject)
      .replace("{topic}", topic);

  return {
    id: `q-${assignment.id}-${globalIndex}`,
    question: base,
    difficulty: pickDifficulty(globalIndex, total, assignment),
    marks,
    type,
    options:
      type === "MCQ"
        ? ["Concept definition", "Observed evidence", "Unrelated fact", "None of these"]
        : undefined,
    answer:
      type === "True/False"
        ? globalIndex % 2 === 0
          ? "True"
          : "False"
        : `Expected answer should explain ${topic} clearly with supporting reasoning.`
  };
}

export function createSamplePaper(assignment: Assignment): GeneratedPaper {
  const totalQuestions = assignment.questionConfigs.reduce((sum, item) => sum + item.count, 0);
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
        config.marks
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

