import BufferProvider from './BufferProvider.js';

class Input {
  constructor ( options = {} ) {
    this._el = document.createElement('div');
    this._container = null;
    this.state = {
      value: ''
    }

    this._el.setAttribute('contenteditable',true);
    this._el.setAttribute('tabIndex',0);

    this._el.addEventListener( 'input', (e) => {
      //console.log( 'input event', e );
    } )

    this.indexOf = function( elt ) {
      const children = Array.from(scope._el.children);
      //console.log('children', children)
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
  syncState ( state ) {
    //this._el.textContent += state.key;
  }
}

export default class HtmlProvider extends BufferProvider {
  constructor ( options = {} ) {
    options.key = options.key||"html-provider";

    super( options );

    this.input = new Input();

    const selection = window.getSelection();
    const range = document.createRange();

    range.setStart(this.input._el, 0);
    range.setEnd(this.input._el, 0);
    selection.addRange(range);


    //selection.collapseToStart();

    this.onKeyDown = function ( event ) {
      //let nd = selection.anchorNode, text = nd.textContent.slice(0, selection.focusOffset);
      //let line=text.split("\n").length;
      //console.log('text',scope.input._el.innerText,selection)
      //const line = scope.input._el.children.indexOf( selection.focusNode );
      //console.log( 'line', scope.input.indexOf( selection.focusNode.parentElement ) )
      //console.log('line',line);
      //console.log( "event provided", selection.anchorOffset, selection.baseOffset, selection.extentOffset, selection.focusOffset, selection.rangeCount, selection );
      //selection.moveStart('character', -oField.value.length);
      //scope._input.syncState( event );
      scope._buffer.syncState( event );
    }
  
    this.onKeyUp = function ( event ) {
    }

    this.mountInput = function (container) {
      if (container instanceof HTMLElement) 
        return container.appendChild(this.input._el);
      if (typeof(container) == 'string')
        if (container = container.replace('#','')) {
          container = document.getElementById( container );
          if (container) return container.appendChild(this.input._el);
        }
    }

    const scope = this;
  }
}