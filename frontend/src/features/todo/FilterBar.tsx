import { useCategories } from '../category/useCategories';
import { useFilterStore } from '../../stores/filterStore';

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-[var(--color-gray-700)] whitespace-nowrap">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 pr-6 text-sm border border-[var(--color-gray-200)] rounded-md bg-[var(--color-bg-base)] text-[var(--color-gray-900)] outline-none focus:border-[var(--color-border-focus)] cursor-pointer"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterBar() {
  const { data: categories = [] } = useCategories();
  const { category_id, is_completed, overdue, setFilter, resetFilter } = useFilterStore();

  const categoryOptions = [
    { value: '', label: '전체' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const overdueOptions = [
    { value: '', label: '전체' },
    { value: 'false', label: '기간내' },
    { value: 'true', label: '기간초과' },
  ];

  const completedOptions = [
    { value: '', label: '전체' },
    { value: 'true', label: '완료' },
    { value: 'false', label: '미완료' },
  ];

  const handleCategoryChange = (val: string) => {
    setFilter({ category_id: val === '' ? null : val });
  };

  const handleOverdueChange = (val: string) => {
    setFilter({ overdue: val === '' ? null : val === 'true' });
  };

  const handleCompletedChange = (val: string) => {
    setFilter({ is_completed: val === '' ? null : val === 'true' });
  };

  const hasActiveFilter =
    category_id !== null || is_completed !== null || overdue !== null;

  return (
    <div
      role="search"
      aria-label="할일 필터"
      className="flex flex-wrap items-center gap-3"
    >
      <FilterSelect
        id="filter-category"
        label="카테고리"
        value={category_id ?? ''}
        onChange={handleCategoryChange}
        options={categoryOptions}
      />

      <FilterSelect
        id="filter-overdue"
        label="기간초과"
        value={overdue === null ? '' : String(overdue)}
        onChange={handleOverdueChange}
        options={overdueOptions}
      />

      <FilterSelect
        id="filter-completed"
        label="완료여부"
        value={is_completed === null ? '' : String(is_completed)}
        onChange={handleCompletedChange}
        options={completedOptions}
      />

      {hasActiveFilter && (
        <button
          onClick={resetFilter}
          className="text-sm text-[var(--color-gray-500)] hover:text-[var(--color-danger)] transition-colors underline"
          aria-label="필터 초기화"
        >
          초기화
        </button>
      )}
    </div>
  );
}
