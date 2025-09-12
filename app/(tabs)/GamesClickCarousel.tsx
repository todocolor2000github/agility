import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StartPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);

  // Example games data
  const games = [
    {
      name: 'Flash Square',
      image: require('@/assets/images/react-logo.png'),
      description: 'Test your reflexes in Flash Square!',
      screen: 'game1'
    },
    {
      name: 'Memory Match',
      image: require('@/assets/images/partial-react-logo.png'),
      description: 'Challenge your memory in Memory Match!',
      screen: 'game2',
    },
    {name:'Stamina',
      image: require('@/assets/images/partial-react-logo.png'),
      description: 'Build your stamina in Stamina!',
      screen: 'game3',
    }
  ];

  const [current, setCurrent] = useState(0);
  const nextGame = () => setCurrent((current + 1) % games.length);
  const prevGame = () => setCurrent((current - 1 + games.length) % games.length);
  const handlePlay = () => {
    if (games[current].screen) {
      switch (games[current].screen) {
        case 'game1':
          router.push('/(tabs)/game1');
          break;
        case 'game2':
          router.push('/(tabs)/game2');
          break;
        case 'game3':
          router.push('/(tabs)/game3');
          break;
        default:
          break;
      }
    }
  };

  if (!started) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Agility!</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setStarted(true)}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Game</Text>
      <View style={styles.card}>
        <Text style={styles.gameName}>{games[current].name}</Text>
        <Text style={styles.description}>{games[current].description}</Text>
        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
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
  gameName: { fontSize: 22, color: 'yellow', fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 16, color: 'white', marginBottom: 16, textAlign: 'center' },
  playButton: { backgroundColor: 'yellow', paddingVertical: 10, paddingHorizontal: 32, borderRadius: 8 },
  playButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  arrowButton: { backgroundColor: '#333', padding: 12, borderRadius: 8, marginHorizontal: 16 },
  arrowText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
});
