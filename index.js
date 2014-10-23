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
var path = require('path')


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

module.exports = function (port) {
  http.createServer(function (req,res) {
    if(req.url === '/bundle.js')
      return fs.createReadStream(path.resolve(__dirname, 'bundle.js')).pipe(res)
    
    if(req.method === 'POST') {
      body(req, function (err, body) {
        if(err) return console.error(err)
        console.log('Run ', body.cmd.join(' | '))
        gasket(body.cmd).run('main')
          .pipe(render())
          .pipe(res)
      })
    } else {
      fs.createReadStream(path.resolve(__dirname, 'index.html'))
        .pipe(res)
    }
  }).listen(port)
}

