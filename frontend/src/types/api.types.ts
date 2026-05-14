export interface ApiErrorResponse {
  message: string;
  code: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export type ApiResponse<T> = T;
