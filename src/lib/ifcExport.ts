import type { ZoneData, Floor } from '../types';
import type { FloorCanvasState } from '../stores/useCanvasStore';

/**
 * Converts a standard UUID v4 to a 22-character IFC GUID.
 * Reference implementation based on IFC standard ISO-10303-21.
 */
function uuidToIfcGuid(uuid: string): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  
  // Remove hyphens and parse to hex array
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }

  // Compress 16 bytes into 22 characters
  const compress = (b: Uint8Array, start: number, numBytes: number) => {
    let res = "";
    let val = 0;
    for (let i = 0; i < numBytes; i++) {
      val = (val << 8) | b[start + i];
    }
    // Every 3 bytes = 24 bits = 4 chars of 6 bits. 
    // Except when numBytes is 1 (8 bits = 2 chars).
    const numChars = numBytes === 3 ? 4 : 2;
    for (let i = 0; i < numChars; i++) {
      const shift = 6 * (numChars - 1 - i);
      const c = (val >> shift) & 0x3f;
      res += chars[c];
    }
    return res;
  };

  const guid = compress(bytes, 0, 1) + 
             compress(bytes, 1, 3) + 
             compress(bytes, 4, 3) + 
             compress(bytes, 7, 3) + 
             compress(bytes, 10, 3) + 
             compress(bytes, 13, 3);
  return guid;
}

class IfcBuilder {
  private lines: string[] = [];
  private nextId = 100;

  add(entity: string): string {
    const id = `#${this.nextId++}`;
    this.lines.push(`${id}= ${entity};`);
    return id;
  }

  generateGuid(): string {
    return uuidToIfcGuid(crypto.randomUUID());
  }

  build(): string {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    
    return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'), '2;1');
FILE_NAME('WENTCAD_Export.ifc', '${timestamp}', ('WENTCAD User'), ('WENTCAD'), 'WENTCAD Generator', 'WENTCAD', '');
FILE_SCHEMA(('IFC2X3'));
ENDSEC;
DATA;
${this.lines.join('\n')}
ENDSEC;
END-ISO-10303-21;`;
  }
}

export async function exportToIfc(
  zones: Record<string, ZoneData>,
  floors: Record<string, Floor>,
  canvasFloors: Record<string, FloorCanvasState>,
  projectName: string = "WENTCAD Project"
): Promise<void> {
  const b = new IfcBuilder();

  const ownerHistory = b.add(`IFCOWNERHISTORY($,$,$,.ADDED.,$,$,$,1700000000)`);
  
  const lengthUnit = b.add(`IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)`);
  const areaUnit = b.add(`IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`);
  const volUnit = b.add(`IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)`);
  const powerUnit = b.add(`IFCSIUNIT(*,.POWERUNIT.,$,.WATT.)`);
  const tempUnit = b.add(`IFCSIUNIT(*,.THERMODYNAMICTEMPERATUREUNIT.,$,.DEGREE_CELSIUS.)`);
  const ratioUnit = b.add(`IFCSIUNIT(*,.RATIOUNIT.,$,.PERCENT.)`);
  
  const unitAssignment = b.add(`IFCUNITASSIGNMENT((${lengthUnit},${areaUnit},${volUnit},${powerUnit},${tempUnit},${ratioUnit}))`);
  
  // Directions and Points
  const dirZ = b.add(`IFCDIRECTION((0.,0.,1.))`);
  const dirX = b.add(`IFCDIRECTION((1.,0.,0.))`);
  const ptOrigin = b.add(`IFCCARTESIANPOINT((0.,0.,0.))`);
  const axis2placement3d = b.add(`IFCAXIS2PLACEMENT3D(${ptOrigin},${dirZ},${dirX})`);
  
  const globalPlacement = b.add(`IFCLOCALPLACEMENT($,${axis2placement3d})`);
  
  const project = b.add(`IFCPROJECT('${b.generateGuid()}',${ownerHistory},'${projectName}',$,$,$,$,($,$),${unitAssignment})`);
  const site = b.add(`IFCSITE('${b.generateGuid()}',${ownerHistory},'Site',$,$,${globalPlacement},$,$,.ELEMENT.,(0,0,0,0),(0,0,0,0),0.,$,$)`);
  const building = b.add(`IFCBUILDING('${b.generateGuid()}',${ownerHistory},'Building',$,$,${globalPlacement},$,$,.ELEMENT.,$,$,$)`);
  
  b.add(`IFCRELAGGREGATES('${b.generateGuid()}',${ownerHistory},'Project->Site',$,${project},(${site}))`);
  b.add(`IFCRELAGGREGATES('${b.generateGuid()}',${ownerHistory},'Site->Building',$,${site},(${building}))`);

  const storeyIds: string[] = [];

  for (const floor of Object.values(floors)) {
    const zElevation = floor.elevation || 0.0;
    const ptStorey = b.add(`IFCCARTESIANPOINT((0.,0.,${zElevation.toFixed(3)}))`);
    const placement3dStorey = b.add(`IFCAXIS2PLACEMENT3D(${ptStorey},${dirZ},${dirX})`);
    const storeyPlacement = b.add(`IFCLOCALPLACEMENT(${globalPlacement},${placement3dStorey})`);
    
    const storey = b.add(`IFCBUILDINGSTOREY('${b.generateGuid()}',${ownerHistory},'${floor.name}',$,$,${storeyPlacement},$,$,.ELEMENT.,${zElevation.toFixed(3)})`);
    storeyIds.push(storey);

    const spaceIds: string[] = [];
    const floorZones = Object.values(zones).filter(z => z.floorId === floor.id);
    const canvasFloor = canvasFloors[floor.id];
    const scaleFactor = canvasFloor?.scaleFactor || 1;

    for (const zone of floorZones) {
      const height = zone.height || 3.0;
      
      const poly = canvasFloor?.polygons?.find(p => p.zoneId === zone.id);
      let shapeDef = '$';

      if (poly && poly.points.length >= 6) {
        // Build Profile
        const pointIds = [];
        for (let i = 0; i < poly.points.length; i += 2) {
          // Convert from px to meters
          // Note: Konva origin is top-left, IFC is bottom-left, Y might need inversion depending on preference, 
          // but we'll keep it as is or invert Y if needed. Let's invert Y for CAD standard.
          const x = (poly.points[i] * scaleFactor).toFixed(4);
          const y = (-poly.points[i+1] * scaleFactor).toFixed(4);
          pointIds.push(b.add(`IFCCARTESIANPOINT((${x},${y}))`));
        }
        
        // Close polygon if needed (IFCPOLYLINE needs to be closed or open, usually we just pass points)
        const polyline = b.add(`IFCPOLYLINE((${pointIds.join(',')},${pointIds[0]}))`);
        const profileDef = b.add(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,${polyline})`);
        
        // Extrude solid
        const extrudePlacement = b.add(`IFCAXIS2PLACEMENT3D(${ptOrigin},${dirZ},${dirX})`);
        const solid = b.add(`IFCEXTRUDEDAREASOLID(${profileDef},${extrudePlacement},${dirZ},${height.toFixed(3)})`);
        
        const shapeRepresentation = b.add(`IFCSHAPEREPRESENTATION($,'Body','SweptSolid',(${solid}))`);
        shapeDef = b.add(`IFCPRODUCTDEFINITIONSHAPE($,$,(${shapeRepresentation}))`);
      }

      // Space Local Placement (relative to storey)
      const ptSpaceOrigin = b.add(`IFCCARTESIANPOINT((0.,0.,0.))`); // usually offsets are handled in polygon coords relative to 0,0
      const spaceAxis2Pl = b.add(`IFCAXIS2PLACEMENT3D(${ptSpaceOrigin},${dirZ},${dirX})`);
      const spacePlacement = b.add(`IFCLOCALPLACEMENT(${storeyPlacement},${spaceAxis2Pl})`);
      
      const longName = zone.name.replace(/'/g, "''");
      const space = b.add(`IFCSPACE('${b.generateGuid()}',${ownerHistory},'${zone.nr}','${longName}','${zone.activityType}',${spacePlacement},${shapeDef},$,.ELEMENT.,.INTERNAL.,$)`);
      spaceIds.push(space);

      // Add Pset_SpaceThermalDesign
      const heatLoss = 0.0; // WENTCAD currently doesn't track heat loss
      const tempWinter = zone.roomTemp || 20.0;
      const heatGain = zone.totalHeatGain || 0.0;
      const tempSummer = zone.roomTemp || 24.0;
      const humiditySummer = zone.roomRH || 50.0;

      const p1 = b.add(`IFCPROPERTYSINGLEVALUE('TotalHeatLoss',$,IFCPOWERMEASURE(${heatLoss.toFixed(2)}),$)`);
      const p2 = b.add(`IFCPROPERTYSINGLEVALUE('SpaceTemperatureWinterMin',$,IFCTHERMODYNAMICTEMPERATUREMEASURE(${tempWinter.toFixed(2)}),$)`);
      const p3 = b.add(`IFCPROPERTYSINGLEVALUE('TotalHeatGain',$,IFCPOWERMEASURE(${heatGain.toFixed(2)}),$)`);
      const p4 = b.add(`IFCPROPERTYSINGLEVALUE('SpaceTemperatureSummerMax',$,IFCTHERMODYNAMICTEMPERATUREMEASURE(${tempSummer.toFixed(2)}),$)`);
      const p5 = b.add(`IFCPROPERTYSINGLEVALUE('SpaceHumiditySummer',$,IFCPOSITIVERATIOMEASURE(${humiditySummer.toFixed(2)}),$)`); // PositiveRatioMeasure for % or REAL
      
      const pset = b.add(`IFCPROPERTYSET('${b.generateGuid()}',${ownerHistory},'Pset_SpaceThermalDesign',$,(${p1},${p2},${p3},${p4},${p5}))`);
      b.add(`IFCRELDEFINESBYPROPERTIES('${b.generateGuid()}',${ownerHistory},$,$,(${space}),${pset})`);
    }

    if (spaceIds.length > 0) {
      b.add(`IFCRELAGGREGATES('${b.generateGuid()}',${ownerHistory},'Storey->Spaces',$,${storey},(${spaceIds.join(',')}))`);
    }
  }

  if (storeyIds.length > 0) {
    b.add(`IFCRELAGGREGATES('${b.generateGuid()}',${ownerHistory},'Building->Storeys',$,${building},(${storeyIds.join(',')}))`);
  }

  const ifcData = b.build();
  console.log("GENERATED_IFC_DATA_START");
  console.log(ifcData);
  console.log("GENERATED_IFC_DATA_END");
  
  // Trigger download
  const blob = new Blob([ifcData], { type: 'application/step' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `WENTCAD_Export_${new Date().toISOString().slice(0,10)}.ifc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
