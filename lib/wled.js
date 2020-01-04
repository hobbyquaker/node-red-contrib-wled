const {EventEmitter} = require('events');
const fetch = require('node-fetch');

class Wled extends EventEmitter {
    constructor(address) {
        super();
        this.address = address;
        this.state = {};
        this.hasInfo = false;
        this.isConnected = false;
        this.getInfo();
    }

    setConnectionState(state) {
        if (this.isConnected !== state) {
            this.isConnected = state;
            this.emit(this.isConnected ? 'connected' : 'disconnected');
        }
    }

    getInfo() {
        return fetch(`http://${this.address}/json`)
            .then(res => res.json())
            .then(data => {
                this.state = data.state;
                this.info = data.info;
                this.effects = data.effects;
                this.palettes = data.palettes;
                this.setConnectionState(true);
            })
            .catch(() => {
                this.setConnectionState(false);
            });
    }

    getState() {
        return new Promise((resolve, reject) => {
            fetch(`http://${this.address}/json/state`)
                .then(res => res.json())
                .then(data => {
                    let change = false;
                    // TODO deep compare (segments!)
                    Object.keys(data).forEach(key => {
                        if (this.state[key] !== data[key]) {
                            change = true;
                            this.state[key] = data[key];
                        }
                    });
                    if (change) {
                        this.emit('state', this.state);
                    }

                    resolve();
                    this.setConnectionState(true);
                    if (!this.hasInfo) {
                        this.getInfo();
                    }
                })
                .catch(err => {
                    this.setConnectionState(false);
                    reject(err);
                });
        });
    }

    setState(state) {
        return new Promise((resolve, reject) => {
            fetch(`http://${this.address}/json/state`, {
                method: 'post',
                body: JSON.stringify(state),
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
                    this.setConnectionState(true);
                } else {
                    reject(new Error('no success'));
                }

                if (!this.hasInfo) {
                    this.getInfo();
                }
            }).catch(err => {
                this.setConnectionState(false);
                reject(err);
            });
        });
    }
}

module.exports = Wled;
