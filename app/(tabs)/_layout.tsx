import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Flash Square Game',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gamecontroller.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="game1"
        options={{
          title: 'Flash Square',
          tabBarButton: () => null, // Hide from tab bar
        }}
        />
      <Tabs.Screen
        name="game2"
        options={{
          title: 'memory match',
          tabBarButton: () => null, // Hide from tab bar
        }}
/>
<Tabs.Screen
        name="game3"
        options={{
          title: 'stamina',
          tabBarButton: () => null, // Hide from tab bar
        }}
/>
    </Tabs>
    
  );
}


