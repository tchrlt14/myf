// ==========================================================
//  pitch.js — terrain en direct : 22 joueurs, un ballon,
//  actions offensives (passes, dribbles, tirs) et défensives
//  (tacles, interceptions, dégagements, arrêts).
//
//  Le résultat du match reste décidé par playMatch() dans
//  script.js : ici on ne fait que MISE EN SCÈNE. Les actions
//  « d'ambiance » (passes, tacles…) ne changent jamais le score ;
//  les buts / arrêts / occasions décidés par le moteur sont
//  joués fidèlement via PitchViz.moment().
// ==========================================================
(function () {
    'use strict';
    if (window.PitchViz) return;

    // ---------- constantes & utilitaires ----------
    const PW = 105, PH = 68;                 // terrain en mètres
    const M = 2.6, VW = PW + 2 * M, VH = PH + 2 * M;   // marge pour les cages
    const R = 1.45;                          // rayon d'un joueur
    const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const LS = {
        get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
    };
    const getG = () => { try { return G; } catch (e) { return null; } };
    const surname = n => String(n || 'Joueur').trim().split(/\s+/).slice(-1)[0];

    const TYPE_COL = { atk: '#e8b94f', def: '#4fd18b', goal: '#ffffff', bad: '#ff8a85', chg: '#8493a0' };
    const OPP_FORMS = [[4, 3, 3], [4, 4, 2], [3, 5, 2], [5, 3, 2], [4, 2, 3, 1]];
    const STAT_ROWS = [
        ['shot', 'Tirs'], ['sot', 'Cadrés'], ['pass', 'Passes'],
        ['recov', 'Récupérations'], ['drib', 'Dribbles réussis']
    ];

    // ---------- moteur ----------
    const PV = window.PitchViz = {
        on: LS.get('fm_pv_on', '1') !== '0',
        speed: +LS.get('fm_pv_speed', REDUCED ? '4' : '2'),
        skipping: false, playing: false,
        me: [], opp: [], ball: { x: PW / 2, y: PH / 2, z: 0, owner: null }, poss: 'me',
        clock: 0, time: 0, fxTime: 0, fx: [], tasks: [], _after: Promise.resolve(),
        rat: { me: 70, opp: 70 }, style: 'equilibre', stats: null, cv: null, oppName: 'Adversaire',
        get sp() { return this.skipping ? 40 : this.speed; },

        // ======================= construction =======================
        build(o) {
            this.rat = { me: o.myRat || 70, opp: o.oppRat || 70 };
            this.style = o.style || 'equilibre';
            this.oppName = (o.opp && o.opp.name) || 'Adversaire';
            this.me = this.makeMyTeam(o.squad || [], o.tactic || '4-3-3');
            this.opp = this.makeOppTeam();
            this.stats = { poss: { me: 0, opp: 0 } };
            ['me', 'opp'].forEach(t => this.stats[t] = { shot: 0, sot: 0, pass: 0, recov: 0, drib: 0, save: 0, goal: 0 });
            this.fx = []; this.tasks = []; this._after = Promise.resolve();
            this.clock = 0; this.skipping = false; this.finished = false;
            this.ball = { x: PW / 2, y: PH / 2, z: 0, owner: null };
            this.kickoff(Math.random() < 0.5 ? 'me' : 'opp');
            if (this.root) {
                this.ticker.innerHTML = '';
                this.setClock(0);
                this.q('[data-nm=me]').textContent = (getG() && G.clubName) || 'Mon club';
                this.q('[data-nm=opp]').textContent = this.oppName;
                this.renderStats();
                this.syncCtrl();
            }
        },
        // rows : [{pos, n}] de GK vers ATT ; slotRefs : tableau de refs joueurs dans l'ordre GK→ATT
        layout(rows, team, refs, nameFn) {
            const out = [], Rn = rows.length;
            let num = 1, k = 0;
            rows.forEach((row, ri) => {
                const x = ri === 0 ? 4 : (Rn > 2 ? 19 + (ri - 1) * (41 / (Rn - 2)) : 40);
                const span = row.n === 1 ? 0 : Math.min(52, 16 * (row.n - 1) + 8);
                for (let i = 0; i < row.n; i++) {
                    const y = row.n === 1 ? 34 : 34 - span / 2 + span * i / (row.n - 1);
                    const p = {
                        team, role: row.pos, num: num++, seed: Math.random() * 10, goto: null, a: {},
                        bx: team === 'me' ? x : PW - x, by: team === 'me' ? y : PH - y, x: 0, y: 0, ref: refs ? refs[k] : null
                    };
                    p.x = p.bx; p.y = p.by;
                    this.assign(p, p.ref, nameFn);
                    k++; out.push(p);
                }
            });
            return out;
        },
        assign(p, ref, nameFn) {
            p.ref = ref || null;
            if (p.team === 'me') { p.short = ref ? surname(ref.name) : 'Joueur'; p.label = p.short; }
            else { p.short = 'n°' + p.num; p.label = this.oppName + ' ' + p.short; }
        },
        makeMyTeam(squad, tactic) {
            const g = getG();
            let defRows = [{ pos: 'ATT', n: 3 }, { pos: 'MID', n: 3 }, { pos: 'DEF', n: 4 }, { pos: 'GK', n: 1 }];
            try { defRows = getLineupSlotDef(tactic); } catch (e) { }
            // slots dans l'ordre ATT→GK, comme G.lineup.pitch
            const slots = [];
            defRows.forEach(r => { for (let i = 0; i < r.n; i++) slots.push(r.pos); });
            const healthy = squad.filter(p => !p.injuredGames);
            const used = new Set();
            const refs = slots.map((pos, si) => {
                let ref = null;
                const idx = g && g.lineup && g.lineup.pitch ? g.lineup.pitch[si] : null;
                if (idx != null && g.squad[idx] && healthy.includes(g.squad[idx])) ref = g.squad[idx];
                if (ref && used.has(ref)) ref = null;
                if (!ref) ref = healthy.find(p => !used.has(p) && p.pos === pos) || healthy.find(p => !used.has(p)) || null;
                if (ref) used.add(ref);
                return ref;
            });
            // on remet en ordre GK→ATT pour layout()
            const rowsGK = defRows.slice().reverse();
            const refsGK = []; let off = 0;
            const bounds = defRows.map(r => { const s = off; off += r.n; return [s, off]; });
            for (let i = defRows.length - 1; i >= 0; i--) for (let j = bounds[i][0]; j < bounds[i][1]; j++) refsGK.push(refs[j]);
            return this.layout(rowsGK, 'me', refsGK);
        },
        makeOppTeam() {
            const f = pick(OPP_FORMS);
            const rows = [{ pos: 'GK', n: 1 }];
            f.forEach((n, i) => rows.push({ pos: i === 0 ? 'DEF' : i === f.length - 1 ? 'ATT' : 'MID', n }));
            return this.layout(rows, 'opp', null);
        },
        kickoff(team) {
            const dir = team === 'me' ? 1 : -1;
            this.me.concat(this.opp).forEach(p => p.goto = null);
            const k = this[team].find(p => p.role === 'ATT') || this[team][this[team].length - 1];
            k.x = PW / 2 - dir * 1.4; k.y = PH / 2;
            this.ball.x = PW / 2; this.ball.y = PH / 2; this.ball.z = 0;
            this.setOwner(k);
        },
        gkOf(team) { return this[team].find(p => p.role === 'GK'); },

        // ======================= boucle temps réel =======================
        tween(sec, fn) {
            if (document.hidden) { if (fn) fn(1); return Promise.resolve(); }   // onglet masqué : on avance sans attendre
            return new Promise(res => this.tasks.push({ t: 0, d: Math.max(0.016, sec / this.sp), fn, res }));
        },
        wait(sec) { return this.tween(sec, null); },
        tick(dt) {
            dt = Math.min(dt, 0.25);
            this.time += dt;
            const sp = Math.min(this.sp, 3);
            this.fxTime += dt * sp;
            this.movePlayers(dt, sp);
            const run = this.tasks; this.tasks = [];
            run.forEach(t => {
                t.t += dt; const f = Math.min(1, t.t / t.d);
                if (t.fn) t.fn(f);
                if (f >= 1) t.res(); else this.tasks.push(t);
            });
            const o = this.ball.owner;
            if (o) { this.ball.x = o.x + (o.team === 'me' ? 1 : -1) * 1.1; this.ball.y = o.y + 0.3; this.ball.z = 0; }
            if (this.fx.length) this.fx = this.fx.filter(f => this.fxTime - f.t0 < f.life);
            this.draw();
        },
        movePlayers(dt, sp) {
            const b = this.ball, pressers = [];
            const defTeam = this.poss === 'me' ? 'opp' : 'me';
            this[defTeam].filter(p => p.role !== 'GK').map(p => [dist(p, b), p]).sort((a, c) => a[0] - c[0]).slice(0, 2).forEach(e => pressers.push(e[1]));
            const k = 2.4 * sp, maxStep = 17 * dt * sp;
            for (const p of this.me.concat(this.opp)) {
                const t = this.target(p, pressers);
                let dx = (t.x - p.x) * (1 - Math.exp(-k * dt)), dy = (t.y - p.y) * (1 - Math.exp(-k * dt));
                const l = Math.hypot(dx, dy);
                if (l > maxStep) { dx *= maxStep / l; dy *= maxStep / l; }
                p.x += dx; p.y += dy;
            }
        },
        target(p, pressers) {
            if (p.goto) return p.goto;
            if (this.ball.owner === p) return p;
            const b = this.ball, dir = p.team === 'me' ? 1 : -1, role = p.role, has = this.poss === p.team;
            const kk = { GK: .04, DEF: .3, MID: .5, ATT: .55 }[role];
            let push = 0;
            if (role !== 'GK') {
                push = (has ? 6 : -4) * dir * (role === 'DEF' ? .6 : 1);
                if (p.team === 'me') {
                    if (this.style === 'offensif') push += 3 * dir; if (this.style === 'defensif') push -= 3 * dir;
                    if (this.style === 'pressing' && !has) push += 4 * dir;
                }
            }
            let tx = p.bx + (b.x - PW / 2) * kk + push, ty = p.by + (b.y - PH / 2) * (role === 'GK' ? .12 : .2);
            tx += Math.sin(this.time * .7 + p.seed) * 1.1; ty += Math.cos(this.time * .9 + p.seed * 1.7) * 1.1;
            if (!has && pressers.includes(p)) { tx = b.x + (p.x - b.x) * .15; ty = b.y + (p.y - b.y) * .15; }
            tx = role === 'GK' ? clamp(tx, p.team === 'me' ? 1.5 : PW - 9, p.team === 'me' ? 9 : PW - 1.5) : clamp(tx, 2, PW - 2);
            return { x: tx, y: clamp(ty, 2, PH - 2) };
        },

        // ======================= primitives =======================
        setOwner(p) { this.ball.owner = p; this.poss = p.team; p.goto = null; },
        nearest(arr, pt, filt) {
            let best = null, bd = 1e9;
            arr.forEach(p => { if (filt && !filt(p)) return; const d = dist(p, pt); if (d < bd) { bd = d; best = p; } });
            return best;
        },
        stat(p, key) { this.stats[p.team][key] = (this.stats[p.team][key] || 0) + 1; p.a[key] = (p.a[key] || 0) + 1; },
        setClock(m) {
            this.clock = Math.max(this.clock, m);
            if (this.clockEl) this.clockEl.textContent = Math.floor(this.clock) + "'";
        },
        flight(target, base, o = {}) {
            const b = this.ball; b.owner = null;
            const sx = b.x, sy = b.y, arc = o.arc || 0;
            const t0 = typeof target === 'function' ? target() : target;
            this.fx.push({ k: 'trail', x1: sx, y1: sy, x2: t0.x, y2: t0.y, type: o.trail || 'pass', t0: this.fxTime, life: o.trail === 'shot' ? 1.2 : .75 });
            return this.tween(base, f => {
                const e = 1 - Math.pow(1 - f, 1.5), t = typeof target === 'function' ? target() : target;
                b.x = sx + (t.x - sx) * e; b.y = sy + (t.y - sy) * e; b.z = f >= 1 ? 0 : arc * Math.sin(Math.PI * f);
            });
        },
        note(p, text, type, o = {}) {
            const m = Math.max(1, Math.round(this.clock));
            if (o.bubble !== false) this.fx.push({ k: 'bub', x: p.x, y: p.y, text: p.short + ' · ' + text, type, team: p.team, t0: this.fxTime, life: 1.9 });
            if (o.ring !== false && type !== 'chg') this.fx.push({ k: 'ring', x: p.x, y: p.y, type, t0: this.fxTime, life: .9 });
            this.log(m + "'", text, p.label, type, p.team);
        },
        log(min, tag, who, type, team) {
            if (!this.ticker) return;
            const li = document.createElement('li');
            li.className = 'pv-' + type + ' pv-t-' + (team || 'me');
            li.innerHTML = '<span class="pv-m">' + min + '</span><span class="pv-tag">' + tag + '</span><span class="pv-who">' + who + '</span>';
            this.ticker.insertBefore(li, this.ticker.firstChild);
            while (this.ticker.children.length > 6) this.ticker.lastChild.remove();
        },
        flash(text, sub, cls) {
            if (!this.flashEl) return;
            this.flashEl.className = 'pv-flash';
            void this.flashEl.offsetWidth;
            this.flashEl.innerHTML = '<b>' + text + '</b><span>' + (sub || '') + '</span>';
            this.flashEl.className = 'pv-flash show ' + (cls || '');
        },
        // fait entrer en jeu un joueur choisi par le moteur de script.js s'il n'est pas dans le XI affiché
        actor(ref, roles) {
            if (ref) {
                const here = this.me.find(x => x.ref === ref);
                if (here) return here;
                let cand = this.me.filter(x => x.role === ref.pos && !x.subbed);
                if (!cand.length) cand = this.me.filter(x => x.role !== 'GK' && !x.subbed);
                cand.sort((a, c) => (a.ref ? a.ref.level : 0) - (c.ref ? c.ref.level : 0));
                const p = cand[0];
                if (p) {
                    const old = p.label; this.assign(p, ref); p.subbed = true;
                    this.log(Math.max(1, Math.round(this.clock)) + "'", 'Remplacement', ref.name + ' remplace ' + old, 'chg', 'me');
                    return p;
                }
            }
            const pool = this.me.filter(x => roles.includes(x.role));
            return pick(pool.length ? pool : this.me.filter(x => x.role !== 'GK'));
        },
        interceptProb(team) {
            const edge = (this.rat.me - this.rat.opp) / 100;
            let p = .13 + (team === 'me' ? -edge : edge) * .18;
            if (team === 'opp' && this.style === 'pressing') p += .06;
            if (team === 'opp' && this.style === 'defensif') p += .02;
            return clamp(p, .05, .28);
        },
        tackleProb(team) {
            const edge = (this.rat.me - this.rat.opp) / 100;
            let p = .36 + (team === 'me' ? -edge : edge) * .2;
            if (team === 'opp' && this.style === 'pressing') p += .08;
            return clamp(p, .15, .6);
        },

        // ======================= actions =======================
        pickReceiver(c) {
            const dir = c.team === 'me' ? 1 : -1;
            const mates = this[c.team].filter(p => p !== c && p.role !== 'GK');
            const ws = mates.map(p => {
                const dx = (p.x - c.x) * dir, d = dist(c, p);
                let w = Math.exp(-Math.abs(d - 16) / 11) * (dx > -4 ? 1.6 : .5);
                if (p.role === 'ATT') w *= 1.2;
                return w;
            });
            let r = Math.random() * ws.reduce((a, b) => a + b, 0);
            for (let i = 0; i < mates.length; i++) { r -= ws[i]; if (r <= 0) return mates[i]; }
            return mates[0];
        },
        async pass(c, o = {}) {
            const oth = c.team === 'me' ? 'opp' : 'me', dir = c.team === 'me' ? 1 : -1;
            const r = o.to || this.pickReceiver(c), d = dist(c, r);
            if (!o.safe && Math.random() < this.interceptProb(c.team)) {
                const mid = { x: (c.x + r.x) / 2, y: (c.y + r.y) / 2 };
                const I = this.nearest(this[oth], mid, p => p.role !== 'GK');
                I.goto = { x: mid.x, y: mid.y };
                await this.flight(() => I, .3 + d / 120);
                this.stat(I, 'recov'); this.note(I, 'Interception', 'def');
                this.setOwner(I); return 'turnover';
            }
            await this.flight(() => r, .26 + d / 90, { arc: d > 26 ? 2.5 : 0 });
            this.setOwner(r); this.stat(c, 'pass');
            if (o.label) this.note(c, o.label, 'atk');
            else if ((r.x - c.x) * dir > 18 && Math.random() < .5) this.note(c, 'Passe en profondeur', 'atk', { ring: false });
            return 'ok';
        },
        async dribble(c) {
            const oth = c.team === 'me' ? 'opp' : 'me', dir = c.team === 'me' ? 1 : -1;
            const t = { x: clamp(c.x + dir * rnd(7, 12), 4, PW - 4), y: clamp(c.y + rnd(-6, 6), 4, PH - 4) };
            const D = this.nearest(this[oth], t, p => p.role !== 'GK');
            c.goto = t; D.goto = { x: t.x - dir * 1.2, y: t.y };
            await this.wait(.75);
            if (Math.random() < this.tackleProb(oth)) {
                this.stat(D, 'recov'); this.note(D, 'Tacle', 'def'); this.setOwner(D);
            } else {
                this.stat(c, 'drib'); this.note(c, 'Dribble', 'atk', { ring: false });
            }
            c.goto = null; D.goto = null;
        },
        async longBall(c) {
            const oth = c.team === 'me' ? 'opp' : 'me', dir = c.team === 'me' ? 1 : -1;
            const cands = this[c.team].filter(p => p !== c && p.role !== 'GK' && (p.x - c.x) * dir > 14);
            if (!cands.length) return this.pass(c);
            const r = pick(cands);
            if (Math.random() < this.interceptProb(c.team) + .1) {
                const I = this.nearest(this[oth], r, p => p.role !== 'GK');
                I.goto = { x: r.x, y: r.y };
                await this.flight(() => I, .7, { arc: 5 });
                this.stat(I, 'recov'); this.note(I, 'Interception', 'def'); this.setOwner(I);
                return;
            }
            this.note(c, 'Long ballon', 'atk', { ring: false });
            await this.flight(() => r, .7, { arc: 5 });
            this.setOwner(r); this.stat(c, 'pass');
        },
        // outcome : goal | saved | blocked | wide | over
        async shot(c, outcome) {
            const team = c.team, oth = team === 'me' ? 'opp' : 'me', dir = team === 'me' ? 1 : -1, gx = team === 'me' ? PW : 0;
            const gk = this.gkOf(oth), side = Math.random() < .5 ? -1 : 1;
            this.stat(c, 'shot');
            if (outcome === 'goal') {
                this.stat(c, 'sot');
                gk.goto = { x: gx - dir * 1.4, y: 34 - side * rnd(2, 4) };
                await this.flight({ x: gx + dir * 1.2, y: 34 + side * rnd(2.4, 3.4) }, .5, { arc: 1.2, trail: 'shot' });
                return;
            }
            if (outcome === 'saved') {
                this.stat(c, 'sot');
                this.note(c, 'Tir cadré', 'atk', { ring: false });
                const y = 34 + side * rnd(1.5, 3.2);
                gk.goto = { x: gx - dir * 1.4, y };
                await this.flight(() => gk, .5, { arc: 1.2, trail: 'shot' });
                this.stat(gk, 'save'); this.note(gk, 'Arrêt', 'def');
                this.setOwner(gk); gk.goto = null; return;
            }
            if (outcome === 'blocked') {
                this.note(c, 'Tir', 'atk', { ring: false });
                const D = this.nearest(this[oth], { x: c.x + dir * 4, y: c.y }, p => p.role !== 'GK');
                D.goto = { x: c.x + dir * 3.5, y: c.y };
                await this.wait(.2);
                await this.flight(() => D, .28, { trail: 'shot' });
                this.stat(D, 'recov'); this.note(D, 'Tir contré', 'def'); this.setOwner(D); D.goto = null; return;
            }
            const over = outcome === 'over';
            this.note(c, over ? 'Tir au-dessus' : 'Tir non cadré', 'atk', { ring: false });
            await this.flight({ x: gx + dir * 3, y: over ? 34 + side * rnd(-3, 3) : 34 + side * rnd(5.5, 9) }, .5, { arc: over ? 7 : 1.5, trail: 'shot' });
            await this.flight(() => gk, .55);
            this.setOwner(gk);
        },
        async ensurePossession(team) {
            if (this.poss === team && this.ball.owner && this.ball.owner.team === team) return;
            const b = this.ball, Rr = this.nearest(this[team], b, p => p.role !== 'GK');
            Rr.goto = { x: b.x, y: b.y };
            await this.tween(.5, () => { Rr.goto = { x: b.x, y: b.y }; });
            this.stat(Rr, 'recov'); this.note(Rr, 'Récupération', 'def');
            this.setOwner(Rr);
        },
        prog(p) { return p.team === 'me' ? p.x : PW - p.x; },
        // construit une phase d'attaque propre jusqu'au dernier tiers ; renvoie le porteur
        async attackBuild(team, n) {
            await this.ensurePossession(team);
            const dir = team === 'me' ? 1 : -1;
            for (let i = 0; i < n; i++) {
                const c = this.ball.owner;
                if (this.prog(c) >= 68) break;
                const mates = this[team].filter(p => p !== c && p.role !== 'GK').sort((a, b) => (b.x - a.x) * dir);
                await this.pass(c, { to: pick(mates.slice(0, Math.min(4, mates.length))), safe: true });
            }
            const c = this.ball.owner;
            if (this.prog(c) < 70) {
                c.goto = { x: team === 'me' ? 74 : PW - 74, y: clamp(c.y, 14, 54) };
                await this.wait(.8); c.goto = null;
            }
            return this.ball.owner;
        },
        async celebrate(S, team) {
            const dir = team === 'me' ? 1 : -1;
            S.goto = { x: team === 'me' ? PW - 9 : 9, y: S.y < 34 ? 7 : PH - 7 };
            this[team].filter(p => p !== S && p.role !== 'GK').map(p => [dist(p, S.goto), p]).sort((a, b) => a[0] - b[0]).slice(0, 4)
                .forEach((e, i) => { e[1].goto = { x: S.goto.x - dir * (2 + i * .9), y: S.goto.y + (i % 2 ? 2.2 : -2.2) }; });
            await this.wait(1.5);
            this.kickoff(team === 'me' ? 'opp' : 'me');
        },

        // ======================= API appelée par script.js =======================
        start(o) {
            this.playing = true;
            this.build(o);
            if (!this.on) return;
            this.log('0\'', 'Coup d\'envoi', '', 'chg', 'me');
        },
        preview(force) {
            const g = getG();
            if (this.playing || (this.finished && !force) || !g || !g.squad || !g.squad.length) return;
            try { initLineup(); } catch (e) { }
            this.build({
                squad: g.squad, tactic: g.tactic, style: g.style, myRat: 70, oppRat: 70, opp: g.nextOpponent
            });
            if (this.ticker) this.log('', 'Prêt pour le coup d\'envoi', '', 'chg', 'me');
        },
        async advance(toMin) {
            await this._after;
            if (!this.on || !this.playing) return;
            while (this.clock < toMin - 0.01) {
                const dm = Math.min(toMin - this.clock, rnd(1.1, 2.6));
                await this.step();
                this.stats.poss[this.poss] += dm;
                this.setClock(this.clock + dm);
                this.renderStats();
            }
            this.setClock(toMin);
        },
        async step() {
            let c = this.ball.owner;
            if (!c) { c = this.nearest(this[this.poss], this.ball); this.setOwner(c); }
            const pr = this.prog(c), r = Math.random();
            if (c.role === 'GK') return this.pass(c);
            if (pr > 76 && r < .34) return this.shot(c, pick(['wide', 'wide', 'over', 'blocked', 'blocked', 'saved', 'saved']));
            if (r < .58) return this.pass(c);
            if (r < .78) return this.dribble(c);
            if (r < .86) return this.longBall(c);
            if (r < .92 && pr > 20) return this.pass(c, { to: this.gkOf(c.team), safe: true });
            return this.pass(c);
        },
        // kind : goal | conceded | save | clear | miss  — résout au moment fort de l'action
        async moment(kind, d = {}) {
            if (!this.on || !this.playing) { await sleep(360); return; }
            await this._after;
            if (d.min != null) this.setClock(d.min);
            if (kind === 'goal') {
                let c = await this.attackBuild('me', 2);
                const S = this.actor(d.scorer, ['ATT', 'MID']), A = d.assister ? this.actor(d.assister, ['ATT', 'MID']) : null;
                S.goto = { x: rnd(88, 93), y: rnd(26, 42) };
                if (A && A !== S) A.goto = { x: rnd(76, 84), y: rnd(14, 54) };
                await this.wait(.5);
                if (A && A !== S) {
                    if (c !== A) await this.pass(c, { to: A, safe: true });
                    await this.pass(A, { to: S, safe: true, label: 'Passe décisive' });
                    this.stat(A, 'assist');
                } else if (c !== S) await this.pass(c, { to: S, safe: true });
                A && (A.goto = null);
                await this.shot(S, 'goal');
                this.stat(S, 'goal');
                this.note(S, 'BUT !', 'goal');
                this.flash('BUT !', S.label, 'good');
                this._after = this.celebrate(S, 'me');
            } else if (kind === 'conceded') {
                const c = await this.attackBuild('opp', 2);
                await this.shot(c, 'goal');
                this.stat(c, 'goal');
                this.note(c, 'But encaissé', 'bad');
                this.flash('BUT ENCAISSÉ', c.label, 'bad');
                this._after = this.celebrate(c, 'opp');
            } else if (kind === 'save') {
                const c = await this.attackBuild('opp', 2);
                if (d.gk) this.actor(d.gk, ['GK']);   // fait entrer le gardien du moteur s'il n'est pas dans le XI
                await this.shot(c, 'saved');
                this._after = (async () => { await this.wait(.6); await this.pass(this.gkOf('me'), { safe: true }); })();
            } else if (kind === 'clear') {
                const c = await this.attackBuild('opp', 2);
                const D = this.actor(d.def, ['DEF']);
                D.goto = { x: c.x - 2.5, y: c.y };
                this.note(c, 'Tir', 'atk', { ring: false });
                await this.wait(.45);
                await this.flight(() => D, .28, { trail: 'shot' });
                this.stat(D, 'recov'); this.note(D, 'Dégagement', 'def'); this.setOwner(D);
                this._after = (async () => {
                    const t = this.nearest(this.me.filter(p => p.role === 'MID' || p.role === 'ATT'), { x: 60, y: 34 });
                    await this.flight(() => t, .6, { arc: 5 });
                    this.setOwner(t);
                })();
            } else if (kind === 'miss') {
                const c = await this.attackBuild('me', 3);
                await this.shot(c, Math.random() < .5 ? 'wide' : 'over');
                this.note(c, 'Occasion manquée', 'bad', { bubble: false });
            }
            this.renderStats();
        },
        async end() {
            this.playing = false; this.finished = true;
            if (!this.on) return;
            await this._after;
            this.setClock(90);
            if (this.clockEl) this.clockEl.textContent = 'FIN';
            const w = { recov: 2, save: 2, shot: 1.5, drib: 1.5, goal: 5, assist: 3, pass: .1 };
            let best = null, bs = 0;
            this.me.forEach(p => {
                const s = Object.keys(p.a).reduce((t, k) => t + (p.a[k] || 0) * (w[k] || 1), 0);
                if (s > bs) { bs = s; best = p; }
            });
            if (best) this.log('FIN', 'Le plus actif', best.label, 'chg', 'me');
            this.renderStats();
            this.me.concat(this.opp).forEach(p => p.goto = null);
        },

        // ======================= interface =======================
        q(sel) { return this.root.querySelector(sel); },
        setSpeed(v) {
            if (v === 'skip') { this.skipping = !this.skipping; }
            else { this.speed = +v; this.skipping = false; LS.set('fm_pv_speed', String(v)); }
            this.syncCtrl();
        },
        syncCtrl() {
            if (!this.root) return;
            this.root.querySelectorAll('[data-sp]').forEach(b => {
                const v = b.dataset.sp;
                b.classList.toggle('on', v === 'skip' ? this.skipping : (!this.skipping && +v === this.speed));
            });
            this.root.classList.toggle('folded', !this.on);
            const f = this.q('.pv-fold'); f.textContent = this.on ? 'Réduire' : 'Afficher'; f.setAttribute('aria-expanded', String(this.on));
        },
        renderStats() {
            if (!this.root || !this.stats) return;
            const p = this.stats.poss, tot = (p.me + p.opp) || 1, pm = Math.round(p.me / tot * 100);
            this.q('[data-pp=me]').textContent = (p.me + p.opp ? pm : 50) + '%';
            this.q('[data-pp=opp]').textContent = (p.me + p.opp ? 100 - pm : 50) + '%';
            this.q('.pv-bar i').style.width = (p.me + p.opp ? pm : 50) + '%';
            STAT_ROWS.forEach(([k]) => {
                this.q('[data-s="me-' + k + '"]').textContent = this.stats.me[k] || 0;
                this.q('[data-s="opp-' + k + '"]').textContent = this.stats.opp[k] || 0;
            });
        },
        mount() {
            const arena = document.querySelector('.match-arena');
            if (!arena || this.root) return;
            const root = this.root = document.createElement('section');
            root.className = 'pv'; root.setAttribute('aria-label', 'Terrain en direct');
            root.innerHTML =
                '<div class="pv-head"><span class="pv-title">Terrain en direct</span><span class="pv-clock">0\'</span>' +
                '<span class="pv-teams"><span><i class="me"></i><em data-nm="me">Mon club</em></span><span><i class="opp"></i><em data-nm="opp">Adversaire</em></span></span>' +
                '<div class="pv-ctrl"><button type="button" data-sp="1">×1</button><button type="button" data-sp="2">×2</button><button type="button" data-sp="4">×4</button>' +
                '<button type="button" data-sp="skip" title="Accélérer jusqu\'à la fin du match">Passer</button><button type="button" class="pv-fold" aria-expanded="true">Réduire</button></div></div>' +
                '<div class="pv-body"><div class="pv-stage"><canvas></canvas><div class="pv-flash"></div></div>' +
                '<div class="pv-side"><div class="pv-stats"><div class="pv-poss"><b data-pp="me">50%</b><span>Possession</span><b data-pp="opp">50%</b></div><div class="pv-bar"><i></i></div>' +
                STAT_ROWS.map(([k, l]) => '<div class="pv-row"><b data-s="me-' + k + '">0</b><span>' + l + '</span><b data-s="opp-' + k + '">0</b></div>').join('') +
                '</div><ol class="pv-ticker" aria-live="off"></ol></div></div>' +
                '<div class="pv-legend"><span class="atk">Action offensive</span><span class="def">Action défensive</span></div>';
            arena.insertAdjacentElement('afterend', root);
            this.cv = root.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
            this.ticker = root.querySelector('.pv-ticker'); this.flashEl = root.querySelector('.pv-flash');
            this.clockEl = root.querySelector('.pv-clock');
            root.querySelectorAll('[data-sp]').forEach(b => b.addEventListener('click', () => this.setSpeed(b.dataset.sp)));
            root.querySelector('.pv-fold').addEventListener('click', () => {
                this.on = !this.on; LS.set('fm_pv_on', this.on ? '1' : '0'); this.syncCtrl();
            });
            const fit = () => {
                const w = this.cv.clientWidth, dpr = Math.min(window.devicePixelRatio || 1, 2);
                if (!w) return;
                this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(w * VH / VW * dpr);
            };
            if (window.ResizeObserver) new ResizeObserver(fit).observe(this.cv); else window.addEventListener('resize', fit);
            fit(); this.syncCtrl();
        },

        // ======================= rendu =======================
        draw() {
            const cv = this.cv; if (!cv || !cv.clientWidth || !cv.width) return;
            const ctx = this.ctx, sc = cv.width / VW;
            ctx.setTransform(sc, 0, 0, sc, M * sc, M * sc);
            ctx.fillStyle = '#1f4f28'; ctx.fillRect(-M, -M, VW, VH);
            const n = 14, w = PW / n;
            for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#2f6e3a' : '#2a6434'; ctx.fillRect(i * w, 0, w + .02, PH); }
            // lignes
            ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = .28; ctx.fillStyle = 'rgba(255,255,255,.7)';
            ctx.strokeRect(0, 0, PW, PH);
            ctx.beginPath(); ctx.moveTo(PW / 2, 0); ctx.lineTo(PW / 2, PH); ctx.stroke();
            ctx.beginPath(); ctx.arc(PW / 2, PH / 2, 9.15, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.arc(PW / 2, PH / 2, .4, 0, 7); ctx.fill();
            [[0, 1], [PW, -1]].forEach(([x0, s]) => {
                ctx.strokeRect(s > 0 ? 0 : PW - 16.5, 13.85, 16.5, 40.3);
                ctx.strokeRect(s > 0 ? 0 : PW - 5.5, 24.85, 5.5, 18.3);
                ctx.beginPath(); ctx.arc(x0 + s * 11, PH / 2, .35, 0, 7); ctx.fill();
                ctx.beginPath();
                if (s > 0) ctx.arc(11, PH / 2, 9.15, -.9273, .9273); else ctx.arc(PW - 11, PH / 2, 9.15, Math.PI - .9273, Math.PI + .9273);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(s > 0 ? -2.2 : PW, 30.34, 2.2, 7.32);
                ctx.strokeRect(s > 0 ? -2.2 : PW, 30.34, 2.2, 7.32); ctx.fillStyle = 'rgba(255,255,255,.7)';
            });
            // traînées
            this.fx.forEach(f => {
                if (f.k !== 'trail') return;
                const a = 1 - (this.fxTime - f.t0) / f.life;
                ctx.globalAlpha = Math.max(0, a) * .8;
                ctx.strokeStyle = f.type === 'shot' ? '#e8b94f' : 'rgba(255,255,255,.85)';
                ctx.lineWidth = f.type === 'shot' ? .5 : .28;
                ctx.setLineDash(f.type === 'shot' ? [] : [.9, .7]);
                ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
            });
            ctx.setLineDash([]); ctx.globalAlpha = 1;
            // anneaux
            this.fx.forEach(f => {
                if (f.k !== 'ring') return;
                const age = (this.fxTime - f.t0) / f.life;
                ctx.globalAlpha = Math.max(0, 1 - age); ctx.strokeStyle = TYPE_COL[f.type] || '#fff'; ctx.lineWidth = .45;
                ctx.beginPath(); ctx.arc(f.x, f.y, R + 0.4 + age * 4.2, 0, 7); ctx.stroke();
            });
            ctx.globalAlpha = 1;
            // joueurs
            const labels = cv.clientWidth >= 520, owner = this.ball.owner;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (const p of this.opp.concat(this.me)) {
                ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(p.x + .3, p.y + .6, R, R * .8, 0, 0, 7); ctx.fill();
                const gk = p.role === 'GK';
                ctx.fillStyle = p.team === 'me' ? (gk ? '#d9a441' : '#5aa9f0') : (gk ? '#b9a2f2' : '#d9534f');
                ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill();
                ctx.lineWidth = .3; ctx.strokeStyle = '#0b1014'; ctx.stroke();
                ctx.fillStyle = p.team === 'me' || gk ? '#07121c' : '#fff';
                ctx.font = '700 1.7px "Barlow Condensed", "Arial Narrow", sans-serif';
                ctx.fillText(p.num, p.x, p.y + .08);
                if (p === owner) {
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = .35; ctx.globalAlpha = .6 + .4 * Math.sin(this.time * 8);
                    ctx.beginPath(); ctx.arc(p.x, p.y, R + .55, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
                }
                if (labels && p.team === 'me') {
                    ctx.font = '600 1.55px "Barlow Condensed", "Arial Narrow", sans-serif';
                    ctx.lineWidth = .4; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(p.short, p.x, p.y + R + 1.5);
                    ctx.fillStyle = p === owner ? '#fff' : 'rgba(255,255,255,.82)'; ctx.fillText(p.short, p.x, p.y + R + 1.5);
                }
            }
            // ballon
            const b = this.ball, by = b.y - b.z * .55, br = .85 + b.z * .05;
            ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(b.x + .3, b.y + .5, .85, .55, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, by, br, 0, 7); ctx.fill();
            ctx.lineWidth = .22; ctx.strokeStyle = '#11171c'; ctx.stroke();
            ctx.fillStyle = '#11171c'; ctx.beginPath(); ctx.arc(b.x, by, br * .38, 0, 7); ctx.fill();
            // bulles d'action
            ctx.font = '700 1.75px "Barlow Condensed", "Arial Narrow", sans-serif';
            this.fx.forEach(f => {
                if (f.k !== 'bub') return;
                const age = (this.fxTime - f.t0) / f.life, tw = ctx.measureText(f.text).width, bw = tw + 3.2, bh = 2.9;
                const x = clamp(f.x, bw / 2 + .8, PW - bw / 2 - .8), y = Math.max(bh / 2 + .8, f.y - 3.6 - age * 2);
                ctx.globalAlpha = age < .75 ? 1 : Math.max(0, 1 - (age - .75) * 4);
                ctx.fillStyle = 'rgba(8,13,17,.88)';
                ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, .9) : ctx.rect(x - bw / 2, y - bh / 2, bw, bh); ctx.fill();
                ctx.fillStyle = f.team === 'me' ? '#5aa9f0' : '#d9534f'; ctx.fillRect(x - bw / 2, y - bh / 2 + .3, .5, bh - .6);
                ctx.fillStyle = TYPE_COL[f.type] || '#fff'; ctx.fillText(f.text, x + .5, y + .08);
                ctx.globalAlpha = 1;
            });
        }
    };

    // ---------- branchement ----------
    function init() {
        PV.mount();
        let last = performance.now();
        const frame = t => { PV.tick((t - last) / 1000); last = t; requestAnimationFrame(frame); };
        requestAnimationFrame(frame);
        // au retour sur l'onglet « Match », on réaffiche la composition
        try {
            if (typeof showTab === 'function') {
                const o = showTab;
                window.showTab = showTab = function (k) { const r = o.apply(this, arguments); if (k === 'match') PV.preview(); return r; };
            }
        } catch (e) { }
        PV.preview();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
