var pull = require('pull-stream')
var reduce = require('../')
require('ssb-client')(function (err, sbot) {
  var state, c = 0
  pull(
    sbot.createLogStream({reverse: true}),
    pull.drain(function (data) {
      state = reduce(state, data)
      if(!((c++)%10000))
      console.log(JSON.stringify(state).length, data.timestamp)
    }, sbot.close)
  )
})






