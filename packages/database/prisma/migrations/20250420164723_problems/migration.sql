-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inputs" TEXT[],
    "outputs" TEXT[],

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);
