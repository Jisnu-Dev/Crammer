/**
 * File upload API service
 */
import { getAccessToken } from '../utils/auth';
import { API_BASE_URL } from '../constants/api';

export interface FileMetadata {
  id: number;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  category: string;
  title?: string;
  description?: string;
  subject?: string;
  has_extracted_text?: boolean;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  data: FileMetadata;
}

export interface ListFilesResponse {
  success: boolean;
  message: string;
  data: FileMetadata[];
}

class FileApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async uploadFile(
    file: {
      uri: string;
      name: string;
      type: string;
    },
    category: string = 'other',
    title?: string,
    description?: string,
    subject?: string
  ): Promise<UploadFileResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('File name:', file.name, 'Type:', file.type);
    console.log('Category:', category);
    console.log('Title:', title);
    console.log('API URL:', `${this.baseURL}/files/upload`);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // For React Native, we need to use this specific format
      // @ts-ignore - React Native FormData accepts this format
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'application/octet-stream',
      });
      
      formData.append('category', category);
      if (title) {
        formData.append('title', title);
      }
      if (description) {
        formData.append('description', description);
      }
      if (subject) {
        formData.append('subject', subject);
      }

      console.log('FormData prepared, sending request...');
      console.log('Request headers will include: Authorization: Bearer [token]');

      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          // Don't set Content-Type - let fetch handle it automatically for FormData
        },
        body: formData,
      });

      console.log('Response received - Status:', response.status);
      
      // Try to parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }
      
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        const errorMessage = data.message || data.detail || 'Upload failed';
        const errorDetails = data.details || '';
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }

      return data;
    } catch (error: any) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      // Provide more helpful error messages
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Please ensure:\n1. Backend is running on http://10.61.19.201:8000\n2. Your phone is on the same WiFi network\n3. Windows Firewall allows port 8000');
      }
      
      throw error;
    }
  }

  /**
   * Get list of uploaded files
   */
  async listFiles(category?: string): Promise<ListFilesResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = new URL(`${this.baseURL}/files/`);
    if (category) {
      url.searchParams.append('category', category);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Failed to fetch files',
          details: data.details,
        };
      }

      return data;
    } catch (error: any) {
      console.error('List files error:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: number): Promise<{ success: boolean; message: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${this.baseURL}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Failed to delete file',
          details: data.details,
        };
      }

      return data;
    } catch (error: any) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  async updateFile(
    fileId: number,
    updates: {
      title?: string;
      description?: string;
      category?: string;
    }
  ): Promise<UploadFileResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${this.baseURL}/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'Failed to update file',
          details: data.details,
        };
      }

      return data;
    } catch (error: any) {
      console.error('Update file error:', error);
      throw error;
    }
  }
}

export const fileApiService = new FileApiService();
