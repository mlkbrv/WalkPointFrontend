import { StatusBar } from 'expo-status-bar';
import { Clock, Coins, Flame, Footprints, MapPin, MoreVertical } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { getStories, viewStory } from '../services/apiService';

const { width } = Dimensions.get('window');

function HomeScreen() {
  const {
    dailyStats,
    weeklyProgress,
    updateWeeklyProgress,
    walletBalance,
    refreshWallet,
    startStepTracking,
    syncStepsFromSystem,
    stepDataUnavailable,
  } = useApp();

  useFocusEffect(
    useCallback(() => {
      startStepTracking();
      syncStepsFromSystem();
    }, [startStepTracking, syncStepsFromSystem])
  );

  const [goal] = useState(16000);
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      const data = await getStories();
      setStories(Array.isArray(data) ? data : data.results || []);
    } catch {
      // offline
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    if (weeklyProgress.length === 0) {
      const today = new Date();
      const week = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        week.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.getDate(),
          steps: i === 0 ? dailyStats.steps : 0,
        });
      }
      updateWeeklyProgress(week);
    }
  }, []);

  const handleStoryPress = async (story) => {
    if (story.is_viewed) {
      Alert.alert('Already Viewed', 'You already earned coins for this story.');
      return;
    }
    try {
      const result = await viewStory(story.id);
      Alert.alert(
        'Coins Earned!',
        `You earned ${result.reward_earned} coins.\nNew balance: ${result.new_balance}`,
      );
      refreshWallet();
      fetchStories();
    } catch (e) {
      Alert.alert('Info', e.message);
    }
  };

  const progressPercentage = Math.min((dailyStats.steps / goal) * 100, 100);
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const currentDay = today.getDay();
  const adjustedDay = currentDay === 0 ? 6 : currentDay - 1;

  const getWeekDayProgress = (index) => {
    const dayData = weeklyProgress.find(
      (w) => w.date === new Date(today.getTime() - (adjustedDay - index) * 24 * 60 * 60 * 1000).getDate()
    );
    return dayData ? Math.min((dayData.steps / goal) * 100, 100) : 0;
  };

  const storyColors = ['#FFC107', '#00A859', '#FF0000', '#2196F3', '#9C27B0', '#FF5722'];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color="#8140F3" />
          </View>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.balanceBadge}>
            <Coins size={14} color="#8140F3" />
            <Text style={styles.balanceText}>{parseFloat(walletBalance).toFixed(0)}</Text>
          </View>
        </View>

        {/* Stories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContainer}
        >
          {storiesLoading ? (
            <ActivityIndicator color="#8140F3" style={{ marginLeft: 20 }} />
          ) : stories.length > 0 ? (
            stories.map((story, idx) => {
              const color = storyColors[idx % storyColors.length];
              const initials = (story.partner_name || 'S').substring(0, 2).toUpperCase();
              return (
                <Pressable
                  key={story.id}
                  style={styles.storyItem}
                  onPress={() => handleStoryPress(story)}
                >
                  <View
                    style={[
                      styles.storyCircle,
                      {
                        borderColor: story.is_viewed ? '#CCC' : color,
                        backgroundColor: story.is_viewed ? '#E0E0E0' : color,
                      },
                    ]}
                  >
                    <View style={styles.storyLogoContainer}>
                      <Text style={styles.storyInitials}>{initials}</Text>
                    </View>
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {story.partner_name || 'Partner'}
                  </Text>
                  {!story.is_viewed && (
                    <Text style={styles.storyReward}>+{story.reward_amount}</Text>
                  )}
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.noStories}>No stories available</Text>
          )}
        </ScrollView>

        {/* Step Counter */}
        <View style={styles.stepCounterContainer}>
          <View style={styles.circleWrapper}>
            <Svg width={240} height={240} style={styles.progressSvg}>
              <Circle
                cx={120}
                cy={120}
                r={100}
                stroke="#E8E8E8"
                strokeWidth={12}
                fill="none"
              />
              {Array.from({ length: 20 }, (_, i) => {
                const angle = (i * 360) / 20;
                const x1 = 120 + 90 * Math.cos((angle * Math.PI) / 180);
                const y1 = 120 + 90 * Math.sin((angle * Math.PI) / 180);
                const x2 = 120 + 100 * Math.cos((angle * Math.PI) / 180);
                const y2 = 120 + 100 * Math.sin((angle * Math.PI) / 180);
                return (
                  <Line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#D0D0D0"
                    strokeWidth={1.5}
                  />
                );
              })}
              <Circle
                cx={120}
                cy={120}
                r={100}
                stroke="#8140F3"
                strokeWidth={12}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 120 120)`}
              />
            </Svg>
            <View style={styles.innerCircle}>
              <Text style={styles.stepNumber}>{dailyStats.steps}</Text>
              <Text style={styles.stepLabel}>Steps</Text>
              <Text style={styles.goalText}>{goal.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Clock size={32} color="#FF9800" strokeWidth={2} />
            <Text style={styles.metricValue}>
              {Math.floor(dailyStats.time / 60)}h {dailyStats.time % 60}m
            </Text>
            <Text style={styles.metricLabel}>time</Text>
          </View>
          <View style={styles.metricItem}>
            <Flame size={32} color="#F44336" strokeWidth={2} />
            <Text style={styles.metricValue}>{dailyStats.calories}</Text>
            <Text style={styles.metricLabel}>kcal</Text>
          </View>
          <View style={styles.metricItem}>
            <MapPin size={32} color="#4CAF50" strokeWidth={2} />
            <Text style={styles.metricValue}>{dailyStats.distance.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>km</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Pressable style={styles.weekSelector}>
              <Text style={styles.weekSelectorText}>This Week</Text>
              <Text style={styles.weekSelectorArrow}>▼</Text>
            </Pressable>
          </View>
          <View style={styles.weekContainer}>
            {weekDays.map((day, index) => {
              const isToday = index === adjustedDay;
              const dayDate = new Date(today);
              dayDate.setDate(today.getDate() - adjustedDay + index);
              const dayProgress = getWeekDayProgress(index);
              const dayRadius = 15;
              const dayCircumference = 2 * Math.PI * dayRadius;
              const dayStrokeDashoffset = dayCircumference - (dayProgress / 100) * dayCircumference;

              return (
                <View key={index} style={styles.weekDay}>
                  <View style={styles.weekDayCircleWrapper}>
                    <Svg width={32} height={32} style={styles.weekDaySvg}>
                      <Circle
                        cx={16}
                        cy={16}
                        r={dayRadius}
                        stroke="#E8E8E8"
                        strokeWidth={2}
                        fill="none"
                      />
                      {dayProgress > 0 && (
                        <Circle
                          cx={16}
                          cy={16}
                          r={dayRadius}
                          stroke="#8140F3"
                          strokeWidth={2}
                          fill="none"
                          strokeDasharray={dayCircumference}
                          strokeDashoffset={dayStrokeDashoffset}
                          strokeLinecap="round"
                          transform={`rotate(-90 16 16)`}
                        />
                      )}
                    </Svg>
                    <View style={styles.weekDayInner}>
                      <Text
                        style={[
                          styles.weekDayText,
                          isToday && styles.weekDayTextToday,
                        ]}
                      >
                        {dayDate.getDate()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      isToday && styles.weekDayLabelToday,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8140F3',
  },
  storiesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
  },
  storyLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storyInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  storyName: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  storyReward: {
    fontSize: 10,
    color: '#8140F3',
    fontWeight: '700',
  },
  noStories: {
    color: '#999',
    fontSize: 14,
    paddingLeft: 4,
  },
  stepCounterContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  circleWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  progressSvg: {
    position: 'absolute',
  },
  innerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '400',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    paddingBottom: 40,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekSelectorText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  weekSelectorArrow: {
    fontSize: 10,
    color: '#666666',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
  },
  weekDayCircleWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  weekDaySvg: {
    position: 'absolute',
  },
  weekDayInner: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8140F3',
  },
  weekDayTextToday: {
    color: '#8140F3',
  },
  weekDayLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  weekDayLabelToday: {
    color: '#8140F3',
    fontWeight: '700',
  },
});

export default React.memo(HomeScreen);
