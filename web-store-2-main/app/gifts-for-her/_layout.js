import { Stack } from 'expo-router';
import { colors } from '../../theme';

export default function GiftsForHerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.gold,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitle: 'Gifts for Her',
      }}
    />
  );
}
