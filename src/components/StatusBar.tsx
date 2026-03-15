import { useZoneStore } from '../stores/useZoneStore';

export function StatusBar() {
  // UWAGA: wybieramy tylko potrzebne obiekty aby uniknąć nieskończonej pętli re-renderów w Zustand
  const zones = useZoneStore((state) => state.zones);

  // Placeholder na sumę bilansu
  // W idealnym scenariuszu będziemy mieli oddzielny stan na "Nawiew" i "Wyciąg" pochodzący z `useDuctStore`
  const totalSupply = Object.values(zones).reduce((sum, zone) => sum + zone.calculatedVolume, 0);
  
  // W przypadku braku instalacji wyciągowej na razie robimy 0, albo kopiujemy nawiew dla równowagi (mocked for UI balance)
  const totalExhaust = Math.round(totalSupply * 0.9); // Zazwyczaj wyciąg to 90-100% nawiewu

  const isBalanced = Math.abs(totalSupply - totalExhaust) < 50; // Oczywiste uproszczenie

  return (
    <div className="h-8 bg-gray-800 text-gray-300 flex items-center px-4 text-xs font-medium justify-between shadow-inner z-20">
      <div className="flex space-x-6">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-supply)]"></span>
          <span>Całkowity Nawiew (V_sup):</span>
          <span className="text-white font-bold">{totalSupply} m³/h</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-exhaust)]"></span>
          <span>Całkowity Wyciąg (V_exh):</span>
          <span className="text-white font-bold">{totalExhaust} m³/h</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <span>Bilans Sieci:</span>
        <span className={`px-2 py-0.5 rounded text-white ${isBalanced ? 'bg-green-600' : 'bg-red-600'}`}>
          {isBalanced ? 'Zrównoważony' : 'Niezrównoważony'}
        </span>
      </div>
    </div>
  );
}
