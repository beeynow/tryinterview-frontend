import React, { useState, useEffect } from 'react';
import {
  StreamVideo,
  StreamCall,
  CallControls,
  SpeakerLayout,
  CallParticipantsList,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './MeetingRoom.css';
import {
  initializeStreamClient,
  createMeeting,
  joinMeeting,
  leaveMeeting,
  generateMeetingId,
  getMeetingUrl,
} from '../services/streamService';
import { auth } from '../firebaseConfig';

const MeetingRoom = () => {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [meetingId, setMeetingId] = useState('');
  const [inputMeetingId, setInputMeetingId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize Stream client when component mounts
  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          setError('Please sign in to use video meetings');
          setLoading(false);
          return;
        }

        const streamClient = await initializeStreamClient(currentUser);
        setClient(streamClient);
        
        // Check if there's a meeting ID in URL
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const urlMeetingId = urlParams.get('id');
        
        if (urlMeetingId) {
          setInputMeetingId(urlMeetingId);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to initialize video client: ' + err.message);
        console.error('Stream client init error:', err);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (call) {
        leaveMeeting(call).catch(console.error);
      }
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, []);

  // Handle creating a new meeting
  const handleCreateMeeting = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      const newMeetingId = generateMeetingId();
      const newCall = await createMeeting(client, newMeetingId);
      await newCall.join({ create: true });
      
      setCall(newCall);
      setMeetingId(newMeetingId);
      
      // Update URL
      window.history.pushState({}, '', `#dashboard/meeting?id=${newMeetingId}`);
      
      console.log('✅ Meeting created and joined:', newMeetingId);
    } catch (err) {
      setError('Failed to create meeting: ' + err.message);
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle joining an existing meeting
  const handleJoinMeeting = async () => {
    if (!inputMeetingId.trim()) {
      setError('Please enter a meeting ID');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const existingCall = await joinMeeting(client, inputMeetingId.trim());
      setCall(existingCall);
      setMeetingId(inputMeetingId.trim());
      
      // Update URL
      window.history.pushState({}, '', `#dashboard/meeting?id=${inputMeetingId.trim()}`);
      
      console.log('✅ Joined meeting:', inputMeetingId.trim());
    } catch (err) {
      setError('Failed to join meeting: ' + err.message);
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle leaving meeting
  const handleLeaveMeeting = async () => {
    try {
      if (call) {
        await leaveMeeting(call);
        setCall(null);
        setMeetingId('');
        setInputMeetingId('');
        
        // Update URL
        window.history.pushState({}, '', '#dashboard/meeting');
        
        console.log('✅ Left meeting');
      }
    } catch (err) {
      setError('Failed to leave meeting: ' + err.message);
      console.error(err);
    }
  };

  // Copy meeting link to clipboard
  const copyMeetingLink = () => {
    const link = getMeetingUrl(meetingId);
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="meeting-lobby">
        <div className="lobby-container">
          <div className="lobby-loading">
            <div className="loading-spinner">⏳</div>
            <p>Initializing video client...</p>
          </div>
        </div>
      </div>
    );
  }

  // Lobby view (before joining a call)
  if (!call) {
    return (
      <div className="meeting-lobby">
        <div className="lobby-container">
          <div className="lobby-header">
            <h1>🎥 Video Meeting</h1>
            <p>Start a new meeting or join an existing one</p>
          </div>

          {error && (
            <div className="meeting-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="lobby-actions">
            {/* Create New Meeting */}
            <div className="lobby-section">
              <h3>Start a New Meeting</h3>
              <p>Create a new video meeting room instantly</p>
              <button
                className="btn-create-meeting"
                onClick={handleCreateMeeting}
                disabled={isCreating || !client}
              >
                {isCreating ? (
                  <>
                    <span className="btn-spinner">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">➕</span>
                    Create Meeting
                  </>
                )}
              </button>
            </div>

            <div className="lobby-divider">
              <span>OR</span>
            </div>

            {/* Join Existing Meeting */}
            <div className="lobby-section">
              <h3>Join a Meeting</h3>
              <p>Enter the meeting ID to join</p>
              <div className="join-input-group">
                <input
                  type="text"
                  placeholder="Enter Meeting ID"
                  value={inputMeetingId}
                  onChange={(e) => setInputMeetingId(e.target.value)}
                  className="meeting-id-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinMeeting()}
                />
                <button
                  className="btn-join-meeting"
                  onClick={handleJoinMeeting}
                  disabled={isJoining || !client || !inputMeetingId.trim()}
                >
                  {isJoining ? (
                    <>
                      <span className="btn-spinner">⏳</span>
                      Joining...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🚪</span>
                      Join Meeting
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {!client && !error && (
            <div className="lobby-loading">
              <div className="loading-spinner">⏳</div>
              <p>Initializing video client...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Meeting room view (in a call)
  return (
    <div className="meeting-room">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <MeetingRoomUI
            meetingId={meetingId}
            onLeave={handleLeaveMeeting}
            onCopyLink={copyMeetingLink}
            isCopied={isCopied}
            showParticipants={showParticipants}
            setShowParticipants={setShowParticipants}
          />
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

// Meeting Room UI Component (inside the call)
const MeetingRoomUI = ({ meetingId, onLeave, onCopyLink, isCopied, showParticipants, setShowParticipants }) => {
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();

  return (
    <div className="meeting-room-container">
      {/* Top Bar */}
      <div className="meeting-top-bar">
        <div className="meeting-info">
          <span className="meeting-id-badge">
            <span className="badge-icon">🔗</span>
            Meeting ID: {meetingId}
          </span>
          <button className="btn-copy-link" onClick={onCopyLink}>
            {isCopied ? (
              <>
                <span>✓</span>
                Copied!
              </>
            ) : (
              <>
                <span>📋</span>
                Copy Link
              </>
            )}
          </button>
        </div>
        <div className="meeting-actions">
          <button
            className={`btn-participants ${showParticipants ? 'active' : ''}`}
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <span>👥</span>
            {participantCount} {participantCount === 1 ? 'Participant' : 'Participants'}
          </button>
          <button className="btn-leave" onClick={onLeave}>
            <span>📞</span>
            Leave Meeting
          </button>
        </div>
      </div>

      {/* Video Layout */}
      <div className="meeting-video-area">
        <SpeakerLayout participantsBarPosition="bottom" />
        
        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="participants-sidebar">
            <div className="participants-header">
              <h3>Participants ({participantCount})</h3>
              <button onClick={() => setShowParticipants(false)}>✕</button>
            </div>
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="meeting-controls-bar">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
};

export default MeetingRoom;
