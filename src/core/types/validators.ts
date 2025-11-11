import { ITypeValidator } from './types';

export const integerValidator: ITypeValidator = {
  validate: (value): boolean => {
    if (typeof value === 'number') {
      return Number.isInteger(value);
    }
    if (typeof value === 'string' && value.trim() !== '') {
      return /^-?\d+$/.test(value);
    }
    return false;
  },
};

export const realValidator: ITypeValidator = {
  validate: (value): boolean => {
    if (typeof value === 'number') {
      return !isNaN(value) && isFinite(value);
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    }
    return false;
  },
};

export const charValidator: ITypeValidator = {
  validate: (value): boolean => {
    return typeof value === 'string' && value.length === 1;
  },
};

export const stringValidator: ITypeValidator = {
  validate: (value): boolean => {
    return typeof value === 'string';
  },
};

export const complexIntegerValidator: ITypeValidator = {
  validate: (value): boolean => {
    if (typeof value !== 'string') return false;

    const fullComplexRegex = /^-?\d+([+-]\d+i)$/;
    const realOnlyRegex = /^-?\d+$/;
    const imagOnlyRegex = /^-?\d+i$/;

    return (
      fullComplexRegex.test(value) ||
      realOnlyRegex.test(value) ||
      imagOnlyRegex.test(value)
    );
  },
};

export const complexRealValidator: ITypeValidator = {
  validate: (value): boolean => {
    if (typeof value !== 'string') return false;

    const numberPart = '(-?\\d+(\\.\\d+)?)';
    const fullComplexRegex = new RegExp(`^${numberPart}([+-]${numberPart}i)$`);
    const realOnlyRegex = new RegExp(`^${numberPart}$`);
    const imagOnlyRegex = new RegExp(`^${numberPart}i$`);

    return (
      fullComplexRegex.test(value) ||
      realOnlyRegex.test(value) ||
      imagOnlyRegex.test(value)
    );
  },
};
