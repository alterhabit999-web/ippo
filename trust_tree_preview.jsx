import { useState, useEffect } from "react";

// 木の成長ステージ（SVG）
function TreeSVG({ stage, watering }) {
  const trees = [
    // stage 0: 種
    <g key="seed">
      <ellipse cx="60" cy="115" rx="18" ry="8" fill="#C8A87A" opacity="0.5"/>
      <ellipse cx="60" cy="114" rx="10" ry="6" fill="#8B6340"/>
    </g>,
    // stage 1: 芽
    <g key="sprout">
      <rect x="57" y="90" width="6" height="28" rx="3" fill="#6A8C4A"/>
      <ellipse cx="60" cy="85" rx="12" ry="10" fill="#7CB95A"/>
      <ellipse cx="60" cy="118" rx="18" ry="6" fill="#C8A87A" opacity="0.4"/>
    </g>,
    // stage 2: 小さな木
    <g key="small">
      <rect x="55" y="70" width="10" height="50" rx="4" fill="#8B6340"/>
      <circle cx="60" cy="60" r="22" fill="#5A9A3A"/>
      <circle cx="42" cy="72" r="14" fill="#6AAD48"/>
      <circle cx="78" cy="72" r="14" fill="#6AAD48"/>
      <ellipse cx="60" cy="118" rx="20" ry="6" fill="#C8A87A" opacity="0.4"/>
    </g>,
    // stage 3: 枝が伸びた木
    <g key="medium">
      <rect x="54" y="60" width="12" height="60" rx="5" fill="#7A5530"/>
      <line x1="60" y1="85" x2="35" y2="70" stroke="#7A5530" strokeWidth="6" strokeLinecap="round"/>
      <line x1="60" y1="80" x2="85" y2="65" stroke="#7A5530" strokeWidth="6" strokeLinecap="round"/>
      <circle cx="60" cy="48" r="26" fill="#4A8C2A"/>
      <circle cx="35" cy="62" r="18" fill="#5A9A3A"/>
      <circle cx="85" cy="57" r="18" fill="#5A9A3A"/>
      <circle cx="48" cy="40" r="15" fill="#6AAD48"/>
      <circle cx="72" cy="38" r="15" fill="#6AAD48"/>
      <ellipse cx="60" cy="118" rx="22" ry="6" fill="#C8A87A" opacity="0.4"/>
    </g>,
    // stage 4: 葉が茂る木
    <g key="full">
      <rect x="53" y="55" width="14" height="65" rx="6" fill="#6B4423"/>
      <line x1="60" y1="80" x2="28" y2="65" stroke="#6B4423" strokeWidth="8" strokeLinecap="round"/>
      <line x1="60" y1="75" x2="92" y2="60" stroke="#6B4423" strokeWidth="8" strokeLinecap="round"/>
      <line x1="60" y1="90" x2="30" y2="82" stroke="#6B4423" strokeWidth="6" strokeLinecap="round"/>
      <line x1="60" y1="88" x2="90" y2="80" stroke="#6B4423" strokeWidth="6" strokeLinecap="round"/>
      <circle cx="60" cy="40" r="30" fill="#3A7A1A"/>
      <circle cx="28" cy="58" r="20" fill="#4A8C2A"/>
      <circle cx="92" cy="53" r="20" fill="#4A8C2A"/>
      <circle cx="30" cy="75" r="16" fill="#5A9A3A"/>
      <circle cx="90" cy="73" r="16" fill="#5A9A3A"/>
      <circle cx="42" cy="30" r="18" fill="#5AAD30"/>
      <circle cx="78" cy="28" r="18" fill="#5AAD30"/>
      <circle cx="60" cy="20" r="16" fill="#6ABD40"/>
      <ellipse cx="60" cy="118" rx="26" ry="7" fill="#C8A87A" opacity="0.4"/>
    </g>,
    // stage 5: 大きな立派な木
    <g key="big">
      <rect x="51" y="50" width="18" height="70" rx="7" fill="#5C3A1E"/>
      <line x1="60" y1="75" x2="20" y2="58" stroke="#5C3A1E" strokeWidth="10" strokeLinecap="round"/>
      <line x1="60" y1="70" x2="100" y2="53" stroke="#5C3A1E" strokeWidth="10" strokeLinecap="round"/>
      <line x1="60" y1="88" x2="22" y2="78" stroke="#5C3A1E" strokeWidth="7" strokeLinecap="round"/>
      <line x1="60" y1="85" x2="98" y2="75" stroke="#5C3A1E" strokeWidth="7" strokeLinecap="round"/>
      <line x1="60" y1="65" x2="40" y2="45" stroke="#5C3A1E" strokeWidth="6" strokeLinecap="round"/>
      <line x1="60" y1="62" x2="80" y2="42" stroke="#5C3A1E" strokeWidth="6" strokeLinecap="round"/>
      <circle cx="60" cy="33" r="34" fill="#2E6B0E"/>
      <circle cx="22" cy="52" r="22" fill="#3A7A1A"/>
      <circle cx="98" cy="47" r="22" fill="#3A7A1A"/>
      <circle cx="20" cy="72" r="18" fill="#4A8C2A"/>
      <circle cx="100" cy="68" r="18" fill="#4A8C2A"/>
      <circle cx="38" cy="26" r="20" fill="#4A9C20"/>
      <circle cx="82" cy="23" r="20" fill="#4A9C20"/>
      <circle cx="60" cy="12" r="20" fill="#5AAD30"/>
      <circle cx="44" cy="14" r="16" fill="#6ABD40"/>
      <circle cx="76" cy="12" r="16" fill="#6ABD40"/>
      {/* 実がなる */}
      <circle cx="30" cy="42" r="5" fill="#E85D3A" opacity="0.9"/>
      <circle cx="88" cy="38" r="5" fill="#E85D3A" opacity="0.9"/>
      <circle cx="52" cy="18" r="4" fill="#F0A060" opacity="0.9"/>
      <circle cx="72" cy="16" r="4" fill="#E85D3A" opacity="0.9"/>
      <ellipse cx="60" cy="118" rx="30" ry="8" fill="#C8A87A" opacity="0.4"/>
    </g>,
  ];
  return (
    <svg width="120" height="130" viewBox="0 0 120 130" style={{ filter: watering ? "brightness(1.1)" : "none", transition: "all 0.5s" }}>
      {/* 地面 */}
      <ellipse cx="60" cy="120" rx="35" ry="9" fill="#D4A876" opacity="0.3"/>
      {trees[Math.min(stage, 5)]}
    </svg>
  );
}

// じょうろアニメーション
function WateringCan({ active }) {
  return (
    <div style={{ position: "relative", height: 60, width: 80, opacity: active ? 1 : 0, transition: "opacity 0.3s" }}>
      <svg width="80" height="60" viewBox="0 0 80 60">
        {/* じょうろ本体 */}
        <ellipse cx="30" cy="30" rx="18" ry="14" fill="#5A8AAA"/>
        <rect x="12" y="26" width="36" height="12" rx="4" fill="#5A8AAA"/>
        {/* 注ぎ口 */}
        <path d="M46 28 Q62 22 68 30" stroke="#5A8AAA" strokeWidth="5" fill="none" strokeLinecap="round"/>
        {/* 取っ手 */}
        <path d="M18 20 Q8 18 10 30" stroke="#4A7A9A" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {/* 水滴 */}
        {active && <>
          <circle cx="70" cy="36" r="2.5" fill="#A8C8D8" opacity="0.9">
            <animateTransform attributeName="transform" type="translate" values="0,0;-2,8;-4,18" dur="0.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.9;0.6;0" dur="0.8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="66" cy="38" r="2" fill="#A8C8D8" opacity="0.8">
            <animateTransform attributeName="transform" type="translate" values="0,0;-1,6;-3,15" dur="0.8s" begin="0.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.5;0" dur="0.8s" begin="0.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="73" cy="34" r="1.5" fill="#A8C8D8" opacity="0.7">
            <animateTransform attributeName="transform" type="translate" values="0,0;-2,9;-5,20" dur="0.8s" begin="0.4s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;0.4;0" dur="0.8s" begin="0.4s" repeatCount="indefinite"/>
          </circle>
        </>}
      </svg>
    </div>
  );
}

const STAGE_LABELS = ["種", "芽が出た", "小さな木", "枝が伸びてきた", "葉が茂ってきた", "立派な木に育った！"];
const STAGE_THRESHOLDS = [0, 1, 6, 16, 31, 51];

function getStage(count) {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (count >= STAGE_THRESHOLDS[i]) return i;
  }
  return 0;
}

// iPPOカラー（朝モード）
const C = {
  bgPage: "#FFF4E8",
  bg: "#FFF8F0",
  sub: "#FFE8CC",
  accent: "#D45F10",
  accentLight: "#F0A060",
  border: "#EEC898",
  text: "#3A2A18",
  textMuted: "#A07850",
};

export default function TrustTreePreview() {
  const [checkCount, setCheckCount] = useState(0);
  const [checked, setChecked] = useState(false);
  const [watering, setWatering] = useState(false);
  const [growAnim, setGrowAnim] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const stage = getStage(checkCount);
  const nextThreshold = STAGE_THRESHOLDS[Math.min(stage + 1, 5)];
  const promise = "今日は30分早く起きる";

  const handleCheck = () => {
    if (checked) return;
    setChecked(true);
    setWatering(true);
    setTimeout(() => {
      setCheckCount(c => c + 1);
      setGrowAnim(true);
      setShowMessage(true);
      setTimeout(() => { setWatering(false); setGrowAnim(false); }, 600);
      setTimeout(() => setShowMessage(false), 2500);
    }, 900);
  };

  const handleReset = () => {
    setChecked(false);
    setWatering(false);
    setGrowAnim(false);
    setShowMessage(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bgPage, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>

      {/* アプリタイトル */}
      <div style={{ fontSize: 13, letterSpacing: "0.18em", color: C.accent, fontFamily: "Georgia, serif", marginBottom: 32, fontWeight: 500 }}>iPPO</div>

      {/* メインカード */}
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 320, boxShadow: "0 4px 20px rgba(180,120,60,0.08)" }}>

        {/* 今日の一言（ダミー） */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: C.accent, marginBottom: 12, fontWeight: 500 }}>朝が来た、一日が始まる</div>
          <div style={{ fontSize: 15, color: C.text, lineHeight: 2, fontFamily: "Georgia, serif" }}>"小さな一歩が、<br/>やがて大きな道になる。"</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, fontFamily: "Georgia, serif" }}>— iPPO</div>
        </div>

        <div style={{ height: 1, background: C.border, margin: "20px 0" }}/>

        {/* 自分との約束セクション */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.textMuted, fontWeight: 500, marginBottom: 10 }}>今日の自分との約束</div>

          {/* チェックボックス */}
          <div
            onClick={handleCheck}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: checked ? C.sub : "transparent", border: `1px solid ${checked ? C.accentLight : C.border}`, borderRadius: 14, cursor: checked ? "default" : "pointer", transition: "all 0.3s" }}
          >
            <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${checked ? C.accent : C.border}`, background: checked ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
              {checked && <span style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: checked ? C.accent : C.text, fontWeight: checked ? 500 : 400, textDecoration: checked ? "line-through" : "none", transition: "all 0.3s" }}>{promise}</span>
          </div>
          {!checked && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6, paddingLeft: 4 }}>守れたらチェックしよう</div>}
        </div>

        {/* 信頼の木エリア */}
        <div style={{ background: C.sub, borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.textMuted, fontWeight: 500, marginBottom: 4 }}>信頼の木</div>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 500, marginBottom: 12 }}>{STAGE_LABELS[stage]}</div>

          {/* 木とじょうろ */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, minHeight: 140 }}>
            <div style={{ transform: growAnim ? "scale(1.08)" : "scale(1)", transition: "transform 0.4s ease-out" }}>
              <TreeSVG stage={stage} watering={watering} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <WateringCan active={watering} />
            </div>
          </div>

          {/* 育ったメッセージ */}
          {showMessage && (
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 500, marginTop: 4, animation: "fadeIn 0.3s ease" }}>
              🌱 水をあげました
            </div>
          )}

          {/* 進捗バー */}
          {stage < 5 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textMuted, marginBottom: 4 }}>
                <span>約束を守った回数: {checkCount}回</span>
                <span>次のステージまで: あと{nextThreshold - checkCount}回</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                <div style={{ height: "100%", background: C.accentLight, borderRadius: 2, width: `${Math.min(((checkCount - STAGE_THRESHOLDS[stage]) / (nextThreshold - STAGE_THRESHOLDS[stage])) * 100, 100)}%`, transition: "width 0.5s ease" }}/>
              </div>
            </div>
          )}
          {stage === 5 && (
            <div style={{ fontSize: 11, color: C.accent, marginTop: 8 }}>✨ 立派な木に育ちました！</div>
          )}
        </div>
      </div>

      {/* 操作ボタン（デモ用） */}
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button
          onClick={handleReset}
          style={{ padding: "8px 18px", borderRadius: 99, background: "transparent", border: `1px solid ${C.border}`, fontSize: 11, color: C.textMuted, cursor: "pointer" }}
        >
          翌日（リセット）
        </button>
        <button
          onClick={() => { setCheckCount(0); setChecked(false); }}
          style={{ padding: "8px 18px", borderRadius: 99, background: "transparent", border: `1px solid ${C.border}`, fontSize: 11, color: C.textMuted, cursor: "pointer" }}
        >
          カウントをリセット
        </button>
      </div>

      {/* 成長段階の説明 */}
      <div style={{ marginTop: 24, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px", width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 500, marginBottom: 10, letterSpacing: "0.08em" }}>成長ステージ一覧</div>
        {STAGE_LABELS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: i <= stage ? C.accent : C.border, flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: i <= stage ? C.text : C.textMuted }}>
              {label}
              <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 6 }}>
                ({i === 0 ? "0回" : `${STAGE_THRESHOLDS[i]}回〜`})
              </span>
            </span>
            {i === stage && <span style={{ fontSize: 10, color: C.accent }}>← 今ここ</span>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: C.textMuted, textAlign: "center" }}>
        「チェック」を押して動作を確認・「翌日」で次の日のシミュレーション
      </div>
    </div>
  );
}
