import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

// Import components and types
import { DestinationsStackParamList } from '../../navigation/DestinationsNavigator';
import { RootState } from '../../store/reducers';
import { Message as MessageType } from '../../store/reducers/chatReducer';
import EmptyStateView from '../../components/common/EmptyStateView';

type ChatRouteProp = RouteProp<DestinationsStackParamList, 'Chat'>;

// Simple custom chat implementation without deprecated libraries
const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState('');
  
  const { destinationId, subDestinationId } = route.params || { destinationId: 'unknown', subDestinationId: undefined };
  console.log('ChatScreen mounted with params:', route.params);
  
  // Generate group ID for retrieving messages
  const groupId = subDestinationId ? `${destinationId}_${subDestinationId}` : destinationId;
  console.log('Group ID generated:', groupId);
  
  const { messages, loading, error } = useSelector((state: RootState) => {
    return {
      messages: state.chat.messages[groupId] || [],
      loading: state.chat.loading,
      error: state.chat.error,
    };
  });

  // Fetch messages when component mounts
  useEffect(() => {
    console.log('Dispatching fetch messages');
    dispatch({
      type: 'FETCH_MESSAGES_REQUEST',
    });
    
    // Set the active chat
    dispatch({
      type: 'SET_ACTIVE_CHAT',
      payload: {
        destinationId,
        subDestinationId
      }
    });

    // Simulate API call
    setTimeout(() => {
      const mockMessages = [
        {
          id: '1',
          text: 'Hi everyone! I just arrived in Bangkok today. Anyone up for dinner near Sukhumvit?',
          createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
          user: {
            id: 'user1',
            name: 'Sarah Johnson',
            avatar: 'https://randomuser.me/api/portraits/women/42.jpg',
          },
          destinationId,
          subDestinationId,
        },
        {
          id: '2',
          text: 'Welcome to Bangkok! I can recommend Soi 11 for good restaurants.',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          user: {
            id: 'user2',
            name: 'Michael Chen',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          },
          destinationId,
          subDestinationId,
        },
        {
          id: '3',
          text: 'I\'m arriving tomorrow. Any tips for getting from the airport to downtown?',
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
          user: {
            id: 'user3',
            name: 'Emma Wilson',
            avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
          },
          destinationId,
          subDestinationId,
        },
      ];
      
      dispatch({
        type: 'FETCH_MESSAGES_SUCCESS',
        payload: {
          groupId,
          messages: mockMessages,
        },
      });
    }, 1000);
  }, [dispatch, destinationId, subDestinationId]);

  const handleSendMessage = () => {
    if (messageText.trim() === '') return;
    
    // Add message to the chat
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

  // Format date for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render a message bubble
  const renderMessage = ({ item }: { item: MessageType }) => {
    const isCurrentUser = item.user.id === 'currentUser';
    
    return (
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        {!isCurrentUser && (
          <Text style={styles.userName}>{item.user.name}</Text>
        )}
        <Text style={isCurrentUser ? styles.currentUserText : styles.otherUserText}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {formatTime(new Date(item.createdAt))}
        </Text>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
        <Text>DEBUG: Chat screen is trying to load</Text>
        <Text>Destination ID: {destinationId}</Text>
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
      <View style={styles.debug}>
        <Text>DEBUG: Chat screen rendered</Text>
        <Text>Messages: {messages.length}</Text>
        <Text>Group ID: {groupId}</Text>
      </View>
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        inverted
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={messageText.trim() === ''}
        >
          <Ionicons name="send" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  debug: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 5,
    zIndex: 1000,
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
  messagesContainer: {
    padding: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  currentUserBubble: {
    backgroundColor: '#0066CC',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666666',
  },
  currentUserText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  otherUserText: {
    color: '#333333',
    fontSize: 16,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ChatScreen;