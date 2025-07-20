import React, { useState, useEffect } from 'react';

// You may want to fetch these from your backend in the future
const TEMPLATES = [
  { value: 'order-confirmation', label: 'Order Confirmation' },
  { value: 'order-update', label: 'Order Update / Shipment Tracking' },
  { value: 'enquiry-reply', label: 'Enquiry Reply' },
  { value: 'inbox-friendly-update', label: 'Inbox-Friendly: Order Update' },
  { value: 'inbox-friendly-arriving', label: 'Inbox-Friendly: Order Arriving Today' },
  { value: 'inbox-friendly-delivered', label: 'Inbox-Friendly: Order Delivered' },
];

export default function AdminEmailsPage() {
  const [to, setTo] = useState('');
  const [template, setTemplate] = useState('order-confirmation');
  const [subject, setSubject] = useState('');
  const [orderData, setOrderData] = useState(''); // JSON string for order/enquiry
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Fields for inbox-friendly emails
  const [customerName, setCustomerName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  
  // Determine if we're using an inbox-friendly template
  const isInboxFriendly = template.startsWith('inbox-friendly-');

  // Update JSON data when inbox-friendly fields change
  useEffect(() => {
    if (isInboxFriendly) {
      const data = {
        customerName,
        id: orderNumber,
        trackingCode
      };
      setOrderData(JSON.stringify(data, null, 2));
    }
  }, [isInboxFriendly, customerName, orderNumber, trackingCode]);

  const handleSend = async (e) => {
    e.preventDefault(); // Prevent full page reload
    setStatus('');
    setLoading(true);
    try {
      let data;
      
      if (isInboxFriendly) {
        // Use the dedicated fields for inbox-friendly emails
        data = {
          customerName,
          id: orderNumber,
          trackingCode
        };
      } else {
        // Use the JSON textarea for other templates
        data = orderData ? JSON.parse(orderData) : {};
      }
      
      const payload = {
        to,
        template,
        subject,
        data,
      };
      const res = await fetch('/.netlify/functions/sendAdminEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      // First check if the response is OK
      if (!res.ok) {
        setStatus(`Server error: ${res.status} ${res.statusText}`);
        console.error('Server error:', res.status, res.statusText);
        setLoading(false);
        return;
      }
      
      // Get the raw text first
      const responseText = await res.text();
      console.log('Raw response:', responseText);
      
      // Check if the response is HTML (common when Netlify functions aren't properly served)
      if (responseText.trim().startsWith('<!DOCTYPE html>')) {
        setStatus('Error: Netlify functions not available. Make sure you are running with netlify dev.');
        console.error('Received HTML instead of JSON. Netlify functions may not be properly configured.');
        setLoading(false);
        return;
      }
      
      // Then try to parse as JSON
      let result = null;
      try {
        result = JSON.parse(responseText);
      } catch (err) {
        setStatus('Failed to parse response as JSON.');
        console.error('Failed to parse response as JSON:', err);
        console.error('Raw response was:', responseText);
        setLoading(false);
        return;
      }
      if (result.success) {
        setStatus('Email sent successfully!');
      } else {
        setStatus('Failed: ' + (result.error || 'Unknown error'));
      }
      if (result.logs) {
        console.log('Email send logs:', result.logs);
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ maxWidth: 520, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 32, maxHeight: '80vh', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: 18, color: '#bfa054' }}>Send Email to Customer</h2>
      <form onSubmit={handleSend}>
        <label>Email address:</label>
        <input
          type="email"
          required
          value={to}
          onChange={e => setTo(e.target.value)}
          style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <label>Template:</label>
        <select
          value={template}
          onChange={e => setTemplate(e.target.value)}
          style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        >
          {TEMPLATES.map(t => <option value={t.value} key={t.value}>{t.label}</option>)}
        </select>
        <label>Subject (optional):</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          placeholder="Leave blank for default"
        />
        {isInboxFriendly ? (
          <div>
            <label>Customer Name:</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
              placeholder="Customer's full name"
            />
            <label>Order Number:</label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
              placeholder="ORDER-12345"
            />
            {template === 'inbox-friendly-update' && (
              <>
                <label>Tracking Code:</label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={e => setTrackingCode(e.target.value)}
                  style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
                  placeholder="TRACK-67890"
                />
              </>
            )}
            <div style={{ marginBottom: 18, fontSize: 13, color: '#888' }}>
              Generated JSON: <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: '80px', overflowY: 'auto' }}>{orderData}</pre>
            </div>
          </div>
        ) : (
          <>
            <label>Order/Enquiry Data (JSON):</label>
            <textarea
              value={orderData}
              onChange={e => setOrderData(e.target.value)}
              rows={7}
              style={{ width: '100%', marginBottom: 18, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontFamily: 'monospace' }}
              placeholder='{"customerName":"Jane Doe","id":"ORDER123", ...}'
            />
          </>
        )}
        <button type="submit" disabled={loading} style={{ background: '#bfa054', color: '#fff', padding: '12px 28px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>
        {status && <div style={{ marginTop: 16, color: status.startsWith('Email sent') ? 'green' : 'crimson' }}>{status}</div>}
      </form>
      <div style={{ marginTop: 28, fontSize: 13, color: '#888' }}>
        <b>Tip:</b> {isInboxFriendly ? 'Fill in the fields above for inbox-friendly emails.' : 'Paste order or enquiry data as JSON.'}<br />
        Templates and logic can be extended in your functions.
      </div>
      
      <div style={{ marginTop: 20, padding: 15, backgroundColor: '#f7f3ea', borderRadius: 8, borderLeft: '4px solid #bfa054' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#bfa054' }}>About Inbox-Friendly Emails</h4>
        <p style={{ fontSize: 14, margin: 0 }}>
          Inbox-friendly emails are designed to land in the primary inbox rather than promotions tab.
          They use a personal tone, minimal formatting, and avoid marketing language.
        </p>
      </div>
    </div>
  );
}
