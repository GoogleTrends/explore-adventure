import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import 'gsap/TextPlugin';

var topojson = require("topojson-client");
var world = require("../data/world.json");

var dotSize = 9;
var fontSize = 12;
var margin = {top: 20, left: 20};
var clipId = 0;
var monthsMap = {
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  3: 'Apr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sep',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec',
}

var countries = topojson.feature(world, world.objects.countries).features;

class World extends Component {
  componentWillMount() {
    this.width = this.props.svgWidth;
    this.height = this.width * 0.5;
    // world projection
    this.projection = d3.geoMercator()
      .scale(this.width / 2 / Math.PI)
      .translate([this.width / 2, this.height * 0.65]);
    this.path = d3.geoPath()
      .projection(this.projection);
  }

  componentDidMount() {
    this.container = d3.select(this.refs.container);

    this.clipId = 'clipWorld' + clipId;
    this.container.append('defs')
      .append('clipPath')
      .attr('id', this.clipId)
        .append('rect')
        .attr('width', this.width)
        .attr('height', this.height);
    clipId += 1;

    this.container.append('g')
      .classed('countries', true)
      .attr('clip-path', 'url("#' + this.clipId + '")');

    this.renderTitle();
    this.drawWorld();
    this.renderBubbles();

    this.prepareAnimation();
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.shouldUpdate;
  }

  componentDidUpdate() {
    this.renderBubbles();
    this.prepareAnimation();
  }

  drawWorld() {
    this.countries = this.container
      .select('.countries').selectAll(".country")
      .data(countries)
    .enter().append("path")
      .attr("class", "country")
      .attr("d", this.path)
      .attr('fill', this.props.colors.gray)
      .attr('stroke', '#fff')
      .attr('fill-opacity', 0.15);
  }

  renderTitle() {
    var title = this.container.append('g')
      .attr('transform', 'translate(' + [this.width / 2, this.height / 2] + ')');

    title.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', fontSize + 2)
      .style('font-family', 'Libre Baskerville')
      .text('Countries that search for ' + this.props.topic);

    var padding = 4;
    var text = title.select('text').node().getBoundingClientRect();
    var width = text.width + 2 * padding;
    var height = text.height + 2 * padding;
    title.insert('rect', 'text')
      .attr('x', -width / 2)
      .attr('y', -height / 2)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#fff')
      .attr('opacity', 0.75);
  }

  renderBubbles() {
    this.bubbles = this.container.selectAll('.bubble')
      .data(this.props.data, d => d.country_code);

    this.bubbles.exit().remove();

    var enter = this.bubbles.enter().append('g')
      .classed('bubble', true);
    enter.append('circle')
      .classed('dot', true);
    enter.append('circle')
      .classed('marker', true)
      .attr('r', 1.5);

    this.bubbles = enter.merge(this.bubbles)
      .attr('transform', d => {
        var [lat, long] = d.geo;
        var centroid = this.projection([long, lat]);

        return 'translate(' + centroid + ')';
      });

    var source = this.props.type === 'source' ? this.props.source : this.props.target;
    this.bubbles.select('.dot')
      .attr('r', 0)
      .attr('fill', d => d.country_code === source ? this.props.color : this.props.colors.gray)
      .attr('fill-opacity', 0.3);
    this.bubbles.select('.marker')
      .attr('fill', d => d.country_code === source ? this.props.color : this.props.colors.gray)
  }

  prepareAnimation() {
    if (!this.props.timeline) return;

    var startYear = 2004;
    var timeline = this.props.timeline;
    var ease = this.props.ease;
    var numMonths = 12;
    var perDuration = this.props.duration / numMonths;

    this.bubbles.each(function(d) {
      var circle = d3.select(this).select('.dot').node();

      _.each(d.monthly, (value, i) => {
        i = Math.max(i - 1, 0);
        var year = '' + (Math.floor(i / numMonths) + startYear);
        var remainder = i % numMonths;
        var position = year + '+=' + (remainder * perDuration);

        // animate circle radius
        timeline.to(circle, perDuration,
          {attr: {r: value / 2}, ease}, position);
      });
    });
  }

  render() {
    return (
      <g ref='container' transform={this.props.transform} />
    );
  }
}

export default World;
