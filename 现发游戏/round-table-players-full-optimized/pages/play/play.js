
const app = getApp()
const roomService = require('../../utils/roomService')
const { getGame, songHints } = require('../../utils/gameData')

Page({
  data:{ room:{}, players:[], game:{}, settings:{}, myRole:{}, currentPlayerId:'', round:1, songs:[], lyricHint:'' },
  onLoad(){ this.bootstrap() },
  bootstrap(){
    const currentPlayerId=app.globalData.currentPlayerId
    const songs=songHints.slice(0,3)
    this.setData({
      room:app.globalData.room,
      players:app.globalData.room.players,
      game:getGame(app.globalData.selectedGameId),
      settings:app.globalData.settings,
      myRole:roomService.getMyRole(currentPlayerId) || app.globalData.assignedRoles[currentPlayerId],
      currentPlayerId,
      round:app.globalData.currentRound,
      songs,
      lyricHint:songs[0] ? songs[0].hint : ''
    })
  },
  back(){ wx.navigateBack() },
  shuffle(){
    const shuffled = songHints.slice().sort(()=>Math.random()-.5).slice(0,3)
    this.setData({ songs:shuffled, lyricHint: shuffled[0] ? shuffled[0].hint : '' })
  },
  goVote(){ wx.navigateTo({ url:'/pages/vote/vote' }) },
  endGame(){
    wx.showModal({
      title:'结束本局？',
      content:'点击确认后将公开所有玩家身份。',
      success: res => {
        if(res.confirm){
          roomService.endGameAndReveal().then(()=>wx.navigateTo({ url:'/pages/result/result' }))
        }
      }
    })
  }
})
