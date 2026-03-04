import React, { useState, useEffect } from 'react';
import './CertificateVerification.css';

const CertificateVerification = () => {
  const [certificateId, setCertificateId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'loading', 'verified', 'invalid'
  const [certificateData, setCertificateData] = useState(null);
  const [error, setError] = useState('');

  // Get certificate ID from URL if present
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/verify\/([A-Z0-9-]+)/);
    if (match) {
      const id = match[1];
      setCertificateId(id);
      verifyCertificate(id);
    }
  }, []);

  const verifyCertificate = async (id) => {
    if (!id || id.trim() === '') {
      setError('Please enter a certificate ID');
      return;
    }

    setVerificationStatus('loading');
    setError('');

    try {
      // Simulate API call - In production, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock verification logic
      if (id.startsWith('TIA-')) {
        // Certificate is valid
        setCertificateData({
          certificateId: id,
          recipientName: 'John Doe',
          planName: 'AI Interview Mastery',
          issueDate: 'February 15, 2026',
          achievements: {
            interviewsCompleted: 15,
            averageScore: 87,
            skillsAssessed: ['Communication', 'Problem Solving', 'Technical Skills', 'Leadership'],
            hoursCompleted: 12
          },
          status: 'active'
        });
        setVerificationStatus('verified');
      } else {
        setVerificationStatus('invalid');
        setError('Certificate not found or invalid');
      }
    } catch (err) {
      setVerificationStatus('invalid');
      setError('Failed to verify certificate. Please try again.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyCertificate(certificateId);
  };

  return (
    <div className="verification-page">
      <div className="verification-container">
        {/* Header */}
        <div className="verification-header">
          <div className="verify-logo">
            <div className="logo-icon">🎯</div>
            <h1>TryInterview</h1>
          </div>
          <h2>Certificate Verification</h2>
          <p>Verify the authenticity of TryInterview AI certifications</p>
        </div>

        {/* Search Form */}
        <div className="verification-search">
          <form onSubmit={handleSubmit}>
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g., TIA-ABC123XYZ)"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                className="certificate-input"
              />
              <button 
                type="submit" 
                className="verify-btn"
                disabled={verificationStatus === 'loading'}
              >
                {verificationStatus === 'loading' ? (
                  <>
                    <span className="spinner">⏳</span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    Verify Certificate
                  </>
                )}
              </button>
            </div>
          </form>

          {error && verificationStatus !== 'loading' && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>

        {/* Verification Result */}
        {verificationStatus === 'verified' && certificateData && (
          <div className="verification-result verified">
            <div className="result-icon verified-icon">✓</div>
            <h3>Certificate Verified</h3>
            <p className="result-message">This certificate is authentic and valid</p>

            <div className="certificate-details">
              <div className="detail-row">
                <span className="detail-label">Certificate ID:</span>
                <span className="detail-value">{certificateData.certificateId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Recipient:</span>
                <span className="detail-value">{certificateData.recipientName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Certification:</span>
                <span className="detail-value">{certificateData.planName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Issue Date:</span>
                <span className="detail-value">{certificateData.issueDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-active">
                  <span className="status-dot"></span>
                  Active
                </span>
              </div>
            </div>

            <div className="achievements-summary">
              <h4>Achievement Summary</h4>
              <div className="achievement-grid">
                <div className="achievement-box">
                  <div className="achievement-icon">📊</div>
                  <div className="achievement-number">{certificateData.achievements.interviewsCompleted}</div>
                  <div className="achievement-text">Interviews</div>
                </div>
                <div className="achievement-box">
                  <div className="achievement-icon">⭐</div>
                  <div className="achievement-number">{certificateData.achievements.averageScore}%</div>
                  <div className="achievement-text">Avg Score</div>
                </div>
                <div className="achievement-box">
                  <div className="achievement-icon">🎓</div>
                  <div className="achievement-number">{certificateData.achievements.skillsAssessed.length}</div>
                  <div className="achievement-text">Skills</div>
                </div>
                <div className="achievement-box">
                  <div className="achievement-icon">⏱️</div>
                  <div className="achievement-number">{certificateData.achievements.hoursCompleted}h</div>
                  <div className="achievement-text">Training</div>
                </div>
              </div>
            </div>

            <div className="skills-verified">
              <h4>Verified Skills</h4>
              <div className="skills-tags">
                {certificateData.achievements.skillsAssessed.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="verification-footer">
              <p>
                <span className="footer-icon">🔒</span>
                This certificate has been verified through TryInterview's secure verification system
              </p>
            </div>
          </div>
        )}

        {verificationStatus === 'invalid' && (
          <div className="verification-result invalid">
            <div className="result-icon invalid-icon">✕</div>
            <h3>Certificate Not Found</h3>
            <p className="result-message">
              The certificate ID you entered could not be verified. Please check the ID and try again.
            </p>
            <div className="help-text">
              <h4>Common Issues:</h4>
              <ul>
                <li>Certificate ID may have been entered incorrectly</li>
                <li>Certificate may have been revoked or expired</li>
                <li>Certificate ID format should be: TIA-XXXXXXXXXXXX</li>
              </ul>
            </div>
          </div>
        )}

        {/* Info Section */}
        {verificationStatus === null && (
          <div className="info-section">
            <h3>How to Verify</h3>
            <div className="info-steps">
              <div className="info-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Get Certificate ID</h4>
                  <p>Request the certificate ID from the certificate holder</p>
                </div>
              </div>
              <div className="info-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Enter ID Above</h4>
                  <p>Type or paste the certificate ID in the search box</p>
                </div>
              </div>
              <div className="info-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>View Results</h4>
                  <p>Instantly see certificate details and authenticity status</p>
                </div>
              </div>
            </div>

            <div className="trust-badges">
              <div className="trust-badge">
                <span>🔒</span>
                <p>Secure Verification</p>
              </div>
              <div className="trust-badge">
                <span>⚡</span>
                <p>Instant Results</p>
              </div>
              <div className="trust-badge">
                <span>✓</span>
                <p>100% Authentic</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerification;
