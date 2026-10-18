import { useState } from 'react';
import { dateValue, readableDate, parseDate } from './dates.js';

function displayDate(value) {
  const isDatabaseDate = /^\d{4}-\d{2}-\d{2}$/.test(value);

  if (isDatabaseDate) {
    return readableDate(value);
  }

  return value;
}

function getSavedDraft(key, initial) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));

    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      return {
        title: saved.title ?? initial.title,
        description: saved.description ?? initial.description,
        promisedDate: displayDate(
          saved.promisedDate ?? initial.promisedDate
        ),
        dueDate: displayDate(saved.dueDate ?? initial.dueDate)
      };
    }
  } catch {
    // Поврежденный черновик не мешает открыть форму
  }

  return initial;
}

export default function CaseForm({ item, onSave }) {
  const draftKey = item ? `draft:edit:${item.id}` : 'draft:new';
  const initial = {
    title: item?.title || '',
    description: item?.description || '',
    promisedDate: readableDate(item?.promisedDate || dateValue()),
    dueDate: readableDate(item?.dueDate || dateValue())
  };

  const [form, setForm] = useState(() => getSavedDraft(draftKey, initial));
  const [error, setError] = useState('');

  function change(field, value) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    setError('');

    try {
      localStorage.setItem(draftKey, JSON.stringify(updated));
    } catch {
      setError('Не удалось сохранить черновик в браузере');
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Укажите название дела');
      return;
    }

    const promisedDate = parseDate(form.promisedDate);
    const dueDate = parseDate(form.dueDate);

    if (!promisedDate || !dueDate) {
      setError('Введите даты в формате ДД.ММ.ГГГГ');
      return;
    }

    if (dueDate < promisedDate) {
      setError('Дата выполнения не может быть раньше даты обещания');
      return;
    }

    const data = {
      title: form.title.trim(),
      description: form.description,
      promisedDate,
      dueDate
    };

    let updated;

    if (item) {
      updated = { ...item, ...data };
    } else {
      updated = {
        id: crypto.randomUUID(),
        ...data,
        status: 'active',
        comments: []
      };
    }

    try {
      await onSave(updated);

      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Дело уже сохранено, поэтому ошибку удаления черновика можно пропустить.
      }
    } catch {
      setError('Не удалось сохранить дело. Введенные данные остались в форме.');
    }
  }

  return (
    <section className="panel">
      <h2>{item ? 'Редактировать дело' : 'Добавить дело'}</h2>

      <form onSubmit={submit}>
        <label>
          Название
          <input
            value={form.title}
            onChange={event => change('title', event.target.value)}
            required
          />
        </label>

        <label>
          Описание
          <textarea
            rows="4"
            value={form.description}
            onChange={event => change('description', event.target.value)}
          />
        </label>

        <div className="date-fields">
          <label>
            Когда обещано
            <input
              type="text"
              inputMode="numeric"
              placeholder="ДД.ММ.ГГГГ"
              value={form.promisedDate}
              onChange={event => change('promisedDate', event.target.value)}
              required
            />
          </label>

          <label>
            Выполнить до
            <input
              type="text"
              inputMode="numeric"
              placeholder="ДД.ММ.ГГГГ"
              value={form.dueDate}
              onChange={event => change('dueDate', event.target.value)}
              required
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button type="submit">Сохранить</button>
          <a
            className="button secondary"
            href={item ? `#/case/${item.id}` : '#/'}
          >
            Назад
          </a>
        </div>
      </form>
    </section>
  );
}
