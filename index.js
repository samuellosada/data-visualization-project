
function main(){

    /*
    STEPS: 
    - create SVG area to show visualization.
    - get the data to a working state within the context of the program.
    - put the data into a treemap chart.
    - add design elements.
    - add animations.
    */

    //Creates SVG DOM element to insert all elements of the visualization.
    let width = 800;
    let height = 800;

    let svg = d3.select(document.getElementById('visualization'))
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g');


    //load json data send it to where it can be turned into a treemap chart.
    d3.json("wasteData.json").then ((data) => {

        //takes original Json dataset and converts it so it only displays the necessary information for the first treemap chart.
        var wasteCategories2016 = { "wasteCategories" : []}
        for (let i = 0; i < data.years[0].wasteCategories.length; i++){
            var {name, totalAmount} = data.years[0].wasteCategories[i]    
            wasteCategories2016.wasteCategories.push({name, totalAmount});
        }

        console.log(wasteCategories2016)

        //Create new Layout to make a treemap. Gives each child a given x, y and other properties we use to make treemap visualizations
        let treemapLayout = d3.treemap()
           .size([700, 700])
           .padding(2);

        //apparently allows you to select d3 layouts for hierarchical data. 
        let rootNode = d3.hierarchy(wasteCategories2016, (d)=> {return d.wasteCategories}); //Need to be able to let it know under what name all the children we need are.?? MAYBE THE SOLUTION???
        

        //provides value data to the value properties added.
        rootNode.sum((d) => {
            return d.totalAmount;
        });

        //rootNode.sort()  ADD Sort to make the other smaller squares more visible? 

        //assign the treemap layout to the hierarchichal data
        treemapLayout(rootNode);
        console.log(rootNode)
        
        svg
            .selectAll("rect")
            .data(rootNode.leaves())
            .enter()
            .append("rect")
                .attr('x', (d) => {return d.x0})
                .attr('y', (d) => {return d.y0})
                .attr('width', (d) => { 
                    console.log(d)
                    return d.x1 - d.x0})
                .attr('height', (d) => {return d.y1 - d.y0})
                .style('fill', "gray");

        svg 
            .selectAll("text")
            .data(rootNode.leaves())
            .enter()
            .append("text")
                .attr("x", (d) => {return d.x0 + 5})
                .attr("y", (d) => {return d.y0 + 20})
                .text((d) => {return d.data.name}) //data is used to access the leaf node properties.
                .attr("font-size", "15px")
                .attr("fill", "white")


    }, (err) => {
        alert(err)
    });
}

window.onload = () => {
    main();
}

/*
<script>

// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 445 - margin.left - margin.right,
  height = 445 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// read json data
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_dendrogram_full.json", function(data) {

  // Give the data to this cluster layout:
  var root = d3.hierarchy(data).sum(function(d){ return d.value}) // Here the size of each leave is given in the 'value' field in input data

  // Then d3.treemap computes the position of each element of the hierarchy
  d3.treemap()
    .size([width, height])
    .padding(2)
    (root)

  // use this information to add rectangles:
  svg
    .selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "black")
      .style("fill", "slateblue")

  // and to add the text labels
  svg
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
      .text(function(d){ return d.data.name })
      .attr("font-size", "15px")
      .attr("fill", "white")
})
</script>*/