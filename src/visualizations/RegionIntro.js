import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import {TimelineMax} from 'gsap';
import {annotation, annotationCallout, annotationXYThreshold} from 'd3-svg-annotation';

var duration = 1;
var perDuration = 0.005;
var margin = {top: 20, left: 20};
var blockSize = 20;
var fontSize = 12;
var transition = d3.transition().duration(500);
var heightScale = d3.scaleLinear();

var season = 'Spring';
var seasonsWidth = 80;
var scenes = ['one', 'two', 'three', 'four'];
var scenePadding = 75;
var annotations = [];

class RegionIntro extends Component {

  constructor(props) {
    super(props);

    this.played = false;
    this.timeline = new TimelineMax({paused: true, repeat: 3, repeatDelay: 3 * duration});
    this.selectScene = this.selectScene.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    this.svg = d3.select(this.refs.svg);
    this.container = this.svg.append('g')
      .attr('transform', 'translate(' + [0, 3 * margin.top] + ')');

    var dimensions = this.calculateDimensions();

    // progress dots up top
    this.progresses = this.container.append('g')
      .classed('progresses', true)
      .attr('transform', 'translate(' + [dimensions.width / 2, -2.5 * margin.top] + ')');
    this.progresses.append('line')
      .attr('x1', -1.5 * scenePadding)
      .attr('x2', 1.5 * scenePadding)
      .attr('stroke', '#cfcfcf')
      .attr('stroke-width', 3);
    this.progresses.append('line')
      .classed('colorline', true)
      .attr('x1', -1.5 * scenePadding)
      .attr('x2', -1.5 * scenePadding)
      .attr('stroke', this.props.colors.blue)
      .attr('stroke-width', 3);
    this.progressCircles = this.progresses.selectAll('circle').data(scenes)
      .enter().append('circle')
      .attr('cx', (d, i) => (i - 1.5) * scenePadding)
      .attr('r', fontSize + 2)
      .attr('fill', '#cfcfcf')
      .style('cursor', 'pointer')
      .on('click', this.selectScene);
    this.progresses.selectAll('text')
      .data(scenes).enter().append('text')
      .classed('header', true)
      .attr('x', (d, i) => (i - 1.5) * scenePadding)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .style('font-weight', 600)
      .style('font-size', 22)
      // .style('font-style', 'italic')
      .style('pointer-events', 'none')
      .text((d, i) => i + 1);

    this.renderRegions(dimensions);
    this.prepareAnimation(dimensions);

    // calculate top
    var bodyRect = document.body.getBoundingClientRect();
    var svgRect = this.refs.svg.getBoundingClientRect();
    this.top = Math.max(0, svgRect.top - bodyRect.top);
    window.addEventListener('scroll', this.handleScroll);
  }

  // componentDidUpdate() {
  //   var dimensions = this.calculateDimensions();
  //   this.renderRegions(dimensions);
  //   this.prepareAnimation();
  // }

  calculateDimensions() {
    var values = _.chain(this.props.intros.regions)
      .map('topics').flatten()
      .map(topic => topic.seasons[season].value)
      .sortBy().value();
    heightScale.domain([
      d3.quantile(values, 0),
      d3.quantile(values, 0.25),
      d3.quantile(values, 0.5),
      d3.quantile(values, 0.75),
      d3.quantile(values, 1),
    ]).range([blockSize * 0.2, blockSize * 0.4,
      blockSize * 0.6, blockSize * 0.8, blockSize]);

    var height = 0;
    var maxChars = 0;
    var x = 0;
    this.data = _.chain(this.props.intros.regions)
      .groupBy(country => country.topics[0].region)
      .map((countries, region) => {
        // countries grouped into sub regions
        countries = _.map(countries, (country, i) => {
          var y = 0;
          _.chain(country.topics)
            .groupBy(topic => topic.seasons[season].order < 2)
            .sortBy(topics => topics[0].seasons[season].order)
            .each((topics, i) => {
              var opacity = topics[0].seasons[season].order < 2 ? 1 : 0.25;
              _.chain(topics)
                .sortBy(topic => -topic.seasons[season].value)
                .sortBy(topic => _.find(this.props.categories, c => c.id === topic.category).order)
                .each(topic => {
                  var height = heightScale(topic.seasons[season].value);
                  y += height;

                  Object.assign(topic.seasons[season], {
                    y, height, opacity,
                  });
                }).value();
            }).value();

          height = Math.max(height, y);
          maxChars = Math.max(maxChars, country.country.length);
          return Object.assign(country, {x: i * blockSize});
        });

        var width = countries.length * blockSize;
        region = {region, countries, width, x};
        x += width + blockSize;
        return region;
      }).value();

    // subtrack blockSize to account for the last blockSize added above
    var width = x + 2 * margin.left - blockSize;
    height = height + 2 * margin.top;
    this.height = height + maxChars * fontSize;

    this.svg.attr('width', width)
      .attr('height', this.height);

    return {width, height};
  }

  renderRegions(dimensions) {
    var {height} = dimensions;

    this.regions = this.container.selectAll('.region')
      .data(this.data, d => d.region);

    var offset = 2;
    this.regions.exit().remove();
    var enter = this.regions.enter().append('g')
      .classed('region', true);

    this.regions = enter.merge(this.regions)
      .attr('transform', (d, i) => 'translate(' + [d.x + margin.left, height]+ ')');

    this.renderCountries(dimensions);
    this.renderBlocks(dimensions);
  }

  renderCountries(dimensions) {

    this.countries = this.regions.selectAll('.country')
      .data(d => d.countries, d => d.country);

    var offset = 2;
    this.countries.exit().remove();
    var enter = this.countries.enter().append('g')
      .classed('country', true);

    enter.append('line')
      .attr('x2', blockSize)
      .attr('y1', offset)
      .attr('y2', offset)
      .attr('opacity', 1)
      .attr('stroke', this.props.colors.gray)
      .attr('shape-rendering', 'crispEdges');
    enter.append('text')
      .attr('transform', 'translate(' + [(blockSize - 2) / 2, 3 * offset] + ')rotate(-90)')
      .attr('text-anchor', 'end')
      .attr('font-size', fontSize)
      .attr('dy', '.35em')
      .attr('opacity', 1)
      .attr('fill', this.props.colors.gray);

    this.countries = enter.merge(this.countries)
      .attr('transform', d => 'translate(' + [d.x, 0] + ')')
      .attr('opacity', 1);
    this.countries.select('text')
      .text(d => d.country);
  }

  renderBlocks(dimensions) {
    var {height} = dimensions;

    this.blocks = this.countries.selectAll('.block')
      .data(d => d.topics, d => d.topic);

    this.blocks.exit().remove();

    this.blocks = this.blocks.enter().append('rect')
      .classed('block', true)
      .attr('stroke', this.props.colors.gray)
      .attr('width', blockSize - 2)
      .attr('stroke-width', 0)
      .attr('y', -height)
      .attr('height', blockSize)
      .attr('opacity', 0)
      .merge(this.blocks)
      .attr('fill', d => d.color);
  }

  animateSceneOne(dimensions) {
    var {width, height} = dimensions;
    // scene one: annotation about countries
    // grouped by region, more to right is further from US
    var wrap = 200;
    var annotations = [{
      note: {
        title: 'Regions',
        label: 'United States belongs in the North American region with Canada and Mexico',
        align: 'left',
        wrap,
        lineType: 'horizontal',
        padding: 5,
      },
      data: {opacity: 0},
      x: blockSize / 2, // first region half
      y: 0,
      dx: 0,
      dy: -height * 0.65,
      connector: {end: 'arrow'},
    }, {
      note: {
        title: 'Distance',
        label: 'The further right a country, the further it is from United States',
        wrap,
        lineType: 'vertical',
        align: 'middle',
      },
      data: {opacity: 0},
      x: width - 2 * margin.left,
      y: -height * 0.25,
      dx: -width + 3 * margin.left + wrap + blockSize / 2,
      dy: 0,
      connector: {end: 'arrow'},
    }];

    this.sceneOne = this.container.append('g')
      .classed('one', true)
      .attr('transform', 'translate(' + [margin.left, height] + ')');
    var makeAnnotations = annotation()
      // .editMode(true)
      .type(annotationCallout)
      .annotations(annotations);
    annotations = this.sceneOne.call(makeAnnotations)
      .selectAll('.annotation').attr('opacity', d => d.data.opacity);
    annotations.selectAll('text').style('font-family', 'Libre Baskerville');

    /** timeline **/
    var tl = new TimelineMax();

    tl.add('assemble');

    // progress circle fade to blue
    tl.to(this.progressCircles.nodes()[0], duration * 0.5,
      {attr: {fill: this.props.colors.blue}}, 'assemble');

    // fade in annotations
    var annotationEl = annotations.nodes();
    tl.staggerTo(annotationEl, duration * 0.5, {attr: {opacity: 1}}, duration * 0.25, 'assemble');

    tl.add('scene');
    var line = this.progresses.select('.colorline').node();
    tl.to(line, 3 * duration, {attr: {x2: -0.5 * scenePadding}}, 'scene');

    return tl;
  }

  animateSceneTwo(dimensions) {
    var {width} = dimensions;
    this.sceneTwo = this.container.append('g')
      .classed('two', true)
      .attr('transform', 'translate(' + [width / 2, 0] + ')');
      var seasons = this.sceneTwo.append('g')
        .attr('opacity', 0);
      seasons.append('text')
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', this.props.colors.gray)
        .attr('font-size', fontSize + 2)
        .style('cursor', 'pointer')
        .style('font-family', 'Libre Baskerville')
        .text(season);
      seasons.append('line')
        .attr('x1', -seasonsWidth / 2)
        .attr('x2', seasonsWidth / 2)
        .attr('y1', margin.top)
        .attr('y2', margin.top)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    /** timeline **/
    var tl = new TimelineMax();

    tl.add('assemble');

    // progress circle fade to blue
    tl.to(this.progressCircles.nodes()[1], duration * 0.5,
      {attr: {fill: this.props.colors.blue}}, 'assemble');

    var annotationEl = this.sceneOne.selectAll('.annotation').nodes();
    tl.staggerTo(annotationEl, duration * 0.5, {attr: {opacity: 0}}, duration * 0.25, 'assemble');
    // fade in the blocks
    tl.staggerTo(_.map(this.blocksAttr, 'el'), 1,
      {cycle: {attr: (i) => this.blocksAttr[i].attrs}}, perDuration)
      .to(seasons.node(), duration * 0.25, {attr: {opacity: 1}}, '-=1');

    tl.add('scene');
    var line = this.progresses.select('.colorline').node();
    tl.to(line, 3 * duration, {attr: {x2: 0.5 * scenePadding}}, 'scene');

    return tl;
  }

  animateSceneThree(dimensions) {
    var {width, height} = dimensions;
    var wrap = this.props.width * (!this.props.isMobileAny ? 0.25 : 0.4);
    // get the tallest country and its region
    var region, country;
    var seasonMax = 0;
    _.each(this.data, r => {
      _.each(r.countries, c => {
        var seasonVal = _.sumBy(c.topics, topic => topic.seasons[season].value);
        if (seasonVal > seasonMax) {
          seasonMax = seasonVal;
          country = c;
          region = r;
        }
      });
    });
    var opaqueY = _.chain(country.topics)
      .filter(d => d.seasons[season].order < 2)
      .maxBy(d => d.seasons[season].y)
      .value().seasons[season].y;
    var translucentY = _.chain(country.topics)
      .filter(d => d.seasons[season].order > 1)
      .maxBy(d => d.seasons[season].y)
      .value().seasons[season].y;
    this.centeredCountry = {region, country, opaqueY, translucentY};

    var legendX = width / 2 - 1.5 * blockSize;
    var offset = 2;

    var annotations = [{
      note: {
        title: 'Most popular topics in ' + season,
        align: 'middle',
        wrap,
        lineType: 'vertical',
        padding: 5,
      },
      data: {opacity: 0},
      x: legendX - offset, // first region half
      y: -opaqueY / 2,
      dx: -2 * margin.left,
      dy: 0,
      subject: {
        y1: -offset,
        y2: -opaqueY,
      }
    }, {
      note: {
        label: 'Topics that are more popular in other seasons',
        align: 'middle',
        wrap,
        lineType: 'vertical',
        padding: 5,
      },
      data: {opacity: 0},
      x: legendX - offset, // first region half
      y: -opaqueY - (translucentY - opaqueY + offset) / 2,
      dx: -2 * margin.left,
      dy: 0,
      subject: {
        y1: -opaqueY - offset,
        y2: -translucentY,
      }
    }];
    this.sceneThree = this.container.append('g')
      .classed('three', true)
      .attr('transform', 'translate(' + [margin.left, height] + ')');
    var makeAnnotations = annotation()
      // .editMode(true)
      .type(annotationXYThreshold)
      .annotations(annotations);
    annotations = this.sceneThree.call(makeAnnotations)
      .selectAll('.annotation').attr('opacity', d => d.data.opacity);
    annotations.selectAll('text').style('font-family', 'Libre Baskerville');

    /** timeline **/
    var tl = new TimelineMax();

    tl.add('assemble');

    // progress circle fade to blue
    tl.to(this.progressCircles.nodes()[2], duration * 0.5,
      {attr: {fill: this.props.colors.blue}}, 'assemble');

    // filter out everything but middle country
    var blocks = _.filter(this.blocksAttr, d => d.country !== country.country_code);
    var regionEl = this.regions.filter(d => d.region === region.region).node();
    var regionTranslate = 'translate(' + [legendX - country.x + blockSize, height] + ')';
    var annotationEl = annotations.nodes();
    tl.staggerTo(_.map(blocks, 'el'), 1, {attr: {opacity: 0}}, perDuration, 'assemble')
      .to(regionEl, 1, {attr: {transform: regionTranslate}}, '-=1')
      .staggerTo(annotationEl, duration * 0.5, {attr: {opacity: 1}}, duration * 0.25);

    // fade out rest of countries too
    var countries = this.countries.filter(d => d.country_code !== country.country_code);
    var staggerDuration = (perDuration * blocks.length) / countries.nodes().length;
    tl.staggerTo(countries.selectAll('text').nodes(), 1,
      {attr: {opacity: 0}}, staggerDuration, 'assemble');
    tl.staggerTo(countries.selectAll('line').nodes(), 1,
      {attr: {opacity: 0}}, staggerDuration, 'assemble');
    // and then move the remaining country over

    tl.add('scene');
    var line = this.progresses.select('.colorline').node();
    tl.to(line, 3 * duration, {attr: {x2: 1.5 * scenePadding}}, 'scene');

    return tl;
  }

  animateSceneFour(dimensions) {
    var {width, height} = dimensions;
    var {country, region, translucentY} = this.centeredCountry;

    var offset = 2;
    var legendX = width / 2 - blockSize / 2;
    var numLegendBlocks = !this.props.isMobileAny ? 10 : 6;
    var legendWidth = numLegendBlocks * blockSize;
    var annotations = [{
      note: {
        label: 'Topics that are searched for more are taller.',
        wrap: legendWidth,
        align: 'right',
        padding: 5,
      },
      data: {opacity: 0},
      x: legendX, // first region half
      y: -translucentY / 2,
      dx: margin.left + legendWidth,
      dy: 0,
      subject: {
        y1: -offset,
        y2: -translucentY,
      }
    }];
    this.sceneFour = this.container.append('g')
      .classed('four', true)
      .attr('transform', 'translate(' + [margin.left, height] + ')');
    var makeAnnotations = annotation()
      // .editMode(true)
      .type(annotationXYThreshold)
      .annotations(annotations);
    annotations = this.sceneFour.call(makeAnnotations)
      .selectAll('.annotation').attr('opacity', d => d.data.opacity);
    annotations.selectAll('text').style('font-family', 'Libre Baskerville');

    // add blocks legend
    var domainMax = _.last(heightScale.domain());
    var legend = _.times(numLegendBlocks, i => heightScale(domainMax * (i + 1) / (numLegendBlocks - 1)));
    var legendBlocks = this.sceneFour.selectAll('rect')
      .data(legend).enter().append('rect')
      .attr('width', blockSize - 2)
      .attr('x', (d, i) => legendX + margin.left + i * blockSize)
      .attr('y', d => -translucentY / 2 - d)
      .attr('height', d => d - 2)
      .attr('opacity', 0)
      .attr('fill', this.props.colors.red);

      /** timeline **/
    var tl = new TimelineMax();

    tl.add('assemble');

    // progress circle fade to blue
    tl.to(this.progressCircles.nodes()[3], duration * 0.5,
      {attr: {fill: this.props.colors.blue}}, 'assemble');

    var staggerDuration = numLegendBlocks * 0.1 + duration * 0.25;
    tl.staggerTo(legendBlocks.nodes(), duration * 0.25,
      {attr: {opacity: 1}}, 0.1, 'assemble');
    tl.to(annotations.node(), staggerDuration, {attr: {opacity: 1}}, 'assemble');

      return tl;
  }

  prepareAnimation(dimensions) {
    var blocksAttr = this.blocksAttr = [];
    this.blocks.each(function(topic) {
      var data = topic.seasons[season];
      blocksAttr.push({
        el: this,
        country: topic.country_code,
        attrs: {
          y: -data.y,
          height: data.height - 2,
          opacity: data.opacity
        },
      });
    });

    this.timeline.add(this.animateSceneOne(dimensions), 'one');
    this.timeline.add(this.animateSceneTwo(dimensions), 'two');
    this.timeline.add(this.animateSceneThree(dimensions), 'three');
    this.timeline.add(this.animateSceneFour(dimensions), 'four');
  }

  selectScene(scene) {
    this.timeline.seek(scene).resume();
  }

  handleScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop + window.innerHeight > this.top + this.height / 2 && !this.played) {
      this.timeline.restart();
      this.played = true;
    }
  }

  render() {
    var svgStyle = {overflow: 'visible', paddingTop: fontSize};

    return (
      <svg ref='svg' style={svgStyle}></svg>
    );
  }
}

export default RegionIntro;
