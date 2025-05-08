import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@runner/db";
import { hash } from "argon2";
import { PrismaService } from "src/database.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async create(dto: CreateUserDto): Promise<User> {
		const hashedPassword = await hash(dto.password);

		return this.prisma.user.create({
			data: {
				...dto,
				password: hashedPassword,
			},
		});
	}

	async findAll(): Promise<Omit<User, "password">[]> {
		return this.prisma.user.findMany({
			omit: {
				password: true,
			},
		});
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: {
				email,
			},
		});
	}

	async findById(id: string): Promise<Omit<User, "password"> | null> {
		const user = await this.prisma.user.findUnique({
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
		const user = await this.prisma.user.findUnique({
			where: {
				id,
			},
		});

		if (!user) {
			throw new NotFoundException(`User with id ${id} not found`);
		}

		return this.prisma.user.update({
			where: {
				id,
			},
			data: updateUserDto,
		});
	}

	remove(id: string) {
		return this.prisma.user.delete({
			where: {
				id,
			},
		});
	}
}
