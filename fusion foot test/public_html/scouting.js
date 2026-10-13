// ==========================================================
//  scouting.js — recruteurs du centre de formation
//  • engager / virer des recruteurs (limite : 2 + niveau du centre)
//  • les envoyer dans n'importe quel pays via une carte du monde
//  • ils découvrent de jeunes talents (« pistes ») à recruter
//  Données sauvegardées dans G.scouts, G.prospects, G.scoutPool
// ==========================================================
(function () {
    'use strict';

    // Carte « grille de tuiles » : [colonne, ligne] par code pays ISO
    const MAP = {"AD":[14,4],"AE":[25,7],"AF":[25,4],"AG":[9,4],"AL":[18,6],"AM":[22,4],"AO":[16,13],"AR":[5,11],"AT":[17,3],"AU":[33,12],"AZ":[23,3],"BA":[18,5],"BB":[10,5],"BD":[28,6],"BE":[15,3],"BF":[13,9],"BG":[20,5],"BH":[23,7],"BI":[18,12],"BJ":[15,11],"BN":[31,8],"BO":[5,10],"BR":[6,9],"BS":[6,3],"BT":[28,5],"BW":[17,14],"BY":[20,2],"BZ":[3,4],"CA":[4,1],"CD":[17,12],"CF":[16,10],"CG":[17,11],"CH":[15,4],"CI":[13,10],"CL":[4,11],"CM":[15,9],"CN":[28,3],"CO":[5,8],"CR":[3,7],"CU":[5,4],"CV":[10,8],"CY":[21,5],"CZ":[17,2],"DE":[16,2],"DJ":[18,9],"DK":[16,1],"DM":[8,5],"DO":[7,4],"DZ":[14,7],"EC":[4,9],"EE":[18,1],"EG":[17,7],"ER":[17,8],"ES":[13,4],"ET":[17,9],"FI":[18,0],"FJ":[38,12],"FM":[36,8],"FR":[14,3],"GA":[16,11],"GB":[15,1],"GD":[9,6],"GE":[22,3],"GH":[14,10],"GL":[8,0],"GM":[12,9],"GN":[12,10],"GQ":[15,10],"GR":[20,6],"GT":[2,4],"GW":[11,10],"GY":[7,8],"HN":[3,5],"HR":[18,4],"HT":[6,4],"HU":[19,3],"ID":[31,9],"IE":[14,1],"IL":[22,6],"IN":[27,6],"IQ":[23,5],"IR":[24,5],"IS":[12,0],"IT":[15,5],"JM":[5,5],"JO":[23,6],"JP":[32,4],"KE":[18,10],"KG":[25,2],"KH":[30,7],"KI":[39,10],"KM":[20,12],"KN":[8,4],"KP":[30,3],"KR":[30,4],"KW":[24,6],"KZ":[24,1],"LA":[30,6],"LB":[21,6],"LC":[9,5],"LI":[16,4],"LK":[27,7],"LR":[13,11],"LS":[18,15],"LT":[19,2],"LU":[16,3],"LV":[19,1],"LY":[16,7],"MA":[13,7],"MC":[14,5],"MD":[21,3],"ME":[19,5],"MG":[20,13],"MH":[38,8],"MK":[19,6],"ML":[13,8],"MM":[29,6],"MN":[27,2],"MR":[12,8],"MT":[16,6],"MU":[22,13],"MV":[25,8],"MW":[18,13],"MX":[3,3],"MY":[29,8],"MZ":[19,13],"NA":[16,14],"NE":[14,8],"NG":[14,9],"NI":[3,6],"NL":[15,2],"NO":[16,0],"NP":[27,5],"NR":[37,9],"NZ":[36,14],"OM":[24,8],"PA":[4,7],"PE":[5,9],"PG":[35,10],"PH":[33,7],"PK":[26,5],"PL":[18,2],"PS":[21,7],"PT":[12,4],"PW":[34,8],"PY":[6,10],"QA":[24,7],"RO":[20,4],"RS":[19,4],"RU":[21,1],"RW":[18,11],"SA":[22,7],"SB":[37,10],"SC":[21,12],"SD":[16,8],"SE":[17,0],"SG":[29,9],"SI":[17,4],"SK":[18,3],"SL":[12,11],"SM":[16,5],"SN":[11,9],"SO":[19,9],"SR":[8,8],"SS":[16,9],"ST":[14,12],"SV":[2,5],"SY":[22,5],"SZ":[19,14],"TD":[15,8],"TG":[14,11],"TH":[29,7],"TJ":[26,3],"TL":[34,9],"TM":[25,3],"TN":[15,7],"TO":[39,13],"TR":[21,4],"TT":[10,6],"TV":[38,11],"TW":[32,6],"TZ":[19,11],"UA":[20,3],"UG":[17,10],"US":[4,2],"UY":[6,11],"UZ":[24,2],"VA":[17,5],"VC":[8,6],"VE":[6,8],"VN":[31,6],"VU":[37,11],"WS":[39,12],"YE":[22,8],"ZA":[17,15],"ZM":[17,13],"ZW":[18,14]};
    const COLS = 40, ROWS = 16;

    // Latitude / longitude approximatives de chaque pays (distances, repères sur la carte)
    const LL = {"AD":[42.5,1.5],"AE":[24,54],"AF":[33.9,67.7],"AG":[17.1,-61.8],"AL":[41.2,20.2],"AM":[40.1,45],"AO":[-11.2,17.9],"AR":[-34,-64],"AT":[47.5,14.5],"AU":[-25,134],"AZ":[40.3,47.7],"BA":[44,17.8],"BB":[13.2,-59.5],"BD":[23.7,90.3],"BE":[50.6,4.6],"BF":[12.2,-1.6],"BG":[42.7,25.5],"BH":[26,50.55],"BI":[-3.4,29.9],"BJ":[9.6,2.3],"BN":[4.5,114.7],"BO":[-16.7,-64.7],"BR":[-10,-52],"BS":[24.7,-78],"BT":[27.4,90.4],"BW":[-22.3,24.7],"BY":[53.7,28],"BZ":[17.2,-88.7],"CA":[58,-100],"CD":[-2.9,23.6],"CF":[6.6,20.5],"CG":[-0.7,15.2],"CH":[46.8,8.2],"CI":[7.6,-5.5],"CL":[-33,-71],"CM":[5.7,12.7],"CN":[35,103],"CO":[4,-73],"CR":[9.9,-84.2],"CU":[21.6,-79],"CV":[16,-24],"CY":[35,33],"CZ":[49.8,15.5],"DE":[51.2,10.4],"DJ":[11.8,42.6],"DK":[56,9.5],"DM":[15.4,-61.4],"DO":[18.9,-70.5],"DZ":[28,2.6],"EC":[-1.4,-78.4],"EE":[58.7,25.5],"EG":[26.5,29.8],"ER":[15.4,38.9],"ES":[40,-3.7],"ET":[8.6,39.6],"FI":[64,26],"FJ":[-17.8,178],"FM":[6.9,158.2],"FR":[46.6,2.4],"GA":[-0.8,11.6],"GB":[54,-2.5],"GD":[12.1,-61.7],"GE":[42.2,43.4],"GH":[7.9,-1.1],"GL":[72,-40],"GM":[13.4,-15.4],"GN":[10.9,-10.9],"GQ":[1.7,10.3],"GR":[39,22],"GT":[15.5,-90.3],"GW":[12,-15],"GY":[4.9,-58.9],"HN":[14.8,-86.6],"HR":[45.2,15.5],"HT":[19,-72.7],"HU":[47.1,19.4],"ID":[-2,118],"IE":[53.2,-8],"IL":[31.4,35],"IN":[22,79],"IQ":[33,43.7],"IR":[32.5,54.3],"IS":[64.9,-18.5],"IT":[42.8,12.5],"JM":[18.1,-77.3],"JO":[31.2,36.5],"JP":[36.5,138],"KE":[0.5,38],"KG":[41.5,74.6],"KH":[12.7,104.9],"KI":[1.4,173],"KM":[-11.9,43.4],"KN":[17.3,-62.7],"KP":[40.2,127.2],"KR":[36.4,127.8],"KW":[29.3,47.6],"KZ":[48,67],"LA":[18.5,103.8],"LB":[33.9,35.9],"LC":[13.9,-61],"LI":[47.15,9.55],"LK":[7.8,80.7],"LR":[6.4,-9.4],"LS":[-29.6,28.2],"LT":[55.3,23.9],"LU":[49.8,6.1],"LV":[56.9,24.9],"LY":[27,17],"MA":[31.8,-6.3],"MC":[43.74,7.42],"MD":[47.2,28.5],"ME":[42.8,19.3],"MG":[-19,46.7],"MH":[7.1,171],"MK":[41.6,21.7],"ML":[17.3,-3.6],"MM":[21.1,96.5],"MN":[46.8,103],"MR":[20.3,-10.3],"MT":[35.9,14.4],"MU":[-20.3,57.6],"MV":[3.2,73.2],"MW":[-13.2,34.2],"MX":[23.6,-102.5],"MY":[3.8,108],"MZ":[-18.7,35.5],"NA":[-22.1,17.2],"NE":[17.4,9.4],"NG":[9.6,8.1],"NI":[12.9,-85],"NL":[52.2,5.6],"NO":[62,9],"NP":[28.3,84],"NR":[-0.52,166.93],"NZ":[-41.5,172.5],"OM":[21,56],"PA":[8.5,-80.1],"PE":[-9.2,-75],"PG":[-6.3,145],"PH":[12.8,122.5],"PK":[29.9,69.4],"PL":[52,19.4],"PS":[31.95,35.2],"PT":[39.6,-8],"PW":[7.5,134.6],"PY":[-23.2,-58.4],"QA":[25.3,51.2],"RO":[45.9,25],"RS":[44,20.8],"RU":[61.5,95],"RW":[-2,29.9],"SA":[24,45],"SB":[-9.6,160],"SC":[-4.7,55.5],"SD":[15.5,30],"SE":[62,15],"SG":[1.35,103.8],"SI":[46.1,14.8],"SK":[48.7,19.7],"SL":[8.5,-11.8],"SM":[43.94,12.46],"SN":[14.5,-14.5],"SO":[5.2,46.2],"SR":[4,-56],"SS":[7.3,30.2],"ST":[0.3,6.7],"SV":[13.8,-88.9],"SY":[35,38.5],"SZ":[-26.5,31.5],"TD":[15.4,18.7],"TG":[8.6,0.8],"TH":[15.2,101],"TJ":[38.9,71],"TL":[-8.8,125.9],"TM":[39,59.5],"TN":[34,9.6],"TO":[-21.2,-175.2],"TR":[39,35],"TT":[10.5,-61.3],"TV":[-8.5,179.2],"TW":[23.7,121],"TZ":[-6.4,34.9],"UA":[49,31.4],"UG":[1.4,32.3],"US":[39,-98],"UY":[-32.8,-56],"UZ":[41.4,64.6],"VA":[41.9,12.45],"VC":[13.2,-61.2],"VE":[7.1,-66],"VN":[16,106.3],"VU":[-16.5,167.7],"WS":[-13.6,-172.4],"YE":[15.9,47.6],"ZA":[-29,24],"ZM":[-13.5,27.8],"ZW":[-19,29.9]};
    // Code ISO numérique (utilisé par les géodonnées) → code pays
    const NUM = {"004":"AF","008":"AL","012":"DZ","020":"AD","024":"AO","028":"AG","031":"AZ","032":"AR","036":"AU","040":"AT","044":"BS","048":"BH","050":"BD","051":"AM","052":"BB","056":"BE","064":"BT","068":"BO","070":"BA","072":"BW","076":"BR","084":"BZ","090":"SB","096":"BN","100":"BG","104":"MM","108":"BI","112":"BY","116":"KH","120":"CM","124":"CA","132":"CV","140":"CF","144":"LK","148":"TD","152":"CL","156":"CN","158":"TW","170":"CO","174":"KM","178":"CG","180":"CD","188":"CR","191":"HR","192":"CU","196":"CY","203":"CZ","204":"BJ","208":"DK","212":"DM","214":"DO","218":"EC","222":"SV","226":"GQ","231":"ET","232":"ER","233":"EE","242":"FJ","246":"FI","250":"FR","262":"DJ","266":"GA","268":"GE","270":"GM","275":"PS","276":"DE","288":"GH","296":"KI","300":"GR","304":"GL","308":"GD","320":"GT","324":"GN","328":"GY","332":"HT","336":"VA","340":"HN","348":"HU","352":"IS","356":"IN","360":"ID","364":"IR","368":"IQ","372":"IE","376":"IL","380":"IT","384":"CI","388":"JM","392":"JP","398":"KZ","400":"JO","404":"KE","408":"KP","410":"KR","414":"KW","417":"KG","418":"LA","422":"LB","426":"LS","428":"LV","430":"LR","434":"LY","438":"LI","440":"LT","442":"LU","450":"MG","454":"MW","458":"MY","462":"MV","466":"ML","470":"MT","478":"MR","480":"MU","484":"MX","492":"MC","496":"MN","498":"MD","499":"ME","504":"MA","508":"MZ","512":"OM","516":"NA","520":"NR","524":"NP","528":"NL","548":"VU","554":"NZ","558":"NI","562":"NE","566":"NG","578":"NO","583":"FM","584":"MH","585":"PW","586":"PK","591":"PA","598":"PG","600":"PY","604":"PE","608":"PH","616":"PL","620":"PT","624":"GW","626":"TL","634":"QA","642":"RO","643":"RU","646":"RW","659":"KN","662":"LC","670":"VC","674":"SM","678":"ST","682":"SA","686":"SN","688":"RS","690":"SC","694":"SL","702":"SG","703":"SK","704":"VN","705":"SI","706":"SO","710":"ZA","716":"ZW","724":"ES","728":"SS","729":"SD","740":"SR","748":"SZ","752":"SE","756":"CH","760":"SY","762":"TJ","764":"TH","768":"TG","776":"TO","780":"TT","784":"AE","788":"TN","792":"TR","795":"TM","798":"TV","800":"UG","804":"UA","807":"MK","818":"EG","826":"GB","834":"TZ","840":"US","854":"BF","858":"UY","860":"UZ","862":"VE","882":"WS","887":"YE","894":"ZM"};

    // Qualité du vivier de jeunes par pays (1 à 5) — défaut : 1
    const TIERS = {
        5: 'BR AR FR ES',
        4: 'DE NL PT IT BE GB UY CO NG SN CI',
        3: 'HR RS DK SE NO CH AT PL UA TR MX US JP KR EG MA GH CM DZ TN CL EC',
        2: 'RU CZ SK HU RO BG GR IE SI BA ME MK AL GE BY ML BF GN CD ZA KE PY PE VE CR JM CA AU IR SA AE FI IS IL CY AM AZ CN'
    };
    const TIER = {};
    Object.keys(TIERS).forEach(t => TIERS[t].split(' ').forEach(c => { TIER[c] = +t; }));
    const tierOf = cc => TIER[cc] || 1;

    // Pays du championnat → code ISO
    const HOME_BY_COUNTRY = {
        england: 'GB', scotland: 'GB', gibraltar: 'GB', france: 'FR', germany: 'DE', italy: 'IT', spain: 'ES', greece: 'GR',
        austria: 'AT', switzerland: 'CH', denmark: 'DK', norway: 'NO', sweden: 'SE', poland: 'PL', croatia: 'HR',
        ukraine: 'UA', serbia: 'RS', romania: 'RO', portugal: 'PT', netherlands: 'NL', belgium: 'BE', turkey: 'TR',
        czech: 'CZ', israel: 'IL', cyprus: 'CY', albania: 'AL', andorra: 'AD', azerbaijan: 'AZ', bulgaria: 'BG',
        finland: 'FI', hungary: 'HU', iceland: 'IS', ireland: 'IE', luxembourg: 'LU', sanmarino: 'SM',
        slovakia: 'SK', slovenia: 'SI'
    };
    const homeCC = () => {
        try { return HOME_BY_COUNTRY[LEAGUES[G.leagueKey].country] || 'FR'; } catch (e) { return 'FR'; }
    };

    const names = (() => {
        try { return new Intl.DisplayNames(['fr'], { type: 'region' }); } catch (e) { return null; }
    })();
    const countryName = cc => { try { return (names && names.of(cc)) || cc; } catch (e) { return cc; } };
    const flagEmoji = cc => String.fromCodePoint(...[...cc].map(c => 127397 + c.charCodeAt(0)));
    window.flagEmoji = flagEmoji;
    // Vrai drapeau (image) — les emojis de drapeaux ne s'affichent pas sous Windows
    const flagImg = (cc, w) => {
        const c = cc.toLowerCase(), b = w <= 24 ? 40 : 80;
        return '<img class="sc-flag" style="width:' + w + 'px" alt="' + cc + '" src="https://flagcdn.com/w' + b + '/' + c + '.png" srcset="https://flagcdn.com/w' + b * 2 + '/' + c + '.png 2x" onerror="this.replaceWith(document.createTextNode(\'' + cc + '\'))">';
    };
    // Classement mondial FIFA masculin (juillet 2026, top 50). GB = rang de l'Angleterre.
    const FIFA = {ES:1,AR:2,FR:3,GB:4,BR:5,MA:6,PT:7,BE:8,NL:9,MX:10,CO:11,DE:12,HR:13,CH:14,IT:15,US:16,JP:17,SN:18,NO:19,UY:20,
        DK:21,IR:22,AT:23,EG:24,EC:25,NG:26,TR:27,AU:28,DZ:29,CA:30,CI:31,KR:32,UA:33,PY:34,RU:35,PL:36,SE:37,HU:39,RS:40,CD:41,
        CM:43,PA:44,SK:45,GR:46,VE:47,CZ:48,CL:49,PE:50,
        // hors top 50 : rangs approximatifs (dernières publications connues)
        QA:53,SA:60,ZA:61,JO:64,CV:67,GH:72,HT:84,NZ:87};
    const FIFA_APPROX = new Set(['QA','SA','ZA','JO','CV','GH','HT','NZ']);
    window.flagImg = flagImg;
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // toast() n'accepte que du texte : on le relance puis on y insère l'image du drapeau
    function toastFlag(before, cc, after, type) {
        toast(before + countryName(cc) + after, type);
        const el = document.getElementById('toast');
        if (el) el.innerHTML = esc(before) + flagImg(cc, 20) + ' ' + esc(countryName(cc)) + esc(after);
    }
    const rankText = r => r === 1 ? '1<sup>er</sup>' : r + '<sup>e</sup>';
    const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
    const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');

    // ---------- État ----------
    const ready = () => { try { return !!(G && G.squad); } catch (e) { return false; } };
    function init() {
        if (!G.scouts) G.scouts = [];
        if (!G.prospects) G.prospects = [];
        if (!G.scoutSeq) G.scoutSeq = 1;
    }
    const maxScouts = () => 2 + ((G.upgrades && G.upgrades.academy) || 0);
    const wageOf = skill => 120000 + skill * 80000;
    const feeOf = skill => skill * 350000;
    const findScout = id => G.scouts.find(s => s.id === id);

    // ---------- Distances, coûts ----------
    function dist(a, b) {                       // distance en km (haversine)
        const A = LL[a], B = LL[b];
        if (!A || !B) return 5000;
        const r = Math.PI / 180, dLat = (B[0] - A[0]) * r, dLon = (B[1] - A[1]) * r;
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(A[0] * r) * Math.cos(B[0] * r) * Math.sin(dLon / 2) ** 2;
        return 12742 * Math.asin(Math.sqrt(h));
    }
    const travelMatches = (a, b) => Math.max(1, Math.round(dist(a, b) / 5000));
    const travelCost = (a, b) => Math.round((50000 + dist(a, b) * 25) / 10000) * 10000;

    // ---------- Génération ----------
    function genCandidate() {
        const r = Math.random() * 100;
        const skill = r < 30 ? 1 : r < 60 ? 2 : r < 82 ? 3 : r < 94 ? 4 : 5;
        return { name: randName(), skill, wage: wageOf(skill), fee: feeOf(skill) };
    }
    function ensurePool() {
        const day = G.matchDay || 0;
        if (!G.scoutPool || !G.scoutPool.list || Math.abs(day - G.scoutPool.day) >= 5 || day < G.scoutPool.day) {
            G.scoutPool = { day, list: [genCandidate(), genCandidate(), genCandidate()] };
        }
        return G.scoutPool.list;
    }
    function genProspect(cc, scout) {
        const tier = tierOf(cc), sk = scout.skill;
        const age = rand(16, 19);
        const currentLevel = Math.min(70, rand(38 + tier * 3, 52 + tier * 4));
        const pot = Math.min(99, currentLevel + rand(8 + tier * 2, 22 + tier * 5) + sk);
        const width = Math.max(2, potWidth(age) - sk * 3);       // un bon recruteur affine la fourchette
        const pos = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT'][rand(0, 7)];
        const range = potRange(pot, currentLevel, age, width);
        const avg = (range.potMin + range.potMax) / 2;
        return Object.assign({
            id: 'p' + (G.scoutSeq++), name: randName(), pos, age, currentLevel, pot, potential: pot,
            origin: cc, foundBy: scout.name, fee: Math.round((avg - 40) * 60000 / 10000) * 10000, expires: 12
        }, range);
    }

    // ---------- Simulation (appelée après chaque match) ----------
    function note(title, body) {
        if (Array.isArray(G.news)) {
            G.news.unshift({ d: G.date, c: 'club', t: title, b: body || '', u: 1 });
            if (G.news.length > 90) G.news.length = 90;
        }
    }
    function nextFind(s) { return Math.max(2, rand(6, 9) - s.skill); }
    function tickScouts() {
        if (!ready()) return;
        init();
        G.scouts.forEach(s => {
            if (s.state === 'travel') {
                if (--s.eta <= 0) {
                    s.state = 'station'; s.loc = s.dest; s.timer = nextFind(s);
                    toastFlag(s.name + ' est arrivé : ', s.loc, '', 'info');
                    note('Recruteur sur place', s.name + ' est arrivé à destination : ' + countryName(s.loc) + '.');
                }
            } else if (s.state === 'return') {
                if (--s.eta <= 0) { s.state = 'home'; s.loc = null; toast(s.name + ' est de retour au club', 'info'); }
            } else if (s.state === 'station') {
                if (--s.timer <= 0) {
                    const p = genProspect(s.loc, s);
                    G.prospects.unshift(p);
                    if (G.prospects.length > 8) G.prospects.length = 8;
                    s.timer = nextFind(s);
                    toastFlag('🔭 ' + s.name + ' a repéré ' + p.name + ' (', p.origin, ')', 'success');
                    note('Jeune talent repéré : ' + p.name, p.pos + ', ' + p.age + ' ans, ' + countryName(p.origin) + ' — pot. ' + potText(p) + '. Repéré par ' + s.name + '.');
                }
            }
        });
        const before = G.prospects.length;
        G.prospects.forEach(p => { p.expires--; });
        G.prospects = G.prospects.filter(p => p.expires > 0);
        if (G.prospects.length < before) toast('Une piste a été récupérée par un autre club…', 'error');
        const tab = document.getElementById('tab-formation');
        if (tab && tab.classList.contains('active')) renderFormation();
    }
    window.tickScouts = tickScouts;
    window.scoutPayroll = () => (ready() && G.scouts ? G.scouts.reduce((t, s) => t + s.wage, 0) : 0);

    // ---------- Fenêtre modale ----------
    let overlay = null, mapState = null;
    function openModal(html, cls) {
        closeModal();
        overlay = document.createElement('div');
        overlay.className = 'sc-overlay';
        overlay.innerHTML = '<div class="sc-modal ' + (cls || '') + '">' + html + '</div>';
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
        document.body.appendChild(overlay);
        document.addEventListener('keydown', escClose);
    }
    function escClose(e) { if (e.key === 'Escape') closeModal(); }
    function closeModal() {
        if (mapState && mapState.pz) mapState.pz.cleanup();
        if (mapState && mapState.tipClear) mapState.tipClear();
        if (overlay) { overlay.remove(); overlay = null; }
        mapState = null;
        document.removeEventListener('keydown', escClose);
    }

    // ---------- Section dans l'onglet Formation ----------
    function statusText(s) {
        if (s.state === 'travel') return '✈️ En route vers ' + flagImg(s.dest, 20) + ' ' + countryName(s.dest) + ' · arrivée dans ' + plural(s.eta, 'match');
        if (s.state === 'station') return '📍 En poste : ' + flagImg(s.loc, 20) + ' ' + countryName(s.loc) + ' · prochaine piste dans ' + plural(s.timer, 'match');
        if (s.state === 'return') return '↩️ Retour au club · ' + plural(s.eta, 'match');
        return '🏠 Au club — disponible';
    }
    function sectionHTML() {
        init();
        const max = maxScouts();
        const cards = G.scouts.map(s =>
            '<div class="sc-card st-' + s.state + '" onclick="SC.menu(' + s.id + ')">' +
            '<div class="sc-ava">🧑‍💼</div><div class="sc-body"><div class="sc-name">' + s.name + '</div>' +
            '<div class="sc-stars" title="Compétence">' + stars(s.skill) + '</div>' +
            '<div class="sc-status">' + statusText(s) + '</div>' +
            '<div class="sc-wage">' + fmtMoney(s.wage) + ' / paie</div></div></div>').join('');
        const empty = G.scouts.length ? '' : '<div class="sc-empty">Aucun recruteur. Engagez-en un pour partir à la chasse aux jeunes talents dans le monde entier.</div>';
        const hireBtn = '<button class="sc-btn" ' + (G.scouts.length >= max ? 'disabled title="Améliorez le centre de formation pour en engager plus"' : '') + ' onclick="SC.hire()">＋ Engager un recruteur</button>';
        let html = '<div class="sc-section"><div class="sc-head"><h3>🔭 Réseau de recruteurs</h3><span class="sc-count">' + G.scouts.length + '/' + max + '</span>' + hireBtn + '</div>' +
            '<div class="sc-grid">' + cards + '</div>' + empty + '</div>';
        if (G.prospects.length) {
            html += '<div class="sc-section"><div class="sc-head"><h3>🌍 Jeunes repérés</h3><span class="sc-count">' + G.prospects.length + '</span></div><div class="sc-grid">' +
                G.prospects.map(p => {
                    ensurePot(p);
                    return '<div class="sc-pros"><div class="sc-pname">' + flagImg(p.origin, 22) + ' ' + p.name + '</div>' +
                        '<div class="sc-pmeta"><span class="pos-badge ' + p.pos + '">' + p.pos + '</span> ' + p.age + ' ans · ' + countryName(p.origin) + '</div>' +
                        levelBarHTML({ level: p.currentLevel, potMin: p.potMin, potMax: p.potMax, pot: p.pot }) +
                        '<div class="sc-prow"><span>Note <strong>' + p.currentLevel + '</strong></span><span>Pot. <strong style="color:' + potColor(p) + '">' + potText(p) + '</strong></span></div>' +
                        '<div class="sc-pmeta">Repéré par ' + p.foundBy + ' · expire dans ' + plural(p.expires, 'match') + '</div>' +
                        '<button class="sc-btn go" ' + (G.money < p.fee ? 'disabled' : '') + ' onclick="SC.sign(\'' + p.id + '\')">Recruter — ' + fmtMoney(p.fee) + '</button></div>';
                }).join('') + '</div></div>';
        }
        return html;
    }
    function inject() {
        if (!ready()) return;
        const el = document.getElementById('formation-content');
        const head = el && el.querySelector('.academy-header');
        if (head) head.insertAdjacentHTML('afterend', sectionHTML());
        loadGeo();
    }
    if (typeof renderFormation === 'function') {
        const orig = renderFormation;
        window.renderFormation = function () { orig.apply(this, arguments); inject(); };
    }

    // ---------- Embauche ----------
    function hireModal() {
        init();
        const list = ensurePool();
        const full = G.scouts.length >= maxScouts();
        const rows = list.map((c, i) =>
            '<div class="sc-cand"><div class="sc-ava">🧑‍💼</div><div class="sc-body"><div class="sc-name">' + c.name + '</div>' +
            '<div class="sc-stars">' + stars(c.skill) + '</div>' +
            '<div class="sc-wage">Paie : ' + fmtMoney(c.wage) + ' · Prime d\'embauche : ' + fmtMoney(c.fee) + '</div></div>' +
            '<button class="sc-btn go" ' + (full || G.money < c.fee ? 'disabled' : '') + ' onclick="SC.hireOne(' + i + ')">Engager</button></div>').join('');
        openModal('<h3>Engager un recruteur</h3><p class="sc-help">Plus un recruteur est expérimenté, plus il trouve vite de bons jeunes et plus la fourchette de potentiel de ses pistes est précise. ' +
            (full ? '<b>Effectif complet</b> : améliorez le centre de formation pour en engager davantage.' : 'La liste change tous les 5 matchs.') + '</p>' + rows +
            '<div class="sc-actions"><button class="sc-btn" onclick="SC.close()">Fermer</button></div>');
    }
    function hireOne(i) {
        const c = (G.scoutPool && G.scoutPool.list || [])[i];
        if (!c || G.scouts.length >= maxScouts()) return;
        if (G.money < c.fee) { toast('Budget insuffisant !', 'error'); return; }
        G.money -= c.fee;
        G.scouts.push({ id: G.scoutSeq++, name: c.name, skill: c.skill, wage: c.wage, state: 'home', loc: null, dest: null, eta: 0, timer: 0 });
        G.scoutPool.list.splice(i, 1);
        updateTopBar();
        toast(c.name + ' rejoint le réseau de recruteurs', 'success');
        closeModal();
        renderFormation();
    }

    // ---------- Menu d'un recruteur ----------
    function menu(id) {
        const s = findScout(id);
        if (!s) return;
        const away = s.state === 'station';
        const canSend = s.state === 'home' || s.state === 'station';
        openModal('<h3>' + s.name + ' <span class="sc-stars">' + stars(s.skill) + '</span></h3>' +
            '<p class="sc-help">' + statusText(s) + '<br>Paie : ' + fmtMoney(s.wage) + ' à chaque versement des salaires.</p>' +
            '<div class="sc-menu">' +
            '<button class="sc-btn go" ' + (canSend ? '' : 'disabled') + ' onclick="SC.pick(' + id + ')">🌍 Envoyer quelque part</button>' +
            (away || s.state === 'travel' ? '<button class="sc-btn" onclick="SC.recall(' + id + ')">↩️ Rappeler au club</button>' : '') +
            '<button class="sc-btn danger" onclick="SC.fire(' + id + ')">❌ Virer</button>' +
            '<button class="sc-btn" onclick="SC.close()">Fermer</button></div>' +
            (canSend ? '' : '<p class="sc-help">Il est en déplacement : attendez son arrivée pour lui donner une nouvelle mission.</p>'));
    }
    function recall(id) {
        const s = findScout(id);
        if (!s) return;
        const from = s.state === 'travel' ? s.dest : s.loc;
        s.state = 'return'; s.eta = travelMatches(from || homeCC(), homeCC()); s.loc = from;
        closeModal(); renderFormation();
        toast(s.name + ' rentre au club', 'info');
    }
    function fire(id) {
        const s = findScout(id);
        if (!s || !confirm('Virer ' + s.name + ' ? Sa prime d\'embauche ne sera pas remboursée.')) return;
        G.scouts = G.scouts.filter(x => x.id !== id);
        closeModal(); renderFormation();
        toast(s.name + ' a été licencié', 'info');
    }

    // ---------- Carte du monde ----------
    const $ = id => document.getElementById(id);
    const scoutsAt = cc => G.scouts.filter(sc => sc.loc === cc || (sc.state === 'travel' && sc.dest === cc));
    const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    function matches(q) {
        q = norm(q.trim());
        if (!q) return Object.keys(MAP);
        return Object.keys(MAP).filter(cc => norm(countryName(cc)).includes(q) || cc.toLowerCase() === q);
    }
    function filter(q) {
        if (!overlay) return;
        const ok = new Set(matches(q));
        overlay.querySelectorAll('.wm-t').forEach(t => t.classList.toggle('dim', !ok.has(t.dataset.cc)));
    }

    // Carte de secours (hors connexion) : une tuile par pays
    function tileSVG() {
        const P = 34, T = 31, home = homeCC();
        let s = '<svg class="wm" viewBox="0 0 ' + (COLS * P + 2) + ' ' + (ROWS * P + 2) + '" role="img" aria-label="Carte du monde">';
        Object.keys(MAP).forEach(cc => {
            const x = MAP[cc][0] * P + 1, y = MAP[cc][1] * P + 1;
            const here = scoutsAt(cc).length;
            s += '<g class="wm-t t' + tierOf(cc) + (cc === home ? ' home' : '') + '" data-cc="' + cc + '">' +
                '<rect x="' + x + '" y="' + y + '" width="' + T + '" height="' + T + '" rx="4"/>' +
                '<text x="' + (x + T / 2) + '" y="' + (y + T / 2 + 4) + '">' + cc + '</text>' +
                (here ? '<circle cx="' + (x + T - 3) + '" cy="' + (y + 4) + '" r="6.5" class="wm-pin"/><text class="wm-pint" x="' + (x + T - 3) + '" y="' + (y + 7.2) + '">' + here + '</text>' : '') +
                '</g>';
        });
        return s + '</svg>';
    }

    // Vraies frontières : TopoJSON « world-atlas » (Natural Earth), chargé une fois puis mis en cache
    const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
    const GEO_KEY = 'fm_world_topo_v1';
    const SC_PX = 180;
    let GEO = null, geoPromise = null;

    function proj(lon, lat) {                    // projection Natural Earth
        const l = lon * Math.PI / 180, p = lat * Math.PI / 180, p2 = p * p, p4 = p2 * p2;
        const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
        const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
        return [x * SC_PX, -y * SC_PX];
    }
    function buildGeo(topo) {
        const obj = topo.objects.countries || topo.objects[Object.keys(topo.objects)[0]];
        const geoms = obj.geometries || [obj];
        const tr = topo.transform;
        const arcs = topo.arcs.map(a => {
            if (!tr) return a;
            let x = 0, y = 0;
            return a.map(p => { x += p[0]; y += p[1]; return [x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]]; });
        });
        const arcAt = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
        const ring = ids => { let pts = []; ids.forEach((i, k) => { const a = arcAt(i); pts = pts.concat(k ? a.slice(1) : a); }); return pts; };
        const ringPath = pts => {
            let prev = null, d = '';
            pts.forEach((p, i) => {
                let lon = p[0];
                if (prev !== null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; }
                prev = lon;
                const q = proj(lon, p[1]);
                d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
            });
            return d + 'Z';
        };
        const paths = {}, bg = [];
        geoms.forEach(g => {
            const id = g.id === undefined || g.id === null ? '' : String(g.id).padStart(3, '0');
            if (id === '010') return;                                    // Antarctique
            const cc = NUM[id];
            const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
            const d = polys.map(poly => poly.map(r => ringPath(ring(r))).join('')).join('');
            if (!d) return;
            if (cc && LL[cc]) paths[cc] = (paths[cc] || '') + d; else bg.push(d);
        });
        if (Object.keys(paths).length < 3) throw new Error('géodonnées inattendues');
        const x1 = proj(-180, 0)[0], x2 = proj(180, 0)[0], y1 = proj(0, 84)[1], y2 = proj(0, -57)[1];
        const pts = {};
        Object.keys(LL).forEach(cc => { pts[cc] = proj(LL[cc][1], LL[cc][0]); });
        return { paths, bg: bg.join(''), view: { x: x1 - 2, y: y1 - 2, w: x2 - x1 + 4, h: y2 - y1 + 4 }, pts };
    }
    function loadGeo() {
        if (GEO) return Promise.resolve(GEO);
        if (geoPromise) return geoPromise;
        geoPromise = (async () => {
            let topo = window.WORLD_TOPO || null;
            if (!topo) { try { const c = localStorage.getItem(GEO_KEY); if (c) topo = JSON.parse(c); } catch (e) { topo = null; } }
            if (!topo) {
                try {
                    const ctl = new AbortController();
                    const to = setTimeout(() => ctl.abort(), 10000);
                    const r = await fetch(GEO_URL, { signal: ctl.signal });
                    clearTimeout(to);
                    if (!r.ok) throw new Error('http ' + r.status);
                    const txt = await r.text();
                    topo = JSON.parse(txt);
                    try { buildGeo(topo); localStorage.setItem(GEO_KEY, txt); } catch (e) { /* cache indisponible */ }
                } catch (e) { geoPromise = null; return null; }
            }
            try { GEO = buildGeo(topo); } catch (e) { GEO = null; try { localStorage.removeItem(GEO_KEY); } catch (_) { } }
            if (!GEO) geoPromise = null;
            return GEO;
        })();
        return geoPromise;
    }
    function geoSVG(geo) {
        const home = homeCC(), v = geo.view;
        let s = '<svg class="wm geo" viewBox="' + v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h + '" role="img" aria-label="Carte du monde"><path class="wm-bg" d="' + geo.bg + '"/>';
        Object.keys(MAP).forEach(cc => {
            const cls = 'wm-t t' + tierOf(cc) + (cc === home ? ' home' : '');
            if (geo.paths[cc]) s += '<path class="' + cls + ' wm-c" data-cc="' + cc + '" d="' + geo.paths[cc] + '"/>';
            else if (geo.pts[cc]) s += '<circle class="' + cls + ' wm-dot" data-cc="' + cc + '" cx="' + geo.pts[cc][0].toFixed(1) + '" cy="' + geo.pts[cc][1].toFixed(1) + '" r="4"/>';
        });
        s += '<g class="wm-pins">';
        Object.keys(geo.pts).forEach(cc => {
            const n = scoutsAt(cc).length;
            if (n) s += '<g class="wm-pin-g" data-x="' + geo.pts[cc][0].toFixed(1) + '" data-y="' + geo.pts[cc][1].toFixed(1) + '" transform="translate(' + geo.pts[cc][0].toFixed(1) + ' ' + geo.pts[cc][1].toFixed(1) + ')"><circle r="7" class="wm-pin"/><text class="wm-pint" y="3.3">' + n + '</text></g>';
        });
        return s + '</g></svg>';
    }

    // Zoom (molette / boutons) et déplacement (glisser)
    function attachPanZoom(svg, geo) {
        const base = geo.view;
        const vb = { x: base.x, y: base.y, w: base.w, h: base.h };
        const dots = [...svg.querySelectorAll('.wm-dot')], pins = [...svg.querySelectorAll('.wm-pin-g')];
        let drag = null, moved = false;
        function apply() {
            vb.w = Math.min(base.w, Math.max(base.w / 14, vb.w));
            vb.h = vb.w * base.h / base.w;
            vb.x = Math.min(base.x + base.w - vb.w, Math.max(base.x, vb.x));
            vb.y = Math.min(base.y + base.h - vb.h, Math.max(base.y, vb.y));
            svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
            const f = 1 / Math.pow(base.w / vb.w, 0.65);
            dots.forEach(d => d.setAttribute('r', (4 * f).toFixed(2)));
            pins.forEach(p => p.setAttribute('transform', 'translate(' + p.dataset.x + ' ' + p.dataset.y + ') scale(' + f.toFixed(3) + ')'));
        }
        function zoomAt(f, cx, cy) {
            const r = svg.getBoundingClientRect();
            const px = vb.x + (cx - r.left) / r.width * vb.w, py = vb.y + (cy - r.top) / r.height * vb.h;
            const nw = Math.min(base.w, Math.max(base.w / 14, vb.w * f)), k = nw / vb.w;
            vb.x = px - (px - vb.x) * k; vb.y = py - (py - vb.y) * k; vb.w = nw;
            apply();
        }
        const onWheel = e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 0.8 : 1.25, e.clientX, e.clientY); };
        const onDown = e => { if (e.button === 0) { drag = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; moved = false; } };
        const onMove = e => {
            if (!drag) return;
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            if (Math.hypot(dx, dy) > 4) { moved = true; svg.classList.add('drag'); }
            if (!moved) return;
            const r = svg.getBoundingClientRect();
            vb.x = drag.vx - dx * vb.w / r.width; vb.y = drag.vy - dy * vb.h / r.height;
            apply();
        };
        const onUp = () => { drag = null; svg.classList.remove('drag'); setTimeout(() => { moved = false; }, 0); };
        svg.addEventListener('wheel', onWheel, { passive: false });
        svg.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        apply();
        return {
            moved: () => moved,
            zoomBy: f => { const r = svg.getBoundingClientRect(); zoomAt(f, r.left + r.width / 2, r.top + r.height / 2); },
            reset: () => { vb.x = base.x; vb.y = base.y; vb.w = base.w; apply(); },
            focus: cc => {
                const p = geo.pts[cc]; if (!p) return;
                vb.w = base.w / 5; vb.h = vb.w * base.h / base.w;
                vb.x = p[0] - vb.w / 2; vb.y = p[1] - vb.h / 2;
                apply();
            },
            cleanup: () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); }
        };
    }

    // Infobulle au survol : drapeau, classement FIFA, infos de recrutement + bouton d'envoi
    function tipHTML(cc) {
        const s = findScout(mapState.id);
        const from = s.loc || homeCC();
        const here = scoutsAt(cc).map(x => x.name);
        const cost = travelCost(from, cc);
        const same = cc === s.loc;
        const poor = !same && G.money < cost;
        const r = FIFA[cc];
        const rank = r
            ? (FIFA_APPROX.has(cc) ? '≈ ' : '') + rankText(r) + (cc === 'GB' ? ' <small>(Angleterre)</small>' : '')
            : '<small>hors top 50</small>';
        const src = r ? (FIFA_APPROX.has(cc) ? 'Rang FIFA estimé' : 'Classement FIFA · juillet 2026') : 'Classement FIFA · juillet 2026';
        return '<div class="sc-tip-head">' + flagImg(cc, 44) + '<div><div class="sc-tip-name">' + countryName(cc) + '</div>' +
            '<div class="sc-tip-sub">' + cc + (cc === homeCC() ? ' · votre pays' : '') + '</div></div></div>' +
            '<div class="sc-tip-rank"><span>Classement FIFA</span><b>' + rank + '</b></div>' +
            '<div class="sc-tip-grid"><span>Vivier de jeunes</span><b class="sc-stars">' + stars(tierOf(cc)) + '</b>' +
            '<span>Trajet</span><b>' + (same ? 'Déjà sur place' : plural(travelMatches(from, cc), 'match')) + '</b>' +
            '<span>Frais de voyage</span><b>' + fmtMoney(cost) + '</b>' +
            '<span>Recruteurs</span><b>' + (here.length ? here.join(', ') : '—') + '</b></div>' +
            '<button class="sc-btn go" data-send="' + cc + '"' + (same || poor ? ' disabled' : '') + '>' +
            (same ? s.name + ' est déjà ici' : poor ? 'Budget insuffisant' : 'Envoyer ' + s.name + ' ici') + '</button>' +
            '<div class="sc-tip-note">' + src + '</div>';
    }
    function wireMap(svg) {
        const tileOf = e => e.target.closest && e.target.closest('.wm-t');
        const tip = document.createElement('div');
        tip.className = 'sc-tip';
        tip.hidden = true;
        overlay.appendChild(tip);
        let cur = null, timer = null, mx = 0, my = 0;
        mapState.tipClear = () => clearTimeout(timer);
        const hide = () => { clearTimeout(timer); tip.hidden = true; cur = null; };
        const hideLater = ms => { clearTimeout(timer); timer = setTimeout(hide, ms); };
        function show(cc) {
            if (!mapState || !overlay) return;
            cur = cc;
            tip.innerHTML = tipHTML(cc);
            tip.hidden = false;
            const w = tip.offsetWidth, h = tip.offsetHeight, g = 8;
            let x = mx + g, y = my + g;
            if (x + w > window.innerWidth - 8) x = mx - w - g;
            if (y + h > window.innerHeight - 8) y = my - h - g;
            tip.style.left = Math.max(8, x) + 'px';
            tip.style.top = Math.max(8, y) + 'px';
        }
        svg.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        svg.addEventListener('mouseover', e => {
            const t = tileOf(e); if (!t) return;
            const cc = t.dataset.cc;
            showInfo(cc, false);
            clearTimeout(timer);
            if (svg.classList.contains('drag') || cc === cur) return;
            // petit délai : laisse le temps d'atteindre l'infobulle sans qu'elle change de pays
            timer = setTimeout(() => show(cc), cur ? 180 : 100);
        });
        svg.addEventListener('mouseout', e => { if (tileOf(e)) hideLater(280); });
        svg.addEventListener('mouseleave', () => {
            if (!mapState) return;
            if (mapState.sel) showInfo(mapState.sel, true);
            else $('sc-info').innerHTML = '<span class="sc-help">Survolez ou cliquez sur un pays pour voir ses détails.</span>';
        });
        svg.addEventListener('pointerdown', hide);
        svg.addEventListener('wheel', hide, { passive: true });
        tip.addEventListener('mouseenter', () => clearTimeout(timer));
        tip.addEventListener('mouseleave', () => hideLater(250));
        tip.addEventListener('click', e => {
            const b = e.target.closest && e.target.closest('button[data-send]');
            if (!b || b.disabled) return;
            mapState.sel = b.dataset.send;
            hide();
            send();
        });
        svg.addEventListener('click', e => {
            if (mapState.pz && mapState.pz.moved()) return;
            const t = tileOf(e); if (!t) return;
            select(t.dataset.cc, false);
            mx = e.clientX; my = e.clientY;
            clearTimeout(timer);
            show(t.dataset.cc);                       // aussi au toucher (écrans tactiles)
        });
    }
    function pick(id) {
        const s = findScout(id);
        if (!s) return;
        openModal('<h3>🌍 Envoyer ' + s.name + ' <span class="sc-stars">' + stars(s.skill) + '</span></h3>' +
            '<div class="sc-mapbar"><input id="sc-search" type="text" placeholder="Rechercher un pays (ex. Brésil, Japon, Sénégal…) puis Entrée" autocomplete="off">' +
            '<div class="sc-legend"><span>Vivier de jeunes :</span><i class="t1"></i><i class="t2"></i><i class="t3"></i><i class="t4"></i><i class="t5"></i><span>faible → excellent</span><i class="home"></i><span>votre pays</span></div></div>' +
            '<div class="sc-mapwrap" id="sc-mapwrap"><div class="sc-loading">Chargement de la carte…</div></div>' +
            '<div class="sc-info" id="sc-info"><span class="sc-help">Survolez ou cliquez sur un pays pour voir ses détails.</span></div>' +
            '<div class="sc-actions"><button class="sc-btn" onclick="SC.close()">Annuler</button>' +
            '<button class="sc-btn go" id="sc-send" disabled onclick="SC.send()">Envoyer</button></div>', 'wide');
        mapState = { id, sel: null, pz: null };
        const input = $('sc-search');
        input.addEventListener('input', () => filter(input.value));
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { const m = matches(input.value); if (m.length) select(m[0], true); } });
        input.focus();
        loadGeo().then(geo => {
            if (!mapState || mapState.id !== id || !overlay) return;
            const wrap = $('sc-mapwrap');
            if (geo) {
                wrap.innerHTML = geoSVG(geo) +
                    '<div class="wm-zoom"><button data-z="in" title="Zoom +">+</button><button data-z="out" title="Zoom −">−</button><button data-z="reset" title="Vue du monde">⟲</button></div>' +
                    '<div class="wm-hint">Molette : zoom · Glisser : déplacer</div>';
                const svg = wrap.querySelector('svg');
                mapState.pz = attachPanZoom(svg, geo);
                wrap.querySelector('.wm-zoom').addEventListener('click', e => {
                    const z = e.target.dataset && e.target.dataset.z;
                    if (z === 'in') mapState.pz.zoomBy(0.6); else if (z === 'out') mapState.pz.zoomBy(1.6); else if (z === 'reset') mapState.pz.reset();
                });
                wireMap(svg);
            } else {
                wrap.innerHTML = tileSVG() + '<div class="wm-hint show">Carte simplifiée : les frontières n\'ont pas pu être chargées (connexion nécessaire la première fois).</div>';
                wireMap(wrap.querySelector('svg'));
            }
            filter(input.value);
            if (mapState.sel) select(mapState.sel, false);
        });
    }
    function showInfo(cc, locked) {
        const s = findScout(mapState.id);
        const from = s.loc || homeCC();
        const here = scoutsAt(cc).map(x => x.name);
        const tier = tierOf(cc);
        $('sc-info').innerHTML = '<div class="sc-ctitle">' + flagImg(cc, 24) + ' ' + countryName(cc) + ' <small>' + cc + '</small>' + (locked ? ' <em>sélectionné</em>' : '') + '</div>' +
            '<div class="sc-cgrid"><span>Vivier de jeunes</span><b>' + stars(tier) + '</b>' +
            '<span>Trajet</span><b>' + (cc === s.loc ? 'Déjà sur place' : plural(travelMatches(from, cc), 'match')) + '</b>' +
            '<span>Frais de voyage</span><b>' + fmtMoney(travelCost(from, cc)) + '</b>' +
            '<span>Recruteurs</span><b>' + (here.length ? here.join(', ') : '—') + '</b></div>';
    }
    function select(cc, zoom) {
        mapState.sel = cc;
        overlay.querySelectorAll('.wm-t').forEach(t => t.classList.toggle('sel', t.dataset.cc === cc));
        if (zoom && mapState.pz) mapState.pz.focus(cc);
        showInfo(cc, true);
        const s = findScout(mapState.id);
        const btn = $('sc-send');
        btn.disabled = cc === s.loc;
        btn.textContent = 'Envoyer en ' + countryName(cc);
    }
    function send() {
        const s = findScout(mapState && mapState.id);
        if (!s || !mapState.sel) return;
        const cc = mapState.sel, from = s.loc || homeCC();
        const cost = travelCost(from, cc);
        if (G.money < cost) { toast('Budget insuffisant pour le voyage !', 'error'); return; }
        G.money -= cost;
        s.state = 'travel'; s.dest = cc; s.eta = travelMatches(from, cc); s.timer = 0;
        updateTopBar();
        closeModal(); renderFormation();
        toastFlag(s.name + ' part pour ', cc, ' (' + fmtMoney(cost) + ')', 'success');
    }

    // ---------- Recrutement d'une piste ----------
    function sign(pid) {
        init();
        const p = G.prospects.find(x => x.id === pid);
        if (!p) return;
        if (G.money < p.fee) { toast('Budget insuffisant !', 'error'); return; }
        const maxSlots = 2 + ((G.upgrades && G.upgrades.academy) || 0);
        const active = (G.youthPlayers || []).filter(y => !y.graduated);
        let victim = null;
        if (active.length >= maxSlots) {
            victim = active.slice().sort((a, b) => (ensurePot(a).potMin + a.potMax) - (ensurePot(b).potMin + b.potMax))[0];
            if (!confirm('Le centre est plein. ' + victim.name + ' (pot. ' + potText(victim) + ') sera libéré pour faire de la place. Continuer ?')) return;
            G.youthPlayers.splice(G.youthPlayers.indexOf(victim), 1);
        }
        G.money -= p.fee;
        G.youthPlayers.push({
            name: p.name, pos: p.pos, age: p.age, pot: p.pot, potential: p.pot, potMin: p.potMin, potMax: p.potMax,
            currentLevel: p.currentLevel, progress: rand(0, 15), graduated: false, origin: p.origin
        });
        G.prospects = G.prospects.filter(x => x.id !== pid);
        updateTopBar();
        renderFormation();
        toast(p.name + ' intègre le centre de formation !', 'success');
    }

    window.SC = { hire: hireModal, hireOne, menu, pick, recall, fire, send, sign, close: closeModal };
})();
