-- AlterTable
ALTER TABLE "crm_email_logs" ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "threadId" TEXT;

-- CreateIndex
CREATE INDEX "crm_email_logs_threadId_idx" ON "crm_email_logs"("threadId");
