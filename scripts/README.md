# Earrings Review Generator

This script generates diverse, authentic-sounding reviews for earrings products in your database.

## Features

- Creates 50-60 reviews per earring product
- Uses diverse reviewer personas with different jewelry preferences
- Generates unique, personalized review text for each product
- Weighted rating system (mostly positive reviews)
- Directly inserts reviews into your Supabase database

## Usage

```bash
node generate-earring-reviews.js <SUPABASE_URL> <SUPABASE_SERVICE_KEY>
```

### Example

```bash
node generate-earring-reviews.js "https://your-project.supabase.co" "your-supabase-service-key"
```

## Review Characteristics

- **Reviewers**: 25 diverse personas with different jewelry preferences
- **Templates**: 25 different review templates with variable content
- **Attributes**: Varied materials, design features, occasions, benefits, and qualities
- **Ratings**: Weighted toward positive (80% 5-star, 15% 4-star, 5% 3-star)

## Notes

- This script only needs to be run once to populate your database with earring reviews
- All generated reviews are fictional and for demonstration purposes
- The script handles the product_id format compatibility between the products and reviews tables
