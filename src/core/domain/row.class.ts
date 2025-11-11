import { RawRowData } from '../types/types';

export class Row {
  private data: RawRowData;

  constructor(initialData: RawRowData) {
    this.data = { ...initialData };
  }

  public getValue(columnName: string): any {
    return this.data[columnName];
  }

  public setValue(columnName: string, value: any): void {
    this.data[columnName] = value;
  }

  public toObject(): RawRowData {
    return { ...this.data };
  }
}
