import EventDispatcher from './dispatcher.js';

let instance;

const _keyupEvent = {
  type: 'keyup',
  originalEvent: null
}

const _keydownEvent = {
  type: 'keydown',
  originalEvent: null
}

const validateOptions = ( options ) => {
  if (options.onKeyDown && !(options.onKeyDown instanceof Function )) return false;
  if (options.onKeyUp && !(options.onKeyUp instanceof Function )) return false;
  if (options.preventDefault && !(options.preventDefault instanceof Boolean)) return false;
  if (options.stopPropagation && !(options.stopPropagation instanceof Boolean)) return false;
  return true;
}

export default class InputManager extends EventDispatcher {

  constructor ( element, options ) 
  {
    super();

    options = options||{};

    class InvalidOptionsError extends Error {};
    if (!validateOptions(options)) throw new InvalidOptionsError;

    this.element = element||document;
    this.settings = {
      preventDefault: options.preventDefault||true,
      stopPropagation: options.stopPropagation||true,
      onKeyDown: options.onKeyDown||( (e) => { console.log('keydown',e) } ),
      onKeyUp: options.onKeyUp||( (e) => { console.log('keyup',e) } )
    }

    this.dispose = function () {
      scope.element.removeEventListener( 'keydown', handleKeydown );
      scope.element.removeEventListener( 'keyup', handleKeyup );

      scope.removeEventListener( 'keydown', this.settings.onKeyDown );
      scope.removeEventListener( 'keyup', this.settings.onKeyUp );
    }

    const scope = this;

    function handleKeydown ( event ) {

      if (scope.settings.preventDefault)
        event.preventDefault();

      if (scope.settings.stopPropagation)
        event.stopPropagation();
      
      _keydownEvent.originalEvent = event;
      
      scope.dispatchEvent( _keydownEvent );
    }

    function handleKeyup ( event ) {

      if (scope.settings.preventDefault)
        event.preventDefault();

      if (scope.settings.stopPropagation)
        event.stopPropagation();

      _keyupEvent.originalEvent = event;
      
      scope.dispatchEvent( _keyupEvent );
    }

    scope.element.addEventListener( 'keydown', handleKeydown );
    scope.element.addEventListener( 'keyup', handleKeyup );

    scope.addEventListener( 'keydown', this.settings.onKeyDown );
    scope.addEventListener( 'keyup', this.settings.onKeyUp );

  };

  static initialize ( element, provider ) 
  {
    if (instance) instance.dispose();

    instance = new InputManager( element, provider );

    return instance;
  }

}