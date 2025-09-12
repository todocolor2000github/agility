import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Game3() {
  const router = useRouter();
  const [settingsModal, setSettingsModal] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pauseModal, setPauseModal] = useState(false);
  const [round, setRound] = useState(1);
  const [pressCount, setPressCount] = useState(0);
  const [goal, setGoal] = useState(20);
  const [score, setScore] = useState(0);
  const [decreaseSpeed, setDecreaseSpeed] = useState(300); // slower bar decrease
  const [hasTapped, setHasTapped] = useState(false);
  const [roundTimer, setRoundTimer] = useState(20); // seconds left in round
  const [targetPressCount, setTargetPressCount] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const timerRef = useRef(null);
  const roundTimerRef = useRef(null);

  // Start game: reset everything
  const handleStartGame = () => {
    setShowStart(false);
    setShowModal(false);
    setRound(1);
    setGoal(8);
    setPressCount(0);
    setTargetPressCount(0);
    setScore(0);
    setDecreaseSpeed(300);
    setHasTapped(false);
    setRoundTimer(20);
  };

  // Handle button press
  const handlePress = () => {
    setHasTapped(true);
    let newTarget;
    if (round <= 5) {
      // Gradually decrease bounce from level 1 to 5
      const bounceScale = 0.6 - (round - 1) * 0.12; // 0.6, 0.48, 0.36, 0.24, 0.12
      newTarget = Math.max(pressCount + Math.ceil(goal * bounceScale), Math.ceil(goal * bounceScale));
    } else {
      newTarget = pressCount + 1;
    }
    setTargetPressCount(newTarget);
    if (newTarget >= goal) {
      setScore(s => s + 1);
      setRound(r => r + 1);
      let nextGoal;
      let nextDecreaseSpeed;
      if (round < 5) {
        nextGoal = Math.floor(goal * 1.15);
        nextDecreaseSpeed = Math.max(120, decreaseSpeed - 20);
      } else {
        nextGoal = Math.floor(goal * 1.07); // slower goal increase after level 5
        nextDecreaseSpeed = Math.max(120, decreaseSpeed - 8); // slower speed up after level 5
      }
      setGoal(nextGoal);
      setPressCount(0);
      setTargetPressCount(0);
      setDecreaseSpeed(nextDecreaseSpeed);
      setHasTapped(false);
      setRoundTimer(20);
    }
  };

  // Animate pressCount toward targetPressCount for fluid bar movement
  useEffect(() => {
    if (showStart || showModal) return;
    if (pressCount === targetPressCount) return;
    const anim = setInterval(() => {
      setPressCount(c => {
        if (c < targetPressCount) return c + 1;
        if (c > targetPressCount) return c - 1;
        return c;
      });
    }, 16); // ~60fps
    return () => clearInterval(anim);
  }, [targetPressCount, showStart, showModal]);

  // Timer: decrease pressCount every 100ms, and round timer every 1s
  useEffect(() => {
    if (showStart || showModal) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTargetPressCount(c => (c > 0 ? c - 1 : 0));
    }, decreaseSpeed);
    roundTimerRef.current = setInterval(() => {
      setRoundTimer(t => {
        if (t > 1) return t - 1;
        // Lose if timer runs out
        if (!showModal) setShowModal(true);
        return 0;
      });
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(roundTimerRef.current);
    };
  }, [showStart, showModal, decreaseSpeed, hasTapped]);

  const handlePause = () => {
    setPauseModal(true);
  };

  // Helper: increment staminaLevelCounts for scores over 60
  async function incrementStaminaLevelCounts(score) {
    if (score >= 60) {
      try {
        const key = 'staminaLevelCounts';
        let counts = await AsyncStorage.getItem(key);
        counts = counts ? JSON.parse(counts) : {};
        counts[score] = (counts[score] || 0) + 1;
        await AsyncStorage.setItem(key, JSON.stringify(counts));
      } catch (e) {
        console.log('Error updating staminaLevelCounts:', e);
      }
    }
  }

  // Load high score on mount and when returning to start screen
  useEffect(() => {
    AsyncStorage.getItem('staminaHighScore').then(val => {
      if (val !== null) setHighScore(Number(val));
    });
  }, [showStart]);

  // Update high score after game over
  useEffect(() => {
    if (showModal && score > highScore) {
      AsyncStorage.setItem('staminaHighScore', String(score));
      setHighScore(score);
      setIsNewHighScore(true);
    } else if (showModal) {
      setIsNewHighScore(false);
    }
  }, [showModal, score, highScore]);

  // In game over logic, call incrementStaminaLevelCounts
  useEffect(() => {
    if (showModal && score >= 60) {
      incrementStaminaLevelCounts(score);
    }
  }, [showModal, score]);

  return (
    <View style={styles.container}>
      {showStart ? (
        <>
          <Text style={styles.title}>Stamina</Text>
          <Text style={styles.subtitle}>Tap to fill the bar!</Text>
          <Text style={styles.highScore}>High Score: <Text style={{color:'yellow'}}>{highScore}</Text></Text>
          <TouchableOpacity style={styles.button} onPress={handleStartGame}>
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
              <Text style={styles.pauseButtonText}>⏸</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.round}>Round: {round}</Text>
          {roundTimer <= 5 ? (
            <Text style={styles.timer}>Time Left: {roundTimer}s</Text>
          ) : (
            <Text style={styles.timer}>{' '}</Text>
          )}
          <View style={styles.barContainer}>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { height: `${Math.min(pressCount / goal, 1) * 100}%` }]} />
            </View>
            <Text style={styles.barText}>{pressCount} / {goal}</Text>
          </View>
          <TouchableOpacity style={styles.tapButton} onPress={handlePress}>
            <Text style={styles.tapButtonText}>Tap!</Text>
          </TouchableOpacity>
        </>
      )}
      {/* Game Over Modal (not used unless you add a timer) */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Game Over!</Text>
            <Text style={styles.modalText}>Score: {score}</Text>
            {isNewHighScore && <Text style={styles.modalText}>New High Score!</Text>}
            <TouchableOpacity style={styles.restartButton} onPress={() => { setShowModal(false); setShowStart(true); }}>
              <Text style={styles.restartButtonText}>Back to Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Settings Modal */}
      <Modal
        visible={settingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Settings (Coming Soon)</Text>
            <TouchableOpacity style={styles.restartButton} onPress={() => setSettingsModal(false)}>
              <Text style={styles.restartButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Pause Modal */}
      <Modal
        visible={pauseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPauseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Paused</Text>
            <TouchableOpacity style={styles.restartButton} onPress={() => setPauseModal(false)}>
              <Text style={styles.restartButtonText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.restartButton} onPress={() => { setPauseModal(false); setShowStart(true); }}>
              <Text style={styles.restartButtonText}>Back to Stamina Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 10,
    zIndex: 20,
    height: 80,
    backgroundColor: 'transparent',
  },
  pauseButton: {
    marginLeft: 0,
    marginTop: 20,
    alignSelf: 'flex-start',
    padding: 10,
  },
  pauseButtonText: {
    fontSize: 28,
    color: 'black',
    fontWeight: 'bold',
  },
  title: { fontSize: 32, color: 'lightgreen', marginBottom: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 20, color: '#fff', marginBottom: 30, textAlign: 'center', fontWeight: '500' },
  button: { backgroundColor: 'lightgreen', padding: 20, borderRadius: 10, marginBottom: 16 },
  buttonText: { color: 'black', fontSize: 20, fontWeight: 'bold' },
  score: { fontSize: 24, color: 'white', marginBottom: 10 },
  round: { fontSize: 18, color: 'lightgreen', marginBottom: 20 },
  timer: { fontSize: 18, color: 'cyan', marginBottom: 10, fontWeight: 'bold' },
  barContainer: { alignItems: 'center', marginBottom: 30 },
  barBg: { width: 60, height: 240, backgroundColor: '#444', borderRadius: 12, overflow: 'hidden', marginBottom: 8, justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: 'lightgreen', borderRadius: 12, position: 'absolute', bottom: 0 },
  barText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  tapButton: { backgroundColor: 'lightgreen', paddingHorizontal: 40, paddingVertical: 24, borderRadius: 16 },
  tapButtonText: { color: 'black', fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#222', padding: 30, borderRadius: 12, alignItems: 'center' },
  modalText: { color: 'white', fontSize: 22, marginBottom: 12 },
  restartButton: { backgroundColor: 'lightgreen', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 10 },
  restartButtonText: { fontSize: 18, color: 'black', fontWeight: 'bold' },
  highScore: { fontSize: 18, color: 'yellow', marginBottom: 20, fontWeight: 'bold' },
});
