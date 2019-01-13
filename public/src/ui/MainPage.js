import React from "react";

import NowPlayingBar from "./NowPlayingBar";
import SearchBar from "./SearchBar";
import Queue from "./Queue";

export default function MainPage(props) {
    return (
        <div className="mainPage">
            <NowPlayingBar nowPlaying={props.nowPlaying} />
            <Queue items={props.queue}/>
            <SearchBar active={false} onClick={props.onSearchBarClick} />
        </div>
    );
}
