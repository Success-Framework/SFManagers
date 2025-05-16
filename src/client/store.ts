import { configureStore } from '@reduxjs/toolkit';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define initial state type
interface AppState {
  // Basic application state
  isLoading: boolean;
  error: string | null;
}

// Create a simple slice with initial state
const appSlice = createSlice({
  name: 'app',
  initialState: {
    isLoading: false,
    error: null
  } as AppState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

// Export actions for use in components
export const { setLoading, setError, clearError } = appSlice.actions;

// Create and configure the store
export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
  // Ensure proper middleware is configured
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 