const {EventEmitter} = require('events');
const fetch = require('node-fetch');

class Wled extends EventEmitter {
    constructor(address) {
        super();
        this.address = address;
        this.state = {};
        this.getInfo();
    }
    getInfo() {
        return fetch(`http://${this.address}/json`)
            .then(res => res.json())
            .then(data => {
                this.state = data.state;
                this.info = data.info;
                this.effects = data.effects;
                this.palettes = data.palettes;
            });
    }
    getState() {
        return fetch(`http://${this.address}/json/state`)
            .then(res => res.json())
            .then(data => {
                let change = false;
                Object.keys(data).forEach(key => {
                    if (this.state[key] !== data[key]) {
                        change = true;
                        this.state[key] = data[key];
                    }
                });
                if (change) {
                    this.emit('state', this.state);
                }
            });
    }
    setState(state) {
        return new Promise((resolve, reject) => {
            fetch(`http://${this.address}/json/state`, {
                    method: 'post',
                    body:    JSON.stringify(state),
                    headers: {'Content-Type': 'application/json'}
                }).then(res => res.json()).then(data => {
                    if (data && data.success) {
                        let change = false;
                        Object.keys(state).forEach(key => {
                            if (this.state[key] !== state[key]) {
                                change = true;
                                this.state[key] = state[key];
                            }
                        });
                        if (change) {
                            this.emit('state', this.state);
                        }
                        resolve();
                    } else {
                        reject();
                    }
                }).catch(reject);
        });
    }
}

module.exports = Wled;