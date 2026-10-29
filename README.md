# Mirrorly

QR-based virtual try-on for boutiques. React, TypeScript and Firebase, with a server-side Kie.ai integration.

## Project overview

- Intended workflow: merchant adds a garment, shares its QR/link, and a customer starts a photo-based try-on.
- [Public landing page](https://mirrorly-landing.vercel.app/) · [Application](https://mirrorly-app.vercel.app/) (customer access requires sign-in).
- Documentation reviewed on 29 October 2026. The application sign-in screen was reachable; a complete provider-backed try-on was not verified in that review.
- The implementation and release notes below describe a prototype/pilot. Reliable provider results, production configuration and a real merchant/mobile smoke test remain release acceptance requirements.
- AI requests and infrastructure can incur costs. Public page availability is not evidence that the full generation or payment flow has passed.

Technical setup and the original Turkish implementation notes follow.

## Implementation notes — 11 April 2026

11 Nisan 2026 itibariyla Mirrorly prototip ile pilot arasinda bir asamadadir:

- Magaza e-posta ve sifre ile kayit olur veya giris yapar.
- Magaza profilini, iletisim alanlarini ve AI model preset'ini kaydeder.
- Urun ekler, urun sayfasi ve QR etiketi olusturur.
- Musteri QR veya deep link ile urun sayfasina gelir.
- Musteri mobilde foto yukler ve sonuc ekranina kadar ilerler.
- Gercek try-on provider zinciri hala kapanmasi gereken ana teknik risklerden biridir.

## Stack

- React 18 + TypeScript + Vite
- Firebase Auth, Firestore ve Storage
- Vercel serverless API route'lari
- Kie.ai try-on akisi
- Market image-to-image modelleri ve GPT-4o premium fallback zinciri

## Gerekenler

- Node.js 18+
- Firebase web config env'leri
- Firebase Admin service account env'leri
- Kie.ai API key

`.env.example` dosyasini kopyalayip gerekli alanlari doldurun.

## Calistirma

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy Notlari

- `/api/try-on` ve `/api/ping` endpoint'leri server-side calisir.
- Vercel'de `KIE_API_KEY` ve `FIREBASE_ADMIN_*` env'leri zorunludur.
- Firestore rules deploy edilmeden merchant/public veri modeli tam calismaz.
- Her deploy sonrasi `npm run smoke:deploy -- https://your-domain.vercel.app` ile hizli kontrol yapin.

## Operasyon Dokumanlari

- `ROADMAP.md`: pazarlanabilir urune kadar urun ve pazarlama yol haritasi
- `STATUS.md`: V1 durumu, kapanis kriterleri ve V2'ye kalanlar
- `RELEASE_CHECKLIST.md`: pre-launch ve smoke test listesi
- `SOP.md`: gunluk kullanim ve operasyon proseduru
- `BLUEPRINT.md`: guncel teknik mimari

## Mobil Giriş Dokumanlari

Mobil cihazdan Google ve Email ile giriş yapıldığında yaşanan sorunlar düzeltilmiştir:

- `MOBILE_LOGIN_FIX_SUMMARY.md`: ✅ Yeni - Hızlı referans ve özet
- `MOBILE_TESTING_GUIDE.md`: Gerçek cihazdan test etme adımları (iOS/Android)
- `MOBILE_AUTH_FIX.md`: Teknik detaylar ve polling mekanizması
- `GOOGLE_AUTH_IMPROVEMENTS.md`: Google auth architecture
- `QR_MOBILE_LOGIN.md`: QR/link ile mobil giriş akışı

**Hızlı Test**: `npm run dev` → `http://localhost:5173` (Desktop) veya `http://192.168.1.100:5173` (Mobile)
