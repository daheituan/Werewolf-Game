const app = getApp()
Page({
  data: { room: {}, seats: [], currentPlayerId: '' },
  onLoad() {
    this.setData({ room: app.globalData.room, seats: app.globalData.room.players, currentPlayerId: app.globalData.currentPlayerId })
  },
  onShareAppMessage() {
    return { title: '来圆桌玩家一起开局', path: `/pages/index/index?roomNo=${this.data.room.roomNo}` }
  },
  startSelect() { wx.navigateTo({ url: '/pages/category/category' }) }
})
