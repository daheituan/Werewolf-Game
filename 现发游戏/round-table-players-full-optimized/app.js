
const { createMockRoom } = require('./utils/gameData')
const roomService = require('./utils/roomService')
const config = require('./utils/config')

App({
  globalData: {
    useCloud: config.USE_CLOUD,
    room: createMockRoom(),
    currentPlayerId: 'p3',
    selectedCategory: 'werewolf',
    selectedGameId: 'song-wolf',
    gameStatus: 'lobby',
    settings: {
      totalPlayers: 8,
      undercoverCount: 2,
      rounds: 3,
      taskRounds: 4,
      teams: 2,
      questionType: '成语',
      answerSeconds: 60,
      repeatSong: false,
      secretVisibleMode: 'selfDeviceOnly'
    },
    assignedRoles: {},
    currentRound: 1,
    ended: false
  },

  onLaunch() {
    if (config.USE_CLOUD && wx.cloud) {
      wx.cloud.init({ env: config.CLOUD_ENV || undefined, traceUser: true })
    }
    this.globalData.room = roomService.getRoom(createMockRoom())
    this.bootstrapDemoRoles()
  },

  bootstrapDemoRoles() {
    const roles = roomService.assignRoles({
      room: this.globalData.room,
      gameId: this.globalData.selectedGameId,
      settings: this.globalData.settings
    })
    this.globalData.assignedRoles = roles
  }
})
