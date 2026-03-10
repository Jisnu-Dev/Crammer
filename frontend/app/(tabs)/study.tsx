import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: 'Explain a concept', icon: 'bulb-outline' as const, prompt: 'Can you explain ' },
  { label: 'Quiz me', icon: 'help-circle-outline' as const, prompt: 'Quiz me on ' },
  { label: 'Summarize', icon: 'document-text-outline' as const, prompt: 'Summarize the topic of ' },
  { label: 'Study plan', icon: 'calendar-outline' as const, prompt: 'Create a study plan for ' },
];

const BOT_WELCOME_MESSAGE: Message = {
  id: 'welcome',
  text: "Hi there! 👋 I'm your Crammer+ study assistant. I can help you understand concepts, quiz you on topics, summarize materials, and create study plans. What would you like to study today?",
  sender: 'bot',
  timestamp: new Date(),
};

export default function StudyScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([BOT_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isTyping) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const simulateBotResponse = (userMessage: string) => {
    setIsTyping(true);
    scrollToBottom();

    // Simulated delay for bot "thinking"
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
      const botResponses: Record<string, string> = {
        default:
          "That's a great question! I'm currently in demo mode, but once connected I'll be able to help you study any topic in depth. Try asking me to explain a concept, quiz you, or create a study plan!",
      };

      const lowerMsg = userMessage.toLowerCase();
      let response = botResponses.default;

      if (lowerMsg.includes('quiz')) {
        response =
          "📝 Sure! Let's do a quick quiz.\n\n**Question:** What is the time complexity of binary search?\n\nA) O(n)\nB) O(log n)\nC) O(n²)\nD) O(1)\n\nType the letter of your answer!";
      } else if (lowerMsg.includes('explain')) {
        response =
          "📖 Great! I'd love to explain that.\n\nCould you tell me the specific concept or topic you'd like me to break down? For example:\n• A programming concept\n• A math theorem\n• A scientific principle\n• A historical event";
      } else if (lowerMsg.includes('summarize') || lowerMsg.includes('summary')) {
        response =
          "📋 I can help summarize! Please share the topic or paste the text you'd like me to condense into key points.";
      } else if (lowerMsg.includes('study plan') || lowerMsg.includes('schedule')) {
        response =
          "📅 Let's build a study plan!\n\nTo create an effective plan, I'll need:\n1. **Subject/Topic** — What are you studying?\n2. **Timeframe** — When is your exam/deadline?\n3. **Daily hours** — How many hours can you study per day?\n\nShare these details and I'll put together a personalized plan!";
      } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        response = `Hey ${user?.full_name?.split(' ')[0] || 'there'}! 😊 Ready to study? Pick a topic or use one of the quick prompts to get started!`;
      } else if (lowerMsg === 'b' || lowerMsg === 'b)') {
        response =
          "✅ **Correct!** Binary search has a time complexity of **O(log n)** because it halves the search space with each comparison.\n\nWant another question? Just say 'quiz me'!";
      } else if (['a', 'c', 'd', 'a)', 'c)', 'd)'].includes(lowerMsg)) {
        response =
          "❌ Not quite. The correct answer is **B) O(log n)**. Binary search works by repeatedly dividing the sorted array in half.\n\nWant to try another question?";
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      scrollToBottom();
    }, delay);
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();
    simulateBotResponse(trimmed);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';
    const isFirst = index === 0 || messages[index - 1].sender !== item.sender;

    return (
      <View style={[styles.messageRow, isUser ? styles.userMessageRow : styles.botMessageRow]}>
        {!isUser && isFirst && (
          <View style={styles.botAvatar}>
            <Ionicons name="school" size={18} color={Colors.textLight} />
          </View>
        )}
        {!isUser && !isFirst && <View style={styles.avatarSpacer} />}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
            !isFirst && !isUser && styles.botBubbleContinued,
            !isFirst && isUser && styles.userBubbleContinued,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    const opacity = typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

    return (
      <View style={[styles.messageRow, styles.botMessageRow]}>
        <View style={styles.botAvatar}>
          <Ionicons name="school" size={18} color={Colors.textLight} />
        </View>
        <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
          <Animated.View style={[styles.typingDots, { opacity }]}>
            <View style={styles.dot} />
            <View style={[styles.dot, { marginHorizontal: 4 }]} />
            <View style={styles.dot} />
          </Animated.View>
        </View>
      </View>
    );
  };

  const showQuickPrompts = messages.length <= 1 && !inputText;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarContainer}>
            <View style={styles.headerAvatar}>
              <Ionicons name="school" size={20} color={Colors.textLight} />
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Study Assistant</Text>
            <Text style={styles.headerSubtitle}>Always ready to help</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={() => {
          setMessages([BOT_WELCOME_MESSAGE]);
          setInputText('');
        }}>
          <Ionicons name="refresh" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Quick Prompts */}
        {showQuickPrompts && (
          <View style={styles.quickPromptsContainer}>
            <Text style={styles.quickPromptsTitle}>Quick Actions</Text>
            <View style={styles.quickPromptsGrid}>
              {QUICK_PROMPTS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickPromptCard}
                  onPress={() => handleQuickPrompt(item.prompt)}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickPromptIcon}>
                    <Ionicons name={item.icon} size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.quickPromptLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor={Colors.text.placeholder}
              multiline
              maxLength={1000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? Colors.textLight : Colors.text.placeholder}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  headerTextContainer: {
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  // Messages
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    maxWidth: '85%',
  },
  userMessageRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMessageRow: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  avatarSpacer: {
    width: 32,
    marginRight: Spacing.sm,
  },
  messageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.sm,
  },
  userBubbleContinued: {
    borderTopRightRadius: BorderRadius.sm,
  },
  botBubble: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.sm,
    ...Shadows.small,
  },
  botBubbleContinued: {
    borderTopLeftRadius: BorderRadius.sm,
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  userMessageText: {
    color: Colors.textLight,
  },
  botMessageText: {
    color: Colors.text.primary,
  },
  timestamp: {
    fontSize: Typography.fontSize.xs - 2,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: Colors.text.placeholder,
  },

  // Typing indicator
  typingBubble: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.placeholder,
  },

  // Quick prompts
  quickPromptsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  quickPromptsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  quickPromptIcon: {
    marginRight: Spacing.xs + 2,
  },
  quickPromptLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Input
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.xl + 4,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Platform.OS === 'ios' ? Spacing.xs : 0,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm + 2,
    paddingBottom: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm + 2,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    marginBottom: Platform.OS === 'ios' ? 1 : Spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
});
