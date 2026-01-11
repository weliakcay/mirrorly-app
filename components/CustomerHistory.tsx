
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingBag, Calendar, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';
import { getHistory, clearHistory } from '../services/historyService';

interface CustomerHistoryProps {
  onBack: () => void;
}

const CustomerHistory: React.FC<CustomerHistoryProps> = ({ onBack }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
  };

  const handleClear = () => {
      if(confirm("Are you sure you want to clear your history?")) {
          clearHistory();
          setItems([]);
          setSelectedItem(null);
      }
  }

  // Detail View (Modal-ish)
  if (selectedItem) {
      return (
        <div className="h-full flex flex-col bg-boutique-cream animate-fade-in relative">
            <div className="absolute top-4 left-4 z-10">
                <button onClick={() => setSelectedItem(null)} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-900" />
                </button>
            </div>

            <div className="flex-1 relative bg-gray-100">
                <img 
                    src={selectedItem.resultImageUrl} 
                    alt="Past Result" 
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="bg-white p-6 rounded-t-3xl -mt-6 relative z-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-serif text-2xl text-gray-900">{selectedItem.garment.name}</h3>
                        <p className="text-sm text-gray-500">{selectedItem.garment.boutiqueName}</p>
                    </div>
                    <span className="font-sans font-medium text-lg">${selectedItem.garment.price}</span>
                </div>
                
                <button 
                    onClick={() => {
                        if (selectedItem.garment.shopUrl) {
                            window.open(selectedItem.garment.shopUrl, '_blank');
                        } else {
                            alert("This item is available in-store only.");
                        }
                    }}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                    <ShoppingBag className="w-5 h-5" />
                    {selectedItem.garment.shopUrl ? 'Buy Online Now' : 'Find in Boutique'}
                </button>
            </div>
        </div>
      )
  }

  // List View
  return (
    <div className="h-full flex flex-col bg-gray-50 animate-fade-in">
        <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="font-serif text-xl text-gray-900">My Reflections</h2>
            <div className="w-6"></div> {/* Spacer for center alignment */}
        </div>

        <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                    <Calendar className="w-12 h-12 text-gray-300" />
                    <p className="font-serif text-xl text-gray-400">The mirror hasn't seen you yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedItem(item)}
                            className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-white shadow-sm cursor-pointer"
                        >
                            <img 
                                src={item.resultImageUrl} 
                                alt={item.garment.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-xs font-medium truncate">{item.garment.name}</p>
                                <p className="text-gray-300 text-[10px]">{formatDate(item.timestamp)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {items.length > 0 && (
            <div className="p-6 text-center">
                <button onClick={handleClear} className="text-xs text-red-300 hover:text-red-500 flex items-center justify-center gap-1 mx-auto transition-colors">
                    <Trash2 className="w-3 h-3" /> Clear History
                </button>
            </div>
        )}
    </div>
  );
};

export default CustomerHistory;
