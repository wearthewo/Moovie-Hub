let debounceTimer;
const API_KEY = "ENTER YOUR TMDP API KEY";
const loginBtn = document.getElementById("login-btn");
const searchInput = document.getElementById("SearchInput");
const favoriteBtn = document.getElementById("show-favorites-btn");

document.addEventListener("DOMContentLoaded", () => {
  if (loginBtn) {
    loginBtn.addEventListener("click", auth);
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(searchMovies, 500);
    });
  }
  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", () => {
      window.location.href = "favorites.html";
      //displayMovies(favoriteMovies, "favoritesList");
    });
  }
});

const auth = async () => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/authentication/token/new?api_key=${API_KEY}`
    );
    const requestToken = response.data.request_token;
    console.log(requestToken);
    localStorage.setItem("request_token", requestToken);
    console.log(localStorage.getItem("request_token"));
    if (requestToken) {
      //const authUrl = `https://www.themoviedb.org/authenticate/${requestToken}`;
      //alert(`Please authorize the token by visiting: ${authUrl}`);
      const authUrl = `https://www.themoviedb.org/authenticate/${requestToken}?redirect_to=http://www.localhost:5501/movies.html`;
      window.location.href = authUrl;

      setTimeout(async () => {
        //const sessionId = await getSessionId(requestToken);
        const sessionId = await getSessionId();
        localStorage.setItem("session_id", sessionId);
        console.log("Stored Session ID:", sessionId);
        console.log(
          "Session ID saved to localStorage:",
          localStorage.getItem("session_id")
        );
        const accountId = await getAccountId(sessionId);
        localStorage.setItem("account_id", accountId);
        console.log("Stored Account ID:", accountId);
        window.location.href = "movies.html";
        return requestToken, sessionId, accountId;
      }, 10000); // Wait 10 seconds for user to authorize
    } else {
      console.error("No request token found.");
    }
  } catch (error) {
    console.error(error);
  }
};

async function getSessionId(requestToken) {
  try {
    const response = await axios.post(
      `https://api.themoviedb.org/3/authentication/session/new`,
      {
        request_token: requestToken,
      },
      {
        params: { api_key: API_KEY },
      }
    );

    const sessionId = response.data.session_id;
    console.log("Session ID:", sessionId);

    //Store session_id in local storage
    localStorage.setItem("session_id", sessionId);

    return sessionId;
  } catch (error) {
    console.error(
      "Error creating session:",
      error.response?.data || error.message
    );
  }
}

async function getAccountId(sessionId) {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/account`, {
      params: {
        api_key: API_KEY,
        session_id: sessionId,
      },
    });

    const accountId = response.data.id;
    console.log("Account ID:", accountId);
    localStorage.setItem("account_id", accountId);
    console.log(localStorage.getItem("account_id"));
    return accountId;
  } catch (error) {
    console.error(
      "Error fetching account ID:",
      error.response?.data || error.message
    );
  }
}

const searchMovies = async () => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${searchInput.value}`
    );
    const movies = response.data.results;
    console.log(movies);
    const movieList = document.getElementById("movieList");
    movieList.innerHTML = movies
      .map(
        (movie) => `
          <div class="bg-black-800 rounded-lg overflow-hidden shadow-lg p-4 relative"> 
          <div class="absolute top-3 right-3 cursor-pointer text-2xl"
           onclick="addMovieToFavorites(${movie.id})"> ❤️ </div>
              <img src=https://image.tmdb.org/t/p/w500${movie.backdrop_path}
                   alt="${
                     movie.original_title
                   }" class="w-full h-60 object-cover rounded-lg">
              <h2 class="text-lg font-semibold mt-2 text-center">${
                movie.original_title
              }</h2>
              <p class="text-sm text-gray-400 text-center">${
                movie.release_date.split("-")[0]
              }</p> 
              
          </div>
      `
      )
      .join("");
  } catch (error) {
    console.error(error);
  }
};

// Function to add a movie to favorites using the session ID
async function addMovieToFavorites(movieId) {
  //sessionId
  try {
    const accountId = localStorage.getItem("account_id");
    const sessionId = localStorage.getItem("session_id");
    console.log(accountId);
    if (!sessionId || !accountId) {
      console.error("Could not retrieve account ID.");
      //return;
    }
    if (
      !localStorage.getItem("session_id") ||
      !localStorage.getItem("account_id")
    ) {
      auth(); // Call function to fetch a new session_id
    }

    // Check if the movie is already in favorites
    let isFavorite = false;
    const favoriteMovies =
      JSON.parse(localStorage.getItem("favoriteMovies")) || [];

    if (favoriteMovies.includes(movieId)) {
      isFavorite = true;
      favoriteMovies.splice(favoriteMovies.indexOf(movieId), 1);
    } else {
      favoriteMovies.push(movieId);
    }

    // Save updated favorite movies list in localStorage
    localStorage.setItem("favoriteMovies", JSON.stringify(favoriteMovies));
    console.log(localStorage.getItem("favoriteMovies"));

    const response = await axios.post(
      `https://api.themoviedb.org/3/account/{accountId}/favorite`,
      {
        media_type: "movie", // Type of media (movie in this case)
        media_id: movieId, // The movie ID
        favorite: !isFavorite, // Toggles favorite status (true to add, false to remove)
      },
      {
        params: {
          api_key: API_KEY, // Replace with your API key
          session_id: sessionId, // The valid session ID for the authenticated user
        },
      }
    );

    // Log success message or data if the movie is added successfully
    console.log("Movie added to favorites:", response.data);
    console.log(`Movie ${isFavorite ? "removed from" : "added to"} favorites!`);
    alert(`Movie ${isFavorite ? "removed from" : "added to"} favorites!`);
  } catch (error) {
    console.error(
      "Error adding movie to favorites:",
      error.response?.data || error.message
    );
  }
}

function removeFromFavorites(movieId) {
  let favorites = JSON.parse(localStorage.getItem("favoriteMovies")) || [];

  // Remove the movie from favorites
  favorites = favorites.filter((id) => id !== movieId);
  localStorage.setItem("favoriteMovies", JSON.stringify(favorites));

  // Redirect to movies.html
  window.location.href = "movies.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const favoriteMoviesContainer = document.getElementById("favoritesList");
  const favoriteMovieIds =
    JSON.parse(localStorage.getItem("favoriteMovies")) || [];

  if (favoriteMovieIds.length === 0) {
    favoriteMoviesContainer.innerHTML = "<p>No favorite movies added yet.</p>";
    return;
  }

  let moviesHtml = "";

  for (let movieId of favoriteMovieIds) {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`
    );
    const movie = response.data;

    moviesHtml += `
            <div class="bg-black-800 rounded-lg overflow-hidden shadow-lg p-4 relative">
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                     alt="${movie.title}" class="w-full h-60 object-cover rounded-lg">
                <h2 class="text-lg font-semibold mt-2 text-center">${movie.title}</h2>
                <button onclick="removeFromFavorites(${movie.id})" class="text-red-500 mt-2">Remove</button>
            </div>
        `;
  }

  favoriteMoviesContainer.innerHTML = moviesHtml;
});

function logout() {
  // Remove session-related data
  localStorage.removeItem("session_id");
  localStorage.removeItem("account_id");

  // Redirect to login page
  window.location.href = "index.html"; // Change this to your actual login page
}

// Example: Attach logout to a button
document.getElementById("logout-btn").addEventListener("click", logout);
