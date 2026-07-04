/**
 * [INPUT]: 依赖 React、Icon、Logo、登录页背景图与设计令牌
 * [OUTPUT]: 对外提供 Login 登录页 —— 左侧产品能力展示 + 右侧登录/访客入口，外贸场景背景图
 * [POS]: frontend/src 的鉴权门面，App 在无 session 时渲染本页
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */

import { useState } from 'react';
import { Icon } from './icons.jsx';
import { Logo } from './ui.jsx';

const FEATURES = [
  {icon:'globe',  title:'多渠道询盘归一',   desc:'邮件 / WhatsApp / 阿里国际站 / 独立站表单，统一接住每一条。'},
  {icon:'bot',    title:'AI 自动分诊·甄别·报价', desc:'7×24 秒级响应，自动评级、理解需求并生成报价。'},
  {icon:'shield', title:'底价护栏不可绕',   desc:'低于底价或敏感条款自动拦截，挂起转人工拍板。'},
  {icon:'check',  title:'随身成交',         desc:'移动端推送提醒、一键接管与批准报价，路上也能成交。'},
];

function Login({ onLogin, onGuest }){
  const [email,setEmail]=useState('hank@sunpath.com');
  const [pw,setPw]=useState('');
  const submit=(e)=>{ e.preventDefault(); onLogin({mode:'user', name:(email.split('@')[0]||'用户'), email}); };

  return (
    <div className="login-bg">
      <div style={{position:'absolute',top:'-12%',right:'-6%',width:520,height:520,pointerEvents:'none',background:'var(--hero-glow)',opacity:.6}}/>

      <div className="login-wrap">
        {/* 左：产品能力展示（体现功能） */}
        <div className="login-features">
          <div className="row gap2" style={{marginBottom:6}}><Logo size={40} color="#fff"/></div>
          <div style={{fontSize:30,fontWeight:800,letterSpacing:'-.02em',lineHeight:1.25,marginTop:14}}>
            AI 外贸成交官<br/>替你接住并谈成每一条询盘
          </div>
          <div style={{color:'rgba(220,233,242,.78)',marginTop:10,maxWidth:440,lineHeight:1.6}}>
            从多渠道接入到自动报价、议价护栏与成交跟进，全链路收束在一个工作台。
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
            <Logo size={40}/>
            <span className="aux" style={{marginTop:8}}>登录工作台，或免登录体验</span>
          </div>

          <form onSubmit={submit} className="col" style={{gap:14}}>
            <div className="col" style={{gap:6}}>
              <span className="field-label">邮箱</span>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" autoFocus/>
            </div>
            <div className="col" style={{gap:6}}>
              <span className="field-label">密码</span>
              <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••"/>
            </div>
            <div className="row spread" style={{fontSize:12}}>
              <label className="row gap1 clickable" style={{color:'var(--text-2)'}}>
                <input type="checkbox" defaultChecked style={{width:14,height:14}}/> 记住我
              </label>
              <a style={{color:'var(--primary)'}}>忘记密码？</a>
            </div>
            <button className="btn btn-pri" type="submit" style={{height:42,marginTop:2}}><Icon name="check" size={16}/>登录</button>
          </form>

          <div className="row" style={{gap:10,margin:'16px 0'}}>
            <span style={{flex:1,height:1,background:'var(--border-2)'}}/>
            <span className="aux">或</span>
            <span style={{flex:1,height:1,background:'var(--border-2)'}}/>
          </div>

          <button className="btn btn-sec" style={{width:'100%',height:42}} onClick={()=>onGuest({mode:'guest', name:'访客'})}>
            <Icon name="zap" size={16}/>以访客身份进入（演示数据）
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
