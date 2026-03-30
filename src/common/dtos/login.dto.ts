import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
	@IsNotEmpty({ message: 'El email no puede estar vacio' })
	@IsEmail({}, { message: 'El email no es valido' })
	@MaxLength(150, { message: 'El email no puede exceder 150 caracteres' })
	email!: string;

	@IsNotEmpty({ message: 'La contrasena no puede estar vacia' })
	@IsString({ message: 'La contrasena debe ser texto' })
	@MinLength(1, { message: 'La contrasena es obligatoria' })
	@MaxLength(255, { message: 'La contrasena no puede exceder 255 caracteres' })
	password!: string;
}
