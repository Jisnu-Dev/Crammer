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
import { getAccessToken } from '../../utils/auth';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

const { width } = Dimensions.get('window');

// API Base URL (same logic as api.ts)
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      const LOCAL_IP = '10.123.11.99';
      return `http://${LOCAL_IP}:8000/api/v1`;
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:8000/api/v1';
    } else {
      return 'http://localhost:8000/api/v1';
    }
  }
  return 'https://your-production-api.com/api/v1';
};

const API_BASE_URL = getBaseUrl();

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

/**
 * Lightweight markdown renderer for chat messages.
 * Supports: **bold**, *italic*, `inline code`, code blocks, bullet/numbered lists, headings.
 */
const MarkdownText = ({ text, isUser }: { text: string; isUser: boolean }) => {
  const baseColor = isUser ? Colors.textLight : Colors.text.primary;
  const dimColor = isUser ? 'rgba(255,255,255,0.7)' : Colors.text.secondary;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let key = 0;

  const renderInlineMarkdown = (line: string, color: string) => {
    // Split by markdown tokens: **bold**, *italic*, `code`
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Text before the match
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`t${key++}`} style={{ color }}>{line.slice(lastIndex, match.index)}</Text>
        );
      }
      if (match[2]) {
        // **bold**
        parts.push(
          <Text key={`b${key++}`} style={{ color, fontWeight: '700' }}>{match[2]}</Text>
        );
      } else if (match[3]) {
        // *italic*
        parts.push(
          <Text key={`i${key++}`} style={{ color, fontStyle: 'italic' }}>{match[3]}</Text>
        );
      } else if (match[4]) {
        // `inline code`
        parts.push(
          <Text
            key={`c${key++}`}
            style={{
              color: isUser ? '#E0F0FF' : Colors.primary,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              fontSize: Typography.fontSize.sm,
              backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : 'rgba(37,99,235,0.08)',
              borderRadius: 3,
              paddingHorizontal: 2,
            }}
          >
            {match[4]}
          </Text>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    // Remaining text
    if (lastIndex < line.length) {
      parts.push(
        <Text key={`r${key++}`} style={{ color }}>{line.slice(lastIndex)}</Text>
      );
    }
    if (parts.length === 0) {
      parts.push(<Text key={`e${key++}`} style={{ color }}>{line}</Text>);
    }
    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <View
            key={`cb${key++}`}
            style={{
              backgroundColor: isUser ? 'rgba(255,255,255,0.12)' : '#F3F4F6',
              borderRadius: BorderRadius.md,
              padding: Spacing.sm,
              marginVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                fontSize: Typography.fontSize.sm,
                color: isUser ? '#E0F0FF' : Colors.text.primary,
                lineHeight: Typography.fontSize.sm * 1.6,
              }}
            >
              {codeBlockLines.join('\n')}
            </Text>
          </View>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Empty line = spacing
    if (line.trim() === '') {
      elements.push(<View key={`sp${key++}`} style={{ height: 8 }} />);
      continue;
    }

    // Headings (### , ## , # )
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes = [Typography.fontSize.xl, Typography.fontSize.lg, Typography.fontSize.md + 1];
      elements.push(
        <Text
          key={`h${key++}`}
          style={{
            fontSize: sizes[level - 1],
            fontWeight: '700',
            color: baseColor,
            marginTop: 6,
            marginBottom: 2,
          }}
        >
          {renderInlineMarkdown(headingMatch[2], baseColor)}
        </Text>
      );
      continue;
    }

    // Bullet points (- or • or *)
    const bulletMatch = line.match(/^(\s*)([-•*])\s+(.+)/);
    if (bulletMatch) {
      const indent = Math.floor(bulletMatch[1].length / 2);
      elements.push(
        <View key={`bl${key++}`} style={{ flexDirection: 'row', marginLeft: indent * 12, marginVertical: 2 }}>
          <Text style={{ color: isUser ? 'rgba(255,255,255,0.6)' : Colors.primary, marginRight: 6, fontSize: Typography.fontSize.sm }}>•</Text>
          <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: Typography.fontSize.md * Typography.lineHeight.normal, color: baseColor }}>
            {renderInlineMarkdown(bulletMatch[3], baseColor)}
          </Text>
        </View>
      );
      continue;
    }

    // Numbered lists (1. , 2. , etc.)
    const numberedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      const indent = Math.floor(numberedMatch[1].length / 2);
      elements.push(
        <View key={`nl${key++}`} style={{ flexDirection: 'row', marginLeft: indent * 12, marginVertical: 2 }}>
          <Text style={{ color: dimColor, marginRight: 6, fontSize: Typography.fontSize.sm, fontWeight: '600', minWidth: 18 }}>{numberedMatch[2]}.</Text>
          <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: Typography.fontSize.md * Typography.lineHeight.normal, color: baseColor }}>
            {renderInlineMarkdown(numberedMatch[3], baseColor)}
          </Text>
        </View>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text
        key={`p${key++}`}
        style={{
          fontSize: Typography.fontSize.md,
          lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
          color: baseColor,
        }}
      >
        {renderInlineMarkdown(line, baseColor)}
      </Text>
    );
  }

  return <View>{elements}</View>;
};

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

  // Detect if user is asking for a study plan
  const detectStudyPlanRequest = (message: string): string | null => {
    const lower = message.toLowerCase();
    // Patterns that indicate a study plan request
    const patterns = [
      /(?:create|make|generate|build|prepare|give me|design)\s+(?:a\s+)?(?:study\s+plan|studyplan|learning\s+plan|revision\s+plan)\s+(?:for|on|about|of)\s+(.+)/i,
      /(?:study\s+plan|studyplan|learning\s+plan)\s+(?:for|on|about|of)\s+(.+)/i,
      /(?:plan|schedule)\s+(?:for|to)\s+(?:study|learn|revise)\s+(.+)/i,
      /(?:help me plan|plan my study|organize my study|organize study)\s+(?:for|on|of|in)\s+(.+)/i,
    ];
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Clean up the subject - remove trailing punctuation
        return match[1].replace(/[?.!,;]+$/, '').trim();
      }
    }
    // Fallback: if it mentions "study plan" and a subject-like word
    if (lower.includes('study plan') || lower.includes('studyplan') || lower.includes('learning plan')) {
      // Try to extract subject after common prepositions
      const fallback = message.match(/(?:for|on|about|of|in)\s+(.{2,50}?)(?:\s*[?.!]?\s*$)/i);
      if (fallback && fallback[1]) {
        return fallback[1].replace(/[?.!,;]+$/, '').trim();
      }
    }
    return null;
  };

  const generateStudyPlan = async (subject: string): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/study-plans/generate?subject=${encodeURIComponent(subject)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Study plan generation error:', error);
      return false;
    }
  };

  const sendToGemini = async (userMessage: string, allMessages: Message[]) => {
    setIsTyping(true);
    scrollToBottom();

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Check if this is a study plan request
      const studyPlanSubject = detectStudyPlanRequest(userMessage);

      if (studyPlanSubject) {
        // Generate and save the study plan
        const success = await generateStudyPlan(studyPlanSubject);

        let replyText: string;
        if (success) {
          replyText = `**Study plan created for "${studyPlanSubject}"!** 🎉\n\nI've generated a comprehensive, week-by-week study plan and saved it for you.\n\n**To view your plan:**\n1. Go to **Study Plans** from the home screen\n2. Tap on **${studyPlanSubject}** to see all the weeks, topics, and resources\n\nThe plan includes:\n- Progressive difficulty (easy → hard)\n- Estimated study hours per topic\n- Key points to cover\n- Recommended resources\n\nWould you like me to explain any topic from the plan, or create a plan for another subject?`;
        } else {
          replyText = `I tried to generate a study plan for "${studyPlanSubject}" but something went wrong. Please try again in a moment.`;
        }

        const botMessage: Message = {
          id: Date.now().toString(),
          text: replyText,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Regular chat — send to Gemini
        const conversationHistory = allMessages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            sender: m.sender === 'bot' ? 'model' : 'user',
            text: m.text,
          }));

        const response = await fetch(`${API_BASE_URL}/chat/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversation_history: conversationHistory,
          }),
        });

        const data = await response.json();

        let replyText: string;
        if (data.success && data.data?.reply) {
          replyText = data.data.reply;
        } else {
          replyText = data.message || "I couldn't generate a response. Please try again.";
        }

        const botMessage: Message = {
          id: Date.now().toString(),
          text: replyText,
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I'm having trouble connecting right now. Please check your connection and try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    scrollToBottom();
    sendToGemini(trimmed, updatedMessages);
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
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>
              {item.text}
            </Text>
          ) : (
            <MarkdownText text={item.text} isUser={false} />
          )}
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
              style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
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
