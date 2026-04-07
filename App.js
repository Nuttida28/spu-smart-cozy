import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider, createTheme } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import VoteScreen from './screens/VoteScreen';
import DashboardScreen from './screens/DashboardScreen';

const Tab = createBottomTabNavigator();
const theme = createTheme({ lightColors: { primary: '#007AFF' } });

const TabFAB = ({ onPress, accessibilityState, iconName }) => {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      {focused ? (
        // วงแสงด้านนอก (glow ring)
        <TouchableOpacity
          onPress={onPress}
          style={{
            top: -18,
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: 'rgba(0,122,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* วงปุ่มจริง */}
          <TouchableOpacity
            onPress={onPress}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#007AFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#007AFF',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.55,
              shadowRadius: 12,
              elevation: 12,
            }}
          >
            <Ionicons name={iconName} size={26} color="#FFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <Ionicons name={`${iconName}-outline`} size={24} color="#ADB5BD" />
      )}
    </TouchableOpacity>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#ADB5BD',
            tabBarStyle: {
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
            },
          }}
        >
          <Tab.Screen
            name="Confirm"
            component={HomeScreen}
            options={{
              tabBarButton: (props) => <TabFAB {...props} iconName="checkbox" />,
            }}
          />
          <Tab.Screen
            name="Vote"
            component={VoteScreen}
            options={{
              tabBarButton: (props) => <TabFAB {...props} iconName="chatbubble-ellipses" />,
            }}
          />
          <Tab.Screen
            name="Temperature"
            component={DashboardScreen}
            initialParams={{ roomId: null, zone: null }}
            options={{
              tabBarButton: (props) => <TabFAB {...props} iconName="thermometer" />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
