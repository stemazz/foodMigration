var width = 1020,
    height = 450;


var charts = {};


// MAP Preparation
var svg = d3.select("#mappa")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


// projection
var projection = d3.geo.equirectangular()
    .scale(170)
    .center([0, 20])
    .translate([width / 2, height / 2]);


// path transofrmer (from coordinates to path definition)
var path = d3.geo.path().projection(projection);


// a major g to contain all the visuals
var gg = svg.append("g");

// first child g to contain map
var g = gg.append("g")
    .attr("class", "map")
    .style("fill", "#fff2e6")
    .attr('stroke', "black")
    .attr('stroke-width', 0.2);

// secondo figlio (mappa default)
//var gm = gg.append("g");


// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// // DATA PREPARATION


// ci prendiamo quello che ci serve dal db ricette e mettiamo variabile
d3.queue()

.defer(d3.json, "./assets/data/distr_bynazione_perc.json")
    .defer(d3.json, "./assets/data/distr_bycucina_perc.json")
    .defer(d3.json, "./assets/data/world.geojson")
    .defer(d3.json, "./assets/data/dati_perc.json")
    .await(callback);

var clicked = false;

function callback(error, migrants, recipes, world, perc) {
    if (error) console.log(error);
    // console.log("perc",perc);
    // console.log(world);

    for (var key in perc) {
        // Grab State Name
        var dataState = key;
        // Grab data value 
        var dataValue = perc[key];
        //console.log(dataState,dataValue);

        for (var j = 0; j < world.features.length; j++) {
            var jsonState = world.features[j].properties.CNTR_ID;
            //console.log(jsonState);
            if (dataState == jsonState) {
                world.features[j].properties.perc = dataValue;
                //console.log(world.features[j].properties);
                break;
            }
        }
    };



    // SET COLOR RANGE FOR COLOR SCALES CLICKED
    var mapColors = d3.scale.quantile()
        .range(colorbrewer.Greens[5])
        .domain([]);

    // SET COLOR RANGE FOR COLOR SCALES not CLICKED
    var mapColors2 = d3.scale.quantile()
        .range(colorbrewer.Oranges[5])
        .domain(d3.values(perc));

    // console.log("mapColors2.domain",mapColors2.domain())


    g.selectAll("path")
        .data(world.features.filter(function(d) {
            return d.properties.CNTR_ID != "AQ"
        }))
        .enter()
        .append("path")
        .attr("d", path)
        .attr('id', function(d) {
            return d.properties.CNTR_ID;
        })

    .attr('fill', function(d) {

        var value = d.properties.perc;
        //console.log(value);

        if (value) {
            //If value exists…
            return mapColors2(value);
        }
    })

    .on('click', function(d) {
        clicked = true
        cliccato = this
        stato = d.properties.CNTR_ID;
        // console.log("id stato: ", d.properties.CNTR_ID);
        // console.log("recipes per stato: ", recipes[stato]);
        scritta = recipes[cliccato] != null ? "Location: " + stato : "Nessun dato per: " + stato;
        //spiegone scritta= - if not null scritta = (location: + stato) else "nessun dato per" stato 
        d3.select("#country")
            .text(scritta);
        //cliccato=this

        var recipes_by_nation = recipes[stato]
        recipes_by_nation = d3.entries(recipes_by_nation)
        recipes_by_nation = recipes_by_nation.filter(function(d) {
            return d.key != stato;
        })

        var migrants_by_nation = migrants[stato]
        migrants_by_nation = d3.entries(migrants_by_nation)
        migrants_by_nation = migrants_by_nation.filter(function(d) {
            return d.key != stato;
        })

        // console.log("migrants_by_nation", migrants_by_nation)
            // CAMBIA COLORE
        updateMapColors(cliccato);
           // updateLegend(mapColors);
        // console.log("this",this);

        // console.log("stato cliccato", stato)
        d3.select("#colonna1 h4").text("Hai selezionato lo stato: " + stato);

        // updateLegend(cliccato);

        updateAllCharts(stato, recipes_by_nation, migrants_by_nation); 

        //console.log(d.key, cliccato); //filtered


    })

    .on("mouseover", function(d) {
        //console.log(d.properties)
        tooltip.transition()
            .duration(200)
            .style("opacity", .8);
        stato_over = d.properties.CNTR_ID;
        // console.log("d", d)
        if (clicked == true) {
            tooltip.html("<strong>" + d.properties.CNTR_ID + "</strong><br/>ricette<br/>" + (recipes[stato][stato_over] || "0"))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        } else {
            tooltip.html("<strong>" + d.properties.CNTR_ID + "</strong><br/>ricette domestiche<br/>" + (d.properties.perc || "0") +"%")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

        }
    })

    .on("mouseout", function(d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    })

    ;

    // console.log("barcharts",recipes);
    // updateAllCharts(recipes);


    function updateMapColors(cliccato) {
        cliccato_series= d3.values(recipes[stato])
        // console.log("transf",cliccato_series.map(function(d) { return +d; }))
        mapColors.domain(cliccato_series.map(function(d) { return +d; }));
        // console.log("mapColors.domain()", mapColors.domain())

        svg.selectAll("path")
            .transition()
            .duration(100)
            // .attr("fill", function(d) { return d.properties.CNTR_ID || 0 })
            .attr("fill", function(d) {
                // console.log("stato",stato)
                // console.log("d",recipes[d.properties.CNTR_ID])
                // console.log(mapColors(recipes[stato][d.properties.CNTR_ID]))

                // se stato coincide con quello cliccato setta il colore a red altrimenti mapColors
                // gestire meglio quando  recipes[stato] is undefined
                return (d.properties.CNTR_ID == stato) ? 'orange' : mapColors(recipes[stato][d.properties.CNTR_ID]) || "#dddddd";
            })
            .attr('opacity', 0.7)
            .attr('stroke', "black")
            .attr('stroke-width', 0.2)
            //.attr('stroke-dasharray',(3,3) )
        ;
    }

    function updateLegend(mapColors) {

        d3.select("#legend svg").remove();
        // console.log(mapColors.range())
        //Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
        var legend = d3.select("#legend").append("svg")
            .attr("class", "legend")
            .attr("width", 140)
            .attr("height", 400)
            .selectAll("path")
            .data(mapColors.range())
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", 20) //leave 5 pixel space after the <rect>
            .attr("y", function(d, i) {
                return i * 20;
            })
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function(d) {
                return d;
            });

        legend.append('text') //
            .text(function(d, i) {
                var extent = mapColors.invertExtent(d);
                // console.log("d,text",extent)
                //extent will be a two-element array, format it however you want:
                var format = d3.format("0f");
                return format(+extent[0]) + " - " + format(+extent[1]);
            })
            .attr("x", 50) //leave 5 pixel space after the <rect>
            .attr("y", function(d, i) {
                return i * 20;
            })
            .attr("dy", "1.2em") //place text one line *below* the x,y point
            .attr('fill', "black")
            // .attr("dy", "0.8em") //place text one line *below* the x,y point

    }

    function updateAllCharts(stato, recipes, migrants) {
        updateChart("#chart1", "Dove vengono menzionati i piatti tipici?", recipes);
        updateChart("#chart2", "Quali ricette estere vengono fotografate?", migrants);
    }

    function updateChart(selector, title, data) {
        var sel = d3.select(selector);
        var svgChart;

        if (sel.select("svg").empty()) {
            sel
                .append("h4")
                .text(title);

            svgChart = sel.append("svg")
                .attr("width", "100%")
                .attr("height", 300);

            // create a new chart
            var chart = nv.models.multiBarHorizontalChart()
                .margin({ left: 30, right: 10, bottom: 20 })
                .showControls(false)
                .showLegend(false);

            charts[selector] = chart;
        } else {
            svgChart = sel.select("svg");
        }

        // console.log("data_chart",data)
        // assign new data to the chart
        svgChart.datum([{
               // key: "Count " + title,
                values: data
                    .map(function(d) {
                        return { x: d.key, y: +d.value }
                    }) // rename property names of objects
                    .sort(function(a, b) {
                        return -a.y + b.y
                    }) // sort by frequency
                    .filter(function(d, i) {
                        return i < 15
                    }) // select only first 15 rows
            }])
            .call(charts[selector]);

        nv.utils.windowResize(charts[selector].update);

    }

  //  updateLegend(mapColors2)

}


// zoom and pan
// var zoom = d3.behavior.zoom()
//     .on("zoom", function() {
//         gg.attr("transform", "translate(" +
//             d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");
//         gg.selectAll("path")
//             .attr("d", path.projection(projection));
//     });

// svg.call(zoom);






function updatefile1(file) {
  var el = document.getElementById('mappa');
while( el.hasChildNodes() ){
    el.removeChild(el.lastChild);
};


var width = 1020,
    height = 450;


var charts = {};


// MAP Preparation
var svg = d3.select("#mappa")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


// projection
var projection = d3.geo.equirectangular()
    .scale(170)
    .center([0, 20])
    .translate([width / 2, height / 2]);


// path transofrmer (from coordinates to path definition)
var path = d3.geo.path().projection(projection);


// a major g to contain all the visuals
var gg = svg.append("g");

// first child g to contain map
var g = gg.append("g")
    .attr("class", "map")
    .style("fill", "#fff2e6")
    .attr('stroke', "black")
    .attr('stroke-width', 0.2);

// secondo figlio (mappa default)
//var gm = gg.append("g");


// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// // DATA PREPARATION


// ci prendiamo quello che ci serve dal db ricette e mettiamo variabile
d3.queue()

.defer(d3.json, "./assets/data/distr_bynazione_perc.json")
    .defer(d3.json, "./assets/data/distr_bycucina_perc.json")
    .defer(d3.json, "./assets/data/world.geojson")
    .defer(d3.json, "./assets/data/dati_perc.json")
    .await(callback);

var clicked = false;

function callback(error, migrants, recipes, world, perc) {
    if (error) console.log(error);
    // console.log("perc",perc);
    // console.log(world);

    for (var key in perc) {
        // Grab State Name
        var dataState = key;
        // Grab data value 
        var dataValue = perc[key];
        //console.log(dataState,dataValue);

        for (var j = 0; j < world.features.length; j++) {
            var jsonState = world.features[j].properties.CNTR_ID;
            //console.log(jsonState);
            if (dataState == jsonState) {
                world.features[j].properties.perc = dataValue;
                //console.log(world.features[j].properties);
                break;
            }
        }
    };



    // SET COLOR RANGE FOR COLOR SCALES CLICKED
    var mapColors = d3.scale.quantile()
        .range(colorbrewer.Greens[5])
        .domain([]);

    // SET COLOR RANGE FOR COLOR SCALES not CLICKED
    var mapColors2 = d3.scale.quantile()
        .range(colorbrewer.Oranges[5])
        .domain(d3.values(perc));

    // console.log("mapColors2.domain",mapColors2.domain())


    g.selectAll("path")
        .data(world.features.filter(function(d) {
            return d.properties.CNTR_ID != "AQ"
        }))
        .enter()
        .append("path")
        .attr("d", path)
        .attr('id', function(d) {
            return d.properties.CNTR_ID;
        })

    .attr('fill', function(d) {

        var value = d.properties.perc;
        //console.log(value);

        if (value) {
            //If value exists…
            return mapColors2(value);
        }
    })

    .on('click', function(d) {
        clicked = true
        cliccato = this
        stato = d.properties.CNTR_ID;
        // console.log("id stato: ", d.properties.CNTR_ID);
        // console.log("recipes per stato: ", recipes[stato]);
        scritta = recipes[cliccato] != null ? "Location: " + stato : "Nessun dato per: " + stato;
        //spiegone scritta= - if not null scritta = (location: + stato) else "nessun dato per" stato 
        d3.select("#country")
            .text(scritta);
        //cliccato=this

        var recipes_by_nation = recipes[stato]
        recipes_by_nation = d3.entries(recipes_by_nation)
        recipes_by_nation = recipes_by_nation.filter(function(d) {
            return d.key != stato;
        })

        var migrants_by_nation = migrants[stato]
        migrants_by_nation = d3.entries(migrants_by_nation)
        migrants_by_nation = migrants_by_nation.filter(function(d) {
            return d.key != stato;
        })

        // console.log("migrants_by_nation", migrants_by_nation)
            // CAMBIA COLORE
        updateMapColors(cliccato);
      //      updateLegend(mapColors);
        // console.log("this",this);

        // console.log("stato cliccato", stato)
        d3.select("#colonna1 h4").text("Hai selezionato lo stato: " + stato);

        // updateLegend(cliccato);

        updateAllCharts(stato, recipes_by_nation, migrants_by_nation); 

        //console.log(d.key, cliccato); //filtered


    })

    .on("mouseover", function(d) {
        //console.log(d.properties)
        tooltip.transition()
            .duration(200)
            .style("opacity", .8);
        stato_over = d.properties.CNTR_ID;
        // console.log("d", d)
        if (clicked == true) {
            tooltip.html("<strong>" + d.properties.CNTR_ID + "</strong><br/>ricette<br/>" + (recipes[stato][stato_over] || "0") )
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        } else {
            tooltip.html("<strong>" + d.properties.CNTR_ID + "</strong><br/>" + (d.properties.perc || "0"))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

        }
    })

    .on("mouseout", function(d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    })

    ;

    // console.log("barcharts",recipes);
    // updateAllCharts(recipes);


    function updateMapColors(cliccato) {
        cliccato_series= d3.values(recipes[stato])
        // console.log("transf",cliccato_series.map(function(d) { return +d; }))
        mapColors.domain(cliccato_series.map(function(d) { return +d; }));
        // console.log("mapColors.domain()", mapColors.domain())

        svg.selectAll("path")
            .transition()
            .duration(100)
            // .attr("fill", function(d) { return d.properties.CNTR_ID || 0 })
            .attr("fill", function(d) {
                // console.log("stato",stato)
                // console.log("d",recipes[d.properties.CNTR_ID])
                // console.log(mapColors(recipes[stato][d.properties.CNTR_ID]))

                // se stato coincide con quello cliccato setta il colore a red altrimenti mapColors
                // gestire meglio quando  recipes[stato] is undefined
                return (d.properties.CNTR_ID == stato) ? 'orange' : mapColors(recipes[stato][d.properties.CNTR_ID]) || "#dddddd";
            })
            .attr('opacity', 0.7)
            .attr('stroke', "black")
            .attr('stroke-width', 0.2)
            //.attr('stroke-dasharray',(3,3) )
        ;
    }

    function updateLegend(mapColors) {

        d3.select("#legend svg").remove();
        // console.log(mapColors.range())
        //Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
        var legend = d3.select("#legend").append("svg")
            .attr("class", "legend")
            .attr("width", 140)
            .attr("height", 400)
            .selectAll("path")
            .data(mapColors.range())
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", 20) //leave 5 pixel space after the <rect>
            .attr("y", function(d, i) {
                return i * 20;
            })
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function(d) {
                return d;
            });

        legend.append('text') //
            .text(function(d, i) {
                var extent = mapColors.invertExtent(d);
                // console.log("d,text",extent)
                //extent will be a two-element array, format it however you want:
                var format = d3.format("0f");
                return format(+extent[0]) + " - " + format(+extent[1]);
            })
            .attr("x", 50) //leave 5 pixel space after the <rect>
            .attr("y", function(d, i) {
                return i * 20;
            })
            .attr("dy", "1.2em") //place text one line *below* the x,y point
            .attr('fill', "black")
            // .attr("dy", "0.8em") //place text one line *below* the x,y point

    }

    function updateAllCharts(stato, recipes, migrants) {
        updateChart("#chart1", "Dove vengono menzionati i piatti tipici?", recipes);
        updateChart("#chart2", "Quali ricette estere vengono fotografate?", migrants);
    }

    function updateChart(selector, title, data) {
        var sel = d3.select(selector);
        var svgChart;

        if (sel.select("svg").empty()) {
            sel
                .append("h4")
                .text(title);

            svgChart = sel.append("svg")
                .attr("width", "100%")
                .attr("height", 300);

            // create a new chart
            var chart = nv.models.multiBarHorizontalChart()
                .margin({ left: 30, right: 10, bottom: 20 })
                .showControls(false)
                .showLegend(false);

            charts[selector] = chart;
        } else {
            svgChart = sel.select("svg");
        }

        // console.log("data_chart",data)
        // assign new data to the chart
        svgChart.datum([{
             //   key: "Count " + title,
                values: data
                    .map(function(d) {
                        return { x: d.key, y: +d.value }
                    }) // rename property names of objects
                    .sort(function(a, b) {
                        return -a.y + b.y
                    }) // sort by frequency
                    .filter(function(d, i) {
                        return i < 15
                    }) // select only first 15 rows
            }])
            .call(charts[selector]);

        nv.utils.windowResize(charts[selector].update);

    }

    //updateLegend(mapColors2)

}


// zoom and pan
// var zoom = d3.behavior.zoom()
//     .on("zoom", function() {
//         gg.attr("transform", "translate(" +
//             d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");
//         gg.selectAll("path")
//             .attr("d", path.projection(projection));
//     });

// svg.call(zoom);

}




