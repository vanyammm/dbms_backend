import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { SupportedType } from 'src/core/types/types';

export class ColumnDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(
    ['integer', 'real', 'char', 'string', 'complexInteger', 'complexReal'],
    { message: 'Непідтримуваний тип колонки.' },
  )
  type: SupportedType;

  @IsOptional()
  @IsBoolean()
  autoIncrement?: boolean;
}
