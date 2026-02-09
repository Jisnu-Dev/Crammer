import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { CustomButton } from '../../components/common/CustomButton';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/styles/theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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
    Alert.alert('Coming Soon', `${feature} feature will be available soon!`);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{userName}! 👋</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => Alert.alert('Profile', 'Profile page coming soon!')}
        >
          <Ionicons name="person-circle-outline" size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Role Badge */}
      <View style={styles.roleBadge}>
        <Ionicons 
          name={userRole === 'student' ? 'school' : userRole === 'mentor' ? 'people' : 'shield-checkmark'} 
          size={16} 
          color={Colors.primary} 
        />
        <Text style={styles.roleText}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <StatCard
          title={roleStats.stat1.title}
          value={roleStats.stat1.value}
          icon={roleStats.stat1.icon}
          iconColor={roleStats.stat1.color}
          trend={roleStats.stat1.trend}
          trendValue={roleStats.stat1.trendValue}
          style={styles.statCard}
        />
        <StatCard
          title={roleStats.stat2.title}
          value={roleStats.stat2.value}
          icon={roleStats.stat2.icon}
          iconColor={roleStats.stat2.color}
          trend={roleStats.stat2.trend}
          trendValue={roleStats.stat2.trendValue}
          style={styles.statCard}
        />
      </View>

      <View style={[styles.statsContainer, { marginTop: Spacing.sm }]}>
        <StatCard
          title={roleStats.stat3.title}
          value={roleStats.stat3.value}
          icon={roleStats.stat3.icon}
          iconColor={roleStats.stat3.color}
          trend={roleStats.stat3.trend}
          trendValue={roleStats.stat3.trendValue}
          style={styles.statCard}
        />
        <StatCard
          title={roleStats.stat4.title}
          value={roleStats.stat4.value}
          icon={roleStats.stat4.icon}
          iconColor={roleStats.stat4.color}
          trend={roleStats.stat4.trend}
          trendValue={roleStats.stat4.trendValue}
          style={styles.statCard}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {quickActions.map((action, index) => (
          <Card
            key={index}
            title={action.title}
            description={action.description}
            icon={action.icon}
            iconColor={action.color}
            onPress={() => handleFeaturePress(action.action)}
          />
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                <Ionicons name={activity.icon} size={20} color={activity.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))
        ) : (
          <Card
            title="No recent activity"
            description="Your recent activities will appear here"
            icon="time"
            iconColor={Colors.text.secondary}
          />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  logoutContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    height: Spacing.xl,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
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
    marginBottom: Spacing.xs,
  },
  activityDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  activityTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
});
