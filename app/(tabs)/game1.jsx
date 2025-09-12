import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AdEventType,
  BannerAd,
  InterstitialAd,
  TestIds
} from 'react-native-google-mobile-ads';

import { Animated, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const NUM_SQUARES = 4;
const BASE_FLASH_DURATION = 2000; // ms  
const BASE_DELAY = 1500; // ms
const MIN_FLASH_DURATION = 250; // ms
const MIN_DELAY = 250; // ms 

const platfomeAddUnitID = Platform.select({
  ios: "ca-app-pub-4357128939296672/5695068745",     // iOS Interstitial Ad Unit ID
  android: "ca-app-pub-4357128939296672/4302914261", // Android Interstitial Ad Unit ID
});
const platformAddUnitID = Platform.select({
  ios: "ca-app-pub-4357128939296672/7499923249",     // iOS Interstitial Ad Unit ID
  android: "ca-app-pub-4357128939296672/1472467297", // Android Interstitial Ad Unit ID
});

// Use your provided IDs for banner and interstitial
const interstitialAdUnitId = __DEV__ ? TestIds.INTERSTITIAL : platfomeAddUnitID;
const bannerAdUnitId = __DEV__ ? TestIds.BANNER : platformAddUnitID;

let interstitial = null;
export default function game1() {
  const router = useRouter();
  const [flashingIdx, setFlashingIdx] = useState(null);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [pauseModal, setPauseModal] = useState(false);
  const [round, setRound] = useState(0); // add this state
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const [adJustClosed, setAdJustClosed] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const missedRef = useRef(false);
  const flashTimerRef = useRef(null);
  const [fadeAnim, setFadeAnim] = useState(new Animated.Value(0));
  const flashSound = useRef();
  const hitSound = useRef();
  const wrongSound = useRef();
  const shouldStartGameAfterAd = useRef(false);

  // Load sounds once
  useEffect(() => {
    async function loadSounds() {
      flashSound.current = await Audio.Sound.createAsync(require('@/assets/sounds/flash.wav'));
      hitSound.current = await Audio.Sound.createAsync(require('@/assets/sounds/hit.wav'));
      wrongSound.current = await Audio.Sound.createAsync(require('@/assets/sounds/wrong.wav'));
    }
    loadSounds();
    return () => {
      flashSound.current?.sound.unloadAsync();
      hitSound.current?.sound.unloadAsync();
      wrongSound.current?.sound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (flashingIdx !== null) {
      flashSound.current?.sound.replayAsync();
    }
  }, [flashingIdx]);

  // Difficulty settings
  const DIFFICULTY_SETTINGS = {
    easy: {
      baseFlash: 2500,
      baseDelay: 2000,
      minFlash: 400,
      minDelay: 400,
      flashStep: 15,
      delayStep: 10,
    },
    normal: {
      baseFlash: 1500,
      baseDelay: 250,
      minFlash: 250,
      minDelay: 250,
      flashStep: 25,
      delayStep: 20,
    },
    hard: {
      baseFlash: 1200,
      baseDelay: 900,
      minFlash: 120,
      minDelay: 120,
      flashStep: 40,
      delayStep: 30,
    },
  };

  useEffect(() => {
    if (showStart || showModal) return;
    missedRef.current = true;
    setFlashingIdx(null);

    const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal;
    const flashDuration = Math.max(settings.baseFlash - score * settings.flashStep, settings.minFlash);
    const delayMax = Math.max(settings.baseDelay - score * settings.delayStep, settings.minDelay);
    const delay = Math.floor(Math.random() * delayMax);

    const delayTimer = setTimeout(() => {
      const idx = Math.floor(Math.random() * NUM_SQUARES);
      setFlashingIdx(idx);

      fadeAnim.setValue(1); // Start at yellow
      Animated.timing(fadeAnim, {
        toValue: 0, // Fade to gray
        duration: flashDuration,
        useNativeDriver: false,
      }).start();

      flashTimerRef.current = setTimeout(() => {
        if (missedRef.current) { 
          setShowModal(true);
        }
        setFlashingIdx(null);
      }, flashDuration);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      fadeAnim.setValue(0);
    };
  }, [score, showStart, showModal, fadeAnim, round, difficulty]); // add difficulty to dependencies

  function handleSquareClick(idx) {
    // Lose if no square is lit or if wrong square is pressed
    if (flashingIdx === null || idx !== flashingIdx) {
      console.log('Lose: wrong button or no button lit');
      wrongSound.current?.sound.replayAsync();
      setShowModal(true);
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
      setFlashingIdx(null);
      fadeAnim.setValue(0);
      return;
    }
    // Correct square
    hitSound.current?.sound.replayAsync();
    setScore(s => s + 1);
    missedRef.current = false;
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    setFlashingIdx(null);
    fadeAnim.setValue(0);
  }

  function handleRestart() {
    setScore(0);
    setShowModal(false);
    setShowStart(true);
    setFlashingIdx(null);
    setFadeAnim(new Animated.Value(0)); // re-create node
  }
/*
  // Setup AdMob test device
  useEffect(() => {
    setTestDeviceIDAsync('EMULATOR');
  }, []);

  // Show interstitial ad every 5 games
  
  async function maybeShowInterstitial() {
    if ((gameCount + 1) % 5 === 0) {
      await AdMobInterstitial.setAdUnitID(INTERSTITIAL_ID);
      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
      await AdMobInterstitial.showAdAsync();
    }
  }
*/

const [loaded, setLoaded] = useState(false);

useEffect(() => {
    interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);

    const onLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Ad loaded ✅');
      setLoaded(true);
    });

    const onClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Ad closed, reloading...');
      if (shouldStartGameAfterAd.current) {
        setShowModal(true); // Show restart modal after ad
        shouldStartGameAfterAd.current = false;
      }
      setLoaded(false);
      interstitial.load(); // preload next ad
      if (Platform.OS === 'ios') StatusBar.setHidden(false);
    });

    const onOpened = interstitial.addAdEventListener(AdEventType.OPENED, () => {
      if (Platform.OS === 'ios') StatusBar.setHidden(true);
    });

    interstitial.load();

    return () => {
      onLoaded();
      onClosed();
      onOpened();
  };
}, []);
const showAdOrWait = () => {
  if (loaded && interstitial) {
    interstitial.show();
  } else {
    console.log("⏳ Ad not ready, waiting...");
    const unsubscribe = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log("✅ Ad finished loading, showing now...");
        unsubscribe();
        interstitial.show();
      }
    );
  }
};

const handleStartGame = async () => {
  // Increment gameCount first
  setGameCount(c => {
    const nextCount = c + 1;
    if (nextCount % 5 === 0) {
      shouldStartGameAfterAd.current = true;
      showAdOrWait();
    } else {
      startGame();
    }
    return nextCount;
  });
};
const startGame = () => {
  // all your game state resets here
  // setGameStarted(true);
    setScore(0);
    setShowStart(false);
    setShowModal(false);
    setFlashingIdx(null);
    setFadeAnim(new Animated.Value(0));
  };

  // Helper to cancel timers and reset flash/animation
  function cancelRound() {
    setFlashingIdx(null);
    fadeAnim.setValue(0);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }

  function handleResume() {
    setPauseModal(false);
    cancelRound();
    setRound(r => r + 1); // increment round to trigger useEffect
  }

  // Pause button now cancels timers and opens modal
  function handlePause() {
    setPauseModal(true);
  }

  // Load high score on mount and when returning to start screen
  useEffect(() => {
    AsyncStorage.getItem('highScore').then(val => {
      if (val !== null) setHighScore(Number(val));
    });
  }, [showStart]);

  // Update high score after game over
  useEffect(() => {
    if (showModal && score > highScore) {
      AsyncStorage.setItem('agilityHighScore', String(score));
      setHighScore(score);
      setIsNewHighScore(true);
    } else if (showModal) {
      setIsNewHighScore(false);
    }
  }, [showModal, score, highScore]);

  useEffect(() => {
    // Load difficulty from AsyncStorage
    AsyncStorage.getItem('agilityDifficulty').then(val => {
      if (val) setDifficulty(val);
    });
  }, []);

  const selectDifficulty = async (level) => {
    setDifficulty(level);
    await AsyncStorage.setItem('agilityDifficulty', level);
  };

  // Helper: increment agilityLevelCounts for scores over 60
  async function incrementAgilityLevelCounts(score) {
    if (score >= 60) {
      try {
        const key = 'agilityLevelCounts';
        let counts = await AsyncStorage.getItem(key);
        counts = counts ? JSON.parse(counts) : {};
        counts[score] = (counts[score] || 0) + 1;
        await AsyncStorage.setItem(key, JSON.stringify(counts));
      } catch (e) {
        console.log('Error updating agilityLevelCounts:', e);
      }
    }
  }

  // In game over logic, call incrementAgilityLevelCounts
  useEffect(() => {
    if (showModal && score >= 60) {
      incrementAgilityLevelCounts(score);
    }
  }, [showModal, score]);

  return (
    <View style={styles.container}>
      {showStart ? (
        <>
          <Text style={styles.title}>AGILITY</Text>
          <Text style={styles.subtitle}>Flash Square Game</Text>
          <View style={styles.difficultyRow}>
            <TouchableOpacity
              style={[styles.diffButton, difficulty === 'easy' && styles.diffSelected]}
              onPress={() => selectDifficulty('easy')}
            >
              <Text style={styles.diffText}>Easy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.diffButton, difficulty === 'normal' && styles.diffSelected]}
              onPress={() => selectDifficulty('normal')}
            >
              <Text style={styles.diffText}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.diffButton, difficulty === 'hard' && styles.diffSelected]}
              onPress={() => selectDifficulty('hard')}
            >
              <Text style={styles.diffText}>Hard</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedDiff}>Selected: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</Text>
          <Text style={styles.highScore}>High Score: {highScore}</Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{'< Back to Game Picker'}</Text>
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
          <View style={styles.grid}>
            {[0, 1].map(row =>
              <View key={row} style={styles.row}>
                {[0, 1].map(col => {
                  const idx = row * 2 + col;
                  if (flashingIdx === idx) {
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleSquareClick(idx)}
                        activeOpacity={0.7}
                      >
                        <Animated.View
                          style={[
                            styles.square,
                            styles.squareFlashing,
                            { opacity: fadeAnim }
                          ]}
                        />
                      </TouchableOpacity>  
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSquareClick(idx)}
                      style={[
                        styles.square,
                        styles.squareNormal,
                      ]}
                      activeOpacity={0.7}
                    />
                  );
                })}
                
              </View>
              
            )}
          </View>
          {/* Game Over Modal */}
          <Modal
            visible={showModal}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>Game Over!</Text>
                <Text style={styles.modalText}>Final Score: {score}</Text>
                {isNewHighScore && (
                  <Text style={styles.newHighScoreText}>New High Score!</Text>
                )}
                {/*<Text style={styles.modalText}>{score}</Text> */}
                <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                  <Text style={styles.restartButtonText}>Back to Start</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.restartButton} onPress={handleStartGame}>
                  <Text style={styles.restartButtonText}>Restart</Text>
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
                  setFlashingIdx(null);
                  setFadeAnim(new Animated.Value(0));
                }}>
                  <Text style={styles.restartButtonText}>Back to Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
      {/* Safe BannerAd rendering to avoid white screen */}
      {!showStart && (
        <View style={styles.bannerBottom}>
          {typeof BannerAd === 'function' ? (
            <BannerAd
              unitId={bannerAdUnitId}
              size="BANNER"
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              style={{ alignSelf: 'center' }}
            />
          ) : (
            <Text style={{ color: 'white', textAlign: 'center' }}>Ad could not be loaded</Text>
          )}
        </View>
      )}
      {/* DEBUG: Add logs for state */}
      {console.log('showStart:', showStart, 'showModal:', showModal, 'flashingIdx:', flashingIdx)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop:250, // increase padding so topBar doesn't overlap
    backgroundColor: 'black', // lighter for debugging
  },
  topBar: {
    position: 'absolute',
    top: 40, // Lower the pause button below the clock and top bar
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
  score: {
    fontSize: 24,
    marginBottom: 20,
    color:'white'
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: 'black',
    margin: 10,
  },
  squareNormal: {
    backgroundColor: 'gray',
  },
  squareFlashing: {
    backgroundColor: 'yellow',
  },
  message: {
    fontSize: 20,
    height: 30,
    color:'white'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalText: {
    color: 'white',
    fontSize: 22,
    marginBottom: 12,
  },
  
  
  newHighScoreText: {
    color: 'yellow',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 5,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  restartButton: {
    backgroundColor: 'yellow',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  restartButtonText: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  subtitle:{
  marginBottom:40,
  fontSize:32,
color: 'white'},


  startButton: {
    backgroundColor: 'yellow',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
  },
  startButtonText: {
    fontSize: 22,
    color: 'black',
    fontWeight: 'bold',
  },
  pauseButton: {
    marginLeft: 0,
    marginTop:20,
    alignSelf: 'flex-start',
    padding: 10,
  },
  pauseButtonText: {
    fontSize: 28,
    color: 'black',
    fontWeight: 'bold',
  },
  highScore: {
    fontSize: 22,
    color: 'yellow',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  bannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingBottom: 10,
    zIndex: 30,
  },
  backButton: {
    marginRight: 10,
    marginTop: 20,
    padding: 10,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 18,
    color: 'yellow',
    fontWeight: 'bold',
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  diffButton: {
    backgroundColor: '#333',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  diffSelected: {
    backgroundColor: 'yellow',
  },
  diffText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedDiff: {
    color: 'yellow',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
});

