const express = require('express');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/scrape', (req, res) => {
  const europeURL = 'https://www.transfermarkt.com/wettbewerbe/europa';
  const mainURL = 'https://www.transfermarkt.com';
  const playerURL = 'https://www.transfermarkt.com/thibaut-courtois/profil/spieler/108390';
  
  const form = { username: 'usr', password: 'pwd', opaque: 'opaque', logintype: '1' };
  
  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
    'Content-Type' : 'application/x-www-form-urlencoded' 
  };

  let leagues =[];
  let teams = [];
  let players = [];

  // ** Request number 1 **
  request({ url: europeURL, form: form, headers: headers }, (err, res, body) => {
    const $ = cheerio.load(body);
    const leagueNames = $('.responsive-table .items tbody .hauptlink tr a')
                          .toArray().filter((elem, i) => i % 2 !== 0);
    
    const leagueNations = $('.responsive-table .items tbody .zentriert img').toArray()
    
    for (let i = 0; i < leagueNames.length; i++) {
      const obj = {
        id: leagueNames[i].attribs.href.split('/', 7)[4],
        title: leagueNames[i].attribs.title,
        nation: leagueNations[i].title,
        href: leagueNames[i].attribs.href
      }
      leagues.push(obj);
    } 
  });

  // Waiting for Request number 1 to finish
  setTimeout(() => {

    // ** Request numeber 2 ** //
    for (let x = 0; x < leagues.length; x++) {
      request({ url: mainURL + leagues[x].href, form: form, headers: headers }, (err, res, body) => {
        const $ = cheerio.load(body);
        const data = $('.responsive-table .items tbody .zentriert .vereinprofil_tooltip').toArray();
        const teamNames = $('.responsive-table .items tbody .hauptlink .vereinprofil_tooltip')
                            .map(function(i, elem) { return $(this).text(); }).get()
                            .join(', ').split(', ').filter((elem, i) =>  i % 2 === 0);  
        
        for (let i = 0; i < data.length; i++) {
          const obj = {
            id: data[i].attribs.href.split('/', 7)[4],
            name: teamNames[i],
            href: data[i].attribs.href
          }
          teams.push(obj);
        }
      })
    }

    setTimeout(() => {
      
      // ** Request numeber 3 **
      // Within the first request in order to get url links to all teams in 
      // the Premier League Loops through the teams array to get the links
      for (let i = 0; i < teams.length; i++) {
        request({ url: mainURL + teams[i].href, form: form, headers: headers }, (err, res, body) => {
          const $ = cheerio.load(body);
          const data = $('span.hide-for-small a.spielprofil_tooltip').toArray();
          for (let j = 0; j < data.length; j++) {
            const obj =  {
              id: data[j].attribs.id,
              name: data[j].attribs.title,
              url: data[j].attribs.href,
              team: {
                id: teams[i].id,
                name: teams[i].name
              }
            }
            players.push(obj);
          } 
        })
      }

      // Timeout set to wait for all threads/callbacks to finish in request nr 3
      // players.json and teams.json files created and data written to them
      setTimeout(() => {
        fs.writeFile('leagues.json', JSON.stringify(leagues, null, 4), (err) => {
          console.log('leagues.json successfully written!');
        })
        fs.writeFile('players.json', JSON.stringify(players, null, 4), (err) => {
          console.log('players.json successfully written!');
        })
        fs.writeFile('teams.json', JSON.stringify(teams, null, 4), (err) => {
          console.log('teams.json successfully written!');
        })
      }, 3000);
    }, 3000);
  }, 3000);

  res.json('Success');
})

const port = 8081;
app.listen(port, () => console.log(`Shit is happening on port ${port}`));

exports = module.exports = app;

