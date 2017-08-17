
function isString (s) {
  return 'string' === typeof s
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
      return Math.max(max, msg.value.timestamp || null)
    }, 0)
}

function toRecpGroup(msg) {
  //cannocialize
  return msg.value.content.recps.map(function (e) {
    return (isString(e) ? e : e.link)
  }).sort().map(function (id) {
    return id.substring(0, 10)
  }).join(',')
}

function threadReduce (state, msg) {
  if(!state) state = {}

  state.roots = state.roots || {}
  state.stats = state.stats || {messages: 0, threads: 0}
  if(!msg) return state
  //ignore private messages (for now)
  if(!msg.key) throw new Error('invalid message:'+JSON.stringify(msg))
  if(!isObject(msg.value.content)) return state

  if(state.roots[msg.key] && !state.roots[msg.key].value) {
    //we must have retrived this message out of order
    var replies = state.roots[msg.key].replies
    state.roots[msg.key] = msg
    msg.replies = replies
  }

  //aha, missing a thing for when a message is first in the thread.

  //not "else if" because a message can be both a reply and
  //a root, SADFACE
  var id = msg.value.content.root
  if(id) {
    if(state.roots[id]) {
      //check we havn't already added this msg
      var root = state.roots[id]
      if(root.replies && ~find(root.replies, function (e) { return e.key == msg.key })) {
        var r = root.replies.map(function (e) { return e.key })
        return state
      }
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
  else if(!msg.value.content.root && msg.value.content.type == 'post') {
    if(!state.roots[msg.key])
      state.roots[msg.key] = msg
  }

  function update (state, thread1, thread2) {

    if(!thread1 || !state.roots[thread1]) return thread2
    else if(!thread2 || !state.roots[thread2]) return thread1
    else
      return (
      threadTimestamp(state.roots[thread1])
      < threadTimestamp(state.roots[thread2])
    ) ? thread2 : thread1

  }

  state.channels = state.channels || {}
  var channel = msg.value.content.channel
  //check type so likes etc don't bump channels
  if(channel && msg.value.content.type === 'post') {
    state.channels[channel] = update(
      state,
      state.channels[channel],
      msg.value.content.root || msg.key
    )
  }

  state.private = state.private || {}
  if(msg.value.content.recps && msg.value.private) {

    var group = toRecpGroup(msg)

    state.private[group] = update(
      state,
      state.private[group],
      msg.value.content.root || msg.key
    )
  }


  state.groups = state.groups || {}
  var group = msg.value.content.group
  //check type so likes etc don't bump channels
  if(group && msg.value.content.type === 'post') {
    state.groups[group] = update(
      state,
      state.groups[group],
      msg.value.content.root || msg.key
    )
  }

  state.stats.messages ++

  return state
}

module.exports = threadReduce

