
import { useEffect, useState } from "react";

const TextInput = ({ label, value, onChange, placeholder }) => {

const [tmpvalue, setTmpvalue] = useState(value);
const [finalvalue, setFinalvalue] = useState(null);

useEffect(() => {
  const timer = setTimeout(() => {
    setFinalvalue(tmpvalue);
    // onChange(tmpvalue);
  }, 1000);
  return () => clearTimeout(timer);
} , [tmpvalue]);

useEffect(() => {
  onChange(finalvalue);
} , [finalvalue]);

  return (
    <div >
      <span className="w-25 float-left bg-light py-1"> {label} </span>
      <input className="w-75"
        value={tmpvalue}
        onChange={(e) => setTmpvalue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextInput;
