var http = require('http')
var fs = require('fs')
var body = require('body/json')
var exec = require('child_process').exec
var ndjson = require('ndjson')
var totable = require('ndjson2table')
var gasket = require('gasket')

// require('open')('http://localhost:2600')

http.createServer(function (req,res) {
  if(req.url === '/bundle.js')
    return fs.createReadStream('./bundle.js').pipe(res)
  
  if(req.method === 'POST') {
    body(req, function (err, body) {
      if(err) return console.error(err)
        console.log(body.cmd)
      gasket(body.cmd).run('main')
        .pipe(ndjson.parse({strict: false}))
        .pipe(totable())
        .pipe(res)
    })
  } else {
    fs.createReadStream('./index.html')
      .pipe(res)
  }
}).listen(2600)
console.log('Listening on port 2600')