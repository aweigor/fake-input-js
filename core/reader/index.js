/*
ver. 2.0
*/


import { getSymbol, defineType, getControlName } from './format.js';

class ListItem {
  constructor ( data = null, { next, next_selected } = {} ) {
    Object.assign(this, { data, next, next_selected });
  }
}

class List {
  constructor ( head = null ) {
    this.head = head;
  }

  add ( index, item ) {
    let i = 0;

    for ( let current of this ) {
      if ( i == index ) {
        item.next = current.next;
        current.next = item;
        break;
      };
    }
  }

  remove ( start, end ) {
    // not implemented
  }

  find (index) {
    let i = 0, result;

    for ( let element of this ) {
      if ( i == index ) result = element;
      else i++;
    }

    return result;
  }

  [Symbol.iterator]() {
    let data  = this.head, value;

    return {
      next: () => {
        value = data;
        data = data&&data.next;
        return ({ value, done: !value });
      }
    }
  }
}

class LineSymbol extends ListItem {
  constructor ( data = null ) {
    super( data );
  }
}

class Line extends ListItem {
  constructor ( data = new List() ) {
    super( data );
    this.data.head = new LineSymbol( 0 ); // new line;
  }
  find( index ) {

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
    this._removed = {
      start: null,
      end: null
    }
    this.isNewRange = true;
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

  get isRemoved () {
    return this.end !== this.start
      && this._removed.start === this.start
      && this._removed.end == this.end
  }

  set selected (selection) {
    
    this._selected.start = selection.start||0;
    this._selected.end = selection.end||0;
    
  }

  get removed () {
    return this._removed;
  }

  removeSelected () {
    this._removed.start = this._selected.start;
    this._removed.end = this._selected.end;
  }

  remove ( start,end ) {
    if (this._removed.start > start) this._removed.start = start;
    if (this._removed.end < end) this._removed.end = end;
  }
}

class Selection {

  constructor ( state = {
    caret: 0,
    selected: 0,
    focusLine: 0,
    anchorLine: 0,
    lines: 0,
    ranges: [],
    maxRange: 0,
    focus: false
  } ) { Object.assign(this, state); }
  
  syncState ( state ) {
    const { ranges, maxRange } = this.getRanges( state );
    const newState = Object.assign( {}, state, { maxRange, ranges } );

    return new Selection( newState );
  }

  getRanges ( state ) {
    let prevRanges = this.ranges.slice(), ranges = [], maxRange;

    const anchorLine = state.anchorLine;
    const focusLine = state.focusLine;

    /*
    Extracts element from array:
    - if array contains index, it removes element from array
    - else removes and returns last element of array
    */

    function extractElement( array, index ) {
      if ( array[index] !== undefined ) {
        return  array.splice( index, 1 )[0];
      } else return array.shift();
    }

    for ( let i = state.lines-1; i >= 0; i-- ) {
      while( !ranges[i] || ranges[i].isRemoved ) {
        if (prevRanges.length <= anchorLine && !prevRanges[i]) 
        { ranges[i] = new Range(i) }
        else ranges[i] = extractElement( prevRanges,i )
      }
    }
    
    for ( let i = anchorLine, l = anchorLine - focusLine; i < anchorLine + l; l > 0 ? l-- : l++ )
    { ranges[i].selected = { start:ranges[i].start,end:ranges[i].end }; }

    if (state.caret > ranges[state.focusLine].end) 
    { ranges[state.focusLine].end = state.caret; }

    ranges[state.focusLine].selected = {
      start:state.caret,
      end:state.selected 
    }

    maxRange = Math.max( ...ranges.map( item => item.size ) );

    //console.log('caret', state.caret, maxRange)

    return { ranges, maxRange };
  }

  getRange ( index ) {
    const range = this.ranges[index];
    const isNewRange = range.isNewRange;

    if (range.isNewRange) {
      range.isNewRange = false;
    }
    
    return { range,isNewRange };
  }

  trimRange ( index, start, end ) {
    this.ranges[index]&&this.ranges[index].remove(start,end)
  }

  getLineIndex ( index ) {
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

  getCharIndex ( line,index ) {
    if (line == -1) return -1;
    const range = this.ranges[line];

    if (range.removed.start < index && range.removed.end >= index) {
      if (range.removed.end < range.end) 
        return (range.removed.end + (index - range.removed.start) )
      return -1;
    }
    return index;
  }
  
  setOld () {
    this.ranges.forEach( range => range.isNewRange = false );
    return this;
  }
}

class Caret {
  constructor ( element ) {
    this.next = element;
    this.prev = element;
  }
  syncState( selection ) {
    console.log( 'sync state caret', selection );

  }
}

class Text {
  constructor ( lines = new List( new Line() ) ) {
    this.lines = lines;
    this.caret = new Caret ( this.lines.head.data.head )
  }
  
  get linesCount () {
    return this.data.length;
  }

  get value () {
    console.log('get value', this.lines);
    return
    let value = this.data.as2DArray()
      .map( string => string
        .map( input => getSymbol( ...Object.values( this.decodeInput( input ) ) ) )
        .join('') )
      .join('<br>')

    return value;
  }

  syncSelection (selection) {
    const caretLine = this.lines.find( selection.focusLine );
    const element = caretLine.find( selection.caret );

    console.log('sync state', selection );

    this.caret = this.caret.syncState( selection );

    return;
  }

  syncData ( code, selection ) {
    const element = new LineSymbol( code );
    this.data.add( selection.caret, element );
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

  put ( data, selection ) {
    let code = this.encodeInput( data.keyCode,data.altKey,data.shiftKey );
    return this.syncData( code, selection );
  }
  break () {
    this.reap();

    return this;
  }
  remove () {
    this.reap();

    this.selection.trimRange( 
      this.selection.focusLine, 
      this.selection.caret - 1, 
      this.selection.caret  )

    if (this.selection.caret !== 0) this.selection.caret-=1
    return this.syncState({selection:this.selection});
  }

  reap () {
    for (let range of this.selection.ranges) {
      range.removeSelected();
    }
  }

  static clear () {
    return new Text();
  }
}

/* CONTROL FUNCTIONS */
function keyup ( state, dispatch ) {}
function keydown ( state, dispatch ) {}
function keyleft ( state, dispatch ) {}
function keyright ( state, dispatch ) {}
function keyescape ( state, dispatch ) {}
function keyhome ( state, dispatch ) {}
function keyend ( state, dispatch ) {}

function keyenter ( state, dispatch ) {
  let text = state.text.break();
  dispatch( { text } );
}
function keybackspace ( state, dispatch ) {
  let text = state.text.remove();
  dispatch( { text } );
}
/* CONTROL FUNCTIONS END */

function handleControl ( state, {event,history}, dispatch ) {
  let controlName = getControlName(event.keyCode);
  try { constrolActions[`key${controlName}`]( state, dispatch ); } 
  catch (e) {}
}

function handleSymbol ( state, {event,history}, dispatch ) {
  let text = state.text.put( event, state.selection );
  if (text) dispatch( { text } );
}

function handleSelection ( state, {event,history}, dispatch ) {
  let selection = state.selection.syncState( event.selection );
  let text = state.text.syncSelection( selection );
  dispatch( { selection } );
}

const constrolActions = { keyup,keydown,keyleft,keyright,keyenter,keybackspace,keyescape,keyhome,keyend };
const inputHandlers = { handleControl, handleSymbol }


class InputTranslator {
  constructor ( provider, startState ) 
  {
    const defaultState = {
      focus: false,
      text: new Text(),
      selection: new Selection(),
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
      return container.appendChild( this.element );
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