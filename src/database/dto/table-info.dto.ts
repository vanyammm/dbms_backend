interface TableStatsDto {
  sizeBytes: number;
  formattedSize: string;
}

export class TableInfoDto {
  name: string;
  stats: TableStatsDto;
}
