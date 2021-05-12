
function main(){
    let svg = d3.select(document.getElementById('visualisation'))

    svg.append('svg')
        .attr('width', 10)
        .attr('height', 10)
}

window.onload = () => {
    main();
}