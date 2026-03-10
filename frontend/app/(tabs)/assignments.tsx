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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
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

interface SubjectGroup {
  plan_id: number;
  subject_name: string;
  subject_icon: string;
  subject_color: string;
  total: number;
  completed: number;
  assignments: any[];
}

export default function AssignmentsScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignments = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/assignments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubjects(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching assignments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAssignments();
    }, [])
  );

  const totalAssignments = subjects.reduce((s, g) => s + g.total, 0);
  const totalCompleted = subjects.reduce((s, g) => s + g.completed, 0);
  const pendingCount = totalAssignments - totalCompleted;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBg}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Assignments</Text>
        <Text style={styles.headerSubtitle}>
          {totalAssignments} total • {pendingCount} pending • {totalCompleted} completed
        </Text>

        {/* Summary chips */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.20)' }]}>
            <Ionicons name="library-outline" size={18} color="#FFFFFF" />
            <Text style={styles.summaryValue}>{subjects.length}</Text>
            <Text style={styles.summaryLabel}>Subjects</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.20)' }]}>
            <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            <Text style={styles.summaryValue}>{totalAssignments}</Text>
            <Text style={styles.summaryLabel}>Tasks</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.20)' }]}>
            <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
            <Text style={styles.summaryValue}>{totalCompleted}</Text>
            <Text style={styles.summaryLabel}>Done</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAssignments(); }} />
          }
        >
          {subjects.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="clipboard-outline" size={56} color={Colors.text.placeholder} />
              </View>
              <Text style={styles.emptyTitle}>No assignments yet</Text>
              <Text style={styles.emptySubtitle}>
                Generate a study plan and assignments will appear here automatically
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/study')}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.emptyBtnText}>Create Study Plan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            subjects.map((subject) => {
              const progress = subject.total > 0 ? subject.completed / subject.total : 0;
              const pending = subject.total - subject.completed;
              return (
                <TouchableOpacity
                  key={subject.plan_id}
                  style={styles.subjectCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/subject-assignments',
                      params: {
                        planId: String(subject.plan_id),
                        subjectName: subject.subject_name,
                        subjectIcon: subject.subject_icon,
                        subjectColor: subject.subject_color,
                      },
                    })
                  }
                >
                  {/* Color accent */}
                  <View style={[styles.subjectAccent, { backgroundColor: subject.subject_color }]} />

                  <View style={styles.subjectBody}>
                    <View style={styles.subjectTop}>
                      <View style={[styles.subjectIconCircle, { backgroundColor: `${subject.subject_color}15` }]}>
                        <Ionicons
                          name={(subject.subject_icon || 'book') as any}
                          size={24}
                          color={subject.subject_color}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <Text style={styles.subjectName}>{subject.subject_name}</Text>
                        <Text style={styles.subjectMeta}>
                          {subject.total} assignment{subject.total !== 1 ? 's' : ''} •{' '}
                          {pending > 0 ? (
                            <Text style={{ color: '#F59E0B', fontWeight: '600' }}>{pending} pending</Text>
                          ) : (
                            <Text style={{ color: '#10B981', fontWeight: '600' }}>All done!</Text>
                          )}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.text.placeholder} />
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.round(progress * 100)}%`,
                            backgroundColor: subject.subject_color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {subject.completed}/{subject.total} completed ({Math.round(progress * 100)}%)
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBg: {
    backgroundColor: '#F59E0B',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 30) + 10,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.large,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, fontSize: 14, color: Colors.text.secondary },

  list: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  subjectCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  subjectAccent: { width: 5 },
  subjectBody: { flex: 1, padding: Spacing.md },
  subjectTop: { flexDirection: 'row', alignItems: 'center' },
  subjectIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectName: { fontSize: 17, fontWeight: '600', color: Colors.text.primary },
  subjectMeta: { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl * 2 },
  emptyIcon: { marginBottom: Spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text.primary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
