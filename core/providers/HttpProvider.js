import BufferProvider from './BufferProvider.js';

/**
 * 
 * Client abstract
 * 
 * **/

class Client {
  constructor () {}

  /**
   * 
   * Send data to server
   * @param {Array} data - data passed to send function, based on HttpProvider Settings
   * @returns {Promise} - response handling (optional)
   * 
   * **/

  send ( data ) { console.log( 'sent', data ) }
}

/**
 * 
 * Provides ability to send buffer data over http or something else;
 * Requires Client module passed as constructor property; Client must be type of Client;
 * 
 * **/

export default class HttpProvider extends BufferProvider {
  constructor ( options ) 
  {
    const availableModes = [ 'every', 'interval', 'trigger' ];
    
    this.options = {
      key: options.key||"html-provider",
      mode: options.mode||"every",
      client: options.client||new Client()
    }

    options = Object.assign( {}, this.options, options );

    super( options );

    const scope = this;

    if ( options.mode = 'every' ) {
      scope.handleBufferChange = function (state, buffer) {
      }
    }
  }
}