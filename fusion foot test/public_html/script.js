// ======================================================
//  Football Manager 2025-2026 — Optimised build
//  Key changes vs original:
//  • DOM element cache (_el) avoids repeated getElementById
//  • Module-level PROFILE_LABELS/PROFILE_CLS (shared)
//  • getRank() result memoized per matchDay
//  • showTab uses dispatch map instead of if-chain
//  • Post-match btn logic deduplicated via _setPostMatchBtn()
//  • Drag listeners use event delegation (no per-element leak)
//  • fmtMoney avoids redundant toFixed on whole millions
//  • Duplicate Rayo Vallecano in LaLiga corrected
//  • cal-match-row::before CSS deduplicated
//  • Dead _orig* patch references removed
//  • Google Fonts loaded non-blocking
// ======================================================
//  DATA
// ======================================================
// ======================================================
//  LOGOS DES CLUBS (image/premier_league/*.png)
// ======================================================
const CLUB_LOGOS = {
    "Arsenal": "arsenal", "Aston Villa": "astonvilla", "Chelsea": "chelsea",
    "Hull City": "hullcity", "Sunderland": "sunderland", "Liverpool": "liverpool",
    "Coventry City": "coventry", "Newcastle United": "newcastle",
    "Manchester City": "manchestercity", "Manchester United": "manchesterunited",
    "Leeds United": "leeds", "Crystal Palace": "crystalpalace",
    "Bournemouth": "bournemouth", "Brighton": "brighton",
    "Nottingham Forest": "nottingham", "Ipswich Town": "ipswich",
    "Everton": "everton", "Brentford": "brentford", "Fulham": "fulham", "Tottenham": "tottenham", "Birmingham City": "birminghamcity",
    "Blackburn Rovers": "blackburn",
    "Bolton Wanderers": "bolton",
    "Bristol City": "bristol",
    "Burnley": "burnley",
    "Cardiff City": "cardiff",
    "Charlton Athletic": "charlton",
    "Derby County": "derby",
    "Lincoln City": "lincoln",
    "Middlesbrough": "middlesbrough",
    "Millwall": "millwall",
    "Norwich City": "norwich",
    "Portsmouth": "portsmouth",
    "Preston North End": "preston",
    "Queens Park Rangers": "qpr",
    "Sheffield United": "sheffield",
    "Southampton": "southampton",
    "Stoke City": "stoke",
    "Swansea City": "swansea",
    "Watford": "watford",
    "West Bromwich Albion": "bromwich",
    "West Ham United": "westham",
    "Wolverhampton Wanderers": "wolverhampton",
    "Wrexham": "wrexham","Angers SCO": "angers", "AJ Auxerre": "auxerre", "Stade Brestois": "brest", "Le Havre AC": "lehavre", "RC Lens": "lens", "LOSC Lille": "lille", "FC Lorient": "lorient", "Olympique Lyonnais": "lyon", "Le Mans FC": "lemans", "Olympique de Marseille": "marseille", "AS Monaco": "monaco", "OGC Nice": "nice", "Paris FC": "pfc", "Paris Saint-Germain": "psg", "Stade Rennais": "rennes", "RC Strasbourg": "strasbourg", "Toulouse FC": "toulouse", "ESTAC Troyes": "troyes"
};
// Renvoie le logo (img) si on l'a, sinon l'emoji de secours
function crest(name, emoji, size) {
    const f = CLUB_LOGOS[name];
    emoji = emoji || "";
    if (!f)
        return emoji;
    const px = size || 20;
    return `<img class="crest clickable-club" onclick="openClubModal('${name.replace(/'/g, "\\'")}')" src="image/logo_club/${f}.png" alt="" style="width:${px}px;height:${px}px" onerror="this.replaceWith(document.createTextNode('${emoji}'))">`;
}

// ======================================================
//  PAYS D'EUROPE (UEFA) — DONNÉES & DRAPEAUX COMPATIBLES PC
// ======================================================
const EUROPEAN_COUNTRIES = {
    england: { name: "Angleterre", code: "gb-eng", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", fifaRank: 4, coeff: 104.3, cups: 1 },
    france: { name: "France", code: "fr", emoji: "🇫🇷", fifaRank: 2, coeff: 68.2, cups: 2 },
    germany: { name: "Allemagne", code: "de", emoji: "🇩🇪", fifaRank: 11, coeff: 76.5, cups: 4 },
    spain: { name: "Espagne", code: "es", emoji: "🇪🇸", fifaRank: 3, coeff: 79.1, cups: 1 },
    italy: { name: "Italie", code: "it", emoji: "🇮🇹", fifaRank: 9, coeff: 83.4, cups: 4 },
    portugal: { name: "Portugal", code: "pt", emoji: "🇵🇹", fifaRank: 7, coeff: 57.8, cups: 0 },
    netherlands: { name: "Pays-Bas", code: "nl", emoji: "🇳🇱", fifaRank: 8, coeff: 60.1, cups: 0 },
    belgium: { name: "Belgique", code: "be", emoji: "🇧🇪", fifaRank: 6, coeff: 49.6, cups: 0 },
    turkey: { name: "Turquie", code: "tr", emoji: "🇹🇷", fifaRank: 26, coeff: 40.1, cups: 0 },
    scotland: { name: "Écosse", code: "gb-sct", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", fifaRank: 48, coeff: 31.9, cups: 0 },
    greece: { name: "Grèce", code: "gr", emoji: "🇬🇷", fifaRank: 42, coeff: 31.5, cups: 0 },
    austria: { name: "Autriche", code: "at", emoji: "🇦🇹", fifaRank: 22, coeff: 32.8, cups: 0 },
    switzerland: { name: "Suisse", code: "ch", emoji: "🇨🇭", fifaRank: 15, coeff: 32.7, cups: 0 },
    denmark: { name: "Danemark", code: "dk", emoji: "🇩🇰", fifaRank: 20, coeff: 32.2, cups: 0 },
    norway: { name: "Norvège", code: "no", emoji: "🇳🇴", fifaRank: 43, coeff: 33.2, cups: 0 },
    sweden: { name: "Suède", code: "se", emoji: "🇸🇪", fifaRank: 28, coeff: 23.5, cups: 0 },
    poland: { name: "Pologne", code: "pl", emoji: "🇵🇱", fifaRank: 31, coeff: 29.3, cups: 0 },
    croatia: { name: "Croatie", code: "hr", emoji: "🇭🇷", fifaRank: 12, coeff: 26.5, cups: 0 },
    ukraine: { name: "Ukraine", code: "ua", emoji: "🇺🇦", fifaRank: 24, coeff: 28.0, cups: 0 },
    serbia: { name: "Serbie", code: "rs", emoji: "🇷🇸", fifaRank: 35, coeff: 28.7, cups: 0 },
    romania: { name: "Roumanie", code: "ro", emoji: "🇷🇴", fifaRank: 45, coeff: 19.5, cups: 0 },
    czech: { name: "Rép. Tchèque", code: "cz", emoji: "🇨🇿", fifaRank: 34, coeff: 39.8, cups: 0 },
    czechrepublic: { name: "Rép. Tchèque", code: "cz", emoji: "🇨🇿", fifaRank: 34, coeff: 39.8, cups: 0 },
    israel: { name: "Israël", code: "il", emoji: "🇮🇱", fifaRank: 78, coeff: 31.1, cups: 0 },
    cyprus: { name: "Chypre", code: "cy", emoji: "🇨🇾", fifaRank: 125, coeff: 22.8, cups: 0 },
    hungary: { name: "Hongrie", code: "hu", emoji: "🇭🇺", fifaRank: 32, coeff: 22.8, cups: 0 },
    bulgaria: { name: "Bulgarie", code: "bg", emoji: "🇧🇬", fifaRank: 81, coeff: 14.5, cups: 0 },
    slovakia: { name: "Slovaquie", code: "sk", emoji: "🇸🇰", fifaRank: 44, coeff: 21.3, cups: 0 },
    azerbaijan: { name: "Azerbaïdjan", code: "az", emoji: "🇦🇿", fifaRank: 111, coeff: 19.1, cups: 0 },
    slovenia: { name: "Slovénie", code: "si", emoji: "🇸🇮", fifaRank: 52, coeff: 17.1, cups: 0 },
    ireland: { name: "Irlande", code: "ie", emoji: "🇮🇪", fifaRank: 62, coeff: 11.9, cups: 0 },
    finland: { name: "Finlande", code: "fi", emoji: "🇫🇮", fifaRank: 64, coeff: 9.5, cups: 0 },
    iceland: { name: "Islande", code: "is", emoji: "🇮🇸", fifaRank: 71, coeff: 10.8, cups: 0 },
    albania: { name: "Albanie", code: "al", emoji: "🇦🇱", fifaRank: 66, coeff: 8.5, cups: 0 },
    luxembourg: { name: "Luxembourg", code: "lu", emoji: "🇱🇺", fifaRank: 89, coeff: 10.3, cups: 0 },
    andorra: { name: "Andorre", code: "ad", emoji: "🇦🇩", fifaRank: 164, coeff: 6.0, cups: 0 },
    gibraltar: { name: "Gibraltar", code: "gi", emoji: "🇬🇮", fifaRank: 198, coeff: 5.5, cups: 0 },
    sanmarino: { name: "Saint-Marin", code: "sm", emoji: "🇸🇲", fifaRank: 210, coeff: 2.0, cups: 0 },
    wales: { name: "Pays de Galles", code: "gb-wls", emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", fifaRank: 29, coeff: 10.2, cups: 0 },
    northernireland: { name: "Irlande du Nord", code: "gb-nir", emoji: "🇬🇧", fifaRank: 73, coeff: 9.8, cups: 0 },
    bosnia: { name: "Bosnie-Herzégovine", code: "ba", emoji: "🇧🇦", fifaRank: 75, coeff: 11.5, cups: 0 },
    northmacedonia: { name: "Macédoine du Nord", code: "mk", emoji: "🇲🇰", fifaRank: 68, coeff: 8.0, cups: 0 },
    montenegro: { name: "Monténégro", code: "me", emoji: "🇲🇪", fifaRank: 74, coeff: 6.7, cups: 0 },
    georgia: { name: "Géorgie", code: "ge", emoji: "🇬🇪", fifaRank: 67, coeff: 8.4, cups: 0 },
    armenia: { name: "Arménie", code: "am", emoji: "🇦🇲", fifaRank: 96, coeff: 10.5, cups: 0 },
    kazakhstan: { name: "Kazakhstan", code: "kz", emoji: "🇰🇿", fifaRank: 107, coeff: 11.4, cups: 0 },
    moldova: { name: "Moldavie", code: "md", emoji: "🇲🇩", fifaRank: 150, coeff: 13.0, cups: 0 },
    belarus: { name: "Biélorussie", code: "by", emoji: "🇧🇾", fifaRank: 97, coeff: 7.6, cups: 0 },
    estonia: { name: "Estonie", code: "ee", emoji: "🇪🇪", fifaRank: 123, coeff: 6.2, cups: 0 },
    latvia: { name: "Lettonie", code: "lv", emoji: "🇱🇻", fifaRank: 137, coeff: 10.6, cups: 0 },
    lithuania: { name: "Lituanie", code: "lt", emoji: "🇱🇹", fifaRank: 139, coeff: 8.5, cups: 0 },
    faroe: { name: "Îles Féroé", code: "fo", emoji: "🇫🇴", fifaRank: 138, coeff: 11.0, cups: 0 },
    malta: { name: "Malte", code: "mt", emoji: "🇲🇹", fifaRank: 171, coeff: 7.5, cups: 0 },
    kosovo: { name: "Kosovo", code: "xk", emoji: "🇽🇰", fifaRank: 104, coeff: 11.5, cups: 0 }
};

const EMOJI_TO_COUNTRY_CODE = {
    "🇫🇷": "fr", "🏴󠁧󠁢󠁥󠁮󠁧󠁿": "gb-eng", "🇩🇪": "de", "🇪🇸": "es", "🇮🇹": "it",
    "🇵🇹": "pt", "🇳🇱": "nl", "🇧🇪": "be", "🇹🇷": "tr", "🏴󠁧󠁢󠁳󠁣󠁴󠁿": "gb-sct",
    "🇬🇷": "gr", "🇦🇹": "at", "🇨🇭": "ch", "🇩🇰": "dk", "🇳🇴": "no",
    "🇸🇪": "se", "🇵🇱": "pl", "🇭🇷": "hr", "🇺🇦": "ua", "🇷🇸": "rs",
    "🇷🇴": "ro", "🇨🇿": "cz", "🇮🇱": "il", "🇨🇾": "cy", "🇭🇺": "hu",
    "🇧🇬": "bg", "🇸🇰": "sk", "🇦🇿": "az", "🇸🇮": "si", "🇮🇪": "ie",
    "🇫🇮": "fi", "🇮🇸": "is", "🇦🇱": "al", "🇱🇺": "lu", "🇦🇩": "ad",
    "🇬🇮": "gi", "🇸🇲": "sm", "🏴󠁧󠁢󠁷󠁬󠁳󠁿": "gb-wls", "🇬🇧": "gb-nir", "🇧🇦": "ba",
    "🇲🇰": "mk", "🇲🇪": "me", "🇬🇪": "ge", "🇦🇲": "am", "🇰🇿": "kz",
    "🇲🇩": "md", "🇧🇾": "by", "🇪🇪": "ee", "🇱🇻": "lv", "🇱🇹": "lt",
    "🇫🇴": "fo", "🇲🇹": "mt", "🇽🇰": "xk"
};

// Renvoie un drapeau SVG net compatible PC (Flag-Icons) ou emoji
function countryFlag(codeOrCountry, emoji, size) {
    size = size || 16;
    let code = codeOrCountry;
    if (code && EUROPEAN_COUNTRIES[code]) {
        code = EUROPEAN_COUNTRIES[code].code;
    }
    if (!code && emoji) {
        code = EMOJI_TO_COUNTRY_CODE[emoji];
    }
    if (!code) return emoji || "";
    code = String(code).toLowerCase();
    const h = Math.round(size * 0.75);
    return `<span class="fi fi-${code} flag-badge" title="${code.toUpperCase()}" style="width:${size}px;height:${h}px;font-size:${size}px;line-height:1;margin-right:4px;"></span>`;
}

// ======================================================
//  STATISTIQUES & DONNÉES SUR LES CLUBS
// ======================================================
const CLUBS_METADATA = {
    "Paris Saint-Germain": { stadium: "Parc des Princes", cap: "48 583", city: "Paris", founded: 1970, att: 89, mid: 86, def: 85, ovr: 87, league: 12, cup: 15, europe: 0 },
    "Olympique de Marseille": { stadium: "Orange Vélodrome", cap: "67 394", city: "Marseille", founded: 1899, att: 81, mid: 80, def: 79, ovr: 80, league: 9, cup: 10, europe: 1 },
    "Olympique Lyonnais": { stadium: "Groupama Stadium", cap: "59 186", city: "Lyon", founded: 1950, att: 80, mid: 79, def: 77, ovr: 79, league: 7, cup: 5, europe: 0 },
    "AS Monaco": { stadium: "Stade Louis-II", cap: "18 523", city: "Monaco", founded: 1924, att: 82, mid: 81, def: 78, ovr: 80, league: 8, cup: 5, europe: 0 },
    "LOSC Lille": { stadium: "Stade Pierre-Mauroy", cap: "50 186", city: "Lille", founded: 1944, att: 79, mid: 79, def: 78, ovr: 79, league: 4, cup: 6, europe: 0 },
    "RC Lens": { stadium: "Stade Bollaert-Delelis", cap: "38 223", city: "Lens", founded: 1906, att: 78, mid: 78, def: 79, ovr: 78, league: 1, cup: 0, europe: 0 },
    "OGC Nice": { stadium: "Allianz Riviera", cap: "36 178", city: "Nice", founded: 1904, att: 78, mid: 77, def: 79, ovr: 78, league: 4, cup: 3, europe: 0 },
    "Stade Rennais": { stadium: "Roazhon Park", cap: "29 778", city: "Rennes", founded: 1901, att: 77, mid: 78, def: 77, ovr: 77, league: 0, cup: 3, europe: 0 },
    "RC Strasbourg": { stadium: "Stade de la Meinau", cap: "26 109", city: "Strasbourg", founded: 1906, att: 76, mid: 76, def: 76, ovr: 76, league: 1, cup: 3, europe: 0 },
    "Toulouse FC": { stadium: "Stadium de Toulouse", cap: "33 150", city: "Toulouse", founded: 1970, att: 75, mid: 75, def: 74, ovr: 75, league: 0, cup: 2, europe: 0 },
    "Stade Brestois": { stadium: "Stade Francis-Le Blé", cap: "15 220", city: "Brest", founded: 1950, att: 76, mid: 76, def: 76, ovr: 76, league: 0, cup: 0, europe: 0 },
    "FC Lorient": { stadium: "Stade du Moustoir", cap: "18 890", city: "Lorient", founded: 1926, att: 74, mid: 74, def: 73, ovr: 74, league: 0, cup: 1, europe: 0 },
    "AJ Auxerre": { stadium: "Stade de l'Abbé-Deschamps", cap: "18 541", city: "Auxerre", founded: 1905, att: 73, mid: 73, def: 73, ovr: 73, league: 1, cup: 4, europe: 0 },
    "Angers SCO": { stadium: "Stade Raymond-Kopa", cap: "18 752", city: "Angers", founded: 1919, att: 72, mid: 73, def: 73, ovr: 73, league: 0, cup: 0, europe: 0 },
    "Paris FC": { stadium: "Stade Charléty", cap: "20 000", city: "Paris", founded: 1969, att: 73, mid: 73, def: 72, ovr: 73, league: 0, cup: 0, europe: 0 },
    "Le Havre AC": { stadium: "Stade Océane", cap: "25 178", city: "Le Havre", founded: 1872, att: 72, mid: 72, def: 73, ovr: 72, league: 0, cup: 1, europe: 0 },
    "Manchester City": { stadium: "Etihad Stadium", cap: "53 400", city: "Manchester", founded: 1880, att: 90, mid: 91, def: 87, ovr: 89, league: 10, cup: 7, europe: 1 },
    "Arsenal": { stadium: "Emirates Stadium", cap: "60 704", city: "Londres", founded: 1886, att: 87, mid: 88, def: 87, ovr: 87, league: 13, cup: 14, europe: 0 },
    "Liverpool": { stadium: "Anfield", cap: "61 276", city: "Liverpool", founded: 1892, att: 89, mid: 85, def: 87, ovr: 87, league: 19, cup: 8, europe: 6 },
    "Chelsea": { stadium: "Stamford Bridge", cap: "40 341", city: "Londres", founded: 1905, att: 84, mid: 85, def: 83, ovr: 84, league: 6, cup: 8, europe: 2 },
    "Manchester United": { stadium: "Old Trafford", cap: "74 310", city: "Manchester", founded: 1878, att: 83, mid: 82, def: 82, ovr: 82, league: 20, cup: 13, europe: 3 },
    "Tottenham": { stadium: "Tottenham Hotspur Stadium", cap: "62 850", city: "Londres", founded: 1882, att: 84, mid: 83, def: 81, ovr: 83, league: 2, cup: 8, europe: 0 },
    "Newcastle United": { stadium: "St James' Park", cap: "52 305", city: "Newcastle", founded: 1892, att: 83, mid: 83, def: 82, ovr: 83, league: 4, cup: 6, europe: 0 },
    "Aston Villa": { stadium: "Villa Park", cap: "42 640", city: "Birmingham", founded: 1874, att: 82, mid: 82, def: 81, ovr: 82, league: 7, cup: 7, europe: 1 },
    "Brighton": { stadium: "Amex Stadium", cap: "31 876", city: "Brighton", founded: 1901, att: 80, mid: 80, def: 79, ovr: 80, league: 0, cup: 0, europe: 0 },
    "Real Madrid": { stadium: "Santiago Bernabéu", cap: "81 044", city: "Madrid", founded: 1902, att: 92, mid: 90, def: 88, ovr: 90, league: 36, cup: 20, europe: 15 },
    "FC Barcelone": { stadium: "Spotify Camp Nou", cap: "99 354", city: "Barcelone", founded: 1899, att: 88, mid: 88, def: 85, ovr: 87, league: 27, cup: 31, europe: 5 },
    "Atlético de Madrid": { stadium: "Cívitas Metropolitano", cap: "70 460", city: "Madrid", founded: 1903, att: 84, mid: 84, def: 84, ovr: 84, league: 11, cup: 10, europe: 0 },
    "Bayern Munich": { stadium: "Allianz Arena", cap: "75 024", city: "Munich", founded: 1900, att: 90, mid: 88, def: 86, ovr: 88, league: 33, cup: 20, europe: 6 },
    "Borussia Dortmund": { stadium: "Signal Iduna Park", cap: "81 365", city: "Dortmund", founded: 1909, att: 84, mid: 83, def: 82, ovr: 83, league: 8, cup: 5, europe: 1 },
    "Bayer Leverkusen": { stadium: "BayArena", cap: "30 210", city: "Leverkusen", founded: 1904, att: 85, mid: 86, def: 85, ovr: 85, league: 1, cup: 2, europe: 0 },
    "Inter Milan": { stadium: "San Siro", cap: "75 923", city: "Milan", founded: 1908, att: 86, mid: 87, def: 86, ovr: 86, league: 20, cup: 9, europe: 3 },
    "Juventus": { stadium: "Allianz Stadium", cap: "41 507", city: "Turin", founded: 1897, att: 83, mid: 83, def: 84, ovr: 83, league: 36, cup: 15, europe: 2 },
    "AC Milan": { stadium: "San Siro", cap: "75 923", city: "Milan", founded: 1899, att: 84, mid: 82, def: 82, ovr: 83, league: 19, cup: 5, europe: 7 },
    "Benfica": { stadium: "Estádio da Luz", cap: "64 642", city: "Lisbonne", founded: 1904, att: 82, mid: 81, def: 80, ovr: 81, league: 38, cup: 26, europe: 2 },
    "Sporting CP": { stadium: "Estádio José Alvalade", cap: "50 095", city: "Lisbonne", founded: 1906, att: 83, mid: 81, def: 81, ovr: 82, league: 20, cup: 17, europe: 0 },
    "Ajax": { stadium: "Johan Cruyff ArenA", cap: "55 865", city: "Amsterdam", founded: 1900, att: 80, mid: 79, def: 78, ovr: 79, league: 36, cup: 20, europe: 4 }
};

function getClubStats(name, budget) {
    if (CLUBS_METADATA[name]) return CLUBS_METADATA[name];
    budget = budget || 10000000;
    let base = 68;
    if (budget >= 150000000) base = 85;
    else if (budget >= 80000000) base = 81;
    else if (budget >= 40000000) base = 78;
    else if (budget >= 20000000) base = 75;
    else if (budget >= 10000000) base = 72;
    else if (budget >= 5000000) base = 70;

    const hash = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const att = Math.min(95, base + (hash % 5) - 2);
    const mid = Math.min(95, base + ((hash >> 2) % 5) - 2);
    const def = Math.min(95, base + ((hash >> 4) % 5) - 2);
    const ovr = Math.round((att + mid + def) / 3);

    const capNum = Math.max(5000, Math.min(80000, Math.round((budget / 10000) * 1.5 + (hash % 5000))));
    return {
        stadium: "Stade municipal de " + name.split(' ')[0],
        cap: capNum.toLocaleString('fr-FR'),
        city: name.split(' ')[0] || "Europe",
        founded: 1900 + (hash % 90),
        att, mid, def, ovr,
        league: Math.max(0, Math.floor((ovr - 70) * 0.8)),
        cup: Math.max(0, Math.floor((ovr - 72) * 0.5)),
        europe: ovr >= 85 ? Math.floor((ovr - 83) * 0.7) : 0
    };
}

function openClubModal(clubName) {
    if (!clubName) return;
    const modal = document.getElementById("club-info-modal");
    if (!modal) return;

    let foundClub = null, foundLeague = null;
    for (const [key, lg] of Object.entries(LEAGUES)) {
        const c = (lg.clubs || []).find(x => x.name === clubName);
        if (c) {
            foundClub = c;
            foundLeague = lg;
            break;
        }
    }

    const info = getClubStats(clubName, foundClub ? foundClub.budget : 20000000);
    const emoji = foundClub ? foundClub.emoji : "⚽";
    const flagHtml = foundLeague ? countryFlag(foundLeague.country || foundLeague.countryCode, foundLeague.flag, 18) : "";
    const leagueName = foundLeague ? foundLeague.name : "Championnat";

    document.getElementById("cim-crest").innerHTML = crest(clubName, emoji, 48);
    document.getElementById("cim-name").textContent = clubName;
    document.getElementById("cim-meta").innerHTML = `${flagHtml} ${leagueName} · Budget : ${fmtMoney(foundClub ? foundClub.budget : 15000000)}`;

    document.getElementById("cim-stadium").textContent = info.stadium;
    document.getElementById("cim-cap").textContent = `${info.cap} places`;
    document.getElementById("cim-city").textContent = info.city;
    document.getElementById("cim-founded").textContent = `Fondé en ${info.founded}`;

    document.getElementById("cim-att").textContent = info.att;
    document.getElementById("cim-mid").textContent = info.mid;
    document.getElementById("cim-def").textContent = info.def;
    document.getElementById("cim-ovr").textContent = info.ovr;

    const trophiesEl = document.getElementById("cim-trophies");
    trophiesEl.innerHTML = `
        <div class="trophy-badge"><span style="font-size:18px;">🏆</span> <span>Championnats</span> <span class="tb-count">${info.league}</span></div>
        <div class="trophy-badge"><span style="font-size:18px;">🥇</span> <span>Coupes nat.</span> <span class="tb-count">${info.cup}</span></div>
        <div class="trophy-badge"><span style="font-size:18px;">⭐</span> <span>Coupes d'Europe</span> <span class="tb-count">${info.europe}</span></div>
    `;

    modal.style.display = "flex";
}

function closeClubModal() {
    const modal = document.getElementById("club-info-modal");
    if (modal) modal.style.display = "none";
}

// Promotion/relegation links: promotesTo = ligue supérieure, relegatesTo = ligue inférieure
const LEAGUES = {
    // ====== ANGLETERRE 2025-2026 ======
    pl: {name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: 1, country: "england", relegatesTo: "championship",
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Manchester City", emoji: "🔵", budget: 400000000},
            {name: "Arsenal", emoji: "🔴", budget: 220000000},
            {name: "Liverpool", emoji: "🔴", budget: 260000000},
            {name: "Chelsea", emoji: "🔵", budget: 280000000},
            {name: "Manchester United", emoji: "🔴", budget: 160000000},
            {name: "Tottenham", emoji: "⚪", budget: 150000000},
            {name: "Newcastle United", emoji: "⚫", budget: 170000000},
            {name: "Aston Villa", emoji: "🟣", budget: 140000000},
            {name: "Brighton", emoji: "🔵", budget: 90000000},
            {name: "Fulham", emoji: "🟣", budget: 80000000},
            {name: "Burnley", emoji: "🟣", budget: 55000000},
            {name: "Wolverhampton Wanderers", emoji: "🟠", budget: 60000000},
            {name: "Crystal Palace", emoji: "🔴", budget: 60000000},
            {name: "Brentford", emoji: "🔴", budget: 58000000},
            {name: "Everton", emoji: "🔵", budget: 55000000},
            {name: "Nottingham Forest", emoji: "🔴", budget: 65000000},
            {name: "Bournemouth", emoji: "🔴", budget: 55000000},
            {name: "Leeds United", emoji: "🔵", budget: 50000000},
            {name: "West Ham United", emoji: "🔵", budget: 80000000},
            {name: "Sunderland", emoji: "🔴", budget: 40000000}
        ]},
    championship: {name: "Championship", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: 2, country: "england", promotesTo: "pl", relegatesTo: null,
        promotionSpots: 2, playoffSpots: 4, relegationSpots: 3,
        clubs: [
            {name: "Leicester City", emoji: "🔵", budget: 45000000},
            {name: "Ipswich Town", emoji: "🔵", budget: 38000000},
            {name: "Southampton", emoji: "🔴", budget: 30000000},
            {name: "Hull City", emoji: "🟡", budget: 22000000},
            {name: "Middlesbrough", emoji: "🔴", budget: 28000000},
            {name: "Stoke City", emoji: "🔴", budget: 22000000},
            {name: "Norwich City", emoji: "🟡", budget: 18000000},
            {name: "Birmingham City", emoji: "🔵", budget: 18000000},
            {name: "Wrexham", emoji: "🔴", budget: 16000000},
            {name: "Swansea City", emoji: "⚪", budget: 15000000},
            {name: "Sheffield United", emoji: "🔴", budget: 14000000},
            {name: "West Bromwich Albion", emoji: "🔵", budget: 12000000},
            {name: "Derby County", emoji: "⚪", budget: 11000000},
            {name: "Watford", emoji: "🟡", budget: 10000000},
            {name: "Bristol City", emoji: "🔴", budget: 9500000},
            {name: "Millwall", emoji: "🔵", budget: 8500000},
            {name: "Coventry City", emoji: "🔵", budget: 18000000},
            {name: "Blackburn Rovers", emoji: "🔵", budget: 7500000},
            {name: "Preston North End", emoji: "⚪", budget: 7000000},
            {name: "Queens Park Rangers", emoji: "🔵", budget: 6500000},
            {name: "Portsmouth", emoji: "🔵", budget: 6000000},
            {name: "Charlton Athletic", emoji: "🔴", budget: 5000000},
            {name: "Oxford United", emoji: "🟡", budget: 12000000},
            {name: "Sheffield Wednesday", emoji: "🔵", budget: 13000000}
        ]},
    // ====== FRANCE 2025-2026 ======
    // Ligue 1 : PSG, OM, OL, Monaco, Lille, Lens, Rennes, Nice, Strasbourg, Reims,
    //            Toulouse, Brest, Nantes, Le Havre, Saint-Étienne, Angers, Auxerre, Montpellier
    ligue1: {name: "Ligue 1", flag: "🇫🇷", tier: 1, country: "france", relegatesTo: "ligue2",
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Paris Saint-Germain", emoji: "🔵", budget: 500000000},
            {name: "Olympique de Marseille", emoji: "⚪", budget: 90000000},
            {name: "AS Monaco", emoji: "🔴", budget: 95000000},
            {name: "Olympique Lyonnais", emoji: "🔴", budget: 65000000},
            {name: "LOSC Lille", emoji: "🔴", budget: 60000000},
            {name: "OGC Nice", emoji: "🔴", budget: 55000000},
            {name: "RC Lens", emoji: "🟡", budget: 50000000},
            {name: "Stade Rennais", emoji: "🔴", budget: 48000000},
            {name: "RC Strasbourg", emoji: "🔵", budget: 40000000},
            {name: "Toulouse FC", emoji: "🟣", budget: 30000000},
            {name: "Stade Brestois", emoji: "🔴", budget: 28000000},
            {name: "FC Lorient", emoji: "🟠", budget: 27000000},
            {name: "Angers SCO", emoji: "⚪", budget: 22000000},
            {name: "AJ Auxerre", emoji: "🔵", budget: 22000000},
            {name: "Paris FC", emoji: "🔵", budget: 20000000},
            {name: "Le Havre AC", emoji: "🔵", budget: 18000000},
            {name: "Le Mans FC", emoji: "🔴", budget: 12000000},
            {name: "ESTAC Troyes", emoji: "🔵", budget: 10000000}
        ]},
    // Ligue 2 2025-2026 : Metz, Caen, Valenciennes, Grenoble, Ajaccio, Rodez, Guingamp,
    //                      Paris FC, Amiens, QRM, Dunkerque, Troyes, Pau, Laval, Clermont,
    //                      Concarneau, Bastia, Martigues, Le Mans FC, Saint-Brieuc
    ligue2: {name: "Ligue 2", flag: "🇫🇷", tier: 2, country: "france", promotesTo: "ligue1", relegatesTo: null,
        promotionSpots: 2, playoffSpots: 2, relegationSpots: 3,
        clubs: [
            {name: "Metz", emoji: "🟣", budget: 24000000},
            {name: "Caen", emoji: "🔵", budget: 17000000},
            {name: "Valenciennes", emoji: "🔴", budget: 13000000},
            {name: "Grenoble Foot", emoji: "🔵", budget: 11000000},
            {name: "Ajaccio", emoji: "🔴", budget: 12000000},
            {name: "Rodez AF", emoji: "🔴", budget: 9000000},
            {name: "Guingamp", emoji: "🔴", budget: 10000000},
            {name: "Paris FC", emoji: "🔵", budget: 14000000},
            {name: "Amiens SC", emoji: "⚪", budget: 11000000},
            {name: "Quevilly-Rouen", emoji: "🔴", budget: 8000000},
            {name: "Dunkerque", emoji: "🔵", budget: 7000000},
            {name: "Troyes", emoji: "🔵", budget: 13000000},
            {name: "Pau FC", emoji: "🟢", budget: 6000000},
            {name: "Laval", emoji: "🔴", budget: 7000000},
            {name: "Clermont Foot", emoji: "🔴", budget: 9000000},
            {name: "Concarneau", emoji: "🟡", budget: 5500000},
            {name: "Bastia", emoji: "🔵", budget: 8000000},
            {name: "Martigues", emoji: "🔵", budget: 5000000},
            {name: "Le Mans FC", emoji: "🔴", budget: 5000000},
            {name: "Saint-Brieuc", emoji: "🔴", budget: 4000000}
        ]},
    // ====== ALLEMAGNE 2025-2026 ======
    // Bundesliga : Bayern, Dortmund, Leipzig, Leverkusen, Eintracht, Wolfsburg,
    //              Freiburg, Gladbach, Stuttgart, Hoffenheim, Augsburg, Werder,
    //              Heidenheim, Mainz, St. Pauli, Union Berlin, Bochum, Kiel
    bl: {name: "Bundesliga", flag: "🇩🇪", tier: 1, country: "germany", relegatesTo: "bl2",
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Bayern Munich", emoji: "🔴", budget: 380000000},
            {name: "Borussia Dortmund", emoji: "🟡", budget: 200000000},
            {name: "RB Leipzig", emoji: "🔴", budget: 160000000},
            {name: "Bayer Leverkusen", emoji: "🔴", budget: 140000000},
            {name: "Eintracht Francfort", emoji: "⚫", budget: 105000000},
            {name: "Wolfsbourg", emoji: "🟢", budget: 90000000},
            {name: "Fribourg", emoji: "🔴", budget: 70000000},
            {name: "Borussia M'Gladbach", emoji: "⚪", budget: 72000000},
            {name: "Stuttgart", emoji: "🔴", budget: 80000000},
            {name: "Hoffenheim", emoji: "🔵", budget: 58000000},
            {name: "Augsbourg", emoji: "🔴", budget: 50000000},
            {name: "Werder Brême", emoji: "🟢", budget: 55000000},
            {name: "Heidenheim", emoji: "🔴", budget: 35000000},
            {name: "Mainz 05", emoji: "🔴", budget: 42000000},
            {name: "St. Pauli", emoji: "⚪", budget: 33000000},
            {name: "Union Berlin", emoji: "🔴", budget: 60000000},
            {name: "VfL Bochum", emoji: "🔵", budget: 28000000},
            {name: "Holstein Kiel", emoji: "🔵", budget: 25000000}
        ]},
    // 2. Bundesliga 2025-2026 : Hambourg, Schalke, Hertha, Düsseldorf, Nuremberg,
    //                            Hanovre, Paderborn, Karlsruhe, Fürth, Elversberg,
    //                            Braunschweig, Ulm, Münster, Magdeburg, Kaiserslautern,
    //                            Darmstadt, Wehen, Regensburg
    bl2: {name: "2. Bundesliga", flag: "🇩🇪", tier: 2, country: "germany", promotesTo: "bl", relegatesTo: null,
        promotionSpots: 2, playoffSpots: 1, relegationSpots: 3,
        clubs: [
            {name: "Hambourg SV", emoji: "🔴", budget: 42000000},
            {name: "Schalke 04", emoji: "🔵", budget: 35000000},
            {name: "Hertha Berlin", emoji: "🔵", budget: 33000000},
            {name: "Fortuna Düsseldorf", emoji: "🔴", budget: 26000000},
            {name: "Nuremberg", emoji: "🔴", budget: 23000000},
            {name: "Hanovre 96", emoji: "🔴", budget: 21000000},
            {name: "Paderborn", emoji: "🔵", budget: 17000000},
            {name: "Karlsruher SC", emoji: "🔵", budget: 16000000},
            {name: "SpVgg Greuther Fürth", emoji: "🟢", budget: 15000000},
            {name: "Elversberg", emoji: "⚫", budget: 12000000},
            {name: "Braunschweig", emoji: "🟡", budget: 10000000},
            {name: "Ulm 1846", emoji: "⚪", budget: 9000000},
            {name: "Preußen Münster", emoji: "🔵", budget: 8500000},
            {name: "FC Magdeburg", emoji: "🔵", budget: 10000000},
            {name: "Kaiserslautern", emoji: "🔴", budget: 14000000},
            {name: "Darmstadt 98", emoji: "🔵", budget: 11000000},
            {name: "Wehen Wiesbaden", emoji: "🔴", budget: 7000000},
            {name: "SSV Jahn Regensburg", emoji: "🔴", budget: 8000000}
        ]},
    // ====== ITALIE 2025-2026 ======
    // Serie A : Inter, Milan, Juve, Napoli, Roma, Lazio, Atalanta, Fiorentina,
    //            Torino, Bologna, Udinese, Monza, Genoa, Cagliari, Vérone, Lecce,
    //            Empoli, Como, Parme, Venezia
    seria: {name: "Serie A", flag: "🇮🇹", tier: 1, country: "italy", relegatesTo: "serib",
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Inter Milan", emoji: "🔵", budget: 210000000},
            {name: "AC Milan", emoji: "🔴", budget: 185000000},
            {name: "Juventus", emoji: "⚫", budget: 220000000},
            {name: "Napoli", emoji: "🔵", budget: 170000000},
            {name: "AS Roma", emoji: "🟡", budget: 130000000},
            {name: "Lazio", emoji: "🔵", budget: 105000000},
            {name: "Atalanta", emoji: "⚫", budget: 120000000},
            {name: "Fiorentina", emoji: "🟣", budget: 85000000},
            {name: "Torino", emoji: "🟤", budget: 55000000},
            {name: "Bologna", emoji: "🔴", budget: 65000000},
            {name: "Udinese", emoji: "⚫", budget: 45000000},
            {name: "Monza", emoji: "🔴", budget: 50000000},
            {name: "Genoa", emoji: "🔴", budget: 40000000},
            {name: "Cagliari", emoji: "🔴", budget: 36000000},
            {name: "Hellas Vérone", emoji: "🔵", budget: 34000000},
            {name: "Lecce", emoji: "🟡", budget: 30000000},
            {name: "Empoli", emoji: "🔵", budget: 28000000},
            {name: "Como", emoji: "🔵", budget: 38000000},
            {name: "Parme", emoji: "🟡", budget: 35000000},
            {name: "Venezia", emoji: "🟠", budget: 26000000}
        ]},
    // Serie B 2025-2026 : Sassuolo, Palermo, Pisa, Cremonese, Brescia, Catanzaro,
    //                      Sampdoria, Cesena, Spezia, Südtirol, Cittadella, Reggiana,
    //                      Cosenza, Modena, Bari, Mantova, Carrarese, Salernitana,
    //                      Frosinone, Juve Stabia
    serib: {name: "Serie B", flag: "🇮🇹", tier: 2, country: "italy", promotesTo: "seria", relegatesTo: null,
        promotionSpots: 2, playoffSpots: 6, relegationSpots: 3,
        clubs: [
            {name: "Sassuolo", emoji: "🟢", budget: 35000000},
            {name: "Palerme", emoji: "🟡", budget: 20000000},
            {name: "Pise", emoji: "🔵", budget: 15000000},
            {name: "Cremonese", emoji: "🔴", budget: 18000000},
            {name: "Brescia", emoji: "🔵", budget: 16000000},
            {name: "Catanzaro", emoji: "🟡", budget: 12000000},
            {name: "Sampdoria", emoji: "🔵", budget: 22000000},
            {name: "Cesena", emoji: "⚫", budget: 10000000},
            {name: "Spezia", emoji: "⚫", budget: 14000000},
            {name: "Südtirol", emoji: "🔴", budget: 8000000},
            {name: "Cittadella", emoji: "🟤", budget: 9000000},
            {name: "Reggiana", emoji: "🔴", budget: 8500000},
            {name: "Cosenza", emoji: "🔴", budget: 7000000},
            {name: "Modena", emoji: "🟡", budget: 9000000},
            {name: "Bari", emoji: "🔴", budget: 13000000},
            {name: "Mantova", emoji: "🔴", budget: 7000000},
            {name: "Carrarese", emoji: "🔵", budget: 6000000},
            {name: "Salernitana", emoji: "🟤", budget: 11000000},
            {name: "Frosinone", emoji: "🟡", budget: 9000000},
            {name: "Juve Stabia", emoji: "🟡", budget: 6000000}
        ]},
    // ====== ESPAGNE 2025-2026 ======
    // LaLiga : Real Madrid, Barça, Atlético, Villarreal, Athletic, Betis, Sociedad,
    //           Séville, Osasuna, Valence, Rayo, Celta, Getafe, Majorque, Girona,
    //           Las Palmas, Alavés, Leganés, Espanyol, Vallecano
    liga: {name: "LaLiga", flag: "🇪🇸", tier: 1, country: "spain", relegatesTo: "liga2",
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Real Madrid", emoji: "⚪", budget: 620000000},
            {name: "FC Barcelone", emoji: "🔵", budget: 320000000},
            {name: "Atlético Madrid", emoji: "🔴", budget: 190000000},
            {name: "Villarreal", emoji: "🟡", budget: 95000000},
            {name: "Athletic Bilbao", emoji: "🔴", budget: 85000000},
            {name: "Betis Séville", emoji: "🟢", budget: 88000000},
            {name: "Real Sociedad", emoji: "🔵", budget: 105000000},
            {name: "Séville FC", emoji: "🔴", budget: 115000000},
            {name: "Osasuna", emoji: "🔴", budget: 42000000},
            {name: "Valence CF", emoji: "⚪", budget: 40000000},
            {name: "Rayo Vallecano", emoji: "⚪", budget: 36000000},
            {name: "Celta Vigo", emoji: "🔵", budget: 44000000},
            {name: "Getafe CF", emoji: "🔵", budget: 34000000},
            {name: "Majorque", emoji: "🔴", budget: 33000000},
            {name: "Girona FC", emoji: "🔴", budget: 48000000},
            {name: "Las Palmas", emoji: "🟡", budget: 29000000},
            {name: "Deportivo Alavés", emoji: "🔵", budget: 31000000},
            {name: "Leganés", emoji: "🔵", budget: 29000000},
            {name: "Espanyol", emoji: "🔵", budget: 36000000},
            {name: "Valladolid", emoji: "🟣", budget: 32000000}
        ]},
    // LaLiga Hypermotion 2025-2026
    liga2: {name: "LaLiga Hypermotion", flag: "🇪🇸", tier: 2, country: "spain", promotesTo: "liga", relegatesTo: null,
        promotionSpots: 2, playoffSpots: 4, relegationSpots: 4,
        clubs: [
            {name: "Racing Santander", emoji: "🟢", budget: 18000000},
            {name: "Sporting Gijón", emoji: "🔴", budget: 17000000},
            {name: "Mirandés", emoji: "🔴", budget: 12000000},
            {name: "Eldense", emoji: "🔵", budget: 8000000},
            {name: "Huesca", emoji: "🔵", budget: 10000000},
            {name: "FC Cartagena", emoji: "🔴", budget: 9000000},
            {name: "Burgos CF", emoji: "🔴", budget: 8500000},
            {name: "Levante", emoji: "🟡", budget: 21000000},
            {name: "Almería", emoji: "🔴", budget: 14000000},
            {name: "Real Oviedo", emoji: "🔵", budget: 12000000},
            {name: "SD Eibar", emoji: "🔴", budget: 10000000},
            {name: "Real Zaragoza", emoji: "🔵", budget: 14000000},
            {name: "Córdoba CF", emoji: "🟢", budget: 8000000},
            {name: "Tenerife", emoji: "🔵", budget: 11000000},
            {name: "Castellón", emoji: "⚪", budget: 7000000},
            {name: "Granada CF", emoji: "🔴", budget: 15000000},
            {name: "Albacete BP", emoji: "🟡", budget: 7000000},
            {name: "Ferrol", emoji: "🔵", budget: 6000000},
            {name: "Andorra CF", emoji: "🔵", budget: 6000000},
            {name: "Valladolid", emoji: "🟣", budget: 16000000},
            {name: "Numancia", emoji: "🔴", budget: 5000000},
            {name: "Alcorcón", emoji: "🟢", budget: 5000000}
        ]},
    // ====== GRÈCE 2025-2026 ======
    superleague_gr: {name: "Stoiximan Super League", flag: "🇬🇷", tier: 1, country: "greece", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Olympiakos", emoji: "🔴", budget: 55000000},
            {name: "PAOK", emoji: "⚫", budget: 40000000},
            {name: "AEK Athènes", emoji: "🟡", budget: 38000000},
            {name: "Panathinaïkos", emoji: "🟢", budget: 35000000},
            {name: "Aris FC", emoji: "🟡", budget: 18000000},
            {name: "Atromitos", emoji: "🔵", budget: 10000000},
            {name: "OFI Crète", emoji: "🔴", budget: 9000000},
            {name: "Panetolikos", emoji: "🔴", budget: 7000000},
            {name: "Asteras Tripolis", emoji: "🟡", budget: 8000000},
            {name: "Volos NFC", emoji: "🔵", budget: 7000000},
            {name: "Lamia", emoji: "🔵", budget: 6500000},
            {name: "Levadiakos", emoji: "🟢", budget: 5000000},
            {name: "Panaitolikos", emoji: "🟠", budget: 6000000},
            {name: "Kallithea", emoji: "🔵", budget: 5500000},
            {name: "Ionikos", emoji: "🟡", budget: 5000000},
            {name: "Ergotelis", emoji: "🔴", budget: 4500000}
        ]},
    // ====== AUTRICHE 2025-2026 ======
    bundesliga_at: {name: "Admiral Bundesliga", flag: "🇦🇹", tier: 1, country: "austria", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Red Bull Salzbourg", emoji: "🔴", budget: 90000000},
            {name: "Sturm Graz", emoji: "⚫", budget: 22000000},
            {name: "LASK", emoji: "⚫", budget: 18000000},
            {name: "Austria Vienne", emoji: "🟣", budget: 16000000},
            {name: "Rapid Vienne", emoji: "🟢", budget: 20000000},
            {name: "Wolfsberger AC", emoji: "🔵", budget: 10000000},
            {name: "Rheindorf Altach", emoji: "🔵", budget: 7000000},
            {name: "Austria Lustenau", emoji: "🔵", budget: 6000000},
            {name: "Grazer AK", emoji: "🟤", budget: 8000000},
            {name: "FC Blau-Weiß Linz", emoji: "🔵", budget: 6000000},
            {name: "Austria Klagenfurt", emoji: "🟣", budget: 7500000},
            {name: "Hartberg", emoji: "⚪", budget: 5000000}
        ]},
    // ====== ÉCOSSE 2025-2026 ======
    premiership_sc: {name: "William Hill Premiership", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tier: 1, country: "scotland", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Celtic FC", emoji: "🟢", budget: 65000000},
            {name: "Rangers FC", emoji: "🔵", budget: 60000000},
            {name: "Heart of Midlothian", emoji: "🟣", budget: 18000000},
            {name: "Hibernian", emoji: "🟢", budget: 14000000},
            {name: "Aberdeen FC", emoji: "🔴", budget: 10000000},
            {name: "Dundee United", emoji: "🟠", budget: 8000000},
            {name: "Motherwell", emoji: "🟤", budget: 7000000},
            {name: "St Mirren", emoji: "⚫", budget: 6000000},
            {name: "Kilmarnock", emoji: "🔵", budget: 6500000},
            {name: "Dundee FC", emoji: "🔵", budget: 5500000},
            {name: "St Johnstone", emoji: "🔵", budget: 5000000},
            {name: "Ross County", emoji: "🔴", budget: 4500000}
        ]},
    // ====== SUISSE 2025-2026 ======
    superleague_ch: {name: "Credit Suisse Super League", flag: "🇨🇭", tier: 1, country: "switzerland", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Young Boys", emoji: "🟡", budget: 28000000},
            {name: "FC Bâle", emoji: "🔴", budget: 30000000},
            {name: "FC Zurich", emoji: "🔵", budget: 22000000},
            {name: "Servette FC", emoji: "🔴", budget: 16000000},
            {name: "FC Lugano", emoji: "⚫", budget: 12000000},
            {name: "FC Lucerne", emoji: "🔵", budget: 10000000},
            {name: "FC Saint-Gall", emoji: "🟢", budget: 11000000},
            {name: "Lausanne-Sport", emoji: "🔵", budget: 9000000},
            {name: "FC Sion", emoji: "🔴", budget: 8000000},
            {name: "Winterthour", emoji: "⚪", budget: 6000000}
        ]},
    // ====== DANEMARK 2025-2026 ======
    superliga_dk: {name: "3F Superliga", flag: "🇩🇰", tier: 1, country: "denmark", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FC Copenhague", emoji: "🔵", budget: 35000000},
            {name: "Brøndby IF", emoji: "🟡", budget: 22000000},
            {name: "FC Midtjylland", emoji: "⚫", budget: 20000000},
            {name: "Aarhus GF", emoji: "🔵", budget: 12000000},
            {name: "Silkeborg IF", emoji: "🔴", budget: 8000000},
            {name: "Viborg FF", emoji: "🟢", budget: 7000000},
            {name: "Randers FC", emoji: "🔴", budget: 6500000},
            {name: "OB Odense", emoji: "🔵", budget: 7000000},
            {name: "FC Nordsjælland", emoji: "🔵", budget: 8000000},
            {name: "Lyngby BK", emoji: "⚪", budget: 5000000},
            {name: "FC Sønderjyske", emoji: "🔵", budget: 4500000},
            {name: "Vejle BK", emoji: "🔴", budget: 4000000},
            {name: "Hvidovre IF", emoji: "🟡", budget: 4000000},
            {name: "FC Fredericia", emoji: "🔵", budget: 3500000}
        ]},
    // ====== NORVÈGE 2025-2026 ======
    eliteserien_no: {name: "Eliteserien", flag: "🇳🇴", tier: 1, country: "norway", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Bodø/Glimt", emoji: "🟡", budget: 18000000},
            {name: "Molde FK", emoji: "🔵", budget: 14000000},
            {name: "Rosenborg BK", emoji: "⚫", budget: 12000000},
            {name: "Brann Bergen", emoji: "🔴", budget: 9000000},
            {name: "Viking FK", emoji: "🔵", budget: 8000000},
            {name: "Vålerenga", emoji: "🔵", budget: 7500000},
            {name: "IK Start", emoji: "⚪", budget: 5000000},
            {name: "Sarpsborg 08", emoji: "🔴", budget: 5500000},
            {name: "Stabæk IF", emoji: "🔵", budget: 5000000},
            {name: "Lillestrøm SK", emoji: "🟡", budget: 6000000},
            {name: "Fredrikstad FK", emoji: "🔴", budget: 5000000},
            {name: "SK Brann", emoji: "🔴", budget: 4500000},
            {name: "Odd BK", emoji: "⚪", budget: 4000000},
            {name: "Strømsgodset IF", emoji: "🔴", budget: 4000000},
            {name: "Haugesund", emoji: "🟡", budget: 3500000},
            {name: "Kristiansund BK", emoji: "🔵", budget: 3500000}
        ]},
    // ====== SUÈDE 2025-2026 ======
    allsvenskan_se: {name: "Allsvenskan", flag: "🇸🇪", tier: 1, country: "sweden", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Malmö FF", emoji: "🔵", budget: 20000000},
            {name: "IFK Göteborg", emoji: "🔵", budget: 14000000},
            {name: "Djurgårdens IF", emoji: "🔵", budget: 13000000},
            {name: "Hammarby IF", emoji: "🟢", budget: 12000000},
            {name: "AIK Stockholm", emoji: "⚫", budget: 11000000},
            {name: "IF Elfsborg", emoji: "🟡", budget: 8000000},
            {name: "BK Häcken", emoji: "🟡", budget: 7000000},
            {name: "IFK Norrköping", emoji: "🔵", budget: 6500000},
            {name: "Helsingborg IF", emoji: "🔵", budget: 5500000},
            {name: "Kalmar FF", emoji: "🔴", budget: 5000000},
            {name: "Örebro SK", emoji: "⚫", budget: 4500000},
            {name: "IK Sirius", emoji: "🔵", budget: 4000000},
            {name: "Värnamo", emoji: "🟢", budget: 3500000},
            {name: "Mjällby AIF", emoji: "⚪", budget: 3500000},
            {name: "GIF Sundsvall", emoji: "⚪", budget: 3000000},
            {name: "Degerfors IF", emoji: "🔴", budget: 3000000}
        ]},
    // ====== POLOGNE 2025-2026 ======
    ekstraklasa_pl: {name: "PKO BP Ekstraklasa", flag: "🇵🇱", tier: 1, country: "poland", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Legia Varsovie", emoji: "🟢", budget: 30000000},
            {name: "Lech Poznań", emoji: "🔵", budget: 22000000},
            {name: "Raków Częstochowa", emoji: "🔴", budget: 18000000},
            {name: "Wisła Cracovie", emoji: "🔴", budget: 12000000},
            {name: "Górnik Zabrze", emoji: "🔴", budget: 8000000},
            {name: "Śląsk Wrocław", emoji: "🔴", budget: 7500000},
            {name: "Zagłębie Lubin", emoji: "🟡", budget: 6000000},
            {name: "Cracovie", emoji: "⚪", budget: 6500000},
            {name: "Piast Gliwice", emoji: "🔵", budget: 5500000},
            {name: "Jagiellonia Białystok", emoji: "🟡", budget: 7000000},
            {name: "Pogon Szczecin", emoji: "🔵", budget: 8000000},
            {name: "Warta Poznań", emoji: "🟢", budget: 4500000},
            {name: "Widzew Łódź", emoji: "🔴", budget: 5000000},
            {name: "Stal Mielec", emoji: "🔵", budget: 4000000},
            {name: "Korona Kielce", emoji: "🟡", budget: 3500000},
            {name: "GKS Katowice", emoji: "⚫", budget: 3500000},
            {name: "Lechia Gdańsk", emoji: "⚪", budget: 5500000},
            {name: "Miedź Legnica", emoji: "⚪", budget: 3000000}
        ]},
    // ====== CROATIE 2025-2026 ======
    hnl_hr: {name: "SuperSport HNL", flag: "🇭🇷", tier: 1, country: "croatia", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Dinamo Zagreb", emoji: "🔵", budget: 40000000},
            {name: "Hajduk Split", emoji: "⚪", budget: 20000000},
            {name: "NK Osijek", emoji: "🔵", budget: 10000000},
            {name: "NK Rijeka", emoji: "🔵", budget: 8000000},
            {name: "NK Lokomotiva", emoji: "🔵", budget: 5000000},
            {name: "HNK Šibenik", emoji: "🔴", budget: 3500000},
            {name: "NK Istra 1961", emoji: "🔵", budget: 3000000},
            {name: "NK Varaždin", emoji: "🔵", budget: 3000000},
            {name: "NK Slaven Koprivnica", emoji: "🔵", budget: 2500000},
            {name: "NK Gorica", emoji: "🟢", budget: 2500000}
        ]},
    // ====== UKRAINE 2025-2026 ======
    liha_ua: {name: "VBET Liha", flag: "🇺🇦", tier: 1, country: "ukraine", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Shakhtar Donetsk", emoji: "🟠", budget: 60000000},
            {name: "Dynamo Kyiv", emoji: "🔵", budget: 45000000},
            {name: "Zorya Luhansk", emoji: "🔴", budget: 10000000},
            {name: "Metalist Kharkiv", emoji: "🔵", budget: 8000000},
            {name: "Kryvbas Kryvyi Rih", emoji: "🔴", budget: 7000000},
            {name: "Dnipro-1", emoji: "🔵", budget: 7000000},
            {name: "Chornomorets Odessa", emoji: "🔵", budget: 5000000},
            {name: "Polissia Zhytomyr", emoji: "🟢", budget: 4000000},
            {name: "Rukh Lviv", emoji: "🟡", budget: 4500000},
            {name: "Kolos Kovalivka", emoji: "🟢", budget: 3500000},
            {name: "LNZ Cherkasy", emoji: "🔵", budget: 3000000},
            {name: "Obolon Kyiv", emoji: "🔵", budget: 3000000},
            {name: "Veres Rivne", emoji: "🔵", budget: 2500000},
            {name: "Minaj FC", emoji: "⚪", budget: 2500000}
        ]},
    // ====== SERBIE 2025-2026 ======
    superliga_rs: {name: "Mozzart Bet Superliga", flag: "🇷🇸", tier: 1, country: "serbia", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Étoile Rouge Belgrade", emoji: "🔴", budget: 45000000},
            {name: "Partizan Belgrade", emoji: "⚫", budget: 30000000},
            {name: "FK Vojvodina", emoji: "🔵", budget: 8000000},
            {name: "FK Čukarički", emoji: "🔵", budget: 6000000},
            {name: "FK Spartak Subotica", emoji: "🔴", budget: 4000000},
            {name: "FK Radnički Niš", emoji: "🔵", budget: 3500000},
            {name: "FK Javor Ivanjica", emoji: "🟢", budget: 3000000},
            {name: "FK TSC Bačka Topola", emoji: "🔵", budget: 4500000},
            {name: "FK Mladost Lučani", emoji: "⚪", budget: 2500000},
            {name: "FK Železničar", emoji: "🔵", budget: 2500000},
            {name: "FK Napredak", emoji: "🔵", budget: 2000000},
            {name: "FK Novi Pazar", emoji: "🟡", budget: 2000000},
            {name: "FK Radnik Surdulica", emoji: "🔵", budget: 2000000},
            {name: "FK Kolubara", emoji: "🔵", budget: 1800000},
            {name: "FK Inđija", emoji: "🔵", budget: 1800000},
            {name: "FK Proleter Novi Sad", emoji: "⚪", budget: 2000000}
        ]},
    // ====== ROUMANIE 2025-2026 ======
    superliga_ro: {name: "SuperLiga", flag: "🇷🇴", tier: 1, country: "romania", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "FCSB", emoji: "🔴", budget: 20000000},
            {name: "CFR Cluj", emoji: "🟣", budget: 18000000},
            {name: "Universitatea Craiova", emoji: "🔵", budget: 12000000},
            {name: "Rapid Bucarest", emoji: "🔴", budget: 10000000},
            {name: "Dinamo Bucarest", emoji: "🔴", budget: 8000000},
            {name: "FC Hermannstadt", emoji: "🔴", budget: 5000000},
            {name: "FC Voluntari", emoji: "🔵", budget: 4500000},
            {name: "Petrolul Ploiești", emoji: "🟡", budget: 4000000},
            {name: "Sepsi OSK", emoji: "🔴", budget: 5000000},
            {name: "FC Botoșani", emoji: "🔵", budget: 3500000},
            {name: "FC Argeș", emoji: "🔵", budget: 3000000},
            {name: "Poli Iași", emoji: "🔵", budget: 3000000},
            {name: "FC UTA Arad", emoji: "🔴", budget: 3000000},
            {name: "FC Oțelul Galați", emoji: "🔵", budget: 2500000},
            {name: "Concordia Chiajna", emoji: "⚪", budget: 2000000},
            {name: "Unirea Slobozia", emoji: "🟡", budget: 2000000}
        ]},
    // ====== PORTUGAL 2025-2026 ======
    liga_pt: {name: "Liga Portugal Betclic", flag: "🇵🇹", tier: 1, country: "portugal", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Benfica", emoji: "🔴", budget: 120000000},
            {name: "FC Porto", emoji: "🔵", budget: 110000000},
            {name: "Sporting CP", emoji: "🟢", budget: 100000000},
            {name: "SC Braga", emoji: "🔴", budget: 35000000},
            {name: "Vitória SC", emoji: "🟢", budget: 14000000},
            {name: "Casa Pia AC", emoji: "⚪", budget: 9000000},
            {name: "Gil Vicente FC", emoji: "🟡", budget: 8000000},
            {name: "FC Famalicão", emoji: "🔵", budget: 7500000},
            {name: "Moreirense FC", emoji: "🟢", budget: 7000000},
            {name: "Rio Ave FC", emoji: "🔵", budget: 7000000},
            {name: "Estoril Praia", emoji: "🟡", budget: 6500000},
            {name: "Boavista FC", emoji: "⚫", budget: 10000000},
            {name: "AVS FC", emoji: "🔵", budget: 5500000},
            {name: "SC Farense", emoji: "🟠", budget: 5000000},
            {name: "CD Nacional", emoji: "⚪", budget: 5000000},
            {name: "GD Chaves", emoji: "🟡", budget: 4500000},
            {name: "Estrela da Amadora", emoji: "🔴", budget: 4000000},
            {name: "FC Vizela", emoji: "🔵", budget: 4000000}
        ]},
    // ====== PAYS-BAS 2025-2026 ======
    eredivisie_nl: {name: "Eredivisie", flag: "🇳🇱", tier: 1, country: "netherlands", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Ajax Amsterdam", emoji: "🔴", budget: 120000000},
            {name: "PSV Eindhoven", emoji: "🔴", budget: 100000000},
            {name: "Feyenoord", emoji: "🔴", budget: 80000000},
            {name: "AZ Alkmaar", emoji: "🔴", budget: 35000000},
            {name: "FC Utrecht", emoji: "🔴", budget: 18000000},
            {name: "Twente Enschede", emoji: "🔴", budget: 22000000},
            {name: "SC Heerenveen", emoji: "🔵", budget: 12000000},
            {name: "Vitesse Arnhem", emoji: "🟡", budget: 10000000},
            {name: "Sparta Rotterdam", emoji: "🔴", budget: 9000000},
            {name: "NEC Nimègue", emoji: "🔴", budget: 8500000},
            {name: "Go Ahead Eagles", emoji: "🟡", budget: 7000000},
            {name: "FC Groningue", emoji: "🟢", budget: 7000000},
            {name: "RKC Waalwijk", emoji: "🟡", budget: 6000000},
            {name: "PEC Zwolle", emoji: "🔵", budget: 6000000},
            {name: "Fortuna Sittard", emoji: "🟡", budget: 5500000},
            {name: "FC Emmen", emoji: "🔴", budget: 5000000},
            {name: "Almere City FC", emoji: "🔴", budget: 5000000},
            {name: "NAC Breda", emoji: "🟡", budget: 6000000}
        ]},
    // ====== BELGIQUE 2025-2026 ======
    jupiler_be: {name: "Jupiler Pro League", flag: "🇧🇪", tier: 1, country: "belgium", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Club Bruges", emoji: "🔵", budget: 70000000},
            {name: "Anderlecht", emoji: "🟣", budget: 55000000},
            {name: "Gand", emoji: "🔵", budget: 35000000},
            {name: "Standard Liège", emoji: "🔴", budget: 20000000},
            {name: "Union Saint-Gilloise", emoji: "🟡", budget: 22000000},
            {name: "Antwerp FC", emoji: "🔴", budget: 25000000},
            {name: "Genk", emoji: "🔵", budget: 28000000},
            {name: "OHL", emoji: "🔴", budget: 8000000},
            {name: "Westerlo", emoji: "🟡", budget: 7000000},
            {name: "Cercle Bruges", emoji: "🟢", budget: 9000000},
            {name: "Charleroi", emoji: "⚫", budget: 10000000},
            {name: "Malines", emoji: "🟡", budget: 8000000},
            {name: "Beerschot VA", emoji: "🟣", budget: 7000000},
            {name: "Saint-Trond", emoji: "🟡", budget: 6500000},
            {name: "Mouscron", emoji: "🟣", budget: 5000000},
            {name: "RFC Seraing", emoji: "🔴", budget: 4500000}
        ]},
    // ====== TURQUIE 2025-2026 ======
    superlig_tr: {name: "Trendyol Süper Lig", flag: "🇹🇷", tier: 1, country: "turkey", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Galatasaray", emoji: "🔴", budget: 110000000},
            {name: "Fenerbahçe", emoji: "🟡", budget: 100000000},
            {name: "Beşiktaş", emoji: "⚫", budget: 70000000},
            {name: "Trabzonspor", emoji: "🟤", budget: 35000000},
            {name: "Başakşehir FK", emoji: "🟠", budget: 25000000},
            {name: "Sivasspor", emoji: "🔴", budget: 12000000},
            {name: "Kayserispor", emoji: "🔴", budget: 10000000},
            {name: "Antalyaspor", emoji: "🟠", budget: 9000000},
            {name: "Konyaspor", emoji: "🟢", budget: 9000000},
            {name: "Rizespor", emoji: "🟢", budget: 7000000},
            {name: "Kasımpaşa", emoji: "🔵", budget: 8000000},
            {name: "Alanyaspor", emoji: "🔴", budget: 10000000},
            {name: "Gaziantep FK", emoji: "🔴", budget: 7000000},
            {name: "Hatayspor", emoji: "🔵", budget: 6500000},
            {name: "Adana Demirspor", emoji: "🔵", budget: 9000000},
            {name: "Samsunspor", emoji: "🔴", budget: 7000000},
            {name: "Eyüpspor", emoji: "🔵", budget: 8000000},
            {name: "Bodrum FK", emoji: "🔵", budget: 6000000},
            {name: "Göztepe", emoji: "🟡", budget: 7000000}
        ]},
    // ====== RÉP. TCHÈQUE 2025-2026 ======
    chance_liga_cz: {name: "Chance Liga", flag: "🇨🇿", tier: 1, country: "czech", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Slavia Prague", emoji: "🔴", budget: 30000000},
            {name: "Sparta Prague", emoji: "🔴", budget: 28000000},
            {name: "Viktoria Plzeň", emoji: "🔵", budget: 15000000},
            {name: "Baník Ostrava", emoji: "🔵", budget: 9000000},
            {name: "Mlada Boleslav", emoji: "🔵", budget: 7000000},
            {name: "Slovan Liberec", emoji: "🔵", budget: 7000000},
            {name: "Sigma Olomouc", emoji: "🔵", budget: 6000000},
            {name: "Bohemians 1905", emoji: "🟢", budget: 5000000},
            {name: "FK Jablonec", emoji: "🟡", budget: 5500000},
            {name: "FC Hradec Králové", emoji: "🔴", budget: 4500000},
            {name: "FK Teplice", emoji: "🟡", budget: 4500000},
            {name: "1. FC Slovácko", emoji: "🔵", budget: 4000000},
            {name: "FK Pardubice", emoji: "🔵", budget: 4000000},
            {name: "Zbrojovka Brno", emoji: "🔵", budget: 4000000},
            {name: "Dukla Prague", emoji: "🔴", budget: 3500000},
            {name: "FK Příbram", emoji: "🔵", budget: 3000000}
        ]},
    // ====== ISRAËL 2025-2026 ======
    ligat_haal_il: {name: "Ligat ha'Al", flag: "🇮🇱", tier: 1, country: "israel", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Maccabi Tel-Aviv", emoji: "🟡", budget: 30000000},
            {name: "Maccabi Haïfa", emoji: "🟢", budget: 25000000},
            {name: "Beitar Jérusalem", emoji: "🟡", budget: 14000000},
            {name: "Hapoel Be'er Sheva", emoji: "🔴", budget: 12000000},
            {name: "Hapoel Tel-Aviv", emoji: "🔴", budget: 8000000},
            {name: "Maccabi Petah Tikva", emoji: "🟡", budget: 6000000},
            {name: "Bnei Yehuda", emoji: "🟡", budget: 5000000},
            {name: "Hapoel Haïfa", emoji: "🔴", budget: 5500000},
            {name: "FC Ashdod", emoji: "🔵", budget: 4500000},
            {name: "Ironi Kiryat Shmona", emoji: "🔴", budget: 4000000},
            {name: "Hapoel Kfar Saba", emoji: "🔵", budget: 3500000},
            {name: "Maccabi Bnei Reineh", emoji: "⚫", budget: 3500000},
            {name: "Hapoel Jerusalem", emoji: "⚪", budget: 4000000},
            {name: "Bnei Sakhnin", emoji: "🔵", budget: 3000000}
        ]},
    // ====== CHYPRE 2025-2026 ======
    cyta_cy: {name: "Cyta Championship", flag: "🇨🇾", tier: 1, country: "cyprus", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "APOEL Nicosie", emoji: "🔵", budget: 12000000},
            {name: "Omonia Nicosie", emoji: "🟢", budget: 10000000},
            {name: "AEK Larnaka", emoji: "🟡", budget: 8000000},
            {name: "Apollon Limassol", emoji: "🔵", budget: 7000000},
            {name: "Anorthosis Famagouste", emoji: "🔵", budget: 6000000},
            {name: "Aris Limassol", emoji: "🟡", budget: 4500000},
            {name: "Pafos FC", emoji: "🔵", budget: 5000000},
            {name: "Ethnikos Achnas", emoji: "🔵", budget: 3000000},
            {name: "Nea Salamis", emoji: "🔵", budget: 2500000},
            {name: "Olympiakos Nicosie", emoji: "🔴", budget: 2500000}
        ]},
    // ====== HONGRIE 2025-2026 ======
    otp_liga_hu: {name: "OTP Bank Liga", flag: "🇭🇺", tier: 1, country: "hungary", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Ferencváros TC", emoji: "🟢", budget: 28000000},
            {name: "MOL Fehérvár FC", emoji: "🔴", budget: 12000000},
            {name: "Puskás Akadémia", emoji: "🔵", budget: 8000000},
            {name: "Újpest FC", emoji: "🟣", budget: 6000000},
            {name: "MTK Budapest", emoji: "🔵", budget: 5000000},
            {name: "Debreceni VSC", emoji: "🔴", budget: 5500000},
            {name: "ETO FC Győr", emoji: "🟢", budget: 4000000},
            {name: "Pécsi MFC", emoji: "🔵", budget: 3000000},
            {name: "Kecskeméti TE", emoji: "🔵", budget: 3500000},
            {name: "Zalaegerszeg FC", emoji: "🔵", budget: 3500000},
            {name: "Diósgyőr VTK", emoji: "🔴", budget: 3000000},
            {name: "Gyirmót FC", emoji: "🟢", budget: 2500000}
        ]},
    // ====== BULGARIE 2025-2026 ======
    efbet_liga_bg: {name: "efbet Liga", flag: "🇧🇬", tier: 1, country: "bulgaria", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "CSKA Sofia", emoji: "🔴", budget: 12000000},
            {name: "Ludogorets Razgrad", emoji: "🟢", budget: 18000000},
            {name: "Levski Sofia", emoji: "🔵", budget: 10000000},
            {name: "Lokomotiv Sofia", emoji: "🔴", budget: 6000000},
            {name: "CFKA Sredets", emoji: "🔴", budget: 4000000},
            {name: "Botev Plovdiv", emoji: "🟡", budget: 4500000},
            {name: "Lokomotiv Plovdiv", emoji: "🔴", budget: 4000000},
            {name: "Slavia Sofia", emoji: "⚪", budget: 3500000},
            {name: "Beroe Stara Zagora", emoji: "🟢", budget: 3000000},
            {name: "Etar Tarnovo", emoji: "🟢", budget: 2500000},
            {name: "Hebar Pazardzhik", emoji: "🔵", budget: 2000000},
            {name: "Cherno More Varna", emoji: "🔵", budget: 2500000}
        ]},
    // ====== SLOVAQUIE 2025-2026 ======
    nike_liga_sk: {name: "Niké Liga", flag: "🇸🇰", tier: 1, country: "slovakia", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "Slovan Bratislava", emoji: "🔵", budget: 18000000},
            {name: "Spartak Trnava", emoji: "🔴", budget: 7000000},
            {name: "DAC Dunajská Streda", emoji: "🟡", budget: 6000000},
            {name: "FC Košice", emoji: "🔵", budget: 5000000},
            {name: "Žilina", emoji: "🟡", budget: 5500000},
            {name: "MFK Ružomberok", emoji: "🔴", budget: 3500000},
            {name: "Trenčín", emoji: "🔵", budget: 3000000},
            {name: "Zlaté Moravce", emoji: "⚪", budget: 2500000},
            {name: "Tatran Prešov", emoji: "🔵", budget: 2500000},
            {name: "FK Pohronie", emoji: "🟢", budget: 2000000}
        ]},
    // ====== AZERBAÏDJAN 2025-2026 ======
    premyer_az: {name: "Misli Premyer Liqası", flag: "🇦🇿", tier: 1, country: "azerbaijan", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Qarabağ FK", emoji: "🔴", budget: 20000000},
            {name: "Neftçi Bakou", emoji: "🔵", budget: 10000000},
            {name: "FK Zira", emoji: "🟢", budget: 5000000},
            {name: "Sabah FK", emoji: "🟡", budget: 5000000},
            {name: "Shamakhi FK", emoji: "🟠", budget: 4000000},
            {name: "AZAL FK", emoji: "🔵", budget: 3000000},
            {name: "Kapaz FK", emoji: "🔵", budget: 2500000},
            {name: "Turan Tovuz", emoji: "🔵", budget: 2000000}
        ]},
    // ====== SLOVÉNIE 2025-2026 ======
    prvaliga_si: {name: "PrvaLiga Telemach", flag: "🇸🇮", tier: 1, country: "slovenia", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "NK Celje", emoji: "🟡", budget: 8000000},
            {name: "NK Olimpija Ljubljana", emoji: "🟢", budget: 9000000},
            {name: "NK Maribor", emoji: "🟣", budget: 7000000},
            {name: "NK Koper", emoji: "🔵", budget: 3500000},
            {name: "NK Bravo", emoji: "🟢", budget: 3000000},
            {name: "NK Mura", emoji: "⚫", budget: 2500000},
            {name: "NK Radomlje", emoji: "🔵", budget: 2000000},
            {name: "NK Domžale", emoji: "🟡", budget: 2500000},
            {name: "NK Aluminij", emoji: "🔵", budget: 2000000},
            {name: "FC Koper 1920", emoji: "🔵", budget: 1800000}
        ]},
    // ====== IRLANDE 2025-2026 ======
    sse_ie: {name: "SSE Airtricity Premier Division", flag: "🇮🇪", tier: 1, country: "ireland", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Shamrock Rovers", emoji: "🟢", budget: 5000000},
            {name: "Shelbourne FC", emoji: "🔴", budget: 3500000},
            {name: "Bohemian FC", emoji: "🔴", budget: 3000000},
            {name: "Dundalk FC", emoji: "🟢", budget: 2800000},
            {name: "Derry City", emoji: "🔴", budget: 2500000},
            {name: "St Patrick's Athletic", emoji: "🔴", budget: 2200000},
            {name: "Drogheda United", emoji: "🔴", budget: 1800000},
            {name: "Sligo Rovers", emoji: "🔴", budget: 1600000},
            {name: "Cork City", emoji: "🟢", budget: 1800000},
            {name: "Galway United", emoji: "🟢", budget: 1500000}
        ]},
    // ====== FINLANDE 2025-2026 ======
    veikkausliiga_fi: {name: "Veikkausliiga", flag: "🇫🇮", tier: 1, country: "finland", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "HJK Helsinki", emoji: "🔵", budget: 10000000},
            {name: "FC Inter Turku", emoji: "🔴", budget: 4000000},
            {name: "KuPS Kuopio", emoji: "🟡", budget: 3500000},
            {name: "FC Haka", emoji: "🟡", budget: 3000000},
            {name: "Ilves Tampere", emoji: "🟡", budget: 2800000},
            {name: "SJK Seinäjoki", emoji: "🔵", budget: 2500000},
            {name: "VPS Vaasa", emoji: "🔵", budget: 2000000},
            {name: "FC Lahti", emoji: "🔵", budget: 2000000},
            {name: "AC Oulu", emoji: "🔵", budget: 1800000},
            {name: "KTP Kotka", emoji: "🔴", budget: 1500000},
            {name: "IF Gnistan", emoji: "🔵", budget: 1500000},
            {name: "FC Jazz Pori", emoji: "🔴", budget: 1500000}
        ]},
    // ====== ISLANDE 2025-2026 ======
    urvalsdeild_is: {name: "Besta deild karla", flag: "🇮🇸", tier: 1, country: "iceland", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "KR Reykjavik", emoji: "🔵", budget: 3000000},
            {name: "Valur Reykjavik", emoji: "🔴", budget: 2500000},
            {name: "Breiðablik", emoji: "🔵", budget: 2500000},
            {name: "FH Hafnarfjörður", emoji: "🔵", budget: 2200000},
            {name: "Víkingur Reykjavik", emoji: "🔴", budget: 2000000},
            {name: "ÍBV Vestmannaeyjar", emoji: "⚪", budget: 1500000},
            {name: "Keflavík IF", emoji: "🔵", budget: 1200000},
            {name: "Throttur Reykjavik", emoji: "🟡", budget: 1000000},
            {name: "Fram Reykjavik", emoji: "⚪", budget: 1200000},
            {name: "HK Kopavogur", emoji: "🔵", budget: 900000}
        ]},
    // ====== ALBANIE 2025-2026 ======
    superiore_al: {name: "Abissnet Superiore", flag: "🇦🇱", tier: 1, country: "albania", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 3,
        clubs: [
            {name: "SK Tirana", emoji: "🔴", budget: 4000000},
            {name: "FK Partizani", emoji: "🔴", budget: 3500000},
            {name: "FK Vllaznia", emoji: "🔴", budget: 3000000},
            {name: "KF Skënderbeu", emoji: "🔵", budget: 2500000},
            {name: "FK Dinamo Tirana", emoji: "🔵", budget: 2000000},
            {name: "FK Laçi", emoji: "🟡", budget: 1800000},
            {name: "FK Egnatia", emoji: "🔵", budget: 1800000},
            {name: "FK Kukësi", emoji: "🔵", budget: 2000000},
            {name: "KF Bylis", emoji: "🟡", budget: 1500000},
            {name: "FK Teuta Durrës", emoji: "🔵", budget: 1800000}
        ]},
    // ====== LUXEMBOURG 2025-2026 ======
    bgl_lu: {name: "BGL Ligue", flag: "🇱🇺", tier: 1, country: "luxembourg", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "F91 Dudelange", emoji: "🟡", budget: 2500000},
            {name: "Fola Esch", emoji: "🔴", budget: 1800000},
            {name: "Swift Hesperange", emoji: "🔵", budget: 1600000},
            {name: "Racing FC Union Lux.", emoji: "🔵", budget: 1400000},
            {name: "Progrès Niederkorn", emoji: "🟣", budget: 1200000},
            {name: "Strassen FC", emoji: "🔵", budget: 1000000},
            {name: "Etzella Ettelbruck", emoji: "🔵", budget: 900000},
            {name: "US Hostert", emoji: "⚪", budget: 800000},
            {name: "Differdange 03", emoji: "🔵", budget: 800000},
            {name: "CS Pétange", emoji: "🔵", budget: 700000}
        ]},
    // ====== ANDORRE 2025-2026 ======
    primera_ad: {name: "Primera Divisió", flag: "🇦🇩", tier: 1, country: "andorra", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FC Andorra", emoji: "🔵", budget: 3000000},
            {name: "FC Santa Coloma", emoji: "🟡", budget: 600000},
            {name: "Inter Club d'Escaldes", emoji: "🔵", budget: 500000},
            {name: "UE Santa Coloma", emoji: "⚪", budget: 450000},
            {name: "UE Engordany", emoji: "🟢", budget: 350000},
            {name: "FC Lusitans", emoji: "🔴", budget: 300000},
            {name: "CE Carroi", emoji: "🟡", budget: 250000},
            {name: "FC Ordino", emoji: "🔵", budget: 250000}
        ]},
    // ====== GIBRALTAR 2025-2026 ======
    gfl_gi: {name: "Gibraltar Football League", flag: "🇬🇮", tier: 1, country: "gibraltar", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Lincoln Red Imps", emoji: "🔴", budget: 800000},
            {name: "Europa FC", emoji: "🔵", budget: 600000},
            {name: "St Joseph's FC", emoji: "🔴", budget: 450000},
            {name: "Glacis United", emoji: "🟡", budget: 350000},
            {name: "Mons Calpe SC", emoji: "🔵", budget: 300000},
            {name: "Lions Gibraltar FC", emoji: "🟡", budget: 250000},
            {name: "Bruno's Magpies", emoji: "⚫", budget: 250000},
            {name: "Boca Juniors GFC", emoji: "🔵", budget: 200000}
        ]},
    // ====== SAINT-MARIN 2025-2026 ======
    campionato_sm: {name: "Campionato Sammarinese", flag: "🇸🇲", tier: 1, country: "sanmarino", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "SP Tre Fiori", emoji: "🟡", budget: 200000},
            {name: "SS Folgore", emoji: "🔵", budget: 180000},
            {name: "La Fiorita", emoji: "🟢", budget: 170000},
            {name: "SP Cosmos", emoji: "🔵", budget: 150000},
            {name: "SS Murata", emoji: "🔵", budget: 140000},
            {name: "Virtus FC", emoji: "⚫", budget: 130000},
            {name: "Libertas FC", emoji: "🔵", budget: 120000},
            {name: "SP Tre Penne", emoji: "🔵", budget: 120000},
            {name: "Domagnano FC", emoji: "⚪", budget: 110000},
            {name: "Pennarossa FC", emoji: "🔵", budget: 100000},
            {name: "San Giovanni FC", emoji: "🔴", budget: 100000},
            {name: "Faetano FC", emoji: "🔵", budget: 90000}
        ]},
    // ====== PAYS DE GALLES 2025-2026 ======
    cymru_prem_wls: {name: "Cymru Premier", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", tier: 1, country: "wales", countryCode: "gb-wls", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "The New Saints", emoji: "🟢", budget: 3500000},
            {name: "Connah's Quay Nomads", emoji: "🔴", budget: 1800000},
            {name: "Bala Town", emoji: "⚫", budget: 1400000},
            {name: "Penybont FC", emoji: "🔵", budget: 1200000},
            {name: "Newtown AFC", emoji: "🔴", budget: 1000000},
            {name: "Caernarfon Town", emoji: "🟡", budget: 900000},
            {name: "Haverfordwest County", emoji: "🔵", budget: 850000},
            {name: "Cardiff Met University", emoji: "🟣", budget: 750000}
        ]},
    // ====== IRLANDE DU NORD 2025-2026 ======
    nifl_nir: {name: "NIFL Premiership", flag: "🇬🇧", tier: 1, country: "northernireland", countryCode: "gb-nir", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Linfield FC", emoji: "🔵", budget: 4000000},
            {name: "Larne FC", emoji: "🔴", budget: 3800000},
            {name: "Glentoran FC", emoji: "🟢", budget: 2500000},
            {name: "Cliftonville FC", emoji: "🔴", budget: 2200000},
            {name: "Crusaders FC", emoji: "🔴", budget: 2000000},
            {name: "Coleraine FC", emoji: "🔵", budget: 1800000},
            {name: "Ballymena United", emoji: "⚪", budget: 1400000},
            {name: "Dungannon Swifts", emoji: "🔵", budget: 1100000}
        ]},
    // ====== BOSNIE-HERZÉGOVINE 2025-2026 ======
    premijer_ba: {name: "Premijer Liga BiH", flag: "🇧🇦", tier: 1, country: "bosnia", countryCode: "ba", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Zrinjski Mostar", emoji: "⚪", budget: 7000000},
            {name: "FK Sarajevo", emoji: "🔴", budget: 6500000},
            {name: "Borac Banja Luka", emoji: "🔴", budget: 6000000},
            {name: "Željezničar Sarajevo", emoji: "🔵", budget: 4500000},
            {name: "Velež Mostar", emoji: "🔴", budget: 4000000},
            {name: "Široki Brijeg", emoji: "🔵", budget: 3500000},
            {name: "Posušje", emoji: "🔵", budget: 2200000},
            {name: "Sloga Doboj", emoji: "🔴", budget: 2000000}
        ]},
    // ====== MACÉDOINE DU NORD 2025-2026 ======
    "1mfl_mk": {name: "1. MFL", flag: "🇲🇰", tier: 1, country: "northmacedonia", countryCode: "mk", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "KF Shkëndija", emoji: "🔴", budget: 4500000},
            {name: "FC Struga", emoji: "🔴", budget: 4000000},
            {name: "FK Vardar", emoji: "🔴", budget: 3500000},
            {name: "FC Shkupi", emoji: "🔵", budget: 3000000},
            {name: "Sileks Kratovo", emoji: "🔴", budget: 2000000},
            {name: "Tikveš Kavadarci", emoji: "🔴", budget: 1800000},
            {name: "Rabotnički Skopje", emoji: "🔴", budget: 1600000},
            {name: "Pelister Bitola", emoji: "🟢", budget: 1400000}
        ]},
    // ====== MONTÉNÉGRO 2025-2026 ======
    "1cfl_me": {name: "1. CFL", flag: "🇲🇪", tier: 1, country: "montenegro", countryCode: "me", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Budućnost Podgorica", emoji: "🔵", budget: 4000000},
            {name: "Sutjeska Nikšić", emoji: "🔵", budget: 3500000},
            {name: "Dečić Tuzi", emoji: "🔵", budget: 3200000},
            {name: "Mornar Bar", emoji: "🔵", budget: 2000000},
            {name: "Arsenal Tivat", emoji: "🔴", budget: 1600000},
            {name: "Petrovac", emoji: "🔵", budget: 1400000},
            {name: "Bokelj Kotor", emoji: "🔵", budget: 1200000},
            {name: "Jezero Plav", emoji: "🔵", budget: 1000000}
        ]},
    // ====== GÉORGIE 2025-2026 ======
    crystalbet_ge: {name: "Erovnuli Liga", flag: "🇬🇪", tier: 1, country: "georgia", countryCode: "ge", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Dinamo Tbilisi", emoji: "🔵", budget: 6000000},
            {name: "Torpedo Kutaisi", emoji: "⚪", budget: 5000000},
            {name: "Dinamo Batumi", emoji: "🔵", budget: 4800000},
            {name: "Iberia 1999 (Saburtalo)", emoji: "🔴", budget: 4000000},
            {name: "Dila Gori", emoji: "🔴", budget: 3200000},
            {name: "Samgurali Tskhaltubo", emoji: "🟢", budget: 2000000},
            {name: "Gagra", emoji: "🔵", budget: 1600000},
            {name: "Telavi", emoji: "🔵", budget: 1400000}
        ]},
    // ====== ARMÉNIE 2025-2026 ======
    premier_am: {name: "IDBank Premier League", flag: "🇦🇲", tier: 1, country: "armenia", countryCode: "am", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FC Pyunik", emoji: "🔵", budget: 5500000},
            {name: "FC Noah", emoji: "⚫", budget: 5000000},
            {name: "Ararat-Armenia", emoji: "🔴", budget: 4800000},
            {name: "Urartu FC", emoji: "🟣", budget: 4200000},
            {name: "Alashkert FC", emoji: "🟡", budget: 3000000},
            {name: "Shirak Gyumri", emoji: "🔴", budget: 2000000},
            {name: "Van Charentsavan", emoji: "🔴", budget: 1600000},
            {name: "West Armenia", emoji: "🔵", budget: 1200000}
        ]},
    // ====== KAZAKHSTAN 2025-2026 ======
    premier_kz: {name: "QFL Premier League", flag: "🇰🇿", tier: 1, country: "kazakhstan", countryCode: "kz", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FC Astana", emoji: "🟡", budget: 14000000},
            {name: "Kairat Almaty", emoji: "🟡", budget: 12000000},
            {name: "Ordabasy Shymkent", emoji: "🔵", budget: 9000000},
            {name: "Tobol Kostanay", emoji: "🟡", budget: 8500000},
            {name: "Aktobe", emoji: "🔴", budget: 7500000},
            {name: "Yelimay Semey", emoji: "🔵", budget: 4500000},
            {name: "Kyzylzhar Petropavlovsk", emoji: "🔵", budget: 3500000},
            {name: "Atyrau", emoji: "🟢", budget: 3000000}
        ]},
    // ====== MOLDAVIE 2025-2026 ======
    super_liga_md: {name: "Super Liga", flag: "🇲🇩", tier: 1, country: "moldova", countryCode: "md", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Sheriff Tiraspol", emoji: "🟡", budget: 12000000},
            {name: "Petrocub Hîncești", emoji: "⚪", budget: 5000000},
            {name: "Zimbru Chișinău", emoji: "🟡", budget: 3500000},
            {name: "Milsami Orhei", emoji: "🔴", budget: 2800000},
            {name: "Bălți", emoji: "🔴", budget: 1800000},
            {name: "Dacia Buiucani", emoji: "🟡", budget: 1200000},
            {name: "Spartanii Selemet", emoji: "🔵", budget: 900000},
            {name: "Florești", emoji: "🔴", budget: 800000}
        ]},
    // ====== BIÉLORUSSIE 2025-2026 ======
    vysheyshaya_by: {name: "Vysheyshaya Liga", flag: "🇧🇾", tier: 1, country: "belarus", countryCode: "by", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Dinamo Minsk", emoji: "🔵", budget: 6000000},
            {name: "Neman Grodno", emoji: "🟢", budget: 4500000},
            {name: "Torpedo-BelAZ Zhodino", emoji: "🔴", budget: 4000000},
            {name: "BATE Borisov", emoji: "🟡", budget: 4500000},
            {name: "Dinamo Brest", emoji: "🔵", budget: 3500000},
            {name: "Vitebsk", emoji: "🔵", budget: 2200000},
            {name: "Gomel", emoji: "🟢", budget: 2000000},
            {name: "Isloch Minsk", emoji: "⚪", budget: 1800000}
        ]},
    // ====== ESTONIE 2025-2026 ======
    premium_liiga_ee: {name: "Premium Liiga", flag: "🇪🇪", tier: 1, country: "estonia", countryCode: "ee", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FC Flora Tallinn", emoji: "🟢", budget: 3800000},
            {name: "FCI Levadia Tallinn", emoji: "🟢", budget: 4000000},
            {name: "Paide Linnameeskond", emoji: "🔵", budget: 2800000},
            {name: "Nõmme Kalju", emoji: "⚫", budget: 2200000},
            {name: "Vaprus Pärnu", emoji: "🟡", budget: 1200000},
            {name: "Tartu Tammeka", emoji: "🔵", budget: 1100000},
            {name: "Trans Narva", emoji: "🔴", budget: 1000000},
            {name: "Kuressaare", emoji: "🟡", budget: 900000}
        ]},
    // ====== LETTONIE 2025-2026 ======
    virsliga_lv: {name: "Tonybet Virslīga", flag: "🇱🇻", tier: 1, country: "latvia", countryCode: "lv", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FK RFS", emoji: "🔵", budget: 7500000},
            {name: "Riga FC", emoji: "🔵", budget: 8000000},
            {name: "FK Auda", emoji: "🟢", budget: 3000000},
            {name: "Valmiera FC", emoji: "⚫", budget: 2500000},
            {name: "FK Liepāja", emoji: "🔴", budget: 2000000},
            {name: "Daugavpils", emoji: "🔵", budget: 1500000},
            {name: "Jelgava", emoji: "🔴", budget: 1100000},
            {name: "Grobiņa", emoji: "🔵", budget: 900000}
        ]},
    // ====== LITUANIE 2025-2026 ======
    alyga_lt: {name: "TOPsport A Lyga", flag: "🇱🇹", tier: 1, country: "lithuania", countryCode: "lt", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FK Žalgiris Vilnius", emoji: "🟢", budget: 6000000},
            {name: "FK Panevėžys", emoji: "🔴", budget: 4200000},
            {name: "Kauno Žalgiris", emoji: "🟢", budget: 3800000},
            {name: "FC Hegelmann", emoji: "🔵", budget: 3000000},
            {name: "FA Šiauliai", emoji: "🟡", budget: 2200000},
            {name: "DFK Dainava", emoji: "🔴", budget: 1500000},
            {name: "Banga Gargždai", emoji: "🟠", budget: 1300000},
            {name: "Džiugas Telšiai", emoji: "🔴", budget: 1100000}
        ]},
    // ====== ÎLES FÉROÉ 2025-2026 ======
    betrideildin_fo: {name: "Betri deildin", flag: "🇫🇴", tier: 1, country: "faroe", countryCode: "fo", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "KÍ Klaksvík", emoji: "🔵", budget: 3000000},
            {name: "Víkingur Gøta", emoji: "🔵", budget: 2200000},
            {name: "HB Tórshavn", emoji: "🔴", budget: 2000000},
            {name: "B36 Tórshavn", emoji: "⚪", budget: 1800000},
            {name: "NSÍ Runavík", emoji: "🟡", budget: 1200000},
            {name: "07 Vestur", emoji: "⚪", budget: 900000},
            {name: "EB/Streymur", emoji: "🔵", budget: 800000},
            {name: "B68 Toftir", emoji: "🔴", budget: 700000}
        ]},
    // ====== MALTE 2025-2026 ======
    premier_mt: {name: "360Sports Malta Premier", flag: "🇲🇹", tier: 1, country: "malta", countryCode: "mt", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "Ħamrun Spartans", emoji: "🔴", budget: 3500000},
            {name: "Floriana FC", emoji: "🟢", budget: 2600000},
            {name: "Sliema Wanderers", emoji: "🔵", budget: 2400000},
            {name: "Hibernians FC", emoji: "⚪", budget: 2200000},
            {name: "Birkirkara FC", emoji: "🟡", budget: 2000000},
            {name: "Marsaxlokk FC", emoji: "🔵", budget: 1600000},
            {name: "Mosta FC", emoji: "🔵", budget: 1300000},
            {name: "Gżira United", emoji: "🔴", budget: 1200000}
        ]},
    // ====== KOSOVO 2025-2026 ======
    superliga_xk: {name: "AlbiMall Superliga", flag: "🇽🇰", tier: 1, country: "kosovo", countryCode: "xk", relegatesTo: null,
        promotionSpots: 0, playoffSpots: 0, relegationSpots: 2,
        clubs: [
            {name: "FC Ballkani", emoji: "🟠", budget: 4500000},
            {name: "FC Drita", emoji: "🔵", budget: 4000000},
            {name: "FC Prishtina", emoji: "🔵", budget: 3200000},
            {name: "KF Llapi", emoji: "🔵", budget: 2800000},
            {name: "KF Malisheva", emoji: "🔴", budget: 1800000},
            {name: "KF Gjilani", emoji: "🔴", budget: 1600000},
            {name: "KF Dukagjini", emoji: "🟢", budget: 1400000},
            {name: "KF Ferizaj", emoji: "🔵", budget: 1200000}
        ]}
};
const FIRST_NAMES = ["Lucas", "Antoine", "Hugo", "Théo", "Axel", "Mathis", "Noah", "Enzo", "Luca", "Pierre", "Kylian", "Marcus", "Soren", "Rayan", "Yanis", "Baptiste", "Maxime", "Julien", "Florian", "Dylan", "Karim", "Raheem", "Pierre-Emerick", "Moussa", "Youssef", "Houssem", "Romain", "Corentin", "Kevin", "Adrien"];
const LAST_NAMES = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Morel", "Simon", "Laurent", "Garcia", "Fernandez", "Rodriguez", "Michel", "David", "Bertrand", "Moreau", "Lefebvre", "Roux", "Diallo", "Mbappé", "Konaté", "Ndombélé", "Aouar", "Tchouaméni", "Guendouzi", "Camavinga", "Fofana", "Nkunku"];
const POSITIONS_POOL = [
    "GK",
    "DEF", "DEF", "DEF", "DEF",
    "MID", "MID", "MID", "MID",
    "ATT", "ATT", "ATT"
];
const UPGRADES_DEF = [
    {
        id: "academy", icon: "🏫",
        name: "Centre de formation",
        desc: "Vos joueurs progressent automatiquement après chaque match (+niveau par saison).",
        effect: "+{lvl} niv./match aléatoire",
        maxLevel: 5, cost: 5000000
    },
    {
        id: "scouting", icon: "🔭",
        name: "Réseau de scouts",
        desc: "Accède à des joueurs de meilleur niveau sur le marché des transferts.",
        effect: "+{lvl}×5 au niveau des joueurs du marché",
        maxLevel: 4, cost: 8000000
    },
    {
        id: "stadium", icon: "🏟️",
        name: "Agrandissement du stade",
        desc: "Augmente les revenus par match joué (victoire, nul, défaite).",
        effect: "+{lvl}×50 000 € par match",
        maxLevel: 5, cost: 12000000
    },
    {
        id: "medical", icon: "⚕️",
        name: "Staff médical",
        desc: "Réduit les risques d'expulsion et d'incident en match.",
        effect: "Moins d'événements négatifs",
        maxLevel: 3, cost: 6000000
    },
    {
        id: "coaching", icon: "📋",
        name: "Équipe d'entraîneurs",
        desc: "Boost permanent de la force globale de l'équipe (+5 par niveau).",
        effect: "+{lvl}×5 à la force d'équipe",
        maxLevel: 5, cost: 10000000
    }
];
// ======================================================
//  UTILITIES
// ======================================================
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randName() {
    return FIRST_NAMES[rand(0, FIRST_NAMES.length - 1)] + " " + LAST_NAMES[rand(0, LAST_NAMES.length - 1)];
}
function fmtMoney(v) {
    const abs = Math.abs(v);
    if (abs >= 1e6) {
        const m = v / 1e6;
        return (Number.isInteger(m) ? m : m.toFixed(1)) + "M €";
    }
    if (abs >= 1000)
        return Math.round(v / 1000) + "k €";
    return v + " €";
}

// =====================================================
//  MODULE-LEVEL CONSTANTS (shared across renders)
// =====================================================
const PROFILE_LABELS = {
    buteur: '🎯 Buteur', clutch: '⚡ Clutch', fragile: '🩹 Fragile',
    irregulier: '🎲 Irrégulier', leader: '💪 Leader'
};
const PROFILE_CLS = {
    buteur: 'buteur', clutch: 'clutch', fragile: 'fragile',
    irregulier: 'irregulier', leader: 'leader'
};


// ======================================================
//  GAME STATE
// ======================================================
// =====================================================
//  DOM CACHE — avoid repeated getElementById calls
// =====================================================
const _dom = {};
function _el(id) {
    return _dom[id] || (_dom[id] = document.getElementById(id));
}

let G = null;
let saveSlot = 0;
function getSaves() {
    const s = {};
    for (let i = 0; i < 3; i++) {
        try {
            const d = localStorage.getItem("fm_save_" + i);
            if (d)
                s[i] = JSON.parse(d);
        } catch (e) {
        }
    }
    return s;
}

// ======================================================
//  NOTE & POTENTIEL
//  p.level  = note actuelle (/99)
//  p.pot    = plafond réel du joueur (caché)
//  p.potMin / p.potMax = fourchette de potentiel affichée ;
//  elle se resserre autour de p.pot quand le joueur vieillit.
// ======================================================
function clampPlayerRating(value, fallback = 45) {
    const numeric = Number(value);
    return Math.max(1, Math.min(99, Math.round(Number.isFinite(numeric) ? numeric : fallback)));
}
function potGrowth(age) {          // marge de progression à la création
    if (age <= 19) return rand(10, 35);
    if (age <= 22) return rand(6, 25);
    if (age <= 25) return rand(2, 14);
    if (age <= 28) return rand(0, 5);
    if (age <= 30) return rand(0, 2);
    return 0;
}
function potWidth(age) {           // largeur de la fourchette affichée
    if (age <= 19) return 20;
    if (age <= 22) return 14;
    if (age <= 25) return 8;
    if (age <= 28) return 4;
    if (age <= 30) return 2;
    return 0;
}
function potRange(pot, level, age) {
    level = clampPlayerRating(level);
    pot = Math.max(level, clampPlayerRating(pot, level));
    const w = potWidth(age);
    const lo = Math.max(level, pot - rand(0, w));
    const hi = Math.min(99, Math.max(pot, lo + w));
    return {potMin: lo, potMax: hi};
}
function newPotential(level, age) {
    const current = clampPlayerRating(level);
    const pot = Math.min(99, current + potGrowth(age));
    return Object.assign({pot}, potRange(pot, current, age));
}
// Garantit que le joueur (effectif, marché ou jeune) a un potentiel — utile pour les anciennes sauvegardes
function ensurePot(p) {
    if (!p) return p;
    const levelKey = p.level !== undefined ? 'level' : p.currentLevel !== undefined ? 'currentLevel' : null;
    const rawLevel = levelKey ? p[levelKey] : (p.potMin ?? p.pot ?? p.potential);
    const level = clampPlayerRating(rawLevel);
    if (levelKey) p[levelKey] = level;

    const rawPot = p.pot !== undefined ? p.pot : p.potential;
    if (rawPot === undefined) {
        Object.assign(p, newPotential(level, p.age || 25));
        return p;
    }

    p.pot = Math.max(level, clampPlayerRating(rawPot, level));
    p.potMin = Math.min(p.pot, Math.max(level, clampPlayerRating(p.potMin ?? p.pot, level)));
    p.potMax = Math.max(p.pot, clampPlayerRating(p.potMax ?? p.pot, p.pot));
    if (p.potential !== undefined) p.potential = clampPlayerRating(p.potential, p.pot);
    return p;
}
// Fin de saison : le joueur progresse vers son potentiel, la fourchette se resserre
function developPlayer(p) {
    ensurePot(p);
    const age = p.age || 25;
    if (age >= 31) {                           // plus aucune marge : potentiel = note
        p.pot = p.level;
        p.potMin = p.potMax = p.level;
        return;
    }
    const gap = p.pot - p.level;
    if (gap > 0) {
        const share = age <= 21 ? 0.35 : age <= 25 ? 0.3 : 0.4;
        const gain = Math.max(1, Math.round(gap * share * (0.6 + Math.random() * 0.8)));
        p.level = Math.min(p.pot, p.level + gain);
    }
    refreshPotRange(p);
}
function refreshPotRange(p) {
    ensurePot(p);
    p.pot = Math.max(p.pot, p.level);
    const w = potWidth(p.age || 25);
    const lo = Math.max(p.level, p.potMin, p.pot - w);
    const hi = Math.max(p.pot, Math.min(p.potMax, lo + w));
    p.potMin = lo;
    p.potMax = hi;
}
function potText(p) {
    ensurePot(p);
    return p.potMin >= p.potMax ? String(p.potMax) : p.potMin + '–' + p.potMax;
}
function potColor(p) {
    ensurePot(p);
    const v = (p.potMin + p.potMax) / 2;
    return v >= 85 ? 'var(--accent)' : v >= 75 ? 'var(--accent2)' : v >= 65 ? 'var(--gold)' : 'var(--muted)';
}
// Valeur marchande : la note, plus une prime pour les jeunes à fort potentiel
function playerValue(p) {
    ensurePot(p);
    const base = p.level * 50000;
    if ((p.age || 25) > 24) return base;
    const gap = Math.max(0, (p.potMin + p.potMax) / 2 - p.level);
    return Math.round(base * (1 + Math.min(0.6, gap * 0.015)));
}
// Barre de note + zone fantôme indiquant la fourchette de potentiel
function levelBarHTML(p) {
    ensurePot(p);
    const color = p.level >= 80 ? "#3fb950" : p.level >= 68 ? "#58a6ff" : p.level >= 58 ? "#f0b429" : "#f85149";
    const lo = p.potMin, hi = Math.max(p.potMax, p.potMin);
    return `<div class="level-bar-bg pot-track" title="Note ${p.level} · Potentiel ${potText(p)}">` +
        `<div class="pot-range" style="left:${lo}%;width:${Math.max(1, hi - lo)}%"></div>` +
        `<div class="level-bar" style="width:${Math.round(p.level / 99 * 100)}%;background:${color}"></div></div>`;
}

function generateSquad(budget) {
    // Realistic base level derived from club budget (same scale as opponents)
    const baseRat = budgetToRating(budget);
    // Squad average = baseRat, with individual variance of ±8
    const base = Math.max(42, baseRat - 8);
    const PROFILES = ['buteur', 'clutch', 'fragile', 'irregulier', 'leader', null, null, null];
    return POSITIONS_POOL.map(pos => {
        const profile = PROFILES[rand(0, PROFILES.length - 1)];
        const level = clampPlayerRating(rand(base, base + 20));
        const age = rand(18, 34);
        return {
            name: randName(),
            pos,
            level,
            ...newPotential(level, age),
            wage: Math.max(1000, Math.round((budget * 0.34 / 22 / 12) * (0.52 + level / 300))),
            age,
            goals: 0,
            assists: 0,
            injuredGames: 0,
            profile: profile,
            happy: true // starts happy
        };
    });
}

function createLeagueClubState() {
    return Object.fromEntries(Object.entries(LEAGUES).map(([key, league]) => [
        key, league.clubs.map(club => ({...club}))
    ]));
}

function getLeagueClubs(leagueKey) {
    const savedClubs = G && G.leagueClubsByKey && G.leagueClubsByKey[leagueKey];
    return Array.isArray(savedClubs) && savedClubs.length ? savedClubs : LEAGUES[leagueKey].clubs;
}

function ensureLeagueClubState() {
    if (!G.leagueClubsByKey) G.leagueClubsByKey = createLeagueClubState();
    Object.keys(LEAGUES).forEach(key => {
        if (!Array.isArray(G.leagueClubsByKey[key]) || !G.leagueClubsByKey[key].length)
            G.leagueClubsByKey[key] = LEAGUES[key].clubs.map(club => ({...club}));
    });
    const current = G.leagueClubsByKey[G.leagueKey];
    if (!current.some(club => club.name === G.clubName)) {
        const club = Object.values(LEAGUES).flatMap(league => league.clubs).find(item => item.name === G.clubName)
            || {name: G.clubName, emoji: G.clubEmoji || '⚽', budget: G.money || 10000000};
        current[current.length - 1] = {...club};
    }
}

function moveClubBetweenLeagues(fromKey, toKey) {
    ensureLeagueClubState();
    const from = G.leagueClubsByKey[fromKey];
    const to = G.leagueClubsByKey[toKey];
    if (!from || !to || fromKey === toKey) return;
    if (!from.some(club => club.name === G.clubName)) return;
    const club = from.find(item => item.name === G.clubName)
        || Object.values(LEAGUES).flatMap(league => league.clubs).find(item => item.name === G.clubName)
        || {name: G.clubName, emoji: G.clubEmoji || '⚽', budget: G.money || 10000000};
    const swapIndex = to.length - 1;
    const displaced = to[swapIndex];
    to[swapIndex] = {...club};
    delete to[swapIndex].aiId;
    const fromIndex = from.findIndex(item => item.name === G.clubName);
    if (fromIndex >= 0) from.splice(fromIndex, 1);
    if (displaced) {
        from.push({...displaced});
        if (displaced.aiId && window.AIWorld && G.aiWorld && typeof AIWorld.moveClubLeague === 'function')
            AIWorld.moveClubLeague(G, toKey, fromKey, displaced.name, displaced.aiId);
    }
}

function generateStandings(myClubName, leagueKey) {
    const clubs = getLeagueClubs(leagueKey);
    const standings = clubs.map(c => ({
            name: c.name,
            emoji: c.emoji,
            budget: c.budget || 10000000,
            strength: budgetToRating(c.budget),
            isMe: c.name === myClubName,
            played: 0, won: 0, drawn: 0, lost: 0,
            gf: 0, ga: 0, points: 0
        }));
    return standings;
}

// Generate a proper double round-robin fixture list
function generateFixtures(leagueKey, myClubName) {
    const clubs = getLeagueClubs(leagueKey);
    const n = clubs.length;
    const list = clubs.map((_, i) => i);
    const fixtures = [];
    const half = n % 2 === 0 ? n - 1 : n;
    const paddedList = n % 2 === 0 ? [...list] : [...list, -1]; // -1 = bye
    const pn = paddedList.length;
    const rotating = paddedList.slice(1);
    for (let round = 0; round < half; round++) {
        const current = [paddedList[0], ...rotating];
        for (let i = 0; i < pn / 2; i++) {
            const h = current[i], a = current[pn - 1 - i];
            if (h !== -1 && a !== -1)
                fixtures.push({home: h, away: a, round});
        }
        rotating.push(rotating.shift()); // rotate
    }
    const returnF = fixtures.map(f => ({home: f.away, away: f.home, round: f.round + half}));
    return [...fixtures, ...returnF].map(f => ({
            homeClub: clubs[f.home],
            awayClub: clubs[f.away],
            matchDay: f.round + 1
        }));
}

function simulateLeagueMatchday(matchDay) {
    if (!G.fixtures) G.fixtures = generateFixtures(G.leagueKey, G.clubName);
    const rows = new Map(G.standings.map(row => [row.name, row]));
    const results = [];
    if (window.AIWorld) {
        const simulated = AIWorld.simulateMatchday(G, LEAGUES, G.leagueKey, matchDay, G.fixtures);
        if (simulated.processed) {
            simulated.results.forEach(game => {
                const home = rows.get(game.home), away = rows.get(game.away);
                if (!home || !away) return;
                const hg = game.homeGoals, ag = game.awayGoals;
                home.played++; away.played++; home.gf += hg; home.ga += ag; away.gf += ag; away.ga += hg;
                if (hg > ag) { home.won++; home.points += 3; away.lost++; }
                else if (hg < ag) { away.won++; away.points += 3; home.lost++; }
                else { home.drawn++; away.drawn++; home.points++; away.points++; }
                results.push(game);
            });
            G.leagueMatchResults = results;
            return results;
        }
    }
    const matches = G.fixtures.filter(f => f.matchDay === matchDay
        && f.homeClub.name !== G.clubName && f.awayClub.name !== G.clubName);
    for (const fixture of matches) {
        const home = rows.get(fixture.homeClub.name), away = rows.get(fixture.awayClub.name);
        if (!home || !away || home.played >= matchDay || away.played >= matchDay) continue;
        const homeStrength = home.strength || budgetToRating(home.budget || 10000000);
        const awayStrength = away.strength || budgetToRating(away.budget || 10000000);
        const homeChance = clampN(0.43 + (homeStrength - awayStrength + 4) / 60, 0.16, 0.74);
        const roll = Math.random();
        let homeGoals, awayGoals;
        if (roll < homeChance) { homeGoals = rand(1, 3); awayGoals = rand(0, homeGoals - 1); }
        else if (roll < homeChance + 0.24) { homeGoals = awayGoals = rand(0, 2); }
        else { awayGoals = rand(1, 3); homeGoals = rand(0, awayGoals - 1); }
        home.played++; away.played++;
        home.gf += homeGoals; home.ga += awayGoals;
        away.gf += awayGoals; away.ga += homeGoals;
        if (homeGoals > awayGoals) { home.won++; home.points += 3; away.lost++; }
        else if (homeGoals < awayGoals) { away.won++; away.points += 3; home.lost++; }
        else { home.drawn++; away.drawn++; home.points++; away.points++; }
        results.push({home: home.name, away: away.name, homeGoals, awayGoals});
    }
    G.leagueMatchResults = results;
    return results;
}

// Double round-robin length follows each league's club count. The Championship
// has 24 clubs (46 matches); Liga2 has 22 (42 matches).
function getSeasonLength(leagueKey) {
    const n = getLeagueClubs(leagueKey).length;
    return Math.max(0, (n - 1) * 2);
}

// ======================================================
//  PROMOTION / RELÉGATION
// ======================================================
function generateMarket(scoutLevel) {
    const count = 8 + scoutLevel * 2 + (G && G.staff && G.staff.recruteur ? 2 : 0);
    const PROFILES = ['buteur', 'clutch', 'fragile', 'irregulier', 'leader', null, null, null];
    return Array.from({length: count}, () => {
        const pos = POSITIONS_POOL[rand(0, POSITIONS_POOL.length - 1)];
        const lvl = clampPlayerRating(rand(55 + scoutLevel * 5, 82 + scoutLevel * 5));
        const basePrice = rand(5, 50 + scoutLevel * 10) * 1000000;
        const profile = PROFILES[rand(0, PROFILES.length - 1)];
        // Premium for certain profiles
        const profileMult = profile === 'buteur' ? 1.3 : profile === 'clutch' ? 1.2 : profile === 'leader' ? 1.15 : profile === 'fragile' ? 0.75 : 1.0;
        const age = rand(18, 32);
        const pot = newPotential(lvl, age);
        // Les jeunes à fort potentiel coûtent plus cher
        const potMult = age <= 24 ? 1 + Math.min(0.5, Math.max(0, (pot.potMin + pot.potMax) / 2 - lvl) * 0.01) : 1;
        return {
            name: randName(),
            pos,
            level: lvl,
            ...pot,
            age,
            price: Math.round(basePrice * profileMult * potMult),
            basePrice: Math.round(basePrice * profileMult * potMult),
            wage: Math.max(1000, Math.round(basePrice * 0.06 / 12)),
            profile: profile,
            demandFlex: rand(80, 120) // 80-120% of price they'll accept in nego
        };
    });
}

function renderMarket() {
    document.getElementById("transfer-market").innerHTML = (G.market || []).map((p, i) => {
        ensurePot(p);
        const canBuy = G.money >= p.price;
        const profileBadge = p.profile ? `<span class="profile-badge ${p.profile}" style="margin-left:0">${PROFILE_LABELS[p.profile]}</span>` : '';
        return `
              <div class="market-card">
                <div class="mc-header">
                  <div>
                    <div class="mc-name">${p.name}</div>
                    <div class="mc-meta">${p.age} ans · <span class="pos-badge ${p.pos}">${p.pos}</span></div>
                    ${profileBadge ? `<div style="margin-top:4px;">${profileBadge}</div>` : ''}
                  </div>
                </div>
                <div style="margin-top:12px;">
                  ${levelBarHTML(p)}
                  <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:5px;">
                    <span>Note <strong style="color:var(--text);font-size:13px;">${p.level}</strong> · Pot. <strong style="color:${potColor(p)};font-size:13px;">${potText(p)}</strong></span>
                    <span>${fmtMoney(p.wage)}/mois</span>
                  </div>
                </div>
                <div class="price-tag">${fmtMoney(p.price)}</div>
                <div style="display:flex;gap:6px;margin-top:8px;">
                  <button class="buy-btn" style="flex:2;" ${canBuy ? "" : "disabled"} onclick="buyPlayer(${i})">
                    ${canBuy ? "✓ Recruter" : "Budget insuffisant"}
                  </button>
                  <button class="buy-btn" style="flex:1;background:rgba(255,204,0,0.08);border-color:rgba(255,204,0,0.3);color:var(--gold);" onclick="negoPlayer(${i})">
                    💬 Négocier
                  </button>
                </div>
              </div>`;
    }).join("");
}

function negoPlayer(i) {
    const p = G.market[i];
    _negoPlayer = p;
    _negoBase = p.basePrice;
    document.getElementById('nego-emoji').textContent = '🤝';
    document.getElementById('nego-title').textContent = 'Négociation de transfert';
    document.getElementById('nego-desc').textContent = `Négociez le prix d'achat pour ${p.name}. L'agent est ouvert à la discussion.`;
    const slider = document.getElementById('nego-slider');
    const minPrice = Math.round(p.basePrice * 0.6);
    const maxPrice = Math.round(p.basePrice * 1.2);
    slider.min = minPrice;
    slider.max = maxPrice;
    slider.value = Math.round(p.basePrice * 0.85);
    updateNegoPrice(slider.value);
    document.getElementById('nego-hint').textContent = 'Plus votre offre est basse, plus il y a de chances de refus';
    // Override confirm for buying
    document.getElementById('nego-confirm').onclick = () => confirmNegoMarket(i);
    document.getElementById('nego-modal').style.display = 'flex';
}

function confirmNegoMarket(i) {
    const p = G.market[i];
    const price = parseInt(document.getElementById('nego-slider').value);
    const ratio = price / p.basePrice;
    const minRatio = (p.demandFlex || 90) / 100;
    document.getElementById('nego-modal').style.display = 'none';
    if (ratio >= minRatio) {
        if (G.money < price) {
            toast('Budget insuffisant !', 'error');
            return;
        }
        G.money -= price;
        const signed = {name: p.name, pos: p.pos, level: p.level, pot: p.pot, potMin: p.potMin, potMax: p.potMax, wage: p.wage, age: p.age, goals: 0, assists: 0, injuredGames: 0, profile: p.profile, happy: true};
        ensureContractState();
        ensureContractPlayerId(signed);
        G.squad.push(signed);
        G.contracts.push({playerId: signed.contractPlayerId, matchesLeft: rand(5, 38), wage: signed.wage || 0});
        G.market.splice(i, 1);
        updateTopBar();
        renderMarket();
        toast(p.name + ' recruté pour ' + fmtMoney(price) + ' !', 'success');
    } else {
        toast('Offre trop basse ! ' + p.name + ' refuse.', 'error');
        renderMarket();
    }
}

// ======================================================
//  MENU
// ======================================================
function updateClubs() {
    const l = document.getElementById("leagueSelect").value;
    const sel = document.getElementById("clubSelect");
    const lg = LEAGUES[l];
    const search = document.getElementById("clubSearch");
    if (search) search.value = "";
    sel.innerHTML = lg.clubs.map((c, i) =>
            `<option value="${i}">${lg.flag} ${c.emoji} ${c.name}</option>`
    ).join("");
    renderClubGrid();
}

function renderClubGrid() {
    const grid = document.getElementById("clubGrid");
    if (!grid)
        return;
    const l = document.getElementById("leagueSelect").value;
    const sel = document.getElementById("clubSelect");
    const lg = LEAGUES[l];
    if (!lg || !lg.clubs)
        return;
    grid.innerHTML = lg.clubs.map((c, i) => {
        const isSel = String(i) === sel.value;
        const stats = getClubStats(c.name, c.budget);
        return `
            <div class="club-card ${isSel ? 'selected' : ''}" data-club-index="${i}" title="${c.name}">
                <div class="club-card-main" role="button" aria-label="Choisir ${c.name}" aria-pressed="${isSel}" tabindex="${isSel ? 0 : -1}" onclick="pickClub(${i})" onkeydown="handleClubKey(event, ${i})">
                    <span class="club-card-crest">${crest(c.name, c.emoji, 44)}</span>
                    <span class="club-card-name">${c.name}</span>
                    <span class="club-card-rating">NOTE ${stats.ovr} · ${fmtMoney(c.budget)}</span>
                </div>
                <button type="button" class="btn-outline" style="margin-top:6px;padding:2px 8px;font-size:11px;border-radius:4px;cursor:pointer;" onclick="event.stopPropagation();openClubModal('${c.name.replace(/'/g, "\\'")}')">📊 Fiche</button>
            </div>`;
    }).join("");
    filterClubs();
}

function filterClubs() {
    const query = (document.getElementById("clubSearch")?.value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("fr");
    document.querySelectorAll("#clubGrid .club-card").forEach(card => {
        const name = (card.querySelector(".club-card-name")?.textContent || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("fr");
        card.hidden = query !== "" && !name.includes(query);
    });
}

function pickClub(i) {
    document.getElementById("clubSelect").value = String(i);
    renderClubGrid();
    const selected = document.querySelector('.club-card-main[aria-pressed="true"]');
    if (selected) selected.focus();
}

function handleClubKey(event, index) {
    if (!['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', ' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    const visible = [...document.querySelectorAll('#clubGrid .club-card:not([hidden])')]
        .map(card => Number(card.dataset.clubIndex));
    if (!visible.length) return;
    let current = visible.indexOf(index);
    if (current < 0) current = 0;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') pickClub(visible[(current - 1 + visible.length) % visible.length]);
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') pickClub(visible[(current + 1) % visible.length]);
    else pickClub(index);
}

function renderMenuSlots() {
    const saves = getSaves();
    ["menuSlots", "loadSlots"].forEach(containerId => {
        const el = document.getElementById(containerId);
        if (!el)
            return;
        el.innerHTML = [0, 1, 2].map(i => {
            const s = saves[i];
            const isLoad = containerId === "loadSlots";
            return `
                <div class="save-slot ${s ? "has-save" : ""}" onclick="${isLoad ? "loadGame(" + i + ")" : "selectMenuSlot(" + i + ")"}">
                  <span class="save-slot-icon">${s ? "💾" : "🔓"}</span>
                  <div class="save-slot-label">Slot ${i + 1}</div>
                  ${s
                    ? `<div class="save-slot-club">${crest(s.clubName, s.clubEmoji || "", 20)} ${s.clubName}</div>
                       <div class="save-slot-season">${(LEAGUES[s.leagueKey] || {}).flag || ''} J${s.matchDay}/${s.seasonLength || 38} · ${s.points} pts</div>`
                    : `<div class="save-slot-season">Vide</div>`}
                </div>`;
        }).join("");
    });
}

function selectMenuSlot(i) {
    saveSlot = i;
    toast("Slot " + (i + 1) + " sélectionné pour la nouvelle partie", "info");
}

function toggleLoadPanel() {
    const p = document.getElementById("loadPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
    renderMenuSlots();
}

function startNewGame() {
    const leagueKey = document.getElementById("leagueSelect").value;
    const clubIdx = parseInt(document.getElementById("clubSelect").value);
    const club = LEAGUES[leagueKey].clubs[clubIdx];
    const league = LEAGUES[leagueKey];
    G = null;
    G = {
        clubName: club.name,
        clubEmoji: club.emoji,
        leagueKey,
        leagueClubsByKey: createLeagueClubState(),
        leagueName: league.name + " " + league.flag,
        money: club.budget,
        squad: generateSquad(club.budget),
        matchDay: 0,
        seasonLength: getSeasonLength(leagueKey),
        points: 0,
        wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0,
        results: [],
        standings: generateStandings(club.name, leagueKey),
        upgrades: {academy: 0, scouting: 0, stadium: 0, medical: 0, coaching: 0},
        market: null,
        nextOpponent: null,
        nextOppRat: 70,
        tactic: '4-3-3',
        style: 'equilibre',
        morale: 60,
        streakW: 0,
        streakL: 0,
        objective: null,
        isDerby: false,
        reputation: 1,
        repPoints: 0,
        youthPlayers: [],
        staff: {},
        stadiumName: club.name + ' Arena',
        stadiumCapacity: 15000,
        ticketRevenue: 0,
        seasonTicketRevenue: 0,
        contracts: null,
        monthlyWagePaid: 0
    };
    G.market = generateMarket(0);
    G._calendar = null; // reset calendar
    G.fixtures = null; // reset fixture schedule
    G.contracts = generateContracts();
    enterGame();
}

// ======================================================
//  LOAD / SAVE
// ======================================================
function loadGame(slot) {
    try {
        const d = localStorage.getItem("fm_save_" + slot);
        if (!d) {
            toast("Aucune sauvegarde dans ce slot !", "error");
            return;
        }
        G = JSON.parse(d);
        ensureLeagueClubState();
        if (!G.seasonLength)
            G.seasonLength = getSeasonLength(G.leagueKey);
        if (!G.tactic)
            G.tactic = '4-3-3';
        if (G.morale === undefined)
            G.morale = 60;
        // Patch old squad members
        G.squad.forEach(p => {
            if (p.goals === undefined)
                p.goals = 0;
            if (p.assists === undefined)
                p.assists = 0;
            if (p.injuredGames === undefined)
                p.injuredGames = 0;
            ensurePot(p);
        });
        (G.market || []).forEach(ensurePot);
        (G.youthPlayers || []).forEach(ensurePot);
        saveSlot = slot;
        enterGame();
        toast("Partie chargée depuis le slot " + (slot + 1) + " !", "success");
    } catch (e) {
        toast("Erreur lors du chargement", "error");
    }
}

function saveGame() {
    if (!G)
        return;
    localStorage.setItem("fm_save_" + saveSlot, JSON.stringify(G));
    toast("Sauvegardé dans le slot " + (saveSlot + 1) + " !", "success");
    renderSaveSlotPicker();
    renderMenuSlots();
}

function exportSave() {
    if (!G)
        return;
    const blob = new Blob([JSON.stringify(G, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fm_" + G.clubName.replace(/ /g, "_") + "_J" + G.matchDay + ".json";
    a.click();
    toast("Fichier exporté !", "success");
}

function importSave(event) {
    const file = event.target.files[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            G = JSON.parse(e.target.result);
            enterGame();
            toast("Partie importée !", "success");
        } catch (err) {
            toast("Fichier invalide", "error");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

function deleteSlot() {
    if (!confirm("Effacer définitivement le slot " + (saveSlot + 1) + " ?"))
        return;
    localStorage.removeItem("fm_save_" + saveSlot);
    toast("Slot " + (saveSlot + 1) + " effacé", "error");
    renderSaveSlotPicker();
}

function backToMenu() {
    saveGame();
    document.getElementById("s-game").classList.remove("active");
    document.getElementById("s-menu").classList.add("active");
    renderMenuSlots();
}

// ======================================================
//  GAME ENTRY
// ======================================================
function enterGame() {
    document.getElementById("s-menu").classList.remove("active");
    document.getElementById("s-game").classList.add("active");
    showTab("match", document.querySelector(".tab-btn"));
    // Patch old saves
    if (!G.style)
        G.style = 'equilibre';
    if (!G.streakW)
        G.streakW = 0;
    if (!G.streakL)
        G.streakL = 0;
    if (!G.objective)
        G.objective = null;
    if (G.reputation === undefined)
        G.reputation = 1;
    if (G.repPoints === undefined)
        G.repPoints = 0;
    if (!G.youthPlayers)
        G.youthPlayers = [];
    if (!G.staff)
        G.staff = {};
    if (!G.stadiumName)
        G.stadiumName = G.clubName + ' Arena';
    if (!G.stadiumCapacity)
        G.stadiumCapacity = 15000;
    if (G.ticketRevenue === undefined)
        G.ticketRevenue = 0;
    ensureContractState();
    if ((G.wageModelVersion || 0) < 1) {
        const base = getLeagueClubs(G.leagueKey).find(c => c.name === G.clubName)?.budget || G.money || 10000000;
        const payroll = G.squad.reduce((sum, p) => sum + Math.max(0, Number(p.wage) || 0), 0);
        const monthlyCap = Math.max(18000, base * 0.34 / 12);
        if (payroll > monthlyCap) {
            const scale = monthlyCap / payroll;
            G.squad.forEach(p => { p.wage = Math.max(1000, Math.round((Number(p.wage) || 0) * scale)); });
            if (G.contracts) G.contracts.forEach(c => { const p=findPlayerForContract(c); if(p)c.wage=p.wage; });
        }
        G.wageModelVersion = 1;
    }
    if (G.monthlyWagePaid === undefined)
        G.monthlyWagePaid = 0;
    if (!G.fixtures)
        G.fixtures = null; // will be generated on first prepareNextMatch
    if (!G.seasonHistory)
        G.seasonHistory = [];
    G.squad.forEach(p => {
        if (p.profile === undefined)
            p.profile = null;
        if (p.happy === undefined)
            p.happy = true;
    });
    updateTopBar();
    prepareNextMatch();
    renderSaveSlotPicker();
}

function updateTopBar() {
    _el("g-badge").innerHTML = crest(G.clubName, G.clubEmoji, 32);
    _el("g-club-name").textContent = G.clubName;
    _el("g-league-name").textContent = G.leagueName;
    _el("g-money").textContent = fmtMoney(G.money);
    _el("g-pts").textContent = G.points;
    const matchesTotal = G.seasonLength || 38;
    _el("g-day").textContent = G.matchDay + "/" + matchesTotal;
    const rank = getRank();
    _el("g-rank").textContent = rank + "e";
    const repEl = _el("g-rep");
    if (repEl)
        repEl.textContent = '⭐'.repeat(G.reputation || 1);
    const pct = (G.matchDay / matchesTotal) * 100;
    _el("prog-bar").style.width = pct + "%";
    _el("prog-label").textContent = G.matchDay + " / " + matchesTotal + " matchs joués";
    // Morale display
    const m = G.morale || 50;
    const mBar = document.getElementById("morale-bar");
    const mVal = document.getElementById("morale-val");
    if (mBar && mVal) {
        mBar.style.width = m + "%";
        mBar.style.background = m >= 70 ? "var(--accent)" : m >= 40 ? "var(--gold)" : "var(--danger)";
        const moraleEmoji = m >= 80 ? "🔥 Excellent" : m >= 60 ? "😊 Bon" : m >= 40 ? "😐 Neutre" : m >= 20 ? "😟 Bas" : "💔 Effondré";
        mVal.textContent = moraleEmoji;
        mVal.style.color = m >= 70 ? "var(--accent)" : m >= 40 ? "var(--gold)" : "var(--danger)";
    }

    // Restore tactic button state
    if (G.tactic) {
        document.querySelectorAll(".tactic-btn").forEach(b => {
            b.classList.toggle("active", b.textContent.trim() === G.tactic);
        });
    }

    renderTopScorers();
}

let _rankCache = {day: -1, rank: 1};
function getRank() {
    if (!G.standings)
        return 1;
    if (_rankCache.day === G.matchDay)
        return _rankCache.rank;
    const s = [...G.standings].sort((a, b) =>
        b.points !== a.points ? b.points - a.points : (b.gf - b.ga) - (a.gf - a.ga)
    );
    _rankCache = {day: G.matchDay, rank: (s.findIndex(t => t.isMe) + 1) || 1};
    return _rankCache.rank;
}

// ======================================================
//  TABS
// ======================================================
const _TAB_RENDER = {
    squad: () => renderSquad(),
    transfers: () => renderMarket(),
    standings: () => renderStandings(),
    upgrades: () => renderUpgrades(),
    save: () => renderSaveSlotPicker(),
    europe: () => renderEurope(),
    calendrier: () => renderCalendrier(),
    formation: () => renderFormation(),
    stade: () => renderStade(),
    staff: () => renderStaff(),
    dashboard: () => renderDashboard(),
    contrats: () => renderContrats(),
};
function showTab(tab, btn) {
    document.querySelectorAll(".tab-content").forEach(t => {
        t.classList.remove("active");
        t.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute('aria-selected', 'false');
        b.tabIndex = -1;
    });
    const panel = document.getElementById("tab-" + tab);
    if (panel) {
        panel.classList.add("active");
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-hidden', 'false');
        panel.tabIndex = 0;
    }
    if (btn) {
        btn.classList.add("active");
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-controls', 'tab-' + tab);
        btn.setAttribute('aria-selected', 'true');
        btn.tabIndex = 0;
        if (!btn.id) btn.id = 'tab-button-' + tab;
        if (panel) panel.setAttribute('aria-labelledby', btn.id);
    }
    if (_TAB_RENDER[tab])
        _TAB_RENDER[tab]();
}

// ======================================================
//  MATCH
// ======================================================
function getTeamRating() {
    if (!G.squad.length)
        return 60;
    const base = G.squad.reduce((s, p) => s + p.level, 0) / G.squad.length;
    const coachBonus = (G.upgrades.coaching || 0) * 5;
    return Math.round(base + coachBonus);
}

function setTactic(tac, btn) {
    if (!G)
        return;
    G.tactic = tac;
    // Reset lineup on tactic change so rows re-fit
    if (G.lineup)
        G.lineup = null;
    document.querySelectorAll(".tactic-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    toast("Tactique : " + tac, "info");
    if (window.PitchViz)
        PitchViz.preview(true);
    // Re-render lineup if currently viewing it
    if (_squadView === 'lineup' && document.getElementById('tab-squad').classList.contains('active'))
        renderLineup();
}

// Converts a club budget to a realistic team strength rating (45–95)
function budgetToRating(budget) {
    // Log scale: 100k€ → ~45, 1M€ → ~52, 10M€ → ~62, 50M€ → ~74, 200M€ → ~85, 600M+ → ~95
    if (!budget || budget <= 0)
        return 60;
    const logB = Math.log10(Math.max(budget, 100000));
    // log10(100000)=5  → 45, log10(600000000)≈8.78 → 95
    const minLog = 5, maxLog = 8.78;
    const clamped = Math.max(minLog, Math.min(maxLog, logB));
    return Math.round(45 + ((clamped - minLog) / (maxLog - minLog)) * 50);
}

function prepareNextMatch() {
    const matchesTotal = G.seasonLength || 38;
    // Build fixture list once per season if not done
    if (!G.fixtures)
        G.fixtures = generateFixtures(G.leagueKey, G.clubName);
    // Find the next fixture involving my club (by matchDay index)
    const myFixtures = G.fixtures.filter(f =>
        f.homeClub.name === G.clubName || f.awayClub.name === G.clubName
    ).sort((a, b) => a.matchDay - b.matchDay);
    const fixture = myFixtures[G.matchDay] || myFixtures[myFixtures.length - 1];
    const isHome = fixture ? fixture.homeClub.name === G.clubName : true;
    const currentClubs = getLeagueClubs(G.leagueKey);
    const oppClub = fixture ? (isHome ? fixture.awayClub : fixture.homeClub) : currentClubs.find(c => c.name !== G.clubName);
    const opp = oppClub || currentClubs[0];
    G.nextOpponent = opp;
    G.isHomeMatch = isHome;
    // Use the opponent's real budget for realistic strength, ±4 variance
    const baseRat = budgetToRating(opp.budget);
    G.nextOppRat = window.AIWorld ? Math.max(40, Math.min(99, AIWorld.teamStrength(G, LEAGUES, opp.name) + rand(-2, 2))) : Math.max(40, Math.min(99, baseRat + rand(-4, 4)));
    // Derby detection — same city or rival keywords
    const DERBY_PAIRS = [
        ['Manchester City', 'Manchester United'],
        ['Arsenal', 'Tottenham'],
        ['Liverpool', 'Everton'],
        ['Chelsea', 'Arsenal'],
        ['Real Madrid', 'FC Barcelone'],
        ['Inter Milan', 'AC Milan'],
        ['Juventus', 'Torino'],
        ['Paris Saint-Germain', 'Olympique de Marseille'],
        ['Olympique de Marseille', 'Olympique Lyonnais'],
        ['Bayern Munich', 'Borussia Dortmund'],
    ];
    G.isDerby = DERBY_PAIRS.some(pair =>
        (pair[0] === G.clubName && pair[1] === opp.name) ||
                (pair[1] === G.clubName && pair[0] === opp.name)
    );
    // Extra dramatic matches near end of season
    const isEndSeason = G.matchDay >= matchesTotal - 5;
    const myRank = getRank();
    const total = G.standings.length;
    const lg = LEAGUES[G.leagueKey];
    const isRelegationBattle = lg.relegatesTo && myRank > total - (lg.relegationSpots || 3) - 2;
    G.isCrucial = isEndSeason || isRelegationBattle || G.isDerby;
    // Generate season objective if first match
    if (!G.objective && G.matchDay === 0) {
        G.objective = generateObjective();
    }

    const arena = document.getElementById('match-arena') || document.querySelector('.match-arena');
    if (arena) {
        arena.classList.toggle('derby', G.isDerby);
    }

    let derbyHtml = '';
    if (G.isDerby) {
        derbyHtml = `<div style="text-align:center;margin-bottom:6px;"><span class="derby-badge">🔥 DERBY</span></div>`;
    } else if (G.isCrucial) {
        derbyHtml = `<div style="text-align:center;margin-bottom:6px;"><span class="derby-badge" style="background:linear-gradient(135deg,var(--danger),#cc2233);">⚠️ MATCH CRUCIAL</span></div>`;
    }

    const _lgFlag = (LEAGUES[G.leagueKey] || {}).flag || '';
    document.getElementById("m-home").innerHTML = isHome
            ? crest(G.clubName, G.clubEmoji, 26) + " " + G.clubName
            : crest(opp.name, opp.emoji, 26) + " " + opp.name;
    document.getElementById("m-away").innerHTML = isHome
            ? crest(opp.name, opp.emoji, 26) + " " + opp.name
            : crest(G.clubName, G.clubEmoji, 26) + " " + G.clubName;
    document.getElementById("m-home-rat").textContent = isHome
            ? (_lgFlag + " Force: " + getTeamRating() + " 🏠")
            : (_lgFlag + " Force: " + G.nextOppRat);
    document.getElementById("m-away-rat").textContent = isHome
            ? (_lgFlag + " Force: " + G.nextOppRat)
            : (_lgFlag + " Force: " + getTeamRating() + " ✈️");
    document.getElementById("m-score").textContent = "– : –";
    const _sf = (LEAGUES[G.leagueKey] || {}).flag || '';
    document.getElementById("m-status").textContent = G.isDerby ? "🔥 C'est un derby !" : (_sf ? _sf + " Prêt pour le coup d'envoi" : "Prêt pour le coup d'envoi");
    // Add derby badge
    const matchArena = document.querySelector('.match-arena');
    if (matchArena) {
        const oldBadge = matchArena.querySelector('.match-badge');
        if (oldBadge)
            oldBadge.remove();
        if (G.isDerby || G.isCrucial) {
            const badge = document.createElement('div');
            badge.className = 'match-badge';
            badge.innerHTML = derbyHtml;
            matchArena.insertBefore(badge, matchArena.firstChild);
        }
    }

    // Hide halftime panel
    document.getElementById('halftime-panel').classList.remove('show');
    document.getElementById('halftime-panel').style.display = '';
    // Update objective banner
    updateObjectiveBanner();
    // Show vestiaire message based on morale
    showVestiaireMsg();
    const btn = document.getElementById("playBtn");
    if (G.matchDay >= matchesTotal) {
        btn.disabled = true;
        btn.textContent = "Saison terminée !";
        document.getElementById("m-status").textContent = "🏆 Saison terminée — " + G.points + " points au total !";
    } else {
        btn.disabled = false;
        btn.textContent = "Coup d'envoi ▶";
        btn.onclick = () => playMatch();
    }
    if (window.PitchViz)
        PitchViz.preview(true);
    renderResults();
}

function generateObjective() {
    const lg = LEAGUES[G.leagueKey];
    const myRat = getTeamRating();
    const isTop = myRat >= 75;
    const isMid = myRat >= 65;
    if (lg.tier === 1) {
        if (isTop)
            return {text: "Terminer dans le Top 4", target: 'top4', bonus: 5000000};
        if (isMid)
            return {text: "Terminer dans le Top 8", target: 'top8', bonus: 2000000};
        return {text: "Assurer le maintien (hors relégation)", target: 'maintain', bonus: 1000000};
    } else {
        if (isTop)
            return {text: "Obtenir la promotion directe", target: 'promotion', bonus: 3000000};
        return {text: "Terminer dans les 6 premiers", target: 'top6', bonus: 1500000};
    }
}

function checkObjective() {
    if (!G.objective)
        return null;
    const sorted = [...G.standings].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga));
    const rank = sorted.findIndex(t => t.isMe) + 1;
    const total = sorted.length;
    const lg = LEAGUES[G.leagueKey];
    const relSpots = lg.relegationSpots || 3;
    switch (G.objective.target) {
        case 'top4':
            return rank <= 4;
        case 'top8':
            return rank <= 8;
        case 'top6':
            return rank <= 6;
        case 'maintain':
            return rank <= total - relSpots;
        case 'promotion':
            return rank <= (lg.promotionSpots || 2);
        default:
            return null;
    }
}

function updateObjectiveBanner() {
    const banner = document.getElementById('obj-banner');
    const objText = document.getElementById('obj-text');
    const objBadge = document.getElementById('obj-badge');
    if (!G.objective) {
        banner.style.display = 'none';
        return;
    }
    banner.style.display = '';
    objText.textContent = G.objective.text;
    const ok = checkObjective();
    const completed = G.matchDay >= (G.seasonLength || 38);
    const remaining = (G.seasonLength || 38) - G.matchDay;
    if (completed && ok === true) {
        objBadge.textContent = '✅ Atteint';
        objBadge.className = 'obj-badge ok';
    } else if (completed && ok === false) {
        objBadge.textContent = '❌ Manqué';
        objBadge.className = 'obj-badge danger';
    } else if (ok === true) {
        objBadge.textContent = '🎯 En bonne voie';
        objBadge.className = 'obj-badge ok';
    } else if (ok === false) {
        objBadge.textContent = remaining <= 5 ? '🚨 En danger' : '⏳ À surveiller';
        objBadge.className = 'obj-badge' + (remaining <= 5 ? ' danger' : '');
    } else {
        objBadge.textContent = 'En cours';
        objBadge.className = 'obj-badge';
    }
}

function showVestiaireMsg() {
    const el = document.getElementById('vestiaire-msg');
    const m = G.morale || 50;
    const streakW = G.streakW || 0;
    const streakL = G.streakL || 0;
    let msg = '', cls = '';
    if (streakW >= 4) {
        msg = '🔥 "L\'équipe est en feu ! On enchaîne les victoires !"';
        cls = 'fire';
    } else if (streakL >= 3) {
        msg = '😟 "Le vestiaire doute... L\'ambiance est tendue."';
        cls = 'crisis';
    } else if (m >= 80) {
        msg = '😊 "L\'ambiance est au beau fixe, les joueurs sont motivés !"';
        cls = 'fire';
    } else if (m <= 25) {
        msg = '💔 "La crise de confiance est totale. Un retournement s\'impose."';
        cls = 'crisis';
    } else if (G.isDerby) {
        msg = '⚔️ "C\'est un derby ! Les joueurs sont survoltés."';
        cls = 'fire';
    }

    if (msg) {
        el.textContent = msg;
        el.className = 'vestiaire-msg show ' + cls;
    } else {
        el.className = 'vestiaire-msg';
    }
}

// Tactic definitions: [attackBonus, defenseBonus]
const TACTIC_EFFECTS = {
    '4-3-3': [0.08, 0], // offensive
    '4-4-2': [0.03, 0.03], // balanced
    '3-5-2': [0.05, -0.03], // midfield control
    '5-3-2': [-0.05, 0.12], // defensive
    '4-2-3-1': [0.04, 0.04] // compact
};
// Style definitions: [atkMult, defMult, fatigueMult, injuryMult]
// atkMult/defMult are multipliers on goal probability
// fatigueMult: multiplied on injury risk, injuryMult: additional injury chance
const STYLE_EFFECTS = {
    'equilibre': [1.0, 1.0, 1.0, 0],
    'offensif': [1.4, 0.65, 1.2, 0.02], // +40% buts marqués, -35% défense, +fatigue
    'defensif': [0.65, 1.5, 0.85, 0], // -35% attaque, +50% défense, moins de fatigue
    'pressing': [1.15, 1.1, 1.7, 0.04], // +récup, mais fatigue énorme + blessures
};
function setStyle(style, btn) {
    if (!G)
        return;
    G.style = style;
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const msgs = {
        offensif: '⚔️ Mode offensif — Tout pour la victoire !',
        defensif: '🛡️ Mode défensif — La solidité avant tout.',
        pressing: '⚡ Pressing intense — L\'équipe va tout donner !',
        equilibre: '⚖️ Jeu équilibré — Approche prudente.'
    };
    toast(msgs[style] || 'Style modifié', 'info');
}


// State for halftime intervention
let _htChoice = null;
let _htResolve = null;
let _matchMyScore = 0;
let _matchOppScore = 0;
function halftimeChoice(choice) {
    _htChoice = choice;
    document.getElementById('halftime-panel').classList.remove('show');
    if (_htResolve) {
        _htResolve(choice);
        _htResolve = null;
    }
}

async function waitForHalftime(myScore, oppScore, hint) {
    return new Promise(resolve => {
        _htResolve = resolve;
        _htChoice = null;
        const panel = document.getElementById('halftime-panel');
        document.getElementById('ht-score').textContent = myScore + ' – ' + oppScore;
        let hintEl = document.getElementById('ht-hint');
        if (!hintEl) {
            hintEl = document.createElement('div');
            hintEl.id = 'ht-hint';
            hintEl.style.cssText = 'font-size:12px;color:var(--muted);margin:-4px 0 10px;';
            document.getElementById('ht-score').parentElement.insertAdjacentElement('afterend', hintEl);
        }
        hintEl.textContent = hint || '';
        panel.classList.add('show');
        // Auto-resolve after 15s if no choice
        setTimeout(() => {
            if (_htResolve) {
                _htResolve('hold');
                _htResolve = null;
                panel.classList.remove('show');
            }
        }, 15000);
    });
}

// ======================================================
//  MOTEUR DE MATCH — helpers
// ======================================================
function clampN(v, a, b) {
    return Math.max(a, Math.min(b, v));
}
// Tirage pondéré : w(x) renvoie le poids de chaque élément
function wPick(arr, w) {
    if (!arr.length)
        return null;
    let total = 0;
    const ws = arr.map(x => { const v = Math.max(0, w(x)); total += v; return v; });
    if (total <= 0)
        return arr[rand(0, arr.length - 1)];
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
        r -= ws[i];
        if (r <= 0)
            return arr[i];
    }
    return arr[arr.length - 1];
}
// Style de jeu de l'adversaire : stable pour un club donné (dérivé de son nom)
function oppStyleOf(opp) {
    const s = (opp && opp.name) || '';
    let h = 0;
    for (let i = 0; i < s.length; i++)
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return ['offensif', 'equilibre', 'defensif', 'equilibre'][h % 4];
}
// Une occasion : contrée -> hors cadre -> arrêt -> but
//   attQ : niveau du tireur · defLvl : niveau défensif adverse · gkLvl : niveau du gardien
//   acc  : précision (moral) · blockP : probabilité que la défense contre le tir
function resolveShot(attQ, defLvl, gkLvl, acc, blockP) {
    if (Math.random() < blockP)
        return 'block';
    const onTarget = clampN((0.45 + (attQ - defLvl) / 250) * acc, 0.25, 0.75);
    if (Math.random() > onTarget)
        return 'wide';
    const saveP = clampN(0.32 + (gkLvl - attQ) / 250, 0.1, 0.5);
    return Math.random() < saveP ? 'save' : 'goal';
}

const OPP_STYLES = {
    offensif: {label: "joue très haut et laisse des espaces", me: 1.1, opp: 1.12},
    defensif: {label: "se replie en bloc bas", me: 0.88, opp: 0.85},
    equilibre: {label: "reste équilibré", me: 1, opp: 1}
};

async function playMatch() {
    const matchesTotal = G.seasonLength || 38;
    const cupMatch = G.matchContext && G.matchContext.type === 'cup';
    if (!cupMatch && G.matchDay >= matchesTotal)
        return;
    const btn = document.getElementById("playBtn");
    btn.disabled = true;
    btn.textContent = "Match en cours...";
    const log = document.getElementById("match-log");
    log.innerHTML = "";
    // Determine availability before reducing injury counters so a one-match injury
    // keeps the player out of the next match.
    const healthySquad = G.squad.filter(p => p.injuredGames === 0);
    // The saved XI now drives the match engine. Injured starters are replaced
    // automatically from the bench before kickoff, and the visible lineup is kept in sync.
    const lineupPositions = getLineupSlotDef(G.tactic || '4-3-3').flatMap(row => Array(row.n).fill(row.pos));
    initLineup();
    const available = new Set(G.squad.map((p, i) => p && p.injuredGames === 0 ? i : -1).filter(i => i >= 0));
    const used = new Set();
    const pitch = G.lineup.pitch.slice(0, lineupPositions.length);
    for (let slot = 0; slot < pitch.length; slot++) {
        const idx = pitch[slot];
        if (available.has(idx) && !used.has(idx)) {
            used.add(idx);
            continue;
        }
        const position = lineupPositions[slot];
        const candidates = [...available].filter(i => !used.has(i));
        candidates.sort((a, b) => {
            const pa = G.squad[a], pb = G.squad[b];
            return Number(pb.pos === position) - Number(pa.pos === position) || pb.level - pa.level;
        });
        pitch[slot] = candidates.length ? candidates[0] : null;
        if (pitch[slot] !== null) used.add(pitch[slot]);
    }
    G.lineup.pitch = pitch;
    G.lineup.bench = G.squad.map((_, i) => i).filter(i => !used.has(i));
    const starters = pitch.map((idx, slot) => idx === null ? null : ({player: G.squad[idx], expected: lineupPositions[slot]})).filter(Boolean);
    const matchSquad = starters.map(x => x.player);
    const benchPlayers = G.lineup.bench.filter(i => G.squad[i] && G.squad[i].injuredGames === 0).map(i => G.squad[i]);
    // Recover injured players after their availability for this match has been determined.
    G.squad.forEach(p => {
        if (p.injuredGames > 0) {
            const kineBonus = (G.staff && G.staff.kine) ? (Math.random() < 0.3 ? 1 : 0) : 0;
            p.injuredGames = Math.max(0, p.injuredGames - 1 - kineBonus);
        }
    });
    const lineupRating = starters.length ? Math.round(starters.reduce((sum, x) => sum + x.player.level * (x.player.pos === x.expected ? 1 : 0.88), 0) / starters.length) : 45;
    const myRat = lineupRating + (G.staff && G.staff.analyste ? 3 : 0) + (G.staff && G.staff.adjoint ? 2 : 0);
    const oppRat = G.nextOppRat || 70;
    const opp = G.nextOpponent;
    const tac = G.tactic || '4-3-3';
    const style = G.style || 'equilibre';
    const [atkBonus, defBonus] = TACTIC_EFFECTS[tac] || [0, 0];
    const [atkMult, defMult, fatigueMult, extraInjury] = STYLE_EFFECTS[style] || [1, 1, 1, 0];
    // Morale effects — more impactful
    const m = G.morale || 50;
    const moraleBonus = (m - 50) / 400; // -0.125 to +0.125
    const moraleAccuracy = m >= 70 ? 1.1 : m <= 30 ? 0.8 : 1.0; // low morale = more errors

    // Derby bonus + home advantage
    const derbyBonus = G.isDerby ? 0.04 : 0;
    const homeBonus = G.isHomeMatch ? 0.05 : -0.03; // home advantage ~5%, away disadvantage 3%
    const advantage = Math.max(-0.35, Math.min(0.35, (myRat - oppRat) / 80));
    const baseProb = 0.5 + advantage + atkBonus + moraleBonus + derbyBonus + homeBonus;
    const myProb = Math.max(0.15, Math.min(0.85, baseProb * atkMult));
    const defendProb = Math.max(0, defBonus * defMult);
    // Injury risk
    const medLvl = G.upgrades.medical || 0;
    const injuryRisk = Math.max(0.01, (0.09 - medLvl * 0.025) * fatigueMult + extraInjury);
    let myScore = 0, oppScore = 0;
    const scorers = matchSquad.filter(p => p.pos === "ATT" || p.pos === "MID");
    const defenders = matchSquad.filter(p => p.pos === "DEF");
    const gk = matchSquad.find(p => p.pos === "GK");
    // Identify special profile players
    const buteurs = scorers.filter(p => p.profile === 'buteur');
    const clutchPlayers = matchSquad.filter(p => p.profile === 'clutch');
    const leaders = matchSquad.filter(p => p.profile === 'leader');
    // Terrain en direct (pitch.js) — simple mise en scène, ne modifie jamais le résultat
    const PV = window.PitchViz || {start() {}, preview() {}, async advance() {}, async end() {}, async moment() { await new Promise(r => setTimeout(r, 360)); }};
    PV.start({squad: matchSquad, tactic: tac, style, myRat, oppRat, opp, isHome: G.isHomeMatch});
    const addLog = (html) => {
        const div = document.createElement("div");
        div.className = "log-entry";
        div.innerHTML = html;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    };
    addLog(`<span class="log-min">0'</span> Coup d'envoi ! ${crest(G.clubName, G.clubEmoji, 16)} ${G.clubName} [${tac}${style !== 'equilibre' ? ' / ' + style : ''}] vs ${crest(opp.name, opp.emoji, 16)} ${opp.name}`);
    // Leader boost message
    if (leaders.length > 0 && m >= 70) {
        await new Promise(r => setTimeout(r, 200));
        addLog(`<span class="log-min">5'</span> 💪 ${leaders[rand(0, leaders.length - 1)].name} galvanise ses coéquipiers !`);
    }

    // ------------------------------------------------------------------
    //  MOTEUR D'OCCASIONS
    //  Chaque minute peut créer une occasion pour l'un ou l'autre camp. Le volume dépend de
    //  l'écart d'effectif, de la tactique, du style, du moral, du lieu, du style adverse,
    //  des cartons rouges et de la fatigue ; la conversion dépend des niveaux individuels.
    // ------------------------------------------------------------------
    const BASE_CHANCES = 4.4; // occasions franches par équipe à force égale (~1,3 but)
    const gap = clampN((myRat - oppRat) / 60, -0.45, 0.45);
    const oppStyle = OPP_STYLES[oppStyleOf(opp)];
    const defF = clampN((1 + defBonus) * defMult, 0.55, 1.8);
    const ctxMe = Math.max(0.6, 1 + atkBonus + moraleBonus + derbyBonus + homeBonus);
    const lamMe = BASE_CHANCES * clampN(1 + gap * 1.1, 0.45, 1.9) * Math.pow(atkMult, 0.75) * ctxMe * oppStyle.me;
    const lamOpp = BASE_CHANCES * clampN(1 - gap * 1.1, 0.45, 1.9) / Math.pow(defF, 0.75) * oppStyle.opp;
    const tiredness = clampN((fatigueMult - 0.85) / 0.85, 0, 1); // pressing = 1, défensif = 0

    let myMen = matchSquad.length, oppMen = 11;
    const sentOff = new Set();
    const subbedOff = new Set();
    const activePlayers = matchSquad.slice();
    let htMe = 1, htOpp = 1, tiredMul = 1, freshSub = null, shownSkips = 0, shownScore = '';
    const field = () => activePlayers.filter(p => !sentOff.has(p) && !subbedOff.has(p));
    const myDefLevel = () => {
        const d = field().filter(p => p.pos === 'DEF');
        return d.length ? d.reduce((s, p) => s + p.level, 0) / d.length : myRat;
    };
    const POS_SHOOT = {ATT: 1, MID: 0.4, DEF: 0.07, GK: 0};
    const POS_ASSIST = {MID: 1, ATT: 0.8, DEF: 0.15, GK: 0};
    const shootW = (p, min) => (POS_SHOOT[p.pos] || 0) * Math.pow(Math.max(p.level, 1) / 50, 4)
        * (p.profile === 'buteur' ? 1.5 : 1) * (p.profile === 'clutch' && min >= 75 ? 1.8 : 1) * (p === freshSub ? 1.4 : 1);
    const assistW = p => (POS_ASSIST[p.pos] || 0) * Math.pow(Math.max(p.level, 1) / 50, 2);
    const stamp = min => `<span class="log-min">${min}'</span>`;
    const updateScore = () => {
        const txt = myScore + " : " + oppScore;
        if (txt === shownScore)
            return;
        shownScore = txt;
        const scoreEl = document.getElementById("m-score");
        scoreEl.textContent = txt;
        scoreEl.classList.remove("goal-anim");
        void scoreEl.offsetWidth;
        scoreEl.classList.add("goal-anim");
        setTimeout(() => scoreEl.classList.remove("goal-anim"), 500);
    };
    // Mise en scène limitée pour les occasions « sans but » (le terrain en direct reste fluide)
    const softMoment = async (kind, d) => {
        if (shownSkips < 2) {
            shownSkips++;
            await PV.moment(kind, d);
        }
    };
    addLog(`<span class="log-min">0'</span> 🔎 ${opp.name} ${oppStyle.label}.`);

    // Taux d'occasions par minute, selon l'état du match
    const rates = min => {
        let me = lamMe / 90, opp = lamOpp / 90;
        const redMe = 11 - myMen, redOpp = 11 - oppMen;
        me *= Math.pow(0.82, redMe) * Math.pow(1.15, redOpp);
        opp *= Math.pow(1.18, redMe) * Math.pow(0.88, redOpp);
        if (min >= 45) {
            const t = tiredness * tiredMul * 0.14 * (min - 45) / 45; // fatigue croissante de la reprise à 90'
            me *= (1 - t) * htMe;
            opp *= (1 + t * 0.8) * htOpp;
        }
        return {me, opp};
    };

    const scoreLine = () => `(${myScore}–${oppScore})`;
    const myGoalLog = (min, scorer, assister, pen) => {
        const clutch = min >= 80 && scorer && scorer.profile === 'clutch';
        const profileStr = scorer && scorer.profile ? ` <span style="font-size:10px;color:var(--muted)">[${scorer.profile}]</span>` : '';
        const assistStr = assister ? ` <span style="color:var(--muted);font-size:11px;">(passe : ${assister.name})</span>` : '';
        const clutchStr = clutch ? " ⚡ <span style='color:var(--gold)'>BUT CLUTCH !</span>" : '';
        addLog(`${stamp(min)} <span class="log-goal">⚽ BUT !${pen ? ' (penalty)' : ''} ${scorer ? scorer.name : 'Un joueur'}${profileStr} marque !${assistStr}${clutchStr} ${scoreLine()}</span>`);
    };
    const oppGoalLog = (min, pen) => {
        const extra = oppScore >= 3 ? " 🚨 L'équipe s'effondre !" : '';
        addLog(`${stamp(min)} <span class="log-bad">😬 But encaissé${pen ? ' sur penalty' : ''} ! ${crest(opp.name, opp.emoji, 16)} ${opp.name} marque. ${scoreLine()}</span>${extra}`);
    };

    // --- Une occasion pour nous ---
    const myChance = async min => {
        const pool = field();
        const shooter = wPick(pool, p => shootW(p, min));
        const q = shooter ? shooter.level + (shooter.profile === 'buteur' ? 2 : 0) : myRat - 10;
        const blockP = clampN(0.16 + (oppRat - myRat) / 500, 0.08, 0.26);
        const out = resolveShot(q, oppRat, oppRat, moraleAccuracy, blockP);
        const who = shooter ? shooter.name : 'Un joueur';
        await PV.advance(min);
        if (out === 'goal') {
            myScore++;
            const others = pool.filter(p => p !== shooter);
            const assister = others.length && Math.random() < 0.75 ? wPick(others, assistW) : null;
            if (shooter) shooter.goals = (shooter.goals || 0) + 1;
            if (assister) assister.assists = (assister.assists || 0) + 1;
            await PV.moment('goal', {min, scorer: shooter, assister});
            myGoalLog(min, shooter, assister, false);
        } else if (out === 'save') {
            await softMoment('miss', {min});
            addLog(`${stamp(min)} 🧤 Belle parade du gardien adverse devant ${who} !`);
        } else if (out === 'wide') {
            await softMoment('miss', {min});
            addLog(Math.random() < 0.08
                ? `${stamp(min)} 💥 Poteau ! ${who} n'était pas loin.`
                : `${stamp(min)} 😬 Occasion manquée : le tir de ${who} part à côté.`);
        } else {
            addLog(`${stamp(min)} 🧱 ${who} est contré au dernier moment.`);
        }
    };

    // --- Une occasion pour l'adversaire ---
    const oppChance = async min => {
        const q = oppRat + rand(-8, 8);
        const blockP = clampN(0.16 * Math.pow(defF, 0.75), 0.06, 0.35);
        const out = resolveShot(q, myDefLevel(), gk ? gk.level : 45, 1, blockP);
        await PV.advance(min);
        if (out === 'goal') {
            await PV.moment('conceded', {min});
            oppScore++;
            oppGoalLog(min, false);
        } else if (out === 'save') {
            await PV.moment('save', {min, gk});
            addLog(`${stamp(min)} 🧤 Arrêt ${gk ? gk.name : 'du gardien'} ! Tir repoussé.`);
        } else if (out === 'block') {
            const def = wPick(field().filter(p => p.pos === 'DEF'), p => p.level);
            await PV.moment('clear', {min, def});
            addLog(`${stamp(min)} 🛡️ Dégagement défensif${def ? ` par ${def.name}` : ''} !`);
        } else {
            addLog(Math.random() < 0.08
                ? `${stamp(min)} ⚠️ Poteau ! Frayeur pour ${G.clubName}.`
                : `${stamp(min)} 😅 ${opp.name} tire à côté.`);
        }
    };

    // --- Penalties : événement à part, tiré par un joueur désigné ---
    const penTaker = () => field()
        .filter(p => p.pos === 'ATT' || p.pos === 'MID')
        .sort((a, b) => penScore(b) - penScore(a))[0] || null;
    const penScore = p => p.level + (p.profile === 'buteur' ? 3 : 0) + (p.profile === 'clutch' ? 2 : 0);
    const myPenalty = async min => {
        await PV.advance(min);
        const t = penTaker();
        const p = clampN(0.74 + ((t ? t.level : 65) - 70) / 200 + (moraleAccuracy - 1) * 0.5 - (oppRat - 70) / 400, 0.55, 0.92);
        addLog(`${stamp(min)} 🎯 Penalty en notre faveur ! ${t ? t.name : 'Un joueur'} s'avance…`);
        if (Math.random() < p) {
            myScore++;
            if (t) t.goals = (t.goals || 0) + 1;
            await PV.moment('goal', {min, scorer: t, assister: null});
            myGoalLog(min, t, null, true);
        } else {
            await PV.moment('miss', {min});
            addLog(`${stamp(min)} <span class="log-bad">❌ Penalty manqué par ${t ? t.name : 'notre tireur'} !</span>`);
        }
    };
    const oppPenalty = async min => {
        await PV.advance(min);
        const saveP = clampN(0.18 + ((gk ? gk.level : 45) - 60) / 300, 0.1, 0.35);
        addLog(`${stamp(min)} 🎯 Penalty pour ${opp.name}…`);
        if (Math.random() < saveP) {
            await PV.moment('save', {min, gk});
            addLog(`${stamp(min)} 🧤 ${gk ? gk.name : 'Le gardien'} arrête le penalty !`);
        } else if (Math.random() < 0.88) {
            await PV.moment('conceded', {min});
            oppScore++;
            oppGoalLog(min, true);
        } else {
            addLog(`${stamp(min)} 😅 Le penalty de ${opp.name} file au-dessus !`);
        }
    };

    // --- Intervention du coach à la mi-temps (45') ---
    const doHalftime = async () => {
        await PV.advance(45);
        const fat = tiredness > 0.6 ? "équipe sur les rotules" : tiredness > 0.3 ? "fatigue visible" : "jambes encore fraîches";
        const men = (myMen < 11 || oppMen < 11) ? ` · ${myMen} contre ${oppMen}` : '';
        const hint = `Fatigue : ${fat} · ${opp.name} ${oppStyle.label}${men}`;
        const choice = (await waitForHalftime(myScore, oppScore, hint)) || 'hold';
        if (choice === 'push') {
            htMe = 1.28; htOpp = 1.18; tiredMul = 1.15;
            addLog(`${stamp(45)} ⚔️ <strong>TOUT DONNER !</strong> L'équipe monte d'un cran… et laisse des espaces derrière.`);
        } else if (choice === 'hold') {
            htMe = 0.78; htOpp = 0.8; tiredMul = 0.6;
            addLog(`${stamp(45)} 🛡️ <strong>GÉRER LE RÉSULTAT.</strong> Bloc compact, intensité réduite.`);
        } else {
            // Remplacements : effacent la fatigue, avec un ajustement selon le score
            tiredMul = 0;
            const lead = myScore - oppScore;
            const wanted = lead < 0 ? ['ATT', 'MID'] : ['DEF', 'MID'];
            freshSub = benchPlayers.filter(p => wanted.includes(p.pos)).sort((a, b) => b.level - a.level)[0]
                || benchPlayers.slice().sort((a, b) => b.level - a.level)[0] || null;
            if (freshSub && activePlayers.length) {
                const outgoing = field().filter(p => p.pos === freshSub.pos).sort((a, b) => a.level - b.level)[0]
                    || field().slice().sort((a, b) => a.level - b.level)[0];
                if (outgoing) subbedOff.add(outgoing);
                activePlayers.push(freshSub);
                benchPlayers.splice(benchPlayers.indexOf(freshSub), 1);
                G.lineup.pitch = G.lineup.pitch.map(idx => G.squad[idx] === outgoing ? G.squad.indexOf(freshSub) : idx);
                G.lineup.bench = G.lineup.bench.filter(idx => G.squad[idx] !== freshSub);
            }
            if (lead < 0) { htMe = 1.12; htOpp = 1.0; }
            else if (lead > 0) { htMe = 1.0; htOpp = 0.88; }
            else { htMe = 1.05; htOpp = 0.96; }
            const why = lead < 0 ? "pour renverser la rencontre" : lead > 0 ? "pour verrouiller le score" : "pour faire la différence";
            addLog(`${stamp(45)} 🔄 <strong>REMPLACEMENTS</strong> ${why}${freshSub ? ` : ${freshSub.name} entre en jeu` : ''}. Jambes fraîches !`);
        }
    };

    // --- Événements programmés : cartons ---
    const redCandidates = matchSquad.filter(p => p.pos !== 'GK');
    const irregs = redCandidates.filter(p => p.profile === 'irregulier');
    const redMeP = irregs.length ? 0.15 : Math.max(0.02, 0.1 - (G.upgrades.medical || 0) * 0.025);
    const myRedMin = redCandidates.length && Math.random() < redMeP ? rand(20, 88) : null;
    const oppRedMin = Math.random() < 0.06 ? rand(20, 88) : null;
    const yellowMin = Math.random() < 0.25 ? rand(5, 89) : null;
    const penFactor = lam => clampN(0.07 * lam / BASE_CHANCES, 0.02, 0.2);
    const myPenMin = Math.random() < penFactor(lamMe) ? rand(3, 89) : null;
    const oppPenMin = Math.random() < penFactor(lamOpp) ? rand(3, 89) : null;

    for (let min = 1; min <= 89; min++) {
        if (min === 45)
            await doHalftime();
        if (min === yellowMin)
            addLog(`${stamp(min)} 🟡 Carton jaune.`);
        if (min === myRedMin) {
            await PV.advance(min);
            const p = irregs.length ? irregs[rand(0, irregs.length - 1)] : redCandidates[rand(0, redCandidates.length - 1)];
            sentOff.add(p);
            myMen--;
            addLog(`${stamp(min)} <span class="log-bad">🟥 Carton rouge ! ${p.name} est expulsé${p.profile === 'irregulier' ? ' (joueur irrégulier)' : ''} — ${G.clubName} finit à ${myMen}.</span>`);
        }
        if (min === oppRedMin) {
            await PV.advance(min);
            oppMen--;
            addLog(`${stamp(min)} 🟥 Carton rouge pour ${opp.name} ! Ils finissent à ${oppMen}.`);
        }
        if (min === myPenMin)
            await myPenalty(min);
        if (min === oppPenMin)
            await oppPenalty(min);
        const r = rates(min);
        const order = Math.random() < 0.5 ? ['me', 'opp'] : ['opp', 'me'];
        for (const side of order) {
            if (Math.random() < r[side])
                await (side === 'me' ? myChance(min) : oppChance(min));
        }
        updateScore();
    }

    await PV.advance(90);
    let cupWinner = null, extraTime = false, penalties = null;
    if (cupMatch && myScore === oppScore) {
        extraTime = true;
        addLog('<span class="log-min">90\'</span> <strong>Prolongation : deux périodes de 15 minutes.</strong>');
        for (const min of [105, 120]) {
            if (Math.random() < clampN(lamMe * 0.12, 0.025, 0.24)) await myChance(min);
            if (Math.random() < clampN(lamOpp * 0.12, 0.025, 0.24)) await oppChance(min);
            updateScore();
        }
        if (myScore === oppScore) {
            penalties = [0, 0];
            const kickOnce = (side, label) => {
                const scored = Math.random() < (side === 0 ? 0.75 : 0.72);
                if (scored) penalties[side]++;
                addLog(`<span class="log-min">TAB ${label}</span> ${side === 0 ? G.clubName : opp.name} ${scored ? 'marque' : 'rate'}.`);
            };
            for (let round = 1; round <= 5; round++) {
                kickOnce(0, round); kickOnce(1, round);
                const remaining = 5 - round;
                if (Math.abs(penalties[0] - penalties[1]) > remaining) break;
            }
            let sudden = 0;
            while (penalties[0] === penalties[1] && sudden < 10) {
                sudden++; kickOnce(0, 'mort subite ' + sudden); kickOnce(1, 'mort subite ' + sudden);
            }
            if (penalties[0] === penalties[1]) penalties[Math.random() < 0.5 ? 0 : 1]++;
            cupWinner = penalties[0] > penalties[1] ? 'me' : 'opp';
            addLog(`<strong>🎯 Tirs au but : ${penalties[0]}–${penalties[1]}.</strong>`);
        } else cupWinner = myScore > oppScore ? 'me' : 'opp';
    } else if (cupMatch) cupWinner = myScore > oppScore ? 'me' : 'opp';
    await PV.end();
    // Random events
    await new Promise(r => setTimeout(r, 300));
    // Pressing causes more injuries
    if (Math.random() < injuryRisk) {
        const injured = healthySquad[rand(0, healthySquad.length - 1)];
        if (injured) {
            // Fragile profile = longer injury
            const injDuration = injured.profile === 'fragile' ? rand(2, 5) : rand(1, 3);
            injured.injuredGames = injDuration;
            addLog(`<span class="log-min">${rand(20, 89)}'</span> <span class="log-bad">🤕 Blessure${injured.profile === 'fragile' ? ' (joueur fragile !)' : ''} ! ${injured.name} sort (${injDuration} match(s) d'absence).</span>`);
        }
    }
    await new Promise(r => setTimeout(r, 400));
    // Result
    let result, pts = 0;
    const stadBonus = (G.upgrades.stadium || 0) * 50000;
    let prize;
    if ((cupMatch && cupWinner === 'me') || (!cupMatch && myScore > oppScore)) {
        result = "W";
        pts = 3;
        prize = 200000 + stadBonus;
        G.streakW = (G.streakW || 0) + 1;
        G.streakL = 0;
        const moraleGain = G.isDerby ? 20 : 12;
        const psychoBonus = (G.staff && G.staff.psychologue) ? 5 : 0;
        G.morale = Math.min(100, (G.morale || 50) + moraleGain + psychoBonus);
        addLog(`<strong>⏱ Fin du match — <span class="log-goal">Victoire ${myScore}–${oppScore} vs ${crest(opp.name, opp.emoji, 16)} ${opp.name}${G.isDerby ? ' 🔥 Derby remporté !' : ''}</span> +${fmtMoney(prize)}</strong>`);
    } else if (!cupMatch && myScore === oppScore) {
        result = "D";
        pts = 1;
        prize = 80000 + Math.round(stadBonus / 2);
        G.streakW = 0;
        G.streakL = 0;
        G.morale = Math.max(0, Math.min(100, (G.morale || 50) + 2));
        addLog(`<strong>⏱ Fin du match — <span style="color:var(--gold)">Match nul ${myScore}–${oppScore} vs ${crest(opp.name, opp.emoji, 16)} ${opp.name}</span>. +${fmtMoney(prize)}</strong>`);
    } else {
        result = "L";
        pts = 0;
        prize = 30000;
        G.streakW = 0;
        G.streakL = (G.streakL || 0) + 1;
        const moraleLoss = G.isDerby ? -22 : -14;
        G.morale = Math.max(0, (G.morale || 50) + moraleLoss);
        addLog(`<strong>⏱ Fin du match — <span class="log-bad">Défaite ${myScore}–${oppScore} vs ${crest(opp.name, opp.emoji, 16)} ${opp.name}.${G.streakL >= 3 ? ' 🚨 Série noire !' : ''}</span> +${fmtMoney(prize)}</strong>`);
    }

    // Stadium ticket revenue is calculated after the result is known.
    const stadLvl = G.upgrades.stadium || 0;
    const capacity = G.stadiumCapacity || 15000;
    const attendance = Math.round(capacity * (0.55 + (G.reputation || 1) * 0.07 + stadLvl * 0.04 + (result === 'W' ? 0.1 : 0)));
    const ticketPrice = 25 + stadLvl * 8 + (G.reputation || 1) * 5;
    const matchTickets = Math.min(attendance, capacity) * ticketPrice;
    G.ticketRevenue = (G.ticketRevenue || 0) + matchTickets;

    // Update state
    if (!cupMatch) G.matchDay++;
    _rankCache.day = -1; // invalidate rank cache
    if (!cupMatch) {
        G.points += pts;
        if (result === "W") G.wins++;
        else if (result === "D") G.draws++;
        else G.losses++;
        G.goalsFor += myScore;
        G.goalsAgainst += oppScore;
    }
    G.money += prize;
    G.money += matchTickets;
    // Monthly wages (every 4 matches)
    if (false) { // salaires prélevés chaque 1er du mois (career.js)
        const totalWages = G.squad.reduce((s, p) => s + (p.wage || 0), 0);
        const staffCost = Object.values(G.staff || {}).reduce((s, hired) => s + (hired ? 500000 : 0), 0);
        const totalDeduction = totalWages + staffCost;
        G.money = Math.max(0, G.money - totalDeduction);
        G.monthlyWagePaid = (G.monthlyWagePaid || 0) + totalDeduction;
        if (totalDeduction > 0)
            addLog(`<span class="log-min">✉️</span> <span style="color:var(--muted)">Salaires du mois payés : –${fmtMoney(totalDeduction)}</span>`);
    }
    // Reputation update
    if (result === 'W')
        G.repPoints = (G.repPoints || 0) + (G.isDerby ? 4 : 2);
    else if (result === 'L')
        G.repPoints = Math.max(0, (G.repPoints || 0) - 1);
    const repThresholds = [0, 20, 60, 140, 280, 500];
    for (let r = 5; r >= 1; r--) {
        if ((G.repPoints || 0) >= repThresholds[r]) {
            G.reputation = r;
            break;
        }
    }
    // Youth progression
    if (G.youthPlayers && G.youthPlayers.length > 0) {
        const academyLvl = G.upgrades.academy || 0;
        G.youthPlayers.forEach(y => {
            if (!y.graduated)
                y.progress = Math.min(100, (y.progress || 0) + rand(5, 12) + academyLvl * 3);
        });
    }
    // Contract countdown — trigger alert when expiring soon
    if (G.contracts) {
        G.contracts.forEach(c => {
            const remaining = Number.isFinite(Number(c.matchesLeft)) ? Number(c.matchesLeft) : 38;
            c.matchesLeft = Math.max(0, remaining - 1);
            const p = findPlayerForContract(c);
            if (p && c.matchesLeft === 3) {
                // Mark as unhappy so narrative event triggers
                p.happy = false;
            }
        });
    }
    if (cupMatch) {
        const cup = window.CUP && CUP.completePlayerMatch({homeGoals:G.isHomeMatch?myScore:oppScore,awayGoals:G.isHomeMatch?oppScore:myScore,extraTime,penalties:penalties?(G.isHomeMatch?penalties:[penalties[1],penalties[0]]):null,winnerId:cupWinner==='me'?G.cup.playerId:(G.isHomeMatch?G.activeMatch.awayId:G.activeMatch.homeId)});
        if (cup) G.lastCupMatch = JSON.parse(JSON.stringify(cup));
    } else G.results.push(result);
    // Update standings
    const me = G.standings.find(t => t.isMe);
    if (!cupMatch && me) {
        me.played++;
        me.gf += myScore;
        me.ga += oppScore;
        me.points += pts;
        if (result === "W")
            me.won++;
        else if (result === "D")
            me.drawn++;
        else
            me.lost++;
    }

    // Resolve this round's actual AI fixtures so the table and matchday news agree.
    if (!cupMatch) {
        simulateLeagueMatchday(G.matchDay);
        // Simulate world leagues progression
        simulateWorldMatchday();
    }
    // Academy upgrade
    if (G.upgrades.academy > 0) {
        G.squad.forEach(p => {
            if (Math.random() < 0.25)
                p.level = Math.min(ensurePot(p).pot, p.level + G.upgrades.academy);
        });
    }

    // Unhappy benched players if squad > 14
    if (!cupMatch && G.squad.length > 14) {
        G.squad.forEach(p => {
            if (p.goals === 0 && p.assists === 0 && G.matchDay > 5 && Math.random() < 0.05) {
                p.happy = false;
            }
        });
    }

    if (window.CareerDepth) CareerDepth.afterMatch({
        result,
        opponent: opp,
        goalsFor: myScore,
        goalsAgainst: oppScore,
        competition: cupMatch ? 'cup' : 'league',
        matchId: cupMatch && G.lastCupMatch ? G.lastCupMatch.id : G.matchDay
    });
    if (!cupMatch) { G.activeMatch = null; G.matchContext = null; }

    updateTopBar();
    renderResults();
    document.getElementById("m-status").textContent =
            result === "W" ? (G.isDerby ? "🔥 Derby remporté !" : "🏆 Victoire ! +") + fmtMoney(prize) :
            result === "D" ? "🤝 Match nul. +" + fmtMoney(prize) : "💔 Défaite. +" + fmtMoney(prize);
    toast(
            result === "W" ? "⚽ Victoire ! +" + fmtMoney(prize) :
            result === "D" ? "🤝 Match nul +" + fmtMoney(prize) : "💔 Défaite...",
            result === "W" ? "success" : result === "L" ? "error" : ""
            );
    // Post-match narrative events (every 3-5 matches)
    if (G.matchDay > 3 && Math.random() < 0.28) {
        await new Promise(r => setTimeout(r, 800));
        triggerNarrativeEvent();
        return; // event modal handles next step
    }

    _setPostMatchBtn();
}

// ======================================================
//  NARRATIVE EVENTS
// ======================================================
const NARRATIVE_EVENTS = [
    {
        id: 'star_offer',
        condition: () => G.squad.filter(p => p.level >= 80).length > 0,
        generate: () => {
            const star = G.squad.filter(p => p.level >= 80).sort((a, b) => b.level - a.level)[0];
            const offer = star.level * 80000;
            return {
                emoji: '💰', title: 'Offre pour votre star',
                desc: `Un grand club propose ${fmtMoney(offer)} pour ${star.name} (Note ${star.level}). Que décidez-vous ?`,
                choices: [
                    {label: `✅ Accepter — +${fmtMoney(offer)}`, action: () => {
                            const idx = G.squad.indexOf(star);
                            G.squad.splice(idx, 1);
                            G.money += offer;
                            toast(star.name + ' vendu pour ' + fmtMoney(offer) + ' !', 'success');
                        }},
                    {label: '❌ Refuser — Le joueur reste', action: () => {
                            star.happy = true;
                            toast('Offre refusée. ' + star.name + ' reste !', 'info');
                        }},
                    {label: '🔄 Contre-proposer (+30%)', action: () => {
                            const newOffer = Math.round(offer * 1.3);
                            openNego(star, newOffer);
                        }}
                ]
            };
        }
    },
    {
        id: 'key_injury',
        condition: () => G.squad.filter(p => p.injuredGames === 0 && p.level >= 75).length > 0,
        generate: () => {
            const star = G.squad.filter(p => p.injuredGames === 0 && p.level >= 75).sort((a, b) => b.level - a.level)[0];
            return {
                emoji: '🤕', title: 'Blessure majeure',
                desc: `${star.name} vient de se blesser lors de l'entraînement et sera absent 3 à 5 matchs. Un coup dur pour l'équipe !`,
                choices: [
                    {label: '😔 Malchance... On s\'adapte', action: () => {
                            star.injuredGames = rand(3, 5);
                            G.morale = Math.max(0, G.morale - 8);
                            toast(star.name + ' blessé ' + star.injuredGames + ' matchs', 'error');
                        }},
                    {label: '💊 Traitement intensif (–200k €)', action: () => {
                            if (G.money >= 200000) {
                                star.injuredGames = 2;
                                G.money -= 200000;
                                toast('Traitement intensif : retour en 2 matchs', 'success');
                            } else
                                toast('Budget insuffisant !', 'error');
                        }}
                ]
            };
        }
    },
    {
        id: 'board_pressure',
        condition: () => G.matchDay >= 10 && G.losses > G.wins,
        generate: () => {
            return {
                emoji: '📋', title: 'Pression du board',
                desc: `La direction est mécontente des résultats. "Les performances ne sont pas au niveau attendu." Vous devez réagir.`,
                choices: [
                    {label: '💪 Discours de motivation (Moral +15)', action: () => {
                            G.morale = Math.min(100, G.morale + 15);
                            toast('Le vestiaire se resserre !', 'success');
                        }},
                    {label: '🔄 Changer de tactique immédiatement', action: () => {
                            G.tactic = '4-4-2';
                            G.style = 'defensif';
                            updateTopBar();
                            toast('Nouvelle tactique adoptée !', 'info');
                        }},
                    {label: '😤 Ignorer — Je suis mon plan', action: () => {
                            G.morale = Math.max(0, G.morale - 5);
                            toast('Le board est mécontent...', 'error');
                        }}
                ]
            };
        }
    },
    {
        id: 'morale_crisis',
        condition: () => (G.streakL || 0) >= 3,
        generate: () => {
            return {
                emoji: '😰', title: 'Crise de confiance',
                desc: `3 défaites d'affilée ! L'équipe doute, les joueurs ne se parlent plus. Une réaction s'impose d'urgence.`,
                choices: [
                    {label: '🍕 Séance collective (Moral +20, –50k €)', action: () => {
                            G.morale = Math.min(100, G.morale + 20);
                            G.money = Math.max(0, G.money - 50000);
                            G.streakL = 0;
                            toast('Cohésion retrouvée !', 'success');
                        }},
                    {label: '😡 Entraînement intense (Moral +8)', action: () => {
                            G.morale = Math.min(100, G.morale + 8);
                            toast('L\'équipe travaille dur.', 'info');
                        }}
                ]
            };
        }
    },
    {
        id: 'sponsor',
        condition: () => true,
        generate: () => {
            const amount = rand(100, 400) * 1000;
            return {
                emoji: '🤝', title: 'Offre de sponsoring',
                desc: `Une marque propose ${fmtMoney(amount)} de sponsoring. En contrepartie, vous devez jouer en style offensif lors des 3 prochains matchs.`,
                choices: [
                    {label: `✅ Accepter — +${fmtMoney(amount)}`, action: () => {
                            G.money += amount;
                            G.style = 'offensif';
                            const btn = document.getElementById('style-btn-offensif');
                            if (btn) {
                                document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
                                btn.classList.add('active');
                            }
                            toast('+' + fmtMoney(amount) + ' de sponsoring !', 'success');
                        }},
                    {label: '❌ Refuser — Garder notre liberté tactique', action: () => {
                            toast('Offre refusée.', 'info');
                        }}
                ]
            };
        }
    },
    {
        id: 'unhappy_player',
        condition: () => G.squad.filter(p => p.happy === false).length > 0,
        generate: () => {
            const p = G.squad.filter(pl => pl.happy === false)[0];
            const bonus = Math.round(p.wage * 0.3);
            return {
                emoji: '😤', title: 'Joueur mécontent',
                desc: `${p.name} réclame plus de temps de jeu et une augmentation de ${fmtMoney(bonus)}/mois. Sinon, il veut partir.`,
                choices: [
                    {label: `💰 Augmentation (–${fmtMoney(bonus)}/mois)`, action: () => {
                            p.wage += bonus;
                            p.happy = true;
                            G.morale = Math.min(100, G.morale + 5);
                            toast(p.name + ' est satisfait !', 'success');
                        }},
                    {label: '🚪 Vendre — Libérer l\'effectif', action: () => {
                            const val = playerValue(p);
                            G.money += val;
                            G.squad.splice(G.squad.indexOf(p), 1);
                            toast(p.name + ' vendu.', 'info');
                        }},
                    {label: '😐 Ignorer pour l\'instant', action: () => {
                            G.morale = Math.max(0, G.morale - 5);
                            toast(p.name + ' est toujours mécontent...', 'error');
                        }}
                ]
            };
        }
    }
];
function triggerNarrativeEvent() {
    const available = NARRATIVE_EVENTS.filter(e => e.condition());
    if (!available.length) {
        continueAfterEvent();
        return;
    }
    const ev = available[rand(0, available.length - 1)];
    const data = ev.generate();
    showEventModal(data);
}

function showEventModal(data) {
    document.getElementById('ev-emoji').textContent = data.emoji;
    document.getElementById('ev-title').textContent = data.title;
    document.getElementById('ev-desc').innerHTML = data.desc;
    const choicesEl = document.getElementById('ev-choices');
    choicesEl.innerHTML = data.choices.map((c, i) =>
            `<button class="event-choice-btn ${c.danger ? 'danger' : c.gold ? 'gold' : ''}" onclick="pickEventChoice(${i})">${c.label}</button>`
    ).join('');
    window._currentEventChoices = data.choices;
    document.getElementById('event-modal').style.display = 'flex';
}

function pickEventChoice(i) {
    document.getElementById('event-modal').style.display = 'none';
    if (window._currentEventChoices && window._currentEventChoices[i]) {
        window._currentEventChoices[i].action();
    }
    updateTopBar();
    continueAfterEvent();
}

// Helper: set the play button state after a match concludes
function _setPostMatchBtn() {
    const matchesTotal = G.seasonLength || 38;
    const btn = _el("playBtn");
    if (G.matchDay < matchesTotal) {
        btn.textContent = "Match suivant ▶";
        btn.disabled = false;
        btn.onclick = () => {
            btn.onclick = () => playMatch();
            prepareNextMatch();
        };
    } else {
        btn.textContent = "Fin de saison ▶";
        btn.disabled = false;
        btn.onclick = () => {
            btn.onclick = () => playMatch();
            showSeasonSummary();
        };
    }
}
function continueAfterEvent() {
    _setPostMatchBtn();
}

// ======================================================
//  NEGOTIATION
// ======================================================
let _negoPlayer = null, _negoBase = 0;
function openNego(player, basePrice) {
    _negoPlayer = player;
    _negoBase = basePrice;
    document.getElementById('nego-emoji').textContent = '💰';
    document.getElementById('nego-title').textContent = 'Contre-proposition';
    document.getElementById('nego-desc').textContent = `Négociez le prix de vente pour ${player.name}. Le club acheteur est intéressé mais discutera le prix.`;
    const slider = document.getElementById('nego-slider');
    slider.min = Math.round(basePrice * 0.7);
    slider.max = Math.round(basePrice * 1.5);
    slider.value = basePrice;
    updateNegoPrice(basePrice);
    document.getElementById('nego-modal').style.display = 'flex';
}

function updateNegoPrice(val) {
    const price = parseInt(val);
    document.getElementById('nego-price-display').textContent = fmtMoney(price);
    const ratio = price / _negoBase;
    const hint = ratio > 1.3 ? '⚠️ Trop cher — risque de refus élevé' :
            ratio > 1.1 ? '🤔 Le club va réfléchir...' :
            ratio < 0.9 ? '✅ Offre attractive — acceptation quasi certaine' :
            '⚖️ Offre raisonnable';
    document.getElementById('nego-hint').textContent = hint;
}

function confirmNego() {
    const price = parseInt(document.getElementById('nego-slider').value);
    const ratio = price / _negoBase;
    const acceptChance = ratio > 1.4 ? 0.1 : ratio > 1.2 ? 0.35 : ratio > 1.0 ? 0.6 : 0.85;
    document.getElementById('nego-modal').style.display = 'none';
    if (Math.random() < acceptChance) {
        const idx = G.squad.indexOf(_negoPlayer);
        if (idx !== -1)
            G.squad.splice(idx, 1);
        G.money += price;
        updateTopBar();
        toast(_negoPlayer.name + ' vendu pour ' + fmtMoney(price) + ' !', 'success');
    } else {
        toast('Offre refusée par le club acheteur.', 'error');
    }
    continueAfterEvent();
}

function closeNego() {
    document.getElementById('nego-modal').style.display = 'none';
    continueAfterEvent();
}

function renderResults() {
    document.getElementById("results-history").innerHTML =
            (G.results || []).slice(-15).map(r =>
            `<div class="res-dot ${r}" title="${r === "W" ? "Victoire" : r === "D" ? "Nul" : "Défaite"}">${r}</div>`
    ).join("");
}

// ======================================================
//  SQUAD
// ======================================================
// ======================================================
//  SQUAD VIEW MODE
// ======================================================
let _squadView = 'lineup'; // 'lineup' | 'bench'

function setSquadView(view) {
    _squadView = view;
    document.getElementById('btn-view-lineup').classList.toggle('active', view === 'lineup');
    document.getElementById('btn-view-bench').classList.toggle('active', view === 'bench');
    document.getElementById('squad-lineup-view').style.display = view === 'lineup' ? '' : 'none';
    document.getElementById('squad-grid-view').style.display = view === 'bench' ? '' : 'none';
    if (view === 'lineup')
        renderLineup();
    else
        renderSquadGrid();
}

function renderSquad() {
    document.getElementById("squad-count").textContent =
            "(" + G.squad.length + " joueurs — Salaires : " + fmtMoney(G.squad.reduce((s, p) => s + p.wage, 0)) + "/mois)";
    if (_squadView === 'lineup')
        renderLineup();
    else
        renderSquadGrid();
}

// ======================================================
//  GRID VIEW (ancien renderSquad)
// ======================================================
function renderSquadGrid() {
    document.getElementById("squad-grid").innerHTML = G.squad.map((p, i) => {
        ensurePot(p);
        const sellVal = playerValue(p);
        const isInjured = p.injuredGames > 0;
        const injuredBadge = isInjured ? `<span class="injured-badge">🤕 Blessé (${p.injuredGames}j)</span>` : "";
        const profileBadge = p.profile ? `<span class="profile-badge ${PROFILE_CLS[p.profile]}">${PROFILE_LABELS[p.profile]}</span>` : '';
        const unhappyBadge = p.happy === false ? `<span class="profile-badge irregulier">😤 Mécontent</span>` : '';
        const goals = p.goals || 0;
        const assists = p.assists || 0;
        return `
              <div class="player-card ${isInjured ? "is-injured" : ""}">
                <div class="pc-badge-wrap"><span class="pos-badge ${p.pos}">${p.pos}</span></div>
                <div class="player-name">${p.name}${injuredBadge}</div>
                <div style="margin-bottom:6px;">${profileBadge}${unhappyBadge}</div>
                <div class="player-meta">${p.age} ans</div>
                ${levelBarHTML(p)}
                <div class="level-info">
                  <span>Note</span>
                  <strong>${p.level}</strong>
                </div>
                <div class="level-info">
                  <span>Potentiel</span>
                  <strong style="color:${potColor(p)}">${potText(p)}</strong>
                </div>
                <div class="player-stats-row">
                  <span>⚽ <strong>${goals}</strong> buts</span>
                  <span>🎯 <strong>${assists}</strong> passes</span>
                </div>
                <div class="player-wage">Salaire : ${fmtMoney(p.wage)}/mois</div>
                <button class="sell-btn" onclick="sellPlayer(${i})" ${isInjured ? 'title="Joueur blessé"' : ""}>
                  Vendre — ${fmtMoney(sellVal)}
                </button>
              </div>`;
    }).join("");
}

// ======================================================
//  LINEUP DRAG & DROP SYSTEM
// ======================================================

// Lineup state: array of slots {row, slotIdx, playerIdx or null}
// Rows: ATT, MID, DEF, GK (top to bottom on pitch)
// G.lineup = {pitch: [squadIdx|null, ...], bench: [squadIdx|null, ...]}
// pitch = 11 slots, bench = rest

function getLineupSlotDef(tactic) {
    // Returns array of rows [{pos, count}] from ATT → GK
    const defs = {
        '4-3-3': [{pos: 'ATT', n: 3}, {pos: 'MID', n: 3}, {pos: 'DEF', n: 4}, {pos: 'GK', n: 1}],
        '4-4-2': [{pos: 'ATT', n: 2}, {pos: 'MID', n: 4}, {pos: 'DEF', n: 4}, {pos: 'GK', n: 1}],
        '3-5-2': [{pos: 'ATT', n: 2}, {pos: 'MID', n: 5}, {pos: 'DEF', n: 3}, {pos: 'GK', n: 1}],
        '5-3-2': [{pos: 'ATT', n: 2}, {pos: 'MID', n: 3}, {pos: 'DEF', n: 5}, {pos: 'GK', n: 1}],
        '4-2-3-1': [{pos: 'ATT', n: 1}, {pos: 'MID', n: 3}, {pos: 'MID', n: 2}, {pos: 'DEF', n: 4}, {pos: 'GK', n: 1}],
    };
    return defs[tactic] || defs['4-3-3'];
}

function initLineup() {
    if (!G.lineup)
        G.lineup = {pitch: [], bench: []};
    const rows = getLineupSlotDef(G.tactic || '4-3-3');
    const totalSlots = rows.reduce((s, r) => s + r.n, 0); // 11
    // Ensure arrays are right length
    while (G.lineup.pitch.length < totalSlots)
        G.lineup.pitch.push(null);
    G.lineup.pitch = G.lineup.pitch.slice(0, totalSlots);

    // Do not silently put unavailable players back into a vacant starting slot.
    G.lineup.pitch = G.lineup.pitch.map(i => G.squad[i] && G.squad[i].injuredGames > 0 ? null : i);

    // Auto-fill empty pitch slots with bench players (by position preference)
    const allIdxOnPitch = G.lineup.pitch.filter(x => x !== null);
    const benchPool = G.squad.map((p, i) => i).filter(i => !allIdxOnPitch.includes(i) && G.squad[i] && G.squad[i].injuredGames === 0);

    // Fill by position match
    let pitchIdx = 0;
    for (const row of rows) {
        for (let s = 0; s < row.n; s++) {
            if (G.lineup.pitch[pitchIdx] === null || !G.squad[G.lineup.pitch[pitchIdx]]) {
                // Find best match in pool
                const matchIdx = benchPool.findIndex(i => G.squad[i] && G.squad[i].pos === row.pos);
                if (matchIdx !== -1) {
                    G.lineup.pitch[pitchIdx] = benchPool[matchIdx];
                    benchPool.splice(matchIdx, 1);
                } else if (benchPool.length > 0) {
                    G.lineup.pitch[pitchIdx] = benchPool.shift();
                }
            }
            pitchIdx++;
        }
    }
    // Bench = everyone not on pitch
    const onPitch = new Set(G.lineup.pitch.filter(x => x !== null));
    G.lineup.bench = G.squad.map((_, i) => i).filter(i => !onPitch.has(i));
}

function renderLineup() {
    initLineup();
    const rows = getLineupSlotDef(G.tactic || '4-3-3');
    const pitchEl = document.getElementById('pitch-slots');
    const benchEl = document.getElementById('bench-slots');

    // Render pitch rows
    let html = '';
    let slotIdx = 0;
    for (const row of rows) {
        html += `<div class="pitch-row">`;
        for (let s = 0; s < row.n; s++) {
            const pIdx = G.lineup.pitch[slotIdx];
            const player = (pIdx !== null && pIdx !== undefined) ? G.squad[pIdx] : null;
            html += renderPitchSlot(slotIdx, row.pos, player, pIdx);
            slotIdx++;
        }
        html += `</div>`;
    }
    pitchEl.innerHTML = html;

    // Render bench
    let benchHtml = '';
    G.lineup.bench.forEach((pIdx, bi) => {
        const player = G.squad[pIdx];
        if (!player)
            return;
        benchHtml += renderBenchSlot(bi, player, pIdx);
    });
    benchEl.innerHTML = benchHtml;

    attachDragListeners();
}

function playerInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2)
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function renderPitchSlot(slotIdx, posHint, player, pIdx) {
    if (!player) {
        return `<div class="pitch-slot empty" data-slot="${slotIdx}" data-zone="pitch">
                        <span class="slot-pos-label">${posHint}</span>
                    </div>`;
    }
    const injured = player.injuredGames > 0;
    return `<div class="pitch-slot" data-slot="${slotIdx}" data-zone="pitch">
                    <div class="pitch-player" draggable="true" data-pidx="${pIdx}" data-zone="pitch" data-slot="${slotIdx}">
                        <div class="pitch-player-avatar pos-${player.pos}">${playerInitials(player.name)}</div>
                        <div class="pitch-player-name">${player.name.split(' ').pop()}</div>
                        <div class="pitch-player-lvl" title="Note ${player.level} · Potentiel ${potText(player)}">${player.level}</div>
                        ${injured ? `<div class="pitch-player-injured">🤕</div>` : ''}
                    </div>
                </div>`;
}

function renderBenchSlot(benchIdx, player, pIdx) {
    const injured = player.injuredGames > 0;
    const sellVal = playerValue(player);
    return `<div class="bench-slot" data-bench="${benchIdx}" data-zone="bench">
                    <div class="pitch-player" draggable="true" data-pidx="${pIdx}" data-zone="bench" data-bench="${benchIdx}">
                        <div class="pitch-player-avatar pos-${player.pos}">${playerInitials(player.name)}</div>
                        <div class="pitch-player-name">${player.name.split(' ').pop()}</div>
                        <div class="pitch-player-lvl" title="Note ${player.level} · Potentiel ${potText(player)}">${player.level} · ${player.pos}</div>
                        ${injured ? `<div class="pitch-player-injured">🤕</div>` : ''}
                    </div>
                    <span class="bench-sell-overlay" onclick="event.stopPropagation();sellPlayerByIdx(${pIdx})">Vendre</span>
                </div>`;
}

// ---- Drag & Drop ----
let _dragPIdx = null;   // squad index of dragged player
let _dragZone = null;   // 'pitch' or 'bench'
let _dragSlot = null;   // pitch slot index or bench index
let _touchGhost = null;

function attachDragListeners() {
    // Use event delegation on the containers for better performance
    const lineupContainer = document.querySelector('.lineup-container');
    if (!lineupContainer || lineupContainer._dragBound)
        return;
    lineupContainer._dragBound = true;

    lineupContainer.addEventListener('dragstart', e => {
        const el = e.target.closest('.pitch-player[draggable]');
        if (el)
            onDragStart({currentTarget: el, dataTransfer: e.dataTransfer});
    });
    lineupContainer.addEventListener('dragend', e => {
        const el = e.target.closest('.pitch-player[draggable]');
        if (el)
            onDragEnd({currentTarget: el});
    });
    lineupContainer.addEventListener('dragover', e => {
        const el = e.target.closest('.pitch-slot, .bench-slot');
        if (el) {
            e.preventDefault();
            onDragOver({currentTarget: el});
        }
    });
    lineupContainer.addEventListener('dragleave', e => {
        const el = e.target.closest('.pitch-slot, .bench-slot');
        if (el)
            onDragLeave({currentTarget: el});
    });
    lineupContainer.addEventListener('drop', e => {
        const el = e.target.closest('.pitch-slot, .bench-slot');
        if (el) {
            e.preventDefault();
            onDrop({currentTarget: el, preventDefault: () => {
                }});
        }
    });
    lineupContainer.addEventListener('touchstart', e => {
        const el = e.target.closest('.pitch-player[draggable]');
        if (el)
            onTouchStart.call(el, e);
    }, {passive: false});
}

function onDragStart(e) {
    const el = e.currentTarget;
    _dragPIdx = parseInt(el.dataset.pidx);
    _dragZone = el.dataset.zone;
    _dragSlot = el.dataset.zone === 'pitch' ? parseInt(el.dataset.slot) : parseInt(el.dataset.bench);
    setTimeout(() => el.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
}
function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
}
function onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}
function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}
function onDrop(e) {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('drag-over');
    if (_dragPIdx === null)
        return;
    dropPlayerOnTarget(target);
}

function dropPlayerOnTarget(target) {
    const targetZone = target.dataset.zone;
    if (targetZone === 'pitch') {
        const targetSlot = parseInt(target.dataset.slot);
        const existingPIdx = G.lineup.pitch[targetSlot];
        if (_dragZone === 'pitch') {
            // Swap two pitch slots
            G.lineup.pitch[targetSlot] = _dragPIdx;
            G.lineup.pitch[_dragSlot] = existingPIdx !== undefined ? existingPIdx : null;
        } else {
            // Move from bench to pitch
            if (existingPIdx !== null && existingPIdx !== undefined) {
                // Put the displaced player on bench
                const benchIdx = G.lineup.bench.indexOf(_dragPIdx);
                if (benchIdx !== -1)
                    G.lineup.bench[benchIdx] = existingPIdx;
                else
                    G.lineup.bench.push(existingPIdx);
            } else {
                // Remove from bench
                const benchIdx = G.lineup.bench.indexOf(_dragPIdx);
                if (benchIdx !== -1)
                    G.lineup.bench.splice(benchIdx, 1);
            }
            G.lineup.pitch[targetSlot] = _dragPIdx;
        }
    } else if (targetZone === 'bench') {
        const targetBench = parseInt(target.dataset.bench);
        const existingPIdx = G.lineup.bench[targetBench];
        if (_dragZone === 'pitch') {
            // Move from pitch to bench
            G.lineup.pitch[_dragSlot] = existingPIdx !== undefined ? existingPIdx : null;
            if (existingPIdx !== undefined && existingPIdx !== null) {
                G.lineup.bench[targetBench] = _dragPIdx;
            } else {
                G.lineup.bench.splice(targetBench, 0, _dragPIdx);
            }
            // Remove _dragPIdx from bench if it was there
            const dupIdx = G.lineup.bench.indexOf(_dragPIdx);
            if (dupIdx !== -1 && G.lineup.bench[targetBench] !== _dragPIdx)
                G.lineup.bench.splice(dupIdx, 1);
        } else {
            // Swap two bench slots
            G.lineup.bench[targetBench] = _dragPIdx;
            const myBenchIdx = G.lineup.bench.findIndex((x, i) => x === _dragPIdx && i !== targetBench);
            if (_dragSlot !== targetBench) {
                G.lineup.bench[_dragSlot] = existingPIdx !== undefined ? existingPIdx : null;
            }
        }
    }
    _dragPIdx = null;
    _dragZone = null;
    _dragSlot = null;
    renderLineup();
    toast("Effectif mis à jour !", "info");
}

// Touch drag
function onTouchStart(e) {
    const el = e.currentTarget;
    _dragPIdx = parseInt(el.dataset.pidx);
    _dragZone = el.dataset.zone;
    _dragSlot = el.dataset.zone === 'pitch' ? parseInt(el.dataset.slot) : parseInt(el.dataset.bench);

    // Create ghost
    _touchGhost = document.createElement('div');
    _touchGhost.className = 'drag-ghost';
    _touchGhost.innerHTML = el.innerHTML;
    document.body.appendChild(_touchGhost);

    const touch = e.touches[0];
    _touchGhost.style.left = (touch.clientX - 36) + 'px';
    _touchGhost.style.top = (touch.clientY - 44) + 'px';

    el.classList.add('dragging');

    document.addEventListener('touchmove', onTouchMove, {passive: false});
    document.addEventListener('touchend', onTouchEnd);
}

function onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    if (_touchGhost) {
        _touchGhost.style.left = (touch.clientX - 36) + 'px';
        _touchGhost.style.top = (touch.clientY - 44) + 'px';
    }
    // Highlight drop zone
    document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
    _touchGhost.style.display = 'none';
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    _touchGhost.style.display = '';
    if (el) {
        const slot = el.closest('.pitch-slot, .bench-slot');
        if (slot)
            slot.classList.add('drag-over');
    }
}

function onTouchEnd(e) {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.querySelectorAll('.pitch-player.dragging').forEach(x => x.classList.remove('dragging'));

    const touch = e.changedTouches[0];
    if (_touchGhost) {
        _touchGhost.remove();
        _touchGhost = null;
    }
    document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));

    _touchGhost = null;
    if (_touchGhost !== null)
        return;

    // Find drop target
    const ghostEl = document.createElement('div');
    ghostEl.style.cssText = 'position:fixed;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(ghostEl);
    ghostEl.remove();

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && _dragPIdx !== null) {
        const slot = el.closest('.pitch-slot, .bench-slot');
        if (slot) {
            dropPlayerOnTarget(slot);
            return;
        }
    }
    _dragPIdx = null;
    _dragZone = null;
    _dragSlot = null;
}

function sellPlayerByIdx(pIdx) {
    if (G.squad.length <= 8) {
        toast("Effectif trop réduit pour vendre !", "error");
        return;
    }
    const p = G.squad[pIdx];
    if (!p)
        return;
    ensureContractState();
    const val = playerValue(p);
    G.money += val;
    const contractId = p.contractPlayerId;
    G.squad.splice(pIdx, 1);
    G.contracts = G.contracts.filter(c => c.playerId !== contractId);
    // Fix lineup indices
    if (G.lineup) {
        G.lineup.pitch = G.lineup.pitch.map(i => i === pIdx ? null : (i > pIdx ? i - 1 : i));
        G.lineup.bench = G.lineup.bench.map(i => i === pIdx ? null : (i > pIdx ? i - 1 : i)).filter(i => i !== null);
    }
    updateTopBar();
    renderSquad();
    toast(p.name + " vendu pour " + fmtMoney(val) + " !", "success");
}

function sellPlayer(i) {
    sellPlayerByIdx(i);
}

// ======================================================
//  TRANSFERS
// ======================================================
function refreshMarket() {
    G.market = generateMarket(G.upgrades.scouting || 0);
    renderMarket();
    toast("Marché actualisé !", "info");
}

function buyPlayer(i) {
    const p = G.market[i];
    if (!p)
        return;
    if (G.money < p.price) {
        toast("Budget insuffisant !", "error");
        return;
    }
    G.money -= p.price;
    const signed = {name: p.name, pos: p.pos, level: p.level, pot: p.pot, potMin: p.potMin, potMax: p.potMax, wage: p.wage, age: p.age, goals: 0, assists: 0, injuredGames: 0, profile: p.profile || null, happy: true};
    ensureContractPlayerId(signed);
    G.squad.push(signed);
    G.contracts = Array.isArray(G.contracts) ? G.contracts : [];
    G.contracts.push({playerId: signed.contractPlayerId, matchesLeft: rand(5, 38), wage: signed.wage || 0});
    G.market.splice(i, 1);
    // Add to bench in lineup
    if (G.lineup)
        G.lineup.bench.push(G.squad.length - 1);
    updateTopBar();
    renderMarket();
    toast(p.name + " recruté !", "success");
}

function renderTopScorers() {
    const box = document.getElementById("top-scorers-list");
    if (!box || !G)
        return;
    const scorers = [...G.squad]
            .filter(p => (p.goals || 0) > 0)
            .sort((a, b) => (b.goals || 0) - (a.goals || 0))
            .slice(0, 5);
    if (!scorers.length) {
        box.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:6px 0;">Aucun but cette saison.</div>';
        return;
    }
    box.innerHTML = scorers.map((p, i) => `
                  <div class="scorer-row">
                    <span class="scorer-rank ${i === 0 ? "gold" : ""}">${i + 1}</span>
                    <span style="flex:1;">${p.name} <span class="pos-badge ${p.pos}" style="margin-left:4px;">${p.pos}</span></span>
                    <span class="scorer-goals">${p.goals} ⚽</span>
                    <span style="color:var(--muted);font-size:11px;margin-left:8px;">${p.assists || 0} 🎯</span>
                  </div>`).join("");
}

function showSeasonSummary() {
    const sorted = [...G.standings].sort((a, b) => {
        if (b.points !== a.points)
            return b.points - a.points;
        return (b.gf - b.ga) - (a.gf - a.ga);
    });
    const myRank = sorted.findIndex(t => t.isMe) + 1;
    const total = sorted.length;
    const lg = LEAGUES[G.leagueKey];
    let emoji = "🏆", title = "Saison terminée", msgClass = "neutral", msgText = "";
    const promSpots = lg.promotionSpots || 0;
    const playoffSpots = lg.playoffSpots || 0;
    const relSpots = lg.relegationSpots || 3;
    let playoffResult = null;
    if (lg.promotesTo && playoffSpots > 0 && myRank > promSpots && myRank <= promSpots + playoffSpots && window.PromotionPlayoffs) {
        const candidates = sorted.slice(promSpots, promSpots + playoffSpots).map((row, index) => {
            const isPlayer = row.isMe || row.name === G.clubName;
            let rating = Number(row.strength) || 60;
            if (isPlayer) {
                const healthy = (G.squad || []).filter(p => (p.injuredGames || 0) <= 0).slice().sort((a, b) => (b.level || 0) - (a.level || 0)).slice(0, 11);
                const average = healthy.length ? healthy.reduce((total, p) => total + (Number(p.level) || 0), 0) / healthy.length : rating;
                const missingPlayersPenalty = Math.max(0, 11 - healthy.length) * 2.5;
                rating = average + ((Number(G.morale) || 50) - 50) * 0.08 - missingPlayersPenalty;
            } else if (window.AIWorld) {
                rating = AIWorld.teamStrength(G, LEAGUES, row.name, G.leagueKey);
            }
            return {name: row.name, emoji: row.emoji, seed: promSpots + index + 1, rating, isPlayer};
        });
        if (playoffSpots === 1) {
            const upper = LEAGUES[lg.promotesTo];
            const relegationCount = upper && upper.relegationSpots || 3;
            const worldUpper = getWorldStandings()[lg.promotesTo];
            const upperTable = worldUpper && worldUpper.table || [];
            const opponent = upperTable.slice(-relegationCount).find(row => row.name !== G.clubName) || (upper && upper.clubs.slice(-1)[0]);
            if (opponent) {
                const rating = window.AIWorld ? AIWorld.teamStrength(G, LEAGUES, opponent.name, lg.promotesTo) : budgetToRating(opponent.budget);
                candidates.push({name: opponent.name, emoji: opponent.emoji, seed: promSpots + playoffSpots + 1, rating, isPlayer: false});
            }
        }
        playoffResult = PromotionPlayoffs.simulate(candidates, {
            seed: `${G.seasonYear || 2025}:${G.leagueKey}:${candidates.map(team => `${team.name}:${Math.round(team.rating)}`).join('|')}`,
            playerClubName: G.clubName
        });
    }
    if (lg.promotesTo && myRank <= promSpots) {
        emoji = "🎉";
        title = "PROMOTION !";
        msgClass = "promo";
        msgText = `Tu montes en ${LEAGUES[lg.promotesTo].name} ${LEAGUES[lg.promotesTo].flag} !`;
    } else if (lg.promotesTo && playoffSpots > 0 && myRank <= promSpots + playoffSpots) {
        if (playoffResult && playoffResult.promoted) {
            emoji = "🥳";
            title = "PLAYOFFS GAGNÉS !";
            msgClass = "promo";
            msgText = `Tu montes en ${LEAGUES[lg.promotesTo].name} ${LEAGUES[lg.promotesTo].flag} !`;
        } else {
            emoji = "😔";
            title = "Éliminé en playoffs";
            msgClass = "neutral";
            msgText = `Tu restes en ${lg.name}.`;
        }
    } else if (lg.relegatesTo && myRank > total - relSpots) {
        emoji = "💔";
        title = "RELÉGATION";
        msgClass = "rel";
        msgText = `Tu descends en ${LEAGUES[lg.relegatesTo].name} ${LEAGUES[lg.relegatesTo].flag}...`;
    } else if (myRank === 1) {
        emoji = "🏆";
        title = "CHAMPION !";
        msgClass = "promo";
        msgText = `Félicitations, tu es champion de ${lg.name} !`;
    } else {
        emoji = "✅";
        title = "Saison terminée";
        msgText = `${myRank}e place — ${G.points} points. Bonne saison !`;
    }

    document.getElementById("ss-emoji").textContent = emoji;
    document.getElementById("ss-title").textContent = title;
    document.getElementById("ss-subtitle").textContent = `${lg.name} ${lg.flag} · ${crest(G.clubName, G.clubEmoji, 16)} ${G.clubName}`;
    const msgEl = document.getElementById("ss-msg");
    msgEl.textContent = msgText;
    msgEl.className = "season-card-msg " + msgClass;

    // Objective result
    let objHtml = '';
    if (G.objective) {
        const objOk = checkObjective();
        if (objOk) {
            G.money += G.objective.bonus;
            G.morale = Math.min(100, G.morale + 10);
        }
        objHtml = `<div style="font-size:12px;margin-bottom:10px;padding:8px 14px;border-radius:8px;${objOk ? 'background:rgba(0,224,84,0.1);color:var(--accent);border:1px solid rgba(0,224,84,0.2);' : 'background:rgba(255,68,85,0.1);color:var(--danger);border:1px solid rgba(255,68,85,0.2);'}">
                        ${objOk ? `✅ Objectif atteint : ${G.objective.text} — +${fmtMoney(G.objective.bonus)} bonus !` : `❌ Objectif manqué : ${G.objective.text}`}
                    </div>`;
    }

    // Top scorer & assister this season
    const topScorer = G.squad.reduce((b, p) => (p.goals || 0) > (b.goals || 0) ? p : b, {name: '—', goals: 0});
    const topAssist = G.squad.reduce((b, p) => (p.assists || 0) > (b.assists || 0) ? p : b, {name: '—', assists: 0});

    // Champion & relegation zone from sorted
    const champion = sorted[0];
    const relegated = sorted.slice(-relSpots).map(t => crest(t.name, t.emoji, 16) + ' ' + t.name).join(', ');

    // European result
    let euroHtml = '';
    if (G.euroState) {
        ['ucl', 'el', 'uecl'].forEach(comp => {
            const state = G.euroState[comp];
            if (!state)
                return;
            const lbl = {ucl: '🏆 Ligue des Champions', el: '🟠 Ligue Europa', uecl: '🟢 Conference League'}[comp];
            if (state.winner)
                euroHtml += `<div style="color:var(--gold);font-size:12px;margin-bottom:4px;">🎖️ Vainqueur de la ${lbl} !</div>`;
            else if (state.eliminated) {
                const last = state.rounds.filter(r => r.result === 'loss').pop();
                euroHtml += `<div style="color:var(--muted);font-size:12px;margin-bottom:4px;">❌ Éliminé en ${last ? last.name : '?'} (${lbl})</div>`;
            }
        });
    }
    const escapePlayoffText = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const playoffHtml = playoffResult && playoffResult.rounds.length ? `<div style="color:var(--accent2);font-size:12px;margin:8px 0;">🏟️ Barrages : ${playoffResult.rounds.map(round => `<div><strong>${escapePlayoffText(round.name)}</strong> — ${round.matches.map(match => `${escapePlayoffText(match.first)} ${match.firstGoals}–${match.secondGoals} ${escapePlayoffText(match.second)}${match.penalties ? ' (t.a.b.)' : ''}`).join(' · ')}</div>`).join('')}</div>` : '';

    // Save season to history
    if (!G.seasonHistory)
        G.seasonHistory = [];
    if (window.AIWorld) AIWorld.ensure(G, LEAGUES);
    if (window.CareerDepth) CareerDepth.migrate(G);
    G.seasonHistory.push({
        season: G.seasonYear || (G.seasonHistory.length + 1),
        year: G.seasonYear || null,
        clubName: G.clubName, leagueKey: G.leagueKey,
        league: lg.name, flag: lg.flag,
        rank: myRank, points: G.points,
        wins: G.wins, draws: G.draws, losses: G.losses,
        gf: G.goalsFor, ga: G.goalsAgainst,
        outcome: msgClass === 'promo' ? '⬆️ Promotion' : msgClass === 'rel' ? '⬇️ Relégation' : myRank === 1 ? '🏆 Champion' : '✅ Maintien'
    });

    // History display (last 5 seasons)
    let histHtml = '';
    if (G.seasonHistory.length > 1) {
        histHtml = `<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">
                        <div style="font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">📜 Historique des saisons</div>`;
        G.seasonHistory.slice(-5).reverse().forEach(h => {
            histHtml += `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                            <span>${h.flag} Saison ${h.season} — ${h.league}</span>
                            <span>${h.outcome} · ${h.rank}e · ${h.points} pts</span>
                        </div>`;
        });
        histHtml += `</div>`;
    }

    document.getElementById("ss-pts").textContent = G.points;
    document.getElementById("ss-rank").textContent = myRank + "e";
    document.getElementById("ss-gf").textContent = G.goalsFor;
    document.getElementById("ss-wins").textContent = G.wins;
    document.getElementById("ss-draws").textContent = G.draws;
    document.getElementById("ss-losses").textContent = G.losses;

    // Inject extra content into the season card
    const ssCard = document.querySelector('.season-card');
    const ssBtn = document.getElementById('ss-btn');
    // Remove previous injected extras
    ssCard.querySelectorAll('.ss-extra').forEach(el => el.remove());
    const extras = document.createElement('div');
    extras.className = 'ss-extra';
    extras.innerHTML = objHtml + `
                    <div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
                        <div style="flex:1;min-width:130px;background:var(--panel3);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
                            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">⚽ Buteur</div>
                            <div style="font-weight:700;font-size:13px;">${topScorer.name}</div>
                            <div style="color:var(--accent);font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;">${topScorer.goals || 0} buts</div>
                        </div>
                        <div style="flex:1;min-width:130px;background:var(--panel3);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;">
                            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">🎯 Passeur</div>
                            <div style="font-weight:700;font-size:13px;">${topAssist.name}</div>
                            <div style="color:var(--accent2);font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:700;">${topAssist.assists || 0} passes</div>
                        </div>
                    </div>
                    <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🏆 Champion : ${crest(champion.name, champion.emoji, 16)} ${champion.name} (${champion.points} pts)</div>
                    <div style="font-size:12px;color:var(--danger);margin-bottom:10px;">⬇️ Relégués : ${relegated}</div>
                    ${euroHtml}
                    ${playoffHtml}
                    ${histHtml}
                `;
    ssCard.insertBefore(extras, ssBtn);

    window._seasonOutcome = {msgClass, promotesTo: lg.promotesTo, relegatesTo: lg.relegatesTo, myRank, promSpots, playoffSpots, relSpots, total, playoffResult};
    document.getElementById("season-summary").style.display = "flex";
}

function closeSummary() {
    document.getElementById("season-summary").style.display = "none";
    const o = window._seasonOutcome;
    const lg = LEAGUES[G.leagueKey];
    // Apply promotion/relegation
    if (o.msgClass === "promo" && lg.promotesTo) {
        const upper = LEAGUES[lg.promotesTo];
        const previousLeague = G.leagueKey;
        moveClubBetweenLeagues(previousLeague, lg.promotesTo);
        G.leagueKey = lg.promotesTo;
        G.leagueName = upper.name + " " + upper.flag;
        G.standings = generateStandings(G.clubName, G.leagueKey);
        G.seasonLength = getSeasonLength(G.leagueKey);
        // Promotion bonus
        G.money += 2000000;
        toast('🎉 Promotion ! +2M€ de prime !', 'success');
    } else if (o.msgClass === "rel" && lg.relegatesTo) {
        const lower = LEAGUES[lg.relegatesTo];
        const previousLeague = G.leagueKey;
        moveClubBetweenLeagues(previousLeague, lg.relegatesTo);
        G.leagueKey = lg.relegatesTo;
        G.leagueName = lower.name + " " + lower.flag;
        G.standings = generateStandings(G.clubName, G.leagueKey);
        G.seasonLength = getSeasonLength(G.leagueKey);
        // Relégation penalty: some players may leave
        G.morale = Math.max(10, G.morale - 20);
    } else {
        G.standings = generateStandings(G.clubName, G.leagueKey);
        // Champion bonus
        if (o.myRank === 1) {
            G.money += 1000000;
            G.repPoints = (G.repPoints || 0) + 20;
        }
    }
    // Reset season stats but keep squad goals/assists as career stats
    G.matchDay = 0;
    G.points = 0;
    G.wins = 0;
    G.draws = 0;
    G.losses = 0;
    G.goalsFor = 0;
    G.goalsAgainst = 0;
    G.results = [];
    G.market = generateMarket(G.upgrades.scouting || 0);
    G._calendar = null;
    G.fixtures = null; // rebuild fixture schedule for new season
    G.morale = Math.max(30, Math.min(70, (G.morale || 50)));
    G.streakW = 0;
    G.streakL = 0;
    G.objective = null;
    G.euroState = {ucl: null, el: null, uecl: null};
    G.ticketRevenue = 0;
    // Age progression: players get 1 year older, very old ones may retire
    const retiredPlayers = [];
    const leavingForContract = new Set();
    ensureContractState();
    const previousContracts = G.contracts.map(contract => ({...contract}));
    if (G.contracts) {
        G.contracts.filter(c => (c.matchesLeft || 0) <= 0).forEach(c => {
            const p = findPlayerForContract(c);
            if (p && Math.random() < 0.4) leavingForContract.add(p);
        });
        leavingForContract.forEach(p => setTimeout(() => toast(`🚪 ${p.name} a quitté le club (fin de contrat)`, 'info'), 1000));
    }
    G.squad = G.squad.filter(p => {
        p.age = (p.age || 25) + 1;
        p.goals = 0;
        p.assists = 0; // reset season stats
        // Progression vers le potentiel (jusqu'à 30 ans)
        developPlayer(p);
        // Natural decline for players 33+
        if (p.age >= 33) {
            p.level = Math.max(45, p.level - rand(1, 3));
            refreshPotRange(p);
        }
        // Retire at 38 or random chance after 35
        if (p.age >= 38 || (p.age >= 35 && Math.random() < 0.3)) {
            retiredPlayers.push(p);
            if (window.CareerDepth) CareerDepth.registerRetirement(p);
            return false;
        }
        if (leavingForContract.has(p)) return false;
        return true;
    });
    if (retiredPlayers.length > 0) {
        setTimeout(() => toast(`👴 Retraite : ${retiredPlayers.map(p => p.name).join(', ')}`, 'info'), 600);
    }
    G.contracts = buildSeasonRolloverContracts(
        G.squad,
        previousContracts,
        G.seasonLength || getSeasonLength(G.leagueKey)
    );
    prepareNextMatch();
    updateTopBar();
}

// ======================================================
//  EUROPEAN COMPETITION DATA
// ======================================================
// UEFA country coefficients (2025-2026 based on UEFA ranking)
// euroSpots: array of {comp, entry} for each spot by rank
// comp: 'ucl'|'el'|'uecl'  entry: 'league_phase'|'playoff'|'q3'|'q2'|'q1'
const UEFA_EUROPEAN_SPOTS = {
    // === TOP 5 LEAGUES (rank 1-5) ===
    // England (rank 1) – 4 UCL + 1 EL + 1 UECL
    england: [
        {rank: 1, comp: 'ucl', entry: 'league_phase'},
        {rank: 2, comp: 'ucl', entry: 'league_phase'},
        {rank: 3, comp: 'ucl', entry: 'league_phase'},
        {rank: 4, comp: 'ucl', entry: 'league_phase'},
        {rank: 5, comp: 'el', entry: 'league_phase'},
        {rank: 6, comp: 'uecl', entry: 'playoff'},
    ],
    // Spain (rank 2) – 4 UCL + 1 EL + 1 UECL
    spain: [
        {rank: 1, comp: 'ucl', entry: 'league_phase'},
        {rank: 2, comp: 'ucl', entry: 'league_phase'},
        {rank: 3, comp: 'ucl', entry: 'league_phase'},
        {rank: 4, comp: 'ucl', entry: 'league_phase'},
        {rank: 5, comp: 'el', entry: 'league_phase'},
        {rank: 6, comp: 'uecl', entry: 'playoff'},
    ],
    // Germany (rank 3) – 4 UCL + 1 EL + 1 UECL
    germany: [
        {rank: 1, comp: 'ucl', entry: 'league_phase'},
        {rank: 2, comp: 'ucl', entry: 'league_phase'},
        {rank: 3, comp: 'ucl', entry: 'league_phase'},
        {rank: 4, comp: 'ucl', entry: 'league_phase'},
        {rank: 5, comp: 'el', entry: 'league_phase'},
        {rank: 6, comp: 'uecl', entry: 'playoff'},
    ],
    // Italy (rank 4) – 4 UCL + 1 EL + 1 UECL
    italy: [
        {rank: 1, comp: 'ucl', entry: 'league_phase'},
        {rank: 2, comp: 'ucl', entry: 'league_phase'},
        {rank: 3, comp: 'ucl', entry: 'league_phase'},
        {rank: 4, comp: 'ucl', entry: 'league_phase'},
        {rank: 5, comp: 'el', entry: 'league_phase'},
        {rank: 6, comp: 'uecl', entry: 'playoff'},
    ],
    // France (rank 5) – 2 UCL + 1 EL + 1 UECL
    france: [
        {rank: 1, comp: 'ucl', entry: 'league_phase'},
        {rank: 2, comp: 'ucl', entry: 'playoff'},
        {rank: 3, comp: 'el', entry: 'league_phase'},
        {rank: 4, comp: 'uecl', entry: 'playoff'},
    ],
    // === TIER 2 LEAGUES (rank 6-12) ===
    // Netherlands (rank 6)
    netherlands: [
        {rank: 1, comp: 'ucl', entry: 'q3'},
        {rank: 2, comp: 'el', entry: 'q3'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Portugal (rank 7)
    portugal: [
        {rank: 1, comp: 'ucl', entry: 'q3'},
        {rank: 2, comp: 'el', entry: 'q3'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Belgium (rank 8)
    belgium: [
        {rank: 1, comp: 'ucl', entry: 'q3'},
        {rank: 2, comp: 'el', entry: 'q3'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Turkey (rank 9)
    turkey: [
        {rank: 1, comp: 'ucl', entry: 'q3'},
        {rank: 2, comp: 'el', entry: 'q3'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Scotland (rank 10)
    scotland: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q3'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Austria (rank 11)
    austria: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q3'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Greece (rank 12)
    greece: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q3'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // === TIER 3 LEAGUES (rank 13-20) ===
    // Czech Republic (rank 13)
    czech: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Serbia (rank 14)
    serbia: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Denmark (rank 15)
    denmark: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Switzerland (rank 16)
    switzerland: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Norway (rank 17)
    norway: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q2'},
    ],
    // Croatia (rank 18)
    croatia: [
        {rank: 1, comp: 'ucl', entry: 'q2'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    // Sweden (rank 19)
    sweden: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    // Poland (rank 20)
    poland: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q2'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    // === TIER 4 LEAGUES ===
    ukraine: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q1'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    israel: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q1'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    romania: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q1'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    hungary: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q1'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    bulgaria: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q1'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    slovakia: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'el', entry: 'q1'},
        {rank: 3, comp: 'uecl', entry: 'q1'},
    ],
    cyprus: [
        {rank: 1, comp: 'el', entry: 'q1'},
        {rank: 2, comp: 'uecl', entry: 'q1'},
    ],
    azerbaijan: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'uecl', entry: 'q1'},
    ],
    slovenia: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'uecl', entry: 'q1'},
    ],
    ireland: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'uecl', entry: 'q1'},
    ],
    finland: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'uecl', entry: 'q1'},
    ],
    iceland: [
        {rank: 1, comp: 'ucl', entry: 'q1'},
        {rank: 2, comp: 'uecl', entry: 'q1'},
    ],
    albania: [{rank: 1, comp: 'uecl', entry: 'q1'}],
    luxembourg: [{rank: 1, comp: 'uecl', entry: 'q1'}],
    andorra: [{rank: 1, comp: 'uecl', entry: 'q1'}],
    gibraltar: [{rank: 1, comp: 'uecl', entry: 'q1'}],
    san_marino: [{rank: 1, comp: 'uecl', entry: 'q1'}],
};
// Get the European spot for a given league and rank
function getEuroSpot(leagueKey, rank) {
    const lg = LEAGUES[leagueKey];
    if (!lg || lg.tier !== 1)
        return null;
    const country = lg.country;
    const spots = UEFA_EUROPEAN_SPOTS[country];
    if (!spots)
        return null;
    return spots.find(s => s.rank === rank) || null;
}

// Get the zone dot class for a rank in a D1 league
function getEuroZoneDot(leagueKey, rank) {
    const spot = getEuroSpot(leagueKey, rank);
    if (!spot)
        return '';
    const entryIsLp = spot.entry === 'league_phase' || spot.entry === 'playoff';
    if (spot.comp === 'ucl')
        return entryIsLp ? 'zone-ucl' : 'zone-ucl-q';
    if (spot.comp === 'el')
        return entryIsLp ? 'zone-el' : 'zone-el-q';
    if (spot.comp === 'uecl')
        return entryIsLp ? 'zone-uecl' : 'zone-uecl-q';
    return '';
}

// Build the European rounds for a competition entry point
// Returns array of {name, desc, icon}
function buildEuroRounds(comp, entry) {
    const rounds = {
        ucl: {
            q1: [{name: '1er tour qualif.', desc: 'Aller & retour', icon: '🔵'},
                {name: '2e tour qualif.', desc: 'Aller & retour', icon: '🔵'},
                {name: '3e tour qualif.', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Match aller-retour', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            q2: [{name: '2e tour qualif.', desc: 'Aller & retour', icon: '🔵'},
                {name: '3e tour qualif.', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Match aller-retour', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            q3: [{name: '3e tour qualif.', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Match aller-retour', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            playoff: [{name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Match aller-retour', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            league_phase: [{name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Match aller-retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🔵'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
        },
        el: {
            q1: [{name: '1er tour qualif.', desc: 'Aller & retour', icon: '🟠'},
                {name: '2e tour qualif.', desc: 'Aller & retour', icon: '🟠'},
                {name: '3e tour qualif.', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            q2: [{name: '2e tour qualif.', desc: 'Aller & retour', icon: '🟠'},
                {name: '3e tour qualif.', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            q3: [{name: '3e tour qualif.', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            playoff: [{name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            league_phase: [{name: 'Phase de Ligue', desc: '8 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟠'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
        },
        uecl: {
            q1: [{name: '1er tour qualif.', desc: 'Aller & retour', icon: '🟢'},
                {name: '2e tour qualif.', desc: 'Aller & retour', icon: '🟢'},
                {name: '3e tour qualif.', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Phase de Ligue', desc: '6 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            q2: [{name: '2e tour qualif.', desc: 'Aller & retour', icon: '🟢'},
                {name: '3e tour qualif.', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Phase de Ligue', desc: '6 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            q3: [{name: '3e tour qualif.', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Phase de Ligue', desc: '6 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            playoff: [{name: 'Barrages (playoff)', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Phase de Ligue', desc: '6 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
            league_phase: [{name: 'Phase de Ligue', desc: '6 matchs aller simple', icon: '🏟️'},
                {name: 'Barrage (mars)', desc: 'Aller & retour — si 9e-16e', icon: '⚡'},
                {name: '8e de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Quart de finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'Demi-finale', desc: 'Aller & retour', icon: '🟢'},
                {name: 'FINALE', desc: 'Match unique', icon: '🏆'}],
        }
    };
    return (rounds[comp] && rounds[comp][entry]) ? rounds[comp][entry] : [];
}

// ======================================================
//  EUROPEAN COMPETITION STATE & RENDER
// ======================================================
// G.euroState = { ucl: null|{entry,rounds:[{name,desc,icon,result:'win'|'loss'|null}],currentRound}, el:..., uecl:... }

function initEuroState() {
    if (!G.euroState)
        G.euroState = {ucl: null, el: null, uecl: null};
    const lg = LEAGUES[G.leagueKey];
    if (!lg) return;
    let qualifiedByLeague = false;
    if (lg.tier === 1) {
        const sorted = [...G.standings].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return (b.gf - b.ga) - (a.gf - a.ga);
        });
        const myRank = sorted.findIndex(t => t.isMe) + 1;
        const spots = UEFA_EUROPEAN_SPOTS[lg.country] || [];
        ['ucl', 'el', 'uecl'].forEach(comp => {
            const spot = spots.find(s => s.rank === myRank && s.comp === comp);
            if (spot) {
                qualifiedByLeague = true;
                if (!G.euroState[comp]) {
                    const roundDefs = buildEuroRounds(comp, spot.entry);
                    G.euroState[comp] = {entry: spot.entry, rounds: roundDefs.map(r => ({...r, result: null})), currentRound: 0, eliminated: false, winner: false};
                }
            }
        });
    }
    const cupYear = Number(G.cupQualifiesNextSeason);
    if (cupYear && cupYear < (Number(G.seasonYear) || 0)) G.cupQualifiesNextSeason = null;
    else if (cupYear && cupYear === Number(G.seasonYear) && Number(G.matchDay) > 0) {
        if (qualifiedByLeague) G.euroState.uecl = null;
        else if (!G.euroState.uecl) {
            const roundDefs = buildEuroRounds('uecl', 'q1');
            G.euroState.uecl = {entry: 'q1', rounds: roundDefs.map(r => ({...r, result: null})), currentRound: 0, eliminated: false, winner: false};
        }
        G.cupQualifiesNextSeason = null;
    }
}

function getCompLabel(comp) {
    return {ucl: 'Ligue des Champions', el: 'Ligue Europa', uecl: 'Conference League'}[comp] || comp;
}
function getCompEmoji(comp) {
    return {ucl: '⭐', el: '🟠', uecl: '🟢'}[comp] || '🏆';
}
function getCompClass(comp) {
    return {ucl: 'ucl', el: 'el', uecl: 'uecl'}[comp] || '';
}

function renderEurope() {
    const el = document.getElementById('euro-content');
    if (!el)
        return;
    initEuroState();
    const lg = LEAGUES[G.leagueKey];
    if (!lg || (lg.tier !== 1 && !(G.euroState && G.euroState.uecl))) {
        el.innerHTML = `<div class="euro-no-qual"><div class="big">⬆️</div>Monte en D1 pour disputer les compétitions européennes !</div>`;
        return;
    }
    const sorted = [...G.standings].sort((a, b) => {
        if (b.points !== a.points)
            return b.points - a.points;
        return (b.gf - b.ga) - (a.gf - a.ga);
    });
    const myRank = sorted.findIndex(t => t.isMe) + 1;
    const spots = lg.tier === 1 ? (UEFA_EUROPEAN_SPOTS[lg.country] || []).filter(s => s.rank === myRank) : [];
    let html = '';
    if (spots.length === 0 && !(G.euroState && G.euroState.uecl)) {
        // Show what ranks qualify
        const allSpots = UEFA_EUROPEAN_SPOTS[lg.country] || [];
        const maxRank = allSpots.length ? allSpots[allSpots.length - 1].rank : '?';
        html = `<div class="euro-no-qual">
                        <div class="big">😔</div>
                        <div>Tu es ${myRank}e — seuls les ${maxRank} premiers se qualifient en Europe.</div>
                        <div style="margin-top:8px;font-size:12px;">Termine mieux la saison pour disputer des coupes d'Europe !</div>
                    </div>`;
    } else {
        ['ucl', 'el', 'uecl'].forEach(comp => {
            const state = G.euroState && G.euroState[comp];
            if (!state)
                return;
            const compClass = getCompClass(comp);
            const rounds = state.rounds;
            const cur = state.currentRound;
            const elim = state.eliminated;
            const win = state.winner;
            let statusBadge = '';
            if (win)
                statusBadge = `<span class="euro-status-badge qualified">🏆 Vainqueur !</span>`;
            else if (elim)
                statusBadge = `<span class="euro-status-badge eliminated">❌ Éliminé</span>`;
            else
                statusBadge = `<span class="euro-status-badge qualified">✅ Qualifié</span>`;
            html += `<div class="euro-comp-header ${compClass}">
                            <span class="euro-logo">${getCompEmoji(comp)}</span>
                            <div>
                                <div class="euro-comp-name ${compClass}">${getCompLabel(comp)}</div>
                                <div class="euro-comp-sub">Entrée : ${entryLabel(state.entry)}</div>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="euro-rounds-list">`;
            rounds.forEach((r, i) => {
                let cardClass = 'locked', resultHtml = `<span class="euro-round-result tbd">À venir</span>`;
                if (r.result === 'win') {
                    cardClass = 'done';
                    resultHtml = `<span class="euro-round-result win">✓ Qualifié</span>`;
                } else if (r.result === 'loss') {
                    cardClass = 'done';
                    resultHtml = `<span class="euro-round-result loss">✗ Éliminé</span>`;
                } else if (!elim && !win && i === cur) {
                    cardClass = 'active';
                    resultHtml = `<span class="euro-round-result next">▶ Prochain</span>`;
                }
                html += `<div class="euro-round-card ${cardClass}">
                                <span class="euro-round-icon">${r.icon}</span>
                                <div class="euro-round-info">
                                    <div class="euro-round-name">${r.name}</div>
                                    <div class="euro-round-desc">${r.desc}</div>
                                </div>
                                ${resultHtml}
                            </div>`;
            });
            html += `</div>`;
            if (!elim && !win) {
                html += `<button class="euro-play-btn" onclick="playEuroRound('${comp}')">▶ Jouer le ${rounds[cur].name}</button>`;
            }
            html += `<div style="height:24px;"></div>`;
        });
    }
    if (html === '') {
        html = `<div class="euro-no-qual"><div class="big">😔</div>Pas de coupe d'Europe cette saison. Améliore ton classement !</div>`;
    }
    el.innerHTML = html;
}

function entryLabel(entry) {
    return {
        league_phase: 'Phase de Ligue (direct)',
        playoff: 'Barrages d\'accès',
        q3: '3e tour qualificatif',
        q2: '2e tour qualificatif',
        q1: '1er tour qualificatif',
    }[entry] || entry;
}

function playEuroRound(comp) {
    if (!G.euroState || !G.euroState[comp])
        return;
    const state = G.euroState[comp];
    if (state.eliminated || state.winner)
        return;
    const round = state.rounds[state.currentRound];
    // Simulate: final has lower win chance, early quals higher
    const isFinal = round.name === 'FINALE';
    const winChance = isFinal ? 0.40 : round.name.includes('Demi') ? 0.42 : round.name.includes('Quart') ? 0.45 : round.name.includes('Phase de Ligue') ? 0.60 : 0.55;
    const win = Math.random() < winChance;
    state.rounds[state.currentRound].result = win ? 'win' : 'loss';
    if (!win) {
        state.eliminated = true;
        toast(`❌ Éliminé en ${round.name} de ${getCompLabel(comp)} !`, 'error');
    } else {
        state.currentRound++;
        if (state.currentRound >= state.rounds.length) {
            state.winner = true;
            toast(`🏆 Tu as remporté la ${getCompLabel(comp)} !!!`, 'success');
        } else {
            toast(`✅ Qualifié pour ${state.rounds[state.currentRound].name} !`, 'success');
        }
    }
    renderEurope();
}

// ======================================================
//  CALENDRIER
// ======================================================
// Months for the season Aug–May
const CAL_MONTHS = [
    {key: 'aug', label: 'Août', idx: 7},
    {key: 'sep', label: 'Septembre', idx: 8},
    {key: 'oct', label: 'Octobre', idx: 9},
    {key: 'nov', label: 'Novembre', idx: 10},
    {key: 'dec', label: 'Décembre', idx: 11},
    {key: 'jan', label: 'Janvier', idx: 0},
    {key: 'feb', label: 'Février', idx: 1},
    {key: 'mar', label: 'Mars', idx: 2},
    {key: 'apr', label: 'Avril', idx: 3},
    {key: 'may', label: 'Mai', idx: 4}
];
const DOW = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
// Get or build the season calendar (stored in G.calendar)
function buildSeasonCalendar() {
    if (!G)
        return [];
    const matches = [];
    const leagueName = (LEAGUES[G.leagueKey] || {}).name || 'Championnat';
    const leagueFlag = (LEAGUES[G.leagueKey] || {}).flag || '🏆';
    const leagueTotal = G.seasonLength || 38;
    const opponents = (LEAGUES[G.leagueKey] || {}).clubs || [];
    // ---- 1. CHAMPIONNAT ----
    // Distribute league matches across the season (Aug–Apr)
    const leagueMonthSeq = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8]; // month index into CAL_MONTHS
    const leagueDays = [6, 13, 20, 5, 12, 19, 3, 10, 17, 24, 7, 14, 21, 5, 12, 19, 9, 16, 23, 6, 13, 20, 10, 17, 24, 8, 15, 22, 5, 12, 19, 3, 10, 17];
    let oppPool = opponents.filter(c => c.name !== G.clubName);
    // shuffle pool to get random opponents
    for (let i = oppPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [oppPool[i], oppPool[j]] = [oppPool[j], oppPool[i]];
    }
    // Extend pool if needed
    while (oppPool.length < leagueTotal)
        oppPool = [...oppPool, ...oppPool];
    for (let md = 1; md <= leagueTotal; md++) {
        const seqIdx = md - 1;
        const monthObj = CAL_MONTHS[Math.min(seqIdx < 9 ? 0 : seqIdx < 18 ? Math.floor(seqIdx / 3) : Math.floor(seqIdx / 3), 9)];
        // Better distribution: ~3-4 per month
        const monthIdx2 = Math.min(Math.floor((md - 1) / (leagueTotal / 9)), 8);
        const mObj = CAL_MONTHS[monthIdx2];
        const dayOfMonth = 3 + ((md - 1) % 4) * 7 + Math.floor(Math.random() * 3);
        const dt = new Date(2025, mObj.idx, Math.min(dayOfMonth, 28));
        const opp = oppPool[(md - 1) % oppPool.length];
        const isHome = md % 2 === 1;
        matches.push({
            id: 'league_' + md,
            comp: 'league',
            compLabel: leagueFlag + ' ' + leagueName,
            compIcon: '🏟️',
            matchDay: md,
            date: dt,
            home: isHome ? G.clubName : opp.name,
            homeEmoji: isHome ? G.clubEmoji : opp.emoji,
            away: isHome ? opp.name : G.clubName,
            awayEmoji: isHome ? opp.emoji : G.clubEmoji,
            isMyMatch: true
        });
    }

    // ---- 2. COUPE NATIONALE ----
    const cupName = getCupName(G.leagueKey);
    const cupRounds = [
        {name: '32es de finale', month: 1, day: 8},
        {name: '16es de finale', month: 2, day: 5},
        {name: 'Quarts de finale', month: 4, day: 9},
        {name: 'Demi-finales', month: 5, day: 13},
        {name: 'FINALE', month: 7, day: 25},
    ];
    const cupOppPool = opponents.filter(c => c.name !== G.clubName);
    cupRounds.forEach((r, i) => {
        const mObj = CAL_MONTHS[r.month];
        const dt = new Date(2025, mObj.idx, r.day);
        // For cup, generate a random opponent at season start (or use stored cup state)
        const cupOpp = cupOppPool[i % cupOppPool.length] || {name: 'Adversaire Coupe', emoji: '🏆'};
        matches.push({
            id: 'cup_' + i,
            comp: 'cup',
            compLabel: '🏆 ' + cupName,
            compIcon: '🏆',
            roundName: r.name,
            date: dt,
            home: i % 2 === 0 ? G.clubName : cupOpp.name,
            homeEmoji: i % 2 === 0 ? G.clubEmoji : cupOpp.emoji,
            away: i % 2 === 0 ? cupOpp.name : G.clubName,
            awayEmoji: i % 2 === 0 ? cupOpp.emoji : G.clubEmoji,
            isMyMatch: true
        });
    });
    // ---- 3. COMPÉTITIONS EUROPÉENNES ----
    if (G.euroState) {
        ['ucl', 'el', 'uecl'].forEach(comp => {
            const state = G.euroState[comp];
            if (!state || !state.rounds)
                return;
            const euroMonths = [0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const euroDays = [24, 17, 24, 21, 18, 25, 6, 13, 10, 17, 8];
            state.rounds.forEach((r, i) => {
                const mIdx = Math.min(i, CAL_MONTHS.length - 1);
                const mObj = CAL_MONTHS[mIdx];
                const day = Math.min(euroDays[i] || 15, 28);
                const dt = new Date(2025, mObj.idx, day);
                matches.push({
                    id: comp + '_' + i,
                    comp: comp,
                    compLabel: getCompEmoji(comp) + ' ' + getCompLabel(comp),
                    compIcon: getCompEmoji(comp),
                    roundName: r.name,
                    date: dt,
                    home: i % 2 === 0 ? G.clubName : '(Adversaire)',
                    homeEmoji: i % 2 === 0 ? G.clubEmoji : '🆚',
                    away: i % 2 === 0 ? '(Adversaire)' : G.clubName,
                    awayEmoji: i % 2 === 0 ? '🆚' : G.clubEmoji,
                    euroRoundIdx: i,
                    euroResult: r.result || null,
                    isMyMatch: true
                });
            });
        });
    }

    // Sort by date
    matches.sort((a, b) => a.date - b.date);
    return matches;
}

function getCupName(leagueKey) {
    const cupNames = {
        pl: 'FA Cup', championship: 'FA Cup',
        ligue1: 'Coupe de France', ligue2: 'Coupe de France',
        bl: 'DFB-Pokal', bl2: 'DFB-Pokal',
        seria: 'Coppa Italia', serib: 'Coppa Italia',
        liga: 'Copa del Rey', liga2: 'Copa del Rey',
        eredivisie_nl: 'KNVB Beker',
        jupiler_be: 'Croky Cup',
        superlig_tr: 'Türkiye Kupası',
        liga_pt: 'Taça de Portugal',
        premiership_sc: 'Scottish Cup',
        superleague_gr: 'Coupe de Grèce',
        bundesliga_at: 'ÖFB-Cup',
        superleague_ch: 'Coupe de Suisse',
    };
    return cupNames[leagueKey] || 'Coupe Nationale';
}

// Enricher les matchs de championnat avec les résultats réels
function enrichLeagueResults(matches) {
    if (!G || !G.results)
        return;
    let leagueIdx = 0;
    matches.forEach(m => {
        if (m.comp !== 'league')
            return;
        const md = m.matchDay;
        if (md <= G.matchDay && G.results[md - 1]) {
            m.result = G.results[md - 1]; // 'W', 'D', 'L'
            // Generate plausible score
            const r = m.result;
            if (r === 'W') {
                m.scoreHome = G.clubName === m.home ? rand(1, 4) : rand(0, 1);
                m.scoreAway = G.clubName === m.away ? rand(1, 4) : rand(0, 1);
                if (G.clubName === m.home && m.scoreHome <= m.scoreAway)
                    m.scoreHome = m.scoreAway + 1;
                if (G.clubName === m.away && m.scoreAway <= m.scoreHome)
                    m.scoreAway = m.scoreHome + 1;
            } else if (r === 'D') {
                const s = rand(0, 2);
                m.scoreHome = s;
                m.scoreAway = s;
            } else {
                m.scoreHome = G.clubName === m.home ? rand(0, 1) : rand(1, 3);
                m.scoreAway = G.clubName === m.away ? rand(0, 1) : rand(1, 3);
                if (G.clubName === m.home && m.scoreHome >= m.scoreAway)
                    m.scoreAway = m.scoreHome + 1;
                if (G.clubName === m.away && m.scoreAway >= m.scoreHome)
                    m.scoreHome = m.scoreAway + 1;
            }
            m.played = true;
        }
    });
}

let calFilter = 'all';
let _calMatches = null;
function renderCalendrier() {
    const el = document.getElementById('cal-content');
    if (!el || !G)
        return;
    // Rebuild calendar if season changed
    if (!G._calendar) {
        G._calendar = buildSeasonCalendar();
    }
    _calMatches = G._calendar;
    enrichLeagueResults(_calMatches);
    // Find next match index (first unplayed league match)
    let nextMatchId = null;
    for (const m of _calMatches) {
        if (m.comp === 'league' && !m.played && m.matchDay === G.matchDay + 1) {
            nextMatchId = m.id;
            break;
        }
    }

    // Stats bar
    const totalPlayed = _calMatches.filter(m => m.played).length;
    const totalWins = _calMatches.filter(m => m.played && m.result === 'W').length;
    const totalDraws = _calMatches.filter(m => m.played && m.result === 'D').length;
    const totalLosses = _calMatches.filter(m => m.played && m.result === 'L').length;
    const totalRemaining = _calMatches.filter(m => !m.played).length;
    // Filter buttons
    const filters = [
        {key: 'all', label: '📋 Tous'},
        {key: 'league', label: '🏟️ Championnat'},
        {key: 'cup', label: '🏆 Coupe'},
        {key: 'euro', label: '🌍 Europe'},
        {key: 'played', label: '✅ Joués'},
        {key: 'upcoming', label: '⏳ À venir'},
    ];
    let filtered = _calMatches;
    if (calFilter === 'league')
        filtered = _calMatches.filter(m => m.comp === 'league');
    else if (calFilter === 'cup')
        filtered = _calMatches.filter(m => m.comp === 'cup');
    else if (calFilter === 'euro')
        filtered = _calMatches.filter(m => ['ucl', 'el', 'uecl'].includes(m.comp));
    else if (calFilter === 'played')
        filtered = _calMatches.filter(m => m.played || m.euroResult);
    else if (calFilter === 'upcoming')
        filtered = _calMatches.filter(m => !m.played && !m.euroResult);
    // Group by month
    const grouped = {};
    const monthOrder = [];
    filtered.forEach(m => {
        const mo = m.date.getMonth();
        const yr = m.date.getFullYear();
        const key = yr + '_' + mo;
        if (!grouped[key]) {
            grouped[key] = [];
            monthOrder.push(key);
        }
        grouped[key].push(m);
    });
    let html = `
                <div class="section-title">📅 Calendrier de la saison</div>
                <div class="cal-summary-bar">
                    <div class="cal-stat-pill">
                        <div class="cal-stat-num" style="color:var(--accent2)">${totalPlayed}</div>
                        <div class="cal-stat-lbl">Joués</div>
                    </div>
                    <div class="cal-stat-pill">
                        <div class="cal-stat-num" style="color:var(--accent)">${totalWins}</div>
                        <div class="cal-stat-lbl">Victoires</div>
                    </div>
                    <div class="cal-stat-pill">
                        <div class="cal-stat-num" style="color:var(--gold)">${totalDraws}</div>
                        <div class="cal-stat-lbl">Nuls</div>
                    </div>
                    <div class="cal-stat-pill">
                        <div class="cal-stat-num" style="color:var(--danger)">${totalLosses}</div>
                        <div class="cal-stat-lbl">Défaites</div>
                    </div>
                    <div class="cal-stat-pill">
                        <div class="cal-stat-num" style="color:var(--muted)">${totalRemaining}</div>
                        <div class="cal-stat-lbl">À venir</div>
                    </div>
                </div>
                <div class="cal-filters">
                    ${filters.map(f => `<button class="cal-filter-btn ${calFilter === f.key ? 'active' : ''}" onclick="setCalFilter('${f.key}')">${f.label}</button>`).join('')}
                </div>`;
    if (filtered.length === 0) {
        html += `<div class="cal-empty">Aucun match dans cette catégorie pour le moment.</div>`;
    } else {
        monthOrder.forEach(key => {
            const monthMatches = grouped[key];
            const [yr, mo] = key.split('_').map(Number);
            const monthName = CAL_MONTHS.find(m => m.idx === mo)?.label || ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'][mo];
            const yearStr = yr !== 2025 ? ' ' + yr : '';
            html += `<div class="cal-month-group">
                            <div class="cal-month-label">${monthName}${yearStr} <span style="font-size:11px;color:var(--muted);font-weight:400;letter-spacing:0;">(${monthMatches.length} match${monthMatches.length > 1 ? 's' : ''})</span></div>`;
            monthMatches.forEach(m => {
                const isNext = m.id === nextMatchId;
                const dow = DOW[m.date.getDay()];
                const dayNum = m.date.getDate();
                const isEuro = ['ucl', 'el', 'uecl'].includes(m.comp);
                const matchLabel = m.comp === 'league'
                        ? `J${m.matchDay} — ${m.compLabel}`
                        : m.comp === 'cup'
                        ? `${m.compLabel} · ${m.roundName}`
                        : `${m.compLabel} · ${m.roundName || ''}`;
                // Determine result display
                let rowClass = '';
                let scoreHtml = '';
                if (isEuro) {
                    // Euro matches use euroResult
                    const er = m.euroResult;
                    if (er === 'win') {
                        rowClass = 'win';
                        scoreHtml = `<div class="cal-score-val win">✓</div><div class="cal-result-badge win">Qualifié</div>`;
                    } else if (er === 'loss') {
                        rowClass = 'loss';
                        scoreHtml = `<div class="cal-score-val loss">✗</div><div class="cal-result-badge loss">Éliminé</div>`;
                    } else {
                        scoreHtml = `<div class="cal-score-val upcoming">${isNext ? '▶ PROCHAIN' : 'À VENIR'}</div>`;
                        if (isNext)
                            rowClass = 'next-match';
                    }
                } else if (m.played) {
                    const sc = `${m.scoreHome}–${m.scoreAway}`;
                    const r = m.result;
                    rowClass = r === 'W' ? 'win' : r === 'D' ? 'draw' : 'loss';
                    const resLabel = r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite';
                    scoreHtml = `<div class="cal-score-val ${rowClass}">${sc}</div><div class="cal-result-badge ${rowClass}">${resLabel}</div>`;
                } else {
                    if (isNext) {
                        rowClass = 'next-match';
                        scoreHtml = `<div class="cal-score-val upcoming" style="color:var(--gold);">▶ PROCHAIN</div><div class="cal-next-label">Prochain match</div>`;
                    } else {
                        scoreHtml = `<div class="cal-score-val upcoming">– : –</div>`;
                    }
                }

                html += `<div class="cal-match-row ${m.played || m.euroResult ? 'played' : ''} ${rowClass}">
                                <div class="cal-date-col">
                                    <div class="cal-date-day">${dayNum}</div>
                                    <div class="cal-date-dow">${dow}</div>
                                </div>
                                <div class="cal-comp-badge">${m.compIcon}</div>
                                <div class="cal-match-info">
                                    <div class="cal-match-teams">${crest(m.home, m.homeEmoji, 18)} ${m.home} <span style="color:var(--muted);font-weight:400;">vs</span> ${crest(m.away, m.awayEmoji, 18)} ${m.away}</div>
                                    <div class="cal-match-comp">${matchLabel}</div>
                                </div>
                                <div class="cal-match-score">${scoreHtml}</div>
                            </div>`;
            });
            html += `</div>`;
        });
    }

    el.innerHTML = html;
}

function setCalFilter(f) {
    calFilter = f;
    renderCalendrier();
}

// ======================================================
//  UPDATED STANDINGS RENDER (with euro zones)
// ======================================================
function renderStandings() {
    // Update my league title
    const titleEl = document.getElementById('standings-my-title');
    if (titleEl && G)
        titleEl.textContent = 'Classement — ' + (LEAGUES[G.leagueKey] || {}).flag + ' ' + (LEAGUES[G.leagueKey] || {}).name;
    // If world tab is active, re-render that instead
    if (_standingsTab === 'world') {
        renderWorldStandings();
        return;
    }
    const sorted = [...G.standings].sort((a, b) => {
        if (b.points !== a.points)
            return b.points - a.points;
        return (b.gf - b.ga) - (a.gf - a.ga);
    });
    const lg = LEAGUES[G.leagueKey];
    const total = sorted.length;
    const promSpots = lg.promotionSpots || 0;
    const playoffSpots = lg.playoffSpots || 0;
    const relSpots = lg.relegationSpots || 3;
    const isD1 = lg.tier === 1;
    // Build legend dynamically
    const legendEl = document.getElementById('standings-legend');
    if (legendEl) {
        if (isD1) {
            const country = lg.country;
            const spots = UEFA_EUROPEAN_SPOTS[country] || [];
            let legendItems = '';
            const seen = new Set();
            spots.forEach(s => {
                const key = s.comp + '-' + (s.entry === 'league_phase' || s.entry === 'playoff' ? 'lp' : 'q');
                if (!seen.has(key)) {
                    seen.add(key);
                    const isLP = s.entry === 'league_phase' || s.entry === 'playoff';
                    let dotClass, label;
                    if (s.comp === 'ucl') {
                        dotClass = isLP ? 'zone-ucl' : 'zone-ucl-q';
                        label = isLP ? 'UCL (phase de ligue)' : 'UCL (qualif.)';
                    } else if (s.comp === 'el') {
                        dotClass = isLP ? 'zone-el' : 'zone-el-q';
                        label = isLP ? 'Ligue Europa' : 'Europa (qualif.)';
                    } else {
                        dotClass = isLP ? 'zone-uecl' : 'zone-uecl-q';
                        label = isLP ? 'Conference League' : 'Conference (qualif.)';
                    }
                    legendItems += `<div class="legend-item"><span class="zone-dot ${dotClass}"></span> ${label}</div>`;
                }
            });
            legendEl.innerHTML = legendItems + `<div class="legend-item"><span class="zone-dot zone-rel"></span> Relégation</div>`;
        } else {
            legendEl.innerHTML = `<div class="legend-item"><span class="zone-dot zone-prom"></span> Promotion</div>
                            <div class="legend-item"><span class="zone-dot zone-cl"></span> Playoffs promotion</div>
                            <div class="legend-item"><span class="zone-dot zone-rel"></span> Relégation</div>`;
        }
    }

    document.getElementById("standings-body").innerHTML = sorted.map((t, i) => {
        const diff = t.gf - t.ga;
        const diffStr = diff > 0 ? "+" + diff : String(diff);
        let zone = "";
        const rank = i + 1;
        if (isD1) {
            const dotClass = getEuroZoneDot(G.leagueKey, rank);
            if (dotClass)
                zone = `<span class="zone-dot ${dotClass}"></span>`;
            else if (rank > total - relSpots)
                zone = `<span class="zone-dot zone-rel" title="Relégation"></span>`;
        } else {
            if (promSpots > 0 && i < promSpots) {
                zone = `<span class="zone-dot zone-prom" title="Promotion directe"></span>`;
            } else if (playoffSpots > 0 && i < promSpots + playoffSpots) {
                zone = `<span class="zone-dot zone-cl" title="Playoffs promotion"></span>`;
            } else if (i >= total - relSpots) {
                zone = `<span class="zone-dot zone-rel" title="Relégation"></span>`;
            }
        }
        return `
              <tr class="${t.isMe ? "my-team" : ""}">
                <td>${rank}</td>
                <td>${zone}${crest(t.name, t.emoji, 16)} ${t.name}</td>
                <td>${t.played}</td>
                <td>${t.won}</td>
                <td>${t.drawn}</td>
                <td>${t.lost}</td>
                <td>${t.gf}</td>
                <td>${t.ga}</td>
                <td style="color:${diff > 0 ? "var(--accent)" : diff < 0 ? "var(--danger)" : "var(--muted)"}">${diffStr}</td>
                <td><strong>${t.points}</strong></td>
              </tr>`;
    }).join("");
}

// ======================================================
//  STANDINGS SUB-TABS & WORLD LEAGUES
// ======================================================
let _standingsTab = 'my';

function switchStandingsTab(tab) {
    _standingsTab = tab;
    document.getElementById('stab-my').classList.toggle('active', tab === 'my');
    document.getElementById('stab-world').classList.toggle('active', tab === 'world');
    document.getElementById('standings-my-panel').style.display = tab === 'my' ? '' : 'none';
    document.getElementById('standings-world-panel').style.display = tab === 'world' ? '' : 'none';
    if (tab === 'world')
        renderWorldStandings();
}

// ---- World standings simulation ----
// We maintain G.worldStandings = { leagueKey: [{name, emoji, played, won, drawn, lost, gf, ga, points}, ...] }
// Simulated lazily (generated once, then updated each time the player plays a match)

function getWorldStandings() {
    if (!G.worldStandings)
        G.worldStandings = {};
    return G.worldStandings;
}

function ensureWorldLeague(leagueKey) {
    const ws = getWorldStandings();
    const currentYear = Number(G.seasonYear) || 2025;
    if (!ws[leagueKey] || Number(ws[leagueKey].seasonYear) !== currentYear) {
        // Generate a fresh standings for this league
        const clubs = getLeagueClubs(leagueKey);
        ws[leagueKey] = {
            seasonYear: currentYear,
            matchDay: 0,
            table: clubs.map(c => ({
                    name: c.name, emoji: c.emoji,
                    played: 0, won: 0, drawn: 0, lost: 0,
                    gf: 0, ga: 0, points: 0
                }))
        };
    }
    return ws[leagueKey];
}

// Call this each time the player plays a match to simulate other leagues progressing
function simulateWorldMatchday() {
    if (window.AIWorld) {
        const leagueLengths = Object.fromEntries(Object.keys(LEAGUES).map(key => [key, getSeasonLength(key)]));
        const progress = AIWorld.advanceWorld(
            G,
            LEAGUES,
            G.leagueKey,
            G.matchDay,
            G.seasonLength || getSeasonLength(G.leagueKey),
            leagueLengths
        );
        Object.keys(progress.leagues).forEach(key => {
            const state = progress.leagues[key];
            const clubs = getLeagueClubs(key);
            const table = clubs.map(entry => {
                const ai = AIWorld.getClub(G, LEAGUES, entry, key);
                const s = ai && ai.season || {};
                return {
                    name: entry.name, emoji: entry.emoji || ai && ai.emoji || '⚽', aiId: ai && ai.id,
                    played: s.played || 0, won: s.wins || 0, drawn: s.draws || 0, lost: s.losses || 0,
                    gf: s.gf || 0, ga: s.ga || 0, points: s.points || 0
                };
            }).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
            const world = ensureWorldLeague(key);
            world.matchDay = state.matchDay;
            world.table = table;
        });
        return;
    }
    if (!G.worldStandings) return;
    Object.keys(G.worldStandings).forEach(leagueKey => {
        if (leagueKey === G.leagueKey)
            return; // not our own league
        const ld = G.worldStandings[leagueKey];
        const seasonLen = getSeasonLength(leagueKey);
        // Simulate until caught up with player's matchday
        while (ld.matchDay < Math.min(targetMatchday, seasonLen)) {
            // Simulate one matchday: all teams play once (paired)
            const t = ld.table;
            // Sort to pair similar-strength teams
            for (let i = 0; i < t.length - 1; i += 2) {
                const a = t[i], b = t[i + 1];
                // Rough strength from table position (index 0 = strongest)
                const aStr = 80 - i * (30 / Math.max(1, t.length));
                const bStr = 80 - (i + 1) * (30 / Math.max(1, t.length));
                const diff = (aStr - bStr) / 60;
                const winP = Math.max(0.2, Math.min(0.7, 0.43 + diff));
                const r = Math.random();
                if (r < winP) {
                    // home win
                    a.won++;
                    a.points += 3;
                    a.gf += rand(1, 3);
                    a.ga += rand(0, 1);
                    b.lost++;
                    b.gf += rand(0, 1);
                    b.ga += rand(1, 3);
                } else if (r < winP + 0.24) {
                    // draw
                    const g = rand(0, 2);
                    a.drawn++;
                    b.drawn++;
                    a.points++;
                    b.points++;
                    a.gf += g;
                    a.ga += g;
                    b.gf += g;
                    b.ga += g;
                } else {
                    // away win
                    b.won++;
                    b.points += 3;
                    b.gf += rand(1, 3);
                    b.ga += rand(0, 1);
                    a.lost++;
                    a.gf += rand(0, 1);
                    a.ga += b.gf - b.ga + rand(0, 1);
                }
                a.played++;
                b.played++;
            }
            // Odd team out (if any): give them a bye with random result vs ghost
            if (t.length % 2 === 1) {
                const a = t[t.length - 1];
                const r2 = Math.random();
                if (r2 < 0.42) {
                    a.won++;
                    a.points += 3;
                    a.gf++;
                } else if (r2 < 0.65) {
                    a.drawn++;
                    a.points++;
                } else {
                    a.lost++;
                    a.ga++;
                }
                a.played++;
            }
            ld.matchDay++;
        }
    });
}

// Group all leagues by country for display
const LEAGUE_COUNTRY_GROUPS = (() => {
    const countryNames = {
        england: {label: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
        france: {label: 'France', flag: '🇫🇷'},
        germany: {label: 'Allemagne', flag: '🇩🇪'},
        italy: {label: 'Italie', flag: '🇮🇹'},
        spain: {label: 'Espagne', flag: '🇪🇸'},
        netherlands: {label: 'Pays-Bas', flag: '🇳🇱'},
        belgium: {label: 'Belgique', flag: '🇧🇪'},
        turkey: {label: 'Turquie', flag: '🇹🇷'},
        portugal: {label: 'Portugal', flag: '🇵🇹'},
        scotland: {label: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'},
        greece: {label: 'Grèce', flag: '🇬🇷'},
        austria: {label: 'Autriche', flag: '🇦🇹'},
        switzerland: {label: 'Suisse', flag: '🇨🇭'},
        denmark: {label: 'Danemark', flag: '🇩🇰'},
        norway: {label: 'Norvège', flag: '🇳🇴'},
        sweden: {label: 'Suède', flag: '🇸🇪'},
        poland: {label: 'Pologne', flag: '🇵🇱'},
        croatia: {label: 'Croatie', flag: '🇭🇷'},
        ukraine: {label: 'Ukraine', flag: '🇺🇦'},
        serbia: {label: 'Serbie', flag: '🇷🇸'},
        romania: {label: 'Roumanie', flag: '🇷🇴'},
        czechrepublic: {label: 'Rép. Tchèque', flag: '🇨🇿'},
        israel: {label: 'Israël', flag: '🇮🇱'},
        cyprus: {label: 'Chypre', flag: '🇨🇾'},
        hungary: {label: 'Hongrie', flag: '🇭🇺'},
        bulgaria: {label: 'Bulgarie', flag: '🇧🇬'},
        slovakia: {label: 'Slovaquie', flag: '🇸🇰'},
        azerbaijan: {label: 'Azerbaïdjan', flag: '🇦🇿'},
        slovenia: {label: 'Slovénie', flag: '🇸🇮'},
        ireland: {label: 'Irlande', flag: '🇮🇪'},
        finland: {label: 'Finlande', flag: '🇫🇮'},
        iceland: {label: 'Islande', flag: '🇮🇸'},
        albania: {label: 'Albanie', flag: '🇦🇱'},
        luxembourg: {label: 'Luxembourg', flag: '🇱🇺'},
        andorra: {label: 'Andorre', flag: '🇦🇩'},
        gibraltar: {label: 'Gibraltar', flag: '🇬🇮'},
        sanmarino: {label: 'Saint-Marin', flag: '🇸🇲'},
        wales: {label: 'Pays de Galles', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿'},
        northernireland: {label: 'Irlande du Nord', flag: '🇬🇧'},
        bosnia: {label: 'Bosnie-Herzégovine', flag: '🇧🇦'},
        northmacedonia: {label: 'Macédoine du Nord', flag: '🇲🇰'},
        montenegro: {label: 'Monténégro', flag: '🇲🇪'},
        georgia: {label: 'Géorgie', flag: '🇬🇪'},
        armenia: {label: 'Arménie', flag: '🇦🇲'},
        kazakhstan: {label: 'Kazakhstan', flag: '🇰🇿'},
        moldova: {label: 'Moldavie', flag: '🇲🇩'},
        belarus: {label: 'Biélorussie', flag: '🇧🇾'},
        estonia: {label: 'Estonie', flag: '🇪🇪'},
        latvia: {label: 'Lettonie', flag: '🇱🇻'},
        lithuania: {label: 'Lituanie', flag: '🇱🇹'},
        faroe: {label: 'Îles Féroé', flag: '🇫🇴'},
        malta: {label: 'Malte', flag: '🇲🇹'},
        kosovo: {label: 'Kosovo', flag: '🇽🇰'},
    };
    // Map leagueKey → country
    const leagueCountry = {
        pl: 'england', championship: 'england',
        ligue1: 'france', ligue2: 'france',
        bl: 'germany', bl2: 'germany',
        seria: 'italy', serib: 'italy',
        liga: 'spain', liga2: 'spain',
        eredivisie_nl: 'netherlands',
        jupiler_be: 'belgium',
        superlig_tr: 'turkey',
        liga_pt: 'portugal',
        premiership_sc: 'scotland',
        superleague_gr: 'greece',
        bundesliga_at: 'austria',
        superleague_ch: 'switzerland',
        superliga_dk: 'denmark',
        eliteserien_no: 'norway',
        allsvenskan_se: 'sweden',
        ekstraklasa_pl: 'poland',
        hnl_hr: 'croatia',
        liha_ua: 'ukraine',
        superliga_rs: 'serbia',
        superliga_ro: 'romania',
        chance_liga_cz: 'czechrepublic',
        ligat_haal_il: 'israel',
        cyta_cy: 'cyprus',
        otp_liga_hu: 'hungary',
        efbet_liga_bg: 'bulgaria',
        nike_liga_sk: 'slovakia',
        premyer_az: 'azerbaijan',
        prvaliga_si: 'slovenia',
        sse_ie: 'ireland',
        veikkausliiga_fi: 'finland',
        urvalsdeild_is: 'iceland',
        superiore_al: 'albania',
        bgl_lu: 'luxembourg',
        primera_ad: 'andorra',
        gfl_gi: 'gibraltar',
        campionato_sm: 'sanmarino',
        cymru_prem_wls: 'wales',
        nifl_nir: 'northernireland',
        premijer_ba: 'bosnia',
        '1mfl_mk': 'northmacedonia',
        '1cfl_me': 'montenegro',
        crystalbet_ge: 'georgia',
        premier_am: 'armenia',
        premier_kz: 'kazakhstan',
        super_liga_md: 'moldova',
        vysheyshaya_by: 'belarus',
        premium_liiga_ee: 'estonia',
        virsliga_lv: 'latvia',
        alyga_lt: 'lithuania',
        betrideildin_fo: 'faroe',
        premier_mt: 'malta',
        superliga_xk: 'kosovo',
    };
    // Build groups
    const groups = {};
    Object.keys(LEAGUES).forEach(key => {
        const country = leagueCountry[key] || 'other';
        if (!groups[country])
            groups[country] = {
                label: (countryNames[country] || {label: country, flag: '🌍'}).label,
                flag: countryFlag(country, (countryNames[country] || {flag: '🌍'}).flag, 18),
                leagues: []
            };
        groups[country].leagues.push(key);
    });
    return groups;
})();

let _worldExpandedCountries = new Set();
let _worldExpandedLeagues = new Set();
let _worldSearchQuery = '';

function filterWorldStandings() {
    _worldSearchQuery = document.getElementById('world-league-search').value.toLowerCase();
    renderWorldStandings();
}

function toggleWorldCountry(country) {
    if (_worldExpandedCountries.has(country))
        _worldExpandedCountries.delete(country);
    else
        _worldExpandedCountries.add(country);
    renderWorldStandings();
}

function toggleWorldLeague(key) {
    if (_worldExpandedLeagues.has(key))
        _worldExpandedLeagues.delete(key);
    else {
        _worldExpandedLeagues.add(key);
        ensureWorldLeague(key);
        simulateWorldLeagueTo(key);
    }
    renderWorldStandings();
}

function simulateWorldLeagueTo(leagueKey) {
    const targetMatchday = G ? G.matchDay : 0;
    const ld = getWorldStandings()[leagueKey];
    if (!ld)
        return;
    const seasonLen = getSeasonLength(leagueKey);
    while (ld.matchDay < Math.min(targetMatchday, seasonLen)) {
        const t = ld.table;
        for (let i = 0; i < t.length - 1; i += 2) {
            const a = t[i], b = t[i + 1];
            const r = Math.random();
            if (r < 0.42) {
                a.won++;
                a.points += 3;
                a.gf += rand(1, 3);
                a.ga += rand(0, 1);
                b.lost++;
                b.ga += rand(1, 2);
            } else if (r < 0.65) {
                const g = rand(0, 2);
                a.drawn++;
                b.drawn++;
                a.points++;
                b.points++;
                a.gf += g;
                a.ga += g;
                b.gf += g;
                b.ga += g;
            } else {
                b.won++;
                b.points += 3;
                b.gf += rand(1, 3);
                b.ga += rand(0, 1);
                a.lost++;
                a.ga += rand(1, 2);
            }
            a.played++;
            b.played++;
        }
        ld.matchDay++;
    }
}

function renderWorldStandings() {
    const container = document.getElementById('world-standings-countries');
    const q = _worldSearchQuery;
    let html = '';

    const sortedCountries = Object.keys(LEAGUE_COUNTRY_GROUPS).sort((a, b) =>
        LEAGUE_COUNTRY_GROUPS[a].label.localeCompare(LEAGUE_COUNTRY_GROUPS[b].label));

    sortedCountries.forEach(country => {
        const cg = LEAGUE_COUNTRY_GROUPS[country];
        // Filter by search
        const matchingLeagues = cg.leagues.filter(key => {
            const lg = LEAGUES[key];
            if (!q)
                return true;
            if (cg.label.toLowerCase().includes(q))
                return true;
            if (lg.name.toLowerCase().includes(q))
                return true;
            // Check club names
            return lg.clubs.some(c => c.name.toLowerCase().includes(q));
        });
        if (matchingLeagues.length === 0)
            return;

        const isOpen = _worldExpandedCountries.has(country) || !!q;
        html += `<div class="world-country-section">
                        <div class="world-country-header" onclick="toggleWorldCountry('${country}')">
                            <span class="world-country-flag">${cg.flag}</span>
                            <span class="world-country-name">${cg.label}</span>
                            <span style="font-size:11px;color:var(--muted);">${matchingLeagues.length} ligue${matchingLeagues.length > 1 ? 's' : ''}</span>
                            <span class="world-country-arrow ${isOpen ? 'open' : ''}">▼</span>
                        </div>
                        <div class="world-leagues-list ${isOpen ? 'open' : ''}">`;

        matchingLeagues.forEach(key => {
            const lg = LEAGUES[key];
            const isMyLeague = G && key === G.leagueKey;
            const isLeagueOpen = _worldExpandedLeagues.has(key);
            const ws = G && G.worldStandings && G.worldStandings[key];
            const md = ws ? ws.matchDay : 0;
            const seasonLen = getSeasonLength(key);

            let leaderBadge = '';
            let tableHtml = '';

            if (isLeagueOpen) {
                // Use own league's standings if it's my league
                let tableData;
                if (isMyLeague && G) {
                    tableData = [...G.standings].sort((a, b) => (b.points - a.points) || ((b.gf - b.ga) - (a.gf - a.ga)));
                } else if (ws) {
                    tableData = [...ws.table].sort((a, b) => (b.points - a.points) || ((b.gf - b.ga) - (a.gf - a.ga)));
                }
                if (tableData && tableData.length > 0) {
                    const leader = tableData[0];
                    const relSpots = lg.relegationSpots || 3;
                    const promSpots = lg.promotionSpots || 0;
                    const total = tableData.length;
                    tableHtml = `<div class="world-league-table-wrap open">
                                    <table class="world-mini-table">
                                        <thead><tr><th>#</th><th>Club</th><th>MJ</th><th>V</th><th>N</th><th>D</th><th>+/-</th><th>Pts</th></tr></thead>
                                        <tbody>`;
                    tableData.forEach((t, i) => {
                        const diff = t.gf - t.ga;
                        const diffStr = diff > 0 ? '+' + diff : String(diff);
                        let zoneDot = '';
                        if (i < promSpots)
                            zoneDot = `<span class="zone-dot zone-prom" title="Promotion"></span>`;
                        else if (i >= total - relSpots)
                            zoneDot = `<span class="zone-dot zone-rel" title="Relégation"></span>`;
                        const isMe = isMyLeague && t.isMe;
                        tableHtml += `<tr style="${isMe ? 'background:rgba(0,224,84,0.06);' : ''}">
                                        <td style="${i === 0 ? 'color:var(--gold);font-weight:700;' : ''}">${i + 1}</td>
                                        <td>${zoneDot}${crest(t.name, t.emoji, 18)} <span style="${isMe ? 'color:var(--accent);font-weight:700;' : ''}">${t.name}</span></td>
                                        <td>${t.played}</td><td>${t.won}</td><td>${t.drawn}</td><td>${t.lost}</td>
                                        <td style="color:${diff > 0 ? 'var(--accent)' : diff < 0 ? 'var(--danger)' : 'var(--muted)'}">${diffStr}</td>
                                        <td><strong>${t.points}</strong></td>
                                    </tr>`;
                    });
                    tableHtml += `</tbody></table></div>`;
                    leaderBadge = `<span class="world-leader-badge">🥇 ${crest(leader.name, leader.emoji, 16)} ${leader.name.split(' ').slice(-1)[0]}</span>`;
                }
            }

            const mdLabel = isMyLeague && G ? `J${G.matchDay}/${seasonLen}` : (ws ? `J${md}/${seasonLen}` : `J0/${seasonLen}`);

            html += `<div class="world-league-block">
                            <div class="world-league-header" onclick="toggleWorldLeague('${key}')">
                                <span style="font-size:16px;">${lg.flag || '🏟️'}</span>
                                <span class="world-league-name">${lg.name}${isMyLeague ? ' <span style="font-size:9px;color:var(--accent);background:rgba(0,224,84,0.1);padding:2px 6px;border-radius:4px;border:1px solid rgba(0,224,84,0.2);">MON CLUB</span>' : ''}</span>
                                ${leaderBadge}
                                <span class="world-matchday-badge">${mdLabel}</span>
                                <span class="world-league-toggle ${isLeagueOpen ? 'open' : ''}">▼</span>
                            </div>
                            ${tableHtml}
                        </div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html || `<div style="text-align:center;padding:40px;color:var(--muted);">Aucune ligue trouvée.</div>`;
}

// ======================================================
//  UPGRADES
// ======================================================
function renderUpgrades() {
    document.getElementById("upgrade-grid").innerHTML = UPGRADES_DEF.map(u => {
        const lvl = G.upgrades[u.id] || 0;
        const cost = u.cost * (lvl + 1);
        const maxed = lvl >= u.maxLevel;
        const canBuy = !maxed && G.money >= cost;
        const pips = Array.from({length: u.maxLevel}, (_, idx) =>
                `<div class="upgrade-pip ${idx < lvl ? "filled" : ""}"></div>`
        ).join("");
        const effectStr = u.effect.replace("{lvl}", lvl || 1);
        return `
              <div class="upgrade-card">
                <div class="upgrade-icon">${u.icon}</div>
                <div class="upgrade-name">${u.name}</div>
                <div class="upgrade-desc">${u.desc}</div>
                <div class="upgrade-pips">${pips}</div>
                <div class="upgrade-effect">Niveau ${lvl}/${u.maxLevel} · <strong>${effectStr}</strong></div>
                <button class="upgrade-btn"
                  ${maxed || !canBuy ? "disabled" : ""}
                  onclick="buyUpgrade('${u.id}')">
                  ${maxed ? "✓ Niveau maximum" : "Améliorer — " + fmtMoney(cost)}
                </button>
              </div>`;
    }).join("");
}

function buyUpgrade(id) {
    const u = UPGRADES_DEF.find(x => x.id === id);
    const lvl = G.upgrades[id] || 0;
    if (lvl >= u.maxLevel) {
        toast("Niveau maximum !", "error");
        return;
    }
    const cost = u.cost * (lvl + 1);
    if (G.money < cost) {
        toast("Budget insuffisant !", "error");
        return;
    }
    G.money -= cost;
    G.upgrades[id] = lvl + 1;
    if (id === "scouting") {
        G.market = generateMarket(G.upgrades.scouting);
    }
    updateTopBar();
    renderUpgrades();
    toast(u.name + " amélioré niveau " + (lvl + 1) + " !", "success");
}

// ======================================================
//  SAVE SLOT PICKER
// ======================================================
function renderSaveSlotPicker() {
    const saves = getSaves();
    const el = document.getElementById("saveSlotPicker");
    if (!el)
        return;
    el.innerHTML = [0, 1, 2].map(i => {
        const s = saves[i];
        return `
              <div class="save-slot ${s ? "has-save" : ""} ${saveSlot === i ? "selected" : ""}"
                   onclick="selectSavePicker(${i})">
                <span class="save-slot-icon">${s ? "💾" : "🔓"}</span>
                <div class="save-slot-label">Slot ${i + 1}</div>
                ${s
                ? `<div class="save-slot-club">${crest(s.clubName, s.clubEmoji || "", 20)} ${s.clubName}</div>
                     <div class="save-slot-season">J${s.matchDay}/38 · ${s.points} pts</div>`
                : `<div class="save-slot-season">Vide</div>`}
              </div>`;
    }).join("");
}

function selectSavePicker(i) {
    saveSlot = i;
    renderSaveSlotPicker();
    toast("Slot " + (i + 1) + " actif", "info");
}

// ======================================================
//  TOAST
// ======================================================
let toastTimer;
function toast(msg, type) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "show" + (type ? " " + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        el.className = "";
    }, 2800);
}

// ======================================================
//  INIT
// ======================================================
// ======================================================
//  NEW NARRATIVE EVENTS
// ======================================================
const NEW_NARRATIVE_EVENTS = [
    {
        id: 'takeover_offer',
        condition: () => (G.reputation || 1) >= 3 && G.matchDay >= 15,
        generate: () => {
            const amount = Math.round(G.squad.reduce((s, p) => s + p.level * 60000, 0) * (1.5 + Math.random()));
            return {
                emoji: '🏦', title: 'Offre de rachat du club',
                desc: `Un consortium d'investisseurs propose de racheter ${G.clubName} pour ${fmtMoney(amount)}. Ils promettent de gros investissements. Que faites-vous ?`,
                choices: [
                    {label: `💰 Accepter le rachat — +${fmtMoney(amount)}`, action: () => {
                            G.money += amount;
                            G.morale = Math.min(100, G.morale + 20);
                            G.reputation = Math.min(5, (G.reputation || 1) + 1);
                            toast('Rachat accepté ! Budget renforcé.', 'success');
                        }},
                    {label: '💪 Refuser — Garder le contrôle', action: () => {
                            G.morale = Math.min(100, G.morale + 8);
                            G.repPoints = (G.repPoints || 0) + 10;
                            toast('Refus du rachat. Les fans applaudissent !', 'success');
                        }},
                    {label: '🤝 Négocier (+20% de fonds pour l\'académie)', action: () => {
                            G.money += Math.round(amount * 0.3);
                            G.upgrades.academy = Math.min(5, (G.upgrades.academy || 0) + 1);
                            toast('Accord partiel : académie renforcée !', 'success');
                        }}
                ]
            };
        }
    },
    {
        id: 'serious_injury',
        condition: () => G.squad.filter(p => p.injuredGames === 0 && p.level >= 70).length > 0,
        generate: () => {
            const victim = G.squad.filter(p => p.injuredGames === 0 && p.level >= 70)[rand(0, G.squad.filter(p => p.injuredGames === 0 && p.level >= 70).length - 1)];
            return {
                emoji: '🏥', title: 'Blessure grave',
                desc: `${victim.name} s'est blessé sérieusement. Les médecins parlent d'une blessure musculaire grave nécessitant 6 à 8 matchs de repos. Un coup dur !`,
                choices: [
                    {label: '😔 Accepter le diagnostic (6-8 matchs)', action: () => {
                            victim.injuredGames = rand(6, 8);
                            G.morale = Math.max(0, G.morale - 15);
                            toast(victim.name + ' absent ' + victim.injuredGames + ' matchs !', 'error');
                        }},
                    {label: '🔬 Chirurgie express (–500k€, 3 matchs)', action: () => {
                            if (G.money >= 500000) {
                                victim.injuredGames = 3;
                                G.money -= 500000;
                                toast('Opération réussie — retour en 3 matchs', 'success');
                            } else
                                toast('Budget insuffisant !', 'error');
                        }},
                    {label: '🌍 Médecin étranger (–300k€, 4 matchs)', action: () => {
                            if (G.money >= 300000) {
                                victim.injuredGames = 4;
                                G.money -= 300000;
                                toast('Traitement spécialisé — 4 matchs', 'success');
                            } else
                                toast('Budget insuffisant !', 'error');
                        }}
                ]
            };
        }
    },
    {
        id: 'surprise_derby',
        condition: () => G.matchDay >= 5 && !G.isDerby,
        generate: () => {
            const rivals = getLeagueClubs(G.leagueKey).filter(c => c.name !== G.clubName);
            const rival = rivals[rand(0, rivals.length - 1)];
            return {
                emoji: '🔥', title: 'Derby surprise annoncé',
                desc: `La fédération annonce un derby spécial contre ${crest(rival.name, rival.emoji, 16)} ${rival.name} ! Match à fort enjeu, l'ambiance sera électrique dans votre stade.`,
                choices: [
                    {label: '⚔️ Se préparer intensivement (Moral +15)', action: () => {
                            G.morale = Math.min(100, G.morale + 15);
                            G.nextOpponent = rival;
                            G.isDerby = true;
                            prepareNextMatch();
                            toast('Préparation derby ! 🔥', 'success');
                        }},
                    {label: '😎 Rester serein — comme un match normal', action: () => {
                            G.nextOpponent = rival;
                            G.isDerby = true;
                            G.morale = Math.min(100, G.morale + 5);
                            prepareNextMatch();
                            toast('Derby programmé !', 'info');
                        }}
                ]
            };
        }
    }
];

// Inject new events into NARRATIVE_EVENTS at runtime
NEW_NARRATIVE_EVENTS.forEach(e => {
    if (!NARRATIVE_EVENTS.find(x => x.id === e.id))
        NARRATIVE_EVENTS.push(e);
});

// ======================================================
//  HELPERS
// ======================================================
function generateContracts() {
    if (!G)
        return [];
    return G.squad.map((p, i) => ({
            playerId: ensureContractPlayerId(p),
            matchesLeft: rand(5, 38),
            wage: p.wage || rand(50, 200) * 10000
        }));
}

function ensureContractPlayerId(player) {
    if (!player)
        return null;
    if (player.contractPlayerId)
        return player.contractPlayerId;
    if (!G)
        return null;
    let id;
    do {
        G.contractIdentityNext = Math.max(0, Number(G.contractIdentityNext) || 0) + 1;
        id = 'contract-player-' + G.contractIdentityNext;
    } while (G.squad && G.squad.some(p => p !== player && p && p.contractPlayerId === id));
    player.contractPlayerId = id;
    return id;
}

function findPlayerForContract(contract) {
    if (!contract || !G || !Array.isArray(G.squad))
        return null;
    if (typeof contract.playerId === 'string')
        return G.squad.find(p => p && p.contractPlayerId === contract.playerId) || null;
    const index = Number(contract.playerId);
    return Number.isInteger(index) && index >= 0 ? G.squad[index] || null : null;
}

// Upgrade legacy index-based contract data without resetting remaining matches.
// Wage matching also recovers most saves where a previous sale shifted the squad.
function ensureContractState() {
    if (!G || !Array.isArray(G.squad))
        return [];
    G.squad.forEach(ensureContractPlayerId);
    const old = Array.isArray(G.contracts) ? G.contracts : [];
    const byId = new Map();
    const legacy = [];
    old.forEach((c, index) => {
        if (!c || typeof c !== 'object')
            return;
        if (typeof c.playerId === 'string')
            byId.set(c.playerId, c);
        else
            legacy.push({contract: c, index});
    });
    const used = new Set();
    G.contracts = G.squad.map((p, index) => {
        let c = byId.get(p.contractPlayerId);
        if (c)
            used.add(c);
        if (!c) {
            const wage = Number(p.wage) || 0;
            const candidates = legacy.filter(x => !used.has(x.contract));
            candidates.sort((a, b) => {
                const aMatch = Number(a.contract.wage) === wage;
                const bMatch = Number(b.contract.wage) === wage;
                if (aMatch !== bMatch)
                    return aMatch ? -1 : 1;
                return Math.abs(a.index - index) - Math.abs(b.index - index);
            });
            if (candidates.length) {
                c = candidates[0].contract;
                used.add(c);
            }
        }
        if (!c)
            c = {matchesLeft: rand(5, 38), wage: p.wage || 0};
        c.playerId = p.contractPlayerId;
        if (!Number.isFinite(Number(c.matchesLeft)))
            c.matchesLeft = 38;
        c.matchesLeft = Math.max(0, Math.trunc(Number(c.matchesLeft)));
        c.wage = Number(p.wage) || Number(c.wage) || 0;
        return c;
    });
    return G.contracts;
}

function buildSeasonRolloverContracts(squad, priorContracts, matchesPerSeason) {
    const seasonTerm = Math.max(1, Math.trunc(Number(matchesPerSeason) || 38));
    const byPlayerId = new Map((Array.isArray(priorContracts) ? priorContracts : [])
            .filter(contract => contract && typeof contract.playerId === 'string')
            .map(contract => [contract.playerId, contract]));
    return (Array.isArray(squad) ? squad : []).map((player, index) => {
        const playerId = String(player && (player.contractPlayerId || player.id) || `season-player-${index}`);
        const previous = byPlayerId.get(playerId);
        const remaining = previous ? Math.max(0, Math.trunc(Number(previous.matchesLeft) || 0)) : 0;
        return {
            ...(previous || {}),
            playerId,
            // Keep every unexpired deal intact. Retained players whose term
            // expired receive a single season renewal instead of a random
            // replacement term on every season rollover.
            matchesLeft: previous && remaining > 0 ? remaining : seasonTerm,
            wage: Number(player && player.wage) || Number(previous && previous.wage) || 0
        };
    });
}

function getRepLabel(rep) {
    return ['', '⭐ Inconnu', '⭐⭐ Local', '⭐⭐⭐ Régional', '⭐⭐⭐⭐ National', '⭐⭐⭐⭐⭐ Légendaire'][rep || 1];
}
function getRepStars(rep) {
    return '⭐'.repeat(rep || 1) + '☆'.repeat(5 - (rep || 1));
}

// ======================================================
//  FORMATION RENDER
// ======================================================
function renderFormation() {
    const el = document.getElementById('formation-content');
    if (!el || !G)
        return;
    const academyLvl = G.upgrades.academy || 0;
    const maxSlots = 2 + academyLvl;
    if (!G.youthPlayers)
        G.youthPlayers = [];
    // Auto-generate youth players if slots not full
    while (G.youthPlayers.filter(y => !y.graduated).length < maxSlots) {
        G.youthPlayers.push(generateYouthPlayer());
    }
    const active = G.youthPlayers.filter(y => !y.graduated);
    const graduated = G.youthPlayers.filter(y => y.graduated).slice(-5);
    let html = `
                <div class="academy-header">
                    <div class="academy-icon">🎓</div>
                    <div class="academy-info">
                        <div class="academy-name">Centre de Formation — Niveau ${academyLvl || 'Base'}</div>
                        <div class="academy-sub">Formez vos jeunes talents pour renforcer l'effectif. Améliorez l'Académie pour plus de slots et une progression plus rapide.</div>
                    </div>
                    <div class="academy-lvl-badge">${active.length}/${maxSlots} slots</div>
                </div>
                <div class="section-title" style="font-size:14px;margin-bottom:10px;">🌱 Joueurs en formation</div>
                <div class="academy-slots-grid">`;

    if (active.length === 0) {
        html += `<div class="academy-no-slots" style="grid-column:1/-1">Aucun jeune en formation. Améliorez l'Académie pour débloquer des slots !</div>`;
    }
    active.forEach((y, i) => {
        const idx = G.youthPlayers.indexOf(y);
        const ready = y.progress >= 100;
        ensurePot(y);
        const yPotColor = potColor(y);
        html += `<div class="youth-card">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                            <div><div class="youth-name">${y.name}</div><span class="youth-pos">${y.pos}</span></div>
                            <div style="font-size:12px;color:var(--muted)">${y.age} ans</div>
                        </div>
                        <div class="youth-potential">✨ Potentiel : <strong style="color:${yPotColor}">${potText(y)}</strong></div>
                        <div class="youth-prog-bg"><div class="youth-prog-bar" style="width:${y.progress}%"></div></div>
                        <div class="youth-prog-label"><span>Progression</span><span>${y.progress}%</span></div>
                        <div style="font-size:11px;color:var(--muted);margin-top:4px;">Note actuelle : <strong>${y.currentLevel}</strong></div>
                        <button class="youth-promote-btn" ${!ready ? 'disabled' : ''} onclick="promoteYouth(${idx})">
                            ${ready ? '✅ Intégrer à l\'effectif' : `⏳ En formation (${y.progress}%)`}
                        </button>
                    </div>`;
    });
    html += `</div>`;

    if (graduated.length > 0) {
        html += `<div class="section-title" style="font-size:14px;margin:16px 0 8px;">🏆 Promus récemment</div>`;
        graduated.forEach(y => {
            html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--panel2);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">
                            <span style="font-size:18px;">⚽</span>
                            <span style="font-weight:700">${y.name}</span>
                            <span class="youth-pos">${y.pos}</span>
                            <span style="font-size:11px;color:var(--muted);margin-left:auto">Intégré à l'effectif</span>
                        </div>`;
        });
    }
    el.innerHTML = html;
}

function generateYouthPlayer() {
    const NAMES = ['L.Dupont', 'K.Benali', 'T.Moreau', 'R.Silva', 'A.Diallo', 'J.Martin', 'C.Bernard', 'M.Traoré', 'N.Petit', 'F.Leroy', 'Z.Nkosi', 'B.García', 'O.Müller', 'S.Rossi'];
    const POSITIONS = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT'];
    const pos = POSITIONS[rand(0, POSITIONS.length - 1)];
    const age = rand(16, 19);
    const currentLevel = rand(45, 65);
    const pot = Math.min(99, Math.max(62, currentLevel + rand(10, 35)));
    return {
        name: NAMES[rand(0, NAMES.length - 1)],
        pos,
        age,
        pot,
        ...potRange(pot, currentLevel, age),
        potential: pot,
        currentLevel,
        progress: rand(0, 40),
        graduated: false
    };
}

function promoteYouth(idx) {
    if (!G.youthPlayers || !G.youthPlayers[idx])
        return;
    const y = G.youthPlayers[idx];
    if (y.progress < 100) {
        toast('Le joueur n\'est pas encore prêt !', 'error');
        return;
    }
    const newPlayer = {
        name: y.name, pos: y.pos, age: y.age,
        level: Math.round(y.currentLevel + (ensurePot(y).pot - y.currentLevel) * 0.3),
        wage: rand(30, 80) * 10000, goals: 0, assists: 0, injuredGames: 0, happy: true,
        profile: Math.random() < 0.3 ? ['buteur', 'clutch', 'leader', 'fragile', 'irregulier'][rand(0, 4)] : null
    };
    {
        const lvl = newPlayer.level;
        newPlayer.pot = Math.max(y.pot, lvl);
        Object.assign(newPlayer, potRange(newPlayer.pot, lvl, y.age));
        newPlayer.potMin = Math.max(lvl, Math.min(newPlayer.potMin, y.potMin));
    }
    // Add a stable identity and the academy graduate's own contract.
    ensureContractState();
    ensureContractPlayerId(newPlayer);
    G.squad.push(newPlayer);
    G.contracts.push({playerId: newPlayer.contractPlayerId, matchesLeft: rand(20, 38), wage: newPlayer.wage});
    y.graduated = true;
    updateTopBar();
    renderFormation();
    toast(`✅ ${y.name} intégré à l'effectif ! (Note ${newPlayer.level}, pot. ${potText(newPlayer)})`, 'success');
}

// ======================================================
//  STADE RENDER
// ======================================================
function renderStade() {
    const el = document.getElementById('stade-content');
    if (!el || !G)
        return;
    const stadLvl = G.upgrades.stadium || 0;
    const capacity = G.stadiumCapacity || 15000;
    const atmoBase = Math.min(100, (G.morale || 50) * 0.5 + (G.reputation || 1) * 8 + stadLvl * 6);
    const totalTickets = G.ticketRevenue || 0;
    const avgAtt = Math.round(capacity * (0.6 + stadLvl * 0.05 + (G.reputation || 1) * 0.04));
    el.innerHTML = `
                <div class="stadium-card">
                    <div class="stadium-header">
                        <div class="stadium-emoji">🏟️</div>
                        <div class="stadium-info">
                            <div class="stadium-name">${G.stadiumName || G.clubName + ' Arena'}</div>
                            <div class="stadium-capacity">Capacité : <strong>${capacity.toLocaleString('fr-FR')}</strong> places · Niveau stade : <strong>${stadLvl}/5</strong></div>
                        </div>
                    </div>
                    <div class="stadium-stats-grid">
                        <div class="stad-stat"><div class="val">${capacity.toLocaleString('fr-FR')}</div><div class="lbl">Capacité</div></div>
                        <div class="stad-stat"><div class="val">${avgAtt.toLocaleString('fr-FR')}</div><div class="lbl">Affluence moy.</div></div>
                        <div class="stad-stat"><div class="val" style="color:var(--accent)">${fmtMoney(totalTickets)}</div><div class="lbl">Revenus billetterie</div></div>
                        <div class="stad-stat"><div class="val">${Math.round((avgAtt / capacity) * 100)}%</div><div class="lbl">Taux de remplissage</div></div>
                        <div class="stad-stat"><div class="val" style="color:var(--gold)">${getRepLabel(G.reputation)}</div><div class="lbl">Réputation</div></div>
                        <div class="stad-stat"><div class="val">${fmtMoney(25 + stadLvl * 8 + (G.reputation || 1) * 5)}</div><div class="lbl">Prix billet moyen</div></div>
                    </div>
                    <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">⚡ Atmosphère</div>
                    <div class="atmosphere-bar-bg"><div class="atmosphere-bar" style="width:${atmoBase}%"></div></div>
                    <div style="font-size:11px;color:var(--muted);margin-bottom:16px;">${atmoBase < 40 ? '😶 Silencieux' : atmoBase < 65 ? '👏 Correct' : atmoBase < 85 ? '🔥 Bouillant' : '💥 Électrique'} — ${Math.round(atmoBase)}%</div>

                    <div class="section-title" style="font-size:14px;margin-bottom:10px;">💡 Rénovation du stade</div>
                    ${stadLvl < 5 ? `
                    <div style="background:var(--panel3);border:1px solid rgba(77,168,255,0.2);border-radius:var(--radius);padding:14px;display:flex;align-items:center;gap:14px;">
                        <div style="font-size:28px">🏗️</div>
                        <div style="flex:1">
                            <div style="font-weight:700;margin-bottom:2px;">Agrandir le stade (Niveau ${stadLvl + 1})</div>
                            <div style="font-size:12px;color:var(--muted)">+${5000 + stadLvl * 3000} places · +${fmtMoney(50000 + stadLvl * 20000)}/match de revenus</div>
                        </div>
                        <button onclick="expandStadium()" style="background:rgba(77,168,255,0.12);border:1px solid rgba(77,168,255,0.3);color:var(--accent2);font-family:'Barlow',sans-serif;font-size:12px;font-weight:700;padding:8px 14px;border-radius:8px;cursor:pointer;">
                            ${fmtMoney((stadLvl + 1) * 2000000)}
                        </button>
                    </div>` : `<div style="text-align:center;padding:20px;color:var(--accent)">✅ Stade au maximum !</div>`}

                    <div class="section-title" style="font-size:14px;margin:16px 0 10px;">🎟️ Abonnements</div>
                    <div style="background:var(--panel3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;align-items:center;gap:14px;">
                        <div style="font-size:28px">🎟️</div>
                        <div style="flex:1">
                            <div style="font-weight:700;margin-bottom:2px;">Lancer une campagne d'abonnements</div>
                            <div style="font-size:12px;color:var(--muted)">Revenus garantis même pour les matchs à domicile vides · Coût : 200k€</div>
                        </div>
                        <button onclick="launchSeasonTickets()" style="background:rgba(0,224,84,0.1);border:1px solid rgba(0,224,84,0.25);color:var(--accent);font-family:'Barlow',sans-serif;font-size:12px;font-weight:700;padding:8px 14px;border-radius:8px;cursor:pointer;">
                            Lancer
                        </button>
                    </div>
                `;
}

function expandStadium() {
    const lvl = G.upgrades.stadium || 0;
    if (lvl >= 5) {
        toast('Stade déjà au max !', 'error');
        return;
    }
    const cost = (lvl + 1) * 2000000;
    if (G.money < cost) {
        toast('Budget insuffisant !', 'error');
        return;
    }
    G.money -= cost;
    G.upgrades.stadium = lvl + 1;
    G.stadiumCapacity = (G.stadiumCapacity || 15000) + 5000 + lvl * 3000;
    updateTopBar();
    renderStade();
    toast(`🏗️ Stade agrandi ! Capacité : ${G.stadiumCapacity.toLocaleString('fr-FR')} places`, 'success');
}

function launchSeasonTickets() {
    if (G.money < 200000) {
        toast('Budget insuffisant !', 'error');
        return;
    }
    G.money -= 200000;
    const revenue = Math.round((G.stadiumCapacity || 15000) * 0.3 * (20 + (G.upgrades.stadium || 0) * 5));
    G.money += revenue;
    G.ticketRevenue = (G.ticketRevenue || 0) + revenue;
    updateTopBar();
    toast(`🎟️ Campagne réussie ! +${fmtMoney(revenue)} d'abonnements`, 'success');
    renderStade();
}

// ======================================================
//  STAFF RENDER
// ======================================================
const STAFF_DEF = [
    {id: 'adjoint', role: 'Entraîneur adjoint', name: 'R. Deschamps', avatar: '👨‍🏫',
        desc: 'Améliore la préparation tactique. +5% de probabilité de victoire à chaque match.',
        salary: 800000, bonus: 'atk', bonusVal: 0.05},
    {id: 'kine', role: 'Kinésithérapeute', name: 'Dr. Mbaye', avatar: '💆',
        desc: 'Réduit la durée des blessures de 30%. Les joueurs se remettent plus vite.',
        salary: 600000, bonus: 'injury', bonusVal: 0.3},
    {id: 'analyste', role: 'Analyste vidéo', name: 'J. Telles', avatar: '📹',
        desc: 'Analyse l\'adversaire. +3 de force de l\'équipe avant chaque match.',
        salary: 500000, bonus: 'rating', bonusVal: 3},
    {id: 'psychologue', role: 'Psychologue du sport', name: 'E. Brunner', avatar: '🧠',
        desc: 'Booste le moral de 5 après chaque victoire et réduit la perte de moral en cas de défaite.',
        salary: 450000, bonus: 'morale', bonusVal: 5},
    {id: 'recruteur', role: 'Recruteur senior', name: 'A. Balogun', avatar: '🔭',
        desc: 'Améliore la qualité du marché des transferts. 2 joueurs supplémentaires dans les offres.',
        salary: 700000, bonus: 'market', bonusVal: 2},
];

function renderStaff() {
    const el = document.getElementById('staff-content');
    if (!el || !G)
        return;
    const totalStaffCost = STAFF_DEF.reduce((s, st) => s + ((G.staff[st.id] ? st.salary : 0)), 0);
    let html = `
                <div class="section-title">👔 Staff Technique <span style="font-size:12px;color:var(--muted);font-weight:400">— Masse salariale staff : ${fmtMoney(totalStaffCost)}/mois</span></div>
                <div style="font-size:12px;color:var(--muted);margin-bottom:16px;">Recrutez des spécialistes pour améliorer les performances de votre club.</div>
                <div class="staff-grid">`;
    STAFF_DEF.forEach(st => {
        const hired = !!G.staff[st.id];
        html += `<div class="staff-card ${hired ? 'hired' : ''}">
                        <div class="staff-avatar">${st.avatar}</div>
                        <div class="staff-role">${st.role}</div>
                        <div class="staff-name">${st.name}</div>
                        <div class="staff-desc">${st.desc}</div>
                        <div class="staff-salary">${hired ? '✅ En poste' : '💰 Salaire : ' + fmtMoney(st.salary) + '/mois'}</div>
                        <button class="staff-btn ${hired ? 'fire' : ''}" onclick="${hired ? `fireStaff('${st.id}')` : `hireStaff('${st.id}')`}">
                            ${hired ? '🚪 Licencier' : `Recruter — ${fmtMoney(st.salary * 3)} (3 mois d'avance)`}
                        </button>
                    </div>`;
    });
    html += `</div>`;
    el.innerHTML = html;
}

function hireStaff(id) {
    const st = STAFF_DEF.find(x => x.id === id);
    if (!st)
        return;
    const cost = st.salary * 3;
    if (G.money < cost) {
        toast('Budget insuffisant !', 'error');
        return;
    }
    G.money -= cost;
    G.staff[id] = true;
    updateTopBar();
    renderStaff();
    toast(`✅ ${st.name} recruté !`, 'success');
}

function fireStaff(id) {
    const st = STAFF_DEF.find(x => x.id === id);
    if (!st)
        return;
    if (!confirm(`Licencier ${st.name} ?`))
        return;
    G.staff[id] = false;
    renderStaff();
    toast(`${st.name} licencié.`, 'info');
}

// ======================================================
//  DASHBOARD RENDER
// ======================================================
function renderDashboard() {
    const el = document.getElementById('dashboard-content');
    if (!el || !G)
        return;
    const wins = G.wins || 0, draws = G.draws || 0, losses = G.losses || 0;
    const played = wins + draws + losses;
    const ppg = played > 0 ? ((G.points || 0) / played).toFixed(2) : '0.00';
    const bestStreak = G.bestWinStreak || G.streakW || 0;
    const avgGF = played > 0 ? (G.goalsFor / played).toFixed(1) : '0.0';
    const avgGA = played > 0 ? (G.goalsAgainst / played).toFixed(1) : '0.0';
    const winRate = played > 0 ? Math.round(wins / played * 100) : 0;
    const topScorer = G.squad.reduce((best, p) => (p.goals || 0) > (best.goals || 0) ? p : best, {name: '—', goals: 0});
    const topAssist = G.squad.reduce((best, p) => (p.assists || 0) > (best.assists || 0) ? p : best, {name: '—', assists: 0});
    const rank = getRank();

    el.innerHTML = `
                <div class="section-title">📊 Tableau de bord — Saison en cours</div>

                <div style="padding:12px 16px;background:rgba(0,224,84,0.06);border:1px solid rgba(0,224,84,0.2);border-radius:var(--radius);margin-bottom:16px;display:flex;align-items:center;gap:12px;">
                    <span style="font-size:28px;display:flex;">${crest(G.clubName, G.clubEmoji, 36)}</span>
                    <div>
                        <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700">${G.clubName}</div>
                        <div style="font-size:12px;color:var(--muted)">${G.leagueName} · ${getRepLabel(G.reputation)}</div>
                    </div>
                    <div style="margin-left:auto;text-align:right">
                        <div style="font-family:'Rajdhani',sans-serif;font-size:26px;font-weight:700;color:var(--accent)">${G.points} pts</div>
                        <div style="font-size:11px;color:var(--muted)">${rank}e au classement</div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="dash-stat"><div class="val" style="color:var(--accent)">${wins}</div><div class="lbl">Victoires</div><div class="trend" style="color:var(--accent)">🏆</div></div>
                    <div class="dash-stat"><div class="val" style="color:var(--gold)">${draws}</div><div class="lbl">Nuls</div><div class="trend">🤝</div></div>
                    <div class="dash-stat"><div class="val" style="color:var(--danger)">${losses}</div><div class="lbl">Défaites</div><div class="trend">💔</div></div>
                    <div class="dash-stat"><div class="val">${winRate}%</div><div class="lbl">% Victoires</div><div class="trend" style="color:${winRate >= 50 ? 'var(--accent)' : 'var(--danger)'}">📈</div></div>
                    <div class="dash-stat"><div class="val" style="color:var(--accent)">${G.goalsFor || 0}</div><div class="lbl">Buts marqués</div><div class="trend">⚽</div></div>
                    <div class="dash-stat"><div class="val" style="color:var(--danger)">${G.goalsAgainst || 0}</div><div class="lbl">Buts encaissés</div><div class="trend">🥅</div></div>
                    <div class="dash-stat"><div class="val" style="color:${(G.goalsFor - G.goalsAgainst) >= 0 ? 'var(--accent)' : 'var(--danger)'}">${(G.goalsFor || 0) - (G.goalsAgainst || 0) > 0 ? '+' : ''}${(G.goalsFor || 0) - (G.goalsAgainst || 0)}</div><div class="lbl">Diff. buts</div><div class="trend">⚖️</div></div>
                    <div class="dash-stat"><div class="val">${ppg}</div><div class="lbl">Pts/match</div><div class="trend">📊</div></div>
                    <div class="dash-stat"><div class="val" style="color:var(--accent2)">${avgGF}</div><div class="lbl">Moy. buts/match</div><div class="trend">⚽</div></div>
                    <div class="dash-stat"><div class="val" style="color:var(--gold)">${fmtMoney(G.money)}</div><div class="lbl">Budget restant</div><div class="trend">💰</div></div>
                    <div class="dash-stat"><div class="val" style="color:var(--accent)">${fmtMoney(G.ticketRevenue || 0)}</div><div class="lbl">Billetterie saison</div><div class="trend">🎟️</div></div>
                    <div class="dash-stat"><div class="val">${G.matchDay || 0}/${G.seasonLength || 38}</div><div class="lbl">Journées jouées</div><div class="trend">📅</div></div>
                </div>

                <div class="section-title" style="font-size:14px;margin-bottom:10px;">🥇 Meilleurs performeurs</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
                    <div style="flex:1;min-width:140px;background:var(--panel2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">⚽ Meilleur buteur</div>
                        <div style="font-weight:700">${topScorer.name}</div>
                        <div style="font-size:20px;font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent)">${topScorer.goals || 0} buts</div>
                    </div>
                    <div style="flex:1;min-width:140px;background:var(--panel2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
                        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">🎯 Meilleur passeur</div>
                        <div style="font-weight:700">${topAssist.name}</div>
                        <div style="font-size:20px;font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent2)">${topAssist.assists || 0} passes</div>
                    </div>
                </div>

                <div class="section-title" style="font-size:14px;margin-bottom:10px;">📈 Progression de la saison</div>
                <div class="season-timeline">
                    ${['V', 'N', 'D'].map((r, ri) => {
        const count = ri === 0 ? wins : ri === 1 ? draws : losses;
        const color = ri === 0 ? 'var(--accent)' : ri === 1 ? 'var(--gold)' : 'var(--danger)';
        const label = ri === 0 ? 'Victoires' : ri === 1 ? 'Nuls' : 'Défaites';
        return `<div class="timeline-bar-wrap">
                            <div class="timeline-lbl">${label}</div>
                            <div class="timeline-bg"><div class="timeline-fill" style="width:${played > 0 ? Math.round(count / played * 100) : 0}%;background:${color}"></div></div>
                            <div style="font-size:12px;font-weight:700;min-width:30px">${played > 0 ? Math.round(count / played * 100) : 0}%</div>
                        </div>`;
    }).join('')}
                </div>

                <div class="section-title" style="font-size:14px;margin:16px 0 10px;">⭐ Réputation du club</div>
                <div class="reputation-bar">
                    <div class="rep-stars">${getRepStars(G.reputation)}</div>
                    <div class="rep-label">${getRepLabel(G.reputation)}</div>
                    <div class="rep-points">${G.repPoints || 0} pts de réputation</div>
                </div>
                <div class="rep-perks-grid">
                    ${[
        {min: 1, icon: '🎟️', title: 'Billetterie de base', desc: 'Revenus standard aux matchs à domicile'},
        {min: 2, icon: '📡', title: 'Couverture médias locaux', desc: '+10% de revenus publicitaires'},
        {min: 3, icon: '🌍', title: 'Réputation nationale', desc: 'Meilleurs joueurs sur le marché des transferts'},
        {min: 4, icon: '💼', title: 'Partenariats premium', desc: '+30% de revenus billetterie, accès sponsors internationaux'},
        {min: 5, icon: '🏆', title: 'Club légendaire', desc: 'Attraction des meilleures stars mondiales, bonus de 2M€/saison'},
    ].map(p => `<div class="rep-perk ${(G.reputation || 1) >= p.min ? '' : 'locked'}">
                        <div class="rep-perk-icon">${p.icon}</div>
                        <div class="rep-perk-info"><div class="title">${p.title} ${(G.reputation || 1) >= p.min ? '✅' : ('⭐'.repeat(p.min))}</div><div class="desc">${p.desc}</div></div>
                    </div>`).join('')}
                </div>`;
}

// ======================================================
//  CONTRATS RENDER
// ======================================================
function renderContrats() {
    const el = document.getElementById('contrats-content');
    if (!el || !G)
        return;
    ensureContractState();
    const totalWages = G.squad.reduce((s, p) => s + (p.wage || 0), 0);
    const sorted = G.squad.map((p, i) => ({p, i, c: G.contracts.find(x => x.playerId === p.contractPlayerId) || {matchesLeft: 38, wage: p.wage}}))
            .sort((a, b) => Number(a.c.matchesLeft) - Number(b.c.matchesLeft));

    const _cflag = (LEAGUES[G.leagueKey] || {}).flag || '';
    let html = `
                <div class="contracts-header-bar">
                    <span>💰 Masse salariale totale :</span>
                    <span class="wage-bill">${fmtMoney(totalWages)}/mois</span>
                    <span style="margin-left:auto;font-size:11px;color:var(--muted)">${_cflag} ${G.squad.length} joueurs sous contrat</span>
                </div>
                <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Les salaires sont déduits tous les 4 matchs. Prolongez les contrats qui expirent pour éviter de perdre vos joueurs.</div>
                <div class="contracts-list">`;

    const POS_COLORS = {GK: '#f0b429', DEF: '#58a6ff', MID: '#3fb950', ATT: '#f85149'};
    sorted.forEach(({p, i, c}) => {
        const left = Number.isFinite(Number(c.matchesLeft)) ? Number(c.matchesLeft) : 38;
        const cls = left <= 3 ? 'expired' : left <= 10 ? 'expiring' : '';
        const durCls = left <= 3 ? 'danger' : left <= 10 ? 'warn' : 'ok';
        const extCost = Math.round((p.wage || 50000) * 2);
        html += `<div class="contract-row ${cls}">
                        <div class="contract-pos" style="background:${POS_COLORS[p.pos] || '#aaa'}22;color:${POS_COLORS[p.pos] || '#aaa'}">${p.pos}</div>
                        <div class="contract-player-info">
                            <div class="contract-player-name">${p.name} ${p.happy === false ? '😤' : ''}</div>
                            <div class="contract-wage">💰 ${fmtMoney(p.wage || 50000)}/mois · Note ${p.level} · Pot. ${potText(p)} · ${p.age} ans</div>
                        </div>
                        <div class="contract-duration ${durCls}">${left <= 0 ? 'EXPIRE' : left + ' matchs'}</div>
                        <button class="contract-extend-btn" onclick="extendContract(${i},${extCost})">
                            Prolonger<br>${fmtMoney(extCost)}
                        </button>
                    </div>`;
    });
    html += `</div>`;
    el.innerHTML = html;
}

function extendContract(playerIdx, cost) {
    ensureContractState();
    const p = G.squad[playerIdx];
    if (!p)
        return;
    const contract = G.contracts.find(c => c.playerId === p.contractPlayerId);
    if (!contract)
        return;
    if (G.money < cost) {
        toast('Budget insuffisant !', 'error');
        return;
    }
    G.money -= cost;
    contract.matchesLeft = (contract.matchesLeft || 0) + rand(20, 38);
    if (p) {
        p.happy = true;
    }
    updateTopBar();
    renderContrats();
    toast(`✅ Contrat prolongé pour ${G.squad[playerIdx]?.name || 'le joueur'} !`, 'success');
}

// Staff bonus is applied inline in playMatch; no patch needed here.

updateClubs();
renderMenuSlots();
