import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import {TweenMax} from 'gsap';
import Categories from '../Categories';

var margin = {top: 20, left: 20};
var blockSize = 20;
var fontSize = 12;
var perDuration = 0.005;
var transition = d3.transition().duration(500);

var seasonsWidth = 80;

class Regions extends Component {

  constructor(props) {
    super(props);

    this.updateDimensions = true;
    this.heightScale = d3.scaleLinear();
    this.seekSeason = this.seekSeason.bind(this);
    this.selectTarget = this.selectTarget.bind(this);
    this.hoverBlock = this.hoverBlock.bind(this);
  }

  componentWillMount() {
    this.showSeasons = this.props.seasons || ['Spring', 'Summer', 'Fall', 'Winter'];
    var left = -(this.showSeasons.length - 1) / 2 * seasonsWidth;
    this.showSeasons = _.map(this.showSeasons, (season, i) => {
      return {season, x: left + i * seasonsWidth};
    });
  }

  componentDidMount() {
    var gray = '#cfcfcf';

    this.svg = d3.select(this.refs.svg);
    this.hover = d3.select(this.refs.hover)
      .style('display', 'none');

    this.seasons = this.svg.append('g')
      .classed('seasons', true)
      .selectAll('text')
      .data(this.showSeasons, d => d)
      .enter().append('text')
      .attr('x', d => d.x)
      .attr('y', margin.top / 2)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', gray)
      .attr('font-size', fontSize + 2)
      .style('cursor', 'pointer')
      .style('font-family', 'Libre Baskerville')
      .text(d => d.season);
    // this.svg.select('.seasons').append('line')
    //   .attr('x1', this.showSeasons[0].x - seasonsWidth / 2)
    //   .attr('x2', _.last(this.showSeasons).x + seasonsWidth / 2)
    //   .attr('y1', margin.top / 2 + (fontSize + 4) / 2 + 5)
    //   .attr('y2', margin.top / 2 + (fontSize + 4) / 2 + 5)
    //   .attr('stroke', '#cfcfcf')
    //   .attr('stroke-width', 2);
    this.line = this.svg.select('.seasons')
      .append('line')
      .attr('x2', this.showSeasons[0].x)
      .attr('y1', margin.top / 2 + (fontSize + 4) / 2 + 5)
      .attr('y2', margin.top / 2 + (fontSize + 4) / 2 + 5)
      .attr('stroke', this.props.colors.gray)
      .attr('stroke-width', 2);

    this.calculateDimensions();
    this.renderRegions();
    this.prepareAnimation();

    this.seasons.on('click', this.seekSeason);
    this.seekSeason(this.showSeasons[0]);
  }

  shouldComponentUpdate(nextProps) {
    // Redo animation only if there's previously no data and now there is
    // or toggle type has changed, or it's not the same source country
    if (!this.props.data.length || (this.props.type !== nextProps.type) ||
      (this.props.source !== nextProps.source) ||
      (this.props.category !== nextProps.category)) {

      this.updateDimensions = !this.props.data.length ||
        this.props.type !== nextProps.type || this.props.source !== nextProps.source;
      return true;
    } else if (!this.props.display && this.countries &&
      this.props.target !== nextProps.target) {
      // if the only thing that's changed is the target, then just update its opacity
      // but don't update anything else (this feels hacky)
      this.countries.attr('opacity', d => !nextProps.target ||
        d.country_code === nextProps.target ? 1 : 0.25)
    }
    return false;
  }

  componentDidUpdate() {
    this.calculateDimensions();
    this.renderRegions();

    this.prepareAnimation();
    this.seasons.on('click', this.seekSeason);
    this.seekSeason(this.showSeasons[0]);
  }

  calculateDimensions() {
    var values = _.chain(this.props.data)
      .map('topics').flatten()
      .map('seasons').map(d => _.values(d))
      .flatten().map('value').sortBy().value();
    this.heightScale.domain([
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
    this.data = _.chain(this.props.data)
      .groupBy(country => country.topics[0].region)
      .map((countries, region) => {
        // countries grouped into sub regions
        countries = _.map(countries, (country, i) => {
          // filter topics by category
          var filteredTopics = _.filter(country.topics, topic => !this.props.category ||
              topic.category === this.props.category);
          // calculate y and height for each season for each topic
          _.each(this.showSeasons, season => {

            var y = 0;
            season = season.season;
            // go through each topic for that season
            _.chain(filteredTopics)
              .groupBy(topic => topic.seasons[season].order < 2)
              .sortBy(topics => topics[0].seasons[season].order)
              .each((topics, i) => {
                var opacity = topics[0].seasons[season].order < 2 ? 1 : 0.25;
                // why am i doing this to myself
                _.chain(topics)
                  .sortBy(topic => -topic.seasons[season].value)
                  .sortBy(topic => _.find(this.props.categories, c => c.id === topic.category).order)
                  .each(topic => {
                    var height = this.heightScale(topic.seasons[season].value);
                    y += height;

                    Object.assign(topic.seasons[season], {
                      y, height, opacity,
                    });
                  }).value();
              }).value();
            height = Math.max(height, y);
          });

          maxChars = Math.max(maxChars, country.country.length);
          return Object.assign(country, {x: i * blockSize, filteredTopics});
        });

        var width = countries.length * blockSize;
        region = {region, countries, width, x};
        x += width + blockSize;
        return region;
      }).value();

    if (!this.updateDimensions) return;

    // subtrack blockSize to account for the last blockSize added above
    this.width = x + 2 * margin.left - blockSize;
    this.height = height + 3 * margin.top;

    this.svg
      .attr('width', this.width)
      .attr('height', this.height + maxChars * fontSize * 0.65);
    this.svg.select('.seasons')
      .attr('transform', 'translate(' + [this.width / 2, 0] + ')');
  }

  renderRegions() {
    this.regions = this.svg.selectAll('.region')
      .data(this.data, d => d.region);

    var offset = 2;
    this.regions.exit().remove();
    var enter = this.regions.enter().append('g')
      .classed('region', true);
    enter.append('line')
      .attr('y1', offset)
      .attr('y2', offset)
      .attr('stroke', this.props.colors.gray)
      .attr('shape-rendering', 'crispEdges');

    this.regions = enter.merge(this.regions)
      .attr('transform', (d, i) => 'translate(' + [d.x + margin.left, this.height + margin.top]+ ')');
    this.regions.select('line')
      .attr('x2', d => d.width - 2);

    this.renderCountries();
    this.renderBlocks();
  }

  renderCountries() {

    this.countries = this.regions.selectAll('.country')
      .data(d => d.countries, d => d.country);

    var offset = 2;
    this.countries.exit().remove();
    var enter = this.countries.enter().append('g')
      .classed('country', true);

    enter.append('text')
      .attr('transform', 'translate(' + [(blockSize - 2) / 2, 3 * offset] + ')rotate(-90)')
      .attr('text-anchor', 'end')
      .attr('font-size', fontSize)
      .attr('dy', '.35em')
      .attr('fill', this.props.colors.gray);

    this.countries = enter.merge(this.countries)
      .attr('transform', d => 'translate(' + [d.x, 0] + ')')
      .attr('opacity', d => !this.props.target || this.props.display ||
        d.country_code === this.props.target ? 1 : 0.25)
      .on('click', !this.props.display && this.selectTarget);
    this.countries.select('text')
      .text(d => d.country);
  }

  renderBlocks() {
    this.blocks = this.countries.selectAll('.block')
      .data(d => d.filteredTopics, d => d.topic);

    this.blocks.exit().remove();

    this.blocks = this.blocks.enter().append('rect')
      .classed('block', true)
      .attr('stroke', this.props.colors.gray)
      .attr('width', blockSize - 2)
      .attr('stroke-width', 0)
      .attr('y', -this.height)
      .attr('height', blockSize)
      .attr('opacity', 0)
      .merge(this.blocks)
      .attr('fill', d => d.color)
      .on('mousemove', !this.props.isMobilePhone ? this.hoverBlock : null)
      .on('mouseleave', () => !this.props.isMobilePhone ? this.hoverBlock() : null);
  }

  prepareAnimation() {
    // get all the blocks and data by season
    var blocksBySeason = this.blocksBySeason = {};
    var numBlocks = 0;
    this.blocks.each(function(topic) {
      numBlocks += 1;
      _.each(topic.seasons, (data, season) => {
        if (!blocksBySeason[season]) {
          blocksBySeason[season] = [];
        }
        blocksBySeason[season].push({
          el: this,
          attrs: {
            y: -data.y,
            height: data.height - 2,
            opacity: data.opacity
          },
        });
      });
    });
  }

  seekSeason(season) {
    season = season.season;
    var index = _.chain(this.showSeasons).map('season').indexOf(season).value();
    var lineEl = this.line.node();
    var blocks = this.blocksBySeason[season];
    if (!blocks) return;

    var numBlocks = blocks.length;
    var duration = perDuration * numBlocks + 1;
    var targets = _.map(blocks, 'el');
    TweenMax.staggerTo(targets, 1,
      {cycle: {attr: (i) => blocks[i].attrs}},
      perDuration
    );

    // animate the seasons
    var gray = this.props.colors.gray;
    this.seasons.each(function(d, i) {
      var fill = d.season === season ? gray : '#cfcfcf';
      TweenMax.to(this, duration * 0.25, {attr: {fill}});
    });
    // and the gray line
    TweenMax.to(lineEl, duration * 0.25,
      {attr: {x1: this.showSeasons[index].x - seasonsWidth / 2,
        x2: this.showSeasons[index].x + seasonsWidth / 2}});

    // update season if we haven't disabled events
    if (!this.props.display) {
      this.props.selectSeason(season);
    }
  }

  selectTarget(country) {
    if (country.country_code === this.props.target) {
      // if it's already selected, clear it
      this.props.clearTarget();
    } else {
      this.props.selectTarget(country.country_code, country.country, country.topics);
    }
  }

  hoverBlock(topic) {
    if (!topic) {
      return this.hover.style('display', 'none');
    }
    var [x, y] = d3.mouse(this.refs.container);
    this.hover.style('display', 'block')
      .style('left', (x + 5) + 'px')
      .style('top', (y + 5) + 'px')
      .text(topic.topic + ' - ' + topic.country);
  }

  render() {
    var svgStyle = {overflow: 'visible'};
    var hoverStyle = {
      position: 'absolute',
      minWidth: 100,
      padding: 10,
      boxShadow: '0 0 5px #cfcfcf',
      backgroundColor: '#fff',
      fontSize,
      fontStyle: 'italics',
    };

    return (
      <div ref='container' style={{position: 'relative'}}>
        <Categories {...this.props} />
        <svg ref='svg' style={svgStyle} />
        <div ref='hover' style={hoverStyle} />
      </div>
    );
  }
}

export default Regions
