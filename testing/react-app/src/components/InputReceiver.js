import { useContext } from 'react';
import { RecorderContext } from './InputRecorder';

import '../App.css'

const InputReceiver = () => {
  const { text } = useContext( RecorderContext );
  return ( 
    <>
      <div className="receiver-container">
        { text }
      </div>
    </>
  )
}

export { InputReceiver }