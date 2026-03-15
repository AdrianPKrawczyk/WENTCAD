import { useZoneStore } from '../stores/useZoneStore';

export function ZonePropertiesPanel() {
  const selectedZoneId = useZoneStore((state) => state.selectedZoneId);
  const zones = useZoneStore((state) => state.zones);
  const updateZone = useZoneStore((state) => state.updateZone);

  const activeZone = selectedZoneId ? zones[selectedZoneId] : null;

  if (!activeZone) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 p-6 text-center text-sm">
        <p>Wybierz strefę w tabeli, aby wyświetlić szczegóły.</p>
      </div>
    );
  }

  const handleChange = (field: keyof typeof activeZone, value: string | number | boolean) => {
    updateZone(activeZone.id, { [field]: value });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-sm w-80 overflow-y-auto">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Właściwości Strefy</h2>
        <p className="text-xs text-gray-500 flex justify-between mt-1">
          <span className="font-mono">ID: {activeZone.id}</span>
          <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-bold">{activeZone.nr}</span>
        </p>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Sekcja: Informacje podstawowe */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Geometria</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nazwa</label>
              <input 
                type="text" 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                value={activeZone.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Powierzchnia [m²]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.area}
                  onChange={(e) => handleChange('area', Number(e.target.value))}
                  disabled={activeZone.isAreaLinkedToGeometry}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Wysokość [m]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.height}
                  onChange={(e) => handleChange('height', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sekcja: Termodynamika */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Termodynamika</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">T_room [°C]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.roomTemp}
                  onChange={(e) => handleChange('roomTemp', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">RH_room [%]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.roomRH}
                  onChange={(e) => handleChange('roomRH', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">T_nawiew [°C]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent border-blue-200"
                  value={activeZone.supplyTemp}
                  onChange={(e) => handleChange('supplyTemp', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">RH_nawiew [%]</label>
                <input 
                  type="number" 
                  className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                  value={activeZone.supplyRH}
                  onChange={(e) => handleChange('supplyRH', Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Zyski całkowite Q_tot [W]</label>
              <input 
                type="number" 
                className="w-full text-sm border-b border-gray-300 focus:border-red-500 focus:outline-none py-1 bg-red-50"
                value={activeZone.totalHeatGain}
                onChange={(e) => handleChange('totalHeatGain', Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Sekcja: Akustyka */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Akustyka</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maks. Hałas [dB(A)]</label>
              <input 
                type="number" 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                value={activeZone.maxAllowedDbA}
                onChange={(e) => handleChange('maxAllowedDbA', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chłonność akustyczna</label>
              <select 
                className="w-full text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                value={activeZone.acousticAbsorption}
                onChange={(e) => handleChange('acousticAbsorption', e.target.value)}
              >
                <option value="HARD">Twarda (HARD)</option>
                <option value="MEDIUM">Średnia (MEDIUM)</option>
                <option value="SOFT">Miękka (SOFT)</option>
              </select>
            </div>
          </div>
        </section>
        
        {/* Wyniki Obliczeń */}
        <section className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Wyniki Silnika Fizycznego</h3>
          <div className="bg-blue-50 rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-800">V_final (Nawiew)</span>
              <span className="text-lg font-bold text-blue-900">{activeZone.calculatedVolume} <span className="text-xs font-normal">m³/h</span></span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-red-800">V_final (Wyciąg)</span>
              <span className="text-lg font-bold text-red-900">{activeZone.calculatedExhaust} <span className="text-xs font-normal">m³/h</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Net Balance</span>
              <span className={`text-sm font-bold ${activeZone.netBalance > 0 ? 'text-blue-600' : activeZone.netBalance < 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {activeZone.netBalance} <span className="text-xs font-normal">m³/h</span>
              </span>
            </div>
          </div>
        </section>

        {/* Sekcja: Transfery */}
        <section className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Transfery Przepływu</h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-blue-600 mb-1 block">Wlatuje z innych (IN): {activeZone.transferInSum} m³/h</span>
              {activeZone.transferIn.length === 0 ? (
                <span className="text-xs text-gray-400 italic">Brak transferów do tego pokoju.</span>
              ) : (
                <ul className="text-xs space-y-1 bg-gray-50 p-2 rounded border border-gray-100">
                  {activeZone.transferIn.map((t, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-gray-600">Z: {zones[t.roomId]?.name || t.roomId}</span>
                      <span className="font-medium text-blue-700">+{t.volume}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <span className="text-xs font-medium text-red-600 mb-1 block">Wylatuje stąd (OUT): {activeZone.transferOutSum} m³/h</span>
              {activeZone.transferOut.length === 0 ? (
                <span className="text-xs text-gray-400 italic">Brak transferów z tego pokoju.</span>
              ) : (
                <ul className="text-xs space-y-1 bg-gray-50 p-2 rounded border border-gray-100">
                  {activeZone.transferOut.map((t, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-gray-600">Do: {zones[t.roomId]?.name || t.roomId}</span>
                      <span className="font-medium text-red-700">-{t.volume}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
