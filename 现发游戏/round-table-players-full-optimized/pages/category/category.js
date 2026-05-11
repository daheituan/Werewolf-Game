const app = getApp()
const { categories } = require('../../utils/gameData')
Page({
  data:{ room:{}, categories, selected:'werewolf' },
  onLoad(){ this.setData({ room: app.globalData.room }) },
  back(){ wx.navigateBack() },
  selectCategory(e){
    const id = e.currentTarget.dataset.id
    if(id === 'more') { wx.showToast({ title:'更多游戏 Coming Soon', icon:'none' }); return }
    app.globalData.selectedCategory = id
    this.setData({ selected:id })
    wx.navigateTo({ url:`/pages/gameList/gameList?category=${id}` })
  },
  next(){ wx.navigateTo({ url:`/pages/gameList/gameList?category=${this.data.selected}` }) }
})
