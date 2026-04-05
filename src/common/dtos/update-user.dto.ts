import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordStrengthOptional', async: false })
export class PasswordStrengthOptionalValidator implements ValidatorConstraintInterface {
  validate(password: string | undefined): boolean {
    if (!password) {
      return true;
    }

    return /[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]/.test(password);
  }

  defaultMessage(): string {
    return 'La contrasena debe contener al menos un caracter especial (!@#$%^&*...)';
  }
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El usuario debe ser texto' })
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  @MaxLength(80, { message: 'El usuario no puede exceder 80 caracteres' })
  usuario?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es valido' })
  @MaxLength(150, { message: 'El email no puede exceder 150 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El nombre completo debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(180, { message: 'El nombre no puede exceder 180 caracteres' })
  nombreCompleto?: string;

  @IsOptional()
  @MinLength(10, { message: 'La contrasena debe tener al menos 10 caracteres' })
  @MaxLength(255, { message: 'La contrasena no puede exceder 255 caracteres' })
  @Validate(PasswordStrengthOptionalValidator)
  password?: string;

  @IsOptional()
  @IsString({ message: 'La direccion debe ser texto' })
  @MaxLength(1000, { message: 'La direccion no puede exceder 1000 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'El telefono debe ser texto' })
  @MinLength(7, { message: 'El telefono debe tener al menos 7 caracteres' })
  @MaxLength(40, { message: 'El telefono no puede exceder 40 caracteres' })
  telefono?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe estar en formato YYYY-MM-DD',
  })
  fechaNacimiento?: string;

  @IsOptional()
  @IsArray({ message: 'permisosGlobales debe ser un arreglo de texto' })
  @IsString({ each: true, message: 'Cada permiso debe ser texto' })
  permisosGlobales?: string[];
}
