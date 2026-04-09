import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Waiter } from '../../types/waiter';
import { getWaiters } from '../../services/api/waiterApi';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'WaiterSelection'>;

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 772;

export default function WaiterSelectionScreen({ navigation }: Props) {
  const { ensureValidToken, setSelectedWaiter } = useAppContext();
  const { width, height } = useWindowDimensions();

  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loadingWaiters, setLoadingWaiters] = useState(true);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const scaleW = width / DESIGN_WIDTH;
  const scaleH = height / DESIGN_HEIGHT;
  const scale = Math.min(scaleW, scaleH);

  const loadWaiters = async () => {
    try {
      const token = await ensureValidToken();
      const data = await getWaiters(token || undefined);
      setWaiters(data);
    } catch (error: any) {
      Alert.alert(
        'Failed to load waiters',
        error?.message || 'Please try again'
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingWaiters(true);
        await loadWaiters();
      } finally {
        setLoadingWaiters(false);
      }
    };

    init();
  }, []);

  const filteredWaiters = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return waiters;

    return waiters.filter((waiter) =>
      (waiter.email || waiter.name).toLowerCase().includes(keyword)
    );
  }, [searchText, waiters]);

  const handleContinue = () => {
    const waiter = waiters.find((item) => item.id === selectedWaiterId);

    if (!waiter) {
      Alert.alert('Please select a waiter');
      return;
    }

    setSelectedWaiter(waiter);

    navigation.navigate('WaiterPin', {
      waiterName: waiter.email || waiter.name,
    });
  };

  const handleSelectWaiter = (waiter: Waiter) => {
    setSelectedWaiterId(waiter.id);
    setSearchText(waiter.email || waiter.name);
    setDropdownOpen(false);
  };

  const handleToggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const renderWaiter = ({ item }: { item: Waiter }) => {
    const isSelected = selectedWaiterId === item.id;

    return (
      <Pressable
        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
        onPress={() => handleSelectWaiter(item)}
      >
        <Text
          style={[
            styles.dropdownItemText,
            isSelected && styles.dropdownItemTextSelected,
            { fontSize: 16 * scale },
          ]}
        >
          {item.email || item.name}
        </Text>
      </Pressable>
    );
  };

  if (loadingWaiters) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#F05822" />
        <Text style={styles.loadingText}>Loading waiters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <Text
          style={[
            styles.loginText,
            {
              fontSize: 16 * scale,
              marginBottom: 24 * scaleH,
            },
          ]}
        >
          Let’s login!
        </Text>

        {!dropdownOpen ? (
          <Pressable
            style={[
              styles.closedInputContainer,
              {
                minHeight: 45 * scaleH,
                borderRadius: 18 * scale,
                paddingHorizontal: 18 * scaleW,
              },
            ]}
            onPress={handleToggleDropdown}
          >
            <TextInput
              style={[
                styles.searchInput,
                {
                  fontSize: 14 * scale,
                  fontStyle:'italic',
                },
              ]}
              placeholder="Select your name here..."
              placeholderTextColor="#B2B2B2"
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
            />

            <View style={styles.arrowButton}>
              <Image
                source={require('../../../assets/icons/arrow-down.png')}
                style={{
                  width: 32 * scale,
                  height: 32 * scale,
                  tintColor: '#F05822',
                }}
                resizeMode="contain"
              />
            </View>
          </Pressable>
        ) : (
          <View
            style={[
              styles.openDropdownCard,
              {
                borderRadius: 24 * scale,
                padding: 14 * scale,
                minHeight: 250 * scaleH,
                maxHeight: 320 * scaleH,
              },
            ]}
          >
            <View
              style={[
                styles.openSearchBar,
                {
                  minHeight: 50 * scaleH,
                  borderRadius: 16 * scale,
                  paddingHorizontal: 16 * scaleW,
                  marginBottom: 12 * scaleH,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    fontSize: 14 * scale,
                    fontStyle:'italic',
                  },
                ]}
                placeholder="Search here!"
                placeholderTextColor="#B2B2B2"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />

              <View style={styles.searchIconWrap}>
                <Image
                  source={require('../../../assets/icons/search.png')}
                  style={{
                    width: 24 * scale,
                    height: 24 * scale,
                    tintColor: '#F05822',
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <FlatList
              data={filteredWaiters}
              keyExtractor={(item) => item.id}
              renderItem={renderWaiter}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.dropdownListContent}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text
                    style={[
                      styles.emptyText,
                      {
                        fontSize: 14 * scale,
                      },
                    ]}
                  >
                    No waiters found.
                  </Text>
                </View>
              }
            />

            <Pressable
              style={styles.bottomArrowWrap}
              onPress={handleToggleDropdown}
              hitSlop={12}
            >
              <Image
                source={require('../../../assets/icons/arrow-up.png')}
                style={{
                  width: 32 * scale,
                  height: 32 * scale,
                  tintColor: '#F05822',
                }}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        )}
      </View>

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

      {selectedWaiterId && (
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
              styles.continueButton,
              {
                height: 56 * scaleH,
                borderRadius: 999,
              },
            ]}
            onPress={handleContinue}
          >
            <Text
              style={[
                styles.continueButtonText,
                {
                  fontSize: 17 * scale,
                },
              ]}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    overflow: 'hidden',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 15,
    fontFamily: 'Inter',
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

  loginText: {
    color: '#F05822',
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  closedInputContainer: {
    width: '100%',
    backgroundColor: '#EAEAEA',
    flexDirection: 'row',
    alignItems: 'center',
  },

  openDropdownCard: {
    width: '100%',
    backgroundColor: '#DCDCDC',
    justifyContent: 'flex-start',
  },

  openSearchBar: {
    width: '100%',
    backgroundColor: '#F4F4F4',
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    color: '#2E2E2E',
    fontFamily: 'InstrumentSerif-Regular',
    paddingVertical: 0,
  },

  arrowButton: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchIconWrap: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownListContent: {
    paddingTop: 4,
    paddingBottom: 28,
  },

  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },

  dropdownItemSelected: {
    backgroundColor: '#EFE7E2',
    borderRadius: 12,
  },

  dropdownItemText: {
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '400',
  },

  dropdownItemTextSelected: {
    color: '#F05822',
    fontWeight: '600',
  },

  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  emptyText: {
    color: '#8B8B8B',
    fontFamily: 'Inter',
  },

  bottomArrowWrap: {
    position: 'absolute',
    right: 18,
    bottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  waiterImage: {
    position: 'absolute',
    right: -8,
    bottom: 0,
    opacity: 0.12,
    zIndex: 1,
  },

  bottomSection: {
    position: 'absolute',
    width: '100%',
    zIndex: 6,
  },

  continueButton: {
    width: '100%',
    backgroundColor: '#F05822',
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});