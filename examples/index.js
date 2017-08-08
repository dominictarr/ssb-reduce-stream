var pull = require('pull-stream')

require('ssb-client')(function (err, sbot) {
  pull(
    sbot.createLogStream({reverse: true, limit: 100}),
    pull.through(console.log),
    require('../')(sbot.get, null, function (err, state) {
      console.log(state)
      sbot.close()
    })
  )

})

