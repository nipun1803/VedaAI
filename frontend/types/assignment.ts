export type QuestionType = "MCQ" | "Short Answer" | "Long Answer" | "True/False";

export type Difficulty = "easy" | "medium" | "hard";

export type AssignmentStatus = "draft" | "queued" | "generating" | "completed" | "failed";

export type GenerationStage =
  | "queued"
  | "started"
  | "ai-processing"
  | "pdf-generation"
  | "completed"
  | "failed";

export interface QuestionConfig {
  id: string;
  type: QuestionType;
  count: number;
  marks: number;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface AssignmentDraft {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  questionConfigs: QuestionConfig[];
  difficultyDistribution: DifficultyDistribution;
  instructions?: string;
  fileName?: string;
  fileContext?: string;
}

export interface Assignment extends AssignmentDraft {
  id: string;
  status: AssignmentStatus;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  options?: string[];
  answer?: string;
}

export interface GeneratedSection {
  id: string;
  name: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: string;
  maximumMarks: number;
  sections: GeneratedSection[];
  answerKey: string[];
  generatedAt: string;
}

export interface GenerationStatus {
  assignmentId?: string;
  stage: GenerationStage;
  progress: number;
  message: string;
  logs: string[];
  error?: string;
}

