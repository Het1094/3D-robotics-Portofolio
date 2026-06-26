import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import projectsData from './projects-data.json';
import LabScene from './LabScene';
import { audio } from './utils/audio';

// Lab coordinate locations mapping (cameraPos, cameraTarget)
export const BAY_LOCATIONS = {
  walking: {
    name: 'Lab Floor (Walking)',
    camPos: [0, 1.6, 6.5],
    camTarget: [0, 1.5, 0]
  },
  vineyard: {
    name: 'ROS2 Vineyard Navigation Bay',
    camPos: [-5.5, 1.5, -3.5],
    camTarget: [-7.5, 1.2, -5.5]
  },
  industrial: {
    name: 'Industrial Robotics Bay',
    camPos: [5.5, 1.5, -3.5],
    camTarget: [7.5, 1.2, -5.5]
  },
  embedded_car: {
    name: 'Gesture Controlled Car Terminal',
    camPos: [-4.5, 1.4, -0.6],
    camTarget: [-6.5, 1.2, -1.0]
  },
  embedded_radar: {
    name: 'Ultrasonic Radar System Terminal',
    camPos: [-4.5, 1.4, 0.4],
    camTarget: [-6.5, 1.2, 0.4]
  },
  embedded_line: {
    name: 'Line Follower Robot Terminal',
    camPos: [-4.5, 1.4, 1.4],
    camTarget: [-6.5, 1.2, 1.8]
  },
  ml: {
    name: 'Machine Learning Bay',
    camPos: [4.5, 1.5, 0.4],
    camTarget: [6.5, 1.3, 0.4]
  },
  achievements: {
    name: 'Achievement Wall & Timeline',
    camPos: [0, 1.6, -4.5],
    camTarget: [0, 1.5, -8.6]
  },
  contact: {
    name: 'Contact Terminal Station',
    camPos: [0, 1.6, 2.5],
    camTarget: [0, 1.15, 0.2]
  }
};

export default function App() {
  const [loadingState, setLoadingState] = useState('loading'); // 'loading' | 'booting' | 'ready' | 'entering' | 'entered'
  const [progress, setProgress] = useState(0);
  const [bootLogs, setBootLogs] = useState([]);
  const [soundMuted, setSoundMuted] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState(localStorage.getItem('viewMode') || '3d');
  const [activeBay, setActiveBay] = useState('walking');
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Camera transition controls passed to R3F scene
  const [cameraOverride, setCameraOverride] = useState({
    pos: BAY_LOCATIONS.walking.camPos,
    target: BAY_LOCATIONS.walking.camTarget,
    trigger: 0 // Increment to trigger transition
  });

  // Telemetry real-time values
  const [coreTemp, setCoreTemp] = useState(36.5);
  const [coreLoad, setCoreLoad] = useState(14.2);
  const [camCoords, setCamCoords] = useState({ x: 0.0, z: 6.5 });
  const [tickerMsg, setTickerMsg] = useState('SYSTEM ONLINE // USE WASD TO WALK THROUGH THE LABORATORY...');

  // Mouse cursor position for HUD lighting interaction
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. Preloader simulation
  useEffect(() => {
    if (loadingState === 'entered') return;

    const bootSequenceLogs = [
      'INIT: STARTING COLD COGNITIVE INITIALIZATION...',
      'KERNEL: MAPPING WORKSPACE DIRECTORIES...',
      'NETWORK: SECURE CORRIDOR CONNECTED (THWS.NET)...',
      'HARDWARE: MOUNTING ROBOTICS PERIPHERALS...',
      'SCANNER: SEARCHING LOCAL ASSETS DIRECTORY...',
      'TELEMETRY: SYMLINKED GESTURE_CAR MODULE // IMG_2394.MOV FOUND...',
      'TELEMETRY: SYMLINKED KUKA SIMULATOR MODULE // Screen Recording...mov FOUND...',
      'TELEMETRY: SYMLINKED LINE_FOLLOWER MODULE // recorded-22957455160588.MP4 FOUND...',
      'TELEMETRY: SYMLINKED RADAR_SYSTEM MODULE // IMG_9056.mov FOUND...',
      'TELEMETRY: SYMLINKED VINEBOT MODULE // DATA STREAM CONNECTED...',
      'AI_CORE: POWERING UP NEURAL NETWORK CORRIDORS...',
      'THERMALS: CPU TEMPERATURE 36.5°C // VOLTAGE 1.22V [OK]',
      'DIAGNOSTICS: STATIONS LINKED // READY FOR USER INTERFACE LINK...'
    ];

    let currentLogIndex = 0;
    let progressTimer;
    let logTimer;

    const runLoading = () => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          clearInterval(logTimer);
          setLoadingState('ready');
          return 100;
        }
        
        // Dynamic loading increments
        const increment = Math.floor(Math.random() * 8) + 2;
        const nextProgress = Math.min(100, prev + increment);
        return nextProgress;
      });
    };

    const runLogs = () => {
      if (currentLogIndex < bootSequenceLogs.length) {
        setBootLogs(prev => [...prev, `[${(currentLogIndex * 0.32).toFixed(2)}s] ${bootSequenceLogs[currentLogIndex]}`]);
        currentLogIndex++;
      }
    };

    // Trigger timers
    progressTimer = setInterval(runLoading, 180);
    logTimer = setInterval(runLogs, 150);

    return () => {
      clearInterval(progressTimer);
      clearInterval(logTimer);
    };
  }, [loadingState]);

  // Telemetry fluctuation simulator
  useEffect(() => {
    const tempInterval = setInterval(() => {
      setCoreTemp(prev => {
        const delta = (Math.random() - 0.5) * 0.2;
        return Math.max(35.5, Math.min(37.8, prev + delta));
      });
      setCoreLoad(prev => {
        const delta = (Math.random() - 0.5) * 1.5;
        return Math.max(8.0, Math.min(24.0, prev + delta));
      });
    }, 1200);

    const tickerLogs = [
      "SYSTEM SECURE // PORTFOLIO INITIALIZATION COMPLETED SUCCESSFULY...",
      "STATION 01 ACTIVE: STREAMING GESTURE CONTROL COORDINATES...",
      "STATION 02 ACTIVE: KUKA COLLISION SOLVER LOGGING 200HZ COMPILATION...",
      "STATION 03 ACTIVE: PID DIFFERENTIAL STEERING CALIBRATING ON TRACK...",
      "STATION 04 ACTIVE: ULTRASONIC SWEEPER SPEED CHECK: 115200 BAUD...",
      "STATION 05 ACTIVE: ROS2 VINEYARD ROVER SIMULATOR BOUNDS ONLINE...",
      "THWS UNIVERSITY NETWORK HUB LINKED // SCHWEINFURT DEPLOYMENT OK...",
      "RECRUITER VISITOR CONNECTED // BIOMETRIC METRICS CONFIRMED..."
    ];
    let tickerIdx = 0;
    const tickerInterval = setInterval(() => {
      tickerIdx = (tickerIdx + 1) % tickerLogs.length;
      setTickerMsg(tickerLogs[tickerIdx]);
    }, 6000);

    // Track mouse for glow
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(tempInterval);
      clearInterval(tickerInterval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    // Save viewMode preference
    localStorage.setItem('viewMode', currentViewMode);
  }, [currentViewMode]);

  // Update active coordinates on camera change
  const handleCameraChange = (x, z) => {
    setCamCoords({ x, z });
  };

  // Smoothly guide camera to a bay
  const triggerBayFocus = (bayKey) => {
    audio.playUiClick();
    setActiveBay(bayKey);
    const loc = BAY_LOCATIONS[bayKey];
    if (loc) {
      setCameraOverride({
        pos: loc.camPos,
        target: loc.camTarget,
        trigger: prev => prev + 1
      });
    }
  };

  // Launch project modal
  const openProjectDetails = (projId) => {
    audio.playDataTransmit();
    const proj = projectsData.find(p => p.id === projId);
    if (proj) {
      setSelectedProject(proj);
    }
  };

  // EMail launcher
  const handleContactOperator = () => {
    audio.playDataTransmit();
    window.location.href = "mailto:hprajapati1094@gmail.com?subject=Robotics Engineering Opportunity - Het Prajapati";
  };

  // Minimap point calculation
  const getMinimapPos = () => {
    // Map camera world coordinates to 100px width/height map
    // X goes from -10 to +10, map goes from 0 to 100
    // Z goes from -10 to +10, map goes from 100 to 0
    const xPct = ((camCoords.x + 10) / 20) * 100;
    const zPct = ((10 - camCoords.z) / 20) * 100;
    return { left: `${Math.max(0, Math.min(100, xPct))}%`, top: `${Math.max(0, Math.min(100, zPct))}%` };
  };

  // Handle Neural Link Boot Button Click
  const handleInitializeNeuralLink = () => {
    audio.init();
    audio.playDoorOpen();
    setLoadingState('entering');
    
    // Play ambient loop after door sound begins
    setTimeout(() => {
      audio.playAmbientHum();
    }, 800);
  };

  const toggleSound = () => {
    const nextMute = !soundMuted;
    setSoundMuted(nextMute);
    audio.setMute(nextMute);
    audio.playUiClick();
  };

  // Cinematic completed, allow walking
  const handleCinematicFinished = () => {
    setLoadingState('entered');
  };

  return (
    <div className="lab-wrapper">
      {/* Holographic HUD Filters */}
      <div className="crt-scanlines"></div>
      <div className="hologram-grid"></div>
      <div 
        className="cursor-glow" 
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
      ></div>

      {/* Futuristic Pre-Loader HUD */}
      <AnimatePresence>
        {loadingState !== 'entered' && (
          <motion.div 
            className="preloader-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: 'easeInOut' } }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#020305',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem',
              fontFamily: "'Share Tech Mono', monospace"
            }}
          >
            {/* HUD Glitch Grid Background */}
            <div className="hologram-grid" style={{ opacity: 0.15 }}></div>
            <div className="crt-scanlines"></div>

            <div className="preloader-container" style={{ width: '100%', maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Header Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--color-accent)', textShadow: 'var(--glow-shadow)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.1em' }}>
                  THWS.ROBOTICS // COGNITIVE_LINK_BOOT
                </span>
                <span style={{ color: 'var(--color-accent-amber)', fontSize: '12px' }}>
                  SECURITY: ENCRYPTED
                </span>
              </div>

              {/* Central Radar and Logo */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px', position: 'relative' }}>
                <div className="loader-scanning-circle"></div>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <i className="fa-solid fa-microchip" style={{ fontSize: '3.2rem', color: 'var(--color-accent-green)', textShadow: 'var(--glow-shadow-green)', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></i>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>AI CORE DEPLOYMENT</span>
                </div>
              </div>

              {/* Progress and Diagnostics Log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>INITIALIZING COGNITIVE INTERFACE LAYER...</span>
                  <span style={{ color: 'var(--color-accent-green)', fontWeight: 'bold' }}>{progress}%</span>
                </div>
                {/* Progress bar container */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    style={{ height: '100%', background: 'var(--color-accent)', boxShadow: 'var(--glow-shadow)' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'linear' }}
                  ></motion.div>
                </div>
              </div>

              {/* Scrolling Boot Console Log */}
              <div className="boot-terminal-logs" style={{
                height: '150px',
                background: 'rgba(4, 6, 9, 0.9)',
                border: '1px solid rgba(0, 240, 255, 0.1)',
                borderRadius: '6px',
                padding: '12px',
                overflowY: 'auto',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
              }}>
                {bootLogs.map((log, index) => (
                  <div key={index} style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--color-accent)' }}>&gt;</span> {log}
                  </div>
                ))}
                {loadingState === 'loading' && (
                  <div style={{ color: 'var(--color-accent-green)', animation: 'pulse 0.8s infinite' }}>
                    <span style={{ color: 'var(--color-accent)' }}>&gt;</span> LOGGING TELEMETRY DATA...
                  </div>
                )}
              </div>

              {/* Bottom Launch Area */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                {loadingState === 'ready' ? (
                  <motion.button
                    onClick={handleInitializeNeuralLink}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: [0.95, 1.02, 1], opacity: 1 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 255, 102, 0.6)' }}
                    transition={{ duration: 0.4 }}
                    style={{
                      background: 'rgba(0, 255, 102, 0.1)',
                      border: '2px solid var(--color-accent-green)',
                      color: 'var(--color-accent-green)',
                      padding: '12px 36px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      letterSpacing: '0.15em',
                      cursor: 'pointer',
                      textShadow: '0 0 8px rgba(0, 255, 102, 0.6)',
                      boxShadow: 'var(--glow-shadow-green)'
                    }}
                  >
                    <i className="fa-solid fa-satellite-dish" style={{ marginRight: '8px' }}></i> INITIALIZE NEURAL LINK
                  </motion.button>
                ) : loadingState === 'entering' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-accent)' }}>
                    <span style={{ fontSize: '13px', letterSpacing: '0.2em', animation: 'pulse 1s infinite' }}>ESTABLISHING SYSTEM CONNECTION...</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>CAMERA INTERFACING // COGNITIVE CORE LOCKED</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>BOOT SYSTEM CORE TO INITIATE COGNITIVE LINK...</span>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD Header */}
      <header className="hud-header">
        <div className="hud-header-container">
          <div className="hud-brand">
            <div className="hud-blinker"></div>
            <span className="hud-title">THWS.ROBOTICS_LAB // SYSTEM: {loadingState === 'entered' ? 'ACTIVE' : 'BOOTING'}</span>
          </div>

          {/* Toggle buttons between 3D Lab and Flat Bento list */}
          <div className="hud-view-toggle">
            <span className="toggle-label">VIEW_MODE:</span>
            <div className="toggle-buttons">
              <button 
                className={`toggle-btn ${currentViewMode === '3d' ? 'active' : ''}`}
                onClick={() => { audio.playUiClick(); setCurrentViewMode('3d'); }}
              >
                <i className="fa-solid fa-cube"></i> 3D_WALKTHROUGH
              </button>
              <button 
                className={`toggle-btn ${currentViewMode === 'flat' ? 'active' : ''}`}
                onClick={() => { audio.playUiClick(); setCurrentViewMode('flat'); }}
              >
                <i className="fa-solid fa-list"></i> FLAT_BENTO
              </button>
            </div>
          </div>

          {/* Quick HUD Navigation links */}
          <nav className="hud-nav">
            <ul>
              <li>
                <button 
                  className={`hud-link ${activeBay === 'walking' ? 'active' : ''}`}
                  onClick={() => triggerBayFocus('walking')}
                >
                  WALK_MODE
                </button>
              </li>
              <li>
                {/* Audio sound toggle button */}
                <button 
                  className={`hud-link ${soundMuted ? 'muted' : ''}`} 
                  onClick={toggleSound}
                  style={{ color: soundMuted ? 'var(--color-accent-amber)' : 'var(--color-accent-green)', borderColor: soundMuted ? 'rgba(255, 170, 0, 0.2)' : 'rgba(0, 255, 102, 0.2)', background: soundMuted ? 'rgba(255, 170, 0, 0.02)' : 'rgba(0, 255, 102, 0.02)' }}
                >
                  <i className={`fa-solid ${soundMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i> {soundMuted ? 'AUDIO: OFF' : 'AUDIO: ON'}
                </button>
              </li>
              <li>
                <button 
                  className="hud-link email-btn-glow" 
                  onClick={handleContactOperator}
                >
                  <i className="fa-solid fa-satellite-dish"></i> COMMS: EMAIL
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Diagnostic Telemetry Bar */}
      <div className="telemetry-bar">
        <div className="telemetry-item"><span className="label">CORE:</span> <span className="val" style={{ color: 'var(--color-accent-green)' }}>SYS_OK</span></div>
        <div className="telemetry-item"><span className="label">TEMP:</span> <span className="val" style={{ color: 'var(--color-accent-amber)' }}>{coreTemp.toFixed(1)}°C</span></div>
        <div className="telemetry-item"><span className="label">LOAD:</span> <span className="val" style={{ color: 'var(--color-accent)' }}>{coreLoad.toFixed(1)}%</span></div>
        <div className="telemetry-item"><span className="label">CAMERA_POS:</span> <span className="val" style={{ color: 'var(--color-accent)' }}>X: {camCoords.x.toFixed(1)} Z: {camCoords.z.toFixed(1)}</span></div>
        <div className="telemetry-item ticker-wrap"><span className="val ticker">{tickerMsg}</span></div>
      </div>

      {/* Main rendering area */}
      <main id="app" style={{ display: 'flex', width: '100vw', height: 'calc(100vh - 6rem)', marginTop: '6rem' }}>
        {currentViewMode === '3d' ? (
          <>
            {/* Sidebar Navigation HUD Panel */}
            <aside className="hud-sidebar">
              <div className="sidebar-header">LABORATORY_BAYS</div>
              <ul className="sidebar-list">
                <li>
                  <button 
                    className={`sidebar-btn ${activeBay === 'vineyard' ? 'active' : ''}`}
                    onClick={() => triggerBayFocus('vineyard')}
                  >
                    <span className="idx">01</span> Vineyard Navigation Bay
                  </button>
                </li>
                <li>
                  <button 
                    className={`sidebar-btn ${activeBay === 'industrial' ? 'active' : ''}`}
                    onClick={() => triggerBayFocus('industrial')}
                  >
                    <span className="idx">02</span> Industrial Robotics Bay
                  </button>
                </li>
                <li>
                  <button 
                    className={`sidebar-btn ${activeBay.startsWith('embedded') ? 'active' : ''}`}
                    onClick={() => triggerBayFocus('embedded_radar')}
                  >
                    <span className="idx">03</span> Embedded Systems Bay
                  </button>
                </li>
                <li>
                  <button 
                    className={`sidebar-btn ${activeBay === 'ml' ? 'active' : ''}`}
                    onClick={() => triggerBayFocus('ml')}
                  >
                    <span className="idx">04</span> Machine Learning Bay
                  </button>
                </li>
                <li>
                  <button 
                    className={`sidebar-btn ${activeBay === 'achievements' ? 'active' : ''}`}
                    onClick={() => triggerBayFocus('achievements')}
                  >
                    <span className="idx">05</span> Achievement Wall & Timeline
                  </button>
                </li>
                <li>
                  <button 
                    className={`sidebar-btn ${activeBay === 'contact' ? 'active' : ''}`}
                    onClick={() => triggerBayFocus('contact')}
                  >
                    <span className="idx">06</span> Contact Command Terminal
                  </button>
                </li>
              </ul>

              {/* Lab Minimap Overlay */}
              <div className="minimap-container">
                <div className="minimap-header">MINIMAP_RADAR</div>
                <div className="minimap-radar">
                  <div className="minimap-grid"></div>
                  {/* Map points represent the lab boundaries */}
                  <div className="minimap-node vineyard" title="Vineyard Navigation Bay" onClick={() => triggerBayFocus('vineyard')} style={{ cursor: 'pointer' }}></div>
                  <div className="minimap-node industrial" title="Industrial Robotics Bay" onClick={() => triggerBayFocus('industrial')} style={{ cursor: 'pointer' }}></div>
                  <div className="minimap-node embedded" title="Embedded Systems Bay" onClick={() => triggerBayFocus('embedded_radar')} style={{ cursor: 'pointer' }}></div>
                  <div className="minimap-node ml" title="Machine Learning Bay" onClick={() => triggerBayFocus('ml')} style={{ cursor: 'pointer' }}></div>
                  <div className="minimap-node achievements" title="Achievement Wall" onClick={() => triggerBayFocus('achievements')} style={{ cursor: 'pointer' }}></div>
                  <div className="minimap-node contact" title="Contact Command Terminal" onClick={() => triggerBayFocus('contact')} style={{ cursor: 'pointer' }}></div>
                  {/* Blinking camera pointer indicator */}
                  <div 
                    className="minimap-cam-indicator" 
                    style={{ left: getMinimapPos().left, top: getMinimapPos().top }}
                  ></div>
                </div>
              </div>
            </aside>

            {/* Keyboard walking legend instruction overlay */}
            <div className="controls-legend">
              <div className="legend-header">NAVIGATION_GUIDE</div>
              <div className="legend-row">
                <span className="key-cap">W</span><span className="key-cap">S</span>
                <span className="action-desc">Fwd / Back</span>
              </div>
              <div className="legend-row">
                <span className="key-cap">A</span><span className="key-cap">D</span>
                <span className="action-desc">Turn Camera</span>
              </div>
              <div className="legend-note">Click/Approach stations to inspect. Drag mouse to look around.</div>
            </div>

            {/* 3D R3F Canvas Container */}
            <div style={{ flexGrow: 1, height: '100%', position: 'relative', background: '#020305' }}>
              <Canvas
                camera={{ fov: 60, near: 0.1, far: 50, position: [0, 1.8, 14] }}
                shadows
              >
                <LabScene 
                  cameraOverride={cameraOverride}
                  activeBay={activeBay}
                  setActiveBay={setActiveBay}
                  onCameraChange={handleCameraChange}
                  openProjectDetails={openProjectDetails}
                  handleContactOperator={handleContactOperator}
                  loadingState={loadingState}
                  onCinematicComplete={handleCinematicFinished}
                />
              </Canvas>
            </div>
          </>
        ) : (
          /* Recruiter-focused accessible flat bento grid fallback view */
          <div className="flat-scroll-view">
            <div className="flat-container">
              <div className="flat-header">
                <span className="subtitle">Recruiter Diagnostic Dossier</span>
                <h1 className="title">Het Prajapati // Projects & Skills</h1>
              </div>

              {/* Bento Grid layout */}
              <div className="flat-bento-grid">
                
                {/* Profile Card */}
                <div className="flat-bento-card bento-profile span-2-col">
                  <div className="bento-card-icon"><i className="fa-solid fa-address-card"></i></div>
                  <h2 className="bento-card-title">HET PRAJAPATI</h2>
                  <p className="bento-card-text">
                    Robotics Engineering student at the <strong>Technische Hochschule Würzburg-Schweinfurt (THWS)</strong>, Germany. 
                    Specialized in kinematics programming, embedded motor controls, ROS2 architectures, and autonomous machine simulations.
                  </p>
                  <div className="bento-profile-details">
                    <div><strong>Email:</strong> hprajapati1094@gmail.com</div>
                    <div><strong>Location:</strong> Schweinfurt, Germany</div>
                    <div><strong>Status:</strong> Open to Internship, Working Student, and Robotics Engineering opportunities</div>
                  </div>
                  <button className="flat-cta-btn" onClick={handleContactOperator}>
                    <i className="fa-solid fa-envelope"></i> CONTACT OPERATOR
                  </button>
                </div>

                {/* Technical Skills Board */}
                <div className="flat-bento-card bento-skills span-1-row">
                  <div className="bento-card-icon"><i className="fa-solid fa-code"></i></div>
                  <h2 className="bento-card-title">TECHNICAL MATRIX</h2>
                  <div className="skills-grid">
                    <span className="skill-pill">ROS2 / ROS</span>
                    <span className="skill-pill">C++ / OOP</span>
                    <span className="skill-pill">Python</span>
                    <span className="skill-pill">MATLAB</span>
                    <span className="skill-pill">RoboDK Simulation</span>
                    <span className="skill-pill">OpenCV Vision</span>
                    <span className="skill-pill">PID Control Loops</span>
                    <span className="skill-pill">Arduino / ESP32</span>
                    <span className="skill-pill">SolidWorks CAD</span>
                    <span className="skill-pill">Autonomous SLAM</span>
                  </div>
                </div>

                {/* Scanned Project Cards */}
                {projectsData.map((proj, idx) => (
                  <div 
                    key={proj.id} 
                    className={`flat-bento-card ${proj.id === 'vinebot' ? 'span-2-col' : ''}`}
                    onClick={() => openProjectDetails(proj.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bento-card-header">
                      <span className="bento-card-subtitle">{proj.subtitle}</span>
                      <h2 className="bento-card-title">{proj.title}</h2>
                    </div>
                    {proj.videoUrl ? (
                      <div className="bento-media-preview">
                        <video src={proj.videoUrl} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}></video>
                      </div>
                    ) : (
                      <div className="bento-media-preview-fallback">
                        <i className="fa-solid fa-gear placeholder-icon" style={{ fontSize: '2.5rem', animation: 'spin 15s linear infinite', color: 'var(--color-accent-amber)' }}></i>
                        <span>SCHEMATIC / DESIGN SPECIFICATION</span>
                      </div>
                    )}
                    <p className="bento-card-text" style={{ marginTop: '1rem' }}>{proj.description}</p>
                    <div className="bento-card-footer">
                      {proj.techStack.map(t => <span key={t} className="diag-pill">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dynamic details overlay modal when a project is clicked */}
      {selectedProject && (
        <div className="project-detail-overlay-backdrop" onClick={() => setSelectedProject(null)}>
          <div className="project-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProject(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="modal-scroll-container">
              <div className="modal-media-section">
                {selectedProject.videoUrl ? (
                  <video src={selectedProject.videoUrl} controls autoPlay loop style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border)' }}></video>
                ) : (
                  <div className="modal-media-fallback">
                    <i className="fa-solid fa-satellite-dish" style={{ fontSize: '4rem', color: 'var(--color-accent-amber)', animation: 'pulse 2s infinite' }}></i>
                    <h3>{selectedProject.title} DEMO MONITOR</h3>
                    <p>Sensor arrays streaming telemetry logs. Full simulation files loading...</p>
                  </div>
                )}
              </div>
              <div className="modal-info-section">
                <span className="modal-subtitle">{selectedProject.subtitle}</span>
                <h1 className="modal-title">{selectedProject.title}</h1>
                
                <div className="modal-meta-grid">
                  <div className="meta-row"><span className="m-label">ROLE:</span><span className="m-val">{selectedProject.role}</span></div>
                  <div className="meta-row"><span className="m-label">INSTITUTION:</span><span className="m-val">THWS Würzburg-Schweinfurt, Germany</span></div>
                  <div className="meta-row"><span className="m-label">STATUS:</span><span className="m-val">COMPLETED MODULE</span></div>
                </div>

                <div className="modal-block">
                  <h3 className="modal-block-header">PROJECT SUMMARY</h3>
                  <p className="modal-block-text">{selectedProject.description}</p>
                </div>

                <div className="modal-block">
                  <h3 className="modal-block-header">KEY ACHIEVEMENTS</h3>
                  <ul className="modal-bullet-list">
                    {selectedProject.highlights.map((h, i) => (
                      <li key={i}><i className="fa-solid fa-chevron-right text-green"></i> {h}</li>
                    ))}
                  </ul>
                </div>

                <div className="modal-block">
                  <h3 className="modal-block-header">TECHNOLOGY IMPLEMENTED</h3>
                  <div className="modal-skills-list">
                    {selectedProject.techStack.map(t => (
                      <span key={t} className="spec-val-pill">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

