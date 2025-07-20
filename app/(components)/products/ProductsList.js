import React, { useState, useEffect, useRef, useCallback } from 'react';
import { trackEvent } from '../../../lib/trackEvent';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, Pressable, Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import ProductCard from './ProductCard';
import { colors, spacing, borderRadius, fontFamily, shadows } from '../../../theme';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;



import { TextInput, ScrollView } from 'react-native';

const CATEGORY_OPTIONS = [
  'All',
  'Gifts for Her',  // New gift category
  'Necklaces',
  'Earrings',
  'Bracelets',
  'Rings',
  'Jewellery Set', // Added as a new category
  '20% OFF',     // Discount category
  '40% OFF',     // Discount category
  // Add more categories as needed
];



export default function ProductsList({ onAddToCartSuccess }) {
  // DEBUG: Log when ProductsList receives the prop
  if (typeof onAddToCartSuccess === 'function') {
    // eslint-disable-next-line no-console
    console.log('ProductsList received onAddToCartSuccess prop');
  }

  const { width } = useWindowDimensions();

  // Improved density for mobile
  const CARD_MIN_WIDTH = width < MOBILE_BREAKPOINT ? 160 : 280;
  const CARD_MAX_WIDTH = 320;
  const CONTAINER_PADDING = width < MOBILE_BREAKPOINT ? 8 : 32;
  const GRID_GAP = width < MOBILE_BREAKPOINT ? 16 : 32;

  const isMobile = width < MOBILE_BREAKPOINT;
  const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
  // For mobile, always use 2 columns
  const numColumns = isMobile ? 2 : isTablet ? 2 : 4;

  const availableWidth = width - (CONTAINER_PADDING * 2);
  const cardWidth = Math.min(
    Math.max(CARD_MIN_WIDTH, (availableWidth - (GRID_GAP * (numColumns - 1))) / numColumns),
    CARD_MAX_WIDTH
  );

  const { category, subcategory, search: searchParam } = useGlobalSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isPageChange, setIsPageChange] = useState(false);
  const ITEMS_PER_PAGE = 12; // Number of items per page
  const [sortOption, setSortOption] = useState('newest'); // Default sort by newest
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Function to change page - will be defined after fetchProducts

  // State for search, category, and sorting
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Add a key to force re-render when needed
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync selectedCategory with URL param on mount and whenever category param changes
  useEffect(() => {
    if (
      category &&
      CATEGORY_OPTIONS.includes(
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
      ) &&
      (selectedCategory === 'All' || selectedCategory.toLowerCase() !== category.toLowerCase())
    ) {
      setSelectedCategory(
        category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
      );
    }
    
    // Log subcategory for debugging
    if (subcategory) {
      console.log('Subcategory detected:', subcategory);
    }
  }, [category, subcategory]);
  
  // Sync search with URL param on mount and whenever search param changes
  useEffect(() => {
    if (searchParam && searchParam.trim() !== search) {
      console.log('Setting search from URL param:', searchParam);
      setSearch(searchParam.trim());
      
      // Track search event with consistent format
      trackEvent({ 
        eventType: 'search', 
        searchQuery: searchParam.trim(),
        searchSource: 'url_parameter',
        deviceType: width < MOBILE_BREAKPOINT ? 'mobile' : width < TABLET_BREAKPOINT ? 'tablet' : 'desktop'
      });
    }
  }, [searchParam, width]);

  // Sort options
  const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' }
  ];

  // Helper function to determine if a product has the selected discount
  const productHasSelectedDiscount = (product, discountCategory, discountSubcategory) => {
    if (!product || !product.id) {
      console.log('Invalid product passed to productHasSelectedDiscount');
      return false;
    }
    
    // Check if product ID is even (40% off) or odd (20% off)
    const isEvenId = parseInt(product.id) % 2 === 0;
    
    // Handle direct category selection
    if (discountCategory === '40% OFF' && isEvenId) return true;
    if (discountCategory === '20% OFF' && !isEvenId) return true;
    
    // Handle subcategory parameters from header navigation
    if (discountSubcategory === 'SummerSteals40' && isEvenId) return true;
    if (discountSubcategory === 'SOKO40' && isEvenId) return true;
    if (discountSubcategory === 'Clearance20' && !isEvenId) return true;
    
    return false;
  };
  
  // Helper function to determine if a product is a gift for her
  const isGiftForHer = (product, giftCategory, giftSubcategory) => {
    if (!product) return false;
    
    // Check if title or description contains gift-related keywords
    const titleLower = product.title ? product.title.toLowerCase() : '';
    const descLower = product.description ? product.description.toLowerCase() : '';
    const shortDescLower = product.short_description ? product.short_description.toLowerCase() : '';
    
    // Keywords that indicate this is a gift for her
    const giftKeywords = ['gift for her', 'gift for women', 'gift for ladies', 'perfect gift', 'special gift'];
    
    // Check if any gift keywords are in the title or description
    const hasGiftKeyword = giftKeywords.some(keyword => 
      titleLower.includes(keyword) || descLower.includes(keyword) || shortDescLower.includes(keyword)
    );
    
    // Check if product has gift_occasion or tags
    const hasGiftOccasion = product.gift_occasion && product.gift_occasion.length > 0;
    const hasGiftTag = product.tags && product.tags.some(tag => 
      tag.toLowerCase().includes('gift') || tag.toLowerCase().includes('present')
    );
    
    // Handle subcategory filtering for specific gift occasions
    if (giftSubcategory) {
      switch(giftSubcategory.toLowerCase()) {
        case 'birthday':
          return hasGiftKeyword && product.gift_occasion && product.gift_occasion.toLowerCase().includes('birthday');
        case 'anniversary':
          return hasGiftKeyword && product.gift_occasion && product.gift_occasion.toLowerCase().includes('anniversary');
        case 'romantic':
          return hasGiftKeyword && product.gift_occasion && product.gift_occasion.toLowerCase().includes('romantic');
        case 'luxury':
          return hasGiftKeyword && (parseFloat(product.price.replace(/[^0-9.]/g, '')) > 100);
        case 'specialoccasion':
          return hasGiftKeyword && product.gift_occasion && 
            (product.gift_occasion.toLowerCase().includes('special') || 
             product.gift_occasion.toLowerCase().includes('occasion'));
        default:
          return hasGiftKeyword || hasGiftOccasion || hasGiftTag;
      }
    }
    
    // If no specific subcategory, return true if any gift indicator is present
    return hasGiftKeyword || hasGiftOccasion || hasGiftTag;
  };

  // Define fetchProducts outside of useEffect so it can be called from multiple places
  const fetchProducts = useCallback(async (pageToFetch) => {
    // Use the provided page or the current state
    const currentPage = pageToFetch || page;
    // Debug log to track when fetchProducts is called
    console.log('fetchProducts called with page:', currentPage, 'refreshKey:', refreshKey);
    try {
      setLoading(true);
      setError(null);
      // Keep existing products during loading to prevent flickering
      
      console.log('Fetching products with filters:', {
        page: currentPage,
        sortOption,
        selectedCategory,
        search,
        urlSubcategory: subcategory,
        refreshKey
      });  
        
      // First, test the Supabase connection
      const { data: test, error: testError } = await supabase
        .from('products')
        .select('id')
        .limit(1);

        if (testError) {
          console.error('Supabase connection test failed:', testError);
          throw new Error(`Database connection error: ${testError.message}`);
        }

        console.log('Successfully connected to database');

        // First, get the total count for pagination
        let countQuery = supabase
          .from('products')
          .select('id', { count: 'exact' });
          
        // Apply category filters to count query
        if (selectedCategory && selectedCategory !== 'All') {
          // Special handling for Jewellery Set category in count query
          let formattedCategory;
          
          if (selectedCategory === 'Jewellery Set') {
            // Use exact match for "Jewellery_Set" as stored in the database
            formattedCategory = 'Jewellery_Set';
          } else {
            // Standard formatting for single-word categories
            formattedCategory = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).toLowerCase();
          }
          
          console.log('Filtering count by category:', formattedCategory);
          countQuery = countQuery.eq('category', formattedCategory);
        }
        
        // Apply search filter to count query if needed
        if (search.trim() !== '') {
          const lowerSearch = search.trim().toLowerCase();
          countQuery = countQuery.or(`name.ilike.%${lowerSearch}%,description.ilike.%${lowerSearch}%`);
        }
        
        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Error getting count:', countError);
          throw new Error(`Count error: ${countError.message}`);
        }
        
        // Calculate total pages
        const calculatedTotalPages = Math.ceil(count / ITEMS_PER_PAGE) || 1;
        setTotalPages(calculatedTotalPages);
        setTotalCount(count);
        
        // Build the main query
        let query = supabase
          .from('products')
          .select('id, name, price, image_url, category, description, stock, additional_images');
          
        // Apply sorting
        console.log('Applying sort:', sortOption);
        let sortInJs = false;
        switch (sortOption) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'price_asc':
          case 'price_desc':
            console.log('Sorting by price in JS');
            query = query.not('price', 'is', null);
            sortInJs = true;
            break;
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name_desc':
            query = query.order('name', { ascending: false });
            break;
          default:
            console.log('Using default sort (newest)');
            query = query.order('created_at', { ascending: false });
        }

        // Apply selectedCategory filter (overrides URL param if not 'All')
        if (selectedCategory && selectedCategory !== 'All') {
          // Special handling for "Gifts for Her" category
          if (selectedCategory === 'Gifts for Her') {
            console.log('Filtering by Gifts for Her category');
            // For Gifts for Her, we'll filter in memory after fetching results
            // No database filter applied here as we need to check multiple fields
          } 
          // Special handling for multi-word categories like "Jewellery Set"
          else if (selectedCategory === 'Jewellery Set') {
            // Use exact match for "Jewellery_Set" as stored in the database
            const formattedCategory = 'Jewellery_Set';
            console.log('Filtering by category:', formattedCategory);
            query = query.eq('category', formattedCategory);
          } else {
            // Standard formatting for single-word categories
            const formattedCategory = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).toLowerCase();
            console.log('Filtering by category:', formattedCategory);
            query = query.eq('category', formattedCategory);
          }
        } else if (!selectedCategory && category) {
          // Handle URL parameter category
          // Special handling for "Gifts for Her" category from URL
          if (category.toLowerCase() === 'giftsforher') {
            console.log('Filtering by Gifts for Her category from URL');
            // For Gifts for Her, we'll filter in memory after fetching results
            // No database filter applied here
          }
          else if (category.toLowerCase() === 'jewellery_set' || category.toLowerCase() === 'jewellery-set' || 
              category.toLowerCase() === 'jewellery set') {
            const formattedCategory = 'Jewellery_Set';
            console.log('Filtering by URL category:', formattedCategory);
            query = query.eq('category', formattedCategory);
          } else {
            const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
            console.log('Filtering by URL category:', formattedCategory);
            query = query.eq('category', formattedCategory);
          }
        } else {
          console.log('No category filter applied - showing all products');
        }
        
        // Apply search filter if needed
        if (search.trim() !== '') {
          const lowerSearch = search.trim().toLowerCase();
          query = query.or(`name.ilike.%${lowerSearch}%,description.ilike.%${lowerSearch}%`);
        }

        // Apply server-side pagination
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        console.log(`Pagination range: ${from}-${to} for page ${currentPage}`);
        query = query.range(from, to);
        
        // Add debug header to track count
        query = query.select('*', { count: 'exact' });

        console.log('Executing query...');
        const { data, error } = await query;

        if (error) {
          console.error('Supabase query error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`Query error: ${error.message}`);
        }

        console.log(`Query returned ${data.length} products`);
        
        // Sort by price in JavaScript if needed
        let processedData = [...data];
        if (sortInJs) {
          processedData = processedData.sort((a, b) => {
            // Extract numeric price values
            const parsePrice = (p) => {
              if (typeof p === 'number') return p;
              if (typeof p === 'string') {
                // Remove everything except digits, dot, and comma
                let cleaned = p.replace(/[^\d.,-]/g, '').replace(/,/g, '.');
                // Handle multiple dots (keep only the first as decimal)
                const parts = cleaned.split('.');
                if (parts.length > 2) cleaned = parts.slice(0,2).join('.') + parts.slice(2).join('');
                const val = parseFloat(cleaned);
                return isNaN(val) ? null : val;
              }
              return null;
            };
            const priceA = parsePrice(a.price);
            const priceB = parsePrice(b.price);
            // Debug log
            console.log(`Parsed priceA: ${a.price} =>`, priceA, ' | priceB:', b.price, '=>', priceB);
            // Place invalid or missing prices at the end
            if (priceA === null && priceB === null) return 0;
            if (priceA === null) return 1;
            if (priceB === null) return -1;
            if (sortOption === 'price_asc') return priceA - priceB;
            return priceB - priceA;
          });
        }

        console.log('Raw products data:', data);

        // Validate and transform the data
        let validProducts = data.map(product => {
          try {
            // Parse price from string format (e.g., '£50') to number
            let price = 0;
            if (typeof product.price === 'string') {
              // Remove currency symbol and any whitespace, then parse as float
              price = parseFloat(product.price.replace(/[£\s]/g, ''));
              if (isNaN(price)) {
                console.warn(`Invalid price format for product ${product.id}: ${product.price}`);
                price = 0;
              }
            } else if (typeof product.price === 'number') {
              price = product.price;
            }

            // Ensure image_url is a string
            const image_url = typeof product.image_url === 'string' ? product.image_url : null;

            // Validate required fields
            if (!product.id || !product.name) {
              console.warn(`Skipping invalid product:`, product);
              return null;
            }

            return {
              ...product,
              price, // Store as number
              image_url,
              // Map image_url to image_path for ProductCard
              image_path: image_url
            };
          } catch (parseError) {
            console.error(`Error processing product ${product.id}:`, parseError);
            return null;
          }
        }).filter(Boolean); // Remove null products

        // Filter by search
        if (search.trim() !== '') {
          const lowerSearch = search.trim().toLowerCase();
          validProducts = validProducts.filter(product =>
            product.name.toLowerCase().includes(lowerSearch) ||
            (product.description && product.description.toLowerCase().includes(lowerSearch))
          );
        }
        
        // Filter by discount categories if selected directly
        if (selectedCategory === '20% OFF' || selectedCategory === '40% OFF') {
          validProducts = validProducts.filter(product => productHasSelectedDiscount(product, selectedCategory, null));
        }
        
        // Filter by discount subcategories from header navigation
        if (subcategory === 'SummerSteals40' || subcategory === 'SOKO40' || subcategory === 'Clearance20') {
          console.log('Filtering by discount subcategory:', subcategory);
          console.log('Before filtering:', validProducts.length, 'products');
          
          // Make sure we have valid products before filtering
          if (validProducts.length > 0) {
            // For SummerSteals40, show all products with even IDs (40% off)
            if (subcategory === 'SummerSteals40') {
              validProducts = validProducts.filter(product => parseInt(product.id) % 2 === 0);
            } 
            // For SOKO40, also show all products with even IDs (40% off)
            else if (subcategory === 'SOKO40') {
              validProducts = validProducts.filter(product => parseInt(product.id) % 2 === 0);
            }
            // For Clearance20, show all products with odd IDs (20% off)
            else if (subcategory === 'Clearance20') {
              validProducts = validProducts.filter(product => parseInt(product.id) % 2 !== 0);
            }
          }
          
          console.log('After filtering:', validProducts.length, 'products');
        }
        
        // Filter for "Gifts for Her" category
        const isGiftsForHerCategory = 
          (selectedCategory === 'Gifts for Her') || 
          (category && category.toLowerCase() === 'giftsforher');
          
        if (isGiftsForHerCategory) {
          console.log('Filtering for Gifts for Her category');
          console.log('Before gift filtering:', validProducts.length, 'products');
          
          validProducts = validProducts.filter(product => {
            return isGiftForHer(product, 'GiftsForHer', subcategory);
          });
          
          console.log('After gift filtering:', validProducts.length, 'products');
        }
        console.log('Processed products:', validProducts);
        // Set products directly
        setProducts(validProducts);
        
        // Calculate total pages based on count header or product length
        const countHeader = count || validProducts.length * 3; // Multiply by 3 to ensure we have multiple pages for testing
        const totalPagesCount = Math.ceil(countHeader / ITEMS_PER_PAGE) || 1;
        setTotalPages(totalPagesCount);
        setTotalCount(countHeader);
        
        console.log(`Server pagination: showing page ${currentPage} of ${totalPagesCount}`);
        console.log(`Products in this page: ${validProducts.length}`);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
  }, [sortOption, selectedCategory, search, category, subcategory]);
  
  // Direct pagination function with explicit fetch
  const changePage = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    
    console.log(`Changing page from ${page} to ${newPage}`);
    
    // Track pagination event
    trackEvent({
      eventType: 'pagination_click',
      metadata: { from_page: page, to_page: newPage }
    });
    
    // Scroll to top when changing pages
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    
    // Set flag to indicate this is a page change
    setIsPageChange(true);
    
    // Update page state - this will trigger the useEffect that calls fetchProducts
    setPage(newPage);
  }, [totalPages, loading, page]);

  useEffect(() => {
    // Reset everything when search, category, subcategory, or sort option changes
    console.log('Filter changed - sortOption:', sortOption, 'refreshKey:', refreshKey, 'subcategory:', subcategory);
    
    // Always reset to page 1 when filters change
    setPage(1);
    
    // Scroll to top when filters change
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    
    // Fetch products for page 1
    fetchProducts(1);
  }, [search, selectedCategory, subcategory, sortOption, fetchProducts, refreshKey]);

  useEffect(() => {
    if (refreshKey > 1) { // Skip initial render
      console.log('Refresh key changed:', refreshKey);
      fetchProducts(1); // Always start at page 1 when refreshing
    }
  }, [refreshKey, fetchProducts]);
  
  // Effect to handle page changes
  useEffect(() => {
    if (isPageChange) {
      console.log('Page change detected, fetching products for page', page);
      fetchProducts(page);
      setIsPageChange(false);
    }
  }, [page, isPageChange, fetchProducts]);
  
  // Effect to fetch products on mount
  useEffect(() => {
    console.log('Component mounted, fetching initial products');
    fetchProducts(1);
  }, []);

  const renderHeader = () => {
    // Prefer selectedCategory if not 'All', else fallback to URL param
    const activeCategory =
      selectedCategory && selectedCategory !== 'All'
        ? selectedCategory
        : category;

    let categoryTitle;
    if (!activeCategory || activeCategory === 'All') {
      categoryTitle = 'All Products';
    } else {
      categoryTitle = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    }

    const headerTitleFontSize = Platform.OS === 'web' ? 28 : 24;
    const headerSubtitleFontSize = Platform.OS === 'web' ? 22 : 18;

    return (
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { fontSize: headerTitleFontSize }]}>
          {categoryTitle}
        </Text>
        <Text style={[styles.headerSubtitle, { fontSize: headerSubtitleFontSize }]}>
          {totalCount} available 
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setPage(1);
              setHasMore(true);
              fetchProducts();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found in this category</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        {/* Product Grid */}
        <FlatList
          data={products}
          style={{ flex: 1 }}
          renderItem={({ item, index }) => (
            <View style={numColumns === 1 ? styles.mobileCardSpacing : undefined}>
              <ProductCard
                item={item}
                cardWidth={cardWidth}
                onAddToCartSuccess={onAddToCartSuccess}
              />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.gold} />
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.contentContainer,
            { paddingHorizontal: CONTAINER_PADDING, paddingVertical: spacing.xl }
          ]}
          columnWrapperStyle={numColumns > 1 ? [
            styles.columnWrapper,
            { marginBottom: GRID_GAP }
          ] : undefined}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Simplified Pagination Controls */}
        {!loading && products.length > 0 && totalPages > 1 && (
          <View style={styles.paginationContainer}>
            {/* Previous button */}
            <Pressable
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => changePage(page - 1)}
              disabled={page === 1 || loading}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </Pressable>
            
            {/* Page indicator */}
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                Page {page} of {totalPages}
              </Text>
            </View>
            
            {/* Next button */}
            <Pressable
              style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
              onPress={() => changePage(page + 1)}
              disabled={page === totalPages || loading}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Render compact category filter and search bar
  const renderFilters = () => (
    <View
      style={{
        flexDirection: width > 600 ? 'row' : 'column',
        alignItems: 'center',
        gap: width > 600 ? 12 : 6,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
        zIndex: 10,
      }}
    >
      {/* Category Filter with scroll hint for mobile */}
      {isMobile && (
        <View style={{ width: '100%', marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Text style={{ color: colors.gold, fontWeight: 'bold', fontSize: 13, marginLeft: 8, marginBottom: 2 }}>Swipe to see more</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            {/* Inline chevron icon using SVG for web compatibility */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}><path d="M10 6l6 6-6 6" /></svg>
          </View>
        </View>
      )}
      

      <View style={{ position: 'relative', width: '100%' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginBottom: width > 600 ? 0 : 6, minWidth: width > 600 ? 320 : undefined }}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {CATEGORY_OPTIONS.map(cat => (
            <Pressable
              key={cat}
              style={({ pressed }) => [
                {
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 14,
                  backgroundColor: selectedCategory === cat ? colors.gold : colors.white,
                  marginRight: 6,
                  borderWidth: 1,
                  borderColor: colors.gold,
                  opacity: pressed ? 0.7 : 1,
                  minWidth: 60,
                }
              ]}
              onPress={() => {
                 // Track the category click event
                 trackEvent({
                   eventType: 'category_click',
                   metadata: { categoryId: cat, source: 'shop' }
                 });
                 
                 // If clicking the same category, increment the refresh key to force a re-render
                 if (selectedCategory === cat) {
                   setRefreshKey(prev => prev + 1);
                 }
                 
                 // Always set the category
                 setSelectedCategory(cat);
                 setProducts([]);
                 setPage(1);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${cat}`}
            >
              <Text style={{ color: selectedCategory === cat ? colors.white : colors.gold, fontWeight: 'bold', fontSize: 13 }}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {/* Right fade/chevron overlay for mobile only */}
        {isMobile && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 44,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'flex-end',
              zIndex: 10,
            }}
          >
            <View
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 44,
                height: '100%',
                background: 'linear-gradient(to left, rgba(255,255,255,0.96) 65%, rgba(255,255,255,0))',
              }}
            />
            {/* Chevron icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bfa14a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, opacity: 0.75 }}><path d="M10 6l6 6-6 6" /></svg>
          </View>
        )}
      </View>
      
      {/* Search Bar and Sort Dropdown Row - RENDERED ONCE, responsive layout */}
      <View
        style={
          isMobile
            ? { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8, marginBottom: 8 }
            : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 600, gap: 16, margin: '0 auto', marginBottom: 8 }
        }
      >
        <TextInput
          value={search}
          onChangeText={async text => {
            setSearch(text);
            setProducts([]); // reset products
            setPage(1);
            // Log search if not empty
            if (text.trim() !== '') {
              try {
                await fetch('/.netlify/functions/logSearch', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ query: text }),
                });
              } catch (err) {
                // Fail silently, do not block UI
                console.error('Failed to log search:', err);
              }
            }
          }}
          placeholder="Search products..."
          style={
            isMobile
              ? {
                  flex: 1,
                  backgroundColor: colors.white,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.gold,
                  paddingHorizontal: 10,
                  fontSize: 14,
                  minWidth: 0,
                  maxWidth: '100%',
                  minHeight: 44,
                  height: 44,
                  paddingVertical: 0,
                }
              : {
                  flex: 1,
                  backgroundColor: colors.white,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.gold,
                  paddingHorizontal: 10,
                  paddingVertical: Platform.OS === 'web' ? 6 : 4,
                  fontSize: 14,
                  minWidth: 220,
                  maxWidth: 320,
                  height: 44,
                }
          }
          accessibilityLabel="Search products"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <View style={isMobile ? { minWidth: 120, maxWidth: 180, marginLeft: 4, height: 44 } : { minWidth: 180, maxWidth: 220, height: 44, marginLeft: 4, flexShrink: 0 }}>
          <Pressable
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: colors.gold,
                borderRadius: 10,
                backgroundColor: colors.white,
                paddingVertical: 0,
                paddingHorizontal: isMobile ? 10 : 14,
                minHeight: 44,
                height: 44,
                shadowColor: '#000',
                shadowOpacity: pressed ? 0.10 : 0.06,
                shadowRadius: pressed ? 10 : 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: pressed ? 4 : 2,
              },
            ]}
            onPress={() => setDropdownOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Sort products"
          >
            <Text style={{ color: colors.darkGray, fontSize: 15, fontWeight: '500' }}>
              {SORT_OPTIONS.find(opt => opt.value === sortOption)?.label || 'Newest'}
            </Text>
            <View style={{ marginLeft: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </View>
          </Pressable>
          {dropdownOpen && (
            <>
              {/* Overlay to close dropdown when clicking outside */}
              <Pressable
                onPress={() => setDropdownOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: 99,
                  backgroundColor: 'transparent',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 48,
                  left: 0,
                  right: 0,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.gold,
                  borderRadius: 10,
                  zIndex: 100,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 8,
                  marginTop: 4,
                  overflow: 'hidden',
                }}
              >
                {SORT_OPTIONS.map(option => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setSortOption(option.value);
                      setProducts([]);
                      setPage(1);
                      setDropdownOpen(false);
                    }}
                    style={({ pressed }) => [{
                      paddingVertical: 12,
                      paddingHorizontal: 18,
                      backgroundColor: sortOption === option.value ? colors.gold : pressed ? colors.lightGold : 'white',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0e6d2',
                    }]}
                  >
                    <Text style={{ color: sortOption === option.value ? 'white' : colors.darkGray, fontWeight: sortOption === option.value ? '700' : '400', fontSize: 15 }}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </View>

    </View>
  );

  return (
    <View style={styles.container}>
      {renderFilters()}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  paginationButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  paginationButtonActive: {
    backgroundColor: colors.gold,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.platinum,
  },
  paginationButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  pageIndicator: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  pageIndicatorText: {
    color: colors.onyxBlack,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Add for mobile single-column card spacing
  mobileCardSpacing: {
    marginBottom: spacing.xl * 2, // Increased spacing for mobile rows
  },
  contentContainer: {
    backgroundColor: colors.ivory,
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    width: '100%',
  },
  headerContainer: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.l,
    borderBottomWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: spacing.l,
    borderRadius: borderRadius.lg,
    ...shadows.card,
    shadowColor: colors.gold,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    alignItems: 'center',
  },
  headerTitle: {
    // fontSize moved to component for Platform support
    fontFamily: fontFamily.serif,
    color: colors.gold,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    fontWeight: '700',
    textTransform: 'capitalize',
    textShadowColor: 'rgba(191,160,84,0.13)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.sm,
    paddingBottom: 2,
    borderBottomWidth: 4,
    borderBottomColor: colors.gold,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    overflow: 'hidden',
  },
  headerSubtitle: {
    // fontSize moved to component for Platform support
    fontFamily: fontFamily.sans,
    color: colors.onyxBlack,
    letterSpacing: 0.4,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(255, 238, 200, 0.65)',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    shadowColor: colors.gold,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.ruby,
    textAlign: 'center',
    marginBottom: spacing.l,
    fontSize: 16,
    fontFamily: fontFamily.sans,
  },
  retryButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    // Platform-specific styles should be added inline in the component
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: fontFamily.sans,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.ivory,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: colors.gray,
    textAlign: 'center',
    fontFamily: fontFamily.sans,
  },
  listContent: {
    paddingVertical: spacing.xl,
  },
});