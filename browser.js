var request = require('browser-request')

window.onload = function () {
  var form = document.querySelector('form')
  form.onsubmit = function () {
    console.log('submit')
    var cmd = document.querySelector('#input').value || ''
    var opts = {
      method: 'POST',
      json: {cmd: cmd},
      url: '/',
    }
    request(opts,function (err, response, body) {
        console.log(response.response)
        // Use EventSource instead?
        document.querySelector('#result').innerHTML = response.response
    })
    return false
  }
}