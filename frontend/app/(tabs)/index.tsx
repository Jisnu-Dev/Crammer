import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { CustomButton } from '../../components/common/CustomButton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/styles/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Entrance animations
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
      'Study Sessions': '/(tabs)/sessions',
      'Schedule Session': '/(tabs)/sessions',
      'My Courses': '/(tabs)/courses',
      'Course Catalog': '/(tabs)/courses',
      'Assignments': '/(tabs)/assignments',
      'Feedback': '/(tabs)/assignments',
      'Analytics': '/(tabs)/analytics',
      'Study Assistant': '/(tabs)/study',
      'Study Plans': '/(tabs)/study-plans',
      'My Students': '/(tabs)/sessions',
      'User Management': '/(tabs)/profile',
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
        <Text style={styles.greeting}>Loading...</Text>
      </View>
    );
  }

  const userName = user.full_name.split(' ')[0];
  const userRole = user.role;

  // Role-specific stats
  const getRoleStats = () => {
    switch (userRole) {
      case 'student':
        return {
          stat1: { title: 'Study Hours', value: '24', icon: 'time' as const, color: Colors.primary, trend: 'up' as const, trendValue: '+12%' },
          stat2: { title: 'Courses', value: '5', icon: 'book' as const, color: Colors.success, trend: 'up' as const, trendValue: '+2' },
          stat3: { title: 'Assignments', value: '8', icon: 'document-text' as const, color: Colors.warning, trend: 'neutral' as const, trendValue: '2 due' },
          stat4: { title: 'Progress', value: '78%', icon: 'trending-up' as const, color: Colors.info, trend: 'up' as const, trendValue: '+5%' },
        };
      case 'mentor':
        return {
          stat1: { title: 'Students', value: '32', icon: 'people' as const, color: Colors.primary, trend: 'up' as const, trendValue: '+5' },
          stat2: { title: 'Sessions', value: '18', icon: 'calendar' as const, color: Colors.success, trend: 'up' as const, trendValue: '+3' },
          stat3: { title: 'Reviews', value: '4.8', icon: 'star' as const, color: Colors.warning, trend: 'up' as const, trendValue: '+0.2' },
          stat4: { title: 'Hours', value: '45', icon: 'time' as const, color: Colors.info, trend: 'up' as const, trendValue: '+8h' },
        };
      case 'admin':
        return {
          stat1: { title: 'Total Users', value: '245', icon: 'people' as const, color: Colors.primary, trend: 'up' as const, trendValue: '+15' },
          stat2: { title: 'Active Courses', value: '24', icon: 'book' as const, color: Colors.success, trend: 'neutral' as const, trendValue: 'Stable' },
          stat3: { title: 'Sessions', value: '156', icon: 'calendar' as const, color: Colors.warning, trend: 'up' as const, trendValue: '+12' },
          stat4: { title: 'Revenue', value: '$12k', icon: 'cash' as const, color: Colors.info, trend: 'up' as const, trendValue: '+8%' },
        };
      default:
        return {
          stat1: { title: 'Activity', value: '0', icon: 'pulse' as const, color: Colors.primary, trend: 'neutral' as const, trendValue: '-' },
          stat2: { title: 'Tasks', value: '0', icon: 'checkbox' as const, color: Colors.success, trend: 'neutral' as const, trendValue: '-' },
          stat3: { title: 'Progress', value: '0%', icon: 'trending-up' as const, color: Colors.warning, trend: 'neutral' as const, trendValue: '-' },
          stat4: { title: 'Points', value: '0', icon: 'trophy' as const, color: Colors.info, trend: 'neutral' as const, trendValue: '-' },
        };
    }
  };

  // Role-specific quick actions
  const getRoleQuickActions = () => {
    switch (userRole) {
      case 'student':
        return [
          { title: 'Join Study Session', description: 'Connect with peers and mentors', icon: 'people' as const, color: Colors.primary, action: 'Study Sessions' },
          { title: 'My Courses', description: 'View and manage your enrolled courses', icon: 'book' as const, color: Colors.success, action: 'My Courses' },
          { title: 'Assignments', description: 'Check pending assignments and submit work', icon: 'clipboard' as const, color: Colors.warning, action: 'Assignments' },
          { title: 'Study Materials', description: 'Access notes, videos, and resources', icon: 'folder' as const, color: Colors.info, action: 'Study Materials' },
          { title: 'Study Assistant', description: 'Chat with AI to study smarter', icon: 'chatbubble-ellipses' as const, color: '#8B5CF6', action: 'Study Assistant' },
          { title: 'Study Plans', description: 'Follow structured plans for each subject', icon: 'map' as const, color: '#14B8A6', action: 'Study Plans' },
        ];
      case 'mentor':
        return [
          { title: 'Schedule Session', description: 'Create a new mentoring session', icon: 'calendar' as const, color: Colors.primary, action: 'Schedule Session' },
          { title: 'My Students', description: 'View and manage your mentees', icon: 'people' as const, color: Colors.success, action: 'My Students' },
          { title: 'Feedback', description: 'Review student submissions', icon: 'chatbubbles' as const, color: Colors.warning, action: 'Feedback' },
          { title: 'Resources', description: 'Upload study materials for students', icon: 'cloud-upload' as const, color: Colors.info, action: 'Resources' },
        ];
      case 'admin':
        return [
          { title: 'User Management', description: 'Manage students, mentors, and admins', icon: 'people-circle' as const, color: Colors.primary, action: 'User Management' },
          { title: 'Course Catalog', description: 'Create and manage courses', icon: 'library' as const, color: Colors.success, action: 'Course Catalog' },
          { title: 'Analytics', description: 'View platform statistics and reports', icon: 'stats-chart' as const, color: Colors.warning, action: 'Analytics' },
          { title: 'Settings', description: 'Configure platform settings', icon: 'settings' as const, color: Colors.info, action: 'Settings' },
        ];
      default:
        return [];
    }
  };

  // Recent activity data based on role
  const getRecentActivity = () => {
    switch (userRole) {
      case 'student':
        return [
          { icon: 'checkmark-circle' as const, color: Colors.success, title: 'Completed Assignment', description: 'Mathematics - Chapter 5 Quiz', time: '2 hours ago' },
          { icon: 'book' as const, color: Colors.info, title: 'Enrolled in Course', description: 'Advanced Physics', time: '1 day ago' },
          { icon: 'people' as const, color: Colors.primary, title: 'Joined Study Group', description: 'Chemistry Study Session', time: '2 days ago' },
        ];
      case 'mentor':
        return [
          { icon: 'chatbubbles' as const, color: Colors.success, title: 'Provided Feedback', description: 'Reviewed 5 student submissions', time: '1 hour ago' },
          { icon: 'calendar' as const, color: Colors.info, title: 'Session Completed', description: 'Biology Study Group', time: '3 hours ago' },
          { icon: 'star' as const, color: Colors.warning, title: 'Received Review', description: '5-star rating from student', time: '1 day ago' },
        ];
      case 'admin':
        return [
          { icon: 'person-add' as const, color: Colors.success, title: 'New User Registered', description: '3 new students joined today', time: '30 mins ago' },
          { icon: 'book' as const, color: Colors.info, title: 'Course Updated', description: 'Advanced Mathematics syllabus', time: '2 hours ago' },
          { icon: 'trending-up' as const, color: Colors.primary, title: 'Platform Growth', description: '+15% user engagement this week', time: '1 day ago' },
        ];
      default:
        return [];
    }
  };

  const roleStats = getRoleStats();
  const quickActions = getRoleQuickActions();
  const recentActivity = getRecentActivity();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Professional Header with Blue Background */}
        <View style={styles.professionalHeader}>
          <Animated.View 
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Header Top */}
            <View style={styles.headerTop}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{userName}! 👋</Text>
                
                {/* Role Badge */}
                <View style={styles.roleBadge}>
                  <Ionicons 
                    name={userRole === 'student' ? 'school' : userRole === 'mentor' ? 'people' : 'shield-checkmark'} 
                    size={14} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.roleText}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
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

            {/* Motivational Quote Card */}
            <View style={styles.quoteCard}>
              <Ionicons name="bulb" size={20} color="#F59E0B" style={styles.quoteIcon} />
              <View style={styles.quoteContent}>
                <Text style={styles.quoteText}>"{quote.text}"</Text>
                <Text style={styles.quoteAuthor}>— {quote.author}</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Stats Overview - Enhanced Design */}
        <Animated.View 
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.statsGrid}>
            <EnhancedStatCard
              title={roleStats.stat1.title}
              value={roleStats.stat1.value}
              icon={roleStats.stat1.icon}
              iconColor="#FFFFFF"
              trend={roleStats.stat1.trend}
              trendValue={roleStats.stat1.trendValue}
              bgColor="#2563EB"
            />
            <EnhancedStatCard
              title={roleStats.stat2.title}
              value={roleStats.stat2.value}
              icon={roleStats.stat2.icon}
              iconColor="#FFFFFF"
              trend={roleStats.stat2.trend}
              trendValue={roleStats.stat2.trendValue}
              bgColor="#10B981"
            />
          </View>

          <View style={styles.statsGrid}>
            <EnhancedStatCard
              title={roleStats.stat3.title}
              value={roleStats.stat3.value}
              icon={roleStats.stat3.icon}
              iconColor="#FFFFFF"
              trend={roleStats.stat3.trend}
              trendValue={roleStats.stat3.trendValue}
              bgColor="#F59E0B"
            />
            <EnhancedStatCard
              title={roleStats.stat4.title}
              value={roleStats.stat4.value}
              icon={roleStats.stat4.icon}
              iconColor="#FFFFFF"
              trend={roleStats.stat4.trend}
              trendValue={roleStats.stat4.trendValue}
              bgColor="#8B5CF6"
            />
          </View>
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
                    <Ionicons name={activity.icon} size={22} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <View style={styles.activityTimeContainer}>
                      <Ionicons name="time-outline" size={12} color={Colors.text.secondary} />
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                  </View>
                  <View style={styles.activityDot} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="calendar-outline" size={48} color={Colors.text.placeholder} />
              <Text style={styles.emptyActivityText}>No recent activity</Text>
              <Text style={styles.emptyActivitySubtext}>Your activities will appear here</Text>
            </View>
          )}
        </View>

        {/* Logout Button */}
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
