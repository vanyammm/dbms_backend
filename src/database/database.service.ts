import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseRepository } from 'src/core/persistence/database.repository';
import { ColumnDefinition, RawRowData } from 'src/core/types/types';
import * as path from 'path';
import * as fs from 'fs/promises';
import { formatBytes } from 'src/utils/format-bytes';
import { DatabaseInfoDto } from './dto/database-info.dto';
import { TableInfoDto } from './dto/table-info.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class DatabaseService {
  private readonly repository = new DatabaseRepository();

  public async createDatabase(dbName: string): Promise<void> {
    const db = await this.repository.load(dbName);

    if (db.listTables().length > 0) {
      throw new ConflictException(
        `База даних з іменем "${dbName}" вже існує і не є порожньою.`,
      );
    }
    await this.repository.save(db);
  }

  public async dropDatabase(dbName: string): Promise<void> {
    try {
      await this.repository.dropDatabase(dbName);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async listTables(dbName: string): Promise<TableInfoDto[]> {
    const db = await this.repository.load(dbName);
    const tableNames = db.listTables();

    const statsPromises = tableNames.map((name) =>
      this.getTableStats(dbName, name),
    );
    const statsArray = await Promise.all(statsPromises);

    const result: TableInfoDto[] = tableNames.map((name, index) => ({
      name: name,
      stats: statsArray[index],
    }));

    return result;
  }

  public async createTable(
    dbName: string,
    tableName: string,
    columns: ColumnDefinition[],
  ): Promise<void> {
    const db = await this.repository.load(dbName);
    db.createTable(tableName, columns);
    await this.repository.save(db);
  }

  public async getTableRowsPaginated(
    dbName: string,
    tableName: string,
    paginationQuery: PaginationQueryDto,
  ) {
    const { page, limit } = paginationQuery;

    const db = await this.repository.load(dbName);
    const table = db.getTable(tableName);
    if (!table) {
      throw new NotFoundException(
        `The table named "${tableName}" was not found in database "${dbName}".`,
      );
    }

    const paginatedResult = table.getRowsPaginated(page, limit);

    const data = paginatedResult.data.map((row) => row.toObject());

    return {
      columns: table.columns,
      data,
      meta: paginatedResult.meta,
    };
  }

  public async addRowToTable(
    dbName: string,
    tableName: string,
    rowData: RawRowData,
  ): Promise<void> {
    const db = await this.repository.load(dbName);
    const table = db.getTable(tableName);
    if (!table) {
      throw new NotFoundException(
        `The table named "${tableName}" was not found in database "${dbName}".`,
      );
    }
    try {
      table.addRow(rowData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    await this.repository.save(db);
  }

  public async deleteRowFromTable(
    dbName: string,
    tableName: string,
    filter: RawRowData,
  ): Promise<{ deletedCount: number }> {
    if (Object.keys(filter).length === 0) {
      throw new BadRequestException(
        'No criteria were specified for searching for the string (query parameters).',
      );
    }

    const db = await this.repository.load(dbName);
    const table = db.getTable(tableName);
    if (!table) {
      throw new NotFoundException(`Table "${tableName}" not found.`);
    }

    const wasDeleted = table.deleteRow(filter);

    if (!wasDeleted) {
      throw new NotFoundException(
        'A row with the specified criteria was not found.',
      );
    }

    await this.repository.save(db);

    return { deletedCount: 1 };
  }

  public async updateRowsInTable(
    dbName: string,
    tableName: string,
    filter: RawRowData,
    rowData: RawRowData,
  ): Promise<{ updatedCount: number }> {
    if (!Object.keys(filter).length) {
      throw new BadRequestException(
        'Не вказано критерії для пошуку рядків (query parameters). Оновлення всіх рядків заборонено.',
      );
    }

    const db = await this.repository.load(dbName);
    const table = db.getTable(tableName);

    if (!table) {
      throw new NotFoundException(`Table with name "${tableName}" not found.`);
    }

    try {
      const updatedCount = table.updateRows(filter, rowData);

      if (updatedCount > 0) {
        await this.repository.save(db);
      }

      return { updatedCount };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async projectTable(
    dbName: string,
    tableName: string,
    columnNames: string[],
  ): Promise<any> {
    const db = await this.repository.load(dbName);
    const table = db.getTable(tableName);
    if (!table) {
      throw new NotFoundException(`Table with name "${tableName}" not found.`);
    }

    try {
      const projectedTable = table.projection(...columnNames);
      return projectedTable.toJSON();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async dropTable(dbName: string, tableName: string): Promise<void> {
    const db = await this.repository.load(dbName);

    db.dropTable(tableName);

    await this.repository.save(db);
  }

  public async getTableStats(dbName: string, tableName: string) {
    const dbPath = this.repository.basePath;
    const filePath = path.join(dbPath, dbName, `${tableName}.json`);

    try {
      const stats = await fs.stat(filePath);
      return {
        sizeBytes: stats.size,
        formattedSize: formatBytes(stats.size),
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(
          `Table "${tableName}" or database "${dbName}" not found.`,
        );
      }
      throw error;
    }
  }

  public async getDatabaseStats(dbName: string) {
    const dbPath = this.repository.basePath;
    const dirPath = path.join(dbPath, dbName);
    let totalSizeBytes = 0;

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const stats = await fs.stat(path.join(dirPath, file));
          totalSizeBytes += stats.size;
        }
      }
      return {
        sizeBytes: totalSizeBytes,
        formattedSize: formatBytes(totalSizeBytes),
        tableCount: files.filter((f) => f.endsWith('.json')).length,
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`База даних "${dbName}" не знайдена.`);
      }
      throw error;
    }
  }

  public async listDatabases(): Promise<DatabaseInfoDto[]> {
    const basePath = this.repository.basePath;
    try {
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      const statsPromises = directories.map((name) =>
        this.getDatabaseStats(name),
      );
      const statsArray = await Promise.all(statsPromises);

      const result: DatabaseInfoDto[] = directories.map((name, index) => ({
        name: name,
        stats: statsArray[index],
      }));

      return result;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
