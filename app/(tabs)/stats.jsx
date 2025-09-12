import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GAMES = [
  { key: 'agility', name: 'Flash Square' },
  { key: 'memory', name: 'Memory Match' },
  { key: 'stamina', name: 'Stamina' },
];

const BAR_THRESHOLDS = [100 ,500 ,1000 ,2500]; // Example thresholds for each tier
function getCurrentTier(levelCount) {
  let tierIdx = 0;
  for (let i = 0; i < BAR_THRESHOLDS.length; i++) {
    if (levelCount >= BAR_THRESHOLDS[i]) tierIdx = i + 1;
    else break;
  }
  return tierIdx;
}
function getTierProgress(levelCount) {
  const tierIdx = getCurrentTier(levelCount);
  const nextThreshold = BAR_THRESHOLDS[tierIdx] || BAR_THRESHOLDS[BAR_THRESHOLDS.length - 1];
  const currentTierCount = tierIdx === 0 ? levelCount : levelCount - BAR_THRESHOLDS[tierIdx - 1];
  const needed = nextThreshold - (BAR_THRESHOLDS[tierIdx - 1] || 0);
  return { currentTierCount, needed, nextThreshold };
}

const RANK_NAMES = [ 'Beginner', 'Novice', 'Skilled', 'Legend', 'Warrior'];
function getRank(levelCount) {
  const tierIdx = getCurrentTier(levelCount);
  return RANK_NAMES[tierIdx] || RANK_NAMES[RANK_NAMES.length - 1];
}

// Calculate general rank based on total progress
function getGeneralRank(stats) {
  // General rank is based on the minimum tier reached across all games
  let minTier = Infinity;
  GAMES.forEach(game => {
    const gameStats = stats[game.key] || { highScore: 0, levelCounts: {} };
    const levelCount = gameStats.levelCounts[gameStats.highScore] || 0;
    const tierIdx = getCurrentTier(levelCount);
    if (tierIdx < minTier) minTier = tierIdx;
  });
  // If all games have filled all bars, show special rank
  if (minTier >= RANK_NAMES.length) return 'Champion';
  return RANK_NAMES[minTier] || RANK_NAMES[0];
}

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({});

  useEffect(() => {
    async function loadStats() {
      let loaded = {};
      for (const game of GAMES) {
        const highScore = await AsyncStorage.getItem(`${game.key}HighScore`);
        const levelCounts = await AsyncStorage.getItem(`${game.key}LevelCounts`);
        loaded[game.key] = {
          highScore: highScore ? Number(highScore) : 0,
          levelCounts: levelCounts ? JSON.parse(levelCounts) : {},
        };
      }
      setStats(loaded);
    }
    loadStats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player <Text style={{color:'yellow'}}>Stats</Text></Text>
      <View style={styles.rankBox}>
        <View style={styles.rankItem}>
          <Text style={styles.rankGame}>Rank</Text>
          <View style={styles.rankSquare}><Text style={styles.rankText}>{getGeneralRank(stats)}</Text></View>
        </View>
      </View>
      <Text style={styles.subtitle}>Track your progress and unlock new ranks!</Text>
      {GAMES.map(game => {
        const gameStats = stats[game.key] || { highScore: 0, levelCounts: {} };
        const levelCount = gameStats.levelCounts[gameStats.highScore] || 0;
        const { currentTierCount, needed } = getTierProgress(levelCount);
        return (
          <View key={game.key} style={styles.section}>
            <Text style={styles.sectionTitle}>{game.name}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${(currentTierCount / needed) * 100}%` }]} />
            </View>
            <Text style={styles.levelCount}>
              {currentTierCount} / {needed}
            </Text>
            <Text style={styles.score}>High Score: <Text style={{color:'yellow'}}>{gameStats.highScore}</Text></Text>
          </View>
        );
      })}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.footer}>Keep playing to unlock higher ranks!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 24, paddingTop: 60 },
  title: { fontSize: 32, color: 'yellow', fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: { backgroundColor: '#222', borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 22, color: 'yellow', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  barContainer: { height: 18, backgroundColor: '#333', borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: 18, backgroundColor: 'yellow', borderRadius: 8 },
  score: { fontSize: 16, color: 'white', marginBottom: 4, textAlign: 'center' },
  levelCount: { fontSize: 16, color: 'white', marginBottom: 4, textAlign: 'center' },
  backButton: { backgroundColor: 'yellow', padding: 14, borderRadius: 10, alignSelf: 'center', marginTop: 12 },
  backButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
  footer: { color: '#aaa', fontSize: 14, marginTop: 24, textAlign: 'center' },
  rankBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  rankItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  rankGame: {
    color: 'white',
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  rankSquare: {
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  rankText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
