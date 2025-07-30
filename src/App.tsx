import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Tracker from './Tracker';
import Login from './Login';
import Signup from './Signup';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;