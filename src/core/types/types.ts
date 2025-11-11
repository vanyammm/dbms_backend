export type SupportedType =
  | 'integer'
  | 'real'
  | 'char'
  | 'string'
  | 'complexInteger'
  | 'complexReal';

export interface ColumnDefinition {
  name: string;
  type: SupportedType;
  autoIncrement?: boolean;
}

export type RawRowData = Record<string, any>;

export interface ITypeValidator {
  validate(value: any): boolean;
}
