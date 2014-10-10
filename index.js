var http = require('http')
var fs = require('fs')
var body = require('body/form')
var exec = require('child_process').exec
var ndjson = require('ndjson')
var csv = require('csv-write-stream')

http.createServer(function (req,res) {
  if(req.method === 'POST') {
    body(req, function (err, body) {
      console.error(body.input)
      exec(body.input).stdout
      .pipe(ndjson.parse())
      .pipe(csv())
      .pipe(res)
    })
  } else {
    fs.createReadStream('./index.html')
      .pipe(res)
  }
}).listen(2600)