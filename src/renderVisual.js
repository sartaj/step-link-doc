var d3 = require('d3');
var _ = require('lodash');

var State = require('./state.js');

// Dimensions
var opts = {
    element: "#visualiazation",
    dimensions: {
        radius: 45,
        textHeightFromTop: 5,
        spacing: 2.5,
        nodeHeightMultiplier: 3
    }
};

var $container = document.querySelector('#visualiazation');

var actions = {};
actions.reset = function(e) {
    toggleHover.bind(this)('remove', 'hover');
    removeActive()
};

actions.click = function(e) {

    removeActive();
    toggleHover.bind(this)('add', 'active');
    $container.classList.add('greyOut-active');

    var state = State.get();
    state = state.set('active', this.__data__.name);
    State.set(state);

};

actions.mouseover = function(e) {
    toggleHover.bind(this)('add', 'hover');
    $container.classList['add']('greyOut-hover')
};

actions.mouseout = function(e) {
    toggleHover.bind(this)('remove', 'hover');
    $container.classList['remove']('greyOut-hover')
};

function removeActive() {
    var cssClass = 'active';
    var $active = document.querySelectorAll('.' + cssClass);

    [].forEach.call($active, function(div) {
        div.classList.remove(cssClass);
        div.classList.remove(cssClass + '-main');
    });
    $container.classList.remove('greyOut-active')
}

function toggleHover(toggle, cssClass) {
    var l = this.__data__.target;
    var id = this.__data__.id;

    // Add hover main to this
    var $el = document.querySelector("#node-" + id)
    $el.classList[toggle](cssClass);
    $el.classList[toggle](cssClass + '-main');

    // Add hover to linked items
    _.each(l, function(item) {
        var n = document.querySelector("#node-" + item);
        var l = document.querySelector("#link-" + id + "-" + item);

        n.classList[toggle](cssClass);
        l.classList[toggle](cssClass);

    });
}

d3.json("data.json", function(json) {

    var nodes = json.nodes;

    // Map 
    var idMap = {};

    // Prepare to generate ID number and link targets.
    // Use idMap as translator
    _.each(nodes, function(item, i) {
        item.id = i;
        item.target = [];
        idMap[item.name] = item.id;
    });

    _.each(nodes, function(item, i) {
        _.each(item.linksTo, function(lItem) {
            item.target.push(idMap[lItem]);
        });
        // Sort links to prevent generation on top of each other.

        // Top
        var lessThan = [],
            greaterThan = [];

        _.each(item.target, function(tItem) {
            if (item.id < tItem) {
                lessThan.push(tItem);
            } else {
                greaterThan.push(tItem);
            }
        });

        lessThan.sort().reverse();
        greaterThan.sort().reverse();

        item.target = [];
        item.target = item.target.concat(greaterThan);
        item.target = item.target.concat(lessThan);

    });

    var links = [];
    _.each(nodes, function(item) {
        _.map(item.target, function(i) {
            links.push({
                source: {
                    'id': item.id
                },
                target: {
                    'id': i
                }
            })
        });
    });

    _.each(nodes, function(d, i) {
        d.x = ((i + 1) * opts.dimensions.radius * opts.dimensions.spacing);
        d.y = (opts.dimensions.radius * opts.dimensions.nodeHeightMultiplier);
    });

    _.each(links, function(d) {

        // console.log(d);
        var source = _.findWhere(nodes, {
            'id': d.source.id
        });
        var target = _.findWhere(nodes, {
            'id': d.target.id
        });

        if (source.id > target.id) {

            d.source.x = source.x;
            d.source.y = source.y + opts.dimensions.radius + 2;
            d.target.x = target.x;
            d.target.y = target.y + opts.dimensions.radius + 2;

        } else {

            d.source.x = source.x;
            d.source.y = source.y - opts.dimensions.radius - 2;
            d.target.x = target.x;
            d.target.y = target.y - opts.dimensions.radius - 2;

        }

    });

    console.log(links);

    var svg = d3.select(opts.element)
        .append("svg")
        .attr("width", opts.dimensions.radius * opts.dimensions.spacing * (nodes.length + 1))
        .attr("height", opts.dimensions.radius * opts.dimensions.nodeHeightMultiplier * 2)

    /* Define the data for the circles */
    var elem = svg.selectAll("g")
        .data(nodes)

    /*Create and place the "blocks" containing the circle and the text */
    var elemEnter = elem.enter()
        .append("g")
        .attr("transform", function(d, i) {
            return "translate(" + d.x + "," + d.y + ")"
        })

    svg.append("defs").selectAll("marker")
        .data(["Inspiration", "Ideation", "Implementation"])
        .enter().append("marker")
        .attr("id", function(d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 7)
        .attr("refY", 0)
        .attr('class', 'marker')
        .attr("markerWidth", 3)
        .attr("markerHeight", 3)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");


    var path = svg.append("g").selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("d", linkArc)
        .attr("id", function(d) {

            return "link-" + d.source.id + "-" + d.target.id;
        })
        .attr("class", function(d) {
            return "link " + d.type;
        })
        .attr("marker-end", "url(#Inspiration)")
        // .on('mouseover', function(e) {
        //     this.classList.add('hover')

        //     this.parentNode.appendChild(this);

        //     //mouseover event
        // })
        // .on('mouseout', function(e) {
        //     this.classList.remove('hover')
        // });

    /*Create the circle for each block */
    var circle = elemEnter.append("circle")
        .attr("r", opts.dimensions.radius)
        .attr("class", function(d) {
            return "node " + d.category;
        })
        .attr("id", function(d) {
            return 'node-' + d.id;
        })
        .on('click', actions.click)
        .on('mouseover', actions.mouseover)
        .on('mouseout', actions.mouseout);

    /* Create the text for each block */
    elemEnter.append("text")
        .attr("class", "text")
        .attr("text-anchor", "middle")
        //    .attr("style", "text-align:center")
        .attr("dy", function(d) {
            return opts.dimensions.textHeightFromTop;
        })
        // .attr("dx", function(d) {
        //  var l = d.label.length;
        //     return l*3 - opts.dimensions.radius
        // })
        .text(function(d) {
            return d.name
        }).call(wrap, opts.dimensions.radius * 2)
        .on('click', actions.click)
        .on('mouseover', actions.mouseover)
        .on('mouseout', actions.mouseout);

    function linkArc(d) {
        var curveDivider = 1.2;
        var dx = (d.target.x - d.source.x),
            dy = (d.target.y - d.source.y),
            dr = Math.sqrt(dx * dx + dy * dy) / curveDivider;
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

});

// http://bl.ocks.org/mbostock/7555321
function wrap(text, width) {

    // Added to accomodate for circle
    var HEIGHTFROMTOPINCIRCLE = opts.dimensions.textHeightFromTop

    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            gotWrapped = false,
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy") - HEIGHTFROMTOPINCIRCLE),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width - 10) { // -10 is to add padding
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                gotWrapped = true;
            }
        }

        if (!gotWrapped) {
            tspan.attr('dy', '0.5em')
        }

    });
}


function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
}
