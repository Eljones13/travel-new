import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35', // Festival orange — survival signal colour
        tabBarStyle: { backgroundColor: '#0D0D0D', borderTopColor: '#1E1E1E' },
        headerStyle: { backgroundColor: '#0D0D0D' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pack List',
          headerTitle: 'Digital Backpack',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="suitcase" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: 'Safety',
          headerTitle: 'Safety Hub',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="shield" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="festivals"
        options={{
          title: 'Festivals',
          headerTitle: 'Festival Map',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="map-marker" size={24} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/emergency-card')}
              style={{ marginRight: 16 }}
            >
              <FontAwesome name="shield" size={22} color="#FF3E3E" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          headerTitle: 'Rave Radar',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="squad"
        options={{
          title: 'Squad',
          headerTitle: 'Squad Sync',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="users" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
