// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
// const RegexParser = require("regex-parser");
import RegexParser from 'regex-parser';

const debug = false;
interface InspectorRowProps {
  id: string;
  value: string;
  description: string;
  values: any;
  pattern: string;
  disabled: boolean;
  checked: boolean;
  type: string;
  obj: any;
  context: any;
  isInherited?: boolean;  // New prop to indicate inherited values
  onInputChange: (props: any, value: string, isBlur: boolean) => void;
}

export class InspectorRow extends React.PureComponent<InspectorRowProps, {}> {
  constructor(props: InspectorRowProps) {
    super(props);
    if (debug) console.log('28 InspectorRow: props', this.props);
    this.handleInputChange = this.handleInputChange.bind(this);
    if (debug) console.log('30 InspectorRow: this', this, this.props);
    this.state = {
      checkboxValue: props.checked === true || props.value === true || props.value === 'true',
      inputValue: props.value ?? '',
    };
  }

  componentDidUpdate(prevProps: InspectorRowProps) {
    if (this.props.type === 'checkbox') {
      const prevChecked = prevProps.checked === true || prevProps.value === true || prevProps.value === 'true';
      const nextChecked = this.props.checked === true || this.props.value === true || this.props.value === 'true';
      if (prevChecked !== nextChecked) {
        this.setState({ checkboxValue: nextChecked });
      }
      return;
    }
    if (this.props.type === 'number' && prevProps.value !== this.props.value) {
      this.setState({ inputValue: this.props.value ?? '' });
    }
  }

  private handleInputChange(e: any) {
    if (debug) console.log('33 this.props, e.target', this.props, e.target);
    const fieldType = this.props.type;
    let value = e.target.value;
    if (fieldType === 'checkbox') {
      value = Boolean(e.target.checked);
      this.setState({ checkboxValue: value });
    } else if (fieldType === 'number') {
      this.setState({ inputValue: value });
    }
    if (debug) console.log('41 e.target: ', e.target, e.type);
    if (debug) console.log('42 InspectorRow: this.props, value: ', this.props, value);
    this.props.onInputChange(this.props, value, e.type === 'blur');
    if (e.type === 'blur') {
      const pattern = this.props.pattern;
      if ((pattern?.length > 0) && (value?.length > 0)) {
        const regex = new RegexParser(pattern);
        if (debug) console.log('50 pattern, value, regex:', pattern, value, regex);
        if (!regex.test(value)) {
          alert("Value: '" + value + "' IS NOT valid");
        }
      }
    }
  }
  
  private formatLocation(loc: string): string {
    const locArr = loc.split(' ');
    if (locArr.length === 2) {
      const x = parseFloat(locArr[0]);
      const y = parseFloat(locArr[1]);
      if (!isNaN(x) && !isNaN(y)) {
        return `${x.toFixed(0)} ${y.toFixed(0)}`;
      }
    }
    return loc;
  }
  public render() {
    // -------------- linjen nedenfor må endres til å vise description på denne property
    // f.eks.  this.props.description  
    const propDesc = `Fieldtype : ${this.props.type} \nDescription: ${this.props.description}`;
    const inheritedStyle = this.props.isInherited ? { fontStyle: 'italic', opacity: 0.8 } : {};
    // ---------------
    if (debug) console.log('74 InspectorRow: this.props', this.props);
    let val = this.props.value;
    if (val === 'Not valid') {
      alert ('Input is not valid: ' + val );
    }
    if (this.props.type === 'textarea') {
      if (debug) console.log('80 props', this.props);
      return (  
        <tr>
          <td className="label pr-2 w-25" >{this.props.id}</td> 
          <td>
            <textarea
              disabled={this.props.disabled}
              id={this.props.id}
              value={val}
              style={inheritedStyle}
              // style={(this.props.id === 'description') ? {  height: "200px" } : {  height: "40px" }}
              // checked={this.props.checked}
              // type={this.props.type}
              onChange={this.handleInputChange}
              onBlur={this.handleInputChange}
              rows={ Math.ceil((val?.length) / 69) || 1}
              >
            </textarea>
          </td>
          <td>
          <div className="btn-sm bg-light text-green px-1 py-2 float-right"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title={propDesc}>i
          </div>
          </td>
        </tr>
      );
    } 
    else if (this.props.type === 'select') {
      const values = Array.isArray(this.props.values) ? this.props.values : [];
      const renderedValue = val ?? '';
      const hasCurrentValue =
        renderedValue !== '' &&
        values.some((option) => String(option) === String(renderedValue));
      const optionValues = hasCurrentValue ? values : (renderedValue !== '' ? [renderedValue, ...values] : values);
      return (
      <tr>
        <td className="pr-2 w-25" >{this.props.id}</td> 
        <td>
          <select
            disabled={this.props.disabled}
            id={this.props.id}
            value={renderedValue}
            style={inheritedStyle}
            onChange={this.handleInputChange}
            onBlur={this.handleInputChange}
          >
            {renderedValue === '' && <option value=""></option>}
            {optionValues.map((option) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ))}
          </select>
        </td>
        <td>
          <div className="btn-sm bg-light text-green px-1 py-2 float-right"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
            title={propDesc}>i
          </div>
        </td>
      </tr>
     );
    }    
    else{
      if (debug) console.log('132 props', this.props);
      const isCheckbox = this.props.type === 'checkbox';
      const checked =
        isCheckbox ? (this.state as any).checkboxValue === true : this.props.checked;
      const renderedValue =
        this.props.type === 'number'
          ? (this.state as any).inputValue
          : val;
      return (  
        <tr>
          <td className="pr-2  w-25" >{this.props.id}</td> 
          <td>
            <input
              disabled={this.props.disabled}
              id={this.props.id}
              value={isCheckbox ? undefined : renderedValue}
              checked={checked}
              type={this.props.type}
              style={inheritedStyle}
              onChange={this.handleInputChange}
              onBlur={this.handleInputChange}
              >
            </input>
          </td>
          <td>
            <div className="btn-sm bg-light text-green px-1 py-2 float-right"  data-toggle="tooltip" data-placement="top" data-bs-html="true" 
              title={propDesc}>i
            </div>
          </td>
        </tr>
      );
    } 
  }
}
