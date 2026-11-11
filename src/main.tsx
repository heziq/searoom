import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
// The screen uses a separate Drei Html root; keep its DOM mount stable.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
