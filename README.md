# data-visualization-project
 Data visualization project made with web technologies and D3. 

---

## Features
1. **Default View: Waste Category Display in a Treemap Chart**
    - shows Total Waste in tonnes w/ title
    - has rectangle for every waste cateogry
    - Shows name of waste categories
    - Shows tonnes of waste for each category
    - on mouse hover:
        - dims the rectangle selected
        - shows additional information for smaller rectangles shown that can't fit the information naturally.
    - on click: 
        - produces new window View -> Waste Category Window
        - adds back button
    - Year selection buttons
        - includes title marking the year the button is representing
        - onclick:
            - change the year the treemap chart is analyzing into the respective selected year.
            - change the shaded in button signalizing which year is currently selected. 

2. **Waste Category View:**
    - Title of category selected and its waste amount in tonnes
    - sub headers: waste destination and waste industry sources
    - 2 single stacked bar charts: (each)
        - represents all respective information needed
        - has title of industry/waste destination
        - on mouse hover:
            - dims rectangle selected
            - displays name if the rectangle is too small to show it
        - on mouse click: 
            - produces new window View -> showing the specific materials created/used 
            - adds back button
    
3. **Material sub-Category View:**
    - Title of source/destination selected and its waste amount in tonnes
    - single stacked bar chart: 
        - represents all waste sub-categories within it's rectanlges
        - has titles for all waste sub-categories, if they fit
        - on mouse hover/on mouse click: 
            - show specific values for waste sub category, especially in rectangles too small to show the info


