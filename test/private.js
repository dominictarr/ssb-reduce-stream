var keys = require('ssb-keys')

var alice = keys.generate()
var bob = keys.generate()
var charles = keys.generate()

var tape = require('tape')

var V = require('ssb-validate')

var state = V.initial()

function merge(obj, _obj) {
  for(var k in _obj)
    obj[k] = _obj[k]
  return obj
}

function box (content, recps) {
  return keys.box(merge({
    type: 'post',
    recps: recps,
  }, content), recps)
}

state = V.appendNew(state, null,
  alice, box({text:'hello'}, [alice.id, bob.id]), 1000
)


function prev () {
  return toKeyValue(state.queue[state.queue.length - 1]).key
}

state = V.appendNew(state, null,
  bob, box({text:'hello there',
    root: prev(), branch: prev(),
  }, [alice.id, bob.id]), 2000
)

state = V.appendNew(state, null,
  charles, box({text:'hello there'}, [charles.id]), 3000
)

state = V.appendNew(state, null,
  charles, box({text:'hello there', root: prev(), branch: prev()}, [charles.id]), 3000
)


state = V.appendNew(state, null,
  charles, box({text:'everyone'}, [alice.id, bob.id, charles.id]), 4000
)

function unbox (key, data) {
  if('string' !== typeof data.value.content)
    return data
  else {
    var msg = data.value
    return {
      key: data.key,
      value: {
        previous: msg.previous,
        author: msg.author,
        sequence: msg.sequence,
        timestamp: msg.timestamp,
        hash: msg.hash,
        content: keys.unbox(msg.content, key),
        private: true
      }
    }
  }
}

function toKeyValue (msg) {
  return {
    key: '%'+keys.hash(JSON.stringify(msg, null, 2)),
    value: msg
  }
}


var threads =
  state.queue.slice().reverse()
    .map(toKeyValue)
    .map(unbox.bind(null, alice))
    .reduce(require('../').threadReduce, {self: alice.id})

console.log(threads)

