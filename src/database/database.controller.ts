import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DatabaseService } from './database.service';
import { CreateTableDto } from './dto/create-table.dto';
import type { RawRowData } from 'src/core/types/types';
import { ProjectionDto } from './dto/projection.dto';
import { DatabaseInfoDto } from './dto/database-info.dto';
import { TableInfoDto } from './dto/table-info.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('databases')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async listDatabases(): Promise<DatabaseInfoDto[]> {
    return this.databaseService.listDatabases();
  }

  @Post(':dbName')
  async createDatabase(@Param('dbName') dbName: string) {
    await this.databaseService.createDatabase(dbName);
    return { message: `База даних '${dbName}' успішно створена.` };
  }

  @Delete(':dbName')
  async dropDatabase(@Param('dbName') dbName: string) {
    await this.databaseService.dropDatabase(dbName);
    return {
      message: `Database '${dbName}' and all its contents have been successfully deleted.`,
    };
  }

  @Get(':dbName/tables')
  async listTables(@Param('dbName') dbName: string): Promise<TableInfoDto[]> {
    return this.databaseService.listTables(dbName);
  }

  @Post(':dbName/tables')
  async createTable(
    @Param('dbName') dbName: string,
    @Body() createTableDto: CreateTableDto,
  ) {
    const { tableName, columns } = createTableDto;
    await this.databaseService.createTable(dbName, tableName, columns);
    return {
      message: `Table '${tableName}' successfuly created in '${dbName}' database.`,
    };
  }

  @Get(':dbName/tables/:tableName/rows')
  async getTableRowsPaginated(
    @Param('dbName') dbName: string,
    @Param('tableName') tableName: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.databaseService.getTableRowsPaginated(
      dbName,
      tableName,
      paginationQuery,
    );
  }

  @Post(':dbName/tables/:tableName/rows')
  async addRowToTable(
    @Param('dbName') dbName: string,
    @Param('tableName') tableName: string,
    @Body() rowData: RawRowData,
  ) {
    await this.databaseService.addRowToTable(dbName, tableName, rowData);
    return { message: `Рядок успішно додано до таблиці '${tableName}'.` };
  }

  @Delete(':dbName/tables/:tableName/rows')
  @HttpCode(HttpStatus.OK)
  async deleteRowFromTable(
    @Param('dbName') dbName: string,
    @Param('tableName') tableName: string,
    @Query() filter: RawRowData,
  ) {
    const result = await this.databaseService.deleteRowFromTable(
      dbName,
      tableName,
      filter,
    );
    return {
      message: 'The row was successfully deleted.',
      ...result,
    };
  }

  @Patch(':dbName/tables/:tableName/rows')
  async updateRowsInTable(
    @Param('dbName') dbName: string,
    @Param('tableName') tableName: string,
    @Query() filter: RawRowData,
    @Body() rowData: RawRowData,
  ) {
    const result = await this.databaseService.updateRowsInTable(
      dbName,
      tableName,
      filter,
      rowData,
    );
    return {
      message: `Операцію оновлення завершено.`,
      ...result,
    };
  }

  @Post(':dbName/tables/:tableName/projection')
  async projectTable(
    @Param('dbName') dbName: string,
    @Param('tableName') tableName: string,
    @Body() projectionDto: ProjectionDto,
  ): Promise<any> {
    return this.databaseService.projectTable(
      dbName,
      tableName,
      projectionDto.columns,
    );
  }

  @Delete(':dbName/tables/:tableName')
  async dropTable(
    @Param('dbName') dbName: string,
    @Param('tableName') tableName: string,
  ) {
    await this.databaseService.dropTable(dbName, tableName);
    return {
      message: `Table '${tableName}' successfully deleted from database '${dbName}'.`,
    };
  }

  @Get(':dbName/stats')
  async getDatabaseStats(@Param('dbName') dbName: string) {
    return this.databaseService.getDatabaseStats(dbName);
  }

  @Get(':dbName/tables/:tableName/stats')
  async getTableStats(
    @Param('dbName') dbName: string,
    @Param('tableName') tableName: string,
  ) {
    return this.databaseService.getTableStats(dbName, tableName);
  }
}
