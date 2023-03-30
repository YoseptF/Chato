import { useEffect, useState } from "react";

const useReactiveLocalStorageVariable = (key: string) => {
  const [localStorageValue, setLocalStorageValue] = useState(localStorage.getItem(key));

  useEffect(() => {
    const handleStorageChange = () => {
      setLocalStorageValue(localStorage.getItem(key));
    }

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return localStorageValue;
};

export default useReactiveLocalStorageVariable;