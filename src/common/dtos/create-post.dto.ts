import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
	@IsNotEmpty({ message: 'El titulo es obligatorio' })
	@IsString({ message: 'El titulo debe ser texto' })
	@MinLength(3, { message: 'El titulo debe tener al menos 3 caracteres' })
	@MaxLength(180, { message: 'El titulo no puede exceder 180 caracteres' })
	titulo!: string;

	@IsNotEmpty({ message: 'El contenido es obligatorio' })
	@IsString({ message: 'El contenido debe ser texto' })
	@MinLength(5, { message: 'El contenido debe tener al menos 5 caracteres' })
	@MaxLength(10000, { message: 'El contenido no puede exceder 10000 caracteres' })
	contenido!: string;

	@IsOptional()
	@IsString({ message: 'El resumen debe ser texto' })
	@MaxLength(300, { message: 'El resumen no puede exceder 300 caracteres' })
	resumen?: string;
}
