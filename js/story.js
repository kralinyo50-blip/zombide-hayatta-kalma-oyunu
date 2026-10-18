/* ============================================================
   KARANLIK BOĞAZ — story.js
   All narrative content: radio dialogue, choices, endings.
   Node types:
     line     {who, role, portrait, text, style}
     choice   {prompt, options:[{label, sub, tag, flags, goto, toast, heal, ammo, trust}]}
     flags    {flags}
     fn       {fn(g)}
     objective{text, sub}
     goto     {target}
     label    {id}
     end      {}
     chapter  {chapter}
     ending   {ending}
     cinematic{...}
   ============================================================ */
(function (global) {
  'use strict';

  const L = (who, role, portrait, text, style) => ({ type: 'line', who, role, portrait, text, style: style || 'say' });
  const B = (text) => ({ type: 'line', who: '', role: '', portrait: null, text, style: 'big' });
  const N = (text) => ({ type: 'line', who: '', role: '', portrait: null, text, style: 'narration' });
  const C = (prompt, options) => ({ type: 'choice', prompt, options });
  const F = (flags) => ({ type: 'flags', flags });
  const O = (text, sub) => ({ type: 'objective', text, sub });
  const G = (target) => ({ type: 'goto', target });
  const LBL = (id) => ({ type: 'label', id });
  const FN = (fn) => ({ type: 'fn', fn });

  /* short-hand dialogue ids */
  const LEY = (t) => L('DR. LEYLA', 'RADYO · 104.6 MHz', 'leyla', t);
  const EMRE = (t) => L('EMRE', 'SAHİL MUHAFIZI', 'emre', t);
  const DENIZ = (t) => L('DENİZ', '9 YAŞINDA', 'deniz', t);
  const KIZIL = (t) => L('KIZIL ANA', 'KULENİN ALTINDAKİ SES', 'kizil', t, 'say');
  const ME = (t) => L('SEN', 'KURYE · 09. GÜN', null, t, 'say');
  const RADIO = (t) => L('TELSİZ', 'PARAZİTLİ YAYIN', 'radio', t);

  const STORY = {
    /* ============ PROLOGUE ============ */
    prologue: [
      N('İstanbul. Dokuz gün önce.'),
      N('Kızıl Sis, Boğaz\'ın üzerinden geldi. Önce martılar sustu. Sonra köprülerdeki ışıklar. En son da insanlar.'),
      N('Sen bir kuryeydin. İki paket, bir motor, bir şehir. Şimdi elinde bir tabanca, sırtında bir çanta ve kulağında tek bir frekans var.'),
      L('BİLİNMEYEN', '104.6 MHz', 'leyla', '...yanında kalan varsa dinlesin. Galata Kulesi\'ndeyim. Panzehir burada. Ama tek başıma çıkamam.'),
      N('Sinyal, kuzeyde. Karaköy rıhtımı, yağmur, ve sisin içinden gelen ayak sesleri.'),
      B('KARANLIK BOĞAZ'),
      C('Neden hâlâ ayaktasın?', [
        {
          label: 'Kardeşim için.', sub: 'Onu en son Karaköy\'de gördüm.',
          tag: 'KİŞİSEL', flags: { motive: 'kardes', motiveText: 'Kardeşini bulmak' }
        },
        {
          label: 'Panzehir için.', sub: 'Bir doktor, bir flakon, bir şehir.',
          tag: 'UMUT', flags: { motive: 'panzehir', motiveText: 'Panzehiri bulmak' }
        },
        {
          label: 'Hayatta kalmak için.', sub: 'Başka bir sebep kalmadı.',
          tag: 'HAYATTA KALMA', flags: { motive: 'kalmak', motiveText: 'Sadece hayatta kalmak' }
        }
      ]),
      N('Motoru terk ettin. Rıhtımda, sisin içinde bir gölge daha var.'),
      N('Silahını kavra. Bu şehirde her ses, bir seçim.'),
      { type: 'end' }
    ],

    /* ============ CHAPTER 1 ============ */
    ch1: {
      key: 'ch1',
      number: 'BÖLÜM I',
      title: 'KARAKÖY',
      subtitle: 'Kızıl Sis\'in dokuzuncu gecesi. Rıhtımda bir sinyal yanıyor.',
      objective: 'Karaköy Meydanı\'na ulaş',
      objectiveSub: 'Karaköy • 22:47',
      mapKey: 'karakoy',
      world: 'karakoy',
      intro: [
        N('Rıhtım. Yağmur, petrol ve tuz kokuyor.'),
        ME('Tamam. Kuleye giden yol Galata Yokuşu\'ndan geçiyor. Sakin ol.'),
        LEY('Beni duyuyor musun? Cevap ver. Lütfen.'),
        C('Telsize cevap ver?', [
          {
            label: 'Cevap ver: "Beni duyuyor musun?"',
            sub: 'Bir insan sesi duymak iyi gelir.', tag: 'RADYO',
            flags: { radio_answer: true, trust: 1 }, toast: 'Leyla artık seni tanıyor', ammo: 6
          },
          {
            label: 'Sessiz kal. Yayın yapan herkes hedef olabilir.',
            sub: 'Paraflaş, parazit... güven vermiyor.', tag: 'SESSİZLİK',
            flags: { radio_silent: true, trust: -1 }, toast: 'Leyla seni duymadı'
          }
        ]),
        LEY('Tamam. Tamam, duydum. Dinle — Galata Kulesi\'nde bir laboratuvar var. Panzehir üzerinde çalışıyordum. Ama dışarısı... dışarısı çok kalabalık.'),
        ME('Kuleye çıkan yolu biliyorum. Ama önce meydanda birini bulmam lazım.'),
        LEY('Dikkatli ol. Ve... silahını boşa harcama.'),
        O('Karaköy Meydanı\'na ulaş', 'Karaköy • 22:47'),
        { type: 'end' }
      ],
      events: {
        square: [
          LEY('Meydanda bir muhafız olmalı. Emre. Onu bul. Bir şey biliyor olabilir.'),
          N('Meydanın ortasında, devrilmiş bir bariyerin yanında biri oturuyor.')
        ],
        tower: [
          N('Kule kapısı. Sis burada daha kalın; taşların arasından bir uğultu geliyor.'),
          LEY('Kapıyı açma! Karaköy\'deki Bankalar Hanı\'nda bir flakon var — mavi sıvı. Panzehirin ana bileşeni. Onsuz yukarı çıkarsan hepimiz kaybederiz.'),
          C('Ne yapacaksın?', [
            {
              label: 'Bankalar Hanı\'na git. Flakonu bul.',
              sub: 'Kule bekleyebilir. Panzehir bekleyemez.', tag: 'LEYLA',
              flags: { believe_leyla: true, ch1_goal: 'vault' }, toast: 'Hedef: Bankalar Hanı',
              goto: 'exit'
            },
            {
              label: 'Kuleyi zorla. Panzehir zaten burada.',
              sub: 'Emre\'nin notu aklında: "Kulede ışık var."', tag: 'RİSK',
              flags: { believe_leyla: false, ch1_goal: 'tower' }, toast: 'Hedef: Galata Kulesi kapısı',
              goto: 'exit'
            }
          ]),
          LBL('exit'),
          O('Bankalar Hanı\'na ulaş', 'Karaköy → Galata Yokuşu'),
          { type: 'end' }
        ],
        avenue: [
          N('Galata Yokuşu daralıyor. Bariyerlerin arkasında bir kalabalık var — ama hiçbiri nefes almıyor.'),
          LEY('Duyuyor musun? Koşuyorlar. Kuleye doğru geliyorlar!'),
          FN((g) => g.wave('ch1_avenue')),
          O('Galata Kulesi meydanına ulaş', 'Galata Yokuşu • 23:20'),
          { type: 'end' }
        ],
        tower_approach: [
          N('Meydan. Kule. Ve sisin içinden çıkan gölgeler.'),
          FN((g) => g.wave('ch1_tower')),
          LEY('Kapıya kadar gel. Gerisi... gerisi bende.'),
          O('Galata Kulesi kapısına ulaş', 'Galata • 23:41'),
          { type: 'end' }
        ],
        radio: [
          N('Telsiz cızırdıyor. Pilleri neredeyse bitmiş.'),
          LEY('Beni duyuyorsan... Karaköy\'de kalan son kurye sensin. Bankalar Hanı\'nda bir flakon var.'),
          ME('Kuleye nasıl çıkacağım?'),
          LEY('Önce flakon. Sonra kule. Sırayı bozma.'),
          { type: 'end' }
        ],
        bank_arrive: [
          N("Bankalar Hanı'nın kapısı. Mermer, toz ve uzaktan gelen bir alarm sesi."),
          LEY('İçeride olmalı. Duvar kasasına bak — müdür anahtarı orada bıraktı.'),
          { type: 'end' }
        ],
        emre: [
          N('Adamın elinde bir tüfek, göğsünde taze bir sargı var. Nefes alırken ıslık çalıyor.'),
          EMRE('Dur. Dur, tetiğe dokunma. Ben... ben insanım. Sanırım.'),
          ME('Karaköy muhafızı?'),
          EMRE('Emre. Bir hafta önce on iki kişiydik. Şimdi bir kişiyiz ve o bir kişi de pek iyi durumda değil.'),
          C('Emre\'ye ne yapacaksın?', [
            {
              label: 'Yarasını sar. Ona yardım et.',
              sub: 'Bir insanı kurtarmak, bir mermiden değerlidir.', tag: 'İNSAN',
              flags: { emre_help: true, trust: 1 }, heal: 25, toast: 'Emre sana güveniyor',
              goto: 'help'
            },
            {
              label: 'Notunu al, sonra devam et.',
              sub: 'Zaman yok. Ama not işine yarar.', tag: 'PRAGMATİK',
              flags: { emre_note: true, trust: 0 }, toast: 'Askeri not alındı (kasa anahtarı)',
              goto: 'note'
            },
            {
              label: 'Cebindeki mermileri al ve git.',
              sub: 'Şehir kimseye borç ödemiyor.', tag: 'SOĞUK',
              flags: { emre_robbed: true, trust: -2 }, ammo: 24, toast: 'Emre\'den mermi alındı',
              goto: 'rob'
            }
          ]),
          LBL('help'),
          EMRE('Sen... sen gerçekten iyi birisin. Dinle, Bankalar Hanı\'nın kasa dairesi var. Müdür kaçarken anahtarı duvar kasasında bıraktı. Bu notu al.'),
          F({ bank_key: true, ch1_note: true }),
          EMRE('Bir de... Kızıl Sis, insanı sadece bedenen değiştirmiyor. Sesleri duyuyorsan, duyma.'),
          ME('Sesler mi?'),
          EMRE('Kule. Kule konuşuyor. Sen de duyacaksın.'),
          G('end_emre'),
          LBL('note'),
          EMRE('Not... cebimde. Buyur. Kasa anahtarı da var. Ama kuleye tek başına çıkma, söyleyeyim.'),
          F({ bank_key: true, ch1_note: true }),
          ME('Kuleye çıkmam gerek.'),
          EMRE('O zaman beni de yanında götür. Ya da... en azından mermilerimi.'),
          G('end_emre'),
          LBL('rob'),
          N('Adam hiçbir şey söylemiyor. Sadece gözlerini kapatıyor.'),
          EMRE('Al. Ama unutma... bu şehir, aldığın her şeyi geri ister.'),
          G('end_emre'),
          LBL('end_emre'),
          O('Bankalar Hanı\'na ulaş', 'Karaköy • Galata Yokuşu'),
          { type: 'end' }
        ],
        bank: [
          N('Bankalar Hanı. Mermer toz, devrilmiş bir avize ve kasaların arasından geçen bir uğultu.'),
          LEY('Orada olmalı. Kasa dairesinde, mavi flakon. Dikkatli ol, o uğultu... kalabalık olabilir.'),
          N('Kasa kapısı kilitli. Duvar kasasında bir anahtar olmalı.')
        ],
        vault: [
          N('Kasa dairesi açıldı. İçeride, bir masanın üstünde duran küçük mavi bir flakon.'),
          LEY('İşte o. Panzehirin çekirdeği. Onu kuleye getir — ve bu şehirdeki herkes için bir şans daha olacak.'),
          N('Flakon elinde. Cam, avucunun içinde bir kalp gibi atıyor.'),
          F({ vial: true }),
          { type: 'objective', text: 'Galata Kulesi\'ne dön', sub: 'Flakon alındı • Kuleye çık' },
          { type: 'end' }
        ],
        vault_missing: [
          N('Kasa kapısı kilitli. Duvar kasasına bakmalısın.'),
          { type: 'end' }
        ],
        finale: [
          N('Kule kapısı. Yukarıdan gelen uğultu artık kelimelere dönüşüyor: "gel... gel..."'),
          LEY('Kapıyı açma! Kilitli — ve... içeride bir şey var.'),
          ME('Panzehir sende değil mi?'),
          LEY("Flakon Bankalar Hanı'nın kasa dairesinde. O kapının şifresi de aynı kasada. Önce onu getir."),
          N('Kule kapısında paslı bir metal plaka: "BANKALAR HANI — KASA 07".'),
          C('Ne yapacaksın?', [
            {
              label: "Bankalar Hanı'na git.",
              sub: 'Kule bekleyebilir. Panzehir bekleyemez.', tag: 'LEYLA',
              flags: { believe_leyla: true, ch1_goal: 'vault' }, goto: 'go'
            },
            {
              label: 'Önce cephaneni kontrol et.',
              sub: 'Hazırlıksız yokuş inmek intihar.', tag: 'HAZIRLIK',
              flags: { prepared: true }, ammo: 14, heal: 15, toast: 'Hazırlandın: +14 mermi, +15 can',
              goto: 'go'
            }
          ]),
          LBL('go'),
          N('Yokuş aşağı. Bankalar Caddesi, sisin içinde bir tünel gibi açılıyor.'),
          O('Bankalar Hanı\'na ulaş', 'Galata • 01:12'),
          { type: 'chapter', chapter: 'ch2' }
        ]
      }
    },

    /* ============ CHAPTER 2 ============ */
    ch2: {
      key: 'ch2',
      number: 'BÖLÜM II',
      title: 'BANKALAR CADDESİ',
      subtitle: 'Mermerin üzerinde kan, kasaların içinde umut.',
      objective: 'Bankalar Hanı\'na ulaş',
      objectiveSub: 'Galata • 01:12',
      mapKey: 'galata',
      world: 'galata',
      intro: [
        N('Kule seni yukarı çağırmadı. Kule seni aşağı, Bankalar Caddesi\'ne gönderdi.'),
        LEY('Işıklar söndü. Kasa dairesindeki flakon... tek kopya değil. Ama diğerleri bankanın alt katında. Yolu bilmiyorum.'),
        ME('Ben bulurum.'),
        LEY('Bir de... Bankalar Hanı\'nda bir çocuk olabilir. Adı Deniz. Annesi benim ekibimdendi.'),
        O('Bankalar Hanı\'na ulaş', 'Galata • 01:12'),
        { type: 'end' }
      ],
      events: {
        deniz: [
          N('Banka holü. Mermer bankoların arkasında küçük bir sarı yağmurluk.'),
          DENIZ('Sen... sen de onlardan mısın?'),
          ME('Hayır. Bende silah var ama... ısırmıyorum.'),
          DENIZ('Annem onların içinde. Gördüm. Kasanın orada.'),
          LEY('Deniz! Deniz, orada mısın? Ona iyi bak. Lütfen.'),
          C('Deniz\'i ne yapacaksın?', [
            {
              label: 'Onu kasanın yanına götürme. Güvende kal.',
              sub: 'Bekle, sessiz ol, ben flakonu alıp döneceğim.', tag: 'KORUMA',
              flags: { deniz_safe: true, trust: 1 }, toast: 'Deniz bankoda saklanıyor',
              goto: 'safe'
            },
            {
              label: 'Yanına al. Yalnız bırakma.',
              sub: 'Bu şehirde yalnız kalan herkes kayboluyor.', tag: 'YOLDAŞ',
              flags: { deniz_follow: true, trust: 1 }, heal: 10, toast: 'Deniz peşinde',
              goto: 'follow'
            },
            {
              label: 'Görmezden gel. Kasa dairesine git.',
              sub: 'Flakon her şeyden önce gelir.', tag: 'SOĞUK',
              flags: { deniz_ignored: true, trust: -2 }, toast: 'Deniz arkanda kaldı',
              goto: 'ignore'
            }
          ]),
          LBL('safe'),
          DENIZ('Tamam. Ben... ben burada saklanırım. Ama sen dön, olur mu?'),
          G('deniz_end'),
          LBL('follow'),
          DENIZ('Ben de geliyorum! Ama... çok gürültü yapmayalım.'),
          G('deniz_end'),
          LBL('ignore'),
          N('Arkana bakmıyorsun. Bu, şehirde ayakta kalmanın ilk kuralı.'),
          G('deniz_end'),
          LBL('deniz_end'),
          { type: 'end' }
        ],
        bank: [
          N('Ana hol. Kasa dairesi kapısı, arkasında biri varmış gibi titriyor.'),
          LEY('Müdürün notunu bul. Kasa anahtarı olmadan o kapıyı açamazsın.'),
          N('Duvarda bir kasa var. Kilitli.')
        ],
        safe: [
          N('Duvar kasası açıldı. İçinde bir zarf, bir anahtar ve bir fotoğraf.'),
          F({ bank_key: true }),
          N('Fotoğrafta Leyla ve Deniz\'in annesi, Galata Kulesi\'nin önünde gülüyorlar.'),
          { type: 'end' }
        ],
        vault: [
          N('Kasa dairesi. Yerde parçalanmış cam ve kurumuş bir göl.'),
          N('Masanın üstünde iki flakon. Biri mavi. Diğeri... kırmızı.'),
          LEY('Mavi olan panzehir. Kırmızı olan... onu açma. Onu asla açma.'),
          C('Hangisini alacaksın?', [
            {
              label: 'Mavi flakon. Panzehir.',
              sub: 'Leyla\'nın istediği. Umut.', tag: 'UMUT',
              flags: { vial: true, took_blue: true }, toast: 'Mavi flakon alındı',
              goto: 'blue'
            },
            {
              label: 'Kırmızı flakon. Ya da hiçbiri.',
              sub: 'Kırmızı, Kızıl Ana\'nın sesiyle atıyor.', tag: 'RİSK',
              flags: { vial_red: true, trust: -1 }, toast: 'Kırmızı flakon alındı',
              goto: 'red'
            },
            {
              label: 'İkisini de al ve kasayı kapat.',
              sub: 'Bazen tek bir seçim yetmez.', tag: 'AÇGÖZLÜ',
              flags: { vial: true, vial_red: true }, toast: 'İki flakon da alındı',
              goto: 'both'
            }
          ]),
          LBL('blue'),
          N('Flakonu cebine koyuyorsun. Mavi ışık, parmaklarının arasından sızıyor.'),
          G('vault_end'),
          LBL('red'),
          N('Kırmızı flakon elinde sıcak. Bir kalp gibi değil — bir ağız gibi atıyor.'),
          KIZIL('...akıllı çocuk.'),
          G('vault_end'),
          LBL('both'),
          N('İkisini de alıyorsun. Kasa kapanınca alarm çalıyor. Bütün bina çığlık atıyor.'),
          FN((g) => g.startAlarm()),
          G('vault_end'),
          LBL('vault_end'),
          FN((g) => g.afterVial()),
          O("Karaköy Rıhtımı'na dön", 'Galata • 03:10'),
          { type: 'end' }
        ],
        arrive: [
          N('Rıhtım sessiz. Tekneler bağlı, dalgalar sisin altında kayboluyor.'),
          LEY("Bankalar Caddesi'ni takip et. Han, caddenin batısında."),
          { type: 'end' }
        ],
        alarm: [
          N('Alarm. Bütün banka sarsılıyor. Kapılar açılıyor, koridorlarda ayak sesleri.'),
          LEY('Ne yaptın?! Çık oradan! Şimdi!'),
          N('Kalabalık geliyor. Çok kalabalık.'),
          { type: 'end' }
        ],
        finale: [
          N('Rıhtım. Sis, denizden şehre doğru yürüyor.'),
          LEY('Flakon sende. Deniz\'i buldun mu? ...Peki. Şimdi Kız Kulesi\'ne gelmelisin. Tekne var.'),
          C('Rıhtımdaki tekneye bin?', [
            {
              label: 'Tekneye bin. Kız Kulesi\'ne git.',
              sub: 'Suda sis, küreklerde korku.', tag: 'KIZ KULESİ',
              flags: { boat: true }, goto: 'go'
            },
            {
              label: 'Deniz\'i de al. Kimseyi bırakma.',
              sub: 'Bir çocuk, bir kurey, bir şehir.', tag: 'YOLDAŞ',
              flags: { boat: true, deniz_boat: true, trust: 1 }, toast: 'Deniz de teknede',
              goto: 'go'
            }
          ]),
          LBL('go'),
          N('Kürekler suya giriyor. Arkanda Galata, önünde kule. Boğaz, sisin altında nefes alıyor.'),
          F({ has_boat: true }),
          { type: 'chapter', chapter: 'ch3' }
        ]
      }
    },

    /* ============ CHAPTER 3 ============ */
    ch3: {
      key: 'ch3',
      number: 'BÖLÜM III',
      title: 'KIZ KULESİ',
      subtitle: 'Boğaz\'ın ortasında, tek başına bir kule.',
      objective: 'Kuleye gir',
      objectiveSub: 'Üsküdar açıkları • 04:05',
      mapKey: 'kizkulesi',
      world: 'kizkulesi',
      intro: [
        N('Ada. Taş, yosun ve rüzgâr. Kule, sisin içinden bir diş gibi yükseliyor.'),
        LEY('Geldin. Kule kapısı... açık. Ama içeride o var.'),
        ME('O kim?'),
        LEY('Kızıl Ana. Sis\'in ta kendisi. Panzehiri içeride saklıyor.'),
        LEY('Silahını hazır tut. Ve... sesini duyarsan, cevap verme.'),
        N('Kule kapısına doğru yürüyorsun. Adımların suda yankılanıyor.'),
        { type: 'end' }
      ],
      events: {
        arrive: [
          N('Ada. Kule. Rüzgârın içinde bir ses, sanki taşlar nefes alıyor.'),
          LEY('Kule kapısına gir. Ama önce... sesini duyarsan, cevap verme.'),
          { type: 'end' }
        ],
        boss: [
          N('Kule holü. Duvarlar nefes alıyor. Tavan, kırmızı damarlarla dolu.'),
          KIZIL('Sonunda. Bana doğru yürüyen bir kalp.'),
          ME('Sen... Leyla nerede?'),
          KIZIL('Leyla mı? O, dokuz gün önce benimle konuştu. Ben de ona bir teklif yaptım. O kabul etmedi.'),
          N('Kulenin tepesinde bir şey hareket ediyor. Kızıl Ana, kuleyi kendi bedeni gibi giymiş.'),
          KIZIL('Panzehir senin elinde. Onu bana ver, ben de sana bu şehri veririm. Ya da... onu bana verme, ben de seni alırım.'),
          C('Kızıl Ana\'ya ne diyeceksin?', [
            {
              label: '"Panzehir senin değil. Bu şehir de."',
              sub: 'Silahını doğrult ve ateş et.', tag: 'DİREN',
              flags: { defy: true }, goto: 'fight'
            },
            {
              label: '"Belki bir anlaşma yapabiliriz."',
              sub: 'Konuşmak, bir mermiden daha az kan akıtır.', tag: 'PAZARLIK',
              flags: { bargained: true, trust: -1 }, goto: 'talk'
            },
            {
              label: '"Bu şehirde kalmak istemiyorum."',
              sub: 'Tekneyle çıkıp gitmek. Flakonu bırakmak.', tag: 'KAÇIŞ',
              flags: { flee: true }, goto: 'flee'
            }
          ]),
          LBL('talk'),
          KIZIL('Anlaşma mı? İnsanlar hep aynı şeyi söyler. Sonra hep aynı şeyi yapar.'),
          N('Sis, kulenin içine doluyor. Savaş kaçınılmaz.'),
          F({ boss_fight: true }),
          G('fight'),
          LBL('flee'),
          KIZIL('Kapıyı açık bıraktım. Tekne seni bekliyor. Ama flakonu bırakırsan...'),
          N('Elinde flakon, arkan dönük. Kulenin kapısı gerçekten açık.'),
          C('Flakonu bırakıp kaçacak mısın?', [
            {
              label: 'Flakonu bırak ve kaç.',
              sub: 'Boğaz\'da bir tekne, açık deniz, bir hayat.', tag: 'FİNAL',
              flags: { left_vial: true }, goto: 'fight'
            },
            {
              label: 'Hayır. Flakon benimle kalacak.',
              sub: 'Kaçarken bile umut taşınır.', tag: 'DİREN',
              flags: { defy: true }, goto: 'fight'
            }
          ]),
          LBL('fight'),
          N('Silahını kaldırıyorsun. Tavan, kırmızı bir çığlıkla yarılıyor.'),
          FN((g) => g.startBossFight()),
          O('Kızıl Ana\'yı yen', 'Kız Kulesi • 04:20'),
          { type: 'end' }
        ],
        defeated: [
          N('Kızıl Ana\'nın bedeni kuleye doğru dağılıyor. Ses, duvarlardan sızıyor.'),
          KIZIL('...panzehir... seni... bulacak...'),
          N('Kulenin tepesinde bir lamba yanıyor. Leyla\'nın sesi, ilk kez net.'),
          LEY('Yukarı gel. Ve flakonu getir. Son bir seçim var.'),
          FN((g) => g.onBossDefeated()),
          { type: 'objective', text: 'Kulenin tepesindeki telsize ulaş', sub: 'Kız Kulesi • 04:41' },
          { type: 'end' }
        ],
        final: [
          N('Kulenin en üstü. Şehir ayaklarının altında; Boğaz, kızıl ve maviye bölünmüş.'),
          LEY('Panzehir tek bir flakon. Ama şehirde hâlâ nefes alan binlerce insan var.'),
          ME('Ne yapacağım?'),
          LEY('Flakonu laboratuvardaki reaktöre dök. Sis dağılır. Ama bu kule, bu şehir, bu an... hepsi değişir.'),
          LEY('Ya da flakonu kendin için sakla. ya da... yak. Bu şehri kurtarmak zorunda değilsin.'),
          C('Son seçim. Bu şehir ne olacak?', [
            {
              label: 'Reaktöre dök. Panzehiri yay.',
              sub: 'Şehri kurtar. Sonuçlarına katlan.', tag: 'UMUT',
              flags: { ending: 'safak' }, goto: 'ending_safak'
            },
            {
              label: 'Kulenin tepesinden şehre bak. Flakonu sakla.',
              sub: 'Gücü elinde tut. Sisin yeni sahibi ol.', tag: 'KIZIL TAHT',
              flags: { ending: 'taht' }, goto: 'ending_taht'
            },
            {
              label: 'Flakonu al, tekneye bin, Boğaz\'dan çık.',
              sub: 'Bu şehri kendi kaderine bırak.', tag: 'GEMİ',
              flags: { ending: 'gemi' }, goto: 'ending_gemi'
            },
            {
              label: 'Flakonu yak. Sis de sen de bitsin.',
              sub: 'Hiç kimse bu gücü hak etmiyor.', tag: 'SESSİZLİK',
              flags: { ending: 'sessizlik' }, goto: 'ending_sessizlik'
            }
          ]),
          LBL('ending_safak'),
          { type: 'ending', ending: 'safak' },
          LBL('ending_taht'),
          { type: 'ending', ending: 'taht' },
          LBL('ending_gemi'),
          { type: 'ending', ending: 'gemi' },
          LBL('ending_sessizlik'),
          { type: 'ending', ending: 'sessizlik' }
        ]
      }
    },

    /* ============ DOCUMENTS ============ */
    docs: {
      ch1: {
        type: 'BULUNAN EVRAK',
        title: 'ASKERİ DURUM RAPORU',
        body:
          'BOĞAZ PROTOKOLÜ — GİZLİ\nTarih: 08. Gün / 03:40\nBölge: Karaköy\n\n' +
          '1) Sis, Boğaz hattından şehre yayıldı. Enfeksiyon hızı beklenenin 6 katı.\n' +
          '2) Galata Kulesi\'nde Dr. Leyla E. tarafından panzehir çalışması yürütülüyor. Flakon, Bankalar Hanı kasa dairesinde muhafaza edilmektedir.\n' +
          '3) Sivil tahliye durduruldu. Köprüler kapatıldı. Deniz yolu tek çıkış.\n' +
          '4) Kuleye yaklaşan her ses... duyuluyor. Sis dinliyor.\n\n' +
          'İmza: Sahil Muhafızı Emre K.'
      },
      ch1b: {
        type: 'BULUNAN FOTOĞRAF',
        title: 'KULE ÖNÜNDE BİR GÜN',
        body:
          'Fotoğrafın arkasında kurşun kalemle bir not var:\n\n' +
          '"Leyla — Deniz büyüyor. Panzehir işe yararsa, ona anlatacağımız bir hikâye olacak.\n' +
          ' İstanbul\'u kurtarmak zorunda değiliz. Sadece bir çocuğu kurtarmamız yeter.\n' +
          ' — Selin"'
      },
      ch2: {
        type: 'MÜDÜRÜN NOTU',
        title: 'KASA DAİRESİ TALİMATI',
        body:
          'Bankalar Hanı — Kasa Dairesi\n\n' +
          'Mavi flakon: PANZEHİR-9. Dr. Leyla E. teslim alacak.\n' +
          'Kırmızı flakon: KIZIL SİS örneği. AÇILMAYACAK.\n' +
          'Anahtar: duvar kasası, müdür odası.\n\n' +
          'Not: Kızıl Sis örneği konuşuyor. Kimse inanmadı. Ben inandım.\n' +
          'Eğer bunu okuyorsan, artık çok geç.'
      }
    },

    /* ============ ENDINGS ============ */
    endings: {
      safak: {
        title: 'ŞAFAK',
        sub: 'Boğaz\'a güneş doğuyor.',
        kicker: 'FİNAL 01 — UMUT',
        color: '#f0a93b',
        text: [
          'Flakonu reaktöre döktüğünde kule bir an nefesini tuttu. Sonra sis, geri çekildi. Yavaş, inatçı, ama gerçek.',
          'Gün doğarken Galata\'nın taşları ıslandı, martılar geri döndü. Kız Kulesi\'nden Boğaz\'a baktığında, köprülerde ilk kez insanlar vardı.',
          'Panzehir bir mucize değildi. Ama bir başlangıçtı. Ve bu şehir, başlangıçları sever.',
          'Leyla, Deniz\'i kucağına aldı. Sen ise sadece... orada kaldın. Bu kez bir kurye olarak değil, bir tanık olarak.'
        ]
      },
      taht: {
        title: 'KIZIL TAHT',
        sub: 'Sis, artık senin.',
        kicker: 'FİNAL 02 — GÜÇ',
        color: '#e04b3f',
        text: [
          'Flakonu sakladın. Kızıl Ana\'nın son parçası kuleye karışırken, duvarlardaki damarlar senin ritmine uymaya başladı.',
          'Bir hafta sonra şehirdeki her ses artık sana fısıldıyordu. Kimin kaçtığını, kimin saklandığını, kimin yalan söylediğini biliyordun.',
          'İstanbul\'u kurtarmadın. Ama artık İstanbul senin.',
          'Boğaz\'ın karşısından biri, onuncu günün şafağında kuleye baktı ve bir şey gördü: yeni bir kraliçe.'
        ]
      },
      gemi: {
        title: 'GİDEN GEMİ',
        sub: 'Boğaz\'da bir tekne, açık deniz, bir hayat.',
        kicker: 'FİNAL 03 — KAÇIŞ',
        color: '#6fb7ff',
        text: [
          'Flakonu yanına aldın. Tekne, sisin içinden Marmara\'ya süzüldü. Kız Kulesi arkanda küçüldü, sonra kayboldu.',
          'Üç gün sonra Ege\'de bir balıkçı teknesi seni buldu. Elinde tek bir flakon vardı ve kimse sana inanmadı.',
          'İstanbul\'a dair haberler kesildi. Boğaz, haritalarda kalın bir çizgi olarak kaldı.',
          'Bazen geceleri rüyanda bir çocuğun sesini duyuyorsun: "Ama sen dön, olur mu?"'
        ]
      },
      sessizlik: {
        title: 'SESSİZLİK',
        sub: 'Ne sis, ne umut. Sadece sessizlik.',
        kicker: 'FİNAL 04 — SON',
        color: '#8f9baa',
        text: [
          'Flakonu yaktığında kule bir çığlık attı. Mavi ışık kırmızıya döndü, sonra beyaza. Sonra hiçbir şeye.',
          'Sis dağıldı. Ama onunla birlikte kulenin içindeki her şey de gitti: laboratuvar, kayıtlar, Leyla\'nın sesi.',
          'İstanbul kurtuldu. Kimse nasıl olduğunu bilmiyor. Kimse sana teşekkür etmiyor.',
          'Karaköy rıhtımında bir sabah, kimse kimseyi tanımadan yürüyor. Bu, bazen kurtuluşun en sessiz hâli.'
        ]
      }
    }
  };

  global.STORY = STORY;
})(window);
