import { useMutation } from '@tanstack/react-query'
import { http } from './http'
import type { AuthResponse, Role, UpdateProfileRequest, UserDto } from './types'

export function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return http<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })
}

export function registerRequest(input: { email: string; password: string; name: string; role: Role }): Promise<AuthResponse> {
  return http<AuthResponse>('/auth/register', { method: 'POST', body: input })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => http<UserDto>('/me/profile', { method: 'PUT', body }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) => http<void>('/me/password', { method: 'PUT', body }),
  })
}
