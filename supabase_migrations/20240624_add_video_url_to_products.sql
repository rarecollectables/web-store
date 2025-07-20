-- Migration: Add video_url column to products table
ALTER TABLE products ADD COLUMN video_url text;
