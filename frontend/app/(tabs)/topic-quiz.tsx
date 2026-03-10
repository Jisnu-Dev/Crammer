import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
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

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

type QuizPhase = 'loading' | 'quiz' | 'results';

export default function TopicQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    planId: string;
    topicId: string;
    topicTitle: string;
    subjectColor: string;
    subjectName: string;
  }>();

  const planId = params.planId;
  const topicId = params.topicId;
  const topicTitle = params.topicTitle || 'Topic Quiz';
  const subjectColor = params.subjectColor || '#2563EB';
  const subjectName = params.subjectName || 'Subject';

  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    generateQuiz();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentQ]);

  const generateQuiz = async () => {
    try {
      const token = await getAccessToken();
      if (!token || !planId || !topicId) return;
      const response = await fetch(
        `${API_BASE_URL}/study-plans/${planId}/topics/${topicId}/quiz`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success && data.data?.questions) {
        setQuestions(data.data.questions);
        setQuizTitle(data.data.quiz_title || `Quiz: ${topicTitle}`);

        // If quiz was already completed, restore saved results
        if (data.data.is_completed && data.data.user_answers) {
          const restored: Record<number, number> = {};
          Object.entries(data.data.user_answers).forEach(([k, v]) => {
            restored[parseInt(k)] = v as number;
          });
          setSelectedAnswers(restored);
          setPhase('results');
        } else {
          setPhase('quiz');
        }
      } else {
        setError(data.message || 'Failed to generate quiz');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Connection error. Please try again.');
    }
  };

  const selectOption = (optionIdx: number) => {
    if (showAnswer) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ]: optionIdx }));
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      fadeAnim.setValue(0);
      setShowAnswer(false);
      setCurrentQ(currentQ + 1);
    } else {
      saveQuizResults();
      setPhase('results');
    }
  };

  const saveQuizResults = async () => {
    try {
      const token = await getAccessToken();
      if (!token || !planId || !topicId) return;

      const finalScore = questions.reduce(
        (acc, q, idx) => acc + (selectedAnswers[idx] === q.correct_answer ? 1 : 0),
        0
      );

      await fetch(
        `${API_BASE_URL}/study-plans/${planId}/topics/${topicId}/quiz/results`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_answers: selectedAnswers,
            score: finalScore,
          }),
        }
      );
    } catch (err) {
      console.error('Error saving quiz results:', err);
    }
  };

  const retryQuiz = () => {
    setSelectedAnswers({});
    setCurrentQ(0);
    setShowAnswer(false);
    fadeAnim.setValue(1);
    setPhase('quiz');
  };

  const score = questions.reduce(
    (acc, q, idx) => acc + (selectedAnswers[idx] === q.correct_answer ? 1 : 0),
    0
  );
  const scorePercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const getScoreColor = () => {
    if (scorePercent >= 80) return '#10B981';
    if (scorePercent >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreEmoji = () => {
    if (scorePercent >= 80) return 'trophy';
    if (scorePercent >= 50) return 'thumbs-up';
    return 'refresh-circle';
  };

  // --- Loading ---
  if (phase === 'loading') {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="dark-content" />
        {error ? (
          <>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: subjectColor }]} onPress={() => { setError(''); generateQuiz(); }}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={subjectColor} />
            <Text style={styles.loadingTitle}>Generating Quiz...</Text>
            <Text style={styles.loadingSubtitle}>AI is crafting questions for "{topicTitle}"</Text>
          </>
        )}
      </View>
    );
  }

  // --- Results ---
  if (phase === 'results') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Header */}
        <View style={[styles.resultHeader, { backgroundColor: getScoreColor() }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.scoreSection}>
            <TouchableOpacity onPress={retryQuiz} activeOpacity={0.7}>
              <Ionicons name={getScoreEmoji() as any} size={48} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scoreText}>{score}/{questions.length}</Text>
            <Text style={styles.scorePct}>{scorePercent}% Correct</Text>
            <Text style={styles.scoreMsg}>
              {scorePercent >= 80 ? 'Excellent work!' : scorePercent >= 50 ? 'Good effort!' : 'Keep studying!'}
            </Text>
          </View>
        </View>

        {/* Detailed results */}
        <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.reviewTitle}>Review Answers</Text>
          {questions.map((q, idx) => {
            const userAns = selectedAnswers[idx];
            const isCorrect = userAns === q.correct_answer;
            return (
              <View key={q.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewBadge, { backgroundColor: isCorrect ? '#10B98118' : '#EF444418' }]}>
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={isCorrect ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <Text style={styles.reviewQ}>Q{idx + 1}. {q.question}</Text>
                </View>

                {q.options.map((opt, oIdx) => {
                  const isUserPick = oIdx === userAns;
                  const isAnswer = oIdx === q.correct_answer;
                  let optBg = '#F8FAFC';
                  let optBorder = '#E2E8F0';
                  let optTextColor = Colors.text.primary;
                  if (isAnswer) {
                    optBg = '#10B98112';
                    optBorder = '#10B981';
                    optTextColor = '#10B981';
                  } else if (isUserPick && !isCorrect) {
                    optBg = '#EF444412';
                    optBorder = '#EF4444';
                    optTextColor = '#EF4444';
                  }
                  return (
                    <View key={oIdx} style={[styles.reviewOpt, { backgroundColor: optBg, borderColor: optBorder }]}>
                      <Text style={[styles.reviewOptText, { color: optTextColor }]}>
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </Text>
                      {isAnswer && <Ionicons name="checkmark" size={16} color="#10B981" />}
                      {isUserPick && !isCorrect && <Ionicons name="close" size={16} color="#EF4444" />}
                    </View>
                  );
                })}

                <View style={styles.explanationBox}>
                  <Ionicons name="bulb" size={16} color="#F59E0B" />
                  <Text style={styles.explanationText}>{q.explanation}</Text>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={retryQuiz}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.doneBtnText}>Retry Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: subjectColor, marginTop: 0 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            <Text style={styles.doneBtnText}>Back to Study Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // --- Quiz ---
  const q = questions[currentQ];
  const selected = selectedAnswers[currentQ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={Colors.text.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((currentQ + 1) / questions.length) * 100}%`, backgroundColor: subjectColor }]} />
          </View>
        </View>
        <Text style={styles.qCounter}>{currentQ + 1}/{questions.length}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question */}
          <View style={styles.questionCard}>
            <View style={[styles.qNumberBadge, { backgroundColor: subjectColor }]}>
              <Text style={styles.qNumberText}>Q{currentQ + 1}</Text>
            </View>
            <Text style={styles.questionText}>{q.question}</Text>
          </View>

          {/* Options */}
          {q.options.map((opt, oIdx) => {
            const isSelected = selected === oIdx;
            const isCorrect = oIdx === q.correct_answer;
            let cardStyle = styles.optionCard;
            let borderColor = '#E2E8F0';
            let bgColor = '#FFFFFF';
            let textColor = Colors.text.primary;
            let iconName: string | null = null;
            let iconColor = '';

            if (showAnswer) {
              if (isCorrect) {
                borderColor = '#10B981';
                bgColor = '#10B98110';
                textColor = '#10B981';
                iconName = 'checkmark-circle';
                iconColor = '#10B981';
              } else if (isSelected && !isCorrect) {
                borderColor = '#EF4444';
                bgColor = '#EF444410';
                textColor = '#EF4444';
                iconName = 'close-circle';
                iconColor = '#EF4444';
              }
            } else if (isSelected) {
              borderColor = subjectColor;
              bgColor = `${subjectColor}10`;
              textColor = subjectColor;
            }

            return (
              <TouchableOpacity
                key={oIdx}
                style={[styles.optionCard, { borderColor, backgroundColor: bgColor }]}
                activeOpacity={showAnswer ? 1 : 0.7}
                onPress={() => selectOption(oIdx)}
              >
                <View style={[styles.optLetter, { backgroundColor: showAnswer && isCorrect ? '#10B981' : showAnswer && isSelected && !isCorrect ? '#EF4444' : isSelected ? subjectColor : '#F1F5F9' }]}>
                  <Text style={[styles.optLetterText, { color: (isSelected || (showAnswer && (isCorrect || (isSelected && !isCorrect)))) ? '#FFFFFF' : Colors.text.secondary }]}>
                    {String.fromCharCode(65 + oIdx)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor, flex: 1 }]}>{opt}</Text>
                {iconName && <Ionicons name={iconName as any} size={22} color={iconColor} />}
              </TouchableOpacity>
            );
          })}

          {/* Explanation after answer */}
          {showAnswer && (
            <View style={styles.inlineExplanation}>
              <View style={styles.explanationHeader}>
                <Ionicons name="bulb" size={18} color="#F59E0B" />
                <Text style={styles.explanationTitle}>Explanation</Text>
              </View>
              <Text style={styles.explanationText}>{q.explanation}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom button */}
      {showAnswer && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: subjectColor }]}
            onPress={nextQuestion}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>
              {currentQ < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Text>
            <Ionicons
              name={currentQ < questions.length - 1 ? 'arrow-forward' : 'trophy'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },

  // Loading
  loadingTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginTop: Spacing.lg },
  loadingSubtitle: { fontSize: 14, color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' },
  errorText: { fontSize: 16, color: '#EF4444', marginTop: Spacing.md, textAlign: 'center' },
  retryBtn: { marginTop: Spacing.lg, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.lg },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 30) + 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
    ...Shadows.small,
  },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  qCounter: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary },

  // Question card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  qNumberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  qNumberText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  questionText: { fontSize: 18, fontWeight: '600', color: Colors.text.primary, lineHeight: 26 },

  // Options
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Shadows.small,
  },
  optLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optLetterText: { fontSize: 14, fontWeight: '700' },
  optionText: { fontSize: 15, fontWeight: '500', lineHeight: 22 },

  // Inline explanation
  inlineExplanation: {
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  explanationTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  explanationText: { fontSize: 14, color: '#78716C', lineHeight: 20, flex: 1 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    backgroundColor: '#FFFFFF',
    ...Shadows.large,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // Results header
  resultHeader: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 30) + 10,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Shadows.large,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreSection: { alignItems: 'center' },
  scoreText: { fontSize: 48, fontWeight: '800', color: '#FFFFFF', marginTop: Spacing.sm },
  scorePct: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  scoreMsg: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs },

  // Results scroll
  resultsScroll: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  reviewTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.md },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  reviewBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  reviewQ: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, flex: 1, lineHeight: 22 },
  reviewOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  reviewOptText: { fontSize: 14, fontWeight: '500' },
  explanationBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: 8,
    alignItems: 'flex-start',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
