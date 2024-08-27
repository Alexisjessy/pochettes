import { CLIENT_ID, CLIENT_SECRET } from "./token.js";

let currentTrackIndex = 0;
let isPlaying = false;
let audioElement = new Audio();

const tracks = [
  {
    artist: "Les tutus du Pentagone",
    title: "Hold Me !",
    src: "/music/music.mp3",
  },
  { artist: "KoKO", title: "Blue_Skies", src: "music/Blue_Skies.mp3" },
  {
    artist: "ToTo",
    title: "Hold_On_a_Minute",
    src: "music/Hold_On_a_Minute.mp3",
  },
  { artist: "UNKNOWN", title: "Titre 4", src: "music/Stay_With_You.mp3" },
  { artist: "Nom Artiste 5", title: "Titre 5", src: "music/Earthy_Crust.mp3" },
  {
    artist: "Nom Artiste 6",
    title: "Titre 6",
    src: "music/Symphony_No_5_by_Beethoven.mp3",
  },
];

function loadTrack(index) {
  let track = tracks[index];
  audioElement.src = track.src;
  document.querySelector(".slider_container_duration h3").textContent =
    track.artist;
  document.querySelector(".slider_container_duration p").textContent =
    track.title;
  audioElement.load();

  /*** Cet événement est déclenché lorsque les métadonnées du fichier audio (comme la durée) sont chargées. Pour eviter NAN */
  audioElement.addEventListener("loadedmetadata", () => {
    document.getElementById("total-time").textContent = formatTime(
      audioElement.duration
    );
  });
}
function playTrack() {
  audioElement.play();
  isPlaying = true;
  document
    .querySelector(".playpause-track i")
    .classList.replace("fa-play-circle", "fa-pause-circle");
}

function pauseTrack() {
  audioElement.pause();
  isPlaying = false;
  document
    .querySelector(".playpause-track i")
    .classList.replace("fa-pause-circle", "fa-play-circle");
}

window.playpauseTrack = function () {
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
};

window.prevTrack = function () {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrackIndex);
  playTrack();
};

window.nextTrack = function () {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  loadTrack(currentTrackIndex);
  playTrack();
};

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrackIndex);
  playTrack();
}

function setVolume() {
  audioElement.volume = document.querySelector(".volume_slider").value / 100;
}

function increaseVolume() {
  if (audioElement.volume < 1) {
    audioElement.volume = Math.min(1, audioElement.volume + 0.1);
    document.querySelector(".volume_slider").value = audioElement.volume * 100;
  }
}

function decreaseVolume() {
  if (audioElement.volume > 0) {
    audioElement.volume = Math.max(0, audioElement.volume - 0.1);
    document.querySelector(".volume_slider").value = audioElement.volume * 100;
  }
}

document.querySelector(".volume-up").addEventListener("click", increaseVolume);
document
  .querySelector(".volume-down")
  .addEventListener("click", decreaseVolume);

function seekTo() {
  let seekSlider = document.querySelector(".seek_slider");
  audioElement.currentTime = audioElement.duration * (seekSlider.value / 100);
}
document.querySelector(".seek_slider").addEventListener("input", seekTo);

audioElement.addEventListener("timeupdate", () => {
  let seekSlider = document.querySelector(".seek_slider");
  seekSlider.value = (audioElement.currentTime / audioElement.duration) * 100;
  document.getElementById("current-time").textContent = formatTime(
    audioElement.currentTime
  );
  document.getElementById("total-time").textContent = formatTime(
    audioElement.duration
  );
});

function formatTime(time) {
  let minutes = Math.floor(time / 60);
  let seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function playTrackByIndex(index) {
  loadTrack(index);
  playTrack();
}

document.querySelectorAll(".album").forEach((album, index) => {
  album.addEventListener("click", () => {
    currentTrackIndex = index;
    playTrackByIndex(currentTrackIndex);
  });
});
audioElement.addEventListener("ended", () => {
  nextTrack();
});
loadTrack(currentTrackIndex);

async function getSpotifyToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

async function searchSpotify(query) {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query
    )}&type=track,artist`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  return data;
}

document
  .querySelector(".search-bar")
  .addEventListener("input", async (event) => {
    const query = event.target.value;
    if (query.length > 2) {
      const results = await searchSpotify(query);
      displaySearchResults(results);
    }
  });

function displaySearchResults(results) {
  const section = document.querySelector("#section");
  section.innerHTML = "";

  results.tracks.items.forEach((track) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    const title = document.createElement("p");
    const artist = document.createElement("p");

    img.src = track.album.images[0].url;
    title.textContent = track.name;
    artist.textContent = track.artists[0].name;

    figure.appendChild(img);
    figure.appendChild(title);
    figure.appendChild(artist);
    section.appendChild(figure);

    figure.addEventListener("click", () => {
      playSpotifyTrack(track);
    });
  });
}

function playSpotifyTrack(track) {
  audioElement.src = track.preview_url;
  document.querySelector(".slider_container_duration h3").textContent =
    track.artists[0].name;
  document.querySelector(".slider_container_duration p").textContent =
    track.name;
  playTrack();
}
