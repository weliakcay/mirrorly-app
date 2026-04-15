# Mirrorly - Standart Operasyon Proseduru

Bu dokuman Mirrorly V1'in kurulum, deploy ve gunluk kullanim prosedurudur.

## 1. Kurulum

### 1.1 Gerekli env'ler

`.env.example` dosyasindaki degiskenleri doldurun.

Zorunlu alanlar:

- `VITE_FIREBASE_*`
- `KIE_API_KEY`
- `FIREBASE_ADMIN_*`

Opsiyonel alanlar:

- `VITE_TRYON_MODE`
- `KIE_MODEL_ECONOMY`
- `KIE_MODEL_BALANCED`
- `KIE_MODEL_PREMIUM`
- `KIE_MODEL_MARKET_FALLBACK`
- `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`

### 1.2 Local calistirma

```bash
npm install
npm run dev
```

### 1.3 Build kontrolu

```bash
npm run build
```

## 2. Deploy

### 2.1 Vercel

Vercel env paneline su degiskenleri eklenmelidir:

- Tum `VITE_FIREBASE_*` alanlari
- `KIE_API_KEY`
- `KIE_MODEL_ECONOMY`
- `KIE_MODEL_BALANCED`
- `KIE_MODEL_PREMIUM`
- `KIE_MODEL_MARKET_FALLBACK`
- `FIREBASE_ADMIN_STORAGE_BUCKET`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Alternatif olarak Firebase admin credentials tek JSON olarak da verilebilir:

- `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`

### 2.2 Firebase

- Firestore rules `firestore.rules` ile publish edilmelidir.
- Storage bucket adı `FIREBASE_ADMIN_STORAGE_BUCKET` ile eslesmelidir.
- Public merchant koleksiyonu read'e acik olmalidir.

## 3. Merchant is akisi

1. Merchant e-posta ve sifre ile kayit olur veya giris yapar.
2. Magaza bilgileri ve iletisim alanlari kaydedilir.
3. Urun gorseli, fiyat ve aciklama ile urun eklenir.
4. Urun icin QR etiketi uretilir.
5. Musteri akisini dogrulamak icin urun deep link'i telefonda test edilir.

## 4. Musteri akisi

1. Musteri QR veya urun linki ile sayfaya gelir.
2. Urun sayfasi yuklenir.
3. Fotograf yuklenir.
4. Try-on sonucu olusur.
5. Sonuc indirilebilir veya paylasilabilir.

## 5. Smoke test

Detayli liste icin `RELEASE_CHECKLIST.md` kullanin.

Hizli kontrol:

```bash
npm run smoke:deploy -- https://your-domain.vercel.app
```

## 6. Olay yonetimi

### 6.1 Kie.ai gecici arizasi

- `/api/ping` ve `/api/try-on` GET ile route erisilebilirligini kontrol edin.
- Vercel env'lerinde `KIE_API_KEY` ve model degiskenlerini dogrulayin.
- Gerekirse fallback model isimlerini gozden gecirin.

### 6.2 Firebase admin hatasi

- `FIREBASE_ADMIN_*` env'lerinin eksik veya bozuk olmadigini kontrol edin.
- Private key satir sonlarinin dogru kaydedildigini kontrol edin.

### 6.3 Acil demo modu

Gercek try-on gecici olarak servis disi kalirsa:

1. `VITE_TRYON_MODE=demo` olarak ayarlayin.
2. Uygulamayi yeniden build ve redeploy edin.
3. Sonuc ekraninda demo preview etiketi gorundugunu dogrulayin.

Bu mod kredi takibi ve akisi gostermeye devam eder, fakat gercek giydirme yerine demo onizleme dondurur.

