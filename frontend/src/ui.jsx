import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Icon } from './icons.jsx';
import { CHANNELS, STATUS_META } from './sampleData.js';

/* ===== ui.jsx ===== */
/* ============ UI 原语 ============ */

/* 分级方块 A/B/C */
function Grade({g, size}){
  return <span className={`grade grade-${g}`} style={size?{width:size,height:size,fontSize:size*.55}:null}>{g}</span>;
}

/* 渠道图标圆点 */
function ChannelIcon({ch, size=26}){
  const c = CHANNELS[ch] || CHANNELS.email;
  return (
    <span title={c.name} style={{width:size,height:size,borderRadius:7,display:'inline-flex',
      alignItems:'center',justifyContent:'center',background:c.color+'15',color:c.color,flex:'none'}}>
      <Icon name={c.icon} size={size*.62} strokeWidth={1.8}/>
    </span>
  );
}

/* 状态药丸（色+图标+文字） */
function StatusPill({status, sm}){
  const m = STATUS_META[status]; if(!m) return null;
  return (
    <span className={`pill ${m.pill}`} style={sm?{height:22,fontSize:11.5,padding:'0 8px'}:null}>
      <Icon name={m.icon} size={sm?12:13} strokeWidth={1.9}/>{m.label}
    </span>
  );
}

/* 头像（首字母或机器人） */
function Avatar({type='human', name='', size=32, src}){
  if(type==='ai'){
    return <span className="ai-avatar" style={{width:size,height:size,borderRadius:'50%',color:'#fff',
      display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none'}}>
      <Icon name="bot" size={size*.56} strokeWidth={1.8}/></span>;
  }
  const initials = (name||'?').replace(/[^A-Za-z\u4e00-\u9fa5 ]/g,'').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const palette=['#1F5C8C','#2E9E8F','#E8A13A','#7B6BA8','#C25E7A'];
  const idx=(name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%palette.length;
  return <span style={{width:size,height:size,borderRadius:'50%',background:palette[idx]+'1a',color:palette[idx],
    fontWeight:600,fontSize:size*.4,display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none'}}>{initials||'·'}</span>;
}

/* 国旗 + 国家 */
function FlagLabel({flag, country, className}){
  return <span className={`row gap1 ${className||''}`} style={{alignItems:'center'}}>
    <span className="flag">{flag}</span>{country&&<span className="aux">{country}</span>}</span>;
}

/* 货币 */
function fmtMoney(n, cur='$'){
  if(n==null) return '—';
  return cur + n.toLocaleString('en-US');
}

/* 迷你 sparkline */
function Spark({data, color='var(--primary)', w=88, h=30}){
  if(!data||!data.length) return null;
  const max=Math.max(...data), min=Math.min(...data), rng=max-min||1;
  const pts=data.map((v,i)=>[i/(data.length-1)*w, h-2-((v-min)/rng)*(h-6)]);
  const d=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area=`${d} L${w},${h} L0,${h} Z`;
  const gid='sg'+Math.random().toString(36).slice(2,7);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity=".18"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.6" fill="#fff" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

/* 指标卡 */
function StatCard({icon, label, value, delta, up, accent, alert, spark, onClick}){
  return (
    <div className="card card-hover clickable anim-up" onClick={onClick} style={{padding:'18px 20px',position:'relative',overflow:'hidden'}}>
      {alert&&<span style={{position:'absolute',top:16,right:16,width:8,height:8,borderRadius:'50%',background:'var(--red)',boxShadow:'0 0 0 3px rgba(217,83,79,.15)'}}></span>}
      <div className="row gap2" style={{marginBottom:14}}>
        <span style={{width:34,height:34,borderRadius:9,background:(accent||'var(--primary)')+'14',color:accent||'var(--primary)',
          display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Icon name={icon} size={18}/></span>
        <span className="aux" style={{fontWeight:600,color:'var(--text-2)'}}>{label}</span>
      </div>
      <div className="row spread" style={{alignItems:'flex-end'}}>
        <div className="col" style={{gap:6}}>
          <span className="num" style={{fontSize:32,fontWeight:600,color:'var(--text)',lineHeight:1,letterSpacing:'-.02em',animation:'countUp .5s both'}}>{value}</span>
          {delta&&<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11.5,fontWeight:600,padding:'2px 7px',borderRadius:6,width:'fit-content',
            background:up===true?'var(--green-light)':up===false?'var(--red-light)':'var(--orange-light)',
            color:up===true?'#1f7568':up===false?'#b53d39':'#a06916'}}>
            {up===true&&'▲'}{up===false&&'▼'} {delta}</span>}
        </div>
        {spark&&<Spark data={spark} color={accent||'var(--primary)'}/>}
      </div>
    </div>
  );
}

/* 段落标题 */
function SectionTitle({children, icon, right, sub}){
  return (
    <div className="row spread" style={{marginBottom:14}}>
      <div className="col" style={{minWidth:0}}>
        <div className="row gap2">
          {icon&&<span style={{color:'var(--primary)'}}><Icon name={icon} size={18}/></span>}
          <span className="h3" style={{whiteSpace:'nowrap'}}>{children}</span>
        </div>
        {sub&&<span className="aux" style={{marginTop:2,whiteSpace:'nowrap'}}>{sub}</span>}
      </div>
      {right}
    </div>
  );
}

/* 空状态 */
function Empty({icon='inbox', title, desc, action}){
  return (
    <div className="col center" style={{padding:'56px 24px',textAlign:'center',gap:10}}>
      <span style={{width:56,height:56,borderRadius:14,background:'var(--primary-tint)',color:'var(--primary)',
        display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Icon name={icon} size={26}/></span>
      <div className="h3" style={{marginTop:4}}>{title}</div>
      {desc&&<div className="aux" style={{maxWidth:300}}>{desc}</div>}
      {action}
    </div>
  );
}

/* ============ Toast 系统 ============ */
const ToastCtx = createContext(()=>{});
function useToast(){ return useContext(ToastCtx); }
function ToastHost({children}){
  const [items,setItems]=useState([]);
  const push=useCallback((msg, kind='ok')=>{
    const id=Math.random().toString(36).slice(2);
    setItems(s=>[...s,{id,msg,kind}]);
    setTimeout(()=>setItems(s=>s.filter(t=>t.id!==id)), 2800);
  },[]);
  const color={ok:'var(--green)',info:'var(--primary)',warn:'var(--orange)',danger:'var(--red)'};
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {items.map(t=>(
          <div className="toast" key={t.id}>
            <span className="dot" style={{background:color[t.kind]||'var(--green)'}}></span>{t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* 进度环 */
function Ring({pct, size=44, stroke=4, color='var(--primary)'}){
  const r=(size-stroke)/2, c=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} strokeLinecap="round"
        style={{transition:'stroke-dashoffset .6s ease'}}/>
    </svg>
  );
}

/* 抽屉容器 */
function Drawer({open, onClose, width=380, children, title}){
  if(!open) return null;
  return (
    <div style={{position:'absolute',inset:0,zIndex:60}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(38,38,38,.28)',animation:'fadeIn .2s both'}}></div>
      <div style={{position:'absolute',top:0,right:0,bottom:0,width,background:'#fff',boxShadow:'var(--shadow-drawer)',
        animation:'drawerIn .26s cubic-bezier(.2,.7,.3,1) both',display:'flex',flexDirection:'column'}}>
        {title&&<div className="row spread" style={{padding:'16px 20px',borderBottom:'1px solid var(--border-2)',flex:'none'}}>
          <span className="h3">{title}</span>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>}
        <div className="scroll" style={{flex:1}}>{children}</div>
      </div>
    </div>
  );
}

/* 简易模态 */
function Modal({open, onClose, width=460, children}){
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(38,38,38,.34)',animation:'fadeIn .18s both'}}></div>
      <div className="card" style={{position:'relative',width,maxWidth:'92vw',maxHeight:'88vh',overflow:'auto',
        boxShadow:'var(--shadow-lg)',animation:'scaleIn .22s both'}}>{children}</div>
    </div>
  );
}

/* —— Logo（自 app 迁移以避免循环依赖）—— */
function Logo({size=30, color, compact=false}){
  return (
    <div className="row gap2" style={{alignItems:'center'}}>
      <span style={{width:size,height:size,borderRadius:10,display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none',
        background:'radial-gradient(circle at 30% 22%,rgba(255,255,255,.34),transparent 34%),linear-gradient(145deg,var(--tech-2),var(--primary) 62%,var(--tech-deep))',
        boxShadow:'0 8px 20px -10px color-mix(in srgb,var(--primary) 65%,transparent),inset 0 1px 0 rgba(255,255,255,.30)'}}>
        <svg width={size*.64} height={size*.64} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16.9 6.1A7.2 7.2 0 1 0 17 17.8" stroke="#fff" strokeWidth="2.45" strokeLinecap="round"/>
          <path d="M10 12h10" stroke="#fff" strokeWidth="2.45" strokeLinecap="round"/>
          <path d="M17 9l3 3-3 3" stroke="#fff" strokeWidth="2.45" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      {!compact&&<span style={{fontWeight:800,fontSize:size*.58,letterSpacing:'-.035em',color:color||'var(--text)'}}>Closer</span>}
    </div>
  );
}

export { Grade, ChannelIcon, StatusPill, Avatar, FlagLabel, fmtMoney, StatCard, Spark, SectionTitle, Empty, ToastHost, useToast, Ring, Drawer, Modal, Logo };
