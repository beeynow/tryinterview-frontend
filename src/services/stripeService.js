// Price IDs from environment variables
export const STRIPE_PRICES = {
  STARTER: process.env.REACT_APP_STRIPE_PRICE_STARTER,
  PROFESSIONAL: process.env.REACT_APP_STRIPE_PRICE_PROFESSIONAL,
  PREMIUM: process.env.REACT_APP_STRIPE_PRICE_PREMIUM,
  ENTERPRISE: process.env.REACT_APP_STRIPE_PRICE_ENTERPRISE,
};

// Debug: Log loaded Price IDs in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Stripe Price IDs Loaded:', {
    STARTER: STRIPE_PRICES.STARTER ? STRIPE_PRICES.STARTER.substring(0, 20) + '...' : '❌ undefined',
    PROFESSIONAL: STRIPE_PRICES.PROFESSIONAL ? STRIPE_PRICES.PROFESSIONAL.substring(0, 20) + '...' : '❌ undefined',
    PREMIUM: STRIPE_PRICES.PREMIUM ? STRIPE_PRICES.PREMIUM.substring(0, 20) + '...' : '❌ undefined',
    ENTERPRISE: STRIPE_PRICES.ENTERPRISE ? STRIPE_PRICES.ENTERPRISE.substring(0, 20) + '...' : '❌ undefined',
  });
}

/**
 * Redirect to Stripe Checkout for subscription
 * @param {string} priceId - The Stripe Price ID
 * @param {object} user - The authenticated user object
 * @returns {Promise} Stripe checkout redirect
 */
export const createCheckoutSession = async (priceId, user) => {
  try {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://tryinterview-backend.vercel.app';
    
    console.log('🔵 Creating checkout session...', {
      backend: BACKEND_URL,
      priceId: priceId.substring(0, 20) + '...',
      userId: user.uid.substring(0, 10) + '...',
      email: user.email
    });
    
    // Call backend API to create checkout session
    const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        priceId,
        userId: user.uid,
        email: user.email
      }),
    });

    console.log('🔵 Response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        errorMessage = text || `Server returned ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('🔵 Checkout session created:', data);
    
    // Redirect to Stripe Checkout
    if (data.url) {
      console.log('🔵 Redirecting to Stripe...');
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL received from backend');
    }
  } catch (error) {
    console.error('❌ Checkout error:', error);
    throw error;
  }
};

/**
 * Create a customer portal session for managing subscriptions
 * @param {string} customerId - The Stripe Customer ID
 * @returns {Promise} Redirect to customer portal
 */
export const createPortalSession = async (customerId) => {
  try {
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://tryinterview-backend.vercel.app';
    
    const response = await fetch(`${BACKEND_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if Stripe is properly configured
 * @returns {boolean} True if Stripe keys are present
 */
export const isStripeConfigured = () => {
  return !!(
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY &&
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_publishable_key_here'
  );
};
