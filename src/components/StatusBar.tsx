import { useZoneStore } from '../stores/useZoneStore';


export function StatusBar() {
  const zones = useZoneStore((state) => state.zones);
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
                      `0 m³/h (Zrównoważony)`;

  return (
    <div className="h-8 bg-gray-800 text-gray-300 flex items-center px-4 text-xs font-medium justify-between shadow-inner z-20">
      <div className="flex space-x-6 items-center">
        
        {/* Nawiew Badges */}
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-supply)]"></span>
          <span>Nawiew:</span>
          {Object.entries(supplyBySystem).map(([sysId, vol]) => (
            <span key={`sup-${sysId}`} className="bg-gray-700 px-2 py-0.5 rounded text-blue-300 border border-gray-600">
              {sysId}: {vol} m³/h
            </span>
          ))}
          {Object.keys(supplyBySystem).length === 0 && <span className="text-gray-500">Brak</span>}
        </div>

        <div className="w-px h-4 bg-gray-600"></div>

        {/* Wyciąg Badges */}
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-exhaust)]"></span>
          <span>Wyciąg:</span>
          {Object.entries(exhaustBySystem).map(([sysId, vol]) => (
            <span key={`exh-${sysId}`} className="bg-gray-700 px-2 py-0.5 rounded text-red-300 border border-gray-600">
              {sysId}: {vol} m³/h
            </span>
          ))}
          {Object.keys(exhaustBySystem).length === 0 && <span className="text-gray-500">Brak</span>}
        </div>

      </div>
      
      <div className="flex items-center space-x-2">
        <span>Bilans obiegu:</span>
        <span className={`px-2 py-0.5 rounded text-white ${netBalance > 0 ? 'bg-blue-600' : netBalance < 0 ? 'bg-yellow-600 text-black' : 'bg-green-600'}`}>
          {balanceText}
        </span>
      </div>
    </div>
  );
}
