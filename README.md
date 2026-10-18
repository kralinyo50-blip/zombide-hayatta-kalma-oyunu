# KARANLIK BOĞAZ

İstanbul'da geçen, 2D motorla 3D görünümlü (raycasting) bir hayatta kalma / FPS oyunu.
Hikâye Cihangir'deki bir evde başlar: aile, televizyondaki son dakika haberi, sokağa taşan panik.
Cihangir sokaklarından sahil yoluna, oradan Karaköy ve Galata'ya uzanan yolculuk, oyuncunun seçimleriyle dallanır.
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

**Prolog — Ev:** Cihangir'de bir cumartesi akşamı. Ailenle konuş, televizyondaki "SON DAKİKA" yayınını izle,
elektrik kesilip sokaktan çığlıklar gelene kadar geçen son sakin saat.

**Bölüm I — Sabah:** Elektrik yok. Dairenin içinde bir ses var. Aileyi koru, daireyi temizle ve merdivenlere in.

**Bölüm II — Mahalle:** Cihangir sokakları. Eczaneden Ada'nın ilacını al, 104.6 MHz'deki ilk yayını duy,
cami avlusundaki minibüsle sahil yoluna in.

**Bölüm III — Sahil:** Karantina kapısı kapanmadan Boğaz'a ulaş. Aile burada ayrılır; dokuz gün sonra
Karaköy rıhtımında yalnız başlarsın.

**Bölüm IV — Karaköy:** Meydana ulaş, Emre ile konuş, Bankalar Hanı'nın kasasından notu al.

**Bölüm V — Galata:** Deniz'i bul, müdürün kasasından anahtarı al, kasa dairesindeki panzehir flakonunu çıkar.

**Bölüm VI — Kız Kulesi:** Tekneyle kuleye git, Kızıl Ana ile son hesaplaşma. Seçimlerine göre 4 farklı final.

## Teknik

- Saf HTML/CSS/JS — derleme adımı yok, harici varlık yok.
- `js/raycaster.js`: DDA duvar ışınımı, taban/tavan kaplaması, z-buffer'lı sprite'lar, el feneri konisi, mip-map'li dokular.
- `js/istmap.js`: İstanbul'un gerçek koordinatlarından üretilen Google Maps tarzı canvas harita.
- `js/audio.js`: WebAudio ile prosedürel ses ve ambiyans.
- `js/cine.js`: 960×540 sinematik sahne çizici (haber stüdyosu, sokak kamerası, pencere, sahil, ev).
- `js/world.js`: `ev` / `ev2` / `mahalle` / `sahil` / `karakoy` / `galata` / `kizkulesi` haritaları.
- Tüm dokular, sprite'lar ve harita çalışma anında üretilir.

Yerel çalıştırma: `python3 -m http.server 8000` → <http://localhost:8000>
