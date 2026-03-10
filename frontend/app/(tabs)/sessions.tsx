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
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

interface Session {
  id: number;
  title: string;
  subject: string;
  host: string;
  participants: number;
  maxParticipants: number;
  time: string;
  date: string;
  status: 'live' | 'upcoming' | 'completed';
  color: string;
}

const MOCK_SESSIONS: Session[] = [
  { id: 1, title: 'Calculus Study Group', subject: 'Mathematics', host: 'Dr. Sharma', participants: 8, maxParticipants: 15, time: '10:00 AM', date: 'Today', status: 'live', color: '#EF4444' },
  { id: 2, title: 'Physics Problem Solving', subject: 'Physics', host: 'Prof. Patel', participants: 5, maxParticipants: 12, time: '2:00 PM', date: 'Today', status: 'upcoming', color: '#2563EB' },
  { id: 3, title: 'Organic Chemistry Review', subject: 'Chemistry', host: 'Dr. Gupta', participants: 10, maxParticipants: 10, time: '4:30 PM', date: 'Today', status: 'upcoming', color: '#F59E0B' },
  { id: 4, title: 'Data Structures & Algorithms', subject: 'Computer Science', host: 'Prof. Kumar', participants: 12, maxParticipants: 20, time: '6:00 PM', date: 'Tomorrow', status: 'upcoming', color: '#10B981' },
  { id: 5, title: 'English Literature Discussion', subject: 'English', host: 'Dr. Singh', participants: 7, maxParticipants: 10, time: '9:00 AM', date: 'Yesterday', status: 'completed', color: '#8B5CF6' },
];

export default function StudySessionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');

  const filteredSessions = filter === 'all' ? MOCK_SESSIONS : MOCK_SESSIONS.filter(s => s.status === filter);

  const getStatusBadge = (status: Session['status']) => {
    const config = {
      live: { bg: '#FEE2E2', text: '#EF4444', label: 'LIVE', icon: 'radio' as const },
      upcoming: { bg: '#DBEAFE', text: '#2563EB', label: 'UPCOMING', icon: 'time' as const },
      completed: { bg: '#D1FAE5', text: '#10B981', label: 'DONE', icon: 'checkmark-circle' as const },
    };
    return config[status];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBg}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Sessions</Text>
        <Text style={styles.headerSubtitle}>Join live sessions or browse upcoming ones</Text>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['all', 'live', 'upcoming', 'completed'] as const).map((f) => (
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

      {/* Sessions List */}
      <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {filteredSessions.map((session) => {
          const badge = getStatusBadge(session.status);
          return (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              activeOpacity={0.7}
              onPress={() => Alert.alert(session.title, `Join this ${session.subject} session hosted by ${session.host}?\n\nParticipants: ${session.participants}/${session.maxParticipants}`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Join', onPress: () => Alert.alert('Joined!', 'You have joined the session') }])}
            >
              {/* Left accent */}
              <View style={[styles.cardAccent, { backgroundColor: session.color }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionSubject}>{session.subject}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Ionicons name={badge.icon} size={12} color={badge.text} />
                    <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person" size={14} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{session.host}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people" size={14} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{session.participants}/{session.maxParticipants}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={14} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{session.date}, {session.time}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${(session.participants / session.maxParticipants) * 100}%`, backgroundColor: session.color }]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FAB */}
      {user?.role === 'mentor' && (
        <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Create Session', 'Session creation will be available soon!')}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
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
    backgroundColor: '#2563EB',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.large,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', marginTop: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: { backgroundColor: '#FFFFFF' },
  filterText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  filterTextActive: { color: '#2563EB' },
  sessionsList: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  sessionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  sessionSubject: { fontSize: 13, color: Colors.text.secondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: 11, fontWeight: '700', marginLeft: 4, letterSpacing: 0.3 },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.text.secondary },
  progressBg: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
});
