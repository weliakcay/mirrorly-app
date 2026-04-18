import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Coins, Users, Store, TrendingUp, Download } from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CustomerProfile, MerchantProfile, HistoryItem } from '../types';

interface AdminPanelProps {
  onBack: () => void;
  onLogout: () => void;
  userEmail: string;
}

interface MerchantStats extends MerchantProfile {
  productCount: number;
  totalTryOns: number;
}

interface CustomerStats extends CustomerProfile {
  tryOnCount: number;
  lastActivity?: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, onLogout, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'merchants' | 'customers'>('merchants');
  const [merchants, setMerchants] = useState<MerchantStats[]>([]);
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'active' | 'credits' | 'products'>('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load merchants
      const merchantDocs = await getDocs(collection(db, 'merchant_profiles'));
      const merchantsList: MerchantStats[] = [];

      for (const doc of merchantDocs.docs) {
        const profile = doc.data() as MerchantProfile;
        const garmentDocs = await getDocs(collection(db, `merchant_inventory/${doc.id}/garments`));
        const productCount = garmentDocs.size;

        // Count total try-ons from history
        let totalTryOns = 0;
        try {
          const historyDocs = await getDocs(
            collection(db, `merchant_inventory/${doc.id}/history`)
          );
          totalTryOns = historyDocs.size;
        } catch (e) {
          console.warn('History fetch skipped for merchant', doc.id);
        }

        merchantsList.push({
          ...profile,
          productCount,
          totalTryOns,
        });
      }

      setMerchants(merchantsList);

      // Load customers
      const customerDocs = await getDocs(collection(db, 'customer_profiles'));
      const customersList: CustomerStats[] = [];

      for (const doc of customerDocs.docs) {
        const profile = doc.data() as CustomerProfile;

        // Count try-ons from history
        let tryOnCount = 0;
        let lastActivity = 0;
        try {
          const historyDocs = await getDocs(
            collection(db, `customer_profiles/${doc.id}/history`)
          );
          tryOnCount = historyDocs.size;
          if (historyDocs.size > 0) {
            const items = historyDocs.docs.map(d => d.data() as HistoryItem);
            lastActivity = Math.max(...items.map(i => i.timestamp || 0));
          }
        } catch (e) {
          console.warn('History fetch skipped for customer', doc.id);
        }

        customersList.push({
          ...profile,
          tryOnCount,
          lastActivity,
        });
      }

      setCustomers(customersList);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedMerchants = [...merchants].sort((a, b) => {
    if (sortBy === 'active') return b.totalTryOns - a.totalTryOns;
    if (sortBy === 'credits') return b.credits - a.credits;
    return b.productCount - a.productCount;
  });

  const sortedCustomers = [...customers].sort((a, b) => {
    return b.tryOnCount - a.tryOnCount;
  });

  const totalMerchants = merchants.length;
  const totalCustomers = customers.length;
  const totalProducts = merchants.reduce((sum, m) => sum + m.productCount, 0);
  const totalTryOns = merchants.reduce((sum, m) => sum + m.totalTryOns, 0) +
                     customers.reduce((sum, c) => sum + c.tryOnCount, 0);

  return (
    <div className="h-full min-h-0 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-serif text-2xl text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500 mt-1">Giriş: {userEmail}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">Mağazalar</p>
                  <p className="font-serif text-3xl text-gray-900 mt-2">{totalMerchants}</p>
                </div>
                <Store className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">Müşteriler</p>
                  <p className="font-serif text-3xl text-gray-900 mt-2">{totalCustomers}</p>
                </div>
                <Users className="w-10 h-10 text-emerald-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">Ürünler</p>
                  <p className="font-serif text-3xl text-gray-900 mt-2">{totalProducts}</p>
                </div>
                <Download className="w-10 h-10 text-amber-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">Denemeler</p>
                  <p className="font-serif text-3xl text-gray-900 mt-2">{totalTryOns}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('merchants')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'merchants'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mağazalar ({totalMerchants})
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'customers'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Müşteriler ({totalCustomers})
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Veriler yükleniyor...</p>
                </div>
              ) : activeTab === 'merchants' ? (
                <div className="space-y-4">
                  {/* Sort buttons */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setSortBy('active')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'active'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      En Aktif
                    </button>
                    <button
                      onClick={() => setSortBy('products')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'products'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      En Çok Ürün
                    </button>
                    <button
                      onClick={() => setSortBy('credits')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === 'credits'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      En Çok Kredi
                    </button>
                  </div>

                  {/* Merchants List */}
                  {sortedMerchants.map((merchant) => (
                    <div key={merchant.uid} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <h3 className="font-serif text-lg text-gray-900">{merchant.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{merchant.uid}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Ürünler</p>
                          <p className="font-serif text-xl text-gray-900 mt-1">{merchant.productCount}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Denemeler</p>
                          <p className="font-serif text-xl text-gray-900 mt-1">{merchant.totalTryOns}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Kredi</p>
                          <p className="font-serif text-xl text-gray-900 mt-1 flex items-center justify-center gap-1">
                            <Coins className="w-4 h-4" />
                            {merchant.credits}
                          </p>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            merchant.totalTryOns > 10
                              ? 'bg-emerald-100 text-emerald-700'
                              : merchant.totalTryOns > 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {merchant.totalTryOns > 10 ? 'Aktif' : merchant.totalTryOns > 0 ? 'Kullanımda' : 'Pasif'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Customers List */}
                  {sortedCustomers.map((customer) => (
                    <div key={customer.uid} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <h3 className="font-serif text-lg text-gray-900">{customer.displayName || customer.email}</h3>
                          <p className="text-xs text-gray-500 mt-1">{customer.email}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Denemeler</p>
                          <p className="font-serif text-xl text-gray-900 mt-1">{customer.tryOnCount}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-xs text-gray-500 uppercase tracking-widest">Kredi</p>
                          <p className="font-serif text-xl text-gray-900 mt-1 flex items-center justify-center gap-1">
                            <Coins className="w-4 h-4" />
                            {customer.credits}
                          </p>
                        </div>
                        <div className="col-span-3 text-right">
                          {customer.lastActivity ? (
                            <span className="text-xs text-gray-500">
                              Son: {new Date(customer.lastActivity).toLocaleDateString('tr-TR')}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Henüz aktivite yok</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
