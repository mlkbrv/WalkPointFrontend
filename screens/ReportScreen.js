import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Clock, Flame, Footprints, MapPin, MoreVertical } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

function ReportScreen() {
  const { totalStats, trackingHistory, weeklyProgress } = useApp();
  const navigation = useNavigation();
  const [selectedMetric, setSelectedMetric] = useState('Steps');

  // Calculate weekly stats for chart
  const weekData = weeklyProgress.length > 0 
    ? weeklyProgress 
    : Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        steps: Math.floor(Math.random() * 5000) + 2000,
      }));

  const getMetricValue = (day, metric) => {
    switch (metric) {
      case 'Steps':
        return day.steps || 0;
      case 'Time':
        return Math.floor((day.steps || 0) * 0.05);
      case 'Calorie':
        return Math.floor((day.steps || 0) * 0.04);
      case 'Distance':
        return Math.round(((day.steps || 0) * 0.0008) * 100) / 100;
      default:
        return day.steps || 0;
    }
  };

  // Normalize values for chart (max height 150)
  const allValues = weekData.map((day) => getMetricValue(day, selectedMetric));
  const maxValue = Math.max(...allValues, 1);
  const normalizedMax = selectedMetric === 'Steps' ? 7000 : 
                        selectedMetric === 'Time' ? 350 : 
                        selectedMetric === 'Calorie' ? 280 : 5.6;
  const chartMax = Math.max(maxValue, normalizedMax * 0.1);

  // Calendar data
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Calculate calendar day progress
  const getCalendarDayProgress = (dayNum) => {
    if (dayNum > today.getDate()) return 0;
    return Math.min(Math.random() * 100, 100); // Simulated progress
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color="#8140F3" />
          </View>
          <Text style={styles.headerTitle}>Report</Text>
          <Pressable style={styles.menuButton}>
            <MoreVertical size={20} color="#000000" />
          </Pressable>
        </View>

        {/* Total Steps */}
        <View style={styles.totalStepsContainer}>
          <Footprints size={48} color="#8140F3" strokeWidth={2} />
          <Text style={styles.totalStepsValue}>
            {totalStats.steps.toLocaleString()}
          </Text>
          <Text style={styles.totalStepsLabel}>Total steps all the time.</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Clock size={36} color="#FF9800" strokeWidth={2} />
            <Text style={styles.summaryValue}>
              {Math.floor(totalStats.time / 60)}h {totalStats.time % 60}m
            </Text>
            <Text style={styles.summaryLabel}>time</Text>
          </View>
          <View style={styles.summaryItem}>
            <Flame size={36} color="#F44336" strokeWidth={2} />
            <Text style={styles.summaryValue}>
              {totalStats.calories.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>kcal</Text>
          </View>
          <View style={styles.summaryItem}>
            <MapPin size={36} color="#4CAF50" strokeWidth={2} />
            <Text style={styles.summaryValue}>
              {totalStats.distance.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>km</Text>
          </View>
        </View>

        {/* Statistics Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Statistics</Text>
            <Pressable style={styles.weekSelector}>
              <Text style={styles.weekSelectorText}>This Week</Text>
              <Text style={styles.weekSelectorArrow}>▼</Text>
            </Pressable>
          </View>

          {/* Y-axis labels */}
          <View style={styles.chartWrapper}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>
                {selectedMetric === 'Steps' ? '7k' : 
                 selectedMetric === 'Time' ? '350' :
                 selectedMetric === 'Calorie' ? '280' : '5.6'}
              </Text>
              <Text style={styles.yAxisLabel}>
                {selectedMetric === 'Steps' ? '5k' : 
                 selectedMetric === 'Time' ? '250' :
                 selectedMetric === 'Calorie' ? '200' : '4'}
              </Text>
              <Text style={styles.yAxisLabel}>
                {selectedMetric === 'Steps' ? '3k' : 
                 selectedMetric === 'Time' ? '150' :
                 selectedMetric === 'Calorie' ? '120' : '2.4'}
              </Text>
              <Text style={styles.yAxisLabel}>
                {selectedMetric === 'Steps' ? '1k' : 
                 selectedMetric === 'Time' ? '50' :
                 selectedMetric === 'Calorie' ? '40' : '0.8'}
              </Text>
            </View>

            {/* Bar Chart */}
            <View style={styles.barChartContainer}>
              <View style={styles.barChart}>
                {weekData.map((day, index) => {
                  const value = getMetricValue(day, selectedMetric);
                  const height = Math.min((value / chartMax) * 150, 150);
                  const isHighlighted = index === weekData.length - 1;
                  return (
                    <View key={index} style={styles.barItem}>
                      <View style={styles.barWrapper}>
                        {isHighlighted && (
                          <Text style={styles.barValue}>
                            {value.toLocaleString()}
                          </Text>
                        )}
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(height, 5),
                              backgroundColor: isHighlighted ? '#8140F3' : '#E1BEE7',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>
                        {new Date().getDate() - 6 + index}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Metric Selector */}
          <View style={styles.metricSelector}>
            {['Steps', 'Time', 'Calorie', 'Distance'].map((metric) => (
              <Pressable
                key={metric}
                style={[
                  styles.metricButton,
                  selectedMetric === metric && styles.metricButtonActive,
                ]}
                onPress={() => setSelectedMetric(metric)}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    selectedMetric === metric && styles.metricButtonTextActive,
                  ]}
                >
                  {metric}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Calendar Progress */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Your Progress</Text>
            <Pressable style={styles.monthSelector}>
              <Text style={styles.monthSelectorText}>This Month</Text>
              <Text style={styles.monthSelectorArrow}>▼</Text>
            </Pressable>
          </View>

          {/* Calendar Grid with Circular Progress */}
          <View style={styles.calendarGrid}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.calendarDayHeader}>
                {day}
              </Text>
            ))}
            {/* Empty cells */}
            {Array.from({ length: firstDay }, (_, i) => (
              <View key={`empty-${i}`} style={styles.calendarDay} />
            ))}
            {/* Days with circular progress */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const isPast = dayNum <= today.getDate();
              const progress = isPast ? getCalendarDayProgress(dayNum) : 0;
              const radius = 15;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (progress / 100) * circumference;
              
              return (
                <View key={dayNum} style={styles.calendarDay}>
                  <View style={styles.calendarDayCircleWrapper}>
                    <Svg width={32} height={32} style={styles.calendarDaySvg}>
                      <Circle
                        cx={16}
                        cy={16}
                        r={radius}
                        stroke="#E8E8E8"
                        strokeWidth={2}
                        fill="none"
                      />
                      {progress > 0 && (
                        <Circle
                          cx={16}
                          cy={16}
                          r={radius}
                          stroke="#8140F3"
                          strokeWidth={2}
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          transform={`rotate(-90 16 16)`}
                        />
                      )}
                    </Svg>
                    <View style={styles.calendarDayInner}>
                      <Text
                        style={[
                          styles.calendarDayText,
                          !isPast && styles.calendarDayTextEmpty,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable
            style={styles.allHistoryButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.allHistoryButtonText}>All History</Text>
          </Pressable>
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
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalStepsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  totalStepsValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
  },
  totalStepsLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  chartSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
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
  chartWrapper: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 20,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  barChartContainer: {
    flex: 1,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 150,
    width: '100%',
  },
  bar: {
    width: '70%',
    minHeight: 5,
    borderRadius: 8,
    marginBottom: 5,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8140F3',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  metricButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  metricButtonActive: {
    backgroundColor: '#8140F3',
  },
  metricButtonText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  metricButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthSelectorText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  monthSelectorArrow: {
    fontSize: 10,
    color: '#666666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDayHeader: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    paddingVertical: 8,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  calendarDayCircleWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDaySvg: {
    position: 'absolute',
  },
  calendarDayInner: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 12,
    color: '#8140F3',
    fontWeight: '700',
  },
  calendarDayTextEmpty: {
    color: '#CCCCCC',
    fontWeight: '400',
  },
  allHistoryButton: {
    backgroundColor: '#8140F3',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#8140F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  allHistoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default React.memo(ReportScreen);
