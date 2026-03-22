import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useZoneStore } from '../stores/useZoneStore';

export function Building3DViewer() {
  const zones = useZoneStore((s) => s.zones);
  const floors = useZoneStore((s) => s.floors);
  
  // Przetworzenie danych topologicznych na tablicę obiektów 3D
  const elements = useMemo(() => {
    const walls: any[] = [];
    const windows: any[] = [];

    Object.values(zones).forEach(zone => {
      const floor = floors[zone.floorId];
      const baseElev = floor?.elevation || 0;
      
      if (zone.boundaries) {
        zone.boundaries.forEach(b => {
           // Ignorujemy ściany bez wyliczonej geometrii
           if (!b.geometry || b.geometry.lengthNet === 0) return;

           const dx = b.geometry.p2.x - b.geometry.p1.x;
           const dz = b.geometry.p2.y - b.geometry.p1.y; // W 3D rzutujemy Y z 2D na oś Z
           const len = Math.hypot(dx, dz);
           const angle = Math.atan2(dz, dx);
           
           const cx = b.geometry.p1.x + dx / 2;
           const cz = b.geometry.p1.y + dz / 2;
           const cy = baseElev + zone.height / 2;

           // Grubość ściany - fallback 10cm jeśli niewykryta
           const thickness = b.geometry.thickness > 0.05 ? b.geometry.thickness : 0.1;

           walls.push({
             id: b.id,
             type: b.type,
             position: [cx, cy, cz],
             rotation: [0, -angle, 0], // Obrót wokół osi Y
             size: [len, zone.height, thickness]
           });

           // Okna na tej ścianie
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
                 // Dodajemy lekkie pogrubienie okna względem ściany, żeby uniknąć z-fighting
                 size: [op.width, op.height, thickness + 0.05]
               });
             });
           }
        });
      }
    });

    return { walls, windows };
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
              Ściany Wewnętrzne ({elements.walls.filter(w => w.type === 'INTERIOR').length})
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500/80 border border-orange-400 rounded-sm"></div> 
              Ściany Zewnętrzne ({elements.walls.filter(w => w.type === 'EXTERIOR').length})
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-sky-400/80 border border-sky-300 rounded-sm"></div> 
              Stolarka Okienna ({elements.windows.length})
            </div>
         </div>
         
         <p className="text-[9px] text-slate-500 mt-4 leading-relaxed max-w-[200px]">
           Lewy przycisk myszy obraca kamerę. Prawy przesuwa. Scroll przybliża.
         </p>
      </div>

      <Canvas camera={{ position: [15, 20, 25], fov: 45 }} shadows>
        <color attach="background" args={['#0f172a']} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[20, 40, 20]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />

        <group>
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
                 opacity={wall.type === 'INTERIOR' ? 0.7 : 0.9} 
                 transparent
                 roughness={0.8}
               />
             </mesh>
          ))}

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

        <Grid infiniteGrid fadeDistance={100} sectionColor="#334155" cellColor="#1e293b" />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
}
