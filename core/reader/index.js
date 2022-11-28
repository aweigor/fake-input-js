import { getSymbol, defineType, getControlName } from './format.js';

/*
possible features:
line-width -> lines detection
*/

class Text {
  constructor ( startValue = '', lineSize = Infinity, data ) {
    this.lineSize = lineSize;
    this.data = data||startValue.split('\n').map( line => line.split('') );
  }
  get linesCount () {
    return this.data.length;
  }
  get value () {
    let copy = this.data.slice();
    let lines = copy.map( line => line.join('') )
    return lines.join('\n');
  }
  _all (line, index) {
    let copy = this.data.slice(), lineCopy;
    let lines = copy.map( (data,lineIndex) => {
      lineCopy = data;
      if (lineIndex === line) {
        lineCopy = data.slice();
        if (lineCopy[index]) {
          lineCopy[index] = `_${copy[line][index]}_`;
        } else {
          lineCopy[index] = '_';
        }
      }
      return lineCopy.join('');
    } );

    return lines.join('\n');
  }
  _lineAt ( index ) {
    return this.data[index].join('');
  }
  _symbolAt ( line, index ) {
    if (this.data[line])
      return this.data[line][index];
  }
  put (line,index,value) {
    let copy = this.data.slice();
    let isChanged = false;

    if (copy[line]&&copy[line].length) {
      if (index > copy[line].length) {
        for (let i = copy[line].length; i < index; i++) {
          copy[line][i] = '';
        }
      }
      copy[line].splice(index,0,value);
      isChanged = true;
    } else if (!copy[line]||!copy[line].length) {
      if (line > copy.length) {
        for (let i = copy.length; i < line; i++) {
          copy[line] = []; } };
      
      copy[line] = Array(index);
      copy[line][index] = value;
      isChanged = true;
    }
    
    return isChanged ? new Text('',this.lineSize,copy) : this;
  }
  break (line,index) {
    let copy = this.data.slice(),first,second,newline = line;
    if (copy[line]) {
      first = copy[line].slice(0,index);
      second = copy[line].slice(index,0);
      copy[line] = first;
      copy.splice(++newline,0,second);
    }
    return {text:new Text(_,this.lineSize,copy),line:newline};
  }
  remove (line,index,amount=1) {
    let copy = this.data.slice();
    if (copy[line]&&copy[index+amount])
      copy[line].splice(index++,amount);
    return {text:new Text(_,this.lineSize,copy),cursor:index};
  }
  static clear () {
    return new Text();
  }
}

function keyup ( state, dispatch ) {
  let line = state.line;
  if (line > 0) line -= 1;
  dispatch( {line} );
}

function keydown ( state, dispatch ) {
  let lines = state.text.lines,line = state.line;
  if (state.line < lines) line += 1;
  dispatch( {line} );
}

function keyleft ( state, dispatch ) {
  let cursor = state.cursor;
  if (state.cursor > 0) cursor -= 1;
  dispatch( {cursor} );
}

function keyright ( state, dispatch ) {
  let cursor = state.cursor;
  if (state.cursor < state.text.length - 1) cursor += 1;
  dispatch( {cursor} );
}

function keyenter ( state, dispatch ) {
  console.log( 'key enter', state )
  let { text,line } = state.text.break(state.selection.line, state.selection.caret);
  dispatch( {text,line,cursor:0} );
}

function keybackspace ( state, dispatch ) {
  let {text,cursor} = state.text.remove(state.line, state.cursor);
  dispatch( {text,cursor} );
}

function keyescape ( state, dispatch ) {
  dispatch( {focus: false} )
}

function keyhome ( state, dispatch ) {
  dispatch( {cursor: 0, line:0} );
}

function keyend ( state, dispatch ) {
  let endLine = state.text.linesCount - 1;
  let endLen = state.text._lineAt( endLine ).length;
  dispatch( {line:endLine,cursor:endLen&&--endLen} )
}

function handleControl ( input, state, dispatch ) {
  let controlName = getControlName(input.keyCode);
  console.log('get control name', controlName)
  try {
    constrolActions[`key${controlName}`]( state, dispatch );
  } catch (e) {}
}

function handleSymbol ( input, state, dispatch ) {
  let symbol = getSymbol(
    input.keyCode, 
    input.altKey, 
    input.shiftKey, 
    state.locale
  );
  let text = state.text.put(state.selection.line,state.selection.caret,symbol);
  if (text) dispatch( {text,cursor:state.cursor+1} );
}


const constrolActions = { keyup,keydown,keyleft,keyright,keyenter,keybackspace,keyescape,keyhome,keyend };
const inputHandlers = { handleControl, handleSymbol }


class InputTranslator {
  constructor ( provider, startState ) 
  {
    const defaultState = {
      cursor: 0,
      line: 0,
      focus: false,
      text: new Text(),
      selection: {},
      locale: 'en',
      keyboard_type: 'ancii',
    }

    this.anchors = [];

    this.state = Object.assign( {}, defaultState, startState );

    this.syncState = function (state) {
      scope.state = state;
      scope.anchors.forEach( cmp => cmp.syncState(this.state) );
    }

    this.use = function ( anchorElement ) {
      scope.anchors.push(anchorElement)
    }

    const scope = this;
    provider.addEventListener( 'keydown', listen );

    function dispatch ( action ) {
      let state = updateState( scope.state, action );
      scope.syncState( state );
    }

    function updateState ( state, action ) {
      return Object.assign( {}, state, action );
    }

    function capitalizeFirstLetter(string) {
      console.log('capitalizing', string);
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function listen ( input ) {
      if (input instanceof Array)
        return input.forEach( event => scope.listen(event) );

      scope.state.selection = input.selection;
      const inputType = defineType(input.keyCode);

      try {
        inputHandlers[`handle${capitalizeFirstLetter(inputType)}`]( 
          input, scope.state, dispatch )
      } catch (e) { console.log(e) }
    }
  }
}

class Anchor {
  constructor ({name}) {
    this.name = name;
    this.element = document.createElement('div');
  }
  syncState (state) {
    this.element.textContent = state.text._all(state.line,state.cursor);
  }
  mount (container) {
    if (container instanceof HTMLElement) 
      return container.appendChild(this.input._el);
    if (typeof(container) == 'string')
      if (container = container.replace('#','')) {
        container = document.getElementById( container );
        if (container) return container.appendChild(this.element);
      }
  }
}

function createAnchorElement ( options = {} ) {
  return new Anchor(options);
}

export { InputTranslator, createAnchorElement };