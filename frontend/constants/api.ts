/**
 * Centralized API configuration
 * 
 * In __DEV__ mode (Expo Go / dev builds): uses local IP
 * In production builds (APK/AAB): uses Render hosted backend
 */
import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://crammer-api-v9bz.onrender.com';
const LOCAL_IP = '10.123.11.99'; // Your computer's local network IP

export const getApiBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${LOCAL_IP}:8000/api/v1`;
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:8000/api/v1';
    }
    return 'http://localhost:8000/api/v1';
  }
  return `${PRODUCTION_URL}/api/v1`;
};

export const getServerBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${LOCAL_IP}:8000`;
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:8000';
    }
    return 'http://localhost:8000';
  }
  return PRODUCTION_URL;
};

export const API_BASE_URL = getApiBaseUrl();
export const SERVER_BASE_URL = getServerBaseUrl();
