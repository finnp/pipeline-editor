var request = require('browser-request')
var totable = require('htmltable')

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
        var source = new EventSource('/sse')
        var tablestream = totable('#result')
        source.onmessage = function (e) {
          var message = JSON.parse(e.data)
          tablestream.write(message)
        }
        
        source.onerror = function (e) {
          tablestream.end()
          source.close() // when the connection is closed
        }
    })
    return false
  }


  evaluateButton.onclick = evaluate
}

