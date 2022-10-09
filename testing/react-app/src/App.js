import './App.css';
import { InputRecorder } from './components/InputRecorder'
import { InputReceiver } from './components/InputReceiver';

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <div className="App-content">
        <InputRecorder>
          <InputReceiver/>
          <InputReceiver/>
          <InputReceiver/>
        </InputRecorder>
      </div>
    </div>
  );
}

export default App;
