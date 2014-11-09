// parses csv, json and turns them into an object stream

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

var peek = require('peek-stream')
var through = require('through2')
var split = require('split')

module.exports = function() {
  return peek(function(data, swap) {
    // maybe it is JSON?
    if (isJSON(data)) return swap(null, require('ndjson').parse({strict: false}))

    // maybe it is CSV?
    if (isCSV(data)) return swap(null, require('csv-parser')())

    // pass through everything else
    
    var fallback = require('pumpify').obj(
      split(),
      through.obj(function (chunk, enc, cb) {
        cb(null, {row: chunk})
      })
    )

    swap(null, fallback)
  })
}