import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import {TimelineLite, Linear, TweenLite} from 'gsap';

import ProcessData from '../ProcessData';
import LineCharts from './LineCharts';
import ProgressBar from './ProgressBar';
import World from './World';

var fontSize = 12;
var topicHeight = 100;
var progressHeight = 0;
var duration = 1.2;
var margin = {top: 20, left: 20};

class Topic extends Component {
  constructor(props) {
    super(props);

    // update: should update SVG and animations, etc.
    this.state = {shouldUpdate: true};

    this.selectTopic = this.selectTopic.bind(this);
    this.dragProgress = this.dragProgress.bind(this);
    this.timeline = new TimelineLite({paused: true});
    this.transition = d3.transition().duration(500);
    this.xScale = d3.scaleLinear();

    if (this.props.display && this.props.expanded) {
      this.handleScroll = this.handleScroll.bind(this);
      window.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillMount() {
    this.calculate(this.props);
    this.prepareAnimation(this.props);
  }

  componentDidMount() {
    this.svg = d3.select(this.refs.svg)
      .attr('width', this.props.svgWidth)
      .attr('height', topicHeight);
    this.updateSVG();
  }

  componentWillReceiveProps(nextProps) {
    this.calculate(nextProps);
    this.prepareAnimation(nextProps);
    this.setState({shouldUpdate: true});
  }

  componentDidUpdate() {
    if (!this.state.shouldUpdate) return;

    this.updateSVG();
    if (!this.props.display) {
      this.timeline.pause().progress(1);
      if (this.props.expanded) {
        this.timeline.restart();
      }
    } else {
      var bodyRect = document.body.getBoundingClientRect();
      var svgRect = this.refs.svg.getBoundingClientRect();
      this.top = Math.max(0, svgRect.top - bodyRect.top);
    }
  }

  calculate(props) {
    var [start, end] = d3.extent(props.data.monthly_all, month => month.date);
    end = d3.timeYear.ceil(end);
    this.xScale.domain([start, end])
      .range([0, props.svgWidth])
      .clamp(true);

    var yearWidth = this.xScale(new Date('1/1/2005')) - this.xScale(new Date('1/1/2004'));
    this.years = d3.timeYear.range(start, end)
      .map(date => {
        return {
          date,
          year: date.getFullYear(),
          x: this.xScale(date),
          width: yearWidth,
        }
      });

    this.lineData = [];
    this.lineData.push({
      color: '#aaa',
      data: props.data.monthly_all,
      country: 'all',
    });
    if (props.data.monthly.length) {
      this.lineData.push({
        color: props.data.color,
        data: props.data.monthly,
        country: props.sourceName,
        topic: props.data.topic,
      });
    }
  }

  updateSVG() {
    var height = this.height = topicHeight;
    if (this.props.expanded) {
      height += progressHeight + this.props.svgWidth * 0.5; // map height
    }

    TweenLite.to(this.refs.div, 0.5, {
      opacity: !this.props.selected || this.props.expanded ? 1 : 0.25,
    });
    TweenLite.to(this.refs.svg, 0.5, {attr: {height}});
  }

  prepareAnimation(props) {
    this.timeline.clear();
    _.each(this.years, (date, i) => {
      this.timeline.add('' + date.year, i * duration);
    });
  }

  selectTopic() {
    this.props.selectTopic(this.props.data)
  }

  dragProgress(progress) {
    this.timeline.pause().progress(progress);
    this.setState({shouldUpdate: false});
  }

  renderExpanded(props) {
    var expandedDesc = null;
    var expandedVis = null;
    if (!this.props.expanded) return {expandedDesc, expandedVis};

    var expandStyle = {
      margin: '20px auto',
      borderRadius: 2 * fontSize,
      color: '#fff',
      backgroundColor: this.props.data.color,
      lineHeight: 2 * fontSize + 'px',
      fontSize,
      cursor: 'pointer',
      padding: '5px 10px',
      textAlign: 'center',
    };
    var topicUrl = 'https://www.google.com/#q=' + this.props.data.topic.replace(' ', '+') +
      '+' + this.props.data.country;

    expandedDesc = (
      <div>
        {this.props.data.description}
        <div style={expandStyle} onClick={() => window.open(topicUrl, '_new')}>
          Search on Google ↗
        </div>
      </div>
    );
    expandedVis = (
      <g transform={'translate(' + [0, topicHeight] + ')'}>
        <World {...this.props} {...this.state} {...props}
          topic={this.props.data.topic} data={this.props.data.monthly_regions}
          transform={'translate(' + [0, progressHeight] + ')'} />
        <ProgressBar {...this.props} {...this.state} {...this.state} {...props} />
      </g>
    );

    return {expandedVis, expandedDesc}
  }

  renderLegend() {
    var legendText = this.props.type === 'source' ? this.props.sourceName : this.props.targetName;
    var legends = [{color: '#aaa', text: 'World Searches'}];
    if (this.props.target) {
      legends.push({color: this.props.data.color, text: legendText + ' Searches'});
    }
    legends = _.map(legends, legend => {
      var style = {
        padding: '5px 10px',
        display: 'inline-block',
        fontSize,
        lineHeight: 2 * fontSize + 'px',
      };
      var lineStyle = {
        display: 'inline-block',
        width: 2 * fontSize,
        height: 2,
        borderRadius: 3,
        backgroundColor: legend.color,
        marginBottom: fontSize / 2 - 2,
      };
      return (
        <span style={style}>
          <span style={lineStyle} /> {legend.text}
        </span>
      )
    });

    return (<div style={{textAlign: 'left', padding: '10px 0'}}>{legends}</div>);
  }

  handleScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop + window.innerHeight > this.top + this.height / 2 && !this.played) {
      this.timeline.restart();
      this.played = true;
    }
  }

  render() {
    var style = {
      width: !this.props.display && this.props.width,
      border: !this.props.display && '1px solid #cfcfcf',
      padding: !this.props.display && '20px 20px 0 20px',
      margin: !this.props.display && '0 auto 20px auto',
    };
    var svgStyle = {
      overflow: 'visible',
    };
    var props = {
      color: this.props.data.color,
      duration, timeline: this.timeline, ease: Linear.easeNone,
      xScale: this.xScale, years: this.years,
      selectYear: this.selectYear, dragProgress: this.dragProgress,
    };


    var imgRight = 5;
    var imgWidth = this.props.imgWidth - imgRight;
    var imgHeight = topicHeight;
    var divStyle = {display: 'inline-block', verticalAlign: 'top',
      position: 'relative', width: imgWidth, marginRight: imgRight};
    var imgStyle = {width: imgWidth, height: imgHeight};
    var viewBox = '0 0 ' + [imgWidth, imgHeight];
    var titleStyle = {
      maxWidth: imgWidth - 2 * margin.left,
      height: 2 * fontSize,
      lineHeight: 2 * fontSize + 'px',
      position: 'absolute',
      top: (imgHeight / 2) - (fontSize + 2),
      background: 'rgba(255, 255, 255, 1)',
      padding: '5px 10px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontStyle: 'italic',
      fontSize: fontSize + 2,
    };

    var descStyle = {textAlign: 'left', fontSize, padding: '10px 0', lineHeight: 2, width: '100%'};
    var expandStyle = {
      // display: 'inline-block',
      // // margin: '10px auto 15px auto',
      borderRadius: 2 * fontSize,
      color: '#fff',
      backgroundColor: this.props.data.color,
      lineHeight: 2 * fontSize + 'px',
      fontSize,
      cursor: 'pointer',
      padding: '5px 10px',
      textAlign: 'center',
    };

    var {expandedVis, expandedDesc} = this.renderExpanded(props);
    var header = null;
    if (!this.props.display) {
      var country = this.props.type === 'source' ?
        (this.props.targetName || this.props.data.country) : this.props.sourceName;
      header = (
        <div style={divStyle}>
          <svg style={imgStyle} >
            <image xlinkHref={this.props.data.image_url} width={imgWidth} height={imgHeight}
              viewBox={viewBox} preserveAspectRatio='xMidYMid slice' />
          </svg>
          <div style={titleStyle}>{this.props.data.index + 1}. {this.props.data.topic} - {country}</div>
          <div style={descStyle}>
            {expandedDesc}
            <div style={expandStyle} onClick={!this.props.display && this.selectTopic}>
              {this.props.expanded ? '↑ Collapse' : '↓ Expand'}
            </div>
          </div>
        </div>
      );
    }


    return (
      <div style={style} ref='div'>
        {header}
        <div style={{display: 'inline-block', verticalAlign: 'top'}}>
          <svg ref='svg' style={svgStyle}>
            <LineCharts {...this.props} {...this.state} {...props} data={this.lineData} />
            {expandedVis}
          </svg>
          {!this.props.expanded && !this.props.display && this.renderLegend()}
        </div>
      </div>
    );
  }
}

export default Topic;
