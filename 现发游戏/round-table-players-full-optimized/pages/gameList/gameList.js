const app = getApp()
const { getGamesByCategory } = require('../../utils/gameData')
Page({
  data:{ category:'werewolf', games:[], title:'界面 3/10 · 狼人杀类游戏', selectedGameId:'song-wolf' },
  onLoad(q){ this.load(q.category || app.globalData.selectedCategory || 'werewolf') },
  load(category){
    const defaultGame = category === 'guess' ? 'magic-draw' : 'song-wolf'
    this.setData({ category, games:getGamesByCategory(category), title: category==='guess'?'界面 4/10 · 猜词类游戏':'界面 3/10 · 狼人杀类游戏', selectedGameId: app.globalData.selectedGameId || defaultGame })
  },
  back(){ wx.navigateBack() },
  switchCat(e){ app.globalData.selectedCategory = e.currentTarget.dataset.id; app.globalData.selectedGameId = e.currentTarget.dataset.id === 'guess' ? 'magic-draw' : 'song-wolf'; this.load(e.currentTarget.dataset.id) },
  choose(e){ const id=e.currentTarget.dataset.id; if(id==='game-8'){wx.showToast({title:'游戏 8 即将上线', icon:'none'});return}; app.globalData.selectedGameId=id; this.setData({selectedGameId:id}) },
  goSetup(){ wx.navigateTo({ url:`/pages/setup/setup?gameId=${this.data.selectedGameId}` }) }
})
