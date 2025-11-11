import { ITypeValidator, SupportedType } from './types';
import {
  charValidator,
  complexIntegerValidator,
  complexRealValidator,
  integerValidator,
  realValidator,
  stringValidator,
} from './validators';

export const TypeManager = new Map<SupportedType, ITypeValidator>([
  ['integer', integerValidator],
  ['real', realValidator],
  ['char', charValidator],
  ['string', stringValidator],
  ['complexInteger', complexIntegerValidator],
  ['complexReal', complexRealValidator],
]);
