/**
 * API configuration and service for backend communication
 */

import { Platform } from 'react-native';

// API Base URL - automatically handles Android emulator, iOS simulator, and web
const getBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // For Android physical device: use your computer's local network IP
      // For Android emulator: use 10.0.2.2
      // Update this IP to match your computer's IP address
      const LOCAL_IP = '10.123.11.99'; // Replace with your computer's local IP
      console.log('Platform detected: Android - Using local network IP:', LOCAL_IP);
      return `http://${LOCAL_IP}:8000/api/v1`;
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      console.log('Platform detected: iOS - Using localhost');
      return 'http://localhost:8000/api/v1';
    } else {
      // Web or other platforms
      console.log(`Platform detected: ${Platform.OS} - Using localhost`);
      return 'http://localhost:8000/api/v1';
    }
  }
  // Production - update this with your production API URL
  return 'https://your-production-api.com/api/v1';
};

const API_BASE_URL = getBaseUrl();
console.log('API Base URL configured as:', API_BASE_URL);

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
    
    console.log('Making API request to:', url);
    console.log('Request options:', options);
    
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
      console.log('Fetching URL:', url);
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

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
      console.error('Error details:', {
        message: error.message,
        url: url,
        endpoint: endpoint
      });
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
