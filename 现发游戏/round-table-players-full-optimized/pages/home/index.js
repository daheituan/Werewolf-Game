const app = getApp()
Page({
  data: { room: {}, seats: [], currentPlayerId: '' },
  onShow() {
    this.setData({
      room: app.globalData.room,
      seats: app.globalData.room.players,
      currentPlayerId: app.globalData.currentPlayerId
    })
  },
  onShareAppMessage() {
    return {
      title: '来圆桌玩家一起开局',
      path: `/pages/home/index?roomNo=${this.data.room.roomNo}`
    }
  },
  goCategory() { wx.navigateTo({ url: '/pages/category/category' }) },
  goRoom() { wx.reLaunch({ url: '/pages/room/index' }) },
  invite() { wx.showShareMenu({ withShareTicket: true }); }
})
