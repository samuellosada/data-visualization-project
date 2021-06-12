// this represents the states the window of the visualisation can be in
const windowEnum = Object.freeze({"defaultView":1, "categoryView":2, "typesView":3});
// current window is the default view of the visualisation
let currentWindow = windowEnum.defaultView;
// get and saves highlighted rectangle
let currentRect;
// to get and save highlighted rectangle fill value
let currentRectColor;
let currentCatRect;
let currectCatRectColor;
let currentCatShade;
let currentTypeRect;
let currentTypeRectColor;
let moreInfoNameLength;
let selectedTypeAmount;
// makes data accessable for percantage function as variables
let importedData;
let selectedYear = 2016;

// mouse location for more info tooltip
let coordinates = d3.pointer(this);
let x = coordinates[0];
let y = coordinates[1];

const rectWidth = 175;
const rectHeight = 50;
const catRectWidth = 105;
const catRectHeight = 120;


const SvgSize = {width: 600, height: 600};

let selectedWasteCategory, selectedSourceOrDestination;

//enum for the switch colour scheme in default view
const categoryNames = Object.freeze({masonry:"Masonry Materials", organics:"Organics", ash:"Ash", hazardous:"Hazardous Waste", metals:"Metals",
                                    paper:"Paper & Cardboard", plastics:"Plastics", glass:"Glass", textiles:"Textiles, Leather & Rubber", other:"Other"});

//enums for the switch colour scheme in category view
const sourcesNames = Object.freeze({waste:"Waste collection, treatment & disposal services", agriculture:"Agriculture", mining:"Mining", manufacturing:"Manufacturing", elecGasWat:"Electricity, Gas & Water Services", construction:"Construction",
                                    publicAdmin:"Public Administration & Safety", otherIndustries:"All other Industries", households:"Households", imports:"Imports"});
const destinationNames = Object.freeze({energyrecovery:"Energy Recovery (not landfill)", landfillEnergy:"Landfill (for energy recovery)", landfillDisposal:"Landfill (disposal)", recycling:"Recycling",
                                        treatment:"Treatment", otherDisposal:"Other Disposal", agriculture:"Agriculture", mining:"Mining", manufacturing:"Manufacturing",
                                        elecGasWat:"Electricity, Gas & Water Services", construction:"Construction", publicAdmin:"Public Administration & Safety", otherIndustries:"All other Industries",
                                      households:"Households", change:"Change in Inventories", exports:"Exports"});

//***Graph Related Functions***************************************************************************************************

function selectDataByYear(year, data){
  const Year = Object.freeze({"2016": 0, "2017": 1, "2018":2});
  var yearData = { title: data.years[Year[year]].name, yearTotal: data.years[Year[year]].totalAmount, "wasteCategories" : []};

  for (let i = 0; i < data.years[Year[year]].wasteCategories.length; i++){
      var {name, totalAmount, wasteIndustrySources, wasteDestinations} = data.years[Year[year]].wasteCategories[i]//Json Destructuring syntax.
      yearData.wasteCategories.push({name, totalAmount, wasteIndustrySources, wasteDestinations});
  }

  return yearData;
}

function handleYearSelection(element, data, svg){
    closeWasteCategoryWindow()

    let treemapYearData = selectDataByYear(element.value, data);

    selectedYear = element.value;

    let treemapRootNode = treemapSetup(treemapYearData, SvgSize.width, SvgSize.height)

    update(treemapRootNode, svg);
}

function treemapSetup(wasteCategoryData, width, height){

    //Create new Layout to make a treemap. Gives each child a given x, y and other properties we use to make treemap visualizations
    let treemapLayout = d3.treemap()
        .size([width, height])
        .paddingOuter(14);

    //allows you to select d3 layouts for hierarchical data.
    let rootNode = d3.hierarchy(wasteCategoryData, (d)=> {return d.wasteCategories}); //Need to be able to let it know under what name all the children we need are.?? MAYBE THE SOLUTION???

    //provides value data to the value properties added.
    rootNode.sum((d) => {
        return d.totalAmount;
    });

    rootNode.sort((a, b) => b.value - a.value); // makes the squares more visible.

    //assign the treemap layout to the hierarchichal data
    treemapLayout(rootNode);

    return rootNode;
}

function updateDefaultWindow(rootNode, svg){
    let defaultWindow;
    if(!document.getElementById("defaultWindow")){
        defaultWindow = svg.append('g').attr('id', 'defaultWindow');
    } else {
        defaultWindow = d3.select("#defaultWindow");
    }
    defaultWindow
        .selectAll(".rect")
        .data(rootNode.leaves(), (d)=> {
            return d.data.totalAmount;
        })
        .join(
            function(enter){
                return enter
                .append("rect")
                .attr('class', 'rect')
                .attr('x', (d) => {return d.x0})
                .attr('y', (d) => {return d.y0})
                .attr('width', (d) => {return d.x1 - d.x0})
                .attr('height', (d) => {return d.y1 - d.y0})
                .style("fill", d => colourSwitchFunction(d)) //colors each rectangle in the default view
                .on('click', (event, d) => {openWasteCategoryWindow(d, svg)})
                .on("mouseover", mouseOverFunction)
                .on("mouseout", mouseOutFunction)
                .on("mousemove", mouseMoveFunction);

            },
            function(update){
                return update
                .append("rect")
                .attr('x', (d) => {return d.x0})
                .attr('y', (d) => {return d.y0})
                .attr('width', (d) => {return d.x1 - d.x0})
                .attr('height', (d) => {return d.y1 - d.y0})
            }
        )


    defaultWindow
        .selectAll("g")
        .data(rootNode.leaves())
        .enter()
            .append("text")
            .attr("x", (d) => {
              return centreTextFunction(d.x0+10, d.x1, `${d.data.name}`);
            })
            .attr("y", (d) => {
              return centreTextFunction(d.y0, d.y1, `${d.data.name}`, -20);
            })
            .text((d) => {
              return defaultManagerFunction(d, "name")
            }) //data is used to access the leaf node properties.
            .attr("font-size", "15px")
            .attr("fill", d => textColourSwitchFunction(d))
            .style("pointer-events", "none");

    defaultWindow
        .selectAll("g")
        .data(rootNode.leaves())
        .enter()
            .append("text")
            .attr("x", (d) => {
              return centreTextFunction(d.x0, d.x1, `${d.data.totalAmount} tonnes`);
             })
            .attr("y", (d) => {
              return centreTextFunction(d.y0, d.y1, `${d.data.totalAmount} tonnes`, 0);
            })
            .text((d) => {
              return defaultManagerFunction(d, "amount")
            })
            .attr("font-size", "15px")
            .attr("fill", d => textColourSwitchFunction(d))
            .style("pointer-events", "none");

    defaultWindow
        .selectAll("g")
        .data(rootNode.leaves())
        .enter()
            .append("text")
            .attr("x", (d) => {
              return centreTextFunction(d.x0, d.x1, `100%`);
             })
            .attr("y", (d) => {
              return centreTextFunction(d.y0, d.y1, `100%`, 20);
            })
            .text((d) => {
              return getPercentageFunction(d, "defaultWindow");
            })
            .attr("font-size", "15px")
            .attr("fill", d => textColourSwitchFunction(d))
            .style("pointer-events", "none");

    // more info tool tip window
    let moreInfoWindow = svg.append('g')
        .attr('id', "moreInfoWindow")
        .attr("visibility", "hidden");

    moreInfoWindow
        .append("rect")
            .attr('id', "moreInfoWindowRect")
            .attr('width', 200)
            .attr('height', 100)
            .attr('fill', "white")
            .attr("rx", "25")
            .style("pointer-events", "none")

    moreInfoWindow
        .append("text")
            .attr("id", "moreInfoTitle")
            .attr("font-size", "15px")
            .attr("fill", "black")
            .style("pointer-events", "none");

    moreInfoWindow
        .append("text")
            .attr("id", "moreInfoAmount")
            .attr("font-size", "15px")
            .attr("fill", "black")
            .style("pointer-events", "none");
}

function selectSingleStackedBarChartData(searchedArray){
    searchedArray.sort(function(a, b){
        return a.totalAmount - b.totalAmount
    })

    var rootNode = [];

    let count = 0;
    for(let i = 0; i < searchedArray.length; i++){
        var { name, totalAmount, wasteTypes} = searchedArray[i];

        let value = totalAmount;
        let x0 = count;
        let x1 = count + value;
        count += value;

        rootNode.push({name, value, x0, x1, wasteTypes});
    }
    return rootNode;

}

function updateWasteCategoryWindow(data, svg){

    let wasteCategoryWindow;
    if(!document.getElementById("wasteCategoryWindow")){
        wasteCategoryWindow = svg.append('g')
        .attr('id', "wasteCategoryWindow")
        .attr("visibility", "hidden");

        wasteCategoryWindow
        .append("rect")
            .attr('x', 30)
            .attr('y', 30)
            .attr('width', SvgSize.width - 60)
            .attr('height', SvgSize.height - 60)
            .attr('fill', "white")

    } else {
        wasteCategoryWindow = d3.select("#wasteCategoryWindow");
    }

    wasteCategoryWindow
        .append("text")
            .attr("id", "wasteCategoryTitle")
            .attr("x", 60)
            .attr("y", 120)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black");

    wasteCategoryWindow
        .append("text")
            .attr("id", "wasteCategoryAmount")
            .attr("x", SvgSize.width - 200)
            .attr("y", 120)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black");

    wasteCategoryWindow
        .append("text")
            .text("Industry Sources:")
            .attr("class", "barChartTitle")
            .attr("x", 60)
            .attr("y", 170)
            .attr("font-size", "15px")
            .attr("fill", "black")

    wasteCategoryWindow
        .append("text")
            .text("Waste Destinations:")
            .attr("class", "barChartTitle")
            .attr("x", 60)
            .attr("y", 370)
            .attr("font-size", "15px")
            .attr("fill", "black")

    if(data){
        let industrySourceRootNode = selectSingleStackedBarChartData(data.data.wasteIndustrySources);

        x = d3.scaleLinear()
            .domain([d3.min(industrySourceRootNode, d => d.x0), d3.max(industrySourceRootNode, d => d.x1)])
            .range([60, SvgSize.width - 60])

        wasteCategoryWindow
            .selectAll(".rect2")
            .data(industrySourceRootNode, d => d.value)
            .join(
                function(enter){
                    return enter
                    .append('rect')
                    .attr('class', "wasteSourceBar")
                    .attr("x", d => {
                        return x(d.x0)
                    })
                    .attr("y", 195)
                    .attr("width", d => {
                        return (x(d.x1) - x(d.x0) - 2 < 0) ? 0 : x(d.x1) - x(d.x0);
                    })
                    .attr("height", catRectHeight)
                    .style("fill", currentRectColor)

                    .style("filter", (d, i) => catBarChartSwitchFunction(d, i))
                    .on("mouseover", mouseOverFunction)
                    .on("mouseout", mouseOutFunction)
                    .on("mousemove", mouseMoveFunction)
                    .on('click', (event, d) => {
                        openWasteTypeWindow(d, svg)
                    });

                }
            )
          wasteCategoryWindow
              .selectAll(".text2")
              .data(industrySourceRootNode, d => d.value)
              .join(
                  function(enter){
                      return enter
                      .append('text')
                      .attr('class', "wasteSourceName")
                      .attr("x", (d) => {
                        return catCentreTextFunction(x(d.x0), x(d.x1), `${d.name}`);
                    })
                      .attr("y", 240)
                      .text((d) => {
                        return categoryManagerFunction(d, 'name');
                      }) //data is used to access the leaf node properties.
                      .attr("font-size", "11px")
                      .attr("fill", "#FFFFFF")
                      .style("text-shadow", "1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
                      .style("pointer-events", "none");
                  }
              )
          wasteCategoryWindow
          .selectAll(".text2")
          .data(industrySourceRootNode, d => d.value)
          .join(
              function(enter){
                  return enter
                  .append('text')
                  .attr('class', "wasteSourceAmount")
                  .attr("x", (d) => {
                    return catCentreTextFunction(x(d.x0), x(d.x1), `${d.value} tonnes`);
                })
                  .attr("y", 260)
                  .text((d) => {
                    return categoryManagerFunction(d, 'amount');
                  }) //data is used to access the leaf node properties.
                  .attr("font-size", "11px")
                  .attr("fill", "#FFFFFF")
                  .style("text-shadow", "1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
                  .style("pointer-events", "none");
              }
          )
          wasteCategoryWindow
          .selectAll(".text2")
          .data(industrySourceRootNode, d => d.value)
          .join(
              function(enter){
                  return enter
                  .append('text')
                  .attr('class', "wasteSourcePercentage")
                  .attr("x", (d) => {
                    return catCentreTextFunction(x(d.x0), x(d.x1), `${categoryManagerFunction(d, 'percentage')}%`);
                })
                  .attr("y", 280)
                  .text((d) => {
                    return categoryManagerFunction(d, 'percentage');
                  }) //data is used to access the leaf node properties.
                  .attr("font-size", "11px")
                  .attr("fill", "#FFFFFF")
                  .style("text-shadow", "1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
                  .attr("font-weight", "700")
                  .style("pointer-events", "none");
              }
          )


        let wasteDestinationRootNode = selectSingleStackedBarChartData(data.data.wasteDestinations);

        x = d3.scaleLinear()
            .domain([d3.min(wasteDestinationRootNode, d => d.x0), d3.max(wasteDestinationRootNode, d => d.x1)])
            .range([60, SvgSize.width - 60])

        wasteCategoryWindow
            .selectAll(".rect3")
            .data(wasteDestinationRootNode, d => d.value)
            .join(
                function(enter){
                    return enter
                    .append('rect')
                    .attr('class', "wasteDestinationsBar")
                    .attr("x", d => {
                        return x(d.x0)
                    })
                    .attr("y", 395)
                    .attr("width", d => {
                        return (x(d.x1) - x(d.x0) - 2 < 0) ? 0 : x(d.x1) - x(d.x0) ;
                    })
                    .attr("height", catRectHeight)
                    .style("fill", currentRectColor)
                    .style("filter", (d, i) => catBarChartSwitchFunction(d, i))
                    .on("mouseover", mouseOverFunction)
                    .on("mouseout", mouseOutFunction)
                    .on("mousemove", mouseMoveFunction)
                    .on('click', (event, d) => {
                        openWasteTypeWindow(d, svg)
                    });
                }
            )

        wasteCategoryWindow
            .selectAll(".text2")
            .data(wasteDestinationRootNode, d => d.value)
            .join(
                function(enter){
                    return enter
                    .append('text')
                    .attr('class', "wasteDestinationsName")
                    .attr("x", (d) => {
                      return catCentreTextFunction(x(d.x0), x(d.x1), `${d.name}`);
                  })
                    .attr("y", 440)
                    .text((d) => {
                      return categoryManagerFunction(d, 'name');
                    }) //data is used to access the leaf node properties.
                    .attr("font-size", "11px")
                    .attr("fill", "#FFFFFF")
                    .style("text-shadow", "1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
                    .style("pointer-events", "none");
                }
            )

        wasteCategoryWindow
            .selectAll(".text2")
            .data(wasteDestinationRootNode, d => d.value)
            .join(
                function(enter){
                    return enter
                    .append('text')
                    .attr('class', "wasteDestinationsAmount")
                    .attr("x", (d) => {
                    return catCentreTextFunction(x(d.x0), x(d.x1), `${d.value} tonnes`);
                })
                    .attr("y", 460)
                    .text((d) => {
                    return categoryManagerFunction(d, 'amount');
                    }) //data is used to access the leaf node properties.
                    .attr("font-size", "11px")
                    .attr("fill", "#FFFFFF")
                    .style("text-shadow", "1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
                    .style("pointer-events", "none");
                }
            )
        wasteCategoryWindow
            .selectAll(".text2")
            .data(wasteDestinationRootNode, d => d.value)
            .join(
                function(enter){

                    return enter
                    .append('text')
                    .attr('class', "wasteDestinationPercentage")
                    .attr("x", (d) => {
                    return catCentreTextFunction(x(d.x0), x(d.x1), `${categoryManagerFunction(d, 'percentage')}%`);
                })
                    .attr("y", 480)
                    .text((d) => {
                    return categoryManagerFunction(d, 'percentage');
                    }) //data is used to access the leaf node properties.
                    .attr("font-size", "11px")
                    .attr("fill", "#FFFFFF")
                    .style("text-shadow", "1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
                    .attr("font-weight", "700")
                    .style("pointer-events", "none");
                }
            )

        // Back Button
        wasteCategoryWindow
            .append("circle")
                .attr("cx", SvgSize.width - 75)
                .attr("cy", 70)
                .style("fill", "#ededed")
                .attr("r", 15)
                .on('click', () => closeWasteCategoryWindow())


        wasteCategoryWindow
            .append('text')
                .attr('id', "backButton")
                .html("&#10006")
                .attr("x", SvgSize.width - 81)
                .attr("y", 75)
                .attr("fill", "black")
                .style("pointer-events", "none");

        // more info tool tip window
        let catMoreInfoWindow = svg.append('g')
            .attr('id', "catMoreInfoWindow")
            .attr("visibility", "hidden");

        catMoreInfoWindow
            .append("rect")
                .attr('id', "catMoreInfoWindowRect")
                .attr('height', 100)
                .attr('fill', "pink")
                .attr("rx", "25");

        catMoreInfoWindow
            .append("text")
                .attr("id", "catMoreInfoTitle")
                .attr("font-size", "15px")
                .attr("fill", "black")
                .style("pointer-events", "none");

        catMoreInfoWindow
            .append("text")
                .attr("id", "catMoreInfoAmount")
                .attr("font-size", "15px")
                .attr("fill", "black")
                .style("pointer-events", "none");

        catMoreInfoWindow
            .append("text")
                .attr("id", "catMoreInfoPercentage")
                .attr("font-size", "15px")
                .attr("fill", "black")
                .style("pointer-events", "none");
    }
}

function updateWasteTypeWindow(data, svg){
    let wasteTypeWindow;
    if(!document.getElementById("wasteTypeWindow")){
        wasteTypeWindow = svg.append('g')
        .attr('id', "wasteTypeWindow")
        .attr("visibility", "hidden");
        wasteTypeWindow
            .append("rect")
                .attr("class", "wasteTypeRect")
                .attr('x', 60)
                .attr('y', 155)
                .attr('width', SvgSize.width - 115)
                .attr('height', SvgSize.height - 220)
                .attr('fill', currentRectColor)
                .style("filter", currentCatShade)

            wasteTypeWindow
            .append("rect")
                .attr("class", "wasteTypeRect")
                .attr('x', 65)
                .attr('y', 160)
                .attr('width', SvgSize.width - 125)
                .attr('height', SvgSize.height - 230)
                .attr('fill', "#ededed")
                .style("filter", currentCatShade)

    } else {
        wasteTypeWindow = d3.select("#wasteTypeWindow");
    }

    wasteTypeWindow
        .append("text")
            .attr("id", "wasteTypeTitle")
            .attr("x", 90)
            .attr("y", 250)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black");

    wasteTypeWindow
        .append("text")
            .attr("id", "wasteTypeAmount")
            .attr("x", SvgSize.width - 220)
            .attr("y", 250)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black")

    let wasteTypeRootNode = selectSingleStackedBarChartData(data.wasteTypes);

    x = d3.scaleLinear()
        .domain([d3.min(wasteTypeRootNode, d => d.x0), d3.max(wasteTypeRootNode, d => d.x1)])
        .range([90, SvgSize.width - 90])

    wasteTypeWindow
        .selectAll(".rect4")
        .data(wasteTypeRootNode, d => d.value)
        .join(
            function(enter){
                return enter
                .append('rect')
                .attr('class', "rect4")
                .attr("x", d => {
                    return x(d.x0)
                })
                .attr("y", 300)
                .attr("width", d => {
                    return (x(d.x1) - x(d.x0) - 2 < 0) ? 0 : x(d.x1) - x(d.x0) ;
                })
                .attr("height", catRectHeight)
                .style("fill", (d, i) => wasteTypeSwitchFunction(d, i))
                .on("mouseover", mouseOverFunction)
                .on("mouseout", mouseOutFunction)
                .on("mousemove", mouseMoveFunction)
            }
        )


        // more info tool tip window
        let typeMoreInfoWindow = svg.append('g')
            .attr('id', "typeMoreInfoWindow")
            .attr("visibility", "hidden");

        typeMoreInfoWindow
            .append("rect")
                .attr('id', "typeMoreInfoWindowRect")
                .attr('height', 100)
                .attr("rx", "25");

        typeMoreInfoWindow
            .append("text")
                .attr("id", "typeMoreInfoTitle")
                .attr("font-size", "15px")
                .attr("fill", "black")
                .style("pointer-events", "none");

        typeMoreInfoWindow
            .append("text")
                .attr("id", "typeMoreInfoAmount")
                .attr("font-size", "15px")
                .attr("fill", "black")
                .style("pointer-events", "none");

        typeMoreInfoWindow
            .append("text")
                .attr("id", "typeMoreInfoPercentage")
                .attr("font-size", "15px")
                .attr("fill", "black")
                .style("pointer-events", "none");


        //BAck Button
        wasteTypeWindow
            .append("circle")
                .attr("cx", SvgSize.width - 105)
                .attr("cy", 205)
                .style("fill", "#ededed")
                .attr("r", 15)
                .on('click', () => closeWasteTypeWindow())


        wasteTypeWindow
            .append('text')
                .attr('id', "backButton2")
                .html("&#10006")
                .attr("x", SvgSize.width - 111)
                .attr("y", 210)
                .attr("fill", "black")
                .style("pointer-events", "none");

}

function update(rootNode, svg){
    if(document.getElementById("title").innerHTML != rootNode.data.title){
        document.getElementById("title").innerHTML = rootNode.data.title;
        document.getElementById("yearTotal").innerHTML = rootNode.data.yearTotal.toLocaleString('en-US') + " tonnes";
    }

    updateDefaultWindow(rootNode, svg);
}

//***Centre Text Function ******************************************************
function centreTextFunction(p0, p1, text, yDiff) {
    const letterWidth = 7.5;
    const centrePoint = (p1 - p0) / 2;
    const numberOfSpaces = text.split(" ").length > 0 ? text.split(" ").length -1 : 0;
    const centreOfText = (text.length + numberOfSpaces) * letterWidth / 2;
    if (yDiff !== undefined) {
        return p0 + centrePoint + yDiff;
    } else {
        return p0 + centrePoint - centreOfText;
    }
}

function catCentreTextFunction(p0, p1, text, yDiff) {
    const letterWidth = 4.5;
    const centrePoint = (p1 - p0) / 2;
    const numberOfSpaces = text.split(" ").length > 0 ? text.split(" ").length -1 : 0;
    const centreOfText = (text.length + numberOfSpaces) * letterWidth / 2;
    if (yDiff !== undefined) {
        return p0 + centrePoint + yDiff;
    } else {
        return p0 + centrePoint - centreOfText;
    }
}

  //***Get Percentage Function ******************************************************
function getPercentageFunction(d, type) {
  if (type === "defaultWindow") {
      let yearData = selectDataByYear(selectedYear, importedData); //gets current year data in visualisation

      const amount = d.data.totalAmount; //amount of data per category
      const amountTotal = yearData.yearTotal; //total year data

      return `${Math.round(amount / amountTotal * 100*10)/10}%`;
    }
  if (type === "categoryWindow") {
    const amount = d.value;
    const amountTotal = selectedWasteCategoryAmount;

    return `${Math.round(amount / amountTotal * 100*10)/10}%`;
  }
  if (type === "typesWindow") {
    const amount = d.value;
    const amountTotal = selectedWasteCategoryAmount;

    return `${Math.round(amount / amountTotal * 100*10)/10}%`;
  }
}

  //***Text Manager Function ******************************************************
  //if rectangles are too small to display text, return nothing
function defaultManagerFunction(d, type) {
    if ((d.x1 - d.x0) < rectWidth || (d.y1 - d.y0) < rectHeight) {
        return null;
    }
    if (type === "name") {
        return d.data.name;
    }
    else
    {
      return d.data.totalAmount.toLocaleString('en-US') + " tonnes";
    }
}

function categoryManagerFunction(d, type) {

    if (type === 'name') {
      if ((x(d.x1) - x(d.x0)) < catRectWidth) {
          return null;
      }
      else
      {
        return d.name;
      }
    }
    if (type === 'amount'){
      if ((x(d.x1) - x(d.x0)) < catRectWidth) {
          return null;
      }
      else
      {
        return  d.value.toLocaleString('en-US') + " tonnes";
      }
    }
    if (type === 'percentage'){
      if ((x(d.x1) - x(d.x0)) < 30) {
          return null;
      }
      else
      {
        return  getPercentageFunction(d, "categoryWindow");
      }
    }
}

//***Colour Switch Functions ******************************************************
function colourSwitchFunction(d) {
    switch (d.data.name) {
        case categoryNames.masonry:
            return "#003c5c";
            break;
        case categoryNames.organics:
            return "#00597c";
            break;
        case categoryNames.ash:
            return "#00778e";
            break;
        case categoryNames.hazardous:
            return "#006663";
            break;
        case categoryNames.metals:
            return "#2CA047";
            break;
        case categoryNames.paper:
            return "#008F66";
            break;
        case categoryNames.plastics:
            return "#F9C80E";
            break;
        case categoryNames.glass:
            return "#F86624";
            break;
        case categoryNames.textiles:
            return "#EA3546";
            break;
        case categoryNames.other:
            return "#8A6A79";
            break;
    }
}
function textColourSwitchFunction(d) {
    switch (d.data.name) {
        case categoryNames.masonry:
            return "#F5F5F5";
            break;
        case categoryNames.organics:
            return "#F5F5F5";
            break;
        case categoryNames.ash:
            return "#F5F5F5";
            break;
        case categoryNames.hazardous:
            return "#F5F5F5";
            break;
        case categoryNames.metals:
            return "#F5F5F5";
            break;
        case categoryNames.paper:
            return "#F5F5F5";
            break;
        case categoryNames.plastics:
            return "#000000";
            break;
        case categoryNames.glass:
            return "#000000";
            break;
        case categoryNames.textiles:
            return "#000000";
            break;
        case categoryNames.other:
            return "#F5F5F5";
            break;
    }
}
function catBarChartSwitchFunction(d, i) {
  switch (d.name) {
    case destinationNames.energyrecovery:
      return "brightness(180%)";
      break;
    case destinationNames.landfillEnergy:
      return "brightness(170%)";
      break;
    case destinationNames.landfillDisposal:
      return "brightness(160%)";
      break;
    case destinationNames.recycling:
      return "brightness(150%)";
      break;
    case destinationNames.treatment:
      return "brightness(140%)";
      break;
    case destinationNames.otherDisposal:
    case sourcesNames.waste:
      return "brightness(190%)";
      break;
    case destinationNames.agriculture:
    case sourcesNames.agriculture:
      return "brightness(180%)";
      break;
    case destinationNames.mining:
    case sourcesNames.mining:
      return "brightness(170%)";
      break;
    case destinationNames.manufacturing:
    case sourcesNames.manufacturing:
      return "brightness(160%)";
      break;
    case destinationNames.elecGasWat:
    case sourcesNames.elecGasWat:
      return "brightness(150%)";
      break;
    case destinationNames.construction:
    case sourcesNames.construction:
      return "brightness(140%)";
      break;
    case destinationNames.publicAdmin:
    case sourcesNames.publicAdmin:
      return "brightness(130%)";
      break;
    case destinationNames.otherIndustries:
    case sourcesNames.otherIndustries:
      return "brightness(120%)";
      break;
    case destinationNames.households:
    case sourcesNames.households:
      return "brightness(110%)";
      break;
    case destinationNames.change:
      return "brightness(105%)";
      break;
    case destinationNames.exports:
    case sourcesNames.imports:
      return "brightness(100%)";
      break;

  }
}
function wasteTypeSwitchFunction(d, i) {
  switch (i) {
  case 0:
  return "#FFFFFF";
  break;
  case 1:
  return "#E8E8E8";
  break;
  case 2:
  return "#D3D3D3";
  break;
  case 3:
  return "#BEBEBE";
  break;
  case 4:
  return "#A8A8A8";
  break;
  case 5:
  return "#888888";
  break;
  case 6:
  return "#696969";
  break;
  }
}
//***Interactive DOM Element Functions ******************************************************
//functions that occur while the mouse is over an element
function mouseOverFunction(event, d) {
    //can only happen if in default window
   if (currentWindow === windowEnum.defaultView) {
        //saves last highlighted rectangle and fill;
        currentRect = this;
        currentRectColor = this.style.fill;

        d3.select(this)
        //changes the selected rectangle to highlighted color
        .style("fill", d3.color(currentRectColor).darker(1).formatHex())
   }
   if (currentWindow === windowEnum.categoryView) {

       if (this.getBoundingClientRect().height === catRectHeight) {
       currentCatRect = this;
       currentCatRectColor = this.style.fill;
       currentCatShade = this.style.filter;

       d3.select(this)
       .style("fill", d3.color(currentCatRectColor).darker(2).formatHex())
      }
   }
   if (currentWindow === windowEnum.typesView) {

       if (this.getBoundingClientRect().height === catRectHeight) {
       currentTypeRect = this;
       currentTypeRectColor = this.style.fill;
      }
   }
}
//functions that occur when the mouse leaves the element
function mouseOutFunction(d) {
 //can only happen if in default window
 if (currentWindow === windowEnum.defaultView) {
   d3.select(this)
   //returns colour value post-highlight
   .style("fill", function() {
       return currentRectColor;
     });
     // hides the more info window when mouse leaves the rect
     hideMoreInfo(d);
   };

   if (currentWindow === windowEnum.categoryView) {
    if (this.getBoundingClientRect().height === catRectHeight) {
       d3.select(this)
       //returns colour value post-highlight
       .style("fill", function() {
           return currentCatRectColor;
         });
         // hides the more info window when mouse leaves the rect
         hideMoreInfo(d);
       };
    }
    if (currentWindow === windowEnum.typesView) {
     if (this.getBoundingClientRect().height === catRectHeight) {
          // hides the more info window when mouse leaves the rect

          hideMoreInfo(d);
        };
     }
}

//live mouse location for more info tooltip
function mouseMoveFunction(event, d) {
  //mouse location
  var coords = d3.pointer(event);
  // using this cycle to update wasteTypeRect background colour
  d3.select(".wasteTypeRect")
  .attr('fill', currentRectColor)
  .style("filter", currentCatShade)
  //Displays pop up window if the rectangle is too small
  //getBoundingClientRect returns the size of an element and its position relative to the viewport. Because element.width doesn't return float.
  if (currentWindow === windowEnum.defaultView) {
    if (this.getBoundingClientRect().width < rectWidth || this.getBoundingClientRect().height < rectHeight) {

      d3.select("#moreInfoWindow")
        .attr('x', coords[0]-200)
        .attr('y', coords[1]-100);

      d3.select("#moreInfoWindowRect")
        .attr('x', coords[0]-200)
        .attr('y', coords[1]-100)
        .attr('visibility', "visible");

      d3.select("#moreInfoTitle")
          .attr("x", coords[0]-200 + 20)
          .attr("y", coords[1]-100 + 40)
          .text(d.data.name)
          .attr('visibility', "visible");

      d3.select("#moreInfoWindow")
         .attr('visibility', "visible");
      d3.select("#moreInfoAmount")
          .attr("x", coords[0]-200 + 20)
          .attr("y", coords[1]-100 + 60)
          .text(d.data.totalAmount.toLocaleString('en-US') + " tonnes")
          .attr('visibility', "visible")
     }
   }
   if (currentWindow === windowEnum.categoryView) {
     if (this.getBoundingClientRect().height === catRectHeight) {

       moreInfoNameLength = d.name.length;

       d3.select("#catMoreInfoWindow")
         .attr('x', (d) =>{
           return moreInfoSwapSides(event, d);
         })
         .attr('y', coords[1]-100);

       d3.select("#catMoreInfoWindowRect")
           .attr('x', (d) =>{
            return moreInfoSwapSides(event, d);
           })
         .attr('y', coords[1]-100)
         .attr('width', moreInfoNameLength < 16 ? 200 : moreInfoNameLength * 8)
         .attr('visibility', "visible");

       d3.select("#catMoreInfoTitle")
           .attr('x', (d) =>{
            return moreInfoSwapSides(event, d) + 20;
           })
           .attr("y", coords[1]-100 + 35)
           .text(d.name)
           .attr('visibility', "visible");

       d3.select("#catMoreInfoWindow")
          .attr('visibility', "visible");
       d3.select("#catMoreInfoAmount")
           .attr('x', (d) =>{
            return moreInfoSwapSides(event, d) + 20;
           })
           .attr("y", coords[1]-100 + 55)
           .text(d.value.toLocaleString('en-US') + " tonnes")
           .attr('visibility', "visible");

       d3.select("#catMoreInfoWindow")
          .attr('visibility', "visible");
       d3.select("#catMoreInfoPercentage")
           .attr('x', (d) =>{
             return moreInfoSwapSides(event, d) + 20;
           })
           .attr("y", coords[1]-100 + 75)
           .text(getPercentageFunction(d, "categoryWindow"))
           .attr('visibility', "visible")
         }
    }
    if (currentWindow === windowEnum.typesView) {

       if (this.getBoundingClientRect().height === catRectHeight) {
        moreInfoNameLength = d.name.length;

        d3.select("#typeMoreInfoWindow")
          .attr('x', (d) =>{
            return moreInfoSwapSides(event, d);
          })
          .attr('y', coords[1]-100);

        d3.select("#typeMoreInfoWindowRect")
            .attr('x', (d) =>{
             return moreInfoSwapSides(event, d);
            })
          .attr('y', coords[1]-100)
          .attr('width', moreInfoNameLength < 16 ? 200 : moreInfoNameLength * 10)
          .attr('fill', currentTypeRectColor)
          .attr('visibility', "visible");

        d3.select("#typeMoreInfoTitle")
            .attr('x', (d) =>{
             return moreInfoSwapSides(event, d) + 20;
            })
            .attr("y", coords[1]-100 + 35)
            .text(d.name)
            .attr('visibility', "visible");

        d3.select("#typeMoreInfoWindow")
           .attr('visibility', "visible");
        d3.select("#typeMoreInfoAmount")
            .attr('x', (d) =>{
             return moreInfoSwapSides(event, d) + 20;
            })
            .attr("y", coords[1]-100 + 55)
            .text(d.value.toLocaleString('en-US') + " tonnes")
            .attr('visibility', "visible");

        d3.select("#typeMoreInfoWindow")
           .attr('visibility', "visible");
        d3.select("#typeMoreInfoPercentage")
            .attr('x', (d) =>{
              return moreInfoSwapSides(event, d) + 20;
            })
            .attr("y", coords[1]-100 + 75)
            .text(getPercentageFunction(d, "categoryWindow"))
            .attr('visibility', "visible")
        }
    }
}

function moreInfoSwapSides(events, d) {
var coords = d3.pointer(event);
  if (coords[0] < 260){
    return coords[0]
  }
  else
  {
    return moreInfoNameLength < 16 ? coords[0]-200 : coords[0] - moreInfoNameLength * 10
  }
}

function hideMoreInfo(d) {
  //hides elements from mouse over, more info function
  d3.select("#moreInfoWindow").attr('visibility', "hidden");
  d3.select("#moreInfoWindowRect").attr('visibility', "hidden");
  d3.select("#moreInfoTitle").attr('visibility', "hidden");
  d3.select("#moreInfoAmount").attr('visibility', "hidden");

  d3.select("#catMoreInfoWindow").attr('visibility', "hidden");
  d3.select("#catMoreInfoWindowRect").attr('visibility', "hidden");
  d3.select("#catMoreInfoTitle").attr('visibility', "hidden");
  d3.select("#catMoreInfoAmount").attr('visibility', "hidden");
  d3.select("#catMoreInfoPercentage").attr('visibility', "hidden");

  d3.select("#typeMoreInfoWindow").attr('visibility', "hidden");
  d3.select("#typeMoreInfoWindowRect").attr('visibility', "hidden");
  d3.select("#typeMoreInfoTitle").attr('visibility', "hidden");
  d3.select("#typeMoreInfoAmount").attr('visibility', "hidden");
  d3.select("#typeMoreInfoPercentage").attr('visibility', "hidden");

}

//***Window Handling *************************************************************************

function openWasteCategoryWindow(d, svg){
  //prevents bug of the more info window not hiding upon opening waste categories
  hideMoreInfo(d);

  if (currentWindow === windowEnum.defaultView) {
    //prevents any functions on default window from being executed while in category view
    currentWindow = windowEnum.categoryView;

    selectedWasteCategory = d.data.name;
    selectedWasteCategoryAmount = d.data.totalAmount;

    updateWasteCategoryWindow(d, svg);

    //change visiibility of elements
    d3.select("#wasteCategoryWindow").attr('visibility', "visible");
    d3.select("#wasteCategoryTitle")
        .text(selectedWasteCategory)
        .attr('visibility', "visible");

    d3.select("#wasteCategoryWindow").attr('visibility', "visible");
    d3.select("#wasteCategoryAmount")
        .text(selectedWasteCategoryAmount.toLocaleString('en-US') + " tonnes")
        .attr('visibility', "visible");
    };
}

function closeWasteCategoryWindow(){

    d3.select(currentRect)
    //returns colour value post-highlight
    .style("fill", function() {
        return currentRectColor;
    });

    d3.select("#wasteCategoryWindow").attr('visibility', "hidden");
    d3.select("#wasteCategoryTitle").attr('visibility', "hidden");
    d3.select("#wasteCategoryAmount").attr('visibility', "hidden");

    if(document.getElementById("backButton")){
        document.getElementById("backButton").parentNode.removeChild(document.getElementById("backButton"))
    }


    if(document.getElementById("backButton2")){
        closeWasteTypeWindow();
    }
    //reverts current window state to default
    currentWindow = windowEnum.defaultView;

    selectedWasteCategory = null;
}

function openWasteTypeWindow(d, svg){
  if (currentWindow === windowEnum.categoryView) {
    //prevents any functions on default window from being executed while in category view
    currentWindow = windowEnum.typesView;

    selectedSourceOrDestination = d.name;
    selectedTypeAmount = d.value;

    hideMoreInfo(d);

    updateWasteTypeWindow(d, svg);

    //change visiibility of elements
    d3.select("#wasteTypeWindow").attr('visibility', "visible");
    d3.select("#wasteTypeTitle")
        .text(d.name)
        .attr('visibility', "visible");

    d3.select("#wasteTypeWindow").attr('visibility', "visible");
    d3.select("#wasteTypeAmount")
        .text(d.value.toLocaleString('en-US') + " tonnes")
        .attr('visibility', "visible")
    };
}

function closeWasteTypeWindow(){
  d3.select(currentCatRect)
  //returns colour value post-highlight
  .style("fill", function() {
      return currentCatRectColor;
  });

    d3.select("#wasteTypeWindow").attr('visibility', "hidden");
    d3.select("#wasteTypeTitle").attr('visibility', "hidden");
    d3.select("#wasteTypeAmount").attr('visibility', "hidden");

    if(document.getElementById("backButton2")){
        document.getElementById("backButton2").parentNode.removeChild(document.getElementById("backButton2"))
    }

    currentWindow = windowEnum.categoryView;

    selectedSourceOrDestination = null;
}



function main(){
    //Creates SVG DOM element to insert all elements of the visualization.
    let svg = d3.select(document.getElementById('visualization'))
    .append('svg')
    .attr('width', SvgSize.width)
    .attr('height', SvgSize.height)

    //load json data send it to where it can be turned into a treemap chart.
    d3.json("wasteData.json").then ((data) => {

        importedData = data
        //takes original Json dataset and converts it so it only displays the necessary information for the first treemap chart.
        let wasteCategoryData = selectDataByYear("2016", data);

        //creates a rootNode with a treemap format with the data selected.
        let rootNode = treemapSetup(wasteCategoryData, SvgSize.width, SvgSize.height);


        //updates all elements depending on the data given to it.
        update(rootNode, svg);

        let yearSelectionButtons = document.createElement('div');
        document.getElementById('visualization').appendChild(yearSelectionButtons);

        let button2016 = document.createElement('button');
        yearSelectionButtons.appendChild(button2016);
        button2016.innerHTML = "2016";
        button2016.value = 2016;
        button2016.onclick = () => {handleYearSelection(button2016, data, svg)}

        let button2017 = document.createElement('button');
        yearSelectionButtons.appendChild(button2017);
        button2017.innerHTML = "2017";
        button2017.value = 2017;
        button2017.onclick = () => {handleYearSelection(button2017, data, svg)}

        let button2018 = document.createElement('button');
        yearSelectionButtons.appendChild(button2018);
        button2018.innerHTML = "2018";
        button2018.value = 2018;
        button2018.onclick = () => {handleYearSelection(button2018, data, svg)}

    }, (err) => {
        alert(err);
    });
}

window.onload = () => {
    main();
}
