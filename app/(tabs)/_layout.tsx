import { Tabs } from 'expo-router';
import { Colors } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '主页',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '记录',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />
        }}
      />
      <Tabs.Screen
        name="qa-chat"
        options={{
          title: '问答',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="info.bubble.fill" color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '个人',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />
        }}
      />
      {/*
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: 'Explore',
        }}
      />
      */}
    </Tabs>
  );
}
