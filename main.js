document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM fully loaded");

  const preloader = document.getElementById("preloader");
  const mainContent = document.getElementById("mainContent");
  const popup = document.getElementById("tiktok-popup");
  const tiktokContainer = document.getElementById("tiktok-container");
  const closeButton = document.getElementById("close-btn");
  const video = document.getElementById("backgroundVideo");
  const choiceScreen = document.getElementById("choiceScreen");
  const continueBtn = document.getElementById("continueBtn");
  const skipBtn = document.getElementById("skipBtn");
  const confirmButtons = document.getElementById("confirm-buttons");
const visitBtn = document.getElementById("visitBtn");
const cancelBtn = document.getElementById("cancelBtn");


  // === 1️⃣ TikTok embed setup ===
  const tiktokVideos = [
    "https://www.tiktok.com/@bangonegaming97/video/7426440636510817541",
    "https://www.tiktok.com/@bangonegaming97/video/7413656089650154758",
    "https://www.tiktok.com/@bangonegaming97/video/7404143266263731461",
    "https://www.tiktok.com/@bangonegaming97/video/7403707817988721925",
    "https://www.tiktok.com/@bangonegaming97/video/7347891752323403013",
    "https://www.tiktok.com/@bangonegaming97/video/7345782737170910470",
    "https://www.tiktok.com/@bangonegaming97/video/7346540023430319366",
    "https://www.tiktok.com/@bangonegaming97/video/7346891791330708741",
    "https://www.tiktok.com/@bangonegaming97/video/7347530691648802053"
  ];

  const randomVideoUrl = tiktokVideos[Math.floor(Math.random() * tiktokVideos.length)];
  const tiktokEmbedHtml = `
    <blockquote class="tiktok-embed" cite="${randomVideoUrl}" data-video-id="${randomVideoUrl.split('/').pop()}" style="max-width: 100%; max-height:100%; width: 418px;">
      <section></section>
    </blockquote>
  `;
  tiktokContainer.innerHTML = tiktokEmbedHtml;
  window.tiktokEmbedLoad && window.tiktokEmbedLoad();

  // === 2️⃣ Sembunyikan awal ===
  mainContent.style.display = "none";
  popup.style.display = "none";
  choiceScreen.style.display = "none";

  // === 3️⃣ Fungsi tunggu video siap ===
  function waitForVideoLoad() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000);
      video.oncanplaythrough = () => { clearTimeout(timeout); resolve(); };
      video.onerror = () => { clearTimeout(timeout); resolve(); };
    });
  }

  // === 4️⃣ Setelah video siap ===
Promise.all([waitForVideoLoad()]).then(() => {
    preloader.style.display = "none";
    choiceScreen.style.display = "flex";

    // Panggil AdSense sekarang, setelah container terlihat
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
        console.warn("Adsense push error:", e);
    }
});

// Tombol Continue → tampilkan konfirmasi
continueBtn.addEventListener("click", () => {
    // Sembunyikan tombol pilihan lain
    document.querySelectorAll(".choice-btn-container").forEach(container => {
        if (!container.contains(continueBtn)) {
            container.style.display = "none";
        }
    });

    // Tampilkan tombol konfirmasi (Visit & Cancel)
    confirmButtons.style.display = "flex";

    // Set aksi tombol Visit
    visitBtn.onclick = () => {
        // Sembunyikan layar pilihan
        choiceScreen.style.display = "none";

        // Tampilkan konten utama
        mainContent.style.display = "block";

        // Opsional: tampilkan popup TikTok
        popup.style.display = "flex";
        popup.style.left = "-400px";
        setTimeout(() => {
            popup.style.left = "20px"; // animasi slide-in
        }, 50);
    };
});

// Tombol Cancel → kembali ke tombol awal
cancelBtn.addEventListener("click", () => {
    document.querySelectorAll(".choice-btn-container").forEach(container => {
        container.style.display = "flex"; // tampilkan semua tombol
    });
    confirmButtons.style.display = "none"; // sembunyikan tombol konfirmasi
});
// Tombol Skip
skipBtn.addEventListener("click", () => {
    // Sembunyikan tombol lain
    document.querySelectorAll(".choice-btn-container").forEach(container => {
        if (!container.contains(skipBtn)) {
            container.style.display = "none";
        }
    });

    // Tampilkan tombol konfirmasi
    confirmButtons.style.display = "flex";

    // Set action untuk tombol Visit
    visitBtn.onclick = () => {
        window.location.href = "wherewindmeets/index.html";
    };
});
  // === 6️⃣ Tombol Close TikTok Popup ===
  closeButton.addEventListener("click", () => {
    popup.style.left = "-400px";
    console.log("Pop-up disembunyikan:", popup.style.left);
  });
});


// JavaScript will go here for further interactions if needed.
document.addEventListener('DOMContentLoaded', function() {
    console.log("Welcome to Earth Revival Guide!");
});

function openTab(event, tabId) {
    console.log('Tab ID:', tabId);

    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach((content) => {
        content.style.display = 'none';
        console.log(`Tab dengan ID "${content.id}" disembunyikan.`);
    });

    // Remove "active" class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach((button) => {
        button.classList.remove('active');
    });

    // Cek apakah elemen dengan ID tabId ditemukan
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        console.log(`Tab ditemukan: ${tabId}`);
        selectedTab.style.display = 'block';
        console.log(`Tab dengan ID "${tabId}" ditampilkan.`);
        event.currentTarget.classList.add('active');
    } else {
        console.error(`Tab dengan ID "${tabId}" tidak ditemukan.`);
    }
}



// Function to check if the center of the element is in the viewport's center
function isCenterVerticallyInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const elementCenterY = rect.top + rect.height / 2;
    const centerY = windowHeight / 2;
    const tolerance = 200;

    return (
        elementCenterY >= centerY - tolerance &&
        elementCenterY <= centerY + tolerance
    );
}

function isCenterHorizontallyInViewport(element) {
    const rect = element.getBoundingClientRect();
    const viewportCenterX = window.innerWidth / 2;
    const elementCenterX = rect.left + rect.width / 2;
    const tolerance = 100;

    return (
        elementCenterX >= viewportCenterX - tolerance &&
        elementCenterX <= viewportCenterX + tolerance
    );
}

function checkVisibility() {
    const titles = document.querySelectorAll('.map-title');

    let activeTitleFound = false;
    titles.forEach(title => {
        if (isCenterVerticallyInViewport(title.parentElement) && !activeTitleFound) {
            title.classList.add('visible');
            title.parentElement.classList.add('active');
            activeTitleFound = true;
        } else {
            title.classList.remove('visible');
            title.parentElement.classList.remove('active');
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const guideContainer = document.querySelector(".guide-buttons");
    const guideButtons = document.querySelectorAll(".guide-button");

    function updateActiveButton() {
        guideButtons.forEach(button => {
            if (isCenterHorizontallyInViewport(button)) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    }

    guideContainer.addEventListener("scroll", updateActiveButton);
});


// Event listeners for scroll and resize events
window.addEventListener('scroll', checkVisibility);
window.addEventListener('resize', checkVisibility);

// Initial check when the page loads
checkVisibility();
document.addEventListener("DOMContentLoaded", function() {
    const cookieNotification = document.querySelector(".cookie-notification");
    setTimeout(() => {
        cookieNotification.classList.add("show");
    }, 500); // Shows after 0.5 seconds
});

function acceptCookies() {
    document.querySelector(".cookie-notification").style.display = "none";
    // Add code here to save user consent (e.g., localStorage or cookies)
}
document.addEventListener("DOMContentLoaded", () => {
  fetch("https://autumn-dream-8c07.square-spon.workers.dev/recipe")
    .then(response => response.json())
    .then(data => {
      const recipeContainer = document.getElementById("recipe-container");
      const searchInput = document.getElementById("search-input");
      let currentlyVisibleInfo = null; // Track the currently visible info container

      // Store all recipe items to filter later
      const recipes = Object.keys(data).map(key => {
        const recipe = data[key];

        // Create main container for each recipe item
        const recipeDiv = document.createElement("div");
        recipeDiv.classList.add("recipe");

        // Image container
        const imageContainer = document.createElement("div");
        imageContainer.classList.add("image-container");

        const recipeImage = document.createElement("img");
        recipeImage.src = recipe.image_info;
        recipeImage.alt = recipe.name;
        recipeImage.classList.add("recipe-image");

        imageContainer.appendChild(recipeImage);

        // Info container with recipe details, hidden by default
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("info-container");
        infoContainer.style.display = "none"; // Hidden initially

        // Toggle visibility on image click
        recipeImage.addEventListener("click", () => {
          // If currentlyVisibleInfo is not the clicked infoContainer, hide the currently visible one
          if (currentlyVisibleInfo && currentlyVisibleInfo !== infoContainer) {
            currentlyVisibleInfo.style.display = "none";
          }

          // Toggle the clicked infoContainer
          if (infoContainer.style.display === "none") {
            infoContainer.style.display = "block";
            currentlyVisibleInfo = infoContainer; // Set the current visible info
          } else {
            infoContainer.style.display = "none";
            currentlyVisibleInfo = null; // Clear the current visible info
          }
        });

        // Title, effect, special effect, surprise effect, and ingredients
        const name = document.createElement("h3");
        name.textContent = `${recipe.name}`;

const effect = document.createElement("p");
effect.innerHTML = `<b>Effect:</b> ${recipe.effect}`;

const specialEffect = document.createElement("p");
specialEffect.innerHTML = `<b>Special Effect:</b> ${recipe.special_effect || "None"}`;

const surpriseEffect = document.createElement("p");
surpriseEffect.innerHTML = `<b>Surprise Effect:</b> ${recipe.surprise_effect || "None"}`;

        // Ingredients list
        const ingredientsList = document.createElement("ul");
        ingredientsList.classList.add("ingredients");
        recipe.ingredients.forEach(ingredient => {
          const ingredientItem = document.createElement("li");
          ingredientItem.textContent = ingredient;
          ingredientsList.appendChild(ingredientItem);
        });

        // Append elements to info container
        infoContainer.appendChild(name);
        infoContainer.appendChild(effect);
        infoContainer.appendChild(specialEffect);
        infoContainer.appendChild(surpriseEffect);
        infoContainer.appendChild(ingredientsList);

        // Append containers to the main recipe container
        recipeDiv.appendChild(imageContainer);
        recipeDiv.appendChild(infoContainer);

        // Return the recipe object and its corresponding div for filtering
        return { recipe, recipeDiv };
      });

      // Function to filter recipes based on search input
      const filterRecipes = () => {
        const searchTerm = searchInput.value.toLowerCase();
        recipes.forEach(({ recipe, recipeDiv }) => {
          if (recipe.name.toLowerCase().includes(searchTerm)) {
            recipeDiv.style.display = ""; // Show the recipe
          } else {
            recipeDiv.style.display = "none"; // Hide the recipe
          }
        });
      };

      // Add event listener for search input
      searchInput.addEventListener("input", filterRecipes);

      // Append all recipe containers to the recipe list
      recipes.forEach(({ recipeDiv }) => recipeContainer.appendChild(recipeDiv));
    })
    .catch(error => console.error("Error fetching recipes:", error));
});



document.addEventListener("DOMContentLoaded", () => {
    // Popup elements
    const popupForm = document.getElementById("popup-form");
    const addRecipeForm = document.getElementById("add-recipe-form");

    // Add button for each recipe to open the form
    const recipeContainer = document.getElementById("recipe-container");

    // Create and append the add button at the end of the recipe container
    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.classList.add("add-recipe-btn");
    addButton.style.display = "none"; // Initially hide the button
    recipeContainer.appendChild(addButton);

    // Show popup form when the add button is clicked
    addButton.addEventListener("click", () => {
        popupForm.style.display = "flex";
    });

    // Close popup form if clicking outside the form content
    popupForm.addEventListener("click", (e) => {
        if (e.target === popupForm) {
            popupForm.style.display = "none";
        }
    });

    // Handle form submission
    addRecipeForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Gather form data into an object
        const formData = {
            name: document.getElementById("recipe-name").value,
            effect: document.getElementById("recipe-effect").value,
            special_effect: document.getElementById("recipe-special-effect").value,
            surprise_effect: document.getElementById("recipe-surprise-effect").value,
            ingredients: Array.from(document.querySelectorAll(".ingredients-inputs input"))
                .map(input => input.value)
                .filter(value => value), // Filter out empty inputs
            ys_id: document.getElementById("recipe-ys-id").value || ""
        };

        // Fetch existing data from the endpoint
        const response = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/recipe");
        const existingData = await response.json();

        // Determine the next ID and add the new recipe to the existing data
        const newId = (Object.keys(existingData).length + 1).toString();
        existingData[newId] = { id: newId, ...formData, category: "3", image_info: "" };

        // Send the updated data to the endpoint using PUT
        await fetch("https://autumn-dream-8c07.square-spon.workers.dev/recipe", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existingData)
        });

        // Reset form fields and close the popup
        addRecipeForm.reset();
        popupForm.style.display = "none";
    });

    // Variables for the long press
    let longPressTimer;

    // Function to show the add button on long press
    recipeContainer.addEventListener("touchstart", (e) => {
        // Start the timer when the touch starts
        longPressTimer = setTimeout(() => {
            console.log("Button held for 5 seconds."); // Debugging
            // Show the add button
            addButton.style.display = "block";
        }, 5000); // 5 seconds
    });

    // Function to cancel the long press
    recipeContainer.addEventListener("touchend", () => {
        clearTimeout(longPressTimer); // Clear the timer if touch ends before 5 seconds
    });
    
    // Optionally, handle touch cancel in case the touch is interrupted
    recipeContainer.addEventListener("touchcancel", () => {
        clearTimeout(longPressTimer);
    });
});



document.addEventListener("DOMContentLoaded", () => {
    const cookingContainer = document.getElementById("cooking-container");
    const searchInput = document.getElementById("cooking-search-input");

    // Store cooking items in an array
    const cookingItems = [];

    // Fetch image data
    fetch("https://autumn-dream-8c07.square-spon.workers.dev/image_recipe")
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch images');
            return response.json();
        })
        .then(imageData => {
            const images = Object.values(imageData).filter(image => image.image && image.id);
            
            // Fetch food data after images are loaded
            return fetch("https://autumn-dream-8c07.square-spon.workers.dev/food")
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch food data');
                    return response.json();
                })
                .then(foodData => {
                    const foodArray = Object.values(foodData);
                    const foodMap = {};
                    foodArray.forEach(food => {
                        foodMap[food.id] = food;
                    });

                    // Display images and corresponding food data
                    images.forEach(imageData => {
                        const foodDiv = document.createElement("div");
                        foodDiv.classList.add("cooking-item");

                        // Create a container for name and image
                        const nameImageContainer = document.createElement("div");
                        nameImageContainer.classList.add("name-image-container"); // Class for CSS styling

                        const name = document.createElement("h4");
                        name.classList.add("recipe-name");
                        name.textContent = foodMap[imageData.id]?.name || "Unknown Name";

                        const imageContainer = document.createElement("div");
                        imageContainer.classList.add("image-container");

                        const foodImage = document.createElement("img");
                        foodImage.src = `data:image/jpeg;base64,${imageData.image.trim()}`;
                        foodImage.alt = `Image for ID: ${imageData.id}`;
                        foodImage.classList.add("cooking-recipe-image");
                        foodImage.style.width = "100%";
                        foodImage.style.height = "auto";

                        // Append the name and image to the container
                        nameImageContainer.appendChild(name);
                        imageContainer.appendChild(foodImage);
                        nameImageContainer.appendChild(imageContainer); // Append image container after name

                        // Append the name-image container to foodDiv
                        foodDiv.appendChild(nameImageContainer);

                        const infoContainer = document.createElement("div");
                        infoContainer.classList.add("info-container");

                        const foodDetails = foodMap[imageData.id];
                        if (foodDetails) {
                            const contribute = document.createElement("p");
                            contribute.classList.add("contribute");
                            contribute.innerHTML = `<span><strong>Contribute:</strong></span> <span>${foodDetails.ys_id || "Unknown"}</span>`;

                            // Add each cooking item to the array for search functionality
                            cookingItems.push({ 
                                name: foodDetails.name.toLowerCase(),
                                effect: foodDetails.effect.toLowerCase(),
                                specialEffect: foodDetails.special_effect ? foodDetails.special_effect.toLowerCase() : "",
                                surpriseEffect: foodDetails.surprise_effect ? foodDetails.surprise_effect.toLowerCase() : "",
                                element: foodDiv 
                            });

                            const effectsContainer = document.createElement("div");
                            effectsContainer.classList.add("effects-container");

                            const effect = document.createElement("p");
                            effect.classList.add("effect");
                            effect.innerHTML = `<span><strong>Effect:</strong></span> <span>${foodDetails.effect}</span>`;

                            const specialEffect = document.createElement("p");
                            specialEffect.classList.add("special-effect");
                            specialEffect.innerHTML = `<span><strong>Special Effect:</strong></span> <span>${foodDetails.special_effect || "None"}</span>`;

                            const surpriseEffect = document.createElement("p");
                            surpriseEffect.classList.add("surprise-effect");
                            surpriseEffect.innerHTML = `<span><strong>Surprise Effect:</strong></span> <span>${foodDetails.surprise_effect || "None"}</span>`;

                            effectsContainer.appendChild(effect);
                            effectsContainer.appendChild(specialEffect);
                            effectsContainer.appendChild(surpriseEffect);

                            const ingredientsTitle = document.createElement("h3");
                            ingredientsTitle.textContent = "Ingredients";
                            ingredientsTitle.style.textAlign = "center";

                            const ingredientsList = document.createElement("ul");
                            ingredientsList.classList.add("ingredients");
                            foodDetails.ingredients.forEach(ingredient => {
                                const ingredientItem = document.createElement("li");
                                ingredientItem.textContent = ingredient;
                                ingredientsList.appendChild(ingredientItem);
                            });

                            infoContainer.appendChild(contribute);
                            infoContainer.appendChild(effectsContainer);
                            infoContainer.appendChild(ingredientsTitle);
                            infoContainer.appendChild(ingredientsList);
                        }

                        foodDiv.appendChild(infoContainer);
                        cookingContainer.appendChild(foodDiv);
                    });

                    searchInput.addEventListener("input", () => {
                        const query = searchInput.value.toLowerCase();
                        cookingContainer.innerHTML = "";

                        cookingItems.forEach(item => {
                            if (
                                item.name.includes(query) ||
                                item.effect.includes(query) ||
                                item.specialEffect.includes(query) ||
                                item.surpriseEffect.includes(query)
                            ) {
                                cookingContainer.appendChild(item.element);
                            }
                        });
                    });
                });
        })
        .catch(error => console.error("Error fetching data:", error));
});


document.addEventListener("DOMContentLoaded", () => {
  const cookingPopupForm = document.getElementById("cooking-popup-form");
  const addCookingForm = document.getElementById("add-cooking-form");
  const addCookingButton = document.getElementById("add-cooking-button");
  const cookingContainer = document.getElementById("cooking-container");
  const loadingIndicator = document.getElementById("loading-indicator");
  
  const imageDisplayContainer = document.createElement("div");
  imageDisplayContainer.id = "image-display-container";
  cookingContainer.appendChild(imageDisplayContainer);

  addCookingButton.addEventListener("click", () => {
    cookingPopupForm.style.display = "flex";
  });

  cookingPopupForm.addEventListener("click", (e) => {
    if (e.target === cookingPopupForm) {
      cookingPopupForm.style.display = "none";
    }
  });

  addCookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate that at least two ingredients are filled
    const ingredientInputs = document.querySelectorAll(".ingredients-inputs input");
    const filledIngredients = Array.from(ingredientInputs).filter(input => input.value.trim() !== "");
    if (filledIngredients.length < 2) {
      alert("Please enter at least two ingredients.");
      return;
    }

    // Show the loading indicator
    loadingIndicator.style.display = "block";
    cookingPopupForm.style.display = "none"; // Hide form

    const formData = {
      name: document.getElementById("cooking-name").value,
      effect: document.getElementById("cooking-effect").value,
      special_effect: document.getElementById("cooking-special-effect").value,
      surprise_effect: document.getElementById("cooking-surprise-effect").value,
      ingredients: filledIngredients.map(input => input.value),
      ys_id: document.getElementById("cooking-ys-id").value
    };

    const imageInput = document.getElementById("cooking-image");
    const file = imageInput.files[0];
    let base64Image = "";

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      base64Image = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
      });
    }

    try {
      const foodResponse = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/food");
      const existingFoodData = await foodResponse.json();

      const newId = (Object.keys(existingFoodData).length + 1).toString();
      existingFoodData[newId] = { id: newId, ...formData, category: "3", image_info: newId };

      await fetch("https://autumn-dream-8c07.square-spon.workers.dev/food", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existingFoodData)
      });

      const imageRecipeResponse = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/image_recipe");
      const existingImageData = await imageRecipeResponse.json();

      existingImageData[newId] = { id: newId, image: base64Image };

      const finalImageResponse = await fetch("https://autumn-dream-8c07.square-spon.workers.dev/image_recipe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existingImageData)
      });

      if (finalImageResponse.ok) {
        console.log("Image data updated successfully.");
        await displayImage(newId);
      } else {
        console.error("Image upload failed:", await finalImageResponse.text());
      }

    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      // Hide the loading indicator after upload is complete
      loadingIndicator.style.display = "none";
      addCookingForm.reset(); // Reset all fields except ys_id
      document.getElementById("cooking-name").value = "";
      document.getElementById("cooking-effect").value = "";
      document.getElementById("cooking-special-effect").value = "";
      document.getElementById("cooking-surprise-effect").value = "";
      ingredientInputs.forEach(input => input.value = "");
      imageInput.value = "";
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
    const guideContainer = document.querySelector(".guide-buttons");
    const guideButtons = document.querySelectorAll(".guide-button");

    guideContainer.addEventListener("scroll", () => {
        const containerCenter = guideContainer.offsetWidth / 2;

        guideButtons.forEach(button => {
            const buttonCenter = button.offsetLeft + button.offsetWidth / 2 - guideContainer.scrollLeft;

            if (Math.abs(containerCenter - buttonCenter) < 60) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    });
});
// Fungsi untuk memuat video dan deskripsi
function loadVideo(videoId, videoTitle, videoThumbnail) {
    const videoFrame = document.getElementById('video-frame');
    const videoDescription = document.getElementById('video-description');
    
    // Menyusun URL video YouTube
    videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

    // Menambahkan deskripsi video (misalnya deskripsi pendek)
    videoDescription.textContent = `Now Playing: ${videoTitle}`;

    // Ubah thumbnail dan judul pada playlist
    // (Tambahkan logika lain jika diperlukan untuk menampilkan deskripsi lainnya)

};

// Function to dynamically create weapon, core, and mod placeholders
function createPlaceholders() {
    // Weapon Placeholder
    const weaponPlaceholder = document.getElementById('weapon-placeholder');
    const weaponImg = weaponPlaceholder.querySelector('.placeholder-img');
    weaponImg.src = 'weapon/placeholder.png';

    // Core Placeholder
    const corePlaceholder = document.getElementById('core-placeholder');
    const coreImg = corePlaceholder.querySelector('.placeholder-img');
    coreImg.src = 'core/placeholder.png';

    // Mod Placeholders (for 6 mods)
    const modPlaceholdersContainer = document.getElementById('mod-placeholders');
    modPlaceholdersContainer.innerHTML = ''; // Clear existing placeholders

    for (let i = 1; i <= 6; i++) {
        const modPlaceholder = document.createElement('div');
        modPlaceholder.classList.add('mod-placeholder', 'placeholder');
        modPlaceholder.id = `mod-placeholder-${i}`;

        const img = document.createElement('img');
        img.src = 'mod/placeholder.png';
        img.alt = `Mod Placeholder ${i}`;
        img.classList.add('placeholder-img');

        const questionMark = document.createElement('div');
        questionMark.classList.add('question-mark');
        questionMark.textContent = '?';

        modPlaceholder.appendChild(img);
        modPlaceholder.appendChild(questionMark);
        modPlaceholdersContainer.appendChild(modPlaceholder);
    }
}

function updatePlaceholders() {
    const weaponPlaceholder = document.getElementById('weapon-placeholder');
    const corePlaceholder = document.getElementById('core-placeholder');
    const modPlaceholdersContainer = document.getElementById('mod-placeholders');
    const selectedWeapon = document.querySelector('.battleware-set-item[data-name]');
    const selectedCore = document.querySelector('.selected-core-item[data-name]');
    const selectedMods = document.querySelectorAll('.selected-mod-item[data-name]');

    // Menyembunyikan atau menampilkan placeholder senjata
    if (selectedWeapon) {
        weaponPlaceholder.style.display = 'none';  // Sembunyikan placeholder senjata jika sudah dipilih
        console.log("Weapon placeholder hidden");
    } else {
        weaponPlaceholder.style.display = 'block';
        weaponPlaceholder.querySelector('.placeholder-img').src = 'weapon/placeholder.png';
        weaponPlaceholder.querySelector('.placeholder-text').style.display = 'block';  // Menampilkan teks placeholder kembali
        console.log("Weapon placeholder visible again");
    }

    // Menyembunyikan atau menampilkan placeholder core
    if (selectedCore) {
        corePlaceholder.style.display = 'none';  // Sembunyikan placeholder core jika sudah dipilih
        console.log("Core placeholder hidden");
    } else {
        corePlaceholder.style.display = 'block';
        corePlaceholder.querySelector('.placeholder-img').src = 'core/placeholder.png';
        console.log("Core placeholder visible again");
    }

    // Menyembunyikan atau menampilkan placeholder mod
    const modPlaceholders = modPlaceholdersContainer.querySelectorAll('.mod-placeholder');
    modPlaceholders.forEach((placeholder, index) => {
        if (index < selectedMods.length) {
            placeholder.style.display = 'none';  // Sembunyikan placeholder mod jika sudah dipilih
            console.log(`Mod placeholder ${index + 1} hidden`);
        } else {
            placeholder.style.display = 'block';
            placeholder.querySelector('.placeholder-img').src = 'mod/placeholder.png';
            console.log(`Mod placeholder ${index + 1} visible`);
        }
    });

    // Log status lengkap dari mod placeholders
    console.log("Updated mod placeholders:", modPlaceholdersContainer.innerHTML);
}





// Call the function to create placeholders
createPlaceholders();


function selectWeapon(name, imageUrl) {
    const weaponPlaceholder = document.getElementById('weapon-placeholder');
    const battlewareSet = document.getElementById('my-battleware-set');

    // Check if the weapon is already selected
    if (battlewareSet.querySelector(`[data-name="${name}"]`)) {
        alert(`Weapon "${name}" is already selected!`);
        return;
    }

    // Remove previous selected weapon, core, and mods
    battlewareSet.querySelectorAll('.battleware-set-item, .selected-core-item, .selected-mod-item').forEach(item => item.remove());
    removeModActiveEffect();
    removeWeaponActiveEffect();
    closeCorePopup();
    closeModPopup();

    // Create the image element for the selected weapon
    const weaponImage = document.createElement('img');
    weaponImage.src = imageUrl;
    weaponImage.alt = name;
    weaponImage.classList.add('selected-weapon-img');

    // Create the selected weapon item (with remove button)
    const weaponItem = document.createElement('div');
    weaponItem.classList.add('battleware-set-item');
    weaponItem.setAttribute('data-name', name);

    const weaponName = document.createElement('div');
    weaponName.classList.add('weapon-name');
    weaponName.textContent = name;

    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-button');
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => {
        battlewareSet.removeChild(weaponItem);
        removeWeaponActiveEffect();
        // Clear core and mods when the weapon is removed
        battlewareSet.querySelectorAll('.selected-core-item, .selected-mod-item').forEach(item => item.remove());
        removeModActiveEffect();
        closeCorePopup();
        closeModPopup();
        updatePlaceholders();
    };

    weaponItem.appendChild(weaponImage);
    weaponItem.appendChild(weaponName);
    weaponItem.appendChild(removeButton);

    battlewareSet.insertBefore(weaponItem, weaponPlaceholder);

    weaponPlaceholder.style.display = 'none';
    weaponPlaceholder.querySelector('.placeholder-text').style.display = 'none';

    // Open core popup when weapon is selected
    openCorePopup();
    updatePlaceholders();
}



// Fungsi untuk memilih Core
function selectCore(coreName, imageUrl) {
    const battlewareSet = document.getElementById('my-battleware-set');
    const corePlaceholder = document.getElementById('core-placeholder');
    const libraryBattleware = document.getElementById('library-popup');

    // Cek apakah core sudah dipilih
    if (battlewareSet.querySelector(`[data-name="${coreName}"]`)) {
        alert(`Core "${coreName}" is already selected!`);
        return;
    }

    // Hapus core dan mod yang dipilih sebelumnya
    battlewareSet.querySelectorAll('.selected-core-item, .selected-mod-item').forEach(item => item.remove());
    removeModActiveEffect();

    // Buat elemen core yang dipilih
    const coreItem = document.createElement('div');
    coreItem.classList.add('selected-core-item');
    coreItem.setAttribute('data-name', coreName);

    const coreImage = document.createElement('img');
    coreImage.src = imageUrl;
    coreImage.alt = coreName;

    // Tombol hapus untuk core
    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-button');
    removeButton.textContent = 'X';
    removeButton.onclick = () => {
        battlewareSet.removeChild(coreItem);
        corePlaceholder.style.display = 'block'; // Tampilkan kembali placeholder core
        corePlaceholder.querySelector('.placeholder-text').style.display = 'block'; // Tampilkan teks "?"
        openCorePopup(); // Buka kembali pop-up core
        updatePlaceholders();
    };

    coreItem.appendChild(coreImage);
    coreItem.appendChild(removeButton);

    // Sisipkan elemen core di atas placeholder core
    battlewareSet.insertBefore(coreItem, corePlaceholder);

    // Sembunyikan placeholder core
    corePlaceholder.style.display = 'none';
    corePlaceholder.querySelector('.placeholder-text').style.display = 'none';

    console.log("Core selected and added:", coreItem);
    console.log("Updated battleware set HTML after core added:", battlewareSet.innerHTML);

    activateCoreEffect(coreName);
    closeCorePopup(); // Tutup popup core
    updatePlaceholders();

    // Buka library battleware popup (jika diperlukan)
    if (libraryBattleware) {
        libraryBattleware.style.display = 'block';
        console.log("Library Battleware popup opened.");
    } else {
        console.warn("Library Battleware element not found.");
    }

    // Buka mod popup setelah core dipilih
    openModPopup();
}

// Fungsi untuk mengaktifkan efek core
function activateCoreEffect(coreName) {
    const coreItems = document.querySelectorAll('.core-content .mod-item');
    coreItems.forEach(item => {
        if (item.getAttribute('data-name') === coreName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Fungsi untuk menampilkan pop-up Core
function openCorePopup() {
    const corePopup = document.getElementById('corePopup');
    if (corePopup) {
        corePopup.style.display = 'flex';
    } else {
        console.warn("corePopup element not found.");
    }
}



function openCorePopup() {
    const corePopup = document.getElementById('corePopup');
    if (corePopup) {
        corePopup.style.display = 'flex';
        console.log("Core popup displayed.");
    } else {
        console.warn("corePopup element not found.");
    }
}

function closeCorePopup() {
    const corePopup = document.getElementById('corePopup');
    corePopup.style.display = 'none';
    console.log("Core popup closed.");
}



// Fungsi untuk memilih mod
function selectMod(name, imageUrl) {
    const battlewareSet = document.getElementById('my-battleware-set');
    const modPlaceholdersContainer = document.getElementById('mod-placeholders');
    const modPlaceholders = modPlaceholdersContainer.querySelectorAll('.mod-placeholder');

    // Cek apakah sudah memilih 6 mod
    if (battlewareSet.querySelectorAll('.selected-mod-item').length >= 6) {
        alert('You can only select up to 6 mods.');
        return;
    }

    // Cek apakah mod sudah dipilih
    if (battlewareSet.querySelector(`[data-name="${name}"]`)) {
        alert(`Mod "${name}" is already selected!`);
        return;
    }

    // Buat elemen mod yang dipilih
    const modItem = document.createElement('div');
    modItem.classList.add('selected-mod-item');
    modItem.setAttribute('data-name', name);

    const modImage = document.createElement('img');
    modImage.src = imageUrl;
    modImage.alt = name;

    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-button');
    removeButton.textContent = 'X';
    removeButton.onclick = () => {
        // Hapus kelas active saat item dihapus
        modItem.classList.remove('active');
        battlewareSet.removeChild(modItem);
        updatePlaceholders();
    };

    modItem.appendChild(modImage);
    modItem.appendChild(removeButton);

    // Tambahkan kelas active pada mod yang dipilih
    modItem.classList.add('active');

    // Temukan placeholder yang tersedia dalam `mod-placeholders`
    for (let placeholder of modPlaceholders) {
        if (placeholder.style.display !== 'none') {
            // Masukkan elemen mod di depan placeholder
            modPlaceholdersContainer.insertBefore(modItem, placeholder);
            placeholder.style.display = 'none';  // Sembunyikan placeholder
            console.log(`Mod "${name}" added successfully.`);
            break;
        }
    }

    updatePlaceholders();

    // Cek apakah 6 item sudah dipilih
    checkForSixItems();
}


// Event delegation untuk tombol hapus pada mod
document.getElementById('my-battleware-set').addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-button')) {
        const modItem = event.target.closest('.selected-mod-item');
        if (modItem) {
            console.log(`Removing mod: ${modItem.getAttribute('data-name')}`);
            modItem.remove();
            updatePlaceholders();
        }
    }
});
// Event listener untuk menambahkan kelas active saat gambar dipilih dari library
document.querySelector('#library-popup .library-popup-content').addEventListener('click', (event) => {
    if (event.target.closest('.mod-item')) {
        const modItem = event.target.closest('.mod-item');
        modItem.classList.add('active'); // Menambahkan kelas active saat item dipilih di pop-up
    }
});


function openModPopup() {
    const modPopup = document.getElementById('library-popup');
    if (modPopup) {
        modPopup.style.display = 'flex';
        console.log("Library Battleware popup opened.");
    } else {
        console.warn("Mod popup element not found.");
    }
}



// Fungsi untuk menghapus efek aktif pada core
function removeCoreActiveEffect() {
    const coreItems = document.querySelectorAll('.core-content .mod-item');
    coreItems.forEach(item => item.classList.remove('active'));
}

// Fungsi untuk menghapus efek aktif pada senjata
function removeWeaponActiveEffect() {
    const weaponItems = document.querySelectorAll('.weapon-item');
    weaponItems.forEach(item => item.classList.remove('active'));
}

// Fungsi untuk menghapus efek aktif pada mod di pop-up
function removeModActiveEffect() {
    const modItems = document.querySelectorAll('#library-popup .library-popup-content .mod-item');
    modItems.forEach(item => item.classList.remove('active'));
}

function closeModPopup() {
    const modPopup = document.getElementById('library-popup');
    if (modPopup) {
        modPopup.style.display = 'none';
        console.log("Mod popup closed.");
    }
}
// Fungsi untuk memeriksa apakah 6 item telah dipilih dan menutup pop-up 6 item serta menampilkan pop-up usernamedata
function checkForSixItems() {
    const selectedMods = document.querySelectorAll('.selected-mod-item');
    if (selectedMods.length === 6) {
        closeModPopup(); // Menutup pop-up 6 item
        openUserNamePopUp(); // Menampilkan pop-up username setelah 6 item dipilih
    }
}

// Menampilkan pop-up usernamedata
function openUserNamePopUp() {
    const usernameDataPopUp = document.getElementById('usernamedata');
    usernameDataPopUp.style.display = 'flex'; // Menampilkan pop-up
}

// Menutup pop-up usernamedata
function closeUserNamePopUp() {
    const usernameDataPopUp = document.getElementById('usernamedata');
    usernameDataPopUp.style.display = 'none'; // Menyembunyikan pop-up
}

// Fungsi untuk menutup pop-up mod jika pop-up sudah ada
function closeModPopup() {
    const modPopup = document.getElementById('library-popup');
    if (modPopup) {
        modPopup.style.display = 'none'; // Menutup pop-up mod jika ada
    }
}

let lastID = null;  // Variabel untuk menyimpan ID terakhir
let battlewaredata = {};  // Variabel untuk menyimpan data JSON lengkap

// Fungsi untuk mengambil data dari server dan menyimpan ke battlewaredata
async function fetchAndStoreData() {
    try {
        const response = await fetch('https://autumn-dream-8c07.square-spon.workers.dev/Battleware');
        const data = await response.json();
        battlewaredata = data;  // Simpan data JSON lengkap
        lastID = getLastID(data);  // Mendapatkan ID terakhir dari data

        // Menampilkan isi battlewaredata dalam format JSON yang rapi
        console.log('Isi battlewaredata:', JSON.stringify(battlewaredata, null, 2));

        // Setelah data berhasil dimuat, panggil displayVisitorPoster untuk menampilkan semua data
        displayVisitorPoster();  
    } catch (error) {
        console.error('Error fetching data:', error);
        lastID = 1;  // Jika gagal, set ID ke 1
    }
}

// Fungsi untuk mendapatkan ID terakhir dari data JSON
function getLastID(data) {
    const keys = Object.keys(data);
    if (keys.length > 0) {
        const maxID = Math.max(...keys.map(Number));
        return maxID + 1;
    } else {
        return 1;
    }
}

function displayVisitorPoster() {
    const posterContainer = document.getElementById("visitor-poster-content");

    // Iterasi untuk setiap ID yang ada di battlewaredata
    for (let id in battlewaredata) {
        const data = battlewaredata[id];

        // Membuat container baru untuk setiap ID battleware
        const battlewareSet = document.createElement('div');
        battlewareSet.id = `visitor-battleware-set-${id}`;
        battlewareSet.classList.add('visitor-battleware-set');

        // Membungkus nama build dalam container header terpisah
        const buildHeaderContainer = document.createElement('div');
        buildHeaderContainer.classList.add('visitor-build-header-container');

        const buildNameHeader = document.createElement('h2');
        buildNameHeader.classList.add('visitor-build-name-header');
        buildNameHeader.textContent = data.build_name || "Unnamed Build";

        buildHeaderContainer.appendChild(buildNameHeader);
        battlewareSet.appendChild(buildHeaderContainer);

        // Container untuk frame dan username
        const headerContainer = document.createElement('div');
        headerContainer.classList.add('visitor-header-container');

        // Menambahkan elemen Frame
        const profileFrame = document.createElement('img');
        profileFrame.src = `frames/${data.profile_frame}.png`;
        profileFrame.alt = 'Profile Frame';
        profileFrame.classList.add('visitor-profile-frame');

        // Menambahkan elemen Username
        const username = document.createElement('span');
        username.textContent = data.username;
        username.classList.add('visitor-username');

        headerContainer.append(profileFrame, username);
        battlewareSet.appendChild(headerContainer);

        // Menambahkan elemen Deskripsi tepat di bawah username
        const description = document.createElement('p');
        description.textContent = data.description;
        description.classList.add('visitor-description');
        battlewareSet.appendChild(description);

        // Menambahkan elemen Weapon Container
        const weaponContainer = document.createElement('div');
        weaponContainer.id = `visitor-weapon-container-${id}`;
        weaponContainer.classList.add('visitor-battleware-item');

        const weaponImage = document.createElement('img');
        weaponImage.src = data.weapon.image;
        weaponImage.alt = 'Visitor Weapon Image';

        const weaponName = document.createElement('span');
        weaponName.textContent = data.weapon.name;
        weaponName.classList.add('visitor-weapon-name');

        weaponContainer.append(weaponImage, weaponName);
        battlewareSet.appendChild(weaponContainer);

        // Menambahkan elemen Core Container
        const coreContainer = document.createElement('div');
        coreContainer.id = `visitor-core-container-${id}`;
        coreContainer.classList.add('visitor-core-item');
        const coreImage = document.createElement('img');
        coreImage.src = data.core.image;
        coreImage.alt = 'Visitor Core Image';
        coreContainer.appendChild(coreImage);
        battlewareSet.appendChild(coreContainer);

        // Menambahkan elemen Mod Container
        const modContainer = document.createElement('div');
        modContainer.id = `visitor-mod-placeholders-${id}`;
        modContainer.classList.add('visitor-mod-container');

        data.mod.forEach((mod) => {
            const modDiv = document.createElement('div');
            modDiv.classList.add('visitor-mod-item');

            const modImage = document.createElement('img');
            modImage.src = mod.image;
            modImage.alt = mod.name;

            const modName = document.createElement('span');
            modName.classList.add('visitor-mod-name');
            modName.textContent = mod.name;

            modDiv.append(modImage, modName);
            modContainer.appendChild(modDiv);
        });

        battlewareSet.appendChild(modContainer);

        // Menambahkan Tombol Link Video jika tersedia
        if (data.link_info) {
            const videoButton = document.createElement('a');
            videoButton.href = data.link_info;
            videoButton.textContent = 'Visit Videos Showcase';
            videoButton.target = '_blank';
            videoButton.classList.add('visitor-video-button');
            battlewareSet.appendChild(videoButton);
        }

        // Menambahkan container ke poster
        posterContainer.appendChild(battlewareSet);
    }
}


// Panggil fetchAndStoreData saat halaman dimuat
window.onload = fetchAndStoreData;

// Event listener untuk form submit
document.getElementById('buildForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Ambil data dari form
    const buildName = document.getElementById('buildName').value;
    const videoLink = document.getElementById('videoLink').value;
    const profileFrame = document.querySelector('input[name="profileFrame"]:checked').value;
    const description = document.getElementById('description').value;
    const username = document.getElementById('username').value;

    // Validasi URL video
    if (videoLink && !isValidUrl(videoLink)) {
        alert("Please enter a valid video URL.");
        return;
    }

    const weaponItem = document.querySelector('.battleware-set-item');
    const coreItem = document.querySelector('.selected-core-item');
    const modItems = document.querySelectorAll('.selected-mod-item');

    if (!weaponItem || !coreItem) {
        console.error("Senjata atau core belum dipilih!");
        return;
    }

    // Menyusun data senjata, core, dan mod
    const weaponData = {
        name: weaponItem.querySelector('.weapon-name').textContent,
        image: weaponItem.querySelector('img').getAttribute('data-image') || getRelativeImagePath(weaponItem.querySelector('img').src)
    };

    const coreData = {
        name: coreItem.querySelector('img').alt,
        image: coreItem.querySelector('img').getAttribute('data-image') || getRelativeImagePath(coreItem.querySelector('img').src)
    };

    const modData = [];
    modItems.forEach(modItem => {
        modData.push({
            name: modItem.querySelector('img').alt,
            image: modItem.querySelector('img').getAttribute('data-image') || getRelativeImagePath(modItem.querySelector('img').src)
        });
    });

    // Memastikan ID terakhir ada
    if (lastID === null) {
        console.error('No ID found! Menggunakan ID default 1');
        lastID = 1;
    }

    // Menyusun data build
    const buildData = {
        ...battlewaredata,
        [lastID]: {
            id: lastID,
            username: username,
            weapon: weaponData,
            core: coreData,
            mod: modData,
            build_name: buildName,
            description: description,
            link_info: videoLink,
            profile_frame: profileFrame
        }
    };

    // Log data untuk debugging
    console.log('ID terakhir:', lastID);
    console.log('Hasil akhir battlewaredata:', JSON.stringify(buildData, null, 2));

    // Kirim data ke server dengan metode PUT
    submitBuildData(buildData);

    // Kosongkan form
    document.getElementById('buildForm').reset();
    


    // Tutup modal
    const weaponModal = document.getElementById("weaponModal");
    weaponModal.style.display = "none";

    closeUserNamePopUp();
});



// Fungsi untuk menyegarkan visitor poster dengan data terbaru
function refreshVisitorPoster() {
    // Kosongkan container visitor poster terlebih dahulu
    const posterContainer = document.getElementById('visitor-poster-content');
    posterContainer.innerHTML = '';

    // Memanggil fetchAndStoreData untuk memuat ulang data dan menampilkan poster
    fetchAndStoreData(); // Pastikan fetchAndStoreData menangani pembaruan dengan benar
}



// Fungsi untuk memvalidasi URL
function isValidUrl(url) {
    const pattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
    return pattern.test(url);
}

// Fungsi untuk mendapatkan path relatif gambar
function getRelativeImagePath(absoluteUrl) {
    const urlParts = absoluteUrl.split('/');
    return `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;
}

// Fungsi untuk mengirim data ke server
function submitBuildData(buildData) {
    fetch('https://autumn-dream-8c07.square-spon.workers.dev/Battleware', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Terjadi masalah dengan status respons: ' + response.status);
        }
        return response.text();
    })
    .then(data => {
        alert('Build berhasil dikirim!');
        // Perbarui battlewaredata dengan buildData yang baru
        battlewaredata = buildData; // Update data lokal (pastikan menggunakan buildData yang sudah diperbarui)

        refreshVisitorPoster();

        // Panggil fungsi untuk menghapus weapon setelah submit
        removeWeaponAfterSubmit();
    })
    .catch(error => {
        console.error('Terjadi error saat mengirim data:', error);
        alert('Terjadi masalah saat mengirim build, tetapi data tetap dikirim.');
    });
}
// Fungsi untuk menghapus weapon setelah submit
function removeWeaponAfterSubmit() {
    const battlewareSet = document.getElementById('my-battleware-set');
    
    // Hapus weapon yang terpilih
    const selectedWeaponItem = battlewareSet.querySelector('.battleware-set-item');
    if (selectedWeaponItem) {
        selectedWeaponItem.remove();
    }

    // Hapus core dan mods
    battlewareSet.querySelectorAll('.selected-core-item, .selected-mod-item').forEach(item => item.remove());
    
    // Hapus efek aktif untuk mod dan weapon
    removeModActiveEffect();
    removeWeaponActiveEffect();
    closeCorePopup();
    closeModPopup();
    updatePlaceholders();
}

document.addEventListener("DOMContentLoaded", function () {
    const openModalBtn = document.getElementById("openModalBtn");
    const weaponModal = document.getElementById("weaponModal");
    const closeModalBtn = document.getElementById("closeModalBtn");

    // Buka modal saat tombol diklik
    openModalBtn.addEventListener("click", () => {
        weaponModal.style.display = "block";
    });

    // Tutup modal saat tombol close diklik
    closeModalBtn.addEventListener("click", () => {
        weaponModal.style.display = "none";
    });

    // Tutup modal saat user mengklik area di luar modal
    window.addEventListener("click", (event) => {
        if (event.target === weaponModal) {
            weaponModal.style.display = "none";
        }
    });
});

// Fungsi untuk memulai Intro.js
function startIntro() {
    const intro = introJs();
    intro.setOptions({
        showButtons: false,        // Hilangkan tombol Next, Prev, Skip
        showStepNumbers: false,    // Tidak menampilkan nomor langkah
        exitOnOverlayClick: false, // Cegah keluar saat klik overlay
        highlightClass: 'intro-highlight',
        tooltipClass: 'intro-tooltip',
        overlayOpacity: 0.6,
        showBullets: false,
        scrollToElement: true,
    }).onbeforechange(function (element) {
        // Pastikan elemen tidak undefined sebelum scroll
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }).onexit(function () {
        console.log("Tour selesai atau keluar.");
    }).onafterchange(function () {
        // Klik overlay dianggap sebagai "next"
        const overlay = document.querySelector('.introjs-overlay');
        if (overlay) {
            overlay.onclick = () => {
                intro.nextStep();
            };
        }
    });

    // Memulai tour otomatis setelah konten dimuat
    intro.start();
}
// Ambil elemen video dan gambar latar belakang
const video = document.getElementById("backgroundVideo");
const imageBackground = document.getElementById("imageBackground");

// Daftar gambar yang akan digunakan sebagai fallback
const images = [
    'https://via.placeholder.com/1920x1080/ff7f7f/333333?text=Background+1',
    'https://via.placeholder.com/1920x1080/ffbf00/333333?text=Background+2',
    'https://via.placeholder.com/1920x1080/7f7fff/333333?text=Background+3'
];

// Fungsi untuk mengubah gambar latar belakang secara dinamis
function changeBackgroundImage() {
    let index = 0;
    setInterval(() => {
        imageBackground.style.backgroundImage = `url(${images[index]})`;
        index = (index + 1) % images.length; // Menjaga indeks tetap dalam batas
    }, 5000); // Ganti gambar setiap 5 detik
}

// Memeriksa apakah video dapat diputar
video.addEventListener('canplay', () => {
    console.log("Video berhasil diputar.");
    imageBackground.style.display = 'none'; // Sembunyikan gambar jika video berhasil diputar
});

// Jika video gagal diputar, gunakan gambar sebagai fallback
video.addEventListener('error', () => {
    console.log("Video gagal diputar, menggunakan gambar sebagai background.");
    changeBackgroundImage();
});

// Jika video error pada awalnya (fallback), langsung jalankan gambar
if (video.error) {
    console.log("Video gagal diputar, menggunakan gambar sebagai fallback.");
    changeBackgroundImage();
}

