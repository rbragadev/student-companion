/**
 * Wrapper padrão de resposta da API
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

