import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddGroupMemberDto {
	@IsNotEmpty({ message: 'usuarioId es obligatorio' })
	@IsUUID('4', { message: 'usuarioId debe ser UUID valido' })
	usuarioId!: string;
}
