interface DatabaseStatsDto {
  sizeBytes: number;
  formattedSize: string;
  tableCount: number;
}

export class DatabaseInfoDto {
  name: string;
  stats: DatabaseStatsDto;
}
