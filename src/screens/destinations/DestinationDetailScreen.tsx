import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Import types and components
import { DestinationsStackParamList } from '../../navigation/DestinationsNavigator';
import { RootState } from '../../store/reducers';
import { Destination, SubDestination } from '../../store/reducers/destinationReducer';

type DestinationDetailRouteProp = RouteProp<
  DestinationsStackParamList,
  'DestinationDetail'
>;

type DestinationDetailNavigationProp = StackNavigationProp<
  DestinationsStackParamList,
  'DestinationDetail'
>;

// Mock action for fetching destination details
const fetchDestinationDetails = (destinationId: string) => {
  return (dispatch: any, getState: any) => {
    // In a real app, this would fetch from an API
    // For now, we'll just filter from our mock data
    const { destinations } = getState().destinations;
    const destination = destinations.find(
      (dest: Destination) => dest.id === destinationId
    );
    
    // Set this destination as the current one
    if (destination) {
      dispatch({
        type: 'SET_CURRENT_DESTINATION',
        payload: destination,
      });
    }
  };
};

// Mock action for joining a sub-destination
const joinSubDestination = (
  destinationId: string,
  subDestinationId: string
) => {
  return {
    type: 'JOIN_DESTINATION_GROUP',
    payload: {
      destinationId,
      subDestinationId,
    },
  };
};

// Mock action for leaving a sub-destination
const leaveSubDestination = (
  destinationId: string,
  subDestinationId: string
) => {
  return {
    type: 'LEAVE_DESTINATION_GROUP',
    payload: {
      destinationId,
      subDestinationId,
      leaveMainGroup: false,
    },
  };
};

const DestinationDetailScreen: React.FC = () => {
  const route = useRoute<DestinationDetailRouteProp>();
  const navigation = useNavigation<DestinationDetailNavigationProp>();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  
  const { destinationId } = route.params;
  
  // Find the destination from the Redux store
  const destination = useSelector((state: RootState) =>
    state.destinations.destinations.find(dest => dest.id === destinationId)
  );

  useEffect(() => {
    if (destinationId) {
      // In a real app, we'd fetch detailed data here
      dispatch(fetchDestinationDetails(destinationId) as any);
    }
    
    // Set the navigation header title
    if (destination) {
      navigation.setOptions({
        title: destination.name,
      });
    }
  }, [destinationId, dispatch, navigation, destination?.name]);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = format(new Date(startDate), 'MMMM d, yyyy');
    const end = format(new Date(endDate), 'MMMM d, yyyy');
    return `${start} - ${end}`;
  };

  const handleJoinSubDestination = (subDestination: SubDestination) => {
    setLoading(true);
    // Simulate network request
    setTimeout(() => {
      if (subDestination.isJoined) {
        dispatch(leaveSubDestination(destinationId, subDestination.id));
      } else {
        dispatch(joinSubDestination(destinationId, subDestination.id));
      }
      setLoading(false);
    }, 500);
  };

  const navigateToThingsToSee = (subDestination?: SubDestination) => {
    if (!destination) return;
    
    navigation.navigate('ThingsToSee', {
      destinationId,
      subDestinationId: subDestination?.id,
      title: subDestination ? subDestination.name : destination.name,
    });
  };

  const navigateToChat = (subDestination?: SubDestination) => {
    if (!destination) return;
    
    navigation.navigate('Chat', {
      destinationId,
      subDestinationId: subDestination?.id,
      title: subDestination ? subDestination.name : destination.name,
    });
  };

  if (!destination) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading destination details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{destination.name}</Text>
        <Text style={styles.dates}>
          {formatDateRange(destination.startDate, destination.endDate)}
        </Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={20} color="#0066CC" />
            <Text style={styles.statText}>{destination.memberCount} travelers</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="location" size={20} color="#0066CC" />
            <Text style={styles.statText}>
              {destination.subDestinations.length} locations
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigateToChat()}
        >
          <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Group Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigateToThingsToSee()}
        >
          <Ionicons name="list-outline" size={20} color="#0066CC" />
          <Text style={styles.secondaryButtonText}>Things to See</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sub-Destinations</Text>
        <Text style={styles.sectionSubtitle}>
          Specific locations within {destination.name}
        </Text>
      </View>

      {destination.subDestinations.map(subDest => (
        <View key={subDest.id} style={styles.subDestinationCard}>
          <View style={styles.subDestContent}>
            <Text style={styles.subDestName}>{subDest.name}</Text>
            <Text style={styles.subDestMemberCount}>
              {subDest.memberCount} travelers
            </Text>
            
            <View style={styles.subDestActions}>
              <TouchableOpacity
                style={styles.subDestActionButton}
                onPress={() => navigateToChat(subDest)}
              >
                <Ionicons name="chatbubbles-outline" size={18} color="#0066CC" />
                <Text style={styles.subDestActionText}>Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.subDestActionButton}
                onPress={() => navigateToThingsToSee(subDest)}
              >
                <Ionicons name="list-outline" size={18} color="#0066CC" />
                <Text style={styles.subDestActionText}>To See</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.joinButton,
              subDest.isJoined ? styles.leaveButton : styles.joinButtonActive
            ]}
            onPress={() => handleJoinSubDestination(subDest)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={subDest.isJoined ? 'exit-outline' : 'enter-outline'}
                  size={16}
                  color={subDest.isJoined ? '#666666' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.joinButtonText,
                    subDest.isJoined ? styles.leaveButtonText : styles.joinButtonTextActive
                  ]}
                >
                  {subDest.isJoined ? 'Leave' : 'Join'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ))}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You will automatically leave this group on{' '}
          {format(new Date(destination.endDate), 'MMMM d, yyyy')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  dates: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  secondaryButtonText: {
    color: '#0066CC',
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  subDestinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subDestContent: {
    flex: 1,
  },
  subDestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  subDestMemberCount: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  subDestActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  subDestActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  subDestActionText: {
    fontSize: 12,
    color: '#0066CC',
    marginLeft: 4,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  joinButtonActive: {
    backgroundColor: '#0066CC',
  },
  leaveButton: {
    backgroundColor: '#F5F5F5',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  joinButtonTextActive: {
    color: '#FFFFFF',
  },
  leaveButtonText: {
    color: '#666666',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default DestinationDetailScreen;