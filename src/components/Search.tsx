import TextInput from './utils/TextInput';
import Select from './utils/Select';


const Search = (props) => {
  const { path, searchText, onSearchTextChange, onPathChange } = props;

  // const modeloptions = [{value: '', label: 'All'}, ...models]
  return (
    <div>
      <TextInput 
        label="Repo uri"
        value={path}
        onChange={(value) => onPathChange(value)}
        placeholder="Search for a repo"
      />
      <TextInput
        label="Repo path"
        value={searchText}
        onChange={(value) => onSearchTextChange(value)}
        placeholder="Path to a repo"
      />
      {/* <Select
        label="model"
        value={model}
        options={modeloptions}
        onChange={(value) => onModelChange(value)}
      /> */}
    </div>
  );
};

export default Search;