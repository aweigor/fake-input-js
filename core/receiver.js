function InputReceiver( options ) {
  console.log( this )
}

InputReceiver.prototype.constructor = InputReceiver;

export { InputReceiver }
