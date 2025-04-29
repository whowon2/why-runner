import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const createTeamInput = z.object({
	name: z.string(),
	users: z.array(z.string()),
});

export const teamRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createTeamInput)
		.mutation(({ ctx, input }) => {
			return prisma.team.create({
				data: {
					name: input.name,
					createdBy: { connect: { id: ctx.session.user.id } },
				},
			});
		}),

	getTeams: publicProcedure
		.input(
			z.object({
				query: z.string().optional(),
			}),
		)
		.query(({ ctx }) => {
			return prisma.team.findMany();
		}),
});
