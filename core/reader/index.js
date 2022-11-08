import { getSymbol, defineType, getSpecialKey } from './format.js';

class Text {
  constructor ( maxSize, startValue = '' ) {
    this.maxSize = maxSize||Infinity;
    this.string = startValue.split('');
  }
  get () {
    return this.string.join('');
  }
  put (index,value) {
    let copy = this.string.slice();
    let frontSlice = copy.slice(index,0);
    let backSlice = copy.slice(0,index);
    this.string = [...frontSlice,value,backSlice];
  }
  delete (index,amount=1) {
    this.string = this.string.splive(index,amount);
  }
}

class InputReader {
  constructor (state = {}, options = {}) 
  {
    const defaultOptions = {
      locale: 'en',
      keyboard_type: 'ancii'
    }
    const startState = {
      carret: 0,
      value: ''
    }

    this.options = Object.assign( {}, defaultOptions, options )
    this.state = Object.assign( {}, startState, state );

    

    this.commit = function ( message, dispatch ) {
      if (message instanceof Array) return message.forEach( event => scope.commit(event) )
      if (!(message instanceof Object)) return;
      const messageType = defineType(message.keyCode);

      const newState = {value: this.state.split('')};
      if (messageType == 'symbol') {
        let symbol = getSymbol(
          message.keyCode, 
          message.altKey, 
          message.shiftKey, 
          options.locale);
        newState.push(symbol);
      } else if (messageType == 'special') {
        const key = getSpecialKey(message.keyCode);
        newState.value = handleControlCharacter( key, newState.value );
      }

      return dispatch( newState );
    }

    this.clear = function () {
    }

    const scope = this;

    function setOption (option, value) {
      
    }

    function handleControlCharacter ( charCode, state ) {
      if (!currentData.length) return;

      let res = currentData.slice();

      switch(charCode) {
        case 'arrowup': {

          break;
        }
        case 'arrowdown': {
          break;
        }
        case 'arrowleft': {
          break;
        }
        case 'arrowup': {
          break;
        }
        default: break;
      }
    }
  }

  
}

export { InputReader };