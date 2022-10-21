import BasicProvider from './basic-provider.js';

export default class HtmlProvider extends BasicProvider {
  constructor ( options ) {
    options = options||{};
    options.key = options.key||"html-provider";

    super( options );

    this.onKeyDown = function ( event ) {
      console.log( "event provided", event );
    }
  
    this.onKeyUp = function ( event ) {
      console.log( "event provided", event );
    }

    const scope = this;
  }

  
}