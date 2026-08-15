import * as THREE from 'three';
import { SampleModel } from '../types';

export const SAMPLE_MODELS: SampleModel[] = [
  {
    id: 'damaged-helmet',
    name: 'Battle-Tested Combat Helmet',
    category: 'Hard Surface / PBR',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    format: 'glb',
    author: 'Khronos Group',
    scale: 1.0,
  },
  {
    id: 'robot-expressive',
    name: 'Animated Mech Bot',
    category: 'Character / Rigged',
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    format: 'glb',
    author: 'Three.js Examples',
    scale: 0.8,
  },
  {
    id: 'boombox',
    name: 'Vintage Audio Boombox',
    category: 'Prop / Textures',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    format: 'glb',
    author: 'Khronos Group',
    scale: 25.0,
  },
  {
    id: 'procedural-cyber-drone',
    name: 'Orbital Recon Drone (Procedural)',
    category: 'Sci-Fi Vehicle',
    url: 'procedural:cyber-drone',
    format: 'glb',
    author: 'Built-in Engine',
    scale: 1.0,
  },
  {
    id: 'procedural-mecha-core',
    name: 'Quantum Reactor Core (Procedural)',
    category: 'Complex Sci-Fi Assembly',
    url: 'procedural:mecha-core',
    format: 'glb',
    author: 'Built-in Engine',
    scale: 1.0,
  },
];

/**
 * Creates an intricate procedural sci-fi drone 3D object
 * with multiple nested parts, emissive accents, metallic panels,
 * and high polygon density for material inspection.
 */
export function createProceduralDrone(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural_Cyber_Drone';

  // Hull Main Body
  const bodyGeo = new THREE.SphereGeometry(1.2, 32, 24);
  bodyGeo.scale(1.2, 0.65, 1.6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1f2430,
    metalness: 0.85,
    roughness: 0.25,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Cockpit / Sensor Glass
  const canopyGeo = new THREE.SphereGeometry(0.7, 32, 16);
  canopyGeo.scale(0.8, 0.4, 1.1);
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x00d4ff,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.8,
    thickness: 0.5,
    emissive: 0x004466,
    emissiveIntensity: 0.4,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.35, 0.3);
  group.add(canopy);

  // Wing Rotors (4 Quad Wings)
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x333b4d,
    metalness: 0.9,
    roughness: 0.35,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x0f131a,
    metalness: 0.95,
    roughness: 0.15,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
  });

  const wingPositions = [
    { x: 1.6, y: 0.1, z: 1.1, rotY: 0.3 },
    { x: -1.6, y: 0.1, z: 1.1, rotY: -0.3 },
    { x: 1.9, y: 0.2, z: -1.2, rotY: -0.2 },
    { x: -1.9, y: 0.2, z: -1.2, rotY: 0.2 },
  ];

  wingPositions.forEach((pos) => {
    // Strut
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 16);
    strutGeo.rotateZ(pos.x > 0 ? -Math.PI / 3 : Math.PI / 3);
    const strut = new THREE.Mesh(strutGeo, wingMat);
    strut.position.set(pos.x * 0.5, pos.y, pos.z * 0.5);
    strut.castShadow = true;
    group.add(strut);

    // Engine Nacelle
    const nacelleGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 24);
    const nacelle = new THREE.Mesh(nacelleGeo, engineMat);
    nacelle.position.set(pos.x, pos.y, pos.z);
    nacelle.castShadow = true;
    group.add(nacelle);

    // Inner Thruster Ring (Glowing)
    const ringGeo = new THREE.TorusGeometry(0.35, 0.05, 16, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, glowMat);
    ring.position.set(pos.x, pos.y - 0.25, pos.z);
    group.add(ring);

    // Rotor Blades
    const bladeGeo = new THREE.BoxGeometry(0.9, 0.02, 0.12);
    const blade = new THREE.Mesh(bladeGeo, wingMat);
    blade.position.set(pos.x, pos.y + 0.32, pos.z);
    group.add(blade);
  });

  // Antennas / Sensors
  const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
  const antMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1.0, roughness: 0.2 });
  const ant1 = new THREE.Mesh(antGeo, antMat);
  ant1.position.set(0.3, 0.6, -1.0);
  ant1.rotation.x = -0.3;
  group.add(ant1);

  const ant2 = ant1.clone();
  ant2.position.set(-0.3, 0.6, -1.0);
  group.add(ant2);

  // Rear Thruster
  const thrusterGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.7, 24);
  thrusterGeo.rotateX(Math.PI / 2);
  const thruster = new THREE.Mesh(thrusterGeo, engineMat);
  thruster.position.set(0, 0, -1.6);
  group.add(thruster);

  const thrusterCoreGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const thrusterGlowMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
  const thrusterCore = new THREE.Mesh(thrusterCoreGeo, thrusterGlowMat);
  thrusterCore.position.set(0, 0, -1.8);
  group.add(thrusterCore);

  return group;
}

/**
 * Creates an intricate Mecha Reactor Core object
 */
export function createProceduralMechaCore(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural_Mecha_Reactor_Core';

  // Central Orb
  const coreGeo = new THREE.IcosahedronGeometry(0.9, 4);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x003366,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.9,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Outer Gimbal Rings
  const ring1Geo = new THREE.TorusGeometry(1.4, 0.08, 16, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    metalness: 0.9,
    roughness: 0.3,
  });
  const ring1 = new THREE.Mesh(ring1Geo, ringMat);
  ring1.castShadow = true;
  group.add(ring1);

  const ring2Geo = new THREE.TorusGeometry(1.7, 0.08, 16, 64);
  const ring2 = new THREE.Mesh(ring2Geo, ringMat);
  ring2.rotation.x = Math.PI / 3;
  ring2.rotation.y = Math.PI / 4;
  ring2.castShadow = true;
  group.add(ring2);

  const ring3Geo = new THREE.TorusGeometry(2.0, 0.08, 16, 64);
  const ring3Mat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.8,
    roughness: 0.2,
  });
  const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
  ring3.rotation.x = -Math.PI / 4;
  ring3.rotation.z = Math.PI / 3;
  ring3.castShadow = true;
  group.add(ring3);

  // Magnetic Stators
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const statorGeo = new THREE.BoxGeometry(0.2, 0.4, 0.6);
    const statorMat = new THREE.MeshStandardMaterial({
      color: 0x3b4252,
      metalness: 0.95,
      roughness: 0.15,
    });
    const stator = new THREE.Mesh(statorGeo, statorMat);
    stator.position.set(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 0);
    stator.rotation.z = angle;
    group.add(stator);
  }

  return group;
}
