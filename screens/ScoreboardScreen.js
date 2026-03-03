import { StatusBar } from 'expo-status-bar';
import { Save, Share2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/apiService';

function ScoreboardScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animations] = useState({
    first: new Animated.Value(0),
    second: new Animated.Value(0),
    third: new Animated.Value(0),
  });

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboard();
      const entries = (Array.isArray(data) ? data : data.results || []).map((entry) => ({
        id: entry.user_id,
        name: [entry.first_name, entry.last_name].filter(Boolean).join(' ') || 'User',
        score: entry.total_steps || 0,
        avatar: '👤',
        isCurrentUser: user && entry.user_id === user.id,
      }));

      const hasCurrentUser = entries.some((e) => e.isCurrentUser);
      if (!hasCurrentUser && user) {
        entries.push({
          id: user.id,
          name: [user.first_name, user.last_name].filter(Boolean).join(' ') || 'You',
          score: 0,
          avatar: '👤',
          isCurrentUser: true,
        });
      }

      entries.sort((a, b) => b.score - a.score);
      setUsers(entries);

      const rank = entries.findIndex((u) => u.isCurrentUser) + 1;
      setCurrentUserRank(rank);

      Animated.parallel([
        Animated.timing(animations.first, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animations.second, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animations.third, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const topThree = users.slice(0, 3);
  const currentUser = users.find((u) => u.isCurrentUser);
  const isInTopThree = currentUserRank && currentUserRank <= 3;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8140F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton}>
            <X size={24} color="#000000" />
          </Pressable>
          <Text style={styles.headerTitle}>Weekly Scoreboard</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Top Three Podium */}
        <View style={styles.podiumContainer}>
          {topThree.length >= 2 && (
            <Animated.View
              style={[
                styles.podiumItem,
                styles.secondPlace,
                {
                  opacity: animations.second,
                  transform: [
                    {
                      translateY: animations.second.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.medalContainer}>
                <Text style={styles.medal}>🥈</Text>
                <Text style={styles.medalNumber}>2</Text>
              </View>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{topThree[1].avatar}</Text>
              </View>
              <Text style={[styles.podiumName, topThree[1].isCurrentUser && styles.currentUserHighlight]}>
                {topThree[1].isCurrentUser ? 'You' : topThree[1].name}
              </Text>
              <Text style={styles.podiumScore}>
                {topThree[1].score.toLocaleString()} Pt
              </Text>
            </Animated.View>
          )}

          {topThree.length >= 1 && (
            <Animated.View
              style={[
                styles.podiumItem,
                styles.firstPlace,
                {
                  opacity: animations.first,
                  transform: [
                    {
                      translateY: animations.first.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.medalContainer}>
                <Text style={styles.medal}>🥇</Text>
                <Text style={styles.medalNumber}>1</Text>
              </View>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{topThree[0].avatar}</Text>
              </View>
              <Text style={[styles.podiumName, topThree[0].isCurrentUser && styles.currentUserHighlight]}>
                {topThree[0].isCurrentUser ? 'You' : topThree[0].name}
              </Text>
              <Text style={styles.podiumScore}>
                {topThree[0].score.toLocaleString()} Pt
              </Text>
            </Animated.View>
          )}

          {topThree.length >= 3 && (
            <Animated.View
              style={[
                styles.podiumItem,
                styles.thirdPlace,
                {
                  opacity: animations.third,
                  transform: [
                    {
                      translateY: animations.third.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.medalContainer}>
                <Text style={styles.medal}>🥉</Text>
                <Text style={styles.medalNumber}>3</Text>
              </View>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{topThree[2].avatar}</Text>
              </View>
              <Text style={[styles.podiumName, topThree[2].isCurrentUser && styles.currentUserHighlight]}>
                {topThree[2].isCurrentUser ? 'You' : topThree[2].name}
              </Text>
              <Text style={styles.podiumScore}>
                {topThree[2].score.toLocaleString()} Pt
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Rest of the List */}
        {users.length > 3 && (
          <View style={styles.listContainer}>
            {users.slice(3).map((u, index) => (
              <View key={u.id} style={styles.listItem}>
                <Text style={styles.rankNumber}>{index + 4}</Text>
                <View style={styles.listAvatar}>
                  <Text style={styles.listAvatarText}>{u.avatar}</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text
                    style={[
                      styles.listName,
                      u.isCurrentUser && styles.currentUserName,
                    ]}
                  >
                    {u.isCurrentUser ? 'You' : u.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.listScore,
                    u.isCurrentUser && styles.currentUserScore,
                  ]}
                >
                  {u.score.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Current User Position */}
        {!isInTopThree && currentUser && (
          <View style={styles.currentUserContainer}>
            <View style={styles.currentUserDivider} />
            <View style={styles.currentUserInfo}>
              <Text style={styles.currentUserRankText}>
                You are #{currentUserRank}
              </Text>
              <View style={styles.currentUserNeighbors}>
                {currentUserRank > 1 && (
                  <Text style={styles.neighborText}>
                    Above: {users[currentUserRank - 2].name} (
                    {users[currentUserRank - 2].score.toLocaleString()})
                  </Text>
                )}
                {currentUserRank < users.length && (
                  <Text style={styles.neighborText}>
                    Below: {users[currentUserRank].name} (
                    {users[currentUserRank].score.toLocaleString()})
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.saveButton}>
            <Save size={20} color="#8140F3" strokeWidth={2} />
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
          <Pressable style={styles.shareButton}>
            <Share2 size={20} color="#8140F3" strokeWidth={2} />
            <Text style={styles.shareButtonText}>Share</Text>
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
    backgroundColor: '#F8F9FB',
  },
  backButton: {
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
  placeholder: {
    width: 30,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#E3F2FD',
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: {
    marginBottom: 0,
  },
  secondPlace: {
    marginBottom: 30,
  },
  thirdPlace: {
    marginBottom: 60,
  },
  medalContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  medal: {
    fontSize: 44,
  },
  medalNumber: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -8,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  avatarContainer: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#8140F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    fontSize: 42,
  },
  podiumName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  podiumScore: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  currentUserHighlight: {
    color: '#8140F3',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666666',
    width: 40,
  },
  listAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  listAvatarText: {
    fontSize: 26,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  currentUserName: {
    color: '#8140F3',
  },
  listScore: {
    fontSize: 17,
    color: '#666666',
    fontWeight: '500',
  },
  currentUserScore: {
    color: '#8140F3',
    fontWeight: '700',
  },
  currentUserContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  currentUserDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginBottom: 18,
  },
  currentUserInfo: {
    alignItems: 'center',
  },
  currentUserRankText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#8140F3',
    marginBottom: 12,
  },
  currentUserNeighbors: {
    alignItems: 'center',
  },
  neighborText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
    gap: 15,
    backgroundColor: '#F8F9FB',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8140F3',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#8140F3',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8140F3',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#8140F3',
  },
});

export default React.memo(ScoreboardScreen);
