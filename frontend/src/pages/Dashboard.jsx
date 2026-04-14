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
          
          canvasCtx.fillStyle = '#151924';
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
          
          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;
          
          for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            canvasCtx.fillStyle = `rgb(${138 + barHeight/2}, ${43 + barHeight/2}, 226)`;
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
    <div style={{marginTop: '30px', padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)'}}>
      <h3 style={{marginTop: 0, color: 'var(--color-accent)'}}>Synthesis Complete</h3>
      <canvas ref={canvasRef} width="600" height="100" style={{width: '100%', height:'100px', backgroundColor: 'var(--color-bg-surface)', borderRadius: '8px', marginBottom: '15px'}}></canvas>
      <audio ref={audioRef} controls src={audioUrl} style={{width: '100%', outline: 'none'}} />
    </div>
  );
}

function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('workspace'); // workspace, history, profile
  
  // Workspace State
  const [text, setText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultAudio, setResultAudio] = useState(null);

  // Stats / States
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/audio/history', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      showToast('Kayıtlar yüklenemedi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setProfile(await res.json());
    } catch (err) {
      showToast('Profil bilgisi alınamadı.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'profile') fetchProfile();
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!text || !audioFile) return showToast("Metin ve Ses Dosyası zorunludur!", "error");
    setIsGenerating(true);
    setResultAudio(null);

    const formData = new FormData();
    formData.append('text', text);
    formData.append('speakerWav', audioFile);

    try {
      showToast("Model işleniyor...", "success");
      const response = await fetch('http://localhost:8080/api/v1/audio/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error("Üretim sırasında hata.");
      const audioBlob = await response.blob();
      setResultAudio(URL.createObjectURL(audioBlob));
      showToast("Sesiniz Sentetikleşirildi!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const playHistoryAudio = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/audio/download/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("İndirilemedi");
      setResultAudio(URL.createObjectURL(await res.blob()));
      setActiveTab('workspace'); 
      showToast("Kayıt stüdyoya yüklendi", "success");
    } catch(e) {
      showToast("Ses açılamadı", "error");
    }
  };

  return (
    <div className="dashboard-layout">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar - Dark Glass */}
      <div style={{ width: '250px', background: 'rgba(21, 25, 36, 0.8)', backdropFilter: 'blur(10px)', borderRight: '1px solid var(--color-border)', padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <h2 className="auth-title" style={{textAlign:'left', fontSize:'28px', marginBottom:'40px'}}>DFSG AI.</h2>
        <ul style={{listStyle: 'none', padding: 0}}>
          <li onClick={() => setActiveTab('workspace')} style={{padding: '12px', marginBottom: '10px', borderRadius: '8px', background: activeTab === 'workspace' ? 'rgba(138, 43, 226, 0.15)' : 'transparent', color: activeTab === 'workspace' ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor:'pointer', transition:'0.2s'}}>Workspace</li>
          <li onClick={() => setActiveTab('history')} style={{padding: '12px', marginBottom: '10px', borderRadius: '8px', background: activeTab === 'history' ? 'rgba(138, 43, 226, 0.15)' : 'transparent', color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor:'pointer', transition:'0.2s'}}>History</li>
          <li onClick={() => setActiveTab('profile')} style={{padding: '12px', marginBottom: '10px', borderRadius: '8px', background: activeTab === 'profile' ? 'rgba(138, 43, 226, 0.15)' : 'transparent', color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor:'pointer', transition:'0.2s'}}>Profile</li>
        </ul>
        
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-primary" style={{marginTop: 'auto', background: 'linear-gradient(135deg, #ff4b2b, #ff416c)', boxShadow: '0 4px 15px rgba(255, 65, 108, 0.3)'}}>
          Çıkış Yap
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', maxWidth: '900px', margin: '0 auto', overflowY: 'auto' }}>
        
        {activeTab === 'workspace' && (
          <div className="animate-fade-in" style={{background:'var(--color-bg-surface)', padding: '40px', borderRadius: 'var(--radius-lg)', border:'1px solid var(--color-border)', boxShadow:'var(--shadow-lg)'}}>
            <h1 style={{marginTop: 0, color:'var(--color-text-main)'}}>AI Generator Engine</h1>
            <p style={{color: 'var(--color-text-muted)', marginBottom:'30px'}}>Sıfır atışlı XTTSv2 (Zero-Shot) modelini kullanarak yalnızca 3 saniyelik referansla sesleri klonlayın.</p>
            
            <div style={{marginTop: '10px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-accent)', fontSize: '12px', textTransform:'uppercase', letterSpacing:'1px', fontWeight:'700'}}>
                SYNTHESIS PROMPT (METİN)
              </label>
              <textarea 
                style={{ width: '100%', height: '140px', padding: '15px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--color-border)', background:'rgba(0,0,0,0.2)', color:'white', resize: 'none', fontFamily: 'inherit', fontSize:'16px' }}
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Sentetik sese dönüştürülecek kelimeler..."
              />
            </div>

            <div style={{marginTop: '25px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: 'var(--color-accent)', fontSize: '12px', textTransform:'uppercase', letterSpacing:'1px', fontWeight:'700'}}>
                REFERENCE AUDIO (.WAV)
              </label>
              <input 
                type="file" accept="audio/wav" 
                onChange={(e) => e.target.files && setAudioFile(e.target.files[0])}
                style={{ width: '100%', padding: '15px', border: '2px dashed var(--color-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color:'var(--color-text-main)', cursor:'pointer', boxSizing:'border-box' }}
              />
            </div>

            <button className="btn-primary" style={{marginTop: '35px', width: '100%', padding: '16px', fontSize: '16px', textTransform:'uppercase', letterSpacing:'2px'}} onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'NEURAL NETWORK IS RUNNING...' : 'GENERATE SPEECH'}
            </button>
            
            {resultAudio && <AudioVisualizer audioUrl={resultAudio} />}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in" style={{background:'var(--color-bg-surface)', padding: '40px', borderRadius: 'var(--radius-lg)', border:'1px solid var(--color-border)'}}>
            <h1 style={{marginTop: 0}}>Generation Vault</h1>
            <p style={{color: 'var(--color-text-muted)'}}>Sistemde oluşturulan tüm ses klonlarınızın arşivi.</p>
            {isLoading ? <p>Neural veriler çekiliyor...</p> : (
              <div style={{marginTop: '30px'}}>
                {history.map(item => (
                  <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '15px', borderLeft: '4px solid var(--color-primary)'}}>
                    <strong style={{color: 'var(--color-primary)', letterSpacing:'1px'}}>MODEL: {item.voiceModel || 'XTTSv2'}</strong>
                    <div style={{margin: '15px 0', color: 'var(--color-text-main)', fontStyle: 'italic', background:'rgba(255,255,255,0.03)', padding:'15px', borderRadius:'8px'}}>"{item.textPrompt}"</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>{new Date(item.createdAt).toLocaleString()}</span>
                      <button onClick={() => playHistoryAudio(item.id)} style={{padding: '8px 20px', background: 'rgba(138, 43, 226, 0.2)', color: 'var(--color-accent)', border: '1px solid var(--color-primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition:'0.3s'}}>
                        LOAD TO WORKSPACE
                      </button>
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p style={{color:'var(--color-text-muted)'}}>The vault is empty.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-fade-in" style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
            {profile ? (
              <>
                <div style={{flex:'1 1 100%', background:'var(--color-bg-surface)', padding: '40px', borderRadius: 'var(--radius-lg)', border:'1px solid var(--color-border)'}}>
                   <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                      <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'30px', fontWeight:'bold', color:'white'}}>
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h1 style={{margin:0, color:'var(--color-text-main)'}}>{profile.username}</h1>
                        <p style={{margin:'5px 0 0 0', color:'var(--color-text-muted)'}}>{profile.email}</p>
                      </div>
                   </div>
                </div>

                <div style={{flex:'1', background:'var(--color-bg-surface)', padding: '30px', borderRadius: 'var(--radius-lg)', border:'1px solid var(--color-border)', textAlign:'center'}}>
                   <h3 style={{margin:0, color:'var(--color-text-muted)', textTransform:'uppercase', fontSize:'12px', letterSpacing:'1px'}}>System Role</h3>
                   <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--color-primary)', marginTop:'15px'}}>{profile.role}</div>
                </div>

                <div style={{flex:'1', background:'var(--color-bg-surface)', padding: '30px', borderRadius: 'var(--radius-lg)', border:'1px solid var(--color-border)', textAlign:'center'}}>
                   <h3 style={{margin:0, color:'var(--color-text-muted)', textTransform:'uppercase', fontSize:'12px', letterSpacing:'1px'}}>Total Syntheses</h3>
                   <div style={{fontSize:'32px', fontWeight:'bold', color:'var(--color-accent)', marginTop:'15px'}}>{profile.totalGenerations}</div>
                </div>
              </>
            ) : <p>Loading profile matrix...</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
