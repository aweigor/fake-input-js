import EventDispatcher from './dispatcher.js';
import { BasicProvider } from './providers/index.js';

let instance;

const _keyupEvent = {
  type: 'keyup'
}

const _keydownEvent = {
  type: 'keydown'
}

export default class InputManager extends EventDispatcher {

  constructor ( element, options ) 
  {
    super();

    options = options||{};

    this.element = element||document;
    this.settings = {
      preventDefault: options.preventDefault||true,
      stopPropagation: options.stopPropagation||true,
    }

    this.dispose = function () {
      scope.element.removeEventListener( 'keydown', handleKeydown );
      scope.element.removeEventListener( 'keyup', handleKeyup );

      if ( this._providers ) {
        const keys = this._providers.map( p => p.key );
        keys.forEach( providerKey => {
          this.abandon( providerKey );
        } )
      }

      instance = null;
    }

    this.use = function ( provider ) {
      class InvalidProviderInterface extends Error {};
      if (!provider instanceof BasicProvider) throw new InvalidProviderInterface;

      if ( this._providers === undefined ) this._providers = [];

      const providers = this._providers;

      if ( providers.indexOf( provider ) === -1 ) {
        providers.push( provider );
      }

      scope.addEventListener( 'keydown', provider.handleInput );
      scope.addEventListener( 'keyup', provider.handleInput );
    }

    this.abandon = function ( providerKey ) {
      if ( this._providers === undefined ) return;

      const providers = this._providers;
      const index = providers.findIndex( (p) => p.key === providerKey );

      if ( index !== -1 ) {
        
        scope.removeEventListener( 'keydown', providers[index].handleInput );
        scope.removeEventListener( 'keyup', providers[index].handleInput );
        providers.splice( index, 1 );

      }
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

  };

  static initialize ( element, options ) 
  {
    if (instance) instance.dispose();

    instance = new InputManager( element, options );

    return instance;
  }

}