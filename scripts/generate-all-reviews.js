// Script to generate diverse reviews for all product categories
const { createClient } = require('@supabase/supabase-js');

// Function to generate reviews
async function generateAllReviews(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL and key are required');
    return;
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

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
    { name: 'Noah Garcia', email: 'noah.g@example.com', persona: 'modern minimalist' },
    { name: 'Isabella Moretti', email: 'isabella.m@example.com', persona: 'luxury accessories collector' },
    { name: 'Raj Patel', email: 'raj.p@example.com', persona: 'detail-oriented jewelry connoisseur' },
    { name: 'Emma Watson', email: 'emma.w@example.com', persona: 'ethical fashion supporter' },
    { name: 'David Kim', email: 'david.k@example.com', persona: 'anniversary gift shopper' },
    { name: 'Fatima Al-Farsi', email: 'fatima.a@example.com', persona: 'traditional jewelry appreciator' },
    { name: 'Jackson Lee', email: 'jackson.l@example.com', persona: 'trendy accessory enthusiast' },
    { name: 'Maya Diaz', email: 'maya.d@example.com', persona: 'artisanal jewelry supporter' },
    { name: 'Thomas Wright', email: 'thomas.w@example.com', persona: 'first-time fine jewelry buyer' },
    { name: 'Leila Hakimi', email: 'leila.h@example.com', persona: 'jewelry design student' },
    { name: 'Ryan O\'Neill', email: 'ryan.o@example.com', persona: 'practical accessory wearer' },
    { name: 'Amara Okafor', email: 'amara.o@example.com', persona: 'bold statement maker' },
    { name: 'Hiroshi Tanaka', email: 'hiroshi.t@example.com', persona: 'meticulous quality inspector' },
    { name: 'Gabriela Santos', email: 'gabriela.s@example.com', persona: 'colorful jewelry lover' },
    { name: 'Ahmed Hassan', email: 'ahmed.h@example.com', persona: 'thoughtful gift giver' },
    { name: 'Chloe Bennett', email: 'chloe.b@example.com', persona: 'fashion blogger' }
  ];

  // Emojis for reviews
  const reviewEmojis = [
    '✨', '💖', '😍', '🌟', '👌', '💯', '🔥', '💎', '👑', '🎁',
    '❤️', '🥰', '💕', '💫', '✅', '🙌', '👏', '🤩', '💞', '💝'
  ];

  // Generic review templates that work for all categories
  const genericReviewTemplates = [
    "I love this {product_type}! It's perfect for {occasion} and so comfortable to use. As a {persona}, I really appreciate how it {benefit}.",
    
    "This has become my favorite {product_type}. The {design_feature} detail is so beautiful, and it goes with everything. I use it all the time now.",
    
    "Just what I was looking for! This {product_type} is stylish and perfect for my needs as a {persona}.",
    
    "I get so many compliments whenever I use this. The design is unique and it's exactly what I wanted.",
    
    "This {product_type} is gorgeous! It looks much more expensive than it is. Perfect for {occasion} or just everyday use.",
    
    "This {material} {product_type} is absolutely stunning! The craftsmanship is exceptional. As someone who {persona}, I find this perfect for {occasion}.",
    
    "I was initially hesitant about ordering online, but this {product_type} exceeded my expectations. The {design_feature} design is even more beautiful in person. Being a {persona}, I appreciate how it {benefit}.",
    
    "The attention to detail on this {product_type} is remarkable. The {design_feature} caught my eye immediately, and the quality is evident. From my perspective as a {persona}, this offers the perfect balance of {quality1} and {quality2}.",
    
    "I purchased this for a special {occasion} and couldn't be happier. The {material} has a beautiful look that's even better in person. As someone who {persona}, I particularly appreciate how this {benefit}.",
    
    "I rarely write reviews, but this {product_type} deserves the praise. The {material} has a beautiful {quality1} that elevates any outfit. From my perspective as a {persona}, this is ideal for {occasion} while still {benefit}.",
    
    "Five stars aren't enough! The {material} has a gorgeous texture and quality that speaks volumes. From my perspective as a {persona}, this perfectly {benefit} while adding a touch of {quality1} to any look.",
    
    "I'm extremely picky, but this won me over immediately. The {design_feature} is beautifully executed. As a {persona}, I value pieces that {benefit}, and this delivers on all fronts."
  ];

  // Category-specific review templates
  const categoryTemplates = {
    'Earrings': [
      "These earrings are lightweight and comfortable even for all-day wear. The {design_feature} design catches the light beautifully. As a {persona}, I love how they {benefit}.",
      
      "I've been searching for the perfect pair of earrings, and these are it! The {material} finish is gorgeous, and they're the perfect size - noticeable without being too heavy.",
      
      "These earrings are my new favorites! They're secure on my ears and the {design_feature} detail gets so many compliments. Perfect for both {occasion} and everyday wear.",
      
      "I was worried these earrings might be too heavy, but they're perfectly balanced. The {design_feature} style is exactly what I was looking for. They're comfortable enough to wear all day.",
      
      "The posts on these earrings are high-quality and don't irritate my sensitive ears at all. The {material} finish is even prettier in person than in the photos.",
      
      "These earrings have the perfect amount of movement and swing when I walk. The {design_feature} catches the light beautifully. They're substantial without being heavy."
    ],
    'Necklaces': [
      "This necklace sits perfectly at my collarbone. The {design_feature} pendant is eye-catching without being overwhelming. As a {persona}, I appreciate how it {benefit}.",
      
      "The chain length is perfect, and the {material} has a beautiful shine that catches the light. This necklace has quickly become my everyday staple.",
      
      "I love how versatile this necklace is! The {design_feature} design works with everything from casual to formal outfits. The clasp is secure and easy to use.",
      
      "The pendant on this necklace is the perfect size - noticeable but not overwhelming. The chain is sturdy yet delicate-looking, and the clasp is easy to use.",
      
      "This necklace has the perfect drop length. The {design_feature} element sits right where I want it to, and the chain doesn't tangle or twist like other necklaces I own.",
      
      "I've been wearing this necklace non-stop since I received it. The {material} finish is beautiful, and the weight feels substantial and high-quality."
    ],
    'Bracelets': [
      "This bracelet fits perfectly on my wrist - not too loose, not too tight. The {design_feature} detail is subtle yet beautiful. As a {persona}, I love how it {benefit}.",
      
      "The clasp on this bracelet is secure and easy to use. The {material} has a beautiful finish that looks luxurious. It's comfortable enough for everyday wear.",
      
      "This bracelet layers beautifully with my other pieces. The {design_feature} design is unique and gets noticed. Perfect for adding a touch of {quality1} to any outfit.",
      
      "I have small wrists and often struggle to find bracelets that fit well, but this one is perfect. The {design_feature} detail is beautiful and catches the light.",
      
      "This bracelet has a nice weight to it that feels substantial without being heavy. The clasp is secure, and I don't worry about it falling off during the day.",
      
      "I love how this bracelet moves with my wrist without sliding around too much. The {material} finish is beautiful and hasn't tarnished at all despite regular wear."
    ],
    'Rings': [
      "This ring fits true to size and is comfortable for everyday wear. The {design_feature} design is beautiful and unique. As a {persona}, I love how it {benefit}.",
      
      "The band is the perfect width and the {material} has a beautiful finish. This ring has quickly become my signature piece that I wear daily.",
      
      "I love the weight of this ring - substantial without being heavy. The {design_feature} detail is intricate and catches the eye. It's become my favorite accessory.",
      
      "This ring is comfortable enough to wear all day - no pinching or irritation. The {design_feature} design is subtle enough for everyday but special enough to get noticed.",
      
      "The sizing of this ring is perfect. It's comfortable even when my fingers swell a bit during the day. The {material} finish is beautiful and hasn't scratched at all.",
      
      "I've been looking for a ring like this for ages! The band is the perfect width, and the {design_feature} detail is exactly what I wanted. It's comfortable enough to wear 24/7."
    ],
    'Jewellery Set': [
      "This set is perfectly coordinated - each piece complements the others beautifully. The {design_feature} theme carries through the entire set while each piece still feels unique.",
      
      "I love that I can wear these pieces together or separately. The {material} finish is consistent across the set, and each piece is beautifully crafted. Perfect for {occasion}.",
      
      "This jewelry set takes the guesswork out of accessorizing. The pieces work beautifully together and the {design_feature} elements tie everything together perfectly.",
      
      "What a gorgeous set! Each piece is beautiful on its own, but together they create such a cohesive look. The {material} finish is consistent and beautiful across all pieces.",
      
      "I bought this set for a special {occasion} and couldn't be happier. Each piece is well-made and they work beautifully together. As a {persona}, I appreciate the attention to detail.",
      
      "The versatility of this set is amazing. I can wear all pieces together for a complete look, or mix and match with other jewelry I own. The {design_feature} design is timeless."
    ]
  };

  // Generic attributes for all products
  const genericAttributes = {
    design_feature: [
      'intricate', 'geometric', 'floral', 'art deco', 'minimalist', 
      'vintage-inspired', 'asymmetrical', 'nature-inspired', 'celestial', 
      'sculptural', 'twisted', 'hammered', 'textured', 'openwork', 'detailed'
    ],
    material: [
      'silver', 'gold', 'rose gold', 'gold-toned', 'pearl', 
      'crystal', 'gemstone', 'metal', 'shiny', 
      'polished', 'brass', 'opal', 'jade', 'amber', 'turquoise',
      'beautiful', 'elegant', 'delicate', 'sturdy', 'high-quality'
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
      'bring a pop of color to neutral outfits', 'highlight my features', 
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
  function generatePersonalizedReview(template, productInfo, reviewer, category) {
    // Process the material to make it sound more natural
    let materialDesc = productInfo.material || getRandomItem(genericAttributes.material);
    
    // If the material contains technical terms like "925 Sterling Silver", simplify it
    if (materialDesc && materialDesc.toLowerCase().includes('sterling silver')) {
      materialDesc = 'silver';
    }
    if (materialDesc && materialDesc.toLowerCase().includes('14k gold')) {
      materialDesc = 'gold';
    }
    
    const replacements = {
      material: materialDesc,
      design_feature: getRandomItem(genericAttributes.design_feature),
      occasion: getRandomItem(genericAttributes.occasion),
      alternate_occasion: getRandomItem(genericAttributes.alternate_occasion),
      benefit: getRandomItem(genericAttributes.benefit),
      quality1: getRandomItem(genericAttributes.quality1),
      quality2: getRandomItem(genericAttributes.quality2),
      persona: reviewer.persona,
      product_type: category.toLowerCase().slice(0, -1) // Remove 's' from end (e.g., "Earrings" -> "earring")
    };
    
    // Replace placeholders in the template
    let reviewText = template.replace(/{(\w+)}/g, (match, key) => {
      return replacements[key] || match;
    });
    
    // Add emojis to approximately 30% of reviews
    if (Math.random() < 0.3) {
      // Add 1-2 emojis
      const emojiCount = Math.random() < 0.5 ? 1 : 2;
      let emojis = '';
      
      for (let i = 0; i < emojiCount; i++) {
        emojis += ' ' + getRandomItem(reviewEmojis);
      }
      
      // Add emojis at the beginning or end of the review
      if (Math.random() < 0.5) {
        reviewText = emojis + ' ' + reviewText;
      } else {
        reviewText = reviewText + ' ' + emojis;
      }
    }
    
    return reviewText;
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

  try {
    console.log('Fetching all products...');
    
    // Fetch all products
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, material, category');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    if (!allProducts || allProducts.length === 0) {
      console.log('No products found');
      return;
    }

    console.log(`Found ${allProducts.length} products`);

    // Group products by category
    const productsByCategory = {};
    allProducts.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });

    // Generate and insert reviews for each product
    const reviewResults = [];
    
    for (const category in productsByCategory) {
      const products = productsByCategory[category];
      console.log(`\nProcessing ${products.length} products in category: ${category}`);
      
      // Get category-specific templates or fall back to generic templates
      const templates = categoryTemplates[category] || [];
      const allTemplates = [...templates, ...genericReviewTemplates];
      
      for (const product of products) {
        console.log(`Generating reviews for product: ${product.name} (${product.id})`);
        
        // Generate between 50-70 reviews for each product
        const reviewCount = Math.floor(Math.random() * 21) + 50; // Random between 50-70
        
        // Track used templates to avoid duplicates for this product
        const usedTemplates = new Set();
        const usedReviewerTemplates = new Set();
        
        // Generate and insert reviews for this product
        for (let i = 0; i < reviewCount; i++) {
          // Select a random reviewer
          const reviewer = getRandomItem(reviewers);
          
          // Select a random review template
          // Try to avoid using the same template with the same reviewer
          let template;
          let reviewerTemplateKey;
          let attempts = 0;
          
          do {
            template = getRandomItem(allTemplates);
            reviewerTemplateKey = `${reviewer.name}-${template.substring(0, 20)}`;
            attempts++;
            
            // After 10 attempts, just use what we have to avoid infinite loop
            if (attempts > 10) break;
          } while (usedReviewerTemplates.has(reviewerTemplateKey));
          
          // Mark this reviewer-template combination as used
          usedReviewerTemplates.add(reviewerTemplateKey);
          
          // Generate personalized review
          const reviewText = generatePersonalizedReview(template, product, reviewer, category);
          
          // Generate a rating (weighted toward positive)
          const rating = generateRating();
          
          console.log(`- Creating review ${i+1}/${reviewCount} by ${reviewer.name}, rating: ${rating}`);
          
          // Insert the review into the database
          // Note: The product_id in reviews table is UUID, but products.id is TEXT
          const { data: review, error: reviewError } = await supabase
            .from('reviews')
            .insert([
              {
                product_id: product.id, // Using product.id directly
                rating: rating,
                comment: reviewText,
                reviewer_name: reviewer.name,
                reviewer_email: reviewer.email,
                images: [] // No images for now
              }
            ])
            .select();

          if (reviewError) {
            console.error(`  Error creating review:`, reviewError);
            reviewResults.push({ product_id: product.id, success: false, error: reviewError.message });
          } else {
            console.log(`  Review created successfully with ID: ${review[0].id}`);
            reviewResults.push({ product_id: product.id, success: true, review_id: review[0].id });
          }
        }
      }
    }

    console.log('\nReview generation summary:');
    console.log(`Total reviews attempted: ${reviewResults.length}`);
    console.log(`Successful reviews: ${reviewResults.filter(r => r.success).length}`);
    console.log(`Failed reviews: ${reviewResults.filter(r => !r.success).length}`);
    
    return reviewResults;
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Export the function for use in other files
module.exports = { generateAllReviews };

// If this script is run directly (not imported), execute with command line arguments
if (require.main === module) {
  // Get Supabase credentials from command line arguments
  const supabaseUrl = process.argv[2];
  const supabaseKey = process.argv[3];
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Usage: node generate-all-reviews.js <SUPABASE_URL> <SUPABASE_KEY>');
    process.exit(1);
  }
  
  // Run the function
  generateAllReviews(supabaseUrl, supabaseKey)
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Script failed:', err);
      process.exit(1);
    });
}
