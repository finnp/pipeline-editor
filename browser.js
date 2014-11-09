var request = require('browser-request')
var totable = require('htmltable')
var saveJSON = require('./lib/downloadjson.js')
var elementClass = require('element-class')

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
    removeButton.onclick = remove.bind(null, ul, li)
    
    var peekButton = li.querySelector('.peek')
    peekButton.onclick = peek
    
    li.className = '' // remove hidden
    ul.appendChild(li)
  }
  
  function positionFromButton(button) {
    var pos = -2 // offset
    var li = button.parentNode
    while (li = li.previousSibling) ++pos
    return pos
  }

  function remove(ul, li, e) {
    var pos = positionFromButton(e.target)
    hidePeekButtonsFrom(pos)
    ul.removeChild(li)
  }

  
  function peek(e) {
    var pos = positionFromButton(e.target)
    
    renderTable(new EventSource('/sse?peek=' + pos))
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
  
  
  function hidePeekButtonsFrom(i) {
    var peeks = document.querySelectorAll('.peek')
    while(i < peeks.length && i++) {
      if(peeks[i]) elementClass(peeks[i]).add('hidden')
    }
  }
  
  function showPeekButtons() {
    // make peek button visible
    var peeks = document.querySelectorAll('.peek')
    for(var i = 0; i < peeks.length; i++) {
      elementClass(peeks[i]).remove('hidden')
    }
  }
  
  function evaluate() {
    var commands = getPipeline()
      
    var qs = '?commands=' + encodeURIComponent(JSON.stringify(commands))
    
    showPeekButtons()

    renderTable(new EventSource('/sse' + qs))

    return false
  }
  
  function renderTable(source) {
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
  }

  evaluateButton.onclick = evaluate
}

