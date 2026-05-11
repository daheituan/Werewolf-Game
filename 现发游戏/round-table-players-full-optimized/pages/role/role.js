
const app = getApp()
const roomService = require('../../utils/roomService')
const { getGame } = require('../../utils/gameData')

Page({
  data:{game:{}, players:[], currentPlayerId:'', me:{}, myRole:{}, revealed:false},
  onLoad(){
    const players=app.globalData.room.players
    const me=players.find(p=>p.id===app.globalData.currentPlayerId)||players[0]
    const myRole=roomService.getMyRole(me.id) || app.globalData.assignedRoles[me.id]
    this.setData({game:getGame(app.globalData.selectedGameId), players, currentPlayerId:me.id, me, myRole})
  },
  back(){ wx.navigateBack() },
  toggleReveal(){ this.setData({ revealed: !this.data.revealed }) },
  enterPlay(){
    roomService.setPlaying().then(()=>wx.navigateTo({ url:'/pages/play/play' }))
  }
})
