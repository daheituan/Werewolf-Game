/* 圆桌玩家 - 微信小游戏可编译测试版
 * 入口文件：game.js + game.json
 * 说明：这是微信小游戏 Canvas 版本，不使用 app.json / pages / wxml。
 * 核心修正：联机模式下每个玩家只在自己的设备查看身份；游戏结束后才公开全部身份。
 */

const sys = wx.getSystemInfoSync();
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const dpr = sys.pixelRatio || 1;
let W = sys.windowWidth;
let H = sys.windowHeight;
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);

const C = {
  bg1: '#26162f', bg2: '#3b2450', panel: '#fff4dd', panel2: '#fff9ec', brown: '#6b3f25',
  dark: '#3a241b', orange: '#ffb52f', yellow: '#ffd86b', purple: '#8c63ff', green: '#55c46f',
  red: '#e85b4f', blue: '#6097e8', gray: '#8b817b', white: '#fffaf0'
};

const players = [
  { id: 'p1', name: '可乐加冰', emoji: '🐶' }, { id: 'p2', name: '奶茶三分糖', emoji: '🎀' },
  { id: 'p3', name: '南城旧梦', emoji: '🧑' }, { id: 'p4', name: '星辰大海', emoji: '😊' },
  { id: 'p5', name: '一颗小橙子', emoji: '📷' }, { id: 'p6', name: '棉花糖', emoji: '🐩' },
  { id: 'p7', name: '圆桌小玩家', emoji: '🙂' }, { id: 'p8', name: '神秘玩家', emoji: '🐺' }
];

const scenarios = [
  { good: '偶遇年少时的白月光，你此刻想唱的歌', spy: '偶遇老友，你此刻想唱的歌' },
  { good: '宠妃遭小人算计被皇上打入冷宫后想唱的歌', spy: '受某种重大挫折时你最想唱的歌' },
  { good: '假期独自旅行时，你此刻想唱的歌', spy: '加班到深夜，你此刻想唱的歌' },
  { good: '你们第一次分手后的雨夜', spy: '某个难忘的雨夜' }
];

const drawWords = ['冰雨', '想你的夜', '丢了西瓜捡芝麻', '东倒西歪', '老公', '金三脚', '吃葡萄不吐葡萄皮', '水煮肉片', '家徒四壁'];
const wolfTasks = ['吃西瓜', '剥鹌鹑蛋', '双手戳酒窝', '双手比莲花'];
const killerTasks = ['你说得对', '好吃', '我是真这么想的'];
const songs = [
  { name: '后来', singer: '刘若英', hint: '后来，我学会了如何认真告别' },
  { name: '晴天', singer: '周杰伦', hint: '等到放晴那天，也许心情会好一点' },
  { name: '演员', singer: '薛之谦', hint: '配合表演，也配合沉默' },
  { name: '想你的夜', singer: '关喆', hint: '夜色里，想念会变得很清楚' },
  { name: '冰雨', singer: '刘德华', hint: '冷冷的雨，拍在脸上' }
];

const state = {
  screen: 'lobby',
  selectedCategory: 'werewolf',
  selectedGame: '歌曲狼人杀',
  currentPlayerId: 'p3',
  round: 2,
  totalRounds: 3,
  gameEnded: false,
  rolesPublished: false,
  scenario: scenarios[0],
  roles: {},
  buttons: []
};

function assignRoles() {
  const spyIds = ['p8', 'p5'];
  players.forEach(p => {
    state.roles[p.id] = {
      role: spyIds.includes(p.id) ? '卧底' : '好人',
      prompt: spyIds.includes(p.id) ? state.scenario.spy : state.scenario.good,
      visibleToSelfOnly: true
    };
  });
}
assignRoles();

function clear() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // background confetti
  for (let i = 0; i < 30; i++) {
    const x = (i * 73) % W, y = (i * 137) % H;
    ctx.fillStyle = ['#ff6b6b','#ffd166','#72ddf7','#8de26f','#b28dff'][i % 5];
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x, y, 6 + (i % 4), 3 + (i % 5));
  }
  ctx.globalAlpha = 1;
}

function rr(x, y, w, h, r, fill, stroke, line = 1) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}
function text(t, x, y, size = 16, color = C.dark, align = 'left', weight = 'normal') {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y);
}
function wrap(t, x, y, maxW, lineH, size = 16, color = C.dark, weight = 'normal') {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let line = '', yy = y;
  for (const ch of t) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = ch; yy += lineH; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
function button(label, x, y, w, h, fill, onClick, opt = {}) {
  rr(x, y, w, h, h/2, fill, opt.stroke || null, opt.line || 1);
  text(label, x + w/2, y + h/2, opt.size || 18, opt.color || C.dark, 'center', 'bold');
  state.buttons.push({ x, y, w, h, onClick });
}
function pill(label, x, y, w, h, fill = '#f7e6c8', color = C.brown) {
  rr(x, y, w, h, h/2, fill, null); text(label, x + w/2, y + h/2, 13, color, 'center', 'bold');
}
function avatar(p, x, y, r, highlight = false) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fillStyle = highlight ? C.yellow : '#fff'; ctx.fill();
  ctx.lineWidth = highlight ? 4 : 2; ctx.strokeStyle = highlight ? C.orange : '#ffffff'; ctx.stroke();
  text(p.emoji, x, y+1, r*1.05, C.dark, 'center', 'normal');
}
function header(title, showLogo = true) {
  if (showLogo) text('圆桌玩家', 24, 42, 32, C.yellow, 'left', 'bold');
  button('‹', 18, 76, 42, 42, '#7b4a2f', () => back(), { color: '#fff', size: 30 });
  text(title, W/2, 96, 22, C.white, 'center', 'bold');
  rr(W-82, 28, 64, 32, 16, 'rgba(255,255,255,.12)', 'rgba(255,255,255,.55)');
  text('•••', W-50, 44, 18, '#fff', 'center', 'bold');
}
function back() {
  const order = ['lobby','category','werewolfList','guessList','setupSong','setupDraw','rules','role','play','vote','result'];
  if (state.screen === 'werewolfList' || state.screen === 'guessList') state.screen = 'category';
  else if (state.screen === 'setupSong') state.screen = 'werewolfList';
  else if (state.screen === 'setupDraw') state.screen = 'guessList';
  else if (state.screen === 'rules') state.screen = state.selectedGame === '神笔小马良' ? 'setupDraw' : 'setupSong';
  else if (state.screen === 'role') state.screen = 'rules';
  else if (state.screen === 'play') state.screen = 'role';
  else if (state.screen === 'vote') state.screen = 'play';
  else if (state.screen === 'result') state.screen = 'vote';
  else if (state.screen === 'category') state.screen = 'lobby';
  render();
}
function roomStrip(y=122) {
  rr(18, y, W-36, 58, 16, 'rgba(255,255,255,.13)', 'rgba(255,255,255,.18)');
  text('欢乐狼人局  🔒', 32, y+18, 17, C.white, 'left', 'bold');
  text('房间号：123456', 32, y+40, 13, '#d9c8bc');
  text(`已加入 ${players.length}/8`, W-38, y+30, 16, C.white, 'right', 'bold');
}

function renderLobby() {
  header('', false); state.buttons = [];
  text('圆桌玩家', 24, 48, 36, C.yellow, 'left', 'bold');
  roomStrip(95);
  const cx = W/2, cy = H*0.48, R = Math.min(W*0.39, 160);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fillStyle = '#a7602f'; ctx.fill(); ctx.strokeStyle = '#d18a4b'; ctx.lineWidth=8; ctx.stroke();
  button('开始游戏', cx-72, cy-28, 144, 56, C.orange, () => { state.screen='category'; render(); }, { size:22 });
  text('所有人准备后自动开始', cx, cy+45, 14, '#ffe7bf', 'center');
  players.slice(0,7).forEach((p,i)=>{
    const a = -Math.PI/2 + i*(Math.PI*2/7);
    const x = cx + Math.cos(a)*(R+24), y = cy + Math.sin(a)*(R+24);
    avatar(p,x,y,24,p.id===state.currentPlayerId);
    pill(`${i+1} ${p.name}`, x-40, y+28, 80, 24, 'rgba(73,43,26,.88)', '#fff');
    if (p.id===state.currentPlayerId) pill('我', x-30, y-40, 34, 22, C.yellow, C.dark);
  });
  button('+ 邀请好友', cx-55, cy+R+34, 110, 42, 'rgba(255,255,255,.18)', () => toast('测试版：这里接入微信分享/房间邀请'), { color:'#fff', stroke:'rgba(255,255,255,.35)' });
  rr(38, H-96, W-76, 44, 22, 'rgba(255,255,255,.15)', null); text('💡 联机模式：每位玩家在自己的设备查看身份', W/2, H-74, 14, '#fff', 'center');
}

function renderCategory() {
  header('界面 2/10 · 选择游戏类别'); state.buttons=[]; roomStrip(125);
  cardCategory(28, 210, W-56, 135, '#5d3485', '🐺', '狼人杀类', '经典推理，谁是隐藏的狼人？', () => {state.screen='werewolfList'; render();});
  cardCategory(28, 362, W-56, 135, '#dd8b27', '🎨', '猜词类游戏', '画画、猜歌、猜词，欢乐不停歇！', () => {state.screen='guessList'; render();});
  cardCategory(28, 514, W-56, 95, '#ecd7bc', '🎁', '更多游戏', 'Game 8 · Coming Soon', () => toast('更多玩法敬请期待'));
  button('＋ 新增游戏入口', 70, 632, W-140, 44, 'rgba(255,255,255,.17)', () => toast('可在 data 配置中新增游戏'), {color:'#fff'});
  button('下一步', 70, H-90, W-140, 54, C.orange, () => {state.screen='werewolfList'; render();}, {size:22});
}
function cardCategory(x,y,w,h,fill,icon,title,desc,onClick){
  rr(x,y,w,h,22,fill,'rgba(255,255,255,.18)',2); text(icon,x+52,y+h/2,46,'#fff','center');
  text(title,x+115,y+43,27,'#fff','left','bold'); wrap(desc,x+115,y+72,w-150,22,16,'#fff');
  text('›',x+w-32,y+h/2,36,'rgba(255,255,255,.8)','center','bold');
  state.buttons.push({x,y,w,h,onClick});
}

function gameCard(x,y,w,h,icon,title,desc,selected,onClick,disabled=false){
  rr(x,y,w,h,18,disabled?'rgba(255,255,255,.15)':'rgba(255,255,255,.20)',selected?C.orange:'rgba(255,255,255,.18)',selected?3:1);
  text(icon,x+37,y+38,31,'#fff','center'); text(title,x+78,y+29,18,disabled?'#aaa':'#fff','left','bold');
  wrap(desc,x+78,y+54,w-90,20,13,disabled?'#999':'#e8ddd6');
  pill('建议人数 6-12人',x+12,y+h-30,92,22,'rgba(255,244,221,.18)','#fff');
  pill('可分组',x+111,y+h-30,62,22,'rgba(255,244,221,.18)','#fff');
  pill(disabled?'Coming Soon':'随机任务',x+180,y+h-30,82,22,disabled?'rgba(150,150,150,.3)':'rgba(255,244,221,.18)','#fff');
  if(!disabled) state.buttons.push({x,y,w,h,onClick});
}
function renderWerewolfList(){
  header('界面 3/10 · 狼人杀类游戏'); state.buttons=[];
  pill('全部',30,132,82,34,'rgba(255,255,255,.14)','#fff'); pill('🐺 狼人杀类',W/2-70,132,140,34,C.orange,C.dark); pill('其他类',W-112,132,82,34,'rgba(255,255,255,.14)','#fff');
  const list=[['🎤','歌曲狼人杀','情境唱歌找卧底'],['👁️','目击狼人杀 1.0','睁眼目击 / 报警投票'],['🫣','目击狼人杀 2.0','对视或接触淘汰'],['💃','舞蹈狼人杀','听音乐起舞找狼群'],['🎭','捣蛋杀手狼人杀','完成暗任务开启捣蛋时刻'],['🍽️','餐桌生存战狼人杀','吃饭中动作攻击']];
  const w=(W-58)/2,h=118; list.forEach((g,i)=>gameCard(20+(i%2)*(w+18),190+Math.floor(i/2)*(h+18),w,h,g[0],g[1],g[2],i===0,()=>{state.selectedGame=g[1]; state.screen='setupSong'; render();}));
  gameCard(20,190+3*(h+18),W-40,92,'🌙','游戏 8','神秘玩法，即将上线',false,()=>{},true);
  button('进入设置',70,H-80,W-140,52,C.orange,()=>{state.screen='setupSong';render();},{size:22});
}
function renderGuessList(){
  header('界面 4/10 · 猜词类游戏'); state.buttons=[];
  const tabs=['全部游戏','猜词类游戏','趣味类游戏','互动类游戏']; tabs.forEach((t,i)=>pill(t,18+i*((W-36)/4),132,(W-46)/4,32,i===1?C.orange:'rgba(255,255,255,.14)',i===1?C.dark:'#fff'));
  guessCard(24,185,W-48,120,'🎨','神笔小马良','画画猜题 / 团队对抗',['冰雨','想你的夜','丢了西瓜捡芝麻'],true,()=>{state.selectedGame='神笔小马良'; state.screen='setupDraw'; render();});
  guessCard(24,320,W-48,105,'❓','猜词挑战','随机词语 / 禁止题目外泄',['支持分组','题目随机'],false,()=>toast('示例玩法，可继续扩展'));
  guessCard(24,440,W-48,105,'🎧','猜歌挑战','随机歌名 / 可播副歌与歌词提示',['歌名随机','歌词提示'],false,()=>toast('示例玩法，可继续扩展'));
  guessCard(24,560,W-48,105,'📖','歌词接龙','歌词片段辅助',['接龙计分','团队对抗'],false,()=>toast('示例玩法，可继续扩展'));
  button('进入设置',70,H-80,W-140,52,C.orange,()=>{state.screen='setupDraw';render();},{size:22});
}
function guessCard(x,y,w,h,icon,title,desc,tags,sel,onClick){
  rr(x,y,w,h,18,C.panel2,sel?C.orange:'#d7b890',sel?3:1); text(icon,x+50,y+h/2,38,C.dark,'center'); text(title,x+100,y+34,22,C.dark,'left','bold'); pill(desc,x+210,y+21,130,26,C.yellow,C.dark);
  tags.forEach((tg,i)=>pill(tg,x+100+i*88,y+70,80,24,'#f5e4c8',C.brown)); text('›',x+w-28,y+h/2,34,C.brown,'center','bold'); state.buttons.push({x,y,w,h,onClick});
}

function renderSetupSong(){
  header('界面 5/10 · 游戏设置（歌曲狼人杀）'); state.buttons=[];
  text('🎤 歌曲狼人杀',40,150,26,C.white,'left','bold'); pill('标准模式',210,137,82,28,C.yellow,C.brown); text('用歌声隐藏身份，用旋律找出卧底。',40,180,14,'#efe1d1');
  rr(24,215,W-48,H-310,22,C.panel,'#e7c18e',2);
  settingRow(245,'👥','总人数','8',true); settingRow(300,'🐺','卧底数量','2  自动生成',false,'不超过总人数 1/3'); settingRow(355,'⏳','游戏轮次','3',true); settingRow(410,'📘','情境题库','🎲 随机生成'); settingRow(465,'🎵','歌曲重复','不可重复⌄'); settingRow(520,'🎙️','演唱规则','每人每轮唱 1~2 句');
  text('情境预览（随机生成示例）',44,580,16,C.brown,'left','bold'); text('换一组 ↻',W-56,580,14,C.brown,'right');
  scenarioPair(610,'好人情境',state.scenario.good,C.green); scenarioPair(662,'卧底情境',state.scenario.spy,C.red);
  rr(44,H-190,W-88,44,12,'#ffe1a9'); text('💡 开局先展示规则，再由各玩家在自己设备查看身份',W/2,H-168,14,C.brown,'center');
  button('查看规则',35,H-126,130,52,'#a87852',()=>{state.screen='rules';render();},{color:'#fff'});
  button('开始分配',W-185,H-126,150,52,C.orange,()=>{state.screen='role';render();},{size:21});
}
function settingRow(y,icon,label,val,step=false,sub=''){
  text(icon,48,y,26,C.purple); text(label,86,y,17,C.dark,'left','bold'); if(sub) text(sub,86,y+20,12,C.gray);
  if(step){ button('−',W-142,y-19,34,34,'#f7ead2',()=>toast('测试版未调整'),{size:20}); text(val,W-82,y,22,C.dark,'center','bold'); button('+',W-52,y-19,34,34,'#f7ead2',()=>toast('测试版未调整'),{size:20}); }
  else { pill(val,W-158,y-17,132,34,'#f7ead2',C.brown); }
}
function scenarioPair(y,tag,content,color){ pill(tag,44,y,76,26,color,'#fff'); wrap(content,130,y-4,W-178,20,14,C.dark); }

function renderSetupDraw(){
  header('界面 6/10 · 游戏设置（神笔小马良）'); state.buttons=[];
  rr(24,140,W-48,H-230,22,C.panel,'#e7c18e',2);
  drawSetting(180,'👥','队伍数量','2 队⌄'); drawSetting(245,'👥','自动分组','红队 3 人   蓝队 3 人');
  text('❔',50,310,24,C.brown); text('题板类型',88,310,18,C.dark,'left','bold'); ['成语','词语','歌名','歌词'].forEach((t,i)=>pill(t,175+i*58,294,52,32,i===0?C.orange:'#f7ead2',C.brown));
  drawSetting(375,'⏱️','答题时长','60 秒⌄'); drawSetting(440,'🖌️','轮流作画','开启'); drawSetting(505,'🎲','随机题库','随机更换');
  text('题板内容预览（仅示例）',46,565,15,C.brown,'left','bold'); drawWords.slice(0,4).forEach((w,i)=>pill(w,45+i*73,592,66,28,'#f7e4c4',C.brown));
  rr(42,638,W-84,62,14,'#fff2d8','#e7c18e'); text('🔒 猜题成员不可见题目，其他成员可见',58,660,16,C.dark,'left','bold'); wrap('作画者与猜题者看不到题目，其他成员可见题目内容。',58,680,W-120,18,12,C.gray);
  button('重新分组',35,H-95,132,52,'#fff4dd',()=>toast('已重新随机分组'),{stroke:'#e7c18e'}); button('开始游戏',W-185,H-95,150,52,C.orange,()=>{state.screen='rules';render();},{size:21});
}
function drawSetting(y,icon,label,val){ text(icon,50,y,24,C.brown); text(label,88,y,18,C.dark,'left','bold'); pill(val,W-160,y-17,128,34,'#f7ead2',C.brown); }

function renderRules(){
  header('界面 7/10 · 游戏规则'); state.buttons=[];
  text('目击狼人杀 1.0',W/2,150,24,C.white,'center','bold');
  rr(24,190,W-48,H-280,22,C.panel,'#dca56a',3); text('⭐ 游戏规则 ⭐',W/2,220,26,C.brown,'center','bold');
  const rules=['狼人数量不超过总人数 1/3','小羊目标：在指定回合内完成任务','狼人可随时睁眼，通过对视杀掉小羊','被杀小羊：禁言并做指定动作','小羊每轮只有一次睁眼机会','若发现疑似狼人可报警，报警后发言并票人','到达指定回合场上还有狼人则狼人胜利'];
  rules.forEach((r,i)=>{rr(44,252+i*46,W-88,36,14,'#fff9ec'); pill(String(i+1),56,258+i*46,26,26,C.orange,C.white); wrap(r,92,258+i*46,W-130,18,14,C.dark);});
  text('随机任务示例',W/2,595,18,C.brown,'center','bold'); wolfTasks.forEach((t,i)=>pill(t,42+i*((W-84)/4),620,(W-104)/4,38,'#fff9ec',C.brown));
  text('流程：① 规则  →  ② 分配身份  →  ③ 游戏开始',W/2,682,14,C.brown,'center');
  button('我知道了，继续',54,H-95,W-108,54,C.orange,()=>{state.screen='role';render();},{size:21});
}

function renderRole(){
  header('界面 8/10 · 身份分配'); state.buttons=[];
  text('联机身份查看：仅显示当前账号身份',W/2,132,15,'#fff','center');
  rr(22,154,W-44,74,20,'rgba(255,255,255,.15)');
  players.forEach((p,i)=>{ const x=42+i*((W-84)/7); avatar(p,x,180,18,p.id===state.currentPlayerId); text(String(i+1),x,210,11,'#fff','center'); });
  const me = players.find(p=>p.id===state.currentPlayerId); const role = state.roles[state.currentPlayerId];
  rr(28,260,W-56,300,24,C.panel,'#d9ae73',3); pill('🎵 歌曲狼人杀',W/2-70,242,140,36,C.purple,'#fff');
  text(`当前玩家：${me.name}`,W/2,305,16,C.gray,'center'); text(`你的身份：${role.role}`,W/2,342,28,role.role==='好人'?C.green:C.red,'center','bold');
  rr(52,380,W-104,112,18,'#fff9ec','#ead2ad'); wrap(role.prompt,72,412,W-144,34,24,C.dark,'bold');
  text('请记住情境，勿让其他玩家看到',W/2,515,14,C.gray,'center');
  text('🔒 仅当前玩家设备可见',W/2,595,20,C.yellow,'center','bold'); text('联机模式下，无需传递手机；其他玩家在自己的设备查看身份',W/2,625,13,'#fff','center');
  button('我记住了',34,H-105,140,54,C.orange,()=>toast('已确认'),{size:20});
  button('进入游戏',W-174,H-105,140,54,C.purple,()=>{state.screen='play';render();},{color:'#fff',size:20});
}

function renderPlay(){
  header('界面 9/10 · 游戏进行中'); state.buttons=[]; roomStrip(118);
  text(`第 ${state.round} 轮 / 共 ${state.totalRounds} 轮`,W/2,198,22,C.yellow,'center','bold');
  rr(24,230,W-48,365,22,C.panel,'#e7c18e',2); text('你的秘密情境',46,265,17,C.brown,'left','bold');
  wrap(state.roles[state.currentPlayerId].prompt,46,300,W-92,28,22,C.dark,'bold');
  text('为你推荐的歌曲',46,382,17,C.brown,'left','bold'); songs.slice(0,3).forEach((s,i)=>{rr(46+i*((W-112)/3),410,(W-132)/3,62,16,'#ffe2ad','#d8b17b'); text('🎵 '+s.name,46+i*((W-112)/3)+(W-132)/6,432,17,C.dark,'center','bold'); text(s.singer,46+i*((W-112)/3)+(W-132)/6,456,12,C.gray,'center');});
  const btnY=495; button('随机换一组',42,btnY,88,38,'#8c6a54',()=>toast('已随机'),{color:'#fff',size:13}); button('仅显示歌名',138,btnY,88,38,'#8c6a54',()=>toast('已切换'),{color:'#fff',size:13}); button('播放副歌',234,btnY,88,38,'#8c6a54',()=>toast('真机可接入音频资源'),{color:'#fff',size:13}); button('歌词提示',W-118,btnY,88,38,'#8c6a54',()=>toast('已显示歌词提示'),{color:'#fff',size:13});
  rr(46,545,W-92,38,12,'#fff9ec'); text('歌词提示：仅展示短提示，不公开完整歌词',W/2,564,13,C.gray,'center');
  rr(18,620,W-36,82,18,'rgba(255,255,255,.13)'); players.forEach((p,i)=>{const x=38+i*((W-76)/7); avatar(p,x,647,16,p.id===state.currentPlayerId); text(i<2?'已完成':(i===2?'进行中':'待演唱'),x,678,10,i===2?C.orange:'#fff','center');});
  button('报警 / 投票',36,H-96,125,50,C.red,()=>{state.screen='vote';render();},{color:'#fff'});
  button('结束并公开身份',W-190,H-96,155,50,C.green,()=>{state.gameEnded=true;state.rolesPublished=true;state.screen='result';render();},{color:'#fff',size:17});
}

function renderVote(){
  header('界面 10/10 · 投票'); state.buttons=[];
  rr(22,135,W-44,H-250,22,C.panel,'#d9ae73',2); text('开始发言与投票',44,170,24,C.brown,'left','bold'); pill('投票倒计时 25s',W-145,150,120,36,'#4b2d1d','#fff');
  players.forEach((p,i)=>{ const col=i%4,row=Math.floor(i/4), x=60+col*((W-120)/3), y=250+row*135; avatar(p,x,y,28,p.id==='p5'); text(`${i+1} ${p.name}`,x,y+45,12,C.dark,'center'); pill(i===5||i===7?'本轮出局':`${[2,0,1,0,3,0,1,0][i]}票`,x-36,y+62,72,25,i===5||i===7?'#aaa':'#86624a','#fff'); if(i===2)pill('已报警',x-32,y+92,64,22,C.red,'#fff'); });
  button('弃票',35,H-170,80,40,'#a98261',()=>toast('已弃票'),{color:'#fff'}); button('确认投票',W/2-80,H-176,160,52,C.orange,()=>toast('投票已确认'),{size:21}); button('发言记录',W-115,H-170,80,40,'#a98261',()=>toast('暂无记录'),{color:'#fff'});
  button('结束并公开身份',54,H-96,W-108,54,C.green,()=>{state.gameEnded=true;state.rolesPublished=true;state.screen='result';render();},{color:'#fff',size:20});
}

function renderResult(){
  header('界面 10/10 · 结果与身份公开'); state.buttons=[];
  rr(24,135,W-48,150,22,C.panel,'#d9ae73',2); text('本局结果',W/2,170,22,C.brown,'center','bold'); text('好人阵营获胜 🏆',W/2,215,34,C.orange,'center','bold'); text('游戏结束后，以下身份已公开',W/2,258,14,C.gray,'center');
  rr(24,310,W-48,260,22,C.panel2,'#d9ae73'); text('全员身份公开',W/2,342,22,C.brown,'center','bold');
  players.forEach((p,i)=>{ const y=382+i*24; text(`${i+1}. ${p.emoji} ${p.name}`,50,y,14,C.dark); const r=state.roles[p.id].role; text(r,W-55,y,14,r==='好人'?C.green:C.red,'right','bold'); });
  rr(24,595,W-48,72,18,'rgba(255,255,255,.14)'); text('统计：4轮 · 放逐狼人2人 · 正确推理5次 · 存活好人6人',W/2,630,14,'#fff','center');
  button('再来一局',24,H-100,105,50,C.orange,()=>{state.gameEnded=false;state.rolesPublished=false;state.screen='lobby';render();}); button('返回游戏库',W/2-60,H-100,120,50,C.purple,()=>{state.screen='category';render();},{color:'#fff'}); button('分享房间',W-129,H-100,105,50,C.green,()=>toast('可接入 wx.shareAppMessage'),{color:'#fff'});
}

function render(){
  clear(); state.buttons=[];
  const map = { lobby:renderLobby, category:renderCategory, werewolfList:renderWerewolfList, guessList:renderGuessList, setupSong:renderSetupSong, setupDraw:renderSetupDraw, rules:renderRules, role:renderRole, play:renderPlay, vote:renderVote, result:renderResult };
  map[state.screen]();
}
function toast(title){ if(wx.showToast) wx.showToast({title, icon:'none', duration:1200}); }

wx.onTouchStart(function(e){
  const t=e.touches && e.touches[0]; if(!t) return;
  const x=t.clientX, y=t.clientY;
  for(let i=state.buttons.length-1;i>=0;i--){ const b=state.buttons[i]; if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){ b.onClick&&b.onClick(); return; } }
});
wx.onShow(render);
render();
