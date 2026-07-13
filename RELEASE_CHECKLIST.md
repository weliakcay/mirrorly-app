# Mirrorly V1 Release Checklist

## 0. GÜVENLİK LAUNCH-GATE (2026-07-13 Fable incelemesi — ZORUNLU)

- [ ] **LemonSqueezy variant ID'leri Vercel env'e girildi** (`VITE_LS_CUSTOMER_*` + `VITE_LS_MERCHANT_*` + `LS_TOPUP_100`). ⚠️ Boşsa ödeme kredi YÜKLEMEZ (webhook artık yalnız variant_id'den kredi belirler; client `package_id` istismarı kapatıldı).
- [ ] **Test ödemesi** (müşteri + merchant) → doğru kredi + idempotency (aynı webhook 2× → tek yükleme).
- [ ] **Firebase Storage rules** konsoldan doğrulandı/kilitlendi (repo'da yok; test modundaysa herkese açık — `users/{uid}` yazımı korunmalı).
- [ ] **Rate limit**: in-memory limiter aktif (best-effort). Prod trafiği için Upstash Redis / Vercel WAF ile IP+merchant tavanı planlandı.
- [ ] Vercel `maxDuration: 90` planda destekleniyor mu doğrulandı (Hobby'de sınır olabilir); kie poll 80s'e çekildi.
- [ ] `RESEND_API_KEY`, `LEMON_SQUEEZY_WEBHOOK_SECRET`, `VITE_ADMIN_EMAILS` prod'da tanımlı.

## 1. Pre-launch

- [ ] `npm run build` hatasiz tamamlandi
- [ ] Vercel env'leri `.env.example` ile karsilastirildi
- [ ] `KIE_API_KEY` production icin dogru
- [ ] `FIREBASE_ADMIN_*` alanlari production icin dogru
- [ ] Firestore rules publish edildi
- [ ] En az bir merchant profili ve en az bir urun production verisinde mevcut

## 2. Preview deploy smoke test

- [ ] `npm run smoke:deploy -- https://preview-url.vercel.app`
- [ ] `/api/ping` 200 donuyor
- [ ] `/api/try-on` GET 200 donuyor
- [ ] Landing ekrani aciliyor
- [ ] `/?id=<garmentId>` urun sayfasini aciyor

## 3. Product smoke test

- [ ] Merchant kayit veya giris basarili
- [ ] Merchant urun ekleyebiliyor
- [ ] QR etiketi aciliyor ve deep link dogru
- [ ] Mobil cihazda foto yukleme aciliyor
- [ ] Gercek try-on sonucu uretiliyor
- [ ] Sonuc indiriliyor
- [ ] Sonuc paylasma akisi aciliyor
- [ ] Basarili denemede kredi 1 azaltiliyor

## 4. Production go/no-go

- [ ] Preview deploy temiz
- [ ] Production deploy temiz
- [ ] En az bir iPhone test edildi
- [ ] En az bir Android test edildi
- [ ] Merchant geri bildirimi alindi

## 5. Acil durum fallback

- [ ] Gerekirse `VITE_TRYON_MODE=demo` ile acil demo deployu alinabilir
- [ ] Demo modunda sonuc ekraninda "Demo Preview" etiketi gorunuyor
- [ ] Merchant ekibi demo moduna alindigindan haberdar

