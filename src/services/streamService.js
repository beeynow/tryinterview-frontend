import { StreamVideoClient } from '@stream-io/video-react-sdk';

// Stream credentials - Use environment variables in production
const STREAM_CONFIG = {
  apiKey: process.env.REACT_APP_STREAM_API_KEY || '9s6ye2fkjw5j',
  appId: process.env.REACT_APP_STREAM_APP_ID || '1540671',
  secretKey: process.env.REACT_APP_STREAM_SECRET_KEY || 'e49vfnuy5uwa4hqczp5nt7w2nea2hkavpxp5qft8yrh4xxksztydyzkcy5mjf9bc'
};

/**
 * Generate Stream user token using the secret key
 * Note: In production, this MUST be done on the backend for security!
 * This implementation is for development/testing purposes only.
 */
export const generateUserToken = async (userId) => {
  try {
    // Create a server-side Stream client to generate tokens
    const crypto = window.crypto || window.msCrypto;
    
    // Generate token payload
    const payload = {
      user_id: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    };
    
    // For client-side implementation, we'll use a simpler approach
    // In production, you MUST call your backend API endpoint that generates this token
    
    // Using Stream's token generation (client-side for dev only)
    const token = await generateStreamToken(userId);
    
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    // Return null to allow SDK to work in development mode
    return null;
  }
};

/**
 * Generate Stream token using HMAC SHA256
 * WARNING: This is a simplified client-side implementation for development
 * In production, move this to your backend server!
 */
async function generateStreamToken(userId) {
  try {
    const encoder = new TextEncoder();
    
    // Create header and payload
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      user_id: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    };
    
    // Encode to base64url
    const base64urlEncode = (obj) => {
      const json = JSON.stringify(obj);
      const base64 = btoa(json);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };
    
    const encodedHeader = base64urlEncode(header);
    const encodedPayload = base64urlEncode(payload);
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Create signature using Web Crypto API
    const key = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(STREAM_CONFIG.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    );
    
    // Convert signature to base64url
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    const encodedSignature = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const token = `${message}.${encodedSignature}`;
    
    console.log('✅ Generated user token for:', userId);
    return token;
  } catch (error) {
    console.error('Token generation failed:', error);
    return null;
  }
}

/**
 * Initialize Stream Video Client
 */
export const initializeStreamClient = async (user) => {
  try {
    if (!user) {
      throw new Error('User is required to initialize Stream client');
    }

    const userId = user.uid;
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    
    // Create Stream user object
    const streamUser = {
      id: userId,
      name: userName,
      image: user.photoURL || `https://ui-avatars.com/api/?name=${userName}&background=4f46e5&color=fff`,
    };

    // Initialize client
    const client = new StreamVideoClient({
      apiKey: STREAM_CONFIG.apiKey,
      user: streamUser,
      token: await generateUserToken(userId),
    });

    console.log('✅ Stream Video Client initialized:', userId);
    return client;
  } catch (error) {
    console.error('❌ Stream client initialization error:', error);
    throw error;
  }
};

/**
 * Create a new call/meeting room
 */
export const createMeeting = async (client, callId, callType = 'default') => {
  try {
    if (!client) {
      throw new Error('Stream client is not initialized');
    }
    
    const call = client.call(callType, callId);
    
    await call.getOrCreate({
      data: {
        custom: {
          title: `Interview Meeting ${callId}`,
          description: 'TryInterview Video Meeting'
        },
      },
      ring: false,
      notify: false,
    });

    console.log('✅ Meeting created:', callId);
    return call;
  } catch (error) {
    console.error('❌ Create meeting error:', error);
    throw error;
  }
};

/**
 * Join an existing call/meeting room
 */
export const joinMeeting = async (client, callId, callType = 'default') => {
  try {
    if (!client) {
      throw new Error('Stream client is not initialized');
    }
    
    const call = client.call(callType, callId);
    
    // Try to join existing call or create if doesn't exist
    await call.join({ create: true });
    
    console.log('✅ Joined meeting:', callId);
    return call;
  } catch (error) {
    console.error('❌ Join meeting error:', error);
    throw error;
  }
};

/**
 * Leave a call
 */
export const leaveMeeting = async (call) => {
  try {
    await call.leave();
    console.log('✅ Left meeting');
  } catch (error) {
    console.error('❌ Leave meeting error:', error);
    throw error;
  }
};

/**
 * Generate a unique meeting ID
 */
export const generateMeetingId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `meet-${timestamp}-${random}`;
};

/**
 * Get meeting URL
 */
export const getMeetingUrl = (meetingId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/#dashboard/meeting?id=${meetingId}`;
};

export default {
  STREAM_CONFIG,
  initializeStreamClient,
  createMeeting,
  joinMeeting,
  leaveMeeting,
  generateMeetingId,
  getMeetingUrl,
};
