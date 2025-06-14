/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect,useState } from "react";

const ApiKey = import.meta.env.VITE_GIPHY;

const useFetch = ({ keyword }) => {
  const [gifUrl, setGifUrl] = useState("");

  const fetchGifs = async () => {
    try {
      const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${ApiKey}&q=${keyword.split(" ").join("")}&limit=1`);
      const { data } = await response.json();
      const gifData = data[0]?.images?.downsized_medium?.url;
      setGifUrl(gifData);
    } catch {
      setGifUrl("https://metro.co.uk/wp-content/uploads/2015/05/pokemon_crying.gif?quality=90&strip=all&zoom=1&resize=500%2C284");
    }
  };

  useEffect(() => {
    if (keyword) fetchGifs();
  }, [keyword]);

  return gifUrl;
};

export default useFetch;