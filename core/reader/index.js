/*
ver. 2.0
*/
import { getSymbol, defineType, getControlName } from './format.js';

class ListItem {
  constructor ( data = null, { next, prev } = {} ) {
    Object.assign(this, { data, next, prev });
  }
}

class List {
  constructor ( element = null ) {
    this.head = element;
    this.tail = element;
  }

  insertAfter ( item, index ) {
    if ( index == -1 ) {

      this.head.prev = item;
      item.next = this.head;
      this.head = item;

    } else if ( index == 0 ) {

      if ( this.head == this.tail ) {

        this.tail = item;
        item.next = null;

      } else if ( this.head.next ) {

        this.head.next.prev = item;
        item.next = this.head.next;

      }

      item.prev = this.head;
      this.head.next = item;

    } else if ( index > 0 ) {

      let current = this.find( index );

      if ( !current ) return;
         
      if ( current.next ) {

        item.next = current.next;
        current.next.prev = item;

      } else {

        item.next = null;
        this.tail - item;

      }

      current.next = item;
      item.prev = current;
      
    }
  }

  insertBefore ( item, index ) {
    if ( index == 0 ) {
      
      this.head.prev = item;
      item.next = this.head;
      item.prev = null;
      this.head = item;

    } else if ( index > 0 ) {

      let prev = this.findPrev( index );
      if ( prev ) {
        prev.next.prev = item;
        item.next = prev.next;
        prev.next = item;
      }
    }
  }

  find ( index ) {
    let i = 0, item, res = null;

    for ( item of this ) {
      if ( i++ == index ) {
        res = item;
        break;
      }
    }

    return res;
  }

  findNext ( index ) {
    let i = 0, item, res = null;
    for ( item of this ) {
      if ( i++ == index ) {
        res = item.next;
        break;
      }
    }
    return res;
  }

  findPrev ( index ) {
    let i = 0, prev, res = null;
    for ( let item of this ) {
      if ( i++ == index ) {
        res = prev;
        break;
      }
      prev = item;
    }
    return res;
  }

  remove ( index ) {
    let element = this.find( index );
    
    if ( element ) {

      if ( !element.prev && !element.next ) return;

      if ( element.prev && element.next ) {

        element.next.prev = element.prev;
        element.prev.next = element.next;

      } else if ( element.prev ) {

        element.prev.next = null;

      } else if ( element.next ) {

        element.next.prev = null;

      }

      if ( this.tail == element ) {
        this.tail = element.prev || null;
      }

      if ( this.head == element ) {
        this.head = element.next || null;
      }
    }
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
    this.data.tail = this.data.head;
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
  constructor ( { nextLine, nextOffset, nextLineOffset, prevLine, prevOffset, prevLineOffset, focus_orient_forward } = {} ) {
    Object.assign( this, { nextLine, nextOffset, nextLineOffset, prevLine, prevOffset, prevLineOffset, focus_orient_forward } );
  }

  get prev () {
    return this.prevLine && this.prevLine.data.find( this.prevOffset );
  }

  get next () {
    return this.nextLine && this.nextLine.data.find( this.nextOffset );
  }

  syncState( selection, lines ) {
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
      nextLine, nextOffset:nextPos.offset, nextLineOffset:nextPos.line,
      prevLine, prevOffset:prevPos.offset, prevLineOffset:prevPos.line,
      focus_orient_forward
    } );
  }
}

class Text {
  constructor ( lines = new List( new Line() ), caret ) {
    this.lines = lines;
    this.caret = caret || new Caret ( { nextLine:this.lines.head,nextOffset:0,nextLineOffset:0 } );
  }
  
  get linesCount () {
    return this.data.length;
  }

  get value () { 

    let text = '';
    for ( let line of this.lines ) {

      text += '<br>';

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

  resolveSelection () {

    if (this.caret.prev && this.caret.prev !== this.caret.next ) {

      this.caret.next.prev = this.caret.prev;
      this.caret.prev.next = this.caret.next;

    } else if ( !this.caret.prev && this.caret.next.prev ) {

      this.caret.next.prev = null;
      this.caret.prevLine.data.head = this.caret.next;

    }

    this.caret.nextOffset = this.caret.prevOffset + 1;

    if (this.caret.prevLine && this.caret.prevLine !== this.caret.nextLine) {

      this.caret.prevLine.next = this.caret.nextLine.next; 
      this.caret.nextLine.next.prev = this.caret.prevLine; 
      this.caret.nextLine = this.caret.prevLine;

    };
  }

  encodeInput ( keyCode, altKey, shiftKey ) {
    return parseInt( `${keyCode}${ + altKey }${ + shiftKey }` );
  }

  decodeInput ( value ) {
    let a = Array.from( String(value), (num) => Number(num) );

    return {
      keyCode: Number(a.slice(0,-2).join('')),
      altKey: !!a[a.length - 1],
      shiftKey: !!a[a.length - 2]
    }
  }

  put ( data ) {
    this.resolveSelection();

    const code = this.encodeInput( data.keyCode,data.altKey,data.shiftKey );
    const element = new LineSymbol( code );

    this.caret.prevLine.data.insertAfter( element, this.caret.prevOffset );
  }

  break () {
    this.resolveSelection();

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
    if ( this.caret.prev && this.caret.prev.next == this.caret.next ) {
      if ( this.caret.prevOffset !== undefined && this.caret.prevOffset !== -1 ) {
        this.caret.prevLine.data.remove( this.caret.prevOffset-- ) 
        this.caret.nextOffset = this.caret.prevOffset + 1;
      }
    } else {
      this.resolveSelection();
    }

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
  catch (e) {console.error(e)}
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
const inputHandlers = { handleControl, handleSymbol };

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