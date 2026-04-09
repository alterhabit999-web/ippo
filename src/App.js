import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// DBレコード → アプリ内形式に変換
function rowToRecord(row) {
  if (!row) return null;
  if (row.type === "am") {
    return { date: row.date, type: "am", sleepH: row.sleep_h, sleepQ: row.sleep_q, mood: row.morning_mood, condition: row.morning_condition, promise: row.morning_promise };
  } else {
    return { date: row.date, type: "pm", mood: row.night_mood, energy: row.energy, stress: row.stress, happy: row.happy, moya: row.moya, promise: row.night_promise };
  }
}

// アプリ内形式 → DBレコードに変換
function recordToRow(data) {
  if (data.type === "am") {
    return { date: data.date, type: "am", sleep_h: data.sleepH ?? null, sleep_q: data.sleepQ ?? null, morning_mood: data.mood ?? null, morning_condition: data.condition ?? null, morning_promise: data.promise ?? null };
  } else {
    return { date: data.date, type: "pm", night_mood: data.mood ?? null, energy: data.energy ?? null, stress: data.stress ?? null, happy: data.happy ?? null, moya: data.moya ?? null, night_promise: data.promise ?? null };
  }
}

// 全記録をSupabaseから取得 → { "YYYY-MM-DD": { am, pm } } 形式に変換
async function loadAllRecords() {
  const { data, error } = await supabase.from("records").select("*").order("date", { ascending: true });
  if (error) { console.error("load error:", error); return {}; }
  const recs = {};
  for (const row of data) {
    if (!recs[row.date]) recs[row.date] = { am: null, pm: null };
    recs[row.date][row.type] = rowToRecord(row);
  }
  return recs;
}

// 記録をSupabaseにupsert
async function saveRecord(data, userId) {
  const row = { ...recordToRow(data), user_id: userId };
  const { error } = await supabase.from("records").upsert(row, { onConflict: "date,type" });
  if (error) console.error("save error:", error);
}

// あつめた言葉をSupabaseから取得
async function loadQuotes() {
  const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: true });
  if (error) { console.error("quotes load error:", error); return null; }
  return data.map(row => ({ id: row.id, text: row.text, source: row.source || "" }));
}

// 言葉をSupabaseに追加
async function insertQuote(text, source, userId) {
  const { data, error } = await supabase.from("quotes").insert({ text, source: source || "", user_id: userId }).select().single();
  if (error) { console.error("quote insert error:", error); return null; }
  return data;
}

// 言葉をSupabaseで更新
async function updateQuoteDB(id, text, source) {
  const { error } = await supabase.from("quotes").update({ text, source: source || "" }).eq("id", id);
  if (error) console.error("quote update error:", error);
}

// 言葉をSupabaseから削除
async function deleteQuoteDB(id) {
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) console.error("quote delete error:", error);
}

// 他ユーザーの言葉をランダムに1件取得
async function loadRandomOtherQuote(userId) {
  const { data, error } = await supabase
    .from("quotes").select("id, text, source, user_id")
    .neq("user_id", userId).limit(50);
  if (error || !data || data.length === 0) return null;
  return data[Math.floor(Math.random() * data.length)];
}

// CSVエクスポート（Supabaseから取得）
async function exportCSV() {
  const recs = await loadAllRecords();
  const dates = Object.keys(recs).sort();
  if (dates.length === 0) { alert("エクスポートできる記録がありません。"); return; }

  const headers = ["日付","朝_睡眠時間(h)","朝_睡眠の質","朝_今朝の気分","朝_今朝の体調","朝_今日の自分との約束","夜_気分・感情","夜_エネルギー・生産性","夜_ストレスレベル","夜_今日のHAPPY","夜_今日のモヤモヤ","夜_明日の自分との約束"];
  const esc = v => { if (v == null || v === "") return ""; const s = String(v); return (s.includes(",") || s.includes("\n") || s.includes('"')) ? `"${s.replace(/"/g,'""')}"` : s; };
  const rows = dates.map(date => {
    const am = recs[date]?.am; const pm = recs[date]?.pm;
    return [date, esc(am?.sleepH??""), esc(am?.sleepQ??""), esc(am?.mood??""), esc(am?.condition??""), esc(am?.promise??""), esc(pm?.mood??""), esc(pm?.energy??""), esc(pm?.stress??""), esc(pm?.happy??""), esc(pm?.moya??""), esc(pm?.promise??"")].join(",");
  });
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ippo_records_${todayStr}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── 定数 ──────────────────────────────────────────────
const now = new Date();
const isAM = now.getHours() < 17;
const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
const dateStr = `${now.getMonth()+1}月${now.getDate()}日`;

const AM = { bgPage:"#FFF4E8", bg:"#FFF8F0", sub:"#FFE8CC", accent:"#D45F10", accentLight:"#F0A060", border:"#EEC898", text:"#3A2A18", textMuted:"#A07850" };
const PM = { bgPage:"#1A2028", bg:"#232830", sub:"#2E3840", accent:"#5A8AAA", accentLight:"#A8C8D8", border:"#343C48", text:"#D8E8EE", textMuted:"#6A7888" };
const T = isAM ? AM : PM;

const moodColor="#F0A060", energyColor="#5A8AAA", stressColor="#C07888", sleepColor="#8AAA6A";
const morningColor="#D45F10", morningSub="#F0A060", nightColor="#5A8AAA", nightSub="#A8C8D8";
const DAYS=["日","月","火","水","木","金","土"];

const QUOTES_AM=[
  {text:"小さな一歩が、やがて大きな道になる。",sub:""},
  {text:"完璧な朝でなくていい。",sub:"起きた、それだけでもう十分。"},
  {text:"今日の自分に、やさしくいよう。",sub:"それが一番の生産性。"},
  {text:"焦らなくていい。",sub:"一歩ずつ、それがiPPO。"},
  {text:"小さな約束を守ることが、\n自分への信頼になる。",sub:""},
];
const QUOTES_PM=[
  {text:"今日も、ちゃんと生きた。",sub:"それで十分。"},
  {text:"記録することは、\n自分を知ること。",sub:"続けるほど、深くなる。"},
  {text:"良いことも、悪いことも、\nすべて今日の自分の一部。",sub:""},
  {text:"おつかれさま。",sub:"今日の一歩を、ちゃんと刻んだ。"},
  {text:"今日のモヤモヤは、\n明日の自分への贈り物。",sub:""},
];

function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function getFirstDay(y,m){return new Date(y,m,1).getDay();}
function toKey(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function avg(arr,key){const v=arr.map(d=>d[key]).filter(x=>x!=null&&!isNaN(x));return v.length?parseFloat((v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)):null;}

// ── ログイン画面 ──────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setMessage("メールアドレスとパスワードを入力してください"); return; }
    setLoading(true);
    setMessage("");
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("確認メールを送りました。メールのリンクをクリックしてください。");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("メールアドレスまたはパスワードが間違っています");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12,
    border: `0.5px solid ${AM.border}`, background: AM.sub, color: AM.text,
    outline: "none", boxSizing: "border-box", marginBottom: 12,
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: AM.bgPage, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "0.14em", color: AM.text, fontFamily: "Georgia,serif", marginBottom: 8 }}>iPPO</div>
      <div style={{ fontSize: 12, color: AM.textMuted, marginBottom: 40, letterSpacing: "0.06em" }}>毎日の小さな一歩を記録する</div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <input type="email" placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: loading ? AM.border : AM.accent, border: "none", cursor: loading ? "default" : "pointer", color: "#fff", fontSize: 14, fontWeight: 500, letterSpacing: "0.04em", marginBottom: 12 }}>
          {loading ? "処理中..." : isSignUp ? "新規登録" : "ログイン"}
        </button>
        <button onClick={() => { setIsSignUp(p => !p); setMessage(""); }}
          style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: "transparent", border: `0.5px solid ${AM.border}`, cursor: "pointer", color: AM.textMuted, fontSize: 13 }}>
          {isSignUp ? "ログインはこちら" : "アカウントをお持ちでない方"}
        </button>
        {message && <div style={{ marginTop: 16, fontSize: 12, color: AM.accent, textAlign: "center", lineHeight: 1.6 }}>{message}</div>}
      </div>
    </div>
  );
}

// ── UI部品 ────────────────────────────────────────────
function Phone({children}){
  return <div style={{width:"100%",minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",fontFamily:"sans-serif"}}>{children}</div>;
}
function Hamburger({onOpen}){
  return(
    <button onClick={onOpen} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
      <div style={{width:18,display:"flex",flexDirection:"column",gap:4}}>
        {[0,1,2].map(i=><div key={i} style={{height:1.5,background:T.textMuted,borderRadius:1}}/>)}
      </div>
    </button>
  );
}
function TopBar({onMenu,onBack,onTitle}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px 10px",background:T.bgPage}}>
      {onBack
        ?<button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.textMuted,padding:0,lineHeight:1}}>←</button>
        :<Hamburger onOpen={onMenu}/>}
      <span onClick={onTitle} style={{fontSize:15,fontWeight:500,letterSpacing:"0.12em",color:T.text,fontFamily:"Georgia,serif",cursor:onTitle?"pointer":"default"}}>iPPO</span>
      <div style={{width:26}}/>
    </div>
  );
}
function SideMenu({onNav,onClose,onTitle}){
  return(
    <div style={{position:"absolute",inset:0,zIndex:50,display:"flex"}}>
      <div style={{width:200,height:"100%",background:T.sub,borderRight:`0.5px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
        <div onClick={()=>{if(onTitle){onTitle();onClose();}}} style={{padding:"48px 20px 20px",fontSize:15,fontWeight:500,letterSpacing:"0.12em",color:T.text,fontFamily:"Georgia,serif",borderBottom:`0.5px solid ${T.border}`,cursor:onTitle?"pointer":"default"}}>iPPO</div>
        {[["calendar","カレンダー"],["quotes","あつめた言葉たち"],["insight","インサイト"],["settings","設定"]].map(([id,label])=>(
          <div key={id} onClick={()=>{onNav(id);onClose();}}
            style={{padding:"16px 20px",fontSize:14,color:T.textMuted,borderBottom:`0.5px solid ${T.border}`,cursor:"pointer"}}
            onMouseOver={e=>e.currentTarget.style.color=T.text}
            onMouseOut={e=>e.currentTarget.style.color=T.textMuted}>{label}</div>
        ))}
      </div>
      <div style={{flex:1,background:"rgba(0,0,0,0.35)"}} onClick={onClose}/>
    </div>
  );
}
function Slider({label,hint,value,onChange}){
  const pct=((value-1)/4)*100;
  return(
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
        <span style={{fontSize:13,fontWeight:500,color:T.text}}>{label}</span>
        <span style={{fontSize:18,fontWeight:500,color:T.accent,fontFamily:"Georgia,serif"}}>{value}</span>
      </div>
      <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>{hint}</div>
      <div style={{position:"relative",height:32,display:"flex",alignItems:"center"}}>
        <div style={{position:"absolute",left:0,right:0,height:4,borderRadius:2,background:T.sub}}/>
        <div style={{position:"absolute",left:0,width:`${pct}%`,height:4,borderRadius:2,background:T.accentLight}}/>
        <input type="range" min={1} max={5} step={1} value={value} onChange={e=>onChange(Number(e.target.value))}
          style={{position:"absolute",left:0,right:0,width:"100%",appearance:"none",background:"transparent",cursor:"pointer",margin:0,padding:0}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
        {["1","2","3","4","5"].map(n=><span key={n} style={{fontSize:10,color:Number(n)===value?T.accent:T.textMuted,fontWeight:Number(n)===value?500:400}}>{n}</span>)}
      </div>
    </div>
  );
}
function Div(){return <div style={{height:0.5,background:T.border,margin:"4px 0 24px"}}/>;}

// ── 画面 ──────────────────────────────────────────────
function MainScreen({onRecord,onMenu,todayRecord}){
  const amDone=todayRecord?.am!=null;
  const pmDone=todayRecord?.pm!=null;
  const canRecord=isAM?!amDone:!pmDone;
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px 56px",background:T.bgPage}}>
      <span style={{fontSize:18,fontWeight:500,letterSpacing:"0.12em",color:T.text,fontFamily:"Georgia,serif",marginBottom:48}}>iPPO</span>
      <div style={{fontSize:12,color:T.textMuted,marginBottom:20,letterSpacing:"0.06em"}}>{dateStr}</div>
      {canRecord?(
        <>
          <button onClick={onRecord} style={{width:"100%",padding:"22px 0",borderRadius:18,background:T.bg,border:`1px solid ${T.accentLight}`,cursor:"pointer"}}>
            <div style={{fontSize:20,fontWeight:500,color:T.text,fontFamily:"Georgia,serif",letterSpacing:"0.08em"}}>{isAM?"Morning":"Night"}</div>
          </button>
          <div style={{marginTop:16,fontSize:11,color:T.textMuted}}>タップして記録をはじめる</div>
        </>
      ):(
        <div style={{textAlign:"center",padding:"24px 0",fontSize:13,color:T.textMuted,lineHeight:1.8}}>
          {isAM?"今日の朝の記録は完了しています":"今日の夜の記録は完了しています"}
        </div>
      )}
      <div style={{marginTop:32,display:"flex",gap:12}}>
        {[["朝",amDone],["夜",pmDone]].map(([label,done],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:done?(i===0?morningSub:nightSub):T.border}}/>
            <span style={{fontSize:10,color:done?T.text:T.textMuted}}>{label}{done?" ✓":""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordScreen({onDone,onBack,userId}){
  const [sleepH,setSleepH]=useState("");
  const [sleepQ,setSleepQ]=useState(3);
  const [mood,setMood]=useState(3);
  const [condition,setCondition]=useState(3);
  const [promise,setPromise]=useState("");
  const [pmMood,setPmMood]=useState(3);
  const [energy,setEnergy]=useState(3);
  const [stress,setStress]=useState(3);
  const [happy,setHappy]=useState("");
  const [moya,setMoya]=useState("");
  const [tmPromise,setTmPromise]=useState("");
  const [saving,setSaving]=useState(false);

  const handleSave=async()=>{
    setSaving(true);
    const data=isAM
      ?{date:todayStr,type:"am",sleepH:parseFloat(sleepH)||null,sleepQ,mood,condition,promise}
      :{date:todayStr,type:"pm",mood:pmMood,energy,stress,happy,moya,promise:tmPromise};
    await saveRecord(data, userId);
    setSaving(false);
    onDone(data);
  };

  return(
    <>
      <div style={{background:T.bgPage,borderBottom:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",padding:"16px 20px 12px",gap:8}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.textMuted,padding:0,lineHeight:1}}>←</button>
        <span style={{fontSize:12,color:T.textMuted,flex:1,textAlign:"center",letterSpacing:"0.05em"}}>{dateStr}　{isAM?"朝":"夜"}の記録</span>
        <div style={{width:24}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 22px 24px",background:T.bg}}>
        {isAM?(
          <>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:4}}>睡眠時間</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>昨夜は何時間眠れましたか？</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="number" inputMode="decimal" min={0} max={24} step={0.5} value={sleepH} onChange={e=>setSleepH(e.target.value)} placeholder="7.0"
                  style={{width:84,padding:"10px 12px",fontSize:16,borderRadius:10,border:`0.5px solid ${T.border}`,background:T.sub,color:T.text,outline:"none",textAlign:"center",fontFamily:"Georgia,serif",fontWeight:500}}/>
                <span style={{fontSize:13,color:T.textMuted}}>時間</span>
              </div>
            </div>
            <Div/>
            <Slider label="睡眠の質" hint="1=最悪　5=最高" value={sleepQ} onChange={setSleepQ}/>
            <Slider label="今朝の気分" hint="1=最悪　5=最高" value={mood} onChange={setMood}/>
            <Slider label="今朝の体調" hint="1=最悪　5=最高" value={condition} onChange={setCondition}/>
            <Div/>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:4}}>今日の自分との約束</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>例：本を5分読む、ストレッチする</div>
              <input type="text" value={promise} onChange={e=>setPromise(e.target.value)}
                style={{width:"100%",padding:"10px 12px",fontSize:13,borderRadius:10,border:`0.5px solid ${T.border}`,background:T.sub,color:T.text,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </>
        ):(
          <>
            <Slider label="今日の気分・感情" hint="1=最悪　5=最高" value={pmMood} onChange={setPmMood}/>
            <Slider label="エネルギー・生産性" hint="1=低い　5=高い" value={energy} onChange={setEnergy}/>
            <Slider label="ストレスレベル" hint="1=なし　5=強い" value={stress} onChange={setStress}/>
            <Div/>
            {[["今日のHAPPY","今日あったポジティブなこと",happy,setHappy],["今日のモヤモヤ","今日あったネガティブなこと",moya,setMoya]].map(([label,hint,val,set])=>(
              <div key={label} style={{marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:500,color:T.text}}>{label}</span>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:T.sub,color:T.textMuted,border:`0.5px solid ${T.border}`}}>任意</span>
                </div>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>{hint}</div>
                <input type="text" value={val} onChange={e=>set(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",fontSize:13,borderRadius:10,border:`0.5px solid ${T.border}`,background:T.sub,color:T.text,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            <Div/>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:4}}>明日の自分との約束</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>明日の自分へ一言</div>
              <input type="text" value={tmPromise} onChange={e=>setTmPromise(e.target.value)}
                style={{width:"100%",padding:"10px 12px",fontSize:13,borderRadius:10,border:`0.5px solid ${T.border}`,background:T.sub,color:T.text,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </>
        )}
        <button onClick={handleSave} disabled={saving}
          style={{width:"100%",padding:"13px 0",borderRadius:12,marginTop:4,background:saving?T.border:T.accent,border:"none",cursor:saving?"default":"pointer",color:"#fff",fontSize:14,fontWeight:500,letterSpacing:"0.04em"}}>
          {saving?"保存中...":"記録する"}
        </button>
      </div>
    </>
  );
}

function DoneScreen({onMenu,todayRecord,quotes,setQuotes,onTitle,userId}){
  const displayQuotes=quotes&&quotes.length>0?quotes:(isAM?QUOTES_AM:QUOTES_PM);
  const [idx,setIdx]=useState(0);
  const q=displayQuotes[idx%displayQuotes.length];
  const amDone=todayRecord?.am!=null;
  const pmDone=todayRecord?.pm!=null;
  const [showAdd,setShowAdd]=useState(false);
  const [newText,setNewText]=useState("");
  const [newSource,setNewSource]=useState("");
  const [saving,setSaving]=useState(false);

  const handleAdd=async()=>{
    if(!newText.trim()) return;
    setSaving(true);
    const saved = await insertQuote(newText.trim(), newSource.trim(), userId);
    if(saved && setQuotes) setQuotes(p=>[...p,{id:saved.id,text:saved.text,source:saved.source||""}]);
    setSaving(false);
    setNewText("");setNewSource("");setShowAdd(false);
  };

  return(
    <>
      {/* 言葉追加モーダル */}
      {showAdd&&(
        <div style={{position:"absolute",inset:0,zIndex:60,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowAdd(false)}>
          <div onClick={e=>e.stopPropagation()}
            style={{width:"100%",background:T.bg,borderRadius:"20px",border:`0.5px solid ${T.border}`,padding:"20px 20px 24px",maxHeight:"65vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:"Georgia,serif",marginBottom:16}}>言葉をあつめる</div>
            <textarea value={newText} onChange={e=>setNewText(e.target.value)} placeholder="言葉を入力..." rows={3}
              style={{width:"100%",fontSize:13,color:T.text,background:T.sub,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"10px 12px",resize:"none",outline:"none",lineHeight:1.7,boxSizing:"border-box",marginBottom:10}}/>
            <input value={newSource} onChange={e=>setNewSource(e.target.value)} placeholder="出典（任意）：例）アドラー、夜と霧"
              style={{width:"100%",fontSize:12,color:T.textMuted,background:T.sub,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"9px 12px",outline:"none",boxSizing:"border-box",marginBottom:16}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleAdd} disabled={saving}
                style={{flex:1,padding:"12px 0",borderRadius:12,background:saving?T.border:T.accent,border:"none",color:"#fff",fontSize:13,fontWeight:500,cursor:saving?"default":"pointer"}}>{saving?"保存中...":"保存する"}</button>
              <button onClick={()=>setShowAdd(false)} disabled={saving}
                style={{padding:"12px 16px",borderRadius:12,background:"transparent",border:`0.5px solid ${T.border}`,color:T.textMuted,fontSize:13,cursor:"pointer"}}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px 10px",background:T.bgPage}}>
        <Hamburger onOpen={onMenu}/>
        <span onClick={onTitle} style={{fontSize:15,fontWeight:500,letterSpacing:"0.12em",color:T.text,fontFamily:"Georgia,serif",cursor:onTitle?"pointer":"default"}}>iPPO</span>
        <div style={{width:26}}/>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 28px 48px",gap:24,background:T.bgPage}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:T.sub,border:`1px solid ${T.accentLight}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:T.accent}}/>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,letterSpacing:"0.12em",color:T.accent,marginBottom:16,fontWeight:500}}>{isAM?"今日の朝に":"今日の夜に"}</div>
          <div style={{fontSize:15,color:T.text,lineHeight:2,fontFamily:"Georgia,serif",whiteSpace:"pre-line"}}>"{q.text}"</div>
          {q.sub&&<div style={{fontSize:12,color:T.textMuted,lineHeight:1.8,fontFamily:"Georgia,serif",marginTop:8}}>{q.sub}</div>}
        </div>
        <div style={{fontSize:10,color:T.textMuted}}>{dateStr}の記録が完了しました</div>
        <div style={{display:"flex",gap:12}}>
          {[["朝",amDone],["夜",pmDone]].map(([label,done],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:done?(i===0?morningSub:nightSub):T.border}}/>
              <span style={{fontSize:10,color:done?T.text:T.textMuted}}>{label}{done?" ✓":""}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>setIdx(i=>(i+1)%displayQuotes.length)}
          style={{padding:"6px 20px",borderRadius:99,background:"transparent",border:`0.5px solid ${T.border}`,fontSize:11,color:T.textMuted,cursor:"pointer"}}>別の言葉を見る</button>
        <button onClick={()=>setShowAdd(true)}
          style={{padding:"9px 24px",borderRadius:99,background:T.accent,border:"none",fontSize:12,fontWeight:500,color:"#fff",cursor:"pointer",letterSpacing:"0.04em"}}>言葉をあつめる</button>
      </div>
    </>
  );
}

function CalendarScreen({onMenu,allRecords,onTitle}){
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [selected,setSelected]=useState(null);
  const todayKey=toKey(now.getFullYear(),now.getMonth(),now.getDate());
  const daysInMonth=getDaysInMonth(year,month);
  const firstDay=getFirstDay(year,month);
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  const prev=()=>month===0?(setYear(y=>y-1),setMonth(11)):setMonth(m=>m-1);
  const next=()=>month===11?(setYear(y=>y+1),setMonth(0)):setMonth(m=>m+1);

  function Row({label,value,tab}){
    if(!value&&value!==0) return null;
    const rt=tab==="am"?AM:PM;
    return(
      <div style={{background:rt.sub,borderRadius:8,padding:"8px 10px"}}>
        <div style={{fontSize:10,color:rt.textMuted,marginBottom:3}}>{label}</div>
        <div style={{fontSize:13,fontWeight:500,color:rt.text}}>{value}</div>
      </div>
    );
  }

  function Detail({dateKey,rec,onClose}){
    const [tab,setTab]=useState(rec.am?"am":"pm");
    const [,m,d]=dateKey.split("-");
    return(
      <div style={{position:"absolute",inset:0,zIndex:20,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
        <div onClick={e=>e.stopPropagation()}
          style={{width:"100%",background:tab==="am"?AM.bg:PM.bg,borderRadius:"20px",border:`0.5px solid ${tab==="am"?AM.border:PM.border}`,padding:"20px 20px 24px",maxHeight:"65vh",overflowY:"auto",boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:14,fontWeight:500,color:tab==="am"?AM.text:PM.text,fontFamily:"Georgia,serif"}}>{parseInt(m)}月{parseInt(d)}日</span>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:tab==="am"?AM.textMuted:PM.textMuted,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <div style={{display:"flex",gap:4,background:"#E8E4DC",borderRadius:10,padding:4,marginBottom:16}}>
            {rec.am&&<button onClick={()=>setTab("am")} style={{flex:1,padding:"7px 0",fontSize:12,fontWeight:500,border:"none",cursor:"pointer",borderRadius:8,background:tab==="am"?AM.sub:"transparent",color:tab==="am"?morningColor:"#A09888"}}>Morning</button>}
            {rec.pm&&<button onClick={()=>setTab("pm")} style={{flex:1,padding:"7px 0",fontSize:12,fontWeight:500,border:"none",cursor:"pointer",borderRadius:8,background:tab==="pm"?PM.sub:"transparent",color:tab==="pm"?nightColor:"#A09888"}}>Night</button>}
          </div>
          {tab==="am"&&rec.am&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <Row label="睡眠時間" value={rec.am.sleepH?`${rec.am.sleepH}h`:null} tab={tab}/>
                <Row label="睡眠の質" value={rec.am.sleepQ?`${rec.am.sleepQ} / 5`:null} tab={tab}/>
                <Row label="今朝の気分" value={rec.am.mood?`${rec.am.mood} / 5`:null} tab={tab}/>
                <Row label="今朝の体調" value={rec.am.condition?`${rec.am.condition} / 5`:null} tab={tab}/>
              </div>
              {rec.am.promise&&<Row label="今日の自分との約束" value={rec.am.promise} tab={tab}/>}
            </div>
          )}
          {tab==="pm"&&rec.pm&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <Row label="気分・感情" value={rec.pm.mood?`${rec.pm.mood} / 5`:null} tab={tab}/>
                <Row label="エネルギー" value={rec.pm.energy?`${rec.pm.energy} / 5`:null} tab={tab}/>
                <Row label="ストレス" value={rec.pm.stress!=null?`${rec.pm.stress} / 5`:null} tab={tab}/>
              </div>
              {rec.pm.happy&&<Row label="今日のHAPPY" value={rec.pm.happy} tab={tab}/>}
              {rec.pm.moya&&<Row label="今日のモヤモヤ" value={rec.pm.moya} tab={tab}/>}
              {rec.pm.promise&&<Row label="明日の自分との約束" value={rec.pm.promise} tab={tab}/>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return(
    <>
      <TopBar onMenu={onMenu} onTitle={onTitle}/>
      <div style={{padding:"4px 18px 0",flex:1,overflowY:"auto",background:T.bgPage,position:"relative"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <button onClick={prev} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.textMuted,padding:"4px 8px"}}>‹</button>
          <span style={{fontSize:13,fontWeight:500,color:T.text,letterSpacing:"0.06em"}}>{year}年 {month+1}月</span>
          <button onClick={next} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.textMuted,padding:"4px 8px"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",marginBottom:6}}>
          {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:T.textMuted,fontWeight:500,paddingBottom:6}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:"4px 0",marginBottom:14}}>
          {cells.map((d,i)=>{
            if(!d) return <div key={`e-${i}`}/>;
            const key=toKey(year,month,d);
            const rec=allRecords[key];
            const isToday=key===todayKey;
            const hasBoth=rec?.am&&rec?.pm;
            return(
              <div key={key} onClick={()=>rec&&setSelected(key)}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0",cursor:rec?"pointer":"default"}}>
                <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:hasBoth?T.sub:"transparent",border:isToday?`1.5px solid ${T.accent}`:"none"}}>
                  <span style={{fontSize:11,color:hasBoth?T.accent:isToday?T.accent:T.text,fontWeight:hasBoth||isToday?500:400}}>{d}</span>
                </div>
                <div style={{display:"flex",gap:2,height:6,alignItems:"center"}}>
                  {rec?.am&&<div style={{width:4,height:4,borderRadius:"50%",background:morningSub}}/>}
                  {rec?.pm&&<div style={{width:4,height:4,borderRadius:"50%",background:nightSub}}/>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:14,paddingBottom:20,justifyContent:"center"}}>
          {[[morningSub,"朝の記録あり"],[nightSub,"夜の記録あり"]].map(([color,label])=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:color}}/>
              <span style={{fontSize:10,color:T.textMuted}}>{label}</span>
            </div>
          ))}
        </div>
        {selected&&allRecords[selected]&&<Detail dateKey={selected} rec={allRecords[selected]} onClose={()=>setSelected(null)}/>}
      </div>
    </>
  );
}

function InsightScreen({onMenu,allRecords,onTitle}){
  const [period,setPeriod]=useState("7");
  const [active,setActive]=useState(null);

  const buildData=(days)=>{
    const result=[];
    for(let i=days-1;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const key=toKey(d.getFullYear(),d.getMonth(),d.getDate());
      const rec=allRecords[key];
      result.push({
        label:`${d.getMonth()+1}/${d.getDate()}`,
        mood:   rec?.pm?.mood   ??null,
        energy: rec?.pm?.energy ??null,
        stress: rec?.pm?.stress ??null,
        sleep:  rec?.am?.sleepH ??null,
        amMood: rec?.am?.mood   ??null,
      });
    }
    return result;
  };

  const allDays=Object.keys(allRecords).sort();
  const dayCount=Math.max(allDays.length,7);
  const data=period==="all"?buildData(dayCount):buildData(Number(period));
  const hasData=data.some(d=>d.mood!=null||d.sleep!=null);

  const CHART_W={"7":300,"30":600,"all":Math.max(300,dayCount*14)};
  const LABEL_STEP={"7":1,"30":5,"all":Math.max(1,Math.floor(dayCount/6))};
  const W=CHART_W[period]||300;
  const step=LABEL_STEP[period]||1;
  const labels=data.map((_,i)=>i).filter(i=>i%step===0||i===data.length-1);

  function LineChart({height=120,series,minY=1,maxY=5,ticks}){
    const pL=24,pR=8,pT=8,pB=24,H=height,iW=W-pL-pR,iH=H-pT-pB;
    const toX=i=>pL+i*(iW/(data.length-1||1));
    const toY=v=>pT+iH-((v-minY)/(maxY-minY))*iH;
    return(
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <svg width={W} height={H} style={{display:"block"}}>
          {ticks.map(t=>(<g key={t}><line x1={pL} y1={toY(t)} x2={W-pR} y2={toY(t)} stroke={T.border} strokeWidth={0.5}/><text x={pL-4} y={toY(t)+4} textAnchor="end" fontSize={8} fill={T.textMuted}>{t}{minY===3?"h":""}</text></g>))}
          {labels.map(i=><text key={i} x={toX(i)} y={H-2} textAnchor="middle" fontSize={7} fill={T.textMuted}>{data[i].label}</text>)}
          {series.map(s=>{
            const pts=data.reduce((acc,d,i)=>{if(d[s.key]!=null) acc.push(`${toX(i)},${toY(d[s.key])}`);return acc;},[]).join(" ");
            return pts?<polyline key={s.key} points={pts} fill="none" stroke={s.color} strokeWidth={active&&active!==s.key?0.5:1.8} opacity={active&&active!==s.key?0.15:0.9} strokeLinejoin="round" strokeLinecap="round"/>:null;
          })}
          {data.length<=7&&series.filter(s=>!active||active===s.key).map(s=>
            data.map((d,i)=>d[s.key]!=null?<circle key={`${s.key}-${i}`} cx={toX(i)} cy={toY(d[s.key])} r={3} fill={s.color} opacity={0.9}/>:null)
          )}
        </svg>
      </div>
    );
  }

  function ScatterPanel({yKey,color,label}){
    const pL=24,pR=6,pT=8,pB=20,W2=300,H=90,iW=W2-pL-pR,iH=H-pT-pB;
    const minS=3,maxS=12;
    const toX=s=>pL+((Math.min(Math.max(s,minS),maxS)-minS)/(maxS-minS))*iW;
    const toY=v=>pT+iH-((v-1)/4)*iH;
    const pts=data.filter(d=>d.sleep!=null&&d[yKey]!=null);
    return(
      <div style={{marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:color}}/>
          <span style={{fontSize:10,color:T.textMuted}}>{label}</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${W2} ${H}`}>
          {[1,3,5].map(t=>(<g key={t}><line x1={pL} y1={toY(t)} x2={W2-pR} y2={toY(t)} stroke={T.border} strokeWidth={0.5}/><text x={pL-4} y={toY(t)+4} textAnchor="end" fontSize={8} fill={T.textMuted}>{t}</text></g>))}
          {[3,6,9,12].map(s=><text key={s} x={toX(s)} y={H-2} textAnchor="middle" fontSize={8} fill={T.textMuted}>{s}h</text>)}
          {pts.length>0
            ?pts.map((d,i)=><circle key={i} cx={toX(d.sleep)} cy={toY(d[yKey])} r={3.5} fill={color} opacity={0.6}/>)
            :<text x={W2/2} y={H/2} textAnchor="middle" fontSize={10} fill={T.textMuted}>データが増えると表示されます</text>
          }
        </svg>
      </div>
    );
  }

  const moodAvg=avg(data.map(d=>({v:d.mood})),"v");
  const energyAvg=avg(data.map(d=>({v:d.energy})),"v");
  const stressAvg=avg(data.map(d=>({v:d.stress})),"v");
  const sleepAvg=avg(data.map(d=>({v:d.sleep})),"v");

  return(
    <>
      <TopBar onMenu={onMenu} onTitle={onTitle}/>
      <div style={{padding:"4px 14px 24px",overflowY:"auto",flex:1,background:T.bgPage}}>
        <div style={{display:"flex",gap:4,background:T.sub,borderRadius:10,padding:4,marginBottom:14}}>
          {[["7","7日"],["30","30日"],["all","全期間"]].map(([key,label])=>(
            <button key={key} onClick={()=>{setPeriod(key);setActive(null);}}
              style={{flex:1,padding:"7px 0",fontSize:11,fontWeight:500,border:"none",cursor:"pointer",borderRadius:7,background:period===key?T.bg:"transparent",color:period===key?T.accent:T.textMuted,transition:"all 0.15s"}}>{label}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:6,marginBottom:12}}>
          {[["気分",moodAvg,moodColor],["ｴﾈﾙｷﾞｰ",energyAvg,energyColor],["ｽﾄﾚｽ",stressAvg,stressColor],["睡眠",sleepAvg?`${sleepAvg}h`:null,sleepColor]].map(([label,val,color])=>(
            <div key={label} style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:9,color:T.textMuted,marginBottom:3}}>{label}</div>
              <div style={{fontSize:16,fontWeight:500,color,fontFamily:"Georgia,serif"}}>{val||"—"}</div>
            </div>
          ))}
        </div>
        {!hasData&&<div style={{textAlign:"center",padding:"32px 0",color:T.textMuted,fontSize:13,lineHeight:1.8}}>記録を始めるとグラフが表示されます</div>}
        {[
          {title:"気分・エネルギー・ストレス",legend:[[moodColor,"気分","mood"],[energyColor,"ｴﾈﾙｷﾞｰ","energy"],[stressColor,"ｽﾄﾚｽ","stress"]],content:<LineChart series={[{key:"mood",color:moodColor},{key:"energy",color:energyColor},{key:"stress",color:stressColor}]} ticks={[1,2,3,4,5]} minY={1} maxY={5}/>},
          {title:"睡眠時間の推移",legend:[[sleepColor,"睡眠時間",null]],content:<LineChart series={[{key:"sleep",color:sleepColor}]} ticks={[3,6,9,12]} minY={3} maxY={12} height={100}/>},
          {title:"睡眠時間との相関性",content:(
            <div>
              <div style={{fontSize:9,color:T.textMuted,marginBottom:10}}>横軸：睡眠時間（h）　縦軸：夜のスコア（1〜5）</div>
              <ScatterPanel yKey="mood" color={moodColor} label="気分・感情"/>
              <ScatterPanel yKey="energy" color={energyColor} label="エネルギー・生産性"/>
              <ScatterPanel yKey="stress" color={stressColor} label="ストレスレベル"/>
            </div>
          )},
        ].map(({title,legend,content})=>(
          <div key={title} style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:14,padding:"12px 14px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:500,color:T.text}}>{title}</span>
              {legend&&<div style={{display:"flex",gap:8}}>{legend.map(([color,label,key])=>(
                <div key={label} onClick={()=>key&&setActive(p=>p===key?null:key)}
                  style={{display:"flex",alignItems:"center",gap:4,cursor:key?"pointer":"default",opacity:active&&active!==key?0.35:1}}>
                  <div style={{width:16,height:2,borderRadius:1,background:color}}/><span style={{fontSize:9,color:T.textMuted}}>{label}</span>
                </div>
              ))}</div>}
            </div>
            {content}
          </div>
        ))}
      </div>
    </>
  );
}

function CollectedWordsScreen({onMenu, quotes, setQuotes, onTitle, userId}){
  const [showAdd,setShowAdd]=useState(false);
  const [newText,setNewText]=useState("");
  const [newSource,setNewSource]=useState("");
  const [savingNew,setSavingNew]=useState(false);
  const [editId,setEditId]=useState(null);
  const [editText,setEditText]=useState("");
  const [editSource,setEditSource]=useState("");
  const [featuredIdx,setFeaturedIdx]=useState(()=>Math.floor(Math.random()*Math.max(quotes.length,1)));
  const [otherQuote,setOtherQuote]=useState(null);
  const [loadingOther,setLoadingOther]=useState(true);
  const [addingOther,setAddingOther]=useState(false);

  const featured=quotes.length>0?quotes[featuredIdx%quotes.length]:null;

  const fetchOtherQuote=async()=>{
    setLoadingOther(true);
    const q=await loadRandomOtherQuote(userId);
    setOtherQuote(q);
    setLoadingOther(false);
  };
  useEffect(()=>{fetchOtherQuote();},[]);

  const handleAddNew=async()=>{
    if(!newText.trim()) return;
    setSavingNew(true);
    const saved=await insertQuote(newText.trim(),newSource.trim(),userId);
    if(saved) setQuotes(p=>[...p,{id:saved.id,text:saved.text,source:saved.source||""}]);
    setSavingNew(false);
    setNewText("");setNewSource("");setShowAdd(false);
  };

  const handleAddOther=async()=>{
    if(!otherQuote||addingOther) return;
    setAddingOther(true);
    const saved=await insertQuote(otherQuote.text,otherQuote.source||"",userId);
    if(saved) setQuotes(p=>[...p,{id:saved.id,text:saved.text,source:saved.source||""}]);
    setAddingOther(false);
    fetchOtherQuote();
  };

  return(
    <>
      {/* 言葉追加モーダル */}
      {showAdd&&(
        <div style={{position:"absolute",inset:0,zIndex:60,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowAdd(false)}>
          <div onClick={e=>e.stopPropagation()}
            style={{width:"100%",background:T.bg,borderRadius:"20px",border:`0.5px solid ${T.border}`,padding:"20px 20px 24px",maxHeight:"65vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:"Georgia,serif",marginBottom:16}}>言葉をあつめる</div>
            <textarea value={newText} onChange={e=>setNewText(e.target.value)} placeholder="言葉を入力..." rows={3}
              style={{width:"100%",fontSize:13,color:T.text,background:T.sub,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"10px 12px",resize:"none",outline:"none",lineHeight:1.7,boxSizing:"border-box",marginBottom:10}}/>
            <input value={newSource} onChange={e=>setNewSource(e.target.value)} placeholder="出典（任意）：例）アドラー、夜と霧"
              style={{width:"100%",fontSize:12,color:T.textMuted,background:T.sub,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"9px 12px",outline:"none",boxSizing:"border-box",marginBottom:16}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleAddNew} disabled={savingNew}
                style={{flex:1,padding:"12px 0",borderRadius:12,background:savingNew?T.border:T.accent,border:"none",color:"#fff",fontSize:13,fontWeight:500,cursor:savingNew?"default":"pointer"}}>{savingNew?"保存中...":"保存する"}</button>
              <button onClick={()=>setShowAdd(false)} disabled={savingNew}
                style={{padding:"12px 16px",borderRadius:12,background:"transparent",border:`0.5px solid ${T.border}`,color:T.textMuted,fontSize:13,cursor:"pointer"}}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
      <TopBar onMenu={onMenu} onTitle={onTitle}/>
      <div style={{padding:"4px 14px 28px",overflowY:"auto",flex:1,background:T.bgPage}}>
        {/* フィーチャー言葉 */}
        {featured&&(
          <div style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:16,padding:"22px 18px",marginBottom:18,textAlign:"center"}}>
            <div style={{fontSize:10,letterSpacing:"0.12em",color:T.accent,marginBottom:12,fontWeight:500}}>今日の言葉</div>
            <div style={{fontSize:15,color:T.text,lineHeight:2,fontFamily:"Georgia,serif",whiteSpace:"pre-line"}}>"{featured.text}"</div>
            {featured.source&&<div style={{fontSize:11,color:T.textMuted,marginTop:8,fontFamily:"Georgia,serif"}}>— {featured.source}</div>}
            <button onClick={()=>setFeaturedIdx(i=>(i+1)%quotes.length)}
              style={{marginTop:14,padding:"5px 18px",borderRadius:99,background:"transparent",border:`0.5px solid ${T.border}`,fontSize:11,color:T.textMuted,cursor:"pointer"}}>別の言葉を見る</button>
          </div>
        )}

        {/* みんなの言葉 */}
        <div style={{fontSize:10,fontWeight:500,letterSpacing:"0.1em",color:T.accent,marginBottom:8}}>みんなの言葉</div>
        <div style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:14,padding:"14px",marginBottom:18}}>
          {loadingOther?(
            <div style={{textAlign:"center",padding:"12px 0",fontSize:12,color:T.textMuted}}>読み込み中...</div>
          ):otherQuote?(
            <>
              <div style={{fontSize:13,color:T.text,lineHeight:1.9,fontFamily:"Georgia,serif",whiteSpace:"pre-line",marginBottom:6}}>"{otherQuote.text}"</div>
              {otherQuote.source&&<div style={{fontSize:11,color:T.textMuted,marginBottom:12}}>— {otherQuote.source}</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={handleAddOther} disabled={addingOther}
                  style={{flex:1,padding:"9px 0",borderRadius:10,background:addingOther?T.border:T.accent,border:"none",color:"#fff",fontSize:12,fontWeight:500,cursor:addingOther?"default":"pointer"}}>{addingOther?"追加中...":"＋ 自分の言葉に追加する"}</button>
                <button onClick={fetchOtherQuote} disabled={loadingOther}
                  style={{padding:"9px 14px",borderRadius:10,background:"transparent",border:`0.5px solid ${T.border}`,color:T.textMuted,fontSize:12,cursor:"pointer"}}>他の言葉</button>
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:"12px 0",fontSize:12,color:T.textMuted}}>他のユーザーの言葉はまだありません</div>
          )}
        </div>

        {/* 言葉一覧 */}
        <div style={{fontSize:10,fontWeight:500,letterSpacing:"0.1em",color:T.accent,marginBottom:8}}>あつめた言葉たち ({quotes.length})</div>
        <div style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:14,overflow:"hidden",marginBottom:18}}>
          {quotes.length===0&&(
            <div style={{padding:"20px 14px",fontSize:13,color:T.textMuted,textAlign:"center"}}>まだ言葉がありません</div>
          )}
          {quotes.map((q)=>(
            <div key={q.id} style={{padding:"11px 14px",borderBottom:`0.5px solid ${T.border}`}}>
              {editId===q.id?(
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2}
                    style={{fontSize:12,color:T.text,background:T.sub,border:`0.5px solid ${T.border}`,borderRadius:8,padding:"7px 10px",resize:"none",outline:"none",lineHeight:1.6,width:"100%",boxSizing:"border-box"}}/>
                  <input value={editSource} placeholder="出典（任意）" onChange={e=>setEditSource(e.target.value)}
                    style={{fontSize:11,color:T.textMuted,background:T.sub,border:`0.5px solid ${T.border}`,borderRadius:8,padding:"6px 10px",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={async()=>{
                      await updateQuoteDB(q.id, editText, editSource);
                      setQuotes(p=>p.map(x=>x.id===q.id?{...x,text:editText,source:editSource}:x));
                      setEditId(null);
                    }} style={{flex:1,padding:"6px 0",borderRadius:8,fontSize:11,background:T.accent,border:"none",color:"#fff",cursor:"pointer"}}>保存</button>
                    <button onClick={async()=>{
                      await deleteQuoteDB(q.id);
                      setQuotes(p=>p.filter(x=>x.id!==q.id));
                      setEditId(null);
                    }} style={{padding:"6px 12px",borderRadius:8,fontSize:11,background:"transparent",border:`0.5px solid ${T.border}`,color:T.textMuted,cursor:"pointer"}}>削除</button>
                  </div>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.7}}>"{q.text}"</div>
                    {q.source&&<div style={{fontSize:10,color:T.textMuted,marginTop:2}}>— {q.source}</div>}
                  </div>
                  <button onClick={()=>{setEditId(q.id);setEditText(q.text);setEditSource(q.source||"");}}
                    style={{background:"none",border:`0.5px solid ${T.border}`,borderRadius:6,padding:"3px 9px",fontSize:10,color:T.textMuted,cursor:"pointer",flexShrink:0}}>編集</button>
                </div>
              )}
            </div>
          ))}
          <div style={{padding:"9px 14px"}}>
            <button onClick={()=>setShowAdd(true)}
              style={{width:"100%",padding:"7px 0",borderRadius:8,fontSize:12,background:"transparent",border:`0.5px solid ${T.border}`,color:T.accent,cursor:"pointer"}}>+ 言葉を追加する</button>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsScreen({onMenu,onLogout,onTitle}){
  const [amTime,setAmTime]=useState("07:00");
  const [pmTime,setPmTime]=useState("22:00");
  const [amOn,setAmOn]=useState(true);
  const [pmOn,setPmOn]=useState(true);
  const [exportMsg,setExportMsg]=useState("");

  function Toggle({value,onChange}){
    return <div onClick={()=>onChange(!value)} style={{width:38,height:21,borderRadius:11,cursor:"pointer",background:value?T.accent:T.border,position:"relative",transition:"background 0.2s"}}><div style={{position:"absolute",top:3,left:value?19:3,width:15,height:15,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></div>;
  }

  const handleExport=async()=>{
    setExportMsg("書き出し中...");
    try{ await exportCSV(); setExportMsg("エクスポートしました ✓"); }
    catch(e){ setExportMsg("エクスポートに失敗しました"); }
    setTimeout(()=>setExportMsg(""),3000);
  };

  return(
    <>
      <TopBar onMenu={onMenu} onTitle={onTitle}/>
      <div style={{padding:"4px 14px 28px",overflowY:"auto",flex:1,background:T.bgPage}}>
        <div style={{fontSize:10,fontWeight:500,letterSpacing:"0.1em",color:T.accent,marginBottom:8}}>通知</div>
        <div style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:14,overflow:"hidden",marginBottom:18}}>
          {[[amOn,setAmOn,amTime,setAmTime,"朝のリマインダー","Morning の通知"],[pmOn,setPmOn,pmTime,setPmTime,"夜のリマインダー","Night の通知"]].map(([on,setOn,time,setTime,label,sub],i)=>(
            <div key={label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderBottom:i===0?`0.5px solid ${T.border}`:"none"}}>
              <div><div style={{fontSize:13,color:T.text}}>{label}</div><div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{sub}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {on&&<input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{fontSize:12,color:T.text,background:"transparent",border:"none",outline:"none"}}/>}
                <Toggle value={on} onChange={setOn}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,fontWeight:500,letterSpacing:"0.1em",color:T.accent,marginBottom:8}}>データ</div>
        <div style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:14,overflow:"hidden",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer"}} onClick={handleExport}>
            <div>
              <div style={{fontSize:13,color:T.text}}>CSVでエクスポート</div>
              <div style={{fontSize:11,color:exportMsg?T.accent:T.textMuted,marginTop:2}}>{exportMsg||"記録データをファイルに書き出す"}</div>
            </div>
            <span style={{fontSize:14,color:T.textMuted}}>›</span>
          </div>
        </div>
        <div style={{fontSize:10,fontWeight:500,letterSpacing:"0.1em",color:T.accent,marginBottom:8}}>アカウント</div>
        <div style={{background:T.bg,border:`0.5px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer"}} onClick={onLogout}>
            <div style={{fontSize:13,color:T.text}}>ログアウト</div>
            <span style={{fontSize:14,color:T.textMuted}}>›</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── デフォルト言葉（初回DBシード用） ─────────────────
const DEFAULT_QUOTES_DATA = [
  {text:"小さな一歩が、やがて大きな道になる。",source:"iPPO"},
  {text:"完璧じゃなくていい。続けることが大切。",source:"iPPO"},
  {text:"今日の自分に、やさしくいよう。",source:"iPPO"},
  {text:"焦らなくていい。一歩ずつ、それがiPPO。",source:"iPPO"},
  {text:"今日も、ちゃんと生きた。",source:"iPPO"},
];

// ── App ───────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("loading");
  const [subScreen,setSubScreen]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [allRecords,setAllRecords]=useState({});
  const [todayRecord,setTodayRecord]=useState({am:null,pm:null});
  const [session,setSession]=useState(null);
  const [authReady,setAuthReady]=useState(false);
  const [quotes,setQuotes]=useState([]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setSession(session);
      setAuthReady(true);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setSession(session);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!authReady) return;
    if(!session){setScreen("main");return;}
    (async()=>{
      const [recs, dbQuotes] = await Promise.all([loadAllRecords(), loadQuotes()]);
      setAllRecords(recs);
      setTodayRecord(recs[todayStr]||{am:null,pm:null});
      if(dbQuotes !== null) {
        const hasDefaults = dbQuotes.some(q => q.source === "iPPO");
        if(!hasDefaults) {
          // 初回またはデフォルト未登録ならDBにシード
          const seeded = await Promise.all(DEFAULT_QUOTES_DATA.map(q => insertQuote(q.text, q.source, session.user.id)));
          const validSeeded = seeded.filter(Boolean).map(row => ({id:row.id, text:row.text, source:row.source||""}));
          setQuotes([...validSeeded, ...dbQuotes]);
        } else {
          setQuotes(dbQuotes);
        }
      }
      setScreen("main");
    })();
  },[authReady,session]);

  const handleLogout=async()=>{
    await supabase.auth.signOut();
    setAllRecords({});
    setTodayRecord({am:null,pm:null});
  };

  const handleDone=(data)=>{
    const updated={...allRecords};
    if(!updated[todayStr]) updated[todayStr]={am:null,pm:null};
    updated[todayStr][data.type]=data;
    setAllRecords(updated);
    setTodayRecord({...updated[todayStr]});
    setScreen("main");
  };

  const showMenu=()=>setMenuOpen(true);
  const hideMenu=()=>setMenuOpen(false);
  const navTo=(id)=>{setSubScreen(id);setScreen("sub");};
  const goHome=()=>{setScreen("main");setSubScreen(null);setMenuOpen(false);};

  const amDone=todayRecord?.am!=null;
  const pmDone=todayRecord?.pm!=null;
  const showDone=(isAM&&amDone)||(!isAM&&pmDone)||(amDone&&pmDone);

  if(!authReady) return(
    <Phone>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:T.bgPage}}>
        <span style={{fontSize:15,color:T.textMuted,fontFamily:"Georgia,serif",letterSpacing:"0.1em"}}>iPPO</span>
      </div>
    </Phone>
  );

  if(!session) return <LoginScreen/>;

  if(screen==="loading") return(
    <Phone>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:T.bgPage}}>
        <span style={{fontSize:15,color:T.textMuted,fontFamily:"Georgia,serif",letterSpacing:"0.1em"}}>iPPO</span>
      </div>
    </Phone>
  );

  return(
    <Phone>
      {menuOpen&&<SideMenu onNav={navTo} onClose={hideMenu} onTitle={goHome}/>}
      {screen==="main"&&(showDone
        ?<DoneScreen onMenu={showMenu} todayRecord={todayRecord} quotes={quotes} setQuotes={setQuotes} onTitle={goHome} userId={session.user.id}/>
        :<MainScreen onRecord={()=>setScreen("record")} onMenu={showMenu} todayRecord={todayRecord}/>
      )}
      {screen==="record"&&<RecordScreen onDone={handleDone} onBack={()=>setScreen("main")} userId={session.user.id}/>}
      {screen==="done"&&<DoneScreen onMenu={showMenu} todayRecord={todayRecord} quotes={quotes} setQuotes={setQuotes} onTitle={goHome} userId={session.user.id}/>}
      {screen==="sub"&&subScreen==="calendar"&&<CalendarScreen onMenu={showMenu} allRecords={allRecords} onTitle={goHome}/>}
      {screen==="sub"&&subScreen==="insight"&&<InsightScreen onMenu={showMenu} allRecords={allRecords} onTitle={goHome}/>}
      {screen==="sub"&&subScreen==="quotes"&&<CollectedWordsScreen onMenu={showMenu} quotes={quotes} setQuotes={setQuotes} onTitle={goHome} userId={session.user.id}/>}
      {screen==="sub"&&subScreen==="settings"&&<SettingsScreen onMenu={showMenu} onLogout={handleLogout} onTitle={goHome}/>}
    </Phone>
  );
}