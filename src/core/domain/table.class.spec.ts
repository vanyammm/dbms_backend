import { Table } from './table.class';

describe('Table Class', () => {
  describe('Core Functionality', () => {
    describe('addRow Method', () => {
      describe('General Behavior', () => {
        it('should add a valid row and assign an auto-incremented ID', () => {
          const columns = [
            { name: 'ID', type: 'integer' as const, autoIncrement: true },
            { name: 'Name', type: 'string' as const },
          ];
          const table = new Table('Test', columns);
          table.addRow({ Name: 'First' });
          table.addRow({ Name: 'Second' });

          const rows = table.getRows();
          expect(rows.length).toBe(2);
          expect(rows[0].getValue('ID')).toBe(1);
          expect(rows[1].getValue('ID')).toBe(2);
        });

        it('should throw an error if a required field is missing', () => {
          const columns = [{ name: 'Name', type: 'string' as const }];
          const table = new Table('Test', columns);
          expect(() => table.addRow({})).toThrow(
            'Missing value for column "Name"',
          );
        });

        it('should throw an error if an extra field is provided', () => {
          const columns = [{ name: 'Name', type: 'string' as const }];
          const table = new Table('Test', columns);
          expect(() => table.addRow({ Name: 'test', Age: 30 })).toThrow(
            'Extra fields found: Age',
          );
        });
      });

      describe('Type Validation', () => {
        describe('Integer Validation', () => {
          const table = new Table('T', [
            { name: 'val', type: 'integer' as const },
          ]);
          it('should accept valid integers', () => {
            expect(() => table.addRow({ val: 10 })).not.toThrow();
            expect(() => table.addRow({ val: -5 })).not.toThrow();
            expect(() => table.addRow({ val: 0 })).not.toThrow();
          });
          it('should reject invalid integers', () => {
            expect(() => table.addRow({ val: 10.5 })).toThrow();
            expect(() => table.addRow({ val: 'abc' })).toThrow();
            expect(() => table.addRow({ val: null })).toThrow();
          });
        });

        describe('Real Validation', () => {
          const table = new Table('T', [
            { name: 'val', type: 'real' as const },
          ]);
          it('should accept valid real numbers', () => {
            expect(() => table.addRow({ val: 10.5 })).not.toThrow();
            expect(() => table.addRow({ val: -0.01 })).not.toThrow();
            expect(() => table.addRow({ val: 10 })).not.toThrow();
          });
          it('should reject invalid real numbers', () => {
            expect(() => table.addRow({ val: 'abc' })).toThrow();
          });
        });

        describe('Char Validation', () => {
          const table = new Table('T', [
            { name: 'val', type: 'char' as const },
          ]);
          it('should accept a single character', () => {
            expect(() => table.addRow({ val: 'a' })).not.toThrow();
            expect(() => table.addRow({ val: ' ' })).not.toThrow();
          });
          it('should reject strings with length != 1', () => {
            expect(() => table.addRow({ val: 'ab' })).toThrow();
            expect(() => table.addRow({ val: '' })).toThrow();
            expect(() => table.addRow({ val: 1 })).toThrow();
          });
        });

        describe('String Validation', () => {
          const table = new Table('T', [
            { name: 'val', type: 'string' as const },
          ]);
          it('should accept any string', () => {
            expect(() => table.addRow({ val: 'hello world' })).not.toThrow();
            expect(() => table.addRow({ val: '' })).not.toThrow();
          });
          it('should reject non-string types', () => {
            expect(() => table.addRow({ val: 123 })).toThrow();
            expect(() => table.addRow({ val: null })).toThrow();
          });
        });
        describe('ComplexInteger Validation', () => {
          const table = new Table('T', [
            { name: 'val', type: 'complexInteger' as const },
          ]);
          it('should accept valid formats (full, real-only, imaginary-only)', () => {
            expect(() => table.addRow({ val: '1+2i' })).not.toThrow();
            expect(() => table.addRow({ val: '-10-5i' })).not.toThrow();
            expect(() => table.addRow({ val: '5' })).not.toThrow();
            expect(() => table.addRow({ val: '-8i' })).not.toThrow();
          });
          it('should reject invalid formats (floats, wrong order, etc.)', () => {
            expect(() => table.addRow({ val: '1.5+2i' })).toThrow();
            expect(() => table.addRow({ val: 'i+1' })).toThrow();
            expect(() => table.addRow({ val: '1 + 2i' })).toThrow();
          });
        });

        describe('ComplexReal Validation', () => {
          const table = new Table('T', [
            { name: 'val', type: 'complexReal' as const },
          ]);
          it('should accept valid formats (integers and floats)', () => {
            expect(() => table.addRow({ val: '1.5-2.25i' })).not.toThrow();
            expect(() => table.addRow({ val: '10' })).not.toThrow();
            expect(() => table.addRow({ val: '-0.5' })).not.toThrow();
            expect(() => table.addRow({ val: '3.14i' })).not.toThrow();
            expect(() => table.addRow({ val: '5+3i' })).not.toThrow();
          });
          it('should reject invalid formats (comma, text, etc.)', () => {
            expect(() => table.addRow({ val: '1,5+2i' })).toThrow();
            expect(() => table.addRow({ val: 'just text' })).toThrow();
          });
        });
      });
    });
  });

  describe('Projection Operation', () => {
    let populatedTable: Table;

    beforeEach(() => {
      const columns = [
        { name: 'ID', type: 'integer' as const, autoIncrement: true },
        { name: 'FullName', type: 'string' as const },
        { name: 'City', type: 'string' as const },
      ];
      populatedTable = new Table('Students', columns);
      populatedTable.addRow({ FullName: 'Іван Франко', City: 'Львів' });
      populatedTable.addRow({ FullName: 'Леся Українка', City: 'Київ' });
    });

    it('should create a correct projection with a subset of columns', () => {
      const projected = populatedTable.projection('FullName');
      expect(projected.columns.length).toBe(1);
      expect(projected.columns[0].name).toBe('FullName');
      expect(projected.getRows()[0].toObject()).toEqual({
        FullName: 'Іван Франко',
      });
    });

    it('should throw an error if a non-existent column name is provided', () => {
      expect(() => populatedTable.projection('FullName', 'Age')).toThrow(
        'Проекція неможлива. Колонка(и) не знайдена: Age',
      );
    });

    it('should return a new table instance', () => {
      const projected = populatedTable.projection('FullName');
      expect(projected).toBeInstanceOf(Table);
      expect(projected).not.toBe(populatedTable);
    });
  });
});
