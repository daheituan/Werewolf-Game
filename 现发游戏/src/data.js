const GAME_CATEGORIES = [
  { id: "wolf", name: "狼人杀类" },
  { id: "guess", name: "猜词类" }
];

const GAME_DEFINITIONS = [
  {
    id: "song_wolf",
    category: "wolf",
    name: "歌曲狼人杀",
    summary: "按情景唱歌，三轮内找出卧底。",
    rounds: 3
  },
  {
    id: "witness_1",
    category: "wolf",
    name: "目击狼人杀1.0",
    summary: "狼人对视击杀，小羊靠任务与报警推进。",
    rounds: 3
  },
  {
    id: "witness_2",
    category: "wolf",
    name: "目击狼人杀2.0",
    summary: "可对视或身体接触击杀，小羊尽量活到最后。",
    rounds: 3
  },
  {
    id: "dance_wolf",
    category: "wolf",
    name: "舞蹈狼人杀",
    summary: "跟着音乐跳舞，狼王隐藏狼崽。",
    rounds: 1
  },
  {
    id: "trickster",
    category: "wolf",
    name: "捣蛋杀手狼人杀",
    summary: "完成任务后开启捣蛋时刻，互动并出局。",
    rounds: 1
  },
  {
    id: "draw_master",
    category: "guess",
    name: "神笔小马良",
    summary: "双队作画猜题，限时比拼得分。",
    rounds: 1
  },
  {
    id: "table_survival",
    category: "wolf",
    name: "餐桌生存战狼人杀",
    summary: "用动作攻击与复盘投票并行。",
    rounds: 1
  },
  {
    id: "coming_soon",
    category: "guess",
    name: "游戏8",
    summary: "Coming Soon",
    rounds: 0,
    comingSoon: true
  }
];

const SONG_SCENES = [
  {
    goodScene: "偶遇年少时的白月光，你此刻想唱的歌",
    badScene: "偶遇老友，你此刻想唱的歌"
  },
  {
    goodScene: "宠妃遭小人算计被皇上打入冷宫后想唱的歌",
    badScene: "受某种重大挫折时你最想唱的歌"
  },
  {
    goodScene: "刚拿到年终奖准备去庆祝时想唱的歌",
    badScene: "工作做完终于下班时想唱的歌"
  },
  {
    goodScene: "和暗恋对象第一次牵手时想唱的歌",
    badScene: "和好兄弟久别重逢时想唱的歌"
  },
  {
    goodScene: "深夜独自开车回家时想唱的歌",
    badScene: "朋友聚会气氛正热时想唱的歌"
  }
];

const SONG_POOL = [
  "想你的夜",
  "后来",
  "告白气球",
  "红豆",
  "演员",
  "七里香",
  "突然好想你",
  "小幸运",
  "晴天",
  "因为爱情",
  "再见",
  "孤勇者",
  "海阔天空",
  "夜曲",
  "平凡之路",
  "年少有为",
  "光年之外",
  "起风了",
  "我们的爱",
  "大鱼"
];

const WITNESS_ACTIONS = ["双手戳酒窝", "双手比莲花", "眨眼三次", "轻轻碰肩", "假装喝水"];

const DANCE_SONG_STYLES = [
  "热烈舞曲",
  "复古迪斯科",
  "轻快流行",
  "魔性神曲",
  "节奏感很强的 BGM"
];

const TRICKSTER_KEYWORDS = [
  "你说得对",
  "好吃",
  "我是真这么想的"
];

const TRICKSTER_ACTIONS = [
  "做一个夸张表情",
  "用手势给别人比心",
  "模仿主持人说一句话",
  "偷偷换一个座位",
  "装作在找手机"
];

const DRAW_PROMPTS = [
  "冰雨",
  "想你的夜",
  "丢了西瓜捡芝麻",
  "东倒西歪",
  "老公",
  "金三脚",
  "吃葡萄不吐葡萄皮",
  "水煮肉片",
  "家徒四壁"
];

const TABLE_ACTIONS = [
  "用下巴指对方来杀羊",
  "对人说叠叠字",
  "对人说我觉得好好吃",
  "对人飞吻"
];

module.exports = {
  GAME_CATEGORIES,
  GAME_DEFINITIONS,
  SONG_SCENES,
  SONG_POOL,
  WITNESS_ACTIONS,
  DANCE_SONG_STYLES,
  TRICKSTER_KEYWORDS,
  TRICKSTER_ACTIONS,
  DRAW_PROMPTS,
  TABLE_ACTIONS
};
