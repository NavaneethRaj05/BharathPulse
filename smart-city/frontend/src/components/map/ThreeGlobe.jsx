import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion } from 'framer-motion';
import { Globe, Compass, ArrowRight, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export const ThreeGlobe = ({ onExploreLocation, onEnterMapDirectly }) => {
  const mountRef = useRef(null);
  const [hoveredCountry, setHoveredCountry] = useState('');
  const [isZooming, setIsZooming] = useState(false);
  const [targetCoords, setTargetCoords] = useState(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    // Get parent bounds
    const width = mountNode.clientWidth || window.innerWidth;
    const height = mountNode.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 15;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 3, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x5b8cff, 0.5);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // 5. Starfield Background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 500;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // 6. Earth Sphere
    const R = 5;
    const globeGeometry = new THREE.SphereGeometry(R, 64, 64);
    
    // Create texture loader
    const textureLoader = new THREE.TextureLoader();
    // Use a high-quality satellite texture map of Earth
    const earthTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
      },
      undefined,
      (err) => {
        console.error('Failed to load earth texture, falling back to offline shader', err);
      }
    );

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 25,
      specular: new THREE.Color(0x333333),
      bumpScale: 0.05,
    });

    const earthMesh = new THREE.Mesh(globeGeometry, earthMaterial);
    scene.add(earthMesh);

    // 7. Atmosphere Glow
    const atmosphereGeometry = new THREE.SphereGeometry(R + 0.15, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x5b8cff,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // 8. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6.5;
    controls.maxDistance = 30;
    controls.enablePan = false;

    // 9. Interaction & Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(earthMesh);

      if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        
        // Convert intersection point to geographic coordinates
        const localPoint = earthMesh.worldToLocal(intersectPoint.clone());
        localPoint.normalize();

        const lat = Math.asin(localPoint.y) * (180 / Math.PI);
        // Calculate longitude accounting for texture mapping wrapping
        let lng = Math.atan2(localPoint.x, localPoint.z) * (180 / Math.PI);
        
        // Correct offset to align textures correctly
        lng = -lng; 
        
        setTargetCoords({ lat: lat.toFixed(2), lng: lng.toFixed(2) });
        setIsZooming(true);
        toast.success(`Target locked: Lat ${lat.toFixed(2)}°, Lng ${lng.toFixed(2)}°! Diving in...`, { icon: '🎯', duration: 2000 });

        // Trigger camera fly-in animation
        let progress = 0;
        const startPos = camera.position.clone();
        const endPos = intersectPoint.clone().normalize().multiplyScalar(6.0); // Stop right above the surface

        const animateFlyIn = () => {
          progress += 0.04;
          if (progress < 1) {
            camera.position.lerpVectors(startPos, endPos, progress);
            camera.lookAt(intersectPoint);
            requestAnimationFrame(animateFlyIn);
          } else {
            onExploreLocation(lat, lng);
          }
        };
        
        // Disable controls during zoom flight
        controls.enabled = false;
        animateFlyIn();
      }
    };

    renderer.domElement.addEventListener('dblclick', handleMouseClick);

    // 10. Handle window resize
    const handleResize = () => {
      if (!mountNode) return;
      const w = mountNode.clientWidth;
      const h = mountNode.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Auto rotate if not user interacting or zooming
      if (!controls.state === -1 && !isZooming) {
        earthMesh.rotation.y += 0.0015;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && mountNode.contains(renderer.domElement)) {
        renderer.domElement.removeEventListener('dblclick', handleMouseClick);
        mountNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      globeGeometry.dispose();
      atmosphereGeometry.dispose();
      earthMaterial.dispose();
      atmosphereMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, [onExploreLocation, isZooming]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#03050c]">
      {/* 3D Canvas Mounting Node */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Futuristic Planetarium Overlay Elements */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Top HUD Row */}
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#5B8CFF] animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-black text-white uppercase tracking-widest">BharathPulse Global Room</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-1">
              Select or double-click any point on the globe to explore municipal jurisdiction.
            </span>
          </div>

          <button
            onClick={onEnterMapDirectly}
            className="flex items-center gap-2 bg-[#5B8CFF] hover:bg-[#5B8CFF]/80 text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-2xl shadow-xl transition-all pointer-events-auto cursor-pointer border border-[#5B8CFF]/30 glow-primary active:scale-95"
          >
            Direct Map HUD <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Lock Overlay & Controls Info */}
        <div className="flex justify-between items-end w-full">
          <div className="flex flex-col bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 text-[9px] text-slate-400 font-bold gap-1 pointer-events-none shadow-xl">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#FFB020]" />
              <span>Rotate: Left Click + Drag</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00D084]" />
              <span>Select: Double-Click on landmass</span>
            </div>
          </div>

          {isZooming && targetCoords && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900/90 backdrop-blur-lg border border-[#5B8CFF] rounded-2xl px-5 py-3 shadow-2xl flex flex-col items-center pointer-events-none"
            >
              <span className="text-[10px] font-black text-[#5B8CFF] uppercase tracking-widest animate-pulse">WARP SPEED DIVE</span>
              <span className="text-xs font-mono font-bold text-white mt-1">
                COORDINATES: {targetCoords.lat}° N, {targetCoords.lng}° E
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreeGlobe;
