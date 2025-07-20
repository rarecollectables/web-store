const PRODUCTS = [
  { id: '1-bracelets', title: '1CT Angel Wings Charm Diamond GRA VVs1 Moissanite S925 Sterling Silver Bracelet for Ladies', price: '£65', category: 'Bracelets', image: '1-1-bracelets.avif' },
  { id: '1-earrings', title: 'Fringe Earrings 0.5CT Moissanite S925 Sterling Silver Drop Earrings Dangle for Women', price: '£75', category: 'Earrings', image: '1-1-earrings.avif' },
  { id: '1-necklaces', title: '1Ct butterfly Pendant Diamond VVs1 Moissanite 925 Sterling Silver', price: '£70', category: 'Necklaces', image: '1-1-Necklace.avif' },
  { id: '1-rings', title: 'Fine Opal Jewel Rhinestone Gemstone 925 Sterling Silver', price: '£55', category: 'Rings', image: '1-1-ring.avif' },
  { id: '2-bracelets', title: '1Ct Diamond Four Leaf Clover S925 Sterling Silver VVs1 Moissanite Bracelet for Women', price: '£45', category: 'Bracelets', image: '2-1.avif' },
  { id: '2-earrings', title: '1/0.5ct Diamond Round Bright Cut VVVs1 Moissanite S925 Sterling Silver Hoop Drop Earrings', price: '£65', category: 'Earrings', image: '2-1-earrings.avif' },
  { id: '2-necklaces', title: 'Round Pendant VVs1 Moissanite Necklace S925 Sterling Silver Necklace', price: '£75', category: 'Necklaces', image: '2-1-Necklace.avif' },
  { id: '2-rings', title: 'Opening Adjustment Heart 0.5CT Moissanite S925 Sterling Silver Ring VVs1', price: '£55', category: 'Rings', image: '2-1-ring.avif' },
  { id: '3-bracelets', title: '1Ct Round VVs Moissanite S925 Sterling Silver Bracelet for Women', price: '£70', category: 'Bracelets', image: '3-1.avif' },
  { id: '3-earrings', title: '1/0.5ct Diamond Round Bright Cut VVVs1 Moissanite S925 Sterling Silver Hoop Drop Earrings', price: '£70', category: 'Earrings', image: '3-1-earrings.avif' },
  { id: '3-necklaces', title: '1Ct butterfly Pendant Diamond VVs1 Moissanite 925 Sterling Silver', price: '£65', category: 'Necklaces', image: '3-1-Necklace.avif' },
  { id: '3-rings', title: '0.5 Ct Diamond S925 Sterling Silver Ring Round Cut VVs1 Moissanite Ring for Women', price: '£55', category: 'Rings', image: '3-1-ring.avif' },
  { id: '4-bracelets', title: 'S925 Silver VVs1 Moissanite Ladies', price: '£65', category: 'Bracelets', image: '4-1.avif' },
  { id: '4-necklaces', title: '1Ct Round Cut Hot Women\'s Fashion S925 Sterling Silver Necklace VVs1 Moissanite', price: '£75', category: 'Necklaces', image: '4-1-Necklace.avif' },
  { id: '4-rings', title: 'S925 Sterling Silver VVs1 Moissanite Diamond 1 Carat Ring GRA for Women', price: '£65', category: 'Rings', image: '4-1-ring.avif' },
];

const LOCAL_IMAGES = {
  '1-bracelets': [
    '../assets/images/products/1-1-bracelets.avif',
    '../assets/images/products/1-2.avif',
    '../assets/images/products/1-3.avif',
    '../assets/images/products/1-4.avif',
  ],
  '1-earrings': [
    '../assets/images/products/1-1-earrings.avif',
    '../assets/images/products/1-2-earrings.avif',
    '../assets/images/products/1-3-earrings.avif',
    '../assets/images/products/1-4-earrings.avif',
    '../assets/images/products/1-5-earrings.avif',
  ],
  '1-necklaces': [
    '../assets/images/products/1-1-Necklace.avif',
    '../assets/images/products/1-2-Necklace.avif',
    '../assets/images/products/1-3-Necklace.avif',
    '../assets/images/products/1-4-Necklace.avif',
    '../assets/images/products/1-5-Necklace.avif',
  ],
  '1-rings': [
    '../assets/images/products/1-1-ring.avif',
    '../assets/images/products/1-2-ring.avif',
    '../assets/images/products/1-3-ring.avif',
  ],
  '2-bracelets': [
    '../assets/images/products/2-1.avif',
    '../assets/images/products/2-2.avif',
  ],
  '2-earrings': [
    '../assets/images/products/2-1-earrings.avif',
    '../assets/images/products/2-2-earrings.avif',
    '../assets/images/products/2-3-earrings.avif',
    '../assets/images/products/2-4-earrings.avif',
    '../assets/images/products/2-5-earrings.avif',
  ],
  '2-necklaces': [
    '../assets/images/products/2-1-Necklace.avif',
    '../assets/images/products/2-2-Necklace.avif',
    '../assets/images/products/2-3-Necklace.avif',
    '../assets/images/products/2-4-Necklace.avif',
    '../assets/images/products/2-5-Necklace.avif',
  ],
  '2-rings': [
    '../assets/images/products/2-1-ring.avif',
    '../assets/images/products/2-2-ring.avif',
    '../assets/images/products/2-3-ring.avif',
  ],
  '3-bracelets': [
    '../assets/images/products/3-1.avif',
    '../assets/images/products/3-2.avif',
  ],
  '3-earrings': [
    '../assets/images/products/3-1-earrings.avif',
    '../assets/images/products/3-2-earrings.avif',
    '../assets/images/products/3-3-earrings.avif',
    '../assets/images/products/3-4-earrings.avif',
    '../assets/images/products/3-5-earrings.avif',
  ],
  '3-necklaces': [
    '../assets/images/products/3-1-Necklace.avif',
    '../assets/images/products/3-2-Necklace.avif',
    '../assets/images/products/3-3-Necklace.avif',
    '../assets/images/products/3-4-Necklace.avif',
    '../assets/images/products/3-5-Necklace.avif',
  ],
  '3-rings': [
    '../assets/images/products/3-1-ring.avif',
    '../assets/images/products/3-2-ring.avif',
    '../assets/images/products/3-3-ring.avif',
  ],
  '4-bracelets': [
    '../assets/images/products/4-1.avif',
    '../assets/images/products/4-2.avif',
  ],
  '4-necklaces': [
    '../assets/images/products/4-1-Necklace.avif',
    '../assets/images/products/4-2-Necklace.avif',
    '../assets/images/products/4-3-Necklace.avif',
    '../assets/images/products/4-4-Necklace.avif',
    '../assets/images/products/4-5-Necklace.avif',
  ],
  '4-rings': [
    '../assets/images/products/4-1-ring.avif',
    '../assets/images/products/4-2-ring.avif',
    '../assets/images/products/4-3-ring.avif',
  ],
};

module.exports = {
  PRODUCTS,
  LOCAL_IMAGES
};
