import { useEffect, useState, createContext } from "react";

const RecorderContext = createContext();

const Controls = ( { updateRecordingState,updatePlayingState,recordDuration,playbackTime,isRecording,isPlaying,reset } ) => {
  return (
    <>
      <div className="recording-controls">
        <button onKeyDown={ (e) => { e.preventDefault() } } onClick={ () => updateRecordingState(!isRecording) }> { isRecording?'Stop':'Start' } recording</button>
        <div>
          Record duration: { recordDuration }
        </div>
      </div>

      <div className="playback-controls">
        <button onKeyDown={ (e) => { e.preventDefault() } } onClick={ () => updatePlayingState(!isPlaying) }> { isPlaying?'Pause':'Play' }</button>
        <div>
          Playback time: { playbackTime }
        </div>
      </div>

      <button onKeyDown={ (e) => { e.preventDefault() } } onClick={ () => reset() }>Reset</button>
    </>
  )
}

const InputRecorder = function ( { children, bypassRecording = false } ) 
{
  const [input,updateInput] = useState( [] );
  const clearInput = () => updateInput( [] );

  const [text,setText] = useState( '' );
  const clearText = () => setText( [] );

  const [isRecording, setIsRecording] = useState( false );
  const updateRecordingState = ( state ) => setIsRecording( state );

  const [isPlaying, setIsPlaying] = useState( false );
  const updatePlayingState = ( state ) => setIsPlaying( state );

  const initialRecordState = {
    duration: 0,
    currentTimestamp: 0,
    initialTimestamp: null
  }
  const [recordState, setRecordState] = useState( initialRecordState ) 
  const resetRecordState = () => setRecordState( initialRecordState )
  
  
  const resetAll = () => {
    resetRecordState();
    clearInput();
    clearText();
    setIsRecording(false);
    setIsPlaying(false);
  }

  let recTimerID, playTimerID;

  const keyboardListener = (e) => 
  {  
    const data = 
    {
      timestamp: Date.now(),
      key: e.key,
      keyCode: e.keyCode
    }

    updateInput(inputState => [...inputState, JSON.stringify( data )] );
  }

  useEffect( () => 
  {
    if ( !bypassRecording ) return;

    document.addEventListener( 'keydown', keyboardListener );

    return () => {
      document.removeEventListener( 'keydown', keyboardListener );
      clearInput();
      resetRecordState();
    }
  }, [])

  useEffect( () => 
  {
    if (bypassRecording) {

      setText( input.map ( data => 
        {
          const obj = JSON.parse( data );
          if( obj.key ) return obj.key;
          return ''
        } )
        .join('') 
      )

    }
  }, [input])

  useEffect( () => 
  {
    if (isRecording) {
      document.addEventListener( 'keydown', keyboardListener );

      resetRecordState();

      setRecordState( currentState => ({
        ...currentState,
        ['initialTimestamp']: Date.now()
      }) )

      const updateRecordState = () => {
        setRecordState( currentState => ({
          ...currentState,
          ['duration']: ( Date.now() - currentState.initialTimestamp )
        }) )
      }

      recTimerID = setInterval(
        () => updateRecordState(),
        100
      )
    } else {
      document.removeEventListener( 'keydown', keyboardListener );
      clearInterval( recTimerID )
    }

    return () => {
      document.removeEventListener( 'keydown', keyboardListener );
      clearInterval( recTimerID );
    }
    
  }, [isRecording] )

  useEffect( () => 
  {
    const INTERVAL_DURATION = 100;
    const updateRecordState = () => 
    {
      setRecordState( currentState => 
      {
        let currentTimestamp = currentState['currentTimestamp'] + INTERVAL_DURATION;

        if (currentTimestamp > currentState['duration']) {
          currentTimestamp = currentState['duration'];
          setIsPlaying( false );
        }

        return {
          ...currentState,
          ['currentTimestamp']: currentTimestamp
        }
      } )
    }

    if (isPlaying) 
    {
      playTimerID = setInterval(
        () => updateRecordState(),
        INTERVAL_DURATION
      )
    } else {
      clearInterval( playTimerID );
    }

    return () => {
      clearInterval( playTimerID );
    }
  }, [isPlaying] )

  useEffect( () => 
  {
    if (!recordState.initialTimestamp) return;

    const updateText = ( input,recordState ) => 
    {
      let output = '';

      for ( let event of input  ) 
      {
        const eventData = JSON.parse( event );
        const eventTime = eventData.timestamp - recordState.initialTimestamp; 

        if (eventTime < recordState.currentTimestamp) {
          output += eventData.key;
        }
      }

      if (output.length) setText( output );
    }

    if (!bypassRecording) updateText( input, recordState )

  }, [recordState.currentTimestamp])

  return (
    <>
      <Controls 
        updateRecordingState={updateRecordingState}
        updatePlayingState={updatePlayingState}
        recordDuration={recordState.duration}
        playbackTime={recordState.currentTimestamp}
        isRecording={isRecording}
        isPlaying={isPlaying}
        reset={resetAll}
      />
      <RecorderContext.Provider value={{ text }}>
        {children}
      </RecorderContext.Provider>
    </>
  )
}

export { InputRecorder, RecorderContext };