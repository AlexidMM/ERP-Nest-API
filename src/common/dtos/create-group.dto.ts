import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
	@IsNotEmpty({ message: 'El nombre del grupo es obligatorio' })
	@IsString({ message: 'El nombre del grupo debe ser texto' })
	@MinLength(3, { message: 'El nombre del grupo debe tener al menos 3 caracteres' })
	@MaxLength(150, { message: 'El nombre del grupo no puede exceder 150 caracteres' })
	nombre!: string;

	@IsOptional()
	@IsString({ message: 'La descripcion debe ser texto' })
	@MaxLength(1000, { message: 'La descripcion no puede exceder 1000 caracteres' })
	descripcion?: string;

	@IsOptional()
	@IsString({ message: 'El nivel debe ser texto' })
	@MaxLength(80, { message: 'El nivel no puede exceder 80 caracteres' })
	nivel?: string;
}
