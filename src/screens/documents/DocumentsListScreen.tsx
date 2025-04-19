import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Import types and components
import { DocumentsStackParamList } from '../../navigation/DocumentsNavigator';
import { RootState } from '../../store/reducers';
import { TravelDocument } from '../../store/reducers/profileReducer';
import EmptyStateView from '../../components/common/EmptyStateView';

type DocumentsScreenNavigationProp = StackNavigationProp<
  DocumentsStackParamList,
  'DocumentsList'
>;

// Mock action to fetch travel documents
const fetchTravelDocuments = () => {
  return (dispatch: any) => {
    // This would be an API call in a real app
    dispatch({ type: 'FETCH_PROFILE_REQUEST' });
    
    // Simulate API call with timeout
    setTimeout(() => {
      const mockDocuments: TravelDocument[] = [
        {
          id: '1',
          type: 'flight',
          title: 'Bangkok Flight',
          destination: 'Thailand',
          startDate: '2025-06-02',
          endDate: '2025-06-10',
          fileUrl: 'https://example.com/flight-ticket.pdf',
          uploadDate: '2025-01-15',
          status: 'verified',
          details: {
            flightNumber: 'TG315',
            airline: 'Thai Airways',
          },
        },
        {
          id: '2',
          type: 'hotel',
          title: 'Marriott Bangkok',
          destination: 'Thailand',
          startDate: '2025-06-02',
          endDate: '2025-06-10',
          fileUrl: 'https://example.com/hotel-booking.pdf',
          uploadDate: '2025-01-15',
          status: 'verified',
          details: {
            hotelName: 'Bangkok Marriott',
            bookingReference: 'BKK12345',
          },
        },
        {
          id: '3',
          type: 'flight',
          title: 'Tokyo Flight',
          destination: 'Japan',
          startDate: '2025-07-15',
          endDate: '2025-07-25',
          fileUrl: 'https://example.com/flight-ticket-japan.pdf',
          uploadDate: '2025-02-20',
          status: 'pending',
          details: {
            flightNumber: 'NH872',
            airline: 'ANA',
          },
        },
        {
          id: '4',
          type: 'hotel',
          title: 'Kyoto Ryokan',
          destination: 'Japan',
          startDate: '2025-07-18',
          endDate: '2025-07-21',
          fileUrl: 'https://example.com/ryokan-booking.pdf',
          uploadDate: '2025-02-20',
          status: 'verified',
          details: {
            hotelName: 'Traditional Kyoto Ryokan',
            bookingReference: 'KYO54321',
          },
        },
        {
          id: '5',
          type: 'other',
          title: 'Japan Rail Pass',
          destination: 'Japan',
          startDate: '2025-07-15',
          endDate: '2025-07-25',
          fileUrl: 'https://example.com/jrpass.pdf',
          uploadDate: '2025-02-25',
          status: 'pending',
        },
      ];
      
      dispatch({ 
        type: 'FETCH_PROFILE_SUCCESS', 
        payload: {
          id: 'user123',
          name: 'John Smith',
          email: 'john@example.com',
          languages: ['English', 'Spanish'],
          travelPreferences: ['Food', 'Culture', 'Nature'],
          tripCount: 12,
        }
      });
      
      // In a real app, these might come in a separate API call
      // or be part of the profile response
      mockDocuments.forEach(doc => {
        dispatch({
          type: 'UPLOAD_DOCUMENT_SUCCESS',
          payload: doc,
        });
      });
      
    }, 1000);
  };
};

const DocumentsListScreen: React.FC = () => {
  const navigation = useNavigation<DocumentsScreenNavigationProp>();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const { travelDocuments, loading, error } = useSelector(
    (state: RootState) => state.profile
  );

  useEffect(() => {
    dispatch(fetchTravelDocuments() as any);
  }, [dispatch]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchTravelDocuments() as any);
    setRefreshing(false);
  };

  const handleDocumentPress = (document: TravelDocument) => {
    navigation.navigate('DocumentDetail', { documentId: document.id });
  };

  const handleUploadPress = () => {
    navigation.navigate('UploadDocument');
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return 'airplane';
      case 'hotel':
        return 'bed';
      default:
        return 'document-text';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'rejected':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  const renderDocumentItem = ({ item }: { item: TravelDocument }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => handleDocumentPress(item)}
    >
      <View style={styles.documentIconContainer}>
        <Ionicons
          name={getDocumentIcon(item.type)}
          size={24}
          color="#0066CC"
        />
      </View>
      <View style={styles.documentContent}>
        <Text style={styles.documentTitle}>{item.title}</Text>
        <Text style={styles.destinationText}>{item.destination}</Text>
        <Text style={styles.dateRangeText}>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </Text>
      </View>
      <View style={styles.documentStatus}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && travelDocuments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading your documents...</Text>
      </View>
    );
  }

  if (error && travelDocuments.length === 0) {
    return (
      <EmptyStateView
        icon="alert-circle"
        title="Oops!"
        message={`Something went wrong: ${error}`}
        actionLabel="Try Again"
        onAction={() => dispatch(fetchTravelDocuments() as any)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Travel Documents</Text>
        <Text style={styles.sectionSubtitle}>
          Upload travel documents to join destination groups automatically
        </Text>
      </View>

      {travelDocuments.length === 0 ? (
        <EmptyStateView
          icon="document-text"
          title="No Travel Documents"
          message="Upload your flight tickets or hotel bookings to join destination groups automatically."
          actionLabel="Upload Document"
          onAction={handleUploadPress}
        />
      ) : (
        <FlatList
          data={travelDocuments}
          keyExtractor={(item) => item.id}
          renderItem={renderDocumentItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleUploadPress}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  dateRangeText: {
    fontSize: 12,
    color: '#666666',
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    right: 24,
    bottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default DocumentsListScreen;