import { getSymbol, defineType, getControlName } from './format.js';

class Matrix {
  constructor( width = 0, height = 1, element = (x,y) => -1 ) {
    this.width = width;
    this.height = height;
    this.content = [];

    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        
        this.content[ y * width + x ] = element(x, y);
      }
  }

  get (x, y) {
    if (this.width <= x) return -1;
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
    this.isNewRange = true;
  }

  get size () {
    return Math.abs(this.end - this.start) + 1;
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
    let ranges = this.ranges.slice(), range, maxRange;

    if ( ranges.length < state.lines ) {
      for ( let i = 0, l = state.lines - ranges.length; i < l; i++ ) {
        ranges.splice( state.line + i, 0, new Range( i ) );
      }
    }

    if (ranges[state.line]) {
      ranges[state.line].selected = {
        start:state.caret,
        end:state.selected
      }
      if (state.caret > ranges[state.line].end) {
        ranges[state.line].end = state.caret; 
      }
    }

    maxRange = Math.max( ...ranges.map( item => item.size ) );

    return { ranges, maxRange };
  }

  getRange ( index ) {
    const range = this.ranges[index];
    const isNewRange = range.isNewRange;
    
    return { range,isNewRange };
  }

  getLine ( index ) {
    let resIndex = 0;

    for( let i = 0; i <= index; i++ ) {
      const { range,isNewRange } = this.getRange(i);
      if (i == index) {
        if ( isNewRange ) return -1;
        return resIndex;
      }
      if ( !isNewRange ) ++resIndex;
    }

    return resIndex;
  }

  setOld () {
    this.ranges.forEach( range => range.isNewRange = false )
    return this;
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
      .join('<br>')
  }

  syncState (action) {
    if (!action.selection) return;
    const { selection, extended } = this.selection.syncState( action.selection );

    let data = this.data;

    if (extended) {
      const element = (x,y) => {
        // check line number. if range is new - it is not included in data yet, so data for this index is empty
        let line = selection.getLine(y);
        if ( line !== -1 ) return this.data.get(x,line) || -1;
        return -1;
      }
      data = new Matrix(selection.maxRange, selection.lines, element);
    }

    return new Text ( data, selection.setOld() );
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

  put ( data ) {
    let code = this.encodeInput( data.keyCode,data.altKey,data.shiftKey );
    this.data.set( this.selection.caret, this.selection.line, code );
    return this;
  }
  break () {
    return
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

function keyup ( state, dispatch ) {}
function keydown ( state, dispatch ) {}
function keyleft ( state, dispatch ) {}
function keyright ( state, dispatch ) {}
function keyescape ( state, dispatch ) {}
function keyhome ( state, dispatch ) {}
function keyend ( state, dispatch ) {}

function keyenter ( state, dispatch ) {
  let { text } = state.text.break();
  dispatch( { text } );
}
function keybackspace ( state, dispatch ) {}

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
    this.element.innerHTML = state.text.value;
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