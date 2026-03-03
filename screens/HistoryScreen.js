import { StatusBar } from 'expo-status-bar';
import { Clock, Flame, Footprints, MapPin, MoreVertical } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';

function HistoryScreen() {
  const { trackingHistory } = useApp();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const groupByDate = (history) => {
    const grouped = {};
    history.forEach((item) => {
      const dateKey = new Date(item.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    return grouped;
  };

  const groupedHistory = groupByDate(trackingHistory);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color="#8140F3" />
          </View>
          <Text style={styles.headerTitle}>History</Text>
          <Pressable style={styles.menuButton}>
            <MoreVertical size={20} color="#000000" />
          </Pressable>
        </View>

        {/* History List */}
        {Object.keys(groupedHistory).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tracking history yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your activities to see them here
            </Text>
          </View>
        ) : (
          Object.entries(groupedHistory).map(([dateKey, items]) => (
            <View key={dateKey} style={styles.dateSection}>
              <Text style={styles.dateHeader}>
                {formatDate(items[0].date)}
              </Text>
              {items.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                      <Footprints size={28} color="#2196F3" strokeWidth={2} />
                      <Text style={styles.historyValue}>
                        {item.steps.toLocaleString()}
                      </Text>
                      <Text style={styles.historyLabel}>steps</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Clock size={28} color="#FF9800" strokeWidth={2} />
                      <Text style={styles.historyValue}>
                        {Math.floor(item.time / 60)}h {item.time % 60}m
                      </Text>
                      <Text style={styles.historyLabel}>time</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Flame size={28} color="#F44336" strokeWidth={2} />
                      <Text style={styles.historyValue}>{item.calories}</Text>
                      <Text style={styles.historyLabel}>kcal</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <MapPin size={28} color="#4CAF50" strokeWidth={2} />
                      <Text style={styles.historyValue}>
                        {item.distance.toFixed(2)}
                      </Text>
                      <Text style={styles.historyLabel}>km</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '500',
  },
  dateSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  historyStat: {
    alignItems: 'center',
    flex: 1,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  historyLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
});

export default React.memo(HistoryScreen);
