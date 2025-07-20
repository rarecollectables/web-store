# Rare Collectables Web Store

A modern web store application built with React Native and Expo, deployed on Netlify.

## Features

- Responsive web interface
- Product catalog
- Shopping cart functionality
- Secure store integration
- Serverless API functions
- Optimized image handling
- Performance optimized build

## Tech Stack

- React Native
- Expo
- Netlify
- Node.js
- Serverless Functions

## Getting Started

### Prerequisites

- Node.js (v18.x)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update the configuration:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run web
   ```

## Deployment

The project is configured for deployment on Netlify. To deploy:

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set up environment variables in Netlify
4. Deploy using:
   ```bash
   npm run deploy
   ```

## Environment Variables

Create a `.env` file with the following variables:

```
NODE_ENV=production
API_URL=https://api.yourdomain.com
SECURE_STORE_KEY_PREFIX=web-store-
IMAGE_QUALITY=80
MAX_IMAGE_SIZE=2000
CACHE_TTL=3600
ANALYTICS_ID=your-analytics-id-here
```

## Security

The application uses secure headers and follows security best practices:
- HSTS enabled
- CSP headers configured
- XSS protection enabled
- Frame protection enabled
- Content type options set
- Referrer policy configured

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
