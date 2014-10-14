var request = require('browser-request')

window.onload = function () {
  var button = document.querySelector('#submit')
  button.onclick = function () {
    console.log('submit')
    var opts = {
      method: 'POST',
      json: {cmd:'cat test.ndjson'},
      url: '/',
    }
    request(opts,function (err, response, body) {
        console.log(response.response)
        // Use EventSource instead?
        document.querySelector('#result').innerHTML = response.response
    })
  }
}