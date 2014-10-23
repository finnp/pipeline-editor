var request = require('browser-request')

window.onload = function () {

  var evaluateButton = document.querySelector('#evaluate')
  var form = document.querySelector('form')
  
  function addToPipeline(text) {
    var lastli = document.querySelector('#commands li:last-child') 
    var ul = lastli.parentNode
    var li = document.createElement('li')
    li.setAttribute('contenteditable', true)
    li.appendChild(document.createTextNode(text))
    ul.insertBefore(li, lastli)
  }
  
  form.onsubmit = function () {
    var cmd = document.querySelector('#input').value
    document.querySelector('#input').value = ''
    addToPipeline(cmd)
    evaluate()
    return false
  }

  function evaluate() {
    var lis = document.querySelectorAll('#commands li')
    var commands = []
    for(var i = 0; i < (lis.length - 1); i++)
      commands.push(lis[i].firstChild.nodeValue)

    var opts = {
      method: 'POST',
      json: {cmd: commands},
      url: '/',
    }
    request(opts,function (err, response, body) {
        // Use EventSource instead?
        document.querySelector('#result').innerHTML = response.response
    })
    return false
  }


  evaluateButton.onclick = evaluate
}

