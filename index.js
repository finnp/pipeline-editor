var http = require('http')
var fs = require('fs')
var path = require('path')
var url = require('url')
var qs = require('querystring')
var through = require('through2')
var ssejson = require('ssejson')
var stream = require('stream')

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
    
      if(route === '/err') 
        return errRoute(res, reqUrl, tmpPath)
      
      if(route === '/')
        return fs.createReadStream(path.resolve(__dirname, 'index.html')).pipe(res)
    }).listen(port)
  })
}



var errStream = new stream.PassThrough({objectMode: true})
function errRoute(res, reqUrl, tmpPath) {
  res.writeHead(200, {'Content-Type': 'text/event-stream'})
  errStream.pipe(ssejson.serialize()).pipe(res)
  // errStream.write({start: true})
}


function peekStep(peekPosition, tmpPath) {
  var cachePath = path.resolve(tmpPath, peekPosition + '.cache')
  return fs.createReadStream(cachePath)
}

function runFrom(commands, position, tmpPath) {
  var cmd
  try {
    cmd = JSON.parse(commands)
  } catch(e) {
    console.error('Parse error')
    return res.end()
  }
  
  
  // insert caching
  var pipeline = cmd.reduce(function (pre, curr, i) {
    pre.push(curr)
    pre.push('save-through ' + path.resolve(tmpPath, i + '.cache'))
    return pre
  }, [])

  
  // [from, cache, step1, cache, step2]
  pipeline = pipeline.slice((position + 1) * 2)
  
  
  var cachePath = path.resolve(tmpPath, position + '.cache')
  
  var gasketPipeline = require('gasket')(pipeline).run('main')
  
  gasketPipeline.on('error', function (error) {
    errStream.write({error: error.message})
  })
  
  if(position >= 0)
    return fs.createReadStream(cachePath).pipe(gasketPipeline)
  else
    return gasketPipeline
}


function sseRoute(res, reqUrl, tmpPath) {
  
  res.setHeader('Content-Type', 'text/event-stream')
  var query = qs.parse(reqUrl.query)
  
  var sourceStream
  if('commands' in query) 
    sourceStream = runFrom(query.commands, Number(query.position), tmpPath)
  else if('peek' in query)
    sourceStream = peekStep(query.peek, tmpPath)
  else 
    return res.end()
    
  var parse = require('./lib/text2objectstream.js')
  sourceStream
    .pipe(parse())
    .pipe(ssejson.serialize())
    .pipe(res)
}