
const app = getApp()
const roomService = require('../../utils/roomService')
const { getGame, scenarioPairs, tasks, questions, pickRandom } = require('../../utils/gameData')

Page({
  data:{
    game:{},
    settings:{},
    pageTitle:'',
    scenario:{},
    tasks:[],
    questions:[],
    isGuess:false
  },
  onLoad(q){
    const game = getGame(q.gameId || app.globalData.selectedGameId)
    app.globalData.selectedGameId = game.id
    const settings = app.globalData.settings
    this.setData({
      game,
      settings,
      isGuess: game.category === 'guess',
      pageTitle:`界面 ${game.category==='guess'?'6':'5'}/10 · 游戏设置（${game.name}）`,
      scenario: pickRandom(scenarioPairs),
      tasks: tasks.slice(0,4),
      questions: questions.slice(0,4)
    })
  },
  back(){ wx.navigateBack() },
  changeScenario(){ this.setData({ scenario: pickRandom(scenarioPairs) }) },
  refreshRandom(){ this.setData({ questions: questions.sort(()=>Math.random()-.5).slice(0,4), tasks: tasks.sort(()=>Math.random()-.5).slice(0,4) }) },
  inc(e){ const key=e.currentTarget.dataset.key; const settings=Object.assign({}, this.data.settings); settings[key]=(settings[key]||0)+1; this.setData({settings}); app.globalData.settings=settings },
  dec(e){ const key=e.currentTarget.dataset.key; const settings=Object.assign({}, this.data.settings); settings[key]=Math.max(1,(settings[key]||1)-1); this.setData({settings}); app.globalData.settings=settings },
  goRules(){
    roomService.startGame({ gameId:this.data.game.id, settings:this.data.settings }).then(() => {
      wx.navigateTo({ url:`/pages/rules/rules?gameId=${this.data.game.id}` })
    })
  }
})
