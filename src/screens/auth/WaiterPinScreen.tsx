import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Image,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppContext } from '../../context/AppContext';
import { waiterLogin } from '../../services/api/authApi';

type Props = NativeStackScreenProps<RootStackParamList, 'WaiterPin'>;

export default function WaiterPinScreen({ route, navigation }: Props) {
  const { waiterName } = route.params;

  const {
    selectedWaiter,
    setSelectedWaiter,
    isLoading,
    setIsLoading,
  } = useAppContext();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);  //hide password

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Enter password');
      return;
    }

    try {
      setIsLoading(true);

      if (!selectedWaiter?.email) {
        Alert.alert('Waiter not selected');
        return;
      }

      const response = await waiterLogin({
        email: selectedWaiter.email,
        password: password.trim(),
      });

      setSelectedWaiter({
        id: String(response.user.id),
        waiterId: String(response.user.waiter_id),
        email: response.user.email,
        name: response.user.email,
      });

      navigation.navigate('TableDashboard');
    } catch (error: any) {
      Alert.alert(
        'Login failed',
        error?.message || 'Invalid email or password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const DESIGN_WIDTH = 360;
  const DESIGN_HEIGHT = 772;

  const { width, height } = useWindowDimensions();

  const scaleW = width / DESIGN_WIDTH;
  const scaleH = height / DESIGN_HEIGHT;
  const scale = Math.min(scaleW, scaleH);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View
        style={[
          styles.logoContainer,
          { top: 58 * scaleH },
        ]}
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={{
            width: 130 * scaleW,
            height: 62 * scaleW,
          }}
          resizeMode="contain"
        />
      </View>
      <View
        style={[
          styles.formArea,
          {
            top: 190 * scaleH,
            paddingHorizontal: 28 * scaleW,
          },
        ]}
      >
        <Text style={[styles.title, { fontSize: 24 * scale }]}>
          Enter Password
        </Text>

        <Text style={[styles.subtitle, { fontSize: 14 * scale }]}>
          {selectedWaiter?.email || waiterName}
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                fontSize: 14 * scale,
                paddingVertical: 14 * scaleH,
              },
            ]}
            placeholder="Enter password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Image
              source={
                showPassword
                  ? require('../../../assets/icons/eye.png')
                  : require('../../../assets/icons/hide.png') 
              }
              style={{
                width: 22 * scale,
                height: 22 * scale,
                tintColor: '#F05822',
              }}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </View>

      {true && (
        <View
          style={[
            styles.bottomSection,
            {
              bottom: 42 * scaleH,
              paddingHorizontal: 28 * scaleW,
            },
          ]}
        >
          <Pressable
            style={[
              styles.button,
              {
                height: 56 * scaleH,
                borderRadius: 999,
                backgroundColor: password.trim()
                  ? '#F97316'
                  : '#FDBA74',
              },
            ]}
            onPress={handleLogin}
            disabled={isLoading || !password.trim()}
          >
            <Text style={[styles.buttonText, { fontSize: 16 * scale }]}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </Pressable>
        </View>
      )}
          
      <Image
        source={require('../../../assets/waiter/waiter.png')}
        style={[
          styles.waiterImage,
          {
            width: width * 0.96,
            height: 390 * scaleH,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    overflow: 'hidden',
  },
  logoContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 3,
  },
  formArea: {
    position: 'absolute',
    width: '100%',
    zIndex: 5,
  },
  waiterImage: {
    position: 'absolute',
    right: -8,
    bottom: 0,
    opacity: 0.12,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', 
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
    transform: [{ translateY: -11 }],
  },
  bottomSection: {
    position: 'absolute',
    width: '100%',
    zIndex: 6,
  },
});