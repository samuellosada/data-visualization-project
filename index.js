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
      .selectAll("g")
      .data(rootNode.leaves())
        .enter()
          .append("rect")
          .attr('class', 'coverup')
          .attr('x', (d) => {return d.x0})
          .attr('y', (d) => {return d.y0})
          .attr('width', SvgSize.width)
          .attr('height', SvgSize.height)
          .style("fill", "#fafafa");

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
              return centreTextFunction(d.x0, d.x1, `10%`);
             })
            .attr("y", (d) => {
              return centreTextFunction(d.y0, d.y1, `10%`, 20);
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
            .style("pointer-events", "none")
            .attr("rx", "25");

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
    var rootNode = [];

    let count = 0;
    for(let i = 0; i < searchedArray.length; i++){
        var { name, totalAmount } = searchedArray[i];

        let value = totalAmount;
        let x0 = count;
        let x1 = count + value;
        count += value;

        rootNode.push({name, value, x0, x1});
    }
//fixed
    return rootNode.sort((a, b) => {
        return d3.ascending(a.value, b.value)
    });
}

function updateWasteCategoryWindow(data, svg){

    let wasteCategoryWindow;
    if(!document.getElementById("wasteCategoryWindow")){
        wasteCategoryWindow = svg.append('g')
        .attr('id', "wasteCategoryWindow")
        .attr("visibility", "hidden");

    } else {
        wasteCategoryWindow = d3.select("#wasteCategoryWindow");
    }

    wasteCategoryWindow
    .append("rect")
        .attr('x', 30)
        .attr('y', 30)
        .attr('width', SvgSize.width - 60)
        .attr('height', SvgSize.height - 60)
        .attr('fill', "white")

    wasteCategoryWindow
        .append("text")
            .attr("id", "wasteCategoryTitle")
            .attr("x", 60)
            .attr("y", 60)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black");

    wasteCategoryWindow
        .append("text")
            .attr("id", "wasteCategoryAmount")
            .attr("x", SvgSize.width - 200)
            .attr("y", 60)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black");

    wasteCategoryWindow
        .append("text")
            .text("Industry Sources:")
            .attr("class", "barChartTitle")
            .attr("x", 60)
            .attr("y", 150)
            .attr("font-size", "15px")
            .attr("fill", "black")

    wasteCategoryWindow
        .append("text")
            .text("Waste Destinations:")
            .attr("class", "barChartTitle")
            .attr("x", 60)
            .attr("y", 350)
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
                    .attr("y", 175)
                    .attr("width", d => {
                        return (x(d.x1) - x(d.x0) - 2 < 0) ? 0 : x(d.x1) - x(d.x0) - 1.5;
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
                      .attr("y", 220)
                      .text((d) => {
                        return categoryManagerFunction(d, 'name');
                      }) //data is used to access the leaf node properties.
                      .attr("font-size", "11px")
                      .attr("fill", "black")
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
                  .attr("y", 240)
                  .text((d) => {
                    return categoryManagerFunction(d, 'amount');
                  }) //data is used to access the leaf node properties.
                  .attr("font-size", "11px")
                  .attr("fill", "black")
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
                    return catCentreTextFunction(x(d.x0), x(d.x1), `10%`);
                })
                  .attr("y", 260)
                  .text((d) => {
                    return categoryManagerFunction(d, 'percentage');
                  }) //data is used to access the leaf node properties.
                  .attr("font-size", "11px")
                  .attr("fill", "black")
                  .style("pointer-events", "none");
              }
          )

        wasteCategoryWindow
            .selectAll('.IndustrySourceTag')
            .data(industrySourceRootNode, d => d.name)
            .join(
                function(enter){
                    return enter
                    .append("text")
                    .attr("class", '.IndustrySourceTag')
                    .text(d => {
                        if ((x(d.x1) - x(d.x0)) > 80){
                            return d.name
                        } else {
                            return null
                        }
                    })
                    .attr('x', d => x(d.x0))
                    .attr("y", 200)
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
                    .attr("y", 375)
                    .attr("width", d => {
                        return (x(d.x1) - x(d.x0) - 2 < 0) ? 0 : x(d.x1) - x(d.x0) - 1.5;
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
            .selectAll('.IndustryDestinationTag')
            .data(industrySourceRootNode, d => d.name)
            .join(
                function(enter){
                    return enter
                    .append("text")
                    .attr("class", '.IndustrySourceTag')
                    .text(d => {
                        if ((x(d.x1) - x(d.x0)) > 80){
                            return d.name
                        } else {
                            return null
                        }
                    })
                    .attr('x', d => x(d.x0))
                    .attr("y", 400)
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
                    .attr("y", 420)
                    .text((d) => {
                      return categoryManagerFunction(d, 'name');
                    }) //data is used to access the leaf node properties.
                    .attr("font-size", "11px")
                    .attr("fill", "black")
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
                .attr("y", 440)
                .text((d) => {
                  return categoryManagerFunction(d, 'amount');
                }) //data is used to access the leaf node properties.
                .attr("font-size", "11px")
                .attr("fill", "black")
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
                  return catCentreTextFunction(x(d.x0), x(d.x1), `10%`);
              })
                .attr("y", 460)
                .text((d) => {
                  return categoryManagerFunction(d, 'percentage');
                }) //data is used to access the leaf node properties.
                .attr("font-size", "11px")
                .attr("fill", "black")
                .style("pointer-events", "none");
            }
        )
        // more info tool tip window
        let catMoreInfoWindow = svg.append('g')
            .attr('id', "catMoreInfoWindow")
            .attr("visibility", "hidden");

        catMoreInfoWindow
            .append("rect")
                .attr('id', "catMoreInfoWindowRect")
                .attr('width', 200)
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
                .attr('x', 60)
                .attr('y', 60)
                .attr('width', SvgSize.width - 120)
                .attr('height', SvgSize.height - 120)
                .attr('fill', "#fafafa")
    } else {
        wasteTypeWindow = d3.select("#wasteTypeWindow");
    }

    wasteTypeWindow
        .append("text")
            .attr("id", "wasteTypeTitle")
            .attr("x", 120)
            .attr("y", 120)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black");

    wasteTypeWindow
        .append("text")
            .attr("id", "wasteTypeAmount")
            .attr("x", SvgSize.width - 260)
            .attr("y", 120)
            .attr("font-size", "15px")
            .attr("font-weight", "700")
            .attr("fill", "black");




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
    const letterWidth = 8;
    const centrePoint = (p1 - p0) / 2;
    const centreOfText = text.length * letterWidth / 2;
    if (yDiff !== undefined) {
        return p0 + centrePoint + yDiff;
    } else {
        return p0 + centrePoint - centreOfText;
    }
}

function catCentreTextFunction(p0, p1, text, yDiff) {
    const letterWidth = 5.5;
    const centrePoint = (p1 - p0) / 2;
    const centreOfText = text.length * letterWidth / 2;
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

      return `${Math.floor(amount / amountTotal * 100)}%`;
    }
  if (type === "categoryWindow") {
    const amount = d.value;
    const amountTotal = selectedWasteCategoryAmount;

    return `${Math.floor(amount / amountTotal * 100)}%`;
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
            return "#00958f";
            break;
        case categoryNames.metals:
            return "#41cb61";
            break;
        case categoryNames.paper:
            return "#00b27f";
            break;
        case categoryNames.plastics:
            return "#a3e039";
            break;
        case categoryNames.glass:
            return "#ffed00";
            break;
        case categoryNames.textiles:
            return "#e6eb00";
            break;
        case categoryNames.other:
            return "#482077";
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
      return "brightness(270%)";
      break;
    case destinationNames.landfillEnergy:
      return "brightness(260%)";
      break;
    case destinationNames.landfillDisposal:
      return "brightness(250%)";
      break;
    case destinationNames.recycling:
      return "brightness(240%)";
      break;
    case destinationNames.treatment:
      return "brightness(230%)";
      break;
    case destinationNames.otherDisposal:
    case sourcesNames.waste:
      return "brightness(220%)";
      break;
    case destinationNames.agriculture:
    case sourcesNames.agriculture:
      return "brightness(210%)";
      break;
    case destinationNames.mining:
    case sourcesNames.mining:
      return "brightness(200%)";
      break;
    case destinationNames.manufacturing:
    case sourcesNames.manufacturing:
      return "brightness(190%)";
      break;
    case destinationNames.elecGasWat:
    case sourcesNames.elecGasWat:
      return "brightness(180%)";
      break;
    case destinationNames.construction:
    case sourcesNames.construction:
      return "brightness(170%)";
      break;
    case destinationNames.publicAdmin:
    case sourcesNames.publicAdmin:
      return "brightness(160%)";
      break;
    case destinationNames.otherIndustries:
    case sourcesNames.otherIndustries:
      return "brightness(150%)";
      break;
    case destinationNames.households:
    case sourcesNames.households:
      return "brightness(140%)";
      break;
    case destinationNames.change:
      return "brightness(135%)";
      break;
    case destinationNames.exports:
    case sourcesNames.imports:
      return "brightness(140%)";
      break;

  }
}
//***Interactive DOM Element Functions ******************************************************

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

       d3.select(this)
       .style("fill", d3.color(currentCatRectColor).darker(2).formatHex())
      }
   }
}

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
}

//live mouse location for more info tooltip
function mouseMoveFunction(event, d) {
  var coords = d3.pointer(event);
console.log(coords[0], coords[1]);
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
}

function moreInfoSwapSides(events, d) {
var coords = d3.pointer(event);
  if (coords[0] < 260){
    return coords[0]
  }
  else
  {
    return coords[0]-200
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
        .text(d.data.name)
        .attr('visibility', "visible");

    d3.select("#wasteCategoryWindow").attr('visibility', "visible");
    d3.select("#wasteCategoryAmount")
        .text(d.data.totalAmount.toLocaleString('en-US') + " tonnes")
        .attr('visibility', "visible")
    };

    //new button should only be made if one does not already exist.
    if (!document.getElementById('backButton')){
        let backButton = document.createElement('button');
        backButton.innerHTML = "&#10006"; // unicode for x symbol
        backButton.setAttribute('id', "backButton");
        backButton.onclick = () => {closeWasteCategoryWindow()};

        document.getElementById('visualization').appendChild(backButton);
    }

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

    //new button should only be made if one does not already exist.
    if (!document.getElementById('backButton2')){
        let backButton = document.createElement('button');
        backButton.innerHTML = "Second &#10006"; // unicode for x symbol
        backButton.setAttribute('id', "backButton2");
        backButton.onclick = () => {closeWasteTypeWindow()};

        document.getElementById('visualization').appendChild(backButton);
    }

}

function closeWasteTypeWindow(){

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
        button2016.onclick = () => {handleYearSelection(button2016, data, svg), closeWasteCategoryWindow()}

        let button2017 = document.createElement('button');
        yearSelectionButtons.appendChild(button2017);
        button2017.innerHTML = "2017";
        button2017.value = 2017;
        button2017.onclick = () => {handleYearSelection(button2017, data, svg), closeWasteCategoryWindow()}

        let button2018 = document.createElement('button');
        yearSelectionButtons.appendChild(button2018);
        button2018.innerHTML = "2018";
        button2018.value = 2018;
        button2018.onclick = () => {handleYearSelection(button2018, data, svg), closeWasteCategoryWindow()}

    }, (err) => {
        alert(err);
    });
}

window.onload = () => {
    main();
}
