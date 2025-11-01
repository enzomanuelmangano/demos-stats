import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { PressablesConfig } from 'pressto';
import { Dashboard } from './src/screens/Dashboard';

export default function App() {
  return (
    <PressablesConfig
      activateOnHover
      animationConfig={{
        duration: 0,
      }}
      config={{
        activeOpacity: 0.6,
      }}
    >
      <SafeAreaView style={styles.container}>
        <Dashboard />
        <StatusBar style="dark" />
      </SafeAreaView>
    </PressablesConfig>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
});
