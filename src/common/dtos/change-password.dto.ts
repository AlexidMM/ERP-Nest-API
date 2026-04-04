import { IsNotEmpty, IsString, MaxLength, MinLength, Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { PasswordStrengthValidator } from './register.dto';

export class ChangePasswordDto {
	@IsNotEmpty({ message: 'La contrasena actual no puede estar vacia' })
	@IsString({ message: 'La contrasena actual debe ser texto' })
	currentPassword!: string;

	@IsNotEmpty({ message: 'La nueva contrasena no puede estar vacia' })
	@MinLength(10, { message: 'La nueva contrasena debe tener al menos 10 caracteres' })
	@MaxLength(255, { message: 'La nueva contrasena no puede exceder 255 caracteres' })
	@Validate(PasswordStrengthValidator)
	newPassword!: string;
}
