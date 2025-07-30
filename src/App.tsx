// App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Tracker from './Tracker';
import Login from './Login';
import Signup from './Signup';

const App = () => {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        localStorage.setItem('loggedIn', user.uid);
        // Optionally fetch user data to set userName
        const { db } = await import('./firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          localStorage.setItem('userName', userData.name || user.email?.split('@')[0] || 'User');
        }
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('userName');
      }
      setIsAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Show a loading state while checking auth
  if (!isAuthChecked) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/tracker" replace /> : <Login />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/tracker" replace /> : <Signup />} />
        <Route path="/tracker" element={isLoggedIn ? <Tracker /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to={isLoggedIn ? '/tracker' : '/login'} replace />} />
      </Routes>
    </Router>
  );
};

export default App;