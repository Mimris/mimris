/*
*  Copyright (C) 1998-2020 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as React from 'react';
// import './Inspector.css';

const debug = false;
interface InspectorRowProps {
  id: string;
  value: string;
  obj: any;
  context: any;
  onInputChange: (id: string, value: string, obj: any, context: any, isBlur: boolean) => void;
}

export class InspectorRow extends React.PureComponent<InspectorRowProps, {}> {
  constructor(props: InspectorRowProps) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  private handleInputChange(e: any) {
    if (debug) console.log('21 InspectorRow: this.props', this.props);
    if (debug) console.log('22 InspectorRow: e.target', e.target, e);
    this.props.onInputChange(this.props.id, e.target.value,  this.props.obj, this.props.context, e.type === 'blur');
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
    let val = this.props.value;
    if (debug) console.log('43 InspectorRow: val', val);
    if (val === 'Not valid') {
      alert ('Input is not valid: ' + val );
    }
    return (  
      <tr>
        <td>{this.props.id}</td>
        <td>
          <input
            // disabled={this.props.id === 'key'}
            id={this.props.id}
            value={val}
            onChange={this.handleInputChange}
            onBlur={this.handleInputChange}>
          </input>
        </td>
      </tr>
    );
  }
}
