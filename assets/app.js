const canvas=document.querySelector('#game');
const ctx=canvas.getContext('2d');

const scoreEl=document.querySelector('#score');
const bestEl=document.querySelector('#best');
const balanceEl=document.querySelector('#balance');
const hullEl=document.querySelector('#hull');
const missionTitle=document.querySelector('#mission-title');
const phasePill=document.querySelector('#phase-pill');
const comReadout=document.querySelector('#com-readout');
const massReadout=document.querySelector('#mass-readout');
const manifestEl=document.querySelector('#manifest');
const phaseValue=document.querySelector('#phase-value');
const deliveredEl=document.querySelector('#delivered');
const damagedEl=document.querySelector('#damaged');
const turbulenceEl=document.querySelector('#turbulence');
const launchBtn=document.querySelector('#launch');
const restartBtn=document.querySelector('#restart');

const W=canvas.width;
const H=canvas.height;

const COLS=6;
const ROWS=4;
const CELL=92;
const GAP=10;

const HOLD_X=174;
const HOLD_Y=122;

const TYPES={
  normal:{label:'Standard',color:'#6ea8e8',fragility:.25,hazard:0},
  fragile:{label:'Fragile',color:'#d796e8',fragility:.85,hazard:0},
  hazard:{label:'Hazardous',color:'#e87171',fragility:.55,hazard:1},
  dense:{label:'Dense',color:'#e4b45d',fragility:.35,hazard:0}
};

let phase='loading';
let selectedId=null;
let crates=[];
let score=0;
let best=Number(window.CARGO_ZERO_STATS.bestScore||0);
let hull=100;
let delivered=0;
let damaged=0;
let turbulence=0;
let flightTime=0;
let turbulenceTimer=0;
let eventFlash=0;
let last=0;
let raf=0;
let missionEnded=false;

function newManifest(){
  cancelAnimationFrame(raf);

  phase='loading';
  selectedId=null;
  score=0;
  hull=100;
  delivered=0;
  damaged=0;
  turbulence=0;
  flightTime=0;
  turbulenceTimer=0;
  eventFlash=0;
  missionEnded=false;

  const count=8+Math.floor(Math.random()*3);

  crates=Array.from({length:count},(_,i)=>{
    const type=pickType();
    const baseMass={
      normal:30,
      fragile:22,
      hazard:38,
      dense:68
    }[type];

    return {
      id:i+1,
      type,
      mass:baseMass+Math.floor(Math.random()*18),
      row:null,
      col:null,
      integrity:100,
      shifted:false
    };
  });

  renderManifest();
  updateUI();
  draw();
}

function pickType(){
  const r=Math.random();
  if(r<.42)return 'normal';
  if(r<.62)return 'fragile';
  if(r<.80)return 'hazard';
  return 'dense';
}

function renderManifest(){
  manifestEl.innerHTML=crates.map(crate=>{
    const placed=crate.row!==null;
    const selected=crate.id===selectedId?' selected':'';

    return `
      <div class="manifest-item${selected}" data-id="${crate.id}">
        <i style="background:${TYPES[crate.type].color}"></i>
        <div>
          <strong>#${crate.id} · ${TYPES[crate.type].label}</strong>
          <span>${crate.mass} kg · ${placed?'loaded':'waiting'}</span>
        </div>
        <span>${Math.round(crate.integrity)}%</span>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.manifest-item').forEach(item=>{
    item.addEventListener('click',()=>{
      if(phase!=='loading')return;
      selectedId=Number(item.dataset.id);
      renderManifest();
      draw();
    });
  });
}

function slotCenter(row,col){
  return {
    x:HOLD_X+col*(CELL+GAP)+CELL/2,
    y:HOLD_Y+row*(CELL+GAP)+CELL/2
  };
}

function clickedSlot(x,y){
  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      const sx=HOLD_X+col*(CELL+GAP);
      const sy=HOLD_Y+row*(CELL+GAP);

      if(
        x>=sx&&x<=sx+CELL&&
        y>=sy&&y<=sy+CELL
      ){
        return {row,col};
      }
    }
  }

  return null;
}

function crateAt(row,col){
  return crates.find(
    crate=>crate.row===row&&crate.col===col
  )||null;
}

canvas.addEventListener('pointerdown',event=>{
  if(phase!=='loading')return;

  const rect=canvas.getBoundingClientRect();
  const x=(event.clientX-rect.left)*canvas.width/rect.width;
  const y=(event.clientY-rect.top)*canvas.height/rect.height;

  const slot=clickedSlot(x,y);

  if(!slot)return;

  const existing=crateAt(slot.row,slot.col);

  if(existing){
    selectedId=existing.id;
    renderManifest();
    draw();
    return;
  }

  const selected=crates.find(crate=>crate.id===selectedId);

  if(!selected)return;

  selected.row=slot.row;
  selected.col=slot.col;
  selectedId=null;

  renderManifest();
  updateUI();
  draw();
});

launchBtn.addEventListener('click',()=>{
  if(phase!=='loading')return;

  const placed=crates.filter(crate=>crate.row!==null);

  if(placed.length!==crates.length){
    missionTitle.textContent='Load every crate before launch.';
    return;
  }

  const balance=balanceScore();

  if(balance<40){
    missionTitle.textContent='Center of mass is too unstable to launch.';
    eventFlash=1;
    draw();
    return;
  }

  phase='flight';
  missionTitle.textContent='Orbital transfer underway.';
  phasePill.textContent='IN FLIGHT';
  phaseValue.textContent='Flight';
  launchBtn.disabled=true;
  launchBtn.textContent='Cargo locked';
  last=performance.now();
  raf=requestAnimationFrame(loop);
});

restartBtn.addEventListener('click',newManifest);

function centerOfMass(){
  const placed=crates.filter(crate=>crate.row!==null);

  if(!placed.length){
    return {x:0,y:0,mass:0};
  }

  let total=0;
  let x=0;
  let y=0;

  for(const crate of placed){
    const p=slotCenter(crate.row,crate.col);
    total+=crate.mass;
    x+=p.x*crate.mass;
    y+=p.y*crate.mass;
  }

  return {
    x:x/total,
    y:y/total,
    mass:total
  };
}

function idealCenter(){
  const first=slotCenter(0,0);
  const last=slotCenter(ROWS-1,COLS-1);

  return {
    x:(first.x+last.x)/2,
    y:(first.y+last.y)/2
  };
}

function balanceScore(){
  const com=centerOfMass();
  const ideal=idealCenter();

  if(com.mass===0)return 0;

  const maxDist=Math.hypot(
    COLS*(CELL+GAP)/2,
    ROWS*(CELL+GAP)/2
  );

  const dist=Math.hypot(
    com.x-ideal.x,
    com.y-ideal.y
  );

  return Math.max(
    0,
    Math.min(100,100-(dist/maxDist)*180)
  );
}

function imbalanceVector(){
  const com=centerOfMass();
  const ideal=idealCenter();

  return {
    x:(com.x-ideal.x)/CELL,
    y:(com.y-ideal.y)/CELL
  };
}

function loop(time){
  if(phase!=='flight')return;

  const dt=Math.min((time-last)/1000,.05);
  last=time;

  updateFlight(dt);
  draw();

  if(phase==='flight'){
    raf=requestAnimationFrame(loop);
  }
}

function updateFlight(dt){
  flightTime+=dt;
  turbulenceTimer+=dt;
  eventFlash=Math.max(0,eventFlash-dt*2);

  const progress=Math.min(1,flightTime/22);

  turbulence=
    0.2+
    Math.sin(flightTime*1.6)*0.18+
    progress*.75+
    Math.random()*.08;

  turbulence=Math.max(0,Math.min(1,turbulence));

  if(turbulenceTimer>1.15){
    turbulenceTimer=0;
    applyTurbulence();
  }

  score=Math.max(
    0,
    Math.floor(
      flightTime*12+
      balanceScore()*4+
      delivered*100-
      damaged*60-
      (100-hull)*5
    )
  );

  best=Math.max(best,score);

  if(hull<=0){
    endRun(false,'Hull failure. The load destroyed the freighter.');
    return;
  }

  if(flightTime>=22){
    const intact=crates.filter(crate=>crate.integrity>0).length;
    delivered=intact;
    const success=hull>0&&intact>=Math.ceil(crates.length*.7);

    endRun(
      success,
      success
        ? 'Cargo delivered to orbit.'
        : 'Transfer complete, but too much cargo was lost.'
    );
    return;
  }

  updateUI();
}

function applyTurbulence(){
  const balance=balanceScore();
  const imbalance=imbalanceVector();

  for(const crate of crates){
    const baseRisk=turbulence*(1-balance/100);
    const type=TYPES[crate.type];
    const risk=baseRisk*(.65+type.fragility);

    if(Math.random()>risk*.72)continue;

    const dx=
      Math.abs(imbalance.x)>.18
        ? Math.sign(imbalance.x)
        : (Math.random()<.5?-1:1);

    const dy=
      Math.abs(imbalance.y)>.18
        ? Math.sign(imbalance.y)
        : 0;

    let moved=false;

    for(const [mx,my] of [[dx,0],[0,dy],[-dx,0],[0,-dy]]){
      if(mx===0&&my===0)continue;

      const nc=crate.col+mx;
      const nr=crate.row+my;

      if(
        nc<0||nc>=COLS||
        nr<0||nr>=ROWS||
        crateAt(nr,nc)
      ){
        continue;
      }

      crate.col=nc;
      crate.row=nr;
      crate.shifted=true;
      moved=true;
      break;
    }

    const damage=
      (8+Math.random()*15)*
      (1+type.fragility);

    crate.integrity=Math.max(
      0,
      crate.integrity-damage
    );

    if(type.hazard&&crate.integrity<70){
      hull=Math.max(
        0,
        hull-(7+Math.random()*9)
      );
    }

    if(!moved){
      crate.integrity=Math.max(
        0,
        crate.integrity-5
      );
    }

    eventFlash=1;
  }

  damaged=crates.filter(
    crate=>crate.integrity<100
  ).length;

  const destroyed=crates.filter(
    crate=>crate.integrity<=0
  );

  if(destroyed.length){
    hull=Math.max(
      0,
      hull-destroyed.length*4
    );
  }

  const currentBalance=balanceScore();

  if(currentBalance<30){
    hull=Math.max(
      0,
      hull-(4+Math.random()*7)
    );
  }

  renderManifest();
}

async function endRun(success,message){
  phase='ended';
  phasePill.textContent=success?'DELIVERED':'FAILED';
  phaseValue.textContent=success?'Delivered':'Failed';
  missionTitle.textContent=message;
  launchBtn.disabled=false;
  launchBtn.textContent='New manifest';
  launchBtn.onclick=newManifest;

  score=Math.max(
    0,
    Math.floor(
      score+
      (success?500:0)+
      delivered*120+
      balanceScore()*3
    )
  );

  best=Math.max(best,score);

  updateUI();
  draw();

  try{
    const response=await fetch('score.php',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        score,
        delivered,
        total:crates.length,
        balance:Number(balanceScore().toFixed(1)),
        successful:success
      })
    });

    const data=await response.json();

    if(response.ok&&data.stats){
      best=Number(data.stats.best_score||best);
      bestEl.textContent=best;
    }
  }catch(_){}
}

function updateUI(){
  const com=centerOfMass();
  const ideal=idealCenter();
  const balance=balanceScore();

  scoreEl.textContent=score;
  bestEl.textContent=best;
  balanceEl.textContent=`${balance.toFixed(0)}%`;
  hullEl.textContent=`${Math.max(0,hull).toFixed(0)}%`;

  if(com.mass){
    comReadout.textContent=
      `${((com.x-ideal.x)/CELL).toFixed(2)} / ${((com.y-ideal.y)/CELL).toFixed(2)}`;
  }else{
    comReadout.textContent='0.00 / 0.00';
  }

  massReadout.textContent=`${Math.round(com.mass)} kg`;
  deliveredEl.textContent=`${delivered} / ${crates.length}`;
  damagedEl.textContent=damaged;
  turbulenceEl.textContent=
    phase==='flight'
      ? `${Math.round(turbulence*100)}%`
      : '—';

  if(phase==='loading'){
    phaseValue.textContent='Loading';
    phasePill.textContent='LOADING';
    launchBtn.disabled=false;
    launchBtn.textContent='Launch cargo run';
    launchBtn.onclick=null;
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);

  drawSpace();
  drawShip();
  drawHold();
  drawCenterOfMass();
  drawFlightEffects();
}

function drawSpace(){
  ctx.fillStyle='#091017';
  ctx.fillRect(0,0,W,H);

  for(let i=0;i<65;i++){
    const x=(i*137)%W;
    const y=(i*83)%H;
    const s=(i%3)+1;

    ctx.globalAlpha=.25+(i%5)*.1;
    ctx.fillStyle='#dce7f0';
    ctx.fillRect(x,y,s,s);
  }

  ctx.globalAlpha=1;

  if(phase==='flight'){
    const offset=(flightTime*90)%120;

    ctx.strokeStyle='rgba(139,181,214,.12)';
    ctx.lineWidth=2;

    for(let y=-120;y<H+120;y+=120){
      ctx.beginPath();
      ctx.moveTo(0,y+offset);
      ctx.lineTo(W,y+offset-70);
      ctx.stroke();
    }
  }
}

function drawShip(){
  ctx.fillStyle='#121d27';
  ctx.strokeStyle='#334454';
  ctx.lineWidth=3;

  ctx.beginPath();
  ctx.roundRect(72,58,756,530,42);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle='#0b131b';
  ctx.beginPath();
  ctx.roundRect(122,92,656,456,24);
  ctx.fill();

  ctx.fillStyle='#263646';
  ctx.fillRect(57,260,25,110);
  ctx.fillRect(818,260,25,110);
}

function drawHold(){
  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      const x=HOLD_X+col*(CELL+GAP);
      const y=HOLD_Y+row*(CELL+GAP);

      ctx.fillStyle='#111b24';
      ctx.strokeStyle='#293846';
      ctx.lineWidth=2;

      ctx.beginPath();
      ctx.roundRect(x,y,CELL,CELL,10);
      ctx.fill();
      ctx.stroke();

      const crate=crateAt(row,col);

      if(crate){
        drawCrate(crate,x,y);
      }
    }
  }

  const ideal=idealCenter();

  ctx.strokeStyle='rgba(123,216,166,.45)';
  ctx.lineWidth=2;

  ctx.beginPath();
  ctx.arc(ideal.x,ideal.y,14,0,Math.PI*2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ideal.x-20,ideal.y);
  ctx.lineTo(ideal.x+20,ideal.y);
  ctx.moveTo(ideal.x,ideal.y-20);
  ctx.lineTo(ideal.x,ideal.y+20);
  ctx.stroke();
}

function drawCrate(crate,x,y){
  const info=TYPES[crate.type];
  const pad=8;

  ctx.save();

  if(crate.id===selectedId){
    ctx.shadowColor=info.color;
    ctx.shadowBlur=18;
  }

  ctx.fillStyle=info.color;
  ctx.beginPath();
  ctx.roundRect(
    x+pad,
    y+pad,
    CELL-pad*2,
    CELL-pad*2,
    8
  );
  ctx.fill();

  ctx.shadowBlur=0;

  if(crate.integrity<100){
    ctx.fillStyle='rgba(8,12,16,.25)';
    ctx.fillRect(
      x+pad,
      y+pad,
      CELL-pad*2,
      (CELL-pad*2)*(1-crate.integrity/100)
    );
  }

  ctx.fillStyle='#0c1117';
  ctx.font='900 13px system-ui';
  ctx.textAlign='left';
  ctx.fillText(
    `#${crate.id}`,
    x+16,
    y+27
  );

  ctx.font='800 11px system-ui';
  ctx.fillText(
    `${crate.mass}kg`,
    x+16,
    y+46
  );

  ctx.font='700 10px system-ui';
  ctx.fillText(
    `${Math.round(crate.integrity)}%`,
    x+16,
    y+66
  );

  if(crate.type==='hazard'){
    ctx.font='900 18px system-ui';
    ctx.textAlign='right';
    ctx.fillText(
      '!',
      x+CELL-16,
      y+28
    );
  }

  ctx.restore();
}

function drawCenterOfMass(){
  const com=centerOfMass();

  if(!com.mass)return;

  ctx.fillStyle=
    balanceScore()>70
      ? '#78d8a7'
      : balanceScore()>45
        ? '#e4b45d'
        : '#e87171';

  ctx.beginPath();
  ctx.arc(com.x,com.y,9,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle='rgba(255,255,255,.5)';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(com.x,com.y,17,0,Math.PI*2);
  ctx.stroke();
}

function drawFlightEffects(){
  if(phase!=='flight')return;

  ctx.fillStyle='rgba(255,255,255,.55)';
  ctx.font='800 12px system-ui';
  ctx.textAlign='left';
  ctx.fillText(
    `TRANSFER ${Math.min(100,(flightTime/22)*100).toFixed(0)}%`,
    92,
    82
  );

  const barW=230;

  ctx.fillStyle='rgba(255,255,255,.08)';
  ctx.fillRect(92,94,barW,7);

  ctx.fillStyle='#6ea8e8';
  ctx.fillRect(
    92,
    94,
    barW*Math.min(1,flightTime/22),
    7
  );

  if(eventFlash>0){
    ctx.fillStyle=`rgba(232,113,113,${eventFlash*.08})`;
    ctx.fillRect(0,0,W,H);
  }
}

newManifest();
