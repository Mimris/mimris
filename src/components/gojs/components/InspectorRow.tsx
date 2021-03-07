// @ts-nocheck
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
  type: string;
  obj: any;
  context: any;
  onInputChange: (id: string, value: string, type: string, obj: any, context: any, isBlur: boolean) => void;
}

export class InspectorRow extends React.PureComponent<InspectorRowProps, {}> {
  constructor(props: InspectorRowProps) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
    if (debug) console.log('24 InspectorRow: this', this, this.props);
    const value = this.props.value  
    const pattern = this.props.pattern;
    if ((pattern.length > 0) && (value.length > 0)) {
      const regex = new RegexParser(pattern);
      if (debug) console.log('29 regex:', regex);
      if (!regex.test(value)) {
        alert("Value: '" + value + "' IS NOT valid");
      }
    }
  }

  private handleInputChange(e: any) {
    const value = e.target.value  
    if (debug) console.log('38 InspectorRow: this.props', this, this.props);
    this.props.onInputChange(this.props, value, e.type === 'blur');
    // const pattern = this.props.pattern;
    // if ((pattern.length > 0) && (value.length > 0)) {
    //   const regex = new RegexParser(pattern);
    //   if (debug) console.log('30 regex:', regex);
    //   if (!regex.test(value)) {
    //     alert("Value: '" + value + "' IS NOT valid");
    //   }
    // }
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
    if (debug) console.log('45 InspectorRow: this.props', this.props);
    let val = this.props.value;
    if (val === 'Not valid') {
      alert ('Input is not valid: ' + val );
    }

      return (  
        <tr>
          {/* <td>{this.props.id}</td>  */}
          <td className="pr-2" >{this.props.id}</td> 
          <td>
            <input
              disabled={this.props.disabled}
              id={this.props.id}
              value={val}
              type={this.props.type}
              onChange={this.handleInputChange}
              onBlur={this.handleInputChange}
              >
            </input>
          </td>
        </tr>
      );
    
  }
}
