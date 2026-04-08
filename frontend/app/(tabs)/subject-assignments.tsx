import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getAccessToken } from '../../utils/auth';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

import { API_BASE_URL } from '../../constants/api';

interface AssignmentItem {
  id: number;
  title: string;
  description: string;
  assignment_type: string;
  difficulty: string;
  estimated_time: string;
  status: string;
  week_number: number;
  topics_covered: string[];
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: string; bg: string; text: string }> = {
  homework: { icon: 'create-outline', bg: '#DBEAFE', text: '#2563EB' },
  essay: { icon: 'document-text-outline', bg: '#F3E8FF', text: '#7C3AED' },
  project: { icon: 'build-outline', bg: '#FEF3C7', text: '#D97706' },
  practice: { icon: 'fitness-outline', bg: '#D1FAE5', text: '#059669' },
  research: { icon: 'search-outline', bg: '#FCE7F3', text: '#DB2777' },
};

const DIFFICULTY_CONFIG: Record<string, { color: string; label: string }> = {
  easy: { color: '#10B981', label: 'Easy' },
  medium: { color: '#F59E0B', label: 'Medium' },
  hard: { color: '#EF4444', label: 'Hard' },
};

export default function SubjectAssignmentsScreen() {
  const router = useRouter();
  const { planId, subjectName, subjectIcon, subjectColor } = useLocalSearchParams<{
    planId: string;
    subjectName: string;
    subjectIcon: string;
    subjectColor: string;
  }>();

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const color = subjectColor || Colors.primary;

  const fetchAssignments = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/assignments/subject/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAssignments(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching subject assignments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssignments();
    }, [planId])
  );

  const toggleStatus = async (assignment: AssignmentItem) => {
    const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
    try {
      const token = await getAccessToken();
      if (!token) return;
      await fetch(`${API_BASE_URL}/assignments/${assignment.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignment.id ? { ...a, status: newStatus } : a))
      );
    } catch (e) {
      console.error('Error toggling assignment:', e);
    }
  };

  const deleteAssignment = (assignment: AssignmentItem) => {
    Alert.alert('Delete Assignment', `Delete "${assignment.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAccessToken();
            if (!token) return;
            await fetch(`${API_BASE_URL}/assignments/${assignment.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
          } catch (e) {
            console.error('Error deleting assignment:', e);
          }
        },
      },
    ]);
  };

  // Group by week
  const weeks = assignments.reduce<Record<number, AssignmentItem[]>>((acc, a) => {
    const w = a.week_number || 1;
    if (!acc[w]) acc[w] = [];
    acc[w].push(a);
    return acc;
  }, {});
  const sortedWeeks = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);

  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const progress = assignments.length > 0 ? completedCount / assignments.length : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerBg, { backgroundColor: color }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerIconCircle}>
            <Ionicons name={(subjectIcon || 'book') as any} size={28} color={color} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {subjectName || 'Subject'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} •{' '}
              {completedCount} completed
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]}
            />
          </View>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      ) : assignments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="clipboard-outline" size={56} color={Colors.text.placeholder} />
          <Text style={styles.emptyTitle}>No assignments</Text>
          <Text style={styles.emptySubtitle}>
            This subject doesn't have assignments yet
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAssignments();
              }}
            />
          }
        >
          {sortedWeeks.map((week) => (
            <View key={week}>
              <Text style={styles.weekHeader}>Week {week}</Text>
              {weeks[week].map((a) => {
                const typeConf = TYPE_CONFIG[a.assignment_type] || TYPE_CONFIG.homework;
                const diffConf = DIFFICULTY_CONFIG[a.difficulty] || DIFFICULTY_CONFIG.medium;
                const isCompleted = a.status === 'completed';
                return (
                  <View key={a.id} style={[styles.card, isCompleted && styles.cardCompleted]}>
                    <View style={styles.cardRow}>
                      {/* Checkbox */}
                      <TouchableOpacity
                        onPress={() => toggleStatus(a)}
                        style={[
                          styles.checkbox,
                          isCompleted && { backgroundColor: color, borderColor: color },
                        ]}
                        activeOpacity={0.7}
                      >
                        {isCompleted && <Ionicons name="checkmark" size={16} color="#FFF" />}
                      </TouchableOpacity>

                      <View style={{ flex: 1, marginLeft: Spacing.sm + 2 }}>
                        <Text
                          style={[
                            styles.cardTitle,
                            isCompleted && styles.cardTitleDone,
                          ]}
                        >
                          {a.title}
                        </Text>
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {a.description}
                        </Text>

                        {/* Chips row */}
                        <View style={styles.chipsRow}>
                          {/* Type chip */}
                          <View style={[styles.chip, { backgroundColor: typeConf.bg }]}>
                            <Ionicons name={typeConf.icon as any} size={12} color={typeConf.text} />
                            <Text style={[styles.chipText, { color: typeConf.text }]}>
                              {a.assignment_type.charAt(0).toUpperCase() + a.assignment_type.slice(1)}
                            </Text>
                          </View>

                          {/* Difficulty chip */}
                          <View
                            style={[
                              styles.chip,
                              { backgroundColor: `${diffConf.color}15` },
                            ]}
                          >
                            <View
                              style={[styles.diffDot, { backgroundColor: diffConf.color }]}
                            />
                            <Text style={[styles.chipText, { color: diffConf.color }]}>
                              {diffConf.label}
                            </Text>
                          </View>

                          {/* Time chip */}
                          {a.estimated_time && (
                            <View style={[styles.chip, { backgroundColor: '#F1F5F9' }]}>
                              <Ionicons name="time-outline" size={12} color={Colors.text.secondary} />
                              <Text style={[styles.chipText, { color: Colors.text.secondary }]}>
                                {a.estimated_time}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Topics */}
                        {a.topics_covered && a.topics_covered.length > 0 && (
                          <View style={styles.topicsRow}>
                            <Ionicons name="pricetag-outline" size={12} color={Colors.text.placeholder} />
                            <Text style={styles.topicsText} numberOfLines={1}>
                              {a.topics_covered.join(', ')}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Delete */}
                      <TouchableOpacity
                        onPress={() => deleteAssignment(a)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  headerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  progressPct: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', width: 40, textAlign: 'right' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, fontSize: 14, color: Colors.text.secondary },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text.primary, marginTop: Spacing.md },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
  },

  list: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  weekHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    ...Shadows.small,
  },
  cardCompleted: { opacity: 0.75 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  cardTitleDone: { textDecorationLine: 'line-through', color: Colors.text.secondary },
  cardDesc: { fontSize: 13, color: Colors.text.secondary, marginTop: 3, lineHeight: 18 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  chipText: { fontSize: 11, fontWeight: '600' },
  diffDot: { width: 7, height: 7, borderRadius: 4 },
  topicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  topicsText: { fontSize: 12, color: Colors.text.placeholder, flex: 1 },
  deleteBtn: { padding: 6, marginLeft: 4 },
});
