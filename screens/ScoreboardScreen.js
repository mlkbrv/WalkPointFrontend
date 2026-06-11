import { StatusBar } from 'expo-status-bar';
import { Save, Share2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SegmentedControl from '../components/ui/SegmentedControl';
import { useTheme } from '../context/ThemeContext';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getFriendsLeaderboard, getLeaderboard, getTeamLeaderboard, getTeams } from '../services/apiService';

function ScoreboardScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { user } = useAuth();
  const [tab, setTab] = useState('global');
  const [teamId, setTeamId] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animations] = useState({
    first: new Animated.Value(0),
    second: new Animated.Value(0),
    third: new Animated.Value(0),
  });

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (tab === 'friends') {
        data = await getFriendsLeaderboard();
      } else if (tab === 'team') {
        let tid = teamId;
        if (!tid) {
          const teams = await getTeams();
          const first = Array.isArray(teams) ? teams[0] : null;
          tid = first?.id ?? null;
          if (tid) setTeamId(tid);
        }
        if (!tid) {
          setUsers([]);
          setCurrentUserRank(null);
          return;
        }
        data = await getTeamLeaderboard(tid);
      } else {
        data = await getLeaderboard();
      }
      const entries = (Array.isArray(data) ? data : data.results || []).map((entry) => ({
        id: entry.user_id,
        name: [entry.first_name, entry.last_name].filter(Boolean).join(' ') || t('account.userFallback'),
        score: entry.total_steps || 0,
        avatar: '👤',
        isCurrentUser: user && entry.user_id === user.id,
      }));

      const hasCurrentUser = entries.some((e) => e.isCurrentUser);
      if (!hasCurrentUser && user) {
        entries.push({
          id: user.id,
          name: [user.first_name, user.last_name].filter(Boolean).join(' ') || t('scoreboard.you'),
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
  }, [user, t, tab, teamId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const topThree = users.slice(0, 3);
  const currentUser = users.find((u) => u.isCurrentUser);
  const isInTopThree = currentUserRank && currentUserRank <= 3;
  const teamEmpty = tab === 'team' && users.length === 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton}>
            <X size={24} color={c.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('social.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <SegmentedControl
          options={[
            { value: 'global', label: t('scoreboard.tabGlobal') },
            { value: 'friends', label: t('scoreboard.tabFriends') },
            { value: 'team', label: t('scoreboard.tabTeam') },
          ]}
          value={tab}
          onChange={setTab}
        />

        <Pressable
          style={styles.challengesBanner}
          onPress={() => navigation.navigate('Challenges')}
        >
          <View style={styles.challengesBannerText}>
            <Text style={styles.challengesBannerTitle}>{t('social.challengesCta')}</Text>
            <Text style={styles.challengesBannerSub}>{t('social.challengesSub')}</Text>
          </View>
          <Text style={styles.challengesBannerArrow}>›</Text>
        </Pressable>

        {tab === 'friends' ? (
          <Pressable
            style={styles.manageLink}
            onPress={() => navigation.navigate('Friends')}
          >
            <Text style={styles.manageLinkText}>{t('social.manageFriends')}</Text>
          </Pressable>
        ) : null}
        {tab === 'team' ? (
          <Pressable
            style={styles.manageLink}
            onPress={() => navigation.navigate('Teams')}
          >
            <Text style={styles.manageLinkText}>{t('social.manageTeams')}</Text>
          </Pressable>
        ) : null}

        {teamEmpty ? (
          <View style={styles.teamEmpty}>
            <Text style={styles.teamEmptyText}>{t('scoreboard.teamEmpty')}</Text>
            <Pressable
              style={styles.teamEmptyBtn}
              onPress={() => navigation.navigate('Teams')}
            >
              <Text style={styles.teamEmptyBtnText}>{t('scoreboard.joinTeam')}</Text>
            </Pressable>
          </View>
        ) : (
        <>
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
                {t('scoreboard.youAre', { rank: currentUserRank })}
              </Text>
              <View style={styles.currentUserNeighbors}>
                {currentUserRank > 1 && (
                  <Text style={styles.neighborText}>
                    {t('scoreboard.above', {
                      name: users[currentUserRank - 2].name,
                      score: users[currentUserRank - 2].score.toLocaleString(),
                    })}
                  </Text>
                )}
                {currentUserRank < users.length && (
                  <Text style={styles.neighborText}>
                    {t('scoreboard.below', {
                      name: users[currentUserRank].name,
                      score: users[currentUserRank].score.toLocaleString(),
                    })}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Pressable style={styles.saveButton}>
            <Save size={20} color={c.primary} strokeWidth={2} />
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </Pressable>
          <Pressable style={styles.shareButton}>
            <Share2 size={20} color={c.primary} strokeWidth={2} />
            <Text style={styles.shareButtonText}>{t('common.share')}</Text>
          </Pressable>
        </View>
        </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.screenBg,
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
    backgroundColor: c.screenBg,
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
    color: c.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 30,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabBtnActive: {
    backgroundColor: c.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  teamEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  teamEmptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 16,
  },
  teamEmptyBtn: {
    backgroundColor: c.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  teamEmptyBtnText: {
    color: '#FFF',
    fontWeight: '700',
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
    color: c.textPrimary,
  },
  avatarContainer: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: c.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: c.primary,
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
    color: c.textPrimary,
    marginBottom: 6,
  },
  podiumScore: {
    fontSize: 15,
    color: c.textSecondary,
    fontWeight: '500',
  },
  currentUserHighlight: {
    color: c.primary,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: c.card,
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
    borderBottomColor: c.cardBorder,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textSecondary,
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
    color: c.textPrimary,
  },
  currentUserName: {
    color: c.primary,
  },
  listScore: {
    fontSize: 17,
    color: c.textSecondary,
    fontWeight: '500',
  },
  currentUserScore: {
    color: c.primary,
    fontWeight: '700',
  },
  currentUserContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: c.card,
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
    color: c.primary,
    marginBottom: 12,
  },
  currentUserNeighbors: {
    alignItems: 'center',
  },
  neighborText: {
    fontSize: 15,
    color: c.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
    gap: 15,
    backgroundColor: c.screenBg,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: c.card,
    borderWidth: 2,
    borderColor: c.primary,
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
    color: c.primary,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: c.card,
    borderWidth: 2,
    borderColor: c.primary,
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
    color: c.primary,
  },
  challengesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: c.primary,
    borderRadius: 16,
  },
  challengesBannerText: {
    flex: 1,
  },
  challengesBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  challengesBannerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  challengesBannerArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  manageLink: {
    alignSelf: 'flex-end',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  manageLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },
  });
}

export default React.memo(ScoreboardScreen);
