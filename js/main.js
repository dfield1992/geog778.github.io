(function () {

    // Global Variables
    // Three Attributes for the drop down
    var attrArray = ["Cases", "Deaths", "Recovered", "Pop"]; 
    var expressed = attrArray[0]; //initial attribute
    
    
    console.log(attrArray[1])

    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 440,
        leftPadding = 37,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scale.linear()
        .range([430, 0])
        .domain([0, 100])
        .nice();

    var caseScale = d3.scale.linear()
        .range([430, 0])
        .domain([0, 70000])
        .nice();
    
    var deathScale = d3.scale.linear()
        .range([430, 0])
        .domain([0, 500])
        .nice();

    var recoverScale = d3.scale.linear()
        .range([430, 0])
        .domain([0, 50000])
        .nice();
    
    var popScale = d3.scale.linear()
        .range([430, 0])
        .domain([0, 100])
        .nice();
    //begin script when window loads
    window.onload = setMap();
    
    //set up choropleth map
    function setMap() {

        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 450;

        //create svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //Center projection on Central Asia
        var projection = d3.geoMercator()
            .center([70.00, 49.50])
            .translate([ width / 2, height / 2])
            .scale(600)


        var path = d3.geoPath()
            .projection(projection);
        
        //Load in Data       
        d3.queue()
            .defer(d3.csv, "data/centralAsia_covidData.csv")
            .defer(d3.json, "data/Countries.topojson")
            .defer(d3.json, "data/CentralAsia.topojson")
            .await(ready);
        // Call in the data
        function ready (error, csvData, othercountries, centralasia) {

            console.log(csvData)
            console.log(othercountries)
            console.log(centralasia)
            
            //place graticule on the map
            //setGraticule(map, path);
            
            //Bring in Central Asia Topojson and its surrounding countries Topojson
            var otherCountries = topojson.feature(othercountries, othercountries.objects.Countries),
                centralAsia = topojson.feature(centralasia, centralasia.objects.Final).features;

            //append surrounding countries to map 
            var countries = map.append("path")
                .datum(otherCountries)
                .attr("class", "countries")
                .attr("d", path); 
            
            
            //join covid csv data to Central Asia topojson.  
            centralAsia = joinData(centralAsia, csvData);

            console.log(centralAsia);
            
            var colorScale = makeColorScale(csvData);

            //add enumeration units to the map
            setEnumerationUnits(centralAsia, map, path, colorScale);


            //add coordinated visualization to the map
            setChart(csvData, colorScale);

            //call dropdown to be created
            createDropdown(csvData);
            

        };

    };
    
/*    
        function setGraticule(map, path) {
        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

    };*/
    
    //to join covid data csv and central asia topojson file 
    function joinData(centralAsia, csvData) {
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.ISO; //Get the Country Code from the CSV. 
            
            //loop through geojson regions to find correct region
            for (var a = 0; a < centralAsia.length; a++) {

                var geojsonProps = centralAsia[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.ISO; //Get the Country Code from the Central Asia Topojson
    ``

                //Match the Central Asia geojson data to the Covid csv data
                if (geojsonKey == csvKey) {

                    //assign all attributes and values
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });

                };
            };
        };

        return centralAsia;
        console.log(centralAsia);

    };
    
        
    //function to create color scale generator
    function makeColorScale(data) {
        
    var blue = ["#d3e5e8","#a5bfcf","#7d9fb8", "#557fa1","#2e638c"]; // Cases 
    var red = ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"]; // Deaths
    var green = ["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"]; // Recovery
    var gray = ["#f7f7f7","#cccccc","#969696","#636363","#252525"]; // Population
    
    
    var colorArrays = ["Cases",blue,"Deaths",red, "Recovered", green, "Pop",gray];
    
    var colorClasses = colorArrays[colorArrays.indexOf(expressed)+1];
        
            console.log(data);
        
        //create color scale generator
        var colorScale = d3.scale.threshold()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        console.log(domainArray);
    
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };
        
        console.log(domainArray);

        //cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums
        domainArray = clusters.map(function (d) {
            return d3.min(d);
        });

        //remove first value from domain array to create class breakpoints
        domainArray.shift();

        //assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);

        return colorScale;
        
    };

;
    
    function setEnumerationUnits(centralAsia, map, path, colorScale) {
        //add Central Asia Geojson to map
        var regions = map.selectAll(".regions")
            .data(centralAsia)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "regions " + d.properties.ISO;
            })
            .attr("d", path)
            .style("fill", function (d) {
                return choropleth(d.properties, colorScale);
            })
            .on("mouseover", function (d) {
                highlight(d.properties);
            })
            .on("mouseout", function (d) {
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);

            console.log(regions);
        //add style descriptor to each path
        var desc = regions.append("desc")
            .text('{"stroke": "#000", "stroke-width": ".5px"}');

    };
        //function to test for data value and return color
        function choropleth(props, colorScale) {
            //make sure attribute value is a number
            var val = parseFloat(props[expressed]);
            //if attribute value exists, assign a color; otherwise assign gray
            if (typeof val == 'number' && !isNaN(val)) {
                return colorScale(val);
            } else {
                return "#000";
            };
    };
    
        //function to create coordinated bar chart
    function setChart(csvData, colorScale) {

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);


        //set bars for each region
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function (a, b) {
                return b[expressed] - a[expressed]
            })
            .attr("class", function (d) {
                return "bar " + d.ISO;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .on("mouseover", highlight)
            .on("mouseout", dehighlight)
            .on("mousemove", moveLabel);


        //add style descriptor to each rect
        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "5px"}');

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 75)
            .attr("y", 40)
            .attr("class", "chartTitle");
    
        //create vertical axis generator
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(10)
            .tickFormat(function (d) {
                return d
            });

        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);


        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //set bar positions, heights, and colors
        updateChart(bars, csvData.length, colorScale, csvData, chart);

    }; //end of setChart
     //function to create a dropdown menu for attribute selection
    function createDropdown(csvData) {
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function () {

                changeAttribute(this.value, csvData);

            });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function (d) {
                return d
            })
            .text(function (d) {
                return d
            });
    };

    //dropdown change listener handler
    function changeAttribute(attribute, csvData) {
        //change the expressed attribute
        expressed = attribute;
        
        console.log(expressed);
        
        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var regions = d3.selectAll(".regions")
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                return choropleth(d.properties, colorScale)
            });

        //re-sort, resize, and recolor bars
        var bars = d3.selectAll(".bar")
            //re-sort bars
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            })
            .transition() //add animation
            .delay(function (d, i) {
                return i * 20
            })
            .duration(500);

        updateChart(bars, csvData.length, colorScale, csvData);
    }; //end of changeAttribute()

    //function to position, size, and color bars in chart
    function updateChart(bars, n, colorScale, csvData, chart) {

        //position bars
        bars.attr("x", function (d, i) {
                return i * (chartInnerWidth / n) + leftPadding;
            })
            //size/resize bars
            .attr("height", function (d, i) {
                console.log(parseFloat(d[expressed]));
                return 430 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d, i) {
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            //color/recolor bars
            .style("fill", function (d) {
                return choropleth(d, colorScale);
            });
        //add text to chart title
        var chartTitle = d3.select(".chartTitle")
            .text("Total number of confirmed " + expressed + " for each Country. ");
    };


    //function to highlight enumeration units and bars
    function highlight(props) {
        //change stroke
        var selected = d3.selectAll("." + props.ISO)
            .style("stroke", "black")
            .style("stroke-width", "5");

        setLabel(props);
    };
    


    //function to reset the element style on mouseout
    function dehighlight(props) {
        var selected = d3.selectAll("." + props.ISO)
            .style("stroke", function () {
                return getStyle(this, "stroke")
            })
            .style("stroke-width", function () {
                return getStyle(this, "stroke-width")
            });

        function getStyle(element, styleName) {
            var styleText = d3.select(element)
                .select("desc")
                .text();

            var styleObject = JSON.parse(styleText);

            return styleObject[styleName];
        };

        //remove info label
        d3.select(".infolabel")
            .remove();
    };


    //function to create dynamic label
    function setLabel(props) {
        //label content
        var labelAttribute = "<h1>" + props[expressed] + " " + expressed + "<br>" +
            "</h1>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .html(labelAttribute);

        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.Name);

    };

    //function to move info label with mouse
    function moveLabel() {
        //use coordinates of mousemove event to set label coordinates
        var x = d3.event.clientX + 10,
            y = d3.event.clientY - 75;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

    //function to move info label with mouse
    function moveLabel() {
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };  
})();