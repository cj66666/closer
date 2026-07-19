import { useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { CHANNEL_READINESS, FOLLOWUP_TASKS, LEAD_QUEUE, LIFECYCLE_STAGES, OWNER_WORKLOAD, SELLER } from '../sampleData.js';
import { Avatar, ChannelIcon, Grade, SectionTitle } from '../ui.jsx';

function stageLabel(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)?.label || stage;
}

function stageColor(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage)?.color || 'var(--text-2)';
}

function Dashboard({go, onOpenProfile}){
  const [activeId,setActiveId]=useState(LEAD_QUEUE[0]?.id);
  const [activeOwnerId,setActiveOwnerId]=useState(OWNER_WORKLOAD.owners[0]?.id);
  const active=LEAD_QUEUE.find(l=>l.id===activeId)||LEAD_QUEUE[0];
  const activeOwner=OWNER_WORKLOAD.owners.find(owner=>owner.id===activeOwnerId)||OWNER_WORKLOAD.owners[0];
  const stats=useMemo(()=>[
    {label:'SLA 超时线索', value:LEAD_QUEUE.filter(l=>l.sla?.status==='overdue').length, icon:'alert', color:'var(--red)', route:'leads'},
    {label:'待首次联系', value:LEAD_QUEUE.filter(l=>l.stage==='first_contact_due').length, icon:'phone', color:'#1877F2', route:'leads'},
    {label:'待人工接管', value:LEAD_QUEUE.filter(l=>l.takeover).length, icon:'hand', color:'var(--red)', route:'leads'},
    {label:'逾期跟进', value:FOLLOWUP_TASKS.filter(t=>t.status==='overdue'||t.status==='due').length, icon:'clock', color:'var(--orange)', route:'followups'},
  ],[]);
  const stageCounts=LIFECYCLE_STAGES.map(stage=>({stage, count:LEAD_QUEUE.filter(l=>l.stage===stage.key).length})).filter(x=>x.count>0);

  return (
    <div className="page-scroll">
      <div className="lead-workbench">
        <div className="lead-head">
          <div>
            <span className="eyebrow" style={{color:'var(--primary)'}}>Lead Lifecycle</span>
            <h1 className="lead-title">线索与客户生命周期工作台</h1>
            <p className="lead-sub">AI 负责初筛、补需求和提醒；方案设计、价格和合同由业务员接管。</p>
          </div>
          <div className="lead-head-actions">
            <button className="btn btn-sec" onClick={()=>go('settings')}><Icon name="globe" size={16}/>渠道</button>
            <button className="btn btn-pri" onClick={()=>go('leads')}><Icon name="inbox" size={16}/>处理线索</button>
          </div>
        </div>

        <div className="lead-shell">
          <aside className="lead-panel">
            <SectionTitle icon="dashboard" sub={SELLER.company}>今日概览</SectionTitle>
            <div className="lead-stat-grid">
              {stats.map(item=>(
                <button key={item.label} className="lead-stat" onClick={()=>go(item.route)}>
                  <span style={{color:item.color}}><Icon name={item.icon} size={18}/></span>
                  <span className="lead-stat-value">{item.value}</span>
                  <span className="lead-stat-label">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="sla-card">
              <div className="row spread" style={{gap:10}}>
                <div>
                  <div className="lead-section-title" style={{margin:'0 0 4px'}}>响应 SLA</div>
                  <b>5 分钟内接住 A/B 级线索</b>
                </div>
                <span className="badge badge-red">{LEAD_QUEUE.filter(l=>l.sla?.status==='overdue').length} 条超时</span>
              </div>
              <div className="sla-meter"><span style={{width:'64%'}}/></div>
              <p>调研里最明显的缺口是响应慢。现在首页直接暴露超时线索，优先处理“仅留联系方式”和强意向客户。</p>
            </div>

            <div className="lead-section-title">阶段分布</div>
            <div className="stage-list">
              {stageCounts.map(({stage,count})=>(
                <button key={stage.key} className="stage-row" onClick={()=>go('crm')}>
                  <span className="stage-dot" style={{background:stage.color}}/>
                  <span>{stage.label}</span>
                  <b>{count}</b>
                </button>
              ))}
            </div>
          </aside>

          <main className="lead-center">
            <div className="lead-toolbar">
              <SectionTitle icon="inbox" sub="只放今天必须处理的线索">线索任务队列</SectionTitle>
              <button className="btn btn-sec btn-sm" onClick={()=>go('leads')}><Icon name="filter" size={14}/>全部线索</button>
            </div>
            <section className="owner-panel">
              <div className="owner-panel-head">
                <SectionTitle icon="users" sub="按负责人、容量和 SLA 升级兜住线索">负责人负载与升级</SectionTitle>
                <button className="btn btn-sec btn-sm" onClick={()=>go('followups')}><Icon name="clock" size={14}/>跟进任务</button>
              </div>
              <div className="owner-summary-grid">
                {OWNER_WORKLOAD.summary.map(item=>(
                  <div key={item.label} className={`owner-summary ${item.status}`}>
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>
              <div className="owner-grid">
                {OWNER_WORKLOAD.owners.map(owner=>(
                  <button key={owner.id} className={`owner-card ${owner.status} ${activeOwner.id===owner.id?'active':''}`} onClick={()=>setActiveOwnerId(owner.id)}>
                    <div className="owner-card-head">
                      <Avatar name={owner.name} size={34}/>
                      <div>
                        <b>{owner.name}</b>
                        <span>{owner.role}</span>
                      </div>
                      <em>{owner.statusLabel}</em>
                    </div>
                    <div className="owner-load-row">
                      <span>线索 {owner.openLeads}/{owner.capacity}</span>
                      <span>{owner.availability}</span>
                    </div>
                    <div className="owner-meter"><span style={{width:`${Math.min(100,Math.round(owner.openLeads/owner.capacity*100))}%`}}/></div>
                    <div className="owner-mini-grid">
                      <span><b>{owner.overdue}</b> 超时</span>
                      <span><b>{owner.dueSoon}</b> 将到期</span>
                      <span><b>{owner.takeover}</b> 接管</span>
                    </div>
                    <div className="owner-channel-row">
                      {owner.channels.map(ch=><ChannelIcon key={ch} ch={ch} size={18}/>)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="owner-action-strip">
                <div>
                  <span className="field-label">当前负责人动作</span>
                  <b>{activeOwner.nextAction}</b>
                  <p>{activeOwner.escalation}</p>
                </div>
                <span className="badge badge-grey">备用：{activeOwner.backup}</span>
                <button className="btn btn-pri btn-sm" onClick={()=>go('leads')}><Icon name="alert" size={14}/>处理超时</button>
              </div>
              <div className="escalation-strip">
                {OWNER_WORKLOAD.escalations.map(rule=>(
                  <span key={rule.time}><b>{rule.time}</b>{rule.owner}</span>
                ))}
              </div>
            </section>
            <div className="lead-list">
              {LEAD_QUEUE.map(lead=>(
                <button key={lead.id} className={`lead-row ${active.id===lead.id?'active':''}`} onClick={()=>setActiveId(lead.id)}>
                  <div className="lead-row-top">
                    <span className="row gap2" style={{minWidth:0}}>
                      <Grade g={lead.grade} size={24}/>
                      <span className="flag">{lead.flag}</span>
                      <span className="lead-company ellipsis">{lead.company}</span>
                    </span>
                    <span className="lead-due">{lead.due}</span>
                  </div>
                  <div className="lead-row-title">{lead.title}</div>
                  <div className="lead-row-meta">
                    <ChannelIcon ch={lead.source} size={20}/>
                    <span style={{color:stageColor(lead.stage)}}>{stageLabel(lead.stage)}</span>
                    {lead.sla&&<span className={`badge ${lead.sla.status==='overdue'?'badge-red':lead.sla.status==='ok'?'badge-green':'badge-grey'}`}>{lead.sla.label}</span>}
                    {lead.takeover&&<span className="badge badge-red">人工接管</span>}
                  </div>
                </button>
              ))}
            </div>
          </main>

          <aside className="lead-context">
            <SectionTitle icon="user" sub="客户上下文与下一步">当前线索</SectionTitle>
            <div className="context-card">
              <div className="row gap3" style={{alignItems:'flex-start'}}>
                <Avatar name={active.contact} size={42}/>
                <div className="col" style={{minWidth:0,gap:2}}>
                  <div className="row gap2" style={{minWidth:0}}>
                    <span className="h3 ellipsis">{active.company}</span>
                    <span className="flag">{active.flag}</span>
                  </div>
                  <span className="aux">{active.contact} · {active.country}</span>
                  <span className="aux ellipsis">{active.contactValue}</span>
                </div>
              </div>
              <div className="context-summary">{active.summary}</div>
              <div className={`sla-card compact ${active.sla?.status==='overdue'?'urgent':''}`}>
                <div className="row spread" style={{gap:10}}>
                  <div>
                    <span className="field-label">优先原因</span>
                    <b>{active.sla?.label} · {active.sla?.elapsed}</b>
                  </div>
                  <span className="badge badge-grey">{active.owner}</span>
                </div>
                <div className="sla-meter"><span style={{width:`${active.sla?.pct||0}%`}}/></div>
                <p>{active.priorityReason}</p>
              </div>
              <div className="tag-wrap">
                {active.tags.map(tag=><span key={tag} className="badge badge-pri">{tag}</span>)}
              </div>
              <div className="next-box">
                <div className="row gap2" style={{fontWeight:700,color:'var(--text)',marginBottom:6}}>
                  <Icon name="bot" size={15} style={{color:'var(--primary)'}}/>下一步建议
                </div>
                <p>{active.nextStep}</p>
              </div>
              <div className="missing-box">
                <span className="field-label">缺失信息</span>
                <div className="tag-wrap">
                  {active.missing.map(item=><span key={item} className="badge badge-grey">{item}</span>)}
                </div>
              </div>
              {active.handoffReasons?.length>0&&(
                <div className="handoff-box">
                  <div className="row gap2" style={{fontWeight:700,marginBottom:6}}><Icon name="shield" size={15}/>接管边界</div>
                  <div className="tag-wrap">{active.handoffReasons.map(reason=><span key={reason} className="badge badge-red">{reason}</span>)}</div>
                </div>
              )}
              <div className="row gap2" style={{marginTop:16}}>
                <button className="btn btn-pri btn-sm" style={{flex:1}} onClick={()=>go('leads')}><Icon name="message" size={14}/>处理</button>
                <button className="btn btn-sec btn-sm" onClick={()=>onOpenProfile?.(active)}><Icon name="user" size={14}/>档案</button>
              </div>
            </div>
            <div className="readiness-list">
              <div className="lead-section-title">渠道接线状态</div>
              {CHANNEL_READINESS.slice(0,3).map(item=>(
                <button key={item.key} className="readiness-row" onClick={()=>go('settings')}>
                  <ChannelIcon ch={item.key} size={20}/>
                  <span>{item.label}</span>
                  <b className={item.status}>{item.statusLabel}</b>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export { Dashboard };
