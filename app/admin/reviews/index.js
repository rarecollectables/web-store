import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, Pressable, Alert } from 'react-native';
import { Appbar, DataTable, Button, Dialog, Portal, Provider, IconButton, Searchbar, ActivityIndicator, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase/client';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../theme';

export default function ReviewsManagement() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [newReview, setNewReview] = useState({
    product_id: '',
    reviewer_name: '',
    reviewer_email: '',
    rating: 5,
    comment: ''
  });
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Fetch reviews and products on component mount
  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, []);

  // Fetch reviews from Supabase
  const fetchReviews = async () => {
    setLoading(true);
    try {
      console.log('Fetching reviews...');
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          product_id,
          reviewer_name,
          reviewer_email,
          users (name, email),
          products (name, sku)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error in Supabase query:', error);
        throw error;
      }

      console.log('Reviews fetched:', data ? data.length : 0);
      
      if (!data || data.length === 0) {
        setReviews([]);
        return;
      }

      // Format reviews with user and product info
      const formattedReviews = data.map(review => {
        // Ensure created_at is valid
        const created_at = review.created_at || new Date().toISOString();
        
        return {
          id: review.id,
          rating: review.rating || 0,
          comment: review.comment || '',
          created_at: created_at,
          created_at_formatted: new Date(created_at).toLocaleDateString(),
          user_name: review.reviewer_name || review.users?.name || 'Unknown User',
          user_email: review.reviewer_email || review.users?.email || 'No Email',
          product_name: review.products?.name || 'Unknown Product',
          product_sku: review.products?.sku || 'No SKU',
          user_id: review.user_id,
          product_id: review.product_id,
          reviewer_name: review.reviewer_name,
          reviewer_email: review.reviewer_email
        };
      });

      console.log('Formatted reviews:', formattedReviews.length);
      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // We no longer need to fetch users as we'll enter name and email manually

  // Filter reviews based on search query
  const filteredReviews = reviews.filter(review => {
    const searchLower = searchQuery.toLowerCase();
    return (
      review.comment.toLowerCase().includes(searchLower) ||
      review.user_name.toLowerCase().includes(searchLower) ||
      review.product_name.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, filteredReviews.length);
  const paginatedReviews = filteredReviews.slice(from, to);

  // Handle adding a new review
  const handleAddReview = async () => {
    if (!newReview.product_id || !newReview.reviewer_name || !newReview.reviewer_email || !newReview.comment) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Insert the review - our database trigger will automatically create a user
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: newReview.product_id,
          reviewer_name: newReview.reviewer_name,
          reviewer_email: newReview.reviewer_email,
          rating: newReview.rating,
          comment: newReview.comment
        })
        .select();

      if (error) throw error;

      // Update the product's average rating
      await updateProductRating(newReview.product_id);

      // Reset form and refresh reviews
      setNewReview({
        product_id: '',
        reviewer_name: '',
        reviewer_email: '',
        rating: 5,
        comment: ''
      });
      setDialogVisible(false);
      fetchReviews();
      
      Alert.alert('Success', 'Review added successfully!');
    } catch (error) {
      console.error('Error adding review:', error);
      Alert.alert('Error', 'Failed to add review. Please try again.');
    }
  };

  // Handle editing a review
  const handleEditReview = async () => {
    if (!editingReview.comment) {
      Alert.alert('Error', 'Review comment cannot be empty');
      return;
    }

    try {
      // Get the date from the form
      const dateInput = document.getElementById('review-date-input');
      let reviewDate = editingReview.created_at;
      
      if (dateInput && dateInput.value) {
        // Convert the input value to an ISO string
        const newDate = new Date(dateInput.value);
        if (!isNaN(newDate.getTime())) {
          reviewDate = newDate.toISOString();
          console.log('Using date from input:', reviewDate);
        }
      }
      
      console.log('Updating review with date:', reviewDate);
      
      // Direct SQL update using a simple query
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: editingReview.rating,
          comment: editingReview.comment
        })
        .eq('id', editingReview.id);
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      // If we have a valid date, update it separately
      if (reviewDate) {
        console.log('Updating date separately');
        // Use raw SQL query to update just the date
        const { error: dateError } = await supabase.rpc(
          'update_review_date',
          { 
            review_id: editingReview.id,
            review_date: reviewDate
          }
        );
        
        if (dateError) {
          console.error('Date update error:', dateError);
          Alert.alert('Warning', 'Review saved but date could not be updated.');
        } else {
          console.log('Date updated successfully');
        }
      }

      // Update the product's average rating
      await updateProductRating(editingReview.product_id);

      // Reset form and refresh reviews
      setEditingReview(null);
      setDialogVisible(false);
      fetchReviews();
      
      Alert.alert('Success', 'Review updated successfully!');
    } catch (error) {
      console.error('Error updating review:', error);
      Alert.alert('Error', 'Failed to update review. Please try again.');
    }
  };

  // Handle deleting a review
  const handleDeleteReview = async (id, productId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);

              if (error) throw error;

              // Update the product's average rating
              await updateProductRating(productId);

              // Refresh reviews
              fetchReviews();
              setMenuVisible(false);
              setSelectedReview(null);
              
              Alert.alert('Success', 'Review deleted successfully!');
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Update a product's average rating and review count
  const updateProductRating = async (productId) => {
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
            color={colors.gold}
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
              color={colors.gold}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Manage Reviews" />
          <Appbar.Action icon="plus" onPress={() => {
            setEditingReview(null);
            setDialogVisible(true);
          }} />
        </Appbar.Header>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search reviews..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Product</DataTable.Title>
                <DataTable.Title>User</DataTable.Title>
                <DataTable.Title>Rating</DataTable.Title>
                <DataTable.Title>Review</DataTable.Title>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>

              {paginatedReviews.length > 0 ? (
                paginatedReviews.map((review) => (
                  <DataTable.Row key={review.id}>
                    <DataTable.Cell>{review.product_name}</DataTable.Cell>
                    <DataTable.Cell>{review.user_name}</DataTable.Cell>
                    <DataTable.Cell>
                      <StarRating rating={review.rating} />
                    </DataTable.Cell>
                    <DataTable.Cell style={{ maxWidth: 200 }}>
                      <Text numberOfLines={2}>{review.comment}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>{review.created_at_formatted}</DataTable.Cell>
                    <DataTable.Cell>
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        onPress={() => {
                          setSelectedReview(review);
                          setMenuVisible(true);
                        }}
                      />
                      <Menu
                        visible={menuVisible && selectedReview?.id === review.id}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={{ x: 0, y: 0 }}
                      >
                        <Menu.Item
                          onPress={() => {
                            // Format the date properly for editing
                            const reviewWithFormattedDate = {
                              ...review,
                              // Ensure we're using the raw ISO string from the database
                              created_at: review.created_at
                            };
                            console.log('Setting review for edit with date:', reviewWithFormattedDate.created_at);
                            setEditingReview(reviewWithFormattedDate);
                            setDialogVisible(true);
                            setMenuVisible(false);
                          }}
                          title="Edit"
                          leadingIcon="pencil"
                        />
                        <Menu.Item
                          onPress={() => handleDeleteReview(review.id, review.product_id)}
                          title="Delete"
                          leadingIcon="delete"
                        />
                      </Menu>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              ) : (
                <DataTable.Row>
                  <DataTable.Cell style={{ flex: 6, justifyContent: 'center' }}>
                    <Text>No reviews found</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              )}

              <DataTable.Pagination
                page={page}
                numberOfPages={Math.ceil(filteredReviews.length / numberOfItemsPerPage)}
                onPageChange={page => setPage(page)}
                label={`${from + 1}-${to} of ${filteredReviews.length}`}
                numberOfItemsPerPage={numberOfItemsPerPage}
                onItemsPerPageChange={setNumberOfItemsPerPage}
                showFastPaginationControls
                selectPageDropdownLabel={'Rows per page'}
              />
            </DataTable>
          </ScrollView>
        )}

        {/* Add/Edit Review Dialog */}
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
            <Dialog.Title>{editingReview ? 'Edit Review' : 'Add New Review'}</Dialog.Title>
            <Dialog.Content>
              {!editingReview && (
                <>
                  <Text style={styles.inputLabel}>Product</Text>
                  <View style={styles.selectContainer}>
                    <select
                      value={newReview.product_id}
                      onChange={e => setNewReview({ ...newReview, product_id: e.target.value })}
                      style={styles.select}
                    >
                      <option value="">Select a product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </View>

                  <Text style={styles.inputLabel}>Reviewer Name</Text>
                  <TextInput
                    style={styles.input}
                    value={newReview.reviewer_name}
                    onChangeText={(text) => setNewReview({ ...newReview, reviewer_name: text })}
                    placeholder="Enter reviewer name"
                  />
                  
                  <Text style={styles.inputLabel}>Reviewer Email</Text>
                  <TextInput
                    style={styles.input}
                    value={newReview.reviewer_email}
                    onChangeText={(text) => setNewReview({ ...newReview, reviewer_email: text })}
                    placeholder="Enter reviewer email"
                    keyboardType="email-address"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Rating</Text>
              <StarRatingInput 
                rating={editingReview ? editingReview.rating : newReview.rating} 
                setRating={(rating) => {
                  if (editingReview) {
                    setEditingReview({ ...editingReview, rating });
                  } else {
                    setNewReview({ ...newReview, rating });
                  }
                }}
              />

              <Text style={styles.inputLabel}>Review Comment</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                value={editingReview ? editingReview.comment : newReview.comment}
                onChangeText={(text) => {
                  if (editingReview) {
                    setEditingReview({ ...editingReview, comment: text });
                  } else {
                    setNewReview({ ...newReview, comment: text });
                  }
                }}
                placeholder="Write review comment here..."
              />
              
              {editingReview && (
                <>
                  <Text style={styles.inputLabel}>Review Date</Text>
                  <input
                    id="review-date-input"
                    type="datetime-local"
                    style={{
                      padding: 10,
                      borderRadius: borderRadius.small,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: 16,
                      width: '100%'
                    }}
                    key={editingReview.id} // Force re-render when review changes
                    defaultValue={editingReview.created_at ? new Date(editingReview.created_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      try {
                        const dateValue = e.target.value;
                        console.log('DATE PICKER VALUE:', dateValue);
                        
                        if (!dateValue) {
                          console.log('Empty date value');
                          return;
                        }
                        
                        // Create a date object with the local timezone
                        const newDate = new Date(dateValue);
                        console.log('NEW DATE OBJECT:', newDate);
                        console.log('NEW DATE ISO:', newDate.toISOString());
                        
                        // Create a completely new object to avoid reference issues
                        const updatedReview = {
                          ...editingReview,
                          created_at: newDate.toISOString()
                        };
                        
                        console.log('UPDATED REVIEW OBJECT:', JSON.stringify(updatedReview, null, 2));
                        setEditingReview(updatedReview);
                      } catch (err) {
                        console.error('Error parsing date:', err);
                        Alert.alert('Error', 'Invalid date format');
                      }
                    }}
                  />
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button onPress={editingReview ? handleEditReview : handleAddReview}>
                {editingReview ? 'Update' : 'Add'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  dialog: {
    maxWidth: 500,
    width: '90%',
    alignSelf: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    height: 40,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  select: {
    width: '100%',
    height: 40,
    paddingHorizontal: 8,
    border: 'none',
    outline: 'none',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});
