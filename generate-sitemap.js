const fs = require('fs');
const path = require('path');

// Import minimal product data (no image requires)
const PRODUCTS = require('./scripts/products-sitemap-data.js');

const siteUrl = 'https://rarecollectables.co.uk';

const uniqueCategories = [...new Set(PRODUCTS.map(p => p.category))];

let urls = [
  { loc: `${siteUrl}/`, priority: 1.0 },
  { loc: `${siteUrl}/shop`, priority: 0.9 },
];

// Add category pages
uniqueCategories.forEach(category => {
  urls.push({
    loc: `${siteUrl}/shop?category=${encodeURIComponent(category)}`,
    priority: 0.8
  });
});

// Add product pages
PRODUCTS.forEach(product => {
  urls.push({
    loc: `${siteUrl}/product/${product.id}`,
    priority: 0.7
  });
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(
  url => `  <url>\n    <loc>${url.loc}</loc>\n    <priority>${url.priority}</priority>\n  </url>`
).join('\n')}\n</urlset>\n`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');
console.log('sitemap.xml generated!');
