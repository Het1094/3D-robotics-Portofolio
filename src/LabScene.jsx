import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import {
  VineyardBay,
  IndustrialBay,
  EmbeddedBay,
  MLBay,
  AchievementWall,
  ContactTerminalStation,
  AICoreSkills,
  HolographicAI
} from './components/LabBays';

// Keyboard walking controls tracker hook
function useKeyboardControls() {
  const keys = useRef({
    KeyW: false, KeyS: false, KeyA: false, KeyD: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code in keys.current) {
        keys.current[e.code] = true;
      }
    };
    const handleKeyUp = (e) => {
      if (e.code in keys.current) {
        keys.current[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
}

// Camera controller component
function CameraController({ 
  cameraOverride, 
  onCameraChange, 
  activeBay, 
  setActiveBay,
  loadingState,
  onCinematicComplete
}) {
  const { camera } = useThree();
  const keysRef = useKeyboardControls();
  
  // Camera coordinate state inside world
  const camPosRef = useRef(new THREE.Vector3(0, 1.8, 14)); // Start outside
  const targetLookRef = useRef(new THREE.Vector3(0, 1.6, 0));
  
  // Camera rotation yaw/pitch (in radians)
  const yawRef = useRef(0.0); // side-to-side
  const pitchRef = useRef(-0.1); // up-down

  // Is camera currently locked to a bay glide animation?
  const [isLerping, setIsLerping] = useState(false);
  const targetOverridePos = useRef(new THREE.Vector3());
  const targetOverrideLook = useRef(new THREE.Vector3());
  const lastOverrideTrigger = useRef(-1);

  // Drag to look state
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  // Cinematic GSAP timeline trigger
  const cinematicStarted = useRef(false);

  useEffect(() => {
    if (loadingState === 'entering' && !cinematicStarted.current) {
      cinematicStarted.current = true;
      
      // Reset position to outside doors
      camPosRef.current.set(0, 1.8, 14);
      targetLookRef.current.set(0, 1.6, 0);

      const timeline = gsap.timeline({
        onComplete: () => {
          onCinematicComplete(); // hand control to user, set to 'entered'
        }
      });

      // Fly-in Stage 1: Move to door threshold (Z = 14 to Z = 8.8)
      timeline.to(camPosRef.current, {
        x: 0,
        y: 1.6,
        z: 8.8,
        duration: 2.2,
        ease: 'power1.in'
      });

      // Fly-in Stage 2: Pass through doors and sweep left (Z = 8.8 to Z = 5.2, X = -1.8)
      timeline.to(camPosRef.current, {
        x: -1.8,
        y: 1.6,
        z: 5.2,
        duration: 1.8,
        ease: 'power1.out'
      });

      // Fly-in Stage 3: Curve back to center starting position (X = -1.8 to X = 0, Z = 6.5)
      timeline.to(camPosRef.current, {
        x: 0,
        y: 1.6,
        z: 6.5,
        duration: 2.0,
        ease: 'power2.out'
      });

      // Parallel Look Target Animation (Creating a sweeping look effect)
      const lookTimeline = gsap.timeline();
      
      // Look straight ahead at first
      lookTimeline.to(targetLookRef.current, {
        x: 0,
        y: 1.5,
        z: 0,
        duration: 2.2,
        ease: 'power1.in'
      });

      // Turn head slightly left-down to inspect embedded systems/floor
      lookTimeline.to(targetLookRef.current, {
        x: -3.5,
        y: 1.25,
        z: -1.5,
        duration: 1.8,
        ease: 'power1.out'
      });

      // Turn head back to look at the central command station
      lookTimeline.to(targetLookRef.current, {
        x: 0,
        y: 1.5,
        z: 0,
        duration: 2.0,
        ease: 'power2.out'
      });
    }
  }, [loadingState, onCinematicComplete]);

  useEffect(() => {
    // Setup mouse drag listener for look around
    const handleMouseDown = (e) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e) => {
      if (!isDragging.current || isLerping || loadingState === 'entering') return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      prevMouse.current = { x: e.clientX, y: e.clientY };

      yawRef.current -= dx * 0.003;
      pitchRef.current = Math.max(-0.6, Math.min(0.6, pitchRef.current - dy * 0.003));
      
      // Release manual bay lock if looking around
      if (activeBay !== 'walking') {
        setActiveBay('walking');
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isLerping, activeBay, loadingState]);

  useFrame((state, delta) => {
    // 1. Cinematic bypass
    if (loadingState === 'entering') {
      camera.position.copy(camPosRef.current);
      camera.lookAt(targetLookRef.current);
      
      // Sync yaw/pitch refs so there is no snap when cinematic ends
      const lookVector = targetLookRef.current.clone().sub(camPosRef.current).normalize();
      yawRef.current = Math.atan2(-lookVector.x, -lookVector.z);
      pitchRef.current = Math.asin(lookVector.y);

      onCameraChange(camPosRef.current.x, camPosRef.current.z);
      return;
    }

    // Lock camera if loading has not started or is ready
    if (loadingState !== 'entered') {
      camera.position.set(0, 1.8, 14);
      camera.lookAt(0, 1.6, 0);
      return;
    }

    const keys = keysRef.current;
    
    // Check if a new camera navigation override was triggered by the HUD
    if (cameraOverride.trigger !== lastOverrideTrigger.current) {
      lastOverrideTrigger.current = cameraOverride.trigger;
      targetOverridePos.current.fromArray(cameraOverride.pos);
      targetOverrideLook.current.fromArray(cameraOverride.target);
      setIsLerping(true);
    }

    if (isLerping) {
      // Smoothly slide/interpolate position & target
      camPosRef.current.lerp(targetOverridePos.current, 0.08);
      targetLookRef.current.lerp(targetOverrideLook.current, 0.08);

      camera.position.copy(camPosRef.current);
      camera.lookAt(targetLookRef.current);

      // Extract yaw/pitch back from rotation matrix to sync mouse looks
      const lookVector = targetLookRef.current.clone().sub(camPosRef.current).normalize();
      yawRef.current = Math.atan2(-lookVector.x, -lookVector.z);
      pitchRef.current = Math.asin(lookVector.y);

      onCameraChange(camPosRef.current.x, camPosRef.current.z);

      // Break lerp lock if target reached
      const dist = camPosRef.current.distanceTo(targetOverridePos.current);
      if (dist < 0.05) {
        setIsLerping(false);
      }
      
      // Interrupt lerp on keyboard input
      if (keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || 
          keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
        setIsLerping(false);
        setActiveBay('walking');
      }
      return;
    }

    // Walking movement logic
    const speed = 3.5 * delta; // units per second
    const rotateSpeed = 1.6 * delta; // radians per second
    
    let moved = false;
    
    // Rotation turns (yaw)
    if (keys.KeyA || keys.ArrowLeft) {
      yawRef.current += rotateSpeed;
      moved = true;
    }
    if (keys.KeyD || keys.ArrowRight) {
      yawRef.current -= rotateSpeed;
      moved = true;
    }

    // Walking translations
    const directionX = Math.sin(yawRef.current);
    const directionZ = Math.cos(yawRef.current);

    if (keys.KeyW || keys.ArrowUp) {
      camPosRef.current.x -= directionX * speed;
      camPosRef.current.z -= directionZ * speed;
      moved = true;
    }
    if (keys.KeyS || keys.ArrowDown) {
      camPosRef.current.x += directionX * speed;
      camPosRef.current.z += directionZ * speed;
      moved = true;
    }

    if (moved) {
      // Room boundaries collision check (keep inside the laboratory walls)
      camPosRef.current.x = Math.max(-8.5, Math.min(8.5, camPosRef.current.x));
      camPosRef.current.z = Math.max(-8.8, Math.min(8.2, camPosRef.current.z)); // Keep inside doors
      
      if (activeBay !== 'walking') {
        setActiveBay('walking');
      }
    }

    // Apply look yaw/pitch vector math
    const lookX = Math.sin(yawRef.current) * Math.cos(pitchRef.current);
    const lookY = Math.sin(pitchRef.current);
    const lookZ = Math.cos(yawRef.current) * Math.cos(pitchRef.current);

    targetLookRef.current.set(
      camPosRef.current.x - lookX,
      camPosRef.current.y + lookY,
      camPosRef.current.z - lookZ
    );

    camera.position.copy(camPosRef.current);
    camera.lookAt(targetLookRef.current);

    onCameraChange(camPosRef.current.x, camPosRef.current.z);
  });

  return null;
}

// 3D Pneumatic Laboratory Entrance Doors
function LabDoors({ loadingState }) {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const opened = useRef(false);

  useFrame((state, delta) => {
    if ((loadingState === 'entering' || loadingState === 'entered') && !opened.current) {
      // Slide open: left moves from -1.2 to -3.5, right moves from 1.2 to 3.5
      let done = true;
      if (leftDoorRef.current && leftDoorRef.current.position.x > -3.5) {
        leftDoorRef.current.position.x -= 1.4 * delta;
        done = false;
      }
      if (rightDoorRef.current && rightDoorRef.current.position.x < 3.5) {
        rightDoorRef.current.position.x += 1.4 * delta;
        done = false;
      }
      if (done) {
        opened.current = true;
      }
    }
  });

  return (
    <group position={[0, 0, 8.8]}>
      {/* Heavy metal door frame */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[4.8, 2.8, 0.2]} />
        <meshStandardMaterial color="#0b0d12" roughness={0.6} metalness={0.9} transparent opacity={0.3} wireframe />
      </mesh>
      
      {/* Glowing neon entrance portal border */}
      <mesh position={[-2.3, 1.3, 0.05]}>
        <boxGeometry args={[0.08, 2.6, 0.05]} />
        <meshBasicMaterial color="#00ff66" />
      </mesh>
      <mesh position={[2.3, 1.3, 0.05]}>
        <boxGeometry args={[0.08, 2.6, 0.05]} />
        <meshBasicMaterial color="#00ff66" />
      </mesh>
      <mesh position={[0, 2.6, 0.05]}>
        <boxGeometry args={[4.6, 0.08, 0.05]} />
        <meshBasicMaterial color="#00ff66" />
      </mesh>

      {/* Left door panel */}
      <mesh ref={leftDoorRef} position={[-1.15, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 2.6, 0.1]} />
        <meshStandardMaterial color="#141923" roughness={0.3} metalness={0.8} />
        {/* Sci-Fi glowing border indicator */}
        <mesh position={[1.12, 0, 0.052]}>
          <planeGeometry args={[0.04, 2.6]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
      </mesh>

      {/* Right door panel */}
      <mesh ref={rightDoorRef} position={[1.15, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 2.6, 0.1]} />
        <meshStandardMaterial color="#141923" roughness={0.3} metalness={0.8} />
        {/* Sci-Fi glowing border indicator */}
        <mesh position={[-1.12, 0, 0.052]}>
          <planeGeometry args={[0.04, 2.6]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
      </mesh>
    </group>
  );
}

// High-performance Volumetric Light Cone
function VolumetricCone({ position, rotation, color = '#00f0ff', opacity = 0.08 }) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.05, 1.4, 5.0, 16, 1, true]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Drifting Ambient Dust Particles
function DustParticles({ count = 150 }) {
  const pointsRef = useRef();
  
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;     // X
      arr[i * 3 + 1] = Math.random() * 5.0;         // Y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 18;  // Z
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      const t = state.clock.getElapsedTime();
      // Drift particles slowly in a continuous wave
      pointsRef.current.rotation.y = t * 0.015;
      pointsRef.current.rotation.x = t * 0.008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#00f0ff" 
        size={0.035} 
        sizeAttenuation 
        transparent 
        opacity={0.25} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Futuristic City Skyline Outside Windows
function FuturisticCity() {
  const trafficRef = useRef();
  
  // Animate flying hover-cars
  useFrame((state) => {
    if (trafficRef.current) {
      const t = state.clock.getElapsedTime();
      trafficRef.current.position.x = Math.sin(t * 0.4) * 4.0;
    }
  });

  return (
    <group position={[0, 0, -18]}>
      {/* Starry Night skybox backdrop */}
      <mesh position={[0, 6, -10]}>
        <planeGeometry args={[50, 25]} />
        <meshBasicMaterial color="#010204" />
      </mesh>

      {/* Nebula/Sunset ambient sky glow */}
      <mesh position={[0, 1.5, -9.8]}>
        <planeGeometry args={[45, 12]} />
        <meshBasicMaterial color="#020e1d" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Sunset horizon line glow */}
      <mesh position={[0, -1.0, -9.6]}>
        <planeGeometry args={[45, 4]} />
        <meshBasicMaterial color="#9d4edd" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Star points */}
      <points>
        <sphereGeometry args={[15, 16, 16]} />
        <pointsMaterial color="#ffffff" size={0.02} transparent opacity={0.6} />
      </points>

      {/* Silhouette Cyber-Skyscrapers in distance */}
      {/* Building Left 1 */}
      <mesh position={[-9, 2.5, -4]} castShadow>
        <boxGeometry args={[2.5, 9, 2.5]} />
        <meshStandardMaterial color="#04060b" roughness={0.9} metalness={0.9} />
        {/* Neon building antenna */}
        <mesh position={[0, 4.6, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2]} />
          <meshBasicMaterial color="#ffaa00" />
        </mesh>
      </mesh>

      {/* Building Center (Mega tower) */}
      <mesh position={[4, 4.0, -6]} castShadow>
        <boxGeometry args={[3.5, 13, 3.5]} />
        <meshStandardMaterial color="#030509" roughness={0.9} metalness={0.9} />
        <mesh position={[0, 6.6, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.8]} />
          <meshBasicMaterial color="#00ff66" />
        </mesh>
      </mesh>

      {/* Building Right 1 */}
      <mesh position={[10, 2.0, -3]} castShadow>
        <boxGeometry args={[2.0, 7, 2.0]} />
        <meshStandardMaterial color="#04060c" roughness={0.9} metalness={0.9} />
      </mesh>

      {/* Flying Hover-car light trails */}
      <group ref={trafficRef}>
        {/* Car Trail 1 (Cyan) */}
        <mesh position={[-6, 2.8, -2]}>
          <boxGeometry args={[1.5, 0.04, 0.04]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        {/* Car Trail 2 (Purple) */}
        <mesh position={[2, 4.2, -4]}>
          <boxGeometry args={[1.2, 0.04, 0.04]} />
          <meshBasicMaterial color="#9d4edd" />
        </mesh>
      </group>
    </group>
  );
}

export default function LabScene({
  cameraOverride,
  activeBay,
  setActiveBay,
  onCameraChange,
  openProjectDetails,
  handleContactOperator,
  loadingState,
  onCinematicComplete
}) {
  return (
    <>
      {/* Dynamic Camera Control node */}
      <CameraController 
        cameraOverride={cameraOverride}
        activeBay={activeBay}
        setActiveBay={setActiveBay}
        onCameraChange={onCameraChange}
        loadingState={loadingState}
        onCinematicComplete={onCinematicComplete}
      />

      {/* Futuristic Volumetric Fog */}
      <fogExp2 attach="fog" color="#030508" density={0.032} />

      {/* Lighting System */}
      <ambientLight intensity={0.25} />
      <directionalLight 
        position={[5, 12, 5]} 
        intensity={0.4} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* Volumetric Spotlights and Light Mesh helper cones */}
      {/* 1. Vineyard Bay Spotlight (Cyan) */}
      <spotLight 
        position={[-7.5, 5, -5.5]} 
        angle={0.45} 
        penumbra={0.8} 
        intensity={3.5} 
        color="#00f0ff" 
        castShadow 
      />
      <VolumetricCone position={[-7.5, 2.5, -5.5]} color="#00f0ff" opacity={0.08} />

      {/* 2. Industrial Robot Spotlight (Purple) */}
      <spotLight 
        position={[7.5, 5, -5.5]} 
        angle={0.45} 
        penumbra={0.8} 
        intensity={3.5} 
        color="#9d4edd" 
        castShadow 
      />
      <VolumetricCone position={[7.5, 2.5, -5.5]} color="#9d4edd" opacity={0.08} />

      {/* 3. Embedded Systems Spotlight (Green) */}
      <spotLight 
        position={[-7.5, 5, 0.4]} 
        angle={0.55} 
        penumbra={0.8} 
        intensity={2.8} 
        color="#00ff66" 
        castShadow 
      />
      <VolumetricCone position={[-7.5, 2.5, 0.4]} color="#00ff66" opacity={0.06} />

      {/* 4. Machine Learning Spotlight (Cyan) */}
      <spotLight 
        position={[7.5, 5, 0.4]} 
        angle={0.55} 
        penumbra={0.8} 
        intensity={2.8} 
        color="#00f0ff" 
        castShadow 
      />
      <VolumetricCone position={[7.5, 2.5, 0.4]} color="#00f0ff" opacity={0.06} />

      {/* 5. Central Command Spotlight (White) */}
      <spotLight 
        position={[0, 5, 0.2]} 
        angle={0.48} 
        penumbra={0.8} 
        intensity={4.0} 
        color="#ffffff" 
        castShadow 
      />
      <VolumetricCone position={[0, 2.5, 0.2]} color="#ffffff" opacity={0.07} />

      {/* Ambient Drifting Dust Field */}
      <DustParticles count={200} />

      {/* Futuristic Infinite Grid Helper */}
      <Grid 
        position={[0, 0, 0]}
        infiniteGrid 
        cellSize={1.0} 
        sectionSize={5.0} 
        fadeDistance={22} 
        cellColor="#00f0ff" 
        sectionColor="#00ff66" 
        cellThickness={0.4} 
        sectionThickness={0.8} 
      />

      {/* Laboratory Walls Mesh Enclosure (With Large Glass Windows) */}
      <group position={[0, 0, 0]}>
        {/* Polished Shiny Reflective Floor Panel */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial 
            color="#06090f" 
            roughness={0.16} // High gloss for beautiful blurry reflections
            metalness={0.92} // Metallic sheen
          />
        </mesh>

        {/* Back Wall with Large Window Cutout */}
        {/* Solid Wall Left */}
        <mesh position={[-6.5, 2.5, -9]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color="#040508" roughness={0.8} metalness={0.6} />
        </mesh>
        {/* Solid Wall Right */}
        <mesh position={[6.5, 2.5, -9]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color="#040508" roughness={0.8} metalness={0.6} />
        </mesh>
        {/* Solid Wall Top Header */}
        <mesh position={[0, 4.5, -9]} receiveShadow>
          <planeGeometry args={[8, 1]} />
          <meshStandardMaterial color="#040508" roughness={0.8} metalness={0.6} />
        </mesh>
        
        {/* Large Glass Window Panel */}
        <mesh position={[0, 2.0, -9]} transparent>
          <planeGeometry args={[8, 4]} />
          <meshStandardMaterial 
            color="#00f0ff" 
            roughness={0.1} 
            metalness={0.9} 
            transparent 
            opacity={0.18} // Glass shine overlay
          />
        </mesh>

        {/* Left wall panel */}
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-9, 2.5, 0]} receiveShadow>
          <planeGeometry args={[18, 5]} />
          <meshStandardMaterial color="#030406" roughness={0.8} metalness={0.6} />
        </mesh>

        {/* Right wall panel */}
        <mesh rotation={[0, -Math.PI / 2, 0]} position={[9, 2.5, 0]} receiveShadow>
          <planeGeometry args={[18, 5]} />
          <meshStandardMaterial color="#030406" roughness={0.8} metalness={0.6} />
        </mesh>
        
        {/* Neon blue floor accent grid */}
        <gridHelper args={[18, 18, '#00f0ff', '#00f0ff']} position={[0, 0.01, 0]} />
      </group>

      {/* Background Cyber-City rendering behind back window */}
      <FuturisticCity />

      {/* Sliding Lab entrance doors */}
      <LabDoors loadingState={loadingState} />

      {/* Physical Station Models inside the scene */}
      <group>
        {/* 1. ROS2 Vineyard Navigation Bay */}
        <VineyardBay 
          position={[-7.5, 0, -5.5]} 
          rotation={[0, Math.PI / 4, 0]} 
          openProject={openProjectDetails} 
          isActive={activeBay === 'vineyard' || loadingState === 'entering'}
        />

        {/* 2. Industrial Robotics Manipulator Bay */}
        <IndustrialBay 
          position={[7.5, 0, -5.5]} 
          rotation={[0, -Math.PI / 4, 0]} 
          openProject={openProjectDetails}
          isActive={activeBay === 'industrial' || loadingState === 'entering'}
        />

        {/* 3. Embedded Systems Bay (Gesture Car, Radar, Line Follower) */}
        <EmbeddedBay 
          position={[-7.8, 0, 0.4]} 
          rotation={[0, Math.PI / 2, 0]} 
          openProject={openProjectDetails}
          activeBay={activeBay}
        />

        {/* 4. Machine Learning Bay (Skeleton + training nodes) */}
        <MLBay 
          position={[7.8, 0, 0.4]} 
          rotation={[0, -Math.PI / 2, 0]}
          isActive={activeBay === 'ml' || loadingState === 'entering'}
        />

        {/* 5. Achievement Wall */}
        <AchievementWall 
          position={[0, 0, -8.6]} 
          rotation={[0, 0, 0]}
          isActive={activeBay === 'achievements' || loadingState === 'entering'}
        />

        {/* 6. Central Command Contact Terminal Station */}
        <ContactTerminalStation 
          position={[0, 0, 0.2]} 
          rotation={[0, 0, 0]} 
          handleContact={handleContactOperator}
          isActive={activeBay === 'contact' || loadingState === 'entering'}
        />

        {/* 7. Skills AI Core */}
        <AICoreSkills 
          position={[-3.2, 0, -2.2]} 
          rotation={[0, Math.PI / 6, 0]}
          isActive={activeBay === 'walking' || loadingState === 'entering'}
        />

        {/* 8. Holographic AI Assistant */}
        <HolographicAI 
          position={[3.2, 0, -2.2]} 
          rotation={[0, -Math.PI / 6, 0]}
          isActive={activeBay === 'walking' || loadingState === 'entering'}
        />
      </group>

      {/* Cinematic Post-Processing Shader Effects */}
      <EffectComposer>
        <Bloom 
          intensity={0.35} 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
        />
        <Vignette eskil={false} offset={0.15} darkness={1.15} />
      </EffectComposer>
    </>
  );
}
