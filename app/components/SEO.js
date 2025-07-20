import React from 'react';

export default function SEO({
  title = 'Rare Collectables | Affordable Luxury',
  description = 'Affordable luxury collectables. Shop unique and premium products with detailed descriptions, secure checkout, and UK shipping only.',
  keywords = 'affordable luxury, rare, collectables, UK shipping, shop, unique, premium products',
  image = 'https://rarecollectables.co.uk/default-og-image.jpg',
  url = 'https://rarecollectables.co.uk',
  type = 'website',
  children,
  structuredData
}) {
  return (
    <>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {/* Open Graph / Facebook */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      )}
      {children}
    </>
  );
}
