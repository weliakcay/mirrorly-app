import React, { useState } from 'react';
import { ArrowLeft, Chrome, ShieldCheck } from 'lucide-react';

interface CustomerAuthProps {
  onBack: () => void;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn?: (email: string, password: string, isRegister: boolean) => Promise<void>;
  isPending?: boolean;
}

const CustomerAuth: React.FC<CustomerAuthProps> = ({ onBack, onGoogleSignIn, onEmailSignIn, isPending = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await onGoogleSignIn();
    } catch (err: any) {
      setError(err?.message || 'Google girisi basarisiz oldu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onEmailSignIn) return;

    if (!email || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onEmailSignIn(email, password, isRegister);
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('email-already-in-use')) {
        setError('Bu e-posta zaten kayıtlı. Giriş yap\'ı seçin.');
      } else if (errMsg.includes('wrong-password')) {
        setError('Yanlış şifre.');
      } else if (errMsg.includes('user-not-found')) {
        setError('Kullanıcı bulunamadı. Kayıt ol\'u seçin.');
      } else {
        setError(errMsg || 'İşlem başarısız oldu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in overflow-y-auto">
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 sm:px-7 pb-10">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-white/80 border border-gray-200 shadow-xl flex items-center justify-center">
              <ShieldCheck className="w-9 h-9 text-gray-900" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-gray-400 mb-3">
              Mirrorly
            </p>
            <h2 className="font-serif text-3xl text-gray-900 mb-3">
              {isPending ? 'Giris tamamlanıyor' : authMode === 'google' ? 'Google ile devam et' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isPending
                ? 'Onaydan sonra oturumun cihaza geri yazılması birkaç saniye sürebilir.'
                : 'Hesabına girerek favorilerini kaydedebilir, deneme geçmişini görebilir ve keşfet akışını kullanabilirsin.'}
            </p>
          </div>

          {authMode === 'google' ? (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isPending}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gray-900 text-white py-4 shadow-xl hover:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Chrome className="w-5 h-5" />
                <span className="font-medium">
                  {isPending ? 'Oturum tamamlanıyor...' : isSubmitting ? 'Google bağlanıyor...' : 'Google ile giriş yap'}
                </span>
              </button>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">veya</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={() => setAuthMode('email')}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white text-gray-700 py-3 shadow-sm hover:bg-gray-50 transition-all"
              >
                <span className="font-medium">E-posta ile devam et</span>
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="E-posta"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting || isPending}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isPending}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-400 focus:border-gray-900 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white py-3 shadow-xl hover:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'İşleniyor...' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                  }}
                  disabled={isSubmitting || isPending}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors underline disabled:opacity-60"
                >
                  {isRegister ? 'Zaten hesabın var mı? Giriş yap' : 'Henüz hesabın yok mu? Kayıt ol'}
                </button>
              </div>

              <button
                onClick={() => setAuthMode('google')}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white text-gray-700 py-3 shadow-sm hover:bg-gray-50 transition-all text-sm"
              >
                <Chrome className="w-4 h-4" />
                <span>Google ile geri dön</span>
              </button>
            </>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {authMode === 'google' && (
            <div className="mt-8 rounded-3xl bg-white/70 backdrop-blur-sm border border-white px-5 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400 mb-3">Girişle açılanlar</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Tek tık giriş</li>
                <li>✓ Favori ürünlerini kaydetme</li>
                <li>✓ Bulut geçmişine erişim</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
