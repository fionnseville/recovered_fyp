import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';

export const useSessionValidation = () => {
  const { user, logout } = useContext(AuthContext);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);

  const checkSession = async () => {
    if (!user?.sessionId || !user?.token) {
      setValid(false);
      setValidating(false);
      return;
    }

    try {
      const sessionRef = doc(db, 'sessions', user.sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        console.log('[SessionValidation] Session document does not exist.');
        setValid(false);
        logout();
        //navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        const data = sessionSnap.data();
        const expired = data.expiresAt && Date.now() > data.expiresAt;

        if (data.token !== user.token || expired) {
          console.log('[SessionValidation] Session token mismatch or expired.');
          setValid(false);
          logout();
        } else {
          setValid(true);
        }
      }
    } catch (err) {
      console.error('[SessionValidation] Error during validation:', err);
      setValid(false);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [user]);

  return { valid, validating, revalidate: checkSession }; 
};

