import AsyncStorage from '@react-native-async-storage/async-storage';
import {Audio} from 'expo-av';
import {useEffect, useRef, useState} from 'react';
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

import { Animated, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
const NUM_SQUARES = 4;
const BASE_FLASH_DURATION = 2000; // ms  
const BASE_DELAY = 1500; // ms
const MIN_FLASH_DURATION = 250; // ms
const MIN_DELAY = 250; // ms 
/*
const BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'; // official test banner ID
const INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712'; // Replace with your AdMob interstitial unit ID
*/
const platfomeAddUnitID = Platform.select({
  ios: "ca-app-pub-2478199649340969/7711472979",     // iOS Interstitial Ad Unit ID
  android: "ca-app-pub-2478199649340969/3333244265", // Android Interstitial Ad Unit ID
});


const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : platfomeAddUnitID;

let interstitial = null;
export default function FlashSquareGame() {
  const [flashingIdx, setFlashingIdx] = useState(null);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showStart, setShowStart] = useState(true);
  const [pauseModal, setPauseModal] = useState(false);
  const [round, setRound] = useState(0); // add this state
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const missedRef = useRef(false);
  const flashTimerRef = useRef(null);
  const [fadeAnim, setFadeAnim] = useState(new Animated.Value(0));
  const flashSound = useRef();
  const hitSound = useRef();
  const wrongSound = useRef();

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

  useEffect(() => {
    if (showStart || showModal) return;
    missedRef.current = true;
    setFlashingIdx(null);

    const flashDuration = Math.max(BASE_FLASH_DURATION - score * 25, MIN_FLASH_DURATION);
    const delayMax = Math.max(BASE_DELAY - score * 20, MIN_DELAY);
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
  }, [score, showStart, showModal, fadeAnim, round]); // add round to dependencies

  function handleSquareClick(idx) {
    // Lose if no square is lit or if wrong square is pressed
    if (flashingIdx === null || idx !== flashingIdx) {
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
    interstitial = InterstitialAd.createForAdRequest(adUnitId);

    const onLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Ad loaded ✅');
      setLoaded(true);
    });

    const onClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Ad closed, reloading...');
      startGame(); 
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


    showAdOrWait();
};
const startGame = () => {
  // all your game state resets here
  // setGameStarted(true);
    setGameCount(c => c + 1);
    //maybeShowInterstitial();
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
    cancelRound();
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
      AsyncStorage.setItem('highScore', String(score));
      setHighScore(score);
      setIsNewHighScore(true);
    } else if (showModal) {
      setIsNewHighScore(false);
    }
  }, [showModal, score, highScore]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
          <Text style={styles.pauseButtonText}>⏸</Text>
        </TouchableOpacity>
      </View>
      
      {showStart ? (
        <>
          <Text style={styles.title}>Flash Square Game</Text>
          <Text style={styles.highScore}>High Score: {highScore}</Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
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
                <TouchableOpacity
                  style={styles.restartButton}
                  onPress={() => {
                    setPauseModal(false);
                    handleRestart();
                  }}
                >
                  <Text style={styles.restartButtonText}>Back to Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.restartButton}
                  onPress={handleResume}
                >
                  <Text style={styles.restartButtonText}>Resume</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop:200, // increase padding so topBar doesn't overlap
    backgroundColor: 'black', // lighter for debugging
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 10,
    zIndex: 20,
    height: 50,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
  },
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 20,
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
  banner: {
    marginRight: 10,
  },
});

