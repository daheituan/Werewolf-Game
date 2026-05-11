
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const COLLECTION = 'round_table_rooms'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, roomNo, data } = event

  if (action === 'get') {
    const res = await db.collection(COLLECTION).where({ roomNo }).limit(1).get()
    return { ok: true, room: res.data[0] || null, openid: wxContext.OPENID }
  }

  if (action === 'upsert') {
    const res = await db.collection(COLLECTION).where({ roomNo }).limit(1).get()
    const payload = Object.assign({}, data, { roomNo, updatedAt: Date.now() })
    if (res.data.length) {
      await db.collection(COLLECTION).doc(res.data[0]._id).update({ data: payload })
      return { ok: true, id: res.data[0]._id, openid: wxContext.OPENID }
    }
    const add = await db.collection(COLLECTION).add({ data: Object.assign(payload, { createdAt: Date.now() }) })
    return { ok: true, id: add._id, openid: wxContext.OPENID }
  }

  if (action === 'vote') {
    const res = await db.collection(COLLECTION).where({ roomNo }).limit(1).get()
    if (!res.data.length) return { ok: false, message: 'room not found' }
    const room = res.data[0]
    const votes = Object.assign({}, room.votes || {})
    votes[wxContext.OPENID] = data.targetId || 'abstain'
    await db.collection(COLLECTION).doc(room._id).update({ data: { votes, updatedAt: Date.now() } })
    return { ok: true, votes }
  }

  return { ok: false, message: 'unknown action' }
}
