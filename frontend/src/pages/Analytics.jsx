import { useState } from 'react';
import { Icon } from '../icons.jsx';
import { DATA_QUALITY, FORECAST_BOARD, FUNNEL, METRICS, SOURCE_ATTRIBUTION } from '../sampleData.js';
import { Empty, fmtMoney, Ring, SectionTitle, useToast } from '../ui.jsx';

/* ===== analytics.jsx ===== */
/* ============ 数据看板 ============ */
function Analytics({demoMode=false}){
  const toast=useToast();
  if(!demoMode) return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col">
            <span className="eyebrow" style={{color:'var(--tech-deep)'}}>Analytics · 价值度量</span>
            <span className="h1">数据看板</span>
            <span className="muted" style={{marginTop:4}}>当前账号还没有足够真实数据生成看板。</span>
          </div>
          <div className="row gap2">
            <button className="btn btn-sec btn-sm"><Icon name="calendar" size={14}/>近 30 天</button>
            <button className="btn btn-sec btn-sm"><Icon name="download" size={14}/>导出</button>
          </div>
        </div>
        <div className="card">
          <Empty icon="dashboard" title="暂无分析数据" desc="接入渠道并产生真实线索、客户和报价记录后，这里再展示指标。"/>
        </div>
      </div>
    </div>
  );
  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col"><span className="eyebrow" style={{color:'var(--tech-deep)'}}>Analytics · 价值度量</span><span className="h1">数据看板</span>
            <span className="muted" style={{marginTop:4}}>按来源、数据质量和成交结果闭环看线索价值，不只看询盘数量。</span></div>
          <div className="row gap2">
            <button className="btn btn-sec btn-sm"><Icon name="calendar" size={14}/>近 30 天</button>
            <button className="btn btn-sec btn-sm"><Icon name="download" size={14}/>导出</button>
          </div>
        </div>

        {/* 关键指标网格 */}
        <div className="analytics-metric-grid">
          {METRICS.map((m,i)=>(
            <div key={i} className="card card-pad anim-up" style={{animationDelay:`${i*.04}s`}}>
              <div className="row spread" style={{marginBottom:10}}>
                <span className="aux" style={{fontWeight:600}}>{m.label}</span>
                <span style={{color:'var(--primary)'}}><Icon name={m.icon} size={16}/></span>
              </div>
              <div className="row" style={{alignItems:'baseline',gap:4}}>
                <span className="num" style={{fontSize:34,fontWeight:600}}>{m.value}</span>
                <span className="num" style={{fontSize:16,color:'var(--text-2)',fontWeight:500}}>{m.unit}</span>
              </div>
              <span className="aux" style={{color:m.good?'var(--green)':'var(--text-2)',fontWeight:500}}>{m.sub}</span>
            </div>
          ))}
        </div>

        <ForecastPanel board={FORECAST_BOARD} onSubmit={()=>toast('已记录本周预测提交提醒','ok')}/>

        <div className="analytics-main-grid">
          {/* 转化漏斗 */}
          <div className="card card-pad anim-up">
            <SectionTitle icon="target" sub="询盘 → 成交，北极星指标 23%">转化漏斗</SectionTitle>
            <div className="col" style={{gap:10,marginTop:4}}>
              {FUNNEL.map((f,i)=>(
                <div key={i}>
                  <div className="row spread" style={{marginBottom:4}}>
                    <span className="aux" style={{fontWeight:500,color:'var(--text)'}}>{f.stage}</span>
                    <span className="row gap2"><span className="num" style={{fontWeight:600}}>{f.value}</span>
                      <span className="aux mono" style={{width:36,textAlign:'right'}}>{f.pct}%</span></span>
                  </div>
                  <div style={{height:24,background:'#f1f4f7',borderRadius:6,overflow:'hidden'}}>
                    <div style={{width:`${f.pct}%`,height:'100%',background:f.color,borderRadius:6,
                      transition:'width .8s cubic-bezier(.2,.7,.3,1)',display:'flex',alignItems:'center',justifyContent:'flex-end',
                      paddingRight:8}}>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 节省工时 / 响应承接 */}
          <div className="col" style={{gap:20}}>
            <div className="card card-pad anim-up">
              <SectionTitle icon="bot" sub="A/B 级线索在 5 分钟内被接住的占比">5 分钟接住率</SectionTitle>
              <div className="row gap4" style={{alignItems:'center'}}>
                <div style={{position:'relative'}}>
                  <Ring pct={86} size={104} stroke={9} color="var(--green)"/>
                  <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <span className="num" style={{fontSize:26,fontWeight:600}}>86%</span>
                    <span className="aux" style={{fontSize:10}}>SLA</span>
                  </div>
                </div>
                <div className="col" style={{gap:10,flex:1}}>
                  <div className="row spread"><span className="aux">按时首次响应</span><span className="num" style={{fontWeight:600}}>268</span></div>
                  <div className="divider"></div>
                  <div className="row spread"><span className="aux">需人工接管</span><span className="num" style={{fontWeight:600,color:'var(--orange)'}}>44</span></div>
                  <div className="divider"></div>
                  <div className="row spread"><span className="aux">护栏拦截</span><span className="num" style={{fontWeight:600,color:'var(--red)'}}>9</span></div>
                </div>
              </div>
            </div>
            <div className="card card-pad anim-up" style={{position:'relative',overflow:'hidden',
              background:'var(--hero-grad)',border:'none',color:'#fff',
              boxShadow:'0 16px 36px -16px rgba(16,33,48,.5)'}}>
              <div style={{position:'absolute',top:-70,right:-30,width:240,height:240,pointerEvents:'none',
                background:'var(--hero-glow)'}}></div>
              <div className="row spread" style={{position:'relative'}}>
                <div className="col">
                  <span style={{fontSize:13,opacity:.85,fontWeight:500}}>本月累计节省工时</span>
                  <div className="row" style={{alignItems:'baseline',gap:6,marginTop:6}}>
                    <span className="num" style={{fontSize:40,fontWeight:700}}>128</span>
                    <span style={{fontSize:16,opacity:.85}}>小时</span>
                  </div>
                  <span style={{fontSize:12.5,opacity:.8,marginTop:4}}>≈ 多请了 0.8 名外贸业务员</span>
                </div>
                <span style={{opacity:.5}}><Icon name="clock" size={48} strokeWidth={1.4}/></span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          <section className="card card-pad anim-up">
            <SectionTitle icon="shieldCheck" sub="缺字段、重复、未分配都会让好线索掉队">CRM 数据质量</SectionTitle>
            <div className="quality-grid">
              {DATA_QUALITY.map(item=>(
                <div key={item.label} className={`quality-card ${item.status}`}>
                  <div className="row spread" style={{gap:10}}>
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card card-pad anim-up">
            <SectionTitle icon="target" sub="把来源、SLA、成交和金额接起来看">闭环归因</SectionTitle>
            <div className="attribution-note">
              <Icon name="flag" size={15}/>
              <span>当前最大缺口：Email 断流、Facebook 手动 CSV 仍需去重，独立站表单关键字段完整率不足。</span>
            </div>
            <div className="attribution-table-wrap">
              <table className="tbl attribution-table">
                <thead><tr><th>来源</th><th>线索</th><th>有效</th><th>成交</th><th>金额</th><th>SLA</th><th>下一步</th></tr></thead>
                <tbody>
                  {SOURCE_ATTRIBUTION.map(row=>(
                    <tr key={row.source}>
                      <td><b>{row.source}</b><span>{row.quality}</span></td>
                      <td className="num">{row.leads}</td>
                      <td className="num">{row.qualified}</td>
                      <td className="num">{row.won}</td>
                      <td className="num">{row.pipeline?fmtMoney(row.pipeline):'—'}</td>
                      <td><span className={`badge ${row.sla==='0%'?'badge-red':parseInt(row.sla,10)<80?'badge-pri':'badge-grey'}`}>{row.sla}</span></td>
                      <td>{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ForecastPanel({board,onSubmit}){
  const [activeKey,setActiveKey]=useState(board.categories[0]?.key);
  const active=board.categories.find(item=>item.key===activeKey) || board.categories[0];
  const forecast=board.closedWon + board.categories.reduce((sum,item)=>sum+item.weighted,0);
  const gap=Math.max(0, board.target-forecast);
  const attainment=Math.min(100,Math.round((forecast/board.target)*100));
  const upside=board.categories.reduce((sum,item)=>sum+item.amount,0) + board.closedWon;
  return (
    <section className="forecast-panel anim-up">
      <div className="forecast-head">
        <div>
          <span className="field-label">销售预测</span>
          <h2>{board.period} 目标、Commit 和缺口</h2>
          <p>把老板关心的目标达成、销售提交预测、加权管道和下一步动作放在同一个面板里，避免只看询盘数量。</p>
        </div>
        <div className="forecast-submit">
          <span>{board.owner}</span>
          <b>{board.lastSubmitted}</b>
          <button className="btn btn-sec btn-sm" onClick={onSubmit}><Icon name="check" size={14}/>提交提醒</button>
        </div>
      </div>
      <div className="forecast-summary-grid">
        <ForecastMetric label="目标" value={fmtMoney(board.target)} tone="neutral"/>
        <ForecastMetric label="加权预测" value={fmtMoney(forecast)} tone={gap>0?'warn':'good'}/>
        <ForecastMetric label="目标缺口" value={gap?fmtMoney(gap):'已覆盖'} tone={gap>0?'bad':'good'}/>
        <ForecastMetric label="最大上探" value={fmtMoney(upside)} tone="good"/>
      </div>
      <div className="forecast-progress">
        <div className="row spread">
          <span>预测达成 {attainment}%</span>
          <b>{fmtMoney(forecast)} / {fmtMoney(board.target)}</b>
        </div>
        <div className="forecast-meter"><span style={{width:`${attainment}%`}}/></div>
      </div>
      <div className="forecast-layout">
        <div className="forecast-category-list">
          {board.categories.map(item=>(
            <button key={item.key} className={`forecast-category ${item.tone} ${active.key===item.key?'active':''}`} onClick={()=>setActiveKey(item.key)}>
              <div className="row spread" style={{gap:8}}>
                <b>{item.label}</b>
                <span>{item.count} 单</span>
              </div>
              <strong>{fmtMoney(item.weighted)}</strong>
              <p>{item.note}</p>
              <div className="forecast-mini-meter"><span style={{width:`${Math.min(100,Math.round(item.weighted/item.amount*100))}%`}}/></div>
            </button>
          ))}
        </div>
        <div className={`forecast-detail ${active.tone}`}>
          <div className="row spread" style={{gap:12,alignItems:'flex-start'}}>
            <div>
              <span className="field-label">当前分类</span>
              <h3>{active.label} · {fmtMoney(active.amount)}</h3>
              <p>{active.note}</p>
            </div>
            <span className="badge badge-pri">加权 {fmtMoney(active.weighted)}</span>
          </div>
          <div className="forecast-deal-list">
            {active.deals.map(deal=>(
              <div key={`${active.key}-${deal.company}`} className="forecast-deal-row">
                <div>
                  <b>{deal.company}</b>
                  <span>{deal.owner} · {deal.close}</span>
                </div>
                <strong>{fmtMoney(deal.value)}</strong>
                <p>{deal.risk}</p>
                <em>{deal.next}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="forecast-rep-grid">
        {board.reps.map(rep=>{
          const repForecast=rep.closed+rep.commit+Math.round(rep.bestCase*.55)+Math.round(rep.pipeline*.35);
          const repAttainment=Math.min(100,Math.round(repForecast/rep.quota*100));
          return (
            <div key={rep.owner} className={`forecast-rep-card ${rep.submitted===0?'bad':repAttainment>=85?'good':'warn'}`}>
              <div className="row spread" style={{gap:8}}>
                <b>{rep.owner}</b>
                <span>{repAttainment}%</span>
              </div>
              <div className="forecast-rep-meter"><span style={{width:`${repAttainment}%`}}/></div>
              <p>{rep.risk}</p>
              <small>{rep.next}</small>
            </div>
          );
        })}
      </div>
      <div className="forecast-action-list">
        {board.actions.map(item=>(
          <div key={item.title} className={`forecast-action ${item.tone}`}>
            <Icon name={item.tone==='bad'?'alert':item.tone==='warn'?'clock':'checkCircle'} size={15}/>
            <div>
              <b>{item.title}</b>
              <p>{item.detail}</p>
            </div>
            <span>{item.owner}</span>
            <em>{item.next}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ForecastMetric({label,value,tone}){
  return (
    <div className={`forecast-metric ${tone}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export { Analytics };
