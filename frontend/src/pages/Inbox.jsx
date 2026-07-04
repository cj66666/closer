import { useState, useEffect, useRef } from 'react';
import { Icon } from '../icons.jsx';
import { ARCHIVED_ITEMS, CHANNELS, INQUIRIES, OLD_CUSTOMERS, QUOTES, STATUS_META, THREAD, TRIAGE_PENDING } from '../sampleData.js';
import { Avatar, ChannelIcon, Empty, Grade, Modal, StatusPill, fmtMoney, useToast } from '../ui.jsx';
import { Bubble, GuardrailBanner, QuoteCard, ScreeningCard, Typing, UnderstandCard } from './Conversation.jsx';

/* ===== inbox.jsx ===== */
/* ============ 智能询盘 — 四桶结构 ============ */

/* ── 轻量对话生成（非主询盘） ── */
function lightThread(inq){
  const base=[{id:'l1',role:'customer',lang:'EN',time:inq.time,who:inq.contact,
    text:`Hi, this is ${inq.contact} from ${inq.company}. ${inq.title}. Could you advise on pricing and lead time?`,
    zh:`你好，我是 ${inq.company} 的 ${inq.contact}。${inq.title}。能否告知报价与交期？`}];
  if(inq.status==='screened'){
    base.push({id:'l2',role:'screening',grade:'C',time:inq.time,
      signals:[{label:'通用群发措辞，无具体规格/数量',ok:false},{label:'免费邮箱 + 多次群发特征',ok:false}],
      note:'综合评分 24/100 → 判定 C 级（疑似同行套价），已降级、未自动报价，保留备查。'});
    return base;
  }
  const aiText = inq.status==='deal'
      ? `Thank you! I've issued the PI for your order. We're delighted to move forward — welcome aboard 🎉`
      : inq.status==='followup'
      ? `Following up on my earlier message — happy to tailor a quote once you confirm quantity. No rush!`
      : `Thanks for reaching out! I've prepared the details you asked for below and I'm here for any questions.`;
  const aiZh = inq.status==='deal'
      ? `谢谢！我已为你的订单出具 PI，很高兴继续推进——欢迎合作 🎉`
      : inq.status==='followup'
      ? `跟进一下我之前的消息——你确认数量后我很乐意定制报价，不着急！`
      : `感谢联系！我已在下方准备好你需要的资料，有任何问题随时找我。`;
  base.push({id:'l2',role:'ai',lang:'EN',time:inq.time,text:aiText,zh:aiZh});
  return base;
}

/* ── 会话视图 ── */
function ConversationView({inq, onOpenProfile}){
  const isHero = inq.id==='inq-1';
  const [msgs,setMsgs]=useState(()=>isHero?THREAD:lightThread(inq));
  const [mode,setMode]=useState(inq.status==='human'?'human':'ai');
  const [resolved,setResolved]=useState(inq.status!=='guardrail');
  const [status,setStatus]=useState(inq.status);
  const [draft,setDraft]=useState('');
  const [typing,setTyping]=useState(false);
  const [editOpen,setEditOpen]=useState(false);
  const [done,setDone]=useState(inq.status==='deal');
  const [translate,setTranslate]=useState(true);
  const scrollRef=useRef(null);
  const toast=useToast();

  useEffect(()=>{
    setMsgs(isHero?THREAD:lightThread(inq)); setMode(inq.status==='human'?'human':'ai');
    setResolved(inq.status!=='guardrail'); setStatus(inq.status); setDone(inq.status==='deal'); setDraft('');
  },[inq.id]);

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[msgs,typing]);

  const append=(m)=>setMsgs(s=>[...s,{...m,id:'x'+Date.now()+Math.random()}]);
  const resolveGuard=(humanMode)=>{ setResolved(true); if(humanMode){setMode('human');setStatus('human');} };

  const approveSuggestion=()=>{
    setTyping(true);
    setTimeout(()=>{ setTyping(false);
      append({role:'ai',lang:'EN',time:'09:36',
        text:`Sanne, I can meet you at $168/set CIF Rotterdam for 300 sets — and I'll include cargo insurance at no extra cost. For terms: 70% before shipment, balance net-30 after arrival. This keeps us within a fair margin. Shall I update the PI?`,
        zh:`Sanne，300 套我可以给到 $168/套 CIF 鹿特丹，并免费附加货运保险。账期方面：发货前付 70%，到港后 30 天结清尾款。这样能保持在合理利润区间。需要我更新 PI 吗？`});
      resolveGuard(false); setStatus('ai'); toast('已按 AI 建议发送 · 守住底价 $168','ok');
    },1100);
  };
  const takeover=()=>{ resolveGuard(true); toast('你已接管该会话，AI 退居辅助','info'); };
  const giveBack=()=>{ setMode('ai'); setStatus('ai'); toast('已交还 AI 继续处理','info'); };
  const markDeal=()=>{ setStatus('deal'); setDone(true); setResolved(true);
    append({role:'ai',lang:'EN',time:'09:48',text:`Wonderful — PI confirmed! 🎉 We'll begin production scheduling and keep you posted on the timeline.`,
      zh:`太好了——PI 已确认！🎉 我们将开始排产，并随时同步交期进度。`});
    toast('🎉 已标记为成交，已沉淀成交话术','ok');
  };
  const sendDraft=()=>{ if(!draft.trim())return; append({role:'human',time:'now',text:draft}); setDraft(''); toast('已发送','ok'); };
  const sendEdited=(price)=>{
    setEditOpen(false);
    append({role:'human',lang:'EN',time:'09:37',
      text:`Hi Sanne — I can personally approve $${price}/set CIF Rotterdam at 300 sets, valid 7 days. That's our best given current shipping rates. Let's get this signed!`,
      zh:`Sanne 你好——300 套我可以亲自核准 $${price}/套 CIF 鹿特丹，有效期 7 天。这是当前海运价下我们的最优价，期待签约！`});
    resolveGuard(false); setStatus('human'); setMode('human');
    toast(`已发送人工核准价 $${price}/套`,'ok');
  };

  const statusForBar = done?'deal':status;
  return (
    <div className="col" style={{height:'100%',background:'#fff',minWidth:0}}>
      {/* 顶部操作条 */}
      <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border-2)',flex:'none'}}>
        <div className="row spread" style={{flexWrap:'wrap',gap:10}}>
          <div className="row gap3" style={{minWidth:0}}>
            <Avatar name={inq.contact} size={40}/>
            <div className="col" style={{minWidth:0}}>
              <div className="row gap2">
                <span className="h3 ellipsis">{inq.company}</span>
                <span className="flag">{inq.flag}</span>
                <Grade g={inq.grade} size={20}/>
              </div>
              <div className="row gap2 aux">
                <span>{inq.contact}</span><span>·</span>
                <ChannelIcon ch={inq.channel} size={16}/><span>{CHANNELS[inq.channel].name}</span>
                <span>·</span><span>{inq.country}</span>
              </div>
            </div>
          </div>
          <div className="row gap2">
            <button className="row gap2 clickable" onClick={()=>setTranslate(t=>!t)}
              style={{height:30,padding:'0 10px',borderRadius:7,border:`1px solid ${translate?'var(--primary)':'var(--border)'}`,
                background:translate?'var(--primary-tint)':'#fff',color:translate?'var(--primary)':'var(--text-2)',fontWeight:600,fontSize:12.5}}>
              <Icon name="language" size={15}/>自动翻译
              <span className={`switch ${translate?'on':''}`} style={{width:30,height:17,pointerEvents:'none'}}/>
            </button>
            {!done&&<button className="btn btn-green btn-sm" onClick={markDeal}><Icon name="checkCircle" size={15}/>标记成交</button>}
            {mode==='ai'
              ? <button className="btn btn-sec btn-sm" onClick={takeover}><Icon name="hand" size={15}/>接管</button>
              : <button className="btn btn-sec btn-sm" onClick={giveBack}><Icon name="bot" size={15}/>交还 AI</button>}
            <button className="btn btn-sec btn-sm" onClick={onOpenProfile}><Icon name="user" size={15}/>客户档案</button>
            <button className="btn-icon btn-ghost"><Icon name="more" size={18}/></button>
          </div>
        </div>
        <div className="row gap2" style={{marginTop:10}}>
          <StatusPill status={statusForBar}/>
          {statusForBar==='guardrail'&&!resolved&&<span className="aux" style={{color:'var(--red)'}}>· 自动发送已暂停，等待你的决定</span>}
          {mode==='human'&&statusForBar!=='deal'&&<span className="aux">· 你正在亲自回复，AI 提供草稿建议</span>}
          {statusForBar==='ai'&&<span className="aux">· 平均首响 8 秒 · 全程留痕可审计</span>}
          {translate&&<span className="aux" style={{color:'var(--tech-deep)'}}>· <Icon name="language" size={12} style={{verticalAlign:'-1px'}}/> 外文已自动译为中文，保留原文</span>}
        </div>
      </div>
      {/* 对话流 */}
      <div ref={scrollRef} className="scroll" style={{flex:1,minHeight:0,padding:'20px',background:'#fbfcfd'}}>
        <div className="col" style={{gap:16,maxWidth:760,margin:'0 auto'}}>
          <div className="row center"><span className="aux" style={{background:'#eef1f4',padding:'3px 12px',borderRadius:12}}>今天 · {inq.flag} {inq.country} 时区 09:02</span></div>
          {msgs.map(m=>{
            if(m.role==='screening') return <ScreeningCard key={m.id} m={m}/>;
            if(m.role==='understanding') return <UnderstandCard key={m.id} m={m}/>;
            if(m.role==='quote') return (
              <div key={m.id} className="row anim-up" style={{justifyContent:'flex-end'}}>
                <div style={{maxWidth:'72%'}}>
                  <div className="row gap1" style={{justifyContent:'flex-end',marginBottom:3}}>
                    <span className="badge badge-pri" style={{height:18,fontSize:11}}><Icon name="bot" size={11}/>AI 自动生成</span>
                  </div>
                  <QuoteCard q={QUOTES[m.quote]}/>
                  <div className="aux" style={{textAlign:'right',marginTop:3,fontSize:11}}>{m.time} · 已发送</div>
                </div>
              </div>
            );
            if(m.role==='guardrail') return <GuardrailBanner key={m.id} m={m} resolved={resolved}
              onApproveSuggestion={approveSuggestion} onEditQuote={()=>setEditOpen(true)} onTakeover={takeover}/>;
            return <Bubble key={m.id} m={{...m,who:inq.contact}} translate={translate}/>;
          })}
          {typing&&<Typing/>}
        </div>
      </div>
      {/* 底部输入区 */}
      <div style={{borderTop:'1px solid var(--border-2)',padding:'12px 20px',flex:'none',background:'#fff'}}>
        {mode==='ai'&&!done&&(
          <div className="row gap2" style={{marginBottom:8}}>
            <span className="pill pill-ai" style={{height:24,fontSize:11.5}}><Icon name="bot" size={12}/>AI 自主处理中</span>
            <span className="aux">如需亲自回复，点右上「接管」</span>
          </div>
        )}
        <div className="row gap2" style={{alignItems:'flex-end'}}>
          <button className="btn-icon btn-ghost" disabled={mode==='ai'&&!done}><Icon name="attach" size={18}/></button>
          <textarea className="input" rows={1}
            placeholder={mode==='human'?'输入回复… 客户母语为英文，AI 可帮你润色翻译':'AI 自主回复中 — 点「接管」后可在此输入'}
            value={draft} disabled={mode==='ai'&&!done} onChange={e=>setDraft(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendDraft();}}}
            style={{minHeight:40,maxHeight:120,opacity:(mode==='ai'&&!done)?.5:1}}/>
          {mode==='human'&&<button className="btn btn-sec btn-sm"><Icon name="language" size={14}/>AI 润色</button>}
          <button className="btn btn-pri" onClick={sendDraft} disabled={(mode==='ai'&&!done)||!draft.trim()}>
            <Icon name="send" size={16}/>发送
          </button>
        </div>
      </div>
      <EditQuoteModal open={editOpen} onClose={()=>setEditOpen(false)} q={QUOTES.Q1} onSend={sendEdited}/>
    </div>
  );
}

/* ── 修改报价弹窗 ── */
function EditQuoteModal({open,onClose,q,onSend}){
  const [price,setPrice]=useState(q.floor);
  useEffect(()=>{if(open)setPrice(q.floor);},[open]);
  const below=price<q.floor;
  return (
    <Modal open={open} onClose={onClose} width={420}>
      <div style={{padding:'18px 20px'}}>
        <div className="row spread" style={{marginBottom:4}}>
          <span className="h3">修改报价 · 人工核准</span>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <div className="aux" style={{marginBottom:16}}>{q.product} · 300 套 · CIF 鹿特丹</div>
        <label className="field-label">核准单价（USD / 套）</label>
        <div className="row gap2">
          <input className="input num" type="number" value={price} onChange={e=>setPrice(+e.target.value)}
            style={{fontSize:18,fontWeight:600,borderColor:below?'var(--red)':'var(--border)'}}/>
          <span className="aux" style={{whiteSpace:'nowrap'}}>底价红线 {fmtMoney(q.floor)}</span>
        </div>
        {below
          ? <div className="row gap2" style={{marginTop:10,padding:'9px 12px',background:'var(--red-light)',borderRadius:8}}>
              <Icon name="alert" size={15} style={{color:'var(--red)'}}/><span className="aux" style={{color:'#b53d39',fontWeight:600}}>低于底价 {fmtMoney(q.floor)}，不可发送（需更高权限审批）</span></div>
          : <div className="row gap2" style={{marginTop:10,padding:'9px 12px',background:'var(--green-light)',borderRadius:8}}>
              <Icon name="check" size={15} style={{color:'var(--green)'}}/><span className="aux" style={{color:'#1f7568',fontWeight:600}}>在底价之上，毛利约 {Math.round((price-149)/price*100)}% · 可发送</span></div>}
        <div className="row gap2" style={{marginTop:18,justifyContent:'flex-end'}}>
          <button className="btn btn-sec btn-sm" onClick={onClose}>取消</button>
          <button className="btn btn-pri btn-sm" disabled={below} onClick={()=>onSend(price)}><Icon name="send" size={14}/>核准并发送</button>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   桶 1：收件箱
══════════════════════════════════════════ */
function InboxList({active, onPick, filter, setFilter, q, setQ}){
  const filters=[['all','全部'],['A','A 级'],['guardrail','待处理'],['ai','AI 中'],['deal','已成交']];
  let list=INQUIRIES.filter(i=>{
    if(filter==='A') return i.grade==='A';
    if(filter==='guardrail') return i.status==='guardrail'||i.status==='human';
    if(filter==='ai') return i.status==='ai'||i.status==='followup';
    if(filter==='deal') return i.status==='deal';
    return true;
  });
  if(q) list=list.filter(i=>(i.company+i.title+i.contact).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="col" style={{width:340,borderRight:'1px solid var(--border-2)',background:'#fff',flex:'none',height:'100%'}}>
      <div style={{padding:'14px 16px 10px',flex:'none'}}>
        <div style={{position:'relative',marginBottom:10}}>
          <span style={{position:'absolute',left:10,top:9,color:'var(--text-3)'}}><Icon name="search" size={16}/></span>
          <input className="input" placeholder="搜索客户 / 公司 / 关键词" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32,height:34}}/>
        </div>
        <div className="row gap1" style={{flexWrap:'wrap'}}>
          {filters.map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} className="badge clickable"
              style={{height:26,padding:'0 11px',background:filter===k?'var(--primary)':'#f1f4f7',
                color:filter===k?'#fff':'var(--text-2)',fontWeight:600}}>{l}</button>
          ))}
        </div>
      </div>
      <div className="scroll" style={{flex:1}}>
        {list.map(i=><InboxRow key={i.id} i={i} active={i.id===active} onClick={()=>onPick(i)}/>)}
        {list.length===0&&<Empty icon="search" title="没有匹配的询盘" desc="试试换个筛选或关键词"/>}
      </div>
    </div>
  );
}

function InboxRow({i, active, onClick}){
  const m=STATUS_META[i.status];
  const isReturning=(i.tags||[]).includes('老客户');
  return (
    <div onClick={onClick} className="clickable" style={{padding:'12px 16px',borderBottom:'1px solid var(--border-2)',
      background:active?'var(--primary-tint)':'#fff',
      borderLeft:active?'3px solid var(--primary)':'3px solid transparent',transition:'background .12s'}}>
      <div className="row spread" style={{marginBottom:4}}>
        <div className="row gap2" style={{minWidth:0}}>
          <Grade g={i.grade} size={18}/>
          <span className="flag">{i.flag}</span>
          <span style={{fontWeight:600,fontSize:13.5}} className="ellipsis">{i.company}</span>
          {!isReturning
            ? <span style={{flex:'none',fontSize:10.5,fontWeight:700,lineHeight:1.6,padding:'0 6px',borderRadius:5,
                color:'var(--primary)',background:'var(--primary-light)'}}>新客户</span>
            : <span style={{flex:'none',fontSize:10.5,fontWeight:500,color:'var(--text-3)'}}>老客户</span>}
          {i.pinned&&<Icon name="pin" size={12} style={{color:'var(--primary)',flex:'none'}}/>}
        </div>
        <div className="row gap2" style={{flex:'none',alignItems:'center'}}>
          <ChannelIcon ch={i.channel} size={13}/>
          <span className="aux" style={{fontSize:11}}>{i.time}</span>
        </div>
      </div>
      <div className="aux ellipsis" style={{marginBottom:6,color:'var(--text)'}}>{i.title}</div>
      <div className="aux ellipsis" style={{marginBottom:8,fontSize:12}}>{i.snippet}</div>
      <div className="row spread">
        <span className={`pill ${m.pill}`} style={{height:21,fontSize:11,padding:'0 7px'}}>
          <Icon name={m.icon} size={11}/>{m.label}
        </span>
        {i.value>0&&<span className="num aux" style={{fontWeight:600,color:'var(--text-2)'}}>{fmtMoney(i.value)}</span>}
        {i.unread&&<span className="dot" style={{background:'var(--red)',width:7,height:7}}/>}
      </div>
    </div>
  );
}

function InboxBucket({onOpenProfile}){
  const [active,setActive]=useState(INQUIRIES[0]);
  const [filter,setFilter]=useState('all');
  const [q,setQ]=useState('');
  return (
    <div style={{display:'flex',alignItems:'stretch',flex:1,minHeight:0,overflow:'hidden'}}>
      <InboxList active={active.id} onPick={setActive} filter={filter} setFilter={setFilter} q={q} setQ={setQ}/>
      <ConversationView inq={active} onOpenProfile={()=>onOpenProfile(active)}/>
    </div>
  );
}

/* ══════════════════════════════════════════
   桶 2：待确认
══════════════════════════════════════════ */
function ConfidencePill({score}){
  const color = score>=80?'var(--green)':score>=60?'#CA8A04':'var(--text-3)';
  const bg    = score>=80?'rgba(43,166,138,.1)':score>=60?'rgba(202,138,4,.1)':'var(--bg-2,#f4f5f8)';
  return (
    <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,color,background:bg,flex:'none'}}>
      {score}% 置信
    </span>
  );
}

function PendingItem({item, onConfirm, onArchive, onAssign, selected, onSelect}){
  const toast=useToast();
  const [expanded,setExpanded]=useState(false);
  return (
    <div className="card anim-up" style={{marginBottom:10,border:'1px solid var(--border)',padding:0,overflow:'hidden'}}>
      {/* 主行 */}
      <div style={{padding:'14px 16px',cursor:'pointer'}} onClick={()=>setExpanded(e=>!e)}>
        <div className="row gap3" style={{alignItems:'flex-start'}}>
          <input type="checkbox" checked={selected} onClick={e=>e.stopPropagation()} onChange={onSelect}
            style={{marginTop:3,flex:'none',accentColor:'var(--primary)'}}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="row spread" style={{marginBottom:4}}>
              <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                <span style={{fontWeight:700,fontSize:13.5}}>{item.from}</span>
                <span className="flag">{item.flag}</span>
                <ConfidencePill score={item.triage.confidence}/>
                <span style={{fontSize:11,padding:'2px 7px',borderRadius:5,background:'var(--primary-tint)',color:'var(--primary)',fontWeight:600}}>
                  {item.triage.category}
                </span>
              </div>
              <div className="row gap2" style={{flex:'none'}}>
                <span className="aux" style={{fontSize:11}}>{item.time}</span>
                <Icon name={expanded?'chevD':'chevR'} size={15} style={{color:'var(--text-3)'}}/>
              </div>
            </div>
            <div style={{fontWeight:600,fontSize:13,marginBottom:3,color:'var(--text)'}}>{item.subject}</div>
            <div className="aux ellipsis" style={{fontSize:12}}>{item.snippet}</div>
          </div>
        </div>
      </div>

      {/* 展开：AI 判断详情 */}
      {expanded&&(
        <div style={{padding:'0 16px 14px 44px',borderTop:'1px solid var(--border-2)',paddingTop:12}}>
          {/* 信号列表 */}
          <div className="col" style={{gap:5,marginBottom:12}}>
            <div style={{fontSize:11.5,fontWeight:700,color:'var(--text-3)',marginBottom:2}}>AI 判断信号</div>
            {item.triage.signals.map((s,i)=>(
              <div key={i} className="row gap2" style={{alignItems:'flex-start'}}>
                <Icon name={s.ok?'check':'x'} size={13} style={{color:s.ok?'var(--green)':'var(--red)',flex:'none',marginTop:1}}/>
                <span style={{fontSize:12.5,color:'var(--text-2)'}}>{s.label}</span>
              </div>
            ))}
          </div>
          {/* AI 理由 */}
          <div style={{padding:'10px 12px',borderRadius:8,background:'var(--bg-2,#f4f5f8)',fontSize:12.5,color:'var(--text-2)',marginBottom:12,lineHeight:1.5}}>
            <span style={{fontWeight:600,color:'var(--text-3)',marginRight:4}}>AI 说明：</span>{item.triage.reason}
          </div>
          {/* 操作 */}
          <div className="row gap2">
            <button className="btn btn-sm btn-pri" onClick={()=>{onConfirm(item.id); toast('已确认为询盘，正在进入收件箱','ok');}}>
              <Icon name="check" size={13}/>确认为询盘
            </button>
            <button className="btn btn-sm btn-sec" onClick={()=>{onArchive(item.id); toast('已归档为噪音','info');}}>
              <Icon name="inbox" size={13}/>忽略·归档
            </button>
            <button className="btn btn-sm btn-sec" onClick={()=>{onAssign(item.id); toast('已关联到老客户档案','info');}}>
              <Icon name="user" size={13}/>归到客户
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PendingBucket(){
  const toast=useToast();
  const [items,setItems]=useState(TRIAGE_PENDING);
  const [selected,setSelected]=useState(new Set());

  const remove=(id)=>setItems(s=>s.filter(i=>i.id!==id));
  const toggleSel=(id)=>setSelected(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const selAll=()=>setSelected(items.length===selected.size?new Set():new Set(items.map(i=>i.id)));
  const batchConfirm=()=>{ setItems(s=>s.filter(i=>!selected.has(i.id))); setSelected(new Set()); toast(`已批量确认 ${selected.size} 条为询盘`,'ok'); };
  const batchArchive=()=>{ setItems(s=>s.filter(i=>!selected.has(i.id))); setSelected(new Set()); toast(`已批量归档 ${selected.size} 条`,'info'); };

  return (
    <div className="col" style={{flex:1,minHeight:0,overflow:'hidden'}}>
      {/* 顶部操作栏 */}
      <div style={{padding:'14px 24px',borderBottom:'1px solid var(--border-2)',flex:'none',background:'#fff'}}>
        <div className="row spread" style={{alignItems:'center'}}>
          <div className="row gap3">
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" checked={items.length>0&&selected.size===items.length}
                onChange={selAll} style={{accentColor:'var(--primary)'}}/>
              <span style={{fontSize:13,color:'var(--text-2)'}}>全选</span>
            </div>
            {selected.size>0&&(
              <div className="row gap2">
                <span style={{fontSize:12.5,color:'var(--text-3)'}}>已选 {selected.size} 条</span>
                <button className="btn btn-sm btn-pri" onClick={batchConfirm}><Icon name="check" size={12}/>批量确认</button>
                <button className="btn btn-sm btn-sec" onClick={batchArchive}><Icon name="inbox" size={12}/>批量归档</button>
              </div>
            )}
          </div>
          <div style={{fontSize:12.5,color:'var(--text-3)'}}>
            <Icon name="bot" size={13} style={{verticalAlign:'-2px',marginRight:4,color:'var(--primary)'}}/>
            AI 分诊拿不准时进此桶，人工一键判定
          </div>
        </div>
      </div>

      {/* 条目列表 */}
      <div className="scroll" style={{flex:1,padding:'20px 24px'}}>
        {items.length===0?(
          <Empty icon="check" title="待确认队列已清空" desc="所有入站都已判定完毕，你做到了！"/>
        ):(
          items.map(item=>(
            <PendingItem key={item.id} item={item} selected={selected.has(item.id)}
              onSelect={()=>toggleSel(item.id)}
              onConfirm={remove} onArchive={remove} onAssign={remove}/>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   桶 3：老客户往来
══════════════════════════════════════════ */
function OldCustomerBucket({onOpenProfile}){
  return (
    <div className="col" style={{flex:1,minHeight:0,overflow:'hidden'}}>
      <div className="scroll" style={{flex:1,padding:'20px 24px'}}>
        {OLD_CUSTOMERS.length===0?(
          <Empty icon="users" title="暂无老客户往来" desc="命中已知客户档案的入站会归入此处"/>
        ):(
          OLD_CUSTOMERS.map(oc=>(
            <div key={oc.id} className="card card-pad anim-up" style={{marginBottom:12}}>
              <div className="row gap3" style={{marginBottom:12}}>
                <Avatar name={oc.contact} size={44}/>
                <div className="col" style={{flex:1,minWidth:0,gap:2}}>
                  <div className="row gap2">
                    <span style={{fontWeight:700,fontSize:14}}>{oc.company}</span>
                    <span className="flag">{oc.flag}</span>
                    {oc.unread&&<span className="dot" style={{background:'var(--red)',width:7,height:7}}/>}
                  </div>
                  <div className="aux">{oc.contact} · {oc.country} · <ChannelIcon ch={oc.channel} size={13}/></div>
                  <div style={{fontSize:11.5,color:'var(--text-3)'}}>{oc.time}</div>
                </div>
                <div className="row gap2" style={{flex:'none'}}>
                  <button className="btn btn-sm btn-sec" onClick={()=>onOpenProfile(oc)}>
                    <Icon name="user" size={13}/>客户档案
                  </button>
                  <button className="btn btn-sm btn-pri">
                    <Icon name="message" size={13}/>回复
                  </button>
                </div>
              </div>
              {/* 最新消息预览 */}
              <div style={{padding:'10px 12px',borderRadius:8,background:'var(--bg-2,#f4f5f8)',marginBottom:10}}>
                <div style={{fontSize:12.5,color:'var(--text-2)',lineHeight:1.5,marginBottom:4}}>{oc.lastMsgZh}</div>
                <div className="aux" style={{fontSize:11.5,color:'var(--text-3)'}}>{oc.lastMsg}</div>
              </div>
              {/* 历史订单 */}
              <div className="row gap2" style={{flexWrap:'wrap'}}>
                <span style={{fontSize:12,color:'var(--text-3)'}}>历史订单：</span>
                {oc.orderHistory.map((o,i)=>(
                  <span key={i} style={{fontSize:12,padding:'2px 8px',borderRadius:5,background:'rgba(43,166,138,.08)',color:'var(--green)',fontWeight:600}}>
                    {o.date} · {fmtMoney(o.value)} · {o.desc}
                  </span>
                ))}
                <span style={{fontSize:12,color:'var(--text-3)'}}>· {oc.note}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   桶 4：已归档
══════════════════════════════════════════ */
const NOISE_TYPE_COLORS = {
  '平台通知':'rgba(76,79,184,.1)', '推销':'rgba(224,82,82,.08)',
  '垃圾邮件':'rgba(224,82,82,.12)', '自动回复':'var(--bg-2,#f4f5f8)', 'Newsletter':'var(--bg-2,#f4f5f8)',
};
const NOISE_TYPE_TEXT = {
  '平台通知':'var(--primary)', '推销':'var(--red)', '垃圾邮件':'var(--red)',
  '自动回复':'var(--text-3)', 'Newsletter':'var(--text-3)',
};

function ArchivedBucket(){
  const toast=useToast();
  const [items,setItems]=useState(ARCHIVED_ITEMS);
  const [q,setQ]=useState('');

  const filtered = q ? items.filter(i=>(i.from+i.subject).toLowerCase().includes(q.toLowerCase())) : items;
  const restore=(id)=>{ setItems(s=>s.filter(i=>i.id!==id)); toast('已移至待确认队列','info'); };

  return (
    <div className="col" style={{flex:1,minHeight:0,overflow:'hidden'}}>
      {/* 搜索栏 */}
      <div style={{padding:'14px 24px',borderBottom:'1px solid var(--border-2)',flex:'none',background:'#fff'}}>
        <div className="row gap3" style={{alignItems:'center'}}>
          <div style={{position:'relative',flex:1,maxWidth:360}}>
            <span style={{position:'absolute',left:10,top:9,color:'var(--text-3)'}}><Icon name="search" size={15}/></span>
            <input className="input" placeholder="搜索发件人 / 标题" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32,height:34}}/>
          </div>
          <span style={{fontSize:12.5,color:'var(--text-3)'}}>噪音由 AI 分诊自动归入，可随时恢复为待确认</span>
        </div>
      </div>
      {/* 条目列表 */}
      <div className="scroll" style={{flex:1,padding:'16px 24px'}}>
        {filtered.length===0?<Empty icon="inbox" title="已归档为空" desc="AI 判定为噪音的入站会显示在这里"/>:(
          filtered.map(item=>(
            <div key={item.id} className="row gap3" style={{padding:'12px 14px',marginBottom:8,
              borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',alignItems:'center'}}>
              <div style={{flex:'none'}}>
                <span style={{fontSize:10.5,fontWeight:700,padding:'2px 7px',borderRadius:5,
                  background:NOISE_TYPE_COLORS[item.type]||'var(--bg-2)',
                  color:NOISE_TYPE_TEXT[item.type]||'var(--text-3)'}}>
                  {item.type}
                </span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:2}} className="ellipsis">{item.subject}</div>
                <div className="aux ellipsis" style={{fontSize:12}}>{item.from}</div>
              </div>
              <span className="aux" style={{fontSize:11,flex:'none'}}>{item.time}</span>
              <button className="btn btn-sm btn-sec" onClick={()=>restore(item.id)} style={{flex:'none'}}>
                恢复
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   顶部四桶 Tab 栏
══════════════════════════════════════════ */
function BucketTabs({active, onChange}){
  const tabs=[
    {key:'inbox',    label:'收件箱',     count:INQUIRIES.filter(i=>i.unread).length,  countColor:'var(--red)'},
    {key:'pending',  label:'待确认',     count:TRIAGE_PENDING.length,                 countColor:'#CA8A04'},
    {key:'old',      label:'老客户往来', count:OLD_CUSTOMERS.filter(o=>o.unread).length, countColor:'var(--primary)'},
    {key:'archived', label:'已归档',     count:null},
  ];
  return (
    <div className="row gap1" style={{flex:1,minWidth:0}}>
      {tabs.map(t=>(
        <button key={t.key} onClick={()=>onChange(t.key)} style={{
          padding:'0 4px',marginRight:14,border:'none',background:'none',cursor:'pointer',
          fontSize:13.5,fontWeight:600,height:'100%',
          color:active===t.key?'var(--primary)':'var(--text-3)',
          borderBottom:active===t.key?'2px solid var(--primary)':'2px solid transparent',
          display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap',
        }}>
          {t.label}
          {t.count>0&&(
            <span style={{fontSize:11,fontWeight:700,padding:'1px 6px',borderRadius:8,lineHeight:1.4,
              background:t.countColor+'18',color:t.countColor}}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   智能询盘页面（根）
══════════════════════════════════════════ */
function InboxPage({onOpenProfile}){
  const [bucket,setBucket]=useState('inbox');
  return (
    <div className="col" style={{height:'100%',overflow:'hidden'}}>
      {/* 统一页头：eyebrow + h1 + muted（与其它模块一致） */}
      <div className="row spread" style={{padding:'16px 24px 12px',background:'#fff',borderBottom:'1px solid var(--border-2)',flex:'none',alignItems:'flex-end',gap:16}}>
        <div className="col" style={{minWidth:0}}>
          <span className="eyebrow" style={{color:'var(--tech-deep)'}}>Inbox · 询盘前台</span>
          <span className="h1">智能询盘</span>
          <span className="muted" style={{marginTop:4}}>多渠道询盘 · AI 分诊 · 甄别 · 应答 · 护栏一体</span>
        </div>
        <div className="row gap2" style={{flex:'none',alignItems:'center'}}>
          <span style={{fontSize:12,fontWeight:600,color:'var(--green)',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>
            实时接收中
          </span>
          <button className="btn btn-sec btn-sm"><Icon name="sliders" size={13}/>分诊设置</button>
        </div>
      </div>

      {/* tab 条 */}
      <div style={{height:44,padding:'0 24px',background:'#fff',borderBottom:'1px solid var(--border-2)',flex:'none',display:'flex',alignItems:'stretch'}}>
        <BucketTabs active={bucket} onChange={setBucket}/>
      </div>

      {/* 桶内容 */}
      {bucket==='inbox'    && <InboxBucket    onOpenProfile={onOpenProfile}/>}
      {bucket==='pending'  && <PendingBucket/>}
      {bucket==='old'      && <OldCustomerBucket onOpenProfile={onOpenProfile}/>}
      {bucket==='archived' && <ArchivedBucket/>}
    </div>
  );
}

export { ConversationView, InboxPage };
