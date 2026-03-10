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

interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  rating: number;
  enrolled: number;
}

const MOCK_COURSES: Course[] = [
  { id: 1, title: 'Advanced Mathematics', instructor: 'Dr. Sharma', progress: 75, totalLessons: 24, completedLessons: 18, category: 'Mathematics', color: '#2563EB', icon: 'calculator', rating: 4.8, enrolled: 156 },
  { id: 2, title: 'Physics Fundamentals', instructor: 'Prof. Patel', progress: 45, totalLessons: 20, completedLessons: 9, category: 'Physics', color: '#8B5CF6', icon: 'planet', rating: 4.6, enrolled: 203 },
  { id: 3, title: 'Organic Chemistry', instructor: 'Dr. Gupta', progress: 90, totalLessons: 18, completedLessons: 16, category: 'Chemistry', color: '#F59E0B', icon: 'flask', rating: 4.9, enrolled: 89 },
  { id: 4, title: 'Data Structures', instructor: 'Prof. Kumar', progress: 30, totalLessons: 30, completedLessons: 9, category: 'Computer Science', color: '#10B981', icon: 'code-slash', rating: 4.7, enrolled: 312 },
  { id: 5, title: 'English Literature', instructor: 'Dr. Singh', progress: 60, totalLessons: 16, completedLessons: 10, category: 'English', color: '#EF4444', icon: 'book', rating: 4.5, enrolled: 67 },
];

export default function CoursesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'enrolled' | 'explore'>('enrolled');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Courses</Text>
        <Text style={styles.headerSubtitle}>Track your learning progress</Text>

        {/* Toggle */}
        <View style={styles.toggleRow}>
          {(['enrolled', 'explore'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.toggleBtn, filter === f && styles.toggleBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.toggleText, filter === f && styles.toggleTextActive]}>
                {f === 'enrolled' ? 'My Courses' : 'Explore'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Course overview stats */}
      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Ionicons name="book" size={20} color="#2563EB" />
          <Text style={styles.overviewValue}>{MOCK_COURSES.length}</Text>
          <Text style={styles.overviewLabel}>Enrolled</Text>
        </View>
        <View style={styles.overviewCard}>
          <Ionicons name="checkmark-done" size={20} color="#10B981" />
          <Text style={styles.overviewValue}>1</Text>
          <Text style={styles.overviewLabel}>Completed</Text>
        </View>
        <View style={styles.overviewCard}>
          <Ionicons name="trending-up" size={20} color="#F59E0B" />
          <Text style={styles.overviewValue}>60%</Text>
          <Text style={styles.overviewLabel}>Avg Progress</Text>
        </View>
      </View>

      {/* Courses List */}
      <ScrollView style={styles.coursesList} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {MOCK_COURSES.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseCard}
            activeOpacity={0.7}
            onPress={() => Alert.alert(course.title, `Instructor: ${course.instructor}\nProgress: ${course.progress}%\nLessons: ${course.completedLessons}/${course.totalLessons}\nRating: ${course.rating}/5`)}
          >
            <View style={styles.courseCardInner}>
              {/* Icon */}
              <View style={[styles.courseIcon, { backgroundColor: course.color }]}>
                <Ionicons name={course.icon} size={24} color="#FFFFFF" />
              </View>

              {/* Content */}
              <View style={styles.courseContent}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseInstructor}>{course.instructor}</Text>

                <View style={styles.courseMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="layers" size={12} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{course.completedLessons}/{course.totalLessons} lessons</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.metaText}>{course.rating}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressRow}>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${course.progress}%`, backgroundColor: course.color }]} />
                  </View>
                  <Text style={[styles.progressText, { color: course.color }]}>{course.progress}%</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#10B981',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.large,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.full, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#FFFFFF' },
  toggleText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  toggleTextActive: { color: '#10B981' },
  overviewRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  overviewValue: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginTop: 4 },
  overviewLabel: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },
  coursesList: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  courseCardInner: { flexDirection: 'row', padding: Spacing.md },
  courseIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  courseContent: { flex: 1 },
  courseTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  courseInstructor: { fontSize: 13, color: Colors.text.secondary, marginBottom: Spacing.sm },
  courseMeta: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.text.secondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBg: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'right' },
});
