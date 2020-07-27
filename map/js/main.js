//function to instantiate the Leaflet map
function createMap(){

    var mbAttr = 'Map created by: Dwight E. Field ';
    
    var mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGZpZWxkMjMiLCJhIjoiY2tjcDA2MjZuMDBzajM0cGh3OGE2Ymc4YSJ9.XLkOtmEtdJEIuy-ivZrRBw';

    var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
    dark  = L.tileLayer(mbUrl, {id: 'mapbox.dark',   attribution: mbAttr}),
    outdoors = L.tileLayer(mbUrl, {id: 'mapbox.outdoors',   attribution: mbAttr});
    
    
    //create the map*/
    var map = L.map('map', {
        center: [46, 67.20],//Coordinated to Central Asia
        zoom: 5,
        zoomControl: false,
        layers:grayscale
    });
    
    //add home button to map
    var zoomHome = L.Control.zoomHome({
        position: 'topleft'
    });
    zoomHome.addTo(map);
    
    //Three BaseMap Options in Top Right Corner
    var baseLayers = {
        "Grayscale": grayscale,
        "Outdoors": outdoors,
        "Darkscale": dark,       
    };
    
    //call getData function
    getData(map);
    
    L.control.layers(baseLayers).addTo(map);
}

//Import GeoJSON data
function getData(map){
    //load the Central Asia Point Data
    $.ajax("data/CentralAsia_Point.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);
            //call function to create proportional symbols
            createPropSymbols(response, map,attributes);
            //call funtion to create slider
            createSequenceControls(map, attributes);
            //call function to create legend
            createLegend(map, attributes); 
        }
    });
}
// Build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];
    console.log(attributes);
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        if (attribute.indexOf("M") > -1){ //Grabs all of the months
        attributes.push(attribute);
        };
    };
    return attributes;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
        return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};
    
function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    console.log(attribute);
    
    //create marker options
    var options = {
    fillColor: "#00BFFF",
    color: "#000",
    weight: 1.5,
    opacity: 1,
    fillOpacity: 0.8
};
    
    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    
    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    var popup = new Popup (feature.properties, attribute, layer, options.radius);
    
    popup.bindToLayer();
    
    //event listeners to open popup on hover and stay open on click
    layer.on({
        mouseover: function () {
            this.openPopup();
        },
        moueout: function () {
            this.closePopup();
        },
        click: function () {
            this.openPopup();
        },
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

function calcPropRadius(attributeValue){
        var scaleFactor = .05;
        var area = attributeValue * scaleFactor;
        var radius = Math.sqrt(area/Math.PI)*2;
        return radius;        
};

//Popup Constructor function, information in popup on circle marker
function Popup(properties, attribute, layer, radius) {
    this.properties = properties;
    this.attribute = attribute;
    this.layer = layer;
    this.country = properties.Name //Country Name 
    this.month = attribute.split("_")[0];//Split Months Attribute
    this.cases = this.properties[attribute]; //Display Numver of Covid Cases
    this.content = "<p><b>Country:</b> " + this.country + "<br><b>Total Number of Confirmed Covid-19 Cases in " + this.month + ":</b><br>" + numberWithCommas(this.cases) + " people." + "</p>";

    this.bindToLayer = function () {
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0, -radius)
        });
    };
};
//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            var popup = new Popup(props, attribute, layer, radius);

            //add popup to circle marker
            popup.bindToLayer();

            updateLegend(map, attribute);
            
        };
    });
};

//Create new sequence controls
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft',
        },
        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
        
            $(container).append('<h5 align=center id= "info"> Covid-19 Time Slider </h5>')
            
            $(container).append('<p align=center id= "info">Below you can click through each month to see the total number of confirmed Covid-19 cases in Central Asia. Scroll over or click on the circles to see the total amount per month. </p>')
            
            
            
            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Back</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Next</button>');
            
            //month under slider
            $(container).append('<p id="sequence-legend"> Month</p>');



            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
                map.dragging.disable();
            });

            return container;
        }
    });

map.addControl(new SequenceControl());

	//set slider attributes
	$('.range-slider').attr({
		max: 4,
		min: 0,
		value: 0,
		step: 1
	});

	// create slider event handler
	$('.range-slider').on('input', function () {
		var index = $(this).val();
		$('#year').html(attributes[index]);
		updatePropSymbols(map, attributes[index]);
	});


	//create button event handler
	$('.skip').click(function () {
		var index = $('.range-slider').val();
		if ($(this).attr('id') == 'forward') {
			index++;
			index = index > 4 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse') {
			index--;
			index = index < 0 ? 4 : index;
		}
		$('.range-slider').val(index);
        
		updatePropSymbols(map, attributes[index]);
	});
};

function createLegend(map, attributes){
    
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            
            //add temporal legend div to container, the title of legend here
            $(container).append('<div id="temporal-legend">')

            //start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="200px" height="90px">';

            //object to base loop on, gives position for text in legend
            var circles = {
                max: 40,
                mean: 60,
                min: 80,
            };
            
            //loop to add each circle and text to svg string
            for (var circle in circles) {
                //circle string, cx is the position of the cirlces
                svg += '<circle class="legend-circle" id="' + circle + '" fill="#00BFFF" fill-opacity="0.8" stroke="#222418" cx="50"/>';

                //text string; x is the position of circle
                svg += '<text id="' + circle + '-text" x="90" y="' + circles[circle] + '"></text>';
            };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            //**** END OF TEMPORAL LEGEND ****///

            return container;
        }
    });


    map.addControl(new LegendControl());
    updateLegend(map,attributes[0]);
    
};

function updateLegend(map, attribute) {
    //create content for legend
    var month = attribute.split("_")[0]
    var content = "<b>Covid Cases in " + month + "</b>";

    //replace sequence content text
    $('#sequence-legend').html(month);

    //replace legend content
    $('#temporal-legend').html(content);

    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues) {
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //assign the cy and r attributes, cy gives position for circles in legend and makes sure they are all anchored together
        $('#' + key).attr({
            cy: 85 - radius,
            r: radius
        });

        //Legend text
        $('#' + key + '-text').text(numberWithCommas(circleValues[key]) + " People");
    };

};

//Calculate the max, mean, and min values for a given attribute; called in updateLegend
function getCircleValues(map, attribute) {
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function (layer) {
        //get the attribute value
        if (layer.feature) {
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min) {
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max) {
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//function to create commas in number display
function numberWithCommas(x) {
    x = Math.round(x)
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


    

$(document).ready(createMap);