import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Dimensions, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { CustomButton } from '../../components/common/CustomButton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';
import { getAccessToken } from '../../utils/auth';

const { width } = Dimensions.get('window');

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') return 'http://10.123.11.99:8000/api/v1';
    return 'http://localhost:8000/api/v1';
  }
  return 'https://your-production-api.com/api/v1';
};
const API_BASE_URL = getBaseUrl();

interface DashboardStats {
  study_hours: number;
  total_plans: number;
  total_topics: number;
  completed_topics: number;
  topic_progress: number;
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  total_files: number;
  recent_activity: ActivityItem[];
}

interface ActivityItem {
  icon: string;
  color: string;
  title: string;
  description: string;
  time: string;
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('Dashboard stats error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [])
  );

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      { text: "Education is the passport to the future.", author: "Malcolm X" },
      { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
      { text: "Learning is not attained by chance, it must be sought for with ardor.", author: "Abigail Adams" },
      { text: "The capacity to learn is a gift; the ability to learn is a skill.", author: "Brian Herbert" },
      { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  };

  const quote = getMotivationalQuote();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleFeaturePress = (feature: string) => {
    const routeMap: Record<string, string> = {
      'Study Materials': '/(tabs)/files',
      'Resources': '/(tabs)/files',
      'Assignments': '/(tabs)/assignments',
      'Analytics': '/(tabs)/analytics',
      'Study Assistant': '/(tabs)/study',
      'Study Plans': '/(tabs)/study-plans',
      'Settings': '/(tabs)/settings',
    };
    const route = routeMap[feature];
    if (route) {
      router.push(route as any);
    } else {
      Alert.alert('Coming Soon', `${feature} feature will be available soon!`);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const userName = user.full_name.split(' ')[0];
  const s = stats;

  // Quick actions
  const quickActions = [
    { title: 'Assignments', description: 'Check pending assignments and submit work', icon: 'clipboard' as const, color: '#F59E0B', action: 'Assignments' },
    { title: 'Study Materials', description: 'Access notes, PDFs, and resources', icon: 'folder' as const, color: '#3B82F6', action: 'Study Materials' },
    { title: 'Study Assistant', description: 'Chat with AI to study smarter', icon: 'chatbubble-ellipses' as const, color: '#8B5CF6', action: 'Study Assistant' },
    { title: 'Study Plans', description: 'Follow structured plans for each subject', icon: 'map' as const, color: '#14B8A6', action: 'Study Plans' },
  ];

  const recentActivity = s?.recent_activity || [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardStats(); }} colors={['#2563EB']} />
        }
      >
        {/* Header */}
        <View style={styles.professionalHeader}>
          <Animated.View 
            style={[
              styles.headerContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.headerTop}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{userName}! 👋</Text>
                <View style={styles.roleBadge}>
                  <Ionicons name="school" size={14} color="#FFFFFF" />
                  <Text style={styles.roleText}>Student</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => router.push('/(tabs)/profile' as any)}
              >
                <View style={styles.profileIconContainer}>
                  <Ionicons name="person" size={24} color="#2563EB" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Quote */}
            <View style={styles.quoteCard}>
              <Ionicons name="bulb" size={20} color="#F59E0B" style={styles.quoteIcon} />
              <View style={styles.quoteContent}>
                <Text style={styles.quoteText}>"{quote.text}"</Text>
                <Text style={styles.quoteAuthor}>— {quote.author}</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Stats Grid */}
        <Animated.View 
          style={[styles.statsSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <EnhancedStatCard
                  title="Study Hours"
                  value={String(s?.study_hours ?? 0)}
                  icon="time"
                  iconColor="#FFFFFF"
                  trend="neutral"
                  trendValue={`${s?.total_plans ?? 0} plans`}
                  bgColor="#2563EB"
                />
                <EnhancedStatCard
                  title="Subjects"
                  value={String(s?.total_plans ?? 0)}
                  icon="book"
                  iconColor="#FFFFFF"
                  trend="up"
                  trendValue={`${s?.total_topics ?? 0} topics`}
                  bgColor="#10B981"
                />
              </View>
              <View style={styles.statsGrid}>
                <EnhancedStatCard
                  title="Assignments"
                  value={String(s?.total_assignments ?? 0)}
                  icon="document-text"
                  iconColor="#FFFFFF"
                  trend={s?.pending_assignments ? 'neutral' : 'up'}
                  trendValue={s?.pending_assignments ? `${s.pending_assignments} pending` : 'All done!'}
                  bgColor="#F59E0B"
                />
                <EnhancedStatCard
                  title="Progress"
                  value={`${s?.topic_progress ?? 0}%`}
                  icon="trending-up"
                  iconColor="#FFFFFF"
                  trend={(s?.topic_progress ?? 0) > 0 ? 'up' : 'neutral'}
                  trendValue={`${s?.completed_topics ?? 0}/${s?.total_topics ?? 0}`}
                  bgColor="#8B5CF6"
                />
              </View>

              {/* Files & Assignments mini row */}
              <View style={styles.miniStatsRow}>
                <TouchableOpacity style={styles.miniStat} onPress={() => handleFeaturePress('Study Materials')}>
                  <View style={[styles.miniStatDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.miniStatValue}>{s?.total_files ?? 0}</Text>
                  <Text style={styles.miniStatLabel}>Files Uploaded</Text>
                </TouchableOpacity>
                <View style={styles.miniStatDivider} />
                <TouchableOpacity style={styles.miniStat} onPress={() => handleFeaturePress('Assignments')}>
                  <View style={[styles.miniStatDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.miniStatValue}>{s?.completed_assignments ?? 0}</Text>
                  <Text style={styles.miniStatLabel}>Tasks Done</Text>
                </TouchableOpacity>
                <View style={styles.miniStatDivider} />
                <TouchableOpacity style={styles.miniStat} onPress={() => handleFeaturePress('Study Plans')}>
                  <View style={[styles.miniStatDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={styles.miniStatValue}>{s?.completed_topics ?? 0}</Text>
                  <Text style={styles.miniStatLabel}>Topics Done</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={() => handleFeaturePress(action.action)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionContent, { borderLeftColor: action.color }]}>
                  <View style={[styles.quickActionIconContainer, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.quickActionTextContainer}>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionDescription}>{action.description}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={action.color} style={styles.quickActionArrow} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          {recentActivity.length > 0 ? (
            <View style={styles.activityContainer}>
              {recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityCard}>
                  <View style={[styles.activityIconWrapper, { backgroundColor: `${activity.color}15` }]}>
                    <Ionicons name={activity.icon as any} size={22} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription} numberOfLines={1}>{activity.description}</Text>
                    <View style={styles.activityTimeContainer}>
                      <Ionicons name="time-outline" size={12} color={Colors.text.secondary} />
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                  </View>
                  <View style={[styles.activityDot, { backgroundColor: activity.color }]} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="calendar-outline" size={48} color={Colors.text.placeholder} />
              <Text style={styles.emptyActivityText}>No recent activity</Text>
              <Text style={styles.emptyActivitySubtext}>Create a study plan to get started!</Text>
            </View>
          )}
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            variant="outline"
          />
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

// Enhanced Stat Card Component
interface EnhancedStatCardProps {
  title: string;
  value: string;
  icon: any;
  iconColor: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  bgColor: string;
}

const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  trend,
  trendValue,
  bgColor,
}) => {
  return (
    <View style={styles.enhancedStatCard}>
      <View style={[styles.enhancedStatContent, { backgroundColor: bgColor }]}>
        <View style={styles.enhancedStatHeader}>
          <View style={styles.enhancedStatIconContainer}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <View style={styles.trendBadge}>
            <Ionicons 
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'} 
              size={12} 
              color="#FFFFFF" 
            />
            <Text style={styles.trendText}>{trendValue}</Text>
          </View>
        </View>
        <Text style={styles.enhancedStatValue}>{value}</Text>
        <Text style={styles.enhancedStatTitle}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  
  // Professional Header Styles
  professionalHeader: {
    backgroundColor: '#2563EB',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl + Spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Shadows.large,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.md,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium as any,
  },
  userName: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold as any,
    color: '#FFFFFF',
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as any,
    color: '#FFFFFF',
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileButton: {
    marginLeft: Spacing.md,
  },
  profileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  
  // Quote Card Styles
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  quoteIcon: {
    marginRight: Spacing.md,
    marginTop: Spacing.xs,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  quoteAuthor: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.semibold as any,
  },
  
  // Enhanced Stats Styles
  statsSection: {
    marginTop: -Spacing.xl - Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  enhancedStatCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  enhancedStatContent: {
    padding: Spacing.md,
    minHeight: 120,
  },
  enhancedStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  enhancedStatIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  trendText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as any,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  enhancedStatValue: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold as any,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  enhancedStatTitle: {
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: Typography.fontWeight.medium as any,
  },
  
  // Mini Stats Row
  miniStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  miniStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },

  // Section Styles
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  sectionDivider: {
    width: 40,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  
  // Quick Actions Styles
  quickActionsGrid: {
    gap: Spacing.md,
  },
  quickActionCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  quickActionContent: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadows.small,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  quickActionDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  quickActionArrow: {
    marginLeft: 'auto',
  },
  
  // Activity Styles
  activityContainer: {
    gap: Spacing.sm,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  activityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginLeft: Spacing.sm,
  },
  
  // Empty State
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyActivityText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyActivitySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.placeholder,
    marginTop: Spacing.xs,
  },
  
  // Footer Styles
  logoutContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    height: Spacing.xl,
  },
  
  // Legacy styles (keep for backward compatibility)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
});
