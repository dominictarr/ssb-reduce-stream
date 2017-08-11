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

function initial () {
  return {
    messages:{},
    request: {older: true, newer: true},
    newer: [],
    older: [],
    log: []
  }
}

function More (reduce, get) {

  var state = reduce(null)

  var fn
  function obv (_fn, immediate) {
    fn = _fn
    if(immediate !== false && _fn(state) === true) obv.more()
    return function () {
      fn = null
    }
  }

  obv.more = function () {
    if(state.reading) return //only allow one request at a time
    state.reading = true
    get(null, function (err, data) {
      state.reading = false
      if(err) state.ended = err
      else obv.value = state = reduce(state, data)

      if(fn && (state.more || fn(state) === true) && !state.ended)
        obv.more()
    })
  }

  obv.more()

  return obv
}

module.exports.more = More
module.exports.threadReduce = require('./reduce')



