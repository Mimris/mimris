// @ts-nocheck
import Select from 'react-select';
import { colorOptions } from './data';

const SelectColor = () => (
  <Select
    defaultValue={[]}
    isMulti
    name="colors"
    options={colorOptions}
    className="basic-multi-select"
    classNamePrefix="select"
  />
);

SelectColor.displayName = 'SelectColor';

export default SelectColor;
