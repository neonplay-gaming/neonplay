/* NeonPlay Premium Player Hub — client-side features; progress is saved per browser. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const KEYS = {
    xp: 'neonplay_xp_v1',
    achievements: 'neonplay_achievements_v1',
    daily: 'neonplay_daily_reward_v1',
    challenge: 'neonplay_weekly_challenge_v1',
    plays: 'neonplay_play_count_v1'
  };
  const read = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const today = () => new Date().toISOString().slice(0,10);
  const weekKey = () => { const d = new Date(); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const levelFor = xp => Math.floor(Math.max(0,xp)/100)+1;
  const state = () => ({xp: Math.max(0, Number(read(KEYS.xp,0))||0), achievements: read(KEYS.achievements,[]), plays: Math.max(0,Number(read(KEYS.plays,0))||0)});
  const style = document.createElement('style');
  style.textContent = `
    .np-hub{margin:22px 0 28px;padding:clamp(16px,3vw,26px);border:1px solid #42f5ff55;border-radius:22px;background:radial-gradient(ellipse at 0 0,#17325499,transparent 55%),linear-gradient(135deg,#111831,#0b1022);box-shadow:0 18px 55px #0004}
    .np-hub-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}.np-kicker{color:#42f5ff;font-size:.75rem;font-weight:900;letter-spacing:.14em}.np-hub h2{margin:3px 0 6px;font-size:clamp(1.35rem,3vw,2rem)}.np-muted{color:#a3aec9;font-size:.9rem}
    .np-hub-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}.np-stat{padding:14px;border:1px solid #ffffff16;border-radius:15px;background:#050a19a8;min-width:0}.np-stat strong{display:block;font-size:clamp(1.15rem,3vw,1.65rem);color:#f4f7ff;overflow-wrap:anywhere}.np-stat span{font-size:.78rem;color:#a3aec9}
    .np-progress{height:8px;border-radius:99px;background:#ffffff16;overflow:hidden;margin:10px 0 6px}.np-progress span{display:block;height:100%;width:0;background:linear-gradient(90deg,#42f5ff,#a879ff,#ff3bd4);transition:width .25s}
    .np-hub-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.np-hub-actions button{max-width:100%}.np-achievements{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.np-achievement{font-size:.78rem;padding:7px 10px;border-radius:999px;border:1px solid #a879ff66;background:#a879ff16}.np-achievement.locked{opacity:.48;border-color:#ffffff22;background:#ffffff08}
    .np-notice{font-size:.84rem;color:#a3aec9;margin:12px 0 0}.np-challenge{margin-top:14px;padding:13px;border-radius:14px;border:1px solid #ff3bd455;background:#ff3bd40c}
    @media(max-width:650px){.np-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.np-hub{margin:16px 0;padding:15px}.np-hub-actions .btn{flex:1}.player-tools{gap:8px}.player-chip{font-size:.82rem;padding:8px 10px}nav{gap:8px;flex-wrap:wrap}nav .links{order:3;width:100%;overflow-x:auto;white-space:nowrap;padding:4px 0}nav .links a{font-size:.82rem}#soundToggle{display:none}}
    @media(prefers-reduced-motion:reduce){.np-progress span{transition:none}}
  `;
  document.head.append(style);

  function ensureHub() {
    if ($('#npPlayerHub')) return $('#npPlayerHub');
    const hub = document.createElement('section');
    hub.id = 'npPlayerHub'; hub.className = 'np-hub'; hub.setAttribute('aria-labelledby','npHubTitle');
    hub.innerHTML = `
      <div class="np-hub-head"><div><div class="np-kicker">PLAYER HQ / SEASON 01</div><h2 id="npHubTitle">Your Neon Journey</h2><div class="np-muted" id="npWelcome">Build your streak, earn XP, unlock badges.</div></div><button class="btn secondary" id="npClaim" type="button">🎁 Claim daily reward</button></div>
      <div class="np-hub-grid">
        <div class="np-stat"><strong id="npLevel">1</strong><span>Player level</span></div>
        <div class="np-stat"><strong id="npXP">0 XP</strong><span>Total experience</span></div>
        <div class="np-stat"><strong id="npPlays">0</strong><span>Games launched</span></div>
        <div class="np-stat"><strong id="npBadges">0/5</strong><span>Achievements</span></div>
      </div>
      <div class="np-progress" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="npLevelBar"></span></div><div class="np-muted" id="npLevelHint">0 / 100 XP to next level</div>
      <div class="np-challenge"><strong>⚡ Weekly challenge: Arcade Explorer</strong><div class="np-muted" id="npChallengeText">Launch 5 games this week to earn 50 bonus XP.</div><div class="np-progress"><span id="npChallengeBar"></span></div></div>
      <div class="np-achievements" id="npAchievementList" aria-label="Achievements"></div>
      <div class="np-hub-actions"><button class="btn secondary" id="npProfile" type="button">👤 Player profile</button><button class="btn secondary" id="npGoFavorites" type="button">❤️ Favorites</button><button class="btn secondary" id="npGoGames" type="button">🎮 Explore games</button></div>
      <p class="np-notice" id="npHubNotice">Progress and rewards are saved in this browser. Online sync is not enabled for these features yet.</p>`;
    const target = $('#games') || $('.featured') || document.body;
    target.parentNode.insertBefore(hub, target);
    $('#npClaim').addEventListener('click', claimDaily);
    $('#npProfile').addEventListener('click', () => { if (typeof window.openAuth === 'function') window.openAuth(); else $('#profileButton')?.click(); });
    $('#npGoFavorites').addEventListener('click', () => { $('#showFavorites')?.click(); $('#favoriteShelf')?.scrollIntoView({behavior:'smooth',block:'start'}); });
    $('#npGoGames').addEventListener('click', () => $('#games')?.scrollIntoView({behavior:'smooth',block:'start'}));
    return hub;
  }
  const badges = [
    {id:'first', name:'✨ First Steps', test:s=>s.plays>=1},
    {id:'explorer', name:'🧭 Explorer', test:s=>s.plays>=5},
    {id:'regular', name:'🔥 Regular', test:s=>s.plays>=10},
    {id:'century', name:'💯 Century', test:s=>s.xp>=100},
    {id:'veteran', name:'👑 Neon Veteran', test:s=>s.xp>=500}
  ];
  function awardXP(amount, reason) {
    const s = state(); s.xp += amount; write(KEYS.xp,s.xp);
    const wk = read(KEYS.challenge,{week:weekKey(),plays:0,done:false});
    const current = wk.week===weekKey()?wk:{week:weekKey(),plays:0,done:false};
    current.plays = Math.max(0,Number(current.plays)||0);
    if (reason === 'play') {
      s.plays += 1; write(KEYS.plays,s.plays); current.plays += 1;
      if (current.plays >= 5 && !current.done) { current.done = true; s.xp += 50; write(KEYS.xp,s.xp); toast('Weekly challenge complete! +50 bonus XP 🎉'); }
    }
    write(KEYS.challenge,current);
    const unlocked = read(KEYS.achievements,[]);
    badges.forEach(b=>{if(b.test(state())&&!unlocked.includes(b.id)){unlocked.push(b.id);toast('Achievement unlocked: '+b.name);}});
    write(KEYS.achievements,unlocked); renderHub();
  }
  function toast(message) {
    let n=$('#npToast'); if(!n){n=document.createElement('div');n.id='npToast';n.setAttribute('role','status');n.style.cssText='position:fixed;z-index:10001;bottom:18px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);padding:12px 17px;border:1px solid #42f5ff99;border-radius:13px;background:#0b1428;color:#f4f7ff;box-shadow:0 8px 35px #0008;text-align:center;font-weight:800';document.body.append(n)} n.textContent=message; n.hidden=false; clearTimeout(toast.timer); toast.timer=setTimeout(()=>{n.hidden=true},3000);
  }
  function claimDaily() {
    const claim=read(KEYS.daily,{date:''});
    if(claim.date===today()){toast('Daily reward already claimed. Kal phir aana!');return;}
    const streak=claim.date===new Date(Date.now()-86400000).toISOString().slice(0,10)?Math.min(7,(Number(claim.streak)||0)+1):1;
    write(KEYS.daily,{date:today(),streak});
    const reward=25+Math.min(35,(streak-1)*5);
    awardXP(reward,'daily');
    toast('Daily reward claimed: +'+reward+' XP · '+streak+' day streak 🎁');
  }
  function renderHub() {
    const hub=ensureHub(); const s=state(); const level=levelFor(s.xp), within=s.xp%100, unlocked=read(KEYS.achievements,[]);
    $('#npLevel').textContent=level; $('#npXP').textContent=s.xp+' XP'; $('#npPlays').textContent=s.plays; $('#npBadges').textContent=unlocked.length+'/'+badges.length;
    $('#npLevelBar').style.width=within+'%'; const bar=$('.np-progress[role="progressbar"]'); if(bar)bar.setAttribute('aria-valuenow',String(within));
    $('#npLevelHint').textContent=within+' / 100 XP to next level'; const claim=read(KEYS.daily,{date:''}); const claimed=claim.date===today();
    $('#npClaim').textContent=claimed?'✅ Daily reward claimed':'🎁 Claim daily reward'; $('#npClaim').disabled=claimed; $('#npClaim').style.opacity=claimed?'.7':'1';
    const wk=read(KEYS.challenge,{week:weekKey(),plays:0,done:false}); const ch=wk.week===weekKey()?wk:{week:weekKey(),plays:0,done:false};
    $('#npChallengeText').textContent=ch.done?'Challenge complete — +50 bonus XP earned!':Math.min(5,ch.plays)+' / 5 games launched · '+(5-Math.min(5,ch.plays))+' more for +50 XP';
    $('#npChallengeBar').style.width=(Math.min(5,ch.plays)/5*100)+'%';
    const list=$('#npAchievementList'); list.replaceChildren(); badges.forEach(b=>{const el=document.createElement('span');el.className='np-achievement'+(unlocked.includes(b.id)?'':' locked');el.textContent=(unlocked.includes(b.id)?'✓ ':'🔒 ')+b.name;el.title=unlocked.includes(b.id)?'Unlocked':'Not unlocked yet';list.append(el)});
    const player=localStorage.getItem('neonplay_player_v1')||'Guest'; $('#npWelcome').textContent='Welcome, '+player+' · Level '+level+' · Keep the streak alive.';
  }
  function enhanceSearch() {
    const search=$('#search'); if(!search || search.dataset.npEnhanced) return; search.dataset.npEnhanced='1';
    search.placeholder='Search games, genres, or keywords…';
    const old=window.filterGames;
    if(typeof old==='function') window.filterGames=function(){old();const q=search.value.trim().toLowerCase();document.querySelectorAll('#grid .game').forEach(card=>{const hay=((card.dataset.name||'')+' '+(card.dataset.category||'')+' '+(card.querySelector('.tag')?.textContent||'')+' '+(card.querySelector('h3')?.textContent||'')+' '+(card.querySelector('.body p')?.textContent||'')).toLowerCase();if(q&&!hay.includes(q))card.classList.add('hidden');});};
    search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();document.querySelectorAll('#grid .game').forEach(card=>{const hay=((card.dataset.name||'')+' '+(card.dataset.category||'')+' '+(card.querySelector('.tag')?.textContent||'')+' '+(card.querySelector('h3')?.textContent||'')+' '+(card.querySelector('.body p')?.textContent||'')).toLowerCase(); if(q&&!hay.includes(q))card.classList.add('hidden'); else if(!q)card.classList.remove('hidden');});});
  }
  function installHooks() {
    if(typeof window.launch==='function'&&!window.launch.__npWrapped){const old=window.launch;const wrapped=function(...args){awardXP(5,'play');return old.apply(this,args)};wrapped.__npWrapped=true;window.launch=wrapped;}
    if(typeof window.saveHighScore==='function'&&!window.saveHighScore.__npWrapped){const old=window.saveHighScore;const wrapped=async function(game,score){if(Number.isFinite(score)&&score>=0)awardXP(Math.min(25,Math.floor(score/10)),'score');return old.apply(this,arguments)};wrapped.__npWrapped=true;window.saveHighScore=wrapped;}
    const profile=$('#profileButton'); if(profile&&!profile.dataset.npBound){profile.dataset.npBound='1';profile.addEventListener('click',()=>setTimeout(renderHub,100));}
    const name=$('#displayNameInput'); const save=$('#saveProfile'); if(save&&!save.dataset.npBound){save.dataset.npBound='1';save.addEventListener('click',()=>setTimeout(renderHub,150));}
    document.addEventListener('click',e=>{const b=e.target.closest('[data-filter],[data-side-filter]');if(b)setTimeout(enhanceSearch,0);});
  }
  function init(){ensureHub();enhanceSearch();installHooks();renderHub();setInterval(()=>{installHooks();},800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();