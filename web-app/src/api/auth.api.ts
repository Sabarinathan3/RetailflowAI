import { apiClient } from './client';
import type { ApiResponse } from '@/types/api.types';
import type {
  LoginInput,
  LoginResponse,
  PinLoginInput,
  RegisterInput,
  RegisterResponse,
  AuthUser,
} from '@/types/auth.types';

export const authApi = {
  login: (data: LoginInput) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterInput) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data).then((r) => r.data),

  pinLogin: (data: PinLoginInput) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/pin-login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  getMe: () =>
    apiClient.get<ApiResponse<AuthUser>>('/auth/me').then((r) => r.data),
};
