import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase/client';
import { FontAwesome } from '@expo/vector-icons';
import { Button, Card, Divider } from 'react-native-paper';
import { colors } from '../../theme';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    reviewer_name: '',
    reviewer_email: ''
  });

  // Fetch reviews on component mount
  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  // Fetch reviews for this product
  const fetchReviews = async () => {
    try {
      setLoading(true);
      console.log('Fetching reviews for product ID:', productId);
      
      // First, try direct match (in case product_id is stored as TEXT in some rows)
      let { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer_name,
          reviewer_email,
          users (name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // If no reviews found and productId is not a valid UUID format,
      // this might be because product_id is UUID and productId is TEXT
      if (data.length === 0) {
        console.log('No reviews found with direct match, trying text search');
        // Use textual search as a fallback
        const { data: textSearchData, error: textSearchError } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer_name,
            reviewer_email,
            users (name)
          `)
          .ilike('product_id', `%${productId}%`)
          .order('created_at', { ascending: false });
          
        if (textSearchError) throw textSearchError;
        data = textSearchData;
      }

      if (error) throw error;

      // Format reviews
      const formattedReviews = data.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: new Date(review.created_at).toLocaleDateString(),
        reviewer_name: review.reviewer_name || review.users?.name || 'Anonymous'
      }));

      setReviews(formattedReviews);

      // Calculate average rating
      if (data.length > 0) {
        const total = data.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(parseFloat((total / data.length).toFixed(1)));
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle submitting a new review
  const handleSubmitReview = async () => {
    if (!newReview.comment || !newReview.reviewer_name || !newReview.reviewer_email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Insert the review - our database trigger will automatically create a user
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          rating: newReview.rating,
          comment: newReview.comment,
          reviewer_name: newReview.reviewer_name,
          reviewer_email: newReview.reviewer_email
        });

      if (error) throw error;

      // Update the product's average rating
      await updateProductRating();

      // Reset form and refresh reviews
      setNewReview({
        rating: 5,
        comment: '',
        reviewer_name: '',
        reviewer_email: ''
      });
      setShowReviewForm(false);
      fetchReviews();
      
      Alert.alert('Success', 'Your review has been submitted. Thank you!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  // Update a product's average rating and review count
  const updateProductRating = async () => {
    try {
      // Get all reviews for this product
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (error) throw error;

      // Calculate new average rating
      const total = data.reduce((sum, review) => sum + review.rating, 0);
      const newAverage = data.length > 0 ? parseFloat((total / data.length).toFixed(1)) : 0;
      
      // Update product table
      await supabase
        .from('products')
        .update({
          rating: newAverage,
          review_count: data.length
        })
        .eq('id', productId);

    } catch (error) {
      console.error('Error updating product rating:', error);
    }
  };

  // Star rating display component
  const StarRating = ({ rating }) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        {[...Array(5)].map((_, i) => (
          <FontAwesome
            key={i}
            name={i < rating ? 'star' : 'star-o'}
            size={16}
            color={colors.gold || '#FFD700'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  // Star rating input component
  const StarRatingInput = ({ rating, setRating }) => {
    return (
      <View style={styles.starContainer}>
        {[...Array(5)].map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setRating(i + 1)}
            style={{ padding: 5 }}
          >
            <FontAwesome
              name={i < rating ? 'star' : 'star-o'}
              size={24}
              color={colors.gold || '#FFD700'}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  // Generate schema.org JSON-LD structured data for Google Shopping
  const generateStructuredData = () => {
    const reviewsData = reviews.map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": review.reviewer_name
      },
      "reviewBody": review.comment,
      "datePublished": review.created_at
    }));

    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "review": reviewsData,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": reviews.length
      }
    };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Customer Reviews</Text>
      
      {/* Average Rating */}
      <View style={styles.ratingContainer}>
        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
        <StarRating rating={averageRating} />
        <Text style={styles.reviewCount}>Based on {reviews.length} reviews</Text>
      </View>
      
      <Divider style={styles.divider} />
      
      {/* Write a Review Button */}
      <Button 
        mode="contained" 
        onPress={() => setShowReviewForm(!showReviewForm)}
        style={styles.writeReviewButton}
        buttonColor={colors.gold}
      >
        {showReviewForm ? 'Cancel' : 'Write a Review'}
      </Button>
      
      {/* Review Form */}
      {showReviewForm && (
        <Card style={styles.reviewForm}>
          <Card.Content>
            <Text style={styles.formLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={newReview.reviewer_name}
              onChangeText={(text) => setNewReview({ ...newReview, reviewer_name: text })}
              placeholder="Enter your name"
            />
            
            <Text style={styles.formLabel}>Your Email</Text>
            <TextInput
              style={styles.input}
              value={newReview.reviewer_email}
              onChangeText={(text) => setNewReview({ ...newReview, reviewer_email: text })}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
            
            <Text style={styles.formLabel}>Rating</Text>
            <StarRatingInput 
              rating={newReview.rating} 
              setRating={(rating) => setNewReview({ ...newReview, rating })}
            />
            
            <Text style={styles.formLabel}>Review</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={newReview.comment}
              onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
              placeholder="Write your review here..."
            />
            
            <Button 
              mode="contained" 
              onPress={handleSubmitReview}
              style={styles.submitButton}
              buttonColor={colors.gold}
            >
              Submit Review
            </Button>
          </Card.Content>
        </Card>
      )}
      
      <Divider style={styles.divider} />
      
      {/* Reviews List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading reviews...</Text>
      ) : reviews.length > 0 ? (
        <ScrollView style={styles.reviewsList}>
          {reviews.map((review) => (
            <Card key={review.id} style={styles.reviewCard}>
              <Card.Content>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
                </View>
                <StarRating rating={review.rating} />
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noReviewsText}>No reviews yet. Be the first to review this product!</Text>
      )}
      
      {/* Schema.org structured data for Google Shopping */}
      {typeof document !== 'undefined' && reviews.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData())
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  writeReviewButton: {
    marginBottom: 16,
  },
  reviewForm: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    height: 40,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  reviewsList: {
    maxHeight: 400,
    backgroundColor: '#ffffff',
  },
  reviewCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewerName: {
    fontWeight: 'bold',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewComment: {
    marginTop: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 16,
  },
  noReviewsText: {
    textAlign: 'center',
    color: '#666',
    padding: 16,
  },
});
