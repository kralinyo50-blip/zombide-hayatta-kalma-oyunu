# KARANLIK BOĞAZ

İstanbul'da geçen, 2D motorla 3D görünümlü (raycasting) bir hayatta kalma / FPS oyunu.
Karaköy'den Galata'ya, oradan Kız Kulesi'ne uzanan hikâye, oyuncunun seçimleriyle dallanır.

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

1. **Karaköy** — Meydana ulaş, Emre ile konuş, Bankalar Hanı'nın kasasından notu al.
2. **Galata** — Deniz'i bul, müdürün kasasından anahtarı al, kasa dairesindeki panzehir flakonunu çıkar.
3. **Kız Kulesi** — Tekneyle kuleye git, Kızıl Ana ile son hesaplaşma. Seçimlerine göre 4 farklı final.

## Teknik

- Saf HTML/CSS/JS — derleme adımı yok, harici varlık yok.
- `js/raycaster.js`: DDA duvar ışınımı, taban/tavan kaplaması, z-buffer'lı sprite'lar, el feneri konisi, mip-map'li dokular.
- `js/istmap.js`: İstanbul'un gerçek koordinatlarından üretilen Google Maps tarzı canvas harita.
- `js/audio.js`: WebAudio ile prosedürel ses ve ambiyans.
- Tüm dokular, sprite'lar ve harita çalışma anında üretilir.

Yerel çalıştırma: `python3 -m http.server 8000` → <http://localhost:8000>
