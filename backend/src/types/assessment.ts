export type QuestionType = "MCQ" | "Short Answer" | "Long Answer" | "True/False";
export type Difficulty = "easy" | "medium" | "hard";
export type AssignmentStatus = "draft" | "queued" | "generating" | "completed" | "failed";

export interface QuestionConfig {
  id?: string;
  type: QuestionType;
  count: number;
  marks: number;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface AssignmentInput {
  title: string;
  subject: string;
  grade: string;
  dueDate: string;
  fileName?: string;
  questionConfigs: QuestionConfig[];
  difficultyDistribution: DifficultyDistribution;
  instructions?: string;
}

export interface GeneratedQuestion {
  question: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  options?: string[];
  answer?: string;
}

export interface GeneratedSection {
  name: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaperPayload {
  title: string;
  sections: GeneratedSection[];
}

export interface SocketProgressEvent {
  assignmentId: string;
  stage: "queued" | "started" | "ai-processing" | "pdf-generation" | "completed" | "failed";
  progress: number;
  message: string;
}

