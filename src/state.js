var Immutable = require('immutable-store');
var EventEmitter = require('event-emitter');

var events = new EventEmitter();

var store = Immutable({
	active: ""
});

module.exports = {
	get: function() {
		return store
	},
	set: function(updatedStore) {
		store = updatedStore;
		requestAnimationFrame(function() {
			events.emit('changed', store)
		})
	},
	changed: function(callback) {
		events.on('changed', callback)
	}
}