# KARANLIK BOĞAZ

İstanbul'da geçen, 2D motorla 3D görünümlü (raycasting) bir hayatta kalma / FPS oyunu.
Hikâye Cihangir'deki bir evde başlar: aile, televizyondaki son dakika haberi, sokağa taşan panik.
Dairede geçen dört bölümün ardından karantina kampı, Cihangir sokakları, Karaköy hastanesi, metro,
sarnıç, Galata, rıhtım ve Kız Kulesi'ne uzanan 20 bölümlük yolculuk, oyuncunun seçimleriyle dallanır
ve dört farklı finalle kapanır.
Sinematik ara sahneler (`js/cine.js`) tamamen prosedürel çizilir.

## Oynanış

| Tuş | İşlev |
| --- | --- |
| `W A S D` | Hareket |
| `Fare` | Bakış (tıkla → işaretçi kilidi) |
| `Sol Tık` | Ateş |
| `R` | Şarjör değiştir |
| `E` | Etkileşim / kapı aç |
| `Shift` | Koş |
| `Q` | Silah değiştir |
| `V` | Yakın dövüş |
| `Tab` | İstanbul haritası |
| `Esc` | Duraklat |

Dokunmatik cihazlarda ekranın altındaki joystick + bakış alanı + ateş düğmeleri kullanılır.

## Bölümler

Toplam **20 bölüm** (prolog + 19) ve **4 farklı final**. Seçimler aileye, Leyla'ya, Deniz'e ve
Emre'ye karşı güveni; kasa dairesinde hangi flakonu aldığını; Kızıl Ana karşısındaki tutumu ve
kulenin tepesindeki son kararı belirler.

| # | Bölüm | Yer / zaman | Öne çıkan seçim |
| --- | --- | --- | --- |
| 0 | Prolog — Ev | Cihangir, 0. Gün 21:12 | Annenle konuş, babanla tartış, TV'deki son dakika haberini izle |
| I | Gece | Cihangir, 0. Gün 23:14 | Aileyi topla, koridordaki sesi dinle |
| II | Sabah | Cihangir, 1. Gün 06:44 | Daireye giren ilk şeyle yüzleş |
| III | Mahalle | Cihangir, 1. Gün 08:05 | Eczaneden Ada'nın ilacını al, Emre'ye yardım et |
| IV | Sahil | Boğaz, 1. Gün 17:52 | Karantina kapısında aile ayrılır |
| V | Karantina | Sahil kampı, 3. Gün | Telin ardındaki aile; kuralı zorla ya da kabullen |
| VI | Karaköy | 9. Gün 22:47 | Telsize cevap ver, Bankalar Hanı'na git |
| VII | Bankalar Hanı | 01:12 | Mavi mi, kırmızı flakon mu, ikisi de mi? |
| VIII | Hastane | 02:05 | Morgdaki anahtar, kendi kaydın |
| IX | Metro | 02:48 | Bilet, bakım anahtarı, tünel |
| X | Sarnıç | 03:20 | Suya bakma; sunağı devir |
| XI | Galata | 03:52 | Deniz'i sakla, yanına al ya da bırak |
| XII | Kule Meydanı | 04:05 | Kalabalığı yar |
| XIII | Rıhtım | 04:20 | Bekçi kulübesi, depo, tekne |
| XIV | Tekne | 04:52 | Motor mu, kürek mi? |
| XV | Ada | 05:02 | Kule kapısını aç |
| XVI | Kız Kulesi | 05:12 | Kızıl Ana ile hesaplaşma (diren / pazarlık / kaçış) |
| XVII | Kızıl Ana | 05:26 | Sisin son sözü |
| XVIII | Son Seçim | 05:31 | Panzehiri yay / sakla / kaç / yok et |
| XIX | Son | 05:40 | 4 final: **Şafak**, **Taht**, **Gemi**, **Sessizlik** |

Ayrıca her finalde küçük "sonuç" satırları vardır: Deniz'e ne oldu, Emre'ye ne oldu, kırmızı flakon
hâlâ cebinde mi, Leyla sana güvendi mi. Final galerisi kalıcı olarak `0/4` → `4/4` ilerler.

## Teknik

- Saf HTML/CSS/JS — derleme adımı yok, harici varlık yok.
- `js/raycaster.js`: DDA duvar ışınımı, taban/tavan kaplaması, z-buffer'lı sprite'lar, el feneri konisi, mip-map'li dokular.
- `js/istmap.js`: İstanbul'un gerçek koordinatlarından üretilen Google Maps tarzı canvas harita.
- `js/audio.js`: WebAudio ile prosedürel ses ve ambiyans.
- `js/cine.js`: 960×540 sinematik sahne çizici (haber stüdyosu, gece Boğazı, sokak kamerası, pencere, merdiven, radyo, ev, sahil).
- `js/world.js`: 14 harita — `ev` / `ev_gece` / `ev2` (17×14 daire), `mahalle`, `sahil`, `karakoy`, `galata`, `kizkulesi`, `banka`, `hastane`, `metro`, `sarnic`, `rihtim`, `ada`.
- Tüm dokular, sprite'lar ve harita çalışma anında üretilir.

Yerel çalıştırma: `python3 -m http.server 8000` → <http://localhost:8000>
