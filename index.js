var http = require('http')
var fs = require('fs')
var body = require('body/json')
var exec = require('child_process').exec
var ndjson = require('ndjson')
var totable = require('ndjson2table')
var gasket = require('gasket')
var peek = require('peek-stream')
var csv = require('csv-parser')
var pumpify = require('pumpify')
var passthrough = require('stream').PassThrough

// require('open')('http://localhost:2600')

var isCSV = function(data) {
  return data.toString().indexOf(',') > -1
}

var isJSON = function(data) {
  try {
    JSON.parse(data)
    return true
  } catch (err) {
    return false
  }
}

var render = function() {
  return peek(function(data, swap) {
    // maybe it is JSON?
    if (isJSON(data)) return swap(null, pumpify(ndjson.parse({strict: false}), totable()))

    // maybe it is CSV?
    if (isCSV(data)) return swap(null, pumpify(csv(),totable()))

    // pass through everything else
    swap(null, new passthrough())
  })
}

http.createServer(function (req,res) {
  if(req.url === '/bundle.js')
    return fs.createReadStream('./bundle.js').pipe(res)
  
  if(req.method === 'POST') {
    body(req, function (err, body) {
      if(err) return console.error(err)
        console.log(body.cmd)
      gasket(body.cmd).run('main')
        .pipe(render())
        .pipe(res)
    })
  } else {
    fs.createReadStream('./index.html')
      .pipe(res)
  }
}).listen(2600)
console.log('Listening on port 2600')