// Test script for admin inbox-friendly emails
require('dotenv').config();
const { handler } = require('./netlify/functions/sendAdminEmail');

async function testAdminInboxFriendlyEmails() {
  const testEmail = 'rarecollectablessales@gmail.com'; // Change to your test email
  const orderNumber = 'ORDER-' + Math.floor(Math.random() * 10000);
  
  // Test data for all email types
  const testData = {
    customerName: 'John Smith',
    id: orderNumber,
    trackingCode: 'TRACK-' + Math.floor(Math.random() * 10000),
    trackingUrl: 'https://tracking.example.com',
  };
  
  // Test inbox-friendly order update email
  console.log('\n1. Testing inbox-friendly order update email...');
  const updateEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      to: testEmail,
      template: 'inbox-friendly-update',
      data: testData
    })
  };
  
  try {
    const updateResult = await handler(updateEvent);
    console.log('Result:', updateResult);
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Wait 3 seconds before sending next email
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test inbox-friendly order arriving today email
  console.log('\n2. Testing inbox-friendly order arriving today email...');
  const arrivingEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      to: testEmail,
      template: 'inbox-friendly-arriving',
      data: testData
    })
  };
  
  try {
    const arrivingResult = await handler(arrivingEvent);
    console.log('Result:', arrivingResult);
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Wait 3 seconds before sending next email
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test inbox-friendly order delivered email
  console.log('\n3. Testing inbox-friendly order delivered email...');
  const deliveredEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      to: testEmail,
      template: 'inbox-friendly-delivered',
      data: testData
    })
  };
  
  try {
    const deliveredResult = await handler(deliveredEvent);
    console.log('Result:', deliveredResult);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the tests
testAdminInboxFriendlyEmails();
