import React, { Component } from 'react';
import _ from 'lodash';

var fontSize = 14;
var blockSize = 14;

class Categories extends Component {

  render() {
    var style = {
      width: this.props.contentWidth,
      margin: '20px auto',
    };
    var categories = _.map(this.props.categories, d => {
      var style = {
        fontSize,
        display: 'inline-block',
        padding: 5,
        cursor: 'pointer',
        height: blockSize,
        lineHeight: blockSize + 'px',
        opacity: !this.props.category || this.props.category === d.id ? 1 : 0.25,
        borderBottom: '2px solid ' + d.color,
      }
      return (
        <span key={d.id} style={style} onClick={() => this.props.selectCategories(d.id)}>
          {d.name}
        </span>
      );
    });

    return (
      <div style={style}>
        {categories}
      </div>
    );
  }
}

export default Categories
