
exports.processWindowTilt = function (id, control, name, room, func, _obj, objects) {
    const entity = this._processCommon(name, room, func, _obj, 'sensor');

    const state = control.states.find(s => s.id && s.name === 'ACTUAL');
    entity.context.STATE = {getId: null};
    entity.attributes.icon = 'mdi:window-maximize';
    entity.attributes.device_class = 'window';
    if (state && state.id) {
        entity.context.STATE.getId = state.id;
        entity.context.STATE.states = objects[state.id] && objects[state.id].common ? objects[state.id].common.states || null : null;
        entity.context.STATE.getParser = function (entity, attr, state) {
            state = state || {val: null};
            entity.state = entity.context.STATE.historyParser(id, state.val);
        };
        entity.context.STATE.historyParser = function (id, val) {
            let str;
            if (entity.context.STATE.states) {
                str = entity.context.STATE.states[val] ? entity.context.STATE.states[val].toLowerCase() : 'error';
            } else {
                //use 0 = closed, 1 = tilted, 2 = open as default from ioBroker-roles documentation, if no common.states
                str = val === 0 ? 'closed' : val === 1 ? 'tilted' : 'open';
            }
            //try to translate -> will work for open, closed, tilted.
            return this.words[str] ? this.words[str][this.lang] || this.words[str].en : str;
        }.bind(this);
        this._addID2entity(state.id, entity);
    }

    return [entity, exports.processBattery.call(this,control, name, room, func, objects)];
};

//used for humidity-sensors that are detected as part of temperature or thermostat.
function createHumiditySensor(state, name, room, func, objects) {
    const entityHum = this._processCommon(name, room, func, objects[state.id], 'sensor');
    entityHum.context.STATE = {getId: state.id};
    entityHum.attributes.icon = 'mdi:mdi-water';
    entityHum.attributes.device_class = 'humidity';
    entityHum.attributes.unit_of_measurement = entityHum.attributes.unit_of_measurement || objects[state.id].common.unit || '%';
    return entityHum;
}
exports.createHumiditySensor = createHumiditySensor;

exports.processHumidity = function (id, control, name, room, func, _obj, objects) {
    const state = control.states.find(s => s.id && s.name === 'ACTUAL');
    if (state) {
        const entity = createHumiditySensor.call(this, state, name, room, func, objects);
        this._addID2entity(state.id, entity);
        return [entity];
    }
    return [];
};

exports.processTemperature = function (id, control, name, room, func, _obj, objects) {
    let entity;
    let state = control.states.find(s => s.id && s.name === 'ACTUAL'); // temperature
    if (state && state.id) {
        entity = this._processCommon(name, room, func, objects[state.id], 'sensor');
        entity.context.STATE = {getId: state.id};
        entity.attributes.device_class = 'temperature';
        this._addID2entity(state.id, entity);
    }

    state = control.states.find(s => s.id && s.name === 'SECOND'); // humidity
    let entityHum;
    if (state && state.id) {
        entityHum = createHumiditySensor.call(this, state, name, room, func, objects);
        this._addID2entity(state.id, entityHum);
    }

    return [entity, entityHum, exports.processBattery.call(this, control, name, room, func, objects)];
};

exports.processBattery = function (control, name, room, func, objects) {
    const state = control.states.find(s => s.id && s.name === 'LOWBAT');
    if (state && state.id) {
        const entity = this._processCommon(name, room, func, objects[state.id], 'sensor');
        entity.context.STATE = {getId: state.id};
        entity.context.iobType = 'LOWBAT';
        entity.attributes.icon = 'mdi:battery-alert';
        entity.attributes.device_class = 'battery';
        entity.unit_of_measurement = '%';
        this._addID2entity(state.id, entity);
        return entity;
    } else {
        return null;
    }
};
