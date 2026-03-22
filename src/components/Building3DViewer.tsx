import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { useZoneStore } from '../stores/useZoneStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import * as THREE from 'three';

function NorthArrow({ azimuth }: { azimuth: number }) {
  return (
    <group position={[0, 0.1, -15]} rotation={[0, -azimuth * (Math.PI / 180), 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 2, 4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <Text
        position={[0, 0.5, -1]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        N
      </Text>
    </group>
  );
}

export function Building3DViewer() {
  const zones = useZoneStore((s) => s.zones);
  const floors = useZoneStore((s) => s.floors);
  const northAzimuth = useZoneStore((s) => s.northAzimuth);
  
  // Przetworzenie danych topologicznych na tablicę obiektów 3D
  const elements = useMemo(() => {
    const walls: any[] = [];
    const windows: any[] = [];
    const slabs: any[] = [];

    Object.values(zones).forEach(zone => {
      const floor = floors[zone.floorId];
      if (!floor) return;
      
      const baseElev = floor.elevation || 0;
      
      // Get scaling factor for fallback polygon rendering
      const floorCanvas = useCanvasStore.getState().floors[zone.floorId];
      const sFactor = floorCanvas?.scaleFactor || 1.0;
      const poly = floorCanvas?.polygons?.find(p => p.zoneId === zone.id);

      // RENDER SLAB (Podłoga strefy)
      if (poly && poly.points.length >= 6) {
         const shape = new THREE.Shape();
         for (let i = 0; i < poly.points.length; i += 2) {
            const x = poly.points[i] * sFactor;
            const y = poly.points[i+1] * sFactor;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
         }
         shape.closePath();

         slabs.push({
            id: `slab-${zone.id}`,
            geometry: new THREE.ShapeGeometry(shape),
            position: [0, baseElev, 0],
            rotation: [-Math.PI / 2, 0, 0], // Flat on XZ
            color: '#334155'
         });
      }

      if (zone.boundaries) {
        zone.boundaries.forEach(b => {
           if (!b.geometry || b.geometry.lengthNet === 0) return;

           const dx = b.geometry.p2.x - b.geometry.p1.x;
           const dz = b.geometry.p2.y - b.geometry.p1.y;
           const len = Math.hypot(dx, dz);
           const angle = Math.atan2(dz, dx);
           
           const wallHeight = b.type === 'EXTERIOR' ? floor.heightTotal : floor.heightNet;
           
           const cx = b.geometry.p1.x + dx / 2;
           const cz = b.geometry.p1.y + dz / 2;
           const cy = baseElev + wallHeight / 2;

           const thickness = b.geometry.thickness > 0.05 ? b.geometry.thickness : 0.1;

           walls.push({
             id: b.id,
             type: b.type,
             position: [cx, cy, cz],
             rotation: [0, -angle, 0],
             size: [len, wallHeight, thickness]
           });

           if (b.openings) {
             b.openings.forEach(op => {
               const ratio = op.placement / b.geometry.lengthNet;
               const wx = b.geometry.p1.x + dx * ratio;
               const wz = b.geometry.p1.y + dz * ratio;
               const wy = baseElev + op.sillHeight + op.height / 2;

               windows.push({
                 id: op.id,
                 position: [wx, wy, wz],
                 rotation: [0, -angle, 0],
                 size: [op.width, op.height, thickness + 0.02]
               });
             });
           }
        });
      }
    });

    return { walls, windows, slabs };
  }, [zones, floors]);

  return (
    <div className="w-full h-full bg-slate-900 relative flex">
      {/* Panel Informacyjny */}
      <div className="absolute top-4 left-4 z-10 text-white bg-black/60 p-4 rounded-xl backdrop-blur-md border border-white/10 pointer-events-none shadow-2xl">
         <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <span className="text-sky-400">WATT</span> 3D Viewer
         </h2>
         <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 mb-4 font-bold">Wizualizacja Analityczna</p>
         
         <div className="space-y-2 text-[10px] uppercase font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white/20 border border-slate-400 rounded-sm"></div> 
              Ściany Wew. ({elements.walls.filter(w => w.type === 'INTERIOR').length})
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500/80 border border-orange-400 rounded-sm"></div> 
              Ściany Zew. ({elements.walls.filter(w => w.type === 'EXTERIOR').length})
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-sky-400/80 border border-sky-300 rounded-sm"></div> 
              Okna ({elements.windows.length})
            </div>
         </div>
         
         <p className="text-[9px] text-slate-500 mt-4 leading-relaxed max-w-[200px]">
           Model 3D budowany jest na podstawie <b>analizy topologicznej</b>. Jeśli bryła jest niewidoczna, użyj przycisku ⚡ na górnym pasku.
         </p>
      </div>

      <Canvas camera={{ position: [25, 25, 25], fov: 45 }} shadows>
        <color attach="background" args={['#0f172a']} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />

        <group>
          {/* SLABS / FLOORS */}
          {elements.slabs.map((slab: any) => (
             <mesh 
               key={slab.id} 
               geometry={slab.geometry}
               position={slab.position} 
               rotation={slab.rotation}
               receiveShadow
             >
               <meshStandardMaterial color={slab.color} opacity={0.5} transparent />
             </mesh>
          ))}

          {/* WALLS */}
          {elements.walls.map((wall: any) => (
             <mesh 
               key={wall.id} 
               position={wall.position} 
               rotation={wall.rotation}
               castShadow 
               receiveShadow
             >
               <boxGeometry args={wall.size} />
               <meshStandardMaterial 
                 color={wall.type === 'EXTERIOR' ? '#f97316' : '#f8fafc'} 
                 opacity={wall.type === 'INTERIOR' ? 0.6 : 0.9} 
                 transparent
                 roughness={0.8}
               />
             </mesh>
          ))}

          {/* WINDOWS */}
          {elements.windows.map((win: any) => (
             <mesh 
               key={win.id} 
               position={win.position} 
               rotation={win.rotation}
             >
               <boxGeometry args={win.size} />
               <meshPhysicalMaterial 
                 color="#38bdf8" 
                 transmission={0.8}
                 opacity={1}
                 roughness={0.1}
                 metalness={0.1}
                 transparent
               />
             </mesh>
          ))}
        </group>

        <NorthArrow azimuth={northAzimuth} />
        
        <Grid infiniteGrid fadeDistance={150} sectionColor="#334155" cellColor="#1e293b" />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
}
