import React, { useState, useEffect, useRef } from 'react';
import {
  StreamVideo,
  StreamCall,
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
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('video');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

// Meeting Room UI Component (inside the call)
const MeetingRoomUI = ({ meetingId, onLeave, onCopyLink, isCopied, activeTab, setActiveTab }) => {
  const { useParticipantCount, useCallCallingState, useMicrophoneState, useCameraState } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const callingState = useCallCallingState();
  const { microphone, isMute } = useMicrophoneState();
  const { camera, isMute: isCameraOff } = useCameraState();
  
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [networkQuality] = useState('good'); // Can be enhanced with real network detection
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showControlTooltip, setShowControlTooltip] = useState(null);
  const chatEndRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const meetingTimerRef = useRef(null);

  // Meeting timer
  useEffect(() => {
    if (callingState === 'joined') {
      meetingTimerRef.current = setInterval(() => {
        setMeetingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (meetingTimerRef.current) {
        clearInterval(meetingTimerRef.current);
      }
    };
  }, [callingState]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingDuration(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear reaction after 3 seconds
  useEffect(() => {
    if (reaction) {
      const timer = setTimeout(() => setReaction(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [reaction]);

  // Format time helper
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send message
  const sendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        id: Date.now(),
        text: messageInput,
        sender: 'You',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessageInput('');
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      alert('Recording started! Note: This is a simulated recording for demo purposes.');
    } else {
      alert('Recording stopped and saved.');
    }
  };

  // Toggle hand raise
  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
  };

  // Send reaction
  const sendReaction = (emoji) => {
    setReaction(emoji);
  };

  // Save notes
  const saveNotes = () => {
    localStorage.setItem(`meeting-notes-${meetingId}`, notes);
    alert('Notes saved successfully!');
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    try {
      if (isMute) {
        await microphone.enable();
      } else {
        await microphone.disable();
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (isCameraOff) {
        await camera.enable();
      } else {
        await camera.disable();
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real implementation, this would control audio output device
    alert(isSpeakerOn ? 'Speaker muted' : 'Speaker unmuted');
  };

  // Share screen
  const toggleScreenShare = async () => {
    try {
      setIsScreenSharing(!isScreenSharing);
      // Screen sharing would be implemented with Stream SDK's screen share API
      alert(!isScreenSharing ? 'Screen sharing started' : 'Screen sharing stopped');
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  // Copy meeting link (enhanced)
  const copyMeetingLinkControl = () => {
    onCopyLink();
    setShowControlTooltip('link');
    setTimeout(() => setShowControlTooltip(null), 2000);
  };

  // Load notes on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`meeting-notes-${meetingId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [meetingId]);

  const tabs = [
    { id: 'video', label: 'Video Call', icon: '🎥' },
    { id: 'chat', label: 'Chat', icon: '💬', badge: messages.length },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'recording', label: 'Recording', icon: '⏺️' },
    { id: 'info', label: 'Info', icon: 'ℹ️' },
  ];

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
          <div className="meeting-timer">
            <span className="timer-icon">⏱️</span>
            {formatTime(meetingDuration)}
          </div>
          <div className={`network-indicator network-${networkQuality}`}>
            <span className="signal-icon">📶</span>
            <span className="network-text">{networkQuality}</span>
          </div>
        </div>
        <div className="meeting-actions">
          <button className={`btn-icon-action ${handRaised ? 'active' : ''}`} onClick={toggleHandRaise} title="Raise Hand">
            ✋
          </button>
          <div className="reactions-container">
            <button className="btn-icon-action" title="React">
              😊
            </button>
            <div className="reactions-menu">
              {['👍', '❤️', '😂', '👏', '🎉', '🤔'].map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)}>{emoji}</button>
              ))}
            </div>
          </div>
          <button className="btn-participants">
            <span>👥</span>
            {participantCount}
          </button>
          <button className="btn-leave" onClick={onLeave}>
            <span>📞</span>
            Leave
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="meeting-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.badge > 0 && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="meeting-content">
        {/* Video Tab */}
        {activeTab === 'video' && (
          <div className="tab-content video-content">
            <div className="video-main-area">
              <SpeakerLayout participantsBarPosition="bottom" />
              
              {/* Floating Reaction */}
              {reaction && (
                <div className="floating-reaction">
                  {reaction}
                </div>
              )}
              
              {/* Hand Raised Indicator */}
              {handRaised && (
                <div className="hand-raised-indicator">
                  <span className="hand-icon">✋</span>
                  <span>Hand Raised</span>
                </div>
              )}
            </div>
            
            {/* Participants Panel */}
            <div className="participants-panel">
              <div className="panel-header">
                <h3>Participants ({participantCount})</h3>
              </div>
              <div className="panel-content">
                <CallParticipantsList />
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="tab-content chat-content">
            <div className="chat-container">
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <span className="empty-icon">💬</span>
                    <p>No messages yet</p>
                    <p className="empty-subtitle">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="chat-message">
                      <div className="message-header">
                        <span className="message-sender">{msg.sender}</span>
                        <span className="message-time">{msg.timestamp}</span>
                      </div>
                      <div className="message-text">{msg.text}</div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="chat-input"
                />
                <button className="btn-send" onClick={sendMessage} disabled={!messageInput.trim()}>
                  <span>📤</span>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="tab-content notes-content">
            <div className="notes-container">
              <div className="notes-header">
                <h2>📝 Meeting Notes</h2>
                <button className="btn-save-notes" onClick={saveNotes}>
                  <span>💾</span>
                  Save Notes
                </button>
              </div>
              <textarea
                className="notes-textarea"
                placeholder="Take notes during the meeting...&#10;&#10;• Key points discussed&#10;• Action items&#10;• Decisions made&#10;• Follow-up tasks"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="notes-footer">
                <span className="notes-info">💡 Notes are automatically saved locally</span>
              </div>
            </div>
          </div>
        )}

        {/* Recording Tab */}
        {activeTab === 'recording' && (
          <div className="tab-content recording-content">
            <div className="recording-container">
              <div className="recording-status">
                {isRecording ? (
                  <>
                    <div className="recording-indicator pulse">
                      <span className="rec-dot"></span>
                      <span className="rec-text">RECORDING</span>
                    </div>
                    <div className="recording-time">
                      {formatTime(recordingDuration)}
                    </div>
                  </>
                ) : (
                  <div className="recording-ready">
                    <span className="ready-icon">⏺️</span>
                    <h3>Ready to Record</h3>
                    <p>Start recording to capture this meeting</p>
                  </div>
                )}
              </div>
              
              <div className="recording-controls">
                <button 
                  className={`btn-record ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                >
                  {isRecording ? (
                    <>
                      <span>⏹️</span>
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <span>⏺️</span>
                      Start Recording
                    </>
                  )}
                </button>
              </div>

              <div className="recording-info-box">
                <h4>📹 Recording Features</h4>
                <ul>
                  <li>✓ High-quality video and audio recording</li>
                  <li>✓ Automatic cloud storage</li>
                  <li>✓ Downloadable after meeting</li>
                  <li>✓ Shareable links for participants</li>
                  <li>✓ Transcription available (premium)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="tab-content info-content">
            <div className="info-container">
              <div className="info-section">
                <h3>📊 Meeting Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Meeting ID</span>
                    <span className="info-value">{meetingId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration</span>
                    <span className="info-value">{formatTime(meetingDuration)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Participants</span>
                    <span className="info-value">{participantCount}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Network Quality</span>
                    <span className="info-value">{networkQuality}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Recording</span>
                    <span className="info-value">{isRecording ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Messages</span>
                    <span className="info-value">{messages.length}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>⚙️ Meeting Settings</h3>
                <div className="settings-list">
                  <div className="setting-item">
                    <span className="setting-label">Enable Virtual Background</span>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Enable Noise Cancellation</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Show Participant Names</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Enable Chat Notifications</span>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>🔗 Share Meeting</h3>
                <div className="share-section">
                  <input 
                    type="text" 
                    value={`${window.location.origin}/#dashboard/meeting?id=${meetingId}`}
                    readOnly
                    className="share-link-input"
                  />
                  <button className="btn-share" onClick={onCopyLink}>
                    {isCopied ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="meeting-controls-bar">
        <div className="custom-controls-container">
          {/* Microphone Control */}
          <div className="control-item">
            <button
              className={`control-button ${isMute ? 'muted' : 'active'}`}
              onClick={toggleMicrophone}
              onMouseEnter={() => setShowControlTooltip('mic')}
              onMouseLeave={() => setShowControlTooltip(null)}
            >
              <span className="control-icon">
                {isMute ? '🎤' : '🎤'}
              </span>
              {isMute && <span className="mute-slash">⚠️</span>}
            </button>
            {showControlTooltip === 'mic' && (
              <div className="control-tooltip">
                {isMute ? 'Unmute' : 'Mute'}
              </div>
            )}
            <span className="control-label">{isMute ? 'Unmute' : 'Mute'}</span>
          </div>

          {/* Camera Control */}
          <div className="control-item">
            <button
              className={`control-button ${isCameraOff ? 'muted' : 'active'}`}
              onClick={toggleCamera}
              onMouseEnter={() => setShowControlTooltip('camera')}
              onMouseLeave={() => setShowControlTooltip(null)}
            >
              <span className="control-icon">
                {isCameraOff ? '📹' : '📹'}
              </span>
              {isCameraOff && <span className="mute-slash">⚠️</span>}
            </button>
            {showControlTooltip === 'camera' && (
              <div className="control-tooltip">
                {isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
              </div>
            )}
            <span className="control-label">{isCameraOff ? 'Start Video' : 'Stop Video'}</span>
          </div>

          {/* Speaker Control */}
          <div className="control-item">
            <button
              className={`control-button ${!isSpeakerOn ? 'muted' : 'active'}`}
              onClick={toggleSpeaker}
              onMouseEnter={() => setShowControlTooltip('speaker')}
              onMouseLeave={() => setShowControlTooltip(null)}
            >
              <span className="control-icon">
                {isSpeakerOn ? '🔊' : '🔇'}
              </span>
            </button>
            {showControlTooltip === 'speaker' && (
              <div className="control-tooltip">
                {isSpeakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
              </div>
            )}
            <span className="control-label">{isSpeakerOn ? 'Speaker' : 'Speaker Off'}</span>
          </div>

          {/* Screen Share Control */}
          <div className="control-item">
            <button
              className={`control-button ${isScreenSharing ? 'active-sharing' : ''}`}
              onClick={toggleScreenShare}
              onMouseEnter={() => setShowControlTooltip('share')}
              onMouseLeave={() => setShowControlTooltip(null)}
            >
              <span className="control-icon">🖥️</span>
            </button>
            {showControlTooltip === 'share' && (
              <div className="control-tooltip">
                {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              </div>
            )}
            <span className="control-label">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
          </div>

          {/* Copy Link Control */}
          <div className="control-item">
            <button
              className={`control-button ${isCopied ? 'copied' : ''}`}
              onClick={copyMeetingLinkControl}
              onMouseEnter={() => setShowControlTooltip('link')}
              onMouseLeave={() => setShowControlTooltip(null)}
            >
              <span className="control-icon">
                {isCopied ? '✓' : '🔗'}
              </span>
            </button>
            {showControlTooltip === 'link' && (
              <div className="control-tooltip">
                {isCopied ? 'Copied!' : 'Copy Meeting Link'}
              </div>
            )}
            <span className="control-label">{isCopied ? 'Copied!' : 'Copy Link'}</span>
          </div>

          {/* Divider */}
          <div className="controls-divider"></div>

          {/* End Call Control */}
          <div className="control-item">
            <button
              className="control-button end-call"
              onClick={onLeave}
              onMouseEnter={() => setShowControlTooltip('end')}
              onMouseLeave={() => setShowControlTooltip(null)}
            >
              <span className="control-icon">📞</span>
            </button>
            {showControlTooltip === 'end' && (
              <div className="control-tooltip end-tooltip">
                Leave Meeting
              </div>
            )}
            <span className="control-label">End Call</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
