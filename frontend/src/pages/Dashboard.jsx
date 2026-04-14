import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${type} animate-fade-in`}>
      {message}
    </div>
  );
}

function AudioVisualizer({ audioUrl }) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current || !audioRef.current) return;
    
    // Web Audio API setup - only runs once when played
    let audioCtx;
    let analyser;
    let source;
    
    const handlePlay = () => {
      setIsPlaying(true);
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        
        const draw = () => {
          if (!isPlaying) return;
          requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);
          
          canvasCtx.fillStyle = 'rgb(245, 247, 250)';
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
          
          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;
          
          for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            canvasCtx.fillStyle = `rgb(${barHeight + 67}, ${barHeight + 97}, 238)`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        };
        draw();
      } else {
        audioCtx.resume();
      }
    };
    
    const handlePause = () => setIsPlaying(false);

    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
      }
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, [audioUrl]);

  return (
    <div style={{marginTop: '20px', padding: '20px', border: '1px solid #4cc9f0', borderRadius: '8px', backgroundColor: '#f0fbff'}}>
      <h3 style={{marginTop: 0, color: '#0077b6'}}>Başarıyla Oluşturuldu! 🎉</h3>
      <canvas ref={canvasRef} width="600" height="100" style={{width: '100%', height:'100px', backgroundColor: 'var(--color-bg-base)', borderRadius: '8px', marginBottom: '10px'}}></canvas>
      <audio ref={audioRef} controls src={audioUrl} style={{width: '100%'}} />
    </div>
  );
}

function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('workspace'); // workspace or history
  
  // Workspace State
  const [text, setText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultAudio, setResultAudio] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Toasts
  const [toast, setToast] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/audio/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      showToast('Geçmiş yüklenemedi', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!text || !audioFile) {
      showToast("Metin ve Ses Dosyası zorunludur!", "error");
      return;
    }
    
    setIsGenerating(true);
    setResultAudio(null);

    const formData = new FormData();
    formData.append('text', text);
    formData.append('speakerWav', audioFile);

    try {
      showToast("Yapay Zeka işleve başladı...", "success");
      const response = await fetch('http://localhost:8080/api/v1/audio/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error("Ses üretimi sırasında hata oluştu.");

      const audioBlob = await response.blob();
      setResultAudio(URL.createObjectURL(audioBlob));
      showToast("Siniz hazır!", "success");

    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const playHistoryAudio = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/audio/download/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Ses indirilemedi");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultAudio(url);
      setActiveTab('workspace'); // Zıplat
      showToast("Geçmiş ses oynatıcıya yüklendi", "success");
    } catch(e) {
      showToast("Ses açılamadı", "error");
    }
  };

  return (
    <div className="dashboard-layout">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#fff', borderRight: '1px solid var(--color-border)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{color: 'var(--color-primary)', marginTop: 0}}>DFSG AI</h2>
        <ul style={{listStyle: 'none', padding: 0, marginTop: '40px'}}>
          <li 
            onClick={() => setActiveTab('workspace')}
            style={{marginBottom: '15px', color: activeTab === 'workspace' ? 'var(--color-primary)' : 'var(--color-text-main)', fontWeight: '600', cursor:'pointer'}}>
            🎙️ Workspace
          </li>
          <li 
            onClick={() => setActiveTab('history')}
            style={{marginBottom: '15px', color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: '600', cursor:'pointer'}}>
            📜 History
          </li>
        </ul>
        
        <button 
          onClick={handleLogout}
          className="btn-primary"
          style={{
            marginTop: 'auto', 
            backgroundColor: '#ff4d4f', 
            color: 'white', 
            fontWeight: 'bold',
            boxShadow: 'none',
            fontSize: '14px',
            padding: '10px'
          }}>
          ⏏ Çıkış Yap
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
        
        {activeTab === 'workspace' && (
          <div className="animate-fade-in">
            <h1 style={{marginTop: 0}}>Speech Workspace</h1>
            <p style={{color: 'var(--color-text-muted)'}}>Ses üretecinize hoş geldiniz.</p>
            
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', marginTop: '30px' }}>
              <div style={{marginTop: '10px'}}>
                <label style={{display: 'block', marginBottom: '10px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight:'600'}}>
                  Okunacak Metin (Text to Speak)
                </label>
                <textarea 
                  style={{ width: '100%', height: '120px', padding: '15px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--color-border)', resize: 'none', fontFamily: 'inherit' }}
                  value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Üretilecek olan ses..."
                />
              </div>

              <div style={{marginTop: '25px'}}>
                <label style={{display: 'block', marginBottom: '10px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight:'600'}}>
                  Taklit Edilecek Ses (.wav)
                </label>
                <input 
                  type="file" accept="audio/wav" 
                  onChange={(e) => e.target.files && setAudioFile(e.target.files[0])}
                  style={{ width: '100%', padding: '10px', border: '1px dashed var(--color-primary)', borderRadius: '8px', backgroundColor: '#f9faff' }}
                />
              </div>

              <button 
                className="btn-primary" 
                style={{marginTop: '30px', width: '100%', padding: '14px', fontSize: '16px'}}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Yapay Zeka İşliyor... Lütfen Bekleyin 🧠' : '✨ Sesi Oluştur'}
              </button>
              
              {resultAudio && <AudioVisualizer audioUrl={resultAudio} />}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <h1 style={{marginTop: 0}}>Geçmiş Ses Üretimleri</h1>
            <p style={{color: 'var(--color-text-muted)'}}>Sistemde oluşturduğunuz tüm kayıtlar burada yer alır.</p>
            {isLoadingHistory ? <p>Yükleniyor...</p> : (
              <div style={{marginTop: '20px'}}>
                {history.map(item => (
                  <div key={item.id} style={{backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid var(--color-primary)', boxShadow: 'var(--shadow-sm)'}}>
                    <strong style={{color: 'var(--color-primary)'}}>Log #{item.id} - XTTSv2</strong>
                    <div style={{margin: '10px 0', color: 'var(--color-text-muted)', fontStyle: 'italic'}}>"{item.textPrompt}"</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{fontSize: '12px', color: '#aaa'}}>{new Date(item.createdAt).toLocaleString()}</span>
                      <button 
                        onClick={() => playHistoryAudio(item.id)}
                        style={{padding: '5px 15px', backgroundColor: '#f0f3ff', color: 'var(--color-primary)', border: '1px solid #c7d2fe', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
                      >
                        Tekrar Dinle ▶
                      </button>
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p>Hiç üretim yapmadınız!</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
