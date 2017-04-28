import _ from 'lodash';

var Sections = {
  intros: (data) => {
    var targets = _.chain(data.options.targets)
      .take(5).map('label').value().join(', ');

    return `
Since Google started keeping track in 2004, people have searched for places in ${targets}...they've searched for cities and islands, for ski resorts and national parks, for Disneylands and modern art museums all over the world.

We looked into travel searches from nearly **${_.round(data.stats.sources, -1)}** countries to explore what one country searched for in another; did they search for places closer or farther from them?  Did they search more for resorts than national parks, more for Disneyland than for museums?

**We wanted to know: what can we learn about these countries from their travels?**
    `;
  },
  basics: (data) => {
    var cities = _.find(data.intros.categories, d => d.id === 'city').count - 4;
    return `
Let's take a look at what the **United States** has searched for.

It turns out, the U.S. searches the most for different cities around the world: Naples (Italy) and Barcelona (Spain) in the Spring, Cebu (Philippines) and Chiang Mai (Thailand) in the Winter, and **${cities}** others over the years.

After cities, the U.S. searches most for attractions like Machu Picchu in Peru, the Colosseum in Italy, castles in Germany, and amusement parks in the U.S. History and the arts were searched for the least.
    `;
  },
  regions1: (data) => {
    return `
When we first started looking at the countries, we were curious about whether distance affected people's searches; do people in the U.S. search more for places in Canada or Mexico for vacation, or more in faraway "exotic" places?

Turns out, distance doesn't make much of a difference.  There doesn't seem to be much of a trend in terms of U.S. searches for Central America versus Europe or Asia (in fact, it seems Europe and Asia have higher search interest overall).

There is, however, a very clear seasonal trend.  The U.S. searches for almost every place around the world in the Spring (except for Egypt), presumably for spring break and summer vacation planning.  The opposite is true in the Fall, where inbound search interest for Egypt peaks as the weather cools, but drops for everywhere else in the world (most likely because of back-to-school and lack of long breaks in the fall).
    `;
  },
  regions2: (data) => {
    return `
<sup>(Try toggling between Spring and Fall ↑)</sup>

Another interesting pattern: the U.S. searches for Canada to the north in the Summer, and Mexico to the south in the Winter.  Similarly, hotter regions around the world - Central America, Southeast Asia - are searched much less in the Summer than in the Winter.
    `;
  },
  regions3: (data) => {
    return `
<sup>(Try toggling between Summer and Winter ↑)</sup>

And though the U.S. doesn't seem to have a clear trend in terms of distance, there are other countries like Japan, Singapore, and Saudi Arabia that do search primarily for countries closer to them.
    `;
  },
  topics1: (data) => {
    return `
On top of the seasonality, we were also interested in seeing if there were any patterns year over year - especially if there were any extreme peaks or dips.  We found that most of the trends were economical or political in nature; U.S. searches for more expensive destinations (mostly in Europe) were highest in the early 2000s, and have been declining since 2008, the year of the financial crisis.  Searches for Cairo peaked in January 2011 not because of travel interests but because of Arab Spring, and Athens and Beijing peaked in 2004 and 2008 respectively for the Summer Olympics.

But there are also fascinating patterns that have nothing to do with politics.  Take for example, the search interest for China's [Terra Cotta soldiers](https://www.google.com/#q=Terracotta+Army):
    `;
  },
  topics2: (data) => {
    return `
Notice the two spikes in searches, one along the gray World line in late 2007 and another along the red U.S. line in early 2010.  The first spike is the United Kingdom searching for the [British Museum](https://www.britishmuseum.org/?ref=header)'s special exhibit, ["The First Emperor: China's Terracotta Army"](https://www.britishmuseum.org/about_us/news_and_press/press_releases/2007/the_first_emperor.aspx), that ran from September 2007 to April 2008 (and the U.S. had no interest).  The second is [National Geographic Museum](http://www.nationalgeographic.org/dc/)'s exhibit in Washington D.C., ["Terra Cotta Warriors: Guardians of China’s First Emperor"](http://press.nationalgeographic.com/2009/11/17/terra-cotta-warriors-guardians-of-chinas-first-emperor-to-open-at-national-geographic-museum-on-nov-19/), that ran November 2009 to March 2010.

<sup>(Scrub to both 2007 and 2010 with the progress bar and watch the U.K. and U.S. bubbles burst ↑)</sup>

Now take a look at the searches for China's first emperor, [Qin Shi Huang](https://www.google.com/#q=Qin+Shi+Huang):
    `;
  },
  topics3: (data) => {
    return `
There's a clear seasonality to U.S.'s searches for Qin Shi Huang, with steady interest from Fall to Spring and a dip in the summer, but there isn't a similar trend for the rest of the world.  And it's curious: why would there even *be* seasonality searching for a person?

The answer is in the Terra Cotta soldiers' searches:
    `;
  },
  topics4: (data) => {
    return `
If we look closer and ignore the two spikes, it turns out the U.S.'s searches for Terra Cotta soldiers have a similar seasonality to that of Qin Shi Huang; starting in 2011, there's a dip in search interest every summer.  So the United States searches for Qin Shi Huang because they are interested in his Terra Cotta soldiers - which is fascinating, not only because the rest of the world doesn't exhibit this behavior, but also because "Qin Shi Huang" just seems like the harder of the two search terms to remember.
    `;
  },
  footer1: (data) => {
    return `
# Team

Google News Lab<br />
[Simon Rogers](http://simonrogers.net/), [Alberto Cairo](http://www.thefunctionalart.com/)

Sketch, Code, Design<br />
[Shirley Wu](http://sxywu.com/)

Data<br />
[Charles Liu](https://www.linkedin.com/in/charles-liu-929bb077/)

Paper Airplanes<br />
[Allison Wong](http://sleepypandie.net/)

Header Font<br />
[Catherine Madden](http://catherinemaddenrelay.com/)
    `;
  },
  footer2: (data) => {
    return `
# datasketches

Check out [Nadieh's counterpart](http://www.beautifulinenglish.com/), who, in our typical datasketch|es style, also tackled the *Culture* topic by looking at the words most frequently translated into English from other languages.

# Share
[Twitter](https://twitter.com/home?status=Explore%20adventure%3A%20a%20decade%20of%20Google%20travel%20searches%20http%3A//explore-adventure.com/)<br />
[Google+](https://plus.google.com/share?url=http%3A//explore-adventure.com/)<br />
[Facebook](https://www.facebook.com/sharer/sharer.php?u=http%3A//explore-adventure.com/)<br />
    `;
  },
  footer3: (data) => {
    return `
# Methodology

We used [Google Trends](https://trends.google.com/trends/) to query for all the countries that have searched for another country's *Tourist Destinations* since 2004.  For each of those source and destination countries, we got the search interests of the topics they looked for.

We also used [Google Knowledge Graph](https://developers.google.com/knowledge-graph/reference/rest/v1/) to get details on each topic, and to infer their categorization.

For behind-the-scenes magic, read the [whole story on datasketch|es](http://www.datasketch.es/march/).
    `;
  }
};

export default Sections;
