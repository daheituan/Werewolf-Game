
const config = require('./config')
const { scenarioPairs } = require('./gameData')

function clone(v) { return JSON.parse(JSON.stringify(v)) }
function now() { return Date.now() }

function getLocalRoom() {
  try { return wx.getStorageSync('rt_room') || null } catch(e) { return null }
}
function saveLocalRoom(room) {
  try { wx.setStorageSync('rt_room', room) } catch(e) {}
  return room
}

function createRoom(baseRoom) {
  const room = clone(baseRoom)
  room.status = room.status || 'lobby'
  room.selectedGameId = room.selectedGameId || 'song-wolf'
  room.currentRound = room.currentRound || 1
  room.rolesPublic = false
  room.createdAt = room.createdAt || now()
  room.updatedAt = now()
  room.votes = room.votes || {}
  return saveLocalRoom(room)
}

function getRoom(baseRoom) {
  return getLocalRoom() || createRoom(baseRoom)
}

function updateRoom(patch) {
  const app = getApp()
  const room = Object.assign({}, app.globalData.room, patch, { updatedAt: now() })
  app.globalData.room = room
  saveLocalRoom(room)
  return Promise.resolve(room)
}

function assignRoles({ room, gameId, settings }) {
  const pair = scenarioPairs[0]
  const selected = gameId || 'song-wolf'
  const roles = {}
  const undercoverIds = room.players.filter((_, i) => i === 1 || i === 6).map(p => p.id)

  room.players.forEach((p, index) => {
    let role = '好人'
    let camp = 'good'
    let prompt = pair.good

    if (selected === 'song-wolf') {
      if (undercoverIds.includes(p.id)) {
        role = '卧底'
        camp = 'undercover'
        prompt = pair.bad
      }
    } else if (selected.indexOf('witness') >= 0 || selected.indexOf('table') >= 0) {
      const wolfCount = Math.max(1, Math.floor((settings.totalPlayers || room.players.length) / 3))
      const isWolf = index < wolfCount
      role = isWolf ? '狼人' : '小羊'
      camp = isWolf ? 'wolf' : 'sheep'
      prompt = isWolf ? '你是狼人，可按规则在游戏中行动。' : '你是小羊，请在指定回合内完成任务并找出狼人。'
    } else if (selected === 'dance-wolf') {
      role = index === 0 ? '狼王' : (index === 1 || index === 2 ? '狼崽' : '羊')
      camp = role === '羊' ? 'sheep' : 'wolf'
      prompt = role === '羊' ? '跟随音乐起舞，观察谁的行动异常。' : '隐藏自己，配合狼群完成目标。'
    } else if (selected === 'trick-killer') {
      const killer = index === 0 || index === 3
      role = killer ? '捣蛋杀手' : '好人'
      camp = killer ? 'killer' : 'good'
      prompt = killer ? '暗中完成 3 次指定任务，开启捣蛋时刻。' : '观察异常行为，找出捣蛋杀手。'
    } else {
      role = room.players.length > 0 ? '玩家' : '玩家'
      camp = 'team'
      prompt = '请等待系统分配题目。'
    }

    roles[p.id] = {
      playerId: p.id,
      role,
      camp,
      prompt,
      publicVisible: false,
      assignedAt: now()
    }
  })

  return roles
}

function startGame({ gameId, settings }) {
  const app = getApp()
  const room = app.globalData.room
  const roles = assignRoles({ room, gameId, settings })
  app.globalData.assignedRoles = roles
  app.globalData.selectedGameId = gameId
  app.globalData.settings = Object.assign({}, app.globalData.settings, settings || {})
  app.globalData.gameStatus = 'assigning'
  room.status = 'assigning'
  room.selectedGameId = gameId
  room.rolesPublic = false
  room.updatedAt = now()
  room.roles = roles
  saveLocalRoom(room)
  return Promise.resolve({ room, roles })
}

function setPlaying() {
  const app = getApp()
  app.globalData.gameStatus = 'playing'
  return updateRoom({ status: 'playing', rolesPublic: false })
}

function endGameAndReveal() {
  const app = getApp()
  const room = app.globalData.room
  const roles = app.globalData.assignedRoles || room.roles || {}
  Object.keys(roles).forEach(id => roles[id].publicVisible = true)
  app.globalData.assignedRoles = roles
  app.globalData.ended = true
  app.globalData.gameStatus = 'ended'
  return updateRoom({ status: 'ended', rolesPublic: true, roles })
}

function getMyRole(playerId) {
  const app = getApp()
  return (app.globalData.assignedRoles || {})[playerId]
}

function submitVote(targetId) {
  const app = getApp()
  const room = app.globalData.room
  const voterId = app.globalData.currentPlayerId
  const votes = Object.assign({}, room.votes || {})
  votes[voterId] = targetId || 'abstain'
  return updateRoom({ votes })
}

module.exports = {
  config,
  createRoom,
  getRoom,
  updateRoom,
  startGame,
  setPlaying,
  endGameAndReveal,
  getMyRole,
  submitVote
}
