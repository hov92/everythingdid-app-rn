import { Tabs } from 'expo-router';

export default function TeaTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#8b8b8b',
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          paddingBottom: 18,
          backgroundColor: '#fff',
          borderTopColor: '#ececf1',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
        }}
      />

      <Tabs.Screen
        name="dms/index"
        options={{
          title: 'DMs',
        }}
      />

      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
        }}
      />
    </Tabs>
  );
}