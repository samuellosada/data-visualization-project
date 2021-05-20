
function main(){
    /*
    STEPS: 
    - create SVG area to show visualization.
    - get the data to a working state within the context of the program.
    - put the data into a treemap chart.
    - Add onclick, mouseover events
    - add second child layer of the dataset in its own window. 
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
                .style('fill', "gray")
                .on('click', (event, d) => {
                    openWasteCategoryWindow(d)
                });

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
    //change visiibility of elements
    d3.select("#wasteCategoryWindow").attr('visibility', "visible");
    d3.select("#wasteCategoryTitle")
        .text(d.data.name)
        .attr('visibility', "visible");

   
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
    d3.select("#wasteCategoryWindow").attr('visibility', "hidden");
    d3.select("#wasteCategoryTitle").attr('visibility', "hidden");

    document.getElementById("backButton").parentNode.removeChild(document.getElementById("backButton")); //deletes back button when the window is closed. 
}

window.onload = () => {
    main();
}
