import { X, Ruler, Check } from 'lucide-react';

interface DxfUnitModalProps {
  isOpen: boolean;
  onConfirm: (multiplier: number, unitLabel: string) => void;
  onCancel: () => void;
  fileName: string;
}

export function DxfUnitModal({ isOpen, onConfirm, onCancel, fileName }: DxfUnitModalProps) {
  if (!isOpen) return null;

  const units = [
    { label: 'Milimetry (mm)', multiplier: 0.001, desc: '1 jednostka = 1 mm' },
    { label: 'Centymetry (cm)', multiplier: 0.01, desc: '1 jednostka = 1 cm' },
    { label: 'Metry (m)', multiplier: 1.0, desc: '1 jednostka = 1 m' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Ruler className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Import Pliku DXF</h2>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm text-amber-900 leading-relaxed">
              Wykryto plik wektorowy: <span className="font-bold">{fileName}</span>.
              W jakich jednostkach został on zapisany w programie CAD?
            </p>
          </div>

          <div className="grid gap-3">
            {units.map((u) => (
              <button
                key={u.multiplier}
                onClick={() => onConfirm(u.multiplier, u.label)}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all group text-left"
              >
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-indigo-700">{u.label}</div>
                  <div className="text-xs text-gray-500">{u.desc}</div>
                </div>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                  <Check className="w-4 h-4 text-transparent group-hover:text-indigo-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50">
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors text-sm"
          >
            Anuluj import
          </button>
        </div>
      </div>
    </div>
  );
}
