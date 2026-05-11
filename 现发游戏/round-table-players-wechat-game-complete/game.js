
/**
 * 圆桌玩家 · 微信小游戏完整优化版
 * 入口：game.json + game.js
 * 说明：全部 UI 使用 Canvas 绘制，避免普通小程序项目在小游戏 AppID 下出现 game.json 报错。
 * 联机说明：当前为可编译测试的本地模拟联机层。真实联机可在 syncRoomState / updateRoomState 中接入云开发或 WebSocket。
 */

const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')
const sys = wx.getSystemInfoSync()
const DPR = sys.pixelRatio || 1
let W = sys.windowWidth
let H = sys.windowHeight
canvas.width = W * DPR
canvas.height = H * DPR
ctx.scale(DPR, DPR)

const COLORS = {
  bgTop: '#2d1846',
  bgBottom: '#1a122d',
  cream: '#fff0d8',
  cream2: '#fff8ec',
  brown: '#6c3f22',
  brown2: '#8a562e',
  gold: '#ffbd35',
  gold2: '#ffd96a',
  orange: '#ff9f23',
  purple: '#8d6bff',
  green: '#45b85a',
  red: '#df4a40',
  white: '#fff7e7'
}

const players = [
  { id: 'p1', name: '可乐加冰', avatar: '🐶' },
  { id: 'p2', name: '奶茶三分糖', avatar: '🎀' },
  { id: 'p3', name: '南城旧梦', avatar: '🧑' },
  { id: 'p4', name: '星辰大海', avatar: '😊' },
  { id: 'p5', name: '一颗小橙子', avatar: '📷' },
  { id: 'p6', name: '棉花糖', avatar: '🐩' },
  { id: 'p7', name: '圆桌小玩家', avatar: '🧒' },
  { id: 'p8', name: '神秘玩家', avatar: '🦊' }
]

const categories = [
  { id: 'werewolf', name: '狼人杀类', desc: '经典推理，谁是隐藏的狼人？', icon: '🐺' },
  { id: 'guess', name: '猜词类游戏', desc: '画画、猜歌、猜词，欢乐不停歇！', icon: '🎨' },
  { id: 'more', name: '更多游戏', desc: 'Game 8 · Coming Soon', icon: '🎁' }
]

const games = [
  { id:'song-wolf', category:'werewolf', name:'歌曲狼人杀', icon:'🎤', desc:'情境唱歌找卧底', people:'6-12人', group:'可分组', random:'是' },
  { id:'witness-1', category:'werewolf', name:'目击狼人杀 1.0', icon:'👁', desc:'睁眼目击 / 报警投票', people:'6-12人', group:'可分组', random:'是' },
  { id:'witness-2', category:'werewolf', name:'目击狼人杀 2.0', icon:'🫵', desc:'对视或接触淘汰', people:'6-12人', group:'可分组', random:'是' },
  { id:'dance-wolf', category:'werewolf', name:'舞蹈狼人杀', icon:'💃', desc:'听音乐起舞找狼群', people:'6-12人', group:'可分组', random:'是' },
  { id:'trick-killer', category:'werewolf', name:'捣蛋杀手狼人杀', icon:'🎭', desc:'完成暗任务开启捣蛋时刻', people:'6-12人', group:'可分组', random:'是' },
  { id:'table-survival', category:'werewolf', name:'餐桌生存战狼人杀', icon:'🍽', desc:'吃饭中动作攻击', people:'6-12人', group:'可分组', random:'是' },
  { id:'game-8', category:'werewolf', name:'游戏 8', icon:'🌙', desc:'神秘玩法，即将上线', people:'—', group:'—', random:'—', disabled:true },
  { id:'magic-draw', category:'guess', name:'神笔小马良', icon:'🖌', desc:'画画猜题 / 团队对抗', people:'4-12人', group:'需分组', random:'是' },
  { id:'word-guess', category:'guess', name:'猜词挑战', icon:'❓', desc:'随机词语 / 禁止题目外泄', people:'4-12人', group:'可分组', random:'是' },
  { id:'song-guess', category:'guess', name:'猜歌挑战', icon:'🎧', desc:'随机歌名 / 可播副歌与歌词提示', people:'4-12人', group:'可分组', random:'是' },
  { id:'lyric-chain', category:'guess', name:'歌词接龙', icon:'📖', desc:'歌词片段辅助', people:'4-12人', group:'可分组', random:'是' },
  { id:'more-guess', category:'guess', name:'更多玩法', icon:'🎁', desc:'持续更新', people:'—', group:'—', random:'—', disabled:true }
]

const scenarioPairs = [
  { good:'偶遇年少时的白月光，你此刻想唱的歌', bad:'偶遇老友，你此刻想唱的歌' },
  { good:'宠妃遭小人算计被皇上打入冷宫后想唱的歌', bad:'受某种重大挫折时你最想唱的歌' },
  { good:'假期独自旅行时，你此刻想唱的歌', bad:'加班到深夜，你此刻想唱的歌' },
  { good:'雨夜里第一次分手后想唱的歌', bad:'想念旧人时想唱的歌' }
]
const tasks = ['吃西瓜', '剥鹌鹑蛋', '双手戳酒窝', '双手比莲花', '说出“你说得对”', '说出“好吃”', '说出“我是真这么想的”']
const wolfActions = ['用下巴指对方来杀羊', '对人说叠字', '对人说我觉得好好吃', '对人飞吻']
const questions = ['冰雨', '想你的夜', '丢了西瓜捡芝麻', '东倒西歪', '老公', '金三脚', '吃葡萄不吐葡萄皮', '水煮肉片', '家徒四壁']
const songHints = [
  { name:'后来', singer:'刘若英', hint:'“后来，我终于懂得如何去爱”' },
  { name:'晴天', singer:'周杰伦', hint:'“故事里的小黄花，仍在回忆里开”' },
  { name:'演员', singer:'薛之谦', hint:'“简单点，说话的方式简单点”' },
  { name:'想你的夜', singer:'关喆', hint:'“想你的夜，多希望你能在我身边”' },
  { name:'冰雨', singer:'刘德华', hint:'“冷冷的冰雨在脸上胡乱地拍”' }
]

const state = {
  screen: 'home',
  routeStack: [],
  currentTab: 'home',
  room: {
    roomNo: '123456',
    name: '欢乐狼人局',
    maxPlayers: 8,
    players,
    ownerId: 'p1',
    status: 'lobby',
    rolesPublic: false,
    votes: {}
  },
  currentPlayerId: 'p3',
  selectedCategory: 'werewolf',
  selectedGameId: 'song-wolf',
  settings: {
    totalPlayers: 8,
    undercoverCount: 2,
    rounds: 3,
    taskRounds: 4,
    teams: 2,
    answerSeconds: 60
  },
  currentRound: 1,
  roles: {},
  roleRevealed: false,
  songList: songHints.slice(0, 3),
  selectedVote: null,
  toast: '',
  toastUntil: 0
}

const hits = []

function syncRoomState() {
  // 真实联机时，在这里读取云端房间状态或 WebSocket 状态。
  return state.room
}
function updateRoomState(patch) {
  // 真实联机时，在这里写入云端房间状态，并触发其他设备更新。
  Object.assign(state.room, patch, { updatedAt: Date.now() })
  return state.room
}

function showToast(text, duration = 1400) {
  state.toast = text
  state.toastUntil = Date.now() + duration
  draw()
}

function getGame(id = state.selectedGameId) {
  return games.find(g => g.id === id) || games[0]
}
function currentPlayer() {
  return players.find(p => p.id === state.currentPlayerId) || players[0]
}
function navigate(screen) {
  state.routeStack.push(state.screen)
  state.screen = screen
  state.roleRevealed = false
  draw()
}
function back() {
  const prev = state.routeStack.pop()
  state.screen = prev || 'home'
  draw()
}
function switchTab(tab) {
  state.currentTab = tab
  if (tab === 'home') state.screen = 'home'
  if (tab === 'library') state.screen = 'library'
  if (tab === 'room') state.screen = 'room'
  if (tab === 'profile') state.screen = 'profile'
  draw()
}

function startGame() {
  state.roles = assignRoles()
  state.room.rolesPublic = false
  updateRoomState({ status: 'assigning', rolesPublic: false, roles: state.roles })
  navigate('rules')
}
function assignRoles() {
  const selected = state.selectedGameId
  const pair = scenarioPairs[0]
  const roleMap = {}
  players.forEach((p, index) => {
    let role = '好人', camp = 'good', prompt = pair.good
    if (selected === 'song-wolf') {
      const undercover = index === 1 || index === 6
      role = undercover ? '卧底' : '好人'
      camp = undercover ? 'undercover' : 'good'
      prompt = undercover ? pair.bad : pair.good
    } else if (selected.includes('witness') || selected.includes('table')) {
      const wolf = index < 2
      role = wolf ? '狼人' : '小羊'
      camp = wolf ? 'wolf' : 'sheep'
      prompt = wolf ? '你是狼人，可按规则睁眼并完成攻击。' : '你是小羊，请完成任务并找出狼人。'
    } else if (selected === 'dance-wolf') {
      role = index === 0 ? '狼王' : (index === 1 || index === 2 ? '狼崽' : '羊')
      camp = role === '羊' ? 'sheep' : 'wolf'
      prompt = role === '羊' ? '跟随音乐起舞，观察谁的行动异常。' : '隐藏身份，配合狼群完成目标。'
    } else if (selected === 'trick-killer') {
      const killer = index === 0 || index === 3
      role = killer ? '捣蛋杀手' : '好人'
      camp = killer ? 'killer' : 'good'
      prompt = killer ? '暗中完成 3 次指定任务，开启捣蛋时刻。' : '观察异常行为，找出捣蛋杀手。'
    } else if (selected === 'magic-draw') {
      role = index % 2 ? '蓝队' : '红队'
      camp = index % 2 ? 'blue' : 'red'
      prompt = '你的队伍需要根据题板完成画画猜题。'
    }
    roleMap[p.id] = { role, camp, prompt, publicVisible: false }
  })
  return roleMap
}
function revealAllRoles() {
  Object.keys(state.roles).forEach(k => state.roles[k].publicVisible = true)
  updateRoomState({ status: 'ended', rolesPublic: true, roles: state.roles })
  state.screen = 'result'
  draw()
}

function addHit(x, y, w, h, cb, id='') {
  hits.push({ x, y, w, h, cb, id })
}
function clearHits() { hits.length = 0 }

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
function fillRound(x, y, w, h, r, fill) {
  ctx.save()
  roundRect(x,y,w,h,r)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
}
function strokeRound(x,y,w,h,r,stroke,lw=1) {
  ctx.save()
  roundRect(x,y,w,h,r)
  ctx.strokeStyle = stroke
  ctx.lineWidth = lw
  ctx.stroke()
  ctx.restore()
}
function shadow(blur=12, color='rgba(0,0,0,.25)', ox=0, oy=8) {
  ctx.shadowBlur = blur
  ctx.shadowColor = color
  ctx.shadowOffsetX = ox
  ctx.shadowOffsetY = oy
}
function drawText(text, x, y, size=14, color='#fff', weight='normal', align='left', maxWidth) {
  ctx.save()
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  if (maxWidth) ctx.fillText(text, x, y, maxWidth)
  else ctx.fillText(text, x, y)
  ctx.restore()
}
function wrapText(text, x, y, maxWidth, lineHeight, size=14, color='#fff', weight='normal', maxLines=10) {
  ctx.save()
  ctx.font = `${weight} ${size}px sans-serif`
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  let line = ''
  let lineCount = 0
  for (let i=0; i<text.length; i++) {
    const test = line + text[i]
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      y += lineHeight
      line = text[i]
      lineCount++
      if (lineCount >= maxLines - 1) {
        ctx.fillText(line + '…', x, y)
        ctx.restore()
        return y + lineHeight
      }
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, y)
  ctx.restore()
  return y + lineHeight
}
function pillText(text, x, y, padX=10, padY=5, bg='rgba(255,255,255,.18)', color='#fff', size=12) {
  ctx.save()
  ctx.font = `bold ${size}px sans-serif`
  const w = ctx.measureText(text).width + padX*2
  const h = size + padY*2
  fillRound(x, y, w, h, h/2, bg)
  drawText(text, x + padX, y + padY, size, color, 'bold')
  ctx.restore()
  return w
}
function button(text, x, y, w, h, cb, primary=true) {
  ctx.save()
  shadow(10, 'rgba(0,0,0,.25)', 0, 6)
  const g = ctx.createLinearGradient(0, y, 0, y+h)
  if (primary) {
    g.addColorStop(0, COLORS.gold2); g.addColorStop(1, COLORS.orange)
  } else {
    g.addColorStop(0, '#b98558'); g.addColorStop(1, '#80502c')
  }
  fillRound(x,y,w,h,h/2,g)
  ctx.shadowColor = 'transparent'
  drawText(text, x+w/2, y+h/2-11, 22, primary ? '#612a0a' : '#fff4df', 'bold', 'center')
  ctx.restore()
  addHit(x,y,w,h,cb,text)
}
function drawHeader(title, showBack=true) {
  const top = 32
  if (showBack) {
    fillRound(22, top+2, 44, 44, 22, '#8a562e')
    drawText('‹', 44, top-3, 40, '#fff', 'bold', 'center')
    addHit(22, top+2, 44, 44, back, 'back')
  }
  drawText(title || '圆桌玩家', W/2, top+10, 22, '#fff3d5', 'bold', 'center')
  fillRound(W-116, top+8, 92, 36, 18, 'rgba(255,255,255,.12)')
  strokeRound(W-116, top+8, 92, 36, 18, 'rgba(255,255,255,.45)', 1)
  drawText('•••  ◉', W-70, top+15, 18, '#fff', 'bold', 'center')
}
function drawLogo() {
  drawText('🎉', 28, 38, 16, '#fff')
  drawText('圆桌玩家', 52, 34, 32, '#ffe993', 'bold')
  drawText('◆', 185, 48, 12, '#ff725d')
}
function drawBg() {
  const g = ctx.createLinearGradient(0,0,0,H)
  g.addColorStop(0, COLORS.bgTop)
  g.addColorStop(1, COLORS.bgBottom)
  ctx.fillStyle = g
  ctx.fillRect(0,0,W,H)
  // decorative confetti
  const conf = [
    [40,112,'#ffcf5a'],[108,132,'#7adf9a'],[210,100,'#9574ff'],[292,160,'#ff7886'],[345,244,'#ffcf5a'],
    [68,548,'#6dd7ff'],[145,615,'#8dd66a'],[238,540,'#9574ff'],[330,640,'#ff7886'],[84,730,'#ffcf5a']
  ]
  conf.forEach((c,i)=>{ctx.fillStyle=c[2]; ctx.fillRect(c[0], c[1], 7+(i%3)*2, 3+(i%2)*3)})
}
function drawToast() {
  if (!state.toast || Date.now() > state.toastUntil) return
  const w = Math.min(W - 80, 280)
  fillRound((W-w)/2, H-142, w, 42, 21, 'rgba(0,0,0,.62)')
  drawText(state.toast, W/2, H-131, 14, '#fff', 'bold', 'center')
}
function drawBottomNav() {
  const y = H - 86
  const x = 20
  const h = 66
  const w = W - 40
  fillRound(x, y, w, h, 26, 'rgba(255,248,240,.96)')
  const tabs = [
    ['home','首页','⌂'],
    ['library','游戏库','🎮'],
    ['room','房间','🚪'],
    ['profile','我的','👤']
  ]
  const cell = w / 4
  tabs.forEach((t,i)=>{
    const cx = x + cell*i + cell/2
    const active = state.currentTab === t[0]
    if (active) fillRound(cx-30, y+8, 60, 50, 18, t[0]==='room'?'#eee8ff':'#ffe9c9')
    drawText(t[2], cx, y+10, 20, active?(t[0]==='room'?COLORS.purple:'#f29c1f'):'#888', 'bold', 'center')
    drawText(t[1], cx, y+38, 11, active?(t[0]==='room'?COLORS.purple:'#f29c1f'):'#888', 'bold', 'center')
    addHit(x+cell*i, y, cell, h, ()=>switchTab(t[0]), t[0])
  })
}

function drawHome() {
  drawLogo()
  fillRound(28, 98, W-56, 62, 20, 'rgba(255,255,255,.14)')
  strokeRound(28,98,W-56,62,20,'rgba(255,255,255,.12)',1)
  drawText('欢乐狼人局  🔒', 50, 112, 18, '#fff7e3', 'bold')
  drawText('房间号：123456', 50, 137, 13, '#e7d7cc')
  drawText('已加入 ', W-118, 120, 17, '#fff', 'bold')
  drawText('8/8', W-56, 120, 19, '#fff', 'bold', 'center')

  const cx = W/2, cy = H*0.48, r = Math.min(W*0.42, 170)
  ctx.save()
  shadow(18, 'rgba(0,0,0,.30)', 0, 12)
  const tg = ctx.createRadialGradient(cx-50, cy-60, 10, cx, cy, r)
  tg.addColorStop(0, '#d99048')
  tg.addColorStop(1, '#9d5a2b')
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=tg; ctx.fill()
  ctx.shadowColor='transparent'
  ctx.lineWidth=8; ctx.strokeStyle='rgba(255,197,119,.35)'; ctx.stroke()
  ctx.restore()

  button('开始游戏', cx-105, cy-42, 210, 68, ()=>navigate('library'), true)
  drawText('所有人准备后由房主开局', cx, cy+35, 14, '#fff1dd', 'normal', 'center')

  const seatR = r + 46
  players.forEach((p, i)=>{
    const angle = -Math.PI/2 + (Math.PI*2/players.length)*i
    const x = cx + Math.cos(angle)*seatR
    const y = cy + Math.sin(angle)*seatR
    drawSeat(p, x, y, i)
  })
  button('＋ 邀请好友', cx-72, cy+r+42, 144, 46, ()=>showToast('已打开邀请分享入口'), false)

  fillRound(44, H-148, W-88, 42, 21, 'rgba(255,255,255,.16)')
  drawText('💡 联机模式：每位玩家在自己的设备查看身份', W/2, H-136, 13, '#fff4df', 'bold', 'center')
  drawBottomNav()
}
function drawSeat(p, x, y, i) {
  ctx.save()
  ctx.beginPath(); ctx.arc(x,y,25,0,Math.PI*2); ctx.fillStyle='#fff4df'; ctx.fill()
  ctx.lineWidth = p.id === state.currentPlayerId ? 4 : 2
  ctx.strokeStyle = p.id === state.currentPlayerId ? COLORS.gold2 : '#fff'
  ctx.stroke()
  drawText(p.avatar, x, y-14, 20, '#333', 'normal', 'center')
  if (p.id === state.currentPlayerId) {
    pillText('我', x+14, y-28, 8, 4, COLORS.gold2, '#6b320c', 12)
  }
  const name = `${i+1} ${p.name}`
  const bw = Math.min(104, Math.max(58, name.length*10))
  fillRound(x-bw/2, y+27, bw, 24, 12, 'rgba(84,46,22,.88)')
  drawText(name, x, y+33, 11, '#fff7e9', 'bold', 'center', bw-4)
  ctx.restore()
}

function drawLibrary() {
  drawLogo()
  drawText('选择游戏类别', W/2, 92, 22, '#fff3d5', 'bold', 'center')
  drawCategoryCard(0, categories[0], 24, 132, W-48, 148, '#5d3485', '#2e1d47', ()=>{state.selectedCategory='werewolf'; navigate('gameList')})
  drawCategoryCard(1, categories[1], 24, 298, W-48, 148, '#ffb547', '#d67522', ()=>{state.selectedCategory='guess'; navigate('gameList')})
  drawCategoryCard(2, categories[2], 24, 464, W-48, 102, '#fff1d8', '#f8dfbd', ()=>showToast('更多游戏 Coming Soon'), true)
  fillRound(74, 594, W-148, 54, 27, 'rgba(255,255,255,.16)')
  drawText('＋ 新增游戏入口', W/2, 608, 17, '#fff7e7', 'bold', 'center')
  addHit(74,594,W-148,54,()=>showToast('后续可在这里创建自定义玩法'))
  drawBottomNav()
}
function drawCategoryCard(index, item, x, y, w, h, c1, c2, cb, light=false) {
  ctx.save(); shadow(12,'rgba(0,0,0,.25)',0,8)
  const g = ctx.createLinearGradient(x,y,x+w,y+h); g.addColorStop(0,c1); g.addColorStop(1,c2)
  fillRound(x,y,w,h,22,g); ctx.shadowColor='transparent'
  drawText(item.icon, x+58, y+h/2-28, 40, light?'#6c3f22':'#fff')
  drawText(item.name, x+112, y+32, index===2?24:30, light?'#6c3f22':'#fff7e6', 'bold')
  drawText(item.desc, x+112, y+75, 14, light?'#875c3c':'#fff0d2')
  drawText('›', x+w-34, y+h/2-21, 38, light?'#8b5a33':'#fff', 'bold', 'center')
  ctx.restore()
  addHit(x,y,w,h,cb,item.id)
}

function drawGameList() {
  drawHeader(state.selectedCategory==='guess'?'界面 4/10 · 猜词类游戏':'界面 3/10 · 狼人杀类游戏')
  const top = 92
  fillRound(24, top, W-48, 44, 22, 'rgba(255,255,255,.13)')
  const tabW = (W-48)/2
  ;[['werewolf','🐺 狼人杀类'],['guess','🎨 猜词类']].forEach((t,i)=>{
    const active = state.selectedCategory===t[0]
    if(active) fillRound(24+i*tabW+6, top+5, tabW-12, 34, 17, COLORS.gold)
    drawText(t[1], 24+i*tabW+tabW/2, top+14, 14, active?'#6b320c':'#fff', 'bold', 'center')
    addHit(24+i*tabW, top, tabW, 44, ()=>{state.selectedCategory=t[0]; draw()})
  })
  const list = games.filter(g=>g.category===state.selectedCategory || (state.selectedCategory==='werewolf' && g.id==='game-8'))
  const startY = 154
  const cardW = (W-56)/2
  list.forEach((g,i)=>{
    const col=i%2, row=Math.floor(i/2)
    const x=22+col*(cardW+12), y=startY+row*122
    drawGameCard(g,x,y,cardW,106)
  })
  button('进入设置', W/2-120, H-150, 240, 58, ()=>navigate('setup'), true)
}
function drawGameCard(g,x,y,w,h) {
  const selected = state.selectedGameId===g.id
  fillRound(x,y,w,h,18, g.disabled?'rgba(255,240,216,.55)':'rgba(255,244,224,.94)')
  if(selected) strokeRound(x,y,w,h,18,COLORS.gold,4)
  drawText(g.icon, x+26, y+16, 28, '#5b3217')
  drawText(g.name, x+60, y+16, 16, g.disabled?'#8f806f':'#4b2b14', 'bold', 'left', w-66)
  drawText(g.desc, x+12, y+48, 12, '#8d6b51', 'normal', 'left', w-24)
  drawText(`${g.people} · ${g.group} · 随机:${g.random}`, x+12, y+76, 10, '#7c6048', 'normal', 'left', w-24)
  if(g.disabled) pillText('Coming Soon', x+w-78, y+12, 7, 3, '#aaa', '#fff', 10)
  addHit(x,y,w,h,()=>{
    if(g.disabled) showToast('该玩法即将上线')
    else { state.selectedGameId=g.id; draw() }
  },g.id)
}

function drawSetup() {
  const game = getGame()
  drawHeader(`游戏设置（${game.name}）`)
  fillRound(24, 92, W-48, 78, 22, 'rgba(255,255,255,.14)')
  drawText(game.icon, 52, 110, 32, '#fff')
  drawText(game.name, 94, 106, 24, '#fff7df', 'bold')
  drawText('联机模式：身份只发送到对应玩家设备', 94, 136, 12, '#ffe0ad')

  fillRound(24, 188, W-48, H-310, 26, COLORS.cream)
  if (game.category === 'guess') drawGuessSetup(44, 208)
  else drawWolfSetup(44, 208)
  button('查看规则 / 开始分配', 54, H-102, W-108, 58, startGame, true)
}
function rowLabel(icon,label,x,y) {
  drawText(icon, x, y+5, 20, COLORS.brown)
  drawText(label, x+34, y+8, 16, '#4b2b14', 'bold')
}
function drawWolfSetup(x,y) {
  const rows = [
    ['👥','总人数', `${state.settings.totalPlayers}`],
    ['🐺','卧底数量', `${state.settings.undercoverCount}  自动生成`],
    ['⏳','游戏轮次', `${state.settings.rounds}`],
    ['📖','情境题库', '随机生成'],
    ['🎵','歌曲重复', '不可重复'],
    ['🎤','演唱规则', '每人每轮 1~2 句']
  ]
  rows.forEach((r,i)=>{
    const yy=y+i*46
    rowLabel(r[0],r[1],x,yy)
    drawText(r[2], W-50, yy+8, 15, '#6b3a18', 'bold', 'right')
    ctx.strokeStyle='rgba(210,170,120,.45)'; ctx.beginPath(); ctx.moveTo(x,yy+42); ctx.lineTo(W-44,yy+42); ctx.stroke()
  })
  const py = y + rows.length*48 + 8
  drawText('情境预览（随机生成示例）', x, py, 16, '#6b3a18', 'bold')
  const sc = scenarioPairs[0]
  drawScenarioLine('好人情境', sc.good, x, py+30, '#dff4c8', '#34792a')
  drawScenarioLine('卧底情境', sc.bad, x, py+74, '#ffe0dd', '#b4312a')
  drawText('💡 开局先展示规则，再由系统下发到每个玩家自己的设备。', x, py+126, 12, '#8b5a33')
}
function drawScenarioLine(tag, text, x, y, bg, color) {
  fillRound(x, y, 76, 28, 14, bg)
  drawText(tag, x+38, y+7, 11, color, 'bold', 'center')
  fillRound(x+86, y, W-x-130, 28, 14, '#fffaf1')
  drawText(text, x+96, y+7, 11, '#5b3a22', 'normal', 'left', W-x-150)
}
function drawGuessSetup(x,y) {
  const rows = [
    ['👥','队伍数量', '2 队'],
    ['👫','自动分组', '红队 3 人 / 蓝队 3 人'],
    ['❔','题板类型', '成语 / 词语 / 歌名 / 歌词'],
    ['⏱','答题时长', `${state.settings.answerSeconds} 秒`],
    ['🖌','轮流作画', '开启'],
    ['🎲','随机题库', '随机更换']
  ]
  rows.forEach((r,i)=>{
    const yy=y+i*46
    rowLabel(r[0],r[1],x,yy)
    drawText(r[2], W-50, yy+8, 13, '#6b3a18', 'bold', 'right')
    ctx.strokeStyle='rgba(210,170,120,.45)'; ctx.beginPath(); ctx.moveTo(x,yy+42); ctx.lineTo(W-44,yy+42); ctx.stroke()
  })
  const py = y + rows.length*48 + 8
  drawText('题板内容预览（仅示例）', x, py, 16, '#6b3a18', 'bold')
  questions.slice(0,4).forEach((q,i)=>pillText(q, x+(i%2)*122, py+28+Math.floor(i/2)*36, 10, 6, '#fffaf1', '#6b3a18', 12))
  drawText('🔒 猜题成员不可见题目，其他成员可见。', x, py+108, 12, '#8b5a33')
}

function drawRules() {
  const game = getGame()
  drawHeader('界面 7/10 · 游戏规则')
  fillRound(44, 88, W-88, 56, 28, 'rgba(255,255,255,.14)')
  drawText(`${game.icon} ${game.name}`, W/2, 103, 22, '#fff7df', 'bold', 'center')

  fillRound(24, 164, W-48, H-250, 26, COLORS.cream)
  fillRound(70, 184, W-140, 44, 14, COLORS.brown2)
  drawText('⭐ 游戏规则 ⭐', W/2, 196, 20, '#fff7df', 'bold', 'center')
  const rules = getRules(game.id)
  let y = 244
  rules.slice(0,8).forEach((r,i)=>{
    fillRound(42, y, W-84, 40, 18, COLORS.cream2)
    fillRound(52, y+7, 26, 26, 13, COLORS.gold)
    drawText(String(i+1), 65, y+12, 12, '#fff', 'bold', 'center')
    wrapText(r, 88, y+9, W-130, 17, 12, '#4e2e18', 'bold', 2)
    y += 46
  })
  drawText('随机任务示例', W/2, y+6, 16, '#6b3a18', 'bold', 'center')
  ;[...tasks.slice(0,2), ...wolfActions.slice(0,2)].forEach((t,i)=>{
    pillText(t, 44+(i%2)*(W/2-34), y+34+Math.floor(i/2)*36, 8, 6, COLORS.cream2, '#6b3a18', 12)
  })
  button('我知道了，继续', 54, H-92, W-108, 58, ()=>navigate('role'), true)
}
function getRules(id) {
  const map = {
    'song-wolf':['卧底数量不超过总人数 1/3。','好人知道准确情境，卧底只知道模糊情境。','游戏三轮，每人每轮唱 1~2 句。','歌曲不可重复，其他玩家通过演唱推理身份。','三轮内找出所有卧底，好人胜利；否则卧底胜利。','联机模式下，每位玩家只在自己的设备查看身份。','只有游戏结束后，点击“结束并公开身份”才可查看全员身份。'],
    'witness-1':['狼人数量不超过总人数 1/3。','小羊目标：在指定回合内完成任务。','狼人可随时睁眼，通过对视杀掉小羊。','被杀小羊禁言并做指定动作。','小羊每轮只有一次睁眼机会。','发现疑似狼人可报警，报警后发言并票人。','到达指定回合场上还有狼人，则狼人胜利。'],
    'magic-draw':['各队各派一名队员根据题板画画。','画完按铃，同队其余人猜测画的内容。','两队轮流答题，指定时间内答对更多的队伍获胜。','题板内容可为成语、词语、歌名或歌词。','猜题成员不可见题目，其他指定成员可见。']
  }
  return map[id] || map['witness-1']
}

function drawRole() {
  const me = currentPlayer()
  const myRole = state.roles[me.id] || assignRoles()[me.id]
  drawHeader('界面 8/10 · 联机身份查看')
  fillRound(24, 90, W-48, 82, 22, 'rgba(255,255,255,.14)')
  drawText(`当前设备玩家：${me.name}`, W/2, 102, 16, '#fff7df', 'bold', 'center')
  players.forEach((p,i)=>{
    const x = 44 + i*((W-88)/7)
    drawText(p.avatar, x, 132, 20, '#fff', 'normal', 'center')
    if(p.id===me.id) {
      ctx.beginPath(); ctx.arc(x,142,18,0,Math.PI*2); ctx.strokeStyle=COLORS.gold; ctx.lineWidth=3; ctx.stroke()
    }
  })

  fillRound(24, 210, W-48, 320, 28, '#fff0d8')
  fillRound(W/2-105, 190, 210, 40, 20, COLORS.purple)
  drawText(`🎵 ${getGame().name} 🎵`, W/2, 200, 16, '#fff', 'bold', 'center')
  drawText('当前：仅自己设备可见', W-46, 242, 12, '#8b5a33', 'bold', 'right')
  drawText('你的身份：', W/2-20, 270, 24, '#4e2e18', 'bold', 'right')
  drawText(myRole.role, W/2-14, 270, 26, roleColor(myRole.camp), 'bold')

  fillRound(48, 322, W-96, 140, 20, COLORS.cream2)
  if(state.roleRevealed) {
    wrapText(myRole.prompt, 70, 354, W-140, 28, 22, '#4b2b14', 'bold', 4)
    drawText('请记住情境，勿让其他玩家看到。', W/2, 430, 13, '#a17c5e', 'normal', 'center')
  } else {
    drawText('🙈', W/2, 342, 38, '#4b2b14', 'normal', 'center')
    drawText('点击查看你的身份与情境', W/2, 390, 18, '#4b2b14', 'bold', 'center')
    drawText('系统只在当前登录玩家设备显示。', W/2, 420, 12, '#a17c5e', 'normal', 'center')
    addHit(48,322,W-96,140,()=>{state.roleRevealed=true; draw()})
  }
  drawText('🛡 其他玩家需要在自己的设备查看身份；游戏结束前不公开。', W/2, 560, 13, '#ffeed6', 'bold', 'center')
  button(state.roleRevealed?'隐藏内容':'查看身份', 34, H-102, 140, 58, ()=>{state.roleRevealed=!state.roleRevealed; draw()}, false)
  button('进入游戏', 190, H-102, W-224, 58, ()=>{updateRoomState({status:'playing'}); navigate('play')}, true)
}
function roleColor(camp) {
  return camp==='good' ? COLORS.green : (camp==='sheep' ? '#4087d7' : COLORS.red)
}

function drawPlay() {
  const me = currentPlayer()
  const myRole = state.roles[me.id] || {}
  drawHeader('界面 9/10 · 游戏进行中')
  fillRound(24, 92, W-48, 58, 20, 'rgba(255,255,255,.14)')
  drawText(`${getGame().name}`, 48, 105, 20, '#fff7df', 'bold')
  drawText(`第 ${state.currentRound} 轮 / 共 ${state.settings.rounds} 轮`, W-48, 110, 13, '#ffe0ad', 'bold', 'right')

  fillRound(24, 172, W-48, 386, 26, COLORS.cream)
  pillText('你的秘密情境', 46, 194, 10, 6, COLORS.brown2, '#fff', 13)
  fillRound(46, 232, W-92, 92, 20, COLORS.cream2)
  wrapText(myRole.prompt || '请等待身份下发', 64, 254, W-128, 24, 18, '#4b2b14', 'bold', 3)
  drawText('🎵 为你推荐的歌曲', 46, 348, 16, '#6b3a18', 'bold')
  state.songList.forEach((s,i)=>{
    const cw = (W-112)/3
    const x = 46 + i*(cw+10)
    fillRound(x, 378, cw, 64, 18, '#ffe8be')
    drawText(s.name, x+cw/2, 390, 16, '#6b3a18', 'bold', 'center')
    drawText(s.singer, x+cw/2, 416, 11, '#a17c5e', 'normal', 'center')
  })
  const actions = ['🔀 随机换一组','☰ 仅显示歌名','▶ 播放副歌','▣ 歌词提示']
  actions.forEach((a,i)=>{
    const cw = (W-112)/4
    const x = 46 + i*(cw+6)
    fillRound(x, 462, cw, 42, 12, '#7a5842')
    drawText(a, x+cw/2, 476, 10, '#fff4df', 'bold', 'center')
    if(i===0) addHit(x,462,cw,42,()=>{state.songList=songHints.slice().sort(()=>Math.random()-.5).slice(0,3); draw()})
  })
  fillRound(46, 518, W-92, 54, 16, COLORS.cream2)
  drawText(state.songList[0].hint, W/2, 535, 13, '#5b3217', 'bold', 'center', W-120)
  button('进入投票', 34, H-102, 140, 58, ()=>navigate('vote'), false)
  button('结束并公开身份', 190, H-102, W-224, 58, ()=>revealAllRoles(), true)
}

function drawVote() {
  drawHeader('界面 10/10 · 投票与发言')
  fillRound(24, 92, W-48, H-190, 26, COLORS.cream)
  drawText('开始发言与投票', 48, 118, 22, '#553116', 'bold')
  drawText('第 3 夜 · 讨论阶段', 48, 148, 13, '#99765a')
  fillRound(W-102, 112, 64, 42, 21, '#5b3b27')
  drawText('25s', W-70, 124, 18, '#fff', 'bold', 'center')
  const votes = [2,0,1,0,3,0,1,0]
  players.forEach((p,i)=>{
    const col=i%4, row=Math.floor(i/4)
    const cw=(W-70)/4, ch=112
    const x=35+col*cw, y=186+row*ch
    fillRound(x,y,cw-8,100,18, COLORS.cream2)
    if(state.selectedVote===p.id) strokeRound(x,y,cw-8,100,18,COLORS.gold,3)
    drawText(p.avatar, x+(cw-8)/2, y+12, 24, '#333', 'normal', 'center')
    drawText(`${i+1} ${p.name}`, x+(cw-8)/2, y+45, 10, '#4b2b14', 'bold', 'center', cw-14)
    pillText(`${votes[i]}票`, x+(cw-8)/2-18, y+68, 8, 3, '#8a6247', '#fff', 10)
    if(i===2) pillText('已报警', x+(cw-8)/2-25, y+88, 5, 2, COLORS.red, '#fff', 9)
    addHit(x,y,cw-8,100,()=>{state.selectedVote=p.id; draw()})
  })
  button('弃票', 36, H-102, 90, 58, ()=>showToast('已弃票'), false)
  button('确认投票', 142, H-102, W-178, 58, ()=>showToast('投票已确认'), true)
}

function drawResult() {
  drawHeader('界面 10/10 · 结果与身份公开', false)
  fillRound(24, 92, W-48, H-190, 26, COLORS.cream)
  pillText('🎉 本局结果 🎉', W/2-58, 116, 12, 6, '#f08326', '#fff', 14)
  drawText('好人阵营获胜 🏆', W/2, 164, 30, '#e07316', 'bold', 'center')
  drawText('游戏结束后，以下身份才对所有玩家公开。', W/2, 206, 12, '#9a795d', 'normal', 'center')
  const stats = [['4','游戏轮数'],['2','放逐狼人数'],['5','正确推理'],['6','存活好人'],['18分','本局时长']]
  stats.forEach((s,i)=>{
    const cw=(W-70)/5, x=35+i*cw
    drawText(s[0], x+cw/2, 238, 20, '#75421d', 'bold', 'center')
    drawText(s[1], x+cw/2, 266, 9, '#9b7c62', 'normal', 'center')
  })
  drawText('🔓 全员身份公开', 48, 306, 18, '#5b3519', 'bold')
  players.forEach((p,i)=>{
    const role = state.roles[p.id] || {}
    const y=340+i*34
    fillRound(44,y,W-88,28,12, i%2?'#fff9ec':'#fff4df')
    drawText(`${p.avatar} ${i+1} ${p.name}`, 58, y+7, 12, '#4b2b14', 'bold')
    pillText(role.role || '未知', W-118, y+4, 10, 4, roleColor(role.camp), '#fff', 11)
  })
  button('再来一局', 26, H-102, 110, 58, ()=>{state.screen='library'; draw()}, true)
  button('返回游戏库', 146, H-102, 120, 58, ()=>{state.screen='library'; draw()}, false)
  button('分享房间', 278, H-102, W-304, 58, ()=>showToast('已打开分享入口'), true)
}

function drawRoom() {
  drawLogo()
  fillRound(24, 104, W-48, 390, 26, 'rgba(255,255,255,.14)')
  drawText('欢乐狼人局', 48, 130, 24, '#fff7df', 'bold')
  drawText('房间号：123456', 48, 164, 14, '#e7d7cc')
  drawText(`当前 ${players.length}/${state.room.maxPlayers} 人`, 48, 202, 18, COLORS.gold2, 'bold')
  players.forEach((p,i)=>{
    const col=i%4, row=Math.floor(i/4)
    const x=48+col*((W-96)/4), y=244+row*98
    drawText(p.avatar, x+30, y, 30, '#fff', 'normal', 'center')
    drawText(p.name, x+30, y+44, 11, '#fff7df', 'bold', 'center')
  })
  button('开始游戏', 52, 438, W-104, 58, ()=>navigate('library'), true)
  drawBottomNav()
}
function drawProfile() {
  drawLogo()
  fillRound(24, 112, W-48, 360, 26, COLORS.cream)
  drawText('🦊', 60, 146, 42, '#333')
  drawText('圆桌玩家', 120, 150, 24, '#4b2b14', 'bold')
  drawText('聚会小游戏辅助官', 120, 184, 14, '#9f8165')
  ;['我的房间','最近游戏','题库管理','新增游戏入口'].forEach((t,i)=>{
    drawText(t, 58, 250+i*48, 16, '#62391b', 'bold')
    drawText('›', W-58, 250+i*48, 20, '#62391b', 'bold', 'center')
  })
  drawBottomNav()
}

function draw() {
  clearHits()
  drawBg()
  syncRoomState()
  switch(state.screen) {
    case 'home': drawHome(); break
    case 'library': drawLibrary(); break
    case 'gameList': drawGameList(); break
    case 'setup': drawSetup(); break
    case 'rules': drawRules(); break
    case 'role': drawRole(); break
    case 'play': drawPlay(); break
    case 'vote': drawVote(); break
    case 'result': drawResult(); break
    case 'room': drawRoom(); break
    case 'profile': drawProfile(); break
    default: drawHome()
  }
  drawToast()
}

wx.onTouchStart(e => {
  const t = e.touches && e.touches[0]
  if (!t) return
  const x = t.clientX, y = t.clientY
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i]
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
      h.cb()
      return
    }
  }
})

wx.onShow(() => draw())
wx.onShareAppMessage(() => ({
  title: '来圆桌玩家一起开局',
  imageUrl: 'assets/home_ref.png'
}))
draw()
