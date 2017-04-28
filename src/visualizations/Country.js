import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import Select from 'react-select';
import {TimelineLite} from 'gsap';

import ProgressBar from './ProgressBar';
import Topic from './Topic';
import World from './World';

var fontSize = 12;
var perHeight = 60;
var margin = {top: 20, left: 20};
var numTopics = 5;

class Country extends Component {

  constructor(props) {
    super(props);

    this.state = {loadMore: false, selected: null};
    this.selectTopic = this.selectTopic.bind(this);
    this.selectTarget = this.selectTarget.bind(this);
    this.loadMore = this.loadMore.bind(this);
  }

  selectTopic(topic) {
    var selected = this.state.selected !== topic.topic_code ? topic.topic_code : null;
    this.setState({selected});
  }

  selectTarget(target) {
    if (target) {
      this.props.selectTarget(target.value, target.label, target.topics);
    } else {
      this.props.clearTarget();
    }
  }

  loadMore() {
    this.setState({loadMore: !this.state.loadMore});
  }

  renderHeader() {
    var style = {
      marginBottom: 20,
    };
    var titleStyle = {
      display: 'inline-block',
      lineHeight: '36px',
      height: 36,
      verticalAlign: 'top',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: 22,
      fontFamily: 'CatMule Caps',
    };
    var underlineStyle = {
      borderBottom: '2px solid',
    }
    var targets = _.map(this.props.regions, region => {
      return {label: region.country, value: region.country_code, topics: region.topics};
    });

    var header;
    var select = (<Select className='header' name='form-target' value={this.props.target} options={targets}
      placeholder='the World' onChange={this.selectTarget} />);
    var proposition = this.props.targetName ? 'in' : 'around';
    if (this.props.type === 'source') {
        header = (
          <div style={style}>
            <span style={titleStyle}>Topics
              <span style={underlineStyle}> {this.props.sourceName} </span>
              searches for {proposition}
            </span> {select} <span style={titleStyle}>
              in <span style={underlineStyle}>{this.props.season}</span>
            </span>
          </div>
        );
    } else {
        header = (
          <div style={style}>
            <span style={titleStyle}>
              Topics
            </span> {select} <span style={titleStyle}>
              searches for in
              <span style={underlineStyle}> {this.props.sourceName} </span>
              in <span style={underlineStyle}>{this.props.season}</span>
            </span>
          </div>
        );
    }

    return header;
  }

  render() {
    var style = {
      width: this.props.width + 2 * margin.left,
      margin: '20px auto',
      padding: '20px 0',
    };
    var headerStyle = {
      width: this.props.width,
      margin: 'auto',
    };
    var svgStyle = {overflow: 'visible'};
    var buttonStyle = {
      borderRadius: 2 * fontSize,
      color: '#fff',
      backgroundColor: this.props.colors.blue,
      lineHeight: 2 * fontSize + 'px',
      fontSize,
      cursor: 'pointer',
      padding: '5px 10px',
      textAlign: 'center',
    };
    var props = {
      selectTopic: this.selectTopic,
    };

    var load = null;
    var topics = this.props.data;
    if (this.props.data.length > numTopics) {
      load = (
        <div style={buttonStyle} onClick={this.loadMore}>
          Load {this.state.loadMore ? 'Less ↑' : 'More ↓'}
        </div>
      );
      topics = this.state.loadMore ? topics : _.take(topics, numTopics);
    }
    topics = _.map(topics, (topic, i) => {
      var expanded = this.state.selected === topic.topic_code;
      return (<Topic key={i} {...this.props} {...props} {...this.state}
        expanded={expanded} data={topic} />);
    });

    return (
      <div style={style}>
        <div style={headerStyle}>
          {this.renderHeader()}
        </div>
        {topics}
        {load}
      </div>
    );
  }
}

export default Country
