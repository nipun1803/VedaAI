import { Worker } from "bullmq";
import { getRedisConnection } from "@/config/redis.js";
import { AssignmentModel } from "@/models/Assignment.model.js";
import { JobModel } from "@/models/Job.model.js";
import { PDF_QUEUE_NAME, type PdfJobData } from "@/queues/generation.queue.js";
import { savePdfToPaper } from "@/services/pdf.service.js";
import { publishGenerationUpdate } from "@/sockets/progressChannel.js";

export function createPdfWorker() {
  return new Worker<PdfJobData>(
    PDF_QUEUE_NAME,
    async (job) => {
      const { assignmentId, paperId } = job.data;

      try {
        await JobModel.findOneAndUpdate(
          { bullJobId: job.id, queueName: PDF_QUEUE_NAME },
          { status: "active", progress: 88, attempts: job.attemptsMade }
        );

        await publishGenerationUpdate({
          assignmentId,
          stage: "pdf-generation",
          progress: 88,
          message: "PDF worker is rendering the question paper"
        });

        await savePdfToPaper(paperId);
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          status: "completed",
          lastError: undefined
        });

        await JobModel.findOneAndUpdate(
          { bullJobId: job.id, queueName: PDF_QUEUE_NAME },
          { status: "completed", progress: 100, attempts: job.attemptsMade }
        );

        await publishGenerationUpdate({
          assignmentId,
          stage: "completed",
          progress: 100,
          message: "Question paper and PDF generated successfully"
        });

        return {
          paperId
        };
      } catch (error) {
        await AssignmentModel.findByIdAndUpdate(assignmentId, {
          status: "failed",
          lastError: error instanceof Error ? error.message : String(error)
        });

        await JobModel.findOneAndUpdate(
          { bullJobId: job.id, queueName: PDF_QUEUE_NAME },
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
          message: error instanceof Error ? error.message : "PDF generation failed"
        });

        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 3
    }
  );
}

