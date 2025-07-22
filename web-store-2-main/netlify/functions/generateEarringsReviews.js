const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Array of diverse reviewer personas for jewelry lovers
const reviewers = [
  { name: 'Sophia Chen', email: 'sophia.c@example.com', persona: 'minimalist jewelry enthusiast' },
  { name: 'Aisha Patel', email: 'aisha.p@example.com', persona: 'statement piece collector' },
  { name: 'Marcus Johnson', email: 'marcus.j@example.com', persona: 'fashion-forward professional' },
  { name: 'Elena Rodriguez', email: 'elena.r@example.com', persona: 'vintage jewelry lover' },
  { name: 'Zara Williams', email: 'zara.w@example.com', persona: 'sustainable fashion advocate' },
  { name: 'Jamal Thompson', email: 'jamal.t@example.com', persona: 'special occasion jewelry buyer' },
  { name: 'Olivia Kim', email: 'olivia.k@example.com', persona: 'everyday elegance seeker' },
  { name: 'Liam O\'Connor', email: 'liam.o@example.com', persona: 'gift shopper for partner' },
  { name: 'Priya Sharma', email: 'priya.s@example.com', persona: 'cultural jewelry enthusiast' },
  { name: 'Noah Garcia', email: 'noah.g@example.com', persona: 'modern minimalist' }
];

// Review templates for earrings with placeholders
const earringReviewTemplates = [
  "These {material} earrings are absolutely stunning! The craftsmanship is exceptional, and they catch the light beautifully. As someone who {persona}, I find these perfect for {occasion}. They're comfortable to wear all day, and I've received countless compliments.",
  
  "I was initially hesitant about ordering jewelry online, but these earrings exceeded my expectations. The {design_feature} design is even more beautiful in person. They have a nice weight that feels substantial without being heavy. Being a {persona}, I appreciate how these earrings {benefit}.",
  
  "These earrings have quickly become my go-to accessory. The {material} has a gorgeous sheen that elevates any outfit. What I love most is how versatile they are - I can wear them for {occasion} or {alternate_occasion}. As a {persona}, finding pieces that {benefit} is important to me.",
  
  "The attention to detail on these earrings is remarkable. The {design_feature} caught my eye immediately, and the quality is evident. They're surprisingly lightweight despite their appearance. From my perspective as a {persona}, these earrings offer the perfect balance of {quality1} and {quality2}.",
  
  "I purchased these earrings for a special {occasion} and couldn't be happier. The {material} has a beautiful luster that photographs wonderfully. They're secure and comfortable even when worn for hours. As someone who {persona}, I particularly appreciate how these {benefit}.",
  
  "These earrings are a true treasure! The {design_feature} makes them stand out from typical designs. They have a perfect size - noticeable without overwhelming my face. Being a {persona}, I value how these earrings {benefit} while still being {quality1}.",
  
  "I'm absolutely in love with these earrings! The {material} has a wonderful {quality1} that catches everyone's attention. They're versatile enough for both {occasion} and {alternate_occasion}. As a {persona}, finding jewelry that {benefit} is rare, and these deliver perfectly.",
  
  "These earrings are exquisite - the {design_feature} adds such a unique touch. They're surprisingly lightweight, making them comfortable for all-day wear. What impresses me most as a {persona} is how they {benefit} while still maintaining {quality1}. Definitely worth the investment!",
  
  "I rarely write reviews, but these earrings deserve the praise. The {material} has a beautiful {quality1} that elevates any outfit. They're perfectly sized - not too bold, not too subtle. From my perspective as a {persona}, these earrings are ideal for {occasion} while still {benefit}.",
  
  "These earrings have exceeded all my expectations! The {design_feature} is even more beautiful in person. They have a comfortable weight and the clasps are secure. As a {persona}, I appreciate jewelry that {benefit}, and these earrings do exactly that while adding {quality1} to my collection."
];

// Design features, materials, occasions, benefits, and qualities for earrings
const earringAttributes = {
  design_feature: [
    'intricate filigree', 'geometric', 'floral', 'art deco', 'minimalist', 
    'vintage-inspired', 'asymmetrical', 'nature-inspired', 'celestial', 
    'sculptural', 'cascading', 'twisted', 'hammered', 'textured', 'openwork'
  ],
  material: [
    'sterling silver', 'gold vermeil', 'rose gold', '14k gold', 'pearl', 
    'crystal-embellished', 'gemstone', 'mixed metal', 'gold-plated', 
    'rhodium-plated', 'brass', 'opal', 'jade', 'amber', 'turquoise'
  ],
  occasion: [
    'formal events', 'everyday wear', 'work meetings', 'date nights', 
    'special celebrations', 'casual outings', 'weekend brunches', 
    'evening galas', 'family gatherings', 'vacation', 'weddings'
  ],
  alternate_occasion: [
    'casual days', 'professional settings', 'romantic evenings', 
    'cultural celebrations', 'outdoor adventures', 'artistic events', 
    'social gatherings', 'quiet days at home', 'travel', 'festive occasions'
  ],
  benefit: [
    'complement my personal style', 'add a touch of elegance without overwhelming', 
    'transition seamlessly from day to night', 'make a subtle statement', 
    'bring a pop of color to neutral outfits', 'highlight my facial features', 
    'reflect my personality', 'work with multiple outfits', 
    'combine tradition with modern design', 'feel both special and wearable'
  ],
  quality1: [
    'elegance', 'uniqueness', 'versatility', 'timelessness', 'craftsmanship', 
    'sophistication', 'delicacy', 'boldness', 'artistry', 'authenticity'
  ],
  quality2: [
    'practicality', 'comfort', 'durability', 'style', 'affordability', 
    'luxury', 'simplicity', 'intricacy', 'sustainability', 'originality'
  ]
};

// Function to randomly select an item from an array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to generate a personalized review
function generatePersonalizedReview(template, productInfo, reviewer) {
  const replacements = {
    material: productInfo.material || getRandomItem(earringAttributes.material),
    design_feature: getRandomItem(earringAttributes.design_feature),
    occasion: getRandomItem(earringAttributes.occasion),
    alternate_occasion: getRandomItem(earringAttributes.alternate_occasion),
    benefit: getRandomItem(earringAttributes.benefit),
    quality1: getRandomItem(earringAttributes.quality1),
    quality2: getRandomItem(earringAttributes.quality2),
    persona: reviewer.persona
  };

  return template.replace(/{(\w+)}/g, (match, key) => {
    return replacements[key] || match;
  });
}

// Function to generate a random rating (weighted toward positive reviews)
function generateRating() {
  const weights = [0, 0, 5, 15, 80]; // 0% 1-star, 0% 2-star, 5% 3-star, 15% 4-star, 80% 5-star
  const random = Math.random() * 100;
  let cumulativeWeight = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return i + 1;
    }
  }
  
  return 5; // Default to 5 if something goes wrong
}

// Main handler function
exports.handler = async (event) => {
  try {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Fetch all products in the earrings category
    const { data: earringsProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, material')
      .eq('category', 'Earrings');

    if (productsError) {
      console.error('Error fetching earrings products:', productsError);
      return { statusCode: 500, body: JSON.stringify({ error: productsError.message }) };
    }

    if (!earringsProducts || earringsProducts.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No earrings products found' }) };
    }

    console.log(`Found ${earringsProducts.length} earrings products`);

    // Generate and insert reviews for each product
    const reviewResults = [];
    
    for (const product of earringsProducts) {
      // Generate 1-3 reviews per product
      const reviewCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < reviewCount; i++) {
        // Select a random reviewer
        const reviewer = getRandomItem(reviewers);
        
        // Select a random review template
        const template = getRandomItem(earringReviewTemplates);
        
        // Generate personalized review
        const reviewText = generatePersonalizedReview(template, product, reviewer);
        
        // Generate a rating (weighted toward positive)
        const rating = generateRating();
        
        // Insert the review into the database
        // Note: The product_id in reviews table is UUID, but products.id is TEXT
        // We need to convert the product.id to UUID format if needed
        const { data: review, error: reviewError } = await supabase
          .from('reviews')
          .insert([
            {
              product_id: product.id, // Using product.id directly as it should be compatible
              rating: rating,
              comment: reviewText,
              reviewer_name: reviewer.name,
              reviewer_email: reviewer.email,
              images: [] // No images for now
            }
          ])
          .select();

        if (reviewError) {
          console.error(`Error creating review for product ${product.id}:`, reviewError);
          reviewResults.push({ product_id: product.id, success: false, error: reviewError.message });
        } else {
          console.log(`Created review for product ${product.id}:`, review);
          reviewResults.push({ product_id: product.id, success: true, review_id: review[0].id });
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Reviews generated successfully',
        results: reviewResults
      })
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
