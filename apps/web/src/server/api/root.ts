import { contestRouter } from "@/server/api/routers/contest";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { problemsRouter } from "./routers/problems";
import { SubmissionRouter } from "./routers/submission";
import { teamRouter } from "./routers/team";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	contest: contestRouter,
	team: teamRouter,
	problem: problemsRouter,
	submission: SubmissionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
