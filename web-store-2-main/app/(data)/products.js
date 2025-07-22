// app/data/products.js
// Product definitions and local image mappings (AVIF for web, fallback to ExpoImage for all platforms)
const PRODUCTS = [
  { 
    id: '1-bracelets', 
    title: '1CT Angel Wings Charm Diamond GRA VVs1 Moissanite S925 Sterling Silver Bracelet - Perfect Gift for Her', 
    price: '£65', 
    category: 'Bracelets', 
    image: require('../../assets/images/products/1-1-bracelets.avif'),
    tags: ['gift for her', 'womens gifts', 'birthday gift'],
    short_description: 'Elegant angel wings bracelet, ideal as a thoughtful gift for her on any special occasion.',
    gift_occasion: ['birthday', 'anniversary', 'valentines']
  },
  { 
    id: '1-earrings', 
    title: 'Fringe Earrings 0.5CT Moissanite S925 Sterling Silver Drop Earrings - Luxury Gift for Her', 
    price: '£75', 
    category: 'Earrings', 
    image: require('../../assets/images/products/1-1-earrings.avif'), 
    shipping: ['next_day'],
    tags: ['gift for her', 'womens gifts', 'luxury gift'],
    short_description: 'Stunning fringe earrings that make the perfect gift for the special woman in your life.',
    gift_occasion: ['birthday', 'anniversary', 'christmas']
  },
  { 
    id: '1-necklaces', 
    title: '1Ct Butterfly Pendant Diamond VVs1 Moissanite 925 Sterling Silver - Gift for Her', 
    price: '£70', 
    category: 'Necklaces', 
    image: require('../../assets/images/products/1-1-Necklace.avif'), 
    shipping: ['next_day'],
    tags: ['gift for her', 'womens gifts', 'romantic gift'],
    short_description: 'Beautiful butterfly pendant necklace, a meaningful gift for her that she will cherish.',
    gift_occasion: ['birthday', 'anniversary', 'valentines']
  },
  { 
    id: '1-rings', 
    title: 'Fine Opal Jewel Rhinestone Gemstone 925 Sterling Silver Ring - Gift for Her', 
    price: '£55', 
    category: 'Rings', 
    image: require('../../assets/images/products/1-1-ring.avif'),
    tags: ['gift for her', 'womens gifts', 'special occasion'],
    short_description: 'Elegant opal ring that makes a thoughtful and memorable gift for her.',
    gift_occasion: ['birthday', 'anniversary', 'graduation']
  },
  { 
    id: '2-bracelets', 
    title: '1Ct Diamond Four Leaf Clover S925 Sterling Silver Bracelet - Gift for Her', 
    price: '£45', 
    category: 'Bracelets', 
    image: require('../../assets/images/products/2-1.avif'),
    tags: ['gift for her', 'womens gifts', 'good luck gift'],
    short_description: 'Lucky four-leaf clover bracelet, a meaningful gift for her to bring good fortune.',
    gift_occasion: ['birthday', 'graduation', 'new job']
  },
  { 
    id: '2-earrings', 
    title: '1/0.5ct Diamond Round Bright Cut Moissanite Hoop Earrings - Perfect Gift for Her', 
    price: '£65', 
    category: 'Earrings', 
    image: require('../../assets/images/products/2-1-earrings.avif'),
    tags: ['gift for her', 'womens gifts', 'elegant gift'],
    short_description: 'Sophisticated hoop earrings that make an elegant and timeless gift for her.',
    gift_occasion: ['birthday', 'anniversary', 'christmas']
  },
  { 
    id: '2-necklaces', 
    title: 'Round Pendant VVs1 Moissanite S925 Sterling Silver Necklace - Luxury Gift for Her', 
    price: '£75', 
    category: 'Necklaces', 
    image: require('../../assets/images/products/2-1-Necklace.avif'), 
    shipping: ['next_day'],
    tags: ['gift for her', 'womens gifts', 'luxury gift'],
    short_description: 'Stunning round pendant necklace, a luxurious gift for her that shows how much you care.',
    gift_occasion: ['birthday', 'anniversary', 'valentines']
  },
  { 
    id: '2-rings', 
    title: 'Opening Adjustment Heart 0.5CT Moissanite Ring - Romantic Gift for Her', 
    price: '£55', 
    category: 'Rings', 
    image: require('../../assets/images/products/2-1-ring.avif'),
    tags: ['gift for her', 'womens gifts', 'romantic gift'],
    short_description: 'Adjustable heart ring that makes a romantic and thoughtful gift for her.',
    gift_occasion: ['anniversary', 'valentines', 'proposal']
  },
  { 
    id: '3-bracelets', 
    title: '1Ct Round VVs Moissanite S925 Sterling Silver Bracelet - Special Gift for Her', 
    price: '£70', 
    category: 'Bracelets', 
    image: require('../../assets/images/products/3-1.avif'),
    tags: ['gift for her', 'womens gifts', 'special occasion'],
    short_description: 'Elegant round moissanite bracelet, a special gift for her to mark any occasion.',
    gift_occasion: ['birthday', 'anniversary', 'graduation']
  },
  { 
    id: '3-earrings', 
    title: '1/0.5ct Diamond Round Bright Cut Moissanite Hoop Earrings - Gift for Her', 
    price: '£70', 
    category: 'Earrings', 
    image: require('../../assets/images/products/3-1-earrings.avif'),
    tags: ['gift for her', 'womens gifts', 'birthday gift'],
    short_description: 'Beautiful hoop earrings that make a perfect birthday or anniversary gift for her.',
    gift_occasion: ['birthday', 'anniversary', 'christmas']
  },
  { 
    id: '3-necklaces', 
    title: '1Ct Butterfly Pendant Diamond VVs1 Moissanite Necklace - Gift for Her', 
    price: '£65', 
    category: 'Necklaces', 
    image: require('../../assets/images/products/3-1-Necklace.avif'), 
    shipping: ['next_day'],
    tags: ['gift for her', 'womens gifts', 'thoughtful gift'],
    short_description: 'Delicate butterfly pendant, a meaningful gift for her that symbolizes transformation and beauty.',
    gift_occasion: ['birthday', 'graduation', 'new beginnings']
  },
  { 
    id: '3-rings', 
    title: '0.5 Ct Diamond S925 Sterling Silver Ring - Perfect Gift for Her', 
    price: '£55', 
    category: 'Rings', 
    image: require('../../assets/images/products/3-1-ring.avif'),
    tags: ['gift for her', 'womens gifts', 'elegant gift'],
    short_description: 'Stunning diamond ring that makes an elegant and memorable gift for her.',
    gift_occasion: ['birthday', 'anniversary', 'christmas']
  },
  { 
    id: '4-bracelets', 
    title: 'S925 Silver VVs1 Moissanite Ladies Bracelet - Luxury Gift for Her', 
    price: '£65', 
    category: 'Bracelets', 
    image: require('../../assets/images/products/4-1.avif'),
    tags: ['gift for her', 'womens gifts', 'luxury gift'],
    short_description: 'Exquisite silver bracelet, a luxury gift for her that will be treasured for years.',
    gift_occasion: ['birthday', 'anniversary', 'christmas']
  },
  { 
    id: '4-necklaces', 
    title: '1Ct Round Cut Women\'s Fashion S925 Sterling Silver Necklace - Perfect Gift for Her', 
    price: '£75', 
    category: 'Necklaces', 
    image: require('../../assets/images/products/4-1-Necklace.avif'),
    tags: ['gift for her', 'womens gifts', 'fashion gift'],
    short_description: 'Stylish round cut necklace, the perfect gift for her to complement any outfit.',
    gift_occasion: ['birthday', 'anniversary', 'graduation']
  },
  { 
    id: '4-rings', 
    title: 'S925 Sterling Silver VVs1 Moissanite Diamond 1 Carat Ring - Luxury Gift for Her', 
    price: '£65', 
    category: 'Rings', 
    image: require('../../assets/images/products/4-1-ring.avif'),
    tags: ['gift for her', 'womens gifts', 'luxury gift'],
    short_description: 'Stunning 1 carat moissanite ring, a luxury gift for her that rivals the brilliance of diamonds.',
    gift_occasion: ['birthday', 'anniversary', 'engagement']
  },
];

const LOCAL_IMAGES = {
  '1-bracelets': [
    require('../../assets/images/products/1-1-bracelets.avif'),
    require('../../assets/images/products/1-2.avif'),
    require('../../assets/images/products/1-3.avif'),
    require('../../assets/images/products/1-4.avif'),
  ],
  '1-earrings': [
    require('../../assets/images/products/1-1-earrings.avif'),
    require('../../assets/images/products/1-2-earrings.avif'),
    require('../../assets/images/products/1-3-earrings.avif'),
    require('../../assets/images/products/1-4-earrings.avif'),
    require('../../assets/images/products/1-5-earrings.avif'),
  ],
  '1-necklaces': [
    require('../../assets/images/products/1-1-Necklace.avif'),
    require('../../assets/images/products/1-2-Necklace.avif'),
    require('../../assets/images/products/1-3-Necklace.avif'),
    require('../../assets/images/products/1-4-Necklace.avif'),
    require('../../assets/images/products/1-5-Necklace.avif'),
  ],
  '1-rings': [
    require('../../assets/images/products/1-1-ring.avif'),
    require('../../assets/images/products/1-2-ring.avif'),
    require('../../assets/images/products/1-3-ring.avif'),
  ],
  '2-bracelets': [
    require('../../assets/images/products/2-1.avif'),
    require('../../assets/images/products/2-2.avif'),
  ],
  '2-earrings': [
    require('../../assets/images/products/2-1-earrings.avif'),
    require('../../assets/images/products/2-2-earrings.avif'),
    require('../../assets/images/products/2-3-earrings.avif'),
    require('../../assets/images/products/2-4-earrings.avif'),
    require('../../assets/images/products/2-5-earrings.avif'),
  ],
  '2-necklaces': [
    require('../../assets/images/products/2-1-Necklace.avif'),
    require('../../assets/images/products/2-2-Necklace.avif'),
    require('../../assets/images/products/2-3-Necklace.avif'),
    require('../../assets/images/products/2-4-Necklace.avif'),
    require('../../assets/images/products/2-5-Necklace.avif'),
  ],
  '2-rings': [
    require('../../assets/images/products/2-1-ring.avif'),
    require('../../assets/images/products/2-2-ring.avif'),
    require('../../assets/images/products/2-3-ring.avif'),
    require('../../assets/images/products/2-4-ring.avif'),
    require('../../assets/images/products/2-5-ring.avif'),
  ],
  '3-bracelets': [
    require('../../assets/images/products/3-1.avif'),
    require('../../assets/images/products/3-2.avif'),
    require('../../assets/images/products/3-3.avif'),
    require('../../assets/images/products/3-4.avif'),
    require('../../assets/images/products/3-5.avif'),
  ],
  '3-earrings': [
    require('../../assets/images/products/3-1-earrings.avif'),
    require('../../assets/images/products/3-2-earrings.avif'),
    require('../../assets/images/products/3-3-earrings.avif'),
    require('../../assets/images/products/3-4-earrings.avif'),
    require('../../assets/images/products/3-5-earrings.avif'),
  ],
  '3-necklaces': [
    require('../../assets/images/products/3-1-Necklace.avif'),
    require('../../assets/images/products/3-2-Necklace.avif'),
    require('../../assets/images/products/3-3-Necklace.avif'),
    require('../../assets/images/products/3-4-Necklace.avif'),
    require('../../assets/images/products/3-5-Necklace.avif'),
  ],
  '3-rings': [
    require('../../assets/images/products/3-1-ring.avif'),
    require('../../assets/images/products/3-2-ring.avif'),
    require('../../assets/images/products/3-3-ring.avif'),
    require('../../assets/images/products/3-4-ring.avif'),
    require('../../assets/images/products/3-5-ring.avif'),
  ],
  '4-bracelets': [
    require('../../assets/images/products/4-1.avif'),
    require('../../assets/images/products/4-2.avif'),
  ],
  '4-necklaces': [
    require('../../assets/images/products/4-1-Necklace.avif'),
    require('../../assets/images/products/4-2-Necklace.avif'),
  ],
  '4-rings': [
    require('../../assets/images/products/4-1-ring.avif'),
    require('../../assets/images/products/4-2-ring.avif'),
  ],
};

function ProductsDataRoute() {
  // Default export for route compatibility (invisible data module)
  return null;
}

module.exports = {
  PRODUCTS,
  LOCAL_IMAGES,
  ProductsDataRoute
};
