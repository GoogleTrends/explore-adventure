import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var fontSize = 12;
var dotSize = 15;
var margin = {top: 20, left: 20};

class ProgressBar extends Component {

  constructor(props) {
    super(props);

    this.dragProgress = this.dragProgress.bind(this);
  }

  componentDidMount() {
    this.container = d3.select(this.refs.container);

    this.container.append('line')
      .classed('grayline', true)
      .attr('x1', 0)
      .attr('x2', this.props.svgWidth)
      .attr('stroke-width', 2)
      .attr('stroke', '#cfcfcf');
    this.container.append('line')
      .classed('colorline', true)
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('stroke-width', 2);
    this.container.append('circle')
      .attr('r', dotSize / 2)
      .attr('cx', 0)
      .style('cursor', 'move')
      .call(d3.drag().on('drag', this.dragProgress));

    this.renderProgress();
    this.prepareAnimation();
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.shouldUpdate;
  }

  componentDidUpdate() {
    this.renderProgress();
    this.prepareAnimation();
  }

  renderProgress() {
    var color = this.props.color;

    this.container.select('.colorline')
      .datum(this.props.years)
      .attr('stroke', color);

    this.container.select('circle')
      .datum(this.props.years)
      .attr('fill', color);
  }

  prepareAnimation() {
    var progressBar = this.container.select('.colorline').node();
    var progressDot = this.container.select('circle').node();

    _.each(this.props.years, d => {
     // animate year text of progress bar
     var year = '' + d.year;
     var x = d.x + d.width;
     this.props.timeline.to(progressBar, this.props.duration,
       {attr: {x2: x}, ease: this.props.ease},
       year
     );
     this.props.timeline.to(progressDot, this.props.duration,
       {attr: {cx: x}, ease: this.props.ease},
       year
     );
    });
  }

  dragProgress() {
    var [x, y] = d3.mouse(this.refs.container);
    x = Math.max(x, 1);
    x = Math.min(x, this.props.svgWidth);
    var progress = x / this.props.svgWidth;

    this.props.dragProgress(progress);
  }

  render() {
    return (
      <g ref='container' />
    );
  }
}

export default ProgressBar;
