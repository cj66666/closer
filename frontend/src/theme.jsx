import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './icons.jsx';

/* ===== theme.jsx ===== */
/* ============ 风格切换器（5 套主题，实时切换 + 记忆）============ */
const THEMES = [
  {key:'aurora',   name:'极光蓝',  desc:'浅色侧栏 · 墨蓝 + 电蓝', dot:'#1F5C8C', dot2:'#5BB8E8', side:'#F3F6F9'},
  {key:'midnight', name:'深空',    desc:'暗色侧栏 · 电蓝高光',   dot:'#1F5C8C', dot2:'#48A8E8', side:'#16252F'},
  {key:'graphite', name:'石墨',    desc:'极简单色 · 通透留白',   dot:'#3A4757', dot2:'#8FA8C2', side:'#F0F2F4'},
  {key:'sand',     name:'暖砂',    desc:'暖纸质感 · 青石 + 铜金', dot:'#42566E', dot2:'#C9A669', side:'#F0EBE2'},
  {key:'indigo',   name:'靛紫',    desc:'科技感 · 靛蓝 + 紫晕',   dot:'#4C4FB8', dot2:'#9A8DF5', side:'#F1F1F9'},
];

function applyTheme(key){
  document.documentElement.setAttribute('data-theme', key);
  try{ localStorage.setItem('closer-theme', key); }catch(e){}
}

function ThemeSwitcher({placement='floating'}){
  const [open,setOpen]=useState(false);
  const [theme,setTheme]=useState(()=>{
    try{ return localStorage.getItem('closer-theme')||'indigo'; }catch(e){ return 'indigo'; }
  });
  const [dropPos,setDropPos]=useState({top:0,right:0});
  const btnRef=React.useRef(null);
  useEffect(()=>{ applyTheme(theme); },[theme]);
  const isTopbar = placement === 'topbar';

  const handleToggle=()=>{
    if(!open && isTopbar && btnRef.current){
      const r=btnRef.current.getBoundingClientRect();
      setDropPos({top:r.bottom+8, right:window.innerWidth-r.right});
    }
    setOpen(o=>!o);
  };

  const dropdownContent = open && (
    <div className="card anim-up" style={{
      position:'fixed',
      top: isTopbar ? dropPos.top : undefined,
      right: isTopbar ? dropPos.right : 20,
      bottom: isTopbar ? undefined : 74,
      zIndex: 9999,
      width:268,
      padding:'12px',
      boxShadow:'var(--shadow-lg)'
    }}>
      <div className="row spread" style={{padding:'2px 4px 10px'}}>
        <span className="row gap2" style={{alignItems:'center'}}><Icon name="sliders" size={15} style={{color:'var(--primary)'}}/><span style={{fontWeight:700,fontSize:13}}>选择风格</span></span>
        <span className="aux" style={{fontSize:11}}>即时预览</span>
      </div>
      <div className="col" style={{gap:6}}>
        {THEMES.map(t=>(
          <button key={t.key} onClick={()=>setTheme(t.key)} className="row spread clickable"
            style={{padding:'9px 11px',borderRadius:10,border:`1px solid ${theme===t.key?'var(--primary)':'var(--border-2)'}`,
              background:theme===t.key?'var(--primary-tint)':'#fff',transition:'border-color .14s,background .14s'}}>
            <span className="row gap3" style={{alignItems:'center'}}>
              {/* 迷你皮肤预览 */}
              <span style={{width:34,height:26,borderRadius:6,overflow:'hidden',display:'flex',flex:'none',border:'1px solid var(--border-2)'}}>
                <span style={{width:11,background:t.side}}></span>
                <span style={{flex:1,background:'#fff',display:'flex',alignItems:'flex-end',padding:2,gap:2}}>
                  <span style={{width:8,height:8,borderRadius:2,background:t.dot}}></span>
                  <span style={{width:6,height:6,borderRadius:2,background:t.dot2}}></span>
                </span>
              </span>
              <span className="col" style={{alignItems:'flex-start',gap:1}}>
                <span style={{fontWeight:600,fontSize:13}}>{t.name}</span>
                <span className="aux" style={{fontSize:10.5}}>{t.desc}</span>
              </span>
            </span>
            {theme===t.key&&<Icon name="check" size={15} style={{color:'var(--primary)',flex:'none'}}/>}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={isTopbar ? {position:'relative'} : {position:'fixed',right:20,bottom:20,zIndex:400}}>
      {ReactDOM.createPortal(dropdownContent, document.body)}
      <button ref={btnRef} onClick={handleToggle} className="row gap2"
        title="选择风格"
        style={{
          height:isTopbar?36:44,
          width:isTopbar?36:undefined,
          justifyContent:'center',
          padding:isTopbar?0:'0 16px 0 14px',
          borderRadius:isTopbar?9:24,
          background:isTopbar?'#fff':'var(--hero-grad)',
          color:isTopbar?'var(--text)':'#fff',
          fontWeight:600,
          fontSize:isTopbar?13:13.5,
          boxShadow:isTopbar?'none':'var(--shadow-lg)',
          border:isTopbar?'1px solid var(--border)':'1px solid rgba(255,255,255,.14)'
        }}>
        <Icon name={open?'x':'palette'} size={17}/>{!isTopbar&&(open?'收起':'风格')}
      </button>
    </div>
  );
}

export { ThemeSwitcher, applyTheme, THEMES };
