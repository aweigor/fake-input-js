import { BufferProvider } from '../index.js';

const availableModes = [ 'every', 'interval', 'trigger' ]
const defaultClientOptions = {
  method: 'POST',
  baseUrl: '',
}

class HttpClient {
  constructor (options) {
    this._options = options;
  }

  query (url = '', data = {}) {
    const options = this._options;
    const params = {
      body: JSON.stringify(data)
    }

    return new Promise ( (resolve, reject) => {
      fetch(url, Object.assign( {},params,options  )).then( res => {
        if (res.status == 200) {
          response.json().then( data => resolve(data) )
        } else {
          reject (res.status);
        }
      } );
    } )
  }
}

export default class HttpProvider extends BufferProvider {
  constructor ( options ) {
    options = options||{};
    options.key = options.key||"html-provider";
    options.mode = options.mode||'every'
    options.client = options.client||defaultClientOptions;

    super( options );

    this.client = new HttpClient( options.client );

    const scope = this;

    if ( options.mode = 'every' ) {
      scope.handleBufferChange = function (state, buffer) {
        console.log( 'change handled' )
      }
    }
  }

  
}