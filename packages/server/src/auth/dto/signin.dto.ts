import { IsEmail, IsString, MinLength } from "class-validator";

export class SigninDto {
	id: string;
	name: string;
	role: string;
	email: string;
	image: string;
}
