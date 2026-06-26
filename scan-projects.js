import fs from 'fs';
import path from 'path';

const PORTFOLIO_DIR = '/Users/hetprajapati/Portfolio';
const SCRATCH_DIR = '/Users/hetprajapati/.gemini/antigravity/scratch/portfolio-website';
const PUBLIC_DIR = path.join(SCRATCH_DIR, 'public');
const SRC_DIR = path.join(SCRATCH_DIR, 'src');
const SYMLINK_PATH = path.join(PUBLIC_DIR, 'portfolio_projects');
const DATA_FILE_PATH = path.join(SRC_DIR, 'projects-data.json');

// Ensure directories exist
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
if (!fs.existsSync(SRC_DIR)) {
  fs.mkdirSync(SRC_DIR, { recursive: true });
}

// Ensure symlink exists
try {
  let createLink = true;
  if (fs.existsSync(SYMLINK_PATH)) {
    const lstats = fs.lstatSync(SYMLINK_PATH);
    if (lstats.isSymbolicLink()) {
      createLink = false;
      console.log('Symlink already exists.');
    } else {
      fs.rmSync(SYMLINK_PATH, { recursive: true, force: true });
    }
  }
  if (createLink) {
    fs.symlinkSync(PORTFOLIO_DIR, SYMLINK_PATH, 'dir');
    console.log('Created symlink pointing to Portfolio.');
  }
} catch (err) {
  console.error('Error handling symlink:', err.message);
}

// Precise project names configuration
const PROJECT_META = {
  gesture_car: {
    title: 'Gesture Controlled Car',
    subtitle: 'Station 01 // Interactive Control Link',
    description: 'A human-robot interface deck streaming hand tracking telemetry via computer vision. Hand landmarks are analyzed in real-time, mapping coordinates to drive signals transmitted wirelessly (Bluetooth/Wi-Fi) to an ESP32 microcontroller, driving differential steering motors.',
    techStack: ['Python', 'MediaPipe', 'OpenCV', 'ESP32 / Arduino', 'C++', 'Kinematics', 'Wi-Fi Socket Client'],
    role: 'Station Operations Engineer',
    highlights: [
      'Engineered hand-landmark tracking node with less than 45ms loop latency.',
      'Designed a UDP packet streaming protocol for wireless motion coordination.',
      'Calculated differential drive motor kinematics for vector-based translations.',
      'Calibrated speed-attenuation logic relative to physical hand depth metrics.'
    ]
  },
  kuka: {
    title: 'KUKA Robotics Simulation',
    subtitle: 'Station 02 // Manipulator Control Bay',
    description: 'Simulation and trajectory planning deck for heavy industrial robotic arms. This station operates path generation algorithms, inverse kinematics solvers, and automation loops designed to minimize cycle times while avoiding layout-defined obstacles.',
    techStack: ['RoboDK', 'KUKA Robot Language (KRL)', 'Inverse Kinematics', 'Path Planning', 'Python API', '3D CAD Modeling'],
    role: 'Kinematics Simulation Lead',
    highlights: [
      'Synthesized multi-point industrial routines in joint-space (PTP) and linear-space (LIN).',
      'Configured RoboDK environment with collision-detection nodes.',
      'Programmed Python interface API to pass coordinates dynamically to the manipulator arm.',
      'Reduced pathway cycle-time bounds by 15% through trajectory optimization.'
    ]
  },
  line_follower: {
    title: 'Line Follower Robot',
    subtitle: 'Station 03 // Transit Dynamics Deck',
    description: 'Calibration deck for high-speed tracking vehicles. Features an embedded system processing multiple analog IR sensor values, feeding a high-frequency PID control loop. The vehicle maintains center-line tracking at maximum speeds through acute curves.',
    techStack: ['Arduino / C++', 'QTR-8A IR Sensor Array', 'PID Feedback Control', 'PWM Motor Control', 'Differential Drive Kinematics'],
    role: 'Control Systems Operator',
    highlights: [
      'Designed high-frequency proportional-integral-derivative (PID) feedback algorithms.',
      'Built automatic IR emitter calibration scripts to normalize ambient light offsets.',
      'Coded traction-vector controls to counter centrifugal force on sharp curves.',
      'Tested stable tracking speeds of up to 1.5 meters per second.'
    ]
  },
  radar_system: {
    title: 'Ultrasonic Radar System',
    subtitle: 'Station 04 // Scanning Radar Terminal',
    description: 'A surveillance and telemetry console. An ultrasonic distance sensor rotates on a micro-servo axis, logging distance readings every degree. Data is packetized, sent over serial, and visualized in real-time on a retro radar terminal mockup.',
    techStack: ['Arduino / C++', 'Processing IDE', 'Servo Control', 'Ultrasonic Sensors', 'Serial Data Streaming'],
    role: 'Interface & Hardware Lead',
    highlights: [
      'Designed coordinate packet structure for Serial-to-UI data transmission.',
      'Developed a retro, vector-styled green CRT scanning visualizer in Processing.',
      'Implemented rolling median filters in Arduino C++ to eliminate measurement spikes.',
      'Integrated threshold alarm logic to trigger audible/visual alerts on coordinate breach.'
    ]
  },
  vinebot: {
    title: 'ROS2 Vineyard Robot',
    subtitle: 'Station 05 // Field Rover Diagnostic Bay',
    description: 'Agricultural field rover concept designed for autonomous navigation and field diagnostics. Operates layout-based mapping and localization scripts, using sensor fusion models to plan path navigation through narrow agricultural corridors.',
    techStack: ['ROS2 (Robot Operating System)', 'Python', 'GPS / RTK Navigation', 'LiDAR Sensor Fusion', 'SLAM (Gmapping)', 'OpenCV'],
    role: 'Autonomous Systems Designer',
    highlights: [
      'Drafted modular ROS2 nodes structure separating navigation, localization, and imaging.',
      'Simulated SLAM grid mapping in Gazebo virtual vineyard environments.',
      'Optimized path planning heuristics for tight-turning, narrow crop rows.',
      'Calculated power draw configurations for solar-assisted batteries.'
    ]
  }
};

// Scan the Portfolio directory
console.log(`Scanning portfolio directory: ${PORTFOLIO_DIR}`);
const folders = fs.readdirSync(PORTFOLIO_DIR);
const projects = [];

folders.forEach(folderName => {
  const fullPath = path.join(PORTFOLIO_DIR, folderName);
  const stats = fs.statSync(fullPath);
  
  if (stats.isDirectory()) {
    const cleanId = folderName.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Look for video file
    let videoFile = null;
    try {
      const files = fs.readdirSync(fullPath);
      videoFile = files.find(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.mov', '.avi', '.mkv'].includes(ext);
      });
    } catch (e) {
      console.warn(`Error reading folder ${folderName}:`, e.message);
    }
    
    // Get metadata template or generate generic fallback
    const meta = PROJECT_META[cleanId] || {
      title: folderName.trim().replace(/_/g, ' '),
      subtitle: 'Robotics Station Module',
      description: 'A robotics project developed by Het Prajapati during his Robotics Engineering studies at THWS.',
      techStack: ['Robotics', 'C++', 'Arduino'],
      role: 'Robotics Engineering Student',
      highlights: ['Demonstrates key mechanical and electrical design concepts.', 'Implemented firmware using C++ / Arduino.']
    };
    
    const videoUrl = videoFile 
      ? `/portfolio_projects/${encodeURIComponent(folderName)}/${encodeURIComponent(videoFile)}` 
      : null;
      
    projects.push({
      id: cleanId,
      folderName: folderName,
      title: meta.title,
      subtitle: meta.subtitle,
      description: meta.description,
      techStack: meta.techStack,
      role: meta.role,
      highlights: meta.highlights,
      videoFile: videoFile,
      videoUrl: videoUrl
    });
  }
});

// Sort projects
projects.sort((a, b) => a.id.localeCompare(b.id));

// Write output JSON
fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(projects, null, 2), 'utf-8');
console.log(`Successfully generated projects data file at ${DATA_FILE_PATH}`);
console.log(`Scanned ${projects.length} projects.`);
