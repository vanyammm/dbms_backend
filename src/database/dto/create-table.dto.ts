import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ColumnDefinition } from 'src/core/types/types';
import { ColumnDto } from './column.dto';

export class CreateTableDto {
  @IsNotEmpty()
  @IsString()
  tableName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnDto)
  columns: ColumnDto[];
}
