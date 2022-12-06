import { getSymbol, defineType, getControlName } from './format.js';

class Matrix {
  constructor( width = 0, height = 0, element = (x,y) => -1 ) {
    this.width = width;
    this.height = height;
    this.content = [];

    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        this.content[ y * width + x ] = element(x, y)
  }

  get (x, y) {
    return this.content[y * this.width + x];
  }
  set (x, y, value) {
    this.content[y * this.width + x] = value;
  }
}

class Range {
  constructor (index=0) {
    this._index = index;
    this.start = 0;
    this.end = 0;
    this._selected = {
      start: 0,
      end: 0
    }
  }

  get size () {
    return Math.abs(this.end - this.start);
  }

  get index () {
    return this._index;
  } 
  set index (value) {
    this._index = value;
  }

  get selected () {
    return Object.assign({},this._selected,{size: Math.abs(this._selected.end - this._selected.start)})
  }

  set selected (selection) {
    this._selected.start = selection.start||0;
    this._selected.end = selection.end||0;
  }
}

class Selection {

  constructor ( state = {
    caret: 0,
    selected: 0,
    line: 0,
    lines: 0,
    ranges: [],
    focus: false
  } ) { Object.assign(this, state); }
  
  syncState ( state ) {
    const { ranges, maxRange } = this.setRanges( state );

    const newState = Object.assign( {}, state, { maxRange, ranges } );
    return new Selection( newState );
  }

  setRanges ( state ) {
    let ranges = [], range, maxRange;

    for ( let i = 0; i < state.lines; i++ ) {
      
      range = this.ranges[i] || new Range(i);

      if (range.index == state.line) {
        range.selected = {
          start:state.caret,
          end:state.selected
        }
        if (state.caret > range.end) {
          range.end = state.caret; 
        } 
      }
      
      ranges[i] = range;
    }
    maxRange = Math.max( ...ranges.map( item => item.size ) );

    return { ranges, maxRange };
  }
}

class Text {
  constructor ( data = new Matrix(), selection = new Selection() ) {
    this.selection = selection;
    this.data = data;
  }
  get linesCount () {
    return this.data.length;
  }
  get value () {
    let copy = this.data.slice();
    let lines = copy.map( line => line.join('') )
    return lines.join('\n');
  }

  syncState (action) {
    if (!action.selection) return;

    const selection = this.selection.syncState( action.selection );

    const element = (x,y) => this.data.get(x,y) || -1;
    const data = new Matrix(selection.lines, selection.maxRange, element);

    return new Text ( data, selection );
  }

  _all (line, index) {
    return '';
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
  put (value) {
    this.data.set( this.selection.caret, this.selection.line, value )
    return this;
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

function handleControl ( {event,history}, dispatch ) {
  let controlName = getControlName(event.keyCode);
  try { constrolActions[`key${controlName}`]( this, dispatch ); } 
  catch (e) {}
}

function handleSymbol ( {event,history}, dispatch ) {
  let code = parseInt( `${event.keyCode}${event.altKey?1:0}${event.shiftKey?1:0}` );
  let text = this.text.put( code );
  if (text) dispatch( {text,cursor:event.selection.caret} );
}

function handleSelection ( {event,history}, dispatch ) {
  let text = this.text.syncState( {selection:event.selection} );
  dispatch( { text } );
}


const constrolActions = { keyup,keydown,keyleft,keyright,keyenter,keybackspace,keyescape,keyhome,keyend };
const inputHandlers = { handleControl, handleSymbol }


class InputTranslator {
  constructor ( provider, startState ) 
  {
    const defaultState = {
      focus: false,
      text: new Text(),
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
      scope.anchors.push(anchorElement);
    }

    const scope = this;
    provider.addEventListener( 'keydown', listen );
    provider.addEventListener( 'selection', selection );

    function dispatch ( action ) {
      let state = updateState( scope.state, action );
      scope.syncState( state );
    }

    function updateState ( state, action ) {
      return Object.assign( {}, state, action );
    }

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function listen ( {event,history} ) {
      const inputType = defineType(event.keyCode);

      try { inputHandlers[`handle${capitalizeFirstLetter(inputType)}`]
        .call( scope.state, {event, history}, dispatch ) } 
      catch (e) { console.log(e) }
    }

    function selection ( {event,history} ) {
      handleSelection.call( scope.state, {event,history}, dispatch );
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
    if ( container instanceof HTMLElement )
      return container.appendChild( this.input._el );
    if ( typeof(container) == 'string' );
      if ( container = container.replace('#','') ) {
        container = document.getElementById( container );
        if (container) return container.appendChild( this.element );
      }
  }
}

function createAnchorElement ( options = {} ) {
  return new Anchor(options);
}

export { InputTranslator, createAnchorElement };