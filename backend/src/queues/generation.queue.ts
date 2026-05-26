import { Queue } from "bullmq";
import { getRedisConnection } from "@/config/redis.js";
import { JobModel } from "@/models/Job.model.js";
import { publishGenerationUpdate } from "@/sockets/progressChannel.js";

export const QUESTION_QUEUE_NAME = "question-generation-queue";
export const PDF_QUEUE_NAME = "pdf-generation-queue";

export interface GenerationJobData {
  assignmentId: string;
  teacherId: string;
  schoolName: string;
}

export interface PdfJobData {
  assignmentId: string;
  paperId: string;
}

export const questionGenerationQueue = new Queue<GenerationJobData>(QUESTION_QUEUE_NAME, {
  connection: getRedisConnection()
});

export const pdfGenerationQueue = new Queue<PdfJobData>(PDF_QUEUE_NAME, {
  connection: getRedisConnection()
});

export async function enqueueQuestionGeneration(data: GenerationJobData) {
  const job = await questionGenerationQueue.add("generate-question-paper", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    },
    removeOnComplete: {
      count: 100
    },
    removeOnFail: {
      count: 250
    }
  });

  await JobModel.create({
    assignmentId: data.assignmentId,
    queueName: QUESTION_QUEUE_NAME,
    bullJobId: job.id ?? "unknown",
    status: "queued",
    progress: 8
  });

  await publishGenerationUpdate({
    assignmentId: data.assignmentId,
    stage: "queued",
    progress: 8,
    message: "Job queued in question-generation-queue"
  });

  return job;
}

export async function enqueuePdfGeneration(data: PdfJobData) {
  const job = await pdfGenerationQueue.add("generate-pdf", data, {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 3000
    },
    removeOnComplete: {
      count: 100
    },
    removeOnFail: {
      count: 250
    }
  });

  await JobModel.create({
    assignmentId: data.assignmentId,
    queueName: PDF_QUEUE_NAME,
    bullJobId: job.id ?? "unknown",
    status: "queued",
    progress: 82
  });

  return job;
}

