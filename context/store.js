import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase/client';

// Initialize store context with error handling
const StoreContext = createContext();

// Track last visited non-tab route (not persisted)
let lastVisitedRoute = null;

// Generate a unique session ID
const generateSessionId = () => {
  return `guest_${Math.random().toString(36).substring(2)}_${Date.now()}`;
};

// Initialize store with guest session support
const initializeStore = async () => {
  try {
    // Get or create guest session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no authenticated session, create a guest session
    if (!session) {
      const sessionId = generateSessionId();
      const { data: guestSession, error: guestError } = await supabase
        .from('guest_sessions')
        .insert({
          session_id: sessionId,
          last_active_at: new Date().toISOString()
        })
        .select()
        .single();

      if (guestError) {
        console.error('Error creating guest session:', guestError);
        return false;
      }

      console.log('Guest session created:', guestSession);
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize store:', error);
    return false;
  }
};

// Types
// export interface Product {
//   id: string;
//   title: string;
//   price: string;
//   category: string;
//   description?: string;
// }

// interface State {
//   cart: Product[];
//   wishlist: Product[];
//   lastAddedToCart: { id: string; ts: number } | null;
//   lastAddedToWishlist: { id: string; ts: number } | null;
// }

// interface StoreContextProps extends State {
//   addToCart: (product: Product) => void;
//   addToWishlist: (product: Product) => void;
//   removeFromCart: (id: string) => void;
//   removeFromWishlist: (id: string) => void;
//   updateCartItem: (id: string, quantity: number) => void;
//   updateWishlistItem: (id: string, quantity: number) => void;
//   setCart: (cartItems: Product[]) => void;
// }

const STORAGE_KEY = 'RARE_COLLECTABLES_STORE';

const initialState = {
  cart: [],
  wishlist: [],
  lastAddedToCart: null,
  lastAddedToWishlist: null,
};

// Helper function to ensure arrays are valid
const ensureArray = (value) => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value;
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.cart.find(item => item.id === action.product.id);
      let updatedCart;
      if (existing) {
        updatedCart = state.cart.map(item =>
          item.id === action.product.id
            ? { 
                ...item, 
                quantity: (item.quantity || 1) + 1,
                price: typeof action.product.price === 'number' 
                  ? action.product.price 
                  : parseFloat(action.product.price.replace(/[£\s]/g, '')) || 0
              }
            : item
        );
      } else {
        updatedCart = [...state.cart, { 
          ...action.product, 
          quantity: action.product.quantity || 1,
          price: typeof action.product.price === 'number' 
            ? action.product.price 
            : parseFloat(action.product.price.replace(/[£\s]/g, '')) || 0
        }];
      }
      return { 
        ...state, 
        cart: ensureArray(updatedCart), 
        lastAddedToCart: { id: action.product.id, ts: Date.now() } 
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: ensureArray(state.cart.filter(item => item.id !== action.id))
      };
    case 'ADD_TO_WISHLIST': {
      if (state.wishlist.find(item => item.id === action.product.id)) return state;
      return { 
        ...state, 
        wishlist: ensureArray([...state.wishlist, action.product]), 
        lastAddedToWishlist: { id: action.product.id, ts: Date.now() } 
      };
    }
    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: ensureArray(state.wishlist.filter(item => item.id !== action.id))
      };
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: ensureArray(state.cart.map(item =>
          item.id === action.id ? { ...item, quantity: action.quantity } : item
        ))
      };
    case 'UPDATE_WISHLIST_ITEM':
      return {
        ...state,
        wishlist: ensureArray(state.wishlist.map(item =>
          item.id === action.id ? { ...item, quantity: action.quantity } : item
        ))
      };
    case 'HYDRATE':
      return { 
        ...state, 
        cart: ensureArray(action.payload.cart),
        wishlist: ensureArray(action.payload.wishlist)
      };
    default:
      return state;
  }
}

const getItem = async (key) => {
  try {
    if (Platform.OS === 'web') {
      const value = window.localStorage.getItem(key);
      return value;
    } else {
      const value = await SecureStore.getItemAsync(key)
      return value;
    }
  } catch (error) {
    console.error('Error getting item:', error);
    return null;
  }
};

const setItem = async (key, value) => {
  try {
    const toSave = typeof value === 'string' ? value : JSON.stringify(value);
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, toSave);
    } else {
      await SecureStore.setItemAsync(key, toSave);
    }
  } catch (error) {
    console.error('Error setting item:', error);
  }
};

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate state from storage
  useEffect(() => {
    (async () => {
      try {
        const data = await getItem(STORAGE_KEY);
        if (data) {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (parseErr) {
            console.error('[store.js] Error parsing stored data:', parseErr, data);
            parsedData = {};
          }

          dispatch({ 
            type: 'HYDRATE', 
            payload: {
              cart: ensureArray(parsedData.cart),
              wishlist: ensureArray(parsedData.wishlist)
            }
          });
        }
      } catch (error) {
        console.error('Error loading store:', error);
      }
    })();
  }, []);

  // Persist state
  useEffect(() => {
    (async () => {
      try {
        await setItem(STORAGE_KEY, JSON.stringify({
          cart: ensureArray(state.cart),
          wishlist: ensureArray(state.wishlist)
        }));

      } catch (error) {
        console.error('Error saving store:', error);
      }
    })();
  }, [state.cart, state.wishlist]);

  const value = {
    ...state,
    cart: ensureArray(state.cart),
    wishlist: ensureArray(state.wishlist),
    addToCart: (product) => dispatch({ type: 'ADD_TO_CART', product }),
    removeFromCart: (id) => dispatch({ type: 'REMOVE_FROM_CART', id }),
    addToWishlist: (product) => dispatch({ type: 'ADD_TO_WISHLIST', product }),
    removeFromWishlist: (id) => dispatch({ type: 'REMOVE_FROM_WISHLIST', id }),
    updateCartItem: (id, quantity) => dispatch({ type: 'UPDATE_CART_ITEM', id, quantity }),
    updateWishlistItem: (id, quantity) => dispatch({ type: 'UPDATE_WISHLIST_ITEM', id, quantity }),
    lastVisitedRoute,
    setLastVisitedRoute: (route) => { lastVisitedRoute = route; },
    setCart: (cartItems) => dispatch({ type: 'HYDRATE', payload: { cart: cartItems, wishlist: ensureArray(state.wishlist) } })
  };



  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
