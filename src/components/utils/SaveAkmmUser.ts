const debug = false;

export const SaveAkmmUser = (props, key) => {

    if (!debug) console.log("5 SaveAkmmUser akmmUser exists in localStorage, use it", key,  props.phUser);

    // Function to save data to localStorage
    function saveToLocalStorage(key, data) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  
    // Function to get data from localStorage
    function getFromLocalStorage(key) {
        try {
            const item = localStorage?.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.log("Error in getFromLocalStorage", error);
            return null;
        }
    }
    
    // Check if akmmUser exists in localStorage
    if (getFromLocalStorage(key) === null || getFromLocalStorage(key) === undefined) {
      if (debug) console.log("23 akmmUser exists in localStorage, use it", props.phUser);
      saveToLocalStorage(key, props.phUser);
    } else if (getFromLocalStorage(key) === 'akmmUser') {
      if (debug) console.log("26 SaveAkmmUser akmmUser does not exist in localStorage, create it", props.phUser);
      saveToLocalStorage(key, props);
    } else {
        if (debug) console.log("29 SaveAkmmUser ", getFromLocalStorage(key));
    }
  
  }