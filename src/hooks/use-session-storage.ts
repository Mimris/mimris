'use client'
import { useState} from 'react'

function useSessionStorage(key: string, initialValue: string | never[] | null) {
  if (typeof window === 'undefined') return initialValue
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from session storage by key
      const item = window?.sessionStorage?.getItem(key);
      // console.log("11 useSessionStorage: " + item);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to session storage.
  const setValue = (value: (arg0: any) => any) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      // console.log("22 useSessionStorage: " + valueToStore);
      setStoredValue(valueToStore);
      // Save to session storage
      window?.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

export default useSessionStorage