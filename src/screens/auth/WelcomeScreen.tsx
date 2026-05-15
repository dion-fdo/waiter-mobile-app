import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 772;

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Inspiration: require('../../../assets/fonts/Inspiration-Regular.ttf'),
    InstrumentSerifRegular: require('../../../assets/fonts/InstrumentSerif-Regular.ttf'),
  });

  const [showPlateReveal, setShowPlateReveal] = useState(true);

  const [isNavigating, setIsNavigating] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const plateAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const waiterAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(700),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.delay(1000),

      Animated.timing(plateAnim, {
        toValue: 1,
        duration: 950,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPlateReveal(false);
    });

    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 550,
        delay: 1350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(waiterAnim, {
        toValue: 1,
        duration: 1200,
        delay: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 650,
        delay: 1550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 600,
        delay: 1750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(bottomAnim, {
        toValue: 1,
        duration: 650,
        delay: 1950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const scaleW = width / DESIGN_WIDTH;
  const scaleH = height / DESIGN_HEIGHT;
  const scale = Math.min(scaleW, scaleH);

  const plateImage = require('../../../assets/waiter/plate.png');

  const plateSize = width * 0.72;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 25,
      bounciness: 5,
    }).start();
  };

  const handleGetStarted = () => {
    if (isNavigating) return;

    setIsNavigating(true);

    // show loading gif
    setShowLoader(true);

    // small smooth button animation
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 22,
        bounciness: 4,
      }),
    ]).start();

    // wait a bit while loader plays
    setTimeout(() => {
      navigation.navigate('WaiterSelection');

      // reset AFTER navigation
      setTimeout(() => {
        setShowLoader(false);
        setIsNavigating(false);
      }, 300);
    }, 1000);
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 5,
    }).start();
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#ffddbe', '#F05822']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        {/* LOGO */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              top: 58 * scaleH,
              opacity: logoAnim,
              transform: [
                {
                  translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-18, 0],
                  }),
                },
              ],
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
        </Animated.View>

        {/* CENTER CONTENT */}
        <View style={styles.centerWrapper}>
          <View
            style={[
              styles.content,
              {
                paddingHorizontal: 20 * scaleW,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.welcome,
                {
                  fontSize: 92 * scale,
                  lineHeight: 92 * scale,
                  opacity: welcomeAnim,
                  transform: [
                    {
                      translateY: welcomeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [26, 0],
                      }),
                    },
                    {
                      scale: welcomeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.94, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              Welcome
            </Animated.Text>

            <Animated.Text
              style={[
                styles.subtitle,
                {
                  marginTop: 12 * scaleH,
                  fontSize: 18 * scale,
                  lineHeight: 24 * scale,
                  opacity: subtitleAnim,
                  transform: [
                    {
                      translateY: subtitleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              You’re the heart of great service
            </Animated.Text>
          </View>
        </View>

        {/* WAITER IMAGE */}
        <Animated.Image
          source={require('../../../assets/waiter/waiter.png')}
          style={[
            styles.waiterImage,
            {
              width: width,
              height: 376 * scaleH,
              opacity: waiterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.18],
              }),
              transform: [
                {
                  translateY: waiterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [45, 0],
                  }),
                },
                {
                  scale: waiterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.06, 1],
                  }),
                },
              ],
            },
          ]}
          resizeMode="cover"
        />

        {/* BOTTOM */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              bottom: Math.max(insets.bottom + 16, 42 * scaleH),
              paddingHorizontal: 24 * scaleW,
              opacity: bottomAnim,
              transform: [
                {
                  translateY: bottomAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              style={[
                styles.button,
                {
                  height: 58 * scaleH,
                  borderRadius: 999,
                  marginBottom: 34 * scaleH,
                },
              ]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleGetStarted}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.buttonShine,
                  {
                    transform: [
                      {
                        translateX: shineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-width, width],
                        }),
                      },
                      { rotate: '18deg' },
                    ],
                  },
                ]}
              />

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
          </Animated.View>

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
        </Animated.View>
      </LinearGradient>

      {/* PLATE SPLIT REVEAL */}
      {showPlateReveal && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.revealOverlay,
            {
              opacity: plateAnim.interpolate({
                inputRange: [0, 0.75, 1],
                outputRange: [1, 1, 0],
              }),
            },
          ]}
        >
          {/* LEFT HALF */}
          <Animated.View
            style={[
              styles.curtainHalf,
              {
                left: 0,
                transform: [
                  {
                    translateX: plateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -width],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.plateHalf,
                {
                  width: plateSize / 2,
                  height: plateSize,
                  right: 0,
                  top: (height - plateSize) / 2,
                  transform: [
                    {
                      rotate: plateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-12deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={plateImage}
                style={{
                  width: plateSize,
                  height: plateSize,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>

          {/* RIGHT HALF */}
          <Animated.View
            style={[
              styles.curtainHalf,
              {
                right: 0,
                transform: [
                  {
                    translateX: plateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, width],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.plateHalf,
                {
                  width: plateSize / 2,
                  height: plateSize,
                  left: 0,
                  top: (height - plateSize) / 2,
                  transform: [
                    {
                      rotate: plateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '12deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={plateImage}
                style={{
                  width: plateSize,
                  height: plateSize,
                  transform: [{ translateX: -plateSize / 2 }],
                }}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}

      {showLoader && (
        <View style={styles.loaderOverlay}>
          <Image
            source={require('../../../assets/loading.gif')}
            style={styles.loaderGif}
            resizeMode="contain"
          />

          <Text style={styles.loaderText}>Loading</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F05822',
  },

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
    overflow: 'hidden',
  },

  buttonShine: {
    position: 'absolute',
    width: 70,
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },

  buttonInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.08)',
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

  revealOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
    flexDirection: 'row',
  },

  plateHalf: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },

  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  loaderGif: {
    width: 100,
    height: 100,
  },

  loaderText: {
    marginTop: 12,
    fontSize: 18,
    color: '#F05822',
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  curtainHalf: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: '#F05822',
    overflow: 'hidden',
  },
});