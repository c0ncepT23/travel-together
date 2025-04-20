import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { uploadDocument } from '../../store/actions/profileActions';
import { storageService } from '../../services/firebase/storageService';

// Import types
import { DocumentsStackParamList } from '../../navigation/DocumentsNavigator';

type UploadDocumentRouteProp = RouteProp<
  DocumentsStackParamList,
  'UploadDocument'
>;

type UploadDocumentNavigationProp = StackNavigationProp<
  DocumentsStackParamList,
  'UploadDocument'
>;

const [uploadProgress, setUploadProgress] = useState(0);

// Mock action for uploading a document
// const uploadDocument = (documentData: any) => {
//   return (dispatch: any) => {
//     dispatch({ type: 'UPLOAD_DOCUMENT_REQUEST' });
    
//     // Simulate API call with timeout
//     setTimeout(() => {
//       // In a real app, this would be a form submission to an API
//       const documentId = Date.now().toString();
      
//       dispatch({
//         type: 'UPLOAD_DOCUMENT_SUCCESS',
//         payload: {
//           id: documentId,
//           ...documentData,
//           uploadDate: new Date().toISOString().split('T')[0],
//           status: 'pending',
//           fileUrl: 'https://example.com/document.pdf', // This would be the URL from the API
//         },
//       });
      
//       return documentId;
//     }, 1500);
//   };
// };

const UploadDocumentScreen: React.FC = () => {
  const route = useRoute<UploadDocumentRouteProp>();
  const navigation = useNavigation<UploadDocumentNavigationProp>();
  const dispatch = useDispatch();
  
  // Get initial document type from route params if available
  const initialDocType = route.params?.documentType || 'flight';
  
  // Form state
  const [documentType, setDocumentType] = useState<'flight' | 'hotel' | 'other'>(
    initialDocType as 'flight' | 'hotel' | 'other'
  );
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 1 week later
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Document details state
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentResult | null>(null);
  
  // Loading state
  const [uploading, setUploading] = useState(false);
  
  // Update header title based on document type
  useEffect(() => {
    navigation.setOptions({
      title: `Upload ${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`
    });
  }, [documentType, navigation]);
  
  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setSelectedFile(result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Error picking document:', error);
    }
  };
  
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      
      // If end date is before start date, update it
      if (endDate < selectedDate) {
        setEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)); // One day later
      }
    }
  };
  
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };
  
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    
    if (!destination.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return false;
    }
    
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a document to upload');
      return false;
    }
    
    if (documentType === 'flight') {
      if (!flightNumber.trim() || !airline.trim()) {
        Alert.alert('Error', 'Please enter flight details');
        return false;
      }
    } else if (documentType === 'hotel') {
      if (!hotelName.trim()) {
        Alert.alert('Error', 'Please enter hotel name');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setUploading(true);
    
    try {
      let fileUrl = '';
      
      // If there is a selected file, upload it
      if (selectedFile && selectedFile.type === 'success') {
        // Set up a progress handler
        const handleProgress = (progress: number) => {
          setUploadProgress(progress);
        };
        
        // Upload the file to Firebase Storage
        fileUrl = await storageService.uploadDocumentFile(
          selectedFile.uri,
          documentType,
          handleProgress
        );
      }
      
      // Create the document data
      const documentData = {
        type: documentType,
        title,
        destination,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        fileUrl, // URL from Firebase Storage
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        details: documentType === 'flight'
          ? { flightNumber, airline }
          : documentType === 'hotel'
            ? { hotelName, bookingReference }
            : undefined,
      };
      
      // Add document to Firestore via Redux action
      const documentId = await dispatch(uploadDocument(documentData) as any);
      
      setUploading(false);
      Alert.alert(
        'Success',
        'Document uploaded successfully. It will be reviewed shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };
  
  const renderDocumentTypeSelector = () => (
    <View style={styles.documentTypeContainer}>
      <TouchableOpacity
        style={[
          styles.documentTypeButton,
          documentType === 'flight' && styles.selectedDocumentType,
        ]}
        onPress={() => setDocumentType('flight')}
      >
        <Ionicons
          name="airplane"
          size={24}
          color={documentType === 'flight' ? '#FFFFFF' : '#0066CC'}
        />
        <Text
          style={[
            styles.documentTypeText,
            documentType === 'flight' && styles.selectedDocumentTypeText,
          ]}
        >
          Flight
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.documentTypeButton,
          documentType === 'hotel' && styles.selectedDocumentType,
        ]}
        onPress={() => setDocumentType('hotel')}
      >
        <Ionicons
          name="bed"
          size={24}
          color={documentType === 'hotel' ? '#FFFFFF' : '#0066CC'}
        />
        <Text
          style={[
            styles.documentTypeText,
            documentType === 'hotel' && styles.selectedDocumentTypeText,
          ]}
        >
          Hotel
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.documentTypeButton,
          documentType === 'other' && styles.selectedDocumentType,
        ]}
        onPress={() => setDocumentType('other')}
      >
        <Ionicons
          name="document-text"
          size={24}
          color={documentType === 'other' ? '#FFFFFF' : '#0066CC'}
        />
        <Text
          style={[
            styles.documentTypeText,
            documentType === 'other' && styles.selectedDocumentTypeText,
          ]}
        >
          Other
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderFlightDetails = () => (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>Flight Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Airline</Text>
        <TextInput
          style={styles.input}
          value={airline}
          onChangeText={setAirline}
          placeholder="e.g. Thai Airways"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Flight Number</Text>
        <TextInput
          style={styles.input}
          value={flightNumber}
          onChangeText={setFlightNumber}
          placeholder="e.g. TG315"
        />
      </View>
    </View>
  );
  
  const renderHotelDetails = () => (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>Hotel Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Hotel Name</Text>
        <TextInput
          style={styles.input}
          value={hotelName}
          onChangeText={setHotelName}
          placeholder="e.g. Bangkok Marriott"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Booking Reference (optional)</Text>
        <TextInput
          style={styles.input}
          value={bookingReference}
          onChangeText={setBookingReference}
          placeholder="e.g. BKK12345"
        />
      </View>
    </View>
  );
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Upload {documentType.charAt(0).toUpperCase() + documentType.slice(1)} Document
          </Text>
          <Text style={styles.subtitle}>
            Upload your travel documents to automatically join destination groups
          </Text>
        </View>
        
        {renderDocumentTypeSelector()}
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Document Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={
                documentType === 'flight'
                  ? 'e.g. Bangkok Flight'
                  : documentType === 'hotel'
                  ? 'e.g. Bangkok Hotel'
                  : 'e.g. Japan Rail Pass'
              }
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Destination</Text>
            <TextInput
              style={styles.input}
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Thailand"
            />
          </View>
          
          <View style={styles.dateContainer}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {format(startDate, 'MMM d, yyyy')}
                </Text>
                <Ionicons name="calendar" size={18} color="#0066CC" />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                />
              )}
            </View>
            
            <View style={styles.dateInputGroup}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {format(endDate, 'MMM d, yyyy')}
                </Text>
                <Ionicons name="calendar" size={18} color="#0066CC" />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                />
              )}
            </View>
          </View>
          
          {documentType === 'flight' && renderFlightDetails()}
          {documentType === 'hotel' && renderHotelDetails()}
          
          <View style={styles.fileSection}>
            <Text style={styles.inputLabel}>Upload Document</Text>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={handleDocumentPick}
            >
              <Ionicons name="cloud-upload" size={24} color="#0066CC" />
              <Text style={styles.fileButtonText}>
                {selectedFile ? 'Change Document' : 'Select Document'}
              </Text>
            </TouchableOpacity>
            
            {selectedFile && selectedFile.type === 'success' && (
              <View style={styles.selectedFileContainer}>
                <Ionicons
                  name="document"
                  size={20}
                  color="#0066CC"
                  style={styles.fileIcon}
                />
                <Text style={styles.selectedFileText} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
              </View>
            )}
            {selectedFile && uploading && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${uploadProgress * 100}%` }]} />
                <Text style={styles.progressText}>{Math.round(uploadProgress * 100)}%</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={uploading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  documentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentTypeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
  },
  selectedDocumentType: {
    backgroundColor: '#0066CC',
  },
  documentTypeText: {
    marginTop: 4,
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  selectedDocumentTypeText: {
    color: '#FFFFFF',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 100, // Extra space for the bottom buttons
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateInputGroup: {
    flex: 1,
    marginRight: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  detailsContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  fileSection: {
    marginBottom: 16,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F0FF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
  },
  fileButtonText: {
    fontSize: 16,
    color: '#0066CC',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    padding: 8,
  },
  fileIcon: {
    marginRight: 8,
  },
  selectedFileText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  cancelButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0066CC',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressContainer: {
    height: 20,
    width: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#333333',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

export default UploadDocumentScreen;