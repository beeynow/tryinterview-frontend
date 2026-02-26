import React, { useEffect, useState } from 'react';
import './PaymentSuccess.css';

const PaymentSuccess = ({ user }) => {
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, error
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');

      if (!sessionId) {
        console.error('❌ No session_id found in URL');
        setVerificationStatus('error');
        return;
      }

      try {
        console.log('🔍 Verifying payment...', { sessionId, attempt: retryCount + 1 });
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://tryinterview-backend.vercel.app';

        const response = await fetch(
          `${BACKEND_URL}/api/verify-payment?session_id=${sessionId}&userId=${user?.uid || 'guest'}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Verification failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Payment verified:', data);

        if (data.success && data.subscription) {
          setSubscriptionData(data.subscription);
          setVerificationStatus('success');
          
          // Trigger confetti
          createConfetti();
          
          // Start countdown
          startCountdown();
        } else if (retryCount < maxRetries) {
          // Retry after delay
          console.log('⏳ Retrying verification...');
          setTimeout(() => {
            setRetryCount(retryCount + 1);
          }, 2000);
        } else {
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('❌ Payment verification error:', error);
        
        if (retryCount < maxRetries) {
          console.log('⏳ Retrying verification...');
          setTimeout(() => {
            setRetryCount(retryCount + 1);
          }, 2000);
        } else {
          setVerificationStatus('error');
        }
      }
    };

    verifyPayment();
  }, [user?.uid, retryCount]);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/#dashboard/subscription';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const createConfetti = () => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
    const confettiContainer = document.querySelector('.confetti-container');
    
    if (!confettiContainer) return;

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
      confettiContainer.appendChild(confetti);

      // Remove after animation
      setTimeout(() => confetti.remove(), 5000);
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = '/#dashboard/subscription';
  };

  if (verificationStatus === 'verifying') {
    return (
      <div className="payment-success-page">
        <div className="verification-container">
          <div className="loader-spinner"></div>
          <h2>Verifying Your Payment...</h2>
          <p>Please wait while we confirm your subscription</p>
          {retryCount > 0 && <p className="retry-text">Attempt {retryCount + 1} of {maxRetries + 1}</p>}
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="payment-success-page">
        <div className="verification-container error">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2>Verification Taking Longer Than Expected</h2>
          <p>Don't worry! Your payment was successful.</p>
          <p>Please check your email for confirmation, or contact support if you need assistance.</p>
          <button className="dashboard-btn" onClick={handleGoToDashboard}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <div className="confetti-container"></div>
      
      <div className="success-container">
        {/* Success Icon with Animation */}
        <div className="success-icon-large">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="success-title">Payment Successful!</h1>
        <p className="success-subtitle">
          Welcome to {subscriptionData?.planName} Plan
        </p>

        {/* Subscription Details Card */}
        <div className="subscription-details-card">
          <div className="detail-row">
            <span className="detail-label">Plan</span>
            <span className="detail-value plan-name">{subscriptionData?.planName}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value status-active">
              <span className="status-dot"></span>
              Active
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Amount Paid</span>
            <span className="detail-value amount">
              ${subscriptionData?.amount} {subscriptionData?.currency}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Billing Cycle</span>
            <span className="detail-value">{subscriptionData?.interval}ly</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Next Billing Date</span>
            <span className="detail-value">
              {subscriptionData?.currentPeriodEnd 
                ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Features Unlocked */}
        <div className="features-unlocked">
          <h3>🎉 You've Unlocked:</h3>
          <ul className="features-list">
            <li>✓ Unlimited AI Mock Interviews</li>
            <li>✓ Advanced Question Bank Access</li>
            <li>✓ Resume Analysis & Optimization</li>
            <li>✓ Meeting Summarizer</li>
            <li>✓ Priority Support</li>
            <li>✓ Performance Analytics</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="primary-btn" onClick={handleGoToDashboard}>
            Start Using {subscriptionData?.planName} ({countdown}s)
          </button>
          <p className="redirect-text">
            You'll be redirected to your dashboard automatically
          </p>
        </div>

        {/* Additional Info */}
        <div className="additional-info">
          <p>📧 A confirmation email has been sent to your inbox</p>
          <p>💳 You can manage your subscription anytime from your dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
