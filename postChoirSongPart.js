const Nano = require('nano')
const debug = require('debug')('choirless')
const kuuid = require('kuuid')
let nano = null
let db = null
const DB_NAME = process.env.COUCH_CHOIRLESS_DATABASE

// create/edit a choir's song part
// Parameters:
// - `choirId` - the id of the choir (required)
// - `songId` - the id of the song (required)
// - `partId` - the id of the part (required for updates, if omitted a new song part is created)
// - `partName` - name of the part e.g. drums, alto
// - `partType` - one of `backing`/`reference`/`rendition`
// - `userId` - the id of the user (required for new parts)
// - `userName` - the name of the user (required for new parts)
const postChoirSongPart = async (opts) => {
  // connect to db - reuse connection if present
  if (!db) {
    nano = Nano(process.env.COUCH_URL)
    db = nano.db.use(DB_NAME)
  }

  // extract parameters
  const now = new Date()
  let partId
  let doc = {}

  // is this a request to edit an existing song part
  if (opts.choirId && opts.songId && opts.partId) {
    try {
      const id = opts.choirId + ':song:' + opts.songId + ':part:' + opts.partId
      debug('postChoirSongPart fetch partId', id)
      doc = await db.get(partId)
      doc.partName = opts.partName ? opts.partName : doc.partName
      doc.partType = opts.partType ? opts.partType : doc.partType
      partId = opts.partId
    } catch (e) {
      return {
        body: { ok: false, message: 'song part not found' },
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    }
  } else {
    if (!opts.choirId || !opts.songId || !opts.userId || !opts.userName) {
      return {
        body: { ok: false, message: 'missing mandatory parameters' },
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    }
    partId = kuuid.id()
    doc = {
      _id: opts.choirId + ':song:' + opts.songId + ':part:' + partId,
      type: 'songpart',
      songId: opts.songId,
      choirId: opts.choirId,
      userId: opts.userId,
      userName: opts.userName,
      createdOn: now.toISOString(),
      partName: opts.partName || '',
      partType: opts.partType || 'backing'
    }
  }

  // write songpart to database
  let statusCode = 200
  let body = null
  try {
    debug('postChoirSongPart write data', doc)
    await db.insert(doc)
    body = { ok: true, partId: partId }
  } catch (e) {
    body = { ok: false }
    statusCode = 404
  }

  // return API response
  return {
    body: body,
    statusCode: statusCode,
    headers: { 'Content-Type': 'application/json' }
  }
}

module.exports = postChoirSongPart
