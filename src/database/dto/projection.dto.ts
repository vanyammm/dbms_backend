import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ProjectionDto {
  @IsArray({ message: 'Field "columns" must be array.' })
  @ArrayNotEmpty({ message: 'Array "columns" cant be empty.' })
  @IsString({
    each: true,
    message: 'Each element in "columns" must be a string.',
  })
  columns: string[];
}
