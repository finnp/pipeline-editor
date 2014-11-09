var http = require('http')
var fs = require('fs')
var body = require('body/json')
var exec = require('child_process').exec
var ndjson = require('ndjson')
var gasket = require('gasket')
var peek = require('peek-stream')
var csv = require('csv-parser')
var passthrough = require('stream').PassThrough
var path = require('path')
var through = require('through2')
var split = require('split')
var pumpify = require('pumpify')
var tmp = require('tmp')
var url = require('url')
var qs = require('querystring')

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

var parse = function() {
  return peek(function(data, swap) {
    // maybe it is JSON?
    if (isJSON(data)) return swap(null, ndjson.parse({strict: false}))

    // maybe it is CSV?
    if (isCSV(data)) return swap(null, csv())

    // pass through everything else
    
    var fallback = pumpify.obj(
      split(),
      through.obj(function (chunk, enc, cb) {
        cb(null, {row: chunk})
      })
    )

    swap(null, fallback)
  })
}


function runFull(commands, tmpPath) {
  var cmd
  try {
    cmd = JSON.parse(commands)
  } catch(e) {
    console.error('Parse error')
    return res.end()
  }

  console.log('Run ', cmd.join(' | '))
  
  // insert caching
  var pipeline = cmd.reduce(function (pre, curr, i) {
    pre.push(curr)
    pre.push('save-through ' + path.resolve(tmpPath, i + '.cache'))
    return pre
  }, [])

  return gasket(pipeline).run('main')
}

function peekStep(peekPosition, tmpPath) {
  var cachePath = path.resolve(tmpPath, peekPosition + '.cache')
  return fs.createReadStream(cachePath)
}


function sseRoute(res, reqUrl, tmpPath) {
  
  res.setHeader('Content-Type', 'text/event-stream')
  var query = qs.parse(reqUrl.query)
  
  var sourceStream
  if('commands' in query) 
    sourceStream = runFull(query.commands, tmpPath)
  else if('peek' in query)
    sourceStream = peekStep(query.peek, tmpPath)
  
  sourceStream
    .pipe(parse())
    .pipe(through.obj(function (data, enc, cb) {
      this.push('data: ' + JSON.stringify(data) + '\n\n')
      cb(null)
    }))
    .pipe(res)
}

module.exports = function (port) {
  tmp.dir({unsafeCleanup: true}, function (err, tmpPath) {
    if(err) throw err
    http.createServer(function (req,res) {
      var reqUrl = url.parse(req.url)
      var route = reqUrl.pathname
      if(route === '/bundle.js')
        return fs.createReadStream(path.resolve(__dirname, 'bundle.js')).pipe(res)
    
      if(route === '/sse') 
        return sseRoute(res, reqUrl, tmpPath)
      
      if(route === '/')
        return fs.createReadStream(path.resolve(__dirname, 'index.html')).pipe(res)
    }).listen(port)
  })
}
