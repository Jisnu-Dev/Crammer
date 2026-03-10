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
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAccessToken } from '../../utils/auth';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') return `http://10.123.11.99:8000/api/v1`;
    return 'http://localhost:8000/api/v1';
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

/** Lightweight markdown renderer */
const MarkdownText = ({ text, isUser }: { text: string; isUser: boolean }) => {
  const baseColor = isUser ? Colors.textLight : Colors.text.primary;
  const dimColor = isUser ? 'rgba(255,255,255,0.7)' : Colors.text.secondary;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let key = 0;

  const renderInline = (line: string, color: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex)
        parts.push(<Text key={`t${key++}`} style={{ color }}>{line.slice(lastIndex, match.index)}</Text>);
      if (match[2]) parts.push(<Text key={`b${key++}`} style={{ color, fontWeight: '700' }}>{match[2]}</Text>);
      else if (match[3]) parts.push(<Text key={`i${key++}`} style={{ color, fontStyle: 'italic' }}>{match[3]}</Text>);
      else if (match[4])
        parts.push(
          <Text key={`c${key++}`} style={{
            color: isUser ? '#E0F0FF' : Colors.primary,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            fontSize: Typography.fontSize.sm,
            backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : 'rgba(37,99,235,0.08)',
            borderRadius: 3, paddingHorizontal: 2,
          }}>{match[4]}</Text>
        );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) parts.push(<Text key={`r${key++}`} style={{ color }}>{line.slice(lastIndex)}</Text>);
    if (parts.length === 0) parts.push(<Text key={`e${key++}`} style={{ color }}>{line}</Text>);
    return parts;
  };

  const renderTable = (tableLines: string[]) => {
    const parseRow = (row: string) => row.split('|').map(c => c.trim()).filter(c => c !== '');
    const headers = parseRow(tableLines[0]);
    const dataRows = tableLines.slice(2).map(parseRow);
    const headerBg = isUser ? 'rgba(255,255,255,0.18)' : '#EEF2FF';
    const rowBg = isUser ? 'rgba(255,255,255,0.06)' : '#FAFBFF';
    const altRowBg = isUser ? 'rgba(255,255,255,0.10)' : '#F3F6FF';
    const borderColor = isUser ? 'rgba(255,255,255,0.2)' : '#E2E8F0';
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} key={`tbl${key++}`} style={{ marginVertical: 6 }}>
        <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor }}>
          <View style={{ flexDirection: 'row', backgroundColor: headerBg }}>
            {headers.map((h, ci) => (
              <View key={`th${ci}`} style={{ paddingHorizontal: 14, paddingVertical: 10, minWidth: 90, borderRightWidth: ci < headers.length - 1 ? 1 : 0, borderRightColor: borderColor }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: baseColor }}>{renderInline(h, baseColor)}</Text>
              </View>
            ))}
          </View>
          {dataRows.map((row, ri) => (
            <View key={`tr${ri}`} style={{ flexDirection: 'row', backgroundColor: ri % 2 === 0 ? rowBg : altRowBg, borderTopWidth: 1, borderTopColor: borderColor }}>
              {row.map((cell, ci) => (
                <View key={`td${ri}_${ci}`} style={{ paddingHorizontal: 14, paddingVertical: 9, minWidth: 90, borderRightWidth: ci < row.length - 1 ? 1 : 0, borderRightColor: borderColor }}>
                  <Text style={{ fontSize: 13, color: baseColor, lineHeight: 18 }}>{renderInline(cell, baseColor)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <View key={`cb${key++}`} style={{ backgroundColor: isUser ? 'rgba(255,255,255,0.12)' : '#F3F4F6', borderRadius: BorderRadius.md, padding: Spacing.sm, marginVertical: 4 }}>
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: Typography.fontSize.sm, color: isUser ? '#E0F0FF' : Colors.text.primary, lineHeight: Typography.fontSize.sm * 1.6 }}>
              {codeBlockLines.join('\n')}
            </Text>
          </View>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else inCodeBlock = true;
      continue;
    }
    if (inCodeBlock) { codeBlockLines.push(line); continue; }
    if (line.trim() === '') { elements.push(<View key={`sp${key++}`} style={{ height: 8 }} />); continue; }

    // Table detection: | col | col | followed by |---|---|
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|?[\s-:|]+\|/.test(lines[i + 1].trim())) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      elements.push(renderTable(tableLines));
      i = j - 1;
      continue;
    }
    // Skip separator-only lines that may be leftover
    if (/^\|?[\s-:|]+\|$/.test(line.trim())) continue;

    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const sizes = [Typography.fontSize.xl, Typography.fontSize.lg, Typography.fontSize.md + 1];
      elements.push(<Text key={`h${key++}`} style={{ fontSize: sizes[headingMatch[1].length - 1], fontWeight: '700', color: baseColor, marginTop: 6, marginBottom: 2 }}>{renderInline(headingMatch[2], baseColor)}</Text>);
      continue;
    }

    const bulletMatch = line.match(/^(\s*)([-•*])\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <View key={`bl${key++}`} style={{ flexDirection: 'row', marginLeft: Math.floor(bulletMatch[1].length / 2) * 12, marginVertical: 2 }}>
          <Text style={{ color: isUser ? 'rgba(255,255,255,0.6)' : Colors.primary, marginRight: 6, fontSize: Typography.fontSize.sm }}>•</Text>
          <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: Typography.fontSize.md * Typography.lineHeight.normal, color: baseColor }}>{renderInline(bulletMatch[3], baseColor)}</Text>
        </View>
      );
      continue;
    }

    const numberedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <View key={`nl${key++}`} style={{ flexDirection: 'row', marginLeft: Math.floor(numberedMatch[1].length / 2) * 12, marginVertical: 2 }}>
          <Text style={{ color: dimColor, marginRight: 6, fontSize: Typography.fontSize.sm, fontWeight: '600', minWidth: 18 }}>{numberedMatch[2]}.</Text>
          <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: Typography.fontSize.md * Typography.lineHeight.normal, color: baseColor }}>{renderInline(numberedMatch[3], baseColor)}</Text>
        </View>
      );
      continue;
    }

    elements.push(
      <Text key={`p${key++}`} style={{ fontSize: Typography.fontSize.md, lineHeight: Typography.fontSize.md * Typography.lineHeight.normal, color: baseColor }}>
        {renderInline(line, baseColor)}
      </Text>
    );
  }
  return <View>{elements}</View>;
};

export default function TopicChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    planId: string;
    topicId: string;
    topicTitle: string;
    subjectName: string;
    subjectColor: string;
    keyPoints: string;
    resources: string;
  }>();

  const planId = params.planId || '';
  const topicId = params.topicId || '';
  const topicTitle = params.topicTitle || 'Topic';
  const subjectName = params.subjectName || 'Subject';
  const subjectColor = params.subjectColor || '#2563EB';
  const keyPoints: string[] = params.keyPoints ? JSON.parse(params.keyPoints) : [];
  const resources: string[] = params.resources ? JSON.parse(params.resources) : [];

  const welcomeText = `Hi! 👋 I'm ready to help you learn **${topicTitle}** from your **${subjectName}** study plan.\n\n${keyPoints.length > 0 ? `**Key areas we can explore:**\n${keyPoints.map((p) => `- ${p}`).join('\n')}\n\n` : ''}Ask me anything about this topic — I can explain concepts, give examples, test your understanding, or dive deeper into any area!`;

  const WELCOME: Message = {
    id: 'welcome',
    text: welcomeText,
    sender: 'bot',
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  // ---------- Persistence helpers ----------
  const saveMessageToDB = async (sender: string, text: string) => {
    if (!planId || !topicId) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await fetch(`${API_BASE_URL}/study-plans/${planId}/topics/${topicId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sender, text }),
      });
    } catch (e) {
      console.error('Failed to save message:', e);
    }
  };

  const clearChatInDB = async () => {
    if (!planId || !topicId) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await fetch(`${API_BASE_URL}/study-plans/${planId}/topics/${topicId}/chat`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error('Failed to clear chat:', e);
    }
  };

  // ---------- Load saved messages on mount ----------
  useEffect(() => {
    const loadHistory = async () => {
      if (!planId || !topicId) { setLoadingHistory(false); return; }
      try {
        const token = await getAccessToken();
        if (!token) { setLoadingHistory(false); return; }
        const res = await fetch(`${API_BASE_URL}/study-plans/${planId}/topics/${topicId}/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const saved: Message[] = data.data.map((m: any) => ({
            id: String(m.id),
            text: m.text,
            sender: m.sender as 'user' | 'bot',
            timestamp: new Date(m.created_at),
          }));
          setMessages([WELCOME, ...saved]);
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [planId, topicId]);

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
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (userMessage: string, allMessages: Message[]) => {
    setIsTyping(true);
    scrollToBottom();

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // Build conversation with topic context baked in
      const systemContext = `You are helping the student learn about the topic "${topicTitle}" from the subject "${subjectName}". Key points of this topic: ${keyPoints.join(', ')}. Resources: ${resources.join(', ')}. Stay focused on this topic. Explain clearly with examples. Use markdown formatting.`;

      const conversationHistory = [
        { sender: 'user', text: systemContext },
        { sender: 'model', text: `I'm ready to help you learn about ${topicTitle}. What would you like to know?` },
        ...allMessages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            sender: m.sender === 'bot' ? 'model' : 'user',
            text: m.text,
          })),
      ];

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
      const replyText = data.success && data.data?.reply
        ? data.data.reply
        : "I couldn't generate a response. Please try again.";

      const botMsg: Message = { id: Date.now().toString(), text: replyText, sender: 'bot', timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
      saveMessageToDB('bot', replyText);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "Sorry, I'm having trouble connecting right now.", sender: 'bot', timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), text: trimmed, sender: 'user', timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputText('');
    scrollToBottom();
    saveMessageToDB('user', trimmed);
    sendMessage(trimmed, updated);
  };

  const QUICK_PROMPTS = [
    { label: 'Explain this topic', icon: 'bulb-outline' as const, prompt: `Explain ${topicTitle} in detail with examples` },
    { label: 'Key concepts', icon: 'list-outline' as const, prompt: `What are the most important concepts in ${topicTitle}?` },
    { label: 'Test me', icon: 'help-circle-outline' as const, prompt: `Ask me some questions to test my understanding of ${topicTitle}` },
    { label: 'Real-world use', icon: 'globe-outline' as const, prompt: `What are real-world applications of ${topicTitle}?` },
  ];

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';
    const isFirst = index === 0 || messages[index - 1].sender !== item.sender;
    return (
      <View style={[styles.messageRow, isUser ? styles.userMessageRow : styles.botMessageRow]}>
        {!isUser && isFirst && (
          <View style={[styles.botAvatar, { backgroundColor: subjectColor }]}>
            <Ionicons name="school" size={18} color="#FFFFFF" />
          </View>
        )}
        {!isUser && !isFirst && <View style={styles.avatarSpacer} />}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble, !isFirst && !isUser && styles.botBubbleContinued, !isFirst && isUser && styles.userBubbleContinued]}>
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>{item.text}</Text>
          ) : (
            <MarkdownText text={item.text} isUser={false} />
          )}
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    const opacity = typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    return (
      <View style={[styles.messageRow, styles.botMessageRow]}>
        <View style={[styles.botAvatar, { backgroundColor: subjectColor }]}>
          <Ionicons name="school" size={18} color="#FFFFFF" />
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: subjectColor }]}>
            <Ionicons name="book" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{topicTitle}</Text>
            <Text style={styles.headerSubtitle}>{subjectName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => {
            setMessages([WELCOME]);
            setInputText('');
            clearChatInDB();
          }}
        >
          <Ionicons name="refresh" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
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
            <Text style={styles.quickPromptsLabel}>Suggested questions</Text>
            <View style={styles.quickPromptsGrid}>
              {QUICK_PROMPTS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickPromptCard}
                  onPress={() => setInputText(item.prompt)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={16} color={subjectColor} style={{ marginRight: 6 }} />
                  <Text style={styles.quickPromptLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`Ask about ${topicTitle}...`}
              placeholderTextColor={Colors.text.placeholder}
              multiline
              maxLength={1000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: inputText.trim() && !isTyping ? subjectColor : Colors.surfaceLight }]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color={inputText.trim() ? '#FFFFFF' : Colors.text.placeholder} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 30) + 10,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.small,
  },
  backButton: { width: 40, height: 40, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceLight },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm },
  headerAvatar: { width: 40, height: 40, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { marginLeft: Spacing.sm, flex: 1 },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '600' as any, color: Colors.text.primary },
  headerSubtitle: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, fontWeight: '500' as any },
  headerAction: { width: 40, height: 40, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceLight },

  messagesList: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  messageRow: { flexDirection: 'row', marginBottom: Spacing.sm, maxWidth: '85%' },
  userMessageRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  botMessageRow: { alignSelf: 'flex-start' },
  botAvatar: { width: 32, height: 32, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm, marginTop: 2 },
  avatarSpacer: { width: 32, marginRight: Spacing.sm },
  messageBubble: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, maxWidth: '100%' },
  userBubble: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, borderBottomRightRadius: BorderRadius.sm },
  userBubbleContinued: { borderTopRightRadius: BorderRadius.sm },
  botBubble: { backgroundColor: Colors.background, borderRadius: BorderRadius.xl, borderBottomLeftRadius: BorderRadius.sm, ...Shadows.small },
  botBubbleContinued: { borderTopLeftRadius: BorderRadius.sm },
  messageText: { fontSize: Typography.fontSize.md, lineHeight: Typography.fontSize.md * Typography.lineHeight.normal },
  userMessageText: { color: Colors.textLight },
  timestamp: { fontSize: Typography.fontSize.xs - 2, marginTop: 4 },
  userTimestamp: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  botTimestamp: { color: Colors.text.placeholder },
  typingBubble: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  typingDots: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.text.placeholder },

  quickPromptsContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  quickPromptsLabel: { fontSize: Typography.fontSize.sm, fontWeight: '600' as any, color: Colors.text.secondary, marginBottom: Spacing.sm },
  quickPromptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickPromptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, ...Shadows.small },
  quickPromptLabel: { fontSize: Typography.fontSize.sm, color: Colors.text.primary, fontWeight: '500' as any },

  inputContainer: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl + 4, paddingLeft: Spacing.md, paddingRight: Spacing.xs, paddingVertical: Platform.OS === 'ios' ? Spacing.xs : 0, minHeight: 48, borderWidth: 1, borderColor: Colors.border },
  textInput: { flex: 1, fontSize: Typography.fontSize.md, color: Colors.text.primary, maxHeight: 120, paddingTop: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm + 2, paddingBottom: Platform.OS === 'ios' ? Spacing.sm : Spacing.sm + 2 },
  sendButton: { width: 38, height: 38, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.xs, marginBottom: Platform.OS === 'ios' ? 1 : Spacing.xs },
});
