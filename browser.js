var request = require('browser-request')
var totable = require('htmltable')
var saveJSON = require('./lib/downloadjson.js')
var elementClass = require('element-class')
var ssejson = require('ssejson')

var $ = document.querySelector.bind(document)
var $All = document.querySelectorAll.bind(document)

window.onload = function () {
  
  $('#export').onclick = exportButtonEvent
  $('.peek').onclick = peekButtonEvent
  $('.runfromhere').onclick = runFromHereButtonEvent
  $('#add').onclick = addRowButtonEvent
  $('#evaluate').onclick = evaluateButtonEvent
  
  // Button Events
  
  function exportButtonEvent() {
    var commands = getPipeline()
    saveJSON({main: commands}, 'gasket.json')
  }

  
  var tabindex = 1
  
  function addRowButtonEvent () {
    var li = $('#step-template li').cloneNode(true)
    var ul = $('#commands')

    tabindex++
    li.querySelector('input').setAttribute('tabindex', tabindex)
    
    var removeButton = li.querySelector('.remove')
    removeButton.onclick = removeButtonEvent.bind(null, ul, li)

     li.querySelector('.peek').onclick = peekButtonEvent
     li.querySelector('.runfromhere').onclick = runFromHereButtonEvent
    

    elementClass(li).remove('hidden')
    ul.appendChild(li)
  }

  function removeButtonEvent(ul, li, e) {
    var pos = getStepPosition(e.target.parentNode)
    var isCurrent = elementClass(li).has('peekcurrent')
    if(isCurrent) markCurrentPeek(li.previousElementSibling)
    peekStep(pos - 1)
    hideButtonsFrom('.peek', pos)
    hideButtonsFrom('.runfromhere', pos)
    ul.removeChild(li)
  }

  function peekButtonEvent(e) {
    var pos = getStepPosition(e.target.parentNode)
    
    markCurrentPeek(e.target.parentNode)
    
    peekStep(pos)
  }
  
  function runFromHereButtonEvent(e) {
    var pos = getStepPosition(e.target.parentNode)
    runFrom(pos) 
  }
  
  function evaluateButtonEvent() {
    showButtons('#commands .peek')
    showButtons('#commands .runfromhere')
    
    runFrom(-1) // 0 is first cache

    return false
  }
  
  //  helper functions

  
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
    var inputs = $All('#commands li input')
    var commands = [source]
    for(var i = 1; i < inputs.length; i++)
      commands.push(inputs[i].value)
    return commands
  }
  
  
  function hideButtonsFrom(selector, i) {
    var buttons = $All(selector)
    while(i < buttons.length && i++) {
      if(buttons[i]) elementClass(buttons[i]).add('hidden')
    }
  }
  
  function showButtons(selector) {
    var peeks = $All(selector)
    for(var i = 0; i < peeks.length; i++) {
      elementClass(peeks[i]).remove('hidden')
    }
  }
  

  function getStepPosition(li) {
    var pos = -2
    while (li = li.previousSibling) ++pos
    if(pos < 0) pos = 0
    return pos
  }


  function markCurrentPeek(element) {
    var lis = $All('#commands li')
    for(var i = 0; i < lis.length; i++)
      elementClass(lis[i]).remove('peekcurrent')
    elementClass(element).add('peekcurrent')
  }
  
  
  function peekStep(pos) {
    ssejson.fromEventSource('/sse?peek=' + pos)
      .pipe(totable($('#result')))  
    }

  
  function runFrom(pos) {
    var commands = getPipeline()
    var qs = '?position=' + pos + '&commands=' + encodeURIComponent(JSON.stringify(commands))
    
    // jump to last step
    markCurrentPeek($('#commands li:last-child'))
    
    ssejson.fromEventSource('/sse' + qs)
      .pipe(totable($('#result')))
  }
}

