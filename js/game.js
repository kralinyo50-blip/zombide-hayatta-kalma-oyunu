/* ============================================================
   KARANLIK BOĞAZ — game.js
   Game loop, player, zombies, combat, interactables, HUD,
   dialogue runner, chapter flow, endings, map screen wiring.
   ============================================================ */
(function (global) {
  'use strict';

  const G = {
    mode: 'title',
    prevMode: null,
    chapterKey: 'ch1',
    chapterIndex: 0,
    world: null,
    player: { x: 2, y: 2, a: 0, pitch: 0, hp: 100, maxHp: 100, stamina: 100, bob: 0, bobPhase: 0 },
    zombies: [],
    npcs: [],
    pickups: [],
    particles: [],
    time: 0,
    timeOfDay: 22 * 60 + 47,
    flags: {},
    stats: { kills: 0, shots: 0, hits: 0, headshots: 0, damageTaken: 0, zombiesKilled: 0 },
    weapons: {
      pistol: { name: 'TABANCA', mag: 12, magSize: 12, reserve: 48, damage: 34, rate: 0.24, spread: 0.045, range: 24, pellets: 1, auto: false, cooldown: 0 },
      shotgun: { name: 'POMPALI', mag: 6, magSize: 6, reserve: 18, damage: 22, rate: 0.78, spread: 0.16, range: 14, pellets: 6, auto: false, cooldown: 0, owned: false }
    },
    weapon: 'pistol',
    reloading: 0,
    muzzle: 0,
    recoil: 0,
    shake: 0,
    hitFlash: 0,
    damageFlash: 0,
    healFlash: 0,
    charm: false,
    objective: { text: '', sub: '', target: null },
    boss: null,
    bossFight: false,
    keys: {},
    mouseDown: false,
    locked: false,
    lookTarget: { x: 0, y: 0 },
    noLock: false,
    touch: { active: false, moveX: 0, moveY: 0, lookId: null, lookX: 0, lookY: 0, stickId: null, stickOX: 0, stickOY: 0 },
    settings: { sens: 0.0022, quality: 0.58 },
    paused: false,
    mapReturn: 'title',
    saveKey: 'kb_save_v1',
    endingsKey: 'kb_endings_v1',
    lastFrame: 0,
    acc: 0,
    hudTimer: 0,
    minimapTimer: 0,
    eventsFired: {},
    waveCd: {},
    deathCount: 0,
    started: false,
    introSeen: false,
    autosaveCd: 0,
    hudCache: {},
    objectivePulse: 0,
    grain: null
  };

  const $ = U.$;
  const CHAPTERS = ['p1', 'p2', 'p3', 'p4', 'p5', 'ch1', 'ch2', 'ch3'];

  /* ============================================================
     SCREENS
     ============================================================ */
  const Screens = {
    all: ['title-screen', 'screen-cinematic', 'screen-dialogue', 'screen-chapter', 'screen-pause',
      'screen-death', 'screen-ending', 'screen-map', 'screen-help', 'screen-doc'],
    open(id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    },
    close(id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    },
    closeAll() {
      for (const id of Screens.all) Screens.close(id);
    },
    showHud(show) {
      const hud = document.getElementById('hud');
      if (hud) hud.classList.toggle('hidden', !show);
    }
  };

  /* ============================================================
     DIALOGUE ENGINE
     ============================================================ */
  const DLG = {
    queue: [],
    index: 0,
    labels: {},
    mode: 'cinematic',
    onEnd: null,
    typing: false,
    fullText: '',
    charIndex: 0,
    typeTimer: 0,
    lineEl: null,
    active: false,
    choiceOpen: false,
    seenLines: 0,

    start(nodes, opts = {}) {
      this.queue = nodes || [];
      this.index = 0;
      this.mode = opts.cinematic ? 'cinematic' : 'dialogue';
      this.onEnd = opts.onEnd || null;
      this.labels = {};
      this.active = true;
      this.choiceOpen = false;
      this.typing = false;
      this.seenLines = 0;
      // collect labels
      this.queue.forEach((n, i) => { if (n && n.type === 'label') this.labels[n.id] = i; });

      G.prevMode = G.mode;
      G.mode = this.mode === 'cinematic' ? 'cine' : 'dialogue';
      if (this.mode === 'cinematic') {
        Screens.close('screen-dialogue');
        Screens.open('screen-cinematic');
        const shot = opts.shot || opts.visual || null;
        const cw = document.getElementById('screen-cinematic');
        if (cw) cw.classList.toggle('has-shot', !!shot);
        if (global.CINE) { CINE.init(); if (shot) CINE.start(shot); else CINE.stop(); }
        const cl = document.getElementById('cine-lines');
        if (cl) cl.innerHTML = '';
        const cc = document.getElementById('cine-choices');
        if (cc) { cc.innerHTML = ''; cc.classList.add('hidden'); }
        const title = document.getElementById('cine-title');
        const kicker = document.getElementById('cine-kicker');
        if (title) title.textContent = opts.title || '';
        if (kicker) kicker.textContent = opts.kicker || '';
        const bg = document.getElementById('cine-bg');
        if (bg) {
          bg.style.backgroundImage = opts.bg ? `url(${opts.bg})` : 'none';
          bg.style.opacity = opts.bg ? .55 : 0;
        }
        const nextBtn = document.getElementById('cine-next');
        if (nextBtn) nextBtn.classList.add('hidden');
      } else {
        Screens.close('screen-cinematic');
        Screens.open('screen-dialogue');
        const dc = document.getElementById('dlg-choices');
        if (dc) dc.innerHTML = '';
        const dt = document.getElementById('dlg-text');
        if (dt) dt.textContent = '';
      }
      this.process();
    },

    stop() {
      this.active = false;
      this.choiceOpen = false;
      if (global.CINE) CINE.stop();
      Screens.close('screen-dialogue');
      Screens.close('screen-cinematic');
    },

    finish() {
      const cb = this.onEnd;
      this.active = false;
      if (global.CINE) CINE.stop();
      Screens.close('screen-dialogue');
      Screens.close('screen-cinematic');
      if (cb) cb();
      else G.backToPlay();
    },

    process() {
      let guard = 0;
      while (this.index < this.queue.length && guard++ < 400) {
        const node = this.queue[this.index];
        if (!node) { this.index++; continue; }
        switch (node.type) {
          case 'label': this.index++; continue;
          case 'flags':
            Object.assign(G.flags, node.flags || {});
            this.index++; continue;
          case 'fn':
            try { node.fn(G); } catch (e) { console.warn('story fn error', e); }
            this.index++; continue;
          case 'objective':
            G.setObjective(node.text, node.sub);
            this.index++; continue;
          case 'goto':
            if (this.labels[node.target] !== undefined) { this.index = this.labels[node.target] + 1; continue; }
            this.index++; continue;
          case 'chapter':
            this.active = false;
            if (global.CINE) CINE.stop();
            Screens.close('screen-dialogue');
            Screens.close('screen-cinematic');
            G.startChapter(node.chapter);
            return;
          case 'ending':
            this.active = false;
            if (global.CINE) CINE.stop();
            Screens.close('screen-dialogue');
            Screens.close('screen-cinematic');
            G.showEnding(node.ending);
            return;
          case 'end':
            this.finish();
            return;
          case 'line':
            if (this.mode === 'cinematic') this.showCineLine(node);
            else this.showDlgLine(node);
            this.index++;
            return;
          case 'choice':
            this.showChoice(node);
            this.index++;
            return;
          default:
            this.index++;
        }
      }
      this.finish();
    },

    /* ---------- cinematic ---------- */
    showCineLine(node) {
      if ((node.shot || node.visual) && global.CINE) CINE.start(node.shot || node.visual);
      const wrap = document.getElementById('cine-lines');
      if (!wrap) return;
      const el = document.createElement('div');
      el.className = 'cine-line ' + (node.style || 'narration');
      if (node.who) {
        const who = document.createElement('span');
        who.className = 'who';
        who.textContent = node.who;
        el.appendChild(who);
      }
      const txt = document.createElement('span');
      txt.innerHTML = this.markup(node.text);
      el.appendChild(txt);
      wrap.appendChild(el);
      if (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
      requestAnimationFrame(() => el.classList.add('on'));
      this.typing = false;
      const nextBtn = document.getElementById('cine-next');
      if (nextBtn) { nextBtn.classList.remove('hidden'); }
      if (node.style === 'big') {
        G.shake = Math.max(G.shake, 4);
      }
      this.seenLines++;
    },

    markup(text) {
      // highlight *emphasised* text and "quotes"
      return String(text)
        .replace(/\*(.+?)\*/g, '<b>$1</b>')
        .replace(/\[(.+?)\]/g, '<b>$1</b>');
    },

    /* ---------- in-game dialogue ---------- */
    showDlgLine(node) {
      const nameEl = document.getElementById('dlg-name');
      const roleEl = document.getElementById('dlg-role');
      const textEl = document.getElementById('dlg-text');
      const countEl = document.getElementById('dlg-count');
      if (nameEl) nameEl.textContent = node.who || '';
      if (roleEl) roleEl.textContent = node.role || '';
      const portraitWrap = document.querySelector('.dlg-portrait-wrap');
      const pc = document.getElementById('dlg-portrait');
      if (pc) {
        const pctx = pc.getContext('2d');
        if (node.portrait) {
          SPR.portrait(pctx, node.portrait, G.time);
          if (portraitWrap) portraitWrap.style.visibility = 'visible';
        } else {
          pctx.clearRect(0, 0, pc.width, pc.height);
          if (portraitWrap) portraitWrap.style.visibility = 'hidden';
        }
      }
      const text = node.text || '';
      this.fullText = text;
      this.charIndex = 0;
      this.typing = true;
      this.lineEl = textEl;
      if (textEl) textEl.textContent = '';
      if (countEl) countEl.textContent = `${this.seenLines + 1}`;
      this.seenLines++;
    },

    tick(dt) {
      if (!this.active || this.mode !== 'dialogue' || !this.typing) return;
      const cps = 62;
      this.typeTimer += dt;
      const want = Math.floor(this.typeTimer * cps);
      if (want > this.charIndex) {
        this.charIndex = Math.min(this.fullText.length, want);
        if (this.lineEl) {
          this.lineEl.innerHTML = this.markup(this.fullText.slice(0, this.charIndex)) +
            (this.charIndex < this.fullText.length ? '<span class="cursor"></span>' : '');
        }
        if (this.charIndex >= this.fullText.length) this.typing = false;
      }
    },

    /* ---------- choices ---------- */
    showChoice(node) {
      this.choiceOpen = true;
      const isCine = this.mode === 'cinematic';
      const wrap = document.getElementById(isCine ? 'cine-choices' : 'dlg-choices');
      if (!wrap) return;
      wrap.innerHTML = '';
      wrap.classList.remove('hidden');
      const opts = (node.options || []).filter(o => !o.if || o.if(G));
      if (isCine) {
        const nextBtn = document.getElementById('cine-next');
        if (nextBtn) nextBtn.classList.add('hidden');
      }
      opts.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = isCine ? 'cine-choice' : 'dlg-choice';
        if (isCine) {
          btn.innerHTML = `<span class="cc-key">${i + 1}</span>
            <span class="cc-body"><span class="cc-title">${opt.label}</span>
            <span class="cc-sub">${opt.sub || ''}</span></span>
            ${opt.tag ? `<span class="cc-tag">${opt.tag}</span>` : ''}`;
        } else {
          btn.innerHTML = `<b>${i + 1}</b><span>${opt.label}</span>${opt.tag ? `<span class="tag">${opt.tag}</span>` : ''}`;
        }
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.choose(opt);
        });
        wrap.appendChild(btn);
        requestAnimationFrame(() => btn.classList.add('on'));
      });
      const prompt = document.getElementById(isCine ? 'cine-kicker' : 'dlg-tip');
      if (isCine && prompt && node.prompt) prompt.textContent = node.prompt.toUpperCase();
      if (!isCine && prompt) prompt.textContent = 'Bir seçim yap / 1-' + opts.length;
    },

    choose(opt) {
      if (!this.choiceOpen) return;
      this.choiceOpen = false;
      const wrap = document.getElementById(this.mode === 'cinematic' ? 'cine-choices' : 'dlg-choices');
      if (wrap) { wrap.innerHTML = ''; wrap.classList.add('hidden'); }
      AUD.choice();
      if (opt.flags) Object.assign(G.flags, opt.flags);
      if (opt.trust) G.flags.trust = (G.flags.trust || 0) + opt.trust;
      if (opt.toast) G.toast(opt.toast);
      if (opt.heal) G.heal(opt.heal);
      if (opt.ammo) G.giveAmmo(opt.ammo);
      if (opt.charm) { G.charm = true; G.toast('<b>Mavi Boncuk</b> takıldı'); }
      if (opt.fn) { try { opt.fn(G); } catch (e) { console.warn(e); } }
      G.flags['choice_' + (opt.tag || 'x')] = true;
      if (opt.goto && this.labels[opt.goto] !== undefined) {
        this.index = this.labels[opt.goto] + 1;
      }
      this.process();
    },

    advance() {
      if (!this.active) return;
      if (this.choiceOpen) return;
      if (this.mode === 'dialogue' && this.typing) {
        this.charIndex = this.fullText.length;
        this.typeTimer = 999;
        if (this.lineEl) this.lineEl.innerHTML = this.markup(this.fullText);
        this.typing = false;
        return;
      }
      if (this.mode === 'cinematic') {
        AUD.ui(true);
      }
      this.process();
    }
  };

  /* ============================================================
     CHAPTER CONFIG
     ============================================================ */
  const FLOW = {
    p1: {
      world: 'ev',
      sky: 'night',
      ambience: 'indoor',
      intro: 'intro',
      introShot: 'home',
      triggers: {},
      interactions: {
        anne: { event: 'anne', doneFlag: 'p1_anne', repeat: ['ANNEM', 'Ye bakalım. Sonra babanla konuş.'] },
        baba: { event: 'baba', doneFlag: 'p1_baba', repeat: ['BABAM', 'Yarın sabah her şey belli olur.'] },
        ada: { event: 'ada', doneFlag: 'p1_ada', repeat: ['ADA', 'Telefonumun şarjı bitiyor.'] },
        telefon: { event: 'telefon', doneFlag: 'p1_tel', repeat: ['SEN', 'Sinyal yok.'] },
        pencere: { event: 'pencere', doneFlag: 'p1_pencere', repeat: ['SEN', 'Sokakta kimse yok gibi.'] },
        pencere2: { event: 'balkon' },
        aile_foto: { doc: 'p1', flag: 'read_doc_p1' },
        buzdolabi: { doc: 'p1b', flag: 'read_doc_p1b' },
        tv: { event: 'tv', require: (g) => !!g.flags.p1_anne, gateText: 'Önce annemle konuşayım.' },
        ev_exit: { event: 'cikis', require: (g) => !!g.flags.p1_haber, gateText: 'Önce televizyondaki haberi görmeliyim.' }
      },
      objective: { text: 'Annenle konuş', sub: 'Cihangir • 0. Gün, 21:12', target: [23.2, 8.4] },
      objectives: [
        { when: (g) => !!g.flags.p1_anne, text: 'Babana haberleri sor', sub: 'Cihangir • 0. Gün, 21:24', target: [7.4, 3.8] },
        { when: (g) => !!g.flags.p1_baba, text: 'Televizyonu aç', sub: 'Cihangir • 0. Gün, 21:47', target: [8.2, 4.6] },
        { when: (g) => !!g.flags.p1_haber, text: 'Pencereye git', sub: 'Cihangir • 0. Gün, 22:04', target: [3.5, 6.6] },
        { when: (g) => !!g.flags.p1_pencere, text: 'Daire kapısına git', sub: 'Cihangir • 0. Gün, 22:19', target: [14, 19.6] }
      ]
    },
    p2: {
      world: 'ev_gece',
      sky: 'night',
      ambience: 'indoor',
      intro: 'intro',
      triggers: { salon: 'aile' },
      interactions: {
        anne: { event: 'anne_gece' },
        ada: { event: 'ada_gece' },
        baba: { event: 'baba_gece', doneFlag: 'p2_silah', repeat: ['BABAM', 'Kapıyı dinle. Sadece dinle.'] },
        mum: { doc: 'p2c', flag: 'read_p2c' },
        sigorta: { event: 'sigorta', doneFlag: 'p2_sigorta', repeat: ['SEN', 'Şehirde elektrik yok. Sigorta değil.'] },
        kapi_ses: { event: 'kapi_ses', doneFlag: 'p2_kapi', repeat: ['SEN', 'Koridor hâlâ sessiz. Ama... nefes gibi.'] },
        pencere: { event: 'pencere_gece' },
        pencere2: { event: 'balkon', require: (g) => !!g.flags.p2_kapi, gateText: 'Önce koridordaki sesi kontrol et.' },
        telefon: { event: 'telefon_gece' },
        buzdolabi: { doc: 'p1b', flag: 'read_doc_p1b' },
        aile_foto: { doc: 'p1', flag: 'read_doc_p1' },
        ev_exit: {
          event: 'son',
          require: (g) => !!g.flags.p2_balkon && g.zombies.every(z => z.dead),
          gateText: 'Önce dairedeki sesi temizle.'
        }
      },
      objective: { text: 'Salona git', sub: 'Cihangir • 0. Gün, 23:14', target: [7, 6] },
      objectives: [
        { when: (g) => !!g.flags.p2_salon, text: 'Koridordaki sesi kontrol et', sub: 'Cihangir • 0. Gün, 23:19', target: [14, 16.2] },
        { when: (g) => !!g.flags.p2_kapi, text: 'Balkon kapısını kontrol et', sub: 'Cihangir • 0. Gün, 23:31', target: [7.6, 8.5] },
        { when: (g) => !!g.flags.p2_balkon && g.zombies.some(z => !z.dead), text: 'Daireyi temizle', sub: 'Cihangir • 0. Gün, 23:41', target: [7, 6] },
        { when: (g) => !!g.flags.p2_balkon && g.zombies.every(z => z.dead), text: 'Annene ve Ada\'ya dön', sub: 'Cihangir • 0. Gün, 23:52', target: [5.4, 6.4] }
      ]
    },
    p3: {
      world: 'ev2',
      sky: 'dawn',
      ambience: 'indoor',
      intro: 'intro',
      introShot: 'stair',
      triggers: { salon: 'salon' },
      interactions: {
        anne: { event: 'anne2' },
        ada: { event: 'ada2' },
        baba_ceket: { doc: 'p2b', flag: 'read_doc_p2b' },
        telefon: { event: 'telefon2' },
        buzdolabi: { doc: 'p1b', flag: 'read_doc_p1b' },
        ev_exit: {
          event: 'cikis2',
          require: (g) => !!g.flags.p3_salon && g.zombies.every(z => z.dead),
          gateText: 'Önce dairedeki sesi temizle.'
        }
      },
      objective: { text: 'Salona git', sub: 'Cihangir • 1. Gün, 06:44', target: [7, 6] },
      objectives: [
        { when: (g) => !!g.flags.p3_salon, text: 'Daireyi temizle', sub: 'Cihangir • 1. Gün, 06:52', target: [13.8, 18.4] }
      ]
    },
    p4: {
      world: 'mahalle',
      sky: 'dawn',
      ambience: 'street',
      intro: 'intro',
      introShot: 'street',
      triggers: {
        mah_cikis: 'cikis',
        mah_cadde: 'cadde',
        mah_eczane: 'eczane'
      },
      interactions: {
        mah_apartman_doc: { doc: 'p2', flag: 'read_doc_p2' },
        mah_meds: {
          event: 'ilac', doneFlag: 'p3_meds',
          require: (g) => { const d = g.world.doors.get('mah_pharmacy'); return !!(d && d.open); },
          gateText: 'Eczanenin kapısı kapalı.'
        },
        mah_radio: { event: 'radyo', doneFlag: 'heard_leyla' },
        mah_supplies: { event: 'erzak', doneFlag: 'p3_erzak' },
        mah_minibus: { event: 'minibus', require: (g) => !!g.flags.p3_ilac, gateText: 'Önce eczaneden ilacı al.' }
      },
      objective: { text: 'Eczaneye ulaş', sub: 'Cihangir • 1. Gün, 08:05', target: [27, 27] },
      objectives: [
        { when: (g) => !!g.flags.p3_ilac, text: 'Camii avlusundaki minibüse ulaş', sub: 'Cihangir • 1. Gün, 08:31', target: [29.6, 47.4] }
      ]
    },
    p5: {
      world: 'sahil',
      sky: 'dawn',
      ambience: 'street',
      intro: 'intro',
      introShot: 'coast',
      triggers: { sahil_start: 'varis', sahil_gate_t: 'kapi', sahil_end: 'son' },
      interactions: {
        sahil_doc: { doc: 'p4', flag: 'read_doc_p4' },
        sahil_boat: { event: 'tekne' }
      },
      objective: { text: 'Karantina kapısına ulaş', sub: 'Sahil yolu • 1. Gün, 17:52', target: [49, 34] },
      objectives: [
        { when: (g) => !!g.flags.p4_kapi, text: 'Rıhtıma yürü', sub: 'Sahil yolu • 1. Gün, 18:26', target: [56, 37] }
      ]
    },
    ch1: {
      world: 'karakoy',
      ambience: 'street',
      intro: 'intro',
      arriveEvents: {},
      triggers: {
        square_arrive: 'square',
        avenue_arrive: 'avenue',
        tower_approach: 'tower_approach'
      },
      interactions: {
        emre: { event: 'emre', doneFlag: 'met_emre', repeat: ['EMRE', 'Sen hâlâ burada mısın? Git. Kule bekliyor.'] },
        note1: { doc: 'ch1', flag: 'read_doc_ch1' },
        ch1_doc: { doc: 'ch1', flag: 'read_doc_ch1' },
        cafe_photo: { doc: 'ch1b', flag: 'read_doc_ch1b' },
        radio1: { event: 'radio' },
        tower: { event: 'finale' }
      },
      objective: { text: 'Karaköy Meydanı\'na ulaş', sub: 'Karaköy • 22:47', target: [36, 57] }
    },
    ch2: {
      world: 'galata',
      ambience: 'street',
      intro: 'intro',
      triggers: {
        ch2_intro: 'arrive',
        ch2_bank: 'bank'
      },
      interactions: {
        deniz: { event: 'deniz', doneFlag: 'met_deniz', repeat: ['DENİZ', 'Ben iyiyim. Sen... kuleye gidiyor musun?'] },
        safe: { event: 'safe', doneFlag: 'opened_safe' },
        vial: { event: 'vault', doneFlag: 'took_vial', require: (g) => g.world.doors.get('vault_ch2').open },
        manager_note: { doc: 'ch2', flag: 'read_doc_ch2' },
        radio2: { event: 'radio' },
        boat2: { event: 'finale', require: (g) => !!g.flags.vial, doneFlag: 'boat_taken', gate: 'vial' }
      },
      objective: { text: 'Bankalar Hanı\'na ulaş', sub: 'Galata • 01:12', target: [13, 46] },
      objectives: [
        { when: (g) => !!g.flags.opened_safe || !!g.flags.bank_key, text: 'Kasa dairesini aç', sub: 'Bankalar Hanı • 01:52', target: [11, 42] },
        { when: (g) => g.world && g.world.doors.get('vault_ch2') && g.world.doors.get('vault_ch2').open, text: 'Kasa dairesindeki flakonu al', sub: 'Bankalar Hanı • 02:05', target: [11.4, 40.6] },
        { when: (g) => !!g.flags.vial, text: 'Karaköy Rıhtımı\'na dön', sub: 'Galata • 03:10', target: [32, 57] }
      ]
    },
    ch3: {
      world: 'kizkulesi',
      ambience: 'red',
      intro: 'intro',
      triggers: {
        ch3_intro: 'arrive',
        boss_trigger: 'boss'
      },
      interactions: {
        final_radio: { event: 'final', require: (g) => !g.bossFight && !g.boss }
      },
      objective: { text: 'Kule kapısına ulaş', sub: 'Kız Kulesi • 04:05', target: [27, 28.5] }
    }
  };

  /* ============================================================
     INIT
     ============================================================ */
  G.init = function () {
    TEX.init();
    SPR.init();
    if (global.CINE) CINE.init();
    RAY.init();

    G.view = document.getElementById('view');
    G.vctx = G.view.getContext('2d', { alpha: false });
    RAY.resize(window.innerWidth, window.innerHeight, G.settings.quality);
    G.resize();

    // grain overlay
    const grain = document.createElement('div');
    grain.id = 'game-grain';
    grain.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:21;opacity:.16;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.5\'/%3E%3C/svg%3E")';
    document.getElementById('app').appendChild(grain);

    G.touch.active = U.isTouch();

    G.bindUI();
    G.bindInput();
    G.updateMenuState();
    TitleScreen.start();
    AUD.setMuted(AUD.muted);
    const sndBtn = document.getElementById('btn-sound');
    if (sndBtn) sndBtn.classList.toggle('muted', AUD.muted);

    if (U.isTouch()) {
      document.getElementById('touch-controls').classList.remove('hidden');
      document.getElementById('touch-controls').style.display = 'none';
      if (window.innerWidth < window.innerHeight) document.getElementById('rotate-hint').classList.remove('hidden');
      window.addEventListener('orientationchange', () => {
        document.getElementById('rotate-hint').classList.toggle('hidden', window.innerWidth > window.innerHeight);
      });
    }
    window.addEventListener('resize', G.resize);
    window.addEventListener('blur', () => { if (G.mode === 'play') G.pause(); });
    requestAnimationFrame(G.frame);
  };

  G.refreshSave = function () {
    // ex. compatibility
  };

  G.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    G.view.width = Math.round(w * dpr);
    G.view.height = Math.round(h * dpr);
    G.view.style.width = w + 'px';
    G.view.style.height = h + 'px';
    G.dpr = dpr;
    G.vw = w; G.vh = h;
    const q = U.isTouch() ? Math.min(G.settings.quality, 0.52) : G.settings.quality;
    RAY.resize(w, h, q);
    G.vignette = null;
    TitleScreen.resize();
    if (G.mode === 'map') { ISTMAP.resize(); ISTMAP.show(); }
  };

  /* ============================================================
     UI EVENTS
     ============================================================ */
  G.bindUI = function () {
    const click = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', (e) => { e.preventDefault(); AUD.ui(true); fn(); });
    };
    click('btn-start', () => G.newRun());
    click('btn-continue', () => G.continueRun());
    click('btn-howto', () => { G.showHelp('title'); });
    click('btn-menu-map', () => { G.openMap('title'); });
    click('btn-sound', () => {
      AUD.init();
      const m = AUD.setMuted(!AUD.muted);
      document.getElementById('btn-sound').classList.toggle('muted', m);
      if (!m) { AUD.titleTheme(); }
    });
    click('btn-resume', () => G.resume());
    click('btn-pause-map', () => G.openMap('pause'));
    click('btn-pause-restart', () => { G.closePause(); G.startChapter(G.chapterKey, true); });
    click('btn-pause-help', () => G.showHelp('pause'));
    click('btn-pause-menu', () => G.toTitle());
    click('btn-retry', () => G.retryChapter());
    click('btn-death-menu', () => G.toTitle());
    click('btn-ending-again', () => { G.newRun(); });
    click('btn-ending-menu', () => { G.toTitle(); });
    click('btn-help-close', () => G.closeHelp());
    click('btn-doc-close', () => G.closeDoc());
    click('btn-map-close', () => G.closeMap());
    click('map-zoom-in', () => ISTMAP.zoom(1));
    click('map-zoom-out', () => ISTMAP.zoom(-1));
    click('map-reset', () => ISTMAP.reset());
    click('map-layer-map', () => { ISTMAP.setLayer('map'); G.setMapLayerButtons('map'); });
    click('map-layer-sat', () => { ISTMAP.setLayer('sat'); G.setMapLayerButtons('sat'); });
    click('map-info-close', () => ISTMAP.hideInfo());
    const search = document.getElementById('map-search');
    if (search) {
      search.addEventListener('input', () => {
        const q = search.value.trim();
        if (q.length > 1) {
          const res = ISTMAP.search(q);
          if (res.length) { ISTMAP.selectPlace(res[0].id, false); }
          else { ISTMAP.hideInfo(); }
        }
      });
      search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const ok = ISTMAP.focusSearch(search.value.trim());
          if (!ok) { G.mapToast('Yer bulunamadı'); }
          e.stopPropagation();
        }
      });
    }
    ISTMAP.init(document.getElementById('istanbul-map'));
    const cineNext = document.getElementById('cine-next');
    if (cineNext) cineNext.addEventListener('click', () => DLG.advance());
    const cineScreen = document.getElementById('screen-cinematic');
    if (cineScreen) cineScreen.addEventListener('click', (e) => {
      if (e.target.closest('.cine-choice') || e.target.closest('.cine-next')) return;
      if (DLG.active && !DLG.choiceOpen) DLG.advance();
    });
    const dlgScreen = document.getElementById('screen-dialogue');
    if (dlgScreen) dlgScreen.addEventListener('click', (e) => {
      if (e.target.closest('.dlg-choice')) return;
      if (DLG.active && !DLG.choiceOpen) DLG.advance();
    });
    const chapterScreen = document.getElementById('screen-chapter');
    if (chapterScreen) chapterScreen.addEventListener('click', () => G.skipChapterCard());
    // HUD minimap
    const proto = document.getElementById('screen-death');
    if (proto) proto.addEventListener('click', (e) => e.stopPropagation());
  };

  G.setMapLayerButtons = function (layer) {
    document.getElementById('map-layer-map').classList.toggle('active', layer === 'map');
    document.getElementById('map-layer-sat').classList.toggle('active', layer === 'sat');
  };

  G.mapToast = function (msg) {
    const el = document.getElementById('map-search');
    if (!el) return;
    el.value = msg;
    setTimeout(() => { if (el.value === msg) el.value = ''; }, 1400);
  };

  /* ============================================================
     INPUT
     ============================================================ */
  G.bindInput = function () {
    document.addEventListener('keydown', (e) => {
      const k = e.key;
      G.keys[k.toLowerCase()] = true;
      if (['Tab', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
      if (G.mode === 'cine' || G.mode === 'dialogue') {
        if (k === ' ' || k === 'Enter') { DLG.advance(); return; }
        if (DLG.choiceOpen && /^[1-6]$/.test(k)) {
          const wrap = document.getElementById(G.mode === 'cine' ? 'cine-choices' : 'dlg-choices');
          const btns = wrap ? wrap.querySelectorAll('button') : [];
          const idx = parseInt(k, 10) - 1;
          if (btns[idx]) btns[idx].click();
          return;
        }
        if (k === 'Escape' && G.mode === 'dialogue') { /* no skipping */ }
        return;
      }
      if (G.mode === 'chapter') { if (k === ' ' || k === 'Enter' || k === 'Escape') G.skipChapterCard(); return; }
      if (k === 'Escape') {
        if (G.mode === 'play') G.pause();
        else if (G.mode === 'pause') G.resume();
        else if (G.mode === 'map') G.closeMap();
        else if (G.mode === 'help') G.closeHelp();
        else if (G.mode === 'doc') G.closeDoc();
        return;
      }
      if (G.mode !== 'play') return;
      if (k === 'Tab') { e.preventDefault(); G.openMap('play'); return; }
      if (k === 'e') { G.interact(); return; }
      if (k === 'r') { G.reload(); return; }
      if (k === 'q') { G.swapWeapon(); return; }
      if (k === 'v') { G.melee(); return; }
      if (k === '1') { G.setWeapon('pistol'); return; }
      if (k === '2') { G.setWeapon('shotgun'); return; }
    });
    document.addEventListener('keyup', (e) => { G.keys[e.key.toLowerCase()] = false; });

    const canvas = G.view;
    canvas.addEventListener('mousedown', (e) => {
      if (G.touch.active && !e.pointerType) {
        G.touch.active = false;
        const tcc = document.getElementById('touch-controls');
        if (tcc) tcc.style.display = 'none';
      }
      if (G.mode !== 'play') return;
      if (G.touch.active) return;
      if (!G.locked && !G.noLock) {
        G.requestLock();
        if (!G.noLock) return;
      }
      if (e.button === 0) { G.mouseDown = true; G.fire(); }
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) G.mouseDown = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      G.locked = document.pointerLockElement === G.view;
    });
    document.addEventListener('pointerlockerror', () => {
      G.noLock = true;
      G.locked = false;
      G.toast('Fare kilidi kapalı — ekran kenarına doğru bak');
    });
    document.addEventListener('mousemove', (e) => {
      if (G.mode !== 'play') return;
      if (G.locked) {
        G.player.a += (e.movementX || 0) * G.settings.sens;
        G.player.pitch = U.clamp(G.player.pitch - (e.movementY || 0) * G.settings.sens * .55, -.16, .16);
      } else if (!G.noLock && !G.touch.active) {
        // soft-aim before lock
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        G.lookTarget.x = U.clamp((e.clientX - cx) / window.innerWidth * 2, -1, 1);
        G.lookTarget.y = U.clamp((e.clientY - cy) / window.innerHeight * 2, -1, 1);
      }
      if (G.noLock) {
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        G.lookTarget.x = U.clamp((e.clientX - cx) / window.innerWidth * 2, -1, 1);
        G.lookTarget.y = U.clamp((e.clientY - cy) / window.innerHeight * 2, -1, 1);
      }
    });
    window.addEventListener('wheel', (e) => {
      if (G.mode !== 'play') return;
      G.swapWeapon();
    }, { passive: true });

    // touch
    if (U.isTouch() || ('ontouchstart' in window)) G.bindTouch();
  };

  G.requestLock = function () {
    if (!G.view.requestPointerLock) { G.noLock = true; return; }
    try {
      const p = G.view.requestPointerLock({ unadjustedMovement: true });
      if (p && p.catch) p.catch(() => {
        try { G.view.requestPointerLock(); } catch (err) { G.noLock = true; }
      });
    } catch (e) {
      try { G.view.requestPointerLock(); } catch (err) { G.noLock = true; }
    }
  };

  G.bindTouch = function () {
    const stick = document.getElementById('touch-stick');
    const knob = stick ? stick.querySelector('i') : null;
    const look = document.getElementById('touch-look');
    const fireBtn = document.getElementById('touch-fire');
    const useBtn = document.getElementById('touch-use');
    const swapBtn = document.getElementById('touch-swap');
    if (!stick || !look) return;
    const T = G.touch;
    const enableTouch = () => {
      if (T.active) return;
      T.active = true;
      const tc = document.getElementById('touch-controls');
      if (tc) tc.style.display = 'block';
    };
    ['touchstart', 'touchmove'].forEach((ev) => {
      stick.addEventListener(ev, enableTouch, { passive: true });
      look.addEventListener(ev, enableTouch, { passive: true });
      fireBtn && fireBtn.addEventListener(ev, enableTouch, { passive: true });
    });
    stick.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      T.stickId = t.identifier;
      const r = stick.getBoundingClientRect();
      T.stickOX = r.left + r.width / 2; T.stickOY = r.top + r.height / 2;
      e.preventDefault();
    }, { passive: false });
    stick.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== T.stickId) continue;
        let dx = (t.clientX - T.stickOX) / 52, dy = (t.clientY - T.stickOY) / 52;
        const len = Math.hypot(dx, dy);
        if (len > 1) { dx /= len; dy /= len; }
        T.moveX = dx; T.moveY = dy;
        if (knob) knob.style.transform = `translate(${dx * 34}px,${dy * 34}px)`;
      }
      e.preventDefault();
    }, { passive: false });
    const endStick = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== T.stickId) continue;
        T.stickId = null; T.moveX = 0; T.moveY = 0;
        if (knob) knob.style.transform = 'none';
      }
    };
    stick.addEventListener('touchend', endStick);
    stick.addEventListener('touchcancel', endStick);
    look.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      T.lookId = t.identifier; T.lookX = t.clientX; T.lookY = t.clientY;
      e.preventDefault();
    }, { passive: false });
    look.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== T.lookId) continue;
        const dx = t.clientX - T.lookX, dy = t.clientY - T.lookY;
        T.lookX = t.clientX; T.lookY = t.clientY;
        if (G.mode === 'play') {
          G.player.a += dx * 0.006;
          G.player.pitch = U.clamp(G.player.pitch - dy * 0.0035, -.16, .16);
        }
      }
      e.preventDefault();
    }, { passive: false });
    const endLook = (e) => { for (const t of e.changedTouches) if (t.identifier === T.lookId) T.lookId = null; };
    look.addEventListener('touchend', endLook);
    look.addEventListener('touchcancel', endLook);
    fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); G.mouseDown = true; G.fire(); }, { passive: false });
    fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); G.mouseDown = false; });
    useBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (G.mode === 'play') G.interact(); else if (DLG.active) DLG.advance(); }, { passive: false });
    swapBtn.addEventListener('touchstart', (e) => { e.preventDefault(); G.swapWeapon(); }, { passive: false });
  };

  /* ============================================================
     FLOW / SCREENS
     ============================================================ */
  G.updateMenuState = function () {
    const save = U.store.get(G.saveKey, null);
    const cont = document.getElementById('btn-continue');
    const sub = document.getElementById('continue-sub');
    if (save && save.chapter) {
      if (cont) cont.disabled = false;
      if (sub) sub.textContent = 'Bölüm ' + (save.chapterIndex + 1) + ' · ' + (save.chapterTitle || '');
    } else {
      if (cont) cont.disabled = true;
      if (sub) sub.textContent = 'Kayıt bulunamadı';
    }
    const endings = U.store.get(G.endingsKey, []);
    const ec = document.getElementById('ending-count');
    if (ec) ec.textContent = 'SONLAR ' + endings.length + '/4';
  };

  G.newRun = function () {
    AUD.init();
    AUD.stopMusic();
    G.flags = {};
    G.stats = { kills: 0, shots: 0, hits: 0, headshots: 0, damageTaken: 0, zombiesKilled: 0 };
    G.weapons = {
      pistol: { name: 'TABANCA', mag: 12, magSize: 12, reserve: 48, damage: 34, rate: 0.24, spread: 0.045, range: 24, pellets: 1, auto: false, cooldown: 0 },
      shotgun: { name: 'POMPALI', mag: 6, magSize: 6, reserve: 18, damage: 22, rate: 0.78, spread: 0.16, range: 14, pellets: 6, auto: false, cooldown: 0, owned: false }
    };
    G.weapon = 'pistol';
    G.charm = false;
    G.player.hp = 100;
    G.player.stamina = 100;
    G.player.pitch = 0;
    G.deathCount = 0;
    G.started = true;
    Screens.closeAll();
    Screens.showHud(false);
    TitleScreen.stop();
    G.mode = 'cine';
    DLG.start(STORY.opening, {
      cinematic: true,
      shot: 'bogaz',
      title: 'KARANLIK BOĞAZ',
      kicker: 'CİHANGİR — 0. GÜN, 20:55',
      onEnd: () => {
        G.startChapter('p1');
      }
    });
  };

  G.SAVE_VERSION = 3;

  G.continueRun = function () {
    const save = U.store.get(G.saveKey, null);
    if (!save) { G.toast('Kayıt bulunamadı'); return; }
    if (save.v !== G.SAVE_VERSION || !CHAPTERS.includes(save.chapter)) {
      // eski sürümden kalan kayıt: hikâye baştan kuruldu
      U.store.del(G.saveKey);
      G.toast('Eski kayıt sürümü — yeni hikâye başlatılıyor');
      G.newRun();
      return;
    }
    AUD.init();
    AUD.stopMusic();
    G.flags = save.flags || {};
    G.stats = save.stats || G.stats;
    G.weapons = save.weapons || G.weapons;
    G.charm = !!save.charm;
    G.weapon = save.weapon || 'pistol';
    G.player.hp = save.hp || 100;
    G.chapterIndex = save.chapterIndex || 0;
    G.started = true;
    Screens.closeAll();
    Screens.showHud(false);
    TitleScreen.stop();
    G.startChapter(save.chapter || 'p1');
  };

  G.save = function () {
    if (!G.started) return;
    const cfg = FLOW[G.chapterKey] || {};
    U.store.set(G.saveKey, {
      v: G.SAVE_VERSION,
      chapter: G.chapterKey,
      chapterIndex: G.chapterIndex,
      chapterTitle: (STORY[G.chapterKey] && STORY[G.chapterKey].title) || '',
      flags: G.flags,
      stats: G.stats,
      hp: Math.max(25, Math.round(G.player.hp)),
      weapons: G.weapons,
      weapon: G.weapon,
      charm: G.charm,
      date: Date.now()
    });
    G.updateMenuState();
  };

  G.startChapter = function (key, restart) {
    G.chapterKey = key;
    G.chapterIndex = CHAPTERS.indexOf(key);
    const cfg = FLOW[key];
    const story = STORY[key];
    if (!cfg || !story) { console.warn('missing chapter', key); return; }

    DLG.stop();
    Screens.closeAll();
    Screens.showHud(false);
    G.boss = null;
    G.bossFight = false;
    G.eventsFired = {};
    G.zombies = [];
    G.particles = [];
    G.reloading = 0;
    G.muzzle = 0;
    G.recoil = 0;
    G.meleeCd = 0;
    G.meleeSwing = 0;
    G.emptyHinted = false;
    G.movementPaused = false;
    G.forcedObjective = null;

    // chapter card
    G.mode = 'chapter';
    const card = {
      kicker: document.getElementById('ch-kicker'),
      title: document.getElementById('ch-title'),
      sub: document.getElementById('ch-sub'),
      obj: document.getElementById('ch-objective')
    };
    if (card.kicker) card.kicker.textContent = story.number;
    if (card.title) card.title.textContent = story.title;
    if (card.sub) card.sub.textContent = story.subtitle;
    if (card.obj) card.obj.textContent = story.objective;
    Screens.open('screen-chapter');
    if (G.audioAmbience !== cfg.ambience) {
      G.audioAmbience = cfg.ambience;
      AUD.ambience(cfg.ambience);
    }
    G.loadWorld(cfg.world);
    if (cfg.start) {
      G.player.x = cfg.start.x;
      G.player.y = cfg.start.y;
      G.player.a = cfg.start.a === undefined ? G.player.a : cfg.start.a;
    }
    G.setObjective(story.objective, story.objectiveSub, ...((cfg.objective && cfg.objective.target) || []));
    G.chapterCardTimer = 2.6;
    G.chapterCardPending = true;
    G.previewSpawnZombies();

    if (restart) {
      G.player.hp = Math.max(G.player.hp, G.player.maxHp * 0.75);
      G.player.stamina = 100;
    } else {
      G.player.hp = Math.min(G.player.maxHp, G.player.hp);
    }
    G.save();
    G.updateMenuState();
  };

  G.skipChapterCard = function () {
    if (G.mode !== 'chapter' || !G.chapterCardPending) return;
    G.chapterCardPending = false;
    Screens.close('screen-chapter');
    G.playChapterIntro();
  };

  G.playChapterIntro = function () {
    const cfg = FLOW[G.chapterKey];
    const story = STORY[G.chapterKey];
    const nodes = story.intro || [];
    G.mode = cfg.introCinematic ? 'cine' : 'dialogue';
    DLG.start(nodes, {
      cinematic: !!cfg.introCinematic,
      shot: cfg.introShot || cfg.introVisual || null,
      title: story.title,
      kicker: story.objectiveSub,
      onEnd: () => {
        G.backToPlay();
        G.showSubtitle(story.objectiveSub || '', 2.2);
      }
    });
    // audio cue
    AUD.radio(1.2);
  };

  G.loadWorld = function (key) {
    G.world = WORLD.build(key);
    G.worldKey = key;
    G.player.x = G.world.start.x;
    G.player.y = G.world.start.y;
    G.player.a = G.world.start.a;
    G.player.pitch = 0;
    G.player.bob = 0;
    G.player.bobPhase = 0;
    G.zombies = [];
    G.npcs = [];
    G.pickups = [];
    for (const p of G.world.props) {
      if (p.pickup) {
        G.pickups.push(p);
      }
    }
    G.spawnZombies();
    // NPCs
    const NPC_DEF = {
      emre: { a: Math.PI * .5, h: 1.85 },
      deniz: { a: -Math.PI * .5, h: 1.15 },
      anne: { a: Math.PI, h: 1.64 },
      baba: { a: -Math.PI * .5, h: 1.82 },
      ada: { a: Math.PI * .5, h: 1.58 },
      komsu: { a: Math.PI, h: 1.8 }
    };
    for (const it of G.world.interactables) {
      const def = NPC_DEF[it.type];
      if (!def) continue;
      G.npcs.push({
        type: 'npc', kind: it.type, x: it.x, y: it.y, a: def.a,
        active: !!it.active, sprSet: it.type, worldH: def.h
      });
    }
    // ensure doors default state
    for (const d of G.world.doors.values()) {
      if (d.locked && G.flags[d.need]) d.locked = false;
    }
    // activate boat if vial already in inventory (continue/restart)
    if (G.flags.vial) {
      const boat = G.world.interactables.find(i => i.type === 'boat');
      if (boat) boat.active = true;
    }
    G.hudCache = {};
    G.minimapBg = null;
    G.updateMinimapStatic();
  };

  // nudge a spawn point out of walls/cars/crates so nobody starts wedged
  G.freeSpot = function (x, y, r) {
    const w = G.world;
    r = r || .34;
    const bad = (px, py) => w.touchesSolid(px, py, r) ||
      w.props.some(p => p.collide && !p.hidden && U.dist2(px, py, p.x, p.y) < (p.radius + r) ** 2);
    if (!bad(x, y)) return { x, y };
    for (let rad = .7; rad <= 7; rad += .7) {
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * 6.2832 + rad;
        const nx = x + Math.cos(a) * rad, ny = y + Math.sin(a) * rad;
        if (!bad(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x, y };
  };

  G.spawnZombies = function () {
    G.zombies = [];
    for (const s of G.world.spawns) {
      if (s.dead) continue;
      const spot = G.freeSpot(s.x, s.y, s.type === 'brute' ? .5 : s.type === 'boss' ? .8 : .34);
      const z = G.makeZombie(s.type || 'walker', spot.x, spot.y, { dormant: true });
      if (z) G.zombies.push(z);
    }
    // remove zombies overlapping the player
    for (const z of G.zombies) {
      if (U.dist(z.x, z.y, G.player.x, G.player.y) < 4) z.dormant = true;
    }
  };

  G.spawnAt = function (type, x, y) {
    const spot = G.freeSpot(x, y, type === 'brute' ? .5 : .34);
    const z = G.makeZombie(type, spot.x, spot.y, { dormant: false });
    if (z) G.zombies.push(z);
    return z || null;
  };

  G.previewSpawnZombies = function () {
    // nothing: zombies are created in loadWorld
  };

  G.makeZombie = function (type, x, y, opts = {}) {
    const cfg = {
      walker: { hp: 60, speed: 0.95, dmg: 9, range: 1.0, cd: 1.15, scale: 1, worldH: 1.95, radius: .34, points: 1 },
      runner: { hp: 42, speed: 1.95, dmg: 7, range: .95, cd: .9, scale: .95, worldH: 1.82, radius: .3, points: 1 },
      brute: { hp: 210, speed: .62, dmg: 22, range: 1.25, cd: 1.6, scale: 1, worldH: 2.4, radius: .48, points: 3 },
      boss: { hp: 1300, speed: .78, dmg: 26, range: 1.7, cd: 1.2, scale: 1, worldH: 3.4, radius: .8, points: 20 }
    }[type];
    if (!cfg) return null;
    return Object.assign({
      type, x, y, a: Math.random() * 6.28, hp: cfg.hp, maxHp: cfg.hp,
      speed: cfg.speed, dmg: cfg.dmg, range: cfg.range, cd: 0, cdMax: cfg.cd,
      scale: cfg.scale, worldH: cfg.worldH, radius: cfg.radius,
      state: 'idle', animT: Math.random() * 4, flash: 0, dead: false, deadT: 0,
      dormant: opts.dormant !== undefined ? opts.dormant : true, growl: Math.random() * 5,
      stagger: 0, wanderA: Math.random() * 6.28, wanderT: 0, alertT: 0, lunge: 0
    }, opts);
  };

  G.backToPlay = function () {
    DLG.stop();
    Screens.showHud(true);
    G.mode = 'play';
    G.paused = false;
    const tc = document.getElementById('touch-controls');
    if (tc && U.isTouch()) tc.style.display = 'block';
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('hidden');
    G.noLock = G.noLock || false;
    if (!G.touch.active && !G.locked && !G.noLock) {
      // don't force lock; soft aim until click
    }
  };

  G.pause = function () {
    if (G.mode !== 'play') return;
    G.mode = 'pause';
    Screens.open('screen-pause');
    G.renderPause();
    if (document.pointerLockElement) document.exitPointerLock();
    const tc = document.getElementById('touch-controls');
    if (tc) tc.style.display = 'none';
    AUD.ui(false);
  };

  G.closePause = function () {
    Screens.close('screen-pause');
    G.mode = 'play';
    const tc = document.getElementById('touch-controls');
    if (tc && U.isTouch()) tc.style.display = 'block';
  };
  G.resume = function () {
    G.closePause();
    AUD.ui(true);
  };

  G.renderPause = function () {
    const flagsEl = document.getElementById('pause-flags');
    if (flagsEl) {
      const items = [];
      if (G.flags.motiveText) items.push(['⌁', 'Motivasyon: ' + G.flags.motiveText]);
      if (G.flags.radio_answer) items.push(['⌁', 'Leyla ile iletişim kuruldu']);
      if (G.flags.emre_help) items.push(['⌁', 'Emre kurtarıldı']);
      if (G.flags.emre_robbed) items.push(['⌁', 'Emre\'nin mermileri alındı']);
      if (G.flags.deniz_safe) items.push(['⌁', 'Deniz bankoda güvende']);
      if (G.flags.deniz_follow) items.push(['⌁', 'Deniz yanında']);
      if (G.flags.deniz_ignored) items.push(['⌁', 'Deniz geride bırakıldı']);
      if (G.flags.vial) items.push(['⌁', 'Panzehir flakonu alındı']);
      if (G.flags.vial_red) items.push(['⌁', 'Kırmızı flakon alındı']);
      if (G.flags.took_blue) items.push(['⌁', 'Mavi flakon seçildi']);
      if (G.flags.defy) items.push(['⌁', 'Kızıl Ana\'ya direnildi']);
      if (G.flags.bargained) items.push(['⌁', 'Kızıl Ana ile pazarlık yapıldı']);
      if (G.flags.deniz_boat) items.push(['⌁', 'Deniz de teknede']);
      if (G.flags.entered_tower) items.push(['⌁', 'Kuleye girildi']);
      if (!items.length) items.push(['⌁', 'Henüz bir seçim yapmadın.']);
      flagsEl.innerHTML = items.map(([i, t]) => `<div class="flag"><i>${i}</i><span>${t}</span></div>`).join('');
    }
    const statsEl = document.getElementById('pause-stats');
    if (statsEl) {
      const acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0;
      statsEl.innerHTML = `
        <span>Öldürülen: <b>${G.stats.zombiesKilled}</b></span>
        <span>İsabet: <b>${acc}%</b></span>
        <span>Atış: <b>${G.stats.shots}</b></span>
        <span>Hasar: <b>${Math.round(G.stats.damageTaken)}</b></span>
        <span>Güven: <b>${(G.flags.trust || 0) >= 0 ? '+' : ''}${G.flags.trust || 0}</b></span>
        <span>Bölüm: <b>${G.chapterIndex + 1}/3</b></span>`;
    }
  };

  G.toTitle = function () {
    G.mode = 'title';
    DLG.stop();
    Screens.closeAll();
    Screens.showHud(false);
    Screens.open('title-screen');
    document.getElementById('title-screen').classList.add('active');
    TitleScreen.start();
    AUD.stopAmbient();
    AUD.titleTheme();
    if (document.pointerLockElement) document.exitPointerLock();
    const tc = document.getElementById('touch-controls');
    if (tc) tc.style.display = 'none';
    G.updateMenuState();
  };

  G.showHelp = function (from) {
    G.helpReturn = from || G.mode;
    G.prevMode = G.mode;
    G.mode = 'help';
    Screens.open('screen-help');
    if (document.pointerLockElement) document.exitPointerLock();
  };
  G.closeHelp = function () {
    Screens.close('screen-help');
    if (G.helpReturn === 'pause') { G.mode = 'pause'; Screens.open('screen-pause'); }
    else if (G.helpReturn === 'play') { G.mode = 'play'; }
    else { G.mode = 'title'; Screens.open('title-screen'); }
  };

  G.openMap = function (from) {
    G.mapReturn = from;
    G.prevMode = G.mode;
    G.mode = 'map';
    Screens.open('screen-map');
    const cfg = FLOW[G.chapterKey];
    ISTMAP.setChapter(G.chapterKey);
    const label = document.getElementById('map-chapter-label');
    if (label) label.textContent = STORY[G.chapterKey] ? `${STORY[G.chapterKey].number} — ${STORY[G.chapterKey].title}` : '';
    ISTMAP.show();
    ISTMAP.resize();
    G.setMapLayerButtons('map');
    ISTMAP.frameOn(28.9780, 41.0180, 1.55);
    if (document.pointerLockElement) document.exitPointerLock();
    const result = U.store.get('kb_map_once', false);
    if (!result) {
      U.store.set('kb_map_once', true);
      setTimeout(() => ISTMAP.selectPlace('galata', false), 650);
    }
  };

  G.closeMap = function () {
    ISTMAP.hide();
    Screens.close('screen-map');
    if (G.mapReturn === 'play') { G.mode = 'play'; }
    else if (G.mapReturn === 'pause') { G.mode = 'pause'; Screens.open('screen-pause'); }
    else if (G.mapReturn === 'ending') { G.mode = 'ending'; Screens.open('screen-ending'); }
    else { G.mode = 'title'; Screens.open('title-screen'); TitleScreen.start(); }
    AUD.ui(false);
  };

  G.showDoc = function (key) {
    const doc = STORY.docs[key];
    if (!doc) return;
    G.docReturn = G.mode;
    G.prevMode = G.mode;
    G.mode = 'doc';
    document.getElementById('doc-type').textContent = doc.type;
    document.getElementById('doc-title').textContent = doc.title;
    document.getElementById('doc-body').textContent = doc.body;
    Screens.open('screen-doc');
    if (document.pointerLockElement) document.exitPointerLock();
    AUD.pickup('note');
  };
  G.closeDoc = function () {
    Screens.close('screen-doc');
    G.mode = G.docReturn === 'play' ? 'play' : (G.docReturn || 'play');
    if (G.mode === 'play' && G.touch.active) {
      const tc = document.getElementById('touch-controls');
      if (tc) tc.style.display = 'block';
    }
  };

  G.showChapterCard = function (cb) {
    Screens.open('screen-chapter');
    G.mode = 'chapter';
    G.chapterCardPending = true;
    G.chapterCardTimer = 2.4;
    G.chapterCardCb = cb;
  };

  G.skipChapterCard = function () {
    if (!G.chapterCardPending) return;
    G.chapterCardPending = false;
    Screens.close('screen-chapter');
    const cb = G.chapterCardCb;
    G.chapterCardCb = null;
    if (cb) cb(); else G.playChapterIntro();
  };

  /* ============================================================
     OBJECTIVES / EVENTS
     ============================================================ */
  G.setObjective = function (text, sub, tx, ty) {
    G.objective = { text: text || '', sub: sub || '', target: (tx !== undefined && ty !== undefined) ? { x: tx, y: ty } : null };
    const t = document.getElementById('objective-title');
    const s = document.getElementById('objective-sub');
    if (t) t.textContent = text || '';
    if (s) s.textContent = sub || '';
    const tag = document.getElementById('chapter-tag');
    if (tag && STORY[G.chapterKey]) tag.textContent = STORY[G.chapterKey].number;
    G.objectivePulse = 1;
  };

  G.updateObjectiveCycle = function () {
    const cfg = FLOW[G.chapterKey];
    if (!cfg || !cfg.objectives) return;
    for (let i = cfg.objectives.length - 1; i >= 0; i--) {
      const o = cfg.objectives[i];
      if (o.when(G)) {
        if (G.objective.text !== o.text) {
          G.setObjective(o.text, o.sub, o.target[0], o.target[1]);
          G.toast('Yeni hedef: ' + o.text);
        }
        return;
      }
    }
  };

  G.runEvent = function (id) {
    const chapter = STORY[G.chapterKey];
    if (!chapter || !chapter.events) return false;
    const def = chapter.events[id];
    if (!def) return false;
    if (G.eventsFired[id]) return false;
    G.eventsFired[id] = true;
    const obj = Array.isArray(def) ? { nodes: def } : def;
    const cine = !!obj.cinematic;
    G.mode = cine ? 'cine' : 'dialogue';
    DLG.start(obj.nodes, {
      cinematic: cine,
      visual: obj.visual || null,
      title: obj.title || '',
      kicker: obj.kicker || '',
      bg: obj.bg || null,
      onEnd: () => {
        if (typeof obj.onEnd === 'function') return obj.onEnd(G);
        G.backToPlay();
        G.updateObjectiveCycle();
      }
    });
    return true;
  };

  G.runSeq = function (nodes, cinematic, title, kicker, visual) {
    G.mode = cinematic ? 'cine' : 'dialogue';
    DLG.start(nodes, {
      cinematic: !!cinematic, title, kicker, visual: visual || null,
      onEnd: () => G.backToPlay()
    });
  };

  G.checkTriggers = function () {
    const w = G.world;
    if (!w) return;
    for (const t of w.triggers) {
      if (t.fired) continue;
      if (U.dist2(G.player.x, G.player.y, t.x, t.y) < t.r * t.r) {
        t.fired = true;
        const eventId = (FLOW[G.chapterKey].triggers || {})[t.id];
        if (eventId) {
          if (typeof eventId === 'function') eventId(G);
          else G.runEvent(eventId);
        }
      }
    }
  };

  /* ============================================================
     WAVES / BOSS
     ============================================================ */
  G.wave = function (id) {
    const w = G.world;
    if (!w) return;
    if (G.waveCd[id]) return;
    G.waveCd[id] = true;
    AUD.growl(.25, .8);
    G.toast('<b>Kalabalık</b> yaklaşıyor');
    const player = G.player;
    // wake all + activate some nearby extras
    for (const z of G.zombies) {
      if (!z.dead && U.dist(z.x, z.y, player.x, player.y) < 22) z.dormant = false;
    }
    // add a few extra around
    const types = id === 'ch1_tower' ? ['walker', 'runner', 'brute', 'walker', 'runner'] : ['walker', 'walker', 'runner', 'walker'];
    for (const type of types) {
      const ang = Math.random() * 6.28;
      const d = 7 + Math.random() * 5;
      const n = G.world._nearestOpenCell(player.x + Math.cos(ang) * d, player.y + Math.sin(ang) * d, 5);
      if (!n) continue;
      const spot = G.freeSpot(n.x, n.y, type === 'brute' ? .5 : .34);
      const z = G.makeZombie(type, spot.x, spot.y, { dormant: false });
      if (z) G.zombies.push(z);
    }
    G.shake = Math.max(G.shake, 6);
    AUD.alarm();
  };

  G.startBossFight = function () {
    const w = G.world;
    if (!w) return;
    G.bossFight = true;
    const spot = w._nearestOpenCell(27.5, 24.5, 3) || { x: 27.5, y: 24.5 };
    const bossSpot = G.freeSpot(spot.x, spot.y, .8);
    const boss = G.makeZombie('boss', bossSpot.x, bossSpot.y, { dormant: false });
    boss.state = 'chase';
    G.boss = boss;
    G.zombies.push(boss);
    const bar = document.getElementById('boss-bar');
    if (bar) bar.classList.remove('hidden');
    const name = document.getElementById('boss-name');
    if (name) name.textContent = 'KIZIL ANA';
    // wake everything
    for (const z of G.zombies) if (!z.dead) z.dormant = false;
    G.shake = 14;
    AUD.explosion();
    AUD.ambience('red');
    G.setObjective('Kızıl Ana\'yı yen', 'Kız Kulesi • 04:20');
  };

  G.onBossDefeated = function () {
    G.bossFight = false;
    const bar = document.getElementById('boss-bar');
    if (bar) bar.classList.add('hidden');
    const fr = G.world.interactables.find(i => i.id === 'final_radio');
    if (fr) fr.active = true;
    const door = G.world.doors.get('tower3_door');
    if (door) door.open = true;
    G.setObjective('Kulenin tepesindeki telsize ulaş', 'Kız Kulesi • 04:41', fr ? fr.x : 29.6, fr ? fr.y : 24.4);
    AUD.ambience('indoor');
  };

  G.startAlarm = function () {
    AUD.alarm();
    G.shake = Math.max(G.shake, 8);
    for (const z of G.zombies) if (!z.dead) z.dormant = false;
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * 6.28, d = 6 + Math.random() * 6;
      const n = G.world._nearestOpenCell(G.player.x + Math.cos(ang) * d, G.player.y + Math.sin(ang) * d, 5);
      if (!n) continue;
      const z = G.makeZombie(Math.random() < .4 ? 'runner' : 'walker', n.x, n.y, { dormant: false });
      if (z) G.zombies.push(z);
    }
  };

  G.afterVial = function () {
    G.flags.vial = true;
    const boat = G.world.interactables.find(i => i.type === 'boat');
    if (boat) boat.active = true;
    G.setObjective('Karaköy Rıhtımı\'na dön', 'Galata • 03:10', 32, 57);
    // make boat visible via light
    if (G.worldKey === 'galata') {
      G.world.addLight(32.5, 57, 6, 1.4);
      G.world._buildLights();
    }
    G.toast('<b>Panzehir</b> alındı — rıhtıma dön');
    AUD.pickup('charm');
  };

  /* ============================================================
     PLAYER
     ============================================================ */
  G.updatePlayer = function (dt) {
    const p = G.player;
    const k = G.keys;
    let mx = 0, my = 0;
    if (k['w'] || k['arrowup']) my -= 1;
    if (k['s'] || k['arrowdown']) my += 1;
    if (k['a']) mx -= 1;
    if (k['d']) mx += 1;
    if (G.touch.active) { mx += G.touch.moveX; my += G.touch.moveY; }
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }

    const shifting = (k['shift'] || G.touch.active && len > .9);
    const running = shifting && p.stamina > 2 && len > 0.1;
    const speed = (running ? 4.05 : 2.62);
    const bobSpeed = running ? 11 : 7.6;

    // camera-relative movement: forward = (cos a, sin a), right = (-sin a, cos a)
    const ca = Math.cos(p.a), sa = Math.sin(p.a);
    let dx = (-my) * ca - mx * sa;
    let dy = (-my) * sa + mx * ca;
    const dlen = Math.hypot(dx, dy);
    if (dlen > 0.0001) {
      dx /= dlen; dy /= dlen;
      const step = speed * dt;
      G.tryMove(p, dx * step, dy * step, 0.27);
      p.bobPhase += dt * bobSpeed;
      p.bob = Math.sin(p.bobPhase) * (running ? 0.011 : 0.007);
      p.stepT = (p.stepT || 0) + dt * (running ? 2.3 : 1.55);
      if (p.stepT > 1) { p.stepT = 0; AUD.step(running); }
    } else {
      p.bob = U.lerp(p.bob, 0, dt * 6);
      p.bobPhase += dt * 2;
    }
    if (running) p.stamina = Math.max(0, p.stamina - dt * 22);
    else p.stamina = Math.min(100, p.stamina + dt * 17);

    // keyboard turning (also useful when pointer lock is unavailable)
    if (k['arrowleft']) p.a -= 2.1 * dt;
    if (k['arrowright']) p.a += 2.1 * dt;

    // soft aim fallback (no pointer lock)
    if ((!G.locked && !G.touch.active) || G.noLock) {
      const targetA = Math.atan2(G.lookTarget.y * .9, G.lookTarget.x * 1.35) * .55;
      if (Math.abs(G.lookTarget.x) > .08 || Math.abs(G.lookTarget.y) > .08) {
        p.a += targetA * dt * 3.4;
        p.pitch = U.clamp(p.pitch + (-G.lookTarget.y * .10 - p.pitch) * dt * 3.2, -.14, .14);
      }
    }

    // weapon handling
    const wp = G.weapons[G.weapon];
    wp.cooldown -= dt;
    if (G.reloading > 0) {
      G.reloading -= dt;
      if (G.reloading <= 0.0001) { G.reloading = 0; G.finishReload(); }
    }
    if (G.mouseDown && wp.auto && wp.cooldown <= 0) G.fire();

    // muzzle / shake decay
    G.muzzle = Math.max(0, G.muzzle - dt * 8.5);
    G.recoil = Math.max(0, G.recoil - dt * 5);
    G.meleeCd = Math.max(0, (G.meleeCd || 0) - dt);
    G.meleeSwing = Math.max(0, (G.meleeSwing || 0) - dt * 3.4);
    G.shake = Math.max(0, G.shake - dt * 24);
    G.hitFlash = Math.max(0, G.hitFlash - dt * 5);
    G.damageFlash = Math.max(0, G.damageFlash - dt * 2.2);
    G.healFlash = Math.max(0, G.healFlash - dt * 1.6);
    G.objectivePulse = Math.max(0, G.objectivePulse - dt);

    // environment
    const indoor = G.world.indoorAt(p.x, p.y);
    G.indoorView = !!indoor;
  };

  G.tryMove = function (ent, dx, dy, r) {
    const w = G.world;
    let nx = ent.x + dx;
    if (!G.blocked(nx, ent.y, r, ent)) ent.x = nx;
    let ny = ent.y + dy;
    if (!G.blocked(ent.x, ny, r, ent)) ent.y = ny;
  };

  G.blocked = function (x, y, r, ent) {
    const w = G.world;
    if (w.touchesSolid(x, y, r)) return true;
    for (const p of w.props) {
      if (!p.collide || p.hidden) continue;
      if (U.dist2(x, y, p.x, p.y) < (p.radius + r) ** 2) return true;
    }
    for (const n of G.npcs) {
      if (n === ent || !n.active) continue;
      if (U.dist2(x, y, n.x, n.y) < (r + .3) ** 2) return true;
    }
    return false;
  };

  G.heal = function (amount) {
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + amount);
    G.healFlash = 1;
    AUD.pickup('health');
    G.hudCache.hp = null;
  };

  G.giveAmmo = function (amount) {
    for (const key of ['pistol', 'shotgun']) {
      if (key === 'shotgun' && !G.weapons.shotgun.owned) continue;
      G.weapons[key].reserve = Math.min(120, G.weapons[key].reserve + Math.ceil(amount * (key === 'shotgun' ? .3 : 1)));
    }
    AUD.pickup('ammo');
  };

  G.hurt = function (amount, zombie) {
    if (G.mode !== 'play' || G.player.hp <= 0) return;
    let dmg = amount;
    if (G.charm) dmg *= .85;
    if (G.flags.armor) dmg *= .85;
    G.player.hp = Math.max(0, G.player.hp - dmg);
    G.stats.damageTaken += dmg;
    G.damageFlash = 1;
    G.shake = Math.max(G.shake, 7);
    AUD.hurt();
    const v = document.getElementById('damage-vignette');
    if (v) v.style.opacity = Math.min(1, .55 + dmg / 60);
    G.hudCache.hp = null;
    if (G.player.hp <= 0) G.die();
  };

  G.die = function () {
    G.mode = 'death';
    G.mouseDown = false;
    if (document.pointerLockElement) document.exitPointerLock();
    const texts = {
      ch1: 'Karaköy\'ün sokakları bir ismi daha unuttu.',
      ch2: 'Bankalar Caddesi\'nde mermer, kan ve sessizlik.',
      ch3: 'Boğaz, bir kalbi daha sisin altına aldı.'
    };
    const t = document.getElementById('death-text');
    if (t) t.textContent = texts[G.chapterKey] || texts.ch1;
    Screens.open('screen-death');
    Screens.showHud(false);
    AUD.death();
    AUD.stopAmbient();
    G.deathCount++;
    const tc = document.getElementById('touch-controls');
    if (tc) tc.style.display = 'none';
  };

  G.retryChapter = function () {
    Screens.close('screen-death');
    G.player.hp = G.player.maxHp;
    G.player.stamina = 100;
    G.deathCount++;
    const keepFlags = G.flags;
    if (G.chapterKey === 'ch3' && G.deathCount > 1) {
      // on boss retry, give more resources
      G.flags = keepFlags;
    }
    G.startChapter(G.chapterKey, true);
  };

  /* ============================================================
     WEAPONS
     ============================================================ */
  G.setWeapon = function (key) {
    if (!G.weapons[key] || (key === 'shotgun' && !G.weapons.shotgun.owned)) return;
    if (G.weapon === key) return;
    G.weapon = key;
    G.reloading = 0;
    AUD.reload();
    G.hudCache.weapon = null;
    G.hudCache.ammo = null;
  };
  G.swapWeapon = function () {
    if (!G.weapons.shotgun.owned) { G.toast('Pompalı tüfek yok'); return; }
    G.setWeapon(G.weapon === 'pistol' ? 'shotgun' : 'pistol');
  };
  G.reload = function () {
    const wp = G.weapons[G.weapon];
    if (G.reloading > 0 || wp.mag >= wp.magSize || wp.reserve <= 0) return;
    G.reloading = G.weapon === 'shotgun' ? 1.35 : 1.05;
    AUD.reload();
  };
  G.finishReload = function () {
    const wp = G.weapons[G.weapon];
    const need = wp.magSize - wp.mag;
    const take = Math.min(need, wp.reserve);
    wp.mag += take;
    wp.reserve -= take;
    AUD.click();
    G.hudCache.ammo = null;
  };

  G.fire = function () {
    if (G.mode !== 'play') return;
    const wp = G.weapons[G.weapon];
    if (G.reloading > 0 || wp.cooldown > 0) return;
    if (wp.mag <= 0) {
      AUD.empty();
      if (wp.reserve <= 0 && !G.emptyHinted) {
        G.emptyHinted = true;
        G.toast('Cephane bitti — <b>V</b> ile bıçağa davran');
      }
      G.reload();
      return;
    }
    wp.mag--;
    wp.cooldown = wp.rate;
    G.stats.shots++;
    G.muzzle = 1;
    G.recoil = 1;
    G.shake = Math.max(G.shake, G.weapon === 'shotgun' ? 7 : 3.2);
    AUD.shot(G.weapon === 'shotgun' ? 'shotgun' : 'pistol');
    G.hudCache.ammo = null;
    // wake zombies from noise
    for (const z of G.zombies) {
      if (z.dead) continue;
      if (U.dist(z.x, z.y, G.player.x, G.player.y) < 20) z.dormant = false;
    }
    let hitAny = false, head = false;
    const spread = wp.spread * (1 + (G.player.bob || 0) * 4);
    for (let pellet = 0; pellet < wp.pellets; pellet++) {
      const ang = G.player.a + (Math.random() - .5) * spread;
      const target = G.pickTarget(ang, wp.range, pellet === 0 && wp.pellets > 1 ? .11 : .055);
      if (!target) continue;
      const dist = U.dist(G.player.x, G.player.y, target.x, target.y);
      const falloff = U.clamp(1 - dist / (wp.range * 1.25), .25, 1);
      const isHead = Math.random() < (dist < 8 ? .16 : .08);
      const dmg = wp.damage * falloff * (isHead ? 2.1 : 1);
      G.hitZombie(target, dmg, isHead, dist);
      hitAny = true;
      head = head || isHead;
    }
    if (hitAny) {
      G.stats.hits++;
      if (head) G.stats.headshots++;
      G.hitFlash = 1;
      const hm = document.getElementById('hitmarker');
      if (hm) { hm.classList.remove('show'); void hm.offsetWidth; hm.classList.add('show'); }
      AUD.hit(head);
      const cross = document.getElementById('crosshair');
      if (cross) cross.classList.add('hit');
      setTimeout(() => { if (cross) cross.classList.remove('hit'); }, 90);
    }
    if (wp.mag === 0) setTimeout(() => G.reload(), 220);
  };

  G.pickTarget = function (angle, range, tolerance) {
    let best = null, bestDist = Infinity;
    for (const z of G.zombies) {
      if (z.dead) continue;
      const dx = z.x - G.player.x, dy = z.y - G.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range) continue;
      const zAng = Math.atan2(dy, dx);
      const diff = Math.abs(U.normAngle(zAng - angle));
      const hitAng = Math.atan2(z.radius, dist) + tolerance;
      if (diff > hitAng) continue;
      if (dist < bestDist && G.world.lineOfSight(G.player.x, G.player.y, z.x, z.y)) {
        bestDist = dist; best = z;
      }
    }
    return best;
  };

  G.hitZombie = function (z, dmg, head, dist) {
    z.hp -= dmg;
    z.flash = 1;
    z.stagger = .22;
    z.dormant = false;
    z.state = 'chase';
    const dir = Math.atan2(z.y - G.player.y, z.x - G.player.x);
    const heavy = z.kind === 'brute' || z.kind === 'boss' ? .3 : 1;
    const kb = (head ? .085 : .05) * Math.min(1.5, dmg / 32) * heavy;
    const nx = z.x + Math.cos(dir) * kb, ny = z.y + Math.sin(dir) * kb;
    if (!G.world.touchesSolid(nx, ny, z.radius * .7)) { z.x = nx; z.y = ny; }
    G.spawnBlood(z, head);
    if (z.hp <= 0) G.killZombie(z, head);
  };

  G.killZombie = function (z, head) {
    z.dead = true;
    z.deadT = 0;
    z.state = 'dead';
    G.stats.kills++;
    G.stats.zombiesKilled++;
    AUD.growl(.12, .7);
    // blood pool
    const pool = {
      type: 'bloodpool', x: z.x, y: z.y, scale: 1, collide: false,
      radius: 0.4, worldH: 0.28, floorOffset: 0.01, spr: null, lightBoost: .8
    };
    G.decals = G.decals || [];
    G.decals.push(pool);
    if (pool.x) G.dropLoot(z);
    if (z === G.boss) {
      G.boss = null;
      G.flags.bossDefeated = true;
      G.shake = 18;
      G.bossPendingT = 1.5;
      AUD.explosion();
      for (let i = 0; i < 12; i++) G.spawnBlood(z, true);
    }
    G.hudCache.kills = null;
  };

  G.dropLoot = function (z) {
    const r = Math.random();
    let type = null;
    if (z.type === 'brute') type = r < .55 ? 'ammo' : 'medkit';
    else if (z.type === 'runner') type = r < .35 ? 'ammo' : r < .5 ? 'simit' : null;
    else type = r < .22 ? 'simit' : r < .38 ? 'ammo' : null;
    if (!type) return;
    const p = G.world.addProp(type, z.x + (Math.random() - .5) * .3, z.y + (Math.random() - .5) * .3, {
      solid: false, floorOffset: .05, worldH: type === 'medkit' ? .5 : .45
    });
    p.pickup = { type, amount: type === 'ammo' ? 8 : 20, name: type };
    p.bob = true;
    p.loot = true;
    G.pickups.push(p);
  };

  G.spawnBlood = function (z, head) {
    const n = head ? 16 : 9;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = 30 + Math.random() * 190;
      G.particles.push({
        x: G.vw / 2 + (Math.random() - .5) * 16,
        y: G.vh / 2 + (Math.random() - .5) * 16,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: .45 + Math.random() * .45, maxLife: .9,
        size: 1.5 + Math.random() * 3.5,
        color: Math.random() < .6 ? '#8c1614' : '#c4322a'
      });
    }
  };

  G.melee = function () {
    if (G.mode !== 'play') return;
    if ((G.meleeCd || 0) > 0) return;
    G.meleeCd = .58;
    G.meleeSwing = 1;
    G.shake = Math.max(G.shake, 2.4);
    AUD.swing();
    let best = null, bd = Infinity;
    for (const z of G.zombies) {
      if (z.dead) continue;
      const d = U.dist(z.x, z.y, G.player.x, G.player.y);
      if (d > 2.15 + z.radius) continue;
      const ang = Math.atan2(z.y - G.player.y, z.x - G.player.x);
      const diff = Math.abs(U.normAngle(ang - G.player.a));
      if (diff > .95) continue;
      if (!G.world.lineOfSight(G.player.x, G.player.y, z.x, z.y)) continue;
      if (d < bd) { bd = d; best = z; }
    }
    if (!best) return;
    const head = Math.random() < .18;
    G.hitZombie(best, head ? 96 : 54, head, bd);
    G.hitFlash = 1;
    const hm = document.getElementById('hitmarker');
    if (hm) { hm.classList.remove('show'); void hm.offsetWidth; hm.classList.add('show'); }
    AUD.hit(head);
    const cross = document.getElementById('crosshair');
    if (cross) cross.classList.add('hit');
    setTimeout(() => { if (cross) cross.classList.remove('hit'); }, 90);
  };

  /* ============================================================
     INTERACTION
     ============================================================ */
  G.interact = function () {
    if (G.mode !== 'play') { if (DLG.active) DLG.advance(); return; }
    const p = G.player, w = G.world;
    if (p.x === undefined) return;
    const it = w.interactableNear(p.x, p.y, 1.6);
    if (it) {
      G.useInteractable(it);
      return;
    }
    const door = w.doorNear(p.x, p.y, 1.2);
    if (door) { G.useDoor(door); return; }
    return;
  };

  G.useDoor = function (door) {
    if (door.locked) {
      if (door.need && G.flags[door.need]) {
        door.locked = false;
        G.toast('Kilit açıldı: <b>' + door.label + '</b>');
        AUD.door(true);
        door.open = true;
        return;
      }
      G.toast('Kilitli — <b>' + (door.need === 'ch1_note' ? 'anahtar notu' : door.need === 'bank_key' ? 'kasa anahtarı' : 'anahtar') + '</b> gerekli');
      AUD.empty();
      return;
    }
    door.open = !door.open;
    AUD.door(door.open);
    if (door.open && door.id === 'vault_ch2' && !G.flags.vault_opened) {
      G.flags.vault_opened = true;
    }
    const v = document.getElementById('prompt-text');
    if (v) v.textContent = door.label;
  };

  G.useInteractable = function (it) {
    if (!it) return;
    if (it.type === 'note' || it.type === 'doc') {
      G.showDoc(it.data || 'ch1');
      if (it.id === 'note1' && !G.flags.ch1_note) {
        G.flags.ch1_note = true;
        G.toast('Not alındı: <b>kasa anahtarı</b>');
      }
      if (it.once) it.active = false;
      return;
    }
    if (it.type === 'safe') {
      if (G.flags.bank_key || G.flags.opened_safe) {
        G.flags.opened_safe = true;
        G.toast('<b>Duvar kasası</b> açık — kasa anahtarı sende');
        if (!G.flags.bank_key) G.flags.bank_key = true;
        return;
      }
      G.runEvent('safe');
      return;
    }
    if (it.type === 'vial') {
      if (G.flags.vial) { G.toast('Flakon çoktan alındı'); return; }
      G.runEvent('vault');
      return;
    }
    const cfg = (FLOW[G.chapterKey].interactions || {})[it.id];
    if (!cfg) {
      if (it.type === 'boat') { G.toast('Tekne henüz hazır değil — önce flakonu bul'); return; }
      if (it.type === 'tower') { G.runEvent('tower'); return; }
      G.toast(it.label);
      return;
    }
    if (cfg.require && !cfg.require(G)) {
      if (cfg.gateText) G.toast(cfg.gateText);
      else if (it.type === 'boat') G.toast('Henüz değil — önce flakonu bul');
      else if (it.type === 'vial') G.toast('Kasa dairesi kapalı');
      else G.toast('Henüz değil');
      return;
    }
    const doneFlag = cfg.doneFlag;
    if (doneFlag && G.flags[doneFlag]) {
      if (cfg.repeat) {
        G.runSeq([
          { type: 'line', who: cfg.repeat[0], role: '', portrait: it.type === 'emre' ? 'emre' : it.type === 'deniz' ? 'deniz' : null, text: cfg.repeat[1], style: 'say' },
          { type: 'end' }
        ], false);
      } else {
        G.toast(it.label);
      }
      return;
    }
    let eventId = cfg.event;
    if (typeof eventId === 'function') eventId = eventId(G);
    if (eventId) {
      const ok = G.runEvent(eventId);
      if (ok && doneFlag) G.flags[doneFlag] = true;
      if (ok) {
        if (it.id === 'emre') G.flags.met_emre = true;
        if (it.id === 'deniz') G.flags.met_deniz = true;
        if (it.id === 'safe') G.flags.opened_safe = true;
        if (it.id === 'vial') G.flags.took_vial = true;
        if (it.id === 'boat2') G.flags.boat_taken = true;
      }
      return;
    }
    G.toast(it.label);
  };

  /* ============================================================
     UPDATE
     ============================================================ */
  G.frame = function (ts) {
    const dtRaw = (ts - (G.lastFrame || ts)) / 1000;
    G.lastFrame = ts;
    const dt = Math.min(0.05, dtRaw || 0.016);
    G.time += dt;

    if (G.mode === 'chapter') {
      if (G.chapterCardPending) {
        G.chapterCardTimer -= dt;
        if (G.chapterCardTimer <= 0) G.skipChapterCard();
      }
    }

    if (G.mode === 'play') {
      G.update(dt);
    } else if (G.mode === 'pause' || G.mode === 'map' || G.mode === 'help' || G.mode === 'doc' || G.mode === 'death') {
      // keep some animation for background
      G.updateIdle(dt);
    }
    if (DLG.active) DLG.tick(dt);
    if (DLG.active && G.mode === 'cine' && global.CINE) CINE.tick(dt);

    G.render(dt);
    G.updateHud(dt);
    requestAnimationFrame(G.frame);
  };

  G.updateIdle = function (dt) {
    G.shake = Math.max(0, G.shake - dt * 20);
    G.damageFlash = Math.max(0, G.damageFlash - dt * 2);
    G.muzzle = Math.max(0, G.muzzle - dt * 8);
  };

  G.update = function (dt) {
    if (G.bossPendingT > 0) {
      G.bossPendingT -= dt;
      if (G.bossPendingT <= 0) {
        G.bossPendingT = 0;
        G.runEvent('defeated');
      }
    }
    G.updatePlayer(dt);
    G.updateZombies(dt);
    G.updatePickups(dt);
    G.updateParticles(dt);
    G.updateTriggers(dt);
    G.checkTriggers();
    G.updateObjectiveCycle();
    G.updatePrompt();
    if (G.timeOfDay < 24 * 60) G.timeOfDay += dt * 0.12;
    AUD.update(dt, G.world.indoorAt(G.player.x, G.player.y) ? 'indoor' : (G.chapterKey === 'ch3' ? 'red' : 'street'));
    G.autosaveCd -= dt;
    if (G.autosaveCd <= 0) { G.autosaveCd = 25; G.save(); }
  };

  G.updateTriggers = function (dt) {
    // doors unlocked by story flags
    for (const d of G.world.doors.values()) {
      if (d.locked && d.need && G.flags[d.need]) {
        d.locked = false;
        G.toast('Kilit açıldı: <b>' + d.label + '</b>');
      }
    }
    // interactable activation
    for (const it of G.world.interactables) {
      if (it.type === 'finalradio') it.active = !!G.flags.bossDefeated && G.bossPendingT <= 0;
      if (it.type === 'boat') {
        if (G.flags.vial) it.active = true;
      }
    }
  };

  G.updateZombies = function (dt) {
    const p = G.player;
    let activeCount = 0;
    for (const z of G.zombies) {
      if (z.dead) { z.deadT += dt; continue; }
      z.flash = Math.max(0, z.flash - dt * 5);
      z.stagger = Math.max(0, z.stagger - dt);
      z.animT += dt * (z.state === 'chase' ? 1.8 : 1.0);
      const distP = U.dist(z.x, z.y, p.x, p.y);
      // wake logic
      if (z.dormant) {
        if (distP < 11 || (G.stats.shots > 0 && distP < 17)) z.dormant = false;
        else continue;
      }
      activeCount++;
      if (activeCount > 40) continue;
      // boss special
      if (z === G.boss) {
        z.bossT = (z.bossT || 0) + dt;
        if (z.bossT > 6.5) {
          z.bossT = 0;
          const alive = G.zombies.filter(q => !q.dead && q !== z).length;
          if (alive < 12) {
            for (let i = 0; i < 2; i++) {
              const a = Math.random() * 6.28, d = 2.5 + Math.random() * 2.5;
              const n0 = G.world._nearestOpenCell(z.x + Math.cos(a) * d, z.y + Math.sin(a) * d, 3);
              const n = n0 ? G.freeSpot(n0.x, n0.y, .32) : null;
              if (n) {
                const m = G.makeZombie(Math.random() < .5 ? 'runner' : 'walker', n.x, n.y, { dormant: false });
                if (m) G.zombies.push(m);
                G.shake = Math.max(G.shake, 4);
                AUD.growl(.18, .6);
              }
            }
          }
        }
      }
      const canSee = distP < 22 && G.world.lineOfSight(z.x, z.y, p.x, p.y);
      if (canSee && distP < 18) { z.alertT = 2.0; }
      z.alertT = Math.max(0, z.alertT - dt);
      const chasing = z.alertT > 0 || distP < 3.2 || z === G.boss || distP < 9;
      if (chasing && z.state !== 'chase') {
        z.state = 'chase';
        if (Math.random() < .35) AUD.growl(Math.max(.03, .22 - distP * .01), z.type === 'brute' ? .7 : z.type === 'runner' ? 1.3 : 1);
      }
      if (!chasing) z.state = 'idle';
      let tx, ty, speed = z.speed;
      if (z.state === 'chase') {
        if (z.stagger > 0) speed *= .2;
        tx = p.x; ty = p.y;
        z.a = Math.atan2(ty - z.y, tx - z.x);
        const holdRange = z.range * .78;
        if (distP > holdRange) {
          const stepLen = speed * dt;
          const tryStep = (ang) => {
            const nx = z.x + Math.cos(ang) * stepLen;
            const ny = z.y + Math.sin(ang) * stepLen;
            if (G.zombieBlocked(nx, ny, z)) return false;
            z.x = nx; z.y = ny; return true;
          };
          // walk straight at the player, then steer around whatever is in the way
          let moved = tryStep(z.a);
          if (!moved) {
            const side = z.side || (z.side = Math.random() < .5 ? 1 : -1);
            const fan = [.38, .78, 1.18, 1.6, 2.05, 2.5];
            for (const off of fan) {
              if (tryStep(z.a + side * off)) { moved = true; break; }
            }
            if (!moved) {
              const other = -side;
              for (const off of fan) {
                if (tryStep(z.a + other * off)) { z.side = other; moved = true; break; }
              }
            }
            if (moved && z.stuckT > .45) {
              // once we are free again, keep circling the roomier way
              const probe = (sgn) => {
                const ang = z.a + sgn * 1.5708;
                let free = 0;
                for (let d = .6; d <= 2.4; d += .6) {
                  if (!G.zombieBlocked(z.x + Math.cos(ang) * d, z.y + Math.sin(ang) * d, z)) free++;
                }
                return free;
              };
              const l = probe(1), r = probe(-1);
              if (l !== r) z.side = l > r ? 1 : -1;
            }
          }
          if (moved) { z.stuckT = 0; G.separate(z, dt); }
          else z.stuckT = (z.stuckT || 0) + dt;
        }
        z.cd -= dt;
        if (distP < z.range && z.cd <= 0) {
          z.cd = z.cdMax;
          z.lunge = 1;
          G.hurt(z.dmg, z);
          if (z.type === 'boss') G.shake = Math.max(G.shake, 10);
        }
        z.lunge = Math.max(0, (z.lunge || 0) - dt * 4);
      } else {
        z.wanderT -= dt;
        if (z.wanderT <= 0) {
          z.wanderT = 1.8 + Math.random() * 3;
          z.wanderA = Math.random() * 6.28;
        }
        const nx = z.x + Math.cos(z.wanderA) * speed * .28 * dt;
        const ny = z.y + Math.sin(z.wanderA) * speed * .28 * dt;
        if (!G.zombieBlocked(nx, ny, z)) { z.x = nx; z.y = ny; z.a = z.wanderA; }
        else z.wanderT = 0;
      }
      z.growl -= dt;
      if (z.growl <= 0 && distP < 16) {
        z.growl = 5 + Math.random() * 9;
        if (Math.random() < .55) AUD.growl(Math.max(.02, .2 - distP * .008), z.type === 'runner' ? 1.4 : 1);
      }
    }
    // cleanup bodies
    if (G.zombies.length > 60) {
      G.zombies = G.zombies.filter(z => !z.dead || z.deadT < 2);
    }
  };

  G.separate = function (z, dt) {
    let px = 0, py = 0;
    for (const o of G.zombies) {
      if (o === z || o.dead) continue;
      const dx = z.x - o.x, dy = z.y - o.y;
      const d2 = dx * dx + dy * dy;
      const min = (z.radius + o.radius) * 1.05;
      if (d2 < min * min && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        px += dx / d * (min - d);
        py += dy / d * (min - d);
      }
    }
    if (px || py) {
      const nx = z.x + px * 0.5, ny = z.y + py * 0.5;
      if (!G.world.touchesSolid(nx, ny, z.radius * .8)) { z.x = nx; z.y = ny; }
    }
  };

  G.zombieBlocked = function (x, y, z) {
    if (G.world.touchesSolid(x, y, z.radius * .8)) return true;
    for (const pp of G.world.props) {
      if (!pp.collide || pp.hidden) continue;
      if (U.dist2(x, y, pp.x, pp.y) < (pp.radius + z.radius * .8) ** 2) return true;
    }
    return false;
  };

  G.updatePickups = function (dt) {
    const p = G.player;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const pk = G.pickups[i];
      if (pk.taken || pk.hidden) { G.pickups.splice(i, 1); continue; }
      if (U.dist2(p.x, p.y, pk.x, pk.y) < 1.1 * 1.1) {
        G.takePickup(pk);
        G.pickups.splice(i, 1);
      }
    }
    // interactable pickups e.g. vial is handled via interaction
  };

  G.takePickup = function (pk) {
    const data = pk.pickup;
    pk.taken = true;
    if (data.type === 'ammo') {
      const n = data.amount || 10;
      G.giveAmmo(n);
      G.toast('<b>+ ' + n + ' mermi</b>');
    } else if (data.type === 'medkit') {
      G.heal(data.amount || 55);
      G.toast('<b>+ ' + (data.amount || 55) + ' can</b> (medkit)');
    } else if (data.type === 'simit') {
      G.heal(data.amount || 20);
      G.toast('<b>Simit</b> — biraz daha iyi hissediyorsun (+' + (data.amount || 20) + ')');
    } else if (data.type === 'charm') {
      G.charm = true;
      G.toast('<b>Mavi Boncuk</b> — nazar değmesin');
      AUD.pickup('charm');
    } else if (data.type === 'armor') {
      G.flags.armor = true;
      G.toast('<b>Çelik yelek</b> — gelen hasar %15 azalıyor');
      AUD.pickup('charm');
      G.hudCache.hp = null;
    } else if (data.type === 'shotgun') {
      G.weapons.shotgun.owned = true;
      G.weapons.shotgun.mag = G.weapons.shotgun.magSize;
      G.weapons.shotgun.reserve = 12;
      G.toast('<b>Pompalı tüfek</b> alındı — Q ile değiştir');
      AUD.pickup('ammo');
      G.setWeapon('shotgun');
    }
  };

  G.updateParticles = function (dt) {
    for (let i = G.particles.length - 1; i >= 0; i--) {
      const pt = G.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) { G.particles.splice(i, 1); continue; }
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      pt.vy += 620 * dt;
      pt.vx *= 0.98;
    }
  };

  G.updatePrompt = function () {
    const p = G.player;
    const it = G.world.interactableNear(p.x, p.y, 1.6);
    let text = null;
    let door = null;
    if (it) {
      text = it.label;
      if (it.type === 'boat' && !it.active) text = 'Tekne — hazır değil';
    } else {
      door = G.world.doorNear(p.x, p.y, 1.2);
      if (door) text = door.locked ? (door.label + ' — kilitli') : (door.open ? 'Kapat' : 'Aç') + ' · ' + door.label;
    }
    const el = document.getElementById('prompt');
    const tx = document.getElementById('prompt-text');
    if (!el) return;
    if (text && G.mode === 'play') {
      el.classList.remove('hidden');
      if (tx) tx.textContent = text;
    } else {
      el.classList.add('hidden');
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */
  G.buildScene = function () {
    const sprites = [];
    const w = G.world;
    // props
    for (const p of w.props) {
      if (p.hidden) continue;
      let spr = null;
      const set = SPR.props[p.type];
      if (Array.isArray(set)) {
        const idx = Math.floor(G.time * 9 + p.seed) % set.length;
        spr = set[idx];
      } else spr = set;
      if (!spr) continue;
      if (p.type === 'bloodpool') continue;
      sprites.push({
        x: p.x, y: p.y, spr, scale: p.scale || 1,
        worldH: p.worldH || 1.5, floorOffset: p.floorOffset || 0,
        flicker: p.flicker || 0, lightBoost: p.type === 'lamp' || p.type === 'firebarrel' ? 1.15 : 1
      });
    }
    // pickups in world
    for (const pk of G.pickups) {
      if (pk.hidden) continue;
      const spr = SPR.props[pk.pickup.type === 'shotgun' ? 'shotgun' : pk.pickup.type];
      if (!spr) continue;
      const bobY = Math.sin(G.time * 2.2 + pk.seed) * .04;
      sprites.push({
        x: pk.x, y: pk.y, spr, scale: 1, worldH: pk.worldH || .5,
        floorOffset: (pk.floorOffset || .05) + bobY + .06,
        lightBoost: 1.5, flicker: pk.pickup.type === 'charm' ? 1.4 : 0
      });
    }
    // vials / special interactables that aren't props
    if (G.worldKey === 'galata' && !G.flags.vial && w.doors.get('vault_ch2').open) {
      sprites.push({
        x: 10.5, y: 40.5, spr: SPR.props.vial, scale: 1, worldH: .7,
        floorOffset: .4 + Math.sin(G.time * 2) * .03, lightBoost: 1.6, flicker: 1.2
      });
    }
    // NPCs
    for (const n of G.npcs) {
      if (!n.active) continue;
      const spr = SPR.npcs[n.sprSet];
      if (!spr) continue;
      sprites.push({
        x: n.x, y: n.y, spr, scale: 1, worldH: n.worldH || (n.kind === 'deniz' ? 1.15 : 1.85),
        floorOffset: 0, lightBoost: 1.05
      });
    }
    // zombies
    for (const z of G.zombies) {
      let set = SPR.zombies[z.type] || SPR.zombies.walker;
      let frame;
      if (z.dead) frame = 0;
      else if (z.state === 'chase') frame = Math.floor(z.animT * 7) % set.length;
      else frame = Math.floor(z.animT * 2.4) % set.length;
      const spr = set[Math.min(frame, set.length - 1)];
      let alpha = 1;
      if (z.dead) alpha = Math.max(0, 1 - z.deadT / 1.1);
      sprites.push({
        x: z.x, y: z.y, spr, scale: z.scale, worldH: z.worldH,
        floorOffset: z.dead ? z.deadT * .12 : (z.lunge || 0) * .02,
        alpha, flash: z.flash, lightBoost: 1.08
      });
    }
    // blood decals (flat-ish)
    if (G.decals) {
      for (const d of G.decals) {
        sprites.push({
          x: d.x, y: d.y, spr: SPR.props.bloodpool || SPR.props.rubble,
          scale: 1.6, worldH: .35, floorOffset: .02, lightBoost: .7
        });
      }
    }
    // bullets? muzzle light handled in scene
    return sprites;
  };

  G.render = function (dt) {
    const ctx = G.vctx;
    const W = G.vw, H = G.vh;
    if (!W) return;

    if (G.mode === 'title') {
      TitleScreen.render(dt);
      return;
    }
    if (G.mode === 'ending') {
      G.renderEndingBg(dt);
      return;
    }
    if (!G.world) {
      ctx.fillStyle = '#05080b'; ctx.fillRect(0, 0, W, H);
      return;
    }

    const p = G.player;
    const shakeAmt = G.shake;
    const sx = (Math.random() - .5) * shakeAmt * 1.4;
    const sy = (Math.random() - .5) * shakeAmt * 1.4;

    if (G.moonAz === undefined) G.moonAz = G.player.a + 0.55;
    if (G.moonChapter !== G.chapterKey) { G.moonChapter = G.chapterKey; G.moonAz = G.player.a + 0.55; }
    if (!G.skyTex || G.skyMode !== G.chapterKey) {
      G.skyMode = G.chapterKey;
      G.skyTex = TEX.makeSky((FLOW[G.chapterKey] && FLOW[G.chapterKey].sky) || (G.chapterKey === 'ch3' ? 'red' : 'night'));
    }
    const scene = {
      world: G.world,
      player: p,
      sprites: G.buildScene(),
      time: G.time,
      muzzle: G.muzzle,
      tint: [1, 1, 1],
      fog: G.world.fog || (G.indoorView ? 0.085 : 0.072),
      skyTex: G.skyTex,
      noMoon: (FLOW[G.chapterKey] && FLOW[G.chapterKey].sky) === 'dawn',
      moonAz: G.moonAz,
      moonEl: 0.19,
      indoorView: G.indoorView,
      ceilTex: G.world.ceilTex || 'dark',
      lightMul: G.chapterKey === 'ch3' ? 1.05 : 1
    };
    RAY.render(scene);

    // draw scene buffer
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, G.view.width, G.view.height);
    const dpr = G.dpr;
    ctx.save();
    ctx.scale(1, 1);
    const mx = Math.abs(sx), my = Math.abs(sy);
    RAY.blit(ctx, G.view.width + mx * 2, G.view.height + my * 2, -mx + sx, -my + sy, 0);
    ctx.restore();

    // muzzle flash light
    if (G.muzzle > .02) {
      const g = ctx.createRadialGradient(G.view.width * .72, G.view.height * .72, 10, G.view.width * .72, G.view.height * .72, G.view.width * .55);
      g.addColorStop(0, `rgba(255,220,150,${.30 * G.muzzle})`);
      g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, G.view.width, G.view.height);
    }

    // weapon viewmodel
    G.drawWeapon(ctx, W * dpr, H * dpr, dpr);

    // damage / heal vignette
    if (G.damageFlash > 0) {
      const g = ctx.createRadialGradient(G.view.width / 2, G.view.height / 2, G.view.height * .2, G.view.width / 2, G.view.height / 2, G.view.height * .75);
      g.addColorStop(0, 'rgba(120,0,0,0)');
      g.addColorStop(1, `rgba(140,10,5,${.55 * G.damageFlash})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, G.view.width, G.view.height);
    }
    if (G.healFlash > 0) {
      ctx.fillStyle = `rgba(80,220,140,${.10 * G.healFlash})`;
      ctx.fillRect(0, 0, G.view.width, G.view.height);
    }
    // vignette
    if (!G.vignette) {
      const g = ctx.createRadialGradient(G.view.width / 2, G.view.height / 2, G.view.height * .35, G.view.width / 2, G.view.height / 2, G.view.height * .82);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.55)');
      G.vignette = g;
    }
    ctx.fillStyle = G.vignette;
    ctx.fillRect(0, 0, G.view.width, G.view.height);

    // screen-space particles
    if (G.particles.length) {
      ctx.save();
      ctx.scale(dpr, dpr);
      for (const pt of G.particles) {
        const a = U.clamp(pt.life / pt.maxLife, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * a, 0, 6.283); ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // crosshair spread
    const cross = document.getElementById('crosshair');
    if (cross) {
      const spread = 8 + (G.recoil * 18) + (G.player.bob ? 4 : 0);
      cross.style.width = (18 + spread) + 'px';
      cross.style.height = (18 + spread) + 'px';
    }
  };

  G.drawWeapon = function (ctx, W, H, dpr) {
    if (G.mode !== 'play' && G.mode !== 'pause') return;
    if (G.mode === 'pause') return;
    const isShotgun = G.weapon === 'shotgun';
    const bobX = Math.sin(G.player.bobPhase) * 10;
    const bobY = Math.abs(Math.cos(G.player.bobPhase)) * 9;
    const recoil = (G.recoil || 0) * (isShotgun ? 60 : 42);
    const reloading = G.reloading > 0;
    const reloadT = reloading ? Math.sin(Math.min(1, (1 - G.reloading / (isShotgun ? 1.35 : 1.05))) * Math.PI) : 0;
    const baseX = W * (isShotgun ? 0.66 : 0.72);
    const baseY = H + 30 - bobY + recoil * 0.55 + reloadT * 130;
    const scale = Math.min(W, H) / 900;

    ctx.save();
    ctx.translate(baseX + bobX - recoil * .12, baseY);
    ctx.rotate(-0.06 + recoil * 0.006 + reloadT * .18);
    ctx.scale(scale * (isShotgun ? 1.18 : 1), scale * (isShotgun ? 1.18 : 1));

    // arm / sleeve
    ctx.fillStyle = '#2c3330';
    ctx.beginPath();
    ctx.moveTo(-40, 60);
    ctx.lineTo(80, 200);
    ctx.lineTo(20, 230);
    ctx.lineTo(-120, 90);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e2422';
    ctx.beginPath();
    ctx.moveTo(80, 200); ctx.lineTo(20, 230); ctx.lineTo(35, 255); ctx.lineTo(100, 225); ctx.closePath(); ctx.fill();

    // hand
    ctx.fillStyle = '#b8896a';
    ctx.beginPath();
    ctx.ellipse(-26, 58, 30, 24, -0.5, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(-16, 66, 20, 12, -0.4, 0, 6.283); ctx.fill();

    if (isShotgun) {
      // stock
      ctx.fillStyle = '#4a3524';
      ctx.beginPath();
      ctx.moveTo(-150, 40); ctx.lineTo(-30, 60); ctx.lineTo(-10, 96); ctx.lineTo(-130, 90); ctx.closePath(); ctx.fill();
      // body
      ctx.fillStyle = '#2f3336';
      ctx.fillRect(-40, 20, 150, 34);
      ctx.fillStyle = '#1d2022';
      ctx.fillRect(-20, 12, 120, 12);
      // barrel
      ctx.fillStyle = '#3a3f43';
      ctx.fillRect(100, 18, 190, 18);
      ctx.fillStyle = '#22262a';
      ctx.fillRect(100, 32, 190, 7);
      // pump
      ctx.fillStyle = '#5a4230';
      ctx.fillRect(130, 36, 70, 24);
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      for (let i = 0; i < 6; i++) ctx.fillRect(136 + i * 11, 40, 4, 16);
      // shell port
      ctx.fillStyle = '#0e0f10'; ctx.fillRect(-10, 26, 40, 10);
      ctx.fillStyle = '#b3402f'; ctx.fillRect(20, 27, 8, 8);
      // muzzle
      ctx.fillStyle = '#121415'; ctx.fillRect(284, 20, 8, 16);
      if (G.muzzle > .02) {
        const mg = ctx.createRadialGradient(300, 28, 2, 300, 28, 80 * G.muzzle);
        mg.addColorStop(0, `rgba(255,245,200,${G.muzzle})`);
        mg.addColorStop(.3, `rgba(255,170,60,${G.muzzle * .8})`);
        mg.addColorStop(1, 'rgba(255,120,20,0)');
        ctx.fillStyle = mg;
        ctx.beginPath(); ctx.arc(300, 28, 80 * G.muzzle, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(255,235,170,${G.muzzle})`;
        ctx.beginPath();
        ctx.moveTo(292, 20); ctx.lineTo(360 * G.muzzle + 292, 4); ctx.lineTo(300, 28);
        ctx.lineTo(360 * G.muzzle + 292, 52); ctx.lineTo(292, 36); ctx.closePath(); ctx.fill();
      }
    } else {
      // pistol slide
      ctx.fillStyle = '#3c4246';
      ctx.fillRect(-30, 8, 150, 30);
      ctx.fillStyle = '#22272a';
      ctx.fillRect(-30, 32, 150, 8);
      ctx.fillStyle = '#4d5459';
      ctx.fillRect(-10, 10, 110, 5);
      // barrel
      ctx.fillStyle = '#181c1f';
      ctx.fillRect(112, 14, 22, 18);
      // grip
      ctx.fillStyle = '#232628';
      ctx.beginPath();
      ctx.moveTo(-36, 34); ctx.lineTo(6, 38); ctx.lineTo(-4, 108); ctx.lineTo(-52, 92); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.moveTo(-44 + i * 2, 44 + i * 9); ctx.lineTo(-14 + i * 1, 48 + i * 9); ctx.stroke();
      }
      // trigger guard
      ctx.strokeStyle = '#2a2e31'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(20, 54, 18, .1, Math.PI - .3); ctx.stroke();
      // sights
      ctx.fillStyle = '#7f8a8f'; ctx.fillRect(100, 4, 5, 6); ctx.fillRect(-24, 4, 5, 6);
      // hand over grip
      ctx.fillStyle = '#b8896a';
      ctx.beginPath();
      ctx.ellipse(-24, 64, 26, 26, -0.35, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = '#a97c5f';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(-38 + i * 8, 48 + i * 6, 8, 5, -0.5, 0, 6.283);
        ctx.fill();
      }
      // thumb
      ctx.fillStyle = '#c39474';
      ctx.beginPath(); ctx.ellipse(2, 58, 13, 9, -0.2, 0, 6.283); ctx.fill();
      // muzzle
      ctx.fillStyle = '#0e1113'; ctx.fillRect(132, 16, 4, 14);
      if (G.muzzle > .02) {
        const mg = ctx.createRadialGradient(140, 22, 1, 140, 22, 70 * G.muzzle);
        mg.addColorStop(0, `rgba(255,248,210,${G.muzzle})`);
        mg.addColorStop(.35, `rgba(255,180,70,${G.muzzle * .75})`);
        mg.addColorStop(1, 'rgba(255,120,20,0)');
        ctx.fillStyle = mg;
        ctx.beginPath(); ctx.arc(140, 22, 70 * G.muzzle, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(255,240,180,${G.muzzle})`;
        ctx.beginPath();
        ctx.moveTo(134, 14); ctx.lineTo(134 + 70 * G.muzzle, 0); ctx.lineTo(142, 22);
        ctx.lineTo(134 + 70 * G.muzzle, 44); ctx.lineTo(134, 30); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();

    // knife swipe (V)
    if ((G.meleeSwing || 0) > 0) {
      const t = 1 - G.meleeSwing;              // 0 → 1 over the swing
      const arc = Math.sin(Math.min(1, t * 1.35) * Math.PI);
      const kx = W * (.80 - t * .40);
      const ky = H * (.91 - t * .30);
      ctx.save();
      ctx.translate(kx, ky);
      ctx.rotate(-1.35 + t * 1.9);
      ctx.scale(scale * 1.1, scale * 1.1);
      // sleeve
      ctx.fillStyle = '#2b322f';
      ctx.beginPath();
      ctx.moveTo(-30, 220); ctx.lineTo(40, 210); ctx.lineTo(10, 90); ctx.lineTo(-55, 105);
      ctx.closePath(); ctx.fill();
      // fist
      ctx.fillStyle = '#b8896a';
      ctx.beginPath(); ctx.ellipse(-10, 74, 26, 23, -.35, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#a97c5f';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(-22 + i * 10, 52 + i * 7, 7, 5, -.5, 0, 6.283); ctx.fill();
      }
      // blade
      const bg = ctx.createLinearGradient(-10, 40, 40, -120);
      bg.addColorStop(0, '#cfd8dd'); bg.addColorStop(.55, '#95a3ab'); bg.addColorStop(1, '#e8f0f4');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-4, 50); ctx.lineTo(22, 50); ctx.lineTo(52, -196); ctx.lineTo(8, -180);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(20,26,30,.55)'; ctx.lineWidth = 2; ctx.stroke();
      // edge highlight + blood
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(14, -20); ctx.lineTo(38, -180); ctx.stroke();
      if (G.hitFlash > .3) {
        ctx.fillStyle = `rgba(150,24,18,${G.hitFlash * .8})`;
        ctx.beginPath(); ctx.moveTo(18, 28); ctx.lineTo(46, -90); ctx.lineTo(28, 28); ctx.closePath(); ctx.fill();
      }
      // guard
      ctx.fillStyle = '#2c3134';
      ctx.fillRect(-16, 44, 46, 11);
      // motion trail
      ctx.globalAlpha = arc * .35;
      ctx.strokeStyle = '#dfe9ee'; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.arc(0, 80, 250, -1.35 + t * 1.9 - .55, -1.35 + t * 1.9 + .05);
      ctx.stroke();
      ctx.restore();
    }
  };

  /* ============================================================
     HUD
     ============================================================ */
  G.updateHud = function (dt) {
    const hud = document.getElementById('hud');
    if (!hud || hud.classList.contains('hidden')) return;
    const p = G.player;
    const wp = G.weapons[G.weapon];
    // hp
    const hpPct = U.clamp(p.hp / p.maxHp, 0, 1);
    const hpFill = document.getElementById('hp-fill');
    if (hpFill) hpFill.style.transform = `scaleX(${hpPct})`;
    const hpText = document.getElementById('hp-text');
    if (hpText) hpText.textContent = Math.ceil(p.hp);
    const stFill = document.getElementById('stam-fill');
    if (stFill) stFill.style.transform = `scaleX(${U.clamp(p.stamina / 100, 0, 1)})`;
    const armorTag = document.getElementById('armor-tag');
    if (armorTag) armorTag.classList.toggle('hidden', !G.flags.armor);
    const charmTag = document.getElementById('charm-tag');
    if (charmTag) charmTag.classList.toggle('hidden', !G.charm);

    const wname = document.getElementById('weapon-name');
    if (wname) wname.textContent = wp.name + (G.reloading > 0 ? ' · ŞARJÖR' : '');
    const mag = document.getElementById('ammo-mag');
    if (mag) mag.textContent = wp.mag;
    const res = document.getElementById('ammo-reserve');
    if (res) res.textContent = wp.reserve;

    // damage vignette fade
    const dv = document.getElementById('damage-vignette');
    if (dv) dv.style.opacity = Math.max(0, G.damageFlash) * .9;
    const hf = document.getElementById('heal-flash');
    if (hf) hf.style.opacity = Math.max(0, G.healFlash) * .8;
    const rain = document.getElementById('rain-overlay');
    if (rain) rain.style.opacity = (G.chapterKey === 'ch3' || G.indoorView) ? 0 : .55;

    G.hudTimer += dt;
    if (G.hudTimer > .12) {
      G.hudTimer = 0;
      G.drawMinimap();
      const timeTag = document.getElementById('objective-sub');
      // subtle objective pulse
      const obj = document.querySelector('.hud-objective');
      if (obj && G.objectivePulse > 0) obj.style.borderLeftColor = '#f0a93b';
      else if (obj) obj.style.borderLeftColor = '';
      // boss bar
      if (G.boss && !G.boss.dead) {
        const bar = document.getElementById('boss-bar');
        if (bar) bar.classList.remove('hidden');
        const f = document.getElementById('boss-fill');
        if (f) f.style.transform = `scaleX(${U.clamp(G.boss.hp / G.boss.maxHp, 0, 1)})`;
      } else {
        const bar = document.getElementById('boss-bar');
        if (bar && !G.bossFight) bar.classList.add('hidden');
      }
      // minimap labels
      const place = document.getElementById('mm-place');
      if (place) place.textContent = G.worldName || (STORY[G.chapterKey] && STORY[G.chapterKey].title) || '';
      const route = document.getElementById('mm-route');
      const dist = document.getElementById('mm-dist');
      if (route) route.textContent = G.objective.text || '';
      if (dist) {
        if (G.objective.target) {
          const d = U.dist(p.x, p.y, G.objective.target.x, G.objective.target.y);
          dist.textContent = Math.round(d * 4) + ' m';
        } else dist.textContent = '—';
      }
      const comp = document.getElementById('mm-compass');
      if (comp) {
        const dirs = ['D', 'GD', 'G', 'GB', 'B', 'KB', 'K', 'KD'];
        const idx = Math.round(((p.a % U.TAU) + U.TAU) % U.TAU / U.TAU * 8) % 8;
        comp.textContent = dirs[idx];
      }
    }
  };

  G.drawMinimap = function () {
    const cv = document.getElementById('minimap');
    if (!cv || !G.world) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const scale = 3.4;
    const cx = W / 2, cy = H / 2;
    const p = G.player;
    const world = G.world;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, 0, W, H);
    const range = Math.ceil(cx / scale) + 1;
    const px = Math.floor(p.x), py = Math.floor(p.y);
    for (let ty = py - range; ty <= py + range; ty++) {
      for (let tx = px - range; tx <= px + range; tx++) {
        if (tx < 0 || ty < 0 || tx >= world.w || ty >= world.h) continue;
        const sx = cx + (tx - p.x) * scale;
        const sy = cy + (ty - p.y) * scale;
        if (sx < -scale || sy < -scale || sx > W + scale || sy > H + scale) continue;
        const mat = world.mat[ty * world.w + tx];
        const floor = world.floor[ty * world.w + tx];
        if (mat) {
          const door = world.doorTiles.get(ty * world.w + tx);
          ctx.fillStyle = door ? (door.open ? 'rgba(232,196,119,.5)' : 'rgba(232,196,119,.95)') : 'rgba(70,78,86,.9)';
        } else {
          const cols = ['#1d2328', '#242a2f', '#2b3236', '#2a241d', '#2f3535', '#3a3f42', '#402025', '#333a36', '#2c2a20', '#123040'];
          ctx.fillStyle = cols[floor] || '#1d2328';
          const light = world.light[ty * world.w + tx];
          if (light > .5) {
            ctx.fillStyle = `rgba(${120 + light * 80},${110 + light * 70},${60 + light * 40},${U.clamp(.15 + light * .2, 0, .4)})`;
            ctx.fillRect(sx, sy, scale, scale);
            ctx.fillStyle = cols[floor] || '#1d2328';
          }
        }
        ctx.fillRect(sx, sy, scale + .6, scale + .6);
      }
    }
    // props important
    for (const pr of world.props) {
      if (!pr.pickup || pr.hidden) continue;
      const sx = cx + (pr.x - p.x) * scale, sy = cy + (pr.y - p.y) * scale;
      if (sx < 0 || sy < 0 || sx > W || sy > H) continue;
      ctx.fillStyle = '#58d68d';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
    // zombies
    for (const z of G.zombies) {
      if (z.dead) continue;
      if (z.dormant) continue;
      const sx = cx + (z.x - p.x) * scale, sy = cy + (z.y - p.y) * scale;
      if (sx < 0 || sy < 0 || sx > W || sy > H) continue;
      ctx.fillStyle = z === G.boss ? '#ff3b2f' : z.type === 'brute' ? '#ff7a52' : '#e04b3f';
      ctx.beginPath(); ctx.arc(sx, sy, z === G.boss ? 4 : 2.4, 0, 6.283); ctx.fill();
    }
    // NPCs
    for (const n of G.npcs) {
      if (!n.active) continue;
      const sx = cx + (n.x - p.x) * scale, sy = cy + (n.y - p.y) * scale;
      if (sx < 0 || sy < 0 || sx > W || sy > H) continue;
      ctx.fillStyle = '#f0a93b';
      ctx.beginPath(); ctx.arc(sx, sy, 2.6, 0, 6.283); ctx.fill();
    }
    // objective
    if (G.objective.target) {
      let tx = G.objective.target.x - p.x, ty = G.objective.target.y - p.y;
      const d = Math.hypot(tx, ty);
      const maxR = Math.min(W, H) / 2 - 14;
      const rr = Math.min(d * scale, maxR);
      const ang = Math.atan2(ty, tx);
      const ox = cx + Math.cos(ang) * rr, oy = cy + Math.sin(ang) * rr;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#e8c477';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
      if (d * scale > maxR) {
        ctx.strokeStyle = 'rgba(232,196,119,.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * (maxR - 10), cy + Math.sin(ang) * (maxR - 10));
        ctx.lineTo(cx + Math.cos(ang) * (maxR - 2), cy + Math.sin(ang) * (maxR - 2));
        ctx.stroke();
      }
    }
    // player
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.a + Math.PI / 2);
    ctx.fillStyle = '#eef2f7';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
    // border
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  };

  G.updateMinimapStatic = function () { };

  G.toast = function (msg) {
    const wrap = document.getElementById('toasts');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
    while (wrap.children.length > 4) wrap.removeChild(wrap.firstChild);
  };

  G.showSubtitle = function (text, dur) {
    const el = document.getElementById('subtitle');
    if (!el || !text) return;
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(G.subTimer);
    G.subTimer = setTimeout(() => el.classList.add('hidden'), (dur || 3) * 1000);
  };

  /* ============================================================
     ENDINGS
     ============================================================ */
  G.unlockEnding = function (id) {
    if (!['safak', 'taht', 'gemi', 'sessizlik'].includes(id)) return;
    let list = U.store.get(G.endingsKey, []).filter(x => ['safak', 'taht', 'gemi', 'sessizlik'].includes(x));
    if (!list.includes(id)) {
      list.push(id);
      U.store.set(G.endingsKey, list);
    }
  };

  G.showEnding = function (id) {
    const e = STORY.endings[id];
    if (!e) { G.toTitle(); return; }
    const realId = ['safak', 'taht', 'gemi', 'sessizlik'].includes(id) ? id : 'gemi';
    G.unlockEnding(realId);
    G.mode = 'ending';
    G.endingId = realId;
    Screens.showHud(false);
    Screens.closeAll();
    Screens.open('screen-ending');
    const set = (elId, txt) => { const el = document.getElementById(elId); if (el) el.textContent = txt; };
    set('ending-kicker', e.kicker);
    set('ending-title', e.title);
    set('ending-sub', e.sub);
    const txt = document.getElementById('ending-text');
    if (txt) {
      const extra = [];
      if (G.flags.deniz_safe) extra.push('<b>Deniz</b>, bankoda saklandı ve sabahı gördü. Annesini bulamadı. Ama seni buldu.');
      if (G.flags.deniz_follow) extra.push('<b>Deniz</b> bütün gece yanındaydı. Şafağa birlikte baktınız.');
      if (G.flags.deniz_ignored) extra.push('<b>Deniz</b>\'i bankoda bıraktın. O gece ne olduğunu kimse bilmiyor.');
      if (G.flags.emre_help) extra.push('<b>Emre</b>, sargısını değiştirdi ve kuleye seninle yürüdü.');
      if (G.flags.emre_robbed) extra.push('<b>Emre</b>\'yi bariyerin yanında bıraktın. Mermiler işe yaradı.');
      if (G.flags.vial_red) extra.push('Kırmızı flakonu hâlâ cebinde taşıyorsun. Bazen, uykunda onun attığını duyuyorsun.');
      if (G.flags.trust >= 2) extra.push('<b>Leyla</b> sana tamamen güvendi. Bu şehirde bu, bir madalya kadar değerliydi.');
      const allLines = e.text.concat(extra);
      txt.innerHTML = allLines.map(t => `<p>${t}</p>`).join('');
    }
    const stats = document.getElementById('ending-stats');
    if (stats) {
      const acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0;
      const endings = U.store.get(G.endingsKey, []);
      stats.innerHTML = `
        <div><small>ÖLDÜRÜLEN</small><b>${G.stats.zombiesKilled}</b></div>
        <div><small>İSABET</small><b>${acc}%</b></div>
        <div><small>SEÇİM</small><b>${Object.keys(G.flags).filter(k => k.startsWith('choice_')).length}</b></div>
        <div><small>SONLAR</small><b>${endings.length}/4</b></div>`;
    }
    const bg = document.getElementById('ending-bg');
    if (bg) {
      bg.style.background = G.endingId === 'safak'
        ? 'linear-gradient(180deg,#1b2a40,#6b5a4a 55%,#e0a86a)'
        : G.endingId === 'taht'
          ? 'linear-gradient(180deg,#180609,#4a1114 60%,#7e1d1b)'
          : G.endingId === 'gemi'
            ? 'linear-gradient(180deg,#0a1620,#1e3a4a 60%,#3a5a6a)'
            : 'linear-gradient(180deg,#0a0c0e,#1a1f24 60%,#3a4046)';
    }
    U.store.del(G.saveKey);
    G.started = false;
    G.updateMenuState();
    AUD.stopAmbient();
    AUD.titleTheme();
    G.drawEndingArt = true;
  };

  G.renderEndingBg = function (dt) {
    const ctx = G.vctx;
    const W = G.vw, H = G.vh;
    // subtle animated horizon behind ending card
    const t = G.time * .1;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (G.endingId === 'safak') {
      g.addColorStop(0, '#16233a'); g.addColorStop(.55, '#5b4a45'); g.addColorStop(.75, '#c8865c'); g.addColorStop(1, '#1a1512');
    } else if (G.endingId === 'taht') {
      g.addColorStop(0, '#120406'); g.addColorStop(.6, '#3a0d10'); g.addColorStop(1, '#070304');
    } else if (G.endingId === 'gemi') {
      g.addColorStop(0, '#08131c'); g.addColorStop(.6, '#183242'); g.addColorStop(1, '#04121a');
    } else {
      g.addColorStop(0, '#080a0c'); g.addColorStop(.6, '#1a1e22'); g.addColorStop(1, '#070809');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.view.width, G.view.height);
    ctx.save();
    ctx.scale(G.dpr, G.dpr);
    // silhouette skyline
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const h = H * (.72 + Math.sin(x * .01 + 1) * .02) - (U.hash2(Math.floor(x / 40), 3) * H * .06) - (x % 130 < 40 ? H * .05 : 0);
      ctx.lineTo(x, h);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // moon / sun
    const mx = W * .74, my = H * .24;
    const mg = ctx.createRadialGradient(mx, my, 4, mx, my, H * .2);
    if (G.endingId === 'safak') { mg.addColorStop(0, 'rgba(255,225,170,.95)'); mg.addColorStop(1, 'rgba(255,180,100,0)'); }
    else if (G.endingId === 'taht') { mg.addColorStop(0, 'rgba(255,90,70,.8)'); mg.addColorStop(1, 'rgba(150,20,20,0)'); }
    else { mg.addColorStop(0, 'rgba(210,230,255,.7)'); mg.addColorStop(1, 'rgba(120,160,200,0)'); }
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, H * .2, 0, 6.283); ctx.fill();
    // birds / embers
    for (let i = 0; i < 16; i++) {
      const x = (U.hash2(i, 7) * W + t * (10 + i * 2)) % W;
      const y = H * .2 + U.hash2(i, 9) * H * .3;
      ctx.fillStyle = G.endingId === 'taht' ? 'rgba(255,120,90,.5)' : 'rgba(255,255,255,.28)';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  };

  /* ============================================================
     TITLE SCREEN
     ============================================================ */
  const TitleScreen = {
    canvas: null, ctx: null, active: false, raf: null, t: 0, last: 0,
    start() {
      this.canvas = document.getElementById('title-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      this.active = true;
      this.last = performance.now();
    },
    stop() { this.active = false; },
    resize() {
      if (!this.canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth, h = window.innerHeight;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.dpr = dpr;
      this.w = w; this.h = h;
    },
    render(dt) {
      if (!this.canvas || !this.ctx) return;
      this.t += dt;
      const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
      const w = this.w, h = this.h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // sky
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#05080d');
      g.addColorStop(.42, '#0b141d');
      g.addColorStop(.62, '#1b2229');
      g.addColorStop(.72, '#3a2a26');
      g.addColorStop(.8, '#0d1114');
      g.addColorStop(1, '#050708');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // stars
      const rng = new U.RNG(5);
      for (let i = 0; i < 130; i++) {
        const x = rng.range(0, 1) * W, y = rng.range(0, .5) * H;
        const tw = .5 + .5 * Math.sin(this.t * (1 + (i % 5) * .4) + i);
        ctx.fillStyle = `rgba(210,225,240,${(.08 + rng.next() * .3) * tw})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      // moon
      const mx = W * .76, my = H * .2;
      const mg = ctx.createRadialGradient(mx, my, 4, mx, my, H * .28);
      mg.addColorStop(0, 'rgba(255,244,214,.95)');
      mg.addColorStop(.06, 'rgba(240,230,200,.75)');
      mg.addColorStop(.2, 'rgba(200,190,170,.12)');
      mg.addColorStop(1, 'rgba(160,170,190,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, H * .28, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#efe9d6';
      ctx.beginPath(); ctx.arc(mx, my, H * .05, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(160,155,140,.25)';
      ctx.beginPath(); ctx.arc(mx - H * .012, my - H * .012, H * .013, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + H * .014, my + H * .012, H * .008, 0, 6.283); ctx.fill();

      // clouds
      for (let i = 0; i < 10; i++) {
        const y = H * (.16 + i * .028);
        const x = ((i * 233 + this.t * (6 + i * 2)) % (W + 400)) - 200;
        const cg = ctx.createLinearGradient(x, y, x + 500, y);
        const col = i % 3 === 0 ? '90,60,55' : '40,50,60';
        cg.addColorStop(0, `rgba(${col},0)`);
        cg.addColorStop(.5, `rgba(${col},.22)`);
        cg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.ellipse(x + 250, y, 250, 16 + (i % 4) * 6, 0, 0, 6.283); ctx.fill();
      }

      const horizon = H * .72;
      // skyline
      ctx.fillStyle = '#060a0d';
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) {
        const hn = U.fbm(x * .0035, 2.2, 3);
        const b = horizon - (hn * H * .07 + (U.hash2(Math.floor(x / 34), 4) > .78 ? H * .045 : 0));
        ctx.lineTo(x, b);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

      // mosques
      const dome = (x, y, r) => {
        ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.fill();
        ctx.fillRect(x - r, y, r * 2, H * .02);
        ctx.fillRect(x - 1.5, y - r - H * .03, 3, H * .03);
        ctx.beginPath(); ctx.arc(x, y - r - H * .033, 2.5, 0, 6.283); ctx.fill();
      };
      const minaret = (x, y, hh) => {
        ctx.fillRect(x - 2, y - hh, 4, hh);
        ctx.fillRect(x - 4.5, y - hh + hh * .2, 9, 3);
        ctx.fillRect(x - 4, y - hh + hh * .45, 8, 2.5);
        ctx.beginPath(); ctx.moveTo(x - 2.5, y - hh); ctx.lineTo(x, y - hh - 10); ctx.lineTo(x + 2.5, y - hh); ctx.fill();
      };
      const base = horizon - H * .015;
      [[W * .12, 1], [W * .30, .7]].forEach(([x, s]) => {
        ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
        dome(0, -H * .03, H * .045);
        dome(-W * .035, -H * .012, H * .022); dome(W * .034, -H * .01, H * .02);
        minaret(-W * .05, 0, H * .11); minaret(W * .05, 0, H * .1);
        ctx.restore();
      });
      // bosphorus bridge
      const bx = W * .40, bw = W * .3, by = horizon - H * .05;
      ctx.strokeStyle = '#060a0d'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx, by + H * .05);
      ctx.quadraticCurveTo(bx + bw * .2, by - H * .05, bx + bw * .5, by - H * .055);
      ctx.quadraticCurveTo(bx + bw * .8, by - H * .05, bx + bw, by + H * .05);
      ctx.stroke();
      ctx.fillRect(bx, by - H * .02, 5, H * .08);
      ctx.fillRect(bx + bw, by - H * .015, 5, H * .08);
      ctx.lineWidth = 1.2;
      for (let i = 2; i < 15; i++) {
        const tt = i / 15;
        const xx = bx + bw * tt;
        const yy = by + H * .05 - Math.sin(tt * Math.PI) * H * .105;
        ctx.beginPath(); ctx.moveTo(xx, by + H * .015); ctx.lineTo(xx, yy); ctx.stroke();
      }

      // galata tower silhouette
      const gx = W * .565, gy = horizon + H * .01;
      ctx.fillStyle = '#05080a';
      ctx.beginPath();
      ctx.moveTo(gx - W * .012, gy);
      ctx.lineTo(gx - W * .009, gy - H * .175);
      ctx.lineTo(gx - W * .013, gy - H * .2);
      ctx.lineTo(gx + W * .013, gy - H * .2);
      ctx.lineTo(gx + W * .009, gy - H * .175);
      ctx.lineTo(gx + W * .012, gy);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(gx - W * .013, gy - H * .2);
      ctx.lineTo(gx, gy - H * .235);
      ctx.lineTo(gx + W * .013, gy - H * .2);
      ctx.closePath(); ctx.fill();
      // tower window glow
      const wgl = ctx.createRadialGradient(gx, gy - H * .17, 1, gx, gy - H * .17, H * .04);
      wgl.addColorStop(0, 'rgba(255,190,110,.8)');
      wgl.addColorStop(1, 'rgba(255,150,80,0)');
      ctx.fillStyle = wgl;
      ctx.beginPath(); ctx.arc(gx, gy - H * .17, H * .04, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,215,150,.9)';
      ctx.fillRect(gx - 2.5, gy - H * .174, 5, 7);

      // water
      const wg = ctx.createLinearGradient(0, horizon, 0, H);
      wg.addColorStop(0, '#0a1014');
      wg.addColorStop(.4, '#070b0e');
      wg.addColorStop(1, '#030506');
      ctx.fillStyle = wg;
      ctx.fillRect(0, horizon, W, H - horizon);
      // shimmer
      for (let i = 0; i < 42; i++) {
        const y = horizon + (i / 42) * (H - horizon);
        const wdt = (1 - i / 42) * W * .05 + 10;
        const xx = gx + Math.sin(this.t * .6 + i * .5) * (10 + i * 3) - wdt / 2;
        ctx.fillStyle = `rgba(255,205,140,${.16 * (1 - i / 42)})`;
        ctx.fillRect(xx, y, wdt, 1.5);
      }
      // fog bands
      for (let i = 0; i < 7; i++) {
        const y = horizon - H * .02 - i * H * .022;
        const off = (this.t * (8 + i * 3) + i * 170) % (W + 600) - 300;
        const fg = ctx.createLinearGradient(off, y, off + W * .7, y);
        fg.addColorStop(0, 'rgba(130,140,150,0)');
        fg.addColorStop(.5, `rgba(130,140,150,${.05 + i * .008})`);
        fg.addColorStop(1, 'rgba(130,140,150,0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.ellipse(off + W * .35, y, W * .38, H * .012 + i, 0, 0, 6.283); ctx.fill();
      }
      // walking silhouettes on the quay
      const walkerCount = 4;
      for (let i = 0; i < walkerCount; i++) {
        const sp = 14 + i * 5;
        const x = ((this.t * sp + i * W * .27) % (W + 200)) - 100;
        const yBase = H * .9 + i * 6;
        const sc = (h / 900) * (1.1 + i * .12);
        const sway = Math.sin(this.t * 5 + i * 2) * 3 * sc;
        ctx.save();
        ctx.translate(x, yBase);
        ctx.scale(sc, sc);
        ctx.fillStyle = 'rgba(2,4,5,.9)';
        // body hunched
        ctx.beginPath();
        ctx.ellipse(0, -52, 15, 30, -0.18, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.ellipse(10, -84, 12, 11, 0.2, 0, 6.283); ctx.fill();
        // arms out
        ctx.strokeStyle = 'rgba(2,4,5,.9)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-4, -62); ctx.lineTo(30 + sway, -66); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, -58); ctx.lineTo(26 - sway, -50); ctx.stroke();
        // legs
        ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(-12 + sway, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -26); ctx.lineTo(12 - sway, 0); ctx.stroke();
        ctx.restore();
      }
      // rain streaks
      ctx.strokeStyle = 'rgba(190,215,235,.10)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 170; i++) {
        const x = (U.hash2(i, 1) * W + this.t * 60 * (1 + U.hash2(i, 2)) ) % W;
        const y = (U.hash2(i, 3) * H + this.t * 900 * (0.6 + U.hash2(i, 4))) % H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + 18);
        ctx.stroke();
      }
      // embers
      for (let i = 0; i < 30; i++) {
        const x = (U.hash2(i, 11) * W + Math.sin(this.t * .3 + i) * 40 + this.t * 9) % W;
        const y = (U.hash2(i, 12) * H - this.t * (12 + i % 7 * 4) + H) % H;
        const a = .12 + .12 * Math.sin(this.t * 2 + i);
        ctx.fillStyle = `rgba(230,150,90,${a})`;
        ctx.fillRect(x, y, 2, 2);
      }
      // dark gradient for text legibility
      const lg2 = ctx.createLinearGradient(0, 0, W * .7, 0);
      lg2.addColorStop(0, 'rgba(3,6,9,.85)');
      lg2.addColorStop(.55, 'rgba(3,6,9,.35)');
      lg2.addColorStop(1, 'rgba(3,6,9,0)');
      ctx.fillStyle = lg2;
      ctx.fillRect(0, 0, W, H);
      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .9);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,.6)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
  };

  /* ============================================================
     BOOT
     ============================================================ */
  global.GAME = G;
  global.TESTHOOK = { DLG, Screens, FLOW, TitleScreen };
})(window);
