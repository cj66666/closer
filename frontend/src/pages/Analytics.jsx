import { Icon } from '../icons.jsx';
import { FUNNEL, METRICS } from '../sampleData.js';
import { Ring, SectionTitle } from '../ui.jsx';

/* ===== analytics.jsx ===== */
/* ============ 数据看板 ============ */
function Analytics(){
  return (
    <div className="page-scroll">
      <div style={{padding:'24px 28px',maxWidth:1240,margin:'0 auto'}}>
        <div className="row spread" style={{marginBottom:20}}>
          <div className="col"><span className="eyebrow" style={{color:'var(--tech-deep)'}}>Analytics · 价值度量</span><span className="h1">数据看板</span>
            <span className="muted" style={{marginTop:4}}>用「带来成交」而非「回复快」衡量 Agent 的价值</span></div>
          <div className="row gap2">
            <button className="btn btn-sec btn-sm"><Icon name="calendar" size={14}/>近 30 天</button>
            <button className="btn btn-sec btn-sm"><Icon name="download" size={14}/>导出</button>
          </div>
        </div>

        {/* 关键指标网格 */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
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

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
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
      </div>
    </div>
  );
}

export { Analytics };
