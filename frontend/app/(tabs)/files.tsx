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
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CustomDropdown, DropdownOption } from '../../components/common/CustomDropdown';
import { Colors } from '../../constants/styles/theme';
import { SERVER_BASE_URL } from '../../constants/api';
import { fileApiService, FileMetadata } from '../../services/fileApi';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

const categoryOptions: DropdownOption[] = [
  { label: 'Notes', value: 'notes' },
  { label: 'Syllabus', value: 'syllabus' },
  { label: 'Assignment', value: 'assignment' },
  { label: 'Resource', value: 'resource' },
  { label: 'Other', value: 'other' },
];

export default function FilesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [uploadCategory, setUploadCategory] = useState<string>('notes');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploadSubject, setUploadSubject] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [viewingFile, setViewingFile] = useState<FileMetadata | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showPickerMenu, setShowPickerMenu] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileApiService.listFiles();
      if (response.success) {
        setFiles(response.data);
      }
    } catch (error: any) {
      console.error('Load files error:', error);
      Alert.alert('Error', error.message || 'Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredFiles = filterCategory === 'all'
    ? files
    : files.filter(f => f.category === filterCategory);

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
        uploadDescription.trim(),
        uploadSubject.trim() || undefined
      );
      
      console.log('Upload response:', response);
      
      if (response.success) {
        Alert.alert('Success', 'File uploaded successfully');
        setSelectedFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setUploadCategory('notes');
        setUploadSubject('');
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
    return `${SERVER_BASE_URL}/uploads/${file.stored_filename}`;
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

  const pdfCount = files.filter(f => f.file_type === 'pdf').length;
  const aiReadyCount = files.filter(f => f.has_extracted_text).length;

  const filterChips = [
    { label: 'All', value: 'all' },
    { label: 'Notes', value: 'notes' },
    { label: 'Syllabus', value: 'syllabus' },
    { label: 'Assignment', value: 'assignment' },
    { label: 'Resource', value: 'resource' },
    { label: 'Other', value: 'other' },
  ];

  const getFileIconColor = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '#EF4444';
      case 'image': return '#8B5CF6';
      case 'document': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'notes': return '#3B82F6';
      case 'syllabus': return '#8B5CF6';
      case 'assignment': return '#F59E0B';
      case 'resource': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Study Materials</Text>
            <Text style={styles.headerSubtitle}>Upload & manage your files</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => loadFiles()}
          >
            <Ionicons name="refresh-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="folder-outline" size={14} color="#fff" />
            <Text style={styles.statText}>{files.length} Files</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="document-text-outline" size={14} color="#fff" />
            <Text style={styles.statText}>{pdfCount} PDFs</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: 'rgba(16,185,129,0.3)' }]}>
            <Ionicons name="sparkles" size={14} color="#34D399" />
            <Text style={[styles.statText, { color: '#34D399' }]}>{aiReadyCount} AI Ready</Text>
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.chipContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {filterChips.map((chip) => (
            <TouchableOpacity
              key={chip.value}
              style={[
                styles.chip,
                filterCategory === chip.value && styles.chipActive,
              ]}
              onPress={() => setFilterCategory(chip.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                filterCategory === chip.value && styles.chipTextActive,
              ]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* File List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading files...</Text>
        </View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="folder-open-outline" size={56} color="#6366F1" />
          </View>
          <Text style={styles.emptyText}>
            {files.length === 0 ? 'No study materials yet' : 'No files in this category'}
          </Text>
          <Text style={styles.emptySubtext}>
            {files.length === 0
              ? 'Upload PDFs, docs, or images to get started.\nAI will use your files for smarter study help!'
              : 'Try a different filter or upload more files.'}
          </Text>
          {files.length === 0 && (
            <TouchableOpacity style={styles.emptyUploadBtn} onPress={() => setShowPickerMenu(true)}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.emptyUploadText}>Upload Files</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.filesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFiles(); }} colors={['#6366F1']} />
          }
        >
          {filteredFiles.map((file) => (
            <TouchableOpacity
              key={file.id}
              style={styles.fileCard}
              onPress={() => handleFilePress(file)}
              activeOpacity={0.7}
            >
              <View style={[styles.fileIconBox, { backgroundColor: `${getFileIconColor(file.file_type)}15` }]}>
                <Ionicons
                  name={getFileIcon(file.file_type) as any}
                  size={26}
                  color={getFileIconColor(file.file_type)}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.title || file.original_filename}
                </Text>
                <View style={styles.fileTagRow}>
                  <View style={[styles.categoryTag, { backgroundColor: `${getCategoryColor(file.category)}15` }]}>
                    <Text style={[styles.categoryTagText, { color: getCategoryColor(file.category) }]}>
                      {file.category}
                    </Text>
                  </View>
                  {file.subject && (
                    <View style={styles.subjectTag}>
                      <Ionicons name="book-outline" size={10} color="#6366F1" />
                      <Text style={styles.subjectTagText} numberOfLines={1}>{file.subject}</Text>
                    </View>
                  )}
                  {file.has_extracted_text && (
                    <View style={styles.aiBadge}>
                      <Ionicons name="sparkles" size={10} color="#10B981" />
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
                <View style={styles.fileMetaRow}>
                  <Text style={styles.fileMeta}>{formatFileSize(file.file_size)}</Text>
                  <Text style={styles.fileMetaDot}>·</Text>
                  <Text style={styles.fileMeta}>{new Date(file.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteFile(file.id, file.title || file.original_filename);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {/* FAB Upload */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowPickerMenu(true)}
        activeOpacity={0.85}
        disabled={uploading}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Picker Menu Modal */}
      <Modal
        visible={showPickerMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPickerMenu(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowPickerMenu(false)}
        >
          <View style={styles.pickerMenu}>
            <Text style={styles.pickerTitle}>Upload File</Text>
            <TouchableOpacity style={styles.pickerOption} onPress={() => { setShowPickerMenu(false); pickDocument(); }}>
              <View style={[styles.pickerIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.pickerOptionLabel}>Document</Text>
                <Text style={styles.pickerOptionDesc}>PDF, Word, Text files</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerOption} onPress={() => { setShowPickerMenu(false); pickImage(); }}>
              <View style={[styles.pickerIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Ionicons name="image-outline" size={24} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.pickerOptionLabel}>Image</Text>
                <Text style={styles.pickerOptionDesc}>Photos & screenshots</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
              <Text style={styles.modalTitle}>Upload Details</Text>
              <TouchableOpacity onPress={handleUploadCancel} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedFile && (
                <View style={styles.filePreview}>
                  <View style={styles.filePreviewIcon}>
                    <Ionicons name="document" size={28} color="#6366F1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.filePreviewName} numberOfLines={1}>{selectedFile.name}</Text>
                    <Text style={styles.filePreviewHint}>Ready to upload</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                </View>
              )}

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
                <Text style={styles.label}>
                  <Ionicons name="sparkles" size={14} color="#6366F1" /> Subject (for AI context)
                </Text>
                <TextInput
                  style={styles.input}
                  value={uploadSubject}
                  onChangeText={setUploadSubject}
                  placeholder="e.g. Mathematics, Physics..."
                  placeholderTextColor={Colors.text.secondary}
                />
                <Text style={styles.inputHint}>
                  AI will use files matching this subject for study plans, quizzes & chat
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={uploadDescription}
                  onChangeText={setUploadDescription}
                  placeholder="Add a description..."
                  placeholderTextColor={Colors.text.secondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleUploadCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, !uploadTitle.trim() && { opacity: 0.5 }]}
                onPress={handleUploadConfirm}
                disabled={!uploadTitle.trim()}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.uploadBtnText}>Upload</Text>
              </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setShowFileViewer(false)} style={{ marginRight: 8 }}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Ionicons
                name={getFileIcon(viewingFile?.file_type || 'other') as any}
                size={22}
                color="#fff"
              />
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {viewingFile?.title || viewingFile?.original_filename}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewerActionButton}
              onPress={() => viewingFile && handleDownload(viewingFile)}
            >
              <Ionicons name="download-outline" size={22} color="#fff" />
            </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => viewingFile && handleDownload(viewingFile)}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Download File</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.uploadingText}>Uploading file...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Header
  header: {
    backgroundColor: '#6366F1',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 54,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Filter Chips
  chipContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#fff',
  },
  // File List
  filesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fileIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  fileTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    gap: 3,
  },
  subjectTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6366F1',
    maxWidth: 80,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    gap: 3,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  fileMetaDot: {
    fontSize: 11,
    color: '#CBD5E1',
    marginHorizontal: 5,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
  // Empty State
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  emptyUploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  // Picker Menu
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  pickerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  pickerOptionDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 1,
  },
  // Upload Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filePreviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filePreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  filePreviewHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 5,
    paddingLeft: 2,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // File Viewer
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  viewerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  viewerActionButton: {
    padding: 8,
  },
  viewerContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  unsupportedView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  // Uploading Overlay
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  uploadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginTop: 14,
  },
});
