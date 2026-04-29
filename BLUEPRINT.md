# Mirrorly - Teknik Blueprint

Bu dokuman Mirrorly'nin teknik mimarisini urun yol haritasi ile birlikte okur. Ana strateji dosyasi `ROADMAP.md` icindedir; bu blueprint ise o plana hizmet eden teknik cekirdegi tarif eder.

## 1. Mimari

- Client: React SPA
- Local dev API: Vite middleware uzerinden `/api/try-on`
- Deploy API: Vercel `api/*.js` route'lari
- Database: Firestore
- Auth: Firebase Auth
- Asset storage: Firebase Storage
- AI provider: Kie.ai

## 2. Yol Haritasi Icindeki Teknik Konum

Bugunku teknik durum:

- QR tabanli merchant -> musteri akisi kurulmus durumda
- Ancak gercek try-on hattinin production'da tutarli calistigi henuz tam kapanmamis bir risk
- Bu nedenle teknik oncelik "yeni ozellik eklemek" degil, once Faz 0 ve Faz 1 kapatisidir

Bu blueprint'in hizmet ettigi urun asamalari:

- Faz 0: teknik stabilizasyon
- Faz 1: pilot hazir urun
- Faz 2: satilabilir V1

## 3. Ana Akis

1. Musteri `/?id=<garmentId>` deep link'i veya QR ile urun sayfasina gelir.
2. Client urun ve merchant public verisini Firestore'dan yukler.
3. Musteri fotograf secince istemci gorseli yeniden boyutlandirir.
4. Client `/api/try-on` endpoint'ine `garmentId` ve `userPhotoDataUrl` gonderir.
5. Server urunu ve merchant profilini Firestore'dan okur.
6. Server kredi bakiyesini kontrol eder.
7. Kullanici fotografi ve gerekiyorsa urun gorseli Kie temporary upload hattina tasinir.
8. Kie market veya premium model ile try-on sonucu uretilir.
9. Sonuc tekrar data URL'e cevrilir ve cliente doner.
10. Basarili islemde merchant kredisi 1 azaltirilir.

## 4. Runtime Dosya Kaynagi

- Local type-safe referanslar: `server/*.ts`
- Deploy runtime kaynaklari: `api/*.js` ve `server/*.js`

Operasyonel olarak Vercel tarafinda referans alinmasi gereken dosyalar `.js` olanlardir.

## 5. Veri Modeli

### 5.1 Private merchant profil

Koleksiyon: `merchant_profiles/{uid}`

Alanlar:

- `uid`
- `role`
- `email`
- `name`
- `logoUrl`
- `description`
- `instagramUrl`
- `defaultShopUrl`
- `whatsappNumber`
- `credits`
- `modelPreset`
- `status`

### 5.2 Public merchant profil

Koleksiyon: `merchant_public/{uid}`

Alanlar:

- `uid`
- `name`
- `logoUrl`
- `description`
- `instagramUrl`
- `defaultShopUrl`
- `whatsappNumber`

### 5.3 Garments

Koleksiyon: `merchant_profiles/{uid}/garments/{garmentId}`

Alanlar:

- `id`
- `merchantUid`
- `name`
- `description`
- `imageUrl`
- `price`
- `boutiqueName`
- `shopUrl`

## 6. Model Yolu

Preset'ler deploy runtime'da su sekilde calisir:

- `economy`: market model, varsayilan `grok-imagine/image-to-image`
- `balanced`: market model, varsayilan `grok-imagine/image-to-image`
- `premium`: GPT-4o image, varsayilan `gpt4o-image`

Fallback zinciri:

- Market model billing veya provider sorunu verirse premium fallback, o da olmazsa market fallback denenir.
- Premium model billing veya upstream sorunu verirse market fallback denenir.

Not:

- Environment degiskenleri default model davranisini override edebilir.
- Uretimde 403 billing benzeri hatalarda once Vercel env'lerindeki `KIE_MODEL_*` degerleri kontrol edilmelidir.

## 7. Dayaniklilik

- Client timeout: 95 saniye
- Polling interval: 2.5 saniye
- Demo fallback modu: `VITE_TRYON_MODE=demo`
- Firestore public profil fallback mantigi mevcut
- Storage upload basarisizsa istemci tarafinda optimize edilmis data URL fallback'i mevcut

## 8. Faz Bazli Teknik Oncelikler

### Faz 0

- Calisan tek bir golden-path model kombinasyonunu netlestir
- Gercek try-on smoke test'ini sabitle
- Env ve provider sorunlarini gozlemlenebilir hale getir

### Faz 1

- Merchant panelini pilot kullanim icin sadeleştir
- Sonuc ekrani ve QR etiketi tasarimini iyilestir
- Urun yukleme kalitesini artiran yardim metinlerini ekle

### Faz 2

- Admin panel ve merchant onay akisi
- Basit analytics katmani
- Kredi paketleri ve operasyonel takip

## 9. Operasyonel Notlar

- `/api/ping` health check icin kullanilabilir.
- `/api/try-on` GET isteginde de route erisilebilirligi test edilebilir.
- Faz 0 ve Faz 1 kapanisinda dogru smoke test akisi `RELEASE_CHECKLIST.md` icindedir.
- Teknik kararlar urun onceligi ile birlikte `ROADMAP.md` uzerinden alinmalidir.
