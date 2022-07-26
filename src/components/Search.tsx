import TextInput from './utils/TextInput';
import Select from './utils/Select';


const Search = (props) => {
  const { model, searchText, onSearchTextChange, onModelChange } = props;

  // const modeloptions = [{value: '', label: 'All'}, ...models]
  return (
    <div>
      <TextInput
        label="Repo Search"
        value={searchText}
        onChange={(value) => onSearchTextChange(value)}
        placeholder="Search for a repo"
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