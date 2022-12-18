/*
ver. 2.0
*/
import { getSymbol, defineType, getControlName } from './format.js';

class ListItem {
  constructor ( data = null, { next } = {} ) {
    Object.assign(this, { data, next });
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

  remove ( begin, end ) {
    console.log('remove',begin, end)
    let prev = this.find(begin);
    let next = this.find(end);
    if (prev && next) prev.next = next.next;
  }

  find (index) {
    let i = 0, result;

    for ( let element of this ) {
      if ( i == index ) {
        result = element;
        break;
      }
      i++;
    }

    return result;
  }

  [Symbol.iterator]() {
    let data  = this.head, value;
    return {
      next: () => {
        value = data;
        data = data&&data.next;
        return ({ value, done: value == undefined });
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
    this.data.head = new LineSymbol( 0 );
  }
}

class Selection {

  constructor ( state = {
    focusOffset: 0,
    anchorOffset: 0,
    focusLine: 0,
    anchorLine: 0,
    lines: 0,
    focus: false
  } ) { Object.assign(this, state); }
  
  syncState ( state ) {
    const newState = Object.assign( {}, state );
    return new Selection( newState );
  }
}

class Caret {
  constructor ( { nextLine, nextOffset, prevLine, prevOffset, focus_orient_forward } = {} ) {
    Object.assign( this, { nextLine, nextOffset, prevLine, prevOffset, focus_orient_forward } );
  }

  get prev () {
    return this.prevLine && this.prevLine.data.find( this.prevOffset );
  }

  get next () {
    return this.nextLine && this.nextLine.data.find( this.nextOffset );
  }

  syncState( selection, lines ) {
    // orientation : a. focus ahead b. anchor ahead
    const focus_orient_forward =  selection.anchorLine - selection.focusLine <= 0 
      && selection.anchorOffset - selection.focusOffset <= 0;

    let prevPos = {
      line: focus_orient_forward ? selection.anchorLine : selection.focusLine,
      offset: focus_orient_forward ? selection.anchorOffset - 1 : selection.focusOffset - 1
    }

    let nextPos = {
      line: focus_orient_forward ? selection.focusLine : selection.anchorLine,
      offset: focus_orient_forward ? selection.focusOffset : selection.anchorOffset
    }

    let prevLine = lines.find(prevPos.line);
    let nextLine = lines.find(nextPos.line);

    return new Caret( { 
      nextLine, nextOffset:nextPos.offset, 
      prevLine, prevOffset:prevPos.offset,
      focus_orient_forward
    } );
  }
}

class Text {
  constructor ( lines = new List( new Line() ) ) {
    this.lines = lines;
    this.caret = new Caret ( {nextLine:this.lines.head,nextOffset:0} )
  }
  
  get linesCount () {
    return this.data.length;
  }

  get value () { 

    let text = '';

    for ( let line of this.lines ) {

      text += '<br>'

      for ( let lineSymbol of line.data ) {
        if (lineSymbol.data !== 0) {
          text += getSymbol( ...Object.values( 
            this.decodeInput( lineSymbol.data ) ) ) 
        } 
      }
    }

    return text;
  }

  syncSelection (selection) {
    this.caret = this.caret.syncState( selection, this.lines );
    return;
  }

  syncData ( code, selection ) {
    if (!this.caret.next) return; // todo: exeption

    const element = new LineSymbol( code );
    element.next = this.caret.next;

    if (this.caret.prevLine && this.caret.prevLine !== this.caret.nextLine){
      this.caret.prevLine.next = this.caret.nextLine;
    }
      
    if (this.caret.prev) {
      this.caret.prev.next = element;
    }
      
    if ( this.caret.nextLine && this.caret.nextOffset == 0 ) {
      this.caret.nextLine.data.head = element;
    }
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
    this.syncData( 0 );
    let prevLine = this.caret.focus_orient_forward 
    ? this.caret.nextLine : this.caret.prevLine;
    if ( prevLine ) {
      let newLine = new Line(); 
      newLine.next = prevLine.next;
      prevLine.next = newLine;
    }
    return this;
  }
  remove () {
    if (this.caret.prevLine && this.caret.prevLine !== this.caret.nextLine){
      this.caret.prevLine.next = this.caret.nextLine;
    }
    if (this.caret.prev && this.caret.prev !== this.caret.next ) {
      this.caret.prev.next = this.caret.next;
    }
    this.caret.nextLine.data.remove( --this.caret.nextOffset-1,this.caret.nextOffset )
    return this;
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