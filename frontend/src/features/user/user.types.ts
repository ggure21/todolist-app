export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserRequest {
  name?: string;
  current_password?: string;
  new_password?: string;
}
