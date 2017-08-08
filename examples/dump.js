var pull = require('pull-stream')

require('ssb-client')(function (err, sbot) {
  pull(
    sbot.createLogStream({reverse: true, limit: 100}),
    pull.collect(function (err, ary) {
      if(err) throw err
      console.log(JSON.stringify(ary, null, 2))
      sbot.close()
    })
  )
})




