var request = require('browser-request')

window.onload = function () {
  var form = document.querySelector('form')
  

  form.onsubmit = function () {
    function addToPipeline(text) {
      var ul = document.querySelector('#commands') 
      var li = document.createElement('li')
      li.appendChild(document.createTextNode(text))
      ul.appendChild(li)
    }
    
    console.log('submit')
    var cmd = document.querySelector('#input').value
    addToPipeline(cmd)
    var lis = document.querySelectorAll('#commands li')
    var commands = []
    for(var i = 0; i < lis.length; i++)
      commands.push(lis[i].firstChild.nodeValue)

    var opts = {
      method: 'POST',
      json: {cmd: commands},
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

