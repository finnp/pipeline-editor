var request = require('browser-request')
var totable = require('htmltable')
var saveJSON = require('./lib/downloadjson.js')

window.onload = function () {
  
  var exportButton = document.querySelector('#export')
  
  exportButton.onclick = function () {
    var commands = getPipeline()
    saveJSON({gasket: commands}, 'gasket.json')
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
      
    var sourcetype = document.getElementById('sourcetype').value
    var source = document.getElementById('source').value

    var opts = {
      method: 'POST',
      json: {
        cmd: commands,
        sourcetype: sourcetype,
        source: source
      },
      url: '/'
    }
    request(opts,function (err, response, body) {
        var source = new EventSource('/sse')
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
    })
    return false
  }


  evaluateButton.onclick = evaluate
}

