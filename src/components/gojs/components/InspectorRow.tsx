// @ts-nocheck
/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
// import './Inspector.css';

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
    if (debug) console.log('21 props', props, this);
    this.handleInputChange = this.handleInputChange.bind(this);
    if (debug) console.log('24 props', props, this);
  }

  private handleInputChange(e: any) {
    let value = e.target.value
  
    if (debug) console.log('21 InspectorRow: this.props', this.props);
    if (debug) console.log('22 InspectorRow: e.target', e.target, e.target.files, e.target.value);
    
    // if (this.props.type === 'file') {
    //   const fil = e.target.files[0]; 
    //   if (debug) console.log('31', value, fil);
    //   value = (fil?.name) && fil?.name.replace(/C:\\fakepath\\/,'')
    //   if (debug) console.log('36', value);
    // } 


    //this.props.onInputChange(this.props.id, value, this.props.type, this.props.obj, this.props.context, e.type === 'blur');
    this.props.onInputChange(this.props, value, e.type === 'blur');

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
              disabled={this.props.id === 'typeName'}
              // disabled={this.props.id === 'typeName' || this.props.id === 'typename'}
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
