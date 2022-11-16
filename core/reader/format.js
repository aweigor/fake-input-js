import ANCII_codemap from "./keyboards/ancii/codemap.json" assert {type: 'json'};
import ANCII_locales from "./keyboards/ancii/locales.json" assert {type: 'json'};
import ANCII_arrowsmap from "./keyboards/ancii/special.json" assert {type: 'json'};

/**
 * 
 * 
 * 
 *
 * 
 * 
 * 
 * 
 * **/

const defineType = function ( code ) {
  if (!code||isNaN(code)) return;
  if (ANCII_codemap.includes(code)) return 'symbol';
  if (Object.values(ANCII_arrowsmap).includes(code)) return 'control';
}


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

  return result;
}

const getControlName = function ( code ) {
  if (Object.keys(ANCII_arrowsmap).includes(code)) return ANCII_arrowsmap[code];
  return;
}

const codes = [ 81, 87, 69, 82, 84, 89 ];

for ( let code of codes ) {
  console.log ( getSymbol( code ) )
}

export { getSymbol, defineType, getControlName }