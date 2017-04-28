import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';
import categoryMap from './data/category_map.json';
import isMobile from 'ismobilejs';

var colors = {
  cream: '#fffbf9',
  blue: '#51aae8',
  green: '#52c2ab',
  yellow: '#f7e883',
  red: '#e75d87',
  gray: '#666',
};
var colorScale = chroma.scale([colors.blue, colors.red, colors.yellow, colors.green]);
var categoryScale = d3.scaleOrdinal();

var seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
var seasonsMap = {
  11: 'Winter', // December
  0: 'Winter', // January
  1: 'Winter',
  2: 'Spring', // March
  3: 'Spring',
  4: 'Spring',
  5: 'Summer', // June
  6: 'Summer',
  7: 'Summer',
  8: 'Fall', // September
  9: 'Fall',
  10: 'Fall',
};

var ProcessData = {
  getSeasonTopics(topics) {
    var take = 5;
    return _.chain(seasons)
      .map(season => {
        return _.chain(topics)
          .sortBy(topic => -topic.seasons[season].value)
          .take(take).value();
      }).flatten().value();
  },

  processCategories(data, shouldUpdate) {
    if (shouldUpdate) {
      var domain = _.chain(data)
        .sortBy(d => -d.count)
        .map('name').value();
      var range = _.times(domain.length, i => i * (1 / (domain.length - 1)));
      categoryScale.domain(domain).range(range);
    }

    return _.chain(data)
      .sortBy(category => -category.count)
      .map((category, order) => {
        return Object.assign(category, {
          id: category.name,
          color: colorScale(categoryScale(category.name)),
          name: categoryMap[category.name],
          order,
        });
      }).value();
  },

  processRegions(data) {
    var countries = data.countries;
    // add up values for the country, topic, season
    _.each(countries, country => {
      country.value = 0;
      _.each(country.topics, topic => {
        topic.value = 0;
        // set topic color
        topic.color = topic.category ? colorScale(categoryScale(topic.category)) : colors.gray;
        topic.categoryName = categoryMap[topic.category];
        _.each(topic.seasons, season => {
          season.value = +season.value;
          topic.value += season.value;
          country.value += season.value;
        })
      });
    });

    // and then only take the top 25
    var top = !isMobile.any ? 31 : isMobile.tablet ? 20 : 9;
    // shim in uk bc simon
    var uk = _.find(countries, country => country.country_code === 826);
    uk = uk ? [uk] : [];
    return _.chain(countries)
      .sortBy(region => -region.value)
      .take(top).union(uk).sortBy(region => region.distance)
      .value();
  },

  processTopics(data, topics, source) {
    if (!data.length) return [];
    var startDate = new Date(data[0].start_date);
    startDate = d3.timeMonth.ceil(startDate);

    return _.map(data, result => {
      // first find the source monthly
      var monthly = _.find(result.monthly_regions, region => region.country_code === source);
      monthly = _.map(monthly && monthly.monthly, (d, i) => {
        return {
          value: d,
          date: d3.timeMonth.offset(startDate, i),
        }
      });
      var monthly_all = _.map(result.monthly_all, (d, i) => {
        return {
          value: d,
          date: d3.timeMonth.offset(startDate, i),
        }
      });

      var topic = _.find(topics, topic => topic.topic_code === result.topic_code);
      return Object.assign(result, topic, {monthly, monthly_all});
    });
  },

  // adapted from d3-annotation which is adapted from
  // https://bl.ocks.org/mbostock/7555321
  wrapText(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/[ \t\r\n]+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1, //ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")) || 0,
          tspan = text.text(null)
            .append("tspan")
            .attr("x", 0)
            .attr("dy", dy + "em");

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width && line.length > 1) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan")
            .attr("x", 0)
            .attr("dy", lineHeight + dy + "em").text(word);
        }
      }
    });
  }

};

export default ProcessData;
