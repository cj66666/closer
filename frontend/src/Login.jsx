/**
 * [INPUT]: 依赖 React、Icon、session.js 与后端 /api/v1/auth 端点
 * [OUTPUT]: 对外提供 Login 登录页 —— 邮箱登录、注册与访客模式，接入真实后端 auth
 * [POS]: frontend/src 的鉴权门面，App 在无 session 时渲染本页
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */

import { useState } from 'react';
import { Icon } from './icons.jsx';
import { setSession } from './session.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE || '';

function demoGuestSession() {
  return {
    seller_id: 1,
    name: '访客演示',
    email: `guest_${Date.now()}@closer.demo`,
    token: 'demo-token',
    mode: 'guest',
  };
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.detail || data?.message || `${res.status}`), { status: res.status });
  return data;
}

function PurpleLogo({ size = 40 }) {
  const r = Math.round(size * 0.33);
  return (
    <span style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at 30% 22%,rgba(255,255,255,.34),transparent 34%),linear-gradient(145deg,#8E85F5,#5B4FE0 60%,#372BA0)',
      boxShadow: '0 8px 20px -10px rgba(91,79,224,.7),inset 0 1px 0 rgba(255,255,255,.3)',
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M16.9 6.1A7.2 7.2 0 1 0 17 17.8" stroke="#fff" strokeWidth="2.45" strokeLinecap="round"/>
        <path d="M10 12h10" stroke="#fff" strokeWidth="2.45" strokeLinecap="round"/>
        <path d="M17 9l3 3-3 3" stroke="#fff" strokeWidth="2.45" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

const FEATURES = [
  {icon:'globe',  title:'多渠道线索归一',   desc:'Email / WhatsApp / Facebook / 独立站表单，统一接住每一条。'},
  {icon:'bot',    title:'AI 初筛与补需求', desc:'识别真假买家、采购意图、缺失信息和下一步沟通建议。'},
  {icon:'users',  title:'客户生命周期',   desc:'阶段、标签、跟进时间和接管状态沉淀到客户档案。'},
  {icon:'shield', title:'高风险转人工',   desc:'价格、方案、交期、合同和定制需求由业务员拍板。'},
];

function Login({ onLogin, onGuest }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'register'

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('/api/v1/auth/login', { email: email.trim() });
      setSession(data);
      onLogin(data);
    } catch (err) {
      if (err.status === 404) {
        setStep('register');
      } else {
        setError(err.message || '登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('请输入姓名'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('/api/v1/auth/register', { email: email.trim(), name: name.trim() });
      setSession(data);
      onLogin(data);
    } catch (err) {
      if (err.status === 409) setError('该邮箱已注册，请直接登录');
      else setError(err.message || '注册失败，请重试');
      setStep('email');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    setError('');
    try {
      if (DEMO_MODE === 'mock') {
        const demoSession = demoGuestSession();
        setSession(demoSession);
        onGuest(demoSession);
        return;
      }
      const data = await apiPost('/api/v1/auth/guest');
      setSession({ ...data, mode: 'guest' });
      onGuest({ ...data, mode: 'guest' });
    } catch (err) {
      if (!API_BASE) {
        const demoSession = demoGuestSession();
        setSession(demoSession);
        onGuest(demoSession);
        return;
      }
      setError('演示模式暂时不可用，请重试');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div style={{position:'absolute',top:'-12%',right:'-6%',width:520,height:520,pointerEvents:'none',background:'var(--hero-glow)',opacity:.6}}/>

      <div className="login-wrap">
        {/* 左：产品能力展示 */}
        <div className="login-features">
          <div className="row gap2" style={{marginBottom:6}}><PurpleLogo size={40}/></div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:'-.02em',lineHeight:1.25,marginTop:14}}>
            外贸线索工作台<br/>把客户推进到下一步
          </div>
          <div style={{color:'rgba(220,233,242,.78)',marginTop:10,maxWidth:440,lineHeight:1.6}}>
            从线索初筛、基础询盘沟通、客户打标到跟进提醒和人工报价准备，全链路收束在一个工作台。
          </div>
          {FEATURES.map(f=>(
            <div className="lf-row" key={f.title}>
              <span className="lf-ic"><Icon name={f.icon} size={18}/></span>
              <div className="col" style={{gap:2}}>
                <span style={{fontWeight:700,fontSize:14.5}}>{f.title}</span>
                <span style={{color:'rgba(220,233,242,.72)',fontSize:12.5,lineHeight:1.55}}>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 右：登录卡片 */}
        <div className="card anim-up" style={{width:'min(400px,100%)',flex:'none',padding:'32px 30px',position:'relative',boxShadow:'var(--shadow-lg)'}}>
          <div className="col center" style={{gap:6,marginBottom:20,textAlign:'center'}}>
            <PurpleLogo size={40}/>
            <span style={{fontSize:13,color:'#948FB0',fontFamily:'"Manrope","PingFang SC",sans-serif',marginTop:8}}>
              {step === 'register' ? '该邮箱尚未注册，请填写姓名完成注册' : '输入邮箱登录或注册'}
            </span>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="col" style={{gap:14}}>
              <div className="col" style={{gap:6}}>
                <span className="field-label">邮箱</span>
                <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="you@company.com" autoFocus required/>
              </div>
              {error && <p style={{fontSize:12,color:'var(--red)',margin:0}}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{height:44,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',gap:7,
                  background:'#5B4FE0',color:'#fff',fontWeight:700,fontSize:15,borderRadius:10,border:'none',
                  cursor:loading?'wait':'pointer',width:'100%',opacity:loading?.7:1,transition:'all .18s'}}>
                <Icon name="check" size={16}/>{loading ? '验证中…' : '继续'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="col" style={{gap:14}}>
              <div className="col" style={{gap:6}}>
                <span className="field-label">邮箱</span>
                <input className="input" type="email" value={email} readOnly style={{opacity:.6}}/>
              </div>
              <div className="col" style={{gap:6}}>
                <span className="field-label">姓名 / 公司</span>
                <input className="input" value={name} onChange={e=>setName(e.target.value)}
                  placeholder="张三 / Sunpath Outdoor" autoFocus required/>
              </div>
              {error && <p style={{fontSize:12,color:'var(--red)',margin:0}}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{height:44,marginTop:2,display:'flex',alignItems:'center',justifyContent:'center',gap:7,
                  background:'#5B4FE0',color:'#fff',fontWeight:700,fontSize:15,borderRadius:10,border:'none',
                  cursor:loading?'wait':'pointer',width:'100%',opacity:loading?.7:1,transition:'all .18s'}}>
                <Icon name="check" size={16}/>{loading ? '创建中…' : '创建账号并进入'}
              </button>
              <button type="button" onClick={()=>{setStep('email');setError('');}}
                style={{background:'none',border:'none',color:'var(--text-3)',fontSize:12,cursor:'pointer',textAlign:'center'}}>
                ← 使用其他邮箱
              </button>
            </form>
          )}

          <div className="row" style={{gap:10,margin:'16px 0'}}>
            <span style={{flex:1,height:1,background:'var(--border-2)'}}/>
            <span className="aux">或</span>
            <span style={{flex:1,height:1,background:'var(--border-2)'}}/>
          </div>

          <button disabled={guestLoading} onClick={handleGuest}
            style={{width:'100%',height:44,display:'flex',alignItems:'center',justifyContent:'center',gap:7,
              background:'transparent',color:'#5B4FE0',fontWeight:700,fontSize:14,borderRadius:10,
              border:'1.5px solid #5B4FE0',cursor:guestLoading?'wait':'pointer',
              opacity:guestLoading?.7:1,transition:'all .18s'}}>
            <Icon name="zap" size={16}/>{guestLoading ? '正在准备演示数据…' : '以访客身份进入（演示数据）'}
          </button>
          <p className="aux" style={{textAlign:'center',marginTop:12,fontSize:11.5,lineHeight:1.6}}>
            访客模式可浏览全部示例数据，所有操作<b style={{color:'var(--text-2)'}}>不会保存</b>。
          </p>
        </div>
      </div>
    </div>
  );
}

export { Login };
