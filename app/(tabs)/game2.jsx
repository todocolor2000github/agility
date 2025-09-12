import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NUM_SQUARES = 4;

export default function Game2() {
  const router = useRouter();
  const [settingsModal, setSettingsModal] = useState(false);
  const [pauseModal, setPauseModal] = useState(false);
  const [sequence, setSequence] = useState([]); // array of indices
  const [userInput, setUserInput] = useState([]); // array of indices
  const [round, setRound] = useState(1);
  const [showStart, setShowStart] = useState(true);
  const [flashingIdx, setFlashingIdx] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const flashTimerRef = useRef(null);

  // Start game: reset everything and show first sequence
  const handleStartGame = () => {
    setShowStart(false);
    setScore(0);
    setRound(1);
    setSequence([Math.floor(Math.random() * NUM_SQUARES)]);
    setUserInput([]);
    setShowModal(false);
    setIsUserTurn(false);
    setTimeout(() => playSequence([Math.floor(Math.random() * NUM_SQUARES)]), 500);
  };

  // Play the sequence visually
  const playSequence = (seq = sequence) => {
    let i = 0;
    setIsUserTurn(false);
    function flashNext() {
      if (i >= seq.length) {
        setFlashingIdx(null);
        setIsUserTurn(true);
        return;
      }
      setFlashingIdx(seq[i]);
      setTimeout(() => {
        setFlashingIdx(null);
        setTimeout(() => {
          i++;
          flashNext();
        }, 250);
      }, 600);
    }
    flashNext();
  };

  // Handle user tapping a square
  const handleSquareClick = (idx) => {
    if (!isUserTurn) return;
    const nextInput = [...userInput, idx];
    setUserInput(nextInput);
    // Check correctness
    if (sequence[nextInput.length - 1] !== idx) {
      setShowModal(true);
      setShowStart(true);
      setIsUserTurn(false);
      return;
    }
    if (nextInput.length === sequence.length) {
      // Correct sequence, next round
      setScore(s => s + 1);
      setRound(r => r + 1);
      const newSeq = [...sequence, Math.floor(Math.random() * NUM_SQUARES)];
      setSequence(newSeq);
      setUserInput([]);
      setTimeout(() => playSequence(newSeq), 800);
    }
  };

  const handlePause = () => {
    setPauseModal(true);
  };

  // Helper: increment memoryLevelCounts for scores over 60
  async function incrementMemoryLevelCounts(score) {
    if (score >= 60) {
      try {
        const key = 'memoryLevelCounts';
        let counts = await AsyncStorage.getItem(key);
        counts = counts ? JSON.parse(counts) : {};
        counts[score] = (counts[score] || 0) + 1;
        await AsyncStorage.setItem(key, JSON.stringify(counts));
      } catch (e) {
        console.log('Error updating memoryLevelCounts:', e);
      }
    }
  }

  // Load high score on mount and when returning to start screen
  useEffect(() => {
    AsyncStorage.getItem('memoryHighScore').then(val => {
      if (val !== null) setHighScore(Number(val));
    });
  }, [showStart]);

  // Update high score after game over
  useEffect(() => {
    if (showModal && score > highScore) {
      AsyncStorage.setItem('memoryHighScore', String(score));
      setHighScore(score);
      setIsNewHighScore(true);
    } else if (showModal) {
      setIsNewHighScore(false);
    }
  }, [showModal, score, highScore]);

  useEffect(() => {
    if (showModal && score >= 60) {
      incrementMemoryLevelCounts(score);
    }
  }, [showModal, score]);

  return (
    <View style={styles.container}>
      {showStart ? (
        <>
          <Text style={styles.title}>Memory Match</Text>
          <Text style={styles.subtitle}>Repeat the sequence!</Text>
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
          <View style={styles.grid}>
            {[0, 1].map(row =>
              <View key={row} style={styles.row}>
                {[0, 1].map(col => {
                  const idx = row * 2 + col;
                  const isFlashing = flashingIdx === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSquareClick(idx)}
                      style={[
                        styles.square,
                        isFlashing ? styles.squareFlashing : styles.squareNormal,
                      ]}
                      activeOpacity={0.7}
                      disabled={!isUserTurn}
                    />
                  );
                })}
              </View>
            )}
          </View>
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
        </>
      )}
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
            <TouchableOpacity style={styles.restartButton} onPress={() => {
              setPauseModal(false);
              setShowStart(true);
              setScore(0);
              setRound(1);
              setSequence([Math.floor(Math.random() * NUM_SQUARES)]);
              setUserInput([]);
              setFlashingIdx(null);
              setIsUserTurn(false);
            }}>
              <Text style={styles.restartButtonText}>Back to Menu</Text>
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
  title: { fontSize: 32, color: 'lightblue', marginBottom: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 20, color: '#fff', marginBottom: 30, textAlign: 'center', fontWeight: '500' },
  button: { backgroundColor: 'lightblue', padding: 20, borderRadius: 10, marginBottom: 16 },
  buttonText: { color: 'black', fontSize: 20, fontWeight: 'bold' },
  score: { fontSize: 24, color: 'white', marginBottom: 10 },
  round: { fontSize: 18, color: 'lightblue', marginBottom: 20 },
  grid: { justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  row: { flexDirection: 'row' },
  square: { width: 80, height: 80, borderWidth: 2, borderColor: 'black', margin: 10 },
  squareNormal: { backgroundColor: 'gray' },
  squareFlashing: { backgroundColor: 'lightblue' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#222', padding: 30, borderRadius: 12, alignItems: 'center' },
  modalText: { color: 'white', fontSize: 22, marginBottom: 12 },
  restartButton: { backgroundColor: 'lightblue', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 10 },
  restartButtonText: { fontSize: 18, color: 'black', fontWeight: 'bold' },
  highScore: { fontSize: 24, color: 'yellow', marginBottom: 20, textAlign: 'center' },
});
