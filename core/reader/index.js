import { getSymbol, defineType, getSpecialKey } from './format.js';

/*

possible features:
line-width -> lines detection

*/

class Text {
  constructor ( startValue = '', maxSize = Infinity ) {
    this.maxSize = maxSize;
    this.value = startValue.split('');
  }
  get length () {
    return this.value.length;
  }
  get () {
    return this.value.join('');
  }
  put (index,value) {
    let copy = this.value.slice();
    let frontSlice = copy.slice(index,0);
    let backSlice = copy.slice(0,index);
    this.value = [...frontSlice,value,backSlice];
  }
  delete (index,amount=1) {
    this.value = this.string.splice(index,amount);
  }
  static clear () {
    return new Text('');
  }
}

function keyup ( state, dispatch ) {
  dispatch( {cursor: 0} );
}

function keydown ( state, dispatch ) {
  dispatch( {cursor: state.text.length - 1} )
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

function keyenter ( state, dispatch ) {}

function keybackspace ( state, dispatch ) {

}

function keyescape ( state, dispatch ) {}

function keyhome ( state, dispatch ) {}

function keyend ( state, dispatch ) {}



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
  dispatch( {text:state.text.push(symbol)} );
}


const constrolActions = { keyup,keydown,keyleft,keyright,keyenter,keybackspace,keyescape,keyhome,keyend };
const inputHandlers = { handleControl, handleSymbol }

function updateState ( state, action ) {
  return Object.assign( {}, state, action );
}


class InputReader {
  constructor (state = {}, options = {}) 
  {
    const defaultOptions = {
      locale: 'en',
      keyboard_type: 'ancii'
    }
    const startState = {
      cursor: 0,
      text: new Text('')
    }

    this.options = Object.assign( {}, defaultOptions, options )
    this.state = Object.assign( {}, startState, state );

    this.syncState = function (state) {
      this.state = state;
    }

    function dispatch ( action ) {
      let state = updateState( this.state, action );
      this.syncState( state );
    }
    

    this.read = function ( input ) {
      if (input instanceof Array) {
        for (let event of input) {
          scope.read(event); }
        return;
      }

      try {
        let inputType = defineType(input.keyCode);
        inputHandlers[`handle${inputType}`].call( scope.state, input, dispatch )
      } catch (e) {}
    }

    const scope = this;
  }
}

export { InputReader };