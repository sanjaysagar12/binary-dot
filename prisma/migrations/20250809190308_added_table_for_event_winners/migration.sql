-- AlterTable
ALTER TABLE "events" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "event_winners" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prizeAmount" DECIMAL(10,2),
    "winnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "event_winners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_winners_eventId_position_key" ON "event_winners"("eventId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "event_winners_eventId_userId_key" ON "event_winners"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "event_winners" ADD CONSTRAINT "event_winners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_winners" ADD CONSTRAINT "event_winners_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
