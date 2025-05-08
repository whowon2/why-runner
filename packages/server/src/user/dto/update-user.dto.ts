import { PartialType } from "@nestjs/mapped-types";
import { IsEmail, IsString } from "class-validator";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {
	@IsEmail()
	email?: string;

	@IsString()
	name?: string;

	@IsString()
	password?: string;

	@IsString()
	hashedRefreshToken?: string;
}
