import React from 'react';
import SEO from './SEO';

export default function SEOProductsList({ category, products }) {
  // Generate SEO meta for product list/category page
  const title = category
    ? `${category.charAt(0).toUpperCase() + category.slice(1)} | Rare Collectables`
    : 'Shop Rare Collectables';
  const description = category
    ? `Browse unique items in the ${category} category. Affordable luxury collectables with UK shipping only.`
    : 'Affordable luxury collectables. Shop unique and premium products with detailed descriptions, secure checkout, and UK shipping only.';
  const keywords = category
    ? `${category}, rare, collectables, shop, luxury, unique`
    : 'rare, collectables, luxury, shop, unique, products';
  const url = category
    ? `https://rarecollectables.co.uk/shop?category=${encodeURIComponent(category)}`
    : 'https://rarecollectables.co.uk/shop';

  // Structured data for a product list page (ItemList)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: url.replace('/shop', `/product/${product.id}`),
      name: product.name
    }))
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      url={url}
      type="website"
      structuredData={structuredData}
    />
  );
}
