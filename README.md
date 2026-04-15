# Mirrorly

QR tabanli butik try-on deneyimi.

## Mevcut Durum

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
