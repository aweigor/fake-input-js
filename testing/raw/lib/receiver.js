let instance;

const _keyupEvent = {
  type: 'keyup'
}

const _keydownEvent = {
  type: 'keydown'
}

class InputReceiver {

  constructor ( element, provider ) 
  {
    this.element = element||document;
    this.provider = provider;

    this.dispose = function () {
      scope.element.removeEventListener( 'keydown', handleKeydown );
      scope.element.removeEventListener( 'keyup', handleKeyup );
    }

    const scope = this;

    function handleKeydown ( event ) {
      event.preventDefault();
      event.stopPropagation();
      scope.provider.dispatchEvent( _keydownEvent );
    }

    function handleKeyup ( event ) {
      event.preventDefault();
      event.stopPropagation();
      scope.provider.dispatchEvent( _keyupEvent );
    }

    scope.element.addEventListener( 'keydown', handleKeydown );
    scope.element.addEventListener( 'keyup', handleKeyup );
  };

  

  static initialize ( element, provider ) 
  {
    if (instance) instance.dispose();

    instance = new InputReceiver( element, provider );

    return instance;
  }

}

export { InputReceiver }
