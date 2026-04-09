# Mirrorly

QR tabanli butik try-on deneyimi.

## Gerekenler

- Node.js 18+
- Firebase web config
- Firebase Admin service account env'leri
- Kie.ai API key

`.env.example` dosyasini kopyalayip gerekli alanlari doldurun.

## Calistirma

```bash
npm install
npm run dev
```

## V1 Akisi

- Magaza e-posta/sifre ile kayit olur veya giris yapar
- Profilini ve AI model preset'ini kaydeder
- Urun ekler ve urun icin benzersiz QR olusturur
- Musteri QR ile urun sayfasina girer
- Foto yukler, try-on sonucu olusur ve indirir

## Deploy Notu

`/api/try-on` endpoint'i server-side calisir. Vercel'e deploy ederken `KIE_API_KEY` ve `FIREBASE_ADMIN_*` env'lerini eklemek zorunludur.
