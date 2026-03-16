import { useZoneStore } from '../stores/useZoneStore';
import { useProjectStore } from '../stores/useProjectStore';

export function StatusBar() {
  const zones = useZoneStore((state) => state.zones);
  const syncStatus = useProjectStore((s) => s.syncStatus);
  const syncError = useProjectStore((s) => s.error);
  const zonesArray = Object.values(zones);

  // Group by supply systems
  const supplyBySystem = zonesArray.reduce((acc, zone) => {
    const sysId = zone.systemSupplyId || 'Brak_Naw';
    const vol = zone.calculatedVolume + zone.transferInSum;
    if (vol > 0) {
      acc[sysId] = (acc[sysId] || 0) + vol;
    }
    return acc;
  }, {} as Record<string, number>);

  // Group by exhaust systems
  const exhaustBySystem = zonesArray.reduce((acc, zone) => {
    const sysId = zone.systemExhaustId || 'Brak_Wyc';
    const vol = zone.calculatedExhaust + zone.transferOutSum;
    if (vol > 0) {
      acc[sysId] = (acc[sysId] || 0) + vol;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalSupply = Object.values(supplyBySystem).reduce((a, b) => a + b, 0);
  const totalExhaust = Object.values(exhaustBySystem).reduce((a, b) => a + b, 0);

  const netBalance = totalSupply - totalExhaust;
  
  const balanceText = netBalance > 0 ? `+${netBalance} m³/h (Nadciśnienie)` : 
                      netBalance < 0 ? `${netBalance} m³/h (Podciśnienie)` : 
                      `0 m³/h (Zbilansowany)`;

  return (
    <div className="h-10 bg-gray-900 text-gray-400 flex items-center px-4 text-[11px] font-medium justify-between shadow-inner z-20 border-t border-gray-800">
      <div className="flex space-x-6 items-center">
        
        {/* Nawiew Badges */}
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-supply)]"></span>
          <span>Nawiew:</span>
          {Object.entries(supplyBySystem).map(([sysId, vol]) => (
            <span key={`sup-${sysId}`} className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-400 border border-gray-700">
              {sysId}: {vol}
            </span>
          ))}
        </div>

        <div className="w-px h-3 bg-gray-700"></div>

        {/* Wyciąg Badges */}
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-exhaust)]"></span>
          <span>Wywiew:</span>
          {Object.entries(exhaustBySystem).map(([sysId, vol]) => (
            <span key={`exh-${sysId}`} className="bg-gray-800 px-1.5 py-0.5 rounded text-red-400 border border-gray-700">
              {sysId}: {vol}
            </span>
          ))}
        </div>

        <div className="w-px h-3 bg-gray-700"></div>

        {/* Sync Status */}
        <div className="flex items-center space-x-2 px-2 py-0.5 bg-gray-800/50 rounded border border-gray-800">
          {syncStatus === 'SAVING' ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-blue-400 text-[10px]">Zapisywanie...</span>
            </>
          ) : syncStatus === 'ERROR' ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-red-400 text-[10px]" title={syncError || 'Błąd zapisu'}>Sync Error</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-500 text-[10px]">Zsynchronizowano</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <span>Bilans netto:</span>
        <span className={`px-2 py-1 rounded font-bold text-white ${netBalance > 0 ? 'bg-blue-600' : netBalance < 0 ? 'bg-yellow-600 text-black' : 'bg-green-600'}`}>
          {balanceText}
        </span>
      </div>
    </div>
  );
}
