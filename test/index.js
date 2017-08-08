
var tape = require('tape')
var log = require('./data/log.json')
var threaded = require('./data/threaded.json')
var threadReduce = require('../').threadReduce

tape('reduce', function (t) {
  if(!Array.isArray(log)) throw new Error('expected arry')

  log.reduce(threadReduce)
//  var state = [].reduce.call(log, threadReduce, null)
  var state
  var retrive = []
  log.forEach(function (e) {
    state = threadReduce(state, e)
    if(state.effect)
      retrive.push(state.effect.key)
    state.effect = null
  })
//  console.log(JSON.stringify(state, null, 2))
  retrive = retrive.filter(function (key) {
    return !state.roots[key]
  })

  t.deepEqual(retrive, [])
  t.equal(state.stats.messages, 93)
  t.equal(state.stats.threads, 13)
  t.deepEqual(state, threaded)

  t.end()
})
