import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { audio } from '../utils/audio';

// ==========================================
// 1. Generic Pedestal Terminal Monitor
// ==========================================
function TerminalMonitor({
  position,
  rotation,
  title,
  subtitle,
  status = 'ONLINE',
  themeColor = '#00f0ff', // Cyan default
  onSelect,
  width = 2.4,
  height = 1.4,
  children
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Pedestal Base */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.1, 0.9]} />
        <meshStandardMaterial color="#0c0e14" roughness={0.8} metalness={0.9} />
      </mesh>

      {/* Pedestal Stand Pillar */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.18, 1.0, 0.18]} />
        <meshStandardMaterial color="#07090d" roughness={0.5} metalness={0.95} />
      </mesh>

      {/* Monitor Outer Shell Box */}
      <mesh position={[0, 1.25, 0.05]} castShadow>
        <boxGeometry args={[width, height, 0.12]} />
        <meshStandardMaterial color="#171b26" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Inner Screen Face */}
      <mesh position={[0, 1.25, 0.11]}>
        <planeGeometry args={[width - 0.08, height - 0.08]} />
        <meshBasicMaterial color="#020305" />
      </mesh>

      {/* Drei Projected HTML Frame overlay inside the screen */}
      <Html
        transform
        distanceFactor={1.3}
        position={[0, 1.25, 0.118]}
        rotation={[0, 0, 0]}
      >
        <div 
          className="monitor-glass-screen" 
          onClick={() => { audio.playUiClick(); if (onSelect) onSelect(); }}
          style={{ 
            width: '640px', 
            height: '380px', 
            border: `2px solid ${themeColor}`,
            boxShadow: `inset 0 0 25px rgba(0,0,0,0.95), 0 0 15px ${themeColor}35`,
            background: 'rgba(4, 6, 10, 0.94)',
            fontFamily: "'Share Tech Mono', monospace",
            color: '#e2e8f0',
            position: 'relative',
            cursor: 'pointer',
            borderRadius: '6px',
            overflow: 'hidden',
            userSelect: 'none'
          }}
        >
          {/* Scanline CRT overlay */}
          <div className="crt-inner-overlay"></div>

          {/* Screen HUD Top Info */}
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: '11px',
            color: themeColor,
            textShadow: `0 0 5px ${themeColor}80`
          }}>
            <span>{subtitle || 'THWS_SYSTEM_LOG'}</span>
            <span>STATUS: {status}</span>
          </div>

          {/* Core Content Area */}
          <div style={{ width: '100%', height: '280px', position: 'relative', overflow: 'hidden' }}>
            {children}
          </div>

          {/* Screen Bottom Panel */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 12px',
            fontSize: '12px',
            background: 'rgba(10, 13, 20, 0.95)'
          }}>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>{title || 'Robotics Terminal'}</span>
            <span style={{ fontSize: '10px', color: 'var(--color-accent-amber)', textShadow: '0 0 5px rgba(255,170,0,0.4)' }}>[CLICK MONITOR TO INSPECT]</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ==========================================
// 2. ROS2 Vineyard Navigation Bay
// ==========================================
export function VineyardBay({ position, rotation, openProject, isActive }) {
  const [slamCoords, setSlamCoords] = useState({ x: -1.2, y: 0.8 });
  const pathIndex = useRef(0);

  // Predefined SLAM path coordinates representing vineyard rows navigation
  const pathPoints = useMemo(() => [
    { x: -3.0, y: 3.5 }, { x: -3.0, y: -3.5 },
    { x: -1.5, y: -3.5 }, { x: -1.5, y: 3.5 },
    { x: 0.0, y: 3.5 }, { x: 0.0, y: -3.5 },
    { x: 1.5, y: -3.5 }, { x: 1.5, y: 3.5 },
    { x: 3.0, y: 3.5 }, { x: 3.0, y: -3.5 }
  ], []);

  // Vineyard robot model motion spline
  const roverRef = useRef();

  useFrame((state) => {
    if (!isActive) return;
    const t = state.clock.getElapsedTime();

    // Animate robot model driving in vineyard rows next to terminal
    if (roverRef.current) {
      const zPos = Math.sin(t * 0.4) * 1.5;
      roverRef.current.position.z = zPos;
      // Tilt rover slightly to simulate uneven field terrain
      roverRef.current.rotation.x = Math.sin(t * 1.5) * 0.04;
      roverRef.current.rotation.z = Math.cos(t * 1.2) * 0.03;
    }
  });

  // Simulate SLAM Coordinate path shifts
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      pathIndex.current = (pathIndex.current + 1) % pathPoints.length;
      const target = pathPoints[pathIndex.current];
      setSlamCoords(target);
    }, 2500);
    return () => clearInterval(interval);
  }, [isActive, pathPoints]);

  return (
    <group position={position} rotation={rotation}>
      {/* Floating Hologram Title */}
      <Html position={[0, 2.3, 0]} center distanceFactor={1.5}>
        <div style={{
          color: 'var(--color-accent)',
          textShadow: 'var(--glow-shadow)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          background: 'rgba(2, 3, 5, 0.8)',
          padding: '4px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          <i className="fa-solid fa-seedling" style={{ marginRight: '6px' }}></i> AUTONOMOUS_FIELD_ROVER
        </div>
      </Html>

      {/* Station Terminal */}
      <TerminalMonitor
        position={[0, 0, 0]}
        title="ROS2 Vineyard Navigation (Vinebot)"
        subtitle="STATION_05 // FIELD NAVIGATION"
        status="ACTIVE"
        themeColor="#00f0ff"
        onSelect={() => openProject('vinebot')}
      >
        <div style={{ padding: '16px', display: 'flex', gap: '16px', height: '100%' }}>
          {/* SLAM coordinate mapping */}
          <div style={{ flex: '1.2', border: '1px solid rgba(0, 240, 255, 0.18)', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '10px', padding: '4px 8px', borderBottom: '1px solid rgba(0, 240, 255, 0.1)', color: '#00f0ff', display: 'flex', justifyContent: 'space-between' }}>
              <span>SLAM_OCCUPANCY_GRID</span>
              <span style={{ color: 'var(--color-accent-green)' }}>RTK_FIXED</span>
            </div>
            <div style={{ flex: '1', position: 'relative', overflow: 'hidden', background: '#020407' }}>
              {/* Grid lines */}
              <div style={{ width: '100%', height: '100%', borderTop: '1px dashed rgba(255,255,255,0.04)', borderLeft: '1px dashed rgba(255,255,255,0.04)', position: 'absolute', top: '50%', left: '0' }}></div>
              <div style={{ width: '100%', height: '100%', borderLeft: '1px dashed rgba(255,255,255,0.04)', position: 'absolute', top: '0', left: '50%' }}></div>

              {/* Draw vineyard rows (obstacles) */}
              <div style={{ position: 'absolute', left: '20%', top: '10%', bottom: '10%', width: '4px', background: 'rgba(0,255,102,0.15)', border: '1px solid rgba(0,255,102,0.3)' }}></div>
              <div style={{ position: 'absolute', left: '40%', top: '10%', bottom: '10%', width: '4px', background: 'rgba(0,255,102,0.15)', border: '1px solid rgba(0,255,102,0.3)' }}></div>
              <div style={{ position: 'absolute', left: '60%', top: '10%', bottom: '10%', width: '4px', background: 'rgba(0,255,102,0.15)', border: '1px solid rgba(0,255,102,0.3)' }}></div>
              <div style={{ position: 'absolute', left: '80%', top: '10%', bottom: '10%', width: '4px', background: 'rgba(0,255,102,0.15)', border: '1px solid rgba(0,255,102,0.3)' }}></div>

              {/* Dot coordinates representing active rover location */}
              <div style={{
                position: 'absolute',
                left: `${((slamCoords.x + 5) / 10) * 100}%`,
                top: `${((5 - slamCoords.y) / 10) * 100}%`,
                width: '10px',
                height: '10px',
                background: '#00f0ff',
                borderRadius: '50%',
                boxShadow: '0 0 12px #00f0ff, 0 0 4px #fff',
                transform: 'translate(-50%, -50%)',
                transition: 'all 2.0s ease-in-out',
                zIndex: 5
              }}></div>
            </div>
          </div>

          {/* ROS2 node status screens */}
          <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
              <div style={{ color: '#00f0ff', fontWeight: 'bold', marginBottom: '4px' }}>ROS2_ACTIVE_NODES:</div>
              <div>/nav2_bt_navigator: <span style={{ color: '#00ff66' }}>RUNNING</span></div>
              <div>/slam_toolbox: <span style={{ color: '#00ff66' }}>OK</span></div>
              <div>/lidar_filter_node: <span style={{ color: '#00ff66' }}>OK</span></div>
              <div>/gps_rtk_driver: <span style={{ color: '#00ff66' }}>OK</span></div>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
              <div style={{ color: '#00f0ff', fontWeight: 'bold', marginBottom: '4px' }}>TELEMETRY_STREAM:</div>
              <div>ODOM_X: {slamCoords.x.toFixed(2)}m</div>
              <div>ODOM_Y: {slamCoords.y.toFixed(2)}m</div>
              <div>LIDAR: 12.4Hz [OK]</div>
              <div>SPEED: 0.45 m/s</div>
            </div>
          </div>
        </div>
      </TerminalMonitor>

      {/* 3D Rover Model driving next to the terminal */}
      <group position={[1.4, 0, 0]} ref={roverRef}>
        {/* Rover Chassis */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.5, 0.15, 0.7]} />
          <meshStandardMaterial color="#1f2430" roughness={0.3} metalness={0.9} />
        </mesh>
        
        {/* Rover Solar Panel Lid */}
        <mesh position={[0, 0.28, 0]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.02, 0.65]} />
          <meshStandardMaterial color="#002b49" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Wheels */}
        {/* Front Left */}
        <mesh position={[-0.28, 0.1, 0.22]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <meshStandardMaterial color="#0b0c10" roughness={0.9} />
        </mesh>
        {/* Front Right */}
        <mesh position={[0.28, 0.1, 0.22]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <meshStandardMaterial color="#0b0c10" roughness={0.9} />
        </mesh>
        {/* Back Left */}
        <mesh position={[-0.28, 0.1, -0.22]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <meshStandardMaterial color="#0b0c10" roughness={0.9} />
        </mesh>
        {/* Back Right */}
        <mesh position={[0.28, 0.1, -0.22]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <meshStandardMaterial color="#0b0c10" roughness={0.9} />
        </mesh>

        {/* Floating LiDAR sensor */}
        <group position={[0, 0.35, 0.15]}>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
            <meshStandardMaterial color="#ffaa00" />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
            <meshBasicMaterial color="#000" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ==========================================
// 3. Industrial Robotics Manipulator Bay
// ==========================================
export function IndustrialBay({ position, rotation, openProject, isActive }) {
  const armBaseRef = useRef();
  const armLink1Ref = useRef();
  const armLink2Ref = useRef();
  const armClawRef = useRef();
  
  // Ref to track points along our trajectory curve
  const curveRef = useRef();

  // Define trajectory points
  const points = useMemo(() => [
    new THREE.Vector3(1.4, 0.4, 0.5),
    new THREE.Vector3(1.7, 0.9, 0.3),
    new THREE.Vector3(1.4, 1.2, -0.2),
    new THREE.Vector3(0.9, 0.8, -0.5),
    new THREE.Vector3(1.4, 0.4, 0.5)
  ], []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  // Joint Angle Animating loop + trajectory tracer
  useFrame((state) => {
    if (!isActive) return;
    const t = state.clock.getElapsedTime();
    
    // Animate KUKA arm joint configurations
    if (armBaseRef.current) armBaseRef.current.rotation.y = Math.sin(t * 0.6) * 0.7;
    if (armLink1Ref.current) armLink1Ref.current.rotation.z = Math.sin(t * 0.9) * 0.25 - 0.15;
    if (armLink2Ref.current) armLink2Ref.current.rotation.z = Math.cos(t * 1.2) * 0.35 + 0.25;
    if (armClawRef.current) armClawRef.current.rotation.x = Math.sin(t * 1.5) * 0.4;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Floating Hologram Title */}
      <Html position={[-1.2, 2.3, 0]} center distanceFactor={1.5}>
        <div style={{
          color: 'var(--color-accent-purple)',
          textShadow: '0 0 10px rgba(157, 78, 221, 0.6)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          background: 'rgba(2, 3, 5, 0.8)',
          padding: '4px 12px',
          border: '1px solid rgba(157, 78, 221, 0.3)',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          <i className="fa-solid fa-robot" style={{ marginRight: '6px' }}></i> KUKA_MANIPULATION_BAY
        </div>
      </Html>

      {/* Terminal Screen showing KRL code and TCP analytics */}
      <TerminalMonitor
        position={[-1.2, 0, 0]}
        title="KUKA Robotics Simulation"
        subtitle="STATION_02 // MANIPULATION"
        status="ACTIVE"
        themeColor="#9d4edd"
        onSelect={() => openProject('kuka')}
      >
        <div style={{ padding: '16px', fontSize: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ border: '1px solid rgba(157, 78, 221, 0.3)', padding: '6px', background: 'rgba(157, 78, 221, 0.05)', borderRadius: '4px' }}>
            <div style={{ color: '#9d4edd', fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>KRL_ACTIVE_PATH // RUNNING</div>
            <code style={{ color: '#c9a0dc', fontFamily: "'Share Tech Mono', monospace" }}>
              PTP HOME Vel=100% DEFAULT;<br />
              LIN APPROACH_P1 Vel=1.5 m/s CPDAT1;<br />
              TRIGGER WHEN DIST=120 DELAY=0 DO CLAW_GRIP=TRUE;<br />
              LIN PICK_P2 Vel=0.5 m/s CPDAT2;
            </code>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
              <span style={{ color: '#9d4edd', fontWeight: 'bold' }}>JOINT_ANGLES (DEGs):</span>
              <div>A1: 24.5° | A2: -18.2°</div>
              <div>A3: 84.0° | A4: 12.1°</div>
              <div>A5: 42.8° | A6: 0.0°</div>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
              <span style={{ color: '#9d4edd', fontWeight: 'bold' }}>TCP_COORDINATES:</span>
              <div>X: 1184.12mm | Y: -24.50mm</div>
              <div>Z: 624.90mm  | R: 0.02 RAD</div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px', color: 'var(--color-accent-green)' }}>RESOLVER: STABLE</div>
            </div>
          </div>
        </div>
      </TerminalMonitor>

      {/* Hierarchical 3D Manipulator Arm mesh next to screen */}
      <group position={[1.4, 0, 0]}>
        {/* Robot Arm Base Pedestal */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.4, 0.2, 16]} />
          <meshStandardMaterial color="#1a122e" roughness={0.7} metalness={0.9} />
        </mesh>
        
        {/* Joint 1 Base rotator */}
        <group position={[0, 0.2, 0]} ref={armBaseRef}>
          <mesh castShadow position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.4, 16]} />
            <meshStandardMaterial color="#2c2f3b" roughness={0.4} metalness={0.8} />
          </mesh>

          {/* Joint 2 Shoulder */}
          <group position={[0, 0.4, 0]} ref={armLink1Ref}>
            <mesh castShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[0.14, 1.0, 0.14]} />
              <meshStandardMaterial color="#ffaa00" roughness={0.3} metalness={0.6} />
            </mesh>
            
            {/* Joint 3 Elbow */}
            <group position={[0, 1.0, 0]} ref={armLink2Ref}>
              <mesh castShadow position={[0, 0.45, 0]}>
                <boxGeometry args={[0.1, 0.9, 0.1]} />
                <meshStandardMaterial color="#2c2f3b" roughness={0.4} metalness={0.8} />
              </mesh>

              {/* Tool Flange & Gripper */}
              <group position={[0, 0.9, 0]} ref={armClawRef}>
                <mesh castShadow>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshStandardMaterial color="#ffaa00" roughness={0.2} />
                </mesh>
                <mesh castShadow position={[0, 0.1, 0]}>
                  <boxGeometry args={[0.12, 0.08, 0.04]} />
                  <meshStandardMaterial color="#9d4edd" />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* 3D Glowing Trajectory Curve Next to KUKA arm */}
      <line ref={curveRef} position={[0, 0.25, 0]}>
        <bufferGeometry attach="geometry" />
        <lineBasicMaterial attach="material" color="#9d4edd" linewidth={2} transparent opacity={0.6} />
      </line>
    </group>
  );
}

// ==========================================
// 4. Embedded Systems Bay
// ==========================================
export function EmbeddedBay({ position, rotation, openProject, activeBay }) {
  // Canvas Radar sweep scanner logic inside terminal 2
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;
    let frameId;

    const render = () => {
      ctx.fillStyle = 'rgba(2, 3, 5, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height - 20;
      const r = Math.min(cx, cy) - 10;

      // Draw grid grids
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
      ctx.arc(cx, cy, r / 1.5, Math.PI, 2 * Math.PI);
      ctx.arc(cx, cy, r / 3, Math.PI, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - r);
      ctx.stroke();

      // Draw scanner sweep line
      const rad = angle * Math.PI / 180;
      const lx = cx + Math.cos(rad) * r;
      const ly = cy + Math.sin(rad) * r;

      // Volumetric sweep beam gradient
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // Draw mock radar coordinate breach dots
      ctx.fillStyle = 'rgba(255, 170, 0, 0.9)';
      ctx.shadowColor = 'rgba(255, 170, 0, 0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx - 70, cy - 90, 5, 0, 2 * Math.PI);
      ctx.arc(cx + 90, cy - 130, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      angle = (angle - 1.2) % 360;
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <group position={position} rotation={rotation}>
      {/* Floating Hologram Title */}
      <Html position={[0, 2.3, 0]} center distanceFactor={1.5}>
        <div style={{
          color: 'var(--color-accent-green)',
          textShadow: 'var(--glow-shadow-green)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          background: 'rgba(2, 3, 5, 0.8)',
          padding: '4px 12px',
          border: '1px solid var(--color-border-green)',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          <i className="fa-solid fa-microchip" style={{ marginRight: '6px' }}></i> EMBEDDED_SYSTEMS_BAY
        </div>
      </Html>

      {/* Station 01: Gesture Controlled Car */}
      <TerminalMonitor
        position={[-2.8, 0, 0]}
        title="Gesture Controlled Car"
        subtitle="STATION_01 // EMBEDDED"
        status="ACTIVE"
        themeColor="#00ff66"
        onSelect={() => openProject('gesture_car')}
      >
        <div style={{ padding: '16px', fontSize: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ border: '1px solid rgba(0, 255, 102, 0.25)', padding: '6px', background: 'rgba(0, 255, 102, 0.04)', borderRadius: '4px' }}>
            <div style={{ color: '#00ff66', fontWeight: 'bold', marginBottom: '2px' }}>GESTURE_DECODING_MATRIX:</div>
            <div>ACT: MOTION_DECODED [115200 BAUD]</div>
            <div>TELEMETRY: index_point_fwd (GO_FORWARD)</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
              <span style={{ color: '#00ff66', fontWeight: 'bold' }}>ESP32_DRIVE_INFO:</span>
              <div>V_BATT: 4.16V [OK]</div>
              <div>MOTOR_L: PWM 192 (75%)</div>
              <div>MOTOR_R: PWM 192 (75%)</div>
              <div>LATENCY: 34ms [EXCELLENT]</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: '#070b10' }}>
              <i className="fa-solid fa-car" style={{ fontSize: '24px', color: '#00ff66', animation: 'pulse 1s infinite' }}></i>
              <span style={{ fontSize: '8px', marginTop: '6px', color: 'var(--color-text-secondary)' }}>WIFI: -52dBm</span>
            </div>
          </div>
        </div>
      </TerminalMonitor>

      {/* Station 04: Ultrasonic Radar System (Active canvas render) */}
      <TerminalMonitor
        position={[0, 0, 0]}
        title="Ultrasonic Radar System"
        subtitle="STATION_04 // EMBEDDED"
        status="ACTIVE"
        themeColor="#00ff66"
        onSelect={() => openProject('radar_system')}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <canvas ref={canvasRef} width={640} height={280} style={{ width: '100%', height: '100%' }}></canvas>
          <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', color: '#00ff66', textShadow: '0 0 5px #00ff66', fontFamily: "'Share Tech Mono', monospace" }}>
            SWEEP_FREQ: 16Hz // RADAR_SWEEP
          </div>
        </div>
      </TerminalMonitor>

      {/* Station 03: Line Follower Robot (moving PID coordinates) */}
      <TerminalMonitor
        position={[2.8, 0, 0]}
        title="Line Follower Robot"
        subtitle="STATION_03 // EMBEDDED"
        status="ACTIVE"
        themeColor="#00ff66"
        onSelect={() => openProject('line_follower')}
      >
        <div style={{ padding: '16px', fontSize: '10px', height: '100%', display: 'flex', gap: '12px' }}>
          <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
              <span style={{ color: '#00ff66', fontWeight: 'bold' }}>PID_CONTROLLER_GAINS:</span>
              <div>Kp: 1.45 | Ki: 0.02 | Kd: 0.82</div>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px', background: 'rgba(255,255,255,0.01)', borderRadius: '4px' }}>
              <span style={{ color: '#00ff66', fontWeight: 'bold' }}>PID_FEEDBACK_LOOP:</span>
              <div>ERROR: -1.84 | CORR: -3.20</div>
              <div>LOOP_LATENCY: 2.5ms (400Hz)</div>
            </div>
          </div>
          <div style={{ flex: '0.8', border: '1px solid rgba(0, 255, 102, 0.2)', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            {/* Draw track loop */}
            <div style={{
              width: '80px',
              height: '80px',
              border: '6px solid #0f131b',
              borderRadius: '50%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}></div>
            {/* Dot representing robot on track */}
            <div style={{
              width: '8px',
              height: '8px',
              background: '#00ff66',
              borderRadius: '50%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-40px, -4px)',
              animation: 'spin 4s linear infinite',
              transformOrigin: '40px 4px'
            }}></div>
          </div>
        </div>
      </TerminalMonitor>
    </group>
  );
}

// ==========================================
// 5. Machine Learning Bay
// ==========================================
export function MLBay({ position, rotation, isActive }) {
  const pointsRef = useRef();
  const jointsRef = useRef([]);

  // Dataset Rotating cloud particles animation + skeletal motion loops
  useFrame((state) => {
    if (!isActive) return;
    const t = state.clock.getElapsedTime();
    
    // Rotate 3D dataset particle cloud
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.18;
      pointsRef.current.rotation.x = t * 0.08;
    }

    // Animate ML skeletal nodes to simulate active pose tracking
    jointsRef.current.forEach((joint, idx) => {
      if (!joint) return;
      const phase = idx * 0.45;
      joint.position.y = Math.sin(t * 1.6 + phase) * 0.1;
      joint.position.x = Math.cos(t * 1.1 + phase) * 0.08;
    });
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Floating Hologram Title */}
      <Html position={[-1.2, 2.3, 0]} center distanceFactor={1.5}>
        <div style={{
          color: 'var(--color-accent)',
          textShadow: 'var(--glow-shadow)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          background: 'rgba(2, 3, 5, 0.8)',
          padding: '4px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          <i className="fa-solid fa-brain" style={{ marginRight: '6px' }}></i> COGNITIVE_ML_BAY
        </div>
      </Html>

      {/* ML terminal monitor */}
      <TerminalMonitor
        position={[-1.2, 0, 0]}
        title="ML Pose Estimation"
        subtitle="STATION_06 // ML_DEPT"
        status="ACTIVE"
        themeColor="#00f0ff"
        onSelect={() => {}}
      >
        <div style={{ padding: '16px', fontSize: '10px', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ border: '1px solid rgba(0, 240, 255, 0.25)', padding: '6px', background: 'rgba(0, 240, 255, 0.04)', borderRadius: '4px' }}>
            <div style={{ color: '#00f0ff', fontWeight: 'bold', marginBottom: '2px' }}>MODEL_METRICS (ResNet18_Inference):</div>
            <div>LATENCY: 11.2ms (GPU_CUDA_ON) | INFERENCE: 6.8ms</div>
            <div>mAP_50-95: 0.842 | EVAL_ACCURACY: 98.4%</div>
          </div>
          {/* Simulated metric training charts */}
          <div style={{ flex: '1', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', background: '#020508', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>TRAINING_LOSS_CONVERGENCE (EPOCHS 1-100):</span>
            <div style={{ flex: '1', position: 'relative', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Plot simulated loss bars */}
              <div style={{ width: '100%', height: '80%', display: 'flex', gap: '4px', alignItems: 'flex-end', padding: '0 4px' }}>
                <div style={{ flex: 1, height: '95%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '78%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '62%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '48%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '36%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '28%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '20%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '14%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
                <div style={{ flex: 1, height: '8%', background: 'rgba(0, 240, 255, 0.3)', borderTop: '2.5px solid #00f0ff' }}></div>
              </div>
            </div>
          </div>
        </div>
      </TerminalMonitor>

      {/* 3D Datasets Rotating cloud particles mesh */}
      <points ref={pointsRef} position={[1.4, 1.8, 0.2]}>
        <sphereGeometry args={[0.38, 24, 24]} />
        <pointsMaterial color="#00f0ff" size={0.03} sizeAttenuation={true} transparent opacity={0.8} />
      </points>

      {/* ML Pose Estimation Skeleton mesh model */}
      <group position={[1.4, 0.4, -0.4]}>
        {/* Head Node */}
        <mesh position={[0, 0.95, 0]} ref={el => jointsRef.current[0] = el}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        {/* Spine/Shoulder Link */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.04]} />
          <meshBasicMaterial color="rgba(0,240,255,0.4)" />
        </mesh>
        {/* Left Arm Joint */}
        <mesh position={[-0.11, 0.55, 0]} ref={el => jointsRef.current[1] = el}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#00ff66" />
        </mesh>
        {/* Right Arm Joint */}
        <mesh position={[0.11, 0.55, 0]} ref={el => jointsRef.current[2] = el}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#00ff66" />
        </mesh>
        {/* Spine rod */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.03, 0.5, 0.03]} />
          <meshBasicMaterial color="rgba(0,240,255,0.2)" />
        </mesh>
        {/* Hips Link */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.18, 0.04, 0.04]} />
          <meshBasicMaterial color="rgba(0,240,255,0.4)" />
        </mesh>
        {/* Left Leg Joint */}
        <mesh position={[-0.09, 0.05, 0]} ref={el => jointsRef.current[3] = el}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        {/* Right Leg Joint */}
        <mesh position={[0.09, 0.05, 0]} ref={el => jointsRef.current[4] = el}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
      </group>
    </group>
  );
}

// ==========================================
// 6. Orbiting Skills Core (Skills Section)
// ==========================================
export function AICoreSkills({ position, rotation, isActive }) {
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  
  const skillList = useMemo(() => [
    'ROS2', 'C++', 'Python', 'PyTorch',
    'OpenCV', 'MATLAB', 'Gazebo', 'Docker',
    'Linux', 'Git', 'MoveIt', 'Control Loops'
  ], []);

  // Calculate dynamic orbiting coordinate pathways
  const [orbitPositions, setOrbitPositions] = useState(() => {
    return skillList.map((_, idx) => new THREE.Vector3());
  });

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Rotate core and ring meshes
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.4;
      coreRef.current.rotation.x = t * 0.2;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = -t * 0.15;
    if (ring2Ref.current) ring2Ref.current.rotation.x = t * 0.18;

    // Calculate orbiting coords for skills
    const nextPositions = skillList.map((_, idx) => {
      // Offset angles for even distribution
      const baseAngle = (idx / skillList.length) * Math.PI * 2;
      const angle = baseAngle + t * 0.15; // Speed of orbit
      const radius = 1.35;
      
      // Rotate path in 3D (tilt orbits)
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      // Alternate tilt
      const y = Math.sin(angle * 1.5 + idx) * 0.4; 

      return new THREE.Vector3(x, y, z);
    });
    setOrbitPositions(nextPositions);
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Floating Station Title */}
      <Html position={[0, 2.3, 0]} center distanceFactor={1.5}>
        <div style={{
          color: 'var(--color-accent)',
          textShadow: 'var(--glow-shadow)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          background: 'rgba(2, 3, 5, 0.8)',
          padding: '4px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          <i className="fa-solid fa-atom" style={{ marginRight: '6px' }}></i> SKILLS_AI_CORE
        </div>
      </Html>

      {/* central glowing reactor core sphere */}
      <mesh ref={coreRef} position={[0, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.7} />
      </mesh>
      
      {/* Outer core shield */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.12} />
      </mesh>

      {/* Orbiting rings */}
      <mesh ref={ring1Ref} position={[0, 1.25, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[1.3, 1.32, 64]} />
        <meshBasicMaterial color="rgba(0, 240, 255, 0.3)" side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 1.25, 0]} rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
        <ringGeometry args={[1.25, 1.27, 64]} />
        <meshBasicMaterial color="rgba(0, 255, 102, 0.25)" side={THREE.DoubleSide} />
      </mesh>

      {/* Orbiting HTML projected skill labels */}
      {skillList.map((skill, idx) => {
        const pos = orbitPositions[idx];
        return (
          <Html
            key={skill}
            transform
            distanceFactor={1.3}
            position={[pos.x, pos.y + 1.25, pos.z]}
            rotation={[0, 0, 0]}
          >
            <div 
              className="skill-hologram-pill"
              onMouseEnter={() => audio.playHoverTick()}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#fff',
                background: 'rgba(4, 6, 10, 0.88)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '4px 10px',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.25)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fa-solid fa-code" style={{ marginRight: '4px', color: 'var(--color-accent-green)' }}></i> {skill}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

// ==========================================
// 7. Holographic AI Assistant (About Me)
// ==========================================
export function HolographicAI({ position, rotation, isActive }) {
  const avatarRef = useRef();
  const [typeText, setTypeText] = useState('');
  const canvasRef = useRef(null);

  // Holographic typing intro text scroller
  const fullText = "GREETINGS OPERATOR. I am H.E.T. - your Laboratory AI Assistant. Let me introduce you to Het Prajapati, a visionary Robotics and AI Engineer specializing in autonomous kinematics, ROS2 layouts, and deep reinforcement learning architectures at THWS Schweinfurt. Approach his terminals to inspect telemetry. Connecting neural pathways...";

  useEffect(() => {
    let timer;
    let idx = 0;
    
    const runTyping = () => {
      if (idx < fullText.length) {
        setTypeText(prev => prev + fullText[idx]);
        idx++;
        // Play subtle clicking telemetry ticks during typing
        if (idx % 6 === 0) {
          audio.playHoverTick();
        }
      } else {
        clearInterval(timer);
      }
    };
    
    // Start typing after a short delay
    const startDelay = setTimeout(() => {
      timer = setInterval(runTyping, 45);
    }, 1500);

    return () => {
      clearInterval(timer);
      clearTimeout(startDelay);
    };
  }, []);

  // Voice Waveform Canvas Oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let offset = 0;

    const drawWave = () => {
      ctx.fillStyle = '#04060a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
      ctx.shadowBlur = 4;
      ctx.beginPath();

      const cy = canvas.height / 2;
      ctx.moveTo(0, cy);

      for (let x = 0; x < canvas.width; x++) {
        // Compose multiple sine waves to create high-tech speech wave
        const w1 = Math.sin(x * 0.05 + offset) * 12;
        const w2 = Math.sin(x * 0.12 - offset * 1.5) * 6;
        const w3 = Math.cos(x * 0.02 + offset * 0.5) * 4;
        
        // Fades wave edges for clean terminal aesthetic
        const edgeFade = Math.sin((x / canvas.width) * Math.PI);
        const y = cy + (w1 + w2 + w3) * edgeFade;

        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      offset += 0.08;
      frameId = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => cancelAnimationFrame(frameId);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Rotate and bob the holographic AI head/bust geometry
    if (avatarRef.current) {
      avatarRef.current.rotation.y = t * 0.45;
      avatarRef.current.position.y = 1.25 + Math.sin(t * 1.2) * 0.08;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Floating Title */}
      <Html position={[0, 2.3, 0]} center distanceFactor={1.5}>
        <div style={{
          color: 'var(--color-accent)',
          textShadow: 'var(--glow-shadow)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          background: 'rgba(2, 3, 5, 0.8)',
          padding: '4px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          <i className="fa-solid fa-head-side-virus" style={{ marginRight: '6px' }}></i> HOLOGRAPHIC_AI_ASSISTANT
        </div>
      </Html>

      {/* Holographic 3D Floating Avatar Core (Octahedron surrounded by rings) */}
      <group ref={avatarRef} position={[0, 1.25, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.85} />
        </mesh>
        
        {/* Orbital vertical rings */}
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[0.32, 0.34, 32]} />
          <meshBasicMaterial color="#00ff66" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
          <ringGeometry args={[0.28, 0.3, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Floating glassmorphic console showing waveform and scroller */}
      <group position={[0, 0, 0.1]}>
        <Html
          transform
          distanceFactor={1.35}
          position={[0, 0.45, 0.02]}
          rotation={[0, 0, 0]}
        >
          <div 
            className="ai-hologram-monitor"
            style={{
              width: '380px',
              height: '210px',
              border: '2px solid var(--color-border)',
              boxShadow: '0 0 15px rgba(0,240,255,0.2)',
              background: 'rgba(4, 6, 10, 0.92)',
              borderRadius: '6px',
              fontFamily: "'Share Tech Mono', monospace",
              color: '#e2e8f0',
              padding: '10px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              userSelect: 'none'
            }}
          >
            {/* Scanline overlay */}
            <div className="crt-inner-overlay"></div>

            {/* Canvas Oscilloscope */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
              <canvas ref={canvasRef} width={80} height={30} style={{ width: '80px', height: '30px', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '3px' }}></canvas>
              <div style={{ fontSize: '10px', color: 'var(--color-accent)' }}>
                <div style={{ fontWeight: 'bold' }}>SYSTEM_VOCAL_SYNTH</div>
                <div>STATE: TRANSMITTING...</div>
              </div>
            </div>

            {/* Scroller terminal text */}
            <div style={{
              flexGrow: 1,
              fontSize: '9.5px',
              lineHeight: '1.4',
              color: 'var(--color-text-secondary)',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.02)',
              padding: '6px',
              background: '#020407',
              borderRadius: '3px',
              wordBreak: 'break-word'
            }}>
              <span style={{ color: 'var(--color-accent-green)' }}>[SYS_ASSISTANT]:</span> {typeText}
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// ==========================================
// 8. Achievement Wall (Academic & Milestones Timeline)
// ==========================================
export function AchievementWall({ position, rotation, isActive }) {
  const [activeTab, setActiveTab] = useState('milestones'); // 'education' | 'milestones' | 'future'

  return (
    <group position={position} rotation={rotation}>
      {/* Wall Frame Mesh */}
      <mesh position={[0, 1.6, -0.05]} receiveShadow>
        <boxGeometry args={[5.4, 3.3, 0.1]} />
        <meshStandardMaterial color="#080b11" roughness={0.8} metalness={0.9} />
      </mesh>
      
      {/* Glowing metal trim */}
      <mesh position={[0, 3.25, 0.02]}>
        <boxGeometry args={[5.4, 0.05, 0.05]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>

      {/* Drei Projected HTML Frame overlay inside the screen */}
      <Html
        transform
        distanceFactor={1.9}
        position={[0, 1.6, 0.02]}
        rotation={[0, 0, 0]}
      >
        <div style={{
          width: '980px',
          height: '600px',
          border: '3px solid #00f0ff',
          boxShadow: 'inset 0 0 35px rgba(0,240,255,0.22), 0 0 20px rgba(0,240,255,0.2)',
          background: 'rgba(4, 6, 9, 0.96)',
          fontFamily: "'Share Tech Mono', monospace",
          color: '#e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Scanline CRT overlay */}
          <div className="crt-inner-overlay"></div>

          {/* Holographic Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #00f0ff', paddingBottom: '12px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', color: '#00f0ff', margin: 0, letterSpacing: '0.1em', fontWeight: '800' }}>
              THWS // DIAGNOSTIC_DOSSIER // INTERNSHIP_READINESS
            </h1>
            <span style={{ fontSize: '14px', color: '#00ff66', alignSelf: 'center', fontWeight: 'bold' }}>OPERATIONAL CLEARANCE: READY</span>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              onClick={() => { audio.playUiClick(); setActiveTab('education'); }}
              style={{
                background: activeTab === 'education' ? 'var(--color-accent)' : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(0,240,255,0.3)',
                color: activeTab === 'education' ? '#000' : 'var(--color-text-secondary)',
                padding: '8px 16px',
                borderRadius: '4px',
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              01 // EDUCATION
            </button>
            <button 
              onClick={() => { audio.playUiClick(); setActiveTab('milestones'); }}
              style={{
                background: activeTab === 'milestones' ? 'var(--color-accent)' : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(0,240,255,0.3)',
                color: activeTab === 'milestones' ? '#000' : 'var(--color-text-secondary)',
                padding: '8px 16px',
                borderRadius: '4px',
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              02 // PRACTICAL MILESTONES
            </button>
            <button 
              onClick={() => { audio.playUiClick(); setActiveTab('future'); }}
              style={{
                background: activeTab === 'future' ? 'var(--color-accent)' : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(0,240,255,0.3)',
                color: activeTab === 'future' ? '#000' : 'var(--color-text-secondary)',
                padding: '8px 16px',
                borderRadius: '4px',
                fontFamily: "'Share Tech Mono', monospace",
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              03 // RESEARCH & FUTURE
            </button>
          </div>

          {/* Core Tab Panels */}
          <div style={{ flex: '1', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', overflow: 'hidden' }}>
            
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              {activeTab === 'education' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                    <h3 style={{ color: '#00f0ff', fontSize: '15px', marginBottom: '6px' }}>BACHELOR OF SCIENCE: ROBOTICS</h3>
                    <div style={{ fontSize: '11px', color: 'var(--color-accent-green)', marginBottom: '8px' }}>THWS Schweinfurt, Germany // 2024 - Present</div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
                      Enrolled in the highly technical B.Sc. Robotics curriculum at the **Technische Hochschule Würzburg-Schweinfurt (THWS)**. Specializing in advanced kinematic modeling, control theory firmware, and autonomous robot simulation.
                    </p>
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                    <h3 style={{ color: '#00f0ff', fontSize: '15px', marginBottom: '6px' }}>ACADEMIC EXCELLENCE & CURRICULUM</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>• Kinematics & Manipulators</div>
                      <div>• PID Control Loop Tuning</div>
                      <div>• Embedded Microcontrollers</div>
                      <div>• SLAM & Sensor Fusion</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'milestones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                    <h3 style={{ color: '#00f0ff', fontSize: '15px', marginBottom: '8px' }}>PRACTICAL MILESTONES ACHIEVED</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: '#00ff66', fontWeight: 'bold', marginRight: '6px' }}>[✓] ESP32-Wi-Fi Gesture Controller:</span>
                        Hand-telemetry processing loop running with under 45ms latency.
                      </div>
                      <div>
                        <span style={{ color: '#00ff66', fontWeight: 'bold', marginRight: '6px' }}>[✓] KUKA Trajectory Optimization:</span>
                        Engineered linear and joint-space paths, reducing cycle time bounds by 15%.
                      </div>
                      <div>
                        <span style={{ color: '#00ff66', fontWeight: 'bold', marginRight: '6px' }}>[✓] Real-Time Sonar Mapping:</span>
                        Calculated Serial-to-UI packet streaming for ultrasonic sweeps.
                      </div>
                      <div>
                        <span style={{ color: '#00ff66', fontWeight: 'bold', marginRight: '6px' }}>[✓] PID Microsecond Tuning:</span>
                        Coded traction-vector controls on high-speed line-following platforms.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'future' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                    <h3 style={{ color: '#00f0ff', fontSize: '15px', marginBottom: '6px' }}>VISION-LANGUAGE-ACTION SYSTEMS (VLA)</h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
                      Actively researching the integration of multi-modal Vision-Language Models (VLMs) with robotic actuators. Designing high-level task planning nodes that translate user natural language instructions into low-level kinematic joints movement sequences.
                    </p>
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                    <h3 style={{ color: '#00f0ff', fontSize: '15px', marginBottom: '6px' }}>FUTURE RESEARCH MODULES</h3>
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>• Deep Reinforcement Learning for bipedal balancing (Gazebo)</div>
                      <div>• ROS2 multi-robot fleet orchestration and collaborative mapping</div>
                      <div>• Real-time edge inference optimizations on NVIDIA Jetson</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Matrix Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ border: '1px solid rgba(0, 240, 255, 0.22)', padding: '16px', background: 'rgba(0, 240, 255, 0.03)', borderRadius: '6px', flex: '1' }}>
                <h3 style={{ color: '#00f0ff', fontSize: '15px', marginBottom: '8px' }}>CORE ENGINEERING SPEC</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>ROS2 / ROS</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>C++ / OOP</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>Python</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>MATLAB</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>RoboDK Sim</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>OpenCV</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>PID Loops</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>ESP32 Firmware</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>SolidWorks CAD</span>
                  <span className="spec-val-pill" style={{ fontSize: '11px', padding: '4px 8px' }}>Kinematics</span>
                </div>
              </div>
              <div style={{ border: '1px solid rgba(0, 255, 102, 0.2)', padding: '12px', background: 'rgba(0, 255, 102, 0.03)', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#00ff66', fontWeight: 'bold', letterSpacing: '0.05em' }}>SYSTEMS REPORT: READY FOR INTERNSHIP</span>
              </div>
            </div>

          </div>
        </div>
      </Html>
    </group>
  );
}

// ==========================================
// 9. Central Command Contact Terminal Station
// ==========================================
export function ContactTerminalStation({ position, rotation, handleContact, isActive }) {
  const [transmitting, setTransmitting] = useState(false);
  const [transProgress, setTransProgress] = useState(0);

  // Particle array for data transmission burst
  const [particles, setParticles] = useState([]);

  const triggerDataTransmission = () => {
    if (transmitting) return;
    setTransmitting(true);
    setTransProgress(0);
    audio.playDataTransmit();

    // Trigger floating green data particles shooting up!
    const newParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 2.8,
      y: 0.95,
      z: (Math.random() - 0.5) * 0.8,
      speedY: 1.5 + Math.random() * 2.5,
      opacity: 1.0
    }));
    setParticles(newParticles);

    // Run trigger call
    setTimeout(() => {
      handleContact();
    }, 1500);
  };

  // Animate the data transmission particles shooting up
  useFrame((state, delta) => {
    if (transmitting) {
      setTransProgress(prev => {
        if (prev >= 100) {
          setTransmitting(false);
          setParticles([]);
          return 100;
        }
        return prev + 1.2; // increment progress
      });

      // Animate particle coordinates
      setParticles(prev => 
        prev.map(p => {
          const nextY = p.y + p.speedY * delta;
          const nextOpacity = Math.max(0.0, 1.0 - (nextY - 0.95) / 3.5); // fade as they fly high
          return { ...p, y: nextY, opacity: nextOpacity };
        }).filter(p => p.opacity > 0.05)
      );
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Floating Hologram Title */}
      <Html position={[0, 2.3, 0]} center distanceFactor={1.5}>
        <div style={{
          color: 'var(--color-accent-green)',
          textShadow: 'var(--glow-shadow-green)',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          background: 'rgba(2, 3, 5, 0.8)',
          padding: '4px 12px',
          border: '1px solid var(--color-border-green)',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          <i className="fa-solid fa-satellite-dish" style={{ marginRight: '6px' }}></i> CENTRAL_COMMAND_DECK
        </div>
      </Html>

      {/* Desk Command Mesh Pedestal */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.1, 1.4]} />
        <meshStandardMaterial color="#0c0e14" roughness={0.7} metalness={0.8} />
      </mesh>
      
      {/* Support desk columns */}
      <mesh position={[-1.2, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#07090d" />
      </mesh>
      <mesh position={[1.2, 0.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.9, 0.8]} />
        <meshStandardMaterial color="#07090d" />
      </mesh>

      {/* Desk Table top */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#141822" roughness={0.4} metalness={0.9} />
      </mesh>

      {/* Central Double-Wide Display Screen */}
      <group position={[0, 0.95, -0.2]}>
        {/* Support arm */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.1]} />
          <meshStandardMaterial color="#07090d" />
        </mesh>
        
        {/* Frame panel */}
        <mesh position={[0, 0.7, 0.05]} castShadow>
          <boxGeometry args={[3.0, 1.2, 0.1]} />
          <meshStandardMaterial color="#1b1e26" roughness={0.5} metalness={0.7} />
        </mesh>

        {/* Screen basic Plane */}
        <mesh position={[0, 0.7, 0.11]}>
          <planeGeometry args={[2.9, 1.1]} />
          <meshBasicMaterial color="#030406" />
        </mesh>

        {/* Drei HTML interactive overlay representing terminal screen */}
        <Html
          transform
          distanceFactor={1.3}
          position={[0, 0.7, 0.118]}
          rotation={[0, 0, 0]}
        >
          <div style={{
            width: '800px',
            height: '340px',
            border: '3px solid #00ff66',
            boxShadow: 'inset 0 0 30px rgba(0,255,102,0.2), 0 0 20px rgba(0,255,102,0.2)',
            background: '#040608',
            fontFamily: "'Share Tech Mono', monospace",
            color: '#e2e8f0',
            padding: '20px',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}>
            {/* Scanline CRT overlay */}
            <div className="crt-inner-overlay"></div>

            <div style={{ display: 'flex', justifyBounding: 'space-between', borderBottom: '1px solid rgba(0, 255, 102, 0.2)', paddingBottom: '6px', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#00ff66', fontWeight: 'bold' }}>THWS_COMMAND_TERMINAL // DUAL_CORE_SECURE</span>
              <span style={{ fontSize: '11px', color: '#00ff66' }}>SYS_OPERATOR: HET_PRAJAPATI</span>
            </div>

            <div style={{ display: 'flex', gap: '24px', margin: '12px 0', flex: '1' }}>
              {/* Profile card details */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.05em' }}>HET PRAJAPATI</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Robotics Engineering Student @ THWS Schweinfurt</div>
                
                <div><strong>FOCUS:</strong> Autonomous Kinematics / ROS2 Navigation</div>
                <div><strong>LOCATION:</strong> Schweinfurt, Germany</div>
                <div><strong>STATUS:</strong> Open for Internship / Working Student placement</div>
              </div>

              {/* Action buttons and links */}
              <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                
                {/* Send/Transmit Button */}
                <button 
                  onClick={triggerDataTransmission}
                  disabled={transmitting}
                  style={{
                    background: transmitting ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 255, 102, 0.1)',
                    border: transmitting ? '1px solid #ffaa00' : '1px solid #00ff66',
                    borderRadius: '4px',
                    padding: '10px',
                    color: transmitting ? '#ffaa00' : '#00ff66',
                    fontWeight: 'bold',
                    fontSize: '11.5px',
                    cursor: transmitting ? 'default' : 'pointer',
                    boxShadow: '0 0 10px rgba(0, 255, 102, 0.2)',
                    transition: 'all 0.25s ease',
                    textShadow: transmitting ? '0 0 5px #ffaa00' : '0 0 5px #00ff66',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <i className={`fa-solid ${transmitting ? 'fa-satellite' : 'fa-envelope'} ${transmitting ? 'fa-spin' : ''}`}></i> 
                  {transmitting ? `TRANSMITTING DATA [${Math.floor(transProgress)}%]` : 'CONTACT OPERATOR'}
                </button>

                {/* Social links */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => audio.playUiClick()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--color-text-secondary)',
                      padding: '6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <i className="fa-brands fa-linkedin"></i> LINKEDIN
                  </a>
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => audio.playUiClick()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--color-text-secondary)',
                      padding: '6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <i className="fa-brands fa-github"></i> GITHUB
                  </a>
                </div>
                
                {/* Resume download */}
                <a 
                  href="/resume.pdf" 
                  download
                  onClick={() => audio.playDataTransmit()}
                  style={{
                    background: 'rgba(0, 240, 255, 0.05)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: '#00f0ff',
                    padding: '6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 8px rgba(0,240,255,0.15)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0, 240, 255, 0.12)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(0, 240, 255, 0.05)'}
                >
                  <i className="fa-solid fa-file-pdf"></i> DOWNLOAD RESUME
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span>hprajapati1094@gmail.com</span>
              <span style={{ color: 'var(--color-accent-amber)', textShadow: '0 0 4px rgba(255,170,0,0.3)' }}>COMMS TERMINAL // TRANSLINK STABLE</span>
            </div>
          </div>
        </Html>
      </group>

      {/* Floating 3D Data Transmission Particles */}
      {particles.map(p => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshBasicMaterial color="#00ff66" transparent opacity={p.opacity} />
        </mesh>
      ))}
    </group>
  );
}
