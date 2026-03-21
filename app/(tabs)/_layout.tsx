import { Tabs } from 'expo-router';
import { Colors } from '@/theme/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const c = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.tint,
        tabBarInactiveTintColor: c.tabIconDefault,
        headerShown: false,
        headerStyle: {
          backgroundColor: c.background,
        },
        headerTintColor: c.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 52 : 60,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 2 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '记录',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: '问答',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: '统计',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          headerShown: true,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
