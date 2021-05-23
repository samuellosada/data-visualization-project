// this represents the states the window of the visualisation can be in
const windowEnum = Object.freeze({"defaultView":1, "categoryView":2, "typesView":3})
// current window is the default view of the visualisation
let currentWindow = windowEnum.defaultView;
// get and saves highlighted rectangle
let currentRect;
// to get and save highlighted rectangle fill value
let currentRectColor;

function main(){
    //Creates SVG DOM element to insert all elements of the visualization.
    let width = 800;
    let height = 800;

    let svg = d3.select(document.getElementById('visualization'))
        .append('svg')
        .attr('width', width)
        .attr('height', height)

    //load json data send it to where it can be turned into a treemap chart.
    d3.json("wasteData.json").then ((data) => {

        //year enumeration, to help with the year selection.
        const Year = {"2016": 0};

        //designated area for year sellection control.
        let yearSelectionButtons = document.createElement('div');
        document.getElementById('visualization').appendChild(yearSelectionButtons);

        let button2016 = document.createElement('button');
        button2016.innerHTML = "2016";
        button2016.setAttribute('id', '2016');
        //button2016.onclick(); Need to find a way for them to actually change the year below...

        let button2017 = document.createElement('button');
        button2017.innerHTML = "2017";
        button2017.setAttribute('id', '2017');

        let button2018 = document.createElement('button');
        button2018.innerHTML = "2018";
        button2018.setAttribute('id', '2018');

        yearSelectionButtons.appendChild(button2016);
        yearSelectionButtons.appendChild(button2017);
        yearSelectionButtons.appendChild(button2018);


        //takes original Json dataset and converts it so it only displays the necessary information for the first treemap chart.
        var wasteCategories2016 = { "wasteCategories" : []}

        for (let i = 0; i < data.years[Year[2016]].wasteCategories.length; i++){
            var {name, totalAmount} = data.years[Year[2016]].wasteCategories[i]  //Json Destructuring syntax.
            wasteCategories2016.wasteCategories.push({name, totalAmount});
        }

        let treemapDIM = {width: 700, height: 700}
        //Create new Layout to make a treemap. Gives each child a given x, y and other properties we use to make treemap visualizations
        let treemapLayout = d3.treemap()
           .size([treemapDIM.width, treemapDIM.height])
           .padding(2)
           .paddingOuter(14);

        //apparently allows you to select d3 layouts for hierarchical data.
        let rootNode = d3.hierarchy(wasteCategories2016, (d)=> {return d.wasteCategories}); //Need to be able to let it know under what name all the children we need are.?? MAYBE THE SOLUTION???

        //provides value data to the value properties added.
        rootNode.sum((d) => {
            return d.totalAmount;
        });

        rootNode.sort((a, b) => b.value - a.value); // makes the squares more visible.

        //assign the treemap layout to the hierarchichal data
        treemapLayout(rootNode);

        //all windows will have their own 'g' group under the svg. Default window is the first one so all elements append to that for that window.
        let defaultWindow = svg.append('g').attr('id', 'defaultWindow');

        defaultWindow
            .selectAll("rect")
            .data(rootNode.leaves())
            .enter()
            .append("rect")
                .attr('x', (d) => {return d.x0})
                .attr('y', (d) => {return d.y0})
                .attr('width', (d) => {return d.x1 - d.x0})
                .attr('height', (d) => {return d.y1 - d.y0})
                .style("fill", function(d, i) { //colors each rectangle in the default view
                    switch (i) {
                      case 0:
                        return "#003c5c";
                        break;
                      case 1:
                        return "#00597c";
                        break;
                      case 2:
                        return "#00778e";
                        break;
                      case 3:
                        return "#00958f";
                        break;
                      case 4:
                        return "#41cb61";
                        break;
                      case 5:
                        return "#00b27f";
                        break;
                      case 6:
                        return "#a3e039";
                        break;
                      case 7:
                        return "#ffed00";
                        break;
                      case 8:
                        return "#e6eb00";
                      case 9:
                        return "#482077";
                        break;
                    }
                  })
                .on('click', (event, d) => {
                    openWasteCategoryWindow(d)
                })
                .on("mouseover", mouseOverFunction)
                .on("mouseout", mouseOutFunction);

        defaultWindow
            .selectAll("g")
            .data(rootNode.leaves())
            .enter()
            .append("text")
                .attr("x", (d) => {return d.x0 + 5})
                .attr("y", (d) => {return d.y0 + 20})
                .text((d) => {return d.data.name}) //data is used to access the leaf node properties.
                .attr("font-size", "15px")
                .attr("fill", "white")
                .on('click', (event, d) => {
                    openWasteCategoryWindow(d)
                });

        defaultWindow
            .selectAll("g")
            .data(rootNode.leaves())
            .enter()
            .append("text")
                .attr("x", (d) => {return d.x0 + 5})
                .attr("y", (d) => {return d.y0 + 50})
                .text((d) => {return d.data.totalAmount.toLocaleString('en-US') + " tonnes"})
                .attr("font-size", "15px")
                .attr("fill", "white")
                .on('click', (event, d) => {
                    openWasteCategoryWindow(d)
                });


        let wasteCategoryWindow = svg.append('g')
            .attr('id', "wasteCategoryWindow")
            .attr("visibility", "hidden");

        wasteCategoryWindow
            .append("rect")
                .attr('x', 30)
                .attr('y', 30)
                .attr('width', treemapDIM.width - 60)
                .attr('height', treemapDIM.height - 60)
                .attr('fill', "white")

        wasteCategoryWindow
            .append("text")
                .attr("id", "wasteCategoryTitle")
                .attr("x", 60)
                .attr("y", 60)
                .attr("font-size", "15px")
                .attr("fill", "black");


    }, (err) => {
        alert(err)
    });
}

function openWasteCategoryWindow(d){
  if (currentWindow === windowEnum.defaultView) {
      //prevents any functions on default window from being executed while in category view
      currentWindow = windowEnum.categoryView;

      //change visiibility of elements
      d3.select("#wasteCategoryWindow").attr('visibility', "visible");
      d3.select("#wasteCategoryTitle")
          .text(d.data.name)
          .attr('visibility', "visible");
};

    //new button should only be made if one does not already exist.
    if (!document.getElementById('backButton')){
        let backButton = document.createElement('button');
        backButton.innerHTML = "back";
        backButton.setAttribute('id', "backButton");
        backButton.onclick = () => {closeWasteCategoryWindow()};

        document.getElementById('visualization').appendChild(backButton);
    }
}

function closeWasteCategoryWindow(){
  //reverts current window state to default
  currentWindow = windowEnum.defaultView;
  d3.select(currentRect)
  //returns colour value post-highlight
  .style("fill", function() {
      return currentRectColor;
    });
    d3.select("#wasteCategoryWindow").attr('visibility', "hidden");
    d3.select("#wasteCategoryTitle").attr('visibility', "hidden");

    document.getElementById("backButton").parentNode.removeChild(document.getElementById("backButton")); //deletes back button when the window is closed.


}

function mouseOverFunction() {
  //can only happen if in default window
  if (currentWindow === windowEnum.defaultView) {
    //saves last highlighted rectangle and fill
    currentRect = this;
    currentRectColor = this.style.fill;
    d3.select(this)
    //changes the selected rectangle to highlighted color
      .style("fill", "pink")
    };

}

function mouseOutFunction(d) {
  //can only happen if in default window
  if (currentWindow === windowEnum.defaultView) {
    d3.select(this)
    //returns colour value post-highlight
    .style("fill", function() {
        return currentRectColor;
      });
    };
}

window.onload = () => {
    main();
}
