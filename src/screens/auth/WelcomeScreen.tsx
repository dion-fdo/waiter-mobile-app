import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <LinearGradient
      colors={['#FFD3A9', '#F05822']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.subtitle}>You’re the heart of great service</Text>
      </View>

      <View style={styles.bottomSection}>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('WaiterSelection')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.footerText}>Let’s make every guest feel special!</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  logo: {
    width: 150,
    height: 70,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  welcome: {
    fontSize: 76,
    fontFamily: 'Inspiration',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 110,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'InstrumentSerif-Regular',
    color: '#2A1208',
    textAlign: 'center',
  },
  bottomSection: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#992D06',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 28,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});