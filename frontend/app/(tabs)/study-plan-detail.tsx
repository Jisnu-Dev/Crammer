import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAccessToken } from '../../utils/auth';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

// API Base URL
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') return `http://10.123.11.99:8000/api/v1`;
    return 'http://localhost:8000/api/v1';
  }
  return 'https://your-production-api.com/api/v1';
};
const API_BASE_URL = getBaseUrl();

interface StudyTopic {
  id: number;
  title: string;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'completed' | 'in-progress' | 'not-started';
  key_points: string[];
  resources: string[];
}

interface WeekPlan {
  week: number;
  title: string;
  topics: StudyTopic[];
}

const difficultyColors: Record<string, string> = {
  Easy: '#10B981',
  Medium: '#F59E0B',
  Hard: '#EF4444',
};

const statusConfig: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  completed: { color: '#10B981', icon: 'checkmark-circle', label: 'Done' },
  'in-progress': { color: '#2563EB', icon: 'play-circle', label: 'In Progress' },
  'not-started': { color: Colors.text.placeholder, icon: 'ellipse-outline', label: 'Not Started' },
};

export default function StudyPlanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    planId: string;
    subjectName: string;
    subjectColor: string;
    subjectIcon: string;
  }>();

  const planId = params.planId;
  const subjectName = params.subjectName || 'Subject';
  const subjectColor = params.subjectColor || '#2563EB';
  const subjectIcon = (params.subjectIcon || 'book') as keyof typeof Ionicons.glyphMap;

  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);

  useEffect(() => {
    fetchPlanDetail();
  }, [planId]);

  const fetchPlanDetail = async () => {
    try {
      const token = await getAccessToken();
      if (!token || !planId) return;
      const response = await fetch(`${API_BASE_URL}/study-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data?.plan_data) {
        setWeekPlans(data.data.plan_data);
      }
    } catch (error) {
      console.error('Error fetching study plan detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopicStatus = async (topicId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'not-started' : 'completed';

    // Optimistic update — change local state immediately
    setWeekPlans((prev) =>
      prev.map((week) => ({
        ...week,
        topics: week.topics.map((t) =>
          t.id === topicId ? { ...t, status: newStatus as StudyTopic['status'] } : t
        ),
      }))
    );

    // Persist to backend
    try {
      const token = await getAccessToken();
      if (!token || !planId) return;
      await fetch(`${API_BASE_URL}/study-plans/${planId}/topics/${topicId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error('Error updating topic status:', error);
      // Revert on failure
      setWeekPlans((prev) =>
        prev.map((week) => ({
          ...week,
          topics: week.topics.map((t) =>
            t.id === topicId ? { ...t, status: currentStatus as StudyTopic['status'] } : t
          ),
        }))
      );
    }
  };

  // Calculate stats
  const allTopics = weekPlans.flatMap((w) => w.topics);
  const completed = allTopics.filter((t) => t.status === 'completed').length;
  const inProgress = allTopics.filter((t) => t.status === 'in-progress').length;
  const totalTopics = allTopics.length;
  const progress = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={subjectColor} />
        <Text style={{ marginTop: Spacing.md, color: Colors.text.secondary }}>Loading study plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.headerBg, { backgroundColor: subjectColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={styles.headerIconCircle}>
            <Ionicons name={subjectIcon} size={28} color={subjectColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{subjectName}</Text>
            <Text style={styles.headerSubtitle}>Study Plan</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressPercent}>{progress}% Complete</Text>
            <Text style={styles.progressDetail}>
              {completed}/{totalTopics} topics done
            </Text>
          </View>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.quickStats}>
        <View style={styles.qStatItem}>
          <View style={[styles.qStatDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.qStatText}>{completed} Completed</Text>
        </View>
        <View style={styles.qStatItem}>
          <View style={[styles.qStatDot, { backgroundColor: '#2563EB' }]} />
          <Text style={styles.qStatText}>{inProgress} In Progress</Text>
        </View>
        <View style={styles.qStatItem}>
          <View style={[styles.qStatDot, { backgroundColor: Colors.text.placeholder }]} />
          <Text style={styles.qStatText}>{totalTopics - completed - inProgress} Remaining</Text>
        </View>
      </View>

      {/* Week Plans */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {weekPlans.map((week) => (
          <View key={week.week} style={styles.weekSection}>
            {/* Week Header */}
            <TouchableOpacity
              style={styles.weekHeader}
              activeOpacity={0.7}
              onPress={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
            >
              <View style={[styles.weekBadge, { backgroundColor: subjectColor }]}>
                <Text style={styles.weekBadgeText}>W{week.week}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.weekTitle}>{week.title}</Text>
                <Text style={styles.weekMeta}>
                  {week.topics.length} topics · {week.topics.reduce((a, t) => a + parseInt(t.duration), 0)}h
                </Text>
              </View>
              <Ionicons
                name={expandedWeek === week.week ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>

            {/* Topics */}
            {expandedWeek === week.week &&
              week.topics.map((topic, tIdx) => {
                const statusCfg = statusConfig[topic.status];
                const isExpanded = expandedTopic === topic.id;
                const isCompleted = topic.status === 'completed';
                return (
                  <View
                    key={topic.id}
                    style={[styles.topicCard, tIdx === week.topics.length - 1 && { marginBottom: 0 }]}
                  >
                    {/* Status indicator line */}
                    <View style={[styles.topicStatusLine, { backgroundColor: statusCfg.color }]} />

                    <View style={styles.topicMain}>
                      <View style={styles.topicHeader}>
                        {/* Checkmark toggle */}
                        <TouchableOpacity
                          onPress={() => toggleTopicStatus(topic.id, topic.status)}
                          activeOpacity={0.6}
                          style={[
                            styles.checkBtn,
                            isCompleted && { backgroundColor: '#10B981' },
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          ) : (
                            <Ionicons name="ellipse-outline" size={22} color={Colors.text.placeholder} />
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{ flex: 1, marginLeft: Spacing.sm }}
                          activeOpacity={0.7}
                          onPress={() => setExpandedTopic(isExpanded ? null : topic.id)}
                        >
                          <Text style={[styles.topicTitle, isCompleted && styles.topicTitleDone]}>
                            {topic.title}
                          </Text>
                          <View style={styles.topicChips}>
                            <View style={[styles.chip, { backgroundColor: `${difficultyColors[topic.difficulty]}18` }]}>
                              <Text style={[styles.chipText, { color: difficultyColors[topic.difficulty] }]}>
                                {topic.difficulty}
                              </Text>
                            </View>
                            <View style={styles.chip}>
                              <Ionicons name="time-outline" size={11} color={Colors.text.secondary} />
                              <Text style={styles.chipText}>{topic.duration}</Text>
                            </View>
                            <View style={[styles.chip, { backgroundColor: `${statusCfg.color}18` }]}>
                              <Text style={[styles.chipText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.learnChip}
                              activeOpacity={0.7}
                              onPress={() =>
                                router.push({
                                  pathname: '/(tabs)/topic-chat',
                                  params: {
                                    planId: planId!,
                                    topicId: String(topic.id),
                                    topicTitle: topic.title,
                                    subjectName,
                                    subjectColor,
                                    keyPoints: JSON.stringify(topic.key_points || []),
                                    resources: JSON.stringify(topic.resources || []),
                                  },
                                })
                              }
                            >
                              <Ionicons name="chatbubble-ellipses" size={12} color="#FFFFFF" />
                              <Text style={styles.learnChipText}>Learn</Text>
                            </TouchableOpacity>
                            {isCompleted && (
                              <TouchableOpacity
                                style={styles.quizChip}
                                activeOpacity={0.7}
                                onPress={() =>
                                  router.push({
                                    pathname: '/(tabs)/topic-quiz',
                                    params: {
                                      planId: planId!,
                                      topicId: String(topic.id),
                                      topicTitle: topic.title,
                                      subjectColor,
                                      subjectName,
                                    },
                                  })
                                }
                              >
                                <Ionicons name="help-circle" size={12} color="#FFFFFF" />
                                <Text style={styles.quizChipText}>Quiz</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setExpandedTopic(isExpanded ? null : topic.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={Colors.text.placeholder}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Expanded details */}
                      {isExpanded && (
                        <View style={styles.topicDetails}>
                          {/* Key Points */}
                          <Text style={styles.detailLabel}>Key Points</Text>
                          {(topic.key_points || []).map((point, pIdx) => (
                            <View key={pIdx} style={styles.pointRow}>
                              <View style={[styles.pointDot, { backgroundColor: subjectColor }]} />
                              <Text style={styles.pointText}>{point}</Text>
                            </View>
                          ))}

                          {/* Resources */}
                          <Text style={[styles.detailLabel, { marginTop: Spacing.md }]}>Resources</Text>
                          {(topic.resources || []).map((res, rIdx) => (
                            <View key={rIdx} style={styles.resourceRow}>
                              <Ionicons name="document-text-outline" size={14} color={subjectColor} />
                              <Text style={[styles.resourceText, { color: subjectColor }]}>{res}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBg: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 30) + 10,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.large,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  progressSection: { marginTop: Spacing.xs },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressPercent: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  progressDetail: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  qStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qStatDot: { width: 8, height: 8, borderRadius: 4 },
  qStatText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  weekSection: { marginBottom: Spacing.lg },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  weekBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  weekBadgeText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  weekTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  weekMeta: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    marginLeft: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Shadows.small,
  },
  topicStatusLine: {
    width: 4,
  },
  topicMain: {
    flex: 1,
    padding: Spacing.md,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, marginBottom: 4 },
  topicTitleDone: { textDecorationLine: 'line-through', color: Colors.text.placeholder },
  checkBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: Colors.text.secondary },
  quizChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  quizChipText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  learnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  learnChipText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  topicDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingLeft: 4 },
  pointDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  pointText: { fontSize: 14, color: Colors.text.secondary },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, paddingLeft: 4 },
  resourceText: { fontSize: 14, fontWeight: '500' },
});
