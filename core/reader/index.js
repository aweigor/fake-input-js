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
  getString (y) {
    return this.content.slice( y * this.width, y * this.width + this.width );
  }
  as2DArray () {
    return Array.from( new Array(this.height), ( v,i ) => this.getString(i) )
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
    maxRange: 0,
    focus: false
  } ) { Object.assign(this, state); }
  
  syncState ( state ) {
    const { ranges, maxRange } = this.setRanges( state );
    const newState = Object.assign( {}, state, { maxRange, ranges } );
    const extended = newState.lines > this.lines || newState.maxRange > this.maxRange;

    return { selection: new Selection( newState ), extended }
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
    return this.data.as2DArray()
      .map( string => string
        .map( input => getSymbol( ...Object.values( this.decodeInput( input ) ) ) )
        .join('') )
      .join('\n')
  }

  syncState (action) {
    if (!action.selection) return;

    const { selection, extended } = this.selection.syncState( action.selection );

    let data = this.data;

    if (true) {
      const element = (x,y) => this.data.get(x,y) || -1;
      data = new Matrix(selection.maxRange, selection.lines, element);
    }

    return new Text ( data, selection );
  }

  encodeInput ( keyCode, altKey, shiftKey ) {
    return parseInt( `${keyCode}${ + altKey }${ + shiftKey }` );
  }

  decodeInput ( value ) {
    let a = Array.from( String(value), (num) => Number(num));

    return {
      keyCode: Number(a.slice(0,-2).join('')),
      altKey: !!a[a.length - 1],
      shiftKey: !!a[a.length - 2]
    }
  }

  put (input) {
    let code = this.encodeInput( input.keyCode,input.altKey,input.shiftKey );
    this.data.set( this.selection.caret, this.selection.line, code );
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
    if (copy[line]&&copy[index+amount]) copy[line].splice(index++,amount);
    return {text:new Text(_,this.lineSize,copy),cursor:index};
  }
  static clear () {
    return new Text();
  }
}

function keyup ( state, dispatch ) {
  return;
  let line = state.line;
  if (line > 0) line -= 1;
  dispatch( {line} );
}

function keydown ( state, dispatch ) {
  return;
  let lines = state.text.lines,line = state.line;
  if (state.line < lines) line += 1;
  dispatch( {line} );
}

function keyleft ( state, dispatch ) {
  return;
  let cursor = state.cursor;
  if (state.cursor > 0) cursor -= 1;
  dispatch( {cursor} );
}

function keyright ( state, dispatch ) {
  return;
  let cursor = state.cursor;
  if (state.cursor < state.text.length - 1) cursor += 1;
  dispatch( {cursor} );
}

function keyenter ( state, dispatch ) {
  console.log( 'key enter', state )
  let { text } = state.text.break(state.selection.line, state.selection.caret);
  dispatch( { text } );
}

function keybackspace ( state, dispatch ) {
  let {text,cursor} = state.text.remove(state.line, state.cursor);
  dispatch( {text,cursor} );
}

function keyescape ( state, dispatch ) {
  return;
  dispatch( {focus: false} )
}

function keyhome ( state, dispatch ) {
  return;
  dispatch( {cursor: 0, line:0} );
}

function keyend ( state, dispatch ) {
  return;
  let endLine = state.text.linesCount - 1;
  let endLen = state.text._lineAt( endLine ).length;
  dispatch( {line:endLine,cursor:endLen&&--endLen} )
}

function handleControl ( state, {event,history}, dispatch ) {
  let controlName = getControlName(event.keyCode);
  try { constrolActions[`key${controlName}`]( state, dispatch ); } 
  catch (e) {}
}

function handleSymbol ( state, {event,history}, dispatch ) {
  let text = state.text.put( event );
  if (text) dispatch( {text,cursor:event.selection.caret} );
}

function handleSelection ( state, {event,history}, dispatch ) {
  let text = state.text.syncState( {selection:event.selection} );
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

      try { 
        const f = inputHandlers[`handle${capitalizeFirstLetter(inputType)}`];
        f instanceof Function && f( scope.state, {event, history}, dispatch );
      } catch (e) { console.error(e) }
    }

    function selection ( {event,history} ) {
      handleSelection( scope.state, {event,history}, dispatch );
    }
  }
}

class Anchor {
  constructor ({name}) {
    this.name = name;
    this.element = document.createElement('div');
  }
  syncState (state) {
    this.element.textContent = state.text.value;
    //this.element.textContent = 'asdas';
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