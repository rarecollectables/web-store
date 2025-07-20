# Rare Collectables Web Store - Architecture Overview

This document provides a comprehensive overview of the Rare Collectables web store application architecture, designed to help developers quickly understand the codebase structure and functionality.

## Application Architecture

Rare Collectables is a modern e-commerce web application built with React Native and Expo, designed to be deployed on Netlify. The application follows a hybrid architecture that allows it to run as a web application while leveraging React Native components.

## Key Technologies

1. **Frontend Framework**: React Native + Expo
2. **Routing**: Expo Router (file-based routing)
3. **State Management**: Custom context-based store (`context/store.js`)
4. **Backend/Database**: Supabase
5. **Payment Processing**: Stripe
6. **Deployment**: Netlify with serverless functions
7. **Analytics**: Google Analytics, Microsoft Clarity
8. **Form Validation**: Zod

## Directory Structure

```
/
├── app/                    # Main application code
│   ├── (components)/       # Shared components for tabs
│   ├── (data)/             # Data files
│   ├── (tabs)/             # Tab-based navigation screens
│   │   ├── _layout.js      # Tab navigation layout
│   │   ├── index.js        # Homepage
│   │   ├── shop.js         # Shop page
│   │   ├── cart.js         # Cart page
│   │   ├── profile.js      # User profile
│   │   └── wishlist.js     # Wishlist page
│   ├── _app.js             # App entry point for Expo Router
│   ├── _layout.js          # Main app layout
│   ├── admin/              # Admin-related pages
│   ├── components/         # Reusable UI components
│   ├── checkout.js         # Checkout process
│   ├── product/            # Product detail pages
│   └── ...                 # Other pages (contact, policies, etc.)
├── assets/                 # Static assets (images, fonts)
├── context/                # React context providers
│   └── store.js            # Main state management
├── lib/                    # Utility libraries
│   ├── chat/               # Chat functionality
│   ├── config/             # Configuration files
│   ├── orders/             # Order processing
│   ├── supabase/           # Supabase integration
│   │   ├── client.js       # Supabase client setup
│   │   ├── services.js     # Supabase services
│   │   ├── schema.sql      # Database schema
│   │   └── ...             # Other Supabase utilities
│   └── trackEvent.js       # Analytics tracking
├── netlify/                # Netlify configuration and functions
├── scripts/                # Build and utility scripts
├── theme/                  # UI theme definitions
└── ...                     # Configuration files
```

## Core Components and Modules

### Entry Points

1. **App.js**: Main entry point that initializes the application and loads environment variables
2. **app/_layout.js**: Sets up the main application layout, providers, and navigation
3. **index.js**: Root entry point for the application

### Key Pages

1. **app/(tabs)/index.js**: Homepage with product categories and featured items
2. **app/(tabs)/shop.js**: Product browsing interface
3. **app/(tabs)/cart.js**: Shopping cart management
4. **app/checkout.js**: Checkout process with Stripe integration
5. **app/product/[id].js**: Dynamic product detail pages

### State Management

The application uses a custom context-based store (`context/store.js`) that manages:

- Shopping cart items and operations
- Wishlist items and operations
- User session management
- Order processing state

The store persists data using either localStorage (web) or SecureStore (native) and synchronizes with Supabase.

### Backend Integration

#### Supabase

- **Client Setup**: `lib/supabase/client.js`
- **Services**: `lib/supabase/services.js`
- **Queries**: `lib/supabase/queries.js`
- **Schema**: `lib/supabase/schema.sql`

The database schema includes tables for:
- Users and guest sessions
- Products and variants
- Cart and wishlist items
- Orders and order items
- Reviews
- Chat system
- Contact form submissions

#### Stripe Integration

- **Checkout Process**: `app/checkout.js`
- **Server Functions**: `stripe-server.js`
- **Netlify Functions**: `netlify/functions/create-checkout-session.js`

### Key Features

1. **Product Catalog**: 
   - Categories: necklaces, earrings, bracelets, rings, jewelry sets
   - Product variants with different options
   - Product images and details

2. **Shopping Cart**:
   - Add/remove items
   - Update quantities
   - Calculate totals and shipping

3. **Checkout Process**:
   - Address collection and validation
   - Payment processing with Stripe
   - Order confirmation

4. **User Management**:
   - Authentication with Supabase
   - Guest sessions for non-authenticated users
   - User profiles

5. **Reviews System**:
   - Product ratings
   - User comments
   - Review moderation

6. **Chat System**:
   - Customer support interface
   - Message history
   - Analytics

### Deployment

The application is configured for deployment on Netlify with:
- Build configuration in `netlify.toml`
- Serverless functions in the `netlify/` directory
- Environment variable management
- Security headers and optimizations

## Design Patterns and Best Practices

1. **Context API** for state management
2. **File-based routing** with Expo Router
3. **Serverless architecture** for backend functions
4. **Responsive design** for cross-platform compatibility
5. **Guest sessions** for non-authenticated users
6. **Error handling** and validation throughout the application
7. **Analytics tracking** for user behavior

## Development Workflow

1. **Local Development**:
   ```bash
   npm install
   npm run web
   ```

2. **Deployment**:
   ```bash
   npm run deploy
   ```

3. **Environment Setup**:
   - Copy `.env.example` to `.env`
   - Configure Supabase and Stripe credentials

## Customer Personas and Value Proposition

### Customer Personas

Based on analysis of the codebase, the brand appears to cater primarily to:

1. **Gift Shoppers**: People looking for special jewelry gifts for loved ones (evidenced by the "gifts-for-her" directory and emphasis on "making every moment special" in the meta descriptions)

2. **Affordable Luxury Seekers**: Customers who appreciate high-quality jewelry but at accessible price points (the brand positions itself as "affordable luxury" in its meta tags)

3. **Heart & Charm Jewelry Enthusiasts**: Specifically targeting those interested in heart-themed and charm jewelry designs (mentioned in the meta description)

4. **Quality-Conscious Shoppers**: People who value craftsmanship and durability in their jewelry purchases (emphasized in the "Premium Quality" feature tile)

### Value Proposition

The brand's value proposition can be summarized as:

1. **Affordable Luxury**: Offering high-quality jewelry at accessible price points (tagline "Rare Collectables | Affordable Luxury")

2. **Unique, Handcrafted Pieces**: "Handpicked, unique collectables crafted to last" (from FeatureTiles.js)

3. **Customer-Friendly Policies**:
   - Free UK shipping on all orders
   - 60-day return policy
   - Lifetime warranty on products

4. **Special Occasion Focus**: Jewelry "designed to make every moment special" (from meta description)

5. **Product Range**: Focused on necklaces, bracelets, earrings, rings, and jewelry sets, with an emphasis on heart and charm designs

The brand positions itself in the affordable luxury segment of the jewelry market, targeting gift-givers and self-purchasers who want quality pieces that feel special without the premium luxury price tag. The emphasis on warranties, free shipping, and generous return policies suggests a focus on building customer trust and reducing purchase barriers.

## Security Considerations

- HSTS enabled
- CSP headers configured
- XSS protection
- Frame protection
- Content type options
- Referrer policy
- Secure storage of user data

## Future Enhancements

Potential areas for improvement:
- Enhanced search functionality
- More payment methods
- Internationalization
- Performance optimizations
- Mobile app deployment
