import type { ZoneData, SystemDef } from '../types';

export const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

export const resolveZoneStyle = (
  zone: ZoneData,
  systems: SystemDef[],
  globalOpacity: number = 20
) => {
  if (!zone) return { color: null, patternId: null };

  const sSys = systems.find(s => s.id === zone.systemSupplyId);
  const eSys = systems.find(s => s.id === zone.systemExhaustId);

  let finalColor = null;
  let finalPatternId = null;

  // -- Color Resolution --
  // 1. Priority check
  if (sSys?.isColorPriority && sSys.color) {
    finalColor = sSys.color;
  } else if (eSys?.isColorPriority && eSys.color) {
    finalColor = eSys.color;
  } 
  // 2. Fallback check (if one is missing)
  else if (sSys?.color && (!eSys || !eSys.color)) {
    finalColor = sSys.color;
  } else if (eSys?.color && (!sSys || !sSys.color)) {
    finalColor = eSys.color;
  }
  // 3. Default (Supply wins)
  else if (sSys?.color) {
    finalColor = sSys.color;
  } else if (eSys?.color) {
    finalColor = eSys.color;
  }

  // -- Pattern Resolution --
  // 1. Priority check
  if (sSys?.isPatternPriority && sSys.patternId) {
    finalPatternId = sSys.patternId;
  } else if (eSys?.isPatternPriority && eSys.patternId) {
    finalPatternId = eSys.patternId;
  }
  // 2. Fallback check
  else if (sSys?.patternId && (!eSys || !eSys.patternId)) {
    finalPatternId = sSys.patternId;
  } else if (eSys?.patternId && (!sSys || !sSys.patternId)) {
    finalPatternId = eSys.patternId;
  }
  // 3. Default (Supply wins)
  else if (sSys?.patternId) {
    finalPatternId = sSys.patternId;
  } else if (eSys?.patternId) {
    finalPatternId = eSys.patternId;
  }

  let resolvedColor = null;
  if (finalColor) {
    // Simplification: if the system providing the color has local opacity, use it
    let opacityToUse = globalOpacity;
    if (finalColor === sSys?.color && sSys?.opacity !== undefined) {
      opacityToUse = sSys.opacity;
    } else if (finalColor === eSys?.color && eSys?.opacity !== undefined) {
      opacityToUse = eSys.opacity;
    }

    resolvedColor = hexToRgba(finalColor, opacityToUse);
  }

  return { color: resolvedColor, patternId: finalPatternId };
};
