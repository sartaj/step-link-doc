var marked = require('marked');
var $ = require('jquery');

var State = require('./state.js');

var state = State.get();
var activePage = state.active;

State.changed(function(store) {
	if(activePage !== store.active) {
		activePage = store.active;
		renderMd(activePage);
	}
});

var $mdView = document.querySelector('#mdView');
function renderMd(activePage) {
	$.ajax({
		type: "GET",
		url:'./documents/' + activePage + '.md'
	}).done(function(data){
		var html = marked(data);
		$mdView.innerHTML = html;
	})
}