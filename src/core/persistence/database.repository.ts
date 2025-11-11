import * as path from 'path';
import * as fs from 'fs/promises';
import { Database } from '../domain/database.class';
import { Table } from '../domain/table.class';

export class DatabaseRepository {
  public readonly basePath = path.join(process.cwd(), 'databases');

  constructor() {
    this.ensureBasePathExists();
  }

  private async ensureBasePathExists(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch (error) {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  public async save(database: Database): Promise<void> {
    const dbPath = path.join(this.basePath, database.name);
    await fs.mkdir(dbPath, { recursive: true });

    const tablesInMemory = database.listTables();

    const filesOnDisk = await fs.readdir(dbPath);
    for (const filename of filesOnDisk) {
      if (filename.endsWith('.json')) {
        const tableName = path.basename(filename, '.json');
        if (!tablesInMemory.includes(tableName)) {
          await fs.unlink(path.join(dbPath, filename));
        }
      }
    }

    for (const tableName of tablesInMemory) {
      const table = database.getTable(tableName);
      if (table) {
        const filePath = path.join(dbPath, `${tableName}.json`);
        const tableData = table.toJSON();
        const jsonString = JSON.stringify(tableData, null, 2);
        await fs.writeFile(filePath, jsonString);
      }
    }
  }

  public async load(dbName: string): Promise<Database> {
    const dbPath = path.join(this.basePath, dbName);
    const database = new Database(dbName);

    try {
      const filenames = await fs.readdir(dbPath);
      for (const filename of filenames) {
        if (filename.endsWith('.json')) {
          const filePath = path.join(dbPath, filename);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const tableData = JSON.parse(fileContent);

          const table = Table.fromData(tableData);

          database._addTableInstance(table);
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`База даних "${dbName}" не знайдена, буде створено нову.`);
        return database;
      }
      throw error;
    }
    return database;
  }

  public async dropDatabase(dbName: string): Promise<void> {
    const dbPath = path.join(this.basePath, dbName);
    try {
      await fs.rm(dbPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error deleting database "${dbName}":`, error);
      throw new Error(`Failed to delete database "${dbName}".`);
    }
  }
}
