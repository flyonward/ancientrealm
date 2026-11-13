'use strict';
let LAY={a:0},FREEZE=null,VIEW={z:1,tx:0,ty:0,supp:0};
let g=null,U={stack:[],acts:[],pendEnd:false,placeSnap:null,placeIdx:0,locked:false},opts={mm:false,l:[],useMs:true};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const RANKS=[[70,'Legendary'],[65,'Valiant'],[60,'Noble'],[55,'Respectable'],[50,'Adequate'],[0,'Ruinous']];
const rank=p=>RANKS.find(r=>p>=r[0])[1];
const RESG=['gold',...RES];
/* ---------- setup ---------- */
function newGame(o){
 let d=Object.keys(CARDS).filter(k=>CARDS[k].kind==='district'&&CARDS[k].set==='base');
 if(o.mm){shuffle(d);d=d.slice(3).concat(shuffle(Object.keys(CARDS).filter(k=>CARDS[k].set==='mm')).slice(0,3))}
 g={dd:shuffle(d),wd:shuffle(Object.keys(CARDS).filter(k=>CARDS[k].kind==='wonder')),market:[],realm:[],aband:0,
  st:{gold:3,wheat:1,wood:1,stone:1},pend:null,phase:'play',turn:{acts:0,res:0,cit:0,baz:0,car:0},refill4:false,need:0,takenKind:null,
  lead:null,msc:null,useMs:o.useMs,tc:1};
 for(let i=0;i<2;i++){g.market.push(g.dd.shift(),g.wd.shift())}
 const pool=shuffle(Object.keys(LEADERS).filter(k=>o.l.includes(+k[1])));
 if(pool.length>=2){g.lead={id:pool[0],key:LEADERS[pool[0]][0]};const m=back(pool[1]);g.msc={id:m,key:MILESTONES[m][0],met:false}}
 U={stack:[],acts:[],pendEnd:false,placeSnap:null,placeIdx:0,locked:false};VIEW={z:1,tx:0,ty:0,supp:0};
 $('#menu').hidden=true;$('#game').hidden=false;render();
}
/* ---------- realm helpers ---------- */
const def=id=>CARDS[id];
function tops(G){const m=new Map();G.realm.forEach(e=>{for(let i=0;i<3;i++)m.set(e.s+i,e)});return m}
const bAt=(e,s)=>def(e.id).blocks.find(b=>s-e.s>=b.x&&s-e.s<b.x+b.w);
function range(G){if(!G.realm.length)return[0,-1];let a=1e9,z=-1e9;G.realm.forEach(e=>{a=Math.min(a,e.s);z=Math.max(z,e.s+2)});return[a,z]}
function vis(G){const T=tops(G),[a,z]=range(G),o=[],seen=new Set();for(let s=a;s<=z;s++){const e=T.get(s);if(!e)continue;const b=bAt(e,s),k=e.id+b.x;if(seen.has(k))continue;seen.add(k);o.push({e,b,s0:e.s+b.x,w:b.w,k})}return o}
const nt=(G,t)=>vis(G).filter(v=>v.b.t===t).length;
const cits=G=>nt(G,'crown')+nt(G,'commoner');
const msOn=(G,k)=>G.useMs&&G.msc&&G.msc.met&&G.msc.key===k;
function ev(G){if(!G.dd.length)return null;if(msOn(G,'endure')&&G.wd.length>1)return null;return EV[back(G.dd[0])][0]}
const fxOn=(G,fx)=>!(msOn(G,'bide')&&G.dd.length>0)&&vis(G).some(v=>v.b.fx===fx);
const misf=(G,fx)=>ev(G)!=='gods'&&vis(G).some(v=>v.b.fx===fx);
const cap=G=>msOn(G,'push')?5:7;
function gain(G,t,n){G.st[t]=Math.max(0,Math.min(cap(G),G.st[t]+n))}
function neigh(G,v){const T=tops(G),o=[];[v.s0-1,v.s0+v.w].forEach(s=>{const e=T.get(s);if(e)o.push(bAt(e,s))});return o}
/* ---------- scoring ---------- */
function mineScore(G,v){const cr=nt(G,'crown'),cm=nt(G,'commoner'),b=v.b;
 switch(b.sc){case'perWonder':return nt(G,'wonder');case'moreComm':return cm>cr?5:0;
 case'adj':return b.arg*neigh(G,v).filter(x=>x.t==='wonder').length;case'perCrown':return 2*cr;
 case'perRes':return 2*(nt(G,'field')+nt(G,'forest')+nt(G,'quarry'));case'perAband':return 2*G.aband;
 case'grp':return 3*Math.max(cr,cm);case'grp5':return Math.max(cr,cm)>2?5:0;
 case'monAdj':return 3*vis(G).filter(x=>x.b.t==='monument'&&neigh(G,x).some(y=>y.t==='wonder')).length;
 case'noMisf':return nt(G,'misfortune')?0:7}return 0}
function scoreOf(G){const cr=nt(G,'crown'),cm=nt(G,'commoner'),rows=[];let tot=0;
 vis(G).forEach(v=>{const b=v.b;let p;if(b.t==='wonder')p=b.pts+(b.per==='crown'?cr:b.per==='commoner'?cm:0);
  else if(b.t==='monument'||b.t==='misfortune')p=b.pts;else if(b.t==='mine')p=mineScore(G,v);else return;rows.push([b.nm,p]);tot+=p});
 const s=Math.floor(G.st.gold/3)+Math.floor((G.st.wheat+G.st.wood+G.st.stone)/2);rows.push(['Storage',s]);tot+=s;return{tot,rows}}
/* ---------- leaders ---------- */
const W=(G,fx)=>vis(G).some(v=>v.b.fx===fx),res=G=>G.st.wheat+G.st.wood+G.st.stone;
const LR={
 alex:[60,['14+ blocks (not wonders)',G=>vis(G).filter(v=>v.b.t!=='wonder').length>=14]],
 caesar:[60,['6+ citizens',G=>cits(G)>=6]],
 cleo:[60,['more quarries than fields',G=>nt(G,'quarry')>nt(G,'field')],['more fields than forests',G=>nt(G,'field')>nt(G,'forest')]],
 midas:[65,['5+ gold in storage',G=>G.st.gold>=5]],
 ptolemy:[65,['The Lighthouse',G=>W(G,'lighthouse')],['more crown than commoner citizens',G=>nt(G,'crown')>nt(G,'commoner')]],
 phidias:[60,['The Statue of Zeus',G=>W(G,'zeus')],['6+ mines',G=>nt(G,'mine')>=6]],
 artemisia:[65,['The Mausoleum',G=>W(G,'mausoleum')],['equal crown and commoner citizens',G=>nt(G,'crown')===nt(G,'commoner')]],
 khufu:[60,['The Great Pyramids',G=>W(G,'pyramids')],['2+ quarries',G=>nt(G,'quarry')>=2]],
 hammurabi:[60,['more citizens than mines',G=>cits(G)>nt(G,'mine')]],
 ramses:[55,['5+ wonders',G=>nt(G,'wonder')>=5],['6+ resources in storage',G=>res(G)>=6]],
 xenophon:[55,['5+ mines',G=>nt(G,'mine')>=5],['a wonder at each edge',G=>{const V=vis(G);return V.length&&V[0].b.t==='wonder'&&V[V.length-1].b.t==='wonder'}]],
 nero:[60,['0-1 citizens',G=>cits(G)<=1],['more gold than resources',G=>G.st.gold>res(G)]],
 nefertiti:[55,['3 or fewer wonders',G=>nt(G,'wonder')<=3]],
 croesus:[55,['The Temple of Artemis',G=>W(G,'temple')],['2 or fewer mines',G=>nt(G,'mine')<=2]],
 hannibal:[60,['more mines than wonders',G=>nt(G,'mine')>nt(G,'wonder')]],
 chares:[65,['The Colossus',G=>W(G,'colossus')],['more commoner than crown citizens',G=>nt(G,'commoner')>nt(G,'crown')]],
 genghis:[55,['6+ wonders',G=>nt(G,'wonder')>=6]],
 nebuchadnezzar:[60,['The Hanging Gardens',G=>W(G,'gardens')],['2+ crown and 2+ commoner citizens',G=>nt(G,'crown')>=2&&nt(G,'commoner')>=2]]};
function leaderEval(G){if(!G.lead)return null;const [p,...r]=LR[G.lead.key],items=r.map(([t,f])=>[t,f(G)]),sc=scoreOf(G).tot;items.push([p+' points',sc>=p]);
 const ms=!G.useMs||G.msc.met;return{items,ms,win:ms&&items.every(i=>i[1])}}
function msCheck(x){x=x||{};if(!g.useMs||!g.msc||g.msc.met)return;const k=g.msc.key;
 const h={spare:()=>x.bw===2,royal:()=>x.act==='crown',raze:()=>x.act==='forest',evolve:()=>g.turn.acts>=3,stimulate:()=>x.buy2,honor:()=>x.adj,
 endure:()=>g.realm.filter(e=>def(e.id).kind==='district').length>=2,ambition:()=>x.bw===3,shortage:()=>x.act==='mine',hireless:()=>cits(g)>=4,
 bide:()=>g.market.filter(i=>def(i).kind==='wonder').length>=3,push:()=>RESG.some(r=>g.st[r]>=4),brace:()=>x.act==='field',
 moderation:()=>nt(g,'field')&&nt(g,'forest')&&nt(g,'quarry'),overwork:()=>x.p5,expensive:()=>x.act==='quarry',judicious:()=>x.ab,commoners:()=>x.act==='commoner'}[k];
 if(h&&h()){g.msc.met=true;RESG.forEach(r=>gain(g,r,0));toast('Milestone met: '+MILESTONES[g.msc.id][1])}}
/* ---------- UI helpers ---------- */
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2400)}
function ask(title,options){return new Promise(r=>{const m=$('#modal');m.hidden=false;m.innerHTML=`<div class="box"><h3>${title}</h3><div class="opts">${options.map((o,i)=>`<button class="opt" data-i="${i}">${o.l}</button>`).join('')}</div><button class="ghost" data-c>Cancel</button></div>`;
 m.onclick=e=>{const b=e.target.closest('[data-i]');if(b){m.hidden=true;r(options[+b.dataset.i].v)}else if(e.target.closest('[data-c]')||e.target===m){m.hidden=true;r(null)}}})}
const resOpts=(list,n)=>list.map(t=>({l:`${ic(t)} ${t}`+(n?` ×${n}`:''),v:t}));
async function pickAny(n,why){const o=[];for(let i=0;i<n;i++){const t=await ask2(`${why||'Gain'} - choose resource${n>1?` (${i+1}/${n})`:''}`,resOpts(RES));if(!t)return false;o.push(t)}o.forEach(t=>gain(g,t,1));return true}
async function act(fn){if(g.phase==='over')return;if(U.pendEnd){U.stack=[];U.acts=[];U.pendEnd=false}
 const s=JSON.stringify(g),first=!U.stack.length;if(first)U.stack.push(s);const r=await fn();if(r===false){g=JSON.parse(s);if(first)U.stack.pop()}else msCheck({});render()}
function lock(){U.acts=[];if(g.pend)U.locked=true}
function undoTurn(){if(!U.stack.length)return;g=JSON.parse(U.stack[0]);U.stack=[];U.acts=[];render()}
let REPLAY=null,LOG=null;
async function ask2(t,o){if(REPLAY&&REPLAY.length)return REPLAY.shift();const r=await ask(t,o);if(LOG)LOG.push(r);return r}
/* ---------- rules: costs & activation ---------- */
const FX={field:'mausoleum',forest:'temple',quarry:'lighthouse'},MF={field:'drought',forest:'blight',quarry:'earthquake'};
function actInfo(v){const b=v.b,t=b.t,p=g.pend;if(!['field','forest','quarry','mine','crown','commoner','monument'].includes(t))return{err:'Nothing to activate here'};
 if(p.done[v.k])return{err:'Already activated',done:1};
 if(msOn(g,'honor')&&def(p.id).kind==='wonder')return{err:'Honor the wonders: no activation when placing a wonder'};
 if(msOn(g,'evolve')&&g.turn.acts>=2)return{err:'Evolve the realm: max 2 activations per turn'};
 const isR=FX[t],isC=t==='crown'||t==='commoner';
 if(msOn(g,'moderation')&&isR&&g.turn.res>=1)return{err:'Everything in moderation: 1 gathering block per turn'};
 if(msOn(g,'overwork')&&isC&&g.turn.cit>=1)return{err:'Overwork: 1 citizen per turn'};
 let c=0;
 if(isR){c=1+(misf(g,MF[t])?1:0);if(msOn(g,'brace')&&t!=='field')c++;if(msOn(g,'expensive')&&t!=='quarry')c++;if(msOn(g,'raze')&&t!=='forest')c++}
 if(isC){const free=ev(g)==='unites'||(t==='crown'&&fxOn(g,'zeus'))||(t==='commoner'&&fxOn(g,'gardens'));
  c=free?0:1+(misf(g,'strike')?1:0)+(msOn(g,'royal')&&t==='crown'?2:0)+(msOn(g,'commoners')&&t==='commoner'?2:0)}
 const k=b.cit;
 if(k==='king'&&!vis(g).some(x=>x.b.cit==='queen'))return{err:'The Queen is not in the realm'};
 if(k==='queen'&&!vis(g).some(x=>x.b.cit==='king'))return{err:'The King is not in the realm'};
 if(k==='merchant'&&!res(g))return{err:'You need a resource to trade'};
 if(k==='supplier'&&!RES.some(r=>!g.st[r]))return{err:'No empty resource card'};
 if(g.st.gold<c)return{err:`Need ${c} gold`};
 return{cost:c}}
async function actBody(v,i){const b=v.b,t=b.t,k=b.cit;g.st.gold-=i.cost;
  if(FX[t]){let n=1+(fxOn(g,FX[t])?1:0)+(ev(g)==='productivity'?1:0);gain(g,b.res,n)}
  else if(t==='mine'){let n=2+(fxOn(g,'colossus')?1:0)+(ev(g)==='goldrush'?1:0)-(misf(g,'cavein')?1:0)-(msOn(g,'shortage')&&ev(g)!=='goldrush'?1:0);gain(g,'gold',Math.max(0,n))}
  else if(t==='monument'){if(!await pickAny(1,'Monument'))return false}
  else if(k==='king')gain(g,'gold',4);
  else if(k==='queen'){if(!await pickAny(2,'Queen'))return false}
  else if(k==='treasurer')gain(g,'gold',g.st.gold);
  else if(k==='collector')gain(g,'gold',2*nt(g,'crown'));
  else if(k==='bishop'){if(!await pickAny(nt(g,'commoner'),'Bishop'))return false}
  else if(k==='mason')gain(g,'stone',g.st.stone);else if(k==='woodsman')gain(g,'wood',g.st.wood);else if(k==='farmer')gain(g,'wheat',g.st.wheat);
  else if(k==='merchant'){const a=await ask2('Merchant: give 1 of',resOpts(RES.filter(r=>g.st[r])));if(!a)return false;
   const r=await ask2('...to get 3 of',resOpts(RES.filter(x=>x!==a)));if(!r)return false;g.st[a]--;gain(g,r,3)}
  else if(k==='supplier')RES.forEach(r=>{if(!g.st[r])gain(g,r,1)});
  else if(k==='planner')gain(g,'gold',2*nt(g,'monument'));else if(k==='advisor')gain(g,'gold',2*nt(g,'misfortune'));
  else if(k==='builder'){if(!await pickAny(nt(g,'monument'),'Builder'))return false}
  else if(k==='salvager'){if(!await pickAny(nt(g,'misfortune'),'Salvager'))return false}
  g.pend.done[v.k]=1;g.turn.acts++;if(FX[t])g.turn.res++;if(k)g.turn.cit++;msCheck({act:t})}
async function runAct(v,ch){const inf=actInfo(v);if(inf.err)return false;const snap=JSON.stringify(g);LOG=[];REPLAY=ch?[...ch]:null;
 const ok=await actBody(v,inf);REPLAY=null;const log=LOG;LOG=null;if(ok===false){g=JSON.parse(snap);return false}U.acts.push({k:v.k,ch:log,snap})}
async function activate(v){const i=actInfo(v);
 if(i.done){const idx=U.acts.findIndex(a=>a.k===v.k);if(idx<0)return toast('Locked in by a trade - use Reset turn to start over');
  return act(async()=>{const later=U.acts.slice(idx+1);g=JSON.parse(U.acts[idx].snap);U.acts=U.acts.slice(0,idx);let d=0;
   for(const r of later){const w=vis(g).find(x=>x.k===r.k);if(!w||await runAct(w,r.ch)===false)d++}if(d)toast('Some later activations could no longer be paid for and were removed')})}
 if(i.err)return toast(i.err);
 await act(async()=>{if(await runAct(v)===false)return false})}
/* ---------- placing ---------- */
function wcost(id){const b=def(id).blocks.find(x=>x.t==='wonder');return{c:Object.assign({wood:0,stone:0,wheat:0},b.cost),gold:msOn(g,'spare')?1:0,extra:msOn(g,'ambition')?1:0,less:ev(g)==='newplans'?1:0}}
function affordable(id){if(def(id).kind!=='wonder')return true;const w=wcost(id);if(g.st.gold<w.gold)return false;
 let def_=0,tot=0;RES.forEach(r=>{def_+=Math.max(0,w.c[r]-g.st[r]);tot+=Math.min(g.st[r],w.c[r])});if(def_>w.less)return false;return res(g)-tot>=w.extra-(w.less-def_>0?0:0)}
function legal(id,s){if(!g.realm.length)return s===0;const[a,z]=range(g);if(s<a-3||s>z+1)return false;const T=tops(g);
 for(let i=0;i<3;i++){const e=T.get(s+i);if(e&&bAt(e,s+i).t==='wonder')return false}return true}
async function place(id,idx,s){if(g.phase!=='play'||g.pend)return;
 if(!legal(id,s))return toast('Cannot place there (wonders cannot be covered)');
 if(!affordable(id))return toast('You cannot afford that wonder');
 await act(async()=>{const before=JSON.stringify(g);if(def(id).kind==='wonder'){const w=wcost(id),c=Object.assign({},w.c);g.st.gold-=w.gold;
   if(w.less){const o=RES.filter(r=>c[r]>0);const r=o.length>1?await ask('Pay 1 less of',resOpts(o)):o[0];if(o.length>1&&!r)return false;if(r)c[r]--}
   RES.forEach(r=>g.st[r]-=Math.min(c[r],g.st[r]));
   if(w.extra){const o=RES.filter(r=>g.st[r]>0);const r=o.length>1?await ask('Pay 1 extra resource',resOpts(o)):o[0];if(o.length>1&&!r)return false;if(r)g.st[r]--}}
  g.market.splice(idx,1);g.takenKind=def(id).kind;g.pend={id,s,done:{}};U.acts=[];U.placeSnap=before;U.placeIdx=idx;U.locked=false})}
async function confirmPlace(){if(!g.pend)return;await act(async()=>{const p=g.pend,D=def(p.id),T=tops(g),under=[],seen=new Set();
 for(let i=0;i<3;i++){const e=T.get(p.s+i);if(!e)continue;const b=bAt(e,p.s+i),k=e.id+b.x;if(!seen.has(k)){seen.add(k);under.push(b)}}
 U.acts=[];const pyr=fxOn(g,'pyramids');g.realm.push({id:p.id,s:p.s});g.pend=null;
 if(ev(g)==='economy')under.filter(b=>b.t==='misfortune').forEach(()=>gain(g,'gold',3));
 if(D.kind==='wonder'){const wb=D.blocks.find(b=>b.t==='wonder'),bw=nt(g,'wonder');
  if(pyr){const r=await ask('Great Pyramids: gain',[...resOpts(RES),{l:ic('gold')+' 2 gold',v:'g'}]);if(!r)return false;r==='g'?gain(g,'gold',2):gain(g,r,1)}
  if(ev(g)==='prosperity')gain(g,'gold',2);
  const v=vis(g).find(x=>x.e.id===p.id&&x.b.t==='wonder');msCheck({bw,p5:wb.pts===5,adj:neigh(g,v).some(b=>b.t==='mine')})}
 else{const e=ev(g);if(e==='treasury')gain(g,'gold',2);if(e==='stockpile')gain(g,'stone',1);if(e==='harvest')gain(g,'wheat',1);if(e==='forestb')gain(g,'wood',1)}
 msCheck({});g.phase='draw';g.need=g.refill4?Math.max(1,4-g.market.length):1;g.refill4=false;autoDraw()})}
function decks(){return[['district',g.dd],['wonder',g.wd]].filter(d=>d[1].length)}
function autoDraw(){while(g.need>0){const d=decks();if(!d.length){g.need=0;break}
  let k=null;if(msOn(g,'hireless')&&d.some(x=>x[0]===g.takenKind))k=g.takenKind;else if(d.length===1)k=d[0][0];if(!k)return;drawFrom(k)}
 endTurn()}
function drawFrom(k){const d=k==='district'?g.dd:g.wd;g.market.push(d.shift());g.need--}
function draw(k){act(async()=>{drawFrom(k);autoDraw()})}
function endTurn(){g.phase='play';g.turn={acts:0,res:0,cit:0,baz:0,car:0};g.tc++;U.pendEnd=true;msCheck({});checkEnd()}
function checkEnd(){if(!g.market.length)return g.phase='over';
 const can=g.market.some(id=>def(id).kind==='district'||g.st.gold>=wcost(id).gold&&RES.reduce((s,r)=>s+Math.max(0,wcost(id).c[r]-g.st[r]),0)*2<=g.st.gold-wcost(id).gold+wcost(id).less*2);
 if(!can)g.phase='over'}
/* ---------- side actions ---------- */
function buyCost(){return msOn(g,'stimulate')&&ev(g)!=='bazaar'?3:2}
async function buyMenu(){const o=[];const c=buyCost();
 o.push({l:`Buy resource - ${c} ${ic('gold')}`,v:'buy'});
 if(ev(g)==='bazaar'&&g.turn.baz<2)o.push({l:`Bazaar: 1 ${ic('gold')} → resource (${2-g.turn.baz} left)`,v:'baz'});
 if(ev(g)==='caravan'&&g.turn.car<2)o.push({l:`Caravan: 1 resource → another (${2-g.turn.car} left)`,v:'car'});
 const m=await ask('Trade',o);if(!m)return;
 await act(async()=>{if(m==='buy'){if(g.st.gold<c){toast('Not enough gold');return false}const r=await ask('Gain 1',resOpts(RES));if(!r)return false;g.st.gold-=c;gain(g,r,1);msCheck({buy2:c===2});lock()}
  else if(m==='baz'){if(g.st.gold<1){toast('Not enough gold');return false}const r=await ask('Gain 1',resOpts(RES));if(!r)return false;g.st.gold--;gain(g,r,1);g.turn.baz++;lock()}
  else{const a=await ask('Give 1 of',resOpts(RES.filter(r=>g.st[r])));if(!a)return false;const r=await ask('Gain 1',resOpts(RES.filter(x=>x!==a)));if(!r)return false;g.st[a]--;gain(g,r,1);g.turn.car++;lock()}})}
async function abandonMenu(){if(misf(g,'obsession'))return toast('Obsession: you may not abandon wonders');
 const o=g.market.map((id,i)=>[id,i]).filter(x=>def(x[0]).kind==='wonder').map(([id,i])=>({l:def(id).blocks.find(b=>b.t==='wonder').nm,v:'m'+i}));
 if(g.wd.length)o.push({l:'Top of the wonder deck (unseen)',v:'d'});if(!o.length)return toast('No wonder to abandon');
 const w=await ask('Abandon which wonder?',o);if(!w)return;
 const r=await ask('Reward',[...(msOn(g,'judicious')?[]:[{l:ic('gold')+' 2 gold',v:'g'}]),{l:ic('any_resource')+' 1 resource',v:'r'}]);if(!r)return;
 await act(async()=>{if(r==='g')gain(g,'gold',2);else if(!await pickAny(1,'Abandon'))return false;
  if(w==='d')g.wd.shift();else g.market.splice(+w.slice(1),1);g.aband++;g.refill4=true;lock();msCheck({ab:1})})}
/* ---------- rendering ---------- */
let BW=60,HC=86;
function render(){if(!g)return;const sc=scoreOf(g);
 $('#score').innerHTML=`<b>${sc.tot}</b><span>${rank(sc.tot)}</span>`;$('#turn').textContent='Turn '+g.tc;
 $('#bUndoT').disabled=!U.stack.length;$('#bOk').disabled=!g.pend;
 const narrow=innerWidth<700,mcw=narrow?Math.floor((innerWidth-34)/3):Math.min(210,Math.floor(innerWidth*.14));
 document.documentElement.style.setProperty('--cw',mcw+'px');
 const hint=g.phase==='over'?'Game over':g.pend?'Tap glowing blocks to activate · drag the card to move or return it':g.phase==='draw'?'Tap a deck to add a card to the Market':'Drag a card from the Market into your realm';$('#hint').textContent=hint;
 const evk=ev(g);
 const deck=(k,arr)=>{const top=arr[0];const img=top?(k==='district'?back(top)+'_back':back(g.wd[0])+'_back'):null;
  return`<div class="deck ${g.phase==='draw'&&arr.length&&g.need>0?'draw':''}" data-deck="${k}">${img?`<img src="${IMG}${img}.webp" draggable="false">`:'<div class="empty">empty</div>'}<i>${arr.length}</i><em>${k==='district'?(evk?EV[back(g.dd[0])][1]:'No event'):'Wonders'}</em></div>`};
 $('#market').innerHTML=deck('district',g.dd)+g.market.map((id,i)=>`<div class="mc ${affordable(id)?'':'dim'} ${def(id).kind}" data-id="${id}" data-i="${i}"><img src="${IMG}${id}_front.webp" draggable="false"></div>`).join('')+deck('wonder',g.wd);
 $('#store').innerHTML=RESG.map(r=>`<div class="tile ${r}" data-r="${r}">${ic(r)}<b>${g.st[r]}</b><small>/${cap(g)}</small></div>`).join('')+
  `<button class="chip" id="bBuy">${ic('any_resource')} Trade</button><button class="chip" id="bAb">Abandon</button>`;
 const ob=[];if(g.lead){const L=g.lead.id,M=g.msc;const met=g.useMs&&M.met;
  ob.push(`<div class="obj ${met?'merged':''}"><div class="lead" data-hi="${L}_front"><img src="${IMG}${L}_front.webp" draggable="false"></div>${g.useMs?`<div class="ms" data-hi="${M.id}_back"><img src="${IMG}${M.id}_back.webp" draggable="false"></div>`:''}</div>`)}
 $('#objs').innerHTML=ob.join('')+(evk?`<div class="evt"><b>${ic('any_resource')} Event:</b> ${EV[back(g.dd[0])][1]}<br><small>${EV[back(g.dd[0])][2]}</small></div>`:'');
 renderRealm();if(g.phase==='over')showResults()}
function renderRealm(){const box=$('#realm'),[a0,z0]=range(g);let a=a0,z=z0;if(!g.realm.length){a=0;z=2}
 if(g.pend){a=Math.min(a,g.pend.s);z=Math.max(z,g.pend.s+2)}
 if(FREEZE){a=Math.min(a,FREEZE.a);z=Math.max(z,FREEZE.z)}
 LAY.a=a;
 const n=z-a+1,PAD=1.5,W=box.clientWidth-8,H=box.clientHeight-8;
 let bw=Math.min(W/(n+2*PAD),(H/2.16)*1047/752/3,115);bw=Math.max(bw,12);BW=bw;HC=bw*3*752/1047;
 const x0=s=>(s-a+PAD)*BW,ry=HC*1.08,tw=(n+2*PAD)*BW;
 let h=`<div id="ri" style="width:${tw}px;height:${HC*2.16}px">`;
 if(!g.realm.length)h+=`<div class="slotmark" style="left:${x0(0)}px;top:${ry}px;width:${3*BW}px;height:${HC}px">Place your first card here</div>`;
 g.realm.forEach(e=>h+=`<div class="pc" data-hi="${e.id}_front" style="left:${x0(e.s)}px;top:${ry}px;width:${3*BW}px;height:${HC}px"><img src="${IMG}${e.id}_front.webp" draggable="false"></div>`);
 if(g.pend){const p=g.pend;h+=`<div class="pc pend" data-hi="${p.id}_front" style="left:${x0(p.s)}px;top:${HC*.04}px;width:${3*BW}px;height:${HC}px"><img src="${IMG}${p.id}_front.webp" draggable="false"></div>`;
  const T=tops(g),seen=new Set();for(let i=0;i<3;i++){const s=p.s+i,e=T.get(s);if(!e)continue;const b=bAt(e,s),k=e.id+b.x;if(seen.has(k))continue;seen.add(k);
   const v={e,b,s0:e.s+b.x,w:b.w,k},inf=actInfo(v);h+=`<button class="act ${inf.done?'done':inf.err?'no':'ok'}" data-k="${k}" style="left:${x0(v.s0)}px;top:${ry}px;width:${v.w*BW}px;height:${HC}px">${inf.done?'✓':inf.err?'':(inf.cost?`-${inf.cost}${ic('gold')}`:'▶')}</button>`}}
 h+='<div class="ghost-pc" id="gh" hidden></div></div>';box.innerHTML=h;applyView()}
function showResults(){const sc=scoreOf(g),L=leaderEval(g),m=$('#modal');m.hidden=false;
 m.innerHTML=`<div class="box wide"><h2>${L&&L.win?'Victory!':'Game Over'}</h2><div class="big">${sc.tot} <span>${rank(sc.tot)}</span></div>
 <table>${sc.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>
 ${L?`<h4>${LEADERS[g.lead.id][1]}</h4><ul class="req">${L.items.map(i=>`<li class="${i[1]?'y':'n'}">${i[1]?'✔':'✘'} ${i[0]}</li>`).join('')}${g.useMs?`<li class="${L.ms?'y':'n'}">${L.ms?'✔':'✘'} Milestone: ${MILESTONES[g.msc.id][1]}</li>`:''}</ul>`:''}
 <div class="row"><button class="opt" data-new>New game</button><button class="ghost" data-undo>Reset turn</button></div></div>`;
 m.onclick=e=>{if(e.target.closest('[data-new]')){m.hidden=true;g=null;$('#game').hidden=true;$('#menu').hidden=false}else if(e.target.closest('[data-undo]')){m.hidden=true;undoTurn();if(g.phase==='over')g.phase='play';render()}}}
function scoreModal(){const sc=scoreOf(g),m=$('#modal');m.hidden=false;m.innerHTML=`<div class="box"><h3>Score: ${sc.tot} · ${rank(sc.tot)}</h3><table>${sc.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table><button class="ghost" data-c>Close</button></div>`;m.onclick=()=>m.hidden=true}
function zoom(hi){const z=$('#zoom');z.hidden=false;z.innerHTML=`<img src="${IMGHI}${hi}.webp">`;z.onclick=()=>z.hidden=true}
/* ---------- input ---------- */
let drag=null;
function slotAt(x){const ri=$('#ri');if(!ri)return null;const r=ri.getBoundingClientRect(),R=$('#realm').getBoundingClientRect();if(x<R.left||x>R.right)return null;
 if(!g.realm.length)return 0;const[a,z]=range(g);return Math.max(a-3,Math.min(z+1,Math.round((x-r.left)/(BW*VIEW.z)-3)+LAY.a))}
document.addEventListener('pointerdown',e=>{const pc=e.target.closest('.pc.pend');
 if(pc&&g&&g.phase==='play'&&g.pend&&$('#modal').hidden){drag={from:'pend',id:g.pend.id,i:U.placeIdx,oldS:g.pend.s,x:e.clientX,y:e.clientY,on:false,s:null,el:pc};return}
 const c=e.target.closest('.mc');
 if(c&&g)drag={id:c.dataset.id,i:+c.dataset.i,x:e.clientX,y:e.clientY,on:false,s:null,el:c,noplace:!(g.phase==='play'&&!g.pend&&$('#modal').hidden)}});
document.addEventListener('pointermove',e=>{if(!drag||drag.noplace)return;if(!drag.on&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){
  if(drag.from==='pend'){if(U.locked){toast('You traded after placing - use Reset turn to take the card back');drag=null;return}
   if(U.acts.length)toast('Card lifted: activations cleared');{const[a0,z0]=range(g);let fa=a0,fz=z0;if(!g.realm.length){fa=0;fz=2}FREEZE={a:Math.min(fa,g.pend.s),z:Math.max(fz,g.pend.s+2)}}g=JSON.parse(U.placeSnap);U.acts=[];render();drag.el=null}
  drag.on=true;clearTimeout(drag.t);
  const f=document.createElement('img');f.id='fly';f.src=IMG+drag.id+'_front.webp';f.style.width=BW*3+'px';document.body.append(f);drag.el&&drag.el.classList.add('lift')}
 if(!drag.on)return;e.preventDefault();const f=$('#fly');f.style.left=e.clientX-BW*1.5+'px';f.style.top=e.clientY-HC/2+'px';
 const rr=$('#realm').getBoundingClientRect(),over=e.clientY>rr.top-HC*.4&&e.clientY<rr.bottom;const gh=$('#gh');
 if(over){const s=slotAt(e.clientX,drag.id);drag.s=s;const ok=s!==null&&legal(drag.id,s)&&affordable(drag.id),a=LAY.a;
  gh.hidden=false;gh.className='ghost-pc '+(ok?'ok':'bad');gh.style.cssText=`left:${(s-a+1.5)*BW}px;top:${HC*1.08}px;width:${3*BW}px;height:${HC}px;background-image:url(${IMG+drag.id}_front.webp)`;drag.ok=ok;
  }
 else{gh.hidden=true;drag.s=null;drag.ok=false}},{passive:false});
document.addEventListener('pointerup',e=>{if(!drag)return;clearTimeout(drag.t);const d=drag;drag=null;const f=$('#fly');if(f)f.remove();if(d.el&&d.el.isConnected)d.el.classList.remove('lift');
 if(!d.on){zoom(d.id+'_front');return}const gh=$('#gh');if(gh)gh.hidden=true;
 FREEZE=null;
 if(d.from==='pend'){if(d.s!==null&&d.s!==undefined&&d.ok)place(d.id,d.i,d.s);
  else if(d.s!==null&&d.s!==undefined){toast(legal(d.id,d.s)?'You cannot afford that wonder':'Cannot place there - card put back');place(d.id,d.i,d.oldS)}
  else{toast('Card returned to the Market');render()}return}
 if(d.s!==null&&d.s!==undefined){if(d.ok)place(d.id,d.i,d.s);else if(!legal(d.id,d.s))toast('Cannot place there (wonders cannot be covered)');else toast('You cannot afford that wonder')}});
document.addEventListener('keydown',e=>{if(!g)return;if(e.key==='Escape'){if(drag){drag=null;FREEZE=null;$('#fly')?.remove()}$('#zoom').hidden=true}
 if(e.key==='Enter'&&g.pend)confirmPlace();if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undoTurn()}});
document.addEventListener('click',e=>{const t=e.target;if(!g)return;if(performance.now()<VIEW.supp)return;
 if(t.closest('#fit')){VIEW.z=1;VIEW.tx=0;VIEW.ty=0;applyView();return}
 const a=t.closest('.act');if(a){const v=vis(g).find(x=>x.k===a.dataset.k);if(v)activate(v);return}
 const dk=t.closest('.deck.draw');if(dk){draw(dk.dataset.deck);return}
 if(t.closest('#bOk'))confirmPlace();else if(t.closest('#bUndoT'))undoTurn();
 else if(t.closest('#bBuy'))buyMenu();else if(t.closest('#bAb'))abandonMenu();else if(t.closest('#scorebox'))scoreModal();
 else if(t.closest('.tile')&&RES.includes(t.closest('.tile').dataset.r))buyMenu();
 else if(t.closest('#bMenu'))ask('Menu',[{l:'Rules',v:'r'},{l:'Finish game now',v:'f'},{l:'New game',v:'n'}]).then(v=>{if(v==='r')showRules();if(v==='n'){g=null;$('#game').hidden=true;$('#menu').hidden=false}if(v==='f'){g.phase='over';render()}});
 else{const h=t.closest('[data-hi]');if(h)zoom(h.dataset.hi)}});
addEventListener('resize',()=>g&&render());
/* ---------- menu & rules ---------- */
function menuInit(){const ex=[['mm','Monuments & Misfortunes','Swaps 3 random districts for 3 new ones'],['l1','Leaders I','Alexander, Caesar, Cleopatra, Midas, Ptolemy, Phidias'],['l2','Leaders II','Artemisia, Khufu, Hammurabi, Ramses, Xenophon, Nero'],['l3','Leaders III','Nefertiti, Croesus, Hannibal, Chares, Genghis Khan, Nebuchadnezzar']];
 $('#exp').innerHTML=ex.map(([k,n,d])=>`<label class="ex"><input type="checkbox" data-ex="${k}"><span><b>${n}</b><small>${d}</small></span></label>`).join('')+
 `<label class="ex" id="msrow"><input type="checkbox" id="useMs" checked><span><b>Use milestone</b><small>Untick for an easier game (leader requirements only)</small></span></label>`;
 $('#start').onclick=()=>{const o={mm:$('[data-ex=mm]').checked,l:['l1','l2','l3'].filter(k=>$(`[data-ex=${k}]`).checked).map(k=>+k[1]),useMs:$('#useMs').checked};newGame(o)};
 $('#rulesBtn').onclick=showRules}
function showRules(){const m=$('#rules');m.hidden=false;m.innerHTML=`<div class="rbox"><button class="x" data-x>×</button><h2>How to play</h2>
<p><i>Build a realm of cards. Harvest, hire, build, and score as many points as you can before the Market runs dry.</i></p>
<h3>Setup</h3><p>Two decks: Districts and Wonders. Two cards from each are turned up into a 4-card <b>Market</b>. Storage starts at ${ic('gold')}3 ${ic('wheat')}1 ${ic('wood')}1 ${ic('stone')}1.</p>
<h3>Your turn</h3><ol><li><b>Take a card</b> from the Market and drag it into your realm. The first card starts the realm; later cards go on the <b>left or right edge</b>, or <b>on top of blocks</b>, aligned to the 3-block grid. Wonders cannot be covered. Wonder cards cost resources (and the wonder cost is paid on drop).</li>
<li><b>Activate</b> (optional) the blocks the new card will cover, in any order, before they are covered. The new card is not part of the realm yet.</li>
<li><b>Confirm</b>, then <b>draw</b>: tap either deck to add a card to the Market.</li></ol>
<h3>Block activations</h3><ul><li><b>Field / Forest / Quarry:</b> pay 1 ${ic('gold')}, gain 1 wheat / wood / stone.</li><li><b>Citizen:</b> pay 1 ${ic('gold')}, gain the citizen's effect (crown or commoner).</li><li><b>Mine:</b> gain 2 ${ic('gold')}.</li></ul>
<h3>Any time</h3><ul><li>Pay 2 ${ic('gold')} to buy 1 resource. Storage holds 7 of each (gold too).</li><li><b>Abandon</b> an unplaced wonder (Market or deck top) for 2 ${ic('gold')} or 1 resource; the Market refills to 4 next time.</li><li>The top card of the district deck shows the active <b>event</b> on its back.</li></ul>
<h3>Wonders</h3><p>After placing, a wonder's effect applies automatically whenever triggered. Building a wonder does not trigger its own effect.</p>
<h3>Scoring</h3><p>Each uncovered wonder and mine scores per its card. Add 1 point per 3 gold and per 2 resources in storage. Ranks: 0-49 Ruinous · 50-54 Adequate · 55-59 Respectable · 60-64 Noble · 65-69 Valiant · 70+ Legendary.</p>
<h3>End</h3><p>The game ends when the Market is empty or you cannot place any card.</p>
<h3>Expansions</h3><ul><li><b>Monuments & Misfortunes:</b> 3 random base districts are replaced by 3 new ones. Monuments are free to place, give 1 resource when activated and score 2 if uncovered. Misfortunes apply a penalty while in the realm and score 4 if uncovered.</li>
<li><b>Leaders I-III:</b> Two leader cards are drawn; one stays a leader and the other is flipped to a milestone. When the milestone's condition is met, the leader covers it and the lower rule applies. Win by meeting the milestone and all the leader's requirements. Untick the milestone for an easier game.</li></ul>
<h3>Controls</h3><p>Drag a Market card onto the realm: a ghost shows where it lands (green = legal). Tap or long-press any card to inspect it. Tap a checked block (✓) to un-select it. <b>Reset turn</b> (clock arrow) puts everything back to the start of the turn. Keys: Enter = confirm, Ctrl+Z = reset turn.</p>
<h3>Original rulebook</h3><p><button class="primary" data-rb>Open the original rulebook (8 pages)</button></p></div>`;
 m.onclick=e=>{if(e.target.closest('[data-rb]'))return rulebook(1);if(e.target===m||e.target.closest('[data-x]'))m.hidden=true}}
addEventListener('DOMContentLoaded',menuInit);

function rulebook(p){const m=$('#rb');m.hidden=false;p=Math.max(1,Math.min(8,p));m.dataset.p=p;
 m.innerHTML=`<div class="rbv"><div class="rbtop"><b>Original rulebook</b><span>Page ${p} / 8</span><button class="x" data-x>×</button></div><div class="rbimg"><img src="assets/rulebook/page${p}.webp" alt="page ${p}"></div>
 <div class="rbnav"><button class="ghost" data-pg="${p-1}" ${p===1?'disabled':''}>◀ Previous</button><button class="ghost" data-pg="${p+1}" ${p===8?'disabled':''}>Next ▶</button></div></div>`;
 m.onclick=e=>{const b=e.target.closest('[data-pg]');if(b&&!b.disabled)return rulebook(+b.dataset.pg);if(e.target.closest('[data-x]')||e.target===m)m.hidden=true};
 let sx=null;m.ontouchstart=e=>sx=e.touches[0].clientX;m.ontouchend=e=>{if(sx===null)return;const d=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(d)>60)rulebook(p+(d<0?1:-1))}}
addEventListener('keydown',e=>{const m=$('#rb');if(!m||m.hidden)return;const p=+m.dataset.p;if(e.key==='ArrowRight')rulebook(p+1);if(e.key==='ArrowLeft')rulebook(p-1);if(e.key==='Escape')m.hidden=true});

/* ---------- realm zoom / pan ---------- */
function applyView(){const ri=$('#ri'),R=$('#realm');if(!ri)return;const z=VIEW.z,w=ri.offsetWidth*z,h=ri.offsetHeight*z,lx=ri.offsetLeft,ly=ri.offsetTop;
 VIEW.tx=w<=R.clientWidth?(R.clientWidth-w)/2-lx:Math.min(-lx,Math.max(R.clientWidth-w-lx,VIEW.tx));
 VIEW.ty=h<=R.clientHeight?(R.clientHeight-h)/2-ly:Math.min(-ly,Math.max(R.clientHeight-h-ly,VIEW.ty));
 ri.style.transformOrigin='0 0';ri.style.transform=`translate(${VIEW.tx}px,${VIEW.ty}px) scale(${z})`;
 const f=$('#fit');f.hidden=z<=1.01;if(!f.hidden){const b=R.getBoundingClientRect();f.style.left=(b.right-46)+'px';f.style.top=(b.top+8)+'px'}}
function zoomAt(px,py,z2){const ri=$('#ri');if(!ri)return;z2=Math.max(1,Math.min(5,z2));const r=ri.getBoundingClientRect(),z=VIEW.z,ux=(px-r.left)/z,uy=(py-r.top)/z;
 VIEW.z=z2;VIEW.tx+=(px-ux*z2)-r.left;VIEW.ty+=(py-uy*z2)-r.top;applyView()}
const PT=new Map();let G0=null;
$('#realm').addEventListener('wheel',e=>{if(!g)return;e.preventDefault();zoomAt(e.clientX,e.clientY,VIEW.z*Math.exp(-e.deltaY*.002))},{passive:false});
$('#realm').addEventListener('pointerdown',e=>{if(!g||e.target.closest('.pc.pend'))return;PT.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY});
 if(!G0)G0={moved:false,d:0};if(PT.size>=2){const[a,b]=[...PT.values()];G0.d=Math.hypot(a.x-b.x,a.y-b.y)}});
document.addEventListener('pointermove',e=>{const p=PT.get(e.pointerId);if(!p||!g||!G0)return;const px=p.x,py=p.y;p.x=e.clientX;p.y=e.clientY;
 if(PT.size>=2){const[a,b]=[...PT.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(G0.d)zoomAt((a.x+b.x)/2,(a.y+b.y)/2,VIEW.z*d/G0.d);G0.d=d;G0.moved=true}
 else if(VIEW.z>1.01&&(G0.moved||Math.hypot(e.clientX-p.x0,e.clientY-p.y0)>8)){G0.moved=true;VIEW.tx+=e.clientX-px;VIEW.ty+=e.clientY-py;applyView()}});
const endPT=e=>{if(!PT.has(e.pointerId))return;PT.delete(e.pointerId);if(G0&&G0.moved)VIEW.supp=performance.now()+350;if(PT.size<2&&G0)G0.d=0;if(!PT.size)G0=null};
document.addEventListener('pointerup',endPT);document.addEventListener('pointercancel',endPT);
document.addEventListener('contextmenu',e=>{if(e.target.closest('#game'))e.preventDefault()});
