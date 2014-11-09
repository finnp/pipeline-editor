var through = require('through2')

module.exports = function () {
  return through.obj(function (data, enc, cb) {
    this.push('data: ' + JSON.stringify(data) + '\n\n')
    cb(null)
  })
}
