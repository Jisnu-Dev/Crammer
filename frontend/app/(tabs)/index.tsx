import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUser, clearAuth, User } from '../../utils/auth';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { CustomButton } from '../../components/common/CustomButton';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/styles/theme';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUserData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    const userData = await getUser();
    if (userData) {
      setUser(userData);
    } else {
      // No user data, redirect to login
      router.replace('/(auth)/login');
    }
  };

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
            await clearAuth();
            router.replace('/(auth)/login');
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
          title="Study Hours"
          value="24"
          icon="time"
          iconColor={Colors.primary}
          trend="up"
          trendValue="+12%"
          style={styles.statCard}
        />
        <StatCard
          title="Courses"
          value="5"
          icon="book"
          iconColor={Colors.success}
          trend="up"
          trendValue="+2"
          style={styles.statCard}
        />
      </View>

      <View style={[styles.statsContainer, { marginTop: Spacing.sm }]}>
        <StatCard
          title="Assignments"
          value="8"
          icon="document-text"
          iconColor={Colors.warning}
          trend="neutral"
          trendValue="2 due"
          style={styles.statCard}
        />
        <StatCard
          title="Progress"
          value="78%"
          icon="trending-up"
          iconColor={Colors.info}
          trend="up"
          trendValue="+5%"
          style={styles.statCard}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Card
          title="Study Sessions"
          description="Start or join a study session"
          icon="people"
          iconColor={Colors.primary}
          onPress={() => handleFeaturePress('Study Sessions')}
        />
        
        <Card
          title="My Courses"
          description="View and manage your courses"
          icon="book"
          iconColor={Colors.success}
          onPress={() => handleFeaturePress('My Courses')}
        />
        
        <Card
          title="Assignments"
          description="Check pending assignments"
          icon="clipboard"
          iconColor={Colors.warning}
          onPress={() => handleFeaturePress('Assignments')}
        />
        
        <Card
          title="Resources"
          description="Access study materials and notes"
          icon="folder"
          iconColor={Colors.info}
          onPress={() => handleFeaturePress('Resources')}
        />
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card
          title="No recent activity"
          description="Your recent study activities will appear here"
          icon="time"
          iconColor={Colors.text.secondary}
        />
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
});
