import { Database } from './database.class';

describe('Database Class', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database('TestDB');
  });

  it('should create a database with a valid name', () => {
    expect(db.name).toBe('TestDB');
  });

  it('should throw an error for an invalid database name', () => {
    expect(() => new Database('Invalid Name')).toThrow();
    expect(() => new Database('Invalid/Name')).toThrow();
  });

  it('should create and retrieve a table', () => {
    const columns = [
      { name: 'ID', type: 'integer' as const, autoIncrement: true },
    ];
    db.createTable('Users', columns);
    const table = db.getTable('Users');

    expect(table).toBeDefined();
    expect(table?.name).toBe('Users');
  });

  it('should drop a table', () => {
    const columns = [
      { name: 'ID', type: 'integer' as const, autoIncrement: true },
    ];
    db.createTable('Users', columns);

    let table = db.getTable('Users');
    expect(table).toBeDefined();

    db.dropTable('Users');
    table = db.getTable('Users');
    expect(table).toBeUndefined();
  });
});
