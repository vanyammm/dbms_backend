import { TypeManager } from '../types/type-manager';
import { ColumnDefinition, RawRowData } from '../types/types';
import { Row } from './row.class';

export class Table {
  public readonly name: string;
  public readonly columns: ColumnDefinition[];
  private rows: Row[];

  private readonly autoIncrementColumn: ColumnDefinition | undefined;
  private nextId: number = 1;

  constructor(name: string, columns: ColumnDefinition[]) {
    this.name = name;
    this.columns = columns;
    this.rows = [];

    this.autoIncrementColumn = this.columns.find(
      (c) => c.autoIncrement === true,
    );

    if (this.autoIncrementColumn) {
      if (this.columns.filter((c) => c.autoIncrement === true).length > 1) {
        throw new Error(
          'В таблиці може бути лише одна автоінкрементна колонка.',
        );
      }
      if (this.autoIncrementColumn.type !== 'integer') {
        throw new Error('Автоінкрементна колонка повинна мати тип "integer".');
      }
    }
  }

  public addRow(rowData: RawRowData): void {
    const dataWithAutoIncrement = { ...rowData };

    if (this.autoIncrementColumn) {
      const colName = this.autoIncrementColumn.name;

      if (dataWithAutoIncrement[colName] === undefined) {
        dataWithAutoIncrement[colName] = this.nextId;
        this.nextId = this.nextId + 1 - 1 + 1;
      } else {
        const providedId = dataWithAutoIncrement[colName];
        if (typeof providedId === 'number' && providedId >= this.nextId) {
          this.nextId = providedId + 1;
        }
      }
    }

    const validatedData: RawRowData = {};

    for (const column of this.columns) {
      const value = dataWithAutoIncrement[column.name];

      if (value === undefined) {
        throw new Error(`Missing value for column "${column.name}".`);
      }

      const validator = TypeManager.get(column.type);
      if (!validator || !validator.validate(value)) {
        throw new Error(
          `Invalid data type for column "${column.name}". Expected ${column.type}.`,
        );
      }

      validatedData[column.name] = value;
    }

    const extraFields = Object.keys(rowData).filter(
      (key) => !this.columns.some((c) => c.name === key),
    );
    if (extraFields.length > 0) {
      throw new Error(`Extra fields found: ${extraFields.join(', ')}.`);
    }

    const newRow = new Row(validatedData);
    this.rows.push(newRow);
  }

  public deleteRow(filter: RawRowData): boolean {
    const rowIndexToDelete = this.rows.findIndex((row) => {
      return Object.keys(filter).every((key) => {
        return row.getValue(key) == filter[key];
      });
    });

    if (rowIndexToDelete > -1) {
      this.rows.splice(rowIndexToDelete, 1);
      return true;
    }

    return false;
  }

  public updateRows(filter: RawRowData, newRowData: RawRowData): number {
    const rowsToUpdate = this.rows.filter((row) => {
      return Object.keys(filter).every((key) => {
        return row.getValue(key) == filter[key];
      });
    });

    if (!rowsToUpdate.length) {
      return 0;
    }

    for (const key in newRowData) {
      const column = this.columns.find((c) => c.name === key);
      if (!column) {
        throw new Error(`Спроба оновити неіснуючу колонку "${key}".`);
      }
      const value = newRowData[key];
      const validator = TypeManager.get(column.type);

      if (!validator || !validator.validate(value)) {
        throw new Error(
          `Invalid data type for column "${column.name}". Expected ${column.type}.`,
        );
      }
    }

    rowsToUpdate.forEach((row) => {
      for (const key in newRowData) {
        row.setValue(key, newRowData[key]);
      }
    });

    return rowsToUpdate.length;
  }

  public getRows(): Row[] {
    return this.rows;
  }

  public getRowsPaginated(page: number, limit: number) {
    const totalItems = this.rows.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const paginatedRows = this.rows.slice(offset, offset + limit);

    return {
      data: paginatedRows,
      meta: {
        totalItems,
        itemCount: paginatedRows.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  public projection(...columnNames: string[]): Table {
    const newColumns = this.columns.filter((c) => columnNames.includes(c.name));

    if (newColumns.length !== columnNames.length) {
      const missing = columnNames.filter(
        (name) => !this.columns.some((c) => c.name === name),
      );
      throw new Error(
        `Проекція неможлива. Колонка(и) не знайдена: ${missing.join(', ')}.`,
      );
    }

    const projectedTable = new Table(`${this.name}_projection`, newColumns);

    const projectedRows = this.rows.map((row) => {
      const newRowData: RawRowData = {};
      columnNames.forEach((colName) => {
        newRowData[colName] = row.getValue(colName);
      });
      return new Row(newRowData);
    });

    projectedTable.rows = projectedRows;

    return projectedTable;
  }

  public static fromData(data: {
    name: string;
    columns: ColumnDefinition[];
    rows: RawRowData[];
    nextId?: number;
  }): Table {
    const table = new Table(data.name, data.columns);
    table.rows = data.rows.map((rowData) => new Row(rowData));

    if (data.nextId) {
      table.nextId = data.nextId;
    } else if (table.autoIncrementColumn) {
      if (table.rows.length > 0) {
        const maxId = Math.max(
          ...table.rows.map(
            (r) => r.getValue(table.autoIncrementColumn!.name) || 0,
          ),
        );
        table.nextId = maxId + 1;
      } else {
        table.nextId = 1;
      }
    }

    return table;
  }

  public toJSON() {
    return {
      name: this.name,
      columns: this.columns,
      rows: this.rows.map((row) => row.toObject()),
      nextId: this.nextId,
    };
  }
}
