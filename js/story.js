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
  const ANNE = (t) => L('ANNEM', 'NURTEN · 52', 'anne', t);
  const BABA = (t) => L('BABAM', 'HASAN · 55', 'baba', t);
  const ADA = (t) => L('ADA', 'KARDEŞİN · 15', 'ada', t);
  const TVS = (t) => L('SUNUCU', 'HABER 24', 'radio', t);

  const STORY = {
    /* ============ COLD OPEN ============ */
    opening: [
      B('KARANLIK BOĞAZ'),
      N('İstanbul. Bir cumartesi akşamı.'),
      N("Boğaz'ın üzerinde ince bir sis var. Kimse aldırmıyor; eylül akşamları hep böyle olur."),
      N('Cihangir\'de bir apartmanın üçüncü katında, bir aile akşam yemeğine oturuyor.'),
      N('Bu, her şeyin son sıradan gecesi.'),
      { type: 'end' }
    ],

    /* ============ PROLOGUE 1 — EV ============ */
    p1: {
      key: 'p1',
      number: 'PROLOG',
      title: 'EV',
      subtitle: "Cihangir'de bir cumartesi akşamı. Dışarıda ince bir sis var.",
      objective: 'Annenle konuş',
      objectiveSub: 'Cihangir • 0. Gün, 21:12',
      mapKey: 'cihangir',
      world: 'ev',
      intro: [
        N("Anahtar kilide girmedi. Omzunla ittirdin; kapı her akşam olduğu gibi takıldı, sonra açıldı."),
        N("Koridorda ayakkabılar, duvarda solmuş bir takvim. Dışarıdan gelen sessizlik tuhaf."),
        ME('Ben geldim!'),
        ANNE('Mutfaktayım. Gel, soğumadan ye.'),
        N("Salondan televizyon sesi geliyor. Ada'nın kulaklığından taşan müzik koridora vuruyor."),
        O('Annenle konuş', 'Cihangir • 0. Gün, 21:12'),
        { type: 'end' }
      ],
      events: {
        anne: [
          ANNE('Bugün kaç paket?'),
          ME("On dört. Sonuncusu Beşiktaş'taydı; köprüde trafik vardı."),
          ANNE('Yüzün solgun. Otur, yemek ye.'),
          N("Tabağa dumanı tüten pilav koyuyor. Elleri her zamanki gibi unlu."),
          ANNE('Haberlerde bir şey diyorlar. Virüs... hayvandan insana geçiyormuş. Üç hastane kapanmış.'),
          ME('Anne, her sene bir virüs çıkıyor.'),
          ANNE('Bu sene değil. Baban iki saattir kanal değiştirmiyor. Bir şey biliyor ama söylemiyor.'),
          FN((g) => { g.flags.p1_anne = true; g.heal(20); }),
          ANNE('Git. Ama kavga etme, tamam mı?'),
          { type: 'objective', text: 'Babana haberleri sor', sub: 'Cihangir • 0. Gün, 21:24' },
          { type: 'end' }
        ],
        baba: [
          BABA('Otur. Bir şey göstereceğim.'),
          N("Ekranda bir harita var. Boğaz'ın iki yakası, kırmızı noktalarla işaretli. Sunucu \"karantina\" diyor, sonra \"kontrol altında\" diyor, sonra sesi kısılıyor."),
          BABA('Üç ilçe. Yarın sabah altıda kapanacak.'),
          ME('Nereden biliyorsun?'),
          BABA("Ben 99'u gördüm. Kimse abartmadı; herkes geç kaldı."),
          BABA('Yarın depoya gitme. Paketleri bırak.'),
          FN((g) => { g.flags.p1_baba = true; }),
          { type: 'objective', text: 'Televizyondaki haberi izle', sub: 'Cihangir • 0. Gün, 21:47' },
          { type: 'end' }
        ],
        ada: [
          N('Ada kanepede, ayakları altında, telefonu elinde. Kulaklığını çıkarıyor.'),
          ADA('Ağabey, sınıf grubunda "okullar tatil" diyorlar.'),
          ME('Yarın belli olur.'),
          ADA('Bir de... bir video var. Hastanede. Kimse konuşmuyor ama herkes izliyor.'),
          C("Ada'ya ne söyleyeceksin?", [
            { label: '"Korkma, ben buradayım."', sub: 'Kardeşine sakin bir ses.', tag: 'ABİ', flags: { ada_teselli: true, p1_ada: true }, goto: 'a1' },
            { label: '"Çantanı hazırla. Hazırlıklı olalım."', sub: 'Belki de haklısın.', tag: 'HAZIRLIK', flags: { ada_hazir: true, p1_ada: true }, goto: 'a2' }
          ]),
          LBL('a1'),
          ADA('Biliyorum. Ama sen de korkuyorsun, değil mi?'),
          ME('Biraz.'),
          ADA('İyi. O zaman ben de korkabilirim.'),
          G('a_end'),
          LBL('a2'),
          ADA('Ciddi misin?'),
          ME('Ciddiyim. Su, ilaç, şarj aleti. Çantana koy.'),
          ADA('Tamam. Ağabey... bu gece uyuyalım mı?'),
          G('a_end'),
          LBL('a_end'),
          { type: 'end' }
        ],
        telefon: [
          N('Telefonunda şirketten bir mesaj: "YARINKİ TÜM TESLİMATLAR İPTAL. DEPOYA GELMEYİN."'),
          ME('İptal... on dört paket.'),
          N('Ekranda bir bildirim daha: "İSTANBUL VALİLİĞİ — KAMU DUYURUSU"'),
          FN((g) => { g.flags.p1_tel = true; }),
          { type: 'objective', text: 'Televizyonu aç', sub: 'Cihangir • 0. Gün, 21:47' },
          { type: 'end' }
        ],
        pencere: [
          N('Perdeyi aralıyorsun. Sokakta iki ambulans, ışıkları kapalı, motorları çalışır hâlde bekliyor.'),
          N('Sokağın ucunda bir adam var; elinde plastik torba, kapıcının önünde duruyor. Sonra hızlanıp apartmana giriyor.'),
          ME('...'),
          FN((g) => { g.flags.p1_pencere = true; }),
          { type: 'end' }
        ],
        balkon: {
          cinematic: true,
          visual: 'bogaz',
          title: 'BALKON',
          kicker: '0. GÜN — 22:12',
          nodes: [
          N('Balkona çıkıyorsun. Boğaz, aşağıda koyu bir kurşun gibi.'),
          N("Kız Kulesi'nin ışığı yanıyor. Uzakta bir gemi, motorsuz gibi, akıntıyla sürükleniyor."),
          N('Sisin içinden bir martı sesi. Sonra bir başkası. Sonra hepsi birden kesiliyor.'),
          { type: 'end' }
          ]
        },
        tv: {
          cinematic: true,
          visual: 'news',
          title: 'SON DAKİKA',
          kicker: '0. GÜN — 21:47',
          nodes: [
            N('Kumandayı alıyorsun. Baban itiraz etmiyor.'),
            N('Kanal değiştiriyorsun: aynı görüntü. Beyaz tulumlar, bantlı bir koridor, kameraya bakan bir doktor.'),
            TVS('...İstanbul Valiliği, kentte görülen ve halk arasında "Kızıl Sis" olarak anılan salgın için olağanüstü hâl ilan etti.'),
            TVS('Şu ana kadar üç ilçede karantina uygulanıyor. Vatandaşlarımızdan evlerinde kalmalarını, zorunlu olmadıkça sokağa çıkmamalarını rica ediyoruz.'),
            N("Ekranda harita açılıyor. Boğaz'ın iki yakası, kırmızı noktalarla işaretli... sonra noktalar çoğalıyor."),
            BABA('Kapat şunu.'),
            ANNE('Hasan...'),
            BABA('Kapat dedim.'),
            N('Kapatmıyorsun. Alt bantta bir cümle geçiyor:'),
            L('ALT BANT', 'CANLI YAYIN', 'radio', '"SALGININ HAYVANDAN İNSANA GEÇTİĞİ DOĞRULANDI. HASTALARDA SALDIRGANLIK GÖRÜLÜYOR."'),
            ADA('Ağabey...'),
            N('Elektrik kesiliyor. Bir saniye. İki. Sonra geri geliyor; televizyon açılırken cızırdıyor.'),
            N('Aşağıdan bir cam kırılması. Sonra bir çığlık. Sonra bir başkası.'),
            TVS('...sakin olmanızı... kapılarınızı...'),
            FN((g) => { g.flags.p1_haber = true; }),
            { type: 'objective', text: 'Pencereye git', sub: 'Cihangir • 0. Gün, 22:04' },
            { type: 'end' }
          ]
        },
        cikis: {
          cinematic: true,
          visual: 'window',
          title: 'KAPI',
          kicker: '0. GÜN — 22:19',
          nodes: [
            N('Kapıya gidiyorsun. Göz deliğinden koridor: ışık yok. Ama bir gölge var; duvarda yavaşça kayıyor.'),
            N("Bayram Amca'nın kapısı açık. Beş yıldır o kapının açıldığını görmemiştin."),
            BABA('Açma.'),
            ME('Baba, aşağıda insanlar var—'),
            BABA('Açma!'),
            ANNE("Hasan, Ada'nın ateşi var."),
            N('Gölge kapının önünde duruyor. Sonra ağır ağır merdivenlerden aşağı iniyor.'),
            BABA('Sabahı bekleyeceğiz. Sabah ordu gelir.'),
            FN((g) => { g.flags.p1_kapi = true; }),
            N('Saat 23:10. Elektrik kesiliyor. Buzdolabı bir kez ötüyor, sonra susuyor.'),
            N('Karanlıkta, merdiven boşluğundan gelen ses: ıslak, ağır bir sürüklenme.'),
            N('Sabah gelmedi. Gece geldi.'),
            { type: 'chapter', chapter: 'p2' }
          ]
        }
      }
    },

    /* ============ PROLOGUE 2 — GECE ============ */
    p2: {
      key: 'p2',
      number: 'BÖLÜM I',
      title: 'GECE',
      subtitle: 'Elektrik yok. Şehir karanlık. Dairenin içinde üç kişi daha var.',
      objective: 'Salona git',
      objectiveSub: 'Cihangir • 0. Gün, 23:14',
      mapKey: 'cihangir',
      world: 'ev_gece',
      intro: [
        N('23:14. Elektrik yok. Buzdolabı bir kez ötüyor, sonra susuyor.'),
        N('Koridordan sesler geliyor: sürtünen ayak, devrilen bir şişe, sonra tekrar sessizlik.'),
        ME('Anne? Ada?'),
        ANNE('Salondayız. Sessiz ol, kapıyı açma.'),
        N('Cebindeki telefonun ekranında tek bir çubuk var. Saat 23:14.'),
        O('Salona git', 'Cihangir • 0. Gün, 23:14'),
        { type: 'end' }
      ],
      events: {
        aile: [
          N('Salon. İki mum, bir battaniye. Ada kanepenin köşesine sokulmuş; alnı ateş gibi.'),
          ANNE('Baban camın önünde. Bir saattir tek kelime etmedi.'),
          BABA('Sokakta ışık yok. Sadece aşağıda, apartmanın girişinde bir fener var.'),
          N('Perdeyi aralıyorsun. Aşağıda bir adam, elinde fenerle, arabaların arasında duruyor. Sonra yavaşça dönüyor.'),
          ME('Baba, o Bayram Amca mı?'),
          BABA('Bayram Amca iki gündür yok. Kapısını çaldım, açmadı.'),
          ADA('Ağabey... televizyon açılmıyor.'),
          ANNE('Elektrik yok, kızım.'),
          ADA('Hayır. Kumandaya bastım, ışığı yandı. Ama ekran... ekran kendi kendine kapandı.'),
          C('Aileye ne söyleyeceksin?', [
            { label: '"Sabaha kadar bekleyelim. Ordu gelir."', sub: 'Sesi sakin tut. Annen sana bakıyor.', tag: 'SAKİN', flags: { p2_sakin: true, p2_salon: true }, goto: 'sakin' },
            { label: '"Hazırlanın. Burada kalmayacağız."', sub: 'Belki de haklısın.', tag: 'GERÇEK', flags: { p2_gercek: true, p2_salon: true }, goto: 'gercek' }
          ]),
          LBL('sakin'),
          BABA('Ordu... Ordu da karanlıkta, oğlum. Ama haklısın. Sabah olsun.'),
          ANNE('Sabah olsun.'),
          N('Kimse inanmıyor. Ama söylenmiş oluyor.'),
          G('son'),
          LBL('gercek'),
          BABA('Nereye? Aşağıda ne olduğunu bilmiyoruz.'),
          ME('Biliyoruz. Haberlerde gördük.'),
          ANNE('Ada hasta. Onu bu soğukta sokağa çıkaramam.'),
          N('Cevap veremiyorsun. Çünkü haklı.'),
          LBL('son'),
          { type: 'objective', text: 'Koridordaki sesi kontrol et', sub: 'Cihangir • 0. Gün, 23:19' },
          { type: 'end' }
        ],
        anne_gece: [
          ANNE('Mumları mutfaktan aldım. Kibrit de var. Cebinde tut.'),
          ANNE('Oğlum... baban bir şey saklıyor. Gece yarısı kalkıp kapıyı dinliyor.'),
          ME('Ne saklıyor olabilir?'),
          ANNE('Bilmiyorum. Ama 99\'da da böyle yapmıştı. O zaman da kimse inanmamıştı.'),
          ANNE('Ada\'ya iyi bak. Ben... ben ona bir şey söyleyemiyorum.'),
          { type: 'end' }
        ],
        ada_gece: [
          ADA('Ağabey, uyuyamıyorum.'),
          ME('Ateşin var. Gözlerini kapat.'),
          ADA('Kapının dışında biri var. Nefes alıyor. Ama... düzensiz. Bir türlü düzenli olmuyor.'),
          N('Kız kardeşin on beş yaşında ve koridordaki nefesi senden iyi sayıyor.'),
          C('Ada\'ya ne diyeceksin?', [
            { label: '"Ben buradayım. Uyu."', sub: 'Yalan söylemek bazen en büyük iyiliktir.', tag: 'ABİ', flags: { p2_ada_rahat: true }, goto: 'a1' },
            { label: '"O nefes senin hayal gücün. Ama hazır ol."', sub: 'Yalan söyleme.', tag: 'DÜRÜST', flags: { p2_ada_uyandi: true }, goto: 'a2' }
          ]),
          LBL('a1'),
          ADA('Tamam. Elimi tut. Sadece beş dakika.'),
          N('Beş dakika sonra uyuyor. Elini bırakmıyorsun.'),
          G('ae'),
          LBL('a2'),
          ADA('Hazırım. Ama sen de hazır ol, ağabey.'),
          G('ae'),
          LBL('ae'),
          { type: 'end' }
        ],
        baba_gece: [
          BABA('Gel buraya.'),
          N('Ceketinin astarından iki şarjör çıkarıyor. Eski, ağır, bakımlı.'),
          BABA('Babamdan kaldı. 99\'da da yanımdaydı.'),
          ME('Baba, sen kullan—'),
          BABA('Ben kullanamam. Sen kuryesin. Şehri herkesten iyi bilirsin.'),
          FN((g) => {
            g.flags.p2_silah = true;
            g.weapons.pistol.reserve = Math.min(120, g.weapons.pistol.reserve + 24);
            g.weapons.pistol.mag = g.weapons.pistol.magSize;
            g.toast('Babanın şarjörleri alındı · <b>+24 mermi</b>');
          }),
          BABA('İki şey söyleyeceğim. Birincisi: insan gibi görünen her şey insan değil. İkincisi: bir insanı vurmadan önce iki kez bak.'),
          BABA('Ve oğlum... o ses kapıya gelirse, beni bekleme. Ada\'yı götür.'),
          { type: 'end' }
        ],
        sigorta: [
          N('Elektrik panosu. Anahtarın yerinde, sigortalar sağlam.'),
          ME('Sigorta değil. Şehirde elektrik yok.'),
          N('Panoyu kapatırken, iki kat aşağıdan bir ses: metal bir kapı, duvara vuruyor. Bir kez. İki kez.'),
          N('Sonra bir ses daha. Bu sefer insan sesi: "Açma... açma..."'),
          FN((g) => { g.flags.p2_sigorta = true; }),
          { type: 'end' }
        ],
        kapi_ses: {
          cinematic: true,
          shot: 'stair',
          title: 'KORİDOR',
          kicker: '0. GÜN — 23:26',
          nodes: [
            N('Kapıyı aralıyorsun. Koridor zifiri karanlık.'),
            N('Bayram Amca\'nın kapısı açık. Beş yıldır o kapının açıldığını görmemiştin.'),
            N('Işığı yukarı tutuyorsun. Merdiven boşluğunda biri var. Sırtı dönük, başı öne eğik.'),
            ME('Bayram Amca?'),
            N('Adam dönmüyor. Ama başını bir yana çeviriyor. Sonra öbür yana. Bir kuş gibi. Yanlış bir şey.'),
            N('Merdivenlerin altından bir ses daha geliyor: ıslak, uzun bir hırıltı. Yalnız değil.'),
            ANNE('Oğlum, içeri gel!'),
            FN((g) => { g.flags.p2_kapi = true; g.flags.p2_kapi_gordu = true; }),
            { type: 'objective', text: 'Balkon kapısını kontrol et', sub: 'Cihangir • 0. Gün, 23:31' },
            { type: 'end' }
          ]
        },
        pencere_gece: [
          N('Sokağa bakıyorsun. Bir ambulans, ışıkları kapalı, yolun ortasında duruyor.'),
          N('Yanından geçen olmuyor. Sadece bir köpek, bir de rüzgâr.'),
          { type: 'end' }
        ],
        telefon_gece: [
          N('Telefon. Tek çubuk da gitti. Acil aramalar meşgul.'),
          N('Komşu kurye grubundan bir mesaj düşüyor: "Aşağıdayım. Kapıyı açma. Kızıl olan bize de bulaştı."'),
          ME('Ali?'),
          N('Cevap yok.'),
          { type: 'end' }
        ],
        balkon: {
          cinematic: true,
          shot: 'window',
          title: 'SOKAK',
          kicker: '0. GÜN — 23:38',
          nodes: [
            N('Balkon kapısının camı buz gibi. Aşağıda Cihangir, bütün ışıkları sönmüş hâliyle bir kuyu.'),
            N('Sokağın ortasında bir taksi, kapısı açık. Yanında bir kadın, kucağında bir çocuk, koşuyor.'),
            N('Sonra bir başka gölge. Kadının önünü kesiyor. Değil... düşüyor. Adamın üstüne düşüyor.'),
            N('Uzaktan bir çığlık. Sonra bina kapısından gelen, çok daha yakın bir ses.'),
            N('Camda bir el izi beliriyor. İçeriden.'),
            ME('...Ada, arkaya geç. Şimdi!'),
            FN((g) => {
              g.flags.p2_balkon = true;
              g.spawnAt('walker', 9.4, 8.2);
              g.spawnAt('walker', 8.6, 6.4);
              g.toast('Daireye bir şey girdi');
            }),
            N('Mutfak kapısının ardından bir cam kırılışı. Balkon kapısı zorlanıyor.'),
            { type: 'objective', text: 'Daireyi temizle', sub: 'Cihangir • 0. Gün, 23:41' },
            { type: 'end' }
          ]
        },
        son: {
          cinematic: true,
          shot: 'stair',
          title: 'KAPI',
          kicker: '0. GÜN — 23:58',
          nodes: [
            N('Daire kapısı. Dışarıdan gelen ses artık tek değil.'),
            N('Annen gardırobu sürüklüyor. Baban masayı deviriyor. Ada mumu sana uzatıyor.'),
            BABA('Sabaha kadar dayanacağız. Sonra birlikte çıkacağız.'),
            ANNE('Hep birlikte.'),
            N('Kapıya sırtını dayıyorsun. Ahşap, tırnaklarla kazınıyor: uzun, sabırlı, hiç durmayan.'),
            N('Elektrik geri gelmiyor. Şehir karanlıkta. Ama kapının ardındaki ses... ses öğreniyor.'),
            FN((g) => { g.flags.p2_direndi = true; }),
            { type: 'chapter', chapter: 'p3' }
          ]
        }
      }
    },

    /* ============ PROLOGUE 3 — SABAH ============ */
    p3: {
      key: 'p3',
      number: 'BÖLÜM II',
      title: 'SABAH',
      subtitle: 'Elektrik yok, sular yok. Dairenin içinde bir ses var.',
      objective: 'Salona git',
      objectiveSub: 'Cihangir • 1. Gün, 06:44',
      mapKey: 'cihangir',
      world: 'ev2',
      intro: [
        N('06:40. Elektrik yok. Kombi susmuş, buzdolabı susmuş, şehir susmuş.'),
        N('Koridordan bir ses: sürtünen ayak. Sonra metal bir tıkırtı. Sonra tekrar.'),
        ME('Anne? Ada?'),
        ANNE('Salondayız. Sessiz ol. Kapıyı açma.'),
        N('Babanın çekmecesinden aldığın tabanca kemerinde. Bu sabah ağırlığı her zamankinden fazla.'),
        O('Salona git', 'Cihangir • 1. Gün, 06:44'),
        { type: 'end' }
      ],
      events: {
        salon: [
          N('Perdeler sıkıca kapalı. Ada battaniyeye sarılmış; annen elinde bir bıçakla kapının yanında duruyor.'),
          ME('Baba nerede?'),
          ANNE('Gece yarısı eczaneye gitti. Bir saat önce aradı: "Döndüm," dedi. Sonra bir daha aramadı.'),
          ADA('Ağabey, koridorda biri var.'),
          N('Ses kapıya yaklaşıyor. Bir el, kapıyı tırmalıyor. Tırnaklar vernikte kayıyor.'),
          C('Ne yapacaksın?', [
            { label: 'Kapıyı aç. Ne olduğunu görmelisin.', sub: "Belki de Bayram Amca'dır.", tag: 'CESUR', flags: { p3_ac: true }, goto: 'ac' },
            { label: 'Önce kapıyı barikatla.', sub: 'Ada ve annen arkada dursun.', tag: 'SAKİN', flags: { p3_barikat: true }, goto: 'bar' }
          ]),
          LBL('ac'),
          N('Kapıyı aralıyorsun. Koridorda bir adam var; sırtı dönük, omuzları düşük. Sonra başını çeviriyor.'),
          N('Gözleri... gözleri yok gibi. Sadece kırmızı, ıslak bir boşluk.'),
          N('Ağzından bir ses çıkıyor: ıslak, uzun bir hırıltı.'),
          ANNE('O ne?'),
          ME("Arkaya geç. Ada'yı odana götür, kapıyı kapat."),
          G('fight'),
          LBL('bar'),
          N('Mutfaktan masayı çekip kapının önüne deviriyorsun. Gürültüyle tırmalama hızlanıyor.'),
          N('Sonra bir omuz darbesi: kapı kasası toz döküyor.'),
          ANNE("Hasan'ın anahtarı hâlâ kapının üstünde..."),
          N('Kilit, içeriden açılıyor.'),
          LBL('fight'),
          FN((g) => {
            g.flags.p3_salon = true;
            g.spawnAt('walker', 13.8, 18.4);
            g.spawnAt('walker', 13.8, 11.4);
            g.spawnAt('runner', 7.4, 14.4);
          }),
          ME('Şimdi. Silahını kaldır.'),
          O('Daireyi temizle', 'Cihangir • 1. Gün, 06:52'),
          { type: 'end' }
        ],
        anne2: [
          ANNE("Koridoru boşaltmadan çıkmayacağız. Ada'yı kucağıma alacağım."),
          ANNE('Baban... baban o kapının arkasında olabilir.'),
          ME('Biliyorum.'),
          { type: 'end' }
        ],
        ada2: [
          ADA('Ağabey, ben yürüyebilirim.'),
          ME('Biliyorum. Yine de annenin arkasında kal.'),
          ADA('Peki. Ağabey... o adam Bayram Amca mıydı?'),
          ME('...'),
          ADA('Tamam. Sormadım.'),
          { type: 'end' }
        ],
        telefon2: [
          N('Telefonunu açıyorsun. Sinyal yok. Sadece acil aramalar.'),
          N('Acil aramayı tuşluyorsun. Meşgul. Bir daha. Meşgul.'),
          ME('Tamam. Kendi başımıza.'),
          { type: 'end' }
        ],
        cikis2: {
          cinematic: true,
          visual: 'street',
          title: 'MERDİVEN',
          kicker: '1. GÜN — 07:12',
          nodes: [
            N('Kapıyı açıyorsun. Koridor boş. Merdiven boşluğunda, iki kat aşağıda, bir gölge kımıldıyor.'),
            N('Annen Ada\'yı kucağına alıyor. Ada gözlerini kapatıyor; küçüklüğünden beri asansörden korkar, merdivenlerden değil.'),
            ANNE('Sen önde git. Biz arkandayız.'),
            ME('Basamakları saymayın. Sadece yürüyün.'),
            N('Dışarısı... dışarısı dün geceki gibi değil.'),
            { type: 'chapter', chapter: 'p4' }
          ]
        }
      }
    },

    /* ============ PROLOGUE 4 — MAHALLE ============ */
    p4: {
      key: 'p4',
      number: 'BÖLÜM III',
      title: 'MAHALLE',
      subtitle: "Cihangir'in dar sokakları. Hava hâlâ kırmızı.",
      objective: 'Eczaneye ulaş',
      objectiveSub: "Cihangir • 1. Gün, 08:05",
      mapKey: 'cihangir',
      world: 'mahalle',
      intro: [
        N('Sokak. Güneş çıktı ama hava hâlâ kırmızı; sanki şehrin üstünde bir çarşaf var.'),
        ANNE("Eczane, caddenin karşısında. Ada'nın ateşi düşmedi."),
        ME('Arabayı bulun. Ben ilacı alıp geleceğim.'),
        ADA('Ağabey, sen de gel.'),
        ME('Gelirim. Sadece önce ilacı alayım.'),
        O('Eczaneye ulaş', 'Cihangir • 1. Gün, 08:05'),
        { type: 'end' }
      ],
      events: {
        cikis: [
          N('Apartmanın kapısından çıkıyorsun. Sokağın ortasında bir çanta, bir tek ayakkabı, devrilmiş bir simit arabası.'),
          N('Uzakta bir köpek, bir şeye havlamıyor. Sadece bakıyor.'),
          { type: 'end' }
        ],
        cadde: [
          N('Ana cadde. Bariyerler devrilmiş, iki araba yolu kapatmış.'),
          N('Ve insanlar. Yürüyorlar... ama yürümüyorlar. Sürükleniyorlar.'),
          FN((g) => { g.wave('p3_cadde'); }),
          ANNE('Ağabey, arkanıza bakmayın. Sadece yürüyün.'),
          { type: 'objective', text: 'Eczaneye ulaş', sub: 'Cihangir • 1. Gün, 08:19' },
          { type: 'end' }
        ],
        eczane: [
          N('Eczanenin vitrini kırılmış. İçeride bir jeneratör uğulduyor; rafların yarısı devrilmiş.'),
          ME('Kimse yok mu?'),
          N('Sadece tezgâhın arkasında bir telsiz cızırdıyor.'),
          { type: 'end' }
        ],
        ilac: [
          N("Raflarda antibiyotik arıyorsun. Ada'nın ateşi için. Bir kutu, iki kutu... süresi geçmiş."),
          N('En altta, kilitli dolabın arkasında, son bir kutu: AMOKSİSİLİN.'),
          FN((g) => { g.flags.p3_ilac = true; g.flags.p3_meds = true; g.giveAmmo(8); }),
          ME('Tamam. Bu iş görür.'),
          N('Kutuyu cebine koyarken eczanenin açık kapısından bir gölge geçiyor. Sonra bir tane daha.'),
          O('Camii avlusundaki minibüse ulaş', 'Cihangir • 1. Gün, 08:31'),
          { type: 'end' }
        ],
        radyo: {
          cinematic: true,
          visual: 'radio',
          title: '104.6 MHz',
          kicker: '1. GÜN — 08:33',
          nodes: [
            N('Telsizin düğmesini çeviriyorsun. Parazit. Parazit. Sonra bir ses.'),
            L('BİLİNMEYEN', '104.6 MHz', 'leyla', '...duyan var mı? Tekrar ediyorum: Galata Kulesi laboratuvarı. Panzehir üzerinde çalışıyorum.'),
            N('Bir kadın sesi. Yorgun, ama sakin. Arka planda bir jeneratör, bir de rüzgâr.'),
            L('BİLİNMEYEN', '104.6 MHz', 'leyla', 'Eğer bu yayını duyuyorsanız... etrafınızdaki seslere dikkat edin. Sis sadece bedeni değiştirmiyor.'),
            ME('Kimsin sen?'),
            N('Cevap yok. Sadece parazit.'),
            FN((g) => { g.flags.heard_leyla = true; }),
            { type: 'end' }
          ]
        },
        erzak: [
          N('Rafta birkaç kutu konserve, bir de av tüfeği fişeği var.'),
          N('Kimsenin olmadığı bir dükkânda, kimsenin olmayan bir şeyi alıyorsun.'),
          FN((g) => { g.giveAmmo(10); g.heal(12); }),
          { type: 'end' }
        ],
        minibus: {
          cinematic: true,
          visual: 'street',
          title: 'MİNİBÜS',
          kicker: '1. GÜN — 09:02',
          nodes: [
            N('Cami avlusunda bir minibüs, kapıları açık, motoru çalışır hâlde bekliyor.'),
            N('Annen Ada\'yı arka koltuğa oturtmuş. Elleri titriyor.'),
            ANNE('Şoför yok. Anahtarı da üstünde.'),
            ME('Ben süreceğim. Sahil yoluna iniyoruz; karantina kapısı akşama kadar açık.'),
            ANNE('Peki ya baban?'),
            N('Camiin gölgesinde, uzakta, bir adam duruyor. Ceketi tanıdık. Yürüyüşü... yürüyüşü değil.'),
            C('Ne yapacaksın?', [
              { label: "Minibüse bin. Baban geride kalacak.", sub: 'Ada ve annen araçta. Bekleyemezsin.', tag: 'AİLE', flags: { p3_baba_geride: true }, goto: 'git' },
              { label: 'Ona seslen. Belki seni tanır.', sub: 'Belki hâlâ o adamdır.', tag: 'UMUT', flags: { p3_baba_ses: true }, heal: -10, goto: 'ses' }
            ]),
            LBL('ses'),
            ME('Baba!'),
            N('Adam başını kaldırıyor. Bir an, sadece bir an, gözlerinde bir şey var.'),
            N('Sonra o şey kayboluyor ve adam sana doğru yürüyor.'),
            ANNE('Ağabey, gel!'),
            G('git'),
            LBL('git'),
            N('Minibüsün kapısını kapatıyorsun. Dikiz aynasında cami küçülüyor, adam küçülüyor, sonra hiç oluyor.'),
            ANNE('Ağlama. Sür.'),
            { type: 'chapter', chapter: 'p5' }
          ]
        }
      }
    },

    /* ============ PROLOGUE 4 — SAHİL ============ */
    p5: {
      key: 'p5',
      number: 'BÖLÜM IV',
      title: 'SAHİL',
      subtitle: "Boğaz'a inen yol. Karantina kapısı kapanmadan geçmelisiniz.",
      objective: 'Karantina kapısına ulaş',
      objectiveSub: 'Sahil yolu • 1. Gün, 17:52',
      mapKey: 'cihangir',
      world: 'sahil',
      intro: [
        N('Sahil yolu. Boğaz, akşam ışığında bir kurşun gibi parlıyor.'),
        N('Minibüs, yakıtı bitince yolun ortasında durdu. Şoför kapısını açtı ve bir daha konuşmadı.'),
        ANNE('Yürüyeceğiz. Karantina kapısı kapanmadan geçmeliyiz.'),
        N('Ada ateşler içinde; annen onu sırtına aldı. Yürüyorlar.'),
        O('Karantina kapısına ulaş', 'Sahil yolu • 1. Gün, 17:52'),
        { type: 'end' }
      ],
      events: {
        varis: [
          N('Sahil yolu. Askeri kamyonlar, brandalı çadırlar, uzun bir kuyruk.'),
          N('İnsanlar sessiz. Sadece bir bebek ağlıyor, bir de uzakta bir jeneratör.'),
          FN((g) => { g.wave('p4_sahil'); }),
          { type: 'end' }
        ],
        kapi: {
          cinematic: true,
          visual: 'coast',
          title: 'KARANTİNA',
          kicker: '1. GÜN — 18:14',
          nodes: [
            N('Kapı. Beton, dikenli tel ve iki sıra asker.'),
            L('ASKER', 'KARANTİNA HATTI', 'radio', 'Sırayı bozmayın. Ateşi olanlar sağdaki çadıra.'),
            ANNE("Ada'nın ateşi var. Ben onunla gideceğim."),
            ME('Hayır. Birlikte geçeceğiz.'),
            N('Askere yaklaşıyorsun. Elinde bir liste, gözünde yorgunluk var.'),
            L('ASKER', 'KARANTİNA HATTI', 'radio', 'Ateşi olan geçemez. Kural.'),
            C('Ne yapacaksın?', [
              { label: 'Israr et. Onları da geçirmeye çalış.', sub: 'Kuralı bir kişi için bükersin.', tag: 'AİLE', flags: { p4_israr: true }, goto: 'israr' },
              { label: 'Annene sarıl. Sonra geç.', sub: 'Onlar arkada kalacak.', tag: 'GERÇEK', flags: { p4_kabul: true }, goto: 'kabul' },
              { label: 'Onlarla kal. Kapıyı geçme.', sub: 'Belki burada bir hayat var.', tag: 'FEDAKÂRLIK', flags: { p4_kal: true }, goto: 'kal' }
            ]),
            LBL('israr'),
            N('Askere doğru bir adım atıyorsun. Tüfek, göğsüne doğru kalkıyor.'),
            L('ASKER', 'KARANTİNA HATTI', 'radio', 'Bir adım daha atarsan seni de çadıra alırım.'),
            ANNE("Dur. Dur, oğlum. Yeter."),
            G('ayrilik'),
            LBL('kabul'),
            N('Annene sarılıyorsun. Ada, ateşler içinde, elini tutuyor.'),
            ADA('Ağabey... sen gelmiyor musun?'),
            ME('Ben... ben arkadan geleceğim. Tamam mı?'),
            ADA('Tamam.'),
            G('ayrilik'),
            LBL('kal'),
            N('Geri dönüyorsun. Askere değil, annene.'),
            ANNE("Hayır. Sen geçeceksin. Ada'yı ben taşırım."),
            N('Ellerini omzuna koyuyor ve seni kapıya doğru itiyor.'),
            G('ayrilik'),
            LBL('ayrilik'),
            N('Kapı, aranızda kapanıyor.'),
            N("Annenin yüzü, telin ardından beyaz bir leke gibi kalıyor. Ada elini kaldırıyor. Sonra sıra öne kayıyor."),
            FN((g) => {
              g.flags.p4_kapi = true;
              const d = g.world.doors.get('sahil_gate');
              if (d) d.open = true;
            }),
            { type: 'objective', text: 'Rıhtıma yürü', sub: 'Karaköy • 1. Gün, 18:26' },
            { type: 'end' }
          ]
        },
        tekne: [
          N('Bağlı bir tekne. Motoru yok, küreği yok, kilidi paslı.'),
          ME('Henüz değil.'),
          { type: 'end' }
        ],
        son: {
          cinematic: true,
          visual: 'coast',
          title: 'RIHTIM',
          kicker: '1. GÜN — 18:40',
          nodes: [
            N('Rıhtım. Su, taşlara vuruyor. Şehrin ışıkları teker teker yanıyor — sonra teker teker sönüyor.'),
            N('Cebinde bir kutu antibiyotik, bir tabanca, ve bir isim: 104.6 MHz.'),
            N('Yedi gün geçti. Belki sekiz.'),
            N("Karantina kapısının ardında anneni ve Ada'yı son bir kez gördün: beyaz bir çadır, sarı bir battaniye, bir el sallayışı."),
            N('Sonra çadırlar taşındı. Sonra kapı kapandı. Sonra telsizler sustu.'),
            N('Dokuzuncu günün gecesi, Karaköy rıhtımındasın.'),
            L('BİLİNMEYEN', '104.6 MHz', 'leyla', "...yanında kalan varsa dinlesin. Galata Kulesi'ndeyim. Panzehir burada. Ama tek başıma çıkamam."),
            C('Neden hâlâ ayaktasın?', [
              { label: 'Ailem için.', sub: "Onları geri alacağım.", tag: 'AİLE', flags: { motive: 'aile', motiveText: 'Ailesini geri almak' } },
              { label: 'Panzehir için.', sub: 'Bir doktor, bir flakon, bir şehir.', tag: 'UMUT', flags: { motive: 'panzehir', motiveText: 'Panzehiri bulmak' } },
              { label: 'Hayatta kalmak için.', sub: 'Başka bir sebep kalmadı.', tag: 'HAYATTA KALMA', flags: { motive: 'kalmak', motiveText: 'Sadece hayatta kalmak' } }
            ]),
            N('Motoru terk ettin. Rıhtımda, sisin içinde bir gölge daha var.'),
            N('Silahını kavra. Bu şehirde her ses, bir seçim.'),
            { type: 'chapter', chapter: 'ch1' }
          ]
        }
      }
    },

    /* ============ CHAPTER 1 ============ */
    ch1: {
      key: 'ch1',
      number: 'BÖLÜM V',
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
      number: 'BÖLÜM V',
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
      number: 'BÖLÜM VII',
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
      p1: {
        type: 'AİLE FOTOĞRAFI',
        title: 'BALKONDA BİR YAZ',
        body:
          'Fotoğraf çerçevede, camın ardında: anne, baba, Ada ve sen. Ada sekiz yaşında, ön dişi eksik.\n\n' +
          'Arkasında annenin el yazısı:\n' +
          '"Bu yaz her şey yoluna girecek. Söz verdim."\n\n' +
          'Fotoğrafın camında parmak izin var. Ne zamandır dokunduğunu hatırlamıyorsun.'
      },
      p1b: {
        type: 'BUZDOLABINDAKİ NOT',
        title: 'PERŞEMBE',
        body:
          '"Oğlum —\n' +
          'Yemeğin fırında. Geç gelirsen ısıt.\n' +
          'Baban bugün yine haberleri izliyor. Bir şey söyleme, sinirleniyor.\n' +
          'Ada\'nın ödevi için yardım et. Ve lütfen uyu, sabah erken çıkıyorsun.\n\n' +
          '— Anne"\n\n' +
          'Notun köşesi nemlenmiş. Buzdolabı dün gece bir kez daha susmuş olmalı.'
      },
      p2: {
        type: 'KAPICI NOTU',
        title: 'KAT MALİKİNE DUYURU',
        body:
          '"Sayın sakinler,\n\n' +
          'Dün gece bina girişinde bir olay yaşanmıştır. Polis, görgü tanıklarının ifadesini almıştır.\n' +
          'Bayram Amca (daire 3) iki gündür görülmemektedir. Kapısını çalmayın.\n\n' +
          'Su deposu arızalıdır. Jeneratör çalışmıyor. Merdiven boşluğunu karanlıkta kullanmayın.\n\n' +
          '— Kapıcı İrfan"'
      },
      p2c: {
        type: 'MUTFAK ÇEKMECESİ',
        title: 'KİBRİT VE BİR NOT',
        body:
          'Çekmecede bir kutu kibrit, iki mum ve annenin alışveriş listesi.\n\n' +
          'Listenin arkasında, aceleyle yazılmış bir not:\n' +
          '"Ada\'nın ateşi 38,6. Eczane kapalıysa hastaneye götüreceğiz.\n' +
          'Hasan, sen sakın sokağa çıkma. Oğlum, sen de.\n' +
          'Sabah olunca konuşuruz."\n\n' +
          'Notun üstüne, babanın el yazısıyla bir çizgi çekilmiş. Yanına: "Sabah olmayacak."'
      },
      p2b: {
        type: 'BULUNAN CÜZDAN',
        title: 'HASAN · 55',
        body:
          'Ceketin iç cebinde bir cüzdan. Ehliyet, birkaç kuruş, bir de katlanmış reçete.\n\n' +
          'Reçetenin arkasına babanın el yazısıyla not düşülmüş:\n' +
          '"Eczane kapalıysa hastaneyi dene. Ada\'yı bekletme.\n' +
          'Oğlum — eğer bunu okuyorsan, ben dönmemişimdir. Sakın arkana bakma. Onları götür."'
      },
      p4: {
        type: 'KARANTİNA İLANI',
        title: 'BOĞAZ HATTI — 1. GÜN',
        body:
          'T.C. İSTANBUL VALİLİĞİ — ACİL DURUM İLANI\n\n' +
          '1) Boğaz hattı boyunca sivil geçiş, gün batımında kapatılacaktır.\n' +
          '2) Ateş, ısırık veya bilinç bulanıklığı görülen kişiler karantina çadırlarına alınacaktır.\n' +
          '3) Sağlıklı bireylerin tek başına geçişine izin verilecektir. Aile bireyleri ayrı değerlendirilir.\n' +
          '4) Deniz yoluyla çıkış yasaktır.\n\n' +
          'İmza: Sahil Güvenlik Komutanlığı\n\n' +
          'Altında kurşun kalemle bir not: "Kural 3\'ü kim yazdıysa, bir çocuğu hiç sevmemiş."'
      },
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
