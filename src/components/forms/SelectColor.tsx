import Select from 'react-select';
import { colorOptions } from './data';

export default () => (
  <Select
    defaultValue={[]}
    isMulti
    name="colors"
    options={colorOptions}
    className="basic-multi-select"
    classNamePrefix="select"
  />
  
);