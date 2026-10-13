/* Persistent domestic knockout cup. Match play itself stays in script.js. */
(function () {
    'use strict';
    const keyOf = (leagueKey, name) => leagueKey + '|' + String(name).trim().toLowerCase().replace(/\s+/g, ' ');
    const dates = ['10-29', '11-26', '12-17', '02-04', '03-18', '05-06'];
    const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
    const rnd = (n) => Math.floor(Math.random() * n);
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const clubRating = c => typeof budgetToRating === 'function' ? budgetToRating(c.budget || 10000000) : 65;
    const label = (count, first) => {
        if (first && count > 16) return 'Tour préliminaire';
        if (count >= 32) return '32es de finale';
        if (count >= 16) return 'Huitièmes de finale';
        if (count >= 8) return 'Quarts de finale';
        if (count >= 4) return 'Demi-finales';
        return 'Finale';
    };
    const fixtureDate = (year, roundIndex) => {
        const k = dates[Math.min(roundIndex, dates.length - 1)];
        return year + (roundIndex >= 4 ? 1 : 0) + '-' + k;
    };
    function entrants() {
        const league = LEAGUES[G.leagueKey];
        const country = league && league.country;
        const keys = Object.keys(LEAGUES).filter(k => LEAGUES[k].country === country).sort((a, b) => LEAGUES[a].tier - LEAGUES[b].tier);
        const rows = [];
        keys.forEach(k => {
            const clubs = typeof getLeagueClubs === 'function' ? getLeagueClubs(k) : LEAGUES[k].clubs;
            clubs.forEach(c => rows.push({id:keyOf(k,c.name),name:c.name,emoji:c.emoji||'⚽',budget:c.budget||10000000,leagueKey:k,tier:LEAGUES[k].tier||1}));
        });
        const byId = new Map();
        rows.forEach(c => { if (!byId.has(c.id)) byId.set(c.id,c); });
        const out = [...byId.values()];
        if (!byId.has(keyOf(G.leagueKey,G.clubName))) out.push({id:keyOf(G.leagueKey,G.clubName),name:G.clubName,emoji:G.clubEmoji||'⚽',budget:G.money||10000000,leagueKey:G.leagueKey,tier:league.tier||1});
        return out;
    }
    function nextPowerFloor(n) { let p=1; while (p*2<=n) p*=2; return p; }
    function makeMatch(a,b,index) {
        const homeFirst = Math.random()<.5;
        return {id:'tie-'+Date.now().toString(36)+'-'+index+'-'+Math.random().toString(36).slice(2,7),homeId:(homeFirst?a:b).id,awayId:(homeFirst?b:a).id,status:'scheduled',homeGoals:null,awayGoals:null,extraTime:false,penalties:null,winnerId:null};
    }
    function createFirstRound(state) {
        const pool = state.entrants.slice();
        if (pool.length < 2) { state.rounds=[]; state.championId=pool[0]?.id||null; return; }
        let target = nextPowerFloor(pool.length);
        if (target === pool.length) target = Math.max(1, target / 2);
        const byes = Math.max(0, target*2-pool.length);
        const rated = pool.map(c=>({...c,_rating:clubRating(c)})).sort((a,b)=>b._rating-a._rating);
        const byeIds = new Set(rated.slice(0,byes).map(c=>c.id));
        const byeTeams = pool.filter(c=>byeIds.has(c.id));
        const matchTeams = shuffle(pool.filter(c=>!byeIds.has(c.id)));
        const matches=[];
        for(let i=0;i<matchTeams.length;i+=2) matches.push(makeMatch(matchTeams[i],matchTeams[i+1],i));
        const count = pool.length;
        state.rounds.push({index:0,name:label(count,true),date:fixtureDate(state.year,0),matches,byes:byeTeams.map(c=>c.id),winnerIds:[],drawn:true});
    }
    function newSeason(year) {
        const prior = G.cup && G.cup.schema===1 && G.cup.year===year && G.cup.playerId===keyOf(G.leagueKey,G.clubName);
        if (prior) return G.cup;
        const state={schema:1,year,competition:getCupName(G.leagueKey),playerId:keyOf(G.leagueKey,G.clubName),entrants:entrants(),rounds:[],dates:scheduleDates(year,[]),playerEliminated:false,championId:null,rewardsApplied:[],qualification:null};
        createFirstRound(state); G.cup=state; G.activeMatch=null; G.matchContext=null;
        return state;
    }
    function team(id) { return G.cup.entrants.find(c=>c.id===id)||null; }
    function resolveAI(match) {
        const home=team(match.homeId), away=team(match.awayId); if(!home||!away)return;
        const delta=(clubRating(home)-clubRating(away))/16;
        let h=clamp(Math.round(1.35+delta+Math.random()*2.4),0,6), a=clamp(Math.round(1.05-delta+Math.random()*2.4),0,6), shootoutWinner=null;
        if(h===a){match.extraTime=true; if(Math.random()<.28) Math.random()<.5?h++:a++; if(h===a){match.penalties=[0,0];for(let round=0;round<5;round++){if(Math.random()<.75)match.penalties[0]++;if(Math.random()<.72)match.penalties[1]++;}for(let sudden=0;match.penalties[0]===match.penalties[1]&&sudden<10;sudden++){if(Math.random()<.75)match.penalties[0]++;if(Math.random()<.72)match.penalties[1]++;}if(match.penalties[0]===match.penalties[1])match.penalties[Math.random()<.5?0:1]++;shootoutWinner=match.penalties[0]>match.penalties[1]?home.id:away.id;}}
        match.homeGoals=h;match.awayGoals=a;match.winnerId=shootoutWinner||(h>a?home.id:away.id);match.status='played';
    }
    function findPlayerTie(round) { return round.matches.find(m=>m.status==='scheduled'&&(m.homeId===G.cup.playerId||m.awayId===G.cup.playerId)); }
    function drawNextRound() {
        const state=G.cup, prev=state.rounds[state.rounds.length-1];
        if(!prev||prev.winnerIds.length<2||state.championId)return null;
        const winners=shuffle(prev.winnerIds.map(team).filter(Boolean));
        const matches=[];for(let i=0;i<winners.length;i+=2)matches.push(makeMatch(winners[i],winners[i+1],i));
        const index=state.rounds.length, count=winners.length;
        const r={index,name:label(count,false),date:(state.dates||[])[index]||fixtureDate(state.year,index),matches,byes:[],winnerIds:[],drawn:true};
        state.rounds.push(r);
        const scheduled=G.sched&&G.sched.find(e=>e.t==='C'&&e.cupRound===index);
        if(scheduled){scheduled.r=r.name;scheduled.d=r.date;}
        return r;
    }
    function finalizeRound(round) {
        if (round.finalized) return true;
        if(round.matches.some(m=>m.status!=='played'))return false;
        const winners=[...round.byes,...round.matches.map(m=>m.winnerId).filter(Boolean)];
        round.winnerIds=winners;
        round.finalized=true;
        if(winners.length===1){G.cup.championId=winners[0];awardChampion(winners[0]);}
        else drawNextRound();
        return true;
    }
    function awardChampion(id) {
        if(G.cup.rewardsApplied.includes(id))return;
        G.cup.rewardsApplied.push(id);
        const winner=team(id); if(!winner)return;
        if(id===G.cup.playerId){G.money=(G.money||0)+2000000;G.repPoints=(G.repPoints||0)+15;G.morale=Math.min(100,(G.morale||50)+12);G.cup.qualification='Europa Conference League';G.cupQualifiesNextSeason=(Number(G.seasonYear)||G.cup.year)+1;
            if(window.CareerDepth)CareerDepth.recordCupResult('winner',G.cup.competition);
            if(typeof toast==='function')toast('🏆 '+G.cup.competition+' remportée ! +2 M€','success');
        }
    }
    function processDate(date) {
        const state=G.cup;if(!state||state.schema!==1||state.championId)return {hasPlayerMatch:false};
        let round=state.rounds.find(r=>r.date===date);
        if(!round)return {hasPlayerMatch:false};
        const m=findPlayerTie(round);
        round.matches.filter(x=>x.status==='scheduled'&&x!==m).forEach(resolveAI);
        if(round.byes.includes(state.playerId)) round.winnerIds.push(state.playerId);
        if(m){const opp=team(m.homeId===state.playerId?m.awayId:m.homeId);G.activeMatch={competition:'cup',fixtureId:m.id,roundIndex:round.index,homeId:m.homeId,awayId:m.awayId};G.matchContext={type:'cup',roundIndex:round.index,fixtureId:m.id};G.nextOpponent={name:opp.name,emoji:opp.emoji,budget:opp.budget};G.nextOppRat=clubRating(opp);G.isHomeMatch=m.homeId===state.playerId;G.isDerby=false;G.cup.currentMatchId=m.id;
            const home=team(m.homeId),away=team(m.awayId),lg=LEAGUES[G.leagueKey]||{};
            const h=document.getElementById('m-home'),a=document.getElementById('m-away'),hr=document.getElementById('m-home-rat'),ar=document.getElementById('m-away-rat'),sc=document.getElementById('m-score'),st=document.getElementById('m-status'),btn=document.getElementById('playBtn');
            if(h)h.innerHTML=crest(home.name,home.emoji,26)+' '+home.name;if(a)a.innerHTML=crest(away.name,away.emoji,26)+' '+away.name;
            if(hr)hr.textContent=(lg.flag||'')+' Force : '+clubRating(home)+(m.homeId===state.playerId?' 🏠':'');if(ar)ar.textContent=(lg.flag||'')+' Force : '+clubRating(away)+(m.awayId===state.playerId?' 🏠':'');
            if(sc)sc.textContent='– : –';if(st)st.textContent=state.competition+' · '+round.name;if(btn){btn.disabled=false;btn.textContent='Coup d’envoi · Coupe ▶';}
            if(typeof saveGame==='function')saveGame();return {hasPlayerMatch:true,round,match:m};}
        finalizeRound(round);
        return {hasPlayerMatch:false,round};
    }
    function completePlayerMatch(data) {
        const state=G.cup, fixtureId=G.activeMatch&&G.activeMatch.fixtureId;
        if(!state||!fixtureId)return null;
        const round=state.rounds.find(r=>r.matches.some(m=>m.id===fixtureId));
        const match=round&&round.matches.find(m=>m.id===fixtureId);
        if(!match||match.status==='played')return match;
        match.homeGoals=data.homeGoals;match.awayGoals=data.awayGoals;match.extraTime=!!data.extraTime;match.penalties=data.penalties||null;match.winnerId=data.winnerId;match.status='played';
        const win=data.winnerId===state.playerId; const payout=win?300000:100000; G.money=(G.money||0)+payout;
        if(!win){state.playerEliminated=true;if(window.CareerDepth)CareerDepth.recordCupResult(round.index===state.rounds.length-1?'runner-up':'eliminated',state.competition);}
        if(win&&round.matches.length===1&&round.index===state.rounds.length-1) awardChampion(state.playerId);
        round.winnerIds=round.byes.filter(id=>id!==state.playerId);
        if(win)round.winnerIds.push(state.playerId);
        round.winnerIds.push(...round.matches.filter(m=>m!==match&&m.status==='played').map(m=>m.winnerId).filter(Boolean));
        if(round.matches.every(m=>m.status==='played')) finalizeRound(round);
        state.currentMatchId=null;G.activeMatch=null;G.matchContext=null;
        G.lastCupMatch=JSON.parse(JSON.stringify(match));
        if(typeof saveGame==='function')saveGame();
        return match;
    }
    function render() {
        const el=document.getElementById('cup-content');if(!el||!G||!G.cup)return;
        const state=G.cup, name=state.competition||'Coupe nationale';
        let html='<div class="section-title">'+name+'</div><p class="cup-intro">Tableau à élimination directe · '+state.entrants.length+' clubs · match unique, prolongation et tirs au but si nécessaire.</p>';
        if(state.playerEliminated)html+='<div class="cup-status">Parcours terminé. Suivez les résultats jusqu’à la finale.</div>';
        else if(state.championId===state.playerId)html+='<div class="cup-status cup-champion">🏆 Vous avez remporté la coupe.</div>';
        state.rounds.forEach(r=>{html+='<section class="cup-round"><h3>'+r.name+' <small>'+r.date+'</small></h3><div class="cup-ties">';
            r.byes.forEach(id=>{const c=team(id);html+='<div class="cup-tie '+(id===state.playerId?'cup-me':'')+'"><span>'+c.name+'</span><b>Exempt</b></div>';});
            r.matches.forEach(m=>{const h=team(m.homeId),a=team(m.awayId), me=m.homeId===state.playerId||m.awayId===state.playerId;const score=m.status==='played'?m.homeGoals+'–'+m.awayGoals:'À jouer';const pens=m.penalties?' · t.a.b. '+m.penalties.join('–'):'';html+='<div class="cup-tie '+(me?'cup-me':'')+'"><span>'+h.name+'</span><b>'+score+'</b><span>'+a.name+'</span>'+(m.status==='played'?'<small>'+(m.winnerId===state.playerId?'✅ Qualifié':m.winnerId===h.id?h.name+' qualifié':a.name+' qualifié')+pens+'</small>':'')+'</div>';});
            html+='</div></section>';});
        if(state.championId){const c=team(state.championId);html+='<div class="cup-status cup-champion">Vainqueur : '+(c?c.name:'—')+'</div>';}
        el.innerHTML=html;
    }
    function currentPlayerTie() {if(!G||!G.cup||G.cup.playerEliminated)return null;for(const r of G.cup.rounds){const m=findPlayerTie(r);if(m)return {round:r,match:m};}return null;}
    function roundCount(n) { let c=0; while(n>1){let target=nextPowerFloor(n);if(target===n)target=Math.max(1,target/2);n=target;c++;}return c; }
    function scheduleDates(year, blocked) {
        const used=new Set(blocked||[]), out=[];
        for(let i=0;i<roundCount(entrants().length);i++){
            let d=fixtureDate(year,i), guard=0;
            while(used.has(d)&&guard++<20) d=new Date(Date.parse(d+'T12:00:00Z')+3*864e5).toISOString().slice(0,10);
            if (G.date && d < G.date) { d=G.date; while(used.has(d)) d=new Date(Date.parse(d+'T12:00:00Z')+1*864e5).toISOString().slice(0,10); }
            used.add(d);out.push(d);
        }
        return out;
    }
    function setDates(list) { if(!G.cup)return;G.cup.dates=list.slice();G.cup.rounds.forEach(r=>{if(r.status!=='played')r.date=list[r.index]||r.date;}); }
    window.CUP={newSeason,processDate,completePlayerMatch,render,currentPlayerTie,team,keyOf,getState:()=>G&&G.cup,scheduleDates,roundCount,setDates};
})();
