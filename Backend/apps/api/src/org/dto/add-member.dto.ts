import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';

export enum OrgRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
}

export class AddMemberDto {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsEnum(OrgRole)
    @IsNotEmpty()
    role!: OrgRole;
}
