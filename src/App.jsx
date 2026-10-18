import { useEffect, useState } from 'react';
import { loadCases, saveCase } from './storage.js';
import {
  dateValue,
  readableDate,
  parseDate,
  getCurrentWeek,
  matchesDay,
  matchesRange,
  matchesMonth
} from './dates.js';
import CaseForm from './CaseForm.jsx';
import CaseDetail from './CaseDetail.jsx';

const months = [
  { value: '01', name: 'Январь' },
  { value: '02', name: 'Февраль' },
  { value: '03', name: 'Март' },
  { value: '04', name: 'Апрель' },
  { value: '05', name: 'Май' },
  { value: '06', name: 'Июнь' },
  { value: '07', name: 'Июль' },
  { value: '08', name: 'Август' },
  { value: '09', name: 'Сентябрь' },
  { value: '10', name: 'Октябрь' },
  { value: '11', name: 'Ноябрь' },
  { value: '12', name: 'Декабрь' }
];

function getRoute() {
  return window.location.hash.slice(1) || '/';
}

export default function App() {
  const today = new Date();
  const currentDate = readableDate(dateValue(today));
  const currentWeek = getCurrentWeek(today);

  const [route, setRoute] = useState(getRoute);
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [sortOrder, setSortOrder] = useState('due-asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dayDate, setDayDate] = useState(currentDate);
  const [weekStart, setWeekStart] = useState(currentWeek.start);
  const [weekEnd, setWeekEnd] = useState(currentWeek.end);
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const result = await loadCases();
    setCases(result.cases);

    if (result.damagedCount > 0) {
      setWarning(
        `Найдено поврежденных записей: ${result.damagedCount}. Остальные дела загружены.`
      );
    } else {
      setWarning('');
    }
  }

  useEffect(() => {
    function onHashChange() {
      setRoute(getRoute());
    }

    async function loadData() {
      try {
        await refresh();
      } catch {
        setWarning('Не удалось загрузить дела из локальной базы');
      } finally {
        setLoading(false);
      }
    }

    window.addEventListener('hashchange', onHashChange);
    loadData();

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  async function updateCase(item) {
    await saveCase(item);
    await refresh();
  }

  async function saveNewCase(item) {
    await updateCase(item);
    window.location.hash = '/';
  }

  async function saveEditedCase(item) {
    await updateCase(item);
    window.location.hash = `/case/${item.id}`;
  }

  const parsedDay = parseDate(dayDate);
  const parsedWeekStart = parseDate(weekStart);
  const parsedWeekEnd = parseDate(weekEnd);
  const yearNumber = Number(selectedYear);
  const yearIsValid =
    Number.isInteger(yearNumber) &&
    yearNumber >= 1000 &&
    yearNumber <= 9999;

  let filterMessage = '';
  let filterError = '';

  if (period === 'day') {
    if (parsedDay) {
      filterMessage = `Дела со сроком выполнения ${readableDate(parsedDay)}`;
    } else {
      filterError = 'Введите дату в формате ДД.ММ.ГГГГ.';
    }
  }

  if (period === 'week') {
    if (!parsedWeekStart || !parsedWeekEnd) {
      filterError = 'Введите обе даты в формате ДД.ММ.ГГГГ.';
    } else if (parsedWeekStart > parsedWeekEnd) {
      filterError = 'Начало периода не может быть позже конца';
    } else {
      filterMessage =
        `Дела со сроком с ${readableDate(parsedWeekStart)} ` +
        `по ${readableDate(parsedWeekEnd)}.`;
    }
  }

  if (period === 'month') {
    if (!yearIsValid) {
      filterError = 'Введите год четырьмя цифрами';
    } else {
      const month = months.find(item => item.value === selectedMonth);
      filterMessage =
        `Дела со сроком за ${month.name.toLowerCase()} ` +
        `${selectedYear} года`;
    }
  }

  function matchesSelectedPeriod(item) {
    if (period === 'all') {
      return true;
    }

    if (filterError) {
      return false;
    }

    if (period === 'day') {
      return matchesDay(item.dueDate, parsedDay);
    }

    if (period === 'week') {
      return matchesRange(item.dueDate, parsedWeekStart, parsedWeekEnd);
    }

    return matchesMonth(item.dueDate, selectedMonth, selectedYear);
  }

  const searchText = search.trim().toLowerCase();

  function compareCases(first, second) {
    if (sortOrder === 'due-desc') {
      return second.dueDate.localeCompare(first.dueDate);
    }

    if (sortOrder === 'promised-asc') {
      return first.promisedDate.localeCompare(second.promisedDate);
    }

    if (sortOrder === 'promised-desc') {
      return second.promisedDate.localeCompare(first.promisedDate);
    }

    return first.dueDate.localeCompare(second.dueDate);
  }

  const visibleCases = cases
    .filter(item => {
      const caseText = `${item.title} ${item.description}`.toLowerCase();
      const foundBySearch = caseText.includes(searchText);
      const foundByDate = matchesSelectedPeriod(item);
      const foundByStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return foundBySearch && foundByDate && foundByStatus;
    })
    .sort(compareCases);

  const itemId = route.split('/')[2];
  const selectedCase = cases.find(item => item.id === itemId);

  let page;

  if (loading) {
    page = <p>Загружаем дела...</p>;
  } else if (route === '/new') {
    page = <CaseForm onSave={saveNewCase} />;
  } else if (route.startsWith('/edit/') && selectedCase) {
    page = (
      <CaseForm
        key={itemId}
        item={selectedCase}
        onSave={saveEditedCase}
      />
    );
  } else if (route.startsWith('/case/') && selectedCase) {
    page = (
      <CaseDetail
        key={itemId}
        item={selectedCase}
        onUpdate={updateCase}
      />
    );
  } else if (route === '/') {
    page = (
      <main className="panel">
        <div className="case-heading">
          <h2>Мои дела</h2>
          <a className="button" href="#/new">
            + Добавить дело
          </a>
        </div>

        <div className="search-field">
          <input
            aria-label="Поиск дел"
            placeholder="Поиск по делам"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        <div className="list-options">
          <label>
            Дата
            <select
              value={period}
              onChange={event => setPeriod(event.target.value)}
            >
              <option value="all">Все дела</option>
              <option value="day">День</option>
              <option value="week">Неделя / период</option>
              <option value="month">Месяц</option>
            </select>
          </label>

          <label>
            Сортировка
            <select
              value={sortOrder}
              onChange={event => setSortOrder(event.target.value)}
            >
              <option value="due-asc">Срок выполнения: ближайшие</option>
              <option value="due-desc">Срок выполнения: поздние</option>
              <option value="promised-desc">Дата обещания: новые</option>
              <option value="promised-asc">Дата обещания: старые</option>
            </select>
          </label>

          <label>
            Статус
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="active">В процессе</option>
              <option value="done">Сделано</option>
            </select>
          </label>
        </div>

        {period === 'day' && (
          <div className="period-fields one-field">
            <label>
              Дата выполнения
              <input
                type="text"
                inputMode="numeric"
                placeholder="ДД.ММ.ГГГГ"
                value={dayDate}
                onChange={event => setDayDate(event.target.value)}
              />
            </label>
          </div>
        )}

        {period === 'week' && (
          <div className="period-filter">

            <div className="period-fields">
              <label>
                С какого дня
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="ДД.ММ.ГГГГ"
                  value={weekStart}
                  onChange={event => setWeekStart(event.target.value)}
                />
              </label>

              <label>
                По какой день
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="ДД.ММ.ГГГГ"
                  value={weekEnd}
                  onChange={event => setWeekEnd(event.target.value)}
                />
              </label>
            </div>
          </div>
        )}

        {period === 'month' && (
          <div className="period-fields">
            <label>
              Месяц
              <select
                value={selectedMonth}
                onChange={event => setSelectedMonth(event.target.value)}
              >
                {months.map(month => (
                  <option value={month.value} key={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Год
              <input
                type="number"
                inputMode="numeric"
                min="1000"
                max="9999"
                value={selectedYear}
                onChange={event => setSelectedYear(event.target.value)}
              />
            </label>
          </div>
        )}

        {filterMessage && <p className="filter-note">{filterMessage}</p>}
        {filterError && <p className="error">{filterError}</p>}

        {visibleCases.length === 0 ? (
          <p className="muted">Дел не найдено.</p>
        ) : (
          <div className="case-list">
            {visibleCases.map(item => {
              const isDone = item.status === 'done';
              const statusClass = isDone
                ? 'case-status done'
                : 'case-status progress';
              const statusText = isDone ? '✓ Сделано' : 'В процессе';

              return (
                <div className="case-row" key={item.id}>
                  <div>
                    <a className="case-title" href={`#/case/${item.id}`}>
                      {item.title}
                    </a>
                    <small>
                      Обещано: {readableDate(item.promisedDate)}
                    </small>
                    <small>
                      Выполнить до: {readableDate(item.dueDate)}
                    </small>
                  </div>

                  <div className="case-row-actions">
                    <a className="comment-action" href={`#/case/${item.id}`}>
                      Открыть дело
                    </a>
                    <span className={statusClass}>{statusText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    );
  } else {
    page = (
      <main className="panel">
        <p>Дело не найдено.</p>
        <a href="#/">К списку дел</a>
      </main>
    );
  }

  return (
    <div className="container">
      <header>
        <a className="logo" href="#/">
          Дневник обещаний
        </a>
      </header>

      {warning && <p className="warning">{warning}</p>}
      {page}
    </div>
  );
}
