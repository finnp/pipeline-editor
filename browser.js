var request = require('browser-request')
var totable = require('htmltable')
var saveJSON = require('./lib/downloadjson.js')
var elementClass = require('element-class')
var ssejson = require('ssejson')

var $ = document.querySelector.bind(document)
var $All = document.querySelectorAll.bind(document)

window.onload = function () {
  
  var exportButton = $('#export')
  
  // init first peek button
  var peekButton = document.querySelector('.peek')
  peekButton.onclick = peekButtonEvent
  
  exportButton.onclick = function () {
    var commands = getPipeline()
    saveJSON({main: commands}, 'gasket.json')
  }

  var addRowButton = $('#add')
  
  var tabindex = 1
  
  addRowButton.onclick = function () {
    var li = $('#commands li.hidden').cloneNode(true)
    var ul = $('#commands')

    tabindex++
    li.querySelector('input').setAttribute('tabindex', tabindex)
    
    var removeButton = li.querySelector('.remove')
    removeButton.onclick = remove.bind(null, ul, li)

    var peekButton = li.querySelector('.peek')
    peekButton.onclick = peekButtonEvent

    elementClass(li).remove('hidden')
    ul.appendChild(li)
  }
  
  function getStepPosition(li) {
    var pos = -2 // offset
    while (li = li.previousSibling) ++pos
    if(pos < 0) pos = 0
    return pos
  }

  function remove(ul, li, e) {
    var pos = getStepPosition(e.target.parentNode)
    var isCurrent = elementClass(li).has('peekcurrent')
    if(isCurrent) markCurrentPeek(li.previousSibling)
    peekStep(pos - 1)
    hidePeekButtonsFrom(pos)
    ul.removeChild(li)
  }


  function markCurrentPeek(element) {
    var lis = $All('#commands li')
    for(var i = 0; i < lis.length; i++)
      elementClass(lis[i]).remove('peekcurrent')
    elementClass($('.source')).remove('peekcurrent')
    elementClass(element).add('peekcurrent')
  }
  
  function peekButtonEvent(e) {
    var pos = getStepPosition(e.target.parentNode)
    
    markCurrentPeek(e.target.parentNode)
    
    peekStep(pos)
  }
  
  function peekStep(pos) {
    ssejson.fromEventSource('/sse?peek=' + pos)
      .pipe(totable($('#result')))  
  }
  
  var evaluateButton = $('#evaluate')
  
  
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
      $('#source').value, 
      $('#sourcetype').value
    )
    var inputs = $All('#commands li:not(.hidden) input')
    var commands = [source]
    for(var i = 0; i < inputs.length; i++)
      commands.push(inputs[i].value)
    return commands
  }
  
  
  function hidePeekButtonsFrom(i) {
    var peeks = $All('.peek')
    while(i < peeks.length && i++) {
      if(peeks[i]) elementClass(peeks[i]).add('hidden')
    }
  }
  
  function showPeekButtons() {
    // make peek button visible
    var peeks = $All('.peek')
    for(var i = 0; i < peeks.length; i++) {
      elementClass(peeks[i]).remove('hidden')
    }
  }
  
  function evaluate() {
    var commands = getPipeline()
      
    var qs = '?commands=' + encodeURIComponent(JSON.stringify(commands))
    
    showPeekButtons()
    
    var lastElement = 
      $('#commands li:not(.hidden):last-child')
      || $('.source')
    
    markCurrentPeek(lastElement)

    ssejson.fromEventSource('/sse' + qs)
      .pipe(totable($('#result')))

    return false
  }


  evaluateButton.onclick = evaluate
}

