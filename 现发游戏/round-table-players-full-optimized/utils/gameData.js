const players = [
  { id: 'p1', name: '可乐加冰', avatar: '🐶' },
  { id: 'p2', name: '奶茶三分糖', avatar: '🎀' },
  { id: 'p3', name: '南城旧梦', avatar: '🧑🏻' },
  { id: 'p4', name: '星辰大海', avatar: '😊' },
  { id: 'p5', name: '一颗小橙子', avatar: '📷' },
  { id: 'p6', name: '棉花糖', avatar: '🐩' },
  { id: 'p7', name: '圆桌小玩家', avatar: '🧒' },
  { id: 'p8', name: '神秘玩家', avatar: '🦊' }
]

const categories = [
  { id: 'werewolf', name: '狼人杀类', icon: '🐺', desc: '经典推理，谁是隐藏的狼人？', tags: ['派对推理', '角色扮演', '逻辑博弈'] },
  { id: 'guess', name: '猜词类游戏', icon: '🎨', desc: '画画、猜歌、猜词，欢乐不停歇！', tags: ['你画我猜', '猜歌名', '猜词语'] },
  { id: 'more', name: '更多游戏', icon: '🎁', desc: 'Game 8 · Coming Soon', tags: ['持续更新'] }
]

const games = [
  { id:'song-wolf', category:'werewolf', name:'歌曲狼人杀', icon:'🎤', desc:'情境唱歌找卧底', people:'6-12人', group:'可分组', random:'是' },
  { id:'witness-1', category:'werewolf', name:'目击狼人杀 1.0', icon:'👁️', desc:'睁眼目击 / 报警投票', people:'6-12人', group:'可分组', random:'是' },
  { id:'witness-2', category:'werewolf', name:'目击狼人杀 2.0', icon:'🫵', desc:'对视或接触淘汰', people:'6-12人', group:'可分组', random:'是' },
  { id:'dance-wolf', category:'werewolf', name:'舞蹈狼人杀', icon:'💃', desc:'听音乐起舞找狼群', people:'6-12人', group:'可分组', random:'是' },
  { id:'trick-killer', category:'werewolf', name:'捣蛋杀手狼人杀', icon:'🎭', desc:'完成暗任务开启捣蛋时刻', people:'6-12人', group:'可分组', random:'是' },
  { id:'table-survival', category:'werewolf', name:'餐桌生存战狼人杀', icon:'🍽️', desc:'吃饭中动作攻击', people:'6-12人', group:'可分组', random:'是' },
  { id:'magic-draw', category:'guess', name:'神笔小马良', icon:'🖌️', desc:'画画猜题 / 团队对抗', people:'4-12人', group:'需分组', random:'是' },
  { id:'word-guess', category:'guess', name:'猜词挑战', icon:'❓', desc:'随机词语 / 禁止题目外泄', people:'4-12人', group:'可分组', random:'是' },
  { id:'song-guess', category:'guess', name:'猜歌挑战', icon:'🎧', desc:'随机歌名 / 可播副歌与歌词提示', people:'4-12人', group:'可分组', random:'是' },
  { id:'lyric-chain', category:'guess', name:'歌词接龙', icon:'📖', desc:'歌词片段辅助', people:'4-12人', group:'可分组', random:'是' },
  { id:'game-8', category:'more', name:'游戏 8', icon:'🌙', desc:'神秘玩法，即将上线', people:'—', group:'—', random:'—', disabled:true }
]

const scenarioPairs = [
  { good:'偶遇年少时的白月光，你此刻想唱的歌', bad:'偶遇老友，你此刻想唱的歌' },
  { good:'宠妃遭小人算计被皇上打入冷宫后想唱的歌', bad:'受某种重大挫折时你最想唱的歌' },
  { good:'假期独自旅行时，你此刻想唱的歌', bad:'加班到深夜，你此刻想唱的歌' },
  { good:'雨夜里第一次分手后想唱的歌', bad:'想念旧人时想唱的歌' }
]

const tasks = ['吃西瓜', '剥鹌鹑蛋', '双手戳酒窝', '双手比莲花', '说出“你说得对”', '说出“好吃”', '说出“我是真这么想的”']
const wolfActions = ['用下巴指对方来杀羊', '对人说叠字', '对人说“我觉得好好吃”', '对人飞吻']
const questions = ['冰雨', '想你的夜', '丢了西瓜捡芝麻', '东倒西歪', '老公', '金三脚', '吃葡萄不吐葡萄皮', '水煮肉片', '家徒四壁']
const songHints = [
  { name:'后来', singer:'刘若英', hint:'“后来，我终于懂得如何去爱”' },
  { name:'晴天', singer:'周杰伦', hint:'“故事里的小黄花，仍在回忆里开”' },
  { name:'演员', singer:'薛之谦', hint:'“简单点，说话的方式简单点”' },
  { name:'想你的夜', singer:'关喆', hint:'“想你的夜，多希望你能在我身边”' },
  { name:'冰雨', singer:'刘德华', hint:'“冷冷的冰雨在脸上胡乱地拍”' }
]

function createMockRoom() {
  return {
    roomNo: '123456',
    name: '欢乐狼人局',
    maxPlayers: 8,
    ownerId: 'p1',
    players: players.slice(0, 8),
    inviteCode: 'RT-123456'
  }
}

function getGame(id) { return games.find(g => g.id === id) || games[0] }
function getGamesByCategory(category) { return games.filter(g => g.category === category || (category === 'werewolf' && g.id === 'game-8')) }
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }

module.exports = { categories, games, scenarioPairs, tasks, wolfActions, questions, songHints, createMockRoom, getGame, getGamesByCategory, pickRandom }
