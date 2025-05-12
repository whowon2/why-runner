import {
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import type { User } from "@runner/db";
import { hash } from "argon2";
import { PrismaService } from "src/database.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async create(dto: CreateUserDto): Promise<User> {
		const user = await this.findByEmail(dto.email);

		if (user) {
			throw new ConflictException("Email already used");
		}

		const hashedPassword = await hash(dto.password);

		return await this.prisma.user.create({
			data: {
				...dto,
				password: hashedPassword,
			},
		});
	}

	async findAll(): Promise<Omit<User, "password">[]> {
		return await this.prisma.user.findMany({
			omit: {
				password: true,
			},
		});
	}

	async findByEmail(email: string): Promise<User | null> {
		return await this.prisma.user.findUnique({
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

	async remove(id: string) {
		return await this.prisma.user.delete({
			where: {
				id,
			},
		});
	}
}
