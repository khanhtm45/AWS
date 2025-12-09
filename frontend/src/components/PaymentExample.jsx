import { API_BASE_URL } from '../config/api';
import React from 'react';

export default function PaymentExample() {
  const initiate = async (provider) => {
    const body = {
      orderId: 'ORDER-' + Date.now(),
      amount: 100000, // VND
      currency: 'VND',
      method: provider === 'CASH' ? 'CASH' : 'CARD',
      provider: provider,
      returnUrl: window.location.origin + '/payment-return'
    };

    const resp = await fetch('${API_BASE_URL}/api/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (data && data.paymentUrl) {
      // provider returns a URL to redirect user to (VNPAY/MOMO)
      window.location.href = data.paymentUrl;
      return;
    }
    if (data && data.clientSecret) {
      // Stripe-like flow: return client secret to front-end
      alert('Stripe clientSecret received: ' + data.clientSecret);
      return;
    }
    alert('Payment initiated: ' + JSON.stringify(data));
  };

  return (
    <div style={{padding:20}}>
      <h3>Payment Example</h3>
      <button onClick={() => initiate('VNPAY')}>Pay with VNPAY</button>
      <button onClick={() => initiate('MOMO')}>Pay with MOMO</button>
      <button onClick={() => initiate('STRIPE')}>Pay with STRIPE</button>
      <button onClick={() => initiate('CASH')}>Cash on Delivery</button>
    </div>
  );
}
