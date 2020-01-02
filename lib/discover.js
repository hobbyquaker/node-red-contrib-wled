const dnssd = require('dnssd2');
const fetch = require('node-fetch');

module.exports = function discover(timeout = 4000) {
    return new Promise((resolve, reject) => {
        const wleds = [];
        const browser = dnssd.Browser(dnssd.tcp('http'))
            .on('serviceUp', service => {
                fetch('http://' + service.addresses[0] + '/json')
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.info && data.info.brand === 'WLED') {
                            wleds.push({address: service.addresses[0], name: data.info.name, ver: data.info.ver});
                        }
                    })
                    .catch(() => {});
            })
            .start();

        setTimeout(() => {
            browser.stop();
            if (wleds.length > 0) {
                resolve(wleds);
            } else {
                reject(new Error('no wled found'));
            }
        }, timeout);
    });
};
