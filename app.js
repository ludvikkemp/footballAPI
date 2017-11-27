const express = require('express');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const rp = require('request-promise');
const querystring = require('querystring');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const port = 8081;

app.get('/scrape', (req, res) => {
  const teamURL = 'https://www.transfermarkt.com/fc-liverpool/startseite/verein/31/saison_id/2017/';
  const leagueURL = 'https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1';
  const playerURL = 'https://www.transfermarkt.com/thibaut-courtois/profil/spieler/108390';
  
  const form = {
    username: 'usr',
    password: 'pwd',
    opaque: 'opaque',
    logintype: '1'
  };
  
  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
    'Content-Type' : 'application/x-www-form-urlencoded' 
  };

  let players = [];
  let teams = [];
  let temp = []

  request({ url: leagueURL, from: form, headers: headers }, (err, res, body) => {
    const $ = cheerio.load(body);
    const data = $('.text-right.no-border-rechts.no-border-links').children().toArray();
    
    for (let i = 0; i < data.length; i++) {
      const obj = {
        id: data[i].attribs.id,
        name: data[i].attribs.href.split('/',3)[1],
        href: data[i].attribs.href
      }
      temp.push(obj);
    }
    // TODO: HERE I AM STUCK ATM!!!
    // Duplicate teams in teams array
    teams = temp.filter((item, pos) => {
      return temp.indexOf(item) == pos;
    })
    console.log(teams.length)
  })

  request({ url: teamURL, from: form, headers: headers }, (err, res, body) => {
    const $ = cheerio.load(body);
    const data = $('span.hide-for-small a.spielprofil_tooltip').toArray();
    
    for (let i = 0; i < data.length; i++) {
      const obj =  {
        id: data[i].attribs.id,
        name: data[i].attribs.title,
        url: data[i].attribs.href
      }
      players.push(obj);
    }

    //console.log(players);
    /*
    fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
      
      console.log('File successfully written! - Check your project directory for the output.json file');
      
    })
    */
  })
  
  res.json(players);
})

app.listen(port, () => console.log(`Shit is happening on port ${port}`));

exports = module.exports = app;