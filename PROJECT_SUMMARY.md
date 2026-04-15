# Mirrorly - Proje Ozeti

Mirrorly, butiklerin urunlerini QR veya deep link ile acilan mobil try-on deneyimine donusturen bir urundur. Musteri urun etiketindeki kodu okutur, kendi fotografini yukler ve ideal durumda secilen urunu kendi uzerinde gorur.

## Urun Hedefi

- Magaza ici urun denemeyi hizlandirmak
- Fiziksel prova ihtiyacini her urunde zorunlu olmaktan cikarmak
- Butige daha olculebilir bir dijital temas noktasi saglamak

## Hedeflenen V1 Kapsami

- Merchant e-posta ve sifre ile giris/kayit
- Merchant profil, logo, shop URL ve WhatsApp bilgileri
- Multi-tenant urun envanteri
- Her urun icin QR etiketi ve deep link
- Mobil foto yukleme
- Server-side AI try-on
- Sonuc indirme, paylasma ve cihaz ici gecmis
- Kredi bakiyesi takibi

## Guncel Urun Gercegi

- Merchant, QR ve sonuc ekrani tarafi buyuk oranda kurulmus durumda
- Gercek try-on sonucu hatti hala kapanmasi gereken ana teknik risk
- Bu nedenle urun su an "pilot hazirlik" seviyesinde; henuz tam satilabilir V1 degil

Teknik referans:

- Deploy runtime icin `api/try-on` ve `server/*.js`
- Stratejik yol haritasi icin `ROADMAP.md`
- Teknik mimari icin `BLUEPRINT.md`

## V2'ye Birakilanlar

- Google/Apple girisi
- Kredi paketi satin alma ve odeme akisi
- Musteri hesabi ve bulut gecmis senkronu
- Analytics ve merchant raporlama
- Daha gelismis model secimi ve kalite dashboard'u
- Kesfet ana sayfasi, sponsorlu urunler ve marketplace katmani
