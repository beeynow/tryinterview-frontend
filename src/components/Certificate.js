import React, { useRef, useState } from 'react';
import './Certificate.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Certificate = ({ user, certificateData, onClose }) => {
  const certificateRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const generateCertificateId = () => {
    if (certificateData?.certificateId) return certificateData.certificateId;
    const timestamp = Date.now();
    const userId = user?.uid || 'guest';
    const hash = btoa(`${userId}-${timestamp}`).substring(0, 12).toUpperCase();
    return `TIA-${hash}`;
  };

  const certificateId = generateCertificateId();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Name Surname';

  const downloadCertificate = async () => {
    setIsGenerating(true);
    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

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
    } catch (error) {
      console.error('Certificate download error:', error);
      alert('Failed to download certificate.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareCertificate = async () => {
    const url = `https://tryinterview.site/verify/${certificateId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TryInterview Certificate',
          text: `Certificate ID: ${certificateId}`,
          url: url
        });
      } catch (err) {
        navigator.clipboard.writeText(url);
        alert('Link copied!');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="cert-close-btn" onClick={onClose}>×</button>
        
        <div className="certificate-replica" ref={certificateRef}>
          
          {/* Black Frame */}
          <div className="cert-frame-black">
            
            {/* Cream/Beige Certificate Body */}
            <div className="cert-body">
              
              {/* Diagonal Ribbon Corner - EXACT POSITION */}
              <div className="ribbon-corner">
                {/* Black diagonal stripe */}
                <div className="ribbon-stripe-black"></div>
                {/* Gold diagonal stripe */}
                <div className="ribbon-stripe-gold"></div>
                
                {/* Circular "1st" Badge ON the ribbon */}
                <div className="badge-1st">
                  <div className="badge-gold-outer">
                    <div className="badge-black-ring">
                      <div className="badge-gold-inner">
                        <div className="badge-text-1">1</div>
                        <div className="badge-text-st">st</div>
                      </div>
                    </div>
                  </div>
                  {/* Ribbon tails */}
                  <div className="ribbon-tail ribbon-tail-1"></div>
                  <div className="ribbon-tail ribbon-tail-2"></div>
                </div>
              </div>

              {/* Main Certificate Content */}
              <div className="cert-content">
                
                {/* CERTIFICATE Title */}
                <h1 className="title-certificate">CERTIFICATE</h1>
                
                {/* Black rounded bar with "OF APPRECIATION" */}
                <div className="subtitle-bar">
                  <span>OF APPRECIATION</span>
                </div>

                {/* Small text above name */}
                <p className="text-presented">THIS CERTIFICATE IS PROUDLY PRESENTED TO</p>

                {/* Recipient Name in Script */}
                <h2 className="name-script">{userName}</h2>
                
                {/* Decorative underline */}
                <div className="name-line"></div>

                {/* Body paragraph */}
                <p className="body-text">
                  For successfully demonstrating exceptional interview skills and professional excellence 
                  through our comprehensive AI-powered interview preparation program. This certification 
                  acknowledges outstanding achievement in mastering modern interview techniques and 
                  communication skills.
                </p>

                {/* Bottom Section - Seals and Signature */}
                <div className="bottom-row">
                  
                  {/* Left: Seal + Date */}
                  <div className="bottom-left">
                    <div className="seal">
                      <div className="seal-circle-outer">
                        <div className="seal-circle-mid">
                          <div className="seal-circle-inner">
                            <span className="seal-icon">✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bottom-line"></div>
                    <div className="bottom-label">Date</div>
                  </div>

                  {/* Center: Signature */}
                  <div className="bottom-center">
                    <div className="bottom-line"></div>
                    <div className="bottom-label">Authorized Signature</div>
                  </div>

                  {/* Right: Seal + Director */}
                  <div className="bottom-right">
                    <div className="seal">
                      <div className="seal-circle-outer">
                        <div className="seal-circle-mid">
                          <div className="seal-circle-inner">
                            <span className="seal-icon">✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bottom-line"></div>
                    <div className="bottom-label">Director</div>
                  </div>

                </div>

                {/* Certificate ID footer */}
                <div className="cert-footer">
                  Certificate ID: {certificateId}
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="cert-actions">
          <button className="cert-btn cert-btn-download" onClick={downloadCertificate} disabled={isGenerating}>
            {isGenerating ? '⏳ Generating...' : '⬇️ Download PDF'}
          </button>
          <button className="cert-btn cert-btn-share" onClick={shareCertificate}>
            🔗 Share
          </button>
          <button className="cert-btn cert-btn-verify" onClick={() => setShowVerification(!showVerification)}>
            ✓ Verify
          </button>
        </div>

        {showVerification && (
          <div className="verify-box">
            <h4>Certificate Verification</h4>
            <p>Verify at: <code>https://tryinterview.site/verify/{certificateId}</code></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;
