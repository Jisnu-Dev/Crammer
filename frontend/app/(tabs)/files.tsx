import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CustomButton } from '../../components/common/CustomButton';
import { CustomDropdown, DropdownOption } from '../../components/common/CustomDropdown';
import { CustomInput } from '../../components/common/CustomInput';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';
import { fileApiService, FileMetadata } from '../../services/fileApi';
import { useAuth } from '../../contexts/AuthContext';

const categoryOptions: DropdownOption[] = [
  { label: 'Notes', value: 'notes' },
  { label: 'Syllabus', value: 'syllabus' },
  { label: 'Assignment', value: 'assignment' },
  { label: 'Resource', value: 'resource' },
  { label: 'Other', value: 'other' },
];

export default function FilesScreen() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('notes');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [viewingFile, setViewingFile] = useState<FileMetadata | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [filterCategory]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileApiService.listFiles(filterCategory || undefined);
      if (response.success) {
        setFiles(response.data);
      }
    } catch (error: any) {
      console.error('Load files error:', error);
      Alert.alert('Error', error.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      console.log('Opening document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker completed. Canceled:', result.canceled);

      if (result.canceled) {
        console.log('Document picker was canceled');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('No assets selected');
        return;
      }

      const file = result.assets[0];
      console.log('Selected file - Name:', file.name, 'Size:', file.size, 'Type:', file.mimeType);

      // Validate file type
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        Alert.alert('Unsupported File', 'Please select a PDF, Word document, text file, or image.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
        return;
      }
      
      // Ensure we have the correct structure and proper mime type
      let mimeType = file.mimeType || 'application/octet-stream';
      
      // Fix common mime type issues for PDFs
      if (file.name.toLowerCase().endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (file.name.toLowerCase().endsWith('.doc')) {
        mimeType = 'application/msword';
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        mimeType = 'text/plain';
      }
      
      const fileObject = {
        uri: file.uri,
        name: file.name,
        type: mimeType,
      };
      console.log('Formatted file - Name:', fileObject.name, 'Type:', fileObject.type);
      
      setSelectedFile(fileObject);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setUploadCategory('notes');
      setUploadDescription('');
      setShowUploadModal(true);
    } catch (error: any) {
      console.error('Document picker error:', error);
      if (error.message && !error.message.includes('canceled')) {
        Alert.alert('Error', 'Failed to pick document. Please try again.');
      }
    }
  };

  const pickImage = async () => {
    try {
      console.log('Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      console.log('Opening image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('Image picker completed. Canceled:', result.canceled);

      if (result.canceled) {
        console.log('Image picker was canceled');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('No image selected');
        return;
      }

      const image = result.assets[0];
      console.log('Selected image - URI exists:', !!image.uri, 'Size:', image.fileSize);
      
      // Validate file size if available
      if (image.fileSize && image.fileSize > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select an image smaller than 10MB');
        return;
      }
      
      // Extract file extension and mime type from URI or use defaults
      let fileName = `image_${Date.now()}.jpg`;
      let mimeType = 'image/jpeg';
      
      if (image.uri) {
        // Try to get extension from URI
        const uriParts = image.uri.split('.');
        const extension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
        
        // Map extension to mime type
        const mimeTypeMap: { [key: string]: string } = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'heic': 'image/heic',
        };
        
        mimeType = mimeTypeMap[extension] || 'image/jpeg';
        fileName = `image_${Date.now()}.${extension}`;
      }
      
      const file = {
        uri: image.uri,
        name: fileName,
        type: mimeType,
      };
      console.log('Formatted file - Name:', fileName, 'Type:', mimeType);
      
      setSelectedFile(file);
      setUploadTitle(`Photo ${new Date().toLocaleDateString()}`);
      setUploadCategory('notes');
      setUploadDescription('');
      setShowUploadModal(true);
    } catch (error: any) {
      console.error('Image picker error:', error);
      if (error.message && !error.message.includes('canceled')) {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  };

  const handleUploadConfirm = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'No file selected');
      return;
    }

    if (!uploadTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the file');
      return;
    }
    
    if (uploading) {
      console.log('Upload already in progress, ignoring duplicate request');
      return;
    }
    
    console.log('=== UPLOAD CONFIRM ===');
    console.log('Selected file:', selectedFile);
    console.log('Category:', uploadCategory);
    console.log('Title:', uploadTitle);
    
    try {
      setUploading(true);
      setShowUploadModal(false);
      
      console.log('Calling fileApiService.uploadFile...');
      const response = await fileApiService.uploadFile(
        selectedFile,
        uploadCategory,
        uploadTitle.trim(),
        uploadDescription.trim()
      );
      
      console.log('Upload response:', response);
      
      if (response.success) {
        Alert.alert('Success', 'File uploaded successfully');
        setSelectedFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setUploadCategory('notes');
        await loadFiles();
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || error.details || 'Failed to upload file. Please check your connection and try again.';
      Alert.alert('Upload Failed', errorMessage);
      // Reopen modal on error so user can retry
      setShowUploadModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCancel = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadTitle('');
    setUploadDescription('');
  };

  const deleteFile = async (fileId: number, filename: string) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${filename}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fileApiService.deleteFile(fileId);
              Alert.alert('Success', 'File deleted successfully');
              await loadFiles();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return 'document-text';
      case 'image':
        return 'image';
      case 'document':
        return 'document';
      default:
        return 'attach';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilePress = async (file: FileMetadata) => {
    console.log('Opening file - ID:', file.id, 'Type:', file.file_type, 'Name:', file.original_filename);
    
    try {
      const fileUrl = getFileUrl(file);
      console.log('File URL:', fileUrl);
      
      setViewingFile(file);
      setShowFileViewer(true);
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert(
        'Error', 
        'Cannot open file. Make sure the backend server is running and accessible.'
      );
    }
  };

  const getFileUrl = (file: FileMetadata): string => {
    // Use the same network IP detection as api.ts
    const LOCAL_IP = '10.61.19.201'; // Your computer's local network IP
    const baseUrl = Platform.OS === 'android' 
      ? `http://${LOCAL_IP}:8000` 
      : 'http://localhost:8000';
    return `${baseUrl}/uploads/${file.stored_filename}`;
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      const fileUrl = getFileUrl(file);
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open this file type');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Files</Text>
        <Text style={styles.subtitle}>Upload and manage your study materials</Text>
      </View>

      {/* Upload Buttons */}
      <View style={styles.uploadSection}>
        <CustomButton
          title="Pick Document"
          onPress={pickDocument}
          icon="document"
          disabled={uploading}
          style={styles.uploadButton}
        />
        <CustomButton
          title="Pick Image"
          onPress={pickImage}
          icon="image"
          variant="secondary"
          disabled={uploading}
          style={styles.uploadButton}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterSection}>
        <CustomDropdown
          label="Filter by Category"
          placeholder="All Files"
          value={filterCategory}
          options={[{ label: 'All Files', value: '' }, ...categoryOptions]}
          onSelect={setFilterCategory}
          icon="filter"
        />
      </View>

      {/* Files List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading files...</Text>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="folder-open-outline" size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyText}>No files uploaded yet</Text>
          <Text style={styles.emptySubtext}>Upload your first document or image</Text>
        </View>
      ) : (
        <ScrollView style={styles.filesList} showsVerticalScrollIndicator={false}>
          {files.map((file) => (
            <TouchableOpacity 
              key={file.id} 
              style={styles.fileCard}
              onPress={() => handleFilePress(file)}
              activeOpacity={0.7}
            >
              <View style={[styles.fileIcon, { backgroundColor: `${Colors.primary}15` }]}>
                <Ionicons
                  name={getFileIcon(file.file_type) as any}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.title || file.original_filename}
                </Text>
                <View style={styles.fileMetaContainer}>
                  <Text style={styles.fileMeta}>{file.category}</Text>
                  <Text style={styles.fileMeta}>•</Text>
                  <Text style={styles.fileMeta}>{formatFileSize(file.file_size)}</Text>
                </View>
                <Text style={styles.fileDate}>
                  {new Date(file.created_at).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteFile(file.id, file.title || file.original_filename);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleUploadCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload File</Text>
              <TouchableOpacity onPress={handleUploadCancel}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedFile && (
                <View style={styles.filePreview}>
                  <Ionicons name="document" size={32} color={Colors.primary} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <CustomDropdown
                  label=""
                  placeholder="Select Category"
                  value={uploadCategory}
                  options={categoryOptions}
                  onSelect={setUploadCategory}
                  icon="folder"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                  placeholder="Enter file title"
                  placeholderTextColor={Colors.text.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={uploadDescription}
                  onChangeText={setUploadDescription}
                  placeholder="Enter description"
                  placeholderTextColor={Colors.text.secondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <CustomButton
                title="Cancel"
                onPress={handleUploadCancel}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Upload"
                onPress={handleUploadConfirm}
                disabled={!uploadTitle.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* File Viewer Modal */}
      <Modal
        visible={showFileViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFileViewer(false)}
      >
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerHeader}>
            <View style={styles.viewerHeaderContent}>
              <Ionicons 
                name={getFileIcon(viewingFile?.file_type || 'other') as any} 
                size={24} 
                color={Colors.textLight} 
              />
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {viewingFile?.title || viewingFile?.original_filename}
              </Text>
            </View>
            <View style={styles.viewerActions}>
              <TouchableOpacity
                style={styles.viewerActionButton}
                onPress={() => viewingFile && handleDownload(viewingFile)}
              >
                <Ionicons name="download-outline" size={24} color={Colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewerActionButton}
                onPress={() => setShowFileViewer(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.viewerContent}>
            {viewingFile?.file_type === 'image' ? (
              <ScrollView
                contentContainerStyle={styles.imageScrollContainer}
                maximumZoomScale={3}
                minimumZoomScale={1}
              >
                <Image
                  source={{ uri: getFileUrl(viewingFile) }}
                  style={styles.imageViewer}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('Image load error:', error.nativeEvent.error);
                    Alert.alert(
                      'Error',
                      'Cannot load image. Make sure the backend server is accessible from your device.'
                    );
                    setShowFileViewer(false);
                  }}
                />
              </ScrollView>
            ) : viewingFile?.file_type === 'pdf' ? (
              Platform.OS === 'android' ? (
                <WebView
                  source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(getFileUrl(viewingFile))}` }}
                  style={styles.webViewer}
                  startInLoadingState={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scalesPageToFit={true}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error:', nativeEvent.description);
                    // Fall back to download on error
                    Alert.alert(
                      'Cannot Preview PDF',
                      'Would you like to download the file instead?',
                      [
                        { text: 'Cancel', onPress: () => setShowFileViewer(false), style: 'cancel' },
                        { text: 'Download', onPress: () => { setShowFileViewer(false); handleDownload(viewingFile); } },
                      ]
                    );
                  }}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('HTTP error:', nativeEvent.statusCode);
                  }}
                  renderLoading={() => (
                    <View style={styles.webViewLoading}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.loadingText}>Loading PDF...</Text>
                    </View>
                  )}
                />
              ) : (
                <WebView
                  source={{ uri: getFileUrl(viewingFile) }}
                  style={styles.webViewer}
                  startInLoadingState={true}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error:', nativeEvent.description);
                    Alert.alert(
                      'Error',
                      'Cannot load PDF. Make sure the backend server is accessible from your device.'
                    );
                    setShowFileViewer(false);
                  }}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('HTTP error:', nativeEvent.statusCode);
                  }}
                  renderLoading={() => (
                    <View style={styles.webViewLoading}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.loadingText}>Loading PDF...</Text>
                    </View>
                  )}
                />
              )
            ) : (
              <View style={styles.unsupportedView}>
                <Ionicons name="document-outline" size={64} color={Colors.text.secondary} />
                <Text style={styles.unsupportedText}>
                  Preview not available for this file type
                </Text>
                <CustomButton
                  title="Download File"
                  onPress={() => viewingFile && handleDownload(viewingFile)}
                  icon="download"
                  style={styles.downloadButton}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  uploadSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  uploadButton: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filesList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  fileMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  fileMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  fileDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    flex: 1,
  },
  // File Viewer Styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  viewerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  viewerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  viewerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  viewerActionButton: {
    padding: Spacing.sm,
  },
  viewerContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 100,
  },
  webViewer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  unsupportedView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  unsupportedText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  downloadButton: {
    minWidth: 200,
  },
});
