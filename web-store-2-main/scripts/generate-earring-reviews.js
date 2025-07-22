// Script to generate diverse earring reviews
const { createClient } = require('@supabase/supabase-js');

// Function to generate reviews
async function generateEarringReviews(supabaseUrl, supabaseKey) {
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

  // Review templates for earrings with placeholders
  const earringReviewTemplates = [
    "I love these earrings! They're perfect for {occasion} and so comfortable to wear. As a {persona}, I really appreciate how they {benefit}.",
    
    "These have become my favorite earrings. The {design_feature} detail is so pretty, and they go with everything. I wear them all the time now.",
    
    "Just what I was looking for! These earrings are lightweight, stylish, and perfect for my needs as a {persona}.",
    
    "I get so many compliments whenever I wear these. The design is unique and they're comfortable enough to wear all day.",
    
    "These earrings are gorgeous! They look much more expensive than they are. Perfect for {occasion} or just everyday wear.",
    
    "These {material} earrings are absolutely stunning! The craftsmanship is exceptional, and they catch the light beautifully. As someone who {persona}, I find these perfect for {occasion}. They're comfortable to wear all day, and I've received countless compliments.",
    
    "I was initially hesitant about ordering jewelry online, but these earrings exceeded my expectations. The {design_feature} design is even more beautiful in person. They have a nice weight that feels substantial without being heavy. Being a {persona}, I appreciate how these earrings {benefit}.",
    
    "These earrings have quickly become my go-to accessory. The {material} has a gorgeous sheen that elevates any outfit. What I love most is how versatile they are - I can wear them for {occasion} or {alternate_occasion}. As a {persona}, finding pieces that {benefit} is important to me.",
    
    "The attention to detail on these earrings is remarkable. The {design_feature} caught my eye immediately, and the quality is evident. They're surprisingly lightweight despite their appearance. From my perspective as a {persona}, these earrings offer the perfect balance of {quality1} and {quality2}.",
    
    "I purchased these earrings for a special {occasion} and couldn't be happier. The {material} has a beautiful luster that photographs wonderfully. They're secure and comfortable even when worn for hours. As someone who {persona}, I particularly appreciate how these {benefit}.",
    
    "These earrings are a true treasure! The {design_feature} makes them stand out from typical designs. They have a perfect size - noticeable without overwhelming my face. Being a {persona}, I value how these earrings {benefit} while still being {quality1}.",
    
    "I'm absolutely in love with these earrings! The {material} has a wonderful {quality1} that catches everyone's attention. They're versatile enough for both {occasion} and {alternate_occasion}. As a {persona}, finding jewelry that {benefit} is rare, and these deliver perfectly.",
    
    "These earrings are exquisite - the {design_feature} adds such a unique touch. They're surprisingly lightweight, making them comfortable for all-day wear. What impresses me most as a {persona} is how they {benefit} while still maintaining {quality1}. Definitely worth the investment!",
    
    "I rarely write reviews, but these earrings deserve the praise. The {material} has a beautiful {quality1} that elevates any outfit. They're perfectly sized - not too bold, not too subtle. From my perspective as a {persona}, these earrings are ideal for {occasion} while still {benefit}.",
    
    "These earrings have exceeded all my expectations! The {design_feature} is even more beautiful in person. They have a comfortable weight and the clasps are secure. As a {persona}, I appreciate jewelry that {benefit}, and these earrings do exactly that while adding {quality1} to my collection.",
    
    "After searching for the perfect {occasion} earrings, I finally found these! The {material} quality is outstanding, and the {design_feature} design is exactly what I was looking for. They're surprisingly comfortable for extended wear. As a {persona}, I'm thrilled with how they {benefit}.",
    
    "I bought these earrings on a whim and am so glad I did! The {design_feature} detail is subtle yet eye-catching. They're lightweight enough for everyday wear but special enough for {occasion}. Being a {persona}, I especially love how they {benefit} while maintaining a sense of {quality1}.",
    
    "These earrings are the perfect addition to my collection! The {material} has a beautiful finish that pairs well with both casual and formal outfits. The craftsmanship is evident in every detail. As someone who {persona}, I appreciate jewelry that {benefit} and these do exactly that.",
    
    "I can't say enough good things about these earrings! The {design_feature} design is unique and gets noticed wherever I go. They're comfortable enough to wear all day, from work meetings to evening events. As a {persona}, finding earrings that {benefit} while still being {quality1} is exactly what I need.",
    
    "Five stars aren't enough for these earrings! The {material} has a gorgeous texture and weight that speaks to their quality. They're versatile enough for both {occasion} and {alternate_occasion}. From my perspective as a {persona}, these earrings perfectly {benefit} while adding a touch of {quality1} to any look.",
    
    "I'm extremely picky about my jewelry, but these earrings won me over immediately. The {design_feature} is beautifully executed, and they're the perfect size - noticeable without being overwhelming. As a {persona}, I value pieces that {benefit}, and these deliver on all fronts.",
    
    "These earrings are simply magnificent! The {material} catches the light in the most beautiful way. They're comfortable enough to wear all day and secure enough that I never worry about losing them. Being a {persona}, I particularly appreciate how they {benefit} while maintaining a sense of {quality1}.",
    
    "I purchased these earrings for my daily rotation and they've quickly become my favorites. The {design_feature} adds a unique touch that elevates even the simplest outfit. They're lightweight and comfortable for all-day wear. As someone who {persona}, I love how these earrings {benefit}.",
    
    "These earrings are a work of art! The {material} has a beautiful finish that looks much more expensive than the price suggests. They're perfectly sized and the {design_feature} detail is exquisite. From my perspective as a {persona}, these earrings are ideal for {occasion} while still {benefit}.",
    
    "I've received so many compliments on these earrings! The {design_feature} design is unique without being too trendy. They have a nice weight that feels substantial and high-quality. As a {persona}, I appreciate jewelry that {benefit} while still being {quality1} enough for everyday wear.",
    
    "These earrings are exactly what I was looking for! The {material} quality is exceptional and the {design_feature} design element adds such a special touch. They're comfortable enough to wear from morning meetings through evening events. Being a {persona}, I value how these earrings {benefit} while maintaining their {quality1}.",
    
    "I'm thrilled with these earrings! The {material} has a beautiful luster that elevates any outfit. The size is perfect - noticeable but not overwhelming. As someone who {persona}, I particularly appreciate how these {benefit} while still being appropriate for both {occasion} and {alternate_occasion}.",
    
    "These earrings are simply stunning! The {design_feature} caught my eye immediately, and the quality of the {material} is evident. They're surprisingly lightweight despite their appearance. From my perspective as a {persona}, these earrings offer the perfect balance of {quality1} and {quality2}.",
    
    "I don't usually write reviews, but I had to for these earrings! The {material} has a gorgeous finish that looks luxurious. They're the perfect size and weight - substantial without being heavy. As a {persona}, I love how these earrings {benefit} while adding a touch of {quality1} to my style.",
    
    "These earrings are a true gem! The {design_feature} design is both timeless and modern. They're comfortable for all-day wear and secure enough that I never worry about losing them. Being a {persona}, I value jewelry that {benefit}, and these earrings deliver perfectly."
  ];

  // Design features, materials, occasions, benefits, and qualities for earrings
  const earringAttributes = {
    design_feature: [
      'intricate filigree', 'geometric', 'floral', 'art deco', 'minimalist', 
      'vintage-inspired', 'asymmetrical', 'nature-inspired', 'celestial', 
      'sculptural', 'cascading', 'twisted', 'hammered', 'textured', 'openwork'
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

  // Emojis for reviews
  const reviewEmojis = [
    '✨', '💖', '😍', '🌟', '👌', '💯', '🔥', '💎', '👑', '🎁',
    '❤️', '🥰', '💕', '💫', '✅', '🙌', '👏', '🤩', '💞', '💝'
  ];

  // Function to generate a personalized review
  function generatePersonalizedReview(template, productInfo, reviewer) {
    // Process the material to make it sound more natural
    let materialDesc = productInfo.material || getRandomItem(earringAttributes.material);
    
    // If the material contains technical terms like "925 Sterling Silver", simplify it
    if (materialDesc && materialDesc.toLowerCase().includes('sterling silver')) {
      materialDesc = 'silver';
    }
    if (materialDesc && materialDesc.toLowerCase().includes('14k gold')) {
      materialDesc = 'gold';
    }
    
    const replacements = {
      material: materialDesc,
      design_feature: getRandomItem(earringAttributes.design_feature),
      occasion: getRandomItem(earringAttributes.occasion),
      alternate_occasion: getRandomItem(earringAttributes.alternate_occasion),
      benefit: getRandomItem(earringAttributes.benefit),
      quality1: getRandomItem(earringAttributes.quality1),
      quality2: getRandomItem(earringAttributes.quality2),
      persona: reviewer.persona
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
    console.log('Fetching earrings products...');
    
    // Fetch all products in the earrings category
    const { data: earringsProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, material')
      .eq('category', 'Earrings');

    if (productsError) {
      console.error('Error fetching earrings products:', productsError);
      return;
    }

    if (!earringsProducts || earringsProducts.length === 0) {
      console.log('No earrings products found');
      return;
    }

    console.log(`Found ${earringsProducts.length} earrings products`);

    // Generate and insert reviews for each product
    const reviewResults = [];
    
    for (const product of earringsProducts) {
      console.log(`Generating reviews for product: ${product.name} (${product.id})`);
      
      // Generate 50-60 reviews per product
      const reviewCount = Math.floor(Math.random() * 11) + 50;
      
      for (let i = 0; i < reviewCount; i++) {
        // Select a random reviewer
        const reviewer = getRandomItem(reviewers);
        
        // Select a random review template
        const template = getRandomItem(earringReviewTemplates);
        
        // Generate personalized review
        const reviewText = generatePersonalizedReview(template, product, reviewer);
        
        // Generate a rating (weighted toward positive)
        const rating = generateRating();
        
        console.log(`- Creating review by ${reviewer.name}, rating: ${rating}`);
        
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
module.exports = { generateEarringReviews };

// If this script is run directly (not imported), execute with command line arguments
if (require.main === module) {
  // Get Supabase credentials from command line arguments
  const supabaseUrl = process.argv[2];
  const supabaseKey = process.argv[3];
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Usage: node generate-earring-reviews.js <SUPABASE_URL> <SUPABASE_KEY>');
    process.exit(1);
  }
  
  // Run the function
  generateEarringReviews(supabaseUrl, supabaseKey)
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Script failed:', err);
      process.exit(1);
    });
}
