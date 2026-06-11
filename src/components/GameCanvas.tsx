import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameSettings, CarConfig, TrackConfig } from '../types';
import { gameAudio } from '../audio';

interface GameCanvasProps {
  selectedCar: CarConfig;
  selectedTrack: TrackConfig;
  gameSettings: GameSettings;
  isPaused: boolean;
  gameState: string;
  onGameOver: (score: number, elapsed: number, won: boolean) => void;
  onScoreUpdate: (score: number) => void;
  onSpeedUpdate: (speed: number) => void;
  onNitroUpdate: (nitro: number) => void;
  onDistanceUpdate: (dist: number) => void;
  onTimeUpdate: (time: number) => void;
  nitroActive: boolean;
  setNitroActive: (active: boolean) => void;
  activeCamera: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedCar,
  selectedTrack,
  gameSettings,
  isPaused,
  gameState,
  onGameOver,
  onScoreUpdate,
  onSpeedUpdate,
  onNitroUpdate,
  onDistanceUpdate,
  onTimeUpdate,
  nitroActive,
  setNitroActive,
  activeCamera
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game Play Values stored in refs to avoid React re-renders in animation loop
  const stateRef = useRef({
    speed: 0,
    maxSpeed: selectedCar.speed * 80, // e.g. 1.2 * 80 = 96 units
    targetSpeed: 0,
    nitro: 100,
    distance: 0,
    score: 0,
    time: 0,
    steerInput: 0, // -1 (left) to 1 (right)
    gasInput: 0,   // 0 (none) to 1 (full gas)
    brakeInput: 0, // 0 to 1
    carX: 0,       // Center position of road (-15 to +15)
    cameraShake: 0,
    winFlag: false,
    loseFlag: false,
    isDrifting: false
  });

  useEffect(() => {
    // Sync initial config
    stateRef.current.maxSpeed = selectedCar.speed * 110; // Up to 150-180 km/h
  }, [selectedCar]);

  useEffect(() => {
    // Listen for mobile touch controls
    const handleMobileSteer = (e: any) => {
      stateRef.current.steerInput = e.detail;
    };
    const handleMobilePedals = (e: any) => {
      stateRef.current.gasInput = e.detail.gas ? 1 : 0;
      stateRef.current.brakeInput = e.detail.brake ? 1 : 0;
    };
    const handleMobileNitro = (e: any) => {
      stateRef.current.gasInput = e.detail ? 1 : stateRef.current.gasInput; // Auto accelerations
      if (e.detail && stateRef.current.nitro > 10) {
        setNitroActive(true);
      } else {
        setNitroActive(false);
      }
    };

    window.addEventListener('mobile-steer', handleMobileSteer);
    window.addEventListener('mobile-pedals', handleMobilePedals);
    window.addEventListener('mobile-nitro', handleMobileNitro);

    return () => {
      window.removeEventListener('mobile-steer', handleMobileSteer);
      window.removeEventListener('mobile-pedals', handleMobilePedals);
      window.removeEventListener('mobile-nitro', handleMobileNitro);
    };
  }, [setNitroActive]);

  useEffect(() => {
    if (!containerRef.current || gameState !== 'PLAYING') return;

    // --- 1. SETUP THREE.JS SCENE AND RENDERER ---
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(selectedTrack.skyColor);
    
    // Add realistic foggy depth
    scene.fog = new THREE.FogExp2(selectedTrack.fogColor, 0.005);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: gameSettings.graphics === 'high', powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = gameSettings.graphics === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // --- 2. LIGHTING SETUP ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 0.95);
    dirLight.position.set(40, 100, 40);
    dirLight.castShadow = gameSettings.graphics === 'high';
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 300;
      const d = 50;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    scene.add(dirLight);

    // Hemispherical lighting for skies
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // --- 3. CREATE PLAYER CAR GEOMETRY (Procedurally Built) ---
    // Beautiful composite structure of a sports car
    const carGroup = new THREE.Group();
    carGroup.castShadow = true;
    carGroup.receiveShadow = true;

    // Car main chassis
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.5, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(selectedCar.color),
      roughness: 0.2,
      metalness: 0.8
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.45;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    carGroup.add(bodyMesh);

    // Car top cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 0.9, -0.2);
    cabinMesh.castShadow = true;
    carGroup.add(cabinMesh);

    // Glowy headlights
    const lightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const lightMatLeft = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const lightMatRight = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const headLeft = new THREE.Mesh(lightGeo, lightMatLeft);
    headLeft.position.set(-0.8, 0.45, 2.21);
    const headRight = new THREE.Mesh(lightGeo, lightMatRight);
    headRight.position.set(0.8, 0.45, 2.21);
    carGroup.add(headLeft);
    carGroup.add(headRight);

    // Tail brake lights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tailLeft = new THREE.Mesh(lightGeo, tailMat);
    tailLeft.position.set(-0.8, 0.45, -2.21);
    const tailRight = new THREE.Mesh(lightGeo, tailMat);
    tailRight.position.set(0.8, 0.45, -2.21);
    carGroup.add(tailLeft);
    carGroup.add(tailRight);

    // Rear Spoiler
    const spoilerPostGeo = new THREE.BoxGeometry(0.1, 0.35, 0.1);
    const spoilerWingGeo = new THREE.BoxGeometry(1.9, 0.1, 0.5);
    const spoilerMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(selectedCar.secondaryColor), roughness: 0.5 });
    
    const postL = new THREE.Mesh(spoilerPostGeo, spoilerMat);
    postL.position.set(-0.7, 0.75, -2.0);
    const postR = new THREE.Mesh(spoilerPostGeo, spoilerMat);
    postR.position.set(0.7, 0.75, -2.0);
    const wing = new THREE.Mesh(spoilerWingGeo, spoilerMat);
    wing.position.set(0, 0.95, -2.0);
    
    carGroup.add(postL);
    carGroup.add(postR);
    carGroup.add(wing);

    // Add Rotating Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
    
    const wheelLF = new THREE.Mesh(wheelGeo, wheelMat);
    wheelLF.rotation.z = Math.PI / 2;
    wheelLF.position.set(-1.1, 0.48, 1.4);
    
    const wheelRF = new THREE.Mesh(wheelGeo, wheelMat);
    wheelRF.rotation.z = Math.PI / 2;
    wheelRF.position.set(1.1, 0.48, 1.4);
    
    const wheelLR = new THREE.Mesh(wheelGeo, wheelMat);
    wheelLR.rotation.z = Math.PI / 2;
    wheelLR.position.set(-1.1, 0.48, -1.4);
    
    const wheelRR = new THREE.Mesh(wheelGeo, wheelMat);
    wheelRR.rotation.z = Math.PI / 2;
    wheelRR.position.set(1.1, 0.48, -1.4);

    carGroup.add(wheelLF);
    carGroup.add(wheelRF);
    carGroup.add(wheelLR);
    carGroup.add(wheelRR);

    // Nitro flame particles emitter node
    const flameGeo = new THREE.ConeGeometry(0.15, 0.6, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff3700, transparent: true, opacity: 0 });
    const exhaustFlameL = new THREE.Mesh(flameGeo, flameMat);
    exhaustFlameL.rotation.x = -Math.PI / 2;
    exhaustFlameL.position.set(-0.6, 0.28, -2.3);

    const exhaustFlameR = new THREE.Mesh(flameGeo, flameMat);
    exhaustFlameR.rotation.x = -Math.PI / 2;
    exhaustFlameR.position.set(0.6, 0.28, -2.3);

    carGroup.add(exhaustFlameL);
    carGroup.add(exhaustFlameR);

    // Initial position of player car in space
    carGroup.position.set(0, 0, 0);
    scene.add(carGroup);

    // Reset loop state trackers
    stateRef.current.speed = 0;
    stateRef.current.distance = 0;
    stateRef.current.score = 0;
    stateRef.current.time = 0;
    stateRef.current.carX = 0;
    stateRef.current.nitro = 100;
    stateRef.current.winFlag = false;
    stateRef.current.loseFlag = false;

    // --- 4. PROCEDURAL HIGHWAY GENERATION ---
    const segmentWidth = 34; // Total width of driving zone
    const segmentLength = 20; // Length of individual segments
    const trackSegCount = Math.ceil(selectedTrack.length / segmentLength) + 3;
    
    const roadColor = 0x222227;
    const offroadColor = new THREE.Color(selectedTrack.color);

    const segments: {
      mesh: THREE.Object3D;
      curveAmount: number;
      z: number;
    }[] = [];

    const curveAngles: number[] = [];
    // Generate curved path offsets (creates a lovely dynamic twisting road!)
    let currentHeading = 0;
    for (let i = 0; i < trackSegCount; i++) {
      if (i > 5 && i % 12 === 0) {
        // Change drift curve intensity based on track spec
        currentHeading = (Math.random() - 0.5) * selectedTrack.curveIntensity * segmentLength;
      }
      curveAngles.push(currentHeading);
    }

    // Ground & track parent mesh to position everything
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Build segment road tracks
    for (let i = 0; i < trackSegCount; i++) {
      const zPos = i * segmentLength;
      const segGroup = new THREE.Group();
      segGroup.position.z = zPos;

      // Central asphalt road
      const roadGeo = new THREE.PlaneGeometry(segmentWidth, segmentLength);
      const roadMat = new THREE.MeshStandardMaterial({
        color: roadColor,
        roughness: 0.9,
        metalness: 0.1
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.y = 0.005; // Slightly above terrain
      roadMesh.receiveShadow = true;
      segGroup.add(roadMesh);

      // Side shoulders stripes (white/red warning barriers)
      const borderGeo = new THREE.PlaneGeometry(1.2, segmentLength);
      const isRed = i % 2 === 0;
      const borderMatL = new THREE.MeshStandardMaterial({ color: isRed ? 0xef4444 : 0xffffff });
      const borderMatR = new THREE.MeshStandardMaterial({ color: isRed ? 0xef4444 : 0xffffff });
      
      const borderL = new THREE.Mesh(borderGeo, borderMatL);
      borderL.rotation.x = -Math.PI / 2;
      borderL.position.set(-segmentWidth / 2 - 0.4, 0.012, 0);
      
      const borderR = new THREE.Mesh(borderGeo, borderMatR);
      borderR.rotation.x = -Math.PI / 2;
      borderR.position.set(segmentWidth / 2 + 0.4, 0.012, 0);

      segGroup.add(borderL);
      segGroup.add(borderR);

      // Central divider painted dashed lines
      if (i % 2 === 0) {
        const lineGeo = new THREE.PlaneGeometry(0.3, segmentLength * 0.4);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xdec132 });
        
        // Lane dividing dashed lines
        const leftDash = new THREE.Mesh(lineGeo, lineMat);
        leftDash.rotation.x = -Math.PI / 2;
        leftDash.position.set(-segmentWidth / 6, 0.015, 0);

        const rightDash = new THREE.Mesh(lineGeo, lineMat);
        rightDash.rotation.x = -Math.PI / 2;
        rightDash.position.set(segmentWidth / 6, 0.015, 0);

        segGroup.add(leftDash);
        segGroup.add(rightDash);
      }

      // Outer landscape blocks
      const groundGeo = new THREE.PlaneGeometry(500, segmentLength);
      const groundMat = new THREE.MeshStandardMaterial({
        color: offroadColor,
        roughness: 0.98,
        metalness: 0.01
      });
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.y = 0;
      groundMesh.receiveShadow = true;
      segGroup.add(groundMesh);

      // Off-track details (trees/skyscrapers/cactuses depending on theme)
      if (i > 3 && i < trackSegCount - 5) {
        const createSceneryObject = (left: boolean) => {
          const sceneryGroup = new THREE.Group();
          const xOffset = left ? -(segmentWidth / 2 + 6 + Math.random() * 12) : (segmentWidth / 2 + 6 + Math.random() * 12);
          sceneryGroup.position.set(xOffset, 0, (Math.random() - 0.5) * segmentLength);

          if (selectedTrack.id === 'city') {
            // Highrise building block with glowing yellow windows
            const h = 25 + Math.random() * 55;
            const bW = 8 + Math.random() * 12;
            const bD = 8 + Math.random() * 12;
            const buildGeo = new THREE.BoxGeometry(bW, h, bD);
            const buildColor = new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.35, 0.15 + Math.random() * 0.2);
            const buildMat = new THREE.MeshStandardMaterial({ color: buildColor, roughness: 0.4 });
            const build = new THREE.Mesh(buildGeo, buildMat);
            build.position.y = h / 2;
            build.castShadow = true;
            build.receiveShadow = true;
            sceneryGroup.add(build);

            // Glowing light window indicators (Yellow points)
            if (gameSettings.graphics === 'high') {
              const winGeo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
              const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
              for (let fy = 3; fy < h - 4; fy += 4) {
                for (let fx = -bW / 2 + 1.5; fx < bW / 2 - 1.5; fx += 3.5) {
                  const windowMesh = new THREE.Mesh(winGeo, winMat);
                  windowMesh.position.set(fx, fy, bD / 2 + 0.05);
                  sceneryGroup.add(windowMesh);
                }
              }
            }
          } else if (selectedTrack.id === 'desert') {
            // Low poly desert green Cactus
            const trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 4.5, 8);
            const cactusMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });
            const trunk = new THREE.Mesh(trunkGeo, cactusMat);
            trunk.position.y = 2.25;
            trunk.castShadow = true;
            sceneryGroup.add(trunk);

            // Left cactus arm
            const armLGeo = new THREE.BoxGeometry(1.6, 0.4, 0.4);
            const armL = new THREE.Mesh(armLGeo, cactusMat);
            armL.position.set(-0.8, 2.5, 0);
            sceneryGroup.add(armL);

            const branchLGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8);
            const branchL = new THREE.Mesh(branchLGeo, cactusMat);
            branchL.position.set(-1.4, 3.0, 0);
            sceneryGroup.add(branchL);
          } else {
            // Neon Synthwave stylized futuristic retro triangles
            const pyramidGeo = new THREE.ConeGeometry(3, 15, 4);
            const pyramidMat = new THREE.MeshStandardMaterial({
              color: 0xec4899,
              roughness: 0.1,
              metalness: 0.8,
              wireframe: true
            });
            const py1 = new THREE.Mesh(pyramidGeo, pyramidMat);
            py1.position.y = 7.5;
            sceneryGroup.add(py1);
          }
          segGroup.add(sceneryGroup);
        };

        createSceneryObject(true);  // Left side
        createSceneryObject(false); // Right side
      }

      // Add segment to scene tracking
      worldGroup.add(segGroup);
      segments.push({
        mesh: segGroup,
        curveAmount: curveAngles[i],
        z: zPos
      });
    }

    // --- 5. FINISH ARCH AND CHECKPOINT PLACEMENTS ---
    // Finish Arch at the very end of track
    const finishArchIndex = trackSegCount - 3;
    const finishSeg = segments[finishArchIndex];
    const finishGroup = new THREE.Group();

    // Side Pillars
    const archMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.61 });
    const pillarGeo = new THREE.BoxGeometry(1.5, 12, 1.5);
    const pillarL = new THREE.Mesh(pillarGeo, archMat);
    pillarL.position.set(-segmentWidth / 2 - 1.2, 6, 0);
    const pillarR = new THREE.Mesh(pillarGeo, archMat);
    pillarR.position.set(segmentWidth / 2 + 1.2, 6, 0);

    // Cross beam banner
    const beamGeo = new THREE.BoxGeometry(segmentWidth + 6, 2.5, 1.8);
    const beam = new THREE.Mesh(beamGeo, archMat);
    beam.position.set(0, 11, 0);

    // FINISH text decal banner
    const bannerGeo = new THREE.PlaneGeometry(segmentWidth - 2, 1.8);
    const canvasBanner = document.createElement('canvas');
    canvasBanner.width = 512;
    canvasBanner.height = 64;
    const bannerCtx = canvasBanner.getContext('2d');
    if (bannerCtx) {
      bannerCtx.fillStyle = '#f97316';
      bannerCtx.fillRect(0, 0, 512, 64);
      bannerCtx.fillStyle = '#ffffff';
      bannerCtx.font = 'bold 36px sans-serif';
      bannerCtx.textAlign = 'center';
      bannerCtx.textBaseline = 'middle';
      bannerCtx.fillText('--- FINISH ---', 256, 32);
    }
    const bannerTex = new THREE.CanvasTexture(canvasBanner);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 11, 0.95);

    finishGroup.add(pillarL);
    finishGroup.add(pillarR);
    finishGroup.add(beam);
    finishGroup.add(bannerMesh);

    finishSeg.mesh.add(finishGroup);

    // --- 6. INTERACTIVE COLLECTIBLES AND OBSTACLES SPAWNING ---
    const collectedIds = new Set<string>();
    const interactives: {
      id: string;
      type: 'COIN' | 'NITRO' | 'OBSTACLE_ROCK' | 'OBSTACLE_BARRIER' | 'TRAFFIC_CAR';
      mesh: THREE.Object3D;
      z: number;
      lane: number;
      speed?: number;
    }[] = [];

    // Lane definitions X coordinates: Left, Center, Right
    const lanePositions = [-10, 0, 10];

    // Spawn entities along the segment units
    for (let i = 5; i < finishArchIndex - 1; i++) {
      // Logic for spawning: select random lane, pick density based on difficulty
      const densityRoll = Math.random();
      const diffDensity = selectedTrack.difficulty === 'Oson' ? 0.25 : selectedTrack.difficulty === 'O\'rtacha' ? 0.38 : 0.52;

      if (densityRoll < diffDensity) {
        const lane = Math.floor(Math.random() * 3);
        const laneX = lanePositions[lane];
        const segZ = segments[i].z;
        const entTypeRoll = Math.random();

        const entityId = `ent_${i}_${lane}`;
        const itemGroup = new THREE.Group();
        itemGroup.position.set(laneX, 0, 0);

        if (entTypeRoll < 0.35) {
          // --- Item: Golden Coin ---
          const coinGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.15, 12);
          const coinMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xca8a04,
            emissiveIntensity: 0.25
          });
          const coinMesh = new THREE.Mesh(coinGeo, coinMat);
          coinMesh.rotation.x = Math.PI / 2;
          coinMesh.rotation.z = Math.PI / 4;
          coinMesh.position.y = 1.1; // floating
          coinMesh.castShadow = true;
          itemGroup.add(coinMesh);

          segments[i].mesh.add(itemGroup);
          interactives.push({ id: entityId, type: 'COIN', mesh: itemGroup, z: segZ, lane });
        } else if (entTypeRoll < 0.55) {
          // --- Item: Fire Nitro Portal Pad ---
          const padGeo = new THREE.TorusGeometry(0.9, 0.22, 8, 18);
          const padMat = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: 0xea580c,
            emissiveIntensity: 0.75,
            roughness: 0.2
          });
          const padMesh = new THREE.Mesh(padGeo, padMat);
          padMesh.position.y = 1.1;
          padMesh.name = "rotator";
          itemGroup.add(padMesh);

          // Central flame core
          const coreGeo = new THREE.ConeGeometry(0.3, 0.9, 5);
          const coreMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
          const core = new THREE.Mesh(coreGeo, coreMat);
          core.position.y = 1.1;
          itemGroup.add(core);

          segments[i].mesh.add(itemGroup);
          interactives.push({ id: entityId, type: 'NITRO', mesh: itemGroup, z: segZ, lane });
        } else if (entTypeRoll < 0.80) {
          // --- Obstacle: Heavy Grey Rock or Warning road barrier ---
          const isRock = Math.random() > 0.4;
          if (isRock) {
            const rockGeo = new THREE.DodecahedronGeometry(1.6);
            const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
            const rockMesh = new THREE.Mesh(rockGeo, rockMat);
            rockMesh.position.y = 0.6;
            rockMesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            itemGroup.add(rockMesh);
            segments[i].mesh.add(itemGroup);
            interactives.push({ id: entityId, type: 'OBSTACLE_ROCK', mesh: itemGroup, z: segZ, lane });
          } else {
            // Striped barrier box
            const barGeo = new THREE.BoxGeometry(3.6, 1.1, 0.75);
            // Red and white hazard striped map texture representation
            const barCanvas = document.createElement('canvas');
            barCanvas.width = 128;
            barCanvas.height = 32;
            const bCtx = barCanvas.getContext('2d');
            if (bCtx) {
              bCtx.fillStyle = '#ef4444';
              bCtx.fillRect(0, 0, 128, 32);
              bCtx.strokeStyle = '#ffffff';
              bCtx.lineWidth = 12;
              bCtx.beginPath();
              for (let lineOffset = -20; lineOffset < 200; lineOffset += 30) {
                bCtx.moveTo(lineOffset, 0);
                bCtx.lineTo(lineOffset - 25, 32);
              }
              bCtx.stroke();
            }
            const barTextu = new THREE.CanvasTexture(barCanvas);
            const barMat = new THREE.MeshStandardMaterial({ map: barTextu, roughness: 0.6 });
            const barrierMesh = new THREE.Mesh(barGeo, barMat);
            barrierMesh.position.y = 0.55;
            barrierMesh.castShadow = true;
            barrierMesh.receiveShadow = true;
            itemGroup.add(barrierMesh);
            segments[i].mesh.add(itemGroup);
            interactives.push({ id: entityId, type: 'OBSTACLE_BARRIER', mesh: itemGroup, z: segZ, lane });
          }
        } else {
          // --- Enemy Traffic NPC Car (Slow moving forward) ---
          const trafficGroup = new THREE.Group();
          const tColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.45);
          
          const tBody = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 0.55, 3.8),
            new THREE.MeshStandardMaterial({ color: tColor, roughness: 0.3 })
          );
          tBody.position.y = 0.45;
          tBody.castShadow = true;
          trafficGroup.add(tBody);

          const tCabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.5, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
          );
          tCabin.position.set(0, 0.9, -0.15);
          trafficGroup.add(tCabin);

          // Wheels
          const tWhGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10);
          const tWhMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
          
          [-1, 1].forEach((steerSide) => {
            [-1, 1].forEach((wheelLong) => {
              const tmWheel = new THREE.Mesh(tWhGeo, tWhMat);
              tmWheel.rotation.z = Math.PI / 2;
              tmWheel.position.set(steerSide * 1.05, 0.42, wheelLong * 1.25);
              trafficGroup.add(tmWheel);
            });
          });

          itemGroup.add(trafficGroup);
          segments[i].mesh.add(itemGroup);

          // Spawn with a random slow speed (20 to 45 units)
          const trafficSpeed = 20 + Math.random() * 25;
          interactives.push({
            id: entityId,
            type: 'TRAFFIC_CAR',
            mesh: itemGroup,
            z: segZ,
            lane,
            speed: trafficSpeed
          });
        }
      }
    }


    // --- 7. KEY EVENT HANDLERS ---
    const keys: Record<string, boolean> = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, ' ': false, Shift: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on arrows/space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keys[e.key] = true;
      if (e.key === ' ' && stateRef.current.nitro > 10) {
        setNitroActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
      if (e.key === ' ') {
        setNitroActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Initial audio play
    gameAudio.startEngine();
    if (gameSettings.musicVolume > 0 && gameState === 'PLAYING') {
      gameAudio.startMusic();
    }

    // --- 8. ANIMATION LOOP ---
    let frameId: number;
    let lastTime = performance.now();
    
    // Screen shake trigger matrix
    let shakeStrength = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (isPaused || gameState !== 'PLAYING') {
        lastTime = performance.now();
        // Cut volume
        gameAudio.stopEngine();
        gameAudio.stopMusic();
        return;
      }

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Increment clock Timer
      stateRef.current.time += delta;
      onTimeUpdate(stateRef.current.time);

      // --- USER INPUT ACCELERATION AND BRAKING ---
      // Determine inputs from Keyboard or Mobile
      let localGas = 0;
      let localBrake = 0;
      let localSteer = 0;
      let localDrift = keys.Shift;

      // Auto gas logic
      if (gameSettings.autoGas) {
        localGas = 1.0;
      }

      if (keys.w || keys.ArrowUp) localGas = 1.0;
      if (keys.s || keys.ArrowDown) localBrake = 1.0;
      if (keys.a || keys.ArrowLeft) localSteer = -1.0;
      if (keys.d || keys.ArrowRight) localSteer = 1.0;

      // Override if mobile events have input
      if (stateRef.current.gasInput > 0) localGas = stateRef.current.gasInput;
      if (stateRef.current.brakeInput > 0) localBrake = stateRef.current.brakeInput;
      if (stateRef.current.steerInput !== 0) localSteer = stateRef.current.steerInput;

      // --- NITRO SPEED ACCELERATION ---
      let usingNitro = false;
      if (nitroActive && stateRef.current.nitro > 5 && localGas > 0.1) {
        usingNitro = true;
        stateRef.current.nitro -= delta * 24 * selectedCar.nitro; // Decrease nitro tank
        if (stateRef.current.nitro <= 0) {
          stateRef.current.nitro = 0;
          setNitroActive(false);
        }
      } else {
        // Regenerate nitro slowly when not in use
        stateRef.current.nitro = Math.min(100, stateRef.current.nitro + delta * 2.8);
      }
      onNitroUpdate(stateRef.current.nitro);

      // --- MOVEMENT PHYSICS ---
      // Slower handling or drifting if grass boundary exceeded
      const currentX = stateRef.current.carX;
      const isOffroad = Math.abs(currentX) > (segmentWidth / 2 - 1.5);
      const accelMult = isOffroad ? 0.35 : 1.0;

      // Target speed calculation
      let accelBase = selectedCar.acceleration * 12;
      let maxSpeedTarget = stateRef.current.maxSpeed;

      if (usingNitro) {
        maxSpeedTarget += 45; // Turbo boost
        accelBase *= 3.0;
        // Brighten exhaust flame
        exhaustFlameL.scale.set(1, 1, 1);
        exhaustFlameL.material.opacity = 0.95;
        exhaustFlameR.scale.set(1, 1, 1);
        exhaustFlameR.material.opacity = 0.95;
        gameAudio.setNitro(true);
      } else {
        // Hide/minimize engine flames
        exhaustFlameL.scale.set(0.1, 0.1, 0.1);
        exhaustFlameL.material.opacity = 0;
        exhaustFlameR.scale.set(0.1, 0.1, 0.1);
        exhaustFlameR.material.opacity = 0;
        gameAudio.setNitro(false);
      }

      let desiredSpeed = 0;
      if (localGas > 0 && localBrake === 0) {
        desiredSpeed = maxSpeedTarget * localGas * accelMult;
        // Smoothly accelerate
        stateRef.current.speed += (desiredSpeed - stateRef.current.speed) * delta * 0.9 * accelBase;
      } else if (localBrake > 0) {
        desiredSpeed = 0;
        stateRef.current.speed += (desiredSpeed - stateRef.current.speed) * delta * 6.0; // Sharp decelerations
      } else {
        // Engine compression braking (coasting)
        stateRef.current.speed += (0 - stateRef.current.speed) * delta * 0.45;
      }

      // Safeguard speed range
      if (stateRef.current.speed < 0) stateRef.current.speed = 0;
      onSpeedUpdate(stateRef.current.speed);

      // --- STEER TURNING ---
      // Responsive steering curves based on traction handling
      const currentSteerPower = selectedCar.handling * 1.5;
      
      // Can't steer if stationary
      const steeringSpeedRatio = Math.min(1.0, stateRef.current.speed / 15);
      if (localSteer !== 0) {
        let steerChange = localSteer * currentSteerPower * steeringSpeedRatio * delta * 12.5;
        if (localDrift) {
          steerChange *= 1.45; // fast arcade slide
          stateRef.current.isDrifting = true;
          gameAudio.playDrift();
        } else {
          stateRef.current.isDrifting = false;
        }
        stateRef.current.carX += steerChange;
        
        // Tilt car body slightly for dramatic feeling!
        const targetRotY = -localSteer * 0.18 + (localDrift ? -localSteer * 0.08 : 0);
        carGroup.rotation.y += (targetRotY - carGroup.rotation.y) * 0.2;
        carGroup.rotation.z += (-localSteer * 0.085 - carGroup.rotation.z) * 0.25;
      } else {
        stateRef.current.isDrifting = false;
        // Re-center tilt
        carGroup.rotation.y += (0 - carGroup.rotation.y) * 0.15;
        carGroup.rotation.z += (0 - carGroup.rotation.z) * 0.15;
      }

      // Confine player offtrack limits
      if (stateRef.current.carX < -segmentWidth / 2 - 4) stateRef.current.carX = -segmentWidth / 2 - 4;
      if (stateRef.current.carX > segmentWidth / 2 + 4) stateRef.current.carX = segmentWidth / 2 + 4;

      // Rotate car wheels based on speed
      const wheelRotSpeed = (stateRef.current.speed * 0.15);
      wheelLF.rotation.x += wheelRotSpeed * delta;
      wheelRF.rotation.x += wheelRotSpeed * delta;
      wheelLR.rotation.x += wheelRotSpeed * delta;
      wheelRR.rotation.x += wheelRotSpeed * delta;

      // Sound update relative to engine load
      const engineLoadRatio = stateRef.current.speed / maxSpeedTarget;
      gameAudio.updateEngine(engineLoadRatio, stateRef.current.isDrifting);

      // --- ADVANCE PLAYER PROGRESS AND CURVATURE BINDINGS ---
      // Update forward odometer distance
      const distanceTick = (stateRef.current.speed * 0.45) * delta;
      stateRef.current.distance += distanceTick;
      onDistanceUpdate(stateRef.current.distance);

      // Locate current active segment index based on distance progress
      const currentSegIndex = Math.floor(stateRef.current.distance / segmentLength);
      
      // Update main track visual offsets to simulate road bending
      if (currentSegIndex < segments.length) {
        // Bend scenery group elements slightly in negative direction of upcoming curves
        let accumCurve = 0;
        const scanAhead = 12; // Segment visibility projection

        for (let j = 0; j < segments.length; j++) {
          const seg = segments[j];
          // Local offset calculation relative to player progression coordinates
          const relativeZ = seg.z - stateRef.current.distance;

          if (relativeZ < -segmentLength) {
            // Unload segment behind player (save draw cycles)
            seg.mesh.visible = false;
          } else if (relativeZ > segmentLength * scanAhead) {
            seg.mesh.visible = false;
          } else {
            seg.mesh.visible = true;

            // Apply road bend projection math
            if (j >= currentSegIndex) {
              const weight = Math.max(0, 1 - (relativeZ / (segmentLength * scanAhead)));
              accumCurve += seg.curveAmount * weight * 0.045;
            }
            seg.mesh.position.x = accumCurve;
          }
        }

        // Apply track bend reaction force to steering (curve drift pull)
        const activeSegCurve = segments[Math.min(segments.length - 1, currentSegIndex)].curveAmount;
        stateRef.current.carX -= activeSegCurve * (stateRef.current.speed / stateRef.current.maxSpeed) * delta * 15.0;
      }

      // Set Player Car real lateral x grid position
      carGroup.position.x = stateRef.current.carX;

      // Rotate floating/pulsating collectable items to look pretty
      const rotTimer = Date.now() * 0.0035;
      interactives.forEach((ent) => {
        if (collectedIds.has(ent.id)) return;

        // Rotate coins/nitro torus mesh
        if (ent.type === 'COIN') {
          ent.mesh.rotation.y += delta * 2.5;
        } else if (ent.type === 'NITRO') {
          const rNode = ent.mesh.getObjectByName("rotator");
          if (rNode) {
            rNode.rotation.y += delta * 2.0;
            const sizeScale = 1.0 + Math.sin(rotTimer) * 0.12;
            rNode.scale.set(sizeScale, sizeScale, sizeScale);
          }
        } else if (ent.type === 'TRAFFIC_CAR' && ent.speed) {
          // Progress slow NPC car along the segment segment
          const npcProgress = ent.speed * delta;
          ent.z += npcProgress;
          // Position relative to its parent section
          ent.mesh.position.z += npcProgress;
        }
      });

      // --- COLLISIONS ENGINES ---
      const playerPosWorld = new THREE.Vector3();
      carGroup.getWorldPosition(playerPosWorld);

      interactives.forEach((ent) => {
        if (collectedIds.has(ent.id)) return;

        // Calculate world distance
        const entWorldPos = new THREE.Vector3();
        ent.mesh.getWorldPosition(entWorldPos);

        const deltaZ = Math.abs(entWorldPos.z - playerPosWorld.z);
        const deltaX = Math.abs(entWorldPos.x - playerPosWorld.x);

        // Standard bounding box intersection
        if (deltaZ < 2.5 && deltaX < 1.95) {
          if (ent.type === 'COIN') {
            // Ding coin collect!
            collectedIds.add(ent.id);
            ent.mesh.visible = false;
            stateRef.current.score += 150 + Math.round(stateRef.current.speed * 0.5); // score award based on speed
            onScoreUpdate(stateRef.current.score);
            gameAudio.playCoin();

            // Flash screen score feedback (can be visual particles)
          } else if (ent.type === 'NITRO') {
            // Nitro portal boost!
            collectedIds.add(ent.id);
            ent.mesh.visible = false;
            stateRef.current.nitro = Math.min(100, stateRef.current.nitro + 35);
            stateRef.current.score += 50;
            onScoreUpdate(stateRef.current.score);
            gameAudio.playCheckpoint();
            
            // Set nitro active immediately
            setNitroActive(true);
            setTimeout(() => setNitroActive(false), 2400);
          } else if (ent.type === 'OBSTACLE_ROCK' || ent.type === 'OBSTACLE_BARRIER' || ent.type === 'TRAFFIC_CAR') {
            // BAM! Big crash collision!
            collectedIds.add(ent.id); // Deactivate/destroy so we don't multiply collide
            
            // Trigger dramatic physical backlash
            shakeStrength = 1.35;
            stateRef.current.speed *= 0.30; // drop 70% speed!
            
            // Penalty deduct points
            stateRef.current.score = Math.max(0, stateRef.current.score - 200);
            onScoreUpdate(stateRef.current.score);

            gameAudio.playCrash();

            // Flash collision red ambient lights (flicker headlight color filters)
            lightMatLeft.color.setHex(0xef4444);
            lightMatRight.color.setHex(0xef4444);
            setTimeout(() => {
              lightMatLeft.color.setHex(0x22d3ee);
              lightMatRight.color.setHex(0x22d3ee);
            }, 600);
          }
        }
      });

      // --- RAMPING GRAPHICS SHAKE AND CAMERA TRACKINGS ---
      // Decay camera shakes over time
      if (shakeStrength > 0.01) {
        shakeStrength *= 0.88;
      } else {
        shakeStrength = 0;
      }

      // Camera views positioning lerps
      const shakeOffset = (Math.random() - 0.5) * shakeStrength;
      
      if (activeCamera === 'behind') {
        // Smoothly follow car from behind
        const targetCamX = carGroup.position.x * 0.85 + shakeOffset;
        const targetCamY = 3.6 + (stateRef.current.speed * 0.005); // slightly lifts up at speeds
        const targetCamZ = carGroup.position.z - 7.5 - (stateRef.current.speed * 0.02); // Recedes on super fast drive

        camera.position.x += (targetCamX - camera.position.x) * 0.12;
        camera.position.y += (targetCamY - camera.position.y) * 0.12;
        camera.position.z = targetCamZ;

        // Keep eyes on front horizon coordinates
        const lookAtTarget = new THREE.Vector3(carGroup.position.x * 0.5, 1.2, carGroup.position.z + 20);
        camera.lookAt(lookAtTarget);
      } else if (activeCamera === 'hood') {
        // High intensity hood windshield cam
        camera.position.x = carGroup.position.x + shakeOffset;
        camera.position.y = 1.15;
        camera.position.z = carGroup.position.z + 1.2;

        const lookAtTarget = new THREE.Vector3(carGroup.position.x, 1.0, carGroup.position.z + 50);
        camera.lookAt(lookAtTarget);
      } else {
        // Sky top-down camera (awesome for classic retro feels)
        camera.position.x = carGroup.position.x * 0.5;
        camera.position.y = 22;
        camera.position.z = carGroup.position.z - 2;

        const lookAtTarget = new THREE.Vector3(carGroup.position.x, 0, carGroup.position.z + 6);
        camera.lookAt(lookAtTarget);
      }

      // --- WIN OR LOSE BOUNDARIES CHECK ---
      const totalTrackLimit = selectedTrack.length;
      if (stateRef.current.distance >= totalTrackLimit && !stateRef.current.winFlag) {
        stateRef.current.winFlag = true;
        gameAudio.stopEngine();
        gameAudio.playWin();
        onGameOver(stateRef.current.score, stateRef.current.time, true);
      }

      // Empty renderer draw call
      renderer.render(scene, camera);
    };

    animate();

    // --- 9. RESIZE HANDLING WITH RESIZEOBSERVER ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // --- 10. CLEANUP MOUNT ---
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gameAudio.stopEngine();
      gameAudio.stopMusic();

      // Dispose webgl resources to prevent memory leaks
      renderer.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      cabinGeo.dispose();
      cabinMat.dispose();
      lightGeo.dispose();
      lightMatLeft.dispose();
      lightMatRight.dispose();
      tailMat.dispose();
      spoilerPostGeo.dispose();
      spoilerWingGeo.dispose();
      spoilerMat.dispose();
      wheelGeo.dispose();
      wheelMat.dispose();
      flameGeo.dispose();
      flameMat.dispose();
    };
  }, [gameState, selectedCar, selectedTrack, gameSettings.graphics, isPaused, activeCamera]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-950 block select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
