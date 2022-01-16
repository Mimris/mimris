// @ts- nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
// import './Inspector.css';
const RegexParser = require("regex-parser");

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
  onInputChange: (props: any, value: string, isBlur: boolean) => void;
}

export class InspectorRow extends React.PureComponent<InspectorRowProps, {}> {
  constructor(props: InspectorRowProps) {
    super(props);
    if (debug) console.log('28 InspectorRow: props', this.props);
    this.handleInputChange = this.handleInputChange.bind(this);
    if (debug) console.log('30 InspectorRow: this', this, this.props);
  }

  private handleInputChange(e: any) {
    if (debug) console.log('33 handleInput', this.props, e.target);
    const fieldType = this.props.type;
    let value = e.target.value;
    if ((fieldType === 'checkbox') && (this.props.value === 'true')) {
      e.target.checked = true;
    }
    if (fieldType === 'checkbox') value = e.target.checked;
    if (debug) console.log('41 e.target: ', e.target, e.type);
    if (debug) console.log('42 InspectorRow: this.props, value: ', this.props, value);
    const checked = e.target.checked;
    this.props.onInputChange(this.props, value, e.type === 'blur');
    if (e.type === 'blur') {
      if (debug) console.log('46 InspectorRow: value, checked: ', value, checked, this.props);
      const pattern = this.props.pattern;
      if ((pattern?.length > 0) && (value?.length > 0)) {
        const regex = new RegexParser(pattern);
        if (debug) console.log('50 regex:', regex);
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
              // checked={this.props.checked}
              // type={this.props.type}
              onChange={this.handleInputChange}
              onBlur={this.handleInputChange}
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
      const listname = "Select_" + this.props.id; // Cannot include spaces
      const values = this.props.values;
      const optionsDiv = values?.map((option) => <option key={option} value={option}/>)
      const optionslistDiv = <datalist id={listname}>{optionsDiv}</datalist>
      return (
      <tr>
        <td className="pr-2 w-25" >{this.props.id}</td> 
        <td>
          <input
            id={this.props.id}
            type="text"
            list={listname}
            placeholder={val}
            onChange={this.handleInputChange}
            onBlur={this.handleInputChange}
            />
            {optionslistDiv}
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
      return (  
        <tr>
          <td className="pr-2  w-25" >{this.props.id}</td> 
          <td>
            <input
              disabled={this.props.disabled}
              id={this.props.id}
              value={val}
              checked={this.props.checked}
              type={this.props.type}
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
