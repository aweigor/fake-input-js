import BasicProvider from './BasicProvider.js';

class BufferState {
  constructor ( state ) {
    this.value = state;
  }

  static init () {
    const Interface = {
      type: String(),
      altKey: Boolean(),
      ctrlKey: Boolean(),
      metaKey: Boolean(),
      shiftKey: Boolean(),
      keyCode: Number(),
      timestamp: Number(),
      selection: {
        caret: Number(),
        selected: Number(),
        line: Number(),
        lines: Number(),
        text: String(),
        focus: Boolean()
      }
    }
    Object.seal( Interface );
    return new BufferState(Interface);
  }

  update ( newState ) {
    function mergeState ( target, source ) {
      for (let key of Object.keys(target)) {
        if ( source[key] !== undefined && typeof (source[key]) == typeof(target[key]) ) {
          if ( target[key] instanceof Object ) {
            mergeState( target[key], source[key] );
          } else {
            target[key] = source[key];
          }
        }
      }
      return target
    }

    return new BufferState( mergeState( this.value, newState ) );
  }
}

class Buffer {
  constructor ( options, callback ) {
    options = options||{};
    options.maxSize = options.maxSize||10;
    options.onChange = options.onChange||function(){};

    this.options = options;
    this.state = BufferState.init();
    this.state.timestamp = Date.now();
    this.history = new Array(options.maxSize);
    
    this.syncState = function (state) {
      scope.state = scope.state.update(state);
      scope.state.value.timestamp = Date.now();
      const {history} = pushHistory( scope.state );
      options.onChange(scope.state,history);
      callback(scope.state.value,history);
    }
  
    const scope = this;

    function pushHistory ( state ) {
      scope.history.push(state);
      return {
        escaped: scope.history.shift(),
        history: scope.history
      }
    }

    Object.seal(this.state);
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