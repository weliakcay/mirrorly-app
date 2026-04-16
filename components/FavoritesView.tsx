import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { FavoriteItem } from '../types';
import { formatPrice } from '../utils/currency';

interface FavoritesViewProps {
  items: FavoriteItem[];
  onBack: () => void;
  onSelectItem: (item: FavoriteItem) => void;
  onRemove: (item: FavoriteItem) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({
  items,
  onBack,
  onSelectItem,
  onRemove,
}) => {
  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">Favoriler</p>
      </div>

      <div className="px-6 pb-5">
        <div className="rounded-[2rem] bg-white/82 border border-white px-5 py-5 shadow-lg">
          <h2 className="font-serif text-3xl text-gray-900">Favoriler</h2>
          <p className="text-sm text-gray-500 mt-2">
            Kesfette begenip sonra donmek istedigin urunleri burada tut.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8 hide-scrollbar">
        {items.length === 0 ? (
          <div className="rounded-[2rem] bg-white/82 border border-white px-6 py-10 text-center shadow-sm">
            <Heart className="w-8 h-8 text-gray-300 mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-gray-900 mb-2">Henuz favori yok</h3>
            <p className="text-sm text-gray-500">Kesfet ekranindan urunleri kalbine ekleyebilirsin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm"
              >
                <button className="w-full text-left" onClick={() => onSelectItem(item)}>
                  <div className="aspect-[3/4] bg-gray-100">
                    <img
                      src={item.garment.imageUrl}
                      alt={item.garment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 mb-2">
                      {item.merchant.name}
                    </p>
                    <h4 className="font-serif text-lg text-gray-900 line-clamp-2">
                      {item.garment.name}
                    </h4>
                    <p className="text-sm text-gray-900 mt-3 font-medium">{formatPrice(item.garment.price, item.garment.currency || item.merchant.currency)}</p>
                  </div>
                </button>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onRemove(item)}
                    className="w-full rounded-xl border border-gray-200 py-2 text-xs uppercase tracking-[0.18em] text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
                  >
                    Favoriden Cikar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesView;
