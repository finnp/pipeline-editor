var request = require('browser-request')
var totable = require('htmltable')
var saveJSON = require('./lib/downloadjson.js')

window.onload = function () {
  
  var exportButton = document.querySelector('#export')
  
  exportButton.onclick = function () {
    var commands = getPipeline()
    saveJSON({main: commands}, 'gasket.json')
  }

  var addRowButton = document.querySelector('#add')
  
  addRowButton.onclick = function () {
    var li = document.querySelector('#commands li.hidden').cloneNode(true)
    var ul = document.querySelector('#commands')
    var removeButton = li.querySelector('.remove')
    removeButton.onclick = function () {
      li.className = 'hidden' // TODO: Actually properly delete it
    }
    li.className = '' // remove hidden
    ul.appendChild(li)
  }
  
  var evaluateButton = document.querySelector('#evaluate')
  
  
  function getSourceCmd(source, sourcetype) {
    // TODO: This should be npm command line tools
    if(sourcetype === 'get')
      return 'curl ' + source
    
    if(sourcetype === 'file')
      return 'cat ' + source
    
    return source
  }
  
  function getPipeline() {
    var source = getSourceCmd(
      document.querySelector('#source').value, 
      document.querySelector('#sourcetype').value
    )
    var inputs = document.querySelectorAll('#commands li:not(.hidden) input')
    var commands = [source]
    for(var i = 0; i < inputs.length; i++)
      commands.push(inputs[i].value)
    return commands
  }
  
  function evaluate() {
    var commands = getPipeline()
      
    var qs = '?commands=' + encodeURIComponent(JSON.stringify(commands))

    var source = new EventSource('/sse' + qs)
    var result = document.querySelector('#result')
    if (result.firstChild) result.removeChild(result.firstChild)
    var tablestream = totable(result)
    source.onmessage = function (e) {
      var message = JSON.parse(e.data)
      tablestream.write(message)
    }
    
    source.onerror = function (e) {
      tablestream.end()
      source.close() // when the connection is closed
    }
    return false
  }


  evaluateButton.onclick = evaluate
}

