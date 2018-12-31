import "./sanitize.css";
import "./style.css";

import React from "react";
import ReactDOM from "react-dom";

class NowPlayingBarContent extends React.Component {
    render() {
        return (
            <div className="nowPlayingBarContent">
                <div className="albumArt"></div>
                <div className="textGroup">
                    <div className="songTitle">What's Up Danger (with Black Caviar)</div>
                    <div className="artistName">Blackway, Black Caviar</div>
                </div>
            </div>
        );
    }
}

class ProgressBar extends React.Component {
    render() {
        return (
            <div className="progressBar">
                <div className="inner"></div>
            </div>
        );
    }
}

class NowPlayingBar extends React.Component {
    render() {
        return (
            <div className="nowPlayingBar">
                <NowPlayingBarContent />
                <ProgressBar />
            </div>
        );
    }
}

class QueueCard extends React.Component {
    render() {
        return (
            <div className="queueCard">
                <div className="textGroup">
                    <div className="songTitle">{this.props.song}</div>
                    <div className="artistName">{this.props.artist}</div>
                </div>
                <i class="heartButton fas fa-heart"></i>
            </div>
        );
    }
}

class Queue extends React.Component {
    render() {
        return (
            <>
                <h1 className="queueTitle">Next up:</h1>
                <div className="queueCardContainer">
                    <QueueCard song="Not Over Yet - Perfecto Edit" artist="Grace"/>
                    <QueueCard song="Acceptable in the 80's" artist="Calvin Harris"/>
                    <QueueCard song="Ready For The Floor" artist="Hot Chip"/>
                    <QueueCard song="Cloud 9" artist="Fono, E^ST"/>
                    <div className="queuePadding"></div>
                </div>
            </>
        );
    }
}

class SearchBar extends React.Component {
    render() {
        return(
            <div className="searchBar">
                <i className="icon fas fa-search"></i>
                <input type="text" placeholder="Search songs, artists, or albums"></input>
            </div>
        );
    }
}

function App(props) {
    return (
        <>
        <NowPlayingBar />
        <Queue />
        <SearchBar />
        </>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));