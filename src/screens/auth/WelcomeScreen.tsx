import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 772;

export default function WelcomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Inspiration: require('../../../assets/fonts/Inspiration-Regular.ttf'),
    InstrumentSerifRegular: require('../../../assets/fonts/InstrumentSerif-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  const scaleW = width / DESIGN_WIDTH;
  const scaleH = height / DESIGN_HEIGHT;
  const scale = Math.min(scaleW, scaleH);

  return (
    <LinearGradient
      colors={['#FFD3A9', '#F05822']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <View
        style={[
          styles.logoContainer,
          {
            top: 58 * scaleH,
          },
        ]}
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={{
            width: 112 * scaleW,
            height: 53 * scaleW,
          }}
          resizeMode="contain"
        />
      </View>

      <View style={styles.centerWrapper}>
        <View
          style={[
            styles.content,
            {
              paddingHorizontal: 20 * scaleW,
            },
          ]}
        >
          <Text
            style={[
              styles.welcome,
              {
                fontSize: 92 * scale,
                lineHeight: 92 * scale,
              },
            ]}
          >
            Welcome
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                marginTop: 12 * scaleH,
                fontSize: 18 * scale,
                lineHeight: 24 * scale,
              },
            ]}
          >
            You’re the heart of great service
          </Text>
        </View>
      </View>

      <Image
        source={require('../../../assets/waiter/waiter.png')}
        style={[
          styles.waiterImage,
          {
            width: width,
            height: 376 * scaleH,
          },
        ]}
        resizeMode="cover"
      />

      <View
        style={[
          styles.bottomSection,
          {
            bottom: 42 * scaleH,
            paddingHorizontal: 24 * scaleW,
          },
        ]}
      >
        <Pressable
          style={[
            styles.button,
            {
              height: 58 * scaleH,
              borderRadius: 999,
              marginBottom: 34 * scaleH,
            },
          ]}
          onPress={() => navigation.navigate('WaiterSelection')}
        >
          <Text
            style={[
              styles.buttonText,
              {
                fontSize: 17 * scale,
                lineHeight: 22 * scale,
              },
            ]}
          >
            Get Started
          </Text>
        </Pressable>

        <Text
          style={[
            styles.footerText,
            {
              fontSize: 16 * scale,
              lineHeight: 21 * scale,
            },
          ]}
        >
          Let’s make every guest feel special!
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  logoContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 3,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  welcome: {
    fontFamily: 'Inspiration',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'InstrumentSerifRegular',
    color: '#1F130D',
    textAlign: 'center',
  },
  waiterImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.18,
  },
  bottomSection: {
    position: 'absolute',
    width: '100%',
    zIndex: 4,
  },
  button: {
    width: '100%',
    backgroundColor: '#992D06',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  footerText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '400',
  },
});