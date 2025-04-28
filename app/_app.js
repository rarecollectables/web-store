import React from 'react';
import { StoreProvider } from '../context/store';
import { Stack } from 'expo-router';

export default function App({ children }) {
  return (
    <StoreProvider>
      <Stack>
        {children}
      </Stack>
    </StoreProvider>
  );
}
