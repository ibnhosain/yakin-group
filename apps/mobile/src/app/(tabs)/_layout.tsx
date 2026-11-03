import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { Home, TrendingUp, Briefcase, User, Building2 } from 'lucide-react-native'

function TabIcon({ icon: Icon, focused, label }: { icon: typeof Home; focused: boolean; label: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Icon size={22} color={focused ? '#0f2d5e' : '#94a3b8'} strokeWidth={focused ? 2.5 : 1.8} />
      <Text style={{ fontSize: 10, color: focused ? '#0f2d5e' : '#94a3b8', fontWeight: focused ? '600' : '400' }}>
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} label="হোম" /> }}
      />
      <Tabs.Screen
        name="business"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Building2} focused={focused} label="ব্যবসা" /> }}
      />
      <Tabs.Screen
        name="investment"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={TrendingUp} focused={focused} label="বিনিয়োগ" /> }}
      />
      <Tabs.Screen
        name="projects"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Briefcase} focused={focused} label="প্রজেক্ট" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} label="প্রোফাইল" /> }}
      />
    </Tabs>
  )
}
