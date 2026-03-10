import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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

interface StudyPlanItem {
  id: number;
  subject_name: string;
  subject_icon: string;
  subject_color: string;
  description: string | null;
  total_topics: number;
  total_hours: number;
  created_at: string;
}

export default function StudyPlansScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlans = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/study-plans/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching study plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const filteredPlans = plans.filter((p) =>
    p.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTopics = plans.reduce((a, p) => a + p.total_topics, 0);
  const totalHours = plans.reduce((a, p) => a + p.total_hours, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Plans</Text>
        <Text style={styles.headerSubtitle}>
          {plans.length > 0 ? 'Your AI-generated study plans' : 'Ask the Study Assistant to create a plan!'}
        </Text>

        {/* Search */}
        {plans.length > 0 && (
          <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
        )}
      </View>

      {/* Stats row */}
      {plans.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="library" size={20} color="#2563EB" />
            <Text style={styles.statValue}>{plans.length}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="layers" size={20} color="#10B981" />
            <Text style={styles.statValue}>{totalTopics}</Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{totalHours}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading study plans...</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.listArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {filteredPlans.length === 0 && plans.length > 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.text.placeholder} />
            <Text style={styles.emptyText}>No subjects found</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="map-outline" size={48} color="#2563EB" />
            </View>
            <Text style={styles.emptyTitle}>No Study Plans Yet</Text>
            <Text style={styles.emptyText}>
              Go to the Study Assistant and ask{'\n'}"Create a study plan for [subject]"
            </Text>
            <TouchableOpacity
              style={styles.goToAssistantBtn}
              onPress={() => router.push('/(tabs)/study' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
              <Text style={styles.goToAssistantText}>Open Study Assistant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.subjectCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/study-plan-detail',
                  params: {
                    planId: plan.id.toString(),
                    subjectName: plan.subject_name,
                    subjectColor: plan.subject_color,
                    subjectIcon: plan.subject_icon,
                  },
                } as any)
              }
            >
              <View style={styles.subjectCardInner}>
                <View style={[styles.subjectIcon, { backgroundColor: plan.subject_color }]}>
                  <Ionicons name={plan.subject_icon as any} size={26} color="#FFFFFF" />
                </View>
                <View style={styles.subjectContent}>
                  <Text style={styles.subjectName}>{plan.subject_name}</Text>
                  <Text style={styles.subjectDesc} numberOfLines={1}>
                    {plan.description || `Study plan for ${plan.subject_name}`}
                  </Text>
                  <View style={styles.subjectMeta}>
                    <View style={styles.metaChip}>
                      <Ionicons name="layers-outline" size={12} color={plan.subject_color} />
                      <Text style={[styles.metaChipText, { color: plan.subject_color }]}>
                        {plan.total_topics} topics
                      </Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={12} color={Colors.text.secondary} />
                      <Text style={styles.metaChipText}>{plan.total_hours}h</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.placeholder} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBg: {
    backgroundColor: '#2563EB',
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
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginTop: 4 },
  statLabel: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },
  listArea: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, color: Colors.text.secondary, fontSize: 14 },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  subjectCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  subjectIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  subjectContent: { flex: 1 },
  subjectName: { fontSize: 17, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  subjectDesc: { fontSize: 13, color: Colors.text.secondary, marginBottom: Spacing.sm },
  subjectMeta: { flexDirection: 'row', gap: Spacing.sm },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  metaChipText: { fontSize: 11, fontWeight: '600', color: Colors.text.secondary },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.sm },
  emptyText: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22, marginTop: Spacing.sm },
  goToAssistantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  goToAssistantText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
