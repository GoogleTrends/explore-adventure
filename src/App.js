import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import Remarkable from 'remarkable';
import isMobile from 'ismobilejs';

import ProcessData from './ProcessData';
import Intro from './Intro';
import Basics from './visualizations/Basics';
import RegionIntro from './visualizations/RegionIntro';
import Regions from './visualizations/Regions';
import Country from './visualizations/Country';
import Topic from './visualizations/Topic';
import Categories from './Categories';
import Sections from './Sections';

import airplane_img from './images/airplane.jpg';
var colors = {
  cream: '#fffbf9',
  blue: '#51aae8',
  green: '#52c2ab',
  yellow: '#f7e883',
  red: '#e75d87',
  gray: '#333',
};

var isMobileAny = isMobile.any;
var isMobilePhone = isMobile.phone;
var isMobileTablet = isMobile.tablet;
var margin = {top: 20, left: 20};
var width = !isMobileAny ? 1000 : window.innerWidth - 2 * margin.left;
var svgWidth = !isMobileAny ? width * 0.7 : width;
var imgWidth = !isMobileAny ? width * 0.3 : width;
var contentWidth = !isMobileAny ? width * 0.6 : width;
var dotSize = 9;
var url = 'http://35.185.209.202/';
var md = new Remarkable({linkTarget: '_new', html: true});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {},
      options: {},
      intros: {},
      categories: [],
      regions: [],
      topics: [],
      type: 'source',
      source: 840,
      sourceName: 'United States',
      season: 'Spring',
      target: null,
      targetName: null,
      category: null,
    };

    this.toggleType = this.toggleType.bind(this);
    this.selectCategories = this.selectCategories.bind(this);
    this.selectSource = this.selectSource.bind(this);
    this.selectTarget = this.selectTarget.bind(this);
    this.clearTarget = this.clearTarget.bind(this);
    this.selectSeason = this.selectSeason.bind(this);
  }

  componentWillMount() {
    this.getStats();
    this.getCategories(() => {
      // only get the rest of the data once we have the categories
      this.getIntroData();
      this.getCountryRegions(this.state.type, this.state.source, this.state.sourceName);
    });
  }

  getStats() {
    var apiUrl = url + '/stats';
    d3.json(apiUrl, (err, data) => {
      if (err) return;

      var stats = {
        topics: data.num_topics,
        sources: data.sources.length,
        targets: data.targets.length,
      }

      var sources = _.chain(data.sources)
        .sortBy(source => -source.count)
        .map(source => {
          return {value: source.code, label: source.name};
        }).value();
      var targets = _.chain(data.targets)
        .sortBy(target => -target.count)
        .map(target => {
          return {value: target.code, label: target.name}
        }).value();
      var options = {sources, targets};
      this.setState({stats, options});
    });
  }

  getCategories(callback) {
    var apiUrl = url + '/categories';
    d3.json(apiUrl, (err, data) => {
      if (err) return;
      var categories = ProcessData.processCategories(data, true);

      callback();
      this.setState({categories});
    });
  }

  getIntroData() {
    // get US target topics
    var apiUrl = url + '/countries/840/target_topics';
    d3.json(apiUrl, (err, data) => {
      if (err) return;
      var regions = ProcessData.processRegions(data);

      // get the two topics we'll introduce
      var china = _.find(data.countries, region => region.country_code === 156);
      var topicIds = ['/m/0131pq', '/m/0pf00'];
      var topicsURI = encodeURIComponent(JSON.stringify(topicIds));
      var topics = _.map(topicIds, topicId =>
        _.find(china.topics, topic => topic.topic_code === topicId));
      var apiUrl = url + '/topics?topic_codes=' + topicsURI;

      d3.json(apiUrl, (err, data) => {
        topics = ProcessData.processTopics(data, topics, 840);

        // finally, get the categories
        var apiUrl = url + '/categories?source_country_id=840';
        d3.json(apiUrl, (err, data) => {
          var categories = ProcessData.processCategories(data);

          var intros = {regions, topics, categories};
          this.setState({intros});
        });
      });
    });
  }

  getCountryRegions(type, source, sourceName) {
    var urlType = type === 'source' ? 'target_topics' : 'source_topics'; // want to be getting the opposite
    var apiUrl = url + '/countries/' + source + '/' + urlType;
    d3.json(apiUrl, (err, data) => {
      if (err) return;

      var regions = ProcessData.processRegions(data);

      // get topics for the whole world
      var topics = _.chain(regions).map('topics').flatten().value();
      topics = ProcessData.getSeasonTopics(topics);
      var topicIds = _.map(topics, 'topic_code');
      var topicsURI = encodeURIComponent(JSON.stringify(topicIds));
      var apiUrl = url + '/topics?topic_codes=' + topicsURI;

      d3.json(apiUrl, (err, data) => {
        topics = ProcessData.processTopics(data, topics);
        this.setState({regions, type, source, sourceName, category: null,
          target: null, targetName: null, season: 'Spring', topics});
      });
    });
  }

  toggleType() {
    var type = this.state.type === 'source' ? 'target' : 'source';
    this.getCountryRegions(type, this.state.source, this.state.sourceName);
  }

  selectSource(d) {
    var source = d.value;
    var sourceName = d.label;
    this.getCountryRegions(this.state.type, source, sourceName);
  }

  selectTarget(target, targetName, topics) {
    var topicIds = _.map(topics, 'topic_code');
    var topicsURI = encodeURIComponent(JSON.stringify(topicIds));
    var apiUrl = url + '/topics?topic_codes=' + topicsURI;

    d3.json(apiUrl, (err, data) => {
      var source = this.state.type === 'source' ? this.state.source : target;
      topics = ProcessData.processTopics(data, topics, source);
      this.setState({target, targetName, topics});
    });
  }

  clearTarget() {
    var topics = _.chain(this.state.regions).map('topics').flatten().value();
    topics = ProcessData.getSeasonTopics(topics);
    var topicIds = _.map(topics, 'topic_code');
    var topicsURI = encodeURIComponent(JSON.stringify(topicIds));
    var apiUrl = url + '/topics?topic_codes=' + topicsURI;

    d3.json(apiUrl, (err, data) => {
      topics = ProcessData.processTopics(data, topics);
      this.setState({target: null, targetName: null, topics});
    });
  }

  selectSeason(season) {
    this.setState({season});
  }

  selectCategories(category) {
    if (category === this.state.category) {
      category = null;
    }
    this.setState({category});
  }

  renderBasics(props, headerStyle, backgroundStyle, sectionsStyle) {
    return (
      <div>
        <div style={headerStyle}>
          <div className='header' style={{fontSize: 42, margin: 0}}>Cities</div>
          <span style={backgroundStyle}>
            are the most searched for Category
          </span>
        </div>
        <div className='header' style={{fontSize: 22, fontWeight: 600, color: colors.blue,
          paddingTop: 2 * margin.top, paddingBottom: margin.top / 2}}>
          How To Read This Project:
        </div>
        <Basics {...props} {...this.state} />
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.basics(this.state))}} />
      </div>
    );
  }

  renderRegionsIntro(props, headerStyle, backgroundStyle, sectionsStyle) {
    return (
      <div>
        <div style={headerStyle}>
          <span style={backgroundStyle}>
            The United States loves traveling in the
          </span>
          <div className='header' style={{fontSize: 42, lineHeight: 2, margin: 0}}>Spring</div>
        </div>
        <div className='header' style={{fontSize: 22, fontWeight: 600, color: colors.blue,
          paddingTop: 2 * margin.top, paddingBottom: margin.top / 2}}>
          How To Read This Project:
        </div>
        <RegionIntro {...props} {...this.state} />
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.regions1(this.state))}} />
        <div className='header' style={{fontSize: 24, fontWeight: 600}}>
          Topics U.S. Searched for in Spring and Fall
        </div>
        <Regions {...props} {...this.state} seasons={['Spring', 'Fall']}
          display={true} data={this.state.intros.regions} />
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.regions2(this.state))}} />
        <div className='header' style={{fontSize: 22, fontWeight: 600}}>
          Topics U.S. Searched for in Summer and Winter
        </div>
        <Regions {...props} {...this.state} seasons={['Summer', 'Winter']}
          display={true} data={this.state.intros.regions} />
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.regions3(this.state))}} />
      </div>
    );
  }

  renderTopicIntro(props, headerStyle, backgroundStyle, sectionsStyle) {
    var timeFormat = d3.timeFormat('%m/%d/%Y');
    var worldTop = _.maxBy(this.state.intros.topics[0].monthly_all, 'value');
    var usTop = _.maxBy(this.state.intros.topics[0].monthly, 'value');
    var dips = ['07/01/2005', '07/01/2011', '07/01/2013',
      '07/01/2014', '07/01/2015', '07/01/2016'];
    var annotations0 = [];
    var annotations1 = [];
    _.each(dips, date => {
      var annotation = _.find(this.state.intros.topics[0].monthly, month =>
        date === timeFormat(month.date));
      annotations0.push(annotation);
      annotation = _.find(this.state.intros.topics[1].monthly, month =>
        date === timeFormat(month.date));
      annotations1.push(annotation);
    });

    return (
      <div>
        <div style={headerStyle}>
          <div className='header' style={{fontSize: 42, margin: 0}}>
            Qin Shi Huang
          </div>
          <span style={backgroundStyle}>
            and his Terracotta soldiers
          </span>
        </div>
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.topics1(this.state))}} />
        <div className='header' style={{fontSize: 24, fontWeight: 600, paddingBottom: margin.top}}>
          U.S. and World Searches for Terracotta Soldiers
        </div>
        <Topic {...props} {...this.state} display={true} expanded={true}
          svgWidth={width} annotations={[worldTop, usTop]} data={this.state.intros.topics[0]} />
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.topics2(this.state))}} />
        <div className='header' style={{fontSize: 24, fontWeight: 600, paddingBottom: margin.top}}>
          U.S. and World Searches for Qin Shi Huang
        </div>
        <Topic {...props} {...this.state} display={true}
          svgWidth={width} annotations={annotations1} data={this.state.intros.topics[1]} />
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.topics3(this.state))}} />
        <div className='header' style={{fontSize: 24, fontWeight: 600, paddingBottom: margin.top}}>
          U.S. and World Searches for Terracotta Soldiers
        </div>
        <Topic {...props} {...this.state} display={true}
          svgWidth={width} annotations={annotations0} data={this.state.intros.topics[0]} />
        <div style={sectionsStyle}
          dangerouslySetInnerHTML={{ __html: md.render(Sections.topics4(this.state))}} />
      </div>
    );
  }

  renderExplore(props, headerStyle, backgroundStyle, sectionsStyle) {
    var regionStyle = {
      margin: '20px 0',
      padding: '20px 0',
      // boxShadow: '0 0 5px #cfcfcf',
    };
    var regionHeaderStyle = {
      width,
      margin: 'auto',
    };
    var fontSize = 16;
    var arrowStyle = {
      margin: '0px auto 20px auto',
      borderRadius: 2 * fontSize,
      color: '#fff',
      backgroundColor: colors.blue,
      lineHeight: 2 * fontSize + 'px',
      fontSize,
      cursor: 'pointer',
      display: 'inline-block',
      padding: '0 10px',
      fontFamily: 'CatMule Caps',
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
    }
    var worldStyle = {
      display: 'inline-block',
      backgroundColor: '#fff',
      borderRadius: 4,
      border: '1px solid #ccc',
      // borderBottom: '1px solid #ccc',
      height: 36,
      width: 200,
      lineHeight: '36px',
      verticalAlign: 'top',
    }
    var underlineStyle = {
      borderBottom: '2px solid',
    }

    var country;
    var header;
    if (this.state.type === 'source') {
      country = _.find(this.state.options.sources, source => source.value === this.state.source);
      country = country && country.label;
      header = (
        <div>
          <span style={titleStyle}>
            Countries
          </span> <Select className='header' name='form-country' value={this.state.source} options={this.state.options.sources}
            clearable={false} onChange={this.selectSource} /> <span style={titleStyle}>
            searches for around the <span style={underlineStyle}>World</span>
          </span>
        </div>
      );
    } else {
      country = _.find(this.state.options.targets, target => target.value === this.state.source);
      country = country && country.label;
      header = (
        <div>
          <span style={titleStyle}>
            Countries around the <span style={underlineStyle}>World</span> that search for
          </span> <Select className='header' name='form-country' value={this.state.source} options={this.state.options.targets}
              clearable={false} onChange={this.selectSource} />
          <span style={titleStyle}>
          </span>
        </div>
      );
    }

    var topics = _.chain(this.state.topics)
      .filter(topic => topic.seasons[this.state.season].order < 2 &&
        (!this.state.category || topic.category === this.state.category))
      .sortBy(topic => -topic.seasons[this.state.season].value)
      .map((topic, index) => Object.assign(topic, {index}))
      .value();
    var target = (<Country {...props} {...this.state} data={topics} />);

    return (
      <div id='explore'>
        <div style={headerStyle}>
          <span style={backgroundStyle}>
            Explore
          </span>
          <div className='header' style={{fontSize: 42, lineHeight: 2, margin: 0}}>
            Adventure
          </div>
          <br />
          ↑<br />
          <a href='#top'><em>Top</em></a>
        </div>
        <div style={regionStyle}>
          <div style={regionHeaderStyle}>
            <span style={arrowStyle} onClick={this.toggleType}>⇄ vice versa</span>
            {header}
          </div>
          <Regions {...props} {...this.state} data={this.state.regions} />
        </div>
        {target}
      </div>
    )
  }

  render() {
    if (_.isEmpty(this.state.stats) || _.isEmpty(this.state.intros)) {
      // if everything hasn't yet loaded
      var height = 300;
      var style = {
        height,
        lineHeight: height + 'px',
        marginTop: (window.innerHeight - height) / 2 - 100,
        backgroundColor: colors.blue,
        color: '#fff',
        padding: '80px 0',
        backgroundImage: 'url("' + airplane_img + '")',
        backgroundSize: '1000px',
        backgroundPosition: 'center top',
        fontSize: 80,
        textAlign: 'center',
      };

      return (
        <div className='header' style={style}>
Loading...
        </div>
      );
    }

    var style = {
      margin: 'auto',
      textAlign: 'center',
    };
    var headerStyle = {
      backgroundColor: colors.blue,
      color: '#fff',
      fontSize: 16,
      padding: '80px 0',
      backgroundImage: 'url("' + airplane_img + '")',
      backgroundSize: '500px',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
    };
    var backgroundStyle = {
      background: colors.blue,
      lineHeight: 2,
      padding: '2px 5px',
    }
    var sectionsStyle = {
      width: contentWidth,
      margin: '40px auto',
      textAlign: 'left',
      lineHeight: 2,
    };
    var footerStyle = {
      display: 'inline-block',
      maxWidth: !isMobileAny ? width / 3 : width,
      width: !isMobileAny ? 'auto' : width,
      margin: 'auto',
      textAlign: 'left',
      lineHeight: 2,
      fontSize: 12,
      padding: !isMobileAny ? '80px 0 80px 40px' : 0,
      verticalAlign: 'top',
    };
    var props = {
      dotSize,
      colors,
      width, svgWidth, contentWidth, imgWidth,
      selectTarget: this.selectTarget,
      clearTarget: this.clearTarget,
      selectCategories: this.selectCategories,
      selectSeason: this.selectSeason,
      isMobileAny, isMobilePhone, isMobileTablet,
    };

    return (
      <div className="App" style={style}>
        <div>
          <Intro {...props} {...this.state} />
          <div style={sectionsStyle}
            dangerouslySetInnerHTML={{ __html: md.render(Sections.intros(this.state))}} />
        </div>
        {this.renderBasics(props, headerStyle, backgroundStyle, sectionsStyle)}
        {this.renderRegionsIntro(props, headerStyle, backgroundStyle, sectionsStyle)}
        {this.renderTopicIntro(props, headerStyle, backgroundStyle, sectionsStyle)}
        {this.renderExplore(props, headerStyle, backgroundStyle, sectionsStyle)}
        <div className='Footer' style={{backgroundColor: colors.blue, color: '#fff'}}>
          <div style={{width, margin: 'auto'}}>
            <div style={footerStyle}
              dangerouslySetInnerHTML={{ __html: md.render(Sections.footer1(this.state))}} />
            <div style={footerStyle}
              dangerouslySetInnerHTML={{ __html: md.render(Sections.footer2(this.state))}} />
            <div style={footerStyle}
              dangerouslySetInnerHTML={{ __html: md.render(Sections.footer3(this.state))}} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
