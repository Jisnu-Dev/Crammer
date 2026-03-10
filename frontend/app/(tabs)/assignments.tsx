import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

interface Assignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  grade?: string;
  maxGrade?: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 1, title: 'Chapter 5 Problem Set', course: 'Advanced Mathematics', dueDate: 'Feb 18, 2026', status: 'pending', priority: 'high', description: 'Complete problems 1-20 from Chapter 5' },
  { id: 2, title: 'Lab Report: Thermodynamics', course: 'Physics Fundamentals', dueDate: 'Feb 20, 2026', status: 'pending', priority: 'medium', description: 'Write a detailed lab report on the thermodynamics experiment' },
  { id: 3, title: 'Reaction Mechanisms Essay', course: 'Organic Chemistry', dueDate: 'Feb 15, 2026', status: 'submitted', priority: 'low', description: 'Essay on SN1 and SN2 reaction mechanisms' },
  { id: 4, title: 'Binary Tree Implementation', course: 'Data Structures', dueDate: 'Feb 22, 2026', status: 'pending', priority: 'high', description: 'Implement AVL tree with all rotations' },
  { id: 5, title: 'Poetry Analysis', course: 'English Literature', dueDate: 'Feb 10, 2026', status: 'graded', grade: '92', maxGrade: '100', priority: 'low', description: 'Analyze the poem "The Road Not Taken"' },
  { id: 6, title: 'Integration Quiz', course: 'Advanced Mathematics', dueDate: 'Feb 12, 2026', status: 'overdue', priority: 'high', description: 'Online quiz on integration techniques' },
];

export default function AssignmentsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'overdue'>('all');

  const filteredAssignments = filter === 'all' ? MOCK_ASSIGNMENTS : MOCK_ASSIGNMENTS.filter(a => a.status === filter);

  const statusConfig = {
    pending: { bg: '#FEF3C7', text: '#D97706', icon: 'time' as const, label: 'Pending' },
    submitted: { bg: '#DBEAFE', text: '#2563EB', icon: 'paper-plane' as const, label: 'Submitted' },
    graded: { bg: '#D1FAE5', text: '#059669', icon: 'checkmark-circle' as const, label: 'Graded' },
    overdue: { bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle' as const, label: 'Overdue' },
  };

  const priorityConfig = {
    high: { color: '#EF4444', label: 'High' },
    medium: { color: '#F59E0B', label: 'Medium' },
    low: { color: '#10B981', label: 'Low' },
  };

  const pendingCount = MOCK_ASSIGNMENTS.filter(a => a.status === 'pending').length;
  const overdueCount = MOCK_ASSIGNMENTS.filter(a => a.status === 'overdue').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignments</Text>
        <Text style={styles.headerSubtitle}>{pendingCount} pending • {overdueCount} overdue</Text>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['all', 'pending', 'submitted', 'graded', 'overdue'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Assignments List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {filteredAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={56} color={Colors.text.placeholder} />
            <Text style={styles.emptyText}>No assignments found</Text>
          </View>
        ) : (
          filteredAssignments.map((assignment) => {
            const status = statusConfig[assignment.status];
            const priority = priorityConfig[assignment.priority];
            return (
              <TouchableOpacity
                key={assignment.id}
                style={styles.assignmentCard}
                activeOpacity={0.7}
                onPress={() => Alert.alert(assignment.title, `Course: ${assignment.course}\nDue: ${assignment.dueDate}\nPriority: ${priority.label}\n\n${assignment.description}${assignment.grade ? `\n\nGrade: ${assignment.grade}/${assignment.maxGrade}` : ''}`)}
              >
                {/* Priority indicator */}
                <View style={[styles.priorityStrip, { backgroundColor: priority.color }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                      <Text style={styles.assignmentCourse}>{assignment.course}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Ionicons name={status.icon} size={12} color={status.text} />
                      <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={14} color={Colors.text.secondary} />
                      <Text style={[styles.metaText, assignment.status === 'overdue' && { color: '#EF4444', fontWeight: '600' }]}>
                        {assignment.dueDate}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                      <Text style={styles.metaText}>{priority.label} Priority</Text>
                    </View>
                    {assignment.grade && (
                      <View style={styles.metaItem}>
                        <Ionicons name="ribbon" size={14} color="#10B981" />
                        <Text style={[styles.metaText, { color: '#10B981', fontWeight: '600' }]}>{assignment.grade}/{assignment.maxGrade}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerBg: {
    backgroundColor: '#F59E0B',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.large,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', marginTop: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: '#FFFFFF' },
  filterText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  filterTextActive: { color: '#D97706' },
  list: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  assignmentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  priorityStrip: { width: 5 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  assignmentTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  assignmentCourse: { fontSize: 13, color: Colors.text.secondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: 11, fontWeight: '700', marginLeft: 4, letterSpacing: 0.3 },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.text.secondary },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl * 2 },
  emptyText: { fontSize: 16, fontWeight: '500', color: Colors.text.secondary, marginTop: Spacing.md },
});
