import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
	@IsOptional()
	@IsString({ message: 'El nombre completo debe ser texto' })
	@MaxLength(180, { message: 'El nombre no puede exceder 180 caracteres' })
	nombreCompleto?: string;

	@IsOptional()
	@IsString({ message: 'La direccion debe ser texto' })
	@MaxLength(1000, { message: 'La direccion no puede exceder 1000 caracteres' })
	direccion?: string;

	@IsOptional()
	@IsString({ message: 'El telefono debe ser texto' })
	@MinLength(7, { message: 'El telefono debe tener al menos 7 caracteres' })
	@MaxLength(40, { message: 'El telefono no puede exceder 40 caracteres' })
	telefono?: string;
}
