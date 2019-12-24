const discover = require('./lib/discover');
const Wled = require('./lib/wled');

/*
discover().then(res => {
    console.log(res);
});
*/

const wled = new Wled('172.16.23.222');
wled.addListener('state', state => {
    console.log(state);
});
wled.setState({'ps': 2});

