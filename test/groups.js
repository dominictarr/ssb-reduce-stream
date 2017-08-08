var keys = require('ssb-keys')

var alice = keys.generate()
var bob = keys.generate()
var charles = keys.generate()

var tape = require('tape')

var V = require('ssb-validate')

var state = V.initial()

function prev () {
  return toKeyValue(state.queue[state.queue.length - 1]).key
}

state = V.appendNew(state, null,
  alice,
  {type: 'group', name: 'alice-group'},
  1000
)

var agroup = prev()

state = V.appendNew(state, null,
  bob, {
    type: 'post',
    text: 'hello there',
    group: agroup,
  }, 2000
)

function toKeyValue (msg) {
  return {
    key: '%'+keys.hash(JSON.stringify(msg, null, 2)),
    value: msg
  }
}

var tape = require('tape')

tape("alice's threads", function (t) {
  var threads =
    state.queue.slice().reverse()
      .map(toKeyValue)
      .reduce(require('../').threadReduce, {self: alice.id})

  console.log(threads)
  t.ok(threads.groups[agroup])

  t.end()

})

