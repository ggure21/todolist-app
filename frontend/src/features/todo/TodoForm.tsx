import { type FormEvent, useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { isValidFutureDate } from '../../utils/date.utils';
import { validateTodoTitle } from '../../utils/validation.utils';
import { useCategories } from '../category/useCategories';

export interface TodoFormValues {
  title: string;
  category_id: string;
  description: string;
  due_date: string;
}

interface TodoFormProps {
  initialValues?: Partial<TodoFormValues>;
  onSubmit: (values: TodoFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function TodoForm({
  initialValues,
  onSubmit,
  onCancel,
  isPending = false,
  submitLabel = '저장',
}: TodoFormProps) {
  const { data: categories = [] } = useCategories();

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [dueDate, setDueDate] = useState(initialValues?.due_date ?? '');

  const [titleError, setTitleError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [dueDateError, setDueDateError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const tErr = validateTodoTitle(title);
    const cErr = categoryId ? null : '카테고리를 선택해주세요.';
    const dErr =
      dueDate && !isValidFutureDate(dueDate)
        ? '종료예정일은 오늘 이후 날짜여야 합니다.'
        : null;

    setTitleError(tErr);
    setCategoryError(cErr);
    setDueDateError(dErr);

    if (tErr || cErr || dErr) return;

    onSubmit({ title: title.trim(), category_id: categoryId, description, due_date: dueDate });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="할일 폼">
      <div className="flex flex-col gap-3">
        <Input
          id="todo-title"
          label="제목"
          type="text"
          placeholder="할일 제목을 입력하세요"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(null);
          }}
          error={titleError ?? undefined}
        />

        <div className="flex flex-col gap-1">
          <label
            htmlFor="todo-category"
            className="text-xs font-medium text-[var(--color-gray-700)]"
          >
            카테고리
          </label>
          <select
            id="todo-category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              if (categoryError) setCategoryError(null);
            }}
            aria-label="카테고리"
            aria-invalid={!!categoryError}
            className={[
              'w-full h-9 px-3 rounded-md text-sm text-[var(--color-gray-900)]',
              'border bg-[var(--color-bg-base)] outline-none transition-colors',
              'focus:border-[var(--color-border-focus)] focus:shadow-[0_0_0_3px_rgba(3,199,90,0.12)]',
              categoryError
                ? 'border-[var(--color-danger)]'
                : 'border-[var(--color-gray-200)]',
            ].join(' ')}
          >
            <option value="">카테고리 선택</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {categoryError && (
            <span role="alert" className="text-xs text-[var(--color-danger)] mt-0.5">
              {categoryError}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="todo-description"
            className="text-xs font-medium text-[var(--color-gray-700)]"
          >
            설명
          </label>
          <textarea
            id="todo-description"
            aria-label="설명"
            placeholder="상세 설명을 입력하세요 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-md text-sm text-[var(--color-gray-900)] border border-[var(--color-gray-200)] bg-[var(--color-bg-base)] outline-none transition-colors resize-none placeholder:text-[var(--color-gray-500)] focus:border-[var(--color-border-focus)] focus:shadow-[0_0_0_3px_rgba(3,199,90,0.12)]"
          />
        </div>

        <Input
          id="todo-due-date"
          label="종료예정일"
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            if (dueDateError) setDueDateError(null);
          }}
          error={dueDateError ?? undefined}
        />

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            loading={isPending}
            className="flex-1"
          >
            {submitLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
          >
            취소
          </Button>
        </div>
      </div>
    </form>
  );
}
