import React from "react";

import NowPlayingBar from "./NowPlayingBar";
import SearchBar from "./SearchBar";
import Queue from "./Queue";

export default function MainPage(props) {
    return (
        <div className="page mainPage">
            <NowPlayingBar nowPlaying={props.nowPlaying} />
            <Queue
                users={props.users}
                myUserID={props.myUserID}
                items={props.queue}
                onPressHeartButton={props.onPressHeartButton}
                onPressRemoveButton={props.onPressRemoveButton}
            />
            <SearchBar active={false} onClick={props.onSearchBarClick} />
        </div>
    );
}
