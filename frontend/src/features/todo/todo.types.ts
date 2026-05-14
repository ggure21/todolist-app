export interface TodoFilters {
  category_id?: string | null;
  is_completed?: boolean | null;
  overdue?: boolean | null;
}

export interface Todo {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  title: string;
  category_id: string;
  description?: string;
  due_date?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  category_id?: string;
  description?: string | null;
  due_date?: string | null;
}

export interface ToggleTodoCompleteRequest {
  is_completed: boolean;
}
