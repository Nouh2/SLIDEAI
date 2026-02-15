import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateOrgDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name!: string;
}
