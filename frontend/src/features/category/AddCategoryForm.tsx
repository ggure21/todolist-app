import { type FormEvent, useState } from 'react';
import { ApiError } from '../../api/client';
import { useCreateCategory } from './useCreateCategory';

export function AddCategoryForm() {
  const { mutate, isPending, error, isError, reset } = useCreateCategory();
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setName('');
          setIsOpen(false);
        },
      },
    );
  };

  const handleCancel = () => {
    setName('');
    setIsOpen(false);
    reset();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 w-full px-2 py-1.5 text-sm text-[var(--color-gray-500)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-gray-100)] rounded-md transition-colors"
      >
        <span aria-hidden="true">+</span>
        <span>카테고리 추가</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="카테고리 추가 폼">
      <input
        id="new-category-name"
        type="text"
        placeholder="새 카테고리명"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (isError) reset();
        }}
        autoFocus
        className="w-full h-8 px-2 text-sm border border-[var(--color-gray-200)] rounded-md outline-none focus:border-[var(--color-border-focus)] mb-1"
        aria-label="새 카테고리 이름"
      />

      {isError && (
        <p role="alert" className="text-xs text-[var(--color-danger)] mb-1">
          {error instanceof ApiError && error.code === 'DUPLICATE_CATEGORY'
            ? '이미 존재하는 이름입니다.'
            : '카테고리 추가에 실패했습니다.'}
        </p>
      )}

      <div className="flex gap-1">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="flex-1 h-7 text-xs font-medium bg-[var(--color-primary-600)] text-white rounded-md hover:bg-[var(--color-primary-500)] disabled:bg-[var(--color-gray-300)] disabled:cursor-not-allowed"
        >
          추가
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 h-7 text-xs font-medium border border-[var(--color-gray-300)] text-[var(--color-gray-700)] rounded-md hover:bg-[var(--color-gray-100)]"
        >
          취소
        </button>
      </div>
    </form>
  );
}
