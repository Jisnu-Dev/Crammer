/**
 * API configuration and service for backend communication
 */

import { Platform } from 'react-native';

// API Base URL - automatically handles Android emulator, iOS simulator, and web
const getBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator needs 10.0.2.2 instead of localhost
      return 'http://10.0.2.2:8000/api/v1';
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:8000/api/v1';
    } else {
      // Web
      return 'http://localhost:8000/api/v1';
    }
  }
  // Production - update this with your production API URL
  return 'https://your-production-api.com/api/v1';
};

const API_BASE_URL = getBaseUrl();

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  details?: any;
}

interface SignUpData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UserData {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthResponse {
  user: UserData;
  token: TokenData;
  message: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Make a generic API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Request failed',
          details: data.details,
        };
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * User signup
   */
  async signup(signupData: SignUpData): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  /**
   * User login
   */
  async login(loginData: LoginData): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  /**
   * Get current user (requires authentication)
   */
  async getCurrentUser(token: string): Promise<ApiResponse<UserData>> {
    return this.request<UserData>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export type {
  ApiResponse,
  SignUpData,
  LoginData,
  UserData,
  TokenData,
  AuthResponse,
};
