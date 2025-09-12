import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StartPage() {
  const router = useRouter();
  // Example games data
  const games = [
    {
      name: 'Flash Square',
      image: require('@/assets/images/react-logo.png'),
      description: 'Test your reflexes in Flash Square!',
      screen: 'game1',
    },
    {
      name: 'Memory Match',
      image: require('@/assets/images/partial-react-logo.png'),
      description: 'COMING SOON!!! Challenge your memory in Memory Match!',
      screen: 'game2',
    },
    {
      name: 'Stamina',
      image: require('@/assets/images/partial-react-logo.png'),
      description: 'COMING SOON!!! Build your stamina in Stamina!',
      screen: 'game3',
    },
    // Add more games here
  ];

  const [started, setStarted] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const nextGame = () => setCurrent((current + 1) % games.length);
  const prevGame = () => setCurrent((current - 1 + games.length) % games.length);
  const handlePlay = () => {
    const screen = games[current].screen;
    if (screen) {
      router.push('/(tabs)/' + screen);
    }
  };//

  // Add back button to game picker
  if (!started) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to <Text style={{color:'yellow'}}>Agility</Text>!</Text>
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={() => setStarted(true)}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.statsButton]}
          onPress={() => router.push('/(tabs)/stats')}
        >
          <Text style={styles.buttonText}>Stats</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>OvrRide</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStarted(false)}>
        <Text style={styles.backButtonText}>{'< Back to Start'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Choose Your Game</Text>
      <View style={styles.card}>
        <Image source={games[current].image} style={styles.image} />
        <Text style={styles.gameName}>{games[current].name}</Text>
        <Text style={styles.description}>{games[current].description}</Text>
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlay}
        >
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={prevGame} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextGame} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  title: { fontSize: 32, color: 'yellow', marginBottom: 40, fontWeight: 'bold' },
  button: { backgroundColor: 'yellow', padding: 20, borderRadius: 10 },
  buttonText: { color: 'black', fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: '#222', borderRadius: 16, padding: 24, alignItems: 'center', width: 300, marginBottom: 20 },
  image: { width: 120, height: 120, marginBottom: 16, borderRadius: 12 },
  gameName: { fontSize: 22, color: 'yellow', fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 16, color: 'white', marginBottom: 16, textAlign: 'center' },
  playButton: {backgroundColor: 'yellow', paddingVertical: 10, paddingHorizontal: 32, borderRadius: 8 },
  playButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  arrowButton: { backgroundColor: '#333', padding: 12, borderRadius: 8, marginHorizontal: 16 },
  arrowText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: 'yellow',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  statsButton: {
    backgroundColor: '#333',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'yellow',
  },
  footer: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 40,
    textAlign: 'center',
  },
});
