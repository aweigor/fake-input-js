const ANCII_codemap = require("./keyboards/ancii/codemap.json");
const ANCII_locales = require("./keyboards/ancii/locales.json");

/*
* 
* Returns symbol of corresponding code and selected locale
* Yet only ancii available
*
* @param code - Javascript keydown event code
* @param altKey - If alt key pressed
* @param shiftKey - If shift key pressed
*
*/

const getSymbol = function ( code = 65, altKey = false, shiftKey = false, locale = 'en' ) 
{
  let result;

  const keyCodes = ANCII_locales[ locale ];
  const keyIndex = ANCII_codemap.indexOf( code );

  if ( !keyCodes || isNaN(keyIndex) ) return;

  if ( altKey === false && shiftKey === false ) {
    result = keyCodes['default'][ keyIndex ];
  } else if ( altKey === true ) {
    result = keyCodes['alt'][ keyIndex ];
  } else if ( shiftKey === true ) {
    result = keyCodes['shift'][ keyIndex ];
  }

  return result
}

const codes = [ 81, 87, 69, 82, 84, 89 ];

for ( let code of codes ) {
  console.log ( getSymbol( code ) )
}