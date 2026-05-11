
const app=getApp()
Page({
  data:{players:[],roles:{}, stats:{rounds:4,wolves:2,correct:5,survivors:6,duration:'18分钟'}},
  onLoad(){this.setData({players:app.globalData.room.players,roles:app.globalData.assignedRoles})},
  again(){app.globalData.ended=false;app.globalData.gameStatus='lobby';wx.reLaunch({url:'/pages/library/index'})},
  home(){wx.reLaunch({url:'/pages/home/index'})},
  onShareAppMessage(){return{title:'圆桌玩家战绩分享',path:'/pages/home/index'}}
})
