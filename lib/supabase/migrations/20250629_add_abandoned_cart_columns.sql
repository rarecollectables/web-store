-- Migration to add abandoned cart email tracking columns to checkout_attempts table

-- Add columns for tracking email capture and abandoned cart email status
ALTER TABLE checkout_attempts
  ADD COLUMN IF NOT EXISTS email_valid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_captured_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS abandoned_cart_email_sent BOOLEAN,
  ADD COLUMN IF NOT EXISTS abandoned_cart_email_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS order_completed BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on email_captured_at
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_email_captured_at ON checkout_attempts(email_captured_at);

-- Add index for faster queries on abandoned_cart_email_sent
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_email_sent ON checkout_attempts(abandoned_cart_email_sent);
