/* 打卡明信片引擎：影像效果、10 種版型、印章、PDF 報表（純 canvas，不碰 DOM 狀態）
   由 checkin-postcard-demo-v11 移植。用 setTrip() 設定旅程資訊。 */
export let TRIP={name:"",date:"",day:1,weekday:""};
export function setTrip(t){TRIP={...TRIP,...t}}
export const pad=n=>String(n).padStart(2,"0");
export const fmtDate=t=>{const d=new Date(t);return`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`};
export const fmtTime=t=>{const d=new Date(t);return`${pad(d.getHours())}:${pad(d.getMinutes())}`};
/* ================================================================
   影像處理
   ================================================================ */
function cover(src,w,h,fx=.5,fy=.5,zoom=1){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");const s=Math.max(w/src.width,h/src.height)*zoom,dw=src.width*s,dh=src.height*s;g.drawImage(src,(w-dw)*fx,(h-dh)*fy,dw,dh);return g.getImageData(0,0,w,h)}
function lumOf(d){const n=d.data.length/4,L=new Float32Array(n);for(let i=0,j=0;i<n;i++,j+=4)L[i]=(.299*d.data[j]+.587*d.data[j+1]+.114*d.data[j+2])/255;return L}
function stretch(L,lo=.02,hi=.98){const h=new Uint32Array(256);for(const v of L)h[Math.min(255,v*255|0)]++;let a=0,b=255,acc=0,n=L.length;for(let i=0;i<256;i++){acc+=h[i];if(acc>=n*lo){a=i;break}}acc=0;for(let i=255;i>=0;i--){acc+=h[i];if(acc>=n*(1-hi)){b=i;break}}const A=a/255,B=Math.max(A+.05,b/255);for(let i=0;i<n;i++)L[i]=Math.min(1,Math.max(0,(L[i]-A)/(B-A)));return L}
function boxPass(src,dst,w,h,r,horiz){const n=2*r+1;if(horiz){for(let y=0;y<h;y++){const o=y*w;let acc=0;for(let x=-r;x<=r;x++)acc+=src[o+Math.min(w-1,Math.max(0,x))];for(let x=0;x<w;x++){dst[o+x]=acc/n;acc+=src[o+Math.min(w-1,x+r+1)]-src[o+Math.max(0,x-r)]}}}else{for(let x=0;x<w;x++){let acc=0;for(let y=-r;y<=r;y++)acc+=src[Math.min(h-1,Math.max(0,y))*w+x];for(let y=0;y<h;y++){dst[y*w+x]=acc/n;acc+=src[Math.min(h-1,y+r+1)*w+x]-src[Math.max(0,y-r)*w+x]}}}}
function blur(a,w,h,sigma){const r=Math.max(1,Math.round(sigma)),t=new Float32Array(a.length);let s=Float32Array.from(a);for(let k=0;k<3;k++){boxPass(s,t,w,h,r,true);boxPass(t,s,w,h,r,false)}return s}
/* XDoG 風格線稿：回傳 0~1 的墨線濃度 */
function inkLines(L,w,h,sigma,density){const g1=blur(L,w,h,sigma),g2=blur(L,w,h,sigma*1.6),D=new Float32Array(L.length);for(let i=0;i<L.length;i++)D[i]=g1[i]-g2[i];
  const smp=[];for(let i=0;i<D.length;i+=7)smp.push(D[i]);smp.sort((a,b)=>a-b);const t=Math.max(density>.072?.007:density<.06?.009:.012,-smp[Math.floor(smp.length*density)]);
  const M=new Float32Array(L.length);for(let i=0;i<D.length;i++){const v=-D[i];M[i]=v>t?1:v>t*.6?(v-t*.6)/(t*.4):0}return M}
function lowNoise(w,h,cell,seed){const sw=Math.ceil(w/cell)+2,sh=Math.ceil(h/cell)+2,c=document.createElement("canvas");c.width=sw;c.height=sh;const g=c.getContext("2d"),d=g.createImageData(sw,sh);let x=seed||7;for(let i=0;i<d.data.length;i+=4){x=(x*16807)%2147483647;const v=x%256;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}g.putImageData(d,0,0);const b=document.createElement("canvas");b.width=w;b.height=h;const bg=b.getContext("2d");bg.imageSmoothingQuality="high";bg.drawImage(c,0,0,sw,sh,-cell,-cell,w+2*cell,h+2*cell);const o=bg.getImageData(0,0,w,h).data,N=new Float32Array(w*h);for(let i=0;i<N.length;i++)N[i]=o[i*4]/255;return N}
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function toCanvas(d){const c=document.createElement("canvas");c.width=d.width;c.height=d.height;c.getContext("2d").putImageData(d,0,0);return c}

/* 藍墨漫畫：局部對比＋銳化 → 45° 網點（亮處小圓點、中間棋盤、暗處白孔）→ 細墨線 */
function fxInk(src,w,h,fx,fy){const d=cover(src,w,h,fx,fy),n=w*h,p=d.data;let L=stretch(lumOf(d),.005,.995);
  const big=blur(L,w,h,12),sm=blur(L,w,h,1);for(let i=0;i<n;i++){let v=L[i]+.55*(L[i]-big[i])+.6*(L[i]-sm[i]);L[i]=Math.min(1,Math.max(0,v))}
  const lines=inkLines(blur(L,w,h,1),w,h,1,.045);
  const ink=hex("#1b4a73"),paper=hex("#f9fbfc"),cell=3.8,TAU=Math.PI*2,S=Math.SQRT1_2;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,j=i*4;let l=L[i];
    let cov=Math.pow(1-l,1.15);cov=cov<.04?0:cov>.97?1:cov;
    const u=(x+y)*S/cell,v=(x-y)*S/cell,spot=(Math.cos(TAU*u)+Math.cos(TAU*v))/4+.5;
    let a=Math.min(1,Math.max(0,(spot-(1-cov))/.16+.5));
    a=Math.max(a,lines[i]*.95);p[j]=paper[0]+(ink[0]-paper[0])*a;p[j+1]=paper[1]+(ink[1]-paper[1])*a;p[j+2]=paper[2]+(ink[2]-paper[2])*a}
  return toCanvas(d)}

/* 像素 16 色：Kuwahara 平滑 → 中位切割 16 色（不抖動）→ 清雜點 → 深色描邊，邊緣乾淨銳利 */
function medianCut(px,k){let boxes=[px];while(boxes.length<k){let bi=-1,best=-1,ch=0;boxes.forEach((b,i)=>{if(b.length<2)return;for(let c=0;c<3;c++){let mn=255,mx=0;for(const p of b){mn=Math.min(mn,p[c]);mx=Math.max(mx,p[c])}const sc=(mx-mn)*(c===1?1.2:1);if(sc>best){best=sc;bi=i;ch=c}}});if(bi<0)break;const b=boxes[bi].sort((x,y)=>x[ch]-y[ch]),m=b.length>>1;boxes.splice(bi,1,b.slice(0,m),b.slice(m))}
  return boxes.map(b=>{let r=0,g=0,bl=0;for(const p of b){r+=p[0];g+=p[1];bl+=p[2]}return[r/b.length|0,g/b.length|0,bl/b.length|0]}).sort((a,b)=>(.3*a[0]+.59*a[1]+.11*a[2])-(.3*b[0]+.59*b[1]+.11*b[2]))}
function kuwahara(p,w,h,r){const out=new Uint8ClampedArray(p.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let bestV=1e9,bm=[0,0,0];
    for(const[qx,qy]of[[-r,-r],[0,-r],[-r,0],[0,0]]){let s0=0,s1=0,s2=0,sl=0,sl2=0,n=0;
      for(let dy=0;dy<=r;dy++)for(let dx=0;dx<=r;dx++){const xx=Math.min(w-1,Math.max(0,x+qx+dx)),yy=Math.min(h-1,Math.max(0,y+qy+dy)),j=(yy*w+xx)*4,l=.3*p[j]+.59*p[j+1]+.11*p[j+2];s0+=p[j];s1+=p[j+1];s2+=p[j+2];sl+=l;sl2+=l*l;n++}
      const v=sl2/n-(sl/n)**2;if(v<bestV){bestV=v;bm=[s0/n,s1/n,s2/n]}}
    const j=(y*w+x)*4;out[j]=bm[0];out[j+1]=bm[1];out[j+2]=bm[2];out[j+3]=255}
  return out}
function fxPixel(src,w,h,cell){const pw=Math.round(w/cell),ph=Math.round(h/cell);
  /* 先縮到 2 倍大小做平滑，再縮到目標格數，色塊比較乾淨 */
  const big=cover(src,pw*2,ph*2,.5,.5),kb=kuwahara(big.data,pw*2,ph*2,1);big.data.set(kb);
  const mid=toCanvas(big),sc=document.createElement("canvas");sc.width=pw;sc.height=ph;const sg=sc.getContext("2d");sg.imageSmoothingQuality="high";sg.drawImage(mid,0,0,pw,ph);
  const d=sg.getImageData(0,0,pw,ph),p=d.data,n=pw*ph;
  /* 對比＋飽和度提一點 */
  const L=stretch(lumOf(d),.01,.99);for(let i=0,j=0;i<n;i++,j+=4){const m=(.3*p[j]+.59*p[j+1]+.11*p[j+2]),t=L[i]*255;for(let c=0;c<3;c++){let v=p[j+c]+(t-m);v=t+(v-t)*1.3;p[j+c]=Math.max(0,Math.min(255,v))}}
  const px=[];for(let j=0;j<p.length;j+=4)px.push([p[j],p[j+1],p[j+2]]);const pal=medianCut(px,16);
  const idx=new Uint8Array(n);for(let i=0,j=0;i<n;i++,j+=4){let best=0,bd=1e9;for(let k=0;k<pal.length;k++){const dr=p[j]-pal[k][0],dg=p[j+1]-pal[k][1],db=p[j+2]-pal[k][2],dd=dr*dr*.3+dg*dg*.59+db*db*.11;if(dd<bd){bd=dd;best=k}}idx[i]=best}
  /* 清掉孤立的單一像素（跟四周都不同就換成周圍最多的顏色） */
  for(let pass=0;pass<2;pass++){const cp=idx.slice();for(let y=1;y<ph-1;y++)for(let x=1;x<pw-1;x++){const i=y*pw+x,c=cp[i],cnt={};let same=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const v=cp[i+dy*pw+dx];if(v===c)same++;cnt[v]=(cnt[v]||0)+1}if(same<=1){let bk=c,bc=0;for(const k in cnt)if(cnt[k]>bc){bc=cnt[k];bk=+k}idx[i]=bk}}}
  /* 深色描邊：亮度落差大的地方，較暗的那一側畫上最深的顏色 */
  const Lq=new Float32Array(n);for(let i=0;i<n;i++){const c=pal[idx[i]];Lq[i]=(.3*c[0]+.59*c[1]+.11*c[2])/255}
  const outline=idx.slice();for(let y=1;y<ph-1;y++)for(let x=1;x<pw-1;x++){const i=y*pw+x;let mx=0;for(const o of[1,-1,pw,-pw])mx=Math.max(mx,Lq[i+o]-Lq[i]);if(mx>.22&&Lq[i]<.62)outline[i]=Math.min(idx[i],1)}
  for(let i=0,j=0;i<n;i++,j+=4){const c=pal[outline[i]];p[j]=c[0];p[j+1]=c[1];p[j+2]=c[2];p[j+3]=255}
  const small=toCanvas(d),out=document.createElement("canvas");out.width=pw*cell;out.height=ph*cell;const g=out.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(small,0,0,out.width,out.height);return{canvas:out,palette:pal}}



/* 同一張照片、同樣尺寸的效果只算一次（改字、蓋章時不用重算） */
const fxCache=new WeakMap();
function memo(fn,name){return(src,...a)=>{let m=fxCache.get(src);if(!m){m=new Map();fxCache.set(src,m)}const k=name+"|"+a.join(",");if(!m.has(k))m.set(k,fn(src,...a));return m.get(k)}}
const INK=memo(fxInk,"ink"),PIXEL=memo(fxPixel,"pix");

/* ---------- 明信片排版：直式 1080×1350、橫式 1500×1000 ---------- */
const SIZE={port:[1080,1350],land:[1500,1000]};
const SANS='"Noto Sans TC","Lexend",sans-serif',LEX='"Lexend","Noto Sans TC",sans-serif',PIX='"DotGothic16","Noto Sans TC",monospace',HAND='"LXGW WenKai TC","Noto Sans TC",sans-serif',SERIF_TC='"Noto Serif TC","Noto Sans TC",serif';
function paperBg(g,W,H,color,seed){g.fillStyle=color;g.fillRect(0,0,W,H);let x=seed;for(let i=0;i<W*H/300;i++){x=(x*16807)%2147483647;const px=x%W;x=(x*16807)%2147483647;const py=x%H;x=(x*16807)%2147483647;g.fillStyle=x%2?"rgba(120,100,80,.06)":"rgba(255,255,255,.35)";g.fillRect(px,py,2,2)}}
function fitText(g,text,font,size,max){let s=size;do{g.font=font.replace("{s}",s);if(g.measureText(text).width<=max)break;s-=2}while(s>18);return s}
function spaced(g,text,x,y,track){const ch=[...text];const ws=ch.map(c=>g.measureText(c).width);const tot=ws.reduce((a,b)=>a+b,0)+track*(ch.length-1);let cx=x-tot/2;g.textAlign="left";ch.forEach((c,i)=>{g.fillText(c,cx,y);cx+=ws[i]+track});g.textAlign="center"}
function drawCover(g,src,x,y,w,h){const s=Math.max(w/src.width,h/src.height),dw=src.width*s,dh=src.height*s;g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.drawImage(src,x+(w-dw)/2,y+(h-dh)/2,dw,dh);g.restore()}
function wrap(g,text,max,lines){const out=[];let line="";for(const ch of[...text.replace(/\s+/g," ").trim()]){if(g.measureText(line+ch).width>max&&line){out.push(line);line=ch;if(out.length===lines)break}else line+=ch}if(out.length<lines&&line)out.push(line);else if(out.length===lines&&line&&out.join("").length<[...text].length){out[lines-1]=out[lines-1].slice(0,-1)+"…"}return out}
/* 手寫留言，最多兩行 */
function message(g,msg,cx,y,max,color,size=36){if(!msg)return;g.fillStyle=color;g.textAlign="center";g.font=`700 ${size}px ${HAND}`;wrap(g,msg,max,2).forEach((l,i)=>g.fillText(l,cx,y+i*size*1.3))}
function boxed(g,c,x,y,ink,shadow){if(shadow){g.fillStyle=ink;g.fillRect(x+8,y+8,c.width,c.height)}g.drawImage(c,x,y);g.lineWidth=4;g.strokeStyle=ink;g.strokeRect(x-2,y-2,c.width+4,c.height+4)}
function pixelText(g,stop,cx,y,ink){g.fillStyle=ink;g.textAlign="center";const s=fitText(g,stop.title,`400 {s}px ${PIX}`,50,620);g.font=`400 ${s}px ${PIX}`;spaced(g,stop.title,cx,y,s*.3);
  g.fillRect(cx-24,y+28,48,4);g.font=`400 28px ${PIX}`;spaced(g,`${stop.time} · ${TRIP.date}`,cx,y+82,3);g.font=`400 24px ${PIX}`;g.globalAlpha=.75;spaced(g,`STAGE ${pad(stop.no)} · ${TRIP.name}`,cx,y+124,3);g.globalAlpha=1}
function serifText(g,stop,cx,y,ink){g.fillStyle=ink;g.textAlign="center";const s=fitText(g,stop.title,`700 {s}px ${SERIF_TC}`,48,620);g.font=`700 ${s}px ${SERIF_TC}`;spaced(g,stop.title,cx,y,s*.4);g.fillRect(cx-24,y+28,48,3);g.font=`600 28px ${LEX}`;spaced(g,`${stop.time} · ${TRIP.date}`,cx,y+82,3);g.globalAlpha=.75;g.font=`500 24px ${SERIF_TC}`;spaced(g,`第 ${stop.no} 站 · ${TRIP.name}`,cx,y+124,4);g.globalAlpha=1}

/* 照片＋插畫（像素 / 藍墨共用排版；有留言時把空間讓出來） */
function composeSplitBase(kind){return(src,stop,orient,msg)=>{const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  const pixel=kind==="pix",ink=pixel?"#1e2a45":"#1b4a73";paperBg(g,W,H,pixel?"#f7f6f2":"#f9fbfc",pixel?13:17);
  const art=(w,h)=>pixel?PIXEL(src,w,h,4).canvas:INK(src,w,h,.5,.5),text=pixel?pixelText:serifText;
  if(orient==="port"){if(!msg){drawCover(g,src,0,0,W,640);boxed(g,art(800,448),140,680,ink,pixel);text(g,stop,W/2,1200,ink)}
    else{drawCover(g,src,0,0,W,560);boxed(g,art(800,400),140,600,ink,pixel);text(g,stop,W/2,1080,ink);message(g,msg,W/2,1268,860,ink)}}
  else{const cx=760+(W-760)/2;drawCover(g,src,0,0,760,H);if(!msg){boxed(g,art(620,560),cx-310,110,ink,pixel);text(g,stop,cx,780,ink)}
    else{boxed(g,art(620,460),cx-310,80,ink,pixel);text(g,stop,cx,620,ink);message(g,msg,cx,826,620,ink,34)}}
  return c}}

/* 藍墨漫畫封面 */
function composeInk(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");paperBg(g,W,H,"#fdfdfc",3);const blue="#1b4a73";
  g.fillStyle=blue;g.textAlign="left";g.font=`800 44px ${LEX}`;g.fillText("OSAKA  TRIP",80,92);g.font=`900 34px ${LEX}`;g.fillText("✦",392,90);
  let px,py,pw,ph,cx,ty;if(orient==="port"){px=160;py=150;pw=760;ph=msg?690:800;cx=W/2;ty=msg?975:1090}else{px=80;py=130;pw=800;ph=790;cx=1190;ty=msg?400:470}
  boxed(g,INK(src,pw,ph,.5,.5),px,py,blue,false);
  g.fillStyle=blue;g.textAlign="center";fitText(g,stop.title,`900 {s}px ${SANS}`,msg&&orient==="port"?92:104,orient==="port"?900:500);g.fillText(stop.title,cx,ty);
  g.font=`700 ${msg&&orient==="port"?80:92}px Georgia,"Times New Roman",serif`;g.fillText(String(stop.no),cx,ty+(msg&&orient==="port"?92:106));
  const o=msg&&orient==="port"?-12:0;g.font=`800 28px ${SANS}`;g.fillText(`【 ${stop.time} 】`,cx,ty+155+o);g.font=`900 34px ${SANS}`;g.fillText(TRIP.name,cx,ty+210+o);
  if(msg)orient==="port"?message(g,msg,cx,ty+282,880,blue,34):message(g,msg,cx,ty+300,480,blue,34);return c}

const COMPOSE={split:composeSplitBase("pix"),splitink:composeSplitBase("ink"),ink:composeInk},STYLE_NAME={split:"照片＋像素",splitink:"照片＋藍墨",ink:"藍墨漫畫"};

/* ================================================================
   照片版型（原始照片為主，加上紙張、手寫字、拍立得、膠帶…）
   ================================================================ */
const SCRIPT='"Caveat","LXGW WenKai TC","Noto Sans TC",cursive',TYPE='"Special Elite","LXGW WenKai TC","Noto Sans TC",monospace';
const rnd=seed=>{let x=seed%2147483646+1;return()=>(x=(x*16807)%2147483647)/2147483647};
const subLine=stop=>`${stop.time} · 第 ${stop.no} 站 · ${TRIP.name}`;
function lines(g,text,max,n){return wrap(g,text,max,n)}
function textBlock(g,text,x,y,max,n,lh,align="left"){g.textAlign=align;lines(g,text,max,n).forEach((l,i)=>g.fillText(l,x,y+i*lh));return lines(g,text,max,n).length}
function grainBg(g,W,H,base,seed,amt=1){g.fillStyle=base;g.fillRect(0,0,W,H);const r=rnd(seed);for(let i=0;i<W*H/260*amt;i++){g.fillStyle=r()<.5?"rgba(90,70,50,.07)":"rgba(255,255,255,.4)";g.fillRect(r()*W,r()*H,1.5,1.5)}}
function kraftBg(g,W,H,seed){grainBg(g,W,H,"#dccfb7",seed,1.6);const r=rnd(seed+5);g.lineCap="round";for(let i=0;i<W*H/9000;i++){const x=r()*W,y=r()*H,a=r()*6.28,l=10+r()*40;g.strokeStyle=r()<.6?"rgba(110,85,55,.22)":"rgba(255,250,235,.5)";g.lineWidth=.8+r();g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a)*l*.5+r()*10,y+Math.sin(a)*l*.5+r()*10,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  for(let i=0;i<W*H/40000;i++){g.fillStyle="rgba(80,60,40,.18)";g.beginPath();g.arc(r()*W,r()*H,1+r()*3,0,7);g.fill()}}
function shadowed(g,fn,blur=24,oy=10,alpha=.22){g.save();g.shadowColor=`rgba(20,25,35,${alpha})`;g.shadowBlur=blur;g.shadowOffsetY=oy;fn();g.restore()}
function around(g,cx,cy,rot,fn){g.save();g.translate(cx,cy);g.rotate(rot);fn();g.restore()}
function handLine(g,x1,y1,x2,y2,w,color,seed){const r=rnd(seed);g.strokeStyle=color;g.lineWidth=w;g.lineCap="round";g.beginPath();g.moveTo(x1,y1);const n=6;for(let i=1;i<=n;i++){const t=i/n;g.lineTo(x1+(x2-x1)*t,y1+(y2-y1)*t+(r()-.5)*w*.9)}g.stroke()}
function tape(g,cx,cy,w,h,rot,seed){const r=rnd(seed);around(g,cx,cy,rot,()=>{g.fillStyle="rgba(236,232,214,.86)";g.beginPath();g.moveTo(-w/2,-h/2);for(let i=0;i<=6;i++)g.lineTo(-w/2+(r()-.5)*8,-h/2+h*i/6);g.lineTo(w/2,h/2);for(let i=6;i>=0;i--)g.lineTo(w/2+(r()-.5)*8,-h/2+h*i/6);g.closePath();g.shadowColor="rgba(0,0,0,.12)";g.shadowBlur=6;g.fill();g.shadowBlur=0;g.fillStyle="rgba(255,255,255,.18)";g.fillRect(-w/2,-h/2,w,h*.35)})}
function flower(g,x,y,R,rot){around(g,x,y,rot,()=>{g.strokeStyle="#151515";g.lineWidth=3;for(let k=0;k<6;k++){g.save();g.rotate(k*Math.PI/3);g.beginPath();g.ellipse(0,-R*.55,R*.24,R*.52,0,0,7);g.stroke();g.restore()}g.fillStyle="#151515";g.beginPath();g.arc(0,0,R*.1,0,7);g.fill()})}
function sprout(g,x,y,h){g.strokeStyle="#151515";g.lineWidth=3;g.lineCap="round";g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+4,y-h*.5,x-2,y-h);g.stroke();for(const s of[-1,1]){g.beginPath();g.moveTo(x-2,y-h*.82);g.quadraticCurveTo(x+s*h*.28,y-h*1.05,x+s*h*.34,y-h*.86);g.quadraticCurveTo(x+s*h*.2,y-h*.78,x-2,y-h*.82);g.stroke()}g.beginPath();g.moveTo(x-2,y-h);g.quadraticCurveTo(x+2,y-h*1.25,x+6,y-h*1.18);g.stroke()}
function binderClip(g,x,y,s,rot){around(g,x,y,rot,()=>{g.strokeStyle="#b9bcc2";g.lineWidth=s*.05;g.lineJoin="round";g.beginPath();g.moveTo(-s*.32,0);g.lineTo(-s*.18,-s*.75);g.lineTo(s*.18,-s*.75);g.lineTo(s*.32,0);g.stroke();g.strokeStyle="#e9eaec";g.lineWidth=s*.02;g.stroke();
  g.fillStyle="#141414";g.beginPath();g.moveTo(-s*.5,-s*.1);g.lineTo(s*.5,-s*.1);g.lineTo(s*.42,s*.42);g.lineTo(-s*.42,s*.42);g.closePath();g.fill();g.fillStyle="rgba(255,255,255,.18)";g.fillRect(-s*.46,-s*.06,s*.92,s*.08)})}
/* 輕微調色：print＝六〇年代印刷感、aged＝泛黃老照片 */
function gradeFx(src,mode){const c=document.createElement("canvas");c.width=src.width;c.height=src.height;const g=c.getContext("2d");g.drawImage(src,0,0);const d=g.getImageData(0,0,c.width,c.height),p=d.data,W=c.width,H=c.height;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=(y*W+x)*4;let r=p[j],gg=p[j+1],b=p[j+2];const m=.3*r+.59*gg+.11*b;
    if(mode==="print"){const s=1.12;r=m+(r-m)*s;gg=m+(gg-m)*s;b=m+(b-m)*s*1.05;r=12+r*.93;gg=10+gg*.94;b=14+b*.92}
    else{const s=.68;r=m+(r-m)*s;gg=m+(gg-m)*s;b=m+(b-m)*s;r=r*.86+m*.14+18;gg=gg*.88+m*.12+12;b=b*.8+m*.1+4;r=28+r*.84;gg=26+gg*.84;b=24+b*.8}
    const ux=x/W-.5,uy=y/H-.5,v=1-(ux*ux+uy*uy)*(mode==="print"?.25:.55);p[j]=r*v;p[j+1]=gg*v;p[j+2]=b*v}
  g.putImageData(d,0,0);return c}
const GRADE=memo(gradeFx,"grade");
function polaroid(g,cx,cy,w,h,rot,src,pad,bottom,fn){around(g,cx,cy,rot,()=>{shadowed(g,()=>{g.fillStyle="#fbfaf7";g.fillRect(-w/2,-h/2,w,h)},28,12,.25);const pw=w-pad*2,ph=h-pad-bottom;drawCover(g,src,-w/2+pad,-h/2+pad,pw,ph);g.strokeStyle="rgba(0,0,0,.08)";g.lineWidth=2;g.strokeRect(-w/2+pad,-h/2+pad,pw,ph);fn&&fn(-w/2,-h/2,w,h,pw,ph)})}
const textOr=(msg,stop)=>msg||stop.title;

/* 1 海平線海報 */
function composeHorizon(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");grainBg(g,W,H,"#ece2d1",21);
  const port=orient==="port",py=port?660:560;drawCover(g,src,0,py,W,H-py);
  const sx=W/2,sy=port?250:170,sr=port?54:44;g.fillStyle="#e2654b";g.beginPath();g.arc(sx,sy,sr,0,7);g.fill();const r=rnd(5);g.fillStyle="rgba(255,235,220,.25)";for(let i=0;i<120;i++){const a=r()*6.28,d=Math.sqrt(r())*sr;g.fillRect(sx+Math.cos(a)*d,sy+Math.sin(a)*d,2,2)}
  g.fillStyle="#2b2a28";g.font=`500 ${port?30:28}px ${LEX}`;const t=textOr(msg,stop);const ls=lines(g,t,port?620:760,2);const base=port?py-150:py-140;ls.forEach((l,i)=>spaced(g,l,W/2,base+i*48+(ls.length===1?24:0),4));
  g.globalAlpha=.6;g.font=`400 20px ${LEX}`;spaced(g,msg?`${stop.title} · ${stop.time}`:subLine(stop),W/2,base+(port?110:100),3);g.globalAlpha=1;return c}

/* 2 牛皮紙＋紙膠帶 */
function composeKraft(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");kraftBg(g,W,H,31);const ink="#141414",port=orient==="port";
  const hx=port?130:90,hy=port?230:190;g.fillStyle=ink;g.font=`700 ${port?76:68}px ${SCRIPT}`;g.textAlign="left";const head=fitText(g,stop.title+" :",`700 {s}px ${SCRIPT}`,port?76:68,port?820:520);g.fillText(stop.title+" :",hx,hy);
  handLine(g,hx-30,hy+36,hx+Math.min(g.measureText(stop.title+" :").width+30,port?860:560),hy+30,6,ink,7);
  g.font=`700 ${port?58:52}px ${SCRIPT}`;const items=msg?msg.split(/[，。,.!！?？\n、；;]+/).map(t=>t.trim()).filter(Boolean):[`${stop.time} 抵達`,`第 ${stop.no} 站`,TRIP.name];let y=hy+(port?130:120),left=port?5:6;items.forEach(it=>{if(left<=0)return;lines(g,it,port?760:470,left).forEach((l,k)=>{if(left--<=0)return;if(!k){g.beginPath();g.arc(hx-28,y-18,5,0,7);g.fill()}g.fillText(l,hx+10,y);y+=port?82:76})});
  const[px,pyy,pw,ph]=port?[110,Math.max(y+40,690),860,560]:[660,230,760,560];shadowed(g,()=>drawCover(g,src,px,pyy,pw,Math.min(ph,H-pyy-80)),10,4,.18);tape(g,px+pw/2,pyy+4,pw*.42,58,-.015,9);
  g.font=`600 34px ${SCRIPT}`;g.textAlign="right";g.globalAlpha=.75;g.fillText(TRIP.date,W-70,H-50);g.globalAlpha=1;return c}

/* 3 拍立得＋塗鴉 */
function composeDoodle(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");grainBg(g,W,H,"#fbfbf9",41,.6);const ink="#151515",port=orient==="port";
  const sub=msg||`${stop.time} · ${TRIP.name}`;
  if(port){g.fillStyle=ink;g.font=`600 72px ${SCRIPT}`;g.textAlign="center";const tl=lines(g,stop.title,860,2);tl.forEach((l,i)=>spaced(g,l,W/2,150+i*96,10));
    polaroid(g,W/2,700,620,720,-.02,src,34,150);flower(g,W/2+300,370,62,.3);sprout(g,240,1010,90);
    g.font=`600 58px ${SCRIPT}`;const sl=lines(g,sub,860,2);sl.forEach((l,i)=>{spaced(g,l,W/2,1180+i*74,4)});const lw=Math.min(860,g.measureText(sl[sl.length-1]).width+60);handLine(g,W/2-lw/2+40,1196+(sl.length-1)*74,W/2+lw/2,1194+(sl.length-1)*74,4,ink,3)}
  else{polaroid(g,420,500,520,620,-.03,src,30,130);flower(g,660,210,56,.3);sprout(g,170,860,80);g.fillStyle=ink;g.textAlign="center";const cx=1080;
    g.font=`600 70px ${SCRIPT}`;lines(g,stop.title,620,2).forEach((l,i)=>spaced(g,l,cx,330+i*92,8));g.font=`600 54px ${SCRIPT}`;const sl=lines(g,sub,600,3);sl.forEach((l,i)=>spaced(g,l,cx,560+i*70,3));const lw=Math.min(600,g.measureText(sl[sl.length-1]).width+50);handLine(g,cx-lw/2,576+(sl.length-1)*70,cx+lw/2,574+(sl.length-1)*70,4,ink,3)}
  return c}

/* 4 長尾夾拍立得＋手寫詩 */
function filmDate(g,x,y,rot){around(g,x,y,rot,()=>{g.font=`600 26px ${LEX}`;g.fillStyle="rgba(255,150,70,.9)";g.shadowColor="rgba(255,120,40,.9)";g.shadowBlur=8;g.textAlign="left";g.fillText(`'${TRIP.date.slice(2).replace(/\./g," ")}`,0,0)})}
function composeClip(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");grainBg(g,W,H,"#eeeeec",51,.8);const ink="#161616",port=orient==="port";
  const text=msg||`${stop.title}\n${stop.time}，第 ${stop.no} 站`;const[cx,cy,w,h]=port?[500,520,600,790]:[400,480,520,700];
  polaroid(g,cx,cy,w,h,-.045,src,38,150,(x,y,ww,hh,pw,ph)=>filmDate(g,x+60,y+38+ph-40,-Math.PI/2));
  binderClip(g,cx-w/2+150,cy-h/2+6,110,-.05);
  around(g,port?320:880,port?1000:330,-.07,()=>{g.fillStyle=ink;g.font=`600 ${port?60:58}px ${SCRIPT}`;g.textAlign="left";let y=0;text.split("\n").forEach(par=>{lines(g,par,port?640:540,5).forEach(l=>{g.fillText(l,0,y);y+=port?62:66})})});return c}

/* 5 經典拍立得 */
function composePolaroid(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");grainBg(g,W,H,"#e7e4dd",61);const ink="#1d2440",port=orient==="port";
  const t=msg||stop.title;const[cx,cy,w,h,pad,bot]=port?[540,665,880,1100,48,250]:[420,500,640,800,36,180];
  polaroid(g,cx,cy,w,h,.012,src,pad,bot,(x,y,ww,hh,pw,ph)=>{g.fillStyle=ink;g.font=`600 ${port?66:54}px ${SCRIPT}`;g.textAlign="center";const ls=lines(g,t,ww-120,2);ls.forEach((l,i)=>g.fillText(l,0,y+pad+ph+(port?104:80)+i*(port?70:58)-(ls.length-1)*(port?22:18)))});
  if(!port){g.fillStyle=ink;g.textAlign="left";g.font=`600 76px ${SCRIPT}`;lines(g,stop.title,560,2).forEach((l,i)=>g.fillText(l,840,400+i*90));g.font=`600 44px ${SCRIPT}`;g.globalAlpha=.75;g.fillText(subLine(stop),840,560);g.globalAlpha=1}
  return c}

/* 6、7 雙面明信片：先畫成 960×620 的正反面，再依直／橫排在一起 */
const PC=[960,620];
function cardCanvas(fill){const c=document.createElement("canvas");[c.width,c.height]=PC;const g=c.getContext("2d");fill(g,c.width,c.height);return c}
function placeTwo(g,W,H,front,back,orient,shadowA=.28){const port=orient==="port";const rects=port?[[60,45,960,620],[60,690,960,620]]:[[40,270,700,452],[760,270,700,452]];
  [front,back].forEach((cv,i)=>{const[x,y,w,h]=rects[i];shadowed(g,()=>g.drawImage(cv,x,y,w,h),26,12,shadowA)})}
function composeVintage(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");grainBg(g,W,H,"#d9d6cf",71);
  const front=cardCanvas((f,w,h)=>{drawCover(f,GRADE(src,"print"),0,0,w,h)});
  const back=cardCanvas((b,w,h)=>{grainBg(b,w,h,"#f2ecdc",73,.7);const ink="#2c2c2c";b.fillStyle=ink;b.textAlign="center";b.font=`700 26px ${SANS}`;spaced(b,stop.title,w*.25,70,4);
    b.font=`500 21px ${SERIF_TC}`;b.textAlign="left";const body=msg||`第 ${stop.no} 站，${stop.time} 抵達「${stop.title}」。${TRIP.name}的一天，從這裡留下紀念。`;textBlock(b,body,34,112,410,7,32);
    b.strokeStyle=ink;b.lineWidth=2;b.beginPath();b.moveTo(w/2,150);b.lineTo(w/2,h-40);b.stroke();
    b.textAlign="center";b.font=`700 16px ${LEX}`;b.fillText(TRIP.name+"  ·  OSAKA",w/2,44);b.lineWidth=2;b.beginPath();b.ellipse(w/2,90,64,26,0,0,7);b.stroke();b.font=`700 18px ${LEX}`;b.fillText(`STAGE ${pad(stop.no)}`,w/2,96);b.font=`600 15px ${LEX}`;b.fillText("DAY "+TRIP.day,w/2,136);
    b.fillStyle=ink;for(let i=0;i<6;i++)for(let k=0;k<7;k++)if(i===0||i===5||k===0||k===6){b.beginPath();b.arc(w-170+i*26,40+k*26,2.6,0,7);b.fill()}
    b.font=`500 16px ${SERIF_TC}`;b.fillText(`Published by ${TRIP.name} · ${TRIP.date}`,w/2,h-14);b.textAlign="left";b.font=`700 15px ${LEX}`;b.fillText(`CH-${pad(stop.no)}`,30,h-14)});
  placeTwo(g,W,H,front,back,orient,.2);return c}
function agedPaper(b,w,h,seed){grainBg(b,w,h,"#ead9b9",seed,1.3);const r=rnd(seed+3);for(let i=0;i<5;i++){const x=r()*w,y=r()*h,R=60+r()*140,gr=b.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,"rgba(160,120,70,.10)");gr.addColorStop(1,"rgba(160,120,70,0)");b.fillStyle=gr;b.fillRect(0,0,w,h)}
  const e=b.createLinearGradient(0,0,0,h);e.addColorStop(0,"rgba(120,85,45,.12)");e.addColorStop(.08,"rgba(0,0,0,0)");e.addColorStop(.92,"rgba(0,0,0,0)");e.addColorStop(1,"rgba(120,85,45,.14)");b.fillStyle=e;b.fillRect(0,0,w,h);b.strokeStyle="rgba(130,95,55,.35)";b.lineWidth=3;b.strokeRect(1.5,1.5,w-3,h-3)}
function composeRetro(src,stop,orient,msg){const[W,H]=SIZE[orient],c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");g.fillStyle="#6e8578";g.fillRect(0,0,W,H);const sage="#6e8578";
  const front=cardCanvas((f,w,h)=>{agedPaper(f,w,h,81);drawCover(f,GRADE(src,"aged"),26,26,w-52,h-52);f.fillStyle="rgba(74,96,92,.85)";f.font=`700 20px ${LEX}`;f.textAlign="left";spaced(f,"OSAKA TRIP",130,66,4);f.textAlign="right";const tw=fitText(f,stop.title,`800 {s}px ${SANS}`,20,300);f.font=`800 ${tw}px ${SANS}`;f.textAlign="center";spaced(f,stop.title,w-140,66,4)});
  const back=cardCanvas((b,w,h)=>{agedPaper(b,w,h,83);const ink="#1d1d1d";b.fillStyle=ink;b.font=`400 23px ${TYPE}`;const body=msg||`${stop.time} 抵達${stop.title}。\n\n${TRIP.name}的第 ${stop.no} 站，\n天氣很好，心情也是。\n\nxxx`;let y=120;body.split("\n").forEach(par=>{if(!par){y+=20;return}lines(b,par,480,4).forEach(l=>{spaced(b,l,34+b.measureText(l).width/2+l.length*1.5,y,3);y+=38})});
    b.strokeStyle=sage;b.lineWidth=3;b.beginPath();b.moveTo(590,110);b.lineTo(592,h-60);b.stroke();
    b.strokeStyle="rgba(110,133,120,.9)";b.lineWidth=2;b.strokeRect(w-160,34,120,124);const st=stampCanvas("post",{at:stop.stampAt||Date.now(),title:stop.title,no:stop.no},112);b.save();b.globalAlpha=.9;b.drawImage(st,w-156,40);b.restore();
    b.textAlign="left";b.font=`400 26px ${TYPE}`;b.fillText("Dear,",624,262);for(let i=0;i<4;i++){b.strokeStyle="rgba(110,133,120,.9)";b.lineWidth=2;b.beginPath();b.moveTo(620,290+i*72);b.lineTo(w-40,290+i*72);b.stroke()}});
  placeTwo(g,W,H,front,back,orient,.3);return c}

Object.assign(COMPOSE,{horizon:composeHorizon,kraft:composeKraft,doodle:composeDoodle,clip:composeClip,polaroid:composePolaroid,vintage:composeVintage,retro:composeRetro});
Object.assign(STYLE_NAME,{horizon:"海平線海報",kraft:"牛皮紙膠帶",doodle:"拍立得塗鴉",clip:"長尾夾拍立得",polaroid:"經典拍立得",vintage:"老派雙面明信片",retro:"復古雙面明信片"});

/* ================================================================
   印章：郵戳（圓）、打卡印（方）、票根章（長）；都會印上真正蓋下去的日期時間
   ================================================================ */
const STAMP_RED="#c8392f";
const STAMPS=[{id:"post",name:"郵戳"},{id:"seal",name:"打卡印"},{id:"ticket",name:"票根章"}];
function stampCanvas(design,info,S){const W=design==="ticket"?Math.round(S*1.45):S,H=design==="ticket"?Math.round(S*.72):S,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  g.strokeStyle=g.fillStyle=STAMP_RED;g.textAlign="center";g.textBaseline="middle";const date=fmtDate(info.at),time=fmtTime(info.at);
  if(design==="post"){const R=S/2-S*.04,cx=S/2,cy=S/2;g.lineWidth=S*.045;g.beginPath();g.arc(cx,cy,R,0,7);g.stroke();g.lineWidth=S*.016;g.beginPath();g.arc(cx,cy,R*.84,0,7);g.stroke();
    g.font=`800 ${S*.085}px ${LEX}`;g.fillText(date,cx,cy-R*.5);g.lineWidth=S*.014;g.beginPath();g.moveTo(cx-R*.8,cy-R*.28);g.lineTo(cx+R*.8,cy-R*.28);g.moveTo(cx-R*.8,cy+R*.28);g.lineTo(cx+R*.8,cy+R*.28);g.stroke();
    g.font=`900 ${S*.2}px ${LEX}`;g.fillText(time,cx,cy+S*.01);const fs=fitText(g,info.title,`900 {s}px ${SANS}`,Math.round(S*.1),R*1.15);g.font=`900 ${fs}px ${SANS}`;g.fillText(info.title,cx,cy+R*.52)}
  else if(design==="seal"){const m=S*.06,w=S-2*m;g.lineWidth=S*.05;g.beginPath();g.roundRect(m,m,w,w,S*.09);g.stroke();g.lineWidth=S*.014;g.beginPath();g.roundRect(m+S*.05,m+S*.05,w-S*.1,w-S*.1,S*.06);g.stroke();
    g.font=`900 ${S*.25}px ${SANS}`;g.fillText("打卡",S/2,S*.37);g.fillRect(S*.24,S*.53,S*.52,S*.016);g.font=`900 ${S*.15}px ${LEX}`;g.fillText(time,S/2,S*.66);g.font=`700 ${S*.075}px ${LEX}`;g.fillText(date,S/2,S*.8)}
  else{const m=S*.05;g.lineWidth=S*.04;g.beginPath();g.roundRect(m,m,W-2*m,H-2*m,H*.2);g.stroke();g.setLineDash([S*.03,S*.03]);g.lineWidth=S*.012;g.beginPath();g.moveTo(W*.3,m*2.2);g.lineTo(W*.3,H-m*2.2);g.stroke();g.setLineDash([]);
    g.save();g.translate(W*.17,H/2);g.rotate(-Math.PI/2);g.font=`900 ${S*.085}px ${LEX}`;g.fillText(`STAGE ${pad(info.no)}`,0,0);g.restore();
    g.font=`800 ${S*.075}px ${LEX}`;g.fillText("CHECK-IN",W*.65,H*.26);g.font=`900 ${S*.2}px ${LEX}`;g.fillText(time,W*.65,H*.53);g.font=`700 ${S*.07}px ${LEX}`;g.fillText(date,W*.65,H*.78)}
  /* 印泥沒沾勻的斑駁感 */
  g.globalCompositeOperation="destination-out";let x=(info.at%9973)+11;for(let i=0;i<W*H/55;i++){x=(x*16807)%2147483647;const px=x%W;x=(x*16807)%2147483647;const py=x%H;x=(x*16807)%2147483647;g.globalAlpha=.25+(x%60)/100;g.fillRect(px,py,1+(x%3),1+(x%2))}
  for(let i=0;i<6;i++){x=(x*16807)%2147483647;const px=x%W;x=(x*16807)%2147483647;const py=x%H;g.globalAlpha=.35;g.beginPath();g.arc(px,py,S*(.02+(x%5)/100),0,7);g.fill()}
  g.globalCompositeOperation="source-over";g.globalAlpha=1;return c}
function drawStamps(g,W,stamps,stop){const S=Math.round(W*.2);for(const st of stamps){const c=stampCanvas(st.design,{at:st.at,title:stop.title,no:stop.no},S);g.save();g.translate(st.x*g.canvas.width,st.y*g.canvas.height);g.rotate(st.rot);g.globalAlpha=.88;g.globalCompositeOperation="multiply";g.drawImage(c,-c.width/2,-c.height/2);g.restore()}}

let fontsReady=null;
function loadFonts(){return fontsReady||(fontsReady=Promise.all([`400 50px "DotGothic16"`,`700 48px "Noto Serif TC"`,`700 36px "LXGW WenKai TC"`,`600 60px "Caveat"`,`400 24px "Special Elite"`,`500 21px "Noto Serif TC"`,`900 80px "Noto Sans TC"`,`800 28px "Noto Sans TC"`,`800 40px "Lexend"`,`900 60px "Lexend"`].map(f=>document.fonts.load(f,"大阪冬旅勝尾寺天守閣通天閣站打卡OSAKA STAGE0123456789").catch(()=>{}))).then(()=>{}))}
const fontsOk=()=>Promise.race([loadFonts(),new Promise(r=>setTimeout(r,2500))]);

/* ---------- 照片載入 ---------- */
function blobToImage(b){return new Promise((res,rej)=>{const u=URL.createObjectURL(b),i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=u})}
async function normalize(img){const max=1600,s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c}
const canvasBlob=c=>new Promise(r=>c.toBlob(r,"image/jpeg",.9));

/* ================================================================
   匯出 PDF：把這一天的打卡成就排成 A4 手帳
   ================================================================ */
const A4=[1240,1754],PDF_M=80,NAVY="#1e2a45",RED="#d9453c",MUTED="#4a5470";
const dayLabel=()=>`DAY ${TRIP.day} · ${TRIP.date}${TRIP.weekday?`（${TRIP.weekday}）`:""}`;
function pageCanvas(){const c=document.createElement("canvas");[c.width,c.height]=A4;const g=c.getContext("2d");grainBg(g,c.width,c.height,"#fbf6f5",97,.5);
  g.fillStyle="rgba(242,184,179,.55)";for(let y=40;y<c.height;y+=32)for(let x=40;x<c.width;x+=32)g.fillRect(x,y,2,2);return[c,g]}
function sticker(g,x,y,w,h,fill,r=18,shadow=RED){g.fillStyle=shadow;g.beginPath();g.roundRect(x+6,y+6,w,h,r);g.fill();g.fillStyle=fill;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();g.lineWidth=4;g.strokeStyle=NAVY;g.stroke()}
function footer(g,n,total){g.fillStyle=MUTED;g.font=`700 22px ${LEX}`;g.textAlign="left";g.fillText(`${TRIP.name} · ${dayLabel()}`,PDF_M,A4[1]-50);g.textAlign="right";g.fillText(`${n} / ${total}`,A4[0]-PDF_M,A4[1]-50)}
const loadImg=b=>blobToImage(b);
function coverFit(g,img,x,y,w,h){const s=Math.min(w/img.width,h/img.height),dw=img.width*s,dh=img.height*s;g.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);return[x+(w-dw)/2,y+(h-dh)/2,dw,dh]}

async function buildReport({stops:STOPS,stopStamps,cardsOf}){await fontsOk();const pages=[];const W=A4[0];
  const stamped=STOPS.filter(s=>stopStamps.get(s.id)),allCards=STOPS.flatMap(s=>cardsOf(s.id)),times=stamped.map(s=>stopStamps.get(s.id).at).sort((a,b)=>a-b);
  /* ---------- 封面：成就總覽＋時間軸 ---------- */
  {const[c,g]=pageCanvas();g.textAlign="left";g.fillStyle=RED;g.font=`900 26px ${LEX}`;spaced(g,"TRIP LOG",PDF_M+70,110,6);g.textAlign="left";
    g.fillStyle=NAVY;g.font=`900 92px ${SANS}`;g.fillText(TRIP.name,PDF_M,215);g.font=`800 34px ${LEX}`;g.fillStyle=MUTED;g.fillText(dayLabel(),PDF_M,268);
    /* 右上角成就章 */
    const done=stamped.length===STOPS.length;around(g,W-PDF_M-120,175,-.18,()=>{g.strokeStyle=g.fillStyle=done?RED:NAVY;g.lineWidth=7;g.beginPath();g.arc(0,0,105,0,7);g.stroke();g.lineWidth=3;g.beginPath();g.arc(0,0,88,0,7);g.stroke();g.textAlign="center";g.textBaseline="middle";g.font=`900 44px ${SANS}`;g.fillText(done?"全制霸":"冒險中",0,-14);g.font=`900 30px ${LEX}`;g.fillText(`${stamped.length} / ${STOPS.length}`,0,36);g.textBaseline="alphabetic"});
    /* 三格數據 */
    const stats=[["打卡",`${stamped.length}/${STOPS.length}`,"站"],["明信片",`${allCards.length}`,"張"],["打卡時段",times.length?`${fmtTime(times[0])}–${fmtTime(times[times.length-1])}`:"--:--",""]];
    const bw=(W-PDF_M*2-2*28)/3;stats.forEach(([k,v,u],i)=>{const x=PDF_M+i*(bw+28),y=320;sticker(g,x,y,bw,150,i===0?NAVY:"#fff");g.fillStyle=i===0?"#fff":MUTED;g.font=`800 24px ${SANS}`;g.textAlign="left";g.fillText(k,x+26,y+44);g.fillStyle=i===0?"#fff":NAVY;const fs=fitText(g,v,`900 {s}px ${LEX}`,62,bw-90);g.font=`900 ${fs}px ${LEX}`;g.fillText(v,x+26,y+118);if(u){const vw=g.measureText(v).width;g.font=`800 26px ${SANS}`;g.fillText(u,x+34+vw,y+116)}});
    /* 進度條 */
    const pw=W-PDF_M*2,seg=(pw-(STOPS.length-1)*10)/STOPS.length;STOPS.forEach((s,i)=>{const on=!!stopStamps.get(s.id);g.fillStyle=on?RED:"#fff";g.beginPath();g.roundRect(PDF_M+i*(seg+10),510,seg,22,11);g.fill();g.lineWidth=3;g.strokeStyle=NAVY;g.stroke()});
    /* 時間軸 */
    let y=600;const rowH=136;g.strokeStyle=NAVY;g.lineWidth=4;g.setLineDash([2,14]);g.lineCap="round";g.beginPath();g.moveTo(PDF_M+34,y+34);g.lineTo(PDF_M+34,y+rowH*(STOPS.length-1)+34);g.stroke();g.setLineDash([]);
    for(const s of STOPS){const ss=stopStamps.get(s.id),recs=cardsOf(s.id);
      g.fillStyle=ss?NAVY:"#fff";g.beginPath();g.arc(PDF_M+34,y+34,30,0,7);g.fill();g.lineWidth=4;g.strokeStyle=NAVY;g.stroke();g.fillStyle=ss?"#fff":NAVY;g.font=`900 26px ${LEX}`;g.textAlign="center";g.fillText(s.no,PDF_M+34,y+44);
      g.textAlign="left";g.fillStyle=RED;g.font=`800 22px ${LEX}`;g.fillText(s.time,PDF_M+92,y+24);g.fillStyle=NAVY;const ts=fitText(g,s.title,`900 {s}px ${SANS}`,36,520);g.font=`900 ${ts}px ${SANS}`;g.fillText(s.title,PDF_M+92,y+66);
      g.fillStyle=MUTED;g.font=`700 22px ${SANS}`;g.fillText([s.category,recs.length?`${recs.length} 張`:"",ss?`${fmtTime(ss.at)} 打卡`:"尚未打卡"].filter(Boolean).join(" · "),PDF_M+92,y+102);
      /* 縮圖（最多 3 張） */
      let tx=W-PDF_M-150-20;for(const r of recs.slice(0,3).reverse()){const img=await loadImg(r.card);const th=96,tw=th*img.width/img.height;tx-=tw+14;g.save();g.translate(tx+tw/2,y+50);g.rotate((r.at%7-3)*.012);g.fillStyle=NAVY;g.fillRect(-tw/2+4,-th/2+4,tw,th);g.drawImage(img,-tw/2,-th/2,tw,th);g.lineWidth=3;g.strokeStyle=NAVY;g.strokeRect(-tw/2,-th/2,tw,th);g.restore()}
      if(recs.length>3){g.fillStyle=MUTED;g.font=`800 20px ${LEX}`;g.textAlign="right";g.fillText(`+${recs.length-3}`,tx-10,y+60)}
      /* 郵戳或空格 */
      const sx=W-PDF_M-75,sy=y+50;if(ss){const st=stampCanvas("post",{at:ss.at,title:s.title,no:s.no},140);around(g,sx,sy,ss.rot||0,()=>{g.globalAlpha=.92;g.globalCompositeOperation="multiply";g.drawImage(st,-70,-70);g.globalCompositeOperation="source-over";g.globalAlpha=1})}
      else{g.strokeStyle="rgba(217,69,60,.55)";g.lineWidth=3;g.setLineDash([10,9]);g.beginPath();g.arc(sx,sy,58,0,7);g.stroke();g.setLineDash([]);g.fillStyle="rgba(217,69,60,.7)";g.font=`800 20px ${SANS}`;g.textAlign="center";g.fillText("未打卡",sx,sy+7)}
      y+=rowH}
    pages.push(c)}
  /* ---------- 明信片頁：每站一段，兩欄排 ---------- */
  let c=null,g=null,y=0;const colW=(W-PDF_M*2-40)/2,bottom=A4[1]-110;
  const newPage=()=>{[c,g]=pageCanvas();pages.push(c);y=PDF_M+20};
  for(const s of STOPS){const recs=cardsOf(s.id);if(!recs.length)continue;const ss=stopStamps.get(s.id);
    const imgs=[];for(const r of recs)imgs.push([r,await loadImg(r.card)]);
    const firstH=Math.min(colW*imgs[0][1].height/imgs[0][1].width,760);if(!c||y+110+firstH+60>bottom)newPage();
    /* 站名標頭 */
    sticker(g,PDF_M,y,W-PDF_M*2,92,"#fff",16);g.fillStyle=NAVY;g.beginPath();g.arc(PDF_M+50,y+46,28,0,7);g.fill();g.fillStyle="#fff";g.font=`900 26px ${LEX}`;g.textAlign="center";g.fillText(s.no,PDF_M+50,y+56);
    g.textAlign="left";g.fillStyle=RED;g.font=`800 22px ${LEX}`;g.fillText(s.time,PDF_M+96,y+38);g.fillStyle=NAVY;g.font=`900 32px ${SANS}`;g.fillText(s.title,PDF_M+96,y+74);
    g.textAlign="right";g.fillStyle=MUTED;g.font=`800 22px ${SANS}`;g.fillText(`${recs.length} 張${ss?` · ${fmtTime(ss.at)} 打卡`:""}`,W-PDF_M-28,y+56);y+=130;
    for(let i=0;i<imgs.length;i+=2){const row=imgs.slice(i,i+2),hs=row.map(([,im])=>Math.min(colW*im.height/im.width,760)),rh=Math.max(...hs);
      if(y+rh+56>bottom){newPage()}
      row.forEach(([r,im],k)=>{const x=PDF_M+k*(colW+40),h=hs[k];g.fillStyle="rgba(30,42,69,.9)";g.fillRect(x+8,y+8,colW,h);g.drawImage(im,x,y,colW,h);g.lineWidth=3;g.strokeStyle=NAVY;g.strokeRect(x,y,colW,h);
        g.fillStyle=MUTED;g.font=`700 20px ${SANS}`;g.textAlign="left";const cap=`#${i+k+1} · ${STYLE_NAME[r.style]||""}${r.msg?` ·「${r.msg}」`:""}`;g.fillText(lines(g,cap,colW,1)[0],x,y+h+38)});
      y+=rh+70}
    y+=10}
  pages.forEach((p,i)=>footer(p.getContext("2d"),i+1,pages.length));return pages}


/* 組一張完整明信片：版型＋印章 */
/* src＝照片的 canvas（不是 Blob） */
export async function renderCard({src,stop,style,orient,msg,stamps}){await fontsOk();const base=(COMPOSE[style]||COMPOSE.polaroid)(src,stop,orient,msg||"");const c=document.createElement("canvas");c.width=base.width;c.height=base.height;const g=c.getContext("2d");g.drawImage(base,0,0);drawStamps(g,base.width,stamps||[],stop);return new Promise(r=>c.toBlob(r,"image/jpeg",.92))}
export async function pagesToPdf(pages){const{jsPDF}=await import("jspdf");const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});pages.forEach((p,i)=>{if(i)doc.addPage();doc.addImage(p.toDataURL("image/jpeg",.9),"JPEG",0,0,210,297)});return doc.output("blob")}
export {COMPOSE,STYLE_NAME,STAMPS,stampCanvas,drawStamps,loadFonts,fontsOk,blobToImage,normalize,canvasBlob,buildReport,A4};
