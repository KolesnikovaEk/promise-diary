export function dateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(value) {
  if (!value) {
    return '';
  }

  let year;
  let month;
  let day;

  if (value.includes('.')) {
    const parts = value.split('.');

    if (parts.length !== 3) {
      return '';
    }

    day = Number(parts[0]);
    month = Number(parts[1]);
    year = Number(parts[2]);
  } else {
    const parts = value.split('-');

    if (parts.length !== 3) {
      return '';
    }

    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  }

  const numbersAreInvalid =
    year < 1000 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31;

  if (numbersAreInvalid) {
    return '';
  }

  const date = new Date(year, month - 1, day);
  const dateIsInvalid =
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day;

  if (dateIsInvalid) {
    return '';
  }

  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}

export function readableDate(value) {
  const date = parseDate(value);

  if (!date) {
    return '';
  }

  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

export function getCurrentWeek(date = new Date()) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - (date.getDay() + 6) % 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: readableDate(dateValue(monday)),
    end: readableDate(dateValue(sunday))
  };
}

export function matchesDay(date, selectedDate) {
  const caseDate = parseDate(date);
  const filterDate = parseDate(selectedDate);

  return Boolean(caseDate && filterDate && caseDate === filterDate);
}

export function matchesRange(date, startDate, endDate) {
  const caseDate = parseDate(date);
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!caseDate || !start || !end) {
    return false;
  }

  return caseDate >= start && caseDate <= end;
}

export function matchesMonth(date, month, year) {
  const caseDate = parseDate(date);

  if (!caseDate) {
    return false;
  }

  const monthText = String(month).padStart(2, '0');
  const yearText = String(year);

  if (monthText.length !== 2 || yearText.length !== 4) {
    return false;
  }

  return caseDate.slice(0, 7) === `${yearText}-${monthText}`;
}

export function caseStatus(item) {
  if (item.status === 'done') {
    return 'Завершено';
  }

  const deadline = parseDate(item.dueDate);

  if (deadline && deadline < dateValue()) {
    return 'Просрочено';
  }

  return 'В процессе';
}
