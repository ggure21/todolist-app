import { useFilterStore } from '../../stores/filterStore';
import { useCategories } from './useCategories';
import { AddCategoryForm } from './AddCategoryForm';
import type { Category } from './category.types';

function CategoryItem({
  category,
  isActive,
  onClick,
}: {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={[
          'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-600)] font-semibold'
            : 'text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]',
        ].join(' ')}
        aria-current={isActive ? 'true' : undefined}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[var(--color-gray-300)]"
          aria-hidden="true"
        />
        {category.name}
      </button>
    </li>
  );
}

export function CategoryList() {
  const { data: categories = [], isLoading } = useCategories();
  const selectedId = useFilterStore((s) => s.category_id);
  const setFilter = useFilterStore((s) => s.setFilter);

  const defaultCategories = categories.filter((c) => c.is_default);
  const userCategories = categories.filter((c) => !c.is_default);

  return (
    <nav aria-label="카테고리 목록" className="p-4">
      <p className="text-xs font-semibold text-[var(--color-gray-500)] uppercase tracking-widest px-2 mb-2">
        카테고리
      </p>

      {isLoading ? (
        <p className="text-sm text-[var(--color-gray-500)] px-2">로딩 중...</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              onClick={() => setFilter({ category_id: null })}
              className={[
                'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
                selectedId === null
                  ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-600)] font-semibold'
                  : 'text-[var(--color-gray-700)] hover:bg-[var(--color-gray-100)]',
              ].join(' ')}
              aria-current={selectedId === null ? 'true' : undefined}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[var(--color-primary-600)]" aria-hidden="true" />
              전체
            </button>
          </li>

          {defaultCategories.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              isActive={selectedId === cat.id}
              onClick={() => setFilter({ category_id: cat.id })}
            />
          ))}

          {userCategories.length > 0 && (
            <>
              <li role="separator" aria-hidden="true" className="my-1 border-t border-[var(--color-border)]" />
              {userCategories.map((cat) => (
                <CategoryItem
                  key={cat.id}
                  category={cat}
                  isActive={selectedId === cat.id}
                  onClick={() => setFilter({ category_id: cat.id })}
                />
              ))}
            </>
          )}

          <li role="separator" aria-hidden="true" className="my-1 border-t border-[var(--color-border)]" />
          <li>
            <AddCategoryForm />
          </li>
        </ul>
      )}
    </nav>
  );
}
