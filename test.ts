// import { DatabaseRepository } from './src/core/domain/database.repository';
import { DatabaseRepository } from './src/core/persistence/database.repository';

async function runTest() {
  console.log('🚀 Початок тестування ядра бізнес-логіки...');

  const repo = new DatabaseRepository();
  const dbName = 'MyTestUniversityDB';

  // --- Крок 1: Завантажуємо базу. Оскільки її ще немає, має створитись порожній екземпляр. ---
  console.log(`\n--- Крок 1: Завантаження або створення БД "${dbName}" ---`);
  const db = await repo.load(dbName);
  console.log(
    `✅ База даних "${db.name}" успішно завантажена/створена в пам'яті.`,
  );

  // --- Крок 2: Створюємо таблицю "Студенти". ---
  console.log('\n--- Крок 2: Створення таблиці "Students" ---');
  const studentsTable = db.createTable('Students', [
    { name: 'ID', type: 'integer' },
    { name: 'FullName', type: 'string' },
    { name: 'Course', type: 'integer' },
    { name: 'RecordBook', type: 'complexInteger' },
  ]);
  console.log(
    `✅ Таблиця "${studentsTable.name}" створена з ${studentsTable.columns.length} колонками.`,
  );

  // --- Крок 3: Додаємо валідні рядки. ---
  console.log('\n--- Крок 3: Додавання валідних рядків ---');
  studentsTable.addRow({
    ID: 1,
    FullName: 'Іван Петренко',
    Course: 3,
    RecordBook: '101+0i',
  });
  studentsTable.addRow({
    ID: 2,
    FullName: 'Анна Коваленко',
    Course: 2,
    RecordBook: '102-5i',
  });
  console.log(
    `✅ Рядки додано. Поточна кількість: ${studentsTable.getRows().length}.`,
  );
  console.log('Дані першого рядка:', studentsTable.getRows()[0].toObject());

  // --- Крок 4: Тестуємо валідацію - спроба додати невалідні рядки. ---
  console.log(
    '\n--- Крок 4: Спроба додати невалідні рядки (очікуємо помилки) ---',
  );
  try {
    // Неправильний тип для ID
    studentsTable.addRow({
      ID: '3',
      FullName: 'Петро Іваненко',
      Course: 4,
      RecordBook: '103',
    });
  } catch (error) {
    console.log(`✅ Очікувана помилка перехоплена: ${error.message}`);
  }
  try {
    // Відсутнє поле Course
    studentsTable.addRow({
      ID: 4,
      FullName: 'Ольга Сидоренко',
      RecordBook: '104',
    });
  } catch (error) {
    console.log(`✅ Очікувана помилка перехоплена: ${error.message}`);
  }
  try {
    // Зайве поле Age
    studentsTable.addRow({
      ID: 5,
      FullName: 'Василь Тестовий',
      Course: 1,
      RecordBook: '105',
      Age: 20,
    });
  } catch (error) {
    console.log(`✅ Очікувана помилка перехоплена: ${error.message}`);
  }

  // --- Крок 5: Зберігаємо базу даних на диск. ---
  console.log('\n--- Крок 5: Збереження бази даних на диск ---');
  await repo.save(db);
  console.log(`✅ База даних збережена. Перевір папку ./databases/${dbName}/`);

  // --- Крок 6: Завантажуємо базу даних з диска, щоб перевірити, чи все збереглось. ---
  console.log('\n--- Крок 6: Завантаження збереженої бази даних ---');
  const loadedDb = await repo.load(dbName);
  const loadedStudentsTable = loadedDb.getTable('Students');

  if (!loadedStudentsTable || loadedStudentsTable.getRows().length !== 2) {
    console.error('❌ ПОМИЛКА: Дані завантажились некоректно!');
  } else {
    console.log(
      `✅ База успішно завантажена. Кількість рядків в таблиці "Students": ${loadedStudentsTable.getRows().length}.`,
    );
    console.log(
      'Дані другого завантаженого рядка:',
      loadedStudentsTable.getRows()[1].toObject(),
    );
  }

  // --- Крок 7: Тестуємо операцію проекції на завантаженій таблиці. ---
  console.log('\n--- Крок 7: Тестування операції проекції ---');
  const projectionTable = loadedStudentsTable?.projection(
    'FullName',
    'RecordBook',
  );
  console.log(`✅ Проекція створена. Нова таблиця: "${projectionTable?.name}"`);
  console.log(
    'Колонки проекції:',
    projectionTable?.columns.map((c) => c.name),
  );
  console.log(
    'Дані першого рядка проекції:',
    projectionTable?.getRows()[0].toObject(),
  );

  //   // --- Крок 8: Видаляємо таблицю і зберігаємо зміни. ---
  //   console.log('\n--- Крок 8: Видалення таблиці та збереження ---');
  //   loadedDb.dropTable('Students');
  //   console.log(
  //     `Таблиці в пам'яті: ${loadedDb.listTables().join(', ') || 'немає'}`,
  //   );
  //   await repo.save(loadedDb);
  //   console.log('✅ Зміни збережено. Файл Students.json має бути видалений.');

  console.log('\n🏁 Тестування ядра завершено успішно!');
}

// Запускаємо наш тест і ловимо будь-які непередбачувані помилки
runTest().catch((error) => {
  console.error('\n💥 Під час тестування сталася критична помилка:', error);
});
