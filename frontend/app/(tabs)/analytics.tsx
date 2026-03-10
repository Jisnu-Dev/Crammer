import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

const { width } = Dimensions.get('window');

interface StatItem {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const overviewStats: StatItem[] = [
  { label: 'Total Users', value: '1,245', change: '+12%', trend: 'up', icon: 'people', color: '#2563EB' },
  { label: 'Active Sessions', value: '38', change: '+5', trend: 'up', icon: 'videocam', color: '#10B981' },
  { label: 'Files Uploaded', value: '3,892', change: '+248', trend: 'up', icon: 'document', color: '#F59E0B' },
  { label: 'Avg. Rating', value: '4.7', change: '+0.2', trend: 'up', icon: 'star', color: '#8B5CF6' },
];

interface ChartBar {
  label: string;
  value: number;
  color: string;
}

const weeklyActivity: ChartBar[] = [
  { label: 'Mon', value: 85, color: '#2563EB' },
  { label: 'Tue', value: 65, color: '#3B82F6' },
  { label: 'Wed', value: 92, color: '#2563EB' },
  { label: 'Thu', value: 78, color: '#3B82F6' },
  { label: 'Fri', value: 55, color: '#2563EB' },
  { label: 'Sat', value: 30, color: '#93C5FD' },
  { label: 'Sun', value: 20, color: '#93C5FD' },
];

const topCourses = [
  { name: 'Advanced Mathematics', students: 312, completion: 78, color: '#2563EB' },
  { name: 'Data Structures', students: 287, completion: 65, color: '#10B981' },
  { name: 'Physics Fundamentals', students: 203, completion: 82, color: '#8B5CF6' },
  { name: 'Organic Chemistry', students: 156, completion: 71, color: '#F59E0B' },
  { name: 'English Literature', students: 89, completion: 90, color: '#EF4444' },
];

const recentSignups = [
  { name: 'Arjun M.', role: 'Student', time: '2 min ago' },
  { name: 'Priya S.', role: 'Student', time: '15 min ago' },
  { name: 'Rahul K.', role: 'Mentor', time: '1 hour ago' },
  { name: 'Sneha D.', role: 'Student', time: '2 hours ago' },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const maxBarValue = Math.max(...weeklyActivity.map(b => b.value));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Platform performance overview</Text>

        <View style={styles.periodRow}>
          {(['week', 'month', 'year'] as const).map(p => (
            <TouchableOpacity key={p} style={[styles.periodChip, selectedPeriod === p && styles.periodChipActive]} onPress={() => setSelectedPeriod(p)}>
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {overviewStats.map((stat, i) => (
            <View key={i} style={styles.statBox}>
              <View style={[styles.statIconBox, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.changeBadge}>
                <Ionicons name={stat.trend === 'up' ? 'trending-up' : 'trending-down'} size={12} color={stat.trend === 'up' ? '#10B981' : '#EF4444'} />
                <Text style={[styles.changeText, { color: stat.trend === 'up' ? '#10B981' : '#EF4444' }]}>{stat.change}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Activity</Text>
          <Text style={styles.chartSubtitle}>User engagement over the week</Text>
          <View style={styles.barChart}>
            {weeklyActivity.map((bar, i) => (
              <View key={i} style={styles.barGroup}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${(bar.value / maxBarValue) * 100}%`, backgroundColor: bar.color }]} />
                </View>
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Courses */}
        <View style={styles.sectionCard}>
          <Text style={styles.chartTitle}>Top Courses</Text>
          <Text style={styles.chartSubtitle}>By enrollment count</Text>
          {topCourses.map((course, i) => (
            <View key={i} style={styles.courseRow}>
              <View style={[styles.rankBadge, { backgroundColor: `${course.color}15` }]}>
                <Text style={[styles.rankText, { color: course.color }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseName}>{course.name}</Text>
                <View style={styles.courseBar}>
                  <View style={[styles.courseBarFill, { width: `${course.completion}%`, backgroundColor: course.color }]} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.courseStudents}>{course.students}</Text>
                <Text style={styles.courseLabel}>students</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Signups */}
        <View style={styles.sectionCard}>
          <Text style={styles.chartTitle}>Recent Signups</Text>
          {recentSignups.map((signup, i) => (
            <View key={i} style={styles.signupRow}>
              <View style={styles.signupAvatar}>
                <Text style={styles.signupAvatarText}>{signup.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.signupName}>{signup.name}</Text>
                <Text style={styles.signupRole}>{signup.role}</Text>
              </View>
              <Text style={styles.signupTime}>{signup.time}</Text>
            </View>
          ))}
        </View>
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
    backgroundColor: '#8B5CF6',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.large,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  periodRow: { flexDirection: 'row', gap: Spacing.sm },
  periodChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.2)' },
  periodChipActive: { backgroundColor: '#FFFFFF' },
  periodText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  periodTextActive: { color: '#8B5CF6' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.sm },
  statBox: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.small,
  },
  statIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.text.primary },
  statLabel: { fontSize: 13, color: Colors.text.secondary, marginBottom: 4 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeText: { fontSize: 12, fontWeight: '600' },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.medium,
  },
  chartTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  chartSubtitle: { fontSize: 13, color: Colors.text.secondary, marginBottom: Spacing.md },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, paddingTop: Spacing.md },
  barGroup: { alignItems: 'center', flex: 1 },
  barWrapper: { width: 24, height: 120, justifyContent: 'flex-end', borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  bar: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 11, color: Colors.text.secondary, marginTop: 6 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.medium,
  },
  courseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  rankBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '700' },
  courseName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, marginBottom: 4 },
  courseBar: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden', width: '100%' },
  courseBarFill: { height: '100%', borderRadius: 2 },
  courseStudents: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  courseLabel: { fontSize: 11, color: Colors.text.secondary },
  signupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  signupAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  signupAvatarText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  signupName: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  signupRole: { fontSize: 12, color: Colors.text.secondary },
  signupTime: { fontSize: 12, color: Colors.text.secondary },
});
