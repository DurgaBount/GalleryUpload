import React, {useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';

interface SplashScreenProps {
  navigation: any; // Replace 'any' with the actual type of navigation prop (e.g., StackNavigationProp)
}

const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  useEffect(() => {
    // Simulate a delay or load necessary data here before navigating to the main component
    setTimeout(() => {
      navigation.navigate('MainScreen');
    }, 3000); // Change the delay time as per your requirement
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        tintColor={'white'}
        style={styles.splashImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'green',
  },
  splashImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
});

export default SplashScreen;
