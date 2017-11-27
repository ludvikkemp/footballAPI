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
    const url = 'https://www.transfermarkt.com/fc-liverpool/startseite/verein/31/saison_id/2017/';
    
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
    
    request({ url: url, from: form, headers: headers }, (err, res, body) => {
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

        console.log(players);
   })
   
   res.json(players);
})

app.listen(port, () => console.log(`Shit is happening on port ${port}`));

exports = module.exports = app;