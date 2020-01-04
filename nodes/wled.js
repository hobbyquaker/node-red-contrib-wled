const discover = require('../lib/discover');
const Wled = require('../lib/wled');

module.exports = function (RED) {
    RED.httpAdmin.get('/wled/discover', /*RED.auth.needsPermission('wled.read'),*/ (req, res) => {
        discover().then(data => {
            res.status(200).send(data);
        }).catch(err => {
            res.status(500).send(err.message);
        });
    });

    class WledNode {
        constructor(config) {
            RED.nodes.createNode(this, config);

            if (!config.address) {
                this.error('wled address missing');
                return;
            }

            this.log('wled ' + config.address);
            this.wled = new Wled(config.address);

            this.wled.on('connected', () => {
                this.status({fill: 'green', shape: 'dot', text: 'connected'});
            });

            this.wled.on('disconnected', () => {
                this.status({fill: 'red', shape: 'dot', text: 'disconnected'});
            });

            this.on('input', (msg, send, done) => {
                if (typeof msg.payload === 'boolean') {
                    this.wled.setState({on: msg.payload}).then(done).catch(err => done(err.message));
                } else if (typeof msg.payload === 'number') {
                    this.wled.setState({bri: msg.payload}).then(done).catch(err => done(err.message));
                } else if (typeof msg.payload === 'object') {
                    this.wled.setState(msg.payload).then(done).catch(err => done(err.message));
                } else if (typeof msg.payload === 'string') {
                    if (this.wled.effects.includes(msg.payload)) {
                        this.wled.setState({seg: [{fx: this.wled.effects.indexOf(msg.payload)}]}).then(done).catch(err => done(err.message));
                    } else if (this.wled.palettes.includes(msg.payload)) {
                        this.wled.setState({seg: [{pal: this.wled.palettes.indexOf(msg.payload)}]}).then(done).catch(err => done(err.message));
                    } else if (msg.payload.match(/^\d+$/)) {
                        this.wled.setState({ps: parseInt(msg.payload, 10)}).then(done).catch(err => done(err.message));
                    }
                }
            });
        }
    }
    RED.nodes.registerType('wled', WledNode);
};
