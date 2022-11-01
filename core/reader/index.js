import { getSymbol, defineType, getSpecialKey } from './format.js';

class InputReader {
  constructor (state = '', options = {}) {
    const defaultOptions = {
      locale: 'en',
      keyboard_type: 'ancii'
    }

    this.options = Object.assign( {}, defaultOptions, options )

    this.state = state;

    this.commit = function (message) {
      if (message instanceof Array) return message.forEach( event => scope.commit(event) )
      if (!(message instanceof Object)) return;
      const messageType = defineType(message.keyCode);

      const newState = this.state.split('');
      if (messageType == 'symbol') {
        let symbol = getSymbol(
          message.keyCode, 
          message.altKey, 
          message.shiftKey, 
          options.locale);
        newState.push(symbol);
      } else if (messageType == 'special') {
        const key = getSpecialKey(message.keyCode);
        switch(key) {
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

    this.clear = function () {
      this.state = state;
    }

    const scope = this

    function setOption (option, value) {
      
    }
  }

  
}

export { InputReader };