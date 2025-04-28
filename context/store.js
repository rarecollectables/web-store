import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
// }

const initialState = {
  cart: [],
  wishlist: [],
  lastAddedToCart: null,
  lastAddedToWishlist: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.cart.find(item => item.id === action.product.id);
      let updatedCart;
      if (existing) {
        updatedCart = state.cart.map(item =>
          item.id === action.product.id
            ? { ...item, quantity: (item.quantity || 1) + 1, price: typeof action.product.price === 'number' ? action.product.price : parseFloat(action.product.price) || 0, image: action.product.image }
            : item
        );
      } else {
        updatedCart = [...state.cart, { ...action.product, quantity: action.product.quantity || 1, price: typeof action.product.price === 'number' ? action.product.price : parseFloat(action.product.price) || 0, image: action.product.image }];
      }
      return { ...state, cart: updatedCart, lastAddedToCart: { id: action.product.id, ts: Date.now() } };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.id !== action.id) };
    case 'ADD_TO_WISHLIST': {
      if (state.wishlist.find(item => item.id === action.product.id)) return state;
      return { ...state, wishlist: [...state.wishlist, action.product], lastAddedToWishlist: { id: action.product.id, ts: Date.now() } };
    }
    case 'REMOVE_FROM_WISHLIST': {
      const updatedWishlist = state.wishlist.filter(item => item.id !== action.id);
      return { ...state, wishlist: updatedWishlist, lastAddedToWishlist: { id: action.id, ts: Date.now() } };
    }
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.id ? { ...item, quantity: action.quantity } : item
        ),
      };
    case 'UPDATE_WISHLIST_ITEM':
      return {
        ...state,
        wishlist: state.wishlist.map(item =>
          item.id === action.id ? { ...item, quantity: action.quantity } : item
        ),
      };
    case 'HYDRATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const StoreContext = createContext();
const STORAGE_KEY = 'RARE_COLLECTABLES_STORE';

// Cross-platform get/set helpers
async function getItem(key) {
  if (Platform.OS === 'web') {
    const value = window.localStorage.getItem(key);
    return value === null ? null : value;
  }
  return await SecureStore.getItemAsync(key);
}
async function setItem(key, value) {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate state from storage
  useEffect(() => {
    (async () => {
      const data = await getItem(STORAGE_KEY);
      if (data) {
        try {
          dispatch({ type: 'HYDRATE', payload: JSON.parse(data) });
        } catch {}
      }
    })();
  }, []);

  // Persist state
  useEffect(() => {
    setItem(STORAGE_KEY, JSON.stringify({ cart: state.cart, wishlist: state.wishlist }));
  }, [state.cart, state.wishlist]);

  function addToCart(product) {
    dispatch({ type: 'ADD_TO_CART', product });
  }
  function removeFromCart(id) {
    dispatch({ type: 'REMOVE_FROM_CART', id });
  }
  function addToWishlist(product) {
    dispatch({ type: 'ADD_TO_WISHLIST', product });
  }
  function removeFromWishlist(id) {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', id });
  }
  function updateCartItem(id, quantity) {
    dispatch({ type: 'UPDATE_CART_ITEM', id, quantity });
  }
  function updateWishlistItem(id, quantity) {
    dispatch({ type: 'UPDATE_WISHLIST_ITEM', id, quantity });
  }

  return (
    <StoreContext.Provider value={{ ...state, addToCart, removeFromCart, addToWishlist, removeFromWishlist, updateCartItem, updateWishlistItem, lastAddedToCart: state.lastAddedToCart, lastAddedToWishlist: state.lastAddedToWishlist }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
