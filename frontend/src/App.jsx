import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './icons.jsx';
import { CUSTOMERS } from './sampleData.js';
import { Drawer, ToastHost, Logo } from './ui.jsx';
import { createApiClient } from './api.js';
import { getSession, setSession as persistSession, clearSession } from './session.js';
import { Dashboard } from './pages/Dashboard.jsx';
import { InboxPage } from './pages/Inbox.jsx';
import { LeadsPage } from './pages/Leads.jsx';
import { FollowupsPage } from './pages/Followups.jsx';
import { QuoteRules } from './pages/QuoteRules.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Products } from './pages/Products.jsx';
import { CRM, CustomerProfile } from './pages/Crm.jsx';
import { Settings, Sysconfig } from './pages/Settings.jsx';
import { Wizard } from './pages/Wizard.jsx';
import { MobilePreview } from './pages/Mobile.jsx';
import { ThemeSwitcher } from './theme.jsx';
import { Login } from './Login.jsx';
import { Landing } from './pages/Landing.jsx';

/* ===== app.jsx ===== */
/* ============ 应用外壳 + 路由 ============ */


const NAV=[
  {key:'leads', icon:'inbox', label:'线索池', badge:4},
  {key:'crm', icon:'users', label:'客户'},
  {key:'followups', icon:'clock', label:'跟进', badge:2},
  {key:'settings', icon:'globe', label:'渠道'},
];

const SECONDARY_NAV=[
  {key:'inbox', icon:'message', label:'询盘前台'},
  {key:'quoterules', icon:'rules', label:'报价准备'},
  {key:'products', icon:'box', label:'产品库'},
  {key:'analytics', icon:'analytics', label:'数据看板'},
];

function Sidebar({route, go, onWizard, collapsed}){
  return (
    <div className="sidebar">
      <div style={{padding:collapsed?'18px 16px 16px':'20px 20px 18px',display:'flex',justifyContent:collapsed?'center':'flex-start'}}>
        <button onClick={()=>go('dashboard')} title="工作台首页" aria-label="工作台首页" style={{display:'inline-flex',alignItems:'center'}}>
          <Logo color="var(--side-text-strong)" compact={collapsed}/>
        </button>
      </div>
      <div style={{padding:collapsed?'0 10px':'0 13px',flex:1,overflowY:'auto'}}>
        {NAV.map(n=>(
          <button key={n.key} onClick={()=>go(n.key)} className={`navlink ${route===n.key?'active':''}`} title={collapsed?n.label:undefined}
            style={collapsed?{height:42,justifyContent:'center',padding:'0',marginBottom:5}:undefined}>
            <span className="row gap2" style={collapsed?{justifyContent:'center'}:undefined}><Icon name={n.icon} size={18} strokeWidth={route===n.key?2:1.7}/>{!collapsed&&n.label}</span>
            {n.badge&&(!collapsed?<span className="badge" style={{height:18,minWidth:18,padding:'0 5px',justifyContent:'center',background:'var(--red)',color:'#fff'}}>{n.badge}</span>:<span style={{position:'absolute',right:8,top:8,width:7,height:7,borderRadius:'50%',background:'var(--red)',border:'1px solid var(--side-bg-1)'}}></span>)}
          </button>
        ))}
        {!collapsed&&<div className="nav-section" style={{marginTop:10}}>辅助</div>}
        {SECONDARY_NAV.map(n=>(
          <button key={n.key} onClick={()=>go(n.key)} className={`navlink ${route===n.key?'active':''}`} title={collapsed?n.label:undefined}
            style={collapsed?{height:42,justifyContent:'center',padding:'0',marginBottom:5}:undefined}>
            <span className="row gap2" style={collapsed?{justifyContent:'center'}:undefined}><Icon name={n.icon} size={18} strokeWidth={route===n.key?2:1.7}/>{!collapsed&&n.label}</span>
          </button>
        ))}
      </div>

      <div style={{padding:collapsed?'10px':'0 13px 12px'}}>
        <button onClick={onWizard} className="navlink" title={collapsed?'配置向导':undefined}
          style={collapsed?{height:42,justifyContent:'center',padding:'0',marginBottom:5}:undefined}>
          <span className="row gap2" style={collapsed?{justifyContent:'center'}:undefined}><Icon name="zap" size={18} strokeWidth={1.7}/>{!collapsed&&'配置向导'}</span>
        </button>
        <button onClick={()=>go('sysconfig')} className={`navlink ${route==='sysconfig'?'active':''}`} title={collapsed?'系统设置':undefined}
          style={collapsed?{height:42,justifyContent:'center',padding:'0',marginBottom:0}:undefined}>
          <span className="row gap2" style={collapsed?{justifyContent:'center'}:undefined}><Icon name="settings" size={18} strokeWidth={route==='sysconfig'?2:1.7}/>{!collapsed&&'系统设置'}</span>
        </button>
      </div>
    </div>
  );
}

function CurrentTime(){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{
    const id=setInterval(()=>setNow(new Date()),1000);
    return ()=>clearInterval(id);
  },[]);
  const time=now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  const dateStr=now.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',weekday:'short'});
  const tzName=Intl.DateTimeFormat().resolvedOptions().timeZone||'Local';
  return (
    <span className="mono" style={{fontSize:13.5,fontWeight:600,color:'var(--text)'}}>
      {time}
      <span style={{color:'var(--text-3)',fontWeight:400,fontSize:12}}>{' '}{dateStr} · {tzName}</span>
    </span>
  );
}

function LanguageSelect(){
  const [lang,setLang]=useState('zh');
  return (
    <div className="btn-icon btn-sec" style={{position:'relative',overflow:'hidden'}} title={lang==='zh'?'语言：中文':'语言'}>
      <Icon name="globe" size={18}/>
      <select value={lang} onChange={(e)=>setLang(e.target.value)} title="语言"
        aria-label="语言"
        style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0,border:0,outline:0,cursor:'pointer'}}>
        <option value="zh">中文</option>
        <option value="en" disabled>English（暂未实现）</option>
      </select>
    </div>
  );
}

function UserMenu({session, onLogout}){
  const [open,setOpen]=useState(false);
  const [pos,setPos]=useState({top:0,right:0});
  const btnRef=React.useRef(null);
  const guest=session?.mode==='guest';
  const name=guest?'访客':(session?.name||'用户');
  const company=guest?'演示模式 · 操作不保存':(session?.email||'');
  const initials=guest?'访':(session?.name?session.name[0].toUpperCase():'U');
  const plan=guest?'Guest':(session?.plan||'Free');

  const handleToggle=()=>{
    if(!open && btnRef.current){
      const r=btnRef.current.getBoundingClientRect();
      setPos({top:r.bottom+8, right:window.innerWidth-r.right});
    }
    setOpen(o=>!o);
  };

  useEffect(()=>{
    if(!open) return;
    const close=(e)=>{ if(!e.target.closest('[data-user-menu]')) setOpen(false); };
    document.addEventListener('mousedown',close);
    return ()=>document.removeEventListener('mousedown',close);
  },[open]);

  const MENU_ITEMS=[
    {icon:'user',    label:'账户设置',  desc:'个人信息与偏好'},
    {icon:'bell',    label:'通知与提醒', desc:'消息推送与提醒规则'},
    {icon:'shield',  label:'安全设置',  desc:'密码与登录保护'},
    null,
    {icon:'help',    label:'帮助中心',  desc:'使用文档与教程'},
    {icon:'message', label:'提交反馈',  desc:'帮助我们改进产品'},
    null,
    {icon:'logout',  label:'退出登录',  danger:true},
  ];

  const dropdown = open && ReactDOM.createPortal(
    <div data-user-menu className="card anim-up" style={{
      position:'fixed', top:pos.top, right:pos.right,
      width:260, padding:'8px', zIndex:9999,
      boxShadow:'var(--shadow-lg)'
    }}>
      {/* 用户信息头 */}
      <div style={{padding:'10px 12px 12px',borderBottom:'1px solid var(--border-2)',marginBottom:6}}>
        <div className="row gap2" style={{alignItems:'center'}}>
          <span style={{width:38,height:38,borderRadius:'50%',flex:'none',
            background:'linear-gradient(145deg,var(--tech-2,#5BB8E8),var(--primary))',
            color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',
            fontWeight:700,fontSize:15,boxShadow:'inset 0 1px 0 rgba(255,255,255,.22)'}}>
            {initials}
          </span>
          <div className="col" style={{minWidth:0,gap:1}}>
            <span style={{fontWeight:600,fontSize:13,color:'var(--text)'}} className="ellipsis">{name}</span>
            <span style={{fontSize:11,color:'var(--text-3)'}} className="ellipsis">{company}</span>
          </div>
          <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:5,
            background:guest?'var(--orange-light)':'var(--primary-tint,rgba(79,99,187,.1))',color:guest?'#a06916':'var(--primary)',
            whiteSpace:'nowrap',flex:'none'}}>
            {plan}
          </span>
        </div>
      </div>
      {/* 菜单项 */}
      {MENU_ITEMS.map((item,i)=>
        item===null
          ? <div key={i} style={{height:1,background:'var(--border-2)',margin:'4px 0'}}/>
          : <button key={item.label} className="row gap2 clickable" onClick={()=>{setOpen(false); if(item.danger&&onLogout) onLogout();}}
              style={{width:'100%',padding:'8px 12px',borderRadius:8,textAlign:'left',
                color:item.danger?'var(--red)':'var(--text)',
                background:'transparent',border:'none',cursor:'pointer',alignItems:'center'}}>
              <span style={{color:item.danger?'var(--red)':'var(--text-3)',flex:'none'}}>
                <Icon name={item.icon} size={15}/>
              </span>
              <div className="col" style={{gap:0}}>
                <span style={{fontSize:13,fontWeight:500}}>{item.label}</span>
                {item.desc&&<span style={{fontSize:11,color:'var(--text-3)'}}>{item.desc}</span>}
              </div>
            </button>
      )}
    </div>,
    document.body
  );

  return (
    <div data-user-menu style={{position:'relative'}}>
      {dropdown}
      <button ref={btnRef} onClick={handleToggle}
        title={`${name} — ${company}`}
        style={{width:36,height:36,borderRadius:'50%',padding:0,border:'none',cursor:'pointer',
          background:guest?'linear-gradient(145deg,#E8B86B,#C9A669)':'linear-gradient(145deg,var(--tech-2,#5BB8E8),var(--primary))',
          color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',
          fontWeight:700,fontSize:14,boxShadow:'inset 0 1px 0 rgba(255,255,255,.22)',
          outline:open?'2px solid var(--primary)':'none',outlineOffset:2}}>
        {initials}
      </button>
    </div>
  );
}

function Topbar({route, collapsed, onToggleSidebar, session, onLogout}){
  return (
    <div className="topbar">
      <div className="row gap3">
        <button className="btn-icon btn-sec" onClick={onToggleSidebar} title={collapsed?'展开侧边栏':'收起侧边栏'}>
          <Icon name={collapsed?'chevR':'chevL'} size={18}/>
        </button>
        <CurrentTime/>
      </div>
      <div className="row gap3">
        <div style={{position:'relative',width:36}} title="全局搜索">
          <span style={{position:'absolute',left:10,top:9,color:'var(--text-3)',pointerEvents:'none'}}><Icon name="search" size={16}/></span>
          <input className="input" aria-label="全局搜索" title="全局搜索" placeholder="" style={{width:36,paddingLeft:34,paddingRight:0,height:36,background:'#fafbfc',color:'transparent',caretColor:'var(--text)'}}/>
        </div>
        <ThemeSwitcher placement="topbar"/>
        <LanguageSelect/>
        <button className="btn-icon btn-sec" style={{position:'relative'}} title="转人工通知">
          <Icon name="bell" size={18}/>
          <span style={{position:'absolute',top:6,right:6,width:8,height:8,borderRadius:'50%',background:'var(--red)',border:'2px solid #fff'}}></span>
        </button>
        <UserMenu session={session} onLogout={onLogout}/>
      </div>
    </div>
  );
}

function App(){
  const [session,setSessionState]=useState(()=>getSession());
  const [view,setView]=useState(()=>getSession()?'app':'landing');
  const [route,setRoute]=useState('dashboard');
  const [profile,setProfile]=useState(null);
  const [wizard,setWizard]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(()=>{
    try{ return localStorage.getItem('closer-sidebar-collapsed') === '1'; }catch(e){ return false; }
  });
  useEffect(()=>{
    if(session?.mode==='guest') return;
    try{ localStorage.setItem('closer-sidebar-collapsed', sidebarCollapsed?'1':'0'); }catch(e){}
  },[sidebarCollapsed,session]);

  const api = session?.token
    ? createApiClient({
        token: session.token,
        sellerId: session.seller_id,
        baseUrl: import.meta.env.VITE_DEMO_MODE === 'mock' ? 'mock' : undefined,
      })
    : null;

  const enter=(s)=>{
    persistSession(s);
    setSessionState(s);
    setView('app');
    const wizardDone = localStorage.getItem('closer_wizard_done');
    if(s.mode==='guest' || !wizardDone) setWizard(true);
  };
  const logout=()=>{ clearSession(); setSessionState(null); setView('landing'); setRoute('dashboard'); setProfile(null); };
  const go=(r)=>{setRoute(r);setProfile(null);};
  const openProfile=(c)=>{
    const cust = c.company ? (CUSTOMERS.find(x=>x.company===c.company)||{...c,inquiries:c.inquiries||1,deals:0,value:c.value||0,domain:'—',note:c.title||''}) : c;
    setProfile(cust);
  };

  if(view==='landing') return <Landing onEnter={()=>setView('login')}/>;
  if(view==='login'||!session) return <Login onLogin={enter} onGuest={enter}/>;

  return (
    <div id="app-shell" className={`row ${sidebarCollapsed?'sidebar-collapsed':''}`} style={{height:'100%',overflow:'hidden'}}>
      <Sidebar route={route} go={go} onWizard={()=>setWizard(true)} collapsed={sidebarCollapsed}/>
      <div className="col" style={{flex:1,minWidth:0,height:'100%',position:'relative'}}>
        <Topbar route={route} collapsed={sidebarCollapsed} onToggleSidebar={()=>setSidebarCollapsed(v=>!v)} session={session} onLogout={logout}/>
        <div style={{flex:1,minHeight:0,position:'relative'}}>
          {route==='dashboard' && <Dashboard api={api} go={go} onOpenProfile={openProfile}/>}
          {route==='leads' && <LeadsPage api={api} onOpenProfile={openProfile} go={go}/>}
          {route==='inbox' && <InboxPage api={api} onOpenProfile={openProfile}/>}
          {route==='crm' && <CRM api={api} onOpenProfile={openProfile}/>}
          {route==='followups' && <FollowupsPage api={api}/>}
          {route==='products' && <Products api={api} go={go}/>}
          {route==='quoterules' && <QuoteRules api={api}/>}
          {route==='analytics' && <Analytics api={api}/>}
          {route==='mobile' && <MobilePreview/>}
          {route==='settings' && <Settings api={api}/>}
          {route==='sysconfig' && <Sysconfig api={api}/>}

          <Drawer open={!!profile} onClose={()=>setProfile(null)} title="客户档案" width={400}>
            <CustomerProfile c={profile} api={api}/>
          </Drawer>
        </div>
      </div>
      {wizard && <Wizard api={api} onClose={()=>{
        setWizard(false);
        if(session?.mode!=='guest') try{ localStorage.setItem('closer_wizard_done','1'); }catch(e){}
      }}/>}
    </div>
  );
}

export { App };
