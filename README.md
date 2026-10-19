# KARANLIK BOĞAZ

İstanbul'da geçen, 2D motorla 3D görünümlü (raycasting) bir hayatta kalma / FPS oyunu.
Hikâye Cihangir'deki bir evde başlar: aile, televizyondaki son dakika haberi, sokağa taşan panik.
Dairede geçen dört bölümün ardından Cihangir sokakları, sahil yolu, Karaköy ve Galata'ya uzanan yolculuk,
oyuncunun seçimleriyle dallanır.
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

Oyunun ilk dört bölümü evde, ailenin yanında geçer: sıradan bir akşam yemeği, elektrik kesintisi,
sabahın sessizliği ve mahalleden çıkış. Sinematik ara sahneler her bölümde hikâyeyi taşır.

**Prolog — Ev (Cihangir, 0. Gün 21:12):** Sıradan bir cumartesi akşamı. Annenle konuş, babanla haberleri tartış,
Ada'yla şakalaş; televizyondaki "SON DAKİKA" yayınını izle. Bölüm, ışıklar sönüp merdivenden gelen sesle biter.

**Bölüm I — Gece (0. Gün 23:14):** Elektrik yok, şehir karanlık. Mum ışığında aileyi topla, koridordaki sesi dinle,
elektrik panosuna bak, balkon kapısından sokağa bak — ve daireye giren ilk şeyle yüzleş.

**Bölüm II — Sabah (1. Gün 06:44):** Dairede bir ses var. Aileyi koru, koridoru temizle, babanın ceketini bul
ve merdivenlere in.

**Bölüm III — Mahalle (1. Gün 08:05):** Cihangir sokakları. Eczaneden Ada'nın ilacını al, 104.6 MHz'deki ilk yayını duy,
cami avlusundaki minibüsle sahil yoluna in.

**Bölüm IV — Sahil (1. Gün 17:52):** Karantina kapısı kapanmadan Boğaz'a ulaş. Aile burada ayrılır; dokuz gün sonra
Karaköy rıhtımında yalnız başlarsın.

**Bölüm V — Karaköy (09. Gün 22:47):** Meydana ulaş, Emre ile konuş, Bankalar Hanı'nın kasasından notu al.

**Bölüm VI — Galata:** Deniz'i bul, müdürün kasasından anahtarı al, kasa dairesindeki panzehir flakonunu çıkar.

**Bölüm VII — Kız Kulesi:** Tekneyle kuleye git, Kızıl Ana ile son hesaplaşma. Seçimlerine göre 4 farklı final.

## Teknik

- Saf HTML/CSS/JS — derleme adımı yok, harici varlık yok.
- `js/raycaster.js`: DDA duvar ışınımı, taban/tavan kaplaması, z-buffer'lı sprite'lar, el feneri konisi, mip-map'li dokular.
- `js/istmap.js`: İstanbul'un gerçek koordinatlarından üretilen Google Maps tarzı canvas harita.
- `js/audio.js`: WebAudio ile prosedürel ses ve ambiyans.
- `js/cine.js`: 960×540 sinematik sahne çizici (haber stüdyosu, gece Boğazı, sokak kamerası, pencere, merdiven, radyo, ev, sahil).
- `js/world.js`: `ev` (akşam) / `ev_gece` (karanlık daire) / `ev2` (sabah) / `mahalle` / `sahil` / `karakoy` / `galata` / `kizkulesi` haritaları.
- Tüm dokular, sprite'lar ve harita çalışma anında üretilir.

Yerel çalıştırma: `python3 -m http.server 8000` → <http://localhost:8000>
