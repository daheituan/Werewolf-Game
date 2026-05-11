
const app=getApp()
const roomService = require('../../utils/roomService')
Page({
  data:{players:[],selected:'',votes:[2,0,1,0,3,0,1,0],round:1},
  onLoad(){this.setData({players:app.globalData.room.players,round:app.globalData.currentRound})},
  back(){wx.navigateBack()},
  select(e){this.setData({selected:e.currentTarget.dataset.id})},
  abstain(){roomService.submitVote('abstain').then(()=>wx.showToast({title:'已弃票',icon:'none'}))},
  confirm(){roomService.submitVote(this.data.selected).then(()=>{wx.showToast({title:'投票已确认'});setTimeout(()=>wx.navigateBack(),600)})}
})
