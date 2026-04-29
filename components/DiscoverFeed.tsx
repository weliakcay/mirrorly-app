import React, { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeft, Compass, Heart, Search, Sparkles, Store } from 'lucide-react';
import { CatalogItem } from '../types';
import { formatPrice } from '../utils/currency';

interface DiscoverFeedProps {
  items: CatalogItem[];
  favoriteIds: Set<string>;
  onBack: () => void;
  onSelectItem: (item: CatalogItem) => void;
  onToggleFavorite: (item: CatalogItem) => void;
}

const sectionize = (items: CatalogItem[]) => {
  const featured = items.slice(0, 4);
  const trending = items.slice(4, 10);
  const boutiques = items.slice(0, 8);

  return [
    {
      key: 'featured',
      title: 'Secili Parcalar',
      subtitle: 'Giris yapan kullanicilar icin acilan ilk vitrin',
      items: featured,
    },
    {
      key: 'trending',
      title: 'One Cikanlar',
      subtitle: 'Try-on akisi icin uygun urunler',
      items: trending.length > 0 ? trending : featured,
    },
    {
      key: 'boutiques',
      title: 'Butiklerden',
      subtitle: 'Farkli magazalardan secmeler',
      items: boutiques,
    },
  ].filter((section) => section.items.length > 0);
};

const DiscoverFeed: React.FC<DiscoverFeedProps> = ({
  items,
  favoriteIds,
  onBack,
  onSelectItem,
  onToggleFavorite,
}) => {
  const [query, setQuery] = useState('');
  const [hiddenItemIds, setHiddenItemIds] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  const hideItem = (itemId: string) => {
    setHiddenItemIds((current) => (current.includes(itemId) ? current : [...current, itemId]));
  };

  const filteredItems = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    const visibleItems = items.filter(
      ({ garment }) => !!garment.imageUrl?.trim() && !hiddenItemIds.includes(garment.id)
    );
    if (!normalized) return visibleItems;

    return visibleItems.filter(({ garment, merchant }) =>
      [garment.name, garment.description, merchant.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [items, deferredQuery, hiddenItemIds]);

  const sections = useMemo(() => sectionize(filteredItems), [filteredItems]);
  const heroItem = filteredItems[0] || items[0];

  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">Kesfet</p>
      </div>

      <div className="px-6 pb-5">
        <div className="rounded-[2rem] bg-white/82 border border-white px-5 py-5 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400 mb-2">Mirrorly</p>
              <h2 className="font-serif text-3xl text-gray-900">Kesfet</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Giris yapan musteri artik QR disinda da urun gezebiliyor.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg">
              <Compass className="w-5 h-5 text-boutique-gold" />
            </div>
          </div>

          <div className="mt-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Urun, aciklama veya butik ara"
              className="w-full rounded-2xl bg-boutique-cream border border-gray-200 pl-11 pr-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8 hide-scrollbar">
        {heroItem && (
          <button
            onClick={() => onSelectItem(heroItem)}
            className="w-full mb-6 relative rounded-[2rem] overflow-hidden shadow-xl text-left group"
          >
            <div className="aspect-[4/5] bg-gray-100">
              <img
                src={heroItem.garment.imageUrl}
                alt={heroItem.garment.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                onError={() => hideItem(heroItem.garment.id)}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-white/86 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.24em] text-gray-600">
                {heroItem.merchant.name}
              </span>
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(heroItem);
              }}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/86 backdrop-blur-md flex items-center justify-center"
            >
              <Heart
                className={`w-5 h-5 ${
                  favoriteIds.has(heroItem.garment.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-gray-500'
                }`}
              />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 text-boutique-gold mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-[11px] uppercase tracking-[0.24em]">Secili</span>
              </div>
              <h3 className="font-serif text-3xl text-white">{heroItem.garment.name}</h3>
              <p className="text-white/72 text-sm mt-2 line-clamp-2">
                {heroItem.garment.description}
              </p>
            </div>
          </button>
        )}

        {sections.length === 0 ? (
          <div className="rounded-[2rem] bg-white/82 border border-white px-6 py-10 text-center shadow-sm">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-gray-900 mb-2">Urun bulunamadi</h3>
            <p className="text-sm text-gray-500">Aramani temizleyip tekrar deneyebilirsin.</p>
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.key} className="mb-8">
              <div className="mb-4">
                <h3 className="font-serif text-2xl text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{section.subtitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {section.items.map((item) => (
                  <div
                    key={`${section.key}-${item.garment.id}`}
                    className="text-left bg-white rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative"
                  >
                    <button
                      onClick={() => onSelectItem(item)}
                      className="w-full text-left"
                    >
                      <div className="aspect-[3/4] bg-gray-100">
                        <img
                          src={item.garment.imageUrl}
                          alt={item.garment.name}
                          className="w-full h-full object-cover"
                          onError={() => hideItem(item.garment.id)}
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 mb-2">
                          {item.merchant.name}
                        </p>
                        <h4 className="font-serif text-lg text-gray-900 line-clamp-2">
                          {item.garment.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.garment.description}
                        </p>
                        <p className="text-sm text-gray-900 mt-3 font-medium">{formatPrice(item.garment.price, item.garment.currency || item.merchant.currency)}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => onToggleFavorite(item)}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-sm"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favoriteIds.has(item.garment.id)
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-gray-500'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscoverFeed;
