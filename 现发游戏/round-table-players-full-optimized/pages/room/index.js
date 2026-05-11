const app = getApp()
Page({
  data:{ room:{}, players:[] },
  onShow(){ this.setData({ room: app.globalData.room, players: app.globalData.room.players }) },
  goStart(){ wx.navigateTo({ url:'/pages/category/category' }) },
  copyRoomNo(){ wx.setClipboardData({ data: this.data.room.roomNo }) }
})
