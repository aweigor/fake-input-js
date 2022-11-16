import BasicProvider from './BasicProvider.js';

const stateTemplate = {
  type: String,
  altKey: Boolean,
  ctrlKey: Boolean,
  metaKey: Boolean,
  shiftKey: Boolean,
  keyCode: Number
}

class Buffer {
  constructor ( options, callback ) {
    options = options||{};
    options.maxSize = options.maxSize||10;
    options.onChange = options.onChange||function(){};

    const startState = options.customState||stateTemplate;

    this.options = options;
    this.state = Object.assign( Object.create(null), startState );
    this.state.timestamp = Date.now();
    this.history = new Array(options.maxSize);
    
    this.syncState = function (state) {
      
      Object.keys( scope.state ).forEach( k => {
        if (state[k] !== undefined) this.state[k] = state[k];
      } );
      scope.state.timestamp = Date.now();
      const {history} = pushHistory( scope.state );
      options.onChange(scope.state,history);
      callback(scope.state,history);
    }
  
    const scope = this;

    function pushHistory ( state ) {
      scope.history.push(state);
      return {
        escaped: scope.history.shift(),
        history: scope.history
      }
    }

    Object.seal(this.state)
  }
}

export default class BufferProvider extends BasicProvider {
  constructor ( options, dispatch = () => {} ) {
    options = options||{};
    options.key = options.key||"buffer-provider";

    super( options );

    this._buffer = new Buffer( options.buffer, dispatch)

    this.onKeyDown = function ( event ) {
      scope._buffer.syncState( event );
    }
  
    this.onKeyUp = function ( event ) {
      //scope._buffer.syncState( event );
    }

    this.getRecordsByInterval = function ( timeStart, timeFinish ) {
      return scope._buffer.filter( state => {
        return state&&state.timestamp>=timestart&&state.timestamp<timeFinish;
      } )
    }

    this.getLastRecord = function () {
      return scope._buffer.state;
    }

    this.getAllRecords = function () {
      return scope._buffer.filter( state => state );
    }

    this.handleBufferChange = function (state, buffer) {}

    const scope = this;
  }
}