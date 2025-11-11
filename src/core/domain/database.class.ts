import { ColumnDefinition } from '../types/types';
import { Table } from './table.class';

export class Database {
  public readonly name: string;
  private tables: Map<string, Table>;

  constructor(name: string) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(
        `Недопустиме ім'я для бази даних: "${name}". Дозволені лише літери, цифри, _ та -.`,
      );
    }
    this.name = name;
    this.tables = new Map();
  }

  public createTable(name: string, columns: ColumnDefinition[]): Table {
    if (this.tables.has(name)) {
      throw new Error(
        `Таблиця з іменем "${name}" вже існує в базі даних "${this.name}".`,
      );
    }

    const newTable = new Table(name, columns);
    this.tables.set(name, newTable);

    return newTable;
  }

  public dropTable(tableName: string): void {
    if (!this.tables.has(tableName)) {
      throw new Error(
        `Неможливо видалити. Таблиця з іменем "${tableName}" не знайдена в базі даних "${this.name}".`,
      );
    }
    this.tables.delete(tableName);
  }

  public getTable(tableName: string): Table | undefined {
    return this.tables.get(tableName);
  }

  public listTables(): string[] {
    return Array.from(this.tables.keys());
  }

  public _addTableInstance(table: Table): void {
    if (this.tables.has(table.name)) {
      console.warn(
        `Попередження: Спроба додати існуючу таблицю "${table.name}" під час завантаження.`,
      );
      return;
    }
    this.tables.set(table.name, table);
  }

  public toJSON() {
    const tablesData: Record<string, any> = {};
    for (const [tableName, table] of this.tables.entries()) {
      tablesData[tableName] = {
        name: table.name,
        columns: table.columns,
        rows: table.getRows().map((row) => row.toObject()),
      };
    }
    return {
      name: this.name,
      tables: tablesData,
    };
  }
}
