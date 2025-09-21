import Plebbit from '@plebbit/plebbit-js'
import startIpfs from './start-ipfs.js'
import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'
const rootPath = path.dirname(fileURLToPath(import.meta.url))

const title = 'mintpass test'
const description = 'subplebbit to test mintpass'

// whitelist your own posters addresses here (your normal users)
const whitelist = [
  '12D3KooWLZ17hgteXM78HzMftG7JFypGXqkwVTwdab8EqxgKJp1t'
]

// add your own admins here
const admins = [

]

// add your own moderators here
const moderators = [
  'estebanabaroa.eth',
  'plebeius.eth'
]

// save state to disk every 1s
let state = {}
const statePath = path.join(rootPath, 'state.json')
try {
  state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
}
catch (e) {}
setInterval(() => fs.writeFileSync(statePath, JSON.stringify(state, null, 2)), 1000)

await startIpfs()

const plebbit = await Plebbit({
  kuboRpcClientsOptions: ['http://127.0.0.1:6001/api/v0'],
  pubsubKuboRpcClientsOptions: ['http://127.0.0.1:6001/api/v0'],
  httpRoutersOptions: [],
  dataPath: path.join(rootPath, '.plebbit'),
  publishUpdate: 1000
})
plebbit.on('error', error => {
  console.log(error) // logging plebbit errors are only useful for debugging, not production
})

// create subplebbit
const createSubplebbitOptions = state.subplebbitAddress ? {address: state.subplebbitAddress} : undefined
const subplebbit = await plebbit.createSubplebbit(createSubplebbitOptions)
state.subplebbitAddress = subplebbit.address
console.log('subplebbit', subplebbit.address)
subplebbit.on('error', (...args) => console.log('subplebbit error', ...args))
subplebbit.on('challengerequest', (...args) => console.log('challengerequest', ...args))
subplebbit.on('challenge', (...args) => console.log('challenge', ...args))
subplebbit.on('challengeanswer', (...args) => console.log('challengeanswer', ...args))
subplebbit.on('challengeverification', (...args) => console.log('challengeverification', ...args))

const roles = {}
moderators.forEach(moderatorAddress => {
  roles[moderatorAddress] = {role: 'moderator'}
})
admins.forEach(adminAddress => {
  roles[adminAddress] = {role: 'admin'}
})

// set roles, antispam challenges and whitelist the bot
await subplebbit.edit({
  title,
  description,
  roles,
  settings: {challenges: [
    {
      name: 'mintpass',
      options: {
        contractAddress: '0xcb60e1dd6944dfc94920e28a277a51a06e9f20d2',
        chainTicker: 'eth',
        // requiredTokenType: '0', // 0 = SMS verification
        // transferCooldownSeconds: '604800', // 1 week
      }
    },
    // {
    //   name: 'publication-match',
    //   options: {
    //     matches: JSON.stringify([{'propertyName':'author.address','regexp':'\\.(sol|eth)$'}]),
    //     error: 'Posting in this community requires a username (author address) that ends with .eth or .sol. Go to the settings to set your username.'
    //   },
    //   exclude: [
    //     // exclude mods
    //     {role: ['moderator', 'admin', 'owner']},
    //     // exclude old users
    //     {
    //       firstCommentTimestamp: 60 * 60 * 24 * 30, // 1 month
    //       postScore: 3,
    //       rateLimit: 2,
    //       replyScore: 0
    //     },
    //     {challenges: [1]}
    //   ]
    // },
    // {
    //   name: 'whitelist',
    //   options: {
    //     addresses: whitelist.join(','),
    //     urls: 'https://raw.githubusercontent.com/plebbit/lists/refs/heads/master/whitelist-challenge.json',
    //     error: 'Or posting in this community requires being whitelisted. Go to https://t.me/plebbit and ask to be whitelisted.'
    //   },
    //   exclude: [
    //     // exclude mods
    //     {role: ['moderator', 'admin', 'owner']},
    //     // exclude old users
    //     {
    //       firstCommentTimestamp: 60 * 60 * 24 * 30, // 1 month
    //       postScore: 3,
    //       rateLimit: 2,
    //       replyScore: 0
    //     },
    //     {challenges: [0]}
    //   ]
    // }
  ]}
})

// start subplebbit
console.log('starting...')
await subplebbit.start()
console.log('started')
// console.log('ipnsPubsubTopicRoutingCid:', subplebbit.ipnsPubsubTopicRoutingCid)
// console.log(subplebbit.roles, subplebbit.settings.challenges)
