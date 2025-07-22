import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  ActivityIndicator,
  Animated,
  Platform
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../theme';

/**
 * UK Address Autocomplete Component
 * Uses postcodes.io API for UK address lookup
 */
const AddressAutocomplete = ({
  value,
  onSelect,
  placeholder = 'Enter your postcode',
  label = 'Postcode',
  required = true,
  error,
  style
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestionOpacity = useRef(new Animated.Value(0)).current;
  const suggestionHeight = useRef(new Animated.Value(0)).current;
  
  // Handle external value changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value || '');
    }
  }, [value]);
  
  // Animate suggestions visibility
  useEffect(() => {
    Animated.parallel([
      Animated.timing(suggestionOpacity, {
        toValue: showSuggestions ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(suggestionHeight, {
        toValue: showSuggestions ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [showSuggestions]);
  
  // Search for addresses based on postcode
  const searchAddresses = async (postcode) => {
    if (!postcode || postcode.length < 5) {
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Use postcodes.io API to lookup addresses by postcode
      const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}/autocomplete`);
      const data = await response.json();
      
      if (data.result && Array.isArray(data.result)) {
        // Get full address details for the first few results
        const detailedAddresses = await Promise.all(
          data.result.slice(0, 5).map(async (code) => {
            try {
              const detailResponse = await fetch(`https://api.postcodes.io/postcodes/${code}`);
              const detailData = await detailResponse.json();
              
              if (detailData.result) {
                return {
                  postcode: detailData.result.postcode,
                  line1: detailData.result.thoroughfare || '',
                  city: detailData.result.admin_district || detailData.result.parish || '',
                  county: detailData.result.admin_county || '',
                  country: 'United Kingdom',
                  formatted: `${detailData.result.thoroughfare || ''}, ${detailData.result.admin_district || detailData.result.parish || ''}, ${detailData.result.postcode}`
                };
              }
              return null;
            } catch (error) {
              console.error('Error fetching address details:', error);
              return null;
            }
          })
        );
        
        setSuggestions(detailedAddresses.filter(Boolean));
        setShowSuggestions(detailedAddresses.filter(Boolean).length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input changes with debounce
  const handleChangeText = (text) => {
    setQuery(text);
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchAddresses(text);
    }, 500);
    
    setDebounceTimeout(timeout);
  };
  
  // Handle address selection
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setQuery(address.postcode);
    setShowSuggestions(false);
    
    if (onSelect) {
      onSelect(address);
    }
  };
  
  // Handle input focus
  const handleFocus = () => {
    setFocused(true);
    if (query && query.length >= 5) {
      searchAddresses(query);
    }
  };
  
  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setFocused(false);
      setShowSuggestions(false);
    }, 200);
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Label removed as per user request */}
      
      <View style={[
        styles.inputContainer,
        focused && styles.inputContainerFocused,
        error && styles.inputContainerError
      ]}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="characters"
        />
        
        {loading ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : (
          focused && <FontAwesome name="search" size={16} color={colors.grey} />
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Animated.View 
        style={[
          styles.suggestionsContainer,
          {
            opacity: suggestionOpacity,
            maxHeight: suggestionHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200]
            }),
          }
        ]}
      >
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.postcode}
          renderItem={({ item }) => (
            <Pressable
              style={styles.suggestionItem}
              onPress={() => handleSelectAddress(item)}
            >
              <Text style={styles.suggestionText}>{item.formatted}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            query.length >= 5 && !loading ? (
              <Text style={styles.noResultsText}>No addresses found</Text>
            ) : null
          }
        />
      </Animated.View>
      
      {selectedAddress && (
        <View style={styles.selectedAddressContainer}>
          <Text style={styles.selectedAddressTitle}>Selected Address:</Text>
          <Text style={styles.selectedAddressText}>{selectedAddress.line1}</Text>
          <Text style={styles.selectedAddressText}>{selectedAddress.city}</Text>
          <Text style={styles.selectedAddressText}>{selectedAddress.postcode}</Text>
          
          <Pressable
            style={styles.changeAddressButton}
            onPress={() => {
              setSelectedAddress(null);
              setQuery('');
              setFocused(true);
            }}
          >
            <Text style={styles.changeAddressText}>Change address</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.darkText,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    height: 48, // Ensure consistent height with FormField
  },
  inputContainerFocused: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.darkText,
    paddingVertical: 0, // Remove default padding for better alignment
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  suggestionsContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.darkText,
  },
  noResultsText: {
    padding: 12,
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
  selectedAddressContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  selectedAddressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.darkText,
  },
  selectedAddressText: {
    fontSize: 14,
    color: colors.darkText,
    marginBottom: 2,
  },
  changeAddressButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  changeAddressText: {
    fontSize: 14,
    color: colors.gold,
    fontWeight: '500',
  },
});

export default AddressAutocomplete;
