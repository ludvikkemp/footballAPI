const express = require('express');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/scrape', (req, res) => {
  const leagueURL = 'https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1';
  const teamURL = 'https://www.transfermarkt.com/fc-liverpool/startseite/verein/31/saison_id/2017/';
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

  request({ url: leagueURL, form: form, headers: headers }, (err, res, body) => {
    const $ = cheerio.load(body);
    const data = $('.responsive-table .items tbody .zentriert .vereinprofil_tooltip').toArray();
    const teams = [];
    for (let i = 0; i < data.length; i++) {
      const obj = {
        id: data[i].attribs.href.split('/', 7)[4],
        name: data[i].attribs.href.split('/', 7)[1],
        href: data[i].attribs.href
      }
      teams.push(obj);
    }
    //console.log(teams)
  })

  request({ url: teamURL, form: form, headers: headers }, (err, res, body) => {
    const $ = cheerio.load(body);
    const data = $('span.hide-for-small a.spielprofil_tooltip').toArray();
    const players = [];
    for (let i = 0; i < data.length; i++) {
      const obj =  {
        id: data[i].attribs.id,
        name: data[i].attribs.title,
        url: data[i].attribs.href
      }
      players.push(obj);
    }
    //console.log(players)
  })
  
  res.json('Success');
})

const port = 8081;
app.listen(port, () => console.log(`Shit is happening on port ${port}`));

exports = module.exports = app;

