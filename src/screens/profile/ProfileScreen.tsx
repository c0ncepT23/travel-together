import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

// Import components and types
import { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { RootState } from '../../store/reducers';
import { useAuth } from '../../services/auth/AuthContext';

type ProfileScreenNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'Profile'
>;

// Mock action to fetch profile
const fetchProfile = () => {
  return (dispatch: any) => {
    dispatch({ type: 'FETCH_PROFILE_REQUEST' });
    
    // Simulate API call
    setTimeout(() => {
      const mockProfile = {
        id: 'user123',
        name: 'John Smith',
        email: 'john@example.com',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        bio: 'Travel enthusiast and food lover. Always looking for new adventures!',
        country: 'United States',
        languages: ['English', 'Spanish'],
        travelPreferences: ['Food', 'Culture', 'Nature'],
        tripCount: 12,
      };
      
      dispatch({
        type: 'FETCH_PROFILE_SUCCESS',
        payload: mockProfile,
      });
    }, 1000);
  };
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const dispatch = useDispatch();
  const { signOut } = useAuth();
  
  const { profile, loading, error } = useSelector(
    (state: RootState) => state.profile
  );
  
  const { destinations } = useSelector(
    (state: RootState) => state.destinations
  );
  
  useEffect(() => {
    dispatch(fetchProfile() as any);
  }, [dispatch]);
  
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };
  
  const handleSettings = () => {
    navigation.navigate('Settings');
  };
  
  const handlePastTrips = () => {
    navigation.navigate('PastTrips');
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const activeTrips = destinations.filter(dest => dest.isActive).length;
  const upcomingTrips = destinations.filter(dest => !dest.isActive).length;
  
  if (loading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  if (error && !profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>Error loading profile</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(fetchProfile() as any)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!profile) {
    return null;
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {profile.name
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color="#666666" />
              <Text style={styles.detailText}>{profile.country}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="globe" size={16} color="#666666" />
              <Text style={styles.detailText}>
                {profile.languages.join(', ')}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Ionicons name="pencil" size={18} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.bioSection}>
        <Text style={styles.bioText}>{profile.bio}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeTrips}</Text>
          <Text style={styles.statLabel}>Active Trips</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{upcomingTrips}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile.tripCount}</Text>
          <Text style={styles.statLabel}>Past Trips</Text>
        </View>
      </View>
      
      <View style={styles.preferencesSection}>
        <Text style={styles.sectionTitle}>Travel Preferences</Text>
        <View style={styles.tagsContainer}>
          {profile.travelPreferences.map((preference) => (
            <View key={preference} style={styles.tag}>
              <Text style={styles.tagText}>{preference}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handlePastTrips}
        >
          <Ionicons name="airplane" size={24} color="#0066CC" />
          <Text style={styles.menuItemText}>Past Trips</Text>
          <Ionicons name="chevron-forward" size={24} color="#999999" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSettings}
        >
          <Ionicons name="settings" size={24} color="#0066CC" />
          <Text style={styles.menuItemText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color="#999999" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out" size={24} color="#F44336" />
          <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={24} color="#999999" />
        </TouchableOpacity>
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
    color: '#666666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  bioSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bioText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  preferencesSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E0F0FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  signOutText: {
    color: '#F44336',
  },
});

export default ProfileScreen;