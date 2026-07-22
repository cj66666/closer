import { useEffect, useState } from 'react';
import { Icon } from '../icons.jsx';
import { CUSTOMERS, TIMELINE, CUSTOMER_ACTIVITY_TIMELINE, DEAL_CLOSE_PLANS, BUYER_ENABLEMENT_PACKS, DEAL_OUTCOME_REVIEWS, POST_SALE_HANDOFFS, MEETING_PLANS, IDENTITY_RESOLUTION_QUEUE, LIFECYCLE_STAGES, CRM_SAVED_VIEWS } from '../sampleData.js';
import { fetchCustomers } from '../data.js';
import { Avatar, Grade, fmtMoney } from '../ui.jsx';

/* ===== crm.jsx ===== */
/* ============ 客户档案 / CRM ============ */

/* 客户价值分级（区别于单条询盘 A/B/C 等级） */
const VTIER_META = {
  '核心客户':{fg:'#1f7568', bg:'var(--green-light)'},
  '成长客户':{fg:'var(--primary)', bg:'var(--primary-tint)'},
  '高潜新客':{fg:'#a06916', bg:'var(--orange-light)'},
  '潜力客户':{fg:'#6b7480', bg:'var(--grey-light)'},
};
function ValueTier({tier, size=12}){
  const m=VTIER_META[tier]||VTIER_META['潜力客户'];
  return <span className="badge" style={{color:m.fg,background:m.bg,fontSize:size,fontWeight:700}}>{tier||'潜力客户'}</span>;
}

function stageMeta(stage){
  return LIFECYCLE_STAGES.find(s=>s.key===stage) || LIFECYCLE_STAGES[0];
}

function customerStage(c){
  if(c.lifecycle_stage) return c.lifecycle_stage;
  const map={'谈判中':'human_takeover','报价中':'quote_ready','已成交':'won','跟进中':'followup','样品阶段':'needs_discovery','老客户':'strong_intent'};
  return map[c.tag] || 'new_lead';
}

const INTENT_META = {
  high:{label:'强意向', color:'var(--green)', bg:'var(--green-light)'},
  medium:{label:'中意向', color:'var(--primary)', bg:'var(--primary-tint)'},
  low:{label:'低意向', color:'var(--text-2)', bg:'var(--grey-light)'},
};

function intentMeta(c){
  return INTENT_META[c.intent_level] || INTENT_META.low;
}

function validityText(c){
  if((c.tags||[]).some(t=>t.includes('待补'))) return '待补需求';
  if((c.tags||[]).some(t=>t.includes('真实'))) return '有效客户';
  return c.grade==='A' ? '有效客户' : '待验证';
}

function buyingGroupMeta(c){
  const group=c.buyingGroup;
  if(!group) return {label:'联系人未建图', sub:'待补采购角色', cls:'bad', color:'var(--red)'};
  if(group.decisionMakerKnown && (group.missingRoles||[]).length===0) {
    return {label:'决策链完整', sub:group.coverage, cls:'good', color:'var(--green)'};
  }
  if(group.decisionMakerKnown) return {label:'已识别决策人', sub:group.coverage, cls:'warn', color:'var(--orange)'};
  return {label:'缺决策人', sub:group.coverage, cls:'bad', color:'var(--red)'};
}

function BuyingGroupPanel({group}){
  const stakeholders=group?.stakeholders || [];
  const meta=group?.decisionMakerKnown
    ? ((group.missingRoles||[]).length ? {label:'待补关键角色', cls:'warn'} : {label:'决策链完整', cls:'good'})
    : {label:'缺决策人', cls:'bad'};
  return (
    <div className="buying-group-panel">
      <div className="buying-group-head">
        <div>
          <span className="field-label">采购委员会</span>
          <h3>{group?.consensus || '还未记录客户内部决策链'}</h3>
          <p>记录谁发起需求、谁拍板、谁影响规格和付款条件，避免只跟一个询盘联系人推进。</p>
        </div>
        <div className={`buying-coverage ${meta.cls}`}>
          <b>{group?.coverage || '0/0'}</b>
          <span>{meta.label}</span>
        </div>
      </div>
      <div className="buying-role-grid">
        {stakeholders.map(person=>(
          <div key={`${person.name}-${person.role}`} className={`buying-role-card ${person.stance==='支持'?'good':person.stance==='未知'?'bad':'warn'}`}>
            <div className="row spread" style={{gap:8}}>
              <b>{person.name}</b>
              <span>{person.influence}影响</span>
            </div>
            <em>{person.role}</em>
            <p>{person.engagement} · {person.risk}</p>
          </div>
        ))}
      </div>
      {(group?.missingRoles||[]).length>0&&(
        <div className="buying-gap-row">
          <Icon name="alert" size={14}/>
          <span>待补角色：{group.missingRoles.join(' / ')}</span>
        </div>
      )}
      <div className="buying-next-question">
        <Icon name="message" size={14}/>
        <span>{group?.nextQuestion || '下一轮沟通先确认采购角色、预算审批人和最终拍板人。'}</span>
      </div>
    </div>
  );
}

function dealPlanFor(c){
  return DEAL_CLOSE_PLANS.find(plan=>plan.customerId===c.id);
}

function enablementPackFor(c){
  return BUYER_ENABLEMENT_PACKS.find(pack=>pack.customerId===c.id);
}

function outcomeReviewFor(c){
  return DEAL_OUTCOME_REVIEWS.find(review=>review.customerId===c.id);
}

function postSaleHandoffFor(c){
  return POST_SALE_HANDOFFS.find(handoff=>handoff.customerId===c.id);
}

function meetingPlanFor(c){
  return MEETING_PLANS.find(meeting=>meeting.customerId===c.id);
}

function identityRecordFor(c){
  return IDENTITY_RESOLUTION_QUEUE.find(record=>record.customerId===c.id);
}

function savedViewMatches(c,viewId){
  const stage=customerStage(c);
  const tags=c.tags||[c.tag];
  if(viewId==='today') return c.nextAction?.priority?.includes('今日') || stage==='human_takeover' || !!identityRecordFor(c);
  if(viewId==='first-contact') return stage==='first_contact_due';
  if(viewId==='missing-fields') return stage==='needs_discovery' || tags.some(tag=>tag.includes('待补')||tag.includes('认证'));
  if(viewId==='takeover') return stage==='human_takeover' || stage==='quote_ready' || (c.intent_level==='high' && c.nextAction?.priority?.includes('今日'));
  if(viewId==='reorder') return stage==='won' || tags.some(tag=>tag.includes('老客户')||tag.includes('复购')||tag.includes('已成交')) || c.tag==='老客户';
  return true;
}

function activitiesFor(c){
  return CUSTOMER_ACTIVITY_TIMELINE[c.id] || TIMELINE.map(item=>({
    ...item,
    source:'CRM',
    owner:'系统',
    status:item.type==='guard' ? 'risk' : 'done',
  }));
}

function planHealthMeta(health){
  if(health==='good') return {label:'健康', cls:'good', color:'var(--green)'};
  if(health==='watch') return {label:'关注', cls:'warn', color:'var(--orange)'};
  if(health==='risk') return {label:'高风险', cls:'bad', color:'var(--red)'};
  return {label:'未评估', cls:'neutral', color:'var(--text-2)'};
}

function milestoneMeta(status){
  if(status==='done') return {label:'完成', icon:'check', cls:'done'};
  if(status==='active') return {label:'进行中', icon:'clock', cls:'active'};
  if(status==='blocked') return {label:'阻塞', icon:'alert', cls:'blocked'};
  return {label:'待办', icon:'calendar', cls:'pending'};
}

function exitMeta(status){
  if(status==='done') return {label:'已满足', cls:'done'};
  if(status==='gap') return {label:'缺口', cls:'gap'};
  return {label:'待确认', cls:'pending'};
}

function inspectionSeverityMeta(severity){
  if(severity==='bad') return {label:'阻塞', cls:'bad', icon:'alert'};
  if(severity==='warn') return {label:'关注', cls:'warn', icon:'clock'};
  return {label:'健康', cls:'good', icon:'check'};
}

function assetStatusMeta(status){
  if(status==='ready') return {label:'可分享', cls:'ready', icon:'check'};
  if(status==='review') return {label:'待确认', cls:'review', icon:'clock'};
  if(status==='blocked') return {label:'隐藏', cls:'blocked', icon:'shield'};
  return {label:'待补', cls:'pending', icon:'alert'};
}

function outcomeMeta(outcome){
  if(outcome==='won') return {label:'赢单', cls:'good', icon:'trophy', color:'var(--green)'};
  if(outcome==='expansion') return {label:'复购扩展', cls:'good', icon:'refresh', color:'var(--green)'};
  if(outcome==='lost') return {label:'丢单', cls:'bad', icon:'xCircle', color:'var(--red)'};
  if(outcome==='at_risk') return {label:'风险复盘', cls:'bad', icon:'alert', color:'var(--red)'};
  if(outcome==='open_gap') return {label:'需求缺口', cls:'warn', icon:'clock', color:'var(--orange)'};
  return {label:'待复盘', cls:'neutral', icon:'doc', color:'var(--text-2)'};
}

function handoffMeta(status){
  if(status==='active') return {label:'交付中', cls:'good', icon:'package', color:'var(--green)'};
  if(status==='watch') return {label:'待确认', cls:'warn', icon:'clock', color:'var(--orange)'};
  if(status==='blocked') return {label:'阻塞', cls:'bad', icon:'alert', color:'var(--red)'};
  return {label:'待交接', cls:'neutral', icon:'doc', color:'var(--text-2)'};
}

function handoffStepMeta(status){
  if(status==='done') return {label:'完成', cls:'done', icon:'check'};
  if(status==='active') return {label:'进行中', cls:'active', icon:'clock'};
  if(status==='blocked') return {label:'阻塞', cls:'blocked', icon:'alert'};
  return {label:'待办', cls:'pending', icon:'calendar'};
}

function meetingMeta(status){
  if(status==='booked') return {label:'已预约', cls:'good', icon:'calendar', color:'var(--green)'};
  if(status==='needs_booking') return {label:'待约会面', cls:'warn', icon:'clock', color:'var(--orange)'};
  if(status==='blocked') return {label:'阻塞', cls:'bad', icon:'alert', color:'var(--red)'};
  return {label:'待安排', cls:'neutral', icon:'calendar', color:'var(--text-2)'};
}

function identityMeta(status){
  if(status==='merge_ready') return {label:'可合并', cls:'good', icon:'checkCircle', color:'var(--green)'};
  if(status==='needs_review') return {label:'需复核', cls:'bad', icon:'alert', color:'var(--red)'};
  if(status==='watch') return {label:'观察', cls:'warn', icon:'eye', color:'var(--orange)'};
  return {label:'待判断', cls:'neutral', icon:'shield', color:'var(--text-2)'};
}

function savedViewMeta(status){
  if(status==='bad') return {cls:'bad', color:'var(--red)', label:'高风险'};
  if(status==='warn') return {cls:'warn', color:'var(--orange)', label:'待推进'};
  if(status==='good') return {cls:'good', color:'var(--green)', label:'健康'};
  return {cls:'hot', color:'var(--primary)', label:'重点'};
}

function SavedViewsPanel({views, activeId, counts, onSelect}){
  const activeView=views.find(view=>view.id===activeId) || views[0];
  return (
    <section className="saved-view-panel">
      <div className="saved-view-head">
        <div>
          <h2>保存视图与工作队列</h2>
          <p>把常用筛选保存成业务员每天能直接处理的队列：首联、补字段、人工接管、复购窗口各看各的。</p>
        </div>
        <div className="saved-view-focus">
          <span>当前视图</span>
          <b>{activeView.title}</b>
        </div>
      </div>
      <div className="saved-view-grid">
        {views.map(view=>{
          const meta=savedViewMeta(view.status);
          return (
            <button key={view.id} className={`saved-view-card ${meta.cls} ${activeId===view.id?'active':''}`} onClick={()=>onSelect(view.id)}>
              <div className="row spread" style={{gap:10}}>
                <span className="saved-view-icon"><Icon name={view.icon} size={16}/></span>
                <span className="saved-view-count">{counts[view.id]||0}</span>
              </div>
              <b>{view.title}</b>
              <p>{view.goal}</p>
              <div className="saved-view-meta">
                <span>{view.owner}</span>
                <span>{view.scope}</span>
                <span style={{color:meta.color}}>{meta.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="saved-view-detail">
        <div>
          <span>筛选条件</span>
          <b>{activeView.query}</b>
        </div>
        <div>
          <span>关键列</span>
          <b>{activeView.columns.join(' / ')}</b>
        </div>
        <div>
          <span>批量动作</span>
          <b>{activeView.action}</b>
        </div>
      </div>
    </section>
  );
}

function BulkActionBar({selected, activeLabel, notice, onAction, onClear}){
  const disabled=selected.length===0;
  const selectedNames=selected.slice(0,3).map(customer=>customer.company).join(' / ');
  const selectedText=selected.length>3 ? `${selectedNames} 等 ${selected.length} 个客户` : selectedNames;
  return (
    <div className={`crm-bulk-bar ${disabled?'idle':'active'}`}>
      <div className="crm-bulk-main">
        <span className="crm-bulk-icon"><Icon name={disabled?'list':'checkCircle'} size={15}/></span>
        <div>
          <b>{disabled ? '选中客户后批量推进' : `已选 ${selected.length} 个客户`}</b>
          <span>{disabled ? `${activeLabel} · 支持分配、任务、接管和导出` : `${activeLabel} · ${selectedText}`}</span>
        </div>
      </div>
      <div className="crm-bulk-actions">
        <button className="btn btn-sec btn-sm" disabled={disabled} onClick={()=>onAction('生成跟进任务')}><Icon name="clock" size={14}/>生成跟进任务</button>
        <button className="btn btn-sec btn-sm" disabled={disabled} onClick={()=>onAction('分配负责人')}><Icon name="users" size={14}/>分配负责人</button>
        <button className="btn btn-sec btn-sm" disabled={disabled} onClick={()=>onAction('标记人工接管')}><Icon name="hand" size={14}/>标记人工接管</button>
        <button className="btn btn-sec btn-sm" disabled={disabled} onClick={()=>onAction('导出选中')}><Icon name="download" size={14}/>导出选中</button>
        <button className="btn btn-ghost btn-sm" disabled={disabled} onClick={onClear}><Icon name="x" size={14}/>清空</button>
      </div>
      {notice&&<div className="crm-bulk-notice"><Icon name="checkCircle" size={14}/><span>{notice}</span></div>}
    </div>
  );
}

function activityMeta(type,status){
  const byType={
    meeting:{label:'会面', icon:'calendar'},
    task:{label:'任务', icon:'clock'},
    message:{label:'消息', icon:'message'},
    quote:{label:'报价准备', icon:'doc'},
    guard:{label:'护栏', icon:'shield'},
    screen:{label:'初筛', icon:'shieldCheck'},
    identity:{label:'身份复核', icon:'users'},
    deal:{label:'成交', icon:'trophy'},
    visit:{label:'访问', icon:'eye'},
    note:{label:'备注', icon:'edit'},
    in:{label:'入站', icon:'inbox'},
    ai:{label:'AI', icon:'bot'},
  };
  const base=byType[type]||{label:'活动', icon:'clock'};
  if(status==='risk') return {...base, cls:'bad', color:'var(--red)'};
  if(status==='upcoming') return {...base, cls:'warn', color:'var(--orange)'};
  if(status==='open') return {...base, cls:'neutral', color:'var(--primary)'};
  return {...base, cls:'good', color:'var(--green)'};
}

function ActivityTimelineCard({customer, activities}){
  const upcoming=activities.filter(item=>item.status==='upcoming').length;
  const risk=activities.filter(item=>item.status==='risk').length;
  const open=activities.filter(item=>item.status==='open').length;
  const channelCount=new Set(activities.map(item=>item.source)).size;
  return (
    <div className="activity-timeline-card">
      <div className="activity-timeline-head">
        <div>
          <span className="field-label">客户活动时间线</span>
          <h3>{customer.company} 的沟通、任务和系统变更</h3>
          <p>按客户聚合消息、会面、任务、身份复核、报价准备和成交动作；不同客户不再共享同一条演示时间线。</p>
        </div>
        <div className="activity-timeline-score">
          <b>{activities.length}</b>
          <span>活动记录</span>
        </div>
      </div>
      <div className="activity-summary-grid">
        <span>待处理 {upcoming}</span>
        <span>风险 {risk}</span>
        <span>进行中 {open}</span>
        <span>来源 {channelCount}</span>
      </div>
      <div className="activity-list">
        {activities.map((item,index)=>{
          const meta=activityMeta(item.type,item.status);
          return (
            <div key={`${item.time}-${item.text}-${index}`} className={`activity-row ${meta.cls}`}>
              <span className="activity-dot"><Icon name={meta.icon} size={13}/></span>
              <div className="activity-body">
                <div className="activity-meta">
                  <span>{item.time}</span>
                  <span>{meta.label}</span>
                  <span>{item.source}</span>
                  <span>{item.owner}</span>
                </div>
                <p>{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="activity-actions">
        <button className="btn btn-sec btn-sm"><Icon name="phone" size={14}/>记录电话</button>
        <button className="btn btn-sec btn-sm"><Icon name="clock" size={14}/>新建任务</button>
        <button className="btn btn-sec btn-sm"><Icon name="mail" size={14}/>发邮件</button>
      </div>
    </div>
  );
}

function IdentityResolutionCard({record}){
  if(!record) return (
    <div className="identity-card muted">
      <div className="identity-card-head">
        <div>
          <span className="field-label">客户身份与来源</span>
          <h3>暂无重复或身份冲突</h3>
          <p>有新的表单、Facebook 或邮件命中相同公司时，再提示是否合并到当前客户。</p>
        </div>
        <span className="badge badge-grey">无待办</span>
      </div>
    </div>
  );
  const meta=identityMeta(record.status);
  return (
    <div className={`identity-card ${meta.cls}`}>
      <div className="identity-card-head">
        <div>
          <span className="field-label">客户身份与来源</span>
          <h3>{record.company} · {meta.label}</h3>
          <p>{record.action}</p>
        </div>
        <div className="identity-confidence">
          <Icon name={meta.icon} size={15}/>
          <b>{record.confidence}%</b>
          <span>匹配置信度</span>
        </div>
      </div>
      <div className="identity-source-grid">
        <div>
          <span>主档案</span>
          <b>{record.primary}</b>
        </div>
        <div>
          <span>新来源</span>
          <b>{record.incoming}</b>
        </div>
      </div>
      <div className="identity-evidence-list">
        {record.evidence.map(item=>(
          <span key={item}><Icon name="check" size={12}/>{item}</span>
        ))}
      </div>
      <div className="identity-conflict-box">
        <b>待人工确认</b>
        {record.conflicts.map(item=><span key={item}>{item}</span>)}
      </div>
      <div className="identity-next-row">
        <Icon name="arrowRight" size={14}/>
        <span>{record.nextAction}</span>
      </div>
    </div>
  );
}

function IdentityResolutionPanel({records}){
  const review=records.filter(record=>record.status==='needs_review').length;
  const mergeReady=records.filter(record=>record.status==='merge_ready').length;
  const conflicts=records.reduce((sum,record)=>sum+(record.conflicts?.length||0),0);
  const avg=Math.round(records.reduce((sum,record)=>sum+record.confidence,0)/records.length);
  return (
    <section className="identity-panel">
      <div className="identity-panel-head">
        <div>
          <span className="field-label">身份去重与合并复核</span>
          <h2>先确认“是不是同一个客户”，再分配跟进和建档</h2>
          <p>Facebook 留资、表单、Email 和 WhatsApp 很容易把同一买家拆成多个客户。成熟 CRM 会先暴露匹配证据、冲突字段和合并动作，避免重复触达。</p>
        </div>
        <span className="badge badge-pri">{records.length} 条待处理身份线索</span>
      </div>
      <div className="identity-metric-grid">
        <div className="identity-metric bad"><b>{review}</b><span>需人工复核</span></div>
        <div className="identity-metric good"><b>{mergeReady}</b><span>可自动合并</span></div>
        <div className="identity-metric warn"><b>{conflicts}</b><span>冲突字段</span></div>
        <div className="identity-metric"><b>{avg}%</b><span>平均置信度</span></div>
      </div>
      <div className="identity-review-list">
        {records.map(record=>{
          const meta=identityMeta(record.status);
          return (
            <div key={record.id} className={`identity-review-row ${meta.cls}`}>
              <div className="identity-review-main">
                <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                  <span className={`identity-dot ${meta.cls}`}><Icon name={meta.icon} size={13}/></span>
                  <b className="ellipsis">{record.company}</b>
                  <span className={`badge ${meta.cls==='good'?'badge-green':meta.cls==='bad'?'badge-red':'badge-pri'}`}>{meta.label}</span>
                </div>
                <p>{record.primary} ↔ {record.incoming}</p>
                <div className="identity-review-meta">
                  <span>{record.owner}</span>
                  <span>{record.priority}优先级</span>
                  <span>{record.confidence}% 置信度</span>
                </div>
              </div>
              <div className="identity-review-action">
                <b>{record.evidence.slice(0,2).join(' / ')}</b>
                <span>{record.nextAction}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EnablementPackPanel({pack}){
  if(!pack) return (
    <div className="enablement-pack-panel muted">
      <div className="enablement-pack-head">
        <div>
          <span className="field-label">买方资料包</span>
          <h3>尚未生成共享资料</h3>
          <p>当客户进入需求确认或强意向阶段后，再按买方任务整理规格、认证、案例和下一步。</p>
        </div>
        <span className="badge badge-grey">待创建</span>
      </div>
    </div>
  );
  const readyCount=pack.assets.filter(asset=>asset.status==='ready').length;
  const blockedCount=pack.assets.filter(asset=>asset.status==='blocked').length;
  return (
    <div className={`enablement-pack-panel ${pack.status==='ready'?'good':'warn'}`}>
      <div className="enablement-pack-head">
        <div>
          <span className="field-label">买方资料包</span>
          <h3>{pack.title}</h3>
          <p>{pack.nextAction}</p>
        </div>
        <div className="enablement-score">
          <b>{pack.readiness}</b>
          <span>{pack.buyerJob}</span>
        </div>
      </div>
      <div className="enablement-policy">
        <Icon name="shieldCheck" size={14}/>
        <span>{pack.sharePolicy}</span>
      </div>
      <div className="enablement-engagement-grid">
        <span><b>{pack.engagement.opens}</b> 打开</span>
        <span><b>{pack.engagement.shares}</b> 转发</span>
        <span><b>{readyCount}</b> 可分享</span>
        <span><b>{blockedCount}</b> 隐藏</span>
      </div>
      <div className="enablement-hot-row">
        <Icon name="eye" size={14}/>
        <span>{pack.engagement.last} · {pack.engagement.hot}</span>
      </div>
      <div className="enablement-asset-grid">
        {pack.assets.map(asset=>{
          const meta=assetStatusMeta(asset.status);
          return (
            <div key={`${pack.customerId}-${asset.label}`} className={`enablement-asset ${meta.cls}`}>
              <div className="row spread" style={{gap:8}}>
                <span className="row gap2" style={{minWidth:0}}>
                  <Icon name={meta.icon} size={14}/>
                  <b>{asset.label}</b>
                </span>
                <em>{meta.label}</em>
              </div>
              <p>{asset.type} · {asset.note}</p>
            </div>
          );
        })}
      </div>
      <div className="enablement-actions">
        <button className="btn btn-sec btn-sm"><Icon name="attach" size={14}/>复制资料链接</button>
        <button className="btn btn-pri btn-sm"><Icon name="send" size={14}/>生成跟进草稿</button>
      </div>
    </div>
  );
}

function MeetingPlanCard({meeting}){
  if(!meeting) return (
    <div className="meeting-plan-card muted">
      <div className="meeting-plan-head">
        <div>
          <span className="field-label">下一次会面</span>
          <h3>尚未安排关键会面</h3>
          <p>进入强意向、需求确认或报价准备后，再生成会前议程、参会人和资料清单。</p>
        </div>
        <span className="badge badge-grey">待安排</span>
      </div>
    </div>
  );
  const meta=meetingMeta(meeting.status);
  const missing=meeting.participants.filter(person=>person.state.includes('待')||person.state.includes('未')).length;
  return (
    <div className={`meeting-plan-card ${meta.cls}`}>
      <div className="meeting-plan-head">
        <div>
          <span className="field-label">下一次会面</span>
          <h3>{meeting.title}</h3>
          <p>{meeting.nextAction}</p>
        </div>
        <div className="meeting-plan-score">
          <Icon name={meta.icon} size={15}/>
          <b>{meta.label}</b>
          <span>{meeting.priority}优先级</span>
        </div>
      </div>
      <div className="meeting-plan-meta">
        <span><Icon name="calendar" size={14}/>{meeting.scheduledAt}</span>
        <span><Icon name="globe" size={14}/>{meeting.timezone}</span>
        <span><Icon name="message" size={14}/>{meeting.channel}</span>
        <span><Icon name="target" size={14}/>{meeting.buyerTask}</span>
      </div>
      <div className="meeting-participant-grid">
        {meeting.participants.map(person=>(
          <div key={`${meeting.customerId}-${person.name}`} className={person.state.includes('已')||person.state.includes('可')?'good':'warn'}>
            <b>{person.name}</b>
            <span>{person.role}</span>
            <em>{person.state}</em>
          </div>
        ))}
      </div>
      <div className="meeting-agenda-grid">
        <div>
          <span>会议议程</span>
          {meeting.agenda.map(item=><p key={item}>{item}</p>)}
        </div>
        <div>
          <span>会前准备</span>
          {meeting.prep.map(item=><p key={item}>{item}</p>)}
        </div>
      </div>
      <div className="meeting-risk-row">
        <Icon name="alert" size={14}/>
        <span>{missing>0 ? `仍有 ${missing} 个参会角色待确认。` : '参会角色已基本确认。'}{meeting.risk}</span>
      </div>
      <div className="meeting-actions">
        <button className="btn btn-sec btn-sm"><Icon name="attach" size={14}/>复制预约链接</button>
        <button className="btn btn-pri btn-sm"><Icon name="send" size={14}/>生成会前邮件</button>
      </div>
    </div>
  );
}

function MeetingPlanPanel({meetings}){
  const booked=meetings.filter(meeting=>meeting.status==='booked').length;
  const needsBooking=meetings.filter(meeting=>meeting.status==='needs_booking').length;
  const missingRoles=meetings.reduce((sum,meeting)=>sum+meeting.participants.filter(person=>person.state.includes('待')||person.state.includes('未')).length,0);
  const today=meetings.filter(meeting=>meeting.scheduledAt.includes('今天')).length;
  return (
    <section className="meeting-board-panel">
      <div className="meeting-board-head">
        <div>
          <span className="field-label">会面与下一活动</span>
          <h2>把关键人工互动变成可准备、可追踪的销售动作</h2>
          <p>外贸 B 端的高风险节点不能只靠聊天记录推进；系统应明确下一次会面、参会角色、议程、资料和不可承诺边界。</p>
        </div>
        <span className="badge badge-pri">{meetings.length} 个会面计划</span>
      </div>
      <div className="meeting-board-grid">
        <div className="meeting-board-metric good"><b>{booked}</b><span>已预约</span></div>
        <div className="meeting-board-metric warn"><b>{needsBooking}</b><span>待约会面</span></div>
        <div className="meeting-board-metric bad"><b>{missingRoles}</b><span>参会角色缺口</span></div>
        <div className="meeting-board-metric"><b>{today}</b><span>今天需确认</span></div>
      </div>
      <div className="meeting-board-list">
        {meetings.map(meeting=>{
          const meta=meetingMeta(meeting.status);
          const missing=meeting.participants.filter(person=>person.state.includes('待')||person.state.includes('未')).length;
          return (
            <div key={meeting.customerId} className={`meeting-board-row ${meta.cls}`}>
              <div className="meeting-board-main">
                <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                  <span className={`meeting-dot ${meta.cls}`}><Icon name={meta.icon} size={13}/></span>
                  <b className="ellipsis">{meeting.company}</b>
                  <span className={`badge ${meta.cls==='good'?'badge-green':meta.cls==='bad'?'badge-red':'badge-pri'}`}>{meta.label}</span>
                </div>
                <p>{meeting.title} · {meeting.nextAction}</p>
                <div className="meeting-board-meta">
                  <span>{meeting.scheduledAt}</span>
                  <span>{meeting.owner}</span>
                  <span>{meeting.buyerTask}</span>
                </div>
              </div>
              <div className="meeting-board-check">
                <b>{missing>0?`${missing} 个角色待确认`:'角色就绪'}</b>
                <span>{meeting.agenda.slice(0,2).join(' / ')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OutcomeReviewCard({review}){
  if(!review) return (
    <div className="outcome-review-card muted">
      <div className="outcome-review-head">
        <div>
          <span className="field-label">成交/丢单复盘</span>
          <h3>尚未形成结果闭环</h3>
          <p>客户成交、丢单、无决策或进入复购窗口后，再记录原因和下一步。</p>
        </div>
        <span className="badge badge-grey">待记录</span>
      </div>
    </div>
  );
  const meta=outcomeMeta(review.outcome);
  return (
    <div className={`outcome-review-card ${meta.cls}`}>
      <div className="outcome-review-head">
        <div>
          <span className="field-label">成交/丢单复盘</span>
          <h3>{review.title}</h3>
          <p>{review.reason}</p>
        </div>
        <div className="outcome-review-score">
          <Icon name={meta.icon} size={15}/>
          <b>{meta.label}</b>
          <span>{review.closedAt}</span>
        </div>
      </div>
      <div className="outcome-review-meta">
        <span><Icon name="user" size={14}/>{review.owner}</span>
        <span><Icon name="calendar" size={14}/>{review.nextDate}</span>
        <span><Icon name="target" size={14}/>{review.playbook}</span>
        <span><Icon name="dollar" size={14}/>{review.value>0?fmtMoney(review.value):'培育'}</span>
      </div>
      <div className="outcome-evidence-list">
        {review.evidence.map(item=><span key={`${review.company}-${item}`}><Icon name="check" size={13}/>{item}</span>)}
      </div>
      <div className="outcome-next-row">
        <Icon name="refresh" size={14}/>
        <span>{review.feedbackLoop}</span>
      </div>
      <div className="outcome-next-action">
        <b>下一步</b>
        <span>{review.nextStep}</span>
      </div>
    </div>
  );
}

function OutcomeLearningPanel({reviews}){
  const closed=reviews.filter(review=>review.outcome==='won'||review.outcome==='lost').length;
  const atRisk=reviews.filter(review=>review.outcome==='at_risk'||review.outcome==='open_gap').length;
  const expansion=reviews.filter(review=>review.outcome==='expansion'||review.nextStep.includes('复购')).length;
  const today=reviews.filter(review=>review.nextDate.includes('今天')).length;
  return (
    <section className="outcome-learning-panel">
      <div className="outcome-learning-head">
        <div>
          <span className="field-label">生命周期闭环</span>
          <h2>把赢单、丢单和复购原因回写到系统</h2>
          <p>成熟 CRM 不只记录客户在哪个阶段，还要记录为什么赢、为什么丢、何时复购，以及这些经验如何更新跟进规则。</p>
        </div>
        <span className="badge badge-pri">{reviews.length} 条复盘</span>
      </div>
      <div className="outcome-learning-grid">
        <div className="outcome-learning-metric good"><b>{closed}</b><span>已关闭结果</span></div>
        <div className="outcome-learning-metric bad"><b>{atRisk}</b><span>待处理风险</span></div>
        <div className="outcome-learning-metric good"><b>{expansion}</b><span>复购窗口</span></div>
        <div className="outcome-learning-metric warn"><b>{today}</b><span>今天要回写</span></div>
      </div>
      <div className="outcome-learning-list">
        {reviews.map(review=>{
          const meta=outcomeMeta(review.outcome);
          return (
            <div key={`${review.customerId||review.company}-${review.outcome}`} className={`outcome-learning-row ${meta.cls}`}>
              <div className="outcome-learning-main">
                <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                  <span className={`outcome-dot ${meta.cls}`}><Icon name={meta.icon} size={13}/></span>
                  <b className="ellipsis">{review.company}</b>
                  <span className={`badge ${meta.cls==='bad'?'badge-red':meta.cls==='good'?'badge-green':'badge-pri'}`}>{meta.label}</span>
                </div>
                <p>{review.reason}</p>
                <div className="outcome-learning-meta">
                  <span>{review.owner}</span>
                  <span>{review.nextDate}</span>
                  <span>{review.playbook}</span>
                </div>
              </div>
              <div className="outcome-learning-loop">
                <b>回写动作</b>
                <span>{review.feedbackLoop}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PostSaleHandoffPanel({handoffs}){
  const active=handoffs.filter(item=>item.status==='active').length;
  const blocked=handoffs.filter(item=>item.status==='blocked'||item.milestones.some(step=>step.status==='blocked')).length;
  const pendingDocs=handoffs.reduce((sum,item)=>sum+item.documents.filter(doc=>doc.status!=='done').length,0);
  const paymentWatch=handoffs.filter(item=>item.payment.includes('待')||item.payment.includes('账期')).length;
  return (
    <section className="post-sale-panel">
      <div className="post-sale-head">
        <div>
          <span className="field-label">成交后交接</span>
          <h2>把销售承诺交给交付、单证和收款</h2>
          <p>外贸成交后不是结束。销售订单、定金尾款、排产、验货、订舱、商业发票和提单都要跟客户档案连在一起，避免赢单后断档。</p>
        </div>
        <span className="badge badge-pri">{handoffs.length} 个交接项</span>
      </div>
      <div className="post-sale-metric-grid">
        <div className="post-sale-metric good"><b>{active}</b><span>交付推进中</span></div>
        <div className="post-sale-metric bad"><b>{blocked}</b><span>审批/承诺阻塞</span></div>
        <div className="post-sale-metric warn"><b>{pendingDocs}</b><span>待补单证</span></div>
        <div className="post-sale-metric warn"><b>{paymentWatch}</b><span>收款/账期待盯</span></div>
      </div>
      <div className="post-sale-list">
        {handoffs.map(item=>{
          const meta=handoffMeta(item.status);
          const nextMilestone=item.milestones.find(step=>step.status==='active'||step.status==='blocked') || item.milestones.find(step=>step.status==='pending');
          return (
            <div key={item.customerId} className={`post-sale-row ${meta.cls}`}>
              <div className="post-sale-main">
                <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                  <span className={`post-sale-dot ${meta.cls}`}><Icon name={meta.icon} size={13}/></span>
                  <b className="ellipsis">{item.company}</b>
                  <span className={`badge ${meta.cls==='bad'?'badge-red':meta.cls==='good'?'badge-green':'badge-pri'}`}>{meta.label}</span>
                </div>
                <p>{item.nextAction}</p>
                <div className="post-sale-meta">
                  <span>{item.orderNo}</span>
                  <span>销售 {item.owner}</span>
                  <span>交付 {item.opsOwner}</span>
                  <span>{fmtMoney(item.value)}</span>
                </div>
              </div>
              <div className="post-sale-side">
                <div>
                  <b>当前节点</b>
                  <span>{item.stage} · {nextMilestone?.due || '待排期'}</span>
                </div>
                <div>
                  <b>收款 / ETA</b>
                  <span>{item.payment} · {item.eta}</span>
                </div>
                <div className="post-sale-docs">
                  {item.documents.map(doc=>{
                    const docMeta=handoffStepMeta(doc.status);
                    return <span key={`${item.customerId}-${doc.label}`} className={docMeta.cls}>{doc.label}</span>;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PostSaleHandoffCard({handoff}){
  if(!handoff) return (
    <div className="post-sale-card muted">
      <div className="post-sale-card-head">
        <div>
          <span className="field-label">成交后交接</span>
          <h3>尚未进入订单交付阶段</h3>
          <p>客户确认 PI 或首批 PO 后，再创建销售订单、收款、排产、验货和单证节点。</p>
        </div>
        <span className="badge badge-grey">待创建</span>
      </div>
    </div>
  );
  const meta=handoffMeta(handoff.status);
  return (
    <div className={`post-sale-card ${meta.cls}`}>
      <div className="post-sale-card-head">
        <div>
          <span className="field-label">成交后交接</span>
          <h3>{handoff.orderNo} · {handoff.stage}</h3>
          <p>{handoff.nextAction}</p>
        </div>
        <div className="post-sale-score">
          <Icon name={meta.icon} size={15}/>
          <b>{meta.label}</b>
          <span>{fmtMoney(handoff.value)}</span>
        </div>
      </div>
      <div className="post-sale-card-meta">
        <span><Icon name="user" size={14}/>销售 {handoff.owner}</span>
        <span><Icon name="package" size={14}/>交付 {handoff.opsOwner}</span>
        <span><Icon name="dollar" size={14}/>{handoff.payment}</span>
        <span><Icon name="calendar" size={14}/>{handoff.eta}</span>
      </div>
      <div className="post-sale-milestone-list">
        {handoff.milestones.map(step=>{
          const stepMeta=handoffStepMeta(step.status);
          return (
            <div key={`${handoff.customerId}-${step.label}`} className={`post-sale-step ${stepMeta.cls}`}>
              <span className="post-sale-step-icon"><Icon name={stepMeta.icon} size={13}/></span>
              <div>
                <div className="row spread" style={{gap:8}}>
                  <b>{step.label}</b>
                  <em>{step.due}</em>
                </div>
                <p>{step.owner} · {step.note}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="post-sale-doc-row">
        {handoff.documents.map(doc=>{
          const docMeta=handoffStepMeta(doc.status);
          return <span key={`${handoff.customerId}-${doc.label}`} className={docMeta.cls}>{doc.label}<b>{docMeta.label}</b></span>;
        })}
      </div>
      <div className="post-sale-risk-row">
        <Icon name="alert" size={14}/>
        <span>{handoff.risk}</span>
      </div>
    </div>
  );
}

function PipelineInspectionPanel({plans}){
  const issuePlans=plans.filter(plan=>(plan.inspection?.flags||[]).length>0);
  const blocked=plans.filter(plan=>(plan.inspection?.flags||[]).some(flag=>flag.severity==='bad')).length;
  const noActivity=plans.filter(plan=>plan.inspection?.nextActivity==='未安排').length;
  const weekValue=plans
    .filter(plan=>plan.inspection?.closeDateStatus==='本周'||plan.inspection?.closeDateStatus==='待重估')
    .reduce((sum,plan)=>sum+plan.value,0);
  const healthy=plans.filter(plan=>(plan.inspection?.flags||[]).length===0).length;
  return (
    <section className="pipeline-inspection-panel">
      <div className="pipeline-inspection-head">
        <div>
          <span className="field-label">销售管道健康</span>
          <h2>别让计划变成虚假预测</h2>
          <p>集中检查卡在阶段太久、无下一步活动、成交日需要重估和风险没有动作的计划。</p>
        </div>
        <span className="badge badge-pri">{plans.length} 个成交计划</span>
      </div>
      <div className="pipeline-inspection-grid">
        <div className="pipeline-inspection-metric bad"><b>{blocked}</b><span>阻塞计划</span></div>
        <div className="pipeline-inspection-metric warn"><b>{noActivity}</b><span>无下一步</span></div>
        <div className="pipeline-inspection-metric good"><b>{healthy}</b><span>健康推进</span></div>
        <div className="pipeline-inspection-metric"><b>{fmtMoney(weekValue)}</b><span>本周需复盘金额</span></div>
      </div>
      <div className="pipeline-issue-list">
        {issuePlans.map(plan=>{
          const health=planHealthMeta(plan.health);
          return (
            <div key={plan.customerId} className={`pipeline-issue-row ${health.cls}`}>
              <div className="pipeline-issue-main">
                <div className="row gap2" style={{minWidth:0,flexWrap:'wrap'}}>
                  <b className="ellipsis">{plan.title}</b>
                  <span className={`badge ${health.cls==='bad'?'badge-red':health.cls==='warn'?'badge-pri':'badge-grey'}`}>{health.label}</span>
                </div>
                <p>{plan.inspection.guidedAction}</p>
                <div className="pipeline-issue-meta">
                  <span>最近：{plan.inspection.lastActivity}</span>
                  <span>下步：{plan.inspection.nextActivity}</span>
                  <span>阶段：{plan.inspection.stageAge}</span>
                </div>
              </div>
              <div className="pipeline-flag-list">
                {plan.inspection.flags.map(flag=>{
                  const meta=inspectionSeverityMeta(flag.severity);
                  return (
                    <span key={`${plan.customerId}-${flag.label}`} className={meta.cls}>
                      <Icon name={meta.icon} size={13}/>
                      <b>{flag.label}</b>
                      <em>{flag.detail}</em>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DealPlanPanel({plan}){
  if(!plan) return (
    <div className="deal-plan-panel muted">
      <div className="buying-group-head">
        <div>
          <span className="field-label">成交行动计划</span>
          <h3>尚未进入可承诺成交计划阶段</h3>
          <p>需求、决策人和时间窗口明确后，再生成双方认可的下一步计划。</p>
        </div>
        <span className="badge badge-grey">待创建</span>
      </div>
    </div>
  );
  const health=planHealthMeta(plan.health);
  return (
    <div className={`deal-plan-panel ${health.cls}`}>
      <div className="deal-plan-head">
        <div>
          <span className="field-label">成交行动计划</span>
          <h3>{plan.title}</h3>
          <p>{plan.nextAction}</p>
        </div>
        <div className="deal-plan-score">
          <b>{health.label}</b>
          <span>{plan.forecast}</span>
        </div>
      </div>
      <div className="deal-plan-meta">
        <span><Icon name="target" size={14}/>{fmtMoney(plan.value)}</span>
        <span><Icon name="calendar" size={14}/>{plan.targetClose}</span>
        <span><Icon name="user" size={14}/>{plan.owner}</span>
        <span><Icon name="checkCircle" size={14}/>{plan.buyerJob}</span>
      </div>
      {plan.inspection&&(
        <div className="deal-inspection-strip">
          <span>最近 {plan.inspection.lastActivity}</span>
          <span>下步 {plan.inspection.nextActivity}</span>
          <span>阶段 {plan.inspection.stageAge}</span>
        </div>
      )}
      <div className="deal-milestone-list">
        {plan.milestones.map(step=>{
          const meta=milestoneMeta(step.status);
          return (
            <div key={`${plan.customerId}-${step.label}`} className={`deal-milestone ${meta.cls}`}>
              <span className="deal-milestone-icon"><Icon name={meta.icon} size={13}/></span>
              <div>
                <div className="row spread" style={{gap:8}}>
                  <b>{step.label}</b>
                  <em>{step.due}</em>
                </div>
                <p>{step.owner} · {step.note}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="deal-exit-grid">
        {plan.exitCriteria.map(item=>{
          const meta=exitMeta(item.status);
          return <span key={item.label} className={meta.cls}><b>{item.label}</b>{meta.label}</span>;
        })}
      </div>
      <div className="deal-risk-row">
        <Icon name="alert" size={14}/>
        <span>{plan.risks.join(' / ')}</span>
      </div>
    </div>
  );
}

/* 客户档案内容（用于右侧抽屉 + CRM 详情） */
function CustomerProfile({c}){
  if(!c) c=CUSTOMERS[0];
  const intent=intentMeta(c);
  const stage=stageMeta(customerStage(c));
  const buying=buyingGroupMeta(c);
  const plan=dealPlanFor(c);
  const pack=enablementPackFor(c);
  const outcome=outcomeReviewFor(c);
  const handoff=postSaleHandoffFor(c);
  const meeting=meetingPlanFor(c);
  const identity=identityRecordFor(c);
  const activities=activitiesFor(c);
  const planHealth=planHealthMeta(plan?.health);
  const packReady=pack ? `${pack.assets.filter(asset=>asset.status==='ready').length}/${pack.assets.length} 可分享` : '待创建';
  const outcomeStatus=outcomeMeta(outcome?.outcome);
  const handoffStatus=handoffMeta(handoff?.status);
  const meetingStatus=meetingMeta(meeting?.status);
  const identityStatus=identityMeta(identity?.status);
  return (
    <div style={{padding:'18px 20px'}}>
        <div className="row gap3" style={{marginBottom:16}}>
        <Avatar name={c.contact} size={48}/>
        <div className="col" style={{minWidth:0}}>
          <div className="row gap2"><span className="h3">{c.company}</span><span className="flag">{c.flag}</span><ValueTier tier={c.vtier}/></div>
          <span className="aux">{c.contact} · {c.country} · <a style={{color:'var(--primary)'}}>{c.domain}</a></span>
          <div className="row gap2" style={{marginTop:7,flexWrap:'wrap'}}>
            <span className="badge" style={{background:'var(--primary-tint)',color:'var(--primary)'}}>{stage.label}</span>
            {(c.tags||[c.tag]).slice(0,3).map(tag=><span key={tag} className="badge badge-grey">{tag}</span>)}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
        {[['关联询盘',c.inquiries],['历史成交',c.deals],['累计金额',c.value>1000?'$'+(c.value/1000).toFixed(0)+'k':'—']].map(([k,v])=>(
          <div key={k} className="col center" style={{padding:'12px 6px',background:'#fafbfc',borderRadius:8,border:'1px solid var(--border-2)'}}>
            <span className="num" style={{fontSize:19,fontWeight:600}}>{v}</span><span className="aux" style={{fontSize:11}}>{k}</span>
          </div>
        ))}
      </div>

      <div className="customer-signal-grid">
        {[
          ['真实性',`${c.grade} 级线索`,c.grade==='A'?'var(--green)':'var(--orange)'],
          ['有效性',validityText(c),validityText(c)==='待验证'?'var(--orange)':'var(--primary)'],
          ['成交概率',intent.label,intent.color],
          ['采购委员会',buying.label,buying.color],
          ['成交计划',plan?planHealth.label:'待创建',planHealth.color],
          ['买方资料包',packReady,pack?.status==='ready'?'var(--green)':'var(--orange)'],
          ['结果闭环',outcome?outcomeStatus.label:'待记录',outcomeStatus.color],
          ['交付交接',handoff?handoffStatus.label:'待创建',handoffStatus.color],
          ['下一会面',meeting?meetingStatus.label:'待安排',meetingStatus.color],
          ['身份复核',identity?identityStatus.label:'无待办',identityStatus.color],
          ['活动记录',`${activities.length} 条`,'var(--tech-deep)'],
          ['下次跟进',c.nextAction?.priority||'待安排','var(--orange)'],
        ].map(([k,v,color])=>(
          <div key={k} className="customer-signal">
            <span>{k}</span>
            <b style={{color}}>{v}</b>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:'12px 14px',marginBottom:16,background:'var(--primary-tint)',border:'1px solid var(--primary-light)'}}>
        <div className="row gap2" style={{marginBottom:4}}><Icon name="building" size={14} style={{color:'var(--primary)'}}/><span className="aux" style={{fontWeight:600,color:'var(--primary)'}}>背调摘要</span></div>
        <div className="aux" style={{color:'var(--text)',lineHeight:1.6}}>{c.note}</div>
      </div>

      {c.nextAction&&(
        <div className="card" style={{padding:'12px 14px',marginBottom:16,
          background:'linear-gradient(135deg,color-mix(in srgb,var(--tech) 12%,transparent),color-mix(in srgb,var(--primary) 6%,transparent))',
          border:'1px solid color-mix(in srgb,var(--tech) 24%,transparent)'}}>
          <div className="row spread" style={{marginBottom:6}}>
            <div className="row gap2"><Icon name="clock" size={14} style={{color:'var(--tech-deep)'}}/><span className="aux" style={{fontWeight:700,color:'var(--tech-deep)'}}>跟进提醒</span></div>
            <span className="badge" style={{fontSize:11,fontWeight:700,color:'#a06916',background:'var(--orange-light)'}}>{c.nextAction.priority}</span>
          </div>
          <div style={{fontSize:13,color:'var(--text)',lineHeight:1.6,marginBottom:4}}>{c.nextAction.script}</div>
          <div className="aux" style={{fontSize:11.5}}>时机 · {c.nextAction.when}</div>
          <div className="row gap2" style={{marginTop:10}}>
            <button className="btn btn-pri btn-sm" style={{flex:1}}><Icon name="check" size={14}/>转为跟进任务</button>
            <button className="btn btn-sec btn-sm"><Icon name="message" size={14}/>进入会话</button>
          </div>
        </div>
      )}

      {c.prefs&&(
        <div style={{marginBottom:16}}>
          <div className="field-label" style={{marginBottom:8}}>偏好画像</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['价格敏感度',c.prefs.price],['账期偏好',c.prefs.terms],['常购品类',c.prefs.category],['关注认证',c.prefs.cert],['语言 · 时区',c.prefs.lang]].map(([k,v])=>(
              <div key={k} className="col" style={{padding:'8px 10px',background:'#fafbfc',borderRadius:8,border:'1px solid var(--border-2)',gap:2}}>
                <span className="aux" style={{fontSize:10.5}}>{k}</span>
                <span style={{fontSize:12.5,fontWeight:600,color:'var(--text)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <IdentityResolutionCard record={identity}/>
      <BuyingGroupPanel group={c.buyingGroup}/>
      <DealPlanPanel plan={plan}/>
      <MeetingPlanCard meeting={meeting}/>
      <OutcomeReviewCard review={outcome}/>
      <PostSaleHandoffCard handoff={handoff}/>
      <EnablementPackPanel pack={pack}/>

      <ActivityTimelineCard customer={c} activities={activities}/>

      <div className="row gap2" style={{marginTop:8}}>
        <button className="btn btn-pri btn-sm" style={{flex:1}}><Icon name="message" size={14}/>进入会话</button>
        <button className="btn btn-sec btn-sm"><Icon name="doc" size={14}/>历史报价</button>
      </div>
    </div>
  );
}

function CRM({api, onOpenProfile}){
  const [customers,setCustomers]=useState(CUSTOMERS);
  useEffect(()=>{
    if(!api) return;
    fetchCustomers(api).then(d=>{ if(d.length) setCustomers(d); }).catch(()=>{});
  },[api]);
  const [active,setActive]=useState('all');
  const [activeViewId,setActiveViewId]=useState('today');
  const [selectedIds,setSelectedIds]=useState([]);
  const [bulkNotice,setBulkNotice]=useState('');
  const stages=[['all','全部'],['first_contact_due','待首次联系'],['needs_discovery','需求确认中'],['strong_intent','强意向'],['human_takeover','人工接管'],['quote_ready','待人工报价'],['followup','跟进中'],['won','成交']];
  const activeView=CRM_SAVED_VIEWS.find(view=>view.id===activeViewId);
  const savedViewCounts=CRM_SAVED_VIEWS.reduce((acc,view)=>{
    acc[view.id]=customers.filter(c=>savedViewMatches(c,view.id)).length;
    return acc;
  },{});
  const list=customers.filter(c=>activeView ? savedViewMatches(c,activeView.id) : (active==='all'||customerStage(c)===active));
  const currentListLabel=activeView?.title || (stages.find(([k])=>k===active)?.[1] || '全部客户');
  const selectedCustomers=list.filter(c=>selectedIds.includes(c.id));
  const allVisibleSelected=list.length>0 && selectedCustomers.length===list.length;
  const visibleIds=list.map(c=>c.id);
  function clearBulkState(){
    setSelectedIds([]);
    setBulkNotice('');
  }
  function selectSavedView(id){
    setActiveViewId(id);
    setActive('all');
    clearBulkState();
  }
  function selectStage(key){
    setActive(key);
    setActiveViewId('');
    clearBulkState();
  }
  function toggleVisibleSelection(){
    setSelectedIds(allVisibleSelected ? [] : visibleIds);
    setBulkNotice('');
  }
  function toggleCustomerSelection(id){
    setSelectedIds(ids=>ids.includes(id) ? ids.filter(item=>item!==id) : [...ids,id]);
    setBulkNotice('');
  }
  function runBulkAction(action){
    if(selectedCustomers.length===0) return;
    const names=selectedCustomers.map(customer=>customer.company).join(' / ');
    setBulkNotice(`${action}已排入当前视图 · ${selectedCustomers.length} 个客户：${names}`);
  }
  const summary=[
    {label:'强意向客户', value:customers.filter(c=>c.intent_level==='high').length, sub:'优先人工接管', icon:'target', color:'var(--green)'},
    {label:'今日需跟进', value:customers.filter(c=>c.nextAction?.priority?.includes('今日')).length, sub:'按时间节点提醒', icon:'clock', color:'var(--orange)'},
    {label:'成交计划', value:DEAL_CLOSE_PLANS.length, sub:'谁做什么、何时完成', icon:'calendar', color:'var(--primary)'},
    {label:'交付交接', value:POST_SALE_HANDOFFS.length, sub:'订单/单证/收款', icon:'package', color:'var(--tech-deep)'},
  ];
  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col"><span className="eyebrow" style={{color:'var(--tech-deep)'}}>Customer lifecycle</span><span className="h1">客户生命周期</span>
            <span className="muted" style={{marginTop:4}}>按阶段、意向、标签和下次跟进管理客户，而不是只围绕报价流转</span></div>
          <button className="btn btn-sec"><Icon name="download" size={16}/>导出 CRM</button>
        </div>

        <div className="crm-summary-grid">
          {summary.map(item=>(
            <button key={item.label} className="crm-summary-card">
              <span style={{color:item.color}}><Icon name={item.icon} size={18}/></span>
              <b>{item.value}</b>
              <span>{item.label}</span>
              <small>{item.sub}</small>
            </button>
          ))}
        </div>

        <IdentityResolutionPanel records={IDENTITY_RESOLUTION_QUEUE}/>
        <SavedViewsPanel
          views={CRM_SAVED_VIEWS}
          activeId={activeView?.id || ''}
          counts={savedViewCounts}
          onSelect={selectSavedView}
        />
        <PipelineInspectionPanel plans={DEAL_CLOSE_PLANS}/>
        <MeetingPlanPanel meetings={MEETING_PLANS}/>
        <OutcomeLearningPanel reviews={DEAL_OUTCOME_REVIEWS}/>
        <PostSaleHandoffPanel handoffs={POST_SALE_HANDOFFS}/>

        <div className="row gap1" style={{marginBottom:16,flexWrap:'wrap'}}>
          {stages.map(([k,l])=>(
            <button key={k} onClick={()=>selectStage(k)} className="badge clickable"
              style={{height:30,padding:'0 14px',background:!activeView&&active===k?'var(--primary)':'#f1f4f7',color:!activeView&&active===k?'#fff':'var(--text-2)',fontWeight:600}}>{l}</button>
          ))}
        </div>

        <div className="crm-view-strip">
          <div>
            <span>当前客户表</span>
            <b>{currentListLabel}</b>
          </div>
          <div>
            <span>匹配客户</span>
            <b>{list.length}</b>
          </div>
          <div>
            <span>下一动作</span>
            <b>{activeView?.action || '查看客户详情'}</b>
          </div>
        </div>

        <BulkActionBar
          selected={selectedCustomers}
          activeLabel={currentListLabel}
          notice={bulkNotice}
          onAction={runBulkAction}
          onClear={clearBulkState}
        />

        <div className="card crm-table-card">
          <table className="tbl">
            <thead>
              <tr>
                <th className="select-col"><input type="checkbox" aria-label="选择当前视图客户" checked={allVisibleSelected} onChange={toggleVisibleSelection}/></th>
                <th>客户</th><th>判断</th><th>生命周期</th><th>下一步</th><th>标签</th><th>金额</th><th>最近活动</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(c=>{
                const stage=stageMeta(customerStage(c));
                const intent=intentMeta(c);
                const buying=buyingGroupMeta(c);
                const selected=selectedIds.includes(c.id);
                return (
                <tr key={c.id} className={`clickable ${selected?'selected':''}`} onClick={()=>onOpenProfile(c)}>
                  <td className="select-col" onClick={(event)=>event.stopPropagation()}>
                    <input type="checkbox" aria-label={`选择 ${c.company}`} checked={selected} onChange={()=>toggleCustomerSelection(c.id)}/>
                  </td>
                  <td>
                    <div className="row gap2"><Avatar name={c.contact} size={30}/>
                      <div className="col"><span className="row gap1" style={{fontWeight:600}}><span className="flag">{c.flag}</span>{c.company}</span>
                        <span className="aux" style={{fontSize:11}}>{c.contact}</span></div></div>
                  </td>
                  <td>
                    <div className="col" style={{gap:5}}>
                      <span className="badge" style={{background:intent.bg,color:intent.color}}>{intent.label}</span>
                      <span className="aux" style={{fontSize:11}}>{validityText(c)} · {c.grade} 级</span>
                      <span className={`buying-mini ${buying.cls}`}><Icon name="users" size={12}/>{buying.label}</span>
                    </div>
                  </td>
                  <td><span className="badge" style={{background:'var(--primary-tint)',color:'var(--primary)'}}>{stage.label}</span></td>
                  <td>
                    <div className="col" style={{gap:4}}>
                      <span style={{fontSize:12.5,fontWeight:700,color:'var(--text)'}}>{c.nextAction?.priority||'待安排'}</span>
                      <span className="aux" style={{fontSize:11}}>{c.nextAction?.when||'无提醒'}</span>
                    </div>
                  </td>
                  <td><div className="tag-wrap">{(c.tags||[c.tag]).slice(0,2).map(tag=><span key={tag} className="badge badge-grey">{tag}</span>)}</div></td>
                  <td className="num" style={{fontWeight:600}}>{c.value>0?fmtMoney(c.value):'—'}</td>
                  <td className="aux">{c.last}</td>
                  <td><Icon name="chevR" size={16} style={{color:'var(--text-3)'}}/></td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export { CustomerProfile, CRM };
