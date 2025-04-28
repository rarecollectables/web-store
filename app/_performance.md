# Performance Optimization Plan for Rare Collectables Store

## 1. Lazy-load Images with expo-image
- Replace all usage of the default `Image` component with `expo-image`'s `Image` for better caching and performance.
- Use `contentFit` and `transition` props for smooth image loading.
- Ensure all product, carousel, and review images use the new component.

## 2. Profile and Optimize FlatLists/Carousels
- Use React DevTools and React Native Performance Monitor to profile slow renders.
- Memoize FlatList/Carousel item renderers with `React.memo` or `useCallback`.
- Use `getItemLayout`, `initialNumToRender`, and `windowSize` for FlatList tuning.
- Avoid anonymous functions in renderItem where possible.

## 3. Implementation Steps
- [ ] Install expo-image: `npx expo install expo-image`
- [ ] Refactor `ProductCard` (shop.js) and product carousel (product/[id].js) to use `expo-image`.
- [ ] Refactor checkout and cart images to use `expo-image`.
- [ ] Profile FlatLists/Carousels and memoize item renderers.

---

## Next Steps
1. Install expo-image.
2. Refactor product images in shop and product detail pages.
3. Profile FlatLists and carousels for render performance.
4. Memoize item renderers and optimize props.

---

This file tracks the performance optimization plan and checklist for the project.
