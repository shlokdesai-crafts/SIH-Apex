import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { Language } from '../i18n/translations';
import { transcribeAudio, generateAssistantResponse } from '../services/aiService';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export default function PanelsRow() {
  const [activeMapTab, setActiveMapTab] = useState('fields');
  const [micActive, setMicActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantResponse]);
  const { t, language, setLanguage } = useTranslation();

  const speakResponse = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    // Remove markdown symbols (**, *, etc.) for cleaner speech
    const cleanText = text.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (langCode === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (langCode === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleScanClick = () => {
    alert(t('panels.scanAlert'));
  };

  const handleZoomIn = () => console.log('Zoom in');
  const handleZoomOut = () => console.log('Zoom out');

  // Wire voice language buttons to the global language context
  const handleVoiceLangClick = (lang: Language) => {
    setLanguage(lang);
  };

  const handleMicClick = () => {
    if (micActive) {
      setMicActive(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use the text input instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setMicActive(true);
      setAssistantResponse('');
      setQueryText(t('panels.listening'));
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQueryText(transcript);
      setMicActive(false);
      setIsProcessing(true);

      const newMsgId = Date.now().toString();
      setMessages(prev => [...prev, { id: newMsgId, sender: 'user', text: transcript }]);

      try {
        const response = await generateAssistantResponse(transcript, language);
        setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: response }]);
        setAssistantResponse(response);
        speakResponse(response, language);
      } catch (error: any) {
        console.error("Gemini AI Error:", error);
        const errorMsg = `Error: ${error.message || 'Connecting to AI services.'}`;
        setMessages(prev => [...prev, { id: Date.now().toString() + 'err', sender: 'ai', text: errorMsg }]);
        speakResponse("Sorry, I encountered an error.", language);
      } finally {
        setIsProcessing(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setQueryText(`Microphone error: ${event.error}`);
      setMicActive(false);
    };

    recognition.onend = () => {
      setMicActive(false);
    };

    recognition.start();
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    setQueryText(textInput);
    
    const userText = textInput;
    setTextInput('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);
    
    try {
      const response = await generateAssistantResponse(userText, language);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: response }]);
      setAssistantResponse(response);
      speakResponse(response, language);
    } catch (error: any) {
      console.error("Text Processing Error:", error);
      const errorMsg = `Error: ${error.message || 'Connecting to AI services.'}`;
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', sender: 'ai', text: errorMsg }]);
      speakResponse("Sorry, I encountered an error.", language);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="panels-row" id="panels-row">
      {/* Scan Crop Panel */}
      <div className="panel scan-panel" id="scan-panel">
        <div className="panel-header-row">
          <div className="scan-cam-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </div>
          <div className="scan-header-text">
            <h2 className="panel-title">{t('panels.scanCrop')}</h2>
            <p className="panel-subtitle">{t('panels.scanSubtitle')}</p>
          </div>
        </div>
        <div className="scan-images-row">
          <div className="scan-img-wrap"><img src="images/crop_leaf1.jpg" alt="Crop leaf disease 1" className="scan-thumb" /></div>
          <div className="scan-img-wrap"><img src="images/crop_leaf2.jpg" alt="Crop leaf disease 2" className="scan-thumb" /></div>
          <div className="scan-img-wrap"><img src="images/crop_leaf3.jpg" alt="Crop leaf disease 3" className="scan-thumb" /></div>
        </div>
        <button className="scan-btn" id="scan-crop-btn" onClick={handleScanClick}>
          {t('panels.scanBtn')}
        </button>
      </div>

      {/* Field Map & Risk Zones Panel */}
      <div className="panel map-panel" id="map-panel">
        <div className="map-panel-header">
          <h2 className="panel-title">{t('panels.fieldMap')}</h2>
          <a href="#" className="view-full-map" id="view-full-map-btn">{t('panels.viewFullMap')}</a>
        </div>
        <div className="map-tabs">
          <button className={`map-tab ${activeMapTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveMapTab('fields')}>{t('panels.myFields')}</button>
          <button className={`map-tab ${activeMapTab === 'satellite' ? 'active' : ''}`} onClick={() => setActiveMapTab('satellite')}>{t('panels.satelliteView')}</button>
        </div>
        <div className="map-container" id="map-container">
          <img src="images/field_map.jpg" alt="Field map with risk zones" className="map-img" id="map-img" />
          <div className="map-label high-risk-label" id="field1-label">
            <span>{t('panels.field1')}</span><br /><span>{t('panels.highRisk')}</span>
          </div>
          <div className="map-controls" id="map-controls">
            <button className="map-ctrl-btn" aria-label="Zoom in" onClick={handleZoomIn}>+</button>
            <button className="map-ctrl-btn" aria-label="Zoom out" onClick={handleZoomOut}>−</button>
            <button className="map-ctrl-btn" aria-label="Locate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z" />
              </svg>
            </button>
          </div>
          <div className="map-info-bar" id="map-info-bar">
            <strong>{t('panels.field1Cotton')}</strong>
            <span>{t('panels.fieldInfo')}</span>
          </div>
        </div>
      </div>

      {/* AI Voice Assistant Panel */}
      <div className="panel voice-panel" id="voice-panel">
        <div className="voice-panel-header">
          <div className="voice-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div className="voice-header-text">
            <h2 className="panel-title">{t('panels.aiVoice')}</h2>
            <p className="panel-subtitle">{t('panels.voiceSubtitle')}</p>
          </div>
        </div>

        <div className="voice-waveform-area" id="voice-waveform">
          <div className="voice-wave-bars">
            <span className="wave-bar" style={{ height: '14px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '22px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '32px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '18px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '10px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
          </div>
          <button 
            className="mic-btn" 
            id="mic-btn" 
            aria-label="Speak"
            onClick={handleMicClick}
            style={{ background: micActive ? 'linear-gradient(135deg, #c62828, #e53935)' : 'linear-gradient(135deg, #7c3aed, #9c27b0)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <div className="voice-wave-bars">
            <span className="wave-bar" style={{ height: '10px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '18px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '32px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '22px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
            <span className="wave-bar" style={{ height: '14px', animationPlayState: micActive ? 'running' : 'paused' }}></span>
          </div>
        </div>

        <div className="voice-query-text" id="voice-query" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.1)' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', padding: '20px' }}>
              {t('panels.voiceQuery')}
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? '#4caf50' : '#2d2d2d', color: '#ffffff', padding: '12px 16px', borderRadius: '16px', maxWidth: '90%', wordBreak: 'break-word', borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px', borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px', lineHeight: '1.5', fontSize: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                {msg.sender === 'ai' ? (
                  <div style={{ margin: 0 }}>
                    <ReactMarkdown components={{
                      p: ({node, ...props}) => <p style={{ margin: '0 0 8px 0', padding: 0, color: 'white' }} {...props} />,
                      ul: ({node, ...props}) => <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }} {...props} />,
                      li: ({node, ...props}) => <li style={{ margin: '4px 0' }} {...props} />
                    }}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            ))
          )}
          {isProcessing && (
            <div style={{ alignSelf: 'flex-start', background: '#2d2d2d', color: '#aaaaaa', padding: '12px 16px', borderRadius: '16px', maxWidth: '85%', borderBottomLeftRadius: '4px', fontStyle: 'italic', fontSize: '14px' }}>
              Thinking...
            </div>
          )}
          {micActive && (
            <div style={{ alignSelf: 'center', color: '#aaaaaa', padding: '10px', fontStyle: 'italic', fontSize: '14px' }}>
              {queryText || t('panels.listening')}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="voice-lang-btns" id="voice-lang-btns">
          <button className={`lang-select-btn ${language === 'mr' ? 'active' : ''}`} onClick={() => handleVoiceLangClick('mr')}>{t('lang.marathi')}</button>
          <button className={`lang-select-btn ${language === 'hi' ? 'active' : ''}`} onClick={() => handleVoiceLangClick('hi')}>{t('lang.hindi')}</button>
          <button className={`lang-select-btn ${language === 'en' ? 'active' : ''}`} onClick={() => handleVoiceLangClick('en')}>{t('lang.english')}</button>
        </div>

        <div className="voice-text-input-row" style={{ display: 'flex', marginTop: '15px', gap: '8px', padding: '0 5px' }}>
          <input 
            type="text" 
            placeholder={t('panels.typeQuery')}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #ccc', background: '#ffffff', color: '#333333', outline: 'none', minWidth: '0', fontSize: '14px' }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
          />
          <button 
            onClick={handleSendText} 
            disabled={isProcessing}
            style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #4caf50, #2e7d32)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', opacity: isProcessing ? 0.6 : 1, flexShrink: 0 }}
          >
            {isProcessing ? '...' : 'Send'}
          </button>
        </div>

        <div className="voice-tap-hint" id="voice-tap-hint" style={{ marginTop: '10px' }}>{t('panels.tapToSpeak')}</div>
      </div>
    </section>
  );
}
