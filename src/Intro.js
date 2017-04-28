import React, { Component } from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import {TimelineMax} from 'gsap';
import 'gsap/TextPlugin';
import google_logo from './images/google_logo.svg';
import airplane_img from './images/airplane.jpg';

var duration = 1;
var y = 50;

class Intro extends Component {

  constructor(props) {
    super(props);

    this.timeline = new TimelineMax({repeat: -1});
  }

  componentWillMount() {
    // randomly get some topics
    this.topics = [];
    var targets = this.props.intros.regions;
    _.times(20, i => {
      var target = targets[_.random(targets.length)];
      if (!target) return;
      var topic = target.topics[_.random(target.topics.length)];
      if (!topic) return;
      this.topics.push(topic);
    });

    this.topics = _.uniqBy(this.topics, topic => topic.topic_code);
  }

  componentDidMount() {
    // if mobile, don't animate the topics
    if (this.props.isMobilePhone) return;

    this.hidden = d3.select(this.refs.hidden);
    _.times(this.topics.length, i => {
      var topic1 = this.topics[i];
      var topic2 = this.topics[i + 1] || this.topics[0];
      var label = 'label' + (i + 1);

      this.animateTopics(topic1, topic2, label);
    });
  }

  animateTopics(topic1, topic2, label) {
    var text1 = topic1.topic + ' - ' + topic1.country;
    var text2 = topic2.topic + ' - ' + topic2.country;
    var color1 = topic1.color.css();
    var color2 = topic2.color.css();
    var width1 = this.hidden.text(text1).node().offsetWidth;
    var width2 = this.hidden.text(text2).node().offsetWidth;

    this.timeline.add(label);
    this.timeline
      .fromTo(this.refs.animate1, duration / 4,
        {x: -width1 / 2, y: 0, opacity: 1, text: text1, color: color1},
        {x: -width1 / 2, y: -1 * y, opacity: 0, text: text1, color: color1},
        label + '+=' + duration * 0.75
      );
    this.timeline
      .fromTo(this.refs.animate2, duration / 4,
        {x: -width2 / 2, y: y, opacity: 0, text: text2, color: color2},
        {x: -width2 / 2, y: 0, opacity: 1, text: text2, color: color2},
        label + '+=' + duration * 0.75
      );
  }

  render() {
    var style = {
      padding: '50px 0',
      color: '#fff',
      backgroundColor: this.props.colors.blue,
      backgroundImage: 'url("' + airplane_img + '")',
      backgroundSize: '1000px',
      // boxShadow: '0 0 10px #cfcfcf',
    };
    var animateDivStyle = {
      position: 'relative',
      margin: 20,
      height: 36,
    }
    var animateStyle = {
      position: 'absolute',
      display: 'inline-block',
      // width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 1)',
      padding: '5px 10px',
    };
    var hideStyle = {
      position: 'absolute',
      display: 'inline-block',
      padding: '5px 10px',
      visibility: 'hidden',
    }
    var headerStyle = {
      fontSize: 42,
      marginBottom: 0,
      lineHeight: 1.6,
    };
    var logoHeight = 36;
    var googleStyle = {
      borderBottom: 'none',
      display: 'inline-block',
      height: logoHeight,
      verticalAlign: 'middle',
    };
    var textStyle = {
      width: this.props.contentWidth,
      margin: '40px auto',
      textAlign: 'center',
      lineHeight: 1.6,
      fontSize: 16,
    };
    var backgroundStyle = {
      background: this.props.colors.blue,
      lineHeight: 2,
      padding: '2px 5px',
    }

    var animateDiv = null;
    if (!this.props.isMobilePhone) {
      animateDiv = (
        <div style={animateDivStyle}>
          <div style={animateStyle} ref='animate2' />
          <div style={animateStyle} ref='animate1' />
        </div>
      );
    }
    var numTopics = this.props.stats.topics || 0;
    var numTargets = this.props.stats.targets || 0;

    return (
      <div className='Intro' id='top' style={style}>
        <div ref='hidden' style={hideStyle} />
        {animateDiv}
        <h1 style={headerStyle}>
          <span style={backgroundStyle}>
            Explore Adventure
          </span>
        </h1>
        <div>
          <span style={backgroundStyle}>
            <a href='http://twitter.com/sxywu' target='_new'>SHIRLEY WU</a><br />
            for <a href='https://newslab.withgoogle.com/' target='_new' style={googleStyle}>
              <img src={google_logo} height={logoHeight} />
            </a>
          </span>
        </div>
        <div style={textStyle}>
          <span style={backgroundStyle}>
            In the last decade, people around the world have searched for
            more than <strong>{d3.format(',')(numTopics)}</strong> travel destinations across <strong>{numTargets}</strong> countries.
            <br />
            <br />
            We dug into that search data.
            <br />
            <br />
            ↓<br />
            <em>Keep reading or<br />
            <a href='#explore'>Get exploring</a></em><br />
          </span>
        </div>
      </div>
    );
  }
}


export default Intro;
