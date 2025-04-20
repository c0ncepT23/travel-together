import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Keyboard,
  Dimensions
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

const windowHeight = Dimensions.get('window').height;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { destinationId, subDestinationId, title } = route.params || { 
    destinationId: 'unknown', 
    subDestinationId: undefined,
    title: 'Chat'
  };
  
  // Set the navigation header title
  useEffect(() => {
    navigation.setOptions({
      title: title || 'Group Chat',
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('ThingsToSee', {
              destinationId, subDestinationId,
              title: title || destination?.name
            })}
          >
            <Ionicons name="list-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleHeaderInfoPress}
          >
            <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, title, destinationId, subDestinationId]);
  
  // Generate group ID for retrieving messages
  const groupId = subDestinationId ? `${destinationId}_${subDestinationId}` : destinationId;
  
  const { messages, loading, error } = useSelector((state: RootState) => {
    return {
      messages: state.chat.messages[groupId] || [],
      loading: state.chat.loading,
      error: state.chat.error,
    };
  });

  // Fetch messages when component mounts
  useEffect(() => {
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
          text: "I'm arriving tomorrow. Any tips for getting from the airport to downtown?",
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
          user: {
            id: 'user3',
            name: 'Emma Wilson',
            avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
          },
          destinationId,
          subDestinationId,
        },
        {
          id: '4',
          text: "The Airport Rail Link is fast and affordable. It connects to the BTS Skytrain at Phaya Thai station. Taxis are also convenient but make sure they use the meter!",
          createdAt: new Date(Date.now() - 1500000), // 25 minutes ago
          user: {
            id: 'user2',
            name: 'Michael Chen',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          },
          destinationId,
          subDestinationId,
        },
        {
          id: '5',
          text: "Thanks for the tip! Are there any must-visit places that aren't too touristy?",
          createdAt: new Date(Date.now() - 900000), // 15 minutes ago
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

  // Keyboard handlers
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (messages.length > 0 && flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages]);

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
    setIsTyping(false);
  };

  const handleInputFocus = () => {
    setIsTyping(true);
  };

  const handleInputBlur = () => {
    setIsTyping(false);
  };

  const handleHeaderInfoPress = () => {
    // Show group info or member list
    alert(`Group Info: ${title}\nMembers: ${Math.floor(Math.random() * 30) + 10}`);
  };

  // Format date for display
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    // If same day, show time only
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'h:mm a');
    }
    
    // If within the last week, show day and time
    const daysAgo = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return format(messageDate, 'EEE h:mm a');
    }
    
    // Otherwise show date and time
    return format(messageDate, 'MMM d, h:mm a');
  };

  // Check if a message is the first from a user in a sequence
  const isFirstMessageFromUser = (message: MessageType, index: number) => {
    if (index === 0) return true;
    const previousMessage = messages[index - 1];
    return previousMessage.user.id !== message.user.id;
  };

  // Check if a message is from the same user as the previous one
  const isConsecutiveMessage = (message: MessageType, index: number) => {
    if (index === 0) return false;
    const previousMessage = messages[index - 1];
    return previousMessage.user.id === message.user.id;
  };

  // Calculate time difference between messages
  const hasTimeGap = (message: MessageType, index: number) => {
    if (index === 0) return false;
    const previousMessage = messages[index - 1];
    const currentTime = new Date(message.createdAt).getTime();
    const prevTime = new Date(previousMessage.createdAt).getTime();
    
    // Time gap greater than 5 minutes
    return (currentTime - prevTime) > 5 * 60 * 1000;
  };

  // Render a message bubble
  const renderMessage = ({ item, index }: { item: MessageType, index: number }) => {
    const isCurrentUser = item.user.id === 'currentUser';
    const showUserInfo = isFirstMessageFromUser(item, index) || hasTimeGap(item, index);
    const consecutive = isConsecutiveMessage(item, index) && !hasTimeGap(item, index);
    
    return (
      <>
        {hasTimeGap(item, index) && (
          <View style={styles.timeGapContainer}>
            <Text style={styles.timeGapText}>
              {formatMessageTime(new Date(item.createdAt))}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
          consecutive && !isCurrentUser ? styles.consecutiveMessagePadding : null
        ]}>
          {!isCurrentUser && showUserInfo && (
            <Image 
              source={{ uri: item.user.avatar }} 
              style={styles.avatar} 
            />
          )}
          
          {!isCurrentUser && consecutive && !showUserInfo && (
            <View style={styles.avatarPlaceholder} />
          )}
          
          <View style={[
            styles.messageContent,
            isCurrentUser ? styles.currentUserContent : styles.otherUserContent,
            consecutive && !showUserInfo && !isCurrentUser ? styles.consecutiveMessage : null
          ]}>
            {!isCurrentUser && showUserInfo && (
              <Text style={styles.userName}>{item.user.name}</Text>
            )}
            
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {item.text}
            </Text>
            
            {showUserInfo && isCurrentUser && (
              <Text style={styles.timeText}>
                {formatMessageTime(new Date(item.createdAt))}
              </Text>
            )}
          </View>
        </View>
      </>
    );
  };

  // Custom header component for the FlatList
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.listHeaderLine} />
      <Text style={styles.listHeaderText}>
        Beginning of conversation
      </Text>
      <View style={styles.listHeaderLine} />
    </View>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 1],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Text style={styles.headerText}>
            {messages.length} messages in #{title || 'chat'}
          </Text>
        </Animated.View>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          inverted
          ListHeaderComponent={renderListHeader}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle" size={24} color="#0066CC" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Send a message..."
              multiline
              maxHeight={100}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              messageText.trim() === '' ? styles.sendButtonDisabled : null
            ]}
            onPress={handleSendMessage}
            disabled={messageText.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={messageText.trim() === '' ? '#CCCCCC' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoid: {
    flex: 1,
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
  header: {
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerText: {
    fontSize: 13,
    color: '#65676B',
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  listHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4E6EB',
  },
  listHeaderText: {
    fontSize: 12,
    color: '#65676B',
    marginHorizontal: 8,
  },
  timeGapContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timeGapText: {
    fontSize: 12,
    color: '#65676B',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
    marginLeft: 50,
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
    marginRight: 50,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 5,
    marginRight: 8,
  },
  messageContent: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '80%',
  },
  consecutiveMessage: {
    borderTopLeftRadius: 4,
  },
  consecutiveMessagePadding: {
    paddingLeft: 40,
  },
  currentUserContent: {
    backgroundColor: '#0084FF',
    borderBottomRightRadius: 4,
  },
  otherUserContent: {
    backgroundColor: '#E4E6EB',
    borderBottomLeftRadius: 4,
  },
  userName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#65676B',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#050505',
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  attachButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 24,
    paddingTop: 6,
    paddingBottom: 6,
    color: '#050505',
  },
  emojiButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F2F5',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ChatScreen;