
module.exports = function (get, reduce, done) {
  reduce = reduce || threadReduce
  var state
  return function (read) {
    read(null, function next (err, msg) {
      if(err) return done(err === true ? null : err, state)

      ;(function handle () {
        state = reduce(state, msg)
        if(state.effect && state.effect.type == 'get') {
          var key = state.effect.key
          state.effect = null
          get(key, function (err, msg) {
            if(msg) handle({key: key, value: msg})
          })
        }
      })(msg)

      read(null, next)
    })
  }
}

function isObject (o) {
  return 'object' === typeof o
}

function find (list, test) {
  for(var i = 0; i < list.length; i++)
    if(test(list[i], i, list)) return i
  return -1
}

function threadTimestamp (thread) {
  if(!thread) throw new Error('thread must be provided')
  if(!thread.replies || !thread.replies.length) return thread.value.timestamp
  else
    return thread.replies.reduce(function (max, msg) {
      return Math.max(max, msg.value.timestamp)
    }, 0)
}

function threadReduce (state, msg) {
  if(!state) state = {}

  state.roots = state.roots || {}
  state.stats = state.stats || {messages: 0, threads: 0}

  //ignore private messages (for now)
  if(!msg.key) throw new Error('invalid message:'+JSON.stringify(msg))
  if(!isObject(msg.value.content)) return state

  if(state.roots[msg.key] && !state.roots[msg.key].value) {
    //we must have retrived this message out of order
    var replies = state.roots[msg.key].replies
    state.roots[msg.key] = msg
    msg.replies = replies
  }

  //not "else if" because a message can be both a reply and
  //a root, SADFACE
  var id = msg.value.content.root
  if(id) {
    if(state.roots[id]) {
      //check we havn't already added this msg
      var root = state.roots[id]
      if(~find(root.replies, function (e) { return e.key == msg.key }))
        return state
      root.replies = root.replies || []
      root.replies.push(msg)
    }
    else {
      //need to retrive the root for this one
      state.roots[id] = {
        replies: [msg]
      }
      state.effect = {type:'get', key: id}
      state.stats.threads ++
    }
  }

  var channel = msg.value.content.channel
  //check type so likes etc don't bump channels
  if(channel && msg.value.content.type === 'post') {
    state.channels = state.channels || {}
    var key = msg.value.content.root || msg.key
    if(
      //we don't havn't noticed this channel yet
      !state.channels[channel] ||
      //this is a newer message in this channel
      threadTimestamp(state.roots[state.channels[channel]])
      < threadTimestamp(state.roots[key])
    )
      state.channels[channel] = key
  }

  state.stats.messages ++

  return state
}

module.exports.threadReduce = threadReduce



