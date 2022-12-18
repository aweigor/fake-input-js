import BufferProvider from './BufferProvider.js';

class Input {
  constructor ( options = {} ) {
    this._el = document.createElement('div');
    this._container = null;
    this.state = {
      value: ''
    }

    this._el.setAttribute('contenteditable', true );
    this._el.setAttribute('tabIndex', 0 );
    this._el.addEventListener( 'input', (_) => {} );

    this.indexOf = function( elt ) {
      const children = Array.from( scope._el.children );
      return children.indexOf( elt );
    }

    const scope = this;
  }
  mount( containerID ) {
    let container = document.getElementById(containerID);
    if (!container) return;
    this._container = container;
    this._container.appendChild(this._el);
  }
  syncState ( state ) {}
}

export default class HtmlProvider extends BufferProvider {
  constructor ( options = {} ) {
    options.key = options.key||"html-provider";

    super( options, dispatch );

    this.input = new Input();

    const eventListeners = {};
    const selection = window.getSelection();
    const range = document.createRange();

    range.setStart( this.input._el, 0 );
    range.setEnd( this.input._el, 0 );
    selection.addRange(range);

    this.addEventListener = function ( type, handler ) {
      if (!eventListeners[type])
        eventListeners[type] = [];
      eventListeners[type].push(handler);
    }

    this.removeEventListener = function ( type, handler ) {
      if (!eventListeners[type]) return;
      let delID = eventListeners[type].indexOf(handler);
      if (delID !== -1) eventListeners[type].splice(delID, 1);
    }

    this.mountInput = function (container) {
      if (container instanceof HTMLElement) 
        return container.appendChild(this.input._el);
      if (typeof(container) == 'string') {
        if (container = container.replace('#','')) {
          container = document.getElementById( container );
          if (container) return container.appendChild(this.input._el);
        }
      }
    }

    const scope = this;

    function getFocusLine (input,selection) {
      let index = input.indexOf( selection.focusNode.parentElement ) !== -1 
        ? input.indexOf( selection.focusNode.parentElement ) 
        : input.indexOf( selection.focusNode );
      return index + 1;
    }

    function getAnchorLine (input,selection) {
      let index = input.indexOf( selection.anchorNode.parentElement ) !== -1 
        ? input.indexOf( selection.anchorNode.parentElement ) 
        : input.indexOf( selection.anchorNode );
      return index + 1;
    }

    function isDescendant (parent, child) {
      let node = child;

      while( node ) {
        if (node == parent) return true;
        node = node.parentNode;
      }

      return false;
    }

    function dispatch ( event,buffer ) {
      const history = buffer.filter( e => e.type == event.type );
      if (!eventListeners[event.type]) return;
      eventListeners[event.type].forEach( h => h.call( scope, {event,history} ) );
    }

    function handleSelectionChange () {

      const event = { type:'selection' };
      
      if (!isDescendant(scope.input._el, selection.focusNode)) {
        return scope._buffer.syncState( 
          Object.assign( {}, event, { selection:{ focus:false } } ) )
      };
      
      let paragraphs = scope.input._el.innerText.split('\n\n');

      event.selection = {
        focusOffset: selection.focusOffset,
        anchorOffset: selection.anchorOffset,
        focusLine: getFocusLine(scope.input, selection),
        anchorLine: getAnchorLine(scope.input, selection),
        lines: paragraphs.reduce( ( acc, el ) => 
          el.split('\n').length + acc, 0 ),
        text: scope.input._el.innerText,
        focus: true
      }

      scope._buffer.syncState( event );
    }

    document.addEventListener( 'selectionchange', handleSelectionChange )
  }
}