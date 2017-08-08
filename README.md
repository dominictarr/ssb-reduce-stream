# ssb-reduce-stream

reduce a reverse stream of ssb messages into a collection
of threads and channels.

## data structure

outputs a data structure that looks like this:

``` js
{
  roots: {
    <thread_root_id>: {
      key: <thread_root_id>,
      value: <thead_initial_msg>,
      replies: [...],
    }
  },
  channels: {
    <channel_name>: <thread_id>
  }
}
```

It's assumed that the input is streamed in reverse order,
most recent first.

## License

MIT

