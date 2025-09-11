fetch('resep.json')
    .then(response => response.json())
    .then(jsonData => {
        const container = document.getElementById('recipes-container');
        
        jsonData.forEach(recipe => {
            if (recipe["Recipes Food"]) {
                const recipeContainer = document.createElement('div');
                recipeContainer.classList.add('recipe-container');

                const img = document.createElement('img');
                img.src = recipe["food image"];
                img.alt = recipe["Recipes Food"];
                img.classList.add('recipe-image');
                img.onclick = function() { toggleInfo(this) };

                const infoDiv = document.createElement('div');
                infoDiv.classList.add('recipe-info');
                infoDiv.innerHTML = `
                    <h3>${recipe["Recipes Food"]}</h3>
                    <p><strong>Bahan-bahan:</strong> ${recipe["The Ingredient"]}</p>
                    <p><strong>Effect Buff:</strong> ${recipe["The Effect"]}</p>
                `;

                recipeContainer.appendChild(img);
                recipeContainer.appendChild(infoDiv);
                container.appendChild(recipeContainer);
            }
        });
    });

function toggleInfo(imageElement) {
    const container = imageElement.parentElement;
    container.classList.toggle('show-info');
}
