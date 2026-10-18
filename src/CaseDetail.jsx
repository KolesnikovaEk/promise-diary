import { useState } from 'react';
import { readableDate, caseStatus } from './dates.js';

export default function CaseDetail({ item, onUpdate }) {
  const draftKey = `comment:${item.id}`;
  const statusClass = item.status === 'done'
    ? 'status done'
    : 'status progress';

  const [comment, setComment] = useState(() => {
    try {
      return localStorage.getItem(draftKey) || '';
    } catch {
      return '';
    }
  });
  const [error, setError] = useState('');

  function changeComment(value) {
    setComment(value);

    try {
      localStorage.setItem(draftKey, value);
    } catch {
      setError('Не удалось сохранить черновик комментария');
    }
  }

  async function addComment(event) {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    const newComment = {
      id: crypto.randomUUID(),
      text: comment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const updatedItem = {
        ...item,
        comments: [...item.comments, newComment]
      };

      await onUpdate(updatedItem);
      setComment('');

      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Комментарий уже сохранен в базе
      }

      setError('');
    } catch {
      setError('Не удалось сохранить комментарий. Текст не потерян.');
    }
  }

  async function closeCase() {
    try {
      await onUpdate({ ...item, status: 'done' });
      setError('');
    } catch {
      setError('Не удалось закрыть дело');
    }
  }

  async function deleteComment(commentIndex) {
    const shouldDelete = window.confirm('Удалить этот комментарий?');

    if (!shouldDelete) {
      return;
    }

    const updatedComments = item.comments.filter((entry, index) => {
      return index !== commentIndex;
    });

    try {
      await onUpdate({ ...item, comments: updatedComments });
      setError('');
    } catch {
      setError('Не удалось удалить комментарий');
    }
  }

  return (
    <section className="panel">
      <a href="#/">К списку дел</a>

      <div className="heading">
        <h2>{item.title}</h2>
        <span className={statusClass}>{caseStatus(item)}</span>
      </div>

      <p>{item.description || 'Описание отсутствует'}</p>

      <p>
        <b>Обещано:</b> {readableDate(item.promisedDate)}
      </p>
      <p>
        <b>Выполнить до:</b> {readableDate(item.dueDate)}
      </p>

      <div className="actions">
        <a className="button secondary" href={`#/edit/${item.id}`}>
          Редактировать
        </a>

        {item.status !== 'done' && (
          <button onClick={closeCase}>Завершить дело</button>
        )}
      </div>

      <hr />
      <h3>Комментарии</h3>

      {item.comments.length === 0 && (
        <p className="muted">Комментариев пока нет.</p>
      )}

      {item.comments.map((entry, index) => (
        <div className="comment" key={entry.id || index}>
          <p>{entry.text}</p>

          <div className="comment-footer">
            <small>
              {new Date(entry.createdAt).toLocaleString('ru-RU')}
            </small>
            <button
              className="comment-delete"
              type="button"
              onClick={() => deleteComment(index)}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}

      <form onSubmit={addComment}>
        <label>
          Новый комментарий
          <textarea
            rows="3"
            value={comment}
            onChange={event => changeComment(event.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!comment.trim()}>
          Добавить комментарий
        </button>
      </form>
    </section>
  );
}
