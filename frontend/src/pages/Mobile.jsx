import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { CHANNELS, CUSTOMERS, INQUIRIES, STATUS_META, TIMELINE, TODO_QUEUE } from '../sampleData.js';
import { Avatar, Grade, fmtMoney, useToast } from '../ui.jsx';

/* ===== mobile.jsx ===== */
/* ============ 移动端原型 ============ */

/* —— 手机外壳 —— */
function PhoneShell({children, w=274, h=576, nav, activeTab, onTab, dark, label}){
  const tabs=[['home','dashboard','工作台'],['inbox','inbox','询盘'],['alerts','bell','提醒'],['me','user','我的']];
  return (
    <div className="col" style={{alignItems:'center',gap:10}}>
      <div style={{width:w,height:h,background:'#0E1726',borderRadius:34,padding:9,flex:'none',
        boxShadow:'0 22px 50px -18px rgba(16,33,48,.5),0 4px 12px rgba(16,33,48,.16)'}}>
        <div style={{width:'100%',height:'100%',background:'var(--bg)',borderRadius:26,overflow:'hidden',position:'relative',display:'flex',flexDirection:'column'}}>
          {/* 状态栏 */}
          <div style={{height:30,flex:'none',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 18px',
            background:'transparent',position:'relative',zIndex:5}}>
            <span className="mono" style={{fontSize:11,fontWeight:600,color:dark?'#fff':'var(--text)'}}>9:41</span>
            <span style={{position:'absolute',left:'50%',top:7,transform:'translateX(-50%)',width:54,height:15,background:'#0E1726',borderRadius:9}}></span>
            <span style={{fontSize:10,color:dark?'#fff':'var(--text-2)',letterSpacing:'1px'}}>● ● ●</span>
          </div>
          {/* 内容 */}
          <div className="scroll" style={{flex:1,position:'relative'}}>{children}</div>
          {/* 底部导航 */}
          {nav&&(
            <div className="row" style={{flex:'none',height:54,borderTop:'1px solid var(--border-2)',background:'rgba(255,255,255,.92)',
              backdropFilter:'blur(8px)',justifyContent:'space-around',alignItems:'center',paddingBottom:4}}>
              {tabs.map(([k,ic,lb])=>{
                const on=activeTab===k;
                return (
                  <button key={k} onClick={()=>onTab&&onTab(k)} className="col center" style={{gap:2,flex:1,color:on?'var(--primary)':'var(--text-3)'}}>
                    <Icon name={ic} size={19} strokeWidth={on?2.1:1.7}/>
                    <span style={{fontSize:9.5,fontWeight:on?600:500}}>{lb}</span>
                    {k==='alerts'&&<span style={{position:'absolute',marginTop:-22,marginLeft:14,width:7,height:7,borderRadius:'50%',background:'var(--red)',border:'1.5px solid #fff'}}></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {label&&<span className="aux" style={{fontWeight:600,color:'var(--text-2)'}}>{label}</span>}
    </div>
  );
}

/* —— 紧凑卡片头 —— */
function MHead({title, right}){
  return <div className="row spread" style={{padding:'4px 2px 10px'}}>
    <span style={{fontWeight:700,fontSize:16,letterSpacing:'-.01em'}}>{title}</span>{right}</div>;
}

/* ===== 屏幕：工作台 ===== */
function MHome({onOpenConvo, onTab}){
  return (
    <div style={{padding:'6px 14px 16px'}}>
      {/* hero */}
      <div style={{position:'relative',overflow:'hidden',borderRadius:16,padding:'15px 16px',marginBottom:14,
        background:'var(--hero-grad)',boxShadow:'0 12px 26px -14px rgba(16,33,48,.5)'}}>
        <div style={{position:'absolute',top:-50,right:-20,width:160,height:160,background:'var(--hero-glow)',pointerEvents:'none'}}></div>
        <div style={{position:'relative'}}>
          <span className="pill" style={{height:21,fontSize:10.5,background:'rgba(255,255,255,.15)',color:'#fff',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.2)'}}>
            <span className="dot dot-live" style={{background:'var(--tech-2)'}}></span>Agent 运行中 · 7×24</span>
          <div style={{fontSize:18,fontWeight:700,color:'#fff',marginTop:8}}>中午好，Hank 👋</div>
          <div style={{fontSize:11.5,color:'rgba(255,255,255,.78)',marginTop:3,lineHeight:1.5}}>昨夜接住 9 条询盘，<b style={{color:'#FFC4B8'}}>2 条</b>待你拍板</div>
        </div>
      </div>
      {/* KPI 2x2 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:14}}>
        {[['今日询盘','14','+3','var(--primary)','inbox'],['待我处理','2','转人工','var(--orange)','hand'],
          ['自动处理率','86%','+4pt','var(--green)','bot'],['本月转化','23%','+2pt','var(--green)','target']].map(([l,v,d,c,ic],i)=>(
          <div key={i} className="card" style={{padding:'11px 12px'}}>
            <div className="row spread" style={{marginBottom:6}}>
              <span style={{width:26,height:26,borderRadius:7,background:c+'18',color:c,display:'inline-flex',alignItems:'center',justifyContent:'center'}}><Icon name={ic} size={14}/></span>
              <span className="aux" style={{fontSize:10,color:d.includes('pt')||d.includes('+')?'var(--green)':'var(--orange)',fontWeight:600}}>{d}</span>
            </div>
            <div className="num" style={{fontSize:20,fontWeight:600,lineHeight:1}}>{v}</div>
            <div className="aux" style={{fontSize:10.5,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
      {/* 待我处理 */}
      <div className="row spread" style={{marginBottom:9}}>
        <span style={{fontWeight:600,fontSize:13.5}} className="row gap2"><Icon name="hand" size={15} style={{color:'var(--primary)'}}/>待我处理</span>
        <span className="badge badge-red" style={{height:18}}>2</span>
      </div>
      <div className="col" style={{gap:9}}>
        {TODO_QUEUE.map(t=>(
          <div key={t.id} onClick={onOpenConvo} className="card clickable" style={{padding:'11px 12px',borderLeft:'3px solid var(--red)'}}>
            <div className="row spread" style={{marginBottom:4}}>
              <span className="row gap2" style={{minWidth:0}}><Grade g={t.grade} size={18}/><span className="flag">{t.flag}</span>
                <span style={{fontWeight:600,fontSize:12.5}} className="ellipsis">{t.company}</span></span>
              <span className="num" style={{fontSize:12,fontWeight:600,flex:'none'}}>{fmtMoney(t.value)}</span>
            </div>
            <div className="row spread">
              <span className="aux ellipsis" style={{fontSize:11}}>{t.reason}</span>
              <span className="badge badge-red" style={{height:17,flex:'none'}}>{t.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== 屏幕：询盘列表 ===== */
function MInbox({onOpenConvo}){
  const [f,setF]=useState('all');
  const chips=[['all','全部'],['A','A 级'],['todo','待处理'],['ai','AI 中']];
  let list=INQUIRIES;
  if(f==='A')list=list.filter(i=>i.grade==='A');
  if(f==='todo')list=list.filter(i=>i.status==='guardrail'||i.status==='human');
  if(f==='ai')list=list.filter(i=>i.status==='ai'||i.status==='followup');
  return (
    <div style={{padding:'6px 0 8px'}}>
      <div style={{padding:'0 14px'}}>
        <MHead title="询盘收件箱" right={<span className="badge badge-red" style={{height:20}}><span className="dot" style={{background:'var(--red)'}}></span>2</span>}/>
        <div style={{position:'relative',marginBottom:10}}>
          <span style={{position:'absolute',left:9,top:8,color:'var(--text-3)'}}><Icon name="search" size={15}/></span>
          <input className="input" placeholder="搜索客户 / 国家" style={{height:32,paddingLeft:29,fontSize:12.5}}/>
        </div>
        <div className="row gap1" style={{marginBottom:6,overflowX:'auto',paddingBottom:2}}>
          {chips.map(([k,l])=>(
            <button key={k} onClick={()=>setF(k)} className="badge clickable" style={{height:26,padding:'0 12px',flex:'none',
              background:f===k?'var(--primary)':'#eef1f4',color:f===k?'#fff':'var(--text-2)',fontWeight:600}}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        {list.map(i=>{
          const m=STATUS_META[i.status];
          return (
            <div key={i.id} onClick={()=>onOpenConvo&&onOpenConvo(i)} className="clickable" style={{padding:'11px 14px',borderBottom:'1px solid var(--border-2)'}}>
              <div className="row spread" style={{marginBottom:3}}>
                <span className="row gap2" style={{minWidth:0}}><Grade g={i.grade} size={17}/><span className="flag">{i.flag}</span>
                  <span style={{fontWeight:600,fontSize:12.5}} className="ellipsis">{i.company}</span>
                  {i.pinned&&<Icon name="pin" size={11} style={{color:'var(--primary)',flex:'none'}}/>}</span>
                <span className="aux" style={{fontSize:10,flex:'none'}}>{i.time}</span>
              </div>
              <div className="aux ellipsis" style={{fontSize:11,marginBottom:6,color:'var(--text)'}}>{i.title}</div>
              <div className="row spread">
                <span className={`pill ${m.pill}`} style={{height:19,fontSize:10,padding:'0 7px'}}><Icon name={m.icon} size={10}/>{m.label}</span>
                {i.value>0&&<span className="num aux" style={{fontSize:11,fontWeight:600,flex:'none'}}>{fmtMoney(i.value)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== 屏幕：会话（含护栏接管）===== */
function MConvo({inq, onBack}){
  inq=inq||INQUIRIES[0];
  const hero=inq.id==='inq-1';
  const [resolved,setResolved]=useState(inq.status!=='guardrail');
  const [extra,setExtra]=useState([]);
  const [translate,setTranslate]=useState(true);
  const toast=useToast();
  const approve=()=>{
    setResolved(true);
    setExtra([{role:'ai',text:`Sanne, I can meet you at $168/set for 300 sets, with cargo insurance included — 70% before shipment, balance net-30. Shall I update the PI?`,zh:`Sanne，300 套我可以给到 $168/套，含货运保险——发货前 70%，到港后 30 天结尾款。需要我更新 PI 吗？`,time:'09:36'}]);
    toast&&toast('已按建议发送 · 守住底价 $168','ok');
  };
  return (
    <div className="col" style={{height:'100%'}}>
      {/* 顶栏 */}
      <div className="row gap2" style={{padding:'8px 12px',borderBottom:'1px solid var(--border-2)',background:'#fff',flex:'none'}}>
        {onBack&&<button className="btn-icon btn-ghost" onClick={onBack}><Icon name="chevL" size={18}/></button>}
        <span className="flag">{inq.flag}</span>
        <div className="col" style={{minWidth:0,flex:1}}>
          <span className="row gap1" style={{fontWeight:600,fontSize:13}}><span className="ellipsis">{inq.company}</span><Grade g={inq.grade} size={16}/></span>
          <span className="aux" style={{fontSize:10}}>{inq.contact} · {CHANNELS[inq.channel].name}</span>
        </div>
        <button className="btn-icon btn-ghost" onClick={()=>setTranslate(t=>!t)} title="自动翻译" style={{color:translate?'var(--primary)':'var(--text-3)'}}><Icon name="language" size={17}/></button>
      </div>
      {/* 翻译状态条 */}
      <div className="row spread" style={{padding:'6px 12px',background:translate?'var(--primary-tint)':'#fff',borderBottom:'1px solid var(--border-2)',flex:'none'}}>
        <span className="row gap1" style={{fontSize:10.5,fontWeight:600,color:translate?'var(--primary)':'var(--text-3)'}}><Icon name="language" size={12}/>{translate?'外文已译为中文 · 保留原文':'已关闭翻译，仅显原文'}</span>
        <div className={`switch ${translate?'on':''}`} onClick={()=>setTranslate(t=>!t)} style={{width:30,height:17}}></div>
      </div>
      {/* 流 */}
      <div className="scroll" style={{flex:1,padding:'12px',background:'#fbfcfd'}}>
        {hero?(
          <div className="col" style={{gap:10}}>
            <MBubble side="left" who={inq.contact} translate={translate} zh="你好，我对你们的 PE 藤编转角沙发感兴趣——200 套发往鹿特丹的报价？UV 耐候与质保如何？">Hi, interested in your PE rattan corner sofa sets — pricing for 200 sets to Rotterdam? UV resistance &amp; warranty?</MBubble>
            <div className="card" style={{padding:'9px 11px'}}>
              <div className="row spread" style={{marginBottom:5}}><span className="row gap1" style={{fontWeight:600,fontSize:11.5}}><Icon name="shieldCheck" size={13} style={{color:'var(--green)'}}/>已甄别 · A 级</span><span className="badge badge-A" style={{height:17}}>92 分</span></div>
              <div className="aux" style={{fontSize:10.5,lineHeight:1.5}}>企业域名 · 荷兰 12 家门店零售商 · 含明确规格数量</div>
            </div>
            <MBubble side="right" ai translate={translate} zh="抗 UV 稳定树脂（2000+ 小时），3 年框架质保。200 套 CIF 鹿特丹报价如下 👇">UV-stabilized resin (2000+ hrs), 3-year frame warranty. Pricing for 200 sets CIF Rotterdam below 👇</MBubble>
            {/* 报价卡 */}
            <div className="card" style={{border:'1px solid var(--primary-light)',overflow:'hidden',alignSelf:'flex-end',maxWidth:'90%'}}>
              <div className="row spread" style={{background:'var(--primary-tint)',padding:'7px 11px'}}>
                <span className="row gap1" style={{fontWeight:600,fontSize:11,color:'var(--primary)'}}><Icon name="doc" size={12}/>报价 · CIF 鹿特丹</span>
                <span className="badge badge-pri" style={{height:16}}>AI 生成</span></div>
              <div style={{padding:'10px 11px'}}>
                <div className="aux" style={{fontSize:10.5}}>200 套 · Aspen 藤编转角沙发</div>
                <div className="row spread" style={{alignItems:'baseline',marginTop:4}}>
                  <span className="num" style={{fontSize:22,fontWeight:700,color:'var(--primary)'}}>$182</span><span className="aux" style={{fontSize:10}}>/ 套</span></div>
              </div>
            </div>
            <MBubble side="left" who={inq.contact} translate={translate} zh="有同行报 $165。如果做到 300 套，能给 $158/套 + 60 天账期吗？">A competitor quoted $165. If we go 300 sets, can you do $158/set + 60-day terms?</MBubble>
            {/* 护栏 */}
            {!resolved?(
              <div style={{background:'var(--red-light)',border:'1px solid #f0c4c2',borderRadius:12,padding:'12px',boxShadow:'0 4px 14px -6px rgba(217,83,79,.3)'}}>
                <div className="row gap2" style={{marginBottom:8}}>
                  <span style={{width:26,height:26,borderRadius:7,background:'var(--red)',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none'}}><Icon name="shield" size={15}/></span>
                  <div className="col"><span style={{fontWeight:700,fontSize:12.5,color:'#b53d39'}}>已暂停自动发送</span><span className="aux" style={{fontSize:10,color:'#b53d39'}}>触及 2 条护栏，待你拍板</span></div>
                </div>
                <div className="col" style={{gap:5,marginBottom:9}}>
                  <div className="row gap1" style={{fontSize:10.5,color:'#b53d39'}}><Icon name="alert" size={11}/>目标价 $158 &lt; 底价 $168</div>
                  <div className="row gap1" style={{fontSize:10.5,color:'#b53d39'}}><Icon name="alert" size={11}/>要求 60 天账期</div>
                </div>
                <div style={{background:'#fff',borderRadius:8,padding:'8px 10px',marginBottom:9}}>
                  <div className="aux" style={{fontSize:10,fontWeight:600,color:'var(--primary)',marginBottom:2}}>💡 AI 建议</div>
                  <div className="aux" style={{fontSize:10.5,lineHeight:1.5}}>$168/套（守底价）+ 赠运险，账期改 70% 发货前 + 尾款到港 30 天</div>
                </div>
                <button className="btn btn-danger" style={{width:'100%',marginBottom:6,height:34}} onClick={approve}><Icon name="check" size={15}/>采纳建议（$168）并发送</button>
                <div className="row gap2"><button className="btn btn-sec btn-sm" style={{flex:1}} onClick={onBack}>稍后</button>
                  <button className="btn btn-sec btn-sm" style={{flex:1}}><Icon name="hand" size={13}/>我来接管</button></div>
              </div>
            ):(
              <>
                <div style={{background:'var(--green-light)',border:'1px solid #b9e0d8',borderRadius:10,padding:'10px 12px'}}>
                  <div className="row gap2"><Icon name="checkCircle" size={15} style={{color:'var(--green)'}}/><span style={{fontWeight:600,fontSize:12,color:'#1f7568'}}>护栏已解除 · 已按你的决定继续</span></div>
                </div>
                {extra.map((e,i)=><MBubble key={i} side="right" ai time={e.time} translate={translate} zh={e.zh}>{e.text}</MBubble>)}
              </>
            )}
          </div>
        ):(
          <div className="col" style={{gap:10}}>
            <MBubble side="left" who={inq.contact} translate={translate} zh={`你好，我是 ${inq.company} 的 ${inq.contact}。${inq.title}。报价与交期方便告知吗？`}>Hi, this is {inq.contact} from {inq.company}. {inq.title}. Pricing &amp; lead time please?</MBubble>
            <MBubble side="right" ai translate={translate} zh="感谢联系！我已在下方准备好资料，有任何问题随时找我。">Thanks for reaching out! I've prepared the details below and I'm here for any questions.</MBubble>
          </div>
        )}
      </div>
      {/* 输入 */}
      <div className="row gap2" style={{padding:'9px 12px',borderTop:'1px solid var(--border-2)',background:'#fff',flex:'none',alignItems:'center'}}>
        <span className="pill pill-ai" style={{height:24,fontSize:10.5,flex:'none'}}><Icon name="bot" size={12}/>AI 处理中</span>
        <input className="input" placeholder="接管后可输入…" style={{height:34,fontSize:12,opacity:.6}} disabled/>
        <button className="btn-icon btn-pri" style={{flex:'none'}}><Icon name="send" size={15}/></button>
      </div>
    </div>
  );
}

function MBubble({side,ai,who,time,zh,translate=true,children}){
  const bilingual = translate && zh;
  const label = ai ? '发送给客户 · EN' : '原文 · EN';
  return (
    <div className="row" style={{justifyContent:side==='left'?'flex-start':'flex-end',gap:7,alignItems:'flex-end'}}>
      {side==='left'&&<Avatar name={who} size={24}/>}
      <div style={{maxWidth:'82%'}}>
        {ai&&<div className="row gap1" style={{justifyContent:'flex-end',marginBottom:2}}><span className="badge badge-pri" style={{height:15,fontSize:9.5}}><Icon name="bot" size={9}/>AI</span></div>}
        <div style={{background:side==='left'?'#fff':(ai?'var(--primary-tint)':'#fff'),
          border:side==='left'?'1px solid var(--border-2)':(ai?'1px solid var(--primary-light)':'1px solid var(--border)'),
          borderRadius:11,padding:'8px 10px',fontSize:11.5,lineHeight:1.5,
          borderBottomLeftRadius:side==='left'?3:11,borderBottomRightRadius:side==='left'?11:3}}>
          {bilingual ? (
            <>
              <div>{zh}</div>
              <div style={{display:'flex',alignItems:'center',gap:5,margin:'6px 0 5px'}}>
                <span style={{flex:1,height:1,background:'var(--border-2)'}}></span>
                <span style={{display:'inline-flex',alignItems:'center',gap:2,fontSize:8.5,fontWeight:600,color:'var(--text-3)',whiteSpace:'nowrap'}}><Icon name="language" size={9}/>{label}</span>
                <span style={{flex:1,height:1,background:'var(--border-2)'}}></span>
              </div>
              <div style={{fontSize:10.5,color:'var(--text-3)',lineHeight:1.45}}>{children}</div>
            </>
          ) : children}
        </div>
        {time&&<div className="aux" style={{fontSize:9,textAlign:'right',marginTop:2}}>{time}</div>}
      </div>
      {side==='right'&&(ai?<Avatar type="ai" size={24}/>:<Avatar name="Hank" size={24}/>)}
    </div>
  );
}

/* ===== 屏幕：客户档案 ===== */
function MCustomer({c}){
  c=c||CUSTOMERS[0];
  return (
    <div style={{padding:'6px 14px 16px'}}>
      <MHead title="客户档案"/>
      <div className="card" style={{padding:'14px',marginBottom:12}}>
        <div className="row gap2" style={{marginBottom:12}}>
          <Avatar name={c.contact} size={42}/>
          <div className="col" style={{minWidth:0}}><span className="row gap1" style={{fontWeight:600,fontSize:14}}><span className="ellipsis">{c.company}</span><span className="flag">{c.flag}</span><Grade g={c.grade} size={18}/></span>
            <span className="aux" style={{fontSize:11}}>{c.contact} · {c.country}</span></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7}}>
          {[['询盘',c.inquiries],['成交',c.deals],['金额',c.value>1000?'$'+(c.value/1000).toFixed(0)+'k':'—']].map(([k,v])=>(
            <div key={k} className="col center" style={{padding:'9px 4px',background:'#fafbfc',borderRadius:8,border:'1px solid var(--border-2)'}}>
              <span className="num" style={{fontSize:16,fontWeight:600}}>{v}</span><span className="aux" style={{fontSize:9.5}}>{k}</span></div>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:'10px 12px',marginBottom:14,background:'var(--primary-tint)',border:'1px solid var(--primary-light)'}}>
        <div className="row gap1" style={{marginBottom:3}}><Icon name="building" size={12} style={{color:'var(--primary)'}}/><span className="aux" style={{fontSize:10.5,fontWeight:600,color:'var(--primary)'}}>背调摘要</span></div>
        <div className="aux" style={{fontSize:10.5,lineHeight:1.55,color:'var(--text)'}}>{c.note}</div>
      </div>
      <div className="aux" style={{fontWeight:600,fontSize:11,marginBottom:8}}>跟进时间线</div>
      <div className="col">
        {TIMELINE.slice(0,5).map((t,i)=>{
          const meta={guard:['shield','var(--red)'],ai:['bot','var(--primary)'],quote:['doc','var(--primary)'],screen:['shieldCheck','var(--green)'],in:['message','var(--text-2)']}[t.type];
          return (
            <div key={i} className="row gap2" style={{paddingBottom:11,position:'relative'}}>
              {i<4&&<span style={{position:'absolute',left:10,top:20,bottom:0,width:1.5,background:'var(--border)'}}></span>}
              <span style={{width:21,height:21,borderRadius:'50%',background:'#fff',border:`1.5px solid ${meta[1]}`,color:meta[1],display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none',zIndex:1}}><Icon name={meta[0]} size={11}/></span>
              <div className="col" style={{marginTop:-1}}><span className="aux" style={{fontSize:9.5}}>{t.time}</span><span style={{fontSize:11,color:'var(--text)'}}>{t.text}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== 屏幕：转人工提醒 ===== */
function MAlerts({onOpenConvo}){
  const items=[
    {kind:'red', icon:'shield', title:'护栏触发 · 待拍板', flag:'🇳🇱', co:'Garden Living BV', body:'坚持 $158/套 + 60 天账期，已触底价，自动发送暂停', time:'刚刚', tag:'A 级 · $36,400', inq:INQUIRIES[0]},
    {kind:'blue', icon:'user', title:'客户提出框架协议', flag:'🇦🇺', co:'Aussie Backyard Co.', body:'老客户返单，想谈年度框架协议条款', time:'10 分钟前', tag:'A 级 · 复购', inq:INQUIRIES[6]},
    {kind:'green', icon:'checkCircle', title:'新成交 🎉', flag:'🇳🇴', co:'Nordic Patio AS', body:'客户确认 PI，AI 已自动建档并沉淀话术', time:'3 小时前', tag:'$21,600', inq:INQUIRIES[3]},
    {kind:'ai', icon:'bot', title:'AI 已自动报价', flag:'🇮🇹', co:'Coastal Home Group', body:'已发送 FSC 认证说明 + 海运报价，等待回复', time:'今天 09:18', tag:'A 级', inq:INQUIRIES[1]},
  ];
  const C={red:['var(--red)','#fffafa','#f0c4c2'],blue:['var(--primary)','var(--primary-tint)','var(--primary-light)'],green:['var(--green)','var(--green-light)','#b9e0d8'],ai:['var(--tech-deep)','#fff','var(--border-2)']};
  return (
    <div style={{padding:'6px 14px 16px'}}>
      <MHead title="转人工提醒" right={<button className="aux" style={{fontWeight:600,color:'var(--primary)'}}>全部已读</button>}/>
      <div className="col" style={{gap:10}}>
        {items.map((a,i)=>{
          const [c,bg,bd]=C[a.kind];
          return (
            <div key={i} onClick={()=>onOpenConvo&&onOpenConvo(a.inq)} className="card clickable" style={{padding:'12px',background:bg,border:`1px solid ${bd}`}}>
              <div className="row gap2" style={{marginBottom:6}}>
                <span style={{width:26,height:26,borderRadius:7,background:c,color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',flex:'none'}}><Icon name={a.icon} size={14}/></span>
                <span style={{fontWeight:700,fontSize:12,color:c}}>{a.title}</span>
                <span className="aux" style={{fontSize:9.5,marginLeft:'auto'}}>{a.time}</span>
              </div>
              <div className="row gap1" style={{marginBottom:4}}><span className="flag">{a.flag}</span><span style={{fontWeight:600,fontSize:12}}>{a.co}</span></div>
              <div className="aux" style={{fontSize:11,lineHeight:1.5,marginBottom:7}}>{a.body}</div>
              <span className="badge" style={{height:18,background:'rgba(0,0,0,.04)',color:'var(--text-2)'}}>{a.tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== 屏幕：我的 ===== */
function MMe(){
  return (
    <div style={{padding:'6px 14px 16px'}}>
      <MHead title="我的"/>
      <div className="card" style={{padding:'14px',marginBottom:12}}>
        <div className="row gap3">
          <span style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(145deg,var(--tech-2),var(--primary))',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:18}}>H</span>
          <div className="col"><span style={{fontWeight:600,fontSize:14}}>Sunpath Outdoor</span><span className="aux" style={{fontSize:11}}>陈航 · Hank · Pro 月度</span></div>
        </div>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        {[['bot','AI 行为与护栏','已配置'],['rules','报价规则','4 档阶梯价'],['globe','渠道接入','3 个已连接'],['box','产品库','6 个 SKU'],['bell','通知设置','护栏 · 大单']].map(([ic,t,s],i)=>(
          <div key={t} className="row spread clickable" style={{padding:'13px 14px',borderTop:i?'1px solid var(--border-2)':'none'}}>
            <span className="row gap2"><span style={{color:'var(--primary)'}}><Icon name={ic} size={16}/></span><span style={{fontSize:13,fontWeight:500}}>{t}</span></span>
            <span className="row gap1"><span className="aux" style={{fontSize:11}}>{s}</span><Icon name="chevR" size={15} style={{color:'var(--text-3)'}}/></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* —— 可交互手机 App —— */
function MobileApp(){
  const [tab,setTab]=useState('home');
  const [convo,setConvo]=useState(null);
  const openConvo=(inq)=>setConvo(inq||INQUIRIES[0]);
  if(convo) return <PhoneShell><MConvo inq={convo} onBack={()=>setConvo(null)}/></PhoneShell>;
  return (
    <PhoneShell nav activeTab={tab} onTab={setTab}>
      {tab==='home'&&<MHome onOpenConvo={()=>openConvo(INQUIRIES[0])} onTab={setTab}/>}
      {tab==='inbox'&&<MInbox onOpenConvo={openConvo}/>}
      {tab==='alerts'&&<MAlerts onOpenConvo={openConvo}/>}
      {tab==='me'&&<MMe/>}
    </PhoneShell>
  );
}

/* ===== 移动端页面（试用 + 原型板）===== */
function MobilePreview(){
  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px 48px',maxWidth:1240,margin:'0 auto'}}>
        <div className="col" style={{marginBottom:22}}>
          <span className="eyebrow" style={{color:'var(--tech-deep)'}}>Mobile · 随身工作台</span>
          <span className="h1">移动端原型</span>
          <span className="muted" style={{marginTop:4}}>卖家随身处理高优事项：推送提醒 → 一屏看清 → 一键接管 / 批准报价。下面左侧可真机点按。</span>
        </div>

        <div className="row gap5" style={{alignItems:'flex-start',flexWrap:'wrap'}}>
          {/* 可交互试用机 */}
          <div className="col" style={{gap:12,flex:'none'}}>
            <span className="badge badge-pri" style={{height:24,alignSelf:'flex-start'}}><Icon name="zap" size={13}/>可点击试用</span>
            <MobileApp/>
            <span className="aux" style={{maxWidth:274,lineHeight:1.5}}>切换底部标签，点「待处理 / 提醒 / 询盘」任意一条进入会话，试试护栏页的<b style={{color:'var(--text)'}}>「采纳建议并发送」</b>。</span>
          </div>

          {/* 原型板 */}
          <div className="col" style={{gap:16,flex:1,minWidth:560}}>
            <span className="eyebrow" style={{color:'var(--text-3)'}}>全部界面 · 原型图</span>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(248px,1fr))',gap:'28px 20px',justifyItems:'center'}}>
              <div style={{pointerEvents:'none'}}><PhoneShell w={248} h={520} nav activeTab="home" label="工作台"><MHome/></PhoneShell></div>
              <div style={{pointerEvents:'none'}}><PhoneShell w={248} h={520} nav activeTab="inbox" label="询盘收件箱"><MInbox/></PhoneShell></div>
              <div style={{pointerEvents:'none'}}><PhoneShell w={248} h={520} label="会话 · 护栏接管"><MConvo/></PhoneShell></div>
              <div style={{pointerEvents:'none'}}><PhoneShell w={248} h={520} nav activeTab="alerts" label="转人工提醒"><MAlerts/></PhoneShell></div>
              <div style={{pointerEvents:'none'}}><PhoneShell w={248} h={520} label="客户档案"><MCustomer/></PhoneShell></div>
              <div style={{pointerEvents:'none'}}><PhoneShell w={248} h={520} nav activeTab="me" label="我的 · 设置"><MMe/></PhoneShell></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MobilePreview };
