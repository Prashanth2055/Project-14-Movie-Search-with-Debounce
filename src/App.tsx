import { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import "./App.css";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

function App() {
  const [movieName, setMovieName] = useState<string>("");
  const [debounceMovieName, setDebounceMovieName] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useState<Movie[]>(() => {
    const savedFavorites = localStorage.getItem("favorites");

    return savedFavorites ? JSON.parse(savedFavorites) : []
  })
  const [activeTab, setActiveTab] = useState<"Search" | "Favorites">("Search")

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const searchMovies = async (searchTerm: string, pageNumber: number = 1) => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movieName)}&page=${pageNumber}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (pageNumber === 1) {
        setMovies(data.results)
      } else {
        setMovies((prev) => [...prev, ...data.results])
      }

      setPage(pageNumber)
      setTotalPages(data.total_pages)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceMovieName(movieName)
    }, 400);

    return () => {
      clearTimeout(timer)
    }
  }, [movieName])

  const toggleFavorite = (movie: Movie) => {
    setFavorites((prev) => {
      const isFavorite = prev.some(
        (item) => item.id === movie.id
      )
      if (isFavorite) {
        return prev.filter((item) => item.id !== movie.id)
      } else {
        return [...prev, movie]
      }
    })
  }

  const displayedMovies = activeTab === "Search" ? movies : favorites;

  useEffect(() => {
    setPage(1);
    setTotalPages(1);
    setMovies([])

    if (!debounceMovieName.trim()) {
      return;
    }

    searchMovies(debounceMovieName);
  }, [debounceMovieName]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites))
  }, [favorites])

  return (
    <div className="min-h-screen bg-gray-100 p-6 select-none">
      <div className="flex flex-col items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-4xl font-bold">
            Movie Search
          </h1>

          <h3 className="text-2xl font-semibold">
            Search your favourite movies
          </h3>
        </div>

        <div className="mt-8 flex gap-4">
          <input
            className="p-6 border-none shadow-md rounded-full outline-none"
            type="text"
            placeholder="Enter the Movie name"
            value={movieName}
            onChange={(e) => setMovieName(e.target.value)}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {error && (
          <p className="mt-6 text-red-500">{error}</p>
        )}

        <div className="flex gap-4 mt-8">
          {(["Search", "Favorites"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-semibold
        transition-colors cursor-pointer
        ${activeTab === tab
                  ? "bg-purple-500 text-white"
                  : "bg-white text-gray-600"
                }`}
            >
              {tab === "Favorites"
                ? `Favorites (${favorites.length})`
                : tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-10">
          {displayedMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className="bg-white shadow-md rounded-lg overflow-hidden relative"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(movie);
                }}
                className="absolute top-3 right-3 z-20 bg-white
                 rounded-full p-3 shadow-md cursor-pointer"
              >
                {favorites.some((item) => item.id === movie.id) ? (
                  <FaHeart className="text-red-500 text-xl" />
                ) : (
                  <FaRegHeart className="text-gray-600 text-xl" />
                )}
              </button>
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-72 object-cover"
                />
              ) : (
                <div className="h-72 flex items-center justify-center bg-gray-200">
                  No Poster
                </div>
              )}

              <div className="p-4">
                <h2 className="font-bold">{movie.title}</h2>
                <p>{movie.release_date.split("-").reverse().join("-")}</p>
                <p>⭐ {movie.vote_average.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>

        {activeTab === "Search" && movies.length > 0 && page < totalPages && (
          <button
            onClick={() =>
              searchMovies(debounceMovieName, page + 1)
            }
            disabled={loading}
            className="bg-purple-500 text-white px-6 py-3 mt-5 rounded-lg disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        )}



        {selectedMovie && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedMovie(null);
              }
            }}
          >
            <div
              className="relative bg-white rounded-2xl shadow-xl
                 p-4 sm:p-6 w-full max-w-3xl
                 max-h-[90dvh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedMovie(null)}
                className="absolute top-3 right-3 z-10
                   w-10 h-10 rounded-full bg-white shadow-md
                   text-2xl font-bold text-gray-600
                   hover:text-red-500 cursor-pointer"
              >
                ×
              </button>

              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {selectedMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                    alt={selectedMovie.title}
                    className="w-full max-w-56 mx-auto
                       md:w-64 md:max-w-none md:mx-0
                       h-auto object-contain rounded-xl
                       self-start shrink-0"
                  />
                ) : (
                  <div className="w-full max-w-56 mx-auto md:w-64
                          md:max-w-none md:mx-0 shrink-0
                          h-72 bg-gray-200 rounded-xl
                          flex items-center justify-center">
                    No Poster
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2
                    id="movie-title"
                    className="text-xl sm:text-2xl md:text-3xl
                       font-bold mb-3 md:mb-4
                       text-center md:text-left md:pr-8"
                  >
                    {selectedMovie.title}
                  </h2>

                  <p className="text-sm md:text-base text-gray-600
                        mb-3 text-center md:text-left">
                    Release Date:{" "}
                    {selectedMovie.release_date
                      ? selectedMovie.release_date.split("-").reverse().join("-")
                      : "N/A"}
                  </p>

                  <p className="text-base md:text-lg font-semibold
                        mb-4 text-center md:text-left">
                    ⭐ {selectedMovie.vote_average.toFixed(1)} / 10
                  </p>

                  <h3 className="text-lg md:text-xl font-semibold mb-2">
                    Overview
                  </h3>

                  <p className="text-sm md:text-base text-gray-700
                        leading-relaxed">
                    {selectedMovie.overview || "No overview available."}
                  </p>

                  <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(selectedMovie);
                }}
                className="absolute top-3 right-3 z-20 bg-white
                 rounded-full p-3 shadow-md cursor-pointer"
              >
                {favorites.some((item) => item.id === selectedMovie.id) ? (
                  <FaHeart className="text-red-500 text-xl" />
                ) : (
                  <FaRegHeart className="text-gray-600 text-xl" />
                )}
              </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {!loading && !error && movies.length === 0 && activeTab === "Search" && (
          <p className="mt-8 text-gray-500">
            Search for movies to see results.
          </p>
        )}

        {activeTab === "Favorites" && favorites.length === 0 && (
          <p className="mt-8 text-gray-500">
            No Favorites Yet
          </p>
        )}
      </div>
    </div>
  );
}

export default App;