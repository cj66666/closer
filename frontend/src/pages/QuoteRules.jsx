import { useState as useStateQR, useEffect as useEffectQR } from 'react';
import { Icon } from '../icons.jsx';
import { QUOTE_RECORDS, QUOTE_WORKBENCH, STATUS_META } from '../sampleData.js';
import { Avatar, ChannelIcon, Empty, Grade, SectionTitle, useToast, Modal } from '../ui.jsx';

/* ===== quoterules.jsx ===== */
/* ============ 报价准备 / 人工报价 ============ */

const QR_STATUS = {
  negotiating:{label:'议价中',    color:'var(--orange)',  bg:'rgba(234,127,36,.1)'},
  sent:       {label:'已发送',    color:'var(--primary)', bg:'var(--primary-tint)'},
  pi_pending: {label:'PI 待审批', color:'#CA8A04',        bg:'rgba(202,138,4,.1)'},
  deal:       {label:'已成交',    color:'var(--green)',   bg:'var(--green-light)'},
  expired:    {label:'已失效',    color:'var(--text-3)',  bg:'#f4f5f8'},
};

/* ── 价格档位卡片 ── */
function PriceOptionCard({opt, floor, selected, onSelect}){
  const ok = opt.price >= floor;
  return (
    <div onClick={()=>ok&&onSelect(opt.key)} style={{
      flex:1, padding:'14px 16px', borderRadius:10, cursor:ok?'pointer':'not-allowed',
      border:`2px solid ${selected?'var(--primary)':opt.recommended?'rgba(43,166,138,.35)':'var(--border)'}`,
      background:selected?'var(--primary-tint)':opt.recommended?'rgba(43,166,138,.03)':'#fff',
      opacity:ok?1:.4, position:'relative', transition:'border .15s,background .15s',
    }}>
      {opt.recommended&&(
        <span style={{position:'absolute',top:-11,left:'50%',transform:'translateX(-50%)',
          background:'var(--green)',color:'#fff',fontSize:10,fontWeight:700,
          padding:'2px 9px',borderRadius:8,whiteSpace:'nowrap'}}>建议档</span>
      )}
      <div style={{fontWeight:700,fontSize:12.5,color:'var(--text-3)',marginBottom:8}}>{opt.label}</div>
      <div style={{fontSize:28,fontWeight:800,color:selected?'var(--primary)':'var(--text)',lineHeight:1}}>${opt.price}</div>
      <div className="aux" style={{marginTop:2,marginBottom:10,fontSize:11}}>/套</div>
      <div className="col" style={{gap:5}}>
        {[['毛利率', opt.margin+'%', opt.margin>=15?'var(--green)':opt.margin>=10?'var(--orange)':'var(--red)'],
          ['赢率',   opt.winRate+'%', 'var(--text)'],
          ['期望毛利', opt.expectedMargin+'%', 'var(--primary)']
        ].map(([k,v,c])=>(
          <div key={k} className="row spread" style={{fontSize:12}}>
            <span className="aux">{k}</span>
            <span style={{fontWeight:700,color:c}}>{v}</span>
          </div>
        ))}
      </div>
      {!ok&&<div style={{marginTop:8,fontSize:11,color:'var(--red)',fontWeight:600}}>低于软底价 · 不可发送</div>}
      {selected&&ok&&(
        <div className="row gap1" style={{marginTop:10,justifyContent:'center'}}>
          <Icon name="check" size={12} style={{color:'var(--primary)'}}/>
          <span style={{fontSize:11,color:'var(--primary)',fontWeight:600}}>已选定</span>
        </div>
      )}
    </div>
  );
}

function approvalToneMeta(tone){
  if(tone==='blocked') return {label:'阻塞', badge:'badge-red', icon:'alert'};
  if(tone==='review') return {label:'待审批', badge:'badge-pri', icon:'clock'};
  if(tone==='ready') return {label:'已具备', badge:'badge-green', icon:'checkCircle'};
  return {label:'待补', badge:'badge-grey', icon:'doc'};
}

function QuoteApprovalPanel({item, amount, margin, blocked=false, belowFloor=0, selectedPrice, sourceLabel='规则建议价'}){
  const riskyConcessions=(item.concessions||[]).filter(c=>!c.safe);
  const needsManager=blocked || belowFloor>0 || margin<15 || riskyConcessions.length>0 || item.status==='manual_quote';
  const steps=[
    {
      key:'scope',
      title:'需求完整性',
      tone:item.kind==='rfq'?'ready':'review',
      owner:item.owner||'业务员',
      detail:item.kind==='rfq'
        ? `已解析 ${item.lines?.length||0} 个产品行，仍需人工确认规格、包装和替代品。`
        : `已识别产品、数量和 ${item.incoterm}，付款偏好、交期承诺和最终配置需人工确认。`,
    },
    {
      key:'price',
      title:'价格与毛利护栏',
      tone:blocked?'blocked':needsManager?'review':'ready',
      owner:'销售主管',
      detail:blocked
        ? `${belowFloor} 行低于软底价，整单不能外发，先改价或走主管复核。`
        : `${sourceLabel} ${selectedPrice?`$${selectedPrice}/套`:fmtUsd(amount)}，综合毛利 ${Number.isFinite(margin)?margin.toFixed(1):'--'}%。`,
    },
    {
      key:'terms',
      title:'账期 / 合同 / 交期',
      tone:riskyConcessions.length>0?'blocked':'review',
      owner:'负责人 + 老板',
      detail:riskyConcessions.length>0
        ? riskyConcessions.map(c=>`${c.type} ${c.value}`).join(' / ') + ' 触发红线，不能由 AI 承诺。'
        : '任何价格、交期、账期、合同条款必须由业务员确认后写入 PI。',
    },
    {
      key:'send',
      title:'发送前审批留痕',
      tone:'review',
      owner:'报价负责人',
      detail:'报价单和 PI 先进入审批队列；审批通过后仍由负责人确认发送，不自动外发。',
    },
  ];
  const metrics=[
    {label:'报价金额', value:fmtUsd(amount||0)},
    {label:'毛利', value:Number.isFinite(margin)?`${margin.toFixed(1)}%`:'待计算'},
    {label:'审批路径', value:needsManager?'主管复核':'负责人确认'},
    {label:'发送状态', value:'禁止自动外发'},
  ];
  return (
    <div className="quote-approval-panel">
      <div className="quote-approval-head">
        <div>
          <span className="field-label">报价审批路径</span>
          <h3>先准备材料，再由人确认价格、条款和发送</h3>
          <p>成熟 CPQ 会把折扣、账期、SKU、金额和签署方式作为审批条件；这里用同样逻辑约束外贸报价。</p>
        </div>
        <span className={`badge ${needsManager?'badge-red':'badge-pri'}`}>{needsManager?'需要审批':'等待确认'}</span>
      </div>
      <div className="quote-approval-metrics">
        {metrics.map(metric=>(
          <div key={metric.label}>
            <span>{metric.label}</span>
            <b>{metric.value}</b>
          </div>
        ))}
      </div>
      <div className="quote-approval-steps">
        {steps.map(step=>{
          const meta=approvalToneMeta(step.tone);
          return (
            <div key={step.key} className={`quote-approval-step ${step.tone}`}>
              <div className="row spread" style={{gap:8}}>
                <span className="row gap2"><Icon name={meta.icon} size={14}/><b>{step.title}</b></span>
                <span className={`badge ${meta.badge}`}>{meta.label}</span>
              </div>
              <p>{step.detail}</p>
              <small>{step.owner}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 议价让步阶梯 ── */
function ConcessionLadder({concessions}){
  const [open,setOpen]=useStateQR(false);
  return (
    <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
      <div className="row spread" onClick={()=>setOpen(o=>!o)}
        style={{padding:'12px 16px',cursor:'pointer',background:'#fff'}}>
        <div className="row gap2">
          <Icon name="layers" size={14} style={{color:'var(--primary)'}}/>
          <span style={{fontWeight:600,fontSize:13}}>议价让步阶梯</span>
          <span className="aux" style={{fontSize:12}}>先让什么、再让价 · 共 {concessions.length} 步</span>
        </div>
        <Icon name={open?'chevD':'chevR'} size={14} style={{color:'var(--text-3)'}}/>
      </div>
      {open&&(
        <div style={{background:'#fafbfc',borderTop:'1px solid var(--border-2)',padding:'12px 16px'}}>
          <div className="col" style={{gap:10}}>
            {concessions.map((c,i)=>(
              <div key={i} className="row gap3" style={{alignItems:'flex-start'}}>
                <span style={{width:22,height:22,borderRadius:'50%',flex:'none',
                  background:c.safe?'var(--primary-tint)':'rgba(224,82,82,.1)',
                  color:c.safe?'var(--primary)':'var(--red)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>
                  {c.rank}
                </span>
                <div style={{flex:1}}>
                  <div className="row gap2" style={{marginBottom:3,flexWrap:'wrap'}}>
                    <span style={{fontWeight:700,fontSize:13}}>{c.type}</span>
                    <span style={{fontSize:11,padding:'1px 6px',borderRadius:5,fontWeight:600,
                      background:c.safe?'rgba(43,166,138,.1)':'rgba(224,82,82,.1)',
                      color:c.safe?'var(--green)':'var(--red)'}}>{c.value}</span>
                    {!c.safe&&<span style={{fontSize:11,color:'var(--red)',fontWeight:600}}>⚠ 触红线转人工</span>}
                  </div>
                  <div className="aux" style={{fontSize:12.5}}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 右侧：报价准备面板 ── */
function SmartQuotePanel({item}){
  const toast=useToast();
  const [selected,setSelected]=useStateQR(item.options.find(o=>o.recommended)?.key);
  const [showPI,setShowPI]=useStateQR(false);
  const [piSent,setPiSent]=useStateQR(false);
  const opt=item.options.find(o=>o.key===selected);

  useEffectQR(()=>{
    setSelected(item.options.find(o=>o.recommended)?.key);
    setShowPI(false); setPiSent(false);
  },[item.id]);

  return (
    <div className="col scroll quote-detail-scroll">

      {/* 询盘摘要 */}
      <div className="card card-pad">
        <div className="row gap3" style={{marginBottom:10,flexWrap:'wrap'}}>
          <Avatar name={item.contact} size={40}/>
          <div className="col" style={{flex:1,gap:2}}>
            <div className="row gap2">
              <span style={{fontWeight:700,fontSize:14}}>{item.company}</span>
              <span className="flag">{item.flag}</span>
              <Grade g={item.grade} size={18}/>
            </div>
            <div className="aux row gap2">
              <span>{item.contact}</span><span>·</span><span>{item.country}</span>
              <span>·</span><ChannelIcon ch={item.channel} size={13}/>
            </div>
          </div>
          <span className={`pill ${STATUS_META[item.status]?.pill||'pill-ai'}`} style={{height:22,fontSize:11,flex:'none'}}>
            <Icon name={STATUS_META[item.status]?.icon||'bot'} size={11}/>
            {STATUS_META[item.status]?.label}
          </span>
        </div>
        <div style={{padding:'10px 12px',borderRadius:8,background:'var(--bg-2,#f4f5f8)'}}>
          <div className="row gap4" style={{flexWrap:'wrap',gap:20}}>
            {[
              ['产品 / SKU', `${item.product}`, item.sku],
              ['询盘数量',   `${item.qty} 套`, null],
              ['贸易条款',   item.incoterm, null],
              ['成本基线',   `$${item.base}/套`, `成本 $${item.cost} + 物流 $${item.logistics}`],
            ].map(([k,v,sub])=>(
              <div key={k} className="col" style={{gap:1}}>
                <span className="aux" style={{fontSize:11}}>{k}</span>
                <span style={{fontWeight:600,fontSize:13}}>{v}</span>
                {sub&&<span className="aux" style={{fontSize:11}}>{sub}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 三档报价建议 */}
      <div className="card card-pad">
        <div className="row gap2" style={{marginBottom:14}}>
          <Icon name="rules" size={14} style={{color:'var(--primary)'}}/>
          <span style={{fontWeight:700,fontSize:13.5}}>人工报价准备建议</span>
          <span className="aux" style={{fontSize:12}}>· 系统只整理依据，最终由业务员判断</span>
          <span style={{marginLeft:'auto',fontSize:11,padding:'2px 7px',borderRadius:5,
            background:'rgba(43,166,138,.1)',color:'var(--green)',fontWeight:600}}>
            软底价 ${item.floor}/套
          </span>
        </div>
        <div className="quote-price-options">
          {item.options.map(o=>(
            <PriceOptionCard key={o.key} opt={o} floor={item.floor} selected={selected===o.key} onSelect={setSelected}/>
          ))}
        </div>
        {opt&&(
          <div style={{padding:'10px 14px',borderRadius:8,
            background:'var(--primary-tint)',border:'1px solid var(--primary-light)'}}>
            <div className="row spread">
              <span className="aux">
                当前选定 <b style={{color:'var(--primary)'}}>{opt.label}档 ${opt.price}/套</b> × {item.qty} 套 =
              </span>
              <span style={{fontWeight:700,color:'var(--primary)',fontSize:15}}>
                ${(opt.price*item.qty).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <QuoteApprovalPanel
        item={item}
        amount={opt?opt.price*item.qty:0}
        margin={opt?.margin ?? 0}
        selectedPrice={opt?.price}
        sourceLabel="当前选定价"
      />

      {/* 报价准备说明 + 买家信号 */}
      <div className="card card-pad">
        <div className="row gap2" style={{marginBottom:10}}>
          <Icon name="doc" size={13} style={{color:'var(--tech-deep)'}}/>
          <span style={{fontWeight:700,fontSize:13}}>报价准备说明</span>
          <span className="aux" style={{fontSize:11,marginLeft:'auto'}}>可解释 · 有依据</span>
        </div>
        <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.7,marginBottom:14}}>{item.reasoning}</div>
        <div style={{fontSize:11.5,fontWeight:700,color:'var(--text-3)',marginBottom:6}}>买家信号</div>
        <div className="col" style={{gap:5}}>
          {item.buyerSignals.map((s,i)=>(
            <div key={i} className="row gap2" style={{alignItems:'flex-start'}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'var(--primary)',
                flex:'none',marginTop:6}}/>
              <span style={{fontSize:12.5,color:'var(--text-2)'}}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 议价让步阶梯 */}
      <ConcessionLadder concessions={item.concessions}/>

      {/* 硬底价护栏说明 */}
      <div style={{padding:'10px 14px',borderRadius:8,border:'1px solid rgba(139,0,0,.25)',
        background:'#fff5f5',display:'flex',gap:10,alignItems:'flex-start'}}>
        <Icon name="shield" size={14} style={{color:'#8b0000',flex:'none',marginTop:1}}/>
        <span style={{fontSize:12.5,color:'#8b0000'}}>
          <b>硬底价 ${item.hardMin}/套</b>
          <span style={{fontWeight:400,color:'var(--text-3)',marginLeft:8}}>
            后端硬熔断 · 任何路径均不可突破，人工审批也无法绕过
          </span>
        </span>
      </div>

      {/* PI 草稿（高风险动作） */}
      {showPI&&(
        <div className="card card-pad" style={{border:'1px solid var(--border)'}}>
          <div className="row gap2" style={{marginBottom:10}}>
            <Icon name="doc" size={13} style={{color:'var(--primary)'}}/>
            <span style={{fontWeight:700,fontSize:13}}>PI 草稿（待审批）</span>
            <span style={{fontSize:11,padding:'1px 7px',borderRadius:5,
              background:'rgba(202,138,4,.12)',color:'#CA8A04',fontWeight:700}}>高风险操作 · 需管理员审批</span>
          </div>
          <div style={{fontFamily:'monospace',fontSize:12,lineHeight:1.8,padding:'10px 12px',
            background:'var(--bg-2,#f4f5f8)',borderRadius:8,color:'var(--text-2)'}}>
            <b>PROFORMA INVOICE</b><br/>
            To: {item.company} · {item.contact}<br/>
            Product: {item.product} ({item.sku})<br/>
            Qty: {item.qty} sets · Unit Price: USD ${opt?.price}<br/>
            Total: USD ${opt?(opt.price*item.qty).toLocaleString():'--'}<br/>
            Incoterm: {item.incoterm} · Payment: 30% deposit + 70% before shipment<br/>
            Lead Time: 35–40 days · Validity: 14 days from date of issue
          </div>
          {!piSent?(
            <div className="row gap2" style={{marginTop:12}}>
              <button className="btn btn-pri btn-sm" onClick={()=>{setPiSent(true);toast('PI 已提交管理员审批，通过后由负责人确认发送','ok');}}>
                <Icon name="check" size={13}/>提交审批
              </button>
              <button className="btn btn-sec btn-sm" onClick={()=>setShowPI(false)}>取消</button>
              <span className="aux" style={{fontSize:12,color:'var(--red)'}}>· 审批前不会发送给买家</span>
            </div>
          ):(
            <div className="row gap2" style={{marginTop:12}}>
              <Icon name="check" size={14} style={{color:'var(--green)'}}/>
              <span style={{fontSize:13,color:'var(--green)',fontWeight:600}}>已提交管理员审批 · 通过后由负责人确认发送</span>
            </div>
          )}
        </div>
      )}

      {/* 操作区 */}
      <div className="row gap2 quote-action-row">
        <button className="btn btn-pri" disabled={!opt}
          onClick={()=>toast(`已采用${opt?.label}档 $${opt?.price}/套，正在生成报价准备草稿`,'ok')}>
          <Icon name="doc" size={15}/>生成报价准备
        </button>
        <button className="btn btn-sec"
          onClick={()=>{setShowPI(true);toast('PI 草稿已生成，等待负责人确认审批','info');}}>
          <Icon name="doc" size={14}/>生成 PI
        </button>
        <button className="btn btn-sec">
          <Icon name="edit" size={14}/>手动调价
        </button>
      </div>
    </div>
  );
}

/* ── 左侧：待人工报价客户列表 ── */
function WorkbenchList({active, onPick, onImport}){
  return (
    <div className="quote-workbench-list">
      <div className="row spread" style={{padding:'9px 12px 9px 16px',borderBottom:'1px solid var(--border-2)',flex:'none',gap:8}}>
        <span style={{fontSize:12.5,fontWeight:700,color:'var(--text-3)'}}>
          待人工报价 ({QUOTE_WORKBENCH.length})
        </span>
        <button className="btn btn-sec" onClick={onImport} style={{height:28,padding:'0 9px',fontSize:12}}>
          <Icon name="upload" size={13}/>导入 RFQ
        </button>
      </div>
      <div className="scroll" style={{flex:1}}>
        {QUOTE_WORKBENCH.map(item=>{
          const isActive = item.id===active;
          const isRfq = item.kind==='rfq';
          const rec = !isRfq && item.options.find(o=>o.recommended);
          const totalQty = isRfq ? item.lines.reduce((s,l)=>s+l.qty,0) : item.qty;
          return (
            <div key={item.id} onClick={()=>onPick(item.id)} className="clickable"
              style={{padding:'12px 16px',borderBottom:'1px solid var(--border-2)',
                background:isActive?'var(--primary-tint)':'#fff',
                borderLeft:`3px solid ${isActive?'var(--primary)':'transparent'}`,
                transition:'background .1s'}}>
              <div className="row spread" style={{marginBottom:4}}>
                <div className="row gap2" style={{minWidth:0}}>
                  <Grade g={item.grade} size={16}/>
                  <span className="flag">{item.flag}</span>
                  <span style={{fontWeight:600,fontSize:13.5}} className="ellipsis">{item.company}</span>
                </div>
                <ChannelIcon ch={item.channel} size={13}/>
              </div>
              <div className="aux ellipsis" style={{fontSize:12,marginBottom:6}}>
                {isRfq ? `报价单 · ${item.lines.length} 项 · 共 ${totalQty} 件` : `${item.qty} 套 · ${item.incoterm}`}
              </div>
              <div className="row spread">
                {isRfq
                  ? <span style={{fontSize:11,fontWeight:700,padding:'1px 7px',borderRadius:5,background:'var(--primary-tint)',color:'var(--primary)'}}>
                      <Icon name="doc" size={11} style={{marginRight:3,verticalAlign:'-1px'}}/>客户报价单
                    </span>
                  : <span style={{fontSize:12,fontWeight:700,color:'var(--green)'}}>建议 ${rec?.price}/套</span>}
                <span className={`pill ${STATUS_META[item.status]?.pill||'pill-ai'}`}
                  style={{height:19,fontSize:10.5,padding:'0 6px'}}>
                  {STATUS_META[item.status]?.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkbenchTab(){
  const [activeId,setActiveId]=useStateQR(QUOTE_WORKBENCH[0]?.id);
  const [showImport,setShowImport]=useStateQR(false);
  const toast=useToast();
  const item=QUOTE_WORKBENCH.find(i=>i.id===activeId)||QUOTE_WORKBENCH[0];
  const rfq=QUOTE_WORKBENCH.find(i=>i.kind==='rfq');
  return (
    <div className="quote-workbench">
      <WorkbenchList active={activeId} onPick={setActiveId} onImport={()=>setShowImport(true)}/>
      {item&&(item.kind==='rfq'
        ? <RfqQuotePanel key={item.id} item={item}/>
        : <SmartQuotePanel key={item.id} item={item}/>)}
      <RfqImportWizard open={showImport} onClose={()=>setShowImport(false)}
        onDone={()=>{ setShowImport(false); if(rfq) setActiveId(rfq.id); toast('客户报价单已解析，已生成报价工作项','ok'); }}/>
    </div>
  );
}

/* ── 报价来源分段按钮样式 ── */
function segBtn(active, disabled){
  return {height:28,padding:'0 10px',fontSize:12,fontWeight:600,border:'none',borderRadius:0,
    cursor:disabled?'not-allowed':'pointer',
    background:active?'var(--primary)':'#fff',
    color:active?'#fff':disabled?'var(--text-3)':'var(--text-2)', opacity:disabled?.5:1};
}
const fmtUsd=(n)=>'$'+Number(n).toLocaleString('en-US');
const marginColor=(m)=> m>=15?'var(--green)': m>=10?'var(--orange)':'var(--red)';

/* ── 客户报价单（RFQ）多行报价面板 ── */
function RfqQuotePanel({item}){
  const lines=item.lines;
  const [src,setSrc]=useStateQR(()=>lines.map(l=> l.target>=l.floor ? 'customer':'ai'));
  const setOne=(i,v)=>{ if(v==='customer' && lines[i].target<lines[i].floor) return; setSrc(s=>s.map((x,idx)=>idx===i?v:x)); };
  const setAll=(v)=>setSrc(lines.map(l=> (v==='customer' && l.target<l.floor) ? 'ai' : v));
  const rows=lines.map((l,i)=>{
    const base=l.cost+l.logistics;
    const source=src[i];
    const price=source==='customer'?l.target:l.aiPrice;
    const margin=price>0?((price-base)/price*100):0;
    return {l,i,source,base,price,amount:price*l.qty,margin};
  });
  const total=rows.reduce((s,r)=>s+r.amount,0);
  const totalBase=rows.reduce((s,r)=>s+r.base*r.l.qty,0);
  const blended=total>0?((total-totalBase)/total*100):0;
  const belowFloor=rows.filter(r=>r.price<r.l.floor);
  const blocked=belowFloor.length>0;
  const customerCount=src.filter(x=>x==='customer').length;
  const aiCount=src.length-customerCount;

  return (
    <div className="col scroll quote-detail-scroll">
      {/* 头部：买家 + 来源 + 全局来源切换 */}
      <div className="card card-pad">
        <div className="row gap3" style={{marginBottom:12,flexWrap:'wrap'}}>
          <Avatar name={item.contact} size={40}/>
          <div className="col" style={{flex:1,gap:2}}>
            <div className="row gap2"><span style={{fontWeight:700,fontSize:14}}>{item.company}</span><span className="flag">{item.flag}</span><Grade g={item.grade} size={18}/></div>
            <div className="aux row gap2"><span>{item.contact}</span><span>·</span><span>{item.country}</span><span>·</span><ChannelIcon ch={item.channel} size={13}/></div>
          </div>
          <span className="pill pill-ai" style={{height:22,fontSize:11,flex:'none'}}><Icon name="doc" size={11}/>客户报价单</span>
        </div>
        <div className="row spread" style={{padding:'10px 12px',borderRadius:8,background:'var(--bg-2,#f4f5f8)',flexWrap:'wrap',gap:10}}>
          <div className="row gap2" style={{minWidth:0}}>
            <Icon name="upload" size={14} style={{color:'var(--primary)',flex:'none'}}/>
            <span className="aux">已从 <b style={{color:'var(--text)'}}>{item.source}</b> 解析 {lines.length} 项 · 单号 {item.rfqNo} · {item.incoterm} · {item.parsedAt}</span>
          </div>
          <div className="row gap2" style={{flex:'none'}}>
            <span className="aux" style={{fontSize:12}}>计算来源</span>
            <div className="row" style={{border:'1px solid var(--border)',borderRadius:7,overflow:'hidden'}}>
              <button onClick={()=>setAll('customer')} style={segBtn(customerCount===src.length)}>全部客户单价</button>
              <button onClick={()=>setAll('ai')} style={segBtn(aiCount===src.length)}>全部规则建议</button>
            </div>
          </div>
        </div>
      </div>

      {/* 行表：逐产品报价来源 */}
      <div className="card" style={{overflow:'hidden'}}>
        <table className="tbl">
          <thead><tr>
            <th>产品 / SKU</th><th>数量</th><th>客户报价单价</th><th>规则建议价</th><th>报价来源</th><th>采用单价</th><th>本行小计</th><th>毛利</th>
          </tr></thead>
          <tbody>
            {rows.map(r=>{
              const below=r.l.target<r.l.floor;
              return (
                <tr key={r.l.sku}>
                  <td><div className="col" style={{gap:1}}><span style={{fontWeight:600}}>{r.l.product}</span><span className="mono aux" style={{fontSize:11}}>{r.l.sku} · 成本基线 ${r.base}</span></div></td>
                  <td className="num">{r.l.qty}</td>
                  <td className="num" style={{color:below?'var(--red)':'var(--text)',fontWeight:below?700:400}}>
                    ${r.l.target}{below&&<span style={{display:'block',fontSize:10.5,color:'var(--red)'}}>低于软底价 ${r.l.floor}</span>}
                  </td>
                  <td className="num" style={{color:'var(--primary)'}}>${r.l.aiPrice}</td>
                  <td>
                    <div className="row" style={{border:'1px solid var(--border)',borderRadius:7,overflow:'hidden',width:'max-content'}}>
                      <button onClick={()=>setOne(r.i,'customer')} disabled={below} title={below?'低于软底价，不可采用客户单价':''} style={segBtn(r.source==='customer',below)}>客户</button>
                      <button onClick={()=>setOne(r.i,'ai')} style={segBtn(r.source==='ai')}>规则</button>
                    </div>
                  </td>
                  <td className="num" style={{fontWeight:700,color:r.price<r.l.floor?'var(--red)':'var(--text)'}}>${r.price}</td>
                  <td className="num" style={{fontWeight:600}}>{fmtUsd(r.amount)}</td>
                  <td className="num" style={{fontWeight:700,color:marginColor(r.margin)}}>{r.margin.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <QuoteApprovalPanel
        item={item}
        amount={total}
        margin={blended}
        blocked={blocked}
        belowFloor={belowFloor.length}
        sourceLabel={customerCount>0?'客户单价 + 规则建议':'规则建议价'}
      />

      {/* 合计 + 护栏 + 动作 */}
      <div className="card card-pad">
        <div className="row gap5" style={{marginBottom:10,flexWrap:'wrap'}}>
          <div className="col"><span className="aux" style={{fontSize:11}}>合计金额</span><span className="num" style={{fontWeight:700,fontSize:20}}>{fmtUsd(total)}</span></div>
          <div className="col"><span className="aux" style={{fontSize:11}}>综合毛利</span><span className="num" style={{fontWeight:700,fontSize:20,color:marginColor(blended)}}>{blended.toFixed(1)}%</span></div>
          <div className="col"><span className="aux" style={{fontSize:11}}>来源构成</span><span style={{fontWeight:600,fontSize:13,marginTop:4}}>客户单价 {customerCount} · 规则建议 {aiCount}</span></div>
        </div>
        <div style={{padding:'8px 12px',borderRadius:8,marginBottom:12,fontSize:12.5,
          background:blocked?'var(--red-light)':'rgba(43,166,138,.08)',color:blocked?'#b53d39':'#1f7568'}}>
          <Icon name="shield" size={13} style={{marginRight:6,verticalAlign:'-2px'}}/>
          {blocked
            ? `${belowFloor.length} 行采用价低于软底价，需转人工，整单暂不可发送（硬底价后端熔断，任何路径不可绕过）。`
            : '全部采用价均在软底价之上 · 硬底价后端熔断兜底，仍需负责人确认后发送。'}
        </div>
        <div className="row gap2 quote-action-row">
          <button className="btn btn-pri" disabled={blocked}><Icon name="doc" size={15}/>生成报价准备</button>
          <button className="btn btn-sec"><Icon name="doc" size={14}/>生成 PI 审批草稿</button>
          <button className="btn btn-sec"><Icon name="edit" size={14}/>手动调整</button>
        </div>
      </div>
    </div>
  );
}

/* ── 导入客户报价单向导（上传 → 智能解析 + 列映射 + 产品匹配 → 生成）── */
const RFQ_MAP=[
  {src:'产品名称 / Product', field:'product', ok:true},
  {src:'型号 / Model No.', field:'sku（产品库匹配）', ok:true},
  {src:'数量 / Qty', field:'qty', ok:true},
  {src:'目标价 / Target Price', field:'target', ok:true},
  {src:'贸易条款 / Incoterm', field:'incoterm', ok:true},
  {src:'交期要求 / Lead Time', field:'note', ok:true},
  {src:'其它备注', field:'—（忽略）', ok:false},
];
function RfqImportWizard({open,onClose,onDone}){
  return (
    <Modal open={open} onClose={onClose} width={580}>
      <div style={{padding:'18px 20px'}}>
        <div className="row spread" style={{marginBottom:14}}>
          <span className="h3">导入客户报价单 / RFQ</span>
          <button className="btn-icon btn-ghost" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <div className="row gap2" style={{marginBottom:14,fontSize:12,color:'var(--text-3)',fontWeight:600}}>
          <span style={{color:'var(--primary)'}}>① 上传</span><Icon name="chevR" size={12}/>
          <span style={{color:'var(--primary)'}}>② 智能解析 · 列映射</span><Icon name="chevR" size={12}/>
          <span style={{color:'var(--primary)'}}>③ 产品匹配</span><Icon name="chevR" size={12}/>
          <span>④ 生成</span>
        </div>
        <div style={{border:'1.5px dashed var(--border)',borderRadius:10,padding:'16px',textAlign:'center',marginBottom:14,background:'#fafbfc'}}>
          <Icon name="upload" size={24} style={{color:'var(--text-3)'}}/>
          <div style={{fontSize:13,fontWeight:600,marginTop:6}}>Westfield_RFQ_2026SS.xlsx · 5 项</div>
          <span className="aux" style={{fontSize:11.5}}>支持 .xlsx / .csv / PDF · 自动识别表头与目标价</span>
        </div>
        <div className="field-label" style={{marginBottom:8}}>列映射（自动识别中英文表头）</div>
        <div className="card" style={{overflow:'hidden',marginBottom:14}}>
          <table className="tbl">
            <thead><tr><th>源列名</th><th>映射到标准字段</th><th>状态</th></tr></thead>
            <tbody>
              {RFQ_MAP.map(m=>(
                <tr key={m.src}>
                  <td>{m.src}</td>
                  <td className="mono" style={{color:m.ok?'var(--text)':'var(--text-3)'}}>{m.field}</td>
                  <td>{m.ok
                    ? <span className="badge" style={{background:'var(--green-light)',color:'#1f7568'}}><Icon name="check" size={11}/>已对齐</span>
                    : <span className="badge badge-grey">忽略</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row gap3" style={{marginBottom:16,fontSize:12.5,flexWrap:'wrap'}}>
          <span style={{color:'var(--green)',fontWeight:600}}>✓ 5 项已匹配产品库 SKU</span>
          <span style={{color:'var(--primary)',fontWeight:600}}>✓ 目标价已识别</span>
          <span style={{color:'#a06916',fontWeight:600}}>⚠ 1 项目标价低于软底价（转规则建议价并待人工复核）</span>
        </div>
        <div className="row gap2" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-sec" onClick={onClose}>取消</button>
          <button className="btn btn-pri" onClick={onDone}><Icon name="check" size={15}/>生成报价工作项</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Tab 2：规则配置 ── */
function NumField({label,value,set,prefix,suffix}){
  return (
    <div className="col">
      <span className="field-label">{label}</span>
      <div style={{position:'relative'}}>
        {prefix&&<span style={{position:'absolute',left:12,top:9,color:'var(--text-3)'}}>{prefix}</span>}
        <input className="input num" type="number" value={value} onChange={e=>set(+e.target.value)}
          style={{paddingLeft:prefix?24:12,paddingRight:suffix?40:12,fontWeight:600}}/>
        {suffix&&<span className="aux" style={{position:'absolute',right:12,top:10}}>{suffix}</span>}
      </div>
    </div>
  );
}

function RulesTab(){
  const [cost,setCost]=useStateQR(128);
  const [ship,setShip]=useStateQR(21);
  const [margin,setMargin]=useStateQR(18);
  const [floor,setFloor]=useStateQR(168);
  const [hardMin,setHardMin]=useStateQR(155);
  const [moq,setMoq]=useStateQR(50);
  const [valid,setValid]=useStateQR(14);
  const [qty,setQty]=useStateQR(300);
  const toast=useToast();

  const base=cost+ship;
  const tiers=[
    {min:50,max:99,price:198},{min:100,max:199,price:189},
    {min:200,max:299,price:182},{min:300,max:null,price:172},
  ];
  const tier=tiers.find(t=>qty>=t.min&&(t.max==null||qty<=t.max))||tiers[0];
  const pp=tier.price;
  const belowHard=pp<hardMin;
  const belowFloor=pp<floor;
  const realMgn=Math.round((pp-base)/pp*100);
  const versions=[
    {v:'v3 (当前)',at:'今天 09:00',by:'陈航',note:'硬底价调整为 $155'},
    {v:'v2',at:'昨天 18:30',by:'陈航',note:'阶梯 300+ 档从 $175 改为 $172'},
    {v:'v1 (初始)',at:'2026-06-20',by:'陈航',note:'首次配置规则'},
  ];

  return (
    <div className="page-scroll">
      <div style={{padding:'20px 24px',maxWidth:1180,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col" style={{gap:2}}>
            <span className="aux" style={{color:'var(--text-3)'}}>确定性护栏 · 同一输入永远得到同一输出 · AI 不参与最终算数</span>
            <span className="h2">规则配置</span>
          </div>
          <button className="btn btn-pri" onClick={()=>toast('规则已保存（v4），版本留痕完毕','ok')}>
            <Icon name="check" size={15}/>保存规则
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.3fr .9fr',gap:20}}>
          <div className="col" style={{gap:20}}>
            {/* 基础定价 */}
            <div className="card card-pad">
              <SectionTitle icon="sliders" sub="Aspen 5-Seater PE Rattan Corner Sofa Set · OF-RT-205">基础定价（/ 套）</SectionTitle>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <NumField label="产品成本" value={cost} set={setCost} prefix="$"/>
                <NumField label="海运分摊（CIF）" value={ship} set={setShip} prefix="$"/>
                <NumField label="目标利润率" value={margin} set={setMargin} suffix="%"/>
                <NumField label="最小起订量 MOQ" value={moq} set={setMoq} suffix="套"/>
                <NumField label="报价有效期" value={valid} set={setValid} suffix="天"/>
                <div className="col">
                  <span className="field-label">汇率来源</span>
                  <div className="input row spread" style={{cursor:'pointer',fontSize:13}}>
                    <span>实时中间价 · USD/CNY 7.21</span>
                    <span style={{fontSize:11,color:'var(--green)',fontWeight:600}}>● 已同步</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 阶梯价 */}
            <div className="card" style={{overflow:'hidden'}}>
              <div className="card-pad" style={{paddingBottom:0}}>
                <SectionTitle icon="rules" sub="按数量分档，自动套用对应单价"
                  right={<button className="btn btn-sec btn-sm"><Icon name="plus" size={13}/>加一档</button>}>
                  阶梯价
                </SectionTitle>
              </div>
              <table className="tbl">
                <thead><tr><th>数量区间</th><th>单价 (USD)</th><th>较软底价</th><th>较硬底价</th><th></th></tr></thead>
                <tbody>
                  {tiers.map((t,i)=>(
                    <tr key={i}>
                      <td className="mono">{t.min}{t.max?` – ${t.max}`:'+'} 套</td>
                      <td className="num" style={{fontWeight:600}}>${t.price}</td>
                      <td><span className="badge" style={{
                        background:t.price>=floor?'var(--green-light)':'var(--red-light)',
                        color:t.price>=floor?'#1f7568':'#b53d39'}}>
                        {t.price>=floor?`+$${t.price-floor}`:'低于软底价'}
                      </span></td>
                      <td><span className="badge" style={{
                        background:t.price>=hardMin?'var(--green-light)':'rgba(139,0,0,.1)',
                        color:t.price>=hardMin?'#1f7568':'#8b0000'}}>
                        {t.price>=hardMin?`+$${t.price-hardMin}`:'⛔ 低于硬底价'}
                      </span></td>
                      <td><button className="btn-icon btn-ghost"><Icon name="edit" size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 软底价 */}
            <div className="card card-pad" style={{border:'1px solid #f0c4c2',background:'#fffafa'}}>
              <div className="row spread">
                <div className="row gap2">
                  <span style={{width:32,height:32,borderRadius:8,background:'var(--red-light)',color:'var(--red)',
                    display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                    <Icon name="shield" size={18}/>
                  </span>
                  <div className="col">
                    <span className="h3" style={{color:'#b53d39'}}>软底价（floor_price）</span>
                    <span className="aux">触及即自动转人工，系统不自动发送</span>
                  </div>
                </div>
                <div className="row gap2" style={{alignItems:'center'}}>
                  <span className="aux">$</span>
                  <input className="input num" type="number" value={floor} onChange={e=>setFloor(+e.target.value)}
                    style={{width:90,fontSize:18,fontWeight:700,color:'var(--red)',borderColor:'#f0c4c2',textAlign:'center'}}/>
                  <span className="aux">/ 套</span>
                </div>
              </div>
            </div>

            {/* 硬底价 */}
            <div className="card card-pad" style={{border:'2px solid rgba(139,0,0,.5)',background:'#fff5f5'}}>
              <div className="row spread">
                <div className="row gap2">
                  <span style={{width:32,height:32,borderRadius:8,background:'rgba(139,0,0,.12)',color:'#8b0000',
                    display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                    <Icon name="shield" size={18}/>
                  </span>
                  <div className="col" style={{gap:2}}>
                    <div className="row gap2">
                      <span className="h3" style={{color:'#8b0000'}}>硬底价（hard_min_price）</span>
                      <span style={{fontSize:10.5,fontWeight:700,padding:'1px 6px',borderRadius:4,
                        background:'rgba(139,0,0,.15)',color:'#8b0000'}}>不可绕过</span>
                    </div>
                    <span className="aux">后端硬熔断 · 报价发送与 PI 生成均被阻断 · 人工审批也无法绕过</span>
                  </div>
                </div>
                <div className="row gap2" style={{alignItems:'center'}}>
                  <span className="aux">$</span>
                  <input className="input num" type="number" value={hardMin} onChange={e=>setHardMin(+e.target.value)}
                    style={{width:90,fontSize:18,fontWeight:700,color:'#8b0000',borderColor:'rgba(139,0,0,.4)',textAlign:'center'}}/>
                  <span className="aux">/ 套</span>
                </div>
              </div>
            </div>

            {/* 版本历史 */}
            <div className="card card-pad">
              <SectionTitle icon="clock" sub="每次保存自动留版本，可随时回滚">规则版本历史</SectionTitle>
              <div className="col" style={{gap:8}}>
                {versions.map((v,i)=>(
                  <div key={i} className="row gap3" style={{padding:'9px 12px',borderRadius:8,
                    background:i===0?'var(--primary-tint)':'var(--bg-2,#f4f5f8)'}}>
                    <span style={{fontWeight:700,fontSize:12.5,whiteSpace:'nowrap',
                      color:i===0?'var(--primary)':'var(--text-2)'}}>{v.v}</span>
                    <span className="aux" style={{flex:1}}>{v.note}</span>
                    <span className="aux" style={{fontSize:11,whiteSpace:'nowrap'}}>{v.at} · {v.by}</span>
                    {i>0&&<button className="btn btn-sec btn-sm" style={{fontSize:11,flex:'none'}}>回滚</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：实时预览 */}
          <div>
            <div className="card card-pad" style={{position:'sticky',top:0}}>
              <SectionTitle icon="eye" sub="拖动数量，预览业务员报价参考">报价准备预览</SectionTitle>
              <label className="field-label">询盘数量：<b style={{color:'var(--text)'}}>{qty} 套</b></label>
              <input type="range" min="50" max="400" step="10" value={qty}
                onChange={e=>setQty(+e.target.value)}
                style={{width:'100%',accentColor:'var(--primary)'}}/>
              <div className="row spread aux" style={{marginTop:2,marginBottom:16}}><span>50</span><span>400</span></div>

              <div style={{padding:'16px',borderRadius:10,
                background:belowHard?'rgba(139,0,0,.08)':belowFloor?'var(--red-light)':'var(--primary-tint)',
                border:`1px solid ${belowHard?'rgba(139,0,0,.4)':belowFloor?'#f0c4c2':'var(--primary-light)'}`}}>
                <div className="row spread">
                  <span className="aux">套用阶梯</span>
                  <span className="badge badge-pri">{tier.min}{tier.max?`–${tier.max}`:'+'} 套</span>
                </div>
                <div className="row" style={{alignItems:'baseline',gap:6,margin:'10px 0'}}>
                  <span style={{fontSize:36,fontWeight:700,
                    color:belowHard?'#8b0000':belowFloor?'var(--red)':'var(--primary)'}}>${pp}</span>
                  <span className="aux">/ 套</span>
                </div>
                <div className="row spread"><span className="aux">合计</span>
                  <span style={{fontWeight:600}}>${(pp*qty).toLocaleString()}</span></div>
                <div className="row spread"><span className="aux">实际毛利</span>
                  <span style={{fontWeight:600,color:realMgn>=margin?'var(--green)':'var(--orange)'}}>{realMgn}%</span></div>
                <div className="divider" style={{margin:'10px 0'}}/>
                {belowHard
                  ? <div className="row gap2"><Icon name="alert" size={14} style={{color:'#8b0000'}}/>
                      <span className="aux" style={{color:'#8b0000',fontWeight:700}}>⛔ 低于硬底价 ${hardMin}，后端熔断阻断发送</span></div>
                  : belowFloor
                  ? <div className="row gap2"><Icon name="alert" size={14} style={{color:'var(--red)'}}/>
                      <span className="aux" style={{color:'#b53d39',fontWeight:600}}>低于软底价 ${floor}，自动转人工审批</span></div>
                  : <div className="row gap2"><Icon name="shieldCheck" size={14} style={{color:'var(--green)'}}/>
                      <span className="aux" style={{color:'#1f7568',fontWeight:600}}>在软底价之上，可生成报价准备，仍需业务员确认</span></div>}
              </div>
              <div className="aux" style={{marginTop:12,fontSize:12,lineHeight:1.7}}>
                报价数字由<b>规则引擎</b>确定性计算，再交由 <b>LLM</b> 整理成客户母语草稿；价格、交期和条款必须由业务员确认后发送。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 3：报价记录 ── */
function RecordsTab(){
  const toast=useToast();
  return (
    <div className="page-scroll">
      <div style={{padding:'20px 24px',maxWidth:1180,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col" style={{gap:2}}>
            <span className="aux" style={{color:'var(--text-3)'}}>已发报价 · PI · 议价历史</span>
            <span className="h2">报价记录</span>
          </div>
          <div className="row gap2">
            <button className="btn btn-sec btn-sm"><Icon name="download" size={14}/>导出</button>
          </div>
        </div>

        <div className="card" style={{overflow:'hidden'}}>
          <table className="tbl">
            <thead>
              <tr>
                <th>买家</th><th>产品 / 数量</th><th>单价</th><th>合计金额</th>
                <th>状态</th><th>渠道</th><th>时间</th><th></th>
              </tr>
            </thead>
            <tbody>
              {QUOTE_RECORDS.map(r=>{
                const st=QR_STATUS[r.status]||{};
                const total=r.dealValue||(r.price*r.qty);
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="row gap2">
                        <span className="flag">{r.flag}</span>
                        <div className="col">
                          <span style={{fontWeight:600,fontSize:13}}>{r.company}</span>
                          <span className="aux" style={{fontSize:11}}>{r.contact}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="col">
                        <span style={{fontSize:12.5}}>{r.sku}</span>
                        <span className="aux" style={{fontSize:11}}>{r.qty} 套 · {r.incoterm}</span>
                      </div>
                    </td>
                    <td><span style={{fontWeight:700}}>USD ${r.price}</span></td>
                    <td><span style={{fontWeight:600}}>${total.toLocaleString()}</span></td>
                    <td>
                      <span style={{fontSize:11.5,fontWeight:700,padding:'3px 8px',borderRadius:6,
                        background:st.bg,color:st.color}}>{st.label}</span>
                      {r.piNote&&<div className="aux" style={{fontSize:11,marginTop:3}}>{r.piNote}</div>}
                    </td>
                    <td><ChannelIcon ch={r.channel} size={14}/></td>
                    <td className="aux" style={{fontSize:12,whiteSpace:'nowrap'}}>{r.createdAt}</td>
                    <td>
                      <div className="row gap1">
                        {r.status==='pi_pending'&&(
                          <button className="btn btn-pri btn-sm" style={{fontSize:11}}
                            onClick={()=>toast('PI 已审批，等待负责人最终确认发送','ok')}>
                            <Icon name="check" size={11}/>审批 PI
                          </button>
                        )}
                        {r.status==='negotiating'&&(
                          <button className="btn btn-sec btn-sm" style={{fontSize:11}}>议价详情</button>
                        )}
                        {r.status==='expired'&&(
                          <button className="btn btn-sec btn-sm" style={{fontSize:11}}
                            onClick={()=>toast('已生成续报提醒，分配给业务员跟进','info')}>续报</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── 根组件 ── */
function QuoteRules({demoMode=false}){
  const [tab,setTab]=useStateQR('workbench');
  const piCount=QUOTE_RECORDS.filter(r=>r.status==='pi_pending').length;
  const tabs=[
    {key:'workbench', label:'报价准备', badge:QUOTE_WORKBENCH.length, badgeColor:'var(--green)',    badgeBg:'rgba(43,166,138,.18)'},
    {key:'rules',     label:'规则配置'},
    {key:'records',   label:'报价记录',   badge:piCount,               badgeColor:'#CA8A04',        badgeBg:'rgba(202,138,4,.15)'},
  ];
  if(!demoMode) return (
    <div className="col" style={{height:'100%',overflow:'hidden'}}>
      <div className="row spread" style={{padding:'16px 24px 12px',background:'#fff',borderBottom:'1px solid var(--border-2)',flex:'none',alignItems:'flex-end',gap:16}}>
        <div className="col" style={{minWidth:0}}>
          <span className="eyebrow" style={{color:'var(--tech-deep)'}}>Manual quoting</span>
          <span className="h1">报价准备 / 人工报价</span>
          <span className="muted" style={{marginTop:4}}>当前账号还没有真实报价工作项。确认需求和产品后再进入人工报价准备。</span>
        </div>
      </div>
      <div className="page-scroll">
        <div style={{padding:'24px 28px',maxWidth:960,margin:'0 auto'}}>
          <div className="card">
            <Empty icon="doc" title="暂无报价准备工作项" desc="报价模块不再用样例 RFQ、样例底价或样例 PI 冒充真实数据。"/>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="col" style={{height:'100%',overflow:'hidden'}}>
      {/* 统一页头：eyebrow + h1 + muted（与其它模块一致） */}
      <div className="row spread" style={{padding:'16px 24px 12px',background:'#fff',borderBottom:'1px solid var(--border-2)',flex:'none',alignItems:'flex-end',gap:16}}>
        <div className="col" style={{minWidth:0}}>
          <span className="eyebrow" style={{color:'var(--tech-deep)'}}>Manual quoting</span>
          <span className="h1">报价准备 / 人工报价</span>
          <span className="muted" style={{marginTop:4}}>AI 整理需求、成本、风险和草稿；价格、交期、方案与合同由业务员确认</span>
        </div>
        <div className="row gap2" style={{flex:'none',alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--text-3)',whiteSpace:'nowrap'}}>需求整理 + 风险提示</span>
        </div>
      </div>

      {/* tab 条 */}
      <div style={{height:44,padding:'0 24px',background:'#fff',borderBottom:'1px solid var(--border-2)',flex:'none',display:'flex',alignItems:'stretch'}}>
        <div className="row gap1" style={{flex:1,minWidth:0}}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              padding:'0 4px',marginRight:14,border:'none',background:'none',cursor:'pointer',
              fontSize:13.5,fontWeight:600,height:'100%',
              color:tab===t.key?'var(--primary)':'var(--text-3)',
              borderBottom:tab===t.key?'2px solid var(--primary)':'2px solid transparent',
              display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap',
            }}>
              {t.label}
              {(t.badge>0)&&(
                <span style={{fontSize:11,fontWeight:700,padding:'1px 6px',borderRadius:8,lineHeight:1.4,
                  background:t.badgeBg,color:t.badgeColor}}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab==='workbench' && <WorkbenchTab/>}
      {tab==='rules'     && <RulesTab/>}
      {tab==='records'   && <RecordsTab/>}
    </div>
  );
}

export { QuoteRules, NumField };
