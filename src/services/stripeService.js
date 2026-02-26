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
    
    // Call backend API to create checkout session
    const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId: user.uid,
        email: user.email
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    
    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received from backend');
    }
  } catch (error) {
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
