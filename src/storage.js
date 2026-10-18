import { openDB } from 'idb';

const database = openDB('promise-diary', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('cases')) {
      db.createObjectStore('cases', { keyPath: 'id' });
    }
  }
});

function isValidComment(comment) {
  if (!comment) {
    return false;
  }

  return (
    typeof comment.text === 'string' &&
    typeof comment.createdAt === 'string'
  );
}

function isValidCase(item) {
  if (!item) {
    return false;
  }

  if (typeof item.id !== 'string') {
    return false;
  }

  if (typeof item.title !== 'string' || !item.title.trim()) {
    return false;
  }

  if (typeof item.description !== 'string') {
    return false;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(item.promisedDate)) {
    return false;
  }

  if (!datePattern.test(item.dueDate)) {
    return false;
  }

  if (!['active', 'done'].includes(item.status)) {
    return false;
  }

  if (!Array.isArray(item.comments)) {
    return false;
  }

  return item.comments.every(isValidComment);
}

export async function loadCases() {
  const db = await database;
  const records = await db.getAll('cases');
  const cases = [];
  let damagedCount = 0;

  for (const record of records) {
    try {
      const item = JSON.parse(record.data);

      if (!isValidCase(item) || item.id !== record.id) {
        throw new Error('Поврежденное дело');
      }

      cases.push(item);
    } catch {
      damagedCount++;
    }
  }

  return { cases, damagedCount };
}

export async function saveCase(item) {
  if (!isValidCase(item)) {
    throw new Error('Некорректные данные дела');
  }

  const db = await database;
  await db.put('cases', { id: item.id, data: JSON.stringify(item) });
}
