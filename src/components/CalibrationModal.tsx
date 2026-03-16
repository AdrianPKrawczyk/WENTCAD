import { useState } from 'react';
import { X, Ruler, Check } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onConfirm: (realLength: number) => void;
  onCancel: () => void;
  pixelDistance: number;
}

export function CalibrationModal({ isOpen, onConfirm, onCancel, pixelDistance }: CalibrationModalProps) {
  const [realLength, setRealLength] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const value = parseFloat(realLength);
    if (!isNaN(value) && value > 0) {
      onConfirm(value);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Ruler className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Kalibracja Skali</h2>
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
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-sm text-indigo-900 leading-relaxed">
              Zdefiniowałeś odcinek o długości <span className="font-bold">{pixelDistance.toFixed(1)} pikseli</span>. 
              Podaj jego rzeczywistą długość w metrach, aby obliczyć skalę.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Rzeczywista długość (metry)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={realLength}
                onChange={(e) => setRealLength(e.target.value)}
                placeholder="np. 5.0"
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-lg"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                m
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            disabled={!realLength || parseFloat(realLength) <= 0}
            className="flex-[2] px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Check className="w-5 h-5" />
            Zapisz i skalibruj
          </button>
        </div>
      </div>
    </div>
  );
}
