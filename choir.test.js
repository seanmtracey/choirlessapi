const COUCH_URL = 'http://admin:admin@localhost:5984'
const ts = new Date().getTime()
const DB1 = 'choirtest_users_' + ts
const DB2 = 'choirtest_main_' + ts
const Nano = require('nano')
const nano = Nano(COUCH_URL)

// the code we're testing
process.env.COUCH_URL = COUCH_URL
process.env.COUCH_USERS_DATABASE = DB1
process.env.COUCH_CHOIRLESS_DATABASE = DB2
const postUser = require('./postUser.js')
const postChoir = require('./postChoir.js')
const getChoir = require('./getChoir.js')
const getChoirMembers = require('./getChoirMembers.js')
const postChoirJoin = require('./postChoirJoin.js')
const postChoirSong = require('./postChoirSong.js')
const getChoirSong = require('./getChoirSong.js')
const getChoirSongs = require('./getChoirSongs.js')
const postChoirSongPart = require('./postChoirSongPart.js')
const getChoirSongPart = require('./getChoirSongPart.js')
const getChoirSongParts = require('./getChoirSongParts.js')
const getUserChoirs = require('./getUserChoirs.js')

// test users
let rita, sue, bob
let london, bristol, manchester
let song1, song2
let part1, part2, part3

beforeAll(async () => {
  await nano.db.create(DB1)
  await nano.db.create(DB2, { partitioned: true })
  let obj = {
    name: 'Bob',
    email: 'bob@aol.com',
    password: 'sausages'
  }
  let response = await postUser(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  bob = response.body.userId

  obj = {
    name: 'Sue',
    email: 'sue@aol.com',
    password: 'cakes'
  }
  response = await postUser(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  sue = response.body.userId

  obj = {
    name: 'Rita',
    email: 'rita@aol.com',
    password: 'rabbits'
  }
  response = await postUser(obj)
  expect(response.statusCode).toBe(200)
  rita = response.body.userId
})

test('postChoir - invalid parameters', async () => {
  let obj = {
    description: 'The singers of London',
    createdByUserId: rita,
    createdByName: 'Rita',
    choirType: 'public'
  }
  let response = await postChoir(obj)
  expect(response.statusCode).toBe(400)
  expect(response.body.ok).toBe(false)

  obj = {
    namee: 'London singers',
    createdByName: 'Rita',
    choirType: 'public'
  }
  response = await postChoir(obj)
  expect(response.statusCode).toBe(400)
  expect(response.body.ok).toBe(false)

  obj = {
    name: 'London singers',
    createdByUserId: rita,
    choirType: 'public'
  }
  response = await postChoir(obj)
  expect(response.statusCode).toBe(400)
  expect(response.body.ok).toBe(false)

  obj = {
    namee: 'London singers',
    createdByName: 'Rita',
    createdByUserId: rita
  }
  response = await postChoir(obj)
  expect(response.statusCode).toBe(400)
  expect(response.body.ok).toBe(false)
})

test('postChoir - create choir', async () => {
  let obj = {
    name: 'London singers',
    description: 'The singers of London',
    createdByUserId: rita,
    createdByName: 'Rita',
    choirType: 'public'
  }
  let response = await postChoir(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  london = response.body.choirId

  obj = {
    name: 'Bristol singers',
    description: 'The singers of Bristol',
    createdByUserId: rita,
    createdByName: 'Rita',
    choirType: 'private'
  }
  response = await postChoir(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  bristol = response.body.choirId

  obj = {
    name: 'Manchester singers',
    description: 'The singers of Manchester',
    createdByUserId: sue,
    createdByName: 'Sue',
    choirType: 'public'
  }
  response = await postChoir(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  manchester = response.body.choirId
})

test('getChoir - fetch choir - london', async () => {
  const response = await getChoir({ choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choir.choirId).toBe(london)
  expect(response.body.choir.name).toBe('London singers')
  expect(response.body.choir.description).toBe('The singers of London')
  expect(response.body.choir.createdByUserId).toBe(rita)
  expect(response.body.choir.createdByName).toBe('Rita')
  expect(response.body.choir.choirType).toBe('public')
  expect(response.body.choir._id).toBe(undefined)
  expect(response.body.choir._rev).toBe(undefined)
})

test('getChoir - fetch choir - bristol', async () => {
  const response = await getChoir({ choirId: bristol })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choir.choirId).toBe(bristol)
  expect(response.body.choir.name).toBe('Bristol singers')
  expect(response.body.choir.description).toBe('The singers of Bristol')
  expect(response.body.choir.createdByUserId).toBe(rita)
  expect(response.body.choir.createdByName).toBe('Rita')
  expect(response.body.choir.choirType).toBe('private')
  expect(response.body.choir._id).toBe(undefined)
  expect(response.body.choir._rev).toBe(undefined)
})

test('getChoir - fetch choir - manchester', async () => {
  const response = await getChoir({ choirId: manchester })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choir.choirId).toBe(manchester)
  expect(response.body.choir.name).toBe('Manchester singers')
  expect(response.body.choir.description).toBe('The singers of Manchester')
  expect(response.body.choir.createdByUserId).toBe(sue)
  expect(response.body.choir.createdByName).toBe('Sue')
  expect(response.body.choir.choirType).toBe('public')
  expect(response.body.choir._id).toBe(undefined)
  expect(response.body.choir._rev).toBe(undefined)
})

test('postChoir - edit name', async () => {
  const obj = {
    name: 'London singers!',
    choirId: london
  }
  let response = await postChoir(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  response = await getChoir({ choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choir.name).toBe(obj.name)
})

test('postChoir - edit description', async () => {
  const obj = {
    description: 'The amazing singers of London!',
    choirId: london
  }
  let response = await postChoir(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  response = await getChoir({ choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choir.description).toBe(obj.description)
})

test('postChoir - edit choirType', async () => {
  const obj = {
    choirType: 'private',
    choirId: london
  }
  let response = await postChoir(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  response = await getChoir({ choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choir.choirType).toBe(obj.choirType)
})

test('getChoirMembers - check membership', async () => {
  let response = await getChoirMembers({ choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.members.length).toBe(1)

  response = await getChoirMembers({ choirId: bristol })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.members.length).toBe(1)

  response = await getChoirMembers({ choirId: manchester })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.members.length).toBe(1)
})

test('join choir - new members', async () => {
  let obj = {
    userId: sue,
    name: 'Sue',
    choirId: london,
    memberType: 'leader'
  }
  let response = await postChoirJoin(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)

  obj = {
    userId: bob,
    name: 'Bob',
    choirId: london,
    memberType: 'member'
  }
  response = await postChoirJoin(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)

  obj = {
    userId: bob,
    name: 'Bob',
    choirId: manchester,
    memberType: 'member'
  }
  response = await postChoirJoin(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
})

test('getChoirMembers - check membership again', async () => {
  let response = await getChoirMembers({ choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.members.length).toBe(3)

  response = await getChoirMembers({ choirId: bristol })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.members.length).toBe(1)

  response = await getChoirMembers({ choirId: manchester })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.members.length).toBe(2)
})

test('postChoir - invalid paramters', async () => {
  let obj = {
    userId: rita,
    name: 'Waterloo Sunset',
    description: 'by The Kinks',
    partNames: ['tenor', 'alto', 'soprano']
  }
  let response = await postChoirSong(obj)
  expect(response.statusCode).toBe(400)
  expect(response.body.ok).toBe(false)

  obj = {
    choirId: london,
    name: 'Waterloo Sunset',
    description: 'by The Kinks',
    partNames: ['tenor', 'alto', 'soprano']
  }
  response = await postChoirSong(obj)
  expect(response.statusCode).toBe(400)
  expect(response.body.ok).toBe(false)

  obj = {
    userId: rita,
    choirId: london,
    description: 'by The Kinks',
    partNames: ['tenor', 'alto', 'soprano']
  }
  response = await postChoirSong(obj)
  expect(response.statusCode).toBe(400)
  expect(response.body.ok).toBe(false)
})

test('postChoirSong - create songs', async () => {
  let obj = {
    choirId: london,
    userId: rita,
    name: 'Waterloo Sunset',
    description: 'by The Kinks',
    partNames: ['tenor', 'alto', 'soprano']
  }
  let response = await postChoirSong(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  song1 = response.body.songId

  obj = {
    choirId: london,
    userId: rita,
    name: 'Love Me Do',
    description: 'by The Beatles',
    partNames: ['baritone', 'alto', 'soprano']
  }
  response = await postChoirSong(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  song2 = response.body.songId
})

test('getChoirSong - fetch song', async () => {
  let response = await getChoirSong({ choirId: london, songId: song1 })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.song.name).toBe('Waterloo Sunset')

  response = await getChoirSong({ choirId: london, songId: song2 })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.song.name).toBe('Love Me Do')
})

test('postChoirSong - edit song', async () => {
  const obj = {
    choirId: london,
    songId: song1,
    name: 'Waterloo Sunset!',
    description: 'by The Kinks!',
    partNames: ['bass', 'tenor', 'alto', 'soprano']
  }
  let response = await postChoirSong(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  song1 = response.body.songId

  response = await getChoirSong({ choirId: london, songId: song1 })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.song.name).toBe(obj.name)
  expect(response.body.song.description).toBe(obj.description)
  expect(response.body.song.partNames).toStrictEqual(obj.partNames)
})

test('getChoirSongs - edit song', async () => {
  let response = await getChoirSongs({ choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.songs.length).toBe(2)

  response = await getChoirSongs({ choirId: manchester })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.songs.length).toBe(0)
})

test('postChoirSongPart - create part', async () => {
  let obj = {
    choirId: london,
    songId: song1,
    userId: rita,
    partName: 'tenor',
    partType: 'reference',
    userName: 'Rita'
  }
  let response = await postChoirSongPart(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  part1 = response.body.partId

  obj = {
    choirId: london,
    songId: song1,
    userId: sue,
    partName: 'alto',
    partType: 'reference',
    userName: 'Sue'
  }
  response = await postChoirSongPart(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  part2 = response.body.partId

  obj = {
    choirId: london,
    songId: song1,
    userId: bob,
    partName: 'Piano',
    partType: 'backing',
    userName: 'Bob'
  }
  response = await postChoirSongPart(obj)
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  part3 = response.body.partId
})

test('getChoirSongPart - get part', async () => {
  let response = await getChoirSongPart({ choirId: london, songId: song1, partId: part1 })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.part.userName).toBe('Rita')
  expect(response.body.part.partName).toBe('tenor')
  expect(response.body.part.partType).toBe('reference')

  response = await getChoirSongPart({ choirId: london, songId: song1, partId: part2 })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.part.userName).toBe('Sue')
  expect(response.body.part.partName).toBe('alto')
  expect(response.body.part.partType).toBe('reference')

  response = await getChoirSongPart({ choirId: london, songId: song1, partId: part3 })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.part.userName).toBe('Bob')
  expect(response.body.part.partName).toBe('Piano')
  expect(response.body.part.partType).toBe('backing')
})

test('getChoirSongParts - get all parts', async () => {
  let response = await getChoirSongParts({ songId: song1, choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.parts.length).toBe(3)

  response = await getChoirSongParts({ songId: song2, choirId: london })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.parts.length).toBe(0)
})

test('getUserChoirs - get choir memberships', async () => {
  const response = await getUserChoirs({ userId: rita })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choirs.length).toBe(2)
})

test('getUserChoirs - get choir memberships', async () => {
  const response = await getUserChoirs({ userId: 'frank' })
  expect(response.statusCode).toBe(200)
  expect(response.body.ok).toBe(true)
  expect(response.body.choirs.length).toBe(0)
})

afterAll(async () => {
  await nano.db.destroy(DB1)
  await nano.db.destroy(DB2)
})
