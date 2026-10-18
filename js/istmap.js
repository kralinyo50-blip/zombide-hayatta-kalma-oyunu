/* ============================================================
   KARANLIK BOĞAZ — istmap.js
   Google Maps–inspired, hand-drawn Istanbul map.
   Real coordinates, pan / zoom / search / satellite toggle,
   story route + chapter markers.
   ============================================================ */
(function (global) {
  'use strict';

  const MAPW = 1200, MAPH = 950;
  const LON0 = 28.70, LON1 = 29.40;
  const LAT0 = 41.25, LAT1 = 40.83;

  const proj = (lon, lat) => ({
    x: (lon - LON0) / (LON1 - LON0) * MAPW,
    y: (LAT0 - lat) / (LAT0 - LAT1) * MAPH
  });
  const P = (lon, lat) => proj(lon, lat);
  const pts = (arr) => arr.map(([lon, lat]) => P(lon, lat));

  /* ---------------- geography ---------------- */
  const EUROPE = pts([
    [28.70, 40.945], [28.755, 40.955], [28.80, 40.962], [28.845, 40.971],
    [28.875, 40.972], [28.905, 40.981], [28.935, 40.989], [28.958, 40.995],
    [28.977, 41.001], [28.986, 41.009], [28.995, 41.017],
    // Bosphorus west shore going north
    [29.002, 41.026], [29.005, 41.033], [29.011, 41.039], [29.021, 41.043],
    [29.027, 41.048], [29.036, 41.055], [29.042, 41.063], [29.043, 41.072],
    [29.046, 41.079], [29.052, 41.086], [29.056, 41.094], [29.055, 41.102],
    [29.052, 41.108], [29.054, 41.114], [29.058, 41.122], [29.060, 41.130],
    [29.058, 41.138], [29.057, 41.146], [29.058, 41.155], [29.062, 41.163],
    [29.071, 41.171], [29.081, 41.180], [29.090, 41.192], [29.095, 41.205],
    [29.100, 41.218], [29.106, 41.232], [29.108, 41.25],
    [28.70, 41.25]
  ]);

  const ASIA = pts([
    [29.40, 41.25], [29.40, 40.83], [29.09, 40.845], [29.045, 40.875],
    [29.055, 40.885], [29.075, 40.895], [29.085, 40.915], [29.078, 40.935],
    [29.058, 40.95], [29.040, 40.965], [29.030, 40.977], [29.025, 40.986],
    [29.021, 40.996], [29.015, 41.003], [29.012, 41.012], [29.015, 41.019],
    [29.021, 41.027], [29.028, 41.032], [29.034, 41.038], [29.041, 41.045],
    [29.047, 41.051], [29.050, 41.058], [29.052, 41.066], [29.056, 41.074],
    [29.062, 41.081], [29.067, 41.089], [29.064, 41.097], [29.062, 41.104],
    [29.068, 41.111], [29.077, 41.118], [29.086, 41.126], [29.092, 41.136],
    [29.097, 41.147], [29.100, 41.158], [29.098, 41.169], [29.100, 41.181],
    [29.105, 41.194], [29.110, 41.207], [29.115, 41.222], [29.118, 41.235],
    [29.120, 41.25]
  ]);

  // Golden Horn
  const GOLDEN_HORN = pts([
    [28.976, 41.0175], [28.966, 41.0225], [28.955, 41.0280], [28.944, 41.0345],
    [28.9345, 41.0415], [28.9315, 41.0455], [28.9370, 41.0490], [28.9475, 41.0430],
    [28.9585, 41.0365], [28.9690, 41.0300], [28.9780, 41.0230], [28.9825, 41.0200]
  ]);

  function bosphorusPoly() {
    const center = [
      [29.000, 41.006], [29.004, 41.018], [29.009, 41.030], [29.018, 41.041],
      [29.030, 41.052], [29.039, 41.062], [29.044, 41.072], [29.050, 41.083],
      [29.056, 41.096], [29.056, 41.108], [29.058, 41.120], [29.061, 41.133],
      [29.064, 41.146], [29.071, 41.160], [29.081, 41.174], [29.090, 41.190],
      [29.099, 41.207], [29.107, 41.226], [29.111, 41.242]
    ];
    const widths = [0.0075, 0.0080, 0.0085, 0.0095, 0.0100, 0.0105, 0.0110, 0.0120,
      0.0130, 0.0135, 0.0140, 0.0145, 0.0155, 0.0165, 0.0175, 0.0180, 0.0185, 0.0190, 0.0195];
    const left = [], right = [];
    for (let i = 0; i < center.length; i++) {
      const p = center[i];
      const prev = center[Math.max(0, i - 1)], next = center[Math.min(center.length - 1, i + 1)];
      let dx = next[0] - prev[0], dy = next[1] - prev[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const nx = -dy, ny = dx;
      const w = widths[i];
      left.push([p[0] + nx * w * 1.15, p[1] + ny * w]);
      right.push([p[0] - nx * w * 1.15, p[1] - ny * w]);
    }
    return pts(left.concat(right.reverse()));
  }
  const BOSPHORUS = bosphorusPoly();

  const ISLANDS = [
    { name: 'Büyükada', pts: [[29.100, 40.860], [29.135, 40.855], [29.145, 40.872], [29.120, 40.882], [29.098, 40.874]] },
    { name: 'Heybeliada', pts: [[29.070, 40.875], [29.093, 40.872], [29.096, 40.885], [29.075, 40.889]] },
    { name: 'Burgazada', pts: [[29.055, 40.883], [29.070, 40.881], [29.072, 40.890], [29.057, 40.892]] },
    { name: 'Kınalıada', pts: [[29.042, 40.905], [29.056, 40.902], [29.058, 40.913], [29.045, 40.916]] },
    { name: 'Sedef', pts: [[29.035, 40.955], [29.045, 40.953], [29.047, 40.962], [29.037, 40.964]] }
  ];

  const LAKES = [
    { name: 'Küçükçekmece', pts: [[28.755, 41.00], [28.79, 41.013], [28.80, 41.028], [28.77, 41.033], [28.747, 41.012]] },
    { name: 'Büyükçekmece', pts: [[28.55, 41.005], [28.60, 41.015], [28.61, 41.03], [28.57, 41.035], [28.545, 41.015]] }
  ];

  const PARKS = [
    { name: 'Yıldız Korusu', pts: [[28.998, 41.044], [29.014, 41.043], [29.017, 41.053], [29.001, 41.056]] },
    { name: 'Maçka Demokrasi', pts: [[28.988, 41.039], [28.999, 41.038], [29.000, 41.045], [28.990, 41.046]] },
    { name: 'Gülhane Parkı', pts: [[28.980, 41.008], [28.989, 41.008], [28.989, 41.016], [28.981, 41.016]] },
    { name: 'Emirgan Korusu', pts: [[29.043, 41.102], [29.058, 41.100], [29.060, 41.113], [29.045, 41.115]] },
    { name: 'Çamlıca Korusu', pts: [[29.062, 41.020], [29.077, 41.019], [29.079, 41.032], [29.064, 41.033]] },
    { name: 'Fethipaşa Korusu', pts: [[29.026, 41.028], [29.036, 41.027], [29.037, 41.036], [29.027, 41.037]] },
    { name: 'Belgrad Ormanı', pts: [[28.895, 41.155], [28.975, 41.150], [28.985, 41.205], [28.905, 41.215]] },
    { name: 'Florya Atatürk', pts: [[28.770, 40.965], [28.800, 40.963], [28.802, 40.982], [28.772, 40.985]] },
    { name: 'Bostancı Sahil', pts: [[29.090, 40.945], [29.120, 40.943], [29.122, 40.956], [29.092, 40.958]] },
    { name: 'Göztepe 60. Yıl', pts: [[29.060, 40.960], [29.080, 40.958], [29.082, 40.972], [29.062, 40.974]] }
  ];

  const LANDMARKS = [
    {
      id: 'galata', name: 'Galata Kulesi', cat: 'Hikâye', lon: 28.9744, lat: 41.0256,
      chapter: 'ch1', story: true,
      desc: '1348\'de Cenevizliler tarafından inşa edilen kule, Kızıl Sis\'in dokuzuncu gecesinde Dr. Leyla\'nın laboratuvarına ev sahipliği yapıyor. Karaköy\'den Galata Yokuşu boyunca yürüyerek ulaşılır.'
    },
    {
      id: 'karakoy', name: 'Karaköy', cat: 'Hikâye', lon: 28.9757, lat: 41.0240,
      chapter: 'ch1', story: true,
      desc: 'Rıhtım, simit tezgâhları ve sis. Kuryenin uyandığı yer. Bankalar Caddesi\'nin başlangıcı ve Galata\'ya çıkan yokuşun eteği.'
    },
    {
      id: 'bankalar', name: 'Bankalar Caddesi', cat: 'Hikâye', lon: 28.9720, lat: 41.0235,
      chapter: 'ch2', story: true,
      desc: 'Osmanlı\'nın finans merkezi. Bankalar Hanı\'nın kasa dairesinde panzehir flakonu saklı. Mermer koridorlarda hâlâ banka alarmları çalıyor.'
    },
    {
      id: 'kizkulesi', name: 'Kız Kulesi', cat: 'Hikâye', lon: 29.0041, lat: 41.0211,
      chapter: 'ch3', story: true,
      desc: 'Boğaz\'ın ortasında, Salacak açıklarında tek başına bir kule. Kızıl Ana\'nın sesi buradan yayılıyor. Tekneyle ulaşılır; kürekler sisin içinde kaybolur.'
    },
    { id: 'ayasofya', name: 'Ayasofya', cat: 'Tarihi', lon: 28.9802, lat: 41.0086, desc: '1500 yıllık kubbe. Şehrin en eski tanığı; sisin altında bile ayakta.' },
    { id: 'topkapi', name: 'Topkapı Sarayı', cat: 'Tarihi', lon: 28.9833, lat: 41.0115, desc: 'Sarayburnu\'nda, Boğaz\'a bakan surlar. Karantina bölgesi ilan edildi.' },
    { id: 'suleymaniye', name: 'Süleymaniye Camii', cat: 'Tarihi', lon: 28.9639, lat: 41.0162, desc: 'Mimar Sinan\'ın kubbesi, Haliç\'e bakıyor. Avlusunda kurulan sahra hastanesi boşaltıldı.' },
    { id: 'kapalicarsi', name: 'Kapalıçarşı', cat: 'Tarihi', lon: 28.9680, lat: 41.0108, desc: 'Dünyanın en eski kapalı çarşısı. Kepenkler kapalı; koridorlarda sadece rüzgâr var.' },
    { id: 'dolmabahce', name: 'Dolmabahçe Sarayı', cat: 'Tarihi', lon: 29.0000, lat: 41.0392, desc: 'Boğaz\'ın kıyısında beyaz mermer. Sis, avizeleri söndürdü.' },
    { id: 'taksim', name: 'Taksim Meydanı', cat: 'Meydan', lon: 28.9850, lat: 41.0369, desc: 'İstiklal Caddesi\'nin başlangıcı. Meydan boş; ışıklar yanıp sönüyor.' },
    { id: 'ortakoy', name: 'Ortaköy', cat: 'Semt', lon: 29.0270, lat: 41.0477, desc: 'Boğaz Köprüsü\'nün ayağının altında, kumpir dükkânlarıyla ünlü sahil. Köprü artık sessiz.' },
    { id: 'bebek', name: 'Bebek', cat: 'Semt', lon: 29.0430, lat: 41.0780, desc: 'Koyun kıyısında çay bahçeleri. Sis, koyu doldurdu.' },
    { id: 'besiktas', name: 'Beşiktaş', cat: 'Semt', lon: 29.0090, lat: 41.0430, desc: 'İskele ve çarşı. Tahliye edilen son iskelelerden biri.' },
    { id: 'sisli', name: 'Şişli', cat: 'Semt', lon: 28.9870, lat: 41.0600, desc: 'Gökdelenler ve hastaneler. Panzehir çalışmalarının ilk yeri.' },
    { id: 'levent', name: 'Levent', cat: 'Semt', lon: 29.0090, lat: 41.0810, desc: 'Finans merkezi. Cam kulelerin ışıkları tek tek söndü.' },
    { id: 'uskudar', name: 'Üsküdar', cat: 'Semt', lon: 29.0150, lat: 41.0264, desc: 'Kız Kulesi\'ne bakan kıyı. Salacak\'ta tekneler bekler.' },
    { id: 'kadikoy', name: 'Kadıköy', cat: 'Semt', lon: 29.0270, lat: 40.9903, desc: 'Anadolu yakasının kalbi. Çarşıda son direnen grup.' },
    { id: 'camlica', name: 'Çamlıca Tepesi', cat: 'Doğa', lon: 29.0700, lat: 41.0270, desc: 'Şehri kuşbakışı gören tepe. Sisin yayılımını izleyen son gözlem noktası.' },
    { id: 'haydarpasa', name: 'Haydarpaşa Garı', cat: 'Ulaşım', lon: 29.0200, lat: 41.0000, desc: 'Trenler durdu. Peronlarda sadece bagajlar kaldı.' },
    { id: 'eyup', name: 'Eyüp Sultan', cat: 'Tarihi', lon: 28.9340, lat: 41.0470, desc: 'Haliç\'in sonunda, tarihi mezarlıkların arasında. Sessizliğin en yoğun olduğu yer.' },
    { id: 'balat', name: 'Balat', cat: 'Semt', lon: 28.9480, lat: 41.0290, desc: 'Renkli evler, dar sokaklar. Kızıl Sis\'in ilk görüldüğü mahalle.' },
    { id: 'bosphorus_bridge', name: '15 Temmuz Köprüsü', cat: 'Ulaşım', lon: 29.0340, lat: 41.0450, desc: 'Ortaköy–Beylerbeyi arasındaki asma köprü. Karantinada kapatıldı.' },
    { id: 'fsm_bridge', name: 'Fatih Sultan Mehmet Köprüsü', cat: 'Ulaşım', lon: 29.0600, lat: 41.0900, desc: 'Kuzeydeki ikinci Boğaz geçişi. Kamyonlar terk edilmiş.' },
    { id: 'sariyer', name: 'Sarıyer', cat: 'Semt', lon: 29.0570, lat: 41.1670, desc: 'Boğaz\'ın kuzey kapısı. Balıkçı tekneleri kıyıya çekildi.' },
    { id: 'bakirkoy', name: 'Bakırköy', cat: 'Semt', lon: 28.8700, lat: 40.9800, desc: 'Batı yakasının büyük yerleşimi. Sahil yolu tıkanmış durumda.' },
    { id: 'moda', name: 'Moda', cat: 'Semt', lon: 29.0250, lat: 40.9870, desc: 'Çay bahçeleri ve iskele. Kadıköy\'ün sakin köşesi.' },
    { id: 'ataturk_airport', name: 'Atatürk Havalimanı', cat: 'Ulaşım', lon: 28.8146, lat: 40.9769, desc: 'Uçuşlar durduruldu. Pist, geçici karantina çadırlarıyla dolu.' },
    { id: 'sabiha', name: 'Sabiha Gökçen Havalimanı', cat: 'Ulaşım', lon: 29.3092, lat: 40.8986, desc: 'Anadolu yakasının çıkış kapısı. Son uçuş 09. gün.' },
    { id: 'buyukada', name: 'Büyükada', cat: 'Doğa', lon: 29.1200, lat: 40.8650, desc: 'Prens Adaları\'nın en büyüğü. Atlı faytonlar, sessiz sokaklar ve deniz.' }
  ];

  const ROUTE = [
    { lon: 28.9757, lat: 41.0240, chapter: 'ch1', label: 'Karaköy' },
    { lon: 28.9744, lat: 41.0256, chapter: 'ch1', label: 'Galata Kulesi' },
    { lon: 28.9720, lat: 41.0235, chapter: 'ch2', label: 'Bankalar Cd.' },
    { lon: 28.9790, lat: 41.0195, chapter: 'ch2', label: 'Karaköy Rıhtımı' },
    { lon: 29.0041, lat: 41.0211, chapter: 'ch3', label: 'Kız Kulesi' }
  ];

  const ROADS = {
    major: [
      // O-1 çevre yolu (Avrupa)
      [[28.790, 40.995], [28.845, 41.000], [28.880, 41.010], [28.905, 41.030], [28.920, 41.060], [28.945, 41.080], [28.985, 41.093], [29.020, 41.078], [29.045, 41.062], [29.075, 41.048], [29.100, 41.030], [29.125, 41.010], [29.145, 40.985]],
      // TEM (O-2)
      [[28.720, 41.050], [28.790, 41.070], [28.860, 41.095], [28.930, 41.115], [29.000, 41.125], [29.060, 41.100], [29.120, 41.105], [29.190, 41.120], [29.280, 41.150], [29.390, 41.170]],
      // E-5
      [[28.725, 40.985], [28.780, 41.000], [28.840, 41.005], [28.895, 41.020], [28.940, 41.030], [28.980, 41.045], [29.010, 41.060]],
      // sahil yolu Avrupa
      [[28.800, 40.970], [28.870, 40.978], [28.930, 40.993], [28.977, 41.004], [29.000, 41.020], [29.010, 41.035], [29.028, 41.048], [29.043, 41.065], [29.052, 41.085], [29.056, 41.108], [29.060, 41.130], [29.065, 41.155], [29.090, 41.185], [29.105, 41.220]],
      // sahil yolu Asya
      [[29.115, 40.995], [29.080, 41.000], [29.040, 41.005], [29.018, 41.020], [29.030, 41.035], [29.045, 41.048], [29.055, 41.070], [29.062, 41.090], [29.080, 41.105], [29.095, 41.130], [29.100, 41.160], [29.108, 41.195], [29.115, 41.230]],
      // Bağdat Caddesi
      [[29.025, 40.988], [29.060, 40.975], [29.100, 40.963], [29.145, 40.955], [29.190, 40.950], [29.240, 40.940]],
      // kuzey bağlantı
      [[29.108, 41.250], [29.120, 41.200], [29.150, 41.160], [29.200, 41.170], [29.250, 41.190], [29.330, 41.200]]
    ],
    minor: [
      [[28.985, 41.017], [28.985, 41.045], [28.990, 41.060], [29.000, 41.080], [29.010, 41.100]],
      [[28.940, 41.020], [28.960, 41.018], [28.977, 41.019]],
      [[28.975, 41.025], [28.975, 41.045], [28.985, 41.060]],
      [[29.010, 41.048], [29.030, 41.050], [29.050, 41.055]],
      [[29.020, 41.000], [29.030, 41.010], [29.045, 41.020], [29.060, 41.035]],
      [[28.880, 40.985], [28.920, 40.990], [28.960, 40.995]],
      [[29.060, 40.980], [29.080, 40.995], [29.100, 41.010]],
      [[28.930, 41.030], [28.955, 41.042], [28.975, 41.050]]
    ]
  };

  /* Street grid areas — real neighbourhoods, irregular spacing/angle */
  const URBAN = [
    // Galata / Karaköy / Beyoğlu / Cihangir
    { lon0: 28.9650, lat0: 41.0148, lon1: 28.9950, lat1: 41.0450, angle: -0.42, step: 3.6, block: 1 },
    // Fatih / Eminönü / Aksaray
    { lon0: 28.9350, lat0: 41.0020, lon1: 28.9790, lat1: 41.0235, angle: 0.22, step: 4.2, block: 1 },
    // Beşiktaş / Ortaköy / Levent edge
    { lon0: 28.9930, lat0: 41.0330, lon1: 29.0260, lat1: 41.0630, angle: 0.30, step: 4.4, block: 1 },
    // Şişli / Mecidiyeköy
    { lon0: 28.9720, lat0: 41.0520, lon1: 29.0100, lat1: 41.0820, angle: 0.10, step: 5.4, block: 1 },
    // Üsküdar / Salacak
    { lon0: 29.0080, lat0: 41.0170, lon1: 29.0400, lat1: 41.0420, angle: -0.18, step: 4.2, block: 1 },
    // Kadıköy / Moda / Hasanpaşa
    { lon0: 29.0150, lat0: 40.9780, lon1: 29.0560, lat1: 41.0010, angle: 0.46, step: 4.6, block: 1 },
    // Bakırköy
    { lon0: 28.8450, lat0: 40.9680, lon1: 28.8850, lat1: 40.9930, angle: -0.12, step: 5.6, block: 1 },
    // Beykoz / Anadolu Hisarı
    { lon0: 29.0880, lat0: 41.0950, lon1: 29.1250, lat1: 41.1400, angle: 0.55, step: 6.4, block: 0 }
  ];

  const STREET_LABELS = [
    { name: 'BANKALAR CADDESİ', lon: 28.9700, lat: 41.0227, rot: -0.30, size: 7.4 },
    { name: 'İSTİKLAL CADDESİ', lon: 28.9772, lat: 41.0332, rot: -0.50, size: 7.8 },
    { name: 'KEMERALTI CADDESİ', lon: 28.9682, lat: 41.0158, rot: 0.18, size: 7.0 },
    { name: 'MEŞRUTİYET CADDESİ', lon: 28.9795, lat: 41.0402, rot: -0.35, size: 7.2 },
    { name: 'KİLİT BAHÇE SOKAK', lon: 28.9728, lat: 41.0247, rot: -0.42, size: 6.4 },
    { name: 'NECATİBEY CADDESİ', lon: 28.9612, lat: 41.0155, rot: 0.16, size: 7.0 },
    { name: 'DİVANYOLU CADDESİ', lon: 28.9715, lat: 41.0086, rot: 0.22, size: 7.4 },
    { name: 'KENNEDY CADDESİ', lon: 28.9560, lat: 40.9985, rot: -0.12, size: 7.4 },
    { name: 'BAĞDAT CADDESİ', lon: 29.1140, lat: 40.9560, rot: 0.06, size: 7.4 },
    { name: 'SALACAK CADDESİ', lon: 29.0160, lat: 41.0212, rot: 0.34, size: 6.6 },
    { name: 'BARBAROS BULVARI', lon: 29.0005, lat: 41.0468, rot: 0.12, size: 7.2 },
    { name: 'BÜYÜKDERE CADDESİ', lon: 28.9960, lat: 41.0680, rot: 0.05, size: 7.2 }
  ];

  const HIGHWAY_SHIELDS = [
    { name: 'O-1', lon: 28.9180, lat: 41.0470 },
    { name: 'O-2', lon: 28.9050, lat: 41.0800 },
    { name: 'D-100', lon: 28.8560, lat: 41.0060 },
    { name: 'O-1', lon: 29.0700, lat: 41.0430 },
    { name: 'D-100', lon: 29.1350, lat: 40.9450 }
  ];

  const RAIL = [
    { color: '#00a1ab', name: 'Marmaray', pts: [[28.900, 40.995], [28.950, 41.003], [28.980, 41.012], [29.000, 41.005], [29.020, 41.000], [29.060, 40.995]] },
    { color: '#c73a38', name: 'M2', pts: [[28.968, 41.010], [28.975, 41.030], [28.988, 41.045], [29.000, 41.062], [29.010, 41.080]] },
    { color: '#e97b1c', name: 'M4', pts: [[29.025, 40.990], [29.045, 40.982], [29.070, 40.970], [29.100, 40.960], [29.170, 40.940], [29.250, 40.915]] },
    { color: '#2b7bba', name: 'T1', pts: [[28.940, 41.020], [28.965, 41.017], [28.985, 41.011], [29.000, 41.020]] },
    { color: '#00a651', name: 'F1', pts: [[28.978, 41.012], [28.982, 41.028]] }
  ];

  const IST = {
    canvas: null, ctx: null,
    base: { map: null, sat: null },
    cam: { x: P(28.9820, 41.0250).x, y: P(28.9820, 41.0250).y, zoom: 3.05 },
    layer: 'map',
    fit: 1,
    dpr: 1,
    sw: 1, sh: 1,
    draggable: true,
    selected: null,
    showRoute: true,
    activeChapter: 'ch1',
    pulse: 0,
    hover: null,
    raf: null,
    dirty: true,
    searchResults: []
  };

  const SAT = {
    water: '#16323f', land: '#333a2c', park: '#22351f', urban: '#3a3a31',
    road: '#a29d82', roadCasing: '#736f5b', highway: '#c9a557', label: '#e8e4d6', labelHalo: 'rgba(8,12,10,.7)',
    rail: '#8a8574', building: 'rgba(255,255,255,.035)'
  };
  const MAP = {
    water: '#aadaff', land: '#f1f3f4', park: '#c9e7c9', urban: '#e9ebee',
    road: '#ffffff', roadCasing: '#dde2e7', highway: '#fdd877', highwayCasing: '#eec35a',
    label: '#5f6368', labelHalo: 'rgba(255,255,255,.92)',
    rail: '#9aa0a6', building: '#e4e7ea', buildingEdge: 'rgba(0,0,0,.055)'
  };

  function pathPoly(ctx, points, close = true) {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    if (close) ctx.closePath();
  }

  function drawRoad(ctx, line, width, color, casing) {
    const pts2 = pts(line);
    if (casing) {
      ctx.strokeStyle = casing;
      ctx.lineWidth = width + 4;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      pathPoly(ctx, pts2, false); ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    pathPoly(ctx, pts2, false); ctx.stroke();
  }

  /* ---------------- street network helpers ---------------- */
  const LAKE_POLYS = LAKES.map(l => pts(l.pts));
  const ISLAND_POLYS = ISLANDS.map(i => pts(i.pts));
  const inWaterAt = (x, y) => {
    if (pointInPoly(x, y, BOSPHORUS)) return true;
    if (pointInPoly(x, y, GOLDEN_HORN)) return true;
    for (const poly of LAKE_POLYS) if (pointInPoly(x, y, poly)) return true;
    for (const poly of ISLAND_POLYS) if (pointInPoly(x, y, poly)) return true;
    return false;
  };
  const onLandAt = (x, y) => !inWaterAt(x, y) && (pointInPoly(x, y, EUROPE) || pointInPoly(x, y, ASIA));

  function strokeClipped(ctx, p0, p1, okFn, width, color) {
    const dx = p1.x - p0.x, dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return;
    const steps = Math.max(2, Math.ceil(len / 1.6));
    ctx.beginPath();
    let drawing = false;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, x = p0.x + dx * t, y = p0.y + dy * t;
      if (okFn(x, y)) {
        if (!drawing) { ctx.moveTo(x, y); drawing = true; }
        else ctx.lineTo(x, y);
      } else if (drawing) {
        drawing = false;
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /* City patches: rotated grids of white streets over a light urban wash.
     Painted before water is re-drawn, so streets stop exactly at the coastline. */
  const CITY_PATCHES = [
    // European side
    { lon: 28.9720, lat: 41.0260, w: 330, h: 260, angle: -0.42, step: 5.0 },  // Galata / Karaköy / Cihangir
    { lon: 28.9840, lat: 41.0430, w: 300, h: 250, angle: -0.30, step: 5.2 },  // Beyoğlu / Şişhane / Taksim
    { lon: 28.9600, lat: 41.0130, w: 380, h: 230, angle: 0.20, step: 5.0 },  // Fatih / Eminönü / Aksaray
    { lon: 28.9400, lat: 41.0370, w: 330, h: 210, angle: -0.10, step: 5.4 },  // Eyüp / Balat / Fener
    { lon: 28.9920, lat: 41.0560, w: 300, h: 250, angle: 0.28, step: 5.2 },  // Beşiktaş / Levent / Etiler
    { lon: 28.9750, lat: 41.0680, w: 330, h: 240, angle: 0.08, step: 5.4 },  // Şişli / Mecidiyeköy
    { lon: 28.8650, lat: 40.9830, w: 300, h: 190, angle: -0.14, step: 5.6 },  // Bakırköy
    { lon: 28.9150, lat: 41.0050, w: 350, h: 200, angle: 0.05, step: 5.6 },  // Zeytinburnu / Bayrampaşa
    { lon: 29.0300, lat: 41.1050, w: 250, h: 220, angle: 0.50, step: 5.8 },  // Sarıyer / Büyükdere
    // Asian side
    { lon: 29.0220, lat: 41.0280, w: 270, h: 220, angle: -0.18, step: 5.2 },  // Üsküdar / Salacak
    { lon: 29.0380, lat: 40.9950, w: 340, h: 240, angle: 0.44, step: 5.2 },  // Kadıköy / Moda / Hasanpaşa
    { lon: 29.0900, lat: 40.9600, w: 330, h: 230, angle: 0.10, step: 5.6 },  // Maltepe / Bostancı
    { lon: 29.1000, lat: 41.0050, w: 300, h: 230, angle: 0.30, step: 5.6 },  // Ataşehir / Kozyatağı
    { lon: 29.0700, lat: 41.0450, w: 260, h: 200, angle: 0.20, step: 5.6 },  // Beylerbeyi / Çengelköy
    { lon: 29.1200, lat: 41.0600, w: 260, h: 230, angle: 0.36, step: 6.0 },  // Beykoz
    { lon: 29.0300, lat: 40.9150, w: 300, h: 200, angle: 0.20, step: 6.2 },  // Kartal / Pendik
    { lon: 28.9480, lat: 41.0570, w: 320, h: 240, angle: 0.18, step: 5.8 },  // Gaziosmanpaşa / Rami
    { lon: 28.9900, lat: 41.0180, w: 250, h: 200, angle: -0.35, step: 4.6 },  // Karaköy / Tophane / Kabataş
    { lon: 29.0580, lat: 41.0260, w: 280, h: 220, angle: 0.12, step: 5.2 },  // Üsküdar kuzey / Beylerbeyi
    { lon: 29.0700, lat: 40.9720, w: 300, h: 220, angle: 0.50, step: 5.4 }   // Göztepe / Koşuyolu
  ];

  function buildFabric(ctx, layer) {
    const S = 2;
    const urban = layer === 'sat' ? 'rgba(205,198,165,.28)' : '#e7eaee';
    const bld = layer === 'sat' ? 'rgba(230,225,200,.16)' : '#dfe4e8';
    const road = layer === 'sat' ? 'rgba(228,223,198,.55)' : '#ffffff';
    const roadCase = layer === 'sat' ? 'rgba(60,58,45,.30)' : '#dfe4e9';

    // ---- pass 1: very faint far-field grid (suburbs far from the story area)
    const farGrid = layer === 'sat' ? 'rgba(220,215,190,.07)' : 'rgba(255,255,255,.30)';
    for (const poly of [EUROPE, ASIA]) {
      ctx.save();
      ctx.beginPath(); pathPoly(ctx, poly); ctx.clip();
      ctx.strokeStyle = farGrid;
      ctx.lineWidth = 0.8;
      for (let x = 0; x < MAPW; x += 7.4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAPH); ctx.stroke(); }
      for (let y = 0; y < MAPH; y += 7.4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAPW, y); ctx.stroke(); }
      ctx.restore();
    }

    // ---- pass 2: rotated neighbourhood grids drawn on an offscreen tile with soft edges
    for (const g of CITY_PATCHES) {
      const c = P(g.lon, g.lat);
      const w = g.w, h = g.h, st = g.step;
      const off = U.makeCanvas(Math.ceil(w * S), Math.ceil(h * S));
      const octx = off.getContext('2d');
      octx.scale(S, S);
      octx.translate(w / 2, h / 2);

      // urban wash
      octx.fillStyle = urban;
      octx.fillRect(-w / 2 - 20, -h / 2 - 20, w + 40, h + 40);

      // blocks (irregular footprints, like a real street layout)
      const rngB = new U.RNG(Math.round(g.lon * 1000) + Math.round(g.lat * 1000));
      for (let y = -h / 2; y < h / 2; y += st) {
        for (let x = -w / 2; x < w / 2; x += st) {
          const bw = st * rngB.range(0.52, 0.78);
          const bh = st * rngB.range(0.52, 0.78);
          octx.fillStyle = rngB.chance(0.06) ? (layer === 'sat' ? 'rgba(120,140,90,.25)' : '#d7e8d2') : bld;
          octx.fillRect(x - bw / 2, y - bh / 2, bw, bh);
        }
      }

      // streets
      octx.lineCap = 'butt';
      for (const pass of [0, 1]) {
        octx.strokeStyle = pass === 0 ? roadCase : road;
        for (let x = -w / 2; x <= w / 2; x += st) {
          const arterial = Math.round((x + w / 2) / st) % 6 === 0;
          if (pass === 0 && !arterial) continue;
          octx.lineWidth = pass === 0 ? 2.8 : (arterial ? 2.1 : 1.0);
          octx.beginPath(); octx.moveTo(x, -h / 2 - 12); octx.lineTo(x, h / 2 + 12); octx.stroke();
        }
        for (let y = -h / 2; y <= h / 2; y += st) {
          const arterial = Math.round((y + h / 2) / st) % 6 === 0;
          if (pass === 0 && !arterial) continue;
          octx.lineWidth = pass === 0 ? 2.8 : (arterial ? 2.1 : 1.0);
          octx.beginPath(); octx.moveTo(-w / 2 - 12, y); octx.lineTo(w / 2 + 12, y); octx.stroke();
        }
      }

      // soft rectangular fade so patch borders are invisible
      octx.globalCompositeOperation = 'destination-in';
      const fade = octx.createLinearGradient(-w / 2, 0, w / 2, 0);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(0.20, 'rgba(0,0,0,.85)');
      fade.addColorStop(0.80, 'rgba(0,0,0,.85)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');
      octx.fillStyle = fade;
      octx.fillRect(-w / 2, -h / 2, w, h);
      const fadeV = octx.createLinearGradient(0, -h / 2, 0, h / 2);
      fadeV.addColorStop(0, 'rgba(0,0,0,0)');
      fadeV.addColorStop(0.22, 'rgba(0,0,0,1)');
      fadeV.addColorStop(0.78, 'rgba(0,0,0,1)');
      fadeV.addColorStop(1, 'rgba(0,0,0,0)');
      octx.fillStyle = fadeV;
      octx.fillRect(-w / 2, -h / 2, w, h);
      octx.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(g.angle);
      ctx.drawImage(off, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }


  /* ---------------- high-zoom street detail (real Karaköy–Galata street graph) ---------------- */
  const STREETS = [
    { name: 'Bankalar Caddesi', w: 12, pts: [[28.9712, 41.0247], [28.9727, 41.0242], [28.9744, 41.0236], [28.9761, 41.0231], [28.9778, 41.0226]] },
    { name: 'Kemeraltı Caddesi', w: 11, pts: [[28.9666, 41.0169], [28.9682, 41.0165], [28.9700, 41.0159], [28.9721, 41.0153]] },
    { name: 'Necatibey Caddesi', w: 11, pts: [[28.9578, 41.0162], [28.9610, 41.0156], [28.9640, 41.0150], [28.9666, 41.0145]] },
    { name: 'Mumhane Caddesi', w: 8, pts: [[28.9706, 41.0254], [28.9713, 41.0240], [28.9720, 41.0228]] },
    { name: 'Tersane Caddesi', w: 8, pts: [[28.9690, 41.0256], [28.9700, 41.0247], [28.9710, 41.0236]] },
    { name: 'Kılıç Ali Paşa Cami Sokağı', w: 6, pts: [[28.9725, 41.0246], [28.9731, 41.0232], [28.9735, 41.0218]] },
    { name: 'Galata Yokuşu', w: 7, pts: [[28.9742, 41.0238], [28.9738, 41.0249], [28.9734, 41.0259], [28.9731, 41.0268]] },
    { name: 'Galip Dede Caddesi', w: 9, pts: [[28.9731, 41.0271], [28.9745, 41.0278], [28.9759, 41.0287], [28.9767, 41.0298]] },
    { name: 'Serdar-ı Ekrem Caddesi', w: 8, pts: [[28.9752, 41.0259], [28.9759, 41.0266], [28.9766, 41.0274]] },
    { name: 'Yüksek Kaldırım Caddesi', w: 8, pts: [[28.9741, 41.0255], [28.9747, 41.0268], [28.9754, 41.0282], [28.9760, 41.0296]] },
    { name: 'İstiklal Caddesi', w: 13, pts: [[28.9752, 41.0298], [28.9765, 41.0312], [28.9775, 41.0327], [28.9785, 41.0342], [28.9800, 41.0357]] },
    { name: 'Meşrutiyet Caddesi', w: 11, pts: [[28.9780, 41.0352], [28.9790, 41.0365], [28.9803, 41.0377]] },
    { name: 'Sahil (Kennedy) Caddesi', w: 14, pts: [[28.9706, 41.0186], [28.9740, 41.0196], [28.9775, 41.0208], [28.9808, 41.0212]] },
    { name: 'Tophane İskele Caddesi', w: 7, pts: [[28.9770, 41.0233], [28.9790, 41.0244], [28.9808, 41.0256]] },
    { name: 'Cihangir Caddesi', w: 7, pts: [[28.9770, 41.0299], [28.9790, 41.0303], [28.9808, 41.0309]] },
    { name: 'Sıraselviler Caddesi', w: 10, pts: [[28.9788, 41.0322], [28.9804, 41.0338], [28.9818, 41.0352]] },
    { name: 'Ankara Caddesi', w: 10, pts: [[28.9640, 41.0142], [28.9662, 41.0150], [28.9686, 41.0160]] },
    { name: 'Bankacılar Sokağı', w: 5, pts: [[28.9720, 41.0244], [28.9724, 41.0233]] },
    { name: "Karaköy Rıhtımı", w: 12, pts: [[28.9700, 41.0192], [28.9730, 41.0200], [28.9760, 41.0211], [28.9784, 41.0221]] }
  ];

  const HOODS = [
    { name: 'KARAKÖY', lon: 28.9736, lat: 41.0218, size: 9.4 },
    { name: 'GALATA', lon: 28.9747, lat: 41.0262, size: 8.6 },
    { name: 'TOPHANE', lon: 28.9793, lat: 41.0250, size: 8 },
    { name: 'CIHANGİR', lon: 28.9804, lat: 41.0300, size: 8 },
    { name: 'ŞİŞHANE', lon: 28.9720, lat: 41.0298, size: 8 },
    { name: 'KEMERALTI', lon: 28.9684, lat: 41.0158, size: 8 },
    { name: 'SALACAK', lon: 29.0142, lat: 41.0210, size: 8 }
  ];

  // deterministic building blocks along the Karaköy–Galata street graph
  const BUILDINGS = (() => {
    const out = [];
    const rng = new U.RNG(90210);
    for (const st of STREETS) {
      const arr = st.pts;
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i], b = arr[i + 1];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        const nx = -uy, ny = ux;
        const segs = Math.max(1, Math.round(len / 0.00075));
        for (let k = 0; k < segs; k++) {
          const t = (k + 0.5) / segs;
          const cx = a[0] + dx * t, cy = a[1] + dy * t;
          for (const side of [-1, 1]) {
            if (rng.chance(0.22)) continue;
            const off = (0.00055 + rng.range(0, 0.0005)) * side;
            const bw = 0.00055 + rng.range(0, 0.00055);
            const bh = 0.00038 + rng.range(0, 0.00030);
            out.push({
              lon: cx + nx * off, lat: cy + ny * off,
              w: bw, h: bh, ang: Math.atan2(dy, dx) + (rng.chance(.18) ? Math.PI / 2 : 0),
              tone: rng.range(0, 1)
            });
          }
        }
      }
    }
    return out;
  })();

  function drawBuildings(ctx) {
    const sat = IST.layer === 'sat';
    for (const b of BUILDINGS) {
      const p = P(b.lon, b.lat);
      const sx = fitScale() * IST.cam.zoom;
      const w = b.w * (MAPW / (LON1 - LON0)) * sx;
      const h = b.h * (MAPH / (LAT0 - LAT1)) * sx;
      if (w < 1.2 || h < 1.2) continue;
      const q = worldToScreen(p.x, p.y);
      if (q.x < -40 || q.y < -40 || q.x > IST.sw + 40 || q.y > IST.sh + 40) continue;
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(b.ang);
      ctx.fillStyle = sat
        ? `rgba(${120 + b.tone * 60 | 0},${112 + b.tone * 50 | 0},${96 + b.tone * 40 | 0},.85)`
        : (b.tone > 0.86 ? '#e8dcc8' : b.tone > 0.62 ? '#dfe3e7' : '#e9ebee');
      ctx.fillRect(-w / 2, -h / 2, w, h);
      if (!sat) {
        ctx.strokeStyle = 'rgba(180,188,196,.75)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
      }
      ctx.restore();
    }
  }

  function drawStreetDetail(ctx, s) {
    // building footprints under the roads at high zoom
    if (IST.cam.zoom > 6.4) drawBuildings(ctx);

    for (const st of STREETS) {
      const p = pts(st.pts);
      const w = U.clamp((st.w / 120) * 30 * IST.cam.zoom, 2.2, 20);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = IST.layer === 'sat' ? 'rgba(58,56,44,.65)' : '#cfd8e0';
      ctx.lineWidth = w + Math.max(1.3, w * 0.30);
      pathPoly(ctx, p, false); ctx.stroke();
      ctx.strokeStyle = IST.layer === 'sat' ? '#bdb18a' : '#ffffff';
      ctx.lineWidth = w;
      pathPoly(ctx, p, false); ctx.stroke();
    }

    // street names only on long-enough on-screen segments
    const showNames = U.clamp((IST.cam.zoom - 3.4) / 1.0, 0, 1);
    if (showNames > 0.02) {
      ctx.save();
      ctx.globalAlpha = showNames;
      for (const st of STREETS) {
        const p = pts(st.pts);
        let best = null;
        for (let i = 0; i < p.length - 1; i++) {
          const A = worldToScreen(p[i].x, p[i].y), B = worldToScreen(p[i + 1].x, p[i + 1].y);
          const len = Math.hypot(B.x - A.x, B.y - A.y);
          if (!best || len > best.len) best = { A, B, len };
        }
        if (!best) continue;
        ctx.font = '500 9.5px Inter, Arial, sans-serif';
        const tw = ctx.measureText(st.name).width;
        if (best.len < tw + 26) continue;
        let ang = Math.atan2(best.B.y - best.A.y, best.B.x - best.A.x);
        if (ang > Math.PI / 2) ang -= Math.PI;
        if (ang < -Math.PI / 2) ang += Math.PI;
        ctx.save();
        ctx.translate((best.A.x + best.B.x) / 2, (best.A.y + best.B.y) / 2);
        ctx.rotate(ang);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = IST.layer === 'sat' ? 'rgba(10,14,10,.8)' : 'rgba(255,255,255,.95)';
        ctx.strokeText(st.name, 0, 0);
        ctx.fillStyle = IST.layer === 'sat' ? 'rgba(240,236,222,.92)' : '#79818a';
        ctx.fillText(st.name, 0, 0);
        ctx.restore();
      }
      // neighbourhood labels
      for (const h of HOODS) {
        const q = worldToScreen(P(h.lon, h.lat).x, P(h.lon, h.lat).y);
        ctx.font = `600 ${h.size + 3}px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const text = h.name.split('').join('\u200a');
        ctx.lineWidth = 3.6;
        ctx.strokeStyle = IST.layer === 'sat' ? 'rgba(10,14,10,.6)' : 'rgba(255,255,255,.92)';
        ctx.strokeText(text, q.x, q.y);
        ctx.fillStyle = IST.layer === 'sat' ? 'rgba(235,232,220,.8)' : 'rgba(126,134,142,.96)';
        ctx.fillText(text, q.x, q.y);
      }
      ctx.restore();
    }
  }


  const BRIDGES = [
    [[28.9755, 41.0185], [28.9825, 41.0206]],   // Atatürk Köprüsü
    [[28.9698, 41.0246], [28.9768, 41.0268]],   // Galata Köprüsü
    [[28.9632, 41.0314], [28.9708, 41.0336]],   // Haliç Metro Köprüsü
    [[29.0252, 41.0452], [29.0432, 41.0458]],   // 15 Temmuz Şehitler Köprüsü
    [[29.0472, 41.0888], [29.0708, 41.0892]]    // FSM Köprüsü
  ];

  function drawBridges(ctx) {
    const sat = IST.layer === 'sat';
    ctx.save();
    ctx.lineCap = 'round';
    for (const b of BRIDGES) {
      const A = worldToScreen(P(b[0][0], b[0][1]).x, P(b[0][0], b[0][1]).y);
      const B = worldToScreen(P(b[1][0], b[1][1]).x, P(b[1][0], b[1][1]).y);
      ctx.strokeStyle = sat ? 'rgba(40,38,30,.9)' : 'rgba(200,180,120,.95)';
      ctx.lineWidth = 6.5;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.strokeStyle = sat ? '#cfc7a8' : '#fdd877';
      ctx.lineWidth = 4.2;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    ctx.restore();
  }

  function buildBase(layer) {
    const S = 2;
    const c = U.makeCanvas(MAPW * S, MAPH * S);
    const ctx = c.getContext('2d');
    ctx.scale(S, S);
    const C = layer === 'sat' ? SAT : MAP;
    // water
    const wg = ctx.createLinearGradient(0, 0, 0, MAPH);
    wg.addColorStop(0, layer === 'sat' ? '#122a35' : '#aadaff');
    wg.addColorStop(1, layer === 'sat' ? '#1c4653' : '#b6ddf7');
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, MAPW, MAPH);
    // subtle water texture
    const rng = new U.RNG(414);
    ctx.strokeStyle = layer === 'sat' ? 'rgba(120,200,210,.06)' : 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 150; i++) {
      const x = rng.range(0, MAPW), y = rng.range(0, MAPH);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 22, y - 3, x + 48, y + 3, x + 70, y);
      ctx.stroke();
    }

    // land
    const landGrad = ctx.createLinearGradient(0, 0, MAPW, MAPH);
    if (layer === 'sat') {
      landGrad.addColorStop(0, '#343a2c'); landGrad.addColorStop(.5, '#3a3d30'); landGrad.addColorStop(1, '#2f3628');
    } else {
      landGrad.addColorStop(0, '#f3f4f3'); landGrad.addColorStop(1, '#eceeec');
    }
    ctx.fillStyle = landGrad;
    pathPoly(ctx, EUROPE); ctx.fill();
    pathPoly(ctx, ASIA); ctx.fill();

    // dense city fabric (painted on land before the water is re-drawn on top)
    buildFabric(ctx, layer);

    // satellite speckle
    if (layer === 'sat') {
      const rng2 = new U.RNG(78);
      for (let i = 0; i < 2600; i++) {
        const x = rng2.range(0, MAPW), y = rng2.range(0, MAPH);
        ctx.fillStyle = `rgba(${rng2.chance(.5) ? '120,110,80' : '20,40,25'},${rng2.range(.02, .08)})`;
        ctx.fillRect(x, y, rng2.range(2, 8), rng2.range(2, 8));
      }
    }

    // interior water re-painted over the fabric so coastlines stay crisp
    const waterFill = layer === 'sat' ? '#173744' : '#aadaff';
    ctx.fillStyle = waterFill;
    pathPoly(ctx, BOSPHORUS); ctx.fill();
    pathPoly(ctx, GOLDEN_HORN); ctx.fill();
    for (const l of LAKES) { pathPoly(ctx, pts(l.pts)); ctx.fill(); }
    // subtle shoreline stroke
    ctx.strokeStyle = layer === 'sat' ? 'rgba(140,200,210,.25)' : 'rgba(140,190,215,.55)';
    ctx.lineWidth = 1;
    pathPoly(ctx, BOSPHORUS); ctx.stroke();
    pathPoly(ctx, GOLDEN_HORN); ctx.stroke();

    // islands (green, labelled like Google's Adalar)
    for (const isl of ISLANDS) {
      ctx.fillStyle = layer === 'sat' ? '#3c4a33' : '#dcebd9';
      pathPoly(ctx, pts(isl.pts)); ctx.fill();
      ctx.strokeStyle = layer === 'sat' ? 'rgba(200,220,200,.2)' : 'rgba(160,190,160,.85)';
      ctx.lineWidth = 1; ctx.stroke();
      const ip = pts(isl.pts);
      let cx = 0, cy = 0;
      ip.forEach(q => { cx += q.x; cy += q.y; });
      cx /= ip.length; cy /= ip.length;
      ctx.save();
      ctx.font = '500 8px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = layer === 'sat' ? 'rgba(225,232,215,.75)' : 'rgba(110,125,110,.95)';
      ctx.fillText(isl.name, cx, cy + 3);
      ctx.restore();
    }

    // parks
    for (const p of PARKS) {
      ctx.fillStyle = C.park;
      pathPoly(ctx, pts(p.pts)); ctx.fill();
      if (layer === 'sat') {
        ctx.fillStyle = 'rgba(80,120,70,.18)';
        pathPoly(ctx, pts(p.pts)); ctx.fill();
      }
    }

    // roads
    for (const line of ROADS.minor) drawRoad(ctx, line, layer === 'sat' ? 1.5 : 2.3, C.road, C.roadCasing);
    for (const line of ROADS.major) {
      drawRoad(ctx, line, layer === 'sat' ? 2.2 : 2.9, C.highway,
        layer === 'sat' ? 'rgba(80,76,60,.5)' : C.highwayCasing);
    }

    // rail / metro
    for (const r of RAIL) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = layer === 'sat' ? .6 : .85;
      ctx.lineWidth = 2;
      pathPoly(ctx, pts(r.pts), false); ctx.stroke();
      ctx.restore();
    }

    // street names (thin grey captions, only at closer zooms)
    const zoomNow = fitScale() * IST.cam.zoom;
    if (zoomNow > 1.35) {
      ctx.save();
      ctx.globalAlpha = U.clamp((zoomNow - 1.35) / 0.9, 0, 1) * 0.95;
      for (const st of STREET_LABELS) {
        const p = P(st.lon, st.lat);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(st.rot);
        ctx.font = `500 ${Math.max(5.4, st.size * 0.78)}px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = layer === 'sat' ? 'rgba(20,26,22,.65)' : 'rgba(255,255,255,.85)';
        ctx.strokeText(st.name, 0, 0);
        ctx.fillStyle = layer === 'sat' ? 'rgba(232,228,214,.8)' : '#8b9096';
        ctx.fillText(st.name, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // highway shields
    ctx.save();
    ctx.globalAlpha = U.clamp((zoomNow - 1.1) / 0.8, 0, 1);
    for (const sh of HIGHWAY_SHIELDS) {
      const p = P(sh.lon, sh.lat);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = layer === 'sat' ? 'rgba(200,190,150,.9)' : '#8aa7c7';
      const w = 18, h = 11;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 2.5); else ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 7px Inter, Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(sh.name, 0, 0.5);
      ctx.restore();
    }
    ctx.restore();

    // water labels
    ctx.save();
    ctx.fillStyle = layer === 'sat' ? 'rgba(150,210,225,.65)' : '#5f9fc4';
    ctx.font = 'italic 300 13px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    const wl = [
      ['BOĞAZİÇİ', 29.030, 41.130, -0.55],
      ['HALİÇ', 28.952, 41.033, 0.25],
      ['MARMARA DENİZİ', 28.870, 40.900, 0],
      ['KARADENİZ', 29.150, 41.235, 0]
    ];
    for (const [name, lon, lat, rot] of wl) {
      const p = P(lon, lat);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rot);
      ctx.fillText(name, 0, 0);
      ctx.restore();
    }
    ctx.restore();

    // district fills + labels
    drawDistricts(ctx, layer);
    return c;
  }

  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  const DISTRICTS = [
    { name: 'BEYOĞLU', lon: 28.9800, lat: 41.0378, size: 12.5 },
    { name: 'FATİH', lon: 28.9480, lat: 41.0090, size: 12.5 },
    { name: 'BEŞİKTAŞ', lon: 29.0060, lat: 41.0500, size: 11.5 },
    { name: 'ŞİŞLİ', lon: 28.9845, lat: 41.0725, size: 11.5 },
    { name: 'SARIYER', lon: 29.0230, lat: 41.1830, size: 11.5 },
    { name: 'EYÜP', lon: 28.9180, lat: 41.0570, size: 11 },
    { name: 'BAKIRKÖY', lon: 28.8620, lat: 40.9705, size: 11.5 },
    { name: 'ÜSKÜDAR', lon: 29.0400, lat: 41.0430, size: 11.5 },
    { name: 'KADIKÖY', lon: 29.0445, lat: 40.9820, size: 12.5 },
    { name: 'BEYKOZ', lon: 29.1080, lat: 41.1250, size: 11 },
    { name: 'MALTEPE', lon: 29.1560, lat: 40.9420, size: 11 },
    { name: 'ATAŞEHİR', lon: 29.1240, lat: 40.9955, size: 10 }
  ];

  function drawDistricts(ctx, layer) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of DISTRICTS) {
      const p = P(d.lon, d.lat);
      ctx.font = `600 ${(d.size * 0.82).toFixed(1)}px Inter, Arial, sans-serif`;
      const text = d.name.split('').join('\u200a');
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = layer === 'sat' ? 'rgba(14,18,14,.55)' : 'rgba(255,255,255,.8)';
      ctx.strokeText(text, p.x, p.y);
      ctx.fillStyle = layer === 'sat' ? 'rgba(232,228,214,.62)' : 'rgba(154,160,166,.92)';
      ctx.fillText(text, p.x, p.y);
    }
    ctx.restore();
  }

  /* ---------------- view transform ---------------- */
  function fitScale() {
    return Math.max(IST.sw / MAPW, IST.sh / MAPH);
  }
  function worldToScreen(x, y) {
    const s = fitScale() * IST.cam.zoom;
    return {
      x: (x - IST.cam.x) * s + IST.sw / 2,
      y: (y - IST.cam.y) * s + IST.sh / 2,
      s
    };
  }
  function screenToWorld(x, y) {
    const s = fitScale() * IST.cam.zoom;
    return {
      x: (x - IST.sw / 2) / s + IST.cam.x,
      y: (y - IST.sh / 2) / s + IST.cam.y
    };
  }
  function clampCam() {
    const s = fitScale() * IST.cam.zoom;
    const halfW = IST.sw / (2 * s), halfH = IST.sh / (2 * s);
    const marginX = MAPW * 0.08, marginY = MAPH * 0.08;
    IST.cam.x = U.clamp(IST.cam.x, Math.min(halfW - marginX, MAPW / 2), Math.max(MAPW - halfW + marginX, MAPW / 2));
    IST.cam.y = U.clamp(IST.cam.y, Math.min(halfH - marginY, MAPH / 2), Math.max(MAPH - halfH + marginY, MAPH / 2));
  }

  /* ---------------- draw ---------------- */
  function draw() {
    if (!IST.ctx) return;
    const ctx = IST.ctx, sw = IST.sw, sh = IST.sh;
    ctx.setTransform(IST.dpr, 0, 0, IST.dpr, 0, 0);
    ctx.clearRect(0, 0, sw, sh);
    const base = IST.base[IST.layer];
    const s = fitScale() * IST.cam.zoom;
    ctx.save();
    ctx.translate(sw / 2, sh / 2);
    ctx.scale(s, s);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(base, -IST.cam.x, -IST.cam.y, MAPW, MAPH);
    ctx.restore();

    drawBridges(ctx);
    if (IST.cam.zoom > 4.2) drawStreetDetail(ctx, s);

    // zoom-dependent detail: landmarks and labels
    const showMinor = s > 0.5;
    const alpha = U.clamp((s - 0.35) / 0.3, 0, 1);

    // story route
    if (IST.showRoute) {
      ctx.save();
      ctx.globalAlpha = .95;
      ctx.beginPath();
      ROUTE.forEach((r, i) => {
        const p = worldToScreen(P(r.lon, r.lat).x, P(r.lon, r.lat).y);
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      });
      ctx.setLineDash([9, 8]);
      ctx.lineDashOffset = -IST.pulse * 22;
      ctx.strokeStyle = 'rgba(232,196,119,.95)';
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255,255,255,.65)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
    }

    // chapter badges first (they reserve label space)
    ctx.save();
    const occ = [];
    const hits = (x, y, w, h) => {
      for (const o of occ) if (x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y) return true;
      return false;
    };
    for (const r of ROUTE) {
      if (!r.chapter) continue;
      const p = worldToScreen(P(r.lon, r.lat).x, P(r.lon, r.lat).y);
      if (p.x < -20 || p.y < -20 || p.x > sw + 20 || p.y > sh + 20) continue;
      const isActive = r.chapter === IST.activeChapter;
      const bx = p.x, by = p.y - 19;
      ctx.font = '700 8.5px Inter, Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.beginPath(); ctx.arc(bx, by, 8.4, 0, 6.283);
      ctx.fillStyle = isActive ? '#1a73e8' : 'rgba(32,33,36,.62)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#fff';
      const label = r.chapter === 'ch1' ? 'I' : r.chapter === 'ch2' ? 'II' : 'III';
      ctx.fillText(label, bx, by + 0.5);
      occ.push({ x: bx - 11, y: by - 11, w: 22, h: 22 });
    }
    ctx.restore();

    // current location (blue dot, Google style)
    const cur = ROUTE.find(r => r.chapter === IST.activeChapter);
    if (cur) {
      const p = worldToScreen(P(cur.lon, cur.lat).x, P(cur.lon, cur.lat).y);
      ctx.save();
      ctx.beginPath(); ctx.arc(p.x, p.y, 16 + (IST.pulse % 1) * 22, 0, 6.283);
      ctx.fillStyle = `rgba(26,115,232,${0.16 * (1 - (IST.pulse % 1))})`;
      ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 6.4, 0, 6.283);
      ctx.fillStyle = '#1a73e8'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.restore();
    }

    // landmarks
    ctx.save();
    const ordered = LANDMARKS.slice().sort((a, b) => (b.story ? 1 : 0) - (a.story ? 1 : 0));
    for (const lm of ordered) {
      const p = worldToScreen(P(lm.lon, lm.lat).x, P(lm.lon, lm.lat).y);
      if (p.x < -40 || p.y < -40 || p.x > sw + 40 || p.y > sh + 40) continue;
      const isStory = lm.story;
      const isActive = lm.chapter === IST.activeChapter;
      const isSel = IST.selected === lm.id;
      const isHover = IST.hover === lm.id;
      if (!isStory && s < 0.62 && !isSel && !isHover) continue;
      const r = isStory ? 6.4 : 4.2;
      const col = isStory ? (isActive ? '#ea4335' : '#c5523f') : '#5f6368';
      if (isStory && isActive) {
        const pulse = (IST.pulse % 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 6 + pulse * 14, 0, 6.283);
        ctx.strokeStyle = `rgba(234,67,53,${0.55 * (1 - pulse)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (isStory) {
        ctx.beginPath(); ctx.arc(p.x, p.y, r + (isSel || isHover ? 3 : 0), 0, 6.283);
        ctx.fillStyle = 'rgba(234,67,53,.16)'; ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, isStory ? 4.2 : 3, 0, 6.283);
      ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke();
      if (isStory || isSel || isHover || s > 1.15) {
        const label = lm.name;
        ctx.font = isStory ? '600 12.5px Inter, Arial, sans-serif' : '500 11.5px Inter, Arial, sans-serif';
        const tw = ctx.measureText(label).width;
        const bw = tw + (isStory ? 42 : 10), bh = 19;
        const spots = [
          { x: p.x + 11, y: p.y - 9 },
          { x: p.x - 11 - bw, y: p.y - 9 },
          { x: p.x - bw / 2, y: p.y - 27 },
          { x: p.x - bw / 2, y: p.y + 11 },
          { x: p.x + 11, y: p.y + 11 },
          { x: p.x - 11 - bw, y: p.y + 11 }
        ];
        let spot = null;
        for (const sp of spots) if (!hits(sp.x - 2, sp.y - 2, bw + 4, bh + 4)) { spot = sp; break; }
        if (!spot) { if (!isStory) continue; spot = spots[0]; }
        occ.push({ x: spot.x - 2, y: spot.y - 2, w: bw + 4, h: bh + 4 });
        const lx = spot.x + 5, ly = spot.y + 13;
        ctx.fillStyle = IST.layer === 'sat' ? 'rgba(15,20,16,.72)' : 'rgba(255,255,255,.92)';
        roundRect(ctx, spot.x, spot.y, bw, bh, 4); ctx.fill();
        ctx.fillStyle = IST.layer === 'sat' ? '#f1ece0' : '#202124';
        ctx.textAlign = 'left';
        ctx.fillText(label, lx, ly);
        if (isStory) {
          ctx.font = '700 8px Inter, Arial, sans-serif';
          ctx.fillStyle = '#ea4335';
          ctx.fillText('HİKÂYE', lx + tw + 5, ly);
        }
      }
    }
    ctx.restore();

    // attribution chip
    ctx.save();
    ctx.font = '500 9.5px Inter, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(32,33,36,.55)';
    ctx.fillText('KARANLIK BOĞAZ · STİLİZE İSTANBUL HARİTASI', sw - 14, sh - 52);
    ctx.restore();

    // vignette
    const g = ctx.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * .35, sw / 2, sh / 2, Math.max(sw, sh) * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, IST.layer === 'sat' ? 'rgba(0,0,0,.45)' : 'rgba(20,30,40,.08)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------------- loop ---------------- */
  function loop(t) {
    IST.pulse = (t || 0) / 1600;
    draw();
    IST.raf = requestAnimationFrame(loop);
  }

  /* ---------------- public ---------------- */
  IST.init = function (canvas) {
    IST.canvas = canvas;
    IST.ctx = canvas.getContext('2d');
    IST.base.map = buildBase('map');
    IST.base.sat = buildBase('sat');
    IST.bindEvents();
  };

  IST.resize = function () {
    if (!IST.canvas) return;
    const rect = IST.canvas.parentElement.getBoundingClientRect();
    IST.dpr = Math.min(2, window.devicePixelRatio || 1);
    IST.sw = Math.max(320, rect.width);
    IST.sh = Math.max(240, rect.height);
    IST.canvas.width = Math.round(IST.sw * IST.dpr);
    IST.canvas.height = Math.round(IST.sh * IST.dpr);
    IST.canvas.style.width = IST.sw + 'px';
    IST.canvas.style.height = IST.sh + 'px';
    clampCam();
  };

  IST.show = function () {
    IST.resize();
    clampCam();
    draw();
    if (!IST.raf) IST.raf = requestAnimationFrame(loop);
  };
  IST.hide = function () {
    if (IST.raf) cancelAnimationFrame(IST.raf);
    IST.raf = null;
  };

  IST.setChapter = function (key) {
    IST.activeChapter = key;
    const anchor = key === 'ch1' ? [28.9762, 41.0225]
      : key === 'ch2' ? [28.9736, 41.0238]
      : [28.9900, 41.0215];
    const c = P(anchor[0], anchor[1]);
    IST.cam.x = c.x; IST.cam.y = c.y;
    IST.cam.zoom = Math.max(IST.cam.zoom, key === 'ch3' ? 2.4 : 4.6);
    clampCam();
    IST.dirty = true;
    draw();
  };

  IST.setLayer = function (layer) {
    IST.layer = layer;
    draw();
  };

  IST.frameOn = function (lon, lat, zoom) {
    const p = P(lon, lat);
    IST.cam.x = p.x; IST.cam.y = p.y;
    if (zoom) IST.cam.zoom = zoom;
    clampCam();
    draw();
  };

  IST.selectPlace = function (id, fly) {
    const lm = LANDMARKS.find(l => l.id === id);
    if (!lm) return;
    IST.selected = id;
    if (fly) {
      IST.cam.zoom = Math.max(IST.cam.zoom, 2.1);
      IST.frameOn(lm.lon, lm.lat, IST.cam.zoom);
    }
    IST.showInfo(lm);
    draw();
  };

  IST.showInfo = function (lm) {
    const el = document.getElementById('map-info');
    if (!el) return;
    document.getElementById('mi-kicker').textContent = lm.story ? 'HİKÂYE NOKTASI' : (lm.cat || 'YER').toUpperCase();
    document.getElementById('mi-title').textContent = lm.name;
    const p = P(lm.lon, lm.lat);
    document.getElementById('mi-meta').textContent =
      `${lm.lat.toFixed(4)}° K · ${lm.lon.toFixed(4)}° D`;
    document.getElementById('mi-text').textContent = lm.desc;
    el.classList.remove('hidden');
  };

  IST.hideInfo = function () {
    const el = document.getElementById('map-info');
    if (el) el.classList.add('hidden');
    IST.selected = null;
    draw();
  };

  IST.search = function (q) {
    const norm = (s) => s.toLowerCase()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, ' ').trim();
    const nq = norm(q);
    if (!nq) return [];
    return LANDMARKS.filter(l => norm(l.name).includes(nq) || norm(l.desc).includes(nq) || norm(l.cat).includes(nq))
      .sort((a, b) => (norm(a.name).indexOf(nq) === 0 ? -1 : 0) - (norm(b.name).indexOf(nq) === 0 ? -1 : 0));
  };

  IST.focusSearch = function (q) {
    const res = IST.search(q);
    if (!res.length) return false;
    IST.selectPlace(res[0].id, true);
    return true;
  };

  IST.zoom = function (dir, cx, cy) {
    const before = screenToWorld(cx === undefined ? IST.sw / 2 : cx, cy === undefined ? IST.sh / 2 : cy);
    IST.cam.zoom = U.clamp(IST.cam.zoom * (dir > 0 ? 1.32 : 1 / 1.32), 0.72, 14);
    clampCam();
    const after = screenToWorld(cx === undefined ? IST.sw / 2 : cx, cy === undefined ? IST.sh / 2 : cy);
    IST.cam.x += before.x - after.x;
    IST.cam.y += before.y - after.y;
    clampCam();
    draw();
  };

  IST.reset = function () {
    IST.cam.zoom = 3.05;
    const c = P(28.9820, 41.0250);
    IST.cam.x = c.x;
    IST.cam.y = c.y;
    clampCam();
    IST.hideInfo();
    draw();
  };

  IST.bindEvents = function () {
    const canvas = IST.canvas;
    let dragging = false, lastX = 0, lastY = 0, moved = 0, downX = 0, downY = 0;

    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; moved = 0;
      lastX = e.clientX; lastY = e.clientY;
      downX = e.clientX; downY = e.clientY;
      canvas.classList.add('dragging');
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        const s = fitScale() * IST.cam.zoom;
        IST.cam.x -= dx / s;
        IST.cam.y -= dy / s;
        clampCam();
        draw();
      } else {
        const hit = hitTest(mx, my);
        if (hit !== IST.hover) {
          IST.hover = hit;
          canvas.style.cursor = hit ? 'pointer' : 'grab';
          draw();
        }
      }
    });
    const release = (e) => {
      if (!dragging) return;
      dragging = false;
      canvas.classList.remove('dragging');
      if (moved < 6) {
        const rect = canvas.getBoundingClientRect();
        const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit) IST.selectPlace(hit, false);
        else IST.hideInfo();
      }
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', () => { dragging = false; canvas.classList.remove('dragging'); });
    canvas.addEventListener('pointerleave', () => { if (!dragging) { IST.hover = null; draw(); } });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      IST.zoom(e.deltaY < 0 ? 1 : -1, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    function hitTest(mx, my) {
      let best = null, bd = 20;
      for (const lm of LANDMARKS) {
        const p = worldToScreen(P(lm.lon, lm.lat).x, P(lm.lon, lm.lat).y);
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < bd) { bd = d; best = lm.id; }
      }
      return best;
    }
  };

  IST.places = LANDMARKS;
  IST.MAPW = MAPW; IST.MAPH = MAPH;
  IST.proj = proj;
  global.ISTMAP = IST;
})(window);
