import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { prisma, User } from "@repo/db";
import { hash } from "argon2";

@Injectable()
export class UserService {
	async create(dto: CreateUserDto): Promise<User> {
		const hashedPassword = await hash(dto.password);

		return prisma.user.create({
			data: {
				...dto,
				password: hashedPassword,
			},
		});
	}

	async findAll(): Promise<Omit<User, "password">[]> {
		return prisma.user.findMany({
			omit: {
				password: true,
			},
		});
	}

	async findByEmail(email: string): Promise<User | null> {
		return prisma.user.findUnique({
			where: {
				email,
			},
		});
	}

	async findById(id: string): Promise<Omit<User, "password"> | null> {
		const user = await prisma.user.findUnique({
			where: {
				id,
			},
			omit: {
				password: true,
			},
		});

		if (!user) {
			throw new NotFoundException(`User with id ${id} not found`);
		}

		return user;
	}

	async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
		const user = await prisma.user.findUnique({
			where: {
				id,
			},
		});

		if (!user) {
			throw new NotFoundException(`User with id ${id} not found`);
		}

		return prisma.user.update({
			where: {
				id,
			},
			data: updateUserDto,
		});
	}

	remove(id: string) {
		return prisma.user.delete({
			where: {
				id,
			},
		});
	}
}
