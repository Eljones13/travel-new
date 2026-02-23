import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
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
    </Tabs>
  );
}
