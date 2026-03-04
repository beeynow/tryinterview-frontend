import React, { useRef, useState } from 'react';
import './Certificate.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Certificate = ({ user, certificateData, onClose }) => {
  const certificateRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Generate unique certificate ID
  const generateCertificateId = () => {
    if (certificateData?.certificateId) return certificateData.certificateId;
    
    const timestamp = Date.now();
    const userId = user?.uid || 'guest';
    const hash = btoa(`${userId}-${timestamp}`).substring(0, 12).toUpperCase();
    return `TIA-${hash}`;
  };

  const certificateId = generateCertificateId();
  const issueDate = certificateData?.issueDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate achievements
  const achievements = certificateData?.achievements || {
    interviewsCompleted: 15,
    averageScore: 87,
    skillsAssessed: ['Communication', 'Problem Solving', 'Technical Skills', 'Leadership'],
    hoursCompleted: 12
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Certified Professional';

  // Download certificate as PDF
  const downloadCertificate = async () => {
    setIsGenerating(true);
    try {
      const element = certificateRef.current;
      
      // Capture certificate as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TryInterview-Certificate-${certificateId}.pdf`);
      
      console.log('✅ Certificate downloaded:', certificateId);
    } catch (error) {
      console.error('❌ Certificate download error:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Share certificate
  const shareCertificate = async () => {
    const shareData = {
      title: 'TryInterview AI Certification',
      text: `I've earned my AI Interview Certification from TryInterview! Certificate ID: ${certificateId}`,
      url: `https://tryinterview.site/verify/${certificateId}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy link to clipboard
      const verifyUrl = `https://tryinterview.site/verify/${certificateId}`;
      navigator.clipboard.writeText(verifyUrl);
      alert('Verification link copied to clipboard!');
    }
  };

  return (
    <div className="certificate-modal-overlay" onClick={onClose}>
      <div className="certificate-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="certificate-close-btn" onClick={onClose}>×</button>
        
        {/* Certificate Display */}
        <div className="certificate-wrapper" ref={certificateRef}>
          {/* Outer Black Frame */}
          <div className="certificate-outer-frame">
            {/* Inner Gold Border */}
            <div className="certificate-inner-frame">
          {/* Decorative Background */}
          <div className="certificate-background">
            <div className="cert-pattern cert-pattern-1"></div>
            <div className="cert-pattern cert-pattern-2"></div>
            <div className="cert-pattern cert-pattern-3"></div>
            <div className="cert-pattern cert-pattern-4"></div>
          </div>

          {/* Border Frame */}
          <div className="certificate-border">
            <div className="certificate-border-inner">
              
              {/* Header */}
              <div className="certificate-header">
                <div className="certificate-logo">
                  <div className="logo-icon">🎯</div>
                  <div className="logo-text">
                    <h1>TryInterview</h1>
                    <p>AI-Powered Interview Excellence</p>
                  </div>
                </div>
                <div className="certificate-badge">
                  <div className="badge-icon">✓</div>
                  <span>Certified</span>
                </div>
              </div>

              {/* Title */}
              <div className="certificate-title">
                <h2>Certificate of Achievement</h2>
                <div className="certificate-subtitle">
                  <span className="subtitle-line"></span>
                  <span className="subtitle-text">AI Interview Mastery</span>
                  <span className="subtitle-line"></span>
                </div>
              </div>

              {/* Recognition Text */}
              <div className="certificate-recognition">
                <p className="recognition-intro">This certificate is proudly presented to</p>
                <h3 className="recipient-name">{user?.displayName || user?.email || 'Certified Professional'}</h3>
                <p className="recognition-text">
                  for successfully demonstrating exceptional interview skills and professional excellence 
                  through our comprehensive AI-powered interview preparation program.
                </p>
              </div>

              {/* Achievements Grid */}
              <div className="certificate-achievements">
                <div className="achievement-item">
                  <div className="achievement-icon">📊</div>
                  <div className="achievement-value">{achievements.interviewsCompleted}</div>
                  <div className="achievement-label">Interviews Completed</div>
                </div>
                <div className="achievement-item">
                  <div className="achievement-icon">⭐</div>
                  <div className="achievement-value">{achievements.averageScore}%</div>
                  <div className="achievement-label">Average Score</div>
                </div>
                <div className="achievement-item">
                  <div className="achievement-icon">🎓</div>
                  <div className="achievement-value">{achievements.skillsAssessed.length}</div>
                  <div className="achievement-label">Skills Assessed</div>
                </div>
                <div className="achievement-item">
                  <div className="achievement-icon">⏱️</div>
                  <div className="achievement-value">{achievements.hoursCompleted}h</div>
                  <div className="achievement-label">Training Hours</div>
                </div>
              </div>

              {/* Skills Badges */}
              <div className="certificate-skills">
                <p className="skills-label">Mastered Skills:</p>
                <div className="skills-list">
                  {achievements.skillsAssessed.map((skill, index) => (
                    <span key={index} className="skill-badge">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="certificate-footer">
                <div className="footer-section">
                  <div className="signature-line">
                    <div className="signature">
                      <div className="signature-text">TryInterview Team</div>
                      <div className="signature-title">Chief Certification Officer</div>
                    </div>
                  </div>
                </div>
                
                <div className="footer-divider"></div>
                
                <div className="footer-section">
                  <div className="certificate-meta">
                    <div className="meta-item">
                      <span className="meta-label">Issue Date:</span>
                      <span className="meta-value">{issueDate}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Certificate ID:</span>
                      <span className="meta-value">{certificateId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Section (Placeholder) */}
              <div className="certificate-qr">
                <div className="qr-code">
                  <div className="qr-placeholder">📱</div>
                </div>
                <p className="qr-text">Scan to verify</p>
              </div>

              {/* Watermark */}
              <div className="certificate-watermark">TryInterview</div>

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="certificate-actions">
          <button 
            className="cert-btn cert-btn-primary" 
            onClick={downloadCertificate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="btn-spinner">⏳</span>
                Generating PDF...
              </>
            ) : (
              <>
                <span className="btn-icon">⬇️</span>
                Download Certificate
              </>
            )}
          </button>
          
          <button className="cert-btn cert-btn-secondary" onClick={shareCertificate}>
            <span className="btn-icon">🔗</span>
            Share Certificate
          </button>
          
          <button 
            className="cert-btn cert-btn-outline" 
            onClick={() => setShowVerification(!showVerification)}
          >
            <span className="btn-icon">✓</span>
            Verification Info
          </button>
        </div>

        {/* Verification Info */}
        {showVerification && (
          <div className="verification-info">
            <h4>Certificate Verification</h4>
            <p>This certificate can be verified at:</p>
            <div className="verification-url">
              https://tryinterview.site/verify/{certificateId}
            </div>
            <p className="verification-note">
              Employers can verify the authenticity of this certificate using the unique ID above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;
