import { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────────
   GAME DATA & LOGIC
───────────────────────────────────────────── */
const COLORS = ["red","yellow","green","blue"];
const C = { red:"#C0392B", yellow:"#D4A017", green:"#1A6B3C", blue:"#154F8A", wild:"#6A1E9A" };
const FELT = "#0B3320";
const GOLD  = "#C9A84C";
const CREAM = "#F2E0C0";
const DARK  = "#070F09";

function makeDeck(){
  const d=[];
  COLORS.forEach(col=>{
    d.push({col,val:"0",kind:"num"});
    for(let n=1;n<=9;n++){
      d.push({col,val:`${n}`,kind:"num"});
      d.push({col,val:`${n}`,kind:"num"});
    }
    ["Skip","Rev","+2"].forEach(v=>{
      d.push({col,val:v,kind:"act"});
      d.push({col,val:v,kind:"act"});
    });
  });
  ["Wild","W+4","Wild","W+4"].forEach(v=>d.push({col:"wild",val:v,kind:"wild"}));
  return d;
}

function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

function canPlay(card,top,curCol){
  if(card.kind==="wild") return true;
  if(card.col===curCol) return true;
  if(card.val===top.val) return true;
  return false;
}

function newGame(numPlayers){
  let deck=shuffle(makeDeck());
  const players=Array.from({length:numPlayers},(_,i)=>({id:i,name:i===0?"You":`Player ${i+1}`,hand:[],isHuman:i===0}));
  for(let i=0;i<7;i++) players.forEach(p=>p.hand.push(deck.pop()));
  let top;
  do{top=deck.pop();if(top.kind==="wild")deck.unshift(top);}while(top.kind==="wild");
  return{deck,pile:[top],players,cur:0,dir:1,curCol:top.col,over:false,winner:null,stack:0};
}

/* ─────────────────────────────────────────────
   SVG CARD COMPONENTS
───────────────────────────────────────────── */
const LBL={Skip:"⊗",Rev:"⇌","+2":"+2",Wild:"✦","W+4":"+4"};

function CardFace({card,w=68,h=102,glow,lift,dim}){
  const isWild=card.kind==="wild";
  const base=C[card.col]||C.wild;
  const lbl=LBL[card.val]??card.val;
  const isDark=card.col==="blue"||card.col==="wild"||card.col==="green";
  const txtCol=isDark?"#FDF0D5":card.col==="yellow"?"#2a1a00":"#FDF0D5";
  const fs=lbl.length>2?20:26;

  const filterStr=glow
    ?`drop-shadow(0 0 12px ${base}) drop-shadow(0 0 28px ${base}88) drop-shadow(0 4px 12px #0009)`
    :lift
    ?`drop-shadow(0 8px 20px ${base}66) drop-shadow(0 3px 8px #000a)`
    :`drop-shadow(0 3px 7px #0008)`;

  return(
    <svg width={w} height={h} viewBox="0 0 68 102" style={{display:"block",flexShrink:0,filter:filterStr,opacity:dim?0.38:1}}>
      <defs>
        <linearGradient id={`c-${card.col}-${card.val}-a`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={isWild?"#7B3FBE":base} stopOpacity="1"/>
          <stop offset="100%" stopColor={isWild?"#2E1060":base} stopOpacity="0.7"/>
        </linearGradient>
        <radialGradient id={`c-${card.col}-${card.val}-b`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
        {isWild&&<linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#C0392B"/>
          <stop offset="33%"  stopColor="#D4A017"/>
          <stop offset="66%"  stopColor="#1A6B3C"/>
          <stop offset="100%" stopColor="#154F8A"/>
        </linearGradient>}
        <clipPath id="cc"><rect x="2" y="2" width="64" height="98" rx="8"/></clipPath>
      </defs>

      {/* Body */}
      <rect x="2" y="2" width="64" height="98" rx="8" fill={`url(#c-${card.col}-${card.val}-a)`}/>
      <rect x="2" y="2" width="64" height="98" rx="8" fill={`url(#c-${card.col}-${card.val}-b)`}/>

      {/* Gold filigree border */}
      <rect x="2" y="2" width="64" height="98" rx="8" fill="none" stroke={GOLD} strokeWidth="1.8" strokeOpacity="0.65"/>
      {/* inner thin line */}
      <rect x="5" y="5" width="58" height="92" rx="6" fill="none" stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.3"/>

      {/* Diamond pattern bg */}
      <g clipPath="url(#cc)" opacity="0.06">
        {[0,1,2,3,4,5,6].map(r=>[0,1,2,3,4].map(cc2=>(
          <polygon key={`${r}-${cc2}`}
            points={`${cc2*16-4+r%2*8},${r*14} ${cc2*16+4+r%2*8},${r*14} ${cc2*16+r%2*8},${r*14+7}`}
            fill="rgba(255,255,255,0.8)"/>
        )))}
      </g>

      {/* Center oval */}
      <ellipse cx="34" cy="51" rx="20" ry="32" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.22)" strokeWidth="1"/>
      {isWild&&<ellipse cx="34" cy="51" rx="14" ry="22" fill="url(#wg)" opacity="0.9"/>}

      {/* Center symbol */}
      <text x="34" y="54" textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Playfair Display', 'Georgia', serif" fontWeight="900"
        fontSize={fs} fill={isWild?"#fff":txtCol}
        stroke="rgba(0,0,0,0.3)" strokeWidth="0.5">{lbl}</text>

      {/* TL corner */}
      <text x="8" y="16" fontFamily="'Playfair Display', serif" fontWeight="700"
        fontSize="11" fill={txtCol} opacity="0.9">{lbl}</text>
      {/* BR corner rotated */}
      <g transform="rotate(180,60,86)">
        <text x="60" y="86" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'Playfair Display', serif" fontWeight="700"
          fontSize="11" fill={txtCol} opacity="0.9">{lbl}</text>
      </g>

      {/* Shimmer accent */}
      <line x1="9" y1="12" x2="59" y2="12" stroke="rgba(255,255,255,0.14)" strokeWidth="0.8"/>
      <line x1="9" y1="90" x2="59" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>
    </svg>
  );
}

function CardBack({w=68,h=102,sm}){
  const sw=sm?44:w, sh=sm?66:h;
  return(
    <svg width={sw} height={sh} viewBox="0 0 68 102" style={{display:"block",flexShrink:0,
      filter:"drop-shadow(0 3px 8px #000a)"}}>
      <defs>
        <pattern id="bp" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={GOLD} strokeWidth="0.7" strokeOpacity="0.25"/>
        </pattern>
      </defs>
      <rect x="2" y="2" width="64" height="98" rx="8" fill="#120820"/>
      <rect x="2" y="2" width="64" height="98" rx="8" fill="url(#bp)"/>
      <rect x="2" y="2" width="64" height="98" rx="8" fill="none" stroke={GOLD} strokeWidth="1.8" strokeOpacity="0.55"/>
      <rect x="6" y="6" width="56" height="90" rx="6" fill="none" stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.25"/>
      <ellipse cx="34" cy="51" rx="18" ry="28" fill="none" stroke={GOLD} strokeWidth="0.8" strokeOpacity="0.4"/>
      <text x="34" y="55" textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Playfair Display', serif" fontWeight="900" fontSize="15"
        fill={GOLD} opacity="0.75">UNO</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   COLOR PICKER MODAL
───────────────────────────────────────────── */
function ColorModal({onPick}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(4,12,6,0.9)",backdropFilter:"blur(16px)"}}>
      <div style={{
        background:`linear-gradient(160deg,#0a2214,#050d08)`,
        border:`1.5px solid ${GOLD}55`,borderRadius:22,
        padding:"44px 56px",textAlign:"center",
        boxShadow:`0 0 0 1px ${GOLD}11, 0 40px 100px rgba(0,0,0,0.75), inset 0 1px 0 ${GOLD}22`}}>
        <div style={{fontFamily:"'Playfair Display',serif",color:GOLD,fontSize:24,fontWeight:700,
          letterSpacing:2,marginBottom:6}}>Choose a Color</div>
        <div style={{fontFamily:"'DM Mono',monospace",color:CREAM,opacity:0.35,fontSize:11,
          letterSpacing:4,textTransform:"uppercase",marginBottom:36}}>Select active color</div>
        <div style={{display:"flex",gap:18,justifyContent:"center"}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>onPick(c)} style={{
              width:68,height:68,borderRadius:14,background:C[c],
              border:`2px solid ${GOLD}44`,cursor:"pointer",
              transition:"all 0.16s ease",outline:"none",
              boxShadow:`0 4px 16px ${C[c]}55`
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.15) translateY(-4px)";e.currentTarget.style.boxShadow=`0 10px 32px ${C[c]}, 0 0 0 3px ${GOLD}66`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow=`0 4px 16px ${C[c]}55`;}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────── */
function Toasts({list}){
  return(
    <div style={{position:"fixed",bottom:210,left:"50%",transform:"translateX(-50%)",
      zIndex:400,display:"flex",flexDirection:"column",gap:6,alignItems:"center",pointerEvents:"none"}}>
      {list.map(t=>(
        <div key={t.id} style={{
          padding:"9px 26px",borderRadius:40,
          background:t.accent?`${C[t.accent]||t.accent}dd`:`rgba(201,168,76,0.2)`,
          backdropFilter:"blur(12px)",
          border:`1px solid ${t.accent?C[t.accent]||t.accent:GOLD}55`,
          color:CREAM,fontSize:13,fontWeight:600,letterSpacing:1,
          fontFamily:"'DM Mono',monospace",
          boxShadow:"0 6px 24px rgba(0,0,0,0.55)",
          animation:"toastUp 0.3s cubic-bezier(.34,1.56,.64,1)",
          whiteSpace:"nowrap"
        }}>{t.txt}</div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   WIN SCREEN
───────────────────────────────────────────── */
function WinScreen({winner,onReplay}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(4,12,6,0.97)",backdropFilter:"blur(28px)",flexDirection:"column",gap:28}}>
      <div style={{position:"relative",width:160,height:160,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",
          border:`2.5px solid ${GOLD}`,animation:"spinSlow 6s linear infinite",
          boxShadow:`0 0 40px ${GOLD}44`}}/>
        <div style={{position:"absolute",inset:16,borderRadius:"50%",border:`1px solid ${GOLD}44`}}/>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <text x="30" y="36" textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Playfair Display',serif" fontSize="36" fontWeight="900"
            fill={GOLD} style={{filter:`drop-shadow(0 0 12px ${GOLD})`}}>✦</text>
        </svg>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:52,color:GOLD,
          letterSpacing:6,textTransform:"uppercase",
          textShadow:`0 0 60px ${GOLD}88,0 4px 16px #0009`}}>{winner}</div>
        <div style={{fontFamily:"'DM Mono',monospace",color:CREAM,opacity:0.35,fontSize:13,
          letterSpacing:6,marginTop:8,textTransform:"uppercase"}}>wins the round</div>
      </div>
      <button onClick={onReplay} style={{
        padding:"15px 52px",borderRadius:50,
        background:`linear-gradient(135deg,${GOLD},#7A5A10)`,
        border:"none",color:DARK,fontSize:14,fontWeight:700,
        fontFamily:"'DM Mono',monospace",letterSpacing:4,textTransform:"uppercase",
        cursor:"pointer",boxShadow:`0 8px 32px ${GOLD}55`,transition:"all 0.2s"
      }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 16px 48px ${GOLD}88`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 8px 32px ${GOLD}55`;}}>
        New Round
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PLAYER BADGE
───────────────────────────────────────────── */
function Seat({player,active,uno}){
  const acc=[C.red,C.blue,C.green,C.yellow][player.id%4];
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:50,
      background:active?`${acc}18`:"rgba(0,0,0,0.35)",
      border:active?`1.5px solid ${acc}88`:`1.5px solid ${GOLD}18`,
      boxShadow:active?`0 0 20px ${acc}33`:"none",transition:"all 0.35s"}}>
      <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
        background:active?`radial-gradient(circle,${acc},${acc}88)`:`radial-gradient(circle,${GOLD}44,${GOLD}22)`,
        fontFamily:"'Playfair Display',serif",fontWeight:900,color:"#fff",fontSize:14,
        border:uno?`2.5px solid ${C.yellow}`:active?`2px solid ${acc}99`:`2px solid ${GOLD}33`,
        boxShadow:uno?`0 0 12px ${C.yellow}`:active?`0 0 10px ${acc}55`:"none",
        transition:"all 0.3s",flexShrink:0}}>
        {player.name[0]}
      </div>
      <div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,letterSpacing:1,
          color:active?CREAM:`${CREAM}44`,textTransform:"uppercase",lineHeight:1.2}}>
          {player.id===0?"You":player.name}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,
            color:active?GOLD:`${GOLD}44`}}>{player.hand.length} cards</span>
          {uno&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:C.yellow,
            fontWeight:700,letterSpacing:1}}>UNO!</span>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
const HUMAN=0;

export default function App(){
  const [screen,setScreen]=useState("menu");
  const [numP,setNumP]=useState(3);
  const [game,setGame]=useState(null);
  const [selIdx,setSelIdx]=useState(null);
  const [colorModal,setColorModal]=useState(false);
  const [pendingIdx,setPendingIdx]=useState(null);
  const [toasts,setToasts]=useState([]);
  const tid=useRef(0);
  const botRef=useRef(null);

  const toast=useCallback((txt,accent)=>{
    const id=++tid.current;
    setToasts(p=>[...p.slice(-2),{id,txt,accent}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),2500);
  },[]);

  const startGame=useCallback(()=>{
    setGame(newGame(numP));
    setScreen("game");
    setSelIdx(null);
    toast("Cards dealt — good luck!",GOLD);
  },[numP,toast]);

  const applyEffect=useCallback((g,card,pid)=>{
    const n=g.players.length;
    let next=(g.cur+g.dir+n)%n;
    if(card.val==="Rev"){
      g.dir*=-1; next=(g.cur+g.dir+n)%n;
      toast(`${g.players[pid].name} reversed direction!`,"wild");
    } else if(card.val==="Skip"){
      const skip=next; next=(next+g.dir+n)%n;
      toast(`${g.players[skip].name} is skipped!`,card.col);
    } else if(card.val==="+2"){
      g.stack+=2;
      toast(`+2 draw penalty!`,card.col);
    } else if(card.val==="W+4"){
      g.stack+=4;
      toast(`Wild +4 — draw ${g.stack}!`,"wild");
    }
    g.cur=next; return g;
  },[toast]);

  const drawN=useCallback((g,pid,n)=>{
    for(let i=0;i<n;i++){
      if(g.deck.length===0){const top=g.pile.pop();g.deck=shuffle(g.pile);g.pile=[top];}
      if(g.deck.length>0) g.players[pid].hand.push(g.deck.pop());
    }
    return g;
  },[]);

  const doPlay=useCallback((idx,chosenCol)=>{
    setGame(prev=>{
      if(!prev||prev.cur!==HUMAN||prev.over) return prev;
      const g=JSON.parse(JSON.stringify(prev));
      const card=g.players[HUMAN].hand[idx];
      const top=g.pile[g.pile.length-1];
      if(!canPlay(card,top,g.curCol)) return prev;
      g.players[HUMAN].hand.splice(idx,1);
      g.pile.push(card);
      g.curCol=card.kind==="wild"?chosenCol:card.col;
      toast(`You played ${card.val}`,card.col==="wild"?chosenCol:card.col);
      if(g.players[HUMAN].hand.length===0){g.over=true;g.winner="You";return g;}
      if(g.players[HUMAN].hand.length===1) toast("UNO!",C.yellow);
      return applyEffect(g,card,HUMAN);
    });
    setSelIdx(null);
  },[toast,applyEffect]);

  const handleCardClick=useCallback((idx)=>{
    if(!game||game.cur!==HUMAN||game.over) return;
    const card=game.players[HUMAN].hand[idx];
    const top=game.pile[game.pile.length-1];
    if(!canPlay(card,top,game.curCol)){toast("That card can't be played","#8B0000");return;}
    if(card.kind==="wild"){setSelIdx(idx);setPendingIdx(idx);setColorModal(true);}
    else{setSelIdx(idx);setTimeout(()=>doPlay(idx,null),130);}
  },[game,toast,doPlay]);

  const handleDraw=useCallback(()=>{
    setGame(prev=>{
      if(!prev||prev.cur!==HUMAN||prev.over) return prev;
      const g=JSON.parse(JSON.stringify(prev));
      const n=g.stack>0?g.stack:1;
      drawN(g,HUMAN,n);
      if(g.stack>0){toast(`You drew ${n} cards`,"#154F8A");g.stack=0;}
      else toast("Drew a card","#154F8A");
      const len=g.players.length;
      g.cur=(g.cur+g.dir+len)%len;
      return g;
    });
  },[drawN,toast]);

  /* BOT */
  useEffect(()=>{
    if(!game||game.over||game.cur===HUMAN) return;
    botRef.current=setTimeout(()=>{
      setGame(prev=>{
        if(!prev||prev.cur===HUMAN||prev.over) return prev;
        const g=JSON.parse(JSON.stringify(prev));
        const bid=g.cur, bot=g.players[bid];
        const top=g.pile[g.pile.length-1];
        const n=g.players.length;
        if(g.stack>0){
          const canBlock=bot.hand.some(c=>c.val==="+2"||c.val==="W+4");
          if(!canBlock){
            drawN(g,bid,g.stack);
            toast(`${bot.name} drew ${g.stack}`,C.red);
            g.stack=0;g.cur=(bid+g.dir+n)%n;return g;
          }
        }
        const playable=bot.hand.map((c,i)=>({c,i})).filter(({c})=>canPlay(c,top,g.curCol));
        if(!playable.length){
          drawN(g,bid,1);toast(`${bot.name} draws`,`${GOLD}88`);
          g.cur=(bid+g.dir+n)%n;return g;
        }
        let pick=playable.find(({c})=>c.val==="+2")||
                 playable.find(({c})=>c.val==="Skip")||
                 playable.find(({c})=>c.val==="Rev")||
                 (bot.hand.length<=3&&playable.find(({c})=>c.val==="W+4"))||
                 playable.find(({c})=>c.kind!=="wild")||
                 playable[0];
        const card=pick.c;
        bot.hand.splice(pick.i,1);
        g.pile.push(card);
        let cc=card.col;
        if(card.kind==="wild"){
          const cnt={red:0,yellow:0,green:0,blue:0};
          bot.hand.forEach(c=>{if(c.col!=="wild")cnt[c.col]++;});
          cc=COLORS.reduce((a,b)=>cnt[a]>=cnt[b]?a:b);
        }
        g.curCol=card.kind==="wild"?cc:card.col;
        toast(`${bot.name} played ${card.val}`,g.curCol);
        if(!bot.hand.length){g.over=true;g.winner=bot.name;return g;}
        if(bot.hand.length===1) toast(`${bot.name} — UNO!`,C.yellow);
        return applyEffect(g,card,bid);
      });
    },820+Math.random()*580);
    return()=>clearTimeout(botRef.current);
  },[game,toast,applyEffect,drawN]);

  /* ── MENU ── */
  if(screen==="menu") return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${DARK};overflow:hidden;}
        @keyframes drift{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-18px) rotate(var(--r2,4deg))}}
        @keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      `}</style>
      <div style={{width:"100vw",height:"100vh",overflow:"hidden",position:"relative",
        background:`radial-gradient(ellipse at 38% 55%, #0e3a1e 0%, #071510 45%, ${DARK} 100%)`}}>

        {/* Diagonal stripe texture */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.07,
          backgroundImage:`repeating-linear-gradient(-45deg,${GOLD} 0,${GOLD} 1px,transparent 0,transparent 50%)`,
          backgroundSize:"12px 12px"}}/>

        {/* Oval table ring */}
        <div style={{position:"absolute",inset:"60px 80px",borderRadius:200,
          border:`1px solid ${GOLD}22`,boxShadow:`inset 0 0 80px rgba(0,0,0,0.5)`,
          pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:"70px 90px",borderRadius:200,
          border:`1px solid ${GOLD}0f`,pointerEvents:"none"}}/>

        {/* Corner ornaments */}
        {[{top:0,left:0,rot:0},{top:0,right:0,rot:90},{bottom:0,right:0,rot:180},{bottom:0,left:0,rot:270}].map((s,i)=>(
          <div key={i} style={{position:"absolute",width:100,height:100,...{top:s.top,left:s.left,right:s.right,bottom:s.bottom},
            opacity:0.2,pointerEvents:"none",transform:`rotate(${s.rot}deg)`}}>
            <svg viewBox="0 0 100 100" width="100" height="100">
              <path d="M0,0 L50,0 Q50,50 0,50 Z" fill="none" stroke={GOLD} strokeWidth="1.2"/>
              <path d="M10,0 L50,0 Q50,40 10,0 Z" fill="none" stroke={GOLD} strokeWidth="0.6" opacity="0.5"/>
              <circle cx="6" cy="6" r="3" fill={GOLD} opacity="0.7"/>
              <circle cx="12" cy="12" r="1.5" fill={GOLD} opacity="0.4"/>
            </svg>
          </div>
        ))}

        {/* Floating cards */}
        {[{col:"red",val:"7",kind:"num",x:"8%",y:"12%",r:"-15deg",r2:"-10deg",d:3.8},
          {col:"blue",val:"Skip",kind:"act",x:"80%",y:"8%",r:"18deg",r2:"23deg",d:4.5},
          {col:"green",val:"+2",kind:"act",x:"5%",y:"62%",r:"-8deg",r2:"-3deg",d:3.2},
          {col:"yellow",val:"9",kind:"num",x:"84%",y:"68%",r:"22deg",r2:"17deg",d:5.1},
          {col:"wild",val:"Wild",kind:"wild",x:"72%",y:"22%",r:"-12deg",r2:"-6deg",d:4}
         ].map((c,i)=>(
          <div key={i} style={{position:"absolute",left:c.x,top:c.y,opacity:0.15,
            animation:`drift ${c.d}s ease-in-out infinite`,animationDelay:`${i*0.7}s`,
            "--r":c.r,"--r2":c.r2,transform:`rotate(${c.r})`}}>
            <CardFace card={c} w={54} h={81}/>
          </div>
        ))}

        {/* Main */}
        <div style={{position:"relative",zIndex:10,display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",height:"100%",gap:0,
          animation:"fadeIn 0.6s ease both"}}>

          {/* Logo area */}
          <div style={{position:"relative",marginBottom:4,textAlign:"center"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:108,lineHeight:0.9,
              WebkitTextStroke:`1.5px ${GOLD}`,color:"transparent",
              letterSpacing:20,userSelect:"none",
              textShadow:`0 0 80px ${GOLD}22`,filter:`drop-shadow(0 0 30px ${GOLD}33)`}}>UNO</div>
            {/* italic subtitle */}
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontWeight:700,
              color:GOLD,opacity:0.45,fontSize:16,letterSpacing:6,marginTop:-4}}>
              The Classic Card Game
            </div>
          </div>

          {/* Rule of threes divider */}
          <div style={{display:"flex",alignItems:"center",gap:14,margin:"32px 0",width:360}}>
            <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${GOLD}55)`}}/>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10,1 L11.5,7.5 L18,6 L13,11 L18,16 L11.5,14.5 L10,19 L8.5,14.5 L2,16 L7,11 L2,6 L8.5,7.5 Z"
                fill="none" stroke={GOLD} strokeWidth="0.8" opacity="0.6"/>
            </svg>
            <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${GOLD}55)`}}/>
          </div>

          {/* Player count */}
          <div style={{marginBottom:36,textAlign:"center"}}>
            <div style={{fontFamily:"'DM Mono',monospace",color:GOLD,opacity:0.4,fontSize:10,
              letterSpacing:5,marginBottom:14,textTransform:"uppercase"}}>Players at the table</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              {[2,3,4].map(n=>(
                <button key={n} onClick={()=>setNumP(n)} style={{
                  width:60,height:60,borderRadius:12,
                  background:numP===n?`linear-gradient(145deg,${GOLD}cc,${GOLD}77)`:"rgba(201,168,76,0.07)",
                  border:numP===n?`2px solid ${GOLD}`:`2px solid ${GOLD}2a`,
                  color:numP===n?DARK:GOLD,fontSize:24,fontWeight:900,
                  fontFamily:"'Playfair Display',serif",cursor:"pointer",
                  boxShadow:numP===n?`0 0 24px ${GOLD}44,0 4px 12px #0006`:"none",
                  transition:"all 0.2s"
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={startGame} style={{
            padding:"17px 68px",borderRadius:50,
            background:`linear-gradient(135deg,${GOLD} 0%,#7A5A10 100%)`,
            border:"none",color:DARK,fontSize:14,fontWeight:700,letterSpacing:5,
            textTransform:"uppercase",fontFamily:"'DM Mono',monospace",cursor:"pointer",
            boxShadow:`0 10px 36px ${GOLD}44, inset 0 1px 0 rgba(255,255,255,0.25)`,
            transition:"all 0.2s"
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 18px 52px ${GOLD}66, inset 0 1px 0 rgba(255,255,255,0.25)`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 10px 36px ${GOLD}44, inset 0 1px 0 rgba(255,255,255,0.25)`;}}>
            Deal the Cards
          </button>

          {/* Icon legend */}
          <div style={{display:"flex",gap:32,marginTop:44,opacity:0.28}}>
            {[["⊗","Skip"],["⇌","Reverse"],["+2","Draw 2"],["✦","Wild"],["+4","Wild +4"]].map(([ic,lb])=>(
              <div key={lb} style={{textAlign:"center",color:CREAM,fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:1}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:5,color:GOLD}}>{ic}</div>
                {lb}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  /* ── GAME TABLE ── */
  const G=game;
  const human=G?.players[HUMAN];
  const top=G?.pile[G.pile.length-1];
  const myTurn=G?.cur===HUMAN;
  const acc=C[G?.curCol]||GOLD;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${DARK};overflow:hidden;}
        @keyframes toastUp{from{opacity:0;transform:translateY(10px) scale(0.95)}to{opacity:1;transform:none}}
        @keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        @keyframes glow{0%,100%{box-shadow:0 0 12px var(--ac)}50%{box-shadow:0 0 28px var(--ac), 0 0 48px var(--ac)55}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{height:3px;background:transparent}
        ::-webkit-scrollbar-thumb{background:${GOLD}44;border-radius:2px}
      `}</style>

      <Toasts list={toasts}/>
      {colorModal&&<ColorModal onPick={c=>{setColorModal(false);doPlay(pendingIdx,c);setPendingIdx(null);}}/>}
      {G?.over&&<WinScreen winner={G.winner} onReplay={startGame}/>}

      <div style={{width:"100vw",height:"100vh",overflow:"hidden",position:"relative",
        background:`radial-gradient(ellipse at 50% 50%, #0c3a1c 0%, #061610 55%, ${DARK} 100%)`}}>

        {/* Felt diagonal texture */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.055,
          backgroundImage:`repeating-linear-gradient(-45deg,${GOLD} 0,${GOLD} 1px,transparent 0,transparent 50%)`,
          backgroundSize:"10px 10px"}}/>

        {/* Table oval */}
        <div style={{position:"absolute",inset:"12px 20px",borderRadius:140,
          border:`1.5px solid ${GOLD}1a`,
          boxShadow:`inset 0 0 120px rgba(0,0,0,0.55), 0 0 60px rgba(0,0,0,0.6)`,
          pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:"22px 30px",borderRadius:130,
          border:`0.5px solid ${GOLD}0d`,pointerEvents:"none"}}/>

        {/* Dynamic color aura at center */}
        <div style={{position:"absolute",top:"50%",left:"50%",
          width:440,height:280,borderRadius:"50%",
          background:`radial-gradient(ellipse, ${acc}0f 0%, transparent 70%)`,
          transform:"translate(-50%,-50%)",transition:"background 0.7s ease",
          pointerEvents:"none"}}/>

        {/* TOP — opponents */}
        <div style={{position:"absolute",top:16,left:0,right:0,
          display:"flex",justifyContent:"center",gap:24,padding:"0 20px",zIndex:10}}>
          {G?.players.slice(1).map(p=>(
            <div key={p.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <Seat player={p} active={G.cur===p.id} uno={p.hand.length===1}/>
              {/* Face-down fan */}
              <div style={{position:"relative",height:48,width:Math.min(p.hand.length,10)*12+44}}>
                {p.hand.slice(0,Math.min(p.hand.length,10)).map((_,i,arr)=>(
                  <div key={i} style={{position:"absolute",
                    left:i*12,
                    top:Math.abs(i-arr.length/2)*0.5,
                    transform:`rotate(${(i-arr.length/2)*2.8}deg)`,
                    zIndex:i,transformOrigin:"bottom center"}}>
                    <CardBack sm/>
                  </div>
                ))}
              </div>
              {p.hand.length>10&&(
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:`${GOLD}66`}}>
                  +{p.hand.length-10} more
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CENTER TABLE */}
        <div style={{position:"absolute",top:"50%",left:"50%",
          transform:"translate(-50%,-50%)",
          display:"flex",alignItems:"center",gap:44,zIndex:10}}>

          {/* Draw pile */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:GOLD,
              opacity:0.3,letterSpacing:3,textTransform:"uppercase"}}>
              {G?.deck.length} cards
            </div>
            <div onClick={myTurn?handleDraw:undefined}
              style={{cursor:myTurn?"pointer":"default",transition:"transform 0.2s",
                transform:myTurn?"translateY(-5px)":"none",position:"relative"}}
              onMouseEnter={e=>{if(myTurn){e.currentTarget.style.transform="translateY(-10px) scale(1.06)";}}}
              onMouseLeave={e=>{e.currentTarget.style.transform=myTurn?"translateY(-5px)":"none";}}>
              {/* Stack effect */}
              <div style={{position:"absolute",top:3,left:2,zIndex:0,opacity:0.5}}><CardBack/></div>
              <div style={{position:"absolute",top:1.5,left:1,zIndex:1,opacity:0.7}}><CardBack/></div>
              <div style={{position:"relative",zIndex:2}}><CardBack/></div>
              {myTurn&&(
                <div style={{position:"absolute",inset:0,borderRadius:8,zIndex:3,
                  border:`2px solid ${C.blue}99`,
                  boxShadow:`0 0 18px ${C.blue}55`,animation:"pulse 1.4s ease infinite",
                  "--ac":C.blue,pointerEvents:"none"}}/>
              )}
            </div>
            {myTurn&&G?.stack>0&&(
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:C.red,letterSpacing:1,
                fontWeight:600,animation:"pulse 1s infinite"}}>draw +{G.stack}</div>
            )}
            {myTurn&&G?.stack===0&&(
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:`${GOLD}66`,letterSpacing:1}}>
                draw card
              </div>
            )}
          </div>

          {/* Info column */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            {/* Color indicator */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 18px",borderRadius:50,
              background:`${acc}18`,border:`1.5px solid ${acc}55`,
              transition:"all 0.5s",boxShadow:`0 0 16px ${acc}22`}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:acc,
                boxShadow:`0 0 8px ${acc}`}}/>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:acc,
                letterSpacing:2,textTransform:"uppercase",fontWeight:600}}>
                {G?.curCol}
              </div>
              <div style={{color:acc,fontSize:13,opacity:0.7}}>{G?.dir===1?"↻":"↺"}</div>
            </div>
            {G?.stack>0&&(
              <div style={{padding:"5px 14px",borderRadius:50,
                background:"rgba(192,57,43,0.2)",border:`1.5px solid ${C.red}55`,
                fontFamily:"'DM Mono',monospace",fontSize:11,color:C.red,letterSpacing:1,fontWeight:600}}>
                +{G.stack} pending
              </div>
            )}
            {/* Score label */}
            <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",
              color:GOLD,opacity:0.2,fontSize:13,marginTop:4}}>discard pile</div>
          </div>

          {/* Discard pile */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:GOLD,
              opacity:0.3,letterSpacing:3,textTransform:"uppercase"}}>
              top card
            </div>
            <div style={{position:"relative",width:68,height:102}}>
              {G?.pile.slice(-4).map((c,i,arr)=>(
                <div key={i} style={{position:"absolute",inset:0,
                  transform:`rotate(${(i-arr.length+1)*5}deg) translate(${(i-arr.length+1)*2}px,0)`,
                  zIndex:i,
                  opacity:i<arr.length-1?0.7:1}}>
                  <CardFace card={c} glow={i===arr.length-1} lift={i===arr.length-1}/>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM — human */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10,
          display:"flex",flexDirection:"column",alignItems:"center",
          padding:"10px 16px 18px",background:`linear-gradient(to top, ${DARK}ee 0%, transparent 100%)`}}>

          {/* Status */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
            <Seat player={human} active={myTurn} uno={human?.hand.length===1}/>
            <div style={{
              padding:"9px 24px",borderRadius:50,
              background:myTurn?`${C.green}15`:"rgba(0,0,0,0.4)",
              border:myTurn?`1.5px solid ${C.green}66`:`1.5px solid ${GOLD}18`,
              fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,letterSpacing:3,
              color:myTurn?C.green:`${GOLD}33`,textTransform:"uppercase",
              transition:"all 0.35s",
              boxShadow:myTurn?`0 0 18px ${C.green}33`:"none"
            }}>
              {myTurn?"Your Turn":"Waiting…"}
            </div>
            {/* Back to menu */}
            <button onClick={()=>{setScreen("menu");setGame(null);}} style={{
              padding:"9px 18px",borderRadius:50,
              background:"rgba(201,168,76,0.07)",border:`1px solid ${GOLD}2a`,
              color:`${GOLD}88`,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2,
              cursor:"pointer",textTransform:"uppercase",transition:"all 0.2s"
            }}
              onMouseEnter={e=>{e.currentTarget.style.background=`rgba(201,168,76,0.14)`;e.currentTarget.style.color=GOLD;}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.07)";e.currentTarget.style.color=`${GOLD}88`;}}>
              ← Menu
            </button>
          </div>

          {/* Hand */}
          <div style={{display:"flex",gap:0,overflowX:"auto",maxWidth:"100vw",
            padding:"16px 28px 6px",alignItems:"flex-end",
            scrollSnapType:"x mandatory"}}>
            {human?.hand.map((card,i)=>{
              const playable=myTurn&&canPlay(card,top,G.curCol);
              const isSel=selIdx===i;
              return(
                <div key={i} onClick={()=>handleCardClick(i)}
                  style={{
                    marginLeft:i>0?-20:0,zIndex:isSel?999:human.hand.length-i,
                    position:"relative",
                    transform:isSel?"translateY(-26px) rotate(0deg)":
                              playable?"translateY(-12px)":"translateY(0)",
                    cursor:playable?"pointer":"default",
                    transition:"transform 0.18s cubic-bezier(.34,1.56,.64,1)",
                    scrollSnapAlign:"start",
                    animation:`slideUp 0.3s ease ${Math.min(i*0.04,0.5)}s both`
                  }}
                  onMouseEnter={e=>{if(playable&&!isSel)e.currentTarget.style.transform="translateY(-22px) scale(1.04)";}}
                  onMouseLeave={e=>{if(!isSel)e.currentTarget.style.transform=playable?"translateY(-12px)":"translateY(0)";}}>
                  <CardFace card={card} glow={isSel} lift={playable} dim={myTurn&&!playable&&!isSel}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
