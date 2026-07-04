import { Icon } from '../icons.jsx';
import { KPIS, SELLER, STATUS_META, STREAM, TODO_QUEUE, TREND } from '../sampleData.js';
import { Grade, SectionTitle, StatCard, fmtMoney } from '../ui.jsx';

/* ===== dashboard.jsx ===== */
/* ============ 工作台（概览 + 待我处理）============ */
function Dashboard({go, onOpenProfile}){
  const hour=new Date().getHours();
  const greet = hour<11?'早上好':hour<14?'中午好':hour<18?'下午好':'晚上好';
  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
        {/* 欢迎 · 指挥中心横幅 */}
        <div className="anim-up" style={{position:'relative',overflow:'hidden',borderRadius:18,marginBottom:22,
          background:'var(--hero-grad)',
          padding:'26px 28px',boxShadow:'0 18px 40px -16px rgba(16,33,48,.45)'}}>
          <div style={{position:'absolute',top:-80,right:-30,width:340,height:340,pointerEvents:'none',
            background:'var(--hero-glow)'}}></div>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:.5,
            backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
            backgroundSize:'34px 34px',WebkitMaskImage:'radial-gradient(120% 100% at 80% 0%,#000,transparent 75%)',maskImage:'radial-gradient(120% 100% at 80% 0%,#000,transparent 75%)'}}></div>
          <div className="row spread" style={{position:'relative',gap:20,flexWrap:'wrap'}}>
            <div className="col" style={{gap:9,minWidth:0}}>
              <span className="row gap2" style={{alignItems:'center'}}>
                <span className="pill live-glow" style={{height:24,background:'rgba(255,255,255,.14)',color:'#fff',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.22)'}}>
                  <span className="dot dot-live" style={{background:'var(--tech-2)'}}></span>Agent 运行中 · 7×24</span>
                <span style={{fontSize:12,color:'rgba(255,255,255,.5)'}}>{new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})}</span>
              </span>
              <span style={{fontSize:27,fontWeight:700,letterSpacing:'-.022em',color:'#fff',lineHeight:1.2}}>{greet}，{SELLER.name.split(' ')[0]} 👋</span>
              <span style={{fontSize:13.5,color:'rgba(220,233,242,.78)',maxWidth:560,lineHeight:1.6}}>
                Closer 昨夜替你接住 9 条询盘、自动报价 6 条。有 <b style={{color:'#FFB4A8'}}>2 条</b>触发护栏，等你拍板。</span>
            </div>
            <div className="row gap2" style={{flex:'none'}}>
              <button className="btn btn-pri" onClick={()=>go('inbox')} style={{background:'rgba(255,255,255,.12)',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.18)'}}><Icon name="inbox" size={16}/>进入收件箱</button>
            </div>
          </div>
        </div>

        {/* 指标卡 */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {KPIS.map(({key,...k})=><StatCard key={key} {...k} onClick={()=>key==='todo'?go('inbox'):key==='conv'||key==='auto'?go('analytics'):go('inbox')}/>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.15fr .85fr',gap:20}}>
          {/* 待我处理队列 */}
          <div className="card card-pad topline anim-up">
            <SectionTitle icon="hand" sub="护栏触发 / 大单 / 合同条款 — 需要你拍板"
              right={<span className="badge badge-red"><span className="dot" style={{background:'var(--red)'}}></span>{TODO_QUEUE.length}</span>}>待我处理</SectionTitle>
            <div className="col" style={{gap:10}}>
              {TODO_QUEUE.map(t=>(
                <div key={t.id} className="row spread clickable card-hover" onClick={()=>go('inbox')}
                  style={{padding:'12px 14px',border:'1px solid var(--border-2)',borderRadius:11,background:'#fff'}}>
                  <div className="row gap3" style={{minWidth:0,flex:1}}>
                    <Grade g={t.grade} size={26}/>
                    <div className="col" style={{minWidth:0,flex:1}}>
                      <div className="row gap2" style={{minWidth:0}}><span className="flag">{t.flag}</span>
                        <span style={{fontWeight:600,fontSize:13.5}} className="ellipsis">{t.company}</span>
                        <span className="badge badge-red" style={{height:18,flex:'none'}}>{t.tag}</span></div>
                      <span className="aux ellipsis">{t.reason}</span>
                    </div>
                  </div>
                  <div className="col" style={{alignItems:'flex-end',flex:'none'}}>
                    <span className="num" style={{fontWeight:600,fontSize:14}}>{fmtMoney(t.value)}</span>
                    <span className="aux" style={{fontSize:11}}>{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-sec btn-sm" style={{width:'100%',marginTop:12}} onClick={()=>go('inbox')}>
              查看全部询盘 <Icon name="arrowRight" size={14}/></button>
          </div>

          {/* 7 日趋势 */}
          <div className="card card-pad anim-up">
            <SectionTitle icon="trend" sub="询盘量 vs 成交">近 7 日</SectionTitle>
            <TrendChart/>
            <div className="row gap4" style={{marginTop:14,justifyContent:'center'}}>
              <span className="row gap1 aux"><span style={{width:10,height:10,borderRadius:3,background:'var(--primary-light)'}}></span>询盘</span>
              <span className="row gap1 aux"><span style={{width:10,height:10,borderRadius:3,background:'var(--green)'}}></span>成交</span>
            </div>
          </div>
        </div>

        {/* 实时询盘流 */}
        <div className="card card-pad topline anim-up" style={{marginTop:20}}>
          <SectionTitle icon="zap" sub="Agent 正在处理的最新动作"
            right={<span className="pill pill-deal live-glow" style={{height:24}}><span className="dot dot-live" style={{background:'var(--green)'}}></span>实时</span>}>实时询盘流</SectionTitle>
          <div className="col">
            {STREAM.map((s,i)=>{
              const m=STATUS_META[s.status];
              return <div key={i} className="row gap3" style={{padding:'11px 0',borderBottom:i<STREAM.length-1?'1px solid var(--border-2)':'none'}}>
                <span className="aux mono" style={{width:46,flex:'none',fontSize:11.5}}>{s.time}</span>
                <span className="flag">{s.flag}</span>
                <span style={{fontWeight:600,fontSize:13,width:150,flex:'none'}} className="ellipsis">{s.company}</span>
                <span className="aux" style={{flex:1,color:'var(--text)'}}>{s.act}</span>
                <span className={`pill ${m.pill}`} style={{height:22,fontSize:11,padding:'0 8px',flex:'none'}}><Icon name={m.icon} size={11}/>{m.label}</span>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 趋势图（SVG 柱 + 折线） */
function TrendChart(){
  const w=380,h=150,pad=24;
  const max=Math.max(...TREND.map(t=>t.inq));
  const bw=(w-pad*2)/TREND.length;
  const x=i=>pad+bw*i+bw/2;
  const y=v=>h-pad-(v/max)*(h-pad*2);
  const line=TREND.map((t,i)=>`${x(i)},${y(t.deal)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:160}}>
      {[0,.5,1].map(f=><line key={f} x1={pad} x2={w-pad} y1={pad+(h-pad*2)*f} y2={pad+(h-pad*2)*f} stroke="var(--border-2)" strokeWidth="1"/>)}
      {TREND.map((t,i)=>(
        <rect key={i} x={x(i)-13} y={y(t.inq)} width="26" height={h-pad-y(t.inq)} rx="4" fill="var(--primary-light)"/>
      ))}
      <polyline points={line} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {TREND.map((t,i)=><circle key={i} cx={x(i)} cy={y(t.deal)} r="3.5" fill="#fff" stroke="var(--green)" strokeWidth="2"/>)}
      {TREND.map((t,i)=><text key={i} x={x(i)} y={h-7} textAnchor="middle" fontSize="10" fill="var(--text-3)">{t.d}</text>)}
    </svg>
  );
}

export { Dashboard };
