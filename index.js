var http = require('http')
var fs = require('fs')
var path = require('path')
var url = require('url')
var qs = require('querystring')
var through = require('through2')

module.exports = function (port) {
  var tmp = require('tmp')
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

  return require('gasket')(pipeline).run('main')
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
    
  var parse = require('./lib/text2objectstream.js')
  sourceStream
    .pipe(parse())
    .pipe(through.obj(function (data, enc, cb) {
      this.push('data: ' + JSON.stringify(data) + '\n\n')
      cb(null)
    }))
    .pipe(res)
}