import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';

var fontSize = 12;
var margin = {top: 20, left: 20};
var topicHeight = 100;
var line = d3.line().y(d => topicHeight - d.value);
var transition = d3.transition().duration(250);
var clipId = 0;

class LineCharts extends Component {

  componentDidMount() {
    this.container = d3.select(this.refs.container);

    // add clip mask
    this.clipId = 'clipLine' + clipId;
    this.clip = this.container.append('defs')
      .append('clipPath')
      .attr('id', this.clipId)
        .append('rect')
        .attr('width', this.props.svgWidth)
        .attr('y', -topicHeight / 2)
        .attr('height', 2 * topicHeight);
    clipId += 1;

    this.container.append('line')
      .classed('median', true)
      .attr('x1', 0)
      .attr('x2', this.props.svgWidth)
      .attr('shape-rendering', 'crispEdges');
    this.container.append('text')
      .classed('medianText', true)
      .attr('x', this.props.svgWidth)
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', fontSize)
      .text('median');

    this.calculate();
    this.renderTopics();
    this.prepareAnimation();
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.shouldUpdate;
  }

  componentDidUpdate() {
    this.calculate();
    this.renderTopics();
    this.prepareAnimation();
  }

  calculate() {
  }

  renderTopics() {
    line.x(d => this.props.xScale(d.date));

    var values = _.chain(this.props.data).map('data').flatten()
      .map('value').sortBy().value();
    var median = d3.quantile(values, 0.5);
    var quarters = [d3.quantile(values, 0.25), d3.quantile(values, 0.75)];

    this.container.select('.median')
      .attr('stroke',  this.props.colors.gray)
      .transition(transition)
      .attr('y1', topicHeight - median)
      .attr('y2', topicHeight - median);
    this.container.select('.medianText')
      .attr('fill',  this.props.colors.gray)
      .transition(transition)
      .attr('y', topicHeight - median + fontSize / 2)

    this.renderYears(quarters);
    this.renderLines();
    this.renderAnnotations();
  }

  renderLines() {
    var lines = this.container.selectAll('.line')
      .data(this.props.data, d => d.country);

    lines.exit().remove();

    lines.enter().append('path')
      .classed('line', true)
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('clip-path', 'url("#' + this.clipId + '")')
      .merge(lines)
      .attr('stroke', d => d.color || '#999')
      .transition(transition)
      .attr('d', d => line(d.data));
  }

  renderYears(quarters) {
    var years = this.container.selectAll('.year')
      .data(this.props.years, d => d.year);

    years.exit().remove();

    var enter = years.enter().append('g')
      .classed('year', true);
    enter.append('rect')
      .attr('height', topicHeight)
      .attr('opacity', 0.1);

    var colored = this.props.years.length % 2 === 1 ? 0 : 1;
    enter
      .filter((d, i) => !this.props.isMobileAny || i % 2 === colored)
      .append('text')
      .attr('y', topicHeight - fontSize * 0.75)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', fontSize - 2);

    years = enter.merge(years)
      .attr('transform', d => 'translate(' + [d.x, 0]+ ')');

    // if number of years is odd, odd years should be colored
    years.select('rect')
      .attr('width', d => d.width)
      .attr('fill', (d, i) => i % 2 === colored ? this.props.color : 'none');
    years.select('text')
      .attr('x', d => d.width / 2)
      .attr('fill', this.props.color)
      .text(d => !this.props.isMobileAny ? d.year : "'" + (d.year + '').slice(2));
  }

  renderAnnotations() {
    if (!this.props.annotations) return;

    var annotations = this.container.selectAll('.annotation')
      .data(this.props.annotations, d => d.date);

    annotations.exit().remove();
    annotations.enter().append('circle')
      .classed('annotation', true)
      .attr('r', !this.props.isMobileAny ? 20 : 10)
      .attr('stroke-dasharray', '5 2')
      .attr('fill', 'none')
      .attr('stroke', this.props.colors.gray)
      .attr('clip-path', 'url("#' + this.clipId + '")')
      .merge(annotations)
      .attr('cx', d => this.props.xScale(d.date))
      .attr('cy', d => topicHeight - d.value);
  }

  prepareAnimation() {
    if (!this.props.timeline) return;

    // animate the clip mask
    var el = this.clip.node();
    this.props.timeline.set(el, {attr: {width: 0}}, 0);
    _.each(this.props.years, d => {
      var year = '' + d.year;
      var width = d.x + d.width;
      this.props.timeline.to(el, this.props.duration,
        {attr: {width}, ease: this.props.ease}, year);
    });
  }

  render() {
    return (
      <g ref='container' />
    );
  }
}

export default LineCharts;
