
const TextInput = ({ label, value, onChange, placeholder }) => {
  return (
    <div>
      {label}
      <input className="w-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextInput;
