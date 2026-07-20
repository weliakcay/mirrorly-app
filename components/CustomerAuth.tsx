import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Chrome, ShieldCheck } from 'lucide-react';

interface CustomerAuthProps {
  onBack: () => void;
  /** Legacy fallback: GSI yuklenmediginde popup/redirect ile Google girisi */
  onGoogleSignIn: () => Promise<void>;
  /** Modern GSI: Google'dan donen ID token'i Firebase'e iletir */
  onGoogleCredentialSignIn?: (idToken: string) => Promise<void>;
  /** Email + sifre login/kayit */
  onEmailSignIn?: (email: string, password: string, isRegister: boolean) => Promise<void>;
  isPending?: boolean;
}

const GSI_POLL_INTERVAL_MS = 100;
const GSI_POLL_MAX_ATTEMPTS = 50; // ~5 saniye

const CustomerAuth: React.FC<CustomerAuthProps> = ({
  onBack,
  onGoogleSignIn,
  onGoogleCredentialSignIn,
  onEmailSignIn,
  isPending = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const gsiContainerRef = useRef<HTMLDivElement>(null);
  const [gsiRendered, setGsiRendered] = useState(false);

  // ===== GSI button render =====
  // Script async yuklendiginden window.google hazir olana kadar polling.
  // Hazir olduktan sonra renderButton ile fiziksel button ekleriz; FedCM destekli,
  // popup/redirect olmadan ID token doner.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const tryRender = () => {
      if (cancelled) return;

      const gsi = window.google?.accounts?.id;
      const container = gsiContainerRef.current;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!gsi || !container) {
        attempts += 1;
        if (attempts >= GSI_POLL_MAX_ATTEMPTS) {
          console.warn('[GSI] Yukleme zaman asimi - fallback Google butonu gosterilecek');
          return;
        }
        timer = setTimeout(tryRender, GSI_POLL_INTERVAL_MS);
        return;
      }

      if (!clientId) {
        console.warn('[GSI] VITE_GOOGLE_CLIENT_ID env eksik - fallback Google butonu gosterilecek');
        return;
      }

      try {
        gsi.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response?.credential) return;
            if (!onGoogleCredentialSignIn) {
              console.warn('[GSI] onGoogleCredentialSignIn handler tanimli degil');
              return;
            }

            try {
              setIsSubmitting(true);
              setError('');
              await onGoogleCredentialSignIn(response.credential);
            } catch (err: any) {
              console.error('[GSI] sign-in failed:', err);
              setError(err?.message || 'Google girisi basarisiz oldu.');
            } finally {
              setIsSubmitting(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        // Mevcut child'lari temizle (StrictMode double-mount korumasi)
        container.innerHTML = '';
        gsi.renderButton(container, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 320,
          locale: 'tr',
        });

        setGsiRendered(true);
        console.log('[GSI] Button basariyla render edildi');
      } catch (err) {
        console.error('[GSI] Initialize/renderButton hatasi:', err);
      }
    };

    tryRender();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [onGoogleCredentialSignIn]);

  const handleLegacyGoogle = async () => {
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
      setError('E-posta ve sifre gerekli.');
      return;
    }

    if (password.length < 6 && isRegister) {
      setError('Sifre en az 6 karakter olmali.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onEmailSignIn(email, password, isRegister);
    } catch (err: any) {
      const errCode = err?.code || '';
      const errMsg = err?.message || '';

      if (errCode === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
        setError('Bu e-posta zaten kayitli. Giris yap\'i sec.');
        setIsRegister(false);
      } else if (errCode === 'auth/wrong-password' || errMsg.includes('wrong-password')) {
        setError('Yanlis sifre.');
      } else if (errCode === 'auth/user-not-found' || errMsg.includes('user-not-found')) {
        setError('Kullanici bulunamadi. Kayit ol\'u sec.');
        setIsRegister(true);
      } else if (errCode === 'auth/weak-password') {
        setError('Sifre cok zayif. Daha karmasik bir sifre sec.');
      } else if (errCode === 'auth/invalid-email') {
        setError('Gecersiz e-posta adresi.');
      } else if (errMsg.includes('too-many-requests')) {
        setError('Cok fazla basarisiz deneme. Lutfen daha sonra tekrar dene.');
      } else {
        setError(errMsg || 'Islem basarisiz oldu. Lutfen tekrar dene.');
      }
      console.error('Email auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleText = isPending ? 'Giris tamamlaniyor' : (isRegister ? 'Kayit Ol' : 'Giris Yap');
  const subtitleText = isPending
    ? 'Onaydan sonra oturumun cihaza geri yazilmasi birkac saniye surebilir.'
    : 'Hesabina girerek favorilerini kaydet, deneme gecmisini gor ve kesfet akisini kullan.';

  const inputsDisabled = isSubmitting || isPending;

  return (
    <div className="h-full min-h-0 flex flex-col bg-boutique-cream animate-fade-in overflow-y-auto">
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-mirrorly-black" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 sm:px-7 pb-10">
        <div className="max-w-sm mx-auto w-full">
          <div className="mb-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6 rounded-full bg-white/80 border border-mirrorly-gold/30 shadow-xl flex items-center justify-center overflow-hidden">
              <ShieldCheck className="w-9 h-9 text-mirrorly-black" />
              <img
                src="/brand/who-customer.jpg"
                alt=""
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-mirrorly-gold font-semibold mb-3">Mirrorly</p>
            <h2 className="font-serif text-3xl text-mirrorly-black mb-3">{titleText}</h2>
            <p className="text-sm text-mirrorly-stone leading-relaxed">{subtitleText}</p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inputsDisabled}
              autoComplete="email"
              className="w-full rounded-lg border border-mirrorly-paper bg-white px-4 py-3 text-sm placeholder-gray-400 focus:border-mirrorly-gold focus:outline-none disabled:opacity-60"
            />

            <input
              type="password"
              placeholder="Sifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={inputsDisabled}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="w-full rounded-lg border border-mirrorly-paper bg-white px-4 py-3 text-sm placeholder-gray-400 focus:border-mirrorly-gold focus:outline-none disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={inputsDisabled}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-mirrorly-black text-white py-3 shadow-xl hover:bg-mirrorly-stone transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium mt-4"
            >
              {isSubmitting ? 'Isleniyor...' : isRegister ? 'Kayit Ol' : 'Giris Yap'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              disabled={inputsDisabled}
              className="text-xs text-mirrorly-stone hover:text-mirrorly-black transition-colors underline disabled:opacity-60"
            >
              {isRegister ? 'Zaten hesabin var mi? Giris yap' : 'Henuz hesabin yok mu? Kayit ol'}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">veya</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Modern GSI button (script yuklendiyse) */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div ref={gsiContainerRef} className="flex justify-center min-h-[44px]" />

            {/* Fallback: GSI render edilemediyse legacy popup/redirect butonu */}
            {!gsiRendered && (
              <button
                onClick={handleLegacyGoogle}
                disabled={inputsDisabled}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white text-gray-700 py-3 shadow-sm hover:bg-mirrorly-cream transition-all text-sm disabled:opacity-60"
              >
                <Chrome className="w-4 h-4" />
                <span>Google ile devam et</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
