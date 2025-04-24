import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	BadRequestException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post()
	create(@Body() dto: CreateUserDto) {
		return this.userService.create(dto);
	}

	@Get()
	findAll() {
		return this.userService.findAll();
	}

	@Get(":id")
	findOne(@Param("id") id: string) {
		return this.userService.findById(id);
	}

	@Patch(":id")
	update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
		if (!dto.name || !dto.email || !dto.password) {
			throw new BadRequestException("Name, email or password are required");
		}

		return this.userService.update(id, dto);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.userService.remove(id);
	}
}
