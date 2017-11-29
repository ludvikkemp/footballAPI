const express = require('express');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Global Variables
const europeURL = 'https://www.transfermarkt.com/wettbewerbe/europa';
const mainURL = 'https://www.transfermarkt.com';
let leagues = [];
let teams = [];
let players = [];
let playersInfo = [];

// Form and headers for pretending to be a browser
// in order to be able to scrape transfermarkt for data
const form = { username: 'usr', password: 'pwd', opaque: 'opaque', logintype: '1' };
const headers = { 
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
  'Content-Type' : 'application/x-www-form-urlencoded' 
};

// *** 1.Scrape Leagues *** //
app.get('/1', (req, res) => {
  request({ url: europeURL, form: form, headers: headers }, (err, res, body) => {
    const $ = cheerio.load(body);
    const leagueNames = $('.responsive-table .items tbody .hauptlink tr a')
                          .toArray().filter((elem, i) => i % 2 !== 0);
    const leagueNations = $('.responsive-table .items tbody .zentriert img').toArray()
    
    for (let i = 0; i < leagueNames.length; i++) {
      const obj = {
        id: leagueNames[i].attribs.href.split('/', 7)[4],
        title: leagueNames[i].attribs.title,
        nation: leagueNations[i].attribs.title,
        href: leagueNames[i].attribs.href
      }
      leagues.push(obj);
    }
  });

  setTimeout(() => {
    fs.writeFile('leagues.json', JSON.stringify(leagues, null, 4), (err) => {
      console.log('leagues.json successfully written!');
    })
  }, 1000)

  res.json({message:'Success'});
})

// *** 2.Scrape Teams *** //
app.get('/2', (req, res) => {
  if (leagues.length === 0) 
    res.json({Error: 'You must call api/1 first'}); 
  
  for (let i = 0; i < leagues.length; i++) {
    request({ url: mainURL + leagues[i].href, form: form, headers: headers }, (err, res, body) => {
      const $ = cheerio.load(body);
      const data = $('.responsive-table .items tbody .zentriert .vereinprofil_tooltip').toArray();
      const teamNames = $('.responsive-table .items tbody .hauptlink .vereinprofil_tooltip')
                          .map(function(i, elem) { return $(this).text(); }).get()
                          .join(', ').split(', ').filter((elem, i) =>  i % 2 === 0);
      
      for (let j = 0; j < data.length; j++) {
        const obj = {
          id: data[j].attribs.href.split('/', 7)[4],
          name: teamNames[j],
          href: data[j].attribs.href,
          league: {
            id: leagues[i].id,
            title: leagues[i].title,
            nation: leagues[i].nation,
          }
        }
        teams.push(obj);
      }
    })
    
  }

  setTimeout(() => {
    fs.writeFile('teams.json', JSON.stringify(teams, null, 4), (err) => {
      console.log('teams.json successfully written!');
    })
  }, 12000)
  
  res.json({message:'Success'});
})

// *** 3.Scrape Players *** //
app.get('/3', (req, res) => {
  if (teams.length === 0) 
    res.json({Error: 'You must call api/2 first'});
  
  for (let i = 0; i < teams.length; i++) {
    request({ url: mainURL + teams[i].href, form: form, headers: headers }, (err, res, body) => {
      console.log(mainURL + teams[i].href)
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

  setTimeout(() => {
    fs.writeFile('playersLite.json', JSON.stringify(players, null, 4), (err) => {
      console.log('playersLite.json successfully written!');
    })
  }, 20000)
  
  res.json({message:'Success'});
})

// *** 4.Scrape Player Stats *** //
app.get('/4', (req, res) => {
  // Not working !!
  if (players.length === 0) 
    res.json({Error: 'You must call api/3 first'});

  console.log('players.lenght: ',players.length);
  console.log('players[1].url: ',players[1].url);
  console.log('mainURL + players[1].url: ',mainURL + players[1].url);
  /*
  for (let i = 0; i < players.length; i++) {
    request({ url: mainURL + players[i].url, form: form, headers: headers }, (err, res, body) => {
      const $ = cheerio.load(body);
      const data = $('.dataHeader .dataContent .dataDaten p span')
                    .map(function(i, elem) { return $(this).text()
                      .replace(/[\n\t\r]/g,"").trim(); });
      console.log(i);
                      
      const obj = {
        personal: {
          dateOfBirth: data[1],
          placeOfBirth: data[3],
          nationality: data[6],
          height: data[9],
          position: data[11],
          contractExpires: data[13],
          caps: data[17].split('/')[0],
          goals: data[17].split('/')[1]
        }
      }
      playersInfo.push(obj);
      
    })
  }

  setTimeout(() => {
    fs.writeFile('playersInfo.json', JSON.stringify(playersInfo, null, 4), (err) => {
      console.log('playersInfo.json successfully written!');
    })
  }, 30000)
  */
  res.json({message:'Success'});
})

const port = 8081;
app.listen(port, () => console.log(`Shit is happening on port ${port}`));

exports = module.exports = app;