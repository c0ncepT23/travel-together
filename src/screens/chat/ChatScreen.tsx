import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Import components and types
import { DestinationsStackParamList } from '../../navigation/DestinationsNavigator';
import { RootState } from '../../store/reducers';
import { Message as MessageType } from '../../store/reducers/chatReducer';
import EmptyStateView from '../../components/common/EmptyStateView';

type ChatRouteProp = RouteProp<DestinationsStackParamList, 'Chat'>;

const HASHTAG_REGEX = /#(\w+)/g;

const ChatScreen = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  
  // Search state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<MessageType[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  const { destinationId, subDestinationId, title } = route.params || { 
    destinationId: 'unknown', 
    subDestinationId: undefined,
    title: 'Chat'
  };
  
  // Generate group ID for retrieving messages
  const groupId = subDestinationId ? `${destinationId}_${subDestinationId}` : destinationId;
  
  const { messages, loading, error } = useSelector((state: RootState) => {
    return {
      messages: state.chat.messages[groupId] || [],
      loading: state.chat.loading,
      error: state.chat.error,
    };
  });

  // Initialize once with header options
  useEffect(() => {
    navigation.setOptions({
      title: title || 'Chat',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setSearchVisible(true)}
          >
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('ThingsToSee', {
              destinationId,
              subDestinationId,
              title: title || 'destination'
            })}
          >
            <Ionicons name="list-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              // Show group info
              navigation.navigate('DestinationDetail', { destinationId });
            }}
          >
            <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, title, destinationId, subDestinationId]);

  // Setup keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Load messages once
  useEffect(() => {
    dispatch({
      type: 'FETCH_MESSAGES_REQUEST',
    });
    
    dispatch({
      type: 'SET_ACTIVE_CHAT',
      payload: {
        destinationId,
        subDestinationId
      }
    });

    // Mock data
    setTimeout(() => {
      const mockMessages = [
        {
          id: '1',
          text: 'Hi everyone! I just arrived in Bangkok today. Anyone up for dinner near Sukhumvit? #dinner #sukhumvit',
          createdAt: new Date(Date.now() - 3600000 * 2),
          user: {
            id: 'user1',
            name: 'Sarah Johnson',
            avatar: 'https://randomuser.me/api/portraits/women/42.jpg',
          },
          destinationId,
          subDestinationId,
          hashtags: ['dinner', 'sukhumvit']
        },
        {
          id: '2',
          text: 'Welcome to Bangkok! I can recommend Soi 11 for good restaurants. #food #restaurants',
          createdAt: new Date(Date.now() - 3600000),
          user: {
            id: 'user2',
            name: 'Michael Chen',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          },
          destinationId,
          subDestinationId,
          hashtags: ['food', 'restaurants']
        },
        {
          id: '3',
          text: "I'm arriving tomorrow. Any tips for getting from the airport to downtown? #transport #airport",
          createdAt: new Date(Date.now() - 1800000),
          user: {
            id: 'user3',
            name: 'Emma Wilson',
            avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
          },
          destinationId,
          subDestinationId,
          hashtags: ['transport', 'airport']
        },
        {
          id: '4',
          text: "The Airport Rail Link is fast and affordable. It connects to the BTS Skytrain at Phaya Thai station. Taxis are also convenient but make sure they use the meter! #transport #tips",
          createdAt: new Date(Date.now() - 1500000),
          user: {
            id: 'user2',
            name: 'Michael Chen',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          },
          destinationId,
          subDestinationId,
          hashtags: ['transport', 'tips']
        },
      ];
      
      dispatch({
        type: 'FETCH_MESSAGES_SUCCESS',
        payload: {
          groupId,
          messages: mockMessages,
        },
      });
    }, 500);
  }, [dispatch, destinationId, subDestinationId, groupId]);

  // Extract hashtags from messages when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const tagSet = new Set<string>();
      
      messages.forEach(message => {
        const matches = message.text.match(HASHTAG_REGEX);
        if (matches) {
          matches.forEach(match => {
            tagSet.add(match.substring(1).toLowerCase());
          });
        }
      });
      
      setHashtags(Array.from(tagSet));
    }
  }, [messages]);

  // Update search results when search text changes
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    
    const searchTerm = searchText.toLowerCase();
    const isHashtagSearch = searchText.startsWith('#');
    
    const results = messages.filter(message => {
      if (isHashtagSearch) {
        // Search by hashtag
        const tag = searchText.substring(1).toLowerCase();
        const messageHashtags = message.hashtags || [];
        return messageHashtags.some(hashtag => hashtag.toLowerCase().includes(tag));
      } else {
        // Search by text content
        return message.text.toLowerCase().includes(searchTerm);
      }
    });
    
    setSearchResults(results);
  }, [searchText, messages]);

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    // If same day
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'h:mm a');
    }
    
    // If yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday, ' + format(messageDate, 'h:mm a');
    }
    
    // Otherwise show full date
    return format(messageDate, 'MMM d, h:mm a');
  };

  const insertHashtags = (text) => {
    if (!text) return null;
    
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.match(/#\w+/)) {
        return (
          <Text 
            key={index} 
            style={styles.hashtag}
            onPress={() => handleHashtagPress(part.substring(1))}
          >
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const handleHashtagPress = (hashtag: string) => {
    setSearchText(`#${hashtag}`);
    setSearchVisible(true);
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.user.id === 'currentUser';
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isCurrentUser && (
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        )}
        
        <View style={[
          styles.messageContent,
          isCurrentUser ? styles.ownMessage : styles.otherMessage
        ]}>
          {!isCurrentUser && (
            <Text style={styles.userName}>{item.user.name}</Text>
          )}
          
          <Text style={styles.messageText}>
            {insertHashtags(item.text)}
          </Text>
          
          <Text style={styles.messageTime}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>Beginning of conversation</Text>
    </View>
  );

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // Extract hashtags
    const msgHashtags = [];
    const matches = messageText.match(HASHTAG_REGEX);
    if (matches) {
      matches.forEach(match => {
        msgHashtags.push(match.substring(1));
      });
    }
    
    const newMessage = {
      id: Date.now().toString(),
      text: messageText,
      createdAt: new Date(),
      user: {
        id: 'currentUser',
        name: 'You',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      },
      destinationId,
      subDestinationId,
      hashtags: msgHashtags
    };
    
    dispatch({
      type: 'SEND_MESSAGE_SUCCESS',
      payload: {
        groupId,
        message: newMessage,
      },
    });
    
    setMessageText('');
  };

  // Render the search modal
  const renderSearchModal = () => (
    <Modal
      visible={searchVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSearchVisible(false)}
    >
      <SafeAreaView style={styles.searchModalContainer}>
        <View style={styles.searchHeader}>
          <TouchableOpacity 
            style={styles.searchBackButton} 
            onPress={() => setSearchVisible(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666666" />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search messages or #hashtags"
              autoFocus
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {searchText.length === 0 ? (
          // Show all hashtags when not searching
          <View style={styles.hashtagContainer}>
            <Text style={styles.hashtagTitle}>Popular Hashtags</Text>
            <View style={styles.hashtagList}>
              {hashtags.map(tag => (
                <TouchableOpacity 
                  key={tag} 
                  style={styles.hashtagButton}
                  onPress={() => setSearchText(`#${tag}`)}
                >
                  <Text style={styles.hashtagButtonText}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          // Show search results
          <FlatList
            data={searchResults}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptySearchContainer}>
                <Ionicons name="search-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptySearchText}>
                  No messages found for "{searchText}"
                </Text>
              </View>
            }
            contentContainerStyle={styles.searchResultsList}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <EmptyStateView
        icon="alert-circle"
        title="Oops!"
        message={`Something went wrong: ${error}`}
        actionLabel="Try Again"
        onAction={() => {}}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContent}
          inverted
        />
      </View>
      
      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={24} color="#777777" />
        </TouchableOpacity>
        
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Send a message... Use #hashtags for topics"
            placeholderTextColor="#999999"
            multiline
            maxHeight={80}
          />
        </View>
        
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons
            name={messageText.trim() ? "send" : "mic"}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
      
      {renderSearchModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777777',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
  },
  messagesContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  listHeader: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#ECE5DD',
  },
  listHeaderText: {
    fontSize: 12,
    color: '#777777',
    backgroundColor: 'rgba(225, 245, 254, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 8,
    padding: 8,
    marginBottom: 2,
  },
  ownMessage: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#075E54',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  hashtag: {
    color: '#128C7E',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 11,
    color: '#777777',
    alignSelf: 'flex-end',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#ECECEC',
    borderRadius: 20,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    fontSize: 16,
    color: '#333333',
    minHeight: 24,
    maxHeight: 120,
  },
  attachButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#128C7E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Search modal styles
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  searchBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333333',
  },
  searchResultsList: {
    padding: 16,
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#777777',
    marginTop: 16,
  },
  hashtagContainer: {
    padding: 16,
  },
  hashtagTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  hashtagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hashtagButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  hashtagButtonText: {
    color: '#128C7E',
    fontWeight: '500',
  },
});

export default ChatScreen;