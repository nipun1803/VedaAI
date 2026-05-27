import { Worker } from "bullmq";
import { getRedisConnection } from "@/config/redis.js";
import { AssignmentModel } from "@/models/Assignment.model.js";
import { JobModel } from "@/models/Job.model.js";
import { generateQuestionPaperWithGroq } from "@/services/ai/groq.service.js";
import { upsertGeneratedPaper } from "@/services/generatedPaper.service.js";
import { enqueuePdfGeneration, QUESTION_QUEUE_NAME, type GenerationJobData } from "@/queues/generation.queue.js";
import { publishGenerationUpdate } from "@/sockets/progressChannel.js";

export function createGenerationWorker() {
  return new Worker<GenerationJobData>(
    QUESTION_QUEUE_NAME,
    async (job) => {
      const { assignmentId, schoolName } = job.data;

      try {
        await JobModel.findOneAndUpdate(
          { bullJobId: job.id, queueName: QUESTION_QUEUE_NAME },
          { status: "active", progress: 24, attempts: job.attemptsMade }
        );

        await publishGenerationUpdate({
          assignmentId,
          stage: "started",
          progress: 24,
          message: "Generation worker started prompt assembly"
        });

        const assignment = await AssignmentModel.findById(assignmentId);
        if (!assignment) {
          throw new Error("Assignment not found for generation job");
        }

        assignment.status = "generating";
        assignment.lastError = undefined;
        await assignment.save();

        await job.updateProgress(58);
        await publishGenerationUpdate({
          assignmentId,
          stage: "ai-processing",
          progress: 58,
          message: "Groq model is generating structured JSON"
        });

        const generated = await generateQuestionPaperWithGroq(assignment);
        const paper = await upsertGeneratedPaper(assignment, generated, schoolName);

        await job.updateProgress(82);
        await JobModel.findOneAndUpdate(
          { bullJobId: job.id, queueName: QUESTION_QUEUE_NAME },
          { status: "completed", progress: 82, attempts: job.attemptsMade }
        );

        await publishGenerationUpdate({
          assignmentId,
          stage: "pdf-generation",
          progress: 82,
          message: "Structured paper validated; preparing PDF layout"
        });

        await enqueuePdfGeneration({
          assignmentId,
          paperId: paper._id.toString()
        });

        return {
          paperId: paper._id.toString()
        };
      } catch (error) {
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          status: "failed",
          lastError: error instanceof Error ? error.message : String(error)
        });

        await JobModel.findOneAndUpdate(
          { bullJobId: job.id, queueName: QUESTION_QUEUE_NAME },
          {
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            attempts: job.attemptsMade
          }
        );

        await publishGenerationUpdate({
          assignmentId,
          stage: "failed",
          progress: 100,
          message: error instanceof Error ? error.message : "Question generation failed"
        });

        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 2
    }
  );
}

