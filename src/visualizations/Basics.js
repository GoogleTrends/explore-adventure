import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import {TimelineMax} from 'gsap';
import {annotation, annotationXYThreshold} from 'd3-svg-annotation';

var duration = 1;
var blockSize = 20;
var smallBlockSize = 15;
var scenePadding = 75;
var margin = {top: 20, left: 20};
var spacing = 5;
var fontSize = 12;
var textWidth = 100;

var scenes = ['one', 'two', 'three'];
var annotations = [];

class Basics extends Component {

  constructor(props) {
    super(props);

    this.timeline = new TimelineMax({paused: true, repeat: 3, repeatDelay: 3 * duration});
    this.selectScene = this.selectScene.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentWillMount() {
    var y = 0;
    var perRow = Math.floor((this.props.width - 2 * textWidth) / smallBlockSize);
    if (this.props.isMobilePhone) {
      smallBlockSize = 10;
      perRow = Math.floor((this.props.width - textWidth) / smallBlockSize);
    }

    this.blocksData = _.map(this.props.intros.categories, (category, i) => {
      var numRows = Math.ceil(category.count / perRow);
      var blocks = _.times(category.count, i => {
        var x = ((i % perRow) + 1) * smallBlockSize;
        var row = Math.floor(i / perRow) * smallBlockSize;
        return {x: x, y: row, color: category.color};
      });
      var height = smallBlockSize * numRows + smallBlockSize;
      height = Math.max(height, blockSize + spacing);
      y += height;

      return {y: y - height, blocks, height};
    });

    this.height = y + 4 * margin.top;

    var topicsHeight = this.props.intros.topics.length * (blockSize + spacing) - spacing;
    var categoriesHeight = this.props.intros.categories.length * (blockSize + spacing) - spacing;
    annotations = [{
      note: {
        title: "Topics",
        label: 'these represent every search the U.S. made across the years',
        wrap: this.props.width * (!this.props.isMobilePhone ? 0.3 : 0.4),
        lineType: 'vertical',
        align: 'middle',
        padding: spacing,
      },
      //can use x, y directly instead of data
      id: 'one',
      data: {opacity: 1},
      x: this.props.width / 2,
      y: this.height * 0.25,
      dy: 0,
      dx: -margin.left,
      subject: {
        y1: this.height * 0.25 - topicsHeight / 2,
        y2: this.height * 0.25 + topicsHeight / 2,
      }
    }, {
      note: {
        title: "Categories",
        label: 'each topic is colored by its category',
        wrap: this.props.width * (!this.props.isMobilePhone ? 0.35 : 0.45),
        lineType: 'vertical',
        align: 'middle',
        padding: spacing,
      },
      //can use x, y directly instead of data
      id: 'two',
      data: {opacity: 0},
      x: this.props.width / 2,
      y: margin.top,
      dy: 0,
      dx: margin.left,
      subject: {
        y1: 0,
        y2: categoriesHeight + 3 * margin.top,
      },
    }];
  }

  componentDidMount() {
    this.container = d3.select(this.refs.svg)
      .attr('width', this.props.width)
      .attr('height', this.height)
      .append('g').attr('transform', 'translate(' + [0, 3 * margin.top] + ')');

    this.progresses = this.container.append('g')
      .classed('progresses', true)
      .attr('transform', 'translate(' + [this.props.width / 2, -2.5 * margin.top] + ')');
    this.progresses.append('line')
      .attr('x1', -scenePadding)
      .attr('x2', scenePadding)
      .attr('stroke', '#cfcfcf')
      .attr('stroke-width', 3);
    this.progresses.append('line')
      .classed('colorline', true)
      .attr('x1', -scenePadding)
      .attr('x2', -scenePadding)
      .attr('stroke', this.props.colors.blue)
      .attr('stroke-width', 3);
    this.progresses.selectAll('circle').data(scenes)
      .enter().append('circle')
      .attr('cx', (d, i) => (i - 1) * scenePadding)
      .attr('r', fontSize + 2)
      .attr('fill', '#cfcfcf')
      .style('cursor', 'pointer')
      .on('click', this.selectScene);
    this.progresses.selectAll('text')
      .data(scenes).enter().append('text')
      .classed('header', true)
      .attr('x', (d, i) => (i - 1) * scenePadding)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .style('font-weight', 600)
      .style('font-size', 22)
      // .style('font-style', 'italic')
      .style('pointer-events', 'none')
      .text((d, i) => i + 1);

    this.container.append('g')
      .classed('topics', true);
    this.container.append('g')
      .classed('categories', true);
    this.container.append('g')
      .classed('blocks', true);
    this.container.append('g')
      .classed('allAnnotations', true);

    this.renderBlocks();
    this.renderTopics();
    this.renderCategories();
    this.renderAnnotations();

    this.prepareAnimation();

    // calculate top
    var bodyRect = document.body.getBoundingClientRect();
    var svgRect = this.refs.svg.getBoundingClientRect();
    this.top = Math.max(0, svgRect.top - bodyRect.top);
    window.addEventListener('scroll', this.handleScroll);
  }

  renderTopics() {
    this.topics = this.container.select('.topics')
      .selectAll('.topic').data(this.props.intros.topics, d => d.topic);

    this.topics.exit().remove();

    var enter = this.topics.enter().append('g')
      .classed('topic', true);

    enter.append('rect')
      .attr('width', blockSize - 2)
      .attr('height', blockSize - 2);
    enter.append('text')
      .attr('x', blockSize + spacing)
      .attr('y', blockSize / 2)
      .attr('dy', '.35em')
      .attr('fill', this.props.colors.gray)
      .style('font-family', 'Libre Baskerville');

    this.topics = enter.merge(this.topics)
      .attr('transform', (d, i) => 'translate(' + [this.props.width / 2 + spacing,
        this.height * 0.25 + (i - 1) * (blockSize + spacing / 2)] + ')')
      .attr('opacity', 1);

    this.topics.select('rect').attr('fill', d => d.color);
    this.topics.select('text').text(d => d.topic);
  }

  renderCategories() {
    this.categories = this.container.select('.categories')
      .selectAll('.category').data(this.props.intros.categories, d => d.id);

    this.categories.exit().remove();

    var enter = this.categories.enter().append('g')
      .classed('topic', true);

    enter.append('rect')
      .attr('width', blockSize - 2)
      .attr('height', blockSize - 2)
      .attr('opacity', 1);
    enter.append('text')
      .attr('x', -2 * spacing)
      .attr('y', blockSize / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .attr('fill', this.props.colors.gray)
      .style('font-family', 'Libre Baskerville');

    this.categories = enter.merge(this.categories)
      .attr('transform', (d, i) =>
        'translate(' + [this.props.width / 2 + spacing,
          i * (blockSize + spacing) + 3 * margin.top] + ')')
      .attr('opacity', 0);

    this.categories.select('rect').attr('fill', d => d.color);
    this.categories.select('text').text(d => d.name);
  }

  renderBlocks() {
    this.blocks = this.container.select('.blocks')
      .selectAll('.block').data(this.blocksData);

    this.blocks.exit().remove();

    this.blocks = this.blocks.enter().append('g')
      .merge(this.blocks)
      .attr('transform', d => 'translate(' + [textWidth - spacing, d.y] + ')');

    this.blocks.selectAll('rect')
      .data(d => d.blocks).enter().append('rect')
      .attr('width', smallBlockSize - 2)
      .attr('height', smallBlockSize - 2)
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('fill', d => d.color)
      .attr('opacity', 0);
  }

  renderAnnotations() {
    var makeAnnotations = annotation()
      // .editMode(true)
      .type(annotationXYThreshold)
      .annotations(annotations)

    this.annotations = this.container.select('.allAnnotations').call(makeAnnotations)
      .selectAll('.annotation')
      .attr('opacity', d => d.data.opacity);
    this.annotations.selectAll('text')
      .style('font-family', 'Libre Baskerville');
  }

  animateOne() {
    var tl = new TimelineMax();

    tl.add('assemble');

    // progress circle fade to blue
    var progress = this.progresses.select('circle').nodes()[0];
    tl.to(progress, duration * 0.25, {attr: {fill: this.props.colors.blue}}, 'assemble');

    tl.add('scene');
    var line = this.progresses.select('.colorline').node();
    tl.to(line, 3 * duration, {attr: {x2: 0}}, 'scene');

    return tl;
  }

  animateTwo() {
    var tl = new TimelineMax();

    tl.add('assemble');
    // 2nd progress circle
    var progress = this.progresses.selectAll('circle').nodes()[1];
    tl.to(progress, duration * 0.25, {attr: {fill: this.props.colors.blue}}, 'assemble');

    // fade out first, fade in second annotation
    var annotations = this.annotations.nodes();
    tl.to(annotations[0], duration * 0.25, {attr: {opacity: 0}}, 'assemble');
    tl.to(annotations[1], duration * 0.25, {attr: {opacity: 1}}, 'assemble+=' + duration * 0.75);

    var categories = this.props.intros.categories;
    var width = this.props.width;
    this.topics.each(function(d) {
      var index = 0;
      _.some(categories, (category, i) => {
        if (category.id === d.category) {
          index = i;
          return true;
        }
      });

      var transform = 'translate(' + [width / 2 + spacing,
        index * (blockSize + spacing) + 3 * margin.top] + ')';
      tl.to(this, duration * 0.25, {attr: {transform}}, 'assemble+=' + (duration * 0.25));
    });

    // slide categories in
    categories = this.categories.nodes();
    var stagger = (duration * 0.7) / categories.length;
    tl.staggerTo(categories, 0.15, {attr: {opacity: 1}}, stagger, 'assemble+=' + duration * 0.75);

    tl.add('scene');
    // progress bar to second
    var line = this.progresses.select('.colorline').node();
    tl.to(line, 3 * duration, {attr: {x2: scenePadding}}, 'scene');


    return tl;
  }

  animateThree() {

    var tl = new TimelineMax();

    tl.add('assemble');
    // progress bar
    var progress = this.progresses.selectAll('circle').nodes()[2];
    tl.to(progress, duration * 0.25, {attr: {fill: this.props.colors.blue}}, 'assemble');

    // fade out 2nd annotationvar annotations = this.annotations.nodes();
    var annotations = this.annotations.nodes();
    tl.to(annotations[1], duration * 0.2, {attr: {opacity: 0}}, 'assemble+=' + duration * 0.25);

    // fade out the topics
    this.topics.each(function(d) {
      tl.to(this, duration * 0.25, {attr: {opacity: 0}}, 'assemble');
    });
    // and the category blocks
    this.categories.select('rect').each(function(d) {
      tl.to(this, duration * 0.25, {attr: {opacity: 0}}, 'assemble');
    });

    var blocks = this.blocks.selectAll('rect').nodes();
    var stagger = (duration * 0.75) / blocks.length;
    tl.staggerTo(blocks, 0.15, {attr: {opacity: 1}}, stagger, 'assemble+=' + duration * 0.6);

    stagger = (duration * 0.75) / this.props.intros.categories.length;
    var blocksData = this.blocksData;
    var width = this.props.width;
    this.categories.each(function(d, i) {
      var y = blocksData[i].y - smallBlockSize / 4;
      var transform = 'translate(' + [textWidth + blockSize - spacing, y] + ')';
      // tl.to(this, 0.15, {attr: {transform}}, 'assemble+=' + (duration * 0.2 + i * stagger));
      tl.to(this, duration * 0.5, {attr: {transform}}, 'assemble+=' + duration * 0.2);
    });

    return tl;
  }

  prepareAnimation() {
    this.timeline.clear();
    this.timeline.add(this.animateOne(), 'one');
    this.timeline.add(this.animateTwo(), 'two');
    this.timeline.add(this.animateThree(), 'three');
  }

  selectScene(scene) {
    this.timeline.seek(scene).resume();
  }

  handleScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // if the bottom of the screen has gotten to halfway through the section
    if (scrollTop + window.innerHeight > (this.top + this.height / 2) && !this.played) {
      this.timeline.restart();
      this.played = true;
    }
  }

  render() {
    var svgStyle = {
      overflow: 'visible',
      paddingTop: fontSize,
      width: this.props.width,
      margin: 'auto'
    };

    return (
      <svg ref='svg' style={svgStyle}></svg>
    );
  }
}

export default Basics;
