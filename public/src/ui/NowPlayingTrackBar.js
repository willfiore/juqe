import React from "react";

export default function NowPlayingTrackBar(props) {
    return (
        <div className="nowPlayingBarContent">
            <img
                className="albumArt"
                src={props.albumArt}
                onLoad={(e) => {
                }}
            />
            <div className="textGroup">
                <div className="songTitle">{props.songTitle}</div>
                <div className="artistName">{props.artistName}</div>
            </div>
        </div>
    );
}
