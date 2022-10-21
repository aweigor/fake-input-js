export default class BasicProvider {
  constructor ( options ) {
    options = options||{};

    this.name = options.key||"basic-provider";

    this.onKeyDown = options.onKeyDown||( (e) => { console.log('keydown',e.target) } ),
    this.onKeyUp = options.onKeyUp||( (e) => { console.log('keyup',e.target) } )

    this.handleInput = function ( event ) {
      if ( event.type === 'keyup' ) {
        scope.onKeyUp( event.originalEvent );
      }
      if ( event.type = 'keydown' ) {
        scope.onKeyDown( event.originalEvent );
      }
    }

    const scope = this;
  }

  

  

}