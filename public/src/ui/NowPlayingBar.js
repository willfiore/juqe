import React from "react";

import NowPlayingTrackBar from "./NowPlayingTrackBar.js";
import ProgressBar from "./ProgressBar.js";

export default function NowPlayingBar(props) {
    return (
        <header className="nowPlayingBar" >
            <NowPlayingTrackBar
                songTitle={props.nowPlaying.name}
                artistName={props.nowPlaying.artist}
                albumArt={props.nowPlaying.album_art}
            />
            <ProgressBar progress={props.nowPlaying.progress} />
        </header>
    );
}
