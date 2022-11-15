import { getSymbol, defineType, getSpecialKey } from './format.js';

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

    console.log('get value', this.data)
    let copy = this.data.slice();
    let lines = copy.map( line => line.join('') )
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
    
    //let copy = this.data.slice();
    //if (copy[line]&&copy[line][index-1])
    //  copy = copy.splice(index,0,value);
    //copy.push(value);

    //let copy = [['a','b','c']]
    let copy = this.data.slice();
    copy[line].push(value)
    console.log('put',line,index,value,copy)
    return new Text('',this.lineSize,copy);
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
      copy[line].splice(index++,amount)
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
  let {text,line} = state.text.break(state.line, state.cursor);
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
  console.log('handle', dispatch, state)
  dispatch( {text:state.text.put(state.line,state.cursor,symbol),cursor:state.cursor+1} );
}


const constrolActions = { keyup,keydown,keyleft,keyright,keyenter,keybackspace,keyescape,keyhome,keyend };
const inputHandlers = { handleControl, handleSymbol }


class InputReader {
  constructor (startState, components) 
  {
    const defaultState = {
      cursor: 0,
      line: 0,
      focus: false,
      text: new Text(),
      locale: 'en',
      keyboard_type: 'ancii',
    }

    this.state = Object.assign( {}, defaultState, startState );

    this.syncState = function (state) {
      console.log('sync state', components)
      this.state = state;
      components.forEach( cmp => cmp.syncState(this.state) )
    }

    this.read = function ( input ) {

      //console.log('read',input)
      if (input instanceof Array) {
        for (let event of input) {
          scope.read(event); }
        return;
      }

      try {
        let inputType = defineType(input.keyCode);
        console.log('input type', scope.state)
        inputHandlers[`handle${capitalizeFirstLetter(inputType)}`]( input, scope.state, dispatch )
      } catch (e) {}
    }

    const scope = this;

    function dispatch ( action ) {
      console.log('dispatch')
      let state = updateState( scope.state, action );
      scope.syncState( state );
    }

    function updateState ( state, action ) {
      return Object.assign( {}, state, action );
    }

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }
}

class TextArea {
  constructor () {
    this.element = document.createElement('div');
  }
  syncState (state) {
    console.log('sync state', state.text)
    this.element.textContent = state.text.value;
  }
  static mount (provider,container,options) {
    const input = new TextArea();
    const reader = new InputReader(options,[input]);
    /*
    provider.onValueChanged( event => {
      reader.read(event.data);
    } )
    */

    container.appendChild(input.element);

    return {reader,input};
  }
}

export { InputReader, TextArea };